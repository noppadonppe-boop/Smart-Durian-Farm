# Owner Review Addendum — Tree Register Operational Data Entry

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved — Limited Tree Register Operational Data Entry; Deployment Pending |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | คำสั่งล่าสุดของ Project Owner วันที่ 2026-09-01, `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Decision-Log.md` (DEC-046) |

## 1. คำตัดสินของเจ้าของโครงการ

เจ้าของโครงการสั่งให้เปลี่ยนหน้าจอ `เพิ่มตำแหน่งปลูกจำลอง` เป็น
`เพิ่มตำแหน่งปลูก` สำหรับเตรียมเริ่มใช้งานจริง และให้ใช้รูปแบบหน้าต่างที่แนะนำ
ซึ่งแยกข้อมูลเป็นส่วนชัดเจน ลดการกรอกข้อมูลผิด และรองรับการกลับมาแก้ไขภายหลัง

คำสั่งนี้อนุมัติให้ระบบรองรับ **ข้อมูลทะเบียนต้นภาคสนามจริงแบบจำกัดขอบเขต**
เมื่อใช้งานผ่าน Firebase Production และ Farm ปัจจุบันเป็น Farm จริง
(`isMock=false`) เท่านั้น

## 2. ขอบเขตที่อนุมัติ

- เพิ่มและแก้ไขตัวตนของตำแหน่งปลูกภายใน Farm ที่ผู้ใช้มีสิทธิ์
- เลือก Zone/Row ที่มีอยู่ หรือยืนยันการลงทะเบียน Zone/Row ใหม่
- บันทึกสถานะต้น วันที่ข้อมูลตั้งต้น พันธุ์/ความมั่นใจ ปีปลูก/ระบบปี/ความมั่นใจ
  แหล่งต้นพันธุ์ และหมายเหตุ
- บันทึก GPS, ลำต้น, ทรงพุ่ม และความสูงแบบเลือกกรอก โดยแต่ละกลุ่มต้องมี
  value/unit/method/measuredAt/measuredBy/confidence/source ครบ
- ปลูกทดแทนด้วย Planting Cycle ใหม่ โดยคง Position/Tag และประวัติเดิม
- เก็บ `exampleData=false` เฉพาะ Firebase Production + Farm จริง และคง
  `exampleData=true` สำหรับ Mock, Emulator และ Farm จำลอง
- ใช้ Firestore Rules บังคับ Farm membership, Cross-Farm denial, Tag no-reuse,
  append-oriented event และความสอดคล้องของชนิดข้อมูลจริง/ข้อมูลจำลอง

## 3. สิ่งที่คำสั่งนี้ยังไม่อนุมัติ

- ไม่ใช่คำสั่ง Deploy source รุ่นนี้ไป Firebase Hosting/Firestore โดยอัตโนมัติ
- ไม่อนุมัติ Firebase Storage หรือรูปต้น/บุคคล/สวนจริง
- ไม่อนุมัติการ encode/พิมพ์ QR หรือผลิตป้ายถาวร
- ไม่ยกระดับ Physical Device/Field Validation เป็น Passed
- ไม่เปิดข้อมูลจริงให้โมดูลอื่นที่ยังติดป้าย `SIMULATED/TEST ONLY`
- ไม่อนุมัติ PA-2, Controlled Pilot หรือ Operational Production rollout
  นอกขอบเขต Tree Register ที่ระบุในเอกสารนี้

## 4. เงื่อนไขก่อนเปิดใช้กับข้อมูลจริง

1. Farm เป้าหมายต้องถูก trusted provisioning/activation เป็น Farm จริง
   (`classification=OPERATIONAL`, `isMock=false`) และมี Organization/Farm
   membership ที่ถูกต้อง; หน้าเพิ่มสวนเดิมยังสร้าง Farm จำลองตาม DEC-043
2. Owner/Farm Manager ต้องตรวจ Farm, Zone, Row, ลำดับตำแหน่ง และ Tag preview
   ก่อนบันทึก
3. Zone/Row ใหม่ต้องยืนยันรหัสและทิศทางการนับ; ค่าที่ยังไม่ยืนยันให้ใช้ `TBD`
4. ห้ามใช้ GPS เป็นตัวตนหลักของต้น และห้ามกรอก PII/secret ในหมายเหตุหรือ source
5. การเปิดรูปจริง, QR จริง และ deployment ต้องขออนุมัติแยก

## 5. Acceptance criteria

- หน้าจอไม่มีคำว่า “เพิ่มตำแหน่งปลูกจำลอง” และแสดงสถานะข้อมูลตาม adapter/Farm
- Mock/Emulator/Farm จำลองไม่สามารถสร้าง record ที่ถูกจัดเป็นข้อมูลจริง
- Firebase Production + Farm จริงสร้าง record ที่มี `exampleData=false` ได้
- ข้อมูลสำรวจที่กรอกไม่ครบถูกปฏิเสธก่อนบันทึกและโดย Firestore Rules
- สถานะ `ไม่มีต้น` ไม่สามารถมีพันธุ์ ปีปลูก หรือค่าการวัดต้น
- การแก้ไขและปลูกทดแทนเก็บ audit/timeline และไม่เปลี่ยน Position identity
- ผ่าน lint, typecheck, unit/UI tests, Firebase Emulator Rules tests, build,
  performance budget, offline runtime scan และ responsive browser validation
