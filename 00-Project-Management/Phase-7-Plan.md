# Phase 7 Plan — Operational Application Pilot, Rollout & Operations

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 2.3 |
| สถานะ | External PA-1 Owner Decision = NO-GO/BLOCKED; External Actions on HOLD |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | Owner Addendum Gate 6, Prompt Phase 7, AGENTS.md v4.5, External PA-1 Owner Review Decision v1.3, Source Stabilization Owner Review Mockup v1.2, Candidate Manifest v1.0, Local Pilot Readiness Report v1.5, Development/Mock Data/Pilot Knowledge v1.0.6, DEC-027, DEC-031, DEC-034, DEC-035, DEC-036, DEC-037, DEC-038, DEC-048, DEC-049, DEC-050, Phase 6 Validation Report v1.0 |

## 1. เป้าหมาย

เตรียม Pilot Candidate จากแอปที่ผ่าน Gate 6 แล้วดำเนิน Controlled Operational
Pilot แบบจำกัดสิทธิ์เพื่อเก็บหลักฐานจาก Android/iPhone, กล้อง/QR, เครือข่ายจริง,
ผู้ใช้จริง และ cohort ที่ Owner อนุมัติ ก่อนเสนอ Production, ป้ายถาวร หรือ scale-up

## 2. ขอบเขตที่อนุมัติให้ทำทันที

- ปิดหลักฐาน Gate 6 และกำหนด Phase 7 approval boundaries
- จัดทำ Pilot plan, impact/cost review, Candidate manifest และ runbook
- จัดทำ training, evidence/metrics, privacy/retention/access, support/incident,
  backup/export/restore และ Go/No-Go templates
- ตรวจแอปใน local/Mock/Firebase Emulator และแก้ defect ใน repository ที่พบ
- เตรียม Work photo compression/EXIF-GPS removal, automatic Retry/Orphan linkage,
  retention/backup/export baseline และ Android/iPhone test protocol
- เพิ่ม IndexedDB durable binary queue, local lifecycle worker `DRY_RUN`, HEIC
  fallback และ Photo Data Governance Decision Sheet ก่อน Pilot
- ใช้เฉพาะ `SIMULATED/TEST ONLY`; ห้ามยกระดับเป็น Physical/Field evidence

## 3. Out of scope จนกว่าจะอนุมัติแยก

- Firebase/Hosting/Storage/Auth project, billing, domain, credential และ deployment
- SMS/หมายเลขจริง บัญชีผู้ใช้จริง หรือข้อมูลสวน/บุคคล/ภาพ/topology จริง
- Test QR ที่ encode URL, ป้ายจริง การเข้าถึงอุปกรณ์จริง หรือการลงพื้นที่
- Production/public launch, ป้ายถาวร หรือขยายประมาณ 600 ต้น
- module ใหม่, Cross-Farm transfer, accounting/tax/payroll/banking และ AI diagnosis

## 4. ลำดับ Phase 7 และ Hold Points

| Stage | งาน | หลักฐาน | สถานะ/การอนุมัติ |
|---|---|---|---|
| P7-A | Local Pilot readiness | full suite, build, security/performance, plan/runbook/templates | ทำได้ตาม Gate 6 |
| **PA-1L** | Local/browser/Firebase Emulator rehearsal ด้วย Mock data | Candidate `KDOMS-PC-SIM-20260901-05` + Local Readiness Report v1.5 | **Source stabilized และ clean Local Candidate frozen; not deployable** |
| **PA-1E** | Owner ตรวจ External Pilot environment/resource/cost | actual provider/region/budget/owners + deployable revision | **NO-GO/BLOCKED ตาม DEC-038; source drift เดิมปิดแล้ว แต่ actual values, governance, cost, external controls และ Owner GO ยังขาด** |
| P7-B | Private Pilot Candidate ด้วย Mock data | deployment smoke, access control, rollback, backup rehearsal | ทำหลัง PA-1E เท่านั้น |
| **PA-2** | Owner ตรวจ Field execution/ข้อมูลจริง | cohort, devices, users, privacy, retention, evidence, QR, safety | **ต้องอนุมัติก่อนข้อมูลจริง/ลงพื้นที่** |
| P7-C | Controlled Operational Pilot | physical device/field evidence, metrics, issues, restore drill | ทำหลัง PA-2 เท่านั้น |
| P7-D | Fix/retest/report | regressions, accepted risks, Go/Conditional/No-Go | ไม่มี scope expansion |
| **PA-3** | Owner Go-Live decision | final Pilot Report + exact resources/cost/rollback owner | **ต้องอนุมัติก่อน Production/scale-up** |

## 5. Controlled Pilot baseline

ค่าที่อนุมัติเดิมและ carry forward:

- สวนทดลอง 1 แห่ง โดย sanitized reference จริงยัง `TBD`
- ต้นจริง 30 ต้น; ห้ามใช้แถวสำรอง 31–50 ในรอบแรก
- ป้ายชั่วคราว `TEST ONLY` 5 ป้าย; QR base URL ยัง `TBD`
- Android จริงอย่างน้อย 1 เครื่องและ iPhone จริงอย่างน้อย 1 เครื่อง
- 7 canonical roles ใช้เฉพาะ role ที่จำเป็นต่อ scenario; participant codes จริง `TBD`
- Cross-Farm access สำเร็จแม้ 1 ครั้งเป็น Critical stop

ค่าข้างต้นเป็น approved planning boundary ไม่ใช่ผลสำรวจหรือหลักฐานว่า Pilot ผ่าน

## 6. Scenario และ Metrics

Scenario ขั้นต่ำ:

1. Sign-in และ Farm context ตามสิทธิ์
2. ค้นหาต้น/เปิด Tag ด้วย opaque position ID
3. Scan Match, Mismatch, Unknown, Damaged และ wrong-Farm
4. Worker รับงาน ดูรูปอ้างอิง ยืนยันต้น ถ่าย BEFORE/AFTER และตรวจ
   WebP/ขนาด/EXIF-GPS บน Android และ iPhone
5. ตัด network ก่อน/หลัง upload, ปิด/reload แอป แล้ว reconcile Durable Queue และ
   Photo Retry/Orphan ด้วย Photo ID/path/idempotency key เดิม
6. Manager Verify/Request Rework และตรวจ audit before/after
7. Farm Dashboard/Portfolio ตาม role โดยไม่เผย hidden Farm
8. Farm-scoped export และ backup/export/restore drill ใน target ที่อนุมัติ

Metrics ขั้นต่ำ:

- Position/Tag resolve accuracy: `100%`
- Wrong-tree/wrong-Farm warning/block: `100%`
- Duplicate critical event: `0`
- Cross-Farm disclosure: `0`
- Scan success, attempts และ time-on-task: บันทึกตาม run จริง; threshold ต้อง Owner อนุมัติก่อน PA-2
- Sync failures, assistance, defects และ restore reconciliation: บันทึกทุก run

ห้ามลดเกณฑ์ย้อนหลังเพื่อทำให้ Pilot ผ่าน

## 7. Stop Conditions

หยุดส่วนที่เกี่ยวข้องทันทีเมื่อพบ Cross-Farm disclosure, wrong-tree action,
duplicate critical event, corrupt audit/history, restore mismatch, secret/real data
นอก boundary หรือความเสี่ยงทางกายภาพ เก็บ original evidence, เปิด Issue ID,
contain, แจ้ง Owner และห้าม retest จนกว่าจะอนุมัติ remediation

## 8. Deliverables

- `00-Project-Management/Phase-7-Owner-Mockup-Input-Pack_v1.0.md`
- `09-Deployment/phase7-owner-mockup-input-v1.0.json`
- `09-Deployment/validate-phase7-owner-mockup.ps1`
- `08-Testing/Phase-7-PA1-Mock-Dry-Run-Validation_v1.0.md`
- `09-Deployment/Phase-7-PA1-Owner-Actual-Input-Form_v1.0.md`
- `09-Deployment/phase7-pa1-owner-selected-mock-substitute-v1.0.json`
- `09-Deployment/validate-phase7-pa1-owner-selection.ps1`
- `08-Testing/Phase-7-PA1-Owner-Mock-Substitute-Validation_v1.0.md`
- `09-Deployment/phase7-pa1-local-rehearsal-approval-v1.1.json`
- `09-Deployment/validate-phase7-pa1-local-rehearsal.ps1`
- `08-Testing/Phase-7-PA1-Local-Emulator-Rehearsal-Report_v1.1.md`
- `09-Deployment/Phase-7-External-PA1-Mockup-Data-Pack_v1.0.md`
- `09-Deployment/phase7-external-pa1-mockup-data-v1.0.json`
- `09-Deployment/validate-phase7-external-pa1-mockup.ps1`
- `08-Testing/Phase-7-External-PA1-Mockup-Validation_v1.0.md`
- `00-Project-Management/Owner-Review-Decision_Phase-7-External-PA1_2026-08-31.md`
- `00-Project-Management/Owner-Review-Mockup_Phase-7-Source-Stabilization-and-Local-Candidate-Freeze_2026-09-01.md`
- `09-Deployment/Phase-7-Pilot-Impact-and-Approval-Pack_v1.0.md`
- `09-Deployment/Phase-7-Pilot-Candidate-Manifest_v0.1.md`
- `10-Operations/Phase-7-Controlled-Pilot-Runbook_v1.0.md`
- `10-Operations/Phase-7-Role-Training-Guide_v1.0.md`
- `10-Operations/Phase-7-Privacy-Retention-Access-Review_v0.1.md`
- `10-Operations/Phase-7-Photo-Data-Governance-Decision-Sheet_v1.0.md`
- `06-System-Architecture/Phase-7-Work-Photo-Durable-Queue-and-Lifecycle-Architecture_v1.0.md`
- `10-Operations/Phase-7-Support-Incident-and-Rollback-Plan_v1.0.md`
- `10-Operations/Phase-7-Backup-Restore-Drill_v1.0.md`
- `08-Testing/Phase-7-Pilot-Readiness-Checklist.md`
- `08-Testing/Phase-7-Local-Pilot-Readiness-Report_v1.0.md`
- `08-Testing/Phase-7-Pilot-Evidence-Register_v1.0.csv`
- `08-Testing/Phase-7-Pilot-Metrics_v1.0.csv`
- `08-Testing/Phase-7-Defect-and-Retest-Log_v1.0.csv`
- `08-Testing/Phase-7-Go-No-Go-Report-Template_v1.0.md`

## 9. Phase 7 completion

Phase 7 จะยังไม่ถือว่าเสร็จจนกว่า Pilot Candidate ที่ได้รับอนุมัติถูกทดสอบจริง,
Physical Device/Field Validation ผ่าน, blocker ถูกปิดหรือ Owner ยอมรับเป็นรายการ,
และมี Pilot Report พร้อมคำแนะนำ `GO`, `CONDITIONAL GO` หรือ `NO-GO`

สถานะปัจจุบัน: **LOCAL SOURCE STABILIZED AND CANDIDATE FROZEN;
EXTERNAL PA-1 OWNER DECISION = NO-GO/BLOCKED; ACTUAL VALUES/GOVERNANCE/COST/
EXTERNAL CONTROLS AND OWNER GO STILL MISSING; PA-2 NOT APPROVED; NO DEPLOYMENT**
