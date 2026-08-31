export const canonicalRoles = [
  'ORG_OWNER',
  'FARM_MANAGER',
  'AGRONOMIST',
  'WORKER',
  'SALES_INVENTORY',
  'VIEWER',
  'AUDITOR',
] as const

export type CanonicalRole = (typeof canonicalRoles)[number]
export type SyncState = 'synced' | 'offline'

export interface FarmContext {
  organizationId: string
  farmId: string
  farmCode: string
  farmName: string
  role: CanonicalRole
  isMock: true
}
