const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  getConfigStatus: () => ipcRenderer.invoke('config:status'),
  setConfig: (data) => ipcRenderer.invoke('config:set', data),
  isElectron: true,
  platform: process.platform,
})
