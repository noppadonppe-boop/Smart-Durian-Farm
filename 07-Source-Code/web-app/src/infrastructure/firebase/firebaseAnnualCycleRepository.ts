import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type Transaction,
} from 'firebase/firestore'

import type { AnnualCycleRepository } from '../../adapters/contracts'
import {
  annualCycleRevisionSnapshot,
  annualCycleSummary,
  assertAnnualCycleAvailability,
  assertAnnualCycleScope,
  assertAnnualCycleTransition,
  calculatePeriodEndExclusive,
  canManageAnnualCycle,
  canManageAnnualPlan,
  canReadAnnualCycle,
  createAnnualRecordId,
  validateAnnualCycleDraft,
  validateAnnualPlanItem,
  type AnnualCycleAuditEvent,
  type AnnualCycleCorrection,
  type AnnualCycleDraft,
  type AnnualCycleMutationContext,
  type AnnualCycleRecord,
  type AnnualCycleSnapshot,
  type AnnualCycleStatus,
  type AnnualPlanItemDraft,
  type AnnualPlanItemRecord,
} from '../../domain/annualFarmCycle'
import { rootDoc } from './firebaseDataRoot'

const emulatorTimeLabel = '1 ก.ย. 2569 · Local Emulator'

function copy<T>(value: T): T {
  return structuredClone(value)
}

function normalizedOperationId(context: AnnualCycleMutationContext, key: string): string {
  const value = `${context.actor.userId}_${key.trim()}`.replace(/[^A-Za-z0-9_-]/gu, '_')
  if (!key.trim() || value.length > 180) throw new Error('idempotency key ไม่ถูกต้อง')
  return value
}

function parseScoped<T extends { organizationId: string; farmId: string; exampleData: true }>(
  data: DocumentData,
  context: AnnualCycleMutationContext,
): T {
  if (data.exampleData !== true) throw new Error('Annual Cycle Emulator ต้องเป็น SIMULATED/TEST ONLY')
  const record = data as T
  assertAnnualCycleScope(context, record)
  return copy(record)
}

export class FirebaseAnnualCycleRepository implements AnnualCycleRepository {
  constructor(private readonly firestore: Firestore) {}

  private farmReference(context: AnnualCycleMutationContext) {
    return rootDoc(
      this.firestore,
      'organizations', context.farm.organizationId,
      'farms', context.farm.farmId,
    )
  }

  private reference(
    context: AnnualCycleMutationContext,
    collectionName: string,
    recordId: string,
  ): DocumentReference<DocumentData> {
    return doc(this.farmReference(context), collectionName, recordId)
  }

  private operationReference(context: AnnualCycleMutationContext, key: string) {
    return this.reference(context, 'annualCycleOperations', normalizedOperationId(context, key))
  }

  private guardReference(context: AnnualCycleMutationContext) {
    return this.reference(context, 'annualCycleGuards', 'current')
  }

  private async existingOperation(
    context: AnnualCycleMutationContext,
    key: string,
  ): Promise<DocumentData | undefined> {
    const snapshot = await getDoc(this.operationReference(context, key))
    return snapshot.exists() ? snapshot.data() : undefined
  }

  private async listCollection<T extends { organizationId: string; farmId: string; exampleData: true }>(
    context: AnnualCycleMutationContext,
    collectionName: string,
  ): Promise<T[]> {
    const snapshots = await getDocs(collection(this.farmReference(context), collectionName))
    return snapshots.docs.map((snapshot) => parseScoped<T>(snapshot.data(), context))
  }

  private setOperation(
    transaction: Transaction,
    context: AnnualCycleMutationContext,
    key: string,
    resultCollection: string,
    resultId: string,
    secondaryResultId: string | null = null,
  ): void {
    transaction.set(this.operationReference(context, key), {
      operationId: normalizedOperationId(context, key),
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      actorUserId: context.actor.userId,
      resultCollection,
      resultId,
      secondaryResultId,
      exampleData: true,
      createdAt: serverTimestamp(),
    })
  }

  private setAudit(
    transaction: Transaction,
    context: AnnualCycleMutationContext,
    event: AnnualCycleAuditEvent,
  ): void {
    transaction.set(this.reference(context, 'annualCycleAuditEvents', event.eventId), {
      ...event,
      createdAt: serverTimestamp(),
    })
  }

  private audit(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    eventType: AnnualCycleAuditEvent['eventType'],
    targetId: string,
    reason: string,
    beforeSummary: string,
    afterSummary: string,
    recordVersion: number,
  ): AnnualCycleAuditEvent {
    return {
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      annualCycleId,
      eventId: createAnnualRecordId('annual_audit'),
      eventType,
      targetId,
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      reason,
      beforeSummary,
      afterSummary,
      recordVersion,
      createdAtLabel: emulatorTimeLabel,
      exampleData: true,
    }
  }

  async listSnapshot(
    context: AnnualCycleMutationContext,
    selectedAnnualCycleId?: string,
  ): Promise<AnnualCycleSnapshot> {
    if (!canReadAnnualCycle(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์อ่านรอบปี')
    const cycles = (await this.listCollection<AnnualCycleRecord>(context, 'annualCycles'))
      .sort((left, right) => right.periodStart.localeCompare(left.periodStart))
    const selectedCycle = cycles.find((cycle) => cycle.annualCycleId === selectedAnnualCycleId)
      ?? cycles.find((cycle) => cycle.status === 'ACTIVE' || cycle.status === 'CLOSING')
      ?? cycles[0]
      ?? null
    if (!selectedCycle) return { cycles, selectedCycle: null, planItems: [], corrections: [], audit: [] }
    const [plans, corrections, audit] = await Promise.all([
      this.listCollection<AnnualPlanItemRecord>(context, 'annualPlanItems'),
      this.listCollection<AnnualCycleCorrection>(context, 'annualCycleCorrections'),
      this.listCollection<AnnualCycleAuditEvent>(context, 'annualCycleAuditEvents'),
    ])
    return {
      cycles,
      selectedCycle,
      planItems: plans.filter((item) => item.annualCycleId === selectedCycle.annualCycleId),
      corrections: corrections.filter((item) => item.annualCycleId === selectedCycle.annualCycleId),
      audit: audit.filter((item) => item.annualCycleId === selectedCycle.annualCycleId),
    }
  }

  async createCycle(
    context: AnnualCycleMutationContext,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
  ): Promise<AnnualCycleRecord> {
    if (!canManageAnnualCycle(context)) throw new Error('เฉพาะ Owner จึงสร้างรอบปีได้')
    const priorOperation = await this.existingOperation(context, idempotencyKey)
    if (priorOperation) {
      const prior = await getDoc(this.reference(context, 'annualCycles', String(priorOperation.resultId)))
      return parseScoped<AnnualCycleRecord>(prior.data() ?? {}, context)
    }
    const validated = validateAnnualCycleDraft(draft)
    assertAnnualCycleAvailability(validated, await this.listCollection(context, 'annualCycles'))
    if (validated.previousAnnualCycleId) {
      const previous = await getDoc(this.reference(context, 'annualCycles', validated.previousAnnualCycleId))
      if (!previous.exists()) throw new Error('ไม่พบรอบปีก่อนหน้าในสวนนี้')
      parseScoped<AnnualCycleRecord>(previous.data(), context)
    }
    const record: AnnualCycleRecord = {
      ...validated,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      annualCycleId: createAnnualRecordId('annual_cycle'),
      periodEndExclusive: calculatePeriodEndExclusive(validated.periodStart),
      status: 'DRAFT',
      revision: 1,
      supersedesRevisionId: null,
      lastCorrectionId: null,
      version: 1,
      createdBy: context.actor.userId,
      updatedBy: context.actor.userId,
      createdAtLabel: emulatorTimeLabel,
      updatedAtLabel: emulatorTimeLabel,
      exampleData: true,
    }
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      if (operation.exists()) {
        return parseScoped<AnnualCycleRecord>((await transaction.get(
          this.reference(context, 'annualCycles', String(operation.data().resultId)),
        )).data() ?? {}, context)
      }
      const event = this.audit(context, record.annualCycleId, 'CYCLE_CREATED', record.annualCycleId,
        'สร้างรอบปีแบบจำลอง', '', annualCycleSummary(record), record.version)
      transaction.set(this.reference(context, 'annualCycles', record.annualCycleId), {
        ...record, actorUserId: context.actor.userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      this.setAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'annualCycles', record.annualCycleId)
      return record
    })
  }

  async updateCycle(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
    reason: string,
  ): Promise<AnnualCycleRecord> {
    if (!canManageAnnualCycle(context)) throw new Error('เฉพาะ Owner จึงแก้รอบปีได้')
    const priorOperation = await this.existingOperation(context, idempotencyKey)
    if (priorOperation) {
      const prior = await getDoc(this.reference(context, 'annualCycles', String(priorOperation.resultId)))
      return parseScoped<AnnualCycleRecord>(prior.data() ?? {}, context)
    }
    if (!reason.trim()) throw new Error('ต้องระบุเหตุผลการแก้รอบปี')
    const validated = validateAnnualCycleDraft(draft)
    assertAnnualCycleAvailability(validated, await this.listCollection(context, 'annualCycles'), annualCycleId)
    if (validated.previousAnnualCycleId) {
      const previous = await getDoc(this.reference(context, 'annualCycles', validated.previousAnnualCycleId))
      if (!previous.exists()) throw new Error('ไม่พบรอบปีก่อนหน้าในสวนนี้')
      parseScoped<AnnualCycleRecord>(previous.data(), context)
    }
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      const reference = this.reference(context, 'annualCycles', annualCycleId)
      if (operation.exists()) return parseScoped<AnnualCycleRecord>((await transaction.get(
        this.reference(context, 'annualCycles', String(operation.data().resultId)),
      )).data() ?? {}, context)
      const current = parseScoped<AnnualCycleRecord>((await transaction.get(reference)).data() ?? {}, context)
      if (!['DRAFT', 'PLANNED'].includes(current.status)) throw new Error('รอบที่เริ่มแล้วต้องแก้ด้วย Correction')
      const updated: AnnualCycleRecord = {
        ...current,
        ...validated,
        periodEndExclusive: calculatePeriodEndExclusive(validated.periodStart),
        version: current.version + 1,
        updatedBy: context.actor.userId,
        updatedAtLabel: emulatorTimeLabel,
      }
      const event = this.audit(context, annualCycleId, 'CYCLE_UPDATED', annualCycleId,
        reason.trim(), annualCycleSummary(current), annualCycleSummary(updated), updated.version)
      transaction.update(reference, {
        ...validated,
        periodEndExclusive: updated.periodEndExclusive,
        version: updated.version,
        updatedBy: context.actor.userId,
        actorUserId: context.actor.userId,
        updatedAtLabel: emulatorTimeLabel,
        updatedAt: serverTimestamp(),
      })
      this.setAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'annualCycles', annualCycleId)
      return updated
    })
  }

  async transitionCycle(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    nextStatus: AnnualCycleStatus,
    reason: string,
  ): Promise<AnnualCycleRecord> {
    if (!canManageAnnualCycle(context)) throw new Error('เฉพาะ Owner จึงเปลี่ยนสถานะรอบปีได้')
    const priorOperation = await this.existingOperation(context, idempotencyKey)
    if (priorOperation) {
      const prior = await getDoc(this.reference(context, 'annualCycles', String(priorOperation.resultId)))
      return parseScoped<AnnualCycleRecord>(prior.data() ?? {}, context)
    }
    if (!reason.trim()) throw new Error('ต้องระบุเหตุผลการเปลี่ยนสถานะ')
    const cycles = await this.listCollection<AnnualCycleRecord>(context, 'annualCycles')
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      const reference = this.reference(context, 'annualCycles', annualCycleId)
      if (operation.exists()) return parseScoped<AnnualCycleRecord>((await transaction.get(
        this.reference(context, 'annualCycles', String(operation.data().resultId)),
      )).data() ?? {}, context)
      const current = parseScoped<AnnualCycleRecord>((await transaction.get(reference)).data() ?? {}, context)
      assertAnnualCycleTransition(current.status, nextStatus, cycles, annualCycleId)
      const guardReference = this.guardReference(context)
      const guard = await transaction.get(guardReference)
      if (nextStatus === 'ACTIVE') {
        if (guard.exists() && guard.data().annualCycleId !== annualCycleId) {
          throw new Error('สวนนี้มีรอบที่กำลังดำเนินการหรือกำลังปิดอยู่แล้ว')
        }
        transaction.set(guardReference, {
          organizationId: context.farm.organizationId,
          farmId: context.farm.farmId,
          annualCycleId,
          status: 'ACTIVE',
          exampleData: true,
          actorUserId: context.actor.userId,
          updatedAt: serverTimestamp(),
        })
      } else if (nextStatus === 'CLOSING') {
        if (!guard.exists() || guard.data().annualCycleId !== annualCycleId) {
          throw new Error('Active guard ของรอบปีไม่ถูกต้อง')
        }
        transaction.update(guardReference, { status: 'CLOSING', actorUserId: context.actor.userId, updatedAt: serverTimestamp() })
      } else if (nextStatus === 'CLOSED') {
        if (!guard.exists() || guard.data().annualCycleId !== annualCycleId) {
          throw new Error('Closing guard ของรอบปีไม่ถูกต้อง')
        }
        transaction.delete(guardReference)
      }
      const updated = { ...current, status: nextStatus, version: current.version + 1,
        updatedBy: context.actor.userId, updatedAtLabel: emulatorTimeLabel }
      const event = this.audit(context, annualCycleId, 'CYCLE_STATUS_CHANGED', annualCycleId,
        reason.trim(), annualCycleSummary(current), annualCycleSummary(updated), updated.version)
      transaction.update(reference, { status: nextStatus, version: updated.version,
        updatedBy: context.actor.userId, actorUserId: context.actor.userId,
        updatedAtLabel: emulatorTimeLabel, updatedAt: serverTimestamp() })
      this.setAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'annualCycles', annualCycleId)
      return updated
    })
  }

  async correctCycle(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
    reason: string,
  ): Promise<{ cycle: AnnualCycleRecord; correction: AnnualCycleCorrection }> {
    if (!canManageAnnualCycle(context)) throw new Error('เฉพาะ Owner จึง Correction รอบปีได้')
    const priorOperation = await this.existingOperation(context, idempotencyKey)
    if (priorOperation) {
      const [cycleSnapshot, correctionSnapshot] = await Promise.all([
        getDoc(this.reference(context, 'annualCycles', String(priorOperation.resultId))),
        getDoc(this.reference(context, 'annualCycleCorrections', String(priorOperation.secondaryResultId))),
      ])
      return {
        cycle: parseScoped<AnnualCycleRecord>(cycleSnapshot.data() ?? {}, context),
        correction: parseScoped<AnnualCycleCorrection>(correctionSnapshot.data() ?? {}, context),
      }
    }
    if (!reason.trim()) throw new Error('Correction ต้องมีเหตุผล')
    const validated = validateAnnualCycleDraft(draft)
    assertAnnualCycleAvailability(validated, await this.listCollection(context, 'annualCycles'), annualCycleId)
    if (validated.previousAnnualCycleId) {
      const previous = await getDoc(this.reference(context, 'annualCycles', validated.previousAnnualCycleId))
      if (!previous.exists()) throw new Error('ไม่พบรอบปีก่อนหน้าในสวนนี้')
      parseScoped<AnnualCycleRecord>(previous.data(), context)
    }
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      const reference = this.reference(context, 'annualCycles', annualCycleId)
      if (operation.exists()) {
        const cycle = parseScoped<AnnualCycleRecord>((await transaction.get(
          this.reference(context, 'annualCycles', String(operation.data().resultId)),
        )).data() ?? {}, context)
        const correction = parseScoped<AnnualCycleCorrection>((await transaction.get(
          this.reference(context, 'annualCycleCorrections', String(operation.data().secondaryResultId)),
        )).data() ?? {}, context)
        return { cycle, correction }
      }
      const current = parseScoped<AnnualCycleRecord>((await transaction.get(reference)).data() ?? {}, context)
      if (['DRAFT', 'PLANNED'].includes(current.status)) throw new Error('รอบที่ยังไม่เริ่มให้ใช้การแก้ปกติ')
      const before = annualCycleRevisionSnapshot(current)
      const correctionId = createAnnualRecordId('annual_correction')
      const cycle: AnnualCycleRecord = {
        ...current,
        ...validated,
        periodEndExclusive: calculatePeriodEndExclusive(validated.periodStart),
        revision: current.revision + 1,
        supersedesRevisionId: `${annualCycleId}:r${current.revision}`,
        lastCorrectionId: correctionId,
        version: current.version + 1,
        updatedBy: context.actor.userId,
        updatedAtLabel: emulatorTimeLabel,
      }
      const event = this.audit(context, annualCycleId, 'CYCLE_CORRECTED', correctionId,
        reason.trim(), annualCycleSummary(current), annualCycleSummary(cycle), cycle.version)
      const correction: AnnualCycleCorrection = {
        organizationId: context.farm.organizationId,
        farmId: context.farm.farmId,
        annualCycleId,
        correctionId,
        auditEventId: event.eventId,
        reason: reason.trim(),
        before,
        after: annualCycleRevisionSnapshot(cycle),
        beforeSummary: annualCycleSummary(current),
        afterSummary: annualCycleSummary(cycle),
        beforeRevision: current.revision,
        afterRevision: cycle.revision,
        actorUserId: context.actor.userId,
        actorDisplayName: context.actor.displayName,
        createdAtLabel: emulatorTimeLabel,
        idempotencyKey,
        exampleData: true,
      }
      transaction.update(reference, {
        ...validated,
        periodEndExclusive: cycle.periodEndExclusive,
        revision: cycle.revision,
        supersedesRevisionId: cycle.supersedesRevisionId,
        lastCorrectionId: correctionId,
        version: cycle.version,
        updatedBy: context.actor.userId,
        actorUserId: context.actor.userId,
        updatedAtLabel: emulatorTimeLabel,
        updatedAt: serverTimestamp(),
      })
      transaction.set(this.reference(context, 'annualCycleCorrections', correctionId), {
        ...correction, createdAt: serverTimestamp(),
      })
      this.setAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'annualCycles', annualCycleId, correctionId)
      return { cycle, correction }
    })
  }

  async createPlanItem(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualPlanItemDraft,
  ): Promise<AnnualPlanItemRecord> {
    if (!canManageAnnualPlan(context)) throw new Error('บทบาทนี้ไม่มีสิทธิ์จัดทำแผนประจำปี')
    const priorOperation = await this.existingOperation(context, idempotencyKey)
    if (priorOperation) {
      const prior = await getDoc(this.reference(context, 'annualPlanItems', String(priorOperation.resultId)))
      return parseScoped<AnnualPlanItemRecord>(prior.data() ?? {}, context)
    }
    const cycleSnapshot = await getDoc(this.reference(context, 'annualCycles', annualCycleId))
    if (!cycleSnapshot.exists()) throw new Error('ไม่พบรอบปี')
    const cycle = parseScoped<AnnualCycleRecord>(cycleSnapshot.data(), context)
    if (cycle.status === 'CLOSED') throw new Error('รอบปิดแล้วเพิ่มแผนไม่ได้')
    const validated = validateAnnualPlanItem(draft, cycle)
    const record: AnnualPlanItemRecord = {
      ...validated,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      annualCycleId,
      planItemId: createAnnualRecordId('annual_plan'),
      status: 'PLANNED',
      copiedFromPlanItemId: null,
      linkedWorkOrderIds: [],
      version: 1,
      createdBy: context.actor.userId,
      updatedBy: context.actor.userId,
      createdAtLabel: emulatorTimeLabel,
      updatedAtLabel: emulatorTimeLabel,
      exampleData: true,
    }
    return runTransaction(this.firestore, async (transaction) => {
      const operation = await transaction.get(this.operationReference(context, idempotencyKey))
      if (operation.exists()) return parseScoped<AnnualPlanItemRecord>((await transaction.get(
        this.reference(context, 'annualPlanItems', String(operation.data().resultId)),
      )).data() ?? {}, context)
      const currentCycle = await transaction.get(this.reference(context, 'annualCycles', annualCycleId))
      if (!currentCycle.exists() || currentCycle.data().status === 'CLOSED') throw new Error('รอบปิดแล้วเพิ่มแผนไม่ได้')
      const event = this.audit(context, annualCycleId, 'PLAN_CREATED', record.planItemId,
        'สร้าง Annual Plan Item แบบจำลอง', '', `${record.title}|${record.target.scope}`, record.version)
      transaction.set(this.reference(context, 'annualPlanItems', record.planItemId), {
        ...record, actorUserId: context.actor.userId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      })
      this.setAudit(transaction, context, event)
      this.setOperation(transaction, context, idempotencyKey, 'annualPlanItems', record.planItemId)
      return record
    })
  }
}
