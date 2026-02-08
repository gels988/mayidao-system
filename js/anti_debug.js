(function() {
    // 0. Developer Mode Check
    if (localStorage.getItem('debug_mode') === 'true') {
        console.warn("⚠️ Developer Mode Enabled: Anti-debug disabled.");
        return;
    }

    const MAX_DEBUG_ATTEMPTS = 3;
    let debugAttempts = parseInt(localStorage.getItem('debug_attempts') || '0');

    function triggerProtection(reason) {
        debugAttempts++;
        localStorage.setItem('debug_attempts', debugAttempts);
        
        console.clear();
        console.warn(`Security Alert: ${reason}`);
        
        // Stop predictions
        if (window.predictNext) window.predictNext = function() { return null; };
        if (window.highMultiplePredictor) window.highMultiplePredictor.predictNext = function() { return null; };

        if (debugAttempts >= MAX_DEBUG_ATTEMPTS) {
            alert("⚠️ 非法调试行为检测。系统已锁定。");
            document.body.innerHTML = '<div style="color:red;text-align:center;margin-top:20%;"><h1>System Locked</h1><p>Security Violation Detected</p></div>';
            throw new Error("System Locked");
        }
    }

    // 1. DevTools Detection (Dimension Check)
    const threshold = 160;
    setInterval(() => {
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            triggerProtection("DevTools Opened");
        }
    }, 1000);

    // 2. Debugger Statement Loop
    setInterval(() => {
        const start = Date.now();
        debugger; // Will pause here if DevTools is open
        if (Date.now() - start > 100) {
            triggerProtection("Breakpoint Detected");
        }
    }, 500);

    // 3. Console Tampering
    const originalLog = console.log;
    Object.defineProperty(console, 'log', {
        get: function() {
            triggerProtection("Console Tampering");
            return originalLog;
        },
        set: function() {
            triggerProtection("Console Tampering");
        }
    });

    // 4. Disable Right Click & F12 (Basic UI Layer)
    document.addEventListener('contextmenu', e => e.preventDefault());
    document.addEventListener('keydown', e => {
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
            e.preventDefault();
            triggerProtection("Keyboard Shortcut");
        }
    });

    console.log("🛡️ Anti-Debug Active");
})();
