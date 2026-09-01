# Prompt — Phase 2 Farm Management Remediation v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved Prompt — Ready for Codex Implementation under DEC-043 |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | Local/Mock/Firebase Emulator engineering remediation only |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`, `00-Project-Management/Decision-Log.md` (DEC-043) |

คัดลอก Prompt ด้านล่างให้ Codex ใช้ได้ทันที:

```text
คุณกำลังทำงานในโครงการ Smart Durian Farm / KDOMS

Phase: Phase 2 Remediation — Farm Profile and Management
งาน: เพิ่มเมนูจัดการสวนให้ Owner สามารถเพิ่ม แก้ไข ระงับ เปิดใช้งานใหม่ และ
เก็บถาวรสวนได้ โดยไม่ลบประวัติ และใช้ข้อมูลจำลองเท่านั้น

ก่อนแก้ไข:
1. อ่าน AGENTS.md และเอกสารบังคับทั้งหมด
2. อ่าน 01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md
3. อ่าน 00-Project-Management/Decision-Log.md โดยเฉพาะ DEC-043
4. ตรวจ git status และรักษาการเปลี่ยนแปลงเดิมของผู้ใช้
5. ตรวจ implementation ปัจจุบันของ FarmSwitcher, MorePage, Phase2Repository,
   Mock/Firebase repositories และ Firestore Rules

ขอบเขตที่ต้องทำ:
- เพิ่มเมนู `เพิ่มเติม → จัดการสวน` สำหรับ ORG_OWNER
- เพิ่มหน้ารายการสวน, เพิ่มสวน และดู/แก้ Farm Profile
- ใช้ field, validation, status transition และ Mockup ตาม Farm Profile Knowledge
- ระบบสร้าง organizationId/farmId/farmCode/timestamp/audit metadata เอง
- สร้าง Farm + Owner membership + Audit แบบ atomic และ idempotent
- ป้องกัน farmSequence/farmCode ซ้ำด้วย trusted transaction/uniqueness guard
- เพิ่ม Audit before/after และ version ทุกการแก้ไข/เปลี่ยนสถานะ
- รองรับ ACTIVE, SUSPENDED และ ARCHIVED
- หยุด Archive เมื่อมี Work Order เปิดหรือ Offline/Pending operation
- ไม่มีปุ่มหรือ repository method สำหรับ Hard delete Farm
- ผู้ใช้ที่ไม่ใช่ ORG_OWNER อ่าน Profile ได้เฉพาะสวนที่มี membership และแก้ไม่ได้
- ปรับ Mock Data Pack เดิม 4 สวนให้มี Farm Profile Mockup แบบ deterministic,
  resettable และติดป้าย SIMULATED/TEST ONLY
- ปรับ Mock adapter, Firebase adapter และ Firestore Rules/Emulator tests ให้ตรงกัน
- รักษา Cross-Farm deny และห้าม client เปลี่ยน organizationId/farmId/role

UX แบบง่าย:
- ใช้หน้าจอมือถือ 320px ขึ้นไป
- แบบฟอร์มแบ่งเป็น ข้อมูลหลัก, ที่ตั้ง, Timezone/ฤดูกาล และหมายเหตุ
- แสดง preview Farm Code จาก Organization Code + Farm Sequence
- แสดงข้อความชัดเจนก่อนระงับหรือ Archive
- Farm Switcher ยังคงใช้สลับสวน ไม่ใช้แทนหน้าจัดการสวน

Out of scope:
- Hard delete Farm
- การเปิด Farm ที่ Archive แล้วกลับมาใช้งาน
- ข้อมูล/ภาพ/พิกัด/บุคคลจริง
- Cross-Farm transfer หรือ copy
- Firebase Production deployment, Hosting deployment, Storage, resource/billing ใหม่
- PA-2, Controlled Pilot, Field work หรือ Operational Production rollout

Acceptance criteria:
1. ORG_OWNER เพิ่มสวนและได้ membership ของตนโดยอัตโนมัติ
2. Retry idempotency key เดิมไม่สร้างสวนซ้ำ
3. farmSequence/farmCode ซ้ำถูกปฏิเสธ
4. ORG_OWNER แก้ Profile ได้และ Audit before/after ถูกสร้าง
5. SUSPENDED/ARCHIVED เป็น read-only สำหรับข้อมูลปฏิบัติการ
6. Archive ที่มีงานเปิดหรือ Pending ถูกปฏิเสธพร้อมคำอธิบาย
7. ผู้ใช้บทบาทอื่นและ forged payload แก้ Farm ไม่ได้
8. Cross-Farm read/write ที่ไม่มี membership ถูกปฏิเสธ
9. ไม่มี Hard delete path
10. Mock Data Pack 4 สวน reset แล้วได้ผลเหมือนเดิม

ตรวจสอบเท่าที่จำเป็น:
- รัน unit/component tests เฉพาะ Farm domain, form, menu และ repository ที่แก้
- รัน Firebase Emulator Rules tests เฉพาะ Farm create/update/status/cross-farm
- รัน pnpm typecheck และ pnpm build
- รัน lint สำหรับ source ที่แก้ หรือ pnpm lint หากไม่มี targeted command
- ไม่ต้องรัน Full PA-1 rehearsal และห้าม Deploy

เมื่อเสร็จ:
- อัปเดต Phase-2 Validation Report หรือสร้าง Farm Management remediation report
- รายงานไฟล์ที่แก้ ผลทดสอบ ข้อจำกัด และยืนยันว่าใช้ Mock Data เท่านั้น
- ถ้าพบ Cross-Farm disclosure, duplicate Farm, orphan Farm without Owner,
  history loss หรือข้อมูลจริง ให้หยุด เก็บหลักฐาน แก้ และทดสอบซ้ำ
```
