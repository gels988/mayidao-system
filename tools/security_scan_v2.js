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
    const lines = content.split('\n');
    let findings = [];

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const trimmed = line.trim();
        
        // 1. XSS Check
        if (trimmed.includes('innerHTML') || trimmed.includes('outerHTML')) {
            findings.push(`- **[中危] XSS风险**: 第 ${lineNum} 行使用 innerHTML/outerHTML。请确保未直接插入用户输入。`);
        }

        // 2. Code Injection
        if (trimmed.match(/eval\(/)) findings.push(`- **[高危] 代码注入**: 第 ${lineNum} 行发现 eval()。`);
        if (trimmed.match(/new Function\(/)) findings.push(`- **[高危] 代码注入**: 第 ${lineNum} 行发现 new Function()。`);
        if (trimmed.match(/setTimeout\s*\(\s*['"`]/)) findings.push(`- **[中危] 代码注入**: 第 ${lineNum} 行发现 setTimeout(string)。`);

        // 3. Sensitive Data
        if (trimmed.match(/password|passwd|pwd/i) && !trimmed.includes('********')) {
            findings.push(`- **[需确认] 敏感数据**: 第 ${lineNum} 行包含 'password' 相关字段，请确认未硬编码凭证。`);
        }
        if (trimmed.includes('balance_g')) {
            findings.push(`- **[需确认] 敏感数据**: 第 ${lineNum} 行涉及 'balance_g' (积分)，需确认存储方式。`);
        }

        // 4. Permissions (G-Gas)
        if (trimmed.includes('deductGas') || trimmed.includes('deduct_gas')) {
            findings.push(`- **[关键逻辑] 权限漏洞**: 第 ${lineNum} 行发现扣费逻辑。需确认是否有服务端校验 (RPC)。`);
        }
        
        // 5. Console logs (Low risk)
        if (trimmed.includes('console.log')) {
             // findings.push(`- **[低危] 信息泄露**: 第 ${lineNum} 行发现 console.log。`);
        }
    });

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

1. **XSS**: 替换 \`innerHTML\` 为 \`textContent\` 或使用 DOMPurify。
2. **代码注入**: 移除 \`eval\` 等动态执行代码。
3. **敏感数据**: 避免在前端明文存储密码或关键积分数据。
4. **权限控制**: G-Gas 扣费必须使用 Supabase RPC，严禁纯前端计算。
`;

fs.writeFileSync(reportPath, report);
console.log("Security scan completed. Report generated at " + reportPath);
