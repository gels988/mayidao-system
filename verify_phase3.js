// Phase 3 Verification Script: Dynamic Donation
// Usage: node verify_phase3.js
// Prerequisite: Execute supabase/dynamic_donation.sql in Supabase SQL Editor first!

const http = require('http');

// CONFIGURATION - EDIT THIS BEFORE RUNNING
const OWNER_EMAIL = "island_owner@example.com"; // Replace with your Island Owner Email
const OWNER_PASSWORD = "password123";           // Replace with your Island Owner Password
const API_BASE = "http://localhost:8080";

// Test Data
const CITIZEN_EMAILS = [
    `citizen_${Date.now()}_1@test.com`,
    `citizen_${Date.now()}_2@test.com`,
    `citizen_${Date.now()}_3@test.com`
];

async function runTest() {
    console.log("🚀 Starting Phase 3 Dynamic Donation Test...");

    // 1. Login
    console.log(`\n🔑 Logging in as ${OWNER_EMAIL}...`);
    const session = await login(OWNER_EMAIL, OWNER_PASSWORD);
    if (!session) {
        console.error("❌ Login failed. Please check credentials.");
        return;
    }
    const token = session.access_token;
    console.log("✅ Login successful.");

    // 2. Get Initial State
    console.log("\n📊 Fetching Dashboard...");
    let dashboard = await getDashboard(token);
    let initialBalance = dashboard.balance_g;
    let initialCount = dashboard.donated_count;
    console.log(`   Current Balance: ${initialBalance} GAS`);
    console.log(`   Donated Count: ${initialCount}`);
    
    // 3. Perform 3 Donations
    for (let i = 0; i < 3; i++) {
        const citizenEmail = CITIZEN_EMAILS[i];
        const expectedCount = initialCount + i;
        const expectedAmount = Math.max(100, 300 - (20 * expectedCount));
        
        console.log(`\n🎁 Donation #${i+1} to ${citizenEmail}`);
        console.log(`   Expected Cost: ${expectedAmount} GAS`);

        const result = await donate(token, citizenEmail);
        
        if (result.success) {
            console.log(`   ✅ Success! Donated: ${result.donated_amount} GAS`);
            console.log(`   Remaining Balance: ${result.remaining_balance} GAS`);
            
            if (result.donated_amount !== expectedAmount) {
                console.error(`   ⚠️ MISMATCH! Expected ${expectedAmount}, got ${result.donated_amount}`);
            } else {
                console.log(`   ✅ Amount Verified.`);
            }
        } else {
            console.error(`   ❌ Failed: ${result.error}`);
            break;
        }

        // Wait a bit to avoid rate limits
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("\n🎉 Test Complete.");
}

// --- Helpers ---

async function login(email, password) {
    // We can't use Supabase SDK easily here without installing it.
    // So we use the API if we had a login endpoint, but we don't.
    // Wait, we need the JWT to talk to our server.
    // Our server checks `request.headers['authorization']` and calls `supabase.auth.getUser(token)`.
    // So we need a valid Supabase JWT.
    // We can use the Supabase REST API to login.
    
    // Hardcoded Supabase Config from your code
    const SUPABASE_URL = 'https://xhfyfkqfykkbbnlwghem.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZnlma3FmeWtrYmJubHdnaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODA4ODEsImV4cCI6MjA4NDA1Njg4MX0.SVUTAVSWi-skCq3N3KioTetV40IWt0vNkewA0WqEfcg';

    try {
        const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        return data.user ? data : null; // data contains access_token
    } catch (e) {
        console.error("Login Error:", e);
        return null;
    }
}

async function getDashboard(token) {
    const res = await fetch(`${API_BASE}/api/island-dashboard`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    return await res.json();
}

async function donate(token, email) {
    const res = await fetch(`${API_BASE}/api/activate-referral`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    });
    return await res.json();
}

// Node < 18 polyfill for fetch if needed (simple wrapper around http)
// Assuming Node 18+ for this environment. If not, user needs to install node-fetch.
if (!global.fetch) {
    console.log("⚠️ Native fetch not found. This script requires Node.js 18+.");
    process.exit(1);
}

runTest();
