# Gate 3 Acceptance Checklist

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.3 |
| สถานะ | PASSED — Owner Risk Acceptance; Physical Device/Field Evidence Deferred, Not Passed |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `00-Project-Management/Owner-Review-Addendum_Development-Mock-Data-and-Pilot-Timing_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-2_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Phase-3-Field-Validation-Pack_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Gate-3_2026-08-31.md`, `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md`, `08-Testing/Phase-3-Validation-Report_v1.0.md`, `08-Testing/Phase-3-Controlled-Field-Technical-Preflight_v1.1.md`, `08-Testing/Physical-Device-Validation-Gate_v1.0.md` |

## 1. Implementation checklist

- [x] Zone/Row/Planting Position/Planting Cycle domain model
- [x] Tag parser/generator ตามรูปแบบที่อนุมัติ
- [x] opaque `positionId` unique และ configurable QR route
- [x] Tree list/search/filter, detail, cycle history และ timeline
- [x] role-based create/edit/archive และ Tag damaged report
- [x] ปลูกทดแทนเพิ่ม cycle โดยคง Position/Tag เดิม
- [x] CSV exact 49 columns, preview, cross-field validation และ reject report
- [x] duplicate-in-file/existing Tag denial และ atomic no-partial import
- [x] idempotent import retry คืน opaque IDs เดิม
- [x] QR/manual flow: match, mismatch, unknown, denied, damaged, offline cached
- [x] Firestore Rules deny-by-default และ cross-farm isolation
- [x] ข้อมูล/หมายเลข/Farm/Tree ทั้งหมดเป็นข้อมูลจำลอง
- [x] ไม่มี Production Firebase, billing, deployment, credentials หรือป้ายจริง

## 2. Automated and Browser validation

- [x] Tag parse/generate และ QR base-route edge cases
- [x] CSV valid/EXAMPLE/invalid/duplicate/wrong-farm/retry tests
- [x] Planting Cycle replacement/no-reuse/archive tests
- [x] same-farm Tree read และ cross-farm QR denial
- [x] Worker Tree master write denial และ forged Tag update denial
- [x] Firestore atomic create/update/replace/archive/import tests
- [x] unit/component/network-denied tests 35 รายการผ่าน
- [x] Auth/Firestore/Storage/Repository Emulator tests 19 รายการผ่าน
- [x] lint, TypeScript strict, build และ offline runtime scan ผ่าน
- [x] Browser 320×736 และ 1280×800 ไม่มี horizontal overflow
- [x] Browser Match/Mismatch/Cross-Farm/Offline/CSV retry ผ่าน
- [x] Browser console warning/error = 0 และ visible touch target audit ผ่าน
- [x] Owner-input Mockup ถูกกรอกเป็น `SIMULATED/TEST ONLY` โดยไม่อ้างเป็นข้อมูลจริง
- [x] Android viewport 360×800: Sign-in/Tree/Mismatch/Cross-Farm denial ผ่าน
- [x] iPhone viewport 390×844: Correct/Unknown/manual fallback ผ่าน
- [x] mobile viewport simulation ไม่มี horizontal overflow; touch target ≥44 px
- [x] simulated preflight ไม่ขอ camera permission และไม่ encode/พิมพ์ QR

## 3. Physical/Field evidence disposition

- [x] Owner อนุมัติ Field Validation Pack v1.0 สำหรับ Controlled Field Validation
- [x] Local Technical Preflight ผ่าน: lint/typecheck/35 tests/build/offline scan/
  19 emulator tests/emulator health
- [x] Browser/Viewport Mobile Simulation ผ่านแบบ `CONDITIONAL GO — SIMULATION ONLY`
- [ ] **DEFERRED / NOT PASSED:** Field Execution Brief จริงและ Owner GO ก่อนลงพื้นที่
- [ ] **DEFERRED / NOT PASSED:** Android และ iPhone Physical Preflight
- [ ] **DEFERRED / NOT PASSED:** topology, Zone/Row และทิศทางนับจากพื้นที่จริง
- [ ] **DEFERRED / NOT PASSED:** Tree Survey จริง 30 ต้น
- [ ] **DEFERRED / NOT PASSED:** ป้าย `TEST ONLY` 5 ป้ายในสภาพจริง
- [ ] **DEFERRED / NOT PASSED:** กล้อง/QR/LAN/Hotspot/Online/Offline บนอุปกรณ์จริง
- [ ] **DEFERRED / NOT PASSED:** Cross-Farm denial บนอุปกรณ์จริงทุกกรณี
- [ ] **DEFERRED / NOT PASSED:** Human Tag/ค้นหาต้น/wrong-scan จาก field evidence
- [ ] **DEFERRED / NOT PASSED:** topology/tag configuration และ Production QR domain

Owner ยอมรับ residual risk และย้ายรายการนี้ไป
`Physical-Device-Validation-Gate_v1.0.md` เพื่อเก็บระหว่าง Controlled Pilot หลัง
Deploy Pilot Candidate ที่ได้รับอนุมัติ และต้องผ่านก่อน Production, permanent tag
หรือ scale-up การไม่ติ๊กหมายถึง “ยังไม่ผ่าน” ไม่ใช่ defect ของ Gate 3 record

## 4. Owner review items ที่ carry forward

Owner ตอบ `Approve`, `Revise` หรือ `Defer` ทีละข้อ:

1. Organization Code/Farm Sequence/Zone/Row และทิศทางนับจริง
2. Tree status/confidence vocabularies หลังผู้สำรวจทดลองใช้
3. การจำกัด master-data write ที่ `ORG_OWNER`/`FARM_MANAGER`
4. ความเหมาะสมของ Manual fallback และข้อความ Match/Mismatch
5. ขนาด Import 50 records ต่อ atomic batch
6. Production QR domain และ redirect ownership
7. รายการแก้ไขจาก Controlled Pilot ก่อนล็อก Production topology/tag configuration

## 5. Gate decision

- [ ] **Gate 3 BLOCKED**
- [x] **Gate 3 APPROVED — Owner risk acceptance and deferral**

คำตัดสินปัจจุบัน: **Gate 3 Passed — Phase 4 Authorized for mock/Firebase Emulator
only. Physical Device/Field Validation remains Deferred and Not Passed.**

Owner อนุมัติด้วยข้อความ:

```text
Gate 3 ผ่าน อนุมัติเริ่ม Phase 4 ตาม Prompt Phase 4
```

การอนุมัติ Gate 3 ไม่อนุมัติ Production resource, public deployment, SMS/เบอร์จริง,
credential, field work, permanent tag หรือ Physical Device Validation และไม่อนุญาต
ข้าม Gate 4 ไป Phase 5
