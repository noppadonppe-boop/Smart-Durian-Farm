# Owner Review Addendum — Gate 3

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved — Gate 3 Passed; Phase 4 Authorized |
| ผู้อนุมัติ | Project Owner |
| วันที่อนุมัติ | 2026-08-31 |
| Source of Truth | Owner instruction in Codex task, `AGENTS.md`, `00-Project-Management/Decision-Log.md`, `08-Testing/Gate-3-Acceptance-Checklist.md` |

> **Timing update:** DEC-027 และ Owner Review Addendum — Development Mock Data
> and Pilot Timing แทนเงื่อนไขเดิมที่ให้ Physical Device Validation ผ่านก่อน
> Pilot Candidate โดยให้เก็บหลักฐานระหว่าง Controlled Pilot หลัง Deploy
> Pilot Candidate ที่ได้รับอนุมัติแทน หลักฐานยัง `Deferred / Not Passed` และต้อง
> ผ่านก่อน Production/permanent tags/scale-up

## 1. คำตัดสิน

Owner ยอมรับ residual risk จากการที่ยังไม่ได้ทดสอบ Android/iPhone, กล้อง, QR,
LAN/Hotspot และ Online/Offline บนอุปกรณ์จริง และอนุมัติให้ Deferred รายการดังกล่าว
ไปยัง Pre-Production / Operational Application Pilot ก่อนใช้งานจริง ผลิตป้ายถาวร
หรือเผยแพร่ Production

**Gate 3 ผ่าน และอนุมัติเริ่ม Phase 4 ตาม Prompt Phase 4**

การอนุมัตินี้เป็นการยอมรับความเสี่ยงและเลื่อนหลักฐาน ไม่ใช่การรับรองว่า Physical
Device Validation หรือ Field Validation ผ่านแล้ว

## 2. ขอบเขต Phase 4 ที่อนุมัติ

- ใช้ข้อมูลจำลองและ Firebase Local Emulator เท่านั้น
- พัฒนา Work Orders, Tree Care และ Disease ตาม Prompt Phase 4
- รัน unit/component/rules/emulator/build และ local responsive validation ได้
- ใช้ test phone/OTP เฉพาะ Firebase Authentication Emulator

## 3. ข้อห้าม

- ห้าม Firebase Production, billing, public deployment และ Production domain
- ห้าม SMS จริง เบอร์จริง credential หรือ service-account key
- ห้ามลงพื้นที่จริง ผลิตป้ายถาวร หรืออ้างว่า Physical Device Validation ผ่าน
- ห้ามเริ่ม Phase 5 จนกว่า Owner อนุมัติ Gate 4 อย่างชัดเจน

## 4. Deferred evidence และ stop condition

- Android/iPhone จริง, camera permission/autofocus, QR scan, LAN/Hotspot,
  Online/Offline transition และ Cross-Farm denial บนอุปกรณ์จริงยังไม่ผ่าน
- topology/tree/tag evidence จริงที่ยังไม่ได้เก็บต้องไม่ถูกอ้างว่าเป็นหลักฐานผ่าน
- หาก Physical Device Validation พบ Android/iPhone, กล้อง, QR, Offline หรือ
  Cross-Farm ไม่ผ่าน ต้องแก้ไขและทดสอบซ้ำก่อนใช้งานจริง
- ห้าม Production/field use/permanent tag จน
  `08-Testing/Physical-Device-Validation-Gate_v1.0.md` ผ่านและ Owner อนุมัติ

## 5. Residual risk acceptance boundary

Owner ยอมรับ residual risk เพื่อให้เริ่ม Phase 4 local/emulator-only ได้เท่านั้น
Owner ไม่ได้ยอมรับ data leak, Cross-Farm disclosure, corrupt history, duplicate
critical event หรือการข้าม Physical Device Validation ก่อนใช้งานจริง
