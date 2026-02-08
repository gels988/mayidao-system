/**
 * Test Suite for AdaptiveSensitivity Engine
 * Verifies Sigmoid Threshold and Signal Type Tracking logic.
 * 
 * Run with: node test_adaptive_sensitivity.js
 */

// --- 1. Mock AdaptiveSensitivity Class (Copied from ui_controller.js) ---
class AdaptiveSensitivity {
    constructor() {
        this.history = [];
        this.windowSize = 15; // Increased window size
        this.signalTypes = ['panda', 'dui', 'trend', 'other'];
        
        this.signalStats = {};
        this.signalTypes.forEach(type => {
            this.signalStats[type] = { correct: 0, total: 0 };
        });
    }

    getSignalType(note) {
        if (!note) return 'other';
        if (note.includes('熊猫')) return 'panda';
        if (note.includes('对') || note.includes('6')) return 'dui';
        if (note.includes('蓝7') || note.includes('重复')) return 'trend';
        return 'other';
    }

    record(actual, predicted, note) {
        let act = actual;
        if (act === 'Player') act = 'blue';
        else if (act === 'Banker') act = 'red';
        else if (act === 'Tie') act = 'green';
        
        let pred = predicted;
        if (pred === 'Player') pred = 'blue';
        else if (pred === 'Banker') pred = 'red';

        const type = this.getSignalType(note);
        const isCorrect = (act === pred);

        this.history.push({ actual: act, predicted: pred, type, isCorrect });
        if (this.history.length > this.windowSize) {
            const removed = this.history.shift();
            this.signalStats[removed.type].total--;
            if (removed.isCorrect) this.signalStats[removed.type].correct--;
        }

        this.signalStats[type].total++;
        if (isCorrect) this.signalStats[type].correct++;
    }

    getGlobalAccuracy() {
        if (this.history.length === 0) return 0.5;
        const correct = this.history.filter(r => r.isCorrect).length;
        return correct / this.history.length;
    }

    getSignalAccuracy(type) {
        const stats = this.signalStats[type];
        return stats.total > 0 ? stats.correct / stats.total : 0.5;
    }

    getSigmoidThreshold(accuracy) {
        const k = 10;
        const x = accuracy - 0.55;
        const sigmoid = 1 / (1 + Math.exp(-k * x));
        return 1 + 2 * sigmoid; // [1, 3]
    }

    getRequiredWins() {
        const globalAcc = this.getGlobalAccuracy();
        const threshold = this.getSigmoidThreshold(globalAcc);
        return Math.round(threshold);
    }
}

// --- 2. Test Cases ---

function runTests() {
    console.log("🚀 Starting AdaptiveSensitivity Tests...");
    const engine = new AdaptiveSensitivity();

    // Test 1: Sigmoid Smooth Transition
    console.log("\n🧪 Test 1: Sigmoid Smooth Transition (Accuracy 0.4 -> 0.8)");
    const testAccuracies = [0.4, 0.5, 0.6, 0.65, 0.7, 0.8];
    testAccuracies.forEach(acc => {
        const threshold = engine.getSigmoidThreshold(acc);
        const wins = Math.round(threshold);
        console.log(`  Acc: ${(acc*100).toFixed(0)}% -> Threshold: ${threshold.toFixed(3)} -> Wins: ${wins}`);
        
        // Assertions
        if (acc <= 0.4 && wins !== 1) console.error("  ❌ FAIL: 40% should be ~1 win");
        if (acc === 0.5 && wins !== 2) console.error("  ❌ FAIL: 50% should be 2 wins");
        if (acc >= 0.7 && wins !== 3) console.error("  ❌ FAIL: 70% should be 3 wins");
    });

    // Test 2: Signal Type Independent Tracking
    console.log("\n🧪 Test 2: Signal Type Independent Tracking");
    
    // Simulate 5 Panda predictions (4 correct, 1 wrong) -> 80%
    console.log("  Simulating 5 Panda signals (4/5 Correct)...");
    for(let i=0; i<4; i++) engine.record('blue', 'blue', '熊猫');
    engine.record('blue', 'red', '熊猫');

    // Simulate 5 Trend predictions (1 correct, 4 wrong) -> 20%
    console.log("  Simulating 5 Trend signals (1/5 Correct)...");
    engine.record('blue', 'blue', '蓝7');
    for(let i=0; i<4; i++) engine.record('blue', 'red', '蓝7');

    const pandaAcc = engine.getSignalAccuracy('panda');
    const trendAcc = engine.getSignalAccuracy('trend');
    const globalAcc = engine.getGlobalAccuracy();

    console.log(`  Panda Acc: ${(pandaAcc*100).toFixed(1)}% (Expected: 80.0%)`);
    console.log(`  Trend Acc: ${(trendAcc*100).toFixed(1)}% (Expected: 20.0%)`);
    console.log(`  Global Acc: ${(globalAcc*100).toFixed(1)}% (Expected: 50.0%)`);

    if (Math.abs(pandaAcc - 0.8) < 0.01) console.log("  ✅ Panda Tracking Passed");
    else console.error("  ❌ Panda Tracking Failed");

    if (Math.abs(trendAcc - 0.2) < 0.01) console.log("  ✅ Trend Tracking Passed");
    else console.error("  ❌ Trend Tracking Failed");

    // Test 3: Sliding Window Eviction
    console.log("\n🧪 Test 3: Sliding Window Eviction (Size = 15)");
    // Fill up with 10 more 'other' records to push out old ones
    // Current history size is 10. Max is 15.
    // Push 6 more.
    console.log("  Pushing 6 more records to overflow window...");
    for(let i=0; i<6; i++) engine.record('blue', 'blue', 'other');

    // Total records pushed: 5 (Panda) + 5 (Trend) + 6 (Other) = 16.
    // Window size 15. First record (Panda Correct) should be gone.
    // Panda stats should now be: 3 Correct / 4 Total = 75%
    
    const newPandaAcc = engine.getSignalAccuracy('panda');
    console.log(`  New Panda Acc (after eviction): ${(newPandaAcc*100).toFixed(1)}% (Expected: 75.0%)`);
    
    if (Math.abs(newPandaAcc - 0.75) < 0.01) console.log("  ✅ Eviction Logic Passed");
    else console.error("  ❌ Eviction Logic Failed");

    console.log("\n✨ All Tests Completed.");
}

runTests();
