# KDOMS Scope Knowledge v0.2 — Multi-Farm

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.2 |
| สถานะ | Proposed — Owner Review Required |
| เจ้าของเอกสาร | Project Owner |
| แทนที่ | Scope v0.1 single-farm concept |
| วันที่ปรับปรุง | 2026-08-31 |
| Gate | Gate 0 review |
| Source of Truth | `AGENTS.md`, `00-Project-Management/Decision-Log.md` |

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
7. ตรวจ Field Validation 30–50 ต้นก่อนล็อก Phase 3 และทำ Operational
   Application Pilot ใน Phase 7 ก่อนขยายประมาณ 600 ต้น

## 4. Domain hierarchy

```text
Organization
├── Organization members
└── Farm
    ├── Farm members and roles
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

รายละเอียด permission อยู่ที่
`01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md` ซึ่งยังเป็น `Proposed`
และต้องได้รับ Owner formal approval ก่อน Gate 0 ผ่าน

## 7. Functional scope

### 7.1 Farm Management

- Farm list, create/edit, active/suspended/archived status
- Farm profile และ Farm Switcher
- Member invitation/removal และ role assignment รายสวน
- Portfolio overview ที่ไม่เปิดเผยข้อมูลเกินสิทธิ์

### 7.2 Orchard Map and Tree Register

- กำหนด Zone/Row/ทิศทางการนับ
- สร้าง Planting Position และ Tag Code
- ข้อมูลต้น: พันธุ์ แหล่งพันธุ์ วันที่/ปีปลูกโดยประมาณ รุ่นปลูก สถานะ
- Baseline measurement: ความสูง เส้นรอบวง/เส้นผ่านศูนย์กลาง ณ จุดวัดที่กำหนด ทรงพุ่ม 2 ทิศ
- GPS และรูปประจำต้น
- Tree timeline และ Planting Cycle history
- Import/export ตามสิทธิ์

### 7.3 Work Orders

- เป้าหมายระดับ Farm/Zone/Row/Tree selection
- ประเภทงาน ขั้นตอน ผู้รับผิดชอบ กำหนดส่ง ความสำคัญ และหลักฐาน
- รับงาน เริ่มงาน หยุดชั่วคราว ส่งตรวจ Reject/Rework และปิดงาน
- ภาพก่อน–หลัง วัสดุที่ใช้ และหมายเหตุ
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
- Sales lot, customer reference, quantity/weight, price, deposit, received, outstanding
- Traceability ระหว่าง Crop Cycle → Harvest Lot → Sales Lot
- Customer reference เก็บข้อมูลขั้นต่ำเท่าที่จำเป็น
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

## 8. Core workflows

### 8.1 Worker completes a tree task

```text
เลือกสวน → งานของฉัน → เปิดงาน → เดินตาม Zone/Row
→ สแกน QR → ระบบตรวจ Farm/Tree → เริ่มงาน
→ บันทึกผล/วัสดุ/ภาพ → ส่งตรวจ → Sync → Manager verify
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
- รูปควรมี capture time, farm scope, target และ upload/sync state
- ใช้ server timestamp สำหรับเวลาที่เชื่อถือได้ พร้อมเก็บ capturedAt จากอุปกรณ์เมื่อจำเป็น
- ห้าม reuse Tag Code
- ห้ามบันทึกจำนวนผลโดยไม่ระบุ stage และ Crop Cycle
- ห้าม Inventory movement ไม่มี unit, quantity และ reason/reference
- การเปลี่ยนบทบาท สถานะโรค ปิดงาน ปรับ stock และแก้ยอดขายต้อง audit

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
  จะได้รับอนุมัติ

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

รายการ Open/Field Validation:

- Organization Code/Farm Sequence จริง รวมถึง Zone/Row และทิศทางนับ
- Sign-in method สำหรับคนสวน
- Production domain สำหรับ QR ก่อนผลิตป้ายจริงและ Phase 3 sign-off
- หน่วยมาตรฐานและรายการปุ๋ย/ยาที่ใช้จริง
- วิธีวัดต้นและวิธีนับผลมาตรฐาน
- Approval policy สำหรับยา/การรักษา/ปรับ stock/การขาย
- Retention/backup/privacy policy ฉบับ production

ติดตามสถานะใน `00-Project-Management/Decision-Log.md`

## 13. Gate 0 position

เอกสารนี้เป็น Source of Truth ฉบับร่างล่าสุด แต่ยังไม่อนุญาตให้เริ่ม Application Code จนกว่าจะผ่านรายการใน `08-Testing/Gate-0-Acceptance-Checklist.md` และได้รับข้อความอนุมัติ Gate 0

Gate แบ่งเป็น 3 ระดับเพื่อไม่ลดหลักฐานภาคสนาม:

1. **Gate 0 — Product & Documentation Readiness:** Owner อนุมัติ Scope,
   Working Proposals, Role Matrix, Data Dictionary, Field Validation Plan,
   UX Prototype และ security/data-policy baseline สำหรับเริ่ม Foundation
2. **Field Validation Gate:** สำรวจ topology, ทดลองป้าย 5–10 ป้าย และข้อมูลต้น
   30–50 ต้นให้เสร็จก่อนล็อก Phase 3 และก่อนผลิตป้ายจริง
3. **Phase 7 — Operational Application Pilot:** ทดสอบแอปที่ผ่าน Gate 6 กับ
   ผู้ใช้จริงก่อนขยายประมาณ 600 ต้น
