import type {
  AuthenticatedIdentity,
  CanonicalRole,
  FarmAccess,
} from './farm'

export const annualCycleStatuses = [
  'DRAFT',
  'PLANNED',
  'ACTIVE',
  'CLOSING',
  'CLOSED',
] as const

export const annualPlanScopes = ['FARM', 'ZONE', 'TREE_SET'] as const
export const annualPlanStatuses = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const
export const annualPlanTriggers = ['DATE_WINDOW', 'CROP_STAGE', 'CONDITION'] as const
export const annualPlanCategories = [
  'GENERAL',
  'CARE',
  'DISEASE_MONITORING',
  'FRUIT',
  'HARVEST',
  'INVENTORY',
  'SALES',
  'CUSTOM',
] as const

export type AnnualCycleStatus = (typeof annualCycleStatuses)[number]
export type AnnualPlanScope = (typeof annualPlanScopes)[number]
export type AnnualPlanStatus = (typeof annualPlanStatuses)[number]
export type AnnualPlanTrigger = (typeof annualPlanTriggers)[number]
export type AnnualPlanCategory = (typeof annualPlanCategories)[number]

export const annualCycleStatusLabels: Record<AnnualCycleStatus, string> = {
  DRAFT: 'ร่าง',
  PLANNED: 'วางแผนแล้ว',
  ACTIVE: 'กำลังดำเนินการ',
  CLOSING: 'กำลังปิดรอบ',
  CLOSED: 'ปิดรอบแล้ว',
}

export const annualPlanScopeLabels: Record<AnnualPlanScope, string> = {
  FARM: 'ทั้งสวน',
  ZONE: 'โซน',
  TREE_SET: 'ชุดต้นเฉพาะกรณี',
}

export const annualPlanStatusLabels: Record<AnnualPlanStatus, string> = {
  PLANNED: 'วางแผน',
  IN_PROGRESS: 'กำลังดำเนินการ',
  COMPLETED: 'เสร็จแล้ว',
  CANCELLED: 'ยกเลิกพร้อมเหตุผล',
}

export const annualPlanCategoryLabels: Record<AnnualPlanCategory, string> = {
  GENERAL: 'งานทั่วไป',
  CARE: 'งานดูแล',
  DISEASE_MONITORING: 'ติดตามโรค',
  FRUIT: 'ดอกและผล',
  HARVEST: 'เก็บเกี่ยว',
  INVENTORY: 'วัสดุ',
  SALES: 'การขาย',
  CUSTOM: 'กำหนดเอง',
}

export interface AnnualCycleMutationContext {
  actor: AuthenticatedIdentity
  farm: FarmAccess
}

export interface AnnualCycleDraft {
  cycleCode: string
  name: string
  periodStart: string
  timezone: string
  notes: string
  previousAnnualCycleId: string | null
}

export interface AnnualCycleRecord extends AnnualCycleDraft {
  organizationId: string
  farmId: string
  annualCycleId: string
  periodEndExclusive: string
  status: AnnualCycleStatus
  revision: number
  supersedesRevisionId: string | null
  lastCorrectionId: string | null
  version: number
  createdBy: string
  updatedBy: string
  createdAtLabel: string
  updatedAtLabel: string
  exampleData: true
}

export interface AnnualPlanTarget {
  scope: AnnualPlanScope
  zoneCodes: readonly string[]
  positionIds: readonly string[]
}

export interface AnnualPlanItemDraft {
  title: string
  category: AnnualPlanCategory
  target: AnnualPlanTarget
  triggerType: AnnualPlanTrigger
  plannedStart: string
  plannedEndExclusive: string
  cropStage: string | null
  conditionNote: string
  responsibleRole: CanonicalRole
  plannedQuantity: number | null
  plannedUnit: string
  notes: string
}

export interface AnnualPlanItemRecord extends AnnualPlanItemDraft {
  organizationId: string
  farmId: string
  annualCycleId: string
  planItemId: string
  status: AnnualPlanStatus
  copiedFromPlanItemId: string | null
  linkedWorkOrderIds: readonly string[]
  version: number
  createdBy: string
  updatedBy: string
  createdAtLabel: string
  updatedAtLabel: string
  exampleData: true
}

export interface AnnualCycleRevisionSnapshot {
  cycleCode: string
  name: string
  periodStart: string
  periodEndExclusive: string
  timezone: string
  notes: string
  status: AnnualCycleStatus
  revision: number
}

export interface AnnualCycleCorrection {
  organizationId: string
  farmId: string
  annualCycleId: string
  correctionId: string
  auditEventId: string
  reason: string
  before: AnnualCycleRevisionSnapshot
  after: AnnualCycleRevisionSnapshot
  beforeSummary: string
  afterSummary: string
  beforeRevision: number
  afterRevision: number
  actorUserId: string
  actorDisplayName: string
  createdAtLabel: string
  idempotencyKey: string
  exampleData: true
}

export type AnnualCycleAuditEventType =
  | 'CYCLE_CREATED'
  | 'CYCLE_UPDATED'
  | 'CYCLE_STATUS_CHANGED'
  | 'CYCLE_CORRECTED'
  | 'PLAN_CREATED'
  | 'PLAN_UPDATED'

export interface AnnualCycleAuditEvent {
  organizationId: string
  farmId: string
  annualCycleId: string
  eventId: string
  eventType: AnnualCycleAuditEventType
  targetId: string
  actorUserId: string
  actorDisplayName: string
  reason: string
  beforeSummary: string
  afterSummary: string
  recordVersion: number
  createdAtLabel: string
  exampleData: true
}

export interface AnnualCycleSnapshot {
  cycles: readonly AnnualCycleRecord[]
  selectedCycle: AnnualCycleRecord | null
  planItems: readonly AnnualPlanItemRecord[]
  corrections: readonly AnnualCycleCorrection[]
  audit: readonly AnnualCycleAuditEvent[]
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u
const cycleCodePattern = /^[A-Z0-9]+(?:-[A-Z0-9]+)*$/u
const zoneCodePattern = /^Z\d{2,}$/u
const positionIdPattern = /^pos_[A-Za-z0-9_-]{12,}$/u

function requiredText(value: string, label: string, maximumLength = 300): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`ต้องระบุ${label}`)
  if (normalized.length > maximumLength) throw new Error(`${label}ต้องไม่เกิน ${maximumLength} ตัวอักษร`)
  return normalized
}

function optionalText(value: string, label: string, maximumLength = 500): string {
  const normalized = value.trim()
  if (normalized.length > maximumLength) throw new Error(`${label}ต้องไม่เกิน ${maximumLength} ตัวอักษร`)
  return normalized
}

function parseIsoDate(value: string, label: string): Date {
  if (!isoDatePattern.test(value)) throw new Error(`${label}ต้องเป็น YYYY-MM-DD`)
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(5, 7))
  const day = Number(value.slice(8, 10))
  const parsed = new Date(Date.UTC(year, month - 1, day))
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`${label}ไม่ใช่วันที่ปฏิทินที่ถูกต้อง`)
  }
  return parsed
}

function formatIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

export function calculatePeriodEndExclusive(periodStart: string): string {
  const start = parseIsoDate(periodStart, 'วันเริ่มรอบ')
  const year = start.getUTCFullYear() + 1
  const month = start.getUTCMonth()
  const day = start.getUTCDate()
  const candidate = new Date(Date.UTC(year, month, day))
  if (candidate.getUTCMonth() !== month) {
    // 29 Feb has no anniversary in a non-leap year. 1 Mar exclusive keeps
    // 28 Feb inside the one-year management period.
    return formatIsoDate(candidate)
  }
  return formatIsoDate(candidate)
}

export function inclusivePeriodEnd(periodEndExclusive: string): string {
  const end = parseIsoDate(periodEndExclusive, 'วันสิ้นสุดรอบ')
  end.setUTCDate(end.getUTCDate() - 1)
  return formatIsoDate(end)
}

export function periodsOverlap(
  leftStart: string,
  leftEndExclusive: string,
  rightStart: string,
  rightEndExclusive: string,
): boolean {
  return leftStart < rightEndExclusive && rightStart < leftEndExclusive
}

export function validateAnnualCycleDraft(draft: AnnualCycleDraft): AnnualCycleDraft {
  const cycleCode = requiredText(draft.cycleCode, 'รหัสรอบ', 40).toUpperCase()
  if (!cycleCodePattern.test(cycleCode)) throw new Error('รหัสรอบใช้ A-Z, 0-9 และ hyphen เท่านั้น')
  parseIsoDate(draft.periodStart, 'วันเริ่มรอบ')
  try {
    new Intl.DateTimeFormat('th-TH', { timeZone: draft.timezone }).format()
  } catch {
    throw new Error('Timezone ของรอบไม่ถูกต้อง')
  }
  return {
    cycleCode,
    name: requiredText(draft.name, 'ชื่อรอบ', 100),
    periodStart: draft.periodStart,
    timezone: draft.timezone,
    notes: optionalText(draft.notes, 'หมายเหตุ'),
    previousAnnualCycleId: draft.previousAnnualCycleId
      ? requiredText(draft.previousAnnualCycleId, 'รอบก่อนหน้า', 120)
      : null,
  }
}

export function assertAnnualCycleAvailability(
  draft: AnnualCycleDraft,
  cycles: readonly AnnualCycleRecord[],
  excludeAnnualCycleId?: string,
): void {
  const normalized = validateAnnualCycleDraft(draft)
  const endExclusive = calculatePeriodEndExclusive(normalized.periodStart)
  for (const cycle of cycles) {
    if (cycle.annualCycleId === excludeAnnualCycleId) continue
    if (cycle.cycleCode.toUpperCase() === normalized.cycleCode) {
      throw new Error('รหัสรอบปีซ้ำในสวนนี้')
    }
    if (periodsOverlap(normalized.periodStart, endExclusive, cycle.periodStart, cycle.periodEndExclusive)) {
      throw new Error(`ช่วงรอบปีทับกับ ${cycle.cycleCode}`)
    }
  }
}

export function assertAnnualCycleScope(
  context: AnnualCycleMutationContext,
  record: { organizationId: string; farmId: string },
): void {
  if (
    context.farm.organizationId !== record.organizationId ||
    context.farm.farmId !== record.farmId
  ) {
    throw new Error('Critical: ปฏิเสธ Annual Cycle ข้ามสวน')
  }
}

export function canReadAnnualCycle(role: CanonicalRole): boolean {
  return [
    'ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'WORKER',
    'SALES_INVENTORY', 'VIEWER', 'AUDITOR',
  ].includes(role)
}

export function canManageAnnualCycle(context: AnnualCycleMutationContext): boolean {
  return context.farm.farmStatus === 'ACTIVE' && context.farm.isOrganizationOwner
}

export function canManageAnnualPlan(context: AnnualCycleMutationContext): boolean {
  return context.farm.farmStatus === 'ACTIVE' && (
    context.farm.isOrganizationOwner || context.farm.role === 'FARM_MANAGER'
  )
}

export function assertAnnualCycleTransition(
  current: AnnualCycleStatus,
  next: AnnualCycleStatus,
  cycles: readonly AnnualCycleRecord[],
  annualCycleId: string,
): void {
  const allowed: Record<AnnualCycleStatus, readonly AnnualCycleStatus[]> = {
    DRAFT: ['PLANNED'],
    PLANNED: ['DRAFT', 'ACTIVE'],
    ACTIVE: ['CLOSING'],
    CLOSING: ['ACTIVE', 'CLOSED'],
    CLOSED: [],
  }
  if (!allowed[current].includes(next)) {
    throw new Error(`ไม่รองรับการเปลี่ยนสถานะรอบจาก ${current} เป็น ${next}`)
  }
  if (next === 'ACTIVE' && cycles.some((cycle) =>
    cycle.annualCycleId !== annualCycleId && (cycle.status === 'ACTIVE' || cycle.status === 'CLOSING'),
  )) {
    throw new Error('สวนนี้มีรอบที่กำลังดำเนินการหรือกำลังปิดอยู่แล้ว')
  }
}

export function validateAnnualPlanItem(
  draft: AnnualPlanItemDraft,
  cycle: AnnualCycleRecord,
): AnnualPlanItemDraft {
  if (!annualPlanCategories.includes(draft.category)) throw new Error('ประเภทแผนไม่ถูกต้อง')
  if (!annualPlanScopes.includes(draft.target.scope)) throw new Error('ขอบเขตแผนไม่ถูกต้อง')
  if (!annualPlanTriggers.includes(draft.triggerType)) throw new Error('Trigger ของแผนไม่ถูกต้อง')
  parseIsoDate(draft.plannedStart, 'วันเริ่มแผน')
  parseIsoDate(draft.plannedEndExclusive, 'วันสิ้นสุดแผน')
  if (draft.plannedStart >= draft.plannedEndExclusive) throw new Error('ช่วงแผนต้องมีวันสิ้นสุดหลังวันเริ่ม')
  if (draft.plannedStart < cycle.periodStart || draft.plannedEndExclusive > cycle.periodEndExclusive) {
    throw new Error('ช่วงแผนต้องอยู่ภายในรอบปี')
  }

  const zoneCodes = [...new Set(draft.target.zoneCodes.map((value) => value.trim().toUpperCase()))]
  const positionIds = [...new Set(draft.target.positionIds.map((value) => value.trim()))]
  if (zoneCodes.some((value) => !zoneCodePattern.test(value))) throw new Error('Zone code ของแผนไม่ถูกต้อง')
  if (positionIds.some((value) => !positionIdPattern.test(value))) throw new Error('Tree Set ต้องใช้ opaque Position ID')
  if (draft.target.scope === 'FARM' && (zoneCodes.length > 0 || positionIds.length > 0)) {
    throw new Error('แผนระดับสวนต้องไม่ระบุ Zone หรือ Position')
  }
  if (draft.target.scope === 'ZONE' && (zoneCodes.length === 0 || positionIds.length > 0)) {
    throw new Error('แผนระดับ Zone ต้องมี Zone และไม่มี Position รายต้น')
  }
  if (draft.target.scope === 'TREE_SET' && positionIds.length === 0) {
    throw new Error('แผนรายต้นเฉพาะกรณีต้องมี Position อย่างน้อยหนึ่งรายการ')
  }
  if (draft.triggerType === 'CROP_STAGE' && !draft.cropStage?.trim()) {
    throw new Error('แผนที่ใช้ Crop Stage ต้องระบุ Stage')
  }
  if (draft.triggerType === 'CONDITION' && !draft.conditionNote.trim()) {
    throw new Error('แผนตามเงื่อนไขต้องระบุเงื่อนไข')
  }
  if (draft.plannedQuantity !== null && (!Number.isFinite(draft.plannedQuantity) || draft.plannedQuantity < 0)) {
    throw new Error('จำนวนที่วางแผนต้องเป็นเลขตั้งแต่ 0 ขึ้นไป')
  }
  if (draft.plannedQuantity !== null && !draft.plannedUnit.trim()) throw new Error('จำนวนที่วางแผนต้องมีหน่วย')
  return {
    ...draft,
    title: requiredText(draft.title, 'ชื่อแผน', 120),
    target: { scope: draft.target.scope, zoneCodes, positionIds },
    cropStage: draft.cropStage?.trim() || null,
    conditionNote: optionalText(draft.conditionNote, 'เงื่อนไข'),
    plannedUnit: draft.plannedUnit.trim(),
    notes: optionalText(draft.notes, 'หมายเหตุ'),
  }
}

export function annualCycleSummary(cycle: AnnualCycleRecord): string {
  return [
    cycle.cycleCode,
    cycle.name,
    cycle.periodStart,
    cycle.periodEndExclusive,
    cycle.status,
    `revision:${cycle.revision}`,
  ].join('|')
}

export function annualCycleRevisionSnapshot(
  cycle: AnnualCycleRecord,
): AnnualCycleRevisionSnapshot {
  return {
    cycleCode: cycle.cycleCode,
    name: cycle.name,
    periodStart: cycle.periodStart,
    periodEndExclusive: cycle.periodEndExclusive,
    timezone: cycle.timezone,
    notes: cycle.notes,
    status: cycle.status,
    revision: cycle.revision,
  }
}

export function createAnnualRecordId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`
}
