# Phase 7 Pilot Impact & Approval Pack

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.8 |
| สถานะ | External PA-1 Owner Decision = NO-GO/BLOCKED — No External Action Authorized |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | Owner Addendum Gate 6, Phase 7 Plan v2.0, External PA-1 Owner Review Decision v1.2, Owner Mockup Input Pack v1.1, PA-1 Local Rehearsal Report v1.1, Development/Mock Data/Pilot Knowledge v1.0.4, Privacy Review v0.3, Backup Drill v1.2, Governance Decision Sheet v1.1, DEC-017, DEC-027, DEC-031, DEC-034, DEC-035, DEC-036, DEC-037, DEC-038 |

## 1. คำขออนุมัติที่เอกสารนี้รองรับ

เอกสารนี้ใช้ตัดสิน **PA-1: Pilot Environment/Deployment Approval** เท่านั้น
ยังไม่ขออนุมัติ Production และยังไม่ขออนุมัติรับข้อมูลจริงหรือลงพื้นที่

## 2. แนวทางสภาพแวดล้อม

| ทางเลือก | ใช้ทำอะไร | ผลกระทบ/ข้อจำกัด | ข้อเสนอ |
|---|---|---|---|
| A. Local private LAN + Emulator | preflight บนอุปกรณ์จริงด้วย Mock data ภายในพื้นที่ควบคุม | ต้องจัด HTTPS/camera permission, laptop/เครือข่ายต้องพร้อม, ไม่เทียบเท่า cloud Pilot | ใช้เป็นขั้นต้นหลัง PA-1 |
| B. Private non-production Pilot environment | end-to-end Pilot Candidate แยก Production, จำกัดบัญชี/สิทธิ์ | อาจมีค่าใช้จ่าย provider, billing, credentials, logging, backup และ internet dependency | **แนะนำสำหรับ Controlled Pilot หลังอนุมัติ resource เป็นรายการ** |
| C. Production/public environment | ใช้งานจริง/สาธารณะ | blast radius, privacy, billing และ rollback สูง | **ห้ามในรอบนี้** |

การเลือก A ไม่ถือว่า Production-like cloud smoke ผ่าน ส่วน B ต้องสร้างเป็น project
แยกจาก Production และเริ่มด้วย Mock data เท่านั้น

## 3. External resources และผลกระทบ

| Resource/action | วัตถุประสงค์ | ข้อมูล/สิทธิ์ | ค่าใช้จ่าย | ความเสี่ยง | สถานะ |
|---|---|---|---|---|---|
| Non-production Firebase project | Auth/Firestore/Storage/Hosting สำหรับ Pilot | test accounts; least privilege | `TBD` ตาม pricing ณ วันอนุมัติ | config ผิด project, data exposure | NOT APPROVED |
| Billing plan/limit | รองรับ resource ที่จำเป็น | Owner billing access | เพดานรายเดือน `TBD` | charge เกินแผน | NOT APPROVED |
| Private Hosting URL | เปิด Candidate แบบ access-controlled | Mock data ก่อน PA-2 | รวม/`TBD` | URL ส่งต่อ, cache stale | NOT APPROVED |
| Pilot Auth | จำกัด participant | Emulator/test numbers จนกว่าจะอนุมัติ real Auth | `TBD` | account recovery/SMS/privacy | NOT APPROVED |
| Pilot Storage | รูป Mock; รูปจริงหลัง PA-2 | Farm/Work scoped | `TBD` | orphan, face/location data | NOT APPROVED |
| Logging/monitoring | error/security/availability | masked IDs; no OTP/secret | `TBD` | telemetry leakage | NOT APPROVED |
| Backup destination/key | restore drill | encrypted, access-controlled | `TBD` | restore/key failure | NOT APPROVED |
| Lifecycle scheduler/worker identity | Orphan cleanup/retention enforcement | server-side least privilege | `TBD` | ลบผิด scope/cutoff | NOT APPROVED |
| Test-only domain/QR URL | ทดสอบ QR จริง 5 ป้าย | opaque position ID only | `TBD` | URL ownership/redirect permanence | NOT APPROVED |
| Evidence storage | หลักฐาน Pilot จริง | restricted codes/photos | `TBD` | privacy/retention leak | NOT APPROVED |

ห้ามตีความ `TBD` ว่าไม่มีค่าใช้จ่าย ต้องตรวจราคา/เงื่อนไขล่าสุดในวันอนุมัติและ
กำหนด budget alert/hard operational stop เท่าที่ provider รองรับ

## 4. ผลกระทบที่ Owner ต้องรับทราบ

### Security

- ต้องแยก Pilot project, credentials และ data จาก Development/Production
- deploy identity ใช้ least privilege; ห้าม commit secret/service-account key
- Cross-Farm denial ต้อง smoke test หลัง deploy ก่อนเชิญ participant
- ต้องมีวิธี revoke user, disable Hosting/access และ rollback candidate

### Privacy/Data

- ค่าเริ่มต้นหลัง deploy ใช้ Mock data เท่านั้น
- ข้อมูลจริงเริ่มได้หลัง PA-2 ซึ่งอนุมัติ purpose, minimum fields, consent/notice,
  access, retention, disposal, backup, evidence และ incident response
- ห้ามนำ export/ภาพ/backup จริงกลับเข้า repository หรือ Emulator

### Operations

- ต้องกำหนด deployment owner, incident commander, rollback owner และ backup owner
- ต้องกำหนด Data Custodian, Backup/Lifecycle operator กับ independent approver,
  destination, region และ key/recovery-key custody ตาม Governance Decision Sheet
- ต้องมีเวลาสนับสนุนและช่องทาง escalation ระหว่าง Pilot
- Candidate ต้อง freeze version; การแก้ defect deploy เป็น candidate ใหม่และมี changelog

### Cost

- หมวดค่าใช้จ่าย: hosting/egress, database, storage, Auth/SMS, monitoring,
  backup, domain/QR, device/network, training/support และ evidence retention
- เอกสารนี้ไม่ให้ยอดประมาณเพราะราคาผู้ให้บริการและรูปแบบใช้งานยังไม่ได้เลือก
- Owner ต้องกำหนดเพดานต่อเดือน, ผู้รับผิดชอบตรวจ usage และเงื่อนไขหยุด

## 5. PA-1 Local Passed; External PA-1 ถูกตัดสิน NO-GO

ค่าด้านล่างได้รับอนุมัติเฉพาะ Local/Emulator rehearsal ตาม DEC-037 ส่วน External
Pilot Action ยังต้องแทนด้วยค่าที่ใช้งานได้จริงและอนุมัติใหม่:

Owner สั่งให้นำค่าจำลองที่กรอกครบแล้วใน
`00-Project-Management/Phase-7-Owner-Mockup-Input-Pack_v1.0.md` และ
`09-Deployment/phase7-owner-mockup-input-v1.0.json` มาเติม Owner input ตาม
DEC-035 ผลลัพธ์ยังเป็น `SIMULATED/TEST ONLY` ไม่ใช่ external configuration
DEC-037 อนุมัติและผ่านเฉพาะ Local/Emulator rehearsal

ผลตรวจซ้ำอยู่ที่
`08-Testing/Phase-7-PA1-Owner-Mock-Substitute-Validation_v1.0.md` และค่าที่
Owner เลือกถูกบันทึกไว้ที่
`09-Deployment/Phase-7-PA1-Owner-Actual-Input-Form_v1.0.md`

| Decision | Owner value |
|---|---|
| Environment option | `A_THEN_B_SIMULATED_DRY_RUN_ONLY` |
| Cloud/project/provider identifier แบบไม่เปิด secret | `KDOMS-PILOT-SIM-001 / PROVIDER-SIM-01` |
| Region/data location | `SIM-REGION-01` |
| อนุญาตสร้าง billing หรือไม่ | `No — DISABLED / false` |
| Cost ceiling และผู้ตรวจ usage | `0 THB — MOCK ONLY / USAGE-REVIEW-SIM-01` |
| Deployment owner / rollback owner codes | `DEPLOY-SIM-01 / ROLLBACK-SIM-01` |
| Pilot URL visibility/access control | `https://pilot-kdoms-sim.example.invalid / PRIVATE_ALLOWLIST_SIMULATION` |
| Auth mode สำหรับ Mock Pilot | `FIREBASE_AUTH_EMULATOR_REFERENCES_ONLY`; real SMS ยังต้องขอแยก |
| Monitoring/alert channel และ retention | `SIM-ALERT-CHANNEL-01 / 30 days — SIMULATED` |
| Backup destination/key custody | `SIM-BACKUP-STORE-01 / SIM-KEY-CUSTODIAN-01` |
| Proposed Pilot RPO/RTO/backup retention | `24h / 8h / rolling 30 days — SIMULATED` |
| Candidate ID | `KDOMS-PC-SIM-20260831-02 — FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE` |
| อนุญาต PA-1 Local/Emulator | `APPROVED และ PASSED — DEC-037` |
| อนุญาต External PA-1/Deployment | `NOT APPROVED` |

Owner-selected input status: **COMPLETE VIA MOCK SUBSTITUTE — `SIMULATED/TEST ONLY`**

Owner local/emulator rehearsal approval status: **APPROVED ตาม DEC-037**

External environment/resource/deployment approval status:
**NO-GO / BLOCKED ตาม DEC-038** เนื่องจาก actual values, governance, cost ceiling,
clean frozen deployable Candidate ยังไม่ครบ และ Source ปัจจุบันไม่ตรง local
frozen snapshot เดิม

ข้อความอนุมัติ Local/Emulator ที่ Owner ส่งและบันทึกเป็น DEC-037:

```text
อนุมัติ PA-1 สำหรับ Phase 7 Pilot Candidate ตาม
09-Deployment/Phase-7-Pilot-Impact-and-Approval-Pack_v1.0.md
และ 09-Deployment/Phase-7-PA1-Owner-Actual-Input-Form_v1.0.md
โดยยอมรับ Owner-directed Mock Substitute และอนุญาตเฉพาะ local/emulator
rehearsal ที่ไม่สร้าง external resource, billing, credential หรือ deployment
ยังไม่อนุมัติข้อมูลจริง การลงพื้นที่ หรือ Production
```

## 6. PA-2 และ PA-3 ที่ยังไม่ขออนุมัติ

- **PA-2 Field/Data Approval:** participant, cohort, Android/iPhone, site,
  test-only QR, data purpose, consent/notice, ค่า retention 90/180/365/30/7 วัน,
  orphan grace, photo export dual approval, lifecycle `ENFORCE`, HEIC fallback,
  Data Custodian, evidence และ safety
- **PA-3 Go-Live Approval:** Production resources, cost, domain/SMS, migration,
  backup/monitoring, accepted risks, rollback owner, permanent tags และ scale-up

สถานะ: **PA-1 LOCAL/EMULATOR PASSED — EXTERNAL PA-1 NO-GO/BLOCKED;
PA-2/DEPLOYMENT NOT APPROVED**
