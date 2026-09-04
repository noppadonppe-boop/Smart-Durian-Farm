# Owner Review Decision — Firebase Live Operational Go-Live

| รายการ | ค่า |
|---|---|
| Decision ID | DEC-051 |
| สถานะ | Approved |
| วันที่ | 2026-09-04 |
| ผู้อนุมัติ | Project Owner |
| Firebase project | `durian-smartfarm` |

## คำสั่งเจ้าของโครงการ

เจ้าของโครงการสั่งให้ Web App ใช้ Firebase Live สำหรับการใช้งานจริง ยกเลิก
runtime/คำสั่ง/โมดูลที่เชื่อม local Firebase test services เพิ่มปุ่ม
**เข้าสู่ระบบโดยผู้ดูแล (Firebase Live)** และให้ผู้ดูแลสามารถสร้างข้อมูลในโมดูล
ปัจจุบันทั้งหมดบน Firebase จริง พร้อมปุ่ม Seed ที่มองเห็นได้ในระบบ

คำสั่งนี้มีอำนาจสูงกว่า production/deployment prohibition เดิมตามลำดับอำนาจใน
`AGENTS.md`

## สิ่งที่อนุมัติ

- Browser runtime ใช้ Firebase Authentication, Firestore และ Storage ของ project
  `durian-smartfarm` เท่านั้น; Mock adapter ใช้ได้เฉพาะ unit/component test
- Deploy Firestore Rules/Indexes และ Firebase Hosting ของรุ่น Firebase Live
- ใช้ Google Sign-In หรือ Phone Auth จริง และเพิ่มทางเข้า Admin ที่ hosted build
- ให้ trusted System Admin สร้าง Operational Organization/Farm และบันทึกข้อมูลจริง
  ของโมดูลที่มีอยู่ ได้แก่ Farm, Tree, Work, Care, Disease, Crop/Fruit/Harvest/Sales,
  Inventory, Annual Cycle, Management Reporting/Cost, Dashboard/Queue/Audit/Export
  และ Disease Analysis Session
- ให้มีปุ่ม Operational bootstrap ซึ่งไม่แต่งข้อมูลต้น/งาน/โรค/ผลผลิต/การเงิน
- ให้ Seed deterministic Mock pack ลง Firebase Live เพื่อทดสอบได้ โดยต้องแยก DEMO
  Farm และคง `SIMULATED/TEST ONLY` / `exampleData=true`
- ยกเลิก source/runtime/scripts/tests ที่เรียก local Firebase test services

## ขอบเขตความปลอดภัยที่ยังบังคับ

- ทุก mutation ต้องอยู่ใน trusted Organization/Farm membership และ Cross-Farm
  access ต้องถูกปฏิเสธ
- System Admin เชื่อถือจาก immutable root owner UID หรือ Firebase custom claim
  `masterAdmin=true` เท่านั้น ห้ามเชื่อ Role string จาก client
- ข้อมูลการเงินยังเป็น Owner-only ตาม DEC-050
- Disease Analysis เป็น candidate finding ที่ต้องมี Agronomist Human Review
  ห้ามเขียน confirmed diagnosis หรือสร้าง Treatment/Chemical advice อัตโนมัติ
- ห้ามแต่ง topology, พันธุ์, ปีปลูก, จำนวน, บุคคล, ลูกค้า หรือข้อมูลการเงินเป็น
  ข้อเท็จจริง หากไม่ทราบให้เว้นว่างหรือใช้ `TBD`
- ประวัติ Physical Device/Field Validation ที่ยัง Deferred ไม่ถูกเปลี่ยนเป็น Passed
  จากคำสั่ง Go-Live นี้
- Storage writes เปิดได้เมื่อ bucket provision และ Rules deploy สำเร็จเท่านั้น

## ผลต่อคำตัดสินเดิม

DEC-051 supersede เฉพาะข้อห้าม runtime/deployment/operational Production ใน
DEC-038, DEC-041–DEC-050 สำหรับขอบเขต Web App ปัจจุบัน แต่ไม่ลบหลักฐานย้อนหลัง
ไม่ยกเลิก Multi-Farm/Audit/Owner-only Financial/Human Review และไม่อนุมัติ
automatic chemical advice, permanent QR tag production หรือการอ้าง simulation
เป็น physical evidence
