const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const indexHtmlPath = path.join(rootDir, 'index.html');

const mode = process.argv[2]; // 'dev' or 'prod'

if (!['dev', 'prod'].includes(mode)) {
    console.error("Usage: node tools/switch_mode.js [dev|prod]");
    process.exit(1);
}

let content = fs.readFileSync(indexHtmlPath, 'utf8');

const DEV_BLOCK = `
    <!-- Core Prediction Modules (Dev Mode) -->
    <script src="js/encrypted_logic.js"></script>
    <script src="js/high_multiple_predictor.js"></script>
    <script src="js/predict-banker6.js"></script>
    <script src="js/predict-tie.js"></script>
    <script src="js/predict-pair.js"></script>
    <script src="js/predict-player.js"></script>
    <script src="js/predict-special.js"></script>
    
    <!-- Security Layer (Disabled in Dev) -->
    <!-- <script src="js/decrypt_key.js"></script> -->
    <!-- <script src="js/decrypt_loader.js"></script> -->
    <!-- <script src="js/integrity_check.js"></script> -->
    <!-- <script src="js/anti_debug.js"></script> -->
`;

const PROD_BLOCK = `
    <!-- Security & Encryption Layer -->
    <script src="js/decrypt_key.js"></script>
    <script src="js/decrypt_loader.js"></script>
    <script src="js/integrity_check.js"></script>
    <script src="js/anti_debug.js"></script>

    <!-- Encrypted Modules -->
    <script src="js/encrypted_logic.min.js" defer></script>
    <script src="js/high_multiple_predictor.min.js" defer></script>
    <script src="js/predict-banker6.min.js" defer></script>
    <script src="js/predict-tie.min.js" defer></script>
    <script src="js/predict-pair.min.js" defer></script>
    <script src="js/predict-player.min.js" defer></script>
    <script src="js/predict-special.min.js" defer></script>
`;

// Regex to find the block between markers or identify the current block
// Since we don't have explicit markers in the file, we'll use a heuristic replace
// We look for the "Security & Encryption Layer" comment for Prod, or "Core Prediction Modules" for Dev

if (mode === 'dev') {
    if (content.includes('js/encrypted_logic.min.js')) {
        console.log("Switching to DEV mode...");
        // Replace the PROD block with DEV block
        // We need a robust regex that captures the whole PROD section
        const prodRegex = /<!-- Security & Encryption Layer -->[\s\S]*?<!-- Encrypted Modules -->[\s\S]*?script src="js\/predict-special\.min\.js" defer><\/script>/;
        
        if (prodRegex.test(content)) {
            content = content.replace(prodRegex, DEV_BLOCK.trim());
            // Also need to handle the "Unencrypted Modules" part if needed, but they are separate
            // Remove "Unencrypted Modules" comment if it exists, as it's less relevant in Dev
            content = content.replace('<!-- Unencrypted Modules -->', '<!-- Prediction Logic -->');
            
            // Re-enable high_multiple_predictor if it was commented out
            content = content.replace('<!-- <script src="js/high_multiple_predictor.js"></script> Encrypted above -->', '');
            
            fs.writeFileSync(indexHtmlPath, content);
            console.log("✅ Switched to Development Mode (Source Files Restored, Security Disabled)");
        } else {
            console.error("❌ Could not locate Production Block to replace.");
        }
    } else {
        console.log("⚠️ Already in Dev Mode or unknown state.");
    }
} else {
    // Switch to PROD
    if (content.includes('js/encrypted_logic.js') && !content.includes('js/encrypted_logic.min.js')) {
        console.log("Switching to PROD mode...");
        const devRegex = /<!-- Core Prediction Modules \(Dev Mode\) -->[\s\S]*?<!-- <script src="js\/anti_debug\.js"><\/script> -->/;
        
        // Alternative regex if the user manually modified it or if it's the original state
        // Let's try to find the block of scripts
        const originalBlockRegex = /<script src="js\/encrypted_logic\.js"><\/script>[\s\S]*?<script src="js\/predict-special\.js"><\/script>/;
        
        if (devRegex.test(content)) {
            content = content.replace(devRegex, PROD_BLOCK.trim());
        } else if (originalBlockRegex.test(content)) {
             content = content.replace(originalBlockRegex, PROD_BLOCK.trim());
        } else {
             // Try to find individual lines if block match fails? 
             // Simplest: Find the insertion point
             console.error("❌ Could not locate Dev Block to replace.");
             return;
        }
        
        content = content.replace('<!-- Prediction Logic -->', '<!-- Unencrypted Modules -->');
        // Comment out the raw high_multiple_predictor
        if (!content.includes('Encrypted above')) {
             content = content.replace('<script src="js/high_multiple_predictor.js"></script>', '<!-- <script src="js/high_multiple_predictor.js"></script> Encrypted above -->');
        }

        fs.writeFileSync(indexHtmlPath, content);
        console.log("✅ Switched to Production Mode (Encrypted & Secured)");
    } else {
        console.log("⚠️ Already in Prod Mode or unknown state.");
    }
}
