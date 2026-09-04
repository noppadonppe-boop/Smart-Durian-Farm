# KDOMS Scope Knowledge v0.3.0 — Multi-Farm

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.3.0 |
| สถานะ | Approved Baseline — Orchard Layout Direction Selector (DEC-052), Owner-only Financial Data, Annual Cycle, Reporting/Cost and Limited Operational Tree Register |
| เจ้าของเอกสาร | Project Owner |
| แทนที่ | Scope v0.1 single-farm concept |
| วันที่ปรับปรุง | 2026-09-04 |
| Gate | Gate 0 review |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Management_Reporting_and_Cost_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Orchard_Layout_and_Target_Selection_Knowledge_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `00-Project-Management/Decision-Log.md` (DEC-030, DEC-043, DEC-045, DEC-046, DEC-047, DEC-048, DEC-049, DEC-052) |

## 1. Product statement

KDOMS เป็น Responsive Web App/PWA สำหรับบริหารจัดการสวนทุเรียนหลายสวน โดยใช้ “ตำแหน่งต้น + ป้ายรหัส + QR + ประวัติเหตุการณ์” เป็นแกนกลาง เพื่อให้คนทำงานค้นหาต้นที่ถูกต้อง บันทึกงานได้ง่าย และให้เจ้าของติดตามสุขภาพ ผลผลิต ต้นทุน และการขายได้ตามสิทธิ์

## 2. ปัญหาที่ต้องแก้

- การเรียกต้นด้วยคำบอกตำแหน่งไม่ตรงกัน ทำให้ทำงานผิดต้น
- ประวัติใส่ปุ๋ย ยา โรค และการรักษากระจัดกระจาย
- การสั่งงานและตรวจรับงานคนสวนไม่มีหลักฐานต่อเนื่อง
- จำนวนผลแต่ละช่วงและผลผลิตจริงเชื่อมกันยาก
- ต้นทุน วัสดุ ผลผลิต และการขายไม่ได้อ้างกลับถึงสวน/ล็อต/ต้น
- เมื่อมีหลายสวน ผู้ใช้ สิทธิ์ และข้อมูลอาจปะปนกัน
- สัญญาณอินเทอร์เน็ตในสวนไม่เสถียร

## 3. Outcomes ที่คาดหวัง

1. ต้นทุกตำแหน่งในกลุ่ม Field Validation มีรหัสไม่ซ้ำและค้นหาได้
2. Worker ยืนยันต้นด้วย QR ก่อนส่งงานรายต้น
3. Owner/Manager เห็นงานค้าง ปัญหาเร่งด่วน และประวัติที่ตรวจสอบได้
4. ข้อมูลแต่ละสวนไม่รั่วข้ามสวน
5. บันทึกภาคสนามทำต่อได้เมื่อสัญญาณขาด และไม่สร้างเหตุการณ์ซ้ำ
6. Fruit observation เชื่อมถึง Crop Cycle และ Harvest/Sales lot
7. พัฒนาด้วย Mock Data Pack จนได้ Pilot Candidate แล้วตรวจอุปกรณ์/ภาคสนามด้วย
   cohort จำกัดระหว่าง Controlled Operational Pilot ก่อน Production หรือขยายใช้งาน

## 4. Domain hierarchy

```text
Organization
├── Organization members
└── Farm
    ├── Farm members and roles
    ├── Annual Farm Management Cycles → Annual Plan Items / Corrections
    ├── Zone → Row → Planting Position → Planting Cycle
    ├── Work Orders → Worker Reports
    ├── Care Events / Disease Incidents
    ├── Crop Cycles → Fruit Observations
    ├── Harvest Lots → Sales Lots
    ├── Inventory Items → Inventory Movements
    └── Audit Events
```

### ความหมายสำคัญ

- **Organization**: เจ้าของเชิงธุรกิจที่มีหนึ่งหรือหลายสวน
- **Farm**: ขอบเขตข้อมูลและสิทธิ์ปฏิบัติการหลัก
- **Planting Position**: จุดปลูกถาวรที่ป้ายอ้างถึง
- **Planting Cycle**: ต้นชีวภาพแต่ละรุ่นที่เคยอยู่ ณ ตำแหน่งนั้น
- **Crop Cycle**: ฤดู/รุ่นผลผลิต ไม่ใช่ Planting Cycle
- **Annual Farm Management Cycle**: รอบบริหาร Farm ระยะ 12 เดือนสำหรับแผน
  กิจกรรมและสรุปรายปี ไม่ใช่ Crop Cycle หรือ Planting Cycle

## 5. Multi-Farm rules

1. Human-readable namespace ใช้ Working Proposal
   `{organizationCode}-{farmSequence}` เช่น `KGL-F01`; `farmSequence`
   ต้องไม่ซ้ำภายใน Organization
2. เมนู Farm Switcher แสดงเฉพาะสวนที่ผู้ใช้มี membership
3. ทุกหน้าที่สร้างข้อมูลต้องแสดงสวนปัจจุบัน
4. การเปลี่ยนสวนต้องเคลียร์หรือจัดการ draft/pending operation อย่างปลอดภัย
5. Farm A และ Farm B มี Tree, Work, Inventory, Harvest, Sale และ Audit แยกกัน
6. บทบาทเป็นรายสวน ไม่สืบทอดจากสวนอื่นโดยอัตโนมัติ
7. `ORG_OWNER` ดูภาพรวมได้ตาม policy แต่ `WORKER` ไม่เห็น Portfolio Dashboard
8. Archive Farm ต้องไม่ทำลายประวัติ และต้องกำหนดพฤติกรรมของงานเปิด
9. Cross-farm copy/transfer ไม่อยู่ใน MVP
10. ทุก API/query/rule ต้องทดสอบ Cross-Farm denial

`organizationId`, `farmId` และ `positionId` ภายในระบบต้องเป็น globally unique
opaque IDs ส่วน Human-readable Tag Code ต้องไม่ซ้ำภายใน Organization/Farm
namespace และห้ามใช้ human code เป็น authorization

## 6. Roles and indicative permissions

Canonical roles ฉบับ Working Proposal มี 7 roles:
`ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST`, `WORKER`, `SALES_INVENTORY`,
`VIEWER` และ `AUDITOR`

- `ORG_OWNER` เป็น organization-scoped และดูแล Farm/membership ตาม policy
- Role อื่นเป็น farm-scoped; ผู้ใช้คนเดียวมี role ต่างกันในแต่ละ Farm ได้
- `VIEWER` อ่านข้อมูลธุรกิจตามสิทธิ์ แต่ไม่มีสิทธิ์ audit/export โดยอัตโนมัติ
- `AUDITOR` อ่าน audit/export ตาม scope ที่กำหนดและไม่แก้ข้อมูลปฏิบัติการ
- `SALES_INVENTORY` ดูแล Harvest/Sales/Inventory ตาม least privilege
- เฉพาะ trusted Organization Owner (`ACTIVE` + `isOwner=true`) เห็น/เขียนราคา
  ยอดเงิน ต้นทุน ค่าแรง ค่าใช้จ่าย Financial Dashboard/Report/Audit/Export;
  Role อื่นเห็นเฉพาะข้อมูลปฏิบัติการที่ไม่มี Financial fields

รายละเอียด permission อยู่ที่
`01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md` ซึ่งยังเป็น `Proposed`
และต้องได้รับ Owner formal approval ก่อน Gate 0 ผ่าน

## 7. Functional scope

### 7.1 Farm Management

- เมนู `เพิ่มเติม → จัดการสวน` สำหรับ `ORG_OWNER`
- Farm list, create/edit, active/suspended/archived status พร้อม Audit
- Farm profile ใช้ชื่อ, Farm Sequence/Code, ที่ตั้ง, timezone, ฤดูกาล,
  สถานะ และหมายเหตุตาม
  `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`
- สร้าง internal ID และ Farm Code ตาม trusted flow; ห้ามผู้ใช้กรอก opaque ID เอง
- Archive ต้องรักษาประวัติและหยุดเมื่อมีงานเปิดหรือ Pending; ห้าม Hard delete Farm
- Farm Switcher ใช้สลับสวนที่มี membership ไม่ใช้แทนหน้าจัดการสวน
- Member invitation/removal และ role assignment รายสวน
- Portfolio overview ที่ไม่เปิดเผยข้อมูลเกินสิทธิ์

### 7.1.1 Annual Farm Management Cycle

- หนึ่งรอบยาว 12 เดือน ค่าเริ่มต้น 1 มิถุนายน–31 พฤษภาคม
- Owner กำหนดวันเริ่มเฉพาะ Farm ได้; วันสิ้นสุด derive อัตโนมัติ
- รอบไม่ทับกันและมี Active/Closing รวมกันไม่เกินหนึ่งรอบต่อ Farm
- สถานะ Draft → Planned → Active → Closing → Closed
- วางแผนระดับ Farm/Zone เป็นหลัก และ Tree Set เฉพาะกรณีจำเป็น
- Annual Cycle เป็น parent ของ Crop Cycle หนึ่งหรือหลายรายการ
- Master data/Position/Planting Cycle ไม่สร้างซ้ำเมื่อเปิดปีใหม่
- รอบ Closed อ่านได้และแก้เฉพาะ Correction พร้อม Audit/revision
- Carry-over ไม่ clone Work/Disease actual history; copy ได้เฉพาะ Plan
- เมนูและ Year Switcher ต้องคง Farm context และล้าง Cycle เมื่อเปลี่ยน Farm
- implementation/test ตาม DEC-048 เป็น Mock/local/Firebase Emulator เท่านั้น

### 7.2 Orchard Map and Tree Register

- กำหนด Zone/Row/ทิศทางการนับ
- แสดงแปลนเชิงโครงสร้างพร้อมชื่อ/รหัส Farm และกรอบ Zone โดยเลือก projection ได้
  2 แบบ: Row แนวตั้งวาง Row ซ้าย→ขวาและ Position บน→ล่าง หรือ Row แนวนอนวาง
  Row บน→ล่างและ Position ซ้าย→ขวา ทั้งสองแบบเรียง Position ตาม `treeSequence`
  เดิมและด้านบนต้องมี reference label
- ตำแหน่งต้นในแปลนใช้วงกลมพร้อม Human-readable TAG/หมายเลขใต้ต้น โดย Tag
  เป็นข้อมูลแสดงผล ไม่ใช่ identity หรือ authorization; การสลับทิศทางไม่ล้าง selection
- ใช้ Shared Target Selector สำหรับ Single/Tree Set/Row/Zone ใน Workflow ที่ต้อง
  เลือกตำแหน่ง และรองรับ Tree Set ข้าม Zone ภายใน Farm เดียวกัน
- Shared Target Selector มีทั้ง `แปลนต้น` และ `ตารางติ๊กเลือก` โดย selection คงอยู่
  ขณะสลับมุมมอง และ render Zone ทุกค่าจากข้อมูลแบบ data-driven
- หน้าแปลนเปิดรายการจาก selection ครบ Work ทั่วไป, Work ดูแล, Disease Incident,
  Fruit Observation และ Harvest Lot ตาม Role/Farm/position eligibility
- Position `empty`/Archived ยังคงเห็นในแปลน แต่ eligibility สำหรับ mutation
  เป็นไปตามชนิด Workflow; การเลือกจากแปลนไม่แทน QR confirmation
- สร้าง Planting Position และ Tag Code
- หน้าจอ `เพิ่มตำแหน่งปลูก` แบ่งเป็นตัวตนตำแหน่ง, ข้อมูลต้น/รอบปลูก และ
  ข้อมูลสำรวจภาคสนามแบบ progressive disclosure
- เลือก Zone/Row เดิม หรือยืนยัน Zone/Row ใหม่พร้อมทิศทางการนับ; ต้องแสดง
  Farm context และ Tag preview ก่อนบันทึก permanent Position identity
- ข้อมูลต้น: สถานะ วันที่ข้อมูลตั้งต้น พันธุ์/ความมั่นใจ แหล่งพันธุ์
  วันที่/ปีปลูกโดยประมาณ/ระบบปี/ความมั่นใจ รุ่นปลูก และหมายเหตุ
- Baseline measurement: ความสูง เส้นรอบวง/เส้นผ่านศูนย์กลาง ณ จุดวัดที่กำหนด ทรงพุ่ม 2 ทิศ
- GPS, ลำต้น, ทรงพุ่ม และความสูงเป็น measurement group แบบ all-or-none;
  แต่ละกลุ่มต้องมี value/unit/method/measuredAt/measuredBy/confidence/source
- สถานะ `ไม่มีต้น` ห้ามมีพันธุ์ ปีปลูก แหล่งพันธุ์ หรือค่าการวัดต้น
- รูปประจำต้นยัง Deferred จนกว่า Storage/นโยบายรูปจริงได้รับอนุมัติ
- Tree timeline และ Planting Cycle history
- Import/export ตามสิทธิ์
- DEC-046 อนุญาตข้อมูลจริงเฉพาะ Tree Register ใน Firebase Production + Farm
  `OPERATIONAL` (`isMock=false`); Mock/Emulator/Farm จำลองยังเป็นข้อมูลทดสอบ

### 7.3 Work Orders

- เป้าหมายระดับ Farm/Zone/Row/Tree selection
- การเลือกเป้าหมายจากแปลนต้อง snapshot opaque `positionIds`; Tree Set ข้าม Zone
  เก็บ Zone summary โดยไม่ใช้ Human Tag หรือพิกัดหน้าจอเป็น authorization
- ประเภทงาน ขั้นตอน ผู้รับผิดชอบ กำหนดส่ง ความสำคัญ และหลักฐาน
- ผู้สร้างแนบรูปประกอบคำสั่งงานได้ 0–3 รูปเฉพาะขณะ Draft ก่อน Assign;
  รูปชุดนี้แยกจากหลักฐานที่ Worker ส่งและห้ามเขียนทับหลังมอบหมายแบบเงียบ ๆ
- รับงาน เริ่มงาน หยุดชั่วคราว ส่งตรวจ Reject/Rework และปิดงาน
- Worker Report มีภาพ BEFORE อย่างน้อย 1 และ AFTER อย่างน้อย 1 รวมไม่เกิน
  6 รูป พร้อมวัสดุที่ใช้และหมายเหตุ; ภาพที่อัปโหลดไม่ครบหรือล้มเหลวห้ามส่งตรวจ
- Group completion พร้อม per-tree exception

### 7.4 Care and Disease

- Fertilizer, chemical, water, pruning, inspection และ custom care type
- Symptom observation, severity, suspected diagnosis, confirmed diagnosis
- Treatment plan, application, follow-up และ outcome
- Safety note, product label reference และผู้อนุมัติเมื่อจำเป็น

### 7.5 Fruit Tracking

- Crop Cycle ต่อสวน/พันธุ์/พื้นที่
- Stage: flowering, early fruit, mid-season, pre-sale, harvested
- Count method, sample/full count, observed count, dropped fruit และ confidence note
- Historical trend ต่อ tree/zone/cycle

### 7.6 Harvest and Sales

- Harvest plan และ lot
- จำนวน น้ำหนัก เกรด แหล่งต้น/โซน และภาพ
- Sales lot เชิงปฏิบัติการเก็บ quantity/weight/status แยกจาก Owner-only financial
  record ที่เก็บ customer reference, price, deposit, received และ outstanding
- Traceability ระหว่าง Crop Cycle → Harvest Lot → Sales Lot
- Customer reference เป็น Owner-only และเก็บข้อมูลขั้นต่ำเท่าที่จำเป็น
- ไม่รวม accounting, tax, payroll หรือ banking ใน MVP

### 7.7 Inventory and Cost

- Item master รายสวน
- Stock receipt, issue, adjustment และ reason
- Unit/pack conversion ต้องกำหนด ไม่คาดเดา
- Link usage to Work/Care Event
- Low-stock/expiry alerts
- Direct cost summary ตามสวน/งาน/รอบผลผลิตเท่าที่ข้อมูลรองรับ

### 7.8 Dashboard, Notifications and Audit

- Farm health, urgent disease, overdue work, upcoming work
- Fruit estimate, harvest status, inventory warnings, sales summary
- Notifications ที่ actionable และเปิดกลับไปยัง record ที่เกี่ยวข้อง
- Audit timeline และ export ตามสิทธิ์

### 7.9 Management Reporting and Cost

- Unified Farm report แบบ On-demand: รายสัปดาห์ รายเดือน ราย 3 เดือน และรายปี
- ผูก Farm + Annual Cycle และปฏิเสธแหล่งข้อมูลข้าม Farm แบบ Fail closed
- รวมงาน โรค/ติดตาม Fruit/Harvest/Sales และแยกต้นทุนวัสดุ แรงงาน ดำเนินงาน ลงทุน
- ต้นทุนแรงงานรองรับ Hour/Day/Piece/Lump sum พร้อม Audit/Idempotency
- ค่าใช้จ่ายครอบคลุมปุ๋ย สารป้องกันกำจัดศัตรูพืช ฮอร์โมน น้ำไฟ เชื้อเพลิง
  ซ่อมบำรุง บริการ เก็บเกี่ยว/บรรจุ ขนส่ง ค่าขาย overhead อื่น และ Capital
- Management Margin เป็นยอดขายที่บันทึกลบต้นทุนบริหาร ไม่ใช่กำไรบัญชี
- DEC-049 อนุมัติเฉพาะ Mock-first Local/Firebase Emulator; ไม่รวมข้อมูลจริง,
  Payroll/บัญชี/ภาษี Production write/rules Scheduler/Distribution หรือ Deployment

## 8. Core workflows

### 8.1 Worker completes a tree task

```text
เลือกสวน → งานของฉัน → เปิดงานและดูรูปประกอบ → เดินตาม Zone/Row
→ สแกน QR → ระบบตรวจ Farm/Tree → เริ่มงาน
→ บันทึกผล/วัสดุ/ภาพก่อน–หลัง → ส่งตรวจ → Sync → Manager verify
```

หาก QR ไม่ตรงงาน ระบบต้องหยุดการบันทึกเป้าหมายเดิมและแจ้งรหัสที่สแกนจริงอย่างชัดเจน

### 8.2 Disease incident

```text
พบอาการ → สแกนต้น → บันทึกอาการ/ภาพ/ความรุนแรง
→ แจ้ง Manager/Agronomist → วินิจฉัย → สร้าง Treatment Work Order
→ ทำงาน → นัดติดตาม → ประเมินผล → ปิดหรือรักษาต่อ
```

### 8.3 Fruit-to-sale traceability

```text
เปิด Crop Cycle → บันทึกจำนวนผลตามช่วง → วางแผนเก็บ
→ สร้าง Harvest Lot → ชั่ง/จัดเกรด → สร้าง Sales Lot
→ บันทึกราคา/การรับเงิน → Dashboard/Report
```

## 9. Data quality rules

- แยก unknown, estimated และ measured value
- Measurement ทุกค่าเก็บ value + unit + method + measuredAt + measuredBy
  พร้อม confidence/source ตามความเหมาะสม
- รูปควรมี purpose/phase, capture time, farm scope, Work/target, uploader และ
  upload/sync state; รูปคำสั่งงานต้องแยกจากรูปหลักฐานส่งงาน
- ใช้ server timestamp สำหรับเวลาที่เชื่อถือได้ พร้อมเก็บ capturedAt จากอุปกรณ์เมื่อจำเป็น
- ห้าม reuse Tag Code
- ห้ามบันทึกจำนวนผลโดยไม่ระบุ stage และ Crop Cycle
- ห้าม Inventory movement ไม่มี unit, quantity และ reason/reference
- ข้อมูลปฏิบัติการรายปีต้องอ้าง Annual Cycle ของ Farm เดียวกัน; รอบที่ไม่พบ,
  ทับช่วง หรือ forged Cross-Farm ID ต้องถูกปฏิเสธ
- รอบ Closed ห้ามแก้ข้อมูลหรือ summary เดิมแบบเงียบ ๆ ให้ใช้ Correction/revision
- การเพิ่ม/แก้ไข/เปลี่ยนสถานะสวน การเปลี่ยนบทบาท สถานะโรค ปิดงาน ปรับ stock
  และแก้ยอดขายต้อง audit

## 10. Non-functional requirements

### Mobile and environment

- รองรับหน้าจอขั้นต่ำ 320px และ touch target เหมาะกับการใช้กลางสวน
- ทำงานบนเบราว์เซอร์มือถือสมัยใหม่และติดตั้งเป็น PWA ได้
- UI ภาษาไทยเป็นหลัก ข้อความสั้น อ่านกลางแดดได้
- QR scan มี fallback กรอกรหัสด้วยมือ

### Offline and performance

- อ่านงานและข้อมูลเป้าหมายที่ cache ไว้ได้เมื่อ offline
- บันทึก event/รูปเป็น pending และ retry ได้
- แสดง last sync และ conflict โดยไม่ซ่อน
- รายการหลักตอบสนองเร็วบนเครือข่ายมือถือ; กำหนด budget จริงใน Phase 1

### Security and privacy

- Least privilege, deny by default, farm-scoped authorization
- ไม่มี secret ใน client/repository
- แยก development/test/production
- Backup/export/retention policy ต้องกำหนดก่อน production
- เก็บข้อมูลบุคคลเท่าที่จำเป็นและให้สิทธิ์ตามบทบาท
- Export ต้อง farm-scoped ตามสิทธิ์และสร้าง audit event
- Archive-before-delete เป็นค่าเริ่มต้นสำหรับข้อมูลที่มีประวัติ
- ห้ามใช้ข้อมูลจริง/production จนกว่า retention, backup และ privacy policy
  จะได้รับอนุมัติ ยกเว้น limited Tree Register scope ตาม DEC-046 ซึ่งยังต้องใช้
  Farm `OPERATIONAL`, membership, audit และ data minimization ที่กำหนด

### Accessibility

- สีมี label/icon ร่วม
- Form มี label และ error ที่ระบุวิธีแก้
- รองรับ keyboard สำหรับผู้ใช้ desktop
- ภาพสำคัญมีคำอธิบายหรือ context

## 11. MVP acceptance themes

1. ผู้ใช้เห็นและแก้เฉพาะสวนที่มีสิทธิ์
2. Worker ทำงานรายต้นจาก QR ได้ตั้งแต่เปิดงานจนส่งตรวจ
3. Scan ผิดต้นและผิดสวนถูกปฏิเสธ
4. เหตุการณ์ส่งซ้ำหลัง offline ไม่สร้างรายการซ้ำ
5. ต้นปลูกทดแทนไม่ทำลายประวัติตำแหน่ง
6. Group task ระบุต้นที่สำเร็จ/ไม่สำเร็จได้
7. Owner trace ข้อมูลจากต้นถึง Harvest/Sales lot ได้ในขอบเขตข้อมูลที่บันทึก
8. Audit อธิบายได้ว่าใครเปลี่ยนอะไร เมื่อใด ในสวนใด

## 12. Working Proposals และสิ่งที่ยังต้องตัดสินใจ

Working Proposals ที่รอ Owner formal approval:

- Display name `Smart Durian Farm`; technical name `KDOMS`
- Human Tag namespace `{organizationCode}-{farmSequence}-{zone}-{row}-{tree}`
- Canonical roles 7 rolesตามหัวข้อ 6
- Sales MVP และ data policy baseline ตามเอกสารนี้
- QR route `/t/{opaquePositionId}` ภายใต้ configurable base URL
- Offline conflict review โดย `FARM_MANAGER` และ escalate ถึง `ORG_OWNER`

รายการ Open/Controlled Pilot Validation:

- Organization Code/Farm Sequence จริง รวมถึง Zone/Row และทิศทางนับ
- Farm Profile จริง: ชื่อ ที่ตั้ง timezone และฤดูกาล; ค่าไม่ทราบให้คง `TBD`
- trusted provisioning/activation ของ Farm จริงเป็น `classification=OPERATIONAL`
  และ `exampleData=false`; หน้าเพิ่มสวนเดิมยังสร้าง Farm จำลองตาม DEC-043
- นโยบาย account recovery เมื่อเปลี่ยนหรือสูญเสียเบอร์โทรศัพท์สำหรับ Phone OTP
- Production domain สำหรับ QR ก่อนผลิตป้ายจริงและ Phase 3 sign-off
- หน่วยมาตรฐานและรายการปุ๋ย/ยาที่ใช้จริง
- วิธีวัดต้นและวิธีนับผลมาตรฐาน
- Approval policy สำหรับยา/การรักษา/ปรับ stock/การขาย
- Retention/backup/privacy policy ฉบับ production

ติดตามสถานะใน `00-Project-Management/Decision-Log.md`

## 13. Development, Gate และ Pilot position

Gate 0–6 ผ่านตาม Decision Log และปัจจุบัน Owner อนุมัติ Phase 7 planning/readiness
การพัฒนาแต่ละ Phase ใช้ Mock Data Pack และ automated/local/emulator/browser
evidence เป็นหลัก โดย Physical Device/Field evidence ไม่ block การสร้างฟังก์ชัน

ลำดับปัจจุบันตาม DEC-027:

1. **Engineering Phases/Gates:** สร้างและตรวจแอปด้วยข้อมูล
   `SIMULATED/TEST ONLY`; Phase ถัดไปยังต้องรอ Owner อนุมัติ Gate ตามลำดับ
2. **Staging/Pilot Candidate:** Deploy แบบ private/access-controlled ด้วย Mock Data
   หลังได้รับ approval ด้าน environment/deployment แยก
3. **Controlled Operational Pilot:** ใช้แอป Pilot Candidate กับอุปกรณ์และข้อมูลจริง
   แบบจำกัดหลังอนุมัติ privacy, retention, backup, evidence และ rollback
4. **Production Readiness:** Physical Device/Field Validation ต้องผ่านและ defect
   จาก Pilot ต้องถูกแก้ก่อน Production rollout, ป้ายถาวร หรือ scale-up

ข้อยกเว้น DEC-046: limited operational Tree Register data entry ได้รับอนุมัติด้าน
ชนิดข้อมูลแล้วเฉพาะ Firebase Production + Farm จริง แต่ source รุ่นนี้ยังรอคำสั่ง
Deploy แยก และไม่ยกระดับ Physical/Field, Storage/รูปจริง, QR/ป้ายถาวร, PA-2,
Controlled Pilot หรือโมดูลอื่นเป็น Approved

DEC-048 อนุมัติ Annual Farm Management Cycle เฉพาะ Mock-first Local/Firebase
Emulator ไม่ขยายข้อมูลจริงของ DEC-046 ไปยัง Annual Plan, Work, Disease, Crop,
Inventory, Report หรือ Correction และไม่ใช่ deployment approval

รายละเอียด Mock Data และ timing ใช้
`01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`
เป็นข้อกำหนดเฉพาะด้านนี้
