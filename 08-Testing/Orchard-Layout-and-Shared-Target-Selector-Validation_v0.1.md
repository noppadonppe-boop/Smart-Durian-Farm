# Orchard Layout & Shared Target Selector Validation Report

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.3 |
| สถานะ | Passed Incremental DEC-052 Engineering and Responsive Visual Validation — No Deployment Performed |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-09-04 |
| Source of Truth | AGENTS.md v5.1, DEC-045/047/052, KDOMS Orchard Layout and Target Selection Knowledge v0.3.0, KDOMS Scope Knowledge v0.3.0, KDOMS UX/UI Knowledge v0.2.0, Phase 3 Tree Register & QR Architecture v0.3 |

## 1. สรุปผล

แปลนสวนเชิงโครงสร้างและ Shared Target Selector ผ่าน Engineering Validation
ภายใต้ข้อมูลจำลอง โดยแสดงชื่อสวน แยกโซน เรียงแถวจากซ้ายไปขวา และเรียงลำดับ
ตำแหน่งต้นจากบนลงล่าง ผู้ใช้เลือกตำแหน่งเดียว หลายตำแหน่ง ทั้งแถว หรือทั้งโซนได้
ตามบริบท และส่งชุดตำแหน่งไปยัง Work Order, Disease Incident, Fruit Observation
และ Harvest ได้โดยปลายทางตรวจ Farm scope ซ้ำเสมอ

DEC-047 เพิ่มมุมมอง `ตารางติ๊กเลือก` ควบคู่ `แปลนต้น` โดยใช้ selection เดียวกัน,
รองรับ Zone ทุกค่าจากทะเบียนแบบ data-driven และเพิ่มเมนูจากตำแหน่งที่เลือกครบ
Work ทั่วไป, Work ดูแล, Disease Incident, Fruit Observation และ Harvest Lot

DEC-052 เพิ่มตัวเลือก projection ในมุมมอง `แปลนต้น` เป็น `แถวแนวตั้ง` และ
`แถวแนวนอน` แสดงต้นเป็นวงกลมพร้อมหมายเลขตำแหน่งด้านล่าง โดย TAG เต็มยังอยู่ใน
accessible name/tooltip และสรุปรายการที่เลือก การสลับทิศทางไม่ล้าง selection
และไม่เปลี่ยน `treeSequence` หรือ opaque Position ID

ผลนี้ไม่ใช่หลักฐาน topology ภาคสนาม ไม่ใช่ Physical Device/QR validation และไม่
อนุญาต Deploy, Controlled Pilot, ข้อมูลจริง หรือ Production เพิ่มเติม

## 2. ขอบเขตที่ตรวจ

- Farm name/code, Zone, Row และ Tree sequence ตาม DEC-045
- แถวเรียงซ้ายไปขวาและต้นเรียงบนลงล่างด้วย deterministic structural layout
- สลับ projection เป็นแถวแนวตั้ง/แนวนอนโดยคงลำดับและ selection เดิม
- วงกลมตำแหน่งต้นพร้อมหมายเลข `Tnnn`, สถานะ และ TAG เต็มสำหรับ accessibility
- โหมดเลือกต้นเดียว หลายต้น ทั้งแถว และทั้งโซน
- สถานะต้นแบบข้อความ/สัญลักษณ์ร่วมกับสี และปิดการเลือก Archived
- Empty position เลือกได้เฉพาะ Workflow ที่อนุญาต เช่น งานทั่วไป/ตรวจสำรวจ
- ส่งชุดตำแหน่งไป Work, Disease, Fruit Observation และ Harvest
- ตรวจ `farmId` และ Position ID ซ้ำที่หน้าปลายทาง ไม่เชื่อ navigation state โดยลำพัง
- รองรับ Tree Set ข้ามหลาย Zone ภายใน Farm เดียว พร้อม `zoneCodes`
- สลับ Farm แล้วไม่คงชุดเลือกเดิมและไม่แสดงข้อมูลจาก Farm อื่น
- มุมมอง `แปลนต้น` และ `ตารางติ๊กเลือก` ที่คง selection ขณะสลับ
- ตารางแยก section ต่อ Zone พร้อม checkbox ระดับ Zone/Row/Position ตาม selection mode
- Zone แบบ data-driven ทดสอบลำดับ Z01/Z02/Z03 โดยไม่กำหนดจำนวน Zone ตายตัว
- Action menu ครบ 5 Workflow พร้อม disabled reason และ Role/Farm/position eligibility
- Navigation intent เปิด Work category และ Fruit/Harvest form ถูกส่วน
- responsive mobile/desktop และไม่มี page-level horizontal overflow

## 3. หลักฐานการทดสอบ

ตารางเดิมต่อไปนี้เป็นหลักฐาน DEC-045/047 ณ 2026-09-01 และคงไว้ตามประวัติ:

| รายการ | ผล |
|---|---|
| ESLint | ผ่านทั้งโครงการ ไม่มี warning/error |
| TypeScript strict | ผ่านทั้งโครงการ |
| Unit/component/integration | 203/203 ผ่านใน 24 test files |
| Unit/component เฉพาะ selector | 5/5 ผ่าน รวม Z01/Z02/Z03, selection persistence และ forged intent/Farm denial |
| App flow | แปลน → ตาราง → Work ทั่วไปผ่าน; category ถูก prefill เป็น `GENERAL` |
| Firebase Emulator/security/integration | 59/59 ผ่านใน 8 test files |
| Production build + PWA | ผ่าน; 125 modules และ precache 72 entries |
| Performance budget | ผ่าน: Initial JS 332,063/350,000 bytes; Initial CSS 54,258/60,000 bytes; offline runtime 1,607,631/1,800,000 bytes |
| Offline runtime scan | ผ่าน 72 local build files |
| CSS loading | Orchard selector CSS แยกเป็น lazy route asset 7.45 kB; ไม่เพิ่ม initial CSS |
| Browser mobile | 360×800 ไม่มี page-level horizontal overflow; selector/Zone scroll อยู่ภายในกรอบ |
| Browser desktop | 1280×800 ไม่มี page-level horizontal overflow |
| Browser functional | สลับแปลน↔ตารางแล้ว T001 ยัง checked; หลังเลือกมี action link ครบ 5 รายการ |
| Browser Fruit/Harvest | เปิด hash/form ถูกส่วนและคงตำแหน่งเดิม 1 ตำแหน่งทั้งสอง Workflow |
| Browser console | ไม่พบ error |

### 3.1 หลักฐานเพิ่มสำหรับ DEC-052 — 2026-09-04

| รายการ | ผล |
|---|---|
| ESLint | ผ่านทั้งโครงการ ไม่มี warning/error |
| TypeScript strict | ผ่านทั้งโครงการ |
| Unit/component/integration ทั้งหมด | 232/232 ผ่านใน 29 test files |
| Selector/domain เฉพาะส่วน | 6/6 ผ่าน รวมสลับแนวตั้ง/แนวนอน, TAG/หมายเลข และ selection persistence |
| Production build + PWA | ผ่าน; 139 modules และ precache 92 entries |
| Visual desktop | ผ่าน: แยก Zone เป็นกรอบ, Row/วงกลมต้นอ่านได้ทั้งสองทิศทาง |
| Visual mobile | ผ่านที่ 390×844 และ 320×800; ไม่มี page-level horizontal overflow (`320 > document 305`) |
| Mobile controls | ที่ 320px ปุ่มทิศทางเรียงซ้อนและ scroll ที่จำเป็นอยู่ภายในกรอบ Zone |
| Deployment | ไม่ได้ดำเนินการในงานนี้ |

Security/domain tests ยืนยันอย่างน้อย:

- layout ปฏิเสธข้อมูลตำแหน่งที่ปะปนข้าม Farm แบบ fail closed
- navigation state ที่ Farm ไม่ตรงกันไม่ถูกนำมาใช้
- Tree Set ข้าม Zone ทำได้เฉพาะตำแหน่งใน Farm เดียวกัน
- navigation intent ที่ไม่รู้จักหรือ Farm ไม่ตรงถูกละทิ้งแบบ fail closed
- Disease, Fruit Observation และ Harvest ไม่รับ Empty position
- Row/Zone selection ใช้ Position ID จริงเป็นค่าหลัก ไม่สร้าง Tree identity ใหม่จาก label

## 4. ข้อมูลจำลองและข้อจำกัด

- ใช้ข้อมูล deterministic `SIMULATED/TEST ONLY` ที่มีอยู่ใน Mock Data Pack
- ชื่อสวน รหัส Zone/Row/Tree และสถานะที่เห็นในการทดสอบเป็นข้อมูลจำลอง
- ทิศด้านบน จุดอ้างอิง ระยะ และ topology จริงยังเป็น `TBD`
- การเลือกเป้าหมายจากแปลนไม่แทนการยืนยันต้นด้วย Farm + Zone + Row + Position + QR
- ไม่ได้ใช้พิกัดจริง รูปภาคสนาม บุคคลจริง หรือข้อมูลลูกค้าจริง

## 5. ความเสี่ยงและงานที่ยังเปิด

- ต้องยืนยันจุดอ้างอิงด้านบน จำนวน/ทิศทางแถว และลำดับตำแหน่งกับสวนจริงระหว่าง
  Controlled Pilot/Physical Device Validation ที่ได้รับอนุมัติ
- ต้องทดสอบความหนาแน่นของแปลนกับสวนที่มีจำนวนแถว/ต้นมากกว่าข้อมูลจำลอง
- ต้องเก็บหลักฐาน Android และ iPhone จริง รวมถึง QR/สัญญาณภาคสนามก่อน Operational
  Production Rollout
- QR base URL ยัง `TBD`; ห้าม encode/พิมพ์ QR หรือผลิตป้ายถาวร

## 6. สถานะ Gate

DEC-052 ผ่าน Incremental Engineering/Responsive Visual Validation สำหรับ source
ปัจจุบันแล้ว คำอนุมัติ Firebase Live Operational Go-Live ตาม DEC-051 ยังคงมีผล
ตามขอบเขตที่ระบุ แต่การตรวจครั้งนี้ **ไม่ได้ Deploy** และไม่เปลี่ยนหลักฐาน
Physical Device/Field Validation เดิมให้เป็น Passed
