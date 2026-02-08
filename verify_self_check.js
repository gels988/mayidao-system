
const http = require('http');
const fs = require('fs');

function checkSystem() {
    return new Promise((resolve) => {
        const req = http.request({
            hostname: 'localhost',
            port: 8080,
            path: '/api/self-check',
            method: 'GET',
            headers: {
                'Authorization': 'Bearer MAYIJU_TEST_TOKEN_V5',
                'x-test-uid': '00000000-0000-0000-0000-000000000000'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    console.log('System Self-Check Response:', JSON.stringify(json, null, 2));
                    resolve(json.status === 'healthy' || json.status === 'degraded');
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
        
        req.end();
    });
}

function checkFrontendFile() {
    console.log("🔍 Checking Frontend UI Components (Phase 5.2 Clean Version)...");
    try {
        const htmlPath = 'd:\\WebVersion1\\index.html';
        const html = fs.readFileSync(htmlPath, 'utf8');
        
        const checks = [
            { id: 'Circle Container', pattern: /id="circle-container"/ },
            { id: 'Phase 5.2 Logic', pattern: /id="phase5-2-logic"/ },
            { id: 'Raw Input (102/303)', pattern: /id="rawInput"/ },
            { id: 'Validation Msg', pattern: /id="validation-msg"/ },
            { id: 'Settings Button', pattern: /class="settings-btn"/ },
            { id: 'Settings Modal', pattern: /id="settings-modal"/ },
            { id: 'History List', pattern: /id="history-list"/ },
            { id: 'Supabase Script (Local)', pattern: /src="js\/supabase.js"/ }
        ];
        
        let allPass = true;
        checks.forEach(check => {
            if (check.pattern.test(html)) {
                console.log(`✅ ${check.id}: Found`);
            } else {
                console.log(`❌ ${check.id}: MISSING`);
                allPass = false;
            }
        });

        // Verify Placeholder
        if (!html.includes('placeholder="102/303"')) {
             console.log('❌ Input Placeholder: Expected "102/303"');
             allPass = false;
        } else {
             console.log('✅ Input Placeholder: Correct');
        }

        return allPass;
    } catch (e) {
        console.log("❌ File Read Error:", e.message);
        return false;
    }
}

async function run() {
    console.log("🚀 Starting Phase 5.2 Verification...");
    
    const fe = checkFrontendFile();
    const be = await checkSystem();
    
    if (fe && be) {
        console.log("\n✅ VERIFICATION SUCCESS: System is ready for Commander.");
    } else {
        console.log("\n❌ VERIFICATION FAILED: Please review errors.");
        process.exit(1);
    }
}

run();
