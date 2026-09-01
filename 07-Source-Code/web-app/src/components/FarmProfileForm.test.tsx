import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import type { FarmProfileDraft } from '../domain/farm'
import { FarmProfileForm } from './FarmProfileForm'

const emptyFarmProfileDraft: FarmProfileDraft = {
  farmName: '', farmSequence: '', province: 'TBD', district: 'TBD',
  subdistrict: 'TBD', locationNote: 'SIMULATED/TEST ONLY', timezone: 'Asia/Bangkok',
  seasonStartMonth: null, seasonEndMonth: null, seasonNote: 'TBD',
  notes: 'SIMULATED/TEST ONLY',
}

describe('FarmProfileForm', () => {
  it('previews a system-derived Farm Code and submits normalized values', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <FarmProfileForm
        initialValue={{
          ...emptyFarmProfileDraft,
          farmName: 'สวนใหม่จำลอง',
          farmSequence: 'F05',
        }}
        mode="CREATE"
        onSubmit={onSubmit}
        organizationCode="DEMO"
      />,
    )

    expect(screen.getByText('DEMO-F05')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'สร้างสวนจำลอง' }))
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({
      farmSequence: 'F05',
      timezone: 'Asia/Bangkok',
    }))
  })

  it('shows a corrective error when only one season month is filled', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(
      <FarmProfileForm
        initialValue={{
          ...emptyFarmProfileDraft,
          farmName: 'สวนใหม่จำลอง',
          farmSequence: 'F05',
          seasonStartMonth: 1,
        }}
        mode="CREATE"
        onSubmit={onSubmit}
        organizationCode="DEMO"
      />,
    )

    await user.click(screen.getByRole('button', { name: 'สร้างสวนจำลอง' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/กรอกเป็นคู่/u)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('keeps Farm Sequence immutable in edit mode and removes every edit action in read-only mode', () => {
    const { rerender } = render(
      <FarmProfileForm
        initialValue={{
          ...emptyFarmProfileDraft,
          farmName: 'สวนจำลอง',
          farmSequence: 'F01',
        }}
        mode="EDIT"
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        organizationCode="DEMO"
      />,
    )
    expect(screen.getByLabelText('Farm Sequence')).toBeDisabled()
    expect(screen.getByRole('button', { name: 'บันทึก Farm Profile' })).toBeInTheDocument()

    rerender(
      <FarmProfileForm
        initialValue={{
          ...emptyFarmProfileDraft,
          farmName: 'สวนจำลอง',
          farmSequence: 'F01',
        }}
        mode="READ_ONLY"
        organizationCode="DEMO"
      />,
    )
    expect(screen.queryByRole('button', { name: /บันทึก|สร้าง/u })).not.toBeInTheDocument()
    expect(screen.getByText(/บทบาทนี้แก้ไขไม่ได้/u)).toBeInTheDocument()
  })
})
