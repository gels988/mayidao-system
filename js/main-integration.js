// ========== 主界面集成 ========== 
// 文件: main-integration.js 

/** 
 * 主界面集成 
 */ 
class MainIntegration { 
    constructor() { 
        this.initialized = false; 
    } 
    
    init() { 
        if (this.initialized) return; 
        
        console.log('🚀 主界面集成初始化...'); 
        
        window.allRecords = window.allRecords || []; 
        window.multiModelVote = window.multiModelVote || (window.MultiModelVote ? new MultiModelVote() : null); 
        
        this.initHighOddsSystem(); 
        this.bindEvents(); 
        this.updateAllDisplays(); 
        
        this.initialized = true; 
        console.log('✅ 主界面集成初始化完成'); 
    } 
    
    initHighOddsSystem() { 
        if (typeof window.HighOddsPredictor !== 'function') { 
            console.error('❌ HighOddsPredictor未加载'); 
            return; 
        } 
        
        if (typeof window.HighOddsDisplay !== 'function') { 
            console.error('❌ HighOddsDisplay未加载'); 
            return; 
        } 
        
        if (!window.highOddsDisplay) { 
            window.highOddsDisplay = new window.HighOddsDisplay(); 
        } 
        
        window.highOddsDisplay.init(); 
        
        console.log('✅ 高赔率系统初始化完成'); 
    } 
    
    bindEvents() { 
        const originalPush = Array.prototype.push; 
        // 使用箭头函数会导致 arguments 不可用，所以使用普通函数
        const self = this;
        Array.prototype.push = function(...args) { 
            const result = originalPush.apply(this, args); 
            
            if (this === window.allRecords) { 
                args.forEach(record => { 
                    if (record && typeof record === 'object') { 
                        if (self) { 
                            self.onRecordAdded(record); 
                        } 
                    } 
                }); 
            } 
            
            return result; 
        }; 
        
        window.addEventListener('load', () => { 
            this.updateAllDisplays(); 
        }); 
        
        setInterval(() => { 
            this.updateHighOddsDisplay(); 
        }, 1000); 
    } 
    
    onRecordAdded(record) { 
        if (!record) return; 
        
        record.timestamp = record.timestamp || Date.now(); 
        record.color = record.color || (record.molSum > record.denSum ? 'blue' : 'red'); 
        
        this.updateAllDisplays(); 
        
        console.log('✅ 记录已添加:', record); 
    } 
    
    updateHighOddsDisplay() { 
        // 禁用外部更新，完全交由 index.html 内部逻辑控制
        return;

        /*
        if (!window.highOddsDisplay || !window.allRecords) return; 
        
        try { 
            window.highOddsDisplay.update(window.allRecords); 
        } catch (e) { 
            console.error('❌ 高赔率显示更新失败:', e); 
        } 
        */
    } 
    
    updateAllDisplays() { 
        this.updateHighOddsDisplay(); 
        if (typeof window.initAndRenderGrid === 'function') {
            window.initAndRenderGrid();
        }
    } 
    
    addRecord(record) { 
        if (!record) return; 
        
        record.timestamp = record.timestamp || Date.now(); 
        record.color = record.color || (record.molSum > record.denSum ? 'blue' : 'red'); 
        
        window.allRecords.push(record); 
        
        // this.updateAllDisplays(); // push 已经被劫持，这里不需要重复调用
        
        console.log('✅ 记录已添加:', record); 
    } 
    
    healthCheck() { 
        return { 
            allRecords: window.allRecords.length, 
            hasMultiModel: !!window.multiModelVote, 
            hasHighOdds: !!window.highOddsDisplay, 
            highOddsReady: window.highOddsDisplay && 
                          typeof window.highOddsDisplay.update === 'function' 
        }; 
    } 
} 

window.mainIntegration = new MainIntegration(); 

document.addEventListener('DOMContentLoaded', () => { 
    window.mainIntegration.init(); 
}); 

window.addRecord = (record) => { 
    if (window.mainIntegration) { 
        window.mainIntegration.addRecord(record); 
    } 
}; 

window.updateHighOddsDisplay = () => { 
    if (window.mainIntegration) { 
        window.mainIntegration.updateHighOddsDisplay(); 
    } 
}; 

console.log('✅ 主界面集成代码加载完成');
