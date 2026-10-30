#requires -Version 7.0
param()
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$source = [IO.Path]::GetFullPath((Join-Path $projectRoot 'dist'))
$destination = [IO.Path]::GetFullPath('D:\Work_Mine\Testing\3D Character Walk Viewer\Release')

function Assert-SafePath([string]$Path) {
    $cursor = $Path
    while ($cursor) {
        if (Test-Path -LiteralPath $cursor) {
            $item = Get-Item -LiteralPath $cursor -Force
            if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
                throw "Reparse points are not allowed: $cursor"
            }
        }
        $cursor = Split-Path $cursor -Parent
    }
}

Assert-SafePath $source
Assert-SafePath $destination
if (-not (Test-Path -LiteralPath (Join-Path $source 'index.html') -PathType Leaf)) {
    throw 'Missing dist/index.html. Run a successful production build first.'
}

# Traverse explicitly so a source junction is rejected before descending into it.
$files = [Collections.Generic.List[IO.FileInfo]]::new()
$pending = [Collections.Generic.Stack[string]]::new()
$pending.Push($source)
while ($pending.Count) {
    foreach ($item in Get-ChildItem -LiteralPath $pending.Pop() -Force) {
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Reparse point: $($item.FullName)" }
        if ($item.PSIsContainer) { $pending.Push($item.FullName) }
        else { $files.Add($item) }
    }
}

$plan = foreach ($file in $files) {
    $relative = $file.FullName.Substring($source.Length + 1)
    if ($relative -match '(^|[\\/])(\.git|node_modules|src|\.env[^\\/]*)([\\/]|$)' -or
        $file.Extension -in @('.map', '.ts', '.pem', '.key', '.pfx')) {
        throw "Unexpected private/source file in dist: $relative"
    }
    $target = [IO.Path]::GetFullPath((Join-Path $destination $relative))
    if (-not $target.StartsWith($destination + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Target escapes Release: $target"
    }
    Assert-SafePath $target
    if (Test-Path -LiteralPath $target -PathType Container) { throw "Target is a directory: $target" }
    $exists = Test-Path -LiteralPath $target -PathType Leaf
    $hash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
    $same = $exists -and ((Get-FileHash -LiteralPath $target -Algorithm SHA256).Hash -eq $hash)
    [pscustomobject]@{ Source = $file.FullName; Target = $target; Relative = $relative; Exists = $exists; Same = $same; Hash = $hash }
}

$added = 0; $updated = 0; $skipped = 0
# Assets precede all HTML entries; the main index remains the last replacement.
foreach ($entry in ($plan | Sort-Object @{ Expression = {
    if ($_.Relative -eq 'index.html') { 2 }
    elseif ([IO.Path]::GetExtension($_.Relative) -eq '.html') { 1 }
    else { 0 }
} }, Relative)) {
    if ($entry.Same) { $skipped++; continue }
    Assert-SafePath $entry.Target
    $parent = Split-Path $entry.Target -Parent
    [IO.Directory]::CreateDirectory($parent) | Out-Null
    $temporary = Join-Path $parent ('.release-' + [guid]::NewGuid().ToString('N') + '.tmp')
    try {
        [IO.File]::Copy($entry.Source, $temporary, $false)
        if ((Get-FileHash -LiteralPath $temporary -Algorithm SHA256).Hash -ne $entry.Hash) {
            throw "Source changed during release: $($entry.Relative)"
        }
        Assert-SafePath $entry.Target
        if ($entry.Exists) { [IO.File]::Move($temporary, $entry.Target, $true); $updated++ }
        else { [IO.File]::Move($temporary, $entry.Target); $added++ }
    } finally {
        if (Test-Path -LiteralPath $temporary) { Remove-Item -LiteralPath $temporary }
    }
}
[pscustomobject]@{ Destination = $destination; Added = $added; Updated = $updated; Skipped = $skipped; CompletedAt = (Get-Date -Format o) }
