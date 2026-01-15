// encrypted_logic.js
// MAYIJU Phase3_Dynamics v3.0 — 基于分子/分母的高赔率引擎
// 依据：指标汇聚、对子再研究1、高确定性概率
// 输入：context = { P_sum, B_sum, history } （history 为高赔标签数组）

(function () {
    'use strict';

    // === 核心规则：按优先级降序 ===
    const RULES = [
        {
            check: (c) => {
                if (c.P_sum !== 8 || typeof c.lastTwoColor !== 'string') return false;
                const isRepeat = Array.isArray(c.history) && c.history.length > 0 && c.history[c.history.length - 1] === '闲8';
                if (!isRepeat) {
                    // 首次或非重复场景：满足原有蓝色方向即可
                    return c.lastTwoColor.endsWith('蓝');
                }
                // 重复显示限制：仅当前序满足“蓝蓝”（视为三元素组成门槛）才再次显示“闲8”
                return c.lastTwoColor === '蓝蓝';
            },
            label: '闲8'
        },

        // 🔥 平牌：Δ < 5%
        {
            check: (c) => {
                if (c.P_sum === 0 && c.B_sum === 0) return false;
                const diff = Math.abs(c.P_sum - c.B_sum);
                const maxVal = Math.max(c.P_sum, c.B_sum);
                return (diff / maxVal) <= 0.05;
            },
            label: '平牌'
        },

        // 💎 庄6：含8且为偶数结构
        {
            check: (c) => {
                return (c.P_sum === 8 || c.B_sum === 8) &&
                       (c.P_sum % 2 === 0) && (c.B_sum % 2 === 0);
            },
            label: '庄6'
        },

        // 🎯 对子：三条主指标（仅用分子/分母）
        // 理论依据：
        // 1. 分子/分母合为4倍数 → 基因和为4倍数（文档：“四同基因都是4的倍数”）
        // 2. 双偶数 → 双数横排易出对子（文档：“双数横排必然有单数横排易出对子”）
        // 3. 双零 → 数字被挤出形成重复（文档：“零零被数字替代后，被挤出的数字...构成对子”）
        {
            check: (c) => {
                const { P_sum, B_sum } = c;
                // 主指标1: 合为4倍数
                const isMultipleOf4 = ((P_sum + B_sum) % 4 === 0);
                // 主指标2: 双偶数
                const bothEven = (P_sum % 2 === 0) && (B_sum % 2 === 0);
                // 主指标3: 含双零（任一为0 即视为触发双零效应）
                const hasDoubleZero = (P_sum === 0 || B_sum === 0);

                return isMultipleOf4 || bothEven || hasDoubleZero;
            },
            getLabel: (c) => {
                // 辅助指标：位置遗传
                let lastDuiziPos = null; // 'P' or 'B'
                let lastDoubleZeroPos = null;

                // 回溯历史
                for (let i = c.history.length - 1; i >= 0; i--) {
                    const h = c.history[i];
                    if (h === '闲对') {
                        lastDuiziPos = 'P'; break;
                    } else if (h === '庄对') {
                        lastDuiziPos = 'B'; break;
                    } else if (typeof h === 'object') {
                        // 兼容 history 中可能存对象的情况（模拟脚本中用到）
                        if (h.P_sum === 0) lastDoubleZeroPos = 'P';
                        if (h.B_sum === 0) lastDoubleZeroPos = 'B';
                    }
                }

                if (lastDuiziPos === 'P' || lastDoubleZeroPos === 'P') {
                    return '闲对';
                } else if (lastDuiziPos === 'B' || lastDoubleZeroPos === 'B') {
                    return '庄对';
                } else {
                    return '对子';
                }
            }
        },

        // ⚡ 闲7：前两局蓝蓝 + 特定和值
        {
            check: (c) => {
                const blueBlue = c.lastTwoColor === '蓝蓝';
                const has31or86 = (c.P_sum === 3 && c.B_sum === 1) ||
                                  (c.P_sum === 8 && c.B_sum === 6);
                return blueBlue && has31or86;
            },
            label: '闲7'
        }
    ];

    // 主接口
    window.getHighOddsResult = function (context) {
        if (!context || typeof context.P_sum !== 'number') {
            return "高赔率";
        }

        const ctx = {
            P_sum: context.P_sum,
            B_sum: context.B_sum,
            lastTwoColor: context.lastTwoColor || '',
            history: Array.isArray(context.history) ? context.history : []
        };

        for (let rule of RULES) {
            try {
                if (rule.check(ctx)) {
                    return typeof rule.getLabel === 'function' ? rule.getLabel(ctx) : rule.label;
                }
            } catch (e) {
                console.warn("Rule error:", e.message);
            }
        }

        return "高赔率";
    };

    // 兼容层：确保 ui_controller.js 仍可调用 window.EncryptedLogic
    window.EncryptedLogic = {
        getHighOddsResult: window.getHighOddsResult
    };
})();
