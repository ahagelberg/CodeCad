// TypeScript Script Engine
import { BaseEngine } from './base-engine.js';

export class TypeScriptEngine extends BaseEngine {
    constructor() {
        super();
        this.name = 'TypeScript Engine';
        this.version = '1.0.0';
        this.supportedExtensions = ['ts'];
        this.initializeCommands();
    }

    initializeCommands() {
        // Inherit all commands from JavaScript engine
        this.commands.set('cube', {
            description: 'Create a cube',
            syntax: 'cube(size: Vector3 | number, position?: Vector3, rotation?: Vector3, scale?: Vector3 | number)',
            parameters: [
                { name: 'size', type: 'Vector3 | number', description: 'Cube dimensions [x, y, z] or single value' },
                { name: 'position', type: 'Vector3', description: 'Position [x, y, z]', optional: true },
                { name: 'rotation', type: 'Vector3', description: 'Rotation [x, y, z] in radians', optional: true },
                { name: 'scale', type: 'Vector3 | number', description: 'Scale factors [x, y, z] or single value', optional: true }
            ],
            example: 'cube([10, 10, 10], [0, 0, 5])'
        });

        this.commands.set('sphere', {
            description: 'Create a sphere',
            syntax: 'sphere(radius: number, segments?: number, position?: Vector3, rotation?: Vector3, scale?: Vector3 | number)',
            parameters: [
                { name: 'radius', type: 'number', description: 'Sphere radius' },
                { name: 'segments', type: 'number', description: 'Number of segments', optional: true },
                { name: 'position', type: 'Vector3', description: 'Position [x, y, z]', optional: true },
                { name: 'rotation', type: 'Vector3', description: 'Rotation [x, y, z] in radians', optional: true },
                { name: 'scale', type: 'Vector3 | number', description: 'Scale factors [x, y, z] or single value', optional: true }
            ],
            example: 'sphere(5, 32, [0, 0, 0])'
        });

        this.commands.set('cylinder', {
            description: 'Create a cylinder',
            syntax: 'cylinder(radius: number, height: number, segments?: number, position?: Vector3, rotation?: Vector3, scale?: Vector3 | number)',
            parameters: [
                { name: 'radius', type: 'number', description: 'Cylinder radius' },
                { name: 'height', type: 'number', description: 'Cylinder height' },
                { name: 'segments', type: 'number', description: 'Number of segments', optional: true },
                { name: 'position', type: 'Vector3', description: 'Position [x, y, z]', optional: true },
                { name: 'rotation', type: 'Vector3', description: 'Rotation [x, y, z] in radians', optional: true },
                { name: 'scale', type: 'Vector3 | number', description: 'Scale factors [x, y, z] or single value', optional: true }
            ],
            example: 'cylinder(3, 10, 32, [0, 0, 0])'
        });

        this.commands.set('translate', {
            description: 'Translate an object',
            syntax: 'translate(vector: Vector3, object: CADObject): CADObject',
            parameters: [
                { name: 'vector', type: 'Vector3', description: 'Translation vector [x, y, z]' },
                { name: 'object', type: 'CADObject', description: 'Object to translate' }
            ],
            example: 'translate([0, 0, 5], cube([10, 10, 10]))'
        });

        this.commands.set('rotate', {
            description: 'Rotate an object',
            syntax: 'rotate(angles: Vector3, object: CADObject): CADObject',
            parameters: [
                { name: 'angles', type: 'Vector3', description: 'Rotation angles [x, y, z] in radians' },
                { name: 'object', type: 'CADObject', description: 'Object to rotate' }
            ],
            example: 'rotate([0, 0, Math.PI/4], cube([10, 10, 10]))'
        });

        this.commands.set('scale', {
            description: 'Scale an object',
            syntax: 'scale(factors: Vector3 | number, object: CADObject): CADObject',
            parameters: [
                { name: 'factors', type: 'Vector3 | number', description: 'Scale factors [x, y, z] or single value' },
                { name: 'object', type: 'CADObject', description: 'Object to scale' }
            ],
            example: 'scale([2, 2, 2], cube([10, 10, 10]))'
        });

        this.commands.set('union', {
            description: 'Union of objects',
            syntax: 'union(objects: CADObject[]): CADObject',
            parameters: [
                { name: 'objects', type: 'CADObject[]', description: 'Array of objects to union' }
            ],
            example: 'union([cube([10, 10, 10]), sphere(5)])'
        });

        this.commands.set('difference', {
            description: 'Difference of objects',
            syntax: 'difference(objects: CADObject[]): CADObject',
            parameters: [
                { name: 'objects', type: 'CADObject[]', description: 'Array of objects (first - rest)' }
            ],
            example: 'difference([cube([10, 10, 10]), sphere(5)])'
        });

        this.commands.set('intersection', {
            description: 'Intersection of objects',
            syntax: 'intersection(objects: CADObject[]): CADObject',
            parameters: [
                { name: 'objects', type: 'CADObject[]', description: 'Array of objects to intersect' }
            ],
            example: 'intersection([cube([10, 10, 10]), sphere(5)])'
        });
    }

    async execute(script) {
        try {
            // For now, TypeScript engine compiles to JavaScript and executes
            // In a full implementation, you would use the TypeScript compiler
            const compiledScript = await this.compileTypeScript(script);
            
            // Create a safe execution environment with TypeScript types
            const sandbox = this.createTypeScriptSandbox();
            
            // Wrap the script in a function to capture return value
            const wrappedScript = `
                (function() {
                    ${compiledScript}
                })();
            `;
            
            // Execute the compiled script
            const result = new Function('sandbox', `
                with (sandbox) {
                    return ${wrappedScript};
                }
            `)(sandbox);
            
            // Process the result
            const objects = this.processResult(result);
            
            return this.createSuccess(objects);
        } catch (error) {
            console.error('TypeScript execution error:', error);
            return this.createError(error.message);
        }
    }

    async compileTypeScript(script) {
        // Simple TypeScript to JavaScript compilation
        // In a real implementation, you would use the TypeScript compiler API
        
        // Remove type annotations (basic implementation)
        let compiled = script
            .replace(/:\s*[A-Za-z0-9\[\]|&\s]+(?=\s*[=,;\)])/g, '') // Remove type annotations
            .replace(/interface\s+\w+\s*\{[^}]*\}/g, '') // Remove interfaces
            .replace(/type\s+\w+\s*=\s*[^;]+;/g, '') // Remove type aliases
            .replace(/export\s+/g, '') // Remove exports
            .replace(/import\s+.*?from\s+['"][^'"]*['"];?/g, ''); // Remove imports
        
        return compiled;
    }

    createTypeScriptSandbox() {
        const sandbox = {
            // Type definitions (for IDE support, not runtime)
            Vector3: Array,
            CADObject: Object,
            
            // CAD commands (same as JavaScript)
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
            
            // TypeScript specific
            Number: Number,
            String: String,
            Boolean: Boolean,
            
            // Console for debugging
            console: {
                log: (...args) => console.log('[CAD TypeScript]', ...args),
                error: (...args) => console.error('[CAD TypeScript]', ...args),
                warn: (...args) => console.warn('[CAD TypeScript]', ...args)
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
            // Compile TypeScript to check for errors
            const compiled = await this.compileTypeScript(script);
            
            // Basic syntax validation on compiled JavaScript
            new Function(compiled);
            
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
