# Management Reporting and Cost Implementation Prompt v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Approved for Implementation — Mock-first Local/Firebase Emulator only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Decision | DEC-049 |
| Source of Truth | `01-Requirements/KDOMS_Management_Reporting_and_Cost_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Management-Reporting-and-Cost_2026-09-01.md` |

## เป้าหมาย

สร้างรายงานบริหารสวนแบบ Farm-scoped ที่ตอบได้ว่าช่วงสัปดาห์ เดือน 3 เดือน และ
Annual Cycle มีงาน/สุขภาพต้น/ผลผลิต/การขาย/ต้นทุนเท่าใด พร้อมบันทึกต้นทุนแรงงาน
และค่าใช้จ่ายที่เดิมยังขาด โดยใช้ข้อมูลจำลองที่ reset ได้

## Work packages

1. Domain: period resolver, cost models, validation, KPI, quality flags และ CSV
2. Repository: deterministic Mock pack, Append-only Audit, Idempotency, Role และ Farm scope
3. Integration: effective date ของ Sales Lot/Inventory Movement และ Annual Cycle
4. UX: ตัวเลือกรอบ, summary, cost breakdown, drill-down, form บันทึก และ CSV
5. Verification: unit/repository/UI/Cross-Farm/role/export regression และ build checks

## Out of scope

Production adapter/rules/write, real data, Payroll/accounting/tax, report finalization,
scheduler/distribution, PDF/XLSX, deployment และ field validation

## Gate criteria

- คำนวณ 4 รอบตาม Annual Cycle และขอบ `[start,end)` ถูกต้อง
- Material Issue, Labor, Operating และ Capital แยกถูกต้อง
- Management Margin ไม่อ้างเป็นกำไรบัญชี
- Unknown/N/A/Estimated ไม่ถูกทำให้เป็นค่าจริง
- Cross-Farm fail closed, role deny, idempotency และ CSV injection guard ผ่าน
- Lint, typecheck, automated tests, build, performance/offline และ emulator regression ผ่าน
- เอกสาร Decision/Knowledge/Architecture/Validation สอดคล้องกัน
