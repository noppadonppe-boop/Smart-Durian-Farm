# Phase 7 Work Photo Durable Queue & Lifecycle Architecture

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Local Core Implemented and Validated — External Scheduler/Storage Adapter HOLD Pending PA-1/PA-2 |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | DEC-030, DEC-034, DEC-036, Development/Mock Data/Pilot Knowledge v1.0.3, Privacy Review v0.3, Phase 7 Plan v1.4 |

## 1. เป้าหมาย

ป้องกัน Work photo สูญหายหรือถูกระบุว่าสำเร็จจาก metadata อย่างเดียว โดยให้
ไฟล์ภาพและ Report draft อยู่ใน Durable Queue ของอุปกรณ์จนกว่า upload และการผูก
Work จะ commit สำเร็จ พร้อมมี server-side lifecycle worker เป็นผู้ลบ Orphan และ
บังคับ retention จริงหลังได้รับอนุมัติ

## 2. Durable binary queue

- ใช้ IndexedDB ชื่อ `kdoms-work-photo-queue-v1`; memory fallback ใช้เฉพาะ
  automated/Mock environment ที่ไม่มี IndexedDB
- Queue key แยก `organizationId + farmId + actorUserId + batchId`; อ่าน/แก้/ลบ
  ข้าม scope ถูกปฏิเสธ
- เก็บ source Blob, phase, Work ID, report draft, commit idempotency key และ
  uploaded checkpoint สูงสุด 7 วัน; ลบเมื่อ commit สำเร็จ, logout หรือ reset
- Instruction batch มี 1–3 รูป phase `INSTRUCTION`; Report batch มีไม่เกิน 6 รูป
  และต้องมี `BEFORE`/`AFTER` อย่างน้อยประเภทละ 1
- Retry หลัง reload ข้ามรูปที่มี uploaded checkpoint, ส่งเฉพาะ binary ที่ขาด,
  commit ด้วย key เดิม แล้วจึงปิด `FAILED/PENDING/ORPHANED` recovery ที่เกี่ยวข้อง
- หากเขียน Queue/checkpoint ไม่ได้ ให้ fail closed; object ที่อัปโหลดแล้วแต่
  checkpoint/commit ล้มเหลวต้องเข้า Orphan recovery ไม่เปลี่ยนสถานะเงียบ ๆ

Source Blob ใน Queue อาจยังมี EXIF/GPS จึงอยู่เฉพาะบนอุปกรณ์และมี TTL จำกัด
ทุกครั้งก่อนส่งไป non-Mock Storage ต้อง re-encode เป็น WebP ตาม policy; ห้ามนำ
Blob จาก IndexedDB อัปโหลดตรง

## 3. Photo lifecycle worker

Local worker core รองรับ `DRY_RUN` และ `ENFORCE`:

1. รับ inventory เฉพาะ Organization/Farm ที่กำหนดและตรวจ storage path ซ้ำ
2. ตรวจ Work reference ฝั่ง server ก่อนลบ Orphan; ถ้ายังอ้างถึง ให้หยุดลบและ
   reconcile recovery metadata
3. คำนวณ cutoff จาก approved orphan grace/retention และ approved anchor
   (`Pilot close`, `PA-3 decision` หรือ export creation)
4. โหมด `ENFORCE` ต้องมี PA-1, PA-2, Owner approval, Data Custodian approval,
   operator และ independent approver ที่เป็นคนละรหัส
5. เขียน `PLANNED` audit ก่อน delete, ใช้ deterministic deletion ID, ลบแบบ
   idempotent และเขียน `DELETED`/`FAILED` disposal evidence

การลบ primary object ไม่ได้แปลว่าหายจาก backup ทันที; Backup expiry ต้องใช้
rolling window ที่ Owner อนุมัติและมี manifest แยก

## 4. ส่วนที่ยังไม่อนุญาต/ยังไม่สร้าง

- Cloud scheduler, service identity, Admin SDK/Storage adapter และ external logs
- Pilot/Production Storage bucket, region, billing, key และ secret
- การเปิด `ENFORCE`, การลบ object จริง หรือการใช้ค่าจำลองเป็น approval

รายการเหล่านี้ทำได้หลัง PA-1/PA-2 ระบุ environment, destination/region,
Data Custodian, operator/approver, key custody, retention, RPO/RTO และค่าใช้จ่าย
ครบแล้วเท่านั้น

## 5. Acceptance criteria ก่อน Controlled Pilot

- ปิด/reload/PWA resume แล้วยังเห็น batch และ Retry ด้วย key เดิมได้
- logout ลบ Queue ของ actor ทุก Farm; TTL ไม่เกิน 7 วัน
- Retry จาก metadata โดยไม่มี binary ถูก block
- worker `DRY_RUN` แสดงรายการที่ควรลบโดยไม่ mutate; Cross-Farm input หยุดทันที
- `ENFORCE` ขาด approval/separation of duties แล้วต้อง fail closed
- ผ่าน Android/iPhone WP-03, WP-07–WP-11 และไม่พบ EXIF/GPS ใน object ที่อัปโหลด

Current decision: **LOCAL CORE READY; EXTERNAL ENFORCEMENT NOT APPROVED**
