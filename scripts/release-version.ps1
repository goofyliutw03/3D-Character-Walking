function Get-ReleaseIdentity([string]$ReleasePath) {
    $entry = Join-Path $ReleasePath 'index.html'
    if (-not (Test-Path -LiteralPath $entry -PathType Leaf)) {
        return [pscustomobject]@{ Fingerprint = 'unavailable'; Sha256 = ''; EntryModifiedUtc = ''; Description = 'Release unavailable' }
    }
    $hash = (Get-FileHash -LiteralPath $entry -Algorithm SHA256).Hash.ToLowerInvariant()
    $modified = (Get-Item -LiteralPath $entry).LastWriteTimeUtc.ToString('o')
    [pscustomobject]@{
        Fingerprint = $hash.Substring(0, 12)
        Sha256 = $hash
        EntryModifiedUtc = $modified
        Description = "Release entry SHA256: $hash`nEntry modified (UTC): $modified`nSource version: unknown (no build provenance)"
    }
}
