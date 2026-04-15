/**
 * 100-Round Combat Verification Suite
 * 系统稳定性与准确率回测工具
 * 
 * Usage: Load this script in browser console or include in index.html
 * Command: VerificationSuite.run(100);
 */

(function() {
    class BaccaratGenerator {
        constructor() {
            this.deck = [];
            this.shuffle();
        }

        shuffle() {
            // 8 decks of cards
            this.deck = [];
            for (let d = 0; d < 8; d++) {
                for (let s = 0; s < 4; s++) { // Suits
                    for (let r = 1; r <= 13; r++) { // Ranks
                        let val = r >= 10 ? 0 : r;
                        this.deck.push(val);
                    }
                }
            }
            // Shuffle
            for (let i = this.deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
            }
        }

        dealCard() {
            if (this.deck.length < 6) this.shuffle();
            return this.deck.pop();
        }

        generateRound() {
            // Player / Banker hands
            const p = [this.dealCard(), this.dealCard()];
            const b = [this.dealCard(), this.dealCard()];
            
            const getVal = (hand) => hand.reduce((a,c) => a+c, 0) % 10;
            
            let pVal = getVal(p);
            let bVal = getVal(b);
            
            let pSupp = null;
            let bSupp = null;
            
            // Natural?
            if (pVal < 8 && bVal < 8) {
                // Player draw?
                if (pVal <= 5) {
                    pSupp = this.dealCard();
                    p.push(pSupp);
                    pVal = getVal(p);
                }
                
                // Banker draw?
                let bankerDraw = false;
                if (bVal <= 2) bankerDraw = true;
                else if (bVal === 3 && pSupp !== 8) bankerDraw = true;
                else if (bVal === 4 && [2,3,4,5,6,7].includes(pSupp)) bankerDraw = true;
                else if (bVal === 5 && [4,5,6,7].includes(pSupp)) bankerDraw = true;
                else if (bVal === 6 && [6,7].includes(pSupp)) bankerDraw = true;
                
                // If player didn't draw, banker draws on 0-5
                if (p.length === 2 && bVal <= 5) bankerDraw = true;
                
                if (bankerDraw) {
                    bSupp = this.dealCard();
                    b.push(bSupp);
                    bVal = getVal(b);
                }
            }
            
            let winner = 'Tie';
            if (pVal > bVal) winner = 'Player'; // Blue
            if (bVal > pVal) winner = 'Banker'; // Red
            
            return {
                playerVal: pVal,
                bankerVal: bVal,
                winner: winner,
                P1: p[0], P2: p[1], P3: pSupp,
                B1: b[0], B2: b[1], B3: bSupp,
                molSum: pVal, // Compatible with new logic
                denSum: bVal
            };
        }
    }

    class VerificationSuite {
        constructor() {
            this.generator = new BaccaratGenerator();
            this.history = [];
            this.stats = {
                total: 0,
                correct: 0,
                patterns: {
                    '2-7_sawtooth': { total: 0, correct: 0 },
                    '4-5_sawtooth': { total: 0, correct: 0 },
                    'supplement': { total: 0, correct: 0 },
                    'normal': { total: 0, correct: 0 }
                }
            };
        }

        run(rounds = 100) {
            console.log(`🚀 Starting ${rounds}-Round Combat Verification...`);
            console.log("--------------------------------------------------");
            
            // Need reference to logic
            if (!window.multiModelVote) {
                console.error("❌ Core Logic (multiModelVote) not found!");
                return;
            }

            for (let i = 0; i < rounds; i++) {
                // 1. Generate Round Result (Truth)
                const round = this.generator.generateRound();
                
                // 2. Predict using History (BEFORE adding current round)
                // We need at least a few rounds history to predict
                let prediction = { prediction: 'wait' };
                let trend = 'normal';
                
                if (this.history.length >= 3) {
                    prediction = window.multiModelVote.predict(this.history);
                    trend = prediction.trend || 'normal';
                }
                
                // 3. Record History
                this.history.push(round);
                
                // 4. Verify
                if (prediction.prediction !== 'wait') {
                    this.stats.total++;
                    
                    const actual = round.winner === 'Player' ? 'blue' : (round.winner === 'Banker' ? 'red' : 'tie');
                    const isCorrect = (prediction.prediction === actual);
                    
                    if (isCorrect) this.stats.correct++;
                    
                    // Categorize
                    let type = 'normal';
                    if (trend.includes('2-7')) type = '2-7_sawtooth';
                    else if (trend.includes('4-5')) type = '4-5_sawtooth';
                    else if (round.P3 !== null || round.B3 !== null) type = 'supplement';
                    
                    if (!this.stats.patterns[type]) this.stats.patterns[type] = { total: 0, correct: 0 };
                    this.stats.patterns[type].total++;
                    if (isCorrect) this.stats.patterns[type].correct++;
                    
                    // Log
                    // console.log(`Round ${i+1}: Pred=${prediction.prediction}, Act=${actual} [${isCorrect?'✅':'❌'}] Type=${type}`);
                }
            }
            
            this.report();
        }

        report() {
            console.log("--------------------------------------------------");
            console.log("📊 Verification Report");
            console.log("--------------------------------------------------");
            const getAcc = (s) => s.total > 0 ? ((s.correct / s.total) * 100).toFixed(1) + '%' : 'N/A';
            
            console.log(`Total Rounds: ${this.stats.total}`);
            console.log(`Overall Accuracy: ${getAcc(this.stats)}`);
            console.log("");
            console.log(`🔹 2-7 Sawtooth: ${getAcc(this.stats.patterns['2-7_sawtooth'])} (${this.stats.patterns['2-7_sawtooth'].total})`);
            console.log(`🔹 4-5 Sawtooth: ${getAcc(this.stats.patterns['4-5_sawtooth'])} (${this.stats.patterns['4-5_sawtooth'].total})`);
            console.log(`🔹 Supplement:   ${getAcc(this.stats.patterns['supplement'])} (${this.stats.patterns['supplement'].total})`);
            console.log(`🔹 Normal/Other: ${getAcc(this.stats.patterns['normal'])} (${this.stats.patterns['normal'].total})`);
            console.log("--------------------------------------------------");
            
            if ((this.stats.correct / this.stats.total) > 0.70) {
                console.log("✅ SYSTEM STATUS: STABLE (>70%)");
            } else {
                console.log("⚠️ SYSTEM STATUS: NEEDS OPTIMIZATION");
            }
        }
    }

    window.VerificationSuite = new VerificationSuite();
    console.log("✅ VerificationSuite loaded. Run `window.VerificationSuite.run(100)` to start.");
})();
