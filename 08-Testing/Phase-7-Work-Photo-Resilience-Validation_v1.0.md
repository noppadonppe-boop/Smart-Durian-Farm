# Phase 7 Work Photo Resilience Validation

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.2 |
| สถานะ | PASSED — Local/Mock/Firebase Emulator Only; Physical Device Not Executed |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-08-31 |
| Source of Truth | AGENTS.md, Development/Mock Data/Pilot Knowledge v1.0.4, DEC-030, DEC-034, DEC-036, DEC-037, PA-1 Local Rehearsal Report v1.1, Work Photo Device Protocol v1.1, Photo Lifecycle Architecture v1.0 |

## 1. ผลที่ยืนยันแล้ว

- Work Create และ Worker Report เรียกการเตรียมภาพก่อนอัปโหลด
- รับ JPEG/PNG/WebP/HEIC/HEIF ≤25MB; re-encode WebP ด้านยาว ≤1,600px และ ≤5MB
- Firebase adapter ยอมรับเฉพาะ `CANVAS_REENCODED` ที่ระบุ `metadataStripped=true`;
  Storage Rules ปฏิเสธ raw PNG/JPEG ที่ข้ามขั้นตอน
- Mock fallback ติดป้าย `SIMULATED/TEST ONLY` และไม่ถูกนับเป็น metadata/device evidence
- อัปโหลด retry ไม่เกิน 3 ครั้งด้วย Photo ID/path เดิม
- หมด retry สร้าง `FAILED/PARTIAL_ONCE`; object ที่ขึ้แล้วแต่ผูก Work ไม่สำเร็จ
  สร้าง `ORPHANED/ORPHANED_OBJECT` และ `PHOTO_RECOVERY_REGISTERED` audit
- recovery create ตรวจ actor, Farm, Work, phase, path, status/failure mode และ idempotency;
  Cross-Farm ถูกปฏิเสธ
- Work Create/Report บันทึก source binary + commit draft ใน Farm/actor-scoped Queue
  ก่อน upload, checkpoint object ที่ขึ้นแล้ว และลบ batch หลัง commit สำเร็จ
- Sync Center Retry จาก binary ด้วย Photo ID/path/idempotency key เดิม; recovery
  metadata ที่ไม่มี binary ถูก block ไม่ให้เปลี่ยนเป็น UPLOADED จาก UI
- Browser implementation ใช้ IndexedDB อายุไม่เกิน 7 วัน; test environment ที่
  ไม่มี IndexedDB ใช้ Memory adapter โดยไม่อ้างเป็น physical reload evidence
- Local desktop browser + Firebase Emulator ผ่าน interruption → Reload → พบ batch
  2 รูป → Retry upload/re-link/commit → Queue cleanup โดยใช้ origin และ scope เดิม
- Lifecycle worker core ตรวจ Cross-Farm/path/reference, orphan grace/retention,
  Dry-run, approval chain, operator/approver separation และ disposal audit
- HEIC decoder failure เป็น fail closed พร้อม Most Compatible/JPEG หรือ approved
  on-device conversion guidance; ไม่ upload ต้นฉบับที่มี EXIF/GPS

## 2. ผล `pnpm validate`

| รายการ | ผล |
|---|---|
| ESLint / TypeScript strict | ผ่าน |
| Unit/component | 124/124 ผ่านใน 17 test files |
| Firebase Emulator/security/integration | 45/45 ผ่านใน 7 test files |
| Build/PWA | ผ่าน; precache 52 entries |
| Performance budget | JS 331,113/350,000; CSS 41,012/60,000; offline 1,302,121/1,800,000 bytes |
| Offline runtime scan | ผ่าน 52 local build files; ไม่พึ่ง external runtime CDN |
| `git diff --check` | ผ่าน; มีเฉพาะคำเตือน line-ending ของ Windows |

Firebase CLI ไม่สามารถดึง remote MOTD/config เพราะ network ถูกจำกัด แต่ไม่
กระทบ local Emulator และทุก service ปิดตามปกติ

## 3. ข้อจำกัดและงานที่ยังเปิด

- ยังไม่ได้ทดสอบ HEIC decode, EXIF orientation, กล้อง/permission, background/resume,
  network transition และอัปโหลดในสวนบน Android/iPhone จริง
- IndexedDB close/reload/retry ผ่านบน local desktop browser แล้ว แต่ quota,
  background/PWA resume และ Android/iPhone จริงยังไม่ทดสอบ; local browser evidence
  ไม่ใช่ Physical Device evidence
- lifecycle worker มีเฉพาะ testable core; scheduler, service identity, Storage adapter,
  approved cutoff และ `ENFORCE` ยังต้องอนุมัติ/สร้างหลัง PA-1/PA-2
- ค่า retention 90/180/365/30/7 วัน, RPO 24h และ RTO 8h เป็นข้อเสนอรอ Owner PA-1/PA-2
- Data Custodian, Backup/Lifecycle operator/approver, destination, region, key custody
  และ orphan grace ยัง `TBD`

## 4. Gate impact

การตรวจนี้ผ่านเฉพาะ Engineering/local/emulator ไม่เปลี่ยน Physical Device Gate
และไม่อนุมัติ Deploy, real data/photo, external storage หรือลงพื้นที่
