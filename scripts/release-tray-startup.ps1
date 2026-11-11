param([ValidateSet('install', 'remove', 'start')][string]$Action = 'start')
$ErrorActionPreference = 'Stop'
$launcher = Join-Path $PSScriptRoot 'release-tray.vbs'
$shortcutPath = Join-Path ([Environment]::GetFolderPath('Startup')) 'City Character Release.lnk'
if ($Action -eq 'remove') {
    if (Test-Path -LiteralPath $shortcutPath) { Remove-Item -LiteralPath $shortcutPath }
    Write-Output 'Login startup removed. Use tray Exit to stop the current instance.'
} elseif ($Action -eq 'install') {
    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = Join-Path $env:WINDIR 'System32\wscript.exe'
    $shortcut.Arguments = '"' + $launcher + '"'
    $shortcut.WorkingDirectory = $PSScriptRoot
    $shortcut.Description = 'City Character Release tray (current user)'
    $shortcut.Save()
    Write-Output "Login startup installed: $shortcutPath"
} else {
    Start-Process -FilePath (Join-Path $env:WINDIR 'System32\wscript.exe') -ArgumentList ('"' + $launcher + '"') -WindowStyle Hidden
}
