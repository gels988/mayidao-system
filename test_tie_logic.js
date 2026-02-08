
// Mock Browser Environment
global.window = {
    EncryptedLogic: {},
    location: { reload: () => {} },
    getHighOddsResult: null
};
global.document = {
    getElementById: () => null,
    createElement: () => ({ style: {} }),
    head: { appendChild: () => {} },
    body: { appendChild: () => {} },
    addEventListener: () => {}
};
global.localStorage = {
    getItem: () => null,
    setItem: () => {}
};

// Mock specific logic variables if needed
global.nextDecisionColor = null;

// Load the logic file
const fs = require('fs');
const logicCode = fs.readFileSync('./js/encrypted_logic.js', 'utf8');

// Execute logic
try {
    eval(logicCode);
} catch (e) {
    console.error("Error evaluating logic code:", e);
}

// Helpers
function createRound(p, b) {
    return { playerVal: p, bankerVal: b, P_sum: p, B_sum: b, winner: p > b ? 'Player' : (b > p ? 'Banker' : 'Tie') };
}

const MultiModelVote = global.window.EncryptedLogic.MultiModelVote;

console.log("=== 🧪 Testing Tie Logic & Oscillation (No JSDOM) ===");

// --- Test Case A: 2/2 -> 4/4 (Rule 7 & Rule 2) ---
// Rule 7: Pure Even (2,2,4,4) -> YES
// Rule 2: Sum Equal (2+2 = 4+0? No. 2+2=4. 4+4=8. Wait.
// Rule 2 is: (prev.p + cur.p) === (prev.b + cur.b)
// P1=2, P2=4 -> Sum=6.
// B1=2, B2=4 -> Sum=6.
// 6 === 6. YES.
console.log("\n--- Test Case A: 2/2 -> 4/4 (Rule 7 & Rule 2) ---");
const historyA = [createRound(2, 2), createRound(4, 4)];
const contextA = { 
    rawHistory: historyA,
    P_sum: 4, B_sum: 4,
    history: ['Red', 'Red'] 
};

const resultA = MultiModelVote(contextA);
console.log(`Input: 2/2 -> 4/4`);
console.log(`Result: ${resultA.final} (Strength: ${resultA.strength}%)`);

if (resultA.final === '平衡') {
    console.log("✅ PASS: Correctly identified as '平衡' (Tie Logic).");
} else {
    console.log(`❌ FAIL: Expected '平衡', got '${resultA.final}'`);
}

// --- Test Case B: 2/2 -> 4/5 (Rule 7 Met? No, 5 is odd. Rule 2 Met? 2+4=6, 2+5=7. No.) ---
// Should NOT trigger Tie Logic.
console.log("\n--- Test Case B: 2/2 -> 4/5 (No Tie Logic) ---");
const historyB = [createRound(2, 2), createRound(4, 5)];
const contextB = {
    rawHistory: historyB,
    P_sum: 4, B_sum: 5,
    history: ['Red', 'Red']
};

const resultB = MultiModelVote(contextB);
console.log(`Input: 2/2 -> 4/5`);
console.log(`Result: ${resultB.final}`);

if (resultB.final !== '平衡') {
    console.log("✅ PASS: Not '平衡' (Tie Logic not triggered).");
    if (resultB.final === '震荡') console.log("   (Result is '震荡' - Oscillation confirmed)");
} else {
    console.log("❌ FAIL: Got '平衡' unexpectedly.");
}

console.log("\n=== Test Complete ===");
