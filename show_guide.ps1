# show_guide.ps1 - 打开系统指南
param()

$guidePath = "$PSScriptRoot\SYSTEM_GUIDE.md"
$checklistPath = "$PSScriptRoot\MANUAL_VERIFICATION_CHECKLIST.md"

if (Test-Path $guidePath) {
    Write-Host "正在打开系统使用指南..." -ForegroundColor Green
    Start-Process $guidePath
} else {
    Write-Host "错误: 找不到系统指南文件 ($guidePath)" -ForegroundColor Red
}

if (Test-Path $checklistPath) {
    Write-Host "正在打开手动验证清单..." -ForegroundColor Green
    Start-Process $checklistPath
} else {
    Write-Host "错误: 找不到验证清单文件 ($checklistPath)" -ForegroundColor Red
}

Write-Host "提示: 请阅读指南以了解如何进行本地管理和云端部署操作。" -ForegroundColor Cyan
