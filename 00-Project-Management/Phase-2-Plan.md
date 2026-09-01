# Phase 2 Plan — Multi-Farm & Access Control

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | Gate 2 Passed Historically — Farm Management Remediation Authorized by DEC-043 |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md`, `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md`, `00-Project-Management/Owner-Review-Addendum_Gate-1_2026-08-31.md`, `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`, `00-Project-Management/Decision-Log.md` (DEC-043) |

## 1. เป้าหมาย

สร้างขอบเขต Organization/Farm, Phone OTP บน Local Emulator, Farm Switcher,
บทบาท 7 บทบาท และ Security Rules ที่พิสูจน์ได้ว่าข้อมูลไม่รั่วข้ามสวน

## 2. In scope ที่ดำเนินการ

- Phone + OTP สำหรับหมายเลขทดสอบบน Firebase Authentication Emulator
- Organization/Farm membership และ role รายสวน
- Farm Switcher, pending-scope warning และ deep-link authorization
- Loading, no farm, access denied, suspended และ archived UI states
- Role/revoke/restore สำหรับสมาชิกโดย `ORG_OWNER` พร้อม Audit Event
- Firestore/Storage Rules แบบ deny-by-default
- Mock/Emulator seed อย่างน้อย 2 สวน และข้อมูลทั้งหมดระบุเป็นตัวอย่าง
- Unit/component, network-denied, rules, repository และ Auth Emulator tests

## 3. Out of scope ที่รักษาไว้

- Firebase/SMS/ข้อมูลจริง, billing, credentials, domain และ deployment
- Invitation/owner bootstrap ที่ต้องใช้ trusted backend
- Tree Register, QR resolver/camera และ business modules Phase 3–5
- Cross-farm transfer/copy และ Portfolio analytics เต็มรูปแบบ
- Account recovery กรณีเปลี่ยนหรือสูญเสียเบอร์โทรศัพท์

## 4. หลักสิทธิ์ที่ใช้

รายละเอียดที่ Role Matrix ยังไม่ระบุชัดใช้ค่าจำกัดที่สุด:

- เฉพาะ `ORG_OWNER` จัดการ membership/role ใน Phase 2
- `FARM_MANAGER` ยังไม่เชิญ เปลี่ยน role หรือ revoke สมาชิก
- `VIEWER` และ `AUDITOR` ไม่เขียนข้อมูลปฏิบัติการ
- Farm `SUSPENDED` และ `ARCHIVED` อ่านได้ตาม membership แต่เขียนไม่ได้
- Organization bootstrap และการเพิ่มสมาชิกใหม่ถูกปฏิเสธจาก client

## 5. เกณฑ์ผ่านภายใน

- [x] ผู้ใช้สวน A อ่าน/เขียนสวน B ไม่ได้
- [x] forged `farmId` และ Storage metadata ถูกปฏิเสธ
- [x] revoked membership และ role downgrade มีผลจาก Rules ปัจจุบัน
- [x] ผู้ใช้คนเดียวมี role ต่างกันในแต่ละสวนได้
- [x] Worker ไม่เห็น admin action
- [x] pending operation ไม่เปลี่ยน farm scope เมื่อสลับสวน
- [x] lint, typecheck, unit/component tests, build, offline smoke และ Emulator tests ผ่าน
- [x] 320px และ Desktop ไม่มี horizontal overflow หรือ console error
- [ ] Owner อนุมัติ Gate 2

## 6. สถานะหยุด

Gate 2 ผ่านเป็นหลักฐานเชิงประวัติแล้ว แต่การตรวจภายหลังพบว่า Farm Switcher และ
membership มี implementation ขณะที่ Farm create/edit/status/archive ยังไม่มี UI และ
repository flow ตาม MVP จึงอนุมัติ remediation แบบ Local/Mock/Firebase Emulator
ตาม DEC-043 โดยไม่ย้อนสถานะ Gate และไม่อนุญาต Deploy/ข้อมูลจริง

## 7. Remediation scope ตาม DEC-043

- ใช้ `00-Project-Management/Phase-2-Farm-Management-Remediation-Prompt_v1.0.md`
- เพิ่ม Farm Profile, Owner-only create/edit/suspend/reactivate/archive และ Audit
- ใช้ deterministic Mockup 4 สวนและห้าม Hard delete
- จัดทำ validation report เพิ่มเมื่อ implementation เสร็จ
