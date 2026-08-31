import type { FoundationAdapters } from '../contracts'

const mockFarm = Object.freeze({
  organizationId: 'org_demo_01',
  farmId: 'farm_demo_01',
  farmCode: 'DEMO-F01',
  farmName: 'สวนสาธิต — ข้อมูลจำลอง',
  role: 'ORG_OWNER' as const,
  isMock: true as const,
})

export const mockFoundationAdapters: FoundationAdapters = {
  farmContext: {
    getCurrentFarm: () => mockFarm,
  },
  identity: {
    displayName: 'ผู้ใช้จำลอง',
    roleLabel: 'ORG_OWNER · Mock authentication shell',
    source: 'mock',
  },
}
