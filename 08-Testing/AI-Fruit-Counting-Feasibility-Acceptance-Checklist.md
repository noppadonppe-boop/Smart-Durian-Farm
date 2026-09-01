# AI Fruit Counting Feasibility Acceptance Checklist

| รายการ | ค่า |
|---|---|
| รหัสโครงการย่อย | `AIFC-01` |
| เวอร์ชัน | 0.2 |
| สถานะ | Active — `AIFC-G0` Approved; Manual/AI Choice Has Partial Evidence; `AIFC-G1` Not Yet Evaluated |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | AIFC Knowledge v0.2, AIFC Plan v0.2, AIFC Architecture v0.2, Capture/Ground-Truth Protocol v0.2, WP1 Partial Validation Report v0.1, DEC-032 และ DEC-033 |

## A. AIFC-G0 Governance and Documentation

- [x] Owner อนุมัติ `AIFC-01`, `AIFC-G0` และ WP0–WP2 แบบ Mock/local-only
- [x] Knowledge ระบุ version, status, owner, date และ Source of Truth
- [x] Plan ระบุ Outcome, In/Out of scope, WP, Gate, risk และ stop condition
- [x] Architecture แยก Mock Engine ออกจาก external/model/production adapter
- [x] Capture/Ground-Truth Protocol ระบุ Field Execution = Not Authorized
- [x] Checklist แยก AIFC Gate จาก KDOMS Parent Gate
- [x] Decision Log มี Approved decision สำหรับ AIFC โดยใช้ Decision ID ที่ไม่ซ้ำ (`DEC-032`)
- [x] Decision Log แยก `countingMode` (คนนับ/AI ช่วยนับ) จาก `countMethod` ตาม DEC-033

## B. Authorization Boundary

- [x] ข้อมูลทั้งหมดใน WP0–WP2 ต้องเป็น `SIMULATED/TEST ONLY`
- [x] ห้ามภาพ/วิดีโอ/ต้น/บุคคล/topology/พิกัดจริง
- [x] ห้าม public dataset download, external AI/API และ model weight จริง
- [x] ห้าม Deploy, Production, Controlled Pilot และ External Pilot Action
- [x] AIFC ไม่อนุมัติ Phase 7 execution หรือ Commercial use
- [x] physical size, weight prediction และ field accuracy ยังไม่ถูกอ้างว่า Passed

## C. Domain and Data Contract — AIFC-G1

- [ ] Fruit Count Session ผูก Organization/Farm/Position/Planting/Crop/Stage ครบ
- [ ] AI-visible, tracked, uncertain, Human correction และ final count แยก field
- [ ] Fruit Observation ถูกสร้างจาก Session `REVIEWED` เท่านั้น
- [x] AI-assisted Observation ที่ implement แล้วบังคับ `ESTIMATED` พร้อม confidence/limitation และ Session reference
- [ ] size mock จำกัด Pixel-relative/Size band; physical size/weight เป็น null
- [ ] result difference ข้าม Session ไม่ถูกแปลงเป็น dropped fruit อัตโนมัติ
- [ ] correction เก็บ before/after/actor/time/reason

## D. Deterministic Mock Pack — AIFC-G1

- [x] mock pack มี version, stable IDs และ reset procedure
- [x] มีอย่างน้อย 2 isolated Farms
- [ ] ครบ S01–S10 ตาม Capture/Ground-Truth Protocol
- [x] engine output deterministic สำหรับ input/capture method เดิม
- [ ] ground truth แยกจาก mock engine result
- [ ] มี intentional false positive, missed item, duplicate, uncertain และ failure
- [x] deterministic engine/fixture ที่เพิ่มไม่มี real media, external URL, production QR หรือข้อมูลบุคคล

## E. Workflow, Offline and Idempotency — AIFC-G1

- [ ] state transition ที่ไม่อนุญาตถูกปฏิเสธ
- [ ] retry inference ด้วย key เดิมไม่เพิ่ม result/audit ซ้ำ
- [ ] retry commit ด้วย key เดิมคืน Fruit Observation เดิม
- [ ] pending Session คง Organization/Farm scope หลัง Farm switch
- [ ] revoked/downgraded role ถูก deny เมื่อ replay
- [ ] conflict ไม่ถูก overwrite แบบเงียบ
- [ ] failed/unknown inference ไม่แสดงจำนวนที่ดูเป็นค่าจริง

## F. Multi-Farm Security and Roles — AIFC-G1

- [ ] same-farm authorized role create/infer/review/commit ได้
- [ ] Cross-Farm Session/Media/Detection/Position/Crop/Observation ถูก deny
- [ ] forged `organizationId`/`farmId`/role/reviewer ถูก deny
- [ ] `WORKER`, `VIEWER`, `AUDITOR`, `SALES_INVENTORY` เขียน AIFC ไม่ได้
- [ ] Auditor อ่าน audit ตาม scope โดยแก้ operational record ไม่ได้
- [ ] unknown path/action และ delete ถูก deny by default

## G. Human Review UX — AIFC-G1

- [ ] หน้าแสดง Farm, Position, Crop Cycle, Stage และ `SIMULATED/TEST ONLY`
- [x] single-view flow ระบุว่าเห็นเพียงบางส่วน และ AI mode ปิดตัวเลือก Full Count
- [ ] overlay แยก detections/views/tracks/uncertain
- [ ] KEEP/REMOVE/MERGE/SPLIT/ADD/DEFER ทำงานตาม policy
- [ ] action สำคัญบังคับ reason
- [x] UI แสดง AI-visible, tracked, uncertain และ proposed reviewed count ก่อน Submit
- [ ] Offline/Pending/Conflict และ last-sync state มองเห็นได้
- [ ] ใช้ได้ที่ 320px และ 390×844 โดยไม่มี horizontal overflow
- [ ] touch target หลักไม่น้อยกว่า baseline ของ KDOMS

## H. Simulated Metrics Harness — AIFC-G1

- [ ] precision/recall ตรง expected fixture
- [ ] absolute error และ signed bias ตรง expected fixture
- [ ] duplicate/missed/uncertain/correction rate ตรง expected fixture
- [ ] size-band confusion matrix ตรง expected fixture
- [ ] divide-by-zero/empty/unknown cases มี behavior ชัดเจน
- [ ] report ติดป้ายว่าเป็น harness correctness ไม่ใช่ AI field accuracy
- [ ] ไม่มี Planning/Commercial pass threshold ที่แต่งจาก mock data

## I. Code and Repository Quality — เมื่อ WP1–WP2 ถูก implement

- [x] TypeScript strict/typecheck ผ่าน
- [x] lint ผ่าน
- [x] unit/component tests ผ่าน — 112 tests
- [x] emulator/security/integration tests ผ่าน — 42 tests
- [x] build/PWA/offline/network-denied checks ผ่าน
- [x] repository scan ไม่พบ real media/model weight/secret/external runtime ใน AIFC implementation
- [x] Cross-Farm mock photo path issue ที่พบระหว่าง full test ถูกแก้และ retest แล้ว; ไม่มี high-severity issue คงค้างในหลักฐานรอบนี้

## J. Stop Conditions

- [x] ไม่มี Cross-Farm disclosure ใน automated/emulator evidence รอบนี้
- [x] ไม่มี duplicate critical record หลัง retry ใน scenarios ที่ implement แล้ว
- [x] ไม่มี silent correction/history overwrite ในเส้นทางที่ implement แล้ว
- [x] ไม่มีผล `MEASURED` ที่มาจาก mock inference
- [x] ไม่มี external service/network/model use
- [x] ไม่มี real data/media หรือ field/physical claim

พบข้อใดข้อหนึ่งให้หยุดส่วนที่เกี่ยวข้อง เก็บหลักฐาน แก้ และ retest

## K. Gate Decision

- `AIFC-G0`: **Approved** — Documentation and WP0–WP2 Mock/local-only
- `AIFC-G1`: **Not Evaluated** — checklist C–J ยังต้องมี implementation evidence
- `AIFC-G2`: **Not Authorized**
- `AIFC-G3`: **Not Started**
- `AIFC-G4`: **Not Started**

Parent KDOMS Gate/Phase status ใช้ `AGENTS.md` และ Decision Log ล่าสุด AIFC
Checklist นี้ไม่เปลี่ยน Parent authorization
