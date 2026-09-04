import type { AnnualCycleRepository, CommercialTraceabilityRepository } from '../contracts'
import annualCyclePack from '../../../scripts/seed-data/annual-cycle-mock-data-pack-v1.0.json'
import phase5Pack from '../../../scripts/seed-data/phase5-mock-data-pack-v1.0.json'
import {
  assertCommercialScope,
  assertCropStageTransition,
  buildTraceability,
  calculateDirectCostSummary,
  calculateInventoryBalances,
  calculateSaleAmounts,
  canAccessCommercialFinancialData,
  canApproveCommercialCorrection,
  canManageCommercial,
  canReadCommercial,
  canRecordFruitObservation,
  createCommercialRecordId,
  roundQuantity,
  validateFruitObservation,
  validateCropCycle,
  validateHarvestLot,
  validateInventoryMovement,
  validateSalesLot,
  type CommercialAlert,
  type CommercialAuditEvent,
  type CommercialFinancialAuditEvent,
  type CommercialMutationContext,
  type CommercialSnapshot,
  type CropCycleRecord,
  type CropCycleDraft,
  type CropStage,
  type FruitObservationDraft,
  type FruitObservationRecord,
  type HarvestLotDraft,
  type HarvestLotRecord,
  type InventoryItemRecord,
  type InventoryMovementInput,
  type InventoryMovementFinancialRecord,
  type InventoryMovementRecord,
  type SalesCorrectionInput,
  type SalesLotDraft,
  type SalesLotFinancialRecord,
  type SalesLotRecord,
} from '../../domain/commercialTraceability'

interface Phase5PackShape {
  cropCycles: CropCycleRecord[]
  fruitObservations: FruitObservationRecord[]
  harvestLots: HarvestLotRecord[]
  salesLots: SalesLotRecord[]
  salesFinancials: SalesLotFinancialRecord[]
  inventoryItems: InventoryItemRecord[]
  inventoryMovements: InventoryMovementRecord[]
  inventoryMovementFinancials: InventoryMovementFinancialRecord[]
}

const fixedTimeLabel = '31 ส.ค. 2569 · เวลาจำลองคงที่'

function clonePack(): Phase5PackShape {
  return structuredClone(phase5Pack) as unknown as Phase5PackShape
}

function copy<T>(value: T): T {
  return structuredClone(value)
}

function operationKey(context: CommercialMutationContext, idempotencyKey: string): string {
  const key = idempotencyKey.trim()
  if (!key) throw new Error('ต้องมี idempotency key')
  return `${context.farm.organizationId}:${context.farm.farmId}:${key}`
}

function auditEvent(
  context: CommercialMutationContext,
  recordKind: CommercialAuditEvent['recordKind'],
  recordId: string,
  eventType: CommercialAuditEvent['eventType'],
  reason: string,
  beforeSummary: string,
  afterSummary: string,
  recordVersion: number,
): CommercialAuditEvent {
  return {
    eventId: createCommercialRecordId('commercial_event'),
    recordKind,
    recordId,
    eventType,
    actorUserId: context.actor.userId,
    actorDisplayName: context.actor.displayName,
    reason,
    beforeSummary,
    afterSummary,
    recordVersion,
    createdAtLabel: fixedTimeLabel,
  }
}

function financialAuditEvent(
  context: CommercialMutationContext,
  recordKind: CommercialFinancialAuditEvent['recordKind'],
  recordId: string,
  eventType: CommercialFinancialAuditEvent['eventType'],
  reason: string,
  beforeSummary: string,
  afterSummary: string,
  recordVersion: number,
  amountBaht: number | null,
): CommercialFinancialAuditEvent {
  return {
    ...auditEvent(
      context,
      recordKind,
      recordId,
      eventType,
      reason,
      beforeSummary,
      afterSummary,
      recordVersion,
    ),
    organizationId: context.farm.organizationId,
    farmId: context.farm.farmId,
    amountBaht,
    exampleData: true,
  }
}

export class MockCommercialTraceabilityRepository implements CommercialTraceabilityRepository {
  constructor(private readonly annualCycleRepository?: AnnualCycleRepository) {}

  private pack = clonePack()
  private readonly completedOperations = new Map<string, unknown>()
  private audit: CommercialAuditEvent[] = []
  private financialAudit: CommercialFinancialAuditEvent[] = []

  private recordsForFarm<T extends { organizationId: string; farmId: string }>(
    context: CommercialMutationContext,
    records: readonly T[],
  ): T[] {
    if (!canReadCommercial(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์อ่านข้อมูลผลผลิตเชิงพาณิชย์')
    return records.filter((record) =>
      record.organizationId === context.farm.organizationId && record.farmId === context.farm.farmId,
    )
  }

  private requiredFarmRecord<T extends { organizationId: string; farmId: string }>(
    context: CommercialMutationContext,
    records: readonly T[],
    predicate: (record: T) => boolean,
    label: string,
  ): T {
    const record = records.find(predicate)
    if (!record) throw new Error(`ไม่พบ${label}`)
    assertCommercialScope(context, record)
    return record
  }

  private existingOperation<T>(context: CommercialMutationContext, idempotencyKey: string): T | undefined {
    const existing = this.completedOperations.get(operationKey(context, idempotencyKey))
    return existing === undefined ? undefined : copy(existing as T)
  }

  private completeOperation<T>(
    context: CommercialMutationContext,
    idempotencyKey: string,
    result: T,
  ): T {
    this.completedOperations.set(operationKey(context, idempotencyKey), copy(result))
    return copy(result)
  }

  private alertsFor(
    items: readonly InventoryItemRecord[],
    balances: CommercialSnapshot['inventoryBalances'],
  ): CommercialAlert[] {
    const alerts: CommercialAlert[] = []
    const fixedNow = new Date('2026-08-31T00:00:00+07:00').getTime()
    const expiryWindow = 30 * 24 * 60 * 60 * 1000
    for (const item of items.filter((candidate) => candidate.status === 'ACTIVE')) {
      const itemBalance = balances
        .filter((balance) => balance.itemId === item.itemId)
        .reduce((sum, balance) => sum + balance.balance, 0)
      if (itemBalance <= item.reorderLevel) {
        alerts.push({
          alertId: `low:${item.itemId}`,
          kind: 'LOW_STOCK',
          itemId: item.itemId,
          title: `${item.name} ใกล้หมด`,
          description: `${itemBalance} ${item.baseUnit} · จุดสั่งเพิ่ม ${item.reorderLevel} ${item.baseUnit}`,
        })
      }
      for (const lot of item.lots) {
        if (!lot.expiresOn) continue
        const expires = new Date(`${lot.expiresOn}T00:00:00+07:00`).getTime()
        if (expires >= fixedNow && expires - fixedNow <= expiryWindow) {
          alerts.push({
            alertId: `expiry:${item.itemId}:${lot.lotId}`,
            kind: 'EXPIRING',
            itemId: item.itemId,
            title: `${item.name} ใกล้หมดอายุ`,
            description: `${lot.lotCode} · ${lot.expiresOn} · SIMULATED/TEST ONLY`,
          })
        }
      }
    }
    return alerts
  }

  async listSnapshot(context: CommercialMutationContext): Promise<CommercialSnapshot> {
    const cropCycles = this.recordsForFarm(context, this.pack.cropCycles)
    const fruitObservations = this.recordsForFarm(context, this.pack.fruitObservations)
    const harvestLots = this.recordsForFarm(context, this.pack.harvestLots)
    const salesLots = this.recordsForFarm(context, this.pack.salesLots)
    const inventoryItems = this.recordsForFarm(context, this.pack.inventoryItems)
    const inventoryMovements = this.recordsForFarm(context, this.pack.inventoryMovements)
    const inventoryBalances = calculateInventoryBalances(inventoryItems, inventoryMovements)
    if (inventoryBalances.some((balance) => balance.balance < 0)) {
      throw new Error('Critical: พบยอดสต็อกติดลบใน Mock Data Pack')
    }
    const financial = canAccessCommercialFinancialData(context.farm) ? {
      salesLots: this.pack.salesFinancials.filter((record) =>
        record.organizationId === context.farm.organizationId && record.farmId === context.farm.farmId),
      inventoryMovements: this.pack.inventoryMovementFinancials.filter((record) =>
        record.organizationId === context.farm.organizationId && record.farmId === context.farm.farmId),
      directCostSummary: calculateDirectCostSummary(
        inventoryMovements,
        this.pack.inventoryMovementFinancials.filter((record) =>
          record.organizationId === context.farm.organizationId && record.farmId === context.farm.farmId),
      ),
      audit: this.financialAudit.filter((event) =>
        event.organizationId === context.farm.organizationId && event.farmId === context.farm.farmId),
    } : null
    return Promise.resolve(copy({
      cropCycles,
      fruitObservations,
      harvestLots,
      salesLots,
      inventoryItems,
      inventoryMovements,
      inventoryBalances,
      alerts: this.alertsFor(inventoryItems, inventoryBalances),
      financial,
      traceability: buildTraceability(cropCycles, harvestLots, salesLots),
    }))
  }

  async createCropCycle(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: CropCycleDraft,
  ): Promise<CropCycleRecord> {
    await Promise.resolve()
    const existing = this.existingOperation<CropCycleRecord>(context, idempotencyKey)
    if (existing) return existing
    if (!canRecordFruitObservation(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์สร้าง Crop Cycle')
    const validated = validateCropCycle(draft)
    const annualCycle = this.annualCycleRepository
      ? (await this.annualCycleRepository.listSnapshot(context, validated.annualCycleId)).cycles.find(
          (item) => item.annualCycleId === validated.annualCycleId && item.status !== 'CLOSED',
        )
      : annualCyclePack.cycles.find((item) =>
          item.organizationId === context.farm.organizationId &&
          item.farmId === context.farm.farmId &&
          item.annualCycleId === validated.annualCycleId &&
          item.status !== 'CLOSED')
    if (!annualCycle) throw new Error('ไม่พบ Annual Cycle ที่เปิดรับ Crop Cycle ในสวนนี้')
    const duplicate = this.pack.cropCycles.some((item) =>
      item.organizationId === context.farm.organizationId && item.farmId === context.farm.farmId &&
      item.cycleCode.toUpperCase() === validated.cycleCode.toUpperCase())
    if (duplicate) throw new Error('รหัส Crop Cycle ซ้ำในสวนนี้')
    const record: CropCycleRecord = {
      ...validated,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      cropCycleId: createCommercialRecordId('crop'),
      status: 'ACTIVE',
      version: 1,
      exampleData: true,
    }
    this.pack.cropCycles.unshift(record)
    return this.completeOperation(context, idempotencyKey, record)
  }

  async advanceCropCycleStage(
    context: CommercialMutationContext,
    cropCycleId: string,
    idempotencyKey: string,
    nextStage: CropStage,
  ): Promise<CropCycleRecord> {
    await Promise.resolve()
    const existing = this.existingOperation<CropCycleRecord>(context, idempotencyKey)
    if (existing) return existing
    if (!canRecordFruitObservation(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์เปลี่ยน Crop stage')
    const record = this.requiredFarmRecord(
      context, this.pack.cropCycles,
      (item) => item.cropCycleId === cropCycleId && item.status === 'ACTIVE',
      ' Crop Cycle',
    )
    assertCropStageTransition(record.stage, nextStage)
    record.stage = nextStage
    record.version += 1
    return this.completeOperation(context, idempotencyKey, record)
  }

  async createFruitObservation(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: FruitObservationDraft,
  ): Promise<FruitObservationRecord> {
    const existing = this.existingOperation<FruitObservationRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canRecordFruitObservation(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์บันทึกจำนวนผล')
    const validated = validateFruitObservation(draft)
    this.requiredFarmRecord(
      context, this.pack.cropCycles,
      (cycle) => cycle.cropCycleId === validated.cropCycleId && cycle.status === 'ACTIVE',
      ' Crop Cycle ที่ใช้งานได้',
    )
    const record: FruitObservationRecord = {
      ...validated,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      observationId: createCommercialRecordId('fruit_obs'),
      unit: 'fruit',
      actorUserId: context.actor.userId,
      createdAtLabel: fixedTimeLabel,
      archivedAtLabel: null,
      version: 1,
      exampleData: true,
    }
    this.pack.fruitObservations.unshift(record)
    this.audit.unshift(auditEvent(
      context, 'FRUIT_OBSERVATION', record.observationId, 'CREATED',
      record.confidenceNote, '',
      `${record.countingMode}:${record.valueQuality}:${record.observedCount ?? 'UNKNOWN'} fruit:${record.sourceCountSessionId ?? 'NO_AI_SESSION'}`,
      1,
    ))
    return Promise.resolve(this.completeOperation(context, idempotencyKey, record))
  }

  async archiveFruitObservation(
    context: CommercialMutationContext,
    observationId: string,
    idempotencyKey: string,
    reason: string,
  ): Promise<FruitObservationRecord> {
    const existing = this.existingOperation<FruitObservationRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canApproveCommercialCorrection(context.farm.role)) throw new Error('เฉพาะ Owner/Manager ที่ Archive observation ได้')
    const record = this.requiredFarmRecord(
      context, this.pack.fruitObservations,
      (item) => item.observationId === observationId,
      ' Fruit Observation',
    )
    if (!reason.trim()) throw new Error('ต้องระบุเหตุผล Archive')
    if (!record.archivedAtLabel) {
      record.archivedAtLabel = fixedTimeLabel
      record.version += 1
      this.audit.unshift(auditEvent(
        context, 'FRUIT_OBSERVATION', record.observationId, 'ARCHIVED', reason.trim(),
        'ACTIVE', 'ARCHIVED', record.version,
      ))
    }
    return Promise.resolve(this.completeOperation(context, idempotencyKey, record))
  }

  async createHarvestLot(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: HarvestLotDraft,
  ): Promise<HarvestLotRecord> {
    const existing = this.existingOperation<HarvestLotRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canManageCommercial(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์สร้าง Harvest Lot')
    const validated = validateHarvestLot(draft)
    this.requiredFarmRecord(context, this.pack.cropCycles,
      (cycle) => cycle.cropCycleId === validated.cropCycleId && cycle.status === 'ACTIVE', ' Crop Cycle')
    const duplicateCode = this.pack.harvestLots.some((item) =>
      item.organizationId === context.farm.organizationId && item.farmId === context.farm.farmId &&
      item.lotCode.toUpperCase() === validated.lotCode.toUpperCase())
    if (duplicateCode) throw new Error('รหัส Harvest Lot ซ้ำในสวนนี้')
    const record: HarvestLotRecord = {
      ...validated,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      harvestLotId: createCommercialRecordId('harvest'),
      status: validated.grades.length > 0 ? 'GRADED' : 'HARVESTING',
      soldWeightKg: 0,
      actorUserId: context.actor.userId,
      createdAtLabel: fixedTimeLabel,
      version: 1,
      exampleData: true,
      audit: [],
    }
    const event = auditEvent(context, 'HARVEST_LOT', record.harvestLotId, 'CREATED',
      record.note, '', `${record.totalWeightKg ?? 'UNKNOWN'} kg`, 1)
    record.audit = [event]
    this.audit.unshift(event)
    this.pack.harvestLots.unshift(record)
    return Promise.resolve(this.completeOperation(context, idempotencyKey, record))
  }

  async createSalesLot(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: SalesLotDraft,
  ): Promise<SalesLotRecord> {
    const existing = this.existingOperation<SalesLotRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canManageCommercial(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์สร้าง Sales Lot')
    const validated = validateSalesLot(draft)
    const harvests = validated.allocations.map((allocation) => {
      const harvest = this.requiredFarmRecord(
        context, this.pack.harvestLots,
        (item) => item.harvestLotId === allocation.harvestLotId,
        ' Harvest Lot',
      )
      if (harvest.status === 'ARCHIVED') throw new Error('ไม่อนุญาตใช้ Harvest Lot ที่ Archive แล้ว')
      if (harvest.totalWeightKg === null) throw new Error('Harvest Lot ยังไม่มีน้ำหนักที่ใช้แบ่งขายได้')
      const available = roundQuantity(harvest.totalWeightKg - harvest.soldWeightKg)
      if (allocation.weightKg > available) throw new Error(`น้ำหนักขายเกินยอดคงเหลือของ ${harvest.lotCode}`)
      return { allocation, harvest }
    })
    const duplicateCode = this.pack.salesLots.some((item) =>
      item.organizationId === context.farm.organizationId && item.farmId === context.farm.farmId &&
      item.lotCode.toUpperCase() === validated.lotCode.toUpperCase())
    if (duplicateCode) throw new Error('รหัส Sales Lot ซ้ำในสวนนี้')
    if (validated.financial && !canAccessCommercialFinancialData(context.farm)) {
      throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    }
    const { financial: financialDraft, ...operationalDraft } = validated
    const record: SalesLotRecord = {
      ...operationalDraft,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      salesLotId: createCommercialRecordId('sales'),
      status: 'CONFIRMED',
      actorUserId: context.actor.userId,
      createdAtLabel: fixedTimeLabel,
      version: 1,
      exampleData: true,
      audit: [],
    }
    const event = auditEvent(context, 'SALES_LOT', record.salesLotId, 'CREATED',
      record.note, '', `${record.weightKg} kg`, 1)
    record.audit = [event]
    if (financialDraft) {
      const amount = calculateSaleAmounts(
        record.weightKg,
        financialDraft.unitPriceBahtPerKg,
        financialDraft.depositBaht,
        financialDraft.receivedBaht,
      )
      const financialRecord: SalesLotFinancialRecord = {
        ...financialDraft,
        ...amount,
        organizationId: context.farm.organizationId,
        farmId: context.farm.farmId,
        salesLotId: record.salesLotId,
        actorUserId: context.actor.userId,
        createdAtLabel: fixedTimeLabel,
        version: 1,
        exampleData: true,
      }
      this.pack.salesFinancials.unshift(financialRecord)
      this.financialAudit.unshift(financialAuditEvent(
        context,
        'SALES_LOT',
        record.salesLotId,
        'CREATED',
        'Owner-only sale financial record',
        '',
        `${financialRecord.grossAmountBaht} THB`,
        1,
        financialRecord.grossAmountBaht,
      ))
    }
    harvests.forEach(({ allocation, harvest }) => {
      harvest.soldWeightKg = roundQuantity(harvest.soldWeightKg + allocation.weightKg)
      harvest.version += 1
      if (harvest.totalWeightKg !== null && harvest.soldWeightKg === harvest.totalWeightKg) harvest.status = 'CLOSED'
    })
    this.audit.unshift(event)
    this.pack.salesLots.unshift(record)
    return Promise.resolve(this.completeOperation(context, idempotencyKey, record))
  }

  async correctSalesLot(
    context: CommercialMutationContext,
    salesLotId: string,
    idempotencyKey: string,
    input: SalesCorrectionInput,
  ): Promise<SalesLotFinancialRecord> {
    const existing = this.existingOperation<SalesLotFinancialRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canAccessCommercialFinancialData(context.farm)) {
      throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    }
    const record = this.requiredFarmRecord(
      context, this.pack.salesLots, (item) => item.salesLotId === salesLotId, ' Sales Lot',
    )
    if (['ARCHIVED', 'CANCELLED'].includes(record.status)) throw new Error('ไม่อนุญาตแก้ Sales Lot ที่ปิดใช้งาน')
    if (!input.reason.trim()) throw new Error('Sales correction ต้องมีเหตุผล')
    if (roundQuantity(input.weightKg) !== record.weightKg) {
      throw new Error('การแก้น้ำหนักต้องสร้าง correction allocation แยก; รอบนี้แก้ได้เฉพาะยอดเงิน')
    }
    const financialRecord = this.requiredFarmRecord(
      context,
      this.pack.salesFinancials,
      (item) => item.salesLotId === salesLotId,
      ' Owner-only Sales Financial Record',
    )
    const before = `${financialRecord.unitPriceBahtPerKg}/${financialRecord.depositBaht}/${financialRecord.receivedBaht}`
    const amount = calculateSaleAmounts(
      input.weightKg, input.unitPriceBahtPerKg, input.depositBaht, input.receivedBaht,
    )
    financialRecord.unitPriceBahtPerKg = input.unitPriceBahtPerKg
    financialRecord.depositBaht = input.depositBaht
    financialRecord.receivedBaht = input.receivedBaht
    financialRecord.grossAmountBaht = amount.grossAmountBaht
    financialRecord.outstandingBaht = amount.outstandingBaht
    financialRecord.paymentStatus = amount.paymentStatus
    financialRecord.version += 1
    this.financialAudit.unshift(financialAuditEvent(
      context,
      'SALES_LOT',
      record.salesLotId,
      'CORRECTED',
      input.reason.trim(),
      before,
      `${financialRecord.unitPriceBahtPerKg}/${financialRecord.depositBaht}/${financialRecord.receivedBaht}`,
      financialRecord.version,
      financialRecord.grossAmountBaht,
    ))
    return Promise.resolve(this.completeOperation(context, idempotencyKey, financialRecord))
  }

  async archiveSalesLot(
    context: CommercialMutationContext,
    salesLotId: string,
    idempotencyKey: string,
    reason: string,
  ): Promise<SalesLotRecord> {
    const existing = this.existingOperation<SalesLotRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canApproveCommercialCorrection(context.farm.role)) throw new Error('เฉพาะ Owner/Manager ที่ Archive Sales Lot ได้')
    const record = this.requiredFarmRecord(
      context, this.pack.salesLots, (item) => item.salesLotId === salesLotId, ' Sales Lot',
    )
    if (!reason.trim()) throw new Error('ต้องระบุเหตุผล Archive')
    if (record.status !== 'ARCHIVED') {
      record.allocations.forEach((allocation) => {
        const harvest = this.requiredFarmRecord(
          context, this.pack.harvestLots,
          (item) => item.harvestLotId === allocation.harvestLotId,
          ' Harvest Lot',
        )
        harvest.soldWeightKg = roundQuantity(harvest.soldWeightKg - allocation.weightKg)
        harvest.status = harvest.grades.length > 0 ? 'GRADED' : 'HARVESTING'
        harvest.version += 1
      })
      const before = record.status
      record.status = 'ARCHIVED'
      record.version += 1
      const event = auditEvent(context, 'SALES_LOT', record.salesLotId, 'ARCHIVED',
        reason.trim(), before, 'ARCHIVED', record.version)
      record.audit = [event, ...record.audit]
      this.audit.unshift(event)
    }
    return Promise.resolve(this.completeOperation(context, idempotencyKey, record))
  }

  async recordInventoryMovement(
    context: CommercialMutationContext,
    idempotencyKey: string,
    input: InventoryMovementInput,
  ): Promise<InventoryMovementRecord> {
    const existing = this.existingOperation<InventoryMovementRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canManageCommercial(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์ทำรายการสต็อก')
    if (input.movementType === 'ADJUSTMENT' && !canApproveCommercialCorrection(context.farm.role)) {
      throw new Error('Stock adjustment ต้องให้ Owner/Manager ดำเนินการตาม conservative policy')
    }
    const item = this.requiredFarmRecord(
      context, this.pack.inventoryItems, (candidate) => candidate.itemId === input.itemId, ' Inventory Item',
    )
    if (item.status === 'ARCHIVED') throw new Error('ไม่อนุญาตเคลื่อนไหว Item ที่ Archive แล้ว')
    const validated = validateInventoryMovement(item, input)
    if (validated.financial && !canAccessCommercialFinancialData(context.farm)) {
      throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    }
    const currentBalances = calculateInventoryBalances(
      [item],
      this.recordsForFarm(context, this.pack.inventoryMovements).filter((movement) => movement.itemId === item.itemId),
    )
    const current = currentBalances.find((balance) => balance.lotId === input.lotId)?.balance ?? 0
    if (roundQuantity(current + validated.quantityDelta) < 0) {
      throw new Error('นโยบาย Phase 5 ปฏิเสธสต็อกติดลบ')
    }
    const { financial: financialDraft, ...operationalInput } = validated
    const record: InventoryMovementRecord = {
      ...operationalInput,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      movementId: createCommercialRecordId('inventory_move'),
      actorUserId: context.actor.userId,
      createdAtLabel: fixedTimeLabel,
      version: 1,
      exampleData: true,
      audit: [],
    }
    const event = auditEvent(context, 'INVENTORY_MOVEMENT', record.movementId, 'STOCK_RECORDED',
      record.reason, `${current} ${record.unit}`, `${roundQuantity(current + record.quantityDelta)} ${record.unit}`, 1)
    record.audit = [event]
    if (financialDraft) {
      const financialRecord: InventoryMovementFinancialRecord = {
        ...financialDraft,
        organizationId: context.farm.organizationId,
        farmId: context.farm.farmId,
        movementId: record.movementId,
        directCostBaht: financialDraft.directUnitCostBaht === null
          ? null
          : Math.round((Math.abs(record.quantityDelta) * financialDraft.directUnitCostBaht + Number.EPSILON) * 100) / 100,
        actorUserId: context.actor.userId,
        createdAtLabel: fixedTimeLabel,
        version: 1,
        exampleData: true,
      }
      this.pack.inventoryMovementFinancials.unshift(financialRecord)
      this.financialAudit.unshift(financialAuditEvent(
        context,
        'INVENTORY_MOVEMENT',
        record.movementId,
        'STOCK_RECORDED',
        'Owner-only inventory cost record',
        '',
        `${financialRecord.directCostBaht ?? 'UNKNOWN'} THB`,
        1,
        financialRecord.directCostBaht,
      ))
    }
    this.audit.unshift(event)
    this.pack.inventoryMovements.unshift(record)
    return Promise.resolve(this.completeOperation(context, idempotencyKey, record))
  }

  async listCommercialAudit(context: CommercialMutationContext): Promise<readonly CommercialAuditEvent[]> {
    if (!['ORG_OWNER', 'FARM_MANAGER', 'AUDITOR'].includes(context.farm.role)) {
      throw new Error('บทบาทนี้ไม่มีสิทธิ์อ่าน Commercial audit')
    }
    return Promise.resolve(copy(this.audit.filter((event) => {
      const record = [
        ...this.pack.fruitObservations,
        ...this.pack.harvestLots,
        ...this.pack.salesLots,
        ...this.pack.inventoryMovements,
      ].find((candidate) =>
        'observationId' in candidate && candidate.observationId === event.recordId ||
        'harvestLotId' in candidate && candidate.harvestLotId === event.recordId ||
        'salesLotId' in candidate && candidate.salesLotId === event.recordId ||
        'movementId' in candidate && candidate.movementId === event.recordId)
      return record?.organizationId === context.farm.organizationId && record.farmId === context.farm.farmId
    })))
  }

  async resetMockPack(): Promise<void> {
    this.pack = clonePack()
    this.completedOperations.clear()
    this.audit = []
    this.financialAudit = []
    return Promise.resolve()
  }
}
