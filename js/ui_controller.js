/**
 * UI Controller
 * Manages interaction between DOM, AuthBridge, and G2Engine
 * Updated for Phase 3: Research Validation & Pattern Display
 * Updated for Research Model: No Login, Fuel Point Management
 */

class AdaptiveSensitivity {
    constructor() {
        this.history = [];
        this.windowSize = 15; // Increased window size
        this.signalTypes = ['panda', 'dui', 'trend', 'other'];
        
        this.signalStats = {};
        this.signalTypes.forEach(type => {
            this.signalStats[type] = { correct: 0, total: 0 };
        });
    }

    getSignalType(note) {
        if (!note) return 'other';
        if (note.includes('熊猫')) return 'panda';
        if (note.includes('对') || note.includes('6')) return 'dui';
        if (note.includes('蓝7') || note.includes('重复') || note.includes('倾向')) return 'trend';
        return 'other';
    }

    record(actual, predicted, note) {
        let act = actual;
        if (act === 'Player') act = 'blue';
        else if (act === 'Banker') act = 'red';
        else if (act === 'Tie') act = 'green';
        
        let pred = predicted;
        if (pred === 'Player') pred = 'blue';
        else if (pred === 'Banker') pred = 'red';

        const type = this.getSignalType(note);
        const isCorrect = (act === pred);

        this.history.push({ actual: act, predicted: pred, type, isCorrect });
        if (this.history.length > this.windowSize) {
            const removed = this.history.shift();
            this.signalStats[removed.type].total--;
            if (removed.isCorrect) this.signalStats[removed.type].correct--;
        }

        this.signalStats[type].total++;
        if (isCorrect) this.signalStats[type].correct++;
    }

    getGlobalAccuracy() {
        if (this.history.length === 0) return 0.5;
        const correct = this.history.filter(r => r.isCorrect).length;
        return correct / this.history.length;
    }

    getSignalAccuracy(type) {
        const stats = this.signalStats[type];
        return stats.total > 0 ? stats.correct / stats.total : 0.5;
    }

    getSigmoidThreshold(accuracy) {
        const k = 10;
        const x = accuracy - 0.55;
        const sigmoid = 1 / (1 + Math.exp(-k * x));
        return 1 + 2 * sigmoid; // [1, 3]
    }

    getRequiredWins() {
        const globalAcc = this.getGlobalAccuracy();
        const threshold = this.getSigmoidThreshold(globalAcc);
        return Math.round(threshold);
    }

    getSciThreshold() {
        const globalAcc = this.getGlobalAccuracy();
        return Math.round(30 * this.getSigmoidThreshold(globalAcc) / 3);
    }
}

// Platform Detection
const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile/i.test(navigator.userAgent);
// window.MAYIJU_PLATFORM removed

// Instantiate globally
window.sensitivityEngine = new AdaptiveSensitivity();

class UIController {
    constructor(engine, auth) {
        this.engine = engine;
        this.auth = auth;
        this.pollingInterval = null;
        
        // Research Observation Tracking
        this.stats = {
            total_predictions: 0,
            total_correct: 0
        };
        
        this.lastPrediction = null;
        this.lastSci = 0;
        this.lastCoreResult = null;
        
        // Expose for inline HTML onclicks
        window.ui = this;
    }
    
    // Input Abstraction Layer
    static convertToNaturalRound(molecule, denominator, history = []) {
        // 分子 = 闲家结果；分母 = 庄家结果
        let P_sum, B_sum;
        let virtualS = 0;
        
        // Helper to count recent streak
        const countRecentStreak = (hist, type) => {
            let count = 0;
            for (let i = hist.length - 1; i >= 0; i--) {
                const round = hist[i];
                if (type === 'blue' && round.winner === 'Player') count++;
                else if (type === 'red' && round.winner === 'Banker') count++;
                else break;
            }
            return count;
        };

        if (molecule === 'win' && denominator === 'lose') {
            // 闲胜 (Blue)
            const blueStreak = countRecentStreak(history, 'blue');
            if (blueStreak >= 3) {
                P_sum = 9; B_sum = 1; virtualS = 80; // 强趋势
            } else if (blueStreak >= 2) {
                P_sum = 8; B_sum = 2; virtualS = 60; // 中趋势
            } else {
                P_sum = 7; B_sum = 3; virtualS = 40; // 弱趋势
            }
        } else if (molecule === 'lose' && denominator === 'win') {
            // 庄胜 (Red)
            const redStreak = countRecentStreak(history, 'red');
            if (redStreak >= 3) {
                P_sum = 1; B_sum = 9; virtualS = -80;
            } else if (redStreak >= 2) {
                P_sum = 2; B_sum = 8; virtualS = -60;
            } else {
                P_sum = 3; B_sum = 7; virtualS = -40;
            }
        } else if (molecule === 'tie' || denominator === 'tie') {
            // 和局
            P_sum = 5; B_sum = 5; virtualS = 0;
        } else {
            // 默认平局 (Balance/Fallback)
            P_sum = 4; B_sum = 4; virtualS = 0;
        }
        
        return { P_sum, B_sum, virtualS };
    }

    init() {
        console.log("UI Initialized (Research Mode)");
        
        // Register Phase 3 Plugin
        this.dynamics = new DynamicsEngine();
        this.engine.registerPlugin(this.dynamics);
        
        this.bindEvents();
        this.refreshAccountInfo();
        this.startPolling();
        this.initSSEClient();
        this.initMonitor();
        this.updateDonationContact();
        
        // Initial Render
        this.renderMatrix();
        this.renderHistoryPanel();
        this.renderRecentHistory();
        this.renderMolDenomPanel(null);
        
        // Default to Simple Mode or Persistent Mode
        this.initModeSwitch();
        
        // Layer 2: Subscribe to State Hub
        if (window.MAYIJU_STATE) {
            window.MAYIJU_STATE.subscribe('balanceG', (bal) => {
                this.updateBalance(bal);
            });
        }

        const prediction = this.engine.predictNext();
        this.lastPrediction = prediction.next_prediction;
        this.lastStrategy = prediction.strategy;
        this.renderPrediction(prediction);
        this.updateSmartStatus();
    }

    refreshAccountInfo() {
        if (window.cloudPatch && typeof window.cloudPatch.pullBalance === 'function') {
            window.cloudPatch.pullBalance();
        }
    }

    updateBalance(bal) {
        const el = document.getElementById('g-coin-display');
        if (el) {
            el.innerText = Math.floor(bal).toLocaleString();
            el.style.display = '';
            el.style.visibility = 'visible';
        }
    }

    bindEvents() {
        // Core Game Events
        const predictBtn = document.getElementById('btn-predict');
        if (predictBtn) predictBtn.addEventListener('click', () => this.handlePrediction());

        const actionInputBtn = document.getElementById('action-input-btn');
        if (actionInputBtn) actionInputBtn.addEventListener('click', () => this.handlePrediction());

        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) resetBtn.addEventListener('click', () => this.resetGame());

        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.handleExit());
        
        // Force bind exit button if ID matches 'exit-btn' (common issue)
        const exitBtn = document.getElementById('exit-btn');
        if (exitBtn) exitBtn.addEventListener('click', () => this.handleExit());

        // Economy Events
        const rechargeBtn = document.getElementById('btn-recharge');
        if (rechargeBtn) rechargeBtn.addEventListener('click', () => this.openRechargeModal());
        
        const withdrawBtn = document.getElementById('btn-withdraw');
        if (withdrawBtn) withdrawBtn.addEventListener('click', () => this.openWithdrawModal());

        const delBtn = document.getElementById('btn-delete');
        if (delBtn) delBtn.addEventListener('click', () => this.handleDeleteLast());

        // Mobile Input Events
        const btnPlayer = document.getElementById('btn-input-player');
        if (btnPlayer) btnPlayer.addEventListener('click', () => this.handleMobileInput('Player'));

        const btnBanker = document.getElementById('btn-input-banker');
        if (btnBanker) btnBanker.addEventListener('click', () => this.handleMobileInput('Banker'));

        const btnTie = document.getElementById('btn-input-tie');
        if (btnTie) btnTie.addEventListener('click', () => this.handleMobileInput('Tie'));

        // Mode Toggle Events
        const modeSimple = document.getElementById('mode-simple');
        if (modeSimple) modeSimple.addEventListener('click', () => this.toggleInputMode('simple'));

        const modeAdvanced = document.getElementById('mode-advanced');
        if (modeAdvanced) modeAdvanced.addEventListener('click', () => this.toggleInputMode('advanced'));
    }

    handleMobileInput(type) {
        // [AHS v4.2] Runtime Guard Injection
        if (typeof window.AHS_RuntimeGuard === 'function') {
            const guardResult = window.AHS_RuntimeGuard(type);
            if (guardResult) {
                // Guard successful, use result
                const options = {
                    platform: 'mobile',
                    virtualS: guardResult.virtualS
                };
                this.handlePrediction(guardResult.P_sum, guardResult.B_sum, false, options);
                return;
            }
            // If Guard returns null, fall through to legacy/fallback logic
        }

        try {
            let molecule, denominator;
            if (type === 'Player') {
                molecule = 'win'; denominator = 'lose';
            } else if (type === 'Banker') {
                molecule = 'lose'; denominator = 'win';
            } else {
                molecule = 'tie'; denominator = 'tie';
            }

            const round = UIController.convertToNaturalRound(molecule, denominator, this.engine.history);
            
            // Pass mobile context for MultiModelVote
            const options = {
                platform: 'mobile',
                virtualS: round.virtualS
            };

            this.handlePrediction(round.P_sum, round.B_sum, false, options);
        } catch (e) {
            console.error("Mobile Input Error:", e);
            // [USER REQUEST] 强制变色保底
            const colorMap = { 'Player': 'blue', 'Banker': 'red', 'Tie': 'green' };
            this.forceVisualUpdate(colorMap[type] || 'green');
        }
    }

    // [USER REQUEST] Force Visual Update Helper
    
    handleExit() {
        if (confirm("确定要退出吗？")) {
             try {
                if (this.auth && typeof this.auth.logout === 'function') {
                    this.auth.logout();
                }
                localStorage.removeItem('user_phone');
                localStorage.removeItem('mayiju_user_phone');
                window.location.reload();
             } catch (e) {
                 console.error("Logout error:", e);
                 window.location.reload();
             }
        }
    }

    handleDeleteLast() {
        this.clearInputs();
        if (this.engine.undoLastRound()) {
             const prediction = this.engine.predictNext();
             this.renderPrediction(prediction);
             this.renderMatrix();
             this.renderHistoryPanel();
             this.renderRecentHistory();
             this.updateStatus("已撤销上一局");
        }
    }

    clearInputs() {
        const p = document.getElementById('input-player');
        const b = document.getElementById('input-banker');
        if(p) p.value = '';
        if(b) b.value = '';
    }

    updateDonationContact() {
        const el = document.getElementById('recharge-request-contact');
        if (!el) return;
        let contact = '';
        try {
            contact = localStorage.getItem('mayiju_user_phone') ||
                      localStorage.getItem('user_phone') ||
                      localStorage.getItem('phone') || '';
        } catch (e) {}
        if (contact && contact.trim()) {
            el.innerText = `当前客户：${contact}`;
        } else {
            el.innerText = '当前客户：未登录（请先登录或注册）';
        }
    }

    async handleCustomDonation() {
        const amountStr = prompt("请输入捐赠金额 (1~100000 USDT):", "100");
        if (!amountStr) return;
        const amount = parseInt(amountStr); // Force Integer
        if (isNaN(amount) || amount < 1 || amount > 100000) {
            alert("金额需在 1~100000 之间");
            return;
        }
        this.handleDonation(amount);
    }

    async handleDonation(amount) {
        if (!confirm(`确认捐赠 ${amount} USDT 并补充燃料？\n捐赠不换取任何结果，仅支持系统运行。`)) return;

        this.updateStatus("正在处理捐赠...");
        const result = await this.auth.recharge(amount);
        
        if (result.success) {
            let accPct = '0.0';
            if (window.TrialManager && window.TrialManager.state && typeof window.TrialManager.state.accuracy === 'number') {
                accPct = (window.TrialManager.state.accuracy * 100).toFixed(1);
            }
            alert(`✅ 捐赠提交成功！\n${amount} U → ${result.added} 燃料分\n感谢您对研究的支持！\n系统完成有效研究记录消耗 1 燃料分`);
            const modal = document.getElementById('recharge-modal');
            if (modal) modal.style.display = 'none';
            this.refreshAccountInfo();
            this.updateStatus("捐赠完成，燃料已补充");
            const preview = document.getElementById('recharge-preview');
            if (preview) preview.innerText = '';
        }
    }

    // --- Game Logic ---

    // 【新增】更新准确率显示
    updateAccuracyDisplay() {
        const log = window.predictionLog || [];
        const total = log.length;
        const correct = log.filter(r => {
            // Normalize for comparison
            let act = r.actual;
            if (act === 'Player') act = 'blue';
            else if (act === 'Banker') act = 'red';
            
            let pred = r.predicted;
            if (pred === 'Player') pred = 'blue';
            else if (pred === 'Banker') pred = 'red';
            // Note: 'Tie' is usually ignored in accuracy or treated as push, 
            // but here we strictly compare if predicted matches actual.
            
            // If predicted was 'Skip' or null, it shouldn't count? 
            // The log only contains pushed items.
            return act === pred;
        }).length;
        
        const rate = total > 0 ? (correct / total * 100).toFixed(2) : '0.00';
        const displayStr = `${rate}% (${correct}/${total})`;

        // Update all relevant elements
        const el1 = document.getElementById('entropy-accuracy');
        if (el1) el1.innerText = displayStr;
        
        const el2 = document.getElementById('accuracy-display');
        if (el2) el2.innerText = displayStr;
    }

    getLastTwoColors() {
        const h = this.engine.history;
        const len = h.length;
        
        if (len < 2) return ''; 
        
        let lc = '';
        
        // 1st previous (len-2) -> The most recent completed round before the one we just input?
        // Wait. handlePrediction processes a NEW round.
        // engine.history includes the new round at the end.
        // So h[len-1] is the round just entered (result.winner).
        // We want the context *before* this round for ModelA reconstruction?
        // No, ModelA takes "context" which includes history.
        // In handlePrediction, we are building context for the *current* round we just finished, to see what the prediction *would have been*?
        // OR are we building context for the *next* prediction?
        
        // In handlePrediction:
        // 1. processRound -> updates history.
        // 2. We want to see what the *previous* prediction was (prevPrediction) and if it was correct.
        // 3. Then we predict NEXT.
        
        // MultiModelVote Integration (lines 608+):
        // "Reconstruct history patterns for Model usage"
        // It iterates history.
        
        // Line 639: let currentLc = this._getLastTwoColors();
        // This is used for `voteContext` which is passed to `MultiModelVote`.
        // `voteContext` has `P_sum`, `B_sum` of the *just finished* round.
        // And `lastTwoColor`.
        // If we are voting for the *just finished* round (to verify/log?), or for the *next*?
        // The code says: `const prediction = this.engine.predictNext();` (Line 605)
        // Then `MultiModelVote` is called.
        // Wait. `MultiModelVote` returns `coreResult` which sets `prediction.note`.
        // So `MultiModelVote` is predicting the *NEXT* round.
        
        // If predicting NEXT round (N+1).
        // We need context of N.
        // `lastTwoColor` should be color(N-1) and color(N).
        // `h` has length N.
        // `h[len-1]` is round N.
        // `h[len-2]` is round N-1.
        
        // My previous code:
        // `prev = h[len-2]` (Round N-1).
        // `prev2 = h[len-3]` (Round N-2).
        // It MISSED the latest round (Round N)!
        
        // CORRECTION:
        // If we want "Last Two Colors" relative to the *Next Prediction*, we need Round N and Round N-1.
        // h[len-1] (Last one)
        // h[len-2] (Second to last)
        
        if (len >= 1) {
            const last = h[len - 1];
            lc = (last.winner === 'Player' ? '蓝' : (last.winner === 'Banker' ? '红' : ''));
        }
        
        if (len >= 2) {
            const secondLast = h[len - 2];
            lc = (secondLast.winner === 'Player' ? '蓝' : (secondLast.winner === 'Banker' ? '红' : '')) + lc;
        }
        
        return lc;
    }

    // Mobile Input Handler
    handleMobileInput(type) {
        if (window.MAYIJU_MODE !== 'simple') return; // Safety Guard
        try {
            let molecule, denominator;
            let intent = 'balanced_oscillation'; // Default intent

            // Map button type to abstract input
            if (type === 'Player') {
                molecule = 'win'; denominator = 'lose';
                intent = 'strong_trend'; // User intends Blue
            } else if (type === 'Banker') {
                molecule = 'lose'; denominator = 'win';
                intent = 'strong_trend'; // User intends Red
            } else {
                molecule = 'tie'; denominator = 'tie';
                intent = 'balanced_oscillation'; // User intends Balance
            }
            
            // Pass history to enable streak calculation
            // If engine/history is missing, use dummy
            const history = (this.engine && this.engine.history) ? this.engine.history : [];
            const round = UIController.convertToNaturalRound(molecule, denominator, history);
            
            console.log(`[MobileInput] ${type} -> P:${round.P_sum}, B:${round.B_sum} (Intent: ${intent})`);
            
            // Construct Options Object
            const options = {
                platform: 'mobile',
                virtualS: round.virtualS,
                structureIntent: intent
            };

            // Use abstract mode for prediction
            this.handlePrediction(round.P_sum, round.B_sum, true, options);

            // [USER REQUEST] Hardlink Safety Net: Force visual update if engine didn't trigger it immediately
            // This ensures the "Light" turns on even if the engine logic is lagging
            const colorMap = { 'Player': 'blue', 'Banker': 'red', 'Tie': 'green' };
            // Optional: check if visual is already correct? No, just force it to be safe if user wants "Hardlink".
            // But if prediction returns a DIFFERENT result (e.g. user clicked Blue but engine predicts Red?), 
            // the user said "Clicking Blue... report 'Light turned on'". 
            // The prompt implies the button click is an INPUT, and the circle shows the PREDICTION.
            // But in "Sandbox" mode, often inputting "Player" makes the system learn/predict.
            // The user said: "Click 'Blue', if circle turns blue...".
            // This implies he wants the circle to reflect the input or the immediate reaction to it.
            // I will rely on handlePrediction logic first, but in CATCH, I definitely force it.
            
        } catch (e) {
            console.error("Mobile Input Error:", e);
            // [USER REQUEST] 强制变色保底
            const colorMap = { 'Player': 'blue', 'Banker': 'red', 'Tie': 'green' };
            this.forceVisualUpdate(colorMap[type] || 'green');
        }
    }

    // [USER REQUEST] Force Visual Update Helper
    forceVisualUpdate(color) {
        console.log(`[ForceUpdate] Forcing color: ${color}`);
        const circle = document.getElementById('prediction-circle');
        if (circle) {
            circle.className = 'pred-visual';
            if (color === 'blue') circle.classList.add('player');
            else if (color === 'red') circle.classList.add('banker');
            else circle.classList.add('neutral');
            
            // Also update text to show it's alive
            const strategyEl = document.getElementById('prediction-strategy');
            if (strategyEl) strategyEl.innerText = "System Fallback";
        }
    }
    
    // Desktop Input Handler (High Precision)
    handleDesktopInput(p1, p2, b1, b2) {
        // [USER REQUEST] 彻底剥离：锁死电脑端逻辑
        if (window.MAYIJU_PLATFORM !== 'desktop') return;

        try {
            // Validation
            if ([p1, p2, b1, b2].some(v => isNaN(v) || v < 0 || v > 9)) {
                alert("请输入有效的点数 (0-9)");
                return;
            }

            // Calculate Sums
            const P_sum = (p1 + p2) % 10;
            const B_sum = (b1 + b2) % 10;
            
            console.log(`[DesktopInput] P:${p1}+${p2}=${P_sum}, B:${b1}+${b2}=${B_sum}`);

            // Pass full high-precision data via options object
            const options = {
                platform: 'desktop',
                P1: p1, P2: p2,
                B1: b1, B2: b2,
                structureIntent: 'high_precision'
            };

            this.handlePrediction(P_sum, B_sum, false, options);

        } catch (e) {
            console.error("Critical Error in handleDesktopInput:", e);
            if (window.AHS_onError) window.AHS_onError(e);
            alert("输入处理错误，系统已记录。");
        }
    }

    // [USER REQUEST] Dual-Mode Switch Logic
    initModeSwitch() {
        const switchEl = document.getElementById('mode-switch');
        if (!switchEl) return;

        const savedMode = localStorage.getItem('mayiju_mode') || 'simple';
        
        // 设置开关位置
        switchEl.checked = (savedMode === 'advanced');
        this.updateModeUI(savedMode);
        window.MAYIJU_MODE = savedMode; // Sync global state
        
        // 绑定切换事件
        switchEl.onchange = () => {
            const newMode = switchEl.checked ? 'advanced' : 'simple';
            localStorage.setItem('mayiju_mode', newMode);
            window.MAYIJU_MODE = newMode;
            this.updateModeUI(newMode);
        };
    }

    updateModeUI(mode) {
        // UI Elements
        const simpleLabel = document.getElementById('simple-label');
        const advancedLabel = document.getElementById('advanced-label');
        const mobileArea = document.getElementById('mobile-input-area');
        const advancedInput = document.getElementById('advanced-input');

        if (mode === 'advanced') {
            if (mobileArea) mobileArea.style.display = 'none';
            if (advancedInput) {
                advancedInput.style.display = 'flex';
                advancedInput.style.justifyContent = 'center';
                advancedInput.style.gap = '10px';
                advancedInput.style.marginBottom = '10px';
            }
            if (advancedLabel) advancedLabel.style.fontWeight = 'bold';
            if (simpleLabel) simpleLabel.style.fontWeight = 'normal';
        } else {
            if (advancedInput) advancedInput.style.display = 'none';
            if (mobileArea) mobileArea.style.display = 'block';
            if (simpleLabel) simpleLabel.style.fontWeight = 'bold';
            if (advancedLabel) advancedLabel.style.fontWeight = 'normal';
        }
        
        // Logic State
        this.inputMode = mode;
    }

    // [User Request] Advanced Mode Handler (Life-line Repair)
    handleAdvancedInput(molecule, denominator) {
        console.log("[DEBUG] 高级模式输入:", molecule, denominator);

        // 检查 DOM 元素 (User Step 1)
        const molEl = document.getElementById('molecule');
        const denEl = document.getElementById('denominator');
        if (!molEl || !denEl) {
             console.error("[FATAL] 高级模式输入框未找到!");
        }

        if (window.MAYIJU_MODE !== 'advanced') {
            console.warn("[DEBUG] 非高级模式，忽略输入");
            return; // Safety Guard
        }

        // 1. 解析分子/分母为具体数字
        const P_sum = parseInt(molecule);
        const B_sum = parseInt(denominator);
        console.log("[DEBUG] 解析结果:", P_sum, B_sum);

        if (isNaN(P_sum) || isNaN(B_sum)) {
            alert("请输入有效数字 (0-9)");
            return;
        }

        // 2. 构建完整历史记录
        const round = { 
            winner: P_sum > B_sum ? 'Player' : (B_sum > P_sum ? 'Banker' : 'Tie'),
            playerVal: P_sum, 
            bankerVal: B_sum, 
            platform: 'desktop' 
        };
        console.log("[DEBUG] 添加历史记录:", round);
        
        // Add to engine history
        if (this.engine && this.engine.history) {
            this.engine.history.push(round);
            console.log("[DEBUG] 当前历史长度:", this.engine.history.length);
        }

        // 3. 【关键】调用后台计算公式
        const context = { history: this.engine.history };
        
        let prediction = { final: 'Wait' };
        let sValue = 0;

        if (window.EncryptedLogic) {
            if (window.EncryptedLogic.getHighOddsResult) {
                // Construct context for MultiModelVote
                // MultiModelVote expects { rawHistory, history (patterns), lastTwoColor, P_sum, B_sum }
                // We'll pass a simplified context and hope MultiModelVote handles it or we use calculateRealSValue directly
                // calculateRealSValue only needs { history }
                
                // Let's get the standard prediction first
                // Reconstruct history patterns logic is complex in handlePrediction.
                // We'll rely on calculateRealSValue for the S-value which is the core request.
                
                sValue = window.EncryptedLogic.calculateRealSValue(context);
                
                // For "Prediction" text, we can use a simplified call or just derived from S-value
                if (sValue > 15) prediction = { final: '蓝倾向' };
                else if (sValue < -15) prediction = { final: '红倾向' };
                else prediction = { final: '平衡' };
            }
        }

        // 4. 更新 UI
        this.updatePredictionDisplay(prediction, sValue);
        
        // Update Matrix
        this.renderMatrix();
        this.renderHistoryPanel();
        this.renderRecentHistory();
        this.renderMolDenomPanel(round);
    }

    updatePredictionDisplay(prediction, sValue) {
        // 1. 显示 S 值范围
        const sDisplay = document.getElementById('s-value-display');
        if (sDisplay) {
            sDisplay.innerText = `S: ${sValue > 0 ? '+' : ''}${sValue.toFixed(1)}%`;
            sDisplay.style.display = 'block';
        }

        // 2. 圆圈样式
        const circle = document.getElementById('prediction-circle');
        if (circle) {
            circle.className = 'pred-visual'; // Reset base class
            
            if (sValue > 15) {
                circle.classList.add('player-solid'); // 纯蓝
            } else if (sValue < -15) {
                circle.classList.add('banker-solid'); // 纯红
            } else if (sValue > 0) {
                circle.classList.add('green', 'glow-blue'); // 绿+蓝光晕
            } else if (sValue < 0) {
                circle.classList.add('green', 'glow-red'); // 绿+红晕
            } else {
                circle.classList.add('green'); // 纯绿
            }
        }
        
        // 3. Update Text (Only if final is explicitly provided, otherwise rely on renderPrediction)
        const note = document.getElementById('prediction-note');
        if (note && prediction && prediction.final) {
            note.innerText = prediction.final;
        }

        // 【关键】强制重绘红蓝网格 (User Step 3)
        // Adapted from user request: renderGrid -> this.renderMatrix
        if (typeof this.renderMatrix === 'function') {
             this.renderMatrix();
        } else {
             console.error("[MISSING] renderMatrix function not found!");
        }
    }

    async handlePrediction(pInput = null, bInput = null, isAbstract = false, optionsOrIntent = null) {
        try {
            // Normalize Options (Fix for ReferenceError)
            let options = {};
            if (typeof optionsOrIntent === 'string') {
                options = { structureIntent: optionsOrIntent };
            } else if (typeof optionsOrIntent === 'object' && optionsOrIntent !== null) {
                options = optionsOrIntent;
            }

            // 🛡️ Defense: Ensure Auth State is Valid
            if (!this.auth || !this.auth.user) {
                console.error("AuthBridge fatal error: user state missing");
                alert("用户状态异常，系统将自动修复...");
                window.location.reload();
                return;
            }

            let pVal, bVal;

            if (pInput !== null && bInput !== null) {
                pVal = pInput;
                bVal = bInput;
            } else {
                pVal = parseInt(document.getElementById('input-player').value);
                bVal = parseInt(document.getElementById('input-banker').value);
            }
            
            const pPair = false; 
            const bPair = false;

            if (isNaN(pVal) || isNaN(bVal)) {
                alert("请输入有效的点数 (0-9)");
                return;
            }

            const hasTrialManager = typeof window.TrialManager !== 'undefined' && window.TrialManager;
            const isActivated = hasTrialManager && typeof window.TrialManager.isPermanentlyActivated === 'function' && window.TrialManager.isPermanentlyActivated();
            const inTrial = hasTrialManager && typeof window.TrialManager.isInTrial === 'function' && window.TrialManager.isInTrial();

            const allowed = (typeof should_allow_prediction === 'function') ? await should_allow_prediction() : true;
            if (!allowed) return;
            // [FIX] Use window.lastCorePrediction for deduction validation as it reflects the MultiModel result
            const prevPrediction = window.lastCorePrediction || this.lastPrediction;
            const hadContext = prevPrediction === 'Player' || prevPrediction === 'Banker';

            // 强制确认历史已更新 (User Step 1)
            console.log("[DEBUG] 输入牌局:", { p: pVal, b: bVal });
            // historyMgr.addGame is handled by engine.processRound internally, but we verify input here.

            const result = this.engine.processRound(pVal, bVal, pPair, bPair, { 
                structureIntent: options.structureIntent, 
                virtualS: options.virtualS, // Pass virtualS from handleSimpleInput
                platform: options.platform || 'unknown',
                P1: options.P1, P2: options.P2,
                B1: options.B1, B2: options.B2
            });
            
            // 记录本次预测（用于审计）(User Step 2)
            const actual = result.winner; // Actual Outcome
            const predicted = prevPrediction; // Last Prediction

            // [Data Unification] Sync to Supabase via Tracker
            if (window.trackEvent) {
                window.trackEvent('round_completed', {
                    ...result.round,
                    predicted,
                    is_correct: (actual === predicted)
                });
            }
            
            // 写入全局日志
            window.predictionLog = window.predictionLog || [];
            window.predictionLog.push({ actual, predicted });
            
            // 更新审计
            if (window.baguaAuditor) {
                if (typeof window.baguaAuditor.addRecord === 'function') {
                    // [FIX] Pass strategy to ensure Resonance Accuracy updates
                    window.baguaAuditor.addRecord(actual, predicted, this.lastStrategy);
                }
                // [USER REQUEST] He9 Logic Connection
                if (typeof window.baguaAuditor.updateHe9Stats === 'function') {
                    window.baguaAuditor.updateHe9Stats(pVal, bVal);
                }
            }

            // 强制渲染网格 (User Step 4)
            if (typeof this.renderMatrix === 'function') {
                this.renderMatrix();
            } else {
                console.error("[ERROR] renderMatrix not found!");
            }

            // [NEW] Abstract Mode Logic: Update UI components
            if (isAbstract) {
                // Render panels
                this.renderHistoryPanel();
                this.renderRecentHistory();
                this.renderMolDenomPanel({ P_sum: pVal, B_sum: bVal });
                
                // Continue to High Odds models and fuel consumption
            }

            // --- A/B Testing & Tracking ---
            // Calculate A/B Group
            let abGroup = 'A';
            try {
                if (this.auth && this.auth.user && this.auth.user.id) {
                     const uidStr = String(this.auth.user.id);
                     const hash = [...uidStr].reduce((a, b) => a + b.charCodeAt(0), 0);
                     abGroup = hash % 2 === 0 ? 'A' : 'B';
                }
            } catch (e) {
                console.warn("A/B Group Calc Error:", e);
            }
            
            // Update Prediction Note based on A/B
            const noteEl = document.getElementById('prediction-note');
            if (noteEl) {
                 // Only if we have a valid prediction to show
                 if (this.lastPrediction && this.lastPrediction !== 'Skip' && this.lastPrediction !== 'Waiting...') {
                     if (abGroup === 'A') {
                         // Default / Control
                         // noteEl.innerText is set by renderPrediction, we might override it or just log exposure
                     } else {
                         // Variant B: More urgent text?
                         // Currently renderPrediction sets it. Let's just track the exposure here.
                     }
                 }
            }
            
            // Trigger global event for Feedback System
            try {
                window.dispatchEvent(new CustomEvent('prediction_completed'));
            } catch (e) { console.warn("Event dispatch failed:", e); }

            let econCorrect = false;
            let logicCorrect = false;
            const sciForFuel = typeof this.lastSci === 'number' && Number.isFinite(this.lastSci) ? this.lastSci : 0;
            // Dynamic SCI Threshold
            const sciFuelThreshold = window.sensitivityEngine ? window.sensitivityEngine.getSciThreshold() : 0;
            // console.log(`[Adaptive] SCI Threshold: ${sciFuelThreshold} (Current: ${sciForFuel})`);
            // [EMERGENCY FIX] Force Feedback Loop for Testing
            const forceFeedback = true; 
            const inPredictionPeriod = (sciForFuel >= sciFuelThreshold) || forceFeedback;
            if (hadContext) {
                logicCorrect = this._isPredictionCorrect(prevPrediction, result);
                this.stats.total_predictions++;
                if (logicCorrect) {
                    this.stats.total_correct++;
                }
            }
            if (hadContext && inPredictionPeriod) {
                econCorrect = logicCorrect;
                console.log(`[DEBUG] 预测结果: ${econCorrect ? 'Correct' : 'Wrong'}, 当前积分: ${this.auth.user.balanceG}`);

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

                if (window.baguaAuditor && typeof window.baguaAuditor.logStep === 'function') {
                    let predictedColor = null;
                    if (prevPrediction === 'Player') predictedColor = 'blue';
                    else if (prevPrediction === 'Banker') predictedColor = 'red';

                    let actualColor = 'green';
                    if (result.winner === 'Player') actualColor = 'blue';
                    else if (result.winner === 'Banker') actualColor = 'red';

                    if (predictedColor) {
                        // [FIX] Determine Strategy Type for Resonance Accuracy
                        let logicType = 'ECON'; // Default
                        const strat = this.lastStrategy || '';
                        // If Bagua Dynamics or similar, count as Resonance
                        if (strat.includes('Bagua') || strat.includes('Dynamics') || strat.includes('Resonance')) {
                            logicType = 'RESONANCE';
                        }
                        
                        window.baguaAuditor.logStep(logicType, predictedColor, actualColor, null);
                    }
                }
            } else if (hadContext && !inPredictionPeriod) {
                this.updateStatus("SCI 混沌期：观察模式，不消耗燃料");
            }

            if (prevPrediction && prevPrediction !== "Skip" && prevPrediction !== "Waiting..." && this.dynamics) {
                this.dynamics.recordPredictionResult(prevPrediction, result.winner);
            }

            this.updateSmartStatus();

            if (hadContext && inPredictionPeriod) {
                if (econCorrect) {
                    // Deduct fuel for successful research validation
                    try {
                        // 🛡️ Defense: Timeout Wrapper to prevent UI freeze
                        const deductionPromise = this.auth.deductGCoins(1);
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error("Deduction Timed Out")), 3000)
                        );
                        
                        const deduction = await Promise.race([deductionPromise, timeoutPromise]);

                        if (deduction && deduction.success) {
                            this.updateStatus(`模型自洽验证成功：消耗 1 燃料分`);
                            this.updateBalance(deduction.new_balance);
                        } else {
                            this.updateStatus("模型验证成功但燃料耗尽");
                            if (window.trackEvent) window.trackEvent('prediction_blocked', { reason: 'insufficient_funds' });
                        }
                    } catch (e) {
                        console.error("Deduction error:", e);
                        this.updateStatus("扣分失败，请检查网络");
                        
                        // 🔍 Tracking: Record Timeout Event for analysis
                        if (window.trackEvent) {
                             window.trackEvent('deduction_suspended', {
                                 reason: e.message || 'timeout',
                                 balance: this.auth.user.balanceG,
                                 timestamp: Date.now()
                             });
                        }
                    }
                } else {
                    this.updateStatus("模型偏离：不消耗燃料");
                }

                // Track Prediction Event
                if (window.trackEvent) {
                    try {
                        window.trackEvent('prediction_made', {
                            is_correct: econCorrect,
                            sci_status: sciForFuel,
                            current_points: this.auth.user.balanceG,
                            ab_group: abGroup,
                            signal_type: this.lastCoreResult || 'unknown', // 生产监控：信号类型
                            s_value: this.lastStrength || 0 // 生产监控：S值 (八卦强度)
                        });
                    } catch (e) { console.warn("Tracking failed:", e); }
                }
            }

            const prediction = this.engine.predictNext();
            this.lastPrediction = prediction.next_prediction;
            this.lastStrategy = prediction.strategy;

            // --- Multi-Model Vote Integration ---
            // 恢复完整多模型投票逻辑
            
            // 1. 构建上下文 (完整)
            // Reconstruct history patterns for Model usage
            const historyPatterns = [];
            for (let i = 0; i < this.engine.history.length; i++) {
                const round = this.engine.history[i];
                let lc = '';
                if (i > 0) {
                    const prev = this.engine.history[i-1];
                    lc += (prev.winner === 'Player' ? '蓝' : (prev.winner === 'Banker' ? '红' : ''));
                }
                if (i > 1) {
                     const prev2 = this.engine.history[i-2];
                     lc = (prev2.winner === 'Player' ? '蓝' : (prev2.winner === 'Banker' ? '红' : '')) + lc;
                }
                
                const ctx = {
                    P_sum: round.playerVal,
                    B_sum: round.bankerVal,
                    lastTwoColor: lc,
                    history: [...historyPatterns]
                };
                
                // Use ModelA for history pattern reconstruction (consistent with training)
                const pattern = window.EncryptedLogic && window.EncryptedLogic.ModelA ? window.EncryptedLogic.ModelA(ctx) : 'High Odds';
                historyPatterns.push(pattern);
            }

            // Current Context
            let currentLc = '';
            if (typeof this.getLastTwoColors === 'function') {
                currentLc = this.getLastTwoColors();
            } else if (typeof this._getLastTwoColors === 'function') {
                 currentLc = this._getLastTwoColors();
            }
            
            const voteContext = {
                P_sum: result.playerVal,
                B_sum: result.bankerVal,
                lastTwoColor: currentLc,
                history: historyPatterns,
                rawHistory: this.engine.history // Added for ModelB
            };

            // 2. 获取核心结果 (多模型投票)
            // Determine Actual Outcome for Training (Current round just finished)
            let actualOutcome = result.winner; // 'Player' or 'Banker'

            let coreResult = 'Wait';
            let strength = 0; // New Strength Variable
            let visualClass = null; // Visual Class from MultiModel
            let detailedNote = null; // [FIX] Capture detailed note with S-value

            if (window.EncryptedLogic && window.EncryptedLogic.MultiModelVote) {
                 const voteResult = window.EncryptedLogic.MultiModelVote(voteContext, actualOutcome);
                 if (typeof voteResult === 'object' && voteResult.final) {
                     coreResult = voteResult.final;
                     strength = voteResult.strength || 0;
                     visualClass = voteResult.visual_class;
                     detailedNote = voteResult.note; // Capture note
                     console.log("[DEBUG] MultiModelVote Result:", voteResult);
                     if (voteResult.strategy) {
                         prediction.strategy = voteResult.strategy;
                         this.lastStrategy = voteResult.strategy;
                     }
                 } else {
                     coreResult = voteResult;
                 }
            } else if (window.getHighOddsResult) {
                 coreResult = window.getHighOddsResult(voteContext, actualOutcome);
            }

            this.lastCoreResult = coreResult;
            this.lastStrength = strength;

            // 3. 颜色决策 (映射逻辑) & 强度逻辑
            let decisionColor = 2; // Green/Neutral default
            let trendBias = null;  // For Balance case
            let currentSciStatus = 'EVOLVING'; // Default

            // Logic based on Strength (User Requirement: >15% Blue Strong, <-15% Red Strong, -15~15 Balance)
            if (strength > 15) {
                decisionColor = 0; // Blue
                currentSciStatus = 'ROCK'; // Solid
            } else if (strength < -15) {
                decisionColor = 1; // Red
                currentSciStatus = 'ROCK'; // Solid
            } else {
                // Balance Zone (-15 to 15)
                decisionColor = 2; // Green
                currentSciStatus = 'EVOLVING'; // Halo
                
                // Halo Color based on strength direction first
                if (strength > 0) trendBias = 'blue';
                else if (strength < 0) trendBias = 'red';
                else {
                    // Fallback to existing trend logic if strength is exactly 0
                     const h = this.engine.history;
                     if (h.length >= 1) {
                         const lastN = h.slice(-3);
                         let bCount = 0;
                         let rCount = 0;
                         lastN.forEach(r => {
                             if (r.winner === 'Player') bCount++;
                             else if (r.winner === 'Banker') rCount++;
                         });
                         if (bCount >= rCount) trendBias = 'blue';
                         else trendBias = 'red';
                     }
                }
            }

            // 4. SCI 自洽指数驱动光晕 (Override if prediction has specific SCI)
            // Get SCI status from engine or prediction
            if (prediction && prediction.bagua_trend && typeof prediction.bagua_trend.sci === 'number') {
                 // Keep strength-based status unless SCI forces something else?
                 // User said: "SCI 引擎驱动光晕... 平衡态处理"
                 // And "强蓝用实体蓝... 平衡根据数值大小用绿圆圈+背景晕圈"
                 // So Strength dictates visual primarily now.
                 // We can log SCI but let Strength drive the 'ROCK'/'EVOLVING' status for color.
            }

            // 5. 写入全局变量 & Prediction
            window.nextDecisionColor = decisionColor;
            prediction.bias_color = decisionColor === 0 ? 'blue' : (decisionColor === 1 ? 'red' : null);
            // Format S-value for display (User Verification Aid)
            // S=(Blue-Red)/(Blue+Red)*100%
            const sValueFormatted = `(S:${strength > 0 ? '+' : ''}${strength.toFixed(1)}%)`;
            
            // [FIX] Include Structure Details in Note
            prediction.note = detailedNote ? `${detailedNote} ${sValueFormatted}` : `${coreResult} ${sValueFormatted}`;
            
            // [FIX] Sync Core Result to Prediction Object (Ensure Visual Linkage)
            if (coreResult === '蓝倾向' || coreResult.includes('蓝')) {
                prediction.next_prediction = 'Player';
            } else if (coreResult === '红倾向' || coreResult.includes('红')) {
                prediction.next_prediction = 'Banker';
            } else if (coreResult === '平衡') {
                prediction.next_prediction = 'Balance';
            }
            
            // [FIX] Inject Visual Class and S-Value into Prediction Object
            if (visualClass) prediction.visual_class = visualClass;
            prediction.s_value = strength;

            // [EMERGENCY FIX] Save for next round feedback loop
            // Normalize coreResult to standard values
            function normalizeCore(res) {
                 if (!res) return null;
                 if (res.includes('蓝') || res === 'Player') return 'Player';
                 if (res.includes('红') || res === 'Banker') return 'Banker';
                 return null; // Tie/Balance does not trigger deduction context
            }
            window.lastCorePrediction = normalizeCore(coreResult); 
            // Also update this.lastPrediction to ensure consistency if accessed elsewhere
            this.lastPrediction = window.lastCorePrediction;
            console.log("[DEBUG] Saved window.lastCorePrediction:", window.lastCorePrediction);

            // 6. 渲染 (传递真实 SCI 状态)
            if (window.EncryptedLogic && window.EncryptedLogic.renderPrediction) {
                window.EncryptedLogic.renderPrediction({
                    bias_color: prediction.bias_color,
                    sci_status: currentSciStatus, 
                    note: detailedNote || coreResult, // [FIX] Use detailed note if available
                    trend_bias: trendBias,
                    visual_class: visualClass, // Pass visual class
                    s_value: strength // Pass strength for debugging
                });
                console.log("[DEBUG] Calling renderPrediction with visual_class:", visualClass);
            }
            
            console.log(`[CoreLogic] Result: ${coreResult} -> Color: ${decisionColor}, SCI: ${currentSciStatus}`);
            console.log(`[CoreLogic] Strength: ${strength.toFixed(1)}% -> ${currentSciStatus} ${currentSciStatus === 'EVOLVING' ? '(' + (trendBias === 'blue' ? 'Blue' : 'Red') + ' Halo)' : ''}`);

            /*
            // --- Multi-Model Vote Integration ---
            // 【紧急修复】强制直连核心逻辑
            if (true) { // 替换原有 if (window.getHighOddsResult)
                // ... (Deleted Emergency Fix Block)
            }
            */
            
            // Update UI components
            
            // Update UI components
            this.renderMatrix();
            this.renderHistoryPanel(); 
            this.renderRecentHistory(); 
            this.renderMolDenomPanel(result);
            this.renderPrediction(prediction);
            // [FIX] Update S-Value Display Linkage
            this.updatePredictionDisplay(prediction, strength);
            
            // Update SCI for next round visualization
        if (prediction && prediction.bagua_trend && typeof prediction.bagua_trend.sci === 'number') {
            this.lastSci = prediction.bagua_trend.sci;
        } else {
            this.lastSci = 0;
        }

        // Re-render prediction explicitly if using EncryptedLogic
        if (window.EncryptedLogic && typeof window.EncryptedLogic.renderPrediction === 'function') {
             window.EncryptedLogic.renderPrediction(prediction);
        }
        
        // Explicitly update Bagua Auditor if available
        if (window.baguaAuditor && typeof window.baguaAuditor.updateStats === 'function') {
            window.baguaAuditor.updateStats();
        }

        // Layer 1: Runtime Self-Check
        this.selfCheckIntegrity();

        } catch (error) {
            console.error("Critical Error in handlePrediction:", error);
            // [USER REQUEST] 强制结果输出：如果高级算法报错，直接返回随机偏移量保证变色
            try {
                const fallbackP = pInput !== null ? pInput : 0;
                const fallbackB = bInput !== null ? bInput : 0;
                let fallbackColor = 'green';
                if (fallbackP > fallbackB) fallbackColor = 'blue';
                else if (fallbackB > fallbackP) fallbackColor = 'red';
                
                this.forceVisualUpdate(fallbackColor);
                document.getElementById('prediction-note').innerText = "System Fallback";
            } catch (innerE) {
                console.error("Fallback failed:", innerE);
            }

            if (window.AHS_onError) window.AHS_onError(error);
            // alert(`系统运行错误: ${error.message}\n请截图反馈给管理员。`); // Disable alert to prevent blocking
        }
    }

    initSSEClient() {
        // SSE Disabled to prevent 404 errors in static environment
        /*
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
                            this.updateStatus(`收到支持者捐赠：+${delta} 燃料分`);
                        }
                    }
                } catch (_) {}
            };
            es.onerror = () => { try { es.close(); } catch (_) {} };
        } catch (_) {}
        */
    }

    // Layer 1: Runtime Self-Check
    selfCheckIntegrity() {
        if (!window.G2Engine) return;
        try {
            // 1. Get current history
            const currentHistory = this.engine.history; 
            
            // 2. Create a fresh temporary engine
            const tempEngine = new G2Engine();
            
            // 3. Register Plugins? 
            // The plugins might affect prediction (like DynamicsEngine).
            // For a full check, we should ideally clone plugins too, 
            // but for basic logic integrity, checking base G2Engine is a good start.
            // If DynamicsEngine is critical for 'next_prediction', we need it.
            // Let's assume for now we are checking core engine consistency.
            // If DynamicsEngine is stateful beyond history, this check might fail.
            // However, DynamicsEngine is supposed to be deterministic based on history.
            if (window.DynamicsEngine) {
                tempEngine.registerPlugin(new DynamicsEngine());
            }

            // 4. Replay
            currentHistory.forEach(round => {
                tempEngine.processRound(round.playerVal, round.bankerVal, round.markers.bluePair, round.markers.redPair);
            });
            
            // 5. Compare Predictions
            const freshPrediction = tempEngine.predictNext();
            const currentPrediction = this.lastPrediction; 
            
            // Compare key fields
            // Note: 'next_prediction' might be 'Waiting...' if history < 3
            if (freshPrediction.next_prediction !== currentPrediction) {
                console.warn("[SelfCheck] Prediction Mismatch!", { 
                    current: currentPrediction, 
                    fresh: freshPrediction.next_prediction,
                    round: currentHistory.length
                });
                
                // Optional: Auto-correction
                // this.lastPrediction = freshPrediction.next_prediction;
                // this.renderPrediction(freshPrediction);
            } else {
                 // console.log("[SelfCheck] Integrity Verified ✅");
            }
        } catch (e) {
            console.error("[SelfCheck] Error:", e);
        }
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
            container.innerHTML = '<span style="color:#666; font-size:10px; padding:0 5px;">等待开奖结果...</span>';
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

            // 1. 蓝/红 点数显示
            const valDiv = document.createElement('div');
            valDiv.innerHTML = `<span style="color:#007bff">蓝 ${r.playerVal}</span> / <span style="color:#dc3545">红 ${r.bankerVal}</span>`;
            
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
            panel.innerHTML = '<div style="width:100%; text-align:center; color:#aaa; font-size:12px;">等待数据 (至少需要 3 轮)...</div>';
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
                if (!uncancelledStack[j].isCancelled && (uncancelledStack[j].val + item.val === 9)) {
                     // Found Match
                     uncancelledStack[j].isCancelled = true;
                     item.isCancelled = true;
                     
                     // Add slash to BOTH
                     this._addSlash(uncancelledStack[j].dom);
                     this._addSlash(item.dom);
                     
                     matched = true;
                     break;
                }
            }
            
            if (!matched) {
                uncancelledStack.push(item);
            }

            col.appendChild(baguaDiv);
            panel.appendChild(col);
        });
        
        // Auto-scroll to right
        panel.scrollLeft = panel.scrollWidth;
    }

    _addSlash(dom) {
        if (!dom) return;
        const slash = document.createElement('div');
        slash.className = 'slash-overlay slash-green';
        dom.appendChild(slash);
        dom.style.opacity = '0.5';
    }

    renderMatrix() {
        const matrixDiv = document.getElementById('game-matrix');
        if (!matrixDiv) return;
        matrixDiv.innerHTML = '';
        const matrix = this.engine.getMatrix();
        
        // Update Stats
        const pTotal = document.getElementById('stat-blue-total');
        const bTotal = document.getElementById('stat-red-total');
        const tTotal = document.getElementById('stat-tie-total');
        const pPair = document.getElementById('stat-blue-pair');
        const bPair = document.getElementById('stat-red-pair');

        if (pTotal) pTotal.innerText = matrix.flat().filter(c => c && c.winner === 'Player').length;
        if (bTotal) bTotal.innerText = matrix.flat().filter(c => c && c.winner === 'Banker').length;
        if (tTotal) tTotal.innerText = matrix.flat().filter(c => c && c.winner === 'Tie').length;
        // Pairs not tracked in matrix directly easily, use engine history
        if (pPair) pPair.innerText = this.engine.history.filter(r => r.markers && r.markers.bluePair).length;
        if (bPair) bPair.innerText = this.engine.history.filter(r => r.markers && r.markers.redPair).length;

        // Render Matrix (Standard Big Road style)
        // Ensure at least 20 columns for display
        const minCols = 20;
        const displayMatrix = [...matrix];
        while (displayMatrix.length < minCols) {
            displayMatrix.push(new Array(6).fill(""));
        }

        // Limit to last X columns if too long
        const maxCols = 50;
        const renderData = displayMatrix.slice(-maxCols);

        // Container style for horizontal scroll
        matrixDiv.style.display = 'flex';
        matrixDiv.style.flexDirection = 'row';
        matrixDiv.style.overflowX = 'auto';
        matrixDiv.style.height = '100%';

        renderData.forEach(colData => {
            const colDiv = document.createElement('div');
            colDiv.style.display = 'flex';
            colDiv.style.flexDirection = 'column';
            colDiv.style.width = '20px'; // Adjust cell width
            colDiv.style.minWidth = '20px';
            colDiv.style.borderRight = '1px solid #333';
            
            for (let i = 0; i < 6; i++) {
                const cellDiv = document.createElement('div');
                cellDiv.style.height = '20px'; // Adjust cell height
                cellDiv.style.borderBottom = '1px solid #333';
                cellDiv.style.display = 'flex';
                cellDiv.style.alignItems = 'center';
                cellDiv.style.justifyContent = 'center';
                cellDiv.style.position = 'relative';

                const cellData = colData[i];
                if (cellData) {
                    const circle = document.createElement('div');
                    circle.style.width = '14px';
                    circle.style.height = '14px';
                    circle.style.borderRadius = '50%';
                    circle.style.border = '2px solid';
                    
                    if (cellData.winner === 'Player') {
                        circle.style.borderColor = '#007bff'; // Blue
                    } else if (cellData.winner === 'Banker') {
                        circle.style.borderColor = '#dc3545'; // Red
                    }

                    // Tie Marker (Green Line)
                    if (cellData.markers && cellData.markers.isTie) {
                        const line = document.createElement('div');
                        line.style.position = 'absolute';
                        line.style.width = '16px'; // Slightly longer
                        line.style.height = '2px';
                        line.style.backgroundColor = '#28a745';
                        line.style.transform = 'rotate(-45deg)';
                        cellDiv.appendChild(line);

                        // If multiple ties, show count
                        if (cellData.markers.tieCount > 1) {
                             const txt = document.createElement('span');
                             txt.innerText = cellData.markers.tieCount;
                             txt.style.position = 'absolute';
                             txt.style.fontSize = '10px';
                             txt.style.fontWeight = 'bold';
                             txt.style.color = '#28a745';
                             txt.style.zIndex = '2';
                             cellDiv.appendChild(txt);
                        }
                    }
                    
                    // Pairs (Dots)
                    if (cellData.markers && cellData.markers.bluePair) {
                        const dot = document.createElement('div');
                        dot.style.position = 'absolute';
                        dot.style.width = '4px';
                        dot.style.height = '4px';
                        dot.style.backgroundColor = '#007bff';
                        dot.style.borderRadius = '50%';
                        dot.style.top = '0px';
                        dot.style.right = '0px';
                        cellDiv.appendChild(dot);
                    }
                    if (cellData.markers && cellData.markers.redPair) {
                        const dot = document.createElement('div');
                        dot.style.position = 'absolute';
                        dot.style.width = '4px';
                        dot.style.height = '4px';
                        dot.style.backgroundColor = '#dc3545';
                        dot.style.borderRadius = '50%';
                        dot.style.bottom = '0px';
                        dot.style.left = '0px';
                        cellDiv.appendChild(dot);
                    }

                    cellDiv.appendChild(circle);
                    
                    // Display round number for debug? No, keep clean.
                }
                colDiv.appendChild(cellDiv);
            }
            matrixDiv.appendChild(colDiv);
        });
        
        // Auto scroll to right
        matrixDiv.scrollLeft = matrixDiv.scrollWidth;
    }

    updateSmartStatus() {
        const el = document.getElementById('active-pattern-display');
        const box = document.getElementById('smart-status');
        if (!el || !box) return;

        if (this.dynamics && this.dynamics.patternState) {
            let statusText = [];
            if (this.dynamics.patternState.A) statusText.push('<span class="pattern-tag">模式A</span>');
            if (this.dynamics.patternState.B) statusText.push('<span class="pattern-tag">模式B</span>');
            if (this.dynamics.patternState.crownEventActive) statusText.push('<span class="pattern-tag">👑皇冠</span>');
            
            el.innerHTML = statusText.length > 0 ? statusText.join(' ') : '正在扫描...';
        }
        
        // Update Accuracy Box
        const accDisplay = document.getElementById('accuracy-display');
        if (accDisplay) {
            const rate = this.stats.total_predictions > 0 
                ? ((this.stats.total_correct / this.stats.total_predictions) * 100).toFixed(1) 
                : '0.0';
            accDisplay.innerText = `${rate}% (${this.stats.total_correct}/${this.stats.total_predictions})`;
        }
    }
    
    updateStatus(msg) {
        const el = document.getElementById('status-panel');
        if (el) {
            el.innerText = msg;
            el.style.opacity = '1';
            setTimeout(() => { el.style.opacity = '0.7'; }, 2000);
        }
    }

    _isPredictionCorrect(pred, result) {
        if (pred === 'Player' && result.winner === 'Player') return true;
        if (pred === 'Banker' && result.winner === 'Banker') return true;
        return false;
    }

    renderPrediction(pred) {
        if (window.EncryptedLogic && typeof window.EncryptedLogic.renderPrediction === 'function') {
            window.EncryptedLogic.renderPrediction(pred);
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
        if (window.EncryptedLogic && typeof window.EncryptedLogic.initMonitor === 'function') {
            window.EncryptedLogic.initMonitor();
        }
    }
}
