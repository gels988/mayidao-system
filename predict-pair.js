// ========== 对子（Pair）预测逻辑 ==========
// 文件: predict-pair.js

// 扩展HighOddsPredictor类
if (typeof HighOddsPredictor !== 'undefined') {
    Object.assign(HighOddsPredictor.prototype, {
        
        predictPair(history) {
            const last6 = history.slice(-6);
            let score = 0;
            const reasons = [];
            
            if (this.checkDoubleDiff1(last6)) {
                score += 0.88;
                reasons.push('双竖差1');
            }
            
            if (this.check211Gene(last6)) {
                score += 0.85;
                reasons.push('211基因');
            }
            
            if (this.checkFourSameOrDoublePair(last6)) {
                score += 0.82;
                reasons.push('四同/双对+间隔重复');
            }
            
            if (this.checkColorDiagonalTriangle(last6)) {
                score += 0.80;
                reasons.push('黑红对角+三角');
            }
            
            if (this.checkGeneSumMultipleOf4(last6)) {
                score += 0.78;
                reasons.push('基因合4的倍数');
            }
            
            if (this.checkTieThenPair(last6)) {
                score += 0.75;
                reasons.push('平牌后接对子');
            }
            
            if (this.checkThreeSameOrLTriangle(last6)) {
                score += 0.72;
                reasons.push('3同横排或L三角');
            }
            
            if (this.checkDoubleRowWithConsecutive(last6)) {
                score += 0.70;
                reasons.push('双数横排+连续');
            }
            
            if (this.check2to4DuplicatePairs(last6)) {
                score += 0.68;
                reasons.push('2-4对重复数字');
            }
            
            const confidence = Math.min(0.95, score / 9);
            
            return {
                event: 'pair',
                confidence: confidence,
                reasons: reasons,
                chinese: '对子'
            };
        },
        
        checkDoubleDiff1(history) {
            if (history.length < 2) return false;
            
            const last2 = history.slice(-2);
            const diffs = last2.map(r => Math.abs(r.molSum - r.denSum));
            
            return diffs[0] === 1 && diffs[1] === 1;
        },
        
        check211Gene(history) {
            if (history.length < 2) return false; 
            const last2 = history.slice(-2); 
            const nums = last2.map(r => [...r.mol, ...r.den]).flat(); 
            const hasDuplicate = new Set(nums).size < nums.length; 
            const has0or5 = nums.some(n => n === 0 || n === 5); 
            return hasDuplicate || has0or5;
        },

        // 补全缺失的辅助函数
        checkFourSameOrDoublePair(history) {
            if (history.length < 3) return false; 
            const last3 = history.slice(-3); 
            const nums = last3.map(r => [...r.mol, ...r.den]).flat(); 
            const count = {}; 
            nums.forEach(n => count[n] = (count[n] || 0) + 1); 
            const hasFourSame = Object.values(count).some(c => c >= 4); 
            const hasDoublePair = Object.values(count).filter(c => c >= 2).length >= 2; 
            return hasFourSame || hasDoublePair;
        },

        checkColorDiagonalTriangle(history) {
            if (history.length < 2) return false; 
            const last2 = history.slice(-2); 
            const nums = last2.map(r => [...r.mol, ...r.den]).flat(); 
            if (!this.hasTriangleStructure(nums)) return false; 
            const pairs = [ [nums[0], nums[3]], [nums[1], nums[2]] ]; 
            const oppositeParity = pairs.every(p => (p[0] % 2) !== (p[1] % 2)); 
            return oppositeParity;
        },

        checkGeneSumMultipleOf4(history) {
            if (history.length < 2) return false; 
            const last2 = history.slice(-2); 
            const sum = last2.reduce((acc, r) => acc + r.molSum + r.denSum, 0); 
            return sum % 4 === 0;
        },

        checkTieThenPair(history) {
            if (history.length < 2) return false; 
            const last2 = history.slice(-2); 
            const prevIsTie = last2[0].molSum === last2[0].denSum; 
            const currHasPair = (last2[1].mol[0] === last2[1].mol[1]) || (last2[1].den[0] === last2[1].den[1]); 
            return prevIsTie && currHasPair;
        },

        checkThreeSameOrLTriangle(history) {
            if (history.length < 2) return false; 
            const last2 = history.slice(-2); 
            const nums = last2.map(r => [...r.mol, ...r.den]).flat(); 
            const count = {}; 
            nums.forEach(n => count[n] = (count[n] || 0) + 1); 
            const hasThreeSame = Object.values(count).some(c => c >= 3); 
            const hasLTriangle = this.hasTriangleStructure(nums); 
            return hasThreeSame || hasLTriangle;
        },

        checkDoubleRowWithConsecutive(history) {
            if (history.length < 2) return false; 
            const last2 = history.slice(-2); 
            const nums = last2.map(r => [...r.mol, ...r.den]).flat(); 
            const allEven = nums.every(n => n % 2 === 0); 
            const hasConsecutive = nums.some((n, i) => i < nums.length - 1 && Math.abs(n - nums[i + 1]) === 1); 
            return allEven && hasConsecutive;
        },

        check2to4DuplicatePairs(history) {
            if (history.length < 2) return false; 
            const last2 = history.slice(-2); 
            const nums = last2.map(r => [...r.mol, ...r.den]).flat(); 
            const pairs = {}; 
            for (let i = 0; i < nums.length; i++) { 
                if (nums.indexOf(nums[i]) !== i) { 
                    pairs[nums[i]] = true; 
                } 
            } 
            const pairCount = Object.keys(pairs).length; 
            return pairCount >= 2 && pairCount <= 4;
        }
    });
    console.log('✅ 对子预测逻辑加载完成');
} else {
    console.error('❌ HighOddsPredictor未定义，无法加载对子预测逻辑');
}
