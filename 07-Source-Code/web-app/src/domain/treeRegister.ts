import type { AuthenticatedIdentity, FarmAccess } from './farm'

export const treeStatuses = [
  'normal',
  'watch',
  'sick',
  'recovering',
  'dead',
  'empty',
] as const
export const treeHealthStatuses = ['normal', 'watch', 'sick', 'recovering', 'dead'] as const
export const positionStatuses = ['ACTIVE', 'ARCHIVED'] as const
export const identityConfidences = ['confirmed', 'estimated', 'unknown'] as const
export const measurementConfidences = ['measured', 'estimated', 'unknown'] as const
export const rowCountingDirections = ['ASCENDING', 'DESCENDING', 'TBD'] as const
export const treeQrFormats = ['TAG', 'URL'] as const

export type TreeStatus = (typeof treeStatuses)[number]
export type TreeHealthStatus = (typeof treeHealthStatuses)[number]
export type TreePresence = 'present' | 'empty'
export type PositionStatus = (typeof positionStatuses)[number]
export type IdentityConfidence = (typeof identityConfidences)[number]
export type MeasurementConfidence = (typeof measurementConfidences)[number]
export type RowCountingDirection = (typeof rowCountingDirections)[number]
export type TreeQrFormat = (typeof treeQrFormats)[number]
export type TreeQrAssetStatus = 'READY'

export const treeStatusLabels: Record<TreeStatus, string> = {
  normal: 'ปกติ',
  watch: 'เฝ้าระวัง',
  sick: 'ป่วย',
  recovering: 'พักฟื้น',
  dead: 'ตาย',
  empty: 'ไม่มีต้น',
}

export const treePresenceLabels: Record<TreePresence, string> = {
  present: 'มีต้น',
  empty: 'ไม่มีต้น',
}

export function treePresenceFromStatus(status: TreeStatus): TreePresence {
  return status === 'empty' ? 'empty' : 'present'
}

export const identityConfidenceLabels: Record<IdentityConfidence, string> = {
  confirmed: 'ยืนยันแล้ว',
  estimated: 'ประมาณ',
  unknown: 'ไม่ทราบ',
}

export const measurementConfidenceLabels: Record<MeasurementConfidence, string> = {
  measured: 'วัดจริง',
  estimated: 'ประมาณ',
  unknown: 'ไม่ทราบ',
}

export const rowCountingDirectionLabels: Record<RowCountingDirection, string> = {
  ASCENDING: 'นับจากเลขน้อยไปเลขมาก',
  DESCENDING: 'นับจากเลขมากไปเลขน้อย',
  TBD: 'ยังไม่ยืนยัน',
}

export interface TagParts {
  organizationCode: string
  farmSequence: string
  zoneCode: string
  rowCode: string
  treeSequence: number
}

export interface GpsMeasurement {
  latitude: number
  longitude: number
  accuracyM: number
  method: string
  measuredAt: string
  measuredBy: string
  confidence: MeasurementConfidence
  source: string
}

export interface TrunkMeasurement {
  type: 'circumference' | 'diameter'
  value: number
  unit: 'cm'
  heightCm: number
  method: string
  measuredAt: string
  measuredBy: string
  confidence: MeasurementConfidence
  source: string
}

export interface CanopyMeasurement {
  widthNS: number
  widthEW: number
  unit: 'm'
  method: string
  measuredAt: string
  measuredBy: string
  confidence: MeasurementConfidence
  source: string
}

export interface HeightMeasurement {
  value: number
  unit: 'm'
  method: string
  measuredAt: string
  measuredBy: string
  confidence: MeasurementConfidence
  source: string
}

export interface TreeBaselineMeasurements {
  gps: GpsMeasurement | null
  trunk: TrunkMeasurement | null
  canopy: CanopyMeasurement | null
  height: HeightMeasurement | null
}

export function emptyTreeBaselineMeasurements(): TreeBaselineMeasurements {
  return { gps: null, trunk: null, canopy: null, height: null }
}

export interface PlantingCycleRecord {
  cycleId: string
  cycleNumber: number
  variety: string | null
  varietyConfidence: IdentityConfidence
  plantingYear: number | null
  plantingYearCalendar: 'BE' | 'CE' | null
  plantingYearConfidence: IdentityConfidence
  plantSource: string | null
  treeStatus: TreeStatus
  baselineDate: string
  baselineMeasurements: TreeBaselineMeasurements
  notes: string
  startedAtLabel: string
  endedAtLabel: string | null
  version: number
}

export interface TreeTimelineEvent {
  eventId: string
  eventType:
    | 'TREE_POSITION_CREATED'
    | 'TREE_POSITION_IMPORTED'
    | 'TREE_CYCLE_UPDATED'
    | 'TREE_CYCLE_REPLACED'
    | 'TREE_POSITION_ARCHIVED'
    | 'TAG_DAMAGED_REPORTED'
  actorUserId: string
  actorDisplayName: string
  description: string
  createdAtLabel: string
  positionVersion: number
}

export interface TreePositionSummary extends TagParts {
  organizationId: string
  farmId: string
  positionId: string
  tagCode: string
  rowCountingDirection: RowCountingDirection
  positionStatus: PositionStatus
  currentCycleNumber: number
  currentCycle: PlantingCycleRecord
  qrPath: string
  version: number
  exampleData: boolean
}

export interface TreePositionDetail extends TreePositionSummary {
  plantingCycles: PlantingCycleRecord[]
  timeline: TreeTimelineEvent[]
}

export interface TreeQrAsset {
  qrAssetId: string
  organizationId: string
  farmId: string
  positionId: string
  tagCode: string
  format: TreeQrFormat
  payload: string
  storagePath: string
  storageUrl: string
  status: TreeQrAssetStatus
  createdAtLabel: string
  exampleData: boolean
}

export interface TreeQrAssetDraft {
  positionId: string
  tagCode: string
  format: TreeQrFormat
  payload: string
  svg: string
}

export interface TreePositionDraft extends TagParts {
  rowCountingDirection: RowCountingDirection
  variety: string | null
  varietyConfidence: IdentityConfidence
  plantingYear: number | null
  plantingYearCalendar: 'BE' | 'CE' | null
  plantingYearConfidence: IdentityConfidence
  plantSource: string | null
  treeStatus: TreeStatus
  baselineDate: string
  baselineMeasurements: TreeBaselineMeasurements
  notes: string
}

export interface TreeMutationContext {
  actor: AuthenticatedIdentity
  farm: FarmAccess
}

export interface UpdatePlantingCycleInput {
  variety: string | null
  varietyConfidence: IdentityConfidence
  plantingYear: number | null
  plantingYearCalendar: 'BE' | 'CE' | null
  plantingYearConfidence: IdentityConfidence
  plantSource: string | null
  treeStatus: TreeStatus
  baselineDate: string
  baselineMeasurements: TreeBaselineMeasurements
  notes: string
}

export interface ReplacePlantingCycleInput extends UpdatePlantingCycleInput {
  baselineDate: string
  reason: string
}

export interface TreeImportCandidate extends TreePositionDraft {
  sourceRow: number
  plantingCycle: number
  tagCode: string
  raw: Readonly<Record<string, string>>
}

export interface TreeImportReject {
  sourceRow: number
  tagCode: string
  errors: readonly string[]
}

export interface TreeImportPreview {
  headerValid: boolean
  totalRows: number
  candidates: readonly TreeImportCandidate[]
  rejects: readonly TreeImportReject[]
  idempotencyKey: string
}

export interface TreeImportResult {
  idempotencyKey: string
  importedCount: number
  existingCount: number
  positionIds: readonly string[]
  wasRetry: boolean
}

const organizationCodePattern = /^[A-Z0-9]{2,10}$/u
const farmSequencePattern = /^F\d{2,}$/u
const zoneCodePattern = /^(?:Z)?\d+$/u
const rowCodePattern = /^(?:R)?\d+$/u
const legacyTagPattern = /^([A-Z0-9]{2,10})-(F\d{2,})-(Z\d+)-(R\d+)-T(\d+)$/u
const farmLocalTagPattern = /^(Z\d+)-(R\d+)-T(\d+)$/u
const treeSequencePattern = /^(?:T)?\d+$/u
const opaquePositionIdPattern = /^pos_[A-Za-z0-9_-]{12,}$/u
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u

export function normalizeTagCode(value: string): string {
  return value.trim().toUpperCase()
}

function positiveCodeNumber(value: string, prefix: 'Z' | 'R', label: string): number {
  const normalized = value.trim().toUpperCase()
  const pattern = prefix === 'Z' ? zoneCodePattern : rowCodePattern
  if (!pattern.test(normalized)) {
    throw new Error(`${label}ต้องเป็น ${prefix}01, ${prefix}1, 01 หรือ 1`)
  }
  const numberPart = normalized.startsWith(prefix) ? normalized.slice(1) : normalized
  const number = Number(numberPart)
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error(`${label}ต้องมากกว่า 0`)
  }
  return number
}

export function normalizeZoneCode(value: string): string {
  return `Z${String(positiveCodeNumber(value, 'Z', 'รหัสโซน')).padStart(2, '0')}`
}

export function normalizeRowCode(value: string): string {
  return `R${String(positiveCodeNumber(value, 'R', 'รหัสแถว')).padStart(2, '0')}`
}

export function normalizeTreeSequence(value: number | string): number {
  const normalized = String(value).trim().toUpperCase()
  if (!treeSequencePattern.test(normalized)) {
    throw new Error('ลำดับตำแหน่งต้องเป็น T01, T1, 01 หรือ 1')
  }
  const number = Number(normalized.startsWith('T') ? normalized.slice(1) : normalized)
  if (!Number.isSafeInteger(number) || number <= 0) {
    throw new Error('ลำดับตำแหน่งต้องมากกว่า 0')
  }
  return number
}

export function generateTagCode(parts: TagParts): string {
  const organizationCode = parts.organizationCode.trim().toUpperCase()
  const farmSequence = parts.farmSequence.trim().toUpperCase()
  const zoneCode = normalizeZoneCode(parts.zoneCode)
  const rowCode = normalizeRowCode(parts.rowCode)
  if (!organizationCodePattern.test(organizationCode)) {
    throw new Error('Organization Code ต้องเป็น A–Z/0–9 จำนวน 2–10 ตัว')
  }
  if (!farmSequencePattern.test(farmSequence)) {
    throw new Error('Farm Sequence ต้องเป็น F ตามด้วยเลขอย่างน้อย 2 หลัก')
  }
  const treeSequence = normalizeTreeSequence(parts.treeSequence)
  return `${zoneCode}-${rowCode}-T${String(treeSequence).padStart(2, '0')}`
}

export function generateLegacyTagCode(parts: TagParts): string {
  const organizationCode = parts.organizationCode.trim().toUpperCase()
  const farmSequence = parts.farmSequence.trim().toUpperCase()
  const zoneCode = normalizeZoneCode(parts.zoneCode)
  const rowNumber = positiveCodeNumber(parts.rowCode, 'R', 'รหัสแถว')
  if (!organizationCodePattern.test(organizationCode)) {
    throw new Error('Organization Code ต้องเป็น A–Z/0–9 จำนวน 2–10 ตัว')
  }
  if (!farmSequencePattern.test(farmSequence)) {
    throw new Error('Farm Sequence ต้องเป็น F ตามด้วยเลขอย่างน้อย 2 หลัก')
  }
  const treeSequence = normalizeTreeSequence(parts.treeSequence)
  return `${organizationCode}-${farmSequence}-${zoneCode}-R${String(rowNumber).padStart(2, '0')}-T${String(treeSequence).padStart(3, '0')}`
}

export function parseTagCode(
  value: string,
  scope?: Pick<TagParts, 'organizationCode' | 'farmSequence'>,
): TagParts {
  const normalized = normalizeTagCode(value)
  const legacyMatch = legacyTagPattern.exec(normalized)
  if (legacyMatch) {
    const treeSequence = normalizeTreeSequence(legacyMatch[5] ?? '')
    const organizationCode = legacyMatch[1]
    const farmSequence = legacyMatch[2]
    const zoneCode = legacyMatch[3]
    const rowCode = legacyMatch[4]
    if (!organizationCode || !farmSequence || !zoneCode || !rowCode) {
      throw new Error('ส่วนประกอบ Tag ไม่ครบถ้วน')
    }
    if (!Number.isSafeInteger(treeSequence) || treeSequence <= 0) {
      throw new Error('ลำดับตำแหน่งใน Tag ต้องมากกว่า 0')
    }
    return {
      organizationCode,
      farmSequence,
      zoneCode: normalizeZoneCode(zoneCode),
      rowCode: normalizeRowCode(rowCode),
      treeSequence,
    }
  }

  const localMatch = farmLocalTagPattern.exec(normalized)
  if (!localMatch || !scope) {
    throw new Error('รูปแบบรหัสป้ายต้องเป็น Z01-R01-T01; รหัสรุ่นเดิม ORG-F01-Z01-R01-T001 ยังรองรับ')
  }
  const organizationCode = scope.organizationCode.trim().toUpperCase()
  const farmSequence = scope.farmSequence.trim().toUpperCase()
  const zoneCode = localMatch[1]
  const rowCode = localMatch[2]
  const treeSequence = normalizeTreeSequence(localMatch[3] ?? '')
  if (!organizationCodePattern.test(organizationCode) || !farmSequencePattern.test(farmSequence)) {
    throw new Error('บริบทองค์กรหรือสวนสำหรับรหัสป้ายไม่ถูกต้อง')
  }
  if (!zoneCode || !rowCode) throw new Error('ส่วนประกอบรหัสป้ายไม่ครบถ้วน')
  return {
    organizationCode,
    farmSequence,
    zoneCode: normalizeZoneCode(zoneCode),
    rowCode: normalizeRowCode(rowCode),
    treeSequence,
  }
}

export function isOpaquePositionId(value: string): boolean {
  return opaquePositionIdPattern.test(value)
}

export function createOpaquePositionId(): string {
  return `pos_${crypto.randomUUID().replaceAll('-', '')}`
}

export function buildQrPayload(baseUrl: string, positionId: string): string {
  if (!isOpaquePositionId(positionId)) throw new Error('Opaque Position ID ไม่ถูกต้อง')
  let parsed: URL
  try {
    parsed = new URL(baseUrl)
  } catch {
    throw new Error('QR base URL ไม่ถูกต้อง')
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('QR base URL ต้องใช้ HTTP หรือ HTTPS')
  }
  return `${parsed.href.replace(/\/$/u, '')}/t/${positionId}`
}

export function positionIdFromQrInput(value: string, baseUrl: string): string {
  const trimmed = value.trim()
  if (isOpaquePositionId(trimmed)) return trimmed
  let inputUrl: URL
  let configuredUrl: URL
  try {
    inputUrl = new URL(trimmed)
    configuredUrl = new URL(baseUrl)
  } catch {
    throw new Error('QR ต้องเป็น URL ที่ระบบกำหนดหรือ Opaque Position ID')
  }
  if (inputUrl.origin !== configuredUrl.origin) {
    throw new Error('QR นี้ไม่ได้มาจาก base URL ที่กำหนด')
  }
  const basePath = configuredUrl.pathname.replace(/\/$/u, '')
  const expectedPrefix = `${basePath}/t/`.replace(/^\/\//u, '/')
  if (!inputUrl.pathname.startsWith(expectedPrefix)) {
    throw new Error('QR route ต้องอยู่ที่ /t/{opaquePositionId}')
  }
  const positionId = inputUrl.pathname.slice(expectedPrefix.length)
  if (!isOpaquePositionId(positionId) || positionId.includes('/')) {
    throw new Error('Opaque Position ID ใน QR ไม่ถูกต้อง')
  }
  return positionId
}

export function canManageTreeRegister(access: FarmAccess): boolean {
  return (
    access.farmStatus === 'ACTIVE' &&
    (access.isOrganizationOwner || access.role === 'FARM_MANAGER')
  )
}

export const treeRegisterCsvHeaders = [
  'recordType',
  'organizationCode',
  'farmSequence',
  'zoneCode',
  'rowCode',
  'treeSequence',
  'tagCode',
  'plantingCycle',
  'variety',
  'varietyConfidence',
  'plantingYear',
  'plantingYearCalendar',
  'plantingYearConfidence',
  'treeStatus',
  'latitude',
  'longitude',
  'gpsAccuracyM',
  'gpsMethod',
  'gpsMeasuredAt',
  'gpsMeasuredBy',
  'gpsConfidence',
  'gpsSource',
  'trunkMeasureType',
  'trunkMeasureValue',
  'trunkMeasureUnit',
  'trunkMeasureHeightCm',
  'trunkMeasureMethod',
  'trunkMeasuredAt',
  'trunkMeasuredBy',
  'trunkMeasureConfidence',
  'trunkMeasureSource',
  'canopyWidthNSValue',
  'canopyWidthNSUnit',
  'canopyWidthEWValue',
  'canopyWidthEWUnit',
  'canopyMeasureMethod',
  'canopyMeasuredAt',
  'canopyMeasuredBy',
  'canopyMeasureConfidence',
  'canopyMeasureSource',
  'heightValue',
  'heightUnit',
  'heightMeasureMethod',
  'heightMeasuredAt',
  'heightMeasuredBy',
  'heightMeasureConfidence',
  'heightMeasureSource',
  'baselineDate',
  'notes',
] as const

export const treeRegisterImportLimit = 50

export type TreeCsvHeader = (typeof treeRegisterCsvHeaders)[number]

export const treeRegisterThaiHeaderByField = {
  recordType: 'ประเภทข้อมูล',
  organizationCode: 'รหัสองค์กร',
  farmSequence: 'ลำดับสวน',
  zoneCode: 'รหัสโซน',
  rowCode: 'รหัสแถว',
  treeSequence: 'ลำดับตำแหน่ง',
  tagCode: 'รหัสป้าย',
  plantingCycle: 'รอบปลูก',
  variety: 'พันธุ์',
  varietyConfidence: 'ความมั่นใจของพันธุ์',
  plantingYear: 'ปีปลูก',
  plantingYearCalendar: 'ระบบปีปลูก',
  plantingYearConfidence: 'ความมั่นใจของปีปลูก',
  treeStatus: 'สถานะต้น',
  latitude: 'ละติจูด',
  longitude: 'ลองจิจูด',
  gpsAccuracyM: 'ความแม่นยำ GPS (เมตร)',
  gpsMethod: 'วิธีวัด GPS',
  gpsMeasuredAt: 'วันที่เวลาวัด GPS',
  gpsMeasuredBy: 'ผู้วัด GPS',
  gpsConfidence: 'ความมั่นใจ GPS',
  gpsSource: 'แหล่งข้อมูล GPS',
  trunkMeasureType: 'ประเภทการวัดลำต้น',
  trunkMeasureValue: 'ค่าที่วัดลำต้น',
  trunkMeasureUnit: 'หน่วยวัดลำต้น',
  trunkMeasureHeightCm: 'ความสูงจุดวัดจากพื้น (ซม.)',
  trunkMeasureMethod: 'วิธีวัดลำต้น',
  trunkMeasuredAt: 'วันที่เวลาวัดลำต้น',
  trunkMeasuredBy: 'ผู้วัดลำต้น',
  trunkMeasureConfidence: 'ความมั่นใจการวัดลำต้น',
  trunkMeasureSource: 'แหล่งข้อมูลการวัดลำต้น',
  canopyWidthNSValue: 'ความกว้างทรงพุ่ม เหนือ-ใต้',
  canopyWidthNSUnit: 'หน่วยทรงพุ่ม เหนือ-ใต้',
  canopyWidthEWValue: 'ความกว้างทรงพุ่ม ตะวันออก-ตะวันตก',
  canopyWidthEWUnit: 'หน่วยทรงพุ่ม ตะวันออก-ตะวันตก',
  canopyMeasureMethod: 'วิธีวัดทรงพุ่ม',
  canopyMeasuredAt: 'วันที่เวลาวัดทรงพุ่ม',
  canopyMeasuredBy: 'ผู้วัดทรงพุ่ม',
  canopyMeasureConfidence: 'ความมั่นใจการวัดทรงพุ่ม',
  canopyMeasureSource: 'แหล่งข้อมูลการวัดทรงพุ่ม',
  heightValue: 'ความสูงต้น',
  heightUnit: 'หน่วยความสูงต้น',
  heightMeasureMethod: 'วิธีวัดความสูง',
  heightMeasuredAt: 'วันที่เวลาวัดความสูง',
  heightMeasuredBy: 'ผู้วัดความสูง',
  heightMeasureConfidence: 'ความมั่นใจการวัดความสูง',
  heightMeasureSource: 'แหล่งข้อมูลการวัดความสูง',
  baselineDate: 'วันที่ข้อมูลตั้งต้น',
  notes: 'หมายเหตุ',
} as const satisfies Record<TreeCsvHeader, string>

export const treeRegisterThaiCsvHeaders = treeRegisterCsvHeaders.map(
  (field) => treeRegisterThaiHeaderByField[field],
)

export const treeRegisterRegistrationCsvHeaders = [
  'zoneCode',
  'rowCode',
  'treeSequence',
  'tagCode',
  'plantingCycle',
  'variety',
  'plantingYear',
] as const satisfies readonly TreeCsvHeader[]

export const treeRegisterThaiRegistrationCsvHeaders = treeRegisterRegistrationCsvHeaders.map(
  (field) => treeRegisterThaiHeaderByField[field],
)

// Kept only so files made by the previous downloaded template remain importable.
const treeRegisterLegacyThaiRegistrationCsvHeaders = [
  treeRegisterThaiHeaderByField.recordType,
  treeRegisterThaiHeaderByField.organizationCode,
  treeRegisterThaiHeaderByField.farmSequence,
  ...treeRegisterThaiRegistrationCsvHeaders,
] as const

export const treeRegisterThaiSpreadsheetOptions = {
  recordTypes: ['ข้อมูลภาคสนาม'],
  identityConfidences: ['ยืนยันแล้ว', 'ประมาณ', 'ไม่ทราบ'],
  plantingYearCalendars: ['พ.ศ.', 'ค.ศ.'],
  treeStatuses: ['ปกติ', 'เฝ้าระวัง', 'ป่วย', 'พักฟื้น', 'ตาย', 'ไม่มีต้น'],
  measurementConfidences: ['วัดจริง', 'ประมาณ', 'ไม่ทราบ'],
  trunkMeasureTypes: ['เส้นรอบวง', 'เส้นผ่านศูนย์กลาง'],
} as const

const thaiHeaderToField = new Map<string, TreeCsvHeader>(
  treeRegisterCsvHeaders.map((field) => [treeRegisterThaiHeaderByField[field], field]),
)

const identityConfidenceAliases = {
  ยืนยันแล้ว: 'confirmed',
  ประมาณ: 'estimated',
  ไม่ทราบ: 'unknown',
} as const

const measurementConfidenceAliases = {
  วัดจริง: 'measured',
  ยืนยันแล้ว: 'measured',
  confirmed: 'measured',
  ประมาณ: 'estimated',
  ไม่ทราบ: 'unknown',
} as const

const thaiSpreadsheetValueAliases: Partial<
  Record<TreeCsvHeader, Readonly<Record<string, string>>>
> = {
  recordType: { ข้อมูลภาคสนาม: 'FIELD_DATA', ตัวอย่าง: 'EXAMPLE' },
  varietyConfidence: identityConfidenceAliases,
  plantingYearCalendar: { 'พ.ศ.': 'BE', 'ค.ศ.': 'CE' },
  plantingYearConfidence: identityConfidenceAliases,
  treeStatus: {
    ปกติ: 'normal',
    เฝ้าระวัง: 'watch',
    ป่วย: 'sick',
    พักฟื้น: 'recovering',
    ตาย: 'dead',
    'ไม่มีต้น': 'empty',
  },
  gpsConfidence: measurementConfidenceAliases,
  trunkMeasureType: { เส้นรอบวง: 'circumference', เส้นผ่านศูนย์กลาง: 'diameter' },
  trunkMeasureUnit: { 'ซม.': 'cm', เซนติเมตร: 'cm' },
  trunkMeasureConfidence: measurementConfidenceAliases,
  canopyWidthNSUnit: { 'ม.': 'm', เมตร: 'm' },
  canopyWidthEWUnit: { 'ม.': 'm', เมตร: 'm' },
  canopyMeasureConfidence: measurementConfidenceAliases,
  heightUnit: { 'ม.': 'm', เมตร: 'm' },
  heightMeasureConfidence: measurementConfidenceAliases,
}

export function resolveTreeRegisterHeader(label: string): TreeCsvHeader | undefined {
  const normalized = label.trim()
  if (treeRegisterCsvHeaders.includes(normalized as TreeCsvHeader)) {
    return normalized as TreeCsvHeader
  }
  return thaiHeaderToField.get(normalized)
}

type TreeCsvRecord = { [Field in TreeCsvHeader]: string }

function normalizeTreeCsvRecord(record: TreeCsvRecord): TreeCsvRecord {
  return Object.fromEntries(treeRegisterCsvHeaders.map((field) => {
    const value = record[field]
    return [field, thaiSpreadsheetValueAliases[field]?.[value] ?? value]
  })) as TreeCsvRecord
}

function parseCsvRows(csv: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let index = 0; index < csv.length; index += 1) {
    const character = csv[index]
    if (character === '"') {
      if (inQuotes && csv[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (character === ',' && !inQuotes) {
      row.push(field)
      field = ''
    } else if ((character === '\n' || character === '\r') && !inQuotes) {
      if (character === '\r' && csv[index + 1] === '\n') index += 1
      row.push(field)
      if (row.some((cell) => cell.length > 0)) rows.push(row)
      row = []
      field = ''
    } else {
      field += character
    }
  }
  if (inQuotes) throw new Error('CSV มีเครื่องหมายคำพูดที่ไม่ปิด')
  row.push(field)
  if (row.some((cell) => cell.length > 0)) rows.push(row)
  return rows
}

function positiveNumber(value: string): boolean {
  return value !== '' && Number.isFinite(Number(value)) && Number(value) > 0
}

function nonNegativeNumber(value: string): boolean {
  return value !== '' && Number.isFinite(Number(value)) && Number(value) >= 0
}

function validIsoDate(value: string): boolean {
  if (!isoDatePattern.test(value)) return false
  const parsed = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().startsWith(value)
}

function validIsoDateTime(value: string): boolean {
  return /(?:Z|[+-]\d{2}:\d{2})$/u.test(value) && !Number.isNaN(Date.parse(value))
}

function requiredMeasurementText(value: string, label: string): void {
  if (!value.trim()) throw new Error(`${label}ต้องไม่ว่าง`)
}

function validateMeasurementEvidence(
  measuredAt: string,
  measuredBy: string,
  confidence: MeasurementConfidence,
  source: string,
  label: string,
): void {
  if (!validIsoDateTime(measuredAt)) {
    throw new Error(`${label}: วันที่เวลาวัดต้องเป็น ISO 8601 และมีเขตเวลา`)
  }
  requiredMeasurementText(measuredBy, `${label}: ผู้วัด`)
  requiredMeasurementText(source, `${label}: แหล่งข้อมูล`)
  if (!measurementConfidences.includes(confidence)) {
    throw new Error(`${label}: ระดับความมั่นใจไม่ถูกต้อง`)
  }
}

export function validateTreeCycleInput(
  input: Pick<
    TreePositionDraft,
    | 'variety'
    | 'varietyConfidence'
    | 'plantingYear'
    | 'plantingYearCalendar'
    | 'plantingYearConfidence'
    | 'plantSource'
    | 'treeStatus'
    | 'baselineDate'
    | 'baselineMeasurements'
  >,
): void {
  if (!treeStatuses.includes(input.treeStatus)) throw new Error('สถานะต้นไม่ถูกต้อง')
  if (!validIsoDate(input.baselineDate)) {
    throw new Error('วันที่ข้อมูลตั้งต้นต้องเป็นวันที่ที่ถูกต้อง')
  }
  if (input.variety === null) {
    if (input.varietyConfidence !== 'unknown') {
      throw new Error('เมื่อไม่ทราบพันธุ์ ต้องเลือกความมั่นใจเป็น “ไม่ทราบ”')
    }
  } else {
    requiredMeasurementText(input.variety, 'พันธุ์')
    if (!identityConfidences.includes(input.varietyConfidence)) {
      throw new Error('ความมั่นใจของพันธุ์ไม่ถูกต้อง')
    }
  }
  if (input.plantingYear === null) {
    if (input.plantingYearCalendar !== null || input.plantingYearConfidence !== 'unknown') {
      throw new Error('เมื่อไม่ทราบปีปลูก ต้องเว้นระบบปีและเลือกความมั่นใจเป็น “ไม่ทราบ”')
    }
  } else if (
    !Number.isInteger(input.plantingYear) ||
    input.plantingYear <= 0 ||
    !['BE', 'CE'].includes(input.plantingYearCalendar ?? '') ||
    !identityConfidences.includes(input.plantingYearConfidence)
  ) {
    throw new Error('ปีปลูก ระบบปี หรือความมั่นใจของปีปลูกไม่ถูกต้อง')
  }

  const measurements = input.baselineMeasurements
  if (measurements.gps) {
    const value = measurements.gps
    if (!Number.isFinite(value.latitude) || value.latitude < -90 || value.latitude > 90) {
      throw new Error('ละติจูดต้องอยู่ระหว่าง -90 ถึง 90')
    }
    if (!Number.isFinite(value.longitude) || value.longitude < -180 || value.longitude > 180) {
      throw new Error('ลองจิจูดต้องอยู่ระหว่าง -180 ถึง 180')
    }
    if (!Number.isFinite(value.accuracyM) || value.accuracyM < 0) {
      throw new Error('ความแม่นยำ GPS ต้องมากกว่าหรือเท่ากับ 0 เมตร')
    }
    requiredMeasurementText(value.method, 'วิธีวัด GPS')
    validateMeasurementEvidence(value.measuredAt, value.measuredBy, value.confidence, value.source, 'GPS')
  }
  if (measurements.trunk) {
    const value = measurements.trunk
    if (!['circumference', 'diameter'].includes(value.type)) {
      throw new Error('ประเภทการวัดลำต้นไม่ถูกต้อง')
    }
    if (!Number.isFinite(value.value) || value.value <= 0 || value.unit !== 'cm') {
      throw new Error('ค่าลำต้นต้องมากกว่า 0 และใช้หน่วยเซนติเมตร')
    }
    if (!Number.isFinite(value.heightCm) || value.heightCm < 0) {
      throw new Error('ความสูงจุดวัดลำต้นต้องมากกว่าหรือเท่ากับ 0 เซนติเมตร')
    }
    requiredMeasurementText(value.method, 'วิธีวัดลำต้น')
    validateMeasurementEvidence(value.measuredAt, value.measuredBy, value.confidence, value.source, 'ลำต้น')
  }
  if (measurements.canopy) {
    const value = measurements.canopy
    if (
      !Number.isFinite(value.widthNS) || value.widthNS <= 0 ||
      !Number.isFinite(value.widthEW) || value.widthEW <= 0 ||
      value.unit !== 'm'
    ) {
      throw new Error('ทรงพุ่มสองทิศต้องมากกว่า 0 และใช้หน่วยเมตร')
    }
    requiredMeasurementText(value.method, 'วิธีวัดทรงพุ่ม')
    validateMeasurementEvidence(value.measuredAt, value.measuredBy, value.confidence, value.source, 'ทรงพุ่ม')
  }
  if (measurements.height) {
    const value = measurements.height
    if (!Number.isFinite(value.value) || value.value <= 0 || value.unit !== 'm') {
      throw new Error('ความสูงต้นต้องมากกว่า 0 และใช้หน่วยเมตร')
    }
    requiredMeasurementText(value.method, 'วิธีวัดความสูง')
    validateMeasurementEvidence(value.measuredAt, value.measuredBy, value.confidence, value.source, 'ความสูง')
  }

  if (
    input.treeStatus === 'empty' &&
    (input.variety !== null || input.plantingYear !== null || input.plantSource !== null ||
      measurements.gps !== null || measurements.trunk !== null ||
      measurements.canopy !== null || measurements.height !== null)
  ) {
    throw new Error('สถานะ “ไม่มีต้น” ต้องไม่ระบุพันธุ์ ปีปลูก แหล่งพันธุ์ หรือค่าการวัดต้น')
  }
}

function groupComplete(record: TreeCsvRecord, fields: readonly TreeCsvHeader[]): boolean {
  const values = fields.map((field) => record[field])
  return values.every(Boolean) || values.every((value) => value === '')
}

function baselineMeasurementsFromRecord(record: TreeCsvRecord): TreeBaselineMeasurements {
  return {
    gps: record.latitude ? {
      latitude: Number(record.latitude),
      longitude: Number(record.longitude),
      accuracyM: Number(record.gpsAccuracyM),
      method: record.gpsMethod,
      measuredAt: record.gpsMeasuredAt,
      measuredBy: record.gpsMeasuredBy,
      confidence: record.gpsConfidence as MeasurementConfidence,
      source: record.gpsSource,
    } : null,
    trunk: record.trunkMeasureValue ? {
      type: record.trunkMeasureType as TrunkMeasurement['type'],
      value: Number(record.trunkMeasureValue),
      unit: 'cm',
      heightCm: Number(record.trunkMeasureHeightCm),
      method: record.trunkMeasureMethod,
      measuredAt: record.trunkMeasuredAt,
      measuredBy: record.trunkMeasuredBy,
      confidence: record.trunkMeasureConfidence as MeasurementConfidence,
      source: record.trunkMeasureSource,
    } : null,
    canopy: record.canopyWidthNSValue ? {
      widthNS: Number(record.canopyWidthNSValue),
      widthEW: Number(record.canopyWidthEWValue),
      unit: 'm',
      method: record.canopyMeasureMethod,
      measuredAt: record.canopyMeasuredAt,
      measuredBy: record.canopyMeasuredBy,
      confidence: record.canopyMeasureConfidence as MeasurementConfidence,
      source: record.canopyMeasureSource,
    } : null,
    height: record.heightValue ? {
      value: Number(record.heightValue),
      unit: 'm',
      method: record.heightMeasureMethod,
      measuredAt: record.heightMeasuredAt,
      measuredBy: record.heightMeasuredBy,
      confidence: record.heightMeasureConfidence as MeasurementConfidence,
      source: record.heightMeasureSource,
    } : null,
  }
}

function registrationDateInBangkok(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function applyRegistrationDefaults(
  record: TreeCsvRecord,
  organizationCode?: string,
  farmSequence?: string,
): TreeCsvRecord {
  const plantingYear = Number(record.plantingYear)
  const hasTreeData = Boolean(record.variety || record.plantingYear)
  return {
    ...record,
    ...(organizationCode && farmSequence
      ? { recordType: 'FIELD_DATA', organizationCode, farmSequence }
      : {}),
    plantingCycle: record.plantingCycle || '1',
    varietyConfidence: 'unknown',
    plantingYearCalendar: record.plantingYear && Number.isFinite(plantingYear)
      ? (plantingYear >= 2400 ? 'BE' : 'CE')
      : '',
    plantingYearConfidence: 'unknown',
    treeStatus: hasTreeData ? 'normal' : 'empty',
    baselineDate: registrationDateInBangkok(),
  }
}

function candidateFromRecord(
  record: TreeCsvRecord,
  sourceRow: number,
  expectedOrganizationCode: string,
  expectedFarmSequence: string,
): { candidate?: TreeImportCandidate; errors: string[] } {
  const errors: string[] = []
  if (record.recordType !== 'FIELD_DATA') {
    errors.push('ประเภทข้อมูลต้องเป็น “ข้อมูลภาคสนาม”; แถว “ตัวอย่าง” ใช้ตรวจรูปแบบเท่านั้น')
  }
  let treeSequence = 0
  try {
    treeSequence = normalizeTreeSequence(record.treeSequence)
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'ลำดับตำแหน่งไม่ถูกต้อง')
  }
  const plantingCycle = Number(record.plantingCycle)
  let parts: TagParts | undefined
  try {
    parts = record.tagCode.trim()
      ? parseTagCode(record.tagCode, {
        organizationCode: expectedOrganizationCode,
        farmSequence: expectedFarmSequence,
      })
      : {
        organizationCode: expectedOrganizationCode,
        farmSequence: expectedFarmSequence,
        zoneCode: normalizeZoneCode(record.zoneCode),
        rowCode: normalizeRowCode(record.rowCode),
        treeSequence,
      }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'Tag ไม่ถูกต้อง')
  }
  if (record.organizationCode !== expectedOrganizationCode) {
    errors.push(`organizationCode ต้องเป็น ${expectedOrganizationCode} สำหรับสวนปัจจุบัน`)
  }
  if (record.farmSequence !== expectedFarmSequence) {
    errors.push(`farmSequence ต้องเป็น ${expectedFarmSequence} สำหรับสวนปัจจุบัน`)
  }
  if (!Number.isSafeInteger(treeSequence) || treeSequence <= 0) {
    errors.push('treeSequence ต้องเป็นจำนวนเต็มบวก')
  }
  if (!Number.isSafeInteger(plantingCycle) || plantingCycle <= 0) {
    errors.push('plantingCycle ต้องเป็นจำนวนเต็มบวก')
  }
  if (parts) {
    try {
      if (
        parts.organizationCode !== expectedOrganizationCode ||
        parts.farmSequence !== expectedFarmSequence
      ) {
        errors.push('รหัสป้ายต้องอยู่ในองค์กรและสวนปัจจุบัน')
      }
      const fieldTagCode = generateTagCode({
        organizationCode: expectedOrganizationCode,
        farmSequence: expectedFarmSequence,
        zoneCode: record.zoneCode,
        rowCode: record.rowCode,
        treeSequence,
      })
      const tagPositionCode = generateTagCode({
        organizationCode: expectedOrganizationCode,
        farmSequence: expectedFarmSequence,
        zoneCode: parts.zoneCode,
        rowCode: parts.rowCode,
        treeSequence: parts.treeSequence,
      })
      if (fieldTagCode !== tagPositionCode) {
        errors.push('รหัสป้ายไม่ตรงกับโซน แถว และลำดับตำแหน่ง')
      }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : 'ส่วนประกอบ Tag ไม่ถูกต้อง')
    }
  }
  if (!treeStatuses.includes(record.treeStatus as TreeStatus)) {
    errors.push('treeStatus ไม่อยู่ในค่าที่อนุญาต')
  }
  if (!validIsoDate(record.baselineDate)) errors.push('baselineDate ต้องเป็น YYYY-MM-DD ที่ถูกต้อง')

  const varietyConfidence = record.varietyConfidence || 'unknown'
  if (record.variety && !identityConfidences.includes(varietyConfidence as IdentityConfidence)) {
    errors.push('varietyConfidence ต้องมีและใช้ confirmed/estimated/unknown')
  }
  if (!record.variety && record.varietyConfidence && record.varietyConfidence !== 'unknown') {
    errors.push('เมื่อไม่มี variety ให้ใช้ varietyConfidence=unknown หรือเว้นว่าง')
  }
  const plantingYear = record.plantingYear === '' ? null : Number(record.plantingYear)
  if (plantingYear !== null && (!Number.isInteger(plantingYear) || plantingYear <= 0)) {
    errors.push('plantingYear ต้องเป็นจำนวนเต็มบวก')
  }
  if (plantingYear !== null && !['BE', 'CE'].includes(record.plantingYearCalendar)) {
    errors.push('plantingYearCalendar ต้องเป็น BE หรือ CE เมื่อมี plantingYear')
  }
  const plantingYearConfidence = record.plantingYearConfidence || 'unknown'
  if (
    plantingYear !== null &&
    !identityConfidences.includes(plantingYearConfidence as IdentityConfidence)
  ) {
    errors.push('plantingYearConfidence ต้องมีเมื่อมี plantingYear')
  }

  const gpsFields: readonly TreeCsvHeader[] = [
    'latitude', 'longitude', 'gpsAccuracyM', 'gpsMethod', 'gpsMeasuredAt',
    'gpsMeasuredBy', 'gpsConfidence', 'gpsSource',
  ]
  if (!groupComplete(record, gpsFields)) errors.push('ข้อมูล GPS ต้องกรอกครบทั้งกลุ่มหรือเว้นว่างทั้งหมด')
  if (record.latitude && (Number(record.latitude) < -90 || Number(record.latitude) > 90)) {
    errors.push('latitude ต้องอยู่ระหว่าง -90 ถึง 90')
  }
  if (record.longitude && (Number(record.longitude) < -180 || Number(record.longitude) > 180)) {
    errors.push('longitude ต้องอยู่ระหว่าง -180 ถึง 180')
  }
  if (record.gpsAccuracyM && !nonNegativeNumber(record.gpsAccuracyM)) {
    errors.push('gpsAccuracyM ต้องมากกว่าหรือเท่ากับ 0')
  }
  if (
    record.gpsConfidence &&
    !measurementConfidences.includes(record.gpsConfidence as (typeof measurementConfidences)[number])
  ) {
    errors.push('ความมั่นใจ GPS ต้องเป็น วัดจริง / ประมาณ / ไม่ทราบ')
  }

  const trunkFields: readonly TreeCsvHeader[] = [
    'trunkMeasureType', 'trunkMeasureValue', 'trunkMeasureUnit',
    'trunkMeasureHeightCm', 'trunkMeasureMethod', 'trunkMeasuredAt',
    'trunkMeasuredBy', 'trunkMeasureConfidence', 'trunkMeasureSource',
  ]
  if (!groupComplete(record, trunkFields)) errors.push('ข้อมูลลำต้นต้องกรอกครบทั้งกลุ่มหรือเว้นว่างทั้งหมด')
  if (record.trunkMeasureValue && !positiveNumber(record.trunkMeasureValue)) {
    errors.push('trunkMeasureValue ต้องมากกว่า 0')
  }
  if (record.trunkMeasureHeightCm && !nonNegativeNumber(record.trunkMeasureHeightCm)) {
    errors.push('trunkMeasureHeightCm ต้องมากกว่าหรือเท่ากับ 0')
  }
  if (
    record.trunkMeasureConfidence &&
    !measurementConfidences.includes(record.trunkMeasureConfidence as (typeof measurementConfidences)[number])
  ) {
    errors.push('ความมั่นใจการวัดลำต้นต้องเป็น วัดจริง / ประมาณ / ไม่ทราบ')
  }

  const canopyFields: readonly TreeCsvHeader[] = [
    'canopyWidthNSValue', 'canopyWidthNSUnit', 'canopyWidthEWValue',
    'canopyWidthEWUnit', 'canopyMeasureMethod', 'canopyMeasuredAt',
    'canopyMeasuredBy', 'canopyMeasureConfidence', 'canopyMeasureSource',
  ]
  if (!groupComplete(record, canopyFields)) errors.push('ข้อมูลทรงพุ่มต้องกรอกครบทั้งกลุ่มหรือเว้นว่างทั้งหมด')
  if (record.canopyWidthNSValue && !positiveNumber(record.canopyWidthNSValue)) {
    errors.push('canopyWidthNSValue ต้องมากกว่า 0')
  }
  if (record.canopyWidthEWValue && !positiveNumber(record.canopyWidthEWValue)) {
    errors.push('canopyWidthEWValue ต้องมากกว่า 0')
  }
  if (record.canopyWidthNSUnit && record.canopyWidthNSUnit !== record.canopyWidthEWUnit) {
    errors.push('หน่วยทรงพุ่ม NS และ EW ต้องตรงกัน')
  }
  if (
    record.canopyMeasureConfidence &&
    !measurementConfidences.includes(record.canopyMeasureConfidence as (typeof measurementConfidences)[number])
  ) {
    errors.push('ความมั่นใจการวัดทรงพุ่มต้องเป็น วัดจริง / ประมาณ / ไม่ทราบ')
  }

  const heightFields: readonly TreeCsvHeader[] = [
    'heightValue', 'heightUnit', 'heightMeasureMethod', 'heightMeasuredAt',
    'heightMeasuredBy', 'heightMeasureConfidence', 'heightMeasureSource',
  ]
  if (!groupComplete(record, heightFields)) errors.push('ข้อมูลความสูงต้องกรอกครบทั้งกลุ่มหรือเว้นว่างทั้งหมด')
  if (record.heightValue && !positiveNumber(record.heightValue)) {
    errors.push('heightValue ต้องมากกว่า 0')
  }
  if (
    record.heightMeasureConfidence &&
    !measurementConfidences.includes(record.heightMeasureConfidence as (typeof measurementConfidences)[number])
  ) {
    errors.push('ความมั่นใจการวัดความสูงต้องเป็น วัดจริง / ประมาณ / ไม่ทราบ')
  }

  const baselineMeasurements = baselineMeasurementsFromRecord(record)
  try {
    validateTreeCycleInput({
      variety: record.variety || null,
      varietyConfidence: varietyConfidence as IdentityConfidence,
      plantingYear,
      plantingYearCalendar: plantingYear === null
        ? null
        : (record.plantingYearCalendar as 'BE' | 'CE'),
      plantingYearConfidence: plantingYearConfidence as IdentityConfidence,
      plantSource: null,
      treeStatus: record.treeStatus as TreeStatus,
      baselineDate: record.baselineDate,
      baselineMeasurements,
    })
  } catch (error) {
    errors.push(error instanceof Error ? error.message : 'ข้อมูลต้นหรือข้อมูลสำรวจไม่ถูกต้อง')
  }

  if (errors.length > 0 || !parts) return { errors }
  const canonicalTagCode = generateTagCode({
    organizationCode: expectedOrganizationCode,
    farmSequence: expectedFarmSequence,
    zoneCode: parts.zoneCode,
    rowCode: parts.rowCode,
    treeSequence,
  })
  return {
    errors,
    candidate: {
      sourceRow,
      ...parts,
      rowCountingDirection: 'TBD',
      plantingCycle,
      tagCode: canonicalTagCode,
      variety: record.variety || null,
      varietyConfidence: varietyConfidence as IdentityConfidence,
      plantingYear,
      plantingYearCalendar: plantingYear === null
        ? null
        : (record.plantingYearCalendar as 'BE' | 'CE'),
      plantingYearConfidence: plantingYearConfidence as IdentityConfidence,
      plantSource: null,
      treeStatus: record.treeStatus as TreeStatus,
      baselineDate: record.baselineDate,
      baselineMeasurements,
      notes: record.notes,
      raw: Object.freeze({ ...record }),
    },
  }
}

function stableHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function previewTreeRegisterCsv(
  csv: string,
  expectedOrganizationCode: string,
  expectedFarmSequence: string,
): TreeImportPreview {
  let rows: string[][]
  try {
    rows = parseCsvRows(csv.replace(/^\uFEFF/u, ''))
  } catch (error) {
    return {
      headerValid: false,
      totalRows: 0,
      candidates: [],
      rejects: [{
        sourceRow: 1,
        tagCode: '',
        errors: [error instanceof Error ? error.message : 'อ่าน CSV ไม่สำเร็จ'],
      }],
      idempotencyKey: `import_${stableHash(csv)}`,
    }
  }
  if (rows.length === 0) {
    return {
      headerValid: false,
      totalRows: 0,
      candidates: [],
      rejects: [{ sourceRow: 1, tagCode: '', errors: ['CSV ไม่มี header'] }],
      idempotencyKey: `import_${stableHash(csv)}`,
    }
  }
  const headerRow = rows[0]
  if (!headerRow) throw new Error('CSV ไม่มี header')
  const header = headerRow.map((value) => value.trim())
  const englishHeaderValid =
    header.length === treeRegisterCsvHeaders.length &&
    header.every((value, index) => value === treeRegisterCsvHeaders[index])
  const thaiHeaderValid =
    header.length === treeRegisterThaiCsvHeaders.length &&
    header.every((value, index) => value === treeRegisterThaiCsvHeaders[index])
  const thaiRegistrationHeaderValid =
    header.length === treeRegisterThaiRegistrationCsvHeaders.length &&
    header.every((value, index) => value === treeRegisterThaiRegistrationCsvHeaders[index])
  const legacyThaiRegistrationHeaderValid =
    header.length === treeRegisterLegacyThaiRegistrationCsvHeaders.length &&
    header.every((value, index) => value === treeRegisterLegacyThaiRegistrationCsvHeaders[index])
  const headerValid = englishHeaderValid || thaiHeaderValid || thaiRegistrationHeaderValid || legacyThaiRegistrationHeaderValid
  if (!headerValid) {
    return {
      headerValid: false,
      totalRows: Math.max(0, rows.length - 1),
      candidates: [],
      rejects: [{
        sourceRow: 1,
        tagCode: '',
        errors: [`หัวคอลัมน์ต้องตรงกับแม่แบบภาษาไทย ${treeRegisterRegistrationCsvHeaders.length} คอลัมน์; ไฟล์ 49 คอลัมน์และรุ่นเดิมยังรองรับ`],
      }],
      idempotencyKey: `import_${stableHash(csv)}`,
    }
  }

  const candidates: TreeImportCandidate[] = []
  const rejects: TreeImportReject[] = []
  const seenTags = new Map<string, number>()
  const seenPositions = new Map<string, number>()
  const tagColumnIndex = thaiRegistrationHeaderValid
    ? treeRegisterRegistrationCsvHeaders.indexOf('tagCode')
    : treeRegisterCsvHeaders.indexOf('tagCode')
  rows.slice(1).forEach((cells, index) => {
    const sourceRow = index + 2
    if (index >= treeRegisterImportLimit) {
      rejects.push({
        sourceRow,
        tagCode: cells[tagColumnIndex] ?? '',
        errors: [`นำเข้าได้ไม่เกิน ${treeRegisterImportLimit} ตำแหน่งต่อไฟล์`],
      })
      return
    }
    const paddedCells = (thaiRegistrationHeaderValid || legacyThaiRegistrationHeaderValid) && cells.length < header.length
      ? [...cells, ...Array.from({ length: header.length - cells.length }, () => '')]
      : cells
    if (paddedCells.length !== header.length) {
      rejects.push({
        sourceRow,
        tagCode: paddedCells[tagColumnIndex] ?? '',
        errors: [`จำนวนคอลัมน์เป็น ${cells.length}; ต้องเป็น ${header.length}`],
      })
      return
    }
    const rowHeaders = thaiRegistrationHeaderValid
      ? treeRegisterRegistrationCsvHeaders
      : legacyThaiRegistrationHeaderValid
        ? [
          'recordType',
          'organizationCode',
          'farmSequence',
          ...treeRegisterRegistrationCsvHeaders,
        ] as const
        : treeRegisterCsvHeaders
    const baseRecord = Object.fromEntries(
      treeRegisterCsvHeaders.map((field) => [field, '']),
    ) as TreeCsvRecord
    rowHeaders.forEach((field, fieldIndex) => {
      baseRecord[field] = (paddedCells[fieldIndex] ?? '').trim()
    })
    const normalizedRecord = normalizeTreeCsvRecord(baseRecord)
    const record = thaiRegistrationHeaderValid
      ? applyRegistrationDefaults(normalizedRecord, expectedOrganizationCode, expectedFarmSequence)
      : legacyThaiRegistrationHeaderValid
        ? applyRegistrationDefaults(normalizedRecord)
        : normalizedRecord
    const validation = candidateFromRecord(
      record,
      sourceRow,
      expectedOrganizationCode,
      expectedFarmSequence,
    )
    if (!validation.candidate) {
      rejects.push({ sourceRow, tagCode: record.tagCode, errors: validation.errors })
      return
    }
    const previousRow = seenTags.get(validation.candidate.tagCode)
    if (previousRow !== undefined) {
      rejects.push({
        sourceRow,
        tagCode: validation.candidate.tagCode,
        errors: [`Tag ซ้ำกับแถว ${previousRow} ภายในไฟล์เดียวกัน`],
      })
      return
    }
    const positionKey = `${normalizeZoneCode(validation.candidate.zoneCode)}:${normalizeRowCode(validation.candidate.rowCode)}:${validation.candidate.treeSequence}`
    const previousPositionRow = seenPositions.get(positionKey)
    if (previousPositionRow !== undefined) {
      rejects.push({
        sourceRow,
        tagCode: validation.candidate.tagCode,
        errors: [`โซน แถว และลำดับตำแหน่งซ้ำกับแถว ${previousPositionRow}`],
      })
      return
    }
    seenTags.set(validation.candidate.tagCode, sourceRow)
    seenPositions.set(positionKey, sourceRow)
    candidates.push(validation.candidate)
  })

  return {
    headerValid,
    totalRows: rows.length - 1,
    candidates,
    rejects,
    idempotencyKey: `import_${stableHash(`${expectedOrganizationCode}|${expectedFarmSequence}|${csv.replace(/\r\n/gu, '\n').trim()}`)}`,
  }
}
