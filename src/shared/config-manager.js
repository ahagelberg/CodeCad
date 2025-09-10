// Configuration Manager
const fs = require('fs');
const path = require('path');

class ConfigManager {
    constructor() {
        this.config = null;
        this.configPath = path.join(process.cwd(), 'config', 'app.json');
        this.userConfigPath = this.getUserConfigPath();
        this.loadConfig();
    }

    getUserConfigPath() {
        const os = require('os');
        const configDir = path.join(os.homedir(), '.code-cad');
        
        // Ensure config directory exists
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
        }
        
        return path.join(configDir, 'config.json');
    }

    loadConfig() {
        try {
            // Load default config
            const defaultConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            
            // Load user config if it exists
            let userConfig = {};
            if (fs.existsSync(this.userConfigPath)) {
                userConfig = JSON.parse(fs.readFileSync(this.userConfigPath, 'utf8'));
            }
            
            // Merge configs (user config overrides default)
            this.config = this.mergeConfigs(defaultConfig, userConfig);
            
            console.log('Configuration loaded successfully');
        } catch (error) {
            console.error('Failed to load configuration:', error);
            // Fallback to minimal config
            this.config = this.getFallbackConfig();
        }
    }

    mergeConfigs(defaultConfig, userConfig) {
        const merged = JSON.parse(JSON.stringify(defaultConfig));
        
        const mergeDeep = (target, source) => {
            for (const key in source) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    if (!target[key]) target[key] = {};
                    mergeDeep(target[key], source[key]);
                } else {
                    target[key] = source[key];
                }
            }
        };
        
        mergeDeep(merged, userConfig);
        return merged;
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

    get(path) {
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

    set(path, value) {
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
    }

    save() {
        try {
            // Save user config
            const userConfig = this.extractUserConfig();
            fs.writeFileSync(this.userConfigPath, JSON.stringify(userConfig, null, 2));
            console.log('Configuration saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save configuration:', error);
            return false;
        }
    }

    extractUserConfig() {
        // Only save non-default values to user config
        const defaultConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
        const userConfig = {};
        
        const extractDiff = (defaultObj, currentObj, path = '') => {
            for (const key in currentObj) {
                const currentPath = path ? `${path}.${key}` : key;
                const defaultValue = this.getNestedValue(defaultObj, currentPath);
                const currentValue = currentObj[key];
                
                if (JSON.stringify(defaultValue) !== JSON.stringify(currentValue)) {
                    if (typeof currentValue === 'object' && !Array.isArray(currentValue)) {
                        const nested = {};
                        extractDiff(defaultObj[key] || {}, currentValue, currentPath);
                        if (Object.keys(nested).length > 0) {
                            this.setNestedValue(userConfig, currentPath, nested);
                        }
                    } else {
                        this.setNestedValue(userConfig, currentPath, currentValue);
                    }
                }
            }
        };
        
        extractDiff(defaultConfig, this.config);
        return userConfig;
    }

    getNestedValue(obj, path) {
        const keys = path.split('.');
        let value = obj;
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return undefined;
            }
        }
        return value;
    }

    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (!current[key] || typeof current[key] !== 'object') {
                current[key] = {};
            }
            current = current[key];
        }
        
        current[keys[keys.length - 1]] = value;
    }

    reset() {
        try {
            // Remove user config file
            if (fs.existsSync(this.userConfigPath)) {
                fs.unlinkSync(this.userConfigPath);
            }
            
            // Reload default config
            this.loadConfig();
            console.log('Configuration reset to defaults');
            return true;
        } catch (error) {
            console.error('Failed to reset configuration:', error);
            return false;
        }
    }

    // Convenience methods
    getWindowConfig() {
        return this.get('window');
    }

    getEditorConfig() {
        return this.get('editor');
    }

    getViewerConfig() {
        return this.get('viewer');
    }

    getRenderingConfig() {
        return this.get('rendering');
    }

    getLightingConfig() {
        return this.get('lighting');
    }

    getDevelopmentConfig() {
        return this.get('development');
    }

    getExportConfig() {
        return this.get('export');
    }

    getScriptEnginesConfig() {
        return this.get('scriptEngines');
    }

    getSecurityConfig() {
        return this.get('security');
    }

    getPerformanceConfig() {
        return this.get('performance');
    }

    getUIConfig() {
        return this.get('ui');
    }

    // Validation
    validate() {
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

module.exports = { ConfigManager, getConfigManager };
