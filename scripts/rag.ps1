param([ValidateSet('start','health','gpu','pull','mcp')][string]$Task = 'health')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$ragHome = Join-Path $projectRoot '.local/rag'
$ollamaCommand = Get-Command ollama -ErrorAction SilentlyContinue
$ollamaExe = if ($ollamaCommand) { $ollamaCommand.Source } else { Join-Path $env:LOCALAPPDATA 'Programs/Ollama/ollama.exe' }
$portableOllama = Join-Path $ragHome 'ollama/ollama.exe'
# Prefer the full native installation, which includes CUDA libraries.
if (-not (Test-Path -LiteralPath $ollamaExe)) { $ollamaExe = $portableOllama }
function Test-Endpoint([string]$Url) {
    try { $null = Invoke-RestMethod $Url -TimeoutSec 3; return $true } catch { return $false }
}
switch ($Task) {
    'start' {
        if (-not (Test-Endpoint 'http://127.0.0.1:16333/healthz')) {
            $qdrantExe = Join-Path $ragHome 'qdrant/qdrant.exe'
            if (-not (Test-Path -LiteralPath $qdrantExe)) { throw 'Native Qdrant is missing. See docs/local-rag.md.' }
            Copy-Item -LiteralPath (Join-Path $projectRoot 'tools/rag/qdrant.yaml') -Destination (Join-Path $ragHome 'qdrant.yaml')
            Start-Process -FilePath $qdrantExe -ArgumentList @('--config-path','qdrant.yaml') -WorkingDirectory $ragHome -WindowStyle Hidden -RedirectStandardOutput (Join-Path $ragHome 'qdrant.log') -RedirectStandardError (Join-Path $ragHome 'qdrant-error.log') | Out-Null
        }
        if (-not (Test-Endpoint 'http://127.0.0.1:11434/api/tags')) {
            if (-not (Test-Path -LiteralPath $ollamaExe)) { throw 'Ollama is missing. See docs/local-rag.md.' }
            $env:OLLAMA_HOST = '127.0.0.1:11434'
            $env:OLLAMA_MODELS = Join-Path $ragHome 'models'
            $env:OLLAMA_NO_CLOUD = '1'
            $env:OLLAMA_NUM_PARALLEL = '1'
            $env:OLLAMA_MAX_LOADED_MODELS = '1'
            $env:OLLAMA_GPU_OVERHEAD = '536870912'
            $env:OLLAMA_KEEP_ALIVE = '5m'
            Start-Process -FilePath $ollamaExe -ArgumentList 'serve' -WindowStyle Hidden -RedirectStandardOutput (Join-Path $ragHome 'ollama.log') -RedirectStandardError (Join-Path $ragHome 'ollama-error.log') | Out-Null
        }
        Write-Output 'Service startup requested. Run ./scripts/rag.ps1 health after startup.'
    }
    'pull' {
        if (-not (Test-Path -LiteralPath $ollamaExe)) { throw 'Ollama executable not found.' }
        & $ollamaExe pull nomic-embed-text
        if ($LASTEXITCODE -ne 0) { throw 'Embedding model download failed.' }
    }
    'health' {
        $qdrantReady = Test-Endpoint 'http://127.0.0.1:16333/healthz'
        $ollamaReady = Test-Endpoint 'http://127.0.0.1:11434/api/tags'
        $modelReady = $false
        if ($ollamaReady) {
            $tags = Invoke-RestMethod 'http://127.0.0.1:11434/api/tags' -TimeoutSec 5
            $modelReady = @($tags.models | Where-Object { $_.name -like 'nomic-embed-text*' }).Count -gt 0
        }
        [pscustomobject]@{ Qdrant=$qdrantReady; Ollama=$ollamaReady; EmbeddingModel=$modelReady }
        if (-not ($qdrantReady -and $ollamaReady -and $modelReady)) { throw 'Local RAG is not ready. Start services and pull the embedding model.' }
    }
    'gpu' {
        $body = @{ model='nomic-embed-text'; input='search_query: city scene renderer'; keep_alive='5m' } | ConvertTo-Json
        $embedding = Invoke-RestMethod 'http://127.0.0.1:11434/api/embed' -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 120
        if ($embedding.embeddings[0].Count -ne 768) { throw 'Unexpected embedding dimensions.' }
        $running = Invoke-RestMethod 'http://127.0.0.1:11434/api/ps' -TimeoutSec 10
        $loaded = $running.models | Where-Object { $_.name -like 'nomic-embed-text*' } | Select-Object -First 1
        [pscustomobject]@{ Model=$loaded.name; GpuMemoryMiB=[Math]::Round($loaded.size_vram / 1MB, 1); Context=$loaded.context_length; Dimensions=768 }
        & $ollamaExe ps
        if ($loaded.size_vram -le 0) { throw 'Embedding model is on CPU. Check the full native Ollama installation and GPU driver.' }
    }
    'mcp' {
        $env:QDRANT_MODE = 'external'
        $env:QDRANT_URL = 'http://127.0.0.1:16333'
        $env:OLLAMA_MODE = 'external'
        $env:OLLAMA_URL = 'http://127.0.0.1:11434'
        $env:EMBEDDING_PROVIDER = 'ollama'
        $env:EMBEDDING_MODEL = 'nomic-embed-text'
        $env:EMBEDDING_DIMENSIONS = '768'
        $env:EMBEDDING_BATCH_SIZE = '8'
        $env:OLLAMA_MAX_CONNECTIONS = '1'
        $env:SOCRATICODE_AUTO_RESUME = 'off'
        $env:SOCRATICODE_WATCHER = 'off'
        Push-Location $projectRoot
        try {
            & node (Join-Path $projectRoot 'tools/rag/node_modules/socraticode/dist/index.js')
            if ($LASTEXITCODE -ne 0) { throw 'SocratiCode server failed.' }
        } finally { Pop-Location }
    }
}
