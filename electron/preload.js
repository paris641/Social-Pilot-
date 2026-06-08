const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },
  notification: {
    send: (options) => ipcRenderer.invoke('notification:send', options),
  },
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
  },
  app: {
    getPath: (name) => ipcRenderer.invoke('app:getPath', name),
  },
});
