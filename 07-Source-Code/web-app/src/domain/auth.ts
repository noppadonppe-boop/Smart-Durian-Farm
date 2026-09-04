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
