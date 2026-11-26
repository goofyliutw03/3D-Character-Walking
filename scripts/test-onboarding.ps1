$ErrorActionPreference = 'Stop'
. "$PSScriptRoot/onboarding.ps1"
$package = [pscustomobject]@{ packageManager='pnpm@11.25.0' }
function Assert($Condition, $Message) { if (-not $Condition) { throw $Message } }
$facts = [pscustomobject]@{ os='Microsoft Windows'; architecture='X64'; ramGiB=32; freeGiB=100; tools=@{ node='v24.14.0'; git='git version 2'; pnpm='11.25.0' } }
$r=Get-Recommendation $facts $package
Assert ($r.tier -eq 'local-rag-candidate' -and $r.nodeReady -and $r.windowsX64) 'healthy candidate'
$facts.ramGiB=4; Assert ((Get-Recommendation $facts $package).tier -eq 'constrained') 'low RAM'
$facts.ramGiB=16; $facts.freeGiB=2; Assert ((Get-Recommendation $facts $package).tier -eq 'constrained') 'low disk'
$facts.freeGiB=10; Assert ((Get-Recommendation $facts $package).tier -eq 'viewer') 'viewer tier'
$facts.ramGiB=$null; Assert ((Get-Recommendation $facts $package).tier -eq 'unknown') 'unknown RAM'
$facts.ramGiB=32; $facts.freeGiB=$null; Assert ((Get-Recommendation $facts $package).tier -eq 'unknown') 'unknown disk'
$facts.os='Linux'; Assert (-not (Get-Recommendation $facts $package).windowsX64) 'unsupported OS'
$facts.os='Windows'; $facts.architecture='Arm64'; Assert (-not (Get-Recommendation $facts $package).windowsX64) 'unsupported architecture'
$facts.architecture='X64'
foreach ($version in @('missing','unknown','v22.11.0','v20.19.0')) { $facts.tools.node=$version; Assert (-not (Get-Recommendation $facts $package).nodeReady) "reject Node $version" }
$facts.tools.node='v22.12.0'; Assert (Get-Recommendation $facts $package).nodeReady 'Node minimum'
$facts.tools.git='missing'; $facts.tools.pnpm='10.32.1'
$r=Get-Recommendation $facts $package
Assert (($r.recommendations -join ' ') -match 'install Git' -and ($r.recommendations -join ' ') -match 'pnpm@11.25.0') 'missing tools and exact pin'
Assert ((Read-Version 'nonexistent-onboarding-test-tool') -eq 'missing') 'missing command'
foreach ($arguments in @(@('-Gpu'), @('-InstallViewer','-InstallRag'))) {
    $output = & pwsh -NoProfile -File "$PSScriptRoot/onboarding.ps1" @arguments 2>&1
    Assert ($LASTEXITCODE -ne 0) 'invalid install scope must fail before probes/install'
}
Write-Output 'PASS: 17 synthetic decision/version/missing-tool cases; no installers invoked.'
