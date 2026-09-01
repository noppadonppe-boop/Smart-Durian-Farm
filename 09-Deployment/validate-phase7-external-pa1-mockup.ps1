param(
    [string]$MockupPath = (Join-Path $PSScriptRoot 'phase7-external-pa1-mockup-data-v1.0.json'),
    [string]$DocumentPath = (Join-Path $PSScriptRoot 'Phase-7-External-PA1-Mockup-Data-Pack_v1.0.md'),
    [string]$LocalApprovalPath = (Join-Path $PSScriptRoot 'phase7-pa1-local-rehearsal-approval-v1.0.json'),
    [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function Assert-MockupCondition {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw "VALIDATION FAILED: $Message"
    }
}

$resolvedMockup = (Resolve-Path -LiteralPath $MockupPath).Path
$resolvedDocument = (Resolve-Path -LiteralPath $DocumentPath).Path
$resolvedLocalApproval = (Resolve-Path -LiteralPath $LocalApprovalPath).Path
$mockupRaw = Get-Content -Raw -LiteralPath $resolvedMockup
$documentRaw = Get-Content -Raw -LiteralPath $resolvedDocument
$localApprovalRaw = Get-Content -Raw -LiteralPath $resolvedLocalApproval
$mockup = $mockupRaw | ConvertFrom-Json
$localApproval = $localApprovalRaw | ConvertFrom-Json

Assert-MockupCondition ($mockup.schemaVersion -eq '1.0.0') 'schemaVersion must be 1.0.0.'
Assert-MockupCondition ($mockup.packId -eq 'KDOMS-EXTERNAL-PA1-MOCKUP-V1') 'packId is invalid.'
Assert-MockupCondition ($mockup.classification -eq 'SIMULATED/TEST ONLY') 'classification is invalid.'
Assert-MockupCondition ($mockup.purpose -eq 'EXTERNAL_PA1_DECISION_REHEARSAL_ONLY') 'purpose is invalid.'
Assert-MockupCondition ($mockup.deterministicSeed -eq 'KDOMS-P7-EXTERNAL-PA1-MOCKUP-20260831-001') 'deterministic seed is invalid.'

$boundary = $mockup.approvalBoundary
Assert-MockupCondition ($boundary.localEmulatorPa1 -eq 'APPROVED_AND_PASSED_DEC_037') 'Local PA-1 state is invalid.'
Assert-MockupCondition ($boundary.externalPa1 -eq 'NOT_APPROVED') 'External PA-1 must remain NOT_APPROVED.'
Assert-MockupCondition ($boundary.pa2 -eq 'NOT_APPROVED') 'PA-2 must remain NOT_APPROVED.'
Assert-MockupCondition ($boundary.pa3 -eq 'NOT_APPROVED') 'PA-3 must remain NOT_APPROVED.'
foreach ($fieldName in @(
    'externalResourceCreation', 'billing', 'credentialCreationOrUse', 'deployment',
    'realData', 'realDevices', 'fieldExecution', 'publicAccess', 'production'
)) {
    Assert-MockupCondition (-not [bool]$boundary.$fieldName) "$fieldName must remain false."
}

$data = $mockup.mockupData
Assert-MockupCondition ($data.provider -eq 'PROVIDER-SIM-01 / NON-PROVISIONABLE REFERENCE') 'Provider mock value changed.'
Assert-MockupCondition ($data.projectIdAndEnvironment -eq 'KDOMS-PILOT-SIM-001 / PRIVATE_PILOT_SIMULATION') 'Project/environment mock value changed.'
Assert-MockupCondition ($data.region -eq 'SIM-REGION-01 / NOT A CLOUD REGION') 'Region mock value changed.'
Assert-MockupCondition ([int]$data.monthlyBudget.amount -eq 0) 'Mock budget amount must remain 0.'
Assert-MockupCondition ($data.monthlyBudget.currency -eq 'THB') 'Mock budget currency must be THB.'
Assert-MockupCondition ($data.monthlyBudget.display -eq '0 THB/month — MOCK; NOT A REAL BUDGET APPROVAL') 'Mock budget display changed.'
Assert-MockupCondition ($data.pilotUrlAndAccess -match '^https://[^/]+\.example\.invalid / PRIVATE_ALLOWLIST_SIMULATION$') 'Pilot URL must remain non-routable on .example.invalid.'
Assert-MockupCondition ($data.deploymentOwner -eq 'DEPLOY-SIM-01') 'Deployment owner mock code changed.'
Assert-MockupCondition ($data.billingAndIncidentOwner -eq 'USAGE-REVIEW-SIM-01 / INCIDENT-SIM-01') 'Billing/incident owner mock codes changed.'
Assert-MockupCondition ($data.candidateState -eq 'FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE') 'Candidate must remain local-only and not deployable.'

Assert-MockupCondition ($mockup.sourceCandidate.candidateId -eq $localApproval.candidate.candidateId) 'Candidate ID does not match the local rehearsal approval.'
Assert-MockupCondition ($mockup.sourceCandidate.sourceSnapshotSha256 -eq $localApproval.candidate.sourceSnapshotSha256) 'Source snapshot hash does not match the local rehearsal approval.'
Assert-MockupCondition ($mockup.sourceCandidate.buildArtifactSha256 -eq $localApproval.candidate.buildArtifactSha256) 'Build artifact hash does not match the local rehearsal approval.'
Assert-MockupCondition ($data.candidateRevision.Contains($mockup.sourceCandidate.candidateId)) 'Candidate revision is missing the candidate ID.'
Assert-MockupCondition ($data.candidateRevision.Contains($mockup.sourceCandidate.sourceSnapshotSha256)) 'Candidate revision is missing the source hash.'

foreach ($requiredValue in @(
    $data.provider, $data.projectIdAndEnvironment, $data.region,
    $data.monthlyBudget.display, $data.pilotUrlAndAccess, $data.deploymentOwner,
    $data.billingAndIncidentOwner, $data.candidateRevision, $data.candidateState
)) {
    Assert-MockupCondition ($documentRaw.Contains([string]$requiredValue)) "Mockup document is missing canonical value: $requiredValue"
}

Assert-MockupCondition ($documentRaw.Contains('External PA-1 NOT APPROVED')) 'Document must show External PA-1 NOT APPROVED.'
Assert-MockupCondition ($documentRaw.Contains('NOT AN APPROVAL')) 'Document must state that the rehearsal is not an approval.'
Assert-MockupCondition ($mockupRaw -notmatch '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----') 'Private key material is prohibited.'
Assert-MockupCondition ($mockupRaw -notmatch 'AIza[0-9A-Za-z_-]{20,}') 'Google API key-like material is prohibited.'
Assert-MockupCondition ($mockupRaw -notmatch '0[689][0-9]{8}') 'Thai mobile number-like material is prohibited.'

$mockupHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedMockup).Hash
$result = [ordered]@{
    result = 'PASS'
    packId = $mockup.packId
    classification = $mockup.classification
    deterministicSeed = $mockup.deterministicSeed
    mockupSha256 = $mockupHash
    mappedFields = 8
    externalPa1 = $boundary.externalPa1
    externalActionAuthorized = $false
    candidateState = $data.candidateState
}

if ($AsJson) {
    $result | ConvertTo-Json -Compress
}
else {
    Write-Output 'Phase 7 External PA-1 Mockup validation: PASS'
    Write-Output "Pack: $($result.packId)"
    Write-Output "Classification: $($result.classification)"
    Write-Output "Mapped fields: $($result.mappedFields)"
    Write-Output "Mockup SHA256: $($result.mockupSha256)"
    Write-Output 'Boundary: External PA-1 NOT APPROVED; no resource, billing or deployment authorized'
}
