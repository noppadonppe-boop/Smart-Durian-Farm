import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from 'firebase/firestore'

import type { CommercialTraceabilityRepository } from '../../adapters/contracts'
import {
  assertCommercialScope,
  assertCropStageTransition,
  buildTraceability,
  calculateDirectCostSummary,
  calculateInventoryBalances,
  calculateSaleAmounts,
  canApproveCommercialCorrection,
  canManageCommercial,
  canReadCommercial,
  canRecordFruitObservation,
  createCommercialRecordId,
  roundQuantity,
  validateCropCycle,
  validateFruitObservation,
  validateHarvestLot,
  validateInventoryMovement,
  validateSalesLot,
  type CommercialAlert,
  type CommercialAuditEvent,
  type CommercialMutationContext,
  type CommercialSnapshot,
  type CropCycleDraft,
  type CropCycleRecord,
  type CropStage,
  type FruitObservationDraft,
  type FruitObservationRecord,
  type HarvestLotDraft,
  type HarvestLotRecord,
  type InventoryItemRecord,
  type InventoryMovementInput,
  type InventoryMovementRecord,
  type SalesCorrectionInput,
  type SalesLotDraft,
  type SalesLotRecord,
} from '../../domain/commercialTraceability'
import { rootDoc } from './firebaseDataRoot'

const fixedTimeLabel = '31 ส.ค. 2569 · Local Emulator'

function copy<T>(value: T): T {
  return structuredClone(value)
}

function operationId(context: CommercialMutationContext, key: string): string {
  const normalized = `${context.actor.userId}_${key.trim()}`.replace(/[^A-Za-z0-9_-]/gu, '_')
  if (!key.trim() || normalized.length > 180) throw new Error('idempotency key ไม่ถูกต้อง')
  return normalized
}

function parseRecord<T extends { organizationId: string; farmId: string; exampleData: true }>(
  data: DocumentData,
  context: CommercialMutationContext,
): T {
  if (data.exampleData !== true || typeof data.organizationId !== 'string' || typeof data.farmId !== 'string') {
    throw new Error('เอกสาร Emulator ไม่ใช่ SIMULATED/TEST ONLY record ที่ถูกต้อง')
  }
  const record = data as T
  assertCommercialScope(context, record)
  return copy(record)
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

export class FirebaseCommercialTraceabilityRepository implements CommercialTraceabilityRepository {
  constructor(private readonly firestore: Firestore) {}

  private farmReference(context: CommercialMutationContext) {
    return rootDoc(
      this.firestore,
      'organizations', context.farm.organizationId,
      'farms', context.farm.farmId,
    )
  }

  private recordReference(
    context: CommercialMutationContext,
    collectionName: string,
    recordId: string,
  ): DocumentReference<DocumentData> {
    return doc(this.farmReference(context), collectionName, recordId)
  }

  private operationReference(context: CommercialMutationContext, key: string) {
    return this.recordReference(context, 'commercialOperations', operationId(context, key))
  }

  private async listCollection<T extends { organizationId: string; farmId: string; exampleData: true }>(
    context: CommercialMutationContext,
    collectionName: string,
  ): Promise<T[]> {
    const result = await getDocs(collection(this.farmReference(context), collectionName))
    return result.docs.map((snapshot) => parseRecord<T>(snapshot.data(), context))
  }

  private setOperation(
    transaction: Transaction,
    context: CommercialMutationContext,
    key: string,
    resultCollection: string,
    resultId: string,
  ): void {
    transaction.set(this.operationReference(context, key), {
      operationId: operationId(context, key),
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      actorUserId: context.actor.userId,
      resultCollection,
      resultId,
      exampleData: true,
      createdAt: serverTimestamp(),
    })
  }

  private writeAudit(
    transaction: Transaction,
    context: CommercialMutationContext,
    event: CommercialAuditEvent,
  ): void {
    transaction.set(this.recordReference(context, 'commercialAuditEvents', event.eventId), {
      ...event,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      exampleData: true,
      createdAt: serverTimestamp(),
    })
  }

  private alertsFor(
    items: readonly InventoryItemRecord[],
    balances: CommercialSnapshot['inventoryBalances'],
  ): CommercialAlert[] {
    const now = new Date('2026-08-31T00:00:00+07:00').getTime()
    const windowMs = 30 * 24 * 60 * 60 * 1000
    return items.flatMap((item) => {
      if (item.status !== 'ACTIVE') return []
      const alerts: CommercialAlert[] = []
      const balance = balances.filter((entry) => entry.itemId === item.itemId)
        .reduce((sum, entry) => sum + entry.balance, 0)
      if (balance <= item.reorderLevel) alerts.push({
        alertId: `low:${item.itemId}`, kind: 'LOW_STOCK', itemId: item.itemId,
        title: `${item.name} ใกล้หมด`, description: `${balance} ${item.baseUnit}`,
      })
      item.lots.forEach((lot) => {
        if (!lot.expiresOn) return
        const expires = new Date(`${lot.expiresOn}T00:00:00+07:00`).getTime()
        if (expires >= now && expires - now <= windowMs) alerts.push({
          alertId: `expiry:${item.itemId}:${lot.lotId}`, kind: 'EXPIRING', itemId: item.itemId,
          title: `${item.name} ใกล้หมดอายุ`, description: `${lot.lotCode} · ${lot.expiresOn}`,
        })
      })
      return alerts
    })
  }

  async listSnapshot(context: CommercialMutationContext): Promise<CommercialSnapshot> {
    if (!canReadCommercial(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์อ่านข้อมูลผลผลิตเชิงพาณิชย์')
    const [cropCycles, fruitObservations, harvestLots, salesLots, inventoryItems, inventoryMovements] = await Promise.all([
      this.listCollection<CropCycleRecord>(context, 'cropCycles'),
      this.listCollection<FruitObservationRecord>(context, 'fruitObservations'),
      this.listCollection<HarvestLotRecord>(context, 'harvestLots'),
      this.listCollection<SalesLotRecord>(context, 'salesLots'),
      this.listCollection<InventoryItemRecord>(context, 'inventoryItems'),
      this.listCollection<InventoryMovementRecord>(context, 'inventoryMovements'),
    ])
    const inventoryBalances = calculateInventoryBalances(inventoryItems, inventoryMovements)
    if (inventoryBalances.some((entry) => entry.balance < 0)) throw new Error('Critical: พบยอดสต็อกติดลบใน Emulator')
    return {
      cropCycles, fruitObservations, harvestLots, salesLots, inventoryItems, inventoryMovements,
      inventoryBalances,
      alerts: this.alertsFor(inventoryItems, inventoryBalances),
      directCostSummary: calculateDirectCostSummary(inventoryMovements),
      traceability: buildTraceability(cropCycles, harvestLots, salesLots),
    }
  }

  async createCropCycle(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: CropCycleDraft,
  ): Promise<CropCycleRecord> {
    if (!canRecordFruitObservation(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์สร้าง Crop Cycle')
    const validated = validateCropCycle(draft)
    const duplicate = await getDocs(query(
      collection(this.farmReference(context), 'cropCycles'),
      where('cycleCode', '==', validated.cycleCode),
    ))
    if (!duplicate.empty) throw new Error('รหัส Crop Cycle ซ้ำในสวนนี้')
    const record: CropCycleRecord = { ...validated, organizationId: context.farm.organizationId,
      farmId: context.farm.farmId, cropCycleId: createCommercialRecordId('crop'), status: 'ACTIVE',
      version: 1, exampleData: true }
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      if (operation.exists()) {
        const existing = await transaction.get(this.recordReference(context, 'cropCycles', String(operation.data().resultId)))
        return parseRecord<CropCycleRecord>(existing.data() ?? {}, context)
      }
      transaction.set(this.recordReference(context, 'cropCycles', record.cropCycleId), {
        ...record, actorUserId: context.actor.userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      this.setOperation(transaction, context, idempotencyKey, 'cropCycles', record.cropCycleId)
      return record
    })
  }

  async advanceCropCycleStage(
    context: CommercialMutationContext,
    cropCycleId: string,
    idempotencyKey: string,
    nextStage: CropStage,
  ): Promise<CropCycleRecord> {
    if (!canRecordFruitObservation(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์เปลี่ยน Crop stage')
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      const reference = this.recordReference(context, 'cropCycles', cropCycleId)
      if (operation.exists()) return parseRecord<CropCycleRecord>((await transaction.get(reference)).data() ?? {}, context)
      const current = parseRecord<CropCycleRecord>((await transaction.get(reference)).data() ?? {}, context)
      assertCropStageTransition(current.stage, nextStage)
      const updated = { ...current, stage: nextStage, version: current.version + 1 }
      transaction.update(reference, { stage: nextStage, version: updated.version,
        actorUserId: context.actor.userId, updatedAt: serverTimestamp() })
      this.setOperation(transaction, context, idempotencyKey, 'cropCycles', cropCycleId)
      return updated
    })
  }

  async createFruitObservation(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: FruitObservationDraft,
  ): Promise<FruitObservationRecord> {
    if (!canRecordFruitObservation(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์บันทึกจำนวนผล')
    const validated = validateFruitObservation(draft)
    const observationId = createCommercialRecordId('fruit_obs')
    const record: FruitObservationRecord = { ...validated, organizationId: context.farm.organizationId,
      farmId: context.farm.farmId, observationId, unit: 'fruit', actorUserId: context.actor.userId,
      createdAtLabel: fixedTimeLabel, archivedAtLabel: null, version: 1, exampleData: true }
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      if (operation.exists()) return parseRecord<FruitObservationRecord>((await transaction.get(
        this.recordReference(context, 'fruitObservations', String(operation.data().resultId)),
      )).data() ?? {}, context)
      const cycle = await transaction.get(this.recordReference(context, 'cropCycles', validated.cropCycleId))
      if (!cycle.exists() || cycle.data().status !== 'ACTIVE') throw new Error('ไม่พบ Crop Cycle ที่ใช้งานได้')
      const event = auditEvent(context, 'FRUIT_OBSERVATION', observationId, 'CREATED',
        record.confidenceNote, '',
        `${record.countingMode}:${record.valueQuality}:${record.observedCount ?? 'UNKNOWN'}:${record.sourceCountSessionId ?? 'NO_AI_SESSION'}`,
        1)
      transaction.set(this.recordReference(context, 'fruitObservations', observationId), {
        ...record, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      this.writeAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'fruitObservations', observationId)
      return record
    })
  }

  async archiveFruitObservation(
    context: CommercialMutationContext,
    observationId: string,
    idempotencyKey: string,
    reason: string,
  ): Promise<FruitObservationRecord> {
    if (!canApproveCommercialCorrection(context.farm.role)) throw new Error('เฉพาะ Owner/Manager ที่ Archive observation ได้')
    if (!reason.trim()) throw new Error('ต้องระบุเหตุผล Archive')
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      const reference = this.recordReference(context, 'fruitObservations', observationId)
      if (operation.exists()) return parseRecord<FruitObservationRecord>((await transaction.get(reference)).data() ?? {}, context)
      const current = parseRecord<FruitObservationRecord>((await transaction.get(reference)).data() ?? {}, context)
      const updated = { ...current, archivedAtLabel: fixedTimeLabel, version: current.version + 1 }
      const event = auditEvent(context, 'FRUIT_OBSERVATION', observationId, 'ARCHIVED', reason.trim(), 'ACTIVE', 'ARCHIVED', updated.version)
      transaction.update(reference, { archivedAtLabel: fixedTimeLabel, version: updated.version,
        actorUserId: context.actor.userId, updatedAt: serverTimestamp() })
      this.writeAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'fruitObservations', observationId)
      return updated
    })
  }

  async createHarvestLot(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: HarvestLotDraft,
  ): Promise<HarvestLotRecord> {
    if (!canManageCommercial(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์สร้าง Harvest Lot')
    const validated = validateHarvestLot(draft)
    const harvestLotId = createCommercialRecordId('harvest')
    const record: HarvestLotRecord = { ...validated, organizationId: context.farm.organizationId,
      farmId: context.farm.farmId, harvestLotId, status: validated.grades.length ? 'GRADED' : 'HARVESTING',
      soldWeightKg: 0, actorUserId: context.actor.userId, createdAtLabel: fixedTimeLabel,
      version: 1, exampleData: true, audit: [] }
    const event = auditEvent(context, 'HARVEST_LOT', harvestLotId, 'CREATED', record.note, '', `${record.totalWeightKg ?? 'UNKNOWN'} kg`, 1)
    record.audit = [event]
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      if (operation.exists()) return parseRecord<HarvestLotRecord>((await transaction.get(
        this.recordReference(context, 'harvestLots', String(operation.data().resultId)),
      )).data() ?? {}, context)
      const cycle = await transaction.get(this.recordReference(context, 'cropCycles', record.cropCycleId))
      if (!cycle.exists() || cycle.data().status !== 'ACTIVE') throw new Error('ไม่พบ Crop Cycle')
      transaction.set(this.recordReference(context, 'harvestLots', harvestLotId), {
        ...record, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      this.writeAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'harvestLots', harvestLotId)
      return record
    })
  }

  async createSalesLot(
    context: CommercialMutationContext,
    idempotencyKey: string,
    draft: SalesLotDraft,
  ): Promise<SalesLotRecord> {
    if (!canManageCommercial(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์สร้าง Sales Lot')
    const validated = validateSalesLot(draft)
    const salesLotId = createCommercialRecordId('sales')
    const amount = calculateSaleAmounts(validated.weightKg, validated.unitPriceBahtPerKg, validated.depositBaht, validated.receivedBaht)
    const record: SalesLotRecord = { ...validated, ...amount, organizationId: context.farm.organizationId,
      farmId: context.farm.farmId, salesLotId, actorUserId: context.actor.userId,
      createdAtLabel: fixedTimeLabel, version: 1, exampleData: true, audit: [] }
    const event = auditEvent(context, 'SALES_LOT', salesLotId, 'CREATED', 'Customer reference only', '', `${record.grossAmountBaht} THB`, 1)
    record.audit = [event]
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      if (operation.exists()) return parseRecord<SalesLotRecord>((await transaction.get(
        this.recordReference(context, 'salesLots', String(operation.data().resultId)),
      )).data() ?? {}, context)
      const harvests: Array<{ reference: DocumentReference<DocumentData>; record: HarvestLotRecord; weightKg: number }> = []
      for (const allocation of record.allocations) {
        const reference = this.recordReference(context, 'harvestLots', allocation.harvestLotId)
        const harvest = parseRecord<HarvestLotRecord>((await transaction.get(reference)).data() ?? {}, context)
        if (harvest.totalWeightKg === null || allocation.weightKg > harvest.totalWeightKg - harvest.soldWeightKg) {
          throw new Error(`น้ำหนักขายเกินยอดคงเหลือของ ${harvest.lotCode}`)
        }
        harvests.push({ reference, record: harvest, weightKg: allocation.weightKg })
      }
      harvests.forEach((entry) => {
        const soldWeightKg = roundQuantity(entry.record.soldWeightKg + entry.weightKg)
        transaction.update(entry.reference, { soldWeightKg, version: entry.record.version + 1,
          status: soldWeightKg === entry.record.totalWeightKg ? 'CLOSED' : entry.record.status,
          actorUserId: context.actor.userId, updatedAt: serverTimestamp() })
      })
      transaction.set(this.recordReference(context, 'salesLots', salesLotId), {
        ...record, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      this.writeAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'salesLots', salesLotId)
      return record
    })
  }

  async correctSalesLot(
    context: CommercialMutationContext,
    salesLotId: string,
    idempotencyKey: string,
    input: SalesCorrectionInput,
  ): Promise<SalesLotRecord> {
    if (!canApproveCommercialCorrection(context.farm.role)) throw new Error('Sales correction ต้องให้ Owner/Manager ดำเนินการ')
    if (!input.reason.trim()) throw new Error('Sales correction ต้องมีเหตุผล')
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      const reference = this.recordReference(context, 'salesLots', salesLotId)
      if (operation.exists()) return parseRecord<SalesLotRecord>((await transaction.get(reference)).data() ?? {}, context)
      const current = parseRecord<SalesLotRecord>((await transaction.get(reference)).data() ?? {}, context)
      if (roundQuantity(input.weightKg) !== current.weightKg) throw new Error('การแก้น้ำหนักต้องใช้ correction allocation แยก')
      const amount = calculateSaleAmounts(input.weightKg, input.unitPriceBahtPerKg, input.depositBaht, input.receivedBaht)
      const updated = { ...current, ...amount, unitPriceBahtPerKg: input.unitPriceBahtPerKg,
        depositBaht: input.depositBaht, receivedBaht: input.receivedBaht, version: current.version + 1 }
      const event = auditEvent(context, 'SALES_LOT', salesLotId, 'CORRECTED', input.reason.trim(),
        `${current.unitPriceBahtPerKg}/${current.depositBaht}/${current.receivedBaht}`,
        `${updated.unitPriceBahtPerKg}/${updated.depositBaht}/${updated.receivedBaht}`, updated.version)
      updated.audit = [event, ...current.audit]
      transaction.update(reference, { unitPriceBahtPerKg: updated.unitPriceBahtPerKg,
        depositBaht: updated.depositBaht, receivedBaht: updated.receivedBaht,
        grossAmountBaht: updated.grossAmountBaht, outstandingBaht: updated.outstandingBaht,
        status: updated.status, version: updated.version, audit: updated.audit,
        actorUserId: context.actor.userId, updatedAt: serverTimestamp() })
      this.writeAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'salesLots', salesLotId)
      return updated
    })
  }

  async archiveSalesLot(
    context: CommercialMutationContext,
    salesLotId: string,
    idempotencyKey: string,
    reason: string,
  ): Promise<SalesLotRecord> {
    if (!canApproveCommercialCorrection(context.farm.role)) throw new Error('เฉพาะ Owner/Manager ที่ Archive Sales Lot ได้')
    if (!reason.trim()) throw new Error('ต้องระบุเหตุผล Archive')
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      const reference = this.recordReference(context, 'salesLots', salesLotId)
      if (operation.exists()) return parseRecord<SalesLotRecord>((await transaction.get(reference)).data() ?? {}, context)
      const current = parseRecord<SalesLotRecord>((await transaction.get(reference)).data() ?? {}, context)
      for (const allocation of current.allocations) {
        const harvestReference = this.recordReference(context, 'harvestLots', allocation.harvestLotId)
        const harvest = parseRecord<HarvestLotRecord>((await transaction.get(harvestReference)).data() ?? {}, context)
        transaction.update(harvestReference, { soldWeightKg: roundQuantity(harvest.soldWeightKg - allocation.weightKg),
          status: harvest.grades.length ? 'GRADED' : 'HARVESTING', version: harvest.version + 1,
          actorUserId: context.actor.userId, updatedAt: serverTimestamp() })
      }
      const updated = { ...current, status: 'ARCHIVED' as const, version: current.version + 1 }
      const event = auditEvent(context, 'SALES_LOT', salesLotId, 'ARCHIVED', reason.trim(), current.status, 'ARCHIVED', updated.version)
      updated.audit = [event, ...current.audit]
      transaction.update(reference, { status: 'ARCHIVED', version: updated.version, audit: updated.audit,
        actorUserId: context.actor.userId, updatedAt: serverTimestamp() })
      this.writeAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'salesLots', salesLotId)
      return updated
    })
  }

  async recordInventoryMovement(
    context: CommercialMutationContext,
    idempotencyKey: string,
    input: InventoryMovementInput,
  ): Promise<InventoryMovementRecord> {
    if (!canManageCommercial(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์ทำรายการสต็อก')
    if (input.movementType === 'ADJUSTMENT' && !canApproveCommercialCorrection(context.farm.role)) {
      throw new Error('Stock adjustment ต้องให้ Owner/Manager ดำเนินการ')
    }
    const itemReference = this.recordReference(context, 'inventoryItems', input.itemId)
    const itemSnapshot = await getDoc(itemReference)
    const item = parseRecord<InventoryItemRecord>(itemSnapshot.data() ?? {}, context)
    const validated = validateInventoryMovement(item, input)
    const movementId = createCommercialRecordId('inventory_move')
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      if (operation.exists()) return parseRecord<InventoryMovementRecord>((await transaction.get(
        this.recordReference(context, 'inventoryMovements', String(operation.data().resultId)),
      )).data() ?? {}, context)
      const balanceReference = this.recordReference(context, 'inventoryBalances', input.lotId)
      const balanceSnapshot = await transaction.get(balanceReference)
      const currentBalance = balanceSnapshot.exists() ? Number(balanceSnapshot.data().balance) : 0
      const nextBalance = roundQuantity(currentBalance + validated.quantityDelta)
      if (nextBalance < 0) throw new Error('นโยบาย Phase 5 ปฏิเสธสต็อกติดลบ')
      const record: InventoryMovementRecord = { ...validated, organizationId: context.farm.organizationId,
        farmId: context.farm.farmId, movementId, actorUserId: context.actor.userId,
        createdAtLabel: fixedTimeLabel, version: 1, exampleData: true, audit: [] }
      const event = auditEvent(context, 'INVENTORY_MOVEMENT', movementId, 'STOCK_RECORDED',
        record.reason, `${currentBalance} ${record.unit}`, `${nextBalance} ${record.unit}`, 1)
      record.audit = [event]
      transaction.set(this.recordReference(context, 'inventoryMovements', movementId), {
        ...record, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      transaction.set(balanceReference, { organizationId: context.farm.organizationId,
        farmId: context.farm.farmId, lotId: input.lotId, itemId: input.itemId,
        unit: input.unit, balance: nextBalance, exampleData: true,
        version: balanceSnapshot.exists() ? Number(balanceSnapshot.data().version) + 1 : 1,
        actorUserId: context.actor.userId, updatedAt: serverTimestamp() })
      this.writeAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'inventoryMovements', movementId)
      return record
    })
  }

  async listCommercialAudit(context: CommercialMutationContext): Promise<readonly CommercialAuditEvent[]> {
    if (!['ORG_OWNER', 'FARM_MANAGER', 'AUDITOR'].includes(context.farm.role)) {
      throw new Error('บทบาทนี้ไม่มีสิทธิ์อ่าน Commercial audit')
    }
    const result = await getDocs(collection(this.farmReference(context), 'commercialAuditEvents'))
    return result.docs.map((snapshot) => {
      const data = snapshot.data()
      if (data.organizationId !== context.farm.organizationId || data.farmId !== context.farm.farmId || data.exampleData !== true) {
        throw new Error('Commercial audit scope ไม่ถูกต้อง')
      }
      return copy(data as CommercialAuditEvent)
    })
  }
}
