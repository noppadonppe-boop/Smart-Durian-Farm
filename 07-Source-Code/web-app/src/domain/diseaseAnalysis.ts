import type { CanonicalRole } from './farm'
import type { WorkMutationContext } from './workCareDisease'

export const diseaseAnalysisEvidenceScenarios = [
  'CLEAR_SYMPTOM_PATTERN',
  'LOW_QUALITY_PLACEHOLDER',
  'CONFLICTING_OBSERVATIONS',
] as const

export const diseaseAnalysisReviewDispositions = [
  'ACCEPTED',
  'CORRECTED',
  'REJECTED',
] as const

export const diseaseAnalysisStatuses = [
  'HUMAN_REVIEW_REQUIRED',
  'REVIEWED',
] as const

export const diseaseAnalysisAbstainReasons = [
  'LOW_EVIDENCE_QUALITY',
  'CONFLICTING_OBSERVATIONS',
] as const

export type DiseaseAnalysisEvidenceScenario = (typeof diseaseAnalysisEvidenceScenarios)[number]
export type DiseaseAnalysisReviewDisposition = (typeof diseaseAnalysisReviewDispositions)[number]
export type DiseaseAnalysisStatus = (typeof diseaseAnalysisStatuses)[number]
export type DiseaseAnalysisAbstainReason = (typeof diseaseAnalysisAbstainReasons)[number]

export const diseaseAnalysisScenarioLabels: Record<DiseaseAnalysisEvidenceScenario, string> = {
  CLEAR_SYMPTOM_PATTERN: 'กลุ่มอาการชัดเจน',
  LOW_QUALITY_PLACEHOLDER: 'หลักฐานคุณภาพต่ำ',
  CONFLICTING_OBSERVATIONS: 'ข้อสังเกตขัดแย้งกัน',
}

export const diseaseAnalysisDispositionLabels: Record<DiseaseAnalysisReviewDisposition, string> = {
  ACCEPTED: 'รับผลเบื้องต้น',
  CORRECTED: 'แก้ผลเบื้องต้น',
  REJECTED: 'ปฏิเสธผลเบื้องต้น',
}

export const diseaseAnalysisAbstainLabels: Record<DiseaseAnalysisAbstainReason, string> = {
  LOW_EVIDENCE_QUALITY: 'หลักฐานไม่เพียงพอ',
  CONFLICTING_OBSERVATIONS: 'ข้อมูลอาการขัดแย้งกัน',
}

export interface DiseaseAnalysisDraft {
  incidentId: string
  positionId: string
  plantingCycleId: string
  evidenceScenario: DiseaseAnalysisEvidenceScenario
  observedSymptom: string
}

export interface DiseaseCandidateFinding {
  findingCode: 'MOCK_SYMPTOM_PATTERN_A' | 'SYMPTOM_PATTERN_A'
  label: string
  confidencePercent: number
  uncertaintyNote: string
}

export interface DiseaseAnalysisReviewInput {
  disposition: DiseaseAnalysisReviewDisposition
  reviewedFindingLabel: string
  note: string
}

export type DiseaseAnalysisAuditEventType =
  | 'MOCK_ANALYSIS_COMPLETED'
  | 'MOCK_ANALYSIS_ABSTAINED'
  | 'ANALYSIS_COMPLETED'
  | 'ANALYSIS_ABSTAINED'
  | 'HUMAN_REVIEW_ACCEPTED'
  | 'HUMAN_REVIEW_CORRECTED'
  | 'HUMAN_REVIEW_REJECTED'

export interface DiseaseAnalysisAuditEvent {
  eventId: string
  eventType: DiseaseAnalysisAuditEventType
  actorUserId: string
  actorDisplayName: string
  description: string
  createdAtLabel: string
  sessionVersion: number
}

export interface DiseaseAnalysisSessionRecord extends DiseaseAnalysisDraft {
  organizationId: string
  farmId: string
  analysisSessionId: string
  analysisSource: 'MOCK_DETERMINISTIC_V1' | 'DETERMINISTIC_RULES_V1'
  classification: 'SIMULATED/TEST ONLY' | 'OPERATIONAL'
  status: DiseaseAnalysisStatus
  qualityScorePercent: number
  candidateFindings: readonly DiseaseCandidateFinding[]
  abstainReason: DiseaseAnalysisAbstainReason | null
  reviewedBy: string | null
  reviewDisposition: DiseaseAnalysisReviewDisposition | null
  reviewedFindingLabel: string
  reviewNote: string
  diagnosisWritebackStatus: 'NOT_WRITTEN'
  syncState: 'LOCAL_ONLY' | 'FIREBASE_SYNCED'
  version: number
  exampleData: boolean
  createdBy: string
  createdAtLabel: string
  audit: readonly DiseaseAnalysisAuditEvent[]
}

export interface DeterministicDiseaseAnalysisResult {
  qualityScorePercent: number
  candidateFindings: readonly DiseaseCandidateFinding[]
  abstainReason: DiseaseAnalysisAbstainReason | null
}

const analysisReaderRoles: readonly CanonicalRole[] = [
  'ORG_OWNER',
  'FARM_MANAGER',
  'AGRONOMIST',
  'AUDITOR',
]

const analysisRunnerRoles: readonly CanonicalRole[] = [
  'ORG_OWNER',
  'FARM_MANAGER',
  'AGRONOMIST',
]

function requiredText(value: string, label: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`ต้องระบุ${label}`)
  return normalized
}

function requireActiveFarm(context: WorkMutationContext): void {
  if (context.farm.farmStatus !== 'ACTIVE' || context.farm.membershipStatus !== 'ACTIVE') {
    throw new Error('สวนหรือ membership ไม่อยู่ในสถานะที่เขียนข้อมูลได้')
  }
}

export function canReadDiseaseAnalysis(role: CanonicalRole): boolean {
  return analysisReaderRoles.includes(role)
}

export function canRunDiseaseAnalysis(role: CanonicalRole): boolean {
  return analysisRunnerRoles.includes(role)
}

export function canReviewDiseaseAnalysis(role: CanonicalRole): boolean {
  return role === 'AGRONOMIST'
}

export function validateDiseaseAnalysisDraft(
  context: WorkMutationContext,
  draft: DiseaseAnalysisDraft,
): DiseaseAnalysisDraft {
  requireActiveFarm(context)
  if (!canRunDiseaseAnalysis(context.farm.role)) {
    throw new Error('บทบาทนี้ไม่มีสิทธิ์เริ่ม Deterministic Analysis')
  }
  if (!/^disease_[A-Za-z0-9_-]{8,}$/u.test(draft.incidentId)) {
    throw new Error('Disease Incident ID ไม่ถูกต้อง')
  }
  if (!/^pos_[A-Za-z0-9_-]{12,}$/u.test(draft.positionId)) {
    throw new Error('Position ID ไม่ถูกต้อง')
  }
  if (!/^cycle_[A-Za-z0-9_-]{3,}$/u.test(draft.plantingCycleId)) {
    throw new Error('Planting Cycle ID ไม่ถูกต้อง')
  }
  if (!diseaseAnalysisEvidenceScenarios.includes(draft.evidenceScenario)) {
    throw new Error('Deterministic scenario ไม่ถูกต้อง')
  }
  return {
    ...draft,
    observedSymptom: requiredText(draft.observedSymptom, 'อาการที่สังเกต'),
  }
}

export function runDeterministicDiseaseAnalysis(
  draft: DiseaseAnalysisDraft,
): DeterministicDiseaseAnalysisResult {
  if (draft.evidenceScenario === 'LOW_QUALITY_PLACEHOLDER') {
    return {
      qualityScorePercent: 28,
      candidateFindings: [],
      abstainReason: 'LOW_EVIDENCE_QUALITY',
    }
  }
  if (draft.evidenceScenario === 'CONFLICTING_OBSERVATIONS') {
    return {
      qualityScorePercent: 61,
      candidateFindings: [],
      abstainReason: 'CONFLICTING_OBSERVATIONS',
    }
  }
  return {
    qualityScorePercent: 92,
    candidateFindings: [{
      findingCode: 'MOCK_SYMPTOM_PATTERN_A',
      label: 'กลุ่มรูปแบบอาการทางใบ A — ต้องให้ Agronomist ตรวจ',
      confidencePercent: 82,
      uncertaintyNote: 'คะแนนเพื่อช่วยจัดลำดับเท่านั้น ไม่ใช่ความแม่นยำทางวิชาการ',
    }],
    abstainReason: null,
  }
}

export function validateDiseaseAnalysisResult(
  result: DeterministicDiseaseAnalysisResult,
): DeterministicDiseaseAnalysisResult {
  if (!Number.isInteger(result.qualityScorePercent) || result.qualityScorePercent < 0 || result.qualityScorePercent > 100) {
    throw new Error('Quality score ของ Deterministic Analysis ไม่ถูกต้อง')
  }
  if (result.abstainReason) {
    if (result.candidateFindings.length !== 0) {
      throw new Error('ผล Abstain ห้ามมี candidate finding')
    }
  } else if (result.candidateFindings.length !== 1) {
    throw new Error('Deterministic Analysis ต้องมี candidate finding เดียวหรือ Abstain')
  }
  result.candidateFindings.forEach((finding) => {
    if (!Number.isInteger(finding.confidencePercent) || finding.confidencePercent < 0 || finding.confidencePercent > 100) {
      throw new Error('Confidence ไม่ถูกต้อง')
    }
    requiredText(finding.label, 'candidate finding')
    requiredText(finding.uncertaintyNote, 'uncertainty note')
  })
  return structuredClone(result)
}

export function validateDiseaseAnalysisReview(
  context: WorkMutationContext,
  session: DiseaseAnalysisSessionRecord,
  input: DiseaseAnalysisReviewInput,
): DiseaseAnalysisReviewInput {
  requireActiveFarm(context)
  if (!canReviewDiseaseAnalysis(context.farm.role)) {
    throw new Error('เฉพาะ Agronomist เท่านั้นที่บันทึก Human Review ได้')
  }
  if (
    session.organizationId !== context.farm.organizationId ||
    session.farmId !== context.farm.farmId
  ) {
    throw new Error('ปฏิเสธ Human Review ข้ามสวน')
  }
  if (session.status !== 'HUMAN_REVIEW_REQUIRED') {
    throw new Error('Analysis Session นี้ผ่าน Human Review แล้ว')
  }
  if (!diseaseAnalysisReviewDispositions.includes(input.disposition)) {
    throw new Error('Review disposition ไม่ถูกต้อง')
  }

  const note = input.note.trim()
  const reviewedFindingLabel = input.reviewedFindingLabel.trim()
  if (input.disposition === 'ACCEPTED') {
    const candidate = session.candidateFindings[0]
    if (!candidate || session.abstainReason) {
      throw new Error('ผล Abstain ไม่สามารถรับเป็น candidate finding ได้')
    }
    if (reviewedFindingLabel !== candidate.label) {
      throw new Error('ผลที่รับต้องตรงกับ candidate finding เดิม')
    }
  }
  if (input.disposition === 'CORRECTED') {
    requiredText(reviewedFindingLabel, 'ผลที่ Agronomist แก้ไข')
    requiredText(note, 'เหตุผลการแก้ไข')
  }
  if (input.disposition === 'REJECTED') {
    if (reviewedFindingLabel) throw new Error('ผลที่ปฏิเสธต้องไม่บันทึก reviewed finding')
    requiredText(note, 'เหตุผลการปฏิเสธ')
  }
  return { disposition: input.disposition, reviewedFindingLabel, note }
}
