// Phase 3 Final Verification: Economic Model & Self-Sustaining Loop
// Usage: node verify_phase3_final.js
// Prerequisite: Execute supabase/private_donation.sql in Supabase SQL Editor first!

const http = require('http');

// CONFIGURATION - EDIT THIS BEFORE RUNNING
const OWNER_EMAIL = "island_owner@example.com"; 
const OWNER_PASSWORD = "password123";           
const API_BASE = "http://localhost:8080";

async function runTest() {
    console.log("🚀 Starting Phase 3 Final Economic Model Test...");

    // 1. Login
    console.log(`\n🔑 Logging in as ${OWNER_EMAIL}...`);
    const session = await login(OWNER_EMAIL, OWNER_PASSWORD);
    if (!session) {
        console.error("❌ Login failed. Please check credentials.");
        return;
    }
    const token = session.access_token;
    console.log("✅ Login successful.");

    // 2. Test Donation 1: 100 U -> 220 GAS
    console.log("\n🧪 Test Case 1: Donate 100 U (Expected: 220 GAS)");
    let initialDashboard = await getDashboard(token);
    let initialBalance = initialDashboard.balance_g;
    
    let res1 = await donatePrivate(token, 100);
    if (res1.success && res1.gas_granted === 220) {
        console.log(`   ✅ Success! Granted: ${res1.gas_granted} GAS`);
    } else {
        console.error(`   ❌ Failed! Expected 220, Got: ${res1.gas_granted || res1.error}`);
    }

    // 3. Test Donation 2: 1000 U -> 2600 GAS (x2.6)
    console.log("\n🧪 Test Case 2: Donate 1000 U (Expected: 2600 GAS)");
    let res2 = await donatePrivate(token, 1000);
    if (res2.success && res2.gas_granted === 2600) {
        console.log(`   ✅ Success! Granted: ${res2.gas_granted} GAS`);
    } else {
        console.error(`   ❌ Failed! Expected 2600, Got: ${res2.gas_granted || res2.error}`);
    }

    // 4. Verify System Capacity Calculation
    console.log("\n🧮 Verifying System Capacity Calculation...");
    let finalDashboard = await getDashboard(token);
    let currentBalance = finalDashboard.balance_g;
    let currentDonated = finalDashboard.donated_count;
    
    // Local calculation check
    let calculatedCapacity = calculatePotentialCitizens(currentBalance, currentDonated);
    console.log(`   Current Balance: ${currentBalance}`);
    console.log(`   Current Donated Count: ${currentDonated}`);
    console.log(`   Calculated Capacity: ${calculatedCapacity} citizens`);
    
    if (calculatedCapacity > 0) {
        console.log("   ✅ Capacity calculation logic is active.");
    } else {
        console.log("   ⚠️ Capacity is 0 (Balance too low or logic error).");
    }

    console.log("\n🎉 Test Complete.");
}

// --- Helpers ---

function calculatePotentialCitizens(balance, currentDonatedCount) {
    let count = 0;
    let tempBalance = balance;
    let tempDonatedCount = currentDonatedCount;
    
    while (true) {
        const nextCost = Math.max(100, 300 - 20 * tempDonatedCount);
        if (tempBalance >= nextCost) {
            tempBalance -= nextCost;
            count++;
            tempDonatedCount++;
        } else {
            break;
        }
        if (count > 10000) break; 
    }
    return count;
}

async function login(email, password) {
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
        return data.user ? data : null; 
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

async function donatePrivate(token, amount) {
    const res = await fetch(`${API_BASE}/api/private-donation`, {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ u_amount: amount })
    });
    return await res.json();
}

// Node < 18 polyfill check
if (!global.fetch) {
    console.log("⚠️ Native fetch not found. This script requires Node.js 18+.");
    process.exit(1);
}

runTest();
