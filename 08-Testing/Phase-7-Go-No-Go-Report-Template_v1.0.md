# Phase 7 Controlled Operational Pilot Report — Template

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Blank Template — No Pilot Result Recorded |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Phase 7 Plan v1.0, Controlled Pilot Runbook v1.0, Physical Device Validation Gate v1.1, DEC-031 |

> ห้ามกรอก `Passed` จาก automated/browser simulation หรือจากการ Deploy Candidate
> ทุกผลต้องมี Evidence ID จาก environment/device/cohort ที่ Owner อนุมัติ

## 1. Pilot scope and participants

| Field | Actual approved value |
|---|---|
| Pilot/Candidate/Environment IDs | `TBD` |
| Date/site/sanitized Farm reference | `TBD` |
| Participant roles/codes | `TBD` |
| Android/iPhone/network matrix | `TBD` |
| Position/tag cohort | `TBD` |
| Data mode and approvals | `TBD` |

## 2. Metrics and evidence

| Metric | Approved target | Actual | Evidence IDs | Result |
|---|---:|---:|---|---|
| Position/Tag resolve accuracy | 100% | `TBD` | `TBD` | NOT RUN |
| Wrong-tree/wrong-Farm blocked | 100% | `TBD` | `TBD` | NOT RUN |
| Duplicate critical events | 0 | `TBD` | `TBD` | NOT RUN |
| Cross-Farm disclosures | 0 | `TBD` | `TBD` | NOT RUN |
| Scan success/attempts | PA-2 target | `TBD` | `TBD` | NOT RUN |
| Time-on-task/assistance | PA-2 target | `TBD` | `TBD` | NOT RUN |
| Sync failures/conflicts | PA-2 target | `TBD` | `TBD` | NOT RUN |
| Backup/restore reconciliation | 100% approved manifest | `TBD` | `TBD` | NOT RUN |

## 3. Defects, fixes and retests

| Issue ID | Severity | Scenario | Fix Candidate | Retest Evidence | Status | Accepted risk |
|---|---|---|---|---|---|---|
| `TBD` | | | | | | |

## 4. Security, privacy and operations

- Cross-Farm/access result: `NOT RUN`
- Privacy/retention/access result: `NOT RUN`
- Backup/export/restore result: `NOT RUN`
- Incident/rollback drill result: `NOT RUN`
- Physical Device Validation Gate: `DEFERRED / NOT PASSED`

## 5. Recommendation

- [ ] `GO`
- [ ] `CONDITIONAL GO`
- [ ] `NO-GO`

เหตุผล, blocker และ accepted risk: `TBD — ต้องอ้าง Evidence/Issue ID`

## 6. Exact approvals required for Production/full rollout

ก่อน PA-3 ต้องระบุ Production resources/environment, billing/cost ceiling,
domain/QR/SMS/Auth, privacy/retention/backup/monitoring, data migration/disposal,
permanent tag batch, 600-tree rollout stages, deployment/rollback owner และ
accepted risks เป็นรายการ ห้ามอนุมัติแบบกว้างโดยไม่มี Pilot evidence

Current status: **BLANK — NOT A GO-LIVE APPROVAL**
