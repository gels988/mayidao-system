﻿# ==================== 系统运行状态验证脚本 (PowerShell版) ====================

$ErrorActionPreference = "Stop"

# 颜色函数
function Write-Color($text, $color) {
    Write-Host $text -ForegroundColor $color
}

function Print-Result($testName, $status) {
    if ($status -eq "PASS") {
        Write-Host "  ✅ $testName" -ForegroundColor Green
        $global:PASSED++
    } elseif ($status -eq "WARN") {
        Write-Host "  ⚠️  $testName" -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ $testName" -ForegroundColor Red
        $global:FAILED++
    }
}

Write-Color "🔍 蚂蚁岛系统 - 运行状态验证" "Cyan"
Write-Color "===================================" "Cyan"
Write-Color "验证时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "White"
Write-Color "===================================" "Cyan"
Write-Host ""

# 系统地址
$BASE_URL = "https://mayidao-gels988.vercel.app"
$API_URL = "$BASE_URL/api"

# 验证结果统计
$global:PASSED = 0
$global:FAILED = 0

# 步骤1: 检查前端页面
Write-Color "1️⃣  检查前端页面可访问性" "Blue"

# 检查主页
Write-Host "   检查主页..."
try {
    $resp = Invoke-WebRequest -Uri "$BASE_URL" -Method Head -UseBasicParsing -ErrorAction SilentlyContinue
    if ($resp.StatusCode -eq 200) { Print-Result "主页可访问" "PASS" } else { Print-Result "主页可访问 ($($resp.StatusCode))" "FAIL" }
} catch { Print-Result "主页可访问" "FAIL" }

# 检查数据库可视化页面 (应为不可访问)
Write-Host "   检查数据库可视化页面 (安全策略验证)..."
try {
    $resp = Invoke-WebRequest -Uri "$BASE_URL/数据库资料.html" -Method Head -UseBasicParsing -ErrorAction SilentlyContinue
    if ($resp.StatusCode -eq 404 -or $resp.StatusCode -eq 403) {
        Print-Result "数据库可视化页面已隐藏 (安全)" "PASS"
    } else {
        Print-Result "数据库可视化页面仍可访问 ($($resp.StatusCode))" "FAIL"
    }
} catch {
    # 捕获 404 错误
    if ($_.Exception.Response.StatusCode -eq 404 -or $_.Exception.Response.StatusCode -eq 403) {
        Print-Result "数据库可视化页面已隐藏 (安全)" "PASS"
    } else {
        Print-Result "数据库可视化页面仍可访问" "FAIL"
    }
}

# 检查自学模块页面 (应为不可访问)
Write-Host "   检查自学模块页面 (安全策略验证)..."
try {
    $resp = Invoke-WebRequest -Uri "$BASE_URL/self_learn.html" -Method Head -UseBasicParsing -ErrorAction SilentlyContinue
    if ($resp.StatusCode -eq 404 -or $resp.StatusCode -eq 403) {
        Print-Result "自学模块页面已隐藏 (安全)" "PASS"
    } else {
        Print-Result "自学模块页面仍可访问 ($($resp.StatusCode))" "FAIL"
    }
} catch {
    # 捕获 404 错误
    if ($_.Exception.Response.StatusCode -eq 404 -or $_.Exception.Response.StatusCode -eq 403) {
        Print-Result "自学模块页面已隐藏 (安全)" "PASS"
    } else {
        Print-Result "自学模块页面仍可访问" "FAIL"
    }
}

Write-Host ""

# 步骤2: 检查API健康状态
Write-Color "2️⃣  检查API健康状态" "Blue"

# 检查健康接口
Write-Host "   检查健康接口..."
try {
    $resp = Invoke-WebRequest -Uri "$API_URL/health" -Method Get -UseBasicParsing -ErrorAction SilentlyContinue
    $json = $resp.Content | ConvertFrom-Json
    if ($json.status -eq "ok") {
        Print-Result "API健康检查通过" "PASS"
        Write-Host "   响应: $($resp.Content)"
    } else {
        Print-Result "API健康检查失败" "FAIL"
    }
} catch { Print-Result "API健康检查失败" "FAIL" }

Write-Host ""

# 步骤3: 检查Supabase连接 (本地测试)
Write-Color "3️⃣  检查Supabase连接" "Blue"

if (Test-Path ".env") {
    Write-Host "   测试Supabase连接..."
    # 使用之前创建的 check_supabase_connection.js
    if (Test-Path "check_supabase_connection.js") {
        node check_supabase_connection.js
        if ($LASTEXITCODE -eq 0) {
            Print-Result "Supabase连接成功" "PASS"
        } else {
            Print-Result "Supabase连接失败" "FAIL"
        }
    } else {
        Write-Host "   ⚠️ 未找到测试脚本 check_supabase_connection.js" -ForegroundColor Yellow
    }
} else {
    Write-Host "   ⚠️ 跳过 (缺少 .env)" -ForegroundColor Yellow
}

Write-Host ""

# 步骤4: 检查Vercel日志
Write-Color "4️⃣  检查Vercel部署日志" "Blue"
try {
    $logs = npx vercel logs --prod mayidao-gels988 --limit 5 2>&1
    if ($LASTEXITCODE -eq 0) {
        Print-Result "Vercel部署日志获取成功" "PASS"
        Write-Host "   最近日志:"
        $logs | Select-Object -Last 5 | ForEach-Object { Write-Host "     $_" }
    } else {
        Write-Host "   ⚠️ 无法获取日志 (请确认已登录)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ 日志检查跳过" -ForegroundColor Yellow
}

Write-Host ""

# 步骤5: 性能测试
Write-Color "5️⃣  性能测试" "Blue"
Write-Host "   测试API响应时间..."
$time = Measure-Command { Invoke-WebRequest -Uri "$API_URL/health" -Method Head -UseBasicParsing -ErrorAction SilentlyContinue }
$ms = $time.TotalMilliseconds
if ($ms -lt 2000) {
    Print-Result "API响应时间正常 ($([math]::Round($ms, 2)) ms)" "PASS"
} else {
    Print-Result "API响应时间较慢 ($([math]::Round($ms, 2)) ms)" "WARN"
}

Write-Host ""

# 显示验证结果
Write-Color "===================================" "Cyan"
Write-Color "📊 验证结果汇总:" "Blue"
Write-Host "  ✅ 通过: $global:PASSED 项" -ForegroundColor Green
if ($global:FAILED -gt 0) {
    Write-Host "  ❌ 失败: $global:FAILED 项" -ForegroundColor Red
}
Write-Color "===================================" "Cyan"

if ($global:FAILED -eq 0) {
    Write-Color "🎉 系统验证通过！所有检查项均正常" "Green"
    Write-Host ""
    Write-Color "===================================" "Cyan"
    Write-Color "🌐 系统已准备就绪" "Green"
    Write-Host "访问地址: $BASE_URL"
    Write-Host "开始使用系统进行预测和监控"
    Write-Color "===================================" "Cyan"
    exit 0
} else {
    Write-Color "⚠️  部分检查项失败，请查看详细信息" "Red"
    exit 1
}
