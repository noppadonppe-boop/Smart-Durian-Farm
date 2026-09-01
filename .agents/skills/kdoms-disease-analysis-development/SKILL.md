---
name: kdoms-disease-analysis-development
description: Plan, build, or review future KDOMS disease-image analysis and AI-assisted decision support while preserving the current Disease Incident workflow, Agronomist confirmation, Multi-Farm isolation, mock-first gates, and the ban on automatic chemical advice. Use for disease-analysis menus, mock analysis sessions, evaluation, or pilot-readiness; not for ordinary Care/Disease CRUD changes.
---

# KDOMS Disease Analysis Development

## Purpose

Prepare disease-analysis capability without turning an experimental output into a
confirmed diagnosis, treatment instruction, field fact, or deployment approval.

Before changing scope, data, gates, or runtime behavior, read:

1. [`AGENTS.md`](../../../AGENTS.md)
2. [`KDOMS Development, Mock Data & Pilot Knowledge`](../../../01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md)
3. [`KDOMS Scope Knowledge`](../../../01-Requirements/KDOMS_Scope_Knowledge_v0.2.md)
4. [`Decision Log`](../../../00-Project-Management/Decision-Log.md), especially
   DEC-026, DEC-027, DEC-031, DEC-038 and DEC-039
5. [`Phase 4 Work, Care & Disease Architecture`](../../../06-System-Architecture/Phase-4-Work-Care-Disease-Architecture_v0.1.md)
6. [`Disease Analysis P1 Architecture`](../../../06-System-Architecture/Disease-Analysis-P1-Deterministic-Mock-Architecture_v0.1.md)
7. [`Disease Analysis P1 Validation Report`](../../../08-Testing/Disease-Analysis-P1-Validation-Report_v0.1.md)

Read [the future-development workflow](references/future-development-workflow.md)
when planning a roadmap, adding the preparation menu, defining an analysis session,
implementing a mock harness, evaluating a model, or preparing a Pilot proposal.

## Current authorization

- DEC-039 authorizes P1 deterministic mock analysis in Local/Mock/Firebase
  Emulator only: synthetic Analysis Sessions, neutral candidate findings, Mock
  Confidence/Quality, Abstain, Agronomist Human Review, audit, idempotency and
  Cross-Farm/wrong-tree tests.
- P2 evaluation execution, real media/data, datasets, external AI/API/model,
  deployment, Controlled Pilot and Production remain unauthorized.
- DEC-026 remains `Open`; P1 must not select chemicals, dosage or treatment.

## Non-negotiable boundary

- Preserve `observed symptom` as a human observation separate from suspected and
  confirmed diagnosis.
- Treat automated output as a `candidate finding` that is unconfirmed until an
  authorized `AGRONOMIST` accepts, corrects, or rejects it.
- Support uncertainty and abstention. Never force a disease label when image
  quality or evidence is insufficient.
- Do not generate dosage, chemical selection, treatment approval, or safety advice.
  DEC-026 remains the controlling open decision.
- Scope every session and media reference to immutable `organizationId`, `farmId`,
  `positionId`, planting cycle, Disease Incident, actor, and idempotency key.
- Keep analysis history append-oriented and auditable, including model/source
  version, candidate output, confidence, review disposition, correction, and time.
- Deny Cross-Farm access, forged scope, wrong-tree association, duplicate commit,
  hidden history mutation, and automatic treatment creation from unreviewed output.
- Under DEC-039, use only deterministic, resettable `SIMULATED/TEST ONLY` records
  and synthetic placeholders in local/browser/Firebase Emulator tests. Do not use
  real images, public datasets, external AI/API/model, credentials, billing,
  deployment, or Production resources.

## Working method

1. Inspect the current Disease Incident UI, domain contract, repository, Rules,
   audit events, offline behavior, and tests before proposing a change.
2. Classify the request as preparation UI, local mock workflow, model evaluation,
   Controlled Pilot, or Production. Stop at the highest stage actually authorized.
3. Keep the current `Disease Incident → Agronomist assessment → Treatment Work
   Order → follow-up` path usable even when analysis is unavailable or abstains.
4. For local mock work, use stable scenario IDs and cover at least two isolated
   Farms, allowed/denied roles, wrong-tree, duplicate, offline retry, conflict,
   low-quality media, abstention, false candidate, human correction, and audit.
5. Validate domain logic, component behavior, cross-farm Rules, idempotency,
   accessibility at 320px, build, and offline-critical runtime as relevant.
6. Report what is implemented versus proposed, evidence produced, open decisions,
   current Gate, and the next approval needed. Never describe simulation as field,
   device, clinical/agronomic, or Production evidence.

## Stop conditions

Stop the affected work and preserve evidence if there is Cross-Farm disclosure,
wrong-tree analysis, unreviewed output recorded as confirmed diagnosis, automatic
chemical advice, duplicate critical history, real data entering local fixtures,
secret exposure, or any external action not explicitly approved.
