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
  listMdApps: () => ipcRenderer.invoke('mdapps:list'),
  setDefaultMdApp: (path) => ipcRenderer.invoke('mdapps:set-default', path),
  addMdApp: () => ipcRenderer.invoke('mdapps:add'),
  removeMdApp: (path) => ipcRenderer.invoke('mdapps:remove', path),
  getVersion: () => ipcRenderer.invoke('app:version'),
  openLog: () => ipcRenderer.invoke('app:open-log'),
  reportBug: () => ipcRenderer.invoke('app:report-bug'),
  getUpdateState: () => ipcRenderer.invoke('update:state'),
  checkUpdate: () => ipcRenderer.invoke('update:check'),
  installUpdate: () => ipcRenderer.invoke('update:install'),
  onUpdateAvailable: (cb) => ipcRenderer.on('update:available', (_e, info) => cb(info)),
  onUpdateDownloaded: (cb) => ipcRenderer.on('update:downloaded', (_e, info) => cb(info)),
});
