# Phase 7 Owner Mockup Input Pack

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | Complete Mock Source — Owner-selected PA-1 Substitute Recorded; PA-1/PA-2/PA-3 Not Approved |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | AGENTS.md v2.9, Phase 7 Plan v1.4, Pilot Impact & Approval Pack v1.4, Controlled Pilot Runbook v1.2, Privacy Review v0.2, Backup Drill v1.1, DEC-027, DEC-031, DEC-034, DEC-035 |
| Machine-readable data | `09-Deployment/phase7-owner-mockup-input-v1.0.json` |
| Owner-selected mapping | `09-Deployment/phase7-pa1-owner-selected-mock-substitute-v1.0.json` |

> ทุกค่าในเอกสารนี้เป็นข้อมูลจำลองสำหรับตรวจแบบฟอร์มและซ้อม Owner Review เท่านั้น
> ห้ามใช้สร้าง resource, billing, credential, deployment, QR, ป้าย, นัดหมาย,
> บัญชีจริง หรือหลักฐาน Physical/Field Validation

> ตาม DEC-035 Owner เลือกให้นำค่า PA-1 ชุดนี้ไปกรอกช่อง Owner input แล้ว โดยยัง
> คงสถานะ `SIMULATED/TEST ONLY`; คอลัมน์ Owner actual เดิมด้านล่างจึงหมายถึง
> **external actual value** ซึ่งยัง `TBD` และต้องแทนก่อน External Pilot Action

## 1. การควบคุมชุดข้อมูล

| Field | Mockup value |
|---|---|
| Pack ID | `KDOMS-OWNER-MOCK-V1` |
| Classification | `SIMULATED/TEST ONLY` |
| Deterministic seed | `KDOMS-P7-OWNER-20260831-001` |
| JSON SHA-256 | `6BB326C87D3DEE8C3B8B16C21E945FE78A15FE8F3866D8C1AF8898ED7B10606B` |
| Reset method | ทิ้งค่าที่แก้ระหว่าง dry-run แล้วโหลด JSON v1.0 ใหม่ |
| Real person/site/device/data | ไม่มี |
| Approval effect | ไม่มี; PA-1/PA-2/PA-3 คง `NOT APPROVED` |

## 2. PA-1 Mockup — Environment, Cost และ Candidate

| Decision | Mockup value — ห้ามใช้จริง | Owner actual value |
|---|---|---|
| Environment option | `A then B — SIMULATED DRY-RUN ONLY` | `TBD` |
| Cloud/project/provider reference | `KDOMS-PILOT-SIM-001 / PROVIDER-SIM-01` | `TBD` |
| Region/data location | `SIM-REGION-01 — ไม่ใช่ region จริง` | `TBD` |
| Billing | `DISABLED — SIMULATED` | `TBD — Yes/No` |
| Cost ceiling | `0 THB — MOCK DATA; ไม่ใช่ประมาณการค่าใช้จริง` | `TBD` |
| Usage reviewer | `USAGE-REVIEW-SIM-01` | `TBD` |
| Deployment owner | `DEPLOY-SIM-01` | `TBD` |
| Rollback owner | `ROLLBACK-SIM-01` | `TBD` |
| Pilot URL/access | `https://pilot-kdoms-sim.example.invalid`; private allowlist simulation | `TBD` |
| Auth mode | `Firebase Auth Emulator references only`; ไม่มีเบอร์/OTP จริง | `TBD` |
| Monitoring | `SIM-ALERT-CHANNEL-01`; mock logs 30 วัน | `TBD` |
| Backup/key custody | `SIM-BACKUP-STORE-01 / SIM-KEY-CUSTODIAN-01` | `TBD` |
| Proposed RPO/RTO/retention | `24h / 8h / rolling 30 days — SIMULATED` | Owner รับ/แก้ |
| Candidate ID | `KDOMS-PC-SIM-20260831-01 — NOT FROZEN/NOT DEPLOYABLE` | `TBD` |
| PA-1 decision | `NOT APPROVED — MOCKUP COMPLETE ONLY` | `NOT APPROVED` |

## 3. PA-2 Mockup — ผู้รับผิดชอบและการสนับสนุน

| Responsibility | Mockup code | Owner actual code |
|---|---|---|
| Pilot owner / GO-NO-GO | `PILOT-OWNER-SIM-01` | `TBD` |
| Field lead / safety | `FIELD-LEAD-SIM-01` | `TBD` |
| Incident commander | `INCIDENT-SIM-01` | `TBD` |
| Data/Privacy Custodian | `PRIVACY-SIM-01` | `TBD` |
| Backup operator | `BACKUP-OP-SIM-01` | `TBD` |
| Independent backup approver | `BACKUP-APPROVER-SIM-01` | `TBD` |
| Evidence custodian | `EVIDENCE-SIM-01` | `TBD` |
| Primary/backup support | `SUPPORT-SIM-01 / SUPPORT-SIM-02` | `TBD` |
| Android/iPhone testers | `ANDROID-TESTER-SIM-01 / IPHONE-TESTER-SIM-01` | `TBD` |
| Owner/Manager/Worker users | `OWNER-SIM-01 / MANAGER-SIM-01 / WORKER-SIM-01` | `TBD` |
| Critical escalation channel | `SIM-ALERT-CHANNEL-01` | `TBD — mapping จริงอยู่นอก repository` |

Mock support window คือ `08:00–17:00 Asia/Bangkok` และ mock response targets คือ
Critical 15 นาที, High 1 ชั่วโมง, Medium 4 ชั่วโมง, Low ภายในรอบ review ถัดไป
ตัวเลขนี้ใช้ซ้อมแบบฟอร์ม ไม่ใช่ SLA ที่อนุมัติแล้ว

## 4. PA-2 Mockup — Site, Cohort, Device และ QR

| Field | Mockup value — ห้ามใช้เป็นข้อเท็จจริง | Owner actual value |
|---|---|---|
| Pilot reference | `PILOT-SIM-001` | `TBD` |
| Sanitized Farm reference | `FARM-PILOT-SIM-01` | `TBD` |
| Cross-Farm negative reference | `FARM-DENY-SIM-02` | `TBD` |
| Schedule | `2026-09-05 08:00–12:00 Asia/Bangkok — ไม่ใช่นัดหมายจริง` | `TBD` |
| Backup date | `2026-09-06 — SIMULATED` | `TBD` |
| Cohort | 30 mock positions; `SIM-POS-001` ถึง `SIM-POS-030` | 30 ต้นจริงหลัง PA-2 |
| Temporary plates | `PLATE-SIM-01` ถึง `PLATE-SIM-05`, `TEST ONLY` | 5 ป้ายจริงหลัง PA-2 |
| Android | `ANDROID-VIEWPORT-SIM-01`, 360×800 browser simulation | รุ่น/OS/browserจริง `TBD` |
| iPhone | `IPHONE-VIEWPORT-SIM-01`, 390×844 browser simulation | รุ่น/iOS/Safariจริง `TBD` |
| Test QR URL | `https://pilot-kdoms-sim.example.invalid/t/{opaquePositionId}` | `TBD` |
| QR control | ห้าม encode/พิมพ์; URL ใช้ตรวจข้อความเท่านั้น | Owner approval required |
| Evidence storage | `SIM-EVIDENCE-STORE-01` | `TBD` |
| Safety stop | ฝนหนัก/ฟ้าผ่า/น้ำท่วม/พื้นลื่น/Cross-Farm/wrong-tree/metadata leak | Owner ยืนยันจริง `TBD` |
| PA-2 decision | `NOT APPROVED — MOCKUP COMPLETE ONLY` | `NOT APPROVED` |

Mock topology ใช้ Zone `ZSIM01`, Row `RSIM01–RSIM02`, แถวละ 15 ตำแหน่ง
เพื่อทดสอบ UI เท่านั้น ไม่มีพิกัด พันธุ์ ปีปลูก หรือทิศทางนับจริง

## 5. Mock Privacy, Retention, Backup และ Photo Policy

| Control | Mockup value | Owner action ก่อน PA-2 |
|---|---|---|
| Work photo | re-encode WebP, ด้านยาว ≤1,600px, output ≤5MB, EXIF/GPS = 0 | รับ/แก้ policy |
| Photo retry | สูงสุด 3 ครั้ง; Photo ID/path เดิม; ล้มเหลวเข้า Recovery/Orphan | รับ/แก้ policy |
| Work photos | ตลอด Pilot + 90 วัน | รับ/แก้ |
| Selected evidence | 180 วันหลัง PA-3 | รับ/แก้ |
| Work/audit/recovery metadata | 365 วันหลัง Pilot close | รับ/แก้ |
| Encrypted backup | rolling 30 วัน | รับ/แก้ |
| Export package | 7 วัน | รับ/แก้ |
| Device cache/temp | ไม่เกิน 7 วันและ clear เมื่อ logout/revoke/close | รับ/แก้ |
| RPO/RTO | 24h / 8h | รับ/แก้ |
| Bulk photo export | ปิดโดย default; Owner + Data Custodian dual approval | รับ/แก้ |
| Real photo/data | ไม่อนุญาตใน mock pack | PA-2 required |

## 6. Mock monitoring thresholds

| Signal | Mock threshold/action | Owner actual value |
|---|---|---|
| Cross-Farm allow | 1 ครั้ง = Critical stop | บังคับ 1 ครั้ง = stop |
| Wrong-tree action | 1 ครั้ง = Critical stop | บังคับ 1 ครั้ง = stop |
| Duplicate critical event | 1 ครั้ง = Critical stop | บังคับ 1 ครั้ง = stop |
| Photo metadata/EXIF/GPS leak | 1 object = Critical stop | บังคับ 1 object = stop |
| Upload retry | เกิน 3 ครั้ง = FAILED/Recovery | Owner รับ/แก้ |
| Pending queue age | เกิน 30 นาที = support review | `TBD` |
| Restore mismatch | 1 record/object = High; rollout hold | บังคับ hold |
| Bulk photo export | ทุกครั้งต้อง dual approval | Owner รับ/แก้ |

## 7. สิ่งที่ Mockup นี้ยังใช้แทน External Actual ไม่ได้

- provider/project/region/billing/cost จริง
- source revision/checksum และ Candidate ที่ freeze แล้ว
- ชื่อหรือ code mapping ของผู้รับผิดชอบจริง
- สถานที่ กำหนดการ รุ่นอุปกรณ์ และเครือข่ายจริง
- test-only QR URL ที่โทรศัพท์จริงเข้าถึงได้
- evidence/backup destination, key custody และข้อกฎหมายจริง
- ข้อความอนุมัติ PA-1, PA-2 หรือ PA-3

Owner-selected PA-1 mapping และผลตรวจอยู่ที่:

- `09-Deployment/Phase-7-PA1-Owner-Actual-Input-Form_v1.0.md`
- `08-Testing/Phase-7-PA1-Owner-Mock-Substitute-Validation_v1.0.md`

Current decision: **OWNER-SELECTED PA-1 MOCK SUBSTITUTE COMPLETE —
PA-1/PA-2/PA-3 REMAIN NOT APPROVED**
