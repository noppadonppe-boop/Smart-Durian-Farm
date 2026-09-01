import type { AuthenticatedIdentity, FarmAccess } from './farm'
import {
  runDeterministicDiseaseAnalysis,
  validateDiseaseAnalysisDraft,
  validateDiseaseAnalysisResult,
  validateDiseaseAnalysisReview,
  type DiseaseAnalysisSessionRecord,
} from './diseaseAnalysis'

const actor: AuthenticatedIdentity = {
  userId: 'user_demo_agronomist_05',
  displayName: 'นักวิชาการเกษตรจำลอง',
  maskedPhone: '+165••••105',
  source: 'mock',
}

const farm: FarmAccess = {
  organizationId: 'org_demo_kdoms_01',
  organizationName: 'องค์กรจำลอง',
  organizationCode: 'DEMO',
  farmId: 'farm_demo_north_01',
  farmCode: 'DEMO-F01',
  farmSequence: 'F01',
  farmName: 'สวนจำลอง',
  farmStatus: 'ACTIVE',
  membershipStatus: 'ACTIVE',
  role: 'AGRONOMIST',
  isOrganizationOwner: false,
  isMock: true,
}

const draft = {
  incidentId: 'disease_demo_000001',
  positionId: 'pos_demo_a02c914ed730',
  plantingCycleId: 'cycle_002',
  evidenceScenario: 'CLEAR_SYMPTOM_PATTERN' as const,
  observedSymptom: 'SIMULATED/TEST ONLY — พบอาการทางใบจำลอง',
}

function session(): DiseaseAnalysisSessionRecord {
  const result = runDeterministicDiseaseAnalysis(draft)
  return {
    ...draft,
    ...result,
    organizationId: farm.organizationId,
    farmId: farm.farmId,
    analysisSessionId: 'analysis_demo_000001',
    analysisSource: 'MOCK_DETERMINISTIC_V1',
    classification: 'SIMULATED/TEST ONLY',
    status: 'HUMAN_REVIEW_REQUIRED',
    reviewedBy: null,
    reviewDisposition: null,
    reviewedFindingLabel: '',
    reviewNote: '',
    diagnosisWritebackStatus: 'NOT_WRITTEN',
    syncState: 'LOCAL_ONLY',
    version: 1,
    exampleData: true,
    createdBy: actor.userId,
    createdAtLabel: '2026-09-01T00:00:00+07:00 · SIMULATED/TEST ONLY',
    audit: [],
  }
}

describe('deterministic Disease Analysis domain', () => {
  it('returns the same neutral candidate and confidence for the same scenario', () => {
    const validated = validateDiseaseAnalysisDraft({ actor, farm }, draft)
    const first = validateDiseaseAnalysisResult(runDeterministicDiseaseAnalysis(validated))
    const second = validateDiseaseAnalysisResult(runDeterministicDiseaseAnalysis(validated))

    expect(second).toEqual(first)
    expect(first.candidateFindings).toHaveLength(1)
    expect(first.candidateFindings[0]).toMatchObject({
      findingCode: 'MOCK_SYMPTOM_PATTERN_A',
      confidencePercent: 82,
    })
    expect(first.candidateFindings[0]?.label).not.toMatch(/โรค|สารเคมี|ยา/u)
  })

  it.each([
    ['LOW_QUALITY_PLACEHOLDER', 'LOW_EVIDENCE_QUALITY'],
    ['CONFLICTING_OBSERVATIONS', 'CONFLICTING_OBSERVATIONS'],
  ] as const)('abstains for %s without forcing a candidate', (evidenceScenario, reason) => {
    const result = validateDiseaseAnalysisResult(runDeterministicDiseaseAnalysis({
      ...draft,
      evidenceScenario,
    }))
    expect(result.candidateFindings).toEqual([])
    expect(result.abstainReason).toBe(reason)
  })

  it('requires Agronomist review and never writes a confirmed diagnosis', () => {
    const current = session()
    const candidate = current.candidateFindings[0]!
    const review = validateDiseaseAnalysisReview({ actor, farm }, current, {
      disposition: 'ACCEPTED',
      reviewedFindingLabel: candidate.label,
      note: 'ตรวจทานข้อมูลจำลองแล้ว',
    })
    expect(review.disposition).toBe('ACCEPTED')
    expect(current.diagnosisWritebackStatus).toBe('NOT_WRITTEN')

    expect(() => validateDiseaseAnalysisReview({
      actor: { ...actor, userId: 'user_demo_manager_01' },
      farm: { ...farm, role: 'FARM_MANAGER' },
    }, current, review)).toThrow(/Agronomist/u)
  })

  it('rejects accepting an Abstain result and requires reasons for correction/rejection', () => {
    const abstained: DiseaseAnalysisSessionRecord = {
      ...session(),
      evidenceScenario: 'LOW_QUALITY_PLACEHOLDER',
      ...runDeterministicDiseaseAnalysis({ ...draft, evidenceScenario: 'LOW_QUALITY_PLACEHOLDER' }),
    }
    expect(() => validateDiseaseAnalysisReview({ actor, farm }, abstained, {
      disposition: 'ACCEPTED', reviewedFindingLabel: 'ผลใด ๆ', note: '',
    })).toThrow(/Abstain/u)
    expect(() => validateDiseaseAnalysisReview({ actor, farm }, session(), {
      disposition: 'CORRECTED', reviewedFindingLabel: 'กลุ่มอาการที่แก้', note: '',
    })).toThrow(/เหตุผล/u)
  })
})
