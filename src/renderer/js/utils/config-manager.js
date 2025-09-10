// Configuration Manager for Renderer Process
class ConfigManager {
    constructor() {
        this.config = null;
        this.loadConfig();
    }

    async loadConfig() {
        try {
            if (window.electronAPI) {
                const result = await window.electronAPI.getAllConfig();
                if (result.success) {
                    this.config = result.config;
                } else {
                    console.error('Failed to load config:', result.error);
                    this.config = this.getFallbackConfig();
                }
            } else {
                // Fallback for web environment
                this.config = this.getFallbackConfig();
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
            this.config = this.getFallbackConfig();
        }
    }

    getFallbackConfig() {
        return {
            app: { name: 'Code CAD', version: '1.0.0' },
            window: { width: 1400, height: 900 },
            development: { webPort: 3000, devTools: true },
            editor: { defaultLanguage: 'javascript', fontSize: 14 },
            viewer: { backgroundColor: '#1e1e1e', cameraDistance: 10 },
            rendering: { antialias: true, shadows: true },
            lighting: {
                ambientLight: { color: '#404040', intensity: 0.6 },
                directionalLight: { color: '#ffffff', intensity: 0.8 }
            },
            fileTypes: { supportedExtensions: ['.js', '.ts', '.scad'] },
            export: { stl: { enabled: true }, step: { enabled: true } },
            scriptEngines: { default: 'javascript', available: ['javascript', 'typescript', 'openscad'] },
            logging: { level: 'info', console: true },
            security: { nodeIntegration: false, contextIsolation: true },
            performance: { enableHardwareAcceleration: true },
            ui: { theme: 'dark', language: 'en' }
        };
    }

    async get(path) {
        if (!this.config) {
            await this.loadConfig();
        }

        if (!path) return this.config;
        
        const keys = path.split('.');
        let value = this.config;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        
        return value;
    }

    async set(path, value) {
        if (!this.config) {
            await this.loadConfig();
        }

        const keys = path.split('.');
        let current = this.config;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;

        // Save to main process
        if (window.electronAPI) {
            try {
                await window.electronAPI.setConfig(path, value);
            } catch (error) {
                console.error('Failed to save config to main process:', error);
            }
        }
    }

    async save() {
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.saveConfig();
                return result.success;
            } catch (error) {
                console.error('Failed to save configuration:', error);
                return false;
            }
        }
        return false;
    }

    async reset() {
        if (window.electronAPI) {
            try {
                const result = await window.electronAPI.resetConfig();
                if (result.success) {
                    await this.loadConfig();
                }
                return result.success;
            } catch (error) {
                console.error('Failed to reset configuration:', error);
                return false;
            }
        }
        return false;
    }

    // Convenience methods
    async getWindowConfig() {
        return await this.get('window');
    }

    async getEditorConfig() {
        return await this.get('editor');
    }

    async getViewerConfig() {
        return await this.get('viewer');
    }

    async getRenderingConfig() {
        return await this.get('rendering');
    }

    async getLightingConfig() {
        return await this.get('lighting');
    }

    async getDevelopmentConfig() {
        return await this.get('development');
    }

    async getExportConfig() {
        return await this.get('export');
    }

    async getScriptEnginesConfig() {
        return await this.get('scriptEngines');
    }

    async getSecurityConfig() {
        return await this.get('security');
    }

    async getPerformanceConfig() {
        return await this.get('performance');
    }

    async getUIConfig() {
        return await this.get('ui');
    }

    // Validation
    validate() {
        if (!this.config) return false;

        const required = [
            'app.name',
            'app.version',
            'window.width',
            'window.height',
            'development.webPort',
            'editor.defaultLanguage',
            'viewer.backgroundColor'
        ];

        for (const path of required) {
            if (this.get(path) === undefined) {
                console.error(`Missing required configuration: ${path}`);
                return false;
            }
        }

        return true;
    }
}

// Singleton instance
let configManager = null;

function getConfigManager() {
    if (!configManager) {
        configManager = new ConfigManager();
    }
    return configManager;
}

export { ConfigManager, getConfigManager };
