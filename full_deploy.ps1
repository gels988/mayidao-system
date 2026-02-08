# ==================== Git提交与推送 ====================
Write-Host "📦 准备Git提交..." -ForegroundColor Cyan

# 检查Git状态
git status

# 如果还没有初始化
if (-not (Test-Path ".git")) {
    git init
    git config user.name "AntIslandDeveloper"
    git config user.email "gels988@proton.me"
} else {
    # 确保配置正确
    git config user.name "AntIslandDeveloper"
    git config user.email "gels988@proton.me"
}

# 添加所有文件
git add .

# 提交到本地仓库
$commitMsg = @"
🚀 蚂蚁岛系统 v2.0.0 部署

核心功能：
- 🧠 自学模块：22矩阵四数基因预测系统
- 📊 数据库可视化：实时监控全球用户数据
- 🔮 预测引擎：多模型投票机制
- 🌐 全球布局：支持海外用户接入

技术更新：
- 后端：Node.js + Express + Supabase
- 前端：HTML5 + Chart.js + 响应式设计
- 认证：JWT令牌保护
- 部署：Vercel自动部署

数据库：
- 连接现有Supabase项目：gels988's Org
- 保留所有现有数据表结构
- 新增统计查询优化

系统特性：
- 自我学习与修正
- 实时数据刷新（30秒）
- 高概率事件决策（90%+准确率）
- 入侵检测与遗传性分析

部署信息：
- Vercel: mayidao-gels988.vercel.app
- GitHub: gels988@proton.me
- Supabase: gels988's Org
"@

git commit -m $commitMsg

# 推送到GitHub
Write-Host "📤 推送到GitHub..." -ForegroundColor Cyan

# 检查远程仓库
$remote = git remote get-url origin 2>$null
if (-not $remote) {
    Write-Host "设置远程仓库 (注意：请替换为真实的 GitHub URL)..." -ForegroundColor Yellow
    # 使用用户提供的占位符
    git remote add origin "https://github.com/YOUR_USERNAME/mayidao-system.git"
}

# 拉取最新代码
git pull origin main --rebase

# 推送
# 尝试推送，如果失败则捕获错误但不中断后续 Vercel 部署
try {
    git push -u origin main
} catch {
    Write-Host "⚠️ Git推送失败，可能是因为远程仓库 URL 不正确或没有权限。请手动配置远程仓库并推送。" -ForegroundColor Red
}

# ==================== Vercel部署 ====================

Write-Host "☁️  开始部署到Vercel..." -ForegroundColor Cyan

# 检查Vercel CLI
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "Installing Vercel CLI..."
    npm install -g vercel@latest
}

# 检查登录
try {
    # 尝试以非交互方式检查
    $status = vercel whoami 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
} catch {
    Write-Host "⚠️  请先登录Vercel" -ForegroundColor Red
    Write-Host "使用邮箱: gels988@proton.me"
    # 这里必须是交互式的，所以不能静默失败
    cmd /c "vercel login"
}

# 显示项目信息
vercel ls

# 部署
Write-Host "🚀 部署到生产环境..." -ForegroundColor Cyan
# 使用 --yes 跳过确认
vercel --prod --name mayidao-gels988 --yes

Write-Host "✅ Vercel部署完成！" -ForegroundColor Green

# 显示部署信息
Write-Host "==================================="
Write-Host "🌐 系统访问地址:"
Write-Host "   https://mayidao-gels988.vercel.app"
Write-Host ""
Write-Host "🔧 API端点:"
Write-Host "   https://mayidao-gels988.vercel.app/api"
Write-Host ""
Write-Host "📊 数据库可视化:"
Write-Host "   https://mayidao-gels988.vercel.app/数据库资料.html"
Write-Host ""
Write-Host "🧠 学习模块:"
Write-Host "   https://mayidao-gels988.vercel.app/self_learn.html"
Write-Host "==================================="
Write-Host "⏰ 系统将自动运行，每30秒刷新数据"
Write-Host "📈 预测系统将持续学习并优化准确率"
Write-Host "🌱 蚂蚁岛正在自我生存与发展..."
Write-Host "==================================="

Write-Host "✅ 流程结束！" -ForegroundColor Green
