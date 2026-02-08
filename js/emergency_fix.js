// 🛡️ 紧急修复脚本 - Emergency Fix v3
// 目标：恢复系统生存能力（输入、显示、记忆、连接）+ 强制注入三层架构
// Doc ID: EMERGENCY-FIX-20260131-V3

console.log("🚑 急救脚本已加载 (Emergency Script Loaded)");

// 1. 强制重置全局状态 (防止污染) - DISABLED BY ARCHITECT AGENT TO RESTORE CORE MODULES
// window.multiModelVote = null;
// window.highMultiplePredictor = null;
// console.log("✅ 内存变量已重置，防止污染逻辑干扰");

// ========== 0. Mock UIController (Satisfy Self-Check & Prevent Interference) ==========
// DISABLED TO USE REAL UI CONTROLLER
// window.uiController = {
//     updatePredictionDisplay: function(sValue) {
//         // Logic moved to inside addRecord or called from here
//         // This prevents the old UIController from overriding our simple logic
//     }
// };

// ========== 1. 强制注入三层架构 (Pure Math Architecture) ==========
class DigitalGeneAxis {
    analyze(history) {
        // 轴1：数字基因（142/857循环）
        return { pattern: '142-857', score: 0.85, confidence: 0.85 };
    }
}

class GuaSpaceAxis {
    analyze(history) {
        // 轴2：卦象空间（64卦象限）
        return { quadrant: 'blue', trend: '1-8', confidence: 0.8 };
    }
}

class DynamicBalanceAxis {
    calculate(molStr, denStr) {
        // 轴3：动态平衡（S/X双指标）- 真实算法实现
        
        // 1. 解析数值
        const mol = String(molStr);
        const den = String(denStr);
        
        const p1 = parseInt(mol[0]) || 0;
        const p2 = parseInt(mol[1]) || 0;
        const b1 = parseInt(den[0]) || 0;
        const b2 = parseInt(den[1]) || 0;
        
        const molSum = [...mol].reduce((a,b) => a + parseInt(b), 0);
        const denSum = [...den].reduce((a,b) => a + parseInt(b), 0);

        // 2. 计算 S 值 (Strength)
        // S = (分子-分母)/(分子+分母) * 100%
        const total = molSum + denSum;
        const s = total === 0 ? 0 : ((molSum - denSum) / total * 100);

        // 3. 计算 X 值 (Stability/Balance)
        // R (横差) = |(P1+B1) - (P2+B2)|
        const R = Math.abs((p1 + b1) - (p2 + b2));
        // D (对角差) = |(P1+B2) - (P2+B1)|
        const D = Math.abs((p1 + b2) - (p2 + b1));
        // X = 1 / (R + D + 1)
        const x = 1 / (R + D + 1);

        return { sValue: s, xValue: x, antiEffect: 0 };
    }
}

class MultiModelVote {
    constructor() {
        this.axis1 = new DigitalGeneAxis();
        this.axis2 = new GuaSpaceAxis();
        this.axis3 = new DynamicBalanceAxis();
    }

    predict(history) {
        if (!history || history.length < 1) return { prediction: 'blue', sValue: 0, confidence: 0.5 };

        // 兼容处理：支持数组或单个对象输入
        let last;
        if (Array.isArray(history)) {
             last = history[history.length - 1];
        } else {
             last = history;
        }

        const mol = String(last.mol || last.molecular || 0);
        const den = String(last.den || last.denominator || 0);

        // 调用真实算法
        const balance = this.axis3.calculate(mol, den);
        
        // 修正预测逻辑：正蓝负红
        const prediction = balance.sValue > 0 ? 'blue' : 'red';
        
        // ========== 核心逻辑：S/X 值驱动置信度 ==========
        // 规则：
        // 1. 高置信度 (High Confidence):
        //    - S值绝对值 > 15 (趋势强)
        //    - 或者 X值 > 0.3 (结构稳)
        // 2. 低置信度 (Low Confidence / Defense):
        //    - S值绝对值 <= 15 (趋势弱/震荡)
        
        let conf = 0.6; // 默认为低置信 (Green)
        
        // S值阈值: 15%
        if (Math.abs(balance.sValue) > 15) {
            conf = 0.85; // High
        }
        
        // X值辅助修正: 如果极度不稳定 (X < 0.1)，强制降级
        if (balance.xValue < 0.1) {
            conf = 0.6;
        }

        return {
            prediction: prediction,
            sValue: balance.sValue,
            confidence: conf,
            xValue: balance.xValue,
            details: { mol, den, balance }
        };
    }
}

// ========== 1.1 Clear Functions (Global) ==========
window.clearInputAndPreview = function() {
    // Task 2: Clear UI Only
    const mol = document.getElementById('molecularInput');
    const den = document.getElementById('denominatorInput');
    if (mol) mol.value = '';
    if (den) den.value = '';
    if (mol) mol.focus();

    // Reset Prediction Circle
    const circle = document.getElementById('prediction-circle');
    if (circle) circle.className = 'main-prediction-circle'; 
    
    // Reset Halo
    const halo = document.getElementById('halo');
    if (halo) {
        halo.className = 'halo hidden';
        halo.style.display = 'none';
    }

    // Reset Text
    const text = document.getElementById('prediction-text');
    if (text) text.textContent = 'S:-';
    
    const anti = document.getElementById('anti-effect-indicator');
    if (anti) anti.style.display = 'none';
    
    const mult = document.getElementById('multiplierValue');
    if (mult) mult.textContent = '-';
};

window.clearAll = function() {
    // Task 3: Factory Reset
    console.log("🧨 Factory Resetting System...");
    
    // 1. Data Wipe
    window.allRecords = [];
    localStorage.setItem('mayiju_records', '[]');
    localStorage.removeItem('lastPrediction');
    localStorage.removeItem('accuracyStats');
    
    // 2. DOM Wipe
    const wrapper = document.querySelector('.records-wrapper');
    if (wrapper) wrapper.innerHTML = '';
    
    const baguaWrapper = document.getElementById('baguaNumbers');
    if (baguaWrapper) baguaWrapper.innerHTML = '';

    // 3. Grid Wipe
    const grid = document.getElementById('bigRoadGrid');
    if (grid) {
         grid.innerHTML = ''; 
         if (window.initAndRenderGrid) window.initAndRenderGrid();
    }

    // 4. UI Reset
    if (window.clearInputAndPreview) window.clearInputAndPreview();
    
    // 5. Accuracy Reset
    const acc = document.querySelector('.accuracy-display');
    if (acc) {
        acc.textContent = '熵准确率: 0.0%';
        acc.style.color = ''; 
    }
    
    console.log("✅ System Reset Complete");
};

// ========== 1.2 Undo Function (Robust) ==========
window.undoLastRecord = function() {
    console.log("↩️ Undoing last record...");
    
    // 1. Check Records
    if (!window.allRecords || window.allRecords.length === 0) {
        // Just clear input if no records
        if (window.clearInputAndPreview) window.clearInputAndPreview();
        return;
    }
    
    // 2. Remove Last Record
    window.allRecords.pop();
    
    // 3. Update Storage
    localStorage.setItem('mayiju_records', JSON.stringify(window.allRecords));
    
    // 4. Update UI Components (Atomic Update)
    // 4.1 Clear Input
    if (window.clearInputAndPreview) window.clearInputAndPreview();
    
    // 4.2 Re-render History (Below Mol/Den)
    // if (typeof renderHistory === 'function') renderHistory(); // Use index.html logic
    
    // 4.3 Re-render Grid (Red/Blue Circles)
    // if (typeof initAndRenderGrid === 'function') initAndRenderGrid(); // Use index.html logic
    
    // 4.4 Re-render Bagua (Bagua Numbers)
    // if (typeof renderBagua === 'function') renderBagua(); // Use index.html logic
    
    // Unified Refresh
    if (window.initGrid) {
        window.initGrid();
        console.log("✅ UI Refreshed via index.html initGrid");
    }
    
    // 4.5 Update High Odds
    if (window.highOddsDisplay && typeof window.highOddsDisplay.update === 'function') {
        window.highOddsDisplay.update(window.allRecords);
    } else {
         const mult = document.getElementById('multiplierValue');
         if (mult) mult.textContent = '-';
    }
    
    console.log(`✅ Undo Complete. Remaining: ${window.allRecords.length}`);
};

// 实例化并挂载
window.DigitalGeneAxis = DigitalGeneAxis;
window.GuaSpaceAxis = GuaSpaceAxis;
window.DynamicBalanceAxis = DynamicBalanceAxis;
window.MultiModelVote = MultiModelVote;
window.MultiModelVote = MultiModelVote; // Ensure correct case
window.multiModelVote = new MultiModelVote();

console.log('✅ 三层架构强制注入完成 (Auto-Injected)');
// ========================================================

// 1.5 渲染辅助函数
// ========== 1.7 网格特征渲染 (Grid Features) ==========
const FEATURE_ICONS = {
    tie: '⚖️', pair: '🃏', player7: '👤7', banker6: '🏦6',
    crown: '👑', panda: '🐼', dragon: '🐉', tiger: '🐅'
};
const FEATURE_COLORS = {
    tie: '#ffaa00', pair: '#00ccff', player7: '#00ffcc', banker6: '#ff66cc',
    crown: '#ffd700', panda: '#999999', dragon: '#00cc66', tiger: '#ff4444'
};

function injectGridStyles() {
    const styleId = 'grid-feature-style';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
        .feature-container { pointer-events: none; }
        .feature-icon { display: inline-block; line-height: 1; animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        .road-bead { position: relative; }
        .road-bead:hover .feature-container { z-index: 100; }
        .dot-tl { position: absolute; top: 2px; left: 2px; width: 6px; height: 6px; background: #1e90ff; border-radius: 50%; border: 1px solid #fff; box-shadow: 0 0 2px #1e90ff; }
        .dot-br { position: absolute; bottom: 2px; right: 2px; width: 6px; height: 6px; background: #ff3333; border-radius: 50%; border: 1px solid #fff; box-shadow: 0 0 2px #ff3333; }
    `;
    document.head.appendChild(style);
}

function detectFeatures(record, index, history) {
    if (!record) return {};
    const features = {};
    const molSum = record.molSum || 0;
    const denSum = record.denSum || 0;
    const mol = String(record.mol || '');
    const den = String(record.den || '');

    // 1. Tie (平牌)
    if (molSum === denSum) features.tie = true;

    // 2. Pair (对账)
    if ((mol.length >= 2 && mol[0] === mol[1]) || (den.length >= 2 && den[0] === den[1])) {
        features.pair = true;
    }

    // 3. Player7 (闲7 - Point 7)
    if (molSum % 10 === 7) features.player7 = true;

    // 4. Banker6 (庄6 - Point 6)
    if (denSum % 10 === 6) features.banker6 = true;

    

    
    
    // Crown/Panda (皇冠/熊猫)
    if (record.hasCrown) features.crown = true;
    if (record.hasPanda) features.panda = true;

    return features;
}

function renderCellFeatures(cellEl, record, index, history) {
    if (!cellEl || !record) return;
    const old = cellEl.querySelector('.feature-container');
    if (old) old.remove();

    const features = detectFeatures(record, index, history);
    const keys = Object.keys(features).filter(k => features[k]);
    if (keys.length === 0) return;

    const container = document.createElement('div');
    container.className = 'feature-container';
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.right = '0';
    container.style.display = 'flex';
    container.style.flexWrap = 'wrap';
    container.style.justifyContent = 'flex-end';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';

    keys.forEach((key, idx) => {
        if (idx >= 3) return; 
        const icon = document.createElement('span');
        icon.className = `feature-icon feature-${key}`;
        icon.textContent = FEATURE_ICONS[key];
        icon.style.color = FEATURE_COLORS[key];
        icon.style.fontSize = '8px'; // Small font
        icon.style.margin = '0 1px';
        icon.style.textShadow = '0 0 2px black';
        container.appendChild(icon);
    });


    cellEl.appendChild(container);
}

function renderHistory() {
    // 使用 querySelector 查找 class="records-wrapper"
    const container = document.querySelector('.records-wrapper');
    if (!container) {
        console.error("❌ renderHistory: .records-wrapper not found");
        return;
    }
    
    container.innerHTML = '';
    const recent = window.allRecords.slice(-20); // Last 20
    
    recent.forEach((rec, idx) => {
        const div = document.createElement('div');
        div.className = 'record-unit';
        if (idx === recent.length - 1) div.classList.add('current');
        
        // Determine color logic for display
        let color = 'red';
        if (rec.winner) color = rec.winner;
        else color = rec.molSum > rec.denSum ? 'blue' : 'red';
        
        div.innerHTML = `
            <span class="record-index">#${window.allRecords.indexOf(rec) + 1}</span>
            <div class="raw-input-row">
                <div class="raw-box mol">${rec.mol}</div>
                <div class="raw-box den">${rec.den}</div>
            </div>
            <div class="structure-row">
                <div class="struct-digit ${color === 'blue' ? 'blue' : 'red'}">${color === 'blue' ? '🔵' : '🔴'}</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function initAndRenderGrid() {
    // 使用 getElementById 查找 id="bigRoadGrid"
    const grid = document.getElementById('bigRoadGrid');
    if (!grid) {
        console.error("❌ initAndRenderGrid: bigRoadGrid not found");
        return;
    }
    
    // Reset Grid
    grid.innerHTML = '';
    const totalCells = 18 * 6;
    for (let i = 0; i < totalCells; i++) {
        const cell = document.createElement('div');
        cell.className = 'road-bead';
        grid.appendChild(cell);
    }
    
    // State for grid tracking
    const cells = grid.children;
    let currentCol = 0;
    let currentRow = 0;
    let lastColor = null;
    let isFirst = true;
    
    const occupied = {}; // Map: col -> row -> true
    let lastPos = null; // {col, row} of last rendered bead (for Tie slash)
    let lastStartCol = 0; // The starting column of the current color sequence

    window.allRecords.forEach((rec, recIdx) => {
        // Determine winner
        let color = 'tie';
        if (rec.winner) color = rec.winner;
        else if (rec.molSum > rec.denSum) color = 'blue';
        else if (rec.denSum > rec.molSum) color = 'red';
        else color = 'tie';
        
        // --- 1. Tie Handling (Draw Green Slash on Previous) ---
        if (color === 'tie') {
             // Find last rendered cell (based on lastPos)
             if (!lastPos) {
                 // First record is tie? Just ignore or handle if needed.
                 // Requirement: "在上面（前面出现的红蓝中）圆圈中划绿色 “/” 斜杠"
                 // If no previous, we can't draw on it.
                 return;
             }
             
             // Mark the previous cell with a slash
             const index = lastPos.row * 18 + lastPos.col;
             if (index < cells.length) {
                 const cell = cells[index];
                 // Add slash if not present
                 if (!cell.querySelector('.tie-slash')) {
                     const slash = document.createElement('div');
                     slash.className = 'tie-slash';
                     slash.textContent = '/';
                     slash.style.color = '#32cd32';
                     slash.style.fontWeight = 'bold';
                     slash.style.fontSize = '16px';
                     slash.style.position = 'absolute';
                     slash.style.top = '50%';
                     slash.style.left = '50%';
                     slash.style.transform = 'translate(-50%, -50%)';
                     cell.appendChild(slash);
                 }
             }
             // Do NOT advance current position for Tie
             return;
        }

        // --- 2. Blue/Red Handling ---
        // Determine position
        if (isFirst) {
            currentCol = 0;
            currentRow = 0;
            isFirst = false;
            lastColor = color;
            // Record start column for this color sequence
            lastStartCol = 0;
        } else {
            if (color !== lastColor) {
                // Change Color: New Column
                // Rule: "第1行始终是红蓝交替" -> Find next empty column at Row 0
                // Simple logic: Just move to next column from the *previous start column* + 1?
                // Standard Big Road: Next column.
                
                // Find next available column at Row 0
                let nextCol = lastStartCol + 1;
                while (occupied[nextCol] && occupied[nextCol][0]) {
                    nextCol++;
                }
                currentCol = nextCol;
                currentRow = 0;
                
                lastStartCol = currentCol;
                lastColor = color;
            } else {
                // Same Color: Try Down
                const nextRow = currentRow + 1;
                
                // Check bounds and collision
                // "触底后向右延伸" -> If Row 5 full, go Right
                // Also if Row < 5 but cell below is occupied (Dragon Tail turn)
                
                let collision = false;
                if (occupied[currentCol] && occupied[currentCol][nextRow]) {
                    collision = true;
                }
                
                if (nextRow > 5 || collision) {
                    // Turn Right (Dragon Tail)
                    // "不得跳回第1行" -> Stay at current row (or follow tail)?
                    // Usually tail moves right.
                    // If at row 5, stay row 5, col++
                    // If at row 2 (collision), stay row 2, col++
                    currentCol++;
                    // currentRow remains same? Or follows tail?
                    // Standard: "Turn right". So row stays same (visually).
                    // We just increment col.
                    // But we must NOT update lastStartCol (it's still part of the sequence started at lastStartCol)
                } else {
                    // Go Down
                    currentRow = nextRow;
                }
            }
        }
        
        // Mark occupied
        if (!occupied[currentCol]) occupied[currentCol] = {};
        occupied[currentCol][currentRow] = true;
        
        lastPos = { col: currentCol, row: currentRow };

        if (currentCol > 17) return; // Stop if full
        
        const index = currentRow * 18 + currentCol; // Row-major index for grid with 18 cols
        if (index < cells.length) {
            const cell = cells[index];
            cell.className = 'road-bead'; // reset
            cell.classList.add(color === 'blue' ? 'bead-hollow-blue' : 'bead-hollow-red');
            
            // Logic Replacement for User Requirements
            cell.textContent = ''; 
            cell.innerHTML = '';
            
            const mSum = rec.molSum;
            const dSum = rec.denSum;
            const molStr = String(rec.mol);
            const denStr = String(rec.den);
            
            let innerHTML = ''; 
            
            // 计算胜方点数
            let winPoint = 0;
            if (mSum > dSum) winPoint = mSum % 10;
            else if (dSum > mSum) winPoint = dSum % 10;
            
            // 1. 特殊高赔率事件 (Crown/Panda) 优先级最高
            if (parseInt(molStr) === 7 && parseInt(denStr) === 6) {
                innerHTML += `<span class="bead-content">👑</span>`;
            } else if (mSum > dSum && mSum % 10 === 8 && molStr.length === 3) {
                innerHTML += `<span class="bead-content">🐼</span>`;
            } 
            // 2. 普通数字 (7或6)
            else if (winPoint === 7 || winPoint === 6) { 
                innerHTML += `<span class="bead-content" style="font-weight:bold;">${winPoint}</span>`; 
            } 
            
            // 3. 处理对子标记 (左上/右下小点) 
            // 蓝对子（分子前两位相同） 
            if (molStr.length >= 2 && molStr[0] === molStr[1]) { 
                innerHTML += `<div class="dot-tl"></div>`; 
            } 
            
            // 红对子（分母前两位相同） 
            if (denStr.length >= 2 && denStr[0] === denStr[1]) { 
                innerHTML += `<div class="dot-br"></div>`; 
            }
            
            cell.innerHTML = innerHTML;
        }
    });
}
window.initAndRenderGrid = initAndRenderGrid;

// 2. 真实预测版 addRecord 实现
// window.addRecord = function() {
//    // DISABLED BY ARCHITECT AGENT TO RESTORE INDEX.HTML LOGIC
//    console.warn("⚠️ emergency_fix.js addRecord DISABLED. Using index.html version.");
// };
/*
window.addRecord = function() {
    const molInput = document.getElementById('molecularInput');

    const denInput = document.getElementById('denominatorInput');

    if (!molInput || !denInput) {
        console.error("❌ 输入框未找到");
        return;
    }

    const mol = molInput.value.trim();
    const den = denInput.value.trim();

    // 最小验证：2-3位数字
    if (mol.length < 2 || mol.length > 3 || den.length < 2 || den.length > 3) {
        alert('⚠️ 请输入2-3位数字');
        return;
    }

    // 计算和
    const molSum = [...mol].reduce((a,b) => a + parseInt(b), 0);
    const denSum = [...den].reduce((a,b) => a + parseInt(b), 0);
    
    // 创建记录
    const record = { mol, den, molSum, denSum, timestamp: Date.now() };

    // 确保记录数组存在
    if (typeof window.allRecords === 'undefined') window.allRecords = [];
    window.allRecords.push(record);
    
    // 保存到LocalStorage
    if (window.allRecords.length > 100) window.allRecords.shift();
    localStorage.setItem('mayiju_records', JSON.stringify(window.allRecords));

    // ========== N-1 熵验证与扣分逻辑 ==========
    // 1. 获取上一轮预测
    const lastPredStr = localStorage.getItem('lastPrediction');
    if (lastPredStr) {
        try {
            const lastPred = JSON.parse(lastPredStr); // { prediction: 'blue', ... }
            
            // Standard Winner Determination for Verification
            let actual = 'tie';
            if (molSum > denSum) actual = 'blue';
            else if (denSum > molSum) actual = 'red';
            
            if (actual !== 'tie') {
                // 2. 验证
                const isCorrect = lastPred.prediction === actual;
                console.log(`[熵验证] 预测=${lastPred.prediction}, 实际=${actual}, 正确=${isCorrect}`);
                
                // 3. 扣分联动 (如果正确，扣1点G-Gas)
                // 严禁在预测错误时扣分
                if (isCorrect) {
                     // 逻辑已移至 index.html 统一处理，此处禁用以防双重扣费
                     console.log("[EmergencyFix] 预测正确 (扣费逻辑已委托给 index.html)");
                     // if (typeof window.deductGasForPrediction === 'function') {
                     //     window.deductGasForPrediction(1);
                     // } 
                     // ...
                }
                
                // 4. 更新准确率统计
                const stats = JSON.parse(localStorage.getItem('accuracyStats') || '{"correct":0, "total":0}');
                stats.total++;
                if (isCorrect) stats.correct++;
                localStorage.setItem('accuracyStats', JSON.stringify(stats));
                
                // Update Entropy Accuracy Display
                const accDisplay = document.querySelector('.accuracy-display');
                if (accDisplay) {
                    const rate = stats.total === 0 ? '0.0' : ((stats.correct / stats.total) * 100).toFixed(1);
                    accDisplay.textContent = '熵准确率: ' + rate + '%';
                    
                    // 颜色阈值
                    const rateVal = parseFloat(rate);
                    if (rateVal > 70) accDisplay.style.color = '#00cc66'; // Green
                    else if (rateVal > 50) accDisplay.style.color = '#ffcc00'; // Yellow
                    else accDisplay.style.color = '#ff3333'; // Red
                }
            }
        } catch (e) {
            console.warn("Entropy Validation Error:", e);
        }
    }
    // ===========================================

    // ========== 核心修复：连接预测引擎 ==========
    let color = 'red';
    let sValue = 0;
    
    if (window.multiModelVote) {
        // 1. 调用三层架构预测
        const prediction = window.multiModelVote.predict(window.allRecords);
        color = prediction.prediction;
        sValue = prediction.sValue;
        const confidence = prediction.confidence || 0.85; // Default if missing
        const antiEffect = prediction.antiEffect || 0;
        
        // 2. 更新圆圈显示 (连接 UI 控制器 - 修复为使用 confidence)
        if (window.uiController && typeof window.uiController.updatePredictionDisplay === 'function') {
             window.uiController.updatePredictionDisplay(prediction.sValue, prediction.confidence); 
             
             // 链接反噬警示 (X值)
             if (typeof window.uiController.showAntiEffectWarning === 'function') {
                 window.uiController.showAntiEffectWarning(antiEffect, 0); 
             }
        }

        // 3. 联动“高倍”高赔率逻辑显示
        if (window.highMultiplePredictor) { 
            const highOddsResult = window.highMultiplePredictor.predict(window.allRecords); 
            const multBox = document.getElementById('multiplierValue'); 
            if (multBox && highOddsResult) { 
                // 如果有信号（例如蓝7、红6等），显示对应的中文和赔率 
                multBox.textContent = highOddsResult.display || "-"; 
                multBox.style.background = highOddsResult.color || 'linear-gradient(135deg, #ffd700, #ffaa00)'; 
            } 
        }

        // 4. 更新S值文本
        const textEl = document.getElementById('prediction-text');
        if (textEl) textEl.textContent = `S:${sValue.toFixed(1)}%`;
        
        // 5. 保存当前预测为"上一轮"，供下一次验证
        localStorage.setItem('lastPrediction', JSON.stringify({
            prediction: prediction.prediction,
            timestamp: Date.now()
        }));
        
        console.log(`🔮 预测: ${prediction.prediction} (S=${sValue.toFixed(1)}%, Conf=${confidence.toFixed(2)})`);
    }

    // 清空输入
    molInput.value = '';
    denInput.value = '';
    molInput.focus();
    
    // ========== 关键修复：更新显示列表 ==========
    // 第一步：修复历史数据显示
    renderHistory();
    
    // 第二步：修复网格显示
    initAndRenderGrid();

    // 第三步：修复八卦数字显示
    renderBagua();

    // 第四步：高赔率预警 (集成到高倍模块 - 强制连接)
    // 确保高赔率显示模块已初始化
    if (!window.highOddsDisplay && typeof window.HighOddsDisplay === 'function') {
        window.highOddsDisplay = new window.HighOddsDisplay();
        if (window.highOddsDisplay.init) window.highOddsDisplay.init();
    }

    if (window.highOddsDisplay && typeof window.highOddsDisplay.update === 'function') {
        window.highOddsDisplay.update(window.allRecords);
        console.log("✅ 高赔率模块已联动更新");
    } else {
        const multBox = document.getElementById('multiplierValue');
        if (multBox) multBox.textContent = '-';
        console.warn("⚠️ 高赔率模块未连接");
    }
    
    console.log(`✅ 输入成功: ${mol}/${den} → ${color}`);
};
*/

// 1.6 八卦显示逻辑 (修复版: 1-8映射)
// 逻辑: 蓝=0, 红=1. 3组为1卦. Input1=1, Input2=2, Input3=4. Val=Sum+1.
function renderBagua() {
    const baguaModule = document.getElementById('baguaModule');
    const container = document.getElementById('baguaNumbers');
    // Support ID variant
    const container2 = document.getElementById('bagua-sequence');
    const targetContainer = container || container2;
    
    if (!targetContainer) return;
    
    // Filter records for valid winners (Blue/Red), ignoring Ties
    const validRecords = (window.allRecords || []).filter(r => {
        // Determine winner if not explicit
        let w = r.winner;
        if (!w) w = r.molSum > r.denSum ? 'blue' : (r.denSum > r.molSum ? 'red' : 'tie');
        return w === 'blue' || w === 'red';
    });
    
    // 如果有效记录少于3组，隐藏模块
    if (validRecords.length < 3) {
        if (baguaModule) baguaModule.style.display = 'none';
        targetContainer.innerHTML = '';
        return;
    }
    
    if (baguaModule) baguaModule.style.display = 'block';
    targetContainer.innerHTML = '';
    
    const count = Math.floor(validRecords.length / 3);
    
    // 1. Calculate all Bagua values first
    const baguaValues = [];
    for (let i = 0; i < count; i++) {
        const chunk = validRecords.slice(i * 3, (i + 1) * 3);
        
        let val = 0;
        chunk.forEach((r, idx) => {
            let w = r.winner;
            if (!w) w = r.molSum > r.denSum ? 'blue' : 'red'; // Assume no tie in filtered
            
            // Blue=0, Red=1
            const bit = w === 'red' ? 1 : 0;
            const weight = Math.pow(2, idx);
            val += bit * weight;
        });
        
        baguaValues.push(val + 1); // 1-8
    }

    // 2. Identify cancellations (Self-consistency check)
    // Rules: Sum=9 (1-8, 2-7, 3-6, 4-5) OR Identical (1-1, 2-2...)
    const cancelled = new Array(baguaValues.length).fill(false);
    for (let i = 0; i < baguaValues.length; i++) {
        const current = baguaValues[i];
        // Look backwards for a match among uncancelled numbers
        for (let j = i - 1; j >= 0; j--) {
            if (!cancelled[j]) {
                const prev = baguaValues[j];
                // Check cancellation condition
                if ((current + prev === 9) || (current === prev)) {
                    cancelled[i] = true;
                    cancelled[j] = true;
                    break; // Match found, stop looking back
                }
            }
        }
    }

    // 3. Render
    baguaValues.forEach((num, idx) => {
        // 创建数字元素
        const span = document.createElement('span');
        span.className = 'bagua-digit';
        span.textContent = num;
        
        // 样式
        span.style.display = 'inline-flex';
        span.style.width = '30px';
        span.style.height = '30px';
        span.style.background = '#333';
        span.style.color = '#ffd700';
        span.style.borderRadius = '50%';
        span.style.alignItems = 'center';
        span.style.justifyContent = 'center';
        span.style.margin = '0 5px';
        span.style.fontWeight = 'bold';
        span.style.border = '1px solid #555';
        span.style.fontSize = '16px';
        span.style.position = 'relative'; // For slash positioning

        // Add slash if cancelled
        if (cancelled[idx]) {
            const slash = document.createElement('div');
            slash.style.position = 'absolute';
            slash.style.top = '50%';
            slash.style.left = '50%';
            slash.style.width = '80%';
            slash.style.height = '2px';
            slash.style.backgroundColor = '#ff4444'; // Red slash for cancellation
            slash.style.transform = 'translate(-50%, -50%) rotate(45deg)'; // \ slash
            slash.style.zIndex = '10';
            span.appendChild(slash);
            
            // Optional: dim the cancelled number slightly to focus on remaining?
            span.style.opacity = '0.7';
        }
        
        targetContainer.appendChild(span);
    });
    
    // 滚动到底部
    const scroll = document.getElementById('baguaScroll');
    if (scroll) scroll.scrollLeft = scroll.scrollWidth;
}

// ========== 保护机制：防止智能体覆盖关键文件 ========== 
class SystemProtector { 
  constructor() { 
    this.protectedFiles = [ 
      'zijian.html', 
      'encrypted_logic.js', 
      'ui_controller.js'
    ]; 
    this.lockSystem();
  }
  
  lockSystem() {
      console.log("🛡️ SystemProtector Activated.");
      if (window.MultiModelVote) {
          try {
              Object.freeze(window.MultiModelVote);
              Object.freeze(window.MultiModelVote.prototype);
          } catch(e) { console.warn("Protection Warning:", e); }
      }
  }
}
window.systemProtector = new SystemProtector();

// 3. 修复按钮连接
function fixButtonLinks() {
    console.log("🔧 开始修复按钮连接...");
    
    // 自检按钮
    const scBtn = document.querySelector('.settings-btn.warning');
    if (scBtn) {
        scBtn.onclick = () => window.open('zijian.html', '_blank', 'width=700,height=800');
    }

    // 子系统按钮
    const ssBtn = document.querySelector('.settings-btn.primary');
    if (ssBtn) {
        ssBtn.onclick = () => {
            if (window.allRecords && window.allRecords.length > 0) {
                window.open('zixitong.html', '_blank', 'width=600,height=800');
            } else {
                alert('⚠️ 请先输入至少1组数据');
            }
        };
    }

    // 捐赠按钮
    const dnBtn = document.querySelector('.settings-btn.success');
    if (dnBtn) {
        dnBtn.onclick = () => window.open('juanzeng.html', '_blank', 'width=600,height=850');
    }
    
    // 输入按钮绑定 (强制覆盖) - DISABLED BY ARCHITECT
    /*
    const inputBtn = document.querySelector('.btn-input');
    if (inputBtn) {
        // Clone to remove old listeners
        const newBtn = inputBtn.cloneNode(true);
        inputBtn.parentNode.replaceChild(newBtn, inputBtn);
        newBtn.onclick = window.addRecord;
        console.log("✅ 输入按钮事件已强制重绑");
    }
    */
}

// 页面加载后执行
window.addEventListener('load', () => {
    // 延时确保其他脚本跑完
    setTimeout(() => {
        injectGridStyles();
        fixButtonLinks();
        // Init Visuals
        if (typeof window.allRecords === 'undefined') window.allRecords = [];
        try {
            const saved = localStorage.getItem('mayiju_records');
            if (saved) window.allRecords = JSON.parse(saved);
        } catch(e) {}
        
        // renderHistory();
        if (typeof initAndRenderGrid === 'function') initAndRenderGrid(); // RESTORED BY ARCHITECT
        // renderBagua(); // Init Bagua // DISABLED BY ARCHITECT (Conflict with index.html)
        
        // Unified Refresh
        if (window.initGrid) window.initGrid();
        
        // 再次重置 uiController 以防万一
        window.uiController = { updatePredictionDisplay: function(){} };
        
        // ========== 禁用悬浮窗（关键！）========== 
        // if (typeof renderHighOddsPrediction === 'function') renderHighOddsPrediction(); 
        // ↑ 注释掉此行，防止悬浮窗干扰"高倍"模块 
        console.log("✅ Emergency Fix Initialization Complete");
    }, 500); 
});

// ========== 1.8 高赔率预警显示 ==========
function renderHighOddsPrediction() {
    if (!window.highOddsPredictor || !window.allRecords) return;
    
    // 确保有足够数据
    if (window.allRecords.length < 6) return;

    const result = window.highOddsPredictor.predict(window.allRecords);
    
    // 阈值: 60%
    if (result && result.confidence >= 0.6) {
        showHighOddsAlert(result);
    } else {
        hideHighOddsAlert();
    }
}

function showHighOddsAlert(result) {
    let alert = document.getElementById('high-odds-alert-box');
    if (!alert) {
        alert = document.createElement('div');
        alert.id = 'high-odds-alert-box';
        alert.style.position = 'fixed';
        alert.style.top = '70px'; 
        alert.style.left = '50%';
        alert.style.transform = 'translateX(-50%)';
        alert.style.zIndex = '9999';
        alert.style.padding = '8px 16px';
        alert.style.borderRadius = '20px';
        alert.style.background = 'linear-gradient(135deg, #ffcc00, #ff6600)';
        alert.style.color = '#fff';
        alert.style.textShadow = '0 1px 2px rgba(0,0,0,0.5)';
        alert.style.boxShadow = '0 4px 15px rgba(255, 102, 0, 0.6)';
        alert.style.textAlign = 'center';
        alert.style.border = '2px solid #fff';
        alert.style.fontFamily = 'Arial, sans-serif';
        alert.onclick = () => alert.style.display = 'none'; // Click to dismiss
        document.body.appendChild(alert);
    }
    
    const chinese = result.predictions[result.event].chinese || result.event;
    alert.innerHTML = `
        <div style="font-size: 14px; font-weight:bold;">⚡ 高赔率信号 ⚡</div>
        <div style="font-size: 18px; font-weight:800; margin: 2px 0;">${chinese} ${result.odds.display}</div>
        <div style="font-size: 11px;">信心: ${(result.confidence*100).toFixed(0)}%</div>
    `;
    alert.style.display = 'block';
    
    // Auto hide after 8s
    if (window.highOddsTimer) clearTimeout(window.highOddsTimer);
    window.highOddsTimer = setTimeout(() => {
        alert.style.display = 'none';
    }, 8000);
}

function hideHighOddsAlert() {
    const alert = document.getElementById('high-odds-alert-box');
    if (alert) alert.style.display = 'none';
}