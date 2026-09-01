# Phase 4 Plan — Work Orders, Tree Care & Disease

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.3 |
| สถานะ | Gate 4 Passed — Post-Gate Work Photo Enhancement Implemented; Local/Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | `AGENTS.md` v2.4, KDOMS Development/Mock Data/Pilot Knowledge v1.0.1, Owner Review Addendum — Development Mock Data and Pilot Timing, Owner Review Addendum — Gate 3, Prompt Phase 4, Scope Knowledge v0.2.2, UX/UI Knowledge v0.1.2, DEC-026, DEC-027, DEC-030 |

## 1. Outcome

สร้าง workflow จำลอง/Emulator สำหรับสั่งงาน รับงาน ยืนยันต้น รายงานหลักฐาน
ตรวจรับ Care Event และ Disease Incident โดยคง Multi-Farm, role, audit,
idempotency และ offline boundaries เดิม Physical/Field evidence ไม่ block Phase 4
และจะเก็บระหว่าง Controlled Pilot หลังมี Pilot Candidate ที่ได้รับอนุมัติ

## 2. In scope

- Work states: Draft, Assigned, Accepted, In progress, Submitted, Verified,
  Rejected, Rework และ Closed
- target แบบ Tree, Row, Zone และ Tree Set
- Worker My Work: accept/start/pause/resume/report/submit
- QR/manual confirmation สำหรับ Tree target; mismatch ห้าม complete
- group completion พร้อม success/exception รายต้น
- before/after photo evidence ตาม mock/Local Emulator Storage policy
- รูปประกอบ Work Order จากผู้สร้าง 0–3 รูป แนบได้ขณะ Draft ก่อน Assign และแยก
  purpose จากรูปหลักฐานก่อน–หลังของ Worker
- actual material, quantity, unit, notes และ partial-photo failure guard
- Manager verification/reject/rework reason และ append-only audit
- Care Event: fertilizer, chemical, water, pruning, inspection
- Disease: observed symptom, severity, suspected/confirmed diagnosis,
  treatment, follow-up และ outcome
- in-app urgent/follow-up queue
- ขยาย Mock Data Pack แบบ versioned/deterministic/resettable ให้ครอบคลุม Phase 4

## 3. Out of scope

- AI diagnosis และคำแนะนำสารเคมี
- Production notification provider, Firebase Production, SMS จริง และ deployment
- Fruit/harvest/sales/inventory, field work, physical device validation และป้ายถาวร
- Phase 5

## 4. File/system plan

| Area | Planned files |
|---|---|
| Domain | `src/domain/workCareDisease.ts` + state/validation tests |
| Contracts | `src/adapters/contracts.ts` เพิ่ม Phase 4 repository port |
| Mock | `src/adapters/mock/mockWorkCareDiseaseRepository.ts` + demo seed/tests |
| Firebase | `src/infrastructure/firebase/firebaseWorkCareDiseaseRepository.ts` |
| Context | ขยาย `Phase2Context.tsx` โดยไม่เปลี่ยน auth/farm boundary เดิม |
| UI | Work list/detail/create, Care/Disease/Notification pages และ Scan handoff |
| Rules | `firestore.rules`, `storage.rules`, emulator role/cross-farm tests |
| Seed | ขยาย local emulator seed ด้วย example-data records เท่านั้น |
| Docs/tests | Phase 4 architecture, validation report และ Gate 4 checklist |

## 5. Acceptance criteria

- allowed/forbidden state transitions มี unit tests ครบ
- Worker ทำ single-tree flow ตั้งแต่ Assigned ถึง Submitted ได้
- Tree target ต้อง Match ก่อน submit; mismatch/wrong Farm ถูกปฏิเสธ
- group report ครบทุก target และ exception มีเหตุผล
- photo upload state ที่ Failed/Pending ห้าม submit
- ผู้ไม่มีสิทธิ์/คนละ Farm/Worker ห้ามแนบหรือเขียนทับรูปประกอบใบงาน และ Manager
  ต้องเปิดดูรูปส่งงานก่อนตรวจรับได้
- Rejected/Rework บังคับเหตุผลและมี audit event
- duplicate action/report key ไม่สร้าง event/report ซ้ำ
- ORG_OWNER/FARM_MANAGER/AGRONOMIST/WORKER และ Cross-Farm Rules ผ่าน Emulator
- chemical/treatment คง conservative pending-specialist boundary
- mobile 320px, lint, typecheck, tests, build และ offline scan ผ่าน
- fixture ทั้งหมดติดป้าย `SIMULATED/TEST ONLY`, reset ได้ และไม่มีข้อมูลจริง

## 6. Stop conditions

- พบ Cross-Farm leak, wrong-tree completion, duplicate critical event หรือ corrupt
  history ให้หยุด แก้ และ retest
- ห้ามใช้ข้อมูลจริง/Production resource; การปรับรูปภาพนี้ไม่ใช่การอนุมัติ
  Production หรือ Phase ถัดไป

## 7. ผลดำเนินการ

- Implementation, Rules, Mock Data Pack และ UI ตาม In scope เสร็จแล้ว
- ไฟล์ Mock Data Pack v1.0 ใช้ schema/data version `1.1.0`, เป็น deterministic,
  resettable และติดป้าย `SIMULATED/TEST ONLY`
- เพิ่ม Work Order instruction photo, secure preview และแสดง Worker before/after
  evidence โดยไม่เปลี่ยน Gate หรือขอบเขต Production
- หลักฐานการทดสอบเดิมของ Gate 4 อยู่ใน Phase 4 Validation Report v1.0;
  ผลทดสอบส่วนเพิ่มรูปภาพอยู่ใน Phase 4 Work Photo Enhancement Validation v1.0
- Physical Device/Field evidence ยังคง Deferred ตาม DEC-027 และไม่ถูกใช้ block
  Gate 4 ทางวิศวกรรม
- Gate 4 ผ่านแล้วตาม DEC-028; การปรับนี้ไม่เปลี่ยนสถานะ Gate 5/Phase 6
