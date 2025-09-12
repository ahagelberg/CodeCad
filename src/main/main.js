const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { getConfigManager } = require('../shared/config-manager.js');
const { VERSION_INFO } = require('../shared/version.js');

// Script header utilities for main process
function stripScriptHeader(content) {
    // Remove the script header if it exists
    const headerPattern = /^\/\*\s*\{[\s\S]*?\}\s*\*\/\s*\n/;
    return content.replace(headerPattern, '');
}

// Application constants
const APP_NAME = VERSION_INFO.name;
const APP_VERSION = VERSION_INFO.version;

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
  const windowTitle = `${APP_NAME} v${APP_VERSION}`;
  console.log('Setting window title to:', windowTitle);
  
  mainWindow = new BrowserWindow({
    width: windowConfig.width,
    height: windowConfig.height,
    minWidth: windowConfig.minWidth,
    minHeight: windowConfig.minHeight,
    title: windowTitle,
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
            // Get last used directory from renderer
            let defaultPath = path.join(require('os').homedir(), 'Documents');
            try {
              const lastDirResult = await mainWindow.webContents.executeJavaScript('localStorage.getItem("code-cad-last-directory")');
              if (lastDirResult && fs.existsSync(lastDirResult)) {
                defaultPath = lastDirResult;
              }
            } catch (error) {
              // Ignore error, use default
            }
            
            const result = await dialog.showOpenDialog(mainWindow, {
              properties: ['openFile'],
              defaultPath: defaultPath,
              filters: [
                { name: 'CodeCAD Scripts', extensions: ['codecad'] },
                { name: 'OpenSCAD Scripts', extensions: ['scad'] },
                { name: 'All Files', extensions: ['*'] }
              ]
            });
            
            if (!result.canceled && result.filePaths.length > 0) {
              const filePath = result.filePaths[0];
              const content = fs.readFileSync(filePath, 'utf8');
              // Strip script header when opening files
              const contentWithoutHeader = stripScriptHeader(content);
              mainWindow.webContents.send('menu-open-file', { filePath, content: contentWithoutHeader });
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
          click: () => {
            // Send message to renderer to handle save dialog
            mainWindow.webContents.send('menu-save-as');
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

// Check GPU acceleration settings (must be before app.whenReady)
async function checkGPUAcceleration() {
  try {
    const configManager = getConfigManager();
    const config = await configManager.get();
    const enableGPU = config.performance?.enableGPUAcceleration ?? false;
    
    // Disable GPU acceleration if not enabled in config or if --disable-gpu flag is present
    if (!enableGPU || process.argv.includes('--disable-gpu')) {
      app.disableHardwareAcceleration();
      console.log('GPU acceleration disabled');
    } else {
      console.log('GPU acceleration enabled');
    }
  } catch (error) {
    console.error('Failed to load GPU acceleration config:', error);
    // Default to disabled for safety
    app.disableHardwareAcceleration();
  }
}

// Check GPU settings before app is ready
checkGPUAcceleration();

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
    // Strip script header when reading files
    const contentWithoutHeader = stripScriptHeader(content);
    return { success: true, content: contentWithoutHeader };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('show-open-dialog', async (event, options = {}) => {
  try {
    // Set filters based on current language
    let filters;
    if (options.currentLanguage === 'openscad') {
      filters = [
        { name: 'OpenSCAD Scripts', extensions: ['scad'] },
        { name: 'All Files', extensions: ['*'] }
      ];
    } else {
      filters = [
        { name: 'CodeCAD Scripts', extensions: ['codecad'] },
        { name: 'All Files', extensions: ['*'] }
      ];
    }
    
    const defaultOptions = {
      properties: ['openFile'],
      filters: filters
    };
    
    // Get last used directory from localStorage if available
    let defaultPath = null;
    try {
      const lastDir = options.lastUsedDirectory;
      if (lastDir && fs.existsSync(lastDir)) {
        defaultPath = lastDir;
      }
    } catch (error) {
      // Ignore error, use default
    }
    
    // If no valid last directory, use Documents folder
    if (!defaultPath) {
      defaultPath = path.join(require('os').homedir(), 'Documents');
    }
    
    const dialogOptions = { 
      ...defaultOptions, 
      ...options,
      defaultPath: defaultPath
    };
    
    const result = await dialog.showOpenDialog(mainWindow, dialogOptions);
    
    if (!result.canceled && result.filePaths.length > 0) {
      const filePath = result.filePaths[0];
      const selectedDir = path.dirname(filePath);
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        // Strip script header when reading files
        const contentWithoutHeader = stripScriptHeader(content);
        return { 
          success: true, 
          filePath: filePath,
          content: contentWithoutHeader,
          directory: selectedDir
        };
      } catch (error) {
        return { success: false, error: error.message };
      }
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-current-language', async (event) => {
  try {
    const language = await mainWindow.webContents.executeJavaScript('window.app ? window.app.currentLanguage : "javascript"');
    return { success: true, language: language };
  } catch (error) {
    return { success: false, error: error.message, language: 'javascript' };
  }
});

ipcMain.handle('show-save-dialog', async (event, options = {}) => {
  try {
    // Set filters based on current language
    let filters;
    if (options.currentLanguage === 'openscad') {
      filters = [
        { name: 'OpenSCAD Scripts', extensions: ['scad'] },
        { name: 'All Files', extensions: ['*'] }
      ];
    } else {
      filters = [
        { name: 'CodeCAD Scripts', extensions: ['codecad'] },
        { name: 'All Files', extensions: ['*'] }
      ];
    }
    
    const defaultOptions = {
      filters: filters
    };
    
    // Get last used directory from localStorage if available
    let defaultPath = null;
    try {
      const lastDir = options.lastUsedDirectory;
      if (lastDir && fs.existsSync(lastDir)) {
        defaultPath = lastDir;
      }
    } catch (error) {
      // Ignore error, use default
    }
    
    // If no valid last directory, use Documents folder
    if (!defaultPath) {
      defaultPath = path.join(require('os').homedir(), 'Documents');
    }
    
    // Set default filename based on current language
    let defaultFilename = 'untitled';
    if (options.currentLanguage) {
      switch (options.currentLanguage) {
        case 'javascript':
          defaultFilename = 'untitled.codecad';
          break;
        case 'openscad':
          defaultFilename = 'untitled.scad';
          break;
        default:
          defaultFilename = 'untitled.codecad';
      }
    } else {
      defaultFilename = 'untitled.codecad';
    }
    
    const fullDefaultPath = path.join(defaultPath, defaultFilename);
    
    const dialogOptions = { 
      ...defaultOptions, 
      ...options,
      defaultPath: fullDefaultPath
    };
    
    const result = await dialog.showSaveDialog(mainWindow, dialogOptions);
    
    if (!result.canceled) {
      // Update last used directory
      const selectedDir = path.dirname(result.filePath);
      return { 
        success: true, 
        filePath: result.filePath,
        directory: selectedDir
      };
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-stl', async (event, { filePath, stlData, isBinary = true, overwrite = false }) => {
  try {
    if (!filePath || !stlData) {
      throw new Error('File path and STL data are required');
    }

    // Check if file exists and overwrite is false
    if (!overwrite && fs.existsSync(filePath)) {
      throw new Error(`File "${filePath}" already exists. Use overwrite=true to replace it.`);
    }

    // Write STL data to file
    if (isBinary) {
      // For binary data, we need to handle it as a buffer
      const buffer = Buffer.from(stlData);
      fs.writeFileSync(filePath, buffer);
    } else {
      // For ASCII data, write as text
      fs.writeFileSync(filePath, stlData, 'utf8');
    }

    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('export-step', async (event, { filePath, stepData, overwrite = false }) => {
  try {
    if (!filePath || !stepData) {
      throw new Error('File path and STEP data are required');
    }

    // Check if file exists and overwrite is false
    if (!overwrite && fs.existsSync(filePath)) {
      throw new Error(`File "${filePath}" already exists. Use overwrite=true to replace it.`);
    }

    // Write STEP data to file as text
    fs.writeFileSync(filePath, stepData, 'utf8');

    return { success: true, filePath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

// Get user's Documents directory
ipcMain.handle('get-user-documents-path', async (event) => {
  try {
    const documentsPath = path.join(require('os').homedir(), 'Documents');
    return { success: true, path: documentsPath };
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

// Menu event handlers
ipcMain.on('menu-new-file', (event) => {
  mainWindow.webContents.send('menu-new-file');
});

ipcMain.on('menu-open-file', (event, data) => {
  mainWindow.webContents.send('menu-open-file', data);
});

ipcMain.on('menu-save-file', (event) => {
  mainWindow.webContents.send('menu-save-file');
});

ipcMain.on('menu-save-as-file', (event, filePath) => {
  mainWindow.webContents.send('menu-save-as-file', filePath);
});

ipcMain.on('menu-save-as', (event) => {
  mainWindow.webContents.send('menu-save-as');
});

ipcMain.on('menu-export-stl', (event) => {
  mainWindow.webContents.send('menu-export-stl');
});

ipcMain.on('menu-export-step', (event) => {
  mainWindow.webContents.send('menu-export-step');
});

ipcMain.on('menu-switch-language', (event, language) => {
  mainWindow.webContents.send('menu-switch-language', language);
});

ipcMain.on('menu-open-settings', (event) => {
  mainWindow.webContents.send('menu-open-settings');
});
