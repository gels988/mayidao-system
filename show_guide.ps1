# 显示系统使用指南
$ErrorActionPreference = "Stop"

# 颜色函数
function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

if (Test-Path "SYSTEM_GUIDE.md") {
    $content = Get-Content "SYSTEM_GUIDE.md" -Raw -Encoding UTF8
    Write-Host $content
} else {
    Write-Color "⚠️ 未找到 SYSTEM_GUIDE.md 文件" "Yellow"
}
