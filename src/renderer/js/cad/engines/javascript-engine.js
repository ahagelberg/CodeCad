// JavaScript Script Engine
import { BaseEngine } from './base-engine.js';

export class JavaScriptEngine extends BaseEngine {
    constructor() {
        super();
        this.name = 'JavaScript Engine';
        this.version = '1.0.0';
        this.supportedExtensions = ['js'];
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
            // Create a safe execution environment
            const sandbox = this.createSandbox();
            
            // Wrap the script in a function to capture return value
            const wrappedScript = `
                (function() {
                    ${script}
                })();
            `;
            
            // Execute the script
            const result = new Function('sandbox', `
                with (sandbox) {
                    return ${wrappedScript};
                }
            `)(sandbox);
            
            // Process the result
            const objects = this.processResult(result);
            
            return this.createSuccess(objects);
        } catch (error) {
            console.error('JavaScript execution error:', error);
            return this.createError(error.message);
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
                error: (...args) => console.error('[CAD Script]', ...args),
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

    async validate(script) {
        try {
            // Basic syntax validation
            new Function(script);
            return { valid: true, errors: [] };
        } catch (error) {
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
