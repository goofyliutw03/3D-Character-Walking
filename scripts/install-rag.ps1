# Restore the optional local RAG tools without changing app dependencies.
param([string]$Python = 'python', [switch]$Gpu, [switch]$SkipStartAndModels)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
Push-Location $projectRoot
try {
    New-Item -ItemType Directory -Force .local/rag/qdrant | Out-Null
    if (-not (Test-Path -LiteralPath '.local/rag/qdrant/qdrant.exe')) {
        $archive = '.local/rag/qdrant-v1.20.0.zip'
        Invoke-WebRequest 'https://github.com/qdrant/qdrant/releases/download/v1.20.0/qdrant-x86_64-pc-windows-msvc.zip' -OutFile $archive
        if ((Get-FileHash $archive -Algorithm SHA256).Hash -ne '6d13553584fd0411f00637519e293331ff0aa1fb79bd9e30db45839bb75de2be') {
            throw 'Qdrant archive SHA-256 verification failed.'
        }
        Expand-Archive -LiteralPath $archive -DestinationPath .local/rag/qdrant -Force
    }
    & pnpm dlx pnpm@10.32.1 --dir tools/rag install --frozen-lockfile
    if ($LASTEXITCODE -ne 0) { throw 'RAG package installation failed.' }
    $nativeOllama = Join-Path $env:LOCALAPPDATA 'Programs/Ollama/ollama.exe'
    if ($Gpu -and -not (Test-Path -LiteralPath $nativeOllama)) {
        & winget install --id Ollama.Ollama --exact --source winget --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
        if ($LASTEXITCODE -ne 0) { throw 'Full GPU Ollama installation failed.' }
    }
    if (-not (Test-Path -LiteralPath $nativeOllama) -and -not (Test-Path -LiteralPath '.local/rag/ollama/ollama.exe')) {
        & $Python scripts/install-ollama-cpu.py
        if ($LASTEXITCODE -ne 0) { throw 'Portable Ollama installation failed.' }
    }
    $runtimeExe = if (Test-Path -LiteralPath $nativeOllama) { $nativeOllama } else { Join-Path $projectRoot '.local/rag/ollama/ollama.exe' }
    $signature = Get-AuthenticodeSignature $runtimeExe
    if ($signature.Status -ne 'Valid') { throw 'Ollama executable signature validation failed.' }
    if ($SkipStartAndModels) { Write-Output 'RAG tools installed. Services and model download skipped.'; return }
    & ./scripts/rag.ps1 start
    $ready = $false
    for ($attempt = 0; $attempt -lt 15; $attempt++) {
        try { $null = Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 2; $ready = $true; break }
        catch { Start-Sleep -Seconds 1 }
    }
    if (-not $ready) { throw 'Ollama did not start. Inspect .local/rag logs.' }
    & ./scripts/rag.ps1 pull
    & ./scripts/rag.ps1 health
    Write-Output 'Services ready. Run node tools/rag/query.mjs index, then search. See docs/local-rag.md for Codex connection paths.'
} finally { Pop-Location }
