import { useEffect } from 'react'

import { usePhase2 } from '../app/usePhase2'
import { roleLabels } from '../domain/farm'
import { PageHeader } from './PageHeader'

const roleGuides = [
  {
    code: 'ORG_OWNER',
    title: 'เจ้าขององค์กร',
    duty: 'ดูภาพรวมสวนที่ได้รับสิทธิ์ จัดการสมาชิก ตรวจ KPI, Audit และ Policy',
    caution: 'ห้ามใช้สิทธิ์ Owner ข้าม Farm ที่ไม่มี membership หรือข้าม Gate เพื่อ Deploy',
  },
  {
    code: 'FARM_MANAGER',
    title: 'ผู้จัดการสวน',
    duty: 'วางแผน มอบหมาย ตรวจรับงาน ตัดสิน Conflict และดูข้อมูลของสวนปัจจุบัน',
    caution: 'ห้ามแก้รายงานของ Worker หรือประวัติเดิมแบบเงียบ ๆ',
  },
  {
    code: 'AGRONOMIST',
    title: 'นักวิชาการเกษตร',
    duty: 'ตรวจอาการ ยืนยันการวินิจฉัย วางแผนดูแล และติดตามผลตามสิทธิ์',
    caution: 'แยกอาการที่พบออกจาก diagnosis และไม่ให้คำแนะนำสารเคมีอัตโนมัติ',
  },
  {
    code: 'WORKER',
    title: 'ผู้ปฏิบัติงาน',
    duty: 'รับงาน ยืนยันต้นด้วย QR บันทึกผล วัสดุ และรูป BEFORE/AFTER',
    caution: 'ห้ามทำงานต่อเมื่อ QR ผิดสวน/ผิดต้น หรือส่งงานขณะรูปยังอัปโหลดไม่ครบ',
  },
  {
    code: 'SALES_INVENTORY',
    title: 'ผลผลิต การขาย และคลัง',
    duty: 'ดูแล Harvest/Sales lot, Inventory movement และต้นทุนตรงตาม Farm scope',
    caution: 'ห้ามเดาหน่วย แก้ยอดย้อนหลัง หรือใช้ข้อมูลนี้แทนระบบบัญชี/ภาษี/ธนาคาร',
  },
  {
    code: 'VIEWER',
    title: 'ผู้ดูข้อมูล',
    duty: 'อ่านข้อมูลธุรกิจตามสิทธิ์โดยไม่มีการแก้ไข',
    caution: 'ไม่มี Audit หรือ Export โดยอัตโนมัติ',
  },
  {
    code: 'AUDITOR',
    title: 'ผู้ตรวจสอบ',
    duty: 'อ่าน Audit/Data Quality และ Export เฉพาะ assignment ที่ได้รับ',
    caution: 'ห้ามแก้ข้อมูลปฏิบัติการหรือเปิดข้อมูลนอกขอบเขตที่มอบหมาย',
  },
] as const

const workflows = [
  {
    title: 'ทะเบียนต้นและ QR',
    audience: 'Owner · Manager · Agronomist · Worker',
    steps: [
      'ตรวจชื่อและรหัสสวนที่ Header ก่อนทุกครั้ง',
      'Owner/Manager ดาวน์โหลดแม่แบบ Excel ภาษาไทยเพื่อเพิ่มหลายตำแหน่ง; ถ้าใช้ Google Sheets ให้ดาวน์โหลดกลับเป็น .xlsx หรือ .csv แล้วตรวจตัวอย่างก่อนยืนยัน',
      'ค้นหาต้นหรือเปิดงาน แล้วสแกน QR/กรอกรหัสด้วยมือ',
      'เทียบ Farm, Zone, Row, Position และรหัสต้นกับเป้าหมาย',
      'หากตรงจึงเปิด Timeline หรือเริ่มงาน; หากไม่ตรงให้หยุดและแจ้ง Manager',
      'ป้ายเสียหรือไม่พบข้อมูลให้บันทึกเหตุการณ์ ห้ามเดารหัสหรือใช้ข้อมูลต้นอื่นแทน',
    ],
  },
  {
    title: 'แปลนสวนและเลือกตำแหน่ง',
    audience: 'ตามสิทธิ์ของแต่ละ Workflow',
    steps: [
      'เปิด เพิ่มเติม → แปลนสวนและเลือกตำแหน่ง แล้วตรวจชื่อ/รหัสสวนปัจจุบัน',
      'เลือกใช้ “แปลนต้น” เพื่อดู Zone/Row/สถานะ หรือ “ตารางติ๊กเลือก” เพื่อเลือกหลายต้นได้เร็ว; สลับมุมมองแล้วตำแหน่งที่เลือกยังอยู่',
      'แต่ละ Zone เช่น Z01, Z02, Z03 แสดงแยกกัน; Row เรียงซ้ายไปขวาและต้นเรียงบนลงล่าง',
      'เลือกต้น หลายต้น ทั้งแถว หรือทั้งโซนตามงาน แล้วตรวจสรุปจำนวนและ Zone ก่อนดำเนินการ',
      'เลือกเมนูที่ต้องการ: งานทั่วไป งานดูแล รายงานอาการ/โรค บันทึกจำนวนผล หรือ Harvest Lot; เมนูที่ยังไม่เข้าเงื่อนไขจะแจ้งเหตุผล',
      'เมื่อเปิดฟอร์มปลายทางให้ตรวจตำแหน่งอีกครั้ง; งานรายต้นยังต้องยืนยัน QR/รหัสตามขั้นตอนเดิม',
    ],
  },
  {
    title: 'คำสั่งงานจนตรวจรับ',
    audience: 'Owner · Manager · Worker',
    steps: [
      'ผู้สร้างกรอกเป้าหมาย ประเภทงาน ผู้รับผิดชอบ Due date ขั้นตอน วัสดุ และรูปอ้างอิง 0–3 รูปขณะ Draft',
      'หลัง Assign รูปอ้างอิงเป็น Read-only; Worker เปิดดูและกดรับงาน',
      'งานรายต้นต้องสแกนยืนยันต้นก่อนเริ่ม',
      'Worker บันทึกผลจริง หน่วย วัสดุ Exception และรูป BEFORE/AFTER อย่างน้อยประเภทละ 1 รูป รวมไม่เกิน 6 รูป',
      'รอรูปทุกใบเป็น Uploaded แล้วจึงส่งตรวจ',
      'Manager ตรวจ target, เวลา, วัสดุ และรูป แล้วเลือก Approve, Request rework หรือ Reject พร้อมเหตุผล',
      'เมื่อผ่านจึงปิดงาน; Rework ต้องคงประวัติรอบก่อนหน้า',
    ],
  },
  {
    title: 'ดูแลต้น โรค และการติดตาม',
    audience: 'Manager · Agronomist · Worker',
    steps: [
      'บันทึกอาการที่สังเกตได้ ความรุนแรง เวลา ต้น และรูป โดยยังไม่สรุป diagnosis',
      'ส่ง Incident ให้ Manager/Agronomist ตรวจ',
      'Agronomist ยืนยันหรือแก้ diagnosis ตามหลักฐาน และกำหนด follow-up',
      'หากมีงานดูแล ให้สร้าง Work Order ที่อ้าง Incident',
      'บันทึกผลติดตามและปิดเคสเมื่อมีหลักฐานครบ; การแก้ข้อมูลใช้ Correction Event',
    ],
  },
  {
    title: 'ผล จำนวนผล เก็บเกี่ยว และการขาย',
    audience: 'Owner · Manager · Agronomist · Sales/Inventory',
    steps: [
      'เลือก Crop Cycle และ stage ให้ถูกต้องก่อนบันทึก Fruit Observation',
      'เลือกที่มาของจำนวนเป็นคนนับหรือ AI ช่วยนับ + คนตรวจ และระบุวิธี/คุณภาพค่า',
      'แยก Measured, Estimated และ Unknown; ห้ามแทน Unknown ด้วย 0',
      'สร้าง Harvest lot โดยอ้าง Farm, Cycle, Zone/Tree, จำนวน น้ำหนัก เกรด และหน่วย',
      'สร้าง Sales lot จาก Harvest lot และบันทึกราคา มัดจำ รับแล้ว ค้างตามสิทธิ์',
      'Correction ต้องอ้างรายการเดิมและเก็บ before/after ใน Audit',
    ],
  },
  {
    title: 'Inventory และต้นทุนตรง',
    audience: 'Owner · Manager · Sales/Inventory',
    steps: [
      'เลือก Item และ Lot ของสวนปัจจุบัน',
      'เลือกประเภท Receive, Issue หรือ Adjustment',
      'กรอก quantity พร้อม unit และ reason/reference ทุกครั้ง',
      'Issue ควรอ้าง Work/Care Event เมื่อเกี่ยวข้อง',
      'ตรวจคงเหลือและ Audit; ยอดผิดให้ทำ Adjustment/Correction ไม่แก้ประวัติเดิม',
    ],
  },
  {
    title: 'รายงาน Audit และ Export',
    audience: 'ตามสิทธิ์และ Policy',
    steps: [
      'ตรวจ Farm, period, timezone, cutoff และ Data Quality ก่อนอ่าน KPI',
      'Drill-down รายการ Unknown, Estimated, Pending, Conflict และ late data',
      'แก้ข้อมูลต้นทางด้วย Correction ก่อน Finalize',
      'Export เฉพาะ scope/column ที่อนุญาตและตรวจสิทธิ์ใหม่ตอนดาวน์โหลด',
      'ห้ามสร้าง public link; รายงานที่ Finalized แล้วแก้ด้วย Restated revision เท่านั้น',
    ],
  },
] as const

const troubleshooting = [
  ['เข้าสู่ระบบไม่ได้', 'ใช้หมายเลข/OTP ทดสอบที่กำหนด ตรวจตัวเลข 6 หลัก และห้ามใช้ SMS จริงใน Local'],
  ['ไม่เห็นสวน', 'ตรวจ Active membership; ห้ามแก้ URL หรือ Farm ID เพื่อข้ามสิทธิ์'],
  ['QR ไม่ตรงงาน', 'หยุดงาน เปรียบเทียบ expected/actual และแจ้ง Manager'],
  ['ออฟไลน์แล้วไม่พบต้น', 'กลับ Online เพื่อโหลดข้อมูล ห้ามใช้ cache ของต้นอื่น'],
  ['รูปค้าง Pending/Failed', 'อย่า Submit; เปิดศูนย์ซิงก์และ Retry ด้วย batch เดิม'],
  ['ข้อมูลขัดแย้ง', 'Manager ตรวจ before/after พร้อมเหตุผล หรือส่งต่อ Owner'],
  ['Export ไม่ได้', 'ตรวจ Role/Policy; ห้ามยืมบัญชีหรือส่งไฟล์ผ่าน public link'],
  ['เห็นข้อมูลต่างสวน', 'หยุดทันที เก็บหลักฐาน ไม่ Export/ส่งต่อ และแจ้ง Owner'],
] as const

export function UserManualPage() {
  const { currentFarm } = usePhase2()

  useEffect(() => {
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }, [])

  if (!currentFarm) return null

  return (
    <section className="page-stack user-manual-page">
      <PageHeader
        eyebrow="KDOMS User Manual v1.1 · In-app guide"
        title="คู่มือผู้ใช้"
        description={`วิธีใช้งานตามบทบาทใน ${currentFarm.farmCode} ตั้งแต่เข้าสู่ระบบจนตรวจรับ รายงาน และแก้ปัญหา`}
      />

      <div className="field-validation-banner" role="note">
        <strong>LOCAL/MOCK · SIMULATED/TEST ONLY</strong>
        <span>คู่มือนี้อธิบายฟังก์ชันใน Candidate ปัจจุบัน ไม่ใช่การอนุมัติ Deploy, Pilot หรือ Production</span>
      </div>

      <nav className="manual-index" aria-label="สารบัญคู่มือผู้ใช้">
        <a href="#manual-start">เริ่มต้นใช้งาน</a>
        <a href="#manual-roles">7 บทบาท</a>
        <a href="#manual-workflows">Workflow</a>
        <a href="#manual-data">การกรอกข้อมูล</a>
        <a href="#manual-sync">Offline/Sync</a>
        <a href="#manual-help">แก้ปัญหา</a>
      </nav>

      <section className="manual-section" id="manual-start" aria-labelledby="manual-start-title">
        <div className="manual-section__heading">
          <span className="status-pill">01 · Quick start</span>
          <h2 id="manual-start-title">เริ่มต้นใช้งานให้ถูกสวนและถูกสิทธิ์</h2>
        </div>
        <ol className="manual-step-list">
          <li><strong>เข้าสู่ระบบ</strong><span>Local ใช้ Phone + OTP ทดสอบเท่านั้น</span></li>
          <li><strong>เลือกสวน</strong><span>ตรวจชื่อ Farm Code และบทบาทใน Header ก่อนอ่านหรือสร้างข้อมูล</span></li>
          <li><strong>ตรวจสถานะ</strong><span>ดู Online/Offline, จำนวนรายการค้าง และเวลาซิงก์ล่าสุด</span></li>
          <li><strong>เปิดงานหรือโมดูล</strong><span>เมนูจะแสดงความสามารถตามบทบาทของสวนปัจจุบัน</span></li>
          <li><strong>ออกจากระบบ</strong><span>ตรวจ Pending/Failed ก่อนออก; Durable queue จะจัดการตาม Policy ที่อนุมัติ</span></li>
        </ol>
        <div className="manual-context" role="status">
          <span>บริบทปัจจุบัน</span>
          <strong>{currentFarm.farmName}</strong>
          <code>{currentFarm.farmCode}</code>
          <small>{roleLabels[currentFarm.role]}</small>
        </div>
      </section>

      <section className="manual-section" id="manual-roles" aria-labelledby="manual-roles-title">
        <div className="manual-section__heading">
          <span className="status-pill">02 · Role guide</span>
          <h2 id="manual-roles-title">หน้าที่และข้อห้ามของผู้ใช้ 7 บทบาท</h2>
          <p>บทบาทประเมินใหม่ทุกสวน ผู้ใช้คนเดียวอาจมีบทบาทต่างกันในแต่ละ Farm</p>
        </div>
        <div className="manual-role-grid">
          {roleGuides.map((role) => (
            <article key={role.code}>
              <code>{role.code}</code>
              <h3>{role.title}</h3>
              <p>{role.duty}</p>
              <small><strong>ข้อควรระวัง:</strong> {role.caution}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="manual-section" id="manual-workflows" aria-labelledby="manual-workflows-title">
        <div className="manual-section__heading">
          <span className="status-pill">03 · End-to-end</span>
          <h2 id="manual-workflows-title">Workflow ตั้งแต่สร้างข้อมูลจนตรวจรับหรือปิดรายการ</h2>
          <p>เปิดแต่ละหัวข้อเพื่อดูขั้นตอนตามลำดับ</p>
        </div>
        <div className="manual-workflows">
          {workflows.map((workflow, index) => (
            <details key={workflow.title} open={index === 0}>
              <summary>
                <span>{workflow.title}</span>
                <small>{workflow.audience}</small>
              </summary>
              <ol>
                {workflow.steps.map((step) => <li key={step}>{step}</li>)}
              </ol>
            </details>
          ))}
        </div>
      </section>

      <section className="manual-section" id="manual-data" aria-labelledby="manual-data-title">
        <div className="manual-section__heading">
          <span className="status-pill">04 · Data quality</span>
          <h2 id="manual-data-title">คำแนะนำการกรอกข้อมูล</h2>
        </div>
        <div className="manual-table-wrap">
          <table>
            <thead><tr><th>เรื่อง</th><th>ต้องทำ</th><th>ห้ามทำ</th></tr></thead>
            <tbody>
              <tr><td>Required field</td><td>กรอกช่องที่มีเครื่องหมายบังคับและแก้ Error ก่อนบันทึก</td><td>ใส่ “-” หรือข้อความสมมติเพื่อข้าม Validation</td></tr>
              <tr><td>จำนวน/หน่วย</td><td>กรอก value + unit + method + เวลา/ผู้บันทึกตามแบบฟอร์ม</td><td>กรอกตัวเลขลอย ๆ หรือแปลงหน่วยเองโดยไม่มี conversion</td></tr>
              <tr><td>คุณภาพค่า</td><td>เลือก Measured, Estimated หรือ Unknown ให้ตรงหลักฐาน</td><td>แทน Unknown ด้วย 0 หรือยกระดับ Estimated เป็น Measured</td></tr>
              <tr><td>รหัสต้น</td><td>ใช้ Farm + Zone + Row + Position + QR ร่วมกัน</td><td>ใช้ GPS หรือ QR อย่างเดียวเป็น authorization</td></tr>
              <tr><td>รูปภาพ</td><td>แยก Instruction, BEFORE และ AFTER พร้อม Farm/Work/purpose</td><td>ปะปนรูปต่างงาน ต่างสวน หรือส่งรูปที่ยัง Failed</td></tr>
              <tr><td>Correction</td><td>อ้าง Record เดิม ระบุเหตุผล และเก็บ before/after</td><td>แก้หรือลบประวัติสำคัญแบบเงียบ ๆ</td></tr>
              <tr><td>ข้อมูลจริง</td><td>Local/Mock ใช้ข้อมูลที่ติดป้าย SIMULATED/TEST ONLY</td><td>นำชื่อ เบอร์โทร รูป พิกัด หรือข้อมูลสวนจริงเข้า repository/Emulator</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="manual-section" id="manual-sync" aria-labelledby="manual-sync-title">
        <div className="manual-section__heading">
          <span className="status-pill">05 · Offline & evidence</span>
          <h2 id="manual-sync-title">QR รูปภาพ Offline/Sync และ Conflict</h2>
        </div>
        <div className="manual-state-grid">
          <article><strong>บันทึกในเครื่อง</strong><p>รายการยังไม่ถึง trusted service ห้ามอ้างว่าเสร็จหรือซิงก์แล้ว</p></article>
          <article><strong>กำลังซิงก์</strong><p>รักษา Farm scope และ idempotency key เดิม อย่าสร้างรายการใหม่ซ้ำ</p></article>
          <article><strong>ซิงก์แล้ว</strong><p>ตรวจเวลาล่าสุดและ Work/Audit reference ก่อนออกจากหน้า</p></article>
          <article><strong>ข้อมูลขัดแย้ง</strong><p>หยุดการเขียนทับ เปิด before/after และให้ Manager/Owner ตัดสินตามสิทธิ์</p></article>
        </div>
        <div className="form-warning" role="note">
          <strong>Critical stop:</strong> หากเห็นข้อมูลต่างสวน สแกนผิดต้นแต่ยังทำงานต่อได้
          ประวัติเสีย หรือพบ secret ให้หยุด เก็บหลักฐาน และแจ้ง Owner ทันที
        </div>
      </section>

      <section className="manual-section" id="manual-help" aria-labelledby="manual-help-title">
        <div className="manual-section__heading">
          <span className="status-pill">06 · Troubleshooting</span>
          <h2 id="manual-help-title">แนวทางแก้ปัญหาเบื้องต้น</h2>
        </div>
        <div className="manual-table-wrap">
          <table>
            <thead><tr><th>อาการ</th><th>วิธีดำเนินการ</th></tr></thead>
            <tbody>
              {troubleshooting.map(([issue, action]) => <tr key={issue}><td>{issue}</td><td>{action}</td></tr>)}
            </tbody>
          </table>
        </div>
      </section>

      <section className="phase-boundary" aria-labelledby="manual-boundary-title">
        <span className="status-pill">Current boundary</span>
        <h2 id="manual-boundary-title">สถานะการใช้งานปัจจุบัน</h2>
        <ul>
          <li>Gate 6 ผ่าน และ PA-1 Local/Emulator ผ่าน</li>
          <li>External PA-1 เป็น NO-GO/BLOCKED</li>
          <li>PA-2, Controlled Pilot, Deployment และ Production ยังไม่อนุมัติ</li>
          <li>การมี API Key ในไฟล์ Local ไม่เปลี่ยน Gate และไม่อนุญาตเชื่อม External resource โดยอัตโนมัติ</li>
        </ul>
      </section>
    </section>
  )
}
