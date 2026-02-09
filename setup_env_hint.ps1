# ==================== Vercel环境变量设置提示 ====================

Write-Host "🔐 配置Vercel环境变量..." -ForegroundColor Cyan
Write-Host "请在Vercel控制台 (Settings -> Environment Variables) 设置以下环境变量："
Write-Host ""

Write-Host "1. SUPABASE_URL" -ForegroundColor Yellow
Write-Host "   值: https://your-project.supabase.co"
Write-Host ""

Write-Host "2. SUPABASE_ANON_KEY" -ForegroundColor Yellow
Write-Host "   值: 你的Supabase匿名密钥"
Write-Host ""

Write-Host "3. SUPABASE_SERVICE_KEY" -ForegroundColor Yellow
Write-Host "   值: 你的Supabase服务端密钥 (用于后台任务，可选)"
Write-Host ""

Write-Host "4. JWT_SECRET" -ForegroundColor Yellow
$randomSecret = [Convert]::ToBase64String((1..32|%{[byte](Get-Random -Max 256)}))
Write-Host "   推荐值: $randomSecret" -ForegroundColor Green
Write-Host "   (已为您生成一个强随机字符串)"
Write-Host ""

Write-Host "5. JWT_EXPIRES_IN" -ForegroundColor Yellow
Write-Host "   值: 24h"
Write-Host ""

Write-Host "6. NODE_ENV" -ForegroundColor Yellow
Write-Host "   值: production"
Write-Host ""

Write-Host "7. ALLOWED_ORIGINS" -ForegroundColor Yellow
Write-Host "   值: https://mayidao-gels988.vercel.app"
Write-Host ""

Write-Host "8. PORT" -ForegroundColor Yellow
Write-Host "   值: 3001"
Write-Host ""

Write-Host "⚠️ 设置完成后，请务必重新部署以应用环境变量：" -ForegroundColor Red
Write-Host "   运行: npx vercel --prod"
Write-Host ""
