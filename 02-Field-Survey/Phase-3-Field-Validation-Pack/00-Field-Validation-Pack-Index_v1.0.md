# Phase 3 Field Validation Pack — Index

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.2 |
| สถานะ | Gate 3 Passed by Owner Risk Acceptance — Physical Validation Deferred, Not Passed |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| ขอบเขต | Phase 3 — Tree Register & QR Field Validation |
| Source of Truth | `AGENTS.md`, `00-Project-Management/Owner-Review-Addendum_Phase-3-Field-Validation-Pack_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-3_2026-08-31.md`, `03-Tree-Data/Tree-Register-Data-Dictionary_v0.1.md`, `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md`, `08-Testing/Gate-3-Acceptance-Checklist.md` |

> **Controlled approval:** Owner อนุมัติ Pack v1.0 สำหรับต้นจริง 30 ต้นในสวน
> ทดลอง 1 แห่ง ป้ายชั่วคราว `TEST ONLY` 5 ป้าย และ Android/iPhone อย่างน้อย
> อย่างละ 1 เครื่อง แต่ยังห้ามลงพื้นที่จนกว่า Field Execution Brief จะมีข้อมูลจริงครบ
> และห้าม encode/พิมพ์ QR เพราะ QR base URL ยังเป็น `TBD`

> **Simulation update:** Owner อนุญาตให้นำค่า Mockup มากรอกและจำลอง Android/
> iPhone Technical Preflight เมื่อ 2026-08-31 ผล simulation ผ่านแบบ
> `CONDITIONAL GO — SIMULATION ONLY` แต่ไม่มีอุปกรณ์ กล้อง เครือข่าย หรือสวนจริง
> จึงยังเป็น `NO-GO` สำหรับ Physical Device Preflight และการลงพื้นที่

> **Gate 3 update:** Owner ยอมรับ residual risk และ Deferred physical evidence ไป
> Gate แยกก่อน Pre-Production/Operational Pilot/field use/Production โดยไม่อ้างว่า
> physical validation ผ่าน และอนุมัติ Phase 4 local/emulator-only

## 1. วัตถุประสงค์

รวบรวมแบบฟอร์มและ Test Script สำหรับหลักฐาน Physical Device/Field Validation
ที่ carry forward หลัง Gate 3 และห้ามใช้ simulation แทน physical evidence

## 2. รายการเอกสาร

1. `01-Printable-Field-Checklist_v1.0.md` — Checklist ก่อน/ระหว่าง/หลังลงพื้นที่
2. `02-Topology-Zone-Row-Counting-Record_v1.0.md` — แบบบันทึก topology และทิศทางนับ
3. `03-Tree-Survey-30-50_v1.0.md` — ทะเบียนชุดสำรวจและแบบหนึ่งต้นสำหรับพิมพ์ซ้ำ
4. `03A-Tree-Survey-49-Column-Blank_v1.0.csv` — CSV เปล่า 49 คอลัมน์ ไม่มี data row
5. `04-Tag-QR-Pilot-Plan-5-10_v1.0.md` — แผนเดิมรองรับ 5–10 ป้าย;
   รอบที่อนุมัตินี้ใช้ป้ายชั่วคราว 5 ป้ายเท่านั้น
6. `05-Android-iPhone-Test-Script_v1.0.md` — Online/Offline และ Scan states
7. `06-Photo-Issue-Remediation-Log_v1.0.md` — ภาพถ่าย ปัญหา การแก้ไข และ retest
8. `07-Gate-3-Field-Evidence-Summary_v1.0.md` — สรุปหลักฐานและการเสนอ Gate 3
9. `08-Field-Execution-Brief_v1.0.md` — แผนสั้นก่อนลงพื้นที่และ Hold Points

เอกสารอ้างอิงเดิมที่ยังคงใช้:

- `02-Field-Survey/Field-Survey-Template_v0.1.md`
- `03-Tree-Data/Tree-Register-Data-Dictionary_v0.1.md`
- `08-Testing/Phase-3-Validation-Report_v1.0.md`
- `08-Testing/Phase-3-Controlled-Field-Technical-Preflight_v1.0.md` — หลักฐานก่อน simulation
- `08-Testing/Phase-3-Controlled-Field-Technical-Preflight_v1.1.md` — ผล mobile viewport simulation
- `08-Testing/Gate-3-Acceptance-Checklist.md`
- `08-Testing/Physical-Device-Validation-Gate_v1.0.md`

สถานะล่าสุด: Gate 3 ผ่านด้วย Owner risk acceptance; Field Execution ยังเป็น
**NO-GO** และ physical evidence เป็น `Deferred / Not Passed`

## 3. กฎการกรอก

- ช่องที่ยังไม่มีหลักฐานให้กรอก `TBD`, `ไม่ทราบ` หรือ `ประมาณ` ตามความจริง
- ห้ามนำค่า Example เช่น `KGL-F01-Z01-R03-T017` ไปใช้เป็นรหัสจริง
- ใช้รหัสผู้สำรวจ เช่น `SURVEYOR-01` แทนชื่อ/เบอร์โทรในสำเนาที่เข้าสู่ repository
- GPS เป็นข้อมูลช่วยนำทาง ไม่ใช้ยืนยันตัวตนต้นเพียงอย่างเดียว
- ป้ายอ้าง Planting Position ถาวร; ต้นปลูกทดแทนเพิ่ม `plantingCycle`
- QR ไม่ใช่ authorization และต้องไม่บรรจุข้อมูลโรค ยา ชื่อ หรือเบอร์โทร
- ภาพจริงและแบบกรอกจริงเก็บในพื้นที่ที่ Owner อนุมัติ; repository รับเฉพาะ
  blank template หรือ sanitized summary จนกว่านโยบายข้อมูลจริงจะเปลี่ยน

### แนวทางพิมพ์จาก rendered Markdown

- A4 แนวตั้ง: Checklist, แบบหนึ่ง Planting Position, Photo/Issue Log และ Summary
- A4 แนวนอน: Cohort roster, Zone/Row table, Tag pilot manifest และ Test matrix
- พิมพ์แบบหนึ่ง Planting Position จำนวน 30 ชุดตามที่ Owner อนุมัติ
- พิมพ์ Row record, Photo manifest, Test result และ Observation table เพิ่มตามจริง
- ใส่เลขหน้า, Field Validation ID และ Pack version บนสำเนาทุกชุดก่อนแจก
- ทดสอบพิมพ์หนึ่งชุดและตรวจว่า checkbox/table ไม่ถูกตัดก่อนพิมพ์ทั้ง Pack

## 4. Pack control

| รายการควบคุม | ค่าที่ Owner อนุมัติ |
|---|---|
| Pack version ที่อนุมัติใช้ | `1.0` |
| Field Validation reference ID | `FV-SIM-001` — simulation only; actual `TBD` |
| Farm reference แบบไม่เปิดข้อมูลจริง | `FARM-PILOT-01` — simulation only; actual `TBD` |
| จำนวนต้นเป้าหมาย | `30` |
| จำนวนป้ายเป้าหมาย | `5` — temporary, `TEST ONLY` |
| Android device/browser matrix | viewport 360×800 ผ่าน simulation; physical รุ่น/OS/browser `TBD` |
| iPhone device/browser matrix | viewport 390×844 ผ่าน simulation; physical รุ่น/iOS/browser `TBD` |
| QR base URL ที่อนุมัติให้ทดสอบ | loopback ใช้ simulation เท่านั้น; physical `TBD` |
| ที่เก็บภาพ/แบบกรอกจริง | simulation report อยู่ใน `08-Testing`; physical evidence storage `TBD` |
| ผู้อนุมัติ Pack | `Project Owner` |
| วันที่อนุมัติ | `2026-08-31` |

## 5. Owner decisions required before field use

- [x] Owner อนุมัติ Pack v1.0 สำหรับ Controlled Field Validation
- [ ] กำหนด Field Validation site/farm reference และผู้รับผิดชอบ
- [ ] อนุมัติวิธีเก็บ ใช้ เข้าถึง และทำลายหลักฐานจริง/ภาพถ่าย
- [x] จำนวนต้น 30 ต้นและป้ายชั่วคราว `TEST ONLY` 5 ป้าย
- [ ] อนุมัติ QR base URL/redirect ownership ก่อนพิมพ์ QR สำหรับทดสอบ
- [x] กำหนดขั้นต่ำ Android 1 และ iPhone 1 เครื่อง
- [x] Owner อนุญาต Browser/Viewport Simulation และผล simulation ผ่าน
- [ ] ระบุรุ่น/OS/browser ของ Android และ iPhone ที่จะใช้จริง
- [ ] อนุมัติเกณฑ์ผ่านที่ระบุเป็น “ข้อเสนอ” ใน Pack
- [ ] ยืนยันผู้มีอำนาจหยุดการทดสอบเมื่อพบความเสี่ยงด้านความปลอดภัย/ข้อมูล
- [ ] ระบุผู้รับผิดชอบ วันทดสอบ สวนอ้างอิง และรายการใน Field Execution Brief

## 6. Acceptance criteria ของ Pack

- ครบทั้ง 7 หัวข้อที่ Owner ร้องขอและอ้างอิงกันด้วย Evidence ID
- แบบต้นไม้สอดคล้อง Data Dictionary 49 คอลัมน์และแยก confidence/evidence
- Test Script ครบ Android/iPhone, Online/Offline, Match/Mismatch/Unknown/Damaged
- ไม่มีข้อมูลสวนจริง บุคคลจริง production domain หรือ credential
- Gate 3 ผ่านแล้วโดย Owner; Pack ยังไม่ใช่หลักฐานว่า Physical Validation ผ่าน
