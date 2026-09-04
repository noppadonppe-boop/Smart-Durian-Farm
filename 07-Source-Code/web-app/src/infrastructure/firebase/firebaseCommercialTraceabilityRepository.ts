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
  canAccessCommercialFinancialData,
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
  type CommercialFinancialAuditEvent,
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
  type InventoryMovementFinancialRecord,
  type InventoryMovementRecord,
  type SalesCorrectionInput,
  type SalesLotDraft,
  type SalesLotFinancialRecord,
  type SalesLotRecord,
} from '../../domain/commercialTraceability'
import { rootDoc } from './firebaseDataRoot'

const defaultTimeLabel = 'Firebase'

function copy<T>(value: T): T {
  return structuredClone(value)
}

function operationId(context: CommercialMutationContext, key: string): string {
  const normalized = `${context.actor.userId}_${key.trim()}`.replace(/[^A-Za-z0-9_-]/gu, '_')
  if (!key.trim() || normalized.length > 180) throw new Error('idempotency key ไม่ถูกต้อง')
  return normalized
}

function parseRecord<T extends { organizationId: string; farmId: string; exampleData: boolean }>(
  data: DocumentData,
  context: CommercialMutationContext,
): T {
  if (typeof data.exampleData !== 'boolean' || typeof data.organizationId !== 'string' || typeof data.farmId !== 'string') {
    throw new Error('เอกสาร Firebase มี data mode ไม่ถูกต้อง')
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
  timeLabel = defaultTimeLabel,
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
    createdAtLabel: timeLabel,
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
  exampleData: boolean,
  timeLabel: string,
): CommercialFinancialAuditEvent {
  return {
    ...auditEvent(context, recordKind, recordId, eventType, reason, beforeSummary, afterSummary, recordVersion, timeLabel),
    organizationId: context.farm.organizationId,
    farmId: context.farm.farmId,
    amountBaht,
    exampleData,
  }
}

export class FirebaseCommercialTraceabilityRepository implements CommercialTraceabilityRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly enforceAnnualCycleReference = true,
    private readonly exampleData = true,
    private readonly timeLabel = defaultTimeLabel,
  ) {}

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

  private async listCollection<T extends { organizationId: string; farmId: string; exampleData: boolean }>(
    context: CommercialMutationContext,
    collectionName: string,
    operationalOnly = false,
  ): Promise<T[]> {
    const reference = collection(this.farmReference(context), collectionName)
    const result = await getDocs(operationalOnly
      ? query(reference, where('dataClass', '==', 'OPERATIONAL'))
      : reference)
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
      exampleData: this.exampleData,
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
      dataClass: 'OPERATIONAL',
      exampleData: this.exampleData,
      createdAt: serverTimestamp(),
    })
  }

  private writeFinancialAudit(
    transaction: Transaction,
    context: CommercialMutationContext,
    event: CommercialFinancialAuditEvent,
  ): void {
    transaction.set(this.recordReference(context, 'commercialFinancialAuditEvents', event.eventId), {
      ...event,
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
      this.listCollection<SalesLotRecord>(context, 'salesLots', !canAccessCommercialFinancialData(context.farm)),
      this.listCollection<InventoryItemRecord>(context, 'inventoryItems'),
      this.listCollection<InventoryMovementRecord>(context, 'inventoryMovements', !canAccessCommercialFinancialData(context.farm)),
    ])
    const inventoryBalances = calculateInventoryBalances(inventoryItems, inventoryMovements)
    if (inventoryBalances.some((entry) => entry.balance < 0)) throw new Error('Critical: พบยอดสต็อกติดลบในข้อมูลจำลอง')
    let financial: CommercialSnapshot['financial'] = null
    if (canAccessCommercialFinancialData(context.farm)) {
      const [salesFinancials, inventoryMovementFinancials, auditSnapshots] = await Promise.all([
        this.listCollection<SalesLotFinancialRecord>(context, 'salesFinancials'),
        this.listCollection<InventoryMovementFinancialRecord>(context, 'inventoryMovementFinancials'),
        getDocs(collection(this.farmReference(context), 'commercialFinancialAuditEvents')),
      ])
      const audit = auditSnapshots.docs.map((snapshot) => {
        const data = snapshot.data()
        if (data.organizationId !== context.farm.organizationId || data.farmId !== context.farm.farmId || typeof data.exampleData !== 'boolean') {
          throw new Error('Commercial financial audit scope ไม่ถูกต้อง')
        }
        return copy(data as CommercialFinancialAuditEvent)
      })
      financial = {
        salesLots: salesFinancials,
        inventoryMovements: inventoryMovementFinancials,
        directCostSummary: calculateDirectCostSummary(inventoryMovements, inventoryMovementFinancials),
        audit,
      }
    }
    return {
      cropCycles, fruitObservations, harvestLots, salesLots, inventoryItems, inventoryMovements,
      inventoryBalances,
      alerts: this.alertsFor(inventoryItems, inventoryBalances),
      financial,
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
    if (!this.enforceAnnualCycleReference) {
      throw new Error(
        'ANNUAL_CYCLE_LINKAGE_UNAVAILABLE: ยังไม่เปิดการบันทึก Crop Cycle ไปยัง Firebase Production จนกว่าจะมี Annual Cycle repository ที่เชื่อถือได้',
      )
    }
    const duplicate = await getDocs(query(
      collection(this.farmReference(context), 'cropCycles'),
      where('cycleCode', '==', validated.cycleCode),
    ))
    if (!duplicate.empty) throw new Error('รหัส Crop Cycle ซ้ำในสวนนี้')
    const record: CropCycleRecord = { ...validated, organizationId: context.farm.organizationId,
      farmId: context.farm.farmId, cropCycleId: createCommercialRecordId('crop'), status: 'ACTIVE',
      version: 1, exampleData: this.exampleData }
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      if (operation.exists()) {
        const existing = await transaction.get(this.recordReference(context, 'cropCycles', String(operation.data().resultId)))
        return parseRecord<CropCycleRecord>(existing.data() ?? {}, context)
      }
      const annualCycle = await transaction.get(
        this.recordReference(context, 'annualCycles', validated.annualCycleId),
      )
      if (!annualCycle.exists() || annualCycle.data().status === 'CLOSED') {
        throw new Error('ไม่พบ Annual Cycle ที่เปิดรับ Crop Cycle ในสวนนี้')
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
      createdAtLabel: this.timeLabel, archivedAtLabel: null, version: 1, exampleData: this.exampleData }
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
      const updated = { ...current, archivedAtLabel: this.timeLabel, version: current.version + 1 }
      const event = auditEvent(context, 'FRUIT_OBSERVATION', observationId, 'ARCHIVED', reason.trim(), 'ACTIVE', 'ARCHIVED', updated.version)
      transaction.update(reference, { archivedAtLabel: this.timeLabel, version: updated.version,
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
      soldWeightKg: 0, actorUserId: context.actor.userId, createdAtLabel: this.timeLabel,
      version: 1, exampleData: this.exampleData, audit: [] }
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
    if (validated.financial && !canAccessCommercialFinancialData(context.farm)) {
      throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    }
    const salesLotId = createCommercialRecordId('sales')
    const { financial: financialDraft, ...operationalDraft } = validated
    const record: SalesLotRecord = { ...operationalDraft, organizationId: context.farm.organizationId,
      farmId: context.farm.farmId, salesLotId, status: 'CONFIRMED', actorUserId: context.actor.userId,
      createdAtLabel: this.timeLabel, version: 1, exampleData: this.exampleData, audit: [] }
    const event = auditEvent(context, 'SALES_LOT', salesLotId, 'CREATED', record.note, '', `${record.weightKg} kg`, 1)
    record.audit = [event]
    const financialRecord: SalesLotFinancialRecord | undefined = financialDraft
      ? {
          ...financialDraft,
          ...calculateSaleAmounts(
            record.weightKg,
            financialDraft.unitPriceBahtPerKg,
            financialDraft.depositBaht,
            financialDraft.receivedBaht,
          ),
          organizationId: context.farm.organizationId,
          farmId: context.farm.farmId,
          salesLotId,
          actorUserId: context.actor.userId,
          createdAtLabel: this.timeLabel,
          version: 1,
          exampleData: this.exampleData,
        }
      : undefined
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
        ...record, dataClass: 'OPERATIONAL', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      if (financialRecord) {
        transaction.set(this.recordReference(context, 'salesFinancials', salesLotId), {
          ...financialRecord,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        this.writeFinancialAudit(transaction, context, financialAuditEvent(
          context,
          'SALES_LOT',
          salesLotId,
          'CREATED',
          'Owner-only sale financial record',
          '',
          `${financialRecord.grossAmountBaht} THB`,
          1,
          financialRecord.grossAmountBaht,
          this.exampleData,
          this.timeLabel,
        ))
      }
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
  ): Promise<SalesLotFinancialRecord> {
    if (!canAccessCommercialFinancialData(context.farm)) throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    if (!input.reason.trim()) throw new Error('Sales correction ต้องมีเหตุผล')
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      const operationalReference = this.recordReference(context, 'salesLots', salesLotId)
      const reference = this.recordReference(context, 'salesFinancials', salesLotId)
      if (operation.exists()) return parseRecord<SalesLotFinancialRecord>((await transaction.get(reference)).data() ?? {}, context)
      const operational = parseRecord<SalesLotRecord>((await transaction.get(operationalReference)).data() ?? {}, context)
      const current = parseRecord<SalesLotFinancialRecord>((await transaction.get(reference)).data() ?? {}, context)
      if (roundQuantity(input.weightKg) !== operational.weightKg) throw new Error('การแก้น้ำหนักต้องใช้ correction allocation แยก')
      const amount = calculateSaleAmounts(input.weightKg, input.unitPriceBahtPerKg, input.depositBaht, input.receivedBaht)
      const updated: SalesLotFinancialRecord = { ...current, ...amount, unitPriceBahtPerKg: input.unitPriceBahtPerKg,
        depositBaht: input.depositBaht, receivedBaht: input.receivedBaht, version: current.version + 1 }
      const event = financialAuditEvent(context, 'SALES_LOT', salesLotId, 'CORRECTED', input.reason.trim(),
        `${current.unitPriceBahtPerKg}/${current.depositBaht}/${current.receivedBaht}`,
        `${updated.unitPriceBahtPerKg}/${updated.depositBaht}/${updated.receivedBaht}`,
        updated.version,
        updated.grossAmountBaht,
        this.exampleData,
        this.timeLabel,
      )
      transaction.update(reference, { unitPriceBahtPerKg: updated.unitPriceBahtPerKg,
        depositBaht: updated.depositBaht, receivedBaht: updated.receivedBaht,
        grossAmountBaht: updated.grossAmountBaht, outstandingBaht: updated.outstandingBaht,
        paymentStatus: updated.paymentStatus, version: updated.version,
        actorUserId: context.actor.userId, updatedAt: serverTimestamp() })
      this.writeFinancialAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'salesFinancials', salesLotId)
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
    if (validated.financial && !canAccessCommercialFinancialData(context.farm)) {
      throw new Error('ข้อมูลการเงินเปิดให้เฉพาะเจ้าขององค์กรเท่านั้น')
    }
    const { financial: financialDraft, ...operationalInput } = validated
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
      const record: InventoryMovementRecord = { ...operationalInput, organizationId: context.farm.organizationId,
        farmId: context.farm.farmId, movementId, actorUserId: context.actor.userId,
        createdAtLabel: this.timeLabel, version: 1, exampleData: this.exampleData, audit: [] }
      const event = auditEvent(context, 'INVENTORY_MOVEMENT', movementId, 'STOCK_RECORDED',
        record.reason, `${currentBalance} ${record.unit}`, `${nextBalance} ${record.unit}`, 1)
      record.audit = [event]
      transaction.set(this.recordReference(context, 'inventoryMovements', movementId), {
        ...record, dataClass: 'OPERATIONAL', createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      if (financialDraft) {
        const financialRecord: InventoryMovementFinancialRecord = {
          ...financialDraft,
          organizationId: context.farm.organizationId,
          farmId: context.farm.farmId,
          movementId,
          directCostBaht: financialDraft.directUnitCostBaht === null
            ? null
            : Math.round((Math.abs(record.quantityDelta) * financialDraft.directUnitCostBaht + Number.EPSILON) * 100) / 100,
          actorUserId: context.actor.userId,
          createdAtLabel: this.timeLabel,
          version: 1,
          exampleData: this.exampleData,
        }
        transaction.set(this.recordReference(context, 'inventoryMovementFinancials', movementId), {
          ...financialRecord,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        this.writeFinancialAudit(transaction, context, financialAuditEvent(
          context,
          'INVENTORY_MOVEMENT',
          movementId,
          'STOCK_RECORDED',
          'Owner-only inventory cost record',
          '',
          `${financialRecord.directCostBaht ?? 'UNKNOWN'} THB`,
          1,
          financialRecord.directCostBaht,
          this.exampleData,
          this.timeLabel,
        ))
      }
      transaction.set(balanceReference, { organizationId: context.farm.organizationId,
        farmId: context.farm.farmId, lotId: input.lotId, itemId: input.itemId,
        unit: input.unit, balance: nextBalance, exampleData: this.exampleData,
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
    const result = await getDocs(query(
      collection(this.farmReference(context), 'commercialAuditEvents'),
      where('dataClass', '==', 'OPERATIONAL'),
    ))
    return result.docs.map((snapshot) => {
      const data = snapshot.data()
      if (data.organizationId !== context.farm.organizationId || data.farmId !== context.farm.farmId || data.exampleData !== true) {
        throw new Error('Commercial audit scope ไม่ถูกต้อง')
      }
      return copy(data as CommercialAuditEvent)
    })
  }
}
