/**
 * LED File Maker - Electron Main Process
 * 
 * This is the main entry point for the Electron application. It handles:
 * - Application lifecycle (startup, window management, quit)
 * - File system operations (loading images, saving/loading .wbmani files)
 * - Image processing (converting image sequences to LED-optimized binary format)
 * - Auto-updates via electron-updater
 * - IPC communication with the renderer process
 * 
 * The application converts image sequences into a custom binary format (.wbmani)
 * optimized for LED matrix displays with configurable pixel ordering and color formats.
 */

import { 
  app, 
  BrowserWindow, 
  dialog, 
  ipcMain, 
  protocol, 
  net,
  IpcMainInvokeEvent,
  IpcMainEvent 
} from 'electron';
import { autoUpdater } from 'electron-updater';
import { join, normalize, parse } from 'path';
import { format } from 'url';
import { 
  readdirSync,
  readFileSync,
  existsSync, 
  unlinkSync, 
  createWriteStream, 
  renameSync,
  WriteStream 
} from 'fs';
import { writeFile, readFile } from 'fs/promises';
import imageSize from 'image-size';
import sharp from 'sharp';
import { ColorFormat, FileInfo, ImageOptions, ExportConfig } from '../src/types/fileFormat';

/**
 * Register custom protocol scheme as privileged
 * This must be done before app.ready() fires
 * Allows the atom:// protocol to load local files securely
 * 
 * CRITICAL: 'standard' privilege is required for the scheme to work
 * with resources loaded from http://localhost dev server
 */
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'atom',
    privileges: {
      standard: true,      // Required: Makes atom:// behave like http:// for URL parsing
      secure: true,        // Treat it like HTTPS
      supportFetchAPI: true, // Allow it to be used with fetch API
      corsEnabled: true,   // Allow cross-origin requests from localhost
      bypassCSP: true,     // Bypass Content Security Policy
      stream: true         // Support streaming responses
    }
  }
]);

// Define the return type for image-size
interface ImageSize {
  width?: number;
  height?: number;
  type?: string;
}

/**
 * Async wrapper for image-size - reads file and gets dimensions
 * @param filePath - Path to the image file
 * @returns Promise resolving to image dimensions
 */
async function sizeOfAsync(filePath: string): Promise<ImageSize> {
  // image-size requires a Buffer, not a file path - read the file first
  const buffer = readFileSync(filePath);
  // @ts-ignore - image-size types are incomplete, but the function works correctly
  const result = imageSize(buffer);
  return Promise.resolve(result as ImageSize);
}

/**
 * Global state for the currently loaded image folder
 * These are maintained across the application lifecycle
 */
let folderPath: string = '';
let files: FileInfo[] = [];

/**
 * Load and validate all images from a directory
 * 
 * This function:
 * 1. Reads all files from the specified directory
 * 2. Attempts to get dimensions for each file (filtering non-images)
 * 3. Validates that all images have the same dimensions and type
 * 4. Returns the validated file list
 * 
 * @param path - Absolute path to the directory containing images
 * @throws Error if images have mismatched dimensions or types
 * @returns Promise<void> - Updates global `files` array on success
 */
const loadFolder = async (path: string): Promise<void> => {
  folderPath = path;
  const fileNames = readdirSync(path);

  return new Promise(async (resolve, reject) => {
    files = [];
    let fileParams: ImageSize[] = [];
    let ignored: string[] = [];

    // Process each file in the directory
    for (let i = 0; i < fileNames.length; i++) {
      const filePath = join(folderPath, fileNames[i]);
      
      try {
        // Attempt to read image dimensions - will throw if not an image
        const info = await sizeOfAsync(filePath);
        
        // Extract just the properties we care about for comparison
        const params = {
          width: info.width,
          height: info.height,
          type: info.type
        };
        
        // Track unique image parameter combinations
        if (!fileParams.find(existing => JSON.stringify(existing) === JSON.stringify(params))) {
          fileParams.push(params);
        }
        
        // Add to our file list with metadata
        files.push({ 
          width: info.width || 0,
          height: info.height || 0,
          type: info.type,
          name: fileNames[i] 
        });
      } catch (error) {
        // File is not a valid image - add to ignored list
        ignored.push(fileNames[i]);
      }
    }

    // Clean up ignored files from the list
    if (ignored.length > 0) {
      ignored.forEach(item => {
        const index = files.findIndex(file => file.name === item);
        if (index !== -1) files.splice(index, 1);
      });
    }

    // Validate that all images have matching parameters
    if (fileParams.length > 1) {
      reject(JSON.stringify({
        msg: 'Folder contains more than one file type and/or more than one resolution',
        data: fileParams
      }));
      return;
    }

    console.log('Image parameters:', fileParams);
    console.log(`Loaded ${files.length} files`);
    console.log('First 3 files:', files.slice(0, 3));
    console.log('Files being sent to renderer:', JSON.stringify(files.slice(0, 2), null, 2));
    resolve();
  });
};

/**
 * Create the main application window
 * 
 * Sets up:
 * - Window dimensions and appearance
 * - Preload script for secure IPC
 * - URL loading (dev server or production build)
 * - IPC handlers for all application functions
 */
const createWindow = (): void => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    icon: join(__dirname, 'favicon.ico'),
    show: false, // Don't show until ready
    webPreferences: {
      preload: join(__dirname, 'preload.js'), // Will be compiled from preload.ts
      sandbox: false // Required for Node.js integration in preload
    },
    autoHideMenuBar: true
  });

  // Load the app URL (development server or production build)
  const startUrl = process.env.ELECTRON_START_URL || format({
    pathname: join(__dirname, '/../build/index.html'),
    protocol: 'file:',
    slashes: true
  });
  win.loadURL(startUrl);

  // Show window once content is loaded to prevent visual flash
  win.on('ready-to-show', () => win.show());

  /**
   * Configure all IPC (Inter-Process Communication) handlers
   * These handle requests from the renderer process
   */
  const configIPC = (): void => {
    /**
     * Handler: chooseFolder
     * Opens a directory picker and loads all images from the selected folder
     * 
     * @returns Array of FileInfo objects or 'canceled' if user cancels
     */
    ipcMain.handle('chooseFolder', async (_e: IpcMainInvokeEvent): Promise<FileInfo[] | string> => {
      return new Promise(async (resolve, reject) => {
        dialog.showOpenDialog(win, { properties: ['openDirectory'] })
          .then(async res => {
            if (res.canceled === true) {
              console.log('Folder selection canceled');
              resolve('canceled');
            } else {
              console.log('Selected folder:', res.filePaths[0]);
              try {
                await loadFolder(res.filePaths[0]);
                resolve(files);
              } catch (error) {
                console.log('Error loading folder:', error);
                reject(error);
              }
            }
          })
          .catch(err => reject(err));
      });
    });

    /**
     * Handler: clearImages
     * Clears the currently loaded image list
     * 
     * @returns Empty array
     */
    ipcMain.handle('clearImages', (): FileInfo[] => {
      folderPath = '';
      files = [];
      return files;
    });

    /**
     * Handler: chooseOutput
     * Opens a save dialog for selecting output file location
     * 
     * @returns File path string or 'canceled' if user cancels
     */
    ipcMain.handle('chooseOutput', async (): Promise<string> => {
      return new Promise(async (resolve, reject) => {
        dialog.showSaveDialog(win, {
          filters: [{
            name: 'WBM Animation',
            extensions: ['wbmani']
          }]
        })
          .then(res => {
            if (res.canceled === true) {
              resolve('canceled');
            } else {
              resolve(res.filePath || '');
            }
          })
          .catch(err => reject(err));
      });
    });

    /**
     * Handler: saveWbmAni
     * Saves data to a .wbmani file
     * 
     * @param path - Output file path
     * @param data - Binary data to write
     * @returns 'saved' on success
     */
    ipcMain.handle('saveWbmAni', async (_e: IpcMainInvokeEvent, path: string, data: Buffer): Promise<string> => {
      return new Promise(async (resolve) => {
        await writeFile(path, data);
        resolve('saved');
      });
    });

    /**
     * Handler: openAniFile
     * Opens a file picker and loads a .wbmani animation file
     * 
     * @returns Object with file data and name, or 'canceled' if user cancels
     */
    ipcMain.handle('openAniFile', async (): Promise<{ data: Buffer; name: string } | string> => {
      return new Promise(async (resolve, reject) => {
        dialog.showOpenDialog(win, {
          filters: [{
            name: 'WBM Animation',
            extensions: ['wbmani']
          }]
        })
          .then(async res => {
            if (res.canceled === true) {
              resolve('canceled');
            } else {
              const data = await readFile(res.filePaths[0]);
              resolve({
                data,
                name: parse(res.filePaths[0]).base
              });
            }
          })
          .catch(err => reject(err));
      });
    });

    /**
     * Listener: reactIsReady
     * Triggered when the React app has finished initializing
     * Sets up auto-updater and sends app version to renderer
     */
    ipcMain.on('reactIsReady', () => {
      console.log('React is ready');
      win.webContents.send('app_version', app.getVersion());

      // Only check for updates in packaged app (not in development)
      if (app.isPackaged) {
        // Configure auto-updater event handlers
        autoUpdater.on('error', (err: Error) => 
          win.webContents.send('updater', 'error', err));
        autoUpdater.on('checking-for-update', () => 
          win.webContents.send('updater', 'checking-for-update'));
        autoUpdater.on('update-available', (info: any) => 
          win.webContents.send('updater', 'update-available', info));
        autoUpdater.on('update-not-available', (info: any) => 
          win.webContents.send('updater', 'update-not-available', info));
        autoUpdater.on('download-progress', (info: any) => 
          win.webContents.send('updater', 'download-progress', info));
        autoUpdater.on('update-downloaded', (info: any) => 
          win.webContents.send('updater', 'update-downloaded', info));

        // Handler for installing downloaded updates
        ipcMain.on('installUpdate', () => autoUpdater.quitAndInstall());

        // Check for updates immediately and then every hour
        autoUpdater.checkForUpdates();
        setInterval(() => {
          autoUpdater.checkForUpdates();
        }, 1000 * 60 * 60);
      }
    });

    /**
     * Convert a number to two bytes (big-endian 16-bit)
     * Used for encoding frame count and dimensions in the file header
     * 
     * @param number - Number to convert (0-65535)
     * @returns Array of [highByte, lowByte]
     */
    const makeTwoBytesFromNumber = (number: number): [number, number] => {
      const highByte = (number >> 8) & 0xFF;
      const lowByte = number & 0xFF;
      return [highByte, lowByte];
    };

    /**
     * Listener: export
     * Main export handler - converts image sequence to .wbmani binary format
     * 
     * This is the core functionality of the application:
     * 1. Creates a temporary file for writing
     * 2. Writes file header (frame count, dimensions, color format)
     * 3. Processes each image:
     *    - Loads image with Sharp
     *    - Extracts raw RGB pixel data
     *    - Reorders pixels based on LED matrix configuration
     *    - Reorders color channels based on format
     *    - Writes to file
     * 4. Renames temp file to final destination
     * 
     * The pixel reordering is critical for LED matrices, which may have
     * different starting corners and snake patterns.
     */
    ipcMain.on('export', async (_e: IpcMainEvent, exportConfig: ExportConfig) => {
      let canceled = false;
      const outPath = exportConfig.path;
      const tempPath = join(parse(outPath).dir, 'temp.wbmani');
      const options = exportConfig.imageOptions;
      const format = exportConfig.format;

      console.log('=== Export Started ===');
      console.log('Output path:', outPath);
      console.log('Temp path:', tempPath);
      console.log('Options:', options);
      console.log('Format:', format);

      const exportStartTime = Date.now();
      const fileWriter: WriteStream = createWriteStream(tempPath);

      /**
       * Convert color format string to array of ASCII character codes
       * Used in the file header to specify color channel order
       */
      const makeFormatBytes = (): [number, number, number] => [
        format.charCodeAt(0),
        format.charCodeAt(1),
        format.charCodeAt(2)
      ];

      fileWriter.on('ready', async () => {
        console.log('File writer ready');

        // Write file header (9 bytes total)
        const headers: number[] = [
          ...makeTwoBytesFromNumber(files.length),    // Bytes 0-1: Frame count
          ...makeTwoBytesFromNumber(files[0].width),  // Bytes 2-3: Width
          ...makeTwoBytesFromNumber(files[0].height), // Bytes 4-5: Height
          ...makeFormatBytes()                         // Bytes 6-8: Format (e.g., 'rgb')
        ];
        fileWriter.write(Buffer.from(headers));

        /**
         * Factory function to create color channel reordering function
         * Different LED strips expect different color orders (RGB, BGR, etc.)
         * 
         * @returns Function that reorders R, G, B values according to format
         */
        let getRGB: (a: number, b: number, c: number) => [number, number, number];

        switch (format) {
          case 'rgb':
            getRGB = (r, g, b) => [r, g, b];
            break;
          case 'rbg':
            getRGB = (r, b, g) => [r, g, b];
            break;
          case 'bgr':
            getRGB = (b, g, r) => [r, g, b];
            break;
          case 'brg':
            getRGB = (b, r, g) => [r, g, b];
            break;
          case 'grb':
            getRGB = (g, r, b) => [r, g, b];
            break;
          case 'gbr':
            getRGB = (g, b, r) => [r, g, b];
            break;
          default:
            getRGB = (r, g, b) => [r, g, b];
            break;
        }

        // Process each frame/image
        for (let i = 0; i < files.length; i++) {
          if (canceled) break;

          let output: number[] = [];
          
          try {
            // Load image and extract raw pixel data using Sharp
            const { data, info } = await sharp(join(folderPath, files[i].name))
              .raw()
              .toBuffer({ resolveWithObject: true });
            
            // Notify renderer of progress
            win.webContents.send('processedFrame', files[i].name);
            
            // Extract individual pixels from raw data
            const pixels: [number, number, number][] = [];
            
            // Each pixel consists of info.channels bytes (typically 3 for RGB, 4 for RGBA)
            for (let pixelNumber = 0; pixelNumber < (info.height * info.width); pixelNumber++) {
              const pointer = pixelNumber * info.channels;
              const thisPixel = getRGB(
                data[pointer + 0], // R
                data[pointer + 1], // G
                data[pointer + 2]  // B
              );
              pixels.push(thisPixel);
            }

            /**
             * Pixel Reordering Logic
             * 
             * LED matrices can have various physical layouts:
             * - Start corner: where the data line begins (topLeft, topRight, bottomLeft, bottomRight)
             * - Pixel order: how pixels are connected (horizontal, vertical, or alternating/snake patterns)
             * 
             * This section reorders the pixels from the standard image format (top-left, horizontal)
             * to match the LED matrix configuration.
             */

            if (options.startCorner === 'topLeft') {
              // Standard reading order: top-left corner
              
              if (options.pixelOrder === 'horizontal') {
                // Simple left-to-right, top-to-bottom
                pixels.forEach(px => output.push(...px));
                
              } else if (options.pixelOrder === 'vertical') {
                // Column by column, top to bottom
                for (let col = 0; col < info.width; col++) {
                  for (let row = 0; row < info.height; row++) {
                    output.push(...pixels[row * info.width + col]);
                  }
                }
                
              } else if (options.pixelOrder === 'horizontalAlternate') {
                // Snake pattern: odd rows go right-to-left, even rows go left-to-right
                for (let row = 0; row < info.height; row++) {
                  if (row & 0x01) { // Odd row - reverse direction
                    for (let col = info.width - 1; col >= 0; col--) {
                      output.push(...pixels[row * info.width + col]);
                    }
                  } else { // Even row - normal direction
                    for (let col = 0; col < info.width; col++) {
                      output.push(...pixels[row * info.width + col]);
                    }
                  }
                }
              } else {
                throw new Error(`Unsupported pixel order '${options.pixelOrder}' for startCorner 'topLeft'`);
              }

            } else if (options.startCorner === 'topRight') {
              // Starting from top-right corner
              
              if (options.pixelOrder === 'horizontal') {
                // Right-to-left, top-to-bottom
                for (let row = 0; row < info.height; row++) {
                  for (let col = info.width - 1; col >= 0; col--) {
                    output.push(...pixels[row * info.width + col]);
                  }
                }
                
              } else if (options.pixelOrder === 'horizontalAlternate') {
                // Snake pattern starting from right
                for (let row = 0; row < info.height; row++) {
                  if (row & 0x01) {
                    for (let col = info.width - 1; col >= 0; col--) {
                      output.push(...pixels[row * info.width + col]);
                    }
                  } else {
                    for (let col = 0; col < info.width; col++) {
                      output.push(...pixels[row * info.width + col]);
                    }
                  }
                }
              } else {
                throw new Error(`Unsupported pixel order '${options.pixelOrder}' for startCorner 'topRight'`);
              }

            } else if (options.startCorner === 'bottomLeft') {
              // Starting from bottom-left corner
              
              if (options.pixelOrder === 'horizontal') {
                // Left-to-right, bottom-to-top
                for (let row = info.height - 1; row >= 0; row--) {
                  for (let col = 0; col < info.width; col++) {
                    output.push(...pixels[row * info.width + col]);
                  }
                }
                
              } else if (options.pixelOrder === 'verticalAlternate') {
                // Snake pattern: odd columns go top-to-bottom, even go bottom-to-top
                for (let col = 0; col < info.width; col++) {
                  if (col & 0x01) {
                    for (let row = 0; row < info.height; row++) {
                      output.push(...pixels[row * info.width + col]);
                    }
                  } else {
                    for (let row = info.height - 1; row >= 0; row--) {
                      output.push(...pixels[row * info.width + col]);
                    }
                  }
                }
              } else {
                throw new Error(`Unsupported pixel order '${options.pixelOrder}' for startCorner 'bottomLeft'`);
              }

            } else if (options.startCorner === 'bottomRight') {
              // Starting from bottom-right corner
              
              if (options.pixelOrder === 'vertical') {
                // Column by column, bottom-to-top, right-to-left
                for (let col = info.width - 1; col >= 0; col--) {
                  for (let row = info.height - 1; row >= 0; row--) {
                    output.push(...pixels[row * info.width + col]);
                  }
                }
                
              } else if (options.pixelOrder === 'verticalAlternate') {
                // Snake pattern starting from bottom-right
                for (let col = info.width - 1; col >= 0; col--) {
                  if (col & 0x01) {
                    for (let row = 0; row < info.height; row++) {
                      output.push(...pixels[row * info.width + col]);
                    }
                  } else {
                    for (let row = info.height - 1; row >= 0; row--) {
                      output.push(...pixels[row * info.width + col]);
                    }
                  }
                }
              } else {
                throw new Error(`Unsupported pixel order '${options.pixelOrder}' for startCorner 'bottomRight'`);
              }

            } else {
              throw new Error(`Unsupported start corner: ${options.startCorner}`);
            }

            // Write processed frame data to file
            fileWriter.write(Buffer.from(output));
            
          } catch (error) {
            console.error('Error processing frame:', error);
            fileWriter.close();
            throw error;
          }
        }

        // Finalize export
        if (!canceled) {
          fileWriter.close();
          fileWriter.on('finish', () => {
            // Replace existing file if it exists
            if (existsSync(outPath)) unlinkSync(outPath);
            renameSync(tempPath, outPath);
            
            win.webContents.send('finishedExport');
            console.log(`Export completed in ${(Date.now() - exportStartTime) / 1000} seconds`);
          });
        } else {
          // Clean up temp file if export was canceled
          fileWriter.close();
          fileWriter.on('close', () => {
            console.log('Export canceled - cleaning up temp file');
            if (existsSync(tempPath)) unlinkSync(tempPath);
          });
        }
        
        ipcMain.removeHandler('cancelExport');
      });

      fileWriter.on('error', (err: Error) => {
        console.error('File writer error:', err);
        ipcMain.removeHandler('cancelExport');
      });

      /**
       * Handler: cancelExport
       * Allows user to cancel an in-progress export operation
       */
      ipcMain.handle('cancelExport', (): string => {
        canceled = true;
        console.log('Export cancel requested');
        return 'canceled';
      });
    });
  };

  configIPC();
};

/**
 * Application lifecycle: whenReady
 * Called when Electron has finished initialization
 */
app.whenReady().then(async () => {
  console.log('[App] App is ready, registering protocol...');
  
  try {
    /**
     * Register custom protocol 'atom://' for accessing local image files
     * This allows the renderer to display images from the selected folder
     * without security restrictions
     */
    protocol.handle('atom', async (request) => {
      try {
        console.log(`[Protocol Handler] ========== REQUEST RECEIVED ==========`);
        console.log(`[Protocol Handler] Request URL: ${request.url}`);
        console.log(`[Protocol Handler] Current folderPath: ${folderPath}`);
        
        // Remove 'atom://' prefix (7 characters)
        const url = decodeURIComponent(request.url.slice(7));
        const fullPath = normalize(join(folderPath, url));
        
        console.log(`[Protocol Handler] Decoded filename: ${url}`);
        console.log(`[Protocol Handler] Full path: ${fullPath}`);
        console.log(`[Protocol Handler] File exists: ${existsSync(fullPath)}`);
        
        if (!existsSync(fullPath)) {
          console.error(`[Protocol Handler] ERROR: File not found: ${fullPath}`);
          return new Response('File not found', { status: 404 });
        }
        
        // Determine content type from file extension
        const ext = parse(fullPath).ext.toLowerCase();
        const contentTypeMap: { [key: string]: string } = {
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.gif': 'image/gif',
          '.bmp': 'image/bmp',
          '.webp': 'image/webp'
        };
        const contentType = contentTypeMap[ext] || 'application/octet-stream';
        
        console.log(`[Protocol Handler] Content-Type: ${contentType}`);
        console.log(`[Protocol Handler] Reading file...`);
        
        // Read and return the file
        const fileData = readFileSync(fullPath);
        console.log(`[Protocol Handler] File size: ${fileData.length} bytes`);
        console.log(`[Protocol Handler] SUCCESS - Returning file`);
        
        return new Response(fileData, {
          status: 200,
          headers: { 'content-type': contentType }
        });
      } catch (error) {
        console.error(`[Protocol Handler] EXCEPTION:`, error);
        return new Response('Internal server error', { status: 500 });
      }
    });

    console.log('[App] Protocol handler registered successfully for atom://');
  } catch (error) {
    console.error('[App] Failed to register protocol handler:', error);
  }

  createWindow();
});

/**
 * Application lifecycle: window-all-closed
 * Quit the app when all windows are closed (except on macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
