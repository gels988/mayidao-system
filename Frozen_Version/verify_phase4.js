
const { createClient } = require('@supabase/supabase-js');
const http = require('http');

// Configuration
const API_URL = 'http://localhost:8080';
const TEST_TOKEN = 'MAYIJU_TEST_TOKEN_V5';
const TEST_UID = '00000000-0000-0000-0000-000000000000'; // Must be valid UUID for Postgres

// Supabase (for verification)
const supabaseUrl = process.env.SUPABASE_URL || 'https://xhfyfkqfykkbbnlwghem.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoZnlma3FmeWtrYmJubHdnaGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0ODA4ODEsImV4cCI6MjA4NDA1Njg4MX0.SVUTAVSWi-skCq3N3KioTetV40IWt0vNkewA0WqEfcg';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testPhase4() {
    console.log("🚀 Starting Phase 4 Verification: Prediction Logic Coupling...");

    // 1. Predict Next
    console.log("\n1. Testing /api/predict-mobile...");
    const prediction = await callApi('/api/predict-mobile', 'POST', {
        molecule: 3,
        denominator: 8
    });
    
    if (!prediction.success || !prediction.prediction_id) {
        console.error("❌ Prediction Failed:", prediction);
        process.exit(1);
    }
    console.log(`✅ Prediction Received: ID=${prediction.prediction_id}, Color=${prediction.color}, S=${prediction.s_value.toFixed(2)}`);

    // 2. Submit Result (Feedback)
    console.log("\n2. Testing /api/submit-result...");
    const feedback = await callApi('/api/submit-result', 'POST', {
        prediction_id: prediction.prediction_id,
        actual_result: prediction.color // Simulate accurate prediction
    });

    if (!feedback.success) {
        console.error("❌ Feedback Failed:", feedback);
        process.exit(1);
    }
    console.log("✅ Feedback Submitted Successfully");

    // 3. Verify Database
    console.log("\n3. Verifying Database Record...");
    // We need to wait a moment for DB to be consistent? Usually instant.
    const { data: record, error } = await supabase
        .from('predictions')
        .select('*')
        .eq('id', prediction.prediction_id)
        .single();

    if (error || !record) {
        console.error("❌ DB Verification Failed:", error);
        process.exit(1);
    }

    if (record.user_id !== TEST_UID) {
         console.error("❌ User ID Mismatch");
         process.exit(1);
    }
    if (record.actual_result !== prediction.color) {
        console.error("❌ Actual Result Mismatch in DB");
        process.exit(1);
    }
    if (record.client_type !== 'mobile') {
                console.error("❌ Client Type Mismatch in DB: " + record.client_type);
                process.exit(1);
            }
            if (record.molecule !== 3 || record.denominator !== 8) {
                console.error(`❌ Input Data Mismatch in DB: Mol=${record.molecule}, Den=${record.denominator}`);
                process.exit(1);
            }
            console.log("✅ DB Record Verified: " + JSON.stringify(record));

            // 4. Verify Dashboard API
            console.log("\n4. Testing /api/accuracy (Dashboard)...");
            const accuracyData = await callApi('/api/accuracy', 'GET');
            if (!Array.isArray(accuracyData)) {
                console.error("❌ Dashboard API Failed:", accuracyData);
                process.exit(1);
            }
            console.log(`✅ Dashboard Data Received: ${accuracyData.length} zones`);

            console.log("\n🎉 Phase 4 Verification Complete! Backend is ready.");
        }

async function callApi(path, method, body) {
    return new Promise((resolve, reject) => {
        const req = http.request(`${API_URL}${path}`, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TEST_TOKEN}`,
                'X-Test-UID': TEST_UID
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    console.error("Invalid JSON:", data);
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

testPhase4().catch(console.error);
