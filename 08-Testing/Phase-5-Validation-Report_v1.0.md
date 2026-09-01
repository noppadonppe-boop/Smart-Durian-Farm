# Phase 5 Validation Report — Fruit, Harvest, Sales & Inventory

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Passed Engineering Validation — Ready for Gate 5 Owner Review |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-08-31 |
| Source of Truth | `AGENTS.md` v2.2, Owner Addendum Gate 4, Phase 5 Plan v1.1, Prompt Phase 5, DEC-012, DEC-013, DEC-017, DEC-027, DEC-028 |

## 1. สรุปผล

Phase 5 implementation ผ่านเกณฑ์ทางวิศวกรรมสำหรับ local/Mock/Firebase Emulator
และพร้อมเสนอ Gate 5 ให้ Owner ตัดสินใจ ระบบเชื่อม Tree/Zone → Crop Cycle →
Harvest Lot → Sales Lot ได้ และเชื่อม Inventory usage กับ Work/Care reference
โดยไม่ขยายเป็นบัญชีหรือใช้ข้อมูลจริง

Physical Device/Field/QR evidence ยัง Deferred ตาม DEC-027 ไม่ถูกอ้างว่า Passed
และไม่ใช้ block Engineering Gate แต่ต้องผ่านก่อน Production/permanent tags/scale-up

## 2. ขอบเขตที่ตรวจ

- Crop Cycle create และ stage transition ทีละขั้น
- Fruit Observation พร้อม method, observed/dropped count, unit, actor, time,
  confidence note และ measured/estimated/unknown
- Harvest Lot source trees/zones, quantity, weight, grade และ partial availability
- Sales Lot customer reference ขั้นต่ำ, price/deposit/received/outstanding/status
- Trace Tree/Zone → Crop Cycle → Harvest → Sales
- Sales correction, archive, idempotency และ append-oriented audit
- Inventory receipt/issue/signed adjustment, lot/unit/expiry, reason/reference
- negative stock denial, low-stock/expiry alert และ direct cost summary
- least-privilege roles, `SALES_INVENTORY`, Worker denial และ Cross-Farm denial
- responsive mobile forms, build/PWA และ offline-critical runtime

## 3. หลักฐานการทดสอบ

| รายการ | ผล |
|---|---|
| ESLint | ผ่าน ไม่มี warning/error |
| TypeScript strict | ผ่าน |
| Unit/component | 77/77 ผ่านใน 10 test files |
| Firebase Emulator/security/integration | 29/29 ผ่านใน 6 test files |
| Production build + PWA | ผ่าน; precache 8 entries, 1,148.07 KiB |
| Offline runtime scan | ผ่าน 7 local build files |
| Browser Production 320×736 | ไม่มี horizontal overflow; 59 interactive controls ไม่มี target ต่ำกว่า 44px |
| Browser Inventory 390×844 | ไม่มี horizontal overflow; ไม่มี target ต่ำกว่า 44px |
| Browser functional | บันทึก Fruit Observation 125 fruit และ issue 1 kg ได้; balance 34 kg |
| Browser console | warning/error = 0 |

Security/domain tests ยืนยันอย่างน้อย:

- `SALES_INVENTORY` สร้าง partial Sales Lot ได้และ duplicate key คืน record เดิม
- Cross-Farm Harvest allocation/read ถูกปฏิเสธ และไม่เปิดเผยล็อตอีกสวน
- Worker อ่านข้อมูลเชิงพาณิชย์ไม่ได้; Viewer อ่านอย่างเดียว
- Agronomist บันทึก Fruit Observation ได้แต่ `SALES_INVENTORY` เขียนไม่ได้
- Issue ที่ทำให้ negative stock ถูกปฏิเสธ
- Stock adjustment/Sales correction จำกัด Owner/Manager และสร้าง audit
- customer reference ที่มีรูปแบบอีเมล/เบอร์โทรถูกปฏิเสธ
- measured/estimated/unknown, rounding, unit mismatch และ traceability ผ่าน
- archive คืน Harvest availability และไม่ลบประวัติ Sales Lot

## 4. Mock Data Pack

ไฟล์ `07-Source-Code/web-app/src/demo/phase5-mock-data-pack-v1.0.json`:

- version `1.0.0`, classification `SIMULATED/TEST ONLY`
- deterministic fixed clock และ resettable ผ่าน runtime/`pnpm seed:emulator`
- 2 isolated farms และ 7 canonical roles
- Crop Cycle 2, Fruit Observation 4, Harvest Lot 2, Sales Lot 1,
  Inventory Item 3 และ Movement 4
- ครอบคลุม measured/estimated/unknown, partial lot, correction, duplicate,
  archived, negative-stock และ Cross-Farm scenarios
- negative stock policy = `DENY`; customer policy = `REFERENCE_CODE_ONLY`
- ไม่มีชื่อ/เบอร์/อีเมลลูกค้าจริง, ข้อมูลสวนจริง, coordinate, URL Production หรือ credential

## 5. ไฟล์สำคัญที่สร้างหรือแก้

- `src/domain/commercialTraceability.ts` และ tests
- `src/adapters/mock/mockCommercialTraceabilityRepository.ts` และ tests
- `src/infrastructure/firebase/firebaseCommercialTraceabilityRepository.ts`
- `src/demo/phase5-mock-data-pack-v1.0.json`
- `src/pages/ProductionPage.tsx`, `src/pages/InventoryPage.tsx` และ responsive CSS
- `firestore.rules`, Emulator security tests และ seed/reset script
- Phase 5 Plan, Architecture, Validation Report และ Gate 5 checklist

## 6. ความเสี่ยงคงค้าง

- bundle หลัก 1,137.90 kB มี warning เกิน 500 kB และเพิ่มจาก Phase 4; ควร
  code-split/harden ใน Phase 6 หาก Owner อนุมัติ
- Phase 5 UI มี Mock/local offline state และ idempotency แต่ comprehensive queue,
  conflict UX, performance และ security hardening อยู่ Phase 6
- Physical Device/Field/QR evidence ยัง `Deferred / Not Passed`
- QR base URL ยัง `TBD`; ห้าม encode/พิมพ์ QR หรือผลิตป้ายถาวร
- DEC-026 ยัง Open และ account recovery/privacy/retention/backup ต้องปิดก่อน Production
- ไม่มี deployment authorization และไม่มี Firebase Production

## 7. ข้อเสนอ Gate

**Recommendation: PASS ENGINEERING VALIDATION → READY FOR OWNER GATE 5 DECISION**

สถานะนี้ไม่ใช่การอนุมัติ Gate 5 โดยอัตโนมัติ Owner ต้องตอบ
`Gate 5 ผ่าน อนุมัติเริ่ม Phase 6 ตาม Prompt Phase 6` อย่างชัดเจนก่อนเริ่ม Phase 6
