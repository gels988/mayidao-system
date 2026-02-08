# ==================== 部署脚本 (PowerShell) ====================

Write-Host "🚀 蚂蚁岛系统部署脚本" -ForegroundColor Cyan
Write-Host "==================================="
Write-Host "Vercel: mayidao-gels988.vercel.app"
Write-Host "Supabase: gels988's Org"
Write-Host "==================================="

# 1. 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Yellow
npm install

# 2. Git操作
Write-Host "💾 Git版本控制..." -ForegroundColor Yellow

# 检查是否已初始化
if (-not (Test-Path ".git")) {
    Write-Host "初始化Git仓库..."
    git init
    git remote add origin https://github.com/YOUR_USERNAME/mayidao-system.git
}

# 添加文件
git add .
git status

# 提交
git commit -m "🚀 部署v2.0.0 - 完整预测系统上线
- 自学模块：22矩阵四数基因预测
- 数据库可视化：实时监控全球用户数据  
- Supabase数据库连接
- 多模型投票预测机制
- 自动学习与优化"

# 推送
# 注意：如果 origin 配置不正确或需要认证，这一步可能会失败
# git push -u origin main

# 3. Vercel部署
Write-Host "☁️  部署到Vercel..." -ForegroundColor Yellow

# 检查登录状态
try {
    vercel whoami > $null 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "Not logged in"
    }
} catch {
    Write-Host "⚠️  请先登录Vercel" -ForegroundColor Red
    Write-Host "运行: vercel login"
    exit 1
}

# 部署到生产环境
vercel --prod --name mayidao-gels988 --yes

Write-Host "✅ 部署完成！" -ForegroundColor Green
Write-Host "==================================="
Write-Host "🌐 访问地址: https://mayidao-gels988.vercel.app"
Write-Host "🔧 API端点: https://mayidao-gels988.vercel.app/api"
Write-Host "==================================="
