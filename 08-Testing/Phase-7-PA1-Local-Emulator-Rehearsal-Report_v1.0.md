# รายงาน PA-1 Local/Emulator Mock Rehearsal

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | **PASSED AFTER REMEDIATION — Local/Emulator Only; Not Deployable** |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-08-31 |
| Candidate | `KDOMS-PC-SIM-20260831-01` |
| Source of Truth | `AGENTS.md` v3.1, Decision Log v3.0, Phase 7 Plan v1.6, DEC-031, DEC-034, DEC-036, DEC-037, PA-1 Local Rehearsal Approval v1.0 |

## 1. ขอบเขตที่ได้รับอนุมัติ

Owner อนุมัติ PA-1 เฉพาะ local/browser/Firebase Emulator rehearsal ด้วย
deterministic Mock Data อนุญาต local Candidate snapshot, build และ test เท่านั้น

ไม่อนุญาต external resource, billing, credential, deployment, real data/device,
field execution, QR encode/print หรือ Production

## 2. Candidate ที่ตรวจ

| Field | Value |
|---|---|
| Candidate ID | `KDOMS-PC-SIM-20260831-01` |
| State | `FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE` |
| Source files | 116 |
| Source snapshot SHA-256 | `80CAA78FEE2BCF71836DDF8C0A3AB0ADFF1371A6043302B7281AD68F54C34F6E` |
| Lockfile SHA-256 | `0798DC527D959C2D454E9C3C639950B1B51B3FCE77837FF35AB03CF6E3FD6DCB` |
| Build files | 53 |
| Build artifact SHA-256 | `16B98BC7B433815831ED1271BFE8DB522CF9407056D08D5179F5CC381EC3DBE9` |
| Git HEAD reference | `cbddbe0136a840684510677c45d70ec008d96927` |
| Source state | Dirty worktree snapshot; ไม่มี commit/freeze branch |

Source hash ใช้ SHA-256 ของรายการ `file SHA-256 + relative path` ที่เรียงลำดับ
โดยไม่รวม `node_modules`, `dist`, `.firebase-local` และ debug logs หาก source file
เปลี่ยน Candidate นี้จะไม่ผ่าน validator และต้องออก Candidate/retest ใหม่

## 3. Defect และการแก้ไข

| ID | รอบ | ผล | การดำเนินการ |
|---|---|---|---|
| `P7-PA1-LR-001` | Initial rehearsal | Initial JavaScript `356,881 / 350,000` bytes — FAIL; Emulator ยังไม่เริ่ม | หยุดรอบทดสอบตาม performance gate |
| `P7-PA1-LR-001-R1` | Remediation | แยก `workPhotoProcessing` เป็น lazy-loaded chunk | ลด initial JavaScript เหลือ `331,113` bytes |
| `P7-PA1-LR-001-R2` | Full rerun | PASS | รัน full suite ใหม่หลัง source ล่าสุดนิ่ง |

การเปลี่ยนแปลงอยู่ที่
`07-Source-Code/web-app/src/app/Phase2Context.tsx` และไม่เปลี่ยน business rule,
photo policy, Farm scope หรือ API contract

## 4. ผล Full Rehearsal

| รายการ | ผล |
|---|---|
| ESLint | PASS — 0 warning/error |
| TypeScript strict | PASS |
| Unit/component | PASS — 124/124 ใน 17 files |
| Build/PWA | PASS — 53 build files; precache 52 entries |
| Initial JavaScript | PASS — 331,113 / 350,000 bytes |
| Initial CSS | PASS — 41,012 / 60,000 bytes |
| Total offline runtime | PASS — 1,302,043 / 1,800,000 bytes |
| Offline runtime scan | PASS — 52 local files; external runtime = 0 |
| Firebase Emulator/security/integration | PASS — 44/44 ใน 7 files |
| Cross-Farm/security rules | PASS ภายใน Emulator suite |
| Candidate snapshot/build validator | PASS |

Firebase CLI พยายามอ่าน MOTD/remote config แต่เครือข่ายไม่พร้อมและรายงานเป็น
non-fatal warning เท่านั้น Emulator ใช้ project `demo-smart-durian`; ไม่มี resource
ภายนอกถูกสร้างหรือเชื่อมต่อ

## 5. Approval Boundary หลังทดสอบ

- PA-1 Local/Emulator rehearsal: **APPROVED และ PASSED**
- External PA-1 environment/resource/deployment: **NOT APPROVED**
- PA-2 real device/data/field execution: **NOT APPROVED**
- PA-3 Production/Go-Live: **NOT APPROVED**
- Physical Device/Field evidence: **Deferred / Not Passed**
- Lifecycle worker: Local `DRY_RUN` เท่านั้น; External `ENFORCE` ยังห้ามใช้

## 6. Recommendation

**PASS PA-1 LOCAL/EMULATOR REHEARSAL**

Candidate นี้ใช้เป็นหลักฐาน local readiness ได้ แต่ไม่สามารถ Deploy ได้ ขั้นตอนถัดไป
หากต้องการ Private Pilot Candidate คือ Owner ต้องกรอก provider/project/region,
budget, URL, deploy/rollback owners, backup/key custody และ frozen deployable
revision แล้วอนุมัติ **External PA-1** แยกต่างหาก

## 7. Acceptance Criteria

- [x] Owner approval scope ถูกบันทึกเป็น DEC-037
- [x] Candidate source/build มี checksum และตรวจซ้ำได้
- [x] Full Local/Mock/Emulator suite ผ่านหลัง remediation
- [x] Performance, PWA และ offline budget ผ่าน
- [x] ไม่มี external resource/deployment/real data/device ถูกใช้
- [x] PA-2/PA-3 และ Production ยังคงปิด
