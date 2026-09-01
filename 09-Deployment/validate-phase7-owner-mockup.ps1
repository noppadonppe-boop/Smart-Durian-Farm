param(
    [string]$InputPath = (Join-Path $PSScriptRoot 'phase7-owner-mockup-input-v1.0.json'),
    [switch]$AsJson
)

$ErrorActionPreference = 'Stop'

function Assert-Condition {
    param(
        [bool]$Condition,
        [string]$Message
    )

    if (-not $Condition) {
        throw "VALIDATION FAILED: $Message"
    }
}

function Assert-TextValue {
    param(
        [object]$Value,
        [string]$FieldName
    )

    $textValue = [string]$Value
    Assert-Condition (-not [string]::IsNullOrWhiteSpace($textValue)) "$FieldName is missing."
    Assert-Condition ($textValue -notmatch '^(TBD|PENDING|NOT_APPLICABLE)$') "$FieldName is not ready for mock dry-run."
}

$resolvedInput = (Resolve-Path -LiteralPath $InputPath).Path
$rawInput = Get-Content -Raw -LiteralPath $resolvedInput
$inputData = $rawInput | ConvertFrom-Json

Assert-Condition ($inputData.schemaVersion -eq '1.0.0') 'schemaVersion must be 1.0.0.'
Assert-Condition ($inputData.packId -eq 'KDOMS-OWNER-MOCK-V1') 'Unexpected packId.'
Assert-Condition ($inputData.classification -eq 'SIMULATED/TEST ONLY') 'Classification must be SIMULATED/TEST ONLY.'
Assert-TextValue $inputData.deterministicSeed 'deterministicSeed'
Assert-TextValue $inputData.resetInstruction 'resetInstruction'

$approval = $inputData.approvalBoundary
Assert-Condition ($approval.pa1 -eq 'NOT_APPROVED') 'PA-1 must remain NOT_APPROVED.'
Assert-Condition ($approval.pa2 -eq 'NOT_APPROVED') 'PA-2 must remain NOT_APPROVED.'
Assert-Condition ($approval.pa3 -eq 'NOT_APPROVED') 'PA-3 must remain NOT_APPROVED.'
foreach ($boundaryName in @('externalPilotAction', 'production', 'realData', 'realDevices', 'fieldExecution')) {
    Assert-Condition (-not [bool]$approval.$boundaryName) "$boundaryName must remain false."
}

$pa1 = $inputData.pa1Mockup
foreach ($fieldName in @(
    'environmentOption', 'projectReference', 'providerReference', 'regionReference',
    'costNote', 'usageReviewerCode', 'deploymentOwnerCode', 'rollbackOwnerCode',
    'pilotUrl', 'accessMode', 'authMode', 'monitoringChannelCode',
    'backupDestinationCode', 'keyCustodianCode', 'candidateId', 'candidateState'
)) {
    Assert-TextValue $pa1.$fieldName "pa1Mockup.$fieldName"
}
Assert-Condition (-not [bool]$pa1.billingEnabled) 'Mock billing must be disabled.'
Assert-Condition ([decimal]$pa1.costCeilingTHB -eq 0) 'Mock cost ceiling must be zero and must not be treated as an estimate.'
Assert-Condition ($pa1.candidateState -eq 'NOT_FROZEN_NOT_DEPLOYABLE') 'Mock candidate must remain not frozen and not deployable.'
Assert-Condition ([int]$pa1.rpoHours -eq 24) 'Mock RPO must be 24 hours.'
Assert-Condition ([int]$pa1.rtoHours -eq 8) 'Mock RTO must be 8 hours.'
Assert-Condition ([int]$pa1.backupRetentionDays -eq 30) 'Mock backup retention must be 30 days.'

$pa2 = $inputData.pa2Mockup
foreach ($fieldName in @('pilotReference', 'farmReference', 'crossFarmDenyReference', 'evidenceStorageCode')) {
    Assert-TextValue $pa2.$fieldName "pa2Mockup.$fieldName"
}
Assert-Condition (-not [bool]$pa2.schedule.isRealAppointment) 'Mock schedule must not be a real appointment.'

foreach ($roleProperty in $pa2.roles.PSObject.Properties) {
    Assert-TextValue $roleProperty.Value "pa2Mockup.roles.$($roleProperty.Name)"
}
foreach ($supportField in @('window', 'timezone', 'lowResponse', 'escalationChannelCode')) {
    Assert-TextValue $pa2.support.$supportField "pa2Mockup.support.$supportField"
}

$positionRefs = @($pa2.cohort.positionRefs)
$plateRefs = @($pa2.cohort.plateRefs)
Assert-Condition ([int]$pa2.cohort.positionCount -eq 30) 'positionCount must be 30.'
Assert-Condition ($positionRefs.Count -eq 30) 'Exactly 30 mock position references are required.'
Assert-Condition (@($positionRefs | Sort-Object -Unique).Count -eq 30) 'Mock position references must be unique.'
Assert-Condition ($plateRefs.Count -eq 5) 'Exactly 5 mock plate references are required.'
Assert-Condition (@($plateRefs | Sort-Object -Unique).Count -eq 5) 'Mock plate references must be unique.'

$android = $pa2.devices.android
$iphone = $pa2.devices.iphone
Assert-Condition ($android.kind -eq 'BROWSER_VIEWPORT_SIMULATION') 'Android entry must be browser viewport simulation.'
Assert-Condition ($iphone.kind -eq 'BROWSER_VIEWPORT_SIMULATION') 'iPhone entry must be browser viewport simulation.'
Assert-Condition (-not [bool]$android.physicalEvidence) 'Android physical evidence must remain false.'
Assert-Condition (-not [bool]$iphone.physicalEvidence) 'iPhone physical evidence must remain false.'
Assert-Condition (([int]$android.width -eq 360) -and ([int]$android.height -eq 800)) 'Android viewport must be 360x800.'
Assert-Condition (([int]$iphone.width -eq 390) -and ([int]$iphone.height -eq 844)) 'iPhone viewport must be 390x844.'

foreach ($urlText in @($pa1.pilotUrl, $pa2.qr.testOnlyUrlPattern)) {
    $normalizedUrl = $urlText.Replace('{opaquePositionId}', 'SIM-POS-001')
    $parsedUrl = [Uri]$normalizedUrl
    Assert-Condition ($parsedUrl.Scheme -eq 'https') 'Mock URLs must use HTTPS.'
    Assert-Condition ($parsedUrl.Host.EndsWith('.example.invalid')) 'Mock URLs must use the reserved .example.invalid domain.'
}
Assert-Condition (-not [bool]$pa2.qr.encodeOrPrintAllowed) 'QR encoding and printing must remain disallowed.'

$photoPolicy = $pa2.workPhotoPolicy
Assert-Condition ($photoPolicy.outputMime -eq 'image/webp') 'Work photo output must be WebP.'
Assert-Condition ([int]$photoPolicy.maxLongEdgePx -eq 1600) 'Work photo maximum long edge must be 1600 px.'
Assert-Condition ([int64]$photoPolicy.maxOutputBytes -eq 5242880) 'Work photo maximum size must be 5 MB.'
Assert-Condition ([int]$photoPolicy.exifFieldsExpected -eq 0) 'EXIF fields expected must be zero.'
Assert-Condition ([int]$photoPolicy.gpsFieldsExpected -eq 0) 'GPS fields expected must be zero.'
Assert-Condition ([int]$photoPolicy.maxRetryAttempts -eq 3) 'Maximum photo retry attempts must be three.'

Assert-Condition ($rawInput -notmatch '-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----') 'Private key material is prohibited.'
Assert-Condition ($rawInput -notmatch 'AIza[0-9A-Za-z_-]{20,}') 'Google API key-like material is prohibited.'

$fileHash = (Get-FileHash -Algorithm SHA256 -LiteralPath $resolvedInput).Hash
$result = [ordered]@{
    result = 'PASS'
    classification = $inputData.classification
    packId = $inputData.packId
    deterministicSeed = $inputData.deterministicSeed
    sha256 = $fileHash
    pa1 = $approval.pa1
    pa2 = $approval.pa2
    pa3 = $approval.pa3
    mockPositions = $positionRefs.Count
    mockPlates = $plateRefs.Count
    physicalEvidence = $false
    qrEncodeOrPrintAllowed = $false
    deploymentAuthorized = $false
}

if ($AsJson) {
    $result | ConvertTo-Json -Compress
}
else {
    Write-Output 'Phase 7 Owner Mockup validation: PASS'
    Write-Output "Classification: $($result.classification)"
    Write-Output "Pack/Seed: $($result.packId) / $($result.deterministicSeed)"
    Write-Output "SHA256: $($result.sha256)"
    Write-Output "Cohort: $($result.mockPositions) positions / $($result.mockPlates) plates"
    Write-Output 'Boundary: PA-1/PA-2/PA-3 NOT APPROVED; deployment/real data/physical evidence disabled'
}
