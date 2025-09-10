// Base class for all script engines
export class BaseEngine {
    constructor() {
        this.name = 'Base Engine';
        this.version = '1.0.0';
        this.supportedExtensions = [];
        this.commands = new Map();
        this.initializeCommands();
    }

    initializeCommands() {
        // Override in subclasses
    }

    async execute(script) {
        throw new Error('execute() method must be implemented by subclass');
    }

    async validate(script) {
        throw new Error('validate() method must be implemented by subclass');
    }

    getAvailableCommands() {
        return Array.from(this.commands.keys());
    }

    getCommandHelp(command) {
        return this.commands.get(command) || null;
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
    createCube(size = [1, 1, 1], position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
        return {
            type: 'cube',
            size: Array.isArray(size) ? size : [size, size, size],
            position: Array.isArray(position) ? position : [position, 0, 0],
            rotation: Array.isArray(rotation) ? rotation : [0, 0, rotation],
            scale: Array.isArray(scale) ? scale : [scale, scale, scale],
            color: 0x007acc,
            transparent: false,
            opacity: 1.0
        };
    }

    createSphere(radius = 1, segments = 32, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
        return {
            type: 'sphere',
            radius: radius,
            segments: segments,
            position: Array.isArray(position) ? position : [position, 0, 0],
            rotation: Array.isArray(rotation) ? rotation : [0, 0, rotation],
            scale: Array.isArray(scale) ? scale : [scale, scale, scale],
            color: 0x007acc,
            transparent: false,
            opacity: 1.0
        };
    }

    createCylinder(radius = 1, height = 2, segments = 32, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
        return {
            type: 'cylinder',
            radius: radius,
            height: height,
            segments: segments,
            position: Array.isArray(position) ? position : [position, 0, 0],
            rotation: Array.isArray(rotation) ? rotation : [0, 0, rotation],
            scale: Array.isArray(scale) ? scale : [scale, scale, scale],
            color: 0x007acc,
            transparent: false,
            opacity: 1.0
        };
    }

    // Transformation functions
    translate(vector, object) {
        if (!object) return object;
        
        const newObject = { ...object };
        newObject.position = [
            (newObject.position[0] || 0) + (vector[0] || 0),
            (newObject.position[1] || 0) + (vector[1] || 0),
            (newObject.position[2] || 0) + (vector[2] || 0)
        ];
        return newObject;
    }

    rotate(angles, object) {
        if (!object) return object;
        
        const newObject = { ...object };
        newObject.rotation = [
            (newObject.rotation[0] || 0) + (angles[0] || 0),
            (newObject.rotation[1] || 0) + (angles[1] || 0),
            (newObject.rotation[2] || 0) + (angles[2] || 0)
        ];
        return newObject;
    }

    scale(factors, object) {
        if (!object) return object;
        
        const newObject = { ...object };
        newObject.scale = [
            (newObject.scale[0] || 1) * (factors[0] || 1),
            (newObject.scale[1] || 1) * (factors[1] || 1),
            (newObject.scale[2] || 1) * (factors[2] || 1)
        ];
        return newObject;
    }

    // Boolean operations (placeholder - will be implemented with proper CSG)
    union(objects) {
        return {
            type: 'union',
            objects: objects,
            color: 0x007acc,
            transparent: false,
            opacity: 1.0
        };
    }

    difference(objects) {
        return {
            type: 'difference',
            objects: objects,
            color: 0x007acc,
            transparent: false,
            opacity: 1.0
        };
    }

    intersection(objects) {
        return {
            type: 'intersection',
            objects: objects,
            color: 0x007acc,
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
