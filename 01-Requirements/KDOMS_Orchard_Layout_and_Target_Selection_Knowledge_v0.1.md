# KDOMS Orchard Layout and Target Selection Knowledge v0.3.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.3.1 |
| สถานะ | Approved Baseline — Direction Selector and Tree Circle/TAG (DEC-052), Two Views/Target Actions (DEC-045/047), Operational Tree Register Boundary (DEC-046) |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-04 |
| ขอบเขต | แปลนสวนเชิงโครงสร้างและตัวเลือกเป้าหมายกลางสำหรับ Mock/Emulator พร้อมอ่าน topology ทะเบียนต้นจริงตาม DEC-046 |
| Source of Truth | คำสั่งล่าสุดของ Project Owner, `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md`, `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md`, `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`, `00-Project-Management/Decision-Log.md` (DEC-045, DEC-046, DEC-047, DEC-052, DEC-053) |

## 1. คำตัดสิน

- ให้มีหน้า `แปลนสวนและเลือกตำแหน่ง` ซึ่งแสดงชื่อ/รหัสสวน โซน แถว และตำแหน่งต้น
- ภายในแต่ละโซน แถวเรียงจากซ้ายไปขวาและเริ่มรหัสแถวใหม่ได้ เช่น `R01`
- ภายในแต่ละแถว ตำแหน่งต้นเรียงจากบนลงล่างและเริ่มลำดับใหม่ เช่น `T001`
- ด้านบนของแปลนต้องมีจุดอ้างอิงกำกับเสมอ; ค่าจริงยังเป็น `TBD` จนกว่าจะยืนยันจากภาคสนาม
- ตำแหน่ง `ไม่มีต้น` ยังคงแสดงเพราะเป็น Planting Position ถาวร แต่เลือกได้เฉพาะ Workflow ที่รองรับ เช่น ตรวจตำแหน่งหรือปลูกทดแทน
- งานแบบชุดต้นเลือกข้ามหลายโซนใน Farm เดียวกันได้ โดยเก็บ Position snapshot และสรุปแยก Zone
- ใช้ตัวเลือกเป้าหมายกลางร่วมกันใน Work Order, Disease Incident, Fruit Observation,
  Harvest source และ Workflow อื่นที่ต้องอ้างต้น/พื้นที่
- ต้องเก็บทั้งมุมมอง `แปลนต้น` และ `ตารางติ๊กเลือก`; การสลับมุมมองไม่ล้าง
  selection และทั้งสองมุมมองต้องใช้ eligibility/Position ID ชุดเดียวกัน
- ภายในมุมมอง `แปลนต้น` ต้องเลือกแสดง Row แบบแนวตั้งหรือแนวนอนได้ การสลับ
  ทิศทางไม่ล้าง selection และไม่เปลี่ยนลำดับ `treeSequence` หรือ Position ID
- ตำแหน่งต้นแสดงเป็นวงกลมและมี Human-readable TAG/หมายเลขใต้ต้น พร้อมข้อความ
  สถานะที่ไม่พึ่งสีเพียงอย่างเดียว
- ปุ่ม `กลับ` ของหน้าแปลนต้องไปเมนู `ต้นไม้` (`/trees`) เพื่อคงบริบททะเบียนต้น
- Zone เป็นข้อมูลแบบ data-driven และต้องแสดงแยกทุก Zone ที่มีใน Farm เช่น
  `Z01`, `Z02`, `Z03` โดยไม่กำหนดจำนวน Zone ตายตัวใน UI
- หน้าแปลนต้องมีเมนูจาก selection ครบ 5 ปลายทางที่อนุมัติ: Work ทั่วไป,
  Work ดูแล, Disease Incident, Fruit Observation และ Harvest Lot
- การเลือกจากแปลนไม่ยกเลิก QR confirmation สำหรับการปฏิบัติงานสำคัญรายต้น
- DEC-046 อนุญาตให้บันทึกและอ่าน Zone/Row/Position จริงในขอบเขตทะเบียนต้นเฉพาะ
  Firebase Production + Farm `OPERATIONAL` (`isMock=false`) หลัง Owner ยืนยัน
  topology; ค่าไม่ยืนยันยังเป็น `TBD` และห้ามสร้างจากค่าคาดเดา
- Target Selector สำหรับการสร้าง Work/Disease/Fruit/Harvest mutation ยังอยู่ภายใต้
  approval ของ workflow นั้นเอง; DEC-046 ไม่อนุมัติ deployment เพิ่มเติม,
  Controlled Pilot, PA-2 หรือ Production rollout ของโมดูลเหล่านั้น

## 2. รูปแบบแปลน

รุ่นแรกเป็น `DERIVED-STRUCTURAL-V1` สร้างจากข้อมูลทะเบียนตำแหน่งเดิม:

```text
Farm
└── Zone (เรียงตาม Zone Code)
    └── Row (คอลัมน์ซ้าย → ขวา)
        └── Planting Position (บน → ล่างตาม treeSequence)
```

projection สำหรับแสดงผลมี 2 แบบ โดยไม่อ้างว่าเป็นแนวจริงทางภูมิศาสตร์:

- `แถวแนวตั้ง`: Row เรียงซ้าย→ขวา และ Position ใน Row เรียงบน→ล่าง
- `แถวแนวนอน`: Row เรียงบน→ล่าง และ Position ใน Row เรียงซ้าย→ขวา
- ค่าเริ่มต้นใช้ `แถวแนวตั้ง` เพื่อคงพฤติกรรมเดิม แต่ผู้ใช้สลับได้ตลอด
- การเลื่อนที่จำเป็นต้องอยู่ภายในกรอบ Zone และไม่ทำให้ทั้งหน้าเลื่อนแนวนอน

- แปลนเชิงโครงสร้างไม่อ้างว่าเป็นระยะ สเกล พิกัด หรือแนวเหนือจริง
- `layoutX/layoutY`, รูปร่างโซน ทางเดิน คูน้ำ และ Landmark เป็นส่วนขยายภายหลัง
- GPS ใช้เพื่อการนำทางโดยประมาณเท่านั้นและไม่เป็น identity/security boundary
- หน้าจอต้องมีมุมมอง `แปลนต้น` และ `ตารางติ๊กเลือก` เพื่อรองรับมือถือ Keyboard
  และ Accessibility; ตารางต้องมี checkbox ทั้งระดับ Zone, Row และ Position ตาม mode
- การเลื่อนแนวนอนต้องอยู่ภายในกรอบแปลน ไม่ทำให้หน้าฟอร์มทั้งหน้าเลื่อนแนวนอน

## 3. Target Selection contract

ตัวเลือกกลางรองรับอย่างน้อย:

- `SINGLE`: ต้นเดียว
- `MULTIPLE`: ชุดต้นกำหนดเอง รวมหลายแถว/หลายโซนใน Farm เดียวกัน
- `ROW`: เลือก Position ที่ใช้ได้ทั้งหมดในแถวหนึ่ง
- `ZONE`: เลือก Position ที่ใช้ได้ทั้งหมดในโซนหนึ่ง

ข้อมูลที่บันทึกต้องใช้ `organizationId + farmId + positionIds` ที่ตรวจสิทธิ์แล้ว
พิกัดแปลน ลำดับบนจอ และ Human-readable Tag ไม่ใช่ identity หรือ authorization
สำหรับ Work Order ให้เก็บ `positionIds` เป็น snapshot ณ เวลาสร้าง พร้อม `zoneCodes`
เพื่ออธิบายชุดต้นข้ามโซน โดย QR/การส่งรายงานยังตรวจ Position จริงอีกครั้ง

Navigation state จากหน้าแปลนเป็นเพียงคำขอเลือกค่าเริ่มต้น แต่ละหน้าปลายทางต้องกรอง
กับทะเบียนของ Farm ปัจจุบันอีกครั้งและละทิ้ง ID ที่ไม่พบหรือข้าม Farm
Navigation state ต้องระบุ intent ที่รู้จักและ fail closed เมื่อ Farm/intent ไม่ตรงกัน
เพื่อให้หน้า Work prefill category และหน้า Production เปิด Fruit/Harvest form ถูกส่วน

## 4. Eligibility ตาม Workflow

| Workflow | Scope | ตำแหน่ง `ไม่มีต้น` |
|---|---|---|
| Work Order งานทั่วไป/ตรวจตำแหน่ง | Single/Multiple/Row/Zone | เลือกได้ |
| งานดูแลต้นที่ต้องมีต้น | Single/Multiple/Row/Zone | เลือกไม่ได้ |
| Disease Incident | Single | เลือกไม่ได้ |
| Fruit Observation | Tree set หรือ Zone | เลือกไม่ได้ |
| Harvest source | Multiple/Row/Zone | เลือกไม่ได้ |
| อ่านทะเบียน/Timeline | Read only | เปิดดูได้ |

Archived Position แสดงได้ในแปลนเพื่อรักษาบริบท แต่ห้ามเลือกสำหรับ mutation ใหม่
สวน `SUSPENDED`/`ARCHIVED` เปิดดูได้ตาม membership แต่ห้ามสร้างข้อมูลปฏิบัติการ

## 5. Multi-Farm, offline และ audit

- ตัวเลือกต้องรับเฉพาะ Position ของ Organization/Farm ปัจจุบัน; หาก payload ปะปน
  ให้ fail closed และไม่ render ข้อมูลต่างสวน
- Farm switch ต้องล้าง selection ที่ยังไม่บันทึก หรือคง draft โดยล็อก Farm เดิมตาม policy
- แปลนและทะเบียนที่ cache ไว้ต้องแสดง last-sync/offline state; การบันทึกใช้ queue,
  idempotency และ conflict policy เดิม
- Mutation ที่เกิดจาก selection ต้อง audit actor, Farm, เวลา, target และ before/after
  ตามชนิดข้อมูลเดิม; การคลิกเลือก/ยกเลิกที่ยังไม่บันทึกไม่ต้องสร้าง Audit Event

## 6. Acceptance criteria

- หน้าแปลนแสดง Farm name/code และ Zone โดยค่าเริ่มต้นวาง Row ซ้าย→ขวาและ Tree
  บน→ล่างเพื่อคงพฤติกรรมเดิม
- หน้าแปลนสลับ Row แนวตั้ง/แนวนอนได้ แสดงวงกลมต้นพร้อม TAG ใต้ต้น และ selection
  เดิมยังอยู่หลังสลับทิศทาง
- ปุ่ม `กลับ` เปิด `/trees` และไม่ส่งผู้ใช้ไปหน้า `เพิ่มเติม`
- Position ที่ไม่มีต้นหรือ Archived ยังมองเห็นพร้อมข้อความสถานะ ไม่พึ่งสีอย่างเดียว
- ผู้ใช้เลือกต้นเดียว หลายต้น ทั้งแถว และทั้งโซนได้ตาม Workflow
- Work แบบชุดต้นเลือกข้ามโซนใน Farm เดียวกันได้และเก็บ Position snapshot ครบ
- Work, Disease, Fruit Observation และ Harvest ใช้ตัวเลือกกลางแทนการกรอก opaque ID
- สลับ `แปลนต้น` ↔ `ตารางติ๊กเลือก` แล้ว selection เดิมยังอยู่และผลสรุปแยก Zone
- UI แสดง Zone ตามข้อมูลทุกค่า เช่น Z01/Z02/Z03 โดยไม่ต้องแก้โค้ดเพิ่มราย Zone
- เมนูจากตำแหน่งที่เลือกมี 5 Workflow และส่ง intent ไปยังฟอร์มปลายทางถูกต้อง
- Navigation selection ข้าม Farm หรือ ID ที่ forge ถูกละทิ้ง/ปฏิเสธ
- QR confirmation ของงานรายต้นยังคงเดิมและ mismatch หยุด action เดิม
- ใช้งานที่ 320px โดยไม่มี horizontal scroll ทั้งหน้าและมี checklist fallback
- Unit/component/E2E และ Firebase Emulator regression ผ่านด้วยข้อมูล
  `SIMULATED/TEST ONLY`; ผล Browser simulation ไม่ใช่ Field/Physical evidence
- แปลนของ Farm `OPERATIONAL` อ่านเฉพาะ Position ที่มี classification สอดคล้องกัน;
  record จำลอง/ข้าม Farm ต้องไม่ปะปนและต้อง fail closed

## 7. รายการที่ยัง `TBD`

- จุดอ้างอิงจริงของด้านบนแปลนในแต่ละ Farm/Zone
- topology จริง จำนวนแถว จำนวนตำแหน่ง ช่องว่าง และแนวแถวที่ไม่เป็นเส้นตรง
- `layoutX/layoutY`, Landmark, background image หรือ geospatial overlay ที่จะใช้จริง
- วิธีใช้แปลนกลางแดด/ถุงมือและประสิทธิภาพกับจำนวนต้นจริง
- trusted server validation สำหรับ target set ขนาดใหญ่ก่อน External Pilot/Production
