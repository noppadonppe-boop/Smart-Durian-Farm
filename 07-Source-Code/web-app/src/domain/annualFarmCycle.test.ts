import { describe, expect, it } from 'vitest'

import {
  assertAnnualCycleAvailability,
  assertAnnualCycleTransition,
  calculatePeriodEndExclusive,
  inclusivePeriodEnd,
  validateAnnualPlanItem,
  type AnnualCycleRecord,
} from './annualFarmCycle'

const cycle: AnnualCycleRecord = {
  organizationId: 'org_demo',
  farmId: 'farm_demo',
  annualCycleId: 'annual_cycle_demo_2026',
  cycleCode: 'AFY-2026-06',
  name: 'รอบปีจำลอง 2569/2570',
  periodStart: '2026-06-01',
  periodEndExclusive: '2027-06-01',
  timezone: 'Asia/Bangkok',
  notes: 'SIMULATED/TEST ONLY',
  previousAnnualCycleId: null,
  status: 'ACTIVE',
  revision: 1,
  supersedesRevisionId: null,
  lastCorrectionId: null,
  version: 1,
  createdBy: 'user_demo',
  updatedBy: 'user_demo',
  createdAtLabel: 'เวลาจำลอง',
  updatedAtLabel: 'เวลาจำลอง',
  exampleData: true,
}

describe('Annual Farm Management Cycle', () => {
  it('derives a June-May annual period and inclusive display end', () => {
    expect(calculatePeriodEndExclusive('2026-06-01')).toBe('2027-06-01')
    expect(inclusivePeriodEnd('2027-06-01')).toBe('2027-05-31')
  })

  it('handles leap-day custom starts safely', () => {
    expect(calculatePeriodEndExclusive('2024-02-29')).toBe('2025-03-01')
    expect(inclusivePeriodEnd('2025-03-01')).toBe('2025-02-28')
  })

  it('rejects overlapping periods', () => {
    expect(() => assertAnnualCycleAvailability({
      cycleCode: 'AFY-OVERLAP',
      name: 'รอบทับกัน',
      periodStart: '2027-05-15',
      timezone: 'Asia/Bangkok',
      notes: '',
      previousAnnualCycleId: cycle.annualCycleId,
    }, [cycle])).toThrow('ช่วงรอบปีทับ')
  })

  it('allows only one active or closing cycle per farm', () => {
    expect(() => assertAnnualCycleTransition('PLANNED', 'ACTIVE', [cycle], 'other_cycle'))
      .toThrow('มีรอบที่กำลังดำเนินการ')
  })

  it('keeps farm and zone plans simple and validates exceptional tree sets', () => {
    expect(validateAnnualPlanItem({
      title: 'แผนดูแล Z01',
      category: 'CARE',
      target: { scope: 'ZONE', zoneCodes: ['Z01'], positionIds: [] },
      triggerType: 'DATE_WINDOW',
      plannedStart: '2026-06-15',
      plannedEndExclusive: '2026-07-01',
      cropStage: null,
      conditionNote: '',
      responsibleRole: 'FARM_MANAGER',
      plannedQuantity: null,
      plannedUnit: '',
      plannedDirectCostBaht: null,
      notes: 'SIMULATED/TEST ONLY',
    }, cycle).target.scope).toBe('ZONE')

    expect(() => validateAnnualPlanItem({
      title: 'แผนรายต้นแต่ไม่มีต้น',
      category: 'CARE',
      target: { scope: 'TREE_SET', zoneCodes: ['Z01'], positionIds: [] },
      triggerType: 'CONDITION',
      plannedStart: '2026-06-15',
      plannedEndExclusive: '2026-07-01',
      cropStage: null,
      conditionNote: 'ข้อยกเว้นจำลอง',
      responsibleRole: 'FARM_MANAGER',
      plannedQuantity: null,
      plannedUnit: '',
      plannedDirectCostBaht: null,
      notes: '',
    }, cycle)).toThrow('ต้องมี Position')
  })
})
