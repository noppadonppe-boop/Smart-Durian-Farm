# Owner Review Addendum — Gate 4

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved — Gate 4 Passed; Phase 5 Authorized |
| ผู้อนุมัติ | Project Owner |
| วันที่อนุมัติ | 2026-08-31 |
| Source of Truth | Owner instruction in Codex task, `AGENTS.md`, `00-Project-Management/Decision-Log.md`, `08-Testing/Gate-4-Acceptance-Checklist.md`, DEC-027 |

## 1. คำตัดสิน

Owner ส่งข้อความอนุมัติอย่างชัดเจน:

> Gate 4 ผ่าน อนุมัติเริ่ม Phase 5 ตาม Prompt Phase 5

จึงถือว่า Phase 4 ผ่าน Owner Gate และอนุญาต Phase 5 — Production & Commercial
Traceability ตาม Prompt Phase 5 แบบ Mock-first/local/Firebase Emulator เท่านั้น

## 2. ขอบเขต Phase 5 ที่อนุมัติ

- Crop Cycle และ stages ตั้งแต่ flowering ถึง harvested
- Fruit Observation พร้อมวิธีนับ จำนวนผลร่วง คุณภาพค่า หน่วย เวลา และ actor
- Harvest Lot และ trace จาก Tree/Zone/Crop Cycle
- Sales Lot พร้อม customer reference ขั้นต่ำ ราคา มัดจำ รับแล้ว และค้าง
- Inventory receipt/issue/adjustment, lot/unit/expiry, low-stock/expiry alerts
- เชื่อม Inventory usage กับ Work/Care และสรุป direct cost เท่าที่ข้อมูลรองรับ
- Farm-scoped Rules, Audit, idempotency, UI/mobile และ Emulator validation
- ใช้ Mock Data Pack แบบ versioned, deterministic, resettable และติดป้าย
  `SIMULATED/TEST ONLY`

## 3. ข้อห้ามที่ยังคงเดิม

- ห้าม Firebase Production, billing, public deployment และ Production domain
- ห้าม SMS/เบอร์จริง, credential, service-account key และข้อมูลบุคคล/สวนจริง
- ห้าม accounting, tax, payroll, banking, e-commerce และ Cross-Farm transfer
- ห้ามนำข้อมูล Physical/Field/QR ที่ยัง Deferred มาอ้างว่า Passed
- ห้ามเริ่ม Phase 6 จนกว่า Gate 5 ผ่านและ Owner อนุมัติอย่างชัดเจน

## 4. Residual risks ที่ carry forward

- Physical Device/Field/QR evidence ยัง `Deferred / Not Passed` ตาม DEC-027
- QR base URL ยัง `TBD`; ห้ามผลิตป้ายถาวร
- DEC-026 chemical/treatment approval policy ยัง Open
- Customer/privacy/retention/backup และ account recovery ต้องปิดก่อน Production
- Bundle size warning ต้องติดตามและ harden ใน Phase 6 หาก Owner อนุมัติ
