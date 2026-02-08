const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const reportPath = path.join(rootDir, 'security_report.md');

const filesToScan = [
    'index.html',
    'js/ui_controller.js',
    'js/encrypted_logic.js',
    'js/high_multiple_predictor.js',
    'js/db_client.js',
    'js/register_logic.js'
];

let report = `# 全面安全审查报告\n\n**生成时间**: ${new Date().toLocaleString()}\n\n`;

function scanFile(filePath) {
    const fullPath = path.join(rootDir, filePath);
    if (!fs.existsSync(fullPath)) {
        return `### ⚠️ 文件缺失: ${filePath}\n\n`;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    let findings = [];

    // 1. XSS Check
    if (content.includes('innerHTML')) {
        const matches = content.match(/innerHTML\s*=/g);
        findings.push(`- **[中危] innerHTML 使用**: 发现 ${matches ? matches.length : 0} 处。请确保未直接插入用户输入。`);
    }

    // 2. Code Injection
    if (content.match(/eval\(/)) findings.push(`- **[高危] eval() 使用**: 发现 eval() 函数，极易导致代码注入。`);
    if (content.match(/new Function\(/)) findings.push(`- **[高危] new Function() 使用**: 发现动态函数创建。`);
    if (content.match(/setTimeout\s*\(\s*['"`]/)) findings.push(`- **[中危] setTimeout(string)**: 发现字符串形式的 setTimeout，建议使用函数闭包。`);

    // 3. Data Security
    if (content.includes('localStorage')) {
        findings.push(`- **[低危] localStorage 使用**: 检查是否存储敏感数据（如明文密码、密钥）。`);
    }
    if (content.includes('document.cookie')) {
        findings.push(`- **[低危] Cookie 操作**: 检查 HttpOnly 设置。`);
    }

    // 4. Sensitive Keywords
    if (content.match(/password|passwd|pwd/i)) {
        findings.push(`- **[需确认] 敏感关键词**: 发现 'password' 相关字段，请确认未硬编码凭证。`);
    }
    
    // 5. G-Gas Logic
    if (content.includes('deductGas') || content.includes('balance_g')) {
        findings.push(`- **[关键逻辑] G-Gas 扣费**: 发现扣费逻辑。需确认是否仅依赖前端校验（存在绕过风险）。`);
    }

    if (findings.length === 0) {
        return `### ✅ ${filePath}\n- 未发现明显的高危模式。\n\n`;
    } else {
        return `### ⚠️ ${filePath}\n${findings.join('\n')}\n\n`;
    }
}

// Execute Scan
filesToScan.forEach(file => {
    report += scanFile(file);
});

// Summary & Recommendations
report += `## 🛡️ 修复建议

1. **XSS**: 替换 \`innerHTML\` 为 \`textContent\` 或使用 DOMPurify 进行过滤。
2. **代码注入**: 彻底移除 \`eval()\` 和 \`new Function()\`。
3. **数据安全**: 敏感数据（如用户积分、密码哈希）应尽量在服务端处理，前端仅做展示。
4. **权限控制**: G-Gas 扣费必须在服务端（Supabase RPC）进行校验，前端校验仅用于 UI 反馈。
5. **代码保护**: 建议对 \`js/encrypted_logic.js\` 等核心文件进行加密混淆。
`;

fs.writeFileSync(reportPath, report);
console.log("Security scan completed. Report generated at " + reportPath);
