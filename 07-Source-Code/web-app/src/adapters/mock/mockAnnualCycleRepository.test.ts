import { describe, expect, it } from 'vitest'

import { MockAnnualCycleRepository } from './mockAnnualCycleRepository'
import { MockCommercialTraceabilityRepository } from './mockCommercialTraceabilityRepository'
import type { AnnualCycleMutationContext } from '../../domain/annualFarmCycle'

const ownerContext: AnnualCycleMutationContext = {
  actor: {
    userId: 'user_demo_owner_01',
    displayName: 'เจ้าของสวนจำลอง',
    maskedPhone: '+66••••001',
    source: 'mock',
  },
  farm: {
    organizationId: 'org_demo_kdoms_01',
    organizationName: 'องค์กรจำลอง',
    organizationCode: 'DEMO',
    farmId: 'farm_demo_north_01',
    farmCode: 'DEMO-F01',
    farmSequence: 'F01',
    farmName: 'สวนเหนือจำลอง',
    farmStatus: 'ACTIVE',
    membershipStatus: 'ACTIVE',
    role: 'ORG_OWNER',
    isOrganizationOwner: true,
    isMock: true,
  },
}

describe('MockAnnualCycleRepository', () => {
  it('returns isolated annual cycles and selects the active June-May cycle', async () => {
    const repository = new MockAnnualCycleRepository()
    const snapshot = await repository.listSnapshot(ownerContext)
    expect(snapshot.cycles).toHaveLength(3)
    expect(snapshot.selectedCycle).toMatchObject({
      annualCycleId: 'annual_demo_north_2026_06',
      periodStart: '2026-06-01',
      periodEndExclusive: '2027-06-01',
      status: 'ACTIVE',
    })
    expect(snapshot.planItems.map((item) => item.target.scope)).toEqual([
      'FARM', 'ZONE', 'TREE_SET',
    ])
  })

  it('creates a custom-start draft idempotently and rejects overlap', async () => {
    const repository = new MockAnnualCycleRepository()
    const draft = {
      cycleCode: 'AFY-2028-06-15',
      name: 'รอบเริ่ม 15 มิถุนายนจำลอง',
      periodStart: '2028-06-15',
      timezone: 'Asia/Bangkok',
      notes: 'SIMULATED/TEST ONLY',
      previousAnnualCycleId: 'annual_demo_north_2027_06',
    }
    const first = await repository.createCycle(ownerContext, 'create-custom', draft)
    const retry = await repository.createCycle(ownerContext, 'create-custom', draft)
    expect(retry.annualCycleId).toBe(first.annualCycleId)
    expect(first.periodEndExclusive).toBe('2029-06-15')

    await expect(repository.createCycle(ownerContext, 'create-overlap', {
      ...draft,
      cycleCode: 'AFY-OVERLAP',
      periodStart: '2028-07-01',
    })).rejects.toThrow('ช่วงรอบปีทับ')
  })

  it('preserves a closed revision and corrects it with append-only evidence', async () => {
    const repository = new MockAnnualCycleRepository()
    const annualCycleId = 'annual_demo_north_2025_06'
    const result = await repository.correctCycle(ownerContext, annualCycleId, 'closed-correction-new', {
      cycleCode: 'AFY-2025-06',
      name: 'รอบปีจำลอง 2568/2569',
      periodStart: '2025-06-01',
      timezone: 'Asia/Bangkok',
      notes: 'SIMULATED/TEST ONLY — Correction รอบปิดครั้งใหม่',
      previousAnnualCycleId: null,
    }, 'แก้หมายเหตุพร้อมหลักฐานจำลอง')
    expect(result.cycle.revision).toBe(3)
    expect(result.correction.before.revision).toBe(2)
    expect(result.correction.after.revision).toBe(3)
    expect(result.cycle.supersedesRevisionId).toBe(`${annualCycleId}:r2`)

    const retry = await repository.correctCycle(ownerContext, annualCycleId, 'closed-correction-new', {
      cycleCode: 'IGNORED-BY-IDEMPOTENCY',
      name: 'ไม่ควรถูกใช้',
      periodStart: '2030-01-01',
      timezone: 'Asia/Bangkok',
      notes: '',
      previousAnnualCycleId: null,
    }, 'retry')
    expect(retry.correction.correctionId).toBe(result.correction.correctionId)

    await expect(repository.updateCycle(ownerContext, annualCycleId, 'closed-normal-update', {
      cycleCode: 'AFY-2025-06', name: 'ห้ามแก้ตรง', periodStart: '2025-06-01',
      timezone: 'Asia/Bangkok', notes: '', previousAnnualCycleId: null,
    }, 'พยายามแก้ตรง')).rejects.toThrow('ต้องแก้ด้วย Correction')
  })

  it('denies cross-farm cycle access', async () => {
    const repository = new MockAnnualCycleRepository()
    await expect(repository.correctCycle({
      ...ownerContext,
      farm: { ...ownerContext.farm, farmId: 'farm_demo_south_02', farmCode: 'DEMO-F02' },
    }, 'annual_demo_north_2025_06', 'forged-cross-farm', {
      cycleCode: 'AFY-2025-06',
      name: 'forged',
      periodStart: '2025-06-01',
      timezone: 'Asia/Bangkok',
      notes: '',
      previousAnnualCycleId: null,
    }, 'forged')).rejects.toThrow('ข้ามสวน')
  })

  it('allows multiple Crop Cycles to reference one Annual Cycle without changing its meaning', async () => {
    const annualRepository = new MockAnnualCycleRepository()
    const commercialRepository = new MockCommercialTraceabilityRepository(annualRepository)
    const annualCycleId = 'annual_demo_north_2026_06'
    const first = await commercialRepository.createCropCycle(ownerContext, 'crop-annual-one', {
      annualCycleId,
      cycleCode: 'CROP-ANNUAL-LINK-01',
      name: 'Crop Cycle เชื่อมรอบปีหนึ่ง',
      stage: 'FLOWERING',
      zoneCodes: ['Z01'],
      varietyReference: 'VARIETY-DEMO-ONLY',
      expectedHarvestDate: null,
    })
    const second = await commercialRepository.createCropCycle(ownerContext, 'crop-annual-two', {
      annualCycleId,
      cycleCode: 'CROP-ANNUAL-LINK-02',
      name: 'Crop Cycle เชื่อมรอบปีสอง',
      stage: 'EARLY_FRUIT',
      zoneCodes: ['Z01'],
      varietyReference: 'VARIETY-DEMO-ONLY',
      expectedHarvestDate: null,
    })
    expect(first.cropCycleId).not.toBe(second.cropCycleId)
    expect([first.annualCycleId, second.annualCycleId]).toEqual([annualCycleId, annualCycleId])
  })

  it('denies Annual Cycle ownership actions to Manager and planning actions to Worker', async () => {
    const repository = new MockAnnualCycleRepository()
    const manager = {
      ...ownerContext,
      actor: { ...ownerContext.actor, userId: 'user_demo_manager_03' },
      farm: { ...ownerContext.farm, role: 'FARM_MANAGER' as const, isOrganizationOwner: false },
    }
    await expect(repository.createCycle(manager, 'manager-create-cycle', {
      cycleCode: 'AFY-MANAGER', name: 'ห้ามสร้าง', periodStart: '2030-06-01',
      timezone: 'Asia/Bangkok', notes: '', previousAnnualCycleId: null,
    })).rejects.toThrow('เฉพาะ Owner')

    const worker = {
      ...manager,
      actor: { ...manager.actor, userId: 'user_demo_worker_02' },
      farm: { ...manager.farm, role: 'WORKER' as const },
    }
    await expect(repository.createPlanItem(worker, 'annual_demo_north_2026_06', 'worker-plan', {
      title: 'ห้ามสร้าง', category: 'CARE',
      target: { scope: 'FARM', zoneCodes: [], positionIds: [] },
      triggerType: 'DATE_WINDOW', plannedStart: '2026-09-01',
      plannedEndExclusive: '2026-10-01', cropStage: null, conditionNote: '',
      responsibleRole: 'WORKER', plannedQuantity: null, plannedUnit: '',
      plannedDirectCostBaht: null, notes: '',
    }))
      .rejects.toThrow('ไม่มีสิทธิ์จัดทำแผน')
  })
})
