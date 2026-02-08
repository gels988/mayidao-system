const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const rootDir = path.resolve(__dirname, '..');
const jsDir = path.join(rootDir, 'js');

// 1. Configuration
const filesToEncrypt = [
    'js/encrypted_logic.js',
    'js/high_multiple_predictor.js',
    'js/high-odds-base.js',
    'js/predict-banker6.js',
    'js/predict-tie.js',
    'js/predict-pair.js',
    'js/predict-player.js',
    'js/predict-special.js'
];

const key = crypto.randomBytes(32); // 256 bits
const iv = crypto.randomBytes(12); // 96 bits for GCM

// 2. Helper Functions
function encryptFile(filePath) {
    const fullPath = path.join(rootDir, filePath);
    if (!fs.existsSync(fullPath)) {
        console.warn(`Skipping missing file: ${filePath}`);
        return null;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    
    let encrypted = cipher.update(content, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const tag = cipher.getAuthTag().toString('base64');

    // Combine encrypted data and tag for simple transport
    // We'll append the tag to the end or pass it separately.
    // Let's pass them as a single JSON object encoded in base64 for robustness
    const payload = JSON.stringify({
        data: encrypted,
        tag: tag
    });
    
    return Buffer.from(payload).toString('base64');
}

// 3. Generate Key File
const keyFileContent = `
window.DECRYPT_KEY = new Uint8Array([${new Uint8Array(key).join(',')}]);
window.DECRYPT_IV = new Uint8Array([${new Uint8Array(iv).join(',')}]);
`;
fs.writeFileSync(path.join(jsDir, 'decrypt_key.js'), keyFileContent);
console.log('Generated js/decrypt_key.js');

// 4. Generate Loader File
const loaderFileContent = `
(function() {
    // Queue for executing scripts in order
    const executionQueue = [];
    let isExecuting = false;

    async function processQueue() {
        if (isExecuting || executionQueue.length === 0) return;
        isExecuting = true;
        
        const task = executionQueue.shift();
        try {
            await task();
        } catch (e) {
            console.error("Script execution failed:", e);
        }
        
        isExecuting = false;
        processQueue();
    }

    window.__DECRYPT_MODULE__ = function(payloadBase64) {
        executionQueue.push(async () => {
            if (!window.DECRYPT_KEY || !window.DECRYPT_IV) {
                console.error("[Security] Keys missing");
                return;
            }

            try {
                // Decode Payload
                const payloadStr = atob(payloadBase64);
                const payload = JSON.parse(payloadStr);
                
                // Import Key
                const key = await crypto.subtle.importKey(
                    'raw',
                    window.DECRYPT_KEY,
                    { name: 'AES-GCM' },
                    false,
                    ['decrypt']
                );

                // Prepare Data
                const ciphertext = Uint8Array.from(atob(payload.data), c => c.charCodeAt(0));
                const tag = Uint8Array.from(atob(payload.tag), c => c.charCodeAt(0));
                
                // Combine ciphertext + tag for Web Crypto (it expects them together usually, or tag appended)
                // Node's GCM separates them. Web Crypto expects the tag appended to the ciphertext.
                const encryptedData = new Uint8Array(ciphertext.length + tag.length);
                encryptedData.set(ciphertext);
                encryptedData.set(tag, ciphertext.length);

                // Decrypt
                const decryptedBuffer = await crypto.subtle.decrypt(
                    { name: 'AES-GCM', iv: window.DECRYPT_IV },
                    key,
                    encryptedData
                );

                const decryptedCode = new TextDecoder().decode(decryptedBuffer);

                // Execute
                const blob = new Blob([decryptedCode], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                
                return new Promise((resolve, reject) => {
                    const script = document.createElement('script');
                    script.src = url;
                    script.onload = () => {
                        console.log("[Security] Module loaded");
                        resolve();
                    };
                    script.onerror = reject;
                    document.head.appendChild(script);
                });

            } catch (e) {
                console.error("[Security] Decryption failed:", e);
            }
        });
        
        processQueue();
    };
})();
`;
fs.writeFileSync(path.join(jsDir, 'decrypt_loader.js'), loaderFileContent);
console.log('Generated js/decrypt_loader.js');

// 5. Encrypt Files & Generate Minified Versions
const fileHashes = {};

filesToEncrypt.forEach(file => {
    const encryptedBase64 = encryptFile(file);
    if (encryptedBase64) {
        const minFileName = path.basename(file, '.js') + '.min.js';
        const minFilePath = path.join(jsDir, minFileName);
        
        // Wrapper content
        const fileContent = `window.__DECRYPT_MODULE__("${encryptedBase64}");`;
        fs.writeFileSync(minFilePath, fileContent);
        console.log(`Encrypted ${file} -> js/${minFileName}`);

        // Calculate Hash for Integrity Check
        const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
        fileHashes['js/' + minFileName] = hash;
    }
});

// 6. Add other critical files to Integrity Check
const otherFiles = ['index.html', 'js/ui_controller.js', 'js/decrypt_loader.js', 'js/decrypt_key.js'];
otherFiles.forEach(file => {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const hash = crypto.createHash('sha256').update(content).digest('hex');
        fileHashes[file] = hash;
    }
});

// 7. Generate Integrity Check File
const integrityContent = `
const FILE_HASHES = ${JSON.stringify(fileHashes, null, 2)};

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
            console.warn(\`Integrity mismatch for \${url}\`);
            return false;
        }
        return true;
    } catch (e) {
        console.error(\`Failed to verify \${url}\`, e);
        return false;
    }
}

window.checkIntegrity = async function() {
    if (localStorage.getItem('debug_mode') === 'true') return true;
    
    console.log('[Security] Verifying integrity...');
    let allValid = true;
    for (const [file, hash] of Object.entries(FILE_HASHES)) {
        // Skip index.html check from inside index.html (circular/complex)
        if (file === 'index.html') continue; 
        
        const valid = await verifyFile(file, hash);
        if (!valid) allValid = false;
    }
    
    if (!allValid) {
        console.error('[Security] System files compromised!');
        return false;
    }
    console.log('[Security] Integrity verified.');
    return true;
};
`;
fs.writeFileSync(path.join(jsDir, 'integrity_check.js'), integrityContent);
console.log('Generated js/integrity_check.js');
