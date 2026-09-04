import { describe, expect, it } from 'vitest'

import { MockTreeQrAssetRepository } from './mockTreeQrAssetRepository'
import type { TreeMutationContext } from '../../domain/treeRegister'

function context(farmId = 'farm_demo_north_01'): TreeMutationContext {
  return {
    actor: {
      userId: 'user_demo_owner_01',
      displayName: 'เจ้าของสวนจำลอง',
      maskedPhone: '081••••001',
      source: 'mock',
    },
    farm: {
      organizationId: 'org_demo_kdoms_01',
      organizationName: 'องค์กรจำลอง',
      organizationCode: 'DEMO',
      farmId,
      farmCode: farmId === 'farm_demo_north_01' ? 'DEMO-F01' : 'DEMO-F02',
      farmSequence: farmId === 'farm_demo_north_01' ? 'F01' : 'F02',
      farmName: 'สวนจำลอง',
      farmStatus: 'ACTIVE',
      membershipStatus: 'ACTIVE',
      role: 'ORG_OWNER',
      isOrganizationOwner: true,
      isMock: true,
    },
  }
}

describe('MockTreeQrAssetRepository', () => {
  it('persists TAG and URL assets by farm and returns the existing asset on retry', async () => {
    const repository = new MockTreeQrAssetRepository()
    const farm = context()
    const draft = {
      positionId: 'pos_demo_a01f783bc219',
      tagCode: 'DEMO-F01-Z01-R01-T001',
      format: 'TAG' as const,
      payload: 'DEMO-F01-Z01-R01-T001',
      svg: '<svg />',
    }

    const first = await repository.createQrAsset(farm, draft)
    const retry = await repository.createQrAsset(farm, draft)
    await repository.createQrAsset(farm, { ...draft, format: 'URL', payload: 'https://example.invalid/t/pos_demo_a01f783bc219' })

    expect(retry.qrAssetId).toBe(first.qrAssetId)
    expect((await repository.listQrAssets(farm)).map((asset) => asset.format)).toEqual(['TAG', 'URL'])
    expect((await repository.listQrAssets(context('farm_demo_south_02'))).length).toBe(0)
  })
})
