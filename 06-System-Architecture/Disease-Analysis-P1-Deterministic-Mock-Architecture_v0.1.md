# Disease Analysis P1 — Deterministic Mock Architecture

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Implemented & Validated — Local/Mock/Firebase Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md`, Disease Analysis Future Development Workflow v0.2, Owner Review Addendum Disease Analysis P1, DEC-026, DEC-027, DEC-031, DEC-038, DEC-039 |

## 1. ขอบเขต

P1 เพิ่ม Analysis Session จำลองเพื่อทดสอบ workflow ของ candidate finding,
Mock Confidence/Quality, Abstain และ Agronomist Human Review โดยยังคง Disease
Incident เป็น workflow หลัก และไม่ใช้ภาพจริง Dataset จริง หรือ AI ภายนอก

```text
Disease Incident + Tree/Current Planting Cycle
  → Farm/role/wrong-tree validation
  → Deterministic Scenario Engine
    ├─ Candidate Finding + Mock Confidence/Quality
    └─ Abstain + Reason
  → HUMAN_REVIEW_REQUIRED
  → Agronomist ACCEPTED / CORRECTED / REJECTED
  → REVIEWED + Audit
  → diagnosisWritebackStatus = NOT_WRITTEN
```

P1 ไม่มี upload, camera, external storage, external request, model inference,
confirmed-diagnosis writeback, Treatment Work Order อัตโนมัติ หรือคำแนะนำสารเคมี

## 2. Component boundary

```text
React UI — ศูนย์วิเคราะห์โรคจำลอง
  → Phase2Context (authenticated actor + trusted current Farm)
    → DiseaseAnalysisRepository
      ├─ MockDiseaseAnalysisRepository
      │   └─ resettable disease-analysis-p1-mock-data-pack-v1.0.json
      └─ FirebaseDiseaseAnalysisRepository
          └─ Firebase Auth + Firestore Emulator only
```

Mock repository และ Firebase repository ใช้ domain validation เดียวกันสำหรับ
scenario, review disposition, candidate label และข้อห้าม diagnosis writeback

## 3. Farm-scoped data model

```text
organizations/{organizationId}/farms/{farmId}/
├─ diseaseAnalysisSessions/{analysisSessionId}
│  └─ events/{eventId}
└─ diseaseAnalysisOperations/{scopedIdempotencyKey}
```

Analysis Session ต้องมีอย่างน้อย:

- `organizationId`, `farmId`, `analysisSessionId`, `incidentId`
- `positionId`, `plantingCycleId`, `tagCode`
- `classification = SIMULATED/TEST ONLY`
- `analysisSource = MOCK_DETERMINISTIC_V1`
- `evidenceScenario`, `evidenceQualityScore`, `candidateFindings` หรือ
  `abstainReason`
- `status`, `syncState`, `diagnosisWritebackStatus = NOT_WRITTEN`
- actor, version, created/reviewed time และ append-oriented audit

Immutable scope และ analysis result ห้ามแก้ใน review; review เปลี่ยนเฉพาะสถานะ,
disposition, reviewed finding/note, reviewer, version และ audit event

## 4. Deterministic scenarios

| Scenario | Quality | Confidence | ผล |
|---|---:|---:|---|
| `CLEAR_SYMPTOM_PATTERN` | 92 | 82 | Candidate `MOCK_SYMPTOM_PATTERN_A` |
| `LOW_QUALITY_PLACEHOLDER` | 28 | ไม่มี | Abstain: `LOW_EVIDENCE_QUALITY` |
| `CONFLICTING_OBSERVATIONS` | 61 | ไม่มี | Abstain: `CONFLICTING_OBSERVATIONS` |

คะแนนทั้งหมดเป็น Mock engineering score เพื่อทดสอบ workflow ไม่ใช่ค่าความแม่นยำ
ทางวิชาการ และ neutral candidate code ไม่ใช่ชื่อโรคจริง

## 5. Authorization matrix

| Action | ORG_OWNER | FARM_MANAGER | AGRONOMIST | AUDITOR | WORKER/อื่น |
|---|:---:|:---:|:---:|:---:|:---:|
| อ่าน session ใน Farm ที่มีสิทธิ์ | ✓ | ✓ | ✓ | ✓ | — |
| สร้าง deterministic session | ✓ | ✓ | ✓ | — | — |
| Human Review | — | — | ✓ | — | — |
| ลบ session/event | — | — | — | — | — |

ทุก action ตรวจ active membership, Organization/Farm path, Disease Incident,
Position และ current Planting Cycle ใหม่ทั้งใน repository และ Security Rules

## 6. Idempotency, audit และ offline

- operation key ผูก actor, Organization, Farm, action และ idempotency key
- replay key เดิมคืนผลเดิมโดยไม่สร้าง session/review event ซ้ำ
- key เดิมกับ payload ต่างกันเป็น Duplicate Attempt และถูกปฏิเสธ
- Mock UI ทำงาน `LOCAL_ONLY`; ไม่พึ่ง network หรือ external runtime
- audit event บันทึก creation และ Human Review แบบ append-oriented
- reset ของ Mock repository คืนค่า deterministic pack และล้าง operation cache

## 7. Safety boundary

- Candidate/Abstain ไม่เปลี่ยน `confirmedDiagnosis`
- Human Review ไม่เขียน diagnosis และไม่สร้าง Treatment Work Order
- ระบบไม่บังคับ candidate เมื่อหลักฐานจำลองต่ำหรือขัดแย้ง
- Cross-Farm, forged scope, wrong-tree/current-cycle mismatch และ unauthorized
  role ถูกปฏิเสธ
- DEC-026 ยังคง `Open`; ไม่มีชื่อยา สารเคมี อัตราใช้ หรือคำแนะนำรักษาอัตโนมัติ
- Disease Incident เดิมยังใช้งานได้เมื่อ Analysis ไม่พร้อม ล้มเหลว หรือ Abstain

## 8. Acceptance และขั้นถัดไป

P1 ถือว่าผ่าน Engineering Validation เมื่อ Unit/UI/Rules/Emulator/build/offline,
responsive browser และ role boundary ผ่านตาม Validation Report v0.1

ก่อน P2 ต้องขอ Owner อนุมัติใหม่อย่างน้อยเรื่อง taxonomy/ผู้อนุมัติ vocabulary,
quality/confidence/abstain threshold, evaluation metric/error taxonomy,
dataset/model/provider/cost/security และ data governance โดย P1 ไม่ถือเป็น
หลักฐาน Field, Agronomic accuracy, Pilot หรือ Production
