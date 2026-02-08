/**
 * MAYIJU State Hub
 * A lightweight centralized state management system to ensure UI-Logic consistency.
 * Layer 2 of Cognitive Bootstrap: UI-Logic Sync Watchdog
 */

window.MAYIJU_STATE = {
    // Core State Data
    state: {
        balanceG: 0,
        sciStatus: 'CHAOS',
        biasColor: null, // 'blue', 'red', or null
        accuracyRate: 0,
        totalPredictions: 0,
        nextPrediction: 'Waiting...', // 'Player', 'Banker', 'Balance'
        auditReady: false
    },

    listeners: {},

    /**
     * Update a state value and notify subscribers
     * @param {string} key - State key
     * @param {any} value - New value
     */
    update(key, value) {
        // Deep comparison for objects might be too heavy, simple check for primitives
        if (this.state[key] === value) return; 
        
        this.state[key] = value;
        
        // Notify specific listeners
        if (this.listeners[key]) {
            this.listeners[key].forEach(cb => {
                try {
                    cb(value);
                } catch (e) {
                    console.error(`[StateHub] Listener error for ${key}:`, e);
                }
            });
        }

        // Log significant changes
        // console.log(`[StateHub] ${key} ->`, value);
    },

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch
     * @param {function} callback - Function(newValue)
     */
    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);
        
        // Immediately fire with current value if it exists
        if (this.state[key] !== undefined) {
            try {
                callback(this.state[key]);
            } catch (e) {
                console.error(`[StateHub] Initial callback error for ${key}:`, e);
            }
        }
    },

    /**
     * Get current state value
     */
    get(key) {
        return this.state[key];
    }
};

// --- Auto Purge Mechanism (Log Cleanup) ---
// 自动清理72小时前的数据
function autoPurgeOldData() {
    const now = Date.now();
    const cutoff = now - 3 * 24 * 60 * 60 * 1000; // 3天

    console.log("[StateHub] Running auto purge...", new Date(cutoff).toLocaleString());

    // 清理模型统计（可选） 
    // const modelStats = JSON.parse(localStorage.getItem('model_stats') || '{}'); 
    // 若未来加入时间戳，可按时间清理 

    // 清理临时调试日志（如有） 
    Object.keys(localStorage).forEach(key => {
        if (key.startsWith('debug_') || key.startsWith('temp_')) {
            try {
                const item = JSON.parse(localStorage.getItem(key) || '{}');
                if (item.timestamp && item.timestamp < cutoff) {
                    localStorage.removeItem(key);
                    console.log(`[StateHub] Purged old log: ${key}`);
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }
    });

    // 记录最后清理时间 
    localStorage.setItem('last_purge', now.toString());
}

// 启动时执行（每24小时最多清理一次） 
try {
    const lastPurge = parseInt(localStorage.getItem('last_purge') || '0');
    if (Date.now() - lastPurge > 24 * 60 * 60 * 1000) {
        autoPurgeOldData();
    }
} catch (e) {
    console.warn("[StateHub] Auto purge failed:", e);
}

// Heartbeat System
setInterval(() => {
    const el = document.getElementById('heartbeat-indicator');
    if (el) {
        // Toggle Green/Dark
        const isGreen = el.style.backgroundColor === 'rgb(40, 167, 69)' || el.style.backgroundColor === '#28a745';
        el.style.backgroundColor = isGreen ? '#333' : '#28a745';
    }
}, 1000);

console.log("MAYIJU State Hub Initialized");
