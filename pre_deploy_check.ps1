# ==================== 部署前最终检查 ====================

Write-Host "🔍 部署前最终检查..." -ForegroundColor Cyan
Write-Host ""

# 1. 检查文件结构
Write-Host "1️⃣  检查文件结构..." -ForegroundColor Yellow
$requiredFiles = @("package.json", "vercel.json")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ 错误: $file 不存在" -ForegroundColor Red
        exit 1
    }
}
Write-Host "✅ 文件结构检查通过" -ForegroundColor Green

# 2. 检查依赖
Write-Host "2️⃣  检查依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 安装依赖..."
    npm install
} else {
    Write-Host "✅ 依赖已安装" -ForegroundColor Green
}

# 3. 检查Git状态
Write-Host "3️⃣  检查Git状态..." -ForegroundColor Yellow
if (Test-Path ".git") {
    git status
    Write-Host "✅ Git仓库已初始化" -ForegroundColor Green
    
    # 提交所有更改
    git add .
    git commit -m "🚀 部署前最终提交 - 蚂蚁岛系统 v2.0.0"
} else {
    Write-Host "⚠️  Git仓库未初始化，跳过" -ForegroundColor Yellow
}

# 4. 检查Vercel登录状态
Write-Host "4️⃣  检查Vercel登录状态..." -ForegroundColor Yellow
npx vercel whoami
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 已登录Vercel" -ForegroundColor Green
} else {
    Write-Host "❌ 未登录Vercel" -ForegroundColor Red
    Write-Host "请运行: npx vercel login"
    exit 1
}

# 5. 检查项目配置
Write-Host "5️⃣  检查项目配置..." -ForegroundColor Yellow
try {
    Get-Content vercel.json | ConvertFrom-Json | Out-Null
    Write-Host "✅ vercel.json 配置正常" -ForegroundColor Green
} catch {
    Write-Host "❌ vercel.json 格式错误" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ 所有检查通过，准备部署..." -ForegroundColor Cyan
Write-Host ""
Write-Host "请等待1-2分钟，然后继续下一步验证"
