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

export type CanonicalRole = (typeof canonicalRoles)[number]
export type FarmStatus = (typeof farmStatuses)[number]
export type MembershipStatus = (typeof membershipStatuses)[number]
export type SyncState = 'synced' | 'offline'

export interface AuthenticatedIdentity {
  userId: string
  displayName: string
  maskedPhone: string
  source: 'mock' | 'firebase-emulator'
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
