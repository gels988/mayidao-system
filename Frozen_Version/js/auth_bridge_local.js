
class AuthBridge {
    constructor() {
        this.STORAGE_KEY = 'mayiju_user_phone_local';
        this.user = {
            id: 'local_user',
            phone: 'LocalGuest',
            balanceG: 1000, // Default local balance
            vipTier: 0
        };
        console.log("AuthBridge Initialized (Local Mode)");
        window.Economy = this;
        this.init();
    }

    init() {
        // Load local balance if exists
        const savedBalance = localStorage.getItem('local_balance_g');
        if (savedBalance) {
            this.user.balanceG = parseInt(savedBalance, 10);
        }
        
        // Simulate login success immediately
        if (window.ui && window.ui.refreshAccountInfo) {
            window.ui.refreshAccountInfo();
        }
    }

    // Mock methods that might be called
    async loginWithPhone(phone) {
        console.log("Local login (mock):", phone);
        return true;
    }
    
    showLoginModal() {
        console.log("Local mode: Login modal suppressed.");
    }

    async getAccountStatus() {
        return {
            balance: this.user.balanceG,
            user_id: this.user.phone,
            vip_level: this.user.vipTier,
            vip_name: "LOCAL_USER",
            vip_discount: 1.0
        };
    }

    async deductGCoins(amount = 1) {
        if (this.user.balanceG < amount) {
            return { success: false, error: "Insufficient balance" };
        }
        this.user.balanceG -= amount;
        this.updateBalance(this.user.balanceG);
        return { success: true, new_balance: this.user.balanceG };
    }

    async deductCost(amount) {
        if (this.user.balanceG >= amount) {
            this.user.balanceG -= amount;
            this.updateBalance(this.user.balanceG);
            return true;
        }
        return false;
    }

    async recharge(amount) {
        // Mock donation: 1 USDT = 10 Fuel Points
        const added = amount * 10;
        this.user.balanceG += added;
        this.updateBalance(this.user.balanceG);
        return { success: true, added: added };
    }

    // Add methods if UI calls them to update balance
    updateBalance(amount) {
        this.user.balanceG = amount;
        localStorage.setItem('local_balance_g', amount);
        if (window.ui) window.ui.updateBalance(amount);
    }
}

window.AuthBridge = AuthBridge;
