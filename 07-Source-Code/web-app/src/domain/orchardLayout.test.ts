import { describe, expect, it } from 'vitest'

import type { FarmAccess } from './farm'
import {
  buildOrchardLayout,
  navigationIntentFromState,
  positionIdsForAnchor,
  selectionFromNavigationState,
} from './orchardLayout'
import type { TreePositionSummary } from './treeRegister'

const farm: FarmAccess = {
  organizationId: 'org_demo_000000000001', organizationName: 'องค์กรจำลอง', organizationCode: 'DEMO',
  farmId: 'farm_demo_000000000001', farmCode: 'DEMO-F01', farmSequence: 'F01', farmName: 'สวนจำลอง',
  farmStatus: 'ACTIVE', membershipStatus: 'ACTIVE', role: 'ORG_OWNER', isOrganizationOwner: true, isMock: true,
}

function position(rowCode: string, treeSequence: number, zoneCode = 'Z01'): TreePositionSummary {
  const token = `${zoneCode}${rowCode}${treeSequence}`.replaceAll(/[^A-Za-z0-9]/gu, '').padEnd(12, '0')
  return {
    organizationId: farm.organizationId, farmId: farm.farmId, positionId: `pos_${token}`,
    organizationCode: 'DEMO', farmSequence: 'F01', zoneCode, rowCode, treeSequence,
    tagCode: `DEMO-F01-${zoneCode}-${rowCode}-T${String(treeSequence).padStart(3, '0')}`,
    rowCountingDirection: 'TBD',
    positionStatus: 'ACTIVE', currentCycleNumber: 1, qrPath: `/t/pos_${token}`, version: 1, exampleData: true,
    currentCycle: {
      cycleId: `cycle_${token}`, cycleNumber: 1, variety: 'พันธุ์จำลอง', varietyConfidence: 'estimated',
      plantingYear: null, plantingYearCalendar: null, plantingYearConfidence: 'unknown', plantSource: null, treeStatus: 'normal',
      baselineMeasurements: { gps: null, trunk: null, canopy: null, height: null },
      baselineDate: '2026-09-01', notes: 'SIMULATED/TEST ONLY', startedAtLabel: 'SIMULATED', endedAtLabel: null, version: 1,
    },
  }
}

describe('orchard layout', () => {
  it('orders rows left-to-right and tree positions top-to-bottom', () => {
    const layout = buildOrchardLayout(farm, [
      position('R02', 2), position('R01', 2), position('R02', 1), position('R01', 1),
      position('R01', 1, 'Z03'), position('R01', 1, 'Z02'),
    ])
    expect(layout.zones.map((zone) => zone.zoneCode)).toEqual(['Z01', 'Z02', 'Z03'])
    expect(layout.zones[0]?.rows.map((row) => row.rowCode)).toEqual(['R01', 'R02'])
    expect(layout.zones[0]?.rows[1]?.positions.map((item) => item.treeSequence)).toEqual([1, 2])
  })

  it('selects a complete row or zone from an anchor position', () => {
    const positions = [position('R01', 1), position('R01', 2), position('R02', 1)]
    expect(positionIdsForAnchor(positions, positions[0]!.positionId, 'ROW')).toEqual([
      positions[0]!.positionId, positions[1]!.positionId,
    ])
    expect(positionIdsForAnchor(positions, positions[0]!.positionId, 'ZONE')).toHaveLength(3)
  })

  it('fails closed for mixed-farm layout data and forged navigation state', () => {
    const foreign = { ...position('R01', 1), farmId: 'farm_other_000000001' }
    expect(() => buildOrchardLayout(farm, [foreign])).toThrow(/ข้ามสวน/u)
    expect(selectionFromNavigationState({ targetSelection: { source: 'ORCHARD_LAYOUT', farmId: 'farm_other_000000001', positionIds: [foreign.positionId] } }, farm.farmId)).toEqual([])
    expect(navigationIntentFromState({ targetSelection: { source: 'ORCHARD_LAYOUT', farmId: 'farm_other_000000001', intent: 'WORK_CARE' } }, farm.farmId)).toBeUndefined()
  })

  it('carries only a known workflow intent inside the current farm', () => {
    expect(navigationIntentFromState({ targetSelection: {
      source: 'ORCHARD_LAYOUT', farmId: farm.farmId, positionIds: [], intent: 'HARVEST_LOT',
    } }, farm.farmId)).toBe('HARVEST_LOT')
    expect(navigationIntentFromState({ targetSelection: {
      source: 'ORCHARD_LAYOUT', farmId: farm.farmId, positionIds: [], intent: 'UNKNOWN_ACTION',
    } }, farm.farmId)).toBeUndefined()
  })
})
