# Phase 7 Pilot Candidate Manifest

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.9 |
| สถานะ | Local Candidate Frozen from Clean Commit — Not Deployable |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | Phase 7 Plan v2.2, External PA-1 Owner Review Decision v1.2, Pilot Impact & Approval Pack v2.0, Source Stabilization Inventory v1.1, Local Pilot Readiness Report v1.4, DEC-031, DEC-034, DEC-036, DEC-037, DEC-038, DEC-048, DEC-049 |

## 1. Candidate identity

| Field | Current value |
|---|---|
| Candidate ID | `KDOMS-PC-SIM-20260901-04` |
| Candidate state | `FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE` |
| Source revision/commit | Clean local source commit `483bb4109794ef220fe54aec0a766a7b84f0474a` |
| Source snapshot | 171 tracked web-app entries; SHA-256 `38191A7C68CC9B5D9E659A85E9CAC5D8F5CA940966AF45D0C53D03766A6F57EA` |
| Current workspace snapshot | Application source ตรงกับ Candidate; repository HEAD หลัง freeze อาจต่างเฉพาะ evidence/document commit ที่ไม่เปลี่ยน web-app source |
| Build artifact | 83 files; SHA-256 `B721DD90634F4A54B0BA678BE454664D98101E48E74B4CA45EF83F357545FD5D` |
| Dependency lock | SHA-256 `399735448A585711372FD5EB3C620B1BF141C10833081C6A296E3606B86C7DF6` |
| Mock Data Pack | Phase 6 `1.0.0`, `SIMULATED/TEST ONLY` |
| Environment target | Local browser + Firebase Emulator project `demo-smart-durian` |
| Deployment URL | None — deployment prohibited |
| Release owner | `DEPLOY-SIM-01` — mock role code only |
| Rollback method | ทิ้ง local build/state แล้ว reset deterministic Mock seed |

วิธีคำนวณ hash:

- Source snapshot: เรียงผล `git ls-tree -r --full-tree` ของ
  `07-Source-Code/web-app` ที่ source commit ตาม path, ต่อด้วย LF แล้วคำนวณ SHA-256
- Build artifact: คำนวณ SHA-256 รายไฟล์ใน `dist`, เรียง
  `FILE_SHA256<TAB>relative/path`, ต่อด้วย LF แล้วคำนวณ SHA-256 รวม
- Dependency lock: SHA-256 ของ `07-Source-Code/web-app/pnpm-lock.yaml` โดยตรง

## 2. Current engineering baseline

- Full Validation จาก clean source commit ผ่าน: unit/component 229/229 ใน 29 files,
  Emulator/security 67/67 ใน 9 files และ deterministic seed 148 records ใน 7 modules
- Work photo WebP/≤1,600px/≤5MB/EXIF-GPS policy และ Retry/Orphan ผ่าน local/emulator
- Durable Queue/replay ผ่าน local browser close/reload และ Firebase Emulator retry/commit;
  lifecycle `DRY_RUN` core ผ่าน 6/6 โดยไม่มี mutation
- HEIC decode และ physical reload บน Android/iPhone จริง รวมถึง external `ENFORCE`
  ยังรอ External PA-1/PA-2
- PWA build, offline runtime, security rules, accessibility และ performance budget ผ่าน;
  initial JavaScript 348,801/350,000, initial CSS 56,239/60,000 และ total offline
  runtime 1,718,980/1,800,000 bytes; precache 82 entries
- high/critical dependency finding = 0; moderate dev-only findings carry forward
- Emulator health ผ่าน Auth 9099, Firestore 8080 และ Storage 9199
- Physical Device/Field/Camera/QR evidence ยัง `Deferred / Not Passed`
- Candidate `...-01`, `...-02` และ `...-03` เป็น historical snapshot; `...-04`
  supersede เฉพาะ Local Rehearsal หลังรวม DEC-048/049 และ clean freeze
- Browser recheck ผ่านที่ 320px, Android 360×800 และ iPhone 390×844;
  ไม่มี horizontal overflow, Dark/Light token ทำงาน, touch target ≥44px และ
  Offline status ทำงานโดย console error = 0

## 3. Freeze checklist

- [x] PA-1 Local/Emulator scope ได้รับ Owner approval ตาม DEC-037
- [x] Source ถูก freeze จาก clean local commit และตรวจ snapshot hash ย้อนกลับได้
- [x] Source drift เดิมถูกแก้ด้วย Candidate ใหม่; Candidate เดิมคงเป็น historical evidence เท่านั้น
- [x] Current application source ตรงกับ frozen Candidate `KDOMS-PC-SIM-20260901-04`
- [x] Candidate ID, source/build checksums และ dependency lock recorded
- [x] Full automated suite, deterministic seed, Emulator/security, build/PWA,
  performance, offline scan และ `git diff --check` ผ่านจาก clean commit
- [x] Candidate มี `SIMULATED/TEST ONLY` banner/default dataset
- [x] Environment config ใช้ Emulator defaults และไม่มี Production project/domain/SMS/credential
- [x] Local reset/rollback method ระบุครบ
- [x] Local/Emulator Cross-Farm negative suite ผ่าน
- [ ] External environment/resource/cost/owner mapping และ deployable revision อนุมัติ

## 4. Promotion rules

1. Working build ห้าม deploy โดยไม่มี frozen Candidate ID
2. Candidate ใหม่ทุกครั้งต้องมี changelog และรัน regression ใหม่
3. Pilot Candidate ไม่ถูก promote เป็น Production โดยตรง
4. ข้อมูล Pilot จริงห้าม migrate อัตโนมัติ ต้องมี data disposition/migration approval
5. การ deploy สำเร็จไม่เท่ากับ Physical/Field Validation ผ่าน

สถานะ: **FROZEN LOCAL REHEARSAL EVIDENCE — SOURCE STABILIZED — NOT AUTHORIZED TO DEPLOY;
EXTERNAL PA-1 REMAINS NO-GO/BLOCKED**
