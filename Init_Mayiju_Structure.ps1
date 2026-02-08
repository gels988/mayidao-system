# Init_Mayiju_Structure.ps1
# 蚂蚁居产品综合方面军初始化脚本
# MAYIJU ProductSynth Initialization Script

$OutputInfo = "D:\MAYIJU\output"
$ProductSynth = "D:\MAYIJU\ProductSynth"

# Ensure directories exist (PowerShell way, just in case)
New-Item -ItemType Directory -Force -Path $OutputInfo | Out-Null
New-Item -ItemType Directory -Force -Path $ProductSynth | Out-Null

# Move Architecture Docs
Move-Item -Path ".\系统架构设计.md" -Destination $OutputInfo -Force
Move-Item -Path ".\依赖图.dot" -Destination $OutputInfo -Force

Write-Host "Architecture docs moved to $OutputInfo"

# Create Agent Scripts
$agents = @(
    "ArchitectAgent.ps1",
    "UI_Builder.ps1",
    "Workflow_Automator.ps1",
    "Security_Auditor.ps1",
    "Code_Generator.ps1",
    "Debugger.ps1"
)

foreach ($agent in $agents) {
    $content = @"
# $agent
# Part of MAYIJU ProductSynth Division
# Role: $(if ($agent -eq "ArchitectAgent.ps1") { "Sub-Commander / Orchestrator" } 
          elseif ($agent -eq "UI_Builder.ps1") { "UI Construction (HTML/CSS)" }
          elseif ($agent -eq "Workflow_Automator.ps1") { "Process Automation" }
          elseif ($agent -eq "Security_Auditor.ps1") { "Safety & Compliance Check" }
          elseif ($agent -eq "Code_Generator.ps1") { "Bagua Code Generation" }
          elseif ($agent -eq "Debugger.ps1") { "Fault Diagnosis & Repair" }
          else { "Specialist Agent" })

Write-Host "[$agent] Initialized. Ready for orders."
"@
    $path = Join-Path $ProductSynth $agent
    Set-Content -Path $path -Value $content
    Write-Host "Created $path"
}

Write-Host "MAYIJU Structure Initialization Complete."
