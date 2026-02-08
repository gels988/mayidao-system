// ========== 自学模块核心 ========== 
class SelfLearningModule { 
  constructor() { 
    this.patterns = this.loadPatterns(); 
    this.baguaPatterns = this.loadBaguaPatterns(); 
    this.accuracy = 0.5; // 初始准确率 
    this.weight = 0.3;   // 初始权重 
  } 
  
  // 局间模式学习 
  learnRoundPattern(history) { 
    if (history.length < 3) return; 
    
    const last2 = history.slice(-2); 
    // Ensure we have color property. If history items are simple objects, adjust accordingly.
    // Based on index.html usage, records seem to have 'color' property or derived from mol/den.
    if (!last2[0].color || !last2[1].color) return;

    const patternKey = `${last2[0].color},${last2[1].color}`; 
    
    // 更新模式统计 
    if (!this.patterns[patternKey]) { 
      this.patterns[patternKey] = { nextBlue: 0, nextRed: 0 }; 
    } 
    
    // 预测下一局 
    const nextColor = history[history.length - 1]?.color || 'blue'; 
    if (nextColor === 'blue') { 
      this.patterns[patternKey].nextBlue++; 
    } else { 
      this.patterns[patternKey].nextRed++; 
    } 
    
    this.savePatterns(); 
  } 
  
  // 八卦模式学习  
  learnBaguaPattern(baguaSequence) { 
    if (baguaSequence.length < 2) return; 
    
    const last2 = baguaSequence.slice(-2); 
    const patternKey = `${last2[0]},${last2[1]}`; 
    
    if (!this.baguaPatterns[patternKey]) { 
      this.baguaPatterns[patternKey] = []; 
    } 
    
    // 记录下一个八卦数字 
    const nextBagua = baguaSequence[baguaSequence.length - 1]; 
    this.baguaPatterns[patternKey].push(nextBagua); 
    
    this.saveBaguaPatterns(); 
  } 
  
  // 预测下一局 
  predictNext(history, baguaSequence) { 
    if (history.length < 2) return { prediction: 'blue', confidence: 0.5 }; 
    
    const last2 = history.slice(-2); 
    if (!last2[0].color || !last2[1].color) return { prediction: 'blue', confidence: 0.5 };

    const patternKey = `${last2[0].color},${last2[1].color}`; 
    
    if (this.patterns[patternKey]) { 
      const stats = this.patterns[patternKey]; 
      const total = stats.nextBlue + stats.nextRed; 
      if (total === 0) return { prediction: 'blue', confidence: 0.5 };

      const blueProb = stats.nextBlue / total; 
      
      return { 
        prediction: blueProb > 0.5 ? 'blue' : 'red', 
        confidence: Math.max(blueProb, 1 - blueProb) 
      }; 
    } 
    
    return { prediction: 'blue', confidence: 0.5 }; 
  } 
  
  // 自我修正（基于预测准确性） 
  updateAccuracy(wasCorrect) { 
    // 滑动平均更新准确率 
    this.accuracy = this.accuracy * 0.9 + (wasCorrect ? 1 : 0) * 0.1; 
    
    // 动态调整权重 
    if (this.accuracy > 0.7) { 
      this.weight = Math.min(0.7, this.weight + 0.05); 
    } else if (this.accuracy < 0.4) { 
      this.weight = Math.max(0.1, this.weight - 0.1); 
    } 
    
    this.saveState(); 
  } 
  
  // 存储管理 
  loadPatterns() { 
    return JSON.parse(localStorage.getItem('selfLearnPatterns') || '{}'); 
  } 
  
  savePatterns() { 
    localStorage.setItem('selfLearnPatterns', JSON.stringify(this.patterns)); 
  } 
  
  loadBaguaPatterns() { 
    return JSON.parse(localStorage.getItem('selfLearnBagua') || '{}'); 
  } 
  
  saveBaguaPatterns() { 
    localStorage.setItem('selfLearnBagua', JSON.stringify(this.baguaPatterns)); 
  } 
  
  loadState() { 
    const state = JSON.parse(localStorage.getItem('selfLearnState') || '{}'); 
    this.accuracy = state.accuracy || 0.5; 
    this.weight = state.weight || 0.3; 
  } 
  
  saveState() { 
    localStorage.setItem('selfLearnState', JSON.stringify({ 
      accuracy: this.accuracy, 
      weight: this.weight 
    })); 
  } 
} 

// 全局实例 
window.selfLearner = new SelfLearningModule(); 

// ========== 集成到现有系统 ========== 
// 在addRecord函数中添加自学逻辑 
window.addEventListener('load', function() {
    console.log("Integrating SelfLearner...");
    if (typeof window.addRecord === 'function') {
        // Check if originalAddRecord is already captured to avoid double wrapping
        if (!window.originalAddRecord) {
            window.originalAddRecord = window.addRecord;
        }

        window.addRecord = function() { 
            // 执行原有逻辑 
            if (window.originalAddRecord) {
                window.originalAddRecord.call(this); 
            }
            
            // 自学模块学习 
            setTimeout(() => { 
                if (window.allRecords && window.allRecords.length >= 2) { 
                    window.selfLearner.learnRoundPattern(window.allRecords); 
                } 
                
                if (window.baguaNumbers && window.baguaNumbers.length >= 2) { 
                    window.selfLearner.learnBaguaPattern(window.baguaNumbers); 
                } 
                
                // 显示自学洞察 
                updateSelfLearnInsights(); 
            }, 100); 
        };
        console.log("SelfLearner integrated into addRecord.");
    } else {
        console.error("addRecord function not found!");
    }
}); 

// 更新自学面板 
function updateSelfLearnInsights() { 
  const insights = document.getElementById('selfLearnInsights'); 
  if (!insights) return; 
  
  const learner = window.selfLearner; 
  insights.innerHTML = ` 
    <div>📊 准确率: ${(learner.accuracy * 100).toFixed(1)}%</div> 
    <div>⚖️ 权重: ${(learner.weight * 100).toFixed(1)}%</div> 
    <div>📈 学习样本: ${Object.keys(learner.patterns).length} 种模式</div> 
  `; 
} 

// 打开自学面板 
function openSelfLearn() { 
  const panel = document.getElementById('selfLearnPanel');
  if (panel) {
      panel.style.display = 'block'; 
      updateSelfLearnInsights(); 
  } else {
      console.error("selfLearnPanel not found!");
  }
} 

// 关闭自学面板  
function closeSelfLearn() { 
  const panel = document.getElementById('selfLearnPanel');
  if (panel) {
      panel.style.display = 'none'; 
  }
} 

console.log('🧠 自学模块已加载');