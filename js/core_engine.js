/**
 * G2-GOLD Core Engine
 * Implements Bagua Logic, Three Genes, and Grid System based on V3.2 Architecture
 * Updated for Phase 3: Supports Plugin System
 */

class G2Engine {
    constructor() {
        this.history = []; // List of rounds
        this.grid = []; // 18x6 grid memory
        this.currentGridPos = { col: 0, row: 0 };
        this.plugins = []; // Registered plugins
    }

    /**
     * Register a plugin to extend functionality
     * @param {Object} plugin - Plugin object containing init, onRoundProcessed, onPredict hooks
     */
    registerPlugin(plugin) {
        if (typeof plugin.init === 'function') {
            plugin.init(this);
        }
        this.plugins.push(plugin);
        console.log(`Plugin registered: ${plugin.name || 'Unnamed Plugin'}`);
    }

    /**
     * Map card point to Gene Type
     * Zero: 0 (10, J, Q, K)
     * Small: 2, 3, 4, 5
     * Big: 6, 7, 8, 9
     */
    getGeneType(point) {
        if (point === 0) return "Zero";
        if (point >= 2 && point <= 5) return "Small";
        if (point >= 6 && point <= 9) return "Big";
        if (point === 1) return "Small"; 
        return "Unknown";
    }

    /**
     * Calculate Bagua Binary Stream
     * Big (6-9) -> 1
     * Small (1-5) & Zero -> 0
     */
    toBinary(point) {
        return (point >= 6 && point <= 9) ? 1 : 0;
    }

    /**
     * Process a new round result
     * @param {number} playerVal - Player point value (0-9)
     * @param {number} bankerVal - Banker point value (0-9)
     */
    processRound(playerVal, bankerVal, playerPair = false, bankerPair = false) {
        let winner = "Tie";
        if (playerVal > bankerVal) winner = "Player";
        if (bankerVal > playerVal) winner = "Banker";

        // Create result object
        const result = {
            id: this.history.length + 1,
            playerVal: playerVal,
            bankerVal: bankerVal,
            winner: winner,
            isPair: playerVal === bankerVal,
            // Detailed markers for rendering
            markers: {
                bluePair: playerPair,
                redPair: bankerPair,
                isTie: playerVal === bankerVal,
                pVal: playerVal,
                bVal: bankerVal,
                // Crown logic: P=7, B=6
                crown: (playerVal === 7 && bankerVal === 6)
            }
        };

        this.history.push(result);
        
        // Update Grid (Big Road Logic)
        this.updateGrid(result);
        
        // Notify plugins
        for (const plugin of this.plugins) {
            if (typeof plugin.onRoundProcessed === 'function') {
                plugin.onRoundProcessed(result, this.history);
            }
        }

        return result;
    }

    updateGrid(result) {
        // Robust Big Road Logic
        
        // 1. If Tie -> Do not occupy cell, mark last placed cell.
        if (result.winner === 'Tie') {
            // Find last placed cell by scanning backwards
            outer: for (let c = this.grid.length - 1; c >= 0; c--) {
                for (let r = 5; r >= 0; r--) {
                    if (this.grid[c][r] !== "") {
                        const cell = this.grid[c][r];
                        if (!cell.markers.isTie) {
                             cell.markers.isTie = true; 
                        } else {
                            cell.markers.tieCount = (cell.markers.tieCount || 0) + 1;
                        }
                        return; // Done
                    }
                }
            }
            return; // Grid empty, Tie ignored or handled? Usually ignored if first.
        }

        // --- Normal P/B Placement ---
        
        // Find the absolute last placed cell to determine position
        let lastCol = -1;
        let lastRow = -1;
        
        // Scan backwards to find the very last item
        search: for (let c = this.grid.length - 1; c >= 0; c--) {
            for (let r = 5; r >= 0; r--) {
                if (this.grid[c][r] !== "") {
                    lastCol = c;
                    lastRow = r;
                    break search;
                }
            }
        }
        
        if (lastCol === -1) {
            // Grid is empty
            this._ensureCapacity(0);
            this.grid[0][0] = result;
            return;
        }
        
        const lastCell = this.grid[lastCol][lastRow];
        // Note: lastCell might be a Dragon Tail item.
        // We need to know the "Logical" trend.
        // Big Road Logic:
        // Compare new winner with the winner of the "Head" of the current column?
        // OR simply compare with the *Last Placed Winner*?
        // Standard: Compare with the winner of the *sequence*.
        // If we are in a Dragon Tail, the sequence is the same color.
        
        const lastWinner = lastCell.winner; 
        
        if (result.winner === lastWinner) {
            // Same Winner -> Continue Trend
            // 1. Try going DOWN.
            // 2. If blocked or bottom reached -> Go RIGHT (Dragon Tail).
            
            // Check availability of (lastCol, lastRow + 1)
            if (lastRow + 1 < 6) {
                if (this.grid[lastCol][lastRow + 1] === "") {
                    this.grid[lastCol][lastRow + 1] = result;
                } else {
                    // Blocked (Collision) -> Dragon Tail
                    this._placeDragonTail(lastCol, lastRow, result);
                }
            } else {
                // Bottom Reached -> Dragon Tail
                this._placeDragonTail(lastCol, lastRow, result);
            }
        } else {
            // Different Winner -> New Column
            // Logic: Start at the column immediately following the LAST placed item (even if it was a dragon tail)
            // This prevents "connecting to the tail" and ensures separate L-shapes.
            
            let targetCol = lastCol + 1;
            
            // Ensure capacity
            this._ensureCapacity(targetCol);
            
            // Safety: Ensure Row 0 is free. 
            // Also, check if this new column position would visually look like it's attaching to the tail of a previous dragon.
            // The user rule: "When dragon tail ends and color changes, it must start at Row 0, and MUST NOT attach to the tail."
            // The simple 'lastCol + 1' rule generally handles this because dragon tails occupy bottom cells,
            // but if the dragon tail was on Row 0 (very rare in Big Road, but possible if user means 'streak'),
            // we must ensure we are fresh.
            // Actually, `lastCol` IS the tail end column. `lastCol + 1` is the next column.
            // Since we always place at Row 0 for a new color, and `lastCol` was occupied by the previous color,
            // placing at `lastCol+1` at Row 0 is visually distinct IF the previous tail didn't occupy Row 0 of `lastCol+1`.
            // But `lastCol` is the *last occupied column*. So `lastCol+1` is empty.
            // So placing at `[lastCol+1][0]` is always safe and visually separated from a tail that might be at `[lastCol][5]`.
            
            // However, to be absolutely safe and clear:
            while (this.grid[targetCol][0] !== "") {
                targetCol++;
                this._ensureCapacity(targetCol);
            }
            
            this.grid[targetCol][0] = result;
        }
    }
    
    _placeDragonTail(lastCol, lastRow, result) {
        // Move Right
        let targetCol = lastCol + 1;
        let targetRow = lastRow; // Maintain row height (Dragon Tail effect)
        
        this._ensureCapacity(targetCol);
        
        // If target blocked? (Double Dragon?)
        // Standard: Move right.
        this.grid[targetCol][targetRow] = result;
    }
    
    _ensureCapacity(colIdx) {
        while (colIdx >= this.grid.length) {
            this.grid.push(new Array(6).fill(""));
        }
    }

    /**
     * Predict next round
     * @returns {Object} Prediction result
     */
    predictNext() {
        if (this.history.length < 3) {
            return { next_prediction: "Waiting...", confidence: 0 };
        }

        let predictionResult = {
            next_prediction: "Player", // Default fallback
            confidence: 0.5,
            strategy: "Base_Trend",
            risk_level: "Medium",
            details: {}
        };

        // Plugin-based prediction takes precedence
        // We iterate plugins and let them modify/override the prediction
        // The last plugin in the chain has the final say unless we implement a voting mechanism
        // For Phase 3, we expect DynamicsEngine to be the main driver.
        
        for (const plugin of this.plugins) {
            if (typeof plugin.onPredict === 'function') {
                const pluginResult = plugin.onPredict(this.history);
                if (pluginResult) {
                    // Merge or override
                    predictionResult = { ...predictionResult, ...pluginResult };
                }
            }
        }

        return predictionResult;
    }

    /**
     * Undo Last Round
     * Reverts the state by popping the last history item and rebuilding the grid/plugins.
     */
    undoLastRound() {
        if (this.history.length === 0) return false;

        // 1. Remove last round from history
        const removed = this.history.pop();
        
        // 2. Rebuild State (Grid & Plugins)
        // Reset Grid
        this.grid = [];
        this.currentGridPos = { col: 0, row: 0 };
        
        // Reset Plugins
        this.plugins.forEach(plugin => {
            if (typeof plugin.onReset === 'function') {
                plugin.onReset();
            }
        });

        // 3. Replay History
        const currentHistory = [...this.history];
        this.history = []; // Clear for replay

        currentHistory.forEach(round => {
            // Re-process without creating new ID
            this._replayRound(round);
        });
        
        return true;
    }

    _replayRound(round) {
        this.history.push(round);
        this.updateGrid(round);
        
        for (const plugin of this.plugins) {
            if (typeof plugin.onRoundProcessed === 'function') {
                plugin.onRoundProcessed(round, this.history);
            }
        }
    }
    
    reset() {
        this.history = [];
        this.grid = [];
        this.plugins.forEach(plugin => {
            if (typeof plugin.onReset === 'function') {
                plugin.onReset();
            }
        });
    }
}
