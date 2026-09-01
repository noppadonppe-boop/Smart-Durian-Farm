# Prompt — Annual Farm Management Cycle v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved for Mock-first Implementation (DEC-048) |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`, `00-Project-Management/Decision-Log.md` (DEC-048) |

## Prompt สำหรับ Codex

```text
คุณกำลังแก้โครงการ Smart Durian Farm / KDOMS ใน Working Directory ปัจจุบัน

ก่อนแก้ไข:
1. อ่าน AGENTS.md
2. อ่าน .agents/skills/kdoms-development-knowledge/SKILL.md
3. อ่าน KDOMS Development, Mock Data & Pilot Knowledge v1.0
4. อ่าน KDOMS Scope Knowledge v0.2
5. อ่าน KDOMS Annual Farm Management Cycle Knowledge v0.1 ทั้งไฟล์
6. อ่าน Farm Profile, UX/UI, Report Catalogue, Decision Log และ architecture ที่เกี่ยวข้อง
7. ตรวจ git status และรักษาการเปลี่ยนแปลงที่ไม่เกี่ยวข้อง

เป้าหมาย:
เพิ่ม Annual Farm Management Cycle ระดับ Farm เพื่อให้ Owner เลือก ดู วางแผน
และปิดข้อมูลเป็นรายปีต่อเนื่อง โดยค่ามาตรฐานคือ 1 มิถุนายน–31 พฤษภาคม Owner
กำหนดวันเริ่มเฉพาะสวนได้ รอบยาว 12 เดือน วางแผน Farm/Zone เป็นหลักและ Tree Set
เฉพาะข้อยกเว้น รอบ Closed แก้ได้เฉพาะ Correction พร้อม Audit/revision

In scope:
- Domain type/validation/status/transition/permissions สำหรับ Annual Cycle
- deterministic/resettable Mock Pack อย่างน้อย 2 isolated Farms
- รอบก่อนหน้า Closed, รอบปัจจุบัน Active และรอบถัดไป Draft
- custom-start scenario, overlap denial, one-active-per-Farm, idempotency
- Annual Plan Item ระดับ FARM/ZONE/TREE_SET
- Mock repository และ Firebase Emulator repository/rules tests
- Year Switcher ที่ Farm context ชัดเจนและล้าง selection เมื่อเปลี่ยน Farm
- เมนู/หน้า Cycle list/detail/create/edit/status/close/correction
- ผูก Crop Cycle กับ Annual Cycle โดยไม่เปลี่ยนความหมาย Crop Cycle
- แสดง summary/carry-over/data quality เท่าที่ข้อมูลปัจจุบันรองรับ
- mobile 320px, accessibility, offline label และ Cross-Farm denial
- Knowledge/Architecture/Validation report/Decision Log consistency

Business invariants:
- Annual Cycle อยู่ใต้ Organization + Farm และใช้ opaque annualCycleId
- ช่วงเก็บแบบ [periodStart, periodEndExclusive) ใน Farm timezone
- default periodStart = 1 มิถุนายน; endExclusive = วันเดียวกันปีถัดไป
- ห้าม period overlap และมี ACTIVE/CLOSING รวมกันเกินหนึ่งรอบต่อ Farm
- เปลี่ยนช่วงโดยตรงได้เฉพาะ Draft/Planned ก่อนมี linked operational record
- Closed mutation ใช้ Correction เท่านั้น; original revision ต้องคงอยู่
- Persistent master data/Planting Cycle ไม่ถูกสร้างซ้ำเมื่อเปิดปีใหม่
- Carry-over ไม่ clone Work/Disease actual history
- Plan copy ไม่คัดลอก actual/evidence/diagnosis/sales result
- client payload ไม่เป็น authority ของ Organization/Farm/role/classification
- Mock/Emulator/example Farm ต้อง exampleData=true และ SIMULATED/TEST ONLY

Out of scope/ห้ามทำ:
- deploy Firebase/Hosting/Storage หรือสร้าง external resource/billing/credential
- ข้อมูลจริงนอก limited Tree Register DEC-046
- PA-2, Controlled Pilot, Field/Physical evidence, Production rollout
- automatic chemical/treatment recommendation
- accounting/tax/payroll/banking หรือ scheduled external report distribution

Acceptance criteria:
1. Owner สร้างรอบ default มิถุนายน–พฤษภาคมและ custom start ได้
2. รอบครบ 12 เดือน, ไม่ทับกัน, one active/closing per Farm
3. Role ที่ไม่มีสิทธิ์ถูก deny และ Cross-Farm payload ถูก deny
4. Year Switcher เปลี่ยนรอบใน Farm เดิมและไม่คง ID เมื่อสลับ Farm
5. Annual Plan รองรับ Farm/Zone/Tree Set พร้อม validation
6. Crop Cycle หลายรายการอ้าง Annual Cycle เดียวได้
7. Close แล้ว update ปกติถูก deny; Correction สร้าง revision/Audit
8. idempotent retry คืนผลเดิมไม่สร้าง Cycle/Correction ซ้ำ
9. deterministic Mock reset ได้และติดป้าย SIMULATED/TEST ONLY
10. lint, typecheck, unit/component, Firebase Emulator Rules, build,
    performance/offline regression ผ่านตามความเสี่ยง

เมื่อเสร็จ:
- สรุปผลและไฟล์ที่เปลี่ยนเป็นภาษาไทย
- บันทึกคำสั่งทดสอบและจำนวน test ที่ผ่าน
- แยกผล simulation ออกจาก Physical/Field evidence
- ระบุ Gate 6 Passed, External PA-1 Blocked และไม่มี deployment/real-data approval เพิ่ม
- จัด Review Packet ที่มี scope, invariants, changed files, test evidence และ git diff
  สำหรับส่งให้ ChatGPT ตรวจแบบ read-only
```

## ขอบเขตการตรวจของ ChatGPT

ให้ตรวจแบบ read-only โดยเน้น:

- Annual Cycle ไม่ถูกปะปนกับ Crop Cycle/Planting Cycle
- วันที่ครบ 12 เดือนและกรณี leap day
- period overlap, one-active-per-Farm และ status transition
- closed-cycle Correction-only/revision/audit/idempotency
- Cross-Farm/role/forged payload และ exampleData boundary
- carry-over ไม่ทำลายหรือ clone actual history
- UI Farm + Year context, mobile/accessibility/offline
- Knowledge/Decision/Architecture/Code/Test consistency

ห้าม Reviewer deploy, แก้ external resource หรืออ้าง Mock เป็นข้อมูลจริง
