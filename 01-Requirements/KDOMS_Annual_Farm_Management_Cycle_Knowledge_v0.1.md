# KDOMS Annual Farm Management Cycle Knowledge v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1.0 |
| สถานะ | Approved Development Baseline — Mock-first (DEC-048) |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | รอบบริหารสวนรายปี แผนประจำปี การเลือกรอบ การปิดรอบ Correction และการเชื่อมข้อมูลรายปี |
| Source of Truth | คำสั่งล่าสุดของ Project Owner, `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Report_Catalogue_and_KPI_Definitions_v0.1.md`, `00-Project-Management/Decision-Log.md` (DEC-048) |

## 1. คำตัดสินของ Owner

1. เพิ่ม `รอบบริหารสวนรายปี` (`Annual Farm Management Cycle`) เป็นขอบเขต
   การวางแผนและดูข้อมูลรายปีของแต่ละ Farm
2. รอบมาตรฐานเริ่มวันที่ **1 มิถุนายน** และสิ้นสุดวันที่ **31 พฤษภาคม** ของปีถัดไป
3. Owner แก้วันเริ่มรอบเฉพาะสวนได้ โดยระบบคำนวณวันสิ้นสุดให้ครบ 12 เดือน
4. รอบอยู่ระดับ Farm ไม่ใช่ Organization และข้อมูลต้องไม่รั่วหรือรวมข้าม Farm
5. วางแผนระดับ Farm/Zone เป็นค่าเริ่มต้น; ใช้รายต้นหรือ Tree Set เฉพาะกรณีจำเป็น
6. รอบที่ปิดแล้วแก้ได้เฉพาะ Correction พร้อมเหตุผล ผู้กระทำ เวลา before/after
   และ revision ใหม่ ห้ามแก้ประวัติหรือสรุปเดิมแบบเงียบ ๆ
7. Implementation และ validation รอบนี้เป็น Mock-first Local/Firebase Emulator
   พร้อมข้อมูล `SIMULATED/TEST ONLY`; ไม่อนุมัติ deployment, ข้อมูลจริงนอก
   DEC-046, PA-2, Controlled Pilot หรือ broader Production rollout

## 2. ความหมายและลำดับชั้น

```text
Organization
└── Farm
    ├── Annual Farm Management Cycle (หนึ่งรอบ = 12 เดือน)
    │   ├── Annual Plan Items
    │   ├── Crop Cycles (หนึ่งหรือหลายรอบผลผลิต)
    │   ├── Work / Care / Disease activity
    │   ├── Fruit / Harvest / Sales activity
    │   ├── Inventory movements / Direct cost
    │   └── Close summary / Corrections / Carry-over
    └── Persistent master/history
        ├── Zone / Row / Planting Position
        ├── Planting Cycle history
        ├── Farm membership
        └── Inventory item master
```

- **Annual Farm Management Cycle:** กรอบวางแผน ดำเนินงาน ติดตาม และสรุปหนึ่งปี
  ของ Farm
- **Crop Cycle:** ฤดู/รุ่นผลผลิตย่อยต่อพื้นที่ พันธุ์ หรือชุดต้น อาจมีหลายรายการใน
  Annual Cycle เดียว และไม่ใช่ Annual Cycle
- **Planting Cycle:** รุ่นของต้นชีวภาพที่อยู่ ณ Planting Position อาจยาวหลายปี
- Zone/Row/Position/Planting Cycle และ master data ไม่ถูกสร้างซ้ำเมื่อเปิดรอบปีใหม่

## 3. ช่วงเวลาและรหัสรอบ

### 3.1 ค่าเริ่มต้น

- `periodStart`: 1 มิถุนายนของปีเริ่ม
- `periodEndExclusive`: 1 มิถุนายนของปีถัดไป
- หน้าจอแสดงช่วงแบบ inclusive เช่น `1 มิ.ย. 2569 – 31 พ.ค. 2570`
- การคำนวณและ query ใช้ช่วง `[periodStart, periodEndExclusive)` ใน timezone ของ Farm
- ระบบเก็บวันที่ ISO/Gregorian และแสดง พ.ศ. พร้อม ค.ศ. เมื่อช่วยลดความกำกวม

### 3.2 วันเริ่มเฉพาะสวน

- Owner เลือกวันเริ่มได้ เช่น 15 มิถุนายน; ระบบ derive วันสิ้นสุดแบบ exclusive เป็น
  วันที่เดียวกันของปีถัดไป ห้ามกรอกวันสิ้นสุดแยกจนเกิดช่วงไม่ครบ 12 เดือน
- วันที่ 29 กุมภาพันธ์ใช้กติกา calendar-safe: รอบถัดไปสิ้นสุด 28 กุมภาพันธ์เมื่อ
  ปีปลายทางไม่มีวันที่ 29
- วันเริ่มแก้ได้โดยตรงเฉพาะ `DRAFT`/`PLANNED` ก่อนมี record ปฏิบัติการผูกกับรอบ
- หลัง `ACTIVE` การเปลี่ยนช่วงต้องใช้ Correction ที่มีเหตุผลและตรวจผลกระทบ
- รอบใน Farm เดียวกันห้ามทับกัน; retry ต้องไม่สร้างรอบซ้ำ

รหัสเสนอสำหรับ Mock คือ `AFY-{startYear}-{startMonth}` เช่น `AFY-2026-06`
รหัสอ่านง่ายไม่ใช่ authorization; `annualCycleId` เป็น opaque ID ที่ unique ทั้งระบบ

## 4. สถานะและวงจรชีวิต

```text
DRAFT → PLANNED → ACTIVE → CLOSING → CLOSED
```

| สถานะ | ความหมาย | Mutation หลัก |
|---|---|---|
| `DRAFT` | กำลังจัดโครงรอบและแผน | Owner สร้าง/แก้ช่วง/ลบแผนที่ยังไม่ใช้ |
| `PLANNED` | แผนพร้อมรอเริ่ม | Owner แก้แผนและเปิดรอบ |
| `ACTIVE` | รอบปัจจุบัน | บันทึกกิจกรรมตาม Role; เปลี่ยนช่วงด้วย Correction เท่านั้น |
| `CLOSING` | ตรวจยอดและรายการค้าง | Owner/Manager ตรวจ Close checklist; ห้ามลบประวัติ |
| `CLOSED` | ปิดสรุปแล้ว | อ่านได้; แก้เฉพาะ Correction/Restatement พร้อม Audit |

- หนึ่ง Farm มี `ACTIVE` หรือ `CLOSING` รวมกันได้ไม่เกินหนึ่งรอบ
- สร้างรอบอนาคตแบบ `DRAFT` ได้ก่อนปิดรอบปัจจุบัน
- ห้าม Hard delete รอบที่เคย Active; รอบ Draft ที่ยกเลิกใช้สถานะ/เหตุการณ์ยกเลิก
  ในส่วนขยายภายหลังแทนการลบประวัติแบบเงียบ ๆ

## 5. Annual Plan Item

Plan Item เป็นเจตนาในการวางแผน ไม่ใช่หลักฐานว่างานเกิดขึ้นแล้ว และต้องแยกจาก
Work Order ซึ่งเป็นรายการปฏิบัติงานจริง

| กลุ่ม | Field/กติกา |
|---|---|
| Identity | `planItemId`, `annualCycleId`, title, category, version |
| Scope | `FARM`, `ZONE`, `TREE_SET`; Zone เป็นค่าเริ่มต้นเมื่อเจาะพื้นที่ |
| Target | Farm ใช้ target ว่าง; Zone มี `zoneCodes`; Tree Set มี opaque `positionIds` |
| Timing | planned start/end window ภายใน Annual Cycle |
| Trigger | `DATE_WINDOW`, `CROP_STAGE`, `CONDITION`; ค่าเงื่อนไขไม่สร้างคำแนะนำอัตโนมัติ |
| Responsibility | responsible role/reference ตาม least privilege |
| Plan value | planned quantity/unit และ direct cost เท่าที่ทราบ; unknown เป็น null/TBD |
| Execution | สถานะ Planned/In progress/Completed/Cancelled และ reference ไป Work เมื่อมี |
| Audit | actor, Farm, time, before/after, reason, idempotency key |

- ระดับรายต้นใช้เมื่อมีข้อยกเว้น ความเสี่ยงเฉพาะต้น โรค หรืองานที่ Owner/Manager
  ต้องติดตามแยก ไม่ใช้เป็นค่าเริ่มต้นสำหรับงานทั่วสวน
- Plan Item แบบ Crop Stage ไม่แทนการยืนยัน Stage ของ Crop Cycle จริง
- Chemical/treatment plan ยังอยู่ภายใต้ DEC-026 และห้ามสร้างคำแนะนำอัตโนมัติ

## 6. การผูกข้อมูลปฏิบัติการ

ข้อมูลที่เป็น transaction/event ของรอบต้องอ้าง `annualCycleId` ที่ trusted repository
ตรวจว่าอยู่ Organization/Farm เดียวกัน และเหมาะกับวันที่/สถานะรอบ

- Work Order: ผูกตามรอบที่วางแผน/กำหนดส่ง; งานค้างไม่เปลี่ยน origin รอบแบบเงียบ ๆ
- Care Event: สืบทอด Annual Cycle จาก Work หรือระบุรอบเมื่อบันทึก Care โดยตรง
- Disease Incident: เก็บ `originAnnualCycleId`; เคสที่ยังเปิดปรากฏเป็น carry-over
  ในรอบใหม่โดยไม่ clone Incident
- Crop Cycle: ต้องผูก Annual Cycle หลัก แต่หนึ่ง Annual Cycle มีหลาย Crop Cycle ได้
- Fruit Observation/Harvest/Sales: สืบทอดผ่าน Crop Cycle และ traceability เดิม
- Inventory Movement: ผูก Annual Cycle ตาม effective date; Item/Lot master ไม่สร้างซ้ำ
- Audit/Correction: เก็บ Farm และ Annual Cycle reference เมื่อ record อยู่ในรอบ

หาก activity date อยู่นอกช่วง รอบไม่พบ หรือ payload ข้าม Farm ให้ fail closed และ
ให้ผู้มีสิทธิ์เลือกรอบ/ทำ Correction อย่างชัดเจน ห้ามเดารอบจากชื่อหรือ Human Code

## 7. Carry-over และการปิดรอบ

Close checklist อย่างน้อยต้องแสดง:

1. Work ที่ยังเปิด/เกินกำหนดและ Pending/Conflict
2. Disease Incident ที่ยังเปิด พร้อม Follow-up ถัดไป
3. Crop/Harvest/Sales traceability gap และยอดขายค้างที่บันทึกไว้
4. Inventory closing balance, negative-stock denial และ unknown direct cost
5. ข้อมูล Measured/Estimated/Unknown และ audit completeness
6. รายการที่จะ carry-over ไปปีถัดไป

กติกา carry-over:

- ไม่ clone Work/Disease/Transaction เดิมแล้วเปลี่ยน ID โดยไม่มี reference
- รอบใหม่แสดง `carriedFromAnnualCycleId` หรือ query open record จากรอบก่อน
- Inventory opening ของรอบใหม่มาจาก closing movement snapshot ที่ตรวจย้อนกลับได้
- คัดลอกได้เฉพาะ Plan Template/Plan Item เป็นรายการใหม่พร้อม `copiedFromPlanItemId`
  ห้ามคัดลอก actual result, evidence, diagnosis หรือยอดขายเป็นผลของปีใหม่

## 8. Correction-only หลังปิดรอบ

- คำว่า Correction-only ตามคำตัดสิน Owner ครอบคลุม Annual Cycle header และ
  closed summary ของรอบที่ `CLOSED`; ไม่ได้ห้ามการเพิ่ม Plan Item ใหม่แบบ append-only
  ระหว่าง `ACTIVE/CLOSING` เมื่อเกิดความจำเป็นหน้างานและบทบาทมีสิทธิ์
- Plan Item ของรอบ `CLOSED` ห้ามสร้าง/แก้/ลบ; การ restate แผนหรือผลย้อนหลังในอนาคต
  ต้องออกแบบ Plan Correction แยกและขออนุมัติก่อน ไม่ใช้ normal update
- `CLOSED` ห้าม update record หรือ summary เดิมโดยตรง
- Correction ต้องมี `correctionId`, reason, actor, server time, before/after,
  source record/revision และ idempotency key
- Annual summary ฉบับแก้เป็น revision ใหม่และอ้าง `supersedesRevisionId`
- Original close snapshot ยังอ่านย้อนหลังได้
- การแก้ต้องประเมิน Farm/Annual Cycle scope ใหม่และปฏิเสธ forged payload
- Owner เป็นผู้ทำ Annual Cycle Correction; Auditor อ่านได้ตาม assignment

## 9. UX ที่อนุมัติสำหรับ Development

- Header แสดง `สวนปัจจุบัน` และ `รอบปีปัจจุบัน` แยกกัน
- เปลี่ยน Farm แล้วโหลดรอบของ Farm ใหม่ ห้ามคง Annual Cycle ID ของ Farm เดิม
- Year Switcher แสดง label, ช่วงวันที่, สถานะ และข้อมูล `SIMULATED/TEST ONLY`
- เมนู `เพิ่มเติม → รอบบริหารสวนรายปี`
- หน้า Cycle list แยก รอบปัจจุบัน / รอบอนาคต / รอบปิดแล้ว
- หน้า Cycle detail มี Summary, Annual Plan, Activity/Carry-over และ Close/Correction
- Owner เห็น Create/Edit/Transition/Correction; Manager จัด Plan ตาม policy;
  Viewer/Auditor อ่านอย่างเดียว; Worker ใช้รอบที่ระบบเลือกกับงานของตน
- การเปลี่ยนรอบเมื่อมี Draft/Pending ต้องเตือนและไม่ย้าย Farm/Annual scope ของรายการ
- Mobile 320px ต้องไม่มี horizontal overflow และสีทุกสถานะมีข้อความกำกับ

## 10. Deterministic Mock Pack ขั้นต่ำ

ต่อ Farm ที่ Active อย่างน้อยต้องมี:

- รอบก่อนหน้า `CLOSED`
- รอบปัจจุบัน `ACTIVE` ช่วงมิถุนายน–พฤษภาคม
- รอบถัดไป `DRAFT`
- Custom-start scenario หนึ่ง Farm เพื่อพิสูจน์ว่าระบบไม่ได้ hard-code วันที่ 1 มิถุนายน
- Plan ระดับ Farm, Zone และ Tree Set อย่างละอย่างน้อยหนึ่ง scenario
- carry-over Work/Disease, Correction หลังปิด, duplicate retry และ period overlap denial
- Cross-Farm read/write/forge denial และ role denial

ทุกค่าเป็น stable/resettable `SIMULATED/TEST ONLY`; ห้ามใช้ข้อเท็จจริงสวนจริง

## 11. รายงานรายปี

Annual Cycle Summary ใช้ Report Catalogue เดิมเป็นฐานและต้องแสดง:

- Tree opening/closing snapshot และ planting replacement เท่าที่ข้อมูลรองรับ
- Planned/Completed/Overdue/Carry-over Work
- Care/Disease open/new/closed/follow-up
- Fruit estimate, Harvest quantity/weight/grade และ traceability quality
- Sales recorded/outstanding โดยไม่อ้างเป็นบัญชีหรือ revenue recognition
- Inventory movement/direct cost เท่าที่ทราบ พร้อม unknown coverage
- Pending/Conflict/Correction/Estimated/Unknown และ source watermark

การ compare หลายปีต้องใช้ Farm เดียวกัน นิยาม/หน่วย/period ที่เทียบได้ และแสดง
revision/data quality ห้ามสรุปสาเหตุจากแนวโน้มโดยอัตโนมัติ

## 12. Acceptance criteria

- Owner สร้างรอบ 1 มิ.ย.–31 พ.ค. และกำหนดวันเริ่มเฉพาะสวนได้
- ระบบ derive รอบครบ 12 เดือนและปฏิเสธรอบทับกัน
- มีได้ไม่เกินหนึ่ง Active/Closing ต่อ Farm
- Year Switcher ไม่แสดงหรือคง Cycle ข้าม Farm
- Plan ใช้ Farm/Zone เป็นหลักและ Tree Set เฉพาะกรณีจำเป็น
- Crop Cycle ยังคงเป็นรอบผลผลิตย่อยและผูก Annual Cycle ได้หลายรายการ
- รอบ Closed แก้ได้เฉพาะ Correction พร้อม Audit/revision
- Carry-over ไม่ clone actual history และ Plan copy ไม่คัดลอกผลจริง
- Cross-Farm, role, forged cycle ID และ duplicate operation ถูกทดสอบ
- Mock/Emulator แสดง `SIMULATED/TEST ONLY`; ไม่มี deployment/ข้อมูลจริงเพิ่ม
- lint/typecheck/unit/component/rules/emulator/build/mobile/offline regression ผ่าน

## 13. สิ่งที่ไม่อนุมัติจาก Decision นี้

- Deployment หรือแก้ Firebase Production resource/rules/indexes
- Annual Cycle สำหรับข้อมูลจริงหรือการขยาย DEC-046 ไปยังโมดูลอื่น
- Scheduler ภายนอก การส่งรายงานอัตโนมัติ หรือ public export link
- AI/chemical recommendation, accounting/tax/payroll/banking
- PA-2, Controlled Pilot, Physical/Field Validation หรือ Production rollout
