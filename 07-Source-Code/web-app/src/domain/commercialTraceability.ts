import { canAccessFinancialData, type AuthenticatedIdentity, type CanonicalRole, type FarmAccess } from './farm'

export const cropStages = [
  'FLOWERING',
  'EARLY_FRUIT',
  'MID_SEASON',
  'PRE_SALE',
  'HARVESTED',
] as const

export const valueQualities = ['MEASURED', 'ESTIMATED', 'UNKNOWN'] as const
export const countMethods = ['FULL_COUNT', 'SAMPLE', 'ESTIMATE', 'UNKNOWN'] as const
export const fruitCountingModes = ['MANUAL', 'AI_ASSISTED'] as const
export const harvestStatuses = ['PLANNED', 'HARVESTING', 'GRADED', 'CLOSED', 'ARCHIVED'] as const
export const salesStatuses = ['CONFIRMED', 'CANCELLED', 'ARCHIVED'] as const
export const salesPaymentStatuses = ['UNPAID', 'PARTIALLY_RECEIVED', 'PAID'] as const
export const inventoryMovementTypes = ['RECEIPT', 'ISSUE', 'ADJUSTMENT'] as const

export type CropStage = (typeof cropStages)[number]
export type ValueQuality = (typeof valueQualities)[number]
export type CountMethod = (typeof countMethods)[number]
export type FruitCountingMode = (typeof fruitCountingModes)[number]
export type HarvestStatus = (typeof harvestStatuses)[number]
export type SalesStatus = (typeof salesStatuses)[number]
export type SalesPaymentStatus = (typeof salesPaymentStatuses)[number]
export type InventoryMovementType = (typeof inventoryMovementTypes)[number]
export type CommercialRecordKind = 'FRUIT_OBSERVATION' | 'HARVEST_LOT' | 'SALES_LOT' | 'INVENTORY_MOVEMENT'

export const cropStageLabels: Record<CropStage, string> = {
  FLOWERING: 'ออกดอก',
  EARLY_FRUIT: 'ผลอ่อน',
  MID_SEASON: 'กลางฤดู',
  PRE_SALE: 'ก่อนขาย',
  HARVESTED: 'เก็บเกี่ยวแล้ว',
}

export const valueQualityLabels: Record<ValueQuality, string> = {
  MEASURED: 'วัดจริง',
  ESTIMATED: 'ประมาณการ',
  UNKNOWN: 'ยังไม่ทราบ',
}

export const fruitCountingModeLabels: Record<FruitCountingMode, string> = {
  MANUAL: 'คนนับ',
  AI_ASSISTED: 'AI ช่วยนับ + คนตรวจ',
}

export interface CommercialMutationContext {
  actor: AuthenticatedIdentity
  farm: FarmAccess
}

export interface CropCycleRecord {
  organizationId: string
  farmId: string
  annualCycleId: string
  cropCycleId: string
  cycleCode: string
  name: string
  stage: CropStage
  zoneCodes: readonly string[]
  varietyReference: string
  expectedHarvestDate: string | null
  status: 'ACTIVE' | 'ARCHIVED'
  version: number
  exampleData: true
}

export interface CropCycleDraft {
  annualCycleId: string
  cycleCode: string
  name: string
  stage: CropStage
  zoneCodes: readonly string[]
  varietyReference: string
  expectedHarvestDate: string | null
}

export interface FruitObservationDraft {
  cropCycleId: string
  stage: CropStage
  scopeKind: 'TREE' | 'ZONE'
  positionIds: readonly string[]
  zoneCodes: readonly string[]
  countingMode: FruitCountingMode
  sourceCountSessionId: string | null
  countMethod: CountMethod
  observedCount: number | null
  droppedCount: number | null
  valueQuality: ValueQuality
  confidenceNote: string
  observedAt: string
}

export interface FruitObservationRecord extends FruitObservationDraft {
  organizationId: string
  farmId: string
  observationId: string
  unit: 'fruit'
  actorUserId: string
  createdAtLabel: string
  archivedAtLabel: string | null
  version: number
  exampleData: true
}

export interface HarvestGrade {
  gradeCode: string
  quantityFruit: number
  weightKg: number
  valueQuality: ValueQuality
}

export interface HarvestLotDraft {
  cropCycleId: string
  lotCode: string
  harvestedOn: string
  positionIds: readonly string[]
  zoneCodes: readonly string[]
  quantityFruit: number | null
  totalWeightKg: number | null
  valueQuality: ValueQuality
  grades: readonly HarvestGrade[]
  note: string
}

export interface CommercialAuditEvent {
  eventId: string
  recordKind: CommercialRecordKind
  recordId: string
  eventType: 'CREATED' | 'CORRECTED' | 'ARCHIVED' | 'STOCK_RECORDED'
  actorUserId: string
  actorDisplayName: string
  reason: string
  beforeSummary: string
  afterSummary: string
  recordVersion: number
  createdAtLabel: string
}

export interface HarvestLotRecord extends HarvestLotDraft {
  organizationId: string
  farmId: string
  harvestLotId: string
  status: HarvestStatus
  soldWeightKg: number
  actorUserId: string
  createdAtLabel: string
  version: number
  exampleData: true
  audit: readonly CommercialAuditEvent[]
}

export interface HarvestAllocation {
  harvestLotId: string
  weightKg: number
}

export interface SalesLotDraft {
  lotCode: string
  soldOn?: string
  allocations: readonly HarvestAllocation[]
  quantityFruit: number | null
  weightKg: number
  note: string
  financial?: SalesLotFinancialDraft
}

export interface SalesLotFinancialDraft {
  customerReference: string
  unitPriceBahtPerKg: number
  depositBaht: number
  receivedBaht: number
}

export interface SalesLotRecord extends Omit<SalesLotDraft, 'financial'> {
  organizationId: string
  farmId: string
  salesLotId: string
  status: SalesStatus
  actorUserId: string
  createdAtLabel: string
  version: number
  exampleData: true
  audit: readonly CommercialAuditEvent[]
}

export interface SalesLotFinancialRecord extends SalesLotFinancialDraft {
  organizationId: string
  farmId: string
  salesLotId: string
  grossAmountBaht: number
  outstandingBaht: number
  paymentStatus: SalesPaymentStatus
  actorUserId: string
  createdAtLabel: string
  version: number
  exampleData: true
}

export interface SalesCorrectionInput {
  weightKg: number
  unitPriceBahtPerKg: number
  depositBaht: number
  receivedBaht: number
  reason: string
}

export interface InventoryLotRecord {
  lotId: string
  lotCode: string
  expiresOn: string | null
}

export interface InventoryItemRecord {
  organizationId: string
  farmId: string
  itemId: string
  itemCode: string
  name: string
  baseUnit: string
  reorderLevel: number
  lots: readonly InventoryLotRecord[]
  status: 'ACTIVE' | 'ARCHIVED'
  version: number
  exampleData: true
}

export interface InventoryMovementInput {
  itemId: string
  lotId: string
  effectiveOn?: string
  movementType: InventoryMovementType
  quantity: number
  unit: string
  reason: string
  referenceType: 'PURCHASE_REFERENCE' | 'WORK_ORDER' | 'CARE_EVENT' | 'COUNT_CORRECTION'
  referenceId: string
  financial?: InventoryMovementFinancialDraft
}

export interface InventoryMovementRecord extends Omit<InventoryMovementInput, 'financial'> {
  organizationId: string
  farmId: string
  movementId: string
  quantityDelta: number
  actorUserId: string
  createdAtLabel: string
  version: 1
  exampleData: true
  audit: readonly CommercialAuditEvent[]
}

export interface InventoryMovementFinancialDraft {
  directUnitCostBaht: number | null
}

export interface InventoryMovementFinancialRecord extends InventoryMovementFinancialDraft {
  organizationId: string
  farmId: string
  movementId: string
  directCostBaht: number | null
  actorUserId: string
  createdAtLabel: string
  version: 1
  exampleData: true
}

export interface CommercialFinancialAuditEvent extends CommercialAuditEvent {
  organizationId: string
  farmId: string
  amountBaht: number | null
  exampleData: true
}

export interface InventoryBalance {
  itemId: string
  lotId: string
  balance: number
  unit: string
}

export interface CommercialAlert {
  alertId: string
  kind: 'LOW_STOCK' | 'EXPIRING'
  itemId: string
  title: string
  description: string
}

export interface DirectCostSummary {
  totalIssuedCostBaht: number
  linkedWorkCostBaht: number
  linkedCareCostBaht: number
  unknownCostMovementCount: number
}

export interface CommercialFinancialSnapshot {
  salesLots: readonly SalesLotFinancialRecord[]
  inventoryMovements: readonly InventoryMovementFinancialRecord[]
  directCostSummary: DirectCostSummary
  audit: readonly CommercialFinancialAuditEvent[]
}

export interface TraceabilityRow {
  salesLotId: string
  salesLotCode: string
  harvestLotId: string
  harvestLotCode: string
  cropCycleId: string
  cropCycleCode: string
  positionIds: readonly string[]
  zoneCodes: readonly string[]
  allocatedWeightKg: number
}

export interface CommercialSnapshot {
  cropCycles: readonly CropCycleRecord[]
  fruitObservations: readonly FruitObservationRecord[]
  harvestLots: readonly HarvestLotRecord[]
  salesLots: readonly SalesLotRecord[]
  inventoryItems: readonly InventoryItemRecord[]
  inventoryMovements: readonly InventoryMovementRecord[]
  inventoryBalances: readonly InventoryBalance[]
  alerts: readonly CommercialAlert[]
  financial: CommercialFinancialSnapshot | null
  traceability: readonly TraceabilityRow[]
}

function requiredText(value: string, label: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`ต้องระบุ${label}`)
  return normalized
}

function assertIsoDate(value: string, label: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) throw new Error(`${label}ต้องเป็น YYYY-MM-DD`)
}

function assertFiniteNonNegative(value: number, label: string): void {
  if (!Number.isFinite(value) || value < 0) throw new Error(`${label}ต้องเป็นเลขตั้งแต่ 0 ขึ้นไป`)
}

function assertUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error(`${label}มีค่าซ้ำ`)
}

export function roundQuantity(value: number, decimals = 3): number {
  const factor = 10 ** decimals
  return Math.round((value + Number.EPSILON) * factor) / factor
}

export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

export function calculateSaleAmounts(
  weightKg: number,
  unitPriceBahtPerKg: number,
  depositBaht: number,
  receivedBaht: number,
): { grossAmountBaht: number; outstandingBaht: number; paymentStatus: SalesPaymentStatus } {
  assertFiniteNonNegative(weightKg, 'น้ำหนัก')
  assertFiniteNonNegative(unitPriceBahtPerKg, 'ราคาต่อกิโลกรัม')
  assertFiniteNonNegative(depositBaht, 'เงินมัดจำ')
  assertFiniteNonNegative(receivedBaht, 'ยอดรับแล้ว')
  const grossAmountBaht = roundMoney(weightKg * unitPriceBahtPerKg)
  const paid = roundMoney(depositBaht + receivedBaht)
  if (paid > grossAmountBaht) throw new Error('ยอดมัดจำและยอดรับรวมเกินมูลค่าล็อตขาย')
  const outstandingBaht = roundMoney(grossAmountBaht - paid)
  const paymentStatus: SalesPaymentStatus = outstandingBaht === 0
    ? 'PAID'
    : paid > 0
      ? 'PARTIALLY_RECEIVED'
      : 'UNPAID'
  return { grossAmountBaht, outstandingBaht, paymentStatus }
}

export function validateFruitObservation(draft: FruitObservationDraft): FruitObservationDraft {
  assertIsoDate(draft.observedAt, 'วันที่สังเกต')
  assertUnique(draft.positionIds, 'Position')
  assertUnique(draft.zoneCodes, 'Zone')
  if (draft.scopeKind === 'TREE' && draft.positionIds.length === 0) {
    throw new Error('การสังเกตรายต้นต้องมี Position อย่างน้อย 1 ต้น')
  }
  if (draft.scopeKind === 'ZONE' && draft.zoneCodes.length === 0) {
    throw new Error('การสังเกตระดับโซนต้องมี Zone อย่างน้อย 1 โซน')
  }
  if (draft.valueQuality === 'UNKNOWN') {
    if (draft.observedCount !== null || draft.droppedCount !== null) {
      throw new Error('ค่า UNKNOWN ต้องไม่ใส่จำนวนที่ทำให้เข้าใจว่าเป็นค่าจริง')
    }
  } else {
    if (draft.observedCount === null) throw new Error('ต้องระบุจำนวนผลเมื่อวัดหรือประมาณการ')
    assertFiniteNonNegative(draft.observedCount, 'จำนวนผล')
    if (!Number.isInteger(draft.observedCount)) throw new Error('จำนวนผลต้องเป็นจำนวนเต็ม')
    if (draft.droppedCount !== null) {
      assertFiniteNonNegative(draft.droppedCount, 'จำนวนผลร่วง')
      if (!Number.isInteger(draft.droppedCount)) throw new Error('จำนวนผลร่วงต้องเป็นจำนวนเต็ม')
    }
  }
  if (draft.countMethod === 'UNKNOWN' && draft.valueQuality !== 'UNKNOWN') {
    throw new Error('ต้องระบุวิธีนับสำหรับค่าที่วัดหรือประมาณการ')
  }
  if (!fruitCountingModes.includes(draft.countingMode)) throw new Error('ไม่รองรับวิธีได้มาของจำนวนผล')
  if (draft.countingMode === 'MANUAL') {
    if (draft.sourceCountSessionId !== null) throw new Error('คนนับต้องไม่อ้าง AI Count Session')
  } else {
    if (draft.stage === 'FLOWERING') throw new Error('ช่วงออกดอกยังไม่ใช้ AI นับผล')
    if (draft.valueQuality !== 'ESTIMATED') throw new Error('AI ช่วยนับต้องบันทึกเป็นค่าประมาณการ')
    if (draft.countMethod === 'FULL_COUNT') throw new Error('AI ช่วยนับยังห้ามอ้างเป็น Full Count')
    requiredText(draft.sourceCountSessionId ?? '', 'AI Count Session')
  }
  return {
    ...draft,
    cropCycleId: requiredText(draft.cropCycleId, 'Crop Cycle'),
    positionIds: [...draft.positionIds],
    zoneCodes: draft.zoneCodes.map((value) => requiredText(value, 'Zone')),
    sourceCountSessionId: draft.sourceCountSessionId === null
      ? null
      : requiredText(draft.sourceCountSessionId, 'AI Count Session'),
    confidenceNote: requiredText(draft.confidenceNote, 'หมายเหตุความเชื่อมั่น/ข้อจำกัด'),
  }
}

export function validateCropCycle(draft: CropCycleDraft): CropCycleDraft {
  assertUnique(draft.zoneCodes, 'Zone')
  if (draft.zoneCodes.length === 0) throw new Error('Crop Cycle ต้องมี Zone อย่างน้อย 1 โซน')
  if (draft.expectedHarvestDate !== null) assertIsoDate(draft.expectedHarvestDate, 'วันที่คาดว่าจะเก็บเกี่ยว')
  return {
    ...draft,
    annualCycleId: requiredText(draft.annualCycleId, 'Annual Farm Management Cycle'),
    cycleCode: requiredText(draft.cycleCode, 'รหัส Crop Cycle'),
    name: requiredText(draft.name, 'ชื่อ Crop Cycle'),
    zoneCodes: draft.zoneCodes.map((value) => requiredText(value, 'Zone')),
    varietyReference: requiredText(draft.varietyReference, 'Variety reference'),
  }
}

export function assertCropStageTransition(before: CropStage, after: CropStage): void {
  const beforeIndex = cropStages.indexOf(before)
  const afterIndex = cropStages.indexOf(after)
  if (afterIndex !== beforeIndex + 1) {
    throw new Error(`Crop stage ต้องเดินหน้าทีละขั้นจาก ${before} ไป ${after}`)
  }
}

export function validateHarvestLot(draft: HarvestLotDraft): HarvestLotDraft {
  assertIsoDate(draft.harvestedOn, 'วันที่เก็บเกี่ยว')
  assertUnique(draft.positionIds, 'Position')
  assertUnique(draft.zoneCodes, 'Zone')
  if (draft.positionIds.length === 0 && draft.zoneCodes.length === 0) {
    throw new Error('Harvest Lot ต้องอ้างอิงต้นหรือโซนอย่างน้อย 1 รายการ')
  }
  if (draft.valueQuality === 'UNKNOWN') {
    if (draft.quantityFruit !== null || draft.totalWeightKg !== null) {
      throw new Error('Harvest Lot แบบ UNKNOWN ต้องไม่บันทึกตัวเลขเป็นค่าจริง')
    }
  } else {
    if (draft.quantityFruit === null && draft.totalWeightKg === null) {
      throw new Error('Harvest Lot ต้องมีจำนวนผลหรือน้ำหนัก')
    }
    if (draft.quantityFruit !== null) {
      assertFiniteNonNegative(draft.quantityFruit, 'จำนวนผล')
      if (!Number.isInteger(draft.quantityFruit)) throw new Error('จำนวนผลต้องเป็นจำนวนเต็ม')
    }
    if (draft.totalWeightKg !== null) assertFiniteNonNegative(draft.totalWeightKg, 'น้ำหนัก')
  }
  const gradeWeight = roundQuantity(draft.grades.reduce((sum, grade) => sum + grade.weightKg, 0))
  const gradeQuantity = draft.grades.reduce((sum, grade) => sum + grade.quantityFruit, 0)
  for (const grade of draft.grades) {
    requiredText(grade.gradeCode, 'เกรด')
    assertFiniteNonNegative(grade.weightKg, 'น้ำหนักเกรด')
    assertFiniteNonNegative(grade.quantityFruit, 'จำนวนผลตามเกรด')
  }
  if (draft.totalWeightKg !== null && gradeWeight > roundQuantity(draft.totalWeightKg)) {
    throw new Error('น้ำหนักรวมตามเกรดมากกว่าน้ำหนัก Harvest Lot')
  }
  if (draft.quantityFruit !== null && gradeQuantity > draft.quantityFruit) {
    throw new Error('จำนวนผลรวมตามเกรดมากกว่าจำนวนผล Harvest Lot')
  }
  return {
    ...draft,
    cropCycleId: requiredText(draft.cropCycleId, 'Crop Cycle'),
    lotCode: requiredText(draft.lotCode, 'รหัส Harvest Lot'),
    positionIds: [...draft.positionIds],
    zoneCodes: [...draft.zoneCodes],
    totalWeightKg: draft.totalWeightKg === null ? null : roundQuantity(draft.totalWeightKg),
    grades: draft.grades.map((grade) => ({
      ...grade,
      gradeCode: grade.gradeCode.trim(),
      weightKg: roundQuantity(grade.weightKg),
    })),
    note: draft.note.trim(),
  }
}

export function validateSalesLot(draft: SalesLotDraft): SalesLotDraft {
  if (draft.soldOn !== undefined) assertIsoDate(draft.soldOn, 'วันที่ขาย')
  assertUnique(draft.allocations.map((item) => item.harvestLotId), 'Harvest allocation')
  if (draft.allocations.length === 0) throw new Error('Sales Lot ต้องอ้างอิง Harvest Lot')
  for (const allocation of draft.allocations) {
    requiredText(allocation.harvestLotId, 'Harvest Lot')
    if (!Number.isFinite(allocation.weightKg) || allocation.weightKg <= 0) {
      throw new Error('น้ำหนักที่แบ่งจาก Harvest Lot ต้องมากกว่า 0')
    }
  }
  if (draft.quantityFruit !== null) {
    assertFiniteNonNegative(draft.quantityFruit, 'จำนวนผลขาย')
    if (!Number.isInteger(draft.quantityFruit)) throw new Error('จำนวนผลขายต้องเป็นจำนวนเต็ม')
  }
  const allocatedWeight = roundQuantity(draft.allocations.reduce((sum, item) => sum + item.weightKg, 0))
  if (roundQuantity(draft.weightKg) !== allocatedWeight) {
    throw new Error('น้ำหนัก Sales Lot ต้องเท่ากับน้ำหนักที่แบ่งจาก Harvest Lot')
  }
  let financial: SalesLotFinancialDraft | undefined
  if (draft.financial) {
    calculateSaleAmounts(
      draft.weightKg,
      draft.financial.unitPriceBahtPerKg,
      draft.financial.depositBaht,
      draft.financial.receivedBaht,
    )
    const customerReference = requiredText(draft.financial.customerReference, 'Customer reference')
    if (/@/u.test(customerReference) || /(?:\+?\d[\s-]*){8,}/u.test(customerReference)) {
      throw new Error('Customer reference ต้องเป็นรหัสย่อเท่านั้น ห้ามใส่อีเมลหรือหมายเลขโทรศัพท์')
    }
    financial = {
      customerReference,
      unitPriceBahtPerKg: roundMoney(draft.financial.unitPriceBahtPerKg),
      depositBaht: roundMoney(draft.financial.depositBaht),
      receivedBaht: roundMoney(draft.financial.receivedBaht),
    }
  }
  return {
    ...draft,
    lotCode: requiredText(draft.lotCode, 'รหัส Sales Lot'),
    allocations: draft.allocations.map((item) => ({
      ...item,
      weightKg: roundQuantity(item.weightKg),
    })),
    weightKg: roundQuantity(draft.weightKg),
    note: draft.note.trim(),
    ...(financial ? { financial } : {}),
  }
}

export function validateInventoryMovement(
  item: InventoryItemRecord,
  input: InventoryMovementInput,
): InventoryMovementInput & { quantityDelta: number } {
  if (input.effectiveOn !== undefined) assertIsoDate(input.effectiveOn, 'วันที่เคลื่อนไหวสต็อก')
  if (input.itemId !== item.itemId) throw new Error('Inventory Item ไม่ตรงกับรายการเคลื่อนไหว')
  if (!item.lots.some((lot) => lot.lotId === input.lotId)) throw new Error('ไม่พบ Inventory Lot ใน Item นี้')
  if (input.unit !== item.baseUnit) throw new Error(`หน่วยต้องเป็น ${item.baseUnit}; ห้ามคาดเดาการแปลงหน่วย`)
  if (!Number.isFinite(input.quantity) || input.quantity === 0) throw new Error('จำนวนเคลื่อนไหวต้องไม่เป็น 0')
  if (input.movementType !== 'ADJUSTMENT' && input.quantity < 0) {
    throw new Error('Receipt/Issue ให้กรอกจำนวนเป็นค่าบวก; ระบบกำหนดทิศทางจากประเภท')
  }
  requiredText(input.reason, 'เหตุผล')
  requiredText(input.referenceId, 'Reference')
  if (input.financial?.directUnitCostBaht !== null && input.financial?.directUnitCostBaht !== undefined) {
    assertFiniteNonNegative(input.financial.directUnitCostBaht, 'ต้นทุนต่อหน่วย')
  }
  const quantity = roundQuantity(input.quantity)
  const quantityDelta = input.movementType === 'ISSUE' ? -quantity : quantity
  return {
    ...input,
    reason: input.reason.trim(),
    referenceId: input.referenceId.trim(),
    quantity,
    quantityDelta,
    ...(input.financial ? {
      financial: {
        directUnitCostBaht: input.financial.directUnitCostBaht === null
          ? null
          : roundMoney(input.financial.directUnitCostBaht),
      },
    } : {}),
  }
}

export function calculateInventoryBalances(
  items: readonly InventoryItemRecord[],
  movements: readonly InventoryMovementRecord[],
): readonly InventoryBalance[] {
  return items.flatMap((item) => item.lots.map((lot) => ({
    itemId: item.itemId,
    lotId: lot.lotId,
    balance: roundQuantity(movements
      .filter((movement) => movement.itemId === item.itemId && movement.lotId === lot.lotId)
      .reduce((sum, movement) => sum + movement.quantityDelta, 0)),
    unit: item.baseUnit,
  })))
}

export function buildTraceability(
  cropCycles: readonly CropCycleRecord[],
  harvestLots: readonly HarvestLotRecord[],
  salesLots: readonly SalesLotRecord[],
): readonly TraceabilityRow[] {
  return salesLots
    .filter((sale) => !['ARCHIVED', 'CANCELLED'].includes(sale.status))
    .flatMap((sale) => sale.allocations.map((allocation) => {
      const harvest = harvestLots.find((item) => item.harvestLotId === allocation.harvestLotId)
      if (!harvest) throw new Error(`Traceability ขาด Harvest Lot ${allocation.harvestLotId}`)
      const cycle = cropCycles.find((item) => item.cropCycleId === harvest.cropCycleId)
      if (!cycle) throw new Error(`Traceability ขาด Crop Cycle ${harvest.cropCycleId}`)
      return {
        salesLotId: sale.salesLotId,
        salesLotCode: sale.lotCode,
        harvestLotId: harvest.harvestLotId,
        harvestLotCode: harvest.lotCode,
        cropCycleId: cycle.cropCycleId,
        cropCycleCode: cycle.cycleCode,
        positionIds: [...harvest.positionIds],
        zoneCodes: [...harvest.zoneCodes],
        allocatedWeightKg: allocation.weightKg,
      }
    }))
}

export function calculateDirectCostSummary(
  movements: readonly InventoryMovementRecord[],
  financialRecords: readonly InventoryMovementFinancialRecord[],
): DirectCostSummary {
  const issued = movements.filter((item) => item.movementType === 'ISSUE')
  const financialByMovementId = new Map(financialRecords.map((record) => [record.movementId, record]))
  const costOf = (items: readonly InventoryMovementRecord[]) => roundMoney(
    items.reduce((sum, item) => sum + (financialByMovementId.get(item.movementId)?.directCostBaht ?? 0), 0),
  )
  return {
    totalIssuedCostBaht: costOf(issued),
    linkedWorkCostBaht: costOf(issued.filter((item) => item.referenceType === 'WORK_ORDER')),
    linkedCareCostBaht: costOf(issued.filter((item) => item.referenceType === 'CARE_EVENT')),
    unknownCostMovementCount: issued.filter((item) =>
      !financialByMovementId.has(item.movementId) ||
      financialByMovementId.get(item.movementId)?.directCostBaht === null,
    ).length,
  }
}

export function canReadCommercial(role: CanonicalRole): boolean {
  return role !== 'WORKER'
}

export function canRecordFruitObservation(role: CanonicalRole): boolean {
  return ['ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST'].includes(role)
}

export function canManageCommercial(role: CanonicalRole): boolean {
  return ['ORG_OWNER', 'FARM_MANAGER', 'SALES_INVENTORY'].includes(role)
}

export function canApproveCommercialCorrection(role: CanonicalRole): boolean {
  return ['ORG_OWNER', 'FARM_MANAGER'].includes(role)
}

export function canAccessCommercialFinancialData(access: FarmAccess): boolean {
  return canAccessFinancialData(access)
}

export function assertCommercialScope(
  context: CommercialMutationContext,
  record: { organizationId: string; farmId: string },
): void {
  if (context.farm.farmStatus !== 'ACTIVE' || context.farm.membershipStatus !== 'ACTIVE') {
    throw new Error('สวนหรือ membership ไม่อยู่ในสถานะที่เขียนข้อมูลได้')
  }
  if (
    record.organizationId !== context.farm.organizationId ||
    record.farmId !== context.farm.farmId
  ) {
    throw new Error('ปฏิเสธการอ่านหรือเขียนข้อมูลข้ามสวน')
  }
}

export function createCommercialRecordId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`
}
