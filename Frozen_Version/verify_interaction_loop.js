
const fs = require('fs');
const http = require('http');

console.log("🔍 Starting 'Input -> Predict -> Result' Loop Verification...");

// 1. Verify index.html Content (The "Soul" Check)
const html = fs.readFileSync('d:\\WebVersion1\\index.html', 'utf8');
const expectedRenderFn = `function renderPrediction(container, data) {
            container.innerHTML = ''; // 清空`;

if (html.includes(expectedRenderFn)) {
    console.log("✅ index.html: renderPrediction function found exactly as requested.");
} else {
    console.log("❌ index.html: renderPrediction function NOT found or modified!");
    process.exit(1);
}

if (html.includes('btn.onclick = handlePredictionClick')) {
    console.log("✅ index.html: Direct event binding found.");
} else {
    console.log("❌ index.html: Direct event binding missing!");
}

// 2. Verify API Response (The "Data" Check)
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
                console.log(`   - s_value: ${json.s_value} (Determines Color)`);
                console.log(`   - sci_index: ${json.sci_index} (Determines Dashboard)`);
                console.log(`   - is_crown: ${json.is_crown} (Determines Icon)`);
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
