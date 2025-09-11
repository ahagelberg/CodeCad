# Code CAD

A cross-platform CAD application with modular scripting language support, built with Electron and Three.js.

## Rationale ##

I really like the idea behind OpenSCAD, creating 3D models using a simple script language. However everytime I'm using it I'm dissappointed by the limited and poorly implemented script language. My main gripe is that it lacks true variables, something that is vital for creating complex models. Therefore I've decided to make my own scripted CAD program that uses a more flexible and fully featured language. I chose JavaScipt because of ease of implementation and that it is very popular. I've made the program flexible enough that other language might be added in the future. I've added rudimentary support for OpenSCAD scripts as well to make it easy for people to shift over.

## Features

- **Multi-Language Support**: JavaScript, TypeScript, and OpenSCAD scripting
- **3D Visualization**: Real-time 3D rendering with Three.js
- **Modular Architecture**: Pluggable script engines
- **Cross-Platform**: Windows, macOS, and Linux support
- **File Export**: STL and STEP format support
- **Modern UI**: Split-pane interface with Monaco Editor

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd code-cad
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

**Note**: GPU acceleration is disabled by default for stability. You can enable it in the Settings dialog (Advanced tab → Performance → 3D GPU acceleration) if your system supports it. If you experience GPU issues, use:
```bash
npm run dev-safe
```

### Building

Build the application:
```bash
npm run build
```

Create distribution packages:
```bash
npm run dist
```

## Development

### Project Structure

```
src/
├── main/                  # Electron main process
├── renderer/             # Electron renderer process (UI)
│   ├── js/
│   │   ├── app.js        # Main application logic
│   │   ├── editor/       # Code editor components
│   │   ├── viewer/       # 3D viewer components
│   │   ├── cad/          # CAD engine
│   │   └── utils/        # Utility functions
│   └── css/              # Stylesheets
└── shared/               # Shared code
```

### Script Engines

The application supports multiple scripting languages through a modular engine system:

- **JavaScript Engine**: Native JavaScript execution
- **TypeScript Engine**: TypeScript with type checking
- **OpenSCAD Engine**: OpenSCAD syntax compatibility

### Adding New Languages

1. Create a new engine class extending `BaseEngine`
2. Implement required methods (`execute`, `validate`)
3. Register the engine in `ScriptEngineManager`

## Usage

### Basic CAD Commands

#### JavaScript/TypeScript
```javascript
// Create a cube
const cube = cube([10, 10, 10]);

// Create a sphere
const sphere = sphere(5, 32);

// Transform objects
const translatedCube = translate([0, 0, 5], cube);
const rotatedSphere = rotate([0, 0, Math.PI/4], sphere);

// Boolean operations
const result = union([cube, sphere]);
```

#### OpenSCAD
```openscad
// Create a cube
cube([10, 10, 10], center=true);

// Create a sphere
sphere(r=5, $fn=32);

// Transform objects
translate([0, 0, 5]) {
    cube([10, 10, 10]);
}

rotate([0, 0, 45]) {
    sphere(r=5);
}

// Boolean operations
union() {
    cube([10, 10, 10]);
    sphere(r=5);
}
```

### 3D Navigation

- **Rotate**: Click and drag to rotate the view
- **Zoom**: Mouse wheel to zoom in/out
- **Reset**: Click the reset camera button

### File Operations

- **New**: Create a new script
- **Open**: Load an existing script
- **Save**: Save the current script
- **Export**: Export 3D model as STL or STEP

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Roadmap

- [ ] Additional scripting languages (Python, Lua)
- [ ] Advanced boolean operations
- [ ] 2D shape support
- [ ] Animation support
- [ ] Plugin system
- [ ] Cloud integration

