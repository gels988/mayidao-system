
const FILE_HASHES = {
  "js/encrypted_logic.min.js": "ab538b603913b807b3a193f198d688c98b2ae37e04b4e6bc9a4682099dcd45cd",
  "js/high_multiple_predictor.min.js": "884f11f48226778cfe3685769d3843a4db85442cc45536b2fce071d771bcd7cf",
  "js/high-odds-base.min.js": "5320b72b066d89eb5e54f77e1685e91d26b975fb8773a372188a30498316cd58",
  "js/predict-banker6.min.js": "fef574c00bcd6580f4ba5411e2c366cb7ab9f151847c28fe624133bb021aace9",
  "js/predict-tie.min.js": "b93abdf8cfadc98a2295532e171becf4d0ef36f12aa49dd671fd45a767669f68",
  "js/predict-pair.min.js": "aa07503c58d48e1f06370a97c9ec43bd8c63510a61cab600647795e27b39c4d5",
  "js/predict-player.min.js": "041d671e18aaa5b5f4cb2319cf31ed48d7a72203e81c2b38371a31be54817c17",
  "js/predict-special.min.js": "c265bdf6c4ec2a52aac34ae675caf38a14d3c6363973a0e7991c7e6eb4ba1584",
  "index.html": "d301628f5b7377b06330eb5e9ad6299837031d19e1a2e14c9c8b164b2906d77c",
  "js/ui_controller.js": "fb626092c6bcdf3242c6f7cfd815f357de5e006a677103827588cdbbac2204d3",
  "js/decrypt_loader.js": "b6148ef531cd4eebd44365640a0242d77f761d9124029b79287101e7ec46ebd4",
  "js/decrypt_key.js": "8ebcdacb290bb218d0ec3edbfd42572a8364a09ca1c2a0be99fdd08d155ac066"
};

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
            console.warn(`Integrity mismatch for ${url}`);
            return false;
        }
        return true;
    } catch (e) {
        console.error(`Failed to verify ${url}`, e);
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
