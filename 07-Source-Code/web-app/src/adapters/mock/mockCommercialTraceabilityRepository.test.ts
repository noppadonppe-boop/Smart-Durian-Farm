import { beforeEach, describe, expect, it } from 'vitest'

import type { CanonicalRole, FarmAccess } from '../../domain/farm'
import type { CommercialMutationContext } from '../../domain/commercialTraceability'
import { MockCommercialTraceabilityRepository } from './mockCommercialTraceabilityRepository'

function context(
  role: CanonicalRole,
  farmId = 'farm_demo_north_01',
): CommercialMutationContext {
  const farm: FarmAccess = {
    organizationId: 'org_demo_kdoms_01',
    organizationName: 'องค์กรทดสอบ',
    organizationCode: 'DEMO',
    farmId,
    farmCode: farmId === 'farm_demo_north_01' ? 'DEMO-F01' : 'DEMO-F02',
    farmSequence: farmId === 'farm_demo_north_01' ? 'F01' : 'F02',
    farmName: 'สวนจำลอง',
    farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    role,
    isOrganizationOwner: role === 'ORG_OWNER',
    isMock: true,
  }
  return {
    actor: { userId: `user_${role.toLowerCase()}`, displayName: role, maskedPhone: '000••••000', source: 'mock' },
    farm,
  }
}

describe('MockCommercialTraceabilityRepository', () => {
  let repository: MockCommercialTraceabilityRepository

  beforeEach(() => {
    repository = new MockCommercialTraceabilityRepository()
  })

  it('returns only same-farm records and complete traceability', async () => {
    const north = await repository.listSnapshot(context('SALES_INVENTORY'))
    expect(north.cropCycles).toHaveLength(1)
    expect(north.cropCycles.every((item) => item.farmId === 'farm_demo_north_01')).toBe(true)
    expect(north.traceability[0]).toMatchObject({
      salesLotCode: 'S-DEMO-N-001', harvestLotCode: 'H-DEMO-N-001', cropCycleCode: 'CROP-DEMO-N-2026-01',
    })
    expect(north.financial).toBeNull()
    expect((await repository.listSnapshot(context('ORG_OWNER'))).financial?.salesLots).toHaveLength(1)
    const south = await repository.listSnapshot(context('FARM_MANAGER', 'farm_demo_south_02'))
    expect(south.salesLots).toHaveLength(0)
    expect(south.harvestLots).toHaveLength(1)
  })

  it('creates an observation once for a duplicate idempotency key', async () => {
    const input = {
      cropCycleId: 'crop_demo_north_2026_01',
      stage: 'PRE_SALE' as const,
      scopeKind: 'ZONE' as const,
      positionIds: [],
      zoneCodes: ['Z01'],
      countingMode: 'AI_ASSISTED' as const,
      sourceCountSessionId: 'aifc_mock_repository_001',
      countMethod: 'SAMPLE' as const,
      observedCount: 300,
      droppedCount: 4,
      valueQuality: 'ESTIMATED' as const,
      confidenceNote: 'SIMULATED/TEST ONLY — deterministic sample',
      observedAt: '2026-08-31',
    }
    const first = await repository.createFruitObservation(context('AGRONOMIST'), 'obs-once', input)
    const retry = await repository.createFruitObservation(context('AGRONOMIST'), 'obs-once', input)
    expect(retry.observationId).toBe(first.observationId)
    expect((await repository.listSnapshot(context('AGRONOMIST'))).fruitObservations
      .filter((item) => item.observationId === first.observationId)).toHaveLength(1)
  })

  it('creates a partial sales lot and denies cross-farm harvest references', async () => {
    const salesContext = context('SALES_INVENTORY')
    const first = await repository.createSalesLot(salesContext, 'sale-once', {
      lotCode: 'S-DEMO-N-002',
      allocations: [{ harvestLotId: 'harvest_demo_north_001', weightKg: 40 }],
      quantityFruit: 16,
      weightKg: 40,
      note: 'SIMULATED/TEST ONLY',
    })
    const retry = await repository.createSalesLot(salesContext, 'sale-once', {
      lotCode: 'IGNORED-BY-IDEMPOTENCY',
      allocations: [{ harvestLotId: 'harvest_demo_north_001', weightKg: 1 }],
      quantityFruit: null, weightKg: 1, note: '',
    })
    expect(retry.salesLotId).toBe(first.salesLotId)
    await expect(repository.createSalesLot(salesContext, 'cross-farm-sale', {
      lotCode: 'S-CROSS',
      allocations: [{ harvestLotId: 'harvest_demo_south_001', weightKg: 10 }],
      quantityFruit: null, weightKg: 10, note: '',
    })).rejects.toThrow('ข้ามสวน')
  })

  it('denies negative stock, duplicate issue and unauthorized adjustment', async () => {
    const salesContext = context('SALES_INVENTORY')
    const input = {
      itemId: 'inventory_item_demo_north_002',
      lotId: 'inventory_lot_demo_north_002',
      movementType: 'ISSUE' as const,
      quantity: 10,
      unit: 'piece',
      reason: 'SIMULATED/TEST ONLY — issue',
      referenceType: 'WORK_ORDER' as const,
      referenceId: 'work_demo_tree_000001',
    }
    const first = await repository.recordInventoryMovement(salesContext, 'issue-once', input)
    const retry = await repository.recordInventoryMovement(salesContext, 'issue-once', input)
    expect(retry.movementId).toBe(first.movementId)
    expect((await repository.listSnapshot(salesContext)).inventoryBalances
      .find((item) => item.itemId === input.itemId)?.balance).toBe(90)
    await expect(repository.recordInventoryMovement(salesContext, 'negative', {
      ...input, quantity: 1000,
    })).rejects.toThrow('สต็อกติดลบ')
    await expect(repository.recordInventoryMovement(salesContext, 'adjust', {
      ...input, movementType: 'ADJUSTMENT', quantity: 1,
      referenceType: 'COUNT_CORRECTION', referenceId: 'COUNT-DEMO-001',
    })).rejects.toThrow('Owner/Manager')
  })

  it('allows only the organization owner to read and correct financial records', async () => {
    const manager = context('FARM_MANAGER')
    await expect(repository.correctSalesLot(manager, 'sales_demo_north_001', 'manager-denied', {
      weightKg: 180,
      unitPriceBahtPerKg: 150,
      depositBaht: 5000,
      receivedBaht: 12000,
      reason: 'must be denied',
    })).rejects.toThrow('เฉพาะเจ้าขององค์กร')
    const owner = context('ORG_OWNER')
    const corrected = await repository.correctSalesLot(owner, 'sales_demo_north_001', 'correct-once', {
      weightKg: 180,
      unitPriceBahtPerKg: 150,
      depositBaht: 5000,
      receivedBaht: 12000,
      reason: 'SIMULATED/TEST ONLY — correction evidence',
    })
    expect(corrected.version).toBe(2)
    await expect(repository.correctSalesLot(context('SALES_INVENTORY'), corrected.salesLotId, 'blocked', {
      weightKg: 180, unitPriceBahtPerKg: 150, depositBaht: 5000,
      receivedBaht: 12000, reason: 'blocked',
    })).rejects.toThrow('เฉพาะเจ้าขององค์กร')
    expect((await repository.listSnapshot(owner)).financial?.audit[0]?.eventType).toBe('CORRECTED')
    const archived = await repository.archiveSalesLot(manager, corrected.salesLotId, 'archive-once', 'SIMULATED reason')
    expect(archived.status).toBe('ARCHIVED')
    expect(archived.audit[0]!.eventType).toBe('ARCHIVED')
  })

  it('resets every mutation to the deterministic pack', async () => {
    const manager = context('FARM_MANAGER')
    await repository.recordInventoryMovement(manager, 'receipt', {
      itemId: 'inventory_item_demo_north_002', lotId: 'inventory_lot_demo_north_002',
      movementType: 'RECEIPT', quantity: 25, unit: 'piece', reason: 'SIMULATED receipt',
      referenceType: 'PURCHASE_REFERENCE', referenceId: 'PURCHASE-DEMO-RESET',
    })
    expect((await repository.listSnapshot(manager)).inventoryMovements).toHaveLength(4)
    await repository.resetMockPack()
    expect((await repository.listSnapshot(manager)).inventoryMovements).toHaveLength(3)
  })
})
