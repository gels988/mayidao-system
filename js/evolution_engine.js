
// 🧬 进化引擎 (Evolution Engine)
// 核心职责：监控预测准确率，动态调整三轴权重，实现数字生命的"进化"
// Doc ID: EVOLUTION-ENGINE-20260131

class EvolutionEngine {
    constructor() {
        this.version = "1.0.0";
        this.generation = 1; // 当前代数
        this.records = [];   // 历史记录
        this.accuracyHistory = [];
        
        // 初始基因权重 (三轴)
        this.weights = {
            geneAxis: 0.34,    // 数字基因
            guaAxis: 0.33,     // 卦象空间
            balanceAxis: 0.33  // 动态平衡
        };
        
        this.init();
    }

    init() {
        console.log(`🧬 进化引擎 v${this.version} 正在启动...`);
        this.loadGene();
        
        // 挂载到全局
        window.evolutionEngine = this;
        console.log("✅ 进化引擎挂载完成，当前权重:", this.weights);
    }

    // 加载基因
    loadGene() {
        const saved = localStorage.getItem('mayiju_evolution_gene');
        if (saved) {
            try {
                const data = JSON.parse(saved);
                this.weights = data.weights;
                this.generation = data.generation;
                console.log(`🧬 读取存档基因 (第${this.generation}代)`);
            } catch(e) {
                console.warn("⚠️ 基因存档损坏，重置为初代");
            }
        }
    }

    // 保存基因
    saveGene() {
        const data = {
            weights: this.weights,
            generation: this.generation,
            timestamp: Date.now()
        };
        localStorage.setItem('mayiju_evolution_gene', JSON.stringify(data));
    }

    // 记录每一次预测结果 (由 addRecord 调用)
    // 注意：在这个简易版中，我们在输入时并不知道"真实结果"（胜负），
    // 除非用户手动标记，或者我们假设输入就是结果（如果是历史数据录入）。
    // 为了闭环，我们假设：用户输入的 mol/den 会产生一个自然结果（如比大小），
    // 我们用预测值去对比这个自然结果。
    feedback(inputData, predictionResult) {
        // inputData: { mol, den }
        // predictionResult: { winner: 'blue'/'red', confidence, sValue }
        
        if (!inputData || !predictionResult) return;

        // 计算自然结果 (Ground Truth) - 这里暂定为比大小，实际可能更复杂
        const molSum = this.calculateSum(inputData.mol);
        const denSum = this.calculateSum(inputData.den);
        // 如果是数字本身对比：
        // const actualWinner = parseInt(inputData.mol) > parseInt(inputData.den) ? 'blue' : 'red';
        // 如果是和值对比：
        const actualWinner = molSum > denSum ? 'blue' : 'red';

        const isCorrect = predictionResult.winner === actualWinner;
        
        this.records.push({
            input: inputData,
            prediction: predictionResult,
            actual: actualWinner,
            isCorrect: isCorrect,
            timestamp: Date.now()
        });

        console.log(`🧬 进化反馈: 预测${predictionResult.winner} vs 实际${actualWinner} => ${isCorrect ? '✅' : '❌'}`);

        // 每10局触发一次进化评估
        if (this.records.length % 10 === 0) {
            this.evolve();
        }
    }

    // 辅助求和
    calculateSum(val) {
        return String(val).split('').reduce((a,b) => a + parseInt(b), 0);
    }

    // 进化逻辑
    evolve() {
        const recent = this.records.slice(-10);
        const correctCount = recent.filter(r => r.isCorrect).length;
        const accuracy = correctCount / 10;
        
        console.group(`🧬 第 ${this.generation} 代进化评估`);
        console.log(`近期准确率: ${(accuracy*100).toFixed(0)}%`);

        if (accuracy < 0.6) {
            console.log("⚠️ 准确率过低，触发基因突变 (Mutation)...");
            this.mutate();
        } else {
            console.log("✅ 基因表现稳定，保持当前权重");
        }
        
        this.generation++;
        this.saveGene();
        console.groupEnd();
    }

    // 突变：随机调整权重
    mutate() {
        // 简单随机扰动
        const adjustment = (Math.random() - 0.5) * 0.1; // +/- 0.05
        
        // 随机选择一个轴增强，另一个轴减弱
        const keys = Object.keys(this.weights);
        const k1 = keys[Math.floor(Math.random() * keys.length)];
        let k2 = keys[Math.floor(Math.random() * keys.length)];
        while(k1 === k2) k2 = keys[Math.floor(Math.random() * keys.length)];

        this.weights[k1] = Math.max(0.1, Math.min(0.9, this.weights[k1] + adjustment));
        this.weights[k2] = Math.max(0.1, Math.min(0.9, this.weights[k2] - adjustment));
        
        // 归一化
        const total = Object.values(this.weights).reduce((a,b) => a+b, 0);
        for(let k of keys) {
            this.weights[k] = this.weights[k] / total;
        }

        console.log("🧬 突变后权重:", this.weights);
    }
}

// 立即实例化
new EvolutionEngine();
