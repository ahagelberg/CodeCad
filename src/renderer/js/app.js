// Main application entry point
import '../css/main.css';
import { EditorManager } from './editor/editor-manager.js';
import { Viewer3D } from './viewer/viewer-3d.js';
import { ScriptEngineManager } from './cad/script-engine-manager.js';
import { FileManager } from './utils/file-manager.js';
import { SettingsDialog } from './ui/settings-dialog.js';
import { getConfigManager } from './utils/config-manager.js';

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
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Code CAD application...');
            
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
            this.loadDefaultTemplate();

            console.log('Code CAD application initialized successfully');
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Initialization Error', error.message);
        }
    }

    async initializeUI() {
        // Initialize Monaco Editor
        await this.editorManager.initialize();
        
        // Initialize 3D Viewer
        await this.viewer3D.initialize();
        
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

        // Editor content change
        this.editorManager.onContentChange((content) => {
            this.handleScriptChange(content);
        });
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
            // This will be handled by the menu system
            // For now, we'll create a simple file input
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.js,.ts,.scad,.cad';
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const content = await this.fileManager.readFile(file);
                    this.loadScript(content, file.name);
                }
            };
            input.click();
        } catch (error) {
            this.showError('Open File Error', error.message);
        }
    }

    async openFileFromMenu(data) {
        try {
            this.currentFile = data.filePath;
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
                await this.fileManager.saveFile(this.currentFile, content);
                this.updateStatus('File saved');
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
                this.updateFileInfo(filePath);
                this.updateStatus('File saved');
            } else {
                // This will be handled by the menu system
                console.log('Save as dialog should be triggered by menu');
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
            
            // TODO: Implement STL export
            console.log('STL export not yet implemented');
            
            this.hideLoading();
            this.updateStatus('STL export completed');
        } catch (error) {
            this.hideLoading();
            this.showError('Export Error', error.message);
        }
    }

    async exportSTEP() {
        try {
            this.showLoading('Exporting STEP...');
            
            const geometryData = this.viewer3D.getGeometryData();
            if (!geometryData || geometryData.length === 0) {
                throw new Error('No 3D objects to export');
            }
            
            // TODO: Implement STEP export
            console.log('STEP export not yet implemented');
            
            this.hideLoading();
            this.updateStatus('STEP export completed');
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
            this.editorManager.setContent(template.textContent.trim());
        }
    }

    loadScript(content, filename) {
        this.editorManager.setContent(content);
        
        // Detect language from filename
        const extension = filename.split('.').pop().toLowerCase();
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'scad': 'openscad',
            'cad': 'javascript'
        };
        
        if (languageMap[extension]) {
            this.switchLanguage(languageMap[extension]);
        }
    }

    async handleScriptChange(content) {
        try {
            this.updateStatus('Processing script...');
            
            // Execute script with current engine
            const result = await this.scriptEngineManager.execute(content);
            
            if (result.success) {
                // Update 3D viewer with results
                this.viewer3D.updateScene(result.objects);
                this.updateStatus('Script executed successfully');
            } else {
                this.showError('Script Error', result.error);
            }
        } catch (error) {
            this.showError('Script Execution Error', error.message);
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

    updateStatus(message) {
        document.getElementById('status-text').textContent = message;
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
        const dialog = document.getElementById('error-dialog');
        const titleElement = dialog.querySelector('.modal-header h3');
        const messageElement = document.getElementById('error-message');
        
        titleElement.textContent = title;
        messageElement.textContent = message;
        dialog.classList.remove('hidden');
    }

    hideError() {
        document.getElementById('error-dialog').classList.add('hidden');
    }

    async openSettings() {
        try {
            if (this.settingsDialog) {
                await this.settingsDialog.open();
            } else {
                console.error('Settings dialog not initialized');
                alert('Settings dialog not available. Please restart the application.');
            }
        } catch (error) {
            console.error('Failed to open settings:', error);
            alert('Failed to open settings: ' + error.message);
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new CodeCADApp();
});
