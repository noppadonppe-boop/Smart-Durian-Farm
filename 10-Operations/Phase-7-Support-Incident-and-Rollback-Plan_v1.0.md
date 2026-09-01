# Phase 7 Support, Incident & Rollback Plan

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.1 |
| สถานะ | Draft — Contacts and Environment Pending PA-1/PA-2 |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Phase 6 Monitoring & Incident Plan v0.1, Phase 7 Runbook v1.2, Owner Mockup Input Pack v1.0, DEC-027, DEC-031 |

## 1. Support coverage

| Item | Required value |
|---|---|
| Pilot support window/timezone | `TBD` |
| Primary/backup support codes | `TBD` |
| Incident commander | `TBD` |
| Privacy contact | `TBD` |
| Deployment/rollback owner | `TBD` |
| Escalation channel | `TBD — keep personal contact outside repository` |
| Response targets by severity | `TBD` |

ค่า support code/window/response target สำหรับ dry-run อยู่ใน Owner Mockup Input
Pack v1.0 และยังไม่ใช่ contact/SLA จริง ทุกช่องในตารางนี้คง `TBD` จน PA-1/PA-2

## 2. Severity and action

| Severity | Example | Immediate action |
|---|---|---|
| Critical | Cross-Farm allow, wrong-tree action, secret/real-data leak, duplicate irreversible event, corrupt audit/restore | stop affected Pilot, revoke/rollback, preserve evidence, notify Owner |
| High | revoked user succeeds, queue loses data, restore count mismatch, photo evidence attached wrong Work | hold affected scenario, contain, fix/retest |
| Medium | sync stuck, incomplete export, recoverable photo failure | log issue, workaround if approved, schedule retest |
| Low | visual/content/performance defect without data/right impact | backlog or fix within Candidate cycle |

## 3. Incident record

บันทึก Incident ID, Candidate/environment, time, actor code/role, Farm/target scope,
expected/actual, evidence IDs, severity, containment, before/after, correction,
retest, resume/rollback decision และ residual risk ห้ามบันทึก OTP/secret/ชื่อ/เบอร์จริง

## 4. Rollback triggers

- Critical incident ใด ๆ
- deployment smoke/Cross-Farm denial/restore rehearsal ไม่ผ่าน
- error rate/queue age/duplicate/Storage usage เกิน threshold ที่ Owner อนุมัติ
- ไม่สามารถ revoke participant หรือหยุด access ได้ตามเวลาที่กำหนด
- Candidate checksum/config ไม่ตรง manifest

## 5. Rollback procedure

1. Owner/Incident Commander ระบุ scope และสั่ง HOLD/STOP
2. ปิด invitation/participant access และหยุด mutation ที่ได้รับผล
3. preserve logs/evidence/config/manifest โดยไม่แก้ original audit
4. rollback ไป Candidate ที่อนุมัติหรือปิด service ตาม PA-1
5. reconcile database/Storage/queue/audit และ run Cross-Farm tests
6. เปิด correction/incident events; ห้ามแก้ประวัติเงียบ ๆ
7. Owner อนุมัติ resume หลัง fix + regression + restore checks ผ่าน

คำสั่ง/provider-specific steps ต้องเติมหลัง PA-1 โดยห้ามใส่ secret ในเอกสารนี้
