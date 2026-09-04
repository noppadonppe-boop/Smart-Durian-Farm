import type { OperationalHardeningRepository } from '../contracts'
import phase6Pack from '../../../scripts/seed-data/phase6-mock-data-pack-v1.0.json'
import {
  assertOperationalScope,
  buildFarmAuditCsv,
  buildPortfolioDashboard,
  canExportFarm,
  canManagePhotoRecovery,
  canReadFarmDashboard,
  canReplayOperation,
  canReviewMasterConflict,
  dashboardVisibility,
  validateQueueInput,
  validatePhotoRecoveryDraft,
  type ConflictResolution,
  type FarmDashboardSnapshot,
  type FarmDashboardFinancialSnapshot,
  type FarmDashboardView,
  type FarmExportRecord,
  type MasterDataConflict,
  type OfflineOperationRecord,
  type OperationalAuditEvent,
  type OperationalContext,
  type PhotoRecoveryDraft,
  type PhotoRecoveryRecord,
  type PortfolioDashboard,
  type QueueOperationInput,
} from '../../domain/operationalHardening'
import { canAccessFinancialData, type AuthenticatedIdentity, type FarmAccess } from '../../domain/farm'

interface Phase6PackShape {
  farmDashboards: FarmDashboardSnapshot[]
  farmDashboardFinancials: FarmDashboardFinancialSnapshot[]
  offlineOperations: OfflineOperationRecord[]
  masterConflicts: MasterDataConflict[]
  photoRecoveries: PhotoRecoveryRecord[]
  auditEvents: OperationalAuditEvent[]
}

const fixedTimeLabel = '31 ส.ค. 2569 09:00 · เวลาจำลองคงที่'

function clonePack(): Phase6PackShape {
  return structuredClone(phase6Pack) as unknown as Phase6PackShape
}

function copy<T>(value: T): T {
  return structuredClone(value)
}

export class MockOperationalHardeningRepository implements OperationalHardeningRepository {
  private pack = clonePack()
  private readonly completedOperations = new Map<string, unknown>()
  private mutationSequence = 0

  private nextId(prefix: string): string {
    this.mutationSequence += 1
    return `${prefix}_demo_${String(this.mutationSequence).padStart(6, '0')}`
  }

  private operationKey(context: OperationalContext, idempotencyKey: string): string {
    const key = idempotencyKey.trim()
    if (!key) throw new Error('ต้องมี idempotency key')
    return `${context.farm.organizationId}:${context.farm.farmId}:${key}`
  }

  private existing<T>(context: OperationalContext, idempotencyKey: string): T | undefined {
    const value = this.completedOperations.get(this.operationKey(context, idempotencyKey))
    return value === undefined ? undefined : copy(value as T)
  }

  private complete<T>(context: OperationalContext, idempotencyKey: string, result: T): T {
    this.completedOperations.set(this.operationKey(context, idempotencyKey), copy(result))
    return copy(result)
  }

  private appendAudit(
    context: OperationalContext,
    eventType: OperationalAuditEvent['eventType'],
    targetType: OperationalAuditEvent['targetType'],
    targetId: string,
    reason: string,
    beforeSummary: string,
    afterSummary: string,
  ): OperationalAuditEvent {
    const event: OperationalAuditEvent = {
      eventId: this.nextId('operational_audit'),
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      actorUserId: context.actor.userId,
      eventType,
      targetType,
      targetId,
      reason,
      beforeSummary,
      afterSummary,
      createdAtLabel: fixedTimeLabel,
      exampleData: true,
    }
    this.pack.auditEvents.unshift(event)
    return event
  }

  async getFarmDashboard(context: OperationalContext): Promise<FarmDashboardView> {
    if (!canReadFarmDashboard(context.farm.role)) throw new Error('บทบาท Auditor เปิด Dashboard ปฏิบัติการไม่ได้')
    const snapshot = this.pack.farmDashboards.find((candidate) =>
      candidate.organizationId === context.farm.organizationId &&
      candidate.farmId === context.farm.farmId,
    )
    if (!snapshot) throw new Error('ไม่พบ Dashboard ของสวนที่ได้รับสิทธิ์')
    const financial = canAccessFinancialData(context.farm)
      ? this.pack.farmDashboardFinancials.find((candidate) =>
          candidate.organizationId === context.farm.organizationId && candidate.farmId === context.farm.farmId,
        ) ?? null
      : null
    return Promise.resolve(copy({ snapshot, financial, visibility: dashboardVisibility(context.farm) }))
  }

  async getPortfolioDashboard(
    actor: AuthenticatedIdentity,
    authorizedFarms: readonly FarmAccess[],
  ): Promise<PortfolioDashboard> {
    return Promise.resolve(copy(buildPortfolioDashboard(
      actor,
      authorizedFarms,
      this.pack.farmDashboards,
      this.pack.farmDashboardFinancials,
    )))
  }

  async listOfflineOperations(context: OperationalContext): Promise<readonly OfflineOperationRecord[]> {
    return Promise.resolve(copy(this.pack.offlineOperations.filter((operation) =>
      operation.organizationId === context.farm.organizationId && operation.farmId === context.farm.farmId,
    )))
  }

  async queueOfflineOperation(
    context: OperationalContext,
    idempotencyKey: string,
    input: QueueOperationInput,
  ): Promise<OfflineOperationRecord> {
    const prior = this.existing<OfflineOperationRecord>(context, idempotencyKey)
    if (prior) return prior
    const validated = validateQueueInput(input)
    if (context.farm.farmStatus !== 'ACTIVE' || context.farm.membershipStatus !== 'ACTIVE') {
      throw new Error('สวนหรือสมาชิกไม่อยู่ในสถานะที่บันทึกข้อมูลได้')
    }
    if (!validated.requiredRoles.includes(context.farm.role)) {
      throw new Error('บทบาทปัจจุบันไม่มีสิทธิ์ Queue operation นี้')
    }
    const record: OfflineOperationRecord = {
      ...validated,
      operationId: this.nextId('offline_operation'),
      idempotencyKey: idempotencyKey.trim(),
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      actorUserId: context.actor.userId,
      capturedRole: context.farm.role,
      status: 'PENDING',
      attemptCount: 0,
      createdAtLabel: fixedTimeLabel,
      updatedAtLabel: fixedTimeLabel,
      exampleData: true,
    }
    this.pack.offlineOperations.unshift(record)
    return Promise.resolve(this.complete(context, idempotencyKey, record))
  }

  syncOfflineOperation(
    context: OperationalContext,
    operationId: string,
  ): Promise<OfflineOperationRecord> {
    return Promise.resolve().then(() => {
      const operation = this.pack.offlineOperations.find((candidate) => candidate.operationId === operationId)
      if (!operation) throw new Error('ไม่พบรายการค้างส่ง')
      assertOperationalScope(context, operation)
      if (operation.status === 'SYNCED' || operation.status === 'CONFLICT') return copy(operation)
      operation.attemptCount += 1
      operation.updatedAtLabel = fixedTimeLabel
      if (!canReplayOperation(context, operation)) {
        operation.status = 'CONFLICT'
        operation.conflictReason = 'สิทธิ์เปลี่ยนหรือถูกยกเลิกก่อน reconnect — ไม่มีการเขียนข้อมูล'
        this.appendAudit(context, 'OFFLINE_CONFLICT', 'OFFLINE_OPERATION', operation.operationId,
          operation.conflictReason, operation.capturedRole, context.farm.role)
        return copy(operation)
      }
      operation.status = 'SYNCING'
      const event = this.appendAudit(context, 'OFFLINE_SYNCED', 'OFFLINE_OPERATION', operation.operationId,
        'Replay สำเร็จด้วย idempotency key เดิม', 'PENDING', 'SYNCED')
      operation.status = 'SYNCED'
      operation.resultEventId = event.eventId
      return copy(operation)
    })
  }

  async listMasterConflicts(context: OperationalContext): Promise<readonly MasterDataConflict[]> {
    return Promise.resolve(copy(this.pack.masterConflicts.filter((conflict) =>
      conflict.organizationId === context.farm.organizationId && conflict.farmId === context.farm.farmId,
    )))
  }

  async resolveMasterConflict(
    context: OperationalContext,
    conflictId: string,
    idempotencyKey: string,
    resolution: ConflictResolution,
    reason: string,
  ): Promise<MasterDataConflict> {
    const prior = this.existing<MasterDataConflict>(context, idempotencyKey)
    if (prior) return prior
    if (!canReviewMasterConflict(context.farm)) throw new Error('เฉพาะ Owner/Manager ที่ตัดสิน Conflict ได้')
    const conflict = this.pack.masterConflicts.find((candidate) => candidate.conflictId === conflictId)
    if (!conflict) throw new Error('ไม่พบ Conflict')
    assertOperationalScope(context, conflict)
    if (conflict.status !== 'OPEN') throw new Error('Conflict นี้ถูกตัดสินแล้ว')
    if (reason.trim().length < 8) throw new Error('ต้องระบุเหตุผลอย่างน้อย 8 ตัวอักษร')
    const before = `server=${conflict.serverValue}; device=${conflict.deviceValue}; status=OPEN`
    conflict.status = resolution === 'ESCALATE' ? 'ESCALATED' : 'RESOLVED'
    conflict.resolution = resolution
    conflict.resolutionReason = reason.trim()
    conflict.resolvedByUserId = context.actor.userId
    conflict.resolvedAtLabel = fixedTimeLabel
    conflict.version += 1
    const after = `resolution=${resolution}; status=${conflict.status}`
    this.appendAudit(context,
      resolution === 'ESCALATE' ? 'CONFLICT_ESCALATED' : 'CONFLICT_RESOLVED',
      'MASTER_CONFLICT', conflict.conflictId, reason.trim(), before, after)
    return Promise.resolve(this.complete(context, idempotencyKey, conflict))
  }

  async listPhotoRecoveries(context: OperationalContext): Promise<readonly PhotoRecoveryRecord[]> {
    return Promise.resolve(copy(this.pack.photoRecoveries.filter((recovery) =>
      recovery.organizationId === context.farm.organizationId && recovery.farmId === context.farm.farmId,
    )))
  }

  async registerPhotoRecovery(
    context: OperationalContext,
    idempotencyKey: string,
    draft: PhotoRecoveryDraft,
  ): Promise<PhotoRecoveryRecord> {
    const prior = this.existing<PhotoRecoveryRecord>(context, idempotencyKey)
    if (prior) return prior
    const valid = validatePhotoRecoveryDraft(context, draft)
    const recovery: PhotoRecoveryRecord = {
      ...valid,
      recoveryId: this.nextId('photo_recovery'),
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      actorUserId: context.actor.userId,
      retryCount: 0,
      updatedAtLabel: fixedTimeLabel,
      exampleData: true,
    }
    this.pack.photoRecoveries.unshift(recovery)
    this.appendAudit(context, 'PHOTO_RECOVERY_REGISTERED', 'PHOTO', recovery.photoId,
      valid.lastError, 'UNTRACKED', valid.status)
    return Promise.resolve(this.complete(context, idempotencyKey, recovery))
  }

  async retryPhotoRecovery(
    context: OperationalContext,
    recoveryId: string,
    idempotencyKey: string,
  ): Promise<PhotoRecoveryRecord> {
    const prior = this.existing<PhotoRecoveryRecord>(context, idempotencyKey)
    if (prior) return prior
    if (!canManagePhotoRecovery(context.farm)) throw new Error('บทบาทนี้ไม่มีสิทธิ์กู้คืนรูป')
    const recovery = this.pack.photoRecoveries.find((candidate) => candidate.recoveryId === recoveryId)
    if (!recovery) throw new Error('ไม่พบรายการกู้คืนรูป')
    assertOperationalScope(context, recovery)
    if (!['FAILED', 'PENDING', 'ORPHANED'].includes(recovery.status)) {
      throw new Error('รายการนี้ไม่อยู่ในสถานะ Retry/Re-link')
    }
    const before = `${recovery.status}; retry=${recovery.retryCount}`
    recovery.status = 'UPLOADING'
    recovery.retryCount += 1
    recovery.status = 'UPLOADED'
    recovery.lastError = undefined
    recovery.updatedAtLabel = fixedTimeLabel
    this.appendAudit(context, 'PHOTO_RETRIED', 'PHOTO', recovery.photoId,
      'ยืนยันว่า binary ถูกอัปโหลดและผูกกับ Work ด้วย idempotency key เดิมแล้ว',
      before, `UPLOADED; retry=${recovery.retryCount}`)
    return Promise.resolve(this.complete(context, idempotencyKey, recovery))
  }

  async cleanupOrphanPhoto(
    context: OperationalContext,
    recoveryId: string,
    idempotencyKey: string,
    reason: string,
  ): Promise<PhotoRecoveryRecord> {
    const prior = this.existing<PhotoRecoveryRecord>(context, idempotencyKey)
    if (prior) return prior
    if (!canReviewMasterConflict(context.farm)) throw new Error('Orphan cleanup จำกัด Owner/Manager')
    const recovery = this.pack.photoRecoveries.find((candidate) => candidate.recoveryId === recoveryId)
    if (!recovery) throw new Error('ไม่พบรายการ Orphan')
    assertOperationalScope(context, recovery)
    if (recovery.status !== 'ORPHANED') throw new Error('รายการนี้ไม่ใช่ Orphan')
    if (reason.trim().length < 8) throw new Error('ต้องระบุเหตุผล cleanup อย่างน้อย 8 ตัวอักษร')
    recovery.status = 'CLEANED'
    recovery.lastError = undefined
    recovery.updatedAtLabel = fixedTimeLabel
    this.appendAudit(context, 'ORPHAN_CLEANED', 'PHOTO', recovery.photoId,
      reason.trim(), 'ORPHANED', 'CLEANED')
    return Promise.resolve(this.complete(context, idempotencyKey, recovery))
  }

  async listOperationalAudit(context: OperationalContext): Promise<readonly OperationalAuditEvent[]> {
    if (!canExportFarm(context.farm)) throw new Error('บทบาทนี้ไม่มีสิทธิ์อ่าน Operational Audit')
    return Promise.resolve(copy(this.pack.auditEvents.filter((event) =>
      event.organizationId === context.farm.organizationId && event.farmId === context.farm.farmId,
    )))
  }

  async requestFarmExport(
    context: OperationalContext,
    idempotencyKey: string,
  ): Promise<FarmExportRecord> {
    const prior = this.existing<FarmExportRecord>(context, idempotencyKey)
    if (prior) return prior
    if (!canExportFarm(context.farm)) throw new Error('บทบาทนี้ไม่มีสิทธิ์ Export')
    const sourceEvents = this.pack.auditEvents.filter((event) =>
      event.organizationId === context.farm.organizationId && event.farmId === context.farm.farmId,
    )
    const record: FarmExportRecord = {
      exportId: this.nextId('farm_export'),
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      actorUserId: context.actor.userId,
      columns: [
        'eventId', 'organizationId', 'farmId', 'actorUserId', 'eventType',
        'targetType', 'targetId', 'reason', 'beforeSummary', 'afterSummary', 'createdAtLabel',
      ],
      rowCount: sourceEvents.length,
      csvText: buildFarmAuditCsv(sourceEvents),
      createdAtLabel: fixedTimeLabel,
      exampleData: true,
    }
    this.appendAudit(context, 'EXPORT_CREATED', 'EXPORT', record.exportId,
      'Farm-scoped minimal audit export', 'ไม่มีไฟล์ Export', `rows=${record.rowCount}`)
    return Promise.resolve(this.complete(context, idempotencyKey, record))
  }

  async resetMockPack(): Promise<void> {
    this.pack = clonePack()
    this.completedOperations.clear()
    this.mutationSequence = 0
    return Promise.resolve()
  }
}
