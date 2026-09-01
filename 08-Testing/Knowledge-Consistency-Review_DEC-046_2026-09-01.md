# รายงานตรวจความสอดคล้อง Knowledge — DEC-046 v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Passed — Knowledge Updated and Cross-Checked |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | Limited Operational Tree Register Data Entry |
| Source of Truth | `AGENTS.md`, `.agents/skills/kdoms-development-knowledge/SKILL.md`, `00-Project-Management/Decision-Log.md` (DEC-046), `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md` |

## 1. ผลการตรวจ

Knowledge หลักได้รับการปรับให้สอดคล้องกับ DEC-046 แล้ว โดยแยกข้อยกเว้นสำหรับ
ข้อมูลทะเบียนต้นใช้งานจริงออกจาก baseline แบบ Mock-first อย่างชัดเจน และไม่ขยาย
ข้อยกเว้นไปยังรูปจริง, QR/ป้ายถาวร, โมดูลอื่น, External Pilot หรือการ Deploy

## 2. ข้อกำหนดที่ยืนยันตรงกัน

1. ข้อมูลทะเบียนต้นจริงสร้างได้เฉพาะ Firebase Production และ Farm ที่
   trusted-provision เป็น `classification=OPERATIONAL`, `isMock=false`
2. Mock adapter, Firebase Emulator และ Farm จำลองต้องคง
   `SIMULATED/TEST ONLY` และ `exampleData=true`
3. ปุ่ม `เพิ่มสวน` ปัจจุบันยังสร้าง Farm จำลองเท่านั้น; client เปลี่ยน
   classification เป็น `OPERATIONAL` ไม่ได้
4. ต้องยืนยัน Farm, Zone, Row, ลำดับตำแหน่ง, ทิศทาง และ Tag preview ก่อนสร้าง
   ตัวตน Planting Position ถาวร
5. ตำแหน่ง `ไม่มีต้น` ต้องไม่สร้างข้อมูลต้น/รอบปลูก/การสำรวจที่ขัดแย้งกัน
6. Position, Planting Cycle, Event, Tag และ route ที่เกี่ยวข้องต้องมี classification
   สอดคล้องกันและ fail closed เมื่อมีการปะปนหรือข้าม Farm
7. การอนุมัติ source/knowledge ไม่ใช่คำสั่ง Deploy และไม่อนุมัติรูปจริง,
   QR production domain, การพิมพ์ป้าย, Controlled Pilot หรือ Production rollout

## 3. เอกสารที่ตรวจและปรับ

| เอกสาร | เวอร์ชัน/ผล |
|---|---|
| Development, Mock Data & Pilot Knowledge | v1.0.6 — เพิ่มข้อยกเว้นและ environment gate ของ DEC-046 |
| Scope Knowledge | v0.2.5 — เพิ่มขอบเขตฟอร์ม/ข้อมูลและแก้ Gate ปัจจุบัน |
| Codex Master Prompt | v1.1.4 — เพิ่ม operational Tree Register rule ใน prompt หลัก |
| Farm Profile and Management Knowledge | v0.1.1 — แยก client Mock Farm กับ trusted Operational Farm |
| Orchard Layout and Target Selection Knowledge | v0.1.1 — อนุญาตอ่าน topology จริงเฉพาะ Tree Register scope |
| UX/UI Knowledge | v0.1.5 — กำหนดหน้าต่าง 3 ส่วนและข้อความตาม classification |
| Tag and QR Standard | v0.1.2 — แยก Tag identity registration จาก QR/ป้ายจริง |
| Architecture Baseline | v0.2 — เพิ่ม classification inheritance และ current Gate boundary |
| Phase Prompts | v1.0.2 — เพิ่ม Operational Addendum หลัง Phase 3 |
| Phase 3 Plan / Data Dictionary / Phase 3 Architecture | อัปเดตเงื่อนไขข้อมูลจริง, field และ validation แล้ว |
| AGENTS.md / KDOMS development skill / Decision Log | บันทึก boundary และ DEC-046 แล้ว |

## 4. วิธีตรวจสอบ

- ตรวจว่าเอกสาร Source of Truth และ Owner Addendum ที่อ้างถึงมีอยู่จริง
- ตรวจข้อความ `DEC-046`, `OPERATIONAL`, `isMock=false` และ boundary ของ
  `exampleData=false` ในเอกสารที่เกี่ยวข้อง
- ตรวจข้อความห้ามใช้ข้อมูลจริงแบบเดิมว่าได้เพิ่มข้อยกเว้นจำกัดโดยไม่เปิดขอบเขตอื่น
- ตรวจรูปแบบ diff แล้ว ไม่พบ trailing whitespace หรือ patch error
- ไม่แก้เอกสารหลักฐานเชิงประวัติย้อนหลัง; ใช้ลำดับอำนาจของเอกสารล่าสุดแทน

## 5. Acceptance criteria

- [x] Decision Log มี DEC-046 สถานะ `Approved`
- [x] Owner Addendum ระบุขอบเขตและข้อห้ามที่ตรวจสอบได้
- [x] Knowledge หลักไม่มีข้อขัดแย้งกับ Mock-first baseline
- [x] Mock/Operational classification แยกแบบ fail-closed
- [x] UX, Tag, Farm, Layout และ Architecture ใช้ boundary เดียวกัน
- [x] ไม่มีข้อความตีความว่าการอัปเดต Knowledge เท่ากับการ Deploy

## 6. ข้อเสนอ ข้อสันนิษฐาน และคำถามที่ยังเปิด

### ข้อเสนอ

- ก่อนเปิดใช้งานจริง ให้จัดทำ Activation Checklist ระบุ Farm ID, Organization ID,
  membership, ผู้อนุมัติ Zone/Row/ทิศทาง และ backup/rollback destination

### ข้อสันนิษฐาน

- Source รุ่นที่ผ่านการทดสอบยังไม่ได้รับคำสั่ง Deploy เพิ่มในงานตรวจ Knowledge นี้

### คำถามที่ต้องตัดสินใจก่อน Activation

- Farm ใดจะถูก trusted-provision เป็น `OPERATIONAL` และใช้รหัส `Fxx` ใด
- Zone/Row/ทิศทางนับจริงใดได้รับการยืนยันแล้ว
- ผู้ทำหน้าที่ Operator และ Approver สำหรับการเปิดใช้งาน/rollback คือใคร

## 7. Gate ปัจจุบัน

Gate 6 ผ่านแล้วและโครงการอยู่ Phase 7 readiness; DEC-046 อนุมัติ limited
operational Tree Register data entry ในระดับ Knowledge/source แต่การ Deploy หรือ
Activation ต้องได้รับคำสั่งและข้อมูล Owner ที่จำเป็นแยกต่างหาก
