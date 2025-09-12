// Application Version Configuration
// Update this version string for each release/commit
const VERSION = '0.1.0';

// Version metadata
const VERSION_INFO = {
    version: VERSION,
    name: 'CodeCAD',
    description: 'Cross-platform Scripted CAD application',
    author: 'Invize AB',
    buildDate: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
};

// CommonJS export for main process
module.exports = { VERSION, VERSION_INFO };
