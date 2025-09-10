// Monaco Editor Manager
export class EditorManager {
    constructor() {
        this.editor = null;
        this.currentLanguage = 'javascript';
        this.contentChangeCallback = null;
    }

    async initialize() {
        try {
            // Try to load Monaco Editor, fallback to textarea if it fails
            try {
                const monaco = await this.loadMonaco();
                this.createMonacoEditor(monaco);
            } catch (error) {
                console.warn('Monaco Editor failed to load, using fallback editor:', error);
                this.createFallbackEditor();
            }
        } catch (error) {
            console.error('Failed to initialize editor:', error);
            this.createFallbackEditor();
        }
    }

    createMonacoEditor(monaco) {
        // Create Monaco editor instance
        this.editor = monaco.editor.create(document.getElementById('monaco-editor'), {
                value: '// Welcome to Code CAD\n// Start typing your CAD script here...',
                language: 'javascript',
                theme: 'vs-dark',
                automaticLayout: true,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                lineNumbers: 'on',
                renderLineHighlight: 'line',
                selectOnLineNumbers: true,
                roundedSelection: false,
                readOnly: false,
                cursorStyle: 'line',
                cursorBlinking: 'blink',
                cursorSmoothCaretAnimation: true,
                fontSize: 14,
                fontFamily: 'Consolas, "Courier New", monospace',
                tabSize: 4,
                insertSpaces: true,
                detectIndentation: true,
                autoIndent: 'full',
                formatOnPaste: true,
                formatOnType: true,
                suggestOnTriggerCharacters: true,
                acceptSuggestionOnEnter: 'on',
                quickSuggestions: {
                    other: true,
                    comments: false,
                    strings: false
                },
                parameterHints: {
                    enabled: true
                },
                hover: {
                    enabled: true
                },
                contextmenu: true,
                mouseWheelZoom: true,
                multiCursorModifier: 'ctrlCmd',
                accessibilitySupport: 'auto'
            });

        // Setup event listeners
        this.setupEventListeners();
        
        // Setup language-specific configurations
        this.setupLanguageConfigurations();
        
        console.log('Monaco Editor initialized successfully');
    }

    createFallbackEditor() {
        // Create a simple textarea as fallback
        const container = document.getElementById('monaco-editor');
        container.innerHTML = `
            <textarea id="fallback-editor" 
                      style="width: 100%; height: 100%; 
                             background: #1e1e1e; color: #d4d4d4; 
                             border: none; padding: 10px; 
                             font-family: 'Consolas', 'Courier New', monospace; 
                             font-size: 14px; resize: none; outline: none;"
                      placeholder="// Welcome to Code CAD&#10;// Start typing your CAD script here..."></textarea>
        `;
        
        this.editor = {
            getValue: () => document.getElementById('fallback-editor').value,
            setValue: (value) => { document.getElementById('fallback-editor').value = value; },
            setModelLanguage: () => {}, // No-op for fallback
            getPosition: () => ({ lineNumber: 1, column: 1 }),
            setPosition: () => {},
            getSelection: () => null,
            setSelection: () => {},
            focus: () => document.getElementById('fallback-editor').focus(),
            dispose: () => {}
        };
        
        // Setup basic event listeners for fallback
        const textarea = document.getElementById('fallback-editor');
        textarea.addEventListener('input', () => {
            if (this.contentChangeCallback) {
                this.contentChangeCallback(textarea.value);
            }
        });
        
        textarea.addEventListener('keyup', () => {
            const lines = textarea.value.substring(0, textarea.selectionStart).split('\n');
            const line = lines.length;
            const column = lines[lines.length - 1].length + 1;
            document.getElementById('cursor-position').textContent = `Line ${line}, Column ${column}`;
        });
        
        console.log('Fallback editor initialized');
    }

    async loadMonaco() {
        // Load Monaco Editor from CDN
        return new Promise((resolve, reject) => {
            if (window.monaco) {
                resolve(window.monaco);
                return;
            }

            // Load Monaco Editor from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js';
            script.onload = () => {
                if (window.require) {
                    window.require.config({ 
                        paths: { 
                            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' 
                        } 
                    });
                    window.require(['vs/editor/editor.main'], () => {
                        resolve(window.monaco);
                    });
                } else {
                    reject(new Error('Monaco Editor loader failed to initialize'));
                }
            };
            script.onerror = () => reject(new Error('Failed to load Monaco Editor'));
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        if (!this.editor) return;

        // Content change
        this.editor.onDidChangeModelContent(() => {
            if (this.contentChangeCallback) {
                const content = this.editor.getValue();
                this.contentChangeCallback(content);
            }
        });

        // Cursor position change
        this.editor.onDidChangeCursorPosition((e) => {
            const position = e.position;
            const line = position.lineNumber;
            const column = position.column;
            document.getElementById('cursor-position').textContent = `Line ${line}, Column ${column}`;
        });

        // Selection change
        this.editor.onDidChangeCursorSelection((e) => {
            const selection = e.selection;
            if (selection.isEmpty()) {
                const position = selection.getPosition();
                document.getElementById('cursor-position').textContent = 
                    `Line ${position.lineNumber}, Column ${position.column}`;
            } else {
                const start = selection.getStartPosition();
                const end = selection.getEndPosition();
                document.getElementById('cursor-position').textContent = 
                    `Line ${start.lineNumber}, Column ${start.column} - Line ${end.lineNumber}, Column ${end.column}`;
            }
        });

        // Model change (file switching)
        this.editor.onDidChangeModel((e) => {
            if (e.newModelUrl) {
                const filename = e.newModelUrl.path.split('/').pop();
                document.getElementById('file-info').textContent = filename || 'Untitled';
            }
        });
    }

    setupLanguageConfigurations() {
        if (!window.monaco) return;

        // JavaScript configuration
        window.monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            target: window.monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: window.monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: window.monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: window.monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']
        });

        // TypeScript configuration
        window.monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: window.monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: window.monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: window.monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: window.monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']
        });

        // Add CAD-specific language features
        this.addCADLanguageFeatures();
    }

    addCADLanguageFeatures() {
        if (!window.monaco) return;

        // Add CAD command completions
        const cadCommands = [
            'cube', 'sphere', 'cylinder', 'cone',
            'translate', 'rotate', 'scale', 'mirror',
            'union', 'difference', 'intersection',
            'linear_extrude', 'rotate_extrude',
            'square', 'circle', 'polygon', 'text',
            'import', 'include', 'use'
        ];

        // Register completion provider for all languages
        ['javascript', 'typescript'].forEach(language => {
            window.monaco.languages.registerCompletionItemProvider(language, {
                provideCompletionItems: (model, position) => {
                    const suggestions = cadCommands.map(command => ({
                        label: command,
                        kind: window.monaco.languages.CompletionItemKind.Function,
                        insertText: command + '($1)',
                        insertTextRules: window.monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
                        documentation: `CAD command: ${command}`,
                        detail: 'CAD Command'
                    }));

                    return { suggestions };
                }
            });
        });

        // Add hover provider for CAD commands
        window.monaco.languages.registerHoverProvider(['javascript', 'typescript'], {
            provideHover: (model, position) => {
                const word = model.getWordAtPosition(position);
                if (word && cadCommands.includes(word.word)) {
                    return {
                        range: new window.monaco.Range(
                            position.lineNumber,
                            word.startColumn,
                            position.lineNumber,
                            word.endColumn
                        ),
                        contents: [
                            { value: `**${word.word}** - CAD Command` },
                            { value: `This is a CAD command for creating or manipulating 3D objects.` }
                        ]
                    };
                }
                return null;
            }
        });
    }

    setLanguage(language) {
        if (!this.editor) return;

        this.currentLanguage = language;
        
        // Map language names to Monaco language IDs
        const languageMap = {
            'javascript': 'javascript',
            'typescript': 'typescript',
            'openscad': 'javascript' // Use JavaScript highlighting for OpenSCAD for now
        };

        const monacoLanguage = languageMap[language] || 'javascript';
        
        window.monaco.editor.setModelLanguage(this.editor.getModel(), monacoLanguage);
    }

    setContent(content) {
        if (!this.editor) return;
        this.editor.setValue(content);
    }

    getContent() {
        if (!this.editor) return '';
        return this.editor.getValue();
    }

    getCursorPosition() {
        if (!this.editor) return null;
        return this.editor.getPosition();
    }

    setCursorPosition(position) {
        if (!this.editor) return;
        this.editor.setPosition(position);
    }

    getSelection() {
        if (!this.editor) return null;
        return this.editor.getSelection();
    }

    setSelection(selection) {
        if (!this.editor) return;
        this.editor.setSelection(selection);
    }

    focus() {
        if (!this.editor) return;
        this.editor.focus();
    }

    onContentChange(callback) {
        this.contentChangeCallback = callback;
    }

    // Error highlighting
    setErrors(errors) {
        if (!this.editor || !window.monaco) return;

        const model = this.editor.getModel();
        if (!model) return;

        const markers = errors.map(error => ({
            startLineNumber: error.line || 1,
            startColumn: error.column || 1,
            endLineNumber: error.endLine || error.line || 1,
            endColumn: error.endColumn || error.column || 1,
            message: error.message,
            severity: error.severity === 'error' ? 
                window.monaco.MarkerSeverity.Error : 
                window.monaco.MarkerSeverity.Warning,
            source: 'CAD Script'
        }));

        window.monaco.editor.setModelMarkers(model, 'cad-script', markers);
    }

    clearErrors() {
        if (!this.editor || !window.monaco) return;

        const model = this.editor.getModel();
        if (!model) return;

        window.monaco.editor.setModelMarkers(model, 'cad-script', []);
    }

    // Formatting
    formatDocument() {
        if (!this.editor) return;
        this.editor.getAction('editor.action.formatDocument').run();
    }

    // Find and replace
    find() {
        if (!this.editor) return;
        this.editor.getAction('editor.action.startFindReplaceAction').run();
    }

    // Go to line
    goToLine(lineNumber) {
        if (!this.editor) return;
        this.editor.revealLineInCenter(lineNumber);
        this.editor.setPosition({ lineNumber, column: 1 });
    }

    // Dispose
    dispose() {
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }
    }
}
