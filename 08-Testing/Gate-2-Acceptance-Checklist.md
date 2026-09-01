# Gate 2 Acceptance Checklist

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | APPROVED — Gate 2 Passed |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `00-Project-Management/Owner-Review-Addendum_Gate-2_2026-08-31.md`, `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md`, `08-Testing/Phase-2-Validation-Report_v1.0.md` |

## 1. Implementation checklist

- [x] Phone + OTP ใช้เฉพาะ test phone และ Firebase Authentication Emulator
- [x] Organization/Farm membership model พร้อม role รายสวน
- [x] Farm Switcher แสดงเฉพาะสวนที่มีสิทธิ์
- [x] pending operation ไม่เปลี่ยน Organization/Farm scope เมื่อสลับสวน
- [x] Worker ไม่เห็น membership/audit admin action
- [x] UI มี loading, no farm, access denied, suspended และ archived state
- [x] Firestore Rules deny-by-default และ farm-scoped
- [x] Storage Rules deny-by-default, path/metadata scoped และจำกัด role
- [x] Membership role/revoke/restore สร้าง matching append-only Audit Event
- [x] Seed/demo data อย่างน้อย 2 สวนและระบุว่าไม่ใช่ข้อมูลจริง
- [x] ไม่มี Production Firebase, SMS จริง, billing, credentials หรือ deployment

## 2. Validation checklist

- [x] same-farm allow
- [x] cross-farm Firestore/Storage deny
- [x] forged `farmId` และ forged Storage metadata deny
- [x] revoked membership deny
- [x] role downgrade มีผลทันทีจาก Rules
- [x] archived Farm อ่านได้และเขียนไม่ได้
- [x] membership update ที่ไม่มี Audit ถูกปฏิเสธ
- [x] Firebase repository ทำงานผ่าน Rules จริง
- [x] Auth Emulator Phone OTP request/verify ผ่านโดยไม่ส่ง SMS จริง
- [x] lint และ TypeScript strict ผ่าน
- [x] unit/component/network-denied tests 19 รายการผ่าน
- [x] Emulator tests 14 รายการผ่าน
- [x] production build และ offline runtime scan ผ่าน
- [x] Browser 320px/1280px ไม่มี horizontal overflow หรือ console error

## 3. Owner review items

Owner ตอบ `Approve`, `Revise` หรือ `Defer` ทีละข้อได้:

1. อนุมัติ baseline ที่เฉพาะ `ORG_OWNER` จัดการสมาชิกใน Phase 2
2. รับทราบว่า `FARM_MANAGER` invitation/role policy ยังจำกัดไว้ก่อน
3. รับทราบ Archived policy: อ่านย้อนหลังได้ แต่เขียน/อัปโหลดใหม่ไม่ได้
4. รับทราบ Organization bootstrap/invitation ต้องมี trusted backend ภายหลัง
5. รับทราบ account recovery เป็น blocker ก่อน Production Auth
6. รับทราบ build chunk-size warning เป็น performance action ก่อน Pilot
7. ยืนยันว่า Gate 2 ผ่านหรือให้แก้ไขรายการใดก่อน

## 4. Gate decision

- [ ] **NOT APPROVED YET**
- [x] **Gate 2 APPROVED — Project Owner, 2026-08-31**

หลักฐาน: `00-Project-Management/Owner-Review-Addendum_Gate-2_2026-08-31.md`

Owner อนุมัติด้วยข้อความ:

```text
Gate 2 ผ่าน อนุมัติเริ่ม Phase 3 ตาม Prompt Phase 3
```

การอนุมัติ Gate 2 ไม่อนุมัติ Production resource, ข้อมูลจริง หรือการผลิตป้ายจริง
และยังต้องรักษา Field Validation Gate ตาม Source of Truth
