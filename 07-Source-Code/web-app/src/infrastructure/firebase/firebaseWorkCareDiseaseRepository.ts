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
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type QueryConstraint,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes, type FirebaseStorage } from 'firebase/storage'

import type { WorkCareDiseaseRepository } from '../../adapters/contracts'
import {
  assertWorkAction,
  careEventTypes,
  canCreateWork,
  canAddDiseasePhoto,
  createOpaqueRecordId,
  diseasePhotoMimeTypes,
  diseasePhotoPlaceholderKinds,
  diseasePhotoUploadStates,
  diseaseSeverities,
  diseaseStatuses,
  specialistApprovalForCare,
  nextDiseasePhotoState,
  validateDiseaseAssessment,
  validateDiseaseDraft,
  validateDiseaseFollowUp,
  validateDiseasePhotoMockDraft,
  validatePreparedWorkPhotoUpload,
  validateWorkDraft,
  validateWorkInstructionPhotos,
  validateWorkReport,
  validateTreatmentWorkOrderInput,
  workCategories,
  workOrderStatuses,
  workPriorities,
  workTargetKinds,
  type CareEventRecord,
  type DiseaseAssessmentInput,
  type DiseaseAuditEvent,
  type DiseaseFollowUpInput,
  type DiseaseIncidentDraft,
  type DiseaseIncidentRecord,
  type DiseasePhotoAction,
  type DiseasePhotoMockDraft,
  type DiseasePhotoMockEvidence,
  type InAppNotification,
  type TreatmentWorkOrderInput,
  type TreatmentWorkOrderResult,
  type WorkAction,
  type WorkAuditEvent,
  type WorkAuditEventType,
  type WorkMutationContext,
  type WorkOrderDraft,
  type WorkOrderRecord,
  type PreparedWorkPhotoUpload,
  type WorkPhotoEvidence,
  type WorkReport,
  type WorkReportInput,
  type WorkTarget,
} from '../../domain/workCareDisease'

const specialistApprovalStatuses = [
  'NOT_REQUIRED',
  'PENDING_SPECIALIST',
  'APPROVED',
] as const

const workAuditEventTypes = [
  'WORK_CREATED',
  'WORK_INSTRUCTION_PHOTOS_SAVED',
  'WORK_ASSIGNED',
  'WORK_ACCEPTED',
  'WORK_STARTED',
  'WORK_PAUSED',
  'WORK_RESUMED',
  'WORK_TARGET_CONFIRMED',
  'WORK_REPORT_SAVED',
  'WORK_SUBMITTED',
  'WORK_VERIFIED',
  'WORK_REJECTED',
  'WORK_REWORK_REQUESTED',
  'WORK_CLOSED',
] as const

const workPhotoPhases = ['INSTRUCTION', 'BEFORE', 'AFTER'] as const
const photoUploadStates = ['UPLOADED', 'PENDING', 'FAILED'] as const

function timestampLabel(value: unknown): string {
  if (!(value instanceof Timestamp)) return 'รอเวลา Emulator'
  return new Intl.DateTimeFormat('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(value.toDate())
}

function requiredString(data: DocumentData, field: string): string {
  const value: unknown = data[field]
  if (typeof value !== 'string') throw new Error(`Invalid Phase 4 field: ${field}`)
  return value
}

function requiredNumber(data: DocumentData, field: string): number {
  const value: unknown = data[field]
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new Error(`Invalid Phase 4 number: ${field}`)
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
    throw new Error(`Invalid Phase 4 enum: ${field}`)
  }
  return value
}

function nullableString(data: DocumentData, field: string): string | null {
  const value: unknown = data[field]
  if (value === null || value === undefined) return null
  if (typeof value !== 'string') throw new Error(`Invalid Phase 4 string: ${field}`)
  return value
}

function requiredStringList(data: DocumentData, field: string): string[] {
  const value: unknown = data[field]
  if (!Array.isArray(value) || !value.every((item) => typeof item === 'string')) {
    throw new Error(`Invalid Phase 4 string list: ${field}`)
  }
  return [...value]
}

function requiredWorkTarget(data: DocumentData): WorkTarget {
  const value: unknown = data.target
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid Phase 4 Work target')
  }
  const target = value as Record<string, unknown>
  return {
    kind: requiredLiteral(target, 'kind', workTargetKinds),
    zoneCode: requiredString(target, 'zoneCode'),
    rowCode: nullableString(target, 'rowCode'),
    positionIds: requiredStringList(target, 'positionIds'),
  }
}

function optionalWorkReport(data: DocumentData): WorkReport | null {
  const value: unknown = data.report
  if (value === null || value === undefined) return null
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid Phase 4 Work report')
  }
  return structuredClone(value) as WorkReport
}

function optionalWorkPhotos(data: DocumentData, field: string): WorkPhotoEvidence[] {
  const value: unknown = data[field]
  if (value === null || value === undefined) return []
  if (!Array.isArray(value)) throw new Error(`Invalid Phase 4 photo list: ${field}`)
  return value.map((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      throw new Error(`Invalid Phase 4 photo: ${field}`)
    }
    const photo = item as Record<string, unknown>
    return {
      photoId: requiredString(photo, 'photoId'),
      phase: requiredLiteral(photo, 'phase', workPhotoPhases),
      uploadState: requiredLiteral(photo, 'uploadState', photoUploadStates),
      storagePath: requiredString(photo, 'storagePath'),
      note: requiredString(photo, 'note'),
    }
  })
}

function parseDiseasePhoto(photo: DocumentData): DiseasePhotoMockEvidence {
  if (photo.containsExifOrGps !== false || photo.externalStorage !== false) {
    throw new Error('Disease photo mock privacy boundary ไม่ถูกต้อง')
  }
  return {
    photoId: requiredString(photo, 'photoId'),
    organizationId: requiredString(photo, 'organizationId'),
    farmId: requiredString(photo, 'farmId'),
    incidentId: requiredString(photo, 'incidentId'),
    positionId: requiredString(photo, 'positionId'),
    placeholderKind: requiredLiteral(photo, 'placeholderKind', diseasePhotoPlaceholderKinds),
    mimeType: requiredLiteral(photo, 'mimeType', diseasePhotoMimeTypes),
    sizeBytes: requiredNumber(photo, 'sizeBytes'),
    note: requiredString(photo, 'note'),
    source: requiredLiteral(photo, 'source', ['SYNTHETIC_PLACEHOLDER'] as const),
    classification: requiredLiteral(photo, 'classification', ['SIMULATED/TEST ONLY'] as const),
    uploadState: requiredLiteral(photo, 'uploadState', diseasePhotoUploadStates),
    retryCount: requiredNumber(photo, 'retryCount'),
    lastError: requiredString(photo, 'lastError'),
    containsExifOrGps: false,
    externalStorage: false,
    lifecycleMode: requiredLiteral(photo, 'lifecycleMode', ['DRY_RUN'] as const),
    version: requiredNumber(photo, 'version'),
    createdBy: requiredString(photo, 'createdBy'),
    createdAtLabel: requiredString(photo, 'createdAtLabel'),
  }
}

function workReference(firestore: Firestore, context: WorkMutationContext, workOrderId: string) {
  return doc(
    firestore,
    'organizations',
    context.farm.organizationId,
    'farms',
    context.farm.farmId,
    'workOrders',
    workOrderId,
  )
}

function diseaseReference(firestore: Firestore, context: WorkMutationContext, incidentId: string) {
  return doc(
    firestore,
    'organizations',
    context.farm.organizationId,
    'farms',
    context.farm.farmId,
    'diseaseIncidents',
    incidentId,
  )
}

function treatmentLockReference(
  firestore: Firestore,
  context: WorkMutationContext,
  incidentId: string,
) {
  return doc(
    firestore,
    'organizations',
    context.farm.organizationId,
    'farms',
    context.farm.farmId,
    'diseaseTreatmentLocks',
    incidentId,
  )
}

function operationReference(
  firestore: Firestore,
  context: WorkMutationContext,
  operationId: string,
) {
  return doc(
    firestore,
    'organizations',
    context.farm.organizationId,
    'farms',
    context.farm.farmId,
    'workOperations',
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
  scope: string,
  targetId: string,
) {
  return {
    recordType: 'WORK_OPERATION',
    operationId,
    organizationId: context.farm.organizationId,
    farmId: context.farm.farmId,
    scope,
    targetId,
    actorUserId: context.actor.userId,
    exampleData: true,
    createdAt: serverTimestamp(),
  }
}

function reportData(report: WorkReportInput, actorUserId: string, reportId: string, version: number) {
  return {
    ...structuredClone(report),
    reportId,
    submittedBy: actorUserId,
    submittedAtLabel: 'Firebase Emulator',
    version,
  }
}

function workData(
  context: WorkMutationContext,
  workOrderId: string,
  draft: WorkOrderDraft,
  createdBy: string,
  lastEventId: string,
  sourceDiseaseIncidentId: string | null = null,
) {
  return {
    recordType: 'WORK_ORDER',
    organizationId: context.farm.organizationId,
    farmId: context.farm.farmId,
    workOrderId,
    title: draft.title,
    description: draft.description,
    category: draft.category,
    careType: draft.careType,
    priority: draft.priority,
    target: structuredClone(draft.target),
    dueDate: draft.dueDate,
    assignedUserId: draft.assignedUserId,
    status: 'DRAFT',
    isPaused: false,
    instructionPhotos: [],
    report: null,
    targetConfirmedPositionId: null,
    rejectionReason: '',
    reworkReason: '',
    sourceDiseaseIncidentId,
    version: 1,
    lastEventId,
    exampleData: true,
    createdBy,
    createdAt: serverTimestamp(),
    updatedBy: createdBy,
    updatedAt: serverTimestamp(),
  }
}

function parseWork(data: DocumentData): WorkOrderRecord {
  const report = optionalWorkReport(data)
  return {
    organizationId: requiredString(data, 'organizationId'),
    farmId: requiredString(data, 'farmId'),
    workOrderId: requiredString(data, 'workOrderId'),
    title: requiredString(data, 'title'),
    description: requiredString(data, 'description'),
    category: requiredLiteral(data, 'category', workCategories),
    careType: data.careType === null
      ? null
      : requiredLiteral(data, 'careType', careEventTypes),
    priority: requiredLiteral(data, 'priority', workPriorities),
    target: requiredWorkTarget(data),
    dueDate: requiredString(data, 'dueDate'),
    assignedUserId: nullableString(data, 'assignedUserId'),
    status: requiredLiteral(data, 'status', workOrderStatuses),
    isPaused: data.isPaused === true,
    instructionPhotos: optionalWorkPhotos(data, 'instructionPhotos'),
    report: report ? structuredClone(report) : null,
    targetConfirmedPositionId: nullableString(data, 'targetConfirmedPositionId'),
    rejectionReason: requiredString(data, 'rejectionReason'),
    reworkReason: requiredString(data, 'reworkReason'),
    sourceDiseaseIncidentId: nullableString(data, 'sourceDiseaseIncidentId'),
    version: requiredNumber(data, 'version'),
    exampleData: true,
    createdBy: requiredString(data, 'createdBy'),
    createdAtLabel: timestampLabel(data.createdAt),
    audit: [],
  }
}

function parseWorkEvent(data: DocumentData): WorkAuditEvent {
  return {
    eventId: requiredString(data, 'eventId'),
    eventType: requiredLiteral(data, 'eventType', workAuditEventTypes),
    actorUserId: requiredString(data, 'actorUserId'),
    actorDisplayName: requiredString(data, 'actorDisplayName'),
    beforeStatus: requiredLiteral(data, 'beforeStatus', workOrderStatuses),
    afterStatus: requiredLiteral(data, 'afterStatus', workOrderStatuses),
    reason: requiredString(data, 'reason'),
    createdAtLabel: timestampLabel(data.createdAt),
    workVersion: requiredNumber(data, 'workVersion'),
  }
}

function workEventData(
  context: WorkMutationContext,
  workOrderId: string,
  eventId: string,
  eventType: WorkAuditEventType,
  beforeStatus: WorkOrderRecord['status'],
  afterStatus: WorkOrderRecord['status'],
  reason: string,
  version: number,
) {
  return {
    recordType: 'WORK_EVENT',
    organizationId: context.farm.organizationId,
    farmId: context.farm.farmId,
    workOrderId,
    eventId,
    eventType,
    actorUserId: context.actor.userId,
    actorDisplayName: context.actor.displayName,
    beforeStatus,
    afterStatus,
    reason,
    workVersion: version,
    exampleData: true,
    createdAt: serverTimestamp(),
  }
}

function parseCare(data: DocumentData): CareEventRecord {
  const materials: unknown = data.materials
  if (!Array.isArray(materials)) throw new Error('Invalid Phase 4 materials')
  return {
    organizationId: requiredString(data, 'organizationId'),
    farmId: requiredString(data, 'farmId'),
    careEventId: requiredString(data, 'careEventId'),
    workOrderId: requiredString(data, 'workOrderId'),
    careType: requiredLiteral(data, 'careType', careEventTypes),
    positionIds: requiredStringList(data, 'positionIds'),
    materials: structuredClone(materials) as CareEventRecord['materials'],
    notes: requiredString(data, 'notes'),
    approvalStatus: requiredLiteral(data, 'approvalStatus', specialistApprovalStatuses),
    approvedBy: nullableString(data, 'approvedBy'),
    version: requiredNumber(data, 'version'),
    exampleData: true,
    createdAtLabel: timestampLabel(data.createdAt),
  }
}

function parseDisease(data: DocumentData): DiseaseIncidentRecord {
  return {
    organizationId: requiredString(data, 'organizationId'),
    farmId: requiredString(data, 'farmId'),
    incidentId: requiredString(data, 'incidentId'),
    positionId: requiredString(data, 'positionId'),
    observedSymptom: requiredString(data, 'observedSymptom'),
    severity: requiredLiteral(data, 'severity', diseaseSeverities),
    suspectedDiagnosis: requiredString(data, 'suspectedDiagnosis'),
    followUpDate: requiredString(data, 'followUpDate'),
    status: requiredLiteral(data, 'status', diseaseStatuses),
    confirmedDiagnosis: requiredString(data, 'confirmedDiagnosis'),
    treatmentPlan: requiredString(data, 'treatmentPlan'),
    specialistApprovalStatus: requiredLiteral(
      data,
      'specialistApprovalStatus',
      specialistApprovalStatuses,
    ),
    outcome: requiredString(data, 'outcome'),
    photos: [],
    treatmentWorkOrderId: nullableString(data, 'treatmentWorkOrderId'),
    version: requiredNumber(data, 'version'),
    exampleData: true,
    reportedBy: requiredString(data, 'reportedBy'),
    createdAtLabel: timestampLabel(data.createdAt),
    audit: [],
  }
}

function parseDiseaseEvent(data: DocumentData): DiseaseAuditEvent {
  return {
    eventId: requiredString(data, 'eventId'),
    eventType: requiredLiteral(data, 'eventType', [
      'SYMPTOM_OBSERVED',
      'ASSESSMENT_RECORDED',
      'FOLLOW_UP_RECORDED',
      'INCIDENT_CLOSED',
      'PHOTO_PLACEHOLDER_ADDED',
      'PHOTO_UPLOAD_STARTED',
      'PHOTO_UPLOAD_COMPLETED',
      'PHOTO_UPLOAD_FAILED',
      'PHOTO_UPLOAD_RETRIED',
      'TREATMENT_WORK_CREATED',
    ] as const),
    actorUserId: requiredString(data, 'actorUserId'),
    actorDisplayName: requiredString(data, 'actorDisplayName'),
    description: requiredString(data, 'description'),
    createdAtLabel: timestampLabel(data.createdAt),
    incidentVersion: requiredNumber(data, 'incidentVersion'),
  }
}

function diseaseEventData(
  context: WorkMutationContext,
  incidentId: string,
  eventId: string,
  eventType: DiseaseAuditEvent['eventType'],
  description: string,
  version: number,
) {
  return {
    recordType: 'DISEASE_EVENT',
    organizationId: context.farm.organizationId,
    farmId: context.farm.farmId,
    incidentId,
    eventId,
    eventType,
    actorUserId: context.actor.userId,
    actorDisplayName: context.actor.displayName,
    description,
    incidentVersion: version,
    exampleData: true,
    createdAt: serverTimestamp(),
  }
}

async function priorTargetId(
  firestore: Firestore,
  context: WorkMutationContext,
  operationId: string,
): Promise<string | undefined> {
  const snapshot = await getDoc(operationReference(firestore, context, operationId))
  return snapshot.exists() ? requiredString(snapshot.data(), 'targetId') : undefined
}

export class FirebaseWorkCareDiseaseRepository implements WorkCareDiseaseRepository {
  constructor(
    private readonly firestore: Firestore,
    private readonly storage: FirebaseStorage,
  ) {}

  async listWorkOrders(context: WorkMutationContext): Promise<readonly WorkOrderRecord[]> {
    const base = collection(
      this.firestore,
      'organizations',
      context.farm.organizationId,
      'farms',
      context.farm.farmId,
      'workOrders',
    )
    const constraints: QueryConstraint[] = [
      where('organizationId', '==', context.farm.organizationId),
      where('farmId', '==', context.farm.farmId),
      orderBy('dueDate'),
    ]
    if (context.farm.role === 'WORKER') constraints.unshift(where('assignedUserId', '==', context.actor.userId))
    if (context.farm.role === 'AGRONOMIST') constraints.unshift(where('category', 'in', ['CARE', 'DISEASE_FOLLOW_UP']))
    const snapshot = await getDocs(query(base, ...constraints))
    return snapshot.docs.map((item) => parseWork(item.data()))
  }

  async getWorkOrder(
    context: WorkMutationContext,
    workOrderId: string,
  ): Promise<WorkOrderRecord | undefined> {
    const reference = workReference(this.firestore, context, workOrderId)
    const snapshot = await getDoc(reference)
    if (!snapshot.exists()) return undefined
    const order = parseWork(snapshot.data())
    const events = await getDocs(query(collection(reference, 'events'), orderBy('createdAt', 'desc')))
    return { ...order, audit: events.docs.map((item) => parseWorkEvent(item.data())) }
  }

  async createWorkOrder(
    context: WorkMutationContext,
    idempotencyKey: string,
    draft: WorkOrderDraft,
  ): Promise<WorkOrderRecord> {
    if (!canCreateWork(context.farm.role, draft.category)) throw new Error('ไม่มีสิทธิ์สร้างงานประเภทนี้')
    const valid = validateWorkDraft(draft)
    const operationId = normalizedOperationId('create_work', idempotencyKey)
    const priorId = await priorTargetId(this.firestore, context, operationId)
    if (priorId) {
      const prior = await this.getWorkOrder(context, priorId)
      if (prior) return prior
    }
    const workOrderId = createOpaqueRecordId('work')
    const eventId = createOpaqueRecordId('workevt')
    const reference = workReference(this.firestore, context, workOrderId)
    const batch = writeBatch(this.firestore)
    batch.set(reference, workData(context, workOrderId, valid, context.actor.userId, eventId))
    batch.set(doc(reference, 'events', eventId), workEventData(
      context, workOrderId, eventId, 'WORK_CREATED', 'DRAFT', 'DRAFT', 'สร้างงานจำลอง', 1,
    ))
    batch.set(operationReference(this.firestore, context, operationId), operationData(
      context, operationId, 'CREATE_WORK', workOrderId,
    ))
    await batch.commit()
    return (await this.getWorkOrder(context, workOrderId))!
  }

  async performWorkAction(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    action: WorkAction,
  ): Promise<WorkOrderRecord> {
    const operationId = normalizedOperationId(`action_${action.type.toLowerCase()}`, idempotencyKey)
    const priorId = await priorTargetId(this.firestore, context, operationId)
    if (priorId) return (await this.getWorkOrder(context, priorId))!
    const order = await this.getWorkOrder(context, workOrderId)
    if (!order) throw new Error('ไม่พบ Work Order ในสวนปัจจุบัน')
    const before = order.status
    const after = assertWorkAction(order, context, action)
    if (action.type === 'CLOSE' && order.careType === 'CHEMICAL') {
      const careSnapshot = await getDoc(doc(
        this.firestore, 'organizations', context.farm.organizationId, 'farms', context.farm.farmId,
        'careEvents', `care_${workOrderId}`,
      ))
      if (careSnapshot.exists() && careSnapshot.data().approvalStatus === 'PENDING_SPECIALIST') {
        throw new Error('งานสารเคมียัง Pending Specialist ห้ามปิดงาน')
      }
    }
    const version = order.version + 1
    const eventId = createOpaqueRecordId('workevt')
    const eventTypes: Record<WorkAction['type'], WorkAuditEventType> = {
      ASSIGN: 'WORK_ASSIGNED', ACCEPT: 'WORK_ACCEPTED', START: 'WORK_STARTED',
      PAUSE: 'WORK_PAUSED', RESUME: 'WORK_RESUMED', SUBMIT: 'WORK_SUBMITTED',
      VERIFY: 'WORK_VERIFIED', REJECT: 'WORK_REJECTED',
      REQUEST_REWORK: 'WORK_REWORK_REQUESTED', CLOSE: 'WORK_CLOSED',
    }
    const update: Record<string, unknown> = {
      status: after,
      version,
      lastEventId: eventId,
      updatedBy: context.actor.userId,
      updatedAt: serverTimestamp(),
    }
    if (action.type === 'ASSIGN') update.assignedUserId = action.assignedUserId.trim()
    if (action.type === 'PAUSE') update.isPaused = true
    if (action.type === 'RESUME' || action.type === 'START') update.isPaused = false
    if (action.type === 'START' && before === 'REWORK') update.report = null
    if (action.type === 'REJECT') update.rejectionReason = action.reason.trim()
    if (action.type === 'REQUEST_REWORK') update.reworkReason = action.reason.trim()
    const reason =
      action.type === 'REJECT' || action.type === 'REQUEST_REWORK'
        ? action.reason.trim()
        : action.type === 'ASSIGN'
          ? action.assignedUserId.trim()
          : action.type
    const reference = workReference(this.firestore, context, workOrderId)
    const batch = writeBatch(this.firestore)
    batch.update(reference, update)
    batch.set(doc(reference, 'events', eventId), workEventData(
      context, workOrderId, eventId, eventTypes[action.type], before, after, reason, version,
    ))
    batch.set(operationReference(this.firestore, context, operationId), operationData(
      context, operationId, `ACTION_${action.type}`, workOrderId,
    ))
    if (action.type === 'VERIFY' && order.category === 'CARE' && order.careType && order.report) {
      const careEventId = `care_${workOrderId}`
      const careReference = doc(
        this.firestore, 'organizations', context.farm.organizationId, 'farms', context.farm.farmId,
        'careEvents', careEventId,
      )
      const careAuditEventId = createOpaqueRecordId('careevt')
      batch.set(careReference, {
        recordType: 'CARE_EVENT', organizationId: context.farm.organizationId,
        farmId: context.farm.farmId, careEventId, workOrderId,
        careType: order.careType, positionIds: [...order.target.positionIds],
        materials: structuredClone(order.report.materials), notes: order.report.notes,
        approvalStatus: specialistApprovalForCare(order.careType), approvedBy: null,
        version: 1, lastEventId: careAuditEventId, exampleData: true, createdBy: context.actor.userId,
        createdAt: serverTimestamp(), updatedBy: context.actor.userId,
        updatedAt: serverTimestamp(),
      })
      batch.set(doc(careReference, 'events', careAuditEventId), {
        recordType: 'CARE_EVENT_AUDIT', organizationId: context.farm.organizationId,
        farmId: context.farm.farmId, careEventId, eventId: careAuditEventId,
        eventType: 'CARE_RECORDED', actorUserId: context.actor.userId,
        careVersion: 1, exampleData: true, createdAt: serverTimestamp(),
      })
    }
    await batch.commit()
    return (await this.getWorkOrder(context, workOrderId))!
  }

  async confirmWorkTarget(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    scannedPositionId: string,
  ): Promise<WorkOrderRecord> {
    const operationId = normalizedOperationId('confirm_target', idempotencyKey)
    const priorId = await priorTargetId(this.firestore, context, operationId)
    if (priorId) return (await this.getWorkOrder(context, priorId))!
    const order = await this.getWorkOrder(context, workOrderId)
    if (!order) throw new Error('ไม่พบ Work Order ในสวนปัจจุบัน')
    if (order.assignedUserId !== context.actor.userId) throw new Error('งานนี้ไม่ได้มอบหมายให้ผู้ใช้ปัจจุบัน')
    if (!['ACCEPTED', 'IN_PROGRESS'].includes(order.status)) throw new Error('ต้องรับหรือเริ่มงานก่อนยืนยันต้น')
    if (order.target.kind !== 'TREE') throw new Error('QR confirmation ใช้กับงานรายต้น')
    if (scannedPositionId !== order.target.positionIds[0]) throw new Error('ป้ายที่สแกนไม่ตรงต้นเป้าหมาย')
    const version = order.version + 1
    const eventId = createOpaqueRecordId('workevt')
    const reference = workReference(this.firestore, context, workOrderId)
    const batch = writeBatch(this.firestore)
    batch.update(reference, {
      targetConfirmedPositionId: scannedPositionId, version, lastEventId: eventId,
      updatedBy: context.actor.userId, updatedAt: serverTimestamp(),
    })
    batch.set(doc(reference, 'events', eventId), workEventData(
      context, workOrderId, eventId, 'WORK_TARGET_CONFIRMED', order.status, order.status,
      scannedPositionId, version,
    ))
    batch.set(operationReference(this.firestore, context, operationId), operationData(
      context, operationId, 'CONFIRM_TARGET', workOrderId,
    ))
    await batch.commit()
    return (await this.getWorkOrder(context, workOrderId))!
  }

  async uploadWorkPhoto(
    context: WorkMutationContext,
    workOrderId: string,
    photoId: string,
    phase: WorkPhotoEvidence['phase'],
    prepared: PreparedWorkPhotoUpload,
  ): Promise<WorkPhotoEvidence> {
    const order = await this.getWorkOrder(context, workOrderId)
    if (!order) throw new Error('ไม่พบ Work Order ในสวนปัจจุบัน')
    if (phase === 'INSTRUCTION') {
      if (!canCreateWork(context.farm.role, order.category) || order.createdBy !== context.actor.userId) {
        throw new Error('ไม่มีสิทธิ์แนบรูปประกอบใบงาน')
      }
      if (order.status !== 'DRAFT') throw new Error('แนบรูปประกอบได้เฉพาะตอนใบงานยังเป็นร่าง')
    } else {
      if (order.assignedUserId !== context.actor.userId) {
        throw new Error('งานนี้ไม่ได้มอบหมายให้ผู้ใช้ปัจจุบัน')
      }
      if (order.status !== 'IN_PROGRESS' || order.isPaused) {
        throw new Error('แนบรูปส่งงานได้เฉพาะงานที่กำลังทำและไม่พัก')
      }
    }
    const valid = validatePreparedWorkPhotoUpload(prepared, false)
    const storagePath = [
      'organizations', context.farm.organizationId, 'farms', context.farm.farmId,
      'workEvidence', workOrderId, photoId,
    ].join('/')
    await uploadBytes(ref(this.storage, storagePath), valid.blob, {
      contentType: valid.outputMimeType,
      customMetadata: {
        organizationId: context.farm.organizationId,
        farmId: context.farm.farmId,
        workOrderId,
        uploadedBy: context.actor.userId,
        evidencePhase: phase,
        uploadSessionId: photoId,
        processingVersion: valid.processingVersion,
        processingMode: valid.processingMode,
        metadataStripped: String(valid.metadataStripped),
        originalSizeBytes: String(valid.originalSizeBytes),
        preparedSizeBytes: String(valid.preparedSizeBytes),
        preparedWidth: String(valid.preparedWidth),
        preparedHeight: String(valid.preparedHeight),
        exampleData: 'true',
      },
    })
    return {
      photoId,
      phase,
      uploadState: 'UPLOADED',
      storagePath,
      note: 'EXAMPLE DATA ONLY — WebP ≤1600px/≤5MB; EXIF/GPS removed',
    }
  }

  async saveWorkInstructionPhotos(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    photos: readonly WorkPhotoEvidence[],
  ): Promise<WorkOrderRecord> {
    const operationId = normalizedOperationId('save_instruction_photos', idempotencyKey)
    const priorId = await priorTargetId(this.firestore, context, operationId)
    if (priorId) return (await this.getWorkOrder(context, priorId))!
    const order = await this.getWorkOrder(context, workOrderId)
    if (!order) throw new Error('ไม่พบ Work Order ในสวนปัจจุบัน')
    const valid = validateWorkInstructionPhotos(order, context, photos)
    const version = order.version + 1
    const eventId = createOpaqueRecordId('workevt')
    const reference = workReference(this.firestore, context, workOrderId)
    const batch = writeBatch(this.firestore)
    batch.update(reference, {
      instructionPhotos: structuredClone(valid),
      version,
      lastEventId: eventId,
      updatedBy: context.actor.userId,
      updatedAt: serverTimestamp(),
    })
    batch.set(doc(reference, 'events', eventId), workEventData(
      context, workOrderId, eventId, 'WORK_INSTRUCTION_PHOTOS_SAVED',
      order.status, order.status, `แนบรูปประกอบใบงาน ${valid.length} รูป`, version,
    ))
    batch.set(operationReference(this.firestore, context, operationId), operationData(
      context, operationId, 'SAVE_INSTRUCTION_PHOTOS', workOrderId,
    ))
    await batch.commit()
    return (await this.getWorkOrder(context, workOrderId))!
  }

  async getWorkPhotoUrl(
    context: WorkMutationContext,
    workOrderId: string,
    storagePath: string,
  ): Promise<string> {
    const order = await this.getWorkOrder(context, workOrderId)
    if (!order) throw new Error('ไม่พบ Work Order ในสวนปัจจุบัน')
    const expectedPrefix = [
      'organizations', context.farm.organizationId, 'farms', context.farm.farmId,
      'workEvidence', workOrderId, '',
    ].join('/')
    if (!storagePath.startsWith(expectedPrefix)) throw new Error('ปฏิเสธเส้นทางรูปที่ไม่ตรง Work Order')
    return getDownloadURL(ref(this.storage, storagePath))
  }

  async saveWorkReport(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    input: WorkReportInput,
  ): Promise<WorkOrderRecord> {
    const operationId = normalizedOperationId('save_report', idempotencyKey)
    const priorId = await priorTargetId(this.firestore, context, operationId)
    if (priorId) return (await this.getWorkOrder(context, priorId))!
    const order = await this.getWorkOrder(context, workOrderId)
    if (!order) throw new Error('ไม่พบ Work Order ในสวนปัจจุบัน')
    if (order.assignedUserId !== context.actor.userId) throw new Error('งานนี้ไม่ได้มอบหมายให้ผู้ใช้ปัจจุบัน')
    const valid = validateWorkReport(order, input)
    const version = order.version + 1
    const eventId = createOpaqueRecordId('workevt')
    const reportId = order.report?.reportId ?? createOpaqueRecordId('report')
    const reference = workReference(this.firestore, context, workOrderId)
    const batch = writeBatch(this.firestore)
    batch.update(reference, {
      report: reportData(valid, context.actor.userId, reportId, (order.report?.version ?? 0) + 1),
      targetConfirmedPositionId: valid.targetConfirmedPositionId,
      version, lastEventId: eventId, updatedBy: context.actor.userId, updatedAt: serverTimestamp(),
    })
    batch.set(doc(reference, 'events', eventId), workEventData(
      context, workOrderId, eventId, 'WORK_REPORT_SAVED', order.status, order.status,
      'บันทึกรายงานจำลอง', version,
    ))
    batch.set(operationReference(this.firestore, context, operationId), operationData(
      context, operationId, 'SAVE_REPORT', workOrderId,
    ))
    await batch.commit()
    return (await this.getWorkOrder(context, workOrderId))!
  }

  async listCareEvents(context: WorkMutationContext): Promise<readonly CareEventRecord[]> {
    const snapshot = await getDocs(query(collection(
      this.firestore, 'organizations', context.farm.organizationId, 'farms', context.farm.farmId, 'careEvents',
    ), orderBy('createdAt', 'desc')))
    return snapshot.docs.map((item) => parseCare(item.data()))
  }

  async approveCareEvent(
    context: WorkMutationContext,
    careEventId: string,
    idempotencyKey: string,
  ): Promise<CareEventRecord> {
    if (context.farm.role !== 'AGRONOMIST') throw new Error('เฉพาะ Agronomist ที่อนุมัติ treatment ได้')
    const operationId = normalizedOperationId('approve_care', idempotencyKey)
    const reference = doc(
      this.firestore, 'organizations', context.farm.organizationId, 'farms', context.farm.farmId,
      'careEvents', careEventId,
    )
    const priorId = await priorTargetId(this.firestore, context, operationId)
    if (priorId) {
      const prior = await getDoc(reference)
      if (prior.exists()) return parseCare(prior.data())
    }
    const snapshot = await getDoc(reference)
    if (!snapshot.exists()) throw new Error('ไม่พบ Care Event')
    const event = parseCare(snapshot.data())
    if (event.approvalStatus !== 'PENDING_SPECIALIST') throw new Error('Care Event นี้ไม่รอ specialist')
    const batch = writeBatch(this.firestore)
    const eventId = createOpaqueRecordId('careevt')
    batch.update(reference, {
      approvalStatus: 'APPROVED', approvedBy: context.actor.userId,
      version: event.version + 1, lastEventId: eventId,
      updatedBy: context.actor.userId, updatedAt: serverTimestamp(),
    })
    batch.set(doc(reference, 'events', eventId), {
      recordType: 'CARE_EVENT_AUDIT', organizationId: context.farm.organizationId,
      farmId: context.farm.farmId, careEventId, eventId,
      eventType: 'SPECIALIST_APPROVED', actorUserId: context.actor.userId,
      careVersion: event.version + 1, exampleData: true, createdAt: serverTimestamp(),
    })
    batch.set(operationReference(this.firestore, context, operationId), operationData(
      context, operationId, 'APPROVE_CARE', careEventId,
    ))
    await batch.commit()
    return parseCare((await getDoc(reference)).data()!)
  }

  async listDiseaseIncidents(
    context: WorkMutationContext,
  ): Promise<readonly DiseaseIncidentRecord[]> {
    const snapshot = await getDocs(query(collection(
      this.firestore, 'organizations', context.farm.organizationId, 'farms', context.farm.farmId,
      'diseaseIncidents',
    ), orderBy('createdAt', 'desc')))
    return Promise.all(snapshot.docs.map(async (item) => {
      const incident = parseDisease(item.data())
      const [events, photos] = await Promise.all([
        getDocs(query(collection(item.ref, 'events'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(item.ref, 'photos'), orderBy('createdAt', 'desc'))),
      ])
      return {
        ...incident,
        photos: photos.docs.map((photo) => parseDiseasePhoto(photo.data())),
        audit: events.docs.map((event) => parseDiseaseEvent(event.data())),
      }
    }))
  }

  private async getDiseaseIncident(
    context: WorkMutationContext,
    incidentId: string,
  ): Promise<DiseaseIncidentRecord | undefined> {
    const reference = diseaseReference(this.firestore, context, incidentId)
    const snapshot = await getDoc(reference)
    if (!snapshot.exists()) return undefined
    const incident = parseDisease(snapshot.data())
    const [events, photos] = await Promise.all([
      getDocs(query(collection(reference, 'events'), orderBy('createdAt', 'desc'))),
      getDocs(query(collection(reference, 'photos'), orderBy('createdAt', 'desc'))),
    ])
    return {
      ...incident,
      photos: photos.docs.map((photo) => parseDiseasePhoto(photo.data())),
      audit: events.docs.map((event) => parseDiseaseEvent(event.data())),
    }
  }

  async createDiseaseIncident(
    context: WorkMutationContext,
    idempotencyKey: string,
    draft: DiseaseIncidentDraft,
  ): Promise<DiseaseIncidentRecord> {
    const valid = validateDiseaseDraft(context, draft)
    const operationId = normalizedOperationId('create_disease', idempotencyKey)
    const priorId = await priorTargetId(this.firestore, context, operationId)
    if (priorId) {
      const prior = await this.getDiseaseIncident(context, priorId)
      if (prior) return prior
    }
    const incidentId = createOpaqueRecordId('disease')
    const reference = doc(
      this.firestore, 'organizations', context.farm.organizationId, 'farms', context.farm.farmId,
      'diseaseIncidents', incidentId,
    )
    const eventId = createOpaqueRecordId('diseaseevt')
    const batch = writeBatch(this.firestore)
    batch.set(reference, {
      recordType: 'DISEASE_INCIDENT', organizationId: context.farm.organizationId,
      farmId: context.farm.farmId, incidentId, positionId: valid.positionId,
      observedSymptom: valid.observedSymptom, severity: valid.severity,
      suspectedDiagnosis: valid.suspectedDiagnosis, confirmedDiagnosis: '', treatmentPlan: '',
      followUpDate: valid.followUpDate, status: valid.suspectedDiagnosis ? 'AWAITING_DIAGNOSIS' : 'OPEN',
      specialistApprovalStatus: 'PENDING_SPECIALIST', outcome: '',
      treatmentWorkOrderId: null, treatmentOperationId: null, version: 1,
      lastEventId: eventId, exampleData: true, reportedBy: context.actor.userId, createdAt: serverTimestamp(),
      updatedBy: context.actor.userId, updatedAt: serverTimestamp(),
    })
    batch.set(doc(reference, 'events', eventId), diseaseEventData(
      context, incidentId, eventId, 'SYMPTOM_OBSERVED', valid.observedSymptom, 1,
    ))
    batch.set(operationReference(this.firestore, context, operationId), operationData(
      context, operationId, 'CREATE_DISEASE', incidentId,
    ))
    await batch.commit()
    return (await this.getDiseaseIncident(context, incidentId))!
  }

  async assessDiseaseIncident(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    input: DiseaseAssessmentInput,
  ): Promise<DiseaseIncidentRecord> {
    const valid = validateDiseaseAssessment(context, input)
    return this.updateDisease(context, incidentId, idempotencyKey, 'ASSESS_DISEASE', {
      ...valid, status: 'TREATING', specialistApprovalStatus: 'APPROVED',
    }, 'ASSESSMENT_RECORDED', 'Agronomist ยืนยัน diagnosis/treatment จำลอง')
  }

  async followUpDiseaseIncident(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    input: DiseaseFollowUpInput,
  ): Promise<DiseaseIncidentRecord> {
    const valid = validateDiseaseFollowUp(context, input)
    return this.updateDisease(context, incidentId, idempotencyKey, 'FOLLOWUP_DISEASE', {
      outcome: valid.outcome, followUpDate: valid.nextFollowUpDate,
      status: valid.closeIncident ? 'CLOSED' : 'FOLLOW_UP',
    }, valid.closeIncident ? 'INCIDENT_CLOSED' : 'FOLLOW_UP_RECORDED', valid.outcome)
  }

  private async updateDisease(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    scope: string,
    update: Record<string, unknown>,
    eventType: DiseaseAuditEvent['eventType'],
    description: string,
  ): Promise<DiseaseIncidentRecord> {
    const operationId = normalizedOperationId(scope.toLowerCase(), idempotencyKey)
    const reference = doc(
      this.firestore, 'organizations', context.farm.organizationId, 'farms', context.farm.farmId,
      'diseaseIncidents', incidentId,
    )
    const priorId = await priorTargetId(this.firestore, context, operationId)
    if (priorId) return (await this.getDiseaseIncident(context, priorId))!
    const snapshot = await getDoc(reference)
    if (!snapshot.exists()) throw new Error('ไม่พบ Disease Incident')
    const incident = parseDisease(snapshot.data())
    const version = incident.version + 1
    const eventId = createOpaqueRecordId('diseaseevt')
    const batch = writeBatch(this.firestore)
    batch.update(reference, {
      ...update, version, lastEventId: eventId,
      updatedBy: context.actor.userId, updatedAt: serverTimestamp(),
    })
    batch.set(doc(reference, 'events', eventId), diseaseEventData(
      context, incidentId, eventId, eventType, description, version,
    ))
    batch.set(operationReference(this.firestore, context, operationId), operationData(
      context, operationId, scope, incidentId,
    ))
    await batch.commit()
    return (await this.getDiseaseIncident(context, incidentId))!
  }

  async addDiseasePhotoMock(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    draft: DiseasePhotoMockDraft,
  ): Promise<DiseaseIncidentRecord> {
    if (!canAddDiseasePhoto(context.farm.role)) throw new Error('ไม่มีสิทธิ์เพิ่มภาพประกอบเคสโรค')
    const operationId = normalizedOperationId('disease_photo_add', idempotencyKey)
    const incidentRef = diseaseReference(this.firestore, context, incidentId)
    const deterministicPhotoId = `diseasephoto_${operationId}`.slice(0, 200)
    const photoRef = doc(incidentRef, 'photos', deterministicPhotoId)
    const existingPhoto = await getDoc(photoRef)
    if (existingPhoto.exists()) {
      if (requiredString(existingPhoto.data(), 'lastOperationId') !== operationId) {
        throw new Error('Duplicate Disease photo operation')
      }
      return (await this.getDiseaseIncident(context, incidentId))!
    }
    const currentIncident = await this.getDiseaseIncident(context, incidentId)
    if (!currentIncident) throw new Error('ไม่พบ Disease Incident ในสวนปัจจุบัน')
    const valid = validateDiseasePhotoMockDraft(context, currentIncident, draft)
    await runTransaction(this.firestore, async (transaction) => {
      const [incidentSnapshot, photoSnapshot] = await Promise.all([
        transaction.get(incidentRef),
        transaction.get(photoRef),
      ])
      if (photoSnapshot.exists()) {
        if (requiredString(photoSnapshot.data(), 'lastOperationId') !== operationId) {
          throw new Error('Duplicate Disease photo operation')
        }
        return
      }
      if (!incidentSnapshot.exists()) throw new Error('ไม่พบ Disease Incident ในสวนปัจจุบัน')
      const incident = parseDisease(incidentSnapshot.data())
      if (incident.status === 'CLOSED') throw new Error('เคสที่ปิดแล้วเพิ่มภาพไม่ได้')
      const photo: DiseasePhotoMockEvidence = {
        ...valid,
        photoId: deterministicPhotoId,
        organizationId: incident.organizationId,
        farmId: incident.farmId,
        incidentId,
        positionId: incident.positionId,
        source: 'SYNTHETIC_PLACEHOLDER',
        classification: 'SIMULATED/TEST ONLY',
        uploadState: 'PENDING',
        retryCount: 0,
        lastError: '',
        containsExifOrGps: false,
        externalStorage: false,
        lifecycleMode: 'DRY_RUN',
        version: 1,
        createdBy: context.actor.userId,
        createdAtLabel: 'Firebase Emulator · SIMULATED/TEST ONLY',
      }
      const version = incident.version + 1
      const eventId = createOpaqueRecordId('diseaseevt')
      transaction.update(incidentRef, {
        version,
        lastEventId: eventId,
        updatedBy: context.actor.userId,
        updatedAt: serverTimestamp(),
      })
      transaction.set(photoRef, {
        ...photo,
        lastOperationId: operationId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
      transaction.set(doc(incidentRef, 'events', eventId), diseaseEventData(
        context,
        incidentId,
        eventId,
        'PHOTO_PLACEHOLDER_ADDED',
        `${photo.classification} · ${photo.placeholderKind} · ${photo.mimeType} · ${photo.sizeBytes} bytes`,
        version,
      ))
    })
    return (await this.getDiseaseIncident(context, incidentId))!
  }

  async advanceDiseasePhotoMock(
    context: WorkMutationContext,
    incidentId: string,
    photoId: string,
    idempotencyKey: string,
    action: DiseasePhotoAction,
  ): Promise<DiseaseIncidentRecord> {
    if (!canAddDiseasePhoto(context.farm.role)) throw new Error('ไม่มีสิทธิ์เปลี่ยนสถานะภาพประกอบเคสโรค')
    const operationId = normalizedOperationId(`disease_photo_${action.toLowerCase()}`, idempotencyKey)
    const incidentRef = diseaseReference(this.firestore, context, incidentId)
    const photoRef = doc(incidentRef, 'photos', photoId)
    await runTransaction(this.firestore, async (transaction) => {
      const [incidentSnapshot, photoSnapshot] = await Promise.all([
        transaction.get(incidentRef),
        transaction.get(photoRef),
      ])
      if (!incidentSnapshot.exists()) throw new Error('ไม่พบ Disease Incident ในสวนปัจจุบัน')
      const incident = parseDisease(incidentSnapshot.data())
      if (incident.status === 'CLOSED') throw new Error('เคสที่ปิดแล้วเปลี่ยนสถานะภาพไม่ได้')
      if (!photoSnapshot.exists()) throw new Error('ไม่พบภาพจำลองใน Disease Incident ปัจจุบัน')
      if (requiredString(photoSnapshot.data(), 'lastOperationId') === operationId) return
      const photo = parseDiseasePhoto(photoSnapshot.data())
      Object.assign(photo, nextDiseasePhotoState(photo, action))
      const version = incident.version + 1
      const eventId = createOpaqueRecordId('diseaseevt')
      const eventType: Record<DiseasePhotoAction, DiseaseAuditEvent['eventType']> = {
        START_UPLOAD: 'PHOTO_UPLOAD_STARTED',
        MARK_UPLOADED: 'PHOTO_UPLOAD_COMPLETED',
        MARK_FAILED: 'PHOTO_UPLOAD_FAILED',
        RETRY: 'PHOTO_UPLOAD_RETRIED',
      }
      transaction.update(incidentRef, {
        version,
        lastEventId: eventId,
        updatedBy: context.actor.userId,
        updatedAt: serverTimestamp(),
      })
      transaction.update(photoRef, {
        uploadState: photo.uploadState,
        retryCount: photo.retryCount,
        lastError: photo.lastError,
        version: photo.version,
        lastOperationId: operationId,
        updatedAt: serverTimestamp(),
      })
      transaction.set(doc(incidentRef, 'events', eventId), diseaseEventData(
        context,
        incidentId,
        eventId,
        eventType[action],
        `${photo.photoId} → ${photo.uploadState} · Local DRY_RUN`,
        version,
      ))
    })
    return (await this.getDiseaseIncident(context, incidentId))!
  }

  async createTreatmentWorkOrder(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    input: TreatmentWorkOrderInput,
  ): Promise<TreatmentWorkOrderResult> {
    if (context.farm.role !== 'AGRONOMIST') {
      throw new Error('เฉพาะ Agronomist เท่านั้นที่สร้างงานรักษาจาก Disease Incident ได้')
    }
    const operationId = normalizedOperationId('disease_treatment_work', idempotencyKey)
    const incidentRef = diseaseReference(this.firestore, context, incidentId)
    const deterministicSuffix = incidentId.replace(/^disease_/u, '').replaceAll(/[^A-Za-z0-9_-]/gu, '_')
    const deterministicWorkOrderId = `work_treatment_${deterministicSuffix}`.slice(0, 180)
    const workRef = workReference(this.firestore, context, deterministicWorkOrderId)
    const lockRef = treatmentLockReference(this.firestore, context, incidentId)
    const treeRef = doc(
      this.firestore,
      'organizations',
      context.farm.organizationId,
      'farms',
      context.farm.farmId,
      'treePositions',
      input.positionId,
    )
    const [incidentSnapshot, treeSnapshot] = await Promise.all([
      getDoc(incidentRef),
      getDoc(treeRef),
    ])
    if (!incidentSnapshot.exists()) throw new Error('ไม่พบ Disease Incident ในสวนปัจจุบัน')
    const incidentBefore = parseDisease(incidentSnapshot.data())
    const priorWorkOrderId = nullableString(incidentSnapshot.data(), 'treatmentWorkOrderId')
    const priorOperationId = nullableString(incidentSnapshot.data(), 'treatmentOperationId')
    if (priorWorkOrderId) {
      if (priorOperationId !== operationId) {
        throw new Error('Duplicate Attempt: เคสนี้มี Treatment Work Order แล้ว')
      }
      const priorWork = await this.getWorkOrder(context, priorWorkOrderId)
      const priorIncident = await this.getDiseaseIncident(context, incidentId)
      if (!priorWork || !priorIncident) throw new Error('Audit corruption: ลิงก์งานรักษาไม่สมบูรณ์')
      return { incident: priorIncident, workOrder: priorWork }
    }
    const valid = validateTreatmentWorkOrderInput(context, incidentBefore, input)
    if (!treeSnapshot.exists()) throw new Error('Wrong-Tree: ไม่พบต้นในทะเบียนของสวนปัจจุบัน')
    const tree = treeSnapshot.data()
    if (
      requiredString(tree, 'organizationId') !== context.farm.organizationId ||
      requiredString(tree, 'farmId') !== context.farm.farmId ||
      requiredString(tree, 'positionId') !== valid.positionId ||
      requiredString(tree, 'zoneCode') !== valid.zoneCode ||
      requiredString(tree, 'rowCode') !== valid.rowCode
    ) {
      throw new Error('Wrong-Tree: Zone/Row/Position ไม่ตรงทะเบียนต้นของสวนปัจจุบัน')
    }

    await runTransaction(this.firestore, async (transaction) => {
      const lockSnapshot = await transaction.get(lockRef)
      if (lockSnapshot.exists()) {
        if (requiredString(lockSnapshot.data(), 'operationId') !== operationId) {
          throw new Error('Duplicate Attempt: เคสนี้ถูกจองสำหรับ Treatment Work Order แล้ว')
        }
        return
      }
      transaction.set(lockRef, {
        recordType: 'DISEASE_TREATMENT_LOCK',
        organizationId: context.farm.organizationId,
        farmId: context.farm.farmId,
        incidentId,
        positionId: valid.positionId,
        workOrderId: deterministicWorkOrderId,
        operationId,
        actorUserId: context.actor.userId,
        exampleData: true,
        createdAt: serverTimestamp(),
      })
    })

    let existingWorkOrder = (await this.listWorkOrders(context)).find(
      (candidate) => candidate.workOrderId === deterministicWorkOrderId,
    )
    if (!existingWorkOrder) {
      const workEventId = createOpaqueRecordId('workevt')
      const draft = validateWorkDraft({
        title: `งานรักษาจากเคส ${incidentId}`,
        description: `SIMULATED/TEST ONLY — ${incidentBefore.treatmentPlan} · อ้างอิงอาการ: ${incidentBefore.observedSymptom}`,
        category: 'DISEASE_FOLLOW_UP',
        careType: null,
        priority: ['HIGH', 'CRITICAL'].includes(incidentBefore.severity) ? 'URGENT' : 'NORMAL',
        target: {
          kind: 'TREE', zoneCode: valid.zoneCode, rowCode: valid.rowCode,
          positionIds: [valid.positionId],
        },
        dueDate: valid.dueDate,
        assignedUserId: valid.assignedUserId,
      })
      const batch = writeBatch(this.firestore)
      batch.set(workRef, workData(
        context, deterministicWorkOrderId, draft, context.actor.userId, workEventId, incidentId,
      ))
      batch.set(doc(workRef, 'events', workEventId), workEventData(
        context, deterministicWorkOrderId, workEventId, 'WORK_CREATED', 'DRAFT', 'DRAFT',
        `สร้างจาก Disease Incident ${incidentId}`, 1,
      ))
      await batch.commit()
      existingWorkOrder = await this.getWorkOrder(context, deterministicWorkOrderId)
    }

    await runTransaction(this.firestore, async (transaction) => {
      const currentSnapshot = await transaction.get(incidentRef)
      if (!currentSnapshot.exists()) throw new Error('ไม่พบ Disease Incident ในสวนปัจจุบัน')
      const currentWorkOrderId = nullableString(currentSnapshot.data(), 'treatmentWorkOrderId')
      const currentOperationId = nullableString(currentSnapshot.data(), 'treatmentOperationId')
      if (currentWorkOrderId) {
        if (currentWorkOrderId === deterministicWorkOrderId && currentOperationId === operationId) return
        throw new Error('Duplicate Attempt: เคสนี้มี Treatment Work Order แล้ว')
      }
      const currentIncident = parseDisease(currentSnapshot.data())
      const diseaseEventId = createOpaqueRecordId('diseaseevt')
      const incidentVersion = currentIncident.version + 1
      transaction.update(incidentRef, {
        treatmentWorkOrderId: deterministicWorkOrderId,
        treatmentOperationId: operationId,
        version: incidentVersion,
        lastEventId: diseaseEventId,
        updatedBy: context.actor.userId,
        updatedAt: serverTimestamp(),
      })
      transaction.set(doc(incidentRef, 'events', diseaseEventId), diseaseEventData(
        context, incidentId, diseaseEventId, 'TREATMENT_WORK_CREATED',
        `เชื่อม Treatment Work Order ${deterministicWorkOrderId}`, incidentVersion,
      ))
    })
    const [incident, linkedWorkOrder] = await Promise.all([
      this.getDiseaseIncident(context, incidentId),
      this.getWorkOrder(context, deterministicWorkOrderId),
    ])
    if (!incident || !linkedWorkOrder || !existingWorkOrder) {
      throw new Error('สร้างลิงก์งานรักษาไม่สมบูรณ์')
    }
    return { incident, workOrder: linkedWorkOrder }
  }

  async listNotifications(context: WorkMutationContext): Promise<readonly InAppNotification[]> {
    const [workOrders, incidents] = await Promise.all([
      this.listWorkOrders(context),
      this.listDiseaseIncidents(context),
    ])
    return [
      ...workOrders
        .filter((order) => order.status === 'REWORK' || (
          order.priority === 'URGENT' && !['VERIFIED', 'REJECTED', 'CLOSED'].includes(order.status)
        ))
        .map((order): InAppNotification => ({
          notificationId: `notification_urgent_${order.workOrderId}`,
          organizationId: order.organizationId,
          farmId: order.farmId,
          kind: order.status === 'REWORK' ? 'REWORK' : 'URGENT_WORK',
          title: order.status === 'REWORK' ? 'งานที่ต้องแก้' : 'งานเร่งด่วน',
          description: order.status === 'REWORK' ? order.reworkReason : order.title,
          targetPath: `/work/${order.workOrderId}`,
          priority: 'URGENT',
          exampleData: true,
        })),
      ...incidents
        .filter((incident) => incident.status !== 'CLOSED' && ['HIGH', 'CRITICAL'].includes(incident.severity))
        .map((incident): InAppNotification => ({
          notificationId: `notification_disease_${incident.incidentId}`,
          organizationId: incident.organizationId,
          farmId: incident.farmId,
          kind: 'DISEASE_FOLLOW_UP',
          title: 'ติดตามอาการเร่งด่วน',
          description: incident.observedSymptom,
          targetPath: `/disease/${incident.incidentId}`,
          priority: 'URGENT',
          exampleData: true,
        })),
    ]
  }
}
