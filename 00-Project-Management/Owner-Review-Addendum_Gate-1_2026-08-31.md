# Owner Review Addendum — Gate 1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved |
| ผู้อนุมัติ | Project Owner |
| วันที่อนุมัติ | 2026-08-31 |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Owner Review Decision ใน Codex task ปัจจุบัน, `00-Project-Management/Decision-Log.md`, `08-Testing/Gate-1-Acceptance-Checklist.md` |

## 1. คำตัดสิน

> **Gate 1 ผ่าน อนุมัติเริ่ม Phase 2 ตาม Prompt Phase 2**

การอนุมัตินี้อาศัยหลักฐาน Phase 1 ใน
`08-Testing/Phase-1-Validation-Report_v1.0.md` และ
`08-Testing/Gate-1-Acceptance-Checklist.md` โดย Phase 2 ยังต้องทำแบบ
local development และ Firebase Local Emulator เท่านั้น

## 2. DEC-010 Sign-in method

Owner เลือกและอนุมัติ:

- ใช้ **เบอร์โทรศัพท์ + SMS OTP** เป็นวิธี Sign-in
- Phase 2 ใช้หมายเลขโทรศัพท์ทดสอบและ OTP จำลองกับ Firebase Authentication
  Emulator เท่านั้น
- การ Sign-in สำเร็จเป็นเพียงการยืนยันตัวตน ไม่ให้สิทธิ์เข้าถึง Farm โดยอัตโนมัติ;
  ระบบยังต้องตรวจ Organization/Farm membership และ role จากข้อมูลที่เชื่อถือได้
- Production SMS, production Firebase Authentication, billing, quota, provider
  configuration และหมายเลขโทรศัพท์จริงยังไม่ได้รับอนุมัติ

นโยบาย account recovery กรณีเปลี่ยนหรือสูญเสียหมายเลขโทรศัพท์ต้องกำหนดก่อนใช้
Production Authentication

## 3. หลักฐาน Gate 1 ที่ Owner รับทราบ

- lint, typecheck, tests และ production build ผ่าน
- PWA และ offline-critical runtime ใช้ local assets โดยไม่มี external CDN
- Firebase Auth/Firestore/Storage Emulator smoke ผ่าน
- Responsive 320px/1280px และ browser console checks ผ่าน
- network-denied test ไม่มี runtime fetch หรือ console error
- ไม่พบ production credential, service-account key หรือข้อมูลสวนจริง

## 4. ขอบเขต Phase 2 ที่อนุมัติ

- Authentication flow แบบ Phone + OTP บน Firebase Local Emulator
- Organization/Farm membership และ Farm Switcher
- Canonical roles 7 บทบาทแบบ least privilege
- Firestore/Storage Rules แบบ deny-by-default และ farm-scoped authorization
- Emulator tests สำหรับ same-farm allow, cross-farm deny, forged payload,
  revoked membership, role downgrade และ archived farm behavior
- Mock/seed data ที่ระบุชัดเจนว่าไม่ใช่ข้อมูลสวนจริง
- lint, typecheck, tests, build และ local responsive validation

## 5. ยังไม่อนุมัติ

- Production Firebase Authentication หรือ SMS จริง
- Billing, public deployment, production domain หรือ credentials
- ข้อมูลสวนจริงหรือหมายเลขโทรศัพท์จริง
- Phase 3 หรือการผลิต/ติดตั้งป้ายจริง

## 6. Acceptance boundary

- Phase 2 ต้องทำตาม Prompt Phase 2 ใน
  `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md`
- เมื่อ Phase 2 เสร็จ ให้จัดทำ Gate 2 checklist และหยุดรอ Owner approval
- ห้ามเริ่ม Phase 3 จนกว่า Owner จะอนุมัติ Gate 2 ด้วยข้อความชัดเจน
