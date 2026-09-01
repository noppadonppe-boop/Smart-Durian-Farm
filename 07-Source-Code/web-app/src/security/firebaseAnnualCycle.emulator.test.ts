import { readFile } from 'node:fs/promises'

import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore'

import type { AnnualCycleMutationContext, AnnualCycleRecord } from '../domain/annualFarmCycle'
import type { CanonicalRole } from '../domain/farm'
import { FirebaseAnnualCycleRepository } from '../infrastructure/firebase/firebaseAnnualCycleRepository'

const projectId = 'demo-smart-durian'
const organizationId = 'org_annual_rules_demo'
const farmA = 'farm_annual_rules_a'
const farmB = 'farm_annual_rules_b'
const ownerId = 'annual_owner_01'
const managerId = 'annual_manager_02'
const workerId = 'annual_worker_03'
const activeA = 'annual_rules_a_2026'
const closedA = 'annual_rules_a_2025'
const draftA = 'annual_rules_a_2027'
const activeB = 'annual_rules_b_2026'
let environment: RulesTestEnvironment

function farmPath(farmId: string): string {
  return `durian-smartfarm/root/organizations/${organizationId}/farms/${farmId}`
}

function mutationContext(userId: string, role: CanonicalRole, farmId = farmA): AnnualCycleMutationContext {
  return {
    actor: {
      userId,
      displayName: `${userId} จำลอง`,
      maskedPhone: '000••••000',
      source: 'firebase-emulator',
    },
    farm: {
      organizationId,
      organizationName: 'องค์กร Annual Cycle จำลอง',
      organizationCode: 'ANNUAL',
      farmId,
      farmCode: farmId === farmA ? 'ANNUAL-F01' : 'ANNUAL-F02',
      farmSequence: farmId === farmA ? 'F01' : 'F02',
      farmName: 'สวน Annual Cycle จำลอง',
      farmStatus: 'ACTIVE',
      membershipStatus: 'ACTIVE',
      role,
      isOrganizationOwner: userId === ownerId,
      isMock: true,
    },
  }
}

function repository(userId: string) {
  return new FirebaseAnnualCycleRepository(
    environment.authenticatedContext(userId).firestore() as unknown as Firestore,
  )
}

function cycle(
  annualCycleId: string,
  farmId: string,
  periodStart: string,
  periodEndExclusive: string,
  status: AnnualCycleRecord['status'],
): AnnualCycleRecord {
  return {
    organizationId,
    farmId,
    annualCycleId,
    cycleCode: `AFY-${periodStart.slice(0, 7)}`,
    name: 'รอบปีจำลอง',
    periodStart,
    periodEndExclusive,
    timezone: 'Asia/Bangkok',
    notes: 'SIMULATED/TEST ONLY',
    previousAnnualCycleId: null,
    status,
    revision: 1,
    supersedesRevisionId: null,
    lastCorrectionId: null,
    version: 1,
    createdBy: ownerId,
    updatedBy: ownerId,
    createdAtLabel: 'seed',
    updatedAtLabel: 'seed',
    exampleData: true,
  }
}

async function seed() {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore() as unknown as Firestore
    const now = Timestamp.fromDate(new Date('2026-09-01T02:00:00.000Z'))
    await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId), {
      organizationId, status: 'ACTIVE', exampleData: true, updatedAt: now,
    })
    for (const [userId, role] of [
      [ownerId, 'ORG_OWNER'], [managerId, 'FARM_MANAGER'], [workerId, 'WORKER'],
    ] as const) {
      await setDoc(doc(firestore, 'durian-smartfarm', 'root', 'organizations', organizationId, 'members', userId), {
        organizationId, userId, status: 'ACTIVE', isOwner: userId === ownerId,
        exampleData: true, createdAt: now, updatedAt: now,
      })
      await setDoc(doc(firestore, `${farmPath(farmA)}/members/${userId}`), {
        membershipType: 'FARM', organizationId, farmId: farmA, userId,
        displayName: userId, maskedPhone: '000••••000', role,
        status: 'ACTIVE', version: 1, auditEventId: 'seed', exampleData: true,
        createdAt: now, updatedAt: now,
      })
    }
    for (const farmId of [farmA, farmB]) {
      await setDoc(doc(firestore, farmPath(farmId)), {
        organizationId, farmId, status: 'ACTIVE', exampleData: true,
        createdAt: now, updatedAt: now,
      })
    }
    const records = [
      cycle(closedA, farmA, '2025-06-01', '2026-06-01', 'CLOSED'),
      cycle(activeA, farmA, '2026-06-01', '2027-06-01', 'ACTIVE'),
      cycle(draftA, farmA, '2027-06-01', '2028-06-01', 'DRAFT'),
      cycle(activeB, farmB, '2026-07-15', '2027-07-15', 'ACTIVE'),
    ]
    for (const record of records) {
      await setDoc(doc(firestore, `${farmPath(record.farmId)}/annualCycles/${record.annualCycleId}`), {
        ...record, actorUserId: ownerId, createdAt: now, updatedAt: now,
      })
    }
    for (const record of records.filter((item) => item.status === 'ACTIVE')) {
      await setDoc(doc(firestore, `${farmPath(record.farmId)}/annualCycleGuards/current`), {
        organizationId, farmId: record.farmId, annualCycleId: record.annualCycleId,
        status: record.status, actorUserId: ownerId, exampleData: true, updatedAt: now,
      })
    }
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

describe('Annual Cycle Firebase Emulator rules and repository', () => {
  it('reads only the current farm and creates a non-overlapping custom-start draft idempotently', async () => {
    const ownerRepository = repository(ownerId)
    const snapshot = await ownerRepository.listSnapshot(mutationContext(ownerId, 'ORG_OWNER'))
    expect(snapshot.cycles).toHaveLength(3)
    expect(snapshot.selectedCycle?.annualCycleId).toBe(activeA)

    const draft = {
      cycleCode: 'AFY-2028-07-15',
      name: 'รอบเริ่มเฉพาะสวนจำลอง',
      periodStart: '2028-07-15',
      timezone: 'Asia/Bangkok',
      notes: 'SIMULATED/TEST ONLY',
      previousAnnualCycleId: draftA,
    }
    const created = await ownerRepository.createCycle(
      mutationContext(ownerId, 'ORG_OWNER'), 'create-custom', draft,
    )
    const retried = await ownerRepository.createCycle(
      mutationContext(ownerId, 'ORG_OWNER'), 'create-custom', draft,
    )
    expect(retried.annualCycleId).toBe(created.annualCycleId)

    await expect(ownerRepository.listSnapshot(
      mutationContext(workerId, 'WORKER', farmB),
    )).rejects.toThrow()
  })

  it('denies forged Manager cycle creation but allows a farm-level annual plan', async () => {
    const managerFirestore = environment.authenticatedContext(managerId).firestore() as unknown as Firestore
    await assertFails(setDoc(doc(managerFirestore, `${farmPath(farmA)}/annualCycles/forged_manager`), {
      ...cycle('forged_manager', farmA, '2030-06-01', '2031-06-01', 'DRAFT'),
      actorUserId: managerId, createdBy: managerId, updatedBy: managerId,
      createdAt: Timestamp.now(), updatedAt: Timestamp.now(),
    }))

    const result = await repository(managerId).createPlanItem(
      mutationContext(managerId, 'FARM_MANAGER'), activeA, 'manager-plan', {
        title: 'แผนระดับสวนจำลอง', category: 'CARE',
        target: { scope: 'FARM', zoneCodes: [], positionIds: [] },
        triggerType: 'DATE_WINDOW', plannedStart: '2026-09-01',
        plannedEndExclusive: '2026-10-01', cropStage: null, conditionNote: '',
        responsibleRole: 'FARM_MANAGER', plannedQuantity: null, plannedUnit: '',
        plannedDirectCostBaht: null, notes: 'SIMULATED/TEST ONLY',
      },
    )
    expect(result.target.scope).toBe('FARM')
  })

  it('keeps one active guard and preserves closed-cycle correction revisions', async () => {
    const ownerRepository = repository(ownerId)
    await ownerRepository.transitionCycle(
      mutationContext(ownerId, 'ORG_OWNER'), draftA, 'plan-future', 'PLANNED', 'อนุมัติแผนจำลอง',
    )
    await expect(ownerRepository.transitionCycle(
      mutationContext(ownerId, 'ORG_OWNER'), draftA, 'activate-future', 'ACTIVE', 'เริ่มรอบจำลอง',
    )).rejects.toThrow('มีรอบ')

    const correctionDraft = {
      cycleCode: 'AFY-2025-06', name: 'รอบปิดที่แก้หมายเหตุ',
      periodStart: '2025-06-01', timezone: 'Asia/Bangkok',
      notes: 'SIMULATED/TEST ONLY — corrected', previousAnnualCycleId: null,
    }
    const correction = await ownerRepository.correctCycle(
      mutationContext(ownerId, 'ORG_OWNER'), closedA, 'correct-closed',
      correctionDraft, 'แก้หมายเหตุรอบปิดจำลอง',
    )
    const retry = await ownerRepository.correctCycle(
      mutationContext(ownerId, 'ORG_OWNER'), closedA, 'correct-closed',
      correctionDraft, 'แก้หมายเหตุรอบปิดจำลอง',
    )
    expect(correction.cycle.revision).toBe(2)
    expect(correction.correction.beforeRevision).toBe(1)
    expect(correction.correction.afterRevision).toBe(2)
    expect(retry.correction.correctionId).toBe(correction.correction.correctionId)
    const ownerFirestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    await assertFails(updateDoc(
      doc(ownerFirestore, `${farmPath(farmA)}/annualCycleAuditEvents/${correction.correction.auditEventId}`),
      { reason: 'ห้ามแก้ Audit ย้อนหลัง' },
    ))
  })

  it('allows farm members to read their own annual cycle documents', async () => {
    const workerFirestore = environment.authenticatedContext(workerId).firestore() as unknown as Firestore
    await assertSucceeds(getDoc(doc(workerFirestore, `${farmPath(farmA)}/annualCycles/${activeA}`)))
    await assertFails(setDoc(
      doc(workerFirestore, `${farmPath(farmA)}/annualCycles/worker_write_denied`), {},
    ))
  })

  it('denies deleting or switching the active guard without the matching cycle transition', async () => {
    const ownerRepository = repository(ownerId)
    await ownerRepository.transitionCycle(
      mutationContext(ownerId, 'ORG_OWNER'), draftA, 'plan-before-forge',
      'PLANNED', 'เตรียมทดสอบการปลอม guard',
    )

    const ownerFirestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const guardReference = doc(ownerFirestore, `${farmPath(farmA)}/annualCycleGuards/current`)
    await assertFails(deleteDoc(guardReference))

    const batch = writeBatch(ownerFirestore)
    batch.update(doc(ownerFirestore, `${farmPath(farmA)}/annualCycles/${draftA}`), {
      status: 'ACTIVE', version: 3, updatedBy: ownerId, actorUserId: ownerId,
      updatedAtLabel: 'forged', updatedAt: serverTimestamp(),
    })
    batch.update(guardReference, {
      annualCycleId: draftA, status: 'ACTIVE', actorUserId: ownerId,
      updatedAt: serverTimestamp(),
    })
    await assertFails(batch.commit())
  })

  it('denies a standalone correction record that is not coupled to the cycle revision', async () => {
    const ownerFirestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const before = cycle(closedA, farmA, '2025-06-01', '2026-06-01', 'CLOSED')
    const correctionId = 'forged_standalone_correction'
    await assertFails(setDoc(
      doc(ownerFirestore, `${farmPath(farmA)}/annualCycleCorrections/${correctionId}`),
      {
        organizationId, farmId: farmA, annualCycleId: closedA, correctionId,
        auditEventId: 'missing_audit_for_forged_correction',
        reason: 'พยายามสร้าง Correction แยกจากการแก้รอบ',
        before: {
          cycleCode: before.cycleCode, name: before.name,
          periodStart: before.periodStart, periodEndExclusive: before.periodEndExclusive,
          timezone: before.timezone, notes: before.notes,
          status: before.status, revision: 1,
        },
        after: {
          cycleCode: before.cycleCode, name: before.name,
          periodStart: before.periodStart, periodEndExclusive: before.periodEndExclusive,
          timezone: before.timezone, notes: 'forged',
          status: before.status, revision: 2,
        },
        beforeSummary: 'before', afterSummary: 'after',
        beforeRevision: 1, afterRevision: 2,
        actorUserId: ownerId, actorDisplayName: 'Owner จำลอง',
        createdAtLabel: 'forged', idempotencyKey: 'forged',
        exampleData: true, createdAt: serverTimestamp(),
      },
    ))
  })

  it('denies creating a plan in the same atomic write that closes its Annual Cycle', async () => {
    const ownerRepository = repository(ownerId)
    await ownerRepository.transitionCycle(
      mutationContext(ownerId, 'ORG_OWNER'), activeA, 'prepare-closing',
      'CLOSING', 'เตรียมทดสอบ final-state linkage',
    )

    const ownerFirestore = environment.authenticatedContext(ownerId).firestore() as unknown as Firestore
    const planItemId = 'forged_plan_during_close'
    const batch = writeBatch(ownerFirestore)
    batch.update(doc(ownerFirestore, `${farmPath(farmA)}/annualCycles/${activeA}`), {
      status: 'CLOSED', version: 3, updatedBy: ownerId, actorUserId: ownerId,
      updatedAtLabel: 'forged', updatedAt: serverTimestamp(),
    })
    batch.delete(doc(ownerFirestore, `${farmPath(farmA)}/annualCycleGuards/current`))
    batch.set(doc(ownerFirestore, `${farmPath(farmA)}/annualPlanItems/${planItemId}`), {
      organizationId, farmId: farmA, annualCycleId: activeA, planItemId,
      title: 'แผนที่ต้องไม่เกิดพร้อมการปิดรอบ', category: 'CARE',
      target: { scope: 'FARM', zoneCodes: [], positionIds: [] },
      triggerType: 'DATE_WINDOW', plannedStart: '2026-09-01',
      plannedEndExclusive: '2026-10-01', cropStage: null, conditionNote: '',
      responsibleRole: 'FARM_MANAGER', plannedQuantity: null, plannedUnit: '',
      plannedDirectCostBaht: null, notes: 'SIMULATED/TEST ONLY',
      status: 'PLANNED', copiedFromPlanItemId: null, linkedWorkOrderIds: [],
      version: 1, createdBy: ownerId, updatedBy: ownerId,
      createdAtLabel: 'forged', updatedAtLabel: 'forged', exampleData: true,
      actorUserId: ownerId, createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
    })
    await assertFails(batch.commit())
  })
})
