import type {
  AuthenticatedIdentity,
  CanonicalRole,
  FarmAccess,
} from './farm'
import performanceBudget from '../config/phase6-performance-budget.json'
import type { WorkPhotoPhase } from './workCareDisease'

export const offlineOperationStatuses = [
  'PENDING',
  'SYNCING',
  'SYNCED',
  'CONFLICT',
] as const

export const conflictStatuses = ['OPEN', 'RESOLVED', 'ESCALATED'] as const
export const photoRecoveryStatuses = [
  'PENDING',
  'UPLOADING',
  'UPLOADED',
  'FAILED',
  'ORPHANED',
  'CLEANED',
] as const

export type OfflineOperationStatus = (typeof offlineOperationStatuses)[number]
export type ConflictStatus = (typeof conflictStatuses)[number]
export type PhotoRecoveryStatus = (typeof photoRecoveryStatuses)[number]
export type OfflineOperationKind = 'WORK_REPORT' | 'PHOTO_UPLOAD' | 'MASTER_UPDATE'
export type ConflictResolution =
  | 'KEEP_SERVER'
  | 'APPLY_DEVICE_AS_CORRECTION'
  | 'ESCALATE'

export interface OperationalContext {
  actor: AuthenticatedIdentity
  farm: FarmAccess
}

export interface TreeHealthSummary {
  normal: number
  watch: number
  sick: number
  recovering: number
  dead: number
  empty: number
}

export interface FarmDashboardSnapshot {
  organizationId: string
  farmId: string
  farmCode: string
  farmName: string
  treeHealth: TreeHealthSummary
  urgentDiseaseCount: number
  overdueWorkCount: number
  upcomingWorkCount: number
  fruitEstimate: {
    count: number | null
    unit: 'fruit'
    quality: 'MEASURED' | 'ESTIMATED' | 'UNKNOWN'
  }
  harvestAvailableKg: number
  inventoryWarningCount: number
  salesGrossBaht: number
  salesOutstandingBaht: number
  lastCalculatedAtLabel: string
  exampleData: true
}

export interface DashboardVisibility {
  treeHealth: boolean
  disease: boolean
  work: boolean
  fruit: boolean
  harvest: boolean
  inventory: boolean
  sales: boolean
}

export interface FarmDashboardView {
  snapshot: FarmDashboardSnapshot
  visibility: DashboardVisibility
}

export interface PortfolioDashboard {
  organizationId: string
  farmCount: number
  farms: readonly FarmDashboardSnapshot[]
  totals: {
    urgentDiseaseCount: number
    overdueWorkCount: number
    upcomingWorkCount: number
    inventoryWarningCount: number
    harvestAvailableKg: number
    salesGrossBaht: number
    salesOutstandingBaht: number
  }
}

export interface QueueOperationInput {
  kind: OfflineOperationKind
  label: string
  targetId: string
  payloadFingerprint: string
  requiredRoles: readonly CanonicalRole[]
}

export interface OfflineOperationRecord extends QueueOperationInput {
  operationId: string
  idempotencyKey: string
  organizationId: string
  farmId: string
  actorUserId: string
  capturedRole: CanonicalRole
  status: OfflineOperationStatus
  attemptCount: number
  resultEventId?: string
  conflictReason?: string
  createdAtLabel: string
  updatedAtLabel: string
  exampleData: true
}

export interface MasterDataConflict {
  conflictId: string
  organizationId: string
  farmId: string
  entityType: 'TREE_MASTER' | 'INVENTORY_ITEM' | 'FARM_PROFILE'
  entityId: string
  fieldName: string
  serverValue: string
  deviceValue: string
  status: ConflictStatus
  resolution?: ConflictResolution
  resolutionReason?: string
  resolvedByUserId?: string
  detectedAtLabel: string
  resolvedAtLabel?: string
  version: number
  exampleData: true
}

export interface PhotoRecoveryRecord {
  recoveryId: string
  organizationId: string
  farmId: string
  workOrderId: string
  photoId: string
  phase: WorkPhotoPhase
  actorUserId: string
  storagePath: string
  status: PhotoRecoveryStatus
  failureMode: 'NONE' | 'PARTIAL_ONCE' | 'ORPHANED_OBJECT'
  retryCount: number
  lastError?: string
  updatedAtLabel: string
  exampleData: true
}

export interface PhotoRecoveryDraft {
  workOrderId: string
  photoId: string
  phase: WorkPhotoPhase
  storagePath: string
  status: 'FAILED' | 'ORPHANED'
  failureMode: 'PARTIAL_ONCE' | 'ORPHANED_OBJECT'
  lastError: string
}

export type OperationalAuditEventType =
  | 'OFFLINE_SYNCED'
  | 'OFFLINE_CONFLICT'
  | 'CONFLICT_RESOLVED'
  | 'CONFLICT_ESCALATED'
  | 'PHOTO_RECOVERY_REGISTERED'
  | 'PHOTO_RETRIED'
  | 'ORPHAN_CLEANED'
  | 'EXPORT_CREATED'

export interface OperationalAuditEvent {
  eventId: string
  organizationId: string
  farmId: string
  actorUserId: string
  eventType: OperationalAuditEventType
  targetType: 'OFFLINE_OPERATION' | 'MASTER_CONFLICT' | 'PHOTO' | 'EXPORT'
  targetId: string
  reason: string
  beforeSummary: string
  afterSummary: string
  createdAtLabel: string
  exampleData: true
}

export interface FarmExportRecord {
  exportId: string
  organizationId: string
  farmId: string
  actorUserId: string
  columns: readonly string[]
  rowCount: number
  csvText: string
  createdAtLabel: string
  exampleData: true
}

export const phase6PerformanceBudget = Object.freeze(performanceBudget)

export function dashboardVisibility(role: CanonicalRole): DashboardVisibility {
  return {
    treeHealth: role !== 'SALES_INVENTORY' && role !== 'AUDITOR',
    disease: ['ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'WORKER', 'VIEWER'].includes(role),
    work: role !== 'AUDITOR',
    fruit: ['ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'SALES_INVENTORY', 'VIEWER'].includes(role),
    harvest: ['ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'SALES_INVENTORY', 'VIEWER'].includes(role),
    inventory: ['ORG_OWNER', 'FARM_MANAGER', 'SALES_INVENTORY', 'VIEWER'].includes(role),
    sales: ['ORG_OWNER', 'FARM_MANAGER', 'SALES_INVENTORY', 'VIEWER'].includes(role),
  }
}

export function canReadFarmDashboard(role: CanonicalRole): boolean {
  return role !== 'AUDITOR'
}

export function canReviewMasterConflict(access: FarmAccess): boolean {
  return access.farmStatus === 'ACTIVE' && (
    access.isOrganizationOwner || access.role === 'ORG_OWNER' || access.role === 'FARM_MANAGER'
  )
}

export function canManagePhotoRecovery(access: FarmAccess): boolean {
  return access.farmStatus === 'ACTIVE' && [
    'ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'WORKER',
  ].includes(access.role)
}

export function validatePhotoRecoveryDraft(
  context: OperationalContext,
  draft: PhotoRecoveryDraft,
): PhotoRecoveryDraft {
  if (!canManagePhotoRecovery(context.farm)) throw new Error('บทบาทนี้ไม่มีสิทธิ์ลงทะเบียนการกู้คืนรูป')
  if (!/^[A-Za-z0-9_-]{8,128}$/u.test(draft.workOrderId)) throw new Error('Work Order ID ไม่ถูกต้อง')
  if (!/^photo_(instruction|before|after)_[A-Za-z0-9_-]{4,128}$/u.test(draft.photoId)) {
    throw new Error('Photo ID ไม่ถูกต้อง')
  }
  const expectedPrefix = `organizations/${context.farm.organizationId}/farms/${context.farm.farmId}/workEvidence/${draft.workOrderId}/`
  const expectedMockPrefix = `mock://organizations/${context.farm.organizationId}/farms/${context.farm.farmId}/workEvidence/${draft.workOrderId}/`
  if (
    draft.storagePath.includes('..') ||
    (!draft.storagePath.startsWith(expectedPrefix) && !draft.storagePath.startsWith(expectedMockPrefix)) ||
    !draft.storagePath.endsWith(draft.photoId)
  ) throw new Error('Storage path ของรูปไม่อยู่ใน Farm/Work scope')
  if (
    (draft.status === 'FAILED' && draft.failureMode !== 'PARTIAL_ONCE') ||
    (draft.status === 'ORPHANED' && draft.failureMode !== 'ORPHANED_OBJECT')
  ) throw new Error('สถานะการกู้คืนรูปไม่สอดคล้องกับ failure mode')
  if (draft.lastError.trim().length < 4 || draft.lastError.length > 500) {
    throw new Error('ต้องระบุสาเหตุการกู้คืนรูป 4–500 ตัวอักษร')
  }
  return { ...draft, lastError: draft.lastError.trim() }
}

export function canExportFarm(access: FarmAccess): boolean {
  return access.isOrganizationOwner || ['ORG_OWNER', 'FARM_MANAGER', 'AUDITOR'].includes(access.role)
}

export function assertOperationalScope(
  context: OperationalContext,
  value: { organizationId: string; farmId: string },
): void {
  if (
    context.farm.organizationId !== value.organizationId ||
    context.farm.farmId !== value.farmId
  ) {
    throw new Error('Cross-Farm operation ถูกปฏิเสธ')
  }
}

export function validateQueueInput(input: QueueOperationInput): QueueOperationInput {
  if (!input.label.trim() || !input.targetId.trim()) throw new Error('รายการค้างส่งต้องมีชื่อและเป้าหมาย')
  if (!/^[a-f0-9]{8,64}$/u.test(input.payloadFingerprint)) {
    throw new Error('payload fingerprint ต้องเป็น lowercase hex 8–64 ตัว')
  }
  if (input.requiredRoles.length === 0) throw new Error('รายการค้างส่งต้องระบุบทบาทที่อนุญาต')
  return { ...input, label: input.label.trim(), targetId: input.targetId.trim() }
}

export function canReplayOperation(
  context: OperationalContext,
  operation: OfflineOperationRecord,
): boolean {
  return context.farm.membershipStatus === 'ACTIVE' &&
    context.farm.farmStatus === 'ACTIVE' &&
    operation.requiredRoles.includes(context.farm.role) &&
    operation.actorUserId === context.actor.userId
}

export function buildPortfolioDashboard(
  actor: AuthenticatedIdentity,
  authorizedFarms: readonly FarmAccess[],
  snapshots: readonly FarmDashboardSnapshot[],
): PortfolioDashboard {
  if (!actor.userId || !authorizedFarms.some((farm) => farm.isOrganizationOwner)) {
    throw new Error('Portfolio Dashboard ใช้ได้เฉพาะเจ้าขององค์กร')
  }
  const organizationIds = new Set(authorizedFarms.map((farm) => farm.organizationId))
  if (organizationIds.size !== 1) throw new Error('Portfolio ต้องอยู่ภายใน Organization เดียว')
  const allowedFarmIds = new Set(authorizedFarms.map((farm) => farm.farmId))
  const organizationId = authorizedFarms[0]?.organizationId
  if (!organizationId) throw new Error('ไม่พบสวนที่ได้รับสิทธิ์')
  const farms = snapshots.filter((snapshot) =>
    snapshot.organizationId === organizationId && allowedFarmIds.has(snapshot.farmId),
  )
  return {
    organizationId,
    farmCount: farms.length,
    farms,
    totals: farms.reduce((totals, farm) => ({
      urgentDiseaseCount: totals.urgentDiseaseCount + farm.urgentDiseaseCount,
      overdueWorkCount: totals.overdueWorkCount + farm.overdueWorkCount,
      upcomingWorkCount: totals.upcomingWorkCount + farm.upcomingWorkCount,
      inventoryWarningCount: totals.inventoryWarningCount + farm.inventoryWarningCount,
      harvestAvailableKg: totals.harvestAvailableKg + farm.harvestAvailableKg,
      salesGrossBaht: totals.salesGrossBaht + farm.salesGrossBaht,
      salesOutstandingBaht: totals.salesOutstandingBaht + farm.salesOutstandingBaht,
    }), {
      urgentDiseaseCount: 0,
      overdueWorkCount: 0,
      upcomingWorkCount: 0,
      inventoryWarningCount: 0,
      harvestAvailableKg: 0,
      salesGrossBaht: 0,
      salesOutstandingBaht: 0,
    }),
  }
}

function protectSpreadsheetFormula(value: string): string {
  return /^[=+\-@]/u.test(value) ? `'${value}` : value
}

export function csvCell(value: string | number): string {
  const protectedValue = protectSpreadsheetFormula(String(value))
  return /[",\r\n]/u.test(protectedValue)
    ? `"${protectedValue.replaceAll('"', '""')}"`
    : protectedValue
}

export function buildFarmAuditCsv(events: readonly OperationalAuditEvent[]): string {
  const columns = [
    'eventId', 'organizationId', 'farmId', 'actorUserId', 'eventType',
    'targetType', 'targetId', 'reason', 'beforeSummary', 'afterSummary', 'createdAtLabel',
  ] as const
  const rows = events.map((event) => columns.map((column) => csvCell(event[column])).join(','))
  return [columns.join(','), ...rows].join('\r\n')
}
