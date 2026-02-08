const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const jsDir = path.join(rootDir, 'js');

// 1. Generate Key & IV
const key = crypto.randomBytes(32); // 256 bits
const iv = crypto.randomBytes(12); // 96 bits for GCM

// 2. Prepare File Lists (Manual Glob replacement)
const jsFiles = fs.readdirSync(jsDir).filter(f => f.startsWith('predict-') && f.endsWith('.js'));
const filesToEncrypt = [
    'js/encrypted_logic.js',
    'js/high_multiple_predictor.js',
    ...jsFiles.map(f => 'js/' + f)
];

// Helper: Encrypt
function encrypt(text) {
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag().toString('hex');
    return encrypted + tag; // Append tag for verification
}

// Helper: SHA-256 Hash
function getHash(content) {
    return crypto.createHash('sha256').update(content).digest('hex');
}

let integrityMap = {};

// 3. Process Encryption
console.log("Starting encryption...");

filesToEncrypt.forEach(filePath => {
    const fullPath = path.join(rootDir, filePath);
    if (!fs.existsSync(fullPath)) {
        console.warn(`File not found: ${filePath}`);
        return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const encryptedHex = encrypt(content);
    
    const baseName = path.basename(filePath, '.js');
    const minFileName = `${baseName}.min.js`;
    const outputPath = path.join(jsDir, minFileName);

    // Create the loader wrapper
    // We pass the encrypted data to a global handler
    const outputContent = `
(function() {
    if (window.decryptAndLoad) {
        window.decryptAndLoad('${baseName}', '${encryptedHex}');
    } else {
        console.error('Decrypt loader not found for ${baseName}');
    }
})();
`;
    
    fs.writeFileSync(outputPath, outputContent);
    console.log(`Encrypted: ${filePath} -> ${minFileName}`);

    // Add to integrity map
    integrityMap[minFileName] = getHash(outputContent);
});

// 4. Generate decrypt_key.js
const keyHex = key.toString('hex');
const ivHex = iv.toString('hex');

const keyFileContent = `
window.__CYPHER_CONFIG__ = {
    k: "${keyHex}",
    v: "${ivHex}"
};
`;
fs.writeFileSync(path.join(jsDir, 'decrypt_key.js'), keyFileContent);
console.log("Generated: js/decrypt_key.js");

// 5. Generate decrypt_loader.js
const loaderContent = `
(function() {
    console.log("🔒 Initializing Security Layer...");

    async function decrypt(hexData) {
        try {
            const config = window.__CYPHER_CONFIG__;
            if (!config) throw new Error("Missing Key Config");

            const keyData = new Uint8Array(config.k.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            const ivData = new Uint8Array(config.v.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
            
            // Import Key
            const key = await window.crypto.subtle.importKey(
                "raw", 
                keyData, 
                { name: "AES-GCM" }, 
                false, 
                ["decrypt"]
            );

            // Split Tag (last 16 bytes = 32 hex chars)
            const tagHex = hexData.slice(-32);
            const cipherHex = hexData.slice(0, -32);
            
            // Combine for Web Crypto (Cipher + Tag)
            const encryptedBytes = new Uint8Array((cipherHex + tagHex).match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

            // Decrypt
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivData },
                key,
                encryptedBytes
            );

            return new TextDecoder().decode(decryptedBuffer);

        } catch (e) {
            console.error("Decryption Failed:", e);
            return null;
        }
    }

    window.decryptAndLoad = async function(name, data) {
        const code = await decrypt(data);
        if (code) {
            console.log("🔓 Module Loaded:", name);
            // Execute via Blob URL to avoid eval() and appear as separate file in DevTools
            const blob = new Blob([code], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);
            const script = document.createElement('script');
            script.src = url;
            script.dataset.origin = name;
            document.head.appendChild(script);
        } else {
            console.error("❌ Failed to load module:", name);
            alert("Security Error: Module " + name + " load failed.");
        }
    };
})();
`;
fs.writeFileSync(path.join(jsDir, 'decrypt_loader.js'), loaderContent);
console.log("Generated: js/decrypt_loader.js");

// 6. Generate Integrity Check List (Partial)
// We need to add other files to integrity map
const staticFiles = ['js/emergency_fix.js', 'js/ui_controller.js'];
staticFiles.forEach(f => {
    const fullPath = path.join(rootDir, f);
    if (fs.existsSync(fullPath)) {
        integrityMap[path.basename(f)] = getHash(fs.readFileSync(fullPath));
    }
});

// Write integrity_check.js
const integrityContent = `
(function() {
    const HASH_DB = ${JSON.stringify(integrityMap, null, 2)};

    async function calculateHash(content) {
        const msgBuffer = new TextEncoder().encode(content);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function verifyFile(url, expectedHash) {
        try {
            const response = await fetch(url);
            const text = await response.text();
            const hash = await calculateHash(text);
            if (hash !== expectedHash) {
                console.error(\`⚠️ Integrity Mismatch: \${url} (Expected \${expectedHash}, Got \${hash})\`);
                return false;
            }
            console.log(\`✅ Verified: \${url}\`);
            return true;
        } catch (e) {
            console.error(\`Integrity Check Error for \${url}:\`, e);
            return false;
        }
    }

    window.checkIntegrity = async function() {
        console.log("🛡️ Starting Integrity Check...");
        let allValid = true;
        
        // Check registered scripts (in production this should be strictly mapped)
        // For demo, we check the keys in HASH_DB
        for (const [filename, hash] of Object.entries(HASH_DB)) {
            // Assume files are in js/
            const valid = await verifyFile('js/' + filename, hash);
            if (!valid) allValid = false;
        }

        if (!allValid) {
            alert('⚠️ 系统文件被篡改，请重新下载！'); 
            // location.href = 'about:blank'; // Uncomment for strict mode
            return false;
        }
        return true;
    };

    // Auto-run
    window.addEventListener('load', window.checkIntegrity);
})();
`;
fs.writeFileSync(path.join(jsDir, 'integrity_check.js'), integrityContent);
console.log("Generated: js/integrity_check.js");

console.log("Encryption and Integrity Setup Complete.");
