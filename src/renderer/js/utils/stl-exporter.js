// STL Exporter utility for Three.js meshes
import * as THREE from 'three';

export class STLExporter {
    constructor() {
        this.binary = true; // Default to binary format
    }

    /**
     * Export a Three.js mesh to STL format
     * @param {THREE.Mesh|THREE.Group|Array} object - The object(s) to export
     * @param {Object} options - Export options
     * @param {boolean} options.binary - Whether to export as binary (default: true)
     * @param {string} options.name - Name for the solid (default: 'object')
     * @returns {string|ArrayBuffer} - STL data as string (ASCII) or ArrayBuffer (binary)
     */
    export(object, options = {}) {
        const binary = options.binary !== undefined ? options.binary : this.binary;
        const name = options.name || 'object';

        if (binary) {
            return this.exportBinary(object, name);
        } else {
            return this.exportASCII(object, name);
        }
    }

    /**
     * Export as ASCII STL format
     * @param {THREE.Mesh|THREE.Group|Array} object - The object(s) to export
     * @param {string} name - Name for the solid
     * @returns {string} - ASCII STL data
     */
    exportASCII(object, name) {
        let output = `solid ${name}\n`;
        
        const meshes = this.collectMeshes(object);
        
        for (const mesh of meshes) {
            const geometry = mesh.geometry;
            const positionAttribute = geometry.getAttribute('position');
            const indexAttribute = geometry.getIndex();
            
            if (!positionAttribute) continue;
            
            const vertices = [];
            for (let i = 0; i < positionAttribute.count; i++) {
                vertices.push(new THREE.Vector3(
                    positionAttribute.getX(i),
                    positionAttribute.getY(i),
                    positionAttribute.getZ(i)
                ));
            }
            
            // Apply mesh transformations
            const matrix = mesh.matrixWorld;
            vertices.forEach(vertex => {
                vertex.applyMatrix4(matrix);
            });
            
            // Generate triangles
            if (indexAttribute) {
                // Indexed geometry
                for (let i = 0; i < indexAttribute.count; i += 3) {
                    const a = vertices[indexAttribute.getX(i)];
                    const b = vertices[indexAttribute.getX(i + 1)];
                    const c = vertices[indexAttribute.getX(i + 2)];
                    output += this.triangleToASCII(a, b, c);
                }
            } else {
                // Non-indexed geometry
                for (let i = 0; i < vertices.length; i += 3) {
                    const a = vertices[i];
                    const b = vertices[i + 1];
                    const c = vertices[i + 2];
                    output += this.triangleToASCII(a, b, c);
                }
            }
        }
        
        output += `endsolid ${name}\n`;
        return output;
    }

    /**
     * Export as binary STL format
     * @param {THREE.Mesh|THREE.Group|Array} object - The object(s) to export
     * @param {string} name - Name for the solid
     * @returns {ArrayBuffer} - Binary STL data
     */
    exportBinary(object, name) {
        const meshes = this.collectMeshes(object);
        const triangles = [];
        
        // Collect all triangles
        for (const mesh of meshes) {
            const geometry = mesh.geometry;
            const positionAttribute = geometry.getAttribute('position');
            const indexAttribute = geometry.getIndex();
            
            if (!positionAttribute) continue;
            
            const vertices = [];
            for (let i = 0; i < positionAttribute.count; i++) {
                vertices.push(new THREE.Vector3(
                    positionAttribute.getX(i),
                    positionAttribute.getY(i),
                    positionAttribute.getZ(i)
                ));
            }
            
            // Apply mesh transformations
            const matrix = mesh.matrixWorld;
            vertices.forEach(vertex => {
                vertex.applyMatrix4(matrix);
            });
            
            // Generate triangles
            if (indexAttribute) {
                // Indexed geometry
                for (let i = 0; i < indexAttribute.count; i += 3) {
                    const a = vertices[indexAttribute.getX(i)];
                    const b = vertices[indexAttribute.getX(i + 1)];
                    const c = vertices[indexAttribute.getX(i + 2)];
                    triangles.push({ a, b, c });
                }
            } else {
                // Non-indexed geometry
                for (let i = 0; i < vertices.length; i += 3) {
                    const a = vertices[i];
                    const b = vertices[i + 1];
                    const c = vertices[i + 2];
                    triangles.push({ a, b, c });
                }
            }
        }
        
        // Create binary data
        const buffer = new ArrayBuffer(80 + 4 + triangles.length * 50); // 80 header + 4 count + 50 per triangle
        const view = new DataView(buffer);
        
        // Write header (80 bytes, padded with spaces)
        const header = name.padEnd(80, ' ');
        for (let i = 0; i < 80; i++) {
            view.setUint8(i, header.charCodeAt(i));
        }
        
        // Write triangle count
        view.setUint32(80, triangles.length, true); // little-endian
        
        // Write triangles
        let offset = 84;
        for (const triangle of triangles) {
            const normal = this.calculateNormal(triangle.a, triangle.b, triangle.c);
            
            // Write normal (12 bytes)
            view.setFloat32(offset, normal.x, true);
            view.setFloat32(offset + 4, normal.y, true);
            view.setFloat32(offset + 8, normal.z, true);
            
            // Write vertices (36 bytes)
            view.setFloat32(offset + 12, triangle.a.x, true);
            view.setFloat32(offset + 16, triangle.a.y, true);
            view.setFloat32(offset + 20, triangle.a.z, true);
            
            view.setFloat32(offset + 24, triangle.b.x, true);
            view.setFloat32(offset + 28, triangle.b.y, true);
            view.setFloat32(offset + 32, triangle.b.z, true);
            
            view.setFloat32(offset + 36, triangle.c.x, true);
            view.setFloat32(offset + 40, triangle.c.y, true);
            view.setFloat32(offset + 44, triangle.c.z, true);
            
            // Write attribute byte count (2 bytes, usually 0)
            view.setUint16(offset + 48, 0, true);
            
            offset += 50;
        }
        
        return buffer;
    }

    /**
     * Convert triangle to ASCII STL format
     * @param {THREE.Vector3} a - First vertex
     * @param {THREE.Vector3} b - Second vertex
     * @param {THREE.Vector3} c - Third vertex
     * @returns {string} - ASCII triangle data
     */
    triangleToASCII(a, b, c) {
        const normal = this.calculateNormal(a, b, c);
        
        return `  facet normal ${normal.x} ${normal.y} ${normal.z}
    outer loop
      vertex ${a.x} ${a.y} ${a.z}
      vertex ${b.x} ${b.y} ${b.z}
      vertex ${c.x} ${c.y} ${c.z}
    endloop
  endfacet
`;
    }

    /**
     * Calculate normal vector for a triangle
     * @param {THREE.Vector3} a - First vertex
     * @param {THREE.Vector3} b - Second vertex
     * @param {THREE.Vector3} c - Third vertex
     * @returns {THREE.Vector3} - Normal vector
     */
    calculateNormal(a, b, c) {
        const v1 = new THREE.Vector3().subVectors(b, a);
        const v2 = new THREE.Vector3().subVectors(c, a);
        const normal = new THREE.Vector3().crossVectors(v1, v2);
        normal.normalize();
        return normal;
    }

    /**
     * Collect all meshes from an object (recursively)
     * @param {THREE.Object3D|Array} object - The object to traverse
     * @returns {Array} - Array of meshes
     */
    collectMeshes(object) {
        const meshes = [];
        
        if (Array.isArray(object)) {
            object.forEach(obj => {
                meshes.push(...this.collectMeshes(obj));
            });
        } else if (object instanceof THREE.Mesh) {
            meshes.push(object);
        } else if (object instanceof THREE.Group || object instanceof THREE.Object3D) {
            object.traverse(child => {
                if (child instanceof THREE.Mesh) {
                    meshes.push(child);
                }
            });
        }
        
        return meshes;
    }

    /**
     * Export to file (for browser download)
     * @param {THREE.Mesh|THREE.Group|Array} object - The object(s) to export
     * @param {string} filename - Filename for the download
     * @param {Object} options - Export options
     */
    exportToFile(object, filename, options = {}) {
        const data = this.export(object, options);
        const blob = new Blob([data], { 
            type: options.binary ? 'application/octet-stream' : 'text/plain' 
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
}
