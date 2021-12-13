const { app, BrowserWindow, dialog, ipcMain, protocol } = require('electron')
const { autoUpdater } = require('electron-updater')
const { join, normalize, parse } = require('path');
const { format } = require('url');
const { readdirSync, existsSync, unlinkSync, createWriteStream, renameSync } = require('fs')
const { promisify } = require('util');
const { writeFile, readFile } = require('fs/promises');
const sizeOf = promisify(require('image-size'))

let folderPath = ''
let files = []
let exportStartTime

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
                        resolve(data)
                    }
                })
                .catch(err => reject(err))
        })
    })

    var fileWriter
    let outPath = ''
    let tempPath = ''
    ipcMain.handle('exportFrame', async (e, data) => {
        if (data.frame === 0) {
            outPath = data.path
            tempPath = join(parse(outPath).dir, 'temp.wbmani')

            console.log("Start Export")
            console.log('Writing File to temp path', tempPath)
            console.log('Saving to', outPath, 'after')

            exportStartTime = Date.now()
            fileWriter = createWriteStream(tempPath)
            fileWriter.write(new Buffer.from(data.data))
        } else if (data.frame === 'end') {
            fileWriter.close()
            fileWriter.on('finish', () => {
                if (existsSync(outPath)) unlinkSync(outPath)
                renameSync(tempPath, outPath)
                console.log('Export Done!', (Date.now() - exportStartTime) / 1000, "Seconds")
            })
        } else if (data.frame === 'cancel') {
            fileWriter.close()
            if (existsSync(tempPath)) unlinkSync(tempPath)
            console.log('Export Canceled!', (Date.now() - exportStartTime) / 1000, "Seconds")
        } else {
            fileWriter.write(new Buffer.from(data.data))
        }
        return 'Got IT'
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

            autoUpdater.checkForUpdates()
            setInterval(() => {
                autoUpdater.checkForUpdates()
            }, 1000 * 60 * 60);
        }
    })



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