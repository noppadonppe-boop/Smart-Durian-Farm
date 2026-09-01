import { readFile } from 'node:fs/promises'

import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, Timestamp, type Firestore } from 'firebase/firestore'

import type {
  TreeRegisterRepository,
  WorkCareDiseaseRepository,
} from '../adapters/contracts'
import type { AuthenticatedIdentity, CanonicalRole, FarmAccess } from '../domain/farm'
import type { TreePositionDetail } from '../domain/treeRegister'
import type { DiseaseIncidentRecord } from '../domain/workCareDisease'
import { FirebaseDiseaseAnalysisRepository } from '../infrastructure/firebase/firebaseDiseaseAnalysisRepository'

const projectId = 'demo-smart-durian-disease-analysis'
const organizationId = 'org_analysis_rules_demo'
const farmA = 'farm_analysis_rules_a'
const farmB = 'farm_analysis_rules_b'
const ownerId = 'analysis_owner_01'
const managerId = 'analysis_manager_02'
const agronomistId = 'analysis_agronomist_03'
const workerId = 'analysis_worker_04'
const positionA = 'pos_analysis_tree_a001'
const positionB = 'pos_analysis_tree_b001'
const cycleId = 'cycle_001'
const incidentA = 'disease_analysis_incident_a001'
const incidentB = 'disease_analysis_incident_b001'
const symptomA = 'SIMULATED/TEST ONLY — อาการทางใบจำลอง'
const symptomB = 'SIMULATED/TEST ONLY — อาการจำลองสวน B'
let environment: RulesTestEnvironment

function farmPath(farmId: string): string {
  return `organizations/${organizationId}/farms/${farmId}`
}

function identity(userId: string): AuthenticatedIdentity {
  return {
    userId,
    displayName: `ผู้ใช้จำลอง ${userId}`,
    maskedPhone: '+165••••040',
    source: 'firebase-emulator',
  }
}

function farm(role: CanonicalRole, userId: string, farmId = farmA): FarmAccess {
  return {
    organizationId,
    organizationName: 'องค์กร Analysis จำลอง',
    organizationCode: 'ANALYSIS',
    farmId,
    farmCode: farmId === farmA ? 'ANALYSIS-F01' : 'ANALYSIS-F02',
    farmSequence: farmId === farmA ? 'F01' : 'F02',
    farmName: 'สวน Analysis จำลอง',
    farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    role,
    isOrganizationOwner: userId === ownerId,
    isMock: true,
  }
}

function incident(farmId: string): DiseaseIncidentRecord {
  const isFarmA = farmId === farmA
  return {
    organizationId,
    farmId,
    incidentId: isFarmA ? incidentA : incidentB,
    positionId: isFarmA ? positionA : positionB,
    observedSymptom: isFarmA ? symptomA : symptomB,
    severity: 'MEDIUM',
    suspectedDiagnosis: '',
    followUpDate: '2026-09-06',
    status: 'AWAITING_DIAGNOSIS',
    confirmedDiagnosis: '',
    treatmentPlan: '',
    specialistApprovalStatus: 'PENDING_SPECIALIST',
    outcome: '',
    photos: [],
    treatmentWorkOrderId: null,
    version: 1,
    exampleData: true,
    reportedBy: workerId,
    createdAtLabel: 'SIMULATED/TEST ONLY',
    audit: [],
  }
}

function tree(farmId: string): TreePositionDetail {
  const isFarmA = farmId === farmA
  const positionId = isFarmA ? positionA : positionB
  const currentCycle = {
    cycleId,
    cycleNumber: 1,
    variety: null,
    varietyConfidence: 'unknown' as const,
    plantingYear: null,
    plantingYearCalendar: null,
    plantingYearConfidence: 'unknown' as const,
    treeStatus: 'watch' as const,
    baselineDate: '2026-09-01',
    notes: 'SIMULATED/TEST ONLY',
    startedAtLabel: 'SIMULATED/TEST ONLY',
    endedAtLabel: null,
    version: 1,
  }
  return {
    organizationId,
    farmId,
    positionId,
    organizationCode: 'ANALYSIS',
    farmSequence: isFarmA ? 'F01' : 'F02',
    zoneCode: 'Z01',
    rowCode: 'R01',
    treeSequence: 1,
    tagCode: isFarmA ? 'ANALYSIS-F01-Z01-R01-T001' : 'ANALYSIS-F02-Z01-R01-T001',
    positionStatus: 'ACTIVE',
    currentCycleNumber: 1,
    currentCycle,
    qrPath: `/t/${positionId}`,
    version: 1,
    exampleData: true,
    plantingCycles: [currentCycle],
    timeline: [],
  }
}

const workDependency = {
  listDiseaseIncidents: (context: { farm: FarmAccess }) => Promise.resolve([incident(context.farm.farmId)]),
} as unknown as WorkCareDiseaseRepository

const treeDependency = {
  getTreePosition: (_organizationId: string, farmId: string, positionId: string) => {
    const result = tree(farmId)
    return Promise.resolve(result.positionId === positionId ? result : undefined)
  },
} as unknown as TreeRegisterRepository

function repository(userId: string) {
  const context = environment.authenticatedContext(userId)
  return new FirebaseDiseaseAnalysisRepository(
    context.firestore() as unknown as Firestore,
    workDependency,
    treeDependency,
  )
}

function draft(farmId = farmA) {
  const source = incident(farmId)
  return {
    incidentId: source.incidentId,
    positionId: source.positionId,
    plantingCycleId: cycleId,
    evidenceScenario: 'CLEAR_SYMPTOM_PATTERN' as const,
    observedSymptom: source.observedSymptom,
  }
}

async function seed(): Promise<void> {
  await environment.withSecurityRulesDisabled(async (context) => {
    const firestore = context.firestore() as unknown as Firestore
    const now = Timestamp.fromDate(new Date('2026-09-01T05:00:00.000Z'))
    await setDoc(doc(firestore, 'organizations', organizationId), {
      organizationId, organizationName: 'องค์กร Analysis จำลอง',
      organizationCode: 'ANALYSIS', status: 'ACTIVE', updatedAt: now,
    })
    for (const userId of [ownerId, managerId, agronomistId, workerId]) {
      await setDoc(doc(firestore, 'organizations', organizationId, 'members', userId), {
        organizationId, userId, status: 'ACTIVE', isOwner: userId === ownerId,
        createdAt: now, updatedAt: now,
      })
    }
    for (const currentFarmId of [farmA, farmB]) {
      await setDoc(doc(firestore, farmPath(currentFarmId)), {
        organizationId, farmId: currentFarmId,
        farmCode: currentFarmId === farmA ? 'ANALYSIS-F01' : 'ANALYSIS-F02',
        farmSequence: currentFarmId === farmA ? 'F01' : 'F02',
        farmName: 'สวน Analysis จำลอง', status: 'ACTIVE',
        createdAt: now, updatedAt: now,
      })
      const source = incident(currentFarmId)
      await setDoc(doc(firestore, `${farmPath(currentFarmId)}/treePositions/${source.positionId}`), {
        recordType: 'TREE_POSITION', organizationId, farmId: currentFarmId,
        positionId: source.positionId, positionStatus: 'ACTIVE', exampleData: true,
      })
      await setDoc(doc(firestore, `${farmPath(currentFarmId)}/treePositions/${source.positionId}/plantingCycles/${cycleId}`), {
        recordType: 'PLANTING_CYCLE', cycleId, cycleNumber: 1, exampleData: true,
      })
      await setDoc(doc(firestore, `${farmPath(currentFarmId)}/diseaseIncidents/${source.incidentId}`), {
        recordType: 'DISEASE_INCIDENT', organizationId, farmId: currentFarmId,
        incidentId: source.incidentId, positionId: source.positionId,
        observedSymptom: source.observedSymptom, exampleData: true,
      })
    }
    for (const [currentFarmId, userId, role] of [
      [farmA, ownerId, 'ORG_OWNER'], [farmB, ownerId, 'ORG_OWNER'],
      [farmA, managerId, 'FARM_MANAGER'], [farmA, agronomistId, 'AGRONOMIST'],
      [farmB, agronomistId, 'AGRONOMIST'], [farmA, workerId, 'WORKER'],
    ] as const) {
      await setDoc(doc(firestore, `${farmPath(currentFarmId)}/members/${userId}`), {
        membershipType: 'FARM', organizationId, farmId: currentFarmId, userId,
        displayName: identity(userId).displayName, maskedPhone: '+165••••040',
        role, status: 'ACTIVE', version: 1, auditEventId: 'seed',
        exampleData: true, createdAt: now, updatedAt: now,
      })
    }
  })
}

beforeAll(async () => {
  const firestoreRules = await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8')
  environment = await initializeTestEnvironment({ projectId, firestore: { rules: firestoreRules } })
})

beforeEach(async () => {
  await environment.clearFirestore()
  await seed()
})

afterAll(async () => environment.cleanup())

describe('Firebase Disease Analysis P1 repository and Rules', () => {
  it('creates and replays one deterministic session with Farm-scoped audit', async () => {
    const ownerRepository = repository(ownerId)
    const context = { actor: identity(ownerId), farm: farm('ORG_OWNER', ownerId) }
    const created = await ownerRepository.createDiseaseAnalysisSession(
      context, 'analysis_create_rules_001', draft(),
    )
    const replay = await ownerRepository.createDiseaseAnalysisSession(
      context, 'analysis_create_rules_001', draft(),
    )

    expect(replay.analysisSessionId).toBe(created.analysisSessionId)
    expect(created).toMatchObject({
      farmId: farmA,
      status: 'HUMAN_REVIEW_REQUIRED',
      analysisSource: 'MOCK_DETERMINISTIC_V1',
      diagnosisWritebackStatus: 'NOT_WRITTEN',
      syncState: 'EMULATOR_SYNCED',
    })
    expect(created.audit[0]?.eventType).toBe('MOCK_ANALYSIS_COMPLETED')
  })

  it('allows Agronomist review but denies Manager, Worker and cross-farm access', async () => {
    const ownerContext = { actor: identity(ownerId), farm: farm('ORG_OWNER', ownerId) }
    const created = await repository(ownerId).createDiseaseAnalysisSession(
      ownerContext, 'analysis_review_seed_001', draft(),
    )
    const candidate = created.candidateFindings[0]!

    await expect(repository(managerId).reviewDiseaseAnalysisSession(
      { actor: identity(managerId), farm: farm('FARM_MANAGER', managerId) },
      created.analysisSessionId,
      'analysis_manager_review_01',
      { disposition: 'ACCEPTED', reviewedFindingLabel: candidate.label, note: '' },
    )).rejects.toThrow(/Agronomist/u)

    const agronomistContext = {
      actor: identity(agronomistId),
      farm: farm('AGRONOMIST', agronomistId),
    }
    const reviewed = await repository(agronomistId).reviewDiseaseAnalysisSession(
      agronomistContext,
      created.analysisSessionId,
      'analysis_agronomist_review_01',
      { disposition: 'ACCEPTED', reviewedFindingLabel: candidate.label, note: '' },
    )
    expect(reviewed).toMatchObject({
      status: 'REVIEWED',
      reviewDisposition: 'ACCEPTED',
      diagnosisWritebackStatus: 'NOT_WRITTEN',
    })
    expect(reviewed.audit[0]?.eventType).toBe('HUMAN_REVIEW_ACCEPTED')

    await expect(repository(workerId).listDiseaseAnalysisSessions({
      actor: identity(workerId),
      farm: farm('WORKER', workerId),
    })).rejects.toThrow()

    const managerFirestore = environment.authenticatedContext(managerId).firestore()
    await assertFails(getDoc(doc(
      managerFirestore,
      `${farmPath(farmB)}/diseaseAnalysisSessions/${created.analysisSessionId}`,
    )))
  })
})
