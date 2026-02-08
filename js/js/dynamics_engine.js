class BaguaPhaseEngine {
    constructor() {
        this.baguaMap = {
            1: -1.0,
            2: -0.5,
            3: -0.3,
            4: 0.3,
            8: 1.0,
            7: 0.5,
            6: 0.3,
            5: -0.3
        };
        this.phaseHistory = [];
        this.lastDisplacement = 0;
    }

    feed(currentBagua) {
        if (typeof currentBagua !== "number" || !Number.isFinite(currentBagua)) {
            return { displacement: 0, event: null };
        }

        const mapVal = this.baguaMap[currentBagua] ?? 0;

        if (this.phaseHistory.length === 0) {
            this.phaseHistory.push(currentBagua);
            this.lastDisplacement = mapVal;
            return { displacement: mapVal, event: null };
        }

        const lastVal = this.phaseHistory[this.phaseHistory.length - 1];
        let displacement = mapVal;
        let event = null;

        if (currentBagua + lastVal === 9) {
            displacement = 0;
            event = "HE9";
        } else if (currentBagua === lastVal) {
            displacement = mapVal * 1.5;
            event = "REPEAT";
        }

        this.phaseHistory.push(currentBagua);
        this.lastDisplacement = displacement;
        return { displacement, event };
    }
}

class M4CoherenceLayer {
    constructor() {
        this.thresholdStable = 75;
        this.thresholdChaos = 40;
    }

    calculateSci(biases, weights) {
        if (!biases || !weights) return 0;
        const keys = Object.keys(biases);
        if (!keys.length) return 0;
        const weighted = [];
        let absSum = 0;
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const b = typeof biases[k] === "number" ? biases[k] : 0;
            const w = typeof weights[k] === "number" ? weights[k] : 0;
            const v = w * b;
            weighted.push(v);
            absSum += Math.abs(v);
        }
        if (!absSum) return 0;
        let vectorSum = 0;
        for (let i = 0; i < weighted.length; i++) vectorSum += weighted[i];
        const sci = Math.abs(vectorSum) / absSum * 100;
        return parseFloat(sci.toFixed(2));
    }

    getMarketStatus(sci) {
        if (typeof sci !== "number" || !Number.isFinite(sci)) return "CHAOS";
        if (sci >= this.thresholdStable) return "ROCK";
        if (sci >= this.thresholdChaos) return "EVOLVING";
        return "CHAOS";
    }
}

class DynamicsEngine {
    constructor() {
        this.name = "DynamicsEngine_Enhanced_V2";
        // 1. 天然权重属性 (补充意见1: 8,3,5,2 权重依次递减且高于 6,4,7,1)
        this.naturalWeights = {
            8: 1.25, 3: 1.20, 5: 1.15, 2: 1.10,
            6: 1.05, 4: 1.00, 7: 0.95, 1: 0.90
        };
        // 初始化八卦数字(1-8)的动态权重 (融合天然权重)
        this.dynamicWeights = {...this.naturalWeights};
        this.patternState = {
            A: false, // 1:3:2 -> 2,7
            B: false, // 2:3:1 -> 4,5
            lastActiveRound: -1,
            activeRounds: 0,
            crownEventActive: false // 7/6 
        };
        this.geneticState = { 
            special76Counter: 0, 
            entanglementActive: false 
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
        this.phaseEngine = new BaguaPhaseEngine();
        this.coherenceLayer = new M4CoherenceLayer();
    }

    // --- Plugin Interface (Integration Adapter) ---
    init(core) {
        this.core = core;
        console.log("DynamicsEngine Plugin Initialized (Enhanced)");
    }

    onReset() {
        this.dynamicWeights = {...this.naturalWeights};
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
        const seq = this._extractBaguaSequence(history);
        const prevLen = Array.isArray(this._lastBaguaSeq) ? this._lastBaguaSeq.length : 0;
        this._lastHistory = history;
        this._lastBaguaSeq = seq;

        if (this.phaseEngine && Array.isArray(seq) && seq.length > prevLen) {
            const currentBagua = seq[seq.length - 1];
            const phaseInfo = this.phaseEngine.feed(currentBagua);
            if (typeof window !== "undefined" && window.baguaAuditor && window.baguaAuditor.stats) {
                const s = window.baguaAuditor.stats;
                if (typeof s.phase_total !== "number" || !Number.isFinite(s.phase_total)) s.phase_total = 0;
                if (typeof s.phase_he9_cancellations !== "number" || !Number.isFinite(s.phase_he9_cancellations)) s.phase_he9_cancellations = 0;
                if (typeof s.phase_repeat_boosts !== "number" || !Number.isFinite(s.phase_repeat_boosts)) s.phase_repeat_boosts = 0;
                s.phase_total += 1;
                if (phaseInfo && phaseInfo.event === "HE9") s.phase_he9_cancellations += 1;
                if (phaseInfo && phaseInfo.event === "REPEAT") s.phase_repeat_boosts += 1;
            }
        }
        this.updateWeightsAndPatterns(seq, history.length);
        this.applyGlobalSelfAdjustment();
        
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
        const seq = Array.isArray(this._lastBaguaSeq) && this._lastBaguaSeq.length > 0 ? this._lastBaguaSeq : this._extractBaguaSequence(history);
        const trendData = this._computeQuadrantTrend(history, seq);
        
        // 补充意见4: 相似八卦疑难决策 (2 vs 6, 3 vs 7)
        let biasCount = history.slice(-10).filter(r => r.playerVal <= 4).length; // 小数统计
        if (trendData.color === 'green') {
            if (biasCount >= 6) this._boostWeight(2, 1.25); // 利蓝
            if (biasCount <= 4) this._boostWeight(6, 1.25); // 利红
        }

        const sci = this.coherenceLayer.calculateSci(this.dynamicWeights, this.naturalWeights);
        const status = this.coherenceLayer.getMarketStatus(sci);
        trendData.sci = sci;
        trendData.marketStatus = status;

        let prediction = {
            next_prediction: "Balance",
            confidence: 0.5,
            bagua_trend: trendData,
            bias_color: trendData.color === 'green' ? (biasCount >= 6 ? 'blue' : (biasCount <= 4 ? 'red' : null)) : null
        };

        // 确定性输出
        if (trendData.color === 'blue') {
            prediction.next_prediction = "Player";
            prediction.confidence = 0.85;
            prediction.strategy = `Bagua_${trendData.quadrant}`;
        } else if (trendData.color === 'red') {
            prediction.next_prediction = "Banker";
            prediction.confidence = 0.85;
            prediction.strategy = `Bagua_${trendData.quadrant}`;
        }

        // 强补丁：王冠事件
        if (this.patternState.crownEventActive) {
            prediction.next_prediction = "Banker";
            prediction.confidence = 0.88;
            prediction.note = "👑 7/6 王冠遗传";
            prediction.strategy = "Crown_7_6";
            this.patternState.crownEventActive = false;
        } else {
             // Normal Notes
            if (prediction.next_prediction === 'Player') {
                 prediction.note = trendData.quadrant === 'RESONANCE_BLUE' ? "🌊🌊🌊 共振蓝波" : "🌊 蓝波趋势";
            } else if (prediction.next_prediction === 'Banker') {
                 prediction.note = trendData.quadrant === 'RESONANCE_RED' ? "🔥🔥🔥 共振红波" : "🔥 红波趋势";
            } else {
                 prediction.note = status === 'CHAOS' ? "SCI 混沌期" : (trendData.heJiu ? "⚖️ 合九抵消" : "⚖️ 平衡态");
                 if (status === 'CHAOS') prediction.risk_level = "Wait";
            }
        }

        // 5. Add Details for UI
        const tieRisk = this._calculateTieRisk();
        prediction.details = {
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

    // 任务1：动态权重调节 (Enhanced with Follow-More & Entanglement)
    _updateDynamicWeights(seq, roundIdx) {
        const lastNum = seq[seq.length - 1];
        const last2 = seq.slice(-2);

        // 1. 补充意见2: 22=13蓝增权, 77=68红增权
        if (last2.length === 2 && last2[0] === last2[1]) {
            if (last2[0] === 2) [1, 3].forEach(n => this._boostWeight(n, 1.3));
            if (last2[0] === 7) [6, 8].forEach(n => this._boostWeight(n, 1.3));
        }

        // 2. 补充意见3: 模式纠缠识别
        if (this._detectEntanglement(seq)) {
            Object.keys(this.dynamicWeights).forEach(k => {
                this.dynamicWeights[k] *= 1.15;
                this.dynamicWeights[k] = Math.min(this.config.weightMax, this.dynamicWeights[k]);
            });
        }

        // 3. 补充意见5: 平衡后重复 (前4合18)
        if (seq.length >= 4) {
            const sum4 = seq.slice(-4).reduce((a, b) => a + b, 0);
            if (sum4 === 18) {
                if (this.dynamicWeights[lastNum]) {
                    this.dynamicWeights[lastNum] *= 1.4; // 提高重复概率
                }
            }
        }

        // 4. 修改原有衰减逻辑为“跟多”：频繁出现的权重不减反增
        for (let num = 1; num <= 8; num++) {
            if (seq.slice(-6).includes(num)) {
                this.dynamicWeights[num] *= 1.05; // 略微提高，体现遗传性
            } else {
                // 长期未出现的互补数字，累积反弹权重
                if (!seq.slice(-8).includes(num)) {
                    this.dynamicWeights[num] *= this.config.incrementFactor;
                }
            }
            // 限制范围
            this.dynamicWeights[num] = Math.max(this.config.weightMin, Math.min(this.config.weightMax, this.dynamicWeights[num]));
        }
    }

    _detectEntanglement(seq) {
        if (seq.length < 6) return false;
        // Group-based entanglement detection: 6-length sequence split into two groups of 3
        const g1 = seq.slice(-6, -3);
        const g2 = seq.slice(-3);
        
        const isRepeat = (g) => g[0] === g[1] || g[1] === g[2];
        const isInterval = (g) => g[0] === g[2];
        
        // Entanglement defined as one group being a Repeat and the other being an Interval
        return (isRepeat(g1) && isInterval(g2)) || (isInterval(g1) && isRepeat(g2));
    }

    _getDominantBagua(seq) {
        if (!Array.isArray(seq) || seq.length === 0) return new Set();
        const windowSeq = seq.slice(-12);
        const counts = Object.create(null);
        for (let i = 0; i < windowSeq.length; i++) {
            const n = windowSeq[i];
            if (n >= 1 && n <= 8) {
                const k = n | 0;
                counts[k] = (counts[k] || 0) + 1;
            }
        }
        let maxCount = 0;
        for (const k in counts) {
            if (counts[k] > maxCount) maxCount = counts[k];
        }
        const dominant = new Set();
        if (maxCount < 3) return dominant;
        for (const k in counts) {
            if (counts[k] === maxCount) {
                dominant.add(parseInt(k, 10));
            }
        }
        return dominant;
    }

    _applySpecialEventBoost(seq, roundIdx) {
        if (seq.length < 2) return;
        const last = seq[seq.length - 1];
        const secondLast = seq[seq.length - 2];

        const multiplier = this._getPresenceAbsenceMultiplier(seq, this._lastHistory);

        // 重复逻辑：若连续相同数字，提升其所在区间权重
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
            this.dynamicWeights[num] = Math.min(this.config.weightMax, this.dynamicWeights[num] * factor); 
        } 
    } 

    _extractBaguaSequence(history) { 
        const streaks = []; 
        let current = null; 
        history.forEach(r => { 
            if (r.winner === 'Tie') return; 
            if (!current) current = { w: r.winner, c: 1 }; 
            else if (r.winner === current.w) current.c++; 
            else { streaks.push(current); current = { w: r.winner, c: 1 }; } 
        }); 
        if (current) streaks.push(current); 
        const bagua = []; 
        for (let i = 2; i < streaks.length; i += 3) { 
            const map = streaks.slice(i-2, i+1).map(s => s.w === 'Player' ? '1' : '0').join(''); 
            const mapping = {'111':1, '011':2, '101':3, '001':4, '110':5, '010':6, '100':7, '000':8}; 
            if (mapping[map]) bagua.push(mapping[map]); 
        } 
        return bagua; 
    } 

    _computeQuadrantTrend(history, seq) { 
        if (seq.length < 2) return { color: 'green', quadrant: 'INIT' }; 
        const last = seq[seq.length - 1]; 
        if (last >= 1 && last <= 4) return { color: 'blue', quadrant: 'BLUE_ZONE' }; 
        if (last >= 5 && last <= 8) return { color: 'red', quadrant: 'RED_ZONE' }; 
        return { color: 'green', quadrant: 'BALANCE' }; 
    } 

    applyGlobalSelfAdjustment() { 
        if (this.totalPredictions < 10) return; 
        const acc = this.correctPredictions / this.totalPredictions; 
        if (acc > 0.75) this.config.incrementFactor = 1.05; 
        else if (acc < 0.60) this.config.incrementFactor = 1.25; 
    } 

    _detectKeyPatterns(seq, round) { 
        // 模式A (1:3:2) 保持不变 
        const last6 = seq.slice(-6); 
        if (last6.includes(2) && last6.includes(7)) this.patternState.A = true; 
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
        this._analyzeGenetic76(result);

        // 3. Tie Precursors Analysis
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

    // 闲7庄6纠缠补丁
    _analyzeGenetic76(result) {
        // 补充意见2.2: 首次出现 7/6 提高三局内权重
        if (result.playerVal === 7 && result.bankerVal === 6) {
            this.geneticState.special76Counter = 3;
            if (result.winner === "Player") this.patternState.crownEventActive = true;
        }

        // 补充意见：特定洗牌模式 0+1(3) 频发
        const recent3s = this._lastHistory.slice(-6).filter(r => (r.playerVal + r.bankerVal) === 3).length;
        if (recent3s >= 4) {
            this._boostWeight(6, 1.4);
            this._boostWeight(8, 1.4);
        }
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
        // 示例：庄连赢4局后，闲胜率极低
        if (this._isBankerStreak(history, 4)) {
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

    _computeColorBias(seq) {
        if (!Array.isArray(seq) || seq.length < 4) return null;
        const windowSeq = seq.slice(-12);
        let c123 = 0;
        let c678 = 0;
        for (let i = 0; i < windowSeq.length; i++) {
            const n = windowSeq[i];
            if (n === 1 || n === 2 || n === 3) c123++;
            if (n === 6 || n === 7 || n === 8) c678++;
        }
        let he9 = 0;
        let consecutive = 0;
        for (let i = 0; i < windowSeq.length - 1; i++) {
            const x = windowSeq[i];
            const y = windowSeq[i + 1];
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            if (x + y === 9) he9++;
            if (Math.abs(x - y) === 1) consecutive++;
        }
        const len = windowSeq.length || 1;
        const diff = (c123 - c678) / len;
        const pairBase = Math.max(1, windowSeq.length - 1);
        const pairBias = (consecutive / pairBase) - (he9 / pairBase);
        let color = null;
        let strength = 0;
        if (diff > 0) {
            color = 'blue';
            strength = diff + Math.max(0, pairBias);
        } else if (diff < 0) {
            color = 'red';
            strength = -diff + Math.max(0, pairBias);
        }
        strength = Math.max(0, Math.min(1, strength));
        if (!color || strength <= 0) return null;
        return { color, strength };
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

    applyGlobalSelfAdjustment() {
        const acc = this.getAccuracy();
        if (!Number.isFinite(acc)) return;

        const target = 0.75;
        const tolerance = 0.1;
        const step = 0.02;

        if (acc > target + tolerance) {
            this.config.incrementFactor = Math.min(this.config.incrementFactor + step, 1.3);
            this.config.decayFactor = Math.max(this.config.decayFactor - step, 0.6);
        } else if (acc < target - tolerance) {
            this.config.incrementFactor = Math.max(this.config.incrementFactor - step, 1.0);
            this.config.decayFactor = Math.min(this.config.decayFactor + step, 0.95);
        }
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
        const bias = this._computeColorBias(seq);
        let blueScore = blueCount;
        let redScore = redCount;
        if (bias && bias.color === 'blue') {
            blueScore += bias.strength * 3;
        } else if (bias && bias.color === 'red') {
            redScore += bias.strength * 3;
        }

        if (blueScore > redScore) {
             return { 
                trend: "COOL", 
                color: "blue", 
                quadrant: "TREND_BLUE", 
                heJiu: false, 
                strategy: "Trend_Blue_Transition" 
            };
        } else if (redScore > blueScore) {
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

    _getL1Bias() {
        let pScore = 0;
        let bScore = 0;
        for (let i = 1; i <= 4; i++) pScore += this.dynamicWeights[i] || 0;
        for (let i = 5; i <= 8; i++) bScore += this.dynamicWeights[i] || 0;
        return bScore - pScore;
    }

    _getL2Bias(seq) {
        const bias = this._computeColorBias(seq || []);
        if (!bias) return 0;
        if (bias.color === 'red') return bias.strength || 0;
        if (bias.color === 'blue') return -(bias.strength || 0);
        return 0;
    }

    _getL3Bias(history) {
        const hist = Array.isArray(history) ? history.filter(r => r && r.winner && r.winner !== 'Tie') : [];
        if (hist.length < 3) return 0;
        const lookback = hist.slice(-10);
        let changes = 0;
        for (let i = 0; i < lookback.length - 1; i++) {
            if (lookback[i].winner !== lookback[i + 1].winner) changes++;
        }
        const rate = (lookback.length - 1) > 0 ? changes / (lookback.length - 1) : 0;
        const stability = 1 - rate;
        const last = lookback[lookback.length - 1].winner;
        const sign = last === 'Banker' ? 1 : -1;
        return stability * sign;
    }

    _getBaguaBias(seq) {
        const s = Array.isArray(seq) ? seq : [];
        if (s.length < 2) return 0;
        const x = s[s.length - 2];
        const y = s[s.length - 1];
        const state = this._analyzeSingleStep(x, y);
        if (state === 'RED') return 1;
        if (state === 'BLUE') return -1;
        return 0;
    }

    _computeCoherenceIndex(history, seq, trendData) {
        const biases = {
            L1: this._getL1Bias(),
            L2: this._getL2Bias(seq),
            L3: this._getL3Bias(history),
            Bagua: this._getBaguaBias(seq)
        };
        const weights = { L1: 1, L2: 1, L3: 1, Bagua: 1 };
        const sci = this.coherenceLayer ? this.coherenceLayer.calculateSci(biases, weights) : 0;
        const marketStatus = this.coherenceLayer ? this.coherenceLayer.getMarketStatus(sci) : 'CHAOS';
        if (typeof window !== 'undefined' && window.baguaAuditor && window.baguaAuditor.stats) {
            const s = window.baguaAuditor.stats;
            if (typeof s.sci_sum !== 'number' || !Number.isFinite(s.sci_sum)) s.sci_sum = 0;
            if (typeof s.sci_count !== 'number' || !Number.isFinite(s.sci_count)) s.sci_count = 0;
            if (typeof s.sci_rock !== 'number' || !Number.isFinite(s.sci_rock)) s.sci_rock = 0;
            if (typeof s.sci_evolving !== 'number' || !Number.isFinite(s.sci_evolving)) s.sci_evolving = 0;
            if (typeof s.sci_chaos !== 'number' || !Number.isFinite(s.sci_chaos)) s.sci_chaos = 0;
            s.sci_sum += sci;
            s.sci_count += 1;
            s.sci_last = sci;
            if (marketStatus === 'ROCK') s.sci_rock += 1;
            else if (marketStatus === 'EVOLVING') s.sci_evolving += 1;
            else s.sci_chaos += 1;
        }
        return { sci, marketStatus };
    }
}

class LogicAuditor {
    constructor() {
        this.stats = {
            total: 0,
            correct: 0,
            resonance_hits: 0,
            he9_cancellations: 0,
            transition_hits: 0,
            cycle_resets: 0,
            econ_total: 0,
            econ_correct: 0,
            resonance_total: 0,
            transition_total: 0,
            phase_total: 0,
            phase_he9_cancellations: 0,
            phase_repeat_boosts: 0,
            sci_sum: 0,
            sci_count: 0,
            sci_last: 0,
            sci_rock: 0,
            sci_evolving: 0,
            sci_chaos: 0
        };
        this.history_log = [];
    }
    logStep(type, predicted, actual, rawCodes) {
        this.stats.total++;
        const isCorrect = (predicted === actual);
        if (isCorrect) this.stats.correct++;
        if (type === 'RESONANCE') {
            this.stats.resonance_total++;
            this.stats.resonance_hits += isCorrect ? 1 : 0;
        }
        if (type === 'HE9') this.stats.he9_cancellations++;
        if (type === 'TRANSITION') {
            this.stats.transition_total++;
            this.stats.transition_hits += isCorrect ? 1 : 0;
        }
        if (type === 'FORCE_64') this.stats.cycle_resets++;
        if (type === 'ECON') {
            this.stats.econ_total++;
            if (isCorrect) this.stats.econ_correct++;
        }
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
        const sciAvg = this.stats.sci_count > 0 ? (this.stats.sci_sum / this.stats.sci_count).toFixed(2) : '0.00';
        console.log(`\n--- 📊 八卦逻辑审计报告 (Current Accuracy: ${accuracy}%) ---\n总样本量: ${this.stats.total} | 命中总数: ${this.stats.correct}\n🌊 共振(Resonance)命中率: ${((this.stats.resonance_hits / this.stats.total) * 100).toFixed(2)}%\n⚖️ 合九(He-9)拦截次数: ${this.stats.he9_cancellations}\n♻️ 位移合9抵消: ${this.stats.phase_he9_cancellations} / ${this.stats.phase_total}\n🧬 SCI 自洽指数(平均): ${sciAvg}\n🔄 64卦归零次数: ${this.stats.cycle_resets}\n--------------------------------------------------\n`);
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

// Explicit Exports
window.DynamicsEngine = DynamicsEngine;
window.BaguaPhaseEngine = BaguaPhaseEngine;
window.M4CoherenceLayer = M4CoherenceLayer;

// 全局插件实例
window.DynamicsPlugin = new DynamicsEngine();
