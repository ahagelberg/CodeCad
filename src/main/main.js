const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { getConfigManager } = require('../shared/config-manager.js');

// Application constants
const APP_NAME = 'Code CAD';
const APP_VERSION = '1.0.0';

// Keep a global reference of the window object
let mainWindow;
let configManager;

function createWindow() {
  // Initialize configuration
  configManager = getConfigManager();
  
  // Get window configuration
  const windowConfig = configManager.getWindowConfig();
  const securityConfig = configManager.getSecurityConfig();
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: windowConfig.width,
    height: windowConfig.height,
    minWidth: windowConfig.minWidth,
    minHeight: windowConfig.minHeight,
    title: windowConfig.title,
    center: windowConfig.center,
    resizable: windowConfig.resizable,
    maximizable: windowConfig.maximizable,
    minimizable: windowConfig.minimizable,
    closable: windowConfig.closable,
    webPreferences: {
      nodeIntegration: securityConfig.nodeIntegration,
      contextIsolation: securityConfig.contextIsolation,
      enableRemoteModule: securityConfig.enableRemoteModule,
      allowRunningInsecureContent: securityConfig.allowRunningInsecureContent,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '../../resources/icons/icon.png'),
    titleBarStyle: 'default',
    show: windowConfig.showOnReady ? false : true // Don't show until ready
  });

  // Load the app
  const devConfig = configManager.getDevelopmentConfig();
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadFile('dist/index.html');
    if (devConfig.devTools) {
      mainWindow.webContents.openDevTools();
    }
  } else {
    mainWindow.loadFile('dist/index.html');
  }

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-file');
          }
        },
        {
          label: 'Open',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              filters: [
                { name: 'CAD Scripts', extensions: ['js', 'ts', 'scad', 'cad'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              const content = fs.readFileSync(filePath, 'utf8');
              mainWindow.webContents.send('menu-open-file', { filePath, content });
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-file');
          }
        },
        {
          label: 'Save As',
          accelerator: 'CmdOrCtrl+Shift+S',
          click: async () => {
            const result = await dialog.showSaveDialog(mainWindow, {
              filters: [
                { name: 'CAD Scripts', extensions: ['js', 'ts', 'scad', 'cad'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled) {
              mainWindow.webContents.send('menu-save-as-file', result.filePath);
            }
          }
        },
        { type: 'separator' },
        {
          label: 'Export STL',
          click: () => {
            mainWindow.webContents.send('menu-export-stl');
          }
        },
        {
          label: 'Export STEP',
          click: () => {
            mainWindow.webContents.send('menu-export-step');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Language',
      submenu: [
        {
          label: 'JavaScript',
          type: 'radio',
          checked: true,
          click: () => {
            mainWindow.webContents.send('menu-switch-language', 'javascript');
          }
        },
        {
          label: 'TypeScript',
          type: 'radio',
          click: () => {
            mainWindow.webContents.send('menu-switch-language', 'typescript');
          }
        },
        {
          label: 'OpenSCAD',
          type: 'radio',
          click: () => {
            mainWindow.webContents.send('menu-switch-language', 'openscad');
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Settings',
      submenu: [
        {
          label: 'Preferences',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow.webContents.send('menu-open-settings');
          }
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About Code CAD',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About Code CAD',
              message: 'Code CAD v1.0.0',
              detail: 'A cross-platform CAD application with modular scripting language support'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Disable hardware acceleration if GPU issues occur (must be before app.whenReady)
if (process.argv.includes('--disable-gpu')) {
  app.disableHardwareAcceleration();
}

// App event handlers
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// IPC handlers for file operations
ipcMain.handle('save-file', async (event, { filePath, content }) => {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return { success: true, content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-stl', async (event, { filePath, meshData }) => {
  try {
    // TODO: Implement STL export
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-step', async (event, { filePath, geometryData }) => {
  try {
    // TODO: Implement STEP export
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Configuration IPC handlers
ipcMain.handle('get-config', async (event, path) => {
  try {
    return { success: true, value: configManager.get(path) };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('set-config', async (event, { path, value }) => {
  try {
    configManager.set(path, value);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-config', async (event) => {
  try {
    const success = configManager.save();
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reset-config', async (event) => {
  try {
    const success = configManager.reset();
    return { success };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-all-config', async (event) => {
  try {
    return { success: true, config: configManager.get() };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
