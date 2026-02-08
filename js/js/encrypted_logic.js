(function(){
    'use strict';
    
    // --- Model Stats Management (Persistence) ---
    var modelStats = {
        "A": {correct:0, total:0},
        "B": {correct:0, total:0},
        "C": {correct:0, total:0}
    };

    try {
        var stored = localStorage.getItem('model_stats');
        if (stored) {
            modelStats = JSON.parse(stored);
        }
    } catch(e) {
        console.warn("Failed to load model stats:", e);
    }

    function updateModelAccuracy(modelId, isCorrect) {
        if (!modelStats[modelId]) modelStats[modelId] = {correct:0, total:0};
        modelStats[modelId].total++;
        if (isCorrect) modelStats[modelId].correct++;
        try {
            localStorage.setItem('model_stats', JSON.stringify(modelStats));
        } catch(e) {}
    }

    function getModelWeight(modelId) {
        if (!modelStats[modelId]) return 0.5;
        var s = modelStats[modelId];
        return s.total > 0 ? s.correct / s.total : 0.5;
    }

    // --- Bagua Structure Definitions (User Step 1) ---
    const BAGUA_STRUCTURE = {
        // 1-8: Blue Strong / Red Strong (3:3) -> Trend
        '18': { type: 'strong_trend', desc: '强趋势 (1-8)', pattern: 'BBBRRR', ratio: '3:3' },
        '81': { type: 'strong_trend', desc: '强趋势 (8-1)', pattern: 'RRRBBB', ratio: '3:3' },
        
        // 3-6: Alternating (1:1) -> Balance
        '36': { type: 'balanced_oscillation', desc: '平衡震荡 (3-6)', pattern: 'BRBRBR', ratio: '1:1' },
        '63': { type: 'balanced_oscillation', desc: '平衡震荡 (6-3)', pattern: 'RBRBRB', ratio: '1:1' },
        
        // 2-7: Micro Trend (1:2:3)
        '27': { type: 'micro_trend', desc: '微趋势 (2-7)', pattern: 'RBBBRR', ratio: '1:2:3' },
        '72': { type: 'micro_trend', desc: '微趋势 (7-2)', pattern: 'RRBBBR', ratio: '1:2:3' },
        
        // 4-5: Micro Trend (2:3:1)
        '45': { type: 'micro_trend', desc: '微趋势 (4-5)', pattern: 'RRBBBR', ratio: '2:3:1' },
        '54': { type: 'micro_trend', desc: '微趋势 (5-4)', pattern: 'RBBBRR', ratio: '2:3:1' }
    };

    // 64-Gua Probability Matrix (v3.1)
    const GUA_PROB = {};

    (function initGuaProb() {
        // Helper to check quadrant
        const isBlue = (n) => n >= 1 && n <= 4;
        const isRed = (n) => n >= 5 && n <= 8;

        for (let b1 = 1; b1 <= 8; b1++) {
            for (let b2 = 1; b2 <= 8; b2++) {
                const key = `${b1}${b2}`;
                let weights = [];
                // Target distribution
                if (isBlue(b1) && isBlue(b2)) {
                    // Strong Blue Context -> High prob for 1-4
                    weights = [0.2, 0.2, 0.2, 0.2, 0.05, 0.05, 0.05, 0.05];
                } else if (isRed(b1) && isRed(b2)) {
                    // Strong Red Context -> High prob for 5-8
                    weights = [0.05, 0.05, 0.05, 0.05, 0.2, 0.2, 0.2, 0.2];
                } else {
                    // Mixed -> Balanced (Slightly favor recent color?)
                    // If b2 is Blue, slightly favor Blue.
                    if (isBlue(b2)) weights = [0.15, 0.15, 0.15, 0.15, 0.1, 0.1, 0.1, 0.1];
                    else weights = [0.1, 0.1, 0.1, 0.1, 0.15, 0.15, 0.15, 0.15];
                }
                
                // Specific Overrides for known patterns (e.g., 1-2 -> 3)
                if (key === '12') {
                    // 1,2 -> 3 (Consecutive logic)
                    // Boost 3
                    weights[2] += 0.5; // Index 2 is number 3
                }
                
                // Normalize
                const total = weights.reduce((a,b)=>a+b, 0);
                const normWeights = weights.map(w => w/total);
                
                GUA_PROB[key] = {
                    next: [1,2,3,4,5,6,7,8],
                    weights: normWeights
                };
            }
        }
    })();

    // Auto-generate remaining 60 combinations based on bit patterns
    (function initBaguaStructure() {
        try {
            // Helper: Convert number 0-63 to 6-bit binary string
            const toBin = (n) => n.toString(2).padStart(6, '0');
            
            // Helper: Map binary to Bagua pair (using existing logic)
            // We need the reverse of BIN_TO_BAGUA or just reuse the logic
            const BIN_TO_BAGUA = {
                7: 1, 6: 5, 5: 3, 4: 7,
                3: 2, 2: 6, 1: 4, 0: 8
            };
            
            for (let i = 0; i < 64; i++) {
                const bits = toBin(i).split('').map(Number); // [1,0,1...]
                const g1 = bits.slice(0, 3);
                const g2 = bits.slice(3, 6);
                
                const val1 = g1[0]*4 + g1[1]*2 + g1[2]*1;
                const val2 = g2[0]*4 + g2[1]*2 + g2[2]*1;
                
                const b1 = BIN_TO_BAGUA[val1];
                const b2 = BIN_TO_BAGUA[val2];
                
                const key = `${b1}${b2}`;
                
                if (BAGUA_STRUCTURE[key]) continue; // Skip manually defined
                
                // Analyze Structure
                const blueCount = bits.filter(b => b === 1).length;
                const redCount = 6 - blueCount;
                
                let type = 'balanced_oscillation';
                let desc = `平衡 (${b1}-${b2})`;
                
                if (blueCount >= 5) {
                    type = 'strong_trend';
                    desc = `强蓝 (${b1}-${b2})`;
                } else if (redCount >= 5) {
                    type = 'strong_trend';
                    desc = `强红 (${b1}-${b2})`;
                } else if (blueCount === 4) {
                    type = 'micro_trend';
                    desc = `微蓝 (${b1}-${b2})`;
                } else if (redCount === 4) {
                    type = 'micro_trend';
                    desc = `微红 (${b1}-${b2})`;
                }
                
                BAGUA_STRUCTURE[key] = { type, desc, ratio: `${blueCount}:${redCount}` };
            }
            // console.log("[Init] Bagua Structure Map Complete (64/64)");
        } catch (e) {
            console.error("Critical Error in 64-Gua Logic Init - Soft Skipping:", e);
            if (window.AHS_onError) window.AHS_onError(e);
            // Fallback: Ensure at least basic keys exist if needed, or rely on defaults
        }
    })();

    // Helper: Micro Trend Detector
    function detectMicroTrend(history) {
        if (!Array.isArray(history) || history.length < 6) return 'balance';
        // Analyze last 6 rounds
        const last6 = history.slice(-6);
        let blue = 0, red = 0;
        last6.forEach(r => {
            const w = r.winner || (r.P_sum > r.B_sum ? 'Player' : 'Banker');
            if (['Player', 'Blue', 'blue'].includes(w)) blue++;
            else if (['Banker', 'Red', 'red'].includes(w)) red++;
        });
        
        if (blue > red) return 'blue_micro_trend';
        if (red > blue) return 'red_micro_trend';
        return 'balance';
    }

    // Helper: Predict Next Gua (v3.1)
    function predictNextGua(baguaSeq) {
        if (!baguaSeq || !baguaSeq.bagua1 || !baguaSeq.bagua2) return null;
        const { bagua1, bagua2 } = baguaSeq;
        const key = `${bagua1}${bagua2}`;
        
        // 1. Lookup Prob Matrix
        const prob = GUA_PROB[key];
        if (!prob) return null;
        
        // 2. Weighted Random Selection
        const totalWeight = prob.weights.reduce((a,b) => a+b, 0); // Should be 1, but for safety
        let rand = Math.random() * totalWeight;
        
        for (let i=0; i<prob.next.length; i++) {
            rand -= prob.weights[i];
            if (rand <= 0) return prob.next[i];
        }
        
        return prob.next[0];
    }

    // Helper: Quadrant Mapping (v3.1)
    function getQuadrant(gua) {
        if ([1,2,3,4].includes(gua)) return 'top-left';   // Blue Bias
        if ([5,6,7,8].includes(gua)) return 'bottom-right'; // Red Bias
        return 'balance';
    }

    // Helper: Self Consistency Check (v3.1)
    function detectSelfConsistency(history) {
        // Need last 4 Bagua numbers. 
        // generateBaguaSequence only gives last 2 based on last 6 rounds.
        // We need to iterate back to get last 4.
        // Or, we can just extract bits for last 12 rounds and map them?
        // Simpler: assume history has enough data.
        
        if (!history || history.length < 12) return null; // Need 3 rounds per Bagua * 4 = 12 rounds?
        // Wait, Bagua is 3 bits (3 rounds). 4 Bagua numbers = 12 rounds.
        
        // Let's generate last 4 Bagua digits.
        // Group 1: -12 to -10 -> B1
        // Group 2: -9 to -7 -> B2
        // Group 3: -6 to -4 -> B3
        // Group 4: -3 to -1 -> B4
        
        // Helper to get Bagua from slice
        const getBaguaFromSlice = (start, end) => {
            const slice = history.slice(start, end);
            if (slice.length < 3) return null;
            const seq = generateBaguaSequence(slice); // generateBaguaSequence uses last 6?
            // Actually generateBaguaSequence uses last 6 to get 2 baguas.
            // We can reuse it on smaller chunks if we adjust it, but it's hardcoded for last 6.
            // Let's rewrite a mini-extractor.
            
            // Re-implement bit extraction locally for flexibility
            const bits = slice.map(g => {
                const w = g.winner || (g.P_sum > g.B_sum ? 'Player' : 'Banker');
                if (['Player','Blue','blue'].includes(w)) return 1;
                return 0;
            });
            // Pad if needed? No, strict check.
            const val = bits[0]*4 + bits[1]*2 + bits[2]*1;
            const BIN_TO_BAGUA = { 7:1, 6:5, 5:3, 4:7, 3:2, 2:6, 1:4, 0:8 };
            return BIN_TO_BAGUA[val];
        };
        
        const last4Gua = [];
        for (let i=0; i<4; i++) {
            // Index from end: -3*(i+1) to -3*i
            const end = (i===0) ? undefined : -3*i;
            const start = -3*(i+1);
            const slice = history.slice(start, end);
            const b = getBaguaFromSlice(start, end);
            if (b) last4Gua.unshift(b); // Prepend to maintain order
        }
        
        if (last4Gua.length < 4) return null;
        
        // Rule 1: Sum 18
        const sum = last4Gua.reduce((a,b)=>a+b,0);
        if (sum === 18) return "self_consistent_18";
        
        // Rule 2: Repetition Pattern (Unique=3, one repeats twice) e.g. 1,2,2,8
        const unique = [...new Set(last4Gua)];
        if (unique.length === 3) {
            // Check if any element appears exactly twice
            for (let u of unique) {
                if (last4Gua.filter(x => x === u).length === 2) return "repetition_pattern";
            }
        }
        
        // Rule 3: Consecutive (e.g. 1,2,3,4 or 4,3,2,1)
        const isConsecutiveAsc = last4Gua.every((x,i) => i===0 || x === last4Gua[i-1] + 1);
        const isConsecutiveDesc = last4Gua.every((x,i) => i===0 || x === last4Gua[i-1] - 1);
        
        if (isConsecutiveAsc || isConsecutiveDesc) return "consecutive_pattern";
        
        return null;
    }

    // --- Models ---
    
    // --- Main Entry Point: Multi-Model Vote ---
    function MultiModelVote(context) {
        const history = (context.rawHistory && Array.isArray(context.rawHistory)) ? context.rawHistory : [];
        if (!history || history.length === 0) return { final: "Waiting...", strength: 0 };

        const lastRound = history[history.length - 1];

        // Dual-Core Branching (User Step 3)
        if (lastRound.platform === 'mobile') {
            // Mobile: Virtual S + Structure Intent
            return mobilePrediction(lastRound.virtualS);
        } else if (lastRound.platform === 'desktop') {
            // Desktop: High Precision Logic
            return desktopPrediction(history);
        } else {
            // Fallback / Hybrid / Legacy
            // If platform is unknown (e.g. existing tests), use legacy logic
            // Check if virtualS exists (Mobile-like)
            if (lastRound.virtualS !== undefined) {
                return mobilePrediction(lastRound.virtualS);
            }
            // Default to desktop-like analysis of history
            return desktopPrediction(history);
        }
    }

    function mobilePrediction(virtualS) {
        // Simple Thresholds
        let final = "平衡";
        let visual_class = "green";
        let s = virtualS || 0;

        if (s > 15) {
            final = "蓝倾向";
            visual_class = "blue player-solid"; // Strong Blue
        } else if (s < -15) {
            final = "红倾向";
            visual_class = "red banker-solid"; // Strong Red
        } else {
            final = "平衡";
            visual_class = "green";
        }
        
        return {
            final,
            strength: Math.abs(s),
            visual_class,
            strategy: "Mobile_Intent",
            note: `Mobile (S=${s})`
        };
    }

    function desktopPrediction(history) {
        // High Precision Logic (v4.0 Desktop Engine)
        let blueWeight = 0;
        let redWeight = 0;
        let details = [];

        const last = history[history.length - 1];
        
        // 1. Pair Detection (High Precision)
        // Check for Pairs (7/8)
        if (last.P1 !== undefined && last.P1 === last.P2) {
            if (last.P1 >= 7) {
                blueWeight += 2.0;
                details.push("闲对" + last.P1);
            } else {
                 blueWeight += 0.5; 
                 details.push("闲对");
            }
        }
        if (last.B1 !== undefined && last.B1 === last.B2) {
            if (last.B1 >= 7) {
                redWeight += 2.0;
                details.push("庄对" + last.B1);
            } else {
                 redWeight += 0.5;
                 details.push("庄对");
            }
        }

        // 2. Idle 8 / Natural Logic
        // P=8/9 vs B (Weak)
        if (last.p_val >= 8 && last.b_val <= 6) {
             blueWeight += 1.0;
             details.push("闲天牌");
        }
        if (last.b_val >= 8 && last.p_val <= 6) {
             redWeight += 1.0;
             details.push("庄天牌");
        }

        // 3. Quad Model (Four Numbers Gene Grid)
        // Check P1,P2,B1,B2 sequence patterns
        const nums = [last.P1, last.P2, last.B1, last.B2].filter(n => n !== undefined && n !== null);
        if (nums.length >= 4) {
            const sum = nums.reduce((a,b)=>a+b,0);
            if (sum === 18) {
                 details.push("四数合18");
                 // 18 often indicates balance or reversal in this system
            }
            // Gene Grid: Low/High distribution
            const highs = nums.filter(n => n >= 6).length;
            if (highs >= 3) details.push("高位基因");
        }

        // 4. 64 Gua Structure
        const baguaSeq = generateBaguaSequence(history);
        const structure = ModelB(baguaSeq);
        if (structure && structure.type === 'strong_trend') {
            if (structure.prediction.includes('蓝')) blueWeight += 1.5;
            if (structure.prediction.includes('红')) redWeight += 1.5;
            details.push(structure.desc);
        }

        // 5. Self Consistency
        const consistency = detectSelfConsistency(history);
        if (consistency) {
             details.push("自洽:" + consistency);
             if (consistency === 'self_consistent_18') {
                 // Special handling
             }
        }
        
        // Fallback to legacy voting if weights are low
        if (blueWeight < 1 && redWeight < 1) {
            const trend = detectMicroTrend(history);
            if (trend === 'blue_micro_trend') blueWeight += 1.0;
            if (trend === 'red_micro_trend') redWeight += 1.0;
        }

        // Decision
        let final = "平衡";
        let visual_class = "green";
        
        if (blueWeight > redWeight) {
            final = "蓝倾向";
            visual_class = "blue player-solid";
        } else if (redWeight > blueWeight) {
            final = "红倾向";
            visual_class = "red banker-solid";
        }

        return {
            final,
            strength: Math.abs(blueWeight - redWeight) * 20, // Scale to %
            visual_class,
            strategy: "Desktop_Precision",
            note: `Desktop (${details.join(',')})`
        };
    }

    // Export
    window.MultiModelVote = MultiModelVote;

    // --- Tie Logic Scanner (7 Rules) ---
    function checkTieLogic(history) {
        if (!Array.isArray(history) || history.length < 1) return false;
        
        // Need last 2 rounds for some rules
        const len = history.length;
        const g1 = history[len - 1]; // Latest
        const g2 = (len >= 2) ? history[len - 2] : null; // Previous

        // Extract P/B values (handle different formats)
        function getVals(g) {
            if (!g) return { p: 0, b: 0 };
            const p = (typeof g.playerVal === 'number') ? g.playerVal : (g.P_sum || 0);
            const b = (typeof g.bankerVal === 'number') ? g.bankerVal : (g.B_sum || 0);
            return { p, b };
        }

        const cur = getVals(g1);
        const prev = g2 ? getVals(g2) : null;

        let conditionsMet = 0;

        // Rule 1: 分子/分母 差1 (abs(P-B) == 1) [Latest]
        if (Math.abs(cur.p - cur.b) === 1) conditionsMet++;

        // Rule 3: 一方为零，另一方为 2, 4 [Latest]
        // (P=0 and B in [2,4]) or (B=0 and P in [2,4])
        if ((cur.p === 0 && [2,4].includes(cur.b)) || (cur.b === 0 && [2,4].includes(cur.p))) conditionsMet++;

        // Rule 4: 零平，大数平 [Latest]
        // P=0, B=0 OR P=B>=6
        if ((cur.p === 0 && cur.b === 0) || (cur.p === cur.b && cur.p >= 6)) conditionsMet++;

        // Rule 5: 分子/分母 同牌点 (abs(P-B) == 5, e.g. 9/4, 3/8) [Latest]
        // "同牌点" usually refers to distance 5 in Bagua context (1-6, 2-7, etc.)
        if (Math.abs(cur.p - cur.b) === 5) conditionsMet++;

        if (prev) {
            // Rule 2: 两局 分子/分母相加 分子=分母 [Last 2]
            // (P1 + P2) == (B1 + B2)
            if ((prev.p + cur.p) === (prev.b + cur.b)) conditionsMet++;

            // Rule 6: 两组分子/分母 包含 三个连续的数字 [Last 2]
            const allNums = [prev.p, prev.b, cur.p, cur.b].sort((a,b) => a-b);
            // Check for 3 consecutive
            // Remove duplicates for sequence checking? "1/6, 7/8" -> 1,6,7,8. 6,7,8 consecutive.
            // "1,1,2,3" -> 1,2,3 consecutive.
            const uniqueNums = [...new Set(allNums)].sort((a,b) => a-b);
            let hasConsecutive = false;
            for (let i = 0; i < uniqueNums.length - 2; i++) {
                if (uniqueNums[i+1] === uniqueNums[i] + 1 && uniqueNums[i+2] === uniqueNums[i] + 2) {
                    hasConsecutive = true;
                    break;
                }
            }
            if (hasConsecutive) conditionsMet++;

            // Rule 7: 两组分子/分母 由 纯单（双）数 构成 [Last 2]
            const nums = [prev.p, prev.b, cur.p, cur.b];
            const allOdd = nums.every(n => n % 2 !== 0);
            const allEven = nums.every(n => n % 2 === 0);
            if (allOdd || allEven) conditionsMet++;
        }

        // Return true if >= 2 conditions met
        if (conditionsMet >= 2) {
            console.log(`[TieScanner] ⚠️ Tie Prediction Triggered! Conditions Met: ${conditionsMet}/7`);
            return true;
        }
        return false;
    }

    // Model A: Based on High Odds Rules (Original H function)
    function ModelA(c){
        // Debug Input
        // console.log("[ModelA Input]", c);
        
        if(!c||typeof c.P_sum!=='number') return "高倍";
        var P=c.P_sum|0,B=c.B_sum|0,
            lc=String(c.lastTwoColor||''),
            h=Array.isArray(c.history)?c.history:[],
            i,t;
        
        var res = "高倍"; // Default

        if(P===8){
            // Bear Logic (Updated)
             // Conditions:
             // 1. P=8
             // 2. Trend: Ends with 'Blue' (Standard) OR
             // 3. Interval 1 Echo: Gap of 1 round from previous Bear (Index -2)
             // 4. "Only 1 time" -> Prevent infinite echo chain.
             //    If T-2 was Bear, check T-4. If T-4 was also Bear, assume T-2 was an Echo (or frequent), so stop.
             
             var lcStr = (typeof lc === 'string') ? lc : '';
             var isBlueTrend = lcStr.endsWith('蓝');
             
             var gapBear = false;
             if (h.length >= 2 && h[h.length-2] === '熊') {
                 // Check T-4 to prevent chain: P -> N -> P -> N -> P...
                 // If T-4 was also Bear, we suppress this 2nd Echo.
                 if (h.length < 4 || h[h.length-4] !== '熊') {
                     gapBear = true;
                 }
             }
             
             if (isBlueTrend || gapBear) {
                 res = '熊';
             }
        }
        
        if(res==="高倍" && !(P===0 && B===0)){
            t=Math.abs(P-B);
            var m=Math.max(P,B);
            if(m>0 && t/m<=0.05) res = '平衡';
        }
        if(res==="高倍" && (P===8||B===8) && P%2===0 && B%2===0) res = '红6';
        
        if(res==="高倍") {
            // Pairs Logic (Updated)
            // Conditions (Must be simultaneous):
            // 1. (P+B) % 4 === 0
            // 2. History: Pair appeared at Index -2 (Gap 1) OR Index -7/-8 (Gap 6-7)
            // 3. Zero Check: P=0 -> Blue Pair, B=0 -> Red Pair
            
            var sum4 = ((P + B) % 4 === 0);
            if (sum4) {
                var targetPairs = ['蓝对', '红对', '普对'];
                var hasHistory = false;
                
                // Gap 1 (Index -2)
                if (h.length >= 2 && targetPairs.includes(h[h.length-2])) hasHistory = true;
                
                // Gap 6-7 (Index -7, -8)
                if (!hasHistory) {
                    if (h.length >= 7 && targetPairs.includes(h[h.length-7])) hasHistory = true;
                    else if (h.length >= 8 && targetPairs.includes(h[h.length-8])) hasHistory = true;
                }
                
                if (hasHistory) {
                    if (P === 0) res = '蓝对';
                    else if (B === 0) res = '红对';
                    // Else: Strict condition 3 not met, so no pair.
                }
            }
        }
        
        if(res==="高倍") {
            var bb=(lc==='蓝蓝');
            var h31=(P===3 && B===1);
            var h86=(P===8 && B===6);
            if(bb && (h31||h86)) res = '蓝7';
        }
        
        return res;
    }

    // --- Type Definitions ---
    /** 
     * @typedef {Object} NaturalRound 
     * @property {number} P_sum - Player point value (0-9) 
     * @property {number} B_sum - Banker point value (0-9) 
     * @property {string} winner - Winner ('Player', 'Banker', 'Tie')
     */ 
 
    /** 
     * @typedef {Object} BaguaSequence 
     * @property {number[]} he9Values - Sequence of (P+B)%10 values
     * @property {number|null} bagua1 - First Bagua Digit
     * @property {number|null} bagua2 - Second Bagua Digit
     * @property {number[]} sequence - Alias for he9Values
     */

    // --- Helper Functions ---

    // Calculate Pattern Strength for Phase Selection
    function calculatePatternStrength(he9Seq) {
        if (!he9Seq || he9Seq.length < 6) return 0;
        const seqStr = he9Seq.join('');
        // Check for strong patterns
        if (seqStr.includes('142')) return 10;
        if (seqStr.includes('857')) return 10;
        if (seqStr.includes('8735')) return 8; // Quad Cancel
        if (seqStr.includes('5378')) return 8; // Mirror
        if (seqStr.includes('7853')) return 8; // Rotation
        return 0;
    }

    // Generate Bagua Sequence with Phase Alignment
    function generateBaguaSequenceWithPhase(history) {
        // Need at least 6 rounds
        if (!Array.isArray(history) || history.length < 6) return null;
        
        // Try up to 3 offsets (0, 1, 2) from the end to find the best structural fit
        const phases = [];
        const maxOffset = Math.min(2, history.length - 6);
        
        for (let offset = 0; offset <= maxOffset; offset++) {
            // We want the chunk ending at 'length - offset'
            const end = (offset === 0) ? undefined : -offset;
            // We need at least 6 items ending there.
            // Let's take the *whole* available sequence up to that point, 
            // or just the last 6-12? Bagua generator takes last 6 by default.
            // So we just pass the sliced history.
            
            const chunk = history.slice(0, end); 
            if (chunk.length < 6) continue;
            
            const baguaData = generateBaguaSequence(chunk);
            if (baguaData) {
                const strength = calculatePatternStrength(baguaData.sequence);
                phases.push({ data: baguaData, strength, offset });
            }
        }
        
        if (phases.length === 0) return null;
        
        // Return the one with highest strength. If tie, prefer smaller offset (more recent).
        phases.sort((a, b) => {
            if (b.strength !== a.strength) return b.strength - a.strength;
            return a.offset - b.offset;
        });
        
        // console.log(`[PhaseAlignment] Selected Offset: ${phases[0].offset}, Strength: ${phases[0].strength}`);
        return phases[0].data;
    }

    // Core Bagua Generator (Pure - Pattern Based v3.0)
    function generateBaguaSequence(history) {
        if (!Array.isArray(history) || history.length < 3) return null;

        const validRounds = history.filter(r => 
            (r && typeof r.winner === 'string') ||
            (r && (typeof r.P_sum === 'number' || typeof r.playerVal === 'number'))
        );

        if (validRounds.length < 3) return null;

        // Dynamic slice based on available history
        // If 3-5 rounds: 1 Bagua (Current)
        // If >=6 rounds: 2 Baguas (Previous + Current)
        const numBaguas = Math.min(2, Math.floor(validRounds.length / 3));
        const sliceLen = numBaguas * 3;
        const lastChunk = validRounds.slice(-sliceLen);
        
        // Helper: Map Round to Bit (Blue=1, Red=0)
        function getBit(g) {
            if (g.winner) {
                if (['Player','Blue','blue'].includes(g.winner)) return 1;
                if (['Banker','Red','red'].includes(g.winner)) return 0;
            }
            // Fallback to P/B sum
            const p = (typeof g.playerVal === 'number') ? g.playerVal : (g.P_sum || 0);
            const b = (typeof g.bankerVal === 'number') ? g.bankerVal : (g.B_sum || 0);
            return p > b ? 1 : 0; 
        }

        // Convert to Bits
        const bits = lastChunk.map(getBit);
        
        // Map Binary Pattern to Bagua Digit
        const BIN_TO_BAGUA = {
            7: 1, 6: 5, 5: 3, 4: 7,
            3: 2, 2: 6, 1: 4, 0: 8
        };

        function toDigit(triplet) {
            const val = triplet[0]*4 + triplet[1]*2 + triplet[2]*1;
            return BIN_TO_BAGUA[val];
        }

        let bagua1 = null;
        let bagua2 = null;

        if (numBaguas === 1) {
            // Only 1 Bagua (Current)
            bagua2 = toDigit(bits); 
            bagua1 = null;
        } else {
            // 2 Baguas
            const g1 = bits.slice(0, 3);
            const g2 = bits.slice(3, 6);
            bagua1 = toDigit(g1);
            bagua2 = toDigit(g2);
        }

        return { 
            bagua1, 
            bagua2, 
            he9Values: bits, 
            sequence: bits
        };
    }

    // Model B: Structural Recognition Engine (v3.0)
    function ModelB(baguaSeq) {
        if (!baguaSeq) return { type: 'balanced_oscillation', desc: '等待数据', prediction: '平衡' };
        
        const { bagua1, bagua2, he9Values } = baguaSeq;
        const key = `${bagua1}${bagua2}`;

        // 1. Direct Lookup
        if (BAGUA_STRUCTURE[key]) {
            return BAGUA_STRUCTURE[key];
        }

        // 2. Dynamic Classification
        // Count Blues (1s) in the 6-bit sequence
        const blueCount = he9Values.reduce((a, b) => a + b, 0);
        const redCount = 6 - blueCount;

        // Strong Trend (>=5 same color)
        if (blueCount >= 5) return { type: 'strong_trend', desc: `强蓝趋势 (${key})`, prediction: '蓝倾向' };
        if (redCount >= 5) return { type: 'strong_trend', desc: `强红趋势 (${key})`, prediction: '红倾向' };

        // Micro Trend (4:2)
        if (blueCount === 4) return { type: 'micro_trend', desc: `偏蓝微势 (${key})`, prediction: '蓝倾向' };
        if (redCount === 4) return { type: 'micro_trend', desc: `偏红微势 (${key})`, prediction: '红倾向' };

        // Balanced/Complex (3:3)
        // We already handled 1-8 (Block) and 3-6 (Alt) in BAGUA_STRUCTURE.
        // Remaining 3:3 cases are likely mixed.
        // Default to Balance or Micro Trend based on last bit?
        // User says "Structure Intent".
        // Let's default to Balanced Oscillation for 3:3 unless specified.
        return { type: 'balanced_oscillation', desc: `平衡结构 (${key})`, prediction: '平衡' };
    }

    // Model C: Based on Trend Continuity (New)
    function ModelC(context) {
        if (!context || !Array.isArray(context.history) || context.history.length === 0) return '普对';
        const last = context.history[context.history.length - 1];
        if (last === '蓝对' || last === '熊猫') return '蓝7';
        if (last === '红6' || last === '红对') return '红对';
        return '普对';
    }

    // 真实 S 值计算（基于多模型投票权重）
    function calculateRealSValue(context) {
        const { history } = context;
        
        // 1. 获取各模型权重
        const modelAWeight = getModelWeight('A'); // 高倍规则
        const modelBWeight = getModelWeight('B'); // 八卦结构
        const modelCWeight = getModelWeight('C'); // 趋势延续

        // 2. 计算各模型输出
        const voteA = ModelA(context);
        const baguaSeq = generateBaguaSequence(history);
        const voteB_Obj = ModelB(baguaSeq);
        const voteC = ModelC(context);

        // 3. 归一化为蓝/红权重
        let blueWeight = 0, redWeight = 0;
        
        // Model A Analysis
        if (voteA.includes('蓝') || voteA.includes('熊猫')) blueWeight += modelAWeight;
        if (voteA.includes('红')) redWeight += modelAWeight;
        
        // Model B Analysis
        if (voteB_Obj) {
            if (voteB_Obj.prediction === '蓝倾向') blueWeight += modelBWeight;
            else if (voteB_Obj.prediction === '红倾向') redWeight += modelBWeight;
            else if (voteB_Obj.type === 'strong_trend' || voteB_Obj.type === 'micro_trend_blue') {
                 // Fallback if prediction string varies
                 if (voteB_Obj.desc.includes('蓝')) blueWeight += modelBWeight;
            } else if (voteB_Obj.type === 'micro_trend_red') {
                 if (voteB_Obj.desc.includes('红')) redWeight += modelBWeight;
            }
        }
        
        // Model C Analysis
        if (voteC.includes('蓝') || voteC.includes('蓝7')) blueWeight += modelCWeight;
        if (voteC.includes('红') || voteC.includes('红对')) redWeight += modelCWeight;

        // 4. 计算 S 值
        const total = blueWeight + redWeight;
        if (total === 0) return 0;
        return ((blueWeight - redWeight) / total) * 100;
    }

    // Keep H as internal reference if needed, but expose MultiModelVote
    // The original H function is now ModelA.

    function R(pred){
        // [FORCE RENDER] Override with global decision color
        // Map: 0=Blue, 1=Red, 2=Green/Neutral
        const globalColor = window.nextDecisionColor;
        let effectiveBias = null;
        if (globalColor === 0) effectiveBias = 'blue';
        else if (globalColor === 1) effectiveBias = 'red';
        else effectiveBias = null; // Green/Neutral

        console.log("[RENDER] Using bias:", effectiveBias, "(Global:", globalColor, ")");

        var c=document.getElementById('prediction-circle');
        var n=document.getElementById('prediction-note');
        var s=document.getElementById('prediction-strategy');
        var ho=document.getElementById('high-odds-display'); // New High Odds Display

        if(!c || !pred) return;
        var np=pred.next_prediction;
        
        // Translate for Mobile/Chinese UI
        var displayNp = np;
        if (np === 'Player') displayNp = '下局闲胜';
        else if (np === 'Banker') displayNp = '下局庄胜';
        else if (np === 'Balance' || np === 'Tie') displayNp = '跟跳'; // User Request: "观望" -> "跟跳"
        else if (np === 'Waiting...') displayNp = '等待数据';
        
        var conf=pred.confidence;
        var bt=pred.bagua_trend;
        // Use effectiveBias instead of pred.bias_color
        var bc = effectiveBias; 
        
        // v3.1 Visual Class Support
        if (pred.visual_class) {
            console.log("[DEBUG] renderPrediction applied visual_class:", pred.visual_class);
            c.className = 'pred-visual ' + pred.visual_class;
        } else {
            c.className = 'pred-visual ' + (bc || 'green');
        }

        var note=pred.note;
        var strategy=pred.strategy;
        
        // Update Strategy Text
        if (s) {
            s.innerHTML = `
                <div>Strategy: ${strategy || 'Base'}</div>
                <div style="font-size:0.8em; color: #888;">Market: ${pred.sci_status || 'INIT'}</div>
            `;
        }

        // Update Note
        if (n) {
            if (pred.note) {
                 n.innerHTML = `<div>${displayNp}</div><div style="font-size:0.9em; color:#ddd;">(结构: ${pred.note})</div>`;
            } else {
                n.innerHTML = `
                    <div>${displayNp}</div>
                    <div style="font-size:0.8em;">Conf: ${conf}%</div>
                <div style="font-size:0.8em; color: ${pred.trend_bias==='blue'?'cyan':(pred.trend_bias==='red'?'pink':'#aaa')}">
                    Trend: ${pred.trend_bias || 'Neutral'}
                </div>
                `;
            }
        }
        
        // Update High Odds Display
        if (ho) {
            if (strategy === 'HighOdds' || strategy === 'Panda' || strategy === 'Pairs') {
                ho.style.display = 'block';
                ho.innerText = `⚡ ${displayNp} ⚡`;
                ho.className = 'high-odds-alert ' + (bc || 'neutral');
            } else {
                ho.style.display = 'none';
            }
        }
    }

    function M(){
        console.log("Monitor initialized");
    }

    window.EncryptedLogic = {
        ModelA: ModelA,
        ModelB: ModelB,
        ModelC: ModelC,
        MultiModelVote: MultiModelVote,
        renderPrediction: R,
        initMonitor: M,
        getHighOddsResult: MultiModelVote,
        calculateRealSValue: calculateRealSValue,
        // Exposed for v3.1 Testing
        generateBaguaSequence: generateBaguaSequence,
        predictNextGua: predictNextGua,
        detectSelfConsistency: detectSelfConsistency,
        getQuadrant: getQuadrant
    };
    
    // [User Request] Force Register Dynamics Plugin for Tests
    // Note: G2Engine is a Class, not an instance. This block was causing errors.
    // Tests should register plugins on their own engine instances.
    /*
    if (typeof window.G2Engine !== 'undefined' && typeof window.G2Engine.registerPlugin === 'function') {
        window.G2Engine.registerPlugin('Dynamics', {
            predict: (context) => {
                // 在特定条件下覆盖默认策略 
                if (context.history && context.history.length >= 5) { 
                    const last5 = context.history.slice(-5); 
                    const blueWins = last5.filter(g => g.P_sum > g.B_sum).length; 
                    if (blueWins >= 4) return "蓝倾向"; 
                } 
                return null; // 不干预 
            }
        });
        console.log("[DynamicsPlugin] Registered via EncryptedLogic");
    }
    */

})();
