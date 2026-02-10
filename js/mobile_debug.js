(function() {
    // Mobile Debug Console
    // Usage: Tap H1 title 5 times to toggle debug console
    
    let debugEnabled = false;
    let clickCount = 0;
    let lastClickTime = 0;
    let consoleElement = null;
    
    // Initialize
    function init() {
        // Find title to attach trigger
        const title = document.querySelector('h1') || document.querySelector('.logo');
        if (title) {
            title.addEventListener('click', handleTrigger);
            // Add visual hint that debug is available (optional, maybe just for us)
            title.setAttribute('title', 'Tap 5 times for Debug Console');
        }
        
        // Check URL param
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('debug') === 'true') {
            enableDebug();
        }
        
        console.log('[MobileDebug] Initialized. Tap title 5 times to activate.');
    }
    
    function handleTrigger(e) {
        const now = Date.now();
        if (now - lastClickTime > 1000) {
            clickCount = 0;
        }
        
        clickCount++;
        lastClickTime = now;
        
        if (clickCount >= 5) {
            clickCount = 0;
            toggleDebug();
        }
    }
    
    function toggleDebug() {
        debugEnabled = !debugEnabled;
        if (debugEnabled) {
            enableDebug();
            alert('Debug Mode Enabled');
        } else {
            disableDebug();
        }
    }
    
    function enableDebug() {
        if (consoleElement) {
            consoleElement.style.display = 'block';
            return;
        }
        
        // Create Console UI
        consoleElement = document.createElement('div');
        consoleElement.id = 'mobile-debug-console';
        consoleElement.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            height: 40vh;
            background: rgba(0,0,0,0.9);
            color: #0f0;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            overflow-y: auto;
            z-index: 999999;
            border-top: 2px solid #fff;
            box-sizing: border-box;
            pointer-events: auto;
        `;
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = 'border-bottom: 1px solid #333; margin-bottom: 5px; padding-bottom: 5px; display:flex; justify-content:space-between;';
        header.innerHTML = '<span>🔧 Debug Console</span> <button id="close-debug" style="background:red;color:white;border:none;padding:2px 8px;">X</button>';
        consoleElement.appendChild(header);
        
        // Logs container
        const logs = document.createElement('div');
        logs.id = 'debug-logs';
        consoleElement.appendChild(logs);
        
        document.body.appendChild(consoleElement);
        
        // Close button
        document.getElementById('close-debug').addEventListener('click', () => {
            consoleElement.style.display = 'none';
        });
        
        // Intercept Console
        interceptConsole(logs);
        
        // Show initial info
        console.log('UserAgent: ' + navigator.userAgent);
        console.log('Screen: ' + window.innerWidth + 'x' + window.innerHeight);
    }
    
    function disableDebug() {
        if (consoleElement) {
            consoleElement.style.display = 'none';
        }
    }
    
    function interceptConsole(container) {
        const originalLog = console.log;
        const originalError = console.error;
        const originalWarn = console.warn;
        
        function appendLog(type, args) {
            const msg = args.map(arg => {
                try {
                    return typeof arg === 'object' ? JSON.stringify(arg) : String(arg);
                } catch(e) {
                    return '[Object]';
                }
            }).join(' ');
            
            const line = document.createElement('div');
            line.style.cssText = 'margin-bottom: 2px; border-bottom: 1px solid #222; word-break: break-all;';
            
            const time = new Date().toTimeString().split(' ')[0];
            
            let color = '#0f0'; // log
            if (type === 'ERROR') color = '#f55';
            if (type === 'WARN') color = '#fb0';
            
            line.innerHTML = `<span style="color:#888">[${time}]</span> <span style="color:${color}">[${type}]</span> ${msg}`;
            container.appendChild(line);
            
            // Auto scroll
            container.scrollTop = container.scrollHeight;
            consoleElement.scrollTop = consoleElement.scrollHeight;
        }
        
        console.log = function() {
            appendLog('LOG', Array.from(arguments));
            originalLog.apply(console, arguments);
        };
        
        console.error = function() {
            appendLog('ERROR', Array.from(arguments));
            originalError.apply(console, arguments);
        };
        
        console.warn = function() {
            appendLog('WARN', Array.from(arguments));
            originalWarn.apply(console, arguments);
        };
        
        // Global Errors
        window.onerror = function(msg, url, line, col, error) {
            appendLog('ERROR', [`Global: ${msg} (${url}:${line})`]);
            return false;
        };
        
        window.addEventListener('unhandledrejection', function(e) {
            appendLog('ERROR', [`Promise: ${e.reason}`]);
        });
    }
    
    // Run
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();