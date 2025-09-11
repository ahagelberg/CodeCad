// Geometry Color Constants
// These colors are used throughout the application for 3D geometry rendering
// TODO: Integrate with theme system in the future

export const GEOMETRY_COLORS = {
    // Primary 3D geometry color (cubes, spheres, cylinders, etc.)
    PRIMARY: 0xaa7be8,  // Purple
    
    // 2D geometry color (rectangles, circles, polygons, etc.)
    SECONDARY: 0x00aa00,  // Green
    
    // Extruded geometry color
    EXTRUDED: 0xaa7be8,  // Same as primary for now
    
    // Line geometry color
    LINE: 0xaa7be8,  // Same as primary for now
};

// Light colors for 3D scene
export const LIGHT_COLORS = {
    AMBIENT: 0x404040,  // Gray ambient light
    DIRECTIONAL: 0xffffff,  // White directional light
    POINT: 0xffffff,  // White point light
};

// Grid and helper colors
export const HELPER_COLORS = {
    GRID_CENTER: 0x888888,  // Gray center lines
    GRID_LINES: 0xcccccc,  // Light gray grid lines
};

// Default colors for different geometry types
export const DEFAULT_GEOMETRY_COLORS = {
    CUBE: GEOMETRY_COLORS.PRIMARY,
    SPHERE: GEOMETRY_COLORS.PRIMARY,
    CYLINDER: GEOMETRY_COLORS.PRIMARY,
    RECTANGLE: GEOMETRY_COLORS.SECONDARY,
    CIRCLE: GEOMETRY_COLORS.SECONDARY,
    POLYGON: GEOMETRY_COLORS.SECONDARY,
    ARC: GEOMETRY_COLORS.SECONDARY,
    LINE: GEOMETRY_COLORS.LINE,
    EXTRUDED: GEOMETRY_COLORS.EXTRUDED,
    ROTATED_EXTRUDED: GEOMETRY_COLORS.EXTRUDED,
};
