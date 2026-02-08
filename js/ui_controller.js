/**
 * ui_controller.js
 * UI显示控制器 - S值直连修正版
 * 
 * 职责: 将S值直接映射到红蓝圆圈视觉表现
 * 约束: 无中间变量，直接连接后台逻辑
 */

class UIController {
    constructor() {
        this.name = 'UIController';
        // 绑定到全局，方便调用
        window.uiController = this;
    }

    /** 
     * UI显示控制器 - 置信度增强版 
     * 1. 高置信：实体红/蓝圆圈 
     * 2. 低置信：绿圆圈 + 红/蓝晕圈 
     */ 
    updatePredictionDisplay(sValue, confidence = 0.6) { 
        const circle = document.getElementById('prediction-circle'); 
        const halo = document.getElementById('halo'); 
        const textEl = document.getElementById('prediction-text'); 
        
        if (!circle) return; 
    
        // 重置状态 
        circle.className = 'main-prediction-circle'; 
        if (halo) halo.className = 'halo hidden'; 
        if (textEl) textEl.textContent = `S: ${sValue.toFixed(1)}%`; 
    
        // 高置信判断 (confidence > 0.8) 
        const isHighConf = confidence > 0.8; 
    
        if (sValue > 0) { 
            // 蓝色系信号 
            if (isHighConf) { 
                circle.classList.add('pred-circle-blue'); // 实体蓝 
            } else { 
                circle.classList.add('pred-circle-green'); // 低置信显示绿圆 
                if (halo) { 
                    halo.className = 'halo halo-blue'; // 配合蓝晕 
                    halo.classList.remove('hidden'); 
                } 
            } 
        } else if (sValue < 0) { 
            // 红色系信号 
            if (isHighConf) { 
                circle.classList.add('pred-circle-red'); // 实体红 
            } else { 
                circle.classList.add('pred-circle-green'); // 低置信显示绿圆 
                if (halo) { 
                    halo.className = 'halo halo-red'; // 配合红晕 
                    halo.classList.remove('hidden'); 
                } 
            } 
        } else { 
            circle.classList.add('pred-circle-green'); 
        } 
    }

    /**
     * 显示补牌反噬警示
     */
    showAntiEffectWarning(xValue, deltaS) {
        const indicator = document.getElementById('anti-effect-indicator');
        if (!indicator) return;

        if (xValue < 0.3 && Math.abs(deltaS) > 5) {
            indicator.style.display = 'block';
            indicator.textContent = `补牌反噬: ${deltaS.toFixed(1)}%`;
            indicator.style.color = '#ffcc00'; // Warning color
        } else {
            indicator.style.display = 'none';
        }
    }
}

// ==========================================
// 自检逻辑 (Self Check)
// ==========================================

// 启动时自检
window.startupSelfCheck = function() {
    console.log("[SelfCheck] Starting...");
    const checks = {
        modelALoaded: typeof window.DigitalGeneAxis !== 'undefined',
        modelBLoaded: typeof window.GuaSpaceAxis !== 'undefined',
        modelCLoaded: typeof window.DynamicBalanceAxis !== 'undefined',
        uiControllerReady: typeof window.UIController !== 'undefined',
        // Simple database/storage check
        storageAccess: (function(){ try{ localStorage.setItem('test','1'); return true;}catch(e){return false;} })()
    };
    
    console.table(checks);
    const allPass = Object.values(checks).every(status => status === true);
    console.log("[SelfCheck] Result:", allPass ? "PASS" : "FAIL");
    return allPass;
};

// 运行时自检
window.runtimeSelfCheck = function(history) {
    try {
        if (!window.multiModelVote) return false;
        const prediction = window.multiModelVote.predict(history);
        const valid = prediction.sValue !== undefined && prediction.sValue !== null && prediction.confidence >= 0;
        console.log("[RuntimeCheck] Prediction valid:", valid, prediction);
        return valid;
    } catch (error) {
        console.error('[RuntimeCheck] Failed:', error);
        return false;
    }
};

// UI一致性自检
window.uiConsistencyCheck = function(sValue) {
    const circle = document.getElementById('prediction-circle');
    const halo = document.getElementById('halo');
    if (!circle) return false;
    
    // Check logic
    // We can't easily check 'includes' on className if we overwrote it, but we can check explicit classes
    // Note: UIController overwrites className = ...
    
    const currentClass = circle.className;
    const haloClass = halo ? halo.className : '';
    
    let consistent = false;
    
    if (sValue > 15) {
        consistent = currentClass.includes('player-solid') || currentClass.includes('blue');
    } else if (sValue < -15) {
        consistent = currentClass.includes('banker-solid') || currentClass.includes('red');
    } else if (sValue > 0) {
        consistent = currentClass.includes('green') && haloClass.includes('glow-blue');
    } else if (sValue < 0) {
        consistent = currentClass.includes('green') && haloClass.includes('glow-red');
    } else {
        consistent = currentClass.includes('green') && (!halo || haloClass.includes('hidden'));
    }
    
    console.log(`[UICheck] S=${sValue}, Class=${currentClass}, Halo=${haloClass} -> Consistent: ${consistent}`);
    return consistent;
};

// ========== 自检系统增强 - 高赔率预测验证 ==========
/**
 * 检查高赔率预测系统
 */
window.checkHighOddsSystem = function(win = window) {
    console.log('[自检] 检查高赔率预测系统...');
    
    const results = {
        pass: true,
        details: []
    };
    
    if (typeof win.HighOddsPredictor !== 'function') {
        results.pass = false;
        results.details.push('❌ HighOddsPredictor类不存在');
        console.error('❌ HighOddsPredictor类不存在');
    } else {
        results.details.push('✅ HighOddsPredictor类存在');
        console.log('✅ HighOddsPredictor类存在');
    }
    
    if (typeof win.HighOddsDisplay !== 'function') {
        results.pass = false;
        results.details.push('❌ HighOddsDisplay类不存在');
        console.error('❌ HighOddsDisplay类不存在');
    } else {
        results.details.push('✅ HighOddsDisplay类存在');
        console.log('✅ HighOddsDisplay类存在');
    }
    
    if (!win.highOddsDisplay) {
        results.pass = false;
        results.details.push('❌ highOddsDisplay实例不存在');
        console.error('❌ highOddsDisplay实例不存在');
    } else {
        results.details.push('✅ highOddsDisplay实例存在');
        console.log('✅ highOddsDisplay实例存在');
    }
    
    if (win.highOddsDisplay && typeof win.highOddsDisplay.getCurrentPrediction !== 'function') {
        results.pass = false;
        results.details.push('❌ 预测函数不可用');
        console.error('❌ 预测函数不可用');
    } else {
        results.details.push('✅ 预测函数可用');
        console.log('✅ 预测函数可用');
    }
    
    const displayEl = win.document.getElementById('high-odds-display') ||
                     win.document.querySelector('.high-odds-display');
    
    if (!displayEl) {
        results.pass = false;
        results.details.push('❌ 显示元素不存在');
        console.error('❌ 显示元素不存在');
    } else {
        results.details.push('✅ 显示元素存在');
        console.log('✅ 显示元素存在');
    }
    
    try {
        const testHistory = [
            { mol: [1, 2], den: [3, 4], molSum: 3, denSum: 7, playerPoints: 3, bankerPoints: 7 },
            { mol: [5, 6], den: [7, 8], molSum: 11, denSum: 15, playerPoints: 1, bankerPoints: 5 },
            { mol: [2, 3], den: [4, 5], molSum: 5, denSum: 9, playerPoints: 5, bankerPoints: 9 },
            { mol: [6, 7], den: [8, 9], molSum: 13, denSum: 17, playerPoints: 3, bankerPoints: 7 },
            { mol: [0, 1], den: [2, 3], molSum: 1, denSum: 5, playerPoints: 1, bankerPoints: 5 },
            { mol: [4, 5], den: [6, 7], molSum: 9, denSum: 13, playerPoints: 9, bankerPoints: 3 }
        ];
        
        const prediction = win.highOddsDisplay.getCurrentPrediction(testHistory);
        
        if (!prediction || !prediction.event) {
            results.pass = false;
            results.details.push('❌ 预测功能异常（返回空）');
            console.error('❌ 预测功能异常（返回空）');
        } else {
            results.details.push(`✅ 预测功能正常（${prediction.event}，${(prediction.confidence * 100).toFixed(1)}%）`);
            console.log(`✅ 预测功能正常: ${prediction.event}, ${(prediction.confidence * 100).toFixed(1)}%`);
        }
    } catch (e) {
        results.pass = false;
        results.details.push(`❌ 预测功能异常: ${e.message}`);
        console.error('❌ 预测功能异常:', e);
    }
    
    return results;
};

/**
 * 检查预测逻辑完整性
 */
window.checkPredictionLogic = function(win = window) {
    console.log('[自检] 检查预测逻辑完整性...');
    
    const results = {
        pass: true,
        details: []
    };
    
    if (!win.highOddsDisplay || !win.highOddsDisplay.predictor) {
        results.pass = false;
        results.details.push('❌ 预测器未初始化');
        return results;
    }
    
    const predictor = win.highOddsDisplay.predictor;
    
    const events = ['banker6', 'tie', 'pair', 'player8', 'player7', 'crown', 'panda'];
    
    events.forEach(event => {
        const funcName = `predict${event.charAt(0).toUpperCase() + event.slice(1)}`;
        if (typeof predictor[funcName] !== 'function') {
            results.pass = false;
            results.details.push(`❌ ${event}预测函数缺失`);
            console.error(`❌ ${event}预测函数缺失`);
        } else {
            results.details.push(`✅ ${event}预测函数存在`);
            console.log(`✅ ${event}预测函数存在`);
        }
    });
    
    const helpers = ['hasTriangleStructure', 'calculateRemainder', 'hasSpecialStructure'];
    
    helpers.forEach(helper => {
        if (typeof predictor[helper] !== 'function') {
            results.pass = false;
            results.details.push(`❌ 辅助函数${helper}缺失`);
            console.error(`❌ 辅助函数${helper}缺失`);
        } else {
            results.details.push(`✅ 辅助函数${helper}存在`);
            console.log(`✅ 辅助函数${helper}存在`);
        }
    });
    
    return results;
};


// 实例化
window.UIController = UIController; // Export Class
window.uiInstance = new UIController();
console.log("[UIController] Loaded. Ready to link S-Value.");
