
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// 1. Setup Mock Browser Environment
const sandbox = {
    window: {},
    console: console,
    localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {}
    },
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    Math: Math,
    Date: Date,
    Array: Array,
    Object: Object,
    parseInt: parseInt,
    parseFloat: parseFloat
};
sandbox.window.localStorage = sandbox.localStorage;
sandbox.self = sandbox; // Some scripts use self

vm.createContext(sandbox);

// 2. Load Scripts
function loadScript(filename) {
    try {
        const content = fs.readFileSync(path.join(__dirname, 'js', filename), 'utf8');
        vm.runInContext(content, sandbox);
        console.log(`Loaded ${filename}`);
    } catch (e) {
        console.error(`Failed to load ${filename}:`, e);
    }
}

loadScript('bagua_transcoder.js');
loadScript('encrypted_logic.js');
loadScript('core_engine.js');

// 3. Define Test Logic inside the sandbox
const testScript = `
async function runTests() {
    console.log("🧪 Starting Dual-Mode Logic Verification...");

    if (typeof G2Engine === 'undefined') {
        console.error("❌ G2Engine is undefined!");
        return;
    }

    const engine = new G2Engine();
    
    // --- Test 1: Mobile Input Logic ---
    console.log("\\n[Test 1] Mobile Input Simulation");
    // Mobile uses: platform='mobile', virtualS, structureIntent
    const mobileRound = engine.processRound(8, 0, false, false, {
        platform: 'mobile',
        virtualS: 20, // Should trigger Blue (>15)
        structureIntent: 'strong_trend'
    });
    
    // Check prediction logic
    // We access window.MultiModelVote because encrypted_logic.js attaches it to window
    const mobilePred = window.MultiModelVote({ rawHistory: engine.history });
    console.log("Mobile Prediction:", JSON.stringify(mobilePred));
    
    if (mobilePred.strategy === 'Mobile_Intent' && mobilePred.final === '蓝倾向') {
        console.log("✅ Mobile Logic Passed: Strategy=Mobile_Intent, Result=蓝倾向");
    } else {
        console.error("❌ Mobile Logic Failed: Expected Mobile_Intent/蓝倾向, got " + mobilePred.strategy + "/" + mobilePred.final);
    }

    // --- Test 2: Desktop Input Logic ---
    console.log("\\n[Test 2] Desktop Input Simulation");
    // Desktop Input: P1=8, P2=8 (Pair 8) vs B1=1, B2=2
    // This should trigger "闲对8" -> Blue Weight +2.0
    // And P=6, B=3 -> No Natural
    const desktopRound = engine.processRound(6, 3, true, false, {
        platform: 'desktop',
        P1: 8, P2: 8,
        B1: 1, B2: 2
    });
    
    const desktopPred = window.MultiModelVote({ rawHistory: engine.history });
    console.log("Desktop Prediction:", JSON.stringify(desktopPred));
    
    if (desktopPred.strategy === 'Desktop_Precision') {
        console.log("✅ Desktop Strategy Identified");
        if (desktopPred.note && desktopPred.note.includes("闲对8")) {
            console.log("✅ Desktop Logic Passed: Detected '闲对8'");
        } else {
            console.error("❌ Desktop Logic Failed: Missed '闲对8'. Note: " + desktopPred.note);
        }
    } else {
        console.error("❌ Desktop Logic Failed: Wrong Strategy " + desktopPred.strategy);
    }

    // --- Test 3: Data Unification (Check Round Object) ---
    console.log("\\n[Test 3] Data Unification Check");
    const lastRound = engine.history[engine.history.length - 1];
    if (lastRound.platform === 'desktop' && lastRound.P1 === 8) {
        console.log("✅ Data Correct: Platform=desktop, P1=8 preserved.");
    } else {
        console.error("❌ Data Corrupt:", JSON.stringify(lastRound));
    }
}

runTests();
`;

// 4. Run Tests
try {
    vm.runInContext(testScript, sandbox);
} catch (e) {
    console.error("Runtime Error:", e);
}
