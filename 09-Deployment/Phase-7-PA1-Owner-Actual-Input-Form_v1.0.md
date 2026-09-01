# แบบฟอร์ม Owner Actual Input — PA-1 Pilot Environment/Deployment

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.4 |
| สถานะ | **PA-1 Local/Emulator Approved; External PA-1 NO-GO/BLOCKED** |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| ข้อมูลในแบบฟอร์ม | `OWNER-DIRECTED MOCK SUBSTITUTE / SIMULATED/TEST ONLY`; ไม่ใช่ข้อมูล resource ภายนอกหรือข้อเท็จจริงภาคสนาม |
| Machine-readable record | `09-Deployment/phase7-pa1-owner-selected-mock-substitute-v1.0.json` |
| Approval record | `09-Deployment/phase7-pa1-local-rehearsal-approval-v1.1.json` |
| Source of Truth | `AGENTS.md` v3.3, Phase 7 Plan v2.0, External PA-1 Owner Review Decision v1.2, Pilot Impact & Approval Pack v1.8, Owner Mockup Input Pack v1.1, PA-1 Mock Substitute Validation v1.0, DEC-035, DEC-037, DEC-038 |

## 1. วิธีกรอก

ตามคำสั่ง Owner วันที่ 2026-08-31 ช่อง Owner input ถูกกรอกด้วยค่าจำลองจาก
`KDOMS-OWNER-MOCK-V1` เพื่อใช้เป็นชุดตัดสินใจและตรวจเอกสารแบบ deterministic
โดยไม่ทำให้ค่าจำลองกลายเป็นข้อมูล resource หรือข้อเท็จจริงภาคสนาม

ทุกค่ายังคงเป็น `SIMULATED/TEST ONLY` ห้ามวาง password, API key,
service-account key, OTP, เบอร์โทรจริง หรือข้อมูลบุคคลในไฟล์นี้ และห้ามใช้ค่า
`.example.invalid`, รหัส `SIM-*` หรือ Candidate ที่ยังไม่ freeze เพื่อ Deploy

## 2. PA-1 Owner Actual Input

| หัวข้อ | ค่าแนะนำจาก Mock | ค่า Owner actual | สถานะ |
|---|---|---|---|
| Environment option | A แล้ว B แบบ dry-run | `A_THEN_B_SIMULATED_DRY_RUN_ONLY` | Complete — Mock substitute |
| Provider/project reference | แยก Pilot resource ชัดเจน | `PROVIDER-SIM-01 / KDOMS-PILOT-SIM-001` | Complete — Mock substitute |
| Region reference | เลือกตาม data/privacy/cost policy | `SIM-REGION-01` | Complete — Mock substitute |
| Billing | ปิดไว้จนอนุมัติเป็นรายการ | `DISABLED / false` | Complete — Mock substitute |
| Cost ceiling (THB) | ต้องเป็นวงเงินจริงที่ Owner ยอมรับ | `0 THB — MOCK; NOT A REAL COST ESTIMATE` | Complete — Mock substitute |
| Usage/cost reviewer code | ใช้ role code ไม่ใส่ข้อมูลบุคคล | `USAGE-REVIEW-SIM-01` | Complete — Mock substitute |
| Deployment owner code | ใช้ role code | `DEPLOY-SIM-01` | Complete — Mock substitute |
| Rollback owner code | แยกจากผู้ Deploy เมื่อทำได้ | `ROLLBACK-SIM-01` | Complete — Mock substitute |
| Pilot URL/domain reference | Private allowlist; ห้ามใช้ `.invalid` เป็นค่าจริง | `https://pilot-kdoms-sim.example.invalid` | Complete — Mock substitute; non-routable |
| Visibility/access mode | Private/allowlist | `PRIVATE_ALLOWLIST_SIMULATION` | Complete — Mock substitute |
| Authentication mode | Test-only accounts; SMS จริงต้องขออนุมัติแยก | `FIREBASE_AUTH_EMULATOR_REFERENCES_ONLY` | Complete — Mock substitute |
| Monitoring channel reference | ใช้ channel code ไม่ใส่ข้อมูลติดต่อจริง | `SIM-ALERT-CHANNEL-01` | Complete — Mock substitute |
| Monitoring retention | 30 วันเป็น proposed baseline | `30 days — SIMULATED` | Complete — Mock substitute |
| Backup destination reference | ใช้ storage code | `SIM-BACKUP-STORE-01` | Complete — Mock substitute |
| Key custodian code | ใช้ role code; ห้ามใส่ key | `SIM-KEY-CUSTODIAN-01` | Complete — Mock substitute |
| RPO | 24 ชั่วโมงเป็น proposed baseline | `24 hours — SIMULATED` | Complete — Mock substitute |
| RTO | 8 ชั่วโมงเป็น proposed baseline | `8 hours — SIMULATED` | Complete — Mock substitute |
| Backup retention | 30 วันเป็น proposed baseline | `30 days — SIMULATED` | Complete — Mock substitute |
| Pilot Candidate ID | ต้อง freeze revision หลัง approval | `KDOMS-PC-SIM-20260831-01` | Complete — `NOT_FROZEN_NOT_DEPLOYABLE` |
| Candidate source revision | Commit/hash ที่ตรวจสอบย้อนกลับได้ | `MOCK-SOURCE-SHA256:6BB326C87D3DEE8C3B8B16C21E945FE78A15FE8F3866D8C1AF8898ED7B10606B` | Complete — Mock source only |

## 3. ผลกระทบที่ Owner ต้องยอมรับหรือขอแก้

เลือก `Accept`, `Revise` หรือ `Defer` ทีละข้อ

| ผลกระทบ | Owner decision | หมายเหตุ |
|---|---|---|
| อาจมีค่า hosting/storage/monitoring หลังเปิด resource | `Accept — Mock-only; external cost deferred` | ค่า 0 THB ไม่ใช่ประมาณการจริง |
| ต้องมีผู้รับผิดชอบ Deploy, rollback, monitoring และ backup | `Accept — Mock role codes only` | ต้องแทนด้วย mapping จริงก่อน External Action |
| Pilot ยังใช้เฉพาะ Mock Data จนกว่า PA-2 จะผ่าน | `Accept` | Real data ยังห้ามใช้ |
| Physical Device/Field evidence ยังต้องเก็บระหว่าง Controlled Pilot | `Accept as future requirement` | สถานะยัง Not Passed |
| Production, ป้ายถาวร และ scale-up ต้องขออนุมัติแยก | `Accept` | PA-3 ยังไม่อนุมัติ |
| Cross-Farm allow สำเร็จหนึ่งครั้งเป็น Critical stop | `Accept` | Threshold = 1 |

## 4. Owner Decision

เลือกได้หนึ่งสถานะ:

- [x] `APPROVE PA-1 — LOCAL/EMULATOR REHEARSAL ONLY`
- [ ] `REVISE PA-1`
- [ ] `DEFER PA-1`

สถานะการตัดสินใจ:

`APPROVED_LOCAL_EMULATOR_REHEARSAL_ONLY`

เหตุผล/เงื่อนไข:

`อนุญาต local/browser/Firebase Emulator rehearsal ด้วย Mock Data และ local
Candidate freeze/build/test เท่านั้น; ห้าม External Pilot Action และ Deployment`

Owner decision reference:

`Owner exact PA-1 local/emulator approval, 2026-08-31; DEC-037`

วันที่มีผล:

`2026-08-31 — local/emulator rehearsal only`

## 5. ข้อความอนุมัติที่ใช้เมื่อข้อมูลครบเท่านั้น

> อนุมัติ PA-1 สำหรับ Phase 7 Pilot Candidate ตาม Phase-7 Pilot Impact and
> Approval Pack และ PA-1 Owner Actual Input Form ฉบับล่าสุด โดยยอมรับว่าค่าที่
> กรอกเป็น Owner-directed Mock Substitute และอนุญาตเฉพาะ local/emulator rehearsal
> ที่ไม่สร้าง external resource, billing, credential หรือ deployment ยังไม่อนุมัติ
> PA-2 Field Execution หรือ PA-3 Production/Go-Live

หากต้องการ External Pilot deployment ต้องแทน provider/project/region/cost/URL,
owner mapping และ frozen Candidate ด้วยค่าที่ใช้งานได้จริง แล้วขออนุมัติเป็นรายการ

Current decision: **PA-1 LOCAL/EMULATOR REHEARSAL APPROVED — EXTERNAL PA-1,
PA-2, PA-3 AND DEPLOYMENT NOT APPROVED**

Execution evidence ล่าสุดใช้ Candidate `KDOMS-PC-SIM-20260831-02` ตาม PA-1 Local
Rehearsal Report v1.1; ค่า Candidate `...-01` ในตารางข้อ 2 เป็น Owner-directed
Mock Substitute เดิมและห้ามใช้ Deploy

External PA-1 formal decision: **NO-GO / BLOCKED ตาม DEC-038 เมื่อ 2026-09-01**
ค่าในแบบฟอร์มนี้ยังเป็น Mock Substitute ทั้งหมดและใช้ปิด prerequisite ไม่ได้
Source ปัจจุบันไม่ตรง local frozen snapshot เดิม จึงต้องออก clean frozen
deployable Candidate ใหม่ก่อน Owner Review รอบถัดไป

Post-freeze note 2026-09-01: ข้อความข้างต้นเป็นเงื่อนไข ณ เวลา DEC-038 ปัจจุบัน
Local source drift ถูก remediated ด้วย Candidate `KDOMS-PC-SIM-20260901-05`
แต่ Candidate ยังเป็น `FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE` และค่าจริง/
governance/cost/external controls ยังไม่ครบ จึงไม่เปลี่ยน External PA-1 เป็น GO
