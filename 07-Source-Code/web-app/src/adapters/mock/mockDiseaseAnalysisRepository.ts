import type {
  DiseaseAnalysisRepository,
  TreeRegisterRepository,
  WorkCareDiseaseRepository,
} from '../contracts'
import {
  canReadDiseaseAnalysis,
  diseaseAnalysisAbstainLabels,
  diseaseAnalysisDispositionLabels,
  runDeterministicDiseaseAnalysis,
  validateDiseaseAnalysisDraft,
  validateDiseaseAnalysisResult,
  validateDiseaseAnalysisReview,
  type DiseaseAnalysisAuditEvent,
  type DiseaseAnalysisDraft,
  type DiseaseAnalysisReviewInput,
  type DiseaseAnalysisSessionRecord,
} from '../../domain/diseaseAnalysis'
import type { WorkMutationContext } from '../../domain/workCareDisease'

import diseaseAnalysisPack from '../../demo/disease-analysis-p1-mock-data-pack-v1.0.json'

interface DiseaseAnalysisMockDataPack {
  metadata: {
    packId: string
    version: string
    classification: 'SIMULATED/TEST ONLY'
    deterministic: true
    resettable: true
    fixedClock: string
    realMedia: false
    externalModel: false
    productionUseAllowed: false
  }
  analysisSessions: DiseaseAnalysisSessionRecord[]
}

const mockDataPack = diseaseAnalysisPack as unknown as DiseaseAnalysisMockDataPack

export const diseaseAnalysisMockDataPackMetadata = Object.freeze(structuredClone(mockDataPack.metadata))

function clone<T>(value: T): T {
  return structuredClone(value)
}

function nowLabel(): string {
  return `${mockDataPack.metadata.fixedClock} · SIMULATED/TEST ONLY`
}

export function createDemoDiseaseAnalysisSessions(): DiseaseAnalysisSessionRecord[] {
  return clone(mockDataPack.analysisSessions)
}

export class MockDiseaseAnalysisRepository implements DiseaseAnalysisRepository {
  private readonly operationResults = new Map<string, DiseaseAnalysisSessionRecord>()
  private generatedIdSequence = 0

  constructor(
    private readonly workRepository: WorkCareDiseaseRepository,
    private readonly treeRepository: TreeRegisterRepository,
    private analysisSessions = createDemoDiseaseAnalysisSessions(),
  ) {}

  private nextId(prefix: string): string {
    this.generatedIdSequence += 1
    return `${prefix}_mock_${String(this.generatedIdSequence).padStart(12, '0')}`
  }

  private operationKey(
    context: WorkMutationContext,
    scope: string,
    idempotencyKey: string,
  ): string {
    const key = idempotencyKey.trim()
    if (!/^[A-Za-z0-9_-]{6,120}$/u.test(key)) {
      throw new Error('Idempotency key ต้องเป็น opaque token อย่างน้อย 6 ตัวอักษร')
    }
    return `${context.farm.organizationId}:${context.farm.farmId}:${scope}:${key}`
  }

  private remember(key: string, session: DiseaseAnalysisSessionRecord): DiseaseAnalysisSessionRecord {
    const snapshot = clone(session)
    this.operationResults.set(key, snapshot)
    return clone(snapshot)
  }

  private requireSession(
    context: WorkMutationContext,
    analysisSessionId: string,
  ): DiseaseAnalysisSessionRecord {
    const session = this.analysisSessions.find((candidate) => candidate.analysisSessionId === analysisSessionId)
    if (
      !session ||
      session.organizationId !== context.farm.organizationId ||
      session.farmId !== context.farm.farmId
    ) {
      throw new Error('ไม่พบ Analysis Session ในสวนปัจจุบัน')
    }
    return session
  }

  async listDiseaseAnalysisSessions(
    context: WorkMutationContext,
  ): Promise<readonly DiseaseAnalysisSessionRecord[]> {
    await Promise.resolve()
    if (!canReadDiseaseAnalysis(context.farm.role)) {
      throw new Error('บทบาทนี้ไม่มีสิทธิ์อ่าน Disease Analysis Session')
    }
    return clone(this.analysisSessions.filter((session) =>
      session.organizationId === context.farm.organizationId &&
      session.farmId === context.farm.farmId,
    ))
  }

  async createDiseaseAnalysisSession(
    context: WorkMutationContext,
    idempotencyKey: string,
    draft: DiseaseAnalysisDraft,
  ): Promise<DiseaseAnalysisSessionRecord> {
    const valid = validateDiseaseAnalysisDraft(context, draft)
    const key = this.operationKey(context, 'CREATE_ANALYSIS', idempotencyKey)
    const prior = this.operationResults.get(key)
    if (prior) return clone(prior)

    const incidents = await this.workRepository.listDiseaseIncidents(context)
    const incident = incidents.find((candidate) => candidate.incidentId === valid.incidentId)
    if (!incident) throw new Error('ไม่พบ Disease Incident ในสวนปัจจุบัน')
    if (incident.positionId !== valid.positionId) {
      throw new Error('Wrong-Tree: Position ของ Analysis ไม่ตรง Disease Incident')
    }
    if (incident.observedSymptom.trim() !== valid.observedSymptom) {
      throw new Error('Observed symptom ต้องอ้างค่าจาก Disease Incident เดิม')
    }

    const position = await this.treeRepository.getTreePosition(
      context.farm.organizationId,
      context.farm.farmId,
      valid.positionId,
    )
    if (!position || position.positionStatus !== 'ACTIVE') {
      throw new Error('ไม่พบตำแหน่งปลูก Active ในสวนปัจจุบัน')
    }
    if (position.currentCycle.cycleId !== valid.plantingCycleId) {
      throw new Error('Wrong-Tree: Planting Cycle ไม่ตรงต้นปัจจุบัน')
    }

    const result = validateDiseaseAnalysisResult(runDeterministicDiseaseAnalysis(valid))
    const analysisSessionId = this.nextId('analysis')
    const event: DiseaseAnalysisAuditEvent = {
      eventId: this.nextId('analysisevt'),
      eventType: result.abstainReason ? 'MOCK_ANALYSIS_ABSTAINED' : 'MOCK_ANALYSIS_COMPLETED',
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      description: result.abstainReason
        ? `Abstain: ${diseaseAnalysisAbstainLabels[result.abstainReason]} · ไม่มี candidate finding`
        : `สร้าง candidate finding แบบ deterministic · ไม่มี diagnosis writeback`,
      createdAtLabel: nowLabel(),
      sessionVersion: 1,
    }
    const session: DiseaseAnalysisSessionRecord = {
      ...valid,
      ...result,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      analysisSessionId,
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
      createdBy: context.actor.userId,
      createdAtLabel: nowLabel(),
      audit: [event],
    }
    this.analysisSessions.unshift(session)
    return this.remember(key, session)
  }

  async reviewDiseaseAnalysisSession(
    context: WorkMutationContext,
    analysisSessionId: string,
    idempotencyKey: string,
    input: DiseaseAnalysisReviewInput,
  ): Promise<DiseaseAnalysisSessionRecord> {
    await Promise.resolve()
    const key = this.operationKey(context, `REVIEW_ANALYSIS:${analysisSessionId}`, idempotencyKey)
    const prior = this.operationResults.get(key)
    if (prior) return clone(prior)
    const session = this.requireSession(context, analysisSessionId)
    const valid = validateDiseaseAnalysisReview(context, session, input)
    session.status = 'REVIEWED'
    session.reviewedBy = context.actor.userId
    session.reviewDisposition = valid.disposition
    session.reviewedFindingLabel = valid.reviewedFindingLabel
    session.reviewNote = valid.note
    session.version += 1
    const eventType = {
      ACCEPTED: 'HUMAN_REVIEW_ACCEPTED',
      CORRECTED: 'HUMAN_REVIEW_CORRECTED',
      REJECTED: 'HUMAN_REVIEW_REJECTED',
    } as const
    session.audit = [{
      eventId: this.nextId('analysisevt'),
      eventType: eventType[valid.disposition],
      actorUserId: context.actor.userId,
      actorDisplayName: context.actor.displayName,
      description: `${diseaseAnalysisDispositionLabels[valid.disposition]} · diagnosisWriteback=NOT_WRITTEN${valid.note ? ` · ${valid.note}` : ''}`,
      createdAtLabel: nowLabel(),
      sessionVersion: session.version,
    }, ...session.audit]
    return this.remember(key, session)
  }

  resetMockPack(): Promise<void> {
    this.analysisSessions = createDemoDiseaseAnalysisSessions()
    this.operationResults.clear()
    this.generatedIdSequence = 0
    return Promise.resolve()
  }
}
