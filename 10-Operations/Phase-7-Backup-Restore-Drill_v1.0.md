# Phase 7 Backup, Export & Restore Drill

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Superseded by v1.1 — Pilot Data Drill Pending Approval |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | Phase 6 Backup/Export/Restore Draft v0.1, Phase 7 Plan v1.0, Privacy Review v0.1, DEC-017, DEC-031 |

## 1. Approval boundary

Local Emulator/Mock reset rehearsal ทำได้ตาม Gate 6 ส่วน external backup target,
key, Pilot data export และ restore ต้องได้รับ PA-1/PA-2 ตามข้อมูลที่ใช้

## 2. Required metadata

| Field | Value |
|---|---|
| Drill ID/Candidate ID | `TBD` |
| Source/target environment | `TBD` |
| Organization/Farm scope | `TBD` |
| Backup operator / approver | `TBD / TBD` |
| Restore operator / verifier | `TBD / TBD` |
| Destination/region/encryption/key custody | `TBD` |
| RPO/RTO and retention | `TBD` |

## 3. Procedure

1. ยืนยัน approval, maintenance window, source scope และ isolated empty target
2. สร้าง record/object manifest พร้อม counts, sizes และ checksums
3. export database + Storage inventory ด้วย server-side identity ที่อนุมัติ
4. เข้ารหัส/จัดเก็บตาม approved destination; ห้าม public link หรือ repository
5. restore database ไป isolated target และตรวจ referential integrity
6. restore/reconcile Storage; ระบุ missing/orphan object
7. ทดสอบ membership/Cross-Farm denial, Tree/Work/Sales trace, audit immutability,
   photo purpose และ duplicate offline replay
8. วัด duration/data-loss window และบันทึก Issue/Evidence ID
9. Owner/Auditor ตัดสิน Pass/Repeat/Fail และอนุมัติ disposal ของ target

## 4. Pass criteria

- collection/object counts และ checksum ตรง approved manifest
- ไม่มีข้อมูลข้าม Farm และ unauthorized role อ่านไม่ได้
- audit/history/references ไม่เสีย; duplicate replay เพิ่ม event = 0
- export columns ตรง allowlist/formula protection และมี audit
- RTO/RPO อยู่ในค่าที่ Owner อนุมัติ; issue ทั้งหมดมี disposition

Restore mismatch หรือไม่สามารถ revoke target access เป็น High/Critical และห้าม
เสนอ Go-Live จนกว่าจะ retest ผ่านหรือ Owner ยอมรับ risk เป็นรายการ
