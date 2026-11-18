param(
    [ValidateSet('tray', 'stop', 'version', 'debug', 'debug-build', 'install', 'uninstall')]
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
$serviceVersion = '1.1.0'
. (Join-Path $PSScriptRoot 'release-version.ps1')
$stopEventName = 'Local\3DCharacterWalkViewerReleaseTrayStop'
$statusPath = Join-Path $repo '.local/viewer-tray/status.json'
if ($Action -eq 'version') {
    [pscustomobject]@{ ServiceVersion = $serviceVersion; Release = (Get-ReleaseIdentity $releasePath); Url = $releaseUrl } | ConvertTo-Json -Depth 3
    return
}
if ($Action -eq 'stop') {
    try { $stopEvent = [Threading.EventWaitHandle]::OpenExisting($stopEventName) }
    catch [Threading.WaitHandleCannotBeOpenedException] { throw 'No upgraded tray is running. Use Exit on the legacy tray.' }
    try { $stopEvent.Set() | Out-Null } finally { $stopEvent.Dispose() }
    return
}

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
    $stopEvent = [Threading.EventWaitHandle]::new($false, [Threading.EventResetMode]::ManualReset, $stopEventName)
    $stopEvent.Reset() | Out-Null
    $context = [Windows.Forms.ApplicationContext]::new()
    $menu = [Windows.Forms.ContextMenuStrip]::new()
    $icon = [Windows.Forms.NotifyIcon]::new()
    $timer = [Windows.Forms.Timer]::new()
    # Original, programmatically drawn person icon; no external asset.
    $bitmap = [Drawing.Bitmap]::new(32, 32)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $pen = [Drawing.Pen]::new([Drawing.Color]::White, 3)
    $graphics.SmoothingMode = 'AntiAlias'
    $graphics.Clear([Drawing.Color]::Transparent)
    $graphics.FillEllipse([Drawing.Brushes]::DodgerBlue, 1, 1, 30, 30)
    $graphics.FillEllipse([Drawing.Brushes]::White, 12, 5, 8, 8)
    $graphics.DrawLine($pen, 16, 14, 16, 22)
    $graphics.DrawLine($pen, 10, 18, 22, 18)
    $graphics.DrawLine($pen, 16, 22, 11, 28)
    $graphics.DrawLine($pen, 16, 22, 21, 28)
    Add-Type 'using System; using System.Runtime.InteropServices; public static class ViewerTrayNative { [DllImport("user32.dll")] public static extern bool DestroyIcon(IntPtr icon); }'
    $handle = $bitmap.GetHicon()
    $nativeIcon = [Drawing.Icon]::FromHandle($handle)
    $icon.Icon = $nativeIcon.Clone()
    $nativeIcon.Dispose()
    [ViewerTrayNative]::DestroyIcon($handle) | Out-Null
    $pen.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
    $icon.ContextMenuStrip = $menu
    $icon.Visible = $true
    $script:server = $null
    $script:releaseIdentity = $null
    $script:versionTicks = 0

    function Update-VersionPrompt([switch]$Notify) {
        $identity = Get-ReleaseIdentity $releasePath
        $changed = $null -ne $script:releaseIdentity -and $identity.Fingerprint -ne $script:releaseIdentity.Fingerprint
        $script:releaseIdentity = $identity
        $versionItem.Text = "Service v$serviceVersion | Release $($identity.Fingerprint)"
        if ($script:server -and -not $script:server.HasExited) {
            $icon.Text = "Viewer v$serviceVersion | $($identity.Fingerprint) | 4174"
        }
        if ($Notify -or $changed) {
            $message = "Service v$serviceVersion`nRelease entry: $($identity.Fingerprint)"
            if ($changed) { $message += "`nRelease changed. Refresh the browser to load the update." }
            $icon.ShowBalloonTip(6000, '3D Character Walk Viewer version', $message, [Windows.Forms.ToolTipIcon]::Info)
        }
        if ($Notify -or $changed -or -not (Test-Path -LiteralPath $statusPath)) {
            [IO.Directory]::CreateDirectory((Split-Path $statusPath -Parent)) | Out-Null
            $serverId = if ($script:server -and -not $script:server.HasExited) { $script:server.Id } else { $null }
            $state = [pscustomobject]@{ ServiceVersion = $serviceVersion; HostPid = $PID; ServerPid = $serverId; Release = $identity; Url = $releaseUrl }
            [IO.File]::WriteAllText($statusPath, ($state | ConvertTo-Json -Depth 3))
        }
    }

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
            $script:server = Start-Process -FilePath $node -WorkingDirectory $repo -PassThru -WindowStyle Hidden `
                -ArgumentList "`"$vite`" preview --outDir `"$releasePath`" --host 127.0.0.1 --port 4174 --strictPort"
            if ($script:server.WaitForExit(800)) { throw "Release failed to start (exit $($script:server.ExitCode)); port 4174 may be occupied." }
            Update-VersionPrompt -Notify
        } catch { Show-ReleaseError $_.Exception.Message }
    }

    $versionItem = $menu.Items.Add('Version')
    $versionItem.Enabled = $false
    $about = $menu.Items.Add('Version details')
    $about.add_Click({
        Update-VersionPrompt
        [Windows.Forms.MessageBox]::Show("Service v$serviceVersion`n$($script:releaseIdentity.Description)`n$releaseUrl", '3D Character Walk Viewer version') | Out-Null
    })
    $menu.Items.Add([Windows.Forms.ToolStripSeparator]::new()) | Out-Null
    $open = $menu.Items.Add('Browsing')
    $open.add_Click({ Start-Process $releaseUrl })
    $icon.add_DoubleClick({ Start-Process $releaseUrl })
    $restart = $menu.Items.Add('Restart')
    $restart.add_Click({ Start-ReleaseServer })
    $exit = $menu.Items.Add('Exit')
    $exit.add_Click({ $context.ExitThread() })
    $timer.Interval = 1000
    $timer.add_Tick({
        if ($stopEvent.WaitOne(0)) { $context.ExitThread(); return }
        $script:versionTicks++
        if ($script:versionTicks -ge 5) {
            $script:versionTicks = 0
            try { Update-VersionPrompt } catch { Show-ReleaseError $_.Exception.Message }
        }
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
        $icon.Visible = $false
        $icon.Icon.Dispose()
        $icon.Dispose()
        $menu.Dispose()
        $context.Dispose()
        Stop-ReleaseServer
        if (Test-Path -LiteralPath $statusPath) { Remove-Item -LiteralPath $statusPath }
    }
} finally {
    if ($stopEvent) { $stopEvent.Dispose() }
    if ($ownsMutex) { $mutex.ReleaseMutex() }
    $mutex.Dispose()
}
