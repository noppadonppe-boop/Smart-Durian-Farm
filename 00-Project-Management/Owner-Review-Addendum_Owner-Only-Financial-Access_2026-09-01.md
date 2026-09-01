# Owner Review Addendum — Owner-only Financial Data Access

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved — DEC-050 |
| ผู้อนุมัติ | Project Owner |
| วันที่ | 2026-09-01 |
| ขอบเขต | Financial Data Boundary ของทุก Farm ใน Organization |

## คำสั่งเจ้าของ

เจ้าของเห็นข้อมูลทั้งหมด ส่วนผู้ใช้อื่นทุกคนต้องไม่เห็นข้อมูลที่เกี่ยวกับการเงิน

## ข้อกำหนดที่อนุมัติ

1. ผู้มีสิทธิ์การเงินต้องมี Organization membership สถานะ `ACTIVE` และ trusted
   `isOwner=true`; ห้ามเชื่อค่า Role หรือ Client payload เพียงอย่างเดียว
2. ข้อมูลการเงินประกอบด้วยราคา ลูกค้าอ้างอิง มัดจำ ยอดรับ ยอดค้าง ยอดขาย ต้นทุน
   ต่อหน่วย/รวม แผนต้นทุน ค่าแรง ค่าใช้จ่าย Management Margin, Financial KPI,
   Financial Audit, Drill-down และ Export ที่อนุมานตัวเลขดังกล่าวได้
3. แยกข้อมูลปฏิบัติการ เช่น Lot, น้ำหนัก, จำนวน, สถานะ และ Movement quantity ออกจาก
   record การเงิน เพื่อให้ Role ปฏิบัติการทำงานต่อได้โดยไม่รับ Financial payload
4. UI hiding ไม่ใช่ Security Boundary; Domain, Repository และ Firestore Rules ต้อง
   ปฏิเสธซ้ำแบบ Fail closed และทดสอบทุก Canonical Role
5. ผู้มี Role `ORG_OWNER` แต่ trusted Organization Owner flag เป็น `false` ต้องถูกปฏิเสธ
6. เอกสารเดิมที่ผสมข้อมูลปฏิบัติการกับการเงินต้องอ่านได้เฉพาะ Owner จนกว่าจะย้ายข้อมูล
   ด้วยแผน Migration ที่ได้รับอนุมัติ

## ขอบเขตที่ยังไม่อนุมัติ

- ไม่อนุมัติ Firebase/Hosting/Storage deployment หรือ Production migration
- ไม่อนุมัติข้อมูลการเงินจริง ข้อมูลลูกค้าจริง Payroll บัญชี ภาษี หรือธนาคาร
- ไม่เปลี่ยน DEC-038, PA-2, Controlled Pilot หรือ Production rollout

## เกณฑ์ยอมรับ

- Owner อ่าน/บันทึกข้อมูลการเงินภายใน Farm ที่มีสิทธิ์ได้
- ทุก Non-owner Role ถูกปฏิเสธทั้ง Mock repository และ Firestore Rules
- Non-owner อ่านข้อมูลปฏิบัติการที่อนุญาตได้โดย payload ไม่มี Financial fields
- Cross-Farm และ forged owner/role ถูกปฏิเสธ
- Legacy mixed document ไม่รั่วข้อมูลและใช้ Fail-closed behavior
- ชุดทดสอบ Local และ Firebase Emulator ผ่านก่อนส่งมอบ
