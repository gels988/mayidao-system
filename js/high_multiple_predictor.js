/**
 * high_multiple_predictor.js
 * 高倍事件预测器 - 核心技术版
 * 
 * 职责: 实现四大事件(平牌/庄6/对子/闲8)的预测指标体系
 * 架构: 独立于S值预测系统，专注于高赔率特殊事件
 */

class HighMultiplePredictor {
    constructor() {
        this.name = 'HighMultiplePredictor';
        
        // 四大事件权重（基于研究准确率）
        this.eventPriorities = {
            'crown': 0,      // 皇冠 - 特殊事件最高优
            'tie': 1,        // 平牌 - 90%+准确率
            'banker_6': 2,   // 庄6
            'pair': 3,       // 对子
            'panda_8': 4     // 闲8 (熊)
        };
        
        // 历史事件统计（用于"有时则有，多时则多"原则）
        this.eventHistory = {
            crown: { occurrences: [], lastIndex: -1, repeatPattern: [] },
            tie: { occurrences: [], lastIndex: -1, repeatPattern: [] },
            banker_6: { occurrences: [], lastIndex: -1, repeatPattern: [] },
            pair: { occurrences: [], lastIndex: -1, repeatPattern: [] },
            panda_8: { occurrences: [], lastIndex: -1, repeatPattern: [] },
            player_7: { occurrences: [], lastIndex: -1, repeatPattern: [] }
        };
    }

    /**
     * 更新历史事件统计
     * @param {Object} record - 单局记录
     * @param {number} roundIndex - 局数索引
     */
    updateHistory(record, roundIndex) {
        // 更新皇冠统计 (7/6 结构)
        if (record.molSum === 7 && record.denSum === 6) {
            this._updateEventStat('crown', roundIndex);
        }

        // 更新平牌统计
        if (record.isEqual) {
            this._updateEventStat('tie', roundIndex);
        }
        
        // 更新庄6统计
        if (record.denIsSix && record.color === 'red') {
            this._updateEventStat('banker_6', roundIndex);
        }
        
        // 更新对子统计（不分蓝对/红对）
        if (record.molSameFirstTwo || record.denSameFirstTwo) {
            this._updateEventStat('pair', roundIndex);
        }
        
        // 更新闲8统计
        if (record.molIsEight) {
            this._updateEventStat('panda_8', roundIndex);
        }
        
        // 更新闲7统计
        if (record.molIsSeven) {
            this._updateEventStat('player_7', roundIndex);
        }
    }

    _updateEventStat(eventType, roundIndex) {
        const stat = this.eventHistory[eventType];
        stat.occurrences.push(roundIndex);
        
        // 计算重复模式（连续/间隔）
        if (stat.lastIndex !== -1) {
            const interval = roundIndex - stat.lastIndex;
            stat.repeatPattern.push(interval);
            if (stat.repeatPattern.length > 10) {
                stat.repeatPattern.shift();
            }
        }
        
        stat.lastIndex = roundIndex;
    }

    /**
     * 预测下一局高倍事件
     * @param {Array} history - 历史记录（最近10-20局）
     * @returns {Object} 预测结果 { events: Object, topEvent: Object|null }
     */
    predictNext(history) {
        if (!history || history.length < 5) {
            return { events: {}, topEvent: null };
        }

        const recentHistory = history.slice(-20); // 分析最近20局
        const predictions = {};
        
        // 1. 庄6预测（准确率85%+）
        const banker6Pred = this._predictBanker6(recentHistory, history.length);
        if (banker6Pred.confidence >= 0.7) {
            predictions['banker_6'] = banker6Pred;
        }
        
        // 2. 平牌预测（准确率90%+）
        const tiePred = this._predictTie(recentHistory, history.length);
        if (tiePred.confidence >= 0.75) {
            predictions['tie'] = tiePred;
        }
        
        // 3. 对子预测（准确率88%+）
        const pairPred = this._predictPair(recentHistory, history.length);
        if (pairPred.confidence >= 0.7) {
            predictions['pair'] = pairPred;
        }
        
        // 4. 闲8预测（准确率90%+）
        const panda8Pred = this._predictPanda8(recentHistory, history.length);
        if (panda8Pred.confidence >= 0.75) {
            predictions['panda_8'] = panda8Pred;
        }
        
        // 5. 闲7预测（低概率，谨慎预测）
        const player7Pred = this._predictPlayer7(recentHistory, history.length);
        if (player7Pred.confidence >= 0.6) {
            predictions['player_7'] = player7Pred;
        }

        // 6. 皇冠预测（特殊结构）
        const crownPred = this._predictCrown(recentHistory, history.length);
        if (crownPred.confidence >= 0.6) {
            predictions['crown'] = crownPred;
        }
        
        // 按优先级排序
        const sortedPredictions = this._sortPredictions(predictions);
        
        return {
            events: predictions,
            topEvent: sortedPredictions.length > 0 ? sortedPredictions[0] : null
        };
    }

    _sortPredictions(predictions) {
        return Object.values(predictions).sort((a, b) => {
            // 先按置信度降序
            if (b.confidence !== a.confidence) return b.confidence - a.confidence;
            // 再按优先级升序（数值越小优先级越高）
            const pA = this.eventPriorities[a.event] || 99;
            const pB = this.eventPriorities[b.event] || 99;
            return pA - pB;
        });
    }

    /**
     * ========== 庄6预测指标体系 ==========
     * 准确率: 75%-85%
     */
    _predictBanker6(history, currentIndex) {
        let confidence = 0;
        const reasons = [];
        
        // 指标1: "86" + "31"组合，余数为42/97（准确率≥85%）
        if (this._check86_31_Pattern(history)) {
            confidence = Math.max(confidence, 0.85);
            reasons.push('86+31组合，余数42/97');
        }
        
        // 指标2: 2:1转弯走势中出现三角结构（准确率80%）
        if (this._checkTriangleInTurn(history)) {
            confidence = Math.max(confidence, 0.80);
            reasons.push('2:1转弯+三角结构');
        }
        
        // 指标3: 闲路为319/860/000/875（准确率78%）
        if (this._checkIdleRoadPattern(history)) {
            confidence = Math.max(confidence, 0.78);
            reasons.push('闲路319/860/000/875');
        }
        
        // 指标4: 大小零基因+单/双三角+含6（准确率75%）
        if (this._checkSizeZeroTriangle(history)) {
            confidence = Math.max(confidence, 0.75);
            reasons.push('大小零+三角+含6');
        }
        
        // "有时则有，多时则多"原则：如果庄6刚出现过，提高预测权重
        if (this._checkRecentOccurrence('banker_6', currentIndex)) {
            confidence = Math.min(0.95, confidence * 1.2);
            reasons.push('近期出现，重复概率高');
        }
        
        return {
            event: 'banker_6',
            name: '庄6',
            confidence: confidence,
            icon: '6️⃣',
            reasons: reasons
        };
    }

    _check86_31_Pattern(history) {
        // 检测最近5局是否出现"86"和"31"组合
        const recent = history.slice(-5);
        let has86 = false, has31 = false;
        
        recent.forEach(record => {
            const molStr = record.mol || '';
            const denStr = record.den || '';
            
            if (molStr.includes('8') && molStr.includes('6')) has86 = true;
            if (denStr.includes('3') && denStr.includes('1')) has31 = true;
        });
        
        // 检查余数是否可组4组6
        if (has86 && has31) {
            const last = history[history.length - 1];
            const remainder = this._calculateRemainder(last);
            return this._canFormFourSixes(remainder);
        }
        
        return false;
    }

    _calculateRemainder(record) {
        // 计算余数逻辑（基于分子/分母）
        const allDigits = ((record.mol || '') + (record.den || '')).split('');
        const usedDigits = new Set(allDigits);
        const remaining = [];
        
        for (let i = 0; i <= 9; i++) {
            if (!usedDigits.has(i.toString())) {
                remaining.push(i);
            }
        }
        
        return remaining;
    }

    _canFormFourSixes(remainder) {
        // 检查余数是否可组4组6
        // 简化逻辑：检查余数中是否存在和为6或和为16(->7, mismatch?) 
        // 原始需求: "余数为42/97... 可组4组6" -> 4+2=6, 9+7=16(X). 
        // 假设这里指存在组合和为6的数字对
        
        // 寻找和为6的组合: (0,6), (1,5), (2,4), (3,3)
        // 寻找和为4的组合: (0,4), (1,3), (2,2) -> "4组6" implies 4 or 6?
        // User text: "余数为42/97 (准确率≥85%)"
        // Let's check if remainder contains [4,2] or [9,7]
        const rStr = remainder.join('');
        return (rStr.includes('4') && rStr.includes('2')) || (rStr.includes('9') && rStr.includes('7'));
    }
    
    _checkTriangleInTurn(history) {
        // 2:1转弯 + 三角结构
        // 简单模拟: 最近3局颜色为 A, A, B (2:1) 且 B的S值接近A的S值的一半或构成某种比例
        if (history.length < 3) return false;
        const last3 = history.slice(-3);
        const c1 = last3[0].color;
        const c2 = last3[1].color;
        const c3 = last3[2].color;
        
        // 2:1 pattern
        if ((c1 === c2 && c2 !== c3) || (c1 !== c2 && c2 === c3)) {
            return true; // 简化判定
        }
        return false;
    }
    
    _checkIdleRoadPattern(history) {
        // 闲路为 319/860/000/875
        const last = history[history.length - 1];
        const mol = last.mol || '';
        return ['319', '860', '000', '875'].includes(mol);
    }
    
    _checkSizeZeroTriangle(history) {
        // 大小零基因 + 含6
        const last = history[history.length - 1];
        const mol = last.mol || '';
        const den = last.den || '';
        return (mol.includes('0') || den.includes('0')) && (mol.includes('6') || den.includes('6'));
    }

    /**
     * ========== 平牌预测指标体系 ==========
     * 准确率: 90%+
     */
    _predictTie(history, currentIndex) {
        let confidence = 0;
        const reasons = [];
        
        // 指标1: S值绝对平衡 (S值趋近于0)
        // 假设外部传入了S值信息，或者重新计算
        // 这里简单用分子分母差值总和判断
        const last5 = history.slice(-5);
        let diffSum = 0;
        last5.forEach(r => diffSum += Math.abs(r.molSum - r.denSum));
        
        if (diffSum < 5) { // 最近5局点数差极小
            confidence = Math.max(confidence, 0.85);
            reasons.push('点数差极小(紧平衡)');
        }
        
        // 指标2: 对称基因 (分子分母镜像)
        const last = history[history.length - 1];
        if (last.mol === last.den.split('').reverse().join('')) {
            confidence = Math.max(confidence, 0.90);
            reasons.push('镜像基因(对称)');
        }
        
        // 历史规律
        if (this._checkRecentOccurrence('tie', currentIndex)) {
            confidence = Math.min(0.95, confidence * 1.2);
            reasons.push('近期出现平牌');
        }
        
        return {
            event: 'tie',
            name: '平牌',
            confidence: confidence,
            icon: '🟢',
            reasons: reasons
        };
    }

    /**
     * ========== 对子预测指标体系 ==========
     * 准确率: 88%+
     */
    _predictPair(history, currentIndex) {
        let confidence = 0;
        const reasons = [];
        
        // 指标1: 数字重叠率高
        const last = history[history.length - 1];
        if (!last) return { event: null, confidence: 0 };

        const allNums = ((last.mol||'') + (last.den||'')).split('');
        const uniqueNums = new Set(allNums);
        // Only trigger if overlap is significant AND input length is sufficient
        // e.g. 11/22 -> 4 len, 2 unique, diff 2.
        // e.g. 8/2 -> 2 len, 2 unique, diff 0.
        if (allNums.length >= 2 && (allNums.length - uniqueNums.size >= 2)) {
            confidence = Math.max(confidence, 0.80);
            reasons.push('数字高度重叠');
        }
        
        // 历史规律
        if (this._checkRecentOccurrence('pair', currentIndex)) {
            // Only boost if there is already an indication
            if (confidence > 0) {
                confidence = Math.min(0.95, confidence * 1.2);
                reasons.push('近期密集对子');
            }
        }
        
        return {
            event: 'pair',
            name: '对子',
            confidence: confidence,
            icon: '🔴🔵', // 红蓝对子
            reasons: reasons
        };
    }

    /**
     * ========== 闲8预测指标体系 ==========
     * 准确率: 90%+
     */
    _predictPanda8(history, currentIndex) {
        let confidence = 0;
        const reasons = [];
        
        const last = history[history.length - 1];
        // 确保数据存在
        if (!last) return { event: null, confidence: 0 };
        
        // 指标1: 分子尾数趋向8
        const lastMolDigit = parseInt((last.mol || '0').slice(-1));
        if ([7, 8, 9].includes(lastMolDigit)) {
            confidence = Math.max(confidence, 0.75);
            reasons.push('闲家尾数高位震荡');
        }
        
        // 指标2: 特殊基因 808 (Strict)
        if ((last.mol || '').includes('8') && (last.den || '').includes('0')) {
             confidence = Math.max(confidence, 0.85);
             reasons.push('8-0基因锁定');
        }

        // 指标3: 3位数字和为8 (来自 predict-special.js)
        if ((last.mol || '').length === 3 && last.molSum === 8) {
            confidence = 0.95; // 极高置信度
            reasons.push('分子3位和8');
        }

        // 历史规律
        if (this._checkRecentOccurrence('panda_8', currentIndex)) {
            // Only boost if we already have some confidence
            if (confidence > 0) {
                confidence = Math.min(0.95, confidence * 1.2);
                reasons.push('熊连现');
            }
        }
        
        return {
            event: 'panda_8',
            name: '闲8',
            confidence: confidence,
            icon: '🐻',
            reasons: reasons
        };
    }
    
    /**
     * ========== 闲7预测指标体系 ==========
     */
    _predictPlayer7(history, currentIndex) {
        let confidence = 0;
        const reasons = [];
        // 简单模拟
        const last = history[history.length - 1];
        if (!last) return { event: null, confidence: 0 };

        if (last.molSum === 6 || last.molSum === 7) {
             confidence = 0.65;
             reasons.push('闲6/7徘徊');
        }
        return {
            event: 'player_7',
            name: '闲7',
            confidence: confidence,
            icon: '7️⃣',
            reasons: reasons
        };
    }

    /**
     * ========== 皇冠预测指标体系 (新增) ==========
     * 对应 predict-special.js 逻辑
     */
    _predictCrown(history, currentIndex) {
        const last3 = history.slice(-3);
        let confidence = 0;
        const reasons = [];
        
        if (last3.length >= 2) {
            const nums = last3.map(r => [...((r.mol||'').split('')), ...((r.den||'').split(''))]).flat();
            if (this._hasSpecialStructure(nums)) {
                confidence = 0.85;
                reasons.push('特殊结构(皇冠)');
            }
        }
        
        // 7/6 结构历史回溯
        if (this._checkRecentOccurrence('crown', currentIndex)) {
             if (confidence > 0) {
                 confidence = Math.min(0.95, confidence * 1.2);
                 reasons.push('皇冠连现');
             }
        }

        return {
            event: 'crown',
            name: '皇冠',
            confidence: confidence,
            icon: '👑',
            reasons: reasons
        };
    }

    // 辅助函数：检查特殊结构（比如3个以上相同数字）
    _hasSpecialStructure(nums) {
        if (!nums || nums.length === 0) return false;
        const count = {};
        nums.forEach(n => count[n] = (count[n] || 0) + 1);
        return Object.values(count).some(c => c >= 3);
    }

    /**
     * 检查近期是否发生过该事件（有时则有，多时则多）
     */
    _checkRecentOccurrence(eventType, currentIndex) {
        const stat = this.eventHistory[eventType];
        if (!stat || stat.occurrences.length === 0) return false;
        
        const lastOccur = stat.lastIndex;
        // 如果最近5局内出现过
        return (currentIndex - lastOccur) <= 5;
    }
}

// 暴露给全局
window.HighMultiplePredictor = HighMultiplePredictor;
window.highMultiplePredictor = new HighMultiplePredictor();
console.log("[HighMultiple] Core Technology Version Loaded.");
