# Phase 6 Plan — Dashboard, Offline, Audit & Security Hardening

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | Completed & Engineering Validated — Ready for Gate 6 Owner Review |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | Owner Addendum Gate 5, Prompt Phase 6, `AGENTS.md`, Development/Mock Data/Pilot Knowledge v1.0, Scope Knowledge v0.2.1, UX/UI Knowledge v0.1.1, DEC-011, DEC-017, DEC-019, DEC-027, DEC-029 |

## 1. Outcome

ทำให้ MVP แบบ Mock/local/Firebase Emulator แสดงภาพรวมตามสิทธิ์ จัดการงานค้างส่ง
และ Conflict โดยไม่ทำข้อมูลซ้ำหรือเปลี่ยน Farm scope มี Audit/Export ที่ตรวจสอบได้
และผ่าน security/performance/accessibility checks ที่กำหนดก่อนเสนอ Gate 6

## 2. In scope

- Farm Dashboard: สุขภาพต้น โรคเร่งด่วน งานเกิน/ใกล้กำหนด จำนวนผล Harvest
  Inventory warning และ Sales summary ตามบทบาท
- Portfolio Dashboard เฉพาะ `ORG_OWNER` และรวมเฉพาะ Farm access ที่ได้รับสิทธิ์
- Offline operation queue: `PENDING`, `SYNCING`, `SYNCED`, `CONFLICT`
- idempotency, reconnect retry, duplicate denial และคง Organization/Farm scope เดิม
- ตรวจ revoked/downgraded role ก่อน replay และเปลี่ยนเป็น Conflict โดยไม่เขียนข้อมูล
- Master-data conflict review โดย `FARM_MANAGER`/`ORG_OWNER` พร้อม reason,
  before/after และ correction audit
- Photo recovery: failed/partial retry และ orphan cleanup แบบมี policy/audit
- Farm-scoped minimal export สำหรับ Owner/Manager/Auditor พร้อม audit event
- Firestore/Storage Rules, performance budget, route/code splitting, accessibility,
  320px, slow-network simulation และ light/dark mode
- Backup/export/restore draft procedure และ monitoring/incident plan

## 3. Out of scope

- Production resources, deployment, billing, domain, credential, real SMS/phone
- ข้อมูลจริงหรือ Field/Physical Device/QR evidence
- Cross-Farm transfer, public export link และ AI prediction
- Phase 7 หรือ Controlled Pilot execution

## 4. Mock Data Pack

สร้าง Phase 6 Pack เวอร์ชัน `1.0.0` แบบ deterministic/resettable และติดป้าย
`SIMULATED/TEST ONLY` ครอบคลุม authorized/hidden Farm dashboards, role-adapted
metrics, pending/retry/duplicate/conflict, revoked role, partial photo/orphan,
correction audit และ export scenarios โดยไม่ใช้ข้อมูลจริง

## 5. Acceptance criteria

- offline replay ด้วย idempotency key เดิมไม่สร้าง event ซ้ำ
- pending operation คง `organizationId`/`farmId` เดิมเมื่อสลับสวน
- Conflict ไม่ถูก overwrite เงียบและมีผู้ตัดสิน เหตุผล before/after และ audit
- Portfolio ไม่รวม Farm ที่ไม่มี membership และใช้ได้เฉพาะ Organization Owner
- Audit ตอบ actor/action/time/farm/target/reason และการ Export มี Audit
- revoked/downgraded role ถูกปฏิเสธเมื่อ reconnect
- Photo partial failure retry ได้; orphan cleanup จำกัดสิทธิ์และมี Audit
- Security suite, offline E2E, accessibility, performance budget และ build ผ่าน
- ไม่มี high-severity finding ที่ไม่แก้หรือไม่บันทึก exception

## 6. Stop conditions

- พบ Cross-Farm disclosure, duplicate critical event, silent conflict overwrite,
  corrupt history, secret หรือข้อมูลจริง ให้หยุดส่วนที่เกี่ยวข้อง แก้ และ retest
- หากต้องสร้าง Production resource, billing, domain หรือ deploy ให้หยุดและขออนุมัติ
- เมื่อ Phase 6 เสร็จให้เสนอ Gate 6 พร้อม residual risks แล้วหยุดรอ Owner
- ห้ามเริ่ม Phase 7

## 7. ผลดำเนินการ

- สร้าง Farm/Portfolio Dashboard ตามสิทธิ์, Offline queue, Conflict review,
  Photo recovery, Operational Audit และ Farm-scoped Export ครบ
- เพิ่ม Phase 6 Mock Data Pack v1.0.0 แบบ deterministic/resettable
- เพิ่ม Firestore/Storage Rules และ Emulator tests สำหรับ Cross-Farm, revoked/
  downgraded role, duplicate replay, correction, export และ upload/delete policy
- แยก route และ Firebase adapter ออกจาก initial bundle พร้อม automated budget
- จัดทำ architecture, backup/export/restore draft และ monitoring/incident draft
- ผ่าน unit/component 100/100 และ Emulator/security/integration 40/40
- Browser ผ่าน 320px และ 390×844, Light/Dark, latency simulation, touch target
  44px, ไม่มี horizontal overflow และ console warning/error = 0
- Phase 6 พร้อมเสนอ Owner Gate 6 แต่ยังไม่อนุมัติ Phase 7
