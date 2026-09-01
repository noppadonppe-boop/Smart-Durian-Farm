import type { AnnualCycleRepository } from '../contracts'
import annualCyclePack from '../../demo/annual-cycle-mock-data-pack-v1.0.json'
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

interface AnnualCyclePackShape {
  cycles: AnnualCycleRecord[]
  planItems: AnnualPlanItemRecord[]
  corrections: AnnualCycleCorrection[]
  audit: AnnualCycleAuditEvent[]
}

const fixedTimeLabel = '1 ก.ย. 2569 · เวลาจำลองคงที่'

function clonePack(): AnnualCyclePackShape {
  return structuredClone(annualCyclePack) as unknown as AnnualCyclePackShape
}

function copy<T>(value: T): T {
  return structuredClone(value)
}

function operationKey(context: AnnualCycleMutationContext, idempotencyKey: string): string {
  const key = idempotencyKey.trim()
  if (!key) throw new Error('ต้องมี idempotency key')
  return `${context.actor.userId}:${context.farm.organizationId}:${context.farm.farmId}:${key}`
}

export class MockAnnualCycleRepository implements AnnualCycleRepository {
  private pack = clonePack()
  private readonly completedOperations = new Map<string, unknown>()

  private farmCycles(context: AnnualCycleMutationContext): AnnualCycleRecord[] {
    if (!canReadAnnualCycle(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์อ่านรอบบริหารสวนรายปี')
    return this.pack.cycles.filter((cycle) =>
      cycle.organizationId === context.farm.organizationId && cycle.farmId === context.farm.farmId,
    )
  }

  private requiredCycle(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
  ): AnnualCycleRecord {
    const cycle = this.pack.cycles.find((candidate) => candidate.annualCycleId === annualCycleId)
    if (!cycle) throw new Error('ไม่พบรอบบริหารสวนรายปี')
    assertAnnualCycleScope(context, cycle)
    return cycle
  }

  private existingOperation<T>(
    context: AnnualCycleMutationContext,
    idempotencyKey: string,
  ): T | undefined {
    const existing = this.completedOperations.get(operationKey(context, idempotencyKey))
    return existing === undefined ? undefined : copy(existing as T)
  }

  private completeOperation<T>(
    context: AnnualCycleMutationContext,
    idempotencyKey: string,
    result: T,
  ): T {
    this.completedOperations.set(operationKey(context, idempotencyKey), copy(result))
    return copy(result)
  }

  private addAudit(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    eventType: AnnualCycleAuditEvent['eventType'],
    targetId: string,
    reason: string,
    beforeSummary: string,
    afterSummary: string,
    recordVersion: number,
    eventId = createAnnualRecordId('annual_audit'),
  ): AnnualCycleAuditEvent {
    const event: AnnualCycleAuditEvent = {
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      annualCycleId,
      eventId,
      eventType,
      targetId,
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      reason,
      beforeSummary,
      afterSummary,
      recordVersion,
      createdAtLabel: fixedTimeLabel,
      exampleData: true,
    }
    this.pack.audit.unshift(event)
    return event
  }

  async listSnapshot(
    context: AnnualCycleMutationContext,
    selectedAnnualCycleId?: string,
  ): Promise<AnnualCycleSnapshot> {
    const cycles = this.farmCycles(context).sort((a, b) => b.periodStart.localeCompare(a.periodStart))
    const selectedCycle = cycles.find((cycle) => cycle.annualCycleId === selectedAnnualCycleId)
      ?? cycles.find((cycle) => cycle.status === 'ACTIVE' || cycle.status === 'CLOSING')
      ?? cycles[0]
      ?? null
    const annualCycleId = selectedCycle?.annualCycleId
    return Promise.resolve(copy({
      cycles,
      selectedCycle,
      planItems: annualCycleId ? this.pack.planItems.filter((item) =>
        item.organizationId === context.farm.organizationId &&
        item.farmId === context.farm.farmId &&
        item.annualCycleId === annualCycleId,
      ) : [],
      corrections: annualCycleId ? this.pack.corrections.filter((item) =>
        item.organizationId === context.farm.organizationId &&
        item.farmId === context.farm.farmId &&
        item.annualCycleId === annualCycleId,
      ) : [],
      audit: annualCycleId ? this.pack.audit.filter((item) =>
        item.organizationId === context.farm.organizationId &&
        item.farmId === context.farm.farmId &&
        item.annualCycleId === annualCycleId,
      ) : [],
    }))
  }

  async createCycle(
    context: AnnualCycleMutationContext,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
  ): Promise<AnnualCycleRecord> {
    const existing = this.existingOperation<AnnualCycleRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canManageAnnualCycle(context)) throw new Error('เฉพาะ Owner ของสวนที่ใช้งานจึงสร้างรอบปีได้')
    const validated = validateAnnualCycleDraft(draft)
    const cycles = this.farmCycles(context)
    assertAnnualCycleAvailability(validated, cycles)
    if (validated.previousAnnualCycleId) this.requiredCycle(context, validated.previousAnnualCycleId)
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
      createdAtLabel: fixedTimeLabel,
      updatedAtLabel: fixedTimeLabel,
      exampleData: true,
    }
    this.pack.cycles.unshift(record)
    this.addAudit(context, record.annualCycleId, 'CYCLE_CREATED', record.annualCycleId,
      'สร้างรอบบริหารสวนรายปีแบบจำลอง', '', annualCycleSummary(record), record.version)
    return Promise.resolve(this.completeOperation(context, idempotencyKey, record))
  }

  async updateCycle(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
    reason: string,
  ): Promise<AnnualCycleRecord> {
    const existing = this.existingOperation<AnnualCycleRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canManageAnnualCycle(context)) throw new Error('เฉพาะ Owner จึงแก้รอบปีได้')
    const cycle = this.requiredCycle(context, annualCycleId)
    if (cycle.status !== 'DRAFT' && cycle.status !== 'PLANNED') {
      throw new Error('รอบที่เริ่มใช้งานแล้วต้องแก้ด้วย Correction')
    }
    const normalizedReason = reason.trim()
    if (!normalizedReason) throw new Error('ต้องระบุเหตุผลการแก้รอบปี')
    const validated = validateAnnualCycleDraft(draft)
    assertAnnualCycleAvailability(validated, this.farmCycles(context), annualCycleId)
    if (validated.previousAnnualCycleId) this.requiredCycle(context, validated.previousAnnualCycleId)
    const beforeSummary = annualCycleSummary(cycle)
    Object.assign(cycle, validated, {
      periodEndExclusive: calculatePeriodEndExclusive(validated.periodStart),
      version: cycle.version + 1,
      updatedBy: context.actor.userId,
      updatedAtLabel: fixedTimeLabel,
    })
    this.addAudit(context, annualCycleId, 'CYCLE_UPDATED', annualCycleId,
      normalizedReason, beforeSummary, annualCycleSummary(cycle), cycle.version)
    return Promise.resolve(this.completeOperation(context, idempotencyKey, cycle))
  }

  async transitionCycle(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    nextStatus: AnnualCycleStatus,
    reason: string,
  ): Promise<AnnualCycleRecord> {
    const existing = this.existingOperation<AnnualCycleRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canManageAnnualCycle(context)) throw new Error('เฉพาะ Owner จึงเปลี่ยนสถานะรอบปีได้')
    const cycle = this.requiredCycle(context, annualCycleId)
    const normalizedReason = reason.trim()
    if (!normalizedReason) throw new Error('ต้องระบุเหตุผลการเปลี่ยนสถานะ')
    assertAnnualCycleTransition(cycle.status, nextStatus, this.farmCycles(context), annualCycleId)
    const beforeSummary = annualCycleSummary(cycle)
    cycle.status = nextStatus
    cycle.version += 1
    cycle.updatedBy = context.actor.userId
    cycle.updatedAtLabel = fixedTimeLabel
    this.addAudit(context, annualCycleId, 'CYCLE_STATUS_CHANGED', annualCycleId,
      normalizedReason, beforeSummary, annualCycleSummary(cycle), cycle.version)
    return Promise.resolve(this.completeOperation(context, idempotencyKey, cycle))
  }

  async correctCycle(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualCycleDraft,
    reason: string,
  ): Promise<{ cycle: AnnualCycleRecord; correction: AnnualCycleCorrection }> {
    const existing = this.existingOperation<{ cycle: AnnualCycleRecord; correction: AnnualCycleCorrection }>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canManageAnnualCycle(context)) throw new Error('เฉพาะ Owner จึงบันทึก Correction รอบปีได้')
    const cycle = this.requiredCycle(context, annualCycleId)
    if (cycle.status === 'DRAFT' || cycle.status === 'PLANNED') {
      throw new Error('รอบที่ยังไม่เริ่มให้ใช้การแก้ปกติ ไม่ใช้ Correction')
    }
    const normalizedReason = reason.trim()
    if (!normalizedReason) throw new Error('Correction ต้องมีเหตุผล')
    const validated = validateAnnualCycleDraft(draft)
    assertAnnualCycleAvailability(validated, this.farmCycles(context), annualCycleId)
    if (validated.previousAnnualCycleId) this.requiredCycle(context, validated.previousAnnualCycleId)
    const before = annualCycleRevisionSnapshot(cycle)
    const beforeSummary = annualCycleSummary(cycle)
    const previousRevisionId = `${cycle.annualCycleId}:r${cycle.revision}`
    Object.assign(cycle, validated, {
      periodEndExclusive: calculatePeriodEndExclusive(validated.periodStart),
      revision: cycle.revision + 1,
      supersedesRevisionId: previousRevisionId,
      version: cycle.version + 1,
      updatedBy: context.actor.userId,
      updatedAtLabel: fixedTimeLabel,
    })
    const correctionId = createAnnualRecordId('annual_correction')
    const auditEventId = createAnnualRecordId('annual_audit')
    cycle.lastCorrectionId = correctionId
    const correction: AnnualCycleCorrection = {
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      annualCycleId,
      correctionId,
      auditEventId,
      reason: normalizedReason,
      before,
      after: annualCycleRevisionSnapshot(cycle),
      beforeSummary,
      afterSummary: annualCycleSummary(cycle),
      beforeRevision: before.revision,
      afterRevision: cycle.revision,
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      createdAtLabel: fixedTimeLabel,
      idempotencyKey,
      exampleData: true,
    }
    this.pack.corrections.unshift(correction)
    this.addAudit(context, annualCycleId, 'CYCLE_CORRECTED', correctionId,
      normalizedReason, correction.beforeSummary, correction.afterSummary, cycle.version, auditEventId)
    return Promise.resolve(this.completeOperation(context, idempotencyKey, { cycle, correction }))
  }

  async createPlanItem(
    context: AnnualCycleMutationContext,
    annualCycleId: string,
    idempotencyKey: string,
    draft: AnnualPlanItemDraft,
  ): Promise<AnnualPlanItemRecord> {
    const existing = this.existingOperation<AnnualPlanItemRecord>(context, idempotencyKey)
    if (existing) return Promise.resolve(existing)
    if (!canManageAnnualPlan(context)) throw new Error('บทบาทนี้ไม่มีสิทธิ์จัดทำแผนประจำปี')
    const cycle = this.requiredCycle(context, annualCycleId)
    if (cycle.status === 'CLOSED') throw new Error('รอบที่ปิดแล้วเพิ่มแผนไม่ได้')
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
      createdAtLabel: fixedTimeLabel,
      updatedAtLabel: fixedTimeLabel,
      exampleData: true,
    }
    this.pack.planItems.unshift(record)
    this.addAudit(context, annualCycleId, 'PLAN_CREATED', record.planItemId,
      'สร้าง Annual Plan Item แบบจำลอง', '', `${record.title}|${record.target.scope}`, record.version)
    return Promise.resolve(this.completeOperation(context, idempotencyKey, record))
  }

  async resetMockPack(): Promise<void> {
    this.pack = clonePack()
    this.completedOperations.clear()
    return Promise.resolve()
  }
}
