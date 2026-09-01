# Gate 5 Acceptance Checklist — Production & Commercial Traceability

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | APPROVED — Gate 5 Passed; Phase 6 Authorized |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Owner Addendum Gate 5, Phase 5 Plan v1.1, Phase 5 Architecture v0.1, Phase 5 Validation Report v1.0, AGENTS.md, DEC-012, DEC-013, DEC-017, DEC-027, DEC-028, DEC-029 |

## A. Crop/Fruit/Traceability

- [x] Crop Cycle สร้างได้และ stage เดินหน้าทีละขั้น
- [x] Fruit Observation ทุก record มี Crop Cycle, stage, method, unit, actor และเวลา
- [x] แยก `MEASURED`/`ESTIMATED`/`UNKNOWN` และบังคับ confidence/limitation
- [x] Harvest Lot อ้าง Tree/Zone, quantity/weight/grade และ Crop Cycle
- [x] Sales Lot แบ่งบางส่วนจาก Harvest ได้โดยไม่ขายเกินยอดคงเหลือ
- [x] Trace Tree/Zone → Crop Cycle → Harvest → Sales ได้

## B. Sales/Customer/Audit

- [x] ราคา มัดจำ รับแล้ว ค้าง และ status คำนวณ/ปัดเศษผ่าน tests
- [x] customer reference ใช้รหัสขั้นต่ำและปฏิเสธอีเมล/เบอร์โทร
- [x] Sales correction จำกัด Owner/Manager พร้อม reason และ audit
- [x] duplicate submit ไม่สร้าง Sales Lot/Audit ซ้ำ
- [x] archived record ไม่ hard delete และคืน Harvest availability
- [x] ไม่มี accounting, tax, payroll, banking หรือ e-commerce

## C. Inventory/Cost

- [x] Receipt/Issue/Adjustment มี quantity, unit, reason และ reference
- [x] unit mismatch/conversion ที่ไม่กำหนดถูก deny
- [x] signed adjustment จำกัด Owner/Manager
- [x] negative-stock policy = `DENY` และผ่าน Mock/Emulator tests
- [x] usage เชื่อม Work/Care reference และ direct cost เท่าที่มีข้อมูล
- [x] low-stock/expiry alerts ทำงานกับ fixture
- [x] Cross-Farm stock/financial transfer ไม่มีใน MVP

## D. Role/Multi-Farm/Security

- [x] `SALES_INVENTORY` ทำ Harvest/Sales/Receipt/Issue ตาม Farm ได้
- [x] Agronomist ทำ Crop/Fruit แต่เขียน Sales/Inventory ไม่ได้
- [x] Worker ไม่เห็น commercial data; Viewer read-only; Auditor audit read-only
- [x] Cross-Farm read/allocation/transfer ถูกปฏิเสธ
- [x] forged Farm/role ไม่เพิ่มสิทธิ์; unknown paths deny by default
- [x] important sales/stock changes มี audit/idempotency

## E. Mock-first/Privacy/Quality

- [x] Mock Data Pack v1.0.0 versioned/deterministic/resettable
- [x] UI และข้อมูลติดป้าย `SIMULATED/TEST ONLY`
- [x] 2 isolated farms, 7 roles และ boundary scenarios ครบ
- [x] ไม่มีข้อมูลสวน/ลูกค้า/บุคคลจริง, Production URL หรือ credential
- [x] lint/typecheck/unit-component 77/77 ผ่าน
- [x] Emulator/security/integration 29/29 ผ่าน
- [x] build/PWA/offline scan ผ่าน
- [x] 320×736 และ 390×844 ไม่มี overflow; target ≥44px; console = 0

## F. Deferred/Residual Risk ที่ Owner ต้องรับทราบ

- [ ] bundle 1,137.90 kB ยังมี size warning; เสนอ harden/code-split ใน Phase 6
- [ ] comprehensive offline queue/conflict/performance/security hardening อยู่ Phase 6
- [ ] Physical Device/Field/QR evidence ยัง `Deferred / Not Passed`
- [ ] QR base URL ยัง `TBD`
- [ ] DEC-026 และ Production privacy/retention/backup/account recovery ยังเปิด

รายการ Deferred ไม่ block Engineering Gate 5 ตาม DEC-027 แต่ Physical/Field evidence,
QR base URL และ Production controls ต้องปิดก่อน Production/permanent tags/scale-up

## G. Owner Decision

- [ ] `GATE 5 NOT APPROVED YET`
- [x] `APPROVE GATE 5 AND AUTHORIZE PHASE 6`
- [ ] `REVISE PHASE 5`
- [ ] `DEFER GATE 5`

ข้อความที่ Owner ต้องส่งหากอนุมัติ:

> Gate 5 ผ่าน อนุมัติเริ่ม Phase 6 ตาม Prompt Phase 6

Owner ส่งข้อความดังกล่าวแล้วเมื่อ 2026-08-31 จึงอนุมัติ Phase 6 ตาม Prompt Phase 6
แบบ Mock/local/Firebase Emulator โดยยังห้าม Phase 7 และ deployment
