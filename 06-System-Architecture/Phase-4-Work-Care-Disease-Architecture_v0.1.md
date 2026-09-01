# Phase 4 Work, Care & Disease Architecture

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.3 |
| สถานะ | Implemented & Validated — Local/Emulator Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | AGENTS.md v2.4, Development/Mock Data/Pilot Knowledge v1.0.1, Phase 4 Plan v1.3, Scope Knowledge v0.2.2, UX/UI Knowledge v0.1.2, DEC-026, DEC-027, DEC-030 |

## 1. Boundaries

```text
React UI
  → Phase context (trusted current Farm + authenticated actor)
    → WorkCareDiseaseRepository port
      ├─ MockWorkCareDiseaseRepository
      └─ FirebaseWorkCareDiseaseRepository (Local Emulator only)
        → Farm-scoped Firestore documents + append-only events
        → Farm-scoped Storage evidence paths
```

ทุก mutation รับ `actor + FarmContext + idempotencyKey`; repository และ Rules
ตรวจ `organizationId/farmId` ใหม่ ห้ามเชื่อถือ Farm/role จาก form payload

## 2. Firestore model

```text
organizations/{organizationId}/farms/{farmId}/
├─ workOrders/{workOrderId}
│  └─ events/{eventId}
├─ workOperations/{scopedIdempotencyKey}
├─ careEvents/{careEventId}
│  └─ events/{eventId}
├─ diseaseIncidents/{incidentId}
│  └─ events/{eventId}
```

คิวแจ้งเตือนใน Phase 4 คำนวณจาก Work/Disease ที่อยู่ใน Farm scope ปัจจุบันและ
ยังไม่เขียนลง collection หรือส่งออกนอกแอป

ทุก record มี opaque ID, `organizationId`, `farmId`, `exampleData=true`, actor,
เวลา, version และ immutable identity fields

Mock runtime ใช้ `src/demo/phase4-mock-data-pack-v1.0.json` เวอร์ชัน `1.1.0`
ซึ่งสร้างซ้ำและ reset ได้ พร้อมป้าย `SIMULATED/TEST ONLY`; Firebase Emulator seed
อ่านจากแพ็กเดียวกันเพื่อลด fixture drift

Storage ใช้:

```text
organizations/{organizationId}/farms/{farmId}/workEvidence/{workOrderId}/{fileName}
```

รับเฉพาะ JPEG/PNG/WebP ขนาดไม่เกิน 5 MB, metadata ต้องตรง Farm/Work/actor
และห้าม update/delete

## 3. Photo evidence model

รูปของ Work Order แยกตามวัตถุประสงค์อย่างชัดเจนและไม่ใช้แทนกัน:

| ชุดรูป | ผู้แนบ | เวลา | จำนวน | เงื่อนไข |
|---|---|---|---:|---|
| `instructionPhotos` / `INSTRUCTION` | ผู้สร้างใบงานที่มีสิทธิ์ | เฉพาะ `DRAFT` ก่อน Assign | 0–3 | เป็นรูปอ้างอิง ไม่ใช่หลักฐานว่าทำงานแล้ว |
| `report.photos` / `BEFORE`–`AFTER` | ผู้รับมอบหมาย | ระหว่าง `IN_PROGRESS` | 2–6 | ต้องมี BEFORE อย่างน้อย 1 และ AFTER อย่างน้อย 1 และทุกไฟล์ต้อง `UPLOADED` ก่อน Submit |

รูปทุกใบเก็บเฉพาะ metadata ใน Work document ได้แก่ `photoId`, `phase`,
`uploadState`, `storagePath` และ `note`; binary อยู่ใน Storage path ที่ผูกกับ
Organization, Farm และ Work Order เดียวกัน ผู้สร้างแก้หรือเขียนทับ
`instructionPhotos` หลัง Assign ไม่ได้ และ Worker เขียนชุดรูปคำสั่งงานไม่ได้

การเปิดดูรูปใช้ download URL ที่ออกหลังตรวจสิทธิ์ของ Work ปัจจุบันเท่านั้น Owner,
Manager และ Auditor อ่านได้ตาม Farm; Agronomist อ่านงาน Care/Disease หรือ
งานที่รับมอบหมาย; Worker อ่านเฉพาะงานของตน Cross-Farm ถูกปฏิเสธทุกกรณี

## 4. Work state machine

```text
DRAFT → ASSIGNED → ACCEPTED → IN_PROGRESS → SUBMITTED
                                      ↑           ├→ VERIFIED → CLOSED
                                      └─ REWORK ←─┤
                                                  └→ REJECTED → CLOSED
```

Pause/Resume เป็น append-only action ขณะ `IN_PROGRESS`; status ไม่เปลี่ยนและ
เก็บ `isPaused` เพื่อไม่เพิ่ม state ที่อยู่นอก Prompt

Tree target ต้องมี confirmed position ตรงกับ expected ก่อน Submit Group target
ต้องมี result ครบทุก position; `EXCEPTION` บังคับ reason

## 5. Role policy

| Action | ORG_OWNER | FARM_MANAGER | AGRONOMIST | WORKER |
|---|---:|---:|---:|---:|
| Create/assign general work | ✓ | ✓ | care/disease only | — |
| Attach instruction photos before assign | creator only | creator only | creator, care/disease only | — |
| Accept/start/report assigned work | เมื่อ assigned | เมื่อ assigned | เมื่อ assigned | ✓ |
| Verify/reject/rework general | ✓ | ✓ | care/disease only | — |
| Observe symptom | ✓ | ✓ | ✓ | ✓ |
| Confirm diagnosis/approve treatment | — | — | ✓ | — |
| Close disease incident | — | review only | ✓ | — |

Viewer/Auditor/Sales Inventory ไม่มี write ใน Phase 4; Auditor อ่าน audit ตามเดิม

## 6. Conservative care/disease policy

- observed symptom เป็น fact คนละ field กับ suspected/confirmed diagnosis
- Worker บันทึก symptom/severity/evidence ได้ แต่ห้ามวินิจฉัย
- chemical/treatment event สร้างเป็น `PENDING_SPECIALIST`
- confirmed diagnosis, treatment approval และ disease closure ต้อง Agronomist
- ไม่มี dosage/recommendation อัตโนมัติ และ UI เตือนให้ยึดผู้เชี่ยวชาญ/ฉลาก

DEC-026 ยัง Open; policy นี้เลือก least privilege และย้อนกลับได้

## 7. Audit, idempotency and offline

- state/action สำคัญ append event พร้อม actor, Farm, target, before/after และเวลา
- operation key เดิมคืนผลเดิมและไม่เพิ่ม event/report ซ้ำ
- failed/pending photo ห้าม submit; report draft ยังเก็บ retry state ได้
- การบันทึกรูปคำสั่งงานใช้ idempotency key และสร้าง
  `WORK_INSTRUCTION_PHOTOS_SAVED` audit event; ห้าม overwrite แบบเงียบ ๆ
- offline queue ต้องคง Farm scope และแสดง Pending/Syncing/Synced/Conflict
- ห้ามแก้ event เดิม ใช้ correction/rework/follow-up event

## 8. Security validation

- Rules deny by default และตรวจ role จาก membership document ทุกครั้ง
- Cross-Farm read/write, forged farmId, wrong assignee และ wrong-tree ถูก deny
- Work/Care/Disease identity fields immutable; delete ถูก deny
- Storage metadata/path mismatch และ read-only role upload ถูก deny
- Firestore Rules ตรวจรูปคำสั่งงานทุกใบ และตรวจจำนวนรวมกับรูปบังคับ BEFORE/AFTER
  ของรูปส่งงาน รวม phase, upload state และ Farm/Work storage path; รูปเพิ่มเติม
  ตรวจครบใน Domain/Repository จึงไม่พึ่ง validation จาก UI เพียงอย่างเดียว
- Physical Device/Field behavior ยัง Deferred ตาม DEC-027 และไม่ block Engineering
  Gate ของ Phase 4 แต่ต้องผ่านก่อน Production, ป้ายถาวร หรือการขยายใช้งาน
