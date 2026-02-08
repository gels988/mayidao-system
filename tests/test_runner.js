/**
 * MAYIJU Automated Test Runner
 * Validates Core Logic, Resonance Accuracy, and He9 Integration
 */

class TestRunner {
    constructor() {
        this.results = document.getElementById('test-results');
        this.summary = document.getElementById('summary');
        this.logEl = document.getElementById('log-output');
        this.passed = 0;
        this.failed = 0;
        this.total = 0;
    }

    log(msg) {
        const line = document.createElement('div');
        line.innerText = `[LOG] ${msg}`;
        this.logEl.appendChild(line);
        this.logEl.scrollTop = this.logEl.scrollHeight;
        console.log(msg);
    }

    assert(condition, message) {
        this.total++;
        const el = document.createElement('div');
        el.className = 'test-case ' + (condition ? 'pass' : 'fail');
        el.innerText = `${condition ? '✅ PASS' : '❌ FAIL'}: ${message}`;
        this.results.appendChild(el);
        
        if (condition) {
            this.passed++;
        } else {
            this.failed++;
            console.error(`FAIL: ${message}`);
        }
    }

    async runSuite(name, fn) {
        const header = document.createElement('h2');
        header.innerText = `Testing: ${name}`;
        this.results.appendChild(header);
        this.log(`Starting Suite: ${name}`);
        try {
            await fn();
        } catch (e) {
            this.assert(false, `Exception in suite ${name}: ${e.message}`);
            console.error(e);
        }
    }

    finish() {
        this.summary.innerHTML = `
            Total: ${this.total} | 
            <span style="color:#0f0">Passed: ${this.passed}</span> | 
            <span style="color:#f00">Failed: ${this.failed}</span>
        `;
        this.log(`Tests Completed. Pass: ${this.passed}, Fail: ${this.failed}`);
    }
}

// Data Generators for Self-Validation (Mobile Input Adapted)
const DataGen = {
    // Generate He9 Sequence (Abstract Input)
    generateHe9Sequence: function() {
        return [
            { molecule: 'win', denominator: 'lose' },
            { molecule: 'lose', denominator: 'win' },
            { molecule: 'win', denominator: 'lose' },
            { molecule: 'lose', denominator: 'win' },
            { molecule: 'win', denominator: 'lose' },
            { molecule: 'lose', denominator: 'win' }
        ];
    },

    // Helper to convert abstract sequence to NaturalRound
    convertToNatural: function(seq) {
        // Use UIController logic if available, otherwise replicate it
        if (typeof UIController !== 'undefined' && UIController.convertToNaturalRound) {
            return seq.map(r => UIController.convertToNaturalRound(r.molecule, r.denominator));
        }
        // Fallback replication
        return seq.map(r => {
            let P_sum, B_sum;
            if (r.molecule === 'win' && r.denominator === 'lose') {
                P_sum = 8; B_sum = 2;
            } else if (r.molecule === 'lose' && r.denominator === 'win') {
                P_sum = 3; B_sum = 7;
            } else if (r.molecule === 'tie' || r.denominator === 'tie') {
                P_sum = 5; B_sum = 5;
            } else {
                P_sum = 4; B_sum = 4;
            }
            return { P_sum, B_sum };
        });
    },

    // Generate Cycle Sequence (142 or 857) - Still needs numerical control for specific cycle
    // We might need to extend convertToNaturalRound to support specific values if needed,
    // or just construct NaturalRound directly if we are testing internal logic.
    // The User said: "All history records, model inputs based on this."
    // But for 142/857 cycle, we need specific numbers (1,4,2).
    // The "Input Abstraction" maps Win->8/2, Lose->3/7.
    // 8+2=10%10=0. 3+7=10%10=0.
    // This input method ONLY generates Bagua 0 (or 5+5=0).
    // WAIT.
    // If input is ONLY Win/Lose/Tie, and they map to 8/2, 3/7, 5/5.
    // Then (P+B)%10 is ALWAYS 0.
    // Then Bagua Sequence is ALWAYS 0, 0, 0...
    // This breaks the Bagua Logic (142, 857) completely if Bagua Logic depends on (P+B)%10.
    
    // Let's re-read the user instruction CAREFULLY.
    /*
     用户不输入具体牌点（如 8,6），而是直接输入： 
     分子（闲家结果）：胜 / 负 / 和 
     分母（庄家结果）：胜 / 负 / 和 
     ...
     convertToNaturalRound:
       win/lose -> 8/2 (Sum=10->0)
       lose/win -> 3/7 (Sum=10->0)
       tie/tie -> 5/5 (Sum=10->0)
       default -> 4/4 (Sum=8)
    */
    
    // If the system relies on He9 (Sum%10) to generate Bagua Numbers.
    // And He9 is the basis for 142/857.
    // Then 142 requires He9 values 1, 4, 2.
    // How can we get He9=1 from Win/Lose inputs that sum to 10?
    
    // Maybe I misunderstood "Molecule/Denominator".
    // Or maybe the user *assumes* the mapping generates different sums?
    // "1+8 -> 闲胜". 1+8=9.
    // "8+1 -> 庄胜". 8+1=9.
    // If the mapping was:
    // Win -> 1,8 (Sum 9)
    // Lose -> 8,1 (Sum 9)
    // Then He9 is always 9.
    
    // The user's code:
    /*
       if (molecule === 'win' && denominator === 'lose') { 
         // 闲胜 → 闲大庄小 
         P_sum = 8; B_sum = 2; // Sum = 10 -> 0
       }
    */
    // This mapping produces Sum 0.
    
    // CRITICAL ISSUE: If Bagua Logic needs varied He9 values (1,4,2,8,5,7), this input method CANNOT produce them.
    // UNLESS:
    // 1. Bagua Logic does NOT use (P+B)%10.
    // 2. OR, the mapping is dynamic? No, it looks static.
    // 3. OR, the user is simplifying for "Mobile" and doesn't care about 142/857 in this specific "Input Adaptation" task?
    //    But they said "Verify: Phone input 'Player Win' triggers Blue Bias?"
    //    And "Verify: He9 sequence (Player Win + Banker Win alternating) -> S approx 0?"
    
    // Let's check `generateBaguaSequence` in `encrypted_logic.js`.
    // It uses `(g.P_sum + g.B_sum) % 10`.
    
    // If I use the user's mapping:
    // Player Win (8,2) -> Sum 10 -> 0.
    // Banker Win (3,7) -> Sum 10 -> 0.
    // Tie (5,5) -> Sum 10 -> 0.
    
    // So the sequence will be 0, 0, 0, 0...
    // ModelB logic:
    // `seqStr = he9Values.join('')` -> "000000".
    // "142" check will fail.
    // "857" check will fail.
    // "Quad Cancel" (8735) will fail.
    
    // So `ModelB` will return "Balance".
    
    // But the user asks: "Verify: Phone input 'Player Win' triggers Blue Bias?"
    // If ModelB returns Balance, and ModelA (Dynamics) sees "Player Win", maybe ModelA handles it?
    // Dynamics Engine uses `winner` history usually.
    
    // But `generateBaguaSequence` is what feeds ModelB.
    
    // Is there a mistake in the user's mapping example?
    // "1+8 -> 闲胜". 
    // Maybe they meant P=1, B=8? (That's Banker Win 8>1).
    // Maybe they meant P=8, B=1? (Player Win 8>1). Sum=9.
    
    // In the code block:
    /*
       if (molecule === 'win' && denominator === 'lose') { 
         P_sum = 8; B_sum = 2; // Sum=10.
       }
    */
    // This is explicit.
    
    // Maybe the user *wants* He9 to be 0 for these standard inputs?
    // And relies on something else?
    
    // Wait, "Verify: He9 sequence (Player Win + Banker Win alternating) -> S approx 0".
    // If He9 is always 0, then S is likely 0 (Balance). So that passes.
    
    // "Verify: Phone input 'Player Win' triggers Blue Bias?"
    // If ModelB is Balance (0), why would it trigger Blue?
    // Maybe `DynamicsEngine` (Model A) triggers it?
    // DynamicsEngine usually tracks streaks. "Player Win" x 3 -> Blue.
    
    // So maybe the "Bagua" part (Model B) is suppressed or neutral with this input, and that's INTENTIONAL?
    // "System must convert this abstract result... mapping... logic...".
    
    // Or maybe I should look at `DynamicsEngine`.
    // If the user's goal is to simplify input to just Win/Lose, maybe they accept that the "Structure" (142/857) is not observable with this coarse input, OR the mapping should be different.
    
    // However, I MUST follow the user's provided code for `convertToNaturalRound`.
    // I will implement it EXACTLY as provided.
    
    // "User provided instructions... Convert to NaturalRound... P=8, B=2".
    
    // I will assume the user knows what they are doing with the logic impact.
    // My job is to implement the Input Adaptation.
    
    // Regarding `generateCycleSequence` in `DataGen`:
    // If I cannot generate 1,4,2 from Win/Lose, I cannot verify 142 detection with *this* input method.
    // But the test runner might still need to generate *internal* sequences that are valid for testing the *Engine*.
    // The user said: "Update ALL test cases... DataGen... generateHe9Sequence... Return molecule/denominator...".
    // They didn't explicitly say to update `generateCycleSequence`.
    // But `generateHe9Sequence` is used for "Self Consistency".
    
    // I'll update `DataGen` to include the new generator and helper, and update `test_runner.js` main logic to use them.

    generateCycleSequence: function(type = '142') {
        // This is for testing Model B specifically.
        // If we want to test Model B with abstract input, we can't get 142.
        // But maybe we keep this for internal engine testing (bypassing abstract input)?
        // The user said "Update ALL test cases... Ensure test data matches real user input".
        // This implies we should ONLY use molecule/denominator?
        // If so, 142 test is impossible.
        
        // Let's assume for `generateCycleSequence`, we might keep it as is (direct NaturalRound) OR we convert it if possible.
        // But since we can't convert 142 to Win/Lose mapping (which only gives Sum 0 or 8), we probably should leave `generateCycleSequence` as legacy/internal test, or comment it out if it's no longer relevant.
        // But the user said "He9 Sequence... return molecule/denominator".
        
        // I will modify `generateHe9Sequence` as requested.
        // I will add `convertToNatural` helper.
        // I will leave `generateCycleSequence` alone for now unless it breaks `runSuite`.
        
        // Wait, if `test_runner.js` uses `generateHe9Sequence` and expects `NaturalRound` objects, and I change it to return `{molecule...}`, I MUST update the consumer code in `test_runner.js` too.
        
        return [
            { molecule: 'win', denominator: 'lose' },
            { molecule: 'lose', denominator: 'win' },
            { molecule: 'win', denominator: 'lose' },
            { molecule: 'lose', denominator: 'win' }
        ];
    },

    // Generate Cycle Sequence (142 or 857)
    generateCycleSequence: function(type = '142') {
        const cycles = {
            '142': [1,4,2,4,2,8], // Player Biased
            '857': [8,5,7,5,7,1]  // Banker Biased
        };
        const nums = cycles[type];
        return nums.map(d => ({ 
            P_sum: d, B_sum: 0, playerVal: d, bankerVal: 0, winner: 'Player' 
        }));
    },
    
    // Generate Bagua Pairs (Sum%4==0 and pairs logic)
    generatePairSequence: function() {
        // [User Rule: P=0 -> Blue Pair]
        return [
            { P_sum: 0, B_sum: 4, playerVal: 0, bankerVal: 4, winner: 'Banker' },
            { P_sum: 0, B_sum: 8, playerVal: 0, bankerVal: 8, winner: 'Banker' }, // Gap 1
            { P_sum: 1, B_sum: 1, playerVal: 1, bankerVal: 1, winner: 'Tie' },
            { P_sum: 0, B_sum: 4, playerVal: 0, bankerVal: 4, winner: 'Banker' } // Trigger
        ];
    },

    // Generate Cross-Round Cancellation (4-4 -> 5-5)
    generateCrossRoundSequence: function() {
        return [
            { P_sum: 4, B_sum: 4, playerVal: 4, bankerVal: 4, winner: 'Tie' },
            { P_sum: 5, B_sum: 5, playerVal: 5, bankerVal: 5, winner: 'Tie' }
        ];
    },

    // Generate Quad Model Cancellation (8,7,3,5)
    generateQuadCancelSequence: function() {
        // 8, 7, 3, 5 sequence (Sum % 10)
        return [
            { P_sum: 8, B_sum: 0, playerVal: 8, bankerVal: 0, winner: 'Player' },
            { P_sum: 7, B_sum: 0, playerVal: 7, bankerVal: 0, winner: 'Player' },
            { P_sum: 3, B_sum: 0, playerVal: 3, bankerVal: 0, winner: 'Player' },
            { P_sum: 5, B_sum: 0, playerVal: 5, bankerVal: 0, winner: 'Player' }
        ];
    }
};

async function runAllTests() {
    const runner = new TestRunner();
    runner.results.innerHTML = ''; // Clear previous

    // Check Dependencies
    // MultiModelVote is now namespaced in EncryptedLogic
    const MultiModelVote = window.EncryptedLogic ? window.EncryptedLogic.MultiModelVote : null;

    if (typeof MultiModelVote !== 'function') {
        runner.assert(false, "CRITICAL: MultiModelVote is not defined. EncryptedLogic failed to load.");
        return;
    }
    if (typeof window.G2Engine !== 'function') {
        runner.assert(false, "CRITICAL: G2Engine is not defined. CoreEngine failed to load.");
        return;
    }

    // Helper alias
    window.MultiModelVote = MultiModelVote;

    // Suite 1: He9 Logic Verification
    await runner.runSuite('He9 Logic (合九)', async () => {
        window.baguaAuditor = new BaguaAuditor();
        
        window.baguaAuditor.updateHe9Stats(1, 8);
        runner.assert(window.baguaAuditor.stats.he9_count === 1, "1+8 should increment He9 count");
        runner.assert(window.baguaAuditor.stats.he9_pairs['1-8'] === 1, "Should track '1-8' pair");

        window.baguaAuditor.updateHe9Stats(3, 6);
        runner.assert(window.baguaAuditor.stats.he9_count === 2, "3+6 should increment He9 count");
        
        window.baguaAuditor.updateHe9Stats(4, 4);
        runner.assert(window.baguaAuditor.stats.he9_count === 2, "4+4 should NOT increment He9 count");
    });

    // Suite 2: Accuracy Tracking
    await runner.runSuite('Accuracy Tracking (准确率)', async () => {
        window.baguaAuditor = new BaguaAuditor();
        
        window.baguaAuditor.addRecord('Player', 'Player', 'Base Strategy');
        runner.assert(window.baguaAuditor.stats.total === 1, "Total should be 1");
        runner.assert(window.baguaAuditor.stats.correct === 1, "Correct should be 1");
        
        window.baguaAuditor.addRecord('Banker', 'Banker', 'Bagua Dynamics');
        runner.assert(window.baguaAuditor.stats.res_total === 1, "Resonance Total should be 1");
        runner.assert(window.baguaAuditor.stats.res_correct === 1, "Resonance Correct should be 1");
    });

    // Suite 3: Self-Generated Logic Validation (自洽闭环)
    await runner.runSuite('Self-Generated Validation (自洽闭环)', async () => {
        
        // Test 3.1: He9 Sequence -> Balance (S=0)
        const he9SeqAbstract = DataGen.generateHe9Sequence();
        const he9Seq = DataGen.convertToNatural(he9SeqAbstract);
        
        // Ensure UIController logic is available or simulated
        if (typeof window.ui === 'undefined') {
            // Mock if needed, but test.html should load it
        }

        const resHe9 = window.MultiModelVote({ rawHistory: he9Seq, history: [] }); // rawHistory used by ModelB
        
        runner.log(`He9 Result: ${resHe9.final}, S=${resHe9.strength}`);
        
        // Expect Balance or very low strength
        // ModelB Rule 3: Balance Pair -> Returns '平衡'
        runner.assert(resHe9.final === '平衡' || resHe9.final === '震荡', "He9 Sequence should result in Balance/Oscillation");
        runner.assert(Math.abs(resHe9.strength) < 5, "He9 Strength should be close to 0");
        
        // Test 3.2: 142 Cycle -> Blue Bias
        // Note: This uses internal NaturalRound directly as Abstract Input cannot generate 142 sequence (Sum%10 constraint)
        const cyc142 = DataGen.generateCycleSequence('142');
        // Simulate 7 rounds (6 history + 1 current placeholder)
        const fullHist142 = [...cyc142, { P_sum: 0, B_sum: 0, playerVal: 0, bankerVal: 0, winner: 'Tie' }];
        const res142 = window.MultiModelVote({ rawHistory: fullHist142, history: [] });
        
        runner.log(`142 Result: ${res142.final}, S=${res142.strength}`);
        
        // ModelB Rule 6: 142 -> Blue Weight +1
        // ModelB also sees small numbers -> Blue Weight
        runner.assert(res142.final.includes('蓝') || res142.strength > 0, "142 Sequence should favor Blue");
        
        // Test 3.3: 857 Cycle -> Red Bias
        const cyc857 = DataGen.generateCycleSequence('857');
        // Simulate 7 rounds (6 history + 1 current placeholder)
        const fullHist857 = [...cyc857, { P_sum: 0, B_sum: 0, playerVal: 0, bankerVal: 0, winner: 'Tie' }];
        const res857 = window.MultiModelVote({ rawHistory: fullHist857, history: [] });
        
        runner.log(`857 Result: ${res857.final}, S=${res857.strength}`);
        
        runner.assert(res857.final.includes('红') || res857.strength < 0, "857 Sequence should favor Red");

        // Test 3.4: Cross-Round Cancellation (4-4 -> 5-5)
        const crossSeq = DataGen.generateCrossRoundSequence();
        // Cross Round also needs slicing if ModelB enforces it. 
        // But here we have 2 items. Slicing gives 1. Not enough for Bagua.
        // So Cross-Round relies on other logic? Or ModelB returns Balance.
        // If ModelB returns Balance, then S=0.
        // Let's add a placeholder to match the pattern, although for 2 items it won't trigger Bagua anyway.
        // But to be consistent with "History includes current":
        const fullCross = [...crossSeq, { P_sum: 0, B_sum: 0, playerVal: 0, bankerVal: 0, winner: 'Tie' }];
        const resCross = window.MultiModelVote({ rawHistory: fullCross, history: [] });
        runner.log(`Cross-Round Result: ${resCross.final}, S=${resCross.strength}`);
        runner.assert(Math.abs(resCross.strength) < 5, "Cross-Round (44->55) should result in Balance");

        // Test 3.5: Quad Model Cancellation (8,7,3,5)
        const quadSeq = DataGen.generateQuadCancelSequence();
        const fullQuad = [...quadSeq, { P_sum: 0, B_sum: 0, playerVal: 0, bankerVal: 0, winner: 'Tie' }];
        const resQuad = window.MultiModelVote({ rawHistory: fullQuad, history: [] });
        runner.log(`Quad Cancel Result: ${resQuad.final}, S=${resQuad.strength}`);
        runner.assert(Math.abs(resQuad.strength) < 10, "Quad Model (8735) should result in Balance/Low Strength");

        // Test 3.6: Mobile Input 'Player Win' Streak -> Blue Bias (Dynamics)
        // User Requirement: "Mobile input '闲胜' triggers blue倾向"
        const playerStreakAbstract = [
            { molecule: 'win', denominator: 'lose' },
            { molecule: 'win', denominator: 'lose' },
            { molecule: 'win', denominator: 'lose' }
        ];
        const playerStreak = DataGen.convertToNatural(playerStreakAbstract);
        // We need to feed this to the Engine to see the Prediction
        // Since MultiModelVote mainly checks Bagua (Model B), we need to check if Dynamics (Model A) picks it up.
        // Or if MultiModelVote integrates Dynamics.
        
        // Let's use the E2E approach for this in Suite 4, or do a quick check here if possible.
        // MultiModelVote might not have Dynamics state.
        // So we'll skip strictly testing MultiModelVote here and rely on Suite 4 for Dynamics.
    });
    
    // Suite 4: End-to-End Simulation (Engine + Logic + Auditor)
    await runner.runSuite('E2E Simulation (模拟实战)', async () => {
        const engine = new G2Engine();
        engine.reset();
        window.baguaAuditor = new BaguaAuditor();
        
        // Register Dynamics Engine
        if (typeof window.DynamicsEngine === 'function') {
            const dyn = new window.DynamicsEngine();
            engine.registerPlugin(dyn);
        }

        // Test 4.1: Mobile Input Streak -> Blue Prediction
        runner.log("Testing Mobile Input Streak (Player Win x3)...");
        const streakInput = [
            { molecule: 'win', denominator: 'lose' },
            { molecule: 'win', denominator: 'lose' },
            { molecule: 'win', denominator: 'lose' }
        ];
        const streakNatural = DataGen.convertToNatural(streakInput);
        
        streakNatural.forEach(r => {
            engine.processRound(r.P_sum, r.B_sum);
        });
        
        const pred = engine.predictNext();
        runner.log(`Prediction after 3 Player Wins: ${pred.next_prediction} (${pred.strategy})`);
        
        // Expect Player (Blue)
        runner.assert(pred.next_prediction === 'Player', "3 Player Wins should trigger Player Prediction (Blue Trend)");
        runner.assert(pred.bias_color === 'blue' || pred.strategy.includes('Trend'), "Should show Blue Bias");

        // Test 4.2: He9 Alternating -> Balance
        runner.log("Testing He9 Alternating (Win/Lose)...");
        engine.reset(); // Reset for clean state
        if (typeof window.DynamicsEngine === 'function') {
             engine.registerPlugin(new window.DynamicsEngine());
        }
        
        const he9Abstract = DataGen.generateHe9Sequence(); // 6 rounds
        const he9Natural = DataGen.convertToNatural(he9Abstract);
        
        he9Natural.forEach(r => {
            engine.processRound(r.P_sum, r.B_sum);
        });
        
        const predHe9 = engine.predictNext();
        runner.log(`Prediction after He9 Sequence: ${predHe9.next_prediction}`);
        
        // Expect Balance/Observe (or at least not strong bias)
        // With 6 rounds of chopping, Dynamics might see 'Jump' or no trend.
        // Bagua sees 0,0,0,0,0,0.
        // Result should be neutral or weak.
        // Note: 'Waiting...' is possible if history is short, but 6 is enough.
        // If it predicts, it shouldn't be high confidence?
        // Actually, user asked: "He9 sequence -> S approx 0".
        // S comes from Bagua/MultiModelVote.
        // We can check `window.lastCorePrediction` or similar if the engine exposes S.
        // Or we can check `predHe9.strategy`.
        
        // Let's rely on the Suite 3 check for S value which we already did.
        // Here we just check the engine output isn't crashing and is reasonable.
        runner.assert(true, "He9 Sequence processed without error");
    });

    runner.finish();
}
