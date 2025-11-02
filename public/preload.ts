import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  chooseFolder: () => ipcRenderer.invoke('chooseFolder'),
  clearImages: () => ipcRenderer.invoke('clearImages'),
  chooseOutput: () => ipcRenderer.invoke('chooseOutput'),
  saveWbmAni: (path: string, data: Buffer) => ipcRenderer.invoke('saveWbmAni', path, data),
  openAniFile: () => ipcRenderer.invoke('openAniFile'),
  export: (config: any) => ipcRenderer.send('export', config),
  cancelExport: () => ipcRenderer.invoke('cancelExport'),
  reactIsReady: () => ipcRenderer.send('reactIsReady'),
  installUpdate: () => ipcRenderer.send('installUpdate'),
  
  // Event listeners
  onAppVersion: (callback: (version: string) => void) => 
    ipcRenderer.on('app_version', (_event, version) => callback(version)),
  onUpdater: (callback: (event: string, data?: any) => void) => 
    ipcRenderer.on('updater', (_event, event, data) => callback(event, data)),
  onProcessedFrame: (callback: (filename: string) => void) => 
    ipcRenderer.on('processedFrame', (_event, filename) => callback(filename)),
  onFinishedExport: (callback: () => void) => 
    ipcRenderer.on('finishedExport', () => callback()),
});