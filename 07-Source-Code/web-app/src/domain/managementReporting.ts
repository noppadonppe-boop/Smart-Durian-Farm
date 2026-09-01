import type { AnnualCycleRecord, AnnualPlanItemRecord } from './annualFarmCycle'
import type { CommercialSnapshot } from './commercialTraceability'
import { canAccessFinancialData, type AuthenticatedIdentity, type FarmAccess } from './farm'
import type { DiseaseIncidentRecord, WorkOrderRecord } from './workCareDisease'

export const reportPeriodKinds = ['WEEKLY', 'MONTHLY', 'THREE_MONTH', 'ANNUAL'] as const
export const laborCostBases = ['HOUR', 'DAY', 'PIECE', 'LUMP_SUM'] as const
export const laborReferenceTypes = ['FARM_OPERATION', 'WORK_ORDER', 'HARVEST_LOT'] as const
export const expenseCategories = [
  'FERTILIZER_SOIL',
  'CROP_PROTECTION',
  'GROWTH_REGULATOR',
  'PLANTING_MATERIAL',
  'WATER_ELECTRICITY',
  'FUEL_MACHINERY',
  'REPAIR_MAINTENANCE',
  'EXTERNAL_SERVICE',
  'HARVEST_POSTHARVEST',
  'TRANSPORT',
  'SALES_FEE',
  'FARM_OVERHEAD',
  'OTHER_OPERATING',
  'CAPITAL_ASSET',
] as const
export const expenseAllocationScopes = [
  'FARM',
  'ZONE',
  'WORK_ORDER',
  'CROP_CYCLE',
  'HARVEST_LOT',
] as const

export type ReportPeriodKind = (typeof reportPeriodKinds)[number]
export type LaborCostBasis = (typeof laborCostBases)[number]
export type LaborReferenceType = (typeof laborReferenceTypes)[number]
export type ExpenseCategory = (typeof expenseCategories)[number]
export type ExpenseAllocationScope = (typeof expenseAllocationScopes)[number]

export const reportPeriodKindLabels: Record<ReportPeriodKind, string> = {
  WEEKLY: 'รายสัปดาห์',
  MONTHLY: 'รายเดือน',
  THREE_MONTH: 'ราย 3 เดือน',
  ANNUAL: 'รายปี',
}

export const laborCostBasisLabels: Record<LaborCostBasis, string> = {
  HOUR: 'รายชั่วโมง',
  DAY: 'รายวัน',
  PIECE: 'รายชิ้น/ผล',
  LUMP_SUM: 'เหมางาน',
}

export const laborReferenceTypeLabels: Record<LaborReferenceType, string> = {
  FARM_OPERATION: 'งานทั่วไปของสวน',
  WORK_ORDER: 'ใบงาน',
  HARVEST_LOT: 'ล็อตเก็บเกี่ยว',
}

export const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  FERTILIZER_SOIL: 'ปุ๋ยและสารปรับปรุงดิน',
  CROP_PROTECTION: 'สารป้องกันกำจัดศัตรูพืช',
  GROWTH_REGULATOR: 'ฮอร์โมน/สารควบคุมการเจริญเติบโต',
  PLANTING_MATERIAL: 'ต้นพันธุ์และวัสดุปลูก',
  WATER_ELECTRICITY: 'น้ำและไฟฟ้า',
  FUEL_MACHINERY: 'เชื้อเพลิงและเครื่องจักร',
  REPAIR_MAINTENANCE: 'ซ่อมบำรุงและอะไหล่',
  EXTERNAL_SERVICE: 'บริการภายนอก/ที่ปรึกษา/ตรวจวิเคราะห์',
  HARVEST_POSTHARVEST: 'เก็บเกี่ยว คัดเกรด และบรรจุภัณฑ์',
  TRANSPORT: 'ขนส่งและจัดเก็บ',
  SALES_FEE: 'ค่านายหน้าและค่าธรรมเนียมการขาย',
  FARM_OVERHEAD: 'ค่าใช้จ่ายประจำสวน',
  OTHER_OPERATING: 'ค่าใช้จ่ายดำเนินงานอื่น',
  CAPITAL_ASSET: 'สินทรัพย์ลงทุน (แยกจากต้นทุนดำเนินงาน)',
}

export const expenseAllocationScopeLabels: Record<ExpenseAllocationScope, string> = {
  FARM: 'ทั้งสวน',
  ZONE: 'โซน',
  WORK_ORDER: 'ใบงาน',
  CROP_CYCLE: 'รอบผลผลิต',
  HARVEST_LOT: 'ล็อตเก็บเกี่ยว',
}

export interface ManagementReportContext {
  actor: AuthenticatedIdentity
  farm: FarmAccess
}

export interface LaborCostDraft {
  annualCycleId: string
  incurredOn: string
  workerReference: string
  basis: LaborCostBasis
  quantity: number
  rateBaht: number
  referenceType: LaborReferenceType
  referenceId: string
  notes: string
}

export interface LaborCostRecord extends LaborCostDraft {
  organizationId: string
  farmId: string
  laborCostId: string
  amountBaht: number
  actorUserId: string
  actorDisplayName: string
  version: 1
  createdAtLabel: string
  exampleData: true
}

export interface OperatingExpenseDraft {
  annualCycleId: string
  incurredOn: string
  category: ExpenseCategory
  description: string
  amountBaht: number
  allocationScope: ExpenseAllocationScope
  allocationReferenceId: string
  notes: string
}

export interface OperatingExpenseRecord extends OperatingExpenseDraft {
  organizationId: string
  farmId: string
  expenseId: string
  costTreatment: 'OPERATING' | 'CAPITAL'
  actorUserId: string
  actorDisplayName: string
  version: 1
  createdAtLabel: string
  exampleData: true
}

export interface ManagementCostAuditEvent {
  eventId: string
  organizationId: string
  farmId: string
  annualCycleId: string
  eventType: 'LABOR_COST_RECORDED' | 'OPERATING_EXPENSE_RECORDED'
  targetId: string
  actorUserId: string
  actorDisplayName: string
  amountBaht: number
  reason: string
  idempotencyKey: string
  createdAtLabel: string
  exampleData: true
}

export interface AnnualPlanFinancialRecord {
  organizationId: string
  farmId: string
  annualCycleId: string
  planItemId: string
  plannedDirectCostBaht: number | null
  actorUserId: string
  createdAtLabel: string
  version: 1
  exampleData: true
}

export interface ManagementCostSnapshot {
  laborCosts: readonly LaborCostRecord[]
  operatingExpenses: readonly OperatingExpenseRecord[]
  annualPlanFinancials: readonly AnnualPlanFinancialRecord[]
  audit: readonly ManagementCostAuditEvent[]
}

export interface ReportPeriod {
  kind: ReportPeriodKind
  periodStart: string
  periodEndExclusive: string
  label: string
  clippedToAnnualCycle: boolean
}

export type ReportQualityFlag =
  | 'SIMULATED_TEST_ONLY'
  | 'WORK_COMPLETION_TIME_NOT_AVAILABLE'
  | 'SALES_EFFECTIVE_DATE_UNKNOWN'
  | 'MATERIAL_COST_EFFECTIVE_DATE_UNKNOWN'
  | 'UNKNOWN_MATERIAL_COST'
  | 'UNKNOWN_FRUIT_VALUE'
  | 'CAPITAL_EXCLUDED_FROM_OPERATING_COST'
  | 'PARTIAL_PERIOD_AT_ANNUAL_BOUNDARY'
  | 'PLAN_COST_NOT_PRORATED'

export interface FarmManagementReportMetrics {
  workDueCount: number
  workClosedSnapshotCount: number
  workOverdueSnapshotCount: number
  openDiseaseCount: number
  followUpDueCount: number
  fruitObservationCount: number
  currentFruitCount: number | null
  currentFruitEstimatedCount: number
  harvestFruitCount: number
  harvestWeightKg: number
  salesFruitCount: number
  salesWeightKg: number
  grossSalesRecordedBaht: number
  outstandingSalesBaht: number
  materialDirectCostBaht: number
  laborCostBaht: number
  operatingExpenseBaht: number
  capitalExpenseBaht: number
  totalManagementCostBaht: number
  managementMarginBaht: number
  managementMarginRate: number | null
  salesToCostRatio: number | null
  costPerHarvestFruitBaht: number | null
  costPerHarvestKgBaht: number | null
  plannedDirectCostBaht: number
  unknownCostMovementCount: number
}

export interface ReportDetailRow {
  sourceType: 'LABOR' | 'EXPENSE' | 'MATERIAL' | 'HARVEST' | 'SALE'
  sourceId: string
  effectiveOn: string
  description: string
  category: string
  amountBaht: number | null
  quantity: number | null
  unit: string
}

export interface FarmManagementReport {
  reportId: string
  reportCode: 'RPT-W-FARM' | 'RPT-M-FARM' | 'RPT-Q-FARM' | 'RPT-A-FARM'
  reportVersion: '0.1.0'
  definitionStatus: 'APPROVED_DEVELOPMENT_BASELINE'
  organizationId: string
  farmId: string
  farmCode: string
  farmName: string
  annualCycleId: string
  annualCycleCode: string
  period: ReportPeriod
  generatedAtLabel: string
  generatedBy: string
  dataMode: 'SIMULATED_TEST_ONLY'
  sourceWatermark: string
  qualityFlags: readonly ReportQualityFlag[]
  metrics: FarmManagementReportMetrics
  details: readonly ReportDetailRow[]
}

export interface BuildFarmManagementReportInput {
  context: ManagementReportContext
  kind: ReportPeriodKind
  anchorDate: string
  annualCycle: AnnualCycleRecord
  annualPlanItems: readonly AnnualPlanItemRecord[]
  workOrders: readonly WorkOrderRecord[]
  diseaseIncidents: readonly DiseaseIncidentRecord[]
  commercial: CommercialSnapshot
  costs: ManagementCostSnapshot
  generatedAtLabel?: string
}

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/u

function requiredText(value: string, label: string, maximumLength = 300): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`ต้องระบุ${label}`)
  if (normalized.length > maximumLength) throw new Error(`${label}ต้องไม่เกิน ${maximumLength} ตัวอักษร`)
  return normalized
}

function parseIsoDate(value: string, label: string): Date {
  if (!isoDatePattern.test(value)) throw new Error(`${label}ต้องเป็น YYYY-MM-DD`)
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new Error(`${label}ไม่ใช่วันที่ปฏิทินที่ถูกต้อง`)
  }
  return parsed
}

function formatIsoDate(value: Date): string {
  return value.toISOString().slice(0, 10)
}

function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function roundQuantity(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000
}

function addUtcDays(value: Date, days: number): Date {
  const result = new Date(value)
  result.setUTCDate(result.getUTCDate() + days)
  return result
}

function addCalendarMonths(value: Date, months: number): Date {
  const year = value.getUTCFullYear()
  const month = value.getUTCMonth() + months
  const day = value.getUTCDate()
  const first = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate()
  return new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), Math.min(day, lastDay)))
}

function clampPeriod(
  kind: ReportPeriodKind,
  rawStart: string,
  rawEnd: string,
  cycle: AnnualCycleRecord,
): ReportPeriod {
  const periodStart = rawStart < cycle.periodStart ? cycle.periodStart : rawStart
  const periodEndExclusive = rawEnd > cycle.periodEndExclusive ? cycle.periodEndExclusive : rawEnd
  if (periodStart >= periodEndExclusive) throw new Error('งวดรายงานอยู่นอก Annual Cycle ที่เลือก')
  return {
    kind,
    periodStart,
    periodEndExclusive,
    label: `${periodStart} ถึงก่อน ${periodEndExclusive}`,
    clippedToAnnualCycle: periodStart !== rawStart || periodEndExclusive !== rawEnd,
  }
}

export function resolveReportPeriod(
  kind: ReportPeriodKind,
  anchorDate: string,
  cycle: AnnualCycleRecord,
): ReportPeriod {
  const anchor = parseIsoDate(anchorDate, 'วันที่อ้างอิงรายงาน')
  if (anchorDate < cycle.periodStart || anchorDate >= cycle.periodEndExclusive) {
    throw new Error('วันที่อ้างอิงต้องอยู่ใน Annual Cycle ที่เลือก')
  }
  if (kind === 'ANNUAL') {
    return clampPeriod(kind, cycle.periodStart, cycle.periodEndExclusive, cycle)
  }
  if (kind === 'WEEKLY') {
    const offsetFromMonday = (anchor.getUTCDay() + 6) % 7
    const start = addUtcDays(anchor, -offsetFromMonday)
    return clampPeriod(kind, formatIsoDate(start), formatIsoDate(addUtcDays(start, 7)), cycle)
  }
  if (kind === 'MONTHLY') {
    const start = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth(), 1))
    const end = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() + 1, 1))
    return clampPeriod(kind, formatIsoDate(start), formatIsoDate(end), cycle)
  }

  const cycleStart = parseIsoDate(cycle.periodStart, 'วันเริ่ม Annual Cycle')
  let segmentStart = cycleStart
  for (let index = 0; index < 4; index += 1) {
    const segmentEnd = addCalendarMonths(segmentStart, 3)
    if (anchorDate < formatIsoDate(segmentEnd)) {
      return clampPeriod(kind, formatIsoDate(segmentStart), formatIsoDate(segmentEnd), cycle)
    }
    segmentStart = segmentEnd
  }
  throw new Error('ไม่พบช่วงราย 3 เดือนใน Annual Cycle ที่เลือก')
}

function assertFinitePositive(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) throw new Error(`${label}ต้องมากกว่า 0`)
}

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label}ต้องเป็น 0 หรือมากกว่า`)
}

function assertCycleScope(
  context: ManagementReportContext,
  cycle: AnnualCycleRecord,
  annualCycleId: string,
  incurredOn: string,
): void {
  if (
    cycle.organizationId !== context.farm.organizationId ||
    cycle.farmId !== context.farm.farmId ||
    cycle.annualCycleId !== annualCycleId
  ) {
    throw new Error('ปฏิเสธ Annual Cycle ที่ไม่อยู่ในสวนปัจจุบัน')
  }
  if (incurredOn < cycle.periodStart || incurredOn >= cycle.periodEndExclusive) {
    throw new Error('วันที่ต้นทุนต้องอยู่ใน Annual Cycle ที่เลือก')
  }
}

export function normalizeLaborCostDraft(
  context: ManagementReportContext,
  cycle: AnnualCycleRecord,
  draft: LaborCostDraft,
): LaborCostDraft & { amountBaht: number } {
  parseIsoDate(draft.incurredOn, 'วันที่เกิดต้นทุนแรงงาน')
  assertCycleScope(context, cycle, draft.annualCycleId, draft.incurredOn)
  assertFinitePositive(draft.quantity, 'จำนวนหน่วยแรงงาน')
  assertFiniteNonNegative(draft.rateBaht, 'อัตราค่าแรง')
  const referenceId = requiredText(draft.referenceId, 'รหัสอ้างอิง', 160)
  return {
    ...draft,
    workerReference: requiredText(draft.workerReference, 'ผู้ปฏิบัติงาน/ทีมแบบลดข้อมูลส่วนบุคคล', 120),
    referenceId,
    notes: draft.notes.trim().slice(0, 500),
    quantity: roundQuantity(draft.quantity),
    rateBaht: roundMoney(draft.rateBaht),
    amountBaht: roundMoney(draft.quantity * draft.rateBaht),
  }
}

export function normalizeOperatingExpenseDraft(
  context: ManagementReportContext,
  cycle: AnnualCycleRecord,
  draft: OperatingExpenseDraft,
): OperatingExpenseDraft & { costTreatment: 'OPERATING' | 'CAPITAL' } {
  parseIsoDate(draft.incurredOn, 'วันที่เกิดค่าใช้จ่าย')
  assertCycleScope(context, cycle, draft.annualCycleId, draft.incurredOn)
  assertFinitePositive(draft.amountBaht, 'จำนวนเงิน')
  const allocationReferenceId = draft.allocationScope === 'FARM'
    ? context.farm.farmId
    : requiredText(draft.allocationReferenceId, 'รหัสขอบเขตจัดสรร', 160)
  return {
    ...draft,
    description: requiredText(draft.description, 'รายละเอียดค่าใช้จ่าย', 200),
    allocationReferenceId,
    notes: draft.notes.trim().slice(0, 500),
    amountBaht: roundMoney(draft.amountBaht),
    costTreatment: draft.category === 'CAPITAL_ASSET' ? 'CAPITAL' : 'OPERATING',
  }
}

export function canViewManagementReports(access: FarmAccess): boolean {
  return canAccessFinancialData(access)
}

export function canRecordLaborCost(access: FarmAccess): boolean {
  return canAccessFinancialData(access) && access.farmStatus === 'ACTIVE'
}

export function canRecordOperatingExpense(access: FarmAccess): boolean {
  return canAccessFinancialData(access) && access.farmStatus === 'ACTIVE'
}

export function canExportManagementReport(access: FarmAccess): boolean {
  return canAccessFinancialData(access)
}

function inPeriod(date: string | undefined, period: ReportPeriod): boolean {
  return Boolean(date && date >= period.periodStart && date < period.periodEndExclusive)
}

function assertFarmScoped(input: BuildFarmManagementReportInput): void {
  const { organizationId, farmId } = input.context.farm
  if (input.commercial.financial === null) {
    throw new Error('หยุดสร้างรายงาน: ไม่ได้รับ Owner-only financial snapshot')
  }
  const collections: readonly (readonly { organizationId: string; farmId: string }[])[] = [
    input.workOrders,
    input.diseaseIncidents,
    input.commercial.cropCycles,
    input.commercial.fruitObservations,
    input.commercial.harvestLots,
    input.commercial.salesLots,
    input.commercial.inventoryItems,
    input.commercial.inventoryMovements,
    input.costs.laborCosts,
    input.costs.operatingExpenses,
    input.costs.annualPlanFinancials,
    input.costs.audit,
    input.commercial.financial.salesLots,
    input.commercial.financial.inventoryMovements,
    input.commercial.financial.audit,
  ]
  if (collections.some((records) => records.some(
    (record) => record.organizationId !== organizationId || record.farmId !== farmId,
  ))) {
    throw new Error('หยุดสร้างรายงาน: พบข้อมูลข้าม Farm ในแหล่งข้อมูล')
  }
  if (
    input.annualCycle.organizationId !== organizationId ||
    input.annualCycle.farmId !== farmId
  ) {
    throw new Error('หยุดสร้างรายงาน: Annual Cycle ไม่อยู่ใน Farm ปัจจุบัน')
  }
}

function reportCode(kind: ReportPeriodKind): FarmManagementReport['reportCode'] {
  if (kind === 'WEEKLY') return 'RPT-W-FARM'
  if (kind === 'MONTHLY') return 'RPT-M-FARM'
  if (kind === 'THREE_MONTH') return 'RPT-Q-FARM'
  return 'RPT-A-FARM'
}

export function buildFarmManagementReport(
  input: BuildFarmManagementReportInput,
): FarmManagementReport {
  if (!canViewManagementReports(input.context.farm)) {
    throw new Error('บทบาทนี้ไม่มีสิทธิ์ดูรายงานการจัดการสวน')
  }
  assertFarmScoped(input)
  const period = resolveReportPeriod(input.kind, input.anchorDate, input.annualCycle)
  const dueWork = input.workOrders.filter((work) => inPeriod(work.dueDate, period))
  const overdueWork = input.workOrders.filter(
    (work) => work.status !== 'CLOSED' && work.dueDate < period.periodEndExclusive,
  )
  const followUpDue = input.diseaseIncidents.filter(
    (incident) => incident.status !== 'CLOSED' && inPeriod(incident.followUpDate, period),
  )
  const observationsInPeriod = input.commercial.fruitObservations.filter(
    (record) => record.archivedAtLabel === null && inPeriod(record.observedAt, period),
  )
  const currentByCrop = new Map<string, (typeof input.commercial.fruitObservations)[number]>()
  for (const observation of input.commercial.fruitObservations) {
    if (observation.archivedAtLabel !== null || observation.observedAt >= period.periodEndExclusive) continue
    const previous = currentByCrop.get(observation.cropCycleId)
    if (!previous || observation.observedAt > previous.observedAt) {
      currentByCrop.set(observation.cropCycleId, observation)
    }
  }
  const currentObservations = [...currentByCrop.values()]
  const knownCurrentFruit = currentObservations.filter(
    (record) => record.observedCount !== null && record.valueQuality !== 'UNKNOWN',
  )
  const harvests = input.commercial.harvestLots.filter(
    (record) => record.status !== 'ARCHIVED' && inPeriod(record.harvestedOn, period),
  )
  const sales = input.commercial.salesLots.filter(
    (record) => !['CANCELLED', 'ARCHIVED'].includes(record.status) && inPeriod(record.soldOn, period),
  )
  const materialIssues = input.commercial.inventoryMovements.filter(
    (record) => record.movementType === 'ISSUE' && inPeriod(record.effectiveOn, period),
  )
  const labor = input.costs.laborCosts.filter(
    (record) => record.annualCycleId === input.annualCycle.annualCycleId && inPeriod(record.incurredOn, period),
  )
  const expenses = input.costs.operatingExpenses.filter(
    (record) => record.annualCycleId === input.annualCycle.annualCycleId && inPeriod(record.incurredOn, period),
  )
  const operatingExpenses = expenses.filter((record) => record.costTreatment === 'OPERATING')
  const capitalExpenses = expenses.filter((record) => record.costTreatment === 'CAPITAL')
  const overlappingPlanIds = new Set(input.annualPlanItems.filter(
    (plan) => plan.annualCycleId === input.annualCycle.annualCycleId &&
      plan.plannedStart < period.periodEndExclusive &&
      plan.plannedEndExclusive > period.periodStart,
  ).map((plan) => plan.planItemId))
  const overlappingPlanFinancials = input.costs.annualPlanFinancials.filter(
    (record) => record.annualCycleId === input.annualCycle.annualCycleId &&
      overlappingPlanIds.has(record.planItemId) &&
      record.plannedDirectCostBaht !== null,
  )
  const financial = input.commercial.financial
  if (!financial) throw new Error('หยุดสร้างรายงาน: ไม่ได้รับ Owner-only financial snapshot')
  const salesFinancialById = new Map(financial.salesLots.map((record) => [record.salesLotId, record]))
  const movementFinancialById = new Map(financial.inventoryMovements.map((record) => [record.movementId, record]))

  const sumMoney = (values: readonly number[]) => roundMoney(values.reduce((sum, value) => sum + value, 0))
  const materialDirectCostBaht = sumMoney(materialIssues.map(
    (record) => movementFinancialById.get(record.movementId)?.directCostBaht ?? 0,
  ))
  const laborCostBaht = sumMoney(labor.map((record) => record.amountBaht))
  const operatingExpenseBaht = sumMoney(operatingExpenses.map((record) => record.amountBaht))
  const capitalExpenseBaht = sumMoney(capitalExpenses.map((record) => record.amountBaht))
  const totalManagementCostBaht = sumMoney([
    materialDirectCostBaht,
    laborCostBaht,
    operatingExpenseBaht,
  ])
  const grossSalesRecordedBaht = sumMoney(sales.map(
    (record) => salesFinancialById.get(record.salesLotId)?.grossAmountBaht ?? 0,
  ))
  const managementMarginBaht = roundMoney(grossSalesRecordedBaht - totalManagementCostBaht)
  const harvestFruitCount = harvests.reduce((sum, record) => sum + (record.quantityFruit ?? 0), 0)
  const harvestWeightKg = roundQuantity(harvests.reduce((sum, record) => sum + (record.totalWeightKg ?? 0), 0))
  const flags = new Set<ReportQualityFlag>(['SIMULATED_TEST_ONLY', 'WORK_COMPLETION_TIME_NOT_AVAILABLE'])
  if (period.clippedToAnnualCycle) flags.add('PARTIAL_PERIOD_AT_ANNUAL_BOUNDARY')
  if (input.commercial.salesLots.some(
    (record) => !['CANCELLED', 'ARCHIVED'].includes(record.status) && !record.soldOn,
  )) flags.add('SALES_EFFECTIVE_DATE_UNKNOWN')
  if (input.commercial.inventoryMovements.some(
    (record) => record.movementType === 'ISSUE' && !record.effectiveOn,
  )) flags.add('MATERIAL_COST_EFFECTIVE_DATE_UNKNOWN')
  if (materialIssues.some((record) =>
    !movementFinancialById.has(record.movementId) ||
    movementFinancialById.get(record.movementId)?.directCostBaht === null,
  )) flags.add('UNKNOWN_MATERIAL_COST')
  if (currentObservations.some((record) => record.observedCount === null || record.valueQuality === 'UNKNOWN')) {
    flags.add('UNKNOWN_FRUIT_VALUE')
  }
  if (capitalExpenseBaht > 0) flags.add('CAPITAL_EXCLUDED_FROM_OPERATING_COST')
  if (input.kind !== 'ANNUAL' && overlappingPlanFinancials.length > 0) flags.add('PLAN_COST_NOT_PRORATED')

  const details: ReportDetailRow[] = [
    ...labor.map((record) => ({
      sourceType: 'LABOR' as const,
      sourceId: record.laborCostId,
      effectiveOn: record.incurredOn,
      description: record.workerReference,
      category: laborCostBasisLabels[record.basis],
      amountBaht: record.amountBaht,
      quantity: record.quantity,
      unit: record.basis,
    })),
    ...expenses.map((record) => ({
      sourceType: 'EXPENSE' as const,
      sourceId: record.expenseId,
      effectiveOn: record.incurredOn,
      description: record.description,
      category: expenseCategoryLabels[record.category],
      amountBaht: record.amountBaht,
      quantity: null,
      unit: 'บาท',
    })),
    ...materialIssues.map((record) => ({
      sourceType: 'MATERIAL' as const,
      sourceId: record.movementId,
      effectiveOn: record.effectiveOn ?? 'UNKNOWN',
      description: `${record.itemId} · ${record.reason}`,
      category: 'ต้นทุนวัสดุที่เบิกใช้',
      amountBaht: movementFinancialById.get(record.movementId)?.directCostBaht ?? null,
      quantity: Math.abs(record.quantityDelta),
      unit: record.unit,
    })),
    ...harvests.map((record) => ({
      sourceType: 'HARVEST' as const,
      sourceId: record.harvestLotId,
      effectiveOn: record.harvestedOn,
      description: record.lotCode,
      category: 'ผลผลิตเก็บเกี่ยว',
      amountBaht: null,
      quantity: record.totalWeightKg,
      unit: 'kg',
    })),
    ...sales.map((record) => ({
      sourceType: 'SALE' as const,
      sourceId: record.salesLotId,
      effectiveOn: record.soldOn ?? 'UNKNOWN',
      description: record.lotCode,
      category: 'ยอดขายที่บันทึก',
      amountBaht: salesFinancialById.get(record.salesLotId)?.grossAmountBaht ?? null,
      quantity: record.weightKg,
      unit: 'kg',
    })),
  ].sort((left, right) => left.effectiveOn.localeCompare(right.effectiveOn))

  const metrics: FarmManagementReportMetrics = {
    workDueCount: dueWork.length,
    workClosedSnapshotCount: dueWork.filter((work) => work.status === 'CLOSED').length,
    workOverdueSnapshotCount: overdueWork.length,
    openDiseaseCount: input.diseaseIncidents.filter((incident) => incident.status !== 'CLOSED').length,
    followUpDueCount: followUpDue.length,
    fruitObservationCount: observationsInPeriod.length,
    currentFruitCount: knownCurrentFruit.length === 0
      ? null
      : knownCurrentFruit.reduce((sum, record) => sum + (record.observedCount ?? 0), 0),
    currentFruitEstimatedCount: currentObservations.filter((record) => record.valueQuality === 'ESTIMATED').length,
    harvestFruitCount,
    harvestWeightKg,
    salesFruitCount: sales.reduce((sum, record) => sum + (record.quantityFruit ?? 0), 0),
    salesWeightKg: roundQuantity(sales.reduce((sum, record) => sum + record.weightKg, 0)),
    grossSalesRecordedBaht,
    outstandingSalesBaht: sumMoney(input.commercial.salesLots
      .filter((record) => !['CANCELLED', 'ARCHIVED'].includes(record.status) && (!record.soldOn || record.soldOn < period.periodEndExclusive))
      .map((record) => salesFinancialById.get(record.salesLotId)?.outstandingBaht ?? 0)),
    materialDirectCostBaht,
    laborCostBaht,
    operatingExpenseBaht,
    capitalExpenseBaht,
    totalManagementCostBaht,
    managementMarginBaht,
    managementMarginRate: grossSalesRecordedBaht === 0
      ? null
      : roundMoney((managementMarginBaht / grossSalesRecordedBaht) * 100),
    salesToCostRatio: totalManagementCostBaht === 0
      ? null
      : roundMoney(grossSalesRecordedBaht / totalManagementCostBaht),
    costPerHarvestFruitBaht: harvestFruitCount === 0
      ? null
      : roundMoney(totalManagementCostBaht / harvestFruitCount),
    costPerHarvestKgBaht: harvestWeightKg === 0
      ? null
      : roundMoney(totalManagementCostBaht / harvestWeightKg),
    plannedDirectCostBaht: sumMoney(overlappingPlanFinancials.map((record) => record.plannedDirectCostBaht ?? 0)),
    unknownCostMovementCount: materialIssues.filter((record) =>
      !movementFinancialById.has(record.movementId) ||
      movementFinancialById.get(record.movementId)?.directCostBaht === null,
    ).length,
  }

  return {
    reportId: `report_${input.context.farm.farmId}_${input.kind}_${period.periodStart}`,
    reportCode: reportCode(input.kind),
    reportVersion: '0.1.0',
    definitionStatus: 'APPROVED_DEVELOPMENT_BASELINE',
    organizationId: input.context.farm.organizationId,
    farmId: input.context.farm.farmId,
    farmCode: input.context.farm.farmCode,
    farmName: input.context.farm.farmName,
    annualCycleId: input.annualCycle.annualCycleId,
    annualCycleCode: input.annualCycle.cycleCode,
    period,
    generatedAtLabel: input.generatedAtLabel ?? '1 ก.ย. 2569 · เวลาจำลองคงที่',
    generatedBy: input.context.actor.userId,
    dataMode: 'SIMULATED_TEST_ONLY',
    sourceWatermark: 'KDOMS-MGMT-REPORT-MOCK-V1',
    qualityFlags: [...flags],
    metrics,
    details,
  }
}

function csvCell(value: string | number | null): string {
  const text = value === null ? '' : String(value)
  const safe = /^[=+@]/u.test(text) || /^-[^0-9]/u.test(text) ? `'${text}` : text
  return `"${safe.replaceAll('"', '""')}"`
}

export function createManagementReportCsv(report: FarmManagementReport): string {
  const rows: (readonly (string | number | null)[])[] = [
    ['reportCode', report.reportCode],
    ['reportVersion', report.reportVersion],
    ['definitionStatus', report.definitionStatus],
    ['farmCode', report.farmCode],
    ['annualCycleCode', report.annualCycleCode],
    ['periodStart', report.period.periodStart],
    ['periodEndExclusive', report.period.periodEndExclusive],
    ['dataMode', report.dataMode],
    ['qualityFlags', report.qualityFlags.join('|')],
    [],
    ['metric', 'value'],
    ...Object.entries(report.metrics),
    [],
    ['sourceType', 'sourceId', 'effectiveOn', 'description', 'category', 'amountBaht', 'quantity', 'unit'],
    ...report.details.map((row) => [
      row.sourceType,
      row.sourceId,
      row.effectiveOn,
      row.description,
      row.category,
      row.amountBaht,
      row.quantity,
      row.unit,
    ]),
  ]
  return `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`
}
