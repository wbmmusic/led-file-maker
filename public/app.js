const { app, BrowserWindow, dialog, ipcMain, protocol } = require('electron')
const { autoUpdater } = require('electron-updater')
const { join, normalize, parse } = require('path');
const { format } = require('url');
const { readdirSync, existsSync, unlinkSync, createWriteStream, renameSync } = require('fs')
const { promisify } = require('util');
const { writeFile, readFile } = require('fs/promises');
const sizeOf = promisify(require('image-size'))
const Jimp = require('jimp-native')

let folderPath = ''
let files = []

const loadFolder = async (path) => {
    folderPath = path
    const fileNames = readdirSync(path)

    return new Promise(async (resolve, reject) => {
        files = []
        let fileParams = []
        let ignored = []

        for (let i = 0; i < fileNames.length; i++) {
            const filePath = join(folderPath, fileNames[i])
            //console.log(filePath)
            try {
                const info = await sizeOf(filePath)
                //console.log(info)
                if (!fileParams.find(type => JSON.stringify(type) === JSON.stringify(info))) fileParams.push(info)
                files.push({ ...info, name: fileNames[i] })
            } catch (error) {
                ignored.push(fileNames[i])
            }
        }

        if (ignored.length > 0) {
            ignored.forEach(item => files.splice(files.findIndex(name => name === item), 1))
        }

        if (fileParams.length > 1) reject(JSON.stringify({
            msg: 'Folder contains more than one file type and/or more than one resolution',
            data: fileParams
        }))

        console.log(fileParams)

        console.log(`Loaded ${files.length} files`)
        resolve()
    })
}

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        icon: __dirname + '/favicon.ico',
        webPreferences: {
            preload: join(__dirname, 'preload.js')
        },
        autoHideMenuBar: true
    })

    const startUrl = process.env.ELECTRON_START_URL || format({
        pathname: join(__dirname, '/../build/index.html'),
        protocol: 'file:',
        slashes: true
    });
    win.loadURL(startUrl);

    const configIPC = () => {
        ipcMain.handle('chooseFolder', async (e) => {
            return new Promise(async (resolve, reject) => {
                dialog.showOpenDialog(win, { properties: ['openDirectory'] })
                    .then(async res => {
                        if (res.canceled === true) {
                            console.log('Canceled')
                            resolve('canceled')
                        } else {
                            console.log("Selected", res.filePaths[0])
                            try {
                                await loadFolder(res.filePaths[0])
                                resolve(files)
                            } catch (error) {
                                console.log(error)
                                reject(error)
                            }

                        }
                    })
                    .catch(err => reject(err))
            })
        })

        ipcMain.handle('clearImages', () => {
            folderPath = ''
            files = []
            return files
        })

        ipcMain.handle('chooseOutput', async () => {
            return new Promise(async (resolve, reject) => {
                dialog.showSaveDialog(
                    win,
                    {
                        filters: [
                            {
                                name: 'WBM Animation',
                                extensions: ['wbmani']
                            }
                        ]
                    }
                )
                    .then(res => {
                        if (res.canceled === true) {
                            //console.log(res)
                            resolve('canceled')
                        } else {
                            //console.log(res)
                            resolve(res.filePath)
                        }

                    })
                    .catch(err => reject(err))

            })
        })

        ipcMain.handle('saveWbmAni', async (e, path, data) => {
            //console.log(data)
            return new Promise(async (resolve, reject) => {
                await writeFile(path, data)
                resolve('saved')
            })
        })

        ipcMain.handle('openAniFile', async () => {
            return new Promise(async (resolve, reject) => {
                dialog.showOpenDialog(win, {
                    filters: [
                        {
                            name: 'WBM Animation',
                            extensions: ['wbmani']
                        }
                    ]
                })
                    .then(async res => {
                        if (res.canceled === true) resolve('canceled')
                        else {
                            const data = await readFile(res.filePaths[0])
                            //console.log(data)
                            resolve({
                                data,
                                name: parse(res.filePaths[0]).base
                            })
                        }
                    })
                    .catch(err => reject(err))
            })
        })

        ipcMain.on('reactIsReady', () => {
            console.log('React is ready')
            win.webContents.send('app_version', app.getVersion());

            if (app.isPackaged) {
                autoUpdater.on('error', (err) => win.webContents.send('updater', err))
                autoUpdater.on('checking-for-update', () => win.webContents.send('updater', "checking-for-update"))
                autoUpdater.on('update-available', (info) => win.webContents.send('updater', 'update-available', info))
                autoUpdater.on('update-not-available', (info) => win.webContents.send('updater', 'update-not-available', info))
                autoUpdater.on('download-progress', (info) => win.webContents.send('updater', 'download-progress', info))
                autoUpdater.on('update-downloaded', (info) => win.webContents.send('updater', 'update-downloaded', info))

                ipcMain.on('installUpdate', () => autoUpdater.quitAndInstall())

                autoUpdater.checkForUpdates()
                setInterval(() => {
                    autoUpdater.checkForUpdates()
                }, 1000 * 60 * 60);
            }
        })

        const makeTwoBytesFromNumber = (number) => {
            const highByte = (number >> 8) & 0xFF
            const lowByte = number & 0xFF
            return [highByte, lowByte]
        }

        ipcMain.on('export', async (e, data) => {
            let canceled = false
            const outPath = data.path
            const tempPath = join(parse(outPath).dir, 'temp.wbmani')

            console.log("Start Export")
            console.log('Writing File to temp path', tempPath)
            console.log('Saving to', outPath, 'after')

            let exportStartTime = Date.now()
            let fileWriter = createWriteStream(tempPath)

            const makeFormatBytes = () => [data.format.charCodeAt(0), data.format.charCodeAt(1), data.format.charCodeAt(2)]

            fileWriter.on('ready', async () => {
                console.log('File writer ready')

                let headers = [
                    ...makeTwoBytesFromNumber(files.length),
                    ...makeTwoBytesFromNumber(files[0].width),
                    ...makeTwoBytesFromNumber(files[0].height),
                    ...makeFormatBytes()
                ]
                fileWriter.write(new Buffer.from(headers))

                let getRGB

                switch (data.format) {
                    case 'rgb':
                        getRGB = (r, g, b) => [r, g, b]
                        break;

                    case 'rbg':
                        getRGB = (r, b, g) => [r, g, b]
                        break;

                    case 'bgr':
                        getRGB = (b, g, r) => [r, g, b]
                        break;

                    case 'brg':
                        getRGB = (b, r, g) => [r, g, b]
                        break;

                    case 'grb':
                        getRGB = (g, r, b) => [r, g, b]
                        break;

                    case 'gbr':
                        getRGB = (g, b, r) => [r, g, b]
                        break;

                    default:
                        getRGB = (r, g, b) => [r, g, b]
                        break;
                }

                for (let i = 0; i < files.length; i++) {
                    if (canceled === false) {
                        let output = []
                        try {
                            const image = await Jimp.read(join(folderPath, files[i].name));
                            // SEND TO FRONTEND HERE
                            win.webContents.send('processedFrame', files[i].name)
                            image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
                                // x, y is the position of this pixel on the image
                                // idx is the position start position of this rgba tuple in the bitmap Buffer
                                // this is the image
                                output.push(...getRGB(this.bitmap.data[idx + 0], this.bitmap.data[idx + 1], this.bitmap.data[idx + 2]))

                            })
                            fileWriter.write(new Buffer.from(output))
                        } catch (error) {
                            console.log(error)
                            fileWriter.close()
                            throw new Error(error)
                        }
                    } else { break; }
                }

                if (canceled === false) {
                    fileWriter.close()
                    fileWriter.on('finish', () => {
                        if (existsSync(outPath)) unlinkSync(outPath)
                        renameSync(tempPath, outPath)
                        win.webContents.send('finishedExport')
                        console.log('Export Done!', (Date.now() - exportStartTime) / 1000, "Seconds")
                    })
                } else {
                    fileWriter.close()
                    fileWriter.on('close', () => {
                        console.log("Post Cancel Cleanup")
                        unlinkSync(tempPath)
                    })
                }
                ipcMain.removeHandler('cancelExport')
            })

            fileWriter.on('error', (err) => {
                console.log(err)
                ipcMain.removeHandler('cancelExport')
            })

            ipcMain.handle('cancelExport', () => {
                canceled = true
                console.log("Cancel Press")
                return 'canceled'
            })

        })
    }

    configIPC()
}

app.whenReady().then(() => {
    createWindow()

    protocol.registerFileProtocol('atom', (request, callback) => {
        const url = request.url.substr(7)
        callback({ path: normalize(`${folderPath}/${url}`) })
    })

})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
}) 