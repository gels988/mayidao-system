/**
 * Bagua Transcoder (Phase 3 Core)
 * Handles conversion between Natural Numbers, Binary Trigrams, and Bagua Attributes.
 * Acts as the semantic bridge for the system.
 */

class BaguaTranscoder {
    constructor() {
        this.map = {
            1: { bin: "111", name: "Qian", element: "Metal", nature: "Yang" },
            2: { bin: "011", name: "Dui",  element: "Metal", nature: "Yang" },
            3: { bin: "101", name: "Li",   element: "Fire",  nature: "Yang" },
            4: { bin: "001", name: "Zhen", element: "Wood",  nature: "Yang" },
            5: { bin: "110", name: "Xun",  element: "Wood",  nature: "Yin" },
            6: { bin: "010", name: "Kan",  element: "Water", nature: "Yin" },
            7: { bin: "100", name: "Gen",  element: "Earth", nature: "Yin" },
            8: { bin: "000", name: "Kun",  element: "Earth", nature: "Yin" }
        };
        
        // Reverse Map for Binary -> Number
        this.binMap = {};
        for (let k in this.map) {
            this.binMap[this.map[k].bin] = parseInt(k);
        }
    }

    /**
     * Convert 3-bit Binary String to Bagua Number
     * @param {string} binStr "111", "011", etc.
     * @returns {number|null} 1-8
     */
    binToNumber(binStr) {
        return this.binMap[binStr] || null;
    }

    /**
     * Convert Natural Number (0-9) to Bagua Number (1-8)
     * Rules: 0->8, 9->1, others identity.
     * @param {number} n 
     * @returns {number} 1-8
     */
    naturalToBagua(n) {
        if (n === 0) return 8;
        if (n === 9) return 1;
        if (n >= 1 && n <= 8) return n;
        return 8; // Fallback
    }

    /**
     * Get full attributes for a Bagua Number
     * @param {number} n 1-8
     */
    getAttributes(n) {
        const key = this.naturalToBagua(n);
        return { val: key, ...this.map[key] };
    }
    
    /**
     * Calculate Bagua from 3 Game Rounds (Streaks)
     * P=1 (Yang), B=0 (Yin)
     * @param {Array} streakChunk Array of 3 streak objects {winner: 'Player'/'Banker'}
     * @returns {number|null}
     */
    fromStreaks(streakChunk) {
        if (!streakChunk || streakChunk.length !== 3) return null;
        
        const binStr = streakChunk.map(s => 
            s.winner === 'Player' ? '1' : '0'
        ).join('');
        
        return this.binToNumber(binStr);
    }
}

// Global Instance for usage in other scripts
const Bagua = new BaguaTranscoder();
