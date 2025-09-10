/**
 * Theme Manager for 3D Scene
 * Manages different visual themes for the 3D viewer
 */
export class ThemeManager {
    constructor() {
        this.currentTheme = 'light';
        this.themes = {
            light: {
                name: 'Light',
                background: {
                    type: 'gradient',
                    top: '#f8f8f8',
                    bottom: '#e8e8e8'
                },
                grid: {
                    centerLine: '#888888',
                    gridLine: '#cccccc'
                },
                axes: {
                    x: '#ff0000',  // Red
                    y: '#00ff00',  // Green
                    z: '#0000ff'   // Blue
                },
                defaultMaterial: {
                    color: '#007acc',
                    shininess: 30
                }
            },
            dark: {
                name: 'Dark',
                background: {
                    type: 'gradient',
                    top: '#2a2a2a',
                    bottom: '#1a1a1a'
                },
                grid: {
                    centerLine: '#666666',
                    gridLine: '#444444'
                },
                axes: {
                    x: '#ff4444',  // Light Red
                    y: '#44ff44',  // Light Green
                    z: '#4444ff'   // Light Blue
                },
                defaultMaterial: {
                    color: '#00aaff',
                    shininess: 30
                }
            },
            blue: {
                name: 'Blue',
                background: {
                    type: 'gradient',
                    top: '#e6f3ff',
                    bottom: '#cce6ff'
                },
                grid: {
                    centerLine: '#6699cc',
                    gridLine: '#99bbdd'
                },
                axes: {
                    x: '#ff0000',  // Red
                    y: '#00ff00',  // Green
                    z: '#0000ff'   // Blue
                },
                defaultMaterial: {
                    color: '#0066cc',
                    shininess: 30
                }
            },
            green: {
                name: 'Green',
                background: {
                    type: 'gradient',
                    top: '#e6ffe6',
                    bottom: '#ccffcc'
                },
                grid: {
                    centerLine: '#66cc66',
                    gridLine: '#99dd99'
                },
                axes: {
                    x: '#ff0000',  // Red
                    y: '#00ff00',  // Green
                    z: '#0000ff'   // Blue
                },
                defaultMaterial: {
                    color: '#00cc66',
                    shininess: 30
                }
            },
            orange: {
                name: 'Orange',
                background: {
                    type: 'gradient',
                    top: '#fff0e6',
                    bottom: '#ffe0cc'
                },
                grid: {
                    centerLine: '#cc9966',
                    gridLine: '#ddbb99'
                },
                axes: {
                    x: '#ff0000',  // Red
                    y: '#00ff00',  // Green
                    z: '#0000ff'   // Blue
                },
                defaultMaterial: {
                    color: '#ff6600',
                    shininess: 30
                }
            }
        };
    }

    getCurrentTheme() {
        return this.themes[this.currentTheme];
    }

    setTheme(themeName) {
        if (this.themes[themeName]) {
            this.currentTheme = themeName;
            return true;
        }
        return false;
    }

    getAvailableThemes() {
        return Object.keys(this.themes).map(key => ({
            id: key,
            name: this.themes[key].name
        }));
    }

    createBackgroundTexture(theme) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        if (theme.background.type === 'gradient') {
            const gradient = context.createLinearGradient(0, 0, 0, 256);
            gradient.addColorStop(0, theme.background.top);
            gradient.addColorStop(1, theme.background.bottom);
            context.fillStyle = gradient;
        } else {
            context.fillStyle = theme.background.color;
        }
        
        context.fillRect(0, 0, 256, 256);
        return new THREE.CanvasTexture(canvas);
    }

    createGridHelper(theme, size = 20, divisions = 20) {
        return new THREE.GridHelper(
            size, 
            divisions, 
            theme.grid.centerLine, 
            theme.grid.gridLine
        );
    }

    createAxesHelper(theme, size = 5) {
        const axesHelper = new THREE.AxesHelper(size);
        
        // Set custom colors for axes
        const axesGeometry = axesHelper.geometry;
        const axesColors = [
            theme.axes.x, // X axis - Red
            theme.axes.y, // Y axis - Green  
            theme.axes.z  // Z axis - Blue
        ];
        
        // Create color attribute for axes
        const colors = [];
        for (let i = 0; i < axesGeometry.attributes.position.count; i++) {
            const axisIndex = Math.floor(i / 2); // Each axis has 2 vertices
            colors.push(axesColors[axisIndex % 3]);
        }
        
        axesGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        axesHelper.material.vertexColors = true;
        
        return axesHelper;
    }

    createDefaultMaterial(theme) {
        return new THREE.MeshPhongMaterial({
            color: theme.defaultMaterial.color,
            shininess: theme.defaultMaterial.shininess
        });
    }

    getMaterialColor(theme, customColor = null) {
        return customColor || theme.defaultMaterial.color;
    }
}

// Export singleton instance
export const themeManager = new ThemeManager();
