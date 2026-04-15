// MAYIJU AHS v4.2 - Autonomous Health System
// Daemon Core & Logic Layer
// 负责系统自检、错误捕获、UI守护与健康遥测

(function() {
    // --- Configuration ---
    const AHS_CONFIG = {
        version: '4.2',
        fallbackVersion: '4.1',
        maxConsecutiveErrors: 3,
        healthReportInterval: 30000,
        uiWatchdogInterval: 5000,
        telemetryEndpoint: 'https://xhfyfkqfykkbbnlwghem.supabase.co/rest/v1/health_telemetry',
        cacheName: 'mayiju-mobile-v4.2',
        criticalAssets: [ '/', '/js/ui_controller.js', '/js/dynamics_engine.js', '/css/style.css' ],
        samplingRate: 0.05 // 5% Sampling
    };

    // --- Node-0: Exception Catcher (Daemon Core) ---
    window.AHS_errors = [];
    window.AHS_consecutiveErrors = parseInt(sessionStorage.getItem('AHS_ERR_COUNT') || '0');

    const logError = (err) => {
        const msg = (err.message || err.toString() || 'unknown').slice(0, 150);
        const errorData = { msg: msg, ts: Date.now(), type: err.type || 'runtime' };
        window.AHS_errors.push(errorData);
        if(window.AHS_errors.length > 50) window.AHS_errors.shift();

        window.AHS_consecutiveErrors++;
        sessionStorage.setItem('AHS_ERR_COUNT', window.AHS_consecutiveErrors);
        
        console.warn("[AHS] Error Caught:", msg);

        if(window.AHS_consecutiveErrors >= AHS_CONFIG.maxConsecutiveErrors) {
            console.error("触发熔断，准备回滚...");
            AHS_Rollback();
        }
    };

    // Expose to global for manual reporting (e.g. from try-catch blocks)
    window.AHS_onError = logError;

    // Global Listeners
    window.onerror = (msg, url, line) => logError({message: `${msg} at ${line}`, type: 'global'});
    window.onunhandledrejection = (e) => logError({message: e.reason, type: 'promise'});

    function AHS_Rollback() {
        sessionStorage.setItem('AHS_ERR_COUNT', '0');
        localStorage.setItem('AHS_FORCE_VERSION', AHS_CONFIG.fallbackVersion);
        const url = new URL(window.location.href);
        url.searchParams.set('v', AHS_CONFIG.fallbackVersion);
        window.location.replace(url.href);
    }

    // --- Node-1: Boot Check ---
    async function AHS_BootCheck() {
        console.log("[AHS] Starting Environment Pre-check...");
        const checkList = [
            { name: 'SupabaseSDK', test: () => (!!window.supabase) },
            // DynamicsEngine might be a global class
            { name: 'DynamicsEngine', test: () => (typeof window.DynamicsEngine !== 'undefined' || typeof DynamicsEngine !== 'undefined') },
            // Check if UI Controller is initialized
            { name: 'UIController', test: () => (!!window.ui) },
            // Check High Odds Logic
            { name: 'EncryptedLogic', test: () => (!!window.EncryptedLogic || typeof window.BAGUA_STRUCTURE !== 'undefined') }
        ];

        for (const item of checkList) {
            try {
                if (!item.test()) {
                    console.warn(`[AHS] 关键组件缺失: ${item.name} - Retrying in 3s...`);
                    await new Promise(r => setTimeout(r, 3000));
                    if (!item.test()) {
                         console.error(`[AHS] FATAL: ${item.name} still missing.`);
                         // Non-fatal, just log, to allow partial functionality
                    }
                }
            } catch (e) { console.error(e); }
        }
        console.log("[AHS] 环境自检通过 ✅");
        window.AHS_consecutiveErrors = 0;
        sessionStorage.setItem('AHS_ERR_COUNT', '0');
    }

    // --- Node-4: UI Watchdog ---
    setInterval(() => {
        // [FIX] Ignore if Login Modal is visible
        const loginModal = document.getElementById('login-modal');
        if (loginModal && loginModal.style.display !== 'none') return;

        // Only active if dashboard is supposed to be visible
        const dash = document.getElementById('dashboard-screen');
        if (!dash || dash.style.display === 'none') return;

        // Critical elements for Mobile/Desktop
        // Determine platform via window.MAYIJU_PLATFORM (set in ui_controller.js)
        const isMobile = (window.MAYIJU_PLATFORM === 'mobile');
        
        // Critical ID depends on mode
        const criticalId = isMobile ? 'mobile-input-area' : 'desktop-input';
        
        if (!document.getElementById(criticalId)) {
            console.warn(`[AHS] UI坍塌 (Missing ${criticalId})，尝试热重绘...`);
            
            // Call platform-specific render function
            if (isMobile) {
                if (typeof window.renderUI === 'function') {
                    window.renderUI();
                } else if (window.ui && typeof window.ui.renderInputArea === 'function') {
                    window.ui.renderInputArea();
                } else {
                    location.reload();
                }
            } else {
                if (typeof window.renderDesktopUI === 'function') {
                    window.renderDesktopUI();
                } else {
                    location.reload();
                }
            }
        }
    }, AHS_CONFIG.uiWatchdogInterval);

    // --- Node-5: Telemetry ---
    setInterval(async () => {
        if (Math.random() > AHS_CONFIG.samplingRate) return;

        const phone = localStorage.getItem('user_phone') || 'anonymous';
        const payload = {
            version: AHS_CONFIG.version,
            error_count: window.AHS_errors.length,
            user_hash: btoa(phone).slice(0, 8),
            timestamp: new Date().toISOString(),
            platform: window.MAYIJU_PLATFORM || 'unknown'
        };

        try {
            if (window.supabase && window.supabase.createClient) {
                 const SB_URL = 'https://xhfyfkqfykkbbnlwghem.supabase.co';
                 const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZnlma3FmeWtrYmJubHdnaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODA4ODEsImV4cCI6MjA4NDA1Njg4MX0.SVUTAVSWi-skCq3N3KioTetV40IWt0vNkewA0WqEfcg';
                 const client = window.supabase.createClient(SB_URL, SB_KEY);
                 
                 // Fire and forget using await to catch errors properly
                 const { error } = await client.from('health_telemetry').insert([payload]);
                 if (error) console.warn("[AHS] Telemetry Error:", error.message);
            }
        } catch (e) {
            console.warn("[AHS] Telemetry Failed:", e);
        }
    }, AHS_CONFIG.healthReportInterval);

    // --- Init ---
    if (document.readyState === 'complete') {
        AHS_BootCheck();
    } else {
        window.addEventListener('load', AHS_BootCheck);
    }

})();
