# Orchard Layout & Shared Target Selector Validation Report

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.2 |
| สถานะ | Passed Full Engineering Validation — Two Views, Multi-Zone and Complete Target Actions; Local/Mock/Firebase Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-09-01 |
| Source of Truth | AGENTS.md v4.1, DEC-045/047, KDOMS Orchard Layout and Target Selection Knowledge v0.2.0, KDOMS Scope Knowledge v0.2.6, KDOMS UX/UI Knowledge v0.1.6, Phase 3 Tree Register & QR Architecture v0.3 |

## 1. สรุปผล

แปลนสวนเชิงโครงสร้างและ Shared Target Selector ผ่าน Engineering Validation
ภายใต้ข้อมูลจำลอง โดยแสดงชื่อสวน แยกโซน เรียงแถวจากซ้ายไปขวา และเรียงลำดับ
ตำแหน่งต้นจากบนลงล่าง ผู้ใช้เลือกตำแหน่งเดียว หลายตำแหน่ง ทั้งแถว หรือทั้งโซนได้
ตามบริบท และส่งชุดตำแหน่งไปยัง Work Order, Disease Incident, Fruit Observation
และ Harvest ได้โดยปลายทางตรวจ Farm scope ซ้ำเสมอ

DEC-047 เพิ่มมุมมอง `ตารางติ๊กเลือก` ควบคู่ `แปลนต้น` โดยใช้ selection เดียวกัน,
รองรับ Zone ทุกค่าจากทะเบียนแบบ data-driven และเพิ่มเมนูจากตำแหน่งที่เลือกครบ
Work ทั่วไป, Work ดูแล, Disease Incident, Fruit Observation และ Harvest Lot

ผลนี้ไม่ใช่หลักฐาน topology ภาคสนาม ไม่ใช่ Physical Device/QR validation และไม่
อนุญาต Deploy, Controlled Pilot, ข้อมูลจริง หรือ Production เพิ่มเติม

## 2. ขอบเขตที่ตรวจ

- Farm name/code, Zone, Row และ Tree sequence ตาม DEC-045
- แถวเรียงซ้ายไปขวาและต้นเรียงบนลงล่างด้วย deterministic structural layout
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

DEC-045/047 ผ่าน Engineering Validation ในขอบเขต Local/Mock/Firebase Emulator โดยไม่
เปลี่ยนสถานะ Gate หลักของโครงการ: **Gate 6 Passed; Phase 7 readiness เท่านั้น**
External PA-1 ส่วนที่ยังไม่อนุมัติ, PA-2, Controlled Pilot และ Production ยังคงต้อง
ขอ Owner approval แยกก่อนดำเนินการ
