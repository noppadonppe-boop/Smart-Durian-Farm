# KDOMS Codex Master Prompt v1.1

| รายการ | ค่า |
|---|---|
| ผลิตภัณฑ์ | Smart Durian Farm / KongLak Durian Orchard Management System (KDOMS) |
| เวอร์ชัน | 1.1 — Multi-Farm baseline |
| สถานะ | Proposed — Owner Review Required |
| เจ้าของเอกสาร | Project Owner |
| Technology target | Vite + React + TypeScript + Firebase |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `AGENTS.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Decision-Log.md` |

## 1. บทบาทของ Codex

คุณเป็น Product Engineering Partner ของโครงการ KDOMS รับผิดชอบช่วยวิเคราะห์ วางแผน ออกแบบ สร้าง ทดสอบ และจัดทำเอกสารระบบบริหารสวนทุเรียน โดยต้องรักษาความถูกต้องของข้อมูลภาคสนาม ความปลอดภัยแบบ Multi-Farm และความง่ายต่อการใช้งานบนมือถือเป็นลำดับแรก

อย่าถือว่าข้อมูลตัวอย่างเป็นข้อเท็จจริงจริงของสวน หากยังไม่ได้รับการยืนยัน ให้ใช้ `TBD`, `Example` หรือบันทึกเป็นข้อสันนิษฐาน

## 2. Product vision

> ต้นทุเรียนทุกต้นมีตัวตนและประวัติที่เชื่อถือได้ เจ้าของเห็นภาพรวม ผู้จัดการวางแผนได้ และคนสวนทำงานถูกสวน ถูกแถว ถูกต้น แม้สัญญาณอินเทอร์เน็ตไม่เสถียร

ระบบต้องรองรับหลายสวนภายใต้องค์กรเดียว แต่ละสวนจัดการต้น ผู้ใช้ งาน วัสดุ ผลผลิต และการขายอย่างอิสระ พร้อม Portfolio Dashboard สำหรับผู้มีสิทธิ์

## 3. ผู้ใช้หลัก

| Canonical role | Scope | เป้าหมายหลัก |
|---|---|---|
| `ORG_OWNER` | Organization | ดูสวนที่ได้รับสิทธิ์ ตั้งค่าสวน สมาชิก และภาพรวมองค์กร |
| `FARM_MANAGER` | Farm | วางแผน อนุมัติ มอบหมาย และตรวจรับงานในสวน |
| `AGRONOMIST` | Farm | ตรวจสุขภาพ วินิจฉัย วางแผนรักษา และติดตามผล |
| `WORKER` | Farm | ดูงาน ค้นหาต้น สแกน QR บันทึกผลและภาพถ่าย |
| `SALES_INVENTORY` | Farm | ดูแลล็อตผลผลิต การขาย วัสดุ และต้นทุนตามสิทธิ์ |
| `VIEWER` | Farm | อ่านข้อมูลธุรกิจตามสิทธิ์โดยไม่แก้ไข |
| `AUDITOR` | Organization/Farm ตาม assignment | อ่าน audit/export ตาม scope โดยไม่แก้ข้อมูลปฏิบัติการ |

Role Matrix นี้เป็น Working Proposal ตาม
`01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md` ผู้ใช้คนเดียวอาจมี role
ต่างกันในแต่ละ Farm และยังไม่ถือว่า `Approved`

## 4. ขอบเขต MVP

### 4.1 Organization & Farm Management

- สร้าง แก้ไข ระงับ และ Archive สวน
- Farm Switcher ที่แสดงสวนที่ผู้ใช้มีสิทธิ์เท่านั้น
- สมาชิกและบทบาทแยกแต่ละสวน
- Farm profile: ชื่อ รหัส ที่ตั้ง timezone ฤดูกาล และสถานะ
- Portfolio summary สำหรับ Owner โดยไม่รวมข้อมูลสวนที่ไม่มีสิทธิ์

### 4.2 Farm topology & tree register

- Farm → Zone → Row → Planting Position → Planting Cycle
- รหัสตำแหน่งไม่ซ้ำและไม่เปลี่ยนหลังผลิตป้าย
- ทะเบียนต้น: พันธุ์ ปีปลูกโดยประมาณ สถานะ ขนาด พิกัด รูป และหมายเหตุ
- Tree timeline และประวัติรูป
- Bulk import พร้อม preview, validation และ reject report

### 4.3 Tag & QR

- Human Tag Working Proposal ใช้
  `{organizationCode}-{farmSequence}-{zone}-{row}-{tree}` เช่น
  `KGL-F01-Z01-R03-T017` (`KGL` = organizationCode, `F01` = farmSequence)
- Internal Organization/Farm/Position IDs เป็น globally unique opaque IDs
- QR เปิด configurable permanent route `/t/{opaquePositionId}`
- สแกนเพื่อยืนยันต้นก่อนบันทึกงานสำคัญ
- สร้างชุดข้อมูลส่งผลิตป้ายและตรวจ QR ซ้ำ/เสีย
- รายงานป้ายหาย ชำรุด หรือสแกนไม่ได้

### 4.4 Work orders

- งานรายต้น รายแถว รายโซน หรือชุดต้นที่เลือก
- ประเภทงาน เช่น ตรวจโรค ใส่ปุ๋ย ฉีดพ่น ให้น้ำ ตัดแต่ง นับผล เก็บเกี่ยว
- ผู้รับผิดชอบ กำหนดเวลา ลำดับความสำคัญ ขั้นตอน และวัสดุที่คาดว่าจะใช้
- สถานะ Draft → Assigned → Accepted → In progress → Submitted → Verified/Rejected → Closed
- ภาพก่อน–หลัง หมายเหตุ พิกัดโดยประมาณ และผู้ตรวจรับ
- งานรายกลุ่มต้องแยก exception ของต้นที่ทำไม่ได้หรือมีปัญหา

### 4.5 Tree care & disease

- บันทึกกิจกรรมดูแล ปุ๋ย ยา น้ำ ตัดแต่ง และตรวจสุขภาพ
- Incident ของโรค/แมลง: อาการ ความรุนแรง หลักฐาน สมมติฐานการวินิจฉัย การรักษา และนัดติดตาม
- แยก `observed symptom` ออกจาก `diagnosis`
- เก็บชื่อผลิตภัณฑ์ สารสำคัญ อัตรา หน่วย วิธีใช้ ผู้อนุมัติ และผู้ทำงานเท่าที่ขอบเขตอนุญาต
- ไม่ใช้แอปแทนคำแนะนำผู้เชี่ยวชาญหรือฉลากผลิตภัณฑ์

### 4.6 Flower, fruit, harvest & sales

- รอบผลผลิต (Crop Season/Cycle)
- บันทึกดอก ผลเริ่มต้น กลางรุ่น ก่อนขาย ผลร่วง และวิธีนับ
- วันที่คาดการณ์เก็บเกี่ยวและ confidence/หมายเหตุ
- Harvest lot เชื่อม Farm, Zone/Tree, วันที่ จำนวน น้ำหนัก เกรด และผู้บันทึก
- Sales lot เชื่อมผลผลิต ลูกค้า ราคา มัดจำ ยอดรับ ยอดค้าง และสถานะ
- เก็บ customer reference ขั้นต่ำตาม data minimization
- MVP ไม่รวม accounting, tax, payroll หรือ banking

### 4.7 Inventory & cost

- รายการปุ๋ย ยา วัสดุ หน่วยนับ ล็อต วันหมดอายุ และคงเหลือต่อสวน
- รับเข้า เบิกใช้ ปรับยอด และเหตุผล
- การเบิกใช้เชื่อม Work Order หรือ Care Event เมื่อเหมาะสม
- เตือนคงเหลือต่ำและใกล้หมดอายุ
- ไม่รวมการโอนระหว่างสวนใน MVP

### 4.8 Dashboard & audit

- สรุปต้นปกติ/เฝ้าระวัง/ป่วย งานค้าง งานเกินกำหนด ปัญหาเร่งด่วน และผลผลิตคาดการณ์
- Farm Dashboard แยกสวน; Portfolio Dashboard รวมเฉพาะสวนที่มีสิทธิ์
- Audit log สำหรับสิทธิ์ สถานะงาน การรักษา Inventory ผลผลิต และการขาย
- Export ตามสิทธิ์ พร้อมระบุเวลาและผู้ส่งออก

## 5. นอกขอบเขต MVP

- ระบบบัญชี ภาษี เงินเดือน หรือธนาคารแบบเต็มรูปแบบ
- Marketplace หรือ E-commerce สาธารณะ
- AI วินิจฉัยโรคอัตโนมัติโดยไม่มีผู้เชี่ยวชาญยืนยัน
- IoT automation เต็มระบบ
- การโอนต้น วัสดุ เงิน หรือประวัติข้ามสวน
- Native iOS/Android app แยกจาก PWA
- การสร้างประวัติย้อนหลังจากการคาดเดา

## 6. Business invariants

1. `organizationId` และ `farmId` ของข้อมูลปฏิบัติการต้องไม่เปลี่ยนข้าม tenant ด้วยการแก้ client payload
2. Human-readable Tag Code ไม่ซ้ำภายใน Organization/Farm namespace;
   opaque `positionId` เป็น identity ที่ unique ทั้งระบบ
3. Tag code ระบุตำแหน่ง ไม่ใช่ต้นชีวภาพเพียงรุ่นเดียว และไม่ใช้แทน authorization
4. ต้นปลูกทดแทนเพิ่ม planting cycle; ประวัติต้นเดิมยังคงอยู่
5. QR ใช้ `/t/{opaquePositionId}` ภายใต้ configurable base URL และไม่บรรจุ
   ข้อมูลที่เปลี่ยนแปลงได้หรือข้อมูลอ่อนไหว
6. การบันทึกงานจากการสแกนต้องตรวจว่าตรง Farm และเป้าหมายใน Work Order
7. Event สำคัญมี actor, server timestamp, source device, farm scope และ idempotency key
8. การแก้ประวัติสำคัญต้องตรวจสอบย้อนหลังได้
9. หน่วยและอัตราต้องระบุชัด ห้ามเก็บตัวเลขลอย ๆ โดยไม่มีหน่วย
10. Archive เป็นค่าเริ่มต้นสำหรับข้อมูลที่มีประวัติ; hard delete ใช้เฉพาะนโยบายที่อนุมัติ

## 7. Technical baseline หลัง Gate 0

### Frontend

- Vite
- React
- TypeScript strict
- React Router
- Mobile-first responsive UI และ installable PWA
- Form validation ที่มี schema เดียวกับ domain contract เท่าที่ทำได้
- Accessible controls, touch targets และภาษาไทยเป็นหลัก

### Firebase

- Firebase Authentication
- Cloud Firestore
- Cloud Storage สำหรับรูปภาพ
- Cloud Functions หรือ trusted backend สำหรับงานที่ client ไม่ควรทำเอง
- Firebase Hosting หรือทางเลือกที่อนุมัติภายหลัง
- Local Emulator Suite สำหรับการพัฒนาและทดสอบ

อย่าสร้าง Firebase production project, credentials หรือ billing resources โดยไม่มีการอนุมัติแยก

## 8. Conceptual data model

```text
organizations/{organizationId}
  members/{userId}
  farms/{farmId}
    members/{userId}
    zones/{zoneId}
    rows/{rowId}
    positions/{positionId}
      plantingCycles/{cycleId}
    workOrders/{workOrderId}
    careEvents/{eventId}
    diseaseIncidents/{incidentId}
    cropCycles/{cropCycleId}
    fruitObservations/{observationId}
    harvestLots/{harvestLotId}
    salesLots/{salesLotId}
    inventoryItems/{itemId}
    inventoryMovements/{movementId}
    auditEvents/{auditEventId}
```

เส้นทางนี้เป็นแนวคิด ไม่ใช่ Firestore schema ที่อนุมัติแล้ว ต้องทำ query/access review และ rules test ก่อนใช้งาน

## 9. Offline and sync policy

- หน้าแสดงข้อมูลต้องบอกเวลาซิงก์ล่าสุด
- การบันทึกภาคสนามแสดง Pending → Syncing → Synced หรือ Conflict
- ใช้ client-generated operation ID/idempotency key สำหรับ event ที่ส่งซ้ำได้
- รูปภาพมี local pending state และ retry แบบเห็นได้
- Event history เน้น append-only; การแก้ไขใช้ correction ที่อ้าง event เดิม
- Master data conflict ต้องไม่ถูกกลบแบบเงียบ ๆ ให้ผู้มีสิทธิ์เลือกผลลัพธ์
- `FARM_MANAGER` เป็นผู้ review master-data conflict และ escalate ถึง
  `ORG_OWNER`; การแก้ประวัติใช้ correction event
- การสแกนป้ายที่ไม่มีข้อมูล cache ต้องอธิบายว่าต้องออนไลน์ ไม่แสดงข้อมูลผิดต้นจาก cache อื่น

## 10. Security baseline

- Deny by default
- ตรวจ membership และ role ทุก read/write ที่ขอบเขต Farm
- Client ห้ามกำหนด role, organizationId หรือ farmId ที่ trusted backend ยังไม่ตรวจ
- เขียน emulator tests อย่างน้อย: same-farm allow, cross-farm deny, revoked member deny, archived farm policy, role downgrade และ forged payload
- Signed-in ไม่ได้แปลว่ามีสิทธิ์ทุกสวน
- จำกัดการเข้าถึงรูปและ export ตาม Farm/Role
- บันทึก audit เมื่อเพิ่ม/ลดสิทธิ์หรือ export ข้อมูลสำคัญ
- Export ต้องจำกัด Farm/Role, ใช้ data minimization และสร้าง audit event
- Archive-before-delete เป็นค่าเริ่มต้น; ห้าม real/production data จนกว่า
  retention, backup และ privacy policy จะได้รับอนุมัติ

## 11. UX principles

- ผู้ใช้เห็นชื่อและรหัสสวนปัจจุบันตลอดเวลาที่กำลังบันทึกข้อมูล
- การสลับสวนเป็น action ที่ชัดและยืนยันเมื่อมีข้อมูลค้างส่ง
- งานคนสวนเปิดได้ไม่เกินไม่กี่ขั้น: งานของฉัน → นำทาง → สแกน → ทำ → รายงาน
- สีต้องมีข้อความหรือสัญลักษณ์ร่วม ไม่พึ่งสีอย่างเดียว
- ข้อมูลตัวเลขใช้หน่วยที่อ่านง่ายและ keypad ที่เหมาะสม
- ปุ่มหลักแต่ละหน้ามีไม่เกินหนึ่ง action เด่น
- แสดง Offline/Sync state โดยไม่รบกวนงาน
- การกระทำย้อนกลับยากต้องมี confirmation และผลที่ชัดเจน

## 12. Testing strategy

### Phase-level tests

- Unit tests สำหรับ domain functions, parsing, validation และ permissions helpers
- Component tests สำหรับ forms, farm switcher, QR result และ offline states
- Emulator tests สำหรับ Firestore Rules, Storage Rules และ Functions
- End-to-end tests สำหรับเส้นทาง Owner, Manager และ Worker
- Accessibility checks และทดสอบหน้าจอ 320px ขึ้นไป
- Field usability test: เวลาค้นหาต้น อัตราสแกนผิด และการส่งงานในสัญญาณอ่อน

### Critical scenarios

1. ผู้ใช้สวน A พยายามอ่าน/เขียนสวน B
2. Worker เปลี่ยน `farmId` ใน payload
3. สแกน QR ผิดต้นจากใบงาน
4. ส่งรายงานเดิมซ้ำหลังเน็ตหลุด
5. ต้นตายและปลูกใหม่ที่ตำแหน่งเดิม
6. งานกลุ่มสำเร็จบางต้นและมี exception
7. รูปอัปโหลดสำเร็จแต่ event ยังไม่ sync หรือกลับกัน
8. ปิด/Archive สวนที่ยังมีงานเปิด

## 13. Development phases and gates

### Phase 0 — Product & Documentation Readiness

Scope, user/workflow, Role Matrix, Tag/QR proposal, Data Dictionary,
Field Validation Plan, UX preview, security/data-policy baseline และ Gate 0 approval

### Phase 1 — Foundation

Repository/app scaffold, environments, CI, Firebase emulator, authentication shell, design tokens และ test harness

### Phase 2 — Multi-Farm & Access

Organization, Farm Management, Farm Switcher, memberships, roles, rules matrix และ cross-farm tests

### Phase 3 — Farm Map, Tree Register & QR

Field Validation Gate ต้องผ่านก่อนล็อก implementation/ผลิตป้ายจริง จากนั้นจึงทำ
Zone/Row/Position/Planting Cycle, import, tag generation, QR scan และ tree timeline

### Phase 4 — Work, Care & Disease

Work orders, group tasks, worker reports, care events, disease incidents และ follow-up

### Phase 5 — Fruit, Harvest, Sales & Inventory

Crop cycle, fruit counts, harvest lots, sales lots, inventory movements และ cost linkage

### Phase 6 — Dashboard, Offline Hardening & Audit

Farm/Portfolio dashboard, conflict workflow, performance, audit/export และ security hardening

### Phase 7 — Operational Application Pilot, Rollout & Operations

ใช้แอปที่ผ่าน Gate 6 กับผู้ใช้จริงในกลุ่มที่ผ่าน Field Validation แล้ว ทำ training,
feedback, fixes, backup/export และ operating guide ก่อนเสนอขยายประมาณ 600 ต้น

แต่ละ Phase เริ่มได้เมื่อ Gate ก่อนหน้าผ่านด้วยการอนุมัติที่บันทึกไว้

## 14. Workflow ของ Codex ต่อหนึ่งงาน

1. ตรวจ Working Directory, `AGENTS.md`, Source of Truth และสถานะไฟล์
2. สรุปความเข้าใจ ขอบเขตที่รวม/ไม่รวม และข้อสันนิษฐาน
3. เสนอแผนพร้อมไฟล์ที่จะเปลี่ยน เกณฑ์ยอมรับ และวิธีทดสอบ
4. รออนุมัติหากงานขยาย Phase หรือมีผลภายนอกที่สำคัญ
5. ทำการเปลี่ยนแปลงแบบเล็ก รักษาไฟล์เดิม และไม่แทรก secret
6. ตรวจ lint/typecheck/test/render ตามความเสี่ยง
7. รายงานผล ไฟล์ การทดสอบ ข้อจำกัด และ Gate status
8. อัปเดต Decision Log เมื่อเกิดการตัดสินใจใหม่

## 15. Master prompt สำหรับเริ่มงานกับ Codex

```text
คุณกำลังทำงานในโครงการ Smart Durian Farm / KDOMS

ก่อนดำเนินการ ให้ทำตามลำดับ:
1. อ่าน AGENTS.md
2. อ่าน 01-Requirements/KDOMS_Scope_Knowledge_v0.2.md
3. อ่าน 01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md
4. อ่านเอกสารเฉพาะโดเมนที่เกี่ยวข้อง
5. ตรวจ Working Directory และสถานะไฟล์

ให้ใช้ Multi-Farm security, permanent tree-position identity, auditability,
offline/idempotency และ mobile-first field usability เป็นข้อบังคับ

ดำเนินงานเฉพาะ Phase และขอบเขตที่ได้รับอนุมัติเท่านั้น
ห้ามสร้างข้อเท็จจริงภาคสนามหรือ credentials

ก่อนแก้ไฟล์ ให้สรุป:
- เป้าหมายและสิ่งที่ไม่ทำ
- ข้อสันนิษฐาน/คำถาม
- ไฟล์ที่จะเปลี่ยน
- Acceptance criteria
- วิธีตรวจสอบ

เมื่อเสร็จ ให้รายงานเป็นภาษาไทย:
- ผลลัพธ์
- ไฟล์ที่เปลี่ยน
- การตรวจสอบ
- ความเสี่ยง/คำถามค้าง
- Gate status และสิ่งที่ต้องอนุมัติต่อไป
```

## 16. Template สำหรับขอทำงานในแต่ละ Phase

```text
Phase: [ระบุ]
งาน: [เป้าหมายที่ตรวจสอบได้]
เอกสารอ้างอิง: [ไฟล์]
In scope: [รายการ]
Out of scope: [รายการ]
ข้อมูลจริงที่ให้: [รายการ]
ข้อจำกัด: [รายการ]
Acceptance criteria: [รายการ]
ต้องรออนุมัติก่อนแก้ไฟล์หรือไม่: [ใช่/ไม่]
```
