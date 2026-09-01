# Owner Review Addendum — Gate 2

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved — Gate 2 Passed |
| ผู้อนุมัติ | Project Owner |
| วันที่อนุมัติ | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `00-Project-Management/Decision-Log.md`, `08-Testing/Gate-2-Acceptance-Checklist.md`, `08-Testing/Phase-2-Validation-Report_v1.0.md` |

## 1. ข้อความอนุมัติ

Project Owner อนุมัติด้วยข้อความ:

> **Gate 2 ผ่าน อนุมัติเริ่ม Phase 3 ตาม Prompt Phase 3**

ข้อความนี้ปิด Gate 2 และอนุญาตให้เริ่ม **Phase 3 — Tree Register & QR**
ตาม `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md`

## 2. สิ่งที่ Owner รับทราบจาก Gate 2

- Membership administration baseline ยังจำกัดเฉพาะ `ORG_OWNER`
- `FARM_MANAGER` invitation/role policy ยังไม่เปิดกว้าง
- Archived Farm อ่านย้อนหลังได้แต่เขียนใหม่ไม่ได้
- Organization bootstrap/invitation ต้องใช้ trusted backend ก่อน Production
- Account recovery เมื่อเปลี่ยนหรือสูญเสียเบอร์ยังเป็น blocker ก่อน Production Auth
- JavaScript chunk-size warning ต้องจัดการก่อน Operational Application Pilot

## 3. ขอบเขต Phase 3 ที่อนุมัติ

- Zone, Row, Planting Position และ Planting Cycle แบบข้อมูลจำลอง/Emulator
- Tree list/search/filter, detail, timeline และ role-based create/edit/archive
- Tag parser/generator ตาม namespace ที่อนุมัติ
- CSV preview/validation/duplicate/reject/idempotency แบบไม่สร้าง partial records
- Configurable QR route `/t/{opaquePositionId}`, scan/manual fallback และ
  match/mismatch/unknown/damaged/offline-cached states
- Firestore Rules, Cross-Farm denial, audit/timeline และ automated tests

## 4. ขอบเขตที่ไม่ได้รับอนุมัติ

- Firebase Production, billing, public deployment, production credentials หรือ SMS จริง
- Production QR domain หรือการผลิตป้ายจริง
- ข้อมูลสวน/บุคคลจริง
- Work Orders, treatment, harvest, sales หรือ inventory ของ Phase 4–5
- การเริ่ม Phase 4 ก่อน Gate 3 ผ่าน

## 5. เงื่อนไข Field Validation ที่ยังคงอยู่

การอนุมัติ Gate 2 ไม่ได้แทน **Field Validation Gate** รายการต่อไปนี้ยังต้องมี
หลักฐานก่อนล็อก Tree/Tag implementation และก่อน Gate 3 sign-off:

1. Topology, Organization Code, Farm Sequence, Zone/Row และทิศทางนับจริง
2. ทดสอบป้าย 5–10 ป้าย
3. สำรวจต้น 30–50 ต้น
4. Production QR domain ที่ Owner ควบคุม ก่อนใช้ QR จริง/ผลิตป้าย

ค่าทั้งหมดที่ยังไม่มีหลักฐานต้องเป็น `TBD` และ implementation ระหว่างนี้ต้อง
configurable พร้อมใช้ข้อมูลจำลองเท่านั้น

## 6. Acceptance criteria

- Decision Log มีรายการอนุมัติ Phase 3 พร้อมแหล่งที่มาและวันที่
- Gate 2 Checklist เปลี่ยนเป็น Approved โดยเก็บหลักฐานเดิม
- Phase 3 หยุดที่ Gate 3/Field Validation Review และไม่เริ่ม Phase 4
