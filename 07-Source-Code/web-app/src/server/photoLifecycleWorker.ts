export type PhotoLifecycleDataClass = 'WORK_PHOTO' | 'SELECTED_PILOT_EVIDENCE' | 'EXPORT_PACKAGE'
export type PhotoLifecycleMode = 'DRY_RUN' | 'ENFORCE'
export type PhotoLifecycleReason = 'ORPHAN_GRACE_EXPIRED' | 'RETENTION_EXPIRED'

export interface PhotoLifecycleScope {
  organizationId: string
  farmId: string
}

export interface PhotoLifecycleObject {
  objectId: string
  organizationId: string
  farmId: string
  workOrderId?: string
  photoId?: string
  storagePath: string
  dataClass: PhotoLifecycleDataClass
  createdAtIso: string
  recoveryStatus?: 'FAILED' | 'PENDING' | 'UPLOADED' | 'ORPHANED' | 'CLEANED'
  exampleData: boolean
}

export interface PhotoLifecyclePolicy {
  orphanGraceHours: number
  workPhotoRetentionDays: number
  selectedEvidenceRetentionDays: number
  exportPackageRetentionDays: number
  pilotClosedAtIso?: string
  pa3DecidedAtIso?: string
}

export interface PhotoLifecycleAuthorization {
  pa1ApprovalId: string
  pa2ApprovalId: string
  ownerApprovalId: string
  dataCustodianApprovalId: string
  operatorCode: string
  approverCode: string
}

export interface PhotoLifecycleAuditEvent {
  deletionId: string
  organizationId: string
  farmId: string
  objectId: string
  storagePath: string
  reason: PhotoLifecycleReason
  status: 'PLANNED' | 'DELETED' | 'FAILED'
  detail: string
  occurredAtIso: string
}

export interface PhotoLifecycleWorkerDependencies {
  listObjects: (scope: PhotoLifecycleScope) => Promise<readonly PhotoLifecycleObject[]>
  isReferenced: (object: PhotoLifecycleObject) => Promise<boolean>
  deleteObject: (object: PhotoLifecycleObject, deletionId: string) => Promise<void>
  appendAudit: (event: PhotoLifecycleAuditEvent) => Promise<void>
}

export interface PhotoLifecycleResult {
  objectId: string
  action: 'SKIPPED' | 'WOULD_DELETE' | 'DELETED' | 'FAILED'
  reason?: PhotoLifecycleReason
  detail: string
}

export interface RunPhotoLifecycleWorkerInput {
  scope: PhotoLifecycleScope
  mode: PhotoLifecycleMode
  policy: PhotoLifecyclePolicy
  authorization?: PhotoLifecycleAuthorization
  now?: Date
}

function parseDate(value: string | undefined, fieldName: string): number | undefined {
  if (!value) return undefined
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`${fieldName} ไม่ใช่ ISO date ที่ถูกต้อง`)
  return parsed
}

function validatePolicy(policy: PhotoLifecyclePolicy): void {
  for (const [name, value] of Object.entries({
    orphanGraceHours: policy.orphanGraceHours,
    workPhotoRetentionDays: policy.workPhotoRetentionDays,
    selectedEvidenceRetentionDays: policy.selectedEvidenceRetentionDays,
    exportPackageRetentionDays: policy.exportPackageRetentionDays,
  })) {
    if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} ต้องเป็นจำนวนเต็มบวก`)
  }
  parseDate(policy.pilotClosedAtIso, 'pilotClosedAtIso')
  parseDate(policy.pa3DecidedAtIso, 'pa3DecidedAtIso')
}

function validateAuthorization(authorization: PhotoLifecycleAuthorization | undefined): void {
  if (!authorization) throw new Error('ENFORCE ต้องมี PA-1/PA-2 และ approval chain')
  const fields: readonly [string, string][] = [
    ['pa1ApprovalId', authorization.pa1ApprovalId],
    ['pa2ApprovalId', authorization.pa2ApprovalId],
    ['ownerApprovalId', authorization.ownerApprovalId],
    ['dataCustodianApprovalId', authorization.dataCustodianApprovalId],
    ['operatorCode', authorization.operatorCode],
    ['approverCode', authorization.approverCode],
  ]
  for (const [name, value] of fields) {
    if (!/^[A-Za-z0-9_-]{4,160}$/u.test(value)) throw new Error(`${name} ไม่ถูกต้องหรือยังเป็น TBD`)
  }
  if (authorization.operatorCode === authorization.approverCode) {
    throw new Error('Backup/Lifecycle operator และ approver ต้องเป็นคนละรหัส')
  }
}

function assertObjectScope(scope: PhotoLifecycleScope, object: PhotoLifecycleObject): void {
  if (object.organizationId !== scope.organizationId || object.farmId !== scope.farmId) {
    throw new Error(`Cross-Farm lifecycle object ถูกปฏิเสธ: ${object.objectId}`)
  }
  const prefix = `organizations/${scope.organizationId}/farms/${scope.farmId}/`
  if (object.storagePath.includes('..') || !object.storagePath.startsWith(prefix)) {
    throw new Error(`Storage path นอก Farm scope: ${object.objectId}`)
  }
  if (!/^[A-Za-z0-9_-]{4,200}$/u.test(object.objectId)) {
    throw new Error('Object ID ไม่ถูกต้อง')
  }
  parseDate(object.createdAtIso, 'createdAtIso')
}

function retentionExpiry(object: PhotoLifecycleObject, policy: PhotoLifecyclePolicy): number | undefined {
  const day = 24 * 60 * 60 * 1_000
  if (object.dataClass === 'WORK_PHOTO') {
    const anchor = parseDate(policy.pilotClosedAtIso, 'pilotClosedAtIso')
    return anchor === undefined ? undefined : anchor + policy.workPhotoRetentionDays * day
  }
  if (object.dataClass === 'SELECTED_PILOT_EVIDENCE') {
    const anchor = parseDate(policy.pa3DecidedAtIso, 'pa3DecidedAtIso')
    return anchor === undefined ? undefined : anchor + policy.selectedEvidenceRetentionDays * day
  }
  return Date.parse(object.createdAtIso) + policy.exportPackageRetentionDays * day
}

function deletionId(object: PhotoLifecycleObject, reason: PhotoLifecycleReason): string {
  return `photo_lifecycle_${reason.toLowerCase()}_${object.objectId}`
}

async function deletionReason(
  object: PhotoLifecycleObject,
  policy: PhotoLifecyclePolicy,
  now: number,
  isReferenced: (object: PhotoLifecycleObject) => Promise<boolean>,
): Promise<{ reason?: PhotoLifecycleReason; detail: string }> {
  let referencedOrphan = false
  if (object.recoveryStatus === 'ORPHANED') {
    const orphanEligibleAt = Date.parse(object.createdAtIso) + policy.orphanGraceHours * 60 * 60 * 1_000
    if (now >= orphanEligibleAt) {
      if (await isReferenced(object)) {
        referencedOrphan = true
      } else {
        return { reason: 'ORPHAN_GRACE_EXPIRED', detail: 'ไม่พบ Work reference และพ้น orphan grace แล้ว' }
      }
    }
  }
  const expiry = retentionExpiry(object, policy)
  if (expiry !== undefined && now >= expiry) {
    return { reason: 'RETENTION_EXPIRED', detail: 'พ้น retention ที่ Owner/Data Custodian อนุมัติ' }
  }
  return {
    detail: referencedOrphan
      ? 'Orphan marker ยังมี Work reference จึงไม่ลบแบบ Orphan และต้อง reconcile metadata'
      : 'ยังไม่ถึง orphan grace/retention cutoff หรือยังไม่มี approved anchor',
  }
}

export async function runPhotoLifecycleWorker(
  input: RunPhotoLifecycleWorkerInput,
  dependencies: PhotoLifecycleWorkerDependencies,
): Promise<readonly PhotoLifecycleResult[]> {
  validatePolicy(input.policy)
  if (input.mode === 'ENFORCE') validateAuthorization(input.authorization)
  const now = (input.now ?? new Date()).getTime()
  const nowIso = new Date(now).toISOString()
  const objects = await dependencies.listObjects(input.scope)
  const results: PhotoLifecycleResult[] = []

  for (const object of objects) {
    assertObjectScope(input.scope, object)
    const decision = await deletionReason(object, input.policy, now, dependencies.isReferenced)
    if (!decision.reason) {
      results.push({ objectId: object.objectId, action: 'SKIPPED', detail: decision.detail })
      continue
    }
    if (input.mode === 'DRY_RUN') {
      results.push({
        objectId: object.objectId,
        action: 'WOULD_DELETE',
        reason: decision.reason,
        detail: decision.detail,
      })
      continue
    }

    const id = deletionId(object, decision.reason)
    const baseEvent = {
      deletionId: id,
      organizationId: object.organizationId,
      farmId: object.farmId,
      objectId: object.objectId,
      storagePath: object.storagePath,
      reason: decision.reason,
      occurredAtIso: nowIso,
    } as const
    try {
      await dependencies.appendAudit({
        ...baseEvent,
        status: 'PLANNED',
        detail: decision.detail,
      })
      await dependencies.deleteObject(object, id)
      await dependencies.appendAudit({
        ...baseEvent,
        status: 'DELETED',
        detail: 'ลบ object แบบ idempotent และบันทึก disposal evidence แล้ว',
      })
      results.push({
        objectId: object.objectId,
        action: 'DELETED',
        reason: decision.reason,
        detail: decision.detail,
      })
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'lifecycle delete ไม่สำเร็จ'
      await dependencies.appendAudit({ ...baseEvent, status: 'FAILED', detail }).catch(() => undefined)
      results.push({ objectId: object.objectId, action: 'FAILED', reason: decision.reason, detail })
    }
  }
  return results
}
