// ========== 庄6（Banker 6）预测逻辑 ==========
// 文件: predict-banker6.js

// 扩展HighOddsPredictor类
if (typeof HighOddsPredictor !== 'undefined') {
    Object.assign(HighOddsPredictor.prototype, {
        
        predictBanker6(history) {
            const last6 = history.slice(-6);
            let score = 0;
            const reasons = [];
            
            if (this.checkPattern86_31(last6)) {
                score += 0.85;
                reasons.push('86+31组合，余数42/97');
            }
            
            if (this.checkTriangleInTurn(last6)) {
                score += 0.80;
                reasons.push('2:1转弯+三角结构');
            }
            
            if (this.checkPlayerRoadPattern(last6)) {
                score += 0.78;
                reasons.push('闲路319/860/000/875');
            }
            
            if (this.checkZeroGeneWithSix(last6)) {
                score += 0.75;
                reasons.push('大小零基因+三角+含6');
            }
            
            if (this.checkFourZerosPattern(last6)) {
                score += 0.72;
                reasons.push('四零牌+8+8+3');
            }
            
            const confidence = Math.min(0.95, score / 5); // 注意：这里除以5，如果触发多个，分数会累加，但逻辑上是独立的if。
            // 修正：通常是 max score，或者是累加后归一化。
            // 用户代码是 score += ... 然后 score / 5。
            // 假设所有条件都满足，score = 0.85+0.80+0.78+0.75+0.72 = 3.9。
            // 3.9 / 5 = 0.78。
            // 这样的逻辑意味着必须满足多个条件才能获得高分。
            
            return {
                event: 'banker6',
                confidence: confidence,
                reasons: reasons,
                chinese: '庄6'
            };
        },
        
        checkPattern86_31(history) {
            if (history.length < 3) return false;
            
            const last3 = history.slice(-3);
            let has86 = false, has31 = false;
            
            last3.forEach(record => {
                const molStr = record.mol.join('');
                const denStr = record.den.join('');
                
                if (molStr.includes('86') || denStr.includes('86')) has86 = true;
                if (molStr.includes('31') || denStr.includes('31')) has31 = true;
            });
            
            if (!has86 || !has31) return false;
            
            const remainder = this.calculateRemainder(history);
            return remainder === '42' || remainder === '97';
        },
        
        checkTriangleInTurn(history) {
            if (history.length < 4) return false;
            
            const last4 = history.slice(-4);
            const values = last4.map(r => r.molSum > r.denSum ? 0 : 1);
            
            const isTurn = (values[0] !== values[1] && values[1] === values[2] && values[2] === values[3]);
            
            if (!isTurn) return false;
            
            const nums = last4.map(r => [...r.mol, ...r.den]).flat();
            return this.hasTriangleStructure(nums);
        },
        
        checkPlayerRoadPattern(history) {
            if (history.length < 3) return false;
            
            const patterns = ['319', '860', '000', '875'];
            const last3Mol = history.slice(-3).map(r => r.mol.join('')).join('');
            
            return patterns.some(p => last3Mol.includes(p));
        },
        
        checkZeroGeneWithSix(history) {
            // 补全截断代码
            // 逻辑推断：检查历史记录中是否有0（小/大零基因），是否包含6，以及是否有三角结构
            if (history.length < 2) return false;
            
            const last2 = history.slice(-2);
            const nums = last2.map(r => [...r.mol, ...r.den]).flat();
            
            const hasZero = nums.includes(0);
            const hasSix = nums.includes(6);
            // 假设 "大小零基因" 意味着不管 0 是大数还是小数（其实0就是0），或者是指数量
            // "含6"
            // "三角"
            
            if (!hasZero || !hasSix) return false;
            
            return this.hasTriangleStructure(nums);
        },
        
        checkFourZerosPattern(history) {
            // 逻辑推断：四零牌+8+8+3
            if (history.length < 3) return false;
             const last3 = history.slice(-3);
             const nums = last3.map(r => [...r.mol, ...r.den]).flat();
             
             const zeroCount = nums.filter(n => n === 0).length;
             if (zeroCount < 4) return false;
             
             // 检查是否有 8, 8, 3
             const count8 = nums.filter(n => n === 8).length;
             const count3 = nums.filter(n => n === 3).length;
             
             return count8 >= 2 && count3 >= 1;
        }
    });
    console.log('✅ 庄6预测逻辑加载完成');
} else {
    console.error('❌ HighOddsPredictor未定义，无法加载庄6预测逻辑');
}
