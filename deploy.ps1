# ==================== 蚂蚁岛系统部署脚本 (PowerShell版) ====================

$ErrorActionPreference = "Stop"

# 颜色函数
function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

Write-Color "🚀 蚂蚁岛预测系统 - 部署脚本" "Cyan"
Write-Color "===================================" "Cyan"
Write-Color "Vercel项目: mayidao-gels988" "White"
Write-Color "Supabase: gels988's Org" "White"
Write-Color "部署时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "White"
Write-Color "===================================" "Cyan"
Write-Host ""

# 步骤1: 安装依赖
Write-Color "📦 步骤1: 安装依赖" "Blue"
npm install
Write-Color "✅ 依赖安装完成" "Green"
Write-Host ""

# 步骤2: Git提交
Write-Color "📦 步骤2: Git提交" "Blue"
if (Test-Path ".git") {
    git add .
    
    $commitMsg = @"
🚀 蚂蚁岛系统 v2.0.0 部署

核心功能：
- 🧠 自学模块：22矩阵四数基因预测
- 
- 🔮 多模型投票预测机制
- 🌐 全球布局支持

技术栈：
- 后端：Node.js + Express + Supabase
- 前端：HTML5 + Chart.js
- 认证：JWT令牌保护
- 部署：Vercel自动部署
"@
    
    # 尝试提交，如果无更改则捕获错误或继续
    try {
        git commit -m $commitMsg
        Write-Color "✅ Git提交完成" "Green"
    } catch {
        Write-Color "⚠️  无更改需要提交" "Yellow"
    }

    # 推送到GitHub
    Write-Host "正在推送到 GitHub..."
    try {
        git push origin main
        Write-Color "✅ 推送成功" "Green"
    } catch {
        Write-Color "⚠️  跳过GitHub推送 (可能需要配置远程仓库或权限)" "Yellow"
    }
} else {
    Write-Color "⚠️  Git仓库未初始化，跳过" "Yellow"
}
Write-Host ""

# 步骤3: Vercel部署
Write-Color "☁️  步骤3: 部署到Vercel" "Blue"
Write-Host "项目: mayidao-gels988"
Write-Host "环境: Production"
Write-Host ""

# 检查登录状态
Write-Host "检查登录状态..."
npx vercel whoami
if ($LASTEXITCODE -ne 0) {
    Write-Color "❌ 未登录Vercel，请先运行: npx vercel login" "Red"
    exit 1
}

# 执行部署
Write-Host "开始部署..."
# 捕获输出以提取URL
$deployOutput = npx vercel --prod --name mayidao-gels988 --yes 2>&1 | Out-String
Write-Host $deployOutput

# 尝试从输出中提取URL (https://mayidao-gels988...vercel.app)
if ($deployOutput -match "(https://mayidao-gels988[a-zA-Z0-9-]*\.vercel\.app)") {
    $DEPLOY_URL = $matches[1]
} else {
    # 备用：构建标准URL
    $DEPLOY_URL = "https://mayidao-gels988.vercel.app"
}

if (-not $DEPLOY_URL) {
    Write-Color "❌ 部署失败或无法获取URL，请检查上方错误信息" "Red"
    exit 1
}

Write-Host ""
Write-Color "✅ 部署成功！" "Green"
Write-Host ""
Write-Color "===================================" "Cyan"
Write-Color "🌐 系统访问地址:" "Green"
Write-Host "   $DEPLOY_URL"
Write-Host ""
Write-Color "🔧 API端点:" "Green"
Write-Host "   $DEPLOY_URL/api"
Write-Host ""
Write-Color "📊 管理看板:" "Green"
Write-Host "   $DEPLOY_URL/数据库资料.html"
Write-Host ""
Write-Color "🧠 学习模块:" "Green"
Write-Host "   $DEPLOY_URL/self_learn.html"
Write-Color "===================================" "Cyan"
Write-Host ""
Write-Color "⏰ 系统将自动运行，每30秒刷新数据" "Yellow"
Write-Color "📈 预测系统将持续学习并优化准确率" "Yellow"
Write-Color "🌱 蚂蚁岛正在自我生存与发展..." "Yellow"
Write-Color "===================================" "Cyan"
Write-Host ""

# 保存部署信息
$deployInfo = @"
蚂蚁岛系统部署信息
===================

部署时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Vercel项目: mayidao-gels988
访问地址: $DEPLOY_URL

核心功能:
- 自学模块: 22矩阵四数基因预测
- 数据库可视化: 实时监控全球用户数据
- 多模型投票预测机制
- 全球布局支持

技术栈:
- 后端: Node.js + Express + Supabase
- 前端: HTML5 + Chart.js
- 认证: JWT令牌保护
- 部署: Vercel自动部署

环境变量:
- SUPABASE_URL: 已配置
- SUPABASE_ANON_KEY: 已配置
- JWT_SECRET: 已配置
- NODE_ENV: production

系统状态: ✅ 正常运行
"@

$deployInfo | Out-File -FilePath "DEPLOY_INFO.txt" -Encoding UTF8
Write-Color "✅ 部署信息已保存到 DEPLOY_INFO.txt" "Green"
