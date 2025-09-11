// Monaco Editor Manager
export class EditorManager {
    constructor() {
        this.editor = null;
        this.currentLanguage = 'javascript';
        this.contentChangeCallback = null;
    }

    async initialize() {
        try {
            console.log('EditorManager.initialize() called');
            // Try to load Monaco Editor, fallback to textarea if it fails
            try {
                console.log('Attempting to load Monaco Editor...');
                const monaco = await this.loadMonaco();
                console.log('Monaco Editor loaded successfully, creating editor...');
                this.createMonacoEditor(monaco);
            } catch (error) {
                console.warn('Monaco Editor failed to load, using fallback editor:', error);
                this.createFallbackEditor();
            }
        } catch (error) {
            console.log('Failed to initialize editor:', error);
            this.createFallbackEditor();
        }
    }

    createMonacoEditor(monaco) {
        // Create Monaco editor instance with ALL popups disabled
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
                formatOnPaste: false,
                formatOnType: false,
                suggestOnTriggerCharacters: false,
                acceptSuggestionOnEnter: 'off',
                quickSuggestions: false,
                // CRITICAL: Disable ALL hover messages and popups
                hover: {
                    enabled: false
                },
                contextmenu: true,
                mouseWheelZoom: true,
                multiCursorModifier: 'ctrlCmd',
                accessibilitySupport: 'auto',
                // CRITICAL: Disable ALL validation and error decorations
                renderValidationDecorations: 'off',
                // Disable automatic error checking
                quickSuggestions: false,
                suggestOnTriggerCharacters: false,
                acceptSuggestionOnEnter: 'off',
                // Disable parameter hints
                parameterHints: {
                    enabled: false
                },
                // Disable all validation and diagnostics
                lightbulb: {
                    enabled: false
                },
                codeLens: false,
                folding: false,
                // Disable error markers
                glyphMargin: false,
                lineDecorationsWidth: 0,
                lineNumbersMinChars: 0,
                // Disable error popups and notifications
                showFoldingControls: 'never',
                hideCursorInOverviewRuler: true,
                overviewRulerBorder: false,
                // Disable all error decorations
                renderWhitespace: 'none',
                renderControlCharacters: false,
                // Additional error suppression options
                occurrencesHighlight: false,
                selectionHighlight: false,
                wordHighlight: false,
                bracketPairColorization: {
                    enabled: false
                },
                guides: {
                    bracketPairs: false,
                    indentation: false
                },
                // Disable all error-related features
                stickyScroll: {
                    enabled: false
                }
            });

        // Setup event listeners
        this.setupEventListeners();
        
        // Disable language-specific validation
        this.disableLanguageValidation(monaco);
        
        // Additional error suppression after editor creation
        this.disableAllErrorChecking(monaco);
        
        // Setup marker listener to show errors in footer instead of popups
        this.setupMarkerListener(monaco);
        
        console.log('Monaco Editor initialized successfully with error suppression');
        console.log('Editor configuration:', {
            hover: this.editor.getOption(monaco.editor.EditorOption.hover),
            renderValidationDecorations: this.editor.getOption(monaco.editor.EditorOption.renderValidationDecorations),
            quickSuggestions: this.editor.getOption(monaco.editor.EditorOption.quickSuggestions)
        });
    }

    disableLanguageValidation(monaco) {
        // Disable JavaScript validation completely
        monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
            noSuggestionDiagnostics: true,
            noValidation: true,
            noImplicitAny: true,
            noImplicitReturns: true,
            noImplicitThis: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            strict: false,
            noLib: true,
            allowNonTsExtensions: true
        });

        // Disable TypeScript validation completely
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: true,
            noSyntaxValidation: true,
            noSuggestionDiagnostics: true,
            noValidation: true,
            noImplicitAny: true,
            noImplicitReturns: true,
            noImplicitThis: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            strict: false,
            noLib: true,
            allowNonTsExtensions: true
        });

        // Disable all language features that might cause popups
        monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
            noLib: true,
            allowNonTsExtensions: true,
            noImplicitAny: false,
            noImplicitReturns: false,
            noImplicitThis: false,
            noUnusedLocals: false,
            noUnusedParameters: false,
            strict: false,
            noEmit: true,
            skipLibCheck: true,
            skipDefaultLibCheck: true,
            noErrorTruncation: true,
            suppressExcessPropertyErrors: true,
            suppressImplicitAnyIndexErrors: true
        });

        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            noLib: true,
            allowNonTsExtensions: true,
            noImplicitAny: false,
            noImplicitReturns: false,
            noImplicitThis: false,
            noUnusedLocals: false,
            noUnusedParameters: false,
            strict: false,
            noEmit: true,
            skipLibCheck: true,
            skipDefaultLibCheck: true,
            noErrorTruncation: true,
            suppressExcessPropertyErrors: true,
            suppressImplicitAnyIndexErrors: true
        });

        // Disable extra libraries
        monaco.languages.typescript.javascriptDefaults.setExtraLibs([]);
        monaco.languages.typescript.typescriptDefaults.setExtraLibs([]);

        // Disable all language providers
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(false);
        monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);

        // Disable all language services
        monaco.languages.typescript.javascriptDefaults.setEagerModelSync(false);
        monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);

        // Disable worker services
        monaco.languages.typescript.javascriptDefaults.setWorkerOptions({
            customWorkerPath: null
        });
        monaco.languages.typescript.typescriptDefaults.setWorkerOptions({
            customWorkerPath: null
        });
    }

    disableAllErrorChecking(monaco) {
        // Disable all error checking and validation
        try {
            console.log('Starting Monaco error checking disable...');
            
            // Disable all language services
            monaco.languages.typescript.javascriptDefaults.setEagerModelSync(false);
            monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);

            // Disable all diagnostics - use the most aggressive settings
            monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: true,
                noSuggestionDiagnostics: true,
                noValidation: true,
                noImplicitAny: true,
                noImplicitReturns: true,
                noImplicitThis: true,
                noUnusedLocals: true,
                noUnusedParameters: true,
                strict: false,
                noLib: true,
                allowNonTsExtensions: true
            });

            monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
                noSemanticValidation: true,
                noSyntaxValidation: true,
                noSuggestionDiagnostics: true,
                noValidation: true,
                noImplicitAny: true,
                noImplicitReturns: true,
                noImplicitThis: true,
                noUnusedLocals: true,
                noUnusedParameters: true,
                strict: false,
                noLib: true,
                allowNonTsExtensions: true
            });

            // Disable all compiler options that might cause errors
            monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
                noLib: true,
                allowNonTsExtensions: true,
                noImplicitAny: false,
                noImplicitReturns: false,
                noImplicitThis: false,
                noUnusedLocals: false,
                noUnusedParameters: false,
                strict: false,
                noEmit: true,
                skipLibCheck: true,
                skipDefaultLibCheck: true,
                noErrorTruncation: true,
                suppressExcessPropertyErrors: true,
                suppressImplicitAnyIndexErrors: true,
                allowJs: true,
                checkJs: false,
                noCheck: true
            });

            monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
                noLib: true,
                allowNonTsExtensions: true,
                noImplicitAny: false,
                noImplicitReturns: false,
                noImplicitThis: false,
                noUnusedLocals: false,
                noUnusedParameters: false,
                strict: false,
                noEmit: true,
                skipLibCheck: true,
                skipDefaultLibCheck: true,
                noErrorTruncation: true,
                suppressExcessPropertyErrors: true,
                suppressImplicitAnyIndexErrors: true,
                allowJs: true,
                checkJs: false,
                noCheck: true
            });

            // Clear all extra libraries
            monaco.languages.typescript.javascriptDefaults.setExtraLibs([]);
            monaco.languages.typescript.typescriptDefaults.setExtraLibs([]);

            // Disable worker services
            monaco.languages.typescript.javascriptDefaults.setWorkerOptions({
                customWorkerPath: null
            });
            monaco.languages.typescript.typescriptDefaults.setWorkerOptions({
                customWorkerPath: null
            });

            // Disable all language features
            monaco.languages.typescript.javascriptDefaults.setEagerModelSync(false);
            monaco.languages.typescript.typescriptDefaults.setEagerModelSync(false);

            // Override Monaco's error reporting system
            this.overrideMonacoErrorReporting(monaco);

            console.log('All Monaco error checking disabled successfully');
        } catch (error) {
            console.log('Error disabling Monaco error checking:', error);
        }
    }

    overrideMonacoErrorReporting(monaco) {
        // Override Monaco's error reporting to prevent popups
        try {
            // Override the marker service to suppress all error markers
            const originalSetModelMarkers = monaco.editor.setModelMarkers;
            monaco.editor.setModelMarkers = (model, owner, markers) => {
                // Filter out all error markers to prevent popups
                const filteredMarkers = markers.filter(marker => 
                    marker.severity !== monaco.MarkerSeverity.Error
                );
                return originalSetModelMarkers.call(monaco.editor, model, owner, filteredMarkers);
            };

            // Override the hover provider to prevent error popups
            const originalRegisterHoverProvider = monaco.languages.registerHoverProvider;
            monaco.languages.registerHoverProvider = (selector, provider) => {
                const wrappedProvider = {
                    provideHover: (model, position, token) => {
                        try {
                            const result = provider.provideHover(model, position, token);
                            // Only show hover if it's not an error
                            if (result && result.contents) {
                                const contents = Array.isArray(result.contents) ? result.contents : [result.contents];
                                const hasError = contents.some(content => 
                                    typeof content === 'string' && content.toLowerCase().includes('error')
                                );
                                if (hasError) {
                                    return null; // Suppress error hovers
                                }
                            }
                            return result;
                        } catch (error) {
                            console.log('Hover provider error suppressed:', error);
                            return null;
                        }
                    }
                };
                return originalRegisterHoverProvider.call(monaco.languages, selector, wrappedProvider);
            };

            console.log('Monaco error reporting overridden');
        } catch (error) {
            console.log('Error overriding Monaco error reporting:', error);
        }
    }

    setupMarkerListener(monaco) {
        // Listen for marker changes and show errors in footer instead of popups
        monaco.editor.onDidChangeMarkers((uris) => {
            try {
                console.log('Marker change detected:', uris);
                const model = this.editor.getModel();
                if (!model) {
                    console.log('No model found');
                    return;
                }

                const markers = monaco.editor.getModelMarkers({ resource: model.uri });
                console.log('Markers found:', markers.length, markers);
                
                if (markers.length > 0) {
                    // Show errors in status bar instead of popups
                    const errorMessages = markers.map(marker => marker.message).join('; ');
                    console.log('Showing error in footer:', errorMessages);
                    this.showErrorsInFooter(errorMessages);
                } else {
                    console.log('Clearing errors from footer');
                    this.clearErrorsInFooter();
                }
            } catch (error) {
                console.log('Marker listener error:', error);
            }
        });
        
        console.log('Marker listener setup complete');
    }

    showErrorsInFooter(errorMessage) {
        // Show errors in the status bar instead of popups
        const statusElement = document.getElementById('status-text');
        if (statusElement) {
            statusElement.textContent = `Editor Error: ${errorMessage}`;
            statusElement.style.color = '#ff6b6b';
            
            // Auto-clear after 5 seconds
            setTimeout(() => {
                if (statusElement.textContent.includes('Editor Error:')) {
                    statusElement.textContent = 'Ready';
                    statusElement.style.color = '';
                }
            }, 5000);
        }
    }

    clearErrorsInFooter() {
        // Clear error messages from footer
        const statusElement = document.getElementById('status-text');
        if (statusElement && statusElement.textContent.includes('Editor Error:')) {
            statusElement.textContent = 'Ready';
            statusElement.style.color = '';
        }
    }

    createFallbackEditor() {
        // Create a simple textarea as fallback with no error checking
        const container = document.getElementById('monaco-editor');
        container.innerHTML = `
            <textarea id="fallback-editor" 
                      style="width: 100%; height: 100%; 
                             background: #1e1e1e; color: #d4d4d4; 
                             border: none; padding: 10px; 
                             font-family: 'Consolas', 'Courier New', monospace; 
                             font-size: 14px; resize: none; outline: none;
                             line-height: 1.5; tab-size: 4;"
                      placeholder="// Welcome to Code CAD&#10;// Start typing your CAD script here...&#10;// No error popups - all errors show in status bar"></textarea>
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
        
        // Content change - enabled when live update is on
        textarea.addEventListener('input', () => {
            console.log('Fallback editor content changed, callback exists:', !!this.contentChangeCallback);
            if (this.contentChangeCallback) {
                console.log('Calling fallback content change callback with content length:', textarea.value.length);
                this.contentChangeCallback(textarea.value);
            } else {
                console.log('No content change callback set for fallback editor');
            }
        });
        
        textarea.addEventListener('keyup', () => {
            const lines = textarea.value.substring(0, textarea.selectionStart).split('\n');
            const line = lines.length;
            const column = lines[lines.length - 1].length + 1;
            document.getElementById('cursor-position').textContent = `Line ${line}, Column ${column}`;
        });
        
        // Add error suppression to the textarea
        textarea.addEventListener('error', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Textarea error suppressed:', e);
        });
        
        console.log('Fallback editor initialized - NO ERROR POPUPS');
    }

    async loadMonaco() {
        // Load Monaco Editor from CDN
        return new Promise((resolve, reject) => {
            if (window.monaco) {
                console.log('Monaco already loaded');
                resolve(window.monaco);
                return;
            }

            console.log('Loading Monaco Editor from CDN...');
            // Load Monaco Editor from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs/loader.js';
            script.onload = () => {
                console.log('Monaco loader script loaded');
                if (window.require) {
                    window.require.config({ 
                        paths: { 
                            vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' 
                        } 
                    });
                    window.require(['vs/editor/editor.main'], () => {
                        console.log('Monaco Editor main module loaded');
                        resolve(window.monaco);
                    });
                } else {
                    console.error('window.require not available');
                    reject(new Error('Monaco Editor loader failed to initialize'));
                }
            };
            script.onerror = (error) => {
                console.error('Failed to load Monaco Editor script:', error);
                reject(new Error('Failed to load Monaco Editor'));
            };
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        if (!this.editor) return;

        // Content change - enabled when live update is on
        this.editor.onDidChangeModelContent(() => {
            console.log('Editor content changed, callback exists:', !!this.contentChangeCallback);
            if (this.contentChangeCallback) {
                const content = this.editor.getValue();
                console.log('Calling content change callback with content length:', content.length);
                this.contentChangeCallback(content);
            } else {
                console.log('No content change callback set');
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
        console.log('onContentChange called, setting callback');
        this.contentChangeCallback = callback;
        console.log('Content change callback set:', !!this.contentChangeCallback);
    }

    getCurrentLanguage() {
        return this.currentLanguage;
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

    // Apply font settings
    applyFontSettings(fontSize, fontFamily) {
        if (!this.editor) return;
        
        console.log('Applying font settings:', { fontSize, fontFamily });
        
        // Update Monaco editor font settings
        this.editor.updateOptions({
            fontSize: fontSize,
            fontFamily: fontFamily
        });
        
        console.log('Font settings applied successfully');
    }

    // Apply all editor settings from config
    async applyEditorSettings() {
        try {
            const { getConfigManager } = await import('../utils/config-manager.js');
            const configManager = getConfigManager();
            const config = await configManager.get();
            
            if (config.editor) {
                this.applyFontSettings(
                    config.editor.fontSize || 14,
                    config.editor.fontFamily || "Consolas, 'Courier New', monospace"
                );
                
                // Apply other editor settings
                if (this.editor) {
                    this.editor.updateOptions({
                        tabSize: config.editor.tabSize || 4,
                        insertSpaces: config.editor.insertSpaces !== false,
                        wordWrap: config.editor.wordWrap || 'on',
                        minimap: { enabled: config.editor.minimap !== false }
                    });
                }
            }
        } catch (error) {
            console.error('Failed to apply editor settings:', error);
        }
    }

    // Dispose
    dispose() {
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }
    }
}
