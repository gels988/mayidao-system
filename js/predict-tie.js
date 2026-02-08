// ========== 平牌（Tie）预测逻辑 ==========
// 文件: predict-tie.js

// 扩展HighOddsPredictor类
if (typeof HighOddsPredictor !== 'undefined') {
    Object.assign(HighOddsPredictor.prototype, {
        
        predictTie(history) {
            const last6 = history.slice(-6);
            let score = 0;
            const reasons = [];
            
            if (this.checkIdenticalUpDown(last6)) {
                score += 0.90;
                reasons.push('上下牌点78/23相同');
            }
            
            if (this.checkRemainderPairs(last6)) {
                score += 0.85;
                reasons.push('余数可组2组相同');
            }
            
            if (this.checkDiff1WithStructure(last6)) {
                score += 0.80;
                reasons.push('差1+60/90/34结构');
            }
            
            if (this.checkZeroTriangle(last6)) {
                score += 0.78;
                reasons.push('零三角夹2/3/4/9');
            }
            
            if (this.checkSmallDiffSmallNum(last6)) {
                score += 0.75;
                reasons.push('竖差<4+小数平');
            }
            
            if (this.checkDiagonal55(last6)) {
                score += 0.72;
                reasons.push('对角合55+闲庄合10');
            }
            
            if (this.check9FollowedBy78(last6)) {
                score += 0.70;
                reasons.push('9/后接7/8/');
            }
            
            if (this.checkPureOddEven(last6)) {
                score += 0.68;
                reasons.push('纯单或纯双');
            }
            
            if (this.checkSumEqualOrZero(last6)) {
                score += 0.65;
                reasons.push('分子分母和相等/归零');
            }
            
            const confidence = Math.min(0.95, score / 9);
            
            return {
                event: 'tie',
                confidence: confidence,
                reasons: reasons,
                chinese: '平牌'
            };
        },
        
        checkIdenticalUpDown(history) {
            if (history.length < 2) return false;
            
            const last2 = history.slice(-2);
            const first = last2[0];
            const second = last2[1];
            
            const pattern1 = (first.mol.join('') === '78' && second.mol.join('') === '23');
            const pattern2 = (first.den.join('') === '78' && second.den.join('') === '23');
            
            return pattern1 || pattern2;
        },
        
        checkRemainderPairs(history) {
            if (history.length < 2) return false;
            
            const last = history[history.length - 1];
            const sum = last.molSum + last.denSum;
            const remainder = 40 - sum;
            
            return remainder % 2 === 0 && remainder >= 4 && remainder <= 18;
        },
        
        checkDiff1WithStructure(history) {
            if (history.length < 2) return false;
            
            const last = history[history.length - 1];
            const diff = Math.abs(last.molSum - last.denSum);
            
            if (diff !== 1) return false;
            
            const nums = [...last.mol, ...last.den].join('');
            const structures = ['60', '90', '34'];
            
            return structures.some(s => nums.includes(s));
        },
        
        checkZeroTriangle(history) {
            if (history.length < 3) return false;
            
            const last3 = history.slice(-3);
            const nums = last3.map(r => [...r.mol, ...r.den]).flat();
            
            if (!this.hasTriangleStructure(nums)) return false;
            
            const targets = [2, 3, 4, 9];
            return targets.some(t => nums.includes(t));
        },
        
        checkSmallDiffSmallNum(history) {
            if (history.length < 2) return false;
            
            const last2 = history.slice(-2);
            const diffs = last2.map(r => Math.abs(r.molSum - r.denSum));
            
            if (diffs.some(d => d >= 4)) return false;
            
            const allSmall = last2.every(r => {
                const allNums = [...r.mol, ...r.den];
                return allNums.every(n => n <= 5);
            });
            
            return allSmall;
        },

        // 补全缺失的辅助函数
        checkDiagonal55(history) {
            if (history.length < 2) return false;
            const last2 = history.slice(-2);
            const nums = last2.map(r => [...r.mol, ...r.den]).flat();
            const pairs = [ [nums[0], nums[3]], [nums[1], nums[2]] ]; 
            const diagonal55 = pairs.every(p => p[0] + p[1] === 5); 
            const last = last2[1]; 
            const bankerPlayerSum10 = (last.molSum + last.denSum) % 10 === 0; 
            return diagonal55 && bankerPlayerSum10;
        },

        check9FollowedBy78(history) {
            if (history.length < 3) return false; 
            const last3 = history.slice(-3); 
            for (let i = 0; i < last3.length - 1; i++) { 
                const current = last3[i]; 
                const next = last3[i + 1]; 
                const currentHas9 = [...current.mol, ...current.den].includes(9); 
                const nextHas78 = [...next.mol, ...next.den].some(n => n === 7 || n === 8); 
                if (currentHas9 && nextHas78) return true; 
            } 
            return false;
        },

        checkPureOddEven(history) {
            if (history.length < 2) return false; 
            const last2 = history.slice(-2); 
            const allNums = last2.map(r => [...r.mol, ...r.den]).flat(); 
            const allOdd = allNums.every(n => n % 2 === 1); 
            const allEven = allNums.every(n => n % 2 === 0); 
            return allOdd || allEven;
        },

        checkSumEqualOrZero(history) {
            if (history.length < 2) return false; 
            const last2 = history.slice(-2); 
            const sumsEqual = last2.every(r => r.molSum === r.denSum); 
            const sumsToZero = last2.every(r => (r.molSum + r.denSum) % 10 === 0); 
            return sumsEqual || sumsToZero;
        }
    });
    console.log('✅ 平牌预测逻辑加载完成');
} else {
    console.error('❌ HighOddsPredictor未定义，无法加载平牌预测逻辑');
}
