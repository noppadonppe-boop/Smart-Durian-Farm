# Owner Review Decision — Phase 7 External PA-1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.2 |
| สถานะ | **OWNER DECISION — NO-GO; EXTERNAL PA-1 BLOCKED** |
| เจ้าของเอกสาร | Project Owner |
| วันที่ Owner ตัดสินใจ | 2026-09-01 |
| Review ID | `KDOMS-PA1E-OWNER-REVIEW-20260901-01` |
| ขอบเขต | Private Non-Production Pilot Candidate ด้วย Mock/Synthetic Data เท่านั้น |
| Machine-readable record | `09-Deployment/phase7-external-pa1-owner-decision-v1.0.json` |
| Source of Truth | Owner exact decision 2026-09-01, `AGENTS.md` v3.3, Phase 7 Plan v2.0, Pilot Impact & Approval Pack v1.8, PA-1 Owner Actual Input Form v1.4, Pilot Candidate Manifest v0.7, PA-1 Local Rehearsal Report v1.1, Pilot Readiness Checklist v1.9, Photo Data Governance Decision Sheet v1.1, Work Photo Durable Queue/Lifecycle Architecture v1.0, Decision Log v3.2, DEC-038 |

## 1. External PA-1 Readiness Decision

### Owner Decision: **NO-GO**

ยังไม่อนุมัติ External PA-1 เนื่องจาก Owner actual values ที่เป็นข้อกำหนดพื้นฐาน
ยังไม่มี Candidate `KDOMS-PC-SIM-20260831-02` เป็นหลักฐาน Local rehearsal
historical เท่านั้น และ Source ปัจจุบันไม่ตรงกับ local frozen snapshot เดิม
นอกจากนี้ยังไม่มี clean frozen deployable Candidate/commit จึงใช้พิจารณา
External GO ไม่ได้

ไม่ใช้ `CONDITIONAL GO` ในรอบนี้ เพราะสิ่งที่ขาด ได้แก่ provider/project, billing
authority, accountable owners, data location, backup/key custody และ clean deployable
commit เป็น prerequisite ก่อนสร้าง resource หรือ Deploy ไม่ใช่เงื่อนไขที่ควรปล่อย
ให้ปิดภายหลัง deployment

มตินี้เป็นคำตัดสินทางการของ Project Owner และบันทึกเป็น `DEC-038 = Blocked`
โดยไม่เปลี่ยน DEC-037 ซึ่งอนุมัติเฉพาะ Local/Emulator rehearsal

### การจำแนกข้อมูลสำหรับ Owner Review

| ประเภท | รายการ |
|---|---|
| ข้อยืนยัน | Gate 6 ผ่าน; PA-1 Local/Browser/Emulator ผ่านตาม DEC-037; Source ปัจจุบันไม่ตรง local frozen snapshot เดิม; External PA-1/PA-2/PA-3 ยังไม่อนุมัติ |
| คำสั่ง Owner | คง External Action ทั้งหมดไว้ที่ HOLD และใช้ Mock/Synthetic Data เท่านั้นจนกว่าค่าจริงและ clean frozen deployable Candidate จะครบ |
| ข้อสันนิษฐาน | ไม่มีการยกระดับค่า `SIM-*`, `.example.invalid` หรือ 0 THB ให้เป็นค่าจริง และไม่มีการอนุมาน owner/resource จากข้อมูลจำลอง |
| คำถามที่ต้องตัดสินใจรอบถัดไป | Owner actual values, governance และ clean Candidate ครบหรือไม่ก่อนจัดทำ External PA-1 Owner Review ฉบับใหม่ |

## 2. หลักฐานที่ใช้ประเมิน

| ประเด็น | หลักฐาน | ผล |
|---|---|---|
| Gate 6 | ผ่านตาม DEC-031 | พร้อมสำหรับ Phase 7 planning/readiness |
| PA-1 Local/Emulator | 124/124 local tests, 45/45 Emulator tests และ browser reload/retry ผ่านตาม DEC-037 | `PASS` เฉพาะ Local/Emulator |
| Owner actual form | ทุกค่าเป็น `SIM-*`, 0 THB หรือ `.example.invalid` | ใช้อนุมัติ External PA-1 ไม่ได้ |
| External resources/cost | ทุก resource ใน Impact Pack ยัง `NOT APPROVED`/`TBD` | Blocker |
| Photo governance | owners, destination, region, key custody, retention/RPO/RTO ยัง `TBD` | Blocker |
| Candidate | `KDOMS-PC-SIM-20260831-02` เป็น local rehearsal evidence; Source ปัจจุบันไม่ตรง frozen snapshot เดิม และไม่มี clean deployable commit | Blocker |
| Lifecycle worker | Local core พร้อม; external scheduler/storage adapter ยัง HOLD | `DRY_RUN` only; ห้าม `ENFORCE` |
| PA-2/Physical/Field | Deferred / Not Passed | ไม่อยู่ใน External PA-1 และยังห้ามเริ่ม |

### Local Candidate integrity observation

- Candidate `KDOMS-PC-SIM-20260831-02`: historical local rehearsal snapshot,
  116 files / SHA-256
  `308F57E49CC8F78922272546ED77F5D29FB2B91C74F96E789400718FD91F311D`
- Owner ยืนยันว่า Current source ไม่ตรงกับ local frozen snapshot เดิม; รอบนี้ไม่
  refreeze หรือออก deployable Candidate ใหม่
- Candidate `...-01` คงเป็น historical evidence และถูก supersede หลัง Work list
  Rules remediation
- การตรง checksum ไม่เปลี่ยน dirty local snapshot ให้เป็น clean deployable revision

## 3. Owner Actual Values ที่ยังขาด

ค่า Mock Substitute ห้ามใช้ปิดรายการต่อไปนี้:

| # | Owner actual value ที่ต้องมี | สถานะปัจจุบัน | เกณฑ์ก่อน GO |
|---:|---|---|---|
| 1 | Provider และ Non-Production Pilot project ID/name | มีเพียง `PROVIDER-SIM-01 / KDOMS-PILOT-SIM-001` | ระบุ provider/service plan และ project reference ที่ใช้งานจริงโดยไม่ใส่ credential |
| 2 | Primary region และ data location | `SIM-REGION-01` | ระบุ region จริง พร้อมผล privacy/legal/latency/cost review |
| 3 | Billing permission, monthly cost ceiling และ usage reviewer | `DISABLED`, 0 THB Mock | ระบุ Yes/No, วงเงินจริง, alert/stop threshold และ accountable reviewer code |
| 4 | Deployment, rollback และ incident owner codes | มีเฉพาะ `*-SIM-*` | ระบุรหัสจริงที่ map นอก repository และ separation of duties |
| 5 | Private URL, visibility และ allowlist/access policy | `.example.invalid`/simulation | ระบุ URL จริง, private control, allowlist owner, revoke/expiry procedure |
| 6 | Pilot authentication mode | Emulator references only | เลือก test-only non-personal accounts โดยไม่มี SMS/เบอร์จริง และกำหนด revoke/expiry |
| 7 | Monitoring/alert channel และ retention | `SIM-ALERT-CHANNEL-01`/30 วันจำลอง | ระบุ channel owner, severity routing, masked logging และ retention จริง |
| 8 | Backup destination/region/operator/independent approver/key custodian | ทั้งหมด `TBD`/Mock | ระบุ target และรหัสผู้รับผิดชอบจริง; ห้ามเก็บ key/secret ใน repository |
| 9 | RPO, RTO และ backup retention | 24h/8h/30d เป็น baseline จำลอง | Owner ต้อง Accept/Change พร้อมเหตุผลและ cost impact |
| 10 | Lifecycle scheduler/runtime/service identity | `TBD`; local core เท่านั้น | ระบุ least-privilege identity และอนุญาตเฉพาะ `DRY_RUN`; `ENFORCE` รอ PA-2 |
| 11 | Frozen deployable Candidate ID และ clean Git commit/hash | Local Candidate `...-02` checksum ตรง แต่ยังเป็น dirty/non-deployable snapshot | ออก External Candidate ใหม่จาก clean commit, บันทึก source/build/lock hashes และ rerun full validation |
| 12 | Target-specific smoke, rollback และ stop-control owners | มีเพียง generic plan | ระบุคำสั่ง/ผู้ดำเนินการ/หลักฐานสำหรับ target จริงก่อน deploy |

## 4. External Resources และค่าใช้จ่ายที่ต้องอนุมัติ

ยังไม่อนุญาตให้สร้างรายการใดในตารางนี้จนกว่า Owner จะกรอกค่าจริงและส่งมติ GO:

| Resource/action | Approval ที่ต้องระบุ | Cost control |
|---|---|---|
| Private Non-Production project | provider, project ID, region, project owner | แยก Production และห้าม public default |
| Hosting/private URL | visibility, allowlist, cache/revoke owner | รวม hosting/egress ใน monthly ceiling |
| Authentication | test-only account mode; no real SMS/phone | ห้ามเปิด SMS billing ใน PA-1 |
| Database/Storage | Mock/Synthetic only, Farm-scoped rules | quota/alert และ deny public access |
| Functions/runtime | เฉพาะสิ่งจำเป็นสำหรับ Mock Pilot | จำกัด region/runtime/quota |
| Lifecycle scheduler/service identity | `DRY_RUN` only | ห้าม mutation/deletion และกำหนด invocation cap |
| Logging/monitoring/alerts | channel, redaction, retention | รวม ingestion/retention ใน ceiling |
| Backup destination | provider/region/operator/approver/key custody | รวม storage/restore/egress ใน ceiling |
| Deployment identity | least privilege; secret อยู่นอก repository | กำหนด revoke/rotation owner |

ยอดค่าใช้จ่ายยังประเมินเป็นตัวเลขไม่ได้จนกว่า Provider/service plan/region/usage
assumption จะถูกเลือก ห้ามตีความ 0 THB จาก Mockup ว่าเป็นวงเงินจริงหรืออนุมัติ billing

## 5. Controls ที่ต้องผ่านก่อน External PA-1 GO

### Security และ Access

- Private-by-default; public/anonymous access ต้องถูก deny
- แยก Non-Production project, data และ deploy identity จาก Production
- ใช้ Mock/Synthetic Data และ test-only non-personal accounts เท่านั้น
- Firestore/Storage/Auth access ใช้ least privilege และ Farm-scoped deny-by-default
- Post-deploy Cross-Farm read/write denial ต้องผ่าน; allow สำเร็จ 1 ครั้งเป็น Critical stop
- Secret, credential, service-account key และ token อยู่ใน approved secret store
  เท่านั้นและห้าม commit/log

### Privacy และ Data

- ห้ามข้อมูล/รูป/เบอร์/SMS/ผู้เข้าร่วม/สวน/topology จริง
- ห้าม Test QR จริง ป้ายจริง หรือ Physical Device/Field execution
- Log ต้อง mask identifier และห้ามเก็บ OTP/secret/personal data
- การ Deploy สำเร็จไม่ใช่ Physical/Field evidence และไม่ทำให้ PA-2 ผ่าน

### Backup และ Restore

- ระบุ destination/region, encryption/key custody, operator และ independent approver
- บันทึก backup manifest/checksum และทำ restore rehearsal ด้วย Mock Data
- Restore ต้องรักษา Organization/Farm scope และ audit reconciliation
- RPO/RTO/retention ที่ใช้ต้องเป็น Owner actual decision ไม่ใช่ Mock baseline

### Monitoring และ Incident

- กำหนด alert channel, severity, acknowledgement owner และ retention
- Alert ขั้นต่ำ: public access/config drift, auth/rules denial anomaly, Cross-Farm,
  error spike, storage/quota/billing threshold และ backup failure
- Stop/contain procedure ต้อง disable access/deployment ได้โดยไม่พึ่ง Production

### Lifecycle และ Work Photo

- Scheduler/service identity ใช้ least privilege และเริ่มเฉพาะ `DRY_RUN`
- `DRY_RUN` ต้องไม่ delete/mutate object และต้องสร้าง reviewable manifest/audit
- `ENFORCE`, real-photo retention, orphan deletion และ disposal รอ PA-2
- Mock photo เท่านั้น; WebP/size/EXIF-GPS policy ยังคงบังคับใน workflow

### Deployment, Rollback และ Stop Conditions

- Smoke test ต้องผ่าน private access, test auth, Mock seed/reset, PWA/offline,
  Firestore/Storage rules, Cross-Farm denial, monitoring และ backup access
- Rollback ต้อง pin previous artifact/config, ระบุ owner และทดสอบ restore/disable route
- หยุดทันทีเมื่อพบ public exposure, Cross-Farm disclosure, wrong project/region,
  secret leak, real data, duplicate critical event, rollback failure, lifecycle mutation
  หรือ usage เกิน threshold ที่ Owner กำหนด

## 6. Frozen Deployable Candidate Requirements

Current Candidate `KDOMS-PC-SIM-20260831-02` ผ่าน local integrity validator แต่ยัง
ใช้ Deploy ไม่ได้เพราะเป็น dirty local-only snapshot Candidate สำหรับ
External PA-1 ต้องมีอย่างน้อย:

1. Candidate ID ใหม่ เช่น `KDOMS-PC-PA1E-YYYYMMDD-NN`
2. Clean Git commit/hash; `git status` ไม่มี source/config change ที่ไม่บันทึก
3. Source, dependency lock และ build artifact SHA-256
4. Changelog จาก Local Candidate และรายการ accepted risks
5. Full lint/type/unit/component/emulator/security/build/PWA/performance validation
6. Cross-Farm negative suite ผ่านโดยผล allow = 0
7. Environment manifest ที่ไม่มี secret และชี้ target Non-Production ที่อนุมัติ
8. Mock Data Pack version/seed/reset procedure และ `SIMULATED/TEST ONLY` banner
9. Deployment/rollback/smoke-test procedure ผูกกับ owner codes จริง
10. Candidate validator ต้อง fail เมื่อ source/build/config ไม่ตรง manifest

การสร้าง clean commit หรือ Candidate ใหม่ต้องเป็นงานแยกหลัง Owner อนุมัติขอบเขต
การจัดเตรียม revision; เอกสารนี้ไม่ได้อนุญาตให้ commit, provision หรือ deploy

## 7. Exact Owner Decision Text

### ข้อความ Owner ที่อนุมัติแล้ว — NO-GO

```text
Owner Review Decision — Phase 7 External PA-1: NO-GO

ยังไม่อนุมัติการสร้าง External resource, billing, credential หรือ deployment
เนื่องจาก Owner actual values, governance owners/destination/region/key custody,
cost ceiling และ clean frozen deployable Candidate ยังไม่ครบ และ Source ปัจจุบัน
ไม่ตรงกับ local frozen snapshot เดิม

ให้คง PA-1 เฉพาะ Local/Emulator ตาม DEC-037 และใช้ Mock/Synthetic Data เท่านั้น
ห้ามเริ่ม PA-2, Controlled Pilot, Physical Device/Field Validation, Test QR,
ข้อมูล/รูป/เบอร์/SMS/ผู้เข้าร่วมจริง, Public access หรือ Production

เมื่อข้อมูลจริงสำหรับ External PA-1 ครบ ให้จัดทำ Owner Review ฉบับใหม่และหยุดรอ
ข้อความ GO จาก Owner ก่อนสร้าง resource หรือ Deploy
```

### ข้อความ GO ที่ใช้ได้เมื่อค่าจริงครบเท่านั้น

แทน `[ACTUAL_*]` ทุกช่องและลบบรรทัดนี้ก่อน Owner ลงมติ ห้ามใช้ค่า `SIM-*`,
`.example.invalid`, 0 THB Mock หรือ dirty Candidate

```text
Owner Review Decision — Phase 7 External PA-1: GO

อนุมัติให้สร้างและ Deploy Private Non-Production Pilot Candidate ด้วย
Mock/Synthetic Data — SIMULATED/TEST ONLY ตามค่าต่อไปนี้:

- Provider/project: [ACTUAL_PROVIDER] / [ACTUAL_NONPROD_PROJECT]
- Primary region/data location: [ACTUAL_REGION]
- Billing: [YES/NO]; monthly ceiling: [ACTUAL_AMOUNT/CURRENCY]; usage reviewer: [ACTUAL_CODE]
- Deployment/Rollback/Incident owners: [ACTUAL_CODES]
- Private URL/visibility/allowlist policy: [ACTUAL_VALUES]
- Authentication: [ACTUAL_TEST_ONLY_MODE_WITHOUT_REAL_SMS_OR_PHONE]
- Monitoring channel/retention: [ACTUAL_VALUES]
- Backup destination/region/operator/independent approver/key custodian: [ACTUAL_VALUES]
- RPO/RTO/backup retention: [ACTUAL_VALUES]
- Lifecycle scheduler/service identity: [ACTUAL_VALUE], DRY_RUN only
- Frozen Candidate ID and clean Git commit/hash: [ACTUAL_VALUES]

อนุญาตเฉพาะ resources ที่ระบุและ deployment ของ Candidate/hash ข้างต้น
Lifecycle worker ต้องคง DRY_RUN และห้ามใช้ข้อมูล รูป เบอร์ SMS ผู้เข้าร่วม
อุปกรณ์ QR/ป้าย หรือพื้นที่จริง ห้าม Public/Production deployment

ต้องผ่าน deployment smoke test, Cross-Farm denial, monitoring, backup/restore
rehearsal และ rollback verification หากพบ stop condition ให้หยุดและ rollback ทันที

มตินี้ไม่อนุมัติ PA-2, Controlled Pilot, Physical/Field Validation หรือ PA-3 Production
```

## 8. เอกสารที่อัปเดตตาม Owner Decision

Decision Log บันทึกมติ `NO-GO` เป็น `DEC-038 = Blocked` ตามชุดสถานะมาตรฐาน
โดยไม่เปลี่ยน DEC-037 และไม่อนุญาต External Action

| เอกสาร | การอัปเดตหลัง Owner ตัดสินใจ |
|---|---|
| `00-Project-Management/Decision-Log.md` | เพิ่ม DEC ถัดไป พร้อม exact Owner text, status, scope และข้อห้าม |
| `AGENTS.md` | ปรับเวอร์ชัน/สถานะและ external action boundary ตามมติ |
| `00-Project-Management/Phase-7-Plan.md` | ปรับ PA-1E/P7-B hold point และขั้นตอนถัดไป |
| `09-Deployment/Phase-7-Pilot-Impact-and-Approval-Pack_v1.0.md` | ใส่ actual resource/cost/owner decisions โดยไม่ใส่ secret |
| `09-Deployment/Phase-7-PA1-Owner-Actual-Input-Form_v1.0.md` | แทน Mock Substitute ด้วย actual values และ decision reference |
| `09-Deployment/Phase-7-Pilot-Candidate-Manifest_v0.1.md` | บันทึก clean commit, hashes, target, owner และ deployability state |
| `08-Testing/Phase-7-Pilot-Readiness-Checklist.md` | ปิดหรือคง checkbox PA-1E ตามหลักฐานจริง |
| `10-Operations/Phase-7-Photo-Data-Governance-Decision-Sheet_v1.0.md` | ใส่ PA-1 destination/region/roles/key custody/RPO/RTO; PA-2 fields ยังคง HOLD |
| Privacy/Backup/Support/Runbook เอกสาร Phase 7 | ผูก actual target, monitoring, restore, incident และ rollback controls |
| Machine-readable External PA-1 decision record | สร้าง `09-Deployment/phase7-external-pa1-owner-decision-v1.0.json` แล้ว; ระบุ `NO_GO/BLOCKED` และไม่มี secret |
| `README.md` | สรุปมติ Gate และขั้นตอนที่ได้รับอนุญาตล่าสุด |

สำหรับสถานะมาตรฐานใน Decision Log ให้ map ผล Owner Review ดังนี้: `GO` เป็น
`Approved` เฉพาะขอบเขต External PA-1 ที่ระบุ; `NO-GO` เป็น `Blocked` หรือ
`Deferred` ตามถ้อยคำ Owner; `CONDITIONAL GO` บันทึกเป็น `Approved` ได้เฉพาะเมื่อ
เงื่อนไขก่อนเริ่ม External Action ถูกปิดก่อน และห้ามใช้สถานะนอกชุดมาตรฐาน

## 9. Owner Decision Record

Owner decision:

- [ ] `GO — External PA-1`
- [ ] `CONDITIONAL GO — ระบุเงื่อนไขที่ไม่ใช่ prerequisite ด้าน resource/security`
- [x] `NO-GO — คง External PA-1 HOLD`

Owner decision reference: `Project Owner exact decision; DEC-038`

Effective date: `2026-09-01`

Current formal status: **EXTERNAL PA-1 NO-GO/BLOCKED; NO DEPLOYMENT**

## 10. Acceptance Criteria ของเอกสารนี้

- [x] ประเมิน External PA-1 เป็น `NO-GO` โดยไม่ใช้ Mock Substitute แทนค่าจริง
- [x] ระบุ Owner actual values ที่ขาดครบทั้ง environment, cost, owners, access,
  auth, monitoring, backup, lifecycle และ Candidate
- [x] ระบุ external resources/cost controls, security/privacy/backup/monitoring,
  rollback และ stop conditions
- [x] ระบุข้อกำหนด frozen deployable Candidate และหลักฐาน current hash mismatch
- [x] มี exact Owner text สำหรับสถานะปัจจุบันและ template `GO` ที่ห้ามใช้จนกว่า
  `[ACTUAL_*]` จะถูกแทนทั้งหมด
- [x] คง PA-2, Controlled Pilot, Physical Device/Field Validation และ Production
  ไว้นอกขอบเขตโดยชัดเจน
