# Phase 7 Photo Data Governance Decision Sheet

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.3 |
| สถานะ | External PA-1 NO-GO/BLOCKED — Actual Values TBD; No Real Data/Enforcement Approved |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | External PA-1 Owner Review Decision v1.2, Candidate Manifest v0.9, DEC-017, DEC-034, DEC-036, DEC-038, Privacy Review v0.3, Backup Drill v1.2, Photo Lifecycle Architecture v1.0 |

## 1. ผู้รับผิดชอบและ Separation of Duties

ค่า `SIMULATED/TEST ONLY` ใน Owner Mock Substitute ไม่ใช่ผู้รับผิดชอบจริง
Owner ต้องกรอกรหัสที่ map ถึงบุคคลจริงในทะเบียนจำกัดสิทธิ์นอก repository

| Decision | Owner actual value | เกณฑ์บังคับ |
|---|---|---|
| Data/Privacy Custodian code | `TBD` | อนุมัติ access, retention, export, hold และ disposal |
| Backup/Restore operator code | `TBD` | ดำเนิน backup/restore; ห้ามอนุมัติงานตนเอง |
| Independent backup approver code | `TBD` | ต้องต่างจาก operator |
| Lifecycle/Deletion operator code | `TBD` | รัน worker ตาม manifest |
| Lifecycle/Deletion approver code | `TBD` | ต้องต่างจาก deletion operator |
| Encryption key custodian code | `TBD` | แยกจาก storage operator เท่าที่ทำได้ |
| Recovery key custodian/escrow code | `TBD` | วิธีฉุกเฉินและ revoke ต้องมี audit |
| Incident/Data breach owner code | `TBD` | ตัดสิน contain/notify ตามข้อบังคับที่ใช้จริง |

## 2. Destination, Region และ Key Custody

| Decision | Owner actual value | สิ่งที่ต้องตรวจ |
|---|---|---|
| Primary Pilot Storage provider/project/bucket | `TBD` | private, Farm/Work scope, no public token |
| Primary region/data location | `TBD` | privacy/legal/latency/cost |
| Backup destination/provider | `TBD` | แยก failure domain ตามที่อนุมัติ |
| Backup region/data location | `TBD` | cross-region/legal/cost decision |
| Encryption at rest/in transit | `TBD` | algorithm/provider control และ evidence |
| Key service/key identifier (ไม่ใส่ secret) | `TBD` | rotation, revoke, restore access |
| Scheduler/runtime/service identity | `TBD` | least privilege; แยก deploy/runtime identity |
| Evidence/export destination | `TBD` | expiry, revoke, download audit |

ห้ามใส่ secret, service-account key, recovery key หรือ download token ในเอกสารนี้

## 3. Retention/RPO/RTO — Owner ต้อง Accept หรือ Change

| Policy | Recommended baseline | Owner decision | Owner value/reason |
|---|---:|---|---|
| Work instruction/BEFORE/AFTER photo | Pilot close + 90 วัน | `TBD: ACCEPT / CHANGE` | `TBD` |
| Selected Pilot evidence | PA-3 decision + 180 วัน | `TBD: ACCEPT / CHANGE` | `TBD` |
| Work/audit/recovery metadata | Pilot close + 365 วัน | `TBD: ACCEPT / CHANGE` | `TBD` |
| Encrypted backup rolling window | 30 วัน | `TBD: ACCEPT / CHANGE` | `TBD` |
| Ad-hoc export package | 7 วัน | `TBD: ACCEPT / CHANGE` | `TBD` |
| Device cache/Durable binary queue | ไม่เกิน 7 วัน; clear logout/commit | `TBD: ACCEPT / CHANGE` | `TBD` |
| Orphan grace ก่อน server deletion | `TBD` | `TBD: SET VALUE` | `TBD` |
| Pilot RPO | ≤24 ชั่วโมง | `TBD: ACCEPT / CHANGE` | `TBD` |
| Pilot RTO | ≤8 ชั่วโมง | `TBD: ACCEPT / CHANGE` | `TBD` |

ทุกการเปลี่ยนค่าต้องระบุเหตุผล, effective date, data class, legal/business hold,
ผู้อนุมัติ และผลกระทบค่าใช้จ่าย ห้ามเปลี่ยน production configuration เงียบ ๆ

## 4. Approval Placement

- **PA-1:** provider/project, destination, region, billing/cost, service identity,
  backup architecture, key custody, operator/approver และ RPO/RTO ที่จะใช้กับ
  Pilot Candidate
- **PA-2:** Data Custodian, real-photo purpose/notice/consent, retention/disposal,
  export rights, orphan grace, evidence destination และ permission ให้เปิด
  lifecycle worker กับข้อมูลจริง
- **PA-3:** รับ actual RPO/RTO, restore/disposal evidence และค่าที่จะ carry ไป
  Production หรือสั่งแก้ก่อน Go-Live

## 5. Owner Decision Record

| รายการ | ค่า |
|---|---|
| External PA-1 environment/resource approval reference | `DEC-038 — NO-GO / BLOCKED` |
| PA-2 approval reference | `TBD / NOT APPROVED` |
| Owner approver code | `TBD` |
| Data Custodian acceptance code | `TBD` |
| Effective date/time | `2026-09-01` |
| Exceptions/accepted risks | `TBD` |

Current decision: **NO-GO / HOLD ตาม DEC-038 — ห้าม External Resource, Real Data,
Backup หรือ Lifecycle ENFORCE จนกว่าจะมี Owner Review ใหม่และข้อความ GO**

หมายเหตุ 2026-09-01: Source drift ถูก remediated และมี clean Local Candidate
`KDOMS-PC-SIM-20260901-04` แล้ว แต่ Candidate เป็น
`FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE` และไม่เติมค่า `TBD` ใดในเอกสารนี้
ดังนั้น governance blocker และ DEC-038 ยังคงเดิม
