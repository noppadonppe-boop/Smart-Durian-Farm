# AI Fruit Counting Feasibility Plan v0.2

| รายการ | ค่า |
|---|---|
| รหัสโครงการย่อย | `AIFC-01` |
| เวอร์ชัน | 0.2 |
| สถานะ | Active — `AIFC-G0`; Manual/AI Choice Implemented; WP1–WP2 Partial Mock/local Evidence |
| เจ้าของเอกสาร | Project Owner |
| วันที่จัดทำ | 2026-08-31 |
| Source of Truth | คำสั่งล่าสุดของ Project Owner, `01-Requirements/KDOMS_AI_Fruit_Counting_Feasibility_Knowledge_v0.1.md`, `00-Project-Management/Decision-Log.md` (DEC-032, DEC-033), Development/Mock Data/Pilot Knowledge, Scope Knowledge, Phase 5 Plan และ Phase 6 Plan |

## 1. Outcome

จัดทำ Feasibility baseline สำหรับ AI-assisted fruit counting ที่ผูกกับ Tree identity
และ Crop Cycle โดยพิสูจน์ workflow, data contract, Human Review, security,
offline/idempotency, audit และ metric harness ด้วยข้อมูลจำลองเท่านั้น ก่อนขออนุมัติ
Model Benchmark จริง, ข้อมูลจริง, External Pilot Action หรือ Productization

## 2. In scope

- Knowledge, Plan, Architecture, Capture/Ground-Truth Protocol และ Checklist
- deterministic mock Fruit Count Session และ expected detections/tracks
- UX/contract สำหรับ capture, inference state, overlay review และ commit
- mock engine adapter ที่ไม่เรียก network หรือ model จริงเมื่อได้รับคำสั่ง implement
- metric definitions/calculators กับ expected mock result
- Farm-scoped role, offline, idempotency, audit และ Cross-Farm denial design
- linkage ไป Fruit Observation แบบ `ESTIMATED`
- Pixel-relative/size-band mock output โดยไม่อ้างหน่วยจริง

## 3. Out of scope

- ภาพ วิดีโอ ต้น พิกัด topology บุคคล หรือข้อมูลสวนจริง
- public orchard dataset หรือ dataset download
- AI API, cloud inference, external runtime/model service หรือ model weight จริง
- Firebase/Hosting/Storage/Auth Production, billing, domain และ credential
- Deploy, Controlled Pilot, External Pilot Action และการลงพื้นที่
- Phase 7 execution หรือ Production authorization ใดจาก AIFC
- prediction สำหรับการขาย น้ำหนัก ราคา หรือคำรับรองผลผลิต
- drone, RGB-D/Stereo purchase หรือ physical-device validation

## 4. Work packages

### WP0 — Governance and Feasibility Baseline

Deliverables:

- Knowledge v0.1
- Plan v0.1
- Architecture v0.1
- Capture/Ground-Truth Protocol v0.1
- Acceptance Checklist
- DEC-032 และ boundary statement

Exit criteria:

- เอกสาร metadata/source/status ครบ
- ไม่มี factual field value ที่ไม่ได้รับการยืนยัน
- Parent Gate, Phase 7 และ External Pilot authorization ไม่ถูกเปลี่ยนโดย AIFC

### WP1 — Deterministic Mock Workflow

เป้าหมาย:

- mock session lifecycle ตั้งแต่ DRAFT ถึง REVIEWED/COMMITTED
- mock capture views และ placeholder evidence
- deterministic detections, duplicate tracks และ uncertain items
- Human Review เพิ่ม/ลบ/รวม/แยก พร้อม reason
- Commit ไป Fruit Observation `ESTIMATED`
- offline queue, retry, conflict และ correction audit
- UI แสดง `SIMULATED/TEST ONLY` และ limitation ตลอด flow

สถานะปัจจุบัน: **Partial implementation** — Fruit Observation เลือก `MANUAL`
หรือ `AI_ASSISTED` ได้, แยกจาก `countMethod`, โหมด AI มี deterministic mock,
Human Review editable count, Session reference, audit summary และบังคับ
`ESTIMATED`/ไม่ใช่ `FULL_COUNT` แล้ว ส่วน lifecycle/detection/review event แบบเต็ม,
offline Session และ correction UI ยังต้องทำก่อนประเมิน AIFC-G1

### WP2 — Simulated Technical Feasibility Harness

เป้าหมาย:

- mock engine port/adapter โดยไม่มี model จริง
- metric calculation จาก expected mock ground truth
- scenarios สำหรับ precision/recall, count error, bias, duplicate และ correction rate
- same-farm allow, Cross-Farm deny, forged reference, duplicate retry
- unknown/failed inference และ size-band-only behavior
- test/report template สำหรับ Model Benchmark จริงในอนาคต

WP2 ไม่สามารถสรุป accuracy ของ AI กับทุเรียนจริงได้

สถานะปัจจุบัน: **Partial implementation** — มี deterministic count engine สำหรับ
Single view, Multi-view และ Video sequence พร้อม unit/component/domain tests;
metric harness S01–S10, confusion matrix และ full security scenario ยังไม่ครบ

## 5. Deliverable map

| Deliverable | WP | สถานะหลังจัดทำ Plan |
|---|---|---|
| Knowledge | WP0 | Complete; updated v0.2 |
| Feasibility Plan | WP0 | Complete; updated v0.2 |
| Architecture | WP0 | Complete; updated v0.2 |
| Capture/Ground-Truth Protocol | WP0 | Complete; updated v0.2 |
| Acceptance Checklist | WP0 | Complete; updated v0.2 |
| Decision Log entry | WP0 | Complete; DEC-032 และ DEC-033 |
| Manual/AI choice + reviewed-count mock flow | WP1 | Implemented and locally tested |
| Full Session/review/offline workflow | WP1 | Partial; pending AIFC-G1 evidence |
| Deterministic count engine | WP2 | Implemented and locally tested |
| Full simulated metric harness S01–S10 | WP2 | Partial; not yet complete |
| Partial validation report | WP1–WP2 | Passed local/mock evidence; AIFC-G1 not closed |
| Model benchmark report | Future | Not authorized |
| Controlled Pilot report | Future | Not authorized |

## 6. Gate model

```text
AIFC-G0 Charter Approval       — Approved
  → WP0 documents
  → WP1 deterministic workflow
  → WP2 simulated harness
AIFC-G1 Mock Feasibility       — Pending evidence/Owner review
AIFC-G2 Pilot Data Authorization — Not authorized
AIFC-G3 Field Feasibility      — Not started
AIFC-G4 Productization         — Not started
```

การเริ่ม AIFC-G2 ต้องมี approval ใหม่สำหรับ data source/license, privacy,
retention, access, environment, provider, device, cohort, evidence และ rollback

## 7. Acceptance criteria สำหรับ AIFC-G1

- Fruit Count Session และ Fruit Observation มี boundary ชัดเจน
- AI-visible/tracked/uncertain/correction/final count ไม่ปะปนกัน
- Commit แบบ retry ไม่สร้าง Fruit Observation ซ้ำ
- Cross-Farm session/media/detection/reference ถูก deny
- role ไม่มีสิทธิ์ไม่สามารถ inference/review/commit
- failed/unknown inference ไม่สร้างค่าที่ดูเหมือน measured count
- UI แสดง Farm, Tree, Crop Cycle, Stage, source, status และ limitation
- mock pack deterministic, resettable และมี 2 isolated Farms
- metric harness ให้ผลตรง expected fixture
- lint/typecheck/unit/component/security/build ผ่านตาม risk ของ implementation
- ไม่มี network/model/external service call และไม่มีภาพจริง

## 8. Verification strategy

- document link/status/terminology review
- schema/state transition review
- unit tests สำหรับ count arithmetic, dedup, correction และ metrics
- component tests สำหรับ review/uncertainty/failure/offline
- repository/emulator tests สำหรับ Farm/role/idempotency/audit
- browser checks ที่ 320px และ 390×844 เมื่อมี UI
- network-denied smoke test ต้องไม่มี external runtime error
- scan repository เพื่อยืนยันไม่มี real media/model weight/secret

## 9. Risks and mitigations

| ความเสี่ยง | การควบคุมใน WP0–WP2 |
|---|---|
| mock accuracy ถูกเข้าใจเป็น field accuracy | ป้าย `SIMULATED/TEST ONLY` และห้าม accuracy claim |
| หลายภาพนับผลเดิมซ้ำ | track/dedup state และ Human Review |
| hidden fruit ถูกเดา | uncertain/limitation; ห้ามสร้าง invisible detection |
| size pixel ถูกอ้างเป็นเซนติเมตร | physical size เป็น null และแยก size method |
| retry สร้างซ้ำ | scoped idempotency key และ immutable operation result |
| Cross-Farm media/session leak | farm-scoped paths, rules tests และ deny by default |
| scope creep เข้า Phase 7/Production | AIFC gates แยกและ explicit out-of-scope |

## 10. Open decisions หลัง AIFC-G1

- Planning-grade use case ที่ต้องการและ threshold ที่ยอมรับได้
- จำนวน/ตำแหน่ง capture view และวิธีตรวจ coverage จริง
- ผู้มีสิทธิ์ capture ในภาคสนาม โดยเฉพาะ `WORKER`
- on-device, private backend หรือ external provider
- real-data retention/consent/face handling และ model-training permission
- size band definition, physical measurement method และ cultivar/stage policy
- device cohort, safety และ Ground Truth adjudication

ทุกค่าข้างต้นยัง `TBD` และไม่ block WP0–WP2

## 11. Stop conditions

- พบ real media/data, external model/service call หรือ credential
- พบ Cross-Farm disclosure, duplicate commit หรือ corrupt audit history
- UI/fixture แสดง simulated result เป็น measured/field evidence
- implementation ขยายสิทธิ์หรือ phase โดยไม่มี Owner approval

## 12. Current status

- `AIFC-G0`: Approved
- WP0: Documentation baseline complete และอัปเดตตาม DEC-033
- WP1: Partial — Manual/AI choice, editable Human Review และ Observation mapping
  ทำแล้ว; full Session/offline/review-event workflow ยังไม่ครบ
- WP2: Partial — deterministic mock count ทำแล้ว; full metric harness ยังไม่ครบ
- `AIFC-G1`: Not Evaluated / Pending checklist C–J และ Owner review
- AIFC-G2–G4: Not authorized/not started
