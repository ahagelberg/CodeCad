// STEP Exporter utility for Three.js meshes
// This is a simplified STEP exporter that creates basic STEP files
import * as THREE from 'three';

export class STEPExporter {
    constructor() {
        this.version = 'AP203'; // STEP Application Protocol 203 (Configuration Controlled Design)
    }

    /**
     * Export a Three.js mesh to STEP format
     * @param {THREE.Mesh|THREE.Group|Array} object - The object(s) to export
     * @param {Object} options - Export options
     * @param {string} options.name - Name for the product (default: 'CodeCAD_Export')
     * @param {string} options.version - STEP version (default: 'AP203')
     * @returns {string} - STEP file content
     */
    export(object, options = {}) {
        const name = options.name || 'CodeCAD_Export';
        const version = options.version || this.version;
        
        const meshes = this.collectMeshes(object);
        if (meshes.length === 0) {
            throw new Error('No meshes found to export');
        }

        let stepContent = this.generateHeader(name, version);
        stepContent += this.generateDataSection(meshes);
        stepContent += this.generateEndSection();
        
        return stepContent;
    }

    /**
     * Generate STEP file header
     * @param {string} name - Product name
     * @param {string} version - STEP version
     * @returns {string} - Header content
     */
    generateHeader(name, version) {
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        
        return `ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('STEP AP203'),'2;1');
FILE_NAME('${name}.stp','${timestamp}',('CodeCAD'),('Invize AB'),'CodeCAD v1.0','CodeCAD v1.0','');
FILE_SCHEMA(('AUTOMOTIVE_DESIGN'));
ENDSEC;

DATA;
`;
    }

    /**
     * Generate STEP data section
     * @param {Array} meshes - Array of Three.js meshes
     * @returns {string} - Data section content
     */
    generateDataSection(meshes) {
        let content = '';
        let entityCounter = 1;
        
        // Create a proper STEP file structure based on the working example
        // This creates MANIFOLD_SOLID_BREP entities that CAD software can understand

        // Set up organization infor
        const osId = entityCounter++;
        content += `#${osId} = ORGANIZATION('O0001', 'CodeCAD', 'Invize AB');\n`;
        
        // Create length unit
        const luId = entityCounter++;
        content += `#${luId} = LENGTH_UNIT() NAMED_UNIT(*) SI_UNIT(.MILLI.,.METRE.);\n`;
        
        // Create plane angle unit
        const pauId = entityCounter++;
        content += `#${pauId} = PLANE_ANGLE_UNIT() NAMED_UNIT(*) SI_UNIT($,.RADIAN.);\n`;
        
        // Create solid angle unit
        const sauId = entityCounter++;
        content += `#${sauId} = SOLID_ANGLE_UNIT() NAMED_UNIT(*) SI_UNIT($,.STERADIAN.);\n`;
        
        // Create uncertainty measure with unit
        const umwuId = entityCounter++;
        content += `#${umwuId} = UNCERTAINTY_MEASURE_WITH_UNIT(LENGTH_MEASURE(0.01),#${luId},'DISTANCE_ACCURACY_VALUE','Maximum model space distance between geometric entities at asserted connectivities');\n`;
        
        // Create geometric representation context
        const grcId = entityCounter++;
        content += `#${grcId} = GEOMETRIC_REPRESENTATION_CONTEXT(3) GLOBAL_UNCERTAINTY_ASSIGNED_CONTEXT((#${umwuId})) GLOBAL_UNIT_ASSIGNED_CONTEXT((#${luId},#${pauId},#${sauId})) REPRESENTATION_CONTEXT('','3D');\n`;
        
        // Create simplified solids from meshes - use bounding boxes for efficiency
        const solidIds = [];
        for (let i = 0; i < meshes.length; i++) {
            try {
                const mesh = meshes[i];
                if (!mesh || !mesh.geometry) {
                    console.warn(`Mesh ${i} is invalid, skipping`);
                    continue;
                }
                
                const geometry = mesh.geometry;
                const positionAttribute = geometry.getAttribute('position');
                
                if (!positionAttribute) {
                    console.warn(`Mesh ${i} has no position attribute, skipping`);
                    continue;
                }
                
                // Get bounding box
                const bbox = new THREE.Box3().setFromBufferAttribute(positionAttribute);
                const size = bbox.getSize(new THREE.Vector3());
                const center = bbox.getCenter(new THREE.Vector3());
                
                // Ensure minimum size
                const minSize = 0.001;
                const actualSize = {
                    x: Math.max(size.x, minSize),
                    y: Math.max(size.y, minSize),
                    z: Math.max(size.z, minSize)
                };
                
                // Create a simple box as MANIFOLD_SOLID_BREP
                const solidContent = this.generateBoxAsManifoldSolidBrep(center, actualSize, entityCounter);
                content += solidContent.content;
                
                solidIds.push(solidContent.solidId);
                entityCounter += solidContent.entityCount;
            } catch (error) {
                console.error(`Error processing mesh ${i}:`, error);
                continue;
            }
        }
        
        // Create shape representation with all solids
        const srId = entityCounter++;
        const solidList = solidIds.map(id => `#${id}`).join(',');
        content += `#${srId} = SHAPE_REPRESENTATION('',(${solidList}),#${grcId});\n`;
        
        // Create application context first
        const acId = entityCounter++;
        content += `#${acId} = APPLICATION_CONTEXT('Core Data for Automotive Mechanical Design Process');\n`;
        
        // Create product context
        const pcId = entityCounter++;
        content += `#${pcId} = PRODUCT_CONTEXT('part definition',#${acId},'mechanical');\n`;
        
        // Create product
        const productId = entityCounter++;
        content += `#${productId} = PRODUCT('(Unsaved)','(Unsaved)',$,(#${pcId}));\n`;
        
        // Create product definition formation
        const pdfId = entityCounter++;
        content += `#${pdfId} = PRODUCT_DEFINITION_FORMATION('',$,#${productId});\n`;
        
        // Create product definition context
        const pdcId = entityCounter++;
        content += `#${pdcId} = PRODUCT_DEFINITION_CONTEXT('part definition',#${acId},'design');\n`;
        
        // Create product definition
        const pdId = entityCounter++;
        content += `#${pdId} = PRODUCT_DEFINITION('(Unsaved)','(Unsaved)',#${pdfId},#${pdcId});\n`;
        
        // Create product definition shape
        const pdsId = entityCounter++;
        content += `#${pdsId} = PRODUCT_DEFINITION_SHAPE('',$,#${pdId});\n`;
        
        // Create shape definition representation - this is the crucial link
        const sdrId = entityCounter++;
        content += `#${sdrId} = SHAPE_DEFINITION_REPRESENTATION(#${pdsId},#${srId});\n`;
        
        return content;
    }

    /**
     * Generate a combined solid from all meshes using actual geometry
     * @param {Array} meshes - Array of Three.js meshes
     * @param {number} startId - Starting entity ID
     * @returns {Object} - {content: string, solidId: number, entityCount: number}
     */
    generateCombinedSolid(meshes, startId) {
        let content = '';
        let entityId = startId;
        
        // Collect all vertices and faces from all meshes
        const allVertices = [];
        const allFaces = [];
        let vertexOffset = 0;
        
        for (const mesh of meshes) {
            if (!mesh || !mesh.geometry) continue;
            
            const geometry = mesh.geometry;
            const positionAttribute = geometry.getAttribute('position');
            const indexAttribute = geometry.getIndex();
            
            if (!positionAttribute) continue;
            
            // Get vertices
            const vertices = [];
            for (let i = 0; i < positionAttribute.count; i++) {
                const x = positionAttribute.getX(i);
                const y = positionAttribute.getY(i);
                const z = positionAttribute.getZ(i);
                vertices.push({ x, y, z });
            }
            
            // Get faces
            const faces = [];
            if (indexAttribute) {
                // Indexed geometry
                for (let i = 0; i < indexAttribute.count; i += 3) {
                    const a = indexAttribute.getX(i) + vertexOffset;
                    const b = indexAttribute.getX(i + 1) + vertexOffset;
                    const c = indexAttribute.getX(i + 2) + vertexOffset;
                    faces.push([a, b, c]);
                }
            } else {
                // Non-indexed geometry
                for (let i = 0; i < vertices.length; i += 3) {
                    const a = i + vertexOffset;
                    const b = i + 1 + vertexOffset;
                    const c = i + 2 + vertexOffset;
                    faces.push([a, b, c]);
                }
            }
            
            allVertices.push(...vertices);
            allFaces.push(...faces);
            vertexOffset += vertices.length;
        }
        
        if (allVertices.length === 0 || allFaces.length === 0) {
            // Fallback to bounding box if no valid geometry
            const overallBbox = new THREE.Box3();
            for (const mesh of meshes) {
                if (mesh && mesh.geometry) {
                    const positionAttribute = mesh.geometry.getAttribute('position');
                    if (positionAttribute) {
                        const bbox = new THREE.Box3().setFromBufferAttribute(positionAttribute);
                        overallBbox.union(bbox);
                    }
                }
            }
            
            const size = overallBbox.getSize(new THREE.Vector3());
            const center = overallBbox.getCenter(new THREE.Vector3());
            
            const minSize = 0.001;
            const actualSize = {
                x: Math.max(size.x, minSize),
                y: Math.max(size.y, minSize),
                z: Math.max(size.z, minSize)
            };
            
            return this.generateBoxAsManifoldSolidBrep(center, actualSize, startId);
        }
        
        // Create MANIFOLD_SOLID_BREP from actual geometry
        return this.generateManifoldSolidBrepFromGeometry(allVertices, allFaces, startId);
    }

    /**
     * Generate MANIFOLD_SOLID_BREP from actual mesh geometry
     * @param {Array} vertices - Array of vertex positions
     * @param {Array} faces - Array of face indices
     * @param {number} startId - Starting entity ID
     * @returns {Object} - {content: string, solidId: number, entityCount: number}
     */
    generateManifoldSolidBrepFromGeometry(vertices, faces, startId) {
        let content = '';
        let entityId = startId;
        
        // Create vertex points
        const vertexIds = [];
        for (let i = 0; i < vertices.length; i++) {
            const vpId = entityId++;
            const cpId = entityId++;
            content += `#${vpId} = VERTEX_POINT('',#${cpId});\n`;
            content += `#${cpId} = CARTESIAN_POINT('',(${vertices[i].x},${vertices[i].y},${vertices[i].z}));\n`;
            vertexIds.push(vpId);
        }
        
        // Create edges from faces
        const edgeMap = new Map();
        const edgeIds = [];
        
        for (const face of faces) {
            for (let i = 0; i < face.length; i++) {
                const start = face[i];
                const end = face[(i + 1) % face.length];
                const edgeKey = `${Math.min(start, end)}-${Math.max(start, end)}`;
                
                if (!edgeMap.has(edgeKey)) {
                    const ecId = entityId++;
                    const lineId = entityId++;
                    const lineCpId = entityId++;
                    const lineDirId = entityId++;
                    const lineVecId = entityId++;
                    
                    const startVertex = vertices[start];
                    const endVertex = vertices[end];
                    const direction = {
                        x: endVertex.x - startVertex.x,
                        y: endVertex.y - startVertex.y,
                        z: endVertex.z - startVertex.z
                    };
                    const length = Math.sqrt(direction.x*direction.x + direction.y*direction.y + direction.z*direction.z);
                    
                    if (length > 0) {
                        content += `#${ecId} = EDGE_CURVE('',#${vertexIds[start]},#${vertexIds[end]},#${lineId},.T.);\n`;
                        content += `#${lineId} = LINE('',#${lineCpId},#${lineVecId});\n`;
                        content += `#${lineCpId} = CARTESIAN_POINT('',(${startVertex.x},${startVertex.y},${startVertex.z}));\n`;
                        content += `#${lineDirId} = DIRECTION('',(${direction.x/length},${direction.y/length},${direction.z/length}));\n`;
                        content += `#${lineVecId} = VECTOR('',#${lineDirId},${length});\n`;
                        
                        edgeMap.set(edgeKey, ecId);
                        edgeIds.push(ecId);
                    }
                }
            }
        }
        
        // Create oriented edges
        const orientedEdgeIds = [];
        for (const edgeId of edgeIds) {
            const oeId = entityId++;
            content += `#${oeId} = ORIENTED_EDGE('',*,*,#${edgeId},.T.);\n`;
            orientedEdgeIds.push(oeId);
        }
        
        // Create faces
        const faceIds = [];
        for (const face of faces) {
            // Create edge loop for this face
            const elId = entityId++;
            const edgeList = [];
            
            for (let i = 0; i < face.length; i++) {
                const start = face[i];
                const end = face[(i + 1) % face.length];
                const edgeKey = `${Math.min(start, end)}-${Math.max(start, end)}`;
                const edgeId = edgeMap.get(edgeKey);
                if (edgeId) {
                    const oeId = orientedEdgeIds[edgeIds.indexOf(edgeId)];
                    edgeList.push(`#${oeId}`);
                }
            }
            
            if (edgeList.length > 0) {
                content += `#${elId} = EDGE_LOOP('',(${edgeList.join(',')}));\n`;
                
                // Create face outer bound
                const fobId = entityId++;
                content += `#${fobId} = FACE_OUTER_BOUND('',#${elId},.T.);\n`;
                
                // Create plane for the face
                const planeId = entityId++;
                const planePlacementId = entityId++;
                const planeCpId = entityId++;
                const planeDirId = entityId++;
                const planeDir2Id = entityId++;
                
                // Calculate face normal and center
                const faceCenter = this.calculateFaceCenter(vertices, face);
                const faceNormal = this.calculateFaceNormal(vertices, face);
                
                content += `#${planeId} = PLANE('',#${planePlacementId});\n`;
                content += `#${planePlacementId} = AXIS2_PLACEMENT_3D('',#${planeCpId},#${planeDirId},#${planeDir2Id});\n`;
                content += `#${planeCpId} = CARTESIAN_POINT('',(${faceCenter.x},${faceCenter.y},${faceCenter.z}));\n`;
                content += `#${planeDirId} = DIRECTION('',(${faceNormal.x},${faceNormal.y},${faceNormal.z}));\n`;
                content += `#${planeDir2Id} = DIRECTION('',(1.0,0.0,0.0));\n`;
                
                // Create advanced face
                const afId = entityId++;
                content += `#${afId} = ADVANCED_FACE('',(#${fobId}),#${planeId},.T.);\n`;
                
                faceIds.push(afId);
            }
        }
        
        // Create closed shell
        const csId = entityId++;
        const faceList = faceIds.map(id => `#${id}`).join(',');
        content += `#${csId} = CLOSED_SHELL('',(${faceList}));\n`;
        
        // Create manifold solid brep
        const msbId = entityId++;
        content += `#${msbId} = MANIFOLD_SOLID_BREP('Body1',#${csId});\n`;
        
        return {
            content: content,
            solidId: msbId,
            entityCount: entityId - startId
        };
    }

    /**
     * Generate a simple box as MANIFOLD_SOLID_BREP (optimized for small file size)
     * @param {Object} center - Center position {x, y, z}
     * @param {Object} size - Size {x, y, z}
     * @param {number} startId - Starting entity ID
     * @returns {Object} - {content: string, solidId: number, entityCount: number}
     */
    generateBoxAsManifoldSolidBrep(center, size, startId) {
        let content = '';
        let entityId = startId;
        
        // Create a minimal but valid MANIFOLD_SOLID_BREP
        // This creates a simple box with just the essential entities
        
        // Create the 8 vertices of the box
        const halfX = size.x / 2;
        const halfY = size.y / 2;
        const halfZ = size.z / 2;
        
        const vertices = [
            {x: center.x - halfX, y: center.y - halfY, z: center.z - halfZ}, // 0
            {x: center.x + halfX, y: center.y - halfY, z: center.z - halfZ}, // 1
            {x: center.x + halfX, y: center.y + halfY, z: center.z - halfZ}, // 2
            {x: center.x - halfX, y: center.y + halfY, z: center.z - halfZ}, // 3
            {x: center.x - halfX, y: center.y - halfY, z: center.z + halfZ}, // 4
            {x: center.x + halfX, y: center.y - halfY, z: center.z + halfZ}, // 5
            {x: center.x + halfX, y: center.y + halfY, z: center.z + halfZ}, // 6
            {x: center.x - halfX, y: center.y + halfY, z: center.z + halfZ}  // 7
        ];
        
        // Create vertex points (only 8 vertices)
        const vertexIds = [];
        for (let i = 0; i < 8; i++) {
            const vpId = entityId++;
            const cpId = entityId++;
            content += `#${vpId} = VERTEX_POINT('',#${cpId});\n`;
            content += `#${cpId} = CARTESIAN_POINT('',(${vertices[i].x},${vertices[i].y},${vertices[i].z}));\n`;
            vertexIds.push(vpId);
        }
        
        // Create only the essential edges (12 edges)
        const edgeIds = [];
        const edgeConnections = [
            [0,1], [1,2], [2,3], [3,0], // bottom face
            [4,5], [5,6], [6,7], [7,4], // top face
            [0,4], [1,5], [2,6], [3,7]  // vertical edges
        ];
        
        for (let i = 0; i < 12; i++) {
            const ecId = entityId++;
            const lineId = entityId++;
            const lineCpId = entityId++;
            const lineDirId = entityId++;
            const lineVecId = entityId++;
            
            const [start, end] = edgeConnections[i];
            const startVertex = vertices[start];
            const endVertex = vertices[end];
            const direction = {
                x: endVertex.x - startVertex.x,
                y: endVertex.y - startVertex.y,
                z: endVertex.z - startVertex.z
            };
            const length = Math.sqrt(direction.x*direction.x + direction.y*direction.y + direction.z*direction.z);
            
            content += `#${ecId} = EDGE_CURVE('',#${vertexIds[start]},#${vertexIds[end]},#${lineId},.T.);\n`;
            content += `#${lineId} = LINE('',#${lineCpId},#${lineVecId});\n`;
            content += `#${lineCpId} = CARTESIAN_POINT('',(${startVertex.x},${startVertex.y},${startVertex.z}));\n`;
            content += `#${lineDirId} = DIRECTION('',(${direction.x/length},${direction.y/length},${direction.z/length}));\n`;
            content += `#${lineVecId} = VECTOR('',#${lineDirId},${length});\n`;
            
            edgeIds.push(ecId);
        }
        
        // Create oriented edges
        const orientedEdgeIds = [];
        for (let i = 0; i < 12; i++) {
            const oeId = entityId++;
            content += `#${oeId} = ORIENTED_EDGE('',$,$,#${edgeIds[i]},.T.);\n`;
            orientedEdgeIds.push(oeId);
        }
        
        // Create only 6 faces (one for each side of the box)
        const faceIds = [];
        
        // Define faces by their vertex indices
        const faceVertexIndices = [
            [0,1,2,3],   // bottom face (z-)
            [4,5,6,7],   // top face (z+)
            [0,1,5,4],   // front face (y-)
            [1,2,6,5],   // right face (x+)
            [2,3,7,6],   // back face (y+)
            [3,0,4,7]    // left face (x-)
        ];
        
        for (let i = 0; i < 6; i++) {
            const faceVertices = faceVertexIndices[i];
            
            // Create edge loop for this face
            const elId = entityId++;
            const edgeList = [];
            
            for (let j = 0; j < faceVertices.length; j++) {
                const start = faceVertices[j];
                const end = faceVertices[(j + 1) % faceVertices.length];
                const edgeKey = `${Math.min(start, end)}-${Math.max(start, end)}`;
                const edgeId = edgeIds.find((id, idx) => {
                    const [edgeStart, edgeEnd] = edgeConnections[idx];
                    return `${Math.min(edgeStart, edgeEnd)}-${Math.max(edgeStart, edgeEnd)}` === edgeKey;
                });
                
                if (edgeId) {
                    const edgeIdx = edgeIds.indexOf(edgeId);
                    edgeList.push(`#${orientedEdgeIds[edgeIdx]}`);
                }
            }
            
            if (edgeList.length > 0) {
                content += `#${elId} = EDGE_LOOP('',(${edgeList.join(',')}));\n`;
                
                // Create face outer bound
                const fobId = entityId++;
                content += `#${fobId} = FACE_OUTER_BOUND('',#${elId},.T.);\n`;
                
                // Create plane for the face
                const planeId = entityId++;
                const planePlacementId = entityId++;
                const planeCpId = entityId++;
                const planeDirId = entityId++;
                const planeDir2Id = entityId++;
                
                // Calculate face normal and center
                const faceCenter = this.calculateFaceCenter(vertices, faceVertices);
                const faceNormal = this.calculateFaceNormal(vertices, faceVertices);
                
                content += `#${planeId} = PLANE('',#${planePlacementId});\n`;
                content += `#${planePlacementId} = AXIS2_PLACEMENT_3D('',#${planeCpId},#${planeDirId},#${planeDir2Id});\n`;
                content += `#${planeCpId} = CARTESIAN_POINT('',(${faceCenter.x},${faceCenter.y},${faceCenter.z}));\n`;
                content += `#${planeDirId} = DIRECTION('',(${faceNormal.x},${faceNormal.y},${faceNormal.z}));\n`;
                content += `#${planeDir2Id} = DIRECTION('',(1.0,0.0,0.0));\n`;
                
                // Create advanced face
                const afId = entityId++;
                content += `#${afId} = ADVANCED_FACE('',(#${fobId}),#${planeId},.T.);\n`;
                
                faceIds.push(afId);
            }
        }
        
        // Create closed shell
        const csId = entityId++;
        const faceList = faceIds.map(id => `#${id}`).join(',');
        content += `#${csId} = CLOSED_SHELL('',(${faceList}));\n`;
        
        // Create manifold solid brep
        const msbId = entityId++;
        content += `#${msbId} = MANIFOLD_SOLID_BREP('Body1',#${csId});\n`;
        
        return {
            content: content,
            solidId: msbId,
            entityCount: entityId - startId
        };
    }

    /**
     * Calculate face center
     * @param {Array} vertices - Array of vertex positions
     * @param {Array} faceIndices - Indices of vertices forming the face
     * @returns {Object} - Center position {x, y, z}
     */
    calculateFaceCenter(vertices, faceIndices) {
        if (!vertices || !faceIndices || faceIndices.length === 0) {
            return { x: 0, y: 0, z: 0 };
        }
        
        let x = 0, y = 0, z = 0;
        for (const idx of faceIndices) {
            if (vertices[idx] && typeof vertices[idx].x === 'number') {
                x += vertices[idx].x;
                y += vertices[idx].y;
                z += vertices[idx].z;
            }
        }
        return {
            x: x / faceIndices.length,
            y: y / faceIndices.length,
            z: z / faceIndices.length
        };
    }

    /**
     * Calculate face normal
     * @param {Array} vertices - Array of vertex positions
     * @param {Array} faceIndices - Indices of vertices forming the face
     * @returns {Object} - Normal vector {x, y, z}
     */
    calculateFaceNormal(vertices, faceIndices) {
        if (!vertices || !faceIndices || faceIndices.length < 3) {
            return {x: 0, y: 0, z: 1};
        }
        
        const v0 = vertices[faceIndices[0]];
        const v1 = vertices[faceIndices[1]];
        const v2 = vertices[faceIndices[2]];
        
        // Check if vertices exist and have valid properties
        if (!v0 || !v1 || !v2 || 
            typeof v0.x !== 'number' || typeof v0.y !== 'number' || typeof v0.z !== 'number' ||
            typeof v1.x !== 'number' || typeof v1.y !== 'number' || typeof v1.z !== 'number' ||
            typeof v2.x !== 'number' || typeof v2.y !== 'number' || typeof v2.z !== 'number') {
            return {x: 0, y: 0, z: 1};
        }
        
        // Calculate two edge vectors
        const edge1 = {
            x: v1.x - v0.x,
            y: v1.y - v0.y,
            z: v1.z - v0.z
        };
        const edge2 = {
            x: v2.x - v0.x,
            y: v2.y - v0.y,
            z: v2.z - v0.z
        };
        
        // Calculate cross product
        const normal = {
            x: edge1.y * edge2.z - edge1.z * edge2.y,
            y: edge1.z * edge2.x - edge1.x * edge2.z,
            z: edge1.x * edge2.y - edge1.y * edge2.x
        };
        
        // Normalize
        const length = Math.sqrt(normal.x*normal.x + normal.y*normal.y + normal.z*normal.z);
        if (length > 0) {
            normal.x /= length;
            normal.y /= length;
            normal.z /= length;
        }
        
        return normal;
    }


    /**
     * Generate STEP end section
     * @returns {string} - End section content
     */
    generateEndSection() {
        return `ENDSEC;

END-ISO-10303-21;
`;
    }

    /**
     * Escape string for STEP format
     * @param {string} str - String to escape
     * @returns {string} - Escaped string
     */
    escapeString(str) {
        return str.replace(/'/g, "''");
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
        const blob = new Blob([data], { type: 'text/plain' });
        
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
