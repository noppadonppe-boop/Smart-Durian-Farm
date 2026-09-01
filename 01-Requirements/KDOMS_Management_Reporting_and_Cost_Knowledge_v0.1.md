# KDOMS Management Reporting and Cost Knowledge v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1.0 |
| สถานะ | Approved Development Baseline — Mock-first Local/Firebase Emulator only (DEC-049) |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | รายงานการจัดการสวนรายสัปดาห์ รายเดือน ราย 3 เดือน และรายปี พร้อมต้นทุนแรงงาน วัสดุ ค่าใช้จ่าย และผลขายเทียบต้นทุน |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md`, `01-Requirements/KDOMS_Report_Catalogue_and_KPI_Definitions_v0.1.md`, `00-Project-Management/Decision-Log.md` (DEC-049) |

> การอนุมัตินี้เป็น Development Baseline แบบ `SIMULATED/TEST ONLY` สำหรับ Local,
> Mock และ Firebase Emulator ไม่ใช่การอนุมัติ Deployment, การบันทึกค่าใช้จ่ายจริง,
> Payroll, บัญชี, ภาษี, การจ่ายเงิน, PA-2, Controlled Pilot หรือ Production

## 1. ผลการตัดสินใจ

1. เพิ่มรายงานรวมระดับ Farm ผูกกับ Annual Farm Management Cycle 4 รอบ:
   `WEEKLY`, `MONTHLY`, `THREE_MONTH` และ `ANNUAL`
2. เพิ่มการบันทึกต้นทุนแรงงานแบบ Append-only พร้อม Audit และ Idempotency
3. เพิ่มค่าใช้จ่ายดำเนินงานตามหมวด และแยก `CAPITAL_ASSET` ออกจากต้นทุนดำเนินงาน
4. รวมต้นทุนวัสดุจาก Inventory `ISSUE` เท่านั้น เพื่อไม่บวก Receipt และ Issue ซ้ำ
5. แสดงยอดขายที่บันทึก เทียบต้นทุนบริหารสวน และคำนวณ Management Margin
6. รองรับ Drill-down และ CSV UTF-8 แบบ Farm-scoped ไม่มี Public link

## 2. นิยามงวด

| รอบ | นิยาม Development Baseline |
|---|---|
| รายสัปดาห์ | จันทร์ถึงก่อนจันทร์ถัดไป และตัดขอบตาม Annual Cycle |
| รายเดือน | วันที่ 1 ถึงก่อนวันที่ 1 เดือนถัดไป และตัดขอบตาม Annual Cycle |
| ราย 3 เดือน | ช่วงละ 3 เดือนนับจากวันเริ่ม Annual Cycle ของสวน |
| รายปี | วันเริ่มถึงก่อนวันสิ้นสุดของ Annual Cycle ที่เลือก |

งวดทั้งหมดใช้รูปแบบ `[periodStart, periodEndExclusive)` และต้องอยู่ใน Farm/Annual
Cycle เดียวกัน ค่าเริ่มต้น Annual Cycle คือ 1 มิ.ย.–31 พ.ค. แต่ใช้วันเริ่มเฉพาะสวน
ตาม DEC-048 เมื่อมีการกำหนดไว้

## 3. ข้อมูลที่รวมในรายงาน

### 3.1 การจัดการสวน

- งานที่ครบกำหนด งานปิด และงานค้าง ณ สิ้นงวด
- Disease Incident ที่ยังเปิดและรายการติดตามในงวด
- Fruit Observation, จำนวนผลล่าสุดที่เชื่อถือได้ และป้าย `ESTIMATED/UNKNOWN`
- Harvest Lot: จำนวนผลและน้ำหนัก
- Sales Lot: จำนวนผล น้ำหนัก ยอดขายที่บันทึก และยอดค้างรับที่บันทึก
- แผนต้นทุนจาก Annual Plan ที่แตะช่วงรายงาน โดยงวดย่อยติดธงว่าไม่ได้เฉลี่ยตามวัน

### 3.2 ต้นทุนแรงงาน

ระบบบันทึกต้นทุนแรงงานแล้วใน Development Baseline โดยมี:

- วันที่เกิดต้นทุนและ `annualCycleId`
- Worker/team reference แบบลดข้อมูลส่วนบุคคล
- ฐานค่าจ้าง `HOUR`, `DAY`, `PIECE`, `LUMP_SUM`
- จำนวน × อัตรา = จำนวนเงิน
- การอ้างอิง `FARM_OPERATION`, `WORK_ORDER` หรือ `HARVEST_LOT`
- Farm, ผู้บันทึก, เวลา, Audit และ Idempotency

ข้อมูลนี้เป็น **Management Cost** ไม่ใช่ Payroll จึงยังไม่มีเงินเดือน ประกันสังคม
ภาษีหัก ณ ที่จ่าย การโอนเงิน สลิป หรือข้อมูลบัญชีธนาคาร

### 3.3 ค่าใช้จ่ายอื่นที่รองรับ

1. ปุ๋ยและสารปรับปรุงดิน
2. สารป้องกันกำจัดศัตรูพืช
3. ฮอร์โมน/สารควบคุมการเจริญเติบโต
4. ต้นพันธุ์และวัสดุปลูก
5. น้ำและไฟฟ้า
6. เชื้อเพลิงและเครื่องจักร
7. ซ่อมบำรุงและอะไหล่
8. บริการภายนอก/ที่ปรึกษา/ตรวจวิเคราะห์
9. เก็บเกี่ยว คัดเกรด และบรรจุภัณฑ์
10. ขนส่งและจัดเก็บ
11. ค่านายหน้าและค่าธรรมเนียมการขาย
12. ค่าใช้จ่ายประจำสวน
13. ค่าใช้จ่ายดำเนินงานอื่น
14. สินทรัพย์ลงทุน ซึ่งแสดงแยกและไม่รวมใน Management Margin

ค่าใช้จ่ายจัดสรรได้ระดับ Farm, Zone, Work Order, Crop Cycle หรือ Harvest Lot

## 4. สูตรหลัก

- `Material direct cost` = ผลรวม `Inventory ISSUE quantity × unitCost`
- `Labor cost` = ผลรวมรายการแรงงานในงวด
- `Operating expense` = ผลรวมค่าใช้จ่ายที่ไม่ใช่ `CAPITAL_ASSET`
- `Total management cost` = Material direct cost + Labor cost + Operating expense
- `Management margin` = Gross sales recorded − Total management cost
- `Management margin rate` = Management margin ÷ Gross sales recorded × 100
- `Sales-to-cost ratio` = Gross sales recorded ÷ Total management cost
- `Cost per harvested fruit` = Total management cost ÷ จำนวนผลที่เก็บเกี่ยว
- `Cost per harvested kg` = Total management cost ÷ น้ำหนักเก็บเกี่ยว

ถ้าตัวหารเป็นศูนย์ให้แสดง `N/A` และถ้าข้อมูลต้นทางไม่ทราบให้แสดง `UNKNOWN`
ห้ามแทนด้วยศูนย์โดยไม่มีหลักฐาน

## 5. สิทธิ์

| ความสามารถ | บทบาท |
|---|---|
| ดูรายงาน | `ORG_OWNER`, `FARM_MANAGER`, `SALES_INVENTORY`, `VIEWER`, `AUDITOR` ภายใน Farm ที่ได้รับสิทธิ์ |
| บันทึกค่าแรง | `ORG_OWNER`, `FARM_MANAGER` |
| บันทึกค่าใช้จ่าย | `ORG_OWNER`, `FARM_MANAGER`, `SALES_INVENTORY` |
| Export CSV | `ORG_OWNER`, `FARM_MANAGER` |
| ปฏิเสธ | `WORKER` ไม่มีสิทธิ์ดูรายงานต้นทุนระดับ Farm หรือบันทึกต้นทุน |

ทุกแหล่งข้อมูลต้องตรง `organizationId` และ `farmId`; หากพบข้อมูลข้าม Farm ให้
หยุดสร้างรายงานแบบ Fail closed

## 6. Data quality และข้อจำกัด

- ทุกหน้าจอ/ไฟล์ต้องมี `SIMULATED/TEST ONLY`
- Sales Lot และ Inventory Movement ต้องมี effective date เพื่อเข้าช่วงอย่างถูกต้อง
- ต้นทุนวัสดุที่ไม่ทราบ `unitCost` ต้องแสดงจำนวนรายการ Unknown
- ผลนับ AI-assisted ยังคง `ESTIMATED` จนกว่าจะผ่าน Human Review ตาม AIFC boundary
- Capital expense แสดงแยกจาก operating cost
- รายงานเป็น On-demand draft ยังไม่มี Scheduler, Finalization, Restatement,
  Retention, PDF/XLSX หรือ External distribution
- Policy worksheet `RPD-01`–`RPD-08` ยังคง Proposed/Not Active; DEC-049 ไม่ได้
  อนุมัติ cutoff, retention หรือ external destination เหล่านั้น

## 7. Acceptance criteria

- [x] เลือกและคำนวณรายงานได้ครบ 4 รอบ
- [x] รายงานผูก Farm และ Annual Cycle เดียวกัน
- [x] บันทึกค่าแรงและค่าใช้จ่ายแบบ Append-only พร้อม Audit/Idempotency
- [x] แยก Material, Labor, Operating และ Capital โดยไม่ double count
- [x] แสดงยอดขายเทียบต้นทุนและ Management Margin พร้อม N/A/Unknown guard
- [x] Drill-down และ CSV UTF-8 ป้องกัน formula-shaped cell
- [x] Role denial และ Cross-Farm fail-closed มี automated test
- [ ] Firebase Production data model/rules และการบันทึกต้นทุนจริง — Not Approved
- [ ] Finalized report, correction/restatement, scheduler, distribution และ retention — ต้องขอ Owner approval แยก

## 8. คำถามที่ต้องตัดสินใจก่อนใช้จริง

1. จะใช้ข้อมูลแรงงานระดับบุคคลหรือรหัสทีม และใครเป็น Data Custodian
2. วิธีอนุมัติ/แก้ไขต้นทุนหลังปิด Annual Cycle
3. นโยบายต้นทุนสินค้าคงคลังจริง เช่น Average/FIFO และการจัดสรรค่าใช้จ่ายร่วม
4. เกณฑ์รับรู้ยอดขาย/รับเงิน/ลูกหนี้ที่ต้องการสำหรับบัญชีจริง
5. Timezone, cutoff, retention, ผู้ตรวจทาน และช่องทางส่งรายงาน
