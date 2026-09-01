# Owner Review Addendum — Development Mock Data and Pilot Timing

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved — Mock-first Development; Physical/Field Validation During Controlled Pilot |
| ผู้อนุมัติ | Project Owner |
| วันที่อนุมัติ | 2026-08-31 |
| Source of Truth | คำสั่งล่าสุดของ Project Owner ใน Codex task, `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `00-Project-Management/Decision-Log.md` |

## 1. คำตัดสิน

Owner อนุมัติให้การพัฒนา KDOMS ใช้ข้อมูล Mock/Synthetic ที่เตรียมอย่างเป็นระบบ
เป็นค่าเริ่มต้น และไม่ให้ Physical Device/Field Validation เป็นตัวบล็อก Phase การ
สร้างแอปหรือ Engineering Gate

การทดสอบอุปกรณ์จริง เครือข่ายจริง QR/กล้องจริง และข้อมูลภาคสนามจริงให้ดำเนินการ
หลังแอปมีความครบถ้วนเพียงพอและถูก Deploy เป็น Pilot Candidate ในสภาพแวดล้อม
Controlled Pilot ที่จำกัดสิทธิ์ จากนั้นผล Pilot ต้องถูกแก้ไขและผ่านก่อน Production
rollout, การผลิตป้ายถาวร หรือการขยายใช้งาน

## 2. ขอบเขตที่อนุมัติ

- Phase การพัฒนาใช้ versioned/resettable `SIMULATED/TEST ONLY` data
- Engineering Gate ใช้ unit/component/rules/emulator/E2E/browser/build และ
  security evidence ตามความเสี่ยง
- ค่าภาคสนามที่ยังไม่ยืนยันให้เป็น `TBD` และไม่ block implementation ที่ทำให้
  configurable หรือใช้ mock contract ได้
- Physical Device/Field evidence เก็บระหว่าง Controlled Pilot หลัง Pilot Candidate
  deployment ไม่ใช่ก่อนเริ่มสร้างฟังก์ชัน Phase 4–6
- Automated/browser simulation ยังคงไม่ใช่ Physical Device/Field evidence

## 3. Authorization boundary

คำตัดสินนี้เปลี่ยน **testing timing** เท่านั้น ไม่ได้อนุมัติให้ข้าม Gate ระหว่าง Phase
และไม่ได้อนุมัติ public/Production deployment, Firebase Production, billing,
credential, SMS/เบอร์จริง, การลงพื้นที่ หรือการใช้ข้อมูลจริงทันที

Staging/Pilot Candidate และ Controlled Pilot ต้องขออนุมัติ environment, ผู้ใช้,
ข้อมูล, privacy, retention, backup/restore, evidence, test-only QR/tag, rollback และ
stop conditions แยกก่อนเริ่ม

## 4. เอกสาร/Decision ที่ถูกแทนเฉพาะด้านเวลา

คำตัดสินนี้แทน timing เดิมของ DEC-005, DEC-018 และ DEC-024 ที่กำหนดให้ Field หรือ
Physical Device Validation เกิดก่อนล็อก Phase 3 หรือก่อน Pilot Candidate deployment
แต่ไม่ลบประวัติ ไม่เปลี่ยนผลหลักฐานเดิมจาก `Deferred / Not Passed` และไม่ลด
ข้อกำหนดที่ต้องผ่านก่อน Production/permanent tags/scale-up

## 5. Gate ปัจจุบัน

Gate 3 ยังผ่านและ Phase 4 ยังเป็น Phase เดียวที่ได้รับอนุมัติในปัจจุบัน การเริ่ม
Phase 5 ยังต้องรอ Gate 4 และ Owner approval ชัดเจนตามเดิม
