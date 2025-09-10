/**
 * Debug Console Manager
 * Captures console messages and displays them in the UI
 */
class DebugConsole {
    constructor() {
        this.messages = [];
        this.maxMessages = 100;
        this.isEnabled = true;
        this.originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info
        };
        
        this.initialize();
    }

    initialize() {
        // Override console methods to capture messages
        console.log = (...args) => {
            this.originalConsole.log(...args);
            this.addMessage('log', args);
        };

        console.error = (...args) => {
            this.originalConsole.error(...args);
            this.addMessage('error', args);
        };

        console.warn = (...args) => {
            this.originalConsole.warn(...args);
            this.addMessage('warn', args);
        };

        console.info = (...args) => {
            this.originalConsole.info(...args);
            this.addMessage('info', args);
        };

        // Setup UI
        this.setupUI();
    }

    setupUI() {
        const debugPanel = document.getElementById('debug-panel');
        const debugMessages = document.getElementById('debug-messages');
        const clearBtn = document.getElementById('clear-debug');
        const toggleBtn = document.getElementById('toggle-debug');

        if (!debugPanel || !debugMessages || !clearBtn || !toggleBtn) {
            console.log('Debug console UI elements not found');
            return;
        }

        // Initialize as collapsed
        debugPanel.classList.add('collapsed');
        toggleBtn.classList.remove('expanded');
        toggleBtn.textContent = '▲'; // Point up when collapsed

        // Toggle button functionality
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.togglePanel();
        });

        // Header click to toggle
        debugPanel.querySelector('.debug-header').addEventListener('click', () => {
            this.togglePanel();
        });

        // Clear button functionality
        clearBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.clearMessages();
        });

        // Initial message
        this.addMessage('info', ['Debug console initialized']);
    }

    togglePanel() {
        const debugPanel = document.getElementById('debug-panel');
        const toggleBtn = document.getElementById('toggle-debug');

        if (debugPanel.classList.contains('collapsed')) {
            debugPanel.classList.remove('collapsed');
            debugPanel.classList.add('expanded');
            toggleBtn.classList.add('expanded');
            toggleBtn.textContent = '▼'; // Point down when expanded
        } else {
            debugPanel.classList.remove('expanded');
            debugPanel.classList.add('collapsed');
            toggleBtn.classList.remove('expanded');
            toggleBtn.textContent = '▲'; // Point up when collapsed
        }
    }

    addMessage(type, args) {
        if (!this.isEnabled) return;

        const timestamp = new Date().toLocaleTimeString();
        const message = args.map(arg => {
            if (typeof arg === 'object') {
                try {
                    return JSON.stringify(arg, null, 2);
                } catch (e) {
                    return String(arg);
                }
            }
            return String(arg);
        }).join(' ');

        this.messages.push({
            type,
            message,
            timestamp
        });

        // Limit message count
        if (this.messages.length > this.maxMessages) {
            this.messages.shift();
        }

        this.updateUI();
    }

    updateUI() {
        const debugMessages = document.getElementById('debug-messages');
        if (!debugMessages) return;

        // Clear and rebuild messages
        debugMessages.innerHTML = '';

        this.messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `debug-message debug-${msg.type}`;
            messageDiv.innerHTML = `<span class="debug-time">[${msg.timestamp}]</span> ${msg.message}`;
            debugMessages.appendChild(messageDiv);
        });

        // Auto-scroll to bottom
        debugMessages.scrollTop = debugMessages.scrollHeight;
    }

    clearMessages() {
        this.messages = [];
        this.updateUI();
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    destroy() {
        // Restore original console methods
        console.log = this.originalConsole.log;
        console.error = this.originalConsole.error;
        console.warn = this.originalConsole.warn;
        console.info = this.originalConsole.info;
    }
}

// Export for use in other modules
window.DebugConsole = DebugConsole;
