# ==================== 蚂蚁岛系统 - 部署成果检查脚本 ====================

Write-Host "🔍 蚂蚁岛系统部署成果检查" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "检查时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Cyan
Write-Host "系统版本: v2.0.1" -ForegroundColor Cyan
Write-Host "部署地址: https://mayidao-gels988.vercel.app" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""

$global:passed = 0
$global:failed = 0
$global:warnings = 0

function Write-TestResult {
    param($name, $status, $details = "")
    
    if ($status -eq "PASS") {
        Write-Host "  ✅ $name" -ForegroundColor Green
        $global:passed++
    } elseif ($status -eq "FAIL") {
        Write-Host "  ❌ $name" -ForegroundColor Red
        if ($details) { Write-Host "     详情: $details" -ForegroundColor Gray }
        $global:failed++
    } elseif ($status -eq "WARN") {
        Write-Host "  ⚠️  $name" -ForegroundColor Yellow
        if ($details) { Write-Host "     详情: $details" -ForegroundColor Gray }
        $global:warnings++
    } else {
        Write-Host "  ℹ️  $name" -ForegroundColor Gray
    }
}

# ==================== 第一部分：基础连通性检查 ====================
Write-Host "1️⃣  基础连通性检查" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri "https://mayidao-gels988.vercel.app" -TimeoutSec 15 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-TestResult "主页可访问" "PASS"
        if ($response.Headers['Request-Context']) {
            Write-Host "     响应时间: $($response.Headers['Request-Context'])" -ForegroundColor Gray
        }
    } else {
        Write-TestResult "主页可访问" "FAIL" "状态码: $($response.StatusCode)"
    }
} catch {
    Write-TestResult "主页可访问" "FAIL" $_.Exception.Message
}

try {
    $healthResponse = Invoke-RestMethod -Uri "https://mayidao-gels988.vercel.app/api/health" -TimeoutSec 10
    if ($healthResponse.status -eq "ok") {
        Write-TestResult "API健康检查" "PASS"
        Write-Host "     数据库状态: $($healthResponse.database)" -ForegroundColor Gray
        Write-Host "     用户总数: $($healthResponse.users)" -ForegroundColor Gray
        Write-Host "     时间戳: $($healthResponse.timestamp)" -ForegroundColor Gray
    } else {
        Write-TestResult "API健康检查" "FAIL" "状态: $($healthResponse.status)"
    }
} catch {
    Write-TestResult "API健康检查" "FAIL" $_.Exception.Message
}

try {
    $apiRoot = Invoke-RestMethod -Uri "https://mayidao-gels988.vercel.app/api" -TimeoutSec 10
    if ($apiRoot.name -like "*蚂蚁岛*") {
        Write-TestResult "API文档可访问" "PASS"
    } else {
        Write-TestResult "API文档可访问" "WARN" "响应内容不符合预期 (可能是 404 或格式错误)"
    }
} catch {
    Write-TestResult "API文档可访问" "FAIL" $_.Exception.Message
}

# ==================== 第二部分：安全策略检查 ====================
Write-Host ""
Write-Host "2️⃣  安全策略检查" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Gray

try {
    $dashboardResponse = Invoke-WebRequest -Uri "https://mayidao-gels988.vercel.app/数据库资料.html" -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($dashboardResponse.StatusCode -eq 404) {
        Write-TestResult "管理看板已隐藏" "PASS" "返回404，安全策略生效"
    } elseif ($dashboardResponse.StatusCode -eq 200) {
        Write-TestResult "管理看板已隐藏" "FAIL" "页面仍然可访问，存在安全风险"
    } else {
        Write-TestResult "管理看板已隐藏" "WARN" "状态码: $($dashboardResponse.StatusCode)"
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-TestResult "管理看板已隐藏" "PASS" "返回404，安全策略生效"
    } else {
        Write-TestResult "管理看板已隐藏" "WARN" $_.Exception.Message
    }
}

try {
    $learnResponse = Invoke-WebRequest -Uri "https://mayidao-gels988.vercel.app/self_learn.html" -TimeoutSec 10 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($learnResponse.StatusCode -eq 404) {
        Write-TestResult "学习模块已隐藏" "PASS" "返回404，安全策略生效"
    } elseif ($learnResponse.StatusCode -eq 200) {
        Write-TestResult "学习模块已隐藏" "FAIL" "页面仍然可访问，存在安全风险"
    } else {
        Write-TestResult "学习模块已隐藏" "WARN" "状态码: $($learnResponse.StatusCode)"
    }
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
        Write-TestResult "学习模块已隐藏" "PASS" "返回404，安全策略生效"
    } else {
        Write-TestResult "学习模块已隐藏" "WARN" $_.Exception.Message
    }
}

# ==================== 第三部分：API功能检查 ====================
Write-Host ""
Write-Host "3️⃣  API功能检查" -ForegroundColor Yellow
Write-Host "-----------------------------------" -ForegroundColor Gray

try {
    $overview = Invoke-RestMethod -Uri "https://mayidao-gels988.vercel.app/api/stats/overview" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($overview.success -eq $true -and $overview.data) {
        Write-TestResult "统计接口正常" "PASS"
        Write-Host "     总用户数: $($overview.data.totalUsers)" -ForegroundColor Gray
        Write-Host "     捐赠用户: $($overview.data.donateUsers)" -ForegroundColor Gray
        Write-Host "     捐赠总额: ¥$($overview.data.totalDonate)" -ForegroundColor Gray
    } else {
        Write-TestResult "统计接口正常" "FAIL" "响应格式错误"
    }
} catch {
    Write-TestResult "统计接口正常" "FAIL" $_.Exception.Message
}

try {
    $countries = Invoke-RestMethod -Uri "https://mayidao-gels988.vercel.app/api/stats/country-distribution" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($countries.success -eq $true -and $countries.data -and $countries.data.Count -gt 0) {
        Write-TestResult "国家分布接口正常" "PASS"
        Write-Host "     覆盖国家数: $($countries.data.Count)" -ForegroundColor Gray
    } else {
        Write-TestResult "国家分布接口正常" "FAIL" "响应格式错误或数据为空"
    }
} catch {
    Write-TestResult "国家分布接口正常" "FAIL" $_.Exception.Message
}

try {
    $growth = Invoke-RestMethod -Uri "https://mayidao-gels988.vercel.app/api/stats/user-growth?period=today" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($growth.success -eq $true -and $growth.data -and $growth.data.Count -gt 0) {
        Write-TestResult "用户增长接口正常" "PASS"
        $totalToday = ($growth.data | Measure-Object -Property count -Sum).Sum
        Write-Host "     今日新增: $totalToday" -ForegroundColor Gray
    } else {
        Write-TestResult "用户增长接口正常" "FAIL" "响应格式错误或数据为空"
    }
} catch {
    Write-TestResult "用户增长接口正常" "FAIL" $_.Exception.Message
}

Write-Host ""
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "检查结束" -ForegroundColor Cyan
if ($global:failed -eq 0) {
    Write-Host "Passed: $global:passed  Failed: $global:failed  Warnings: $global:warnings" -ForegroundColor Green
} else {
    Write-Host "Passed: $global:passed  Failed: $global:failed  Warnings: $global:warnings" -ForegroundColor Red
}
