# Tree Register Import Data Dictionary v0.1

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Proposed — Owner Review Required |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md`, `tree-register-import-template.csv` |

> Data Dictionary นี้เป็น Working Proposal และตัวอย่างทุกค่าเป็นข้อมูลจำลอง
> ห้ามใช้เป็นข้อเท็จจริงของสวนหรือ production data

## 1. Conventions

- Required: `R` ต้องมีทุกแถว, `C` ต้องมีเมื่อกลุ่มนั้นมีค่า, `O` ไม่บังคับ
- Date-time ใช้ ISO 8601 พร้อม timezone เช่น `2026-08-31T09:00:00+07:00`
- Date ใช้ `YYYY-MM-DD`
- Confidence สำหรับ master/identity: `confirmed`, `estimated`, `unknown`
- Confidence สำหรับ measurement: `measured`, `estimated`, `unknown`
- Human Tag เป็น `{organizationCode}-{farmSequence}-{zoneCode}-{rowCode}-T{treeSequence padded}`
- Internal `organizationId`, `farmId` และ `positionId` ไม่รับจาก CSV; ระบบต้อง
  resolve/generate เป็น globally unique opaque IDs ใน trusted import flow
- `recordType=EXAMPLE` ต้องถูกปฏิเสธจาก production import

## 2. Columns

| # | Column | Req. | Type | Accepted values / validation | Example |
|---:|---|:---:|---|---|---|
| 1 | `recordType` | R | enum | `EXAMPLE` หรือ `FIELD_DATA`; production รับเฉพาะ `FIELD_DATA` | `EXAMPLE` |
| 2 | `organizationCode` | R | string | Uppercase A–Z/0–9, 2–10 ตัว; Working Proposal | `KGL` |
| 3 | `farmSequence` | R | string | `F` + เลขอย่างน้อย 2 หลัก; unique ภายใน Organization | `F01` |
| 4 | `zoneCode` | R | string | `Z` + เลขอย่างน้อย 2 หลัก หรือ format ที่ Field Validation อนุมัติ | `Z01` |
| 5 | `rowCode` | R | string | `R` + เลขอย่างน้อย 2 หลัก หรือ format ที่ Field Validation อนุมัติ | `R03` |
| 6 | `treeSequence` | R | integer | จำนวนเต็มบวก; pad เป็นอย่างน้อย 3 หลักใน Tag | `17` |
| 7 | `tagCode` | R | string | ต้องเท่ากับค่าที่ประกอบจาก columns 2–6 และไม่ซ้ำใน namespace | `KGL-F01-Z01-R03-T017` |
| 8 | `plantingCycle` | R | integer | จำนวนเต็มเริ่มที่ 1; ปลูกทดแทนเพิ่มค่า ห้ามลด/เขียนทับประวัติ | `1` |
| 9 | `variety` | O | string | ชื่อพันธุ์; ว่างได้เมื่อ unknown | `หมอนทอง` |
| 10 | `varietyConfidence` | C | enum | `confirmed`, `estimated`, `unknown`; ต้องมีเมื่อกรอก variety | `estimated` |
| 11 | `plantingYear` | O | integer | ปีตาม calendar ที่ระบุ; ว่างได้เมื่อ unknown | `2564` |
| 12 | `plantingYearCalendar` | C | enum | `BE` หรือ `CE`; ต้องมีเมื่อกรอก plantingYear | `BE` |
| 13 | `plantingYearConfidence` | C | enum | `confirmed`, `estimated`, `unknown`; ต้องมีเมื่อกรอก plantingYear | `estimated` |
| 14 | `treeStatus` | R | enum | `normal`, `watch`, `sick`, `recovering`, `dead`, `empty` | `normal` |
| 15 | `latitude` | C | decimal | -90 ถึง 90; ต้องมากับ longitude | ว่าง |
| 16 | `longitude` | C | decimal | -180 ถึง 180; ต้องมากับ latitude | ว่าง |
| 17 | `gpsAccuracyM` | C | decimal | มากกว่าหรือเท่ากับ 0; ต้องมีเมื่อมี GPS | ว่าง |
| 18 | `gpsMethod` | C | string | วิธี/อุปกรณ์ เช่น `device_gps_average_3` | ว่าง |
| 19 | `gpsMeasuredAt` | C | datetime | ISO 8601 + timezone | ว่าง |
| 20 | `gpsMeasuredBy` | C | string | Surveyor/user reference; ห้ามใช้ชื่อบุคคลจริงใน Example | ว่าง |
| 21 | `gpsConfidence` | C | enum | `measured`, `estimated`, `unknown` | ว่าง |
| 22 | `gpsSource` | C | string | แหล่ง/อุปกรณ์/แบบสำรวจที่ตรวจย้อนกลับได้ | ว่าง |
| 23 | `trunkMeasureType` | C | enum | `circumference` หรือ `diameter` | `circumference` |
| 24 | `trunkMeasureValue` | C | decimal | มากกว่า 0 | `80` |
| 25 | `trunkMeasureUnit` | C | enum | `cm` หรือหน่วยที่ Owner อนุมัติ | `cm` |
| 26 | `trunkMeasureHeightCm` | C | decimal | ความสูงจุดวัดจากพื้น หน่วย cm มากกว่าหรือเท่ากับ 0 | `100` |
| 27 | `trunkMeasureMethod` | C | string | วิธีทำซ้ำได้ เช่น `tape_at_fixed_height` | `tape_at_fixed_height` |
| 28 | `trunkMeasuredAt` | C | datetime | ISO 8601 + timezone | `2026-08-31T09:00:00+07:00` |
| 29 | `trunkMeasuredBy` | C | string | Surveyor/user reference | `EXAMPLE-USER` |
| 30 | `trunkMeasureConfidence` | C | enum | `measured`, `estimated`, `unknown` | `measured` |
| 31 | `trunkMeasureSource` | C | string | Survey form/device/source reference | `training_example` |
| 32 | `canopyWidthNSValue` | C | decimal | มากกว่า 0 | `4.2` |
| 33 | `canopyWidthNSUnit` | C | enum | `m` หรือหน่วยที่ Owner อนุมัติ | `m` |
| 34 | `canopyWidthEWValue` | C | decimal | มากกว่า 0 | `3.9` |
| 35 | `canopyWidthEWUnit` | C | enum | ต้องเป็นหน่วยเดียวกับ NS | `m` |
| 36 | `canopyMeasureMethod` | C | string | วิธี/แนวแกนที่ทำซ้ำได้ เช่น `cross_axis_tape` | `cross_axis_tape` |
| 37 | `canopyMeasuredAt` | C | datetime | ISO 8601 + timezone | `2026-08-31T09:05:00+07:00` |
| 38 | `canopyMeasuredBy` | C | string | Surveyor/user reference | `EXAMPLE-USER` |
| 39 | `canopyMeasureConfidence` | C | enum | `measured`, `estimated`, `unknown` | `measured` |
| 40 | `canopyMeasureSource` | C | string | Survey form/device/source reference | `training_example` |
| 41 | `heightValue` | C | decimal | มากกว่า 0 | `5.1` |
| 42 | `heightUnit` | C | enum | `m` หรือหน่วยที่ Owner อนุมัติ | `m` |
| 43 | `heightMeasureMethod` | C | string | วิธี/อุปกรณ์ที่ทำซ้ำได้ เช่น `rangefinder` | `rangefinder` |
| 44 | `heightMeasuredAt` | C | datetime | ISO 8601 + timezone | `2026-08-31T09:10:00+07:00` |
| 45 | `heightMeasuredBy` | C | string | Surveyor/user reference | `EXAMPLE-USER` |
| 46 | `heightMeasureConfidence` | C | enum | `measured`, `estimated`, `unknown` | `measured` |
| 47 | `heightMeasureSource` | C | string | Survey form/device/source reference | `training_example` |
| 48 | `baselineDate` | R | date | `YYYY-MM-DD`; ต้องสอดคล้องกับ measurement dates | `2026-08-31` |
| 49 | `notes` | O | string | Plain text; ห้าม secret/PII ที่ไม่จำเป็น | `EXAMPLE ONLY - NOT REAL FIELD DATA` |

## 3. Cross-field validation

1. `tagCode` ต้องประกอบจาก columns 2–6 แบบ deterministic และ normalize เป็น uppercase
2. `plantingCycle` เดียวกันห้ามซ้ำใน Planting Position เดียวกัน
3. หาก measurement group มี value ต้องมี unit, method, measuredAt, measuredBy,
   confidence และ source ครบ; ห้ามเก็บตัวเลขลอย ๆ
4. Canopy ต้องมีทั้ง NS และ EW พร้อม evidence ชุดเดียวกัน
5. GPS ต้องมี latitude/longitude เป็นคู่และใช้เพื่อ navigation เท่านั้น
6. ค่า `unknown` ต้องไม่ถูกแทนด้วย 0; ช่อง value ให้เว้นว่าง
7. Example row ต้องมี `recordType=EXAMPLE` และข้อความ `NOT REAL FIELD DATA`
8. Import ต้อง preview, report validation errors และไม่สร้าง partial records

## 4. Acceptance criteria

- CSV header มี 49 columns และทุก data row มีจำนวน columns เท่ากัน
- มี Example row เพียงหนึ่งแถวและระบุว่าไม่ใช่ข้อมูลจริง
- Trunk, canopy และ height มี evidence fields ครบตาม Scope
- ไม่มี internal opaque ID หรือ production identifier ที่ผู้ใช้กำหนดเองใน CSV
- Accepted values และ cross-field rules พร้อมใช้สร้าง validation ใน Phase 3

## 5. Owner decisions required before Field Validation

- Organization Code/Farm Sequence และ Zone/Row format จริง
- หน่วยมาตรฐานและ measurement methods ที่ผู้สำรวจทำซ้ำได้
- รหัสอ้างอิง measuredBy/source ที่ไม่เปิดเผยข้อมูลบุคคลเกินจำเป็น
- Tree status และ confidence vocabularies ฉบับอนุมัติ
