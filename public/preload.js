const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('k', {
    ipcRenderer: ipcRenderer,
    send: (channel, args) => ipcRenderer.send(channel, ...args),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    removeListener: (channel) => ipcRenderer.removeAllListeners(channel)
})