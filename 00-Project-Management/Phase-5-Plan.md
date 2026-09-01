# Phase 5 Plan — Fruit, Harvest, Sales & Inventory

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | Implemented & Validated — Ready for Gate 5 Owner Review; Phase 6 Not Authorized |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | `AGENTS.md` v2.2, Owner Addendum Gate 4, Prompt Phase 5, Development/Mock Data/Pilot Knowledge v1.0, Scope Knowledge v0.2.1, UX/UI Knowledge v0.1.1, DEC-012, DEC-013, DEC-017, DEC-027, DEC-028 |

## 1. Outcome

เชื่อมข้อมูลจำลองจาก Tree/Zone → Crop Cycle → Fruit Observation → Harvest Lot →
Sales Lot และ Inventory usage ต่อ Farm พร้อม calculation, audit, idempotency และ
least-privilege โดยไม่ขยายเป็นระบบบัญชีหรือใช้ข้อมูลจริง

## 2. In scope

- Crop Cycle และ stage transition ทีละขั้น: flowering, early fruit, mid-season,
  pre-sale และ harvested
- Fruit Observation ระบุ scope, count method, observed/dropped count, unit,
  `MEASURED`/`ESTIMATED`/`UNKNOWN`, confidence/limitation, time และ actor
- Harvest Lot เชื่อม Crop Cycle, Tree/Zone, จำนวน, น้ำหนัก และ grade
- Sales Lot แบ่งบางส่วนจาก Harvest Lot, customer reference แบบรหัสย่อ,
  ราคา/มัดจำ/รับแล้ว/ค้าง และ Correction Event
- Inventory Item/Lot, receipt/issue/adjustment, unit, expiry, reason/reference,
  negative-stock denial และ direct-cost linkage ไป Work/Care
- Low-stock/expiry alerts, traceability view และ farm-scoped audit
- Mock/Firebase Emulator repositories, Security Rules และ mobile UI

## 3. Conservative policy

- `SALES_INVENTORY`, `FARM_MANAGER`, `ORG_OWNER` จัดการ Harvest/Sales/Inventory
- `AGRONOMIST`, `FARM_MANAGER`, `ORG_OWNER` จัดการ Crop/Fruit Observation
- Sales correction, stock adjustment และ archive จำกัด `ORG_OWNER`/`FARM_MANAGER`
- `VIEWER` อ่านตาม Farm; `AUDITOR` อ่าน audit; `WORKER` ไม่เห็นข้อมูลเชิงพาณิชย์
- customer reference เป็นรหัสย่อเท่านั้น; validation ปฏิเสธอีเมล/เบอร์โทร
- Adjustment เป็น signed delta; ยอดหลังรายการห้ามติดลบ
- Cross-Farm transfer และการใช้ reference คนละ Farm ถูกปฏิเสธ

## 4. Mock Data Pack

`src/demo/phase5-mock-data-pack-v1.0.json` เวอร์ชัน `1.0.0` มี 2 isolated farms,
7 roles, measured/estimated/unknown, partial lot, correction, duplicate submit,
archived/negative-stock/cross-farm scenarios และ reset ด้วย `pnpm seed:emulator`
ข้อมูลทุกชุดเป็น `SIMULATED/TEST ONLY` ไม่มีข้อมูลสวน/ลูกค้า/บุคคลจริง

## 5. Acceptance criteria

- Fruit Observation ทุก record มี Crop Cycle + stage + unit + value quality
- Trace Tree/Zone → Crop Cycle → Harvest → Sales ได้
- Partial allocation ไม่ขายเกิน Harvest balance
- Sales calculation/rounding/outstanding และ Correction Audit ถูกต้อง
- Inventory movement มี quantity/unit/reason/reference; conversion ที่ไม่กำหนดถูก deny
- negative stock, duplicate submit, archived record และ Cross-Farm ถูกทดสอบ
- สิทธิ์ `SALES_INVENTORY` และ least-privilege roles ผ่าน Rules tests
- UI ใช้ได้ที่ 320px/390px ไม่มี horizontal overflow และ touch target ≥44px
- lint/typecheck/tests/build/PWA/offline scan ผ่าน

## 6. Stop conditions

- พบ Cross-Farm disclosure/transfer, oversold lot, negative stock, duplicate critical
  event, corrupt traceability,ข้อมูลจริง/secret ให้หยุด แก้ และ retest
- ห้าม deployment/Production/ข้อมูลจริง และห้ามเริ่ม Phase 6
- เมื่อ Phase 5 เสร็จให้เสนอ Gate 5 แล้วหยุดรอ Owner

## 7. ผลดำเนินการ

- Domain, Mock/Firebase repositories, Security Rules, UI และ Mock Data Pack เสร็จ
- Unit/component 77 tests และ Emulator/security 29 tests ผ่าน
- Build/PWA/offline และ browser 320×736/390×844 ผ่าน
- เสนอ Gate 5 เพื่อ Owner Review เท่านั้น; Phase 6 ยังไม่ได้รับอนุมัติ
