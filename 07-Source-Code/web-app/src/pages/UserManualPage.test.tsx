import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

import { routes } from '../app/router'

describe('UserManualPage', () => {
  it('renders all key elder-friendly manual sections and steps', async () => {
    sessionStorage.clear()
    const router = createMemoryRouter(routes, { initialEntries: ['/'] })
    render(<RouterProvider router={router} />)
    const user = userEvent.setup()

    // Sign in as development admin
    await user.click(await screen.findByRole('button', { name: 'เข้าสู่ระบบโดยผู้ดูแล' }))
    expect(await screen.findByRole('heading', { name: 'ภาพรวมสวนที่เปิดอยู่' })).toBeInTheDocument()

    // Navigate to /manual
    await router.navigate('/manual')

    // Verify Title & Hero
    expect(await screen.findByRole('heading', { name: 'คู่มือชาวสวน ฉบับเข้าใจง่าย' })).toBeInTheDocument()
    expect(screen.getByText(/คู่มือสไตล์คนสวน ตัวหนังสือใหญ่ อ่านง่าย สบายตา/u)).toBeInTheDocument()

    // Verify Quick Navigation Items
    expect(screen.getByRole('link', { name: /1. เจอโรคทำอย่างไร/u })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /2. อัปเดตข้อมูลต้นไม้/u })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /3. สั่งงาน \/ จ่ายงาน/u })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /4. รับงาน & ส่งงาน/u })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /5. แปลนสวนผังวงกลม/u })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /6. สแกนป้าย QR/u })).toBeInTheDocument()

    // Verify Section 1: Disease steps 1 to 5
    expect(screen.getByText(/1. เมื่อเจอโรคหรือศัตรูพืช ต้องทำอย่างไร/u)).toBeInTheDocument()
    expect(screen.getByText(/เดินตรวจต้น & ถ่ายรูปอาการที่ตาเห็น/u)).toBeInTheDocument()
    expect(screen.getByText(/กดเปิดเมนู "โรค" แล้วกดบันทึกอาการที่พบ/u)).toBeInTheDocument()
    expect(screen.getByText(/หมอพืช \/ นักวิชาการเกษตร ตรวจวินิจฉัยและวางแผนรักษา/u)).toBeInTheDocument()
    expect(screen.getByText(/ออกใบสั่งงานรักษา \(สร้าง Treatment Work Order\)/u)).toBeInTheDocument()
    expect(screen.getByText(/คนงานรักษาเสร็จ และติดตามผลจนหายดี \(ปิดเคส\)/u)).toBeInTheDocument()

    // Verify Section 2: Tree Register steps
    expect(screen.getByText(/2. การอัปเดตข้อมูลต้นไม้ และจัดการทะเบียนต้น/u)).toBeInTheDocument()
    expect(screen.getByText(/กรณีพิเศษ ก: ถ้าต้นเดิมตาย แล้วปลูกต้นใหม่แทนที่/u)).toBeInTheDocument()
    expect(screen.getByText(/กรณีพิเศษ ข: ป้ายหัก ตัวหนังสือลบเลือน หรือ QR หลุดหาย/u)).toBeInTheDocument()

    // Verify Section 3: Work Order
    expect(screen.getByText(/3. การสร้างงาน และจ่ายงานให้คนงาน/u)).toBeInTheDocument()

    // Verify Section 4: Worker report Before/After
    expect(screen.getByText(/4. คนงานรับงาน และส่งรายงานการทำงาน/u)).toBeInTheDocument()
    expect(screen.getByText(/ถ่ายรูป "ก่อนทำ \(BEFORE\)"/u)).toBeInTheDocument()
    expect(screen.getByText(/ลงมือทำงานจริง แล้วถ่ายรูป "หลังทำ \(AFTER\)"/u)).toBeInTheDocument()

    // Verify FAQ
    expect(screen.getByText(/11. คำถามที่พบบ่อย และวิธีแก้ปัญหา \(FAQ\)/u)).toBeInTheDocument()
    expect(screen.getByText(/เข้าสู่ระบบไม่ได้ ต้องทำอย่างไร\?/u)).toBeInTheDocument()
    expect(screen.getByText(/สแกน QR Code ไม่ติด กล้องไม่ยอมอ่าน ทำอย่างไร\?/u)).toBeInTheDocument()
  })
})
