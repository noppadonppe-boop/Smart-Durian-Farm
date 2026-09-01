import { readFile } from 'node:fs/promises'

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, setDoc, Timestamp, type Firestore } from 'firebase/firestore'

import { FirebasePhase2Repository } from '../infrastructure/firebase/firebasePhase2Repository'
import type { AuthenticatedIdentity } from '../domain/farm'

const projectId = 'demo-smart-durian'
const organizationId = 'org_repository_demo'
const ownerId = 'repository_owner'
const workerId = 'repository_worker'
const farmA = 'repository_farm_a'
const farmB = 'repository_farm_b'

let environment: RulesTestEnvironment

async function seed(): Promise<void> {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore()
    const now = Timestamp.fromDate(new Date('2026-08-31T05:00:00.000Z'))
    await setDoc(doc(firestore, 'organizations', organizationId), {
      organizationId,
      organizationName: 'องค์กร Repository จำลอง',
      organizationCode: 'REPO',
      status: 'ACTIVE',
    })
    for (const [userId, isOwner] of [
      [ownerId, true],
      [workerId, false],
    ] as const) {
      await setDoc(doc(firestore, 'organizations', organizationId, 'members', userId), {
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
      await setDoc(doc(firestore, 'organizations', organizationId, 'farms', farmId), {
        organizationId,
        farmId,
        farmCode,
        farmSequence: farmCode.slice(farmCode.lastIndexOf('-') + 1),
        farmName: `สวน ${farmCode} — ข้อมูลจำลอง`,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
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

  it('changes a role only through an atomic matching audit event', async () => {
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebasePhase2Repository(firestore)
    const identity: AuthenticatedIdentity = {
      userId: ownerId,
      displayName: 'Owner จำลอง',
      maskedPhone: '+165••••001',
      source: 'firebase-emulator',
    }

    const event = await repository.changeFarmMembership({
      actor: identity,
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
})
