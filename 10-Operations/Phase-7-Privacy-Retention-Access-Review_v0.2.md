# Phase 7 Privacy, Retention & Access Review

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.3 |
| สถานะ | Recommended Pilot Baseline — Activation Pending PA-2; Real Data Not Approved |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | DEC-017, DEC-027, DEC-030, DEC-031, DEC-034, DEC-036, Development/Mock Data/Pilot Knowledge v1.0.3, Phase 7 Plan v1.5, Photo Data Governance Decision Sheet v1.0 |

## 1. ขอบเขตการมีผล

ค่าในเอกสารนี้เป็น baseline ที่แนะนำสำหรับ Controlled Pilot ขนาดจำกัด
ยังไม่มีผลกับข้อมูลจริงจนกว่า Owner จะอนุมัติ PA-2 พร้อมระบุ
Data/Privacy Custodian, วันเริ่มนับ และประเทศ/ข้อบังคับที่ใช้บังคับ

## 2. การเตรียมภาพก่อนอัปโหลด

- รับต้นฉบับ JPEG, PNG, WebP, HEIC หรือ HEIF ไม่เกิน 25 MB
- client re-encode ทั้งภาพเป็น WebP, ด้านยาวสุดไม่เกิน 1,600 px และ
  ขนาดหลังเตรียมไม่เกิน 5 MB
- การ re-encode สร้างไฟล์ใหม่จากเฉพาะพิกเซล จึงไม่ส่ง EXIF, GPS และ
  metadata ส่วนตัวของไฟล์ต้นฉบับ
- หากอุปกรณ์ถอดรหัส/re-encode WebP ไม่ได้ ให้ fail closed และห้าม
  อัปโหลดขึ้น Pilot Storage; fallback ที่ไม่ลบ metadata ใช้ได้เฉพาะ
  `SIMULATED/TEST ONLY`
- ห้ามถ่ายใบหน้า ป้ายทะเบียน เอกสารส่วนตัว และพื้นที่นอก scope โดย
  ไม่จำเป็น

## 2.1 Durable binary queue บนอุปกรณ์

- Queue อยู่ใน IndexedDB แยก Farm/actor และเก็บ source Blob เพื่อ resume หลัง
  ปิด/reload; source อาจยังมี EXIF/GPS แต่ห้ามออกจากอุปกรณ์ก่อน re-encode
- ลบ batch เมื่อ Work commit สำเร็จ, logout, reset หรือครบ TTL ไม่เกิน 7 วัน
- หาก IndexedDB/quota/checkpoint ล้มเหลว ให้ fail closed และสร้าง Orphan recovery
  สำหรับ object ที่อัปโหลดแล้ว; ห้ามถือว่า Work สำเร็จจาก metadata อย่างเดียว
- Device loss/revoke/Pilot close ต้อง clear/revoke ตาม runbook และบันทึก incident

## 3. Retention baseline ที่เสนอให้อนุมัติใน PA-2

| Data class | อายุเก็บรักษา | Trigger/การทำลาย |
|---|---|---|
| Work instruction/BEFORE/AFTER photo | ตลอด Pilot และ 90 วันหลัง Pilot close | ลบ primary object; หมดจาก backup ตาม rolling window |
| Selected Pilot evidence package | 180 วันหลังคำตัดสิน PA-3 | ลบ package/manifest หรือย้ายเป็น approved operational record |
| Work/audit/recovery metadata | 365 วันหลัง Pilot close | เก็บ disposal manifest ที่ไม่มี personal content |
| Encrypted backup | rolling 30 วัน | daily และ weekly rotation; ห้ามต่ออายุเงียบๆ |
| Ad-hoc export/download package | 7 วัน | ลบอัตโนมัติ เพิกถอน link/token และ audit |
| Device cache/temp file | ไม่เกิน 7 วัน | clear ทันทีเมื่อ logout, revoke, device loss หรือ Pilot close |

Orphan grace ก่อนลบจริงยัง `TBD` และต้อง Owner/Data Custodian กำหนดใน PA-2
ห้ามใช้ค่าจาก unit test หรือ Mockup เป็น policy จริง

Legal/business hold ต้องมี Owner + Data Custodian อนุมัติ, scope, เหตุผล,
วันสิ้นสุด และ audit ห้ามขยาย retention เงียบๆ

## 4. Backup และ Export rights

| การกระทำ | ผู้มีสิทธิ์ | เงื่อนไข |
|---|---|---|
| ดูรูปในแอป | ผู้ที่มี Farm membership และมีสิทธิ์เห็น Work Order นั้น | ห้าม public URL; ตรวจ Farm/Work ซ้ำ |
| Export ข้อมูลโครงสร้าง/audit | Owner, Farm Manager, Auditor | Farm-scoped allowlist + export audit; ไม่รวมไบนารีรูปโดยปริยาย |
| Bulk photo/evidence export | ปิดโดยค่าเริ่มต้น | Owner + Data Custodian อนุมัติสองชั้น, ระบุ Farm/Work/date/purpose/expiry และสร้าง manifest |
| Backup/restore | Backup operator + independent approver | encrypted destination, separate key custody, drill audit; ห้ามใช้บัญชีเดียวทำทุกขั้นตอน |

Worker, Agronomist, Viewer และ Sales/Inventory ไม่มีสิทธิ์ bulk export รูป และห้าม
คัดลอก Pilot evidence ไปยังบัญชี/พื้นทีส่วนตัว

## 5. Disposal evidence

การลบแต่ละรอบต้องมี Disposal ID, scope, object/record count, checksum ของ manifest,
ผู้สั่ง/ผู้ตรวจ, เวลา และผล primary/backup/cache/export โดยไม่เก็บรูปที่
ถูกลบไว้เป็นหลักฐานซ้ำ

การลบ Orphan/retention จริงต้องทำโดย server-side lifecycle worker ที่ตรวจ
Farm scope และ Work reference ซ้ำ ใช้ deterministic deletion ID และบันทึก
`PLANNED/DELETED/FAILED` audit Client cleanup เป็นเพียง request/status ไม่ใช่
หลักฐานว่า Storage object ถูกลบแล้ว Worker ต้องเริ่ม `DRY_RUN` และเปิด `ENFORCE`
เฉพาะเมื่อ PA-1/PA-2 และ Photo Data Governance Decision Sheet ครบ

## 6. คำตัดสินที่ยังต้องได้รับ

- Owner ต้องรับ/แก้ไขค่า 90/180/365/30/7 วันใน PA-2
- ระบุ Data Custodian, Backup operator/approver, destination/region/key custody
- ระบุ Lifecycle operator/approver, orphan grace และ scheduler/service identity
- ยืนยันว่ามีกฎหมาย/สัญญาใดบังคับให้เก็บนานกว่า baseline หรือไม่

Current decision: **HOLD FOR REAL DATA — Pending PA-2**
