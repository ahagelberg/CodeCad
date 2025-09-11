// File Manager - Handles file operations
export class FileManager {
    constructor() {
        this.currentFile = null;
        this.isDirty = false;
        this.lastUsedDirectory = null;
        this.loadLastUsedDirectory();
        this.initializeLastUsedDirectory();
    }

    async initializeLastUsedDirectory() {
        try {
            // Get user's Documents folder as default
            if (window.electronAPI) {
                const result = await window.electronAPI.getUserDocumentsPath();
                if (result.success) {
                    this.lastUsedDirectory = result.path;
                }
            }
        } catch (error) {
            console.warn('Could not get Documents path:', error);
        }
    }

    getLastUsedDirectory() {
        return this.lastUsedDirectory;
    }

    setLastUsedDirectory(directory) {
        this.lastUsedDirectory = directory;
        // Store in localStorage for persistence
        if (directory) {
            localStorage.setItem('code-cad-last-directory', directory);
        }
    }

    loadLastUsedDirectory() {
        const stored = localStorage.getItem('code-cad-last-directory');
        if (stored) {
            this.lastUsedDirectory = stored;
        }
    }

    async readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    async saveFile(filePath, content) {
        if (window.electronAPI) {
            // Use Electron API for file operations
            const result = await window.electronAPI.saveFile(filePath, content);
            if (result.success) {
                this.currentFile = filePath;
                this.isDirty = false;
                return result;
            } else {
                throw new Error(result.error);
            }
        } else {
            // Fallback for web environment
            this.downloadFile(content, filePath);
            return { success: true };
        }
    }

    downloadFile(content, filename) {
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    setCurrentFile(filePath) {
        this.currentFile = filePath;
    }

    getCurrentFile() {
        return this.currentFile;
    }

    setDirty(dirty) {
        this.isDirty = dirty;
    }

    isFileDirty() {
        return this.isDirty;
    }

    getFileExtension(filename) {
        return filename.split('.').pop().toLowerCase();
    }

    getLanguageFromExtension(extension) {
        const languageMap = {
            'js': 'javascript',
            'ts': 'typescript',
            'scad': 'openscad',
            'cad': 'javascript'
        };
        return languageMap[extension] || 'javascript';
    }

    getLanguageFromFilename(filename) {
        const extension = this.getFileExtension(filename);
        return this.getLanguageFromExtension(extension);
    }

    // Export functions
    async exportSTL(meshData, filename = 'model.stl') {
        if (window.electronAPI) {
            const result = await window.electronAPI.exportSTL(filename, meshData);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        } else {
            // Fallback for web environment
            this.downloadSTL(meshData, filename);
            return { success: true };
        }
    }

    async exportSTEP(geometryData, filename = 'model.step') {
        if (window.electronAPI) {
            const result = await window.electronAPI.exportSTEP(filename, geometryData);
            if (!result.success) {
                throw new Error(result.error);
            }
            return result;
        } else {
            // Fallback for web environment
            this.downloadSTEP(geometryData, filename);
            return { success: true };
        }
    }

    downloadSTL(meshData, filename) {
        // Convert mesh data to STL format
        const stlContent = this.convertToSTL(meshData);
        const blob = new Blob([stlContent], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    downloadSTEP(geometryData, filename) {
        // Convert geometry data to STEP format
        const stepContent = this.convertToSTEP(geometryData);
        const blob = new Blob([stepContent], { type: 'application/step' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    convertToSTL(meshData) {
        // Simple STL conversion
        let stl = 'solid model\n';
        
        for (const mesh of meshData) {
            const geometry = mesh.geometry;
            const position = mesh.position;
            
            // Get vertices and faces
            const vertices = geometry.attributes.position.array;
            const indices = geometry.index ? geometry.index.array : null;
            
            if (indices) {
                // Indexed geometry
                for (let i = 0; i < indices.length; i += 3) {
                    const i1 = indices[i] * 3;
                    const i2 = indices[i + 1] * 3;
                    const i3 = indices[i + 2] * 3;
                    
                    const v1 = [vertices[i1], vertices[i1 + 1], vertices[i1 + 2]];
                    const v2 = [vertices[i2], vertices[i2 + 1], vertices[i2 + 2]];
                    const v3 = [vertices[i3], vertices[i3 + 1], vertices[i3 + 2]];
                    
                    // Calculate normal
                    const normal = this.calculateNormal(v1, v2, v3);
                    
                    // Add to STL
                    stl += `  facet normal ${normal[0]} ${normal[1]} ${normal[2]}\n`;
                    stl += `    outer loop\n`;
                    stl += `      vertex ${v1[0]} ${v1[1]} ${v1[2]}\n`;
                    stl += `      vertex ${v2[0]} ${v2[1]} ${v2[2]}\n`;
                    stl += `      vertex ${v3[0]} ${v3[1]} ${v3[2]}\n`;
                    stl += `    endloop\n`;
                    stl += `  endfacet\n`;
                }
            }
        }
        
        stl += 'endsolid model\n';
        return stl;
    }

    convertToSTEP(geometryData) {
        // Simple STEP conversion (placeholder)
        let step = 'ISO-10303-21;\n';
        step += 'HEADER;\n';
        step += 'FILE_DESCRIPTION(("STEP AP214"),"2;1");\n';
        step += 'FILE_NAME("model.step","2024-01-01T00:00:00",("Code CAD"),("Code CAD"),"Code CAD v1.0","Code CAD v1.0","Code CAD v1.0");\n';
        step += 'FILE_SCHEMA(("AUTOMOTIVE_DESIGN"));\n';
        step += 'ENDSEC;\n';
        step += 'DATA;\n';
        
        // Add geometry data
        for (let i = 0; i < geometryData.length; i++) {
            const geom = geometryData[i];
            step += `#${i + 1} = CARTESIAN_POINT('Origin',(0.0,0.0,0.0));\n`;
        }
        
        step += 'ENDSEC;\n';
        step += 'END-ISO-10303-21;\n';
        return step;
    }

    calculateNormal(v1, v2, v3) {
        // Calculate face normal
        const u = [v2[0] - v1[0], v2[1] - v1[1], v2[2] - v1[2]];
        const v = [v3[0] - v1[0], v3[1] - v1[1], v3[2] - v1[2]];
        
        const normal = [
            u[1] * v[2] - u[2] * v[1],
            u[2] * v[0] - u[0] * v[2],
            u[0] * v[1] - u[1] * v[0]
        ];
        
        // Normalize
        const length = Math.sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2]);
        if (length > 0) {
            normal[0] /= length;
            normal[1] /= length;
            normal[2] /= length;
        }
        
        return normal;
    }
}
