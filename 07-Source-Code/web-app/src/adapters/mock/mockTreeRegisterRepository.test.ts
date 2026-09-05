import { describe, expect, it } from 'vitest'

import { emptyTreeBaselineMeasurements, type TreeMutationContext } from '../../domain/treeRegister'
import { MockTreeRegisterRepository } from './mockTreeRegisterRepository'

const context: TreeMutationContext = {
  actor: {
    userId: 'master_admin_test',
    displayName: 'Master Admin Test',
    maskedPhone: '000••••000',
    source: 'mock',
  },
  farm: {
    organizationId: 'org_test',
    organizationName: 'องค์กรทดสอบ',
    organizationCode: 'TEST',
    farmId: 'farm_test',
    farmCode: 'TEST-F01',
    farmSequence: 'F01',
    farmName: 'สวนทดสอบ',
    farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    role: 'WORKER',
    isOrganizationOwner: false,
    isMock: true,
  },
  isSystemAdmin: true,
}

const draft = {
  organizationCode: 'TEST',
  farmSequence: 'F01',
  zoneCode: 'Z01',
  rowCode: 'R01',
  treeSequence: 1,
  rowCountingDirection: 'TBD' as const,
  variety: null,
  varietyConfidence: 'unknown' as const,
  plantingYear: null,
  plantingYearCalendar: null,
  plantingYearConfidence: 'unknown' as const,
  plantSource: null,
  treeStatus: 'empty' as const,
  baselineDate: '2026-09-05',
  baselineMeasurements: emptyTreeBaselineMeasurements(),
  notes: '',
}

describe('MockTreeRegisterRepository deletion', () => {
  it('lets MasterAdmin delete history and recreate the same available TAG', async () => {
    const repository = new MockTreeRegisterRepository([])
    const created = await repository.createTreePosition(
      { ...context, farm: { ...context.farm, isOrganizationOwner: true, role: 'ORG_OWNER' } },
      draft,
    )
    await repository.updateCurrentPlantingCycle(
      { ...context, farm: { ...context.farm, isOrganizationOwner: true, role: 'ORG_OWNER' } },
      created.positionId,
      draft,
    )

    await expect(repository.deleteTreePositions(context, [created.positionId])).resolves.toMatchObject({
      deletedCount: 1,
    })
    await expect(repository.createTreePosition(
      { ...context, farm: { ...context.farm, isOrganizationOwner: true, role: 'ORG_OWNER' } },
      draft,
    )).resolves.toMatchObject({ tagCode: created.tagCode })
  })
})
