
const fs = require('fs');
const http = require('http');

console.log("🔍 Starting 'Input -> Predict -> Result' Loop Verification (Frozen Version)...");

// 1. Verify index.html Content
const html = fs.readFileSync('d:\\WebVersion1\\index.html', 'utf8');

// Check for Frozen UI components
const checks = [
    { name: 'Status Bar', pattern: /id="status-bar"/ },
    { name: 'Input Section', pattern: /id="input-section"/ },
    { name: 'Molecular Input', pattern: /id="molecular"/ },
    { name: 'Entropy Button', pattern: /id="entropy-btn"/ },
    { name: 'Prediction Result', pattern: /id="prediction-result"/ },
    { name: 'Grid Section', pattern: /id="grid-section"/ },
    { name: 'Render Function', pattern: /function renderPrediction\(data\)/ }
];

let uiPass = true;
checks.forEach(check => {
    if (check.pattern.test(html)) {
        console.log(`✅ index.html: ${check.name} found.`);
    } else {
        console.log(`❌ index.html: ${check.name} MISSING!`);
        uiPass = false;
    }
});

if (!uiPass) {
    console.log("❌ UI Structure Mismatch. Aborting.");
    process.exit(1);
}

// 2. Verify API Response
const postData = JSON.stringify({ raw_input: '34/24' });

const req = http.request({
    hostname: 'localhost',
    port: 8080,
    path: '/api/predict-mobile',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
}, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log("\n📡 API Response for '34/24':");
            console.log(JSON.stringify(json, null, 2));

            // Validate fields needed by renderPrediction
            const requiredFields = ['s_value', 'sci_index', 'is_crown', 'is_player_8', 'is_banker_6'];
            const missing = requiredFields.filter(field => json[field] === undefined);

            if (missing.length === 0) {
                console.log("\n✅ API Response: Contains all data required for rendering.");
                console.log(`   - s_value: ${json.s_value}`);
                console.log(`   - sci_index: ${json.sci_index}`);
                console.log(`   - is_crown: ${json.is_crown}`);
            } else {
                console.log(`\n❌ API Response: Missing fields [${missing.join(', ')}]`);
            }
        } catch (e) {
            console.log("❌ API Response: Invalid JSON", e);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ API Request Failed: ${e.message}`);
});

req.write(postData);
req.end();
