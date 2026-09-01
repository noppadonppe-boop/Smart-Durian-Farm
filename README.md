# Smart Durian Farm (KDOMS)

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.9 |
| สถานะ | Gate 6 Passed — External PA-1 Owner Decision = NO-GO/BLOCKED; No Deployment |
| เจ้าของเอกสาร | Project Owner |
| วันที่ปรับปรุง | 2026-09-01 |
| Source of Truth | `AGENTS.md` v3.3, Development/Mock Data/Pilot Knowledge v1.0.4, Scope Knowledge v0.2.2, Decision Log v3.2, AIFC Knowledge v0.2, Owner Addendum Gate 6, External PA-1 Owner Review Decision v1.2, Phase 7 Plan v2.0 |

ระบบบริหารจัดการสวนทุเรียนแบบหลายสวน (Multi-Farm) ตั้งแต่ทะเบียนต้น การดูแล งานคนสวน โรค ปุ๋ย–ยา ผลผลิต การเก็บเกี่ยว จนถึงการขาย

## สถานะโครงการ

- ระยะปัจจุบัน: **External PA-1 = NO-GO/BLOCKED ตาม DEC-038; คงเฉพาะ PA-1 Local/Emulator**
- Gate 0: **APPROVED เมื่อ 2026-08-31**
- Gate 1: **APPROVED เมื่อ 2026-08-31**
- Gate 2: **APPROVED เมื่อ 2026-08-31**
- Gate 3: **APPROVED เมื่อ 2026-08-31 — Physical/Field evidence Deferred ตาม DEC-027**
- Gate 4: **APPROVED เมื่อ 2026-08-31 — อนุมัติ Phase 5 ตาม DEC-028**
- Gate 5: **APPROVED เมื่อ 2026-08-31 — อนุมัติ Phase 6 ตาม DEC-029**
- Gate 6: **APPROVED เมื่อ 2026-08-31 — อนุมัติ Phase 7 ตาม DEC-031**
- DEC-010: **APPROVED — เบอร์โทรศัพท์ + SMS OTP บน Emulator เท่านั้น**
- DEC-021: **APPROVED — เริ่ม Phase 3 ตาม Prompt Phase 3**
- DEC-027: **APPROVED — Mock-first Development; Field/Device ไม่ block Engineering Phase**
- DEC-028: **APPROVED — Gate 4 ผ่านและอนุมัติเริ่ม Phase 5**
- DEC-029: **APPROVED — Gate 5 ผ่านและอนุมัติเริ่ม Phase 6**
- DEC-031: **APPROVED — Gate 6 ผ่านและอนุมัติ Phase 7 planning/readiness; External Pilot Action ขอแยก**
- DEC-032: **APPROVED — AIFC-G0/WP0–WP2 แบบ Mock/local-only**
- DEC-033: **APPROVED — จำนวนผลเลือกได้ทั้งคนนับหรือ AI ช่วยนับ + คนตรวจ**
- DEC-035: **APPROVED — กรอก PA-1 Owner input ด้วย deterministic Mock substitute; ไม่ใช่สิทธิ์ Deploy**
- DEC-036: **APPROVED — Work photo durable queue/lifecycle hardening แบบ local/mock-only**
- DEC-037: **APPROVED — PA-1 เฉพาะ Local/Emulator rehearsal ด้วย Mock Data; ไม่อนุมัติ External Action หรือ Deploy**
- DEC-038: **BLOCKED — Owner ตัดสิน External PA-1 เป็น NO-GO; ต้องมี actual values, governance, cost และ clean frozen deployable Candidate ก่อน review ใหม่**
- Application code: **Phase 7 local hardening และ PA-1 Local/Emulator rehearsal ผ่านการตรวจแล้ว**
- Mock Data Pack: **Phase 6 v1.0.0 — deterministic/resettable/SIMULATED/TEST ONLY**
- Field/Physical Validation: **Deferred ไป Controlled Pilot และต้องผ่านก่อน Production/ป้ายถาวร/ขยายใช้งาน**
- Firebase production: **ยังไม่สร้างหรือเชื่อมต่อ**
- Phase 6: **ดำเนินการเสร็จและ Gate 6 ผ่านแล้ว**
- Phase 7: **Planning/Operations Pack และ Candidate `KDOMS-PC-SIM-20260831-02` ผ่าน Local/Browser/Emulator rehearsal; ยังห้าม Deploy**
- Owner Mockup Input: **ครบ PA-1/PA-2 แบบ deterministic/resettable และติดป้าย SIMULATED/TEST ONLY**
- PA-1 Mock Dry-run: **PASSED — ตรวจอัตโนมัติซ้ำได้; ไม่มี deployment/ข้อมูลจริง/physical evidence**
- Owner-selected PA-1 Input: **COMPLETE — 22 ช่องตรงกับ Mock source และติดป้าย SIMULATED/TEST ONLY**
- PA-1 Local/Emulator: **APPROVED และ PASSED — Mock Data เท่านั้น**
- External PA-1: **NO-GO/BLOCKED — resource/cost/credential/deployment ยัง HOLD**
- External PA-1 Readiness: **Owner exact decision บันทึกแล้วเมื่อ 2026-09-01**
- Current Local Candidate integrity: **Historical local evidence เท่านั้น — Source ปัจจุบันไม่ตรง frozen snapshot เดิมและยังไม่มี clean deployable Candidate**
- Production: **NOT APPROVED — ต้องผ่าน Controlled Pilot และ PA-3 ก่อน**

## Source of Truth

ให้อ่านเอกสารตามลำดับนี้ก่อนดำเนินงาน:

1. `AGENTS.md` — กติกาการทำงานของ Codex ในโครงการ
2. `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md` — ขอบเขตผลิตภัณฑ์ล่าสุด
3. `01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md` — แนวทางพัฒนาระยะยาว
4. `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md` — Working Proposal ของ 7 roles
5. `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md` — มาตรฐานรหัสและป้าย
6. `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md` — หลัก UX/UI
7. `03-Tree-Data/Tree-Register-Data-Dictionary_v0.1.md` — Data Dictionary สำหรับ Tree import
8. `00-Project-Management/Phase-0-Plan.md` — แผนและ Gate 0
9. `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md` — Prompt ส่งให้ Codex ทีละ Phase
10. `00-Project-Management/Phase-0-Remediation-Prompt_v1.0.md` — Prompt แก้ประเด็น No-Go ก่อนเสนอ Gate 0 ใหม่
11. `00-Project-Management/Owner-Review-Addendum_Gate-0_2026-08-31.md` — มติ Owner ที่อนุมัติ Gate 0
12. `06-System-Architecture/Phase-1-Foundation-Architecture_v0.1.md` — boundary ที่สร้างใน Phase 1
13. `08-Testing/Gate-1-Acceptance-Checklist.md` — หลักฐานเสนอ Gate 1
14. `00-Project-Management/Owner-Review-Addendum_Gate-1_2026-08-31.md` — มติ Owner ที่อนุมัติ Gate 1 และ DEC-010
15. `06-System-Architecture/Phase-2-Multi-Farm-Access-Architecture_v0.1.md` — schema และ access boundary ของ Phase 2
16. `06-System-Architecture/Phase-2-Threat-Model_v0.1.md` — Threat notes และ residual risks
17. `08-Testing/Phase-2-Validation-Report_v1.0.md` — ผลตรวจ Phase 2
18. `08-Testing/Gate-2-Acceptance-Checklist.md` — Checklist สำหรับ Owner Review
19. `00-Project-Management/Owner-Review-Addendum_Gate-2_2026-08-31.md` — มติ Owner ที่อนุมัติ Gate 2
20. `00-Project-Management/Phase-3-Plan.md` — แผนและ boundary ของ Phase 3
21. `06-System-Architecture/Phase-3-Tree-Register-QR-Architecture_v0.1.md` — Tree/Tag/QR/Import architecture
22. `08-Testing/Phase-3-Validation-Report_v1.0.md` — ผลตรวจ implementation Phase 3
23. `08-Testing/Gate-3-Acceptance-Checklist.md` — Checklist และ Field Validation blockers
24. `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md` — Mock-first/Pilot timing
25. `00-Project-Management/Owner-Review-Addendum_Gate-3_2026-08-31.md` — มติ Gate 3 และ deferral
26. `00-Project-Management/Phase-4-Plan.md` — แผนและผล Phase 4
27. `06-System-Architecture/Phase-4-Work-Care-Disease-Architecture_v0.1.md` — Phase 4 architecture
28. `08-Testing/Phase-4-Validation-Report_v1.0.md` — ผลตรวจ Phase 4
29. `08-Testing/Gate-4-Acceptance-Checklist.md` — Checklist สำหรับ Owner Review
30. `00-Project-Management/Owner-Review-Addendum_Gate-4_2026-08-31.md` — มติ Owner ที่อนุมัติ Gate 4 และ Phase 5
31. `00-Project-Management/Phase-5-Plan.md` — แผน ขอบเขต และผล Phase 5
32. `06-System-Architecture/Phase-5-Commercial-Traceability-Architecture_v0.1.md` — Crop/Harvest/Sales/Inventory architecture
33. `08-Testing/Phase-5-Validation-Report_v1.0.md` — ผลตรวจ Phase 5
34. `08-Testing/Gate-5-Acceptance-Checklist.md` — Checklist สำหรับ Owner Review Gate 5
35. `00-Project-Management/Owner-Review-Addendum_Gate-5_2026-08-31.md` — มติ Owner ที่อนุมัติ Gate 5 และ Phase 6
36. `00-Project-Management/Phase-6-Plan.md` — แผน ขอบเขต และผล Phase 6
37. `06-System-Architecture/Phase-6-Operational-Hardening-Architecture_v0.1.md` — Dashboard/Offline/Audit/Security architecture
38. `10-Operations/Phase-6-Backup-Export-Restore-Draft_v0.1.md` — ร่าง Backup/Restore
39. `10-Operations/Phase-6-Monitoring-and-Incident-Plan_v0.1.md` — ร่าง Monitoring/Incident
40. `08-Testing/Phase-6-Validation-Report_v1.0.md` — ผลตรวจ Phase 6
41. `08-Testing/Gate-6-Acceptance-Checklist.md` — Checklist สำหรับ Owner Review Gate 6
42. `00-Project-Management/Owner-Review-Addendum_Gate-6_2026-08-31.md` — มติ Owner ที่อนุมัติ Gate 6 และ Phase 7
43. `00-Project-Management/Phase-7-Plan.md` — แผน Phase 7 และ PA-1/PA-2/PA-3
44. `09-Deployment/Phase-7-Pilot-Impact-and-Approval-Pack_v1.0.md` — ผลกระทบ ค่าใช้จ่าย และรายการขออนุมัติ PA-1
45. `09-Deployment/Phase-7-Pilot-Candidate-Manifest_v0.1.md` — สถานะ Candidate/freeze/deploy boundary
46. `10-Operations/Phase-7-Controlled-Pilot-Runbook_v1.0.md` — Runbook สำหรับ Pilot ที่ได้รับอนุมัติ
47. `08-Testing/Phase-7-Local-Pilot-Readiness-Report_v1.0.md` — ผลตรวจ local readiness
48. `08-Testing/Phase-7-Pilot-Readiness-Checklist.md` — Hold points และ Pilot readiness
49. `01-Requirements/KDOMS_AI_Fruit_Counting_Feasibility_Knowledge_v0.1.md` — AIFC Knowledge v0.2
50. `00-Project-Management/AI-Fruit-Counting-Feasibility-Plan_v0.1.md` — AIFC Plan v0.2
51. `06-System-Architecture/AI-Fruit-Counting-Feasibility-Architecture_v0.1.md` — AIFC Architecture v0.2
52. `02-Field-Survey/AI-Fruit-Counting-Capture-and-Ground-Truth-Protocol_v0.1.md` — Capture/Ground-Truth Protocol v0.2
53. `08-Testing/AI-Fruit-Counting-Feasibility-Acceptance-Checklist.md` — AIFC Gate checklist v0.2
54. `08-Testing/AI-Fruit-Counting-WP1-Partial-Validation-Report_v0.1.md` — ผลตรวจ Manual/AI choice และ deterministic mock
55. `00-Project-Management/Phase-7-Owner-Mockup-Input-Pack_v1.0.md` — ค่า Mock สำหรับ Owner dry-run โดยไม่เปลี่ยน approval
56. `09-Deployment/phase7-owner-mockup-input-v1.0.json` — ข้อมูล Owner Mock แบบ deterministic/resettable
57. `09-Deployment/validate-phase7-owner-mockup.ps1` — ตัวตรวจ Mockup Input และ approval boundary แบบทำซ้ำได้
58. `08-Testing/Phase-7-PA1-Mock-Dry-Run-Validation_v1.0.md` — ผลตรวจ PA-1 Mock Dry-run
59. `09-Deployment/Phase-7-PA1-Owner-Actual-Input-Form_v1.0.md` — แบบฟอร์มค่าจริงสำหรับ Owner ก่อนอนุมัติ PA-1
60. `09-Deployment/phase7-pa1-owner-selected-mock-substitute-v1.0.json` — Owner-selected PA-1 mapping แบบ machine-readable
61. `09-Deployment/validate-phase7-pa1-owner-selection.ps1` — ตัวตรวจ mapping และ approval boundary
62. `08-Testing/Phase-7-PA1-Owner-Mock-Substitute-Validation_v1.0.md` — ผลตรวจค่าที่กรอกจาก Mock
63. `09-Deployment/phase7-pa1-local-rehearsal-approval-v1.1.json` — ระเบียนอนุมัติ DEC-037 และ Candidate local snapshot ล่าสุด
64. `09-Deployment/validate-phase7-pa1-local-rehearsal.ps1` — ตัวตรวจขอบเขตและ checksum ของ local candidate
65. `08-Testing/Phase-7-PA1-Local-Emulator-Rehearsal-Report_v1.1.md` — ผลซ้อม PA-1 Local/Browser/Emulator และ Durable Queue reload/retry
66. `06-System-Architecture/Phase-7-Work-Photo-Durable-Queue-and-Lifecycle-Architecture_v1.0.md` — ข้อกำหนด queue และ photo lifecycle
67. `10-Operations/Phase-7-Photo-Data-Governance-Decision-Sheet_v1.0.md` — รายการตัดสินใจ photo governance ก่อน External Pilot
68. `09-Deployment/Phase-7-External-PA1-Mockup-Data-Pack_v1.0.md` — แบบกรอก 8 ช่องสำหรับ External PA-1 decision rehearsal
69. `09-Deployment/phase7-external-pa1-mockup-data-v1.0.json` — ค่า Mock canonical แบบ deterministic/resettable
70. `09-Deployment/validate-phase7-external-pa1-mockup.ps1` — ตัวตรวจข้อมูลจำลองและ no-external-action boundary
71. `08-Testing/Phase-7-External-PA1-Mockup-Validation_v1.0.md` — รายงานผลตรวจชุด Mock External PA-1
72. `00-Project-Management/Owner-Review-Decision_Phase-7-External-PA1_2026-08-31.md` — มติ Owner `NO-GO` สำหรับ External PA-1 ตาม DEC-038
73. `09-Deployment/phase7-external-pa1-owner-decision-v1.0.json` — ระเบียน NO-GO/BLOCKED แบบ machine-readable โดยไม่มี secret

หากเอกสารขัดกัน ให้ใช้ลำดับอำนาจใน `AGENTS.md` v3.3: คำสั่ง Owner ล่าสุด →
Development/Mock Data/Pilot Knowledge → Scope Knowledge → Approved Decision →
Master Prompt → เอกสารประกอบ และบันทึกประเด็นไว้ใน Decision Log

## โครงสร้างโฟลเดอร์

```text
00-Project-Management   แผนงาน การตัดสินใจ และ Gate
01-Requirements         Scope, Master Prompt และข้อกำหนด
02-Field-Survey         แบบสำรวจสวนและข้อมูลภาคสนาม
03-Tree-Data            แบบข้อมูลทะเบียนต้นและไฟล์นำเข้า
04-Tag-and-QR           มาตรฐานรหัส ป้าย และ QR
05-UX-UI                UX/UI Knowledge และตัวอย่างหน้าจอ
06-System-Architecture  ข้อกำหนดสถาปัตยกรรมระดับแนวคิด
07-Source-Code          Phase 6 Web App, Mock Data Pack และ Firebase Emulator Rules
08-Testing              เกณฑ์ทดสอบและ Acceptance
09-Deployment           แผนสภาพแวดล้อมและการเผยแพร่
10-Operations           คู่มือใช้งานและดูแลระบบ
11-References           แหล่งอ้างอิง
99-Archive              เอกสารที่เลิกใช้แล้ว
```

## ขั้นตอนถัดไป

1. คง External PA-1 ที่ `NO-GO/BLOCKED` และใช้ PA-1 Local/Emulator ตาม DEC-037 เท่านั้น
2. ห้ามใช้ค่า `SIM-*`, 0 THB หรือ `.example.invalid` เพื่ออนุมัติ/Deploy
3. หากต้องการ Private Pilot จริง ให้กรอก provider/project/region/budget/URL,
   governance owners และจัดทำ clean frozen deployable Candidate ด้วยค่าจริง
4. เมื่อ prerequisite ครบ ให้จัดทำ External PA-1 Owner Review ฉบับใหม่และหยุดรอ
   ข้อความ `GO` ก่อนสร้าง resource, billing, credential หรือ Deploy
5. หลัง External PA-1 ผ่าน จึง Deploy Pilot Candidate ด้วย Mock Data เท่านั้นตามขอบเขตที่อนุมัติ
6. ต้องขอ PA-2 แยกก่อนข้อมูลจริง อุปกรณ์จริง QR/ป้าย และการลงพื้นที่
7. ต้องผ่าน Pilot/Physical Validation และขอ PA-3 ก่อน Production/ป้ายถาวร/600 ต้น

เส้นทาง AIFC แยกจาก Phase 7: ทำ WP1–WP2 แบบ Mock/local-only ต่อได้ตาม DEC-032
แต่ `AIFC-G1` ยังไม่ผ่าน และต้องขออนุมัติใหม่ก่อนภาพจริง external AI หรือ Pilot
