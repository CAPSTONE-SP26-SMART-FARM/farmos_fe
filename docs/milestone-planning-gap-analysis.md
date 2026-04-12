# Milestone Planning Deep Gap Analysis

This document identifies missing, inconsistent, or risky areas in the Milestone Planning lifecycle: Template -> Milestone Planning -> Production Request Review -> IoT Board Assignment -> Sensor Binding.

Prioritization order is high impact first.

## P0-1. Missing Domain Authorization in IoT Assignment APIs

1. Problem Title

- Missing owner or manager scope validation on IoT assignment read and write operations.

2. Affected Flow Step

- IoT Board Assignment to Milestone.

3. Description

- Role guard checks role only, but service methods do not use caller identity to verify ownership or zone assignment in the milestone scope.
- This creates a cross-farm access risk if a valid role user can reference a foreign milestone ID.

4. Impact

- UX: Users may see unexpected data or receive late-stage failures.
- Data: Unauthorized assignment and unassignment may occur.
- System: Security and compliance risk.

5. Root Cause

- Backend.

6. Suggested Solution

- Add explicit scope checks in service before list, assign, unassign:
  - Manager path: must be assigned to milestone zone.
  - Owner path: must own milestone farm.
- Return 403 consistently for scope violations.
- Add integration tests for foreign milestone IDs.

## P0-2. Sensor Rebind Defect After Unbind

1. Problem Title

- Sensor cannot be rebound to same assignment after unbind.

2. Affected Flow Step

- Sensor Binding to Assignment.

3. Description

- Binding table has unique key assignmentId + sensorId.
- Unbind sets unassignedAt but keeps row.
- Rebind logic uses createMany insert, which conflicts with unique key.

4. Impact

- UX: User sees failed rebind with unclear behavior.
- Data: Intended lifecycle rebind is blocked.
- System: Feature appears broken for real operations.

5. Root Cause

- Both backend data model and backend service logic.

6. Suggested Solution

- Choose one strategy:
  - Strategy A: keep unique key and rebind by updating existing row to unassignedAt null and assignedAt now.
  - Strategy B: change DB uniqueness to partial unique for active rows only and allow historical duplicates.
- Add explicit API response for already existed historical rebinding path.

## P0-3. Non-Atomic Bulk Unbind with Error After Partial Update

1. Problem Title

- Bulk unbind can partially succeed then throw an error.

2. Affected Flow Step

- Sensor Binding to Assignment, bulk unbind.

3. Description

- Service performs updateMany and then compares updated count with requested count.
- If count mismatch, error is thrown even though some records are already changed.

4. Impact

- UX: Error message despite partial success, confusing state.
- Data: Client cache diverges from server truth.
- System: Retrying can produce more mismatches.

5. Root Cause

- Backend transaction and operation semantics.

6. Suggested Solution

- Use transaction with strict pre-check and fail-fast before update.
- Or return 207-style detail payload with per-sensor result.
- Frontend should always hard-refetch bound sensors after unbind error.

## P0-4. Missing Server-Side Template Apply Workflow

1. Problem Title

- Template exists but no server endpoint to apply template to a crop season milestone plan.

2. Affected Flow Step

- Milestone Template usage.

3. Description

- Frontend must map template items to milestone payload locally.
- No backend transactional operation links template selection to milestone creation.

4. Impact

- UX: Increased complexity and inconsistency across clients.
- Data: No canonical audit of which template was applied.
- System: Duplicate client logic and drift over time.

5. Root Cause

- Backend flow connection gap.

6. Suggested Solution

- Add endpoint like POST /production-milestone/{role}/crop-season/:id/apply-template.
- Persist appliedTemplateId and appliedTemplateVersion snapshot in milestone batch metadata.

## P0-5. Milestone Timeline Validation Gap for Batch Add Against Existing Data

1. Problem Title

- Batch milestone add validates payload internally but not against existing milestone timeline chain.

2. Affected Flow Step

- Milestone Creation and Editing.

3. Description

- Current batch validation checks duplicates and sequence within incoming batch.
- It does not ensure new batch rows align with already persisted milestones timeline.

4. Impact

- UX: User succeeds with invalid cross-boundary sequence then future operations fail unexpectedly.
- Data: Broken timeline continuity.
- System: Downstream assignment planning becomes unreliable.

5. Root Cause

- Backend validation coverage gap.

6. Suggested Solution

- Merge existing + incoming rows in service validation before persist.
- Validate order continuity and expected date boundaries across the full set.

## P0-6. No DB Uniqueness for milestoneOrder and stageName per Crop Season

1. Problem Title

- Race condition can produce duplicate milestoneOrder or stageName.

2. Affected Flow Step

- Milestone Creation and Editing.

3. Description

- Service checks duplicates before insert or update.
- Without DB-level unique constraints, concurrent requests can pass checks and write conflicting rows.

4. Impact

- UX: Later updates become ambiguous.
- Data: Integrity violation.
- System: Requires cleanup scripts or manual correction.

5. Root Cause

- Backend schema and concurrency design.

6. Suggested Solution

- Add DB unique indexes:
  - cropSeasonId + milestoneOrder
  - normalized stageName strategy per crop season
- Keep service-level checks for fast feedback.

## P1-1. Undefined Recovery Path After Production Request Rejection

1. Problem Title

- Rejected status has no explicit restart or resubmission transition.

2. Affected Flow Step

- Production Request Review.

3. Description

- After owner rejection, crop season is rejected.
- No clear endpoint to move back to planning or allow re-submit after changes.

4. Impact

- UX: User gets stuck with no next action.
- Data: Valid revisions cannot continue lifecycle.
- System: Manual intervention likely required.

5. Root Cause

- Backend business transition missing.

6. Suggested Solution

- Introduce explicit transition endpoint, for example:
  - PUT /crop-seasons/:id/reopen-planning.
- Add audit reason and actor tracking.

## P1-2. Permission Rule Inconsistency for Manager Across Flow

1. Problem Title

- Manager requirements are inconsistent between crop season and milestone operations.

2. Affected Flow Step

- Milestone Creation and Editing, Production Request Submission.

3. Description

- Crop season create depends on primary manager logic.
- Milestone operations accept manager assigned to zone, not necessarily primary.

4. Impact

- UX: A manager can edit milestones for flows they cannot create.
- Data: Responsibility boundaries become unclear.
- System: Policy confusion and support burden.

5. Root Cause

- Backend rule inconsistency.

6. Suggested Solution

- Define one policy and enforce everywhere:
  - Primary-only for strategic actions, assigned-manager for operational actions.
- Reflect policy in endpoint naming and docs.

## P1-3. Primary Manager Update Path Uses Wrong Scope Identifier

1. Problem Title

- Potential bug: zoneId is used where farmId is required in manager access validation.

2. Affected Flow Step

- Zone manager maintenance, upstream dependency for milestone flow access.

3. Description

- Primary manager update path may reject valid manager because validation receives zoneId as farmId argument.

4. Impact

- UX: Cannot correctly assign primary manager in some cases.
- Data: Wrong operational ownership setup.
- System: Blocks crop-season and milestone lifecycle initiation.

5. Root Cause

- Backend implementation bug.

6. Suggested Solution

- Fix service call argument to pass actual farmId.
- Add unit test for update primary manager with valid manager.

## P1-4. Over-Strict Planning Gate for IoT Assignment Read APIs

1. Problem Title

- Assignment detail read is blocked outside planning status.

2. Affected Flow Step

- IoT Board Assignment to Milestone, Sensor Binding visibility.

3. Description

- Read endpoints depend on planning assertion.
- Users cannot inspect historical or approved-state assignment details.

4. Impact

- UX: Visibility gap for audit and troubleshooting.
- Data: No issue in data integrity, but observability poor.
- System: Support and incident handling degraded.

5. Root Cause

- Backend API design decision too restrictive.

6. Suggested Solution

- Separate write constraints from read constraints.
- Keep assign or unassign planning-only, but allow read across statuses with scope checks.

## P1-5. Assignment History Semantics Are Inconsistent with Upsert Strategy

1. Problem Title

- Reassign same board reuses row and overwrites previous assignment timestamps.

2. Affected Flow Step

- IoT Board Assignment to Milestone.

3. Description

- Data model comment indicates historical tracking using assignedAt and unassignedAt.
- Upsert on milestoneId + iotDeviceId updates same row and can lose prior assignment periods.

4. Impact

- UX: Historical timeline may appear incomplete.
- Data: Audit history partially overwritten.
- System: Weak traceability.

5. Root Cause

- Backend persistence strategy mismatch with intended history model.

6. Suggested Solution

- Use append-only assignment rows with active-row uniqueness via partial index.
- Keep immutable assignment events for audit.

## P1-6. Weak Coupling Between Template Fields and Milestone Runtime Rules

1. Problem Title

- daysBetween template field has no canonical backend application logic.

2. Affected Flow Step

- Milestone Template usage to Milestone Creation.

3. Description

- Template supports daysBetween but milestone payload requires explicit dates.
- Frontend must invent date generation policy.

4. Impact

- UX: Different clients can produce different milestone schedules.
- Data: Inconsistent milestone plans from same template.
- System: Hard to standardize planning outcomes.

5. Root Cause

- Both backend feature gap and frontend compensation requirement.

6. Suggested Solution

- Add backend template-expansion endpoint accepting anchor date rules.
- Return computed milestone payload and validation warnings.

## P2-1. Empty-List-as-Unauthorized Pattern Creates Ambiguity

1. Problem Title

- Some list endpoints return empty data for unauthorized scope instead of explicit forbidden.

2. Affected Flow Step

- Production Request Review and planning list screens.

3. Description

- Client cannot distinguish no records from no access.

4. Impact

- UX: Silent failure and confusing empty states.
- Data: No direct corruption.
- System: Monitoring and incident diagnosis harder.

5. Root Cause

- Backend API response semantics.

6. Suggested Solution

- Return 403 for scope violations and 200 empty only for valid scope with no data.
- Frontend should render separate Empty vs Access Denied states.

## P2-2. Error Contract Variability Increases FE Parser Complexity

1. Problem Title

- Error payloads vary by exception source.

2. Affected Flow Step

- All steps.

3. Description

- Some responses provide errors array with field paths.
- Others provide only message string.
- Zod validation format differs from business validation format.

4. Impact

- UX: Inconsistent inline error placement.
- Data: None directly.
- System: Repeated parsing work and brittle UI logic.

5. Root Cause

- Backend global exception normalization not fully unified.

6. Suggested Solution

- Standardize error envelope:
  - statusCode
  - message
  - code
  - errors array with field and code
- Frontend fallback parser should map all known variants.

## P2-3. Missing Server-Side Milestone Completeness Check Before Submit

1. Problem Title

- Production request submission can proceed without enforcing milestone completeness policy.

2. Affected Flow Step

- Production Request Submission.

3. Description

- Frontend may require milestones before submit, but backend does not strongly enforce this policy.

4. Impact

- UX: Requests with incomplete plans enter owner review.
- Data: Low-quality planning artifacts.
- System: Extra rejection cycles and operational delay.

5. Root Cause

- Backend business-rule gap.

6. Suggested Solution

- Add backend guard on submit:
  - at least one milestone
  - no timeline validation errors
  - optional minimum strategic fields check.

## P2-4. Missing Concurrency Control for Milestone Editing

1. Problem Title

- Last write wins on milestone updates without version conflict detection.

2. Affected Flow Step

- Milestone Creation and Editing.

3. Description

- Two users can edit same milestone simultaneously.
- Later save can silently overwrite prior update.

4. Impact

- UX: User loses changes unexpectedly.
- Data: Non-deterministic edit outcomes.
- System: High support overhead in collaborative usage.

5. Root Cause

- Backend optimistic locking absent, frontend conflict UX absent.

6. Suggested Solution

- Add row version or updatedAt precondition check.
- Return 409 conflict when stale.
- Frontend merge-or-reload conflict dialog.

## P2-5. Flow Continuity Gap After Assignment or Binding Errors

1. Problem Title

- User can be left in uncertain local state after failed assign or bind actions.

2. Affected Flow Step

- IoT Assignment and Sensor Binding.

3. Description

- Some failures can occur after partial server changes or stale state.
- Current flow does not force reconciliation after all classes of errors.

4. Impact

- UX: Misleading UI state and repeated failed attempts.
- Data: Potential cache drift.
- System: Increased API retry noise.

5. Root Cause

- Both backend non-atomic behavior and frontend cache strategy.

6. Suggested Solution

- Adopt mandatory hard refetch policy after any 4xx in assign or bind operations.
- Show Reconciled with latest server state banner.

## P2-6. Missing Bulk Optimization Endpoints for High-Volume Planning

1. Problem Title

- Bulk edit and reorder requires many single-row API calls.

2. Affected Flow Step

- Milestone Creation and Editing.

3. Description

- Current APIs support batch create but not robust batch update or reorder transaction.

4. Impact

- UX: Slow operations for large plans.
- Data: Higher race-condition surface.
- System: Increased request load.

5. Root Cause

- Backend endpoint set incomplete for enterprise-scale planning UX.

6. Suggested Solution

- Add transactional batch update endpoint with item-level result map.
- Include reorder support in one request.

## P2-7. Assignment to Milestone Preconditions Are Hidden Until Late

1. Problem Title

- Users discover missing milestone date prerequisites only during assignment attempt.

2. Affected Flow Step

- IoT Board Assignment to Milestone.

3. Description

- Assignment requires expectedStartDate and expectedEndDate, but this is often not surfaced proactively in UI.

4. Impact

- UX: Preventable errors and broken flow perception.
- Data: No direct risk.
- System: Extra failed API traffic.

5. Root Cause

- Frontend preventive UX gap.

6. Suggested Solution

- Pre-check milestone date readiness on panel load.
- Disable assign action with clear checklist and one-click jump to milestone date edit.

## P3-1. Missing User Guidance for Transition Boundaries

1. Problem Title

- Users are not explicitly guided across planning -> review -> assignment -> binding boundaries.

2. Affected Flow Step

- Entire lifecycle.

3. Description

- Without guided continuity, users can miss prerequisites and sequence.

4. Impact

- UX: Confusion, increased training cost.
- Data: Indirect quality issues.
- System: More support tickets.

5. Root Cause

- Frontend flow orchestration gap.

6. Suggested Solution

- Add milestone workspace progress tracker with explicit prerequisite states.
- Provide contextual call-to-action per status.

## P3-2. No Explicit System Behavior for Template Drift

1. Problem Title

- Applied plans can drift from updated templates with no visibility.

2. Affected Flow Step

- Template Selection and Application.

3. Description

- Template definitions may change after a crop season has used them.
- No stored template snapshot linkage for comparison.

4. Impact

- UX: Hard to explain why later plans differ.
- Data: Audit and governance weakness.
- System: Low reproducibility.

5. Root Cause

- Backend metadata omission.

6. Suggested Solution

- Store appliedTemplateId and appliedTemplateVersion on crop season or milestone batch.
- Show Drift detected indicator in UI if template has changed.

## Recommended Remediation Sequence

1. Security and integrity first

- Fix authorization checks in IoT assignment APIs.
- Fix sensor rebind model and bulk unbind atomicity.
- Add DB uniqueness for milestone order and stage constraints.

2. Flow completion

- Add template apply endpoint and rejected -> planning transition.
- Add batch milestone update or reorder endpoint.

3. Consistency and UX hardening

- Standardize error contract.
- Add optimistic locking for milestone edits.
- Add forced reconciliation strategy in FE after risky errors.

---

Last updated: 2026-04-12
