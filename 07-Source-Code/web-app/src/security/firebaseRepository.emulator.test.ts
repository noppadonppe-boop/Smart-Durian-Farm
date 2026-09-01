import { readFile } from 'node:fs/promises'

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, serverTimestamp, setDoc, Timestamp, type Firestore } from 'firebase/firestore'

import { FirebasePhase2Repository } from '../infrastructure/firebase/firebasePhase2Repository'
import type {
  AuthenticatedIdentity,
  FarmManagementContext,
  FarmProfileDraft,
} from '../domain/farm'

const projectId = 'demo-smart-durian'
const organizationId = 'org_repository_demo'
const ownerId = 'repository_owner'
const workerId = 'repository_worker'
const farmA = 'repository_farm_a'
const farmB = 'repository_farm_b'

let environment: RulesTestEnvironment

const ownerIdentity: AuthenticatedIdentity = {
  userId: ownerId,
  displayName: 'Owner จำลอง',
  maskedPhone: '+165••••001',
  source: 'firebase-emulator',
}

const ownerManagementContext: FarmManagementContext = {
  actor: ownerIdentity,
  organizationId,
  organizationCode: 'REPO',
  isOrganizationOwner: true,
}

const farmDraft: FarmProfileDraft = {
  farmName: 'สวน Repository ใหม่ — ข้อมูลจำลอง',
  farmSequence: 'F03',
  province: 'TBD',
  district: 'TBD',
  subdistrict: 'TBD',
  locationNote: 'SIMULATED/TEST ONLY',
  timezone: 'Asia/Bangkok',
  seasonStartMonth: null,
  seasonEndMonth: null,
  seasonNote: 'TBD',
  notes: 'SIMULATED/TEST ONLY',
}

async function seed(): Promise<void> {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore()
    const now = Timestamp.fromDate(new Date('2026-08-31T05:00:00.000Z'))
    await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId), {
      organizationId,
      organizationName: 'องค์กร Repository จำลอง',
      organizationCode: 'REPO',
      status: 'ACTIVE',
    })
    for (const [userId, isOwner] of [
      [ownerId, true],
      [workerId, false],
    ] as const) {
      await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId, 'members', userId), {
        organizationId,
        userId,
        status: 'ACTIVE',
        isOwner,
        createdAt: now,
        updatedAt: now,
      })
    }
    for (const [farmId, farmCode] of [
      [farmA, 'REPO-F01'],
      [farmB, 'REPO-F02'],
    ] as const) {
      const farmSequence = farmCode.slice(farmCode.lastIndexOf('-') + 1)
      await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId, 'farms', farmId), {
        recordType: 'FARM_PROFILE',
        organizationId,
        farmId,
        farmCode,
        farmSequence,
        farmName: `สวน ${farmCode} — ข้อมูลจำลอง`,
        province: 'TBD',
        district: 'TBD',
        subdistrict: 'TBD',
        locationNote: 'SIMULATED/TEST ONLY',
        timezone: 'Asia/Bangkok',
        seasonStartMonth: null,
        seasonEndMonth: null,
        seasonNote: 'TBD',
        status: 'ACTIVE',
        notes: 'SIMULATED/TEST ONLY',
        version: 1,
        createdBy: ownerId,
        updatedBy: ownerId,
        classification: 'SIMULATED/TEST ONLY',
        exampleData: true,
        lastAuditEventId: 'seed',
        lastOperationId: 'seed',
        createdAt: now,
        updatedAt: now,
      })
      await setDoc(doc(
        firestore,
        'durian-smartfarm',
        'root',
        'organizations',
        organizationId,
        'farmSequenceGuards',
        farmSequence,
      ), {
        organizationId,
        farmId,
        farmSequence,
        farmCode,
        classification: 'SIMULATED/TEST ONLY',
        exampleData: true,
        createdAt: now,
      })
    }
    for (const [farmId, userId, role] of [
      [farmA, ownerId, 'ORG_OWNER'],
      [farmB, ownerId, 'FARM_MANAGER'],
      [farmA, workerId, 'WORKER'],
    ] as const) {
      await setDoc(
        doc(
          firestore,
          'durian-smartfarm',
          'root',
          'organizations',
          organizationId,
          'farms',
          farmId,
          'members',
          userId,
        ),
        {
          membershipType: 'FARM',
          organizationId,
          farmId,
          userId,
          displayName: userId === ownerId ? 'Owner จำลอง' : 'Worker จำลอง',
          maskedPhone: '+165••••000',
          role,
          status: 'ACTIVE',
          version: 1,
          auditEventId: 'seed',
          createdAt: now,
          updatedAt: now,
        },
      )
    }
  })
}

beforeAll(async () => {
  const rules = await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8')
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules },
  })
})

beforeEach(async () => {
  await environment.clearFirestore()
  await seed()
})

afterAll(async () => {
  await environment.cleanup()
})

describe('Firebase Phase 2 repository against security rules', () => {
  it('lists only the signed-in user memberships and preserves per-farm roles', async () => {
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebasePhase2Repository(firestore)
    const farms = await repository.listFarmAccess(ownerId)

    expect(farms).toHaveLength(2)
    expect(farms.find((farm) => farm.farmId === farmA)?.role).toBe('ORG_OWNER')
    expect(farms.find((farm) => farm.farmId === farmB)?.role).toBe('FARM_MANAGER')
    expect(farms.every((farm) => farm.isOrganizationOwner)).toBe(true)
  })

  it('recognizes a trusted-provisioned operational Farm and preserves its classification on update', async () => {
    const operationalFarmId = 'farm_operational_fixture_001'
    await environment.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      const now = Timestamp.fromDate(new Date('2026-09-01T08:00:00.000Z'))
      await setDoc(doc(
        firestore,
        'durian-smartfarm', 'root', 'organizations', organizationId,
        'farms', operationalFarmId,
      ), {
        recordType: 'FARM_PROFILE',
        organizationId,
        farmId: operationalFarmId,
        farmCode: 'REPO-F09',
        farmSequence: 'F09',
        farmName: 'TEST ONLY — operational classification fixture',
        province: 'TBD',
        district: 'TBD',
        subdistrict: 'TBD',
        locationNote: 'TEST ONLY',
        timezone: 'Asia/Bangkok',
        seasonStartMonth: null,
        seasonEndMonth: null,
        seasonNote: 'TBD',
        status: 'ACTIVE',
        notes: 'TEST ONLY — ไม่ใช่ข้อเท็จจริงภาคสนาม',
        version: 1,
        createdBy: ownerId,
        updatedBy: ownerId,
        classification: 'OPERATIONAL',
        exampleData: false,
        lastAuditEventId: 'trusted_provision_fixture',
        lastOperationId: 'trusted_provision_fixture',
        createdAt: now,
        updatedAt: now,
      })
      await setDoc(doc(
        firestore,
        'durian-smartfarm', 'root', 'organizations', organizationId,
        'farms', operationalFarmId, 'members', ownerId,
      ), {
        membershipType: 'FARM',
        organizationId,
        farmId: operationalFarmId,
        userId: ownerId,
        displayName: 'Owner จำลอง',
        maskedPhone: '+165••••000',
        role: 'ORG_OWNER',
        status: 'ACTIVE',
        version: 1,
        auditEventId: 'trusted_provision_fixture',
        classification: 'OPERATIONAL',
        exampleData: false,
        createdAt: now,
        updatedAt: now,
      })
    })

    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebasePhase2Repository(firestore)
    const access = (await repository.listFarmAccess(ownerId)).find(
      (farm) => farm.farmId === operationalFarmId,
    )
    expect(access?.isMock).toBe(false)

    const updated = await repository.updateFarmProfile({
      context: ownerManagementContext,
      farmId: operationalFarmId,
      idempotencyKey: 'update_operational_fixture',
      draft: {
        ...farmDraft,
        farmName: 'TEST ONLY — operational classification fixture updated',
        farmSequence: 'F09',
      },
    })
    expect(updated.profile.classification).toBe('OPERATIONAL')
    expect(updated.profile.exampleData).toBe(false)
    expect(updated.auditEvent.exampleData).toBe(false)
  })

  it('changes a role only through an atomic matching audit event', async () => {
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebasePhase2Repository(firestore)
    const event = await repository.changeFarmMembership({
      actor: ownerIdentity,
      organizationId,
      farmId: farmA,
      targetUserId: workerId,
      nextRole: 'VIEWER',
      nextStatus: 'ACTIVE',
    })
    expect(event.eventType).toBe('ROLE_CHANGED')
    expect((await repository.listFarmMembers(organizationId, farmA)).find(
      (member) => member.userId === workerId,
    )?.role).toBe('VIEWER')
    expect(await repository.listMembershipAudit(organizationId, farmA)).toHaveLength(1)
  })

  it('creates Farm + Owner membership + Audit atomically and retries without duplication', async () => {
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebasePhase2Repository(firestore)
    const first = await repository.createFarm({
      context: ownerManagementContext,
      idempotencyKey: 'create_repo_f03',
      draft: farmDraft,
    })
    const retry = await repository.createFarm({
      context: ownerManagementContext,
      idempotencyKey: 'create_repo_f03',
      draft: farmDraft,
    })

    expect(first.profile.farmCode).toBe('REPO-F03')
    expect(retry.wasRetry).toBe(true)
    expect(retry.profile.farmId).toBe(first.profile.farmId)
    expect((await repository.listFarmMembers(organizationId, first.profile.farmId)).find(
      (member) => member.userId === ownerId,
    )?.role).toBe('ORG_OWNER')
    expect(await repository.listFarmAudit(
      ownerManagementContext,
      first.profile.farmId,
    )).toHaveLength(1)
    expect(await repository.listFarmProfiles(ownerManagementContext)).toHaveLength(3)
  })

  it('rejects duplicate Farm Sequence/Code through the unique guard', async () => {
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebasePhase2Repository(firestore)
    await expect(repository.createFarm({
      context: ownerManagementContext,
      idempotencyKey: 'duplicate_repo_f01',
      draft: { ...farmDraft, farmSequence: 'F01' },
    })).rejects.toThrow(/ถูกใช้แล้ว/u)
  })

  it('updates Profile and status only with matching versioned Farm Audit', async () => {
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebasePhase2Repository(firestore)
    const before = await repository.getFarmProfile(ownerManagementContext, farmA)
    const updated = await repository.updateFarmProfile({
      context: ownerManagementContext,
      farmId: farmA,
      idempotencyKey: 'update_repo_f01',
      draft: {
        ...farmDraft,
        farmName: 'สวน REPO-F01 ปรับปรุง — ข้อมูลจำลอง',
        farmSequence: 'F01',
      },
    })
    expect(updated.profile.version).toBe((before?.version ?? 0) + 1)
    expect(updated.auditEvent.before?.farmName).toBe(before?.farmName)

    const suspended = await repository.changeFarmStatus({
      context: ownerManagementContext,
      farmId: farmA,
      idempotencyKey: 'suspend_repo_f01',
      nextStatus: 'SUSPENDED',
      knownPendingOperationIds: [],
    })
    expect(suspended.profile.status).toBe('SUSPENDED')
    await expect(setDoc(doc(
      firestore,
      'durian-smartfarm', 'root', 'organizations', organizationId,
      'farms', farmA, 'secureRecords', 'suspended_write_denied',
    ), {
      organizationId,
      farmId: farmA,
      recordId: 'suspended_write_denied',
      payload: 'SIMULATED/TEST ONLY',
      createdBy: ownerId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      version: 1,
    })).rejects.toThrow()
    const reactivated = await repository.changeFarmStatus({
      context: ownerManagementContext,
      farmId: farmA,
      idempotencyKey: 'reactivate_repo_f01',
      nextStatus: 'ACTIVE',
      knownPendingOperationIds: [],
    })
    expect(reactivated.profile.status).toBe('ACTIVE')
    expect((await repository.listFarmAudit(ownerManagementContext, farmA)).map(
      (event) => event.eventType,
    )).toEqual(expect.arrayContaining([
      'FARM_PROFILE_UPDATED',
      'FARM_SUSPENDED',
      'FARM_REACTIVATED',
    ]))
  })

  it('denies cross-Farm Profile access and all Farm mutation by a non-owner', async () => {
    const workerFirestore = environment.authenticatedContext(workerId).firestore() as unknown as Firestore
    const repository = new FirebasePhase2Repository(workerFirestore)
    const workerContext: FarmManagementContext = {
      actor: {
        userId: workerId,
        displayName: 'Worker จำลอง',
        maskedPhone: '+165••••002',
        source: 'firebase-emulator',
      },
      organizationId,
      organizationCode: 'REPO',
      isOrganizationOwner: false,
    }
    expect(await repository.getFarmProfile(workerContext, farmA)).toBeDefined()
    await expect(repository.getFarmProfile(workerContext, farmB)).rejects.toThrow()
    await expect(repository.updateFarmProfile({
      context: workerContext,
      farmId: farmA,
      idempotencyKey: 'worker_update_f01',
      draft: { ...farmDraft, farmSequence: 'F01' },
    })).rejects.toThrow(/ORG_OWNER/u)
  })

  it('blocks Archive after listing open Work Orders and Pending operations', async () => {
    await environment.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      const now = Timestamp.fromDate(new Date('2026-09-01T06:00:00.000Z'))
      await setDoc(doc(
        firestore,
        'durian-smartfarm', 'root', 'organizations', organizationId,
        'farms', farmA, 'workOrders', 'work_archive_blocker',
      ), {
        organizationId,
        farmId: farmA,
        workOrderId: 'work_archive_blocker',
        title: 'งานเปิดจำลอง',
        status: 'ASSIGNED',
        exampleData: true,
        createdAt: now,
      })
      await setDoc(doc(
        firestore,
        'durian-smartfarm', 'root', 'organizations', organizationId,
        'farms', farmA, 'offlineOperations', 'pending_archive_blocker',
      ), {
        organizationId,
        farmId: farmA,
        operationId: 'pending_archive_blocker',
        kind: 'MASTER_UPDATE',
        status: 'PENDING',
        exampleData: true,
        createdAt: now,
      })
    })
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebasePhase2Repository(firestore)
    const readiness = await repository.getFarmArchiveReadiness(ownerManagementContext, farmA)
    expect(readiness.openWorkOrders).toHaveLength(1)
    expect(readiness.pendingOperations).toHaveLength(1)
    await expect(repository.changeFarmStatus({
      context: ownerManagementContext,
      farmId: farmA,
      idempotencyKey: 'archive_blocked_f01',
      nextStatus: 'ARCHIVED',
      knownPendingOperationIds: [],
    })).rejects.toThrow(/ยัง Archive ไม่ได้/u)
  })
})
