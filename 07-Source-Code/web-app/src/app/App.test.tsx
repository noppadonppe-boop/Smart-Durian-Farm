import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'

import { createTreeRegisterTemplateFile } from '../services/treeRegisterSpreadsheet'
import { routes } from './router'

function renderApp(initialEntry = '/') {
  sessionStorage.clear()
  const router = createMemoryRouter(routes, { initialEntries: [initialEntry] })
  render(<RouterProvider router={router} />)
  return router
}

async function signIn(
  phoneNumber = '+16505550101',
  otp = '111111',
) {
  const user = userEvent.setup()
  await screen.findByRole('heading', { name: 'เข้าสู่ Smart Durian Farm' })
  const phoneInput = screen.getByLabelText('หมายเลขโทรศัพท์ทดสอบ')
  await user.clear(phoneInput)
  await user.type(phoneInput, phoneNumber)
  await user.click(screen.getByRole('button', { name: 'ขอรหัส OTP ทดสอบ' }))
  const otpInput = await screen.findByLabelText('รหัส OTP 6 หลัก')
  await user.type(otpInput, otp)
  await user.click(screen.getByRole('button', { name: 'ยืนยัน OTP' }))
  await screen.findAllByText('DEMO-F01')
  return user
}

describe('Smart Durian local mock app', () => {
  it('signs in as the development administrator with one click and no OTP', async () => {
    renderApp()
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'เข้าสู่ระบบโดยผู้ดูแล' }))

    expect(await screen.findByRole('heading', { name: 'ภาพรวมสวนที่เปิดอยู่' })).toBeInTheDocument()
    expect(screen.getAllByText('สวนสาธิตเหนือ — ข้อมูลจำลอง').length).toBeGreaterThan(0)
    expect(screen.getByText(/Mock offline adapter/u)).toBeInTheDocument()
    expect(screen.queryByLabelText('รหัส OTP 6 หลัก')).not.toBeInTheDocument()
    expect(
      within(screen.getByRole('complementary', { name: 'เมนูหลักบนจอใหญ่' }))
        .getByText(/เจ้าขององค์กร/u),
    ).toBeInTheDocument()
  })

  it('signs in with a test OTP and shows trusted farm context', async () => {
    renderApp()
    await signIn()

    expect(screen.getAllByText('สวนสาธิตเหนือ — ข้อมูลจำลอง').length).toBeGreaterThan(0)
    expect(screen.getAllByText('DEMO-F01').length).toBeGreaterThan(0)
    expect(
      screen.getByText(/ข้อมูลจำลองเท่านั้น.*ไม่เชื่อม Production/u),
    ).toBeInTheDocument()
  })

  it('applies explicit dark and light theme tokens while retaining system mode', async () => {
    renderApp()
    const user = await signIn()
    const themeButton = screen.getByRole('button', { name: /ธีมปัจจุบัน/u })

    expect(document.documentElement.dataset.theme).toBe('system')
    expect(document.documentElement.style.colorScheme).toBe('light dark')

    await user.click(themeButton)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')

    await user.click(themeButton)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(document.documentElement.style.colorScheme).toBe('light')
  })

  it('navigates between main routes', async () => {
    renderApp()
    const user = await signIn()

    const workLinks = screen.getAllByRole('link', { name: /งาน/u })
    await user.click(workLinks[workLinks.length - 1]!)

    expect(await screen.findByRole('heading', { name: 'งานในสวนปัจจุบัน', level: 1 })).toBeInTheDocument()
  })

  it('keeps the user manual at the bottom of the desktop sidebar and opens it for every role', async () => {
    renderApp()
    const user = await signIn('+16505550102', '222222')

    const sidebar = screen.getByRole('complementary', { name: 'เมนูหลักบนจอใหญ่' })
    const sidebarLinks = within(sidebar).getAllByRole('link')
    const manualLink = sidebarLinks.at(-1)
    expect(manualLink).toHaveAccessibleName('คู่มือผู้ใช้')

    const mobileNavigation = screen.getByRole('navigation', { name: 'เมนูหลักบนมือถือ' })
    expect(within(mobileNavigation).queryByRole('link', { name: 'คู่มือผู้ใช้' })).not.toBeInTheDocument()

    await user.click(manualLink!)
    expect(await screen.findByRole('heading', { name: 'คู่มือผู้ใช้', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'หน้าที่และข้อห้ามของผู้ใช้ 7 บทบาท' })).toBeInTheDocument()
    expect(screen.getByText('WORKER')).toBeInTheDocument()
    expect(screen.getByText(/External PA-1 เป็น NO-GO\/BLOCKED/u)).toBeInTheDocument()
  })

  it('resolves an authorized permanent QR route to the Tree Register', async () => {
    renderApp('/t/pos_demo_a01f783bc219')
    await signIn()

    expect(await screen.findByRole('heading', { name: 'DEMO-F01-Z01-R01-T001' })).toBeInTheDocument()
    expect(screen.getByText(/ตรวจสิทธิ์แล้ว/u)).toBeInTheDocument()
  })

  it('lists only positions in the current farm and opens a tree profile', async () => {
    renderApp('/trees')
    const user = await signIn()

    const tree = await screen.findByRole('link', { name: /DEMO-F01-Z01-R01-T001/u })
    expect(screen.queryByText('DEMO-F02-Z01-R01-T001')).not.toBeInTheDocument()
    await user.click(tree)
    expect(await screen.findByRole('heading', { name: 'DEMO-F01-Z01-R01-T001' })).toBeInTheDocument()
    expect(screen.getByText(/QR permanent route/u)).toBeInTheDocument()
  })

  it('selects a farm-scoped tree from the structural orchard plan and carries it to Work creation', async () => {
    renderApp('/orchard-layout')
    const user = await signIn()

    expect(await screen.findByRole('heading', { name: 'แปลนสวนและเลือกตำแหน่ง' })).toBeInTheDocument()
    expect(screen.getByText(/แถวเรียงซ้ายไปขวา/u)).toBeInTheDocument()
    expect(screen.queryByText('DEMO-F02-Z01-R01-T001')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Z01' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Z02' })).toBeInTheDocument()
    expect(screen.getByText('สร้างงานทั่วไป')).toBeInTheDocument()
    expect(screen.getByText('สร้างงานดูแล')).toBeInTheDocument()
    expect(screen.getByText('รายงานอาการ/โรค')).toBeInTheDocument()
    expect(screen.getByText('บันทึกจำนวนผล')).toBeInTheDocument()
    expect(screen.getByText('สร้าง Harvest Lot')).toBeInTheDocument()

    const position = screen.getByRole('button', { name: /DEMO-F01-Z01-R01-T001/u })
    await user.click(position)
    expect(position).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('link', { name: /สร้างงานดูแล/u })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /รายงานอาการ\/โรค/u })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /บันทึกจำนวนผล/u })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /สร้าง Harvest Lot/u })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /ตารางติ๊กเลือก/u }))
    expect(screen.getByRole('checkbox', { name: /DEMO-F01-Z01-R01-T001/u })).toBeChecked()
    await user.click(screen.getByRole('link', { name: /สร้างงานทั่วไป/u }))

    expect(await screen.findByRole('heading', { name: 'สร้าง Work Order จำลอง' })).toBeInTheDocument()
    expect(await screen.findByText('เลือกแล้ว 1 ตำแหน่ง')).toBeInTheDocument()
    expect(screen.getByLabelText('Category')).toHaveValue('GENERAL')
  })

  it('downloads an Excel template and previews an Excel/Google Sheets file before import', async () => {
    renderApp('/trees')
    const user = await signIn()

    expect(await screen.findByRole('button', { name: 'ดาวน์โหลดแม่แบบ Excel ภาษาไทย' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'นำเข้า Excel / Google Sheets / CSV' }))
    expect(await screen.findByRole('heading', { name: 'ตรวจและนำเข้าทะเบียนต้น' })).toBeInTheDocument()
    expect(screen.getByText(/ไม่มีการเชื่อม Google API/u)).toBeInTheDocument()

    const template = createTreeRegisterTemplateFile({
      farmCode: 'DEMO-F01',
      organizationCode: 'DEMO',
      farmSequence: 'F01',
    })
    const file = new File(
      [await template.blob.arrayBuffer()],
      template.fileName,
      { type: template.blob.type },
    )
    await user.upload(screen.getByLabelText('ไฟล์ Excel (.xlsx) หรือ CSV (.csv)'), file)
    expect(await screen.findByText(/Excel · ชีต ทะเบียนตำแหน่ง/u)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'ตรวจตัวอย่างและข้อมูลซ้ำ' }))
    expect(await screen.findByText(/ยังไม่มีแถวข้อมูลภาคสนาม/u)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ยืนยันนำเข้า 0 ตำแหน่ง/u })).toBeDisabled()
  })

  it('blocks a mismatched scan from becoming the expected position', async () => {
    renderApp('/scan?expected=pos_demo_a01f783bc219')
    const user = await signIn()

    await user.click(await screen.findByRole('button', { name: 'จำลองสแกนผิดต้น' }))
    expect(await screen.findByRole('heading', { name: 'ป้ายนี้ไม่ตรงกับงาน' })).toBeInTheDocument()
    expect(screen.getByText(/ระบบหยุด action ของต้นเดิม/u)).toBeInTheDocument()
  })

  it('keeps manual entry available when camera APIs are unavailable', async () => {
    renderApp('/scan')
    const user = await signIn()

    await user.click(await screen.findByRole('button', { name: 'เปิดกล้อง QR' }))
    expect(await screen.findByText(/ใช้การกรอกรหัสด้วยมือแทนได้/u)).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'รหัส Tag, QR URL หรือ Position ID' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'ตรวจรหัส' })).toBeEnabled()
  })

  it('denies a QR route from another farm without exposing its tag', async () => {
    renderApp('/t/pos_demo_b01d825ac619')
    await signIn()

    expect(await screen.findByRole('heading', { name: 'ไม่มีสิทธิ์เปิด QR นี้' })).toBeInTheDocument()
    expect(screen.queryByText('DEMO-F02-Z01-R01-T001')).not.toBeInTheDocument()
  })

  it('switches only between authorized farms and shows a different role', async () => {
    renderApp()
    const user = await signIn()

    await user.click(screen.getByRole('button', { name: /สวนปัจจุบัน/u }))
    expect(screen.getByRole('button', { name: /สวนสาธิตใต้/u })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /สวนสาธิตใต้/u }))

    expect(screen.getAllByText('DEMO-F02').length).toBeGreaterThan(0)
    expect(screen.getAllByText('ผู้จัดการสวน').length).toBeGreaterThan(0)
  })

  it('remounts the active route when Farm changes so stale records cannot remain visible', async () => {
    renderApp('/work')
    const user = await signIn()
    expect(await screen.findByText('ตรวจต้นและบันทึกสภาพจำลอง')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /สวนปัจจุบัน/u }))
    await user.click(screen.getByRole('button', { name: /สวนสาธิตใต้/u }))

    expect(await screen.findByText('งานคนละสวนจำลอง')).toBeInTheDocument()
    expect(screen.queryByText('ตรวจต้นและบันทึกสภาพจำลอง')).not.toBeInTheDocument()
    expect(screen.getByText(/1 งาน.*ผู้ใช้/u)).toBeInTheDocument()
    expect(screen.getAllByText('DEMO-F02').length).toBeGreaterThan(0)
  })

  it('keeps a pending operation scoped to the original farm when switching', async () => {
    renderApp('/more')
    const user = await signIn()

    await user.click(screen.getByRole('button', { name: 'เพิ่มรายการค้างส่งจำลอง' }))
    await user.click(screen.getByRole('button', { name: /สวนปัจจุบัน/u }))
    await user.click(screen.getByRole('button', { name: /สวนสาธิตใต้/u }))

    expect(screen.getByRole('dialog', { name: 'ยืนยันการเปลี่ยนสวน' })).toBeInTheDocument()
    expect(screen.getByText(/รายการเหล่านี้จะยังผูกกับสวนเดิม/u)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'ยืนยันเปลี่ยนสวน' }))

    expect(screen.getByText('0 รายการค้างในสวนนี้ · 1 รายการรวมทุกสวน')).toBeInTheDocument()
  })

  it('hides membership and audit admin actions from a worker', async () => {
    renderApp('/more')
    await signIn('+16505550102', '222222')

    expect(screen.queryByRole('link', { name: /สมาชิกและสิทธิ์/u })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /ประวัติ Audit/u })).not.toBeInTheDocument()
  })

  it('shows More → Farm Management only to ORG_OWNER and lists four deterministic profiles', async () => {
    renderApp('/more')
    const owner = await signIn()

    await owner.click(screen.getByRole('link', { name: /จัดการสวน/u }))
    expect(await screen.findByRole('heading', { name: 'จัดการสวน' })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /DEMO-F01/u })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /DEMO-F02/u })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /DEMO-F03/u })).toBeInTheDocument()
    expect(await screen.findByRole('link', { name: /DEMO-F04/u })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'เพิ่มสวน' })).toBeInTheDocument()
  })

  it('creates a Farm with a derived code and never exposes a hard-delete action', async () => {
    renderApp('/farm-management/new')
    const owner = await signIn()

    await owner.type(screen.getByLabelText('ชื่อสวน'), 'สวนใหม่จำลอง')
    await owner.type(screen.getByLabelText('Farm Sequence'), 'F05')
    expect(screen.getByText('DEMO-F05')).toBeInTheDocument()
    await owner.click(screen.getByRole('button', { name: 'สร้างสวนจำลอง' }))

    expect(await screen.findByRole('heading', { name: 'สวนใหม่จำลอง' })).toBeInTheDocument()
    expect(screen.getByText(/Farm \+ Owner membership \+ Audit แบบ atomic/u)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ลบสวนถาวร|Hard delete/u })).not.toBeInTheDocument()
  })

  it('keeps a member Farm Profile read-only and blocks Archive while open/Pending work exists', async () => {
    renderApp('/more')
    const worker = await signIn('+16505550102', '222222')
    expect(screen.queryByRole('link', { name: /จัดการสวน/u })).not.toBeInTheDocument()
    await worker.click(screen.getByRole('link', { name: /ข้อมูลสวน/u }))
    expect(await screen.findByText(/บทบาทนี้แก้ไขไม่ได้/u)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'บันทึก Farm Profile' })).not.toBeInTheDocument()

    await worker.click(screen.getByRole('button', { name: 'ออกจากระบบ' }))
    const owner = await signIn()
    const router = screen.getByRole('link', { name: 'รายการสวน' })
    await owner.click(router)
    await owner.click(await screen.findByRole('link', { name: /DEMO-F01/u }))
    await owner.click(await screen.findByRole('button', { name: 'ตรวจรายการก่อนเก็บถาวร' }))
    expect(await screen.findByRole('heading', { name: 'ตรวจผลกระทบก่อนเก็บถาวร' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'ยืนยันเก็บถาวร' })).toBeDisabled()
  })

  it('creates and assigns a Work Order with an instruction photo', async () => {
    renderApp('/work/new')
    const owner = await signIn()

    await owner.upload(
      screen.getByLabelText(/รูปประกอบใบงาน/u),
      new File(['instruction'], 'instruction.png', { type: 'image/png' }),
    )
    await owner.click(screen.getByRole('button', { name: 'สร้างและมอบหมายงานจำลอง' }))

    expect(await screen.findByRole('heading', { name: 'ตรวจดูแลต้นจำลอง' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'รูปประกอบจากผู้มอบหมายงาน' })).toBeInTheDocument()
    expect(await screen.findByRole('img', { name: 'รูปประกอบใบงาน 1' })).toBeInTheDocument()
  })

  it('completes the Phase 4 worker QR/photo report and owner verification flow', async () => {
    renderApp('/work/work_demo_tree_000001')
    const worker = await signIn('+16505550102', '222222')

    expect(await screen.findByRole('heading', { name: 'ตรวจต้นและบันทึกสภาพจำลอง' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'รูปประกอบจากผู้มอบหมายงาน' })).toBeInTheDocument()
    await worker.click(screen.getByRole('button', { name: 'รับงาน' }))
    await worker.click(await screen.findByRole('button', { name: 'เริ่มงาน' }))
    await worker.click(await screen.findByRole('link', { name: 'เปิด QR/Manual confirmation' }))
    await screen.findByRole('option', { name: 'DEMO-F01-Z01-R01-T001' })
    await worker.click(screen.getByRole('button', { name: 'จำลองสแกนตรงต้น' }))
    await worker.click(await screen.findByRole('button', { name: 'ยืนยันกับ Work Order' }))

    expect(await screen.findByText('ยืนยันต้นเป้าหมายแล้ว')).toBeInTheDocument()
    await worker.upload(
      screen.getByLabelText('ภาพก่อนทำงาน'),
      new File(['before'], 'before.png', { type: 'image/png' }),
    )
    await worker.upload(
      screen.getByLabelText('ภาพหลังทำงาน'),
      new File(['after'], 'after.png', { type: 'image/png' }),
    )
    await worker.click(screen.getByRole('button', { name: 'บันทึกรายงานครบชุด' }))
    expect(await screen.findByText('บันทึกรายงานและภาพหลักฐานครบชุดแล้ว')).toBeInTheDocument()
    await worker.click(screen.getByRole('button', { name: 'ส่งตรวจ' }))
    expect(await screen.findByText('บันทึก SUBMIT แล้ว')).toBeInTheDocument()

    await worker.click(screen.getByRole('button', { name: 'ออกจากระบบ' }))
    const owner = await signIn()
    expect(await screen.findByRole('heading', { name: 'รูปหลักฐานที่คนงานส่ง' })).toBeInTheDocument()
    await owner.click(await screen.findByRole('button', { name: 'ตรวจรับ' }))
    expect(await screen.findByText('บันทึก VERIFY แล้ว')).toBeInTheDocument()
    const workLinks = screen.getAllByRole('link', { name: 'งาน' })
    await owner.click(workLinks[workLinks.length - 1]!)
    await owner.click(await screen.findByRole('link', { name: /Care Events/u }))
    expect(await screen.findByRole('heading', { name: 'ตรวจต้น' })).toBeInTheDocument()
  })

  it('keeps Disease assessment inputs scoped to the selected incident and shows its audit', async () => {
    renderApp('/disease')
    const agronomist = await signIn('+16505550105', '555555')

    expect(await screen.findByRole('link', { name: 'DEMO-F01-Z01-R01-T002' })).toBeInTheDocument()
    expect(screen.getByText('1 เคส · DEMO-F01 · ข้อมูลจำลองเท่านั้น')).toBeInTheDocument()

    const suspectedInputs = screen.getAllByLabelText('Suspected diagnosis')
    await agronomist.type(suspectedInputs[suspectedInputs.length - 1]!, 'ข้อสงสัยจำลอง')
    await agronomist.type(screen.getByLabelText('Confirmed diagnosis'), 'ผลยืนยันจำลอง')
    await agronomist.type(screen.getByLabelText('Treatment plan'), 'แผนติดตามจำลอง')
    await agronomist.click(screen.getByRole('button', { name: 'ยืนยัน assessment' }))

    expect(await screen.findByText('Agronomist บันทึก diagnosis และ treatment จำลองแล้ว')).toBeInTheDocument()
    expect(screen.getByText('กำลังรักษา')).toBeInTheDocument()
    await agronomist.click(screen.getByText(/ประวัติเคส 1 เหตุการณ์/u))
    expect(screen.getByText('ASSESSMENT_RECORDED')).toBeInTheDocument()
  })

  it('runs the approved P1 deterministic mock analysis without camera or external AI', async () => {
    renderApp('/work')
    const owner = await signIn()

    await owner.click(await screen.findByRole('link', { name: 'ศูนย์วิเคราะห์โรคจำลอง' }))

    expect(await screen.findByRole('heading', { name: 'ศูนย์วิเคราะห์โรคจำลอง', level: 1 })).toBeInTheDocument()
    expect(screen.getByText(/P1 — Approved/u)).toBeInTheDocument()
    expect(screen.getByText(/SIMULATED\/TEST ONLY · LOCAL\/EMULATOR/u)).toBeInTheDocument()
    expect((await screen.findAllByText(/candidate finding/u)).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: 'เปิดติดตามโรคปัจจุบัน' })).toHaveAttribute('href', '/disease')
    expect(screen.queryByRole('button', { name: /อัปโหลด|เปิดกล้อง/u })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'บันทึก Human Review' })).not.toBeInTheDocument()

    await owner.click(screen.getByRole('button', { name: 'สร้างผลวิเคราะห์จำลอง' }))
    expect(await screen.findByText(/สร้าง candidate finding จำลองแล้ว/u)).toBeInTheDocument()
    expect(screen.getAllByText(/diagnosis writeback/u).length).toBeGreaterThan(0)
  })

  it('allows only Agronomist to accept a P1 candidate while keeping diagnosis separate', async () => {
    renderApp('/disease-analysis-readiness')
    const agronomist = await signIn('+16505550105', '555555')

    expect(await screen.findByRole('heading', { name: 'ศูนย์วิเคราะห์โรคจำลอง', level: 1 })).toBeInTheDocument()
    await agronomist.click(screen.getAllByRole('button', { name: 'บันทึก Human Review' }).at(0)!)

    expect(await screen.findByText(/บันทึก Human Review แล้ว/u)).toBeInTheDocument()
    expect(screen.getByText(/ยังไม่ใช่ confirmed diagnosis/u)).toBeInTheDocument()
    expect(screen.getByText(/HUMAN_REVIEW_ACCEPTED/u)).toBeInTheDocument()
  })

  it('runs the Disease synthetic photo states without a camera or binary upload', async () => {
    renderApp('/disease')
    const agronomist = await signIn('+16505550105', '555555')

    await screen.findByRole('heading', { name: 'Disease-photo mock flow' })
    expect(screen.queryByLabelText(/ภาพ.*ไฟล์/u)).not.toBeInTheDocument()
    await agronomist.click(screen.getByRole('button', { name: 'เพิ่ม Placeholder รูปโรค' }))
    expect(await screen.findByText(/สถานะ Pending/u)).toBeInTheDocument()
    await agronomist.click(screen.getByRole('button', { name: 'เริ่ม Upload จำลอง' }))
    expect(await screen.findByText(/START_UPLOAD/u)).toBeInTheDocument()
    await agronomist.click(screen.getByRole('button', { name: 'จำลองล้มเหลว' }))
    expect(await screen.findByText(/mock upload failure/u)).toBeInTheDocument()
    await agronomist.click(screen.getAllByRole('button', { name: 'Retry จำลอง' }).at(-1)!)
    await agronomist.click(await screen.findByRole('button', { name: 'จำลองสำเร็จ' }))
    expect(await screen.findByText('Uploaded')).toBeInTheDocument()
    expect(screen.getAllByText(/EXIF\/GPS: ไม่มี/u).length).toBeGreaterThan(0)
  })

  it('runs one-click Disease photo to Treatment Work Order and shows the reverse link', async () => {
    renderApp('/disease')
    const agronomist = await signIn('+16505550105', '555555')

    const suspectedInputs = await screen.findAllByLabelText('Suspected diagnosis')
    await agronomist.type(suspectedInputs[suspectedInputs.length - 1]!, 'ข้อสงสัย One-click')
    await agronomist.type(screen.getByLabelText('Confirmed diagnosis'), 'ผลยืนยัน One-click')
    await agronomist.type(screen.getByLabelText('Treatment plan'), 'แผนรักษา One-click')
    await agronomist.click(screen.getByRole('button', { name: 'ยืนยัน assessment' }))
    await agronomist.click(await screen.findByRole('button', { name: 'One-click Mock Demo' }))

    expect(await screen.findByText(/One-click Mock Demo สำเร็จ/u)).toBeInTheDocument()
    const workLink = screen.getByRole('link', { name: /เปิด work_mock_/u })
    await agronomist.click(workLink)
    expect(await screen.findByText(/Treatment Work Order นี้ล็อก Farm\/Position/u)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Disease Incident disease_demo_/u })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'มอบหมายงานรักษา' })).toBeEnabled()
  })

  it('selects and resets deterministic development scenarios', async () => {
    renderApp('/dev/scenarios')
    const user = await signIn()

    expect(await screen.findByRole('heading', { name: 'Mock Scenario Center' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Permission Denied' }))
    expect(screen.getByText(/ไม่มี payload จากสวนเป้าหมาย/u)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Large-list' }))
    expect(screen.getByText('Synthetic case 60')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Reset deterministic baseline' }))
    expect(screen.getByText(/Baseline พร้อมสำหรับ Disease Incident/u)).toBeInTheDocument()
    expect(screen.getByText('Reset count ในรอบนี้: 1')).toBeInTheDocument()
  })

  it('shows a no-farm state without leaking farm data', async () => {
    renderApp()
    const user = userEvent.setup()
    await screen.findByRole('heading', { name: 'เข้าสู่ Smart Durian Farm' })
    const phoneInput = screen.getByLabelText('หมายเลขโทรศัพท์ทดสอบ')
    await user.clear(phoneInput)
    await user.type(phoneInput, '+16505550104')
    await user.click(screen.getByRole('button', { name: 'ขอรหัส OTP ทดสอบ' }))
    await user.type(await screen.findByLabelText('รหัส OTP 6 หลัก'), '444444')
    await user.click(screen.getByRole('button', { name: 'ยืนยัน OTP' }))

    expect(await screen.findByRole('heading', { name: 'บัญชีนี้ยังไม่มีสวน' })).toBeInTheDocument()
    expect(screen.queryByText('สวนสาธิตเหนือ — ข้อมูลจำลอง')).not.toBeInTheDocument()
  })

  it('denies an unauthorized farm deep link', async () => {
    renderApp('/farms/farm_not_authorized')
    await signIn()

    expect(await screen.findByRole('heading', { name: 'ไม่มีสิทธิ์เปิดสวนนี้' })).toBeInTheDocument()
    expect(screen.getByText(/ไม่มีข้อมูลจากสวนเป้าหมายถูกโหลด/u)).toBeInTheDocument()
  })

  it('traces a sales lot back to harvest, crop cycle and source trees', async () => {
    renderApp('/production')
    await signIn()

    expect(await screen.findByRole('heading', { name: 'ผลผลิตถึงการขาย ตรวจย้อนกลับได้' })).toBeInTheDocument()
    expect(screen.getAllByText('S-DEMO-N-001').length).toBeGreaterThan(0)
    expect(screen.getAllByText('H-DEMO-N-001').length).toBeGreaterThan(0)
    expect(screen.getAllByText('CROP-DEMO-N-2026-01').length).toBeGreaterThan(0)
    expect(screen.queryByText('H-DEMO-S-001')).not.toBeInTheDocument()
  })

  it('records a measured fruit observation with explicit method and limitations', async () => {
    renderApp('/production')
    const user = await signIn()
    await screen.findByRole('heading', { name: 'บันทึกจำนวนผลพร้อมฐานข้อมูล' })

    const quality = screen.getAllByLabelText('คุณภาพค่า')[0]!
    await user.selectOptions(quality, 'MEASURED')
    await user.selectOptions(screen.getByLabelText('ขอบเขตการนับ'), 'FULL_COUNT')
    const observedCount = screen.getAllByLabelText('จำนวนผล')[0]!
    await user.clear(observedCount)
    await user.type(observedCount, '125')
    await user.click(screen.getByRole('button', { name: 'บันทึก Fruit Observation' }))

    expect(await screen.findByText('บันทึก Fruit Observation จำลองแล้ว')).toBeInTheDocument()
    expect(screen.getByText(/125 fruit/u)).toBeInTheDocument()
  })

  it('prevents a double-submit from creating duplicate Fruit Observations', async () => {
    renderApp('/production')
    const user = await signIn()
    await screen.findByRole('heading', { name: 'บันทึกจำนวนผลพร้อมฐานข้อมูล' })

    await user.dblClick(screen.getByRole('button', { name: 'บันทึก Fruit Observation' }))

    expect(await screen.findByText('บันทึก Fruit Observation จำลองแล้ว')).toBeInTheDocument()
    expect(screen.getAllByText(/120 fruit/u)).toHaveLength(1)
  })

  it('runs the deterministic AI-assisted path and keeps human review editable', async () => {
    renderApp('/production')
    const user = await signIn()
    await screen.findByRole('heading', { name: 'บันทึกจำนวนผลพร้อมฐานข้อมูล' })

    await user.selectOptions(screen.getByLabelText('วิธีได้มาของจำนวน'), 'AI_ASSISTED')
    await user.click(screen.getByRole('button', { name: 'ให้ AI จำลองช่วยนับ' }))
    expect(await screen.findByText('เสนอให้คนตรวจ 59 ผล')).toBeInTheDocument()

    const observedCount = screen.getAllByLabelText('จำนวนผล')[0]!
    await user.clear(observedCount)
    await user.type(observedCount, '60')
    await user.click(screen.getByRole('button', { name: 'บันทึก Fruit Observation' }))

    expect(await screen.findByText('บันทึก Fruit Observation จำลองแล้ว')).toBeInTheDocument()
    expect(screen.getByText(/60 fruit/u)).toBeInTheDocument()
    expect(screen.getAllByText(/AI ช่วยนับ \+ คนตรวจ/u).length).toBeGreaterThan(0)
  })

  it('issues farm inventory once and shows the updated balance', async () => {
    renderApp('/inventory')
    const user = await signIn()
    await screen.findByRole('heading', { name: 'สต็อก วัสดุ และต้นทุนตรง' })

    const quantity = await screen.findByLabelText(/^จำนวน/u)
    await user.clear(quantity)
    await user.type(quantity, '1')
    await user.click(screen.getByRole('button', { name: 'บันทึก Movement' }))

    expect(await screen.findByText('บันทึก Inventory Movement และ Audit แล้ว')).toBeInTheDocument()
    expect(screen.getAllByText(/34 kg/u).length).toBeGreaterThan(0)
  })

  it('prevents a double-submit from issuing Inventory twice', async () => {
    renderApp('/inventory')
    const user = await signIn()
    await screen.findByRole('heading', { name: 'สต็อก วัสดุ และต้นทุนตรง' })

    await user.dblClick(screen.getByRole('button', { name: 'บันทึก Movement' }))

    expect(await screen.findByText('บันทึก Inventory Movement และ Audit แล้ว')).toBeInTheDocument()
    expect(screen.getAllByText(/34 kg/u).length).toBeGreaterThan(0)
    expect(screen.queryByText(/33 kg/u)).not.toBeInTheDocument()
  })

  it('keeps Inventory lot and unit coupled to the selected item', async () => {
    renderApp('/inventory')
    const user = await signIn()
    await screen.findByRole('heading', { name: 'สต็อก วัสดุ และต้นทุนตรง' })

    await user.selectOptions(screen.getByLabelText('Item'), 'inventory_item_demo_north_002')

    expect(screen.getByLabelText(/^Lot/u)).toHaveValue('inventory_lot_demo_north_002')
    expect(screen.getByLabelText(/^หน่วย/u)).toHaveValue('piece')
    expect(screen.queryByRole('option', { name: /LOT-DEMO-N-001/u })).not.toBeInTheDocument()
  })

  it('does not reveal commercial pages to a worker', async () => {
    renderApp('/production')
    await signIn('+16505550102', '222222')

    expect(await screen.findByRole('heading', { name: 'ไม่เปิดข้อมูลเชิงพาณิชย์สำหรับบทบาทนี้' })).toBeInTheDocument()
    expect(screen.queryByText('S-DEMO-N-001')).not.toBeInTheDocument()
  })

  it('shows a role-adapted Phase 6 Farm Dashboard', async () => {
    renderApp('/')
    await signIn('+16505550102', '222222')

    expect(await screen.findByRole('heading', { name: 'ภาพรวมสวนที่เปิดอยู่' })).toBeInTheDocument()
    expect(await screen.findByText('สุขภาพต้น')).toBeInTheDocument()
    expect(screen.getByText('งานเกินกำหนด / ใกล้ถึง')).toBeInTheDocument()
    expect(screen.queryByText('ยอดขาย / ค้าง')).not.toBeInTheDocument()
  })

  it('keeps Portfolio owner-only and excludes the hidden farm fixture', async () => {
    renderApp('/portfolio')
    await signIn()

    expect(await screen.findByRole('heading', { name: 'ภาพรวมหลายสวน' })).toBeInTheDocument()
    expect(screen.getAllByText('DEMO-F01').length).toBeGreaterThan(0)
    expect(screen.getAllByText('DEMO-F02').length).toBeGreaterThan(0)
    expect(screen.queryByText('DEMO-F99')).not.toBeInTheDocument()
  })

  it('queues an offline report and replays it once after reconnect', async () => {
    renderApp('/sync')
    const user = await signIn()
    await screen.findByRole('heading', { name: 'ศูนย์ซิงก์ รูป และข้อมูลขัดแย้ง' })

    await user.click(screen.getByRole('button', { name: 'จำลองสัญญาณขาด' }))
    await user.click(screen.getByRole('button', { name: 'บันทึกรายงาน Offline จำลอง' }))
    expect(await screen.findByText(/บันทึกในเครื่องแล้ว/u)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'จำลองกลับออนไลน์' }))
    await user.click(screen.getByRole('button', { name: 'Retry Pending ทั้งหมด' }))
    expect(await screen.findByText(/Retry สำเร็จโดยไม่สร้างเหตุการณ์ซ้ำ/u)).toBeInTheDocument()
  })

  it('creates a minimal farm-scoped export with audit evidence', async () => {
    renderApp('/audit')
    const user = await signIn()
    await screen.findByRole('heading', { name: 'Audit และ Export ตามสิทธิ์' })

    await user.click(screen.getByRole('button', { name: 'สร้าง Export พร้อม Audit' }))
    expect(await screen.findByText(/สร้าง Export จำลอง/u)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /ดาวน์โหลด CSV จำลอง/u })).toHaveAttribute('download')
    expect(await screen.findByText('สร้าง Export')).toBeInTheDocument()
  })
})
