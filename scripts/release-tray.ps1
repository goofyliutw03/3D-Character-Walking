param([string]$ReleasePath = 'D:\Work_Mine\Testing\3D Character Walk Viewer\Release', [int]$Port = 4175)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
$mutex = New-Object Threading.Mutex($false, 'Local\CityCharacterReleaseTray')
try { $ownsMutex = $mutex.WaitOne(0) }
catch [Threading.AbandonedMutexException] { $ownsMutex = $true }
if (-not $ownsMutex) { $mutex.Dispose(); return }
$script:service = $null
$tray = New-Object Windows.Forms.NotifyIcon
$context = New-Object Windows.Forms.ApplicationContext
$logDir = Join-Path $env:LOCALAPPDATA 'CityCharacterRelease'
function Write-TrayError($message) {
    [IO.Directory]::CreateDirectory($logDir) | Out-Null
    Add-Content -LiteralPath (Join-Path $logDir 'tray.log') -Value "$(Get-Date -Format o) $message"
    $tray.Text = 'Character Release - service unavailable'
    $tray.ShowBalloonTip(5000, 'Character Release', [string]$message, [Windows.Forms.ToolTipIcon]::Error)
}
function Stop-OwnedService {
    if ($script:service) {
        if (-not $script:service.HasExited) {
            try { $script:service.StandardInput.Close() } catch { }
            if (-not $script:service.WaitForExit(3000)) { $script:service.Kill(); $script:service.WaitForExit() }
        }
        $script:service.Dispose()
        $script:service = $null
    }
}
function Start-OwnedService {
    try {
        Stop-OwnedService
        if (-not (Test-Path -LiteralPath (Join-Path $ReleasePath 'index.html'))) { throw 'Publish Release first.' }
        $node = Get-Command node.exe -ErrorAction SilentlyContinue
        $nodePath = if ($node) { $node.Source } else { Join-Path $env:USERPROFILE '.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' }
        if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Node.js not found. Install Node.js or restore its path.' }
        $info = New-Object Diagnostics.ProcessStartInfo
        $info.FileName = $nodePath
        $info.Arguments = '"' + (Join-Path $PSScriptRoot 'release-server.mjs') + '" "' + $ReleasePath + '" ' + $Port
        $info.UseShellExecute = $false
        $info.CreateNoWindow = $true
        $info.RedirectStandardInput = $true
        $info.RedirectStandardError = $true
        $script:service = [Diagnostics.Process]::Start($info)
        if ($script:service.WaitForExit(800)) { throw $script:service.StandardError.ReadToEnd() }
        $tray.Text = "Character Release - localhost:$Port"
    } catch { Write-TrayError $_.Exception.Message }
}
try {
    Add-Type @'
using System;
using System.Runtime.InteropServices;
public static class TrayNative { [DllImport("user32.dll")] public static extern bool DestroyIcon(IntPtr hIcon); }
'@
    $bitmap = New-Object Drawing.Bitmap(32, 32)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $graphics.SmoothingMode = 'AntiAlias'
    $graphics.Clear([Drawing.Color]::Transparent)
    $graphics.FillEllipse([Drawing.Brushes]::DodgerBlue, 1, 1, 30, 30)
    $graphics.FillEllipse([Drawing.Brushes]::White, 12, 5, 8, 8)
    $pen = New-Object Drawing.Pen([Drawing.Color]::White, 3)
    $graphics.DrawLine($pen, 16, 14, 16, 22)
    $graphics.DrawLine($pen, 10, 18, 22, 18)
    $graphics.DrawLine($pen, 16, 22, 11, 28)
    $graphics.DrawLine($pen, 16, 22, 21, 28)
    $handle = $bitmap.GetHicon()
    $original = [Drawing.Icon]::FromHandle($handle)
    $tray.Icon = $original.Clone()
    $original.Dispose()
    [TrayNative]::DestroyIcon($handle) | Out-Null
    $pen.Dispose(); $graphics.Dispose(); $bitmap.Dispose()
    $menu = New-Object Windows.Forms.ContextMenuStrip
    $browse = $menu.Items.Add('Browsing')
    $browse.Font = New-Object Drawing.Font($browse.Font, [Drawing.FontStyle]::Bold)
    $browse.add_Click({
        if ($script:service -and -not $script:service.HasExited) { Start-Process "http://127.0.0.1:$Port/" }
        else { Write-TrayError 'Service unavailable. Use Restart; check tray.log if the port is occupied.' }
    })
    $restart = $menu.Items.Add('Restart')
    $restart.add_Click({ Start-OwnedService })
    $exit = $menu.Items.Add('Exit')
    $exit.add_Click({ $context.ExitThread() })
    $tray.ContextMenuStrip = $menu
    $tray.add_DoubleClick({ $browse.PerformClick() })
    $tray.Visible = $true
    Start-OwnedService
    $timer = New-Object Windows.Forms.Timer
    $timer.Interval = 3000
    $timer.add_Tick({
        if ($script:service -and $script:service.HasExited -and $tray.Text -notlike '*unavailable*') { Write-TrayError 'Release server stopped. Use Restart.' }
    })
    $timer.Start()
    [Windows.Forms.Application]::Run($context)
} finally {
    if ($timer) { $timer.Stop(); $timer.Dispose() }
    Stop-OwnedService
    $tray.Visible = $false
    if ($tray.Icon) { $tray.Icon.Dispose() }
    $tray.Dispose()
    if ($menu) { $menu.Dispose() }
    $context.Dispose()
    $mutex.ReleaseMutex(); $mutex.Dispose()
}
