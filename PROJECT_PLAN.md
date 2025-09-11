# Simple CAD Program - Project Plan

## Project Overview
A cross-platform CAD application that mimics OpenSCAD functionality with a split-pane interface: code editor on the left, 3D viewer on the right. The application will use a scripting language to generate 3D models with real-time preview and export capabilities.

## Core Features
- **Split-pane GUI**: Code editor (left) + 3D viewer (right)
- **Scripting Language**: Full programming language with variables, loops, functions
- **3D Primitives**: Cube, sphere, cylinder, cone
- **2D Shapes**: Rectangle, circle, arc, line, polygon
- **Extrusion**: 2D shapes → 3D objects
- **Boolean Operations**: Union, difference, intersection
- **3D Navigation**: Mouse controls for rotate, pan, zoom
- **File Operations**: Load/save scripts, export STL/STEP
- **Real-time Updates**: 3D model updates on script save
- **Fully-featured Editor**: Color coding, automatic indentation
- **Compatibility**: Support for multiple script engines, support OpenSCAD scripts, additional languages

## Technology Stack

### Primary Approach: Electron + Web Technologies
**Pros:**
- Faster development with web technologies
- Rich code editing with Monaco Editor
- Three.js for 3D rendering
- Cross-platform with single codebase
- Easy to bundle as standalone app
- Large ecosystem of web libraries
- Familiar development environment

**Cons:**
- Larger memory footprint
- Slightly slower than native apps
- Dependency on Chromium

### Standalone App Bundling
**Electron Builder**
- Excellent packaging for Windows, Linux, macOS
- Auto-updater support
- Code signing capabilities
- Single executable distribution
- Native installers (.exe, .dmg, .deb, .rpm)

### Modular Script Engine Architecture
**Core Design Principle: Language-Agnostic Engine**
- **Plugin-based Architecture**: Each scripting language is a separate module
- **Common API Interface**: All language engines implement the same CAD command interface
- **Runtime Switching**: Users can switch between languages without restarting
- **Shared Command Registry**: CAD commands work identically across all languages
- **Language Detection**: Automatic detection of script language from file extension or content

**Supported Language Engines:**
1. **JavaScript Engine (Primary)**
   - Native integration with Electron
   - Familiar syntax for many developers
   - Rich ecosystem and libraries
   - Excellent performance with V8 engine
   - Easy debugging and development

2. **OpenSCAD Engine**
   - Direct compatibility with OpenSCAD scripts
   - Transpiler to JavaScript or native parser
   - Maintains OpenSCAD syntax and semantics

3. **Python Engine (Future)**
   - Pyodide for Python in the browser
   - Popular in scientific computing
   - Rich mathematical libraries

### 3D Rendering
**Three.js**
- Web-based 3D library
- Rich feature set and documentation
- Excellent performance with WebGL
- Large community and examples
- Built-in support for STL loading/export
- Good mouse interaction handling

**Alternative: Babylon.js**
- Microsoft's 3D engine
- Excellent performance
- Rich feature set
- Good JavaScript support

### Geometry Processing
**WebAssembly (WASM) Libraries**
- **OpenCASCADE.js**: WebAssembly port of OpenCASCADE
- **CGAL.js**: Computational geometry library
- **Three.js CSG**: Constructive Solid Geometry operations
- **OpenJSCAD**: JavaScript-based CAD operations

**JavaScript Libraries**
- **Three.js CSG**: Boolean operations for Three.js
- **OpenJSCAD**: Full CAD scripting in JavaScript
- **Polygon.js**: 2D polygon operations

## Application Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Main Window                          │
├─────────────────────┬───────────────────────────────────┤
│   Code Editor       │        3D Viewer                  │
│   (Left Pane)       │       (Right Pane)                │
│                     │                                   │
│  ┌───────────────┐  │  ┌─────────────────────────────┐  │
│  │   Script      │  │  │                             │  │
│  │   Editor      │  │  │        3D Scene             │  │
│  │               │  │  │                             │  │
│  │   - Syntax    │  │  │   - Mouse Controls          │  │
│  │     Highlight │  │  │   - Lighting                │  │
│  │   - Auto-     │  │  │   - Materials               │  │
│  │     complete  │  │  │   - Camera Controls         │  │
│  │   - Error     │  │  │                             │  │
│  │     Marking   │  │  │                             │  │
│  └───────────────┘  │  └─────────────────────────────┘  │
└─────────────────────┴───────────────────────────────────┘
```

## Core Components

### 1. Modular Script Engine System
- **Engine Manager**: Manages multiple language engines and switching
- **Common API Interface**: Standardized interface for all language engines
- **Language Plugins**: Modular language engines (JavaScript, OpenSCAD, etc.)
- **Command Registry**: Universal command mapping across all languages
- **Language Detection**: Automatic script language identification
- **Cross-Language Compatibility**: Commands work identically in all supported languages
- **Variable System**: Language-agnostic variable and expression support
- **Control Flow**: Universal support for loops, conditionals, functions
- **Error Handling**: Consistent error reporting across all languages
- **Runtime Switching**: Change language engines without restarting application

### 2. Geometry Engine
- **Primitive Generation**: Create basic 3D shapes
- **2D to 3D**: Extrude 2D shapes into 3D objects
- **Boolean Operations**: Union, difference, intersection
- **Transformations**: Translate, rotate, scale
- **Mesh Generation**: Convert geometry to renderable meshes

### 3. 3D Renderer
- **Scene Management**: Manage 3D objects and camera
- **Mouse Controls**: Implement rotate, pan, zoom
- **Lighting**: Basic lighting setup
- **Materials**: Simple material system
- **Performance**: Efficient rendering for complex models

### 4. Multi-Language Code Editor
- **Monaco Editor**: VS Code's editor engine with multi-language support
- **Dynamic Syntax Highlighting**: Language-specific syntax highlighting that switches based on active engine
- **Language-Aware Auto-completion**: Command and parameter suggestions based on active language
- **Cross-Language Error Marking**: Highlight syntax and runtime errors for any supported language
- **Code Folding**: Collapse/expand code blocks with language-specific rules
- **Find/Replace**: Text search functionality with language-aware regex
- **Language Switching UI**: Easy switching between supported languages
- **Language Detection**: Automatic language detection from file extension or content
- **Automatic Indentation**: Smart indentation and formatting per language
- **Language-Specific Features**: Language-specific features (OpenSCAD modules, etc.)

### 5. File System
- **Script I/O**: Load and save CAD scripts
- **Export System**: STL, STEP, OBJ export
- **Project Management**: Recent files, templates

## Development Phases

### Phase 1: Foundation (Weeks 1-2)
- Set up Electron development environment
- Create basic GUI framework with split-pane layout
- Integrate Monaco Editor for code editing
- Implement simple Three.js 3D viewer with mouse controls
- Basic syntax highlighting for CAD scripts

### Phase 2: Modular Script Engine (Weeks 3-4)
- Design and implement modular script engine architecture
- Create common API interface for all language engines
- Implement JavaScript engine as primary language
- Create command registry system with universal command mapping
- Basic error handling and reporting framework
- Language detection and switching infrastructure
- OpenSCAD script compatibility layer (transpiler or parser)

### Phase 3: 3D Primitives (Weeks 5-6)
- Implement 3D primitives (cube, sphere, cylinder)
- Add transformation operations (translate, rotate, scale)
- Basic 3D rendering pipeline
- Script-to-3D model generation

### Phase 4: 2D Shapes & Extrusion (Weeks 7-8)
- Implement 2D primitives (rectangle, circle, polygon)
- Add extrusion functionality
- 2D to 3D conversion pipeline
- Advanced 2D operations (offset, fillet)

### Phase 5: Boolean Operations (Weeks 9-10)
- Integrate geometry processing library
- Implement union, difference, intersection
- Complex object combination
- Performance optimization

### Phase 6: Advanced Features & Additional Languages (Weeks 11-12)
- Variables and expressions across all supported languages
- Loops and conditionals with language-specific implementations
- Functions and modules with cross-language compatibility
- JavaScript engine implementation
- Advanced scripting features
- Language-specific optimizations and features

### Phase 7: Export & Polish (Weeks 13-14)
- STL export implementation using Three.js
- STEP export using OpenCASCADE.js WASM
- File I/O improvements
- UI/UX polish
- Cross-platform testing
- Electron app packaging and distribution setup

## File Structure
```
code-cad/
├── src/
│   ├── main/                  # Electron main process
│   │   ├── main.js           # Main process entry point
│   │   ├── menu.js           # Application menu
│   │   └── preload.js        # Preload script for security
│   ├── renderer/             # Electron renderer process (UI)
│   │   ├── index.html        # Main HTML file
│   │   ├── css/              # Stylesheets
│   │   │   ├── main.css      # Main application styles
│   │   │   └── editor.css    # Code editor styles
│   │   ├── js/               # Frontend JavaScript
│   │   │   ├── app.js        # Main application logic
│   │   │   ├── editor/       # Code editor components
│   │   │   │   ├── monaco-setup.js
│   │   │   │   ├── syntax-highlighting.js
│   │   │   │   └── language-switcher.js
│   │   │   ├── viewer/       # 3D viewer components
│   │   │   │   ├── three-scene.js
│   │   │   │   ├── camera-controls.js
│   │   │   │   └── renderer.js
│   │   │   ├── cad/          # CAD engine
│   │   │   │   ├── script-engine-manager.js
│   │   │   │   ├── engines/  # Language engine plugins
│   │   │   │   │   ├── base-engine.js
│   │   │   │   │   ├── javascript-engine.js
│   │   │   │   │   └── openscad-engine.js
│   │   │   │   ├── command-registry.js
│   │   │   │   ├── primitives.js
│   │   │   │   ├── boolean-ops.js
│   │   │   │   └── export.js
│   │   │   └── utils/        # Utility functions
│   │   └── assets/           # Static assets
│   ├── shared/               # Shared code between main and renderer
│   │   ├── constants.js      # Application constants
│   │   └── utils.js          # Shared utilities
│   └── wasm/                 # WebAssembly modules
│       ├── opencascade/      # OpenCASCADE WASM files
│       └── cgal/             # CGAL WASM files
├── resources/
│   ├── icons/                # Application icons
│   ├── templates/            # Script templates
│   └── examples/             # Example CAD scripts
├── tests/
│   ├── unit/                 # Unit tests
│   ├── integration/          # Integration tests
│   └── e2e/                  # End-to-end tests
├── docs/                     # Documentation
├── build/                    # Build configuration
│   ├── webpack.config.js     # Webpack configuration
│   ├── electron-builder.json # Electron builder config
│   └── package.json          # Node.js dependencies
└── dist/                     # Built application (generated)
```

## Technical Considerations

### Performance
- Efficient mesh generation and caching
- LOD (Level of Detail) for complex models
- Background script processing with Web Workers
- Memory management for large models
- WebAssembly for computationally intensive operations
- Three.js optimization techniques

### Cross-Platform
- Consistent UI across platforms with Electron
- Platform-specific optimizations
- Native file dialogs and menus via Electron APIs
- Platform-specific build configurations with Electron Builder
- Single codebase for all platforms

### Extensibility
- **Modular Language Engines**: Easy addition of new scripting languages
- **Plugin System**: Custom commands and language engines
- **Custom Material System**: Extensible material and rendering system
- **Export Format Plugins**: Additional export format support
- **Script Library Sharing**: Cross-language script library sharing
- **Language-Specific Extensions**: Language-specific features and optimizations

### User Experience
- Intuitive mouse controls
- Responsive UI during processing
- Clear error messages
- Helpful auto-completion
- Undo/redo functionality

## Risk Mitigation

### Technical Risks
- **Complex Boolean Operations**: Use proven WebAssembly libraries (OpenCASCADE.js)
- **Performance Issues**: Implement efficient algorithms, caching, and Web Workers
- **Cross-Platform Compatibility**: Regular testing on all platforms with Electron
- **3D Rendering Complexity**: Start with Three.js basics, add features gradually
- **Bundle Size**: Optimize Electron app size with proper packaging
- **WebAssembly Loading**: Handle WASM module loading and initialization

### Project Risks
- **Scope Creep**: Stick to core OpenSCAD features initially
- **Timeline**: Prioritize MVP features, add advanced features later
- **Dependencies**: Minimize external dependencies, prefer stable libraries

## Success Metrics
- Successfully renders basic 3D primitives with Three.js
- Supports multiple scripting languages (JavaScript, OpenSCAD) with identical CAD functionality
- Seamless language switching without application restart
- Exports valid STL files using Three.js exporters
- Runs smoothly on Windows, Linux, macOS as standalone Electron app
- Responsive 3D navigation with mouse controls
- Clear error reporting in Monaco Editor for all supported languages
- Intuitive user interface with split-pane layout and language switching
- Fast script execution and real-time 3D updates across all languages
- Successful app bundling and distribution
- Modular architecture allows easy addition of new scripting languages

## Comprehensive CAD Command Reference

### Core 3D Primitives
- **`cube(size, center)`** - Create rectangular box
- **`sphere(radius, segments)`** - Create sphere
- **`cylinder(height, radius, segments, center)`** - Create cylinder
- **`cone(height, radius1, radius2, segments)`** - Create cone/frustum
- **`polyhedron(points, faces, convexity)`** - Create custom polyhedron
- **`torus(major_radius, minor_radius, segments)`** - Create torus
- **`pyramid(base_size, height, segments)`** - Create pyramid

### 2D Primitives
- **`rectangle(width, height, center)`** - Create rectangle
- **`circle(radius, segments)`** - Create circle
- **`polygon(points, paths, convexity)`** - Create polygon
- **`arc(radius, start_angle, end_angle, segments)`** - Create arc
- **`line(start_point, end_point, width)`** - Create line
- **`ellipse(width, height, segments)`** - Create ellipse
- **`text(text, size, font, halign, valign)`** - Create 2D text

### Transformations
- **`translate(object, vector)`** - Move object by vector
- **`rotate(object, angles)`** - Rotate object by angles
- **`scale(object, factors)`** - Scale object by factors
- **`mirror(object, vector)`** - Mirror object across plane
- **`resize(object, new_size, auto)`** - Resize object
- **`multmatrix(object, matrix)`** - Apply transformation matrix
- **`color(object, color)`** - Set object color
- **`copy(object)`** - Create a copy of an object

### Boolean Operations
- **`union(objects)`** - Combine objects (A ∪ B)
- **`difference(object, subtract_objects)`** - Subtract objects (A - B)
- **`intersection(objects)`** - Intersect objects (A ∩ B)
- **`hull(objects)`** - Create convex hull
- **`minkowski(object, sum_object)`** - Minkowski sum

### Extrusion Operations
- **`linear_extrude(shape, height, center, twist, slices)`** - Linear extrusion
- **`rotate_extrude(shape, angle, segments)`** - Rotational extrusion
- **`sweep(shape, path, scale)`** - Path-based extrusion
- **`loft(shapes, smooth)`** - Loft between 2D shapes

### 2D Operations
- **`offset(shape, distance, chamfer)`** - Offset 2D shape
- **`fillet(shape, radius)`** - Add fillets to corners
- **`chamfer(shape, distance)`** - Add chamfers to corners
- **`projection(shape, cut)`** - Project 3D to 2D

### Advanced Operations
- **`surface(file, center, invert)`** - Create surface from heightmap
- **`import(file, convexity)`** - Import external files (STL, DXF, SVG)
- **`render(object, convexity)`** - Force rendering of object
- **`preview(object)`** - Preview object (wireframe)

### Mathematical Functions
- **Arithmetic**: `+`, `-`, `*`, `/`, `%`, `^`
- **Comparison**: `<`, `<=`, `==`, `!=`, `>=`, `>`
- **Logical**: `&&`, `||`, `!`
- **Math**: `abs()`, `ceil()`, `floor()`, `round()`, `min()`, `max()`
- **Trigonometry**: `sin()`, `cos()`, `tan()`, `asin()`, `acos()`, `atan()`, `atan2()`
- **Other**: `sqrt()`, `pow()`, `exp()`, `log()`, `len()`, `str()`

### Control Structures
- **`if (condition) { ... } else { ... }`** - Conditional execution
- **`for (i = [start:step:end]) { ... }`** - For loops
- **`while (condition) { ... }`** - While loops
- **`each (list) { ... }`** - Iterate over list
- **`let (assignments) { ... }`** - Local variables

### Modules and Functions
- **`module name(parameters) { ... }`** - Define reusable modules
- **`function name(parameters) = expression;`** - Define functions
- **`include <file>`** - Include external files
- **`use <file>`** - Use modules from file

### File Operations
- **`import(file)`** - Import STL, DXF, SVG files
- **`export_stl(object, filename)`** - Export to STL
- **`export_step(object, filename)`** - Export to STEP
- **`export_obj(object, filename)`** - Export to OBJ
- **`export_dxf(object, filename)`** - Export to DXF
- **`export_svg(object, filename)`** - Export to SVG

### Special Variables
- **`$fn`** - Number of fragments for circles
- **`$fa`** - Minimum angle for fragments
- **`$fs`** - Minimum size for fragments
- **`$t`** - Animation time (0-1)
- **`$vpr`** - Viewport rotation
- **`$vpt`** - Viewport translation
- **`$vpd`** - Viewport distance

### Utility Functions
- **`echo(expression)`** - Print debug information
- **`assert(condition, message)`** - Assert conditions
- **`version()`** - Get version information
- **`version_num()`** - Get version number
- **`norm(vector)`** - Vector length
- **`cross(vector1, vector2)`** - Cross product
- **`dot(vector1, vector2)`** - Dot product

## Implementation Priority

### Phase 1: Core Primitives (Completed)
- ✅ 3D primitives: cube, sphere, cylinder
- ✅ 2D primitives: rectangle, circle, polygon, arc, line
- ✅ Basic transformations: translate, rotate, scale

### Phase 2: Extrusion & 2D Operations (Completed)
- ✅ Linear and rotational extrusion
- ✅ 2D operations: offset, fillet, chamfer

### Phase 3: Boolean Operations (Next)
- 🔄 Union, difference, intersection
- 🔄 Hull and minkowski operations

### Phase 4: Advanced Features
- 📋 Advanced primitives: cone, torus, polyhedron
- 📋 Text rendering and font support
- 📋 Import/export functionality
- 📋 Advanced transformations: mirror, resize, multmatrix

### Phase 5: Programming Features
- 📋 Variables and expressions
- 📋 Control structures: if, for, while
- 📋 Modules and functions
- 📋 File includes and libraries

### Phase 6: Polish & Export
- 📋 Complete export system (STL, STEP, OBJ, DXF, SVG)
- 📋 Advanced rendering options
- 📋 Performance optimizations
- 📋 Error handling and debugging

## Future Enhancements
- **Additional Language Engines**: Python (Pyodide), Lua, Rust (WebAssembly)
- **Advanced Materials and Textures**: Enhanced rendering capabilities
- **Animation Support**: Time-based animations and keyframes
- **Parametric Modeling**: Advanced parametric design features
- **Cloud-based Script Sharing**: Cross-language script library sharing
- **Enhanced Plugin Ecosystem**: Third-party language engines and commands
- **Advanced Export Formats**: IGES, Parasolid, and other CAD formats
- **Collaborative Editing**: Multi-user editing with language synchronization
- **Version Control Integration**: Git integration with language-aware diffing
- **Language-Specific Features**: Advanced features unique to each scripting language
- **Performance Optimization**: Language-specific performance optimizations
