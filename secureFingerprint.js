// js/secureFingerprint.js

export function getStrongDeviceFingerprint() {
    // 组合多个不可变或难变参数
    const components = [
        navigator.userAgent,
        screen.width + 'x' + screen.height,
        screen.availWidth + 'x' + screen.availHeight,
        new Date().getTimezoneOffset().toString(),
        navigator.language,
        navigator.hardwareConcurrency || 'unknown',
        getCanvasFingerprint() // Use Canvas Fingerprint instead of random salt
    ];

    const raw = components.join('|');
    // 使用 SHA-256 模拟（实际可用简易哈希替代）
    return simpleHash(raw).substring(0, 32);
}

function getCanvasFingerprint() {
    try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 50;
        
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = "#069";
        ctx.fillText("Mayiju-G2-Key", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("Auth", 4, 17);
        
        return canvas.toDataURL();
    } catch (e) {
        return "canvas-failed";
    }
}

// 简易哈希（非加密级，但足够防小白）
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转为32位整数
    }
    return Math.abs(hash).toString(36);
}
