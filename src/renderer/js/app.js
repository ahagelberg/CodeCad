// Main application entry point
import '../css/main.css';
import { EditorManager } from './editor/editor-manager.js';
import { Viewer3D } from './viewer/viewer-3d.js';
import { ScriptEngineManager } from './cad/script-engine-manager.js';
import { FileManager } from './utils/file-manager.js';
import { SettingsDialog } from './ui/settings-dialog.js';
import { getConfigManager } from './utils/config-manager.js';
import { STLExporter } from './utils/stl-exporter.js';
import { STEPExporter } from './utils/step-exporter.js';
import './utils/debug-console.js';

class CodeCADApp {
    constructor() {
        this.editorManager = null;
        this.viewer3D = null;
        this.scriptEngineManager = null;
        this.fileManager = null;
        this.settingsDialog = null;
        this.configManager = null;
        this.currentFile = null;
        this.currentLanguage = 'javascript';
        this.debounceTimer = null;
        this.debounceDelay = 500; // Default delay in milliseconds
        
        // Single variable to track the current working directory
        this.currentWorkingDirectory = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Code CAD application...');
            
            // Initialize debug console first
            this.debugConsole = new DebugConsole();
            
            // Suppress all JavaScript error popups
            this.suppressErrorPopups();
            
            // Initialize components
            console.log('Initializing config manager...');
            this.configManager = getConfigManager();
            
            console.log('Initializing file manager...');
            this.fileManager = new FileManager();
            
            console.log('Initializing script engine manager...');
            this.scriptEngineManager = new ScriptEngineManager();
            
            console.log('Initializing editor manager...');
            this.editorManager = new EditorManager();
            
            console.log('Initializing 3D viewer...');
            this.viewer3D = new Viewer3D();
            
            console.log('Initializing settings dialog...');
            this.settingsDialog = new SettingsDialog();

            // Setup event listeners
            this.setupEventListeners();
            this.setupMenuListeners();
            this.setupResizer();

            // Initialize UI
            await this.initializeUI();

            // Load default template
            console.log('About to load default template...');
            this.loadDefaultTemplate();

            // Load debounce delay from config
            await this.loadDebounceConfig();

            // Load the saved working directory
            await this.loadWorkingDirectory();

            console.log('Code CAD application initialized successfully');
        } catch (error) {
            console.log('Failed to initialize application:', error);
            this.showError('Initialization Error', error.message);
        }
    }

    async initializeUI() {
        // Initialize Monaco Editor
        console.log('Initializing editor manager...');
        await this.editorManager.initialize();
        console.log('Editor manager initialization complete');
        
        // Apply editor settings from config
        console.log('Applying editor settings...');
        await this.editorManager.applyEditorSettings();
        console.log('Editor settings applied');
        
        // Initialize 3D Viewer
        console.log('Initializing 3D viewer...');
        await this.viewer3D.initialize();
        console.log('3D viewer initialized successfully');
        
        // Setup language switching
        this.setupLanguageSwitching();
        
        // Update status
        this.updateStatus('Ready');
    }

    setupEventListeners() {
        // Toolbar buttons
        document.getElementById('new-file').addEventListener('click', () => this.newFile());
        document.getElementById('open-file').addEventListener('click', () => this.openFile());
        document.getElementById('save-file').addEventListener('click', () => this.saveFile());
        document.getElementById('export-stl').addEventListener('click', () => this.exportSTL());
        document.getElementById('export-step').addEventListener('click', () => this.exportSTEP());
        document.getElementById('settings').addEventListener('click', () => this.openSettings());

        // Language selector
        document.getElementById('language-selector').addEventListener('change', (e) => {
            this.switchLanguage(e.target.value);
        });

        // Viewer controls
        document.getElementById('reset-camera').addEventListener('click', () => {
            this.viewer3D.resetCamera();
        });

        // Pane toggles
        document.getElementById('toggle-editor').addEventListener('click', () => {
            this.togglePane('editor');
        });
        document.getElementById('toggle-viewer').addEventListener('click', () => {
            this.togglePane('viewer');
        });

        // Error dialog
        document.getElementById('close-error').addEventListener('click', () => {
            this.hideError();
        });
        document.getElementById('error-ok').addEventListener('click', () => {
            this.hideError();
        });

        // Editor content change - only enabled if live update is on
        this.setupLiveUpdate();
    }

    suppressErrorPopups() {
        // Suppress all JavaScript error popups
        window.addEventListener('error', (event) => {
            console.log('JavaScript error suppressed:', event.error?.message || event.message);
            this.updateStatus(`Error: ${event.error?.message || event.message}`, 'error');
            event.preventDefault();
            event.stopPropagation();
            return false;
        });

        // Suppress unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.log('Unhandled promise rejection suppressed:', event.reason);
            this.updateStatus(`Promise Error: ${event.reason}`, 'error');
            event.preventDefault();
            event.stopPropagation();
            return false;
        });

        // Override console.error to prevent popups
        const originalConsoleError = console.error;
        console.error = (...args) => {
            // Log to console but don't show popups
            originalConsoleError.apply(console, args);
            // Also show in status bar
            const errorMsg = args.join(' ');
            this.updateStatus(`Console Error: ${errorMsg}`, 'error');
        };

        // Override alert to prevent popups
        window.alert = (message) => {
            console.log('Alert suppressed:', message);
            this.updateStatus(`Alert: ${message}`, 'warning');
        };

        // Override confirm to prevent popups
        window.confirm = (message) => {
            console.log('Confirm suppressed:', message);
            this.updateStatus(`Confirm: ${message}`, 'warning');
            return true; // Default to true
        };

        // Override prompt to prevent popups
        window.prompt = (message, defaultValue) => {
            console.log('Prompt suppressed:', message);
            this.updateStatus(`Prompt: ${message}`, 'warning');
            return defaultValue || '';
        };

        // Suppress any remaining error sources
        const originalOnError = window.onerror;
        window.onerror = (message, source, lineno, colno, error) => {
            console.log('Window onerror suppressed:', message);
            this.updateStatus(`Script Error: ${message}`, 'error');
            return true; // Prevent default error handling
        };

        // Suppress any remaining unhandled rejections
        const originalOnUnhandledRejection = window.onunhandledrejection;
        window.onunhandledrejection = (event) => {
            console.log('Window onunhandledrejection suppressed:', event.reason);
            this.updateStatus(`Unhandled Rejection: ${event.reason}`, 'error');
            event.preventDefault();
            return true;
        };

        // Override any other potential error sources
        if (window.chrome && window.chrome.runtime) {
            window.chrome.runtime.onError = () => {};
        }

        // Suppress errors at document level
        document.addEventListener('error', (event) => {
            console.log('Document error suppressed:', event.error);
            this.updateStatus(`Document Error: ${event.error?.message || 'Unknown error'}`, 'error');
            event.preventDefault();
            event.stopPropagation();
            return false;
        });

        // Suppress any remaining global error handlers
        if (typeof globalThis !== 'undefined') {
            globalThis.onerror = (message, source, lineno, colno, error) => {
                console.log('GlobalThis onerror suppressed:', message);
                this.updateStatus(`Global Error: ${message}`, 'error');
                return true;
            };
        }

        // Suppress any remaining global unhandled rejection handlers
        if (typeof globalThis !== 'undefined') {
            globalThis.onunhandledrejection = (event) => {
                console.log('GlobalThis onunhandledrejection suppressed:', event.reason);
                this.updateStatus(`Global Rejection: ${event.reason}`, 'error');
                event.preventDefault();
                return true;
            };
        }

        // Override any potential error reporting
        if (window.reportError) {
            window.reportError = (error) => {
                console.log('ReportError suppressed:', error);
                this.updateStatus(`Reported Error: ${error.message || error}`, 'error');
            };
        }

        console.log('All error popups suppressed');
    }

    async setupLiveUpdate() {
        try {
            console.log('Setting up live update...');
            const config = await this.configManager.get();
            console.log('Config loaded:', config);
            const liveUpdate = config.editor?.liveUpdate || false;
            console.log('Live update setting:', liveUpdate);
            
            if (liveUpdate) {
                console.log('Enabling content change callback...');
                // Enable content change callback for live updates
                this.editorManager.onContentChange((content) => {
                    console.log('Content change callback triggered with content:', content);
                    this.handleScriptChange(content);
                });
                console.log('Live update enabled successfully');
            } else {
                console.log('Live update disabled - enabling anyway for testing');
                // Enable anyway for testing
                this.editorManager.onContentChange((content) => {
                    console.log('Content change callback triggered with content:', content);
                    this.handleScriptChange(content);
                });
            }
        } catch (error) {
            console.log('Failed to setup live update:', error);
        }
    }

    handleScriptChange(content) {
        // Clear existing timer
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }

        // Set new timer
        this.debounceTimer = setTimeout(() => {
            // Get current content from editor instead of using the parameter
            const currentContent = this.editorManager.getContent();
            this.executeScript(currentContent);
        }, this.debounceDelay);

        // Show typing indicator
        this.updateStatus('Typing...');
    }

    async executeScript(content) {
        try {
            console.log('executeScript called with content:', content);
            
            // Only process if we have content
            if (!content || content.trim() === '') {
                console.log('No content to process');
                this.updateStatus('Ready');
                return;
            }

            // Get current language
            const language = this.editorManager.getCurrentLanguage();
            console.log('Current language:', language);
            
            // Try to execute the script
            console.log('Executing script...');
            const result = await this.scriptEngineManager.execute(content);
            console.log('Script execution result:', result);
            
            if (result && result.success) {
                console.log('Script executed successfully, updating 3D view with data:', result.data);
                // Update 3D view with the result
                await this.update3DView(result.data);
                this.updateStatus('Script executed successfully');
            } else {
                console.log('Script execution failed:', result?.error || 'Unknown error');
                // Show error in status bar instead of popup
                const errorMsg = result?.error || 'Script execution failed';
                this.updateStatus(`Error: ${errorMsg}`, 'error');
            }
        } catch (error) {
            // Show error in status bar instead of popup
            console.log('Script execution failed (ignored):', error.message);
            this.updateStatus(`Error: ${error.message}`, 'error');
        }
    }

    async update3DView(geometryData) {
        try {
            console.log('update3DView called with geometryData:', geometryData);
            console.log('viewer3D exists:', !!this.viewer3D);
            
            if (this.viewer3D && geometryData) {
                console.log('Clearing scene...');
                // Clear existing geometry
                this.viewer3D.clearScene();
                
                console.log('Adding geometry...');
                // Add new geometry
                if (Array.isArray(geometryData)) {
                    console.log('Adding array of geometry:', geometryData.length, 'items');
                    geometryData.forEach((item, index) => {
                        console.log(`Adding geometry item ${index}:`, item);
                        this.viewer3D.addGeometry(item);
                    });
                } else {
                    console.log('Adding single geometry item:', geometryData);
                    this.viewer3D.addGeometry(geometryData);
                }
                
                console.log('Rendering scene...');
                // Render the scene
                this.viewer3D.render();
                console.log('3D view updated successfully');
            } else {
                console.log('Cannot update 3D view - viewer3D or geometryData missing');
            }
        } catch (error) {
            console.log('Failed to update 3D view:', error);
        }
    }

    updateStatus(message, type = 'info') {
        try {
            const statusElement = document.getElementById('status-message');
            if (statusElement) {
                statusElement.textContent = message;
                
                // Add styling based on type
                statusElement.className = `status-${type}`;
                
                // Auto-clear error messages after 5 seconds
                if (type === 'error') {
                    setTimeout(() => {
                        if (statusElement.textContent === message) {
                            statusElement.textContent = 'Ready';
                            statusElement.className = 'status-info';
                        }
                    }, 5000);
                }
            } else {
                console.log('Status message element not found');
            }
        } catch (error) {
            console.log('Failed to update status:', error);
        }
    }

    setupMenuListeners() {
        if (window.electronAPI) {
            // File operations
            window.electronAPI.onMenuNewFile(() => this.newFile());
            window.electronAPI.onMenuOpenFile((event, data) => this.openFileFromMenu(data));
            window.electronAPI.onMenuSaveFile(() => this.saveFile());
            window.electronAPI.onMenuSaveAsFile((event, filePath) => this.saveAsFile(filePath));
            
            // Export operations
            window.electronAPI.onMenuExportSTL(() => this.exportSTL());
            window.electronAPI.onMenuExportSTEP(() => this.exportSTEP());
            
            // Language switching
            window.electronAPI.onMenuSwitchLanguage((event, language) => {
                this.switchLanguage(language);
            });
            
            // Settings
            window.electronAPI.onMenuOpenSettings(() => {
                this.openSettings();
            });
        }
    }

    setupResizer() {
        const resizer = document.getElementById('resizer');
        const editorPane = document.getElementById('editor-pane');
        const viewerPane = document.getElementById('viewer-pane');
        
        let isResizing = false;
        
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const containerWidth = document.getElementById('main-content').offsetWidth;
            const newEditorWidth = (e.clientX / containerWidth) * 100;
            const newViewerWidth = 100 - newEditorWidth;
            
            if (newEditorWidth > 20 && newViewerWidth > 20) {
                editorPane.style.flex = `0 0 ${newEditorWidth}%`;
                viewerPane.style.flex = `0 0 ${newViewerWidth}%`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isResizing = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        });
    }

    setupLanguageSwitching() {
        // Update language selector to match current language
        const selector = document.getElementById('language-selector');
        selector.value = this.currentLanguage;
        
        // Update language indicator
        document.getElementById('language-indicator').textContent = 
            this.currentLanguage.charAt(0).toUpperCase() + this.currentLanguage.slice(1);
    }

    async newFile() {
        this.currentFile = null;
        this.loadDefaultTemplate();
        this.updateFileInfo('Untitled');
        this.updateStatus('New file created');
    }

    async openFile() {
        try {
            if (window.electronAPI) {
                // Use Electron API to show open dialog
                const result = await window.electronAPI.showOpenDialog({
                    lastUsedDirectory: this.getWorkingDirectory()
                });
                if (result.success && result.filePath) {
                    this.currentFile = result.filePath;
                    this.fileManager.setCurrentFile(result.filePath);
                    this.setWorkingDirectory(result.filePath);
                    this.loadScript(result.content, result.filePath);
                    this.updateFileInfo(result.filePath);
                    
                    this.updateStatus('File opened');
                }
            } else {
                // Fallback for web environment - use file input
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.codecad,.scad';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const content = await this.fileManager.readFile(file);
                        // For web environment, we can only use the filename
                        this.currentFile = file.name;
                        this.fileManager.setCurrentFile(file.name);
                        this.loadScript(content, file.name);
                        this.updateFileInfo(file.name);
                    }
                };
                input.click();
            }
        } catch (error) {
            this.showError('Open File Error', error.message);
        }
    }

    async openFileFromMenu(data) {
        try {
            this.currentFile = data.filePath;
            this.fileManager.setCurrentFile(data.filePath);
            this.setWorkingDirectory(data.filePath);
            this.loadScript(data.content, data.filePath);
            this.updateFileInfo(data.filePath);
            
            this.updateStatus('File opened');
        } catch (error) {
            this.showError('Open File Error', error.message);
        }
    }

    async saveFile() {
        try {
            const content = this.editorManager.getContent();
            
            if (this.currentFile) {
                try {
                    await this.fileManager.saveFile(this.currentFile, content);
                    this.updateStatus('File saved');
                } catch (saveError) {
                    // If save fails (e.g., read-only file, invalid path), show save as dialog
                    console.log('Direct save failed, showing save dialog:', saveError.message);
                    this.saveAsFile();
                }
            } else {
                // Trigger save as dialog
                this.saveAsFile();
            }
        } catch (error) {
            this.showError('Save File Error', error.message);
        }
    }

    async saveAsFile(filePath = null) {
        try {
            const content = this.editorManager.getContent();
            
            if (filePath) {
                await this.fileManager.saveFile(filePath, content);
                this.currentFile = filePath;
                this.fileManager.setCurrentFile(filePath);
                this.setWorkingDirectory(filePath);
                this.updateFileInfo(filePath);
                
                this.updateStatus('File saved');
            } else {
                // Show save dialog
                if (window.electronAPI) {
                    const result = await window.electronAPI.showSaveDialog({
                        lastUsedDirectory: this.getWorkingDirectory()
                    });
                    if (result.success) {
                        await this.saveAsFile(result.filePath);
                    }
                } else {
                    // Fallback for web environment
                    this.fileManager.downloadFile(content, 'untitled.codecad');
                }
            }
        } catch (error) {
            this.showError('Save File Error', error.message);
        }
    }

    async exportSTL() {
        try {
            this.showLoading('Exporting STL...');
            
            const meshData = this.viewer3D.getMeshData();
            if (!meshData || meshData.length === 0) {
                throw new Error('No 3D objects to export');
            }
            
            // Show save dialog
            if (window.electronAPI) {
                const result = await window.electronAPI.showSaveDialog({
                    lastUsedDirectory: this.getWorkingDirectory(),
                    filters: [
                        { name: 'STL Files', extensions: ['stl'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });
                
                if (result.success && result.filePath) {
                    // Create STL exporter
                    const exporter = new STLExporter();
                    
                    // Export as binary STL
                    const stlData = exporter.export(meshData, { 
                        binary: true, 
                        name: 'CodeCAD_Export' 
                    });
                    
                    // Send to main process for file writing
                    const exportResult = await window.electronAPI.exportSTL({
                        filePath: result.filePath,
                        stlData: stlData,
                        isBinary: true
                    });
                    
                    if (exportResult.success) {
                        this.updateStatus(`STL exported to: ${result.filePath}`);
                    } else {
                        throw new Error(exportResult.error);
                    }
                } else {
                    this.updateStatus('STL export cancelled');
                }
            } else {
                // Fallback for web environment - download directly
                const exporter = new STLExporter();
                exporter.exportToFile(meshData, 'export.stl', { 
                    binary: true, 
                    name: 'CodeCAD_Export' 
                });
                this.updateStatus('STL downloaded');
            }
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showError('Export Error', error.message);
        }
    }

    async exportSTEP() {
        try {
            this.showLoading('Exporting STEP...');
            
            const meshData = this.viewer3D.getMeshData();
            if (!meshData || meshData.length === 0) {
                throw new Error('No 3D objects to export');
            }
            
            // Show save dialog
            if (window.electronAPI) {
                const result = await window.electronAPI.showSaveDialog({
                    lastUsedDirectory: this.getWorkingDirectory(),
                    filters: [
                        { name: 'STEP Files', extensions: ['stp', 'step'] },
                        { name: 'All Files', extensions: ['*'] }
                    ]
                });
                
                if (result.success && result.filePath) {
                    // Create STEP exporter
                    const exporter = new STEPExporter();
                    
                    // Export as STEP
                    const stepData = exporter.export(meshData, { 
                        name: 'CodeCAD_Export' 
                    });
                    
                    // Send to main process for file writing
                    const exportResult = await window.electronAPI.exportSTEP({
                        filePath: result.filePath,
                        stepData: stepData
                    });
                    
                    if (exportResult.success) {
                        this.updateStatus(`STEP exported to: ${result.filePath}`);
                    } else {
                        throw new Error(exportResult.error);
                    }
                } else {
                    this.updateStatus('STEP export cancelled');
                }
            } else {
                // Fallback for web environment - download directly
                const exporter = new STEPExporter();
                exporter.exportToFile(meshData, 'export.stp', { 
                    name: 'CodeCAD_Export' 
                });
                this.updateStatus('STEP downloaded');
            }
            
            this.hideLoading();
        } catch (error) {
            this.hideLoading();
            this.showError('Export Error', error.message);
        }
    }

    switchLanguage(language) {
        if (this.currentLanguage === language) return;
        
        this.currentLanguage = language;
        
        // Update UI
        document.getElementById('language-selector').value = language;
        document.getElementById('language-indicator').textContent = 
            language.charAt(0).toUpperCase() + language.slice(1);
        
        // Switch editor language
        this.editorManager.setLanguage(language);
        
        // Switch script engine
        this.scriptEngineManager.setLanguage(language);
        
        // Load appropriate template
        this.loadDefaultTemplate();
        
        this.updateStatus(`Switched to ${language}`);
    }

    loadDefaultTemplate() {
        const template = document.getElementById(`template-${this.currentLanguage}`);
        if (template) {
            const content = template.textContent.trim();
            console.log('Loading template for', this.currentLanguage, ':', content);
            this.editorManager.setContent(content);
        } else {
            console.log('No template found for', this.currentLanguage);
        }
    }

    async loadDebounceConfig() {
        try {
            const config = await this.configManager.get();
            this.debounceDelay = config.scriptEngines?.debounceDelay || 500;
            console.log('Debounce delay loaded:', this.debounceDelay, 'ms');
        } catch (error) {
            console.log('Failed to load debounce config, using default:', error);
            this.debounceDelay = 500;
        }
    }

    // Working directory management methods
    async loadWorkingDirectory() {
        try {
            // Try to load from localStorage first
            const savedDir = localStorage.getItem('code-cad-working-directory');
            if (savedDir) {
                this.currentWorkingDirectory = savedDir;
                console.log('Loaded working directory from localStorage:', this.currentWorkingDirectory);
                return;
            }

            // Fallback to Documents folder
            if (window.electronAPI) {
                const result = await window.electronAPI.getUserDocumentsPath();
                if (result.success) {
                    this.currentWorkingDirectory = result.path;
                    this.saveWorkingDirectory();
                    console.log('Set working directory to Documents folder:', this.currentWorkingDirectory);
                }
            }
        } catch (error) {
            console.log('Failed to load working directory:', error);
        }
    }

    saveWorkingDirectory() {
        if (this.currentWorkingDirectory) {
            localStorage.setItem('code-cad-working-directory', this.currentWorkingDirectory);
            console.log('Saved working directory:', this.currentWorkingDirectory);
        }
    }

    setWorkingDirectory(filePath) {
        if (filePath) {
            // Extract directory from file path
            const lastSlash = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'));
            const directory = lastSlash > 0 ? filePath.substring(0, lastSlash) : null;
            
            if (directory) {
                this.currentWorkingDirectory = directory;
                this.saveWorkingDirectory();
                console.log('Set working directory to:', this.currentWorkingDirectory);
            }
        }
    }

    getWorkingDirectory() {
        return this.currentWorkingDirectory;
    }


    loadScript(content, filename) {
        this.editorManager.setContent(content);
        
        // Detect language from filename
        const extension = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'scad': 'openscad',
            'cad': 'javascript'
        };
        
        if (languageMap[extension]) {
            this.switchLanguage(languageMap[extension]);
        }
    }


    togglePane(pane) {
        const editorPane = document.getElementById('editor-pane');
        const viewerPane = document.getElementById('viewer-pane');
        const resizer = document.getElementById('resizer');
        
        if (pane === 'editor') {
            const isHidden = editorPane.style.display === 'none';
            editorPane.style.display = isHidden ? 'flex' : 'none';
            resizer.style.display = isHidden ? 'block' : 'none';
        } else if (pane === 'viewer') {
            const isHidden = viewerPane.style.display === 'none';
            viewerPane.style.display = isHidden ? 'flex' : 'none';
            resizer.style.display = isHidden ? 'block' : 'none';
        }
    }


    updateFileInfo(filename) {
        document.getElementById('file-info').textContent = filename;
    }

    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const text = overlay.querySelector('p');
        text.textContent = message;
        overlay.classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loading-overlay').classList.add('hidden');
    }

    showError(title, message) {
        // Show error in status bar instead of popup
        this.updateStatus(`${title}: ${message}`, 'error');
        console.log(`Error suppressed: ${title} - ${message}`);
    }

    hideError() {
        document.getElementById('error-dialog').classList.add('hidden');
    }

    async openSettings() {
        try {
            if (this.settingsDialog) {
                await this.settingsDialog.open();
            } else {
                console.log('Settings dialog not initialized');
                this.updateStatus('Settings dialog not available. Please restart the application.', 'error');
            }
        } catch (error) {
            console.log('Failed to open settings:', error);
            this.updateStatus('Failed to open settings: ' + error.message, 'error');
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CodeCADApp();
    
    // Update document title with version info
    try {
        const { VERSION_INFO } = require('../../shared/version.js');
        document.title = `${VERSION_INFO.name} v${VERSION_INFO.version}`;
    } catch (error) {
        console.log('Failed to load version for title:', error);
    }
});
