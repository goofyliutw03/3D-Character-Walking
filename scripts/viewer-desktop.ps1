param(
    [ValidateSet('tray', 'debug', 'debug-build', 'install', 'uninstall')]
    [string]$Action = 'tray',
    [string]$NodePath
)

$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
$testing = 'D:\Work_Mine\Testing\3D Character Walk Viewer'
$debugPath = Join-Path $testing 'Debug'
$releasePath = Join-Path $testing 'Release'
$releaseUrl = 'http://127.0.0.1:4174/'
$shortcutName = '3D Character Walk Viewer.lnk'
$startup = [Environment]::GetFolderPath('Startup')
$startupLink = Join-Path $startup $shortcutName
$powerShell = (Get-Process -Id $PID).Path

function Get-LaunchArguments([string]$Mode, [switch]$WithoutNode) {
    $windowStyle = if ($Mode -eq 'tray') { '-STA -WindowStyle Hidden ' } else { '' }
    $nodeArgument = if ($NodePath -and -not $WithoutNode) { " -NodePath `"$NodePath`"" } else { "" }
    "-NoProfile ${windowStyle}-File `"$PSCommandPath`" $Mode$nodeArgument"
}

if ($Action -in 'install', 'uninstall') {
    $shell = New-Object -ComObject WScript.Shell
    $trayArguments = Get-LaunchArguments tray -WithoutNode
    if (Test-Path -LiteralPath $startupLink) {
        $existing = $shell.CreateShortcut($startupLink)
        if ($existing.Arguments -notlike "$trayArguments -NodePath *") {
            throw "The Startup shortcut already belongs to another launcher: $startupLink"
        }
    }
    if ($Action -eq 'uninstall') {
        if (Test-Path -LiteralPath $startupLink) { Remove-Item -LiteralPath $startupLink }
        return
    }
    if (-not (Test-Path -LiteralPath (Join-Path $releasePath 'index.html') -PathType Leaf)) {
        throw 'Publish Release before installing the launcher.'
    }
    $NodePath = (Get-Command node -CommandType Application).Source
    $trayArguments = Get-LaunchArguments tray
    New-Item -ItemType Directory -Path $debugPath -Force | Out-Null
    foreach ($entry in @(
        @{ Path = (Join-Path $debugPath 'Start Debug.lnk'); Mode = 'debug'; Directory = $debugPath },
        @{ Path = (Join-Path $debugPath 'Build Debug.lnk'); Mode = 'debug-build'; Directory = $debugPath },
        @{ Path = $startupLink; Mode = 'tray'; Directory = $repo }
    )) {
        $arguments = Get-LaunchArguments $entry.Mode
        $link = $shell.CreateShortcut($entry.Path)
        if ((Test-Path -LiteralPath $entry.Path) -and $link.Arguments -notlike "$(Get-LaunchArguments $entry.Mode -WithoutNode) -NodePath *") {
            throw "The shortcut already belongs to another launcher: $($entry.Path)"
        }
        $link.TargetPath = $powerShell
        $link.Arguments = $arguments
        $link.WorkingDirectory = $entry.Directory
        $link.Save()
    }
    Start-Process -FilePath $powerShell -ArgumentList $trayArguments -WindowStyle Hidden
    return
}

$node = if ($NodePath) { $NodePath } else { (Get-Command node -CommandType Application).Source }
$vite = Join-Path $repo 'node_modules/vite/bin/vite.js'
if ($Action -in 'debug', 'debug-build') {
    $previousDebugDirectory = $env:WALK_VIEWER_DEBUG_DIR
    $env:WALK_VIEWER_DEBUG_DIR = $debugPath
    Push-Location $repo
    try {
        if ($Action -eq "debug-build") { & $node $vite build }
        else { & $node $vite --host 127.0.0.1 --port 5173 --strictPort }
        if ($LASTEXITCODE -ne 0) { throw "Debug exited with code $LASTEXITCODE." }
    } finally {
        Pop-Location
        $env:WALK_VIEWER_DEBUG_DIR = $previousDebugDirectory
    }
    return
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
$mutex = [Threading.Mutex]::new($false, 'Local\3DCharacterWalkViewerReleaseTray')
try {
    try { $ownsMutex = $mutex.WaitOne(0) }
    catch [Threading.AbandonedMutexException] { $ownsMutex = $true }
    if (-not $ownsMutex) { return }
    $context = [Windows.Forms.ApplicationContext]::new()
    $menu = [Windows.Forms.ContextMenuStrip]::new()
    $icon = [Windows.Forms.NotifyIcon]::new()
    $timer = [Windows.Forms.Timer]::new()
    $icon.Icon = [Drawing.SystemIcons]::Application
    $icon.ContextMenuStrip = $menu
    $icon.Visible = $true
    $script:server = $null

    function Stop-ReleaseServer {
        if ($null -eq $script:server) { return }
        if (-not $script:server.HasExited) {
            try { $script:server.Kill($true) }
            catch [InvalidOperationException] {
                if (-not $script:server.HasExited) { throw }
            }
            if (-not $script:server.WaitForExit(5000)) { throw 'Release server is still stopping.' }
        }
        $script:server.Dispose()
        $script:server = $null
    }

    function Show-ReleaseError([string]$Message) {
        $icon.Text = '3D Character Walk Viewer - Release stopped'
        $icon.ShowBalloonTip(6000, '3D Character Walk Viewer', $Message, [Windows.Forms.ToolTipIcon]::Error)
    }

    function Start-ReleaseServer {
        try {
            Stop-ReleaseServer
            if (-not (Test-Path -LiteralPath (Join-Path $releasePath "index.html") -PathType Leaf)) { throw "Publish Release first." }
            $icon.Text = '3D Character Walk Viewer - Release 4174'
            $script:server = Start-Process -FilePath $node -WorkingDirectory $repo -PassThru -WindowStyle Hidden `
                -ArgumentList "`"$vite`" preview --outDir `"$releasePath`" --host 127.0.0.1 --port 4174 --strictPort"
        } catch { Show-ReleaseError $_.Exception.Message }
    }

    $open = $menu.Items.Add('Open Release website')
    $open.add_Click({ Start-Process $releaseUrl })
    $icon.add_DoubleClick({ Start-Process $releaseUrl })
    $restart = $menu.Items.Add('Restart Release server')
    $restart.add_Click({ Start-ReleaseServer })
    $exit = $menu.Items.Add('Exit')
    $exit.add_Click({ $context.ExitThread() })
    $timer.Interval = 1000
    $timer.add_Tick({
        if ($null -ne $script:server -and $script:server.HasExited) {
            $exitCode = $script:server.ExitCode
            Stop-ReleaseServer
            Show-ReleaseError "Release exited with code $exitCode. Check the build and port 4174, then choose Restart."
        }
    })

    try {
        Start-ReleaseServer
        $timer.Start()
        [Windows.Forms.Application]::Run($context)
    } finally {
        $timer.Dispose()
        $icon.Dispose()
        $menu.Dispose()
        $context.Dispose()
        Stop-ReleaseServer
    }
} finally {
    if ($ownsMutex) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
