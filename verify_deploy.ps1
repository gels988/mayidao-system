# ==================== 部署后验证脚本 ====================

Write-Host "🔍 部署后验证..." -ForegroundColor Cyan

# 1. 检查前端页面
Write-Host "1️⃣  检查前端页面..." -ForegroundColor Yellow
$urls = @(
    "https://mayidao-gels988.vercel.app/",
    "https://mayidao-gels988.vercel.app/数据库资料.html",
    "https://mayidao-gels988.vercel.app/self_learn.html"
)

foreach ($url in $urls) {
    try {
        $response = Invoke-WebRequest -Uri $url -Method Head -ErrorAction Stop
        Write-Host "   ✅ $url - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ $url - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 2. 检查API健康状态
Write-Host "2️⃣  检查API健康状态..." -ForegroundColor Yellow
$healthUrl = "https://mayidao-gels988.vercel.app/health"
try {
    $response = Invoke-WebRequest -Uri $healthUrl -Method Get -ErrorAction Stop
    $content = $response.Content | ConvertFrom-Json
    if ($content.status -eq 'ok') {
        Write-Host "   ✅ API响应正常: $($content.status)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️ API响应异常: $($response.Content)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ API请求失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. 检查Supabase连接 (本地模拟)
Write-Host "3️⃣  检查Supabase连接 (依赖本地 .env 配置)..." -ForegroundColor Yellow
if (Test-Path ".env") {
    try {
        node check_supabase_connection.js
        if ($LASTEXITCODE -eq 0) {
             # node 脚本内部会输出结果
        } else {
             Write-Host "   ❌ Supabase连接检查失败 (Exit Code: $LASTEXITCODE)" -ForegroundColor Red
        }
    } catch {
        Write-Host "   ❌ 执行检查脚本失败: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "   ⚠️ 未找到本地 .env 文件，跳过本地连接测试。" -ForegroundColor Yellow
    Write-Host "   (请确保 Vercel 环境变量已正确配置，API 健康检查将反映云端连接状态)"
}

# 4. 查看Vercel日志
Write-Host "4️⃣  查看Vercel日志 (最近 20 行)..." -ForegroundColor Yellow
try {
    # 使用 npx 避免权限问题
    npx vercel logs --prod mayidao-gels988 --limit 20
} catch {
    Write-Host "   ⚠️ 无法获取日志，请确保已登录 (npx vercel login)" -ForegroundColor Yellow
}

Write-Host "✅ 验证流程结束！" -ForegroundColor Cyan
