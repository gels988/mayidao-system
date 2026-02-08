
const http = require('http');

function check(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://localhost:${port}`, (res) => {
            console.log(`[Port ${port}] Status Code: ${res.statusCode}`);
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (data.includes('自主健康系统') || data.includes('ahs_v4_2.js')) {
                    console.log(`[Port ${port}] ✅ Content Check Passed (AHS found)`);
                } else {
                    console.log(`[Port ${port}] ⚠️ Content Check Warning: AHS script not explicitly found in first chunk (might be okay if file is large)`);
                }
                resolve(true);
            });
        }).on('error', (err) => {
            console.error(`[Port ${port}] ❌ Connection Error: ${err.message}`);
            resolve(false);
        });
    });
}

(async () => {
    console.log("=== 统帅检测: 服务可用性扫描 ===");
    await check(8080);
    await check(8000);
})();
