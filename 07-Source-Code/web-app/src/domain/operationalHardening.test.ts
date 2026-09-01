import { describe, expect, it } from 'vitest'

import type { AuthenticatedIdentity, FarmAccess } from './farm'
import {
  assertOperationalScope,
  buildFarmAuditCsv,
  buildPortfolioDashboard,
  canReplayOperation,
  dashboardVisibility,
  validatePhotoRecoveryDraft,
  type FarmDashboardSnapshot,
  type OfflineOperationRecord,
  type OperationalContext,
} from './operationalHardening'

const actor: AuthenticatedIdentity = {
  userId: 'user_demo_owner_01',
  displayName: 'ผู้ใช้จำลอง',
  maskedPhone: '+165•••101',
  source: 'mock',
}

function farm(overrides: Partial<FarmAccess> = {}): FarmAccess {
  return {
    organizationId: 'org_demo_kdoms_01',
    organizationName: 'องค์กรจำลอง',
    organizationCode: 'DEMO',
    farmId: 'farm_demo_north_01',
    farmCode: 'DEMO-F01',
    farmSequence: 'F01',
    farmName: 'สวนจำลอง',
    farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    role: 'ORG_OWNER',
    isOrganizationOwner: true,
    isMock: true,
    ...overrides,
  }
}

const snapshot: FarmDashboardSnapshot = {
  organizationId: 'org_demo_kdoms_01',
  farmId: 'farm_demo_north_01',
  farmCode: 'DEMO-F01',
  farmName: 'สวนจำลอง',
  treeHealth: { normal: 1, watch: 0, sick: 0, recovering: 0, dead: 0, empty: 0 },
  urgentDiseaseCount: 1,
  overdueWorkCount: 1,
  upcomingWorkCount: 1,
  fruitEstimate: { count: 10, unit: 'fruit', quality: 'ESTIMATED' },
  harvestAvailableKg: 2,
  inventoryWarningCount: 1,
  salesGrossBaht: 100,
  salesOutstandingBaht: 20,
  lastCalculatedAtLabel: 'เวลาจำลอง',
  exampleData: true,
}

describe('Phase 6 dashboard and authorization policy', () => {
  it('shows only role-appropriate dashboard sections', () => {
    expect(dashboardVisibility('WORKER').sales).toBe(false)
    expect(dashboardVisibility('WORKER').work).toBe(true)
    expect(dashboardVisibility('AGRONOMIST').fruit).toBe(true)
    expect(dashboardVisibility('AGRONOMIST').inventory).toBe(false)
    expect(dashboardVisibility('SALES_INVENTORY').sales).toBe(true)
    expect(dashboardVisibility('AUDITOR').work).toBe(false)
  })

  it('builds owner portfolio from authorized farms and excludes hidden farm data', () => {
    const south = { ...snapshot, farmId: 'farm_demo_south_02', farmCode: 'DEMO-F02' }
    const hidden = { ...snapshot, farmId: 'farm_demo_hidden_99', farmCode: 'DEMO-F99', salesGrossBaht: 999999 }
    const result = buildPortfolioDashboard(actor, [
      farm(),
      farm({ farmId: 'farm_demo_south_02', farmCode: 'DEMO-F02', role: 'FARM_MANAGER' }),
    ], [snapshot, south, hidden])

    expect(result.farmCount).toBe(2)
    expect(result.farms.map((item) => item.farmCode)).not.toContain('DEMO-F99')
    expect(result.totals.salesGrossBaht).toBe(200)
  })

  it('denies portfolio to a non-owner', () => {
    expect(() => buildPortfolioDashboard(actor, [
      farm({ role: 'FARM_MANAGER', isOrganizationOwner: false }),
    ], [snapshot])).toThrow(/เจ้าขององค์กร/u)
  })
})

describe('Phase 6 offline and export policy', () => {
  const operation: OfflineOperationRecord = {
    operationId: 'offline_demo_01',
    idempotencyKey: 'retry-demo-01',
    organizationId: 'org_demo_kdoms_01',
    farmId: 'farm_demo_north_01',
    actorUserId: actor.userId,
    capturedRole: 'WORKER',
    kind: 'WORK_REPORT',
    label: 'รายงานจำลอง',
    targetId: 'work_demo_01',
    payloadFingerprint: 'a1b2c3d4',
    requiredRoles: ['WORKER'],
    status: 'PENDING',
    attemptCount: 0,
    createdAtLabel: 'เวลาจำลอง',
    updatedAtLabel: 'เวลาจำลอง',
    exampleData: true,
  }

  it('rechecks role and membership before replay', () => {
    const context: OperationalContext = { actor, farm: farm({ role: 'WORKER', isOrganizationOwner: false }) }
    expect(canReplayOperation(context, operation)).toBe(true)
    expect(canReplayOperation({ ...context, farm: farm({ role: 'VIEWER', isOrganizationOwner: false }) }, operation)).toBe(false)
    expect(canReplayOperation({ ...context, farm: farm({ role: 'WORKER', membershipStatus: 'REVOKED', isOrganizationOwner: false }) }, operation)).toBe(false)
  })

  it('stops cross-farm replay', () => {
    expect(() => assertOperationalScope(
      { actor, farm: farm() },
      { organizationId: 'org_demo_kdoms_01', farmId: 'farm_demo_south_02' },
    )).toThrow(/Cross-Farm/u)
  })

  it('protects CSV consumers from spreadsheet formula injection', () => {
    const csv = buildFarmAuditCsv([{
      eventId: 'event_demo_01',
      organizationId: 'org_demo_kdoms_01',
      farmId: 'farm_demo_north_01',
      actorUserId: 'user_demo_owner_01',
      eventType: 'EXPORT_CREATED',
      targetType: 'EXPORT',
      targetId: 'export_demo_01',
      reason: '=HYPERLINK("https://example.invalid")',
      beforeSummary: '',
      afterSummary: 'rows=1',
      createdAtLabel: 'เวลาจำลอง',
      exampleData: true,
    }])
    expect(csv).toContain("'=HYPERLINK")
  })

  it('validates automatic photo recovery against the current Farm and Work path', () => {
    const context: OperationalContext = { actor, farm: farm({ role: 'WORKER', isOrganizationOwner: false }) }
    const draft = {
      workOrderId: 'work_demo_01',
      photoId: 'photo_before_demo01',
      phase: 'BEFORE' as const,
      storagePath: 'mock://organizations/org_demo_kdoms_01/farms/farm_demo_north_01/workEvidence/work_demo_01/photo_before_demo01',
      status: 'FAILED' as const,
      failureMode: 'PARTIAL_ONCE' as const,
      lastError: 'SIMULATED upload failed',
    }
    expect(validatePhotoRecoveryDraft(context, draft)).toEqual(draft)
    expect(() => validatePhotoRecoveryDraft(context, {
      ...draft,
      storagePath: 'organizations/org_other/farms/farm_other/workEvidence/work_demo_01/photo_before_demo01',
    })).toThrow(/Farm\/Work scope/u)
  })
})
