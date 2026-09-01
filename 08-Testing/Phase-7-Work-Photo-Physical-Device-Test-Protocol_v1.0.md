# Phase 7 Work Photo Physical Device Test Protocol

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | READY — EXECUTION HOLD PENDING PA-1/PA-2 |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Physical Device Validation Gate v1.2, Phase 7 Runbook v1.3, Privacy Review v0.3, Photo Lifecycle Architecture v1.0, DEC-027, DEC-030, DEC-034, DEC-036 |

## 1. ขอบเขตและข้อห้าม

ทดสอบบน Android จริงอย่างน้อย 1 เครื่อง และ iPhone จริงอย่างน้อย 1 เครื่อง
ระหว่าง Controlled Pilot เท่านั้น ต้องมี PA-1, PA-2, Candidate ID, approved accounts,
evidence storage และ Field Lead GO ก่อนเริ่ม เอกสารนี้ไม่ใช่การอนุญาตให้ Deploy,
ใช้รูปจริง หรือลงพื้นที่

## 2. Device/run metadata บังคับ

Run ID, Candidate ID/source revision, PA-1/PA-2 reference, device code, model,
OS/version, browser/PWA/version, camera format setting, captured MIME/extension,
native HEIC decode result, camera permission state, network profile,
Farm/Work/Photo opaque IDs, tester/observer codes, started/ended time, expected,
actual, result, Evidence ID, Issue ID และ retest-of

ห้ามเก็บชื่อจริง เบอร์โทร OTP/secret, precise GPS หรือภาพที่เกินจาก
approved Farm/Work scope ใน CSV/repository

## 3. Scenario matrix — ทำครบทั้ง Android และ iPhone

| ID | ทดสอบ | ผลที่ต้องได้ |
|---|---|---|
| WP-01 | allow camera permission, capture แนวตั้ง/แนวนอน | preview ทิศทางถูก; ไม่ค้างไฟล์ต้นฉบับ |
| WP-02 | deny permission → เปิดใน Settings → retry | แจ้งชัด, ไม่สร้างรายงานครึ่งๆ, กลับมาถ่ายได้ |
| WP-03 | JPEG/HEIC จาก iPhone รุ่นจริงและภาพใหญ่ | บันทึก native decode result; output WebP, ด้านยาว ≤1,600px, ≤5MB; ถอดรหัสไม่ได้ = fail closed และใช้ approved fallback |
| WP-04 | ตรวจ metadata ของ object หลัง upload | ไม่มี EXIF/GPS/device/author; มีเฉพาะ approved app metadata |
| WP-05 | ผู้สร้างแนบ instruction 0–3 รูปก่อน Assign | เกิน 3 ถูก block; Worker เห็นเฉพาะ Work ที่ได้รับ |
| WP-06 | Worker แนบ BEFORE+AFTER และ Submit | ขาด phase ใด phase หนึ่งถูก block; ผูกรูป/รายงาน/audit ครบ |
| WP-07 | ตัด network ก่อหรือระหว่าง upload | retry ไม่เกิน 3 ครั้งด้วย Photo ID/path เดิม; ล้มเหลวแล้วเข้า Photo Retry |
| WP-08 | object อัปโหลดแล้วแต่ตัด network ก่อผูก report | สร้าง ORPHANED อัตโนมัติ; Owner/Manager cleanup พร้อม audit |
| WP-09 | background/lock/ปิด tab/reload/PWA resume ระหว่างเตรียม/upload | IndexedDB batch ยังอยู่, Retry ด้วย key เดิม, ไม่ duplicate/ข้าม Work/Farm |
| WP-10 | wrong-Farm/unauthorized URL/read/export | block 100%; ไม่เปิดเผย Farm/Work/Photo อื่น; ไม่มี public link |
| WP-11 | commit สำเร็จ, logout, TTL/quota/checkpoint failure | commit/logout ล้าง Queue; TTL ≤7 วัน; quota fail closed; uploaded-without-checkpoint เข้า Orphan |

## 3.1 HEIC fallback ที่อนุญาตให้ทดสอบ

1. ลอง native HEIC/HEIF decode และ client re-encode เป็น WebP ก่อน พร้อมบันทึก
   device/OS/browser/PWA และ MIME จริง
2. หากไม่ได้ ให้ตั้ง iPhone `Settings → Camera → Formats → Most Compatible`
   แล้วถ่ายใหม่เป็น JPEG; ห้ามนำภาพคนละเหตุการณ์มาแทนหลักฐานเดิม
3. หากจำเป็นต้องใช้ on-device converter ต้องได้รับ PA-2 ระบุเครื่องมือ/เวอร์ชัน,
   ทำงาน offline/local, ไม่ส่ง cloud, re-encode ใหม่ และผ่าน EXIF/GPS=0
4. หากทั้งข้อ 1–3 ไม่ผ่าน ให้ block upload, เปิด Issue และหยุด scenario นั้น

ห้าม fallback ด้วยการ upload HEIC/HEIF ต้นฉบับ, เปลี่ยน extension อย่างเดียว หรือ
ใช้ public/cloud converter ที่ไม่ได้อนุมัติ

## 4. EXIF/GPS verification

1. บนเครื่องทดสอบ เปิด location tagging ของกล้องเฉพาะภายใต้ PA-2
2. ถ่ายภาพทดสอบที่ไม่มีบุคคล/ป้าย/เอกสาร แล้ว upload ผ่าน Candidate
3. ดาวน์โหลดเฉพาะ object ที่เตรียมแล้วด้วย evidence account และตรวจด้วย
   เครื่องมือ offline metadata inspector ที่อนุมัติ
4. เก็บเฉพาะผล `EXIF fields=0`, `GPS fields=0`, MIME, bytes, width/height,
   checksum และ Evidence ID; ห้าม commit ไฟล์ภาพจริง

## 5. Pass/stop criteria

ผ่านเมื่อ Android และ iPhone ครบ WP-01–WP-11, EXIF/GPS = 0, ไม่มี duplicate,
ไม่มี Cross-Farm disclosure, Retry/Orphan/audit reconcile ได้ และ blocker เป็นศูนย์

หยุดทันทีเมื่อพบ metadata/GPS หลุด, Cross-Farm allow, wrong-work photo,
duplicate critical event, object หายโดยไม่มี recovery record หรือมีรูปจริงเข้า repository

Current result: **NOT EXECUTED / NOT PASSED — Waiting for Controlled Pilot**
