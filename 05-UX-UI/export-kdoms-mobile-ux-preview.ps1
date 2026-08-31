param(
    [string]$SourcePath = (Join-Path $PSScriptRoot 'kdoms-mobile-ux-prototype-source.html'),
    [string]$PreviewPath = (Join-Path $PSScriptRoot 'kdoms-mobile-ux-preview.html')
)

$ErrorActionPreference = 'Stop'

$sourceFullPath = [System.IO.Path]::GetFullPath($SourcePath)
$previewFullPath = [System.IO.Path]::GetFullPath($PreviewPath)
$uxRoot = [System.IO.Path]::GetFullPath($PSScriptRoot)

if (-not $sourceFullPath.StartsWith($uxRoot, [System.StringComparison]::OrdinalIgnoreCase) -or
    -not $previewFullPath.StartsWith($uxRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw 'Source and preview must stay inside 05-UX-UI.'
}

if (-not (Test-Path -LiteralPath $sourceFullPath)) {
    throw "Editable prototype source not found: $sourceFullPath"
}

if (-not (Test-Path -LiteralPath $previewFullPath)) {
    throw "Preview wrapper not found: $previewFullPath"
}

$source = [System.IO.File]::ReadAllText($sourceFullPath)
$preview = [System.IO.File]::ReadAllText($previewFullPath)
$encodedSource = [System.Net.WebUtility]::HtmlEncode($source)
$match = [regex]::Match(
    $preview,
    '(?s)<iframe\b[^>]*\bsrcdoc="(?<payload>[^"]*)"[^>]*></iframe>'
)

if (-not $match.Success) {
    throw 'The preview wrapper does not contain exactly one recognizable srcdoc payload.'
}

$payload = $match.Groups['payload']
$updated = $preview.Substring(0, $payload.Index) +
    $encodedSource +
    $preview.Substring($payload.Index + $payload.Length)

[System.IO.File]::WriteAllText(
    $previewFullPath,
    $updated,
    [System.Text.UTF8Encoding]::new($false)
)

Write-Output "Exported editable prototype source to: $previewFullPath"
