import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { routes } from './router'

function renderAnnualPage() {
  sessionStorage.clear()
  const router = createMemoryRouter(routes, { initialEntries: ['/annual-cycles'] })
  render(<RouterProvider router={router} />)
}

async function signInAsOwner() {
  const user = userEvent.setup()
  await user.click(await screen.findByRole('button', { name: 'เข้าสู่ระบบโดยผู้ดูแล' }, { timeout: 4000 }))
  await screen.findByRole('heading', { name: 'รอบบริหารสวนรายปี', level: 1 }, { timeout: 4000 })
  await screen.findByRole('button', { name: /AFY-2026-06/u }, { timeout: 4000 })
  return user
}

describe('Annual Farm Management Cycle page', () => {
  it('shows a farm-scoped year switcher and June-May active cycle', async () => {
    renderAnnualPage()
    await signInAsOwner()

    const switcher = await screen.findByLabelText('เลือกรอบบริหารสวนรายปี')
    expect(switcher).toHaveValue('annual_demo_north_2026_06')
    expect(screen.getAllByText(/2026-06-01.*2027-05-31/u).length).toBeGreaterThan(0)
    expect(screen.getByText('Farm / Zone first')).toBeInTheDocument()
    expect(screen.getByText('ติดตามข้อยกเว้นรายต้นจำลอง')).toBeInTheDocument()
  })

  it('creates a Zone plan and exposes correction-only controls for a closed cycle', async () => {
    renderAnnualPage()
    const user = await signInAsOwner()

    await user.click(screen.getByText('เพิ่มแผนระดับสวน / โซน / รายต้นเฉพาะกรณี'))
    const planForm = screen.getByRole('button', { name: 'เพิ่มแผน' }).closest('form')
    expect(planForm).not.toBeNull()
    const scoped = within(planForm!)
    await user.type(scoped.getByLabelText('ชื่อแผน'), 'แผนโซนทดสอบ')
    await user.selectOptions(scoped.getByLabelText('ระดับการวางแผน'), 'ZONE')
    await user.type(scoped.getByLabelText('รหัสโซน คั่นด้วยจุลภาค'), 'Z01, Z02')
    await user.click(scoped.getByRole('button', { name: 'เพิ่มแผน' }))
    expect(await screen.findByText('เพิ่มแผนประจำปีแล้ว')).toBeInTheDocument()
    expect(screen.getByText('แผนโซนทดสอบ')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /AFY-2025-06/u }))
    expect(await screen.findByText('ประวัติ Correction')).toBeInTheDocument()
    expect(screen.getByText('Revision 1 → 2')).toBeInTheDocument()
    expect(screen.getByText('Correction รอบที่เริ่มแล้ว / ปิดแล้ว')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /เปลี่ยนเป็น/u })).not.toBeInTheDocument()
  })
})
