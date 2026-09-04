import {
  collection,
  doc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'

import type { OperationalHardeningRepository } from '../../adapters/contracts'
import { canAccessFinancialData, type AuthenticatedIdentity, type FarmAccess } from '../../domain/farm'
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
import { rootDoc } from './firebaseDataRoot'

const defaultTimeLabel = 'Firebase'

function copy<T>(value: T): T {
  return structuredClone(value)
}

function safeId(prefix: string, value: string): string {
  const safe = value.trim().replace(/[^A-Za-z0-9_-]/gu, '_').slice(0, 96)
  if (!safe) throw new Error('ID ไม่ถูกต้อง')
  return `${prefix}_${safe}`
}

function documentValue<T>(data: DocumentData): T {
  return copy(data as T)
}

function withoutUndefined<T extends object>(value: T): Record<string, unknown> {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined))
}

export class FirebaseOperationalHardeningRepository implements OperationalHardeningRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly exampleData = true,
    private readonly timeLabel = defaultTimeLabel,
  ) {}

  private farmReference(context: OperationalContext) {
    return rootDoc(
      this.firestore,
      'organizations', context.farm.organizationId,
      'farms', context.farm.farmId,
    )
  }

  private farmReferenceFromAccess(farm: FarmAccess) {
    return rootDoc(this.firestore, 'organizations', farm.organizationId, 'farms', farm.farmId)
  }

  private auditRecord(
    context: OperationalContext,
    eventId: string,
    eventType: OperationalAuditEvent['eventType'],
    targetType: OperationalAuditEvent['targetType'],
    targetId: string,
    reason: string,
    beforeSummary: string,
    afterSummary: string,
  ): OperationalAuditEvent {
    return {
      eventId,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      actorUserId: context.actor.userId,
      eventType,
      targetType,
      targetId,
      reason,
      beforeSummary,
      afterSummary,
      createdAtLabel: this.timeLabel,
      exampleData: this.exampleData,
    }
  }

  async getFarmDashboard(context: OperationalContext): Promise<FarmDashboardView> {
    if (!canReadFarmDashboard(context.farm.role)) throw new Error('บทบาท Auditor เปิด Dashboard ปฏิบัติการไม่ได้')
    const roleBucket = context.farm.isOrganizationOwner ? 'ORG_OWNER' : context.farm.role
    const result = await getDoc(doc(this.farmReference(context), 'dashboardViews', roleBucket))
    if (!result.exists()) throw new Error('ไม่พบ Dashboard view ในข้อมูลจำลอง')
    const snapshot = documentValue<FarmDashboardSnapshot>(result.data())
    assertOperationalScope(context, snapshot)
    const financialResult = canAccessFinancialData(context.farm)
      ? await getDoc(doc(this.farmReference(context), 'financialDashboardViews', 'summary'))
      : undefined
    const financial = financialResult?.exists()
      ? documentValue<FarmDashboardFinancialSnapshot>(financialResult.data())
      : null
    if (financial) assertOperationalScope(context, financial)
    return { snapshot, financial, visibility: dashboardVisibility(context.farm) }
  }

  async getPortfolioDashboard(
    actor: AuthenticatedIdentity,
    authorizedFarms: readonly FarmAccess[],
  ): Promise<PortfolioDashboard> {
    if (!authorizedFarms.some((farm) => farm.isOrganizationOwner)) {
      throw new Error('Portfolio Dashboard ใช้ได้เฉพาะเจ้าขององค์กร')
    }
    const rows = await Promise.all(authorizedFarms.map(async (farm) => {
      const [snapshotResult, financialResult] = await Promise.all([
        getDoc(doc(this.farmReferenceFromAccess(farm), 'dashboardViews', 'ORG_OWNER')),
        getDoc(doc(this.farmReferenceFromAccess(farm), 'financialDashboardViews', 'summary')),
      ])
      if (!snapshotResult.exists() || !financialResult.exists()) return undefined
      return {
        snapshot: documentValue<FarmDashboardSnapshot>(snapshotResult.data()),
        financial: documentValue<FarmDashboardFinancialSnapshot>(financialResult.data()),
      }
    }))
    const available = rows.filter((row): row is NonNullable<typeof row> => row !== undefined)
    return buildPortfolioDashboard(
      actor,
      authorizedFarms,
      available.map((row) => row.snapshot),
      available.map((row) => row.financial),
    )
  }

  async listOfflineOperations(context: OperationalContext): Promise<readonly OfflineOperationRecord[]> {
    const result = await getDocs(collection(this.farmReference(context), 'offlineOperations'))
    return result.docs.map((snapshot) => {
      const record = documentValue<OfflineOperationRecord>(snapshot.data())
      assertOperationalScope(context, record)
      return record
    })
  }

  async queueOfflineOperation(
    context: OperationalContext,
    idempotencyKey: string,
    input: QueueOperationInput,
  ): Promise<OfflineOperationRecord> {
    const validated = validateQueueInput(input)
    if (!validated.requiredRoles.includes(context.farm.role)) throw new Error('บทบาทปัจจุบันไม่มีสิทธิ์ Queue operation นี้')
    const operationId = safeId('offline', idempotencyKey)
    const reference = doc(this.farmReference(context), 'offlineOperations', operationId)
    return runTransaction(this.firestore, async (transaction) => {
      const existing = await transaction.get(reference)
      if (existing.exists()) return documentValue<OfflineOperationRecord>(existing.data())
      const record: OfflineOperationRecord = {
        ...validated,
        operationId,
        idempotencyKey: idempotencyKey.trim(),
        organizationId: context.farm.organizationId,
        farmId: context.farm.farmId,
        actorUserId: context.actor.userId,
        capturedRole: context.farm.role,
        status: 'PENDING',
        attemptCount: 0,
        createdAtLabel: this.timeLabel,
        updatedAtLabel: this.timeLabel,
        exampleData: this.exampleData,
      }
      transaction.set(reference, { ...record, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      return record
    })
  }

  async syncOfflineOperation(context: OperationalContext, operationId: string): Promise<OfflineOperationRecord> {
    const reference = doc(this.farmReference(context), 'offlineOperations', operationId)
    const auditReference = doc(this.farmReference(context), 'operationalAuditEvents', safeId('audit_sync', operationId))
    return runTransaction(this.firestore, async (transaction) => {
      const result = await transaction.get(reference)
      if (!result.exists()) throw new Error('ไม่พบรายการค้างส่ง')
      const operation = documentValue<OfflineOperationRecord>(result.data())
      assertOperationalScope(context, operation)
      if (operation.status === 'SYNCED' || operation.status === 'CONFLICT') return operation
      const authorized = canReplayOperation(context, operation)
      const updated: OfflineOperationRecord = {
        ...operation,
        status: authorized ? 'SYNCED' : 'CONFLICT',
        attemptCount: operation.attemptCount + 1,
        resultEventId: authorized ? safeId('audit_sync', operationId) : undefined,
        conflictReason: authorized ? undefined : 'สิทธิ์เปลี่ยนหรือถูกยกเลิกก่อน reconnect',
        updatedAtLabel: this.timeLabel,
      }
      const event = this.auditRecord(
        context,
        safeId('audit_sync', operationId),
        authorized ? 'OFFLINE_SYNCED' : 'OFFLINE_CONFLICT',
        'OFFLINE_OPERATION',
        operationId,
        authorized ? 'Replay สำเร็จด้วย idempotency key เดิม' : updated.conflictReason!,
        operation.status,
        updated.status,
      )
      transaction.update(reference, { ...withoutUndefined(updated), updatedAt: serverTimestamp() })
      transaction.set(auditReference, { ...event, createdAt: serverTimestamp() })
      return updated
    })
  }

  async listMasterConflicts(context: OperationalContext): Promise<readonly MasterDataConflict[]> {
    const result = await getDocs(collection(this.farmReference(context), 'masterConflicts'))
    return result.docs.map((snapshot) => {
      const record = documentValue<MasterDataConflict>(snapshot.data())
      assertOperationalScope(context, record)
      return record
    })
  }

  async resolveMasterConflict(
    context: OperationalContext,
    conflictId: string,
    idempotencyKey: string,
    resolution: ConflictResolution,
    reason: string,
  ): Promise<MasterDataConflict> {
    if (!canReviewMasterConflict(context.farm)) throw new Error('เฉพาะ Owner/Manager ที่ตัดสิน Conflict ได้')
    if (reason.trim().length < 8) throw new Error('ต้องระบุเหตุผลอย่างน้อย 8 ตัวอักษร')
    const reference = doc(this.farmReference(context), 'masterConflicts', conflictId)
    const eventId = safeId('audit_conflict', idempotencyKey)
    const auditReference = doc(this.farmReference(context), 'operationalAuditEvents', eventId)
    return runTransaction(this.firestore, async (transaction) => {
      const auditExisting = await transaction.get(auditReference)
      const result = await transaction.get(reference)
      if (!result.exists()) throw new Error('ไม่พบ Conflict')
      const conflict = documentValue<MasterDataConflict>(result.data())
      assertOperationalScope(context, conflict)
      if (auditExisting.exists()) return conflict
      if (conflict.status !== 'OPEN') throw new Error('Conflict นี้ถูกตัดสินแล้ว')
      const updated: MasterDataConflict = {
        ...conflict,
        status: resolution === 'ESCALATE' ? 'ESCALATED' : 'RESOLVED',
        resolution,
        resolutionReason: reason.trim(),
        resolvedByUserId: context.actor.userId,
        resolvedAtLabel: this.timeLabel,
        version: conflict.version + 1,
      }
      const event = this.auditRecord(context, eventId,
        resolution === 'ESCALATE' ? 'CONFLICT_ESCALATED' : 'CONFLICT_RESOLVED',
        'MASTER_CONFLICT', conflictId, reason.trim(),
        `server=${conflict.serverValue}; device=${conflict.deviceValue}; status=OPEN`,
        `resolution=${resolution}; status=${updated.status}`)
      transaction.update(reference, { ...withoutUndefined(updated), updatedAt: serverTimestamp() })
      transaction.set(auditReference, { ...event, createdAt: serverTimestamp() })
      return updated
    })
  }

  async listPhotoRecoveries(context: OperationalContext): Promise<readonly PhotoRecoveryRecord[]> {
    const result = await getDocs(collection(this.farmReference(context), 'photoRecoveries'))
    return result.docs.map((snapshot) => {
      const record = documentValue<PhotoRecoveryRecord>(snapshot.data())
      assertOperationalScope(context, record)
      return record
    })
  }

  async registerPhotoRecovery(
    context: OperationalContext,
    idempotencyKey: string,
    draft: PhotoRecoveryDraft,
  ): Promise<PhotoRecoveryRecord> {
    const valid = validatePhotoRecoveryDraft(context, draft)
    const recoveryId = safeId('photo_recovery', idempotencyKey)
    const eventId = safeId('audit_photo_register', idempotencyKey)
    const reference = doc(this.farmReference(context), 'photoRecoveries', recoveryId)
    const auditReference = doc(this.farmReference(context), 'operationalAuditEvents', eventId)
    return runTransaction(this.firestore, async (transaction) => {
      const existing = await transaction.get(reference)
      if (existing.exists()) return documentValue<PhotoRecoveryRecord>(existing.data())
      const recovery: PhotoRecoveryRecord = {
        ...valid,
        recoveryId,
        organizationId: context.farm.organizationId,
        farmId: context.farm.farmId,
        actorUserId: context.actor.userId,
        retryCount: 0,
        updatedAtLabel: this.timeLabel,
        exampleData: this.exampleData,
      }
      const event = this.auditRecord(context, eventId, 'PHOTO_RECOVERY_REGISTERED', 'PHOTO',
        recovery.photoId, valid.lastError, 'UNTRACKED', valid.status)
      transaction.set(reference, { ...recovery, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
      transaction.set(auditReference, { ...event, createdAt: serverTimestamp() })
      return recovery
    })
  }

  async retryPhotoRecovery(
    context: OperationalContext,
    recoveryId: string,
    idempotencyKey: string,
  ): Promise<PhotoRecoveryRecord> {
    if (!canManagePhotoRecovery(context.farm)) throw new Error('บทบาทนี้ไม่มีสิทธิ์กู้คืนรูป')
    const reference = doc(this.farmReference(context), 'photoRecoveries', recoveryId)
    const eventId = safeId('audit_photo', idempotencyKey)
    const auditReference = doc(this.farmReference(context), 'operationalAuditEvents', eventId)
    return runTransaction(this.firestore, async (transaction) => {
      const result = await transaction.get(reference)
      if (!result.exists()) throw new Error('ไม่พบรายการกู้คืนรูป')
      const recovery = documentValue<PhotoRecoveryRecord>(result.data())
      assertOperationalScope(context, recovery)
      if (recovery.status === 'UPLOADED') return recovery
      if (!['FAILED', 'PENDING', 'ORPHANED'].includes(recovery.status)) {
        throw new Error('รายการนี้ไม่อยู่ในสถานะ Retry/Re-link')
      }
      const updated: PhotoRecoveryRecord = {
        ...recovery,
        status: 'UPLOADED',
        retryCount: recovery.retryCount + 1,
        lastError: undefined,
        updatedAtLabel: this.timeLabel,
      }
      const event = this.auditRecord(context, eventId, 'PHOTO_RETRIED', 'PHOTO', recovery.photoId,
        'ยืนยันว่า binary ถูกอัปโหลดและผูกกับ Work ด้วย idempotency key เดิมแล้ว',
        recovery.status, 'UPLOADED')
      transaction.update(reference, { ...withoutUndefined(updated), updatedAt: serverTimestamp() })
      transaction.set(auditReference, { ...event, createdAt: serverTimestamp() })
      return updated
    })
  }

  async cleanupOrphanPhoto(
    context: OperationalContext,
    recoveryId: string,
    idempotencyKey: string,
    reason: string,
  ): Promise<PhotoRecoveryRecord> {
    if (!canReviewMasterConflict(context.farm)) throw new Error('Orphan cleanup จำกัด Owner/Manager')
    if (reason.trim().length < 8) throw new Error('ต้องระบุเหตุผล cleanup อย่างน้อย 8 ตัวอักษร')
    const reference = doc(this.farmReference(context), 'photoRecoveries', recoveryId)
    const eventId = safeId('audit_cleanup', idempotencyKey)
    const auditReference = doc(this.farmReference(context), 'operationalAuditEvents', eventId)
    return runTransaction(this.firestore, async (transaction) => {
      const auditExisting = await transaction.get(auditReference)
      const result = await transaction.get(reference)
      if (!result.exists()) throw new Error('ไม่พบรายการ Orphan')
      const recovery = documentValue<PhotoRecoveryRecord>(result.data())
      assertOperationalScope(context, recovery)
      if (auditExisting.exists() || recovery.status === 'CLEANED') return recovery
      if (recovery.status !== 'ORPHANED') throw new Error('รายการนี้ไม่ใช่ Orphan')
      const updated: PhotoRecoveryRecord = {
        ...recovery,
        status: 'CLEANED',
        lastError: undefined,
        updatedAtLabel: this.timeLabel,
      }
      const event = this.auditRecord(context, eventId, 'ORPHAN_CLEANED', 'PHOTO', recovery.photoId,
        reason.trim(), 'ORPHANED', 'CLEANED')
      transaction.update(reference, { ...withoutUndefined(updated), updatedAt: serverTimestamp() })
      transaction.set(auditReference, { ...event, createdAt: serverTimestamp() })
      return updated
    })
  }

  async listOperationalAudit(context: OperationalContext): Promise<readonly OperationalAuditEvent[]> {
    if (!canExportFarm(context.farm)) throw new Error('บทบาทนี้ไม่มีสิทธิ์อ่าน Operational Audit')
    const result = await getDocs(collection(this.farmReference(context), 'operationalAuditEvents'))
    return result.docs.map((snapshot) => {
      const event = documentValue<OperationalAuditEvent>(snapshot.data())
      assertOperationalScope(context, event)
      return event
    })
  }

  async requestFarmExport(context: OperationalContext, idempotencyKey: string): Promise<FarmExportRecord> {
    if (!canExportFarm(context.farm)) throw new Error('บทบาทนี้ไม่มีสิทธิ์ Export')
    const exportId = safeId('export', idempotencyKey)
    const exportReference = doc(this.farmReference(context), 'exportOperations', exportId)
    const existing = await getDoc(exportReference)
    if (existing.exists()) return documentValue<FarmExportRecord>(existing.data())
    const events = await this.listOperationalAudit(context)
    const record: FarmExportRecord = {
      exportId,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      actorUserId: context.actor.userId,
      columns: [
        'eventId', 'organizationId', 'farmId', 'actorUserId', 'eventType',
        'targetType', 'targetId', 'reason', 'beforeSummary', 'afterSummary', 'createdAtLabel',
      ],
      rowCount: events.length,
      csvText: buildFarmAuditCsv(events),
      createdAtLabel: this.timeLabel,
      exampleData: this.exampleData,
    }
    const eventId = safeId('audit_export', idempotencyKey)
    const event = this.auditRecord(context, eventId, 'EXPORT_CREATED', 'EXPORT', exportId,
      'Farm-scoped minimal audit export', 'ไม่มีไฟล์ Export', `rows=${record.rowCount}`)
    const batch = writeBatch(this.firestore)
    batch.set(exportReference, { ...record, createdAt: serverTimestamp() })
    batch.set(doc(this.farmReference(context), 'operationalAuditEvents', eventId), {
      ...event,
      createdAt: serverTimestamp(),
    })
    await batch.commit()
    return record
  }
}
