param(
    [ValidateSet('install', 'dev', 'test', 'typecheck', 'build', 'preview', 'release', 'preview-release')]
    [string]$Task = 'dev'
)
$ErrorActionPreference = 'Stop'
Push-Location (Split-Path $PSScriptRoot -Parent)
try {
    if ($Task -eq 'release') {
        & $PSCommandPath test
        & $PSCommandPath build
        & (Join-Path $PSScriptRoot 'release.ps1')
        return
    }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        throw 'Node.js is required. Install Node.js 22.12+ or 24 LTS, then reopen PowerShell.'
    }
    if ($Task -eq 'preview-release') {
        $releasePath = 'D:\Work_Mine\Testing\3D Character Walk Viewer\Release'
        if (-not (Test-Path -LiteralPath (Join-Path $releasePath 'index.html'))) { throw 'Publish Release first.' }
        & node 'node_modules/vite/bin/vite.js' preview --outDir $releasePath --host 127.0.0.1 --port 4174 --strictPort
        if ($LASTEXITCODE -ne 0) { throw "Release preview failed: $LASTEXITCODE" }
        return
    }
    if (Test-Path -LiteralPath 'pnpm-lock.yaml') {
        $pnpmCommand = Get-Command pnpm.cmd -ErrorAction SilentlyContinue
        $bundledPnpm = Join-Path $env:USERPROFILE '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pnpm/bin/pnpm.cjs'
        $taskArguments = if ($Task -eq 'install') { @('install', '--frozen-lockfile') } else { @('run', $Task) }
        if ($pnpmCommand) { & $pnpmCommand.Source @taskArguments }
        elseif (Test-Path -LiteralPath $bundledPnpm) { & node $bundledPnpm @taskArguments }
        else { throw 'Install pnpm to use the committed pnpm-lock.yaml: npm install --global pnpm@11.25.0' }
    } else {
        throw 'Missing pnpm-lock.yaml. Restore the project lockfile before running setup.'
    }
    if ($LASTEXITCODE -ne 0) { throw "Project task failed with exit code $LASTEXITCODE" }
} finally { Pop-Location }
