const http = require('http');

// Configuration
const API_HOST = '127.0.0.1';
const API_PORT = 8080;
const TOKEN = 'MAYIJU_TEST_TOKEN_V5'; // Uses the debug bypass in server.js

// Test Cases
const testCases = [
    {
        input: '112/889',
        description: 'Case 1: Dual Pairs (Player 11, Banker 88)',
        checks: (data) => {
            return data.is_player_pair === true && 
                   data.is_banker_pair === true;
        }
    },
    {
        input: '34/24',
        description: 'Case 2: Crown (Player 7, Banker 6)',
        checks: (data) => {
            return data.is_crown === true && 
                   data.mol_sum === 7 && 
                   data.den_sum === 6;
        }
    },
    {
        input: '125/123',
        description: 'Case 3: Player 8 (Three cards)',
        checks: (data) => {
            return data.is_player_8 === true;
        }
    },
    {
        input: '123/123',
        description: 'Case 4: Banker 6',
        checks: (data) => {
            return data.is_banker_6 === true && 
                   data.den_sum === 6;
        }
    }
];

// Helper to make request
function postRequest(path, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: API_HOST,
            port: API_PORT,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${TOKEN}`,
                'x-test-uid': '00000000-0000-0000-0000-000000000000' // Valid UUID for Phase 4 strictness
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });

        req.on('error', (e) => reject(e));
        req.write(JSON.stringify(body));
        req.end();
    });
}

// Run Tests
async function runTests() {
    console.log('🚀 Starting Phase 5.1 Verification...\n');
    let passed = 0;

    for (const test of testCases) {
        console.log(`Testing: ${test.input} (${test.description})`);
        try {
            const res = await postRequest('/api/predict-mobile', { raw_input: test.input });
            
            if (res.status !== 200) {
                console.error(`❌ Failed: HTTP ${res.status}`, res.body);
                continue;
            }

            const data = res.body; // The prediction result
            // The API returns { prediction_id, predicted_color, is_player_pair, ... } 
            // wait, server.js returns:
            /*
            jsonResponse(200, {
                prediction_id: data.id,
                predicted_color: color,
                s_value: sValue,
                is_player_pair, is_banker_pair, is_crown, ...
            });
            */
           
            // Check
            if (test.checks(data)) {
                console.log('✅ Passed');
                console.log(`   Response: Color=${data.predicted_color}, PairP=${data.is_player_pair}, PairB=${data.is_banker_pair}, Crown=${data.is_crown}, P8=${data.is_player_8}, B6=${data.is_banker_6}\n`);
                passed++;
            } else {
                console.error('❌ Assertion Failed');
                console.error('   Received:', JSON.stringify(data, null, 2));
                console.log('\n');
            }

        } catch (e) {
            console.error(`❌ Error: ${e.message}\n`);
        }
    }

    console.log(`Summary: ${passed}/${testCases.length} Passed.`);
    if (passed === testCases.length) {
        console.log('🎉 Phase 5.1 Backend Logic Verified!');
    } else {
        console.log('⚠️ Some tests failed. Check server logs.');
    }
}

runTests();
