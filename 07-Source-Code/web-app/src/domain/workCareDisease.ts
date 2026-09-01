import type {
  AuthenticatedIdentity,
  CanonicalRole,
  FarmAccess,
} from './farm'

export const workOrderStatuses = [
  'DRAFT',
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'SUBMITTED',
  'VERIFIED',
  'REJECTED',
  'REWORK',
  'CLOSED',
] as const

export const workTargetKinds = ['TREE', 'ROW', 'ZONE', 'TREE_SET'] as const
export const workPriorities = ['NORMAL', 'URGENT'] as const
export const workCategories = ['GENERAL', 'CARE', 'DISEASE_FOLLOW_UP'] as const
export const careEventTypes = [
  'FERTILIZER',
  'CHEMICAL',
  'WATER',
  'PRUNING',
  'INSPECTION',
] as const
export const diseaseSeverities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
export const diseaseStatuses = [
  'OPEN',
  'AWAITING_DIAGNOSIS',
  'TREATING',
  'FOLLOW_UP',
  'CLOSED',
] as const

export type WorkOrderStatus = (typeof workOrderStatuses)[number]
export type WorkTargetKind = (typeof workTargetKinds)[number]
export type WorkPriority = (typeof workPriorities)[number]
export type WorkCategory = (typeof workCategories)[number]
export type CareEventType = (typeof careEventTypes)[number]
export type DiseaseSeverity = (typeof diseaseSeverities)[number]
export type DiseaseStatus = (typeof diseaseStatuses)[number]
export type PhotoUploadState = 'UPLOADED' | 'PENDING' | 'FAILED'
export type WorkPhotoPhase = 'INSTRUCTION' | 'BEFORE' | 'AFTER'
export type TreeCompletionStatus = 'SUCCESS' | 'EXCEPTION'
export type SpecialistApprovalStatus =
  | 'NOT_REQUIRED'
  | 'PENDING_SPECIALIST'
  | 'APPROVED'

export const workStatusLabels: Record<WorkOrderStatus, string> = {
  DRAFT: 'ร่าง',
  ASSIGNED: 'มอบหมายแล้ว',
  ACCEPTED: 'รับงาน',
  IN_PROGRESS: 'กำลังทำ',
  SUBMITTED: 'ส่งตรวจ',
  VERIFIED: 'ตรวจรับแล้ว',
  REJECTED: 'ไม่รับงาน',
  REWORK: 'ให้แก้',
  CLOSED: 'ปิดงาน',
}

export const careTypeLabels: Record<CareEventType, string> = {
  FERTILIZER: 'ใส่ปุ๋ย',
  CHEMICAL: 'ใช้สารเคมี',
  WATER: 'ให้น้ำ',
  PRUNING: 'ตัดแต่ง',
  INSPECTION: 'ตรวจต้น',
}

export const diseaseSeverityLabels: Record<DiseaseSeverity, string> = {
  LOW: 'ต่ำ',
  MEDIUM: 'ปานกลาง',
  HIGH: 'สูง',
  CRITICAL: 'วิกฤต',
}

export interface WorkMutationContext {
  actor: AuthenticatedIdentity
  farm: FarmAccess
}

export interface WorkTarget {
  kind: WorkTargetKind
  zoneCode: string
  zoneCodes?: readonly string[]
  rowCode: string | null
  positionIds: readonly string[]
}

export interface WorkOrderDraft {
  title: string
  description: string
  category: WorkCategory
  careType: CareEventType | null
  priority: WorkPriority
  target: WorkTarget
  dueDate: string
  assignedUserId: string | null
}

export interface WorkMaterialActual {
  materialName: string
  quantity: number
  unit: string
}

export interface WorkPhotoEvidence {
  photoId: string
  phase: WorkPhotoPhase
  uploadState: PhotoUploadState
  storagePath: string
  note: string
}

export const workPhotoUploadPolicy = Object.freeze({
  processingVersion: 'work-photo-v1',
  sourceMimeTypes: [
    'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif',
  ] as const,
  outputMimeType: 'image/webp' as const,
  maxSourceBytes: 25 * 1024 * 1024,
  maxOutputBytes: 5 * 1024 * 1024,
  maxDimensionPixels: 1600,
  initialQuality: 0.82,
})

export interface PreparedWorkPhotoUpload {
  blob: Blob
  processingVersion: typeof workPhotoUploadPolicy.processingVersion
  processingMode: 'CANVAS_REENCODED' | 'SIMULATED_TEST_FALLBACK'
  sourceMimeType: string
  outputMimeType: string
  originalSizeBytes: number
  preparedSizeBytes: number
  originalWidth: number | null
  originalHeight: number | null
  preparedWidth: number | null
  preparedHeight: number | null
  metadataStripped: boolean
}

export function validatePreparedWorkPhotoUpload(
  prepared: PreparedWorkPhotoUpload,
  allowSimulatedTestFallback: boolean,
): PreparedWorkPhotoUpload {
  if (prepared.processingVersion !== workPhotoUploadPolicy.processingVersion) {
    throw new Error('เวอร์ชันการเตรียมรูปไม่ถูกต้อง')
  }
  if (!workPhotoUploadPolicy.sourceMimeTypes.includes(
    prepared.sourceMimeType as (typeof workPhotoUploadPolicy.sourceMimeTypes)[number],
  )) {
    throw new Error('รองรับภาพต้นฉบับ JPEG, PNG, WebP, HEIC หรือ HEIF เท่านั้น')
  }
  if (prepared.originalSizeBytes <= 0 || prepared.originalSizeBytes > workPhotoUploadPolicy.maxSourceBytes) {
    throw new Error('ภาพต้นฉบับต้องไม่เกิน 25 MB')
  }
  if (prepared.preparedSizeBytes !== prepared.blob.size || prepared.preparedSizeBytes <= 0) {
    throw new Error('ขนาดภาพที่เตรียมไม่ถูกต้อง')
  }
  if (prepared.preparedSizeBytes > workPhotoUploadPolicy.maxOutputBytes) {
    throw new Error('ภาพหลังบีบอัดต้องไม่เกิน 5 MB')
  }
  if (prepared.processingMode === 'CANVAS_REENCODED') {
    if (!prepared.metadataStripped || prepared.outputMimeType !== workPhotoUploadPolicy.outputMimeType) {
      throw new Error('ภาพต้อง re-encode เป็น WebP และลบ metadata ก่อนอัปโหลด')
    }
    if (
      prepared.preparedWidth === null || prepared.preparedHeight === null ||
      prepared.preparedWidth <= 0 || prepared.preparedHeight <= 0 ||
      Math.max(prepared.preparedWidth, prepared.preparedHeight) > workPhotoUploadPolicy.maxDimensionPixels
    ) {
      throw new Error('ขนาดมิติภาพหลังเตรียมไม่ถูกต้อง')
    }
  } else if (!allowSimulatedTestFallback) {
    throw new Error('อุปกรณ์นี้ไม่สามารถย่อและลบ metadata ของรูปได้ ห้ามอัปโหลด')
  }
  return { ...prepared, blob: prepared.blob }
}

export interface PerTreeCompletion {
  positionId: string
  status: TreeCompletionStatus
  exceptionReason: string
}

export interface WorkReportInput {
  notes: string
  targetConfirmedPositionId: string | null
  materials: readonly WorkMaterialActual[]
  photos: readonly WorkPhotoEvidence[]
  completions: readonly PerTreeCompletion[]
}

export interface WorkReport extends WorkReportInput {
  reportId: string
  submittedBy: string
  submittedAtLabel: string
  version: number
}

export type WorkAuditEventType =
  | 'WORK_CREATED'
  | 'WORK_INSTRUCTION_PHOTOS_SAVED'
  | 'WORK_ASSIGNED'
  | 'WORK_ACCEPTED'
  | 'WORK_STARTED'
  | 'WORK_PAUSED'
  | 'WORK_RESUMED'
  | 'WORK_TARGET_CONFIRMED'
  | 'WORK_REPORT_SAVED'
  | 'WORK_SUBMITTED'
  | 'WORK_VERIFIED'
  | 'WORK_REJECTED'
  | 'WORK_REWORK_REQUESTED'
  | 'WORK_CLOSED'

export interface WorkAuditEvent {
  eventId: string
  eventType: WorkAuditEventType
  actorUserId: string
  actorDisplayName: string
  beforeStatus: WorkOrderStatus
  afterStatus: WorkOrderStatus
  reason: string
  createdAtLabel: string
  workVersion: number
}

export interface WorkOrderRecord extends WorkOrderDraft {
  organizationId: string
  farmId: string
  workOrderId: string
  status: WorkOrderStatus
  isPaused: boolean
  instructionPhotos: readonly WorkPhotoEvidence[]
  report: WorkReport | null
  targetConfirmedPositionId: string | null
  rejectionReason: string
  reworkReason: string
  sourceDiseaseIncidentId: string | null
  version: number
  exampleData: true
  createdBy: string
  createdAtLabel: string
  audit: readonly WorkAuditEvent[]
}

export type WorkAction =
  | { type: 'ASSIGN'; assignedUserId: string }
  | { type: 'ACCEPT' }
  | { type: 'START' }
  | { type: 'PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SUBMIT' }
  | { type: 'VERIFY' }
  | { type: 'REJECT'; reason: string }
  | { type: 'REQUEST_REWORK'; reason: string }
  | { type: 'CLOSE' }

export interface CareEventRecord {
  organizationId: string
  farmId: string
  careEventId: string
  workOrderId: string
  careType: CareEventType
  positionIds: readonly string[]
  materials: readonly WorkMaterialActual[]
  notes: string
  approvalStatus: SpecialistApprovalStatus
  approvedBy: string | null
  version: number
  exampleData: true
  createdAtLabel: string
}

export interface DiseaseIncidentDraft {
  positionId: string
  observedSymptom: string
  severity: DiseaseSeverity
  suspectedDiagnosis: string
  followUpDate: string
}

export interface DiseaseAssessmentInput {
  suspectedDiagnosis: string
  confirmedDiagnosis: string
  treatmentPlan: string
  followUpDate: string
}

export interface DiseaseFollowUpInput {
  outcome: string
  nextFollowUpDate: string
  closeIncident: boolean
}

export const diseasePhotoMimeTypes = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const
export const diseasePhotoPlaceholderKinds = [
  'LEAF_SPOT',
  'TRUNK_AREA',
  'CANOPY',
] as const
export const diseasePhotoUploadStates = [
  'PENDING',
  'UPLOADING',
  'UPLOADED',
  'FAILED',
] as const

export type DiseasePhotoMimeType = (typeof diseasePhotoMimeTypes)[number]
export type DiseasePhotoPlaceholderKind = (typeof diseasePhotoPlaceholderKinds)[number]
export type DiseasePhotoUploadState = (typeof diseasePhotoUploadStates)[number]
export type DiseasePhotoAction =
  | 'START_UPLOAD'
  | 'MARK_UPLOADED'
  | 'MARK_FAILED'
  | 'RETRY'

export interface DiseasePhotoMockDraft {
  placeholderKind: DiseasePhotoPlaceholderKind
  mimeType: DiseasePhotoMimeType
  sizeBytes: number
  note: string
}

export interface DiseasePhotoMockEvidence extends DiseasePhotoMockDraft {
  photoId: string
  organizationId: string
  farmId: string
  incidentId: string
  positionId: string
  source: 'SYNTHETIC_PLACEHOLDER'
  classification: 'SIMULATED/TEST ONLY'
  uploadState: DiseasePhotoUploadState
  retryCount: number
  lastError: string
  containsExifOrGps: false
  externalStorage: false
  lifecycleMode: 'DRY_RUN'
  version: number
  createdBy: string
  createdAtLabel: string
}

export interface TreatmentWorkOrderInput {
  positionId: string
  zoneCode: string
  rowCode: string
  assignedUserId: string | null
  dueDate: string
}

export interface TreatmentWorkOrderResult {
  incident: DiseaseIncidentRecord
  workOrder: WorkOrderRecord
}

export interface DiseaseAuditEvent {
  eventId: string
  eventType:
    | 'SYMPTOM_OBSERVED'
    | 'ASSESSMENT_RECORDED'
    | 'FOLLOW_UP_RECORDED'
    | 'INCIDENT_CLOSED'
    | 'PHOTO_PLACEHOLDER_ADDED'
    | 'PHOTO_UPLOAD_STARTED'
    | 'PHOTO_UPLOAD_COMPLETED'
    | 'PHOTO_UPLOAD_FAILED'
    | 'PHOTO_UPLOAD_RETRIED'
    | 'TREATMENT_WORK_CREATED'
  actorUserId: string
  actorDisplayName: string
  description: string
  createdAtLabel: string
  incidentVersion: number
}

export interface DiseaseIncidentRecord extends DiseaseIncidentDraft {
  organizationId: string
  farmId: string
  incidentId: string
  status: DiseaseStatus
  confirmedDiagnosis: string
  treatmentPlan: string
  specialistApprovalStatus: SpecialistApprovalStatus
  outcome: string
  photos: readonly DiseasePhotoMockEvidence[]
  treatmentWorkOrderId: string | null
  version: number
  exampleData: true
  reportedBy: string
  createdAtLabel: string
  audit: readonly DiseaseAuditEvent[]
}

export interface InAppNotification {
  notificationId: string
  organizationId: string
  farmId: string
  kind: 'URGENT_WORK' | 'REWORK' | 'DISEASE_FOLLOW_UP'
  title: string
  description: string
  targetPath: string
  priority: WorkPriority
  exampleData: true
}

const managementRoles: readonly CanonicalRole[] = ['ORG_OWNER', 'FARM_MANAGER']
const operationalRoles: readonly CanonicalRole[] = [
  'ORG_OWNER',
  'FARM_MANAGER',
  'AGRONOMIST',
  'WORKER',
]

function requiredText(value: string, label: string): string {
  const normalized = value.trim()
  if (!normalized) throw new Error(`ต้องระบุ${label}`)
  return normalized
}

function validIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value)
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}

export function createOpaqueRecordId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll('-', '')}`
}

export function validateWorkTarget(target: WorkTarget): WorkTarget {
  if (!/^Z\d{2,}$/u.test(target.zoneCode)) throw new Error('Zone code ไม่ถูกต้อง')
  const zoneCodes = [...new Set(target.zoneCodes ?? [target.zoneCode])]
  if (zoneCodes.length === 0 || zoneCodes.some((zoneCode) => !/^Z\d{2,}$/u.test(zoneCode))) {
    throw new Error('รายการ Zone code ของเป้าหมายไม่ถูกต้อง')
  }
  if (!zoneCodes.includes(target.zoneCode)) throw new Error('Zone หลักต้องอยู่ในรายการ Zone เป้าหมาย')
  if (!unique(target.positionIds)) throw new Error('Target มี Position ซ้ำ')
  if (target.positionIds.some((id) => !/^pos_[A-Za-z0-9_-]{12,}$/u.test(id))) {
    throw new Error('Target ต้องใช้ opaque Position ID')
  }
  if (target.kind === 'TREE' && target.positionIds.length !== 1) {
    throw new Error('งานรายต้นต้องมี Position เดียว')
  }
  if (target.kind !== 'TREE_SET' && zoneCodes.length !== 1) {
    throw new Error('งานข้ามโซนต้องใช้ประเภทชุดต้น')
  }
  if (target.kind === 'TREE_SET' && target.positionIds.length < 2) {
    throw new Error('งานชุดต้นต้องมีอย่างน้อย 2 Position')
  }
  if (target.kind === 'ROW') {
    if (!target.rowCode || !/^R\d{2,}$/u.test(target.rowCode)) {
      throw new Error('งานระดับแถวต้องมี Row code')
    }
    if (target.positionIds.length === 0) throw new Error('งานระดับแถวต้อง snapshot ต้นเป้าหมาย')
  }
  if (target.kind === 'ZONE' && target.positionIds.length === 0) {
    throw new Error('งานระดับโซนต้อง snapshot ต้นเป้าหมาย')
  }
  return structuredClone({ ...target, zoneCodes })
}

export function validateWorkDraft(draft: WorkOrderDraft): WorkOrderDraft {
  const target = validateWorkTarget(draft.target)
  if (!validIsoDate(draft.dueDate)) throw new Error('Due date ต้องเป็น YYYY-MM-DD')
  if (draft.category === 'CARE' && !draft.careType) {
    throw new Error('งานดูแลต้องระบุ Care type')
  }
  if (draft.category !== 'CARE' && draft.careType) {
    throw new Error('Care type ใช้ได้เฉพาะงานดูแล')
  }
  return {
    ...draft,
    title: requiredText(draft.title, 'ชื่องาน'),
    description: draft.description.trim(),
    assignedUserId: draft.assignedUserId?.trim() || null,
    target,
  }
}

export function canCreateWork(role: CanonicalRole, category: WorkCategory): boolean {
  return managementRoles.includes(role) || (role === 'AGRONOMIST' && category !== 'GENERAL')
}

export function canVerifyWork(role: CanonicalRole, category: WorkCategory): boolean {
  return managementRoles.includes(role) || (role === 'AGRONOMIST' && category !== 'GENERAL')
}

export function validateWorkInstructionPhotos(
  order: WorkOrderRecord,
  context: WorkMutationContext,
  photos: readonly WorkPhotoEvidence[],
): readonly WorkPhotoEvidence[] {
  requireActiveFarm(context.farm)
  if (
    order.organizationId !== context.farm.organizationId ||
    order.farmId !== context.farm.farmId
  ) {
    throw new Error('ปฏิเสธการแนบรูปใบงานข้ามสวน')
  }
  if (!canCreateWork(context.farm.role, order.category)) {
    throw new Error('ไม่มีสิทธิ์แนบรูปประกอบใบงาน')
  }
  if (order.createdBy !== context.actor.userId) {
    throw new Error('เฉพาะผู้สร้างใบงานเท่านั้นที่แนบรูปประกอบได้')
  }
  if (order.status !== 'DRAFT') {
    throw new Error('แนบรูปประกอบได้เฉพาะตอนใบงานยังเป็นร่าง')
  }
  if (order.instructionPhotos.length > 0) {
    throw new Error('ใบงานนี้บันทึกรูปประกอบแล้ว ห้ามเขียนทับแบบเงียบ ๆ')
  }
  if (photos.length === 0 || photos.length > 3) {
    throw new Error('รูปประกอบใบงานต้องมี 1–3 รูป')
  }
  if (!unique(photos.map((photo) => photo.photoId))) {
    throw new Error('รูปประกอบใบงานมี Photo ID ซ้ำ')
  }
  if (!unique(photos.map((photo) => photo.storagePath))) {
    throw new Error('รูปประกอบใบงานมี Storage path ซ้ำ')
  }
  photos.forEach((photo) => {
    if (photo.phase !== 'INSTRUCTION') throw new Error('รูปประกอบใบงานต้องใช้ phase INSTRUCTION')
    if (photo.uploadState !== 'UPLOADED') {
      throw new Error('รูปประกอบใบงานบางรายการยังอัปโหลดไม่สำเร็จ')
    }
    requiredText(photo.photoId, 'Photo ID')
    requiredText(photo.storagePath, 'Storage path')
  })
  return structuredClone(photos)
}

function requireActiveFarm(farm: FarmAccess): void {
  if (farm.farmStatus !== 'ACTIVE' || farm.membershipStatus !== 'ACTIVE') {
    throw new Error('สวนหรือ membership ไม่อยู่ในสถานะที่เขียนข้อมูลได้')
  }
}

function requireAssignedActor(order: WorkOrderRecord, context: WorkMutationContext): void {
  if (!operationalRoles.includes(context.farm.role)) {
    throw new Error('บทบาทนี้ไม่มีสิทธิ์ปฏิบัติงาน')
  }
  if (order.assignedUserId !== context.actor.userId) {
    throw new Error('งานนี้ไม่ได้มอบหมายให้ผู้ใช้ปัจจุบัน')
  }
}

export function assertWorkAction(
  order: WorkOrderRecord,
  context: WorkMutationContext,
  action: WorkAction,
): WorkOrderStatus {
  requireActiveFarm(context.farm)
  if (
    order.organizationId !== context.farm.organizationId ||
    order.farmId !== context.farm.farmId
  ) {
    throw new Error('ปฏิเสธการทำงานข้ามสวน')
  }

  switch (action.type) {
    case 'ASSIGN':
      if (!canCreateWork(context.farm.role, order.category)) throw new Error('ไม่มีสิทธิ์มอบหมายงาน')
      if (order.status !== 'DRAFT') throw new Error('มอบหมายได้จากสถานะร่างเท่านั้น')
      requiredText(action.assignedUserId, 'ผู้รับผิดชอบ')
      return 'ASSIGNED'
    case 'ACCEPT':
      requireAssignedActor(order, context)
      if (order.status !== 'ASSIGNED') throw new Error('รับได้เฉพาะงานที่มอบหมายแล้ว')
      return 'ACCEPTED'
    case 'START':
      requireAssignedActor(order, context)
      if (!['ACCEPTED', 'REWORK'].includes(order.status)) {
        throw new Error('เริ่มได้จากงานที่รับแล้วหรือให้แก้เท่านั้น')
      }
      return 'IN_PROGRESS'
    case 'PAUSE':
      requireAssignedActor(order, context)
      if (order.status !== 'IN_PROGRESS' || order.isPaused) throw new Error('พักได้เฉพาะงานที่กำลังทำ')
      return 'IN_PROGRESS'
    case 'RESUME':
      requireAssignedActor(order, context)
      if (order.status !== 'IN_PROGRESS' || !order.isPaused) throw new Error('ทำต่อได้เฉพาะงานที่พักอยู่')
      return 'IN_PROGRESS'
    case 'SUBMIT':
      requireAssignedActor(order, context)
      if (order.status !== 'IN_PROGRESS' || order.isPaused) throw new Error('ส่งตรวจได้เฉพาะงานที่กำลังทำและไม่พัก')
      if (!order.report) throw new Error('ต้องบันทึกรายงานก่อนส่งตรวจ')
      return 'SUBMITTED'
    case 'VERIFY':
      if (!canVerifyWork(context.farm.role, order.category)) throw new Error('ไม่มีสิทธิ์ตรวจรับงาน')
      if (order.status !== 'SUBMITTED') throw new Error('ตรวจรับได้เฉพาะงานที่ส่งตรวจ')
      return 'VERIFIED'
    case 'REJECT':
      if (!canVerifyWork(context.farm.role, order.category)) throw new Error('ไม่มีสิทธิ์ปฏิเสธงาน')
      if (order.status !== 'SUBMITTED') throw new Error('ปฏิเสธได้เฉพาะงานที่ส่งตรวจ')
      requiredText(action.reason, 'เหตุผลปฏิเสธ')
      return 'REJECTED'
    case 'REQUEST_REWORK':
      if (!canVerifyWork(context.farm.role, order.category)) throw new Error('ไม่มีสิทธิ์ให้แก้งาน')
      if (order.status !== 'SUBMITTED') throw new Error('ให้แก้ได้เฉพาะงานที่ส่งตรวจ')
      requiredText(action.reason, 'เหตุผลให้แก้')
      return 'REWORK'
    case 'CLOSE':
      if (!canVerifyWork(context.farm.role, order.category)) throw new Error('ไม่มีสิทธิ์ปิดงาน')
      if (!['VERIFIED', 'REJECTED'].includes(order.status)) {
        throw new Error('ปิดได้เฉพาะงานที่ตรวจรับหรือปฏิเสธแล้ว')
      }
      return 'CLOSED'
  }
}

export function validateWorkReport(
  order: WorkOrderRecord,
  input: WorkReportInput,
): WorkReportInput {
  if (order.status !== 'IN_PROGRESS') throw new Error('บันทึกรายงานได้เฉพาะงานที่กำลังทำ')
  if (order.isPaused) throw new Error('ต้องทำงานต่อก่อนบันทึกรายงาน')

  if (
    order.target.kind === 'TREE' &&
    input.targetConfirmedPositionId !== order.target.positionIds[0]
  ) {
    throw new Error('ต้องยืนยัน QR/รหัสของต้นเป้าหมายให้ตรงก่อนส่งรายงาน')
  }

  const completionIds = input.completions.map((item) => item.positionId)
  if (!unique(completionIds)) throw new Error('ผลรายต้นมี Position ซ้ำ')
  if (
    completionIds.length !== order.target.positionIds.length ||
    order.target.positionIds.some((id) => !completionIds.includes(id))
  ) {
    throw new Error('ต้องบันทึกผลครบทุกต้นใน target snapshot')
  }
  input.completions.forEach((item) => {
    if (item.status === 'EXCEPTION') requiredText(item.exceptionReason, 'เหตุผล exception รายต้น')
  })

  input.materials.forEach((material) => {
    requiredText(material.materialName, 'ชื่อวัสดุ')
    requiredText(material.unit, 'หน่วยวัสดุ')
    if (!Number.isFinite(material.quantity) || material.quantity <= 0) {
      throw new Error('ปริมาณวัสดุต้องมากกว่า 0')
    }
  })

  if (input.photos.some((photo) => photo.uploadState !== 'UPLOADED')) {
    throw new Error('ภาพบางรายการยังอัปโหลดไม่สำเร็จ ห้ามส่งรายงานบางส่วน')
  }
  if (!input.photos.some((photo) => photo.phase === 'BEFORE')) {
    throw new Error('ต้องมีภาพก่อนทำงานอย่างน้อย 1 ภาพ')
  }
  if (!input.photos.some((photo) => photo.phase === 'AFTER')) {
    throw new Error('ต้องมีภาพหลังทำงานอย่างน้อย 1 ภาพ')
  }
  if (input.photos.some((photo) => photo.phase === 'INSTRUCTION')) {
    throw new Error('รูปประกอบใบงานห้ามปะปนกับรูปหลักฐานส่งงาน')
  }
  if (input.photos.length > 6) {
    throw new Error('รูปหลักฐานส่งงานต้องไม่เกิน 6 รูป')
  }
  if (!unique(input.photos.map((photo) => photo.photoId))) {
    throw new Error('Photo ID ของรูปหลักฐานต้องไม่ซ้ำ')
  }
  if (!unique(input.photos.map((photo) => photo.storagePath))) {
    throw new Error('Storage path ของรูปหลักฐานต้องไม่ซ้ำ')
  }
  input.photos.forEach((photo) => {
    requiredText(photo.photoId, 'Photo ID')
    requiredText(photo.storagePath, 'Storage path')
  })

  const orderedPhotos = [...input.photos].sort((left, right) => {
    const rank = { BEFORE: 0, AFTER: 1, INSTRUCTION: 2 } as const
    return rank[left.phase] - rank[right.phase]
  })

  return structuredClone({
    ...input,
    notes: input.notes.trim(),
    photos: orderedPhotos,
  })
}

export function specialistApprovalForCare(type: CareEventType): SpecialistApprovalStatus {
  return type === 'CHEMICAL' ? 'PENDING_SPECIALIST' : 'NOT_REQUIRED'
}

export function canObserveDisease(role: CanonicalRole): boolean {
  return operationalRoles.includes(role)
}

export function canAssessDisease(role: CanonicalRole): boolean {
  return role === 'AGRONOMIST'
}

export function canAddDiseasePhoto(role: CanonicalRole): boolean {
  return operationalRoles.includes(role)
}

export const diseasePhotoMockPolicy = Object.freeze({
  maxBytes: 5 * 1024 * 1024,
  maxPhotosPerIncident: 6,
  maxRetryCount: 3,
  lifecycleMode: 'DRY_RUN' as const,
})

export function validateDiseasePhotoMockDraft(
  context: WorkMutationContext,
  incident: DiseaseIncidentRecord,
  draft: DiseasePhotoMockDraft,
): DiseasePhotoMockDraft {
  requireActiveFarm(context.farm)
  if (!canAddDiseasePhoto(context.farm.role)) throw new Error('ไม่มีสิทธิ์เพิ่มภาพประกอบเคสโรค')
  if (
    incident.organizationId !== context.farm.organizationId ||
    incident.farmId !== context.farm.farmId
  ) {
    throw new Error('ปฏิเสธการเพิ่มภาพ Disease Incident ข้ามสวน')
  }
  if (incident.status === 'CLOSED') throw new Error('เคสที่ปิดแล้วเพิ่มภาพไม่ได้')
  if (incident.photos.length >= diseasePhotoMockPolicy.maxPhotosPerIncident) {
    throw new Error(`ภาพจำลองต่อเคสต้องไม่เกิน ${diseasePhotoMockPolicy.maxPhotosPerIncident} รูป`)
  }
  if (!diseasePhotoPlaceholderKinds.includes(draft.placeholderKind)) {
    throw new Error('ชนิด Placeholder ไม่ถูกต้อง')
  }
  if (!diseasePhotoMimeTypes.includes(draft.mimeType)) {
    throw new Error('รองรับชนิดจำลอง JPEG, PNG หรือ WebP เท่านั้น')
  }
  if (!Number.isInteger(draft.sizeBytes) || draft.sizeBytes <= 0) {
    throw new Error('ขนาดภาพจำลองต้องเป็นจำนวนเต็มที่มากกว่า 0')
  }
  if (draft.sizeBytes > diseasePhotoMockPolicy.maxBytes) {
    throw new Error('ภาพจำลองต้องไม่เกิน 5 MB')
  }
  return {
    ...draft,
    note: requiredText(draft.note, 'หมายเหตุภาพจำลอง'),
  }
}

export function nextDiseasePhotoState(
  photo: DiseasePhotoMockEvidence,
  action: DiseasePhotoAction,
): Pick<DiseasePhotoMockEvidence, 'uploadState' | 'retryCount' | 'lastError' | 'version'> {
  if (action === 'START_UPLOAD') {
    if (photo.uploadState !== 'PENDING') throw new Error('เริ่มอัปโหลดจำลองได้จากสถานะ Pending เท่านั้น')
    return { uploadState: 'UPLOADING', retryCount: photo.retryCount, lastError: '', version: photo.version + 1 }
  }
  if (action === 'MARK_UPLOADED') {
    if (photo.uploadState !== 'UPLOADING') throw new Error('ยืนยัน Uploaded ได้จากสถานะ Uploading เท่านั้น')
    return { uploadState: 'UPLOADED', retryCount: photo.retryCount, lastError: '', version: photo.version + 1 }
  }
  if (action === 'MARK_FAILED') {
    if (photo.uploadState !== 'UPLOADING') throw new Error('จำลอง Failed ได้จากสถานะ Uploading เท่านั้น')
    return {
      uploadState: 'FAILED',
      retryCount: photo.retryCount,
      lastError: 'SIMULATED/TEST ONLY — mock upload failure',
      version: photo.version + 1,
    }
  }
  if (photo.uploadState !== 'FAILED') throw new Error('Retry ได้จากสถานะ Failed เท่านั้น')
  if (photo.retryCount >= diseasePhotoMockPolicy.maxRetryCount) {
    throw new Error(`Retry ภาพจำลองได้ไม่เกิน ${diseasePhotoMockPolicy.maxRetryCount} ครั้ง`)
  }
  return {
    uploadState: 'UPLOADING',
    retryCount: photo.retryCount + 1,
    lastError: '',
    version: photo.version + 1,
  }
}

export function validateTreatmentWorkOrderInput(
  context: WorkMutationContext,
  incident: DiseaseIncidentRecord,
  input: TreatmentWorkOrderInput,
): TreatmentWorkOrderInput {
  requireActiveFarm(context.farm)
  if (!canAssessDisease(context.farm.role)) {
    throw new Error('เฉพาะ Agronomist เท่านั้นที่สร้างงานรักษาจาก Disease Incident ได้')
  }
  if (
    incident.organizationId !== context.farm.organizationId ||
    incident.farmId !== context.farm.farmId
  ) {
    throw new Error('ปฏิเสธการสร้างงานรักษาข้ามสวน')
  }
  if (incident.positionId !== input.positionId) {
    throw new Error('Wrong-Tree: ต้นเป้าหมายไม่ตรงกับ Disease Incident')
  }
  if (incident.status === 'CLOSED') throw new Error('เคสที่ปิดแล้วสร้างงานรักษาไม่ได้')
  if (incident.specialistApprovalStatus !== 'APPROVED' || !incident.treatmentPlan.trim()) {
    throw new Error('ต้องมี diagnosis และ treatment ที่ Agronomist อนุมัติก่อนสร้างงาน')
  }
  if (incident.treatmentWorkOrderId) throw new Error('Duplicate Attempt: เคสนี้มี Treatment Work Order แล้ว')
  const target = validateWorkTarget({
    kind: 'TREE',
    zoneCode: input.zoneCode,
    rowCode: input.rowCode,
    positionIds: [input.positionId],
  })
  if (!validIsoDate(input.dueDate)) throw new Error('Due date ต้องเป็น YYYY-MM-DD')
  return {
    positionId: input.positionId,
    zoneCode: target.zoneCode,
    rowCode: requiredText(target.rowCode ?? '', 'Row code'),
    assignedUserId: input.assignedUserId?.trim() || null,
    dueDate: input.dueDate,
  }
}

export function validateDiseaseDraft(
  context: WorkMutationContext,
  draft: DiseaseIncidentDraft,
): DiseaseIncidentDraft {
  requireActiveFarm(context.farm)
  if (!canObserveDisease(context.farm.role)) throw new Error('บทบาทนี้ไม่มีสิทธิ์รายงานอาการ')
  if (!/^pos_[A-Za-z0-9_-]{12,}$/u.test(draft.positionId)) throw new Error('Position ID ไม่ถูกต้อง')
  if (draft.followUpDate && !validIsoDate(draft.followUpDate)) throw new Error('Follow-up date ไม่ถูกต้อง')
  if (context.farm.role === 'WORKER' && draft.suspectedDiagnosis.trim()) {
    throw new Error('Worker บันทึก observed symptom ได้ แต่ห้ามวินิจฉัย')
  }
  return {
    ...draft,
    observedSymptom: requiredText(draft.observedSymptom, 'อาการที่สังเกต'),
    suspectedDiagnosis: draft.suspectedDiagnosis.trim(),
  }
}

export function validateDiseaseAssessment(
  context: WorkMutationContext,
  input: DiseaseAssessmentInput,
): DiseaseAssessmentInput {
  requireActiveFarm(context.farm)
  if (!canAssessDisease(context.farm.role)) {
    throw new Error('เฉพาะ Agronomist เท่านั้นที่ยืนยัน diagnosis/treatment ได้')
  }
  if (input.followUpDate && !validIsoDate(input.followUpDate)) throw new Error('Follow-up date ไม่ถูกต้อง')
  return {
    suspectedDiagnosis: requiredText(input.suspectedDiagnosis, 'suspected diagnosis'),
    confirmedDiagnosis: requiredText(input.confirmedDiagnosis, 'confirmed diagnosis'),
    treatmentPlan: requiredText(input.treatmentPlan, 'แผนการรักษาจากผู้เชี่ยวชาญ'),
    followUpDate: input.followUpDate,
  }
}

export function validateDiseaseFollowUp(
  context: WorkMutationContext,
  input: DiseaseFollowUpInput,
): DiseaseFollowUpInput {
  requireActiveFarm(context.farm)
  if (!canAssessDisease(context.farm.role)) {
    throw new Error('เฉพาะ Agronomist เท่านั้นที่บันทึก outcome/ปิดเคสได้')
  }
  if (input.nextFollowUpDate && !validIsoDate(input.nextFollowUpDate)) {
    throw new Error('Follow-up date ไม่ถูกต้อง')
  }
  return {
    ...input,
    outcome: requiredText(input.outcome, 'ผลติดตาม'),
  }
}
