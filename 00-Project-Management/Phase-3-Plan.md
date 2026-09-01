# Phase 3 Plan — Tree Register & QR

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.2 |
| สถานะ | Implemented — Operational Tree Register Form Ready; Deployment and Physical Validation Pending |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `00-Project-Management/Owner-Review-Addendum_Gate-3_2026-08-31.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md`, `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md` |

## 1. เป้าหมาย

สร้าง Tree Register ที่แยกตาม Farm และรักษาตัวตนของ Planting Position ผ่าน
Human Tag + opaque `positionId` พร้อม Planting Cycle history, Excel/CSV import และ
QR confirmation โดยรองรับ limited operational Tree Register data ตาม DEC-046
เฉพาะ Firebase Production + Farm จริง และคง Mock/Emulator/Farm จำลองแยกจากกัน

## 2. แผนงานที่ดำเนินการ

1. บันทึก Gate 2 approval และกำหนด Phase 3 boundary
2. สร้าง Zone/Row/Position/Cycle domain model และ Tag/QR utilities
3. สร้าง Tree list, detail, search/filter, create/edit/archive และ timeline
4. สร้าง Excel Template ที่เปิดใน Microsoft Excel/Google Sheets และรองรับนำเข้า
   `.xlsx`/`.csv` พร้อม 49-column preview, duplicate/reject และ idempotency
5. สร้าง QR camera shell/native detector, manual fallback และ scan states
6. เพิ่ม Firebase repository, Firestore Rules และ Cross-Farm tests
7. ตรวจ mobile/desktop, offline runtime และจัดทำ Gate 3 evidence
8. ปรับหน้าจอเพิ่ม/แก้ไขเป็นฟอร์มภาษาไทยแบบแบ่งส่วน รองรับ Zone/Row confirmation,
   ข้อมูลต้น/รอบปลูก และ measurement evidence พร้อมจำแนกข้อมูลจริง/ข้อมูลจำลอง

## 3. Permission baseline

- ทุก role ที่มี active membership อ่านทะเบียนใน Farm ที่มีสิทธิ์ได้
- `ORG_OWNER` และ `FARM_MANAGER` จัดการ Position/Planting Cycle
- `AGRONOMIST` ถูกจำกัดเป็น read-only สำหรับ master data จนกว่า policy `W*`
  ใน Role Matrix จะมีรายละเอียดที่อนุมัติ
- `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST`, `WORKER` รายงานป้ายชำรุดได้
- `VIEWER`, `AUDITOR`, `SALES_INVENTORY` ไม่แก้ Tree master

## 4. Data invariants

- Tag ระบุตำแหน่งถาวรและห้าม reuse แม้ Position ถูก Archive
- ปลูกทดแทนเพิ่ม `plantingCycle + 1`; Tag/opaque `positionId` เดิมไม่เปลี่ยน
- Opaque IDs unique ทั้งระบบ และ Human Tag ไม่ใช้เป็น authorization
- QR payload เป็น configurable base URL + `/t/{opaquePositionId}`
- Excel/CSV ไม่รับ internal ID, ปฏิเสธ `EXAMPLE`, ตรวจ Farm context และเขียนแบบ atomic
- Google Sheets ใช้ file handoff โดยดาวน์โหลดเป็น `.xlsx`/`.csv`; ไม่มี Google API
- Event สำคัญเป็น append-only timeline พร้อม actor, Farm, Position และ version

## 5. Out of scope ที่ยังคงอยู่

- รูปสวน/ต้น/บุคคลจริงผ่าน Firebase Storage
- production QR domain, การ encode/พิมพ์ QR และการผลิตป้ายถาวร
- GPS เป็น primary identity
- Work Order, treatment, fruit, harvest, sales และ inventory
- Deployment source รุ่นนี้, billing/credential change, PA-2, Controlled Pilot และ
  operational rollout นอก limited Tree Register scope ของ DEC-046

## 6. Gate position

Implementation, spreadsheet enhancement และ automated validation เสร็จแล้ว
Gate 3 ผ่านตาม Owner Addendum โดย **Physical Device/Field Validation ยัง
Deferred / Not Passed** และไม่ถูกยกระดับจากผล browser/local test

DEC-046 อนุมัติ limited operational Tree Register data entry เฉพาะ Firebase
Production + Farm จริง แต่ source รุ่นนี้ยังไม่ได้ Deploy และ Physical Device/Field
Validation ยัง `Deferred / Not Passed` ขั้นตอนถัดไปคือ Owner อนุมัติ deployment
ของรุ่นนี้และกำหนด Farm จริง/Topology ก่อนเริ่มกรอกข้อมูลภาคสนาม รูปจริง, QR จริง,
ป้ายถาวร, PA-2 และ rollout โมดูลอื่นต้องขออนุมัติแยก
