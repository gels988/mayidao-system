
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = 'https://xhfyfkqfykkbbnlwghem.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZnlma3FmeWtrYmJubHdnaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODA4ODEsImV4cCI6MjA4NDA1Njg4MX0.SVUTAVSWi-skCq3N3KioTetV40IWt0vNkewA0WqEfcg';
const TARGET_PHONE = '18080860669';
const TARGET_BALANCE = 999999;
const TARGET_ROLE = 999;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function grantVip() {
    console.log(`🚀 Starting VIP Grant Process for ${TARGET_PHONE}...`);

    try {
        // 1. Check if user exists
        const { data: users, error: searchError } = await supabase
            .from('app_users')
            .select('*')
            .eq('phone_number', TARGET_PHONE);

        if (searchError) {
            console.error("❌ Error searching user:", searchError.message);
            return;
        }

        let userId;

        if (users && users.length > 0) {
            userId = users[0].id;
            console.log(`✅ User found: ${userId}`);
            
            // 2. Update Balance
            const { error: updateError } = await supabase
                .from('app_users')
                .update({ balance_g: TARGET_BALANCE })
                .eq('id', userId);

            if (updateError) {
                console.error("❌ Error updating balance:", updateError.message);
            } else {
                console.log(`✅ Balance updated to ${TARGET_BALANCE}`);
            }

        } else {
            console.log("⚠️ User not found. Creating new user...");
            
            // 2. Create User
            const { data: newUser, error: createError } = await supabase
                .from('app_users')
                .insert([
                    { phone_number: TARGET_PHONE, balance_g: TARGET_BALANCE }
                ])
                .select();

            if (createError) {
                console.error("❌ Error creating user:", createError.message);
                return;
            }
            
            userId = newUser[0].id;
            console.log(`✅ User created: ${userId} with balance ${TARGET_BALANCE}`);
        }

        // 3. Attempt to Grant "Agent" Role
        // Note: 'role' column might not exist. We try to update it.
        console.log("🔄 Attempting to grant 'agent' role...");
        
        const { error: roleError } = await supabase
            .from('app_users')
            .update({ vip_tier: TARGET_ROLE })
            .eq('id', userId);

        if (roleError) {
            console.warn(`⚠️ Could not set 'vip_tier' to '${TARGET_ROLE}'. Error: ${roleError.message}`);
        } else {
            console.log(`✅ VIP Tier updated to '${TARGET_ROLE}'`);
        }

        console.log("\n🎉 Operation Completed!");

    } catch (e) {
        console.error("❌ Unexpected Error:", e);
    }
}

grantVip();
