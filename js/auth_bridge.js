/**
 * AuthBridge & Economy System (Consolidated)
 * Manages User Identity, G-Coin Balance, VIP Status, and Transactions.
 * Replaces previous multi-file economy modules to ensure stability.
 */

function calculateBonusGCoins(usdAmount) {
    usdAmount = Math.floor(usdAmount);
    if (!Number.isFinite(usdAmount) || usdAmount < 1) return 0;
    let rate;
    if (usdAmount >= 5000) {
        rate = 2.8;
    } else if (usdAmount >= 2000) {
        rate = 2.6;
    } else if (usdAmount >= 200) {
        rate = 2.2;
    } else {
        rate = 2.0;
    }
    return Math.floor(usdAmount * rate);
}

class AuthBridge {
    constructor() {
        this.STORAGE_KEY = 'mayiju_user';
        this.LAUNCH_PHASE_DAYS = 30;
        this.user = this.loadUser();
        console.log("AuthBridge Initialized (Economy Mode)", this.user.id);
        
        // Expose for debugging
        window.Economy = this;
    }

    // --- User Data Management ---

    loadUser() {
        let user = null;
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            if (raw) {
                // Try deobfuscate first
                try {
                    user = JSON.parse(atob(raw).split('').reverse().join(''));
                } catch (e) {
                    // Fallback to plain JSON if obfuscation fails or old format
                    user = JSON.parse(raw);
                }
            }
        } catch (e) {
            console.error("Load user failed", e);
        }

        if (!user || !user.id) {
            user = this.createNewUser();
        }

        let refFromUrl = null;
        try {
            if (typeof window !== 'undefined' && window.location && window.location.search) {
                const params = new URLSearchParams(window.location.search);
                refFromUrl = params.get('ref');
            }
        } catch (e) {}

        if (refFromUrl && !user.ref) {
            user.ref = refFromUrl;
        }

        // Migration/Validation
        if (typeof user.balanceG === 'undefined') user.balanceG = 3000;
        if (typeof user.bonusG === 'undefined') user.bonusG = user.balanceG;
        if (typeof user.principalG === 'undefined') user.principalG = 0;
        if (typeof user.vipTier === 'undefined') user.vipTier = 0;
        if (typeof user.totalRechargedU === 'undefined') user.totalRechargedU = 0;

        this.saveUser(user);
        return user;
    }

    createNewUser() {
        return {
            id: 'USER-' + Math.floor(Math.random() * 100000),
            createdAt: Date.now(),
            balanceG: 3000,
            bonusG: 3000,
            principalG: 0,
            vipTier: 0,
            totalRechargedU: 0
        };
    }

    saveUser(user) {
        if (!user) user = this.user;
        try {
            // Simple Obfuscation
            const data = btoa(JSON.stringify(user).split('').reverse().join(''));
            localStorage.setItem(this.STORAGE_KEY, data);
        } catch (e) {
            console.error("Save user failed", e);
            // Fallback
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
        }
        this.user = user;
    }

    // --- Info Accessors ---

    getVipInfo() {
        // Sync VIP Tier from TrialManager if Activated
        if (window.TrialManager && window.TrialManager.isPermanentlyActivated()) {
            const activatedTier = window.TrialManager.getActivatedTier();
            if (activatedTier > this.user.vipTier) {
                this.user.vipTier = activatedTier;
                this.saveUser();
            }
        }

        const tiers = [
            { name: "Common", discount: 1.0 },
            { name: "Backbone", discount: 0.9 },
            { name: "Core", discount: 0.8 },
            { name: "Whale", discount: 0.7 }
        ];
        const idx = Math.min(this.user.vipTier, tiers.length - 1);
        return tiers[idx];
    }

    async getAccountStatus() {
        // Sync with Trial Manager if active
        if (window.TrialManager) {
            this.user.balanceG = window.TrialManager.getBalance();
        }

        // Async to simulate network delay if needed, but keeps UI snappy
        const vip = this.getVipInfo();
        
        let vipName = vip.name;
        // Override VIP name for Trial Status
        if (window.TrialManager) {
            if (window.TrialManager.isPermanentlyActivated()) {
                vipName = `${vip.name} (Activated)`;
            } else if (window.TrialManager.isInTrial()) {
                vipName = "TRIAL USER";
            } else {
                vipName = "EXPIRED";
            }
        }

        return {
            user_id: this.user.id,
            balance: this.user.balanceG,
            vip_level: this.user.vipTier,
            vip_name: vipName,
            vip_discount: vip.discount
        };
    }

    // --- Transactions ---

    async deductGCoins(baseAmount = 5) {
        // Check Trial Status
        let cost;
        if (window.TrialManager) {
             if (window.TrialManager.isPermanentlyActivated()) {
                 // Normal VIP Logic
                 const vip = this.getVipInfo();
                 cost = Math.max(1, Math.floor(baseAmount * vip.discount));
             } else if (window.TrialManager.isInTrial()) {
                 // Trial High Cost Logic
                 cost = 20; // Fixed high cost for trial
             } else {
                 return { success: false, error: "Trial Expired. Please Activate." };
             }
        } else {
            // Fallback if TrialManager missing
            const vip = this.getVipInfo();
            cost = Math.max(1, Math.floor(baseAmount * vip.discount));
        }

        if (this.user.balanceG < cost) {
            return { success: false, error: "Insufficient G-Coins" };
        }

        // Burn Strategy: Bonus First
        const deductBonus = Math.min(this.user.bonusG, cost);
        const remaining = cost - deductBonus;

        this.user.bonusG -= deductBonus;
        this.user.principalG = Math.max(0, this.user.principalG - remaining);
        this.user.balanceG = this.user.bonusG + this.user.principalG;

        this.saveUser();
        
        // Sync back to TrialManager to persist balance
        if (window.TrialManager) {
            window.TrialManager.state.balance = this.user.balanceG;
            window.TrialManager.saveState();
        }

        return { 
            success: true, 
            cost: cost, 
            new_balance: this.user.balanceG,
            discount_applied: cost < baseAmount
        };
    }

    async recharge(amountU) {
        amountU = Math.floor(amountU); // Force Integer
        if (amountU <= 0) return { success: false, error: "Invalid Amount" };
        const totalG = calculateBonusGCoins(amountU);
        if (totalG <= 0) return { success: false, error: "Invalid Amount" };

        // Update VIP by USDT amount (阈值与倍率区间保持一致)
        this.user.totalRechargedU += amountU;
        if (this.user.totalRechargedU >= 5000) this.user.vipTier = 3;
        else if (this.user.totalRechargedU >= 2000) this.user.vipTier = 2;
        else if (this.user.totalRechargedU >= 200) this.user.vipTier = 1;

        // Add Funds: 全部视为可用 G-Gas
        this.user.principalG += totalG;
        this.user.balanceG = Math.floor(this.user.principalG + (this.user.bonusG || 0));

        this.saveUser();
        
        // Sync to TrialManager and mark as Activated (充值即激活)
        if (window.TrialManager) {
            if (!window.TrialManager.state) {
                window.TrialManager.loadState && window.TrialManager.loadState();
            }
            if (window.TrialManager.state) {
                window.TrialManager.state.isActivated = true;
                window.TrialManager.state.activatedTier = this.user.vipTier > 0 ? this.user.vipTier : 1;
                window.TrialManager.state.balance = this.user.balanceG;
                if (typeof window.TrialManager.saveState === 'function') {
                    window.TrialManager.saveState();
                }
            }
        }

        return { success: true, added: totalG, new_balance: this.user.balanceG };
    }

    async withdraw(amountG) {
        if (this.user.vipTier < 2) return { success: false, error: "VIP Core+ Required" };
        if (amountG < 6000) return { success: false, error: "Minimum 6000 G" };
        if (this.user.balanceG < amountG) return { success: false, error: "Insufficient Balance" };

        const isEarlyPhase = (Date.now() - this.user.createdAt) < (this.LAUNCH_PHASE_DAYS * 86400000);

        if (isEarlyPhase) {
            // Can burn bonus
            const fromBonus = Math.min(this.user.bonusG, amountG);
            const fromPrincipal = amountG - fromBonus;
            this.user.bonusG -= fromBonus;
            this.user.principalG -= fromPrincipal;
        } else {
            // Principal Only
            if (amountG > this.user.principalG) {
                return { success: false, error: "Only Principal withdrawable after 30 days" };
            }
            this.user.principalG -= amountG;
        }

        this.user.balanceG = this.user.bonusG + this.user.principalG;
        this.saveUser();
        return { success: true, new_balance: this.user.balanceG };
    }

    // --- Legacy / Deprecated Support ---
    verifyLicense(key) { return Promise.resolve({ success: true }); }
}
