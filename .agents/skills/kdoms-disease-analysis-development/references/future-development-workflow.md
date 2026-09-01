# KDOMS Disease Analysis Future Development Workflow v0.2

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.2 |
| สถานะ | P1 Implemented & Validated — Local/Mock/Firebase Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md`, Development/Mock Data/Pilot Knowledge v1.0.4, Scope Knowledge v0.2.2, Phase 4 Work/Care/Disease Architecture v0.3, Owner Review Addendum Disease Analysis P1, DEC-026, DEC-027, DEC-031, DEC-038, DEC-039 |

DEC-039 อนุมัติและดำเนินการ P1 Deterministic Mock Analysis แล้วเฉพาะ
Local/Mock/Firebase Emulator เอกสารนี้ไม่ใช่การอนุมัติภาพจริง, public dataset,
external API/model, deployment, Controlled Pilot, Production หรือ P2 และไม่เปลี่ยน
สถานะ Gate/PA ปัจจุบัน

## 1. ข้อยืนยัน ข้อเสนอ และข้อสันนิษฐาน

### ข้อยืนยัน

- ระบบปัจจุบันจัดการ Disease Incident ตั้งแต่ observed symptom, Agronomist
  assessment, Treatment Work Order, follow-up และ audit แบบ Farm-scoped
- AI diagnosis อัตโนมัติโดยไม่มีผู้เชี่ยวชาญยืนยันอยู่นอก MVP
- DEC-026 เรื่อง approval policy ของยา/การรักษายัง `Open`
- DEC-039 อนุมัติ P1 สำหรับ deterministic Analysis Session, Mock Confidence,
  Abstain, Agronomist Human Review, audit/idempotency และ Cross-Farm tests
- External PA-1 ยัง `Blocked`; PA-2, deployment, real media/data และ Production
  ยังไม่ได้รับอนุมัติ

### ข้อเสนอที่ยังรอ P2+

- ให้ Owner/Agronomist อนุมัติ taxonomy โรคจริง, metric และ error threshold
- ประเมิน dataset/model/provider/cost/security เฉพาะหลัง P2 ได้รับอนุมัติ
- ใช้สิทธิ์/retention/backup/export/deletion สำหรับสื่อจริงหลังผ่าน approval แยก

### ข้อสันนิษฐานที่คงอยู่

- P1 ใช้ neutral mock symptom-pattern code ไม่ใช่ taxonomy โรคจริง
- ยังไม่มี taxonomy โรค, agronomic confidence threshold, model/provider, dataset,
  retention หรือผู้รับผิดชอบข้อมูลจริงที่อนุมัติแล้ว

## 2. Target workflow สำหรับอนาคต

```text
เลือกสวน → สแกน/ยืนยันต้น → บันทึก observed symptom และ severity
→ เตรียมหลักฐานตาม policy → ตรวจคุณภาพ/metadata
→ สร้าง Analysis Session → สร้าง candidate finding หรือ Abstain
→ Agronomist รับ/แก้/ปฏิเสธ → บันทึก confirmed diagnosis แยกต่างหาก
→ วางแผนรักษาตาม policy → Treatment Work Order
→ Worker ทำงาน/ส่งหลักฐาน → Manager/Agronomist ตรวจรับ
→ Follow-up outcome → ประเมินผลและใช้เป็น evidence สำหรับการปรับระบบ
```

Analysis ต้องเป็นทางเลือกเสริม หากระบบวิเคราะห์ไม่พร้อม ล้มเหลว หรือ Abstain
ผู้ใช้ต้องกลับไปใช้ workflow คนตรวจตามปกติได้โดยไม่สูญเสียข้อมูล

## 3. Working Proposal: Analysis Session

แต่ละ session ควรมีอย่างน้อย:

- `analysisSessionId`, `organizationId`, `farmId`, `positionId`,
  `plantingCycleId`, `incidentId`
- media reference และ purpose ที่ไม่ข้าม Farm/Tree/Incident
- `analysisSource`, `modelVersion` หรือ `MOCK_DETERMINISTIC_V1`
- quality checks, candidate findings, confidence, uncertainty และ abstain reason
- `status`, idempotency key, actor, captured time และ trusted server time
- reviewer, review disposition (`ACCEPTED`, `CORRECTED`, `REJECTED`), correction,
  reviewed time และ append-only audit event

สถานะที่เสนอ:

| สถานะ | ความหมาย |
|---|---|
| `DRAFT` | บันทึกอาการ/หลักฐานยังไม่ครบ |
| `READY` | ผ่าน validation และพร้อมวิเคราะห์ |
| `ANALYZING` | กำลังประมวลผลแบบ Mock/local ในระยะที่อนุญาต |
| `HUMAN_REVIEW_REQUIRED` | มี candidate finding หรือ Abstain รอ Agronomist |
| `REVIEWED` | Agronomist รับ แก้ หรือปฏิเสธแล้ว |
| `FAILED` | วิเคราะห์ไม่สำเร็จและมีเหตุผล/retry state |
| `VOIDED` | ยกเลิกด้วย correction/audit โดยไม่ลบประวัติ |

ห้ามใช้สถานะ `CONFIRMED_DIAGNOSIS` เป็นผลจาก model โดยตรง

## 4. Role boundary

| บทบาท | ขอบเขตที่เสนอ |
|---|---|
| `WORKER` | รายงานอาการ ยืนยันต้น และเก็บหลักฐานตามงาน; ห้ามยืนยัน diagnosis |
| `FARM_MANAGER` | จัดคิว/ติดตามเคสและงาน; ไม่อนุมัติผล AI แทน Agronomist |
| `AGRONOMIST` | ตรวจ candidate finding, แก้/ปฏิเสธ, ยืนยัน diagnosis และวาง treatment ตาม policy |
| `ORG_OWNER` | ดู readiness, risk, cost, evidence และอนุมัติ Gate ตามรายการ |
| `AUDITOR` | อ่าน session/review/audit ตาม assignment โดยไม่แก้ข้อมูล |

สิทธิ์ `VIEWER` และการมองเห็นรายละเอียดภาพ/ผลวิเคราะห์ต้องตัดสินใน Role Matrix
ก่อนใช้งานจริง

## 5. Development stages

| ขั้น | ขอบเขต | เงื่อนไขออกจากขั้น |
|---|---|---|
| P0 — Preparation | Knowledge Skill, menu, workflow, contracts และ questions | UI ระบุข้อห้ามชัด; ไม่มี runtime analysis หรือข้อมูลจริง |
| P1 — Deterministic Mock | Synthetic sessions, candidate/abstain, Human Review, audit, offline/idempotency, cross-farm tests | Unit/UI/Rules/Emulator ผ่านและผลทุกค่าติดป้าย `SIMULATED/TEST ONLY` |
| P2 — Evaluation Proposal | metric, dataset governance, error taxonomy, model/provider/cost/security review | Owner อนุมัติ dataset/model/resource/evidence เป็นรายการก่อน execution |
| P3 — Controlled Pilot | อุปกรณ์ ภาพ และผู้ใช้จริงแบบจำกัด | External PA-1/PA-2 และ Pilot approvals ผ่าน; Android+iPhone/field evidence ครบ |
| P4 — Production Readiness | monitoring, drift, incident, rollback, retention, support | Pilot defect ปิด, Physical/Field Validation ผ่าน และ Owner อนุมัติ Production |

## 5.1 P1 implementation baseline

- เมนู `ศูนย์วิเคราะห์โรคจำลอง` แยกจาก Disease Incident ปัจจุบัน
- deterministic scenarios: clear symptom pattern, low-quality Abstain และ
  conflicting-observation Abstain
- Candidate ใช้ neutral code `MOCK_SYMPTOM_PATTERN_A`; ไม่มีชื่อโรคจริง
- Confidence/Quality เป็น Mock engineering score ไม่ใช่ agronomic accuracy
- Human Review รองรับ `ACCEPTED`, `CORRECTED`, `REJECTED` โดย Agronomist เท่านั้น
- `diagnosisWritebackStatus = NOT_WRITTEN`; ไม่มี Treatment Work Order อัตโนมัติ
- Mock Data Pack มี 2 Farm และตรวจ Cross-Farm, wrong-tree, planting-cycle,
  unauthorized role, duplicate/idempotency และ append-oriented audit
- Firebase Emulator Rules ใช้ path แบบ Farm-scoped:
  `organizations/{organizationId}/farms/{farmId}/diseaseAnalysisSessions/{analysisSessionId}`

## 6. P0/P1 acceptance criteria

- เมนูใหม่ไม่ปะปนกับ Disease Incident ที่ใช้อยู่และไม่แสดงว่า AI พร้อมใช้งาน
- P0 preparation เดิมเป็น read-only; เมื่อเข้าสู่ P1 อนุญาตเฉพาะ mutation ของ
  deterministic Mock Analysis Session และ Human Review ภายใน Local/Emulator
- P1 ไม่มี upload, camera, external request, real media/data หรือ confirmed
  diagnosis/Treatment mutation
- Workflow แยก observation, candidate finding, human review, confirmed diagnosis,
  treatment และ outcome
- แสดง Multi-Farm, wrong-tree, idempotency, offline, audit, privacy และ abstention
  เป็นข้อบังคับสำหรับขั้นถัดไป
- มี automated test ว่าเมนูเปิดได้และข้อความ `SIMULATED/TEST ONLY`/
  `ยังไม่เปิดใช้ AI` ปรากฏ
- deterministic scenario เดิมให้ candidate/Abstain เดิม
- เฉพาะ Agronomist ทำ Human Review ได้และ confirmed diagnosis ไม่ถูกเขียนอัตโนมัติ
- Cross-Farm/wrong-tree/duplicate ถูกปฏิเสธ และ Unit/UI/Rules/Emulator ผ่าน

## 7. คำถามที่ต้องตัดสินใจก่อน P2

1. Taxonomy อาการ/โรค/แมลงและผู้รับผิดชอบอนุมัติ vocabulary
2. เกณฑ์ image quality, agronomic confidence, abstain และความผิดพลาดที่ยอมรับได้
3. ต้องการ on-device, private hosted หรือ external model และข้อจำกัด cost/latency
4. สิทธิ์ดูภาพ/ผลวิเคราะห์, retention, backup, export, deletion และ key custody
5. metric ที่ใช้: review agreement, correction rate, false reassurance,
   time-to-review, failed/abstain rate และผลต่อ workflow
6. เงื่อนไขที่ต้องบังคับให้ปิด Treatment Work Order ก่อนปิด Disease Incident

## 8. Stop conditions

หยุดส่วนที่เกี่ยวข้องและเก็บหลักฐานเมื่อพบ Cross-Farm disclosure, wrong-tree
analysis, model output ถูกบันทึกเป็น confirmed diagnosis โดยไม่มี Agronomist,
คำแนะนำสารเคมีอัตโนมัติ, duplicate critical event, real media/data เข้า fixture,
secret exposure หรือ external action ที่ยังไม่มี approval
