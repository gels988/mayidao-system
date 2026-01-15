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
    // ...
}// 🎯 对子：三条主指标（仅用分子/分母）
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
    // ...
}