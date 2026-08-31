# Phase 0 Plan — Product & Documentation Readiness

| รายการ | ค่า |
|---|---|
| โครงการ | Smart Durian Farm / KDOMS |
| เวอร์ชัน | 0.2 |
| สถานะ | Proposed — Owner Review Required |
| เจ้าของเอกสาร | Project Owner |
| Gate 0 | Not passed |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Decision-Log.md` |

## 1. เป้าหมาย Phase 0

ทำให้ทีมมีคำตอบที่ตรวจสอบได้สำหรับคำถามต่อไปนี้ก่อนเริ่มเขียนแอป:

- แอปแก้ปัญหาอะไรให้เจ้าของสวน ผู้จัดการ และคนสวน
- โครงสร้าง Multi-Farm และสิทธิ์ทำงานอย่างไร
- Human-readable Tag namespace และแผนตรวจ Farm/Zone/Row/Tree ชัดเจนหรือไม่
- ข้อมูลใดต้องเก็บระดับต้น กลุ่มงาน รอบผลผลิต และการขาย
- ขั้นตอนงานภาคสนามรองรับออฟไลน์และการยืนยันต้นอย่างไร
- MVP รวมและไม่รวมอะไร
- เกณฑ์ที่ใช้อนุมัติเริ่ม Phase 1 คืออะไร

## 2. Deliverables

| Deliverable | ที่อยู่ | สถานะ |
|---|---|---|
| Project rules | `AGENTS.md` | Drafted |
| Master Prompt | `01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md` | Drafted |
| Scope Knowledge v0.2 | `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md` | Drafted |
| Proposed Role/Access Matrix | `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md` | Proposed |
| Field Survey Template | `02-Field-Survey/Field-Survey-Template_v0.1.md` | Drafted |
| Tree Import Template | `03-Tree-Data/tree-register-import-template.csv` | Drafted |
| Tree Data Dictionary | `03-Tree-Data/Tree-Register-Data-Dictionary_v0.1.md` | Proposed |
| Tag & QR Standard | `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md` | Drafted |
| UX/UI Knowledge | `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md` | Drafted |
| Interactive UX Preview | `05-UX-UI/kdoms-mobile-ux-preview.html` | Drafted |
| Architecture Baseline | `06-System-Architecture/Architecture-Baseline_v0.1.md` | Drafted |
| Gate 0 Checklist | `08-Testing/Gate-0-Acceptance-Checklist.md` | Drafted |

## 3. Workstreams

### 3.1 Product and users

- ยืนยันชื่อผลิตภัณฑ์และชื่อที่แสดงในแอป
- สัมภาษณ์เจ้าของสวน ผู้จัดการ และคนสวนอย่างน้อยกลุ่มละ 1 คนถ้ามี
- จัดลำดับ 5 งานที่ทำบ่อยที่สุดและ 5 ปัญหาที่เสียเวลามากที่สุด
- ยืนยันภาษา อุปกรณ์ และความชำนาญด้านดิจิทัลของผู้ใช้

### 3.2 Field Validation planning

- กำหนดวิธีเสนอ Organization Code/Farm Sequence ของพื้นที่ตรวจ
- เตรียมขั้นตอนสำรวจ Zone, Row, ทิศทางการนับ และจุดเข้าออก
- เตรียมเกณฑ์ตรวจว่าทุกตำแหน่งมีรหัสไม่ซ้ำและค้นหาจากทางเดินได้
- ยืนยันว่า GPS เป็นข้อมูลช่วยนำทาง ไม่ใช่ตัวตนหลัก

### 3.3 Tree data definition

- สร้าง Data Dictionary และ CSV ที่แยก Example/Field Data
- ระบุ unknown, estimated, measured และ source/confidence
- กำหนด evidence fields ของ trunk, canopy และ height
- เตรียมแผนเก็บข้อมูล 30–50 ต้นสำหรับ Field Validation Gate

### 3.4 Prototype workflow validation

- ทดลองสร้างงานระดับต้นและระดับกลุ่ม
- สาธิต Farm switch, Scan, mismatch, Worker Report และ Manager Verify
- จำลองกรณีสแกนผิดต้น, Offline/Pending และ Request Rework
- เตรียม scenario/metric สำหรับทดสอบผู้ใช้จริงใน Field Validation/Phase 7

### 3.5 Technical definition

- ยืนยัน Vite + React + TypeScript + Firebase เป็น baseline
- ร่าง Security Rules matrix และ Cross-Farm tests
- นิยาม offline queue, idempotency key และ conflict policy
- กำหนด dev/test/prod environments โดยยังไม่สร้าง production

## 4. Gate 0 Exit Criteria

Gate 0 ผ่านเมื่อเจ้าของโครงการอนุมัติครบทุกข้อ:

- [ ] Scope v0.2 และ MVP In/Out
- [ ] Working Proposal สำหรับ Organization/Farm, Canonical Roles และ Role Matrix
- [ ] Human Tag namespace, opaque IDs และ QR route/authorization boundary
- [ ] Field Validation Plan สำหรับ topology, ป้าย 5–10 ป้ายและ Tree Survey 30–50 ต้น
- [ ] UX Prototype: เลือกสวน → Scan → Worker Report → Manager Verify/Rework
- [ ] Data Dictionary และข้อมูลบังคับของ Tree/measurement รวมถึง MVP domains
- [ ] Offline/Sync/Conflict proposal และผู้ review/escalation
- [ ] Security and privacy baseline
- [ ] Owner ระบุว่า Working Proposal ใด Approved/Open/Deferred โดยไม่เหลือ
      Blocker ที่ป้องกัน Foundation
- [ ] มีข้อความอนุมัติ “Gate 0 ผ่าน อนุมัติเริ่ม Phase 1”

## 5. Field Validation Gate — ก่อนล็อก Phase 3

- สำรวจ Zone/Row/ทิศทางนับและยืนยันรหัสจริง
- ทดลองป้าย 5–10 ป้ายกับแดด ฝน อุปกรณ์และการเดินงานจริง
- เก็บ Tree Survey 30–50 ต้นตาม Data Dictionary
- ตรวจ duplicate, measurement evidence และ QR/manual fallback
- บันทึกผลและ Owner sign-off ก่อนผลิตป้ายจริงและ Phase 3 sign-off

Field Validation Gate ไม่ถูกตัดออกจากโครงการ แต่ย้ายให้อยู่ก่อนการล็อก
Tree/Tag implementation ซึ่งเป็นจังหวะที่ใช้หลักฐานได้จริง

## 6. Phase 7 boundary

Phase 7 คือ **Operational Application Pilot** ใช้แอปที่ผ่าน Gate 6 กับผู้ใช้จริง
เพื่อทดสอบ end-to-end, offline retry, cross-farm, backup/export และ readiness
ก่อนขยายประมาณ 600 ต้น ไม่ใช่การเริ่มสำรวจ topology/tag เป็นครั้งแรก

## 7. สถานะปัจจุบัน

**Gate 0: NOT PASSED**

เหตุผล: เอกสาร remediation และ Working Proposals ต้องผ่าน Owner Review;
DEC-015 ยังคง `Blocked` และงานนี้ไม่เปลี่ยน Gate status
