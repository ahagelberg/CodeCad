// Settings Dialog Component
import { getConfigManager } from '../utils/config-manager.js';

export class SettingsDialog {
    constructor() {
        this.configManager = getConfigManager();
        this.dialog = null;
        this.isOpen = false;
        this.createDialog();
    }

    createDialog() {
        // Create dialog HTML
        const dialogHTML = `
            <div id="settings-dialog" class="modal hidden">
                <div class="modal-content settings-modal">
                    <div class="modal-header">
                        <h3>Settings</h3>
                        <button id="close-settings" class="close-btn">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="settings-tabs">
                            <button class="tab-btn active" data-tab="general">General</button>
                            <button class="tab-btn" data-tab="editor">Editor</button>
                            <button class="tab-btn" data-tab="viewer">3D Viewer</button>
                            <button class="tab-btn" data-tab="export">Export</button>
                            <button class="tab-btn" data-tab="advanced">Advanced</button>
                        </div>
                        
                        <div class="settings-content">
                            <!-- General Tab -->
                            <div id="tab-general" class="tab-content active">
                                <div class="setting-group">
                                    <h4>Application</h4>
                                    <div class="setting-item">
                                        <label for="theme">Theme:</label>
                                        <select id="theme" class="setting-select">
                                            <option value="dark">Dark</option>
                                            <option value="light">Light</option>
                                        </select>
                                    </div>
                                    <div class="setting-item">
                                        <label for="language">Language:</label>
                                        <select id="language" class="setting-select">
                                            <option value="en">English</option>
                                            <option value="es">Español</option>
                                            <option value="fr">Français</option>
                                            <option value="de">Deutsch</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <h4>Window</h4>
                                    <div class="setting-item">
                                        <label for="remember-window-state">Remember window state:</label>
                                        <input type="checkbox" id="remember-window-state" class="setting-input">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Editor Tab -->
                            <div id="tab-editor" class="tab-content">
                                <div class="setting-group">
                                    <h4>Editor Settings</h4>
                                    <div class="setting-item">
                                        <label for="default-language">Default Language:</label>
                                        <select id="default-language" class="setting-select">
                                            <option value="javascript">JavaScript</option>
                                            <option value="openscad">OpenSCAD</option>
                                        </select>
                                    </div>
                                    <div class="setting-item">
                                        <label for="font-size">Font Size:</label>
                                        <select id="font-size" class="setting-select">
                                            <option value="8">8px</option>
                                            <option value="9">9px</option>
                                            <option value="10">10px</option>
                                            <option value="11">11px</option>
                                            <option value="12">12px</option>
                                            <option value="13">13px</option>
                                            <option value="14">14px</option>
                                            <option value="15">15px</option>
                                            <option value="16">16px</option>
                                            <option value="17">17px</option>
                                            <option value="18">18px</option>
                                            <option value="19">19px</option>
                                            <option value="20">20px</option>
                                            <option value="22">22px</option>
                                            <option value="24">24px</option>
                                            <option value="26">26px</option>
                                            <option value="28">28px</option>
                                            <option value="30">30px</option>
                                        </select>
                                    </div>
                                    <div class="setting-item">
                                        <label for="font-family">Font Family:</label>
                                        <select id="font-family" class="setting-select">
                                            <option value="Consolas, 'Courier New', monospace">Consolas (Windows)</option>
                                            <option value="'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace">SF Mono (macOS)</option>
                                            <option value="'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace">Cascadia Code</option>
                                            <option value="'Fira Code', 'JetBrains Mono', Consolas, monospace">Fira Code</option>
                                            <option value="'JetBrains Mono', 'Fira Code', Consolas, monospace">JetBrains Mono</option>
                                            <option value="'Source Code Pro', 'Fira Code', Consolas, monospace">Source Code Pro</option>
                                            <option value="'Roboto Mono', 'Fira Code', Consolas, monospace">Roboto Mono</option>
                                            <option value="'Ubuntu Mono', 'Fira Code', Consolas, monospace">Ubuntu Mono</option>
                                            <option value="'DejaVu Sans Mono', 'Fira Code', Consolas, monospace">DejaVu Sans Mono</option>
                                            <option value="'Liberation Mono', 'Fira Code', Consolas, monospace">Liberation Mono</option>
                                            <option value="'Courier New', monospace">Courier New</option>
                                            <option value="'Lucida Console', 'Courier New', monospace">Lucida Console</option>
                                            <option value="'Monaco', 'Consolas', monospace">Monaco</option>
                                            <option value="'Menlo', 'Monaco', 'Consolas', monospace">Menlo</option>
                                        </select>
                                    </div>
                                    <div class="setting-item">
                                        <label for="tab-size">Tab Size:</label>
                                        <input type="number" id="tab-size" class="setting-input" min="2" max="8">
                                    </div>
                                    <div class="setting-item">
                                        <label for="insert-spaces">Insert spaces instead of tabs:</label>
                                        <input type="checkbox" id="insert-spaces" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="word-wrap">Word wrap:</label>
                                        <input type="checkbox" id="word-wrap" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="minimap">Show minimap:</label>
                                        <input type="checkbox" id="minimap" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="live-update">Live update 3D view:</label>
                                        <input type="checkbox" id="live-update" class="setting-input">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- 3D Viewer Tab -->
                            <div id="tab-viewer" class="tab-content">
                                <div class="setting-group">
                                    <h4>3D Viewer Settings</h4>
                                    <div class="setting-item">
                                        <label for="background-color">Background Color:</label>
                                        <input type="color" id="background-color" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="camera-distance">Default Camera Distance:</label>
                                        <input type="number" id="camera-distance" class="setting-input" min="1" max="100" step="0.1">
                                    </div>
                                    <div class="setting-item">
                                        <label for="camera-speed">Camera Speed:</label>
                                        <input type="number" id="camera-speed" class="setting-input" min="0.001" max="0.1" step="0.001">
                                    </div>
                                    <div class="setting-item">
                                        <label for="zoom-speed">Zoom Speed:</label>
                                        <input type="number" id="zoom-speed" class="setting-input" min="0.01" max="1" step="0.01">
                                    </div>
                                    <div class="setting-item">
                                        <label for="show-grid">Show grid:</label>
                                        <input type="checkbox" id="show-grid" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="show-axes">Show axes:</label>
                                        <input type="checkbox" id="show-axes" class="setting-input">
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <h4>Rendering</h4>
                                    <div class="setting-item">
                                        <label for="antialias">Antialiasing:</label>
                                        <input type="checkbox" id="antialias" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="shadows">Shadows:</label>
                                        <input type="checkbox" id="shadows" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="shadow-map-size">Shadow Map Size:</label>
                                        <select id="shadow-map-size" class="setting-select">
                                            <option value="512">512</option>
                                            <option value="1024">1024</option>
                                            <option value="2048">2048</option>
                                            <option value="4096">4096</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Export Tab -->
                            <div id="tab-export" class="tab-content">
                                <div class="setting-group">
                                    <h4>STL Export</h4>
                                    <div class="setting-item">
                                        <label for="stl-ascii">ASCII format (instead of binary):</label>
                                        <input type="checkbox" id="stl-ascii" class="setting-input">
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <h4>STEP Export</h4>
                                    <div class="setting-item">
                                        <label for="step-version">STEP version:</label>
                                        <select id="step-version" class="setting-select">
                                            <option value="AP214">AP214</option>
                                            <option value="AP203">AP203</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Advanced Tab -->
                            <div id="tab-advanced" class="tab-content">
                                <div class="setting-group">
                                    <h4>Development</h4>
                                    <div class="setting-item">
                                        <label for="web-port">Web Port:</label>
                                        <input type="number" id="web-port" class="setting-input" min="1000" max="65535">
                                    </div>
                                    <div class="setting-item">
                                        <label for="dev-tools">Show developer tools:</label>
                                        <input type="checkbox" id="dev-tools" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="hot-reload">Hot reload:</label>
                                        <input type="checkbox" id="hot-reload" class="setting-input">
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <h4>Performance</h4>
                                    <div class="setting-item">
                                        <label for="hardware-acceleration">Hardware acceleration:</label>
                                        <input type="checkbox" id="hardware-acceleration" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="gpu-acceleration">3D GPU acceleration:</label>
                                        <input type="checkbox" id="gpu-acceleration" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="gpu-acceleration-note" style="font-size: 11px; color: #969696; font-style: italic;">
                                            Note: Disable if experiencing blank 3D viewport or GPU crashes
                                        </label>
                                    </div>
                                    <div class="setting-item">
                                        <label for="webgl">WebGL:</label>
                                        <input type="checkbox" id="webgl" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="webgl2">WebGL 2.0:</label>
                                        <input type="checkbox" id="webgl2" class="setting-input">
                                    </div>
                                    <div class="setting-item">
                                        <label for="max-objects">Max objects:</label>
                                        <input type="number" id="max-objects" class="setting-input" min="100" max="10000">
                                    </div>
                                </div>
                                
                                <div class="setting-group">
                                    <h4>Logging</h4>
                                    <div class="setting-item">
                                        <label for="log-level">Log level:</label>
                                        <select id="log-level" class="setting-select">
                                            <option value="error">Error</option>
                                            <option value="warn">Warning</option>
                                            <option value="info">Info</option>
                                            <option value="debug">Debug</option>
                                        </select>
                                    </div>
                                    <div class="setting-item">
                                        <label for="console-logging">Console logging:</label>
                                        <input type="checkbox" id="console-logging" class="setting-input">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="reset-settings" class="btn btn-secondary">Reset to Defaults</button>
                        <button id="cancel-settings" class="btn btn-secondary">Cancel</button>
                        <button id="save-settings" class="btn btn-primary">Save</button>
                    </div>
                </div>
            </div>
        `;

        // Add to DOM
        document.body.insertAdjacentHTML('beforeend', dialogHTML);
        this.dialog = document.getElementById('settings-dialog');
        
        // Ensure dialog is hidden initially
        if (this.dialog) {
            this.dialog.classList.add('hidden');
            this.dialog.style.display = 'none';
        }
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Close buttons
        document.getElementById('close-settings').addEventListener('click', () => this.close());
        document.getElementById('cancel-settings').addEventListener('click', () => this.close());
        
        // Save button
        document.getElementById('save-settings').addEventListener('click', () => this.save());
        
        // Reset button
        document.getElementById('reset-settings').addEventListener('click', () => this.reset());
        
        // Tab switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });
        
        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    async open() {
        if (this.isOpen) return;
        
        console.log('Opening settings dialog...');
        await this.loadSettings();
        
        if (this.dialog) {
            this.dialog.classList.remove('hidden');
            this.dialog.style.display = 'flex';
            this.isOpen = true;
            console.log('Settings dialog opened successfully');
        } else {
            console.error('Settings dialog element not found');
        }
    }

    close() {
        if (!this.isOpen) return;
        
        console.log('Closing settings dialog...');
        if (this.dialog) {
            this.dialog.classList.add('hidden');
            this.dialog.style.display = 'none';
        }
        this.isOpen = false;
        console.log('Settings dialog closed');
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }


    async loadSettings() {
        try {
            // Load all configuration values
            const config = await this.configManager.get();
            
            // General settings
            document.getElementById('theme').value = config.ui?.theme || 'dark';
            document.getElementById('language').value = config.ui?.language || 'en';
            document.getElementById('remember-window-state').checked = config.ui?.rememberWindowState || false;
            
            // Editor settings
            document.getElementById('default-language').value = config.editor?.defaultLanguage || 'javascript';
            document.getElementById('font-size').value = config.editor?.fontSize || 14;
            document.getElementById('font-family').value = config.editor?.fontFamily || 'Consolas, "Courier New", monospace';
            document.getElementById('tab-size').value = config.editor?.tabSize || 4;
            document.getElementById('insert-spaces').checked = config.editor?.insertSpaces || true;
            document.getElementById('word-wrap').checked = config.editor?.wordWrap === 'on';
            document.getElementById('minimap').checked = config.editor?.minimap || true;
            document.getElementById('live-update').checked = config.editor?.liveUpdate || false;
            
            // Viewer settings
            document.getElementById('background-color').value = config.viewer?.backgroundColor || '#1e1e1e';
            document.getElementById('camera-distance').value = config.viewer?.cameraDistance || 10;
            document.getElementById('camera-speed').value = config.viewer?.cameraSpeed || 0.01;
            document.getElementById('zoom-speed').value = config.viewer?.zoomSpeed || 0.1;
            document.getElementById('show-grid').checked = config.viewer?.showGrid || true;
            document.getElementById('show-axes').checked = config.viewer?.showAxes || true;
            
            // Rendering settings
            document.getElementById('antialias').checked = config.rendering?.antialias || true;
            document.getElementById('shadows').checked = config.rendering?.shadows || true;
            document.getElementById('shadow-map-size').value = config.rendering?.shadowMapSize || 2048;
            
            // Export settings
            document.getElementById('stl-ascii').checked = config.export?.stl?.ascii || false;
            document.getElementById('step-version').value = config.export?.step?.version || 'AP214';
            
            // Advanced settings
            document.getElementById('web-port').value = config.development?.webPort || 3000;
            document.getElementById('dev-tools').checked = config.development?.devTools || true;
            document.getElementById('hot-reload').checked = config.development?.hotReload || true;
            document.getElementById('hardware-acceleration').checked = config.performance?.enableHardwareAcceleration || true;
            document.getElementById('gpu-acceleration').checked = config.performance?.enableGPUAcceleration || false;
            document.getElementById('webgl').checked = config.performance?.enableWebGL || true;
            document.getElementById('webgl2').checked = config.performance?.enableWebGL2 || true;
            document.getElementById('max-objects').value = config.performance?.maxObjects || 1000;
            document.getElementById('log-level').value = config.logging?.level || 'info';
            document.getElementById('console-logging').checked = config.logging?.console || true;
            
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }

    async save() {
        try {
            // Save all configuration values
            await this.configManager.set('ui.theme', document.getElementById('theme').value);
            await this.configManager.set('ui.language', document.getElementById('language').value);
            await this.configManager.set('ui.rememberWindowState', document.getElementById('remember-window-state').checked);
            
            // Editor settings
            await this.configManager.set('editor.defaultLanguage', document.getElementById('default-language').value);
            const fontSize = parseInt(document.getElementById('font-size').value);
            const fontFamily = document.getElementById('font-family').value;
            await this.configManager.set('editor.fontSize', fontSize);
            await this.configManager.set('editor.fontFamily', fontFamily);
            await this.configManager.set('editor.tabSize', parseInt(document.getElementById('tab-size').value));
            await this.configManager.set('editor.insertSpaces', document.getElementById('insert-spaces').checked);
            await this.configManager.set('editor.wordWrap', document.getElementById('word-wrap').checked ? 'on' : 'off');
            await this.configManager.set('editor.minimap', document.getElementById('minimap').checked);
            await this.configManager.set('editor.liveUpdate', document.getElementById('live-update').checked);
            
            // Viewer settings
            await this.configManager.set('viewer.backgroundColor', document.getElementById('background-color').value);
            await this.configManager.set('viewer.cameraDistance', parseFloat(document.getElementById('camera-distance').value));
            await this.configManager.set('viewer.cameraSpeed', parseFloat(document.getElementById('camera-speed').value));
            await this.configManager.set('viewer.zoomSpeed', parseFloat(document.getElementById('zoom-speed').value));
            await this.configManager.set('viewer.showGrid', document.getElementById('show-grid').checked);
            await this.configManager.set('viewer.showAxes', document.getElementById('show-axes').checked);
            
            // Rendering settings
            await this.configManager.set('rendering.antialias', document.getElementById('antialias').checked);
            await this.configManager.set('rendering.shadows', document.getElementById('shadows').checked);
            await this.configManager.set('rendering.shadowMapSize', parseInt(document.getElementById('shadow-map-size').value));
            
            // Export settings
            await this.configManager.set('export.stl.ascii', document.getElementById('stl-ascii').checked);
            await this.configManager.set('export.step.version', document.getElementById('step-version').value);
            
            // Advanced settings
            await this.configManager.set('development.webPort', parseInt(document.getElementById('web-port').value));
            await this.configManager.set('development.devTools', document.getElementById('dev-tools').checked);
            await this.configManager.set('development.hotReload', document.getElementById('hot-reload').checked);
            await this.configManager.set('performance.enableHardwareAcceleration', document.getElementById('hardware-acceleration').checked);
            await this.configManager.set('performance.enableGPUAcceleration', document.getElementById('gpu-acceleration').checked);
            await this.configManager.set('performance.enableWebGL', document.getElementById('webgl').checked);
            await this.configManager.set('performance.enableWebGL2', document.getElementById('webgl2').checked);
            await this.configManager.set('performance.maxObjects', parseInt(document.getElementById('max-objects').value));
            await this.configManager.set('logging.level', document.getElementById('log-level').value);
            await this.configManager.set('logging.console', document.getElementById('console-logging').checked);
            
            // Save to file
            await this.configManager.save();
            
            // Apply font settings immediately to editor
            try {
                const { EditorManager } = await import('../editor/editor-manager.js');
                // Get the global editor manager instance
                const editorManager = window.app?.editorManager;
                if (editorManager) {
                    editorManager.applyFontSettings(fontSize, fontFamily);
                }
            } catch (error) {
                console.warn('Could not apply font settings immediately:', error);
            }
            
            this.close();
            console.log('Settings saved successfully');
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            alert('Failed to save settings: ' + error.message);
        }
    }

    async reset() {
        if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
            try {
                await this.configManager.reset();
                await this.loadSettings();
                console.log('Settings reset to defaults');
            } catch (error) {
                console.error('Failed to reset settings:', error);
                alert('Failed to reset settings: ' + error.message);
            }
        }
    }
}
