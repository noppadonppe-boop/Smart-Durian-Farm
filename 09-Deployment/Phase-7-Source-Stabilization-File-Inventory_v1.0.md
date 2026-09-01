# Phase 7 Source Stabilization File Inventory v1.0

| รายการ | ค่า |
|---|---|
| เวอร์ชัน | 1.0 |
| สถานะ | Inventory Reviewed — No Ambiguous Ownership at Checkpoint |
| เจ้าของเอกสาร | Project Owner |
| วันที่ตรวจ | 2026-09-01 |
| Classification | `OWNER-DIRECTED MOCK SUBSTITUTE / SIMULATED/TEST ONLY` |
| Approval effect | Local source stabilization/freeze only; no push/tag/deploy/external action |
| Source of Truth | `AGENTS.md`, Phase 7 Plan v2.0, DEC-037, DEC-038, Owner instruction for Source Stabilization |

## 1. วิธีตรวจ

ตรวจรายการจาก `git status --short --untracked-files=all` จำนวน 224 ไฟล์ ณ checkpoint ก่อน stabilization
ร่วมกับการตรวจชนิดไฟล์, ignored local environment, credential/phone pattern,
ภาพ/ไฟล์ binary และความสอดคล้องกับ Decision/Validation artifacts ที่มีอยู่

หลังเพิ่มไฟล์ stabilization ที่ตรวจสอบแล้ว 4 ไฟล์ รายการก่อน commit เป็น 228 ไฟล์:
Intended 226, Generated 2 และ Ambiguous 0

หลักการ: ไม่ลบ ไม่ reset ไม่ checkout และไม่ overwrite ไฟล์เดิมของผู้ใช้

## 2. Intended source/document/test (226 ไฟล์)

รายการต่อไปนี้สอดคล้องกับ implementation, requirements, architecture, operations,
test evidence และ Owner decisions ตั้งแต่ Gate 1–6/Phase 7/DEC-027–DEC-047
จึงอนุญาตให้นำเข้า local commits แบบแยกกลุ่มหลัง validation:

- ` M` `.gitignore`
- ` M` `00-Project-Management/Decision-Log.md`
- ` M` `00-Project-Management/Smart-Durian-Code_Phase_Prompts_v1.0.md`
- ` M` `01-Requirements/KDOMS_Codex_Master_Prompt_v1.1.md`
- ` M` `01-Requirements/KDOMS_Role_Access_Matrix_v0.1.md`
- ` M` `01-Requirements/KDOMS_Scope_Knowledge_v0.2.md`
- ` M` `03-Tree-Data/Tree-Register-Data-Dictionary_v0.1.md`
- ` M` `03-Tree-Data/tree-register-import-template.csv`
- ` M` `04-Tag-and-QR/Tag-and-QR-Standard_v0.1.md`
- ` M` `05-UX-UI/KDOMS_UX_UI_Knowledge_v0.1.md`
- ` M` `06-System-Architecture/Architecture-Baseline_v0.1.md`
- ` M` `06-System-Architecture/Phase-1-Foundation-Architecture_v0.1.md`
- ` M` `07-Source-Code/web-app/.env.example`
- ` M` `07-Source-Code/web-app/README.md`
- ` M` `07-Source-Code/web-app/firebase.json`
- ` M` `07-Source-Code/web-app/firestore.rules`
- ` M` `07-Source-Code/web-app/package.json`
- ` M` `07-Source-Code/web-app/pnpm-lock.yaml`
- ` M` `07-Source-Code/web-app/scripts/seed-phase2-emulator.mjs`
- ` M` `07-Source-Code/web-app/src/adapters/contracts.ts`
- ` M` `07-Source-Code/web-app/src/adapters/mock/mockDiseaseAnalysisRepository.test.ts`
- ` M` `07-Source-Code/web-app/src/adapters/mock/mockFoundationAdapters.ts`
- ` M` `07-Source-Code/web-app/src/adapters/mock/mockPhase2Adapters.test.ts`
- ` M` `07-Source-Code/web-app/src/adapters/mock/mockTreeRegisterRepository.ts`
- ` M` `07-Source-Code/web-app/src/adapters/runtimeAdapters.ts`
- ` M` `07-Source-Code/web-app/src/app/App.test.tsx`
- ` M` `07-Source-Code/web-app/src/app/AppLayout.tsx`
- ` M` `07-Source-Code/web-app/src/app/Phase2Context.tsx`
- ` M` `07-Source-Code/web-app/src/app/router.tsx`
- ` M` `07-Source-Code/web-app/src/config/environment.ts`
- ` M` `07-Source-Code/web-app/src/demo/demoAccounts.ts`
- ` M` `07-Source-Code/web-app/src/demo/disease-analysis-p1-mock-data-pack-v1.0.json`
- ` M` `07-Source-Code/web-app/src/demo/phase2-demo-seed.json`
- ` M` `07-Source-Code/web-app/src/demo/phase4-mock-data-pack-v1.0.json`
- ` M` `07-Source-Code/web-app/src/demo/phase5-mock-data-pack-v1.0.json`
- ` M` `07-Source-Code/web-app/src/domain/farm.test.ts`
- ` M` `07-Source-Code/web-app/src/domain/farm.ts`
- ` M` `07-Source-Code/web-app/src/domain/treeRegister.test.ts`
- ` M` `07-Source-Code/web-app/src/domain/treeRegister.ts`
- ` M` `07-Source-Code/web-app/src/domain/workCareDisease.test.ts`
- ` M` `07-Source-Code/web-app/src/domain/workCareDisease.ts`
- ` M` `07-Source-Code/web-app/src/infrastructure/firebase/firebaseClient.ts`
- ` M` `07-Source-Code/web-app/src/infrastructure/firebase/firebaseCommercialTraceabilityRepository.ts`
- ` M` `07-Source-Code/web-app/src/infrastructure/firebase/firebaseDiseaseAnalysisRepository.ts`
- ` M` `07-Source-Code/web-app/src/infrastructure/firebase/firebaseOperationalHardeningRepository.ts`
- ` M` `07-Source-Code/web-app/src/infrastructure/firebase/firebasePhase2Repository.ts`
- ` M` `07-Source-Code/web-app/src/infrastructure/firebase/firebaseTreeRegisterRepository.ts`
- ` M` `07-Source-Code/web-app/src/infrastructure/firebase/firebaseWorkCareDiseaseRepository.ts`
- ` M` `07-Source-Code/web-app/src/infrastructure/firebase/phoneOtpAuth.ts`
- ` M` `07-Source-Code/web-app/src/pages/DiseasePage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/HomePage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/MorePage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/NoFarmPage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/PageHeader.tsx`
- ` M` `07-Source-Code/web-app/src/pages/ProductionPage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/SignInPage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/TreeCreatePage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/TreeDetailPage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/TreeImportPage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/TreesPage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/UserManualPage.tsx`
- ` M` `07-Source-Code/web-app/src/pages/WorkCreatePage.tsx`
- ` M` `07-Source-Code/web-app/src/security/firebaseCommercialTraceability.emulator.test.ts`
- ` M` `07-Source-Code/web-app/src/security/firebaseDiseaseAnalysis.emulator.test.ts`
- ` M` `07-Source-Code/web-app/src/security/firebaseOperationalHardening.emulator.test.ts`
- ` M` `07-Source-Code/web-app/src/security/firebaseRepository.emulator.test.ts`
- ` M` `07-Source-Code/web-app/src/security/firebaseRules.emulator.test.ts`
- ` M` `07-Source-Code/web-app/src/security/firebaseTreeRegister.emulator.test.ts`
- ` M` `07-Source-Code/web-app/src/security/firebaseWorkCareDisease.emulator.test.ts`
- ` M` `07-Source-Code/web-app/src/services/workPhotoRecovery.ts`
- ` M` `07-Source-Code/web-app/src/styles/global.css`
- ` M` `07-Source-Code/web-app/src/vite-env.d.ts`
- ` M` `07-Source-Code/web-app/storage.rules`
- ` M` `07-Source-Code/web-app/vite.config.ts`
- ` M` `08-Testing/Gate-1-Acceptance-Checklist.md`
- ` M` `08-Testing/Phase-1-Validation-Report_v1.0.md`
- ` M` `AGENTS.md`
- ` M` `README.md`
- `??` `.agents/skills/kdoms-development-knowledge/SKILL.md`
- `??` `.agents/skills/kdoms-disease-analysis-development/SKILL.md`
- `??` `.agents/skills/kdoms-disease-analysis-development/agents/openai.yaml`
- `??` `.agents/skills/kdoms-disease-analysis-development/references/future-development-workflow.md`
- `??` `00-Project-Management/AI-Fruit-Counting-Feasibility-Plan_v0.1.md`
- `??` `00-Project-Management/Disease-Analysis-P1-P2-Development-Handover_v1.0.md`
- `??` `00-Project-Management/Owner-Review-Addendum_Development-Mock-Data-and-Pilot-Timing_2026-08-31.md`
- `??` `00-Project-Management/Owner-Review-Addendum_Disease-Analysis-P1_2026-09-01.md`
- `??` `00-Project-Management/Owner-Review-Addendum_Gate-1_2026-08-31.md`
- `??` `00-Project-Management/Owner-Review-Addendum_Gate-2_2026-08-31.md`
- `??` `00-Project-Management/Owner-Review-Addendum_Gate-3_2026-08-31.md`
- `??` `00-Project-Management/Owner-Review-Addendum_Gate-4_2026-08-31.md`
- `??` `00-Project-Management/Owner-Review-Addendum_Gate-5_2026-08-31.md`
- `??` `00-Project-Management/Owner-Review-Addendum_Gate-6_2026-08-31.md`
- `??` `00-Project-Management/Owner-Review-Addendum_Phase-3-Field-Validation-Pack_2026-08-31.md`
- `??` `00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md`
- `??` `00-Project-Management/Owner-Review-Decision_Phase-7-External-PA1_2026-08-31.md`
- `??` `00-Project-Management/Phase-2-Farm-Management-Remediation-Prompt_v1.0.md`
- `??` `00-Project-Management/Phase-2-Plan.md`
- `??` `00-Project-Management/Phase-3-Plan.md`
- `??` `00-Project-Management/Phase-4-Plan.md`
- `??` `00-Project-Management/Phase-5-Plan.md`
- `??` `00-Project-Management/Phase-6-Plan.md`
- `??` `00-Project-Management/Phase-7-Owner-Mockup-Input-Pack_v1.0.md`
- `??` `00-Project-Management/Phase-7-Plan.md`
- `??` `01-Requirements/KDOMS_AI_Fruit_Counting_Feasibility_Knowledge_v0.1.md`
- `??` `01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md`
- `??` `01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md`
- `??` `01-Requirements/KDOMS_Orchard_Layout_and_Target_Selection_Knowledge_v0.1.md`
- `??` `01-Requirements/KDOMS_Report_Catalogue_and_KPI_Definitions_v0.1.md`
- `??` `02-Field-Survey/AI-Fruit-Counting-Capture-and-Ground-Truth-Protocol_v0.1.md`
- `??` `02-Field-Survey/Phase-3-Field-Validation-Pack/00-Field-Validation-Pack-Index_v1.0.md`
- `??` `02-Field-Survey/Phase-3-Field-Validation-Pack/01-Printable-Field-Checklist_v1.0.md`
- `??` `02-Field-Survey/Phase-3-Field-Validation-Pack/02-Topology-Zone-Row-Counting-Record_v1.0.md`
- `??` `02-Field-Survey/Phase-3-Field-Validation-Pack/03-Tree-Survey-30-50_v1.0.md`
- `??` `02-Field-Survey/Phase-3-Field-Validation-Pack/03A-Tree-Survey-49-Column-Blank_v1.0.csv`
- `??` `02-Field-Survey/Phase-3-Field-Validation-Pack/04-Tag-QR-Pilot-Plan-5-10_v1.0.md`
- `??` `02-Field-Survey/Phase-3-Field-Validation-Pack/05-Android-iPhone-Test-Script_v1.0.md`
- `??` `02-Field-Survey/Phase-3-Field-Validation-Pack/06-Photo-Issue-Remediation-Log_v1.0.md`
- `??` `02-Field-Survey/Phase-3-Field-Validation-Pack/07-Gate-3-Field-Evidence-Summary_v1.0.md`
- `??` `02-Field-Survey/Phase-3-Field-Validation-Pack/08-Field-Execution-Brief_v1.0.md`
- `??` `06-System-Architecture/AI-Fruit-Counting-Feasibility-Architecture_v0.1.md`
- `??` `06-System-Architecture/Disease-Analysis-P1-Deterministic-Mock-Architecture_v0.1.md`
- `??` `06-System-Architecture/Firebase-Production-Shared-Root-Architecture_v1.0.md`
- `??` `06-System-Architecture/Phase-2-Multi-Farm-Access-Architecture_v0.1.md`
- `??` `06-System-Architecture/Phase-2-Threat-Model_v0.1.md`
- `??` `06-System-Architecture/Phase-3-Tree-Register-QR-Architecture_v0.1.md`
- `??` `06-System-Architecture/Phase-4-Work-Care-Disease-Architecture_v0.1.md`
- `??` `06-System-Architecture/Phase-5-Commercial-Traceability-Architecture_v0.1.md`
- `??` `06-System-Architecture/Phase-6-Operational-Hardening-Architecture_v0.1.md`
- `??` `06-System-Architecture/Phase-7-Work-Photo-Durable-Queue-and-Lifecycle-Architecture_v1.0.md`
- `??` `07-Source-Code/web-app/.env.emulator`
- `??` `07-Source-Code/web-app/.firebaserc`
- `??` `07-Source-Code/web-app/scripts/mock-seed/modules.mjs`
- `??` `07-Source-Code/web-app/scripts/mock-seed/runtime.mjs`
- `??` `07-Source-Code/web-app/scripts/mock-seed/verify.mjs`
- `??` `07-Source-Code/web-app/scripts/prepare-live-phone-allowlist.mjs`
- `??` `07-Source-Code/web-app/scripts/run-with-mock-environment.mjs`
- `??` `07-Source-Code/web-app/scripts/seed-emulator.mjs`
- `??` `07-Source-Code/web-app/scripts/validate-local-candidate.mjs`
- `??` `07-Source-Code/web-app/src/components/FarmManagement.css`
- `??` `07-Source-Code/web-app/src/components/FarmProfileForm.test.tsx`
- `??` `07-Source-Code/web-app/src/components/FarmProfileForm.tsx`
- `??` `07-Source-Code/web-app/src/components/OrchardTargetSelector.css`
- `??` `07-Source-Code/web-app/src/components/OrchardTargetSelector.test.tsx`
- `??` `07-Source-Code/web-app/src/components/OrchardTargetSelector.tsx`
- `??` `07-Source-Code/web-app/src/components/ProductionSeedPanel.tsx`
- `??` `07-Source-Code/web-app/src/components/TreeCycleFormFields.tsx`
- `??` `07-Source-Code/web-app/src/components/TreeCycleFormFields.css`
- `??` `07-Source-Code/web-app/src/domain/orchardLayout.test.ts`
- `??` `07-Source-Code/web-app/src/domain/orchardLayout.ts`
- `??` `07-Source-Code/web-app/src/infrastructure/firebase/firebaseDataRoot.ts`
- `??` `07-Source-Code/web-app/src/infrastructure/firebase/firebaseProductionMockSeeder.ts`
- `??` `07-Source-Code/web-app/src/infrastructure/firebase/phoneOtpAuth.test.ts`
- `??` `07-Source-Code/web-app/src/pages/FarmCreatePage.tsx`
- `??` `07-Source-Code/web-app/src/pages/FarmManagementPage.tsx`
- `??` `07-Source-Code/web-app/src/pages/FarmProfilePage.tsx`
- `??` `07-Source-Code/web-app/src/pages/OrchardLayoutPage.tsx`
- `??` `07-Source-Code/web-app/src/services/treeRegisterSpreadsheet.test.ts`
- `??` `07-Source-Code/web-app/src/services/treeRegisterSpreadsheet.ts`
- `??` `08-Testing/AI-Fruit-Counting-Feasibility-Acceptance-Checklist.md`
- `??` `08-Testing/AI-Fruit-Counting-WP1-Partial-Validation-Report_v0.1.md`
- `??` `08-Testing/Disease-Analysis-P1-Validation-Report_v0.1.md`
- `??` `08-Testing/Firebase-Emulator-Full-Mock-Seed-Validation_v1.0.md`
- `??` `08-Testing/Firebase-Live-Phone-Auth-Technical-Validation_v0.1.md`
- `??` `08-Testing/Firebase-Production-Firestore-Connection-Validation_v1.0.md`
- `??` `08-Testing/Gate-2-Acceptance-Checklist.md`
- `??` `08-Testing/Gate-3-Acceptance-Checklist.md`
- `??` `08-Testing/Gate-4-Acceptance-Checklist.md`
- `??` `08-Testing/Gate-5-Acceptance-Checklist.md`
- `??` `08-Testing/Gate-6-Acceptance-Checklist.md`
- `??` `08-Testing/Knowledge-Consistency-Review_DEC-046_2026-09-01.md`
- `??` `08-Testing/Orchard-Layout-and-Shared-Target-Selector-Validation_v0.1.md`
- `??` `08-Testing/Phase-2-Farm-Management-Remediation-Validation-Report_v1.0.md`
- `??` `08-Testing/Phase-2-Validation-Report_v1.0.md`
- `??` `08-Testing/Phase-3-Controlled-Field-Technical-Preflight_v1.0.md`
- `??` `08-Testing/Phase-3-Controlled-Field-Technical-Preflight_v1.1.md`
- `??` `08-Testing/Phase-3-Operational-Tree-Register-Form-Validation_v1.0.md`
- `??` `08-Testing/Phase-3-Thai-Spreadsheets-Validation_v1.0.md`
- `??` `08-Testing/Phase-3-Validation-Report_v1.0.md`
- `??` `08-Testing/Phase-4-Validation-Report_v1.0.md`
- `??` `08-Testing/Phase-4-Work-Photo-Enhancement-Validation_v1.0.md`
- `??` `08-Testing/Phase-5-Validation-Report_v1.0.md`
- `??` `08-Testing/Phase-6-Validation-Report_v1.0.md`
- `??` `08-Testing/Phase-7-Defect-and-Retest-Log_v1.0.csv`
- `??` `08-Testing/Phase-7-External-PA1-Mockup-Validation_v1.0.md`
- `??` `08-Testing/Phase-7-Go-No-Go-Report-Template_v1.0.md`
- `??` `08-Testing/Phase-7-Local-Pilot-Readiness-Report_v1.0.md`
- `??` `08-Testing/Phase-7-PA1-Local-Emulator-Rehearsal-Report_v1.0.md`
- `??` `08-Testing/Phase-7-PA1-Local-Emulator-Rehearsal-Report_v1.1.md`
- `??` `08-Testing/Phase-7-PA1-Mock-Dry-Run-Validation_v1.0.md`
- `??` `08-Testing/Phase-7-PA1-Owner-Mock-Substitute-Validation_v1.0.md`
- `??` `08-Testing/Phase-7-Pilot-Evidence-Register_v1.0.csv`
- `??` `08-Testing/Phase-7-Pilot-Metrics_v1.0.csv`
- `??` `08-Testing/Phase-7-Pilot-Readiness-Checklist.md`
- `??` `08-Testing/Phase-7-Work-Photo-Device-Evidence_v1.0.csv`
- `??` `08-Testing/Phase-7-Work-Photo-Physical-Device-Test-Protocol_v1.0.md`
- `??` `08-Testing/Phase-7-Work-Photo-Resilience-Validation_v1.0.md`
- `??` `08-Testing/Physical-Device-Validation-Gate_v1.0.md`
- `??` `08-Testing/fixtures/SIMULATED_INVALID_HEIC_FOR_BROWSER_REHEARSAL.heic`
- `??` `08-Testing/fixtures/SIMULATED_INVALID_JPEG_FOR_BROWSER_REHEARSAL.jpg`
- `??` `08-Testing/fixtures/report-policy-owner-mock-v0.1.json`
- `??` `09-Deployment/Phase-7-External-PA1-Mockup-Data-Pack_v1.0.md`
- `??` `09-Deployment/Phase-7-PA1-Owner-Actual-Input-Form_v1.0.md`
- `??` `09-Deployment/Phase-7-Pilot-Candidate-Manifest_v0.1.md`
- `??` `09-Deployment/Phase-7-Pilot-Impact-and-Approval-Pack_v1.0.md`
- `??` `09-Deployment/phase7-external-pa1-mockup-data-v1.0.json`
- `??` `09-Deployment/phase7-external-pa1-owner-decision-v1.0.json`
- `??` `09-Deployment/phase7-owner-mockup-input-v1.0.json`
- `??` `09-Deployment/phase7-pa1-local-rehearsal-approval-v1.0.json`
- `??` `09-Deployment/phase7-pa1-local-rehearsal-approval-v1.1.json`
- `??` `09-Deployment/phase7-pa1-owner-selected-mock-substitute-v1.0.json`
- `??` `09-Deployment/validate-phase7-external-pa1-mockup.ps1`
- `??` `09-Deployment/validate-phase7-owner-mockup.ps1`
- `??` `09-Deployment/validate-phase7-pa1-local-rehearsal.ps1`
- `??` `09-Deployment/validate-phase7-pa1-owner-selection.ps1`
- `??` `10-Operations/KDOMS_Report_Policy_Owner_Mockup_v0.1.md`
- `??` `10-Operations/KDOMS_User_Manual_v1.0.md`
- `??` `10-Operations/Phase-6-Backup-Export-Restore-Draft_v0.1.md`
- `??` `10-Operations/Phase-6-Monitoring-and-Incident-Plan_v0.1.md`
- `??` `10-Operations/Phase-7-Backup-Restore-Drill_v1.0.md`
- `??` `10-Operations/Phase-7-Backup-Restore-Drill_v1.1.md`
- `??` `10-Operations/Phase-7-Controlled-Pilot-Runbook_v1.0.md`
- `??` `10-Operations/Phase-7-Photo-Data-Governance-Decision-Sheet_v1.0.md`
- `??` `10-Operations/Phase-7-Privacy-Retention-Access-Review_v0.1.md`
- `??` `10-Operations/Phase-7-Privacy-Retention-Access-Review_v0.2.md`
- `??` `10-Operations/Phase-7-Role-Training-Guide_v1.0.md`
- `??` `10-Operations/Phase-7-Support-Incident-and-Rollback-Plan_v1.0.md`

## 3. Generated output (2 ไฟล์)

เก็บไฟล์ไว้ในเครื่องและเพิ่ม ignore rule โดยไม่ลบหรือ commit:

- `??` `outputs/01a05bcf-5dc6-78f3-bc1f-da8797ad4379/KDOMS-แบบฟอร์ม-ทะเบียนต้น-ภาษาไทย.xlsx`
- `??` `package-lock.json`

เหตุผล:

- `outputs/**` เป็น workbook ที่ระบบสร้างขึ้น ไม่ใช่ source of truth
- `/package-lock.json` เป็น lockfile ว่างจาก npm ที่ root ขณะที่แอปกำหนด `pnpm` และใช้ `07-Source-Code/web-app/pnpm-lock.yaml` เป็น dependency lock

## 4. Local-only/config

รายการต่อไปนี้ถูก ignore อยู่แล้วและห้าม commit:

- `07-Source-Code/web-app/.env` — local Production/Auth configuration; พบ phone-like allowlist data จึงคง local-only
- `07-Source-Code/web-app/.env.firebase-live.local` — local Firebase Auth configuration
- `node_modules/`, `dist/`, `.firebase/`, `.firebase-local/`, `coverage/`, `*-debug.log` และ emulator state — dependency/build/runtime output

รายการ config ที่อนุญาตให้ commit เพราะไม่มี secret:

- `07-Source-Code/web-app/.env.example` และ `.env.emulator` ใช้ demo identifiers/loopback และ test-number example
- `07-Source-Code/web-app/.firebaserc`/`firebase.json` มี public project/site identifiers ตาม DEC-041/042 แต่ไม่มี credential; Candidate ยังคง not deployable

## 5. Ambiguous — ต้องหยุดถาม Owner

**ไม่มีรายการ ณ checkpoint นี้**

หากมีไฟล์ใหม่หรือชนิดข้อมูลเปลี่ยนก่อน commit ต้องจัด inventory และ safety scan ซ้ำ

## 6. Secret/real-data safety result

- ไม่พบ private key, service-account JSON, GitHub/AWS/Slack token หรือ JWT pattern ใน commit candidates
- phone-like values ใน commit candidates จำกัดอยู่ที่ Firebase `+1 650-555-01xx` test accounts, deny-case และ Thai-format normalization literals; ไม่ใช่ Owner allowlist จริง
- raw local allowlist อยู่ใน ignored `.env` เท่านั้นและจะไม่ถูก stage/commit
- ไม่พบภาพจริง; มีเพียง fixture 158-byte ที่จงใจ invalid และติดชื่อ `SIMULATED_INVALID_*`
- workbook ใน `outputs/**` ไม่ commit โดยไม่ต้องเปิดเผยหรือยืนยันว่าเป็นข้อมูลจริง
- ไม่พบ Cross-Farm evidence หรือข้อมูลสวน/topology/อุปกรณ์/ค่าใช้จ่ายจริงที่เพิ่มเพื่อการ freeze

## 7. Commit grouping decision

อนุญาต local commits หลังแก้ performance และ validation โดยแยกอย่างน้อย:

1. requirements/decisions/architecture/operations evidence
2. application source, Mock packs, Firebase Rules และ tests
3. Phase 7 stabilization inventory, validation, Candidate manifest และ Owner Review Mockup

ห้าม push, merge, tag, deploy, resource/billing/credential/SMS/Storage/QR/device/field action
และต้องคง External PA-1 เป็น `NO-GO/BLOCKED`

## 8. Acceptance criteria

- [x] ทุก changed/untracked path ณ checkpoint ถูกจัดประเภท
- [x] Generated/local-only ไม่ถูกลบและไม่ถูก commit
- [x] ไม่พบรายการ Ambiguous
- [x] Secret/real-data scan ผ่านระดับ local inventory
- [ ] รัน scan ซ้ำจาก staged/clean Candidate ก่อน freeze
- [ ] Working tree สะอาดหลัง local commits
