// Three.js 3D Viewer
import * as THREE from 'three';

export class Viewer3D {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.canvas = null;
        this.controls = null;
        this.objects = [];
        this.mouseControls = null;
        this.animationId = null;
        
        // Camera settings
        this.cameraDistance = 20;
        this.cameraAngleX = Math.PI / 6; // 30 degrees from above
        this.cameraAngleY = Math.PI / 4; // 45 degrees around
        this.cameraTarget = new THREE.Vector3(0, 0, 0);
        
        // Mouse controls
        this.isMouseDown = false;
        this.mouseX = 0;
        this.mouseY = 0;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
    }

    async initialize() {
        try {
            this.canvas = document.getElementById('three-canvas');
            if (!this.canvas) {
                throw new Error('Canvas element not found');
            }

            // Create scene
            this.scene = new THREE.Scene();
            // Create a subtle gradient background
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const context = canvas.getContext('2d');
            const gradient = context.createLinearGradient(0, 0, 0, 256);
            gradient.addColorStop(0, '#f8f8f8');
            gradient.addColorStop(1, '#e8e8e8');
            context.fillStyle = gradient;
            context.fillRect(0, 0, 256, 256);
            const texture = new THREE.CanvasTexture(canvas);
            this.scene.background = texture;

            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                this.canvas.clientWidth / this.canvas.clientHeight,
                0.1,
                1000
            );
            // Apply the correct angled position immediately
            this.updateCameraPosition();

            // Create renderer
            this.renderer = new THREE.WebGLRenderer({
                canvas: this.canvas,
                antialias: true,
                alpha: false
            });
            
            // Wait for container to be properly sized
            await this.waitForContainerSize();
            
            // Set initial size with bounds checking
            const container = this.canvas.parentElement;
            const initialWidth = Math.max(100, Math.min(container.clientWidth || 800, window.innerWidth));
            const initialHeight = Math.max(100, Math.min(container.clientHeight || 600, window.innerHeight));
            
            
            this.renderer.setSize(initialWidth, initialHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Cap pixel ratio to prevent issues
            
            // Set canvas size to match renderer
            this.canvas.width = initialWidth;
            this.canvas.height = initialHeight;
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Setup lighting
            this.setupLighting();

            // Setup mouse controls
            this.setupMouseControls();

            // Setup resize handling
            this.setupResizeHandler();

            // Start render loop
            this.startRenderLoop();

            // Add default objects for testing
            this.addDefaultObjects();

        } catch (error) {
            console.error('Failed to initialize 3D Viewer:', error);
            throw error;
        }
    }

    setupLighting() {
        // Ambient light - increased intensity
        const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
        ambientLight.userData.isLight = true;
        this.scene.add(ambientLight);

        // Directional light - increased intensity
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 50;
        directionalLight.shadow.camera.left = -10;
        directionalLight.shadow.camera.right = 10;
        directionalLight.shadow.camera.top = 10;
        directionalLight.shadow.camera.bottom = -10;
        directionalLight.userData.isLight = true;
        this.scene.add(directionalLight);

        // Point light - increased intensity
        const pointLight = new THREE.PointLight(0xffffff, 0.8, 100);
        pointLight.position.set(-10, 10, 10);
        pointLight.userData.isLight = true;
        this.scene.add(pointLight);
    }

    setupMouseControls() {
        // Mouse down
        this.canvas.addEventListener('mousedown', (e) => {
            this.isMouseDown = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.canvas.style.cursor = 'grabbing';
        });

        // Mouse move
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isMouseDown) return;

            const deltaX = e.clientX - this.lastMouseX;
            const deltaY = e.clientY - this.lastMouseY;

            // Rotate camera around target
            this.cameraAngleY -= deltaX * 0.01;
            this.cameraAngleX += deltaY * 0.01;

            // Clamp vertical rotation
            this.cameraAngleX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.cameraAngleX));

            this.updateCameraPosition();
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });

        // Mouse up
        this.canvas.addEventListener('mouseup', () => {
            this.isMouseDown = false;
            this.canvas.style.cursor = 'grab';
        });

        // Mouse leave
        this.canvas.addEventListener('mouseleave', () => {
            this.isMouseDown = false;
            this.canvas.style.cursor = 'grab';
        });

        // Wheel zoom
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomSpeed = 0.1;
            this.cameraDistance += e.deltaY * zoomSpeed;
            this.cameraDistance = Math.max(1, Math.min(100, this.cameraDistance));
            this.updateCameraPosition();
        });

        // Right click pan
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });

        // Set initial cursor
        this.canvas.style.cursor = 'grab';
    }

    async waitForContainerSize() {
        return new Promise((resolve) => {
            const container = this.canvas.parentElement;
            if (!container) {
                resolve();
                return;
            }

            const checkSize = () => {
                if (container.clientWidth > 0 && container.clientHeight > 0) {
                    resolve();
                } else {
                    // Wait a bit and try again
                    setTimeout(checkSize, 10);
                }
            };

            checkSize();
        });
    }

    setupResizeHandler() {
        // Debounce resize events to prevent excessive resizing
        let resizeTimeout;
        const debouncedResize = () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.handleResize();
            }, 100);
        };

        window.addEventListener('resize', debouncedResize);

        // Also listen for container resize
        const resizeObserver = new ResizeObserver(debouncedResize);
        resizeObserver.observe(this.canvas);
    }

    handleResize() {
        if (!this.camera || !this.renderer || !this.canvas) return;

        const container = this.canvas.parentElement;
        if (!container) return;

        // Get container dimensions with bounds checking
        const width = Math.max(100, Math.min(container.clientWidth, window.innerWidth));
        const height = Math.max(100, Math.min(container.clientHeight, window.innerHeight));

        // Only resize if dimensions are valid and different
        if (width > 0 && height > 0 && (width !== this.canvas.width || height !== this.canvas.height)) {
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(width, height);
            
            // Update canvas size to match renderer
            this.canvas.width = width;
            this.canvas.height = height;
        }
    }

    updateCameraPosition() {
        if (!this.camera) return;

        const x = Math.cos(this.cameraAngleX) * Math.sin(this.cameraAngleY) * this.cameraDistance;
        const y = Math.sin(this.cameraAngleX) * this.cameraDistance;
        const z = Math.cos(this.cameraAngleX) * Math.cos(this.cameraAngleY) * this.cameraDistance;

        this.camera.position.set(x, y, z);
        this.camera.lookAt(this.cameraTarget);

        // Update camera info display
        this.updateCameraInfo();
    }

    updateCameraInfo() {
        const infoElement = document.getElementById('camera-info');
        if (infoElement && this.camera) {
            const pos = this.camera.position;
            infoElement.innerHTML = `
                <span>Camera: X: ${pos.x.toFixed(1)}, Y: ${pos.y.toFixed(1)}, Z: ${pos.z.toFixed(1)}</span>
            `;
        }
    }

    startRenderLoop() {
        const animate = () => {
            this.animationId = requestAnimationFrame(animate);
            this.render();
        };
        animate();
    }

    render() {
        if (!this.renderer || !this.scene || !this.camera) return;
        this.renderer.render(this.scene, this.camera);
    }

    clearScene() {
        if (this.scene) {
            // Remove only CAD objects and helpers, preserve lights
            const childrenToRemove = [];
            this.scene.children.forEach(child => {
                // Keep lights, camera, helpers, and other essential scene elements
                if (!(child instanceof THREE.Light) && 
                    !(child instanceof THREE.Camera) &&
                    !child.userData.isLight &&
                    !child.userData.isHelper) {
                    childrenToRemove.push(child);
                }
            });
            
            childrenToRemove.forEach(child => {
                this.scene.remove(child);
                
                // Dispose of geometry and materials if they exist
                if (child.geometry) {
                    child.geometry.dispose();
                }
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            
            // Clear the objects array
            this.objects = [];
        }
    }

    addGeometry(geometryData) {
        if (!this.scene || !geometryData) return;

        try {
            let mesh = null;

            // Create geometry based on type
            switch (geometryData.type) {
                case 'cube':
                    const cubeGeometry = new THREE.BoxGeometry(
                        geometryData.size[0], 
                        geometryData.size[1], 
                        geometryData.size[2]
                    );
                    const cubeMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x007acc,
                        shininess: 30
                    });
                    mesh = new THREE.Mesh(cubeGeometry, cubeMaterial);
                    break;

                case 'sphere':
                    const sphereGeometry = new THREE.SphereGeometry(
                        geometryData.radius, 
                        geometryData.segments || 32, 
                        geometryData.segments || 32
                    );
                    const sphereMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x007acc,
                        shininess: 30
                    });
                    mesh = new THREE.Mesh(sphereGeometry, sphereMaterial);
                    break;

                case 'cylinder':
                    const cylinderGeometry = new THREE.CylinderGeometry(
                        geometryData.radius, 
                        geometryData.radius, 
                        geometryData.height, 
                        geometryData.segments || 32
                    );
                    const cylinderMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x007acc,
                        shininess: 30
                    });
                    mesh = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
                    break;

                default:
                    console.warn('Unknown geometry type:', geometryData.type);
                    return;
            }

            if (mesh) {
                // Apply position, rotation, and scale
                if (geometryData.position) {
                    mesh.position.set(
                        geometryData.position[0], 
                        geometryData.position[1], 
                        geometryData.position[2]
                    );
                }

                if (geometryData.rotation) {
                    mesh.rotation.set(
                        geometryData.rotation[0], 
                        geometryData.rotation[1], 
                        geometryData.rotation[2]
                    );
                }

                if (geometryData.scale) {
                    mesh.scale.set(
                        geometryData.scale[0], 
                        geometryData.scale[1], 
                        geometryData.scale[2]
                    );
                }

                // Add to scene
                this.scene.add(mesh);
                this.objects.push(mesh);
            }
        } catch (error) {
            console.error('Failed to add geometry:', error);
        }
    }


    addDefaultObjects() {
        // Add a simple cube for testing
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0x007acc,
            shininess: 30,
            transparent: false,
            opacity: 1.0
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.castShadow = true;
        cube.receiveShadow = true;
        this.scene.add(cube);
        this.objects.push(cube);

        // Add grid
        const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0xcccccc);
        gridHelper.userData.isHelper = true;
        this.scene.add(gridHelper);

        // Add axes helper to show coordinate system
        const axesHelper = new THREE.AxesHelper(5);
        axesHelper.userData.isHelper = true;
        this.scene.add(axesHelper);

        this.updateObjectInfo();
    }


    updateScene(objects) {
        // Clear existing CAD objects (keep helpers)
        this.objects.forEach(obj => {
            if (obj.userData.isCADObject) {
                this.scene.remove(obj);
            }
        });
        this.objects = this.objects.filter(obj => !obj.userData.isCADObject);

        // Add new objects
        if (objects && objects.length > 0) {
            objects.forEach(objData => {
                const obj = this.createObjectFromData(objData);
                if (obj) {
                    obj.userData.isCADObject = true;
                    this.scene.add(obj);
                    this.objects.push(obj);
                }
            });
        }

        this.updateObjectInfo();
    }

    createObjectFromData(objData) {
        try {
            let geometry, material;

            switch (objData.type) {
                case 'cube':
                    geometry = new THREE.BoxGeometry(
                        objData.size[0] || 1,
                        objData.size[1] || 1,
                        objData.size[2] || 1
                    );
                    break;
                case 'sphere':
                    geometry = new THREE.SphereGeometry(
                        objData.radius || 1,
                        objData.segments || 32
                    );
                    break;
                case 'cylinder':
                    geometry = new THREE.CylinderGeometry(
                        objData.radius || 1,
                        objData.radius || 1,
                        objData.height || 2,
                        objData.segments || 32
                    );
                    break;
                default:
                    console.warn('Unknown object type:', objData.type);
                    return null;
            }

            material = new THREE.MeshPhongMaterial({
                color: objData.color || 0x007acc,
                shininess: 30,
                transparent: objData.transparent || false,
                opacity: objData.opacity || 1.0
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            // Apply transformations
            if (objData.position) {
                mesh.position.set(
                    objData.position[0] || 0,
                    objData.position[1] || 0,
                    objData.position[2] || 0
                );
            }

            if (objData.rotation) {
                mesh.rotation.set(
                    objData.rotation[0] || 0,
                    objData.rotation[1] || 0,
                    objData.rotation[2] || 0
                );
            }

            if (objData.scale) {
                mesh.scale.set(
                    objData.scale[0] || 1,
                    objData.scale[1] || 1,
                    objData.scale[2] || 1
                );
            }

            return mesh;
        } catch (error) {
            console.error('Error creating object from data:', error);
            return null;
        }
    }

    updateObjectInfo() {
        const infoElement = document.getElementById('object-info');
        if (infoElement) {
            const cadObjects = this.objects.filter(obj => obj.userData.isCADObject);
            infoElement.innerHTML = `<span>Objects: ${cadObjects.length}</span>`;
        }
    }

    resetCamera() {
        this.cameraDistance = 20;
        this.cameraAngleX = Math.PI / 6; // 30 degrees from above
        this.cameraAngleY = Math.PI / 4; // 45 degrees around
        this.cameraTarget.set(0, 0, 0);
        this.updateCameraPosition();
    }

    getMeshData() {
        // Return mesh data for export
        return this.objects
            .filter(obj => obj.userData.isCADObject)
            .map(obj => ({
                geometry: obj.geometry,
                material: obj.material,
                position: obj.position,
                rotation: obj.rotation,
                scale: obj.scale
            }));
    }

    getGeometryData() {
        // Return geometry data for export
        return this.objects
            .filter(obj => obj.userData.isCADObject)
            .map(obj => ({
                type: obj.userData.type || 'unknown',
                geometry: obj.geometry,
                position: obj.position,
                rotation: obj.rotation,
                scale: obj.scale
            }));
    }

    // Dispose
    dispose() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.renderer) {
            this.renderer.dispose();
            this.renderer = null;
        }

        if (this.scene) {
            this.scene.clear();
            this.scene = null;
        }

        this.camera = null;
        this.canvas = null;
        this.objects = [];
    }
}
