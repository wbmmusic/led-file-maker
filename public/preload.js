const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('k', {
    ipcRenderer: ipcRenderer,
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    removeListener: (channel) => ipcRenderer.removeAllListeners(channel)
})