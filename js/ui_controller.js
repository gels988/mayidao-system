/**
 * UI Controller
 * Manages interaction between DOM, AuthBridge, and G2Engine
 * Updated for Phase 3: Accuracy Validation & Pattern Display
 * Updated for Economy Model: No Login, G-Coin Management
 */

class UIController {
    constructor(engine, auth) {
        this.engine = engine;
        this.auth = auth;
        this.pollingInterval = null;
        
        // Accuracy Tracking
        this.stats = {
            total_predictions: 0,
            total_correct: 0
        };
        
        this.lastPrediction = null; // Store previous prediction for validation
        
        // Expose for inline HTML onclicks
        window.ui = this;
    }
    
    init() {
        console.log("UI Initialized (Economy Mode)");
        
        // Register Phase 3 Plugin
        this.dynamics = new DynamicsEngine();
        this.engine.registerPlugin(this.dynamics);
        
        this.bindEvents();
        this.refreshAccountInfo();
        this.startPolling();
        this.initSSEClient();
        this.initMonitor();
        
        // Initial Render
        this.renderHistoryPanel();
        this.renderRecentHistory();
        this.renderMatrix();

        const prediction = this.engine.predictNext();
        this.lastPrediction = prediction.next_prediction;
        this.renderPrediction(prediction);
        this.updateSmartStatus();
    }

    bindEvents() {
        // Core Game Events
        const predictBtn = document.getElementById('btn-predict');
        if (predictBtn) predictBtn.addEventListener('click', () => this.handlePrediction());

        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetGame());

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleExit());
        
        // Economy Events
        const rechargeBtn = document.getElementById('btn-recharge');
        if (rechargeBtn) rechargeBtn.addEventListener('click', () => this.openRechargeModal());
        
        const withdrawBtn = document.getElementById('btn-withdraw');
        if (withdrawBtn) withdrawBtn.addEventListener('click', () => this.openWithdrawModal());

        const delBtn = document.getElementById('btn-delete');
        if (delBtn) delBtn.addEventListener('click', () => this.handleDeleteLast());
    }

    handleDeleteLast() {
        // 1. Clear Input Fields
        this.clearInputs();
        
        // 2. Undo Last Round in Engine
        if (this.engine.undoLastRound()) {
            this.updateStatus("Last round deleted. Recalculating...");
            
            // 3. Update Stats (Decrement prediction count if last was predicted)
            // Note: Exact undo of stats is hard without tracking. 
            // Replaying might be better for stats too if engine tracked them.
            // For now, we accept stats might be slightly off or we just rely on engine's prediction.
            
            // 4. Re-Render Everything
            const prediction = this.engine.predictNext();
            this.lastPrediction = prediction.next_prediction;
            
            this.renderMatrix();
            this.renderHistoryPanel(); 
            this.renderRecentHistory();
            
            // Show the NEW last result (which was the 2nd to last before undo)
            const lastRound = this.engine.history.length > 0 ? this.engine.history[this.engine.history.length - 1] : null;
            this.renderMolDenomPanel(lastRound);
            
            this.renderPrediction(prediction);
            this.updateSmartStatus();
        } else {
            this.updateStatus("Nothing to delete.");
        }
    }

    resetGame() {
        this.engine.reset();
        this.stats = { total_predictions: 0, total_correct: 0 };
        this.lastPrediction = null;
        this.renderMatrix();
        this.renderHistoryPanel(); 
        this.renderRecentHistory(); // Add this
        this.renderMolDenomPanel(null);
        this.updateSmartStatus();
        this.updateStatus("System Reset");
    }

    handleExit() {
        this.engine.reset();
        this.stats = { total_predictions: 0, total_correct: 0 };
        this.lastPrediction = null;
        this.renderMatrix();
        this.renderHistoryPanel();
        this.renderRecentHistory();
        this.renderMolDenomPanel(null);
        this.updateSmartStatus();
        this.updateStatus("Session Exit");

        try {
            window.location.reload();
        } catch (e) {
        }
    }

    // --- Economy Handlers ---

    async refreshAccountInfo() {
        const status = await this.auth.getAccountStatus();
        this.updateBalance(status.balance);
        
        const userEl = document.getElementById('user-id-display');
        if (userEl) {
            const vipName = status.vip_name || (status.vip_level > 0 ? `VIP${status.vip_level}` : "");
            userEl.innerText = status.user_id + (vipName ? ` (${vipName})` : "");

            // Visual cue for Trial
            if (vipName.includes("TRIAL")) {
                userEl.style.background = "#ff9800"; // Orange for Trial
                userEl.style.color = "#000";
            } else if (vipName.includes("EXPIRED")) {
                userEl.style.background = "#dc3545"; // Red for Expired
            } else if (vipName.includes("ACTIVATED")) {
                userEl.style.background = "#28a745"; // Green for Activated
            }
        }
        
        // Show/Hide Withdraw Button based on balance
        const wBtn = document.getElementById('btn-withdraw');
        if (wBtn) {
            wBtn.style.display = status.balance >= 6000 ? 'inline-block' : 'none';
        }

        // Update Predict Button Price
        const pBtn = document.getElementById('btn-predict');
        if (pBtn) {
            if (window.TrialManager && !window.TrialManager.isPermanentlyActivated()) {
                 pBtn.innerText = `熵分析 (20 G-Gas)`;
            } else {
                const rawCost = 20 * (status.vip_discount || 1.0);
                const finalCost = Math.max(1, Math.floor(rawCost));
                pBtn.innerText = `熵分析 (${finalCost} G-Gas)`;
            }
        }
    }

    updateBalance(balance) {
        const el = document.getElementById('g-coin-display');
        const displayBalance = (typeof get_display_g_balance === 'function') ? get_display_g_balance() : balance;
        if (el) el.innerText = Math.floor(displayBalance).toLocaleString();
    }

    openRechargeModal() {
        const modal = document.getElementById('recharge-modal');
        if (modal) modal.style.display = 'flex';
        const preview = document.getElementById('recharge-preview');
        if (preview) preview.innerText = '';
    }

    openWithdrawModal() {
        document.getElementById('withdraw-modal').style.display = 'flex';
    }

    clearInputs() {
        const p = document.getElementById('input-player');
        const b = document.getElementById('input-banker');
        if(p) p.value = '';
        if(b) b.value = '';
    }

    async handleCustomRecharge() {
        const amountStr = prompt("请输入 USDT 金额 (1~100000):", "100");
        if (!amountStr) return;
        const amount = parseInt(amountStr); // Force Integer
        if (isNaN(amount) || amount < 1 || amount > 100000) {
            alert("金额需在 1~100000 之间");
            return;
        }
        this.handleRecharge(amount);
    }

    async handleRecharge(amount) {
        if (!confirm(`确认充值 ${amount} USDT 并激活算力？`)) return;

        this.updateStatus("Processing Recharge...");
        const result = await this.auth.recharge(amount);
        
        if (result.success) {
            let accPct = '0.0';
            if (window.TrialManager && window.TrialManager.state && typeof window.TrialManager.state.accuracy === 'number') {
                accPct = (window.TrialManager.state.accuracy * 100).toFixed(1);
            }
            alert(`✅ 节点激活成功！\n${amount} U → ${result.added} G-Gas\n熵分析准确率：${accPct}% ，仅正确熵分析扣除 1 G-Gas`);
            const modal = document.getElementById('recharge-modal');
            if (modal) modal.style.display = 'none';
            this.refreshAccountInfo();
            this.updateStatus("节点激活完成");
            const preview = document.getElementById('recharge-preview');
            if (preview) preview.innerText = '';
        }
    }

    async handleWithdraw() {
        const input = document.getElementById('withdraw-amount');
        const amount = parseInt(input.value);
        
        if (isNaN(amount) || amount < 6000) {
            alert("Minimum withdrawal is 6000 G");
            return;
        }

        if (!confirm(`Confirm withdrawal of ${amount} G?`)) return;

        const result = await this.auth.withdraw(amount);
        if (result.success) {
            alert("Withdrawal Successful! Funds sent to linked wallet."); // Mock
            document.getElementById('withdraw-modal').style.display = 'none';
            this.refreshAccountInfo();
        } else {
            alert("Failed: " + result.error);
        }
    }

    // --- Game Logic ---

    async handlePrediction() {
        const pVal = parseInt(document.getElementById('input-player').value);
        const bVal = parseInt(document.getElementById('input-banker').value);
        
        const pPair = false; 
        const bPair = false;

        if (isNaN(pVal) || isNaN(bVal)) {
            alert("Please enter valid points (0-9)");
            return;
        }

        const hasTrialManager = typeof window.TrialManager !== 'undefined' && window.TrialManager;
        const isActivated = hasTrialManager && typeof window.TrialManager.isPermanentlyActivated === 'function' && window.TrialManager.isPermanentlyActivated();
        const inTrial = hasTrialManager && typeof window.TrialManager.isInTrial === 'function' && window.TrialManager.isInTrial();

        const allowed = (typeof should_allow_prediction === 'function') ? should_allow_prediction() : true;
        if (!allowed) return;
        const lastIndexBefore = this.engine.history ? this.engine.history.length : 0;
        const lastColor = lastIndexBefore > 0 ? this._getLastColorBeforeIndex(lastIndexBefore) : '';
        const hadContext = !!lastColor;

        if (inTrial) {
            const trialBalance = typeof get_display_g_balance === 'function' ? get_display_g_balance() : (this.auth && this.auth.user ? this.auth.user.balanceG : 0);
            this.updateStatus(`熵分析消耗：20 G-Gas`);
            this.updateBalance(trialBalance);
        }

        const result = this.engine.processRound(pVal, bVal, pPair, bPair);
        
        let econCorrect = false;
        if (hadContext) {
            econCorrect = this._isPredictionCorrect(lastColor, result);
            this.stats.total_predictions++;
            if (econCorrect) {
                this.stats.total_correct++;
            }
            if (window.TrialManager && window.TrialManager.state) {
                const s = window.TrialManager.state;
                if (typeof s.totalPredictions !== 'number' || !Number.isFinite(s.totalPredictions)) {
                    s.totalPredictions = 0;
                }
                if (typeof s.correctPredictions !== 'number' || !Number.isFinite(s.correctPredictions)) {
                    s.correctPredictions = 0;
                }
                s.totalPredictions++;
                if (econCorrect) {
                    s.correctPredictions++;
                }
                s.accuracy = s.totalPredictions > 0 ? (s.correctPredictions / s.totalPredictions) : 0;
                if (typeof window.TrialManager.saveState === 'function') {
                    window.TrialManager.saveState();
                }
            }
        }

        if (this.lastPrediction && this.lastPrediction !== "Skip" && this.lastPrediction !== "Waiting..." && this.dynamics) {
            this.dynamics.recordPredictionResult(this.lastPrediction, result.winner);
        }

        this.updateSmartStatus();

        if (isActivated && hadContext) {
            if (econCorrect) {
                const deduction = apply_correct_prediction_deduction();
                if (deduction && deduction.success) {
                    this.updateStatus(`熵分析正确：扣除 1 G-Gas`);
                    this.updateBalance(deduction.balance);
                } else {
                    this.updateStatus("熵分析正确但余额不足");
                }
            } else {
                this.updateStatus("熵分析错误：0 G-Gas");
            }
        }

        const prediction = this.engine.predictNext();
        this.lastPrediction = prediction.next_prediction;

        this.renderMatrix();
        this.renderHistoryPanel(); 
        this.renderRecentHistory(); // Add this
        this.renderMolDenomPanel(result);
        this.renderPrediction(prediction);
    }

    initSSEClient() {
        try {
            if (typeof EventSource === 'undefined') return;
            const es = new EventSource('/api/sse/balance');
            es.onmessage = (e) => {
                try {
                    const data = JSON.parse(e.data);
                    const uid = (this.auth && this.auth.user && this.auth.user.id) ? this.auth.user.id : '';
                    const did = (window.TrialManager && window.TrialManager.state && window.TrialManager.state.deviceId) ? window.TrialManager.state.deviceId : '';
                    if (data && (data.userId === uid || data.userId === did)) {
                        const delta = parseInt(data.deltaG || data.delta || 0, 10);
                        if (Number.isFinite(delta) && delta !== 0) {
                            if (window.TrialManager && window.TrialManager.state) {
                                window.TrialManager.state.balance = (window.TrialManager.state.balance || 0) + delta;
                                if (typeof window.TrialManager.saveState === 'function') {
                                    window.TrialManager.saveState();
                                }
                            }
                            if (this.auth && this.auth.user) {
                                this.auth.user.balanceG = (this.auth.user.balanceG || 0) + delta;
                            }
                            this.updateBalance(this.auth.user.balanceG);
                            this.updateStatus(`远程上分同步：+${delta} G-Gas`);
                        }
                    }
                } catch (_) {}
            };
            es.onerror = () => { try { es.close(); } catch (_) {} };
        } catch (_) {}
    }

    // --- Rendering Methods (Preserved) ---

    renderMolDenomPanel(lastResult) {
        const panel = document.getElementById('mol-denom-panel');
        if (!panel) return;
        panel.style.display = 'flex';
        
        const pEl = document.getElementById('md-p-val');
        const bEl = document.getElementById('md-b-val');
        
        if (lastResult) {
            pEl.innerText = lastResult.playerVal;
            bEl.innerText = lastResult.bankerVal;
            pEl.style.color = lastResult.winner === 'Player' ? '#007bff' : '#fff';
            bEl.style.color = lastResult.winner === 'Banker' ? '#dc3545' : '#fff';
        } else {
            pEl.innerText = '-';
            bEl.innerText = '-';
            pEl.style.color = '#fff';
            bEl.style.color = '#fff';
        }
    }

    renderRecentHistory() {
        const container = document.getElementById('history-scroll');
        if (!container) return;
        container.innerHTML = '';

        // Show last 20 rounds
        const recent = this.engine.history.slice(-20);
        
        if (recent.length === 0) {
            container.innerHTML = '<span style="color:#666; font-size:10px; padding:0 5px;">Waiting for results...</span>';
            return;
        }

        recent.forEach(r => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'inline-flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.marginRight = '8px';
            wrapper.style.padding = '2px 4px';
            wrapper.style.backgroundColor = '#333';
            wrapper.style.border = '1px solid #444';
            wrapper.style.borderRadius = '4px';
            wrapper.style.fontSize = '10px';
            wrapper.style.textAlign = 'center';
            wrapper.style.minWidth = '40px';

            // 1. Molecular/Denominator (P/B) Only
            const valDiv = document.createElement('div');
            valDiv.innerHTML = `<span style="color:#007bff">${r.playerVal}</span> / <span style="color:#dc3545">${r.bankerVal}</span>`;
            
            wrapper.appendChild(valDiv);
            container.appendChild(wrapper);
        });
    }

    renderHistoryPanel() {
        const panel = document.getElementById('history-panel');
        if (!panel) return;
        
        const history = this.engine.history;
        panel.innerHTML = '';
        
        // Filter Ties for Bagua Calculation
        const rounds = history.filter(r => r.winner !== 'Tie');

        if (rounds.length < 3) {
            panel.innerHTML = '<div style="width:100%; text-align:center; color:#aaa; font-size:12px;">Waiting for data (Need 3 rounds)...</div>';
            return;
        }

        // Calculate Bagua from chunks of 3 rounds
        const baguaItems = [];
        
        for (let i = 0; i < rounds.length; i++) {
            if ((i + 1) % 3 === 0) {
                // Get chunk of 3
                const chunk = [rounds[i-2], rounds[i-1], rounds[i]];
                
                // Map to Binary: Player(Big/Blue)=1, Banker(Small/Red)=0
                // Order: Top(1st) -> Bottom(3rd)
                const binStr = chunk.map(r => r.winner === 'Player' ? '1' : '0').join('');
                
                let baguaVal = null;
                if (typeof Bagua !== 'undefined') {
                    baguaVal = Bagua.binToNumber(binStr);
                }

                if (baguaVal !== null) {
                    baguaItems.push({
                        val: baguaVal,
                        bin: binStr,
                        dom: null,
                        isCancelled: false
                    });
                }
            }
        }

        // Render Bagua Items
        const uncancelledStack = [];
        baguaItems.forEach((item, idx) => {
            const col = document.createElement('div');
            col.className = 'history-col';
            
            const baguaDiv = document.createElement('div');
            baguaDiv.className = 'hist-bagua';
            baguaDiv.innerText = item.val;
            
            // Color Logic: 1,2,3,5 Blue; 4,6,7,8 Red
            const isBlue = [1, 2, 3, 5].includes(item.val);
            baguaDiv.classList.add(isBlue ? 'bagua-blue' : 'bagua-red');
            
            item.dom = baguaDiv;

            // Cancellation Logic (Green Slash) - Stack Based
            let matched = false;
            // Scan backwards to find any matching item regardless of interval
            for (let j = uncancelledStack.length - 1; j >= 0; j--) {
                const prev = uncancelledStack[j];
                
                const sum = prev.val + item.val;
                const diff = Math.abs(prev.val - item.val);
                const isPair = prev.val === item.val;
                
                if (sum === 9 || isPair || diff === 1) {
                     this.addSlash(prev.dom, 'green');
                     this.addSlash(item.dom, 'green');
                     prev.isCancelled = true;
                     item.isCancelled = true;
                     
                     // Remove the matched item from stack
                     uncancelledStack.splice(j, 1);
                     matched = true;
                     break; // Stop after first match
                }
            }

            if (!matched) {
                uncancelledStack.push(item);
            }

            col.appendChild(baguaDiv);
            panel.appendChild(col);
        });
        
        // Auto-scroll to end
        panel.scrollLeft = panel.scrollWidth;
    }

    calculateBaguaFromStreaks(chunk) {
        if (typeof Bagua !== 'undefined') {
            return Bagua.fromStreaks(chunk);
        }
        if (chunk.length !== 3) return null;
        const map = chunk.map(s => s.winner === 'Player' ? '1' : '0').join('');
        switch (map) {
            case '111': return 1;
            case '011': return 2;
            case '101': return 3;
            case '001': return 4;
            case '110': return 5;
            case '010': return 6;
            case '100': return 7;
            case '000': return 8;
            default: return null;
        }
    }

    addSlash(element, color) {
        const slash = document.createElement('div');
        slash.className = `slash-overlay slash-${color}`;
        element.appendChild(slash);
    }

    updateSmartStatus() {
        const accElement = document.getElementById('accuracy-display');
        if (accElement) {
            let pct = 0;
            if (this.stats.total_predictions > 0) {
                pct = (this.stats.total_correct / this.stats.total_predictions) * 100;
            }
            accElement.innerText = `Acc: ${pct.toFixed(1)}%`;
        }

        const patElement = document.getElementById('active-pattern-display');
        if (patElement && this.dynamics) {
            const patterns = this.dynamics.getActivePatterns();
            if (patterns.length > 0) {
                patElement.innerText = patterns.join(" | ");
                patElement.style.color = "#00ff00"; 
                patElement.style.fontWeight = "bold";
            } else {
                patElement.innerText = "Scanning Patterns...";
                patElement.style.color = "#ffd700"; 
                patElement.style.fontWeight = "normal";
            }
        }
    }

    updateStatus(msg) {
        const panel = document.getElementById('status-panel');
        if (panel) panel.innerText = msg;
    }

    renderMatrix() {
        const container = document.getElementById('game-matrix');
        if (!container) return;
        container.innerHTML = ''; 
        
        if (!this.engine.grid) return; // Safety check

        this.engine.grid.forEach(col => {
            const colDiv = document.createElement('div');
            colDiv.className = 'grid-col';
            
            for (let i = 0; i < 6; i++) {
                const cellData = col[i]; 
                const cellDiv = document.createElement('div');
                cellDiv.className = 'grid-cell';
                
                if (cellData && typeof cellData === 'object') {
                    const circle = document.createElement('div');
                    const isPlayer = cellData.winner === 'Player';
                    circle.className = `circle ${isPlayer ? 'blue' : 'red'}`;
                    
                    const m = cellData.markers;
                    let text = '';
                    if (m.pVal === 7 || m.bVal === 7) text = '7';
                    if (m.pVal === 8 || m.bVal === 8) text = '8'; 
                    if (m.bVal === 6) text = '6';
                    circle.innerText = text;

                    if (m.isTie) {
                        const slash = document.createElement('div');
                        slash.className = 'slash';
                        circle.appendChild(slash);
                    }
                    if (m.pPair) {
                        const pDot = document.createElement('div');
                        pDot.className = 'dot blue-pair';
                        circle.appendChild(pDot);
                    }
                    if (m.bPair) {
                        const bDot = document.createElement('div');
                        bDot.className = 'dot red-pair';
                        circle.appendChild(bDot);
                    }
                    if (m.pVal === 7 && m.bVal === 6) {
                        const crown = document.createElement('div');
                        crown.className = 'crown-icon';
                        crown.innerText = '👑';
                        circle.appendChild(crown);
                    }
                    cellDiv.appendChild(circle);
                }
                colDiv.appendChild(cellDiv);
            }
            container.appendChild(colDiv);
        });
        this.renderStatsPanel();
    }

    renderStatsPanel() {
        const history = this.engine.history;
        let blue = 0, red = 0, ties = 0, bluePairs = 0, redPairs = 0;

        history.forEach(h => {
            if (h.winner === 'Player') blue++;
            if (h.winner === 'Banker') red++;
            if (h.winner === 'Tie') ties++;
            if (h.pPair) bluePairs++;
            if (h.bPair) redPairs++;
        });

        const elBlue = document.getElementById('stat-blue-total');
        const elRed = document.getElementById('stat-red-total');
        const elTie = document.getElementById('stat-tie-total');
        const elBP = document.getElementById('stat-blue-pair');
        const elRP = document.getElementById('stat-red-pair');

        if(elBlue) elBlue.innerText = blue;
        if(elRed) elRed.innerText = red;
        if(elTie) elTie.innerText = ties;
        if(elBP) elBP.innerText = bluePairs;
        if(elRP) elRP.innerText = redPairs;
    }

    _getHighOddsHistory() {
        if (!window.EncryptedLogic) return [];
        const labelHistory = [];
        for (let i = 0; i < this.engine.history.length; i++) {
            const r = this.engine.history[i];
            const lastTwoColor = this._getLastTwoColorsBeforeIndex(i);
            const ctx = {
                P_sum: r.playerVal,
                B_sum: r.bankerVal,
                lastTwoColor,
                history: [...labelHistory] // Pass copy of current history
            };
            const label = window.EncryptedLogic.getHighOddsResult(ctx);
            labelHistory.push(label);
        }
        return labelHistory;
    }

    _getLastTwoColorsBeforeIndex(endExclusiveIndex) {
        const mapColor = (w) => w === 'Player' ? '蓝' : (w === 'Banker' ? '红' : '');
        const colors = [];

        const end = Math.min(this.engine.history.length, Math.max(0, endExclusiveIndex));
        for (let i = end - 1; i >= 0 && colors.length < 2; i--) {
            const w = this.engine.history[i]?.winner;
            if (!w || w === 'Tie') continue;
            const c = mapColor(w);
            if (!c) continue;
            colors.push(c);
        }

        if (colors.length < 2) return '';
        return colors[1] + colors[0];
    }

    _getLastColorBeforeIndex(endExclusiveIndex) {
        const mapColor = (w) => w === 'Player' ? '蓝' : (w === 'Banker' ? '红' : '');
        const end = Math.min(this.engine.history.length, Math.max(0, endExclusiveIndex));
        for (let i = end - 1; i >= 0; i--) {
            const w = this.engine.history[i]?.winner;
            if (!w || w === 'Tie') continue;
            const c = mapColor(w);
            if (!c) continue;
            return c;
        }
        return '';
    }

    _isPredictionCorrect(lastColor, result) {
        if (!lastColor || !result) return false;
        if (lastColor === '蓝') return result.playerVal > result.bankerVal;
        if (lastColor === '红') return result.playerVal < result.bankerVal;
        return false;
    }

    renderPrediction(pred) {
        const panel = document.getElementById('prediction-panel');
        if (!panel) return;

        const predictionText = pred.next_prediction || "Waiting...";
        let visualClass = 'neutral';
        let color = '#aaa';
        
        if (predictionText === 'Player') {
             visualClass = 'player';
             color = '#007bff';
        } else if (predictionText === 'Banker') {
             visualClass = 'banker';
             color = '#dc3545';
        } else if (predictionText === 'Balance') {
             visualClass = 'neutral';
             color = '#28a745';
        }

        const confidencePct = Math.round(pred.confidence * 100);
        
        const lastRound = this.engine.history.length > 0 ? this.engine.history[this.engine.history.length - 1] : null;
        const fullHighOddsHistory = this._getHighOddsHistory();
        const historyForCurrent = fullHighOddsHistory.slice(0, Math.max(0, fullHighOddsHistory.length - 1));
        const lastRoundIdx = this.engine.history.length - 1;
        const highOddsText = (window.EncryptedLogic && lastRound) ? window.EncryptedLogic.getHighOddsResult({
            P_sum: lastRound.playerVal,
            B_sum: lastRound.bankerVal,
            lastTwoColor: this._getLastTwoColorsBeforeIndex(lastRoundIdx),
            history: historyForCurrent
        }) : "高赔率";

        panel.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:flex-start;">
                <div style="text-align:left; margin-right: 10px;">
                    <div style="font-size:12px; color:#aaa;">PREDICTION</div>
                    <div style="font-size:24px; font-weight:bold; color:${color}">
                        ${predictionText.toUpperCase()}
                    </div>
                    <div style="font-size:12px; margin-top:5px;">${pred.strategy || 'System Ready'}</div>
                </div>
                
                <div class="pred-visual ${visualClass}" style="margin-right: 10px; ${predictionText === 'Balance' ? 'background-color:' + color : ''}"></div>
                
                <div id="high-odds-box" style="
                    border: 1px solid #555; 
                    background: linear-gradient(180deg, #333, #1a1a1a); 
                    color: #ffd700; 
                    padding: 0 10px; 
                    border-radius: 6px; 
                    font-size: 14px; 
                    min-width: 80px; 
                    height: 40px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                    font-weight: bold;
                    letter-spacing: 1px;
                ">
                    ${highOddsText}
                </div>
            </div>
            
            <div style="margin-top:15px;">
                <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:2px;">
                    <span>Confidence</span>
                    <span>${confidencePct}%</span>
                </div>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${confidencePct}%"></div>
                </div>
            </div>
            
            ${pred.details && pred.details.active_patterns ? `
            <div class="active-patterns">
                ${pred.details.active_patterns.map(p => `<span class="pattern-tag">${p}</span>`).join('')}
            </div>` : ''}
        `;

        const circle = panel.querySelector('.pred-visual');
        const statusEl = document.getElementById('logic-status');
        if (circle) circle.classList.remove('prediction-glow', 'green');
        if (statusEl) statusEl.classList.remove('status-blinking');
        if (predictionText === 'Balance' && pred.observation_mode) {
            if (circle) circle.classList.add('prediction-glow', 'green');
            if (statusEl) {
                statusEl.innerText = '⚖️ OBSERVING';
                statusEl.classList.add('status-blinking');
            }
        }
    }

    startPolling() {
        if (this.pollingInterval) return;
        this.pollingInterval = setInterval(async () => {
            this.refreshAccountInfo();
        }, 5000);
    }

    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
    initMonitor() {
        if (document.getElementById('bagua-monitor')) return;
        const style = document.createElement('style');
        style.innerHTML = 
        `.monitor-container{position:fixed;top:20px;right:20px;width:200px;background:rgba(0,0,0,.75);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,.2);border-radius:8px;color:#fff;font-family:'Segoe UI',sans-serif;z-index:9999;box-shadow:0 8px 32px rgba(0,0,0,.5)}
        .monitor-header{padding:8px 12px;background:rgba(255,255,255,.1);display:flex;justify-content:space-between;font-size:12px;font-weight:bold;cursor:move}
        .monitor-body{padding:12px;font-size:13px}
        .stat-row{display:flex;justify-content:space-between;margin-bottom:8px}
        .highlight{color:#00ffcc;font-size:1.1em;font-weight:bold}
        .status-indicator{text-align:center;margin-top:10px;padding:4px;background:#444;border-radius:4px;font-size:10px;letter-spacing:1px}
        hr{border:0;border-top:1px solid rgba(255,255,255,.1);margin:8px 0}
        .prediction-glow.green{box-shadow:0 0 10px 5px rgba(40,167,69,.7);animation:pulse-green 1.5s infinite alternate}
        @keyframes pulse-green{0%{box-shadow:0 0 10px 5px rgba(40,167,69,.7)}100%{box-shadow:0 0 20px 10px rgba(40,167,69,.9)}}
        .status-blinking{animation:blink-fade 1s infinite alternate}
        @keyframes blink-fade{0%{opacity:1}100%{opacity:.6}}`;
        document.head.appendChild(style);
        const container = document.createElement('div');
        container.id = 'bagua-monitor';
        container.className = 'monitor-container';
        container.innerHTML = 
        `<div class="monitor-header"><span>☯️ 逻辑审计引擎</span><div class="header-controls"><button onclick="exportBaguaHistory()" title="导出CSV" style="background:none;border:none;color:#00ffcc;cursor:pointer;margin-right:5px;">📥</button><button id="toggle-monitor">_</button></div></div>
        <div class="monitor-body">
            <div class="stat-row highlight"><span class="label">当前准确率:</span><span id="stat-accuracy">0.00%</span></div>
            <hr>
            <div class="stat-row"><span class="label">🌊 共振强度:</span><span id="stat-resonance">0/0</span></div>
            <div class="stat-row"><span class="label">⚖️ 合九抵消:</span><span id="stat-he9">0</span></div>
            <div class="stat-row"><span class="label">🔄 64卦循环:</span><span id="stat-cycle">0</span></div>
            <div class="status-indicator" id="logic-status">IDLE</div>
        </div>`;
        document.body.appendChild(container);
        const header = container.querySelector('.monitor-header');
        let isDragging = false, currentX = 0, currentY = 0, initialX = 0, initialY = 0, xOffset = 0, yOffset = 0;
        const dragStart = e => { initialX = e.clientX - xOffset; initialY = e.clientY - yOffset; if (e.target === header || header.contains(e.target)) { isDragging = true; } };
        const drag = e => { if (!isDragging) return; e.preventDefault(); currentX = e.clientX - initialX; currentY = e.clientY - initialY; xOffset = currentX; yOffset = currentY; container.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`; };
        const dragEnd = () => { initialX = currentX; initialY = currentY; isDragging = false; };
        header.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        const toggleBtn = document.getElementById('toggle-monitor');
        const body = container.querySelector('.monitor-body');
        let isMinimized = false;
        toggleBtn.onclick = () => { isMinimized = !isMinimized; body.style.display = isMinimized ? 'none' : 'block'; container.style.width = isMinimized ? '120px' : '200px'; toggleBtn.innerText = isMinimized ? '+' : '_'; };
        if (window && window.baguaAuditor && typeof window.baguaAuditor.logStep === 'function') {
            const original = window.baguaAuditor.logStep.bind(window.baguaAuditor);
            window.baguaAuditor.logStep = function() {
                const args = Array.prototype.slice.call(arguments);
                original.apply(this, args);
                UIController.updateMonitorUI(this.stats, args[0]);
            };
            UIController.updateMonitorUI(window.baguaAuditor.stats, 'INIT');
        }
    }
    static updateMonitorUI(auditStats, lastType) {
        const accEl = document.getElementById('stat-accuracy');
        const resEl = document.getElementById('stat-resonance');
        const he9El = document.getElementById('stat-he9');
        const cycEl = document.getElementById('stat-cycle');
        const stEl = document.getElementById('logic-status');
        if (!accEl || !resEl || !he9El || !cycEl || !stEl) return;
        const accuracy = ((auditStats.correct / auditStats.total) * 100 || 0).toFixed(2);
        accEl.innerText = accuracy + '%';
        resEl.innerText = `${auditStats.resonance_hits}/${auditStats.total}`;
        he9El.innerText = auditStats.he9_cancellations;
        cycEl.innerText = auditStats.cycle_resets;
        stEl.innerText = lastType || 'WAITING';
        if (accuracy >= 75) { accEl.style.color = '#00ffcc'; } else if (accuracy < 60) { accEl.style.color = '#ff4d4d'; }
    }
}

function get_display_g_balance() {
    const storageKey = 'user.state.dat';

    const getKeySeed = () => {
        if (window.TrialManager) {
            if (typeof window.TrialManager.deviceId === 'string' && window.TrialManager.deviceId) return window.TrialManager.deviceId;
            if (window.TrialManager.state && typeof window.TrialManager.state.deviceId === 'string' && window.TrialManager.state.deviceId) return window.TrialManager.state.deviceId;
        }
        if (window.Economy && window.Economy.user && typeof window.Economy.user.id === 'string' && window.Economy.user.id) return window.Economy.user.id;
        if (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string') return navigator.userAgent;
        return 'mayiju';
    };

    const buildKeyBytes = (seed, length) => {
        let h = 2166136261;
        for (let i = 0; i < seed.length; i++) {
            h ^= seed.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        let x = (h ^ 0x9e3779b9) >>> 0;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            x ^= x << 13;
            x ^= x >>> 17;
            x ^= x << 5;
            bytes[i] = x & 0xff;
        }
        return bytes;
    };

    const xorString = (input, seed) => {
        const key = buildKeyBytes(seed, input.length);
        let out = '';
        for (let i = 0; i < input.length; i++) {
            out += String.fromCharCode((input.charCodeAt(i) ^ key[i]) & 0xff);
        }
        return out;
    };

    const parseState = (rawValue) => {
        if (!rawValue) return null;
        const trimmed = rawValue.trim();
        if (!trimmed) return null;
        try {
            if (trimmed.startsWith('{')) return JSON.parse(trimmed);
        } catch (e) {
        }

        if (trimmed.startsWith('X1:')) {
            try {
                const b64 = trimmed.slice(3);
                const bin = atob(b64);
                const json = xorString(bin, getKeySeed());
                return JSON.parse(json);
            } catch (e) {
                return null;
            }
        }

        try {
            const decoded = atob(trimmed);
            if (decoded.trim().startsWith('{')) return JSON.parse(decoded);
            const json = xorString(decoded, getKeySeed());
            return JSON.parse(json);
        } catch (e) {
            return null;
        }
    };

    let raw = null;
    try {
        raw = localStorage.getItem(storageKey);
    } catch (e) {
        raw = null;
    }

    const state = parseState(raw);
    let balance = null;
    let fromSecure = false;
    if (state && typeof state.g_balance !== 'undefined') {
        const parsed = parseInt(state.g_balance, 10);
        if (Number.isFinite(parsed)) {
            balance = parsed;
            fromSecure = true;
        }
    }

    if (!Number.isFinite(balance)) {
        if (window.TrialManager && typeof window.TrialManager.getBalance === 'function') {
            balance = window.TrialManager.getBalance();
        } else if (window.Economy && window.Economy.user && typeof window.Economy.user.balanceG === 'number') {
            balance = window.Economy.user.balanceG;
        } else {
            balance = 0;
        }
    }

    if (fromSecure && window.TrialManager && window.TrialManager.state && typeof window.TrialManager.saveState === 'function') {
        if (window.TrialManager.state.balance !== balance) {
            window.TrialManager.state.balance = balance;
            window.TrialManager.saveState();
        }
    }

    return balance;
}

function should_allow_prediction() {
    const storageKey = 'user.state.dat';
    const now = Math.floor(Date.now() / 1000);

    const getKeySeed = () => {
        if (window.TrialManager) {
            if (typeof window.TrialManager.deviceId === 'string' && window.TrialManager.deviceId) return window.TrialManager.deviceId;
            if (window.TrialManager.state && typeof window.TrialManager.state.deviceId === 'string' && window.TrialManager.state.deviceId) return window.TrialManager.state.deviceId;
        }
        if (window.Economy && window.Economy.user && typeof window.Economy.user.id === 'string' && window.Economy.user.id) return window.Economy.user.id;
        if (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string') return navigator.userAgent;
        return 'mayiju';
    };

    const buildKeyBytes = (seed, length) => {
        let h = 2166136261;
        for (let i = 0; i < seed.length; i++) {
            h ^= seed.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        let x = (h ^ 0x9e3779b9) >>> 0;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            x ^= x << 13;
            x ^= x >>> 17;
            x ^= x << 5;
            bytes[i] = x & 0xff;
        }
        return bytes;
    };

    const xorString = (input, seed) => {
        const key = buildKeyBytes(seed, input.length);
        let out = '';
        for (let i = 0; i < input.length; i++) {
            out += String.fromCharCode((input.charCodeAt(i) ^ key[i]) & 0xff);
        }
        return out;
    };

    const parseState = (rawValue) => {
        if (!rawValue) return null;
        const trimmed = rawValue.trim();
        if (!trimmed) return null;
        try {
            if (trimmed.startsWith('{')) return JSON.parse(trimmed);
        } catch (e) {
        }

        if (trimmed.startsWith('X1:')) {
            try {
                const b64 = trimmed.slice(3);
                const bin = atob(b64);
                const json = xorString(bin, getKeySeed());
                return JSON.parse(json);
            } catch (e) {
                return null;
            }
        }

        try {
            const decoded = atob(trimmed);
            if (decoded.trim().startsWith('{')) return JSON.parse(decoded);
            const json = xorString(decoded, getKeySeed());
            return JSON.parse(json);
        } catch (e) {
            return null;
        }
    };

    const storeState = (next) => {
        const payload = {
            trial_end_timestamp: parseInt(next.trial_end_timestamp, 10) || 0,
            g_balance: parseInt(next.g_balance, 10) || 0
        };
        try {
            const json = JSON.stringify(payload);
            const bin = xorString(json, getKeySeed());
            localStorage.setItem(storageKey, 'X1:' + btoa(bin));
        } catch (e) {
        }
    };

    let raw = null;
    try {
        raw = localStorage.getItem(storageKey);
    } catch (e) {
        raw = null;
    }

    const state = parseState(raw);

    let trialEnd = 0;
    if (state && typeof state.trial_end_timestamp !== 'undefined') {
        const parsed = parseInt(state.trial_end_timestamp, 10);
        if (Number.isFinite(parsed) && parsed > 0) trialEnd = parsed;
    }

    let gBalance = null;
    if (state && typeof state.g_balance !== 'undefined') {
        const parsed = parseInt(state.g_balance, 10);
        if (Number.isFinite(parsed)) gBalance = parsed;
    }

    if (!Number.isFinite(trialEnd) || trialEnd < 0) trialEnd = 0;

    let expiredByTime = false;
    if (window.TrialManager && typeof window.TrialManager.getRemainingTime === 'function') {
        const remainingMs = window.TrialManager.getRemainingTime();
        if (Number.isFinite(remainingMs) && remainingMs <= 0) {
            expiredByTime = true;
        } else if (Number.isFinite(remainingMs) && remainingMs > 0 && remainingMs !== Infinity && trialEnd <= 0) {
            trialEnd = now + Math.floor(remainingMs / 1000);
        }
    }

    if (window.TrialManager && typeof window.TrialManager.isPermanentlyActivated === 'function') {
        if (window.TrialManager.isPermanentlyActivated()) {
            expiredByTime = false;
        }
    }

    if (expiredByTime) return false;

    let inTrial = false;
    if (window.TrialManager && typeof window.TrialManager.isPermanentlyActivated === 'function') {
        inTrial = !window.TrialManager.isPermanentlyActivated();
    } else {
        inTrial = trialEnd > now;
    }

    if (!Number.isFinite(gBalance)) {
        if (window.TrialManager && typeof window.TrialManager.getBalance === 'function') {
            gBalance = window.TrialManager.getBalance();
        } else if (window.Economy && window.Economy.user && typeof window.Economy.user.balanceG === 'number') {
            gBalance = window.Economy.user.balanceG;
        } else {
            gBalance = 0;
        }
    }

    if (inTrial) {
        const trialCost = 20;
        if (gBalance < trialCost) return false;
        const newBalanceTrial = gBalance - trialCost;
        storeState({ trial_end_timestamp: trialEnd || 0, g_balance: newBalanceTrial });

        if (window.TrialManager && window.TrialManager.state && typeof window.TrialManager.saveState === 'function') {
            window.TrialManager.state.balance = newBalanceTrial;
            window.TrialManager.saveState();
        }

        return true;
    }

    if (gBalance < 1) return false;
    return true;
}

function apply_correct_prediction_deduction() {
    const storageKey = 'user.state.dat';

    const getKeySeed = () => {
        if (window.TrialManager) {
            if (typeof window.TrialManager.deviceId === 'string' && window.TrialManager.deviceId) return window.TrialManager.deviceId;
            if (window.TrialManager.state && typeof window.TrialManager.state.deviceId === 'string' && window.TrialManager.state.deviceId) return window.TrialManager.state.deviceId;
        }
        if (window.Economy && window.Economy.user && typeof window.Economy.user.id === 'string' && window.Economy.user.id) return window.Economy.user.id;
        if (typeof navigator !== 'undefined' && typeof navigator.userAgent === 'string') return navigator.userAgent;
        return 'mayiju';
    };

    const buildKeyBytes = (seed, length) => {
        let h = 2166136261;
        for (let i = 0; i < seed.length; i++) {
            h ^= seed.charCodeAt(i);
            h = Math.imul(h, 16777619) >>> 0;
        }
        let x = (h ^ 0x9e3779b9) >>> 0;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
            x ^= x << 13;
            x ^= x >>> 17;
            x ^= x << 5;
            bytes[i] = x & 0xff;
        }
        return bytes;
    };

    const xorString = (input, seed) => {
        const key = buildKeyBytes(seed, input.length);
        let out = '';
        for (let i = 0; i < input.length; i++) {
            out += String.fromCharCode((input.charCodeAt(i) ^ key[i]) & 0xff);
        }
        return out;
    };

    const parseState = (rawValue) => {
        if (!rawValue) return null;
        const trimmed = rawValue.trim();
        if (!trimmed) return null;
        try {
            if (trimmed.startsWith('{')) return JSON.parse(trimmed);
        } catch (e) {
        }

        if (trimmed.startsWith('X1:')) {
            try {
                const b64 = trimmed.slice(3);
                const bin = atob(b64);
                const json = xorString(bin, getKeySeed());
                return JSON.parse(json);
            } catch (e) {
                return null;
            }
        }

        try {
            const decoded = atob(trimmed);
            if (decoded.trim().startsWith('{')) return JSON.parse(decoded);
            const json = xorString(decoded, getKeySeed());
            return JSON.parse(json);
        } catch (e) {
            return null;
        }
    };

    const storeState = (next) => {
        const payload = {
            trial_end_timestamp: parseInt(next.trial_end_timestamp, 10) || 0,
            g_balance: parseInt(next.g_balance, 10) || 0
        };
        try {
            const json = JSON.stringify(payload);
            const bin = xorString(json, getKeySeed());
            localStorage.setItem(storageKey, 'X1:' + btoa(bin));
        } catch (e) {
        }
    };

    let raw = null;
    try {
        raw = localStorage.getItem(storageKey);
    } catch (e) {
        raw = null;
    }

    const state = parseState(raw) || {};

    let trialEnd = 0;
    if (typeof state.trial_end_timestamp !== 'undefined') {
        const parsed = parseInt(state.trial_end_timestamp, 10);
        if (Number.isFinite(parsed) && parsed > 0) {
            trialEnd = parsed;
        }
    }

    let gBalance = null;
    if (typeof state.g_balance !== 'undefined') {
        const parsed = parseInt(state.g_balance, 10);
        if (Number.isFinite(parsed)) {
            gBalance = parsed;
        }
    }

    if (!Number.isFinite(gBalance)) {
        if (window.TrialManager && typeof window.TrialManager.getBalance === 'function') {
            gBalance = window.TrialManager.getBalance();
        } else if (window.Economy && window.Economy.user && typeof window.Economy.user.balanceG === 'number') {
            gBalance = window.Economy.user.balanceG;
        } else {
            gBalance = 0;
        }
    }

    if (gBalance < 1) {
        return { success: false, balance: gBalance };
    }

    const newBalance = gBalance - 1;
    storeState({ trial_end_timestamp: trialEnd || 0, g_balance: newBalance });

    if (window.TrialManager && window.TrialManager.state && typeof window.TrialManager.saveState === 'function') {
        window.TrialManager.state.balance = newBalance;
        window.TrialManager.saveState();
    }

    return { success: true, balance: newBalance };
}
