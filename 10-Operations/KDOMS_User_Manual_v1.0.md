# KDOMS User Manual v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Draft — Local/Mock User Guide; Owner Review and Controlled Pilot Validation Required |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | การเริ่มใช้งาน หน้าที่ตามบทบาท Workflow การกรอกข้อมูล Offline/Sync, QR, รูปภาพ, Conflict, Correction, Audit, Export และการแก้ปัญหา |
| ใช้กับ | KDOMS Local/Mock/Firebase Emulator Candidate เท่านั้น จนกว่า Owner จะอนุมัติสภาพแวดล้อม Pilot |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md`, `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md`, `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md`, `00-Project-Management/Decision-Log.md` (DEC-009–012, DEC-017, DEC-027, DEC-030, DEC-033–038), `01-Requirements/KDOMS_Report_Catalogue_and_KPI_Definitions_v0.1.md` |

> **ขอบเขตสำคัญ:** เอกสารนี้อธิบายการใช้งาน Candidate ที่ผ่านการตรวจแบบ
> Local/Mock/Emulator เท่านั้น ข้อมูลและตัวอย่างทั้งหมดเป็น
> `SIMULATED/TEST ONLY` ไม่ใช่ข้อมูลสวนจริง ไม่ใช่หลักฐานจากอุปกรณ์จริง และไม่ใช่
> การอนุมัติ Deploy, Controlled Pilot หรือ Production ปัจจุบัน External PA-1 ยัง
> `NO-GO/BLOCKED` ตาม DEC-038

## 1. วัตถุประสงค์และวิธีใช้คู่มือ

คู่มือนี้ใช้เพื่อให้ผู้ใช้แต่ละบทบาทเข้าใจว่า:

1. ต้องตรวจอะไรตั้งแต่เข้าสู่ระบบและเลือกสวน
2. มีหน้าที่และสิทธิ์ใดในแต่ละสวน
3. ทำ Workflow หลักตั้งแต่สร้างรายการจนตรวจรับหรือปิดรายการอย่างไร
4. ต้องกรอกข้อมูล รูปภาพ หน่วย และหลักฐานอย่างไร
5. ต้องทำอย่างไรเมื่อ Offline, Sync ไม่สำเร็จ, ข้อมูลขัดแย้ง หรือสแกนผิดต้น
6. อ่าน Dashboard, Audit, Export และรายงานประจำงวดอย่างไร

คำที่ใช้กำกับเนื้อหา:

- **ข้อยืนยัน:** มาจาก Source of Truth หรือพฤติกรรมที่ตรวจแล้วใน Local/Emulator
- **ข้อเสนอ:** แนวทางที่ยังต้อง Owner Review ก่อนใช้กับ Pilot/Production
- **TBD:** ยังไม่มีข้อมูลหรือการตัดสินใจ ห้ามเดาหรือแทนด้วยค่าจำลองแล้วอ้างเป็นจริง

เมื่อหน้าจอจริงขัดกับ Source of Truth ให้หยุดการทำรายการที่เสี่ยง เก็บข้อความหรือ
Issue ID และแจ้ง `FARM_MANAGER`/`ORG_OWNER` ห้ามแก้ข้อมูลเพื่อให้ผ่านหน้าจอเอง

## 2. กฎความปลอดภัยที่ผู้ใช้ทุกคนต้องทำ

1. ตรวจ **ชื่อสวน, Farm Code และบทบาทปัจจุบัน** ที่ส่วนหัวก่อนอ่านหรือบันทึกข้อมูล
2. ไม่ใช้บัญชีร่วมกัน ไม่ส่งต่อ OTP และไม่บันทึก OTP/secret ลงหมายเหตุหรือรูป
3. ไม่กรอกชื่อ เบอร์โทร พิกัด ภาพบุคคล ภาพสวน หรือข้อมูลจริงใน Local/Mock/Emulator
4. ไม่คัดลอกข้อมูล ต้น งาน วัสดุ หรือธุรกรรมจากสวนหนึ่งไปอีกสวนหนึ่ง
5. ไม่ใช้ Human-readable Tag หรือ QR แทนการตรวจสิทธิ์
6. ไม่แก้ประวัติสำคัญแบบเงียบ ๆ ให้ใช้ Correction, Rework หรือ Follow-up ที่มีเหตุผล
7. เมื่อพบข้อมูลผิดสวน, Wrong-Tree, เหตุการณ์สำคัญซ้ำ, ประวัติเสียหาย หรือ secret
   ให้หยุดส่วนที่เกี่ยวข้อง เก็บหลักฐาน และรายงาน Owner ทันที
8. ข้อมูลที่ไม่ทราบให้ใช้ `UNKNOWN`, เว้นว่าง หรือ `TBD` ตามชนิดช่อง ห้ามใช้ `0`
   เพื่อแทน “ไม่ทราบ”

## 3. เริ่มต้นใช้งาน

### 3.1 ตรวจสภาพแวดล้อม

ก่อน Sign-in ให้ตรวจแถบสถานะ:

- ต้องเห็น `SIMULATED/TEST ONLY`
- ต้องระบุว่าเป็น `Mock` หรือ `Firebase Local Emulator`
- ต้องไม่มีข้อความว่า Production หรือ Public
- ห้ามใช้ URL, QR, บัญชี หรืออุปกรณ์ภายนอกที่ Owner ยังไม่อนุมัติ

### 3.2 Sign-in

วิธีใช้ใน Local/Mock:

1. เปิดหน้า `เข้าสู่ Smart Durian Farm`
2. กด `เปิดแอปสาธิตทันที` เพื่อใช้บัญชีตัวอย่าง หรือเลือกบัญชีทดสอบ
3. หากใช้ขั้นตอน OTP ให้กรอกเฉพาะหมายเลขทดสอบที่ระบบแสดง
4. กด `ขอรหัส OTP ทดสอบ`
5. กรอกรหัสตัวเลข 6 หลักจาก Mock/Emulator แล้วกด `ยืนยัน OTP`
6. ตรวจชื่อผู้ใช้แบบจำลอง บทบาท และหมายเลขที่ปิดบังแล้วหลังเข้าสู่ระบบ

ข้อห้าม:

- ห้ามกรอกหมายเลขโทรศัพท์จริงหรือขอ SMS จริง
- ห้ามใช้ OTP ของผู้อื่นหรือเก็บ OTP ใน Screenshot/Issue
- Account recovery สำหรับหมายเลขที่สูญหายหรือเปลี่ยนใหม่ยัง `TBD`

### 3.3 เลือกสวน

1. กดชื่อสวนที่ส่วนหัว
2. เลือกเฉพาะสวนที่ปรากฏในรายการสิทธิ์
3. ตรวจ Farm Code และบทบาท เพราะผู้ใช้เดียวกันอาจมีบทบาทต่างกันในแต่ละสวน
4. หากมีรายการค้างส่ง ระบบจะแจ้งจำนวนรายการที่ยังผูกกับสวนเดิม
5. เลือก `อยู่สวนเดิม` เพื่อจัดการรายการค้างก่อน หรือ `ยืนยันเปลี่ยนสวน` เมื่อเข้าใจว่า
   รายการเดิมจะไม่ย้ายตามไปสวนใหม่

สวน `ระงับ` หรือ `เก็บถาวร` เปิดอ่านได้ตามสิทธิ์ แต่ห้ามบันทึกข้อมูลใหม่

### 3.4 ตรวจ Online/Offline และ Sync

| สถานะที่เห็น | ความหมาย | สิ่งที่ผู้ใช้ต้องทำ |
|---|---|---|
| `ซิงก์แล้ว` | รายการที่ระบบยืนยันแล้ว | ทำงานต่อได้ |
| `ออฟไลน์` | ไม่มีการเชื่อมต่อที่ใช้ส่งข้อมูล | บันทึกได้เฉพาะรายการที่ระบบอนุญาตให้เข้าคิว |
| `บันทึกในเครื่อง` / `PENDING` | ยังไม่ถึงระบบที่เชื่อถือได้ | อย่าอ้างว่าส่งสำเร็จ ตรวจรายการค้างก่อนออกจากงาน |
| `กำลังซิงก์` | กำลังส่งหรือ Retry | รอผล ห้ามกดส่งซ้ำหลายครั้ง |
| `ข้อมูลขัดแย้ง` / `CONFLICT` | ข้อมูลหรือสิทธิ์เปลี่ยนระหว่าง Offline | หยุดแก้เองและส่งให้ผู้มีสิทธิ์ตัดสิน |

### 3.5 ออกจากระบบ

1. ตรวจรายการค้างส่งและรูปค้างใน `ศูนย์ซิงก์`
2. แจ้ง Manager หากมี Conflict หรือรายการที่ Retry ไม่สำเร็จ
3. กด `ออกจากระบบ` จากการ์ดผู้ใช้
4. Queue รูปของผู้ใช้ต้องถูกจัดการตาม policy; ห้ามยืมบัญชีคนอื่นเพื่อ Retry

## 4. เมนูหลัก

| เมนู | ใช้ทำอะไร | ข้อควรตรวจ |
|---|---|---|
| `หน้าหลัก` | Dashboard ของสวนปัจจุบัน | Metric แสดงตามบทบาทและเป็นข้อมูลจำลอง |
| `งาน` | งานของฉัน/ทีม สร้างงาน ทำงาน ส่งตรวจ | ตรวจ target, ผู้รับผิดชอบ, Due date และสถานะ |
| `สแกน` | QR/รหัสแบบ Manual และยืนยันต้น | ตรวจ expected/actual และ Farm ทุกครั้ง |
| `ต้นไม้` | ทะเบียนตำแหน่ง Planting Cycle และ Timeline | Tag ระบุตำแหน่ง ไม่ใช่ต้นชีวภาพรุ่นเดียว |
| `เพิ่มเติม` | Care, Disease, ผลผลิต, Inventory, Portfolio, Sync, Audit, สมาชิก | ระบบแสดงตามสิทธิ์ |
| `คู่มือผู้ใช้` | Quick start, 7 บทบาท, Workflow, การกรอกข้อมูล, Offline/Sync และ Troubleshooting | Desktop อยู่ล่างสุดของ Sidebar; มือถือเปิดจาก `เพิ่มเติม` |

หน้า In-app User Manual ใช้เส้นทาง `/manual` และเปิดอ่านได้ทุกบทบาทหลัง Sign-in
โดยยังประเมิน Farm context/role ของสวนปัจจุบัน หน้าอ่านคู่มือไม่เรียก API ภายนอกและ
ไม่เปลี่ยนสิทธิ์ของผู้ใช้

## 5. คู่มือตามบทบาททั้ง 7 บทบาท

สิทธิ์ละเอียดที่มีเครื่องหมาย `*` ใน Role Matrix ยังต้อง Owner Review ระหว่างที่ยัง
ไม่ตัดสิน ให้ใช้สิทธิ์ที่จำกัดที่สุดและไม่ขยายสิทธิ์จากสิ่งที่หน้าจอแสดง

### 5.1 `ORG_OWNER` — เจ้าขององค์กร

หน้าที่หลัก:

- ดูภาพรวมเฉพาะสวนที่ตนมีสิทธิ์และตรวจ Cross-Farm boundary
- จัดการ Farm membership/role ตาม policy และตรวจ Audit ทุกการเปลี่ยน
- ตรวจ Dashboard/Portfolio, Conflict escalation, Export และรายงานประจำงวด
- ตัดสิน Hold/Stop/Go ภายใต้ Gate ที่ได้รับอนุมัติ

ลำดับงานแนะนำ:

1. เปิด Portfolio และตรวจว่าสวนที่ไม่มีสิทธิ์ไม่ปรากฏ
2. เปิดแต่ละ Farm เพื่อตรวจงานเกินกำหนด โรคเร่งด่วน Inventory warning และยอดค้าง
3. ตรวจ Conflict/Photo recovery ที่ Manager ส่งต่อ
4. ตรวจการเปลี่ยนสมาชิกและ Export ใน Audit
5. อ่าน Weekly/Monthly Report ตาม Catalogue และบันทึกคำตัดสินแยกจากข้อมูลต้นทาง

ห้าม:

- ใช้ Portfolio เป็นหลักฐานบัญชีหรือข้อเท็จจริงภาคสนามโดยไม่มีการตรวจต้นทาง
- เปิดเผยข้อมูลสวนที่อยู่นอก membership/assignment
- อนุมัติ Deploy/Pilot/Production โดยอนุมานจากรายงาน Local/Mock

### 5.2 `FARM_MANAGER` — ผู้จัดการสวน

หน้าที่หลัก:

- ดูแลทะเบียนต้น งาน ทีม และสถานะปฏิบัติการของสวนเดียวในแต่ละครั้ง
- สร้าง/มอบหมาย Work Order ตรวจรับ ให้แก้ ปฏิเสธ และปิดงาน
- Review Conflict, Photo recovery และข้อมูลผิดปกติพร้อมเหตุผล
- ตรวจ Weekly Work และ Weekly Tree Health/Care Report ของ Farm

ลำดับงานแนะนำ:

1. ตรวจ Farm Code, งานเร่งด่วน งานเกินกำหนด และ Disease queue
2. สร้าง Work Order พร้อม target และคำสั่งที่ตรวจสอบได้
3. แนบรูปอ้างอิงเฉพาะตอน Draft และมอบหมายผู้รับผิดชอบ
4. ตรวจ Worker Report โดยเทียบ target, BEFORE/AFTER, วัสดุ และ exception
5. เลือก `ตรวจรับ`, `ให้แก้` หรือ `ปฏิเสธ`; กรณีหลังต้องมีเหตุผล
6. ปิดงานเมื่อผ่าน state ที่กำหนดและตรวจ Audit

ห้ามยืนยัน diagnosis/chemical treatment แทน Agronomist เมื่อ policy ยังไม่อนุมัติ

### 5.3 `AGRONOMIST` — นักวิชาการ/ผู้เชี่ยวชาญพืช

หน้าที่หลัก:

- ตรวจอาการ แยก observed symptom ออกจาก diagnosis
- ยืนยัน diagnosis, treatment plan และ follow-up ตาม least privilege
- สร้าง/ตรวจรับงานหมวด Care/Disease และติดตามผล
- บันทึก Fruit Observation/Crop Cycle ตามสิทธิ์ โดยระบุวิธีและคุณภาพค่า

ลำดับงานแนะนำ:

1. เปิด Disease queue และตรวจต้น/รูป/อาการ/ความรุนแรง
2. บันทึก suspected และ confirmed diagnosis แยกกัน
3. ระบุ treatment plan และวันติดตามโดยอ้างผู้เชี่ยวชาญ/ฉลากที่อนุมัติ
4. สร้าง Treatment Work Order หลัง specialist approval ครบเท่านั้น
5. ตรวจผลการทำงานและบันทึก outcome/follow-up
6. ปิด Incident เฉพาะเมื่อหลักฐานและผลติดตามครบ

ห้ามให้คำแนะนำสารเคมีหรือ dosage อัตโนมัติจากแอป และห้ามใช้ AI จำลองเป็นการ
วินิจฉัยโรค

### 5.4 `WORKER` — ผู้ปฏิบัติงานภาคสนาม

เส้นทางมาตรฐาน:

```text
ตรวจสวน → งานของฉัน → เปิดคำสั่ง/รูปอ้างอิง → รับงาน → สแกนยืนยัน
→ เริ่มงาน → บันทึกผล/วัสดุ/BEFORE-AFTER → ส่งตรวจ → ตรวจสถานะ Sync
```

หน้าที่หลัก:

- ทำเฉพาะงานที่ได้รับมอบหมายในสวนปัจจุบัน
- ยืนยัน Farm + Zone + Row + Position ก่อนทำงานรายต้น
- บันทึกผล วัสดุ exception และรูปหลักฐานตามจริงในสภาพแวดล้อมที่อนุมัติ
- รายงานอาการที่สังเกตได้ แต่ไม่ยืนยัน diagnosis หรือ treatment

เมื่อ Mismatch/Wrong-Farm ให้หยุดงานเดิมทันที บันทึกรหัสจริงที่ระบบแสดง และแจ้ง
Manager ห้ามเลือกให้ระบบถือว่าต้นใหม่เป็นเป้าหมายเดิม

### 5.5 `SALES_INVENTORY` — ผู้ดูแลผลผลิต การขาย และวัสดุ

หน้าที่หลัก:

- สร้าง Harvest/Sales Lot และ Inventory Receipt/Issue ตาม Farm
- ตรวจ traceability `Crop Cycle → Harvest Lot → Sales Lot`
- ใช้ Customer reference แบบรหัสย่อและไม่เก็บข้อมูลส่วนบุคคลเกินจำเป็น
- ตรวจ Monthly Fruit/Harvest/Sales และ Inventory/Direct Cost Report ตามสิทธิ์

ห้าม:

- โอนสต็อก/ผลผลิต/เงินข้ามสวนใน MVP
- แก้ Sales correction หรือ Stock adjustment หากไม่มีสิทธิ์ Owner/Manager
- ใช้ระบบนี้แทนบัญชี ภาษี เงินเดือน ธนาคาร หรือ Cash receipt ledger

### 5.6 `VIEWER` — ผู้ดูข้อมูล

หน้าที่หลัก:

- อ่านข้อมูลธุรกิจและ Dashboard ที่ Farm/Role อนุญาต
- ใช้ drill-down เพื่อตรวจที่มาของตัวเลขโดยไม่แก้ต้นทาง
- แจ้ง Manager เมื่อข้อมูลดูผิดสวน ผิดช่วง หรือไม่สอดคล้องกับสถานะ

สิทธิ์เริ่มต้นเป็น Read-only ไม่มี Audit/Export/Admin โดยอัตโนมัติ และห้ามขอให้ผู้ใช้
อื่น Export เพื่อหลีกเลี่ยง policy

### 5.7 `AUDITOR` — ผู้ตรวจสอบ

หน้าที่หลัก:

- อ่าน Audit/Export ตาม Organization/Farm assignment
- ตรวจ actor, action, timestamp, Farm, target, reason และ before/after
- ตรวจ Correction, role change, Conflict resolution และ Export event
- อ่าน Monthly Data Quality/Audit Report และ trace กลับ Record ID

ห้ามแก้ข้อมูลปฏิบัติการ อนุมัติงานแทน Manager หรือใช้ assignment หนึ่งอ่านอีกสวน

## 6. Workflow ตั้งแต่สร้างข้อมูลจนปิดรายการ

### 6.1 สมาชิกและบทบาท

1. `ORG_OWNER` เปิด `สมาชิกและสิทธิ์` ในสวนที่ต้องการ
2. ตรวจตัวตนแบบปิดบังและ role ปัจจุบัน
3. เปลี่ยน role, revoke หรือ restore ตาม policy
4. ระบบต้องเพิ่ม version และ Audit before/after
5. ผู้ถูกลดสิทธิ์ต้องไม่สามารถ Replay รายการ Offline ด้วยสิทธิ์เดิม

ห้ามแก้ membership ของบัญชีที่กำลังใช้งานเพื่อลดความเสี่ยง self-lockout

### 6.2 สร้างตำแหน่งและทะเบียนต้น

ผู้มีสิทธิ์: `ORG_OWNER`, `FARM_MANAGER` ตาม baseline

1. เปิด `ต้นไม้` → `เพิ่มตำแหน่ง`
2. กรอก Zone Code, Row Code, ลำดับตำแหน่ง และสถานะต้น
3. กรอกพันธุ์และ confidence เมื่อทราบ; ไม่ทราบให้เว้นว่าง
4. ระบุ Baseline date และหมายเหตุที่ไม่มีข้อมูลส่วนบุคคล
5. ตรวจ Tag ที่ระบบประกอบให้ก่อนบันทึก
6. บันทึกแล้วตรวจ Position, Planting Cycle และ Timeline event

Tag ผูกกับ Planting Position ถาวร ห้ามแก้หรือ reuse เมื่อต้นตาย/ปลูกทดแทน

### 6.3 Import Tree Register

1. ใช้ template `03-Tree-Data/tree-register-import-template.csv` เท่านั้น
2. เตรียมครบ 49 columns ตาม Data Dictionary
3. ใน Local/Mock ใช้เฉพาะค่าจำลองและติดป้าย `SIMULATED/TEST ONLY`
4. อัปโหลดหรือวาง CSV แล้วกด `ตรวจ Preview และ Duplicate`
5. แก้ Reject report ทุกแถว ห้ามข้าม error
6. Commit ได้เมื่อไม่มี invalid/duplicate และ Farm/Organization ตรงทั้งหมด
7. หากมี error แม้หนึ่งแถว ระบบต้องไม่สร้าง partial records

### 6.4 แก้ข้อมูลรอบปลูก ปลูกทดแทน และ Archive

- `แก้ข้อมูลรอบปัจจุบัน`: แก้เฉพาะข้อมูลที่อนุญาตและเก็บ Audit
- `เพิ่มรอบปลูกทดแทน`: ปิดรอบเดิม เพิ่ม `plantingCycle` และเก็บ Tag เดิม
- `เก็บตำแหน่งถาวร`: ต้องระบุเหตุผลและไม่ลบ Timeline/Tag index
- ห้ามแก้ Tag/opaque Position ID หรือเขียนทับประวัติรอบก่อน

### 6.5 สร้างและมอบหมาย Work Order

1. เปิด `งาน` → `สร้างงาน`
2. ระบุชื่องานและรายละเอียดที่ผู้ปฏิบัติตามได้
3. เลือก Category; หากเป็น Care ต้องเลือก Care type
4. เลือก Target: Tree, Tree Set, Row หรือ Zone และตรวจ snapshot ต้นเป้าหมาย
5. เลือก Priority, Due date และ Assigned user
6. แนบรูปอ้างอิงได้ 0–3 รูปเฉพาะตอน Draft
7. บันทึก Draft แล้วตรวจ target/Farm อีกครั้งก่อน Assign
8. หลัง Assign รูปอ้างอิงเป็น Read-only ห้ามเขียนทับแบบเงียบ ๆ

### 6.6 Worker ทำงานและส่งรายงาน

1. เปิดงานที่สถานะ `มอบหมายแล้ว` แล้วกด `รับงาน`
2. เปิดคำสั่งและรูปอ้างอิง
3. กด Scan/Manual fallback และยืนยัน expected = actual
4. กด `เริ่มงาน`; ใช้ `พักงาน/ทำงานต่อ` เมื่อต้องหยุดจริง
5. กรอกบันทึกผลและวัสดุจริงพร้อมจำนวนและหน่วย
6. งานหลายต้นต้องระบุ `SUCCESS` หรือ `EXCEPTION` ครบทุกต้น; Exception ต้องมีเหตุผล
7. แนบ BEFORE อย่างน้อย 1 และ AFTER อย่างน้อย 1 รวมไม่เกิน 6 รูป
8. รอให้ทุกรูป `UPLOADED` แล้วกด `บันทึกรายงานครบชุด`
9. ตรวจสรุป แล้วกด `ส่งตรวจ`
10. ตรวจว่าเป็น `ส่งตรวจ` หรือ `บันทึกในเครื่อง/รอซิงก์` ห้ามถือว่าเสร็จหากยัง Pending

### 6.7 ตรวจรับ ให้แก้ ปฏิเสธ และปิดงาน

1. Manager/Agronomist ที่มีสิทธิ์เปิดงานสถานะ `ส่งตรวจ`
2. ตรวจ target, ผู้ทำ, เวลา, รายงาน, วัสดุ, BEFORE/AFTER และ exception
3. เลือก:
   - `ตรวจรับ` เมื่อหลักฐานครบและผลถูกต้อง
   - `ให้แก้` เมื่อแก้ไขได้ พร้อมเหตุผลที่ชัด
   - `ปฏิเสธ` เมื่อไม่ยอมรับผล พร้อมเหตุผลบังคับ
4. งาน Rework กลับไปเริ่มและส่งรายงานใหม่โดยเก็บประวัติเดิม
5. ปิดงานได้หลัง `ตรวจรับแล้ว` หรือ `ปฏิเสธ` ตาม state machine

### 6.8 Care Event

1. สร้าง Work Order หมวด Care และเลือกชนิด ใส่ปุ๋ย/สารเคมี/ให้น้ำ/ตัดแต่ง/ตรวจต้น
2. Worker บันทึกวัสดุ จำนวน หน่วย ผล และหลักฐาน
3. ผู้มีสิทธิ์ตรวจรับ
4. เมื่อผ่าน ระบบเชื่อม Care Event กับ Work และ Position
5. งานสารเคมีคง `PENDING_SPECIALIST` จน Agronomist อนุมัติตาม policy

### 6.9 Disease Incident ถึงการปิดเคส

```text
พบอาการ → ยืนยันต้น → บันทึก observed symptom/severity
→ Agronomist ประเมิน → อนุมัติ treatment → สร้าง Treatment Work
→ Worker ทำงาน → ตรวจรับ → Follow-up/outcome → ปิดหรือรักษาต่อ
```

ข้อสำคัญ:

- Worker กรอกเฉพาะสิ่งที่สังเกต ห้ามกรอก suspected/confirmed diagnosis
- Local/Mock ใช้เฉพาะ synthetic placeholder ไม่ใช้ภาพจริง
- `CRITICAL` ต้องแจ้ง Manager/Agronomist และใช้ stop/escalation ตามความเสี่ยง
- ปิดเคสได้โดย Agronomist หลังบันทึก outcome และหลักฐานครบ

### 6.10 Crop Cycle และ Fruit Observation

1. สร้าง Crop Cycle พร้อม code, name, stage, Zone และ variety reference
2. เลื่อน stage ไปข้างหน้าทีละขั้น:
   `FLOWERING → EARLY_FRUIT → MID_SEASON → PRE_SALE → HARVESTED`
3. สร้าง Fruit Observation โดยเลือก Crop Cycle, stage และ scope Tree/Zone
4. เลือกที่มาของจำนวน:
   - `MANUAL`: คนนับ
   - `AI_ASSISTED`: AI ช่วยนับ + คนตรวจ; Local เท่านั้นและต้องอ้าง Count Session
5. เลือกคุณภาพค่า `MEASURED`, `ESTIMATED` หรือ `UNKNOWN`
6. ระบุ count method, จำนวนผล, ผลร่วง, วันที่ และ confidence note

AI_ASSISTED ห้ามใช้ใน `FLOWERING`, ต้องเป็น `ESTIMATED`, ห้าม `FULL_COUNT` และ
ต้องให้คนตรวจ/แก้ก่อนบันทึก

### 6.11 Harvest Lot ถึง Sales Lot

1. สร้าง Harvest Lot โดยอ้าง Crop Cycle และ Tree/Zone อย่างน้อยหนึ่งรายการ
2. ระบุวันที่เก็บ จำนวนผลหรือน้ำหนัก คุณภาพค่า เกรด และหมายเหตุ
3. ตรวจว่าน้ำหนัก/จำนวนรวมตามเกรดไม่เกินยอด Lot
4. สร้าง Sales Lot โดยแบ่งน้ำหนักจาก Harvest Lot ที่ยังเหลือ
5. ระบุ Customer reference แบบรหัสย่อ จำนวน/น้ำหนัก ราคา มัดจำ และรับแล้ว
6. ระบบคำนวณ Gross/Outstanding และเชื่อม Traceability
7. หากต้องแก้ ให้ Owner/Manager ใช้ Correction Event พร้อมเหตุผล

### 6.12 Inventory และต้นทุนตรง

1. เลือก Item และ Lot ของสวนปัจจุบัน
2. เลือก `RECEIPT`, `ISSUE` หรือ `ADJUSTMENT`
3. กรอกจำนวนด้วยหน่วยฐานที่ระบบกำหนด
4. เลือก Reference type และระบุ Reference ID
5. กรอกต้นทุนต่อหน่วยเมื่อทราบ; ไม่ทราบให้เว้นว่าง
6. ระบุเหตุผลแล้วบันทึก Movement/Audit
7. ตรวจยอดคงเหลือ Low-stock/Expiry และ unknown-cost count

ห้ามคาดเดาการแปลงหน่วย ห้ามยอดคงเหลือติดลบ และ Adjustment ใช้ได้เฉพาะ
Owner/Manager ตาม baseline

## 7. คำแนะนำการกรอกข้อมูล

### 7.1 หลักทั่วไป

| ประเภทข้อมูล | วิธีกรอก | ห้ามทำ |
|---|---|---|
| Required | ต้องมีค่าก่อนบันทึก | ใส่ `-`, `N/A` หรือค่าหลอกเพื่อให้ผ่าน |
| วันที่ | `YYYY-MM-DD` | สลับวัน/เดือนหรือใช้วันที่โดยไม่รู้ timezone |
| Date-time | ISO 8601 พร้อม timezone เมื่อใช้ Import/Evidence | ลบ timezone หรือเดาเวลา |
| จำนวน/น้ำหนัก | ตัวเลข ≥0 ตามกฎและหน่วยที่แสดง | ใช้ 0 แทน Unknown |
| หน่วย | ใช้หน่วยฐาน/รายการที่อนุมัติ | แปลงหน่วยเองโดยไม่มี conversion definition |
| Unknown | เลือก `UNKNOWN` หรือเว้นว่างตาม field | กรอกค่าโดยประมาณแต่ติดป้ายว่า Measured |
| Estimated | เลือก `ESTIMATED` และบอกวิธี/ข้อจำกัด | แสดงรวมกับ Measured โดยไม่แยก |
| Measured | ต้องมีวิธี ผู้วัด เวลา หน่วย และ source ตามที่กำหนด | ใช้ค่าคาดเดา |
| หมายเหตุ | ข้อความสั้น ตรวจสอบได้ ไม่มี secret/PII | ใส่ OTP, เบอร์จริง, diagnosis ที่ไม่มีสิทธิ์ |
| รหัสอ้างอิง | ใช้รหัสที่ระบบ/เอกสารกำหนด | ใช้ชื่อหรือข้อมูลติดต่อแทน code |

### 7.2 ช่องหลักของทะเบียนต้น

| ช่อง | Req. | แนวทาง |
|---|:---:|---|
| Zone Code | R | `Z` + เลขอย่างน้อย 2 หลัก เช่นค่าจำลอง `Z01` |
| Row Code | R | `R` + เลขอย่างน้อย 2 หลัก เช่นค่าจำลอง `R03` |
| Tree Sequence | R | จำนวนเต็มบวก ระบบนำไปประกอบ Tag |
| Tree Status | R | normal/watch/sick/recovering/dead/empty ตามข้อเท็จจริงที่อนุมัติ |
| Variety | O | ไม่ทราบให้เว้นว่าง; ถ้ากรอกต้องมี confidence |
| Planting Year | O | ต้องระบุ BE/CE และ confidence เมื่อกรอก |
| Baseline Date | R | วันที่ของ baseline ไม่ใช่วันที่เดา |
| GPS | C | latitude/longitude/accuracy/method/time/by/confidence/source ต้องครบทั้งกลุ่ม |
| Measurement | C | value/unit/method/time/by/confidence/source ต้องครบทั้งกลุ่ม |
| Notes | O | Plain text ไม่มี secret/PII |

### 7.3 ช่องหลักของ Work Order/Report

| ช่อง | Req. | แนวทาง |
|---|:---:|---|
| Title | R | สั้นและบอกผลลัพธ์ที่ต้องการ |
| Description | R | ขั้นตอน/ขอบเขต/ข้อควรระวังที่ทำตามได้ |
| Category | R | General, Care หรือ Disease Follow-up |
| Care type | C | ต้องมีเมื่อ Category = Care |
| Target | R | ใช้ opaque Position snapshot; Tree ต้องมี 1 ต้น Tree Set ≥2 ต้น |
| Priority | R | Normal/Urgent ตามเหตุผลจริง |
| Due date | R | `YYYY-MM-DD` |
| Assigned user | C | ต้องมีตอน Assign |
| Material actual | O/C | ถ้ามีต้องมีชื่อ ปริมาณ >0 และหน่วย |
| Per-tree completion | R สำหรับ Group | ครบทุก Position; Exception ต้องมีเหตุผล |
| BEFORE/AFTER | R ตอนส่งตรวจ | อย่างน้อยประเภทละ 1 รวมไม่เกิน 6 และ Uploaded ครบ |

### 7.4 ช่องหลักของ Disease

| ช่อง | ผู้กรอก | แนวทาง |
|---|---|---|
| Observed symptom | ผู้มีสิทธิ์รวม Worker | สิ่งที่มองเห็น/ตรวจพบ ไม่ใช่ diagnosis |
| Severity | ผู้สังเกต | Low/Medium/High/Critical ตามเกณฑ์ที่อนุมัติ; เกณฑ์จริงยังต้อง Pilot review |
| Suspected diagnosis | Agronomist/ผู้มีสิทธิ์ | สมมติฐาน แยกจาก confirmed |
| Confirmed diagnosis | Agronomist | ต้องมีหลักฐานและความรับผิดชอบผู้เชี่ยวชาญ |
| Treatment plan | Agronomist | อ้าง policy/ฉลาก; ไม่ให้ระบบเดา dosage |
| Follow-up date | ผู้ประเมิน | วันที่ติดตามที่ชัดเจน |
| Outcome | Agronomist | ผลจริง/ข้อจำกัดและ next action |

### 7.5 ช่องหลักของ Fruit/Harvest/Sales

| ช่อง | Req. | แนวทาง |
|---|:---:|---|
| Crop Cycle/Stage | R | Observation ต้องอ้าง Cycle และ Stage เดียวกัน |
| Scope | R | Tree ต้องมี Position; Zone ต้องมี Zone |
| Counting mode | R | MANUAL หรือ AI_ASSISTED |
| Count method | R เว้นแต่ UNKNOWN | FULL_COUNT/SAMPLE/ESTIMATE/UNKNOWN |
| Value quality | R | แยก MEASURED/ESTIMATED/UNKNOWN |
| Observed count | C | จำนวนเต็ม ≥0; UNKNOWN ต้องเป็นค่าว่าง |
| Confidence note | R | วิธี แหล่ง และข้อจำกัด |
| Harvest quantity/weight | C | ต้องมีอย่างน้อยหนึ่งค่าเมื่อไม่ใช่ UNKNOWN |
| Sales weight/price | R | ≥0 และ weight ต้องตรง allocation |
| Customer reference | R | รหัสย่อ ห้ามอีเมล/เบอร์โทร |
| Deposit/Received | R | ≥0 และรวมต้องไม่เกิน Gross |

### 7.6 ช่องหลักของ Inventory

| ช่อง | Req. | แนวทาง |
|---|:---:|---|
| Item/Lot | R | Lot ต้องเป็นของ Item และ Farm ปัจจุบัน |
| Movement type | R | Receipt/Issue/Adjustment |
| Quantity | R | ห้ามเป็น 0; Receipt/Issue กรอกค่าบวก |
| Unit | R | ต้องตรง base unit |
| Reason | R | อธิบายเหตุผลที่ตรวจย้อนกลับได้ |
| Reference type/ID | R | เชื่อม Purchase/Work/Care/Count Correction |
| Direct unit cost | O | ≥0; ไม่ทราบให้เว้นว่างและนับเป็น unknown cost |

## 8. QR และ Tag

### 8.1 สิ่งที่ QR ยืนยัน

QR ใช้ช่วยเปิด route `/t/{opaquePositionId}` และยืนยันตำแหน่งกับ Farm/Work context
ไม่ใช่การอนุญาตสิทธิ์ และไม่ควรมีโรค ยา ชื่อคน เบอร์โทร หรือข้อมูลเปลี่ยนแปลงได้

### 8.2 วิธีสแกน

1. เปิดจาก Work Order เมื่อต้องยืนยัน target หรือเปิดเมนู `สแกน`
2. อนุญาตกล้องเมื่อผู้ใช้กดเท่านั้น
3. ตรวจ Farm, Zone, Row, Tag และ expected/actual
4. `MATCH`: ทำ action ตามสิทธิ์ได้
5. `MISMATCH`: หยุด action ของต้นเดิมและแจ้ง Manager
6. `UNKNOWN/DAMAGED`: ใช้ Manual fallback หรือรายงานป้ายชำรุด ห้ามเดารหัส
7. `OFFLINE CACHED`: ตรวจเวลาซิงก์ล่าสุด; หากไม่มี cache ต้องกลับ Online

ปัจจุบัน QR base URL จริงยัง `TBD` ห้าม encode/พิมพ์ QR หรือผลิตป้ายจากตัวอย่างใน
คู่มือนี้

## 9. รูปภาพและหลักฐาน

### 9.1 รูปประกอบใบงาน

- 0–3 รูป
- ผู้สร้างใบงานแนบได้เฉพาะตอน Draft ก่อน Assign
- เป็น `INSTRUCTION`/รูปอ้างอิง ไม่ใช่หลักฐานว่างานเสร็จ
- หลัง Assign แก้หรือเขียนทับไม่ได้แบบเงียบ ๆ

### 9.2 รูปส่งงาน

- BEFORE ≥1 และ AFTER ≥1 รวมทั้งหมด 2–6 รูป
- ต้องผูก Organization/Farm/Work/ผู้ส่ง/phase ถูกต้อง
- ทุกรูปต้อง Uploaded ก่อน Submit
- ห้ามใช้รูปคำสั่งงานแทน BEFORE/AFTER

### 9.3 รูปที่อนุญาตในสถานะปัจจุบัน

- Local/Mock/Emulator ใช้ JPEG/PNG/WebP จำลอง/placeholder ไม่เกิน 5 MB ต่อไฟล์
- ห้าม commit ภาพสวน บุคคล หรือข้อมูลภาคสนามจริงเข้า repository
- HEIC/HEIF เป็นเส้นทาง Engineering ที่ยังต้องทดสอบกับ iPhone จริง ห้ามใช้เป็น
  operational fallback ก่อน PA-1/PA-2
- ก่อนอัปโหลดไป non-Mock ต้อง re-encode เป็น WebP ด้านยาว ≤1,600 px ขนาด ≤5 MB
  และไม่ส่ง EXIF/GPS; หากทำไม่ได้ให้ fail closed

### 9.4 เมื่อ Upload ล้มเหลว

1. อย่ากด Submit
2. ตรวจ thumbnail/สถานะและ Retry แบบจำกัด
3. ใช้ Photo ID/path/idempotency key เดิม
4. หากยังล้มเหลว ให้เปิด Sync Center และแจ้ง `FAILED/ORPHANED` record
5. การลบ object จริงต้องเป็น server lifecycle worker หลัง approval; การกด cleanup
   ใน Local เป็น `DRY_RUN` ไม่ใช่การลบ Storage จริง

## 10. Offline, Retry และ Conflict

### 10.1 รายการ Offline

- Queue ต้องผูก Organization + Farm + actor ตั้งแต่สร้าง
- การสลับสวนไม่ย้าย Queue
- Retry ต้อง recheck membership/role/farm status
- ใช้ idempotency key เดิมเพื่อไม่สร้างเหตุการณ์ซ้ำ
- ปิด/reload แล้วรูป/ร่างต้องอยู่ใน Durable Queue ตาม implementation ที่ตรวจแล้ว

### 10.2 Conflict

1. เปิด `ศูนย์ซิงก์ รูป และข้อมูลขัดแย้ง`
2. อ่านค่าจากอุปกรณ์ เทียบ Server/Audit ล่าสุด และเหตุผล conflict
3. `FARM_MANAGER` เลือกคงค่า Server หรือส่งต่อ Owner; ใช้ Device เป็น Correction
   เฉพาะเมื่อ action/policy อนุญาต
4. ต้องใส่เหตุผลและสร้าง before/after audit
5. ห้ามแก้ record ต้นทางโดยตรงเพื่อให้ Conflict หาย

## 11. Correction, Audit และ Export

### 11.1 Correction

ใช้เมื่อข้อมูลสำคัญที่บันทึกแล้วต้องปรับ เช่น Sales, Stock หรือ master conflict:

1. เปิด record เดิมและตรวจ version/Audit
2. เลือก Correction action ตามสิทธิ์
3. กรอกค่าที่แก้และเหตุผลบังคับ
4. ตรวจ before/after, actor, time, Farm และ reference
5. ห้ามลบ/แก้ event เดิมแบบเงียบ ๆ

### 11.2 Audit

Audit ต้องตอบได้ว่า **ใคร ทำอะไร เมื่อใด ในสวนใด กับเป้าหมายใด เพราะเหตุใด** และ
สำหรับ Correction/Conflict ต้องมี before/after

### 11.3 Export

- Current Local baseline มี Farm-scoped minimal Audit CSV
- ใช้ได้เฉพาะ role/policy ที่อนุญาตและทุก Export ต้องสร้าง Audit event
- ตรวจชื่อ Farm, ช่วงเวลา, row count และ column allowlist ก่อนดาวน์โหลด
- ห้ามสร้าง public link หรือรวมข้อมูลหลายสวนโดยไม่มี Portfolio policy
- Periodic Report CSV/PDF ยังไม่ implemented; ใช้ Report Catalogue เป็นข้อกำหนด
  สำหรับการพัฒนาต่อ ไม่ใช่คำยืนยันว่าปุ่ม Export มีแล้ว

## 12. Dashboard และรายงาน

Dashboard ปัจจุบันเป็น Summary เพื่อปฏิบัติงานและใช้ข้อมูลจำลอง ไม่ใช่บัญชีหรือ
authoritative field evidence โดยอาจแสดงตามสิทธิ์:

- สุขภาพต้นและโรคเร่งด่วน
- งานเกินกำหนด/ใกล้ถึง
- Fruit estimate แยกคุณภาพค่า
- Harvest kg
- Inventory warning
- Sales gross/outstanding

Portfolio ใช้ได้เฉพาะ `ORG_OWNER` และรวมเฉพาะสวนที่มี membership

Weekly/Monthly Report ให้ใช้คำจำกัดความ สูตร สิทธิ์ drill-down และ export จาก
`01-Requirements/KDOMS_Report_Catalogue_and_KPI_Definitions_v0.1.md` ซึ่งยังเป็น
`Proposed — Owner Review Required` ห้ามคำนวณตัวเลขบริหารนอกสูตรแล้วอ้างเป็น
รายงาน KDOMS ที่อนุมัติ

### 12.1 การตั้งค่า Report Policy ในอนาคตสำหรับ Owner

หน้าตาและค่าแนะนำอยู่ใน
`10-Operations/KDOMS_Report_Policy_Owner_Mockup_v0.1.md` และ fixture
`08-Testing/fixtures/report-policy-owner-mock-v0.1.json` โดยครอบคลุมวันเริ่มสัปดาห์,
cutoff, timezone, KPI threshold, Fruit roll-up, dropped fruit, Payment Event,
Export และ retention/distribution

ขั้นตอนที่เสนอสำหรับ `ORG_OWNER`:

1. เลือก Organization default หรือ Farm override ที่ได้รับอนุญาต
2. แก้ค่าในสถานะ `DRAFT` และระบุเหตุผล/วันที่เริ่มใช้
3. กด Impact preview เพื่อตรวจ Report/Farm/สิทธิ์/retention ที่ได้รับผล
4. ส่ง `REVIEW_REQUIRED`; หัวข้อ Export/Retention/Distribution ต้องให้ Data
   Custodian review
5. Activate หลังมี Approval reference เท่านั้น

รายงานที่ Finalized แล้วคง Policy version เดิม หากต้องแก้ผลย้อนหลังให้สร้าง
`RESTATED` revision ห้ามเขียนทับรายงานเดิม Safety controls เช่น Cross-Farm deny,
Wrong-Tree stop, Correction/Audit แบบ append-only และ no public Export link
เป็นค่าล็อกที่แม้ Owner ก็ปิดไม่ได้ ค่าใน Mockup เป็น `SIMULATED/TEST ONLY` และยังไม่มี
ผลเป็น Active policy หรือ External/Pilot/Production approval

## 13. Routine การใช้งาน

### 13.1 ก่อนเริ่มงานแต่ละวัน

- ตรวจ Environment/Farm/Role/Sync
- ตรวจงานเร่งด่วน งานเกินกำหนด Disease follow-up และรายการค้างส่ง
- Worker เปิดคำสั่งและ cache รูปอ้างอิงก่อนเข้าสัญญาณอ่อน
- Manager ตรวจผู้รับผิดชอบและ Due date

### 13.2 ก่อนจบวัน

- Worker ตรวจ Pending/Failed/Conflict และแจ้งงานที่ยังส่งไม่ได้
- Manager ตรวจงานส่งตรวจ Rework และ Critical incident
- Reconcile Work/Report/Photo/Audit ที่ทำในวันนั้น
- ห้ามอ้างว่างานเสร็จหากยัง `บันทึกในเครื่อง`

### 13.3 สิ้นสัปดาห์/สิ้นเดือน

- ใช้ Period และ cutoff ที่ Report Catalogue กำหนด
- ตรวจ Data Quality ก่อนอ่าน KPI
- Drill-down รายการผิดปกติและบันทึก Correction ก่อน finalize
- ผู้มีสิทธิ์ Review/Approve รายงานโดยไม่แก้ข้อมูลต้นทางในรายงาน
- หาก Periodic Report ยังไม่ implemented ให้ระบุ `NOT IMPLEMENTED` ห้ามประกอบ
  ตัวเลขจากหน้าจอหลายหน้าแล้วเรียกว่า Official KDOMS Report

## 14. Troubleshooting

| อาการ | สาเหตุที่เป็นไปได้ | วิธีดำเนินการ |
|---|---|---|
| เข้าระบบไม่ได้ | หมายเลข/OTP ไม่อยู่ใน Mock/Emulator | ใช้บัญชีทดสอบ ตรวจ OTP 6 หลัก ห้ามใช้เบอร์จริง |
| ไม่เห็นสวน | ไม่มี Active membership หรือถูก revoke | ให้ Owner ตรวจ membership; ห้ามแก้ URL/Farm ID เอง |
| เปิดสวนได้แต่บันทึกไม่ได้ | Farm Suspended/Archived หรือ Read-only role | ตรวจ banner และติดต่อ Manager/Owner |
| QR ไม่ตรงงาน | สแกนคนละ Position/Farm | หยุดงานเดิม เปรียบเทียบ expected/actual และแจ้ง Manager |
| QR ใช้ไม่ได้ | กล้อง/decoder/permission/QR base ไม่พร้อม | ใช้ Manual code; ห้ามเดารหัสหรือพิมพ์ QR ใหม่ |
| Offline แล้วไม่พบต้น | ไม่มี cache ของ Position | กลับ Online; ห้ามใช้ข้อมูลต้นอื่นแทน |
| รูปค้าง Pending/Failed | network/re-encode/upload interruption | อย่า Submit; Retry ใน Sync Center ด้วย batch เดิม |
| HEIC เปิดไม่ได้ | device/browser decode ไม่รองรับ | หยุด upload; Local ใช้ JPEG/PNG/WebP จำลอง; Pilot ใช้ fallback ที่อนุมัติ |
| ส่งรายงานไม่ได้ | QR ไม่ยืนยัน, รูปไม่ครบ/ไม่ Uploaded, งาน Pause หรือ exception ไม่ครบ | แก้รายการตามข้อความ ไม่สร้าง Work ใหม่ซ้ำ |
| Conflict | server/role/master เปลี่ยนระหว่าง Offline | Manager review พร้อม reason หรือ escalate Owner |
| ยอด Inventory ติดลบ | quantity/type/unit/reference ผิด | ตรวจ Movement; ใช้ Correction ตามสิทธิ์ ห้ามแก้ย้อนหลังเงียบ ๆ |
| ยอดรับเกิน Gross | Deposit + Received มากกว่า Gross | ตรวจ Sales input/Correction และหลักฐานต้นทาง |
| Export ไม่ได้ | role ไม่มีสิทธิ์หรือ policy ยังไม่อนุมัติ | ห้ามยืมบัญชี; ขอ Owner review ตาม policy |
| เห็นข้อมูลต่างสวน | Critical Cross-Farm disclosure | หยุด เก็บหลักฐาน ไม่ Export/ส่งต่อ และแจ้ง Owner ทันที |

## 15. Acceptance criteria ของคู่มือ

- ครอบคลุม Sign-in, Farm Switcher, Online/Offline/Sync และ Sign-out
- อธิบายหน้าที่ ขอบเขต และข้อห้ามครบ 7 canonical roles
- ครอบคลุม Farm/member, Tree/QR, Work/Report/Verification, Care/Disease,
  Crop/Fruit/Harvest/Sales, Inventory, Dashboard, Conflict, Correction, Audit/Export
- ตารางกรอกข้อมูลแยก Required/Conditional/Optional, หน่วย, Unknown/Estimated/Measured
- อธิบายรูป INSTRUCTION กับ BEFORE/AFTER แยกกันและเงื่อนไข Submit ถูกต้อง
- ไม่อ้าง Local/Mock/Simulation เป็นข้อมูลจริง Physical evidence หรือ Production
- ทุก Cross-Farm/Wrong-Tree/Critical case มีคำสั่งหยุดและรายงาน Owner
- อ้าง Report Catalogue สำหรับ Weekly/Monthly Report โดยไม่อ้างว่าฟังก์ชันมีแล้ว

## 16. คำถามที่ต้อง Owner ตัดสินใจก่อน Pilot/Production

1. Account recovery เมื่อเปลี่ยนหรือสูญเสียหมายเลขโทรศัพท์
2. สิทธิ์ละเอียดของ Manager/Agronomist/Sales Inventory/Auditor ที่มี `*`
3. Chemical/treatment approval policy และเกณฑ์ severity จริง
4. Organization/Farm/Zone/Row codes, topology และวิธีวัด/นับจริง
5. Test/Production QR base URL, redirect owner และ permanent tag
6. Android/iPhone/OS/browser, HEIC fallback และ field usability
7. Retention, backup/export/disposal, Data Custodian, operator/approver และ key custody
8. Report period/cutoff, timezone fallback, KPI threshold, Fruit roll-up,
   dropped fruit, Payment Event, Export และ retention/distribution ตาม Report
   Catalogue และ `KDOMS_Report_Policy_Owner_Mockup_v0.1.md`

## 17. สถานะ Gate

- Gate 6: **Passed**
- PA-1 Local/Emulator: **Passed** ตาม DEC-037
- External PA-1: **NO-GO/BLOCKED** ตาม DEC-038
- PA-2, Controlled Pilot, Physical/Field Validation, Deployment และ Production:
  **Not Approved**

การจัดทำคู่มือนี้เป็น Documentation/Readiness work เท่านั้น ไม่เปลี่ยน Gate และไม่
อนุญาต External Action
