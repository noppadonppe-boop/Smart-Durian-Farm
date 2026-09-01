# KDOMS Report Catalogue & KPI Definitions v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.2.0 |
| สถานะ | Approved Unified Management Report Development Baseline (DEC-049); Specialized KPI/Finalization Policy remains Proposed |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | Weekly/Monthly/Three-month/Annual operational reports, KPI definitions, period, Farm scope, role access, drill-down, review และ export |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Management_Reporting_and_Cost_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md`, `01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md`, `06-System-Architecture/Management-Reporting-and-Cost-Architecture_v0.1.md`, `06-System-Architecture/Annual-Farm-Management-Cycle-Architecture_v0.1.md`, `06-System-Architecture/Phase-4-Work-Care-Disease-Architecture_v0.1.md`, `06-System-Architecture/Phase-5-Commercial-Traceability-Architecture_v0.1.md`, `06-System-Architecture/Phase-6-Operational-Hardening-Architecture_v0.1.md`, `00-Project-Management/Decision-Log.md` (DEC-048, DEC-049) |
| คู่มือผู้ใช้ | `10-Operations/KDOMS_User_Manual_v1.0.md` |
| Owner Policy Mockup | `10-Operations/KDOMS_Report_Policy_Owner_Mockup_v0.1.md` และ `08-Testing/fixtures/report-policy-owner-mock-v0.1.json` |

> DEC-049 อนุมัติและระบบรองรับ **Unified Farm Management Report** แบบ On-demand
> รายสัปดาห์ รายเดือน ราย 3 เดือน และรายปี พร้อม Management Cost/CSV เฉพาะ
> Local/Mock/Firebase Emulator ส่วน Specialized Report, scheduler, finalization,
> restatement, retention, distribution และ policy `RPD-01`–`RPD-08` ในเอกสารนี้
> ยังคง Proposed/Not Active และไม่อนุญาต External Action ตาม DEC-038

## 1. วัตถุประสงค์

1. กำหนดรายงานประจำสัปดาห์/เดือนที่ทุกบทบาทตีความตรงกัน
2. แยก Flow metric ในช่วงเวลาออกจาก Snapshot metric ณ วันสิ้นงวด
3. ป้องกันการรวมข้อมูลข้าม Farm หรือรวมหน่วย/คุณภาพค่าที่เข้ากันไม่ได้
4. ระบุสูตร แหล่งข้อมูล สิทธิ์ Drill-down และ Export ของทุก KPI
5. รักษา Correction/Audit และไม่เปลี่ยนค่ารายงานด้วยการแก้ประวัติแบบเงียบ ๆ
6. แสดงความไม่ครบถ้วน `UNKNOWN`, `ESTIMATED`, Pending/Conflict และ late data
   ก่อนใช้ตัวเลขตัดสินใจ

## 2. สถานะของสิ่งที่ระบุในเอกสาร

| ประเภท | ความหมาย |
|---|---|
| `Approved source rule` | กฎที่มาจาก Source of Truth เช่น Multi-Farm, least privilege, audit |
| `Proposed KPI` | สูตร/threshold/report layout ที่ต้อง Owner Review ก่อน implementation |
| `TBD` | ยังต้องเลือก policy หรือข้อมูลจริง ห้ามใช้ค่าจำลองแทนแล้วอ้างว่าอนุมัติ |
| `Not available` | Data model ปัจจุบันยังไม่มี event/field ที่คำนวณอย่างน่าเชื่อถือ |

ตัวเลขที่สร้างจาก Mock Data ต้องแสดง `SIMULATED/TEST ONLY` ในหัวรายงานทุกหน้าและ
ทุกไฟล์ Export

## 3. ข้อกำหนดร่วมของทุก Report

### 3.1 Report identity และ metadata บังคับ

ทุกการ Run/Export ต้องมีอย่างน้อย:

| Field | Req. | ความหมาย |
|---|:---:|---|
| `reportId` | R | opaque ID ของการ Run |
| `reportCode` | R | รหัสจาก Catalogue เช่น `RPT-W-WORK` |
| `reportVersion` | R | เวอร์ชันนิยาม KPI |
| `policyId` | R | Policy set ที่กำหนด period/threshold/access/retention ของ Run |
| `policyVersion` | R | เวอร์ชัน Policy ที่ตรึงกับ Run และ Finalized report |
| `organizationId` | R | Organization scope ที่ trusted service กำหนด |
| `farmId` | R/C | บังคับสำหรับ Farm report; Portfolio ใช้ Farm list ที่ได้รับสิทธิ์ |
| `farmCode` | R/C | เพื่ออ่านง่าย ไม่ใช้เป็น authorization |
| `annualCycleId` | R/C | บังคับสำหรับ Annual report และ report run ที่เลือกจากรอบปี; ต้องเป็นรอบของ Farm เดียวกัน |
| `periodStart` | R | เวลาเริ่มแบบ inclusive |
| `periodEnd` | R | เวลาสิ้นสุดแบบ exclusive |
| `asOf` | R | เวลาที่ snapshot ถูกคำนวณ |
| `timezone` | R | timezone ของ Farm/งวด |
| `generatedAt` | R | server timestamp |
| `generatedBy` | R | actor/service ที่ได้รับสิทธิ์ |
| `dataMode` | R | `SIMULATED_TEST_ONLY`, `CONTROLLED_PILOT` หรือ `PRODUCTION` ตาม environment ที่อนุมัติ |
| `sourceWatermark` | R | เวลาหรือ version สูงสุดของข้อมูลที่รวม |
| `definitionStatus` | R | `PROPOSED` จนกว่า Owner อนุมัติ |
| `qualityFlags` | R | Unknown/Estimated/Pending/Conflict/late-data flags |

### 3.2 Period และ timezone

นิยามเริ่มต้นที่เสนอ:

- **Weekly:** วันจันทร์ `00:00:00` ถึงวันจันทร์ถัดไป `00:00:00` แบบ `[start, end)`
- **Monthly:** วันที่ 1 `00:00:00` ถึงวันที่ 1 ของเดือนถัดไป `00:00:00` แบบ
  `[start, end)`
- **Three-month:** แบ่งช่วงละ 3 เดือนนับจากวันเริ่ม Annual Cycle ของ Farm
- **Annual:** ใช้ `[periodStart, periodEndExclusive)` ของ Annual Cycle ที่เลือก
- ใช้ timezone ที่กำหนดใน Farm profile; หากไม่มี timezone ให้ Report เป็น
  `BLOCKED_TZ_TBD` ห้ามสมมติ timezone
- Event ใช้ trusted/server timestamp สำหรับการเข้าช่วง; วันที่จากอุปกรณ์เป็น
  supporting context ไม่ใช่ตัวตัดช่วงหลัก
- Field แบบวันที่ล้วน เช่น Due date/Harvested on ใช้วันใน Farm timezone
- **Annual Cycle:** ใช้ `[periodStart, periodEndExclusive)` จาก Annual Cycle ที่เลือก
  ซึ่ง default คือ 1 มิ.ย.–1 มิ.ย. ปีถัดไป และอาจเริ่มวันอื่นเฉพาะ Farm ตาม DEC-048

**Owner decision required:** ยืนยันวันเริ่มสัปดาห์ เวลา cutoff, timezone fallback
และเวลาปิดรับ late data

Recommended Mock เพื่อทดลองและแก้ไขในอนาคตคือ วันจันทร์ `00:00`, Weekly cutoff
36 ชั่วโมง, Monthly cutoff 72 ชั่วโมง และ `Asia/Bangkok` เป็น deterministic fallback
เฉพาะ Local/Mock หาก Pilot/Production ไม่มี Farm timezone ยังคงต้อง
`BLOCK_FINALIZATION` รายละเอียดและ Change control อยู่ใน Owner Policy Mockup
ข้อเสนอนี้ยังไม่เป็น Approved policy

### 3.3 Flow กับ Snapshot

| Metric type | วิธีนับ |
|---|---|
| Flow | Event/record ที่ effective timestamp อยู่ใน `[periodStart, periodEnd)` |
| End-of-period snapshot | สถานะล่าสุดที่มีผลก่อน `periodEnd` |
| Current restated | สถานะล่าสุด ณ `generatedAt` ซึ่งอาจรวม Correction หลังปิดงวด |

รายงานต้องติดป้ายว่าเป็น `ORIGINAL_AS_OF_PERIOD_END` หรือ `RESTATED` ห้ามนำสองแบบ
มาเปรียบเทียบโดยไม่ระบุ

### 3.4 สูตรและการปัด

- Percentage = `numerator ÷ denominator × 100`
- ถ้า denominator = 0 ให้แสดง `N/A` ไม่ใช่ `0%`
- เงินปัด 2 ตำแหน่งตาม domain calculation
- จำนวน/น้ำหนักปัดไม่เกิน 3 ตำแหน่ง; จำนวนผลต้องเป็นจำนวนเต็ม
- ห้ามรวม quantity ต่างหน่วย; แสดงแยกตาม Item/Unit
- ห้ามรวม `MEASURED`, `ESTIMATED`, `UNKNOWN` โดยไม่แสดง breakdown
- ค่า `UNKNOWN` ไม่เข้าผลรวมตัวเลข แต่ต้องแสดงจำนวนและสัดส่วน Unknown
- สี/ลูกศรแนวโน้มต้องมีคำและตัวเลขร่วม ไม่ใช้สีเพียงอย่างเดียว

### 3.5 Correction, late data และ report version

1. Source record ที่แก้ต้องใช้ Correction/append event พร้อมเหตุผล
2. รายงาน Finalized ห้ามถูกเขียนทับ; เมื่อข้อมูลเปลี่ยนให้สร้าง revision ใหม่
3. revision ต้องอ้าง `supersedesReportId`, reason และ source watermark ใหม่
4. Export เก่าคง checksum/manifest ตาม retention policy ที่อนุมัติ
5. Late data หลัง cutoff ให้แสดง `LATE_DATA_PENDING` จน Reviewer ตัดสินว่าจะ
   Restate หรือ carry forward

Report lifecycle นี้เป็น Proposed และยังไม่ implemented:

```text
DRAFT → REVIEWED → FINALIZED
   └──────────────→ SUPERSEDED by a new revision
```

### 3.6 Multi-Farm และ privacy

- Farm report ใช้ Farm scope เดียวเท่านั้น
- Portfolio รวมเฉพาะ Farm ที่ `ORG_OWNER` มี membership ณ เวลาสร้างรายงาน
- ห้ามให้ hidden Farm ส่งผลแม้เพียง aggregate count
- ผู้ใช้คนเดียวที่มี role ต่าง Farm ต้องถูกประเมินสิทธิ์ใหม่ทุก Farm
- Workforce breakdown ใช้ approved user reference/display name ที่ลดข้อมูลส่วนบุคคล
- Customer แสดงเฉพาะ Customer reference code
- Export ต้องใช้ column allowlist, ป้องกัน spreadsheet formula injection และสร้าง Audit
- ไม่มี public link; destination/retention/key custody ยังต้อง approval แยก

## 4. Catalogue summary

| Code | Report | รอบ | Primary scope | Primary roles | Implementation status |
|---|---|---|---|---|---|
| `RPT-A-MGMT` | Annual Farm Management Cycle Summary | Annual Cycle | Farm/Annual Cycle | Owner, Manager; Auditor read by assignment | Basic Local/Mock cycle/plan summary implemented; finalized report/export not implemented |
| `RPT-W-WORK` | Weekly Work & Workforce Report | Weekly | Farm | Owner, Manager; role-limited views | Not implemented |
| `RPT-W-HEALTH` | Weekly Tree Health, Disease & Care Report | Weekly | Farm | Owner, Manager, Agronomist | Not implemented |
| `RPT-M-COMM` | Monthly Fruit, Harvest & Sales Report | Monthly | Farm/Crop Cycle | Owner, Manager, Agronomist, Sales Inventory | Not implemented |
| `RPT-M-INV` | Monthly Inventory & Direct Cost Report | Monthly | Farm | Owner, Manager, Sales Inventory | Not implemented |
| `RPT-M-DQ` | Monthly Data Quality & Audit Report | Monthly | Farm/Assignment | Owner, Manager, Auditor | Not implemented |
| `RPT-P-OWNER` | Portfolio Report for Owner | Weekly/Monthly/On-demand | Authorized Farms in one Organization | Owner only | Current snapshot exists; periodic report not implemented |
| `RPT-W-FARM` | Unified Farm Management Report | Weekly | Farm/Annual Cycle | Owner, Manager, Sales Inventory, Viewer, Auditor; Worker denied | Implemented Local/Mock on-demand under DEC-049 |
| `RPT-M-FARM` | Unified Farm Management Report | Monthly | Farm/Annual Cycle | Owner, Manager, Sales Inventory, Viewer, Auditor; Worker denied | Implemented Local/Mock on-demand under DEC-049 |
| `RPT-Q-FARM` | Unified Farm Management Report | Three-month from Annual Cycle start | Farm/Annual Cycle | Owner, Manager, Sales Inventory, Viewer, Auditor; Worker denied | Implemented Local/Mock on-demand under DEC-049 |
| `RPT-A-FARM` | Unified Farm Management Report | Annual Cycle | Farm/Annual Cycle | Owner, Manager, Sales Inventory, Viewer, Auditor; Worker denied | Implemented Local/Mock on-demand under DEC-049 |

### 4.1 `RPT-A-MGMT` — Annual Farm Management Cycle Summary

- Grain: Farm + `annualCycleId` + revision
- Header: Cycle code/name/status, period/timezone, revision, source watermark และ
  `SIMULATED/TEST ONLY` ตาม environment
- Summary ขั้นต่ำ: Annual Plan planned/in-progress/completed/cancelled, Crop Cycles
  ที่อ้างรอบนี้, Work/Care/Disease/Harvest/Sales/Inventory ที่ resolve รอบได้,
  carry-over open items และ Data Quality flags
- Plan variance แสดงได้เฉพาะเมื่อ planned/actual ใช้หน่วยและ source definition
  เดียวกัน; `UNKNOWN` ห้ามแทนด้วย 0
- รอบ `CLOSED` ห้ามเขียนทับรายงานเดิม; Correction/Restatement สร้าง revision ใหม่
  และอ้าง `supersedesReportId`/Annual Cycle correction
- implementation ปัจจุบันเป็น Basic Cycle/Plan summary แบบ Local/Mock/Emulator;
  finalization, scheduled generation, external distribution และ Production export
  ยังไม่อนุมัติ

### 4.2 `RPT-W/M/Q/A-FARM` — Unified Farm Management Report

- Grain: Farm + Annual Cycle + Report period + On-demand run
- Summary: งาน โรค/ติดตาม Fruit Observation ผลเก็บเกี่ยว ยอดขาย ต้นทุนวัสดุ
  ต้นทุนแรงงาน ค่าใช้จ่ายดำเนินงาน สินทรัพย์ลงทุน และ Management Margin
- Material cost ใช้ Inventory `ISSUE` เท่านั้น; Receipt ไม่ถูกรวมซ้ำ
- Labor cost รองรับ Hour/Day/Piece/Lump sum และผูก Farm operation/Work/Harvest
- Capital แสดงแยกและไม่รวมใน Total management cost/Management Margin
- Drill-down: Labor, Expense, Material, Harvest และ Sale ภายใต้ Farm เดียวกัน
- CSV: UTF-8 BOM, allowlisted columns, neutralize formula-shaped value, no public link
- Implementation เป็น On-demand draft `SIMULATED/TEST ONLY`; ไม่ใช่ Payroll,
  Accounting profit, Finalized report หรือ external distribution

## 5. Proposed role access matrix สำหรับ Report

`View` คืออ่าน Summary/Drill-down ตาม scope; `Export` ยังขึ้นกับ policy รายละเอียด

| Role | Work | Health/Care | Fruit/Sales | Inventory/Cost | Data Quality/Audit | Portfolio | Export baseline |
|---|---|---|---|---|---|---|---|
| `ORG_OWNER` | View | View | View | View | View | View | Farm-scoped/Portfolio ตาม approved policy |
| `FARM_MANAGER` | View Farm | View Farm | View Farm | View Farm | View Farm | — | Farm-scoped; final scope `TBD` |
| `AGRONOMIST` | Care/Disease work | View Farm | Crop/Fruit view | Reference-only ตามงาน | Own/domain audit only | — | ปิดโดย default |
| `WORKER` | Own-work summary only | Own observations/tasks | — | Own work usage only | Own sync/status only | — | ปฏิเสธ |
| `SALES_INVENTORY` | Assigned commercial work only | — | View/manage Farm | View/manage Farm | Related audit only | — | `TBD`; ปิด bulk export โดย default |
| `VIEWER` | Read-only summary | Read-only summary | Read-only business summary | Read-only summary | — | — | ปฏิเสธโดย default |
| `AUDITOR` | Evidence by assignment | Evidence by assignment | Read by assignment | Read by assignment | View | — | Audit/export ตาม assignment |

สิทธิ์นี้ไม่เพิ่มสิทธิ์จาก Role Matrix เดิม รายการที่ยัง `TBD` ต้องใช้ least privilege

## 6. `RPT-W-WORK` — Weekly Work & Workforce Report

### 6.1 วัตถุประสงค์

ให้ Manager/Owner เห็นปริมาณงาน ความตรงเวลา งานให้แก้/ปฏิเสธ Exception และรายการ
ที่ติด Offline/Photo โดยไม่เปลี่ยนเป็นการจัดอันดับบุคคลหรือ payroll

### 6.2 Grain และ dimension

- Summary: 1 แถวต่อ Farm ต่อสัปดาห์
- Breakdown: Category, Care type, Priority, Target kind, Status, Assignee reference
- Drill-down grain: 1 Work Order พร้อม audit events และ report evidence

### 6.3 KPI definitions

| KPI | Formula/definition | Source | Quality/exception |
|---|---|---|---|
| Work created | จำนวน unique Work ที่มี `WORK_CREATED` ในงวด | Work audit | แสดง Draft แยก |
| Work assigned | จำนวน unique Work ที่มี `WORK_ASSIGNED` ในงวด | Work audit | Retry key เดิมนับครั้งเดียว |
| Work due | Work ที่ไม่ใช่ Draft, ถูก Assign ก่อนสิ้นงวด และ `dueDate` อยู่ในสัปดาห์ | Work + audit | Due date ใช้ Farm timezone |
| Work started | unique Work ที่มี `WORK_STARTED` ในงวด | Work audit | Rework start ของ Work เดิมไม่เพิ่ม created count |
| Work submitted | unique Work ที่มี `WORK_SUBMITTED` ในงวด | Work audit | แสดง resubmission count แยกได้ |
| Successfully verified | unique Work ที่มี `WORK_VERIFIED` ในงวด | Work audit | `REJECTED→CLOSED` ไม่ถือว่าสำเร็จ |
| Successful completion rate | Due Work ที่มี `WORK_VERIFIED` ภายใน cutoff ÷ Work due ×100 | Work/audit | denominator 0 = N/A |
| On-time verified rate | Due Work ที่ verified ไม่เกิน `dueDate 23:59:59` ÷ Due Work ที่ verified ×100 | Work/audit | ใช้ Farm timezone |
| Overdue at period end | Work ที่ dueDate ก่อน periodEnd และยังไม่มี successful verification ก่อน periodEnd | Work/audit snapshot | แสดง status/priority |
| Rework rate | unique Work ที่มี `WORK_REWORK_REQUESTED` ในงวด ÷ unique Work submitted ในงวด ×100 | Work audit | หลาย rework ของ Work เดิมนับ unique และครั้งแยก |
| Rejection rate | unique Work ที่มี `WORK_REJECTED` ในงวด ÷ unique Work submitted ในงวด ×100 | Work audit | reason required |
| Tree exception rate | จำนวน Position result = `EXCEPTION` ÷ Position results ทั้งหมดใน report ที่ verified ในงวด ×100 | Worker report | group tasks เท่านั้น |
| Average execution cycle | ค่าเฉลี่ย `WORK_VERIFIED time - first WORK_STARTED time` ต่อ successful Work | Work audit | แสดง median/P90 เมื่อ sample ≥ threshold `TBD` |
| Photo-complete submissions | Work submitted ที่มี BEFORE ≥1, AFTER ≥1 และรูป Uploaded ครบ ÷ Work submitted ×100 | Work/report/photo | failure ต้องไม่ถูกซ่อน |
| Pending/Conflict work | จำนวน Work-related Queue `PENDING/CONFLICT` ณ periodEnd | Offline queue | snapshot ไม่ใช่ flow |

### 6.4 Workforce breakdown

ต่อ assignee reference แสดง:

- Assigned, Started, Submitted, Successfully verified
- On-time verified, Rework, Exception positions
- Open/Overdue/Pending/Conflict ณ periodEnd

ไม่คำนวณ Productivity ต่อชั่วโมง, labor utilization, wage หรือ ranking เพราะระบบ
ปัจจุบันไม่มี timesheet/approved labor-hours model

### 6.5 Drill-down

```text
Report → KPI → Work list → Work Order
→ target snapshot → Worker Report → BEFORE/AFTER → Audit/Queue/Conflict
```

Wrong-Farm, wrong-tree, duplicate critical event หรือ missing audit ให้ขึ้น Critical flag

### 6.6 Export

- Summary CSV: Farm/week/KPI/value/quality flag
- Detail CSV: Work ID, category, target kind, assignee reference, due date, milestone
  timestamps, outcome, exception count, sync/photo state
- ไม่รวม binary รูป, OTP, phone หรือ Storage public URL
- Owner/Manager Farm export ตาม policy; Worker/Viewer ไม่มี export

## 7. `RPT-W-HEALTH` — Weekly Tree Health, Disease & Care Report

### 7.1 วัตถุประสงค์

ติดตามสุขภาพต้น Incident ใหม่ เคสวิกฤต Diagnosis/Treatment/Follow-up และ Care work
โดยแยกข้อสังเกตจาก diagnosis และไม่ใช้ระบบแทนผู้เชี่ยวชาญหรือฉลากผลิตภัณฑ์

### 7.2 Grain และ dimension

- Summary: Farm ต่อสัปดาห์
- Breakdown: Zone, Row, tree status, severity, disease status, care type
- Drill-down: Position/Planting Cycle, Disease Incident, Treatment Work, Care Event

### 7.3 KPI definitions

| KPI | Formula/definition | Source | Quality/exception |
|---|---|---|---|
| Active positions | Position status Active ณ periodEnd | Tree register | แยก empty/dead |
| Living tree denominator | Active current cycles ที่ status = normal/watch/sick/recovering | Tree register | Proposed denominator; Owner confirm |
| Tree health snapshot | จำนวน current tree status แต่ละค่า ณ periodEnd | Tree register | Snapshot ไม่ใช่เหตุการณ์ในงวด |
| New disease incidents | Incident ที่ `SYMPTOM_OBSERVED/createdAt` อยู่ในงวด | Disease/audit | 1 Position อาจมีหลาย Incident |
| Affected-position rate | unique Position ที่มี open/new Incident ÷ living tree denominator ×100 | Disease + Tree | denominator 0 = N/A |
| Critical open | Incident severity `CRITICAL` และไม่ Closed ณ periodEnd | Disease | ต้องมี escalation flag |
| Awaiting diagnosis | Incident status `AWAITING_DIAGNOSIS` ณ periodEnd | Disease | ห้ามนับ suspected เป็น confirmed |
| Specialist-approved treatment | Incident ที่ specialist approval เปลี่ยน `APPROVED` ในงวด | Disease audit | Agronomist only action |
| Treatment work completion | Treatment Work successfully verified ในงวด ÷ Treatment Work due ในงวด ×100 | Disease + Work audit | ใช้ successful verify |
| Follow-up due | Incident ที่ follow-up date อยู่ในงวด | Disease | date-only/Farm timezone |
| Follow-up overdue | Follow-up date ก่อน periodEnd และไม่มี follow-up outcome ก่อน cutoff | Disease audit | แสดง critical/high ก่อน |
| Closed incidents | Incident ที่ `INCIDENT_CLOSED` ในงวด | Disease audit | ต้องมี outcome |
| Care events | Care Event ที่ created/verified ในงวด แยก type | Care/Work audit | chemical pending specialist แยก |
| Care material usage | Sum quantity แยก material + unit จาก verified Care Event ในงวด | Care Event | ห้ามรวมต่างหน่วย |
| Data without evidence | Incident/Care ที่ required audit/target/evidence ขาด | Domain validation/audit | ถ้า log ไม่มี ห้ามอนุมานว่า 0 |

### 7.4 Drill-down

```text
Farm/Zone KPI → Position → current Planting Cycle/Timeline
→ Disease Incident → Assessment/Treatment Work → Worker evidence → Follow-up/Audit
```

### 7.5 Export

- Summary/Incident/Care detail CSV แยกไฟล์หรือ sheet logical section
- รูปจริงไม่อยู่ใน default export; ใช้ Evidence ID/Photo ID เท่านั้น
- Owner/Manager/Agronomist view ตาม scope; default export เฉพาะ Owner/Manager
- Bulk photo export ต้อง Owner + Data Custodian approval แยก

## 8. `RPT-M-COMM` — Monthly Fruit, Harvest & Sales Report

### 8.1 วัตถุประสงค์

แสดงความต่อเนื่อง `Crop Cycle → Fruit Observation → Harvest Lot → Sales Lot`
โดยแยก Measured/Estimated/Unknown และไม่อ้างเป็นบัญชีหรือ Cash-flow report

### 8.2 Grain และ dimension

- Summary: Farm + เดือน
- Breakdown: Crop Cycle, stage, Zone/scope, counting mode, value quality,
  Harvest grade, Sales status
- Drill-down: Observation, Count Session reference, Harvest Lot, Sales allocation

### 8.3 Observation scope key

เพื่อป้องกันการนับซ้ำ ให้สร้าง stable scope key:

```text
cropCycleId + stage + scopeKind + sorted(positionIds or zoneCodes)
```

Current observation ใช้ record ล่าสุดก่อน periodEnd ต่อ scope key ห้ามรวม Tree scope
กับ Zone scope ที่ทับซ้อนกันจนกว่า Owner อนุมัติ overlap/roll-up policy

### 8.4 KPI definitions

| KPI | Formula/definition | Source | Quality/exception |
|---|---|---|---|
| Active Crop Cycles | Cycle status Active ณ periodEnd | Crop Cycle | แยก stage |
| Observation records | Observation ที่ observedAt อยู่ในเดือน | Fruit Observation | breakdown MANUAL/AI_ASSISTED |
| Observation quality mix | จำนวน MEASURED/ESTIMATED/UNKNOWN ÷ observations ×100 | Fruit Observation | denominator 0 = N/A |
| Reportable current fruit count | Latest non-archived observation per non-overlapping scope key ณ periodEnd | Fruit Observation | ห้ามรวม overlapping scope |
| AI-assisted reviewed count | AI_ASSISTED records ที่มี Count Session, ESTIMATED และ human-reviewed value | Observation/Count Session | AIFC-G0 = SIMULATED only |
| Harvest fruit quantity | Sum quantityFruit ของ non-archived Harvest Lots ที่ harvestedOn อยู่ในเดือน | Harvest Lot | แยก quality; null ไม่เป็น 0 |
| Harvest weight | Sum totalWeightKg ของ non-archived Harvest Lots ที่ harvestedOn อยู่ในเดือน | Harvest Lot | kg; แยก quality |
| Grade mix by weight | Sum grade weight ต่อ grade ÷ graded Harvest weight ×100 | Harvest grade | ungraded แยก |
| Sales allocated weight | Sum allocation weight ของ non-cancelled/non-archived Sales Lots ที่ created ในเดือน | Sales/Harvest | timestamp ต้อง trusted |
| Gross sales recorded | Sum `weightKg × unitPriceBahtPerKg` ของ Sales Lots ที่ created ในเดือน ไม่ Cancelled/Archived | Sales Lot | เงิน 2 ตำแหน่ง; ไม่ใช่ revenue recognition policy |
| Weighted average price | Gross sales recorded ÷ Sales weight ในเดือน | Sales Lot | weight 0 = N/A |
| Outstanding at month end | Sum outstanding ของ open Sales Lots ณ periodEnd | Sales Lot snapshot | ไม่ใช่ receivable ledger ที่รับรองบัญชี |
| Traceability coverage | Sales allocation rows ที่เชื่อม Sales→Harvest→Crop ครบ ÷ eligible allocations ×100 | Traceability | missing chain = Critical data issue |
| Unsold Harvest balance | Sum `Harvest totalWeightKg - soldWeightKg` ณ periodEnd | Harvest/Sales | lot-level; ห้ามติดลบ |

### 8.5 Metric ที่ยังคำนวณไม่ได้อย่างน่าเชื่อถือ

- **Monthly cash received:** ปัจจุบัน `depositBaht` และ `receivedBaht` เป็นค่าใน Sales
  record/Correction ไม่ใช่ append-only Payment Event จึงห้ามใช้เป็นกระแสเงินสดรายเดือน
- **Fruit dropped during month:** ต้องตัดสินว่า `droppedCount` เป็นค่าช่วงเวลา,
  cumulative หรือ snapshot ก่อนรวม
- **Yield per tree/area:** topology/area และ non-overlap denominator จริงยัง `TBD`
- **Forecast accuracy:** ต้องมี approved comparison ระหว่าง forecast version กับ
  harvested actual ก่อนกำหนดสูตร

### 8.6 Drill-down

```text
KPI → Crop Cycle/Stage → Observation scope → Position/Zone
→ Harvest Lot/Grade → Sales Lot/Allocation → Correction/Audit
```

### 8.7 Export

- Summary, Observation, Harvest, Sales allocation และ Traceability CSV
- Customer แสดง reference code เท่านั้น
- ไม่มีธนาคาร ภาษี ที่อยู่ อีเมล เบอร์โทร หรือ payroll
- Owner/Manager/Sales Inventory ตาม policy; Agronomist read Crop/Fruit;
  Viewer read-only; Auditor ตาม assignment

## 9. `RPT-M-INV` — Monthly Inventory & Direct Cost Report

### 9.1 วัตถุประสงค์

อธิบายยอดเปิด รับเข้า เบิกใช้ ปรับยอด ยอดปิด แจ้งเตือน และต้นทุนตรงที่เชื่อม Work/
Care โดยไม่รวมต่างหน่วยหรืออ้างเป็น General Ledger

### 9.2 Grain และ dimension

- Farm + Item + Lot + base unit + เดือน
- Breakdown movement type, reference type, expiry bucket, known/unknown cost
- Drill-down 1 Inventory Movement และ linked Work/Care/Purchase/Correction

### 9.3 KPI definitions

| KPI | Formula/definition | Source | Quality/exception |
|---|---|---|---|
| Opening balance | Sum quantityDelta ของ movements ก่อน periodStart ต่อ Item/Lot/Unit | Inventory Movement | ต้อง reconcile กับ prior closing |
| Receipt quantity | Sum positive quantityDelta ของ `RECEIPT` ในเดือน | Movement | แยก unit |
| Issue quantity | Sum absolute quantityDelta ของ `ISSUE` ในเดือน | Movement | แยก unit |
| Adjustment net | Sum signed quantityDelta ของ `ADJUSTMENT` ในเดือน | Movement | reason/audit required |
| Closing balance | Opening + Receipt - Issue + Adjustment net | Movement | ต้องไม่ติดลบ |
| Reconciled balance | Calculated closing = trusted current balance | Movement/Balance | mismatch = Critical data issue |
| Direct issue cost | Sum `abs(quantityDelta) × directUnitCostBaht` ของ Issue ที่ cost ทราบ | Movement | เงิน 2 ตำแหน่ง |
| Work-linked cost | Direct issue cost ที่ referenceType = WORK_ORDER | Movement | reference ต้อง resolve Farm เดียวกัน |
| Care-linked cost | Direct issue cost ที่ referenceType = CARE_EVENT | Movement | reference ต้อง resolve Farm เดียวกัน |
| Unknown-cost movements | จำนวน Issue ที่ directUnitCostBaht = null | Movement | แสดง quantity แยก Item/Unit |
| Known-cost coverage | Cost-known Issue count ÷ Issue count ×100 | Movement | denominator 0 = N/A |
| Low-stock items | Active Item ที่ closing balance ตาม approved roll-up ≤ reorderLevel | Item/Balance | lot/item roll-up policy `TBD` |
| Expiring lots | Lot ที่ expiry อยู่ใน approved warning window | Inventory Lot | warning days `TBD` |

ห้ามรวมปริมาณ Item ต่างชนิดหรือหน่วยเป็น “ยอดรวมสต็อก” ค่าเดียว

### 9.4 Drill-down

```text
KPI → Item → Lot → Movement → Reference Work/Care/Purchase/Correction → Audit
```

### 9.5 Export

- Summary Item/Lot CSV และ Movement detail CSV
- Owner/Manager/Sales Inventory ตาม policy; Viewer read-only; Auditor assignment
- ไม่มี cross-farm transfer rows เพราะอยู่นอก MVP
- ไม่แสดงเป็นงบการเงิน/ต้นทุนบัญชี; ใช้คำว่า `Direct cost เท่าที่มีข้อมูล`

## 10. `RPT-M-DQ` — Monthly Data Quality & Audit Report

### 10.1 วัตถุประสงค์

ให้ Owner/Manager/Auditor เห็นความครบถ้วน ความน่าเชื่อถือ Offline/Conflict,
Correction, Export และ Critical security/data events ก่อนเชื่อ KPI ธุรกิจ

### 10.2 KPI definitions

| KPI | Formula/definition | Source | Quality/exception |
|---|---|---|---|
| Audit completeness | Audit events ที่มี actor/action/time/farm/target/reason ตามชนิด ÷ eligible audit events ×100 | Audit | denominator 0 = N/A |
| Unknown value share | records ที่ valueQuality/identity confidence = UNKNOWN ÷ eligible records ×100 | Tree/Fruit/Harvest | แยก domain |
| Estimated value share | records = ESTIMATED ÷ eligible numeric records ×100 | Fruit/Harvest/Tree | ห้ามรวมเป็น measured |
| Pending at month end | Queue status PENDING/SYNCING ณ periodEnd | Offline queue | breakdown age bucket |
| Open Conflict | Conflict status OPEN ณ periodEnd | Conflict | Owner/Manager action |
| Conflict resolution | Resolved in month ÷ conflicts opened in/ก่อนเดือนที่ eligible ×100 | Conflict audit | cohort definitionต้องแสดง |
| Correction count | Correction events ในเดือน แยก domain/reason | Audit | ไม่ตีความ correction ทุกครั้งเป็น error |
| Rework/Reject count | Work rework/reject events ในเดือน | Work audit | link reason |
| Photo failure/orphan | FAILED/ORPHANED records เกิดในเดือน และ open ณ periodEnd | Photo recovery | binary state ต้อง reconcile |
| Duplicate prevented | idempotent replays ที่มี operation evidence ว่าคืน record เดิม | Operation log | หากไม่มี log = Not available ไม่ใช่ 0 |
| Membership changes | Role changed/revoked/restored ในเดือน | Membership audit | Owner review |
| Export count | Export created ในเดือน แยก actor/Farm/report | Export audit | public link ต้องเป็น 0 โดย policy แต่ต้องมี evidence |
| Cross-Farm denial attempts | Denied attempts จาก approved security log | Security log | ถ้า runtime ไม่เก็บ log = Not available |
| Traceability gaps | Sales allocation ที่ chain ขาด | Commercial traceability | >0 = Critical data issue |
| Stale record count | Record เกิน age threshold โดยยัง open/pending | Domain records | threshold ทุก domain `TBD` |

### 10.3 Quality gate ก่อน Finalize รายงานอื่น

ข้อเสนอให้รายงานธุรกิจขึ้น `QUALITY_REVIEW_REQUIRED` เมื่อพบอย่างใดอย่างหนึ่ง:

- Cross-Farm disclosure/allow หรือ wrong-tree action
- duplicate critical event หรือ corrupt history
- open restore mismatch/traceability gap
- source watermark ไม่ครบ, Audit completeness ต่ำกว่า threshold `TBD`
- Pending/Conflict/Unknown/Estimated เกิน threshold ที่ Owner ยังไม่ยอมรับ

Threshold ทั้งหมดยัง `TBD`; ก่อนอนุมัติให้แสดงค่าจริงโดยไม่ตัดสิน Pass/Fail อัตโนมัติ

### 10.4 Drill-down และ Export

```text
Quality flag → Domain/Issue bucket → source record/queue/conflict/audit
→ actor/time/Farm/target/reason → correction/retest evidence
```

- Export ใช้ minimal allowlist และ pseudonymous actor reference
- Owner/Manager/Auditor ตาม assignment
- ไม่รวม OTP, secret, raw photo, phone, customer PII หรือ hidden Farm identifier

## 11. `RPT-P-OWNER` — Portfolio Report for Owner

### 11.1 วัตถุประสงค์

เปรียบเทียบและรวมภาพรวมเฉพาะสวนที่ Owner มีสิทธิ์ โดยยัง Drill-down กลับ Farm ได้
และไม่ซ่อนความต่างของ timezone/unit/quality

### 11.2 Scope rules

1. ใช้ Organization เดียวต่อ Report
2. Resolve authorized Farm list ณ generatedAt จาก trusted membership
3. ไม่รับ Farm ID list จาก client เป็น authorization
4. แสดง Farm subtotal ก่อน Organization total
5. Metric ที่ unit/period/definition ไม่เข้ากันห้ามรวม
6. Hidden/unauthorized Farm ต้องไม่ปรากฏทั้งชื่อ รหัส จำนวน หรือ aggregate

### 11.3 KPI definitions

| KPI | Formula/definition | Roll-up rule |
|---|---|---|
| Authorized farm count | จำนวน Farm ที่ Owner มี Active membership/assignment | ไม่รวม hidden/suspended ตาม policy `TBD` |
| Tree health totals | Sum status counts จาก Farm snapshot งวดเดียวกัน | แสดง quality/source watermark ต่อ Farm |
| Urgent disease | Sum open urgent/critical incidents จาก authorized Farms | Drill-down Farm/Incident |
| Overdue work | Sum overdue-at-period-end ตาม `RPT-W-WORK` | ใช้สูตรเดียวกันทุก Farm |
| Upcoming work | Work due ใน approved upcoming window | Window `TBD` |
| Harvest weight | Sum reportable kg จาก authorized Farms | ห้ามรวม unknown; แยก measured/estimated |
| Inventory warnings | Sum warning records ไม่ใช่ sum quantity | Drill-down Farm/Item/Lot |
| Sales gross recorded | Sum Farm metric จาก `RPT-M-COMM` | ไม่ใช่บัญชี/Revenue recognition |
| Outstanding snapshot | Sum Farm outstanding ณ periodEnd | แสดง Farm subtotal |
| Data quality flags | Count Farms ที่มี Quality Review Required + flag breakdown | ห้ามกลบ Farm ที่มี Critical issue |

### 11.4 Trend/variance

ข้อเสนอ:

- `Absolute change = current period value - prior comparable period value`
- `Percent change = absolute change ÷ abs(prior value) ×100`
- prior = 0 ให้แสดง `N/A` พร้อม absolute change
- เปรียบเทียบเฉพาะนิยาม/เวอร์ชัน/period length เดียวกัน
- ห้ามแปล trend เป็นสาเหตุโดยอัตโนมัติ; ผู้ใช้ต้อง Drill-down

### 11.5 Drill-down และ Export

```text
Portfolio KPI → Farm subtotal → Farm report → source record/audit
```

- View/Export เฉพาะ `ORG_OWNER`
- Export ต้องระบุ authorized Farm manifest และ report version
- ห้ามรวม row-level records หลาย Farm ในไฟล์เดียวโดยไม่มี explicit Farm column และ
  approved export policy

## 12. Drill-down contract ร่วม

ทุก KPI ต้องคืน:

- numerator records และ denominator records เมื่อเป็น rate
- filter/period/timezone/definition version ที่ใช้
- source record IDs, Farm scope และ quality classification
- reason ที่ record ถูก exclude
- link/route ภายในแอปตามสิทธิ์; unauthorized result ต้องไม่เปิดเผยว่ามี record
- Audit/Correction chain และ latest source watermark

ห้ามแสดงเพียงตัวเลขรวมโดยไม่มีวิธีตรวจแหล่งที่มา

## 13. Export specification

### 13.1 Current baseline

- Current Local implementation: Farm-scoped minimal Audit CSV เท่านั้น
- Periodic summary/detail export: Not implemented
- PDF/XLSX/email/scheduled delivery/public link: Not implemented/Not Approved

### 13.2 Proposed file package

```text
{farmCode-or-ORG}-{reportCode}-{periodStart}-{periodEnd}-v{reportVersion}-r{revision}
├─ manifest.json
├─ summary.csv
├─ detail.csv        (เมื่อ role/policy อนุญาต)
└─ quality_flags.csv
```

Manifest ต้องมี report identity, authorized Farm manifest, row counts, checksum,
generatedAt/by, timezone, watermark, definition status และ retention/expiry

### 13.3 CSV controls

- UTF-8 พร้อม header คงที่และ Data Dictionary
- ISO date/time พร้อม timezone
- column allowlist และ CSV escaping
- ค่าเริ่มด้วย `=`, `+`, `-`, `@` ต้องป้องกัน spreadsheet formula injection
- ไม่มี raw binary, public URL, OTP, secret หรือ PII ที่ไม่จำเป็น
- ทุก Export สร้าง Audit event และต้องเพิกถอนได้ตาม policy

## 14. Report review checklist

ก่อน Reviewer รับรายงาน:

- [ ] Environment/data mode และ `SIMULATED/TEST ONLY` ถูกต้อง
- [ ] Organization/Farm/role/authorized Farm manifest ถูกต้อง
- [ ] Period `[start,end)`, timezone, cutoff และ asOf แสดงครบ
- [ ] Definition version และ revision ถูกต้อง
- [ ] Numerator/denominator และ `N/A` ใช้ตามสูตร
- [ ] Unit, currency และ rounding ถูกต้อง
- [ ] Measured/Estimated/Unknown แยกกัน
- [ ] Pending/Conflict/late data/quality flags แสดงครบ
- [ ] Correction/Audit/source watermark reconcile
- [ ] Drill-down ไม่เปิดเผย Cross-Farm/hidden record
- [ ] Export column/row count/checksum/Audit event ถูกต้อง
- [ ] ไม่อ้าง Mock/Simulation เป็นข้อมูลจริงหรือ Production evidence

## 15. Acceptance criteria ของ Catalogue

- มีรายงานครบ 6 รายการตาม Scope ที่ Owner สั่ง
- ทุก Report ระบุ code, period, grain, scope, roles, KPI formula, source, quality rule,
  drill-down และ export
- Formula percentage ระบุ numerator/denominator และ denominator=0
- แยก Flow/Snapshot, period-end/current-restated และ report version
- ไม่รวมต่าง Farm, ต่างหน่วย, overlapping Fruit scope หรือ quality ต่างกันแบบเงียบ ๆ
- Monthly cash receipt, dropped fruit, yield/area และ threshold ที่ข้อมูลยังไม่พอถูก
  ระบุ `Not available`/`TBD`
- Portfolio รวมเฉพาะ authorized Farms และใช้ Farm subtotal
- Correction/late data สร้าง revision ไม่เขียนทับ Finalized report
- Current implementation status ไม่ถูกยกระดับเป็น Periodic Report ที่พร้อมใช้

## 16. Test scenarios ก่อน implementation sign-off

1. Farm A report ไม่แสดง record/Farm ID ของ Farm B
2. Portfolio ไม่เปลี่ยนยอดเมื่อเพิ่ม hidden Farm ที่ Owner ไม่มีสิทธิ์
3. Retry/idempotency ไม่เพิ่ม Work/Movement/Audit count ซ้ำ
4. Rejected-then-Closed Work ไม่ถูกนับ Successfully verified
5. Rework หลายครั้งแสดง unique Work และ event count ถูกต้อง
6. Fruit Tree/Zone scopes ทับกันไม่ถูกบวกซ้ำ
7. UNKNOWN ไม่ถูกแทน 0 และ ESTIMATED ไม่รวมเป็น MEASURED
8. Inventory ต่างหน่วยไม่ถูกบวกเป็นยอดเดียว
9. Sales correction หลัง cutoff สร้าง Restated revision และไม่เขียนทับ original
10. denominator=0 แสดง N/A
11. role downgrade/revoke ก่อน Export ถูก deny
12. CSV formula-shaped value ถูก neutralize และ Export มี Audit/checksum
13. Pending/Conflict/Photo orphan ปรากฏใน Data Quality report
14. security log ไม่พร้อมแล้ว Cross-Farm denial metric แสดง Not available ไม่ใช่ 0

## 17. Owner decisions required

มี Recommended Mock และ Owner decision worksheet `RPD-01`–`RPD-08` ใน
`10-Operations/KDOMS_Report_Policy_Owner_Mockup_v0.1.md` Owner สามารถเลือก
`ACCEPT`, `CHANGE` หรือ `REJECT` รายประเด็น การกรอกหรือทดลองค่า Mock ไม่มีผลเป็น
Approval จนกว่าจะมี Decision reference และ Gate approval ที่เกี่ยวข้อง

### 17.1 Period/finalization

- วันเริ่มสัปดาห์, Farm timezone fallback และเวลา cutoff
- late-data window, Reviewer/Approver และกติกา Restatement
- retention/expiry ของ Report/Export และ evidence destination

### 17.2 KPI policy

- Living-tree denominator และ topology/area denominator
- Upcoming/overdue/stale/expiry windows
- Severity, quality และ threshold สำหรับ `QUALITY_REVIEW_REQUIRED`
- Fruit scope overlap/roll-up, droppedCount semantics และ forecast accuracy
- Revenue/payment event model หากต้องการ cash/receivable report ที่เป็นทางการ
- Low-stock roll-up ระดับ Item/Lot และ cost allocation policy

### 17.3 Access/export

- Manager/Sales Inventory/Auditor export scope
- Workforce identity/detail ที่แต่ละ role เห็นได้
- Bulk photo/evidence export และ dual approval
- CSV/PDF/XLSX/scheduled delivery destination, region และ key custody

## 18. Recommended Owner Policy Mockup และ Future configuration

| Decision | Recommended Mock | วิธีเปลี่ยนในอนาคต |
|---|---|---|
| Period/cutoff | Monday 00:00; Weekly +36h; Monthly +72h | Policy version + effective date |
| Timezone | Farm timezone; Mock fallback Bangkok; real missing = Block | แก้ Organization default/Farm master ตาม approval |
| KPI threshold | Warning/Critical แยกจากสูตร; fixed safety event = Critical ที่ 1 | แก้ operational threshold พร้อม Impact preview |
| Fruit roll-up | Exclusive level per Zone; Tree เมื่อ coverage 100%; overlap = Block | แก้ roll-up policy โดยห้าม double count |
| Dropped fruit | Interval delta ตั้งแต่ Observation ก่อนหน้า | เปลี่ยน semantics ด้วย version/migration plan |
| Payment Event | Append-only; Reversal + Replacement | เพิ่ม type/policy โดยไม่ลด Audit |
| Export | Least privilege; CSV; no public link; bulk photo dual approval | แก้ role grant พร้อม Custodian review |
| Retention/distribution | Draft 30d; final summary 365d; export 7d; link 24h; in-app only | แก้ด้วย Policy version + Custodian review |

ทุก Report run ต้องผูก `policyId/policyVersion` ที่ใช้ Finalized report ห้ามเปลี่ยน
ย้อนหลัง และ Restatement ต้องเป็น revision ใหม่ Safety controls เช่น Cross-Farm deny,
Wrong-Tree stop, append-only Correction/Audit, reauthorization at download และ no public
link เป็นค่าล็อกซึ่ง Owner Policy ไม่สามารถปิดได้

Machine-readable fixture ใช้ deterministic seed และติดป้าย `SIMULATED/TEST ONLY`
สำหรับ Local/Mock validation เท่านั้น ห้ามใช้แทน Decision Log หรือ external approval

## 19. Implementation readiness และ Gate status

| Capability | Current status |
|---|---|
| Farm Dashboard snapshot | Implemented/validated with Local Mock/Emulator |
| Owner Portfolio snapshot | Implemented/validated with authorized Farm filtering |
| Minimal Audit CSV | Implemented/validated Local Mock/Emulator |
| Owner Policy Mockup/config fixture | Documented and schema-validated; `SIMULATED/TEST ONLY`; Not Approved/Not Active |
| Weekly/Monthly/Three-month/Annual unified query engine | Implemented/validated Local Mock under DEC-049 |
| Period cutoff/finalization/revision | Not implemented; Recommended Mock ready; Owner decision `TBD` |
| Unified periodic report UI/drill-down | Implemented/validated Local Mock under DEC-049 |
| Periodic CSV package/PDF/XLSX | Farm-level CSV implemented locally; PDF/XLSX not implemented |
| Labor/operating expense record | Append-only Mock repository implemented; Production adapter/rules not approved |
| Scheduler/distribution/external destination | Not Approved |

- Gate 6: **Passed**
- PA-1 Local/Emulator: **Passed**
- External PA-1: **NO-GO/BLOCKED**
- PA-2, Controlled Pilot, Deployment และ Production: **Not Approved**

การอนุมัติเอกสารหรือสูตรในอนาคตไม่อนุมัติ resource, deployment, billing, real data,
QR/ป้ายจริง หรือ Production โดยอัตโนมัติ
