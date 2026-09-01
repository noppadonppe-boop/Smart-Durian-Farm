# รายงาน PA-1 Local/Emulator Mock Rehearsal

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | **PASSED AFTER BROWSER REMEDIATION — Local/Emulator Only; Not Deployable** |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-08-31 |
| Candidate | `KDOMS-PC-SIM-20260831-02` |
| Run ID | `P7-PA1-LR-BROWSER-002` |
| Source of Truth | `AGENTS.md`, Decision Log, Phase 7 Plan, DEC-031, DEC-034, DEC-036, DEC-037, PA-1 Local Rehearsal Approval v1.1 |

## 1. ขอบเขตและข้อห้าม

ดำเนินการเฉพาะ local browser, deterministic Mock Data และ Firebase Emulator
ภายใต้ DEC-037 อนุญาต Candidate snapshot/build/test ในเครื่องเท่านั้น

ไม่ได้สร้าง external resource, billing, credential หรือ deployment และไม่ได้ใช้
ข้อมูล/ภาพ/หมายเลข/อุปกรณ์/พื้นที่/QR จริงหรือ Production

## 2. Candidate ที่ Freeze

| Field | Value |
|---|---|
| Candidate ID | `KDOMS-PC-SIM-20260831-02` |
| State | `FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE` |
| Supersedes | `KDOMS-PC-SIM-20260831-01` — historical local snapshot |
| Source files | 116 |
| Source snapshot SHA-256 | `308F57E49CC8F78922272546ED77F5D29FB2B91C74F96E789400718FD91F311D` |
| Lockfile SHA-256 | `0798DC527D959C2D454E9C3C639950B1B51B3FCE77837FF35AB03CF6E3FD6DCB` |
| Build files | 53 |
| Build artifact SHA-256 | `2316D11A9B34454E31625D82E177F19011C9F6273611E847F4C1F4CE1E23843C` |
| Git HEAD reference | `cbddbe0136a840684510677c45d70ec008d96927` |
| Source state | Dirty worktree snapshot; ไม่มี clean deployable commit |

Hash คำนวณจากรายการ `file SHA-256 + relative path` ที่เรียงลำดับ โดยไม่รวม
`node_modules`, `dist`, `.firebase-local` และ debug logs

## 3. Browser/IndexedDB Rehearsal

ใช้บัญชี Worker และ Work Order จำลอง `work_demo_group_00002` บน Firebase Emulator:

1. รับงานและเริ่มงาน แล้วแนบ PNG จำลองเป็น BEFORE/AFTER
2. ชี้ Storage ไป local loopback port ที่ไม่มี service เพื่อจำลอง upload interruption
3. แอปสร้าง IndexedDB batch 1 ชุด มี 2 รูปและ uploaded checkpoint = 0
4. Reload ระหว่าง upload แล้วเปิด Sync Center; batch เดิมยังอยู่ใน Work/Farm/User scope
5. คืน Storage Emulator ที่ `127.0.0.1:9199` บน origin เดิม แล้วกด Retry
6. Retry upload + Work re-link + report commit สำเร็จ และ Queue เหลือ 0 batch
7. Work Report แสดง BEFORE/AFTER เป็น WebP ≤1,600px/≤5MB และระบุ EXIF/GPS removed
8. หน้า Work list แสดง 5 งานของ Worker ใน Farm ปัจจุบัน; console warning/error = 0

ไฟล์ที่ใช้เป็น local UI screenshot จำลอง ไม่มีบุคคล สวน พิกัด EXIF/GPS หรือข้อมูลจริง

## 4. Defect และ Retest

| ID | ผลที่พบ | Remediation | Retest |
|---|---|---|---|
| `P7-PA1-LR-001` | Initial JavaScript เกิน 350,000 bytes | Lazy-load work photo processing | PASS — 331,113 bytes |
| `P7-PA1-LR-002` | หน้า Work list ใน Emulator ถูก Rules ปฏิเสธ เพราะ query พิสูจน์ `organizationId/farmId` ไม่ได้ | เพิ่ม equality constraints, matching indexes และ Emulator regression test | PASS — 5 งานใน Farm ปัจจุบัน; Cross-Farm deny ยังผ่าน |

## 5. Full Regression หลัง Remediation

| รายการ | ผล |
|---|---|
| ESLint / TypeScript strict | PASS |
| Unit/component | PASS — 124/124 ใน 17 files |
| Firebase Emulator/security/integration | PASS — 45/45 ใน 7 files |
| Build/PWA | PASS — 53 build files; precache 52 entries |
| Initial JavaScript | PASS — 331,113 / 350,000 bytes |
| Initial CSS | PASS — 41,012 / 60,000 bytes |
| Total offline runtime | PASS — 1,302,121 / 1,800,000 bytes |
| Offline runtime scan | PASS — 52 local files; external runtime = 0 |
| Browser durable queue close/reload/retry/commit/cleanup | PASS — local desktop browser/Firebase Emulator |
| Candidate snapshot/build validator | PASS |

Firebase CLI มีเพียง non-fatal warning ว่าอ่าน remote MOTD/config ไม่ได้ ไม่มี
external resource ถูกสร้างหรือเชื่อมต่อ

## 6. Lifecycle `DRY_RUN`

รัน `src/server/photoLifecycleWorker.test.ts` ผ่าน 6/6 โดยยืนยันว่า:

- Orphan ที่พ้น grace ได้ผล `WOULD_DELETE` ใน `DRY_RUN`
- `deleteObject` และ `appendAudit` ไม่ถูกเรียกใน `DRY_RUN`
- Work reference, retention cutoff และ Cross-Farm fail-closed ทำงาน
- `ENFORCE` ต้องมี PA-1/PA-2, Owner/Data Custodian approval และ operator/approver แยกกัน

หลักฐานนี้เป็น testable core เท่านั้น ยังไม่มี scheduler, service identity หรือ
external Storage adapter และไม่อนุญาต `ENFORCE`

## 7. HEIC และ Physical Device Boundary

Desktop file chooser ส่ง HEIC fixture เป็น MIME ว่าง จึงถูกปฏิเสธก่อน queue ตาม
fail-closed policy ผลนี้ไม่ยืนยัน HEIC decode ของ iPhone ต้องคง WP-03/WP-04/WP-09
บน Android/iPhone จริงเป็น `Not Executed / Not Passed` จนกว่า PA-1E/PA-2 จะอนุมัติ

## 8. ผลและขั้นตอนถัดไป

**PASS — PA-1 LOCAL/BROWSER/FIREBASE EMULATOR REHEARSAL**

Candidate นี้ใช้เป็นหลักฐาน local readiness ได้ แต่ยังเป็น dirty local snapshot และ
ห้าม Deploy External PA-1 ยังคง `NO-GO recommendation` เพราะ actual provider,
region, cost, owners, backup/key custody และ clean deployable revision ยังไม่ครบ
PA-2/PA-3, Physical Device/Field และ Production ยังคงไม่อนุมัติ

## 9. Acceptance Criteria

- [x] Candidate source/build/lock checksum ตรงและ validator ผ่าน
- [x] Full Local/Mock/Emulator regression ผ่านหลัง remediation
- [x] IndexedDB binary queue อยู่ข้าม Reload และ Retry/commit/cleanup สำเร็จ
- [x] Work/Farm/User scope และ Cross-Farm denial ไม่ถูกลดทอน
- [x] Lifecycle `DRY_RUN` ไม่มี mutation
- [x] ไม่มี external resource/deployment/real data/device ถูกใช้
- [x] HEIC/Android/iPhone ยังคง Deferred และไม่ถูกอ้างว่า Passed
