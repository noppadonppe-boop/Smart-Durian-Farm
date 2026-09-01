param(
    [string]$ApprovalPath = (Join-Path $PSScriptRoot 'phase7-pa1-local-rehearsal-approval-v1.1.json'),
    [string]$AppPath = (Join-Path $PSScriptRoot '../07-Source-Code/web-app'),
    [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function Assert-RehearsalCondition {
    param([bool]$Condition, [string]$Message)
    if (-not $Condition) { throw "VALIDATION FAILED: $Message" }
}

function Get-AggregateFileHash {
    param([System.IO.FileInfo[]]$Files, [string]$BasePath)
    $records = foreach ($file in $Files) {
        $relative = $file.FullName.Substring($BasePath.Length + 1).Replace('\', '/')
        $hash = (Get-FileHash -Algorithm SHA256 -LiteralPath $file.FullName).Hash
        "$hash  $relative"
    }
    $manifest = ($records | Sort-Object) -join "`n"
    $algorithm = [System.Security.Cryptography.SHA256]::Create()
    try {
        $bytes = [System.Text.Encoding]::UTF8.GetBytes($manifest)
        $digest = $algorithm.ComputeHash($bytes)
        return ([System.BitConverter]::ToString($digest)).Replace('-', '')
    }
    finally {
        $algorithm.Dispose()
    }
}

$resolvedApproval = (Resolve-Path -LiteralPath $ApprovalPath).Path
$resolvedApp = (Resolve-Path -LiteralPath $AppPath).Path
$approvalRaw = Get-Content -Raw -LiteralPath $resolvedApproval
$approval = $approvalRaw | ConvertFrom-Json

Assert-RehearsalCondition ($approval.decisionId -eq 'DEC-037') 'Decision must be DEC-037.'
Assert-RehearsalCondition ($approval.pa1State -eq 'APPROVED_LOCAL_EMULATOR_REHEARSAL_ONLY') 'PA-1 state is outside the approved local boundary.'
Assert-RehearsalCondition ($approval.candidate.state -eq 'FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE') 'Candidate must remain local-only and not deployable.'
foreach ($fieldName in @('localValidation', 'firebaseEmulator', 'browserViewportSimulation', 'mockDataOnly', 'localCandidateFreeze', 'localBuildArtifact')) {
    Assert-RehearsalCondition ([bool]$approval.approvedScope.$fieldName) "Approved local scope $fieldName must be true."
}
foreach ($fieldName in @('externalResource', 'billing', 'credential', 'deployment', 'realData', 'realDevice', 'fieldExecution', 'qrEncodeOrPrint', 'production')) {
    Assert-RehearsalCondition ([bool]$approval.prohibitedScope.$fieldName) "Prohibited scope $fieldName must remain true."
}
Assert-RehearsalCondition ($approval.nextApprovalBoundary.externalPa1 -eq 'NOT_APPROVED') 'External PA-1 must remain NOT_APPROVED.'
Assert-RehearsalCondition ($approval.nextApprovalBoundary.pa2 -eq 'NOT_APPROVED') 'PA-2 must remain NOT_APPROVED.'
Assert-RehearsalCondition ($approval.nextApprovalBoundary.pa3 -eq 'NOT_APPROVED') 'PA-3 must remain NOT_APPROVED.'

$excluded = '\\(node_modules|dist|\.firebase-local)(\\|$)'
$sourceFiles = Get-ChildItem -LiteralPath $resolvedApp -Recurse -File | Where-Object {
    $_.FullName -notmatch $excluded -and
    $_.Name -notin @('firestore-debug.log', 'firebase-debug.log', 'ui-debug.log')
}
$sourceHash = Get-AggregateFileHash $sourceFiles $resolvedApp
Assert-RehearsalCondition ($sourceFiles.Count -eq [int]$approval.candidate.sourceFileCount) 'Source file count changed after freeze.'
Assert-RehearsalCondition ($sourceHash -eq $approval.candidate.sourceSnapshotSha256) 'Source snapshot hash changed after freeze.'

$lockHash = (Get-FileHash -Algorithm SHA256 -LiteralPath (Join-Path $resolvedApp 'pnpm-lock.yaml')).Hash
Assert-RehearsalCondition ($lockHash -eq $approval.candidate.lockfileSha256) 'Lockfile hash changed after freeze.'

$distPath = (Resolve-Path -LiteralPath (Join-Path $resolvedApp 'dist')).Path
$distFiles = Get-ChildItem -LiteralPath $distPath -Recurse -File
$distHash = Get-AggregateFileHash $distFiles $distPath
Assert-RehearsalCondition ($distFiles.Count -eq [int]$approval.candidate.buildFileCount) 'Build file count does not match the frozen artifact.'
Assert-RehearsalCondition ($distHash -eq $approval.candidate.buildArtifactSha256) 'Build artifact hash does not match the frozen artifact.'

Assert-RehearsalCondition ($approval.rehearsalEvidence.result -eq 'PASS_AFTER_BROWSER_REMEDIATION') 'Rehearsal result is not PASS.'
Assert-RehearsalCondition ([bool]$approval.rehearsalEvidence.durableQueueSurvivedReload) 'Browser durable queue reload evidence is missing.'
Assert-RehearsalCondition ($approval.rehearsalEvidence.durableQueueRetryCommit -eq 'PASS') 'Browser durable queue retry/commit did not pass.'
Assert-RehearsalCondition ([int]$approval.rehearsalEvidence.durableQueueAfterRetryBatches -eq 0) 'Browser durable queue was not cleaned after commit.'
Assert-RehearsalCondition ($approval.rehearsalEvidence.photoLifecycleDryRunResult -eq 'PASS_NO_MUTATION') 'Lifecycle DRY_RUN evidence is missing.'
Assert-RehearsalCondition (-not [bool]$approval.rehearsalEvidence.externalDeployment) 'External deployment evidence must remain false.'
Assert-RehearsalCondition ($approvalRaw -notmatch '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----') 'Private key material is prohibited.'
Assert-RehearsalCondition ($approvalRaw -notmatch 'AIza[0-9A-Za-z_-]{20,}') 'Google API key-like material is prohibited.'

$result = [ordered]@{
    result = 'PASS'
    decisionId = $approval.decisionId
    pa1State = $approval.pa1State
    candidateId = $approval.candidate.candidateId
    candidateState = $approval.candidate.state
    sourceFiles = $sourceFiles.Count
    sourceSnapshotSha256 = $sourceHash
    buildFiles = $distFiles.Count
    buildArtifactSha256 = $distHash
    unitComponentTests = $approval.rehearsalEvidence.unitComponentTests
    emulatorTests = $approval.rehearsalEvidence.emulatorTests
    externalDeployment = $false
}

if ($AsJson) {
    $result | ConvertTo-Json -Compress
}
else {
    Write-Output 'Phase 7 PA-1 Local/Emulator rehearsal validation: PASS'
    Write-Output "Candidate: $($result.candidateId) / $($result.candidateState)"
    Write-Output "Source: $($result.sourceFiles) files / $($result.sourceSnapshotSha256)"
    Write-Output "Build: $($result.buildFiles) files / $($result.buildArtifactSha256)"
    Write-Output "Tests: $($result.unitComponentTests) local / $($result.emulatorTests) emulator"
    Write-Output 'Boundary: no external resource, deployment, real data/device or Production'
}
