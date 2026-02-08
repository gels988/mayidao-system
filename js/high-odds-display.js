// ========== 高赔率显示更新逻辑 (In-Grid Integration) ========== 
// 文件: high-odds-display.js 

/** 
 * 高赔率显示更新器 
 * 改版：不再创建悬浮窗，直接接管主界面的 #multiplierValue 模块
 */ 
class HighOddsDisplay { 
    constructor() { 
        this.predictor = new HighOddsPredictor(); 
        this.targetElement = null;
        // State for auto-hide logic
        this.lastAlertedEvent = null;
        this.lastAlertedRoundIndex = -1;
    } 
    
    /** 
     * 初始化显示元素 
     */ 
    init() { 
        // 查找主界面的高倍显示框
        this.targetElement = document.getElementById('multiplierValue'); 
        
        if (this.targetElement) {
            console.log('✅ 高赔率模块已连接到主界面 #multiplierValue'); 
        } else {
            console.warn('⚠️ 未找到 #multiplierValue 元素');
        }
    } 
    
    /** 
     * 创建显示元素 (已废弃)
     */ 
    createDisplayElement() { 
        // Do nothing - we use existing UI
    } 
    
    /** 
     * 创建提示元素 (已废弃)
     */ 
    createTooltipElement() { 
        // Do nothing
    } 
    
    /** 
     * 显示提示 (已废弃)
     */ 
    showTooltip() {} 
    
    /** 
     * 隐藏提示 (已废弃)
     */ 
    hideTooltip() {} 

    /**
     * 销毁显示元素 (已废弃)
     */
    destroy() {}
    
    /** 
     * 更新显示 
     * @param {Array} history - 历史记录 
     */ 
    update(history) { 
        if (!this.targetElement) { 
            this.init(); 
        } 
        
        if (!this.targetElement) return;

        // 如果历史记录不足6局，显示默认状态
        if (!history || history.length < 6) {
             this.targetElement.textContent = '-';
             this.targetElement.style.color = '#000'; // Default black
             this.targetElement.style.background = 'linear-gradient(135deg, #ffd700, #ffaa00)'; // Default gold
             return;
        }
        
        // 执行预测 
        const prediction = this.predictor.predict(history); 
        const event = prediction.event;
        const confidence = prediction.confidence;

        // 映射事件名称 (含倍率)
        const eventNames = { 
             banker6: '红6 x12', 
             tie: '平牌 x8', 
             pair: '对子 x11', 
             player8: '闲8 x12', 
             player7: '蓝7 x12', 
             crown: '皇冠 x30', 
             panda: '熊猫 x25',
             balance: '平衡'
        }; 

        const currentRoundIndex = history.length;

        if (confidence < 0.6) { 
            // 置信度低，恢复"-"
            this.targetElement.textContent = '-'; 
            this.targetElement.style.color = '#555'; 
            this.targetElement.style.background = '#ccc'; 
            this.targetElement.style.boxShadow = 'none';
        } else {
            // 自动消失逻辑：如果上一局已显示相同事件，本局自动隐藏 (恢复"-")
            if (this.lastAlertedEvent === event && (currentRoundIndex - this.lastAlertedRoundIndex) === 1) {
                 this.targetElement.textContent = '-';
                 this.targetElement.style.color = '#555'; 
                 this.targetElement.style.background = '#ccc'; 
                 this.targetElement.style.boxShadow = 'none';
                 console.log(`[HighOdds] Auto-hide persistent ${event} at round ${currentRoundIndex}`);
                 
                 // 关键修复：即使隐藏，也要更新局数索引，以保持连续性判断，防止隔局闪烁
                 this.lastAlertedRoundIndex = currentRoundIndex;
                 return;
            }

            // 更新状态
            this.lastAlertedEvent = event;
            this.lastAlertedRoundIndex = currentRoundIndex;

            // 显示预测结果
            const name = eventNames[event] || event;
            this.targetElement.textContent = name;
            
            // 特定事件样式优先
            if (event === 'player7') { // Blue 7
                this.targetElement.style.color = '#fff';
                this.targetElement.style.background = 'linear-gradient(135deg, #00008b, #1e90ff)';
                this.targetElement.style.boxShadow = '0 0 10px #1e90ff';
            } else if (event === 'banker6') { // Red 6
                this.targetElement.style.color = '#fff';
                this.targetElement.style.background = 'linear-gradient(135deg, #8b0000, #ff4444)';
                this.targetElement.style.boxShadow = '0 0 10px #ff4444';
            } else if (event === 'panda') { // Panda
                this.targetElement.style.color = '#fff';
                this.targetElement.style.background = 'linear-gradient(135deg, #000, #444)';
                this.targetElement.style.boxShadow = '0 0 10px #000';
            } else if (event === 'crown') { // Crown
                this.targetElement.style.color = '#fff';
                this.targetElement.style.background = 'linear-gradient(135deg, #ffd700, #ffa500)';
                this.targetElement.style.boxShadow = '0 0 15px #ffd700';
            } else {
                // 默认基于置信度
                if (confidence >= 0.85) { 
                    this.targetElement.style.color = '#fff'; 
                    this.targetElement.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)'; 
                } else if (confidence >= 0.75) { 
                    this.targetElement.style.color = '#000'; 
                    this.targetElement.style.background = 'linear-gradient(135deg, #ffd700, #ffaa00)'; 
                } else { 
                    this.targetElement.style.color = '#000'; 
                    this.targetElement.style.background = 'linear-gradient(135deg, #aaddaa, #88cc88)'; 
                }
                this.targetElement.style.boxShadow = 'none';
            }
        }
        
        console.log(`[高赔率] 显示: ${this.targetElement.textContent}, 置信度: ${confidence.toFixed(2)}`);
    } 
    
    /** 
     * 获取当前预测 
     */ 
    getCurrentPrediction(history) { 
        return this.predictor.predict(history); 
    } 
} 

// Explicitly export class to window
window.HighOddsDisplay = HighOddsDisplay;

// 全局实例 
window.highOddsDisplay = new HighOddsDisplay(); 

// 自动初始化 
document.addEventListener('DOMContentLoaded', () => { 
   window.highOddsDisplay.init(); 
}); 

// 定时更新（每秒） 
setInterval(() => { 
    if (window.allRecords && window.highOddsDisplay) { 
        window.highOddsDisplay.update(window.allRecords); 
    } 
}, 1000);
