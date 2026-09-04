import { useState } from 'react'
import { Link } from 'react-router-dom'

import './WorkflowDependencyMap.css'

export type WorkflowPhase = 'all' | 'onboarding' | 'spatial' | 'operations' | 'health' | 'production' | 'reporting'

interface WorkflowDependencyNode {
  id: string
  title: string
  route: string
  badge: string
  roles: string
  icon: string
  phase: WorkflowPhase
  phaseLabel: string
  desc: string
  prereqs: Array<{ label: string; targetId?: string }>
  downstreams: Array<{ label: string; targetId?: string }>
}

type RawNode = [
  id: string,
  title: string,
  route: string,
  badge: string,
  roles: string,
  icon: string,
  phase: WorkflowPhase,
  phaseLabel: string,
  desc: string,
  prereqs: Array<[string, string?]>,
  downstreams: Array<[string, string?]>,
]

const RAW_NODES: readonly RawNode[] = [
  // 1. Onboarding & Access
  [
    'auth', 'เข้าสู่ระบบ & สิทธิ์', '/', 'จุดเริ่มต้นระบบ (Root)', 'ทุกคน (System Admin, Owner, Manager, Worker, etc.)', '🔐', 'onboarding', '1. ระบบเริ่มต้น & สิทธิ์การเข้าถึง',
    'ยืนยันตัวตนผ่าน Phone OTP / Google Sign-In ผูก Trusted Identity และตรวจ Farm Access',
    [['หมายเลขโทรศัพท์หรือ Google Account ที่ได้รับเชิญในระบบ'], ['การเชื่อมต่อ Firebase Live Auth']],
    [['เจ้าขององค์กรเข้าจัดการสวนและสร้างสวนใหม่', 'farm'], ['เข้าตรวจสิทธิ์และบทบาทในสวน', 'members'], ['โหลดรอบบริหารสวนของสวนปัจจุบัน', 'annual-cycle']],
  ],
  [
    'farm', 'จัดการสวน (Farms)', '/farm-management', 'ระดับองค์กร (Org Level)', 'ORG_OWNER / System Admin', '🏡', 'onboarding', '1. ระบบเริ่มต้น & สิทธิ์การเข้าถึง',
    'สร้างสวน กำหนดชื่อ โค้ดสวน (Farm Code) จังหวัด โซน และแปลงที่ดิน ขอบเขตสูงสุดของระบบ Multi-Farm',
    [['ต้องผ่านการยืนยันตัวตนในฐานะ ORG_OWNER หรือ System Admin', 'auth']],
    [['เพิ่มสมาชิกและกำหนดบทบาทประจำสวนนี้', 'members'], ['กำหนดรอบบริหารสวนรายปีประจำสวน', 'annual-cycle'], ['สร้างตำแหน่งปลูกและผูกกับโซนของสวน', 'trees'], ['เปิดคลังวัสดุประจำสวน', 'inventory']],
  ],
  [
    'members', 'สมาชิกและสิทธิ์ (Roles)', '/members', 'ความปลอดภัยและสิทธิ์', 'ORG_OWNER เท่านั้น', '👥', 'onboarding', '1. ระบบเริ่มต้น & สิทธิ์การเข้าถึง',
    'เชิญสมาชิก กำหนด 1 ใน 7 บทบาทตามแต่ละสวนเพื่อจำกัดสิทธิ์ตามหลัก Multi-Farm isolation',
    [['ต้องมีสวนที่ Active อยู่ในระบบ', 'farm'], ['เบอร์โทรหรือรหัสสมาชิกที่ต้องการเชิญ']],
    [['มอบหมายงานให้ Worker หรือให้ Manager สั่งงาน', 'work-order'], ['มอบหมายให้ Agronomist วินิจฉัยโรค', 'disease-review'], ['ให้สิทธิ์ Sales/Inventory หรือ Owner ดูการเงิน', 'sales']],
  ],

  // 2. Planning & Spatial
  [
    'annual-cycle', 'รอบบริหารสวนรายปี', '/annual-cycles', 'การวางแผนรายปี (12 เดือน)', 'ORG_OWNER (สร้าง/แก้ไข), FARM_MANAGER (วางแผน), ทุกคน (อ่าน)', '📅', 'spatial', '2. การวางแผน & ผังตำแหน่งแปลงปลูก',
    'กำหนดรอบการบริหารสวน 12 เดือน (1 มิ.ย.-31 พ.ค.) เป้าหมาย ผลผลิต และงบประมาณระดับสวน/โซน',
    [['สวนปัจจุบันต้อง Active', 'farm'], ['กำหนดวันเริ่มรอบ (Period Start)']],
    [['ผูกรอบผลผลิต (Crop Cycle) เข้ากับรอบปี', 'fruit-obs'], ['วางแผนการทำงานและงบประมาณประจำรอบ', 'work-order'], ['เป็นแกนหลักในการคำนวณรายงานผลสวนและต้นทุน', 'reports']],
  ],
  [
    'trees', 'ทะเบียนตำแหน่งต้น & QR', '/trees', 'ตำแหน่งต้นถาวร', 'ORG_OWNER, FARM_MANAGER', '🌳', 'spatial', '2. การวางแผน & ผังตำแหน่งแปลงปลูก',
    'ลงทะเบียนตำแหน่งปลูกถาวร (Position ID: Farm+Zone+Row+Position) นำเข้าผ่าน Excel และสร้างรหัส QR',
    [['สวนต้องกำหนดโซน (เช่น Z01, Z02) ไว้เรียบร้อยแล้ว', 'farm']],
    [['สร้างแผนผังแปลนสวน 2 มิติอัตโนมัติ', 'orchard-layout'], ['นำป้าย QR ไปติดที่ต้นจริงเพื่อใช้สแกนยืนยันงาน', 'scan'], ['ระบุตำแหน่งต้นเมื่อพบโรค', 'disease']],
  ],
  [
    'orchard-layout', 'แปลนสวน & เลือกตำแหน่ง', '/orchard-layout', 'จุดสั่งการภาคสนาม (Launchpad)', 'ตามสิทธิ์ของแต่ละ Workflow', '🗺️', 'spatial', '2. การวางแผน & ผังตำแหน่งแปลงปลูก',
    'แสดงผัง 2 มิติ แถวซ้ายไปขวา ต้นบนลงล่าง พร้อมตารางเลือกเดี่ยว/แถว/โซน เพื่อส่งต่อ 5 ฟังก์ชันทันที',
    [['มีตำแหน่งปลูกในทะเบียนต้น', 'trees']],
    [['สร้างงานทั่วไป / งานดูแล ส่งตำแหน่งเข้าฟอร์มสร้างงาน', 'work-order'], ['รายงานอาการ/โรค (เลือก 1 ต้นเป้าหมาย)', 'disease'], ['บันทึกจำนวนผล ส่งตำแหน่งเข้าฟอร์มนับผล', 'fruit-obs'], ['สร้าง Harvest Lot ผูกกับผลผลิตที่ตัด', 'harvest']],
  ],

  // 3. Field Operations
  [
    'work-order', 'สร้างคำสั่งงาน (Work Order)', '/work/new', 'การมอบหมายงาน', 'ORG_OWNER, FARM_MANAGER', '📋', 'operations', '3. การปฏิบัติงานภาคสนาม & ตรวจรับงาน',
    'สร้างใบงาน ระบุเป้าหมาย ขั้นตอน วัสดุ วันกำหนดส่ง ผู้รับผิดชอบ และรูปตัวอย่างอ้างอิง 0-3 รูป',
    [['เลือกตำแหน่งจากแปลนสวนหรือทะเบียนต้น', 'orchard-layout'], ['มีผู้ปฏิบัติงาน (Worker) ประจำสวน', 'members']],
    [['Worker ได้รับแจ้งเตือน และเดินทางไปสแกนต้นจริง', 'scan'], ['จองหรือเตรียมเบิกวัสดุอุปกรณ์ที่ระบุในใบงาน', 'inventory']],
  ],
  [
    'scan', 'สแกน QR ยืนยันต้น', '/scan', 'ตรวจสอบภาคสนาม', 'WORKER, AGRONOMIST, MANAGER', '📱', 'operations', '3. การปฏิบัติงานภาคสนาม & ตรวจรับงาน',
    'สแกน QR Code บนต้นไม้จริงเพื่อยืนยันว่าตรง Farm+Zone+Row+Tree ป้องกันทำงานผิดต้น',
    [['ติดป้าย QR บนต้นจริง', 'trees'], ['มีงานที่ได้รับมอบหมาย', 'work-order']],
    [['ปลดล็อกให้เริ่มบันทึกผลงานจริงและถ่ายรูป', 'worker-report']],
  ],
  [
    'worker-report', 'รายงาน & รูปก่อน/หลัง', '/work', 'ตรวจรับงาน & Audit', 'WORKER (ส่งงาน) -> MANAGER (ตรวจรับ)', '📸', 'operations', '3. การปฏิบัติงานภาคสนาม & ตรวจรับงาน',
    'Worker แนบรูป BEFORE/AFTER บันทึกวัสดุใช้จริง -> Manager ตรวจสอบ Approve, Request Rework หรือ Reject',
    [['ยืนยันตำแหน่งต้นเรียบร้อย', 'scan'], ['รูปถ่ายหน้างาน BEFORE และ AFTER อัปโหลดสำเร็จ (Durable Queue)']],
    [['ตัดยอดเบิกจ่ายวัสดุในคลังสวนจริง (Issue Movement)', 'inventory'], ['บันทึกชั่วโมงการทำงาน/ค่าแรงเข้าสรุปต้นทุนสวน', 'reports'], ['บันทึกสถานะงานสำเร็จลงใน Timeline ประวัติของต้นไม้', 'sync-audit']],
  ],

  // 4. Care & Disease
  [
    'care', 'งานดูแลต้นไม้ (Care Event)', '/care', 'การบำรุงรักษา', 'FARM_MANAGER, AGRONOMIST, WORKER', '🌿', 'health', '4. การดูแล & วินิจฉัยโรค',
    'บันทึกการดูแลต้นไม้: พ่นยา, ตัดแต่งกิ่ง, ให้ปุ๋ย, ให้น้ำ, ปรับสภาพดิน ทั้งแบบรอบปกติหรือตามคำแนะนำ',
    [['มีตำแหน่งต้นหรือโซนเป้าหมาย', 'trees'], ['สอดคล้องกับแผนรอบปี', 'annual-cycle']],
    [['บันทึกเบิกใช้ปุ๋ย/สารเคมี/เชื้อจุลินทรีย์', 'inventory'], ['บันทึกประวัติการดูแลลงในหน้า Tree Detail', 'trees']],
  ],
  [
    'disease', 'รายงานอาการ/โรค (Incident)', '/disease', 'การเฝ้าระวังโรค', 'WORKER, MANAGER, AGRONOMIST', '⚠️', 'health', '4. การดูแล & วินิจฉัยโรค',
    'บันทึกอาการผิดปกติที่สังเกตพบ เช่น ใบเหลือง ยอดแห้ง แผลโคนต้น พร้อมรูปถ่าย (ห้ามวินิจฉัย/สั่งยาเอง)',
    [['เลือกตำแหน่งต้นที่พบอาการ 1 ต้น', 'orchard-layout']],
    [['ส่งต่อให้นักวิชาการเกษตร (Agronomist) ตรวจสอบและวินิจฉัย', 'disease-review']],
  ],
  [
    'disease-review', 'วินิจฉัย & มอบหมายรักษา', '/disease', 'การวินิจฉัยและสั่งการรักษา', 'AGRONOMIST เท่านั้น (ห้าม AI สั่งยาอัตโนมัติ)', '🔬', 'health', '4. การดูแล & วินิจฉัยโรค',
    'นักวิชาการเกษตรตรวจอาการและภาพถ่าย ยืนยันผลวินิจฉัย (Diagnosis) และเปิดใบสั่งงานรักษา',
    [['มีรายงานอาการที่บันทึกไว้', 'disease'], ['ภาพถ่ายและหลักฐานรอยโรคที่ชัดเจน']],
    [['สั่งสร้าง Work Order ดูแลรักษาต้นที่มีอาการโดยผูก Incident ID', 'work-order'], ['ติดตามผลการรักษาจนหายแล้วปิดเคส', 'disease']],
  ],

  // 5. Production & Inventory
  [
    'fruit-obs', 'นับผล (Manual / AI)', '/production', 'การประเมินผลผลิต', 'AGRONOMIST, FARM_MANAGER, ORG_OWNER', '🍈', 'production', '5. ผลผลิต เก็บเกี่ยว ขาย และคลัง',
    'นับจำนวนผลตามระยะการเจริญเติบโต เลือกได้ทั้งคนนับ (Manual) หรือ AI ช่วยนับ + คนตรวจ (AI Assisted)',
    [['มีรอบบริหารสวนและ Crop Cycle', 'annual-cycle'], ['เลือกต้นหรือโซนที่กำลังติดผล', 'orchard-layout']],
    [['ประมาณการจำนวนผลผลิตเพื่อวางแผนตัดและเตรียมแรงงาน', 'harvest']],
  ],
  [
    'harvest', 'ล็อตเก็บเกี่ยว (Harvest)', '/production', 'เก็บเกี่ยวผลผลิต', 'SALES_INVENTORY, FARM_MANAGER, ORG_OWNER', '🧺', 'production', '5. ผลผลิต เก็บเกี่ยว ขาย และคลัง',
    'บันทึกการตัดผลผลิต: ชั่งน้ำหนักรวม (กก.), นับลูก, แยกเกรด (A/B/C) โดยผูกกับโซนและต้นที่ตัด',
    [['ผลผลิตถึงระยะเก็บเกี่ยว', 'fruit-obs'], ['ระบุต้นหรือโซนที่ทำการตัด', 'orchard-layout']],
    [['นำล็อตผลผลิตที่ตัดแล้วไปเปิดล็อตการขาย (Sales Lot)', 'sales'], ['สรุปผลผลิตจริง (Actual Yield) เทียบกับเป้าหมายรอบปี', 'reports']],
  ],
  [
    'sales', 'ล็อตการขาย (Sales)', '/production', 'รายได้และการเงิน', 'ORG_OWNER เท่านั้น (ผู้ใช้อื่นไม่เห็นข้อมูลการเงิน)', '💰', 'production', '5. ผลผลิต เก็บเกี่ยว ขาย และคลัง',
    'บันทึกการจำหน่ายผลผลิต: อ้างอิงจาก Harvest Lot, ระบุผู้ซื้อ, ราคาต่อ กก., มัดจำ, ยอดที่ชำระ และยอดค้างรับ',
    [['มีล็อตเก็บเกี่ยวที่มีผลผลิตพร้อมจำหน่าย', 'harvest']],
    [['สรุปยอดขายรวม (Gross Sales) เข้าสู่รายงานการเงิน', 'reports']],
  ],
  [
    'inventory', 'คลังและวัสดุ (Stock)', '/inventory', 'การจัดการวัสดุและต้นทุน', 'SALES_INVENTORY, FARM_MANAGER, ORG_OWNER (ดูต้นทุน)', '📦', 'production', '5. ผลผลิต เก็บเกี่ยว ขาย และคลัง',
    'จัดการสต็อก: รับเข้า (Receive), เบิกใช้ตัดยอด (Issue) โดยผูกกับ Work Order หรือ Care Event, ปรับยอดจริง',
    [['สวนต้อง Active', 'farm'], ['รายการวัสดุ (ปุ๋ย สารชีวภัณฑ์ อุปกรณ์ บรรจุภัณฑ์)']],
    [['เบิกวัสดุไปใช้ปฏิบัติงานตามใบงาน', 'work-order'], ['สรุปต้นทุนค่าวัสดุที่ใช้จริงเข้าสู่งบต้นทุนดำเนินงาน', 'reports']],
  ],

  // 6. Reporting & Governance
  [
    'reports', 'รายงานผลสวนและต้นทุน', '/reports', 'การตัดสินใจระดับบริหาร', 'ORG_OWNER (เห็นครบ), FARM_MANAGER (เห็นเฉพาะเชิงปฏิบัติการ)', '📊', 'reporting', '6. การสรุปผล ต้นทุน และผู้บริหาร',
    'สรุป 4 เสาหลัก: ค่าแรง + ค่าวัสดุ + ค่าใช้จ่ายตรง + ยอดขาย วิเคราะห์กำไรขั้นต้น (Margin) และต้นทุนต่อ กก.',
    [['กำหนดรอบปีที่ต้องการดูรายงาน', 'annual-cycle'], ['ข้อมูลค่าแรงและการทำงาน', 'worker-report'], ['ข้อมูลต้นทุนวัสดุที่เบิกใช้จริง', 'inventory'], ['ข้อมูลยอดขายจริง', 'sales']],
    [['ส่งข้อมูลขึ้นภาพรวมหลายสวนของผู้บริหารองค์กร', 'portfolio']],
  ],
  [
    'portfolio', 'ภาพรวมหลายสวน (Owner)', '/portfolio', 'ระดับองค์กร (Owner Only)', 'ORG_OWNER เท่านั้น', '🏢', 'reporting', '6. การสรุปผล ต้นทุน และผู้บริหาร',
    'เปรียบเทียบผลประกอบการ ผลผลิต สุขภาพต้น และต้นทุนข้ามสวนทั้งหมดในองค์กรเพื่อการตัดสินใจเชิงกลยุทธ์',
    [['ต้องมีมากกว่า 1 สวนในองค์กร', 'farm'], ['มีข้อมูลสรุปผลการดำเนินงานของแต่ละสวน', 'reports']],
    [['วางแผนรอบบริหารสวนรายปีรอบถัดไป (Strategic Annual Cycle Planning)', 'annual-cycle']],
  ],
  [
    'sync-audit', 'ศูนย์ซิงก์ & ประวัติ Audit', '/sync', 'ความถูกต้องและโปร่งใส', 'ทุกบทบาท (Sync), ORG_OWNER / AUDITOR (Audit)', '🛡️', 'reporting', '6. การสรุปผล ต้นทุน และผู้บริหาร',
    'จัดการ Offline Queue, กู้คืนรูปถ่ายที่ค้าง (Photo Recovery), ตัดสิน Conflict และบันทึก Audit ทุก Action',
    [['ทุก Action ในระบบจะสร้าง Audit Log อัตโนมัติ']],
    [['ส่งข้อมูลที่ค้างทั้งหมดขึ้น Firebase Live เมื่อกลับมาออนไลน์อย่างปลอดภัย']],
  ],
]

const NODES: readonly WorkflowDependencyNode[] = RAW_NODES.map(([id, title, route, badge, roles, icon, phase, phaseLabel, desc, prereqs, downstreams]) => ({
  id,
  title,
  route,
  badge,
  roles,
  icon,
  phase,
  phaseLabel,
  desc,
  prereqs: prereqs.map(([label, targetId]) => ({ label, targetId })),
  downstreams: downstreams.map(([label, targetId]) => ({ label, targetId })),
}))

const PHASES: Array<{ code: WorkflowPhase; label: string }> = [
  { code: 'all', label: 'ทั้งหมด' },
  { code: 'onboarding', label: '1. ระบบ & สิทธิ์' },
  { code: 'spatial', label: '2. ผังสวน & ต้นไม้' },
  { code: 'operations', label: '3. ปฏิบัติงาน & QR' },
  { code: 'health', label: '4. ดูแล & วินิจฉัยโรค' },
  { code: 'production', label: '5. ผลผลิต & คลัง' },
  { code: 'reporting', label: '6. สรุปผล & ต้นทุน' },
]

export function WorkflowDependencyMap() {
  const [selectedPhase, setSelectedPhase] = useState<WorkflowPhase>('all')
  const [selectedNodeId, setSelectedNodeId] = useState<string>('orchard-layout')

  const selectedNode: WorkflowDependencyNode = NODES.find((n) => n.id === selectedNodeId) ?? NODES[0]!

  const prereqIds = new Set(selectedNode.prereqs.map((p) => p.targetId).filter(Boolean))
  const downstreamIds = new Set(selectedNode.downstreams.map((d) => d.targetId).filter(Boolean))

  const visibleNodes = selectedPhase === 'all'
    ? NODES
    : NODES.filter((n) => n.phase === selectedPhase)

  const groupedPhases = PHASES.filter((p) => p.code !== 'all' && (selectedPhase === 'all' || selectedPhase === p.code))

  return (
    <div className="workflow-map" aria-label="แผนผังความสัมพันธ์ของทุกเมนูและฟังก์ชัน">
      {/* Header & Filter Controls */}
      <div className="workflow-map__header">
        <div className="workflow-map__legend" aria-label="คำอธิบายสี">
          <span className="workflow-map__legend-item">
            <span className="workflow-map__dot workflow-map__dot--active" />
            <strong>เมนูที่เลือก</strong>
          </span>
          <span className="workflow-map__legend-item">
            <span className="workflow-map__dot workflow-map__dot--prereq" />
            <strong>ต้องทำก่อน (Pre-requisite)</strong>
          </span>
          <span className="workflow-map__legend-item">
            <span className="workflow-map__dot workflow-map__dot--downstream" />
            <strong>ส่งต่อไปยัง (Next Steps)</strong>
          </span>
        </div>

        <div className="workflow-map__filter-bar" role="tablist" aria-label="กรองตามระยะ">
          {PHASES.map((p) => (
            <button
              className={`workflow-map__filter-btn ${selectedPhase === p.code ? 'workflow-map__filter-btn--active' : ''}`}
              key={p.code}
              onClick={() => setSelectedPhase(p.code)}
              type="button"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout */}
      <div className="workflow-map__layout">
        {/* Node Grid */}
        <div className="workflow-map__nodes-container">
          {groupedPhases.map((phase) => {
            const phaseNodes = visibleNodes.filter((n) => n.phase === phase.code)
            if (phaseNodes.length === 0) return null

            return (
              <section className="workflow-phase-group" key={phase.code}>
                <div className="workflow-phase-group__title">
                  <span className="workflow-phase-group__badge">{phase.label.slice(0, 1)}</span>
                  <span>{phase.label}</span>
                </div>

                <div className="workflow-phase-group__grid">
                  {phaseNodes.map((node) => {
                    const isSelected = node.id === selectedNodeId
                    const isPrereq = prereqIds.has(node.id)
                    const isDownstream = downstreamIds.has(node.id)
                    const isDimmed = !isSelected && !isPrereq && !isDownstream

                    let modifier = ''
                    if (isSelected) modifier = 'workflow-node-card--active'
                    else if (isPrereq) modifier = 'workflow-node-card--prereq'
                    else if (isDownstream) modifier = 'workflow-node-card--downstream'
                    else if (isDimmed) modifier = 'workflow-node-card--dimmed'

                    return (
                      <button
                        className={`workflow-node-card ${modifier}`}
                        key={node.id}
                        onClick={() => setSelectedNodeId(node.id)}
                        type="button"
                      >
                        <div className="workflow-node-card__top">
                          <span className="workflow-node-card__icon" aria-hidden="true">{node.icon}</span>
                          <span className="workflow-node-card__route">{node.route}</span>
                        </div>
                        <h3 className="workflow-node-card__title">{node.title}</h3>
                        <p className="workflow-node-card__desc">{node.desc}</p>
                      </button>
                    )
                  })}
                </div>
              </section>
            )
          })}
        </div>

        {/* Side Detail Panel */}
        <aside className="workflow-detail-panel" aria-live="polite">
          <div className="workflow-detail-panel__header">
            <div className="workflow-detail-panel__badge-row">
              <span className="workflow-detail-panel__badge">{selectedNode.badge}</span>
              <span className="workflow-node-card__route">{selectedNode.route}</span>
            </div>
            <h3 className="workflow-detail-panel__title">
              <span aria-hidden="true">{selectedNode.icon} </span>
              {selectedNode.title}
            </h3>
            <p className="workflow-detail-panel__desc">{selectedNode.desc}</p>
          </div>

          {/* Pre-requisites */}
          <div className="workflow-detail-panel__section">
            <div className="workflow-detail-panel__section-title workflow-detail-panel__section-title--prereq">
              <span>← สิ่งที่ต้องทำก่อน (Pre-requisites / Inputs)</span>
            </div>
            <ul className="workflow-detail-panel__list">
              {selectedNode.prereqs.map((prereq, idx) => (
                <li
                  className="workflow-detail-panel__list-item workflow-detail-panel__list-item--prereq"
                  key={idx}
                  onClick={() => {
                    if (prereq.targetId) setSelectedNodeId(prereq.targetId)
                  }}
                  role={prereq.targetId ? 'button' : undefined}
                  tabIndex={prereq.targetId ? 0 : undefined}
                >
                  <span aria-hidden="true">🔹</span>
                  <span>{prereq.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Downstream */}
          <div className="workflow-detail-panel__section">
            <div className="workflow-detail-panel__section-title workflow-detail-panel__section-title--downstream">
              <span>→ ทำแล้วส่งต่อไปไหน (Next Steps / Downstream)</span>
            </div>
            <ul className="workflow-detail-panel__list">
              {selectedNode.downstreams.map((down, idx) => (
                <li
                  className="workflow-detail-panel__list-item workflow-detail-panel__list-item--downstream"
                  key={idx}
                  onClick={() => {
                    if (down.targetId) setSelectedNodeId(down.targetId)
                  }}
                  role={down.targetId ? 'button' : undefined}
                  tabIndex={down.targetId ? 0 : undefined}
                >
                  <span aria-hidden="true">🔸</span>
                  <span>{down.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Roles & Quick Jump Link */}
          <div className="workflow-detail-panel__footer">
            <div className="workflow-detail-panel__meta-row">
              <span className="color-muted">ผู้มีสิทธิ์:</span>
              <strong>{selectedNode.roles}</strong>
            </div>
            <div className="workflow-detail-panel__meta-row">
              <span className="color-muted">การแยกข้อมูล:</span>
              <span>Multi-Farm Isolation</span>
            </div>
            <Link className="workflow-detail-panel__action-btn" to={selectedNode.route}>
              เปิดไปยังหน้านี้ในระบบ <span>›</span>
            </Link>
          </div>
        </aside>
      </div>

      {/* Macro Pipeline Ribbon */}
      <div className="workflow-pipeline" aria-label="สรุปวงจรข้อมูลทั้งระบบ">
        <div className="workflow-pipeline__step">
          <span className="workflow-pipeline__step-num">ขั้นที่ 1</span>
          <span className="workflow-pipeline__step-label">ตั้งค่าสวน & สิทธิ์</span>
          <span className="workflow-pipeline__step-sub">Farm, Zones, 7 Roles</span>
        </div>
        <div className="workflow-pipeline__step">
          <span className="workflow-pipeline__step-num">ขั้นที่ 2</span>
          <span className="workflow-pipeline__step-label">ผังแปลง & ป้าย QR</span>
          <span className="workflow-pipeline__step-sub">Annual Cycle, Trees, Layout</span>
        </div>
        <div className="workflow-pipeline__step">
          <span className="workflow-pipeline__step-num">ขั้นที่ 3</span>
          <span className="workflow-pipeline__step-label">ปฏิบัติงานภาคสนาม</span>
          <span className="workflow-pipeline__step-sub">Work Order, QR, Before/After</span>
        </div>
        <div className="workflow-pipeline__step">
          <span className="workflow-pipeline__step-num">ขั้นที่ 4</span>
          <span className="workflow-pipeline__step-label">ดูแล & คุมโรค</span>
          <span className="workflow-pipeline__step-sub">Incident → Agronomist → Care</span>
        </div>
        <div className="workflow-pipeline__step">
          <span className="workflow-pipeline__step-num">ขั้นที่ 5</span>
          <span className="workflow-pipeline__step-label">ผลผลิต & การขาย</span>
          <span className="workflow-pipeline__step-sub">Fruit Count → Harvest → Sales</span>
        </div>
        <div className="workflow-pipeline__step">
          <span className="workflow-pipeline__step-num">ขั้นที่ 6</span>
          <span className="workflow-pipeline__step-label">สรุปผล & ต้นทุน</span>
          <span className="workflow-pipeline__step-sub">Labor + Material → Reports</span>
        </div>
      </div>
    </div>
  )
}
