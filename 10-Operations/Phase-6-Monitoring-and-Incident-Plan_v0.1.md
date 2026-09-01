# Phase 6 Monitoring & Incident Plan

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 0.1 |
| สถานะ | Draft — Mock/Emulator Validation Only |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Source of Truth | AGENTS.md v2.4, Phase 6 Plan, Phase 6 Architecture v0.1, Development/Mock Data/Pilot Knowledge v1.0, DEC-019, DEC-027 |

## 1. Monitoring signals

| Signal | Proposed trigger | Phase 6 action |
|---|---|---|
| Cross-Farm allow | สำเร็จ 1 ครั้ง | Critical stop, preserve evidence, report Owner |
| Offline conflict rate | threshold `TBD` | inspect role changes/payload versions |
| Duplicate critical event | สำเร็จ 1 ครั้ง | Critical stop and disable affected replay |
| Pending age/queue depth | threshold `TBD` | warn user, inspect connectivity |
| Photo partial/orphan | threshold `TBD` | retry or Manager cleanup with audit |
| Rule denial/error rate | threshold `TBD` | separate expected denial from defect |
| Export volume/size | threshold `TBD` | review role, scope and misuse |
| Initial asset budget | เกิน Phase 6 budget | fail build |

ไม่มี monitoring vendor, telemetry endpoint หรือ Production alert ถูกสร้างใน Phase 6
ข้อมูล Mock UI/Audit ใช้สาธิต flow เท่านั้น

## 2. Severity

- **Critical:** Cross-Farm disclosure/write, secret/real personal data, duplicate financial
  or irreversible event, audit history corruption
- **High:** revoked user replay succeeds, silent master overwrite, restore integrity fail
- **Medium:** queue stuck, photo recovery fail, authorized export incomplete
- **Low:** visual/performance issue ที่ไม่ทำให้ข้อมูล/สิทธิ์ผิด

## 3. Incident flow

```text
Detect → Stop affected flow → Preserve scoped evidence → Classify
  → Notify Owner/authorized responder → Contain → Correct → Retest
  → Owner decides resume/rollback → Record post-incident actions
```

ห้ามลบหลักฐานหรือแก้ audit เดิม ให้เพิ่ม correction/incident event แทน เมื่อเกี่ยวกับ
Cross-Farm ให้หยุดเฉพาะส่วนที่เกี่ยวข้องทันทีและตรวจทุก role/Farm fixture

## 4. Required incident record

- incident ID, environment และเวลา
- actor/role (masked), Organization/Farm scope และ affected record type
- detection source, expected/actual, severity และ owner
- containment/correction, before/after และ test evidence
- decision to resume/rollback, residual risk และ follow-up date

ห้ามใส่ secret, OTP, หมายเลขจริง,รายละเอียดพิกัด หรือภาพบุคคลใน incident record

## 5. Controlled Pilot entry questions

- ใครเป็น incident commander และผู้มีอำนาจ GO/NO-GO
- alert channel/evidence storage/access/retention คืออะไร
- threshold สำหรับ pending/conflict/photo/export และ response time
- วิธีหยุด Pilot Candidate, revoke access และ rollback
- วิธีแจ้งผู้ใช้และ privacy contact หากพบข้อมูลจริง

คำถามทั้งหมดเป็น `TBD` และต้องได้รับ Owner approval ก่อน Controlled Pilot execution
เอกสารนี้ไม่อนุญาต Phase 7, deployment หรือ Production monitoring
