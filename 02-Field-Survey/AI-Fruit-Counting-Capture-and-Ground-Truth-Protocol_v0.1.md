# AI Fruit Counting Capture and Ground-Truth Protocol v0.2

| รายการ | ค่า |
|---|---|
| รหัสโครงการย่อย | `AIFC-01` |
| เวอร์ชัน | 0.2 |
| สถานะ | Approved Protocol Design — Manual/AI Paths; Mock/local-only; Field Execution Not Authorized |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | AIFC Knowledge v0.2, AIFC Plan v0.2, Development/Mock Data/Pilot Knowledge, Tag and QR Standard, UX/UI Knowledge, DEC-032 และ DEC-033 |

## 1. Purpose and authorization boundary

กำหนดวิธีจำลอง Capture และ Ground Truth สำหรับ WP0–WP2 และเตรียมโครง protocol
สำหรับ Owner Review ในอนาคต เอกสารนี้ **ไม่อนุญาต** ถ่ายภาพสวนจริง ใช้อุปกรณ์จริง
ลงพื้นที่ สแกน QR จริง สร้าง dataset จริง หรือเริ่ม Controlled Pilot

ค่าจำนวนมุม ระยะถ่าย แสง อุปกรณ์ รุ่นโทรศัพท์ ขนาดผล เกณฑ์ Size band และเวลา
ทำงานจริงยัง `TBD` ห้ามนำ mock value ไปใช้เป็นคำสั่งภาคสนาม

## 2. Mock capture objective

Mock Capture ต้องพิสูจน์ว่า workflow สามารถ:

1. ยืนยัน Farm/Position/Planting/Crop/Stage ก่อนเริ่ม Session
2. รับ view หลายรายการโดยไม่บวกจำนวนซ้ำตรง ๆ
3. แสดง coverage/limitation และรายการไม่แน่ใจ
4. ให้คน review detection/track และบันทึกเหตุผล
5. commit ผลแบบ `ESTIMATED` อย่าง idempotent
6. คง Farm scope เมื่อ offline/retry/farm switch

## 3. Mock prerequisites

- signed-in simulated actor ที่มี role ตาม policy
- active simulated Farm และ Crop Cycle
- opaque simulated Position/Planting Cycle IDs
- placeholder capture manifest ติดป้าย `SIMULATED/TEST ONLY`
- fixture version และ scenario label
- expected mock ground truth ที่แยกจาก engine result

ห้ามใช้ชื่อ/รหัสสวนจริง รูปจริง พิกัดจริง topology จริง หรือ production QR URL

## 4. Mock capture sequence

ผู้บันทึกต้องเลือก `countingMode` ก่อน:

- `MANUAL`: คนนับ/ประมาณตาม `countMethod` แล้วบันทึกจำนวนและข้อจำกัดโดยตรง;
  ห้ามอ้าง AI Count Session
- `AI_ASSISTED`: เลือก capture method, รัน deterministic mock, ตรวจ/แก้จำนวน
  ที่เสนอ แล้วจึงบันทึกเป็น `ESTIMATED` พร้อม Session reference

```text
เลือก Farm จำลอง
→ เปิด Position จำลอง/QR route placeholder
→ เลือก Crop Cycle + Stage
→ สร้าง Count Session
→ เพิ่ม View `V01...VNN` จาก placeholder manifest
→ ยืนยัน coverage note
→ รัน Deterministic Mock Engine
→ ตรวจ overlay/detection/track/uncertain
→ Human Review พร้อม reason
→ commit Fruit Observation (`ESTIMATED`)
```

`VNN` ไม่กำหนดจำนวนมุมจริง จำนวน view ของแต่ละ fixture ถูกกำหนดเพื่อทดสอบ
scenario เท่านั้นและไม่ใช่ field recommendation

## 5. View record

แต่ละ mock view มี:

- `viewId`
- `sequenceIndex`
- `placeholderMediaId`
- `captureMethod`
- `coverageLabel`: `PARTIAL`, `OVERLAPPING`, `UNKNOWN`
- `qualityFlags`: mock blur, glare, occlusion, too-far, incomplete
- `capturedAtLabel`, `capturedBy`
- `exampleData=true`

ห้ามใช้ compass direction จริง เว้นแต่เป็น mock label ที่ระบุชัดและไม่ถูกตีความว่าเป็น
topology ของสวน

## 6. Mock ground-truth design

Ground Truth fixture ต้องสร้างแยกจาก mock engine output และมี:

- stable `groundTruthFruitId`
- view IDs ที่ผลจำลองมองเห็น
- expected detections ต่อ view
- expected track membership ข้าม view
- visibility/occlusion label
- expected uncertainty
- expected size band ถ้ามี
- expected final count

ต้องมี scenario ที่ engine ตั้งใจให้ผิดเพื่อพิสูจน์ metric และ Human Review ไม่ใช่
สร้างเฉพาะกรณี perfect result

## 7. Required fixture scenarios

| Scenario | Ground Truth purpose |
|---|---|
| `AIFC-S01-SINGLE-PARTIAL` | single view เห็นบางส่วนและห้าม claim Full Count |
| `AIFC-S02-MULTI-DUPLICATE` | ผลเดียวปรากฏหลาย view และต้องรวม track |
| `AIFC-S03-OCCLUDED-UNCERTAIN` | detection ไม่ชัดและต้อง review |
| `AIFC-S04-FALSE-POSITIVE` | คนลบรายการผิดพร้อม reason |
| `AIFC-S05-MISSED-ITEM` | คนเพิ่มรายการที่ fixture ระบุว่าพลาด |
| `AIFC-S06-INFERENCE-FAIL-RETRY` | retry ไม่สร้าง Session/result ซ้ำ |
| `AIFC-S07-CROSS-FARM-DENY` | foreign Farm evidence/reference ถูกปฏิเสธ |
| `AIFC-S08-OFFLINE-CONFLICT` | pending/replay/version conflict |
| `AIFC-S09-SIZE-BAND-ONLY` | ทดสอบ band โดย physical size/weight เป็น null |
| `AIFC-S10-UNKNOWN-NO-COUNT` | unknown result ไม่แสดงจำนวนหลอก |

ทุกจำนวนใน fixture เป็นข้อมูลจำลองและต้องเก็บใน versioned mock pack เท่านั้น

## 8. Human review protocol

ผู้ตรวจต้องเห็น:

- Farm, Position, Crop Cycle, Stage และ Session ID
- view coverage และ limitation
- detections แยกตาม view
- track ที่รวม detection ข้าม view
- uncertain/duplicate candidates
- AI-visible, tracked และ proposed final count แยกกัน

Review action:

- `KEEP`: ยืนยันรายการ
- `REMOVE`: false positive; บังคับ reason
- `MERGE`: หลาย detection เป็นผลเดียว; บังคับ reason
- `SPLIT`: track รวมผิด; บังคับ reason
- `ADD`: missed item ใน mock fixture; บังคับ reason/reference
- `DEFER`: หลักฐานไม่พอ ห้ามรวมเป็น final อัตโนมัติ

หลัง review ต้องแสดง arithmetic summary ก่อน commit

จำนวนที่ AI เสนอเป็นค่าเริ่มต้นในช่องตรวจทาน ผู้ตรวจสามารถแก้ได้ก่อน Submit;
ค่าที่บันทึกต้องเก็บ `sourceCountSessionId` และห้ามแสดงเป็น `MEASURED`

## 9. Crop-stage protocol design

| Stage | Mock design | Future Ground Truth question |
|---|---|---|
| `FLOWERING` | Manual/UNKNOWN; ปิด AI fruit count | จะนับช่อ/ดอกเป็น domain แยกหรือไม่ |
| `EARLY_FRUIT` | Manual หรือ AI partial/uncertain | วิธีจัดการผลเล็กและผลร่วง |
| `MID_SEASON` | Manual หรือ AI multi-view/dedup | coverage ใดจึงพิจารณา Full Count |
| `PRE_SALE` | Manual หรือ AI count + size-band | threshold และ use case ระดับ planning/commercial |
| `HARVESTED` | Manual หรือ AI reconciliation contract | วิธีเชื่อม actual Harvest count/weight |

## 10. Size ground truth

WP0–WP2:

- ใช้ expected size band จำลอง
- physical dimension และ weight ต้องเป็น null
- threshold ของ band เป็น scenario metadata ไม่ใช่มาตรฐานพันธุ์จริง

Future AIFC-G2 proposal ต้องกำหนด:

- นิยาม length/width/circumference และจุดวัด
- เครื่องมือ calibration/depth/manual reference
- unit, operator, measuredAt และ repeat measurement
- วิธีจับคู่ผลที่วัดกับ media/track โดยไม่สับสนต้น
- cultivar/stage segmentation และ safety constraint

## 11. Future field Ground Truth proposal — not authorized

เมื่อขอ AIFC-G2 ในอนาคต ควรเสนออย่างน้อย:

1. independent manual count ที่ไม่เห็นผล AI ก่อน
2. second count หรือ adjudication สำหรับ evaluation subset
3. บันทึก `FULL_COUNT`/`PARTIAL`/`ESTIMATE` แยกชัดเจน
4. actual Harvest reconciliation เมื่อได้รับอนุมัติและ trace ได้
5. Train/Validation/Test split ตาม Tree/Session/Time ไม่กระจายเฟรมเดียวกันข้าม split
6. annotation guideline, reviewer agreement และ correction history
7. approved retention, access, export, backup, disposal และ vendor policy

จำนวนต้น session view และ device ยัง `TBD` และต้องได้รับ Owner approval

## 12. Metric recording template

| Metric | Mock evidence | Future field meaning |
|---|---|---|
| Precision/Recall | fixture detections | visible-fruit detection performance |
| Absolute count error | expected final count | error ต่อ Session/Tree/Stage |
| Signed bias | expected minus result | systematic under/over-count |
| Duplicate rate | expected track groups | multi-view dedup quality |
| Human correction rate | review events | operational review burden |
| Repeatability | repeated fixtures | same-tree capture variability |
| Size-band accuracy | expected bands | classification performance |
| Physical-size MAE | not applicable | ต้องมี centimeter Ground Truth |

Mock metric ใช้ตรวจ harness เท่านั้น ห้ามรายงานเป็น field accuracy

## 13. Data split and leakage prevention

สำหรับ mock pack ให้ split ตาม `scenarioFamilyId` เพื่อพิสูจน์ tooling ในอนาคต
เมื่อมี real dataset ที่อนุมัติ ต้องห้าม frame หรือภาพใกล้เคียงจาก Tree/Session เดียวกัน
กระจายไปทั้ง Train และ Test เพราะจะทำให้ผลดูดีกว่าการใช้งานจริง

## 14. Safety and privacy hold points

ก่อน Field Execution ต้องกำหนด:

- ห้ามปีนต้นหรือยืนใต้ความเสี่ยงผลร่วงเพื่อเก็บภาพ
- device handling และ weather limits
- หลีกเลี่ยง/จัดการใบหน้า ป้ายทะเบียน บ้าน และบุคคล
- consent/notice, retention และสิทธิ์ลบ/ส่งออก
- incident/rollback และ evidence custody

หัวข้อนี้เป็น design hold point ไม่ใช่การอนุญาตลงพื้นที่

## 15. Stop conditions

- placeholder ถูกแทนด้วยภาพ/วิดีโอจริงใน WP0–WP2
- mock QR/ID ถูกเข้าใจเป็นรหัสภาคสนาม
- engine result ถูกใช้เป็น Ground Truth
- view counts ถูกบวกตรง ๆ โดยไม่ deduplicate
- Session/Media/Position/Crop reference ข้าม Farm
- retry สร้าง duplicate หรือ review history สูญหาย
- physical size/weight แสดงโดยไม่มี method/unit/source

## 16. Protocol acceptance criteria

- ขั้นตอน Mock Capture, Ground Truth และ Human Review แยกกันชัดเจน
- มี failure/duplicate/uncertain/correction scenarios
- ไม่มีค่าภาคสนามหรือจำนวน view จริงที่แต่งขึ้น
- metric/size/field proposal ติดป้ายสถานะและ authorization ถูกต้อง
- Future field section ระบุชัดว่า `Not Authorized`
