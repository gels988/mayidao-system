# ==================== 自动化环境变量设置脚本 ====================

Write-Host "🤖 自动化环境变量设置..." -ForegroundColor Cyan

# 检查是否已登录Vercel
$whoami = npx vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  请先登录Vercel" -ForegroundColor Yellow
    npx vercel login
}

# 生成JWT_SECRET
$JWT_SECRET = [Convert]::ToBase64String((1..32|%{[byte](Get-Random -Max 256)}))
Write-Host "🔐 生成的JWT_SECRET: $JWT_SECRET" -ForegroundColor Green
Write-Host ""

# 提示用户输入 Supabase 信息
$SUPABASE_URL = Read-Host "请输入 SUPABASE_URL"
$SUPABASE_ANON_KEY = Read-Host "请输入 SUPABASE_ANON_KEY"
$SUPABASE_SERVICE_KEY = Read-Host "请输入 SUPABASE_SERVICE_KEY"

if ([string]::IsNullOrWhiteSpace($SUPABASE_URL) -or [string]::IsNullOrWhiteSpace($SUPABASE_ANON_KEY)) {
    Write-Host "❌ 错误: 必须提供 SUPABASE_URL 和 SUPABASE_ANON_KEY" -ForegroundColor Red
    exit 1
}

# 设置环境变量
Write-Host "正在设置环境变量..." -ForegroundColor Yellow

$envVars = @{
    "SUPABASE_URL" = $SUPABASE_URL
    "SUPABASE_ANON_KEY" = $SUPABASE_ANON_KEY
    "SUPABASE_SERVICE_KEY" = $SUPABASE_SERVICE_KEY
    "JWT_SECRET" = $JWT_SECRET
    "JWT_EXPIRES_IN" = "24h"
    "NODE_ENV" = "production"
    "PORT" = "3001"
    "ALLOWED_ORIGINS" = "https://mayidao-gels988.vercel.app"
    "RATE_LIMIT_MAX" = "100"
    "RATE_LIMIT_WINDOW_MS" = "60000"
}

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    if (-not [string]::IsNullOrWhiteSpace($value)) {
        Write-Host "设置 $key ..."
        echo $value | npx vercel env add $key production
    }
}

Write-Host "✅ 环境变量设置完成！" -ForegroundColor Green
Write-Host ""
Write-Host "系统将自动重新部署..."
npx vercel --prod --name mayidao-gels988 --yes
