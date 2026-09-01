# Disease Analysis P1–P2 Development Handover

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | P1 As-Built & Validated / P2 Future Proposal — P2 Not Approved |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ขอบเขต | ส่งต่องาน Disease Analysis จาก P1 ไปสู่การเตรียม P2 ในอนาคต |
| Source of Truth | `AGENTS.md` v3.4, Disease Analysis Development Skill, Owner Review Addendum Disease Analysis P1 v1.1, DEC-026, DEC-027, DEC-031, DEC-038, DEC-039, Disease Analysis P1 Architecture v0.1, Disease Analysis P1 Validation Report v0.1 |

## 1. วัตถุประสงค์ของเอกสาร

เอกสารนี้ใช้เป็นจุดเริ่มต้นสำหรับ Owner และ Codex เมื่อต้องกลับมาพัฒนา Disease
Analysis ต่อในอนาคต โดยแยกให้ชัดเจนว่า:

- **P1 คือสิ่งที่พัฒนาและตรวจสอบเสร็จแล้ว** ใน Local/Mock/Firebase Emulator
- **P2 คือข้อเสนอสำหรับอนาคต** และยังไม่ใช่งานที่ได้รับอนุมัติให้ execute
- การมีแผน P2 ในเอกสารนี้ไม่อนุญาตภาพจริง Dataset จริง External AI/API/model,
  credential, billing, deployment, Controlled Pilot หรือ Production
- DEC-026 เรื่อง Treatment/Chemical Policy ยังคง `Open`

## 2. สถานะโครงการ ณ วันที่ส่งต่อ

| รายการ | สถานะ |
|---|---|
| Gate 6 | `Passed` |
| Disease Analysis P1 | `Implemented & Validated — Local/Mock/Emulator` |
| Disease Analysis P2 | `Not Approved` |
| External PA-1 | `Blocked` ตาม DEC-038 |
| PA-2 / Controlled Pilot | `Not Approved` |
| Deployment / Production | `Not Approved` |
| Treatment/Chemical Policy | DEC-026 = `Open` |

ลำดับ authority เมื่อข้อมูลขัดกัน:

1. คำสั่งล่าสุดของ Project Owner
2. Development, Mock Data & Pilot Knowledge เวอร์ชันล่าสุด
3. Scope Knowledge เวอร์ชันล่าสุด
4. Decision Log ที่มีสถานะ `Approved`
5. เอกสารนี้และเอกสารประกอบอื่น

## 3. ภาพรวมเส้นทาง P1 → P2 → อนาคต

| ระยะ | เป้าหมาย | สถานะปัจจุบัน | Authority ที่ต้องมี |
|---|---|---|---|
| P1 — Deterministic Mock | พิสูจน์ Analysis Session, Candidate/Abstain และ Human Review ด้วยข้อมูลจำลอง | เสร็จและผ่าน validation | DEC-039 |
| P2 — Evaluation Proposal/Execution | กำหนด taxonomy, metric, error threshold, dataset/model/provider และ governance | ยังไม่อนุมัติ | Owner Review และ Decision ใหม่ |
| P3 — Controlled Pilot | ทดสอบอุปกรณ์ ภาพ ผู้ใช้ และสภาพแวดล้อมจริงแบบจำกัด | ยังไม่อนุมัติ | External PA-1/PA-2 และ Pilot approval |
| P4 — Production Readiness | monitoring, drift, incident, rollback, retention และ support | ยังไม่อนุมัติ | Pilot ผ่านและ Owner Production approval |

## 4. P1 — สิ่งที่ทำเสร็จแล้ว

### 4.1 ผลลัพธ์เชิงผลิตภัณฑ์

- เพิ่มเมนู `ศูนย์วิเคราะห์โรคจำลอง`
- สร้าง Analysis Session จาก Disease Incident ที่อยู่ใน Farm ปัจจุบัน
- ผูก session กับ `organizationId`, `farmId`, `incidentId`, `positionId` และ
  `plantingCycleId`
- สร้าง deterministic candidate finding หรือ Abstain จาก scenario คงที่
- แสดง Mock Quality, Mock Confidence, uncertainty และ Abstain reason
- รองรับ Agronomist Human Review แบบ `ACCEPTED`, `CORRECTED`, `REJECTED`
- เก็บ audit แบบ append-oriented และรองรับ idempotency
- คง `diagnosisWritebackStatus = NOT_WRITTEN`
- ไม่สร้าง confirmed diagnosis หรือ Treatment Work Order อัตโนมัติ
- Disease Incident workflow เดิมยังทำงานได้เมื่อ Analysis ไม่พร้อมหรือ Abstain

### 4.2 Workflow ที่เปิดใช้ใน P1

```text
เลือก Farm ที่มีสิทธิ์
→ เลือก Disease Incident จำลอง
→ ตรวจ Position และ Current Planting Cycle
→ เลือก Deterministic Scenario
→ สร้าง Candidate Finding หรือ Abstain
→ HUMAN_REVIEW_REQUIRED
→ Agronomist รับ / แก้ / ปฏิเสธ
→ REVIEWED + Append-oriented Audit
→ Diagnosis writeback = NOT_WRITTEN
→ กลับไปใช้ Disease Incident workflow เดิมเมื่อจะยืนยัน diagnosis
```

### 4.3 Deterministic scenarios ที่มีแล้ว

| Scenario | Quality | Confidence | ผล |
|---|---:|---:|---|
| `CLEAR_SYMPTOM_PATTERN` | 92 | 82 | Candidate `MOCK_SYMPTOM_PATTERN_A` |
| `LOW_QUALITY_PLACEHOLDER` | 28 | ไม่มี | Abstain: `LOW_EVIDENCE_QUALITY` |
| `CONFLICTING_OBSERVATIONS` | 61 | ไม่มี | Abstain: `CONFLICTING_OBSERVATIONS` |

คะแนนข้างต้นเป็นค่า deterministic สำหรับ Engineering Test เท่านั้น ไม่ใช่
ค่าความแม่นยำทางวิชาการ และ `MOCK_SYMPTOM_PATTERN_A` ไม่ใช่ชื่อโรคจริง

### 4.4 Role boundary ที่ใช้ใน P1

| Action | ORG_OWNER | FARM_MANAGER | AGRONOMIST | AUDITOR | WORKER/อื่น |
|---|:---:|:---:|:---:|:---:|:---:|
| อ่าน Analysis Session ใน Farm ที่มีสิทธิ์ | ✓ | ✓ | ✓ | ✓ | — |
| สร้าง Deterministic Session | ✓ | ✓ | ✓ | — | — |
| ทำ Human Review | — | — | ✓ | — | — |
| ลบ Session/Event | — | — | — | — | — |

ทุก action ต้องตรวจ active membership และ Farm scope ใหม่ ห้ามใช้ Human-readable
Farm/Tag Code เป็น authorization

### 4.5 Data path และ component ที่มีแล้ว

```text
React UI
  → Phase2Context
    → DiseaseAnalysisRepository
      ├─ MockDiseaseAnalysisRepository
      └─ FirebaseDiseaseAnalysisRepository (Emulator only)
```

Firestore Emulator path:

```text
organizations/{organizationId}/farms/{farmId}/
├─ diseaseAnalysisSessions/{analysisSessionId}
│  └─ events/{eventId}
└─ diseaseAnalysisOperations/{scopedIdempotencyKey}
```

ไฟล์สำคัญสำหรับพัฒนาต่อ:

- Domain: [`diseaseAnalysis.ts`](../07-Source-Code/web-app/src/domain/diseaseAnalysis.ts)
- Domain tests: [`diseaseAnalysis.test.ts`](../07-Source-Code/web-app/src/domain/diseaseAnalysis.test.ts)
- Repository contract: [`contracts.ts`](../07-Source-Code/web-app/src/adapters/contracts.ts)
- Mock repository: [`mockDiseaseAnalysisRepository.ts`](../07-Source-Code/web-app/src/adapters/mock/mockDiseaseAnalysisRepository.ts)
- Firebase Emulator repository: [`firebaseDiseaseAnalysisRepository.ts`](../07-Source-Code/web-app/src/infrastructure/firebase/firebaseDiseaseAnalysisRepository.ts)
- UI: [`DiseaseAnalysisReadinessPage.tsx`](../07-Source-Code/web-app/src/pages/DiseaseAnalysisReadinessPage.tsx)
- Security Rules: [`firestore.rules`](../07-Source-Code/web-app/firestore.rules)
- Emulator tests: [`firebaseDiseaseAnalysis.emulator.test.ts`](../07-Source-Code/web-app/src/security/firebaseDiseaseAnalysis.emulator.test.ts)
- Mock Data Pack: [`disease-analysis-p1-mock-data-pack-v1.0.json`](../07-Source-Code/web-app/src/demo/disease-analysis-p1-mock-data-pack-v1.0.json)

### 4.6 Validation evidence ของ P1

| รายการ | ผลล่าสุด |
|---|---|
| Unit/UI | 153/153 ผ่านใน 19 test files |
| Firebase Emulator/Security | 49/49 ผ่านใน 8 test files |
| ESLint / TypeScript strict | ผ่าน |
| Build / PWA | ผ่าน |
| Offline runtime scan | ผ่าน; external runtime = 0 |
| Performance budget | ผ่าน |
| Browser Owner/Agronomist workflow | ผ่าน |
| Responsive 320×736 | ไม่ล้นแนวนอน; visible touch target ต่ำกว่า 44px = 0 |
| Browser console | warning/error = 0 |

หลักฐานฉบับเต็มอยู่ที่
[`Disease-Analysis-P1-Validation-Report_v0.1.md`](../08-Testing/Disease-Analysis-P1-Validation-Report_v0.1.md)

### 4.7 P1 Definition of Done

- [x] ใช้ข้อมูล `SIMULATED/TEST ONLY` เท่านั้น
- [x] มี Candidate และ Abstain อย่างน้อยสองสาเหตุ
- [x] Scenario เดิมให้ผลเดิม
- [x] Mock Pack reset ได้และมีอย่างน้อย 2 Farm
- [x] Cross-Farm, Wrong-Tree และ unauthorized role ถูกปฏิเสธ
- [x] Idempotency key เดิมไม่สร้าง session/event ซ้ำ
- [x] Human Review ทำได้เฉพาะ Agronomist
- [x] Human Review ไม่เขียน confirmed diagnosis
- [x] ไม่มี Treatment/Chemical advice หรือ Treatment Work Order อัตโนมัติ
- [x] Unit/UI/Rules/Emulator/build/offline/browser validation ผ่าน

## 5. P2 — เป้าหมายสำหรับอนาคต

### 5.1 เป้าหมายของ P2

P2 มีเป้าหมายเพื่อออกแบบและประเมินว่าระบบช่วยวิเคราะห์โรคควรใช้ taxonomy,
metric, dataset และ model แบบใด โดยยังคง Human Review และ Farm isolation
เป็น safety boundary หลัก

P2 ต้องไม่เริ่มจากการเลือกผู้ให้บริการหรืออัปโหลดภาพ แต่ต้องเริ่มจากการตกลง
**Evaluation Contract** ว่าจะวัดอะไร ยอมรับความเสี่ยงระดับใด และใครมีอำนาจตัดสิน

### 5.2 สิ่งที่ต้องตัดสินใจก่อนเริ่ม P2 execution

| Decision area | คำถามที่ Owner/Agronomist ต้องตอบ | สถานะ |
|---|---|---|
| Taxonomy | จะใช้กลุ่มอาการ โรค และแมลงชุดใด ใครเป็น Vocabulary Owner | `TBD` |
| Ground truth | ใครยืนยัน label และจัดการกรณีผู้เชี่ยวชาญเห็นต่าง | `TBD` |
| Image quality | เกณฑ์ความชัด แสง มุม ระยะ และหลักฐานขั้นต่ำคืออะไร | `TBD` |
| Confidence | คะแนนหมายถึงอะไรและแสดงต่อผู้ใช้ได้อย่างไร | `TBD` |
| Abstain | เงื่อนไขใดบังคับให้ระบบไม่เสนอ candidate | `TBD` |
| Error tolerance | False reassurance/false candidate ระดับใดที่ยอมรับได้ | `TBD` |
| Metrics | Agreement, correction, abstain, latency และ time-to-review เป้าหมายเท่าใด | `TBD` |
| Model approach | On-device, private hosted หรือ external provider | `TBD` |
| Dataset | แหล่งข้อมูล สิทธิ์ใช้งาน ความยินยอม และการแยก Train/Test | `TBD` |
| Data governance | Data Custodian, retention, backup, export, deletion และ key custody | `TBD` |
| Access | ใครดูภาพ ผลวิเคราะห์ และ review history ได้ | `TBD` |
| Cost/latency | Cost ceiling, timeout, retry และ offline fallback | `TBD` |
| Treatment boundary | Analysis เชื่อมไปยัง diagnosis/treatment อย่างไรโดยไม่ข้าม DEC-026 | `TBD` |

รายการเหล่านี้ต้องได้รับ Owner approval เป็นลายลักษณ์อักษรก่อน P2 execution

## 6. P2 Proposed Work Packages

Work Package ต่อไปนี้เป็น **ข้อเสนอ** ไม่ใช่คำสั่งให้เริ่มทำงาน

### P2-WP0 — Owner Decision & Evaluation Contract

ผลส่งมอบ:

- Taxonomy/vocabulary proposal และผู้อนุมัติ
- Metric definitions และ error taxonomy
- Proposed acceptance threshold พร้อมเหตุผล
- ข้อกำหนด Abstain/fail-closed
- Role/visibility matrix สำหรับภาพและผลวิเคราะห์
- Owner Decision Sheet สำหรับอนุมัติ/แก้/ปฏิเสธแต่ละรายการ

Exit criteria:

- Owner/Agronomist อนุมัติ Evaluation Contract
- Decision Log มี Decision ใหม่สถานะ `Approved`
- ยังไม่มีการใช้ข้อมูลหรือบริการจริง

### P2-WP1 — Dataset & Ground-Truth Governance Proposal

ผลส่งมอบ:

- Data dictionary และ required metadata
- Dataset source/licence/consent assessment
- Ground-truth review และ disagreement resolution
- Train/validation/test separation และ leakage prevention
- Farm/person privacy, retention, deletion และ evidence policy
- แนวทางเก็บข้อมูลจริงโดยไม่ commit กลับ repository

Exit criteria:

- Owner อนุมัติ Dataset และ Governance เป็นรายการ
- Data Custodian, operator/approver, destination, region และ key custody ชัดเจน
- หากยังไม่อนุมัติ ให้ทำเฉพาะ synthetic fixture ต่อไป

### P2-WP2 — Model/Provider/Runtime Options Review

เปรียบเทียบอย่างน้อย:

1. On-device model
2. Private hosted model
3. External API/model provider

เกณฑ์เปรียบเทียบ:

- privacy และ data flow
- accuracy/evaluation fit
- confidence calibration และ abstention
- offline behavior, latency และ retry
- security, credential และ vendor lock-in
- cost ceiling และ cost per session
- monitoring, versioning, rollback และ support

Exit criteria:

- Owner เลือกแนวทางหรือสั่งให้คง Mock-only
- External resource/credential/billing ต้องมี approval แยกก่อนสร้าง

### P2-WP3 — Evaluation Harness & Adapter Boundary

ขอบเขตเสนอ:

- รักษา `DiseaseAnalysisRepository` และเพิ่ม versioned analysis adapter
- แยก provider/model output จาก domain review record
- เก็บ `modelVersion`, `prompt/configVersion`, quality checks และ processing time
- รองรับ candidate หลายรายการ, calibrated confidence, uncertainty และ Abstain
- ทำ deterministic replay fixture เพื่อเทียบ version เดิม/ใหม่
- ห้าม model เขียน confirmed diagnosis โดยตรง

Exit criteria:

- Domain/unit tests และ adapter contract tests ผ่าน
- ผลทุกชนิดผ่าน Human Review
- Provider failure กลับสู่ manual workflow ได้

### P2-WP4 — Evaluation Metrics & Review Console

Metric ที่เสนอให้พิจารณา:

- `reviewAgreementRate`
- `correctionRate`
- `rejectionRate`
- `abstainRate`
- `falseReassuranceRate`
- `failedAnalysisRate`
- `medianTimeToReview`
- latency percentile และ cost per session
- breakdown ตาม model version, quality bucket และ taxonomy group

ข้อกำหนด:

- Dashboard ต้องแยก Farm และ role
- ห้ามใช้ Production KPI หรือ field accuracy claim จาก Mock fixture
- Metric ต้อง trace กลับถึง version และ Human Review event ได้

### P2-WP5 — Security, Offline, Audit & Failure Modes

ต้องครอบคลุม:

- Cross-Farm/Forged scope/Wrong-Tree denial
- image/media reference ที่ผูก Farm/Tree/Incident เดียวกัน
- idempotent run/retry/review
- offline pending, reconnect, conflict และ duplicate protection
- model/provider timeout, malformed result และ unavailable service
- immutable raw result + append-oriented correction/review
- credential isolation และ secret scanning หากมี provider ที่อนุมัติ
- retention/deletion เฉพาะ server-side policy ที่ได้รับอนุมัติ

### P2-WP6 — P2 Validation & Owner Gate Package

หลักฐานขั้นต่ำที่เสนอ:

- Domain/unit/component tests
- Repository/adapter contract tests
- Firebase Emulator Rules และ Cross-Farm tests
- deterministic replay และ version comparison
- failure/timeout/Abstain/Human correction tests
- responsive 320px, keyboard/touch target และ console checks
- offline runtime scan และ performance budget
- privacy/security/cost impact review
- P2 Validation Report และ Owner Acceptance Checklist

ผลการทดสอบ Local/Mock ไม่ใช่ Field/Agronomic/Physical Device evidence

## 7. Target workflow หลัง P2 ได้รับอนุมัติ

```text
เลือก Farm → ยืนยัน Tree/Planting Cycle → เปิด Disease Incident
→ บันทึก observed symptom และ severity
→ ตรวจ Media/Data Policy ที่ Owner อนุมัติ
→ สร้าง Analysis Session
→ Quality Check
  ├─ ไม่ผ่าน → Abstain → Manual/Agronomist workflow
  └─ ผ่าน → Approved Analysis Adapter
              → Candidate Finding + Confidence/Uncertainty
→ Agronomist รับ / แก้ / ปฏิเสธ
→ บันทึก Human Review + Audit
→ หากต้องยืนยัน diagnosis ให้บันทึกแยกใน Disease Incident
→ Treatment ดำเนินการตาม DEC-026 policy ที่ Owner อนุมัติในอนาคต
```

Analysis ต้องเป็น decision support ไม่ใช่ autonomous diagnosis

## 8. Proposed P2 Acceptance Criteria

เกณฑ์นี้ยังเป็นข้อเสนอและต้องให้ Owner อนุมัติก่อนใช้ตัดสิน P2:

- [ ] Taxonomy และ Vocabulary Owner ได้รับอนุมัติ
- [ ] Metric/error taxonomy/threshold ได้รับอนุมัติ
- [ ] Dataset licence/consent/governance ได้รับอนุมัติ
- [ ] Model/provider/runtime และ cost ceiling ได้รับอนุมัติ
- [ ] Candidate output ทุกชนิดต้องผ่าน Agronomist Human Review
- [ ] Abstain ทำงานเมื่อ quality ต่ำ, evidence ขัดแย้ง หรือ confidence ไม่พอ
- [ ] Cross-Farm/Wrong-Tree/unauthorized access ถูกปฏิเสธ
- [ ] Retry/idempotency ไม่สร้าง session/review ซ้ำ
- [ ] Raw analysis result immutable และ correction เป็น append-oriented event
- [ ] Provider unavailable แล้ว Disease Incident manual workflow ยังใช้งานได้
- [ ] ไม่มี confirmed diagnosis หรือ treatment automation จาก model โดยตรง
- [ ] Unit/UI/Rules/Emulator/build/offline/accessibility ผ่าน
- [ ] P2 Validation Report และ Owner Review ลงนามก่อนขยับไป P3

## 9. Stop Conditions

หยุดส่วนที่เกี่ยวข้อง เก็บหลักฐาน และรายงาน Owner เมื่อพบ:

- Cross-Farm disclosure หรือ forged Farm scope
- Analysis ผูกผิด Tree, Position หรือ Planting Cycle
- ผลที่ยังไม่ review ถูกบันทึกเป็น confirmed diagnosis
- คำแนะนำยา สารเคมี อัตราใช้ หรือ treatment approval อัตโนมัติ
- Duplicate critical session/review/audit event
- ภาพหรือข้อมูลจริงเข้า repository/fixture/Emulator โดยไม่ได้รับอนุมัติ
- Dataset licence/consent ไม่ชัดเจน
- Secret, credential หรือ key exposure
- External request/resource/billing/deployment ที่ไม่มี approval
- Metric ถูกนำไปอ้างเป็น Agronomic/Field accuracy โดยไม่มีหลักฐานจริง

## 10. ลำดับการกลับมาพัฒนาต่อในอนาคต

1. อ่าน `AGENTS.md`, Disease Analysis Skill, Decision Log และเอกสารนี้
2. ตรวจว่า Owner มีคำสั่งใหม่หลัง DEC-039 หรือไม่
3. ถ้ายังไม่มี P2 approval ให้จัดทำ/ปรับ **P2 Evaluation Proposal เท่านั้น**
4. ให้ Owner/Agronomist ตอบ Decision areas ในหัวข้อ 5.2
5. บันทึก Decision ใหม่ใน Decision Log เมื่อมีคำอนุมัติชัดเจน
6. สร้าง P2 Plan, Acceptance Checklist และ Architecture ก่อนแก้ runtime
7. พัฒนาเป็น Work Package ขนาดเล็กและทดสอบทุกครั้ง
8. หยุดที่ขอบเขตสูงสุดที่ได้รับอนุมัติ ห้ามตีความแผนนี้เป็น deployment authority

## 11. คำสั่งตัวอย่างสำหรับ Codex

### 11.1 คำสั่งที่ใช้ได้ตอนนี้ — เตรียม Proposal เท่านั้น

```text
อ่าน AGENTS.md, kdoms-disease-analysis-development Skill,
Disease-Analysis-P1-P2-Development-Handover_v1.0.md และ Source of Truth ที่อ้างถึง
จากนั้นจัดทำ P2 Evaluation Proposal และ Owner Decision Sheet เท่านั้น

ห้ามเริ่ม P2 execution, ใช้ภาพ/ข้อมูลจริง, ดาวน์โหลด Dataset, เรียก External
AI/API/model, สร้าง credential/resource/billing หรือ deployment และให้คง DEC-026
เป็น Open, External PA-1 เป็น Blocked และ P2 เป็น Not Approved
```

### 11.2 Template หลัง Owner อนุมัติ P2 แล้ว

อย่าใช้ template นี้จนกว่า Decision areas และขอบเขตที่วงเล็บไว้จะมีคำตอบจริง:

```text
Owner อนุมัติ Disease Analysis P2 เฉพาะ [ระบุ Work Package], [สภาพแวดล้อม],
[ชนิดข้อมูล], [model/provider boundary], [cost ceiling] และ [governance owner]
ตาม Decision [DEC-TBD]

ให้พัฒนาเฉพาะขอบเขตดังกล่าวแบบ mock-first พร้อม Human Review, Abstain,
Multi-Farm isolation, idempotency, offline/audit และ automated validation
ห้าม deployment, Pilot, Production หรือ treatment automation เว้นแต่ระบุอนุมัติแยก
```

ข้อความ template ไม่ใช่ Owner approval จนกว่า Project Owner จะกรอกค่าจริงและ
ออกคำสั่งอนุมัติอย่างชัดเจน

## 12. เอกสารที่ต้องอ่านร่วมกัน

- [`AGENTS.md`](../AGENTS.md)
- [`Decision-Log.md`](Decision-Log.md)
- [`Owner-Review-Addendum_Disease-Analysis-P1_2026-09-01.md`](Owner-Review-Addendum_Disease-Analysis-P1_2026-09-01.md)
- [`Disease Analysis P1 Architecture`](../06-System-Architecture/Disease-Analysis-P1-Deterministic-Mock-Architecture_v0.1.md)
- [`Disease Analysis P1 Validation Report`](../08-Testing/Disease-Analysis-P1-Validation-Report_v0.1.md)
- [`Disease Analysis Future Development Workflow`](../.agents/skills/kdoms-disease-analysis-development/references/future-development-workflow.md)
- [`KDOMS Development, Mock Data & Pilot Knowledge`](../01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md)
- [`KDOMS Scope Knowledge`](../01-Requirements/KDOMS_Scope_Knowledge_v0.2.md)

## 13. Handover checklist

- [x] P1 implementation และ validation evidence ระบุครบ
- [x] P1/P2 authority boundary แยกชัดเจน
- [x] DEC-026 ยังคง `Open`
- [x] External PA-1 ยังคง `Blocked`
- [x] P2/Pilot/Deployment/Production ไม่ถูกยกระดับเป็น Approved
- [x] P2 Work Packages และ proposed acceptance criteria ถูกบันทึก
- [x] Stop Conditions และคำสั่งตัวอย่างสำหรับ Codex ถูกบันทึก
- [ ] Owner/Agronomist ตอบ Decision areas ก่อน P2 execution
- [ ] Owner อนุมัติ P2 และเพิ่ม Decision ใหม่ใน Decision Log

## 14. ขั้นตอนถัดไปที่แนะนำ

ขั้นถัดไปที่ปลอดภัยคือให้ Codex จัดทำ **P2 Evaluation Proposal + Owner Decision
Sheet** จากหัวข้อ 5–8 ของเอกสารนี้ โดยยังไม่เปลี่ยน runtime และไม่ใช้ข้อมูลหรือ
บริการจริง จากนั้นให้ Project Owner/Agronomist ตรวจและออกคำตัดสินแยกก่อนเริ่ม P2
execution
