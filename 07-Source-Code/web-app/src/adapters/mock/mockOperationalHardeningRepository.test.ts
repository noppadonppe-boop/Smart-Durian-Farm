import { beforeEach, describe, expect, it } from 'vitest'

import type { AuthenticatedIdentity, FarmAccess } from '../../domain/farm'
import type { OperationalContext } from '../../domain/operationalHardening'
import { MockOperationalHardeningRepository } from './mockOperationalHardeningRepository'

const actor: AuthenticatedIdentity = {
  userId: 'user_demo_owner_01',
  displayName: 'เจ้าของจำลอง',
  maskedPhone: '+165•••101',
  source: 'mock',
}

function access(overrides: Partial<FarmAccess> = {}): FarmAccess {
  return {
    organizationId: 'org_demo_kdoms_01',
    organizationName: 'องค์กรจำลอง',
    organizationCode: 'DEMO',
    farmId: 'farm_demo_north_01',
    farmCode: 'DEMO-F01',
    farmSequence: 'F01',
    farmName: 'สวนจำลอง',
    farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    role: 'ORG_OWNER',
    isOrganizationOwner: true,
    isMock: true,
    ...overrides,
  }
}

function context(overrides: Partial<FarmAccess> = {}): OperationalContext {
  return { actor, farm: access(overrides) }
}

describe('MockOperationalHardeningRepository', () => {
  let repository: MockOperationalHardeningRepository

  beforeEach(() => {
    repository = new MockOperationalHardeningRepository()
  })

  it('returns a role-adapted Farm Dashboard', async () => {
    const worker = await repository.getFarmDashboard(context({ role: 'WORKER', isOrganizationOwner: false }))
    expect(worker.snapshot.farmCode).toBe('DEMO-F01')
    expect(worker.visibility.work).toBe(true)
    expect(worker.visibility.sales).toBe(false)
  })

  it('excludes an unauthorized farm from Portfolio aggregation', async () => {
    const portfolio = await repository.getPortfolioDashboard(actor, [
      access(),
      access({ farmId: 'farm_demo_south_02', farmCode: 'DEMO-F02', role: 'FARM_MANAGER' }),
    ])
    expect(portfolio.farmCount).toBe(2)
    expect(portfolio.farms.map((farm) => farm.farmCode)).not.toContain('DEMO-F99')
    expect(portfolio.totals.urgentDiseaseCount).toBe(3)
  })

  it('queues and syncs a report once for duplicate retries', async () => {
    const input = {
      kind: 'WORK_REPORT' as const,
      label: 'รายงานจำลอง Offline',
      targetId: 'work_demo_tree_000001',
      payloadFingerprint: 'abcdef1234567890',
      requiredRoles: ['ORG_OWNER', 'FARM_MANAGER', 'WORKER'] as const,
    }
    const queued = await repository.queueOfflineOperation(context(), 'offline-retry-01', input)
    const duplicate = await repository.queueOfflineOperation(context(), 'offline-retry-01', input)
    expect(duplicate.operationId).toBe(queued.operationId)

    const synced = await repository.syncOfflineOperation(context(), queued.operationId)
    const retried = await repository.syncOfflineOperation(context(), queued.operationId)
    expect(synced.status).toBe('SYNCED')
    expect(retried.resultEventId).toBe(synced.resultEventId)
    expect((await repository.listOperationalAudit(context())).filter((event) =>
      event.eventType === 'OFFLINE_SYNCED' && event.targetId === queued.operationId,
    )).toHaveLength(1)
  })

  it('keeps the captured Farm scope and rejects cross-farm replay', async () => {
    const [pending] = await repository.listOfflineOperations(context())
    expect(pending?.farmId).toBe('farm_demo_north_01')
    await expect(repository.syncOfflineOperation(
      context({ farmId: 'farm_demo_south_02', farmCode: 'DEMO-F02', role: 'FARM_MANAGER' }),
      pending!.operationId,
    )).rejects.toThrow(/Cross-Farm/u)
    expect((await repository.listOfflineOperations(context()))[0]?.farmId).toBe('farm_demo_north_01')
  })

  it('marks reconnect as Conflict after role downgrade without writing result', async () => {
    const queued = await repository.queueOfflineOperation(
      context({ role: 'WORKER', isOrganizationOwner: false }),
      'offline-role-change-01',
      {
        kind: 'WORK_REPORT',
        label: 'รายงาน Worker จำลอง',
        targetId: 'work_demo_tree_000001',
        payloadFingerprint: '12345678abcdef00',
        requiredRoles: ['WORKER'],
      },
    )
    const result = await repository.syncOfflineOperation(
      context({ role: 'VIEWER', isOrganizationOwner: false }),
      queued.operationId,
    )
    expect(result.status).toBe('CONFLICT')
    expect(result.resultEventId).toBeUndefined()
    expect(result.conflictReason).toMatch(/สิทธิ์เปลี่ยน/u)
  })

  it('requires manager review and records before-after conflict audit', async () => {
    const conflict = (await repository.listMasterConflicts(context()))[0]!
    const resolved = await repository.resolveMasterConflict(
      context(), conflict.conflictId, 'resolve-conflict-01', 'KEEP_SERVER',
      'คงค่าจาก Server เพราะมี Audit ล่าสุด',
    )
    expect(resolved.status).toBe('RESOLVED')
    expect(resolved.resolution).toBe('KEEP_SERVER')
    const audit = await repository.listOperationalAudit(context())
    expect(audit.find((event) => event.targetId === conflict.conflictId)?.beforeSummary).toContain('server=')

    await expect(repository.resolveMasterConflict(
      context({ role: 'WORKER', isOrganizationOwner: false }),
      'conflict_demo_tree_north_01', 'resolve-conflict-worker', 'KEEP_SERVER',
      'Worker ไม่ควรตัดสินรายการนี้',
    )).rejects.toThrow(/Owner\/Manager/u)
  })

  it('recovers a partial photo and cleans orphan only with manager authority', async () => {
    const recoveries = await repository.listPhotoRecoveries(context())
    const partial = recoveries.find((item) => item.status === 'FAILED')!
    const orphan = recoveries.find((item) => item.status === 'ORPHANED')!
    expect((await repository.retryPhotoRecovery(
      context(), partial.recoveryId, 'retry-photo-01',
    )).status).toBe('UPLOADED')

    await expect(repository.cleanupOrphanPhoto(
      context({ role: 'WORKER', isOrganizationOwner: false }),
      orphan.recoveryId, 'cleanup-worker-01', 'ล้างไฟล์จำลองกำพร้า',
    )).rejects.toThrow(/Owner\/Manager/u)
    expect((await repository.cleanupOrphanPhoto(
      context(), orphan.recoveryId, 'cleanup-owner-01', 'ยืนยันว่าไม่มี Report อ้างถึงไฟล์นี้',
    )).status).toBe('CLEANED')
  })

  it('automatically registers one farm-scoped recovery record idempotently', async () => {
    const workerContext: OperationalContext = {
      actor: { ...actor, userId: 'user_demo_worker_02' },
      farm: access({ role: 'WORKER', isOrganizationOwner: false }),
    }
    const draft = {
      workOrderId: 'work_demo_tree_000001',
      photoId: 'photo_before_auto_demo01',
      phase: 'BEFORE' as const,
      storagePath: 'mock://organizations/org_demo_kdoms_01/farms/farm_demo_north_01/workEvidence/work_demo_tree_000001/photo_before_auto_demo01',
      status: 'FAILED' as const,
      failureMode: 'PARTIAL_ONCE' as const,
      lastError: 'SIMULATED upload interrupted after bounded retry',
    }
    const first = await repository.registerPhotoRecovery(workerContext, 'auto-photo-01', draft)
    const duplicate = await repository.registerPhotoRecovery(workerContext, 'auto-photo-01', draft)
    expect(duplicate.recoveryId).toBe(first.recoveryId)
    expect(first).toMatchObject({ actorUserId: 'user_demo_worker_02', phase: 'BEFORE', retryCount: 0 })

    await expect(repository.registerPhotoRecovery(
      { ...workerContext, farm: access({ farmId: 'farm_demo_south_02', farmCode: 'DEMO-F02', role: 'WORKER', isOrganizationOwner: false }) },
      'auto-photo-cross', draft,
    )).rejects.toThrow(/Farm\/Work scope/u)
  })

  it('exports only the current Farm and creates one audited export', async () => {
    const first = await repository.requestFarmExport(context(), 'export-demo-01')
    const duplicate = await repository.requestFarmExport(context(), 'export-demo-01')
    expect(duplicate.exportId).toBe(first.exportId)
    expect(first.csvText).toContain('farm_demo_north_01')
    expect(first.csvText).not.toContain('farm_demo_south_02')
    const audit = await repository.listOperationalAudit(context())
    expect(audit.filter((event) => event.eventType === 'EXPORT_CREATED')).toHaveLength(1)
  })

  it('resets every Phase 6 mutation to the deterministic pack', async () => {
    const before = await repository.listOfflineOperations(context())
    await repository.queueOfflineOperation(context(), 'new-operation', {
      kind: 'WORK_REPORT', label: 'รายการเพิ่ม', targetId: 'work_demo_01',
      payloadFingerprint: 'abcdef12', requiredRoles: ['ORG_OWNER'],
    })
    expect((await repository.listOfflineOperations(context())).length).toBe(before.length + 1)
    await repository.resetMockPack()
    expect(await repository.listOfflineOperations(context())).toEqual(before)
  })
})
