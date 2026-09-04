import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import type { FarmAccess } from '../domain/farm'
import type { TreePositionSummary } from '../domain/treeRegister'
import { OrchardTargetSelector } from './OrchardTargetSelector'

const farm: FarmAccess = {
  organizationId: 'org_demo_000000000001', organizationName: 'องค์กรจำลอง', organizationCode: 'DEMO',
  farmId: 'farm_demo_000000000001', farmCode: 'DEMO-F01', farmSequence: 'F01', farmName: 'สวนจำลอง',
  farmStatus: 'ACTIVE', membershipStatus: 'ACTIVE', role: 'ORG_OWNER', isOrganizationOwner: true, isMock: true,
}

function position(zoneCode: string, rowCode: string, treeSequence: number): TreePositionSummary {
  const token = `${zoneCode}${rowCode}${treeSequence}`.replaceAll(/[^A-Za-z0-9]/gu, '').padEnd(12, '0')
  return {
    organizationId: farm.organizationId, farmId: farm.farmId, positionId: `pos_${token}`,
    organizationCode: 'DEMO', farmSequence: 'F01', zoneCode, rowCode, treeSequence,
    tagCode: `DEMO-F01-${zoneCode}-${rowCode}-T${String(treeSequence).padStart(3, '0')}`,
    rowCountingDirection: 'TBD', positionStatus: 'ACTIVE', currentCycleNumber: 1,
    qrPath: `/t/pos_${token}`, version: 1, exampleData: true,
    currentCycle: {
      cycleId: `cycle_${token}`, cycleNumber: 1, variety: 'พันธุ์จำลอง', varietyConfidence: 'estimated',
      plantingYear: null, plantingYearCalendar: null, plantingYearConfidence: 'unknown', plantSource: null,
      treeStatus: 'normal', baselineMeasurements: { gps: null, trunk: null, canopy: null, height: null },
      baselineDate: '2026-09-01', notes: 'SIMULATED/TEST ONLY', startedAtLabel: 'SIMULATED',
      endedAtLabel: null, version: 1,
    },
  }
}

const positions = [
  position('Z01', 'R01', 1),
  position('Z01', 'R02', 1),
  position('Z02', 'R01', 1),
  position('Z03', 'R01', 1),
]

function SelectorHarness() {
  const [selectedPositionIds, setSelectedPositionIds] = useState<readonly string[]>([])
  return <OrchardTargetSelector
    farm={farm}
    onChange={setSelectedPositionIds}
    positions={positions}
    selectedPositionIds={selectedPositionIds}
    selectionMode="MULTIPLE"
  />
}

describe('OrchardTargetSelector', () => {
  it('switches row direction without changing the selected position and shows its number below the tree marker', async () => {
    const user = userEvent.setup()
    render(<SelectorHarness />)

    const positionButton = screen.getByRole('button', { name: /DEMO-F01-Z01-R01-T001/u })
    expect(positionButton.querySelector('.orchard-tree__marker')).toBeInTheDocument()
    expect(positionButton.querySelector('.orchard-tree__tag')).toHaveTextContent('T001')

    await user.click(positionButton)
    await user.click(screen.getByRole('button', { name: /แถวแนวนอน/u }))

    expect(screen.getByRole('button', { name: /แถวแนวนอน/u })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Z01 แถวแนวนอน ต้นเรียงจากซ้ายไปขวา')).toHaveClass('orchard-rows--horizontal')
    expect(positionButton).toHaveAttribute('aria-pressed', 'true')
  })

  it('keeps one selection across plan and checklist views for multiple zones', async () => {
    const user = userEvent.setup()
    render(<SelectorHarness />)

    expect(screen.getByRole('heading', { name: 'Z01' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Z02' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Z03' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /ตารางติ๊กเลือก/u }))
    await user.click(screen.getByRole('checkbox', { name: /DEMO-F01-Z01-R01-T001/u }))
    await user.click(screen.getByRole('checkbox', { name: /DEMO-F01-Z03-R01-T001/u }))
    expect(screen.getByText('Z01 1 · Z03 1')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /แปลนต้น/u }))
    expect(screen.getByRole('button', { name: /DEMO-F01-Z01-R01-T001/u })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: /DEMO-F01-Z03-R01-T001/u })).toHaveAttribute('aria-pressed', 'true')
  })
})
