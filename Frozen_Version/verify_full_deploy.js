// Operation Self-Sustaining Island v5.0 - Full Chain Verification
// Uses Test Bypass to verify logic without email confirmation hurdles.

const http = require('http');

// CONFIGURATION
const API_BASE = "http://localhost:8080";
const TEST_TOKEN = "MAYIJU_TEST_TOKEN_V5";

async function runFullTest() {
    console.log("🚀 Starting Full Chain Verification (Bypass Mode)...");
    
    // 1. Create User via Auto-Activate (No Auth required)
    const testEmail = `test_user_${Date.now()}@mayiju.com`;
    console.log(`👤 Creating Test User: ${testEmail}`);
    
    const user = await createTestUser(testEmail);
    if (!user || !user.id) {
        console.error("❌ Failed to create test user via auto-activate.");
        return;
    }
    const userId = user.id;
    console.log(`   ✅ User Created. ID: ${userId}`);
    console.log(`   Initial Balance: ${user.balance_g} GAS (Visitor Bonus)`);

    // 2. Test Private Donation (Economic Model)
    // Target: 1000 U -> 2600 GAS
    console.log("\n💎 Step 1: Testing Private Donation Model (1000 U)");
    const donationRes = await donatePrivate(userId, 1000);
    
    if (donationRes.success && donationRes.gas_granted === 2600) {
        console.log(`   ✅ Success! Granted: ${donationRes.gas_granted} GAS`);
        // New Balance should be 300 (Initial) + 2600 = 2900
        console.log(`   New Balance: ${donationRes.new_balance} GAS (Expected ~2900)`);
    } else {
        console.error(`   ❌ Failed. Expected 2600 GAS. Got: ${JSON.stringify(donationRes)}`);
        return;
    }

    // 3. Test High Value Donation (10,000 U -> 3.0x)
    console.log("\n💎 Step 2: Testing High Value Donation (10,000 U)");
    // 10,000 * 3.0 = 30,000 GAS
    const highDonationRes = await donatePrivate(userId, 10000);
    if (highDonationRes.success && highDonationRes.gas_granted === 30000) {
        console.log(`   ✅ Success! Granted: ${highDonationRes.gas_granted} GAS (3.0x Multiplier Verified)`);
    } else {
        console.error(`   ❌ Failed. Expected 30000 GAS. Got: ${JSON.stringify(highDonationRes)}`);
    }

    // 4. Test Dynamic Donation (Viral Growth)
    console.log("\n⛽ Step 3: Testing Dynamic Donation (Viral Activation)");
    
    // Create citizens (we need their emails, but logic creates them on the fly if we use activate-referral)
    // Wait, activate-referral creates the NEW user. We act as the SENDER (island owner).
    
    const citizens = [
        `citizen_${Date.now()}_1@test.com`,
        `citizen_${Date.now()}_2@test.com`,
        `citizen_${Date.now()}_3@test.com`
    ];

    let expectedDonation = 300;

    for (let i = 0; i < citizens.length; i++) {
        console.log(`   🎁 Donating to ${citizens[i]}... (Expected Cost: ${expectedDonation})`);
        const res = await donateReferral(userId, citizens[i]);
        
        if (res.success) {
            if (res.donated_amount === expectedDonation) {
                console.log(`      ✅ Verified: Cost ${res.donated_amount} GAS`);
            } else {
                console.error(`      ⚠️ Mismatch: Cost ${res.donated_amount}, Expected ${expectedDonation}`);
            }
            expectedDonation -= 20; // Decrement for next
        } else {
            console.error(`      ❌ Failed: ${res.error}`);
            break;
        }
        await new Promise(r => setTimeout(r, 200));
    }

    // 5. Final Capacity Check
    console.log("\n🧮 Step 4: Verifying Capacity Calculation");
    const dashboard = await getDashboard(userId);
    console.log(`   Final Balance: ${dashboard.balance_g}`);
    console.log(`   Donated Count: ${dashboard.donated_count}`);
    
    // We donated 3. Next cost should be 240.
    const nextCost = Math.max(100, 300 - (20 * dashboard.donated_count));
    console.log(`   Next Donation Cost: ${nextCost} GAS (Expected: 240)`);
    
    if (nextCost === 240) {
        console.log("   ✅ Dynamic Logic Verified.");
    } else {
        console.error("   ❌ Dynamic Logic Mismatch.");
    }

    console.log("\n🎉 Full Chain Verification Complete.");
}

// --- Helpers ---

async function createTestUser(email) {
    // Use the public auto-activate endpoint to create a user row
    const res = await fetch(`${API_BASE}/api/auto-activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (data.success && data.user) return data.user;
    
    // Log detailed error if available
    if (data.error) {
        console.error("   ⚠️ Server returned error:", data.error);
    }
    return data.user;
}

async function getDashboard(userId) {
    const res = await fetch(`${API_BASE}/api/island-dashboard`, {
        headers: { 
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'x-test-uid': userId
        }
    });
    return await res.json();
}

async function donatePrivate(userId, amount) {
    const res = await fetch(`${API_BASE}/api/private-donation`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'x-test-uid': userId,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ u_amount: amount })
    });
    return await res.json();
}

async function donateReferral(userId, email) {
    const res = await fetch(`${API_BASE}/api/activate-referral`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${TEST_TOKEN}`,
            'x-test-uid': userId,
            'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email })
    });
    return await res.json();
}

if (!global.fetch) {
    console.log("⚠️ Native fetch not found. Use Node 18+");
    process.exit(1);
}

runFullTest();
