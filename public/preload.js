const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('k', {
    invoke: (a, b) => ipcRenderer.invoke(a, b),
    send: (channel, args) => ipcRenderer.send(channel, args),
    receive: (channel, func) => ipcRenderer.on(channel, (event, ...args) => func(...args)),
    removeListener: (channel) => ipcRenderer.removeAllListeners(channel)
})