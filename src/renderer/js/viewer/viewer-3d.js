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

                // 2D Shapes (rendered as flat meshes)
                case '2d_rectangle':
                    const rectGeometry = new THREE.PlaneGeometry(
                        geometryData.width, 
                        geometryData.height
                    );
                    const rectMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x00aa00,
                        shininess: 30,
                        side: THREE.DoubleSide
                    });
                    mesh = new THREE.Mesh(rectGeometry, rectMaterial);
                    break;

                case '2d_circle':
                    const circleGeometry = new THREE.CircleGeometry(
                        geometryData.radius, 
                        geometryData.segments || 32
                    );
                    const circleMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x00aa00,
                        shininess: 30,
                        side: THREE.DoubleSide
                    });
                    mesh = new THREE.Mesh(circleGeometry, circleMaterial);
                    break;

                case '2d_polygon':
                    const polygonGeometry = this.createPolygonGeometry(geometryData.points);
                    const polygonMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x00aa00,
                        shininess: 30,
                        side: THREE.DoubleSide
                    });
                    mesh = new THREE.Mesh(polygonGeometry, polygonMaterial);
                    break;

                case '2d_arc':
                    const arcGeometry = this.createArcGeometry(
                        geometryData.radius,
                        geometryData.startAngle,
                        geometryData.endAngle,
                        geometryData.segments || 32
                    );
                    const arcMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x00aa00,
                        shininess: 30,
                        side: THREE.DoubleSide
                    });
                    mesh = new THREE.Mesh(arcGeometry, arcMaterial);
                    break;

                case '2d_line':
                    const lineGeometry = this.createLineGeometry(
                        geometryData.startPoint,
                        geometryData.endPoint
                    );
                    const lineMaterial = new THREE.LineBasicMaterial({ 
                        color: geometryData.color || 0x00aa00,
                        linewidth: 2
                    });
                    mesh = new THREE.Line(lineGeometry, lineMaterial);
                    break;

                // Extruded shapes
                case 'extruded':
                    const extrudedGeometry = this.createExtrudedGeometry(geometryData);
                    const extrudedMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x007acc,
                        shininess: 30
                    });
                    mesh = new THREE.Mesh(extrudedGeometry, extrudedMaterial);
                    break;

                case 'rotated_extruded':
                    const rotatedExtrudedGeometry = this.createRotatedExtrudedGeometry(geometryData);
                    const rotatedExtrudedMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x007acc,
                        shininess: 30
                    });
                    mesh = new THREE.Mesh(rotatedExtrudedGeometry, rotatedExtrudedMaterial);
                    break;

                // 2D Operations
                case '2d_offset':
                    const offsetGeometry = this.createOffsetGeometry(geometryData);
                    const offsetMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x00aa00,
                        shininess: 30,
                        side: THREE.DoubleSide
                    });
                    mesh = new THREE.Mesh(offsetGeometry, offsetMaterial);
                    break;

                case '2d_fillet':
                    const filletGeometry = this.createFilletGeometry(geometryData);
                    const filletMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x00aa00,
                        shininess: 30,
                        side: THREE.DoubleSide
                    });
                    mesh = new THREE.Mesh(filletGeometry, filletMaterial);
                    break;

                case '2d_chamfer':
                    const chamferGeometry = this.createChamferGeometry(geometryData);
                    const chamferMaterial = new THREE.MeshPhongMaterial({ 
                        color: geometryData.color || 0x00aa00,
                        shininess: 30,
                        side: THREE.DoubleSide
                    });
                    mesh = new THREE.Mesh(chamferGeometry, chamferMaterial);
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

                // 2D Shapes (rendered as flat meshes)
                case '2d_rectangle':
                    geometry = new THREE.PlaneGeometry(
                        objData.width || 1, 
                        objData.height || 1
                    );
                    break;

                case '2d_circle':
                    geometry = new THREE.CircleGeometry(
                        objData.radius || 1, 
                        objData.segments || 32
                    );
                    break;

                case '2d_polygon':
                    geometry = this.createPolygonGeometry(objData.points || []);
                    break;

                case '2d_arc':
                    geometry = this.createArcGeometry(
                        objData.radius || 1,
                        objData.startAngle || 0,
                        objData.endAngle || Math.PI,
                        objData.segments || 32
                    );
                    break;

                case '2d_line':
                    geometry = this.createLineGeometry(
                        objData.startPoint || [0, 0],
                        objData.endPoint || [1, 0]
                    );
                    break;

                // Extruded shapes
                case 'extruded':
                    geometry = this.createExtrudedGeometry(objData);
                    break;

                case 'rotated_extruded':
                    geometry = this.createRotatedExtrudedGeometry(objData);
                    break;

                // 2D Operations
                case '2d_offset':
                    geometry = this.createOffsetGeometry(objData);
                    break;

                case '2d_fillet':
                    geometry = this.createFilletGeometry(objData);
                    break;

                case '2d_chamfer':
                    geometry = this.createChamferGeometry(objData);
                    break;

                default:
                    console.warn('Unknown object type:', objData.type);
                    return null;
            }

            // Create appropriate material based on object type
            if (objData.type === '2d_line') {
                material = new THREE.LineBasicMaterial({ 
                    color: objData.color || 0x00aa00,
                    linewidth: 2
                });
            } else if (objData.type.startsWith('2d_')) {
                // 2D shapes use double-sided materials
                material = new THREE.MeshPhongMaterial({
                    color: objData.color || 0x00aa00,
                    shininess: 30,
                    transparent: objData.transparent || false,
                    opacity: objData.opacity || 1.0,
                    side: THREE.DoubleSide
                });
            } else {
                // 3D shapes use standard materials
                material = new THREE.MeshPhongMaterial({
                    color: objData.color || 0x007acc,
                    shininess: 30,
                    transparent: objData.transparent || false,
                    opacity: objData.opacity || 1.0
                });
            }

            // Create mesh or line based on type
            let mesh;
            if (objData.type === '2d_line') {
                mesh = new THREE.Line(geometry, material);
            } else {
                mesh = new THREE.Mesh(geometry, material);
            }
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

    // Helper methods for 2D geometry creation
    createPolygonGeometry(points) {
        const shape = new THREE.Shape();
        if (points.length > 0) {
            shape.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                shape.lineTo(points[i][0], points[i][1]);
            }
            shape.closePath();
        }
        return new THREE.ShapeGeometry(shape);
    }

    createArcGeometry(radius, startAngle, endAngle, segments) {
        const shape = new THREE.Shape();
        shape.absarc(0, 0, radius, startAngle, endAngle, false);
        return new THREE.ShapeGeometry(shape);
    }

    createLineGeometry(startPoint, endPoint) {
        const points = [
            new THREE.Vector3(startPoint[0], startPoint[1], 0),
            new THREE.Vector3(endPoint[0], endPoint[1], 0)
        ];
        return new THREE.BufferGeometry().setFromPoints(points);
    }

    createExtrudedGeometry(geometryData) {
        // Get the 2D shape from the geometry data
        const shape = this.getShapeFromGeometryData(geometryData.shape);
        
        // Create extrude settings
        const extrudeSettings = {
            depth: geometryData.height,
            bevelEnabled: false
        };

        // Add twist if specified
        if (geometryData.twist !== 0) {
            extrudeSettings.twist = geometryData.twist;
            extrudeSettings.steps = geometryData.slices || 1;
        }

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }

    createRotatedExtrudedGeometry(geometryData) {
        // Get the 2D shape from the geometry data
        const shape = this.getShapeFromGeometryData(geometryData.shape);
        
        // Create a profile for rotation
        const points = this.createRotationProfile(geometryData.shape);
        
        // Ensure we have valid points
        if (points.length < 2) {
            console.warn('Not enough points for rotation profile');
            return new THREE.BoxGeometry(1, 1, 1); // Fallback
        }
        
        const angle = geometryData.angle || (2 * Math.PI);
        const segments = geometryData.segments || 32;
        
        // Create lathe geometry for rotation
        const latheGeometry = new THREE.LatheGeometry(
            points, 
            segments, 
            0, 
            angle
        );
        
        // If the rotation is not a full circle, we need to close the ends
        if (angle < 2 * Math.PI) {
            // Create a closed solid by adding end caps
            const closedGeometry = this.createClosedRotatedGeometry(points, angle, segments);
            return closedGeometry;
        }
        
        return latheGeometry;
    }

    createClosedRotatedGeometry(points, angle, segments) {
        // Create a closed solid for partial rotation by combining lathe geometry with end caps
        
        // Create the main lathe geometry
        const latheGeometry = new THREE.LatheGeometry(points, segments, 0, angle);
        
        // Create end cap geometries
        const endCapGeometry = this.createEndCaps(points, angle, segments);
        
        // Combine geometries using BufferGeometryUtils (if available) or manual merging
        if (window.THREE && THREE.BufferGeometryUtils) {
            return THREE.BufferGeometryUtils.mergeGeometries([latheGeometry, endCapGeometry]);
        } else {
            // Manual geometry merging
            return this.mergeGeometries([latheGeometry, endCapGeometry]);
        }
    }

    createEndCaps(points, angle, segments) {
        // Create end caps to close the partial rotation
        const endCapGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        // Create vertices for both end caps
        // Start cap (at angle 0)
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            vertices.push(point.x, 0, point.y); // Y=0 for start cap
        }
        
        // End cap (at final angle)
        const cosAngle = Math.cos(angle);
        const sinAngle = Math.sin(angle);
        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            // Rotate the point to the end angle
            const x = point.x * cosAngle - point.y * sinAngle;
            const z = point.x * sinAngle + point.y * cosAngle;
            vertices.push(x, 0, z); // Y=0 for end cap
        }
        
        // Create triangular faces for the end caps
        // Start cap (counter-clockwise winding)
        for (let i = 1; i < points.length - 1; i++) {
            indices.push(0, i, i + 1);
        }
        
        // End cap (clockwise winding to face outward)
        const offset = points.length;
        for (let i = 1; i < points.length - 1; i++) {
            indices.push(offset, offset + i + 1, offset + i);
        }
        
        // Create side faces to connect the end caps
        for (let i = 0; i < points.length - 1; i++) {
            const next = (i + 1) % points.length;
            const startOffset = 0;
            const endOffset = offset;
            
            // First triangle
            indices.push(startOffset + i, endOffset + i, startOffset + next);
            // Second triangle
            indices.push(startOffset + next, endOffset + i, endOffset + next);
        }
        
        endCapGeometry.setIndex(indices);
        endCapGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        endCapGeometry.computeVertexNormals();
        
        return endCapGeometry;
    }

    mergeGeometries(geometries) {
        // Simple geometry merging without BufferGeometryUtils
        const mergedGeometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        let vertexOffset = 0;
        
        for (const geometry of geometries) {
            const positionAttribute = geometry.getAttribute('position');
            const indexAttribute = geometry.getIndex();
            
            // Add vertices
            for (let i = 0; i < positionAttribute.count; i++) {
                vertices.push(
                    positionAttribute.getX(i),
                    positionAttribute.getY(i),
                    positionAttribute.getZ(i)
                );
            }
            
            // Add indices with offset
            if (indexAttribute) {
                for (let i = 0; i < indexAttribute.count; i++) {
                    indices.push(indexAttribute.getX(i) + vertexOffset);
                }
            }
            
            vertexOffset += positionAttribute.count;
        }
        
        mergedGeometry.setIndex(indices);
        mergedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        mergedGeometry.computeVertexNormals();
        
        return mergedGeometry;
    }

    createOffsetGeometry(geometryData) {
        // For now, just return the original shape
        // TODO: Implement proper offset algorithm
        return this.getShapeFromGeometryData(geometryData.shape);
    }

    createFilletGeometry(geometryData) {
        // For now, just return the original shape
        // TODO: Implement proper fillet algorithm
        return this.getShapeFromGeometryData(geometryData.shape);
    }

    createChamferGeometry(geometryData) {
        // For now, just return the original shape
        // TODO: Implement proper chamfer algorithm
        return this.getShapeFromGeometryData(geometryData.shape);
    }

    getShapeFromGeometryData(geometryData) {
        if (!geometryData) return new THREE.Shape();

        switch (geometryData.type) {
            case '2d_rectangle':
                const rectShape = new THREE.Shape();
                const w = geometryData.width / 2;
                const h = geometryData.height / 2;
                rectShape.moveTo(-w, -h);
                rectShape.lineTo(w, -h);
                rectShape.lineTo(w, h);
                rectShape.lineTo(-w, h);
                rectShape.closePath();
                return rectShape;

            case '2d_circle':
                const circleShape = new THREE.Shape();
                circleShape.absarc(0, 0, geometryData.radius, 0, 2 * Math.PI, false);
                return circleShape;

            case '2d_polygon':
                return this.createPolygonShape(geometryData.points);

            case '2d_arc':
                const arcShape = new THREE.Shape();
                arcShape.absarc(0, 0, geometryData.radius, geometryData.startAngle, geometryData.endAngle, false);
                return arcShape;

            default:
                return new THREE.Shape();
        }
    }

    createPolygonShape(points) {
        const shape = new THREE.Shape();
        if (points.length > 0) {
            shape.moveTo(points[0][0], points[0][1]);
            for (let i = 1; i < points.length; i++) {
                shape.lineTo(points[i][0], points[i][1]);
            }
            shape.closePath();
        }
        return shape;
    }

    createRotationProfile(shapeData) {
        // Create a profile for rotation around the Z-axis
        // The profile should be in the XZ plane (Y=0)
        const points = [];
        
        switch (shapeData.type) {
            case '2d_rectangle':
                // Create a rectangular profile
                const w = shapeData.width / 2;
                const h = shapeData.height / 2;
                points.push(
                    new THREE.Vector2(0, -h),      // Bottom center
                    new THREE.Vector2(w, -h),      // Bottom right
                    new THREE.Vector2(w, h),       // Top right
                    new THREE.Vector2(0, h)        // Top center
                );
                break;
                
            case '2d_circle':
                // Create a circular profile (half circle for rotation)
                const radius = shapeData.radius;
                const segments = shapeData.segments || 32;
                for (let i = 0; i <= segments / 2; i++) {
                    const angle = (i / (segments / 2)) * Math.PI;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    points.push(new THREE.Vector2(x, y));
                }
                break;
                
            case '2d_polygon':
                // Create a profile from polygon points
                if (shapeData.points && shapeData.points.length > 0) {
                    for (const point of shapeData.points) {
                        points.push(new THREE.Vector2(point[0], point[1]));
                    }
                }
                break;
                
            case '2d_arc':
                // Create an arc profile
                const arcRadius = shapeData.radius;
                const startAngle = shapeData.startAngle || 0;
                const endAngle = shapeData.endAngle || Math.PI;
                const arcSegments = shapeData.segments || 32;
                
                for (let i = 0; i <= arcSegments; i++) {
                    const t = i / arcSegments;
                    const angle = startAngle + (endAngle - startAngle) * t;
                    const x = Math.cos(angle) * arcRadius;
                    const y = Math.sin(angle) * arcRadius;
                    points.push(new THREE.Vector2(x, y));
                }
                break;
                
            default:
                // Default to a simple rectangle
                points.push(
                    new THREE.Vector2(0, -0.5),
                    new THREE.Vector2(1, -0.5),
                    new THREE.Vector2(1, 0.5),
                    new THREE.Vector2(0, 0.5)
                );
        }
        
        return points;
    }

    getShapePoints(shape) {
        // Convert shape to points for lathe geometry
        const points = [];
        const curves = shape.curves;
        
        for (let i = 0; i < curves.length; i++) {
            const curve = curves[i];
            if (curve.isLineCurve) {
                points.push(new THREE.Vector2(curve.v2.x, curve.v2.y));
            } else if (curve.isQuadraticBezierCurve) {
                // Sample the curve
                for (let t = 0; t <= 1; t += 0.1) {
                    const point = curve.getPoint(t);
                    points.push(new THREE.Vector2(point.x, point.y));
                }
            }
        }
        
        return points;
    }
}
