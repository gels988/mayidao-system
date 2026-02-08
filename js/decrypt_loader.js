
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
