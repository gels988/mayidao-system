
const http = require('http');

function test(name, input) {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api/predict-mobile',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer MAYIJU_TEST_TOKEN_V5',
                'x-test-uid': 'test_user_phase5_2'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log(`\nTesting: ${input} (${name})`);
                    if (json.error) {
                        console.log('❌ Error:', json.error);
                        resolve(false);
                    } else {
                        console.log('✅ Success');
                        console.log(`   Color: ${json.predicted_color}`);
                        console.log(`   S-Value: ${json.s_value.toFixed(2)}`);
                        console.log(`   SCI Index: ${json.sci_index}%`);
                        console.log(`   Votes: A=${json.model_a}, B=${json.model_b}, C=${json.model_c}`);
                        resolve(true);
                    }
                } catch (e) {
                    console.log('❌ Parse Error:', e);
                    resolve(false);
                }
            });
        });
        
        req.on('error', (e) => {
            console.log('❌ Request Error:', e.message);
            resolve(false);
        });
        
        req.write(JSON.stringify({ raw_input: input }));
        req.end();
    });
}

async function run() {
    console.log("🚀 Starting Phase 5.2 Verification (SCI & Halo)...");
    
    // Case 1: High S (Red)
    await test("High S Red", "888/111");
    
    // Case 2: Balanced/Green
    await test("Balanced", "555/555");
    
    // Case 3: High S (Blue)
    await test("High S Blue", "111/888");

    console.log("\n🎉 Phase 5.2 Verification Complete.");
}

run();
