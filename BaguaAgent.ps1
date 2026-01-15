<#
.SYNOPSIS
    MAYIJU Bagua Agent - Cognitive Middleware & Binary Logic Translator
    Version: 2.0 (Binary Paradigm)
    
.DESCRIPTION
    Converts natural language or numerical inputs into 3-bit Binary Bagua sequences.
    Implements the "Bagua Mode" vs "Natural Mode" logic.
    Acts as the semantic bridge between LLMs and the MAYIJU OS.

.PARAMETER InputData
    The raw input string or number sequence.
    
.PARAMETER Mode
    Force specific mode: 'Bagua' or 'Natural'. Auto-detect if omitted.

.EXAMPLE
    "Repair network port 5009" | .\BaguaAgent.ps1
    Output: { "BinaryBagua": "110000000111000", "Elements": "Wood-Earth-Earth-Gold", ... }
#>

param(
    [Parameter(ValueFromPipeline=$true, Position=0)]
    [string]$InputData,
    
    [string]$Mode = "Auto"
)

# --- Configuration & Mapping ---

$BaguaMap = @{
    1 = @{ Bin="111"; Element="Gold";  Gua="Qian"; YinYang="Yang"; ID=1 }
    2 = @{ Bin="011"; Element="Gold";  Gua="Dui";  YinYang="Yang"; ID=2 }
    3 = @{ Bin="101"; Element="Fire";  Gua="Li";   YinYang="Yang"; ID=3 }
    4 = @{ Bin="001"; Element="Wood";  Gua="Zhen"; YinYang="Yang"; ID=4 }
    5 = @{ Bin="110"; Element="Wood";  Gua="Xun";  YinYang="Yin";  ID=5 }
    6 = @{ Bin="010"; Element="Water"; Gua="Kan";  YinYang="Yin";  ID=6 }
    7 = @{ Bin="100"; Element="Earth"; Gua="Gen";  YinYang="Yin";  ID=7 }
    8 = @{ Bin="000"; Element="Earth"; Gua="Kun";  YinYang="Yin";  ID=8 }
}

# Special Cases
# 0 -> Void/Start (treated as 000 usually, or ignored in sequence depending on context)
# 9 -> Balance (111000)

function Get-BaguaInfo {
    param([int]$Digit)

    if ($Digit -eq 0) { return $BaguaMap[8] }
    if ($Digit -eq 9) { return $BaguaMap[1] }
    
    if ($BaguaMap.ContainsKey($Digit)) {
        return $BaguaMap[$Digit]
    }
    return @{ Bin="000"; Element="Unknown"; Gua="Unknown"; YinYang="Unknown" }
}

function Analyze-FiveElements {
    param([array]$Elements)
    # Simple interaction logic
    $Flow = @()
    for ($i = 0; $i -lt $Elements.Count - 1; $i++) {
        $Curr = $Elements[$i]
        $Next = $Elements[$i+1]
        
        if ($Curr -eq "Void" -or $Next -eq "Void") { continue }
        if ($Curr -eq "Balance" -or $Next -eq "Balance") { continue }
        
        # Generating (Sheng)
        if (($Curr -eq "Wood" -and $Next -eq "Fire") -or 
            ($Curr -eq "Fire" -and $Next -eq "Earth") -or 
            ($Curr -eq "Earth" -and $Next -eq "Gold") -or 
            ($Curr -eq "Gold" -and $Next -eq "Water") -or 
            ($Curr -eq "Water" -and $Next -eq "Wood")) {
            $Flow += "$Curr generates $Next"
        }
        # Overcoming (Ke)
        elseif (($Curr -eq "Wood" -and $Next -eq "Earth") -or 
                ($Curr -eq "Earth" -and $Next -eq "Water") -or 
                ($Curr -eq "Water" -and $Next -eq "Fire") -or 
                ($Curr -eq "Fire" -and $Next -eq "Gold") -or 
                ($Curr -eq "Gold" -and $Next -eq "Wood")) {
            $Flow += "$Curr overcomes $Next"
        }
    }
    return $Flow
}

# --- Main Processing ---

if (-not $InputData) {
    Write-Warning "No input data provided."
    exit
}

# Extract numbers
$Regex = "\d"
$Matches = [regex]::Matches($InputData, $Regex)
$Digits = @()
foreach ($m in $Matches) {
    $Digits += [int]$m.Value
}

if ($Digits.Count -eq 0) {
    # If no digits, maybe hash string chars? For now, return empty or error.
    Write-Output "{ ""Error"": ""No numerical data found for Bagua conversion"" }"
    exit
}

$BinarySequence = ""
$ElementSequence = @()
$GuaSequence = @()
$DetailedSteps = @()

foreach ($d in $Digits) {
    $Info = Get-BaguaInfo -Digit $d
    $BinarySequence += $Info.Bin
    $ElementSequence += $Info.Element
    $GuaSequence += $Info.Gua
    
    $DetailedSteps += @{
        Digit = $d
        Bin = $Info.Bin
        Gua = $Info.Gua
        Element = $Info.Element
    }
}

$Interactions = Analyze-FiveElements -Elements $ElementSequence

$Result = @{
    Input = $InputData
    BinaryBagua = $BinarySequence
    Elements = $ElementSequence -join " -> "
    Interactions = $Interactions
    DetailedMap = $DetailedSteps
    Paradigm = "BinaryTrigrams"
    Timestamp = (Get-Date).ToString("yyyy-MM-dd HH:mm:ss")
}

$Result | ConvertTo-Json -Depth 5
