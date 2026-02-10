# ==================== 完整移动设备修复脚本 ==================== 
Write-Host "Mobile Device Compatibility Fix - Mayidao System" -ForegroundColor Cyan 
Write-Host "========================================" -ForegroundColor Cyan 
Write-Host "" 
  
# 定义目标文件列表
$files = @("index.html", "数据库资料.html", "self_learn.html", "self_learn.src.html", "debug.html")

# ---------------------------------------------------------
# 🔧 步骤1: 修复viewport设置
# ---------------------------------------------------------
Write-Host "Step 1: Fixing viewport settings..." -ForegroundColor Yellow 

foreach ($file in $files) { 
    if (Test-Path $file) { 
        $content = Get-Content $file -Raw -Encoding utf8 
        
        # 检查是否包含viewport meta标签 
        if ($content -notmatch '<meta name="viewport"') { 
            Write-Host "Warning: $file missing viewport meta tag" -ForegroundColor Yellow 
            
            # 添加viewport meta标签 
            $content = $content -replace '<head>', '<head>`r`n    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">' 
            
            Set-Content -Path $file -Value $content -Encoding utf8 
            Write-Host "  Success: Added viewport meta tag" -ForegroundColor Green 
        } elseif ($content -notmatch 'user-scalable=no') {
            # 如果有viewport但没有user-scalable=no，尝试替换
             Write-Host "Warning: $file Viewport tag needs update" -ForegroundColor Yellow
             $content = $content -replace '<meta name="viewport".*?>', '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">'
             Set-Content -Path $file -Value $content -Encoding utf8 
             Write-Host "  Success: Updated viewport meta tag" -ForegroundColor Green 
        } else { 
            Write-Host "  Success: $file already has correct viewport tag" -ForegroundColor Green 
        } 
    } 
}
Write-Host "Step 1 Completed" -ForegroundColor Green 
  
# ---------------------------------------------------------
# 🔧 步骤2: 添加移动设备CSS
# ---------------------------------------------------------
Write-Host "Step 2: Adding Mobile CSS..." -ForegroundColor Yellow 

$mobileCSS = @" 
<style> 
/* Mobile Responsive Styles */ 
@media only screen and (max-width: 768px) { 
    /* Global Settings */ 
    body { 
        font-size: 14px; 
        padding: 0 !important; 
        overflow-x: hidden; 
        background: #1a1a1a;
    } 
    
    /* Container Adaptation */ 
    .container, .dashboard, .card, .stats-overview { 
        width: 100% !important; 
        max-width: 100% !important; 
        padding: 10px !important; 
        margin: 5px auto !important; 
    } 
    
    /* Grid Layout Adjustment */ 
    .stats-overview, .dashboard-grid, .learning-modes { 
        grid-template-columns: 1fr !important; 
        gap: 15px !important; 
    } 
    
    /* Card Adjustment */ 
    .stat-card, .chart-card, .map-container, .real-time-panel { 
        padding: 15px !important; 
    } 
    
    /* Text Size Adjustment */ 
    h1 { font-size: 1.5rem !important; } 
    h2 { font-size: 1.3rem !important; } 
    h3 { font-size: 1.1rem !important; } 
    
    /* Button Adjustment */ 
    .btn, button, .link-btn { 
        width: 100% !important; 
        padding: 12px !important; 
        font-size: 1rem !important; 
        margin: 8px 0 !important; 
    } 
    
    /* Table Adjustment */ 
    table { 
        font-size: 12px !important; 
        display: block !important; 
        overflow-x: auto !important; 
    } 
    
    /* Chart Container Adjustment */ 
    .chart-container { 
        height: 250px !important; 
        width: 100% !important; 
    } 
    
    /* Input Field Adjustment */ 
    input, select, textarea { 
        width: 100% !important; 
        padding: 10px !important; 
        font-size: 16px !important; /* Prevent iOS zoom */
        margin: 8px 0 !important; 
    } 
    
    /* Hide Unnecessary Elements */ 
    .subtitle, .footer p, #login-overlay, .modal-overlay { 
        display: none !important;
    } 
    
    /* Scroll Optimization */ 
    ::-webkit-scrollbar { 
        width: 4px !important; 
    }
} 

/* Touch Device Optimization */ 
@media (hover: none) and (pointer: coarse) { 
    /* Increase Touch Targets */ 
    button, .btn, a { 
        min-height: 44px !important; 
        min-width: 44px !important; 
    } 
} 
</style> 
"@ 

foreach ($file in $files) { 
    if (Test-Path $file) { 
        $content = Get-Content $file -Raw -Encoding utf8 
        
        # Check if Mobile CSS already exists (using ASCII match string)
        if ($content -notmatch 'max-width: 768px') { 
            # Add Mobile CSS before </head> tag
            $content = $content -replace '</head>', "$mobileCSS`r`n</head>" 
            
            Set-Content -Path $file -Value $content -Encoding utf8 
            Write-Host "  Success: Added Mobile CSS to $file" -ForegroundColor Green 
        } else { 
            Write-Host "  Success: $file already contains Mobile CSS" -ForegroundColor Green 
        } 
    } 
}
Write-Host "Step 2 Completed" -ForegroundColor Green 
  
# ---------------------------------------------------------
# 🔧 步骤3: 添加触摸事件支持
# ---------------------------------------------------------
Write-Host "Step 3: Adding Touch Event Support..." -ForegroundColor Yellow 

$touchJS = @" 
<script> 
// Mobile Device Touch Support 
document.addEventListener('DOMContentLoaded', function() { 
    // Detect Mobile Device 
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent); 
    
    if (isMobile) { 
        // Add mobile class 
        document.documentElement.classList.add('is-mobile'); 
        
        // Fix iOS Click Delay 
        if ('ontouchstart' in window || navigator.maxTouchPoints) { 
            // Disable Double Tap Zoom 
            let lastTouchEnd = 0; 
            document.addEventListener('touchend', function(event) { 
                const now = Date.now(); 
                if (now - lastTouchEnd <= 300) { 
                    event.preventDefault(); 
                } 
                lastTouchEnd = now; 
            }, false); 
        } 
        
        // Add Touch Feedback 
        const touchElements = document.querySelectorAll('button, .btn, a[href], input[type="button"]'); 
        touchElements.forEach(element => { 
            element.addEventListener('touchstart', function() { 
                this.style.opacity = '0.7'; 
            }, { passive: true }); 
            
            element.addEventListener('touchend', function() { 
                this.style.opacity = '1'; 
            }, { passive: true }); 
        }); 
        
        console.log('Mobile Mode Enabled'); 
    } 
}); 
</script> 
"@ 

foreach ($file in $files) { 
    if (Test-Path $file) { 
        $content = Get-Content $file -Raw -Encoding utf8 
        
        # Add Touch JS before </body> tag
        # Check using ASCII string
        if ($content -notmatch 'const isMobile =') {
             $content = $content -replace '</body>', "$touchJS`r`n</body>" 
             Set-Content -Path $file -Value $content -Encoding utf8 
             Write-Host "  Success: Added Touch Support to $file" -ForegroundColor Green 
        } else {
             Write-Host "  Success: $file already contains Touch Support" -ForegroundColor Green 
        }
    } 
}
Write-Host "Step 3 Completed" -ForegroundColor Green 
  
Write-Host "" 
Write-Host "========================================" -ForegroundColor Cyan 
Write-Host "FIX COMPLETED" -ForegroundColor Green 
Write-Host "========================================" -ForegroundColor Cyan 
Write-Host "" 
Write-Host "NEXT STEPS:" -ForegroundColor Yellow 
Write-Host "" 
Write-Host "1. Commit all changes in GitHub Desktop:" -ForegroundColor Cyan 
Write-Host "   - Select all files" -ForegroundColor Gray 
Write-Host "   - Summary: 'Fix mobile compatibility'" -ForegroundColor Gray 
Write-Host "   - Click 'Commit to main'" -ForegroundColor Gray 
Write-Host "   - Click 'Push origin'" -ForegroundColor Gray 
Write-Host "" 
Write-Host "2. Redeploy in Vercel:" -ForegroundColor Cyan 
Write-Host "   - Visit: https://vercel.com/dashboard " -ForegroundColor Gray 
Write-Host "   - Find project: mayidao-gels988" -ForegroundColor Gray 
Write-Host "   - Click 'Redeploy'" -ForegroundColor Gray 
Write-Host "" 
Write-Host "3. Test on Mobile:" -ForegroundColor Cyan 
Write-Host "   - Visit: https://mayidao-gels988.vercel.app/mobile_test.html " -ForegroundColor Green 
Write-Host "   - Check test results" -ForegroundColor Gray 
Write-Host "   - Check main page and admin system" -ForegroundColor Gray 
Write-Host "" 
Write-Host "========================================" -ForegroundColor Cyan