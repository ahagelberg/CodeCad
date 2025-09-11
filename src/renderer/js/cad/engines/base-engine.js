// Base class for all script engines
import { DEFAULT_GEOMETRY_COLORS } from '../../constants/geometry-colors.js';

export class BaseEngine {
    constructor() {
        this.name = 'Base Engine';
        this.version = '1.0.0';
        this.supportedExtensions = [];
        this.commands = new Map();
        this.aliases = new Map();
        this.initializeCommands();
        this.initializeAliases();
    }

    initializeCommands() {
        // Override in subclasses
    }

    initializeAliases() {
        // Override in subclasses to define aliases
        // Example: this.aliases.set('move', 'translate');
    }

    addAlias(alias, targetCommand) {
        this.aliases.set(alias, targetCommand);
    }

    resolveAlias(command) {
        return this.aliases.get(command) || command;
    }

    async execute(script) {
        throw new Error('execute() method must be implemented by subclass');
    }

    async validate(script) {
        throw new Error('validate() method must be implemented by subclass');
    }

    getAvailableCommands() {
        const commands = Array.from(this.commands.keys());
        const aliasCommands = Array.from(this.aliases.keys());
        return [...commands, ...aliasCommands];
    }

    getCommandHelp(command) {
        const resolvedCommand = this.resolveAlias(command);
        return this.commands.get(resolvedCommand) || null;
    }

    getInfo() {
        return {
            name: this.name,
            version: this.version,
            supportedExtensions: this.supportedExtensions,
            commands: this.getAvailableCommands()
        };
    }

    // Common CAD command implementations
    createCube(size = [1, 1, 1]) {
        return {
            type: 'cube',
            size: Array.isArray(size) ? size : [size, size, size],
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            color: DEFAULT_GEOMETRY_COLORS.CUBE,
            transparent: false,
            opacity: 1.0
        };
    }

    createSphere(radius = 1, segments = 32) {
        return {
            type: 'sphere',
            radius: radius,
            segments: segments,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            color: DEFAULT_GEOMETRY_COLORS.CUBE,
            transparent: false,
            opacity: 1.0
        };
    }

    createCylinder(radius = 1, height = 2, segments = 32) {
        return {
            type: 'cylinder',
            radius: radius,
            height: height,
            segments: segments,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            color: DEFAULT_GEOMETRY_COLORS.CUBE,
            transparent: false,
            opacity: 1.0
        };
    }

    // 2D Primitive functions
    createRectangle(width = 1, height = 1) {
        return {
            type: '2d_rectangle',
            width: width,
            height: height,
            position: [0, 0],
            rotation: 0,
            color: DEFAULT_GEOMETRY_COLORS.RECTANGLE,
            transparent: false,
            opacity: 1.0
        };
    }

    createCircle(radius = 1, segments = 32) {
        return {
            type: '2d_circle',
            radius: radius,
            segments: segments,
            position: [0, 0],
            rotation: 0,
            color: DEFAULT_GEOMETRY_COLORS.RECTANGLE,
            transparent: false,
            opacity: 1.0
        };
    }

    createPolygon(points = [[0, 0], [1, 0], [0.5, 1]]) {
        return {
            type: '2d_polygon',
            points: points,
            position: [0, 0],
            rotation: 0,
            color: DEFAULT_GEOMETRY_COLORS.RECTANGLE,
            transparent: false,
            opacity: 1.0
        };
    }

    createArc(radius = 1, startAngle = 0, endAngle = Math.PI, segments = 32) {
        return {
            type: '2d_arc',
            radius: radius,
            startAngle: startAngle,
            endAngle: endAngle,
            segments: segments,
            position: [0, 0],
            rotation: 0,
            color: DEFAULT_GEOMETRY_COLORS.RECTANGLE,
            transparent: false,
            opacity: 1.0
        };
    }

    createLine(startPoint = [0, 0], endPoint = [1, 0]) {
        return {
            type: '2d_line',
            startPoint: startPoint,
            endPoint: endPoint,
            position: [0, 0],
            rotation: 0,
            color: DEFAULT_GEOMETRY_COLORS.RECTANGLE,
            transparent: false,
            opacity: 1.0
        };
    }

    // Extrusion functions
    linearExtrude(shape, height = 1, twist = 0, slices = 1, center = false) {
        return {
            type: 'extruded',
            shape: shape,
            height: height,
            twist: twist,
            slices: slices,
            center: center,
            color: DEFAULT_GEOMETRY_COLORS.CUBE,
            transparent: false,
            opacity: 1.0
        };
    }

    rotateExtrude(shape, angle = 2 * Math.PI, segments = 32) {
        return {
            type: 'rotated_extruded',
            shape: shape,
            angle: angle,
            segments: segments,
            color: DEFAULT_GEOMETRY_COLORS.CUBE,
            transparent: false,
            opacity: 1.0
        };
    }

    // 2D Operations
    offset(shape, distance = 0.1, joinType = 'round', miterLimit = 1) {
        return {
            type: '2d_offset',
            shape: shape,
            distance: distance,
            joinType: joinType, // 'round', 'square', 'miter'
            miterLimit: miterLimit,
            color: DEFAULT_GEOMETRY_COLORS.RECTANGLE,
            transparent: false,
            opacity: 1.0
        };
    }

    fillet(shape, radius = 0.1) {
        return {
            type: '2d_fillet',
            shape: shape,
            radius: radius,
            color: DEFAULT_GEOMETRY_COLORS.RECTANGLE,
            transparent: false,
            opacity: 1.0
        };
    }

    chamfer(shape, distance = 0.1) {
        return {
            type: '2d_chamfer',
            shape: shape,
            distance: distance,
            color: DEFAULT_GEOMETRY_COLORS.RECTANGLE,
            transparent: false,
            opacity: 1.0
        };
    }

    // Transformation functions - modify objects in place
    translate(object, vector) {
        if (!object) return object;
        
        // Initialize position if it doesn't exist
        if (!object.position) {
            object.position = [0, 0, 0];
        }
        
        // Modify the object in place
        object.position[0] = (object.position[0] || 0) + (vector[0] || 0);
        object.position[1] = (object.position[1] || 0) + (vector[1] || 0);
        object.position[2] = (object.position[2] || 0) + (vector[2] || 0);
        
        return object;
    }

    rotate(object, angles) {
        if (!object) return object;
        
        // Initialize rotation if it doesn't exist
        if (!object.rotation) {
            object.rotation = [0, 0, 0];
        }
        
        // Modify the object in place
        object.rotation[0] = (object.rotation[0] || 0) + (angles[0] || 0);
        object.rotation[1] = (object.rotation[1] || 0) + (angles[1] || 0);
        object.rotation[2] = (object.rotation[2] || 0) + (angles[2] || 0);
        
        return object;
    }

    scale(object, factors) {
        if (!object) return object;
        
        // Initialize scale if it doesn't exist
        if (!object.scale) {
            object.scale = [1, 1, 1];
        }
        
        // Modify the object in place
        object.scale[0] = (object.scale[0] || 1) * (factors[0] || 1);
        object.scale[1] = (object.scale[1] || 1) * (factors[1] || 1);
        object.scale[2] = (object.scale[2] || 1) * (factors[2] || 1);
        
        return object;
    }

    // Boolean operations (placeholder - will be implemented with proper CSG)
    union(objects) {
        return {
            type: 'union',
            objects: objects,
            color: DEFAULT_GEOMETRY_COLORS.CUBE,
            transparent: false,
            opacity: 1.0
        };
    }

    difference(objects) {
        return {
            type: 'difference',
            objects: objects,
            color: DEFAULT_GEOMETRY_COLORS.CUBE,
            transparent: false,
            opacity: 1.0
        };
    }

    intersection(objects) {
        return {
            type: 'intersection',
            objects: objects,
            color: DEFAULT_GEOMETRY_COLORS.CUBE,
            transparent: false,
            opacity: 1.0
        };
    }

    // Utility functions
    flattenObjects(objects) {
        const result = [];
        
        for (const obj of objects) {
            if (obj.type === 'union' || obj.type === 'difference' || obj.type === 'intersection') {
                result.push(...this.flattenObjects(obj.objects));
            } else {
                result.push(obj);
            }
        }
        
        return result;
    }

    // Error handling
    createError(message, line = null, column = null) {
        return {
            success: false,
            error: message,
            line: line,
            column: column,
            objects: []
        };
    }

    createSuccess(objects) {
        return {
            success: true,
            objects: objects,
            error: null
        };
    }
}
