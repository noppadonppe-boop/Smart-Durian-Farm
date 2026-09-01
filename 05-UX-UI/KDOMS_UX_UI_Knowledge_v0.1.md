# KDOMS UX/UI Knowledge v0.1.8

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1.8 |
| สถานะ | Approved Development Baseline — Annual Cycle and Management Reporting/Cost (DEC-048/049), Orchard Target Actions and Limited Operational Tree Register; Field Usability Deferred |
| เจ้าของเอกสาร | Project Owner |
| Primary platform | Mobile web / PWA |
| Secondary platform | Tablet and desktop management |
| ภาษา | ไทยเป็นหลัก |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Management_Reporting_and_Cost_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Orchard_Layout_and_Target_Selection_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `00-Project-Management/Decision-Log.md` (DEC-030, DEC-043, DEC-045, DEC-046, DEC-047, DEC-048, DEC-049) |

## 1. UX goal

ทำให้ผู้ใช้ภาคสนามมั่นใจว่าอยู่ “ถูกสวน ถูกแถว ถูกต้น ถูกงาน” และบันทึกผลได้แม้สัญญาณไม่เสถียร ส่วนผู้จัดการต้องเห็นสิ่งเร่งด่วนและตรวจรับได้โดยไม่ไล่หาข้อมูลหลายหน้า

## 2. Design principles

1. **Farm context always visible** — ชื่อ/รหัสสวนปัจจุบันอยู่ใน app header ทุกหน้าที่สร้างข้อมูล
2. **Scan confirms, not identifies alone** — QR ยืนยันกับบริบทงานและสิทธิ์
3. **One primary action** — แต่ละหน้ามี action หลักเด่นหนึ่งรายการ
4. **Field first** — ปุ่มแตะง่าย ข้อความสั้น contrast สูง ใช้มือเดียวได้
5. **Offline is a state, not an error** — แสดงสิ่งที่ทำได้ สิ่งที่รอ sync และเวลาซิงก์ล่าสุด
6. **Progressive disclosure** — Worker เห็นสิ่งจำเป็น; รายละเอียดเชิงบริหารอยู่ในหน้าลึกหรือตาม role
7. **Evidence with context** — รูปเชื่อม Farm/Tree/Work/เวลา ไม่เป็นไฟล์ลอย
8. **No color-only meaning** — ทุกสถานะมีคำและ icon ร่วม

## 3. Information architecture

Bottom navigation สำหรับมือถือ:

- `หน้าหลัก` — งานวันนี้ ปัญหาเร่งด่วน สรุปสวน
- `งาน` — งานของฉัน/ทีม สถานะและตัวกรองจำเป็น
- `สแกน` — action กลางสำหรับ QR และกรอกรหัส
- `ต้นไม้` — ค้นหา/ดูทะเบียนและประวัติ
- `เพิ่มเติม` — สวน วัสดุ ผลผลิต การขาย รายงาน ผู้ใช้ ตั้งค่า ตามสิทธิ์

Farm Switcher อยู่ใน top app chrome ไม่ซ้ำในแต่ละโมดูล
Year Switcher อยู่ถัดจาก Farm context และแสดงเฉพาะรอบของ Farm ปัจจุบัน

## 4. Core screens

### 4.1 Home

- Farm name/code และ sync status
- งานวันนี้ งานเกินกำหนด และปัญหาเร่งด่วน
- ปุ่ม “สแกน QR” และ “ดูงานของฉัน”
- การ์ดสรุปต้นป่วย/เฝ้าระวัง ผลก่อนขาย และวัสดุใกล้หมดตาม role
- activity ล่าสุดแบบสั้น

### 4.2 Farm Switcher

- รายการสวนที่มีสิทธิ์ พร้อม role และสถานะ sync
- ชื่อและ Farm Code ต้องแยกได้ชัด
- ค้นหาเมื่อมีหลายสวน; ไม่ต้องแสดง search หากรายการสั้น
- ถ้ามี draft/pending operation ให้เตือนก่อนเปลี่ยน
- หลังเปลี่ยน แสดง confirmation สั้นและ reload farm-scoped data

### 4.3 My Work

- ค่าเริ่มต้นคือ “วันนี้” และ “งานของฉัน”
- รายการแสดงประเภท เป้าหมาย Zone/Row/Tree เวลา ความสำคัญ และสถานะ
- ผู้สร้างเลือกถ่าย/แนบรูปประกอบได้ 0–3 รูปขณะใบงานยังเป็น Draft; หลัง Assign
  ชุดรูปนี้เป็น read-only
- แสดงจำนวนรูปประกอบใบงานเมื่อผู้มอบหมายแนบมา และ Worker เปิดดูได้ก่อนเริ่มงาน
- งานรายต้นมี action “นำทาง/สแกนยืนยัน”
- งานกลุ่มแสดงความคืบหน้าและ exception
- Worker ไม่เห็น action จัดการที่ไม่มีสิทธิ์

### 4.4 Scan

สถานะของ flow:

1. Camera permission explanation
2. Scanning with visible frame
3. Resolving tag
4. Match — แสดงรหัส รูป และ action
5. Mismatch — แสดง expected/actual และห้ามทำงานเดิม
6. Unknown/damaged — กรอกรหัสหรือแจ้งป้ายเสีย
7. Offline cached — บอกว่าข้อมูลอาจไม่ล่าสุดและเวลาซิงก์

### 4.5 Orchard Layout & Shared Target Selector

- แสดง Farm name/code, Zone และจุดอ้างอิงด้านบนของแปลนตลอดเวลา
- Row เป็นคอลัมน์ซ้ายไปขวา; Tree/Position เรียงบนลงล่างตาม sequence
- แตะต้นเพื่อเลือก, แตะหัว Row เพื่อเลือกทั้งแถว และแตะ Zone เพื่อเลือกทั้งโซน
- รองรับ Single, Tree Set, Row และ Zone พร้อมสรุปจำนวน/Tag ที่เลือกก่อนบันทึก
- มีมุมมอง `แปลนต้น` และ `ตารางติ๊กเลือก` ที่ใช้ selection เดียวกัน; สลับแล้ว
  ค่าเลือกต้องคงอยู่ และ horizontal pan อยู่เฉพาะภายในกรอบแต่ละ Zone
- `ตารางติ๊กเลือก` แสดง Zone เป็น section แยก, Row เป็นคอลัมน์ซ้าย→ขวา,
  Position เป็นรายการบน→ล่าง พร้อม checkbox ระดับ Zone/Row/Position ตาม mode
- ต้อง render Zone ทุกค่าจากทะเบียนแบบ data-driven เช่น Z01/Z02/Z03 และห้าม
  hard-code ว่าหนึ่ง Farm มี Zone เดียว
- Position `empty`/Archived แสดงด้วย icon+label และปิดการเลือกเมื่อ Workflow ไม่รองรับ
- หน้าแปลนแสดง action ครบตาม Role/Farm status: `สร้างงานทั่วไป`, `สร้างงานดูแล`,
  `รายงานอาการ/โรค`, `บันทึกจำนวนผล` และ `สร้าง Harvest Lot`; action ที่ยังไม่ผ่าน
  eligibility แสดง disabled reason โดยไม่ใช้สีอย่างเดียว
- หน้าปลายทางกรอง navigation selection กับ Farm ปัจจุบันอีกครั้ง

### 4.6 เพิ่ม/แก้ไขตำแหน่งปลูก

- ใช้ชื่อหน้าจอ `เพิ่มตำแหน่งปลูก` หรือ `แก้ไขตำแหน่งปลูก` ตาม action จริง;
  ห้ามใช้คำว่า `จำลอง` เมื่อ runtime เป็น Firebase Production และ Farm เป็น
  `OPERATIONAL` (`isMock=false`)
- แสดงชื่อ/รหัส Farm และป้ายสถานะข้อมูลที่หัวหน้าเสมอ: `ข้อมูลใช้งานจริง` สำหรับ
  Farm ที่ผ่านเงื่อนไข DEC-046 หรือ `SIMULATED/TEST ONLY` สำหรับ Mock/Emulator/
  Farm จำลอง
- แบ่งแบบฟอร์มเป็น 3 ส่วน: `1. ตำแหน่งและรหัส`, `2. ข้อมูลต้นและรอบปลูก` และ
  `3. ข้อมูลสำรวจเริ่มต้น` เพื่อไม่ให้ผู้ใช้กรอกข้อมูลยาวโดยขาดบริบท
- ส่วนตำแหน่งให้เลือก Zone/Row เดิมหรือสร้างใหม่, ระบุลำดับตำแหน่งและทิศทางนับ
  พร้อมสรุป Farm + Zone + Row + Position และ Tag preview ก่อนบันทึก
- เมื่อสร้าง Zone/Row ใหม่ ต้องให้ผู้ใช้ยืนยันรหัสและทิศทางอย่างชัดเจน เพราะเป็น
  ส่วนของตัวตนตำแหน่งถาวร; หากข้อมูล topology ยังไม่ยืนยันให้หยุดและใช้ `TBD`
- ส่วนข้อมูลต้นให้เลือกสถานะ `มีต้น`/`ไม่มีต้น`; ถ้า `ไม่มีต้น` ให้ปิด field พันธุ์,
  ปีปลูก, แหล่งพันธุ์ และข้อมูลสำรวจที่อ้างถึงต้นปัจจุบัน
- ส่วนข้อมูลสำรวจใช้ progressive disclosure: วันที่สำรวจ, ผู้บันทึก และหมายเหตุก่อน;
  เส้นรอบวง/ความสูง/พุ่ม/พิกัดแสดงเป็นข้อมูลเสริมพร้อมหน่วยและวิธีเก็บ
- รูปถ่ายต้นจริงยังไม่เปิดในขอบเขต DEC-046 และต้องแสดงข้อความว่า `ยังไม่เปิดใช้รูปถ่าย`
  แทนการแสดง control ที่กดแล้วใช้งานไม่ได้
- มี primary action เดียวคือ `บันทึกตำแหน่งปลูก`; บนมือถือ action ต้องเข้าถึงง่าย,
  สรุป validation ใกล้ field และไม่มี horizontal overflow ที่ 320px

### 4.7 Tree profile

- รหัสใหญ่ + Farm/Zone/Row + รูปอ้างอิง
- พันธุ์ Planting Cycle สถานะ และการตรวจล่าสุด
- Quick actions ตาม role: รายงานอาการ, บันทึกงาน, นับผล
- Tabs/sections: Timeline, Care, Disease, Fruit, Harvest
- Planting Cycle เดิมต้องดูย้อนหลังได้แต่แยกจากต้นปัจจุบัน

### 4.8 Worker report

- แสดงรูปประกอบจากผู้มอบหมายแยกส่วนและติดป้ายว่าเป็น “รูปอ้างอิง”
- แสดง target และ scanned-confirmed state ที่หัวหน้า
- ขั้นตอน checklist สั้น
- Actual quantity + unit, material used, result, note และรูปหลักฐาน BEFORE/AFTER
  รวมไม่เกิน 6 รูป โดยต้องมีอย่างน้อยประเภทละ 1 รูป
- Save offline ชัดเจน
- Submit confirmation สรุปสิ่งที่จะส่ง
- หลังส่ง แสดง Pending sync หรือ Submitted/Waiting verification

### 4.9 Manager verification

- รูปประกอบเดิมของใบงานเทียบกับภาพก่อน–หลังที่ Worker ส่ง พร้อม worker, time,
  target และ material variance
- Approve, Request rework, Reject พร้อมเหตุผลบังคับในกรณีหลัง
- การแก้ข้อมูลแทน Worker ต้อง audit

### 4.10 Farm Management

- `เพิ่มเติม → จัดการสวน` แสดงเฉพาะ `ORG_OWNER`; role อื่นเปิด Profile แบบอ่านอย่างเดียว
- Farm list และ status พร้อมปุ่ม `เพิ่มสวน`
- แบบฟอร์มสั้นแบ่งเป็นข้อมูลหลัก, ที่ตั้ง, timezone/ฤดูกาล และหมายเหตุ
- แสดง preview Farm Code จาก Organization Code + Farm Sequence
- Farm profile, zones, members/roles เป็นส่วนแยกที่ไม่ทำให้ข้อมูลข้ามสวน
- Suspend/Archive flow แสดงผลกระทบต่องานเปิดและ Pending ก่อนยืนยัน
- Archive ถูกปฏิเสธเมื่อยังมีงานเปิด/Pending และไม่มีปุ่ม Hard delete
- อยู่ใน More/Admin ไม่อยู่ใน bottom nav สำหรับ Worker

### 4.11 รอบบริหารสวนรายปี

- เมนู `เพิ่มเติม → รอบบริหารสวนรายปี`
- Header แสดง Farm และ Annual Cycle เป็น context แยกกัน พร้อมสถานะและช่วงวันที่
- Year Switcher แสดงรอบปัจจุบัน รอบอนาคต และรอบปิดแล้วของ Farm ปัจจุบันเท่านั้น
- เปลี่ยน Farm แล้วต้องล้าง/โหลด Annual Cycle ใหม่; ห้ามคง Cycle ID จาก Farm เดิม
- ค่าเริ่มต้นแบบฟอร์มคือ 1 มิถุนายนและแสดงวันสิ้นสุด 31 พฤษภาคมของปีถัดไป
- Owner เลือกวันเริ่มเฉพาะ Farm ได้; วันสิ้นสุดเป็น read-only derived 12 เดือน
- หน้าแยก Summary, Annual Plan, Carry-over และ Close/Correction
- Plan ระดับ Farm/Zone เป็นค่าเริ่มต้น; Tree Set ใช้ Shared Target Selector เมื่อจำเป็น
- Closed Cycle ไม่มีปุ่มแก้ปกติ มี action `บันทึก Correction` พร้อมเหตุผลและสรุป
  before/after เท่านั้น
- ทุกหน้า Development แสดง `SIMULATED/TEST ONLY`; mobile 320px ไม่มี overflow

### 4.12 รายงานการจัดการสวนและต้นทุน

- เมนู `เพิ่มเติม → รายงานผลสวนและต้นทุน` ตาม Role
- Header แสดง Farm, Annual Cycle และ `SIMULATED/TEST ONLY` ชัดเจน
- ตัวเลือกรอบมีรายสัปดาห์ รายเดือน ราย 3 เดือน รายปี และวันที่อ้างอิง
- Summary แยกผลผลิต ยอดขาย ต้นทุนบริหาร และ Management Margin; แสดง
  `N/A`, `UNKNOWN`, `ESTIMATED` โดยไม่ใช้ศูนย์แทนค่าที่ไม่ทราบ
- Cost breakdown แยก Material, Labor, Operating และ Capital พร้อมข้อความ
  `ไม่ใช่ Payroll/บัญชี/ภาษี`
- Drill-down เป็นตารางที่ยังอ่าน/เลื่อนได้บนมือถือ
- Form ค่าแรง/ค่าใช้จ่ายเป็น Append-only ไม่มีปุ่มแก้/ลบใน Baseline
- CSV เป็น action รองและแสดงว่าไม่มี public link/external distribution

## 5. Content and terminology

- ใช้ `สวน`, `โซน`, `แถว`, `ต้น`, `งาน`, `รายงานผล`, `รอตรวจ`, `ซิงก์แล้ว`
- แสดงรหัส machine ID แบบ monospace แต่มีชื่อไทยกำกับ
- หลีกเลี่ยงคำว่า `Submit`, `Sync`, `Conflict` เดี่ยว ๆ; ใช้ `ส่งรายงาน`, `รอซิงก์`, `ข้อมูลขัดแย้ง`
- Error ต้องบอกว่าเกิดอะไร ข้อมูลปลอดภัยหรือไม่ และต้องทำอย่างไรต่อ
- ห้ามใช้ข้อความยืนยันคลุมเครือ เช่น “OK” สำหรับ action ที่สำคัญ
- หน้าทะเบียนต้นต้องใช้ข้อความตาม classification จริงของ Farm; ห้ามซ่อนคำว่า
  `SIMULATED/TEST ONLY` ในโหมดจำลอง และห้ามเติมคำว่า `จำลอง` ในโหมดใช้งานจริง

ตัวอย่าง:

- ดี: `บันทึกในเครื่องแล้ว — จะซิงก์เมื่อมีสัญญาณ`
- ดี: `ป้ายที่สแกนคือ T018 แต่ใบงานต้องทำ T017`
- ไม่ดี: `Error 409`

## 6. Status language

| Domain | Status ที่ผู้ใช้เห็น |
|---|---|
| Tree | ปกติ / เฝ้าระวัง / ป่วย / พักฟื้น / ตาย / ไม่มีต้น |
| Work | ร่าง / มอบหมายแล้ว / รับงาน / กำลังทำ / ส่งตรวจ / ให้แก้ / เสร็จแล้ว |
| Disease | เปิดเคส / รอวินิจฉัย / กำลังรักษา / รอติดตาม / ปิดเคส |
| Sync | ออฟไลน์ / บันทึกในเครื่อง / กำลังซิงก์ / ซิงก์แล้ว / ข้อมูลขัดแย้ง |
| Farm | ใช้งาน / ระงับ / เก็บถาวร |
| Annual Cycle | ร่าง / วางแผนแล้ว / กำลังดำเนินการ / กำลังปิดรอบ / ปิดรอบแล้ว |

## 7. Offline UX

- persistent compact indicator ที่ header
- แสดงจำนวนรายการค้างส่งเมื่อมากกว่า 0
- บันทึก action ได้เฉพาะข้อมูลที่ policy อนุญาตให้ queue
- รูป pending มี thumbnail และ retry/remove ก่อน submit final
- รูปประกอบใบงานที่จำเป็นต่อการทำงานควรมี thumbnail cache; หากยังไม่พร้อม offline
  ต้องแสดงชัดว่าเปิดรูปไม่ได้และห้ามนำรูปจาก Work/Farm อื่นมาแทน
- ห้ามแสดง “สำเร็จ” หากยังไม่ sync; ใช้ “บันทึกในเครื่องแล้ว”
- Farm switching ต้องไม่ทำ pending item สูญหายหรือเปลี่ยน farm scope
- Conflict เปิด comparison และให้ role ที่กำหนดตัดสินใจ

## 8. Accessibility and field ergonomics

- รองรับ 320px ขึ้นไป ไม่มี horizontal scroll ใน task flow
- Touch target ประมาณ 44×44px สำหรับ action หลัก
- Editable field บนมือถือใช้ตัวอักษรอย่างน้อย 16px เพื่อหลีกเลี่ยง auto zoom
- สีมีข้อความและ icon; contrast เพียงพอกลางแจ้ง
- label ไม่หายเมื่อกรอกค่า
- ตัวเลขใช้ numeric keypad และแสดงหน่วยติดกับค่า
- การถ่ายภาพ/สแกนมี fallback
- ไม่ใช้ gesture อย่างเดียวสำหรับ action สำคัญ

## 9. Role adaptation

- `WORKER`: Home เน้นงานของฉันและ Scan
- `FARM_MANAGER`: เพิ่มงานทีม Verify และปัญหาเร่งด่วน
- `AGRONOMIST`: เพิ่ม Disease queue และ Follow-up
- `ORG_OWNER`: Farm/Portfolio switch และภาพรวมหลายสวน
- `SALES_INVENTORY`: Harvest/Sales/Inventory ตาม Farm และ policy
- `VIEWER`: read-only state ชัดเจน ไม่มีปุ่มแก้ไข, audit หรือ export โดยอัตโนมัติ
- `AUDITOR`: read-only audit/export ตาม assignment ไม่มีปุ่มแก้ข้อมูลปฏิบัติการ

Role เปลี่ยนความสามารถ ไม่เปลี่ยนคำศัพท์หลักหรือโครงสร้างแบบทำให้ผู้ใช้หลง

## 10. Prototype scenarios

UX Preview ต้องสาธิตอย่างน้อย:

1. สลับระหว่างสวนก้องลักษณ์กับสวนตัวอย่างที่สอง
2. ดูงานเร่งด่วนและงานวันนี้
3. เปิด Scan และจำลองพบ `KGL-F01-Z01-R03-T017`
4. เห็นผลยืนยันต้นและเปิด Tree Profile
5. ดูรายการต้นไม้และเมนูเพิ่มเติม
6. เห็นสถานะ Offline/Sync โดยไม่ต้องเชื่อม backend
7. กรอกรหัส T018 แล้วแสดง Farm/Zone/Row/Tree จากรหัสจริง
8. เมื่อ Offline/Pending ให้ยกเลิกหรือยืนยันการสลับสวนได้ โดย pending item
   ยังคง Farm scope เดิม
9. ทำ Worker Report แล้วเปิด Manager Verify เพื่อ Approve หรือ Request Rework
10. Owner เพิ่ม/แก้ Farm Profile จำลอง ระงับ/เปิดใหม่ และเห็น Archive ถูกหยุด
    เมื่อมีงานเปิดหรือ Pending
11. เปิดหน้าเพิ่มตำแหน่งปลูก, ยืนยัน Zone/Row/ทิศทาง, ดู Tag preview และตรวจว่า
    การเลือก `ไม่มีต้น` ปิดข้อมูลต้น/ข้อมูลสำรวจที่ไม่เกี่ยวข้อง

ข้อมูลใน Prototype/browser simulation เป็นข้อมูลจำลอง แม้หน้าตาและ validation จะใช้
แบบเดียวกับหน้าจอใช้งานจริงตาม DEC-046

## 11. Usability acceptance

- ผู้ใช้บอกได้ตลอดว่ากำลังทำงานในสวนใด
- Worker เข้าถึง Scan จากทุกหน้าหลักภายในหนึ่ง action
- Scan mismatch ไม่สามารถ complete งานเดิม
- Mismatch แสดง expected/actual ที่ parse จาก code จริง
- Main task flow ใช้ได้ที่ 320px โดยไม่มีข้อความ/ปุ่มทับกัน
- ผู้ใช้เข้าใจความต่างระหว่าง `บันทึกในเครื่อง` และ `ซิงก์แล้ว`
- ผู้ใช้แยกได้ว่ารูปใดเป็นรูปประกอบจากผู้มอบหมาย และรูปใดเป็นหลักฐานก่อน–หลัง
- Role ที่ไม่มีสิทธิ์ไม่เห็น destructive/admin action
- Farm Management แยกจาก Farm Switcher และไม่มี Hard delete action
- ผู้ใช้บอกได้ว่ากำลังดู Farm และรอบปีใด; Year Switcher ไม่ปะปนข้าม Farm
- รอบ Closed แสดง Correction-only และไม่เปิด edit ปกติ
- Shared Target Selector ใช้คำและพฤติกรรมเดียวกันใน Work, Disease, Fruit และ Harvest
- แปลนเรียง Row ซ้าย→ขวาและ Position บน→ล่าง พร้อม list fallback และไม่มี
  horizontal scroll ทั้งหน้าที่ 320px
- หน้าเพิ่ม/แก้ตำแหน่งปลูกแสดง Farm/classification, แบ่ง 3 ส่วน, ยืนยันตัวตนตำแหน่ง
  ก่อนบันทึก และไม่ยอมให้ `ไม่มีต้น` มีข้อมูลต้นปัจจุบันที่ขัดแย้งกัน
- runtime/Farm ที่ไม่ผ่านเงื่อนไข DEC-046 ต้องยังแสดง `SIMULATED/TEST ONLY` และ
  ไม่สร้าง record ที่มี `exampleData=false`
- หน้ารายงานแสดงตัวเลือกรอบครบ 4 ค่า, แยก Capital, มี Data quality flags และ
  ผู้ใช้เข้าใจว่า Management Margin ไม่ใช่กำไรบัญชี
- ระหว่าง Development ตรวจ UX ด้วย Mock Data, browser และ viewport simulation
- ทดสอบกับผู้ใช้/อุปกรณ์จริงระหว่าง Controlled Pilot และแก้ผลก่อน Production
  rollout; การไม่มี field usability evidence ไม่ block การสร้างหน้าจอ

## 12. Open UX decisions

- Working Proposal: display name `Smart Durian Farm`; technical name `KDOMS`
- UX สำหรับ Phone OTP: resend/timeout/error และกรณีเปลี่ยนหรือสูญเสียเบอร์โทรศัพท์
- Worker ต้องเห็น Farm Switcher หรือระบบล็อกสวนประจำกะ
- รูปแบบ Home ของ Owner กับ Worker แยกมากน้อยเพียงใด
- ขั้นตอนอนุมัติการรักษาและการใช้สารเคมี
- อุปกรณ์จริง สภาพถุงมือ/แสง/เครือข่าย
- เกณฑ์แจ้งเตือนที่ไม่ทำให้ notification ล้น
- UX สำหรับการ trusted-provision Farm `OPERATIONAL` และการยืนยัน topology โดย Owner;
  ปุ่ม `เพิ่มสวน` ปัจจุบันยังสร้าง Farm จำลองเท่านั้น
