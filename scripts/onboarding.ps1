param([switch]$Json, [switch]$InstallViewer, [switch]$InstallRag, [switch]$Gpu, [switch]$DryRun)
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
function Read-Version([string]$Name, [string[]]$Arguments = @('--version')) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) { return 'missing' }
    if ($Name -eq 'python' -and $command.Source -like '*WindowsApps*') { return 'unknown' }
    try {
        $value = & $command.Source @Arguments 2>$null
        if ($LASTEXITCODE -ne 0) { return 'unknown' }
        return (($value | Select-Object -First 1) -as [string])
    } catch { return 'unknown' }
}
function Get-Recommendation($Facts, $Package) {
    $messages = [System.Collections.Generic.List[string]]::new()
    $supported = $Facts.os -like '*Windows*' -and $Facts.architecture -eq 'X64'
    if (-not $supported) { $messages.Add('Manual review: automated optional RAG installation supports Windows x64 only; no install on this platform.') }
    $tier = 'unknown'
    if ($null -ne $Facts.ramGiB -and $null -ne $Facts.freeGiB) {
        $tier = if ($Facts.ramGiB -lt 8 -or $Facts.freeGiB -lt 5) { 'constrained' } elseif ($Facts.ramGiB -lt 16 -or $Facts.freeGiB -lt 15) { 'viewer' } else { 'local-rag-candidate' }
    }
    $nodeReady = $false
    if ($Facts.tools.node -match '^v?(\d+\.\d+\.\d+)') { $nodeReady = [version]$Matches[1] -ge [version]'22.12.0' }
    if (-not $nodeReady) { $messages.Add('Required: install supported Node.js LTS satisfying package.json engines (>=22.12.0), then reopen PowerShell.') }
    if ($Facts.tools.git -eq 'missing') { $messages.Add('Required for development: install Git.') }
    if ($Facts.tools.pnpm -ne ($Package.packageManager -replace '^pnpm@','')) { $messages.Add("Required: npm install --global $($Package.packageManager) (explicit opt-in; changes global npm tools).") }
    $messages.Add('Required: ./scripts/project.ps1 install; ./scripts/project.ps1 test; ./scripts/project.ps1 build')
    if ($tier -in @('constrained','unknown')) { $messages.Add('Defer local RAG; inspect unknown/limited RAM and disk first. Viewer hardware requires browser testing.') }
    elseif ($tier -eq 'viewer') { $messages.Add('Prefer Viewer only; optional CPU RAG may compete for RAM. Reserve additional disk for models/index.') }
    else { $messages.Add('Optional local RAG candidate, not a performance guarantee; CPU fallback available. Model/index disk needs vary.') }
    $messages.Add('GPU/VRAM unknown does not imply no GPU. Confirm Ollama support manually; never auto-select GPU install. Blender/Python are optional asset/RAG tools, not Viewer prerequisites.')
    [pscustomobject]@{ tier=$tier; windowsX64=$supported; nodeReady=$nodeReady; recommendations=@($messages) }
}
function Get-WorkstationFacts {
    $facts = [ordered]@{ os=[System.Runtime.InteropServices.RuntimeInformation]::OSDescription; architecture=[System.Runtime.InteropServices.RuntimeInformation]::OSArchitecture.ToString(); cpu='unknown'; logicalProcessors=[Environment]::ProcessorCount; ramGiB=$null; freeGiB=$null; gpu=@(); powerShell=$PSVersionTable.PSVersion.ToString(); tools=[ordered]@{}; warnings=@() }
    try {
        $facts.cpu = ((Get-CimInstance Win32_Processor -ErrorAction Stop | Select-Object -ExpandProperty Name) -join ', ')
    } catch { $facts.warnings += 'CPU query unavailable.' }
    try {
        $facts.ramGiB = [math]::Round((Get-CimInstance Win32_ComputerSystem -ErrorAction Stop).TotalPhysicalMemory / 1GB, 1)
    } catch { $facts.warnings += 'RAM query unavailable.' }
    try {
        $drive = [System.IO.Path]::GetPathRoot($root)
        $facts.freeGiB = [math]::Round(([System.IO.DriveInfo]::new($drive)).AvailableFreeSpace / 1GB, 1)
    } catch { $facts.warnings += 'Disk query unavailable.' }
    try {
        $facts.gpu = @(Get-CimInstance Win32_VideoController -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ name=$_.Name; vramMiB='unknown'; source='CIM name only; AdapterRAM is not reliable for modern GPUs' } })
    } catch { $facts.warnings += 'Hardware query incomplete; unavailable values are unknown/null. Try a normal Windows PowerShell session.' }
    # NVIDIA exposes dedicated memory directly; do not treat 32-bit CIM AdapterRAM as VRAM.
    if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) {
        try {
            $rows = & nvidia-smi --query-gpu=name,memory.total --format=csv,noheader,nounits 2>$null
            if ($LASTEXITCODE -eq 0) {
                $nvidia = @($rows | ForEach-Object { $parts = $_ -split ',\s*'; if ($parts.Count -eq 2 -and $parts[1] -match '^\d+$') { [pscustomobject]@{ name=$parts[0]; vramMiB=[int]$parts[1]; source='nvidia-smi' } } })
                if ($nvidia.Count) { $facts.gpu = @($facts.gpu | Where-Object { $_.name -notlike '*NVIDIA*' }) + $nvidia }
            }
        } catch { $facts.warnings += 'nvidia-smi unavailable; VRAM remains unknown.' }
    }
    if (-not $facts.gpu.Count) { $facts.gpu = @([pscustomobject]@{ name='unknown'; vramMiB='unknown'; source='unavailable' }) }
    foreach ($name in @('git','node','pnpm','python','ollama','blender','winget')) { $facts.tools[$name] = Read-Version $name }
    $qdrant = Join-Path $root '.local/rag/qdrant/qdrant.exe'
    $facts.tools.qdrant = if (Test-Path -LiteralPath $qdrant) { Read-Version $qdrant } else { 'missing' }
    $facts.tools.socraticode = if (Test-Path (Join-Path $root 'tools/rag/node_modules/socraticode/package.json')) { (Get-Content (Join-Path $root 'tools/rag/node_modules/socraticode/package.json') -Raw | ConvertFrom-Json).version } else { 'missing' }
    [pscustomobject]$facts
}
# Dot-source for synthetic decision tests without executing hardware probes or installs.
if ($MyInvocation.InvocationName -eq '.') { return }
if ($InstallViewer -and $InstallRag) { throw 'Select one install scope at a time.' }
if ($Gpu -and -not $InstallRag) { throw '-Gpu requires explicit -InstallRag.' }
$package = Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
if ($package.packageManager -notmatch '^pnpm@\d+\.\d+\.\d+$' -or -not (Test-Path (Join-Path $root 'pnpm-lock.yaml'))) { throw 'Restore packageManager and pnpm-lock.yaml before setup.' }
$facts = Get-WorkstationFacts
$advice = Get-Recommendation $facts $package
$report = [pscustomobject]@{ generatedAt=(Get-Date).ToUniversalTime().ToString('o'); mode=$(if ($DryRun -or -not ($InstallViewer -or $InstallRag)) { 'report-only' } else { 'explicit-install' }); packageManager=$package.packageManager; facts=$facts; advice=$advice }
if ($Json) { $report | ConvertTo-Json -Depth 8 } else { $report | ConvertTo-Json -Depth 8; Write-Output 'Guide / CLI prompt: docs/onboarding.md. No tools, models or services are installed/started in report-only mode.' }
if ($DryRun -or -not ($InstallViewer -or $InstallRag)) { return }
if (-not $advice.windowsX64 -or -not $advice.nodeReady) { throw 'Installation blocked: review platform/Node prerequisites in docs/onboarding.md.' }
if ($facts.tools.pnpm -ne ($package.packageManager -replace '^pnpm@','')) { throw 'Install the exact packageManager version first; see recommendations.' }
if ($InstallViewer) { & (Join-Path $PSScriptRoot 'project.ps1') install }
if ($InstallRag) {
    if ($advice.tier -ne 'local-rag-candidate') { throw 'RAG installation blocked by limited/unknown resources; review manually.' }
    if ($facts.tools.python -in @('missing','unknown')) { throw 'Python is required for the optional RAG installer.' }
    & (Join-Path $PSScriptRoot 'install-rag.ps1') -Gpu:$Gpu -SkipStartAndModels
}
