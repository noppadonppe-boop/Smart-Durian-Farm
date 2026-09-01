# Owner Review Addendum — Disease Analysis P1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | Approved — Owner Direction |
| เจ้าของเอกสาร | Project Owner |
| วันที่อนุมัติ | 2026-09-01 |
| ขอบเขต | P1 — Deterministic Mock Analysis; Local/Mock/Firebase Emulator Only |
| Source of Truth | คำสั่งล่าสุดของ Project Owner, `AGENTS.md`, Disease Analysis Future Development Workflow v0.2, DEC-026, DEC-027, DEC-031, DEC-038, DEC-039 |

## 1. คำตัดสินของ Owner

Owner อนุมัติ **P1 — Deterministic Mock Analysis** เพื่อพัฒนา:

- Analysis Session ที่ผูก `organizationId`, `farmId`, `Disease Incident`,
  `positionId` และ `plantingCycleId`
- Deterministic candidate finding พร้อม Mock Confidence/Quality/Uncertainty
- Abstain เมื่อหลักฐานจำลองคุณภาพต่ำหรือข้อสังเกตขัดแย้ง
- Agronomist Human Review แบบรับ แก้ หรือปฏิเสธ พร้อม append-oriented audit
- idempotency, wrong-tree denial, Cross-Farm denial และ Local/Emulator tests

## 2. ขอบเขตที่ไม่อนุมัติ

คำตัดสินนี้ไม่อนุมัติ:

- ภาพ บุคคล ต้นไม้ พื้นที่ หรือข้อมูลจริง
- public/private dataset จริง หรือการเก็บ Ground Truth จริง
- External AI/API/model, credential, billing หรือ external storage
- automatic diagnosis, confirmed-diagnosis writeback หรือการข้าม Agronomist
- คำแนะนำยา สารเคมี อัตราใช้ หรือ Treatment Work Order อัตโนมัติ
- Deployment, External PA-1, PA-2, Controlled Pilot, Production หรือ field work

DEC-026 เรื่อง Treatment/Chemical Policy ยังคง `Open` และเป็น authority สำหรับ
การรักษา/สารเคมีต่อไป

## 3. ข้อกำหนดการพัฒนา

1. ทุกข้อมูลและผลลัพธ์ต้องติดป้าย `SIMULATED/TEST ONLY`
2. ใช้ taxonomy กลุ่มอาการจำลองที่ไม่อ้างชื่อโรคจริงจนกว่า Owner/Agronomist
   จะอนุมัติ vocabulary
3. Confidence เป็น Mock engineering score ไม่ใช่ความแม่นยำทางวิชาการ
4. Candidate finding และ Abstain ต้องผ่าน Agronomist Human Review
5. Human Review ต้องไม่เขียน `confirmedDiagnosis` อัตโนมัติ
6. ระบบ Disease Incident ปัจจุบันต้องใช้งานต่อได้เมื่อ Analysis ไม่พร้อมหรือ Abstain
7. Cross-Farm disclosure, wrong-tree association, diagnosis writeback หรือ
   automatic chemical advice เป็น Stop condition

## 4. Acceptance Criteria ของ P1

- Deterministic scenario เดิมให้ผลเดิมและสร้างซ้ำด้วย idempotency key เดิมไม่ซ้ำ
- มี candidate scenario, low-quality Abstain และ conflicting-observation Abstain
- มีข้อมูลจำลองอย่างน้อย 2 Farm โดยไม่รั่วข้าม Farm
- เฉพาะ Agronomist รับ แก้ หรือปฏิเสธ Human Review ได้
- Wrong-tree/planting-cycle และ unauthorized role ถูกปฏิเสธ
- Audit เก็บผลสร้าง session และ Human Review โดยไม่แก้ประวัติเดิม
- Unit/UI/Firebase Emulator Rules/build และ browser validation ผ่าน
- ไม่มี image upload, camera, external request, diagnosis writeback หรือ treatment automation

## 5. Gate Position

การอนุมัตินี้เป็น engineering sub-stage แบบ Local/Mock/Emulator และไม่เปลี่ยน
สถานะหลักของโครงการ:

- Gate 6: `Passed`
- Phase 7: readiness/approval package ตาม DEC-031
- External PA-1: `Blocked` ตาม DEC-038
- PA-2, Controlled Pilot, Deployment และ Production: `Not Approved`
- Disease Analysis P2/Evaluation Proposal: `Not Approved`

## 6. Implementation evidence

P1 ดำเนินการและผ่าน Engineering Validation แบบ Local/Mock/Firebase Emulator
ตาม `06-System-Architecture/Disease-Analysis-P1-Deterministic-Mock-Architecture_v0.1.md`
และ `08-Testing/Disease-Analysis-P1-Validation-Report_v0.1.md` โดยผลนี้ไม่ขยาย
authority เดิมและไม่เปลี่ยน Gate/PA status
