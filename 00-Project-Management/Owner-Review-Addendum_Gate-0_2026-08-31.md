# Owner Review Addendum — Gate 0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved |
| ผู้อนุมัติ | Project Owner |
| วันที่อนุมัติ | 2026-08-31 |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Owner Review Decision ใน Codex task `Smart-Durian-Code`, `00-Project-Management/Decision-Log.md`, `08-Testing/Gate-0-Acceptance-Checklist.md` |

## 1. คำตัดสิน

> **Gate 0 ผ่าน อนุมัติเริ่ม Phase 1 Foundation**

การอนุมัตินี้ปลด DEC-015 สำหรับ Phase 1 เท่านั้น ห้ามเริ่ม Phase 2 จนกว่า
Owner จะอนุมัติ Gate 1 ด้วยข้อความชัดเจน

## 2. Decisions ที่ Approved

- DEC-001 Responsive Web App/PWA
- DEC-002 Vite + React + TypeScript + Firebase แบบ local/emulator-first
- DEC-003 Multi-Farm isolation
- DEC-004 Permanent Planting Position และ `plantingCycle`
- DEC-005 และ DEC-018 แยก Field Validation ออกจาก Phase 7 Operational Application Pilot
- DEC-006 วัสดุป้ายเป็นข้อเสนอสำหรับทดสอบ 5–10 ป้ายเท่านั้น
- DEC-007 และ DEC-016 Human Tag namespace และ opaque internal IDs
- DEC-008 QR route `/t/{opaquePositionId}`; production domain เลื่อนไปก่อนผลิตป้ายจริง
- DEC-009 Canonical roles 7 บทบาทและ Role/Access Matrix แบบ least privilege
- DEC-011 Offline, idempotency, conflict review และ correction-event policy
- DEC-012 Sales MVP boundary
- DEC-014 Display name `Smart Durian Farm`; technical name `KDOMS`
- DEC-017 Data policy baseline และข้อห้ามใช้ข้อมูลจริงก่อน production policy

## 3. Decisions ที่คงสถานะ

- DEC-010 Sign-in method = `Open`; ต้องตัดสินก่อน Phase 2
- DEC-013 Cross-farm transfer = `Deferred`
- Field topology, รหัสสวนจริง, ป้ายทดลอง และ Tree Survey = `TBD`

## 4. Gate 1 action จาก residual issue

Owner รับทราบว่า UX Prototype มี optional CDN resources ที่อาจโหลดไม่ได้เมื่อ
เครือข่ายถูกปิด แต่ core interaction ทำงานได้ สำหรับแอป Phase 1:

- ห้ามพึ่ง external runtime CDN ใน offline-critical flow
- ต้องมี network-denied smoke test
- network-denied smoke test ต้องไม่มี console error

ข้อกำหนดนี้บันทึกเป็น DEC-019 และเป็นส่วนหนึ่งของ Gate 1 acceptance

## 5. ขอบเขต Phase 1 ที่อนุมัติ

- Local Git repository และ Version Control
- Vite + React + TypeScript ภายใน `07-Source-Code/web-app`
- Mock data เท่านั้น
- Firebase Local Emulator
- Test, lint, typecheck, build และ local responsive validation

## 6. ยังไม่อนุมัติ

- Firebase production หรือ production project
- Billing
- Public deployment
- Production domain
- Credentials หรือ service-account key
- ข้อมูลสวนจริง
- Phase 2

## 7. Acceptance boundary

- Phase 1 ต้องทำตาม Prompt Phase 1 ใน
  `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md`
- เมื่อ Phase 1 เสร็จ ให้รายงาน Gate 1 และหยุดรอ Owner approval
- การผ่าน Gate 0 ไม่อนุมัติ production resource หรือ Field Validation result
