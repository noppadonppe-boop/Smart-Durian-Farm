import { beforeEach, describe, expect, it } from 'vitest'

import annualSeed from '../../demo/annual-cycle-mock-data-pack-v1.0.json'
import type { AnnualCycleRecord } from '../../domain/annualFarmCycle'
import type { FarmAccess } from '../../domain/farm'
import type { ManagementReportContext } from '../../domain/managementReporting'
import { MockManagementReportingRepository } from './mockManagementReportingRepository'

const cycle = (annualSeed.cycles as unknown as AnnualCycleRecord[])
  .find((record) => record.annualCycleId === 'annual_demo_north_2026_06')!

const farm: FarmAccess = {
  organizationId: 'org_demo_kdoms_01', organizationName: 'องค์กรจำลอง', organizationCode: 'DEMO',
  farmId: 'farm_demo_north_01', farmCode: 'DEMO-F01', farmSequence: 'F01', farmName: 'สวนเหนือจำลอง',
  farmStatus: 'ACTIVE', membershipStatus: 'ACTIVE', role: 'ORG_OWNER', isOrganizationOwner: true, isMock: true,
}

const context: ManagementReportContext = {
  actor: { userId: 'user_demo_owner_01', displayName: 'เจ้าของสวนจำลอง', maskedPhone: '+66••••001', source: 'mock' },
  farm,
}

describe('MockManagementReportingRepository', () => {
  let repository: MockManagementReportingRepository

  beforeEach(() => { repository = new MockManagementReportingRepository() })

  it('isolates Farm data and rejects a cross-farm cycle', async () => {
    const north = await repository.listSnapshot(context, cycle.annualCycleId)
    expect(north.laborCosts.length).toBe(2)
    expect(north.laborCosts.every((record) => record.farmId === farm.farmId)).toBe(true)
    await expect(repository.createLaborCost(context, { ...cycle, farmId: 'farm_demo_south_02' }, 'cross-farm', {
      annualCycleId: cycle.annualCycleId,
      incurredOn: '2026-08-31',
      workerReference: 'ทีมจำลอง',
      basis: 'DAY', quantity: 1, rateBaht: 500,
      referenceType: 'FARM_OPERATION', referenceId: farm.farmId, notes: '',
    })).rejects.toThrow(/ข้าม Farm/u)
  })

  it('returns the same immutable labor record for an idempotent retry', async () => {
    const draft = {
      annualCycleId: cycle.annualCycleId,
      incurredOn: '2026-08-31',
      workerReference: 'ทีมจำลอง',
      basis: 'DAY' as const,
      quantity: 1,
      rateBaht: 500,
      referenceType: 'FARM_OPERATION' as const,
      referenceId: farm.farmId,
      notes: 'SIMULATED/TEST ONLY',
    }
    const first = await repository.createLaborCost(context, cycle, 'same-labor', draft)
    const retry = await repository.createLaborCost(context, cycle, 'same-labor', draft)
    expect(retry.laborCostId).toBe(first.laborCostId)
    const snapshot = await repository.listSnapshot(context, cycle.annualCycleId)
    expect(snapshot.laborCosts.filter((record) => record.laborCostId === first.laborCostId)).toHaveLength(1)
  })

  it('keeps every non-owner role from reading or recording financial data', async () => {
    const draft = {
      annualCycleId: cycle.annualCycleId,
      incurredOn: '2026-08-31',
      workerReference: 'ทีมจำลอง',
      basis: 'DAY' as const,
      quantity: 1,
      rateBaht: 500,
      referenceType: 'FARM_OPERATION' as const,
      referenceId: farm.farmId,
      notes: '',
    }
    const nonOwnerRoles = ['ORG_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'WORKER', 'SALES_INVENTORY', 'VIEWER', 'AUDITOR'] as const
    for (const role of nonOwnerRoles) {
      const deniedContext = { ...context, farm: { ...farm, role, isOrganizationOwner: false } }
      await expect(repository.listSnapshot(deniedContext, cycle.annualCycleId)).rejects.toThrow(/เฉพาะเจ้าขององค์กร/u)
      await expect(repository.createLaborCost(deniedContext, cycle, `labor-deny-${role}`, draft)).rejects.toThrow(/เฉพาะเจ้าขององค์กร/u)
      await expect(repository.createOperatingExpense(deniedContext, cycle, `expense-deny-${role}`, {
        annualCycleId: cycle.annualCycleId,
        incurredOn: '2026-08-31',
        category: 'OTHER_OPERATING', description: 'จำลอง', amountBaht: 10,
        allocationScope: 'FARM', allocationReferenceId: farm.farmId, notes: '',
      })).rejects.toThrow(/เฉพาะเจ้าขององค์กร/u)
    }
  })
})
