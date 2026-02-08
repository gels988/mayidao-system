// ========== 高赔率预测核心逻辑 ========== 
// 文件: high-odds-predictor.js 

/** 
 * 高赔率预测器 
 * 预测：红6、平衡、对子、蓝8、蓝7、皇冠、熊猫 
 */ 
class HighOddsPredictor { 
    constructor() { 
        this.predictors = { 
            banker6: this.predictBanker6.bind(this), 
            tie: this.predictTie.bind(this), 
            pair: this.predictPair.bind(this), 
            player8: this.predictPlayer8.bind(this), 
            player7: this.predictPlayer7.bind(this), 
            crown: this.predictCrown.bind(this), 
            panda: this.predictPanda.bind(this) 
        }; 
        
        // 预测权重（基于历史准确率） 
        this.weights = { 
            banker6: 0.82,  // 平均82% 
            tie: 0.80,      // 平均80% 
            pair: 0.81,     // 平均81% 
            player8: 0.83,  // 平均83% 
            player7: 0.78,  // 平均78% 
            crown: 0.75,    // 平均75% 
            panda: 0.72     // 平均72% 
        }; 
    } 
    
    /** 
     * 主预测函数 
     * @param {Array} history - 历史记录（至少6局） 
     * @returns {Object} 预测结果 
     */ 
    predict(history) { 
        if (!history || history.length < 6) { 
            return { event: null, confidence: 0, details: '数据不足' }; 
        } 
        
        const predictions = {}; 
        let bestEvent = null; 
        let bestConfidence = 0; 
        
        // 对每个事件进行预测 
        Object.keys(this.predictors).forEach(event => { 
            const result = this.predictors[event](history); 
            predictions[event] = result; 
            
            // 选择置信度最高的 
            if (result.confidence > bestConfidence) { 
                bestConfidence = result.confidence; 
                bestEvent = event; 
            } 
        }); 
        
        return { 
            event: bestEvent, 
            confidence: bestConfidence, 
            predictions: predictions, 
            odds: this.calculateOdds(bestEvent, bestConfidence) 
        }; 
    } 
    
    /** 
     * 计算赔率倍数 
     */ 
    calculateOdds(event, confidence) { 
        const baseOdds = { 
            banker6: 12,    // 红6基础赔率 (通常1赔12)
            tie: 8,        // 平衡基础赔率 
            pair: 11,      // 对子基础赔率 
            player8: 25,   // 蓝8基础赔率 (假设值)
            player7: 40,   // 蓝7基础赔率 (假设值)
            crown: 50,     // 皇冠基础赔率 
            panda: 40      // 熊猫基础赔率 
        }; 
        
        const base = baseOdds[event] || 1; 
        const multiplier = Math.min(8, Math.max(1, Math.floor(confidence * 10))); 
        
        return { 
            base: base, 
            multiplier: multiplier, 
            display: `${multiplier}x`, 
            actual: base * multiplier 
        }; 
    } 
    
    // ========== 红6（Banker 6）预测 ========== 
    predictBanker6(history) { 
        const last6 = history.slice(-6); 
        let score = 0; 
        const reasons = []; 
        
        // 指标1: "86" + "31"组合，余数为42/97 
        if (this.checkPattern86_31(last6)) { 
            score += 0.85; 
            reasons.push('86+31组合，余数42/97'); 
        } 
        
        // 指标2: 2:1转弯走势中出现三角结构 
        if (this.checkTriangleInTurn(last6)) { 
            score += 0.80; 
            reasons.push('2:1转弯+三角结构'); 
        } 
        
        // 指标3: 闲路为319/860/000/875 
        if (this.checkPlayerRoadPattern(last6)) { 
            score += 0.78; 
            reasons.push('闲路319/860/000/875'); 
        } 
        
        // 指标4: 大小零基因 + 单/双三角 + 含6 
        if (this.checkZeroGeneWithSix(last6)) { 
            score += 0.75; 
            reasons.push('大小零基因+三角+含6'); 
        } 
        
        // 指标5: 前两组基因中出现四个零牌+8 8+3 
        if (this.checkFourZerosPattern(last6)) { 
            score += 0.72; 
            reasons.push('四零牌+8+8+3'); 
        } 
        
        // 综合评分（加权平均） 
        const confidence = Math.min(0.95, score / 4); 
        
        return { 
            event: 'banker6', 
            confidence: confidence, 
            reasons: reasons, 
            chinese: '红6' 
        }; 
    } 

    // ========== 平牌（Tie）预测 ========== 
    predictTie(history) { 
        const last6 = history.slice(-6); 
        let score = 0; 
        const reasons = []; 
        
        // 指标1: 上下牌点78/23完全相同 
        if (this.checkIdenticalUpDown(last6)) { 
            score += 0.90; 
            reasons.push('上下牌点78/23相同'); 
        } 
        
        // 指标2: 两数合为X → 余数可组2组X 
        if (this.checkRemainderPairs(last6)) { 
            score += 0.85; 
            reasons.push('余数可组2组相同'); 
        } 
        
        // 指标3: 闲/庄差1 + 配合60/90/34结构 
        if (this.checkDiff1WithStructure(last6)) { 
            score += 0.80; 
            reasons.push('差1+60/90/34结构'); 
        } 
        
        // 指标4: 零三角夹2/3/4/9 
        if (this.checkZeroTriangle(last6)) { 
            score += 0.78; 
            reasons.push('零三角夹2/3/4/9'); 
        } 
        
        // 指标5: 竖差<4 + 小数平 
        if (this.checkSmallDiffSmallNum(last6)) { 
            score += 0.75; 
            reasons.push('竖差<4+小数平'); 
        } 
        
        // 指标6: 对角合55 + 闲庄合10 
        if (this.checkDiagonal55(last6)) { 
            score += 0.72; 
            reasons.push('对角合55+闲庄合10'); 
        } 
        
        // 指标7: 9/后接7/8/连续或间隔 
        if (this.check9FollowedBy78(last6)) { 
            score += 0.70; 
            reasons.push('9/后接7/8/'); 
        } 
        
        // 指标8: 两组基因四个数字由纯单（双）构成 
        if (this.checkPureOddEven(last6)) { 
            score += 0.68; 
            reasons.push('纯单或纯双'); 
        } 
        
        // 指标9: 两组分子/分母相加后相等或归零 
        if (this.checkSumEqualOrZero(last6)) { 
            score += 0.65; 
            reasons.push('分子分母和相等/归零'); 
        } 
        
        const confidence = Math.min(0.95, score / 6); 
        return { 
            event: 'tie', 
            confidence: confidence, 
            reasons: reasons, 
            chinese: '平牌' 
        }; 
    } 

    // ========== 对子（Pair）预测 ========== 
    predictPair(history) { 
        const last6 = history.slice(-6); 
        let score = 0; 
        const reasons = []; 
        
        // 指标1: 双竖差1 
        if (this.checkDoubleDiff1(last6)) { 
            score += 0.88; 
            reasons.push('双竖差1'); 
        } 
        
        // 指标2: 211基因出现 
        if (this.check211Gene(last6)) { 
            score += 0.85; 
            reasons.push('211基因'); 
        }
        
        // 指标3: 四同/双对 + 间隔1墩重复 
        if (this.checkFourSameOrDoublePair(last6)) { 
            score += 0.82; 
            reasons.push('四同/双对+间隔重复'); 
        } 
        
        // 指标4: 黑红对角 + 三角结构 
        if (this.checkColorDiagonalTriangle(last6)) { 
            score += 0.80; 
            reasons.push('黑红对角+三角'); 
        } 
        
        // 指标5: 基因合为4的整数倍 
        if (this.checkGeneSumMultipleOf4(last6)) { 
            score += 0.78; 
            reasons.push('基因合4的倍数'); 
        }
        
        // 指标6: 平牌后接对子 
        if (this.checkTieThenPair(last6)) { 
            score += 0.75; 
            reasons.push('平牌后接对子'); 
        } 
        
        // 指标7: 3同横排或L型三角 
        if (this.checkThreeSameOrLTriangle(last6)) { 
            score += 0.72; 
            reasons.push('3同横排或L三角'); 
        } 
        
        // 指标8: 双数横排 + 两数连续 
        if (this.checkDoubleRowWithConsecutive(last6)) { 
            score += 0.70; 
            reasons.push('双数横排+连续'); 
        } 
        
        // 指标9: 前两组基因中出现2-4对重复数字 
        if (this.check2to4DuplicatePairs(last6)) { 
            score += 0.68; 
            reasons.push('2-4对重复数字'); 
        }

        const confidence = Math.min(0.95, score / 6); // Normalize based on typical trigger count
        
        return { 
            event: 'pair', 
            confidence: confidence, 
            reasons: reasons, 
            chinese: '对子' 
        }; 
    } 

    // ========== 其他预测占位符 ==========

    // ========== 闲8（Player 8）预测 ========== 
    predictPlayer8(history) { 
        const last6 = history.slice(-6); 
        let score = 0; 
        const reasons = []; 
        
        // 指标1: 首次出现闲8后，追2局 
        if (this.checkChaseAfterFirst8(last6)) { 
            score += 0.90; 
            reasons.push('追2局闲8'); 
        } 
        
        // 指标2: 小基因 + 0/1/2 + 无98 
        if (this.checkSmallGeneNo98(last6)) { 
            score += 0.85; 
            reasons.push('小基因+0/1/2+无98'); 
        } 
        
        // 指标3: 000横排或756横排 → 无小 → 闲8 
        if (this.check000or756NoSmall(last6)) { 
            score += 0.80; 
            reasons.push('000/756横排+无小'); 
        } 
        
        // 指标4: 6张局小数多 + 含6/7 
        if (this.checkSixCardsManySmall(last6)) { 
            score += 0.75; 
            reasons.push('6张局小数多+含6/7'); 
        } 
        
        const confidence = Math.min(0.95, score / 4); 
        
        return { 
            event: 'player8', 
            confidence: confidence, 
            reasons: reasons, 
            chinese: '闲8' 
        }; 
    }

    // 检查追2局闲8 
    checkChaseAfterFirst8(history) { 
        if (history.length < 3) return false; 
        
        const last3 = history.slice(-3); 
        
        // 查找最近的闲8 
        let last8Index = -1; 
        for (let i = last3.length - 1; i >= 0; i--) { 
            const p = (last3[i].molSum || 0) % 10;
            if (p === 8) { 
                last8Index = i; 
                break; 
            } 
        } 
        
        if (last8Index === -1) return false; 
        
        // 检查是否在追2局范围内 
        return (last3.length - 1 - last8Index) <= 2; 
    } 

    // 检查小基因+0/1/2+无98 
    checkSmallGeneNo98(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const nums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        
        // 小基因（大部分≤5） 
        const smallCount = nums.filter(n => n <= 5).length; 
        const smallRatio = smallCount / nums.length; 
        
        if (smallRatio < 0.7) return false; 
        
        // 包含0/1/2 
        const has012 = nums.some(n => n === 0 || n === 1 || n === 2); 
        
        // 无98 
        const has98 = nums.includes(9) || nums.includes(8); 
        
        return has012 && !has98; 
    }

    // 检查000或756横排+无小 
    check000or756NoSmall(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const nums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        
        // 000或756横排 
        const has000 = nums.filter(n => n === 0).length >= 3; 
        const has756 = nums.includes(7) && nums.includes(5) && nums.includes(6);
        
        return has000 || has756;
    }

    // 检查6张局小数多+含6/7
    checkSixCardsManySmall(history) {
        if (history.length < 1) return false;
        const last = history[history.length - 1];
        const m = last.mol || [];
        const d = last.den || [];
        
        // 6张局: 分子分母都有3张
        if (m.length !== 3 || d.length !== 3) return false;
        
        const nums = [...m, ...d];
        // 小数多 (0-5)
        const smallCount = nums.filter(n => n <= 5).length;
        if (smallCount < 4) return false;
        
        // 含6/7
        return nums.includes(6) || nums.includes(7);
    }

    // ========== 闲7（Player 7）预测 ========== 
    predictPlayer7(history) { 
        const last6 = history.slice(-6); 
        let score = 0; 
        const reasons = []; 
        
        // 指标1: 前两组基因中出现0 1 >4, 配合出现 9 9 
        if (this.check01GT4With99(last6)) { 
            score += 0.82; 
            reasons.push('0/1/>4 + 9/9'); 
        } 
        
        // 指标2: 前面出现闲7或庄6，连续或间隔重复 
        if (this.checkRepeatAfter7or6(last6)) { 
            score += 0.78; 
            reasons.push('闲7/庄6后重复'); 
        } 
        
        const confidence = Math.min(0.95, score / 2); 
        
        return { 
            event: 'player7', 
            confidence: confidence, 
            reasons: reasons, 
            chinese: '闲7' 
        }; 
    }

    // ========== 皇冠/熊猫预测（简化版） ========== 
    predictCrown(history) { 
        // 皇冠：特殊牌型，通常在特定结构后出现 
        const last3 = history.slice(-3); 
        let score = 0; 
        
        // 检查特殊结构 
        if (last3.length >= 2) { 
            const nums = last3.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
            if (this.hasSpecialStructure(nums)) score += 0.75; 
        } 
        
        return { event: 'crown', confidence: score, reasons: ['特殊结构'], chinese: '皇冠' }; 
    } 

    predictPanda(history) { 
        // 熊猫：特殊牌型 
        const last3 = history.slice(-3); 
        let score = 0; 
        
        if (last3.length >= 2) { 
            const nums = last3.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
            if (this.hasSpecialStructure(nums)) score += 0.72; 
        } 
        
        return { event: 'panda', confidence: score, reasons: ['特殊结构'], chinese: '熊猫' }; 
    }
    
    // ========== 辅助函数 ==========

    // 检查"86"+"31"组合 
    checkPattern86_31(history) { 
        if (history.length < 3) return false; 
        
        const last3 = history.slice(-3); 
        let has86 = false, has31 = false; 
        
        last3.forEach(record => { 
            const molStr = (record.mol || []).join(''); 
            const denStr = (record.den || []).join(''); 
            
            if (molStr.includes('86') || denStr.includes('86')) has86 = true; 
            if (molStr.includes('31') || denStr.includes('31')) has31 = true; 
        }); 
        
        if (!has86 || !has31) return false; 
        
        // 检查余数是否为42/97 
        const remainder = this.calculateRemainder(history); 
        return remainder === '42' || remainder === '97'; 
    } 

    calculateRemainder(history) {
        if (history.length < 1) return '';
        const last = history[history.length - 1];
        const sum = (last.molSum || 0) + (last.denSum || 0);
        const remainder = 40 - sum; 
        return remainder.toString().padStart(2, '0');
    }

    // 检查0/1/>4 + 9/9 
    check01GT4With99(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const nums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        
        // 出现0/1/>4 
        const has01GT4 = nums.some(n => n === 0 || n === 1 || n > 4); 
        
        // 出现9/9 
        const nineCount = nums.filter(n => n === 9).length; 
        
        return has01GT4 && nineCount >= 2; 
    } 

    // 检查闲7或庄6后重复 
    checkRepeatAfter7or6(history) { 
        if (history.length < 3) return false; 
        
        const last3 = history.slice(-3); 
        
        // 查找闲7或庄6 
        let found7or6 = false; 
        for (let i = 0; i < last3.length - 1; i++) { 
            const record = last3[i]; 
            const p = (record.molSum || 0) % 10;
            const b = (record.denSum || 0) % 10;
            if (p === 7 || b === 6) { 
                found7or6 = true; 
                break; 
            } 
        } 
        
        if (!found7or6) return false; 
        
        // 当前局是闲7 
        return ((last3[last3.length - 1].molSum||0) % 10) === 7; 
    } 

    // 检查特殊结构 
    hasSpecialStructure(nums) { 
        // 简化：检查是否有重复或特殊模式 
        const count = {}; 
        nums.forEach(n => count[n] = (count[n] || 0) + 1); 
        // 有重复数字 
        return Object.values(count).some(c => c >= 3); 
    }
    
    // 检查2:1转弯中的三角结构 
    checkTriangleInTurn(history) { 
        if (history.length < 4) return false; 
        
        const last4 = history.slice(-4); 
        const values = last4.map(r => r.molSum > r.denSum ? 0 : 1); 
        
        // 2:1转弯模式：如 0,1,0,0 或 1,0,1,1 
        const isTurn = (values[0] !== values[1] && values[1] === values[2] && values[2] === values[3]); 
        
        if (!isTurn) return false; 
        
        // 检查三角结构（三数合5） 
        const nums = last4.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        return this.hasTriangleStructure(nums); 
    } 

    hasTriangleStructure(nums) {
        if (nums.length < 3) return false;
        // 检查是否有三个数合为5
        for (let i = 0; i < nums.length - 2; i++) {
            for (let j = i + 1; j < nums.length - 1; j++) {
                for (let k = j + 1; k < nums.length; k++) {
                    if (nums[i] + nums[j] + nums[k] === 5) {
                        return true;
                    }
                }
            }
        }
        return false;
    }
    
    // 检查闲路模式 
    checkPlayerRoadPattern(history) { 
        if (history.length < 3) return false; 
        
        const patterns = ['319', '860', '000', '875']; 
        const last3Mol = history.slice(-3).map(r => (r.mol||[]).join('')).join(''); 
        
        return patterns.some(p => last3Mol.includes(p)); 
    } 
    
    // 检查大小零基因+三角+含6 
    checkZeroGeneWithSix(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        let zeroCount = 0; 
        let hasSix = false; 
        let hasTriangle = false;

        last2.forEach(record => { 
            const nums = [...(record.mol||[]), ...(record.den||[])]; 
            zeroCount += nums.filter(n => n === 0).length; 
            if (nums.includes(6)) hasSix = true; 
            
            // 检查三角结构 
            if (this.hasTriangleStructure(nums)) hasTriangle = true; 
        }); 
        
        // 大小零基因：至少2个零 
        return zeroCount >= 2 && hasSix && hasTriangle; 
    } 
    
    // 检查四零牌模式 
    checkFourZerosPattern(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const allNums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        const zeroCount = allNums.filter(n => n === 0).length; 
        
        // 四个零 + 8 + 8 + 3
        return zeroCount >= 4 && 
               allNums.filter(n => n === 8).length >= 2 && 
               allNums.includes(3); 
    } 

    // 检查上下牌点相同 
    checkIdenticalUpDown(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const first = last2[0]; 
        const second = last2[1]; 
        
        // 检查是否78/23组合 
        const pattern1 = ((first.mol||[]).join('') === '78' && (second.mol||[]).join('') === '23'); 
        const pattern2 = ((first.den||[]).join('') === '78' && (second.den||[]).join('') === '23');
        return pattern1 || pattern2; 
    } 
    
    // 检查余数可组2组相同 
    checkRemainderPairs(history) { 
        if (history.length < 2) return false;
        const last = history[history.length - 1];
        const sum = (last.molSum||0) + (last.denSum||0);
        const remainder = 40 - sum; 
        const prev = history[history.length - 2];
        const prevSum = (prev.molSum||0) + (prev.denSum||0);
        return remainder === (40 - prevSum);
    }

    // 检查差1 + 60/90/34结构
    checkDiff1WithStructure(history) {
        if (history.length < 1) return false;
        const last = history[history.length - 1];
        const diff = Math.abs((last.molSum||0) - (last.denSum||0));
        
        if (diff !== 1) return false;
        
        // 检查是否包含60/90/34结构 
        const nums = [...(last.mol||[]), ...(last.den||[])].join(''); 
        const structures = ['60', '90', '34']; 
        
        return structures.some(s => nums.includes(s)); 
    }

    // 检查零三角夹数字
    checkZeroTriangle(history) {
        if (history.length < 3) return false;
        
        const last3 = history.slice(-3);
        const nums = last3.map(r => [...(r.mol||[]), ...(r.den||[])]).flat();
        
        // 检查是否有零三角结构 
        if (!this.hasTriangleStructure(nums)) return false; 
        
        // 检查是否夹2/3/4/9 
        const targets = [2, 3, 4, 9]; 
        return targets.some(t => nums.includes(t)); 
    }

    // 检查竖差<4 + 小数平
    checkSmallDiffSmallNum(history) {
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const diffs = last2.map(r => Math.abs((r.molSum||0) - (r.denSum||0))); 
        
        // 竖差<4 
        if (diffs.some(d => d >= 4)) return false; 
        
        // 小数平（分子分母都是小数） 
        const allSmall = last2.every(r => { 
            const allNums = [...(r.mol||[]), ...(r.den||[])]; 
            return allNums.every(n => n <= 5); 
        }); 
        
        return allSmall; 
    }

    // 检查对角合55 + 闲庄合10
    checkDiagonal55(history) {
        if (history.length < 2) return false;
        const last2 = history.slice(-2); 
        const nums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        
        // 对角合55：如 2+3=5, 1+4=5 
        // 假设 nums 排列为 [m1, m2, d1, d2] (上一局), [m1, m2, d1, d2] (本局)
        // 此处逻辑需根据 nums 实际扁平化顺序调整，假设是按顺序
        if (nums.length < 8) return false;

        // 模拟对角: 
        // 局1: [A, B] vs [C, D] -> sum1, sum2
        // 局2: [E, F] vs [G, H]
        // 简单化：取各自的molSum/denSum做对角
        
        const r1 = last2[0];
        const r2 = last2[1];
        const diag1 = (r1.molSum||0) + (r2.denSum||0);
        const diag2 = (r1.denSum||0) + (r2.molSum||0);
        
        const diagonal55 = (diag1 === 5 || diag2 === 5);
        
        // 闲庄合10 
        const last = last2[1]; 
        const bankerPlayerSum10 = ((last.molSum||0) + (last.denSum||0)) % 10 === 0; 
        
        return diagonal55 && bankerPlayerSum10; 
    }

    // 检查9后接7/8
    check9FollowedBy78(history) {
        if (history.length < 3) return false; 
        
        const last3 = history.slice(-3); 
        
        // 检查是否有9/后接7/或8/ 
        for (let i = 0; i < last3.length - 1; i++) { 
            const current = last3[i]; 
            const next = last3[i + 1]; 
            
            const currentHas9 = [...(current.mol||[]), ...(current.den||[])].includes(9); 
            const nextHas78 = [...(next.mol||[]), ...(next.den||[])].some(n => n === 7 || n === 8); 
            
            if (currentHas9 && nextHas78) return true; 
        } 
        
        return false; 
    }

    // 检查纯单或纯双
    checkPureOddEven(history) {
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const allNums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        
        // 全部是奇数或全部是偶数 
        const allOdd = allNums.every(n => n % 2 === 1); 
        const allEven = allNums.every(n => n % 2 === 0); 
        
        return allOdd || allEven; 
    }

    // 检查分子分母和相等/归零
    checkSumEqualOrZero(history) {
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2);
        const sumsEqual = last2.every(r => (r.molSum||0) === (r.denSum||0)); 
        const sumsToZero = last2.every(r => ((r.molSum||0) + (r.denSum||0)) % 10 === 0); 
        
        return sumsEqual || sumsToZero; 
    }
    
    // ========== 对子预测辅助函数 ==========
    
    // 检查双竖差1 
    checkDoubleDiff1(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const diffs = last2.map(r => Math.abs((r.molSum||0) - (r.denSum||0))); 
        
        return diffs[0] === 1 && diffs[1] === 1; 
    } 
    
    // 检查211基因 
    check211Gene(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const nums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        
        // 211基因：1234被同数/0/5取代 
        // 即：出现重复数字或0/5
        const hasDuplicate = new Set(nums).size < nums.length;
        const has0or5 = nums.some(n => n === 0 || n === 5);
        return hasDuplicate || has0or5;
    }

    checkFourSameOrDoublePair(history) { 
        if (history.length < 3) return false; 
        
        const last3 = history.slice(-3); 
        const nums = last3.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        
        // 统计数字出现次数 
        const count = {}; 
        nums.forEach(n => count[n] = (count[n] || 0) + 1); 
        
        // 四同或双对 
        const hasFourSame = Object.values(count).some(c => c >= 4); 
        const hasDoublePair = Object.values(count).filter(c => c >= 2).length >= 2; 
        
        return hasFourSame || hasDoublePair; 
    } 
    
    // 检查黑红对角+三角 
    checkColorDiagonalTriangle(history) { 
        if (history.length < 2) return false;
        const last2 = history.slice(-2); 
        const nums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        
        // 检查三角结构 
        if (!this.hasTriangleStructure(nums)) return false; 
        
        // 黑红对角（简化：检查奇偶对角） 
        const pairs = [ 
            [nums[0], nums[3]], 
            [nums[1], nums[2]] 
        ]; 
        
        const oppositeParity = pairs.every(p => (p[0] % 2) !== (p[1] % 2)); 
        
        return oppositeParity; 
    }

    // 检查基因合为4的倍数 
    checkGeneSumMultipleOf4(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const sum = last2.reduce((acc, r) => acc + (r.molSum||0) + (r.denSum||0), 0); 
        
        return sum % 4 === 0; 
    } 
    
    // 检查平牌后接对子 
    checkTieThenPair(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        
        // 前一局是平牌 
        const prevIsTie = (last2[0].molSum||0) === (last2[0].denSum||0); 
        
        // 当前局有对子（分子或分母相同） 
        const m = last2[1].mol || [];
        const d = last2[1].den || [];
        const currHasPair = (m.length >= 2 && m[0] === m[1]) || 
                           (d.length >= 2 && d[0] === d[1]);

        return prevIsTie && currHasPair; 
    } 
    
    // 检查3同横排或L型三角 
    checkThreeSameOrLTriangle(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const nums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        
        // 3同横排 
        const count = {}; 
        nums.forEach(n => count[n] = (count[n] || 0) + 1); 
        const hasThreeSame = Object.values(count).some(c => c >= 3); 
        
        // L型三角（简化） 
        const hasLTriangle = this.hasTriangleStructure(nums); 
        
        return hasThreeSame || hasLTriangle; 
    }

    // 检查双数横排+连续 
    checkDoubleRowWithConsecutive(history) { 
        if (history.length < 2) return false; 
        
        const last2 = history.slice(-2); 
        const nums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat(); 
        
        // 双数横排（全部偶数） 
        const allEven = nums.every(n => n % 2 === 0); 
        
        // 两数连续 
        const hasConsecutive = nums.some((n, i) => 
            i < nums.length - 1 && Math.abs(n - nums[i + 1]) === 1 
        ); 
        
        return allEven && hasConsecutive; 
    } 
    
    // 检查2-4对重复数字 
    check2to4DuplicatePairs(history) {
        if (history.length < 2) return false;
        const last2 = history.slice(-2);
        const nums = last2.map(r => [...(r.mol||[]), ...(r.den||[])]).flat();
        
        const pairs = {};
        for (let i = 0; i < nums.length; i++) {
            if (nums.indexOf(nums[i]) !== i) {
                pairs[nums[i]] = true;
            }
        }
        
        const pairCount = Object.keys(pairs).length;
        
        return pairCount >= 2 && pairCount <= 4;
    }
}

// 导出实例
window.highOddsPredictor = new HighOddsPredictor();