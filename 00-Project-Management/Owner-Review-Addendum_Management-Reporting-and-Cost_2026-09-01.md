# Owner Review Addendum — Management Reporting and Cost

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved — DEC-049 |
| ผู้อนุมัติ | Project Owner |
| วันที่อนุมัติ | 2026-09-01 |
| อ้างอิงคำสั่ง | Owner ขอรายงานรายสัปดาห์ รายเดือน ราย 3 เดือน รายปี ผลผลิต ค่าใช้จ่าย และยอดขายเทียบต้นทุน; หลังได้รับข้อเสนอ Owner ตอบว่า `อนุมัติ` |
| Source of Truth | `01-Requirements/KDOMS_Management_Reporting_and_Cost_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Report_Catalogue_and_KPI_Definitions_v0.1.md`, `00-Project-Management/Decision-Log.md` |

## 1. สิ่งที่อนุมัติ

- พัฒนา Unified Farm Management Report แบบ On-demand 4 รอบ
- เพิ่มต้นทุนแรงงาน ปุ๋ย สารป้องกันกำจัดศัตรูพืช ฮอร์โมน และค่าใช้จ่ายอื่น
- เชื่อมต้นทุนวัสดุจาก Inventory Issue
- แสดงผลผลิต/ยอดขายเทียบต้นทุนบริหารทั้งปี
- เพิ่ม Drill-down, CSV, Audit, Idempotency, Role และ Multi-Farm controls
- ดำเนินการและทดสอบแบบ Mock-first ใน Local/Firebase Emulator

## 2. สิ่งที่ไม่อนุมัติ

- Deployment หรือแก้ Firebase Production resource/rules สำหรับโมดูลต้นทุน
- ข้อมูลแรงงาน/ค่าใช้จ่าย/ลูกค้า/การขายจริง
- Payroll, บัญชี, ภาษี, การจ่ายเงิน หรือการเชื่อมธนาคาร
- Scheduler, email/chat distribution, public link, PDF/XLSX หรือ external destination
- PA-2, Controlled Pilot หรือ Production rollout

## 3. เงื่อนไข

1. ติดป้าย `SIMULATED/TEST ONLY` ทุก Mock report/export
2. ไม่รวม Capital expense ใน Management Margin และแสดงแยก
3. ไม่แทน Unknown ด้วยศูนย์
4. ปฏิเสธ Cross-Farm และ Worker access ต่อข้อมูลต้นทุนระดับ Farm
5. การใช้จริงต้องกลับมา Owner Review เรื่อง data/privacy/accounting policy,
   Production adapter/rules, retention และ report finalization

## 4. ผลการตัดสินใจ

บันทึกเป็น `DEC-049 — Management Reporting and Cost Baseline` สถานะ `Approved`
เฉพาะขอบเขตข้างต้น
