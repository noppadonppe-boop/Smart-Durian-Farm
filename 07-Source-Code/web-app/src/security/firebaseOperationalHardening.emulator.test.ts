import { readFile } from 'node:fs/promises'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, Timestamp, type Firestore } from 'firebase/firestore'

import type { AuthenticatedIdentity, CanonicalRole, FarmAccess } from '../domain/farm'
import { FirebaseOperationalHardeningRepository } from '../infrastructure/firebase/firebaseOperationalHardeningRepository'

const projectId = 'demo-smart-durian'
const organizationId = 'org_phase6_rules_demo'
const farmA = 'farm_phase6_rules_a'
const farmB = 'farm_phase6_rules_b'
const hiddenFarm = 'farm_phase6_rules_hidden'
const ownerId = 'phase6_owner_01'
const managerId = 'phase6_manager_02'
const workerId = 'phase6_worker_03'
const viewerId = 'phase6_viewer_04'
const auditorId = 'phase6_auditor_05'
const conflictId = 'conflict_phase6_001'
const retryRecoveryId = 'photo_retry_phase6_001'
const orphanRecoveryId = 'photo_orphan_phase6_002'
const relinkRecoveryId = 'photo_relink_phase6_003'
let environment: RulesTestEnvironment

function farmPath(farmId: string): string {
  return `durian-smartfarm/root/organizations/${organizationId}/farms/${farmId}`
}

function identity(userId: string): AuthenticatedIdentity {
  return {
    userId,
    displayName: `${userId} จำลอง`,
    maskedPhone: '000••••000',
    source: 'firebase-emulator',
  }
}

function farm(role: CanonicalRole, userId: string, farmId = farmA): FarmAccess {
  return {
    organizationId,
    organizationName: 'องค์กร Phase 6 จำลอง',
    organizationCode: 'P6RULES',
    farmId,
    farmCode: farmId === farmA ? 'P6RULES-F01' : 'P6RULES-F02',
    farmSequence: farmId === farmA ? 'F01' : 'F02',
    farmName: 'สวน Phase 6 จำลอง',
    farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    role,
    isOrganizationOwner: userId === ownerId,
    isMock: true,
  }
}

function repository(userId: string) {
  return new FirebaseOperationalHardeningRepository(
    environment.authenticatedContext(userId).firestore() as unknown as Firestore,
  )
}

function dashboard(farmId: string, farmCode: string) {
  return {
    organizationId,
    farmId,
    farmCode,
    farmName: `สวน ${farmCode} จำลอง`,
    treeHealth: { normal: 20, watch: 2, sick: 1, recovering: 1, dead: 0, empty: 1 },
    urgentDiseaseCount: 1,
    overdueWorkCount: 2,
    upcomingWorkCount: 4,
    fruitEstimate: { count: 120, unit: 'fruit', quality: 'ESTIMATED' },
    harvestAvailableKg: 80,
    inventoryWarningCount: 1,
    lastCalculatedAtLabel: '31 ส.ค. 2569 · SIMULATED/TEST ONLY',
    exampleData: true,
  }
}

function dashboardFinancial(farmId: string, salesGrossBaht: number) {
  return {
    organizationId,
    farmId,
    salesGrossBaht,
    salesOutstandingBaht: 500,
    lastCalculatedAtLabel: '31 ส.ค. 2569 · SIMULATED/TEST ONLY',
    exampleData: true,
  }
}

async function seed(): Promise<void> {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore() as unknown as Firestore
    const now = Timestamp.fromDate(new Date('2026-08-31T08:00:00.000Z'))
    await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId), {
      organizationId,
      status: 'ACTIVE',
      exampleData: true,
      createdAt: now,
      updatedAt: now,
    })

    const organizationMembers = [ownerId, managerId, workerId, viewerId, auditorId]
    for (const userId of organizationMembers) {
      await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId, 'members', userId), {
        organizationId,
        userId,
        status: 'ACTIVE',
        isOwner: userId === ownerId,
        exampleData: true,
        createdAt: now,
        updatedAt: now,
      })
    }

    for (const [currentFarm, farmCode] of [
      [farmA, 'P6RULES-F01'],
      [farmB, 'P6RULES-F02'],
      [hiddenFarm, 'P6RULES-F99'],
    ] as const) {
      await setDoc(doc(firestore, farmPath(currentFarm)), {
        organizationId,
        farmId: currentFarm,
        farmCode,
        status: 'ACTIVE',
        exampleData: true,
        createdAt: now,
        updatedAt: now,
      })
      await setDoc(
        doc(firestore, `${farmPath(currentFarm)}/dashboardViews/ORG_OWNER`),
        { ...dashboard(currentFarm, farmCode), roleBucket: 'ORG_OWNER', updatedAt: now },
      )
      await setDoc(doc(firestore, `${farmPath(currentFarm)}/financialDashboardViews/summary`), {
        ...dashboardFinancial(currentFarm, currentFarm === hiddenFarm ? 999_999 : 10_000),
        updatedAt: now,
      })
    }

    const memberships = new Map<string, CanonicalRole>([
      [ownerId, 'ORG_OWNER'],
      [managerId, 'FARM_MANAGER'],
      [workerId, 'WORKER'],
      [viewerId, 'VIEWER'],
      [auditorId, 'AUDITOR'],
    ])
    for (const [userId, role] of memberships) {
      await setDoc(doc(firestore, `${farmPath(farmA)}/members/${userId}`), {
        membershipType: 'FARM',
        organizationId,
        farmId: farmA,
        userId,
        displayName: identity(userId).displayName,
        maskedPhone: '000••••000',
        role,
        status: 'ACTIVE',
        version: 1,
        auditEventId: 'seed',
        exampleData: true,
        createdAt: now,
        updatedAt: now,
      })
    }
    await setDoc(doc(firestore, `${farmPath(farmB)}/members/${ownerId}`), {
      membershipType: 'FARM',
      organizationId,
      farmId: farmB,
      userId: ownerId,
      displayName: identity(ownerId).displayName,
      maskedPhone: '000••••000',
      role: 'ORG_OWNER',
      status: 'ACTIVE',
      version: 1,
      auditEventId: 'seed',
      exampleData: true,
      createdAt: now,
      updatedAt: now,
    })

    for (const roleBucket of ['FARM_MANAGER', 'AGRONOMIST', 'WORKER', 'SALES_INVENTORY', 'VIEWER']) {
      await setDoc(doc(firestore, `${farmPath(farmA)}/dashboardViews/${roleBucket}`), {
        ...dashboard(farmA, 'P6RULES-F01'),
        roleBucket,
        updatedAt: now,
      })
    }

    await setDoc(doc(firestore, `${farmPath(farmA)}/masterConflicts/${conflictId}`), {
      conflictId,
      organizationId,
      farmId: farmA,
      entityType: 'TREE_MASTER',
      entityId: 'position_phase6_001',
      fieldName: 'healthStatus',
      serverValue: 'NORMAL',
      deviceValue: 'WATCH',
      status: 'OPEN',
      detectedAtLabel: '31 ส.ค. 2569 · SIMULATED/TEST ONLY',
      version: 1,
      exampleData: true,
      createdAt: now,
      updatedAt: now,
    })

    for (const [recoveryId, status, failureMode] of [
      [retryRecoveryId, 'FAILED', 'PARTIAL_ONCE'],
      [orphanRecoveryId, 'ORPHANED', 'ORPHANED_OBJECT'],
      [relinkRecoveryId, 'ORPHANED', 'ORPHANED_OBJECT'],
    ] as const) {
      await setDoc(doc(firestore, `${farmPath(farmA)}/photoRecoveries/${recoveryId}`), {
        recoveryId,
        organizationId,
        farmId: farmA,
        workOrderId: 'work_phase6_001',
        photoId: `${recoveryId}_image`,
        phase: status === 'FAILED' ? 'BEFORE' : 'AFTER',
        actorUserId: workerId,
        storagePath: `${farmPath(farmA)}/workEvidence/work_phase6_001/${recoveryId}.webp`,
        status,
        failureMode,
        retryCount: 0,
        lastError: status === 'FAILED' ? 'SIMULATED partial upload' : 'SIMULATED orphan object',
        updatedAtLabel: '31 ส.ค. 2569 · SIMULATED/TEST ONLY',
        exampleData: true,
        createdAt: now,
        updatedAt: now,
      })
    }

    await setDoc(doc(firestore, `${farmPath(farmA)}/workOrders/work_phase6_001`), {
      workOrderId: 'work_phase6_001',
      organizationId,
      farmId: farmA,
      createdBy: ownerId,
      assignedUserId: workerId,
      exampleData: true,
    })

    await setDoc(doc(firestore, `${farmPath(farmA)}/operationalAuditEvents/audit_seed_phase6`), {
      eventId: 'audit_seed_phase6',
      organizationId,
      farmId: farmA,
      actorUserId: ownerId,
      eventType: 'CONFLICT_ESCALATED',
      targetType: 'MASTER_CONFLICT',
      targetId: conflictId,
      reason: '=SIMULATED formula-shaped reason',
      beforeSummary: 'OPEN',
      afterSummary: 'ESCALATED',
      createdAtLabel: '31 ส.ค. 2569 · SIMULATED/TEST ONLY',
      exampleData: true,
      createdAt: now,
    })
  })
}

beforeAll(async () => {
  const rules = await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8')
  environment = await initializeTestEnvironment({ projectId, firestore: { rules } })
})

beforeEach(async () => {
  await environment.clearFirestore()
  await seed()
})

afterAll(async () => environment.cleanup())

describe('Firebase Phase 6 Operational hardening repository and Rules', () => {
  it('serves only the caller role dashboard and hides unauthorized farm identifiers', async () => {
    const workerRepository = repository(workerId)
    const workerView = await workerRepository.getFarmDashboard({
      actor: identity(workerId),
      farm: farm('WORKER', workerId),
    })
    expect(workerView.visibility.sales).toBe(false)
    expect(workerView.financial).toBeNull()

    const workerFirestore = environment.authenticatedContext(workerId).firestore()
    await assertFails(getDoc(doc(workerFirestore, `${farmPath(farmA)}/dashboardViews/ORG_OWNER`)))
    await assertFails(getDoc(doc(workerFirestore, `${farmPath(farmA)}/financialDashboardViews/summary`)))
    await assertFails(getDoc(doc(workerFirestore, `${farmPath(hiddenFarm)}/dashboardViews/WORKER`)))

    const ownerView = await repository(ownerId).getFarmDashboard({
      actor: identity(ownerId),
      farm: farm('ORG_OWNER', ownerId),
    })
    expect(ownerView.financial?.salesGrossBaht).toBe(10_000)
  })

  it('builds the Owner portfolio from authorized farms only', async () => {
    const ownerRepository = repository(ownerId)
    const portfolio = await ownerRepository.getPortfolioDashboard(identity(ownerId), [
      farm('ORG_OWNER', ownerId, farmA),
      farm('ORG_OWNER', ownerId, farmB),
    ])
    expect(portfolio.farmCount).toBe(2)
    expect(portfolio.farms.map((item) => item.snapshot.farmId)).toEqual([farmA, farmB])
    expect(portfolio.farms.some((item) => item.snapshot.farmId === hiddenFarm)).toBe(false)
  })

  it('queues and syncs a duplicate operation idempotently with one audit event', async () => {
    const workerRepository = repository(workerId)
    const context = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    const input = {
      kind: 'WORK_REPORT' as const,
      label: 'รายงานงานจำลอง',
      targetId: 'work_phase6_001',
      payloadFingerprint: 'a1b2c3d4',
      requiredRoles: ['WORKER', 'FARM_MANAGER'] as const,
    }
    const first = await workerRepository.queueOfflineOperation(context, 'queue_once_001', input)
    const duplicate = await workerRepository.queueOfflineOperation(context, 'queue_once_001', input)
    expect(duplicate.operationId).toBe(first.operationId)

    const synced = await workerRepository.syncOfflineOperation(context, first.operationId)
    const replay = await workerRepository.syncOfflineOperation(context, first.operationId)
    expect(synced.status).toBe('SYNCED')
    expect(replay.attemptCount).toBe(1)
    const managerAudit = await repository(managerId).listOperationalAudit({
      actor: identity(managerId),
      farm: farm('FARM_MANAGER', managerId),
    })
    expect(managerAudit.filter((event) => event.targetId === first.operationId)).toHaveLength(1)
  })

  it('turns a pending operation into Conflict after a role downgrade', async () => {
    const workerRepository = repository(workerId)
    const workerContext = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    const pending = await workerRepository.queueOfflineOperation(workerContext, 'downgrade_001', {
      kind: 'MASTER_UPDATE',
      label: 'แก้ข้อมูลหลักจำลอง',
      targetId: 'position_phase6_001',
      payloadFingerprint: 'd0e1f2a3',
      requiredRoles: ['WORKER', 'FARM_MANAGER'],
    })
    await environment.withSecurityRulesDisabled(async (context) => {
      await setDoc(
        doc(context.firestore(), `${farmPath(farmA)}/members/${workerId}`),
        { role: 'VIEWER', status: 'ACTIVE' },
        { merge: true },
      )
    })
    const conflicted = await workerRepository.syncOfflineOperation(
      { actor: identity(workerId), farm: farm('VIEWER', workerId) },
      pending.operationId,
    )
    expect(conflicted.status).toBe('CONFLICT')
    expect(conflicted.resultEventId).toBeUndefined()
    expect(conflicted.conflictReason).toContain('สิทธิ์เปลี่ยน')
  })

  it('denies pending replay after membership revocation', async () => {
    const workerRepository = repository(workerId)
    const context = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    const pending = await workerRepository.queueOfflineOperation(context, 'revoked_001', {
      kind: 'WORK_REPORT',
      label: 'รายงานก่อนถอนสิทธิ์',
      targetId: 'work_phase6_002',
      payloadFingerprint: 'e1f2a3b4',
      requiredRoles: ['WORKER'],
    })
    await environment.withSecurityRulesDisabled(async (admin) => {
      await setDoc(
        doc(admin.firestore(), `${farmPath(farmA)}/members/${workerId}`),
        { status: 'REVOKED' },
        { merge: true },
      )
    })
    await expect(workerRepository.syncOfflineOperation(context, pending.operationId)).rejects.toThrow()
  })

  it('limits master conflict decisions to Owner and Manager and records before/after audit', async () => {
    const workerContext = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    await expect(repository(workerId).resolveMasterConflict(
      workerContext, conflictId, 'worker_denied', 'KEEP_SERVER', 'เหตุผลจำลองเพียงพอ',
    )).rejects.toThrow('Owner/Manager')

    const managerContext = { actor: identity(managerId), farm: farm('FARM_MANAGER', managerId) }
    const resolved = await repository(managerId).resolveMasterConflict(
      managerContext, conflictId, 'manager_resolution_001', 'KEEP_SERVER',
      'คงค่าฝั่ง Server ตามหลักฐานจำลอง',
    )
    expect(resolved.status).toBe('RESOLVED')
    const audit = await repository(managerId).listOperationalAudit(managerContext)
    expect(audit.some((event) => event.eventType === 'CONFLICT_RESOLVED'
      && event.beforeSummary.includes('server=')
      && event.afterSummary.includes('resolution='))).toBe(true)
  })

  it('retries partial photos for Worker but limits orphan cleanup to Owner/Manager', async () => {
    const workerContext = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    const retried = await repository(workerId).retryPhotoRecovery(
      workerContext, retryRecoveryId, 'photo_retry_once_001',
    )
    expect(retried).toMatchObject({ status: 'UPLOADED', retryCount: 1 })
    await expect(repository(workerId).cleanupOrphanPhoto(
      workerContext, orphanRecoveryId, 'cleanup_denied', 'เหตุผลจำลองเพียงพอ',
    )).rejects.toThrow('Owner/Manager')

    const managerContext = { actor: identity(managerId), farm: farm('FARM_MANAGER', managerId) }
    const cleaned = await repository(managerId).cleanupOrphanPhoto(
      managerContext, orphanRecoveryId, 'cleanup_once_001', 'ลบวัตถุกำพร้าจำลองตามนโยบาย',
    )
    expect(cleaned.status).toBe('CLEANED')
  })

  it('allows a durable binary replay to close an orphan only after the caller re-links it', async () => {
    const workerContext = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    const relinked = await repository(workerId).retryPhotoRecovery(
      workerContext, relinkRecoveryId, 'photo_relink_once_001',
    )
    expect(relinked).toMatchObject({ status: 'UPLOADED', retryCount: 1 })
  })

  it('registers an upload failure automatically with same Farm/Work/Photo scope', async () => {
    const workerContext = { actor: identity(workerId), farm: farm('WORKER', workerId) }
    const draft = {
      workOrderId: 'work_phase6_001',
      photoId: 'photo_before_auto_rules01',
      phase: 'BEFORE' as const,
      storagePath: `organizations/${organizationId}/farms/${farmA}/workEvidence/work_phase6_001/photo_before_auto_rules01`,
      status: 'FAILED' as const,
      failureMode: 'PARTIAL_ONCE' as const,
      lastError: 'SIMULATED bounded retry exhausted',
    }
    const first = await repository(workerId).registerPhotoRecovery(
      workerContext, 'register_photo_rules_01', draft,
    )
    const duplicate = await repository(workerId).registerPhotoRecovery(
      workerContext, 'register_photo_rules_01', draft,
    )
    expect(duplicate.recoveryId).toBe(first.recoveryId)
    expect(first).toMatchObject({ actorUserId: workerId, phase: 'BEFORE', status: 'FAILED' })

    await expect(repository(workerId).registerPhotoRecovery(
      { actor: identity(workerId), farm: farm('WORKER', workerId, farmB) },
      'register_photo_cross_01', draft,
    )).rejects.toThrow(/Farm\/Work scope/u)
  })

  it('exports only farm-scoped audit for authorized roles and protects spreadsheet formulas', async () => {
    const ownerContext = { actor: identity(ownerId), farm: farm('ORG_OWNER', ownerId) }
    const exported = await repository(ownerId).requestFarmExport(ownerContext, 'export_once_001')
    expect(exported.farmId).toBe(farmA)
    expect(exported.csvText).toContain("'=SIMULATED formula-shaped reason")
    expect(exported.csvText).not.toContain(hiddenFarm)
    const retry = await repository(ownerId).requestFarmExport(ownerContext, 'export_once_001')
    expect(retry.exportId).toBe(exported.exportId)

    await expect(repository(workerId).requestFarmExport(
      { actor: identity(workerId), farm: farm('WORKER', workerId) },
      'worker_export_denied',
    )).rejects.toThrow('ไม่มีสิทธิ์')
    await expect(repository(viewerId).listOperationalAudit(
      { actor: identity(viewerId), farm: farm('VIEWER', viewerId) },
    )).rejects.toThrow('ไม่มีสิทธิ์')
  })

  it('denies direct Cross-Farm reads to a farm-scoped Worker', async () => {
    const workerFirestore = environment.authenticatedContext(workerId).firestore()
    await assertFails(getDoc(doc(workerFirestore, `${farmPath(farmB)}/dashboardViews/WORKER`)))
    const ownerFirestore = environment.authenticatedContext(ownerId).firestore()
    await assertSucceeds(getDoc(doc(ownerFirestore, `${farmPath(farmB)}/dashboardViews/ORG_OWNER`)))
  })
})
