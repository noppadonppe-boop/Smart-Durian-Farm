import type { Timestamp } from 'firebase/firestore'

export const userRoles = [
  'MasterAdmin',
  'ORG_OWNER',
  'FARM_MANAGER',
  'AGRONOMIST',
  'WORKER',
  'SALES_INVENTORY',
  'VIEWER',
  'AUDITOR',
] as const

export type UserRole = typeof userRoles[number]

export interface UserProfile {
  uid: string
  email: string
  firstName: string
  lastName: string
  position: string
  role: UserRole[] // Multi select array
  status: 'pending' | 'approved' | 'rejected'
  assignedProjects: string[]
  createdAt: Timestamp
  photoURL?: string
  isFirstUser: boolean
}

export const accessRequestStatuses = ['PENDING', 'APPROVED', 'REJECTED'] as const

export type AccessRequestStatus = typeof accessRequestStatuses[number]

export interface AccessRequestRecord {
  requestId: string
  uid: string
  email: string
  displayName: string
  maskedPhone: string
  providerIds: string[]
  status: AccessRequestStatus
  requestedAt: Timestamp
  updatedAt: Timestamp
  photoURL?: string
  resolvedAt?: Timestamp
  resolvedBy?: string
  organizationId?: string
  farmId?: string
  assignedRole?: Exclude<UserRole, 'MasterAdmin'>
  rejectionReason?: string
}

export interface AppMetaConfig {
  firstUserRegistered: boolean
  totalUsers: number
  createdAt: Timestamp
}

export interface Project {
  projectId: string
  projectName: string
  createdAt: Timestamp
}
