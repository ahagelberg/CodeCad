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

    initializeAliases() {
        // Define command aliases
        this.addAlias('move', 'translate');
        this.addAlias('square', 'rectangle');
        this.addAlias('box', 'cube');
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

        this.commands.set('export', {
            description: 'Export geometry to file',
            syntax: 'export(filename, format, overwrite)',
            parameters: [
                { name: 'filename', type: 'string', description: 'Output filename' },
                { name: 'format', type: 'string', description: 'Export format (stl, step)', optional: true },
                { name: 'overwrite', type: 'boolean', description: 'Overwrite existing files', optional: true }
            ],
            example: 'export("my_model.stl", "stl", true)'
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
            
            // Aliases
            move: (object, vector) => {
                return this.translate(object, vector);
            },
            box: (...args) => this.createCube(...args),
            
            // Boolean operations
            union: (objects) => this.union(objects),
            difference: (objects) => this.difference(objects),
            intersection: (objects) => this.intersection(objects),
            
            // Export command
            export: (filename, format = 'stl', overwrite = false) => this.exportGeometry(filename, format, overwrite),
            
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
    createCube(size = [1, 1, 1]) {
        console.log('createCube called with:', { size });
        const cube = super.createCube(size);
        console.log('createCube returning:', cube);
        this.generatedGeometry.push(cube);
        console.log('generatedGeometry now has', this.generatedGeometry.length, 'items');
        return cube;
    }

    createSphere(radius = 1, segments = 32) {
        const sphere = super.createSphere(radius, segments);
        this.generatedGeometry.push(sphere);
        return sphere;
    }

    createCylinder(radius = 1, height = 2, segments = 32) {
        const cylinder = super.createCylinder(radius, height, segments);
        this.generatedGeometry.push(cylinder);
        return cylinder;
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

    async exportGeometry(filename, format = 'stl', overwrite = false) {
        try {
            // Validate filename
            if (!filename || typeof filename !== 'string') {
                throw new Error('Export filename must be a non-empty string');
            }

            // Normalize format (case insensitive)
            const normalizedFormat = format.toLowerCase().trim();
            
            // Validate format
            if (!['stl', 'step'].includes(normalizedFormat)) {
                throw new Error('Export format must be "stl" or "step"');
            }

            // Check if we have geometry to export
            if (!this.generatedGeometry || this.generatedGeometry.length === 0) {
                throw new Error('No geometry to export. Create some objects first.');
            }

            // Get the current mesh data from the viewer
            // We need to access the viewer through the app instance
            const app = window.app;
            if (!app || !app.viewer3D) {
                throw new Error('Cannot access 3D viewer for export');
            }

            const meshData = app.viewer3D.getMeshData();
            if (!meshData || meshData.length === 0) {
                throw new Error('No 3D objects available for export');
            }

            // Check file existence if overwrite is false
            if (!overwrite && window.electronAPI) {
                try {
                    // We'll let the main process handle file existence checking
                    // For now, we'll skip this check and let the export proceed
                    // The main process can handle overwrite logic
                    console.log(`[CAD Script] Exporting to: ${filename} (overwrite: ${overwrite})`);
                } catch (error) {
                    // If we can't check file existence, continue with export
                    console.log('Could not check file existence:', error.message);
                }
            }

            // Perform the export based on format
            if (normalizedFormat === 'stl') {
                const { STLExporter } = await import('../../utils/stl-exporter.js');
                const exporter = new STLExporter();
                const stlData = exporter.export(meshData, { 
                    binary: true, 
                    name: 'CodeCAD_Export' 
                });

                if (window.electronAPI) {
                    const result = await window.electronAPI.exportSTL({
                        filePath: filename,
                        stlData: stlData,
                        isBinary: true,
                        overwrite: overwrite
                    });

                    if (!result.success) {
                        throw new Error(result.error);
                    }
                } else {
                    // Fallback for web environment
                    exporter.exportToFile(meshData, filename, { 
                        name: 'CodeCAD_Export' 
                    });
                }

            } else if (normalizedFormat === 'step') {
                const { STEPExporter } = await import('../../utils/step-exporter.js');
                const exporter = new STEPExporter();
                const stepData = exporter.export(meshData, { 
                    name: 'CodeCAD_Export' 
                });

                if (window.electronAPI) {
                    const result = await window.electronAPI.exportSTEP({
                        filePath: filename,
                        stepData: stepData,
                        overwrite: overwrite
                    });

                    if (!result.success) {
                        throw new Error(result.error);
                    }
                } else {
                    // Fallback for web environment
                    exporter.exportToFile(meshData, filename, { 
                        name: 'CodeCAD_Export' 
                    });
                }
            }

            // Log success message
            console.log(`[CAD Script] Successfully exported ${normalizedFormat.toUpperCase()} file: ${filename}`);
            
            return {
                success: true,
                filename: filename,
                format: normalizedFormat,
                message: `Exported ${normalizedFormat.toUpperCase()} file: ${filename}`
            };

        } catch (error) {
            console.log(`[CAD Script] Export failed: ${error.message}`);
            throw error;
        }
    }
}
