
class BaguaAuditor {
    constructor() {
        this.stats = {
            total: 0,
            correct: 0,
            econ_total: 0,
            econ_correct: 0,
            res_total: 0,
            res_correct: 0,
            he9_count: 0,
            phase_he9_cancellations: 0,
            phase_repeat_boosts: 0,
            cycle_count: 0,
            sci: 0
        };
        this.history = [];
        // Bind to window for global access
        window.baguaAuditor = this;
    }

    logStep(logicType, predColor, actualColor, rawCodes) {
        if (!predColor || !actualColor) return;
        
        const isCorrect = (predColor === actualColor);
        
        // Update Global Stats
        this.stats.total++;
        if (isCorrect) this.stats.correct++;
        
        // Update Category Stats
        if (logicType === 'ECON' || logicType === 'BASE') {
            this.stats.econ_total++;
            if (isCorrect) this.stats.econ_correct++;
        } else if (logicType === 'RESONANCE' || logicType === 'PATTERN') {
            this.stats.res_total++;
            if (isCorrect) this.stats.res_correct++;
        }
        
        this.updateStats();
        
        // Notify State Hub
        if (window.MAYIJU_STATE) {
            window.MAYIJU_STATE.update('accuracyRate', this.getAccuracy());
            window.MAYIJU_STATE.update('totalPredictions', this.stats.total);
        }
    }

    // User Requested Method for He9 Tracking
    updateHe9Stats(p, b) {
        if (typeof p !== 'number' || typeof b !== 'number') return;
        const sum = (p + b) % 10;
        if (sum === 9) {
            this.stats.he9_count++;
            if (!this.stats.he9_pairs) this.stats.he9_pairs = {};
            const pairKey = `${p}-${b}`;
            this.stats.he9_pairs[pairKey] = (this.stats.he9_pairs[pairKey] || 0) + 1;
        }
        this.updateStats();
    }

    // User Requested Method for Direct Recording
    addRecord(actual, predicted, strategy = '') {
        if (!actual || !predicted) return;
        
        // Normalize to 'Player'/'Banker' if needed, or Color
        // If passed as 'Player'/'Banker'
        let actColor = null;
        if (actual === 'Player') actColor = 'blue';
        else if (actual === 'Banker') actColor = 'red';
        else if (actual === 'Tie') actColor = 'green';
        else actColor = actual; // Assume already color

        let predColor = null;
        if (predicted === 'Player') predColor = 'blue';
        else if (predicted === 'Banker') predColor = 'red';
        else predColor = predicted;

        if (!predColor || predColor === 'Waiting...' || predColor === 'Skip') return;

        // Determine Logic Type based on Strategy
        let logicType = 'BASE';
        if (strategy && (strategy.includes('Bagua') || strategy.includes('Dynamics') || strategy.includes('Resonance'))) {
            logicType = 'RESONANCE';
        }

        // Use logStep to centralize logic
        this.logStep(logicType, predColor, actColor, null);
    }
    
    updateStats() {
        // Calculate percentages
        const globalAcc = this.calcPct(this.stats.correct, this.stats.total);
        const econAcc = this.calcPct(this.stats.econ_correct, this.stats.econ_total);
        const resAcc = this.calcPct(this.stats.res_correct, this.stats.res_total);
        
        // Get DOM Elements
        const elAccMain = document.getElementById('accuracy-display');
        const elAccMonitor = document.getElementById('stat-accuracy');
        const elEcon = document.getElementById('stat-econ');
        const elRes = document.getElementById('stat-res-detail');
        const elSci = document.getElementById('stat-sci');
        const elResCount = document.getElementById('stat-resonance');
        const elHe9 = document.getElementById('stat-he9');
        const elPhaseHe9 = document.getElementById('stat-phase-he9');
        const elCycle = document.getElementById('stat-cycle');
        const elStatus = document.getElementById('logic-status');
        
        // Update Text
        const accText = `${globalAcc} (${this.stats.correct}/${this.stats.total})`;
        if (elAccMain) elAccMain.innerText = accText;
        if (elAccMonitor) elAccMonitor.innerText = accText;

        if (elEcon) elEcon.innerText = `${this.stats.econ_correct}/${this.stats.econ_total} (${econAcc})`;
        if (elRes) elRes.innerText = `${this.stats.res_correct}/${this.stats.res_total} (${resAcc})`;
        
        // Get SCI from DynamicsEngine if available
        let sciVal = 0;
        let sciStatus = "CHAOS";
        if (window.ui && window.ui.dynamics && window.ui.dynamics.coherenceLayer) {
            // We need current biases/weights to calc SCI.
            // DynamicsEngine doesn't expose them easily, but ui_controller.js captures lastSci from prediction result.
            // Let's use ui.lastSci
            sciVal = window.ui.lastSci || 0;
            sciStatus = window.ui.dynamics.coherenceLayer.getMarketStatus(sciVal);
        }
        
        if (elSci) elSci.innerText = `${sciVal.toFixed(2)} (${this.translateStatus(sciStatus)})`;
        
        if (elResCount) elResCount.innerText = `${this.stats.res_total}/${this.stats.total}`;
        if (elHe9) {
            // [USER REQUEST] Show count of He9 pairs
            elHe9.innerText = this.stats.he9_count;
            // Optional: Tooltip or title for details
            if (this.stats.he9_pairs) {
                const pairs = Object.entries(this.stats.he9_pairs).map(([k,v]) => `${k}x${v}`).join(', ');
                elHe9.title = pairs;
            }
        }
        if (elPhaseHe9) elPhaseHe9.innerText = `${this.stats.phase_he9_cancellations}/${this.stats.phase_total || 0}`;
        if (elCycle) elCycle.innerText = this.stats.cycle_count;
        
        if (elStatus) {
            elStatus.innerText = `运行中 | SCI: ${sciStatus}`;
            elStatus.className = 'status-indicator ' + (sciStatus === 'ROCK' ? 'status-blinking' : '');
            elStatus.style.color = (sciStatus === 'ROCK' ? '#00ffcc' : (sciStatus === 'EVOLVING' ? '#ffcc00' : '#fff'));
        }

        // 显示信号类型准确率（新增）
        if (window.sensitivityEngine) {
            const pandaAcc = window.sensitivityEngine.getSignalAccuracy('panda');
            const duiAcc = window.sensitivityEngine.getSignalAccuracy('dui');
            const trendAcc = window.sensitivityEngine.getSignalAccuracy('trend');

            const elPandaAcc = document.getElementById('stat-panda-acc');
            if (elPandaAcc) elPandaAcc.innerText = `${(pandaAcc * 100).toFixed(0)}%`;

            const elDuiAcc = document.getElementById('stat-dui-acc');
            if (elDuiAcc) elDuiAcc.innerText = `${(duiAcc * 100).toFixed(0)}%`;

            const elTrendAcc = document.getElementById('stat-trend-acc');
            if (elTrendAcc) elTrendAcc.innerText = `${(trendAcc * 100).toFixed(0)}%`;
        }
    }
    
    calcPct(num, den) {
        if (!den) return "0.00%";
        return ((num / den) * 100).toFixed(2) + "%";
    }
    
    getAccuracy() {
        if (!this.stats.total) return 0;
        return (this.stats.correct / this.stats.total);
    }
    
    translateStatus(status) {
        const map = {
            'ROCK': '稳态',
            'EVOLVING': '演化中',
            'CHAOS': '混沌态'
        };
        return map[status] || status;
    }
}

// Instantiate immediately
new BaguaAuditor();
