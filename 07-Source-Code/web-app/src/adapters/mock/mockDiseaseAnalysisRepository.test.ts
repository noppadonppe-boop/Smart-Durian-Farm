import { createMockPhase2Adapters } from './mockFoundationAdapters'
import type { AuthenticatedIdentity, CanonicalRole, FarmAccess } from '../../domain/farm'

const actor: AuthenticatedIdentity = {
  userId: 'user_demo_owner_01',
  displayName: 'เจ้าของสวนจำลอง',
  maskedPhone: '+165••••101',
  source: 'mock',
}

function farm(
  role: CanonicalRole,
  farmId = 'farm_demo_north_01',
): FarmAccess {
  return {
    organizationId: 'org_demo_kdoms_01',
    organizationName: 'องค์กรจำลอง',
    organizationCode: 'DEMO',
    farmId,
    farmCode: farmId === 'farm_demo_north_01' ? 'DEMO-F01' : 'DEMO-F02',
    farmSequence: farmId === 'farm_demo_north_01' ? 'F01' : 'F02',
    farmName: 'สวนข้อมูลจำลอง',
    farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    role,
    isOrganizationOwner: role === 'ORG_OWNER',
    isMock: true,
  }
}

const northDraft = {
  incidentId: 'disease_demo_000001',
  positionId: 'pos_demo_a02c914ed730',
  plantingCycleId: 'cycle_002',
  evidenceScenario: 'CLEAR_SYMPTOM_PATTERN' as const,
  observedSymptom: 'SIMULATED/TEST ONLY — พบใบมีจุดสีผิดปกติ',
}

describe('Mock Disease Analysis P1 repository', () => {
  it('isolates deterministic sessions by Farm and exposes the seeded Abstain scenario', async () => {
    const repository = createMockPhase2Adapters().diseaseAnalysisRepository
    const north = await repository.listDiseaseAnalysisSessions({ actor, farm: farm('ORG_OWNER') })
    const south = await repository.listDiseaseAnalysisSessions({
      actor,
      farm: farm('FARM_MANAGER', 'farm_demo_south_02'),
    })

    expect(north).toHaveLength(2)
    expect(north.every((session) => session.farmId === 'farm_demo_north_01')).toBe(true)
    expect(north.some((session) => session.analysisSessionId.includes('south'))).toBe(false)
    expect(north.some((session) => (
      session.evidenceScenario === 'CONFLICTING_OBSERVATIONS' &&
      session.abstainReason === 'CONFLICTING_OBSERVATIONS'
    ))).toBe(true)
    expect(south).toHaveLength(1)
    expect(south[0]).toMatchObject({
      farmId: 'farm_demo_south_02',
      abstainReason: 'LOW_EVIDENCE_QUALITY',
      candidateFindings: [],
    })
  })

  it('creates one idempotent local session and denies wrong-tree references', async () => {
    const repository = createMockPhase2Adapters().diseaseAnalysisRepository
    const context = { actor, farm: farm('ORG_OWNER') }
    const created = await repository.createDiseaseAnalysisSession(
      context,
      'analysis_create_000001',
      northDraft,
    )
    const replay = await repository.createDiseaseAnalysisSession(
      context,
      'analysis_create_000001',
      northDraft,
    )

    expect(replay.analysisSessionId).toBe(created.analysisSessionId)
    expect(replay.version).toBe(1)
    expect(created).toMatchObject({
      classification: 'SIMULATED/TEST ONLY',
      analysisSource: 'MOCK_DETERMINISTIC_V1',
      diagnosisWritebackStatus: 'NOT_WRITTEN',
      syncState: 'LOCAL_ONLY',
    })
    expect(created.audit).toHaveLength(1)

    await expect(repository.createDiseaseAnalysisSession(
      context,
      'analysis_wrong_tree_000001',
      { ...northDraft, positionId: 'pos_demo_a01f783bc219', plantingCycleId: 'cycle_001' },
    )).rejects.toThrow(/Wrong-Tree/u)
  })

  it('allows only Agronomist Human Review and keeps diagnosis writeback disabled', async () => {
    const adapters = createMockPhase2Adapters()
    const repository = adapters.diseaseAnalysisRepository
    const ownerContext = { actor, farm: farm('ORG_OWNER') }
    const created = await repository.createDiseaseAnalysisSession(
      ownerContext,
      'analysis_review_create_01',
      northDraft,
    )
    const candidate = created.candidateFindings[0]!

    await expect(repository.reviewDiseaseAnalysisSession(
      ownerContext,
      created.analysisSessionId,
      'analysis_owner_review_01',
      { disposition: 'ACCEPTED', reviewedFindingLabel: candidate.label, note: '' },
    )).rejects.toThrow(/Agronomist/u)

    const agronomistContext = {
      actor: { ...actor, userId: 'user_demo_agronomist_05', displayName: 'นักวิชาการเกษตรจำลอง' },
      farm: farm('AGRONOMIST'),
    }
    const reviewed = await repository.reviewDiseaseAnalysisSession(
      agronomistContext,
      created.analysisSessionId,
      'analysis_agro_review_01',
      { disposition: 'ACCEPTED', reviewedFindingLabel: candidate.label, note: 'ตรวจข้อมูลจำลองแล้ว' },
    )
    const replay = await repository.reviewDiseaseAnalysisSession(
      agronomistContext,
      created.analysisSessionId,
      'analysis_agro_review_01',
      { disposition: 'ACCEPTED', reviewedFindingLabel: candidate.label, note: 'ตรวจข้อมูลจำลองแล้ว' },
    )

    expect(replay.version).toBe(reviewed.version)
    expect(reviewed).toMatchObject({
      status: 'REVIEWED',
      reviewDisposition: 'ACCEPTED',
      diagnosisWritebackStatus: 'NOT_WRITTEN',
      version: 2,
    })
    expect(reviewed.audit[0]?.eventType).toBe('HUMAN_REVIEW_ACCEPTED')
  })

  it('denies Worker access and cross-farm session review', async () => {
    const repository = createMockPhase2Adapters().diseaseAnalysisRepository
    await expect(repository.listDiseaseAnalysisSessions({
      actor: { ...actor, userId: 'user_demo_worker_02' },
      farm: farm('WORKER'),
    })).rejects.toThrow(/ไม่มีสิทธิ์/u)

    const north = (await repository.listDiseaseAnalysisSessions({ actor, farm: farm('ORG_OWNER') }))[0]!
    await expect(repository.reviewDiseaseAnalysisSession(
      {
        actor: { ...actor, userId: 'user_demo_agronomist_05' },
        farm: farm('AGRONOMIST', 'farm_demo_south_02'),
      },
      north.analysisSessionId,
      'analysis_cross_farm_01',
      { disposition: 'REJECTED', reviewedFindingLabel: '', note: 'ทดสอบปฏิเสธข้ามสวน' },
    )).rejects.toThrow(/สวนปัจจุบัน/u)
  })

  it('resets generated sessions and idempotency state to the deterministic mock pack', async () => {
    const repository = createMockPhase2Adapters().diseaseAnalysisRepository
    const context = { actor, farm: farm('ORG_OWNER') }
    const initialSessions = await repository.listDiseaseAnalysisSessions(context)
    await repository.createDiseaseAnalysisSession(
      context,
      'analysis_reset_000001',
      northDraft,
    )

    expect(await repository.listDiseaseAnalysisSessions(context)).toHaveLength(
      initialSessions.length + 1,
    )
    if (typeof repository.resetMockPack !== 'function') {
      throw new Error('Mock Disease Analysis repository must support deterministic reset')
    }
    await repository.resetMockPack()
    const resetSessions = await repository.listDiseaseAnalysisSessions(context)

    expect(resetSessions).toEqual(initialSessions)
  })
})
