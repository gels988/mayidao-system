// ========== 皇冠/熊猫预测逻辑 ==========
// 文件: predict-special.js

// 扩展HighOddsPredictor类
Object.assign(HighOddsPredictor.prototype, {
    predictCrown(history) {
        const last3 = history.slice(-3);
        let score = 0;
        
        if (last3.length >= 2) {
            const nums = last3.map(r => [...(r.mol||[]), ...(r.den||[])]).flat();
            if (this.hasSpecialStructure(nums)) score += 0.75;
        }
        
        return {
            event: 'crown',
            confidence: score,
            reasons: ['特殊结构'],
            chinese: '皇冠'
        };
    },

    predictPanda(history) {
        // 修复逻辑：仅当分子由3个数字组成且和为8时显示熊猫
        // 注意：这里 history 传入的是历史记录数组
        // 我们需要检查最新的一条记录（如果是实时预测）
        // 或者如果是预测下一局，通常不适用此规则（因为这是基于当前输入的显示规则）
        // 但根据用户指令，我们修改此函数的判定逻辑。
        
        if (!history || history.length === 0) return { event: null, confidence: 0 };
        
        const last = history[history.length - 1];
        // 确保有分子数据
        const molStr = last.mol || '';
        const molSum = last.molSum;
        
        // 核心条件：3位数字 且 和为8
        if (molStr.length === 3 && molSum === 8) {
             return {
                event: 'panda',
                confidence: 0.95, // 高置信度
                reasons: ['分子3位和8'],
                chinese: '熊猫'
            };
        }
        
        return { event: null, confidence: 0 };
    },

    // 辅助函数：检查特殊结构（比如3个以上相同数字）
    hasSpecialStructure(nums) {
        if (!nums || nums.length === 0) return false;
        const count = {};
        nums.forEach(n => count[n] = (count[n] || 0) + 1);
        return Object.values(count).some(c => c >= 3);
    }
});

console.log('✅ 皇冠/熊猫预测逻辑加载完成');
