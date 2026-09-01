# AI Fruit Counting Feasibility Architecture v0.2

| รายการ | ค่า |
|---|---|
| รหัสโครงการย่อย | `AIFC-01` |
| เวอร์ชัน | 0.2 |
| สถานะ | Approved Architecture Baseline — Manual/AI Choice Implemented; WP0–WP2 Mock/local-only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | `01-Requirements/KDOMS_AI_Fruit_Counting_Feasibility_Knowledge_v0.1.md`, `00-Project-Management/AI-Fruit-Counting-Feasibility-Plan_v0.1.md`, Scope Knowledge, Phase 5 Commercial Traceability Architecture, Phase 6 Operational Hardening Architecture, DEC-032 และ DEC-033 |

## 1. Architecture boundary

```text
KDOMS mobile/PWA — current trusted Farm and authenticated actor
  → Fruit Count Session application service
    → Capture evidence port
      └─ Deterministic placeholder media (WP0–WP2 only)
    → Fruit Counting Engine port
      └─ Deterministic Mock Engine (no network/no real model)
    → Human Review service
    → Fruit Count Session repository
    → reviewed result mapper
      └─ Fruit Observation repository (`ESTIMATED`)
    → append-oriented AIFC audit events
```

WP0–WP2 ห้ามมี adapter ไป external AI, cloud inference, model registry, real
camera media store หรือ Production Firebase การออกแบบ port มีไว้ป้องกัน domain
ผูกกับผู้ให้บริการรายหนึ่ง ไม่ใช่ authorization ให้เชื่อมบริการจริง

## 2. Domain relationship

```text
Organization
└─ Farm
   └─ Position → Planting Cycle
      └─ Crop Cycle + Crop Stage
         └─ Fruit Count Session
            ├─ Placeholder Capture Views
            ├─ Mock Detections / Tracks
            ├─ Human Review Events
            └─ Final Reviewed Result
               └─ Fruit Observation (`ESTIMATED`)
```

Fruit Count Session เป็น evidence/workflow record ไม่แทน Fruit Observation
และไม่สร้าง Harvest/Sales quantity โดยตรง

Fruit Observation เก็บที่มาของจำนวนแยกเป็นสองแกน:

- `countingMode`: `MANUAL` หรือ `AI_ASSISTED`
- `countMethod`: `FULL_COUNT`, `SAMPLE`, `ESTIMATE` หรือ `UNKNOWN`

จึงรองรับคนนับครบ, คนนับตัวอย่าง, คนประมาณ หรือ AI ช่วยนับแบบ sample/estimate
โดยไม่ทำให้คำว่า “AI” ถูกตีความว่า “นับครบ”

## 3. Conceptual storage model

```text
organizations/{organizationId}/farms/{farmId}/
├─ fruitCountSessions/{countSessionId}
│  ├─ evidenceViews/{viewId}
│  ├─ detections/{detectionId}
│  ├─ tracks/{trackId}
│  └─ reviewEvents/{reviewEventId}
├─ fruitObservations/{observationId}
├─ fruitCountOperations/{scopedIdempotencyKey}
└─ fruitCountAuditEvents/{auditEventId}
```

ชื่อ collection เป็น conceptual proposal สำหรับ Feasibility ไม่ใช่ Firestore schema
ที่อนุมัติให้ deploy ต้องมี query/rules/index review ก่อน implementation

## 4. Fruit Count Session contract

### Identity and scope

- opaque globally unique `countSessionId`
- trusted `organizationId`, `farmId`
- `positionId`, `plantingCycleId`, `cropCycleId`, `cropStage`
- `exampleData=true`, `scenarioLabel`, `fixtureVersion`

### Capture metadata

- `captureMethod`: `SINGLE_VIEW`, `MULTI_VIEW`, `VIDEO_SEQUENCE`, `UNKNOWN`
- `viewIds` และ `coverageNote`
- `capturedAt`, `capturedBy`, `sourceDeviceClass`
- `mediaEvidenceIds`; WP0–WP2 ชี้ placeholder manifest เท่านั้น

### Engine result

- `engineKind=DETERMINISTIC_MOCK`
- `modelVersionLabel`; ห้ามใช้ชื่อที่ทำให้เข้าใจว่าเป็นโมเดล field-validated
- `aiVisibleCount`
- `trackedCount`
- `uncertainCount`
- `inferenceStatus`, `inferenceLimitation`

### Human review and final result

- `humanAddedCount`, `humanRemovedCount`
- `finalReviewedCount`
- `reviewStatus`, `reviewedBy`, `reviewedAt`, `reviewReason`
- `countingMode=AI_ASSISTED`, `countMethod`, `valueQuality=ESTIMATED`, `confidenceNote`
- `committedObservationId` หลัง commit สำเร็จ

### Size output

- `sizeMethod`: `PIXEL_RELATIVE`, `SIZE_BAND`, `UNKNOWN`
- `sizeBandSummary`
- `physicalDimensions=null`
- `weightEstimate=null`

### Consistency and audit

- `idempotencyKey`, `operationVersion`
- `syncState`, `createdAt`, `updatedAt`, `version`
- correction/reference IDs โดยห้าม hard delete event history

## 5. Detection and track model

Detection จำลองหนึ่งรายการมี:

- stable `detectionId`, `sessionId`, `viewId`
- normalized bounding/mask placeholder coordinates
- mock confidence และ visibility label
- `trackId` หรือ `duplicateCandidateGroupId`
- `uncertaintyReasons[]`
- `reviewDisposition`: `PENDING`, `KEEP`, `REMOVE`, `MERGE`, `SPLIT`, `ADDED`

Track รวม detections ที่ fixture ระบุว่าเป็นผลเดียวกัน การเปลี่ยน track membership
ต้องสร้าง review event พร้อม before/after/reason ไม่แก้เงียบ ๆ

## 6. Count arithmetic invariant

ค่าจำนวนต้องตรวจสมการอย่างโปร่งใส:

```text
finalReviewedCount
  = reviewedTrackedBase
  + humanAddedCount
  - humanRemovedCount
```

- ทุกค่าต้องเป็นจำนวนเต็มไม่ติดลบ
- `humanRemovedCount` ห้ามมากกว่า base + added
- uncertain item ห้ามรวมอัตโนมัติหาก mock policy กำหนด `REVIEW_REQUIRED`
- จำนวนในแต่ละ view ห้ามนำมาบวกตรง ๆ เพื่อสร้าง final count
- Commit ที่ใช้ idempotency key เดิมต้องคืน Observation เดิม

## 7. State machines

### Session workflow

```text
DRAFT → CAPTURE_READY → INFERENCE_PENDING
      → REVIEW_REQUIRED → REVIEWED → COMMITTED
```

Exception states:

- `INFERENCE_FAILED` → retry ด้วย operation key เดิม
- `CONFLICT` → Manager/Owner review ตาม policy
- `CANCELLED` → เก็บ audit และห้าม commit

### Sync workflow

```text
PENDING → SYNCING → SYNCED
                  ↘ CONFLICT
```

การสลับ Farm ห้ามแก้ scope ของ pending session และ replay ต้องตรวจ membership/role
ใหม่ทุกครั้ง

## 8. Service responsibilities

### Fruit Count Session service

- รับ trusted Farm/actor จาก application context
- ตรวจ Position/Planting/Crop references อยู่ Farm เดียวกัน
- สร้าง/เปลี่ยน state ด้วย idempotent operation
- ห้ามเชื่อถือ scope หรือ reviewer จาก form payload

### Deterministic Mock Engine

- อ่าน fixture by scenario ID
- คืนผลเดิมเมื่อ input/version เดิม
- ไม่อ่านไฟล์ภาพจริง ไม่เรียก network และไม่ใช้ nondeterministic AI
- จำลอง success, uncertainty, duplicate, failure และ retry

### Human Review service

- บังคับ reason สำหรับ remove/merge/split/added และ override สำคัญ
- เก็บ before/after + actor/time
- ป้องกัน concurrent silent overwrite ด้วย version check

### Observation mapper

- map เฉพาะ Session `REVIEWED`
- ใช้ Crop/Farm/Position context จาก trusted session
- set `countingMode=AI_ASSISTED` และ `sourceCountSessionId=countSessionId`
- สร้าง `countMethod` ตาม coverage ที่จำลอง แต่ value quality คง `ESTIMATED`
- ใส่ confidence/limitation และ reference กลับ Session

สำหรับการบันทึกด้วยคน mapper ไม่สร้าง Session reference และใช้
`countingMode=MANUAL`; value quality ยังคงต้องสอดคล้องกับหลักฐานที่ผู้บันทึกเลือก

## 9. Role policy

| Capability | Allowed roles ใน Feasibility baseline |
|---|---|
| Read own-Farm Session summary | `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST`, `VIEWER`, `AUDITOR` ตาม scope |
| Create/capture simulated Session | `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST` |
| Run mock inference | `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST` |
| Review and commit | `ORG_OWNER`, `FARM_MANAGER`, `AGRONOMIST` |
| Read audit | `ORG_OWNER`, `FARM_MANAGER`, `AUDITOR` |
| AIFC write | `WORKER`, `VIEWER`, `AUDITOR`, `SALES_INVENTORY` denied |

Worker capture policy ยัง `TBD`; ห้ามขยายสิทธิ์จาก client หรือ fixture

## 10. Multi-Farm and security invariants

- path, record และ operation key ต้อง scope ด้วย Organization + Farm
- foreign Position/Crop/Media/Observation reference ถูก deny
- opaque IDs ไม่ลด requirement ของ membership/role check
- Farm A fixture ห้าม resolve ใน Farm B แม้รู้ ID
- revoked/downgraded role ถูก deny เมื่อ offline replay
- unknown collection/action และ delete ถูก deny by default
- audit/export ใดในอนาคตต้อง Farm-scoped และ data-minimized

## 11. Offline and idempotency

- Session draft/review operation ที่ policy อนุญาต queue ต้องแสดง pending ชัดเจน
- placeholder evidence มี local pending state และ retry simulation
- `actor + organizationId + farmId + operationId` เป็น logical idempotency scope
- duplicate submit คืน result เดิม ไม่เพิ่ม detection/review/audit/observation
- conflict ห้ามกลบด้วย last-write-wins แบบเงียบ

## 12. Media boundary

WP0–WP2 ใช้ manifest เช่น:

```text
placeholder://aifc/{fixtureVersion}/{scenarioId}/{viewId}
```

URI นี้เป็น identifier ภายใน mock ไม่ใช่ network URL และต้องไม่ถูก encode ใน QR
ห้าม base64 real image, EXIF, GPS, video, public dataset หรือ face/person media

## 13. Metrics boundary

Metric harness เปรียบเทียบ mock result กับ fixture ground truth:

- precision, recall
- absolute error, signed bias
- duplicate/missed/uncertain rate
- Human correction rate
- repeatability by scenario
- size-band confusion matrix

ค่าที่ได้เป็น test correctness ของ harness ไม่ใช่ performance ของ AI จริง

## 14. Deferred architecture decisions

- actual detector/segmenter/tracker/model provider
- on-device versus trusted private backend
- physical media compression/upload/retention
- depth/calibration/physical-size pipeline
- model registry, monitoring, drift และ rollback
- real role policy, cohort และ device support
- Ground Truth store และ annotation tooling

ทั้งหมดต้องผ่าน AIFC-G2 หรือ Productization approval ตามประเภท

## 15. Stop conditions

- adapter/network path ไป model/service ภายนอกปรากฏใน WP0–WP2
- real media/model weight/secret ถูกเพิ่ม
- Cross-Farm reference หรือ replay ผ่าน
- duplicate commit หรือ silent review overwrite
- final result ถูก mark `MEASURED` หรือใช้สร้าง Sales commitment
