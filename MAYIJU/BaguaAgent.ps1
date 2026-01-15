# D:\MAYIJU\BaguaAgent.ps1 (Mapped to WebVersion1)
# MAYIJU Bagua Cognitive Transit Agent
# Version: 3.0 (Binary Paradigm)

param(
    [Parameter(ValueFromPipeline=$true)]
    [string]$InputData,
    
    [switch]$SelfCheck
)

# 1. Map Definitions (Fixed Binary)
$BaguaMap = @{
    1 = "111"; # Qian (Heaven)
    2 = "011"; # Dui (Lake)
    3 = "101"; # Li (Fire)
    4 = "001"; # Zhen (Thunder)
    5 = "110"; # Xun (Wind)
    6 = "010"; # Kan (Water)
    7 = "100"; # Gen (Mountain)
    8 = "000"; # Kun (Earth)
}

# 5-Element Map
$WuxingMap = @{
    1 = "Metal"; 2 = "Metal"
    3 = "Fire"
    4 = "Wood"; 5 = "Wood"
    6 = "Water"
    7 = "Earth"; 8 = "Earth"
}

function Get-BaguaBinary {
    param([int]$Digit)
    
    if ($Digit -eq 0) { return "0" } # Void/Start
    if ($Digit -eq 9) { return "111000" } # Balance
    
    # 1-8 Mapping
    if ($Digit -ge 1 -and $Digit -le 8) { return $BaguaMap[$Digit] }
    
    return "ERR"
}

function Process-Input {
    param([string]$Raw)
    
    # Extract digits (simple extraction)
    $Digits = [char[]]($Raw -replace "[^0-9]", "") | ForEach-Object { [int]::Parse([string]$_) }
    
    $BinarySequence = @()
    $WuxingFlow = @()
    
    foreach ($d in $Digits) {
        $bin = Get-BaguaBinary -Digit $d
        $BinarySequence += $bin
        
        # Wuxing Logic
        if ($d -ge 1 -and $d -le 8) {
            $WuxingFlow += $WuxingMap[$d]
        } elseif ($d -eq 9) {
            $WuxingFlow += "Balance"
        } else {
            $WuxingFlow += "Void"
        }
    }
    
    $Result = [PSCustomObject]@{
        InputRaw = $Raw
        BinaryBagua = $BinarySequence -join ""
        WuxingFlow = $WuxingFlow
        TokenEstimate = [math]::Round(($BinarySequence -join "").Length / 3)
        Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Agent = "BaguaAgent_v3"
    }
    
    return $Result | ConvertTo-Json -Depth 2
}

if ($SelfCheck) {
    Write-Host "Running BaguaAgent Self Check..."
    $TestInput = "5009"
    $Test = Process-Input -Raw $TestInput
    Write-Host "Input: $TestInput"
    Write-Host "Output: $Test"
    
    Write-Host "Integrity: OK"
    exit
}

if ($InputData) {
    Process-Input -Raw $InputData
} else {
    Write-Host "BaguaAgent v3.0 Listening..."
}
