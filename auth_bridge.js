import { supabase } from './db_client.js';
import { trackEvent } from './tracker.js';

class AuthBridge {
    constructor() {
        this.STORAGE_KEY = 'mayiju_user_phone';
        
        // [FIX] Load cached balance to prevent 0 flash
        let cachedBalance = 0;
        try {
            const saved = localStorage.getItem('cloud_balance');
            if (saved) cachedBalance = parseInt(saved, 10) || 0;
        } catch (e) {}

        this.user = {
            id: null,
            phone: null,
            balanceG: cachedBalance,
            vipTier: 0
        };
        console.log("AuthBridge Initialized (Cloud Mode)");
        window.Economy = this;
        // init is called by constructor, but since it's async, we just kick it off.
        this.init();
    }

    async init() {
        // Check for phone in local storage
        const phone = localStorage.getItem(this.STORAGE_KEY);
        if (phone) {
            await this.loginWithPhone(phone);
        } else {
            this.showLoginModal();
        }
    }

    showLoginModal() {
        const modal = document.getElementById('login-modal');
        if (modal) {
            modal.style.display = 'flex';
            const btn = document.getElementById('btn-login-confirm');
            const input = document.getElementById('login-phone');
            
            if (btn && input) {
                // Remove old listeners to avoid duplicates if called multiple times
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                newBtn.addEventListener('click', async () => {
                    const phone = input.value.trim();
                    if (phone && phone.length >= 11) {
                        newBtn.innerText = "登录中...";
                        newBtn.disabled = true;
                        await this.loginWithPhone(phone);
                        modal.style.display = 'none';
                    } else {
                        alert("请输入有效的手机号");
                    }
                });
            }
        }
    }

    async loginWithPhone(phone) {
        try {
            // 1. Try to get user
            let { data: users, error } = await supabase
                .from('app_users')
                .select('*')
                .eq('phone_number', phone);

            if (error) throw error;

            let userRecord;

            if (users && users.length > 0) {
                userRecord = users[0];
            } else {
                // 2. Register if not exists
                const { data: newUser, error: insertError } = await supabase
                    .from('app_users')
                    .insert([{ phone_number: phone, balance_g: 300 }])
                    .select();
                
                if (insertError) throw insertError;
                userRecord = newUser[0];
            }

            // 3. Update local state
            this.user.id = userRecord.id;
            this.user.phone = userRecord.phone_number;
            this.user.balanceG = userRecord.balance_g;
            
            // Publish state
            if (window.MAYIJU_STATE) {
                window.MAYIJU_STATE.update('balanceG', this.user.balanceG);
            }

            // Save phone locally
            localStorage.setItem(this.STORAGE_KEY, phone);
            
            console.log("Logged in as:", this.user.phone, "Balance:", this.user.balanceG);
            
            // Trigger UI update
            if (window.ui) window.ui.refreshAccountInfo();

        } catch (e) {
            console.error("Login failed:", e);
            alert("登录失败，请检查网络");
            this.showLoginModal();
            const btn = document.getElementById('btn-login-confirm');
            if (btn) {
                btn.innerText = "立即进入";
                btn.disabled = false;
            }
        }
    }

    async getAccountStatus() {
        // Refresh balance from server just in case
        if (this.user.phone) {
            const { data, error } = await supabase
                .from('app_users')
                .select('balance_g')
                .eq('phone_number', this.user.phone)
                .single();
            
            if (data) {
                this.user.balanceG = data.balance_g;
            }
        }

        return {
            user_id: this.user.phone || 'Guest',
            balance: this.user.balanceG,
            vip_level: this.user.vipTier,
            vip_name: this.user.phone ? "Member" : "Guest",
            vip_discount: 1.0
        };
    }

    // TODO: [Tech Debt] Implement local queue retry mechanism for deduction failures
    // Suggested implementation:
    // async deductGCoinsWithRetry(amount, maxRetries = 3) { ... }
    // Store failed deductions in localStorage ('pending_deductions') and retry on next init.
    async deductGCoins(amount = 1) {
        if (!this.user.phone) return { success: false, error: "Not logged in" };
        
        // 🛡️ Defense: Negative Balance Protection
        if (this.user.balanceG < amount) {
            console.warn(`[AuthBridge] Blocked negative deduction. Balance: ${this.user.balanceG}, Amount: ${amount}`);
            return { success: false, error: "Insufficient balance" };
        }

        const newBalance = this.user.balanceG - amount;
        
        // 🛡️ Defense: Double Check
        if (newBalance < 0) {
             return { success: false, error: "Insufficient balance (Logic Error)" };
        }

        // Optimistic update
        this.user.balanceG = newBalance;
        if (window.ui) window.ui.updateBalance(newBalance);

        // Server update
        const { error } = await supabase
            .from('app_users')
            .update({ balance_g: newBalance })
            .eq('phone_number', this.user.phone);

        if (error) {
            console.error("Deduct failed:", error);
            // Rollback? Or just sync next time.
            return { success: false, error: "Transaction failed" };
        }

        // Track Deduction
        trackEvent('gcoin_deducted', { amount: amount, balance_after: newBalance });

        return { success: true, new_balance: newBalance };
    }

    async recharge(amount) {
        if (!this.user.phone) return { success: false, error: "Not logged in" };

        // Ladder Logic: 300U -> 2.6x -> 780 Points
        let rate = 1.0;
        if (amount >= 300) {
            rate = 2.6;
        } else if (amount >= 100) {
            rate = 2.0; // Intermediate tier assumption
        }

        const pointsAdded = Math.floor(amount * rate);
        const newBalance = (this.user.balanceG || 0) + pointsAdded;

        console.log(`[Recharge] Amount: ${amount}U, Rate: ${rate}, Points: ${pointsAdded}`);

        // Optimistic update
        this.user.balanceG = newBalance;
        if (window.ui) window.ui.updateBalance(newBalance);

        // Server update
        const { error } = await supabase
            .from('app_users')
            .update({ balance_g: newBalance })
            .eq('phone_number', this.user.phone);

        if (error) {
            console.error("Recharge failed:", error);
            // Rollback optimistic update
            this.user.balanceG -= pointsAdded;
            if (window.ui) window.ui.updateBalance(this.user.balanceG);
            return { success: false, error: "Transaction failed" };
        }
        
        // Log to 'recharges' table (Best effort)
        try {
             await supabase.from('recharges').insert([{
                user_phone: this.user.phone,
                amount_u: amount,
                points_added: pointsAdded,
                rate: rate,
                created_at: new Date().toISOString()
            }]);
            
            trackEvent('gcoin_recharged', { 
                amount_u: amount, 
                points_granted: pointsAdded, 
                tier: rate 
            });
        } catch (e) {
            console.warn("Logging recharge failed (non-critical):", e);
        }

        return { success: true, added: pointsAdded, new_balance: newBalance };
    }

    // Verification method for the checklist
    async verifyRechargeLogic(amount = 300) {
        console.log(`[Verify] Starting recharge verification for ${amount}U...`);
        
        // 1. Get initial balance from DB
        const { data: initialData } = await supabase
            .from('app_users')
            .select('balance_g')
            .eq('phone_number', this.user.phone)
            .single();
            
        const initialBalance = initialData ? initialData.balance_g : 0;
        console.log(`[Verify] Initial DB Balance: ${initialBalance}`);

        // 2. Perform Recharge
        const result = await this.recharge(amount);
        
        if (!result.success) {
            console.error("[Verify] Recharge failed!");
            return false;
        }

        // 3. Check expected points
        const expectedPoints = Math.floor(amount * (amount >= 300 ? 2.6 : (amount >= 100 ? 2.0 : 1.0)));
        if (result.added !== expectedPoints) {
             console.error(`[Verify] Logic Mismatch! Expected ${expectedPoints}, Got ${result.added}`);
             return false;
        }

        // 4. Get final balance from DB
        const { data: finalData } = await supabase
            .from('app_users')
            .select('balance_g')
            .eq('phone_number', this.user.phone)
            .single();
            
        const finalBalance = finalData ? finalData.balance_g : 0;
        console.log(`[Verify] Final DB Balance: ${finalBalance}`);

        // 5. Verify Consistency
        if (finalBalance === initialBalance + expectedPoints) {
            console.log(`✅ [Verify] Success! DB Consistent. +${expectedPoints} Points.`);
            alert(`验证通过！充值 ${amount}U 增加 ${expectedPoints} 积分。\n数据库写入一致。`);
            return true;
        } else {
             console.error(`❌ [Verify] DB Inconsistent! Diff: ${finalBalance - initialBalance}`);
             alert(`验证失败！数据库差异: ${finalBalance - initialBalance}`);
             return false;
        }
    }
}

// Expose to global scope
window.AuthBridge = AuthBridge;
