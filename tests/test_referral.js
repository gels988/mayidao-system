const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Config
const BASE_URL = 'http://localhost:8080';
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

// Init Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testReferralFlow() {
    console.log("🚀 Starting Phase 1 Referral Test (Advanced Mode)...");
    
    // Test Credentials
    // You can set these in .env to skip creation
    const SENDER_EMAIL = process.env.TEST_EMAIL || `tester_${Date.now()}@gmail.com`;
    const SENDER_PASSWORD = process.env.TEST_PASSWORD || 'Mayiju@2026';
    const NEW_USER_PHONE = `139${Date.now().toString().slice(-8)}`;
    const TRANSFER_AMOUNT = 200;

    try {
        // --- Step 0: Connectivity Check ---
        console.log(`\n[Step 0] Checking Supabase Connectivity...`);
        const { error: pingError } = await supabase.from('app_users').select('count', { count: 'exact', head: true });
        if (pingError) {
            console.error("❌ Connectivity Check Failed:", pingError.message);
            console.log("💡 Hint: Check your internet connection or Supabase project status.");
            return; // Stop here
        }
        console.log("✅ Connectivity OK.");

        // --- Step 1: Authentication ---
        console.log(`\n[Step 1] Authenticating Sender (${SENDER_EMAIL})...`);
        let session = null;
        let senderId = null;

        // Try Login First
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: SENDER_EMAIL,
            password: SENDER_PASSWORD
        });

        if (loginData.session) {
            console.log("✅ Logged in existing user.");
            session = loginData.session;
            senderId = loginData.user.id;
        } else {
            // Try SignUp
            console.log("ℹ️  User not found, attempting sign up...");
            const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                email: SENDER_EMAIL,
                password: SENDER_PASSWORD
            });

            if (signUpError) {
                console.error("❌ SignUp Failed:", signUpError.message);
                throw new Error("Authentication failed. Please provide valid credentials in .env");
            }

            if (!signUpData.session) {
                console.warn("⚠️  SignUp successful but NO SESSION returned.");
                console.warn("🛑 ACTION REQUIRED: Please confirm the email sent to " + SENDER_EMAIL);
                console.warn("   After confirmation, re-run this test.");
                return;
            }

            console.log("✅ SignUp successful.");
            session = signUpData.session;
            senderId = signUpData.user.id;
        }

        // --- Step 2: Seed Balance ---
        console.log(`\n[Step 2] Seeding Sender Balance (1000 G)...`);
        // Note: RLS might block this. We assume 'app_users' allows self-update or we are admin.
        // If this fails, we hope the user already has balance.
        
        // Check existence
        const { data: userRows } = await supabase.from('app_users').select('id, balance_g').eq('id', senderId);
        
        if (!userRows || userRows.length === 0) {
            // Insert
            const { error: insertErr } = await supabase.from('app_users').insert({
                id: senderId,
                phone: `S_${Date.now()}`,
                balance_g: 1000
            });
            if (insertErr) console.warn("⚠️  Insert app_user warning:", insertErr.message);
            else console.log("✅ User inserted into app_users.");
        } else {
            // Update
            const { error: updateErr } = await supabase.from('app_users')
                .update({ balance_g: 1000 })
                .eq('id', senderId);
            if (updateErr) console.warn("⚠️  Update balance warning:", updateErr.message);
            else console.log("✅ Balance updated.");
        }

        // --- Step 3: Call API ---
        console.log(`\n[Step 3] Calling API /api/activate-referral...`);
        console.log(`   Target: ${NEW_USER_PHONE}, Amount: ${TRANSFER_AMOUNT}`);

        const response = await axios.post(`${BASE_URL}/api/activate-referral`, {
            phone: NEW_USER_PHONE,
            amount: TRANSFER_AMOUNT
        }, {
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log("✅ API Response:", response.data);

        if (response.data && response.data.success) {
            console.log("✅ 推荐激活成功");
            
            // --- Step 4: Verification ---
            console.log(`\n[Step 4] Verifying Balances...`);
            const { data: senderFinal } = await supabase.from('app_users').select('balance_g').eq('id', senderId).single();
            const { data: receiverFinal } = await supabase.from('app_users').select('balance_g').eq('phone', NEW_USER_PHONE).single();
            
            console.log(`   Sender:   ${senderFinal?.balance_g} (Expected ~800)`);
            console.log(`   Receiver: ${receiverFinal?.balance_g} (Expected 500)`);

            if (receiverFinal?.balance_g === 500) {
                console.log("🎉 FULL SYSTEM TEST PASSED");
            }
        } else {
            console.error("❌ API returned failure:", response.data);
        }

    } catch (err) {
        if (err.response) {
            console.error("❌ API Request Failed:", err.response.status, err.response.data);
        } else {
            console.error("❌ Test Error:", err.message);
        }
    }
}

testReferralFlow();
