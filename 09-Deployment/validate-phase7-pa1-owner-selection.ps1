param(
    [string]$MockInputPath = (Join-Path $PSScriptRoot 'phase7-owner-mockup-input-v1.0.json'),
    [string]$SelectionPath = (Join-Path $PSScriptRoot 'phase7-pa1-owner-selected-mock-substitute-v1.0.json'),
    [string]$FormPath = (Join-Path $PSScriptRoot 'Phase-7-PA1-Owner-Actual-Input-Form_v1.0.md'),
    [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function Assert-SelectionCondition {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw "VALIDATION FAILED: $Message"
    }
}

$resolvedMockInput = (Resolve-Path -LiteralPath $MockInputPath).Path
$resolvedSelection = (Resolve-Path -LiteralPath $SelectionPath).Path
$resolvedForm = (Resolve-Path -LiteralPath $FormPath).Path
$mockRaw = Get-Content -Raw -LiteralPath $resolvedMockInput
$selectionRaw = Get-Content -Raw -LiteralPath $resolvedSelection
$formRaw = Get-Content -Raw -LiteralPath $resolvedForm
$mockData = $mockRaw | ConvertFrom-Json
$selectionData = $selectionRaw | ConvertFrom-Json

Assert-SelectionCondition ($selectionData.schemaVersion -eq '1.0.0') 'Selection schemaVersion must be 1.0.0.'
Assert-SelectionCondition ($selectionData.classification -eq 'OWNER-DIRECTED MOCK SUBSTITUTE / SIMULATED/TEST ONLY') 'Selection classification is invalid.'
Assert-SelectionCondition ($selectionData.selectionMode -eq 'OWNER_DIRECTED_MOCK_SUBSTITUTE') 'Selection mode is invalid.'
Assert-SelectionCondition ($selectionData.sourceMock.packId -eq $mockData.packId) 'Source packId does not match the mock pack.'
Assert-SelectionCondition ($selectionData.sourceMock.deterministicSeed -eq $mockData.deterministicSeed) 'Source seed does not match the mock pack.'

$mockHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedMockInput).Hash
Assert-SelectionCondition ($selectionData.sourceMock.sha256 -eq $mockHash) 'Declared mock SHA-256 does not match the source file.'

$approval = $selectionData.approvalBoundary
Assert-SelectionCondition ($approval.pa1 -eq 'NOT_APPROVED') 'PA-1 must remain NOT_APPROVED.'
Assert-SelectionCondition ($approval.pa2 -eq 'NOT_APPROVED') 'PA-2 must remain NOT_APPROVED.'
Assert-SelectionCondition ($approval.pa3 -eq 'NOT_APPROVED') 'PA-3 must remain NOT_APPROVED.'
foreach ($boundaryName in @('externalPilotAction', 'deployment', 'production', 'realData', 'realDevices', 'fieldExecution')) {
    Assert-SelectionCondition (-not [bool]$approval.$boundaryName) "$boundaryName must remain false."
}

$sourcePa1 = $mockData.pa1Mockup
$selectedPa1 = $selectionData.pa1Selection
foreach ($fieldName in @(
    'environmentOption', 'projectReference', 'providerReference', 'regionReference',
    'billingEnabled', 'costCeilingTHB', 'costNote', 'usageReviewerCode',
    'deploymentOwnerCode', 'rollbackOwnerCode', 'pilotUrl', 'accessMode', 'authMode',
    'monitoringChannelCode', 'monitoringRetentionDays', 'backupDestinationCode',
    'keyCustodianCode', 'rpoHours', 'rtoHours', 'backupRetentionDays', 'candidateId',
    'candidateState'
)) {
    Assert-SelectionCondition ($selectedPa1.$fieldName -eq $sourcePa1.$fieldName) "pa1Selection.$fieldName does not match the deterministic mock value."
}

Assert-SelectionCondition ($selectedPa1.candidateState -eq 'NOT_FROZEN_NOT_DEPLOYABLE') 'Candidate must remain not frozen and not deployable.'
Assert-SelectionCondition ($selectedPa1.pilotUrl -match '^https://[^/]+\.example\.invalid(?:/|$)') 'Pilot URL must remain on .example.invalid.'
Assert-SelectionCondition ($selectionData.ownerDecision.inputSubstitution -eq 'APPROVED') 'Owner mock substitution must be recorded as approved.'
Assert-SelectionCondition ($selectionData.ownerDecision.pa1Approval -eq 'AWAITING_EXPLICIT_PA1_APPROVAL') 'PA-1 must await explicit approval.'
Assert-SelectionCondition (-not [bool]$selectionData.ownerDecision.externalActionAuthorized) 'External action must remain unauthorized.'

foreach ($requiredFormValue in @(
    $selectedPa1.environmentOption, $selectedPa1.projectReference,
    $selectedPa1.providerReference, $selectedPa1.regionReference,
    $selectedPa1.usageReviewerCode, $selectedPa1.deploymentOwnerCode,
    $selectedPa1.rollbackOwnerCode, $selectedPa1.pilotUrl, $selectedPa1.accessMode,
    $selectedPa1.authMode, $selectedPa1.monitoringChannelCode,
    $selectedPa1.backupDestinationCode, $selectedPa1.keyCustodianCode,
    $selectedPa1.candidateId, $selectedPa1.candidateState,
    $selectedPa1.candidateSourceRevision
)) {
    Assert-SelectionCondition ($formRaw.Contains([string]$requiredFormValue)) "Owner input form is missing selected value: $requiredFormValue"
}
Assert-SelectionCondition ($formRaw -notmatch '\| `TBD` \| Required \|') 'Owner input form still contains an unfilled required field.'
$formShowsPendingApproval = $formRaw.Contains('AWAITING_EXPLICIT_PA1_APPROVAL')
$formShowsLocalApproval = $formRaw.Contains('APPROVED_LOCAL_EMULATOR_REHEARSAL_ONLY')
Assert-SelectionCondition ($formShowsPendingApproval -or $formShowsLocalApproval) 'Owner input form must show the current PA-1 decision state.'
Assert-SelectionCondition ($formRaw.Contains('No External Action or Deployment') -or $formRaw.Contains('PA-1 NOT APPROVED; NO DEPLOYMENT')) 'Owner input form must preserve the no-deployment boundary.'

Assert-SelectionCondition ($selectionRaw -notmatch '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----') 'Private key material is prohibited.'
Assert-SelectionCondition ($selectionRaw -notmatch 'AIza[0-9A-Za-z_-]{20,}') 'Google API key-like material is prohibited.'

$selectionHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedSelection).Hash
$result = [ordered]@{
    result = 'PASS'
    recordId = $selectionData.recordId
    classification = $selectionData.classification
    sourceMockSha256 = $mockHash
    selectionSha256 = $selectionHash
    mappedPa1Fields = 22
    pa1 = $approval.pa1
    externalActionAuthorized = $false
    candidateState = $selectedPa1.candidateState
}

if ($AsJson) {
    $result | ConvertTo-Json -Compress
}
else {
    Write-Output 'Phase 7 PA-1 Owner-selected Mock Substitute validation: PASS'
    Write-Output "Record: $($result.recordId)"
    Write-Output "Classification: $($result.classification)"
    Write-Output "Mapped PA-1 fields: $($result.mappedPa1Fields)"
    Write-Output "Selection SHA256: $($result.selectionSha256)"
    Write-Output 'Boundary: PA-1 NOT APPROVED; no deployment or external action authorized'
}
