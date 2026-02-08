/**
 * ModelA: 高倍自洽规则（基于 142857 循环结构）
 * 输入：当前分子合、分母合 + 前两局历史
 */
function ModelA(currentMolSum, currentDenSum, history) {
  // 1. 构造四数基因：[P1, P2, B1, B2] → 简化为 [mol, den]
  
  // 2. 检查 142857 衍生模式（如 142+857=999）
  // 简化逻辑：检查分子分母和是否为 999 的倍数
  const sum = currentMolSum + currentDenSum;
  const sum999 = sum > 0 && sum % 999 === 0;
  
  // 3. 检查四数合18（简化版：mol+den ≡ 0 mod 9）
  const isHarmonic = sum > 0 && sum % 9 === 0;
  
  // 4. 若符合高倍结构，倾向红色（S > 0.7）
  if (sum999 || isHarmonic) return 0.85;
  
  // 5. 默认中性
  return 0.5;
}

/**
 * ModelB: 八卦象限分布（64卦 → 4象限）
 * 接收数字数组而非和值
 */
function ModelB(molDigits, denDigits) {
  // 示例：将前两位映射到八卦
  // If digits are empty or insufficient, fallback or pad?
  // User example: const molPair = molDigits.slice(0, 2).join('');
  if (!molDigits || molDigits.length < 1 || !denDigits || denDigits.length < 1) return 0.5;

  const molStr = molDigits.join('');
  const denStr = denDigits.join('');
  
  // Take first 2 digits if available, else 1, else 0
  const molVal = parseInt(molStr.substring(0, 2)) || 0;
  const denVal = parseInt(denStr.substring(0, 2)) || 0;

  const avg = (molVal + denVal) % 64;
  
  if (avg <= 15) return 0.2;   // Strong Blue
  if (avg >= 48) return 0.8;   // Strong Red
  return 0.5;                  // Balanced
}

/**
 * ModelC: 趋势延续 + 三局联动（补牌反噬）
 * 使用数字数组判断补牌位置
 */
function ModelC(molDigits, denDigits, history) {
  if (!history || history.length < 2) return 0.5; // Need at least 2 previous rounds
  
  // 示例：若分子为3位，说明补牌发生在分子端
  const isMolExtended = molDigits.length === 3;
  
  // 趋势判断：简单沿用上局结果，或基于本局补牌反转
  // Let's use the logic: if Mol Extended (Player draws 3rd card), higher chance of reversal or specific outcome?
  // User logic: "isMolExtended ? 0.7 : 0.3"
  
  // ... 你的补牌反噬逻辑 (User snippet just says "return isMolExtended ? 0.7 : 0.3;")
  // Let's implement that simple logic as requested for Phase 5.1
  return isMolExtended ? 0.7 : 0.3;
}

module.exports = { ModelA, ModelB, ModelC };
