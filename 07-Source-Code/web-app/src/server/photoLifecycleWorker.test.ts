import { describe, expect, it, vi } from 'vitest'

import {
  runPhotoLifecycleWorker,
  type PhotoLifecycleObject,
  type PhotoLifecycleWorkerDependencies,
} from './photoLifecycleWorker'

const scope = { organizationId: 'org_demo_01', farmId: 'farm_demo_01' }
const orphan: PhotoLifecycleObject = {
  objectId: 'photo_object_orphan_01',
  ...scope,
  workOrderId: 'work_demo_01',
  photoId: 'photo_before_demo01',
  storagePath: 'organizations/org_demo_01/farms/farm_demo_01/workEvidence/work_demo_01/photo_before_demo01',
  dataClass: 'WORK_PHOTO',
  createdAtIso: '2026-08-20T00:00:00.000Z',
  recoveryStatus: 'ORPHANED',
  exampleData: true,
}
const policy = {
  orphanGraceHours: 24,
  workPhotoRetentionDays: 90,
  selectedEvidenceRetentionDays: 180,
  exportPackageRetentionDays: 7,
}

function dependencies(
  objects: readonly PhotoLifecycleObject[],
  referenced = false,
): PhotoLifecycleWorkerDependencies {
  return {
    listObjects: vi.fn(() => Promise.resolve(objects)),
    isReferenced: vi.fn(() => Promise.resolve(referenced)),
    deleteObject: vi.fn(() => Promise.resolve()),
    appendAudit: vi.fn(() => Promise.resolve()),
  }
}

describe('server-side photo lifecycle worker core', () => {
  it('plans an orphan deletion in dry-run without mutating storage or audit', async () => {
    const deps = dependencies([orphan])
    const result = await runPhotoLifecycleWorker({
      scope, mode: 'DRY_RUN', policy, now: new Date('2026-08-31T00:00:00.000Z'),
    }, deps)
    expect(result).toEqual([expect.objectContaining({ action: 'WOULD_DELETE', reason: 'ORPHAN_GRACE_EXPIRED' })])
    expect(deps.deleteObject).not.toHaveBeenCalled()
    expect(deps.appendAudit).not.toHaveBeenCalled()
  })

  it('does not delete an orphan marker whose object is already referenced by Work', async () => {
    const deps = dependencies([orphan], true)
    const result = await runPhotoLifecycleWorker({
      scope, mode: 'DRY_RUN', policy, now: new Date('2026-08-31T00:00:00.000Z'),
    }, deps)
    expect(result[0]).toMatchObject({ action: 'SKIPPED' })
    expect(result[0]?.detail).toMatch(/reconcile metadata/u)
  })

  it('still enforces approved retention when a referenced orphan marker was not reconciled', async () => {
    const deps = dependencies([orphan], true)
    const result = await runPhotoLifecycleWorker({
      scope,
      mode: 'DRY_RUN',
      policy: { ...policy, pilotClosedAtIso: '2026-01-01T00:00:00.000Z' },
      now: new Date('2026-08-31T00:00:00.000Z'),
    }, deps)
    expect(result[0]).toMatchObject({ action: 'WOULD_DELETE', reason: 'RETENTION_EXPIRED' })
  })

  it('requires PA approvals and separation of operator/approver before enforcement', async () => {
    const deps = dependencies([orphan])
    await expect(runPhotoLifecycleWorker({
      scope, mode: 'ENFORCE', policy, now: new Date('2026-08-31T00:00:00.000Z'),
    }, deps)).rejects.toThrow(/PA-1\/PA-2/u)

    await expect(runPhotoLifecycleWorker({
      scope,
      mode: 'ENFORCE',
      policy,
      authorization: {
        pa1ApprovalId: 'PA1_demo', pa2ApprovalId: 'PA2_demo', ownerApprovalId: 'owner_demo',
        dataCustodianApprovalId: 'custodian_demo', operatorCode: 'same_demo', approverCode: 'same_demo',
      },
      now: new Date('2026-08-31T00:00:00.000Z'),
    }, deps)).rejects.toThrow(/คนละรหัส/u)
  })

  it('enforces deletion idempotently with planned and deleted audit events', async () => {
    const deps = dependencies([orphan])
    const result = await runPhotoLifecycleWorker({
      scope,
      mode: 'ENFORCE',
      policy,
      authorization: {
        pa1ApprovalId: 'PA1_demo', pa2ApprovalId: 'PA2_demo', ownerApprovalId: 'owner_demo',
        dataCustodianApprovalId: 'custodian_demo', operatorCode: 'operator_demo', approverCode: 'approver_demo',
      },
      now: new Date('2026-08-31T00:00:00.000Z'),
    }, deps)
    expect(result[0]).toMatchObject({ action: 'DELETED' })
    expect(deps.deleteObject).toHaveBeenCalledWith(orphan, expect.stringContaining(orphan.objectId))
    expect(deps.appendAudit).toHaveBeenCalledTimes(2)
  })

  it('stops on any cross-farm object before a destructive action', async () => {
    const deps = dependencies([{ ...orphan, farmId: 'farm_demo_02' }])
    await expect(runPhotoLifecycleWorker({
      scope, mode: 'DRY_RUN', policy, now: new Date('2026-08-31T00:00:00.000Z'),
    }, deps)).rejects.toThrow(/Cross-Farm/u)
    expect(deps.deleteObject).not.toHaveBeenCalled()
  })
})
