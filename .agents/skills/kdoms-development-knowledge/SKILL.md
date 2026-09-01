---
name: kdoms-development-knowledge
description: Apply Smart Durian Farm/KDOMS project knowledge when planning, building, testing, or reviewing the app, especially the mock-first development boundary and the timing of staging, controlled field pilot, physical-device validation, and production rollout.
---

# KDOMS Development Knowledge

## Purpose

Keep KDOMS implementation moving with deterministic simulated data while preserving
Multi-Farm security, auditability, offline/idempotency, and a credible path to a
real-device controlled pilot.

Read these current authorities before changing project scope, phase gates, test
timing, deployment boundaries, or data policy:

1. [`AGENTS.md`](../../../AGENTS.md)
2. [`KDOMS Development, Mock Data & Pilot Knowledge v1.0`](../../../01-Requirements/KDOMS_Development_Mock_Data_and_Pilot_Knowledge_v1.0.md)
3. [`Decision Log`](../../../00-Project-Management/Decision-Log.md)
4. The active phase plan and relevant domain knowledge

For operational Tree Register data entry, also read
[`Owner Review Addendum — Tree Register Operational Data Entry`](../../../00-Project-Management/Owner-Review-Addendum_Tree-Register-Operational-Data-Entry_2026-09-01.md).

For Farm Profile or Farm Management work, also read
[`KDOMS Farm Profile and Management Knowledge v0.1`](../../../01-Requirements/KDOMS_Farm_Profile_and_Management_Knowledge_v0.1.md).

For annual planning, year selection, annual close/correction, carry-over, or any
change that assigns operational data to a management year, also read
[`KDOMS Annual Farm Management Cycle Knowledge v0.1`](../../../01-Requirements/KDOMS_Annual_Farm_Management_Cycle_Knowledge_v0.1.md).

For periodic farm reports, labor cost, operating expense, or sales-versus-cost
work, also read
[`KDOMS Management Reporting and Cost Knowledge v0.1`](../../../01-Requirements/KDOMS_Management_Reporting_and_Cost_Knowledge_v0.1.md)
and the current Report Catalogue.

## Operating policy

- Use versioned, deterministic, resettable `SIMULATED/TEST ONLY` data throughout
  application development and automated, browser, local, and emulator testing.
- Do not block an implementation phase or its engineering Gate merely because
  physical devices, field topology, camera/QR, real networks, or real users have
  not yet been validated.
- Mark unknown field values `TBD`; never turn a mock value into a field fact.
- A private staging or Pilot Candidate deployment with mock data is a separate
  authorization decision. This skill does not authorize deployment, Firebase
  Production, billing, credentials, real SMS, or real data by itself.
- DEC-046 is a narrow Owner-approved exception for Tree Register data only:
  `exampleData=false` is allowed when the runtime is Firebase Production and the
  current Farm is explicitly non-Mock (`isMock=false`). Mock adapters, Emulator,
  and Mock Farms must stay `exampleData=true`. This exception does not authorize
  deployment, Storage/real photos, production QR/tags, PA-2, Controlled Pilot, or
  real data in other modules.
- Run Physical Device/Field Validation after a sufficiently complete Pilot
  Candidate is deployed into an access-controlled Controlled Pilot environment.
  The controlled pilot may use approved, limited real data only after privacy,
  retention, backup, access, evidence, and rollback controls are approved.
- Physical/Field Validation must pass before Production rollout, permanent tag
  production, or operational scale-up. Automated tests and viewport simulation
  never count as physical evidence.
- Phase progression still requires the recorded Owner approval for each Gate.
  Mock-first timing does not authorize skipping Phase gates.
- Work photos sent to non-Mock storage must be re-encoded without EXIF/GPS,
  bounded by the approved dimensions/size, and failures must create Farm/Work-
  scoped retry or orphan records. Mock fallback is never physical-device evidence.
- Work-photo retries must retain the binary and commit draft in a Farm/actor-scoped
  durable queue until the idempotent Work commit succeeds. Never mark a retry
  uploaded from recovery metadata alone. Clear the queue on commit, logout, or
  the approved device-cache expiry.
- Orphan deletion and retention enforcement require a server-side lifecycle
  worker that rechecks references and scope, records disposal audit, and remains
  dry-run until PA-1/PA-2 approve the environment, policy, roles, and key custody.
- Test HEIC/HEIF on the exact Pilot iPhone/OS/browser. If native re-encoding fails,
  fail closed and use an approved JPEG recapture or vetted on-device conversion;
  never upload the metadata-bearing original as a fallback.
- Real photo retention, backup and export require PA-2 approval. Camera/upload,
  metadata removal and interruption recovery must be evidenced on both Android
  and iPhone during the Controlled Pilot before Production readiness is claimed.
- Keep Annual Farm Management Cycle, Crop Cycle, and Planting Cycle distinct.
  Annual Cycle is a Farm-scoped 12-month management boundary; Crop Cycle is a
  production season/batch within it; Planting Cycle is the biological history at
  a permanent position.
- Annual Cycle defaults to June–May, but Owner may set a Farm-specific start date.
  Derive the exclusive end exactly one calendar year later, reject overlapping
  Farm periods, and allow at most one Active/Closing cycle per Farm.
- A Closed Annual Cycle is correction-only. Preserve the original close revision
  and append reason, actor, time, before/after, idempotency and supersession audit.
- Plan at Farm/Zone scope by default. Use Tree Set only for exceptions and never
  copy actual results, evidence, diagnosis or sales outcomes into a new year.
- Under DEC-049, unified weekly, monthly, three-month, and annual management
  reports plus labor/operating-cost entry are approved only for Local/Mock/Firebase
  Emulator development. Treat labor as management cost, not Payroll; treat
  sales minus management cost as Management Margin, not accounting profit.
- Material direct cost must use Inventory ISSUE effective dates without adding
  receipts again. Keep capital assets separate, preserve Unknown/N/A/Estimated,
  and fail closed if any report source record belongs to another Farm.
- DEC-049 does not approve real cost/personnel/customer data, Production cost
  writes or Rules, payroll/accounting/tax, report finalization, scheduler,
  external distribution, deployment, PA-2, Controlled Pilot, or Production.

## Mock data quality

The maintained mock pack should cover at least two isolated Farms, farm-specific
roles, Position/Planting Cycle history, Work/Care/Disease workflows, QR
match/mismatch/unknown/wrong-Farm cases, offline queue states, conflict,
idempotent retry, correction/audit events, and explicit Cross-Farm denial.

Farm Management mock data should additionally keep stable Farm IDs and cover at
least two Active Farms, one Suspended Farm, and one Archived Farm. Farm creation,
profile updates, and status transitions must be auditable and resettable; Farm
hard delete is not an approved development or operational workflow.

Annual Cycle mock data should cover a prior Closed cycle, current Active cycle,
future Draft cycle, a Farm-specific custom start date, Farm/Zone/Tree Set plans,
overlap and duplicate denial, carry-over, closed-cycle correction, and explicit
Cross-Farm/role denial.

Management Reporting mock data should cover at least two isolated Farms, labor
bases, material issue cost, operating categories, a capital item, Sales/Inventory
effective dates, idempotent retry, role denial, CSV injection protection, and
Cross-Farm fail-closed report generation.

Prefer fixture builders or generators with stable IDs and documented scenario
labels over scattered hard-coded examples. Keep mock records free of real people,
phone numbers, topology, coordinates, tree facts, photos, and production URLs.

## Stop conditions

Stop the affected work, preserve evidence, fix, and retest when there is a
Cross-Farm disclosure, wrong-tree completion, duplicate critical event, corrupt
history, secret exposure, or unauthorized use of real data or external resources.
