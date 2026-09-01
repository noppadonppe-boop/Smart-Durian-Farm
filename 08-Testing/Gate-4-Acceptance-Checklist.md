# Gate 4 Acceptance Checklist — Work, Care & Disease

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.2 |
| สถานะ | APPROVED — Gate 4 Passed; Phase 5 Authorized |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Phase 4 Plan v1.3, Phase 4 Validation Report v1.0, Phase 4 Work Photo Enhancement Validation v1.0, Owner Addendum Gate 4, AGENTS.md v2.4, DEC-026, DEC-027, DEC-028, DEC-030 |

## A. Scope และ Domain

- [x] Work states และ allowed/forbidden transitions มี validation/tests
- [x] Tree, Tree Set, Row และ Zone target ใช้ opaque Position snapshot
- [x] Tree target ต้อง Match ก่อน report/submit และ mismatch หยุด action
- [x] Group completion ครบทุก target; exception บังคับเหตุผล
- [x] Care Event ครบประเภท fertilizer/chemical/water/pruning/inspection
- [x] Observed symptom แยกจาก suspected/confirmed diagnosis และ treatment
- [x] Chemical/treatment คง `PENDING_SPECIALIST` จน Agronomist อนุมัติ

## B. Role, Multi-Farm และ Audit

- [x] ORG_OWNER/FARM_MANAGER/AGRONOMIST/WORKER actions ถูกจำกัดตาม role
- [x] VIEWER/AUDITOR/SALES_INVENTORY ไม่มี Phase 4 write
- [x] Cross-Farm read/write/evidence ถูกปฏิเสธ
- [x] wrong-assignee และ wrong-tree ถูกปฏิเสธ
- [x] status/approval/disease changes มี append-only event
- [x] duplicate idempotency key ไม่สร้าง critical event/report ซ้ำ
- [x] delete และ identity-field mutation ถูก deny

## C. Mock-first และ Privacy

- [x] Mock Data Pack เดิม version `1.0.0`; post-gate photo enhancement version `1.1.0`
- [x] deterministic และ resettable
- [x] แสดง `SIMULATED/TEST ONLY` ในข้อมูลและ UI
- [x] ครอบคลุม 7 canonical roles และอย่างน้อย 2 isolated farms
- [x] ไม่มีข้อมูลสวน/บุคคล/พิกัด/หมายเลขจริง หรือ credential
- [x] Firebase Production, billing, public deployment และ SMS จริงไม่ถูกใช้

## D. Quality Evidence

- [x] lint และ TypeScript strict ผ่าน
- [x] unit/component 61/61 ผ่าน
- [x] Firebase Emulator/security/integration 24/24 ผ่าน
- [x] build, PWA และ offline runtime scan ผ่าน
- [x] 320×736 ไม่มี horizontal overflow
- [x] touch targets ≥44 px และ console warning/error = 0
- [x] Mock Data Pack reset command ผ่าน

## E. Deferred / Residual Risk ที่ Owner ต้องรับทราบ

- [ ] DEC-026 final chemical/treatment approval policy ยัง Open
- [ ] bundle 1,054.72 kB ยังมี size warning
- [ ] Physical Device/Field/QR evidence ยัง Deferred / Not Passed
- [ ] QR base URL ยัง `TBD`
- [ ] account recovery ก่อน Production ยังต้องออกแบบ

รายการ Deferred ข้างต้นไม่ block Engineering Gate 4 ตาม DEC-027 แต่ Physical/Field
evidence, QR base URL และ Production controls ต้องปิดก่อน Production, ป้ายถาวร หรือ
การขยายใช้งาน

## F. Owner Decision

- [ ] `GATE 4 NOT APPROVED YET`
- [x] `APPROVE GATE 4 AND AUTHORIZE PHASE 5`
- [ ] `REVISE PHASE 4`
- [ ] `DEFER GATE 4`

ข้อความที่ Owner ต้องส่งหากอนุมัติ:

> Gate 4 ผ่าน อนุมัติเริ่ม Phase 5 ตาม Prompt Phase 5

Owner ส่งข้อความดังกล่าวเมื่อ 2026-08-31 ตาม
`00-Project-Management/Owner-Review-Addendum_Gate-4_2026-08-31.md` จึงอนุมัติ
Gate 4 และเริ่ม Phase 5 แล้ว รายการ Deferred ยังคง carry forward และไม่ได้ถือว่า
Physical/Field evidence ผ่าน

## G. Post-Gate Work Photo Enhancement (DEC-030)

- [x] ผู้สร้าง Work Order แนบรูปประกอบได้ 0–3 รูปเฉพาะขณะ Draft ก่อน Assign
- [x] Worker เปิดดูรูปประกอบของงานที่ตนได้รับมอบหมายได้ แต่เขียนทับไม่ได้
- [x] Worker Report ต้องมี BEFORE และ AFTER ที่อัปโหลดสำเร็จก่อน Submit
- [x] Owner/Manager เปิดดูรูปส่งงานก่อน Verify/Reject/Rework ได้
- [x] Firestore Rules ตรวจรูปคำสั่งงานและรูปบังคับ BEFORE/AFTER;
  Storage Rules ตรวจ role, Farm/Work path, phase, MIME และขนาดไฟล์
- [x] Cross-Farm, wrong role, overwrite และไฟล์ Pending/Failed ถูกปฏิเสธ
- [x] ใช้ mock placeholder เท่านั้น; Physical camera/device evidence ยัง Deferred

รายการนี้เป็นการเสริม requirement หลัง Gate 4 ผ่าน ไม่เปิด Production, ไม่ใช้
ข้อมูลจริง และไม่เปลี่ยนผล Owner decision ของ Gate อื่น
