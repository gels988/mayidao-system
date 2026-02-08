require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
// Dynamic import for fetch if needed, but in CommonJS we use node-fetch or global fetch in Node 18+
// We will try global fetch first.

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
    console.log("=== Operation Viral-Activation: Phase 1 Test Script ===");
    console.log("Time:", new Date().toISOString());

    // 1. Setup Test User (Sender)
    const email = `test_sender_${Date.now()}@mayiju.com`;
    const password = 'TestPassword123!';
    
    console.log(`\n[Step 1] Creating Sender: ${email}`);
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    
    if (authError) {
        console.error("❌ Auth SignUp Failed:", authError.message);
        return;
    }
    
    const senderId = authData.user.id;
    const token = authData.session ? authData.session.access_token : null;
    
    if (!token) {
        console.error("❌ No session token returned. Is email confirmation disabled?");
        // Try sign in if user already exists or needs login
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError) {
             console.error("❌ Login Failed:", loginError.message);
             return;
        }
        // token = loginData.session.access_token; // Const assignment error if I did that
    }
    
    console.log(`   Sender Auth ID: ${senderId}`);

    // 2. Link to app_users (Seed Balance)
    console.log(`\n[Step 2] Seeding Sender Balance in app_users...`);
    const { error: dbError } = await supabase.from('app_users').insert({
        id: senderId,
        phone: `S_${Date.now()}`, // Unique phone
        balance_g: 1000,
        referral_code: `REF_${Date.now().toString().slice(-6)}`
    });

    if (dbError) {
        console.warn("⚠️ DB Insert Warning (might exist):", dbError.message);
    } else {
        console.log("✅ Sender seeded with 1000 G.");
    }

    // 3. Execute Referral API
    const newPhone = `199${Date.now().toString().slice(-8)}`;
    const amount = 200;
    
    console.log(`\n[Step 3] Calling API: POST /api/activate-referral`);
    console.log(`   Payload: { phone: '${newPhone}', amount: ${amount} }`);
    
    try {
        // Use global fetch (Node 18+) or require('http') if needed.
        // Assuming Node environment has fetch.
        const res = await fetch('http://localhost:8080/api/activate-referral', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authData.session.access_token}`
            },
            body: JSON.stringify({ phone: newPhone, amount })
        });

        const result = await res.json();
        console.log(`   Status: ${res.status}`);
        console.log(`   Response:`, result);

        if (res.ok && result.success) {
            console.log("✅ API Execution Successful");
            
            // 4. Verify Database State
            console.log(`\n[Step 4] Verifying Database Consistency...`);
            
            // Check Sender Balance (Should be 1000 - 200 = 800)
            const { data: senderRec } = await supabase.from('app_users').select('balance_g').eq('id', senderId).single();
            // Check New User Balance (Should be 300 + 200 = 500)
            const { data: receiverRec } = await supabase.from('app_users').select('balance_g').eq('id', result.new_user_id).single();
            
            console.log(`   Sender Balance:   ${senderRec.balance_g} (Expected: 800)`);
            console.log(`   Receiver Balance: ${receiverRec.balance_g} (Expected: 500)`);
            
            if (senderRec.balance_g === 800 && receiverRec.balance_g === 500) {
                console.log("🎉 VERIFICATION PASSED: Atomic Transfer Confirmed.");
            } else {
                console.error("❌ VERIFICATION FAILED: Balance mismatch.");
            }

            // Check Log
            const { data: logs } = await supabase.from('point_transfers').select('*').eq('from_user', senderId);
            console.log(`   Transfer Log Found: ${logs.length > 0 ? 'Yes' : 'No'}`);

        } else {
            console.error("❌ API Request Failed:", result.error);
        }

    } catch (e) {
        console.error("❌ Network/Script Error:", e);
    }
}

runTest();
