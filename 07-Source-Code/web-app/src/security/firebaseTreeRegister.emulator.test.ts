import { readFile } from 'node:fs/promises'

import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  doc,
  setDoc,
  Timestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'

import { FirebaseTreeRegisterRepository } from '../infrastructure/firebase/firebaseTreeRegisterRepository'
import type { AuthenticatedIdentity, FarmAccess } from '../domain/farm'
import {
  emptyTreeBaselineMeasurements,
  previewTreeRegisterCsv,
  treeRegisterCsvHeaders,
} from '../domain/treeRegister'

const projectId = 'demo-smart-durian'
const organizationId = 'org_tree_rules_demo'
const farmA = 'farm_tree_rules_a'
const farmB = 'farm_tree_rules_b'
const ownerId = 'tree_owner_01'
const workerId = 'tree_worker_02'
const positionA = 'pos_rules_tree_a0001'
const positionB = 'pos_rules_tree_b0001'

let environment: RulesTestEnvironment

function farmPath(farmId: string): string {
  return `durian-smartfarm/root/organizations/${organizationId}/farms/${farmId}`
}

function positionPath(farmId: string, positionId: string): string {
  return `${farmPath(farmId)}/treePositions/${positionId}`
}

async function seedPosition(
  firestore: Firestore,
  farmId: string,
  positionId: string,
  farmSequence: string,
  tagCode: string,
): Promise<void> {
  const now = Timestamp.fromDate(new Date('2026-08-31T06:00:00.000Z'))
  const eventId = `event_seed_${positionId}`
  await setDoc(doc(firestore, positionPath(farmId, positionId)), {
    recordType: 'TREE_POSITION', organizationId, farmId, positionId,
    organizationCode: 'RULES', farmSequence, zoneCode: 'Z01', rowCode: 'R01',
    treeSequence: 1, tagCode, rowCountingDirection: 'TBD', positionStatus: 'ACTIVE', currentCycleNumber: 1,
    qrPath: `/t/${positionId}`, version: 1, lastEventId: eventId,
    exampleData: true, createdBy: ownerId, createdAt: now,
    updatedBy: ownerId, updatedAt: now,
  })
  await setDoc(doc(firestore, `${positionPath(farmId, positionId)}/plantingCycles/cycle_001`), {
    recordType: 'PLANTING_CYCLE', cycleId: 'cycle_001', cycleNumber: 1,
    variety: null, varietyConfidence: 'unknown', plantingYear: null,
    plantingYearCalendar: null, plantingYearConfidence: 'unknown', plantSource: null,
    treeStatus: 'empty', baselineDate: '2026-08-31',
    baselineMeasurements: emptyTreeBaselineMeasurements(), notes: 'EXAMPLE DATA ONLY', startedAt: now,
    endedAt: null, version: 1, createdBy: ownerId, updatedBy: ownerId,
    updatedAt: now, exampleData: true,
  })
  await setDoc(doc(firestore, `${positionPath(farmId, positionId)}/events/${eventId}`), {
    recordType: 'TREE_EVENT', eventId, eventType: 'TREE_POSITION_CREATED',
    organizationId, farmId, positionId, actorUserId: ownerId,
    actorDisplayName: 'Owner จำลอง', description: 'Seed example position',
    positionVersion: 1, exampleData: true, createdAt: now,
  })
  await setDoc(doc(firestore, `${farmPath(farmId)}/treeTags/${tagCode}`), {
    recordType: 'TREE_TAG_INDEX', organizationId, farmId, positionId, tagCode,
    exampleData: true, createdBy: ownerId, createdAt: now,
  })
  await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'positionRoutes', positionId), {
    recordType: 'POSITION_ROUTE', organizationId, farmId, positionId,
    exampleData: true, createdBy: ownerId, createdAt: now,
  })
}

async function seed(): Promise<void> {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore() as unknown as Firestore
    const now = Timestamp.fromDate(new Date('2026-08-31T05:00:00.000Z'))
    await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId), {
      organizationId, organizationName: 'องค์กร Tree Rules จำลอง',
      organizationCode: 'RULES', status: 'ACTIVE', updatedAt: now,
    })
    for (const [userId, isOwner] of [[ownerId, true], [workerId, false]] as const) {
      await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId, 'members', userId), {
        organizationId, userId, status: 'ACTIVE', isOwner, createdAt: now, updatedAt: now,
      })
    }
    for (const [farmId, farmSequence] of [[farmA, 'F01'], [farmB, 'F02']] as const) {
      await setDoc(doc(firestore, farmPath(farmId)), {
        organizationId, farmId, farmCode: `RULES-${farmSequence}`, farmSequence,
        farmName: `สวน ${farmSequence} จำลอง`, status: 'ACTIVE', createdAt: now, updatedAt: now,
      })
    }
    for (const [farmId, userId, role] of [
      [farmA, ownerId, 'ORG_OWNER'], [farmB, ownerId, 'ORG_OWNER'],
      [farmA, workerId, 'WORKER'],
    ] as const) {
      await setDoc(doc(firestore, `${farmPath(farmId)}/members/${userId}`), {
        membershipType: 'FARM', organizationId, farmId, userId,
        displayName: userId === ownerId ? 'Owner จำลอง' : 'Worker จำลอง',
        maskedPhone: '+165••••000', role, status: 'ACTIVE', version: 1,
        auditEventId: 'seed', createdAt: now, updatedAt: now,
      })
    }
    await seedPosition(firestore, farmA, positionA, 'F01', 'RULES-F01-Z01-R01-T001')
    await seedPosition(firestore, farmB, positionB, 'F02', 'RULES-F02-Z01-R01-T001')
  })
}

function identity(userId: string): AuthenticatedIdentity {
  return {
    userId,
    displayName: userId === ownerId ? 'Owner จำลอง' : 'Worker จำลอง',
    maskedPhone: '+165••••000',
    source: 'firebase-emulator',
  }
}

function farm(role: FarmAccess['role'], userId = ownerId): FarmAccess {
  return {
    organizationId, organizationName: 'องค์กร Tree Rules จำลอง',
    organizationCode: 'RULES', farmId: farmA, farmCode: 'RULES-F01',
    farmSequence: 'F01', farmName: 'สวน F01 จำลอง', farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE', role, isOrganizationOwner: userId === ownerId,
    isMock: true,
  }
}

function importRow(sequence: number): string {
  const values: Record<string, string> = {
    recordType: 'FIELD_DATA', organizationCode: 'RULES', farmSequence: 'F01',
    zoneCode: 'Z02', rowCode: 'R01', treeSequence: String(sequence),
    tagCode: `RULES-F01-Z02-R01-T${String(sequence).padStart(3, '0')}`,
    plantingCycle: '1', varietyConfidence: 'unknown', plantingYearConfidence: 'unknown',
    treeStatus: 'empty', baselineDate: '2026-08-31', notes: 'TEST EXAMPLE DATA ONLY',
  }
  return treeRegisterCsvHeaders.map((field) => values[field] ?? '').join(',')
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

describe('Firebase Tree Register repository and Rules', () => {
  it('allows same-farm tree reads and denies a cross-farm QR route', async () => {
    const firestore = environment.authenticatedContext(workerId).firestore() as unknown as Firestore
    const repository = new FirebaseTreeRegisterRepository(firestore)
    expect(await repository.listTreePositions(organizationId, farmA)).toHaveLength(1)
    expect((await repository.resolvePositionRoute(
      { actor: identity(workerId), farm: farm('WORKER', workerId) },
      positionB,
    )).status).toBe('ACCESS_DENIED')
  })

  it('creates a position atomically with cycle, tag index, route and event', async () => {
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebaseTreeRegisterRepository(firestore)
    const created = await repository.createTreePosition(
      { actor: identity(ownerId), farm: farm('ORG_OWNER') },
      {
        organizationCode: 'RULES', farmSequence: 'F01', zoneCode: 'Z01',
        rowCode: 'R01', treeSequence: 2, rowCountingDirection: 'TBD', variety: null,
        varietyConfidence: 'unknown', plantingYear: null,
        plantingYearCalendar: null, plantingYearConfidence: 'unknown', plantSource: null,
        treeStatus: 'empty', baselineDate: '2026-08-31',
        baselineMeasurements: emptyTreeBaselineMeasurements(), notes: 'EXAMPLE DATA ONLY',
      },
    )
    expect(created.tagCode).toBe('RULES-F01-Z01-R01-T002')
    expect((await repository.resolvePositionRoute(
      { actor: identity(ownerId), farm: farm('ORG_OWNER') },
      created.positionId,
    )).status).toBe('FOUND')
  })

  it('stores new Tree Register records as field data when the repository is in operational mode', async () => {
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebaseTreeRegisterRepository(firestore, false)
    const created = await repository.createTreePosition(
      { actor: identity(ownerId), farm: { ...farm('ORG_OWNER'), isMock: false } },
      {
        organizationCode: 'RULES', farmSequence: 'F01', zoneCode: 'Z01',
        rowCode: 'R01', treeSequence: 3, rowCountingDirection: 'ASCENDING',
        variety: null, varietyConfidence: 'unknown', plantingYear: null,
        plantingYearCalendar: null, plantingYearConfidence: 'unknown', plantSource: null,
        treeStatus: 'empty', baselineDate: '2026-08-31',
        baselineMeasurements: emptyTreeBaselineMeasurements(), notes: 'ตำแหน่งภาคสนาม',
      },
    )
    expect(created.exampleData).toBe(false)
    expect(created.rowCountingDirection).toBe('ASCENDING')
  })

  it('denies tree master creation to a worker and forged identity updates', async () => {
    const workerFirestore = environment.authenticatedContext(workerId).firestore() as unknown as Firestore
    const workerRepository = new FirebaseTreeRegisterRepository(workerFirestore)
    await expect(workerRepository.createTreePosition(
      { actor: identity(workerId), farm: farm('WORKER', workerId) },
      {
        organizationCode: 'RULES', farmSequence: 'F01', zoneCode: 'Z01',
        rowCode: 'R01', treeSequence: 2, rowCountingDirection: 'TBD', variety: null,
        varietyConfidence: 'unknown', plantingYear: null,
        plantingYearCalendar: null, plantingYearConfidence: 'unknown', plantSource: null,
        treeStatus: 'empty', baselineDate: '2026-08-31',
        baselineMeasurements: emptyTreeBaselineMeasurements(), notes: 'EXAMPLE',
      },
    )).rejects.toThrow(/เจ้าขององค์กรหรือผู้จัดการ/u)

    const ownerFirestore = environment.authenticatedContext(ownerId).firestore()
    await assertFails(updateDoc(doc(ownerFirestore, positionPath(farmA, positionA)), {
      tagCode: 'RULES-F01-Z01-R01-T999',
    }))
  })

  it('keeps history through update, replacement and archive while reserving the tag', async () => {
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebaseTreeRegisterRepository(firestore)
    const context = { actor: identity(ownerId), farm: farm('ORG_OWNER') }
    await repository.updateCurrentPlantingCycle(context, positionA, {
      variety: 'พันธุ์ทดสอบ', varietyConfidence: 'estimated', plantingYear: null,
      plantingYearCalendar: null, plantingYearConfidence: 'unknown', plantSource: null,
      treeStatus: 'watch', baselineDate: '2026-08-31',
      baselineMeasurements: emptyTreeBaselineMeasurements(), notes: 'TEST UPDATE',
    })
    const replaced = await repository.replacePlantingCycle(context, positionA, {
      variety: null, varietyConfidence: 'unknown', plantingYear: null,
      plantingYearCalendar: null, plantingYearConfidence: 'unknown', plantSource: null,
      treeStatus: 'empty', notes: 'TEST REPLACEMENT', baselineDate: '2026-08-31',
      baselineMeasurements: emptyTreeBaselineMeasurements(),
      reason: 'ทดสอบรอบปลูกใหม่',
    })
    expect(replaced.currentCycleNumber).toBe(2)
    expect(replaced.plantingCycles).toHaveLength(2)
    const archived = await repository.archiveTreePosition(context, positionA, 'ทดสอบ archive')
    expect(archived.positionStatus).toBe('ARCHIVED')
    await expect(repository.createTreePosition(context, {
      organizationCode: 'RULES', farmSequence: 'F01', zoneCode: 'Z01',
      rowCode: 'R01', treeSequence: 1, rowCountingDirection: 'TBD', variety: null,
      varietyConfidence: 'unknown', plantingYear: null,
      plantingYearCalendar: null, plantingYearConfidence: 'unknown', plantSource: null,
      treeStatus: 'empty', baselineDate: '2026-08-31',
      baselineMeasurements: emptyTreeBaselineMeasurements(), notes: 'TEST',
    })).rejects.toThrow(/ห้ามนำกลับมาใช้/u)
  })

  it('imports once and returns the same opaque IDs on retry', async () => {
    const firestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const repository = new FirebaseTreeRegisterRepository(firestore)
    const csv = `${treeRegisterCsvHeaders.join(',')}\n${importRow(10)}\n${importRow(11)}`
    const preview = previewTreeRegisterCsv(csv, 'RULES', 'F01')
    const context = { actor: identity(ownerId), farm: farm('ORG_OWNER') }
    const first = await repository.importTreePositions(context, preview.idempotencyKey, preview.candidates)
    const retry = await repository.importTreePositions(context, preview.idempotencyKey, preview.candidates)
    expect(first.importedCount).toBe(2)
    expect(retry.wasRetry).toBe(true)
    expect(retry.positionIds).toEqual(first.positionIds)
  })
})
