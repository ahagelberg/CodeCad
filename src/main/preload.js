const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // File operations
  saveFile: (filePath, content) => ipcRenderer.invoke('save-file', { filePath, content }),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),
  showSaveDialog: (options) => ipcRenderer.invoke('show-save-dialog', options),
  getUserDocumentsPath: () => ipcRenderer.invoke('get-user-documents-path'),
  
  // Export operations
  exportSTL: (data) => ipcRenderer.invoke('export-stl', data),
  exportSTEP: (data) => ipcRenderer.invoke('export-step', data),
  
  // Menu event listeners
  onMenuNewFile: (callback) => ipcRenderer.on('menu-new-file', callback),
  onMenuOpenFile: (callback) => ipcRenderer.on('menu-open-file', callback),
  onMenuSaveFile: (callback) => ipcRenderer.on('menu-save-file', callback),
  onMenuSaveAsFile: (callback) => ipcRenderer.on('menu-save-as-file', callback),
  onMenuExportSTL: (callback) => ipcRenderer.on('menu-export-stl', callback),
  onMenuExportSTEP: (callback) => ipcRenderer.on('menu-export-step', callback),
  onMenuSwitchLanguage: (callback) => ipcRenderer.on('menu-switch-language', callback),
  onMenuOpenSettings: (callback) => ipcRenderer.on('menu-open-settings', callback),
  
  // Remove listeners
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),
  
  // Configuration APIs
  getConfig: (path) => ipcRenderer.invoke('get-config', path),
  setConfig: (path, value) => ipcRenderer.invoke('set-config', { path, value }),
  saveConfig: () => ipcRenderer.invoke('save-config'),
  resetConfig: () => ipcRenderer.invoke('reset-config'),
  getAllConfig: () => ipcRenderer.invoke('get-all-config')
});
