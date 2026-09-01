# Phase 7 Backup, Export & Restore Drill

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.2 |
| สถานะ | Ready for Local Mock Rehearsal — External/Pilot Data Drill Pending PA-1/PA-2 |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Privacy/Retention/Access Review v0.3, Photo Data Governance Decision Sheet v1.0, Phase 7 Plan v1.5, DEC-017, DEC-031, DEC-034, DEC-036 |

## 1. Baseline ที่เสนอสำหรับ PA-1/PA-2

- RPO ไม่เกิน 24 ชั่วโมง; RTO ไม่เกิน 8 ชั่วโมงสำหรับ Controlled Pilot
- encrypted rolling backup 30 วัน โดยมี daily และ weekly restore points
- destination, region, provider, encryption, key custody, operator/approver และค่าใช้จ่าย
  ยัง `TBD` และห้ามสร้าง external resource ก่อน PA-1
- ไม่สร้าง public link และไม่นำ backup/export/manifest เข้า repository

Owner ต้องระบุใน PA-1/PA-2: Data Custodian `TBD`, Backup operator `TBD`,
independent approver `TBD`, primary/backup destination `TBD`, region `TBD`,
key custodian `TBD` และ recovery-key custodian `TBD` โดย operator กับ approver
ห้ามเป็นรหัสเดียวกัน ค่า Mock Substitute ใช้แทนรายการจริงไม่ได้

## 2. Manifest บังคับ

| หมวด | รายการขั้นต่ำ |
|---|---|
| Database | collection/path, Farm, record count, export time, checksum |
| Work photo object | Farm, Work Order, opaque Photo ID, phase, MIME, bytes, checksum, recovery/orphan state |
| Access | Data Custodian, operator code, independent approver code, key custodian, purpose, grant/revoke time |
| Restore | isolated target, start/end, counts/checksums, mismatch, Issue/Evidence ID |

Manifest ห้ามเก็บ download token, secret, OTP, precise GPS หรือ public URL

## 3. Drill procedure

1. ยืนยัน PA-1/PA-2, Candidate ID, Farm scope, maintenance window และ isolated empty target
2. สร้าง database/object manifest และ checksum ก่อย้ายข้อมูล
3. export ด้วย server-side identity ที่ได้รับอนุมัติ และเข้ารหัสด้วย key แยกผู้ดูแล
4. restore database และ Storage ไป isolated target; reconcile missing/orphan/reference
5. ทดสอบ membership/Cross-Farm denial, Tree/Work/Sales trace, audit immutability,
   Photo Retry/Orphan Cleanup และ duplicate replay
6. วัด actual RPO/RTO และลง defect/retest ทุก mismatch
7. Owner/Auditor ตัดสิน Pass/Repeat/Fail และลบ isolated restore target ภายใน 24 ชั่วโมง

## 4. Pass criteria

- count/checksum ตรง manifest, ไม่มี Cross-Farm disclosure และถอนสิทธิ์ target ได้
- รูปกับ Work/phase/recovery state ตรงกัน; orphan ต้องถูกระบุไม่ใช่หายไปเงียบๆ
- actual RPO ≤ 24h, RTO ≤ 8h หรือมี Owner-accepted risk เป็นรายการ
- ไม่มี public artifact, key/secret รั่ว หรือ restore target ค้างหลัง drill

Current decision: **EXTERNAL DRILL HOLD — Pending PA-1/PA-2**
