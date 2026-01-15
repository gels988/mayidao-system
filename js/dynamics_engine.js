// dynamics_engine.js - Phase 3 核心智能模块 (V1.1 Enhanced)
// 基于指挥官指令：动态权重 + 走势识别 + 一票否决 + 7/6皇冠 + Tie预测
// 总则：跟多顺势 | 有时则有，无时则无，多时则多

class DynamicsEngine {
    constructor() {
        this.name = "DynamicsEngine_Phase3_Enhanced";
        // 初始化八卦数字(1-8)的动态权重
        this.dynamicWeights = {1:1.0, 2:1.0, 3:1.0, 4:1.0, 5:1.0, 6:1.0, 7:1.0, 8:1.0};
        this.patternState = {
            A: false, // 1:3:2 -> 2,7
            B: false, // 2:3:1 -> 4,5
            lastActiveRound: -1,
            activeRounds: 0,
            crownEventActive: false // 7/6 皇冠事件
        };
        this.tieState = {
            recentSumSmallCount: 0, // 最近局数中小点数之和的频率
            zeroOneDiffCount: 0     // 差值为0或1的频率
        };
        this.config = {
            decayFactor: 0.8,
            incrementFactor: 1.1,
            extendedIncrementFactor: 1.2,
            weightMin: 0.1,
            weightMax: 5.0,
            patternDuration: 4 // 遗传效应持续4局
        };
        // 准确率统计
        this.totalPredictions = 0;
        this.correctPredictions = 0;

        this.guidingPrinciples = [
            "跟多顺势",
            "有时则有，无时则无，多时则多"
        ];

        this._lastHistory = [];
        this._lastBaguaSeq = [];
        this.baguaTrendState = { lastQuadrant: null, lastCoord: null, sequenceIndex: 0, invalidBuffer: 0 };
        this._historyWindowResetPending = false;
        this._lastPredictionColor = null;
        this._lastLogicType = null;
        this._lastRawCodes = null;
    }

    // --- Plugin Interface (Integration Adapter) ---
    init(core) {
        this.core = core;
        console.log("DynamicsEngine Plugin Initialized (Enhanced)");
    }

    onReset() {
        this.dynamicWeights = {1:1.0, 2:1.0, 3:1.0, 4:1.0, 5:1.0, 6:1.0, 7:1.0, 8:1.0};
        this.patternState = {
            A: false,
            B: false,
            lastActiveRound: -1,
            activeRounds: 0,
            crownEventActive: false
        };
        this.tieState = {
            recentSumSmallCount: 0,
            zeroOneDiffCount: 0
        };
        // Keep stats? Usually yes, or user might want full reset.
        // If "Undo" calls onReset, we might lose accumulated stats.
        // But since we Replay history, the stats will be rebuilt!
        // So resetting here is correct.
        this.totalPredictions = 0;
        this.correctPredictions = 0;
    }

    onRoundProcessed(result, history) {
        // Extract Bagua Sequence for logic
        const seq = this._extractBaguaSequence(history);
        this._lastHistory = history;
        this._lastBaguaSeq = seq;
        this.updateWeightsAndPatterns(seq, history.length);
        
        // Phase 3.1: Analyze for Special Events (Crown, Tie)
        this._analyzeSpecialEvents(result, history);

        const actualColor = result.winner === 'Player' ? 'blue' : (result.winner === 'Banker' ? 'red' : 'green');
        if (window && window.baguaAuditor && this._lastPredictionColor && this._lastLogicType) {
            window.baguaAuditor.logStep(this._lastLogicType, this._lastPredictionColor, actualColor, this._lastRawCodes);
        }

        if (this._historyWindowResetPending) {
            this.baguaTrendState.invalidBuffer = 0;
            this._historyWindowResetPending = false;
        }
    }

    onPredict(history) {
        // 1. Generate Base Prediction from Weights (Legacy)
        let prediction = this._generatePredictionFromWeights();

        // 2. Apply Veto Rules (Legacy)
        prediction = this.applyVetoRules(prediction, history);
        
        // 3. Apply Crown Logic (Override)
        if (this.patternState.crownEventActive) {
            prediction.next_prediction = "Banker";
            prediction.confidence = 0.88;
            prediction.strategy = "Crown_7_6_Rebound";
            prediction.note = "👑 7/6 Crown Event Detected";
            this.patternState.crownEventActive = false; 
            return prediction; // Early exit for Crown
        }

        // 4. Apply Bagua Quadrant Logic (The Core "Closed Loop")
        const seq = Array.isArray(this._lastBaguaSeq) && this._lastBaguaSeq.length > 0 ? this._lastBaguaSeq : this._extractBaguaSequence(history);
        const trendData = this._computeQuadrantTrend(history, seq);
        
        // Inject Trend Data
        prediction.bagua_trend = trendData;
        
        // Logic Injection: Override prediction based on Trend Color
        // Blue -> Player, Red -> Banker, Green -> Balance (Skip/Tie)
        if (trendData.color === 'blue') {
            prediction.next_prediction = "Player";
            // Resonance Boost
            if (trendData.quadrant === 'RESONANCE_BLUE') {
                prediction.confidence = 0.90;
                prediction.note = "🌊🌊🌊 Resonance Blue (Strong)";
            } else {
                prediction.confidence = 0.75;
                prediction.note = "🌊 Trend Blue Transition";
            }
            prediction.strategy = `Bagua_${trendData.quadrant}`;
            this._lastPredictionColor = 'blue';
            this._lastLogicType = trendData.quadrant === 'RESONANCE_BLUE' ? 'RESONANCE' : 'TRANSITION';

        } else if (trendData.color === 'red') {
            prediction.next_prediction = "Banker";
             // Resonance Boost
            if (trendData.quadrant === 'RESONANCE_RED') {
                prediction.confidence = 0.90;
                prediction.note = "🔥🔥🔥 Resonance Red (Strong)";
            } else if (trendData.quadrant === 'HYSTERESIS_RED_STRONG') {
                prediction.confidence = 0.90;
                prediction.note = "🔥 He-9 Hysteresis Strong Red";
            } else {
                prediction.confidence = 0.75;
                prediction.note = "🔥 Trend Red Transition";
            }
            prediction.strategy = `Bagua_${trendData.quadrant}`;
            this._lastPredictionColor = 'red';
            this._lastLogicType = trendData.quadrant === 'RESONANCE_RED' ? 'RESONANCE' : (trendData.quadrant === 'HYSTERESIS_RED_STRONG' ? 'HE9' : 'TRANSITION');

        } else {
            // Green / Balance
            prediction.next_prediction = "Balance"; // New State
            prediction.confidence = 0.50;
            prediction.strategy = trendData.strategy;
            prediction.note = trendData.heJiu ? "⚖️ He-9 Cancellation" : "⚖️ Balanced State";
            prediction.risk_level = "Wait";
            this._lastPredictionColor = 'green';
            this._lastLogicType = trendData.quadrant === 'RESET_64' ? 'FORCE_64' : (trendData.quadrant === 'INTERRUPTED' ? 'HE9' : 'TRANSITION');
            if (trendData.observe) {
                prediction.risk_level = "Observe";
                prediction.observation_mode = true;
            }
        }

        // 5. Add Details for UI
        const tieRisk = this._calculateTieRisk();
        prediction.details = {
            ...prediction.details,
            active_patterns: this.getActivePatterns(),
            weights: this.getTopWeights(3),
            tie_risk: (tieRisk * 100).toFixed(1) + "%",
            bagua_quadrant: trendData.quadrant
        };

        return prediction;
    }

    // --- Core Logic ---

    // 入口函数：由 core_engine.js 在每局结束后调用
    updateWeightsAndPatterns(baguaSequence, currentRoundIndex) {
        this._updateDynamicWeights(baguaSequence, currentRoundIndex);
        this._detectKeyPatterns(baguaSequence, currentRoundIndex);
        this._managePatternLifespan(currentRoundIndex);
    }

    // 任务1：动态权重调节
    _updateDynamicWeights(seq, roundIdx) {
        const appeared = new Set();

        const multiplier = this._getPresenceAbsenceMultiplier(seq, this._lastHistory);
        const decayFactor = this._adjustDecayFactor(multiplier);
        
        // 步骤1: 衰减出现的数字
        for (let i = Math.max(0, seq.length - 9); i < seq.length; i++) {
            const num = seq[i];
            if (num >= 1 && num <= 8) {
                appeared.add(num);
                this.dynamicWeights[num] *= decayFactor;
                this.dynamicWeights[num] = Math.max(this.config.weightMin, this.dynamicWeights[num]);
            }
        }

        // 步骤2: 递增未出现的数字
        for (let num = 1; num <= 8; num++) {
            if (!appeared.has(num)) {
                let factor = this._adjustIncrementFactor(this.config.incrementFactor, multiplier);
                // 检查连续缺席
                let absentCount = 0;
                for (let j = seq.length - 1; j >= 0 && absentCount < 3; j--) {
                    if (seq[j] !== num) absentCount++;
                    else break;
                }
                if (absentCount >= 2) {
                    factor = this._adjustIncrementFactor(this.config.extendedIncrementFactor, multiplier);
                }
                this.dynamicWeights[num] *= factor;
                this.dynamicWeights[num] = Math.min(this.config.weightMax, this.dynamicWeights[num]);
            }
        }

        // 步骤3: 特殊事件强化（对子、平局、7/6等）
        this._applySpecialEventBoost(seq, roundIdx);
    }

    _applySpecialEventBoost(seq, roundIdx) {
        if (seq.length < 2) return;
        const last = seq[seq.length - 1];
        const secondLast = seq[seq.length - 2];

        const multiplier = this._getPresenceAbsenceMultiplier(seq, this._lastHistory);

        // 对子逻辑：若连续相同数字，提升其所在区间权重
        if (last === secondLast) {
            if ([2,2].includes(last)) {
                [1,2,3].forEach(n => this._boostWeight(n, 1.5 * multiplier));
            } else if ([7,7].includes(last)) {
                [6,7,8].forEach(n => this._boostWeight(n, 1.5 * multiplier));
            }
        }
    }

    _adjustDecayFactor(multiplier) {
        const base = this.config.decayFactor;
        const delta = (multiplier - 1) * 0.25;
        return Math.max(0.6, Math.min(0.95, base + delta));
    }

    _adjustIncrementFactor(base, multiplier) {
        const delta = (multiplier - 1) * 0.15;
        const adjusted = base - delta;
        return Math.max(1.0, Math.min(1.35, adjusted));
    }

    _boostWeight(num, factor) {
        if (this.dynamicWeights[num]) {
            this.dynamicWeights[num] *= factor;
            this.dynamicWeights[num] = Math.min(this.config.weightMax, this.dynamicWeights[num]);
        }
    }

    // 任务2：关键模式识别
    _detectKeyPatterns(seq, roundIdx) {
        if (seq.length < 6) return;

        const last6 = seq.slice(-6);
        // 模式A: 1:3:2 -> 对应数字序列 [2, x, x, x, 7, x] 或类似结构
        const idx2 = last6.lastIndexOf(2);
        const idx7 = last6.lastIndexOf(7);
        if (idx2 !== -1 && idx7 !== -1 && idx2 < idx7) {
            this.patternState.A = true;
            this.patternState.lastActiveRound = roundIdx;
            this.patternState.activeRounds = this.config.patternDuration;
            // 提升2,7,3,6权重
            [2,7,3,6].forEach(n => this._boostWeight(n, 1.8));
        }

        // 模式B: 2:3:1 -> 对应数字4和5
        const idx4 = last6.lastIndexOf(4);
        const idx5 = last6.lastIndexOf(5);
        if (idx4 !== -1 && idx5 !== -1 && idx4 < idx5) {
            this.patternState.B = true;
            this.patternState.lastActiveRound = roundIdx;
            this.patternState.activeRounds = this.config.patternDuration;
            // 提升4,5,1,8权重
            [4,5,1,8].forEach(n => this._boostWeight(n, 1.8));
        }
    }

    _managePatternLifespan(currentRound) {
        if (this.patternState.activeRounds > 0) {
            this.patternState.activeRounds--;
        } else {
            this.patternState.A = false;
            this.patternState.B = false;
        }
    }

    // Phase 3.1: Special Event Analysis (Crown & Tie)
    _analyzeSpecialEvents(result, history) {
        // 1. Crown Event Detection (P=7, B=6, Winner=Player)
        if (result.playerVal === 7 && result.bankerVal === 6 && result.winner === "Player") {
            this.patternState.crownEventActive = true;
            console.log("👑 Crown Event Detected! Preparing Banker Boost.");
        }

        // 2. Tie Precursors Analysis
        // Update stats based on last 6 rounds
        const lookback = 6;
        const recent = history.slice(-lookback);
        
        let smallPointSum = 0;
        let closeDiff = 0;

        recent.forEach(r => {
            if ((r.playerVal + r.bankerVal) <= 8) smallPointSum++;
            if (Math.abs(r.playerVal - r.bankerVal) <= 1) closeDiff++;
        });

        this.tieState.recentSumSmallCount = smallPointSum;
        this.tieState.zeroOneDiffCount = closeDiff;
    }

    _calculateTieRisk() {
        // Heuristic: If many recent rounds have small point sums or close scores, Tie is likely.
        let risk = 0.1; // Base risk
        
        // Factor 1: Close Scores (0 or 1 diff)
        // If > 50% of recent rounds were close
        if (this.tieState.zeroOneDiffCount >= 3) risk += 0.3;
        if (this.tieState.zeroOneDiffCount >= 5) risk += 0.2;

        // Factor 2: Small Point Sums
        if (this.tieState.recentSumSmallCount >= 3) risk += 0.2;

        return Math.min(risk, 0.95);
    }

    // 任务3：一票否决 & 高概率信号
    applyVetoRules(prediction, history) {
        // 示例：庄连赢5局后，闲胜率极低
        if (this._isBankerStreak(history, 5)) {
            if (prediction.next_prediction === 'Player' && prediction.confidence < 0.7) {
                prediction.confidence = 0.3; // 降信心度
                prediction.note = "Veto: Banker streak";
                prediction.next_prediction = "Skip"; // Optional: Change to Skip
            }
        }
        return prediction;
    }

    _isBankerStreak(hist, count) {
        if (hist.length < count) return false;
        return hist.slice(-count).every(r => r.winner === 'Banker');
    }

    _getStreakInfo(history) {
        const lastNonTie = this._getLastNonTieWinner(history);
        if (!lastNonTie) return { winner: null, count: 0 };

        let count = 0;
        for (let i = history.length - 1; i >= 0; i--) {
            const w = history[i].winner;
            if (w === 'Tie') continue;
            if (w === lastNonTie) count++;
            else break;
        }
        return { winner: lastNonTie, count };
    }

    _getLastNonTieWinner(history) {
        for (let i = history.length - 1; i >= 0; i--) {
            const w = history[i].winner;
            if (w && w !== 'Tie') return w;
        }
        return null;
    }

    _getFollowMajorityTrend(history, threshold) {
        if (!Array.isArray(history) || history.length === 0) return null;

        const seq = Array.isArray(this._lastBaguaSeq) && this._lastBaguaSeq.length > 0 ? this._lastBaguaSeq : this._extractBaguaSequence(history);
        const multiplier = this._getPresenceAbsenceMultiplier(seq, history);

        const last = this._getStreakInfo(history);
        if (last.winner && last.count >= threshold) {
            const baseConfidence = this._hasRecentDuplicate(history, 6) ? 0.95 : 0.9;
            const confidence = Math.min(0.98, Math.max(0.6, baseConfidence * multiplier));
            return {
                winner: last.winner,
                confidence,
                strategy: "Follow_Majority",
                note: `🔥 ${last.winner} Follow (${last.count})`
            };
        }

        if (last.winner && last.count === 1) {
            let idx = history.length - 1;
            while (idx >= 0 && history[idx].winner === 'Tie') idx--;
            if (idx < 0) return null;

            const jumpWinner = history[idx].winner;
            idx--;

            let prevWinner = null;
            while (idx >= 0) {
                const w = history[idx].winner;
                if (w === 'Tie') {
                    idx--;
                    continue;
                }
                prevWinner = w;
                break;
            }

            if (!prevWinner || prevWinner === jumpWinner) return null;

            let prevCount = 0;
            while (idx >= 0) {
                const w = history[idx].winner;
                if (w === 'Tie') {
                    idx--;
                    continue;
                }
                if (w === prevWinner) {
                    prevCount++;
                    idx--;
                    continue;
                }
                break;
            }

            if (prevCount >= threshold) {
                const baseConfidence = this._hasRecentDuplicate(history, 6) ? 0.95 : 0.9;
                const confidence = Math.min(0.98, Math.max(0.6, baseConfidence * multiplier));
                return {
                    winner: prevWinner,
                    confidence,
                    strategy: "Follow_Majority_Single_Jump",
                    note: `🔥 ${prevWinner} Follow (${prevCount})` 
                };
            }
        }

        return null;
    }

    _getPresenceAbsenceMultiplier(seq, history) {
        const hist = Array.isArray(history) ? history : [];
        const baguaSeq = Array.isArray(seq) ? seq : [];

        let score = 0;

        const streak = this._getStreakInfo(hist);
        if (streak.count >= 4) score += 0.6;
        else if (streak.count === 3) score += 0.35;

        if (this._isSingleJumpAfterLongStreak(hist, 4)) score += 0.4;
        if (this._hasRecentDuplicate(hist, 6)) score += 0.15;

        const recentBagua = baguaSeq.slice(-9);
        if (recentBagua.length >= 3) {
            const counts = Object.create(null);
            for (let i = 0; i < recentBagua.length; i++) {
                const k = String(recentBagua[i]);
                counts[k] = (counts[k] || 0) + 1;
            }
            let maxCount = 0;
            for (const k in counts) {
                if (counts[k] > maxCount) maxCount = counts[k];
            }
            if (maxCount >= 3) score += 0.25;
            else if (maxCount === 2) score += 0.12;
        }

        const lastWinners = [];
        for (let i = hist.length - 1; i >= 0 && lastWinners.length < 12; i--) {
            const w = hist[i].winner;
            if (!w || w === 'Tie') continue;
            lastWinners.push(w);
        }
        if (lastWinners.length >= 4) {
            let changes = 0;
            for (let i = 0; i < lastWinners.length - 1; i++) {
                if (lastWinners[i] !== lastWinners[i + 1]) changes++;
            }
            const rate = changes / (lastWinners.length - 1);
            score += (1 - rate) * 0.2;
        }

        score = Math.max(0, Math.min(1, score));
        return 0.9 + score * 0.3;
    }

    _isSingleJumpAfterLongStreak(history, threshold) {
        if (!Array.isArray(history) || history.length < threshold + 1) return false;

        let idx = history.length - 1;
        while (idx >= 0 && history[idx].winner === 'Tie') idx--;
        if (idx < 0) return false;
        const lastWinner = history[idx].winner;
        idx--;

        let prevWinner = null;
        while (idx >= 0) {
            const w = history[idx].winner;
            if (w === 'Tie') {
                idx--;
                continue;
            }
            prevWinner = w;
            break;
        }
        if (!prevWinner || prevWinner === lastWinner) return false;

        let prevCount = 0;
        while (idx >= 0) {
            const w = history[idx].winner;
            if (w === 'Tie') {
                idx--;
                continue;
            }
            if (w === prevWinner) {
                prevCount++;
                idx--;
                continue;
            }
            break;
        }

        return prevCount >= threshold;
    }

    _hasRecentDuplicate(history, lookback) {
        const slice = history.slice(-lookback);
        const vals = [];
        for (const r of slice) {
            // Check Player Val duplicates or Banker Val duplicates? 
            // User example "55 repeated". Could be P5, P5 or just any 5.
            // Let's check for any number appearing twice in a row in the sequence of outcomes?
            // Or just presence of duplicates in the window.
            // "前面出现过重复数字" -> "Previous numbers had duplicates".
            // Let's check for Pair-like values in P or B points.
            vals.push(r.playerVal);
            vals.push(r.bankerVal);
        }
        
        for (let i = 0; i < vals.length - 1; i++) {
            if (vals[i] === vals[i+1]) return true;
        }
        return false;
    }

    // 任务4：准确率校验接口
    recordPredictionResult(predicted, actual) {
        if (!predicted || predicted === "Skip" || predicted === "Waiting...") return;
        this.totalPredictions++;
        if (predicted === actual) {
            this.correctPredictions++;
        }
    }

    getAccuracy() {
        if (this.totalPredictions === 0) return 0;
        return (this.correctPredictions / this.totalPredictions);
    }

    // --- Helpers ---
    _extractBaguaSequence(history) {
        const streaks = [];
        let currentStreak = null;
        history.forEach(round => {
            if (round.winner === 'Tie') return;
            if (!currentStreak) currentStreak = { winner: round.winner, count: 1 };
            else if (round.winner === currentStreak.winner) currentStreak.count++;
            else { streaks.push(currentStreak); currentStreak = { winner: round.winner, count: 1 }; }
        });
        if (currentStreak) streaks.push(currentStreak);

        const baguaSeq = [];
        for (let i = 0; i < streaks.length; i++) {
            if ((i + 1) % 3 === 0) {
                const chunk = [streaks[i-2], streaks[i-1], streaks[i]];
                const val = this._calculateBagua(chunk);
                if (val) baguaSeq.push(val);
            }
        }
        return baguaSeq;
    }

    _calculateBagua(chunk) {
        const map = chunk.map(s => s.winner === 'Player' ? '1' : '0').join('');
        // Mapping: 1=111, 2=011, 3=101, 4=001, 5=110, 6=010, 7=100, 8=000
        const mapping = {'111':1, '011':2, '101':3, '001':4, '110':5, '010':6, '100':7, '000':8};
        return mapping[map] || null;
    }

    _analyzeSingleStep(x, y) {
        if (x === null || y === null) return "VOID";
        if (x + y === 9) return "NEUTRAL"; // 合九抵消
        
        if (x >= 1 && x <= 4 && y >= 1 && y <= 4) return "BLUE";
        if (x >= 5 && x <= 8 && y >= 5 && y <= 8) return "RED";
        return "NEUTRAL";
    }

    _computeQuadrantTrend(history, baguaSeq) {
        const seq = Array.isArray(baguaSeq) ? baguaSeq : [];
        
        // 1. 序列长度检查与 64 位重置
        this.baguaTrendState.sequenceIndex = seq.length;
        if (this.baguaTrendState.sequenceIndex >= 64) {
             this._historyWindowResetPending = true;
             this._lastRawCodes = "CYCLE_RESET";
             return { trend: "NEUTRAL", color: "green", quadrant: "RESET_64", heJiu: true, strategy: "Force_Balance_64", observe: true };
        }

        // 需要至少 4 个八卦数才能构成 3 个滑动对：(n-3, n-2), (n-2, n-1), (n-1, n)
        // 实际上 Python 代码是 history_window.append((x,y))。
        // 我们用滑动窗口模拟：
        // Step 1: x=seq[n-4], y=seq[n-3] (Wait, let's use last 4 items to make 3 pairs?)
        // Pair 1: seq[n-4], seq[n-3]
        // Pair 2: seq[n-3], seq[n-2]
        // Pair 3: seq[n-2], seq[n-1] (Last pair)
        
        if (seq.length < 2) {
             return { trend: "NEUTRAL", color: "green", quadrant: null, heJiu: false, strategy: "Insufficient_Data" };
        }

        // 如果不足 4 个，回退到单步逻辑 (Legacy Single Step)
        if (seq.length < 4) {
             const x = seq[seq.length - 2];
             const y = seq[seq.length - 1];
             const state = this._analyzeSingleStep(x, y);
             
             let color = "green";
             if (state === "BLUE") color = "blue";
             else if (state === "RED") color = "red";
             
             this._lastRawCodes = `${x}-${y}`;
             return { 
                 trend: state === "NEUTRAL" ? "NEUTRAL" : (state === "BLUE" ? "COOL" : "HOT"),
                 color: color,
                 quadrant: state === "NEUTRAL" ? "MIXED" : (state === "BLUE" ? "Q1_Blue" : "Q4_Red"),
                 heJiu: (x+y===9),
                 strategy: "Single_Step_Fallback"
             };
        }

        // 2. 构建 3 步滑动窗口
        const windowSeq = seq.slice(-4); 
        const pairs = [
            [windowSeq[0], windowSeq[1]],
            [windowSeq[1], windowSeq[2]],
            [windowSeq[2], windowSeq[3]]
        ];

        // 3. 分析每一步状态
        const states = pairs.map(p => this._analyzeSingleStep(p[0], p[1]));
        const he9Flags = pairs.map(p => (p[0] + p[1] === 9));
        this._lastRawCodes = `${pairs[2][0]}-${pairs[2][1]}`;

        if (he9Flags[1] && states[2] === "RED") {
            return { 
                trend: "HOT", 
                color: "red", 
                quadrant: "HYSTERESIS_RED_STRONG", 
                heJiu: true, 
                strategy: "He9_Hysteresis_Strong_Red" 
            };
        }

        // --- 逻辑 A：合九/无效 强制刹车 ---
        if (states.includes("NEUTRAL") || states.includes("VOID")) {
            this.baguaTrendState.invalidBuffer = (this.baguaTrendState.invalidBuffer || 0) + 1;
            const observe = this.baguaTrendState.invalidBuffer >= 3;
            return { 
                trend: "NEUTRAL", 
                color: "green", 
                quadrant: observe ? "CHAOS_OBSERVE" : "INTERRUPTED", 
                heJiu: true, 
                strategy: observe ? "Observe_Chaos_Window" : "He_9_Interruption",
                observe
            };
        } else {
            this.baguaTrendState.invalidBuffer = 0;
        }

        // --- 逻辑 B：象限共振 (加速逻辑) ---
        if (states.every(s => s === "BLUE")) {
            return { 
                trend: "COOL", 
                color: "blue", 
                quadrant: "RESONANCE_BLUE", 
                heJiu: false, 
                strategy: "Resonance_Blue_Boost" 
            };
        }
        if (states.every(s => s === "RED")) {
            return { 
                trend: "HOT", 
                color: "red", 
                quadrant: "RESONANCE_RED", 
                heJiu: false, 
                strategy: "Resonance_Red_Boost" 
            };
        }

        // --- 逻辑 C：顺势转折 (趋势预判) ---
        const blueCount = states.filter(s => s === "BLUE").length;
        const redCount = states.filter(s => s === "RED").length;

        if (blueCount > redCount) {
             return { 
                trend: "COOL", 
                color: "blue", 
                quadrant: "TREND_BLUE", 
                heJiu: false, 
                strategy: "Trend_Blue_Transition" 
            };
        } else if (redCount > blueCount) {
             return { 
                trend: "HOT", 
                color: "red", 
                quadrant: "TREND_RED", 
                heJiu: false, 
                strategy: "Trend_Red_Transition" 
            };
        } else {
             return { 
                trend: "NEUTRAL", 
                color: "green", 
                quadrant: "BALANCED", 
                heJiu: false, 
                strategy: "Trend_Balanced" 
            };
        }
    }

    _generatePredictionFromWeights() {
        // Yang (1,2,3,4) -> Player; Yin (5,6,7,8) -> Banker
        let pScore = 0;
        let bScore = 0;
        
        for (let i = 1; i <= 4; i++) pScore += this.dynamicWeights[i];
        for (let i = 5; i <= 8; i++) bScore += this.dynamicWeights[i];

        const total = pScore + bScore;
        const suggestion = pScore > bScore ? "Player" : "Banker";
        const diff = Math.abs(pScore - bScore);
        const confidence = total > 0 ? 0.5 + (diff / total) * 0.4 : 0.5;

        return {
            next_prediction: suggestion,
            confidence: parseFloat(confidence.toFixed(2)),
            strategy: "Phase3_Dynamics",
            risk_level: "Medium"
        };
    }

    getActivePatterns() {
        const p = [...this.guidingPrinciples];
        if(this.patternState.A) p.push("A(1:3:2)");
        if(this.patternState.B) p.push("B(2:3:1)");
        if(this.patternState.crownEventActive) p.push("👑Crown(P7/B6)");
        return p;
    }

    getTopWeights(n) {
        return Object.entries(this.dynamicWeights)
            .sort((a,b) => b[1] - a[1])
            .slice(0, n)
            .reduce((obj, [k,v]) => ({...obj, [k]: parseFloat(v.toFixed(2))}), {});
    }
}

class LogicAuditor {
    constructor() {
        this.stats = { total: 0, correct: 0, resonance_hits: 0, he9_cancellations: 0, transition_hits: 0, cycle_resets: 0 };
        this.history_log = [];
    }
    logStep(type, predicted, actual, rawCodes) {
        this.stats.total++;
        const isCorrect = (predicted === actual);
        if (isCorrect) this.stats.correct++;
        if (type === 'RESONANCE') this.stats.resonance_hits += isCorrect ? 1 : 0;
        if (type === 'HE9') this.stats.he9_cancellations++;
        if (type === 'TRANSITION') this.stats.transition_hits += isCorrect ? 1 : 0;
        if (type === 'FORCE_64') this.stats.cycle_resets++;
        const entry = { timestamp: new Date().toLocaleTimeString(), type, predicted, actual, isCorrect, raw_codes: rawCodes };
        this.history_log.push(entry);
        if (typeof window !== 'undefined' && window.CloudSync && typeof window.CloudSync.sendAudit === 'function') {
            try {
                window.CloudSync.sendAudit(entry, this.stats);
            } catch (e) {}
        }
        if (this.stats.total % 10 === 0) this.printReport();
    }
    printReport() {
        const accuracy = ((this.stats.correct / this.stats.total) * 100).toFixed(2);
        console.log(`\n--- 📊 八卦逻辑审计报告 (Current Accuracy: ${accuracy}%) ---\n总样本量: ${this.stats.total} | 命中总数: ${this.stats.correct}\n🌊 共振(Resonance)命中率: ${((this.stats.resonance_hits / this.stats.total) * 100).toFixed(2)}%\n⚖️ 合九(He-9)拦截次数: ${this.stats.he9_cancellations}\n🔄 64卦归零次数: ${this.stats.cycle_resets}\n--------------------------------------------------\n`);
    }
}

if (typeof window !== 'undefined' && !window.baguaAuditor) {
    window.baguaAuditor = new LogicAuditor();
}
if (typeof window !== 'undefined' && !window.exportBaguaHistory) {
    window.exportBaguaHistory = function() {
        const history = window.baguaAuditor && window.baguaAuditor.history_log ? window.baguaAuditor.history_log : [];
        if (!history.length) { alert('当前尚无历史数据可导出'); return; }
        let csvContent = "\uFEFF";
        csvContent += "时间,逻辑类型,预测颜色,实际开出,是否命中,八卦编码,周期位置\n";
        history.forEach((row, index) => {
            const cyclePos = (index % 64) + 1;
            const line = [
                row.timestamp,
                row.type,
                row.predicted,
                row.actual,
                row.isCorrect ? '命中' : '未命中',
                row.raw_codes || 'N/A',
                `第${cyclePos}手`
            ].join(',');
            csvContent += line + "\n";
        });
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        const dateStr = new Date().toISOString().slice(0, 10);
        link.setAttribute('href', url);
        link.setAttribute('download', `Bagua_Audit_Report_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };
}
// 全局插件实例
window.DynamicsPlugin = new DynamicsEngine();
