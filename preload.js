const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  listVaults: () => ipcRenderer.invoke('vaults:list'),
  setVaultEnabled: (path, enabled) =>
    ipcRenderer.invoke('vaults:set-enabled', path, enabled),
  search: (query) => ipcRenderer.invoke('search:query', query),
  readFile: (path) => ipcRenderer.invoke('file:read', path),
  openFile: (path) => ipcRenderer.invoke('file:open', path),
  hide: () => ipcRenderer.send('window:hide'),
  resize: (height) => ipcRenderer.send('window:resize', height),
  onShown: (cb) => ipcRenderer.on('window:shown', cb),
  openExternal: (url) => ipcRenderer.send('shell:openExternal', url),
  getStartup: () => ipcRenderer.invoke('startup:get'),
  setStartup: (enabled) => ipcRenderer.invoke('startup:set', enabled),
});
