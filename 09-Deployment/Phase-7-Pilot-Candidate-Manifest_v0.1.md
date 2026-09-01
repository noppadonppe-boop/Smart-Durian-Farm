# Phase 7 Pilot Candidate Manifest

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.7 |
| สถานะ | Historical Local Rehearsal Candidate — Current Source Drifted; Not Deployable |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | Phase 7 Plan v2.0, External PA-1 Owner Review Decision v1.2, Pilot Impact & Approval Pack v1.8, PA-1 Local Rehearsal Approval v1.1, PA-1 Local Rehearsal Report v1.1, Work Photo Resilience Validation v1.2, DEC-031, DEC-034, DEC-036, DEC-037, DEC-038 |

## 1. Candidate identity

| Field | Current value |
|---|---|
| Candidate ID | `KDOMS-PC-SIM-20260831-02` |
| Candidate state | `FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE` |
| Source revision/commit | Dirty worktree snapshot; Git HEAD reference `cbddbe0136a840684510677c45d70ec008d96927` |
| Source snapshot | 116 files; SHA-256 `308F57E49CC8F78922272546ED77F5D29FB2B91C74F96E789400718FD91F311D` |
| Current workspace snapshot | **ไม่ตรง local frozen snapshot เดิมตาม Owner Decision DEC-038; ไม่ได้ refreeze ในรอบนี้** |
| Build artifact | 53 files; SHA-256 `2316D11A9B34454E31625D82E177F19011C9F6273611E847F4C1F4CE1E23843C` |
| Dependency lock | SHA-256 `0798DC527D959C2D454E9C3C639950B1B51B3FCE77837FF35AB03CF6E3FD6DCB` |
| Mock Data Pack | Phase 6 `1.0.0`, `SIMULATED/TEST ONLY` |
| Environment target | Local browser + Firebase Emulator project `demo-smart-durian` |
| Deployment URL | None — deployment prohibited |
| Release owner | `DEPLOY-SIM-01` — mock role code only |
| Rollback method | ทิ้ง local build/state แล้ว reset deterministic Mock seed |

## 2. Current engineering baseline

- Current local readiness ผ่าน: unit/component 124/124 และ Emulator 45/45
- Work photo WebP/≤1,600px/≤5MB/EXIF-GPS policy และ Retry/Orphan ผ่าน local/emulator
- Durable Queue/replay ผ่าน local browser close/reload และ Firebase Emulator retry/commit;
  lifecycle `DRY_RUN` core ผ่าน 6/6 โดยไม่มี mutation
- HEIC decode และ physical reload บน Android/iPhone จริง รวมถึง external `ENFORCE`
  ยังรอ External PA-1/PA-2
- PWA build, offline runtime, security rules, accessibility และ performance budget ผ่าน;
  initial JavaScript 331,113/350,000 bytes
- high/critical dependency finding = 0; moderate dev-only findings carry forward
- Emulator health ผ่าน Auth 9099, Firestore 8080 และ Storage 9199
- Physical Device/Field/Camera/QR evidence ยัง `Deferred / Not Passed`
- Candidate `...-01` เป็น historical snapshot; `...-02` รวม Work list query remediation
  และผ่าน checksum/browser/full regression รอบใหม่

## 3. Freeze checklist

- [x] PA-1 Local/Emulator scope ได้รับ Owner approval ตาม DEC-037
- [x] Source ถูก freeze เป็น local snapshot hash; working tree ยังไม่ใช่ deployable revision
- [x] บันทึก Source drift หลัง local rehearsal แล้ว; Candidate เดิมคงเป็น historical evidence เท่านั้น
- [x] Current workspace ตรงกับ frozen Candidate `KDOMS-PC-SIM-20260831-02`
- [x] Candidate ID, source/build checksums และ dependency lock recorded
- [x] Full automated suite, Emulator/security suite, build และ dependency review ผ่าน
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

สถานะ: **HISTORICAL LOCAL REHEARSAL EVIDENCE — CURRENT SOURCE DRIFTED — NOT AUTHORIZED TO DEPLOY**
