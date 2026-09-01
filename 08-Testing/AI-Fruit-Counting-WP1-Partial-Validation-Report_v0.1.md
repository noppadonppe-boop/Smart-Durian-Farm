# AI Fruit Counting WP1 Partial Validation Report v0.1

| รายการ | ค่า |
|---|---|
| รหัสโครงการย่อย | `AIFC-01` |
| เวอร์ชัน | 0.1 |
| สถานะ | Passed — Partial WP1/WP2 Local/Mock Evidence; `AIFC-G1` Not Yet Passed |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Classification | `SIMULATED/TEST ONLY` |
| Source of Truth | AIFC Knowledge v0.2, AIFC Plan v0.2, AIFC Acceptance Checklist v0.2, DEC-032 และ DEC-033 |

## 1. ขอบเขตที่ตรวจ

- Fruit Observation เลือก `MANUAL` หรือ `AI_ASSISTED`
- `countingMode` แยกจาก `countMethod`
- deterministic mock engine สำหรับ Single view, Multi-view และ Video sequence
- Human Review โดยให้ผู้ใช้ตรวจ/แก้จำนวนที่ AI เสนอ ก่อน Submit
- AI-assisted Observation บังคับ `ESTIMATED`, ห้าม `FULL_COUNT` และต้องมี
  `sourceCountSessionId`
- Mock/Firebase rules, audit summary, idempotency และ Cross-Farm boundary
- ไม่มีภาพจริง external AI/API/model, deployment หรือ field action

## 2. ผลการตรวจ

| รายการ | ผล |
|---|---|
| TypeScript strict/typecheck | Passed |
| ESLint | Passed |
| Unit/domain/component/repository tests | Passed — 112/112 |
| Firebase Emulator auth/firestore/storage tests | Passed — 42/42 |
| Production build + PWA precache | Passed — 48 local entries |
| Performance budget | Passed — initial JS 344,608/350,000 bytes; CSS 41,012/60,000 bytes; offline runtime 1,284,904/1,800,000 bytes |
| Offline/external runtime scan | Passed — 48 local build files |
| AIFC external/media/model scan | Passed — no match in implementation scope |
| Mock data JSON parse/classification | Passed — deterministic, resettable, `SIMULATED/TEST ONLY`, no production use |

## 3. Defect and retest

Full test พบว่า mock Photo Recovery path เดิมไม่ encode Farm จึงมีความเสี่ยงให้
context ต่างสวนใช้ Work path เดียวกันได้ เส้นทางถูกเปลี่ยนเป็น
`mock://organizations/{organizationId}/farms/{farmId}/workEvidence/{workOrderId}/{photoId}`
แล้ว retest ผ่านทั้ง unit/component/full suite และ Firebase Emulator หลักฐานนี้เป็น
การแก้ stop condition เดิม ไม่ใช่การเพิ่มสิทธิ์หรือ deployment

## 4. ข้อจำกัดและความเสี่ยงคงเหลือ

- ยังไม่มี real Fruit Count Session lifecycle, detection/track review events,
  full offline Session conflict หรือ metric harness S01–S10
- ผล AI เป็น deterministic mock ไม่ใช่ field/model accuracy
- `FLOWERING` ยังไม่ใช้ AI fruit count; ใช้ Manual/UNKNOWN จนกว่าจะตัดสิน domain ดอก
- Initial JavaScript เหลือ budget 5,392 bytes ควรติดตามก่อนเพิ่ม dependency ใหม่
- ยังไม่มีภาพสวนจริง Physical Device Validation หรือ Controlled Pilot evidence

## 5. Gate conclusion

- `AIFC-G0`: **Approved**
- WP1: **Partial implementation passed local/mock validation**
- WP2: **Partial deterministic engine passed local/mock validation**
- `AIFC-G1`: **Not Yet Passed / Not Evaluated for closure** — checklist C–H ยังไม่ครบ
- `AIFC-G2`: **Not Authorized**

รายงานนี้ไม่อนุมัติภาพจริง external AI/API/model, Deploy, Production,
Controlled Pilot, External Pilot Action, Phase 7 execution หรือ commercial use
