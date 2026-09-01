# Owner Review Mockup — Phase 7 Source Stabilization & Local Candidate Freeze

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.2 |
| สถานะ | Local Scope Executed and Evidence Prepared — Owner Decision Reference Still TBD |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Classification | `OWNER-DIRECTED MOCK SUBSTITUTE / SIMULATED/TEST ONLY` |
| Approval effect | ไม่มีสิทธิ์ Deploy หรือดำเนิน External Pilot Action |
| External PA-1 | `NO-GO/BLOCKED` |
| PA-2 / Controlled Pilot / Production | `NOT APPROVED` |
| Source of Truth | Current Owner instruction, Phase 7 Plan v2.3, Candidate Manifest v1.0, Local Pilot Readiness Report v1.5, DEC-037, DEC-038, DEC-048, DEC-049, DEC-050 |

## 1. ขอบเขตที่เสนอให้ Owner พิจารณา

อนุญาตเฉพาะ:

- แก้ CSS performance budget ภายในเพดานเดิม 60,000 bytes
- ตรวจและจัดหมวด source drift
- ตรวจ secret และข้อมูลจริง
- สร้าง local Git commits โดยไม่ push
- รัน Full Validation ด้วย Mock/Firebase Emulator
- Freeze Local Candidate ใหม่จาก clean commit
- อัปเดตเอกสารหลักฐานและ Owner Review Mockup

ไม่อนุญาต:

- Firebase/resource/billing/credential เพิ่มเติม
- Deploy Hosting/Firestore/Storage
- SMS หรือเบอร์โทรจริงเพิ่มเติม
- ข้อมูล รูป บุคคล สวน topology หรืออุปกรณ์จริง
- QR/ป้ายจริงและการลงพื้นที่
- PA-2, Controlled Pilot หรือ Production

## 2. ข้อมูล Mock สำหรับการ Review

| รายการค่า Mock | ค่า |
|---|---|
| Environment | `LOCAL_BROWSER_FIREBASE_EMULATOR_ONLY` |
| Provider/project | `PROVIDER-SIM-01 / KDOMS-PILOT-SIM-001` |
| Region | `SIM-REGION-01` |
| Billing | `DISABLED — SIMULATED` |
| Cost ceiling | `0 THB — MOCK ONLY; NOT A REAL COST ESTIMATE` |
| Candidate | `KDOMS-PC-SIM-20260901-05 — FROZEN_LOCAL_REHEARSAL_ONLY_NOT_DEPLOYABLE` |
| Data | Deterministic `SIMULATED/TEST ONLY` |
| External actions | `false` |
| Lifecycle worker | `DRY_RUN only` |
| External PA-1 | `NO-GO/BLOCKED` |
| PA-2/Production | `NOT APPROVED` |

ทุกค่าในตารางเป็น `OWNER-DIRECTED MOCK SUBSTITUTE / SIMULATED/TEST ONLY`
ไม่ใช่ provider, project, region, cost, URL, บุคคลหรือทรัพยากรจริง

## 3. ผล Source Stabilization และเกณฑ์ก่อน Freeze

- [x] Initial CSS 56,497 ≤ 60,000 bytes และ ≤58,000 bytes
- [x] TypeScript strict และ ESLint ผ่าน
- [x] Unit/component 229/229 ผ่านใน 29 files
- [x] Firebase Emulator/security 69/69 ผ่านใน 9 files
- [x] Deterministic seed 161 records ใน 7 modules ผ่าน
- [x] Cross-Farm disclosure/allow = 0
- [x] Build/PWA 82 precache entries และ Offline runtime scan 82 files ผ่าน
- [x] `git diff --check` ผ่าน
- [x] Secret/real-data scan ผ่าน; local phone allowlist ไม่ถูก commit
- [x] Working tree สะอาดที่ source commit
- [x] Candidate manifest มี source commit และ SHA-256 ครบ
- [x] เอกสารผลทดสอบปรับเป็นผลล่าสุด
- [x] Browser 320px, Android 360×800, iPhone 390×844, Light/Dark,
  touch target และ Offline UX ผ่านโดย console error = 0

## 4. Candidate traceability

| Field | Value |
|---|---|
| Source commit | `95f5365e00876fefc427e6d8fd40b1de3deb5809` |
| Source snapshot SHA-256 | `0B826DE5FE7D673FC7C0BC3AAD93228CE9852EBE38F183A928D481E54A5D9477` |
| Build artifact SHA-256 | `A571B3A229C17E4F8DED27CAE959ED3D24570B6E010BCE2E0F5AA73463F0E476` |
| Dependency lock SHA-256 | `399735448A585711372FD5EB3C620B1BF141C10833081C6A296E3606B86C7DF6` |

Source drift เดิมถูกปิดด้วย clean Local Candidate นี้ แต่ไม่ทำให้ Candidate เป็น
deployable revision และไม่ยกเลิก External PA-1 `NO-GO/BLOCKED` ตาม DEC-038
เพราะ actual values, governance, cost และ external controls ยังไม่ครบ

Candidate `KDOMS-PC-SIM-20260901-04` คงเป็น historical local evidence และถูก
Candidate `...-05` แทนหลังรวม DEC-050 Owner-only Financial Data กับการแก้
Annual Cycle switcher touch target/horizontal overflow; ไม่ใช่การอนุมัติ Deploy

## 5. Owner Decision

เลือกหนึ่งรายการ:

- [ ] `APPROVE — LOCAL SOURCE STABILIZATION AND LOCAL CANDIDATE FREEZE ONLY`
- [ ] `REVISE — ระบุรายการที่ต้องแก้`
- [ ] `DEFER`

ข้อความอนุมัติที่แนะนำ:

> อนุมัติให้ดำเนินการ Source Stabilization, แก้ CSS performance budget,
> จัดระเบียบและสร้าง local commits, รัน Full Validation และ Freeze Local Candidate
> ใหม่ด้วย deterministic Mock Data เท่านั้น ห้าม push, deploy, สร้าง external
> resource, billing หรือ credential และห้ามใช้ข้อมูล/รูป/อุปกรณ์/QR/พื้นที่จริง
> External PA-1 ยังคง NO-GO/BLOCKED ตาม DEC-038 และยังไม่อนุมัติ PA-2,
> Controlled Pilot หรือ Production

Owner decision reference: `TBD — ต้องบันทึกหลัง Owner ยืนยันจริง`

Effective date: `TBD`
