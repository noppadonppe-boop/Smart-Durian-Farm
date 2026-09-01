export const canonicalRoles = [
  'ORG_OWNER',
  'FARM_MANAGER',
  'AGRONOMIST',
  'WORKER',
  'SALES_INVENTORY',
  'VIEWER',
  'AUDITOR',
] as const

export const farmStatuses = ['ACTIVE', 'SUSPENDED', 'ARCHIVED'] as const
export const membershipStatuses = ['ACTIVE', 'REVOKED'] as const
export const farmAuditEventTypes = [
  'FARM_CREATED',
  'FARM_PROFILE_UPDATED',
  'FARM_SUSPENDED',
  'FARM_REACTIVATED',
  'FARM_ARCHIVED',
] as const

export type CanonicalRole = (typeof canonicalRoles)[number]
export type FarmStatus = (typeof farmStatuses)[number]
export type MembershipStatus = (typeof membershipStatuses)[number]
export type FarmAuditEventType = (typeof farmAuditEventTypes)[number]
export type SyncState = 'synced' | 'offline'
export type FarmDataClassification = 'SIMULATED/TEST ONLY' | 'OPERATIONAL'

export interface AuthenticatedIdentity {
  userId: string
  displayName: string
  maskedPhone: string
  source: 'mock' | 'firebase-emulator' | 'firebase-live'
}

export interface FarmAccess {
  organizationId: string
  organizationName: string
  organizationCode: string
  farmId: string
  farmCode: string
  farmSequence: string
  farmName: string
  farmStatus: FarmStatus
  membershipStatus: MembershipStatus
  role: CanonicalRole
  isOrganizationOwner: boolean
  isMock: boolean
}

export type FarmContext = FarmAccess

export interface FarmProfileDraft {
  farmName: string
  farmSequence: string
  province: string
  district: string
  subdistrict: string
  locationNote: string
  timezone: string
  seasonStartMonth: number | null
  seasonEndMonth: number | null
  seasonNote: string
  notes: string
}

export interface FarmProfile extends FarmProfileDraft {
  organizationId: string
  farmId: string
  farmCode: string
  status: FarmStatus
  version: number
  createdAtLabel: string
  updatedAtLabel: string
  createdBy: string
  updatedBy: string
  classification: FarmDataClassification
  exampleData: boolean
}

export interface FarmManagementContext {
  actor: AuthenticatedIdentity
  organizationId: string
  organizationCode: string
  isOrganizationOwner: boolean
}

export interface FarmAuditSnapshot {
  farmId: string
  farmCode: string
  farmSequence: string
  farmName: string
  province: string
  district: string
  subdistrict: string
  locationNote: string
  timezone: string
  seasonStartMonth: number | null
  seasonEndMonth: number | null
  seasonNote: string
  status: FarmStatus
  notes: string
  version: number
}

export interface FarmAuditEvent {
  auditEventId: string
  organizationId: string
  farmId: string
  actorUserId: string
  actorDisplayName: string
  eventType: FarmAuditEventType
  before: FarmAuditSnapshot | null
  after: FarmAuditSnapshot
  farmVersion: number
  idempotencyKey: string
  createdAtLabel: string
  classification: FarmDataClassification
  exampleData: boolean
}

export interface FarmArchiveBlocker {
  kind: 'OPEN_WORK_ORDER' | 'PENDING_OPERATION'
  recordId: string
  label: string
  status: string
}

export interface FarmArchiveReadiness {
  organizationId: string
  farmId: string
  openWorkOrders: readonly FarmArchiveBlocker[]
  pendingOperations: readonly FarmArchiveBlocker[]
  canArchive: boolean
}

export interface FarmMutationResult {
  profile: FarmProfile
  auditEvent: FarmAuditEvent
  wasRetry: boolean
}

export interface FarmMember {
  organizationId: string
  farmId: string
  userId: string
  displayName: string
  maskedPhone: string
  role: CanonicalRole
  status: MembershipStatus
  version: number
}

export interface MembershipAuditEvent {
  auditEventId: string
  organizationId: string
  farmId: string
  actorUserId: string
  actorDisplayName: string
  targetUserId: string
  targetDisplayName: string
  eventType: 'ROLE_CHANGED' | 'MEMBERSHIP_REVOKED' | 'MEMBERSHIP_RESTORED'
  beforeRole: CanonicalRole
  afterRole: CanonicalRole
  beforeStatus: MembershipStatus
  afterStatus: MembershipStatus
  membershipVersion: number
  createdAtLabel: string
}

export interface FarmPermissions {
  canWriteOperationalData: boolean
  canManageMemberships: boolean
  canReadAudit: boolean
  canExport: boolean
  isReadOnly: boolean
}

const readOnlyRoles: readonly CanonicalRole[] = ['VIEWER', 'AUDITOR']

export function permissionsFor(access: FarmAccess): FarmPermissions {
  const farmIsWritable = access.farmStatus === 'ACTIVE'
  const roleIsReadOnly = readOnlyRoles.includes(access.role)

  return {
    canWriteOperationalData: farmIsWritable && !roleIsReadOnly,
    canManageMemberships: farmIsWritable && access.isOrganizationOwner,
    canReadAudit:
      access.isOrganizationOwner ||
      access.role === 'FARM_MANAGER' ||
      access.role === 'AUDITOR',
    canExport:
      access.isOrganizationOwner ||
      access.role === 'FARM_MANAGER' ||
      access.role === 'AUDITOR',
    isReadOnly: !farmIsWritable || roleIsReadOnly,
  }
}

export const roleLabels: Record<CanonicalRole, string> = {
  ORG_OWNER: 'เจ้าขององค์กร',
  FARM_MANAGER: 'ผู้จัดการสวน',
  AGRONOMIST: 'นักวิชาการเกษตร',
  WORKER: 'ผู้ปฏิบัติงาน',
  SALES_INVENTORY: 'ขายและคลังวัสดุ',
  VIEWER: 'ผู้ดูข้อมูล',
  AUDITOR: 'ผู้ตรวจสอบ',
}

export const farmStatusLabels: Record<FarmStatus, string> = {
  ACTIVE: 'ใช้งาน',
  SUSPENDED: 'ระงับ',
  ARCHIVED: 'เก็บถาวร',
}

const farmSequencePattern = /^F\d{2,}$/u

function optionalText(value: string, maximumLength: number, label: string): string {
  const normalized = value.trim()
  if (normalized.length > maximumLength) {
    throw new Error(`${label} ต้องไม่เกิน ${maximumLength} ตัวอักษร`)
  }
  return normalized
}

function validTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat('th-TH', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

export function normalizeFarmSequence(value: string): string {
  return value.trim().toUpperCase()
}

export function deriveFarmCode(
  organizationCode: string,
  farmSequence: string,
): string {
  const normalizedOrganizationCode = organizationCode.trim().toUpperCase()
  const normalizedSequence = normalizeFarmSequence(farmSequence)
  if (!/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/u.test(normalizedOrganizationCode)) {
    throw new Error('Organization Code ไม่อยู่ในรูปแบบที่ระบบรองรับ')
  }
  if (!farmSequencePattern.test(normalizedSequence)) {
    throw new Error('Farm Sequence ต้องเป็น F ตามด้วยตัวเลขอย่างน้อย 2 หลัก เช่น F01')
  }
  return `${normalizedOrganizationCode}-${normalizedSequence}`
}

export function normalizeFarmProfileDraft(
  draft: FarmProfileDraft,
): FarmProfileDraft {
  const farmName = draft.farmName.trim()
  if (farmName.length < 2 || farmName.length > 100) {
    throw new Error('ชื่อสวนต้องมี 2–100 ตัวอักษร')
  }

  const farmSequence = normalizeFarmSequence(draft.farmSequence)
  if (!farmSequencePattern.test(farmSequence)) {
    throw new Error('Farm Sequence ต้องเป็น F ตามด้วยตัวเลขอย่างน้อย 2 หลัก เช่น F01')
  }

  const timezone = draft.timezone.trim()
  if (!timezone || !validTimezone(timezone)) {
    throw new Error('Timezone ต้องเป็น IANA timezone ที่ถูกต้อง เช่น Asia/Bangkok')
  }

  const hasStartMonth = draft.seasonStartMonth !== null
  const hasEndMonth = draft.seasonEndMonth !== null
  if (hasStartMonth !== hasEndMonth) {
    throw new Error('เดือนเริ่มและสิ้นสุดฤดูกาลต้องกรอกเป็นคู่')
  }
  for (const [label, month] of [
    ['เดือนเริ่มฤดูกาล', draft.seasonStartMonth],
    ['เดือนสิ้นสุดฤดูกาล', draft.seasonEndMonth],
  ] as const) {
    if (month !== null && (!Number.isInteger(month) || month < 1 || month > 12)) {
      throw new Error(`${label} ต้องอยู่ระหว่าง 1–12`)
    }
  }

  return {
    farmName,
    farmSequence,
    province: optionalText(draft.province, 100, 'จังหวัด'),
    district: optionalText(draft.district, 100, 'อำเภอ/เขต'),
    subdistrict: optionalText(draft.subdistrict, 100, 'ตำบล/แขวง'),
    locationNote: optionalText(draft.locationNote, 300, 'คำอธิบายพื้นที่'),
    timezone,
    seasonStartMonth: draft.seasonStartMonth,
    seasonEndMonth: draft.seasonEndMonth,
    seasonNote: optionalText(draft.seasonNote, 300, 'หมายเหตุฤดูกาล'),
    notes: optionalText(draft.notes, 500, 'หมายเหตุทั่วไป'),
  }
}

export function isValidFarmStatusTransition(
  current: FarmStatus,
  next: FarmStatus,
): boolean {
  return (
    (current === 'ACTIVE' && (next === 'SUSPENDED' || next === 'ARCHIVED')) ||
    (current === 'SUSPENDED' && (next === 'ACTIVE' || next === 'ARCHIVED'))
  )
}

export function farmAuditSnapshot(profile: FarmProfile): FarmAuditSnapshot {
  return {
    farmId: profile.farmId,
    farmCode: profile.farmCode,
    farmSequence: profile.farmSequence,
    farmName: profile.farmName,
    province: profile.province,
    district: profile.district,
    subdistrict: profile.subdistrict,
    locationNote: profile.locationNote,
    timezone: profile.timezone,
    seasonStartMonth: profile.seasonStartMonth,
    seasonEndMonth: profile.seasonEndMonth,
    seasonNote: profile.seasonNote,
    status: profile.status,
    notes: profile.notes,
    version: profile.version,
  }
}

export function assertOrganizationOwner(context: FarmManagementContext): void {
  if (!context.isOrganizationOwner) {
    throw new Error('เฉพาะ ORG_OWNER เท่านั้นที่จัดการสวนได้')
  }
}

export function isCanonicalRole(value: unknown): value is CanonicalRole {
  return typeof value === 'string' && canonicalRoles.includes(value as CanonicalRole)
}

export function isFarmStatus(value: unknown): value is FarmStatus {
  return typeof value === 'string' && farmStatuses.includes(value as FarmStatus)
}

export function isMembershipStatus(value: unknown): value is MembershipStatus {
  return (
    typeof value === 'string' &&
    membershipStatuses.includes(value as MembershipStatus)
  )
}
