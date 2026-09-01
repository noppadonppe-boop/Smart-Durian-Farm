# Phase 6 Backup, Export & Restore Draft

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Draft — Procedure Design Only; Not Authorized for Production/Pilot Execution |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | AGENTS.md v2.4, Phase 6 Plan, Phase 6 Architecture v0.1, Development/Mock Data/Pilot Knowledge v1.0, DEC-017, DEC-019, DEC-027 |

## 1. ขอบเขต

เอกสารนี้กำหนดขั้นตอนร่างสำหรับ Farm-scoped audit export, backup และ restore drill
เท่านั้น Phase 6 ทดสอบด้วย Mock Data Pack/Firebase Emulator ไม่มีการสร้าง bucket,
schedule, key, Production backup หรือส่งข้อมูลออกนอกเครื่อง

## 2. Data classes และสิทธิ์

| รายการ | สิทธิ์ขั้นต่ำ | รูปแบบ Phase 6 |
|---|---|---|
| Operational audit export | ORG_OWNER, FARM_MANAGER, AUDITOR | Farm-scoped CSV, minimal columns, audited |
| Application backup | Operator ที่ Owner อนุมัติ — `TBD` | Draft only |
| Restore execution | Operator + ผู้อนุมัติแยก — `TBD` | Emulator drill only |
| Restore verification | Farm Manager/Auditor — `TBD` | checklist + reconciliation |

Export ต้องไม่รวมหมายเลขโทรศัพท์, credential,ละเอียดพิกัด,รูปจริง หรือข้อมูลอีกสวน
CSV ต้องผ่าน formula protection และห้ามเผยแพร่ด้วย public link

## 3. Backup procedure ร่าง

1. บันทึก environment, dataset version, Farm scope และผู้อนุมัติ
2. หยุด mutation ตาม maintenance rule ที่จะอนุมัติภายหลัง
3. สร้าง database export และ Storage inventory จาก service-side process ที่ได้รับสิทธิ์
4. สร้าง manifest: record count ต่อ collection, object count/size และ checksum
5. เข้ารหัสด้วย key custody ที่แยกจาก backup; destination และ key owner เป็น `TBD`
6. ตรวจ manifest, audit การสร้าง และกำหนด retention/expiry
7. ห้าม commit backup, manifest ที่มีข้อมูลจริง หรือ key เข้า repository

## 4. Restore drill ร่าง

1. ใช้ isolated Emulator/approved non-production target เท่านั้น
2. ยืนยันว่า target ว่างและ Organization/Farm IDs ตรง approved restore scope
3. import database ก่อน แล้วตรวจ reference integrity ก่อนคืน Storage object
4. reconcile counts/checksums, memberships, Cross-Farm denial และ audit immutability
5. ทดสอบ sign-in, Dashboard, Tree/Work/Sales trace และ offline duplicate replay
6. บันทึก missing/orphan object, duration, data loss window และ remediation
7. Owner ตัดสิน accept/repeat; ห้าม promote target เป็น Production จาก drill นี้

## 5. Mock restore acceptance

- reset Phase 6 Pack แล้วได้ fixture/version/checksum เดิม
- record ไม่ข้าม Farm และ unauthorized role อ่านไม่ได้
- duplicate replay หลัง reset ไม่เพิ่ม event ซ้ำ
- export row count/columns ตรง allowlist และมี `EXPORT_CREATED` audit
- partial/orphan photo fixture คืนสถานะที่กำหนดทุกครั้ง

## 6. Open decisions before Controlled Pilot/Production

- backup destination, region, encryption, key custody และ operator
- RPO/RTO, schedule, retention และ legal/privacy retention
- Storage versioning/object lifecycle และ server-side orphan cleanup
- break-glass approval, rollback, evidence location และ incident escalation
- ค่าเหล่านี้ยัง `TBD` และเอกสารนี้ไม่ถือเป็น Production authorization
