# MAYIJU System - Automated Test Runner
# ---------------------------------------
# Validates environment and launches the Test Suite in the default browser.

$TestPath = "$PSScriptRoot\tests\test.html"
$BrowserCmd = "start"

Write-Host "🛡️ MAYIJU System Self-Check Initiated..." -ForegroundColor Cyan

# 1. Check File Integrity
$RequiredFiles = @(
    "js\bagua_auditor.js",
    "js\ui_controller.js",
    "js\encrypted_logic.js",
    "tests\test.html",
    "tests\test_runner.js"
)

$Missing = 0
foreach ($file in $RequiredFiles) {
    if (-not (Test-Path "$PSScriptRoot\$file")) {
        Write-Host "❌ Missing Critical File: $file" -ForegroundColor Red
        $Missing++
    } else {
        Write-Host "✅ Verified: $file" -ForegroundColor Green
    }
}

if ($Missing -gt 0) {
    Write-Host "⛔ Aborting: System Integrity Compromised." -ForegroundColor Red
    exit 1
}

# 2. Launch Test Suite
Write-Host "🚀 Launching Automated Test Suite in Browser..." -ForegroundColor Yellow
Start-Process $TestPath

Write-Host "ℹ️  Please check the browser window for test results." -ForegroundColor Gray
Write-Host "Done."
