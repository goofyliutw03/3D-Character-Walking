$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'release-version.ps1')
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('viewer-version-' + [guid]::NewGuid().ToString('N'))
[IO.Directory]::CreateDirectory($fixture) | Out-Null
try {
    $missing = Get-ReleaseIdentity $fixture
    if ($missing.Fingerprint -ne 'unavailable' -or $missing.Sha256) { throw 'Missing Release must not invent a version.' }
    $entry = Join-Path $fixture 'index.html'
    [IO.File]::WriteAllText($entry, '<script src="/assets/first.js"></script>')
    $first = Get-ReleaseIdentity $fixture
    $expected = (Get-FileHash -LiteralPath $entry -Algorithm SHA256).Hash.ToLowerInvariant()
    if ($first.Sha256 -ne $expected -or $first.Fingerprint -ne $expected.Substring(0, 12)) { throw 'Identity must use the actual Release entry.' }
    if ($first.Description -notmatch 'Source version: unknown') { throw 'Legacy Release must not claim Git provenance.' }
    (Get-Item -LiteralPath $entry).LastWriteTimeUtc = [DateTime]::UtcNow.AddHours(-1)
    if ((Get-ReleaseIdentity $fixture).Fingerprint -ne $first.Fingerprint) { throw 'Timestamp-only changes must not trigger version changes.' }
    [IO.File]::WriteAllText($entry, '<script src="/assets/second.js"></script>')
    if ((Get-ReleaseIdentity $fixture).Fingerprint -eq $first.Fingerprint) { throw 'New Release entry must trigger a version change.' }
    Write-Output 'PASS: missing entry, exact hash, unknown provenance, timestamp stability, Release change.'
} finally {
    Remove-Item -LiteralPath $fixture -Recurse -Force
}
