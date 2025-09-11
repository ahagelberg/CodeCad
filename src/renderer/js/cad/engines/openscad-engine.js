// OpenSCAD Script Engine
import { BaseEngine } from './base-engine.js';

export class OpenSCADEngine extends BaseEngine {
    constructor() {
        super();
        this.name = 'OpenSCAD Engine';
        this.version = '1.0.0';
        this.supportedExtensions = ['scad'];
        this.initializeCommands();
    }

    initializeCommands() {
        // OpenSCAD commands
        this.commands.set('cube', {
            description: 'Create a cube',
            syntax: 'cube(size, center)',
            parameters: [
                { name: 'size', type: 'array|number', description: 'Cube dimensions [x, y, z] or single value' },
                { name: 'center', type: 'boolean', description: 'Center the cube', optional: true }
            ],
            example: 'cube([10, 10, 10], center=true)'
        });

        this.commands.set('sphere', {
            description: 'Create a sphere',
            syntax: 'sphere(r, d, $fn)',
            parameters: [
                { name: 'r', type: 'number', description: 'Sphere radius', optional: true },
                { name: 'd', type: 'number', description: 'Sphere diameter', optional: true },
                { name: '$fn', type: 'number', description: 'Number of fragments', optional: true }
            ],
            example: 'sphere(r=5, $fn=32)'
        });

        this.commands.set('cylinder', {
            description: 'Create a cylinder',
            syntax: 'cylinder(h, r, r1, r2, d, d1, d2, center, $fn)',
            parameters: [
                { name: 'h', type: 'number', description: 'Cylinder height' },
                { name: 'r', type: 'number', description: 'Cylinder radius', optional: true },
                { name: 'r1', type: 'number', description: 'Bottom radius', optional: true },
                { name: 'r2', type: 'number', description: 'Top radius', optional: true },
                { name: 'd', type: 'number', description: 'Cylinder diameter', optional: true },
                { name: 'd1', type: 'number', description: 'Bottom diameter', optional: true },
                { name: 'd2', type: 'number', description: 'Top diameter', optional: true },
                { name: 'center', type: 'boolean', description: 'Center the cylinder', optional: true },
                { name: '$fn', type: 'number', description: 'Number of fragments', optional: true }
            ],
            example: 'cylinder(h=10, r=3, $fn=32)'
        });

        this.commands.set('translate', {
            description: 'Translate an object',
            syntax: 'translate([x, y, z]) { ... }',
            parameters: [
                { name: 'vector', type: 'array', description: 'Translation vector [x, y, z]' }
            ],
            example: 'translate([0, 0, 5]) { cube([10, 10, 10]); }'
        });

        this.commands.set('rotate', {
            description: 'Rotate an object',
            syntax: 'rotate([x, y, z]) { ... }',
            parameters: [
                { name: 'angles', type: 'array', description: 'Rotation angles [x, y, z] in degrees' }
            ],
            example: 'rotate([0, 0, 45]) { cube([10, 10, 10]); }'
        });

        this.commands.set('scale', {
            description: 'Scale an object',
            syntax: 'scale([x, y, z]) { ... }',
            parameters: [
                { name: 'factors', type: 'array', description: 'Scale factors [x, y, z]' }
            ],
            example: 'scale([2, 2, 2]) { cube([10, 10, 10]); }'
        });

        this.commands.set('union', {
            description: 'Union of objects',
            syntax: 'union() { ... }',
            parameters: [],
            example: 'union() { cube([10, 10, 10]); sphere(5); }'
        });

        this.commands.set('difference', {
            description: 'Difference of objects',
            syntax: 'difference() { ... }',
            parameters: [],
            example: 'difference() { cube([10, 10, 10]); sphere(5); }'
        });

        this.commands.set('intersection', {
            description: 'Intersection of objects',
            syntax: 'intersection() { ... }',
            parameters: [],
            example: 'intersection() { cube([10, 10, 10]); sphere(5); }'
        });
    }

    async execute(script) {
        try {
            // Parse OpenSCAD script and convert to JavaScript
            const parsedScript = this.parseOpenSCAD(script);
            
            // Create a safe execution environment
            const sandbox = this.createOpenSCADSandbox();
            
            // Execute the converted script
            const result = new Function('sandbox', `
                with (sandbox) {
                    return ${parsedScript};
                }
            `)(sandbox);
            
            // Process the result
            const objects = this.processResult(result);
            
            return this.createSuccess(objects);
        } catch (error) {
            console.log('OpenSCAD execution error:', error);
            return this.createError(error.message);
        }
    }

    parseOpenSCAD(script) {
        // Simple OpenSCAD to JavaScript transpiler
        // This is a basic implementation - a full implementation would be much more complex
        
        let converted = script;
        
        // Convert OpenSCAD syntax to JavaScript function calls
        converted = converted
            // Convert cube() calls
            .replace(/cube\s*\(\s*\[\s*([^,]+),\s*([^,]+),\s*([^\]]+)\s*\]\s*(?:,\s*center\s*=\s*(true|false))?\s*\)/g, 
                (match, x, y, z, center) => {
                    const centerOffset = center === 'true' ? `, [${x}/2, ${y}/2, ${z}/2]` : '';
                    return `cube([${x}, ${y}, ${z}]${centerOffset})`;
                })
            .replace(/cube\s*\(\s*([^,)]+)\s*(?:,\s*center\s*=\s*(true|false))?\s*\)/g,
                (match, size, center) => {
                    const centerOffset = center === 'true' ? `, [${size}/2, ${size}/2, ${size}/2]` : '';
                    return `cube([${size}, ${size}, ${size}]${centerOffset})`;
                })
            
            // Convert sphere() calls
            .replace(/sphere\s*\(\s*r\s*=\s*([^,)]+)(?:,\s*\$fn\s*=\s*([^,)]+))?\s*\)/g,
                (match, r, fn) => {
                    return `sphere(${r}${fn ? `, ${fn}` : ''})`;
                })
            .replace(/sphere\s*\(\s*([^,)]+)(?:,\s*\$fn\s*=\s*([^,)]+))?\s*\)/g,
                (match, r, fn) => {
                    return `sphere(${r}${fn ? `, ${fn}` : ''})`;
                })
            
            // Convert cylinder() calls
            .replace(/cylinder\s*\(\s*h\s*=\s*([^,)]+)(?:,\s*r\s*=\s*([^,)]+))?(?:,\s*\$fn\s*=\s*([^,)]+))?\s*\)/g,
                (match, h, r, fn) => {
                    return `cylinder(${r || 1}, ${h}${fn ? `, ${fn}` : ''})`;
                })
            
            // Convert translate() blocks
            .replace(/translate\s*\(\s*\[\s*([^,]+),\s*([^,]+),\s*([^\]]+)\s*\]\s*\)\s*\{\s*([^}]+)\s*\}/g,
                (match, x, y, z, content) => {
                    return `translate([${x}, ${y}, ${z}], ${content.trim()})`;
                })
            
            // Convert rotate() blocks
            .replace(/rotate\s*\(\s*\[\s*([^,]+),\s*([^,]+),\s*([^\]]+)\s*\]\s*\)\s*\{\s*([^}]+)\s*\}/g,
                (match, x, y, z, content) => {
                    // Convert degrees to radians
                    return `rotate([${x} * Math.PI / 180, ${y} * Math.PI / 180, ${z} * Math.PI / 180], ${content.trim()})`;
                })
            
            // Convert scale() blocks
            .replace(/scale\s*\(\s*\[\s*([^,]+),\s*([^,]+),\s*([^\]]+)\s*\]\s*\)\s*\{\s*([^}]+)\s*\}/g,
                (match, x, y, z, content) => {
                    return `scale([${x}, ${y}, ${z}], ${content.trim()})`;
                })
            
            // Convert union() blocks
            .replace(/union\s*\(\s*\)\s*\{\s*([^}]+)\s*\}/g,
                (match, content) => {
                    return `union([${content.trim()}])`;
                })
            
            // Convert difference() blocks
            .replace(/difference\s*\(\s*\)\s*\{\s*([^}]+)\s*\}/g,
                (match, content) => {
                    return `difference([${content.trim()}])`;
                })
            
            // Convert intersection() blocks
            .replace(/intersection\s*\(\s*\)\s*\{\s*([^}]+)\s*\}/g,
                (match, content) => {
                    return `intersection([${content.trim()}])`;
                })
            
            // Convert semicolons to commas for array elements
            .replace(/;\s*(?=\s*[a-zA-Z])/g, ', ')
            .replace(/;\s*$/g, '');
        
        return converted;
    }

    createOpenSCADSandbox() {
        const sandbox = {
            // 3D CAD commands
            cube: (...args) => this.createCube(...args),
            sphere: (...args) => this.createSphere(...args),
            cylinder: (...args) => this.createCylinder(...args),
            
            // 2D CAD commands
            square: (...args) => this.createRectangle(...args),
            rectangle: (...args) => this.createRectangle(...args),
            circle: (...args) => this.createCircle(...args),
            polygon: (...args) => this.createPolygon(...args),
            arc: (...args) => this.createArc(...args),
            line: (...args) => this.createLine(...args),
            
            // Extrusion commands
            linear_extrude: (...args) => this.linearExtrude(...args),
            rotate_extrude: (...args) => this.rotateExtrude(...args),
            
            // 2D Operations
            offset: (...args) => this.offset(...args),
            fillet: (...args) => this.fillet(...args),
            chamfer: (...args) => this.chamfer(...args),
            
            // Transformations - modify objects in place
            translate: (object, vector) => {
                return this.translate(object, vector);
            },
            rotate: (object, angles) => {
                return this.rotate(object, angles);
            },
            scale: (object, factors) => {
                return this.scale(object, factors);
            },
            
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
                log: (...args) => console.log('[CAD OpenSCAD]', ...args),
                error: (...args) => console.log('[CAD OpenSCAD Error]', ...args),
                warn: (...args) => console.warn('[CAD OpenSCAD]', ...args)
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

    // Override 2D primitive methods to add geometry to generatedGeometry array
    createRectangle(width = 1, height = 1) {
        const rectangle = super.createRectangle(width, height);
        this.generatedGeometry.push(rectangle);
        return rectangle;
    }

    createCircle(radius = 1, segments = 32) {
        const circle = super.createCircle(radius, segments);
        this.generatedGeometry.push(circle);
        return circle;
    }

    createPolygon(points = [[0, 0], [1, 0], [0.5, 1]]) {
        const polygon = super.createPolygon(points);
        this.generatedGeometry.push(polygon);
        return polygon;
    }

    createArc(radius = 1, startAngle = 0, endAngle = Math.PI, segments = 32) {
        const arc = super.createArc(radius, startAngle, endAngle, segments);
        this.generatedGeometry.push(arc);
        return arc;
    }

    createLine(startPoint = [0, 0], endPoint = [1, 0]) {
        const line = super.createLine(startPoint, endPoint);
        this.generatedGeometry.push(line);
        return line;
    }

    // Override extrusion methods
    linearExtrude(shape, height = 1, twist = 0, slices = 1, center = false) {
        const extruded = super.linearExtrude(shape, height, twist, slices, center);
        this.generatedGeometry.push(extruded);
        return extruded;
    }

    rotateExtrude(shape, angle = 2 * Math.PI, segments = 32) {
        const rotated = super.rotateExtrude(shape, angle, segments);
        this.generatedGeometry.push(rotated);
        return rotated;
    }

    // Override 2D operation methods
    offset(shape, distance = 0.1, joinType = 'round', miterLimit = 1) {
        const offset = super.offset(shape, distance, joinType, miterLimit);
        this.generatedGeometry.push(offset);
        return offset;
    }

    fillet(shape, radius = 0.1) {
        const fillet = super.fillet(shape, radius);
        this.generatedGeometry.push(fillet);
        return fillet;
    }

    chamfer(shape, distance = 0.1) {
        const chamfer = super.chamfer(shape, distance);
        this.generatedGeometry.push(chamfer);
        return chamfer;
    }

    async validate(script) {
        try {
            // Basic OpenSCAD syntax validation
            const parsed = this.parseOpenSCAD(script);
            
            // Validate the converted JavaScript
            new Function(parsed);
            
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
