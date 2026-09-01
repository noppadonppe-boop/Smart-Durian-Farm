# Owner Review Addendum — Phase 3 Field Validation Pack

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved — Controlled Field Validation Only |
| ผู้อนุมัติ | Project Owner |
| วันที่อนุมัติ | 2026-08-31 |
| Source of Truth | Owner instruction in Codex task, `AGENTS.md`, `00-Project-Management/Decision-Log.md`, `02-Field-Survey/Phase-3-Field-Validation-Pack/00-Field-Validation-Pack-Index_v1.0.md` |

## 1. คำตัดสิน

Owner อนุมัติ **Phase 3 Field Validation Pack v1.0** สำหรับ Controlled Field
Validation เท่านั้น การอนุมัตินี้ไม่อนุมัติ Gate 3 และไม่อนุญาต Phase 4

## 2. เงื่อนไขที่อนุมัติ

1. สำรวจต้นทุเรียนจริงจำนวน **30 ต้น** ในสวนทดลอง **1 แห่ง**
2. ใช้ป้ายทดลองชั่วคราวจำนวน **5 ป้าย** และทุกป้ายต้องระบุ `TEST ONLY`
3. ทดสอบ Android อย่างน้อย 1 เครื่องและ iPhone อย่างน้อย 1 เครื่อง
4. เก็บหลักฐานตาม Checklist, CSV, Test Script และ Photo/Issue Log
5. ข้อมูลต้นและ topology ต้องมาจากการสำรวจจริง ห้ามสร้างหรือคาดเดา
6. Cross-Farm access ต้องถูกปฏิเสธทุกกรณี
7. QR base URL ยัง `TBD`; ห้ามผลิตป้ายถาวรหรือใช้ Production domain
8. เมื่อพบ Critical issue ให้หยุดการทดสอบส่วนที่เกี่ยวข้อง เก็บหลักฐาน และรายงาน Owner
9. การอนุมัตินี้ไม่ใช่ Gate 3 approval และไม่อนุญาตให้เริ่ม Phase 4
10. ก่อนลงพื้นที่ต้องจัดทำ Field Execution Brief ระบุผู้รับผิดชอบ วันทดสอบ
    อุปกรณ์ และรายการ `TBD` แล้วหยุดรอข้อมูลจริงจาก Owner

## 3. Data boundary

- อนุญาตข้อมูลจริงเฉพาะ cohort 30 ต้นและ topology ของสวนทดลองหนึ่งแห่งภายใต้
  Controlled Field Validation หลัง Execution Brief และ evidence handling พร้อม
- ห้ามนำข้อมูลจริง ภาพ หรือข้อมูลระบุตัวบุคคลเข้า repository/production โดยอัตโนมัติ
- Repository เก็บ blank templates, approval record และ sanitized summary เท่านั้น
  จนกว่า Owner จะอนุมัติวิธีจัดเก็บ/เผยแพร่ข้อมูลจริงเพิ่มเติม
- ข้อมูลที่ไม่ทราบต้องใช้ `TBD`, `unknown` หรือ `estimated` ตามหลักฐาน ห้ามเดา

## 4. Hold points

- Field work ยังเริ่มไม่ได้จนกว่า Owner ให้ข้อมูลจริงใน Field Execution Brief
- QR payload/print ยังเริ่มไม่ได้เพราะ QR base URL เป็น `TBD`; ป้ายชั่วคราวอาจ
  เตรียมพื้นที่ QR ไว้ได้ แต่ต้องไม่ encode URL ที่ไม่ได้อนุมัติ
- Measurement method/unit, device details และ evidence storage ยังต้องระบุ
- Gate 3 ยังคง `BLOCKED` จนหลักฐาน Field Validation ครบและ Owner อนุมัติ

## 5. Acceptance boundary

- Pack และแบบฟอร์มใช้ได้เฉพาะขอบเขตที่ระบุใน Addendum นี้
- การเปลี่ยนจำนวนต้น ป้าย สวน อุปกรณ์ขั้นต่ำ หรือใช้ domain อื่นต้องขอ Owner
- Cross-Farm failure หรือ Critical issue เป็น stop condition ไม่ใช่รายการ defer เงียบ ๆ
