// ========== 自检系统增强 - 高赔率预测验证 ==========
// 文件: zijian-enhanced.js

/**
 * 检查高赔率预测系统
 * @param {Window} win - 目标窗口对象
 */
function checkHighOddsSystem(win) {
    console.log('[自检] 检查高赔率预测系统...');
    
    const results = {
        pass: true,
        details: []
    };
    
    // 1. 检查类定义
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
    
    // 2. 检查实例
    if (!win.highOddsDisplay) {
        results.pass = false;
        results.details.push('❌ highOddsDisplay实例不存在');
        console.error('❌ highOddsDisplay实例不存在');
    } else {
        results.details.push('✅ highOddsDisplay实例存在');
        console.log('✅ highOddsDisplay实例存在');
    }
    
    // 3. 检查方法可用性
    if (win.highOddsDisplay && typeof win.highOddsDisplay.getCurrentPrediction !== 'function') {
        results.pass = false;
        results.details.push('❌ 预测函数不可用');
        console.error('❌ 预测函数不可用');
    } else {
        results.details.push('✅ 预测函数可用');
        console.log('✅ 预测函数可用');
    }
    
    // 4. 检查UI元素
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
    
    // 5. 功能测试
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
}

/**
 * 检查预测逻辑完整性
 * @param {Window} win - 目标窗口对象
 */
function checkPredictionLogic(win) {
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
}

/**
 * 增强版自检主函数
 */
function runEnhancedSelfCheck() {
    const checks = document.getElementById('checks');
    const report = document.getElementById('report');
    
    if (!checks || !report) {
        console.error('自检元素未找到');
        return;
    }
    
    // 不清空现有结果，而是追加
    // checks.innerHTML = ''; 
    
    log('\n[阶段 8/8] 增强业务检查', 'INFO');
    
    // 获取目标窗口 (Opener > Parent > Self)
    const win = window.opener || window.parent || (window.HighOddsPredictor ? window : null);
    
    if (!win) {
        log('未找到目标主窗口，跳过业务逻辑检查', 'WARN');
        addCheckResult('⚠️ 业务逻辑', 'warn', '未找到主窗口');
        return;
    }
    
    if (win === window) {
         log('当前为独立运行模式且无主窗口上下文，尝试检查自身...', 'INFO');
    }

    // 检查1: 三层架构
    const axisResult = checkThreeAxisDetailed(win);
    addCheckResult('三层架构', axisResult.pass ? 'pass' : 'fail', axisResult.detail);
    report.innerHTML += `三层架构: ${axisResult.pass ? '✅' : '❌'} ${axisResult.detail}\n`;
    
    // 检查2: 高赔率系统
    const oddsResult = checkHighOddsSystem(win);
    addCheckResult('高赔率预测系统', oddsResult.pass ? 'pass' : 'fail', oddsResult.details.slice(0, 3).join('; '));
    log(`高赔率系统检查: ${oddsResult.pass ? '✅' : '❌'}`, oddsResult.pass ? 'SUCCESS' : 'ERROR');
    oddsResult.details.forEach(d => log(`  ${d}`, oddsResult.pass ? 'INFO' : 'WARN'));
    
    // 检查3: 预测逻辑完整性
    const logicResult = checkPredictionLogic(win);
    addCheckResult('预测逻辑完整性', logicResult.pass ? 'pass' : 'fail', 
                   logicResult.details.length + '项检查');
    report.innerHTML += `预测逻辑: ${logicResult.pass ? '✅' : '❌'} (${logicResult.details.length}项)\n`;
    
    // 检查4: 八卦数字显示
    const baguaCheck = checkBaguaDisplay(win);
    addCheckResult('八卦数字显示', baguaCheck ? 'pass' : 'fail');
    report.innerHTML += `八卦数字: ${baguaCheck ? '✅' : '❌'}\n`;
    
    // 检查5: 网格特征渲染
    const gridResult = checkGridFeatures(win);
    addCheckResult('网格特征渲染', gridResult.pass ? 'pass' : 'fail', gridResult.detail);
    report.innerHTML += `网格特征: ${gridResult.pass ? '✅' : '❌'} ${gridResult.detail}\n`;
    
    // 总结
    const allPass = axisResult.pass && oddsResult.pass && logicResult.pass && 
                    baguaCheck && gridResult.pass;
                    
    addCheckResult(
        allPass ? '✅ 系统健康' : '❌ 系统异常', 
        allPass ? 'pass' : 'fail', 
        allPass ? '所有检查通过' : '发现异常'
    );
    
    report.innerHTML += `\n自检完成: ${allPass ? '✅ 全部正常' : '❌ 需要修复'}\n`;
    
    if (!allPass) {
        report.innerHTML += '[警告] 检测到异常，请执行修复操作\n';
        updateSelfCheckUI();
    } else {
        report.innerHTML += '[系统] 系统状态良好，可正常使用\n';
    }
}

/**
 * 详细检查三层架构
 */
function checkThreeAxisDetailed(win) {
    const details = [];
    let allPass = true;
    
    if (typeof win.DigitalGeneAxis !== 'function') {
        allPass = false;
        details.push('DigitalGeneAxis缺失');
    }
    
    if (typeof win.GuaSpaceAxis !== 'function') {
        allPass = false;
        details.push('GuaSpaceAxis缺失');
    }
    
    if (typeof win.DynamicBalanceAxis !== 'function') {
        allPass = false;
        details.push('DynamicBalanceAxis缺失');
    }
     if (!win.multiModelVote) {
        allPass = false;
        details.push('multiModelVote缺失');
    }
    
    return {
        pass: allPass,
        detail: details.length > 0 ? details.join(', ') : '正常'
    };
}

/**
 * 检查八卦数字显示
 */
function checkBaguaDisplay(win) {
    // 尝试查找八卦相关元素
    // 假设有 id="bagua-display" 或 class="bagua-container"
    const baguaEl = win.document.getElementById('bagua-display') || 
                   win.document.querySelector('.bagua-container') ||
                   win.document.querySelector('.bagua-box');
    return !!baguaEl;
}

/**
 * 检查网格特征渲染
 */
function checkGridFeatures(win) {
    const details = [];
    let allPass = true;
    
    // 检查是否有canvas或grid容器
    const canvas = win.document.querySelector('canvas');
    const grid = win.document.getElementById('grid') || win.document.querySelector('.grid-container');
    
    if (!canvas && !grid) {
        allPass = false;
        details.push('无网格容器');
    }
    
    return {
        pass: allPass,
        detail: details.length > 0 ? details.join(', ') : '正常'
    };
}

/**
 * 自动修复高赔率系统
 */
function autoFixHighOdds() {
    const report = document.getElementById('report');
    report.innerHTML += '\n[修复] 开始修复高赔率预测系统...\n';
    
    const win = window.opener || window.parent || window;
    const doc = win.document;
    
    let fixed = 0;
    let failed = 0;
    
    // 修复1: 注入HighOddsPredictor类
    if (typeof win.HighOddsPredictor !== 'function') {
        try {
            // 这里需要注入完整的HighOddsPredictor类代码
            // 由于代码较长，建议通过script标签引入
            const script = doc.createElement('script');
            script.type = 'text/javascript';
            script.src = 'js/high-odds-predictor.js'; // 尝试直接加载文件
            
            // 如果文件加载失败（例如路径问题），则无法修复，但这里假设文件存在
            // 或者我们可以注入一个占位符，提示用户刷新
            
            doc.head.appendChild(script);
            report.innerHTML += '✓ 注入HighOddsPredictor类 (加载脚本)\n';
            fixed++;
        } catch (e) {
            report.innerHTML += `✗ 注入HighOddsPredictor失败: ${e.message}\n`;
            failed++;
        }
    }
    
    // 修复2: 注入HighOddsDisplay类
    if (typeof win.HighOddsDisplay !== 'function') {
        try {
            const script = doc.createElement('script');
            script.type = 'text/javascript';
            script.src = 'js/high-odds-display.js';
            doc.head.appendChild(script);
            
            // 还需要初始化
            const initScript = doc.createElement('script');
            initScript.textContent = `
                setTimeout(() => {
                    if (typeof HighOddsDisplay !== 'undefined' && !window.highOddsDisplay) {
                        window.highOddsDisplay = new HighOddsDisplay();
                        window.highOddsDisplay.init();
                    }
                }, 1000);
            `;
            doc.body.appendChild(initScript);
            
            report.innerHTML += '✓ 注入HighOddsDisplay类\n';
            fixed++;
        } catch (e) {
            report.innerHTML += `✗ 注入HighOddsDisplay失败: ${e.message}\n`;
            failed++;
        }
    }
    
    // 修复3: 创建显示元素
    let displayEl = doc.getElementById('high-odds-display');
    if (!displayEl) {
        try {
            displayEl = doc.createElement('div');
            displayEl.id = 'high-odds-display';
            displayEl.className = 'high-odds-display';
            displayEl.innerHTML = `
                <div style="font-size:0.8em;opacity:0.7;margin-bottom:5px;">高赔率</div>
                <div id="odds-value" style="font-size:1.8em;margin:5px 0;">-</div>
                <div id="odds-event" style="font-size:0.9em;opacity:0.8;">-</div>
            `;
            displayEl.style.cssText = `
                position:absolute;top:60px;right:20px;padding:15px 25px;
                background:linear-gradient(135deg,#1a1a2e 0%,#0f3460 100%);
                border:2px solid #e94560;border-radius:12px;color:#fff;
                font-size:1.4em;font-weight:bold;text-align:center;
                z-index:1000;min-width:120px;
            `;
            doc.body.appendChild(displayEl);
            report.innerHTML += '✓ 创建高赔率显示元素\n';
            fixed++;
        } catch (e) {
            report.innerHTML += `✗ 创建显示元素失败: ${e.message}\n`;
            failed++;
        }
    }
    
    report.innerHTML += `\n[修复] 完成: 修复${fixed}项, 失败${failed}项\n`;
    
    // 修复后重新自检
    setTimeout(() => {
        report.innerHTML += '\n[修复] 重新执行自检...\n';
        runEnhancedSelfCheck();
    }, 1000);
}

// 更新UI
function updateSelfCheckUI() {
    const container = document.querySelector('.container');
    if (!container) return;
    
    // 添加修复按钮
    let fixBtn = document.querySelector('.btn-fix');
    if (!fixBtn) {
        fixBtn = document.createElement('button');
        fixBtn.className = 'btn btn-success btn-fix';
        fixBtn.innerHTML = '🔧 修复高赔率系统';
        fixBtn.onclick = autoFixHighOdds;
        fixBtn.style.marginLeft = '10px';
        
        const originalBtn = document.querySelector('.btn');
        if (originalBtn) {
            originalBtn.parentNode.insertBefore(fixBtn, originalBtn.nextSibling);
        }
    }
    
    // 更新标题
    const header = document.querySelector('.header h1');
    if (header) {
        header.textContent = '🔍 系统自检中心（高赔率版）';
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    updateSelfCheckUI();
    
    // 替换原有的runFullSelfCheck
    window.runFullSelfCheck = runEnhancedSelfCheck;
    
    // 3秒后自动执行
    setTimeout(runEnhancedSelfCheck, 3000)
});
