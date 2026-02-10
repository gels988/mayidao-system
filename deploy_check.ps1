# ==================== Deployment Check Script ====================
Write-Host "Deployment Check - Learn Module" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Files
Write-Host "Checking files..." -ForegroundColor Yellow

if (Test-Path "learn.html") {
    $size = (Get-Item "learn.html").Length
    Write-Host "  [OK] learn.html exists (Size: $size bytes)" -ForegroundColor Green
} else {
    Write-Host "  [FAIL] learn.html missing" -ForegroundColor Red
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
    Write-Host "  [WARN] mobile_input_test.html still exists (Should be deleted)" -ForegroundColor Yellow
} else {
    Write-Host "  [OK] mobile_input_test.html removed" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Check Completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Commit all changes (learn.html, vercel.json, html files)"
Write-Host "2. Push to GitHub"
Write-Host "3. Redeploy on Vercel"
Write-Host "4. Test on Xiaomi Mi 11 Ultra"
