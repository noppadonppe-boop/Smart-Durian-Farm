import type { AuthenticatedIdentity, FarmAccess } from './farm'

export const treeStatuses = [
  'normal',
  'watch',
  'sick',
  'recovering',
  'dead',
  'empty',
] as const
export const positionStatuses = ['ACTIVE', 'ARCHIVED'] as const
export const identityConfidences = ['confirmed', 'estimated', 'unknown'] as const

export type TreeStatus = (typeof treeStatuses)[number]
export type PositionStatus = (typeof positionStatuses)[number]
export type IdentityConfidence = (typeof identityConfidences)[number]

export const treeStatusLabels: Record<TreeStatus, string> = {
  normal: 'ปกติ',
  watch: 'เฝ้าระวัง',
  sick: 'ป่วย',
  recovering: 'พักฟื้น',
  dead: 'ตาย',
  empty: 'ไม่มีต้น',
}

export const identityConfidenceLabels: Record<IdentityConfidence, string> = {
  confirmed: 'ยืนยันแล้ว',
  estimated: 'ประมาณ',
  unknown: 'ไม่ทราบ',
}

export interface TagParts {
  organizationCode: string
  farmSequence: string
  zoneCode: string
  rowCode: string
  treeSequence: number
}

export interface PlantingCycleRecord {
  cycleId: string
  cycleNumber: number
  variety: string | null
  varietyConfidence: IdentityConfidence
  plantingYear: number | null
  plantingYearCalendar: 'BE' | 'CE' | null
  plantingYearConfidence: IdentityConfidence
  treeStatus: TreeStatus
  baselineDate: string
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

export interface TreePositionDraft extends TagParts {
  variety: string | null
  varietyConfidence: IdentityConfidence
  plantingYear: number | null
  plantingYearCalendar: 'BE' | 'CE' | null
  plantingYearConfidence: IdentityConfidence
  treeStatus: TreeStatus
  baselineDate: string
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
  treeStatus: TreeStatus
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
const zoneCodePattern = /^Z\d{2,}$/u
const rowCodePattern = /^R\d{2,}$/u
const tagPattern = /^([A-Z0-9]{2,10})-(F\d{2,})-(Z\d{2,})-(R\d{2,})-T(\d{3,})$/u
const opaquePositionIdPattern = /^pos_[A-Za-z0-9_-]{12,}$/u
const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u

export function normalizeTagCode(value: string): string {
  return value.trim().toUpperCase()
}

export function generateTagCode(parts: TagParts): string {
  const organizationCode = parts.organizationCode.trim().toUpperCase()
  const farmSequence = parts.farmSequence.trim().toUpperCase()
  const zoneCode = parts.zoneCode.trim().toUpperCase()
  const rowCode = parts.rowCode.trim().toUpperCase()
  if (!organizationCodePattern.test(organizationCode)) {
    throw new Error('Organization Code ต้องเป็น A–Z/0–9 จำนวน 2–10 ตัว')
  }
  if (!farmSequencePattern.test(farmSequence)) {
    throw new Error('Farm Sequence ต้องเป็น F ตามด้วยเลขอย่างน้อย 2 หลัก')
  }
  if (!zoneCodePattern.test(zoneCode)) {
    throw new Error('Zone Code ต้องเป็น Z ตามด้วยเลขอย่างน้อย 2 หลัก')
  }
  if (!rowCodePattern.test(rowCode)) {
    throw new Error('Row Code ต้องเป็น R ตามด้วยเลขอย่างน้อย 2 หลัก')
  }
  if (!Number.isInteger(parts.treeSequence) || parts.treeSequence <= 0) {
    throw new Error('ลำดับตำแหน่งต้องเป็นจำนวนเต็มบวก')
  }
  return `${organizationCode}-${farmSequence}-${zoneCode}-${rowCode}-T${String(parts.treeSequence).padStart(3, '0')}`
}

export function parseTagCode(value: string): TagParts {
  const normalized = normalizeTagCode(value)
  const match = tagPattern.exec(normalized)
  if (!match) {
    throw new Error('รูปแบบ Tag ต้องเป็น ORG-F01-Z01-R01-T001 และใช้ตัวพิมพ์ใหญ่')
  }
  const treeSequence = Number(match[5])
  const organizationCode = match[1]
  const farmSequence = match[2]
  const zoneCode = match[3]
  const rowCode = match[4]
  if (!organizationCode || !farmSequence || !zoneCode || !rowCode) {
    throw new Error('ส่วนประกอบ Tag ไม่ครบถ้วน')
  }
  if (!Number.isSafeInteger(treeSequence) || treeSequence <= 0) {
    throw new Error('ลำดับตำแหน่งใน Tag ต้องมากกว่า 0')
  }
  return {
    organizationCode,
    farmSequence,
    zoneCode,
    rowCode,
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

type TreeCsvHeader = (typeof treeRegisterCsvHeaders)[number]
type TreeCsvRecord = { [Field in TreeCsvHeader]: string }

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

function groupComplete(record: TreeCsvRecord, fields: readonly TreeCsvHeader[]): boolean {
  const values = fields.map((field) => record[field])
  return values.every(Boolean) || values.every((value) => value === '')
}

function candidateFromRecord(
  record: TreeCsvRecord,
  sourceRow: number,
  expectedOrganizationCode: string,
  expectedFarmSequence: string,
): { candidate?: TreeImportCandidate; errors: string[] } {
  const errors: string[] = []
  if (record.recordType !== 'FIELD_DATA') {
    errors.push('recordType ต้องเป็น FIELD_DATA; แถว EXAMPLE ใช้ตรวจรูปแบบเท่านั้น')
  }
  const treeSequence = Number(record.treeSequence)
  const plantingCycle = Number(record.plantingCycle)
  let parts: TagParts | undefined
  try {
    parts = parseTagCode(record.tagCode)
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
        generateTagCode({
          organizationCode: record.organizationCode,
          farmSequence: record.farmSequence,
          zoneCode: record.zoneCode,
          rowCode: record.rowCode,
          treeSequence,
        }) !== normalizeTagCode(record.tagCode)
      ) {
        errors.push('tagCode ไม่ตรงกับ Organization/Farm/Zone/Row/Tree columns')
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

  const heightFields: readonly TreeCsvHeader[] = [
    'heightValue', 'heightUnit', 'heightMeasureMethod', 'heightMeasuredAt',
    'heightMeasuredBy', 'heightMeasureConfidence', 'heightMeasureSource',
  ]
  if (!groupComplete(record, heightFields)) errors.push('ข้อมูลความสูงต้องกรอกครบทั้งกลุ่มหรือเว้นว่างทั้งหมด')
  if (record.heightValue && !positiveNumber(record.heightValue)) {
    errors.push('heightValue ต้องมากกว่า 0')
  }

  if (errors.length > 0 || !parts) return { errors }
  return {
    errors,
    candidate: {
      sourceRow,
      ...parts,
      plantingCycle,
      tagCode: normalizeTagCode(record.tagCode),
      variety: record.variety || null,
      varietyConfidence: varietyConfidence as IdentityConfidence,
      plantingYear,
      plantingYearCalendar: plantingYear === null
        ? null
        : (record.plantingYearCalendar as 'BE' | 'CE'),
      plantingYearConfidence: plantingYearConfidence as IdentityConfidence,
      treeStatus: record.treeStatus as TreeStatus,
      baselineDate: record.baselineDate,
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
  const headerValid =
    header.length === treeRegisterCsvHeaders.length &&
    header.every((value, index) => value === treeRegisterCsvHeaders[index])
  if (!headerValid) {
    return {
      headerValid: false,
      totalRows: Math.max(0, rows.length - 1),
      candidates: [],
      rejects: [{
        sourceRow: 1,
        tagCode: '',
        errors: [`CSV header ต้องตรงกับ Data Dictionary ทั้ง ${treeRegisterCsvHeaders.length} columns`],
      }],
      idempotencyKey: `import_${stableHash(csv)}`,
    }
  }

  const candidates: TreeImportCandidate[] = []
  const rejects: TreeImportReject[] = []
  const seenTags = new Map<string, number>()
  rows.slice(1).forEach((cells, index) => {
    const sourceRow = index + 2
    if (cells.length !== header.length) {
      rejects.push({
        sourceRow,
        tagCode: cells[6] ?? '',
        errors: [`จำนวน columns เป็น ${cells.length}; ต้องเป็น ${header.length}`],
      })
      return
    }
    const record = Object.fromEntries(
      header.map((field, fieldIndex) => [field, (cells[fieldIndex] ?? '').trim()]),
    ) as TreeCsvRecord
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
    seenTags.set(validation.candidate.tagCode, sourceRow)
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
