# Module 5 — Plan vs Actual Tracking: Frontend Integration Guide

> **Last updated:** 2026-05-03 v2 — QA pass against actual BE source (tracking.model.ts, \*.error.ts). Corrected schema bugs, error code keys, missing fields, and added common component reuse catalog. **Audience:** Frontend developers building Module 5 integration.

---

## Table of Contents

1. [Backend State Summary (as-of 2026-05-01)](#1-backend-state-summary)
2. [Frontend State Audit (as-of 2026-05-03)](#2-frontend-state-audit)
3. [Gap Analysis — What FE Must Build](#3-gap-analysis)
4. [API Contract Reference](#4-api-contract-reference)
5. [Schema Validation (Zod)](#5-schema-validation-zod)
6. [Service Layer (`trackingService.ts`)](#6-service-layer)
7. [React Query Hooks](#7-react-query-hooks)
8. [Endpoint Constants & Query Keys](#8-endpoint-constants--query-keys)
9. [Reusable Common Components](#9-reusable-common-components)
10. [UI Component Build Plan](#10-ui-component-build-plan)
11. [Field Locking UX — 3-Layer Policy in FE](#11-field-locking-ux)
12. [Plan vs Actual Diff Page Layout](#12-plan-vs-actual-diff-page-layout)
13. [Error Handling & 422 Messages](#13-error-handling--422-messages)
14. [Build Sequence (Recommended)](#14-build-sequence)

---

## 1. Backend State Summary

> **All PR1, PR2, PR3 merged and passing 78/78 test cases as of 2026-05-01.**

### 1.1 Merged — Ready for FE integration

| PR | What it delivers | FE impact |
| --- | --- | --- |
| **PR1** | `TrackingService` + `TrackingRepository` + `tracking.whitelist.ts` const map + global `TrackingClsInterceptor` | No FE impact — infra only |
| **PR2** | 3-layer field policy enforced in all 5 services (`CropSeason`, `ProductionMilestone`, `EmployeeTask`, `HarvestRecord`, `IotDeviceAssignment`) | **FE forms must respect locks** — PATCH with plan-only fields after approve → 422 `LockedPlanField` / `TaskPlanFieldLocked` / `OperationalFieldsOnly` |
| **PR3** | `replyProductionRequestTx` now sets `approvedAt`/`approvedByRequestId` + creates `ProductionRequestSnapshot` + `TrackingPlanSnapshot[]` atomically | Approve flow now auto-snapshots. FE does NOT trigger snapshots manually |

### 1.2 Tracking Endpoints — ALL BUILT (tracking.controller.ts)

| Endpoint ID | Method + Path | Auth | Status |
| --- | --- | --- | --- |
| B1 | `GET /crop-seasons/:id/tracking/available-fields` | owner, manager | ✅ Built |
| B2 | `PUT /crop-seasons/:id/tracking/configs` | manager only | ✅ Built |
| B3 | `GET /crop-seasons/:id/tracking/configs` | owner, manager | ✅ Built |
| B5 | `GET /crop-seasons/:id/production-requests/:requestId/snapshot` | owner, manager | ✅ Built |
| B6 | `GET /crop-seasons/:id/production-requests/diff?from=&to=` | owner, manager | ✅ Built |
| B7 | `GET /crop-seasons/:id/tracking/diff` | owner, manager | ✅ Built |
| B8 | `GET /crop-seasons/:id/tracking-log` | owner, manager | ✅ Built + 24/24 tests pass |
| B9 | `GET /crop-seasons/:id/tracking/field-history` | owner, manager | ✅ Built |
| B10 | `POST /admin/crop-seasons/:id/tracking/snapshots/rebuild` | admin | ✅ Built |

### 1.3 Whitelist — Trackable fields (from `tracking.whitelist.ts`)

```
crop_season:              cropName (plan_only), variety (plan_only), expectedHarvestDate (plan_only),
                          actualHarvestDate (operational), notes (operational), status (operational)

production_milestone:     stageName (plan_only), milestoneOrder (plan_only),
                          expectedStartDate (plan_only), expectedEndDate (plan_only),
                          actualStartDate (operational), actualEndDate (operational), status (operational)

employee_task:            title (plan_only), description (plan_only), priority (plan_only),
                          assignedTo (operational), assignedDate (operational), status (operational),
                          completedAt (operational), startDate (operational)

harvest_record:           harvestDate (operational), quantity (operational), unit (operational),
                          qualityGrade (operational), notes (operational)

iot_device_assignment:    iotDeviceId (operational), assignedAt (operational),
                          unassignedAt (operational), sensorBinding (operational)
```

### 1.4 Critical BE Errors FE Must Handle

> ⚠️ The FE `error-message.ts` normalizes keys via `message.trim().toLowerCase()`. The BE throws error messages in `Error.PascalCase` format — they normalize to `"error.pascalcase"`. Map keys MUST follow this convention.

| Error constant (BE) | Normalized key for `BACKEND_ERROR_MAP` | HTTP | Trigger |
| --- | --- | --- | --- |
| `Error.CropSeasonLockedPlanField` | `"error.cropseasonlockedplanfield"` | 422 | PATCH crop-season plan-only field after approve |
| `Error.CropSeasonOperationalUpdateNotAllowed` | `"error.cropseasonoperationalupdatenotallowed"` | 422 | PATCH crop-season operational field when season is still `planning` |
| `Error.ProductionMilestoneUpdateOperationalFieldsOnly` | `"error.productionmilestoneupdateoperationalfieldsonly"` | 422 | PATCH milestone plan-only field after approve |
| `Error.MilestoneActualDateRequiresActiveSeason` | `"error.milestoneactualdaterequiresactiveseason"` | 422 | PATCH `actualStartDate`/`actualEndDate` when season is `approved` but not yet `active` |
| `Error.TaskPlanFieldLocked` | `"error.taskplanfieldlocked"` | 422 | PATCH task `title`/`description`/`priority` (baseline task) after approve |
| `Error.TaskAssigneeLocked` | `"error.taskassignee locked"` | 422 | PATCH `assignedTo` of task with status `completed`/`verified`/`cancelled` |
| `Error.TrackingConfigLocked` | `"error.trackingconfiglocked"` | 422 | PUT tracking/configs when season status ≠ `planning` |
| `Error.TrackingFieldNotWhitelisted` | `"error.trackingfieldnotwhitelisted"` | 422 | PUT tracking/configs with a field not in the whitelist |
| `Error.TrackingForbidden` | `"error.trackingforbidden"` | 403 | Access tracking data of a crop season the user doesn't belong to |

---

## 2. Frontend State Audit

> **Current FE tracking coverage: 0%**

### 2.1 What exists today

| File | Location | Module 5 relevance |
| --- | --- | --- |
| `ManagerCropSeasonsPage.tsx` | `pages/ManagerPage/CropSeasons/` | Has create/update/send-request — **no tracking panel** |
| `OwnerCropSeasonsPage.tsx` | `pages/OwnerPage/CropSeasons/` | Has list/detail/reply-request — **no Plan vs Actual tab** |
| `cropSeasonService.ts` | `services/` | Has CRUD + send/reply request — **no tracking methods** |
| `useCropSeason.ts` | `queries/` | Has basic queries/mutations — **no tracking hooks** |
| `endpoints.ts` | `constants/` | Has `CROP_SEASON` endpoints — **no `TRACKING` section** |
| `types/cropSeason.ts` | `types/` | Has `CropSeasonSchema` — **no tracking types** |

### 2.2 What is MISSING (must build from scratch)

| Category | Files to create | Priority |
| --- | --- | --- |
| **Infra** | `services/trackingService.ts` | P0 |
| **Infra** | `queries/useTracking.ts` | P0 |
| **Infra** | `schemaValidatation/tracking.ts` | P0 |
| **Infra** | Add `TRACKING` to `constants/endpoints.ts` | P0 |
| **Infra** | Add `tracking` to `QUERY_KEYS` in `constants/endpoints.ts` | P0 |
| **Manager** | Tracking field selection panel in CropSeason create/edit form (F1) | P1 |
| **Manager** | CropSeason detail: unlock operational fields + lock plan-only after approve (F2) | P1 |
| **Manager** | Task form: baseline vs ad-hoc differentiation (F4) | P1 |
| **Manager** | Tracking field toggle panel after approve (F5) | P2 |
| **Manager** | IoT swap modal (F3) | P2 |
| **Owner** | Plan vs Actual diff page (F6) | P1 |
| **Owner** | IoT device log page (F7) | P3 |

### 2.3 Field locking gaps in existing forms

The current `ManagerCropSeasonsPage.tsx` uses a single `UpdateCropSeasonBodySchema` for all updates regardless of season status. After PR2, the backend will return 422 errors if plan-only fields are sent when `status ∈ {approved, active}`. The FE currently has **no guards and no split between plan-only / operational fields** in any edit form.

**Known pre-existing bug**: `plantDate` is in `UpdateCropSeasonBodySchema` but is not a DB column — backend will 500 if sent. Do NOT include `plantDate` in update payloads.

---

## 3. Gap Analysis

### 3.1 FE items to build (prioritized)

| # | Item | Type | Blocked by | Effort |
| --- | --- | --- | --- | --- |
| **F-INF-1** | Add `TRACKING` endpoints to `constants/endpoints.ts` | Config | Nothing | S |
| **F-INF-2** | Add `tracking` keys to `QUERY_KEYS` | Config | Nothing | S |
| **F-INF-3** | Create `schemaValidatation/tracking.ts` — all Zod schemas | Schema | Nothing | M |
| **F-INF-4** | Create `services/trackingService.ts` | Service | F-INF-1, F-INF-3 | M |
| **F-INF-5** | Create `queries/useTracking.ts` | Hooks | F-INF-4 | M |
| **F1** | Manager: Tracking field panel (checkbox tree) in CropSeason create step | Page extend | F-INF-5 | M |
| **F2** | Manager: Split edit form plan-only vs operational per season status | Page extend | F-INF-5 | M |
| **F3** | Manager: IoT swap modal + swapReason input | New modal | — | M |
| **F4** | Manager: Ad-hoc task creation (auto createdInPlan=false) | Form extend | — | S |
| **F5** | Manager: Tracking field toggle panel (post-approve) | New panel | F-INF-5 | S |
| **F6** | Owner: Plan vs Actual page — diff table + timeline | New page | F-INF-5 | L |
| **F7** | Owner: IoT device logs | New page | F-INF-5 | S |

---

## 4. API Contract Reference

### 4.1 `GET /crop-seasons/:id/tracking/available-fields`

Returns the whitelist of fields that can be tracked, grouped by entity type.

```json
{
  "data": [
    {
      "entityType": "crop_season",
      "fields": [
        {
          "fieldName": "expectedHarvestDate",
          "dataType": "date",
          "layer": "plan_only"
        },
        {
          "fieldName": "actualHarvestDate",
          "dataType": "date",
          "layer": "operational"
        },
        { "fieldName": "notes", "dataType": "string", "layer": "operational" },
        { "fieldName": "status", "dataType": "enum", "layer": "operational" }
      ]
    },
    {
      "entityType": "production_milestone",
      "fields": [
        {
          "fieldName": "expectedEndDate",
          "dataType": "date",
          "layer": "plan_only"
        },
        {
          "fieldName": "actualStartDate",
          "dataType": "date",
          "layer": "operational"
        },
        {
          "fieldName": "actualEndDate",
          "dataType": "date",
          "layer": "operational"
        },
        { "fieldName": "status", "dataType": "enum", "layer": "operational" }
      ]
    }
  ]
}
```

**FE use:** Render this as a grouped checkbox tree in the tracking field selection panel. Group by `entityType`, show `fieldName` as label. `layer` drives UI hint: `plan_only` → "Kế hoạch" badge, `operational` → "Thực tế" badge.

### 4.2 `PUT /crop-seasons/:id/tracking/configs` (Manager only, status=planning)

Replace-all (idempotent). Send the full desired active config list.

```json
{
  "configs": [
    {
      "entityType": "crop_season",
      "entityId": null,
      "fieldName": "expectedHarvestDate"
    },
    {
      "entityType": "production_milestone",
      "entityId": null,
      "fieldName": "actualEndDate"
    },
    { "entityType": "employee_task", "entityId": null, "fieldName": "status" }
  ]
}
```

- `entityId: null` = per-class (applies to all entities of that type in this crop season). **Use null for most cases during planning.**
- Only allowed when `season.status === "planning"` — otherwise 422 `TrackingConfigLocked`.
- Response: full list of `TrackingFieldConfig[]` (including soft-disabled previous entries).

### 4.3 `GET /crop-seasons/:id/tracking/configs`

Read back the current tracking config. Includes both active and soft-disabled rows.

```json
{
  "data": [
    {
      "id": "uuid",
      "entityType": "crop_season",
      "entityId": null,
      "fieldName": "expectedHarvestDate",
      "dataType": "date",
      "isActive": true,
      "createdBy": "uuid",
      "createdAt": "2026-04-20T10:00:00Z",
      "updatedAt": "2026-04-20T10:00:00Z"
    }
  ]
}
```

### 4.4 `GET /crop-seasons/:id/tracking/diff` (Plan vs Actual — main endpoint)

Returns the full plan vs actual comparison. This is the **primary data source for F6**.

> ⚠️ **QA note:** `TrackedEntityDiffSchema` and `UnplannedEntitySchema` in BE (`tracking.model.ts`) do NOT include an `entityLabel` field. Only `entityId` is returned for each entity — the FE must resolve entity names separately (e.g. join from an already-loaded milestone/task list). Do NOT expect entity names from this endpoint.

```json
{
  "cropSeason": { "id": "uuid", "cropName": "Rice ST25" },
  "tracked": [
    {
      "entityType": "production_milestone",
      "entities": [
        {
          "entityId": "uuid",
          "fields": [
            {
              "fieldName": "actualEndDate",
              "dataType": "date",
              "planValue": "2026-05-10T00:00:00.000Z",
              "actualValue": "2026-05-13T00:00:00.000Z",
              "variance": { "type": "days", "value": 3, "direction": "late" },
              "changeCount": 2,
              "lastChangedAt": "2026-05-12T08:00:00.000Z"
            },
            {
              "fieldName": "status",
              "dataType": "enum",
              "planValue": "pending",
              "actualValue": "in_progress",
              "variance": {
                "type": "label",
                "value": null,
                "direction": "equal"
              },
              "changeCount": 1,
              "lastChangedAt": "2026-05-01T08:00:00.000Z"
            }
          ]
        }
      ]
    }
  ],
  "unplanned": [
    {
      "entityType": "employee_task",
      "entities": [
        {
          "entityId": "uuid",
          "createdAt": "2026-06-02T07:00:00.000Z",
          "fields": [
            {
              "fieldName": "status",
              "dataType": "enum",
              "actualValue": "completed"
            }
          ]
        }
      ]
    }
  ]
}
```

**Variance types and directions (from actual BE `TrackedFieldDiffSchema`):**

- `type`: `"days"` | `"absolute"` | `"percent"` | `"label"` | `"changed"` | `"none"`
- `direction`: `"early"` | `"on-time"` | `"late"` | `"lower"` | `"higher"` | `"equal"` (optional, not nullable)

**FE notes:**

- `tracked` section → entities that existed at plan time. Show `planValue` ↔ `actualValue` diff.
- `unplanned` section → entities created after approve (no baseline). Flag with "Phát sinh sau kế hoạch" badge.
- `variance.direction === "late"` or `"higher"` → red. `"early"` or `"lower"` → green. `"on-time"` or `"equal"` → neutral.
- `changeCount` → show as "(thay đổi N lần)".
- Entity names: join against already-loaded milestone/task data by `entityId`.

### 4.5 `GET /crop-seasons/:id/tracking-log`

Paginated timeline of all field changes. Query params: `entityType?`, `entityId?`, `fieldName?`, `from?`, `to?`, `page`, `limit`.

```json
{
  "data": [
    {
      "id": "uuid",
      "entityType": "employee_task",
      "entityId": "uuid",
      "fieldName": "status",
      "dataType": "enum",
      "changeType": "update",
      "oldValueJson": "in_progress",
      "newValueJson": "completed",
      "changedBy": "uuid",
      "changedAt": "2026-05-01T10:23:11Z",
      "source": "manual",
      "requestId": "uuid"
    }
  ],
  "meta": { "page": 1, "limit": 20, "totalItems": 241 }
}
```

### 4.6 `GET /crop-seasons/:id/tracking/field-history`

Full change history for one specific field. Returns a **paginated list** with the same meta structure as the tracking log.

Query params: `entityType` (required), `entityId` (required UUID), `fieldName` (required), `page` (default 1), `limit` (default 50, max 200).

Response shape: same as `TrackingLogListResSchema` — `{ data: TrackingLogItem[], meta: { page, limit, totalItems, totalPages } }`.

### 4.7 `GET /crop-seasons/:id/production-requests/:requestId/snapshot`

Returns the immutable `payloadJson` captured at approve time.

```json
{
  "productionRequestId": "uuid",
  "cropSeasonId": "uuid",
  "capturedAt": "2026-04-20T08:30:00Z",
  "capturedBy": { "id": "uuid", "name": "Tran Thi Owner" },
  "payloadHash": "sha256hex...",
  "payload": {
    "version": 1,
    "cropSeason": { "id": "...", "cropName": "Rice", ... },
    "milestones": [ { "id": "...", "stageName": "Sowing", "tasks": [...], ... } ]
  }
}
```

---

## 5. Schema Validation (Zod)

> **QA verified against `farm_os_be/src/modules/tracking/tracking.model.ts`** — schemas below match the actual BE source.

Create `src/schemaValidatation/tracking.ts`:

```ts
import { z } from "zod";

// ── Enums ─────────────────────────────────────────────────────────────────
// Mirror of Prisma-generated enums. Use string literals (not nativeEnum)
// so FE doesn't need to import the generated Prisma client.

export const TrackingEntityTypeSchema = z.enum([
  "crop_season",
  "production_milestone",
  "employee_task",
  "harvest_record",
  "iot_device_assignment",
]);
export type TrackingEntityType = z.infer<typeof TrackingEntityTypeSchema>;

// Matches TrackingDataType prisma enum
export const TrackingDataTypeSchema = z.enum([
  "string",
  "int",
  "decimal",
  "boolean",
  "date",
  "datetime",
  "enum",
  "uuid",
]);
export type TrackingDataType = z.infer<typeof TrackingDataTypeSchema>;

// Matches TrackingChangeType prisma enum
export const TrackingChangeTypeSchema = z.enum([
  "snapshot",
  "create",
  "update",
  "delete",
]);

export const TrackingFieldLayerSchema = z.enum([
  "plan_only",
  "operational",
  "unplanned",
]);
export type TrackingFieldLayer = z.infer<typeof TrackingFieldLayerSchema>;

// ── Available Fields (B1) ─────────────────────────────────────────────────

export const AvailableFieldSchema = z.object({
  fieldName: z.string(),
  dataType: TrackingDataTypeSchema,
  layer: TrackingFieldLayerSchema,
});

export const AvailableFieldGroupSchema = z.object({
  entityType: TrackingEntityTypeSchema,
  fields: z.array(AvailableFieldSchema),
});

export const AvailableFieldsResSchema = z.object({
  data: z.array(AvailableFieldGroupSchema),
});
export type AvailableFieldsResType = z.infer<typeof AvailableFieldsResSchema>;

// ── Config (B2/B3) ────────────────────────────────────────────────────────

export const TrackingConfigItemSchema = z.object({
  id: z.string().uuid(),
  entityType: TrackingEntityTypeSchema,
  entityId: z.string().uuid().nullable(),
  fieldName: z.string(),
  dataType: TrackingDataTypeSchema,
  isActive: z.boolean(),
  createdBy: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type TrackingConfigItemType = z.infer<typeof TrackingConfigItemSchema>;

export const TrackingConfigListResSchema = z.object({
  data: z.array(TrackingConfigItemSchema),
});
export type TrackingConfigListResType = z.infer<
  typeof TrackingConfigListResSchema
>;

export const PutTrackingConfigsBodySchema = z.object({
  configs: z.array(
    z.object({
      entityType: TrackingEntityTypeSchema,
      entityId: z.string().uuid().nullable().optional(),
      fieldName: z.string(),
    }),
  ),
});
export type PutTrackingConfigsBodyType = z.infer<
  typeof PutTrackingConfigsBodySchema
>;

// ── Tracking Log Item — shared base schema ────────────────────────────────
// NOTE: BE TrackingLogItemSchema includes cropSeasonId — include it here.

export const TrackingLogItemSchema = z.object({
  id: z.string().uuid(),
  cropSeasonId: z.string().uuid(), // ← included in BE response
  entityType: TrackingEntityTypeSchema,
  entityId: z.string().uuid(),
  fieldName: z.string(),
  dataType: TrackingDataTypeSchema,
  changeType: TrackingChangeTypeSchema,
  oldValueJson: z.unknown().nullable(),
  newValueJson: z.unknown().nullable(),
  changedBy: z.string().uuid().nullable(),
  changedAt: z.string(),
  source: z.string().nullable(),
  requestId: z.string().nullable(),
});
export type TrackingLogItemType = z.infer<typeof TrackingLogItemSchema>;

// Shared paginated meta (tracking-log and field-history both use this)
const TrackingMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  totalItems: z.number(),
  totalPages: z.number(),
});

// ── Tracking Log (B8) ─────────────────────────────────────────────────────

export const TrackingLogQuerySchema = z.object({
  entityType: TrackingEntityTypeSchema.optional(),
  entityId: z.string().uuid().optional(),
  fieldName: z.string().optional(),
  // from/to must be full ISO datetime strings (BE uses z.string().datetime())
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(200).default(50), // ← BE default is 50
});
export type TrackingLogQueryType = z.infer<typeof TrackingLogQuerySchema>;

export const TrackingLogListResSchema = z.object({
  data: z.array(TrackingLogItemSchema),
  meta: TrackingMetaSchema,
});
export type TrackingLogListResType = z.infer<typeof TrackingLogListResSchema>;

// ── Plan vs Actual Diff (B7) ──────────────────────────────────────────────
// QA: Verified against BE TrackedFieldDiffSchema in tracking.model.ts

const VarianceSchema = z
  .object({
    // "days" | "absolute" | "percent" | "label" | "changed" | "none"
    type: z.enum(["days", "absolute", "percent", "label", "changed", "none"]),
    // BE uses z.unknown().optional() — value can be number, string, or absent
    value: z.unknown().optional(),
    // "early" | "on-time" | "late" | "lower" | "higher" | "equal" (optional, not nullable)
    direction: z
      .enum(["early", "on-time", "late", "lower", "higher", "equal"])
      .optional(),
  })
  .nullable();

// QA: BE TrackedEntityDiffSchema has ONLY entityId + fields — NO entityLabel
const DiffFieldSchema = z.object({
  fieldName: z.string(),
  dataType: TrackingDataTypeSchema,
  planValue: z.unknown().nullable(),
  actualValue: z.unknown().nullable(),
  variance: VarianceSchema,
  changeCount: z.number().int().nonnegative(),
  lastChangedAt: z.string().nullable(),
});

const TrackedEntitySchema = z.object({
  entityId: z.string().uuid(),
  // NOTE: No entityLabel from BE — resolve entity name via entityId from other loaded data
  fields: z.array(DiffFieldSchema),
});

const TrackedSectionSchema = z.object({
  entityType: TrackingEntityTypeSchema,
  entities: z.array(TrackedEntitySchema),
});

// QA: BE UnplannedEntitySchema has ONLY entityId + createdAt + fields — NO entityLabel
const UnplannedFieldSchema = z.object({
  fieldName: z.string(),
  dataType: TrackingDataTypeSchema,
  actualValue: z.unknown().nullable(),
});

const UnplannedEntitySchema = z.object({
  entityId: z.string().uuid(),
  // NOTE: No entityLabel from BE
  createdAt: z.string().nullable(),
  fields: z.array(UnplannedFieldSchema),
});

const UnplannedSectionSchema = z.object({
  entityType: TrackingEntityTypeSchema,
  entities: z.array(UnplannedEntitySchema),
});

export const TrackingDiffResSchema = z.object({
  cropSeason: z.object({
    id: z.string().uuid(),
    cropName: z.string().nullable(),
  }),
  tracked: z.array(TrackedSectionSchema),
  unplanned: z.array(UnplannedSectionSchema),
});
export type TrackingDiffResType = z.infer<typeof TrackingDiffResSchema>;

// ── Production Request Snapshot (B5) ─────────────────────────────────────

export const ProductionRequestSnapshotResSchema = z.object({
  productionRequestId: z.string().uuid(),
  cropSeasonId: z.string().uuid(),
  capturedAt: z.string(),
  capturedBy: z.object({ id: z.string().uuid(), name: z.string().nullable() }),
  payloadHash: z.string(),
  payload: z.unknown(),
});
export type ProductionRequestSnapshotResType = z.infer<
  typeof ProductionRequestSnapshotResSchema
>;

// ── Production Request Diff (B6) ─────────────────────────────────────────

export const ProductionRequestDiffQuerySchema = z.object({
  from: z.string().uuid(), // ← both are required UUIDs (production request IDs)
  to: z.string().uuid(),
});
export type ProductionRequestDiffQueryType = z.infer<
  typeof ProductionRequestDiffQuerySchema
>;

export const PrDiffChangeSchema = z.object({
  path: z.string(),
  op: z.enum(["modified", "added", "removed"]),
  before: z.unknown().optional(),
  after: z.unknown().optional(),
  value: z.unknown().optional(),
});

export const ProductionRequestDiffResSchema = z.object({
  from: z.object({ requestId: z.string().uuid(), capturedAt: z.string() }),
  to: z.object({ requestId: z.string().uuid(), capturedAt: z.string() }),
  changes: z.array(PrDiffChangeSchema),
});
export type ProductionRequestDiffResType = z.infer<
  typeof ProductionRequestDiffResSchema
>;

// ── Field History (B9) — paginated, same shape as TrackingLog ────────────
// QA: BE FieldHistoryQuerySchema includes page + limit (both missing from v1 doc)

export const FieldHistoryQuerySchema = z.object({
  entityType: TrackingEntityTypeSchema,
  entityId: z.string().uuid(),
  fieldName: z.string(),
  page: z.coerce.number().int().min(1).default(1), // ← required — BE default 1
  limit: z.coerce.number().int().min(1).max(200).default(50), // ← required — BE default 50
});
export type FieldHistoryQueryType = z.infer<typeof FieldHistoryQuerySchema>;

// Response is identical to TrackingLogListRes
export const FieldHistoryResSchema = z.object({
  data: z.array(TrackingLogItemSchema),
  meta: TrackingMetaSchema,
});
export type FieldHistoryResType = z.infer<typeof FieldHistoryResSchema>;
```

---

## 6. Service Layer

Create `src/services/trackingService.ts`:

```ts
import { api } from "@/lib/axios";
import { API_ENDPOINTS } from "@/constants/endpoints";
import queryString from "query-string";
import type {
  AvailableFieldsResType,
  TrackingConfigListResType,
  PutTrackingConfigsBodyType,
  TrackingLogListResType,
  TrackingLogQueryType,
  TrackingDiffResType,
  ProductionRequestSnapshotResType,
  ProductionRequestDiffResType,
  ProductionRequestDiffQueryType,
  FieldHistoryQueryType,
  FieldHistoryResType,
} from "@/schemaValidatation/tracking";

const EP = API_ENDPOINTS.TRACKING;

export const trackingService = {
  // B1 — Available trackable fields (for checkbox tree in config panel)
  getAvailableFields: (cropSeasonId: string) =>
    api.get<AvailableFieldsResType>(EP.AVAILABLE_FIELDS(cropSeasonId)),

  // B2 — Replace tracking configs (Manager only, season=planning)
  replaceConfigs: (cropSeasonId: string, body: PutTrackingConfigsBodyType) =>
    api.put<TrackingConfigListResType, PutTrackingConfigsBodyType>(
      EP.CONFIGS(cropSeasonId),
      body,
    ),

  // B3 — List current tracking configs
  listConfigs: (cropSeasonId: string) =>
    api.get<TrackingConfigListResType>(EP.CONFIGS(cropSeasonId)),

  // B7 — Plan vs Actual diff (main dashboard data)
  getPlanVsActualDiff: (cropSeasonId: string) =>
    api.get<TrackingDiffResType>(EP.DIFF(cropSeasonId)),

  // B8 — Paginated tracking log
  listTrackingLog: (cropSeasonId: string, query: TrackingLogQueryType) =>
    api.get<TrackingLogListResType>(
      `${EP.TRACKING_LOG(cropSeasonId)}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  // B9 — Paginated field change history (page + limit are required in query)
  getFieldHistory: (cropSeasonId: string, query: FieldHistoryQueryType) =>
    api.get<FieldHistoryResType>(
      `${EP.FIELD_HISTORY(cropSeasonId)}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  // B5 — Production request snapshot (immutable plan at approve time)
  getProductionRequestSnapshot: (cropSeasonId: string, requestId: string) =>
    api.get<ProductionRequestSnapshotResType>(
      EP.REQUEST_SNAPSHOT(cropSeasonId, requestId),
    ),

  // B6 — Diff two production request snapshots
  diffProductionRequests: (
    cropSeasonId: string,
    query: ProductionRequestDiffQueryType,
  ) =>
    api.get<ProductionRequestDiffResType>(
      `${EP.REQUEST_DIFF(cropSeasonId)}?${queryString.stringify(query)}`,
    ),
};
```

---

## 7. React Query Hooks

Create `src/queries/useTracking.ts`:

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/endpoints";
import { trackingService } from "@/services/trackingService";
import type {
  PutTrackingConfigsBodyType,
  TrackingLogQueryType,
  FieldHistoryQueryType,
} from "@/schemaValidatation/tracking";

// B1 — Available fields (used in config panel checkbox tree)
export const useTrackingAvailableFields = (cropSeasonId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.availableFields(cropSeasonId),
    queryFn: () => trackingService.getAvailableFields(cropSeasonId),
    staleTime: Infinity, // whitelist is static — no need to refetch
    enabled: !!cropSeasonId,
  });

// B3 — Read configs
export const useTrackingConfigs = (cropSeasonId: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.configs(cropSeasonId),
    queryFn: () => trackingService.listConfigs(cropSeasonId),
    enabled: !!cropSeasonId && enabled,
  });

// B2 — Replace configs (Manager only, season=planning)
export const useReplaceTrackingConfigs = (cropSeasonId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PutTrackingConfigsBodyType) =>
      trackingService.replaceConfigs(cropSeasonId, body),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: QUERY_KEYS.tracking.configs(cropSeasonId),
      });
    },
  });
};

// B7 — Plan vs Actual diff
export const useTrackingDiff = (cropSeasonId: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.diff(cropSeasonId),
    queryFn: () => trackingService.getPlanVsActualDiff(cropSeasonId),
    enabled: !!cropSeasonId && enabled,
    // Refetch on window focus because actual values change live
    refetchOnWindowFocus: true,
  });

// B8 — Paginated tracking log
export const useTrackingLog = (
  cropSeasonId: string,
  query: TrackingLogQueryType,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.log(cropSeasonId, query),
    queryFn: () => trackingService.listTrackingLog(cropSeasonId, query),
    enabled: !!cropSeasonId && enabled,
  });

// B9 — Paginated field history (for "View history" modal — has page + limit)
export const useTrackingFieldHistory = (
  cropSeasonId: string,
  query: FieldHistoryQueryType | null,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.fieldHistory(cropSeasonId, query),
    queryFn: () => trackingService.getFieldHistory(cropSeasonId, query!),
    enabled: !!cropSeasonId && !!query,
    // FieldHistoryQueryType includes page + limit — caller controls pagination
  });

// B5 — Production request snapshot
export const useProductionRequestSnapshot = (
  cropSeasonId: string,
  requestId: string | null,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.requestSnapshot(cropSeasonId, requestId!),
    queryFn: () =>
      trackingService.getProductionRequestSnapshot(cropSeasonId, requestId!),
    enabled: !!cropSeasonId && !!requestId,
    staleTime: Infinity, // snapshot is immutable
  });
```

---

## 8. Endpoint Constants & Query Keys

Add to `src/constants/endpoints.ts`:

```ts
// Inside API_ENDPOINTS:
TRACKING: {
  AVAILABLE_FIELDS: (cropSeasonId: string) =>
    `/crop-seasons/${cropSeasonId}/tracking/available-fields`,
  CONFIGS: (cropSeasonId: string) =>
    `/crop-seasons/${cropSeasonId}/tracking/configs`,
  DIFF: (cropSeasonId: string) =>
    `/crop-seasons/${cropSeasonId}/tracking/diff`,
  TRACKING_LOG: (cropSeasonId: string) =>
    `/crop-seasons/${cropSeasonId}/tracking-log`,
  FIELD_HISTORY: (cropSeasonId: string) =>
    `/crop-seasons/${cropSeasonId}/tracking/field-history`,
  REQUEST_SNAPSHOT: (cropSeasonId: string, requestId: string) =>
    `/crop-seasons/${cropSeasonId}/production-requests/${requestId}/snapshot`,
  REQUEST_DIFF: (cropSeasonId: string) =>
    `/crop-seasons/${cropSeasonId}/production-requests/diff`,
},
```

```ts
// Inside QUERY_KEYS:
tracking: {
  all: (cropSeasonId: string) => ["tracking", cropSeasonId],
  availableFields: (cropSeasonId: string) => ["tracking", cropSeasonId, "available-fields"],
  configs: (cropSeasonId: string) => ["tracking", cropSeasonId, "configs"],
  diff: (cropSeasonId: string) => ["tracking", cropSeasonId, "diff"],
  log: (cropSeasonId: string, query?: Record<string, unknown>) =>
    ["tracking", cropSeasonId, "log", ...(query !== undefined ? [query] : [])],
  fieldHistory: (cropSeasonId: string, query: unknown) =>
    ["tracking", cropSeasonId, "field-history", query],
  requestSnapshot: (cropSeasonId: string, requestId: string) =>
    ["tracking", cropSeasonId, "snapshot", requestId],
},
```

---

## 9. Reusable Common Components

Before building new components, integrate these existing pieces from `src/components/`.

### 9.1 From `src/components/common/`

| Component | Import path | Use in Module 5 |
| --- | --- | --- |
| `KpiCard` | `@/components/common/KpiCard` | KPI summary row on PlanVsActualPage: "Đúng hạn", "Trễ", "Phát sinh", total changes. Supports `tone: "success" \| "warning" \| "danger" \| "default"`, `icon`, `label`, `value`, `hint`. |
| `EmptyState` | `@/components/common/EmptyState` | When no tracking fields are configured yet ("Chưa có trường theo dõi"), no log entries, or no diff data. Supports `icon`, `title`, `description`, `action`. |
| `ErrorState` | `@/components/common/ErrorState` | When B7/B8/B9 API calls fail. Supports `message`, `onRetry`. |
| `LoadingCard` | `@/components/common/LoadingCard` | Loading skeleton for the diff page sections and config panel. |
| `TableSkeleton` | `@/components/common/TableSkeleton` | Drop-in skeleton for `DiffTable` and `UnplannedTable` while data loads. |
| `ProPagination` | `@/components/common/pro-pagination` | Paginated tracking log (B8) and field history modal (B9). Uses `totalPages`, `currentPage`, `buildHref`. |
| `DatePickerField` | `@/components/common/DatePickerField` | Date range filter on the tracking log timeline (wrap in `Controller`). |
| `StatusBanner` | `@/components/common/StatusBanner` | In-form banner for locked fields: variant `"warning"` with message "Trường này đã khóa sau khi phê duyệt kế hoạch." |
| `DailyLogActivityFeed` | `@/components/common/DailyLogActivityFeed` | **Reference pattern only** for `TrackingTimeline` — same avatar + badge + relative-time feed structure. Build a new `TrackingTimeline` component following this pattern with `TrackingLogItemType` as the data shape. |
| `MilestoneStepper` | `@/components/common/milestone-stepper` | Not used in tracking directly, but its `StepStatus` type and lock-icon pattern can be referenced for showing plan-locked fields. |

### 9.2 From `src/components/ui/`

| Component | Use in Module 5 |
| --- | --- |
| `Badge` | Variance badges (`+3d`, `−2d`), layer badges ("Kế hoạch"/"Thực tế"), "Phát sinh" unplanned badge |
| `Checkbox` | Tracking field selection panel (F1) — each trackable field row |
| `Switch` | Post-approve config read-only toggle (F5, pending B4 endpoint) |
| `Tabs` | Plan vs Actual page section switcher: "Kế hoạch vs Thực tế" / "Timeline thay đổi" |
| `Dialog` | `FieldHistoryModal` — click a diff row to see full change history |
| `Sheet` | Config panel (F1) — same pattern as existing CropSeason create/edit sheet |
| `Accordion` | Collapsible entity groups in `DiffTable` (group by `entityType`) |
| `Tooltip` | Show full timestamp on `changedAt` in timeline; show "Kế hoạch: …" on hover for diff cells |
| `Table` | `DiffTable`, `UnplannedTable`, `FieldHistoryModal` table body |
| `Separator` | Section dividers in `DiffTable` between entity type groups |
| `Alert` | In-form alerts for `OperationalUpdateNotAllowed` (editing operational fields in planning status) |
| `confirm-dialog` | Confirm before replacing tracking configs (replace-all is destructive) |

### 9.3 From `src/lib/`

| File | Use in Module 5 |
| --- | --- |
| `format.ts` — `formatDateTimeVi`, `parseBackendDate` | Display `changedAt`, `lastChangedAt`, `createdAt` in Vietnamese locale |
| `format.ts` — `formatDateVi` (if exists) | Display `planValue` / `actualValue` when `dataType === "date"` |
| `error-message.ts` — `translateBackendMessage` | All 422 error messages — see Section 13 for the exact keys to add |

---

## 10. UI Component Build Plan

### F1 — Tracking Field Selection Panel (Manager, planning phase)

**Location:** Inside `ManagerCropSeasonsPage.tsx` → attach to the create/edit sheet. Show as a collapsible panel **after** the base plan fields.

**Data flow:**

1. Call `useTrackingAvailableFields(cropSeasonId)` to get the full whitelist.
2. Call `useTrackingConfigs(cropSeasonId)` to hydrate the current checkbox state.
3. On save → call `useReplaceTrackingConfigs` with the full desired set.
4. Use the `Sheet` UI component (same pattern as existing CropSeason sheet) for the panel container.
5. Use `Checkbox` (from `components/ui/checkbox`) for each trackable field row.

**UI structure:**

```
┌─ Trường muốn theo dõi ──────────────────────────────────────┐
│  [Kế hoạch vs Thực tế] Chọn các trường để hệ thống ghi log  │
│                                                              │
│  Mùa vụ (CropSeason)                                        │
│  ☑ Ngày thu hoạch dự kiến   [Kế hoạch]                      │
│  ☑ Ngày thu hoạch thực tế   [Thực tế]                       │
│  ☐ Ghi chú                  [Thực tế]                       │
│                                                              │
│  Giai đoạn (Milestone)                                       │
│  ☑ Ngày kết thúc thực tế    [Thực tế]                       │
│  ☐ Trạng thái               [Thực tế]                       │
│                                                              │
│  Công việc (Task)                                            │
│  ☑ Phân công                [Thực tế]                       │
│  ☑ Trạng thái               [Thực tế]                       │
│               [Hủy]  [Lưu cấu hình]                         │
└──────────────────────────────────────────────────────────────┘
```

Use `confirm-dialog` before saving (replace-all is destructive — confirms removing previously active fields).

**Important:** `PUT tracking/configs` only available when `season.status === "planning"`. After approve, show config panel in **read-only mode** using `StatusBanner` variant `"info"`.

### F2 — Field Locking in Edit Forms

**Affected forms:** CropSeason edit, Milestone edit, Task edit.

**Logic to implement:**

```ts
// In each edit form, determine which fields to show editable based on season status
const isPlanning = cropSeason.status === "planning";
const isApprovedOrActive = ["approved", "active"].includes(cropSeason.status);

// Plan-only fields: editable only in planning
const planOnlyDisabled = !isPlanning;

// Operational fields: editable only in approved/active
const operationalDisabled = !isApprovedOrActive;
```

**Edit form field segmentation:**

| Entity | planning → show | approved/active → show |
| --- | --- | --- |
| CropSeason | `cropName`, `variety`, `plantDate`, `expectedHarvestDate`, `totalAreaSqm`, `plantCount`, `notes` | `actualHarvestDate`, `notes` only |
| Milestone | `stageName`, `expectedStartDate`, `expectedEndDate` | `actualStartDate`_, `actualEndDate`_, `status` |
| Task (baseline, `createdInPlan=true`) | `title`, `description`, `priority`, `assignedTo`, `status` | `assignedTo`\*\*, `status`, `completedAt`, `startDate` |
| Task (ad-hoc, `createdInPlan=false`) | — | All operational fields |

\*`actualStartDate` / `actualEndDate` on milestone require `season.status === "active"` specifically — show hint "Cần kích hoạt mùa vụ trước (chuyển milestone sang in_progress)".

**`assignedTo` lock terminal**: disable assign/unassign if `task.status ∈ {completed, verified, cancelled}`.

### F3 — IoT Swap Modal

**Trigger:** "Thay thiết bị" button on IoT assignment row (available when `season.status ∈ {approved, active}`).

**Body to send:** `POST /crop-seasons/:id/iot-assignments/swap` (B14 — built in BE but endpoint path needs confirmation from BE team).

```ts
// Swap modal fields:
{
  oldAssignmentId: string; // selected from assignment list
  newDeviceId: string; // selected from available devices (reuse existing API)
  swapReason: string; // required (BR-47)
}
```

**Existing APIs to reuse in this modal:**

- `GET /production-milestone-iot-device/manager/milestone/:id/assignment` — current assignment list
- `GET /production-milestone-iot-device/manager/milestone/:id/available` — available devices

### F4 — Ad-hoc Task

When creating a task and `season.status ∈ {approved, active}` → task is automatically ad-hoc. The FE **does not** send `createdInPlan` — the BE infers it automatically. The FE should show a badge "Công việc phát sinh" on tasks that have `createdInPlan=false`.

### F5 — Config Toggle (post-approve)

After approve, the tracking config panel shows in toggle-only mode. The toggle calls `PUT tracking/configs` with the full current list minus the toggled field (soft-disable). Since `PUT` is only allowed in `planning` status, this toggle functionality requires a separate toggle endpoint or the FE must detect the error and show "Không thể thay đổi cấu hình sau khi duyệt".

> **Note:** Re-read BE docs — the current `TrackingService.replaceConfigs` throws `TrackingConfigLocked` if status ≠ planning. There is no separate toggle endpoint yet. **FE should show the panel as read-only after approve** and note to the team that a toggle endpoint (B4 from original plan) may still need to be built.

### F6 — Owner Plan vs Actual Page

**Route:** `/dashboard/owner/crop-seasons/:id/plan-vs-actual`

**Data source:** `useTrackingDiff(cropSeasonId)` + `useTrackingLog(cropSeasonId, { page: 1, limit: 20 })`

**Layout:**

```
┌─ CropSeason Header ─────────────────────────────────────────┐
│ Rice ST25 | Status: active | Approved: 20/04/2026           │
│ Plan harvest: 15/08/2026                                     │
└──────────────────────────────────────────────────────────────┘

┌─ KPI Cards ─────────────────────────────────────────────────┐
│ [Đúng hạn: 12] [Trễ: 3] [Phát sinh thêm: 2] [Đổi: 47]     │
└──────────────────────────────────────────────────────────────┘

┌─ Bảng So Sánh Kế Hoạch vs Thực Tế ─────────────────────────┐
│ Filter: [Entity type ▾] [Người thực hiện ▾] [Từ—Đến]        │
│                                                              │
│ Giai đoạn (Production Milestones)                            │
│ ┌──────────────┬──────────────┬───────────┬───────┬───────┐  │
│ │ Tên          │ Trường       │ Kế hoạch  │Thực tế│  Δ    │  │
│ ├──────────────┼──────────────┼───────────┼───────┼───────┤  │
│ │ M1 Sowing    │ actualEndDate│ 10/05     │ 13/05 │ +3d 🔴│  │
│ │ M2 Growing   │ status       │ pending   │in_prog│  →    │  │
│ └──────────────┴──────────────┴───────────┴───────┴───────┘  │
│                                                              │
│ Phát sinh sau kế hoạch (Unplanned)                           │
│ ┌──────────────┬──────────────────────────┬──────────────┐   │
│ │ Task ad-hoc  │ Ad-hoc: Phun thuốc Plot B│ 🟣 Phát sinh │   │
│ └──────────────┴──────────────────────────┴──────────────┘   │
└──────────────────────────────────────────────────────────────┘

┌─ Timeline thay đổi ─────────────────────────────────────────┐
│ 10:23 Nguyen Van A: Task "Phun thuốc" → hoàn thành          │
│ 09:00 Hệ thống: M1 actualEndDate → 13/05/2026               │
│ 08:30 Tran Thi B: Harvest quantity 1200 → 1180 kg            │
│                                     [Xem thêm →]            │
└──────────────────────────────────────────────────────────────┘
```

**Variance color coding:**

- `direction === "late"` or `direction === "over"` → red `🔴` badge
- `direction === "early"` or `direction === "under"` → green `🟢`
- Unplanned entities → purple `🟣` badge "Phát sinh"
- No change (planValue === actualValue) → gray, no icon

**Click on row → field history modal** calling `useTrackingFieldHistory`.

---

## 10. Field Locking UX

The backend enforces the 3-layer policy and returns 422 on violations. The FE **must** both proactively lock the UI and gracefully handle 422 errors.

### Proactive UI locks

```ts
// Helper: what is editable for this entity in this season status
export function getCropSeasonEditableFields(
  status: string,
): "all" | "operational" | "none" {
  if (status === "planning") return "all";
  if (status === "approved" || status === "active") return "operational";
  return "none";
}
```

In every edit form:

1. Check `cropSeason.status` (fetched via `useQuery`).
2. Disable / hide plan-only input fields when not in `planning`.
3. Show helper text: "Trường này đã khóa sau khi phê duyệt kế hoạch."
4. Enable operational fields only when `status ∈ {approved, active}`.
5. Show helper text for `actualStartDate`/`actualEndDate`: "Chỉ sửa được khi mùa vụ đang hoạt động (active)."

### Reactive 422 handling

Map the backend error codes to FE messages in `src/lib/error-message.ts`.

> ⚠️ **QA fix:** Keys must be the full BE error message string, normalized with `.trim().replace(/\s+/g, " ").toLowerCase()`. BE uses `Error.PascalCase` format (`Error.CropSeasonLockedPlanField`), so the final message string after normalization is `"error.cropseasonlockedplanfield"` etc.

```ts
// Add to BACKEND_ERROR_MAP in src/lib/error-message.ts:
"error.cropseasonlockedplanfield": "Trường này đã được khóa sau khi phê duyệt kế hoạch.",
"error.cropseasonoperationalupdatenotallowed": "Chỉ chỉnh được trường vận hành khi mùa vụ đã duyệt hoặc đang hoạt động.",
"error.productionmilestoneupdateoperationalfieldsonly": "Chỉ có thể cập nhật trường thực tế sau khi kế hoạch được duyệt.",
"error.milestoneactualdaterequiresactiveseason": "Ngày thực tế chỉ sửa được khi mùa vụ đang hoạt động (active).",
"error.taskplanfieldlocked": "Không thể sửa tiêu đề/mô tả/độ ưu tiên của công việc kế hoạch sau khi phê duyệt.",
"error.taskassigneelocked": "Không thể đổi người thực hiện khi công việc đã hoàn thành/hủy.",
"error.trackingconfiglocked": "Cấu hình theo dõi chỉ có thể thay đổi khi mùa vụ đang ở trạng thái lập kế hoạch.",
"error.trackingfieldnotwhitelisted": "Trường này không nằm trong danh sách có thể theo dõi.",
"error.trackingforbidden": "Bạn không có quyền xem dữ liệu theo dõi của mùa vụ này.",
```

**Normalization reminder:** BE sends `"Error.CropSeasonLockedPlanField"` as the message string. `error-message.ts` normalizes it via:

```ts
const key = message.trim().replace(/\s+/g, " ").toLowerCase();
// → "error.cropseasonlockedplanfield"
```

so the map keys above are already the normalized form ready to insert.

---

## 11. Plan vs Actual Diff Page Layout

### Route registration (add to `src/routes/routes.ts`)

```ts
import PlanVsActualPage from "@/pages/OwnerPage/CropSeasons/PlanVsActualPage";

// In Owner routes:
{
  path: "/dashboard/owner/crop-seasons/:id/plan-vs-actual",
  element: <PlanVsActualPage />,
  allowedRoles: ["owner", "manager"],
},
```

### File structure

```
src/pages/OwnerPage/CropSeasons/
├── OwnerCropSeasonsPage.tsx                  (exists — add link to Plan vs Actual)
├── PlanVsActualPage.tsx                      (new — main page)
└── components/
    ├── DiffTable.tsx                         (tracked entity diff table)
    ├── UnplannedTable.tsx                    (unplanned entities table)
    ├── TrackingTimeline.tsx                  (activity log timeline)
    ├── FieldHistoryModal.tsx                 (click row → history modal)
    ├── VarianceBadge.tsx                     (shared variance display)
    └── KpiSummaryCards.tsx                   (on-track / late / unplanned / total counts)
```

### `VarianceBadge` component spec

> ⚠️ **QA fix:** `"over"` and `"under"` do NOT exist in the BE enum. Correct values are `"early" | "on-time" | "late" | "lower" | "higher" | "equal"` (from `TrackedFieldDiffSchema.variance.direction` in `tracking.model.ts`).

```tsx
// Props shape based on actual BE TrackedFieldDiffSchema.variance
type VarianceShape = {
  type: "days" | "absolute" | "percent" | "label" | "changed" | "none";
  value?: unknown;
  direction?: "early" | "on-time" | "late" | "lower" | "higher" | "equal";
} | null;

function VarianceBadge({
  variance,
  dataType,
}: {
  variance: VarianceShape;
  dataType: string;
}) {
  if (!variance) return <span className="text-muted-foreground">—</span>;
  if (variance.type === "none")
    return <span className="text-muted-foreground">—</span>;

  // "late" (date overshoot) or "higher" (numeric overshoot) → danger
  if (variance.direction === "late" || variance.direction === "higher") {
    const display =
      variance.type === "days" ||
      variance.type === "absolute" ||
      variance.type === "percent"
        ? `+${variance.value}${variance.type === "days" ? "d" : variance.type === "percent" ? "%" : ""}`
        : "Quá";
    return <Badge variant="destructive">{display} 🔴</Badge>;
  }

  // "early" (date ahead of plan) or "lower" (numeric below plan) → positive
  if (variance.direction === "early" || variance.direction === "lower") {
    const display =
      variance.type === "days" ||
      variance.type === "absolute" ||
      variance.type === "percent"
        ? `-${variance.value}${variance.type === "days" ? "d" : variance.type === "percent" ? "%" : ""}`
        : "Sớm";
    return <Badge className="bg-green-100 text-green-800">{display} 🟢</Badge>;
  }

  // "on-time" or "equal" → neutral, on track
  if (variance.direction === "on-time" || variance.direction === "equal") {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground"
      >
        Đúng kế hoạch
      </Badge>
    );
  }

  // "changed" or "label" without direction → generic change badge
  return <Badge variant="secondary">Thay đổi</Badge>;
}
```

---

## 12. Error Handling & 422 Messages

Apply the standard error-handling pattern from [form-error-and-date-handling.md](../../../docs/form-error-and-date-handling.md):

```tsx
const onSubmit = async (data: UpdateCropSeasonBodyType) => {
  try {
    await mutateAsync(data);
    toast.success("Cập nhật thành công");
  } catch (error) {
    if (
      isApiErrorUnprocessableEntityResponse<UpdateCropSeasonBodyType>(error)
    ) {
      handleApiErrorUnprocessentity<UpdateCropSeasonBodyType>(
        error.response!.data.errors,
        form.setError,
        { getValues: form.getValues },
      );
      return;
    }
    if (isApiErrorResponse(error)) {
      // Field-locking errors (LockedPlanField etc.) come as 422 with no field
      // so handleApiErrorUnprocessentity will toast them automatically.
      toast.error(error.response?.data.message ?? "Thao tác thất bại");
      return;
    }
    toast.error("Đã có lỗi xảy ra");
  }
};
```

**Key insight:** The 422 field-locking errors (`LockedPlanField`, etc.) do NOT have a `field` property in their `errors` array — they are top-level `message` errors. `handleApiErrorUnprocessentity` will route them to `toast.error` automatically.

---

## 13. Build Sequence (Recommended)

Build in this order to minimize blockers:

```
Sprint 1 — Infrastructure (F-INF-1 to F-INF-5)
  1. Add TRACKING to endpoints.ts + QUERY_KEYS         [30 min]
  2. Create schemaValidatation/tracking.ts              [1h]
  3. Create services/trackingService.ts                 [1h]
  4. Create queries/useTracking.ts                      [1h]
  5. Add error codes to error-message.ts BACKEND_ERROR_MAP [30 min]

Sprint 2 — Manager flows (F1, F2, F4)
  6. Split CropSeason edit form: plan-only vs operational fields (F2)  [2h]
  7. Add tracking field selection panel to CropSeason create (F1)      [3h]
  8. Ad-hoc task badge (createdInPlan=false) (F4)                      [1h]

Sprint 3 — Owner Plan vs Actual page (F6)
  9. PlanVsActualPage.tsx + route registration                         [4h]
  10. DiffTable.tsx + VarianceBadge.tsx                                [2h]
  11. UnplannedTable.tsx                                               [1h]
  12. TrackingTimeline.tsx                                             [2h]
  13. FieldHistoryModal.tsx (click row → B9)                           [1h]
  14. KpiSummaryCards.tsx                                              [1h]

Sprint 4 — Supplementary (F3, F5, F7)
  15. IoT swap modal (F3) — confirm B14 endpoint with BE               [2h]
  16. Tracking config toggle post-approve (F5) — depends on BE B4 endpoint [1h]
  17. IoT device logs page (F7)                                        [1h]
```

**Total estimated effort:** ~24h

---

## Appendix: Access Control Matrix

| FE action | Role required | When | API |
| --- | --- | --- | --- |
| View available trackable fields | owner OR manager | Any season status | B1 |
| View current tracking configs | owner OR manager | Any season status | B3 |
| Edit tracking configs | manager ONLY | `status=planning` | B2 |
| View Plan vs Actual diff | owner OR manager | After approve | B7 |
| View tracking log | owner OR manager | After approve | B8 |
| View field history | owner OR manager | After approve | B9 |
| View production request snapshot | owner OR manager | After approve | B5 |
| **Admin CANNOT view tracking data** | — | — | 403 |

> Tenant isolation is enforced by BE via `assertTrackingReadAccess`. FE only needs to show the UI to the correct role — backend will 403 any cross-farm attempt.
