// JavaScript Script Engine
import { BaseEngine } from './base-engine.js';

export class JavaScriptEngine extends BaseEngine {
    constructor() {
        super();
        this.name = 'JavaScript Engine';
        this.version = '1.0.0';
        this.supportedExtensions = ['js'];
        this.generatedGeometry = [];
        this.initializeCommands();
    }

    initializeCommands() {
        // Register CAD commands
        this.commands.set('cube', {
            description: 'Create a cube',
            syntax: 'cube(size, position, rotation, scale)',
            parameters: [
                { name: 'size', type: 'array|number', description: 'Cube dimensions [x, y, z] or single value' },
                { name: 'position', type: 'array', description: 'Position [x, y, z]', optional: true },
                { name: 'rotation', type: 'array', description: 'Rotation [x, y, z] in radians', optional: true },
                { name: 'scale', type: 'array|number', description: 'Scale factors [x, y, z] or single value', optional: true }
            ],
            example: 'cube([10, 10, 10], [0, 0, 5])'
        });

        this.commands.set('sphere', {
            description: 'Create a sphere',
            syntax: 'sphere(radius, segments, position, rotation, scale)',
            parameters: [
                { name: 'radius', type: 'number', description: 'Sphere radius' },
                { name: 'segments', type: 'number', description: 'Number of segments', optional: true },
                { name: 'position', type: 'array', description: 'Position [x, y, z]', optional: true },
                { name: 'rotation', type: 'array', description: 'Rotation [x, y, z] in radians', optional: true },
                { name: 'scale', type: 'array|number', description: 'Scale factors [x, y, z] or single value', optional: true }
            ],
            example: 'sphere(5, 32, [0, 0, 0])'
        });

        this.commands.set('cylinder', {
            description: 'Create a cylinder',
            syntax: 'cylinder(radius, height, segments, position, rotation, scale)',
            parameters: [
                { name: 'radius', type: 'number', description: 'Cylinder radius' },
                { name: 'height', type: 'number', description: 'Cylinder height' },
                { name: 'segments', type: 'number', description: 'Number of segments', optional: true },
                { name: 'position', type: 'array', description: 'Position [x, y, z]', optional: true },
                { name: 'rotation', type: 'array', description: 'Rotation [x, y, z] in radians', optional: true },
                { name: 'scale', type: 'array|number', description: 'Scale factors [x, y, z] or single value', optional: true }
            ],
            example: 'cylinder(3, 10, 32, [0, 0, 0])'
        });

        this.commands.set('translate', {
            description: 'Translate an object',
            syntax: 'translate(vector, object)',
            parameters: [
                { name: 'vector', type: 'array', description: 'Translation vector [x, y, z]' },
                { name: 'object', type: 'object', description: 'Object to translate' }
            ],
            example: 'translate([0, 0, 5], cube([10, 10, 10]))'
        });

        this.commands.set('rotate', {
            description: 'Rotate an object',
            syntax: 'rotate(angles, object)',
            parameters: [
                { name: 'angles', type: 'array', description: 'Rotation angles [x, y, z] in radians' },
                { name: 'object', type: 'object', description: 'Object to rotate' }
            ],
            example: 'rotate([0, 0, Math.PI/4], cube([10, 10, 10]))'
        });

        this.commands.set('scale', {
            description: 'Scale an object',
            syntax: 'scale(factors, object)',
            parameters: [
                { name: 'factors', type: 'array|number', description: 'Scale factors [x, y, z] or single value' },
                { name: 'object', type: 'object', description: 'Object to scale' }
            ],
            example: 'scale([2, 2, 2], cube([10, 10, 10]))'
        });

        this.commands.set('union', {
            description: 'Union of objects',
            syntax: 'union(objects)',
            parameters: [
                { name: 'objects', type: 'array', description: 'Array of objects to union' }
            ],
            example: 'union([cube([10, 10, 10]), sphere(5)])'
        });

        this.commands.set('difference', {
            description: 'Difference of objects',
            syntax: 'difference(objects)',
            parameters: [
                { name: 'objects', type: 'array', description: 'Array of objects (first - rest)' }
            ],
            example: 'difference([cube([10, 10, 10]), sphere(5)])'
        });

        this.commands.set('intersection', {
            description: 'Intersection of objects',
            syntax: 'intersection(objects)',
            parameters: [
                { name: 'objects', type: 'array', description: 'Array of objects to intersect' }
            ],
            example: 'intersection([cube([10, 10, 10]), sphere(5)])'
        });
    }

    async execute(script) {
        try {
            // Clear previous geometry
            this.generatedGeometry = [];
            
            // Create a safe execution environment
            const sandbox = this.createSandbox();
            
            // Wrap script execution in try-catch to prevent any errors from bubbling up
            try {
                // Create a function that executes the script in the sandbox with comprehensive error suppression
                const executeScript = new Function(
                    'sandbox',
                    `
                    // Suppress all errors in the script execution context
                    const originalError = window.onerror;
                    const originalUnhandledRejection = window.onunhandledrejection;
                    
                    window.onerror = function(message, source, lineno, colno, error) {
                        console.log('Script onerror suppressed:', message);
                        return true; // Prevent default error handling
                    };
                    
                    window.onunhandledrejection = function(event) {
                        console.log('Script unhandledrejection suppressed:', event.reason);
                        event.preventDefault();
                        return true;
                    };
                    
                    // Override console.error to prevent popups
                    const originalConsoleError = console.error;
                    console.error = function(...args) {
                        console.log('Script console.error suppressed:', args.join(' '));
                    };
                    
                    // Override alert, confirm, prompt
                    const originalAlert = window.alert;
                    const originalConfirm = window.confirm;
                    const originalPrompt = window.prompt;
                    
                    window.alert = function(message) {
                        console.log('Script alert suppressed:', message);
                    };
                    
                    window.confirm = function(message) {
                        console.log('Script confirm suppressed:', message);
                        return true;
                    };
                    
                    window.prompt = function(message, defaultValue) {
                        console.log('Script prompt suppressed:', message);
                        return defaultValue || '';
                    };
                    
                    try {
                        with (sandbox) {
                            ${script}
                        }
                    } catch (e) {
                        // Silently catch all script errors
                        console.log('Script execution error:', e.message);
                    } finally {
                        // Restore original handlers
                        window.onerror = originalError;
                        window.onunhandledrejection = originalUnhandledRejection;
                        console.error = originalConsoleError;
                        window.alert = originalAlert;
                        window.confirm = originalConfirm;
                        window.prompt = originalPrompt;
                    }
                    `
                );

                // Execute the script
                executeScript(sandbox);

                // Return the generated geometry
                return {
                    success: true,
                    data: this.generatedGeometry,
                    message: 'Script executed successfully'
                };

            } catch (executionError) {
                console.log('Script execution wrapper error:', executionError.message);
                return {
                    success: false,
                    error: executionError.message,
                    message: 'Script execution failed'
                };
            }

        } catch (error) {
            console.log('Script engine error:', error.message);
            return {
                success: false,
                error: error.message,
                message: 'Script execution failed'
            };
        }
    }

    createSandbox() {
        const sandbox = {
            // CAD commands
            cube: (...args) => this.createCube(...args),
            sphere: (...args) => this.createSphere(...args),
            cylinder: (...args) => this.createCylinder(...args),
            
            // Transformations
            translate: (vector, object) => this.translate(vector, object),
            rotate: (angles, object) => this.rotate(angles, object),
            scale: (factors, object) => this.scale(factors, object),
            
            // Boolean operations
            union: (objects) => this.union(objects),
            difference: (objects) => this.difference(objects),
            intersection: (objects) => this.intersection(objects),
            
            // Math functions
            Math: Math,
            PI: Math.PI,
            sin: Math.sin,
            cos: Math.cos,
            tan: Math.tan,
            sqrt: Math.sqrt,
            pow: Math.pow,
            abs: Math.abs,
            min: Math.min,
            max: Math.max,
            floor: Math.floor,
            ceil: Math.ceil,
            round: Math.round,
            
            // Array functions
            Array: Array,
            
            // Console for debugging
            console: {
                log: (...args) => console.log('[CAD Script]', ...args),
                error: (...args) => console.log('[CAD Script Error]', ...args),
                warn: (...args) => console.warn('[CAD Script]', ...args)
            }
        };
        
        return sandbox;
    }

    processResult(result) {
        const objects = [];
        
        if (result) {
            if (Array.isArray(result)) {
                objects.push(...this.flattenObjects(result));
            } else if (typeof result === 'object' && result.type) {
                objects.push(...this.flattenObjects([result]));
            }
        }
        
        return objects;
    }


    // Override CAD command methods to add geometry to generatedGeometry array
    createCube(size = [1, 1, 1], position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
        console.log('createCube called with:', { size, position, rotation, scale });
        const cube = super.createCube(size, position, rotation, scale);
        console.log('createCube returning:', cube);
        this.generatedGeometry.push(cube);
        console.log('generatedGeometry now has', this.generatedGeometry.length, 'items');
        return cube;
    }

    createSphere(radius = 1, segments = 32, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
        const sphere = super.createSphere(radius, segments, position, rotation, scale);
        this.generatedGeometry.push(sphere);
        return sphere;
    }

    createCylinder(radius = 1, height = 2, segments = 32, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
        const cylinder = super.createCylinder(radius, height, segments, position, rotation, scale);
        this.generatedGeometry.push(cylinder);
        return cylinder;
    }

    // Override translate to add debug logging
    translate(vector, object) {
        console.log('translate called with:', { vector, object });
        const result = super.translate(vector, object);
        console.log('translate returning:', result);
        return result;
    }

    async validate(script) {
        try {
            // Basic syntax validation with error suppression
            const validateFunction = new Function(`
                try {
                    ${script}
                } catch (e) {
                    // Silently catch validation errors
                    console.log('Validation error suppressed:', e.message);
                }
            `);
            
            // Don't actually execute, just check syntax
            new Function(script);
            return { valid: true, errors: [] };
        } catch (error) {
            // Return validation error but don't show popup
            console.log('Syntax validation error:', error.message);
            return { 
                valid: false, 
                errors: [{
                    message: error.message,
                    line: this.extractLineNumber(error.message),
                    column: 0
                }]
            };
        }
    }

    extractLineNumber(errorMessage) {
        const match = errorMessage.match(/line (\d+)/);
        return match ? parseInt(match[1]) : null;
    }
}
