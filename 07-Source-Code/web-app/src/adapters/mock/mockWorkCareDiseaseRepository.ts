import type { WorkCareDiseaseRepository } from '../contracts'
import {
  assertWorkAction,
  canAddDiseasePhoto,
  canCreateWork,
  nextDiseasePhotoState,
  specialistApprovalForCare,
  validateDiseaseAssessment,
  validateDiseaseDraft,
  validateDiseaseFollowUp,
  validateDiseasePhotoMockDraft,
  validatePreparedWorkPhotoUpload,
  validateWorkDraft,
  validateWorkInstructionPhotos,
  validateWorkReport,
  validateTreatmentWorkOrderInput,
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
  type WorkReportInput,
} from '../../domain/workCareDisease'
import type { TreePositionSummary } from '../../domain/treeRegister'

import phase4MockDataPack from '../../demo/phase4-mock-data-pack-v1.0.json'
import phase2DemoSeed from '../../demo/phase2-demo-seed.json'

interface Phase4MockDataPack {
  metadata: {
    packId: string
    version: string
    classification: 'SIMULATED/TEST ONLY'
    deterministic: true
    resettable: true
    fixedClock: string
    resetCommand: string
    realFieldData: false
    productionUseAllowed: false
  }
  workOrders: WorkOrderRecord[]
  careEvents: CareEventRecord[]
  diseaseIncidents: DiseaseIncidentRecord[]
  canonicalRoleCoverage: string[]
  syncScenarios: string[]
  accessScenarios: string[]
  uiScenarios: string[]
}

const mockDataPack = phase4MockDataPack as unknown as Phase4MockDataPack

export const phase4MockDataPackMetadata = Object.freeze(clone(mockDataPack.metadata))
export const phase4MockDataPackCoverage = Object.freeze({
  canonicalRoles: clone(mockDataPack.canonicalRoleCoverage),
  syncScenarios: clone(mockDataPack.syncScenarios),
  accessScenarios: clone(mockDataPack.accessScenarios),
  uiScenarios: clone(mockDataPack.uiScenarios),
})

function nowLabel(): string {
  return `${mockDataPack.metadata.fixedClock} · SIMULATED/TEST ONLY`
}

function clone<T>(value: T): T {
  return structuredClone(value)
}

function mockPhotoPlaceholderUrl(): string {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360"><rect width="640" height="360" fill="#eef4e8"/><rect x="24" y="24" width="592" height="312" rx="20" fill="none" stroke="#54723d" stroke-width="4"/><text x="320" y="170" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#26351f">SIMULATED / TEST ONLY</text><text x="320" y="215" text-anchor="middle" font-family="sans-serif" font-size="22" fill="#54723d">Work photo placeholder</text></svg>'
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function workEvent(
  eventId: string,
  context: WorkMutationContext,
  eventType: WorkAuditEventType,
  beforeStatus: WorkOrderRecord['status'],
  afterStatus: WorkOrderRecord['status'],
  reason: string,
  version: number,
): WorkAuditEvent {
  return {
    eventId,
    eventType,
    actorUserId: context.actor.userId,
    actorDisplayName: context.actor.displayName,
    beforeStatus,
    afterStatus,
    reason,
    createdAtLabel: nowLabel(),
    workVersion: version,
  }
}

function diseaseEvent(
  eventId: string,
  context: WorkMutationContext,
  eventType: DiseaseAuditEvent['eventType'],
  description: string,
  version: number,
): DiseaseAuditEvent {
  return {
    eventId,
    eventType,
    actorUserId: context.actor.userId,
    actorDisplayName: context.actor.displayName,
    description,
    createdAtLabel: nowLabel(),
    incidentVersion: version,
  }
}

export function createDemoWorkOrders(): WorkOrderRecord[] {
  return clone(mockDataPack.workOrders.map((order) => ({
    ...order,
    instructionPhotos: order.instructionPhotos ?? [],
    sourceDiseaseIncidentId: order.sourceDiseaseIncidentId ?? null,
  })))
}

export function createDemoCareEvents(): CareEventRecord[] {
  return clone(mockDataPack.careEvents)
}

export function createDemoDiseaseIncidents(): DiseaseIncidentRecord[] {
  return clone(mockDataPack.diseaseIncidents.map((incident) => ({
    ...incident,
    photos: incident.photos ?? [],
    treatmentWorkOrderId: incident.treatmentWorkOrderId ?? null,
  })))
}

function createDemoTreePositionSummaries(): TreePositionSummary[] {
  return clone(phase2DemoSeed.treePositions as unknown as TreePositionSummary[])
}

export class MockWorkCareDiseaseRepository implements WorkCareDiseaseRepository {
  private readonly operationResults = new Map<string, unknown>()
  private readonly workPhotoUrls = new Map<string, string>()
  private generatedIdSequence = 0

  constructor(
    private readonly workOrders = createDemoWorkOrders(),
    private readonly careEvents = createDemoCareEvents(),
    private readonly diseaseIncidents = createDemoDiseaseIncidents(),
    private readonly treePositions = createDemoTreePositionSummaries(),
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
    if (!key) throw new Error('ต้องระบุ idempotency key')
    return `${context.farm.farmId}:${scope}:${key}`
  }

  private prior<T>(key: string): T | undefined {
    const value = this.operationResults.get(key)
    return value === undefined ? undefined : clone(value as T)
  }

  private remember<T>(key: string, value: T): T {
    this.operationResults.set(key, clone(value))
    return clone(value)
  }

  private requireWork(
    context: WorkMutationContext,
    workOrderId: string,
  ): WorkOrderRecord {
    const order = this.workOrders.find((candidate) => candidate.workOrderId === workOrderId)
    if (!order) throw new Error('ไม่พบ Work Order')
    if (
      order.organizationId !== context.farm.organizationId ||
      order.farmId !== context.farm.farmId
    ) {
      throw new Error('ปฏิเสธการเข้าถึง Work Order ข้ามสวน')
    }
    return order
  }

  listWorkOrders(context: WorkMutationContext): Promise<readonly WorkOrderRecord[]> {
    const visible = this.workOrders.filter((order) => {
      if (
        order.organizationId !== context.farm.organizationId ||
        order.farmId !== context.farm.farmId
      ) return false
      if (context.farm.role === 'WORKER') return order.assignedUserId === context.actor.userId
      if (context.farm.role === 'AGRONOMIST') {
        return order.category !== 'GENERAL' || order.assignedUserId === context.actor.userId
      }
      return ['ORG_OWNER', 'FARM_MANAGER', 'AUDITOR'].includes(context.farm.role)
    })
    return Promise.resolve(clone(visible))
  }

  getWorkOrder(
    context: WorkMutationContext,
    workOrderId: string,
  ): Promise<WorkOrderRecord | undefined> {
    const order = this.workOrders.find((candidate) => candidate.workOrderId === workOrderId)
    if (!order) return Promise.resolve(undefined)
    if (
      order.organizationId !== context.farm.organizationId ||
      order.farmId !== context.farm.farmId
    ) return Promise.resolve(undefined)
    if (context.farm.role === 'WORKER' && order.assignedUserId !== context.actor.userId) {
      return Promise.resolve(undefined)
    }
    return Promise.resolve(clone(order))
  }

  createWorkOrder(
    context: WorkMutationContext,
    idempotencyKey: string,
    draft: WorkOrderDraft,
  ): Promise<WorkOrderRecord> {
    const key = this.operationKey(context, 'create-work', idempotencyKey)
    const prior = this.prior<WorkOrderRecord>(key)
    if (prior) return Promise.resolve(prior)
    if (!canCreateWork(context.farm.role, draft.category)) throw new Error('ไม่มีสิทธิ์สร้างงานประเภทนี้')
    if (context.farm.farmStatus !== 'ACTIVE') throw new Error('สวนนี้สร้างงานไม่ได้')
    const valid = validateWorkDraft(draft)
    const workOrderId = this.nextId('work')
    const order: WorkOrderRecord = {
      ...valid,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      workOrderId,
      status: 'DRAFT',
      isPaused: false,
      instructionPhotos: [],
      report: null,
      targetConfirmedPositionId: null,
      rejectionReason: '',
      reworkReason: '',
      sourceDiseaseIncidentId: null,
      version: 1,
      exampleData: true,
      createdBy: context.actor.userId,
      createdAtLabel: nowLabel(),
      audit: [workEvent(
        this.nextId('workevt'), context, 'WORK_CREATED', 'DRAFT', 'DRAFT',
        'สร้างงานจำลอง', 1,
      )],
    }
    this.workOrders.unshift(order)
    return Promise.resolve(this.remember(key, order))
  }

  async performWorkAction(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    action: WorkAction,
  ): Promise<WorkOrderRecord> {
    const key = this.operationKey(context, `work-action:${workOrderId}:${action.type}`, idempotencyKey)
    const prior = this.prior<WorkOrderRecord>(key)
    if (prior) return Promise.resolve(prior)
    const order = this.requireWork(context, workOrderId)
    const before = order.status
    const after = assertWorkAction(order, context, action)

    if (action.type === 'ASSIGN') order.assignedUserId = action.assignedUserId.trim()
    if (action.type === 'PAUSE') order.isPaused = true
    if (action.type === 'RESUME') order.isPaused = false
    if (action.type === 'START') {
      order.isPaused = false
      if (before === 'REWORK') order.report = null
    }
    if (action.type === 'REJECT') order.rejectionReason = action.reason.trim()
    if (action.type === 'REQUEST_REWORK') order.reworkReason = action.reason.trim()

    order.status = after
    order.version += 1
    const eventType: Record<WorkAction['type'], WorkAuditEventType> = {
      ASSIGN: 'WORK_ASSIGNED',
      ACCEPT: 'WORK_ACCEPTED',
      START: 'WORK_STARTED',
      PAUSE: 'WORK_PAUSED',
      RESUME: 'WORK_RESUMED',
      SUBMIT: 'WORK_SUBMITTED',
      VERIFY: 'WORK_VERIFIED',
      REJECT: 'WORK_REJECTED',
      REQUEST_REWORK: 'WORK_REWORK_REQUESTED',
      CLOSE: 'WORK_CLOSED',
    }
    const reason =
      action.type === 'REJECT' || action.type === 'REQUEST_REWORK'
        ? action.reason.trim()
        : action.type === 'ASSIGN'
          ? `มอบหมายให้ ${action.assignedUserId}`
          : action.type
    order.audit = [
      workEvent(
        this.nextId('workevt'), context, eventType[action.type], before, after,
        reason, order.version,
      ),
      ...order.audit,
    ]

    if (action.type === 'VERIFY' && order.category === 'CARE' && order.careType && order.report) {
      const existing = this.careEvents.find((event) => event.workOrderId === order.workOrderId)
      if (!existing) {
        this.careEvents.unshift({
          organizationId: order.organizationId,
          farmId: order.farmId,
          careEventId: this.nextId('care'),
          workOrderId: order.workOrderId,
          careType: order.careType,
          positionIds: [...order.target.positionIds],
          materials: clone(order.report.materials),
          notes: order.report.notes,
          approvalStatus: specialistApprovalForCare(order.careType),
          approvedBy: null,
          version: 1,
          exampleData: true,
          createdAtLabel: nowLabel(),
        })
      }
    }
    if (action.type === 'CLOSE' && order.careType === 'CHEMICAL') {
      const care = this.careEvents.find((event) => event.workOrderId === order.workOrderId)
      if (care?.approvalStatus === 'PENDING_SPECIALIST') {
        order.status = before
        order.version -= 1
        order.audit = order.audit.slice(1)
        throw new Error('งานสารเคมียัง Pending Specialist ห้ามปิดงาน')
      }
    }

    return Promise.resolve(this.remember(key, order))
  }

  async confirmWorkTarget(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    scannedPositionId: string,
  ): Promise<WorkOrderRecord> {
    const key = this.operationKey(context, `confirm-target:${workOrderId}`, idempotencyKey)
    const prior = this.prior<WorkOrderRecord>(key)
    if (prior) return Promise.resolve(prior)
    const order = this.requireWork(context, workOrderId)
    if (order.assignedUserId !== context.actor.userId) throw new Error('งานนี้ไม่ได้มอบหมายให้ผู้ใช้ปัจจุบัน')
    if (!['ACCEPTED', 'IN_PROGRESS'].includes(order.status)) throw new Error('ต้องรับหรือเริ่มงานก่อนยืนยันต้น')
    if (order.target.kind !== 'TREE') throw new Error('QR confirmation ใช้กับงานรายต้น')
    if (scannedPositionId !== order.target.positionIds[0]) {
      throw new Error('ป้ายที่สแกนไม่ตรงต้นเป้าหมาย ระบบหยุดงานเดิม')
    }
    order.targetConfirmedPositionId = scannedPositionId
    order.version += 1
    order.audit = [
      workEvent(
        this.nextId('workevt'),
        context,
        'WORK_TARGET_CONFIRMED',
        order.status,
        order.status,
        `ยืนยัน Position ${scannedPositionId}`,
        order.version,
      ),
      ...order.audit,
    ]
    return Promise.resolve(this.remember(key, order))
  }

  async uploadWorkPhoto(
    context: WorkMutationContext,
    workOrderId: string,
    photoId: string,
    phase: WorkPhotoEvidence['phase'],
    prepared: PreparedWorkPhotoUpload,
  ): Promise<WorkPhotoEvidence> {
    const order = this.requireWork(context, workOrderId)
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
    if (!photoId.trim()) throw new Error('ต้องระบุ Photo ID')
    const valid = validatePreparedWorkPhotoUpload(prepared, true)
    const storagePath = `mock://organizations/${context.farm.organizationId}/farms/${context.farm.farmId}/workEvidence/${workOrderId}/${photoId}`
    let previewUrl = mockPhotoPlaceholderUrl()
    if (typeof URL.createObjectURL === 'function') {
      try {
        previewUrl = URL.createObjectURL(valid.blob)
      } catch {
        // JSDOM/Node may expose createObjectURL from a different Blob realm.
        // A labelled placeholder preserves the local mock flow without claiming real evidence.
      }
    }
    this.workPhotoUrls.set(storagePath, previewUrl)
    return Promise.resolve({
      photoId,
      phase,
      uploadState: 'UPLOADED',
      storagePath,
      note: valid.metadataStripped
        ? 'EXAMPLE DATA ONLY — ย่อ/WebP และลบ EXIF/GPS แล้ว'
        : 'EXAMPLE DATA ONLY — simulated fallback (ไม่ใช่หลักฐานจากอุปกรณ์จริง)',
    })
  }

  async saveWorkInstructionPhotos(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    photos: readonly WorkPhotoEvidence[],
  ): Promise<WorkOrderRecord> {
    const key = this.operationKey(context, `work-instruction-photos:${workOrderId}`, idempotencyKey)
    const prior = this.prior<WorkOrderRecord>(key)
    if (prior) return Promise.resolve(prior)
    const order = this.requireWork(context, workOrderId)
    order.instructionPhotos = validateWorkInstructionPhotos(order, context, photos)
    order.version += 1
    order.audit = [
      workEvent(
        this.nextId('workevt'), context, 'WORK_INSTRUCTION_PHOTOS_SAVED',
        order.status, order.status, `แนบรูปประกอบใบงาน ${photos.length} รูป`, order.version,
      ),
      ...order.audit,
    ]
    return Promise.resolve(this.remember(key, order))
  }

  getWorkPhotoUrl(
    context: WorkMutationContext,
    workOrderId: string,
    storagePath: string,
  ): Promise<string> {
    this.requireWork(context, workOrderId)
    const expectedPrefixes = [
      `mock://organizations/${context.farm.organizationId}/farms/${context.farm.farmId}/workEvidence/${workOrderId}/`,
      `organizations/${context.farm.organizationId}/farms/${context.farm.farmId}/workEvidence/${workOrderId}/`,
    ]
    if (!expectedPrefixes.some((prefix) => storagePath.startsWith(prefix))) {
      throw new Error('ปฏิเสธเส้นทางรูปที่ไม่ตรง Work Order')
    }
    return Promise.resolve(this.workPhotoUrls.get(storagePath) ?? mockPhotoPlaceholderUrl())
  }

  async saveWorkReport(
    context: WorkMutationContext,
    workOrderId: string,
    idempotencyKey: string,
    input: WorkReportInput,
  ): Promise<WorkOrderRecord> {
    const key = this.operationKey(context, `work-report:${workOrderId}`, idempotencyKey)
    const prior = this.prior<WorkOrderRecord>(key)
    if (prior) return Promise.resolve(prior)
    const order = this.requireWork(context, workOrderId)
    if (order.assignedUserId !== context.actor.userId) throw new Error('งานนี้ไม่ได้มอบหมายให้ผู้ใช้ปัจจุบัน')
    const valid = validateWorkReport(order, input)
    order.report = {
      ...valid,
      reportId: order.report?.reportId ?? this.nextId('report'),
      submittedBy: context.actor.userId,
      submittedAtLabel: nowLabel(),
      version: (order.report?.version ?? 0) + 1,
    }
    order.targetConfirmedPositionId = valid.targetConfirmedPositionId
    order.version += 1
    order.audit = [
      workEvent(
        this.nextId('workevt'),
        context,
        'WORK_REPORT_SAVED',
        order.status,
        order.status,
        'บันทึกรายงานและหลักฐานจำลอง',
        order.version,
      ),
      ...order.audit,
    ]
    return Promise.resolve(this.remember(key, order))
  }

  listCareEvents(context: WorkMutationContext): Promise<readonly CareEventRecord[]> {
    return Promise.resolve(clone(this.careEvents.filter((event) =>
      event.organizationId === context.farm.organizationId && event.farmId === context.farm.farmId,
    )))
  }

  async approveCareEvent(
    context: WorkMutationContext,
    careEventId: string,
    idempotencyKey: string,
  ): Promise<CareEventRecord> {
    const key = this.operationKey(context, `approve-care:${careEventId}`, idempotencyKey)
    const prior = this.prior<CareEventRecord>(key)
    if (prior) return Promise.resolve(prior)
    if (context.farm.role !== 'AGRONOMIST') throw new Error('เฉพาะ Agronomist ที่อนุมัติ treatment ได้')
    const event = this.careEvents.find((candidate) => candidate.careEventId === careEventId)
    if (!event || event.organizationId !== context.farm.organizationId || event.farmId !== context.farm.farmId) {
      throw new Error('ไม่พบ Care Event ในสวนปัจจุบัน')
    }
    if (event.approvalStatus !== 'PENDING_SPECIALIST') throw new Error('Care Event นี้ไม่รอ specialist')
    event.approvalStatus = 'APPROVED'
    event.approvedBy = context.actor.userId
    event.version += 1
    return Promise.resolve(this.remember(key, event))
  }

  listDiseaseIncidents(
    context: WorkMutationContext,
  ): Promise<readonly DiseaseIncidentRecord[]> {
    return Promise.resolve(clone(this.diseaseIncidents.filter((incident) =>
      incident.organizationId === context.farm.organizationId && incident.farmId === context.farm.farmId,
    )))
  }

  async createDiseaseIncident(
    context: WorkMutationContext,
    idempotencyKey: string,
    draft: DiseaseIncidentDraft,
  ): Promise<DiseaseIncidentRecord> {
    const key = this.operationKey(context, 'create-disease', idempotencyKey)
    const prior = this.prior<DiseaseIncidentRecord>(key)
    if (prior) return Promise.resolve(prior)
    const valid = validateDiseaseDraft(context, draft)
    const incident: DiseaseIncidentRecord = {
      ...valid,
      organizationId: context.farm.organizationId,
      farmId: context.farm.farmId,
      incidentId: this.nextId('disease'),
      status: valid.suspectedDiagnosis ? 'AWAITING_DIAGNOSIS' : 'OPEN',
      confirmedDiagnosis: '',
      treatmentPlan: '',
      specialistApprovalStatus: 'PENDING_SPECIALIST',
      outcome: '',
      photos: [],
      treatmentWorkOrderId: null,
      version: 1,
      exampleData: true,
      reportedBy: context.actor.userId,
      createdAtLabel: nowLabel(),
      audit: [diseaseEvent(
        this.nextId('diseaseevt'), context, 'SYMPTOM_OBSERVED',
        valid.observedSymptom, 1,
      )],
    }
    this.diseaseIncidents.unshift(incident)
    return Promise.resolve(this.remember(key, incident))
  }

  async assessDiseaseIncident(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    input: DiseaseAssessmentInput,
  ): Promise<DiseaseIncidentRecord> {
    const key = this.operationKey(context, `assess-disease:${incidentId}`, idempotencyKey)
    const prior = this.prior<DiseaseIncidentRecord>(key)
    if (prior) return Promise.resolve(prior)
    const valid = validateDiseaseAssessment(context, input)
    const incident = this.requireDisease(context, incidentId)
    Object.assign(incident, valid, {
      status: 'TREATING' as const,
      specialistApprovalStatus: 'APPROVED' as const,
      version: incident.version + 1,
    })
    incident.audit = [
      diseaseEvent(
        this.nextId('diseaseevt'), context, 'ASSESSMENT_RECORDED',
        'Agronomist ยืนยัน diagnosis/treatment จำลอง', incident.version,
      ),
      ...incident.audit,
    ]
    return Promise.resolve(this.remember(key, incident))
  }

  async followUpDiseaseIncident(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    input: DiseaseFollowUpInput,
  ): Promise<DiseaseIncidentRecord> {
    const key = this.operationKey(context, `followup-disease:${incidentId}`, idempotencyKey)
    const prior = this.prior<DiseaseIncidentRecord>(key)
    if (prior) return Promise.resolve(prior)
    const valid = validateDiseaseFollowUp(context, input)
    const incident = this.requireDisease(context, incidentId)
    incident.outcome = valid.outcome
    incident.followUpDate = valid.nextFollowUpDate
    incident.status = valid.closeIncident ? 'CLOSED' : 'FOLLOW_UP'
    incident.version += 1
    incident.audit = [
      diseaseEvent(
        this.nextId('diseaseevt'),
        context,
        valid.closeIncident ? 'INCIDENT_CLOSED' : 'FOLLOW_UP_RECORDED',
        valid.outcome,
        incident.version,
      ),
      ...incident.audit,
    ]
    return Promise.resolve(this.remember(key, incident))
  }

  async addDiseasePhotoMock(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    draft: DiseasePhotoMockDraft,
  ): Promise<DiseaseIncidentRecord> {
    const key = this.operationKey(context, `disease-photo-add:${incidentId}`, idempotencyKey)
    const prior = this.prior<DiseaseIncidentRecord>(key)
    if (prior) return Promise.resolve(prior)
    const incident = this.requireDisease(context, incidentId)
    const valid = validateDiseasePhotoMockDraft(context, incident, draft)
    const photo: DiseasePhotoMockEvidence = {
      ...valid,
      photoId: this.nextId('diseasephoto'),
      organizationId: incident.organizationId,
      farmId: incident.farmId,
      incidentId: incident.incidentId,
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
      createdAtLabel: nowLabel(),
    }
    incident.photos = [photo, ...incident.photos]
    incident.version += 1
    incident.audit = [
      diseaseEvent(
        this.nextId('diseaseevt'),
        context,
        'PHOTO_PLACEHOLDER_ADDED',
        `${photo.classification} · ${photo.placeholderKind} · ${photo.mimeType} · ${photo.sizeBytes} bytes`,
        incident.version,
      ),
      ...incident.audit,
    ]
    return Promise.resolve(this.remember(key, incident))
  }

  async advanceDiseasePhotoMock(
    context: WorkMutationContext,
    incidentId: string,
    photoId: string,
    idempotencyKey: string,
    action: DiseasePhotoAction,
  ): Promise<DiseaseIncidentRecord> {
    const key = this.operationKey(context, `disease-photo:${incidentId}:${photoId}:${action}`, idempotencyKey)
    const prior = this.prior<DiseaseIncidentRecord>(key)
    if (prior) return Promise.resolve(prior)
    if (!canAddDiseasePhoto(context.farm.role)) throw new Error('ไม่มีสิทธิ์เปลี่ยนสถานะภาพประกอบเคสโรค')
    const incident = this.requireDisease(context, incidentId)
    if (incident.status === 'CLOSED') throw new Error('เคสที่ปิดแล้วเปลี่ยนสถานะภาพไม่ได้')
    const photo = incident.photos.find((candidate) => candidate.photoId === photoId)
    if (!photo) throw new Error('ไม่พบภาพจำลองใน Disease Incident ปัจจุบัน')
    Object.assign(photo, nextDiseasePhotoState(photo, action))
    incident.version += 1
    const eventType: Record<DiseasePhotoAction, DiseaseAuditEvent['eventType']> = {
      START_UPLOAD: 'PHOTO_UPLOAD_STARTED',
      MARK_UPLOADED: 'PHOTO_UPLOAD_COMPLETED',
      MARK_FAILED: 'PHOTO_UPLOAD_FAILED',
      RETRY: 'PHOTO_UPLOAD_RETRIED',
    }
    incident.audit = [
      diseaseEvent(
        this.nextId('diseaseevt'),
        context,
        eventType[action],
        `${photo.photoId} → ${photo.uploadState} · Local DRY_RUN`,
        incident.version,
      ),
      ...incident.audit,
    ]
    return Promise.resolve(this.remember(key, incident))
  }

  async createTreatmentWorkOrder(
    context: WorkMutationContext,
    incidentId: string,
    idempotencyKey: string,
    input: TreatmentWorkOrderInput,
  ): Promise<TreatmentWorkOrderResult> {
    const key = this.operationKey(context, `disease-treatment-work:${incidentId}`, idempotencyKey)
    const prior = this.prior<TreatmentWorkOrderResult>(key)
    if (prior) return Promise.resolve(prior)
    const incident = this.requireDisease(context, incidentId)
    const valid = validateTreatmentWorkOrderInput(context, incident, input)
    const tree = this.treePositions.find((candidate) =>
      candidate.organizationId === context.farm.organizationId &&
      candidate.farmId === context.farm.farmId &&
      candidate.positionId === valid.positionId,
    )
    if (!tree || tree.zoneCode !== valid.zoneCode || tree.rowCode !== valid.rowCode) {
      throw new Error('Wrong-Tree: Zone/Row/Position ไม่ตรงทะเบียนต้นของสวนปัจจุบัน')
    }
    const workOrderId = this.nextId('work')
    const workVersion = 1
    const order: WorkOrderRecord = {
      title: `งานรักษาจากเคส ${incident.incidentId}`,
      description: `SIMULATED/TEST ONLY — ${incident.treatmentPlan} · อ้างอิงอาการ: ${incident.observedSymptom}`,
      category: 'DISEASE_FOLLOW_UP',
      careType: null,
      priority: ['HIGH', 'CRITICAL'].includes(incident.severity) ? 'URGENT' : 'NORMAL',
      target: {
        kind: 'TREE',
        zoneCode: valid.zoneCode,
        rowCode: valid.rowCode,
        positionIds: [valid.positionId],
      },
      dueDate: valid.dueDate,
      assignedUserId: valid.assignedUserId,
      organizationId: incident.organizationId,
      farmId: incident.farmId,
      workOrderId,
      status: 'DRAFT',
      isPaused: false,
      instructionPhotos: [],
      report: null,
      targetConfirmedPositionId: null,
      rejectionReason: '',
      reworkReason: '',
      sourceDiseaseIncidentId: incident.incidentId,
      version: workVersion,
      exampleData: true,
      createdBy: context.actor.userId,
      createdAtLabel: nowLabel(),
      audit: [workEvent(
        this.nextId('workevt'),
        context,
        'WORK_CREATED',
        'DRAFT',
        'DRAFT',
        `สร้างจาก Disease Incident ${incident.incidentId}`,
        workVersion,
      )],
    }
    incident.treatmentWorkOrderId = workOrderId
    incident.version += 1
    incident.audit = [
      diseaseEvent(
        this.nextId('diseaseevt'),
        context,
        'TREATMENT_WORK_CREATED',
        `เชื่อม Treatment Work Order ${workOrderId}`,
        incident.version,
      ),
      ...incident.audit,
    ]
    this.workOrders.unshift(order)
    return Promise.resolve(this.remember(key, {
      incident,
      workOrder: order,
    }))
  }

  private requireDisease(
    context: WorkMutationContext,
    incidentId: string,
  ): DiseaseIncidentRecord {
    const incident = this.diseaseIncidents.find((candidate) => candidate.incidentId === incidentId)
    if (!incident || incident.organizationId !== context.farm.organizationId || incident.farmId !== context.farm.farmId) {
      throw new Error('ไม่พบ Disease Incident ในสวนปัจจุบัน')
    }
    return incident
  }

  async listNotifications(context: WorkMutationContext): Promise<readonly InAppNotification[]> {
    const notifications: InAppNotification[] = []
    const [visibleWorkOrders, visibleIncidents] = await Promise.all([
      this.listWorkOrders(context),
      this.listDiseaseIncidents(context),
    ])
    visibleWorkOrders.forEach((order) => {
      if (order.status === 'REWORK') {
        notifications.push({
          notificationId: `notification_rework_${order.workOrderId}`,
          organizationId: order.organizationId,
          farmId: order.farmId,
          kind: 'REWORK',
          title: 'งานที่ต้องแก้',
          description: order.reworkReason,
          targetPath: `/work/${order.workOrderId}`,
          priority: 'URGENT',
          exampleData: true,
        })
      } else if (order.priority === 'URGENT' && !['VERIFIED', 'REJECTED', 'CLOSED'].includes(order.status)) {
        notifications.push({
          notificationId: `notification_urgent_${order.workOrderId}`,
          organizationId: order.organizationId,
          farmId: order.farmId,
          kind: 'URGENT_WORK',
          title: 'งานเร่งด่วน',
          description: order.title,
          targetPath: `/work/${order.workOrderId}`,
          priority: 'URGENT',
          exampleData: true,
        })
      }
    })
    visibleIncidents.forEach((incident) => {
      if (incident.status !== 'CLOSED' && (incident.severity === 'HIGH' || incident.severity === 'CRITICAL')) {
        notifications.push({
          notificationId: `notification_disease_${incident.incidentId}`,
          organizationId: incident.organizationId,
          farmId: incident.farmId,
          kind: 'DISEASE_FOLLOW_UP',
          title: 'ติดตามอาการเร่งด่วน',
          description: incident.observedSymptom,
          targetPath: `/disease/${incident.incidentId}`,
          priority: 'URGENT',
          exampleData: true,
        })
      }
    })
    return clone(notifications)
  }
}
