# KDOMS UX/UI Knowledge v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Proposed — Owner Review Required |
| เจ้าของเอกสาร | Project Owner |
| Primary platform | Mobile web / PWA |
| Secondary platform | Tablet and desktop management |
| ภาษา | ไทยเป็นหลัก |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md` |

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

### 4.5 Tree profile

- รหัสใหญ่ + Farm/Zone/Row + รูปอ้างอิง
- พันธุ์ Planting Cycle สถานะ และการตรวจล่าสุด
- Quick actions ตาม role: รายงานอาการ, บันทึกงาน, นับผล
- Tabs/sections: Timeline, Care, Disease, Fruit, Harvest
- Planting Cycle เดิมต้องดูย้อนหลังได้แต่แยกจากต้นปัจจุบัน

### 4.6 Worker report

- แสดง target และ scanned-confirmed state ที่หัวหน้า
- ขั้นตอน checklist สั้น
- Actual quantity + unit, material used, result, note, photos
- Save offline ชัดเจน
- Submit confirmation สรุปสิ่งที่จะส่ง
- หลังส่ง แสดง Pending sync หรือ Submitted/Waiting verification

### 4.7 Manager verification

- Before/after, worker, time, target และ material variance
- Approve, Request rework, Reject พร้อมเหตุผลบังคับในกรณีหลัง
- การแก้ข้อมูลแทน Worker ต้อง audit

### 4.8 Farm Management

- Farm list และ status
- Farm profile, zones, members/roles
- Archive flow แสดงผลกระทบต่องานเปิดและข้อมูล
- อยู่ใน More/Admin ไม่อยู่ใน bottom nav สำหรับ Worker

## 5. Content and terminology

- ใช้ `สวน`, `โซน`, `แถว`, `ต้น`, `งาน`, `รายงานผล`, `รอตรวจ`, `ซิงก์แล้ว`
- แสดงรหัส machine ID แบบ monospace แต่มีชื่อไทยกำกับ
- หลีกเลี่ยงคำว่า `Submit`, `Sync`, `Conflict` เดี่ยว ๆ; ใช้ `ส่งรายงาน`, `รอซิงก์`, `ข้อมูลขัดแย้ง`
- Error ต้องบอกว่าเกิดอะไร ข้อมูลปลอดภัยหรือไม่ และต้องทำอย่างไรต่อ
- ห้ามใช้ข้อความยืนยันคลุมเครือ เช่น “OK” สำหรับ action ที่สำคัญ

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

## 7. Offline UX

- persistent compact indicator ที่ header
- แสดงจำนวนรายการค้างส่งเมื่อมากกว่า 0
- บันทึก action ได้เฉพาะข้อมูลที่ policy อนุญาตให้ queue
- รูป pending มี thumbnail และ retry/remove ก่อน submit final
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

ข้อมูลทั้งหมดใน Prototype เป็นข้อมูลจำลอง

## 11. Usability acceptance

- ผู้ใช้บอกได้ตลอดว่ากำลังทำงานในสวนใด
- Worker เข้าถึง Scan จากทุกหน้าหลักภายในหนึ่ง action
- Scan mismatch ไม่สามารถ complete งานเดิม
- Mismatch แสดง expected/actual ที่ parse จาก code จริง
- Main task flow ใช้ได้ที่ 320px โดยไม่มีข้อความ/ปุ่มทับกัน
- ผู้ใช้เข้าใจความต่างระหว่าง `บันทึกในเครื่อง` และ `ซิงก์แล้ว`
- Role ที่ไม่มีสิทธิ์ไม่เห็น destructive/admin action
- ทดสอบกับคนสวนจริงก่อนล็อก Knowledge เป็น Approved

## 12. Open UX decisions

- Working Proposal: display name `Smart Durian Farm`; technical name `KDOMS`
- วิธี sign-in ที่ง่ายและปลอดภัยที่สุด
- Worker ต้องเห็น Farm Switcher หรือระบบล็อกสวนประจำกะ
- รูปแบบ Home ของ Owner กับ Worker แยกมากน้อยเพียงใด
- ขั้นตอนอนุมัติการรักษาและการใช้สารเคมี
- อุปกรณ์จริง สภาพถุงมือ/แสง/เครือข่าย
- เกณฑ์แจ้งเตือนที่ไม่ทำให้ notification ล้น
