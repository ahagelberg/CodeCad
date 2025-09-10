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
        this.cameraDistance = 10;
        this.cameraAngleX = 0;
        this.cameraAngleY = 0;
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
            this.scene.background = new THREE.Color(0x1e1e1e);

            // Create camera
            this.camera = new THREE.PerspectiveCamera(
                75,
                this.canvas.clientWidth / this.canvas.clientHeight,
                0.1,
                1000
            );
            this.camera.position.set(0, 0, this.cameraDistance);
            this.camera.lookAt(this.cameraTarget);

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
            
            console.log(`3D Viewer initial size: ${initialWidth}x${initialHeight}`);
            
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

            console.log('Three.js 3D Viewer initialized successfully');
        } catch (error) {
            console.error('Failed to initialize 3D Viewer:', error);
            throw error;
        }
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
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
        this.scene.add(directionalLight);

        // Point light
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight.position.set(-10, 10, 10);
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
            this.cameraAngleY += deltaX * 0.01;
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
            console.log(`3D Viewer resizing to: ${width}x${height}`);
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

    addDefaultObjects() {
        // Add a simple cube for testing
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x007acc,
            transparent: true,
            opacity: 0.8
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.castShadow = true;
        cube.receiveShadow = true;
        this.scene.add(cube);
        this.objects.push(cube);

        // Add grid
        const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x444444);
        this.scene.add(gridHelper);

        // Add axes helper
        const axesHelper = new THREE.AxesHelper(5);
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

            material = new THREE.MeshLambertMaterial({
                color: objData.color || 0x007acc,
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
        this.cameraDistance = 10;
        this.cameraAngleX = 0;
        this.cameraAngleY = 0;
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
