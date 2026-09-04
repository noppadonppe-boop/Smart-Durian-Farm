import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'

import type {
  DiseaseAnalysisRepository,
  TreeRegisterRepository,
  WorkCareDiseaseRepository,
} from '../../adapters/contracts'
import {
  diseaseAnalysisAbstainReasons,
  diseaseAnalysisEvidenceScenarios,
  diseaseAnalysisReviewDispositions,
  diseaseAnalysisStatuses,
  runDeterministicDiseaseAnalysis,
  validateDiseaseAnalysisDraft,
  validateDiseaseAnalysisResult,
  validateDiseaseAnalysisReview,
  type DiseaseAnalysisAuditEvent,
  type DiseaseAnalysisAuditEventType,
  type DiseaseAnalysisDraft,
  type DiseaseAnalysisReviewDisposition,
  type DiseaseAnalysisReviewInput,
  type DiseaseAnalysisSessionRecord,
  type DiseaseCandidateFinding,
} from '../../domain/diseaseAnalysis'
import { createOpaqueRecordId, type WorkMutationContext } from '../../domain/workCareDisease'
import { rootCollection, rootDoc } from './firebaseDataRoot'

const analysisEventTypes = [
  'MOCK_ANALYSIS_COMPLETED',
  'MOCK_ANALYSIS_ABSTAINED',
  'ANALYSIS_COMPLETED',
  'ANALYSIS_ABSTAINED',
  'HUMAN_REVIEW_ACCEPTED',
  'HUMAN_REVIEW_CORRECTED',
  'HUMAN_REVIEW_REJECTED',
] as const

function requiredString(data: DocumentData, field: string): string {
  const value: unknown = data[field]
  if (typeof value !== 'string') throw new Error(`Invalid Disease Analysis field: ${field}`)
  return value
}

function requiredNumber(data: DocumentData, field: string): number {
  const value: unknown = data[field]
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`Invalid Disease Analysis number: ${field}`)
  }
  return value
}

function requiredLiteral<const T extends readonly string[]>(
  data: DocumentData,
  field: string,
  allowed: T,
): T[number] {
  const value: unknown = data[field]
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new Error(`Invalid Disease Analysis enum: ${field}`)
  }
  return value
}

function nullableLiteral<const T extends readonly string[]>(
  data: DocumentData,
  field: string,
  allowed: T,
): T[number] | null {
  const value: unknown = data[field]
  if (value === null || value === undefined) return null
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new Error(`Invalid Disease Analysis optional enum: ${field}`)
  }
  return value
}

function nullableString(data: DocumentData, field: string): string | null {
  const value: unknown = data[field]
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new Error(`Invalid Disease Analysis string: ${field}`)
  return value
}

function timestampLabel(value: unknown, exampleData: boolean): string {
  const suffix = exampleData ? ' · SIMULATED/TEST ONLY' : ''
  if (!(value instanceof Timestamp)) return `รอเวลา ${exampleData ? 'ข้อมูลจำลอง' : 'Firebase'}${suffix}`
  return `${new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value.toDate())}${suffix}`
}

function parseCandidateFindings(data: DocumentData): DiseaseCandidateFinding[] {
  const value: unknown = data.candidateFindings
  if (!Array.isArray(value)) throw new Error('Invalid candidate findings')
  return value.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid candidate finding')
    const finding = item as Record<string, unknown>
    if (
      finding.findingCode !== 'MOCK_SYMPTOM_PATTERN_A' && finding.findingCode !== 'SYMPTOM_PATTERN_A' ||
      typeof finding.label !== 'string' ||
      typeof finding.confidencePercent !== 'number' ||
      !Number.isInteger(finding.confidencePercent) ||
      typeof finding.uncertaintyNote !== 'string'
    ) {
      throw new Error('Invalid deterministic candidate finding')
    }
    return {
      findingCode: finding.findingCode,
      label: finding.label,
      confidencePercent: finding.confidencePercent,
      uncertaintyNote: finding.uncertaintyNote,
    }
  })
}

function parseSession(data: DocumentData): DiseaseAnalysisSessionRecord {
  if (data.recordType !== 'DISEASE_ANALYSIS_SESSION' || typeof data.exampleData !== 'boolean') {
    throw new Error('Invalid Disease Analysis Session record')
  }
  return {
    organizationId: requiredString(data, 'organizationId'),
    farmId: requiredString(data, 'farmId'),
    analysisSessionId: requiredString(data, 'analysisSessionId'),
    incidentId: requiredString(data, 'incidentId'),
    positionId: requiredString(data, 'positionId'),
    plantingCycleId: requiredString(data, 'plantingCycleId'),
    evidenceScenario: requiredLiteral(data, 'evidenceScenario', diseaseAnalysisEvidenceScenarios),
    observedSymptom: requiredString(data, 'observedSymptom'),
    analysisSource: requiredLiteral(data, 'analysisSource', ['MOCK_DETERMINISTIC_V1', 'DETERMINISTIC_RULES_V1'] as const),
    classification: requiredLiteral(data, 'classification', ['SIMULATED/TEST ONLY', 'OPERATIONAL'] as const),
    status: requiredLiteral(data, 'status', diseaseAnalysisStatuses),
    qualityScorePercent: requiredNumber(data, 'qualityScorePercent'),
    candidateFindings: parseCandidateFindings(data),
    abstainReason: nullableLiteral(data, 'abstainReason', diseaseAnalysisAbstainReasons),
    reviewedBy: nullableString(data, 'reviewedBy'),
    reviewDisposition: nullableLiteral(data, 'reviewDisposition', diseaseAnalysisReviewDispositions),
    reviewedFindingLabel: requiredString(data, 'reviewedFindingLabel'),
    reviewNote: requiredString(data, 'reviewNote'),
    diagnosisWritebackStatus: 'NOT_WRITTEN',
    syncState: requiredLiteral(data, 'syncState', ['LOCAL_ONLY', 'EMULATOR_SYNCED', 'FIREBASE_SYNCED'] as const),
    version: requiredNumber(data, 'version'),
    exampleData: data.exampleData,
    createdBy: requiredString(data, 'createdBy'),
    createdAtLabel: timestampLabel(data.createdAt, data.exampleData),
    audit: [],
  }
}

function parseEvent(data: DocumentData): DiseaseAnalysisAuditEvent {
  return {
    eventId: requiredString(data, 'eventId'),
    eventType: requiredLiteral(data, 'eventType', analysisEventTypes),
    actorUserId: requiredString(data, 'actorUserId'),
    actorDisplayName: requiredString(data, 'actorDisplayName'),
    description: requiredString(data, 'description'),
    createdAtLabel: timestampLabel(data.createdAt, data.exampleData === true),
    sessionVersion: requiredNumber(data, 'sessionVersion'),
  }
}

function sessionReference(
  firestore: Firestore,
  context: WorkMutationContext,
  analysisSessionId: string,
) {
  return rootDoc(
    firestore,
    'organizations',
    context.farm.organizationId,
    'farms',
    context.farm.farmId,
    'diseaseAnalysisSessions',
    analysisSessionId,
  )
}

function operationReference(
  firestore: Firestore,
  context: WorkMutationContext,
  operationId: string,
) {
  return rootDoc(
    firestore,
    'organizations',
    context.farm.organizationId,
    'farms',
    context.farm.farmId,
    'diseaseAnalysisOperations',
    operationId,
  )
}

function normalizedOperationId(scope: string, idempotencyKey: string): string {
  const key = idempotencyKey.trim()
  if (!/^[A-Za-z0-9_-]{6,120}$/u.test(key)) {
    throw new Error('Idempotency key ต้องเป็น opaque token อย่างน้อย 6 ตัวอักษร')
  }
  return `${scope}_${key}`.replaceAll(':', '_').slice(0, 220)
}

function operationData(
  context: WorkMutationContext,
  operationId: string,
  scope: 'CREATE_ANALYSIS' | 'REVIEW_ANALYSIS',
  targetId: string,
  exampleData: boolean,
) {
  return {
    recordType: 'DISEASE_ANALYSIS_OPERATION',
    operationId,
    organizationId: context.farm.organizationId,
    farmId: context.farm.farmId,
    scope,
    targetId,
    actorUserId: context.actor.userId,
    exampleData,
    createdAt: serverTimestamp(),
  }
}

function eventData(
  context: WorkMutationContext,
  analysisSessionId: string,
  eventId: string,
  eventType: DiseaseAnalysisAuditEventType,
  description: string,
  sessionVersion: number,
  exampleData: boolean,
) {
  return {
    recordType: 'DISEASE_ANALYSIS_EVENT',
    eventId,
    eventType,
    organizationId: context.farm.organizationId,
    farmId: context.farm.farmId,
    analysisSessionId,
    actorUserId: context.actor.userId,
    actorDisplayName: context.actor.displayName,
    description,
    sessionVersion,
    exampleData,
    createdAt: serverTimestamp(),
  }
}

export class FirebaseDiseaseAnalysisRepository implements DiseaseAnalysisRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly workRepository: WorkCareDiseaseRepository,
    private readonly treeRepository: TreeRegisterRepository,
    private readonly exampleData = true,
  ) {}

  private async priorTargetId(
    context: WorkMutationContext,
    operationId: string,
  ): Promise<string | undefined> {
    const snapshot = await getDoc(operationReference(this.firestore, context, operationId))
    return snapshot.exists() ? requiredString(snapshot.data(), 'targetId') : undefined
  }

  private async getSession(
    context: WorkMutationContext,
    analysisSessionId: string,
  ): Promise<DiseaseAnalysisSessionRecord | undefined> {
    const reference = sessionReference(this.firestore, context, analysisSessionId)
    const snapshot = await getDoc(reference)
    if (!snapshot.exists()) return undefined
    const events = await getDocs(query(collection(reference, 'events'), orderBy('createdAt', 'desc')))
    return {
      ...parseSession(snapshot.data()),
      audit: events.docs.map((item) => parseEvent(item.data())),
    }
  }

  async listDiseaseAnalysisSessions(
    context: WorkMutationContext,
  ): Promise<readonly DiseaseAnalysisSessionRecord[]> {
    const snapshot = await getDocs(query(rootCollection(
      this.firestore,
      'organizations',
      context.farm.organizationId,
      'farms',
      context.farm.farmId,
      'diseaseAnalysisSessions',
    ), orderBy('createdAt', 'desc')))
    return Promise.all(snapshot.docs.map(async (item) => {
      const events = await getDocs(query(collection(item.ref, 'events'), orderBy('createdAt', 'desc')))
      return { ...parseSession(item.data()), audit: events.docs.map((event) => parseEvent(event.data())) }
    }))
  }

  async createDiseaseAnalysisSession(
    context: WorkMutationContext,
    idempotencyKey: string,
    draft: DiseaseAnalysisDraft,
  ): Promise<DiseaseAnalysisSessionRecord> {
    const valid = validateDiseaseAnalysisDraft(context, draft)
    const operationId = normalizedOperationId('create_analysis', idempotencyKey)
    const priorId = await this.priorTargetId(context, operationId)
    if (priorId) {
      const prior = await this.getSession(context, priorId)
      if (prior) return prior
    }

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
    const analysisSessionId = createOpaqueRecordId('analysis')
    const eventId = createOpaqueRecordId('analysisevt')
    const reference = sessionReference(this.firestore, context, analysisSessionId)
    const eventType: DiseaseAnalysisAuditEventType = result.abstainReason
      ? this.exampleData ? 'MOCK_ANALYSIS_ABSTAINED' : 'ANALYSIS_ABSTAINED'
      : this.exampleData ? 'MOCK_ANALYSIS_COMPLETED' : 'ANALYSIS_COMPLETED'
    const description = result.abstainReason
      ? `Abstain: ${result.abstainReason} · ไม่มี candidate finding`
      : 'สร้าง candidate finding แบบ deterministic · ไม่มี diagnosis writeback'
    const batch = writeBatch(this.firestore)
    batch.set(reference, {
      recordType: 'DISEASE_ANALYSIS_SESSION',
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      analysisSessionId,
      ...valid,
      analysisSource: this.exampleData ? 'MOCK_DETERMINISTIC_V1' : 'DETERMINISTIC_RULES_V1',
      classification: this.exampleData ? 'SIMULATED/TEST ONLY' : 'OPERATIONAL',
      status: 'HUMAN_REVIEW_REQUIRED',
      qualityScorePercent: result.qualityScorePercent,
      candidateFindings: structuredClone(result.candidateFindings.map((finding) => this.exampleData
        ? finding
        : { ...finding, findingCode: 'SYMPTOM_PATTERN_A' as const })),
      abstainReason: result.abstainReason,
      reviewedBy: null,
      reviewDisposition: null,
      reviewedFindingLabel: '',
      reviewNote: '',
      diagnosisWritebackStatus: 'NOT_WRITTEN',
      version: 1,
      lastEventId: eventId,
      createdBy: context.actor.userId,
      updatedBy: context.actor.userId,
      syncState: this.exampleData ? 'EMULATOR_SYNCED' : 'FIREBASE_SYNCED',
      exampleData: this.exampleData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(reference, 'events', eventId), eventData(
      context,
      analysisSessionId,
      eventId,
      eventType,
      description,
      1,
      this.exampleData,
    ))
    batch.set(operationReference(this.firestore, context, operationId), operationData(
      context,
      operationId,
      'CREATE_ANALYSIS',
      analysisSessionId,
      this.exampleData,
    ))
    await batch.commit()
    return (await this.getSession(context, analysisSessionId))!
  }

  async reviewDiseaseAnalysisSession(
    context: WorkMutationContext,
    analysisSessionId: string,
    idempotencyKey: string,
    input: DiseaseAnalysisReviewInput,
  ): Promise<DiseaseAnalysisSessionRecord> {
    const operationId = normalizedOperationId('review_analysis', idempotencyKey)
    const priorId = await this.priorTargetId(context, operationId)
    if (priorId) {
      const prior = await this.getSession(context, priorId)
      if (prior) return prior
    }
    const current = await this.getSession(context, analysisSessionId)
    if (!current) throw new Error('ไม่พบ Analysis Session ในสวนปัจจุบัน')
    const valid = validateDiseaseAnalysisReview(context, current, input)
    const eventId = createOpaqueRecordId('analysisevt')
    const eventTypes: Record<DiseaseAnalysisReviewDisposition, DiseaseAnalysisAuditEventType> = {
      ACCEPTED: 'HUMAN_REVIEW_ACCEPTED',
      CORRECTED: 'HUMAN_REVIEW_CORRECTED',
      REJECTED: 'HUMAN_REVIEW_REJECTED',
    }
    const reference = sessionReference(this.firestore, context, analysisSessionId)
    await runTransaction(this.firestore, async (transaction) => {
      const [operationSnapshot, sessionSnapshot] = await Promise.all([
        transaction.get(operationReference(this.firestore, context, operationId)),
        transaction.get(reference),
      ])
      if (operationSnapshot.exists()) return
      if (!sessionSnapshot.exists()) throw new Error('ไม่พบ Analysis Session ในสวนปัจจุบัน')
      const live = parseSession(sessionSnapshot.data())
      validateDiseaseAnalysisReview(context, live, valid)
      const version = live.version + 1
      transaction.update(reference, {
        status: 'REVIEWED',
        reviewedBy: context.actor.userId,
        reviewDisposition: valid.disposition,
        reviewedFindingLabel: valid.reviewedFindingLabel,
        reviewNote: valid.note,
        version,
        lastEventId: eventId,
        updatedBy: context.actor.userId,
        updatedAt: serverTimestamp(),
      })
      transaction.set(doc(reference, 'events', eventId), eventData(
        context,
        analysisSessionId,
        eventId,
        eventTypes[valid.disposition],
        `${valid.disposition} · diagnosisWriteback=NOT_WRITTEN${valid.note ? ` · ${valid.note}` : ''}`,
        version,
        this.exampleData,
      ))
      transaction.set(operationReference(this.firestore, context, operationId), operationData(
        context,
        operationId,
        'REVIEW_ANALYSIS',
        analysisSessionId,
        this.exampleData,
      ))
    })
    return (await this.getSession(context, analysisSessionId))!
  }
}
