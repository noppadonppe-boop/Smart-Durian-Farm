import { readFile } from 'node:fs/promises'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  doc,
  deleteDoc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { deleteObject, getMetadata, ref, uploadString } from 'firebase/storage'

const projectId = 'demo-smart-durian'
const organizationId = 'org_rules_demo_01'
const farmA = 'farm_rules_a_01'
const farmB = 'farm_rules_b_02'
const archivedFarm = 'farm_rules_archived_03'

const users = {
  owner: 'rules_owner_01',
  manager: 'rules_manager_02',
  worker: 'rules_worker_03',
  viewer: 'rules_viewer_04',
  auditor: 'rules_auditor_05',
  revoked: 'rules_revoked_06',
  outsider: 'rules_outsider_07',
} as const

let environment: RulesTestEnvironment

function farmDocumentPath(farmId: string): string {
  return `durian-smartfarm/root/organizations/${organizationId}/farms/${farmId}`
}

function memberDocumentPath(farmId: string, userId: string): string {
  return `${farmDocumentPath(farmId)}/members/${userId}`
}

function recordDocumentPath(farmId: string, recordId: string): string {
  return `${farmDocumentPath(farmId)}/secureRecords/${recordId}`
}

function storageFilePath(farmId: string, fileName: string): string {
  return `organizations/${organizationId}/farms/${farmId}/files/${fileName}`
}

function authenticatedFirestore(userId: string) {
  return environment.authenticatedContext(userId).firestore()
}

function authenticatedStorage(userId: string) {
  return environment.authenticatedContext(userId).storage()
}

async function seedFirestore(): Promise<void> {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore()
    const now = Timestamp.fromDate(new Date('2026-08-31T05:00:00.000Z'))
    await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId), {
      organizationId,
      organizationName: 'องค์กรทดสอบ Rules — ข้อมูลจำลอง',
      organizationCode: 'RULES',
      status: 'ACTIVE',
    })

    for (const [label, userId] of Object.entries(users)) {
      await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId, 'members', userId), {
        organizationId,
        userId,
        status: label === 'revoked' ? 'REVOKED' : 'ACTIVE',
        isOwner: label === 'owner',
        createdAt: now,
        updatedAt: now,
      })
    }

    const farms = [
      [farmA, 'RULES-F01', 'สวน Rules A', 'ACTIVE'],
      [farmB, 'RULES-F02', 'สวน Rules B', 'ACTIVE'],
      [archivedFarm, 'RULES-F03', 'สวน Rules เก็บถาวร', 'ARCHIVED'],
    ] as const
    for (const [farmId, farmCode, farmName, status] of farms) {
      await setDoc(doc(firestore, farmDocumentPath(farmId)), {
        organizationId,
        farmId,
        farmCode,
        farmSequence: farmCode.slice(farmCode.lastIndexOf('-') + 1),
        farmName,
        status,
        createdAt: now,
        updatedAt: now,
      })
    }

    const memberships = [
      [farmA, users.owner, 'ORG_OWNER', 'ACTIVE'],
      [farmB, users.owner, 'ORG_OWNER', 'ACTIVE'],
      [archivedFarm, users.owner, 'ORG_OWNER', 'ACTIVE'],
      [farmA, users.manager, 'FARM_MANAGER', 'ACTIVE'],
      [farmB, users.manager, 'VIEWER', 'ACTIVE'],
      [farmA, users.worker, 'WORKER', 'ACTIVE'],
      [archivedFarm, users.worker, 'WORKER', 'ACTIVE'],
      [farmA, users.viewer, 'VIEWER', 'ACTIVE'],
      [farmA, users.auditor, 'AUDITOR', 'ACTIVE'],
      [farmA, users.revoked, 'WORKER', 'REVOKED'],
    ] as const
    for (const [farmId, userId, role, status] of memberships) {
      await setDoc(doc(firestore, memberDocumentPath(farmId, userId)), {
        membershipType: 'FARM',
        organizationId,
        farmId,
        userId,
        displayName: `ผู้ใช้จำลอง ${userId}`,
        maskedPhone: '+165••••000',
        role,
        status,
        version: 1,
        auditEventId: 'seed',
        createdAt: now,
        updatedAt: now,
      })
    }

    for (const [farmId, recordId] of [
      [farmA, 'record_a'],
      [farmB, 'record_b'],
      [archivedFarm, 'record_archived'],
    ] as const) {
      await setDoc(doc(firestore, recordDocumentPath(farmId, recordId)), {
        organizationId,
        farmId,
        recordId,
        payload: 'EXAMPLE ONLY',
        createdBy: users.owner,
        createdAt: now,
        updatedAt: now,
        version: 1,
      })
    }
  })
}

async function seedStorage(): Promise<void> {
  await environment.withSecurityRulesDisabled(async (context) => {
    const storage = context.storage()
    for (const [farmId, fileName] of [
      [farmA, 'existing-a.png'],
      [farmB, 'existing-b.png'],
      [archivedFarm, 'existing-archived.png'],
    ] as const) {
      await uploadString(ref(storage, storageFilePath(farmId, fileName)), 'seed', 'raw', {
        contentType: 'image/png',
        customMetadata: {
          organizationId,
          farmId,
          uploadedBy: users.owner,
        },
      })
    }
  })
}

function newRecord(farmId: string, recordId: string) {
  return {
    organizationId,
    farmId,
    recordId,
    payload: 'EXAMPLE ONLY',
    createdBy: users.manager,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    version: 1,
  }
}

beforeAll(async () => {
  const [firestoreRules, storageRules] = await Promise.all([
    readFile(new URL('../../firestore.rules', import.meta.url), 'utf8'),
    readFile(new URL('../../storage.rules', import.meta.url), 'utf8'),
  ])
  environment = await initializeTestEnvironment({
    projectId,
    firestore: { rules: firestoreRules },
    storage: { rules: storageRules },
  })
})

beforeEach(async () => {
  await environment.clearFirestore()
  await environment.clearStorage()
  await seedFirestore()
  await seedStorage()
})

afterAll(async () => {
  await environment.cleanup()
})

describe('Firestore tenant isolation', () => {
  it('allows same-farm read and denies a cross-farm read', async () => {
    const worker = authenticatedFirestore(users.worker)
    await assertSucceeds(getDoc(doc(worker, recordDocumentPath(farmA, 'record_a'))))
    await assertFails(getDoc(doc(worker, recordDocumentPath(farmB, 'record_b'))))
  })

  it('denies a forged farmId in the payload', async () => {
    const manager = authenticatedFirestore(users.manager)
    await assertFails(
      setDoc(doc(manager, recordDocumentPath(farmA, 'forged')), {
        ...newRecord(farmA, 'forged'),
        farmId: farmB,
      }),
    )
  })

  it('applies revoked membership immediately', async () => {
    const revoked = authenticatedFirestore(users.revoked)
    await assertFails(getDoc(doc(revoked, recordDocumentPath(farmA, 'record_a'))))
  })

  it('applies a role downgrade without trusting prior client state', async () => {
    const manager = authenticatedFirestore(users.manager)
    await assertSucceeds(
      setDoc(doc(manager, recordDocumentPath(farmA, 'before-downgrade')), {
        ...newRecord(farmA, 'before-downgrade'),
      }),
    )
    await environment.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), memberDocumentPath(farmA, users.manager)), {
        role: 'VIEWER',
      })
    })
    await assertFails(
      setDoc(doc(manager, recordDocumentPath(farmA, 'after-downgrade')), {
        ...newRecord(farmA, 'after-downgrade'),
      }),
    )
  })

  it('lets one user write as manager in Farm A but not as viewer in Farm B', async () => {
    const manager = authenticatedFirestore(users.manager)
    await assertSucceeds(
      setDoc(doc(manager, recordDocumentPath(farmA, 'manager-a')), {
        ...newRecord(farmA, 'manager-a'),
      }),
    )
    await assertFails(
      setDoc(doc(manager, recordDocumentPath(farmB, 'manager-b')), {
        ...newRecord(farmB, 'manager-b'),
      }),
    )
  })

  it('allows archived data reads but denies new writes', async () => {
    const worker = authenticatedFirestore(users.worker)
    await assertSucceeds(
      getDoc(doc(worker, recordDocumentPath(archivedFarm, 'record_archived'))),
    )
    await assertFails(
      setDoc(doc(worker, recordDocumentPath(archivedFarm, 'archived-write')), {
        ...newRecord(archivedFarm, 'archived-write'),
        createdBy: users.worker,
      }),
    )
  })

  it('requires a matching append-only audit event for role changes', async () => {
    const owner = authenticatedFirestore(users.owner)
    const membershipReference = doc(owner, memberDocumentPath(farmA, users.worker))
    await assertFails(
      updateDoc(membershipReference, {
        role: 'VIEWER',
        version: 2,
        auditEventId: 'missing-audit',
        updatedAt: serverTimestamp(),
      }),
    )

    const auditEventId = 'audit_role_change_01'
    const batch = writeBatch(owner)
    batch.update(membershipReference, {
      role: 'VIEWER',
      version: 2,
      auditEventId,
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(owner, `${farmDocumentPath(farmA)}/auditEvents/${auditEventId}`), {
      auditEventId,
      organizationId,
      farmId: farmA,
      actorUserId: users.owner,
      actorDisplayName: 'Owner จำลอง',
      targetUserId: users.worker,
      targetDisplayName: 'Worker จำลอง',
      eventType: 'ROLE_CHANGED',
      beforeRole: 'WORKER',
      afterRole: 'VIEWER',
      beforeStatus: 'ACTIVE',
      afterStatus: 'ACTIVE',
      membershipVersion: 2,
      createdAt: serverTimestamp(),
    })
    await assertSucceeds(batch.commit())

    const eventDocument = await assertSucceeds(
      getDoc(doc(owner, `${farmDocumentPath(farmA)}/auditEvents/${auditEventId}`)),
    )
    expect(eventDocument.exists()).toBe(true)
  })

  it('denies membership administration to a worker', async () => {
    const worker = authenticatedFirestore(users.worker)
    await assertFails(
      updateDoc(doc(worker, memberDocumentPath(farmA, users.viewer)), {
        role: 'WORKER',
        version: 2,
        auditEventId: 'forged-worker-audit',
        updatedAt: serverTimestamp(),
      }),
    )
  })

  it('allows Farm Profile read only with membership and denies Cross-Farm disclosure', async () => {
    const worker = authenticatedFirestore(users.worker)
    await assertSucceeds(getDoc(doc(worker, farmDocumentPath(farmA))))
    await assertFails(getDoc(doc(worker, farmDocumentPath(farmB))))
  })

  it('denies direct Farm mutation without matching operation/Audit and denies hard delete', async () => {
    const owner = authenticatedFirestore(users.owner)
    await assertFails(updateDoc(doc(owner, farmDocumentPath(farmA)), {
      farmName: 'พยายามแก้โดยไม่มี Audit',
      version: 2,
      updatedAt: serverTimestamp(),
    }))
    await assertFails(deleteDoc(doc(owner, farmDocumentPath(farmA))))
  })

  it('denies a forged Farm create that omits atomic Owner membership and uniqueness guard', async () => {
    const owner = authenticatedFirestore(users.owner)
    await assertFails(setDoc(doc(owner, farmDocumentPath('farm_forged_1234567890abcdef')), {
      recordType: 'FARM_PROFILE',
      organizationId,
      farmId: 'farm_forged_1234567890abcdef',
      farmName: 'สวนปลอมจำลอง',
      farmSequence: 'F09',
      farmCode: 'RULES-F09',
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
      createdBy: users.owner,
      updatedBy: users.owner,
      classification: 'SIMULATED/TEST ONLY',
      exampleData: true,
      lastAuditEventId: 'missing-audit',
      lastOperationId: 'missing-operation',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }))
  })
})

describe('Storage tenant isolation', () => {
  it('allows a same-farm image upload and denies a cross-farm upload', async () => {
    const worker = authenticatedStorage(users.worker)
    await assertSucceeds(
      uploadString(ref(worker, storageFilePath(farmA, 'worker-a.png')), 'image', 'raw', {
        contentType: 'image/png',
        customMetadata: { organizationId, farmId: farmA, uploadedBy: users.worker },
      }),
    )
    await assertFails(
      uploadString(ref(worker, storageFilePath(farmB, 'worker-b.png')), 'image', 'raw', {
        contentType: 'image/png',
        customMetadata: { organizationId, farmId: farmB, uploadedBy: users.worker },
      }),
    )
  })

  it('denies forged metadata and read-only roles', async () => {
    const worker = authenticatedStorage(users.worker)
    const viewer = authenticatedStorage(users.viewer)
    await assertFails(
      uploadString(ref(worker, storageFilePath(farmA, 'forged.png')), 'image', 'raw', {
        contentType: 'image/png',
        customMetadata: { organizationId, farmId: farmB, uploadedBy: users.worker },
      }),
    )
    await assertFails(
      uploadString(ref(viewer, storageFilePath(farmA, 'viewer.png')), 'image', 'raw', {
        contentType: 'image/png',
        customMetadata: { organizationId, farmId: farmA, uploadedBy: users.viewer },
      }),
    )
  })

  it('accepts only JPEG, PNG or WebP content and never permits client deletion', async () => {
    const worker = authenticatedStorage(users.worker)
    const owner = authenticatedStorage(users.owner)
    await assertFails(
      uploadString(ref(worker, storageFilePath(farmA, 'active.svg')), '<svg></svg>', 'raw', {
        contentType: 'image/svg+xml',
        customMetadata: { organizationId, farmId: farmA, uploadedBy: users.worker },
      }),
    )
    await assertFails(
      uploadString(ref(worker, storageFilePath(farmA, 'fake.png')), 'not an image', 'raw', {
        contentType: 'application/octet-stream',
        customMetadata: { organizationId, farmId: farmA, uploadedBy: users.worker },
      }),
    )
    await assertFails(deleteObject(ref(worker, storageFilePath(farmA, 'existing-a.png'))))
    await assertFails(deleteObject(ref(owner, storageFilePath(farmA, 'existing-a.png'))))
  })

  it('allows archived-file reads but denies archived uploads', async () => {
    const worker = authenticatedStorage(users.worker)
    await assertSucceeds(
      getMetadata(ref(worker, storageFilePath(archivedFarm, 'existing-archived.png'))),
    )
    await assertFails(
      uploadString(ref(worker, storageFilePath(archivedFarm, 'new.png')), 'image', 'raw', {
        contentType: 'image/png',
        customMetadata: {
          organizationId,
          farmId: archivedFarm,
          uploadedBy: users.worker,
        },
      }),
    )
  })
})
