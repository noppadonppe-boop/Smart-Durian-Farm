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
  phoneNumber?: string
  firstName: string
  lastName: string
  position: string
  role: UserRole[] // Multi select array
  status: 'pending' | 'approved' | 'rejected'
  assignedProjects: string[]
  createdAt: Timestamp
  photoURL?: string
  isFirstUser: boolean
  updatedAt?: Timestamp
}

export function formatPhoneNumber(phoneNumber?: string | null): string {
  if (!phoneNumber) return ''
  const trimmed = phoneNumber.trim()
  const cleaned = trimmed.replace(/[\s()-]/gu, '')
  if (/^\+66\d{9}$/u.test(cleaned)) {
    return `0${cleaned.slice(3, 5)}-${cleaned.slice(5, 8)}-${cleaned.slice(8)}`
  }
  if (/^\+66\d{8}$/u.test(cleaned)) {
    return `0${cleaned.slice(3, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  if (/^66\d{9}$/u.test(cleaned)) {
    return `0${cleaned.slice(2, 4)}-${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
  }
  if (/^66\d{8}$/u.test(cleaned)) {
    return `0${cleaned.slice(2, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (/^0\d{9}$/u.test(cleaned)) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`
  }
  if (/^0\d{8}$/u.test(cleaned)) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`
  }
  return trimmed
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
