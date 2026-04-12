# Milestone Planning Frontend Implementation Blueprint

This document converts backend logic into frontend implementation decisions for the end-to-end Milestone Planning lifecycle.

## 1. High-Level Flow Overview

### Scope

1. Milestone Template usage
2. Milestone Creation and Editing
3. Production Request Review
4. IoT Board Assignment to Milestone
5. Sensor Binding to Assignment

### Primary user journey

1. Manager or owner selects a milestone template and applies it into a local milestone draft.
2. Manager or owner creates milestone rows for a crop season while crop season is planning.
3. Manager submits production request to owner.
4. Owner approves or rejects request.
5. While still planning, manager or owner assigns IoT board to milestone.
6. While still planning, manager or owner binds sensors from that assigned board.

### Critical backend constraints to enforce in UI

1. Many milestone operations are planning-only.
2. Milestone order and stage name must be unique per crop season.
3. Milestone timeline consistency must hold across sequence.
4. IoT assignment requires valid milestone expected date range.
5. IoT assignment is board_module only and no overlap in assignment window.
6. Sensor binding only works for sensors on the assigned board.

## 2. Micro-Flows Breakdown

## Micro-Flow A: Template Selection and Application

### Roles involved

1. Manager
2. Owner
3. Admin for template CRUD only

### Entry conditions

1. Crop season detail page is opened.
2. User has role manager or owner.
3. Crop season status is planning if user will apply template to create milestones.

### UI step-by-step

1. User clicks Apply Template on milestone section.
2. Frontend opens template picker modal with search and pagination.
3. User selects one template and previews stage rows.
4. User confirms Apply.
5. Frontend maps template items into milestone draft rows.
6. User reviews and optionally edits rows before submit.

### UI components and interaction pattern

| Step | Components | Interaction Pattern | Feedback |
| --- | --- | --- | --- |
| Open picker | Button, modal, searchable table | Pessimistic load | Skeleton loader in modal |
| Select template | Table row select, side preview panel | Local optimistic selection | Highlight selected template |
| Apply to draft | Confirm dialog | Optimistic local update only, no API yet | Success toast and draft banner |
| Edit mapped rows | Editable grid form | Local state edit | Inline validation per cell |

### Backend interactions

1. GET /manager/template-product-milestone-for-crop-season?page=1&limit=10&search=&type=crop_season
2. GET /owner/template-product-milestone-for-crop-season?page=1&limit=10&search=&type=crop_season
3. GET /manager/template-product-milestone-for-crop-season/:id
4. GET /owner/template-product-milestone-for-crop-season/:id

### Payload shape

```json
{
  "page": 1,
  "limit": 10,
  "search": "rice",
  "type": "crop_season"
}
```

### Success behavior

1. Template list and detail are cached.
2. Milestone draft rows are generated in local state.
3. Submit Milestones action becomes enabled only after local validation passes.

### Failure cases and handling

| Case | Expected backend | Frontend handling |
| --- | --- | --- |
| Template not found or inaccessible | 404 | Close detail panel, show inline empty message |
| Unauthorized role | 403 | Show access denied state, hide Apply action |
| Network failure | 5xx or timeout | Retry CTA in modal |

### Important note

There is no backend endpoint that directly applies template to milestones. Frontend must transform template items and call milestone create endpoints.

## Micro-Flow B: Milestone Creation and Editing

### Roles involved

1. Manager
2. Owner

### Entry conditions

1. Crop season exists.
2. Crop season status is planning for create and delete.
3. Crop season status is planning or approved for update.

### UI step-by-step

1. User opens milestone tab and sees existing milestones list.
2. User creates milestones using batch grid or single-row form.
3. Frontend runs local validation for order, stage name, and date consistency.
4. User submits create.
5. User edits a milestone row.
6. If crop season is approved, frontend allows only actualStartDate, actualEndDate, status fields.
7. User can delete row only when crop season is planning.

### UI components and interaction pattern

| Step | Components | Interaction Pattern | Feedback |
| --- | --- | --- | --- |
| View list | Data table with status badges | Pessimistic fetch | Empty state with Create button |
| Batch create | Editable grid with add row | Pessimistic save | Row-level validation errors |
| Single create | Drawer form | Pessimistic save | Inline errors and submit lock |
| Edit row | Row inline edit or modal | Pessimistic save | Dirty-state indicator |
| Delete row | Confirm modal | Pessimistic delete | Success toast + table refresh |

### Backend interactions

1. GET /production-milestone/manager/crop-season/:cropSeasonId
2. GET /production-milestone/owner/crop-season/:cropSeasonId
3. POST /production-milestone/manager/crop-season/:cropSeasonId
4. POST /production-milestone/owner/crop-season/:cropSeasonId
5. POST /production-milestone/manager/crop-season/:cropSeasonId/item
6. POST /production-milestone/owner/crop-season/:cropSeasonId/item
7. PUT /production-milestone/:milestoneId/manager/crop-season/:cropSeasonId
8. PUT /production-milestone/:milestoneId/owner/crop-season/:cropSeasonId
9. DELETE /production-milestone/:milestoneId/manager/crop-season/:cropSeasonId
10. DELETE /production-milestone/:milestoneId/owner/crop-season/:cropSeasonId

### Request payload shape

```json
{
  "items": [
    {
      "stageName": "Land Preparation",
      "milestoneOrder": 1,
      "expectedStartDate": "2026-05-01",
      "expectedEndDate": "2026-05-07",
      "actualStartDate": null,
      "actualEndDate": null,
      "status": "pending"
    }
  ]
}
```

```json
{
  "stageName": "Sowing",
  "milestoneOrder": 2,
  "expectedStartDate": "2026-05-08",
  "expectedEndDate": "2026-05-10"
}
```

```json
{
  "actualStartDate": "2026-05-08",
  "actualEndDate": null,
  "status": "in_progress"
}
```

### Success behavior

1. Re-fetch milestone list after create, update, delete.
2. Re-fetch crop season detail after milestone status update that may activate crop season.
3. Keep last edited row focused after refresh where possible.

### Failure cases and handling

| Case | Expected backend | Frontend handling |
| --- | --- | --- |
| Duplicate milestoneOrder | 422 with path milestoneOrder | Highlight conflicting row and field |
| Duplicate stageName | 422 with path stageName | Highlight row stageName cell |
| Expected date invalid | 422 with path expectedEndDate | Inline field error |
| Timeline inconsistency | 422 with path expectedStartDate | Show row-level and summary banner |
| Non-planning create/delete | 422 | Disable create/delete and show status lock reason |
| Approved-only operational update violation | 422 | Disable strategic fields in approved status |
| Unauthorized | 403 | Read-only mode fallback |
| Not found | 404 | Redirect to crop season detail with warning |

## Micro-Flow C: Production Request Submission and Review

### Roles involved

1. Manager submits request
2. Owner reviews and replies

### Entry conditions

1. Crop season status is planning for submit.
2. At least minimum milestone plan is present in UI policy.
3. Owner access to crop season for review.

### UI step-by-step

1. Manager clicks Submit for Review.
2. Manager enters optional note and confirms.
3. Frontend calls send request API.
4. UI refreshes crop season status to sent and locks planning edits.
5. Owner opens request queue and request detail.
6. Owner chooses Approve or Reject.
7. Reject requires reason text.
8. Frontend submits reply and refreshes crop season plus request list.

### UI components and interaction pattern

| Step | Components | Interaction Pattern | Feedback |
| --- | --- | --- | --- |
| Submit request | Button + modal with textarea | Pessimistic submit | Blocking loader on confirm button |
| Owner queue | Request table with status chips | Pessimistic list fetch | Empty state card |
| Approve or reject | Action panel with radio + reason textarea | Pessimistic submit | Inline reason required message |

### Backend interactions

1. POST /crop-seasons/:id/send-request
2. GET /crop-seasons/:id/requests
3. GET /production-requests/:id
4. GET /owner/crop-seasons/:id/requests
5. GET /owner/production-requests/:id
6. PUT /owner/production-requests/:id/reply

### Request payload shape

```json
{
  "description": "Ready for owner review"
}
```

```json
{
  "status": "approved",
  "description": "Looks good"
}
```

```json
{
  "status": "rejected",
  "description": "Need timeline correction"
}
```

### Success behavior

1. On submit, crop season status becomes sent and milestone planning actions are disabled.
2. On owner reply approved, crop season becomes approved.
3. On owner reply rejected, crop season becomes rejected.
4. Request detail and request list are invalidated and reloaded.

### Failure cases and handling

| Case | Expected backend | Frontend handling |
| --- | --- | --- |
| Submit from non-planning status | 422 InvalidStatusForUpdate | Disable submit action when status not planning |
| Reject without reason | 422 ReasonRequired | Keep modal open and focus reason field |
| Reply on non-pending request | 422 InvalidStatusTransition | Show stale-data warning and force refresh |
| Not found | 404 | Return to request list with warning |

## Micro-Flow D: IoT Board Assignment to Milestone

### Roles involved

1. Manager
2. Owner

### Entry conditions

1. Milestone exists.
2. Crop season status is planning.
3. Milestone expectedStartDate and expectedEndDate are present and valid.

### UI step-by-step

1. User opens milestone assignment panel.
2. Frontend requests current active assignment.
3. Frontend requests available boards for milestone time window.
4. User selects board and confirms assign.
5. UI refreshes assignment detail and available boards.
6. User can unassign current board.

### UI components and interaction pattern

| Step | Components | Interaction Pattern | Feedback |
| --- | --- | --- | --- |
| Load assignment | Info card + badge | Pessimistic fetch | Skeleton and empty assignment state |
| List boards | Filtered table or select list | Pessimistic fetch | Empty state with reason text |
| Assign board | Confirm modal | Pessimistic submit | Button-level spinner |
| Unassign board | Confirm modal | Pessimistic submit | Success toast + card refresh |

### Backend interactions

1. GET /production-milestone-iot-device/manager/milestone/:milestoneId/assignment
2. GET /production-milestone-iot-device/owner/milestone/:milestoneId/assignment
3. GET /production-milestone-iot-device/manager/milestone/:milestoneId/available?page=1&limit=10&search=
4. GET /production-milestone-iot-device/owner/milestone/:milestoneId/available?page=1&limit=10&search=
5. POST /production-milestone-iot-device/manager/milestone/:milestoneId/assign
6. POST /production-milestone-iot-device/owner/milestone/:milestoneId/assign
7. POST /production-milestone-iot-device/manager/milestone/:milestoneId/unassign
8. POST /production-milestone-iot-device/owner/milestone/:milestoneId/unassign

### Request payload shape

```json
{
  "iotDeviceId": "9ce3d7df-4f9e-4b3a-a1fd-60416f14de9c"
}
```

### Success behavior

1. Assignment card shows assignmentId, iotDeviceId, assignedAt.
2. Available list excludes overlapping assignments.
3. Sensor binding section is enabled after assignment exists.

### Failure cases and handling

| Case | Expected backend | Frontend handling |
| --- | --- | --- |
| Non-board device | 422 IotDeviceAssignBoardOnly | Keep picker open and show inline row error |
| Overlapping assignment window | 422 IotDeviceNotAvailableInTimeRange | Show conflict banner and suggest refresh |
| Missing expected milestone dates | 422 IotDeviceAssignmentInvalidTimeRange | Disable assignment UI until dates fixed |
| Not assigned on unassign | 422 IotDeviceNotAssignedToMilestone | Soft refresh assignment card |
| Crop season not planning | 422 CropSeasonNotPlanningForIotDeviceAssignment | Lock section read-only |

## Micro-Flow E: Sensor Binding to Assignment

### Roles involved

1. Manager
2. Owner

### Entry conditions

1. Active assignment exists.
2. Crop season status is planning.
3. User is owner or valid farm member path for manager flow.

### UI step-by-step

1. User opens sensor binding panel for assignment.
2. Frontend loads current bound sensors.
3. User opens Bind Sensors modal.
4. Frontend displays sensors scoped to assigned board device.
5. User multi-selects sensors and confirms bind.
6. User can multi-select bound sensors and unbind.

### UI components and interaction pattern

| Step | Components | Interaction Pattern | Feedback |
| --- | --- | --- | --- |
| View bindings | Table with sensorType and status | Pessimistic fetch | Empty state with bind CTA |
| Bind sensors | Multi-select modal with checkbox table | Pessimistic submit | Inline errors per sensor when possible |
| Unbind sensors | Bulk action + confirm modal | Pessimistic submit | Partial-operation warning support |

### Backend interactions

1. GET /production-milestone-iot-device-sensor-binding/owner/assignment/:assignmentId
2. GET /production-milestone-iot-device-sensor-binding/manager/assignment/:assignmentId
3. POST /production-milestone-iot-device-sensor-binding/owner/assignment/:assignmentId/bind
4. POST /production-milestone-iot-device-sensor-binding/manager/assignment/:assignmentId/bind
5. POST /production-milestone-iot-device-sensor-binding/owner/assignment/:assignmentId/unbind
6. POST /production-milestone-iot-device-sensor-binding/manager/assignment/:assignmentId/unbind

### Request payload shape

```json
{
  "sensorIds": [
    "f5d1fb1b-7482-447a-bfd3-1f6f4f8282aa",
    "fd77a75a-b22d-4f37-8da6-c03ad51f3360"
  ]
}
```

### Success behavior

1. Bound sensor table refreshes immediately after bind or unbind.
2. Assignment detail card should display bound sensor count.

### Failure cases and handling

| Case | Expected backend | Frontend handling |
| --- | --- | --- |
| Sensor not found | 404 SensorNotFound | Remove invalid IDs from selection and prompt retry |
| Sensor not on assigned board | 422 SensorNotInAssignedIotBoard | Show sensor row error and keep modal open |
| Sensor already bound | 422 SensorAlreadyBoundToAssignment | Mark already-bound items and continue edit |
| Sensor not bound on unbind | 422 SensorNotBoundToAssignment | Force reload bound list and reconcile |
| Not owner or not farm member | 403 | Disable bind actions and show permission text |

## 3. State Machine Mapping

## Crop Season Status to UI Actions

| Crop Season Status | Allowed Actions | Disabled Actions | UI Changes |
| --- | --- | --- | --- |
| planning | Create milestone, edit strategic fields, delete milestone, send request, assign board, bind sensors | None from planning scope | Full edit mode, all action buttons visible |
| sent | View only, request history | Milestone create or delete, strategic edit, send request again, IoT assign or bind | Lock banner Waiting for owner review |
| approved | Update milestone operational fields only | Milestone strategic edit and delete, send request, planning-level template apply | Show Operational mode label and disable strategic controls |
| rejected | View only or restart flow by business decision outside current APIs | Milestone planning operations and IoT binding operations | Show Rejected badge and guidance CTA |
| active | Operational monitoring | Planning actions | Show runtime dashboard emphasis |
| completed | Read-only | All editing and assignment actions | Archive mode UI |
| cancelled | Read-only | All editing and assignment actions | Cancelled lock state |

## Production Request Status to UI Actions

| Request Status | Manager UI | Owner UI | FE Behavior |
| --- | --- | --- | --- |
| pending | View waiting state | Approve or Reject enabled | Highlight actionable request for owner |
| approved | View decision | Read-only | Show approved timestamp and note |
| rejected | View rejection note | Read-only | Show reason and remediation hint |

## Milestone Status to UI Actions

| Milestone Status | Allowed Actions | Disabled Actions | UI Changes |
| --- | --- | --- | --- |
| pending | Edit based on crop season gate, assign board in planning | None beyond crop season gate | Neutral status badge |
| in_progress | Operational updates | Strategic edits in approved mode | Progress emphasis |
| completed | Mostly read-only progression record | Status rollback unless backend supports | Completed visual treatment |

## 4. Data Dependency Graph

### Dependency chain

CropSeason -> Milestone -> Assignment -> SensorBinding

### Enablement rules

1. Template application is enabled when crop season exists and status is planning.
2. Milestone create or edit is enabled based on crop season status gate.
3. Production request submit is enabled only from planning.
4. IoT assignment is enabled only when milestone has valid expected date range and crop season is planning.
5. Sensor binding is enabled only when active assignment exists and crop season is planning.

### Refetch and invalidation strategy

1. After template selection: no server invalidation required, local draft update only.
2. After milestone create or update or delete: invalidate milestone list and crop season detail.
3. After send request: invalidate crop season detail and production request list.
4. After owner reply: invalidate production request detail, request lists, and crop season detail.
5. After IoT assign or unassign: invalidate assignment detail, available boards list, bound sensor list.
6. After sensor bind or unbind: invalidate bound sensor list and assignment detail.

### Suggested query keys

1. cropSeason.detail.{cropSeasonId}
2. milestone.list.{cropSeasonId}
3. productionRequest.list.manager.{cropSeasonId}
4. productionRequest.list.owner.{cropSeasonId}
5. milestone.assignment.{milestoneId}
6. milestone.availableBoards.{milestoneId}.{page}.{search}
7. assignment.boundSensors.{assignmentId}

## 5. Edge Cases and Handling

| Edge Case | Backend Response | Required FE Handling |
| --- | --- | --- |
| Duplicate milestoneOrder | 422 with path milestoneOrder | Mark conflicting row and keep unsaved draft |
| Duplicate stageName case-insensitive | 422 with path stageName | Force normalize lower-case uniqueness client-side before submit |
| Timeline inconsistency across rows | 422 with path expectedStartDate | Show row-level error and summary banner with scroll-to-row |
| expectedStartDate >= expectedEndDate | 422 with path expectedEndDate | Inline date validation before API call |
| actualStartDate >= actualEndDate | 422 with path actualEndDate | Block submit and highlight actual date fields |
| Crop season status changed by another user | 422 invalid status or 404 depending path | Show stale data modal and auto-refetch all related queries |
| Assign board with overlapping time | 422 IotDeviceNotAvailableInTimeRange | Keep selection open, prompt reload available boards |
| Assign non-board device | 422 IotDeviceAssignBoardOnly | Hide non-board options and hard-filter device type |
| Bind sensor from another device | 422 SensorNotInAssignedIotBoard | Restrict candidate list to assignment device sensors only |
| Bind already bound sensor | 422 SensorAlreadyBoundToAssignment | Mark item Already bound and allow user to continue selection |
| Unbind batch includes unbound sensors | 422 SensorNotBoundToAssignment after partial update risk | Force immediate refetch and show reconciliation notice |
| Batch milestone submission race condition | 422 validation or conflict path | Preserve draft and offer Retry after refresh |
| Missing token | 401 | Redirect to auth flow and preserve return URL |
| Role mismatch | 403 | Render access denied view and hide action controls |

### Partial failure policy

1. Treat every bulk action as potentially non-atomic from FE perspective.
2. After any 422 on bulk unbind, always trigger hard refetch of bound sensor list.
3. Show Completed with conflicts pattern if local result cannot be trusted.

## 6. API Contract Summary

## Common response envelopes

### Success envelope

```json
{
  "statusCode": 200,
  "message": "...",
  "data": {}
}
```

### Validation or business error envelope

```json
{
  "statusCode": 422,
  "message": "...",
  "errors": [
    {
      "field": "items.0.milestoneOrder",
      "message": "Error.ProductionMilestoneOrderConflict"
    }
  ]
}
```

### Forbidden and not found envelope

```json
{
  "statusCode": 403,
  "message": "Error.NotFarmOwner"
}
```

```json
{
  "statusCode": 404,
  "message": "Error.ProductionMilestoneNotFound"
}
```

## Endpoint contract table

| Domain Step | Endpoint | Method | Simplified Request |
| --- | --- | --- | --- |
| Template list manager | /manager/template-product-milestone-for-crop-season?page&limit&search&type | GET | query only |
| Template detail manager | /manager/template-product-milestone-for-crop-season/:id | GET | none |
| Template list owner | /owner/template-product-milestone-for-crop-season?page&limit&search&type | GET | query only |
| Template detail owner | /owner/template-product-milestone-for-crop-season/:id | GET | none |
| Milestone create batch manager | /production-milestone/manager/crop-season/:cropSeasonId | POST | { items: [...] } |
| Milestone create batch owner | /production-milestone/owner/crop-season/:cropSeasonId | POST | { items: [...] } |
| Milestone create single manager | /production-milestone/manager/crop-season/:cropSeasonId/item | POST | { stageName, milestoneOrder, ... } |
| Milestone update manager | /production-milestone/:milestoneId/manager/crop-season/:cropSeasonId | PUT | editable fields by status |
| Milestone delete manager | /production-milestone/:milestoneId/manager/crop-season/:cropSeasonId | DELETE | none |
| Send production request | /crop-seasons/:id/send-request | POST | { description } |
| Owner reply request | /owner/production-requests/:id/reply | PUT | { status, description } |
| Available boards manager | /production-milestone-iot-device/manager/milestone/:milestoneId/available?page&limit&search | GET | query only |
| Assign board manager | /production-milestone-iot-device/manager/milestone/:milestoneId/assign | POST | { iotDeviceId } |
| Unassign board manager | /production-milestone-iot-device/manager/milestone/:milestoneId/unassign | POST | { iotDeviceId } |
| Bind sensors manager | /production-milestone-iot-device-sensor-binding/manager/assignment/:assignmentId/bind | POST | { sensorIds: [] } |
| Unbind sensors manager | /production-milestone-iot-device-sensor-binding/manager/assignment/:assignmentId/unbind | POST | { sensorIds: [] } |

## 7. UX Recommendations

## Primary UX architecture

1. Use guided wizard shell with free navigation tabs.
2. Keep each step independently saveable and resumable.
3. Show Status Lock Banner at top of milestone workspace.

## Interaction recommendations

1. Use pessimistic network updates for create, update, delete, assign, bind, submit, and reply.
2. Use optimistic local updates only for pre-submit draft editing and template application.
3. Use row-level inline errors for milestone batch grid.
4. Use toast for non-field success and inline for field or row errors.
5. Use disable with reason tooltip for status-gated actions.

## Advanced UX improvements

1. Drag and drop reorder in milestone grid with local optimistic reindex and submit as batch update payload.
2. Smart filters for available boards by status and lastSeenAt if exposed.
3. Smart filters for sensors by sensorType and health status.
4. Bulk edit mode for milestone dates and status with preview diff before submit.
5. Side-by-side compare of template rows versus current milestone rows before apply.

## Preventive validation pack

1. Enforce unique stageName and milestoneOrder in client before submit.
2. Enforce date consistency per row and across row sequence.
3. Enforce reject reason required for owner reject action.
4. Hide or disable IoT and sensor actions unless planning and prerequisites are met.

## Frontend development phase plan

| Phase | Goal | Deliverables |
| --- | --- | --- |
| Phase 1 | Foundations | Role guards, status badges, centralized API client, unified error parser |
| Phase 2 | Template and milestone planning | Template picker, milestone batch grid, create and edit and delete integration |
| Phase 3 | Review workflow | Submit request, owner queue, approve and reject flow, status lock behaviors |
| Phase 4 | IoT assignment | Assignment panel, available board list, assign and unassign flow |
| Phase 5 | Sensor binding | Sensor multi-select bind and unbind, reconciliation after partial failures |
| Phase 6 | Hardening | Concurrency handling, stale-state recovery, e2e tests for edge cases |

---

Last updated: 2026-04-12
