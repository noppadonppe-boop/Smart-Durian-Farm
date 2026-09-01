# ชุดข้อมูลจำลอง External PA-1 — Decision Rehearsal

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | **SIMULATED/TEST ONLY — External PA-1 NOT APPROVED** |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-08-31 |
| Pack ID | `KDOMS-EXTERNAL-PA1-MOCKUP-V1` |
| Deterministic seed | `KDOMS-P7-EXTERNAL-PA1-MOCKUP-20260831-001` |
| Machine-readable source | `09-Deployment/phase7-external-pa1-mockup-data-v1.0.json` |
| Source of Truth | `AGENTS.md` v3.1, Development/Mock Data/Pilot Knowledge v1.0.3, Phase 7 Plan v1.7, DEC-027, DEC-035, DEC-037 |

## 1. วัตถุประสงค์และขอบเขต

เอกสารนี้กรอกค่า Mock ครบ 8 ช่องเพื่อซ้อมตรวจแบบฟอร์มและผลกระทบของ External
PA-1 เท่านั้น ทุกค่าติดป้าย `SIMULATED/TEST ONLY`, สร้างซ้ำได้ และ reset กลับจาก
ไฟล์ JSON canonical ได้

เอกสารนี้ **ไม่ใช่ External PA-1 approval** และไม่อนุญาตให้สร้าง resource,
billing, credential, deployment, ข้อมูล/อุปกรณ์จริง, ลงพื้นที่, Public access หรือ
Production ค่า `SIM-*`, งบ 0 บาท และโดเมน `.example.invalid` ต้องถูกแทนด้วยค่าจริง
ที่ Owner ตรวจและอนุมัติก่อน External Action

## 2. Mockup data จำนวน 8 ช่อง

| ลำดับ | ช่อง Owner input | ค่า Mock ที่กรอก | การใช้งาน |
|---|---|---|---|
| 1 | Provider | `PROVIDER-SIM-01 / NON-PROVISIONABLE REFERENCE` | ชื่ออ้างอิงจำลอง; ใช้สร้าง provider resource ไม่ได้ |
| 2 | Project ID/Environment | `KDOMS-PILOT-SIM-001 / PRIVATE_PILOT_SIMULATION` | Environment จำลอง; ไม่ใช่ Project ID ที่ provision แล้ว |
| 3 | Region | `SIM-REGION-01 / NOT A CLOUD REGION` | Region จำลอง; ห้ามใช้เป็น data-location decision |
| 4 | งบประมาณสูงสุด | `0 THB/month — MOCK; NOT A REAL BUDGET APPROVAL` | ใช้ทดสอบฟอร์มเท่านั้น; ไม่ใช่ cost estimate หรือ billing approval |
| 5 | Pilot URL/Access | `https://pilot-kdoms-sim.example.invalid / PRIVATE_ALLOWLIST_SIMULATION` | URL non-routable และ access mode จำลอง |
| 6 | Deployment owner | `DEPLOY-SIM-01` | Role code จำลอง; ไม่ใช่บุคคลที่รับผิดชอบจริง |
| 7 | Billing/Incident owner | `USAGE-REVIEW-SIM-01 / INCIDENT-SIM-01` | Role codes จำลอง; ต้องแทนด้วยผู้รับผิดชอบจริง |
| 8 | Candidate revision | `KDOMS-PC-SIM-20260831-01 / LOCAL-SNAPSHOT-SHA256:80CAA78FEE2BCF71836DDF8C0A3AB0ADFF1371A6043302B7281AD68F54C34F6E` | Candidate ที่ผ่านเฉพาะ Local rehearsal; สถานะ `FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE` |

## 3. ข้อความกรอกแบบฟอร์มสำหรับการซ้อม

> **SIMULATED/TEST ONLY — EXTERNAL PA-1 DECISION REHEARSAL; NOT AN APPROVAL**
>
> อนุมัติ External PA-1 สำหรับ Private Pilot ด้วย Mock Data เท่านั้น —
> **ข้อความนี้เป็นการซ้อมกรอกและไม่มีผลอนุมัติ External Action**
>
> 1. Provider: `PROVIDER-SIM-01 / NON-PROVISIONABLE REFERENCE`
> 2. Project ID/ชื่อ Environment: `KDOMS-PILOT-SIM-001 / PRIVATE_PILOT_SIMULATION`
> 3. Region: `SIM-REGION-01 / NOT A CLOUD REGION`
> 4. งบประมาณสูงสุดต่อเดือน: `0 THB/month — MOCK; NOT A REAL BUDGET APPROVAL`
> 5. Pilot URL และรูปแบบการเข้าถึง: `https://pilot-kdoms-sim.example.invalid / PRIVATE_ALLOWLIST_SIMULATION`
> 6. ผู้รับผิดชอบ Deployment: `DEPLOY-SIM-01`
> 7. ผู้รับผิดชอบ Billing/Incident: `USAGE-REVIEW-SIM-01 / INCIDENT-SIM-01`
> 8. Candidate revision/commit: `KDOMS-PC-SIM-20260831-01 / LOCAL-SNAPSHOT-SHA256:80CAA78FEE2BCF71836DDF8C0A3AB0ADFF1371A6043302B7281AD68F54C34F6E`
>
> จำลองการอนุญาตให้สร้างทรัพยากรและ Deploy เฉพาะ Private Pilot Environment
> ด้วย Mock Data — `SIMULATED/TEST ONLY`; การซ้อมนี้ไม่ได้เปิดสิทธิ์จริง
>
> PA-2, ข้อมูลจริง, SMS จริง, QR/ป้ายจริง, การลงพื้นที่, Public access และ
> Production ยังคงไม่ได้รับอนุมัติ

## 4. การจำแนกข้อมูล

### ข้อยืนยัน

- PA-1 Local/Emulator ผ่านตาม DEC-037
- Candidate ที่อ้างถึงถูกตรึงสำหรับ Local rehearsal เท่านั้นและ Deploy ไม่ได้
- External PA-1, PA-2 และ PA-3 ยัง `NOT_APPROVED`

### ข้อเสนอจำลอง

- ใช้ Private/Allowlist เป็น access pattern สำหรับ decision rehearsal
- แยก Deployment, Billing และ Incident role codes เพื่อทดสอบ separation of duties

### ข้อสันนิษฐาน

- ไม่มี เพราะค่าทั้งหมดประกาศเป็นข้อมูลจำลอง ไม่ใช่ข้อเท็จจริงภายนอกหรือภาคสนาม

### คำถามที่ Owner ต้องตัดสินใจด้วยค่าจริง

1. Provider/service plan และ region ที่รองรับ policy/cost จริงคืออะไร
2. งบสูงสุดและผู้รับผิดชอบ billing/incident/deployment ตัวจริงคือใคร
3. Pilot URL, allowlist และ authentication design จริงเป็นแบบใด
4. Clean deployable commit/revision ใดจะถูกตรึงหลัง External PA-1 review

## 5. Reset และ Acceptance Criteria

วิธี reset: คืนค่าทุกช่องจาก
`09-Deployment/phase7-external-pa1-mockup-data-v1.0.json` แล้วรัน
`09-Deployment/validate-phase7-external-pa1-mockup.ps1`

- [x] ทั้ง 8 ช่องตรงกับ canonical JSON
- [x] URL ลงท้ายด้วย `.example.invalid`
- [x] Candidate state ยังคง `FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE`
- [x] External PA-1/PA-2/PA-3 ยังคง `NOT_APPROVED`
- [x] ทุก external action flag เป็น `false`
- [x] ไม่พบ secret, credential, เบอร์โทร หรือข้อมูลจริง

## 6. Gate ปัจจุบัน

**PA-1 Local/Emulator Passed; External PA-1 NOT APPROVED.**

ต้องแทนค่า Mock ทั้ง 8 ช่องด้วยค่าจริง ตรวจ impact/cost/access/ownership และส่ง
ข้อความอนุมัติ External PA-1 ใหม่อย่างชัดเจนก่อนสร้าง resource หรือ Deploy
