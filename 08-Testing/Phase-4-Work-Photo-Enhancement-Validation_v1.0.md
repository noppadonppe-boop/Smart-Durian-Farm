# Phase 4 Work Photo Enhancement Validation

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Passed — Local/Mock/Firebase Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-08-31 |
| Source of Truth | `AGENTS.md` v2.4, Development/Mock Data/Pilot Knowledge v1.0.1, Scope Knowledge v0.2.2, Master Prompt v1.1.2, UX/UI Knowledge v0.1.2, Phase 4 Plan v1.3, DEC-027, DEC-030 |

## 1. สรุปผล

ส่วนเพิ่มรูปประกอบ Work Order และรูปหลักฐาน Worker Report ผ่านการตรวจระดับ
domain, UI, Mock adapter, Firebase Repository, Firestore Rules และ Storage Rules
ในสภาพแวดล้อม local/Mock/Firebase Emulator โดยไม่ใช้รูป บุคคล สวน อุปกรณ์ หรือ
Firebase Production จริง

## 2. Requirement ที่ยืนยัน

- ผู้สร้าง Work Order ที่มีสิทธิ์แนบรูปประกอบได้ 0–3 รูปเฉพาะขณะ `DRAFT`
  ก่อน Assign และเขียนทับแบบเงียบ ๆ ไม่ได้
- Worker ของ Work Order เปิดดูรูปประกอบได้ แต่ไม่มีสิทธิ์เพิ่มหรือแก้รูปชุดนี้
- Worker Report ต้องมีรูป `BEFORE` อย่างน้อย 1 และ `AFTER` อย่างน้อย 1
  รวมไม่เกิน 6 รูป และทุกไฟล์ต้องเป็น `UPLOADED` ก่อน Submit
- รูปคำสั่งงานและรูปส่งงานแยก purpose/phase, UI, สิทธิ์ และ audit ชัดเจน
- รับเฉพาะ JPEG/PNG/WebP ขนาดไม่เกิน 5 MB และผูก path กับ
  Organization/Farm/Work Order เดียวกัน
- Owner/Manager/Auditor อ่านได้ตาม Farm; Agronomist อ่านตามประเภทงานหรือ
  assignment; Worker อ่านเฉพาะงานที่ตนได้รับมอบหมาย
- Cross-Farm, wrong role, wrong Work path, update/delete ไฟล์ และ partial upload
  ถูกปฏิเสธ

## 3. หลักฐานการทดสอบ

คำสั่ง `pnpm validate` ผ่านครบเมื่อ 2026-08-31:

| รายการ | ผล |
|---|---|
| ESLint | ผ่าน ไม่มี warning/error |
| TypeScript strict | ผ่าน |
| Unit/component | 100/100 ผ่านใน 12 test files |
| Firebase Emulator/security/integration | 41/41 ผ่านใน 7 test files |
| Production build + PWA | ผ่าน; precache 48 entries |
| Performance budget | Initial JS 326,981/350,000 bytes; CSS 40,504/60,000 bytes; offline runtime 1,267,211/1,800,000 bytes |
| Offline runtime scan | ผ่าน 48 local build files |
| Mock Data Pack reset | ผ่าน: 6 test accounts, 4 example farms, 6 Work Orders และข้อมูล Phase 5–6 จำลองที่เกี่ยวข้อง |

Firebase CLI แจ้งเตือนว่าอ่าน remote MOTD/config ไม่ได้เนื่องจาก network เท่านั้น
ซึ่งไม่กระทบ Emulator test และทุก service ปิดตามปกติหลังจบการทดสอบ

## 4. Security depth

- UI จำกัดจำนวน/ชนิดไฟล์และแสดงชุดรูปแยกกัน
- Domain validation ตรวจ phase, upload state, จำนวน, duplicate photo ID/path และ
  จัดลำดับ BEFORE ก่อน AFTER
- Repository ตรวจ actor, role, Farm, assignee, Work status และ idempotency
- Firestore Rules ตรวจรายการรวมไม่เกิน 6 รูปและตรวจรูปบังคับ BEFORE/AFTER
  สองรายการแรก รวม phase, upload state, ID และ Farm/Work storage path
- Storage Rules ตรวจ MIME, ขนาด, metadata, creator/assignee และ Work status;
  ห้าม update/delete
- รูปเพิ่มเติมลำดับที่ 3–6 ตรวจครบใน Domain/Repository; การเปิด URL ทุกใบยัง
  ตรวจ Farm/Work path ซ้ำก่อนคืนค่า

## 5. ความเสี่ยงและงานก่อนใช้จริง

- ยังไม่ได้ทดสอบกล้อง Android/iPhone จริง, permission, HEIC conversion,
  EXIF orientation, สัญญาณอ่อน หรือการอัปโหลดไฟล์จริงในสวน
- ต้องเพิ่ม client-side resize/compression และลบ EXIF/GPS ก่อน Controlled Pilot
- Phase 6 มี mock/local photo retry และ orphan cleanup แล้ว แต่ยังควรเชื่อม
  Work Create แบบ `create → upload → save instructionPhotos → assign` เข้ากับ
  recovery record อัตโนมัติเมื่อขั้นตอนใดขั้นตอนหนึ่งล้มเหลว
- ต้องอนุมัติ retention, backup, privacy และสิทธิ์ export รูปก่อนใช้ข้อมูลจริง
- รูปประกอบที่จำเป็นต่อการทำงาน offline ควรมี thumbnail cache พร้อมสถานะชัดเจน
- QR base URL, Physical Device/Field evidence และ Production controls ยังคง
  Deferred ตาม Source of Truth เดิม

## 6. Gate impact

งานนี้เป็น post-Gate 4 enhancement ตาม DEC-030 และไม่เปลี่ยนสถานะ Gate โดย
อัตโนมัติ ไม่อนุญาต Firebase Production, deployment, รูปจริง หรือ Phase ที่ยัง
ไม่ได้รับอนุมัติจาก Owner
