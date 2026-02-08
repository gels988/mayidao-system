
// Mock browser environment FIRST
global.window = {
    crypto: { getRandomValues: (arr) => arr },
    localStorage: { getItem: () => null, setItem: () => null }
};
global.localStorage = global.window.localStorage;
global.document = {
    getElementById: () => ({ 
        addEventListener: () => {}, 
        classList: { add:()=>{}, remove:()=>{} },
        style: {},
        innerHTML: ''
    }),
    querySelectorAll: () => []
};

// Then load modules
require('./js/core_engine.js');
const CoreEngine = window.G2Engine;
const { UIController } = require('./js/ui_controller.js');


// Load EncryptedLogic (it attaches to window)
require('./js/encrypted_logic.js');

async function verifyStructureV3() {
    console.log("=== Starting Structural Prediction v3.0 Verification ===");
    
    const engine = new CoreEngine();
    
    // Test 1: Bagua Structure Recognition (Direct ModelB Test)
    console.log("\n--- Test 1: Bagua Structure Recognition (Direct) ---");
    // We need to access internal functions of EncryptedLogic. 
    // Since they are not exported, we simulate by running a sequence that produces known Bagua.
    // 1-8 corresponds to 3 Blue then 3 Red? No, let's check the mapping.
    // 1 (Bagua) -> 001 (Bin) -> RRB? No, let's check BIN_TO_BAGUA in code.
    // In code: 7->1 (111->1?), 0->8 (000->8?).
    // Let's rely on the auto-generation logic we saw.
    // Blue=1, Red=0.
    // 1-8: 
    // Bagua 1 comes from Bin 7 (111) -> Blue Blue Blue
    // Bagua 8 comes from Bin 0 (000) -> Red Red Red
    // So 1-8 is Blue(3)-Red(3). This is 'strong_trend'.
    
    // Let's feed 6 rounds: Blue, Blue, Blue, Red, Red, Red.
    // This should form Bagua pair for the *next* round? 
    // generateBaguaSequence takes history.
    // If history has 6 items. 
    // Group 1 (oldest 3): items 0,1,2. Group 2 (newest 3): items 3,4,5.
    // Wait, generateBaguaSequence usually takes the last 6.
    
    // Sequence: B, B, B, R, R, R
    // P_sum > B_sum for Blue.
    const seq18 = [
        { playerVal: 8, bankerVal: 2 }, // Blue
        { playerVal: 8, bankerVal: 2 }, // Blue
        { playerVal: 8, bankerVal: 2 }, // Blue
        { playerVal: 2, bankerVal: 8 }, // Red
        { playerVal: 2, bankerVal: 8 }, // Red
        { playerVal: 2, bankerVal: 8 }  // Red
    ];
    
    engine.history = [];
    seq18.forEach(r => engine.processRound(r.playerVal, r.bankerVal));
    
    // Now predict for next round
    // We need to invoke MultiModelVote.
    // CoreEngine.predictNext() calls window.EncryptedLogic.MultiModelVote(this.history).
    
    // Construct context object as MultiModelVote expects { history, rawHistory: history }
    const context18 = { history: engine.history, rawHistory: engine.history };
    const pred18 = window.EncryptedLogic.MultiModelVote(context18);
    console.log(`Input: B-B-B-R-R-R (Expected 1-8 Structure)`);
    console.log(`Prediction: ${pred18.final}`);
    console.log(`Note: ${pred18.note}`);
    
    if (pred18.note.includes('强趋势') || pred18.note.includes('1-8') || pred18.note.includes('18')) {
        console.log("✅ Test 1 Passed: 1-8 Strong Trend Recognized");
    } else {
        console.error("❌ Test 1 Failed: Structure not recognized");
    }

    // Test 2: 3-6 Balanced Oscillation
    // 3 (Bagua) -> Bin 5 (101) -> B R B
    // 6 (Bagua) -> Bin 2 (010) -> R B R
    // Seq: B, R, B, R, B, R
    console.log("\n--- Test 2: 3-6 Balanced Oscillation ---");
    const seq36 = [
        { playerVal: 8, bankerVal: 2 }, // B
        { playerVal: 2, bankerVal: 8 }, // R
        { playerVal: 8, bankerVal: 2 }, // B
        { playerVal: 2, bankerVal: 8 }, // R
        { playerVal: 8, bankerVal: 2 }, // B
        { playerVal: 2, bankerVal: 8 }  // R
    ];
    
    engine.history = [];
    seq36.forEach(r => engine.processRound(r.playerVal, r.bankerVal));
    
    const context36 = { history: engine.history, rawHistory: engine.history };
    const pred36 = window.EncryptedLogic.MultiModelVote(context36);
    console.log(`Input: B-R-B-R-B-R (Expected 3-6 Structure)`);
    console.log(`Prediction: ${pred36.final}`);
    console.log(`Note: ${pred36.note}`);
    
    if (pred36.note.includes('平衡') || pred36.note.includes('3-6')) {
        console.log("✅ Test 2 Passed: 3-6 Balanced Recognized");
    } else {
        console.error("❌ Test 2 Failed");
    }

    // Test 3: Intent Injection from Mobile Input
    // We simulate what UIController does: passing structureIntent to processRound
    console.log("\n--- Test 3: Intent Injection ---");
    engine.history = [];
    // Mobile input "偏蓝" (Blue Bias)
    // UIController calls: handlePrediction(p, b, true, 'strong_trend')
    // which calls: engine.processRound(..., { structureIntent: 'strong_trend' })
    
    engine.processRound(8, 2, false, false, { structureIntent: 'strong_trend' });
    const lastRound = engine.history[0];
    
    console.log(`Round Metadata:`, lastRound);
    
    if (lastRound.structureIntent === 'strong_trend') {
        console.log("✅ Test 3 Passed: Structure Intent saved in history");
    } else {
        console.error("❌ Test 3 Failed: Intent missing");
    }
    
    // Test 4: Auto-generated 64 combinations coverage
    // We can't easily access the private BAGUA_STRUCTURE variable.
    // But we can test a random combination that wasn't manually defined.
    // Manual: 18, 81, 36, 63, 27, 72, 45, 54.
    // Let's try Bagua 4-4.
    // 4 -> Bin 1 (001) -> R R B.
    // Seq: R, R, B, R, R, B.
    // Blue count = 2. Red count = 4.
    // Ratio 2:4 -> 1:2. 
    // Logic in auto-gen: redCount >= 4 -> 'micro_trend' (Micro Red).
    
    console.log("\n--- Test 4: Auto-gen Combination (4-4) ---");
    const seq44 = [
        { playerVal: 2, bankerVal: 8 }, // R
        { playerVal: 2, bankerVal: 8 }, // R
        { playerVal: 8, bankerVal: 2 }, // B
        { playerVal: 2, bankerVal: 8 }, // R
        { playerVal: 2, bankerVal: 8 }, // R
        { playerVal: 8, bankerVal: 2 }  // B
    ];
    
    engine.history = [];
    seq44.forEach(r => engine.processRound(r.playerVal, r.bankerVal));
    
    const context44 = { history: engine.history, rawHistory: engine.history };
    const pred44 = window.EncryptedLogic.MultiModelVote(context44);
    console.log(`Input: R-R-B-R-R-B (Bagua 4-4)`);
    console.log(`Prediction: ${pred44.final}`);
    console.log(`Note: ${pred44.note}`);
    
    // Expect: Micro Red -> '微红' or 'micro_trend' in note
    if (pred44.note.includes('微红') || pred44.note.includes('4-4')) {
        console.log("✅ Test 4 Passed: Auto-gen 4-4 Recognized as Micro Red");
    } else {
        console.error("❌ Test 4 Failed");
    }

}

verifyStructureV3().catch(console.error);
