# Management Reporting and Cost Architecture v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1.1 |
| สถานะ | Approved Development Architecture — DEC-049/050 Owner-only Financial Data |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `01-Requirements/KDOMS_Management_Reporting_and_Cost_Knowledge_v0.1.md`, `00-Project-Management/Management-Reporting-and-Cost-Implementation-Prompt_v1.0.md`, `00-Project-Management/Decision-Log.md` |

## 1. Component boundary

`ManagementReportsPage` ขอข้อมูลผ่าน `Phase2Context` จาก Work/Disease,
Commercial Traceability, Annual Cycle และ Management Cost repository แล้วส่ง Snapshot
ที่ Farm-scoped เข้า pure report builder รายงานที่ได้เป็น On-demand read model และ
ไม่เขียนย้อนกลับไปยังข้อมูลต้นทาง

## 2. Data flow

1. ยืนยัน trusted Organization Owner (`ACTIVE` + `isOwner=true`) ก่อนโหลด Financial collection
2. Resolve period เป็น Weekly/Monthly/3-month/Annual
3. โหลดแต่ละ source ภายใต้ Organization/Farm เดียวกัน
4. ตรวจ source ทุก record แบบ Fail closed ก่อนคำนวณ
5. คำนวณ Flow/Snapshot metric, cost totals, Management Margin และ quality flags
6. แสดง Summary/Drill-down หรือสร้าง CSV ในเครื่องให้ Owner เท่านั้น

ข้อมูลปฏิบัติการกับข้อมูลการเงินแยกเป็นคนละ record/collection โดย join ผ่าน opaque ID:

- `salesLots` ↔ `salesFinancials` ด้วย `salesLotId`
- `inventoryMovements` ↔ `inventoryMovementFinancials` ด้วย `movementId`
- `annualPlanItems` ↔ `annualPlanFinancials` ด้วย `planItemId`
- `dashboardViews` ↔ `financialDashboardViews/summary`
- `commercialAuditEvents` ↔ `commercialFinancialAuditEvents`

Non-owner repository ต้องไม่ query Financial collection และต้องคืน `financial=null`
แทนการโหลดข้อมูลแล้วซ่อนที่ UI

## 3. Cost write model

- `LaborCostRecord` และ `OperatingExpenseRecord` เป็น Append-only version 1
- ทุก record มี `organizationId`, `farmId`, `annualCycleId`, actor และวันที่
- Idempotency key เดิมคืน record เดิม ไม่สร้างยอดซ้ำ
- Audit event ผูก target และ Farm เดียวกัน
- Correction/update/delete ยังไม่เปิดใน Baseline; Closed-cycle correction ต้องออกแบบ
  revision เพิ่มตาม DEC-048 ก่อนใช้จริง
- Mock repository ปฏิเสธ Farm จริง และ reset ได้จาก deterministic fixture

## 4. Calculation boundary

- Material cost อ่านเฉพาะ Inventory `ISSUE` ตาม `effectiveOn`
- Labor/expense อ่านตาม `incurredOn`
- Harvest/Fruit อ่านตามวันที่ event ที่มีอยู่
- Sales อ่านตาม `soldOn`; รายการไม่มี effective date ไม่ถูกใส่งวดและออก quality flag
- Capital แยกจาก Management cost
- Report ไม่รับรู้เงินสด ลูกหนี้ ภาษี ค่าเสื่อมราคา หรือสินค้าคงเหลือตามมาตรฐานบัญชี

## 5. Security and export

- UI permission ไม่ใช่ security boundary; domain/repository ตรวจ trusted Owner และ scope ซ้ำ
- Non-owner ทุก Role ถูกปฏิเสธรายงาน/Drill-down/Export การเงินและการบันทึกต้นทุน
- Role `ORG_OWNER` จาก Client ไม่เพียงพอหาก trusted membership `isOwner=false`
- Legacy mixed document ที่มี Financial fields ถูกปฏิเสธสำหรับ Non-owner แบบ Fail closed
- Cross-Farm record ใด ๆ หยุด Report run
- CSV เป็น UTF-8 BOM, ใช้ allowlisted columns และ neutralize formula-shaped values
- ไม่มี public link, upload, email หรือ external destination

## 6. Adapter status

| Adapter | สถานะ |
|---|---|
| Local Mock | Implemented |
| Firebase Emulator runtime | Implemented Rules สำหรับ owner-only Financial collections และ legacy fail-closed guards |
| Firebase Production | ไม่รองรับ cost write; Mock Farm ใช้ Mock repository ตาม DEC-049 |
| Production real-cost adapter/rules | Not Approved / Not Implemented |

## 7. Acceptance criteria

- ไม่มี Cross-Farm aggregate leakage
- Retry ไม่สร้างต้นทุน/Audit ซ้ำ
- Capital ไม่ถูกรวมใน Management Margin
- Unknown และ effective-date gap ปรากฏเป็น quality flag
- Report/CSV แสดง `SIMULATED/TEST ONLY`
- ทุก Canonical Role ที่ไม่ใช่ trusted Owner อ่าน Financial collection ไม่ได้
- ทุก adapter boundary ไม่ขยายสิทธิ์ deployment หรือ real data
