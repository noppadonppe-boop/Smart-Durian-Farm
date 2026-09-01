# Phase 2 Threat Model v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Reviewed — Gate 2 Owner Review Required |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `06-System-Architecture/Phase-2-Multi-Farm-Access-Architecture_v0.1.md`, `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md` |

## 1. Threat notes

| ภัยคุกคาม | การควบคุม | หลักฐาน |
|---|---|---|
| แก้ `farmId` ใน payload | Path และ fields ต้องตรง Organization/Farm | forged payload test ผ่าน |
| อ่าน/เขียนข้ามสวน | ตรวจ Organization + Farm membership ทุก request | cross-farm Firestore/Storage denial ผ่าน |
| ใช้ role เก่าหลัง downgrade | Rules อ่าน membership ปัจจุบัน | role downgrade test ผ่าน |
| ใช้บัญชีที่ถูก revoke | Organization/Farm status ต้อง Active | revoked membership test ผ่าน |
| เปลี่ยน role โดยไม่ทิ้งหลักฐาน | membership update ต้องมี matching atomic Audit Event | missing-audit deny และ paired-audit allow ผ่าน |
| ปลอม Audit actor/target/after state | actor ต้องเท่ากับ Auth UID และ before/after ต้องตรง `get/getAfter` | emulator test ผ่าน |
| ยกระดับ `ORG_OWNER` | role นี้ต้องมี Organization member `isOwner = true` | Rules enforcement |
| Owner ทำให้ตนเองหลุดระบบ | ปฏิเสธ client update membership ของบัญชีปัจจุบัน | Rules + UI guard |
| เขียนข้อมูลใน Farm Archived | Archived อ่านได้แต่เขียนไม่ได้ | Firestore/Storage test ผ่าน |
| ปลอม Storage metadata | metadata ต้องตรง path และ Auth UID | forged metadata test ผ่าน |
| ใช้หมายเลขจริงโดยผิดพลาด | test-phone allowlist + emulator-only client guard | unit/Auth Emulator test ผ่าน |
| pending เปลี่ยน scope เมื่อสลับสวน | operation scope immutable และต้องยืนยันก่อนเปลี่ยน | component/browser test ผ่าน |

## 2. Residual risks

1. Account recovery เมื่อเปลี่ยนหรือสูญเสียหมายเลขโทรศัพท์ยังไม่กำหนดและเป็น
   blocker ก่อน Production Authentication
2. Invitation, Organization bootstrap และ owner assignment ต้องใช้ trusted backend;
   Phase 2 ปฏิเสธ client writes เหล่านี้
3. สิทธิ์เชิญ/เปลี่ยน role ของ `FARM_MANAGER`, approval policy และ export scope
   ยังต้อง Owner ตัดสิน; implementation ใช้ค่าจำกัดที่สุด
4. การ revoke ขณะอุปกรณ์ offline อาจยังเห็น cache เดิมจน reconnect; การเขียนใหม่
   ถูก Rules ปฏิเสธเมื่อเชื่อมต่อ ประเด็น UX/offline hardening อยู่ Phase 6
5. Image compression, retention, backup และ orphan cleanup ยังไม่อนุมัติ
6. Production index, quota, App Check, monitoring และ incident response ยังไม่อยู่ใน Phase 2
7. Build ผ่านแต่ main JavaScript chunk ประมาณ 893 kB (gzip 268 kB) และมีคำเตือน
   chunk size; ควรทำ code-splitting/performance budget ก่อน Pilot

## 3. Gate position

ไม่พบ cross-farm leak หรือ privileged action ที่เชื่อ client เพียงอย่างเดียวในการ
ทดสอบ Phase 2 เหลือ residual risks ที่บันทึกไว้และไม่มีข้อใดอนุญาต Production
หรือ Phase 3 โดยอัตโนมัติ
