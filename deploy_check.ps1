# ==================== Deployment Check Script ====================
Write-Host "Deployment Check - Self Learn Module" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Files
Write-Host "Checking files..." -ForegroundColor Yellow
if (Test-Path "self_learn.html") {
    $size = (Get-Item "self_learn.html").Length
    Write-Host "  [OK] self_learn.html exists (Size: $size bytes)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] self_learn.html missing" -ForegroundColor Red
}

if (Test-Path "index.html") {
    Write-Host "  [OK] index.html exists" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] index.html missing" -ForegroundColor Red
}

if (Test-Path "vercel.json") {
    Write-Host "  [OK] vercel.json exists" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] vercel.json missing" -ForegroundColor Red
}

if (Test-Path "mobile_input_test.html") {
    Write-Host "  [OK] mobile_input_test.html exists" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] mobile_input_test.html missing" -ForegroundColor Red
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Check Completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Commit all changes (mi11_optimization.css, vercel.json, html files)"
Write-Host "2. Push to GitHub"
Write-Host "3. Redeploy on Vercel"
Write-Host "4. Test on Xiaomi Mi 11 Ultra"
