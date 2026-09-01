# Phase 7 Role Training Guide — Owner, Manager, Worker

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Draft — Use Only in Owner-Approved Controlled Pilot |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | UX/UI Knowledge v0.1.2, Phase 7 Runbook v1.0, Role/Access Matrix, DEC-030, DEC-031 |

## 1. กติกาก่อนเรียน

- ใช้ Candidate/environment/account ที่ Owner อนุมัติเท่านั้น
- ห้ามแชร์บัญชี, OTP, screenshot ที่มีข้อมูลนอก scope หรือส่งลิงก์ Pilot ต่อ
- ผู้เรียนต้องบอกได้เสมอว่าอยู่สวนใด role ใด และสถานะ Online/Offline ใด
- เมื่อเห็นข้อมูลผิดสวน ทำงานผิดต้น หรือข้อมูลซ้ำ ให้หยุดและแจ้ง Issue ID

## 2. Owner — 30 นาที

หัวข้อ: Farm/Portfolio ตามสิทธิ์, member/revoke boundary, Dashboard, audit/export,
incident/rollback, backup/restore decision และ Go/No-Go

Competency:

- [ ] เปิด Farm/Portfolio โดยไม่เห็น hidden Farm
- [ ] ตรวจ audit ว่าใครทำอะไร เมื่อใด ในสวนใด
- [ ] ตรวจ/อนุมัติ export และบอกตำแหน่งหลักฐานได้
- [ ] สั่ง HOLD/STOP และระบุ rollback owner ได้
- [ ] แยก Pilot Candidate, Controlled Pilot และ Production ได้

## 3. Farm Manager — 40 นาที

หัวข้อ: สร้าง/Assign Work Order, รูปอ้างอิง, ทีมงาน, conflict, photo recovery,
Verify/Request Rework, Care/Disease escalation และ Farm Dashboard

Competency:

- [ ] มอบหมายงานใน Farm ถูกต้องและรูปอ้างอิงล็อกหลัง Assign
- [ ] ตรวจ expected/actual target และ BEFORE/AFTER แยกกันได้
- [ ] Approve/Rework พร้อมเหตุผลและเห็น audit
- [ ] แก้ conflict โดยไม่เขียนทับประวัติเงียบ ๆ
- [ ] หยุดเมื่อ Cross-Farm/wrong-tree/duplicate/restore issue

## 4. Worker — 40 นาที

เส้นทางมาตรฐาน:

```text
ตรวจชื่อสวน → งานของฉัน → เปิดรูปอ้างอิง → นำทาง/สแกน
→ ยืนยัน Match → ทำงาน → แนบ BEFORE/AFTER → ส่งหรือบันทึกในเครื่อง
```

Competency:

- [ ] บอก Farm/Zone/Row/Position และงานที่กำลังทำได้
- [ ] เมื่อ Mismatch/Wrong-Farm ให้หยุด ไม่ทำงานเดิม และแจ้งผู้จัดการ
- [ ] ใช้ manual fallback โดยไม่เดารหัส
- [ ] แยก `บันทึกในเครื่อง`, `กำลังซิงก์`, `ซิงก์แล้ว`, `ข้อมูลขัดแย้ง`
- [ ] แนบ BEFORE ≥1 และ AFTER ≥1 รวม ≤6 และรอ upload success ก่อนส่ง
- [ ] ไม่ยืนยัน diagnosis/chemical treatment เองเมื่อ policy ยังไม่อนุมัติ

## 5. Trainer observation

| Participant code | Role | Scenario IDs | Unassisted | Assistance count | Critical mistake | Retrain/retest | Evidence ID |
|---|---|---|---|---:|---|---|---|
| | | | | | | | |

ผู้เรียนผ่าน training เฉพาะเมื่อทำ role-critical scenario โดยไม่มี wrong-Farm,
wrong-tree, duplicate submission หรือ unauthorized action และมี Evidence ID
