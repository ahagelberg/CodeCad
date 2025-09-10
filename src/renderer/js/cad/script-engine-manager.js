// Script Engine Manager - Manages multiple language engines
import { JavaScriptEngine } from './engines/javascript-engine.js';
import { TypeScriptEngine } from './engines/typescript-engine.js';
import { OpenSCADEngine } from './engines/openscad-engine.js';

export class ScriptEngineManager {
    constructor() {
        this.engines = new Map();
        this.currentEngine = null;
        this.currentLanguage = 'javascript';
        
        this.initializeEngines();
    }

    initializeEngines() {
        // Register available engines
        this.engines.set('javascript', new JavaScriptEngine());
        this.engines.set('typescript', new TypeScriptEngine());
        this.engines.set('openscad', new OpenSCADEngine());
        
        // Set default engine
        this.currentEngine = this.engines.get(this.currentLanguage);
    }

    setLanguage(language) {
        if (this.currentLanguage === language) return;
        
        const engine = this.engines.get(language);
        if (!engine) {
            console.warn(`Language engine not found: ${language}`);
            return;
        }
        
        this.currentLanguage = language;
        this.currentEngine = engine;
        
        console.log(`Switched to ${language} engine`);
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    getCurrentEngine() {
        return this.currentEngine;
    }

    async execute(script) {
        if (!this.currentEngine) {
            throw new Error('No script engine available');
        }

        try {
            const startTime = performance.now();
            const result = await this.currentEngine.execute(script);
            const endTime = performance.now();
            
            result.renderTime = endTime - startTime;
            return result;
        } catch (error) {
            console.error('Script execution error:', error);
            return {
                success: false,
                error: error.message,
                objects: []
            };
        }
    }

    getSupportedLanguages() {
        return Array.from(this.engines.keys());
    }

    getEngineInfo(language) {
        const engine = this.engines.get(language);
        return engine ? engine.getInfo() : null;
    }

    // Validate script syntax
    async validate(script) {
        if (!this.currentEngine) {
            return { valid: false, errors: ['No script engine available'] };
        }

        return await this.currentEngine.validate(script);
    }

    // Get available commands for current language
    getAvailableCommands() {
        if (!this.currentEngine) {
            return [];
        }

        return this.currentEngine.getAvailableCommands();
    }

    // Get command help
    getCommandHelp(command) {
        if (!this.currentEngine) {
            return null;
        }

        return this.currentEngine.getCommandHelp(command);
    }
}
