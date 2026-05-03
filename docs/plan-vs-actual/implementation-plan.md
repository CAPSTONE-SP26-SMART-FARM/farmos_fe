# Module 5 — Plan vs Actual Tracking: Implementation Plan

> **Audience:** Frontend developers implementing Module 5 from scratch. **Conventions:** Follow [form-error-and-date-handling.md](../../../docs/form-error-and-date-handling.md) and [DEVELOPMENT.md](../../DEVELOPMENT.md) for all patterns. **Reference:** API contract and Zod schemas are in [plan-vs-actual.md](./plan-vs-actual.md). UX/UI wireframes are in [ui-ux.md](./ui-ux.md).

---

## Table of Contents

- [Phase 0 — Infrastructure (P0, ~4h)](#phase-0--infrastructure)
  - [Step 0.1 — Add TRACKING to endpoints.ts](#step-01--add-tracking-to-endpointsts)
  - [Step 0.2 — Add tracking to QUERY_KEYS](#step-02--add-tracking-to-query_keys)
  - [Step 0.3 — Create schemaValidatation/tracking.ts](#step-03--create-schemavalidatatonttrackingts)
  - [Step 0.4 — Create services/trackingService.ts](#step-04--create-servicestrackingservicets)
  - [Step 0.5 — Create queries/useTracking.ts](#step-05--create-queriesusetrackingts)
  - [Step 0.6 — Add error keys to error-message.ts](#step-06--add-error-keys-to-error-messagets)
  - [Step 0.7 — Create src/lib/tracking-display.ts](#step-07--create-srclibtracking-displayts)
- [Phase 1 — Manager Forms (P1, ~5h)](#phase-1--manager-forms)
  - [Step 1.1 — Split CropSeason edit form (F2)](#step-11--split-cropseason-edit-form-f2)
  - [Step 1.2 — Tracking field selection panel (F1)](#step-12--tracking-field-selection-panel-f1)
  - [Step 1.3 — Ad-hoc task badge (F4)](#step-13--ad-hoc-task-badge-f4)
- [Phase 2 — Owner Plan vs Actual Page (P1, ~11h)](#phase-2--owner-plan-vs-actual-page)
  - [Step 2.1 — Route registration](#step-21--route-registration)
  - [Step 2.2 — PlanVsActualPage.tsx (shell)](#step-22--planvsactualpagesx)
  - [Step 2.3 — VarianceBadge.tsx](#step-23--variancebadgetsx)
  - [Step 2.4 — KpiSummaryCards.tsx](#step-24--kpisummarycardstsx)
  - [Step 2.5 — DiffTable.tsx](#step-25--difftabletsx)
  - [Step 2.6 — UnplannedTable.tsx](#step-26--unplannedtabletsx)
  - [Step 2.7 — FieldHistoryModal.tsx](#step-27--fieldhistorymodaltsx)
  - [Step 2.8 — TrackingTimeline.tsx](#step-28--trackingtimelinetsx)
  - [Step 2.9 — Link from OwnerCropSeasonsPage](#step-29--link-from-ownercropseasonpage)
- [Phase 3 — P2/P3 Supplementary Features](#phase-3--p2p3-supplementary-features)
  - [Step 3.1 — IoT Swap Modal (F3)](#step-31--iot-swap-modal-f3)
  - [Step 3.2 — IoT Device Logs Page (F7)](#step-32--iot-device-logs-page-f7)
  - [Step 3.3 — Production Request Snapshot Viewer (P3)](#step-33--production-request-snapshot-viewer-p3)
- [Validation Checklist](#validation-checklist)

---

## Phase 0 — Infrastructure

> All 7 sub-steps in this phase are pure config/schema/service work — no UI. Complete all before writing any page component. Estimated: **~4h total**.

---

### Step 0.1 — Add TRACKING to endpoints.ts

**File:** `src/constants/endpoints.ts`

Inside the `API_ENDPOINTS` object, add a new `TRACKING` section immediately **after** `CROP_SEASON`:

```ts
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

**Verification:** Run `pnpm build` — no TS errors.

---

### Step 0.2 — Add tracking to QUERY_KEYS

**File:** `src/constants/endpoints.ts`

Inside the `QUERY_KEYS` object, add a `tracking` key. Follow the existing factory-function pattern used by `subscriptions`, `invoices`, etc.:

```ts
tracking: {
  all: (cropSeasonId: string) => ["tracking", cropSeasonId] as const,
  availableFields: (cropSeasonId: string) =>
    ["tracking", cropSeasonId, "available-fields"] as const,
  configs: (cropSeasonId: string) =>
    ["tracking", cropSeasonId, "configs"] as const,
  diff: (cropSeasonId: string) =>
    ["tracking", cropSeasonId, "diff"] as const,
  log: (cropSeasonId: string, query?: Record<string, unknown>) =>
    ["tracking", cropSeasonId, "log", ...(query !== undefined ? [query] : [])] as const,
  fieldHistory: (cropSeasonId: string, query: unknown) =>
    ["tracking", cropSeasonId, "field-history", query] as const,
  requestSnapshot: (cropSeasonId: string, requestId: string) =>
    ["tracking", cropSeasonId, "snapshot", requestId] as const,
},
```

---

### Step 0.3 — Create schemaValidatation/tracking.ts

**File:** `src/schemaValidatation/tracking.ts` ← **create new file**

Copy the complete schema block from [plan-vs-actual.md §5](./plan-vs-actual.md#5-schema-validation-zod) verbatim. It contains:

| Schema | Purpose |
| --- | --- |
| `TrackingEntityTypeSchema` | Enum — 5 entity types |
| `TrackingDataTypeSchema` | Enum — 8 data types |
| `TrackingChangeTypeSchema` | Enum — 4 change types |
| `TrackingFieldLayerSchema` | Enum — `plan_only` / `operational` / `unplanned` |
| `AvailableFieldsResSchema` | B1 response |
| `TrackingConfigItemSchema` | Single config row (B3 response item) |
| `TrackingConfigListResSchema` | B3 list response |
| `PutTrackingConfigsBodySchema` | B2 request body |
| `TrackingLogItemSchema` | Shared log row (B8 + B9) |
| `TrackingLogQuerySchema` | B8 query params (has `page`, `limit`) |
| `TrackingLogListResSchema` | B8 list response |
| `VarianceSchema` | Nested in diff |
| `TrackingDiffResSchema` | B7 full diff response |
| `ProductionRequestSnapshotResSchema` | B5 response |
| `ProductionRequestDiffQuerySchema` | B6 query params |
| `ProductionRequestDiffResSchema` | B6 response |
| `FieldHistoryQuerySchema` | B9 query params |
| `FieldHistoryResSchema` | B9 response |

**Critical points:**

- `TrackingLogItemSchema` includes `cropSeasonId` field — do NOT omit it.
- `TrackedEntitySchema` has NO `entityLabel` — BE does not return it. Resolve display names in FE via `resolveEntityName()` (see Step 0.7).
- `VarianceSchema` direction enum: `"early" | "on-time" | "late" | "lower" | "higher" | "equal"` — `"over"` and `"under"` do NOT exist.
- `FieldHistoryQuerySchema` must include `page` and `limit` (both with `.default()`).

---

### Step 0.4 — Create services/trackingService.ts

**File:** `src/services/trackingService.ts` ← **create new file**

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
  // B1 — Available trackable fields (checkbox tree in config panel)
  getAvailableFields: (cropSeasonId: string) =>
    api.get<AvailableFieldsResType>(EP.AVAILABLE_FIELDS(cropSeasonId)),

  // B2 — Replace tracking configs (Manager only, season.status === "planning")
  replaceConfigs: (cropSeasonId: string, body: PutTrackingConfigsBodyType) =>
    api.put<TrackingConfigListResType, PutTrackingConfigsBodyType>(
      EP.CONFIGS(cropSeasonId),
      body,
    ),

  // B3 — List current tracking configs (owner + manager, any status)
  listConfigs: (cropSeasonId: string) =>
    api.get<TrackingConfigListResType>(EP.CONFIGS(cropSeasonId)),

  // B7 — Plan vs Actual diff (main F6 data source)
  getPlanVsActualDiff: (cropSeasonId: string) =>
    api.get<TrackingDiffResType>(EP.DIFF(cropSeasonId)),

  // B8 — Paginated tracking log (timeline feed)
  listTrackingLog: (cropSeasonId: string, query: TrackingLogQueryType) =>
    api.get<TrackingLogListResType>(
      `${EP.TRACKING_LOG(cropSeasonId)}?${queryString.stringify(query, {
        skipEmptyString: true,
        skipNull: true,
      })}`,
    ),

  // B9 — Paginated field change history (field-level drill-down modal)
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

**Export barrel:** Add to `src/services/index.ts`:

```ts
export { trackingService } from "./trackingService";
```

---

### Step 0.5 — Create queries/useTracking.ts

**File:** `src/queries/useTracking.ts` ← **create new file**

```ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants/endpoints";
import { trackingService } from "@/services/trackingService";
import type {
  PutTrackingConfigsBodyType,
  TrackingLogQueryType,
  FieldHistoryQueryType,
  ProductionRequestDiffQueryType,
} from "@/schemaValidatation/tracking";

// ── B1 — Available fields ─────────────────────────────────────────────────
// staleTime: Infinity — whitelist is static, never changes at runtime
export const useTrackingAvailableFields = (cropSeasonId: string) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.availableFields(cropSeasonId),
    queryFn: () => trackingService.getAvailableFields(cropSeasonId),
    staleTime: Infinity,
    enabled: !!cropSeasonId,
  });

// ── B3 — Read configs ─────────────────────────────────────────────────────
export const useTrackingConfigs = (cropSeasonId: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.configs(cropSeasonId),
    queryFn: () => trackingService.listConfigs(cropSeasonId),
    enabled: !!cropSeasonId && enabled,
  });

// ── B2 — Replace configs (Manager only, season.status === "planning") ─────
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

// ── B7 — Plan vs Actual diff ──────────────────────────────────────────────
// refetchOnWindowFocus: true — actual values can change live
export const useTrackingDiff = (cropSeasonId: string, enabled = true) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.diff(cropSeasonId),
    queryFn: () => trackingService.getPlanVsActualDiff(cropSeasonId),
    enabled: !!cropSeasonId && enabled,
    refetchOnWindowFocus: true,
  });

// ── B8 — Paginated tracking log ───────────────────────────────────────────
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

// ── B9 — Paginated field history (null = modal not open) ─────────────────
export const useTrackingFieldHistory = (
  cropSeasonId: string,
  query: FieldHistoryQueryType | null,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.fieldHistory(cropSeasonId, query),
    queryFn: () => trackingService.getFieldHistory(cropSeasonId, query!),
    enabled: !!cropSeasonId && !!query,
  });

// ── B5 — Production request snapshot ─────────────────────────────────────
// staleTime: Infinity — snapshot is immutable
export const useProductionRequestSnapshot = (
  cropSeasonId: string,
  requestId: string | null,
) =>
  useQuery({
    queryKey: QUERY_KEYS.tracking.requestSnapshot(cropSeasonId, requestId!),
    queryFn: () =>
      trackingService.getProductionRequestSnapshot(cropSeasonId, requestId!),
    enabled: !!cropSeasonId && !!requestId,
    staleTime: Infinity,
  });

// ── B6 — Diff two production request snapshots ───────────────────────────
export const useProductionRequestDiff = (
  cropSeasonId: string,
  query: ProductionRequestDiffQueryType | null,
) =>
  useQuery({
    queryKey: ["tracking", cropSeasonId, "pr-diff", query],
    queryFn: () => trackingService.diffProductionRequests(cropSeasonId, query!),
    enabled: !!cropSeasonId && !!query?.from && !!query?.to,
    staleTime: Infinity,
  });
```

**Export barrel:** Add to `src/queries/index.ts`:

```ts
export * from "./useTracking";
```

---

### Step 0.6 — Add error keys to error-message.ts

**File:** `src/lib/error-message.ts`

Locate `BACKEND_ERROR_MAP` and add the following 9 entries. **Insert them after the existing CropSeason section** (search for `"only the primary manager can create crop seasons"`):

```ts
// ── Module 5 — Tracking / Field Locking ──────────────────────────────────
"error.cropseasonlockedplanfield":
  "Trường này đã được khóa sau khi phê duyệt kế hoạch.",
"error.cropseasonoperationalupdatenotallowed":
  "Chỉ chỉnh được trường vận hành khi mùa vụ đã duyệt hoặc đang hoạt động.",
"error.productionmilestoneupdateoperationalfieldsonly":
  "Chỉ có thể cập nhật trường thực tế sau khi kế hoạch được duyệt.",
"error.milestoneactualdaterequiresactiveseason":
  "Ngày thực tế chỉ sửa được khi mùa vụ đang hoạt động (active).",
"error.taskplanfieldlocked":
  "Không thể sửa tiêu đề/mô tả/độ ưu tiên của công việc kế hoạch sau khi phê duyệt.",
"error.taskassignee locked":
  "Không thể đổi người thực hiện khi công việc đã hoàn thành/hủy.",
"error.trackingconfiglocked":
  "Cấu hình theo dõi chỉ có thể thay đổi khi mùa vụ đang ở trạng thái lập kế hoạch.",
"error.trackingfieldnotwhitelisted":
  "Trường này không nằm trong danh sách có thể theo dõi.",
"error.trackingforbidden":
  "Bạn không có quyền xem dữ liệu theo dõi của mùa vụ này.",
```

> ⚠️ **Convention reminder:** The `BACKEND_ERROR_MAP` uses keys that are `message.trim().replace(/\s+/g, " ").toLowerCase()`. The BE throws `"Error.CropSeasonLockedPlanField"` → normalized to `"error.cropseasonlockedplanfield"`. The keys above are already normalized. Do NOT change the casing.

> ⚠️ **Special case:** `"error.taskassignee locked"` has a **space** between "assignee" and "locked" — this matches the BE error string exactly after normalization.

---

### Step 0.7 — Create src/lib/tracking-display.ts

**File:** `src/lib/tracking-display.ts` ← **create new file**

This utility module provides:

1. Vietnamese labels for `fieldName` values
2. Vietnamese labels for `entityType` values
3. `resolveEntityName()` — resolves a display name from `entityId` using already-loaded data
4. `formatTrackingValue()` — formats raw `planValue`/`actualValue` by `dataType`

```ts
import { format, parseISO } from "date-fns";
import type { TrackingEntityType } from "@/schemaValidatation/tracking";

// ── Field name → Vietnamese label ─────────────────────────────────────────
export const FIELD_LABEL_MAP: Record<string, string> = {
  // CropSeason fields
  cropName: "Tên mùa vụ",
  variety: "Giống cây",
  expectedHarvestDate: "Ngày thu hoạch dự kiến",
  actualHarvestDate: "Ngày thu hoạch thực tế",
  notes: "Ghi chú",
  status: "Trạng thái",

  // ProductionMilestone fields
  stageName: "Tên giai đoạn",
  milestoneOrder: "Thứ tự",
  expectedStartDate: "Ngày bắt đầu dự kiến",
  expectedEndDate: "Ngày kết thúc dự kiến",
  actualStartDate: "Ngày bắt đầu thực tế",
  actualEndDate: "Ngày kết thúc thực tế",

  // EmployeeTask fields
  title: "Tiêu đề công việc",
  description: "Mô tả",
  priority: "Mức độ ưu tiên",
  assignedTo: "Người thực hiện",
  assignedDate: "Ngày phân công",
  completedAt: "Ngày hoàn thành",
  startDate: "Ngày bắt đầu",

  // HarvestRecord fields
  harvestDate: "Ngày thu hoạch",
  quantity: "Sản lượng",
  unit: "Đơn vị",
  qualityGrade: "Phân loại chất lượng",

  // IotDeviceAssignment fields
  iotDeviceId: "Thiết bị IoT",
  assignedAt: "Ngày gán",
  unassignedAt: "Ngày thu hồi",
  sensorBinding: "Ràng buộc cảm biến",
};

export function getFieldLabel(fieldName: string): string {
  return FIELD_LABEL_MAP[fieldName] ?? fieldName;
}

// ── EntityType → Vietnamese label ─────────────────────────────────────────
export const ENTITY_TYPE_LABEL: Record<TrackingEntityType, string> = {
  crop_season: "Mùa vụ",
  production_milestone: "Giai đoạn sản xuất",
  employee_task: "Công việc",
  harvest_record: "Bản ghi thu hoạch",
  iot_device_assignment: "Thiết bị IoT",
};

export function getEntityTypeLabel(entityType: TrackingEntityType): string {
  return ENTITY_TYPE_LABEL[entityType] ?? entityType;
}

// ── Resolve display name from entityId ───────────────────────────────────
// The tracking diff API does NOT return entity names (only entityId).
// Pass the pre-loaded list for each entity type and this function
// will find the matching name. Returns a formatted fallback if not found.
//
// Usage example:
//   const name = resolveEntityName("production_milestone", entity.entityId, {
//     milestones: loadedMilestones,
//   });
export interface EntityNameRegistries {
  milestones?: Array<{ id: string; stageName?: string | null }>;
  tasks?: Array<{ id: string; title?: string | null }>;
  harvestRecords?: Array<{ id: string; harvestDate?: string | null }>;
  iotAssignments?: Array<{ id: string; iotDeviceId?: string | null }>;
}

export function resolveEntityName(
  entityType: TrackingEntityType,
  entityId: string,
  registries: EntityNameRegistries,
): string {
  switch (entityType) {
    case "production_milestone": {
      const found = registries.milestones?.find((m) => m.id === entityId);
      return found?.stageName ?? `Giai đoạn (${entityId.slice(0, 8)}…)`;
    }
    case "employee_task": {
      const found = registries.tasks?.find((t) => t.id === entityId);
      return found?.title ?? `Công việc (${entityId.slice(0, 8)}…)`;
    }
    case "harvest_record": {
      const found = registries.harvestRecords?.find((h) => h.id === entityId);
      const dateStr = found?.harvestDate
        ? format(parseISO(found.harvestDate), "dd/MM/yyyy")
        : entityId.slice(0, 8);
      return `Bản ghi thu hoạch (${dateStr})`;
    }
    case "iot_device_assignment": {
      const found = registries.iotAssignments?.find((a) => a.id === entityId);
      return found?.iotDeviceId
        ? `Thiết bị ${found.iotDeviceId.slice(0, 8)}`
        : `Thiết bị (${entityId.slice(0, 8)}…)`;
    }
    case "crop_season":
      // CropSeason is typically one — use its name from the diff header
      return `Mùa vụ (${entityId.slice(0, 8)}…)`;
    default:
      return entityId.slice(0, 8) + "…";
  }
}

// ── Format raw plan/actual value by dataType ──────────────────────────────
export function formatTrackingValue(value: unknown, dataType: string): string {
  if (value === null || value === undefined) return "—";

  switch (dataType) {
    case "date":
    case "datetime": {
      try {
        const d =
          typeof value === "string"
            ? parseISO(value)
            : new Date(value as number);
        return format(d, "dd/MM/yyyy");
      } catch {
        return String(value);
      }
    }
    case "boolean":
      return value ? "Có" : "Không";
    case "enum":
    case "string":
    case "uuid":
    case "int":
    case "decimal":
    default:
      return String(value);
  }
}
```

---

## Phase 1 — Manager Forms

> These steps modify **existing** Manager pages. Estimated: **~5h total**.

---

### Step 1.1 — Split CropSeason edit form (F2)

**File:** `src/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage.tsx`

**Problem:** The current edit form sends all fields regardless of `season.status`. After PR2, the BE returns 422 `LockedPlanField` if plan-only fields are submitted when `status ∈ {approved, active}`.

**What to implement:**

#### 1. Add helper function (add near top of file or in a `utils.ts` sibling):

```ts
export type CropSeasonEditMode = "plan_only" | "operational" | "all" | "none";

export function getCropSeasonEditMode(status: string): CropSeasonEditMode {
  if (status === "planning") return "all";
  if (status === "approved" || status === "active") return "operational";
  if (status === "completed" || status === "cancelled") return "none";
  return "none";
}
```

#### 2. Segment the edit form fields by layer:

```ts
// plan-only fields (editable only in "planning" status)
const PLAN_ONLY_FIELDS = [
  "cropName",
  "variety",
  "expectedHarvestDate",
  "totalAreaSqm",
  "plantCount",
] as const;

// operational fields (editable only in "approved" or "active" status)
const OPERATIONAL_FIELDS = ["actualHarvestDate", "notes"] as const;
```

#### 3. In the edit form JSX, apply `disabled` based on `editMode`:

```tsx
const editMode = getCropSeasonEditMode(cropSeason.status);
const planOnlyDisabled = editMode !== "all";
const operationalDisabled = editMode !== "operational";
const isLocked = editMode === "none";
```

For each form field:

- `cropName`, `variety`, `expectedHarvestDate` → add `disabled={planOnlyDisabled}`
- `actualHarvestDate`, `notes` → add `disabled={operationalDisabled}`
- When `planOnlyDisabled`, show helper text under the field:
  ```tsx
  {
    planOnlyDisabled && (
      <p className="text-xs text-muted-foreground mt-1">
        Trường này đã khóa sau khi phê duyệt kế hoạch.
      </p>
    );
  }
  ```
- When `isLocked` (completed/cancelled), show `StatusBanner` at the top:
  ```tsx
  <StatusBanner variant="warning">
    Mùa vụ đã kết thúc — không thể chỉnh sửa.
  </StatusBanner>
  ```

#### 4. Remove `plantDate` from update payload:

`plantDate` is NOT a DB column — the current schema includes it by mistake. Remove it from `UpdateCropSeasonBodySchema` if it exists there.

#### 5. 422 error handling in submit:

```tsx
const onSubmit = async (data: UpdateCropSeasonBodyType) => {
  try {
    await updateMutation.mutateAsync(data);
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
      toast.error(error.response?.data.message ?? "Cập nhật thất bại");
      return;
    }
    toast.error("Đã có lỗi xảy ra");
  }
};
```

> Same pattern applies to Milestone edit form and Task edit form — apply the 3-layer field segmentation to each.

#### Milestone edit form segmentation:

| Field | Layer | Editable when |
| --- | --- | --- |
| `stageName`, `expectedStartDate`, `expectedEndDate` | plan_only | status = planning |
| `actualStartDate`, `actualEndDate` | operational | status = **active** only (not just approved) |
| `status` | operational | status ∈ {approved, active} |

For `actualStartDate`/`actualEndDate`, show an extra hint when `cropSeason.status === "approved"` (not yet active):

```tsx
<p className="text-xs text-amber-600 mt-1">
  Chỉ sửa được khi mùa vụ đang hoạt động (active).
</p>
```

#### Task edit form segmentation:

```ts
// For baseline tasks (createdInPlan === true)
const taskPlanOnlyFields = ["title", "description", "priority"];
const taskOperationalFields = [
  "assignedTo",
  "assignedDate",
  "status",
  "completedAt",
  "startDate",
];

// assignedTo is additionally locked when task.status ∈ {completed, verified, cancelled}
const assigneeLocked = ["completed", "verified", "cancelled"].includes(
  task.status,
);
```

---

### Step 1.2 — Tracking field selection panel (F1)

**Location:** `src/pages/ManagerPage/CropSeasons/components/TrackingConfigPanel.tsx` ← **create new file**

This panel is shown inside the CropSeason detail view (attached to the existing Sheet/Drawer pattern), only when `season.status === "planning"`.

#### Component structure:

```tsx
// src/pages/ManagerPage/CropSeasons/components/TrackingConfigPanel.tsx
import { useState } from "react";
import { toast } from "sonner";
import { isApiErrorResponse } from "@/lib/axios";
import {
  useTrackingAvailableFields,
  useTrackingConfigs,
  useReplaceTrackingConfigs,
} from "@/queries/useTracking";
import { getFieldLabel, getEntityTypeLabel } from "@/lib/tracking-display";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog"; // existing shadcn confirm
import { LoadingCard } from "@/components/common/LoadingCard";
import { EmptyState } from "@/components/common/EmptyState";
import type { TrackingEntityType } from "@/schemaValidatation/tracking";

interface TrackingConfigPanelProps {
  cropSeasonId: string;
  readOnly?: boolean; // true when status !== "planning"
}

export default function TrackingConfigPanel({
  cropSeasonId,
  readOnly = false,
}: TrackingConfigPanelProps) {
  const { data: availableData, isLoading: loadingAvailable } =
    useTrackingAvailableFields(cropSeasonId);
  const { data: configData, isLoading: loadingConfig } =
    useTrackingConfigs(cropSeasonId);
  const { mutateAsync: replaceConfigs, isPending } =
    useReplaceTrackingConfigs(cropSeasonId);

  // Local checkbox state: Set of "entityType:fieldName" keys
  const [selected, setSelected] = useState<Set<string>>(() => {
    const activeConfigs = configData?.data.data ?? [];
    return new Set(
      activeConfigs
        .filter((c) => c.isActive)
        .map((c) => `${c.entityType}:${c.fieldName}`),
    );
  });
  // Re-sync when config data loads
  // (use useEffect in real impl if needed to handle async load timing)

  const [showConfirm, setShowConfirm] = useState(false);

  const toggleField = (entityType: string, fieldName: string) => {
    if (readOnly) return;
    const key = `${entityType}:${fieldName}`;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSave = async () => {
    const configs = Array.from(selected).map((key) => {
      const [entityType, fieldName] = key.split(":") as [
        TrackingEntityType,
        string,
      ];
      return { entityType, entityId: null, fieldName };
    });
    try {
      await replaceConfigs({ configs });
      toast.success("Đã lưu cấu hình theo dõi");
      setShowConfirm(false);
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Lưu cấu hình thất bại");
      } else {
        toast.error("Đã có lỗi xảy ra");
      }
    }
  };

  if (loadingAvailable || loadingConfig) return <LoadingCard />;
  if (!availableData?.data?.data?.length) {
    return (
      <EmptyState
        title="Không có trường có thể theo dõi"
        description="Hệ thống chưa cấu hình whitelist theo dõi."
      />
    );
  }

  return (
    <div className="space-y-6">
      {readOnly && (
        <p className="text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-md border border-amber-200">
          Cấu hình theo dõi chỉ có thể thay đổi khi mùa vụ đang ở trạng thái lập
          kế hoạch.
        </p>
      )}

      {availableData.data.data.map((group) => (
        <div
          key={group.entityType}
          className="space-y-2"
        >
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {getEntityTypeLabel(group.entityType)}
          </h4>
          <div className="space-y-2 pl-1">
            {group.fields.map((field) => {
              const key = `${group.entityType}:${field.fieldName}`;
              const isChecked = selected.has(key);
              return (
                <label
                  key={key}
                  className="flex items-center gap-3 cursor-pointer"
                >
                  <Checkbox
                    checked={isChecked}
                    disabled={readOnly}
                    onCheckedChange={() =>
                      toggleField(group.entityType, field.fieldName)
                    }
                  />
                  <span className="text-sm flex-1">
                    {getFieldLabel(field.fieldName)}
                  </span>
                  <Badge
                    variant={
                      field.layer === "plan_only" ? "secondary" : "outline"
                    }
                    className="text-xs"
                  >
                    {field.layer === "plan_only" ? "Kế hoạch" : "Thực tế"}
                  </Badge>
                </label>
              );
            })}
          </div>
        </div>
      ))}

      {!readOnly && (
        <div className="flex justify-end gap-2 pt-2">
          <Button
            variant="default"
            onClick={() => setShowConfirm(true)}
            disabled={isPending}
          >
            Lưu cấu hình
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={showConfirm}
        onOpenChange={setShowConfirm}
        title="Xác nhận lưu cấu hình theo dõi"
        description="Lưu sẽ thay thế toàn bộ cấu hình hiện tại. Các trường bỏ chọn sẽ không còn được theo dõi."
        confirmLabel="Lưu cấu hình"
        onConfirm={handleSave}
        loading={isPending}
      />
    </div>
  );
}
```

#### Integrate into existing CropSeason detail:

In `ManagerCropSeasonsPage.tsx` (or the sheet/panel component for crop season detail):

- Add a new tab/section "Cấu hình theo dõi"
- Render `<TrackingConfigPanel cropSeasonId={id} readOnly={season.status !== "planning"} />`

---

### Step 1.3 — Ad-hoc task badge (F4)

**File:** Task list/card component inside `ManagerCropSeasonsPage` (wherever task items are rendered)

The BE infers `createdInPlan` automatically — FE does NOT send it. The only FE change is **displaying** the badge.

Add the following to each task item render:

```tsx
{
  !task.createdInPlan && (
    <Badge
      variant="secondary"
      className="text-xs bg-purple-100 text-purple-700"
    >
      Công việc phát sinh
    </Badge>
  );
}
```

**Type:** Verify that `task.createdInPlan` is included in the existing task Zod schema. If not, add `createdInPlan: z.boolean().optional()` to the task response schema.

---

## Phase 2 — Owner Plan vs Actual Page

> Core F6 feature. Estimated: **~11h total**.

---

### Step 2.1 — Route registration

**File:** `src/routes/routes.ts`

Add to the Owner routes section:

```ts
import PlanVsActualPage from "@/pages/OwnerPage/CropSeasons/PlanVsActualPage";

// Inside Owner DashboardLayout children:
{
  path: "/dashboard/owner/crop-seasons/:id/plan-vs-actual",
  component: PlanVsActualPage,
  allowedRoles: ["owner", "manager"],
},
```

> `allowedRoles` includes `"manager"` because B7/B8/B9 are accessible to both owner and manager (per [Access Control Matrix in plan-vs-actual.md §Appendix]).

---

### Step 2.2 — PlanVsActualPage.tsx (shell)

**File:** `src/pages/OwnerPage/CropSeasons/PlanVsActualPage.tsx` ← **create new file**

This is the main page shell that:

1. Reads `:id` from URL params
2. Fetches the diff data (B7) and initial log (B8)
3. Renders the KPI row + tabbed content
4. Passes data down to child components

```tsx
// src/pages/OwnerPage/CropSeasons/PlanVsActualPage.tsx
import { useParams } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingCard } from "@/components/common/LoadingCard";
import { EmptyState } from "@/components/common/EmptyState";
import { useTrackingDiff, useTrackingLog } from "@/queries/useTracking";
import KpiSummaryCards from "./components/KpiSummaryCards";
import DiffTable from "./components/DiffTable";
import UnplannedTable from "./components/UnplannedTable";
import TrackingTimeline from "./components/TrackingTimeline";
import type { TrackingLogQueryType } from "@/schemaValidatation/tracking";

const DEFAULT_LOG_QUERY: TrackingLogQueryType = { page: 1, limit: 20 };

function PlanVsActualPage() {
  const { id: cropSeasonId } = useParams<{ id: string }>();

  const {
    data: diffData,
    isLoading: loadingDiff,
    isError: errorDiff,
    refetch: refetchDiff,
  } = useTrackingDiff(cropSeasonId!);

  const { data: logData, isLoading: loadingLog } = useTrackingLog(
    cropSeasonId!,
    DEFAULT_LOG_QUERY,
  );

  if (loadingDiff) return <LoadingCard />;
  if (errorDiff) {
    return (
      <ErrorState
        message="Không thể tải dữ liệu so sánh kế hoạch."
        onRetry={() => refetchDiff()}
      />
    );
  }
  if (!diffData?.data) {
    return (
      <EmptyState
        title="Chưa có dữ liệu so sánh"
        description="Mùa vụ chưa được phê duyệt hoặc chưa có dữ liệu theo dõi."
      />
    );
  }

  const diff = diffData.data;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <Badge className="mb-2">Kế hoạch vs Thực tế</Badge>
        <h1 className="text-2xl font-bold">
          {diff.cropSeason.cropName ?? "Mùa vụ"}
        </h1>
        <p className="text-muted-foreground text-sm">
          So sánh kế hoạch ban đầu và tình hình thực tế
        </p>
      </div>

      {/* KPI summary */}
      <KpiSummaryCards diff={diff} />

      <Separator />

      {/* Main content tabs */}
      <Tabs defaultValue="diff">
        <TabsList>
          <TabsTrigger value="diff">Bảng so sánh</TabsTrigger>
          <TabsTrigger value="timeline">Timeline thay đổi</TabsTrigger>
        </TabsList>

        <TabsContent
          value="diff"
          className="space-y-6 mt-4"
        >
          <DiffTable
            tracked={diff.tracked}
            cropSeasonId={cropSeasonId!}
          />
          {diff.unplanned.length > 0 && (
            <UnplannedTable unplanned={diff.unplanned} />
          )}
        </TabsContent>

        <TabsContent
          value="timeline"
          className="mt-4"
        >
          <TrackingTimeline
            cropSeasonId={cropSeasonId!}
            initialData={logData?.data}
            isLoading={loadingLog}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default PlanVsActualPage;
```

---

### Step 2.3 — VarianceBadge.tsx

**File:** `src/pages/OwnerPage/CropSeasons/components/VarianceBadge.tsx` ← **create new file**

This is a **shared display component** used in `DiffTable` rows. It has no API dependency.

```tsx
// src/pages/OwnerPage/CropSeasons/components/VarianceBadge.tsx
import { Badge } from "@/components/ui/badge";

type VarianceShape = {
  type: "days" | "absolute" | "percent" | "label" | "changed" | "none";
  value?: unknown;
  direction?: "early" | "on-time" | "late" | "lower" | "higher" | "equal";
} | null;

interface VarianceBadgeProps {
  variance: VarianceShape;
  dataType: string;
}

export default function VarianceBadge({
  variance,
  dataType: _dataType,
}: VarianceBadgeProps) {
  if (!variance || variance.type === "none") {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  const { direction, type, value } = variance;

  // late (date overshoot) or higher (numeric above plan) → danger
  if (direction === "late" || direction === "higher") {
    const display = buildValueDisplay(type, value, "+");
    return <Badge variant="destructive">{display}</Badge>;
  }

  // early (date ahead of plan) or lower (numeric below plan) → success
  if (direction === "early" || direction === "lower") {
    const display = buildValueDisplay(type, value, "−");
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        {display}
      </Badge>
    );
  }

  // on-time or equal → neutral
  if (direction === "on-time" || direction === "equal") {
    return (
      <Badge
        variant="outline"
        className="text-muted-foreground"
      >
        Đúng kế hoạch
      </Badge>
    );
  }

  // changed or label without direction → secondary
  return <Badge variant="secondary">Thay đổi</Badge>;
}

function buildValueDisplay(
  type: string,
  value: unknown,
  prefix: string,
): string {
  if (value === null || value === undefined) {
    return prefix === "+" ? "Quá" : "Sớm";
  }
  switch (type) {
    case "days":
      return `${prefix}${value}d`;
    case "percent":
      return `${prefix}${value}%`;
    case "absolute":
      return `${prefix}${value}`;
    default:
      return String(value);
  }
}
```

---

### Step 2.4 — KpiSummaryCards.tsx

**File:** `src/pages/OwnerPage/CropSeasons/components/KpiSummaryCards.tsx` ← **create new file**

Reads the diff response and computes 4 KPI counts client-side:

```tsx
// src/pages/OwnerPage/CropSeasons/components/KpiSummaryCards.tsx
import { KpiCard } from "@/components/common/KpiCard";
import type { TrackingDiffResType } from "@/schemaValidatation/tracking";

interface KpiSummaryCardsProps {
  diff: TrackingDiffResType;
}

// Derive KPIs from the diff response
function computeKpis(diff: TrackingDiffResType) {
  let onTime = 0;
  let late = 0;
  let totalChanges = 0;

  for (const section of diff.tracked) {
    for (const entity of section.entities) {
      for (const field of entity.fields) {
        totalChanges += field.changeCount;
        const dir = field.variance?.direction;
        if (dir === "on-time" || dir === "equal") onTime++;
        else if (dir === "late" || dir === "higher") late++;
      }
    }
  }

  let unplanned = 0;
  for (const section of diff.unplanned) {
    unplanned += section.entities.length;
  }

  return { onTime, late, unplanned, totalChanges };
}

export default function KpiSummaryCards({ diff }: KpiSummaryCardsProps) {
  const { onTime, late, unplanned, totalChanges } = computeKpis(diff);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <KpiCard
        label="Đúng kế hoạch"
        value={onTime}
        tone="success"
        hint="Số trường đúng tiến độ"
      />
      <KpiCard
        label="Trễ / Vượt"
        value={late}
        tone={late > 0 ? "danger" : "default"}
        hint="Số trường trễ hoặc vượt kế hoạch"
      />
      <KpiCard
        label="Phát sinh thêm"
        value={unplanned}
        tone={unplanned > 0 ? "warning" : "default"}
        hint="Số thực thể không có trong kế hoạch ban đầu"
      />
      <KpiCard
        label="Tổng thay đổi"
        value={totalChanges}
        tone="default"
        hint="Tổng số lần thay đổi ghi nhận"
      />
    </div>
  );
}
```

> **Prerequisite:** Verify that `KpiCard` from `@/components/common/KpiCard` accepts `{ label, value, tone, hint }`. Check the existing component signature before writing this. If props differ, adjust accordingly.

---

### Step 2.5 — DiffTable.tsx

**File:** `src/pages/OwnerPage/CropSeasons/components/DiffTable.tsx` ← **create new file**

Renders the tracked entity diff grouped by `entityType`, with an Accordion for each group. Clicking a field row opens the `FieldHistoryModal`.

```tsx
// src/pages/OwnerPage/CropSeasons/components/DiffTable.tsx
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import VarianceBadge from "./VarianceBadge";
import FieldHistoryModal from "./FieldHistoryModal";
import {
  getEntityTypeLabel,
  getFieldLabel,
  formatTrackingValue,
} from "@/lib/tracking-display";
import type {
  TrackingDiffResType,
  TrackingEntityType,
  TrackingDataType,
} from "@/schemaValidatation/tracking";

type TrackedSection = TrackingDiffResType["tracked"][number];

interface DiffTableProps {
  tracked: TrackedSection[];
  cropSeasonId: string;
}

interface FieldHistoryTarget {
  entityType: TrackingEntityType;
  entityId: string;
  fieldName: string;
  dataType: TrackingDataType;
}

export default function DiffTable({ tracked, cropSeasonId }: DiffTableProps) {
  const [historyTarget, setHistoryTarget] = useState<FieldHistoryTarget | null>(
    null,
  );

  if (!tracked.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có dữ liệu so sánh theo dõi.
      </p>
    );
  }

  return (
    <>
      <Accordion
        type="multiple"
        defaultValue={tracked.map((s) => s.entityType)}
      >
        {tracked.map((section) => (
          <AccordionItem
            key={section.entityType}
            value={section.entityType}
          >
            <AccordionTrigger className="text-base font-semibold">
              {getEntityTypeLabel(section.entityType)}
              <Badge
                variant="secondary"
                className="ml-2"
              >
                {section.entities.length}
              </Badge>
            </AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thực thể</TableHead>
                    <TableHead>Trường</TableHead>
                    <TableHead>Kế hoạch</TableHead>
                    <TableHead>Thực tế</TableHead>
                    <TableHead>Sai số</TableHead>
                    <TableHead>Thay đổi</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.entities.flatMap((entity) =>
                    entity.fields.map((field, fi) => (
                      <TableRow
                        key={`${entity.entityId}-${field.fieldName}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          setHistoryTarget({
                            entityType: section.entityType,
                            entityId: entity.entityId,
                            fieldName: field.fieldName,
                            dataType: field.dataType,
                          })
                        }
                      >
                        {/* Show entity ID only on the first field row */}
                        {fi === 0 ? (
                          <TableCell
                            rowSpan={entity.fields.length}
                            className="font-mono text-xs align-top"
                          >
                            {entity.entityId.slice(0, 8)}…
                          </TableCell>
                        ) : null}
                        <TableCell className="text-sm">
                          {getFieldLabel(field.fieldName)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTrackingValue(field.planValue, field.dataType)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTrackingValue(
                            field.actualValue,
                            field.dataType,
                          )}
                        </TableCell>
                        <TableCell>
                          <VarianceBadge
                            variance={field.variance}
                            dataType={field.dataType}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {field.changeCount > 0
                            ? `Thay đổi ${field.changeCount} lần`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistoryTarget({
                                entityType: section.entityType,
                                entityId: entity.entityId,
                                fieldName: field.fieldName,
                                dataType: field.dataType,
                              });
                            }}
                          >
                            Lịch sử
                          </Button>
                        </TableCell>
                      </TableRow>
                    )),
                  )}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {historyTarget && (
        <FieldHistoryModal
          cropSeasonId={cropSeasonId}
          target={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </>
  );
}
```

> **Note on entity names:** Currently the table shows truncated `entityId`. To resolve actual names (e.g., milestone's `stageName`), you need to pass pre-loaded milestone/task lists as `registries` to `resolveEntityName()`. This can be done as a follow-up enhancement — load the milestone list from `useQuery` inside `DiffTable` or pass it as a prop from `PlanVsActualPage`.

---

### Step 2.6 — UnplannedTable.tsx

**File:** `src/pages/OwnerPage/CropSeasons/components/UnplannedTable.tsx` ← **create new file**

Renders entities that were created AFTER the plan was approved (no baseline):

```tsx
// src/pages/OwnerPage/CropSeasons/components/UnplannedTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getEntityTypeLabel,
  getFieldLabel,
  formatTrackingValue,
} from "@/lib/tracking-display";
import { format, parseISO } from "date-fns";
import type { TrackingDiffResType } from "@/schemaValidatation/tracking";

type UnplannedSection = TrackingDiffResType["unplanned"][number];

interface UnplannedTableProps {
  unplanned: UnplannedSection[];
}

export default function UnplannedTable({ unplanned }: UnplannedTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Phát sinh sau kế hoạch
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            {unplanned.reduce((sum, s) => sum + s.entities.length, 0)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loại thực thể</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trường / Giá trị</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unplanned.flatMap((section) =>
              section.entities.map((entity) => (
                <TableRow key={entity.entityId}>
                  <TableCell>
                    <Badge
                      className="bg-purple-100 text-purple-700 text-xs"
                      variant="outline"
                    >
                      {getEntityTypeLabel(section.entityType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {entity.entityId.slice(0, 8)}…
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entity.createdAt
                      ? format(parseISO(entity.createdAt), "dd/MM/yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {entity.fields.map((f) => (
                        <div
                          key={f.fieldName}
                          className="text-xs"
                        >
                          <span className="text-muted-foreground">
                            {getFieldLabel(f.fieldName)}:{" "}
                          </span>
                          <span>
                            {formatTrackingValue(f.actualValue, f.dataType)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )),
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

---

### Step 2.7 — FieldHistoryModal.tsx

**File:** `src/pages/OwnerPage/CropSeasons/components/FieldHistoryModal.tsx` ← **create new file**

Opens as a Dialog when user clicks a diff row. Calls B9 endpoint with pagination.

```tsx
// src/pages/OwnerPage/CropSeasons/components/FieldHistoryModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ProPagination } from "@/components/common/pro-pagination";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { useTrackingFieldHistory } from "@/queries/useTracking";
import {
  getFieldLabel,
  getEntityTypeLabel,
  formatTrackingValue,
} from "@/lib/tracking-display";
import { format, parseISO } from "date-fns";
import type {
  TrackingEntityType,
  TrackingDataType,
} from "@/schemaValidatation/tracking";

interface FieldHistoryModalProps {
  cropSeasonId: string;
  target: {
    entityType: TrackingEntityType;
    entityId: string;
    fieldName: string;
    dataType: TrackingDataType;
  };
  onClose: () => void;
}

export default function FieldHistoryModal({
  cropSeasonId,
  target,
  onClose,
}: FieldHistoryModalProps) {
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useTrackingFieldHistory(cropSeasonId, {
    entityType: target.entityType,
    entityId: target.entityId,
    fieldName: target.fieldName,
    page,
    limit: LIMIT,
  });

  const items = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Lịch sử thay đổi:{" "}
            <span className="font-normal text-muted-foreground">
              {getEntityTypeLabel(target.entityType)} —{" "}
              {getFieldLabel(target.fieldName)}
            </span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <TableSkeleton
            rows={5}
            cols={4}
          />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Chưa có lịch sử thay đổi.
          </p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời điểm</TableHead>
                  <TableHead>Giá trị cũ</TableHead>
                  <TableHead>Giá trị mới</TableHead>
                  <TableHead>Loại thay đổi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">
                      {format(parseISO(item.changedAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTrackingValue(item.oldValueJson, target.dataType)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatTrackingValue(item.newValueJson, target.dataType)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs capitalize"
                      >
                        {item.changeType}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {meta && meta.totalPages > 1 && (
              <ProPagination
                currentPage={page}
                totalPages={meta.totalPages}
                buildHref={(p) => `?page=${p}`}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

> **Check:** Verify `ProPagination` component API — it may use `onPageChange` or URL-based navigation only. Adjust the `buildHref` prop or use a local `useState` pattern if the component doesn't support an `onPageChange` callback.

---

### Step 2.8 — TrackingTimeline.tsx

**File:** `src/pages/OwnerPage/CropSeasons/components/TrackingTimeline.tsx` ← **create new file**

Paginated activity feed of all field changes. Reference the pattern from `DailyLogActivityFeed` component but use `TrackingLogItemType` as the data shape.

```tsx
// src/pages/OwnerPage/CropSeasons/components/TrackingTimeline.tsx
import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { TableSkeleton } from "@/components/common/TableSkeleton";
import { useTrackingLog } from "@/queries/useTracking";
import {
  getEntityTypeLabel,
  getFieldLabel,
  formatTrackingValue,
} from "@/lib/tracking-display";
import type {
  TrackingLogListResType,
  TrackingLogQueryType,
} from "@/schemaValidatation/tracking";

interface TrackingTimelineProps {
  cropSeasonId: string;
  initialData?: TrackingLogListResType; // pre-loaded in parent
  isLoading?: boolean;
}

const PAGE_LIMIT = 20;

export default function TrackingTimeline({
  cropSeasonId,
  initialData,
  isLoading: initialLoading,
}: TrackingTimelineProps) {
  const [page, setPage] = useState(1);
  const query: TrackingLogQueryType = { page, limit: PAGE_LIMIT };

  const { data, isLoading } = useTrackingLog(cropSeasonId, query, page > 1);

  // Use initialData for page 1 (already loaded in parent), own query for subsequent pages
  const activeData = page === 1 ? initialData : data?.data;
  const loading = page === 1 ? initialLoading : isLoading;

  const items = activeData?.data ?? [];
  const meta = activeData?.meta;

  if (loading && items.length === 0)
    return (
      <TableSkeleton
        rows={6}
        cols={3}
      />
    );

  return (
    <div className="space-y-4">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          Chưa có lịch sử thay đổi.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((item, idx) => (
            <div key={item.id}>
              <div className="flex items-start gap-3">
                {/* Time column */}
                <span className="text-xs text-muted-foreground w-32 shrink-0 pt-0.5">
                  {format(parseISO(item.changedAt), "dd/MM HH:mm")}
                </span>

                {/* Content */}
                <div className="flex-1 text-sm">
                  <span className="font-medium">
                    {getEntityTypeLabel(item.entityType)}
                  </span>{" "}
                  —{" "}
                  <span className="text-muted-foreground">
                    {getFieldLabel(item.fieldName)}
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">
                      {formatTrackingValue(item.oldValueJson, item.dataType)}
                    </span>
                    <span className="text-xs">→</span>
                    <span className="font-medium text-xs">
                      {formatTrackingValue(item.newValueJson, item.dataType)}
                    </span>
                  </div>
                </div>

                {/* Source badge */}
                <Badge
                  variant="outline"
                  className="text-xs shrink-0"
                >
                  {item.source === "manual"
                    ? "Thủ công"
                    : (item.source ?? "Hệ thống")}
                </Badge>
              </div>
              {idx < items.length - 1 && <Separator className="mt-3" />}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta && meta.totalItems > PAGE_LIMIT && (
        <div className="flex justify-center gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Trước
          </Button>
          <span className="text-sm text-muted-foreground self-center">
            Trang {page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= meta.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Tiếp →
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

### Step 2.9 — Link from OwnerCropSeasonsPage

**File:** `src/pages/OwnerPage/CropSeasons/OwnerCropSeasonsPage.tsx`

In the crop season detail panel/card, add a button linking to the Plan vs Actual page. Show it only when `season.status !== "planning"` (the page is meaningless before approval):

```tsx
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

// In the season detail action area:
{
  season.status !== "planning" && (
    <Button
      asChild
      variant="outline"
      size="sm"
    >
      <Link to={`/dashboard/owner/crop-seasons/${season.id}/plan-vs-actual`}>
        Kế hoạch vs Thực tế
      </Link>
    </Button>
  );
}
```

Same link should be added in `ManagerCropSeasonsPage.tsx` (managers also have access per `allowedRoles`).

---

## Phase 3 — P2/P3 Supplementary Features

> These features have external dependencies or lower priority. Implement after Phase 0–2 are complete.

---

### Step 3.1 — IoT Swap Modal (F3)

**Priority:** P2 **Blocked by:** Confirm exact endpoint path for B14 with BE team (`POST /crop-seasons/:id/iot-assignments/swap` or another path)

**File:** `src/pages/ManagerPage/CropSeasons/components/IotSwapModal.tsx` ← **create after B14 confirmed**

**Zod schema** (create in `src/schemaValidatation/tracking.ts`):

```ts
export const IotSwapBodySchema = z.object({
  oldAssignmentId: z.string().uuid("ID thiết bị cũ không hợp lệ"),
  newDeviceId: z.string().uuid("ID thiết bị mới không hợp lệ"),
  swapReason: z
    .string()
    .min(10, "Lý do phải có ít nhất 10 ký tự")
    .max(500, "Lý do không quá 500 ký tự"),
});
export type IotSwapBodyType = z.infer<typeof IotSwapBodySchema>;
```

**Form fields:**

1. `oldAssignmentId` — `Select` from existing assignments (`GET .../manager/milestone/:id/assignment`)
2. `newDeviceId` — `Select` from available devices (`GET .../manager/milestone/:id/available`)
3. `swapReason` — `Textarea`, min 10 chars

**Error handling:** Use full 422 pattern with `useForm` + `useClearServerFieldErrors` + `handleApiErrorUnprocessentity`.

**Trigger:** "Thay thiết bị" button on IoT assignment rows, visible when `season.status ∈ {approved, active}`.

---

### Step 3.2 — IoT Device Logs Page (F7)

**Priority:** P3

**File:** `src/pages/OwnerPage/IotDeviceLogs/IotDeviceLogsPage.tsx` ← **create new**

**Route:** `/dashboard/owner/iot-devices/:deviceId/logs`

This page reuses `useTrackingLog` with a pre-filtered query:

```ts
const query: TrackingLogQueryType = {
  entityType: "iot_device_assignment",
  entityId: deviceId,
  page: 1,
  limit: 50,
};
```

Render a `TrackingTimeline`-style list filtered to this device's assignment history.

---

### Step 3.3 — Production Request Snapshot Viewer (P3)

**Priority:** P3

This is a read-only viewer accessible from the production request history list. It shows the immutable plan snapshot captured at approve time.

**File:** `src/pages/OwnerPage/CropSeasons/components/ProductionRequestSnapshotViewer.tsx`

**Data flow:**

1. Render list of production requests (already exists in `OwnerCropSeasonsPage`)
2. Click "Xem snapshot" → call `useProductionRequestSnapshot(cropSeasonId, requestId)`
3. Display `payload` as a structured JSON-like tree using a `pre` or formatted card layout
4. For diff between two snapshots (B6), allow selecting two requests and call `useProductionRequestDiff`

---

## Validation Checklist

Run these checks after each Phase:

### After Phase 0 (Infrastructure):

```bash
pnpm lint    # No ESLint errors
pnpm build   # TypeScript builds clean (tsc -b)
```

Manual checks:

- [ ] `API_ENDPOINTS.TRACKING` has all 7 keys (AVAILABLE_FIELDS, CONFIGS, DIFF, TRACKING_LOG, FIELD_HISTORY, REQUEST_SNAPSHOT, REQUEST_DIFF)
- [ ] `QUERY_KEYS.tracking` has all 7 factory functions
- [ ] `src/schemaValidatation/tracking.ts` exports all 18 schemas/types
- [ ] `src/services/trackingService.ts` exports `trackingService` with 7 methods
- [ ] `src/queries/useTracking.ts` exports 7 hooks
- [ ] `src/lib/error-message.ts` has all 9 new keys
- [ ] `src/lib/tracking-display.ts` exports `FIELD_LABEL_MAP`, `ENTITY_TYPE_LABEL`, `resolveEntityName`, `formatTrackingValue`

### After Phase 1 (Manager Forms):

- [ ] CropSeason edit form: plan-only fields are `disabled` when `status ∈ {approved, active}`
- [ ] CropSeason edit form: `plantDate` is NOT in the update payload
- [ ] Milestone edit form: `actualStartDate`/`actualEndDate` disabled when `status !== "active"`
- [ ] Task edit form: baseline task plan-only fields are disabled after approve
- [ ] Task list: ad-hoc tasks (`createdInPlan === false`) show purple "Công việc phát sinh" badge
- [ ] `TrackingConfigPanel` renders grouped checkboxes correctly
- [ ] `TrackingConfigPanel` shows read-only banner when `status !== "planning"`
- [ ] 422 errors from locked fields are displayed as toasts with Vietnamese messages

### After Phase 2 (Plan vs Actual Page):

- [ ] Route `/dashboard/owner/crop-seasons/:id/plan-vs-actual` is accessible
- [ ] `PlanVsActualPage` loads and shows KPI cards + diff table
- [ ] `DiffTable` accordion expands to show entity rows
- [ ] `VarianceBadge` correctly colors: red=late/higher, green=early/lower, neutral=on-time/equal
- [ ] Clicking a diff row opens `FieldHistoryModal`
- [ ] `FieldHistoryModal` paginates correctly with B9
- [ ] `TrackingTimeline` tab shows log entries
- [ ] Link from `OwnerCropSeasonsPage` to Plan vs Actual page appears for `status !== "planning"`
- [ ] Page returns `ErrorState` when B7 call fails (simulate by revoking auth)
- [ ] Page returns `EmptyState` when `diff.tracked` is empty

### Common patterns to verify (from form-error-and-date-handling.md):

- [ ] Every `useForm` call is followed by `useClearServerFieldErrors(form)`
- [ ] Every `DatePickerField` uses `Controller`, not `register`
- [ ] All dates sent to API are converted with `toISO(v)` or `toISOOrNull(v)`
- [ ] All dates received from API are parsed with `parseBackendDate(value)` before `format()`
- [ ] No form field is missing the `error={form.formState.errors.field?.message}` prop
