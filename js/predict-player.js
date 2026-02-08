// ========== 闲8/闲7预测逻辑 ==========
// 文件: predict-player.js

// 扩展HighOddsPredictor类
if (typeof HighOddsPredictor !== 'undefined') {
    Object.assign(HighOddsPredictor.prototype, {
        
        predictPlayer8(history) {
            const last6 = history.slice(-6);
            let score = 0;
            const reasons = [];
            
            if (this.checkChaseAfterFirst8(last6)) {
                score += 0.90;
                reasons.push('追2局闲8');
            }
            
            if (this.checkSmallGeneNo98(last6)) {
                score += 0.85;
                reasons.push('小基因+0/1/2+无98');
            }
            
            if (this.check000or756NoSmall(last6)) {
                score += 0.80;
                reasons.push('000/756横排+无小');
            }
            
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
        },
        
        checkChaseAfterFirst8(history) {
            if (history.length < 3) return false;
            
            const last3 = history.slice(-3);
            
            let last8Index = -1;
            for (let i = last3.length - 1; i >= 0; i--) {
                // 需要确保 history 中的对象有 playerPoints 属性
                if (last3[i].playerPoints === 8) {
                    last8Index = i;
                    break;
                }
            }
            
            if (last8Index === -1) return false;
            
            return (last3.length - 1 - last8Index) <= 2;
        },
        
        checkSmallGeneNo98(history) {
            if (history.length < 2) return false;
            
            const last2 = history.slice(-2);
            const nums = last2.map(r => [...r.mol, ...r.den]).flat();
            
            const smallCount = nums.filter(n => n <= 5).length;
            const smallRatio = smallCount / nums.length;
            
            if (smallRatio < 0.7) return false;
            
            const has012 = nums.some(n => n === 0 || n === 1 || n === 2);
            const has98 = nums.includes(9) || nums.includes(8);
            
            return has012 && !has98;
        },
        
        check000or756NoSmall(history) {
            if (history.length < 2) return false;
            
            const last2 = history.slice(-2);
            const nums = last2.map(r => [...r.mol, ...r.den]).flat();
            
            const has000 = nums.filter(n => n === 0).length >= 3;
            const has756 = nums.includes(7) && nums.includes(5) && nums.includes(6);
            
            if (!has000 && !has756) return false;
            
            // 假设 "无小" 意味着除了 0,7,5,6 之外没有其他小数 (0,1,2,3)
            // 代码逻辑：check if has 0,1,2,3
            // 但 0 已经在 000 中允许了。
            // 原始代码：const hasSmall = nums.some(n => n <= 3); return !hasSmall;
            // 这会与 has000 冲突（0 <= 3）。
            // 修正逻辑：如果满足000，那么肯定有0。
            // 也许 "无小" 指的是 1, 2, 3？
            // 按照原始代码逻辑：if (hasSmall) return false; 
            // 那么 has000 永远返回 false 因为包含0。
            // 除非 "0" 不算在 "小" 里，或者 "无小" 仅针对非0的小数。
            // 鉴于这是用户代码，我将保留用户意图，但做一点修正以防逻辑自相矛盾。
            // 如果 has000 为真，nums里有0，n<=3 为真，!hasSmall 为假。
            // 可能用户的意思是：除了构成特征的数字外，没有其他小数字。
            // 这里我按 "没有 1, 2, 3" 来实现，因为 0 是特征的一部分。
            
            const hasSmall = nums.some(n => n >= 1 && n <= 3);
            
            return !hasSmall;
        },
        
        checkSixCardsManySmall(history) {
            if (history.length < 1) return false;
            
            const last = history[history.length - 1];
            // 确保 mol 和 den 存在
            if (!last.mol || !last.den) return false;

            const nums = [...last.mol, ...last.den];
            
            // 6张牌意味着 mol 3张, den 3张
            if (nums.length !== 6) return false;
            
            const smallCount = nums.filter(n => n <= 5).length;
            
            if (smallCount < 4) return false;
            
            return nums.includes(6) || nums.includes(7);
        },
        
        predictPlayer7(history) {
            const last6 = history.slice(-6);
            let score = 0;
            const reasons = [];
            
            if (this.check01GT4With99(last6)) {
                score += 0.82;
                reasons.push('0/1/>4 + 9/9');
            }
            
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
        },
        
        check01GT4With99(history) {
            if (history.length < 2) return false;
            
            const last2 = history.slice(-2);
            const nums = last2.map(r => [...r.mol, ...r.den]).flat();
            
            // 检查是否有 0 或 1，或者大于 4 的数
            // 原始代码：const has01GT4 = nums.some(n => n === 0 || n === 1 || n > 4);
            const has01GT4 = nums.some(n => n === 0 || n === 1 || n > 4);
            
            // 检查是否有两个 9
            const nineCount = nums.filter(n => n === 9).length;
            
            return has01GT4 && nineCount >= 2;
        },

        // 补全缺失的辅助函数
        checkRepeatAfter7or6(history) {
            if (history.length < 3) return false; 
            const last3 = history.slice(-3); 
            let found7or6 = false; 
            for (let i = 0; i < last3.length - 1; i++) { 
                const record = last3[i]; 
                if (record.playerPoints === 7 || record.bankerPoints === 6) { 
                    found7or6 = true; 
                    break; 
                } 
            } 
            if (!found7or6) return false; 
            // 检查最后一局是否是闲7 (Player 7)
            // 逻辑上：如果之前出现过闲7或庄6，且当前是闲7，则认为符合重复模式？
            // 或者是：之前是7/6，现在又来一个？
            // 用户描述：闲7/庄6后重复。
            // 假设：如果上一局是闲7或庄6，这一局是闲7。
            
            const prev = last3[last3.length - 2];
            const curr = last3[last3.length - 1];
            
            if (prev.playerPoints === 7 || prev.bankerPoints === 6) {
                return curr.playerPoints === 7;
            }
            return false;
        }
    });
    console.log('✅ 闲8/闲7预测逻辑加载完成');
} else {
    console.error('❌ HighOddsPredictor未定义，无法加载闲8/闲7预测逻辑');
}
