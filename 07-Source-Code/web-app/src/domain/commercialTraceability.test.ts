import { describe, expect, it } from 'vitest'

import {
  buildTraceability,
  assertCropStageTransition,
  calculateInventoryBalances,
  calculateSaleAmounts,
  roundMoney,
  validateFruitObservation,
  validateHarvestLot,
  validateInventoryMovement,
  validateSalesLot,
  type CropCycleRecord,
  type HarvestLotRecord,
  type InventoryItemRecord,
  type InventoryMovementRecord,
  type SalesLotRecord,
} from './commercialTraceability'

describe('Phase 5 commercial calculations', () => {
  it('advances crop stages one step at a time', () => {
    expect(() => assertCropStageTransition('FLOWERING', 'EARLY_FRUIT')).not.toThrow()
    expect(() => assertCropStageTransition('FLOWERING', 'PRE_SALE')).toThrow('ทีละขั้น')
  })

  it('rounds money and derives outstanding sale status', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
    expect(calculateSaleAmounts(12.345, 120.5, 200, 500)).toEqual({
      grossAmountBaht: 1487.57,
      outstandingBaht: 787.57,
      status: 'PARTIALLY_RECEIVED',
    })
    expect(calculateSaleAmounts(10, 100, 200, 800).status).toBe('PAID')
    expect(() => calculateSaleAmounts(10, 100, 600, 500)).toThrow('เกินมูลค่า')
  })

  it('keeps measured, estimated and unknown values explicit', () => {
    expect(validateFruitObservation({
      cropCycleId: 'crop_demo_001',
      stage: 'MID_SEASON',
      scopeKind: 'ZONE',
      positionIds: [],
      zoneCodes: ['Z01'],
      countingMode: 'MANUAL',
      sourceCountSessionId: null,
      countMethod: 'SAMPLE',
      observedCount: 120,
      droppedCount: 3,
      valueQuality: 'ESTIMATED',
      confidenceNote: 'SIMULATED/TEST ONLY — sample limitation',
      observedAt: '2026-08-31',
    }).observedCount).toBe(120)
    expect(() => validateFruitObservation({
      cropCycleId: 'crop_demo_001',
      stage: 'FLOWERING',
      scopeKind: 'ZONE',
      positionIds: [],
      zoneCodes: ['Z01'],
      countingMode: 'MANUAL',
      sourceCountSessionId: null,
      countMethod: 'UNKNOWN',
      observedCount: 1,
      droppedCount: null,
      valueQuality: 'UNKNOWN',
      confidenceNote: 'unknown',
      observedAt: '2026-08-31',
    })).toThrow('UNKNOWN')
  })

  it('keeps the manual and AI-assisted counting sources auditable', () => {
    expect(validateFruitObservation({
      cropCycleId: 'crop_demo_001',
      stage: 'MID_SEASON',
      scopeKind: 'ZONE',
      positionIds: [],
      zoneCodes: ['Z01'],
      countingMode: 'AI_ASSISTED',
      sourceCountSessionId: 'aifc_mock_session_001',
      countMethod: 'SAMPLE',
      observedCount: 59,
      droppedCount: 2,
      valueQuality: 'ESTIMATED',
      confidenceNote: 'SIMULATED/TEST ONLY — AI mock + human review',
      observedAt: '2026-08-31',
    }).sourceCountSessionId).toBe('aifc_mock_session_001')

    expect(() => validateFruitObservation({
      cropCycleId: 'crop_demo_001',
      stage: 'MID_SEASON',
      scopeKind: 'ZONE',
      positionIds: [],
      zoneCodes: ['Z01'],
      countingMode: 'AI_ASSISTED',
      sourceCountSessionId: null,
      countMethod: 'FULL_COUNT',
      observedCount: 59,
      droppedCount: 2,
      valueQuality: 'MEASURED',
      confidenceNote: 'invalid AI claim',
      observedAt: '2026-08-31',
    })).toThrow('ค่าประมาณการ')
  })

  it('validates harvest grades and partial sales allocation', () => {
    expect(validateHarvestLot({
      cropCycleId: 'crop_demo_001',
      lotCode: 'H-DEMO-01',
      harvestedOn: '2026-08-31',
      positionIds: ['pos_demo_a01f783bc219'],
      zoneCodes: ['Z01'],
      quantityFruit: 100,
      totalWeightKg: 250,
      valueQuality: 'MEASURED',
      grades: [{ gradeCode: 'A', quantityFruit: 40, weightKg: 110, valueQuality: 'MEASURED' }],
      note: '',
    }).grades[0]!.weightKg).toBe(110)
    expect(validateSalesLot({
      lotCode: 'S-DEMO-01',
      customerReference: 'BUYER-DEMO-01',
      allocations: [{ harvestLotId: 'harvest_demo_001', weightKg: 50 }],
      quantityFruit: 20,
      weightKg: 50,
      unitPriceBahtPerKg: 150,
      depositBaht: 500,
      receivedBaht: 0,
      note: '',
    }).weightKg).toBe(50)
    expect(() => validateSalesLot({
      lotCode: 'S-DEMO-02',
      customerReference: 'buyer@example.test',
      allocations: [{ harvestLotId: 'harvest_demo_001', weightKg: 50 }],
      quantityFruit: null,
      weightKg: 50,
      unitPriceBahtPerKg: 150,
      depositBaht: 0,
      receivedBaht: 0,
      note: '',
    })).toThrow('ห้ามใส่อีเมล')
  })

  it('enforces inventory unit and calculates balance without guessing conversions', () => {
    const item: InventoryItemRecord = {
      organizationId: 'org_demo', farmId: 'farm_demo', itemId: 'item_demo',
      itemCode: 'ITEM-01', name: 'วัสดุจำลอง', baseUnit: 'kg', reorderLevel: 5,
      lots: [{ lotId: 'lot_demo', lotCode: 'LOT-01', expiresOn: null }],
      status: 'ACTIVE', version: 1, exampleData: true,
    }
    const receipt = validateInventoryMovement(item, {
      itemId: item.itemId, lotId: 'lot_demo', movementType: 'RECEIPT', quantity: 10,
      unit: 'kg', reason: 'SIMULATED receipt', referenceType: 'PURCHASE_REFERENCE',
      referenceId: 'REF-DEMO', directUnitCostBaht: 20,
    })
    expect(receipt.quantityDelta).toBe(10)
    expect(receipt.directCostBaht).toBe(200)
    const movements = [{ ...receipt, organizationId: 'org_demo', farmId: 'farm_demo',
      movementId: 'move_demo', actorUserId: 'user_demo', createdAtLabel: 'fixed',
      version: 1 as const, exampleData: true as const, audit: [],
    }] satisfies InventoryMovementRecord[]
    expect(calculateInventoryBalances([item], movements)[0]!.balance).toBe(10)
    expect(() => validateInventoryMovement(item, { ...receipt, unit: 'bag' })).toThrow('ห้ามคาดเดา')
  })

  it('traces a partial sale back through harvest and crop cycle', () => {
    const cycle = { organizationId: 'o', farmId: 'f', annualCycleId: 'a', cropCycleId: 'c', cycleCode: 'C-01',
      name: 'SIMULATED', stage: 'HARVESTED', zoneCodes: ['Z01'], varietyReference: 'DEMO',
      expectedHarvestDate: null, status: 'ACTIVE', version: 1, exampleData: true } satisfies CropCycleRecord
    const harvest = { organizationId: 'o', farmId: 'f', harvestLotId: 'h', cropCycleId: 'c',
      lotCode: 'H-01', harvestedOn: '2026-08-31', positionIds: ['pos_demo_000000000001'],
      zoneCodes: ['Z01'], quantityFruit: 100, totalWeightKg: 250, valueQuality: 'MEASURED',
      grades: [], note: '', status: 'GRADED', soldWeightKg: 50, actorUserId: 'u',
      createdAtLabel: 'fixed', version: 1, exampleData: true, audit: [] } satisfies HarvestLotRecord
    const sale = { organizationId: 'o', farmId: 'f', salesLotId: 's', lotCode: 'S-01',
      customerReference: 'BUYER-DEMO', allocations: [{ harvestLotId: 'h', weightKg: 50 }],
      quantityFruit: 20, weightKg: 50, unitPriceBahtPerKg: 100, depositBaht: 0,
      receivedBaht: 0, note: '', grossAmountBaht: 5000, outstandingBaht: 5000,
      status: 'CONFIRMED', actorUserId: 'u', createdAtLabel: 'fixed', version: 1,
      exampleData: true, audit: [] } satisfies SalesLotRecord
    expect(buildTraceability([cycle], [harvest], [sale])[0]!).toMatchObject({
      salesLotCode: 'S-01', harvestLotCode: 'H-01', cropCycleCode: 'C-01', allocatedWeightKg: 50,
    })
  })
})
