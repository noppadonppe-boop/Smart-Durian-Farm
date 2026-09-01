# KDOMS AI Fruit Counting Feasibility Knowledge v0.2

| รายการ | ค่า |
|---|---|
| รหัสโครงการย่อย | `AIFC-01` |
| เวอร์ชัน | 0.2 |
| สถานะ | Approved Feasibility Baseline — Manual/AI Choice Added; `AIFC-G0`; WP0–WP2 Mock/local-only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | คำสั่งล่าสุดของ Project Owner, `AGENTS.md`, `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`, `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`, `00-Project-Management/Decision-Log.md` (DEC-032, DEC-033), `00-Project-Management/AI-Fruit-Counting-Feasibility-Plan_v0.1.md` |

## 1. คำตัดสินและวัตถุประสงค์

Owner อนุมัติให้จัดทำโครงการย่อย **AI Fruit Counting Feasibility (`AIFC-01`)**
เฉพาะ `AIFC-G0` และ WP0–WP2 แบบ Mock/local-only เพื่อศึกษาว่า AI สามารถช่วย
นับจำนวนผลทุเรียนที่มองเห็น ตัดการนับซ้ำจากหลายมุม และช่วยประเมินช่วงขนาดได้
อย่างน่าเชื่อถือเพียงใด โดยต้องมีคนตรวจยืนยันก่อนสร้าง Fruit Observation

การอนุมัตินี้เป็น **Feasibility authorization** ไม่ใช่การเพิ่ม AI เข้า Production
Scope และไม่อนุญาตภาพสวนจริง บริการ AI ภายนอก การ Deploy, Production,
Controlled Pilot, External Pilot Action, Phase 7 execution หรือการใช้งานเชิงพาณิชย์

## 2. Outcome ที่ต้องตอบให้ได้

1. Capture workflow แบบโทรศัพท์และหลายมุมควรมีโครงสร้างอย่างไร
2. ระบบจะแยกจำนวนที่ AI พบ จำนวนที่อาจซ้ำ จำนวนไม่แน่ใจ และจำนวนสุดท้ายอย่างไร
3. Human Review ต้องแก้ เพิ่ม ลบ และอธิบายเหตุผลได้อย่างไร
4. ข้อมูลจะเชื่อม Farm, Position, Planting Cycle, Crop Cycle และ Crop Stage อย่างไร
5. ขนาดระดับใดที่ระบบอธิบายได้: สัมพัทธ์, ช่วงขนาด, เซนติเมตร หรือน้ำหนักคาดการณ์
6. ต้องเก็บ metric อะไรเพื่อประเมินความแม่นยำ ความเอนเอียง ความทำซ้ำ และภาระงาน
7. ขอบเขตข้อมูล สื่อ สิทธิ์ Offline, Audit และ Stop Condition ต้องเป็นอย่างไร
8. ต้องมีหลักฐานและ approval อะไรก่อน Model Benchmark จริงหรือ Controlled Pilot

WP0–WP2 รอบนี้ตอบด้วย Knowledge, แบบจำลอง, deterministic mock scenarios,
interface/UX contract และ metric definitions เท่านั้น ยังไม่สามารถพิสูจน์ความแม่นยำ
ของโมเดลกับผลทุเรียนจริงได้

## 3. คำจำกัดความ

- **Fruit Count Session**: ชุดหลักฐานหนึ่งรอบการนับที่ผูกกับ Farm, Position,
  Planting Cycle, Crop Cycle, Stage, ผู้กระทำ เวลา และวิธี Capture
- **Counting mode**: ที่มาของจำนวนผล ได้แก่ `MANUAL` (คนนับ) หรือ
  `AI_ASSISTED` (AI ช่วยนับและคนตรวจ/แก้ก่อนบันทึก)
- **Count method**: ขอบเขต/วิธีครอบคลุม ได้แก่ `FULL_COUNT`, `SAMPLE`,
  `ESTIMATE` หรือ `UNKNOWN`; ต้องไม่ใช้แทน Counting mode
- **AI-visible count**: จำนวนวัตถุที่เครื่องตรวจพบในสื่อจำลอง ไม่ใช่จำนวนจริงทั้งต้น
- **Tracked count**: จำนวนหลังกลไกจำลองรวม observation ที่อ้างว่าเป็นผลเดียวกัน
- **Uncertain item**: วัตถุที่ confidence, visibility หรือ duplicate status ยังไม่พอ
  ให้รวมอัตโนมัติ
- **Human correction**: การเพิ่ม ลบ รวม แยก หรือเปลี่ยนสถานะ detection โดยผู้ตรวจ
- **Final reviewed count**: จำนวนหลัง Human Review; ยังคงเป็น `ESTIMATED` เว้นแต่
  วิธีนับและหลักฐานภาคสนามที่อนุมัติภายหลังพิสูจน์ว่าเป็น Full Count
- **Ground Truth**: ค่ามาตรฐานอ้างอิงที่สร้างด้วย protocol อิสระจากผล AI
- **Planning-grade**: ค่าประมาณสำหรับแนวโน้มและวางแผน ไม่ใช่คำรับรองเชิงพาณิชย์
- **Commercial-grade**: ระดับสำหรับการตัดสินใจเชิงการขาย ซึ่งอยู่นอก authorization นี้

## 4. หลักการที่บังคับใช้

1. AI ทำหน้าที่ช่วยตรวจจับ/เสนอรายการ ไม่ใช่ผู้ยืนยันจำนวนสุดท้าย
2. ภาพเดียวบอกได้เฉพาะผลที่มองเห็น ห้ามอ้างเป็น Full Count ทั้งต้นโดยอัตโนมัติ
3. การถ่ายหลายมุมต้องมี tracking/deduplication; การรวมจำนวนแต่ละภาพตรง ๆ ถูกห้าม
4. ผลที่ถูกบังทั้งหมดห้ามถูกสร้างเป็น detection โดยไม่มีหลักฐานที่ตรวจย้อนกลับได้
5. ผล AI และค่าที่คนแก้ต้องเก็บแยกกัน ห้าม overwrite ผลต้นทางแบบเงียบ ๆ
6. ค่าจาก WP0–WP2 ทุกค่าติดป้าย `SIMULATED/TEST ONLY`
7. AI result เริ่มต้นเป็น `ESTIMATED`; `MEASURED` ต้องมาจาก protocol ที่ผ่าน Gate
8. Fruit Observation เป็น business record หลัง review ส่วน Fruit Count Session เป็น evidence
9. ทุก mutation สำคัญต้อง Farm-scoped, idempotent และมี Audit
10. การ Retry ห้ามสร้าง Session, Detection, Review หรือ Fruit Observation ซ้ำ
11. ผู้ใช้ต้องเลือกที่มาของจำนวนเป็นคนนับหรือ AI ช่วยนับทุกครั้ง และระบบต้องเก็บ
    `countingMode` แยกจาก `countMethod`
12. โหมด `AI_ASSISTED` ต้องอ้าง `sourceCountSessionId`, ให้คนตรวจ/แก้จำนวนได้,
    บันทึกเป็น `ESTIMATED` และห้ามอ้าง `FULL_COUNT` ภายใต้ AIFC-G0
13. โหมด `MANUAL` ไม่อ้าง AI Count Session และคุณภาพค่าอาจเป็น `MEASURED`,
    `ESTIMATED` หรือ `UNKNOWN` ตามหลักฐานและวิธีที่ผู้บันทึกเลือก

## 5. Crop Stage และความหมายของค่าที่นับ

| Crop Stage | ทางเลือกที่ใช้ได้ | Default quality ของ AI | ข้อจำกัด |
|---|---|---|---|
| `FLOWERING` | คนนับ/บันทึก `UNKNOWN`; AI fruit count ปิดไว้ | `UNKNOWN` | ดอก/ช่อไม่ใช่ fruit count และควรเป็น domain แยกในอนาคต |
| `EARLY_FRUIT` | คนนับ หรือ AI ช่วยนับ + คนตรวจ | `ESTIMATED` | ผลเล็ก การบัง และผลร่วงทำให้ไม่ใช่ forecast ยืนยัน |
| `MID_SEASON` | คนนับ หรือ AI ช่วยนับ + คนตรวจ | `ESTIMATED` | AI `FULL_COUNT` ยังไม่อนุญาตจน protocol จริงผ่าน |
| `PRE_SALE` | คนนับ หรือ AI ช่วยนับ + คนตรวจ | `ESTIMATED` | ห้ามใช้ทำสัญญาขายภายใต้ AIFC-G0 |
| `HARVESTED` | คนนับ หรือ AI ช่วย reconciliation + คนตรวจ | `ESTIMATED` | actual count/weight จริงอยู่นอก WP0–WP2 |

ผลต่างระหว่าง Session สองช่วงห้ามถูกตีความเป็น `droppedCount` โดยอัตโนมัติ เพราะ
อาจเกิดจาก visibility, capture coverage, tracking หรือ Human Review ที่ต่างกัน

## 6. ระดับการประเมินขนาด

1. **Pixel-relative** — พื้นที่หรือแกนของ mask ในภาพ ใช้ทดสอบ UI/contract เท่านั้น
2. **Size band** — `SMALL`/`MEDIUM`/`LARGE` โดย threshold จริงยัง `TBD`
3. **Physical dimension** — เซนติเมตร ต้องมี calibration/depth และ Ground Truth
4. **Weight estimate** — ต้องมีข้อมูลขนาด–น้ำหนักจริงแยกตามบริบทที่อนุมัติ

WP0–WP2 อนุญาตเฉพาะ Pixel-relative และ Size band แบบค่าจำลอง ห้ามแสดง
เซนติเมตรหรือน้ำหนักจำลองในลักษณะที่ทำให้เข้าใจว่าเป็นข้อเท็จจริงภาคสนาม

## 7. Conceptual data contract

Fruit Count Session ต้องมีอย่างน้อย:

- `organizationId`, `farmId`
- `countSessionId`, `idempotencyKey`
- `positionId`, `plantingCycleId`, `cropCycleId`, `cropStage`
- `captureMethod`, `viewIds`, `coverageNote`
- `capturedAt`, `capturedBy`, `sourceDeviceClass`
- `mediaEvidenceIds` ซึ่ง WP0–WP2 อ้าง placeholder เท่านั้น
- `engineKind=DETERMINISTIC_MOCK`, `modelVersionLabel`
- `aiVisibleCount`, `trackedCount`, `uncertainCount`
- `humanAddedCount`, `humanRemovedCount`, `finalReviewedCount`
- `countingMode`, `sourceCountSessionId`, `countMethod`, `valueQuality`, `confidenceNote`
- `sizeMethod`, `sizeBandSummary`, `physicalSize=null`, `weightEstimate=null`
- `reviewStatus`, `reviewedBy`, `reviewedAt`, `reviewReason`
- `syncState`, `createdAt`, `updatedAt`, `version`, `exampleData=true`

Detection/track item ต้องอ้าง Session และมี stable mock ID, view references,
bounding/mask placeholder, confidence, visibility/uncertainty, duplicate group และ
Human Review action โดยไม่เก็บภาพสวนจริง

## 8. State model

```text
DRAFT
  → CAPTURE_READY
  → INFERENCE_PENDING
  → REVIEW_REQUIRED
  → REVIEWED
  → COMMITTED_TO_FRUIT_OBSERVATION
```

- `CANCELLED` ทำได้ก่อน Commit โดยเก็บ Audit
- Inference failure ไป `INFERENCE_FAILED` และ retry ด้วย idempotency key เดิม
- Review conflict ไป `CONFLICT`; ห้ามเลือกผลล่าสุดอัตโนมัติ
- Offline state `PENDING/SYNCING/SYNCED/CONFLICT` เป็น state แยกจาก workflow

## 9. Role และสิทธิ์

- การสร้าง/ตรวจ Fruit Observation ยึด policy เดิมของ Phase 5:
  `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST`
- `VIEWER` และ `AUDITOR` อ่านได้ตาม scope ที่ได้รับ แต่แก้ผลไม่ได้
- `SALES_INVENTORY` และ `WORKER` ไม่ได้รับสิทธิ์ AIFC write เพิ่มจากเอกสารนี้
- รูปแบบ Worker capture ในอนาคตเป็น `TBD` และต้องมี Owner approval แยก
- Client ห้ามกำหนด trusted Farm, role, value quality หรือ reviewer เอง

## 10. Mock data และ media boundary

- ใช้ deterministic fixture อย่างน้อย 2 isolated Farms
- สร้าง placeholder/synthetic scene ที่ไม่มีสวน ต้น บุคคล พิกัด หรือภาพจริง
- ทุก record และ UI ต้องแสดง `SIMULATED/TEST ONLY`
- ห้ามดาวน์โหลด dataset จริง ห้ามใช้ public orchard image และห้ามเรียก model API
- ห้าม commit base64 image, video, model weight หรือ external credential
- Mock pack ต้อง reset ได้และมี stable expected outputs
- รูปจำลองของ Farm A ห้าม resolve หรือแสดงใน Farm B ทุกกรณี

## 11. Scenario ขั้นต่ำสำหรับ WP1–WP2

1. Single view visible count พร้อมคำเตือนว่าไม่ใช่ Full Count
2. Multi-view มีผลเดียวกันหลายภาพและถูกรวมเป็นหนึ่ง track
3. Detection ไม่แน่ใจและต้อง Human Review
4. Human เพิ่ม missed item และลบ false positive พร้อมเหตุผล
5. Retry inference/commit ไม่สร้าง record ซ้ำ
6. Pending Session คง Farm scope เดิมเมื่อสลับสวน
7. Cross-Farm media/session access ถูกปฏิเสธ
8. Unknown/failed inference ไม่สร้างจำนวนที่ดูเหมือนค่าจริง
9. Size band จำลองโดยไม่มีเซนติเมตรหรือน้ำหนัก
10. Commit สร้าง Fruit Observation แบบ `ESTIMATED` พร้อม confidence/limitation

## 12. Metric definitions

WP0–WP2 ออกแบบ metric และ test calculation ได้ แต่ผลทั้งหมดต้องเป็น mock:

- detection precision/recall
- count absolute error และ signed bias ต่อ Session/Tree/Stage
- duplicate-track rate และ missed-item rate
- Human correction rate และ uncertain-review rate
- repeatability ระหว่าง mock captures
- size-band accuracy และ physical-size MAE เมื่อมี Ground Truth ในอนาคต
- capture/review duration, media volume และ failure rate

Pass threshold สำหรับ Planning-grade และ Commercial-grade ยัง `TBD`; ห้ามตั้ง
threshold จากข้อมูลจำลองแล้วอ้างว่าเหมาะกับสวนจริง

## 13. AIFC Gates

- `AIFC-G0 — Charter Approval`: Approved สำหรับ Knowledge และ WP0–WP2 Mock-only
- `AIFC-G1 — Mock Feasibility`: ยังไม่ผ่าน ต้องมี workflow/data/security evidence
- `AIFC-G2 — Pilot Data Authorization`: Not authorized
- `AIFC-G3 — Field Feasibility Review`: Not started
- `AIFC-G4 — Productization Decision`: Not started

AIFC Gate แยกจาก KDOMS Parent Gate และไม่เปลี่ยน authorization ของ Phase 7,
External Pilot Action หรือ Production

## 14. Stop conditions

หยุดส่วนที่เกี่ยวข้อง เก็บหลักฐาน แก้ และทดสอบซ้ำเมื่อพบ:

- Cross-Farm disclosure หรือ forged Farm/Position/Crop reference
- ผล AI ถูกเปลี่ยนเป็น `MEASURED` โดยไม่มี protocol ที่อนุมัติ
- duplicate Session/Observation หลัง retry
- silent overwrite ของ AI output หรือ Human correction
- ภาพ/ข้อมูลจริง, model weight, secret หรือ external runtime เข้า repository/Emulator
- การเรียกบริการ AI ภายนอกหรือ network inference โดยไม่ได้รับอนุมัติ
- UI ไม่แสดง limitation หรือทำให้ค่าจำลองดูเป็นข้อเท็จจริง

## 15. Acceptance criteria ของ Knowledge นี้

- ขอบเขต AIFC-G0/WP0–WP2 และข้อห้ามชัดเจน
- แยก AI-visible, tracked, uncertain, human correction และ final count
- เชื่อม Fruit Count Session กับ Fruit Observation โดยไม่ทำลาย audit trail
- ไม่เพิ่มสิทธิ์ Worker หรือ Commercial use โดยอัตโนมัติ
- Mock Data deterministic/resettable และ Cross-Farm denied
- ไม่มีค่าภาคสนาม จำนวนมุม อุปกรณ์ threshold หรือความแม่นยำที่แต่งขึ้น
- AIFC-G1–G4, real data, external AI, deploy และ Pilot ยังคงไม่อนุมัติ
