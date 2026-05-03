# Module 5 — Plan vs Actual Tracking: UX/UI Design Specification

> **Author:** Senior UI/UX Designer  
> **Date:** 2026-05-03  
> **Design System:** Shadcn/ui (New York variant) · Tailwind v4 · Vietnamese locale  
> **Audience:** Frontend developers implementing Module 5 screens

---

## Table of Contents

1. [Design System Reference](#1-design-system-reference)
2. [User Journeys](#2-user-journeys)
3. [F1 — Tracking Field Configuration Panel (Manager)](#3-f1--tracking-field-configuration-panel)
   - [3.4 F5 — Config Toggle post-approve (pending B4)](#34-f5--config-toggle-per-field-post-approve--pending-be-b4)
4. [F2 — Field Locking in Edit Forms](#4-f2--field-locking-in-edit-forms)
5. [F4 — Ad-hoc Task Badge & Creation](#5-f4--ad-hoc-task-badge--creation)
   - [5.5 F3 — IoT Swap Modal (P2)](#55-f3--iot-swap-modal-p2)
6. [F6 — Plan vs Actual Page (Owner)](#6-f6--plan-vs-actual-page-owner)
   - [6.8 Entity Name Resolution Pattern](#68-entity-name-resolution-pattern)
7. [FieldHistoryModal](#7-fieldhistorymodal)
8. [TrackingTimeline](#8-trackingtimeline)
9. [Micro-components Spec](#9-micro-components-spec)
10. [States Catalogue (Empty · Loading · Error)](#10-states-catalogue)
11. [Responsive Behavior](#11-responsive-behavior)
12. [Accessibility Notes](#12-accessibility-notes)
13. [Production Request Snapshot Viewer (B5/B6)](#13-production-request-snapshot-viewer-b5--b6)
14. [F7 — IoT Device Logs Page (P3)](#14-f7--iot-device-logs-page-p3)

- [Appendix A — Component File Map](#appendix-a--component-file-map)
- [Appendix B — Interaction Flow Diagram](#appendix-b--interaction-flow-diagram)

---

## 1. Design System Reference

### 1.1 Color Tokens (from `KpiCard`, `StatusBanner`, `CropSeasonDetailPanel`)

| Semantic | Tailwind class | Usage in Module 5 |
| --- | --- | --- |
| **On-time / success** | `text-emerald-600` · `bg-emerald-50` · `border-emerald-200` | Variance direction `"early"` / `"lower"` / `"on-time"` / `"equal"` |
| **Late / danger** | `text-destructive` · `bg-red-50` · `border-red-200` | Variance direction `"late"` / `"higher"` |
| **Warning / locked** | `text-amber-600` · `bg-amber-50` · `border-amber-200` | `StatusBanner` on plan-locked fields |
| **Info / passive** | `text-blue-600` · `bg-blue-50` · `border-blue-200` | Post-approve config read-only banner |
| **Unplanned** | `text-violet-700` · `bg-violet-50` · `border-violet-200` | Entities created after approve (`unplanned` section) |
| **Plan-layer badge** | `bg-sky-100 text-sky-800` | `[Kế hoạch]` layer badge on field rows |
| **Operational-layer badge** | `bg-teal-100 text-teal-800` | `[Thực tế]` layer badge on field rows |
| **Muted / no-change** | `text-muted-foreground` | `—` when variance.type === "none" |

### 1.2 Typography scale

| Element | Class |
| --- | --- |
| Page title | `text-2xl font-semibold tracking-tight` |
| Section heading | `text-sm uppercase tracking-wide text-muted-foreground font-semibold` |
| Table header | `text-xs uppercase tracking-wide text-muted-foreground` |
| Body / cell | `text-sm` |
| Caption / hint | `text-xs text-muted-foreground` |
| KPI value | `text-2xl font-semibold` (from `KpiCard`) |

### 1.3 Spacing & layout

- Outer page padding: `p-4 md:p-6 lg:p-8`
- Card gap: `gap-4`
- Section vertical rhythm: `space-y-6`
- Table cell padding: `px-4 py-2` (compact), `px-4 py-3` (default)
- Sidebar sheet width: `w-96` (same as existing CropSeason create sheet)

### 1.4 Status badge map (reuse existing `SEASON_STATUS_MAP` pattern)

```
planning     → Badge variant="secondary"     "Lên kế hoạch"
sent         → Badge variant="default"       "Đã gửi"
approved     → Badge variant="default"       "Đã duyệt"
active       → Badge className="bg-emerald-100 text-emerald-800"  "Đang hoạt động"
completed    → Badge variant="outline"       "Hoàn thành"
cancelled    → Badge variant="destructive"   "Đã hủy"
```

---

## 2. User Journeys

### 2.1 Manager journey (before / during / after approve)

```
BEFORE APPROVE (status = planning)
─────────────────────────────────
Manager opens CropSeason create/edit sheet
  └─ "Trường theo dõi" collapsible section appears at the bottom
       └─ Checkbox tree grouped by entity type
       └─ Layer badges [Kế hoạch] / [Thực tế] on each row
       └─ "Lưu cấu hình" → PUT tracking/configs → success toast

Manager edits CropSeason fields
  └─ ALL fields editable (planning phase)
  └─ No lock banners visible

Manager sends production request → Owner approves
  └─ Backend atomically creates snapshot + TrackingPlanSnapshot[]

AFTER APPROVE (status = approved / active)
──────────────────────────────────────────
Manager opens CropSeason edit
  └─ Plan-only fields: DISABLED with lock icon + amber StatusBanner
  └─ Operational fields: ENABLED (if status = active)

Manager opens tracking config panel
  └─ StatusBanner info: "Cấu hình theo dõi đã khóa sau khi phê duyệt"
  └─ All checkboxes disabled

Manager creates a new Task (status = active)
  └─ No createdInPlan field sent — BE infers ad-hoc automatically
  └─ Created task shows [Công việc phát sinh] violet badge

Manager reassigns IoT device on a milestone (status = active)
  └─ "Thay thiết bị IoT" button triggers F3 IoT Swap Modal
  └─ Select new device + enter swapReason → confirm → PATCH endpoint
```

### 2.2 Owner journey

```
Owner lands on CropSeason detail (level 3 nav)
  └─ "Kế hoạch vs Thực tế" tab appears (only when status ≠ planning)
  └─ Click tab → navigate to /plan-vs-actual route

Plan vs Actual Page loads:
  1. CropSeason header (name, status badge, approve date, expected harvest)
  2. KPI row: on-track / late / unplanned / total changes
  3. Tabs: "So sánh" | "Timeline"

"So sánh" tab (default):
  └─ Accordion by entity type (Milestone / Task / CropSeason / Harvest)
      └─ Each entity row → expand to see tracked fields
      └─ Each field row: Plan value | Actual value | VarianceBadge
      └─ Click on field row → FieldHistoryModal opens

"Timeline" tab:
  └─ Date range filter (from/to DatePickerField)
  └─ Entity type filter dropdown
  └─ TrackingTimeline activity feed
  └─ Paginated with ProPagination

Owner views production request history:
  └─ "Lịch sử phê duyệt" button → ProductionRequestSnapshotViewer
  └─ Shows immutable plan snapshot (B5 endpoint)
  └─ Compare two approve versions side-by-side (B6 diff endpoint)
```

### 2.3 Manager journey — Plan vs Actual access

Managers can also view the Plan vs Actual page (B7/B8/B9 allow `manager` role).

```
Manager opens ManagerCropSeasonsPage
  └─ CropSeason detail (level 3 nav in ManagerPage)
       └─ "Kế hoạch vs Thực tế" tab (same condition: status ≠ planning)
            └─ Same PlanVsActualPage component re-used
            └─ Manager sees same DiffTable + Timeline
            └─ No edit actions from this view

---

## 3. F1 — Tracking Field Configuration Panel

### 3.1 Trigger & placement

Embedded as a collapsible `Accordion` item at the bottom of the CropSeason create/edit `Sheet`.
Only visible when `cropSeason.id` is available (after the crop season has been created/saved).

```

SheetContent (w-96) ├── SheetHeader │ ├── SheetTitle "Mùa vụ — [Tên giống]" │ └── SheetDescription "Cập nhật thông tin mùa vụ" │ ├── CropSeasonFormFields ← existing form │ └─ cropName, variety, expectedHarvestDate… │ ├── ── Separator ── │ └── Accordion "Cấu hình theo dõi" ← NEW └── AccordionContent ├── [StatusBanner if locked] └── TrackingConfigPanel

```

### 3.2 Panel wireframe (status = planning, fields loaded)

```

┌─────────────────────────────────────────────────────────────┐ │ ⚙ Chọn trường theo dõi [∧ Thu gọn]│ │ Hệ thống sẽ ghi lại lịch sử thay đổi cho các trường này. │ │ │ │ ── Mùa vụ (Crop Season) ─────────────────────────────────── │ │ ☑ Tên giống [Kế hoạch] │ │ ☑ Ngày thu hoạch dự kiến [Kế hoạch] │ │ ☐ Ngày thu hoạch thực tế [Thực tế] │ │ ☐ Ghi chú [Thực tế] │ │ │ │ ── Giai đoạn sản xuất (Milestone) ──────────────────────── │ │ ☑ Ngày bắt đầu thực tế [Thực tế] │ │ ☑ Ngày kết thúc thực tế [Thực tế] │ │ ☑ Trạng thái [Thực tế] │ │ ☐ Tên giai đoạn [Kế hoạch] │ │ │ │ ── Công việc (Task) ─────────────────────────────────────── │ │ ☑ Người thực hiện [Thực tế] │ │ ☑ Trạng thái [Thực tế] │ │ ☐ Tiêu đề [Kế hoạch] │ │ ☐ Mức độ ưu tiên [Kế hoạch] │ │ │ │ ── Thu hoạch (Harvest) ──────────────────────────────────── │ │ ☑ Ngày thu hoạch [Thực tế] │ │ ☑ Sản lượng [Thực tế] │ │ ☐ Chất lượng [Thực tế] │ │ │ │ [Hủy] [💾 Lưu cấu hình] │ └─────────────────────────────────────────────────────────────┘

```

**Component details:**

| Part | Component | Notes |
| --- | --- | --- |
| Container | `Accordion` + `AccordionItem` | Default closed; auto-open if no configs yet saved |
| Section header | `p` with `text-[11px] uppercase tracking-wide text-muted-foreground font-semibold` | Same style as `MilestoneIotDetail` |
| Each field row | `div.flex.items-center.justify-between` | `Checkbox` (left) + field label + layer `Badge` (right) |
| Layer badge | `Badge` | `bg-sky-100 text-sky-800` for `plan_only`; `bg-teal-100 text-teal-800` for `operational` |
| Save button | `Button` (default) with `Save` icon | Disabled while `replaceConfigs` mutation is pending |
| Cancel button | `Button variant="ghost"` | Resets checkbox state to last saved |

**Confirm dialog before save** (when removing previously active fields):

```

┌────────────────────────────────────────────┐ │ ⚠️ Xác nhận thay đổi cấu hình? │ │ │ │ Hành động này sẽ xóa 2 trường theo dõi │ │ hiện tại và thêm 1 trường mới. │ │ Lịch sử đã ghi không bị mất. │ │ │ │ [Hủy] [Xác nhận thay đổi] │ └────────────────────────────────────────────┘

```

### 3.3 Panel wireframe (status ≠ planning — read-only after approve)

```

┌─────────────────────────────────────────────────────────────┐ │ ⚙ Cấu hình theo dõi [∧ Thu gọn] │ │ │ │ ┌─────────────────────────────────────────────────────────┐ │ │ │ ℹ Cấu hình đã khóa sau khi phê duyệt kế hoạch. │ │ │ │ Liên hệ quản lý hệ thống nếu cần điều chỉnh. │ │ │ └─────────────────────────────────────────────────────────┘ │ │ │ │ ── Đang theo dõi (3 trường) ─────────────────────────────── │ │ 🔒 Ngày kết thúc thực tế [Thực tế] │ │ 🔒 Trạng thái giai đoạn [Thực tế] │ │ 🔒 Người thực hiện công việc [Thực tế] │ └─────────────────────────────────────────────────────────────┘

```

`StatusBanner variant="info"` + all rows show `Lock` icon instead of `Checkbox`. No save button.

### 3.4 F5 — Config Toggle per-field (post-approve) ⚠️ Pending BE B4

> **Status: Blocked — requires BE endpoint B4 (`PATCH /tracking/configs/:id/toggle`) which is not yet built.**
> Design this speculatively so FE implementation can proceed once B4 is available.

When B4 endpoint is available, the read-only locked panel (§3.3) upgrades to a **per-field toggle panel** that allows the Manager to enable/disable individual tracked fields after approval:

```

┌─────────────────────────────────────────────────────────────┐ │ ⚙ Cấu hình theo dõi (sau phê duyệt) [∧ Thu gọn] │ │ │ │ ┌─────────────────────────────────────────────────────────┐ │ │ │ ℹ Cấu hình đã khóa sau phê duyệt. Thay đổi sẽ áp │ │ │ │ dụng cho các bản ghi mới — lịch sử không bị mất. │ │ │ └─────────────────────────────────────────────────────────┘ │ │ │ │ ── Đang theo dõi ────────────────────────────────────────── │ │ Ngày kết thúc thực tế [Thực tế] ●──○ [BẬT] │ │ Trạng thái giai đoạn [Thực tế] ●──○ [BẬT] │ │ Người thực hiện công việc [Thực tế] ○──● [TẮT] │ │ Tên giai đoạn [Kế hoạch] 🔒 (không đổi được)│ └─────────────────────────────────────────────────────────────┘

```

**Component details:**

| Part | Component | Notes |
| --- | --- | --- |
| Toggle | `Switch` | Controlled by per-field `PATCH /tracking/configs/:id/toggle` (B4) |
| Plan-only fields | `Lock` icon + disabled row | `plan_only` fields cannot be toggled post-approve |
| Optimistic update | `useMutation` with `onMutate` rollback | Toggle immediately, revert on error |
| Error toast | `toast({ variant: "destructive" })` | On B4 failure |

**Disable condition:** Fields with `layer === "plan_only"` always show a lock icon and cannot be toggled (they are baseline — changing them post-approve would corrupt plan integrity).

---

## 4. F2 — Field Locking in Edit Forms

### 4.1 Visual treatment for locked plan-only fields

When `season.status ∈ {approved, active, completed}`, plan-only fields switch to a **read-only display** style:

```

┌─ Chỉnh sửa giai đoạn ──────────────────────────────────────┐ │ │ │ Tên giai đoạn │ │ ┌─────────────────────────────────────────────┐ │ │ │ 🔒 Làm đất & chuẩn bị │ │ │ └─────────────────────────────────────────────┘ │ │ Trường kế hoạch — không thể sửa sau khi phê duyệt. │ │ │ │ Ngày bắt đầu kế hoạch │ │ ┌─────────────────────────────────────────────┐ │ │ │ 🔒 20/04/2026 │ │ │ └─────────────────────────────────────────────┘ │ │ │ │ ───────────────────────────────────────────────────────── │ │ [Trường thực tế — chỉnh sửa được] │ │ │ │ Ngày bắt đầu thực tế ← ENABLED when active │ │ ┌─────────────────────────────────────────────┐ │ │ │ 📅 Chọn ngày... │ │ │ └─────────────────────────────────────────────┘ │ │ │ │ Ngày kết thúc thực tế │ │ ┌─────────────────────────────────────────────┐ │ │ │ 📅 13/05/2026 │ │ │ └─────────────────────────────────────────────┘ │ │ │ │ [Hủy] [Lưu thay đổi] │ └─────────────────────────────────────────────────────────────┘

````

### 4.2 Locked field styling

```tsx
// Locked field display — replace <Input> with a read-only div
<div className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
  <Lock className="h-3.5 w-3.5 shrink-0" />
  <span>{displayValue}</span>
</div>
<p className="text-xs text-muted-foreground mt-1">
  Trường kế hoạch — không thể sửa sau khi phê duyệt.
</p>
````

### 4.3 Operational fields requiring `active` status

For `actualStartDate` / `actualEndDate` on milestones when `status === "approved"` (not yet active):

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠  Cần kích hoạt mùa vụ                                    │
│    Ngày thực tế chỉ sửa được khi mùa vụ đang hoạt động.    │
│    Hãy chuyển mùa vụ sang trạng thái "Đang hoạt động".     │
└─────────────────────────────────────────────────────────────┘
  Ngày kết thúc thực tế
  ┌─────────────────────────────────────────────┐
  │  📅  Chọn ngày...                          │  (disabled)
  └─────────────────────────────────────────────┘
```

`StatusBanner variant="warning"` above the disabled field, no CTA button.

### 4.4 Banner placement within forms

```
SheetContent
├── FormFields (plan-only — disabled)
│   ├── [lock input]
│   └── [lock input]
├── ── Separator ──
├── StatusBanner variant="warning"           ← amber banner
│   title="Trường kế hoạch đã khóa"
│   description="Chỉ có thể chỉnh trường thực tế sau khi phê duyệt."
├── FormFields (operational — enabled)
│   ├── [editable input]
│   └── [editable input]
└── SheetFooter
    └── [Lưu thay đổi] Button
```

---

## 5. F4 — Ad-hoc Task Badge & Creation

### 5.1 Task list with ad-hoc indicator

In the task list table (inside Milestone detail), ad-hoc tasks appear with a distinct badge:

```
┌───────┬──────────────────────────┬───────────────┬─────────────┐
│  #    │  Công việc               │  Trạng thái   │  Người làm  │
├───────┼──────────────────────────┼───────────────┼─────────────┤
│  1    │  Phun thuốc trừ sâu     │  Đang làm     │  Nguyễn A   │
│       │  ● Kế hoạch              │               │             │
├───────┼──────────────────────────┼───────────────┼─────────────┤
│  2    │  Kiểm tra độ ẩm đất     │  Hoàn thành   │  Trần B     │
│       │  ● Kế hoạch              │               │             │
├───────┼──────────────────────────┼───────────────┼─────────────┤
│  3    │  Bổ sung phân bón khẩn  │  Chờ xử lý   │  —          │
│       │  🟣 Phát sinh            │               │             │
└───────┴──────────────────────────┴───────────────┴─────────────┘
```

**Ad-hoc badge:** `Badge className="bg-violet-100 text-violet-800 border-violet-200"` with text "Phát sinh".  
**Plan badge:** `Badge variant="secondary"` with text "Kế hoạch".

### 5.2 Task creation form (when season = active)

```
┌─ Thêm công việc ────────────────────────────────────────────┐
│                                                             │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 🟣  Công việc phát sinh                                 │ │
│ │     Mùa vụ đang hoạt động — công việc mới sẽ được       │ │
│ │     đánh dấu là "Phát sinh sau kế hoạch" tự động.       │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  Tiêu đề *                                                  │
│  ┌─────────────────────────────────────────────┐           │
│  │  Nhập tiêu đề công việc...                  │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Mô tả                                                      │
│  ┌─────────────────────────────────────────────┐           │
│  │  Mô tả chi tiết...                          │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│  Người thực hiện                                            │
│  ┌─────────────────────────────────────────────┐           │
│  │  Chọn nhân viên...                ▾          │           │
│  └─────────────────────────────────────────────┘           │
│                                                             │
│                            [Hủy]  [+ Thêm công việc]       │
└─────────────────────────────────────────────────────────────┘
```

Info `StatusBanner` (violet tone — use `variant="info"` with custom `icon={Sparkles}`) at the top. No `priority` or baseline fields — they are operationally irrelevant for ad-hoc tasks.

---

## 5.5. F3 — IoT Swap Modal (P2)

Triggered by a **"Thay thiết bị IoT"** button on a Milestone's IoT assignment detail (inside `MilestoneIotDetail`). Only visible when `cropSeason.status === "active"` and the milestone currently has an assigned device.

> **Dependency:** Requires BE endpoint B14 (`PATCH /milestones/:id/iot-assignment/swap`). Confirm exact path with BE team before implementation.

### 5.5.1 Modal wireframe

```
┌─ Dialog (max-w-md) ──────────────────────────────────────────┐
│                                                              │
│  🔄  Thay thiết bị IoT                           [✕ Đóng]   │
│  Giai đoạn: M1 — Làm đất & chuẩn bị                         │
│                                                              │
│  Thiết bị hiện tại                                           │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  📡  Sensor-A01 (đang gán từ 20/04/2026)                ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Thiết bị mới *                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Chọn thiết bị thay thế...                    ▾          ││
│  └─────────────────────────────────────────────────────────┘│
│  Chỉ hiển thị thiết bị chưa gán (available).                │
│                                                              │
│  Lý do thay thế *                                            │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  Nhập lý do thay thiết bị...                            ││
│  │                                                         ││
│  └─────────────────────────────────────────────────────────┘│
│  Tối thiểu 10 ký tự.                                        │
│                                                              │
│                         [Hủy]   [🔄 Xác nhận thay thế]      │
└──────────────────────────────────────────────────────────────┘
```

### 5.5.2 Component details

| Part | Component | Notes |
| --- | --- | --- |
| Shell | `Dialog` · `DialogContent className="max-w-md"` |  |
| Current device | Read-only `div` with `Radio` icon, device name + assigned-since date | Loaded from existing milestone IoT assignment |
| New device selector | `Select` / `Combobox` | Options from `GET /iot-devices?status=available` — filter out already-assigned devices |
| Reason field | `Textarea` with `minLength={10}` Zod validation | `z.string().min(10, "Nhập tối thiểu 10 ký tự")` |
| Submit | `Button` disabled while mutation pending | Calls B14 `PATCH` with `{ newDeviceId, swapReason }` |
| Success | Close modal + toast "Đã thay thiết bị thành công" + invalidate milestone query |  |
| Error | `toast({ variant: "destructive" })` with server message |  |

### 5.5.3 Form schema

```ts
const IotSwapSchema = z.object({
  newDeviceId: z.string().uuid("Vui lòng chọn thiết bị"),
  swapReason: z.string().min(10, "Nhập tối thiểu 10 ký tự"),
});
type IotSwapFormValues = z.infer<typeof IotSwapSchema>;
```

---

## 6. F6 — Plan vs Actual Page (Owner)

### 6.1 Route & navigation

**Access:** Inside `CropSeasonDetailPanel.tsx`, add a "Kế hoạch vs Thực tế" tab alongside existing "Yêu cầu sản xuất" and "Giai đoạn".

The tab navigates to `/dashboard/owner/crop-seasons/:id/plan-vs-actual` or can be rendered inline as a `TabsContent` panel.

> **Navigation note:** If inline tab is used, the OwnerPage nav state must support `level: 3.5` or add `trackingView` flag to existing level-3 state. The simpler approach is a dedicated route.

### 6.2 Full page layout

```
┌─ Breadcrumb ────────────────────────────────────────────────┐
│  Mùa vụ  /  Khu vực A  /  Rice ST25  /  Kế hoạch vs Thực tế│
└─────────────────────────────────────────────────────────────┘

┌─ Page Header ───────────────────────────────────────────────┐
│  ← Quay lại                                                 │
│                                                             │
│  Rice ST25                   [Đang hoạt động] [active]      │
│  📅 Phê duyệt: 20/04/2026   🌾 Thu hoạch dự kiến: 15/08/2026│
└─────────────────────────────────────────────────────────────┘

┌─ KPI Row (4 cards) ─────────────────────────────────────────┐
│ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐│
│ │ ✅ Đúng hạn│ │ 🔴 Trễ    │ │ 🟣 Phát sinh│ │ ✏ Thay đổi││
│ │     12     │ │     3      │ │      2     │ │     47     ││
│ │ trường     │ │ trường     │ │ thực thể   │ │ lần ghi    ││
│ └────────────┘ └────────────┘ └────────────┘ └────────────┘│
│ tone=success   tone=danger   tone=default    tone=default   │
└─────────────────────────────────────────────────────────────┘

┌─ Tabs ──────────────────────────────────────────────────────┐
│ [So sánh kế hoạch / thực tế]  [Timeline thay đổi]           │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 "So sánh" tab — DiffTable layout

```
Tab: So sánh
│
│ ┌─ Filter Bar ──────────────────────────────────────────┐
│ │ Loại thực thể: [Tất cả ▾]   Sai số: [Tất cả ▾]      │
│ └───────────────────────────────────────────────────────┘
```

**Filter option values:**

| Filter | Options | Notes |
| --- | --- | --- |
| Loại thực thể | Tất cả / Mùa vụ / Giai đoạn / Công việc / Thu hoạch / Thiết bị IoT | Maps to `entityType` values in `TrackedEntityDiffSchema` — applied client-side after B7 response |
| Sai số | Tất cả / Trễ / Đúng tiến độ / Sớm / Phát sinh | Derived from `variance.direction` on each field row. `"Phát sinh"` = entity appears in unplanned section. Applied client-side — B7 has no server-side filter param for this |

```
│
│ ╔══ Accordion: Giai đoạn sản xuất (Production Milestone) ═╗
│ ║                                              [∨ Mở rộng]║
│ ╠══════════════════════════════════════════════════════════╣
│ ║  Entity: M1 — Làm đất & chuẩn bị                        ║
│ ║  ┌────────────┬────────────┬────────────┬──────────────┐ ║
│ ║  │ Trường     │ Kế hoạch   │ Thực tế    │ Sai số       │ ║
│ ║  ├────────────┼────────────┼────────────┼──────────────┤ ║
│ ║  │actualEndDt │ 10/05/2026 │ 13/05/2026 │ [+3d 🔴]     │ ║
│ ║  │ (thay đổi 2 lần · lần cuối 12/05 08:00) [Xem lịch sử]│ ║
│ ║  ├────────────┼────────────┼────────────┼──────────────┤ ║
│ ║  │ Trạng thái │ pending    │ in_progress│ [Thay đổi]   │ ║
│ ║  │ (thay đổi 1 lần · lần cuối 01/05 08:00) [Xem lịch sử]│ ║
│ ║  └────────────┴────────────┴────────────┴──────────────┘ ║
│ ║                                                          ║
│ ║  Entity: M2 — Gieo hạt                                   ║
│ ║  ┌────────────┬────────────┬────────────┬──────────────┐ ║
│ ║  │actualEndDt │ 25/05/2026 │ —          │ [—]          │ ║
│ ║  └────────────┴────────────┴────────────┴──────────────┘ ║
│ ╚══════════════════════════════════════════════════════════╝
│
│ ╔══ Accordion: Công việc (Employee Task) ══════════════════╗
│ ║  [Xem 4 công việc]                        [∨ Mở rộng]   ║
│ ╠══════════════════════════════════════════════════════════╣
│ ║  [table rows...]                                         ║
│ ╚══════════════════════════════════════════════════════════╝
│
│ ╔══ Thực thể phát sinh sau kế hoạch ══════════════════════╗
│ ║  🟣 Phát sinh — sau khi phê duyệt                       ║
│ ╠══════════════════════════════════════════════════════════╣
│ ║  Employee Task: Bổ sung phân bón khẩn                   ║
│ ║  Tạo lúc: 02/06/2026 07:00                              ║
│ ║  ┌──────────────────┬────────────────────────────────┐   ║
│ ║  │ Trường           │ Giá trị hiện tại               │   ║
│ ║  ├──────────────────┼────────────────────────────────┤   ║
│ ║  │ Trạng thái       │ completed                      │   ║
│ ║  └──────────────────┴────────────────────────────────┘   ║
│ ╚══════════════════════════════════════════════════════════╝
```

### 6.4 Table row detail

Each tracked field row expands to show:

```
├── [field name]  [plan value]  [actual value]  [VarianceBadge]
│   └── sub-row (xs text, muted): "Thay đổi 2 lần · lần cuối 12/05/2026 08:00 · [Xem lịch sử ›]"
```

**"Xem lịch sử"** is a `Button variant="link" size="sm"` that opens `FieldHistoryModal`.

### 6.5 Field name localization map

Display human-readable Vietnamese names for technical `fieldName` values:

```ts
const FIELD_LABEL_MAP: Record<string, string> = {
  // CropSeason
  cropName: "Tên giống",
  variety: "Giống cây trồng",
  expectedHarvestDate: "Ngày thu hoạch dự kiến",
  actualHarvestDate: "Ngày thu hoạch thực tế",
  notes: "Ghi chú",
  status: "Trạng thái",
  // Milestone
  stageName: "Tên giai đoạn",
  milestoneOrder: "Thứ tự",
  expectedStartDate: "Ngày bắt đầu kế hoạch",
  expectedEndDate: "Ngày kết thúc kế hoạch",
  actualStartDate: "Ngày bắt đầu thực tế",
  actualEndDate: "Ngày kết thúc thực tế",
  // Task
  title: "Tiêu đề",
  description: "Mô tả",
  priority: "Mức độ ưu tiên",
  assignedTo: "Người thực hiện",
  assignedDate: "Ngày phân công",
  completedAt: "Ngày hoàn thành",
  startDate: "Ngày bắt đầu",
  // Harvest
  harvestDate: "Ngày thu hoạch",
  quantity: "Sản lượng",
  unit: "Đơn vị",
  qualityGrade: "Chất lượng",
  // IoT
  iotDeviceId: "Thiết bị IoT",
  assignedAt: "Ngày gán thiết bị",
  unassignedAt: "Ngày tháo thiết bị",
  sensorBinding: "Liên kết cảm biến",
};
```

### 6.6 Entity type section header map

```ts
const ENTITY_TYPE_LABEL: Record<string, string> = {
  crop_season: "Mùa vụ",
  production_milestone: "Giai đoạn sản xuất",
  employee_task: "Công việc",
  harvest_record: "Thu hoạch",
  iot_device_assignment: "Thiết bị IoT",
};
```

### 6.7 "Timeline thay đổi" tab layout

```
Tab: Timeline thay đổi
│
│ ┌─ Filter Bar ──────────────────────────────────────────────┐
│ │ Từ: [📅 dd/mm/yyyy]  Đến: [📅 dd/mm/yyyy]                │
│ │ Loại: [Tất cả ▾]   Trường: [Tất cả ▾]                   │
│ └───────────────────────────────────────────────────────────┘
│
│ ┌─ Activity Feed ──────────────────────────────────────────┐
│ │                                                          │
│ │  ● 12/05/2026 — 08:00                                   │
│ │  ┌─────────────────────────────────────────────────┐    │
│ │  │ 👤 Nguyễn Văn A                                 │    │
│ │  │ Milestone "Làm đất": actualEndDate              │    │
│ │  │ 10/05/2026 → 13/05/2026                         │    │
│ │  │ [update] [Giai đoạn]                    3 phút  │    │
│ │  └─────────────────────────────────────────────────┘    │
│ │                                                          │
│ │  ● 01/05/2026 — 08:00                                   │
│ │  ┌─────────────────────────────────────────────────┐    │
│ │  │ 🤖 Hệ thống                                     │    │
│ │  │ Milestone "Làm đất": status                     │    │
│ │  │ pending → in_progress                           │    │
│ │  │ [update] [Giai đoạn]                  2 ngày    │    │
│ │  └─────────────────────────────────────────────────┘    │
│ │                                                          │
│ │  [Xem thêm — trang 2/5]                                 │
│ └──────────────────────────────────────────────────────────┘
│
│  ← 1  2  3  4  5 →  (ProPagination)
```

### 6.8 Entity name resolution pattern

The B7 diff endpoint returns only `entityId` (UUID) — it does **not** include the entity's display name. The DiffTable must resolve names client-side using parallel data already loaded on the page.

**Resolution strategy:**

```
entityType = "production_milestone"
  → look up in milestones[] from useOwnerListProductionMilestones(cropSeasonId)
  → display: milestone.stageName || "Giai đoạn #" + milestoneOrder

entityType = "employee_task"
  → look up in tasks[] from useOwnerListEmployeeTasks(cropSeasonId)
  → display: task.title || "Công việc không tên"

entityType = "crop_season"
  → use cropSeason.cropName directly (already in page context)
  → display: cropSeason.cropName

entityType = "harvest_record"
  → display: "Bản ghi thu hoạch " + format(harvest.harvestDate)

entityType = "iot_device_assignment"
  → display: "Thiết bị " + assignment.deviceCode
```

**Hook integration:**

```ts
// Inside PlanVsActualPage — these hooks run in parallel
const { data: milestones } = useOwnerListProductionMilestones(cropSeasonId);
const { data: tasks } = useOwnerListEmployeeTasks(cropSeasonId);
const { data: diff } = useTrackingDiff(cropSeasonId);

// Pass resolver to DiffTable
function resolveEntityName(entityType: string, entityId: string): string {
  if (entityType === "production_milestone") {
    const m = milestones?.find((m) => m.id === entityId);
    return m?.stageName ?? `Giai đoạn (${entityId.slice(0, 8)})`;
  }
  if (entityType === "employee_task") {
    const t = tasks?.find((t) => t.id === entityId);
    return t?.title ?? `Công việc (${entityId.slice(0, 8)})`;
  }
  // crop_season, harvest_record, iot_device_assignment handled above
  return entityId.slice(0, 8) + "…";
}
```

**Deleted entity handling:** If the entity was deleted (not found in any list), fall back to `"{entity type label} (đã xóa)"` in `text-muted-foreground italic`.

**Date filter conversion:** The Timeline tab (§6.7) uses `DatePickerField` which returns a `Date` object. Convert to ISO datetime string before calling B8:

```ts
const fromIso = from ? from.toISOString() : undefined;
const toIso = to ? endOfDay(to).toISOString() : undefined;
// Pass to useTrackingLog({ cropSeasonId, from: fromIso, to: toIso, ... })
```

Use `endOfDay(to)` from `date-fns` to include the full selected "to" day.

---

## 7. FieldHistoryModal

Opens from "Xem lịch sử" link in `DiffTable`. Shows full paginated change log for a single field of a single entity.

```
┌─ Dialog (max-w-2xl) ─────────────────────────────────────────┐
│                                                              │
│  Lịch sử thay đổi — "Ngày kết thúc thực tế"                 │
│  Giai đoạn: M1 Làm đất & chuẩn bị          [✕ Đóng]        │
│                                                              │
│  ┌────────────┬──────────────┬──────────────┬─────────────┐  │
│  │ Thời điểm  │ Giá trị cũ   │ Giá trị mới  │ Người thực  │  │
│  ├────────────┼──────────────┼──────────────┼─────────────┤  │
│  │ 12/05 08:00│ 10/05/2026   │ 13/05/2026   │ Nguyễn A    │  │
│  │            │              │              │ [update]    │  │
│  ├────────────┼──────────────┼──────────────┼─────────────┤  │
│  │ 25/04 10:30│ —            │ 10/05/2026   │ Hệ thống    │  │
│  │            │              │              │ [snapshot]  │  │
│  └────────────┴──────────────┴──────────────┴─────────────┘  │
│                                                              │
│  Hiển thị 2 / 2 bản ghi · Trang 1/1                         │
│                                                              │
│                                            [← 1 →]          │
└──────────────────────────────────────────────────────────────┘
```

**Component details:**

| Part | Component | Notes |
| --- | --- | --- |
| Shell | `Dialog` · `DialogContent className="max-w-2xl"` |  |
| Title | `DialogTitle` | Include `fieldName` (localized) and entity name |
| Table | `Table` › `TableHeader` › `TableBody` | 4 columns |
| Change type badge | `Badge variant="outline"` | `"snapshot"` → gray · `"update"` → default · `"create"` → emerald · `"delete"` → destructive |
| System actor | `span className="text-muted-foreground italic"` | When `changedBy === null` → "Hệ thống" |
| Pagination | `ProPagination` | query state: `{ page, limit: 20 }` |

**Value display:** For `dataType === "date"` or `"datetime"` → format with `formatDateTimeVi`. For `null` → `"—"`. For `boolean` → "Có" / "Không". For all others → `String(value)`.

---

## 8. TrackingTimeline

New component `TrackingTimeline.tsx`. Built in the same visual pattern as `DailyLogActivityFeed` but powered by `TrackingLogItemType`.

### 8.1 Single timeline entry anatomy

```
┌─────────────────────────────────────────────────────────────┐
│  ●──────────────────────────────────────────────────────── │
│  │                                                          │
│  │  ┌────┐  Nguyễn Văn A                      12/05 08:00  │
│  │  │ NA │  Cập nhật giai đoạn "Làm đất"                   │
│  │  └────┘  actualEndDate: 10/05 → 13/05/2026              │
│  │           [Giai đoạn] [update]                          │
│  │                                                          │
```

**Parts:**

| Part | Component | Notes |
| --- | --- | --- |
| Left timeline line | `div` with `border-l-2 border-border` | Standard activity feed vertical line |
| Avatar | `Avatar` (initials) | From `changedBy` UUID → resolve display name. Fall back to "HT" (Hệ thống) for system events |
| Actor name | `p className="font-medium text-sm"` | Resolved user name or "Hệ thống" when `changedBy === null` |
| Relative time | `span className="text-xs text-muted-foreground"` | Use `formatRelative` or `formatDistanceToNow` from `date-fns` |
| Field change | `p className="text-sm text-muted-foreground"` | `"${fieldLabel}: ${oldValue} → ${newValue}"` |
| Entity badge | `Badge variant="outline" className="text-xs"` | Entity type label from `ENTITY_TYPE_LABEL` map |
| Change type badge | `Badge` | `update`=default · `create`=emerald · `delete`=destructive · `snapshot`=secondary |

### 8.2 Grouping by date

Group consecutive entries by calendar date with a date separator:

```
── 12/05/2026 ─────────────────────────────────────────────────
  [entry 1]
  [entry 2]

── 01/05/2026 ─────────────────────────────────────────────────
  [entry 3]
```

Separator: `div className="flex items-center gap-3 text-xs text-muted-foreground"` with `Separator` lines on both sides.

---

## 9. Micro-components Spec

### 9.1 `VarianceBadge`

**Size:** `Badge` default (inline, no padding override needed)  
**Anatomy:** `[icon/symbol] [value][unit]`

| Condition | Output | Visual |
| --- | --- | --- |
| `direction === "late"` or `"higher"` | `+{value}{unit}` | `Badge variant="destructive"` · `🔴` suffix |
| `direction === "early"` or `"lower"` | `−{value}{unit}` | `Badge className="bg-green-100 text-green-800"` · `🟢` suffix |
| `direction === "on-time"` or `"equal"` | `Đúng kế hoạch` | `Badge variant="outline" className="text-muted-foreground"` |
| `type === "changed"` or `"label"` (no direction) | `Thay đổi` | `Badge variant="secondary"` |
| `type === "none"` or `variance === null` | `—` | `span className="text-muted-foreground"` |

**Unit mapping:**

```ts
const VARIANCE_UNIT: Partial<Record<string, string>> = {
  days: "d",
  percent: "%",
  absolute: "",
};
```

### 9.2 `KpiSummaryCards` (4-card row)

Uses `KpiCard` directly. Computed from `TrackingDiffResType`:

```tsx
// Compute from diff data:
const onTrackCount = countFields(
  diff,
  (f) => !f.variance || f.variance.type === "none",
);
const lateCount = countFields(
  diff,
  (f) => f.variance?.direction === "late" || f.variance?.direction === "higher",
);
const unplannedCount = diff.unplanned.reduce(
  (sum, s) => sum + s.entities.length,
  0,
);
const totalChanges = // sum of all changeCount across all tracked fields
  (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
      <KpiCard
        icon={CheckCircle2}
        label="Đúng kế hoạch"
        value={onTrackCount}
        hint="trường"
        tone="success"
      />
      <KpiCard
        icon={AlertTriangle}
        label="Trễ / vượt"
        value={lateCount}
        hint="trường"
        tone="danger"
      />
      <KpiCard
        icon={Sparkles}
        label="Phát sinh"
        value={unplannedCount}
        hint="thực thể"
        tone="default"
      />
      <KpiCard
        icon={Activity}
        label="Lần thay đổi"
        value={totalChanges}
        hint="tổng ghi"
        tone="default"
      />
    </div>
  );
```

### 9.3 Layer badge

```tsx
function LayerBadge({
  layer,
}: {
  layer: "plan_only" | "operational" | "unplanned";
}) {
  if (layer === "plan_only")
    return (
      <Badge className="bg-sky-100 text-sky-800 border-sky-200">Kế hoạch</Badge>
    );
  if (layer === "operational")
    return (
      <Badge className="bg-teal-100 text-teal-800 border-teal-200">
        Thực tế
      </Badge>
    );
  return (
    <Badge className="bg-violet-100 text-violet-800 border-violet-200">
      Phát sinh
    </Badge>
  );
}
```

### 9.4 Change type badge

```tsx
const CHANGE_TYPE_BADGE: Record<
  string,
  {
    label: string;
    className?: string;
    variant?: "default" | "outline" | "secondary" | "destructive";
  }
> = {
  snapshot: { label: "Chụp ảnh", variant: "secondary" },
  create: { label: "Tạo mới", className: "bg-emerald-100 text-emerald-800" },
  update: { label: "Cập nhật", variant: "default" },
  delete: { label: "Xóa", variant: "destructive" },
};
```

---

## 10. States Catalogue

Every async section must handle 4 states: **loading**, **error**, **empty**, **data**.

### 10.1 `PlanVsActualPage` — full page states

| State | Component | Content |
| --- | --- | --- |
| Loading | `LoadingCard rows={6}` × 4 (KPI cards) + `TableSkeleton` | Full page skeleton |
| Error | `ErrorState` | `title="Không thể tải dữ liệu so sánh"` · `onRetry={() => refetch()}` |
| Empty (no configs) | `EmptyState` | `icon={BarChart3}` · `title="Chưa cấu hình theo dõi"` · `description="Quản lý trang trại cần chọn trường theo dõi trước khi phê duyệt kế hoạch."` · no action button |
| Empty (configs but no changes) | `EmptyState` | `icon={CheckCircle2}` · `title="Chưa có thay đổi nào"` · `description="Các trường đang bám sát kế hoạch."` · `tone="success"` (custom) |
| Data | Full layout per §6.2 | — |

### 10.2 `TrackingConfigPanel` — field list states

| State | Component |
| --- | --- |
| Loading | 3× `Skeleton className="h-6 w-full"` per group |
| Error | `ErrorState message="Không tải được danh sách trường"` |
| Empty (shouldn't happen — whitelist is always non-empty) | `EmptyState title="Không có trường khả dụng"` |
| Data | Checkbox tree |

### 10.3 `FieldHistoryModal` — table states

| State   | Component                                                    |
| ------- | ------------------------------------------------------------ |
| Loading | `TableSkeleton` (5 rows) inside `DialogContent`              |
| Error   | `ErrorState` inline, small                                   |
| Empty   | `EmptyState icon={History} title="Chưa có lịch sử thay đổi"` |
| Data    | Table per §7                                                 |

### 10.4 `TrackingTimeline` — feed states

| State | Component |
| --- | --- |
| Loading | 3× `LoadingCard rows={2}` |
| Error | `ErrorState` |
| Empty | `EmptyState icon={Clock} title="Chưa có hoạt động nào" description="Không có thay đổi trong khoảng thời gian đã chọn."` |
| Data | Activity feed per §8 |

---

## 11. Responsive Behavior

### 11.1 KPI cards

```
Mobile (< md):  grid-cols-2
Tablet (md):    grid-cols-2
Desktop (lg+):  grid-cols-4
```

### 11.2 DiffTable

On mobile, collapse the table to card-per-entity layout:

```
Mobile:
┌─ M1 — Làm đất & chuẩn bị ────────────────┐
│  actualEndDate                             │
│  Kế hoạch: 10/05/2026                     │
│  Thực tế:  13/05/2026                     │
│  Sai số:   [+3d 🔴]                        │
│                     [Xem lịch sử →]        │
└────────────────────────────────────────────┘

Desktop: full <Table> layout
```

Use `hidden md:table-cell` on "Kế hoạch" and "Thực tế" column headers; on mobile, show combined inline layout.

### 11.3 FieldHistoryModal

- Mobile: `DialogContent className="max-w-[95vw]"` with horizontal scroll on table
- Desktop: `DialogContent className="max-w-2xl"` fixed width

### 11.4 TrackingConfigPanel Sheet

`SheetContent` is already `w-96` (side sheet). On mobile (`< sm`) switch to bottom-sheet style: `SheetContent side="bottom" className="h-[80vh] overflow-y-auto"`.

---

## 12. Accessibility Notes

| Element | Requirement |
| --- | --- |
| `VarianceBadge` danger | Include `aria-label="Trễ {value} ngày"` for screen readers — emoji alone is not accessible |
| Lock icon on disabled field | Wrap in `<Tooltip content="Trường kế hoạch — đã khóa">` |
| `StatusBanner` | Has `role="status" aria-live="polite"` in existing component — ✅ no changes needed |
| `Accordion` in DiffTable | Use `AccordionTrigger` with descriptive label including entity count: `"Giai đoạn sản xuất (4 giai đoạn)"` |
| `FieldHistoryModal` | `DialogTitle` must describe the specific field: `"Lịch sử — Ngày kết thúc thực tế"` |
| `Checkbox` in config panel | `aria-label="{fieldLabel} — {layer}"` e.g. `"Ngày kết thúc thực tế — Thực tế"` |
| `TableSkeleton` | Wrap in `aria-busy="true" aria-label="Đang tải..."` |
| Color-only variance indication | Always pair color with text/icon — never use color alone to convey meaning |

---

## 13. Production Request Snapshot Viewer (B5 / B6)

Owner can view the immutable plan captured at approval time and compare across multiple approve versions.

### 13.1 Entry point

In the Plan vs Actual page header, add a secondary action button:

```
┌─ Page Header ───────────────────────────────────────────────┐
│  ← Quay lại                           [📋 Lịch sử phê duyệt]│
│  Rice ST25          [Đang hoạt động]                        │
└─────────────────────────────────────────────────────────────┘
```

`Button variant="outline" size="sm"` with `History` icon opens `ProductionRequestSnapshotViewer` Dialog.

### 13.2 Snapshot list modal (B5)

```
┌─ Dialog (max-w-4xl) ──────────────────────────────────────────┐
│                                                               │
│  📋  Lịch sử phê duyệt — Rice ST25          [✕ Đóng]        │
│                                                               │
│  Chọn phiên bản để so sánh:                                   │
│  ☐ PR #1  Phê duyệt lần 1   20/04/2026 14:30   Owner Trân   │
│  ☐ PR #2  Phê duyệt lần 2   05/05/2026 09:15   Owner Trân   │
│                                                               │
│  [Xem chi tiết PR #1]   [So sánh 2 phiên bản đã chọn →]     │
└───────────────────────────────────────────────────────────────┘
```

- Each row is a `ProductionRequest` that has an associated snapshot (status ∈ `approved`, `active`, `completed`)
- "Xem chi tiết" → opens snapshot detail view (§13.3)
- "So sánh" button only enabled when exactly 2 rows are checked → opens diff view (§13.4)

### 13.3 Snapshot detail view (single PR — B5)

Renders the `TrackingPlanSnapshot[]` payload as a read-only table. Each row = one captured field value at approval time.

```
┌─ Kế hoạch gốc — PR #1 (20/04/2026) ─────────────────────────┐
│                                                              │
│ ╔══ Giai đoạn sản xuất ════════════════════════════════════╗ │
│ ║  M1 — Làm đất & chuẩn bị                                 ║ │
│ ║  ┌─────────────────────┬────────────────────────────┐    ║ │
│ ║  │ Trường               │ Giá trị kế hoạch           │    ║ │
│ ║  ├─────────────────────┼────────────────────────────┤    ║ │
│ ║  │ Ngày kết thúc KH     │ 10/05/2026                 │    ║ │
│ ║  │ Trạng thái           │ pending                    │    ║ │
│ ║  └─────────────────────┴────────────────────────────┘    ║ │
│ ╚══════════════════════════════════════════════════════════╝ │
│                                                              │
│ ╔══ Công việc ══════════════════════════════════════════════╗ │
│ ║  [table rows for tasks...]                                ║ │
│ ╚══════════════════════════════════════════════════════════╝ │
│                                                              │
│                                           [← Quay lại]      │
└──────────────────────────────────────────────────────────────┘
```

**Data shape:** `GET /crop-seasons/:id/production-requests/:prId/snapshot` (B5) returns `TrackingPlanSnapshot[]`.

### 13.4 Diff view — two PR versions (B6)

Side-by-side comparison when owner selects 2 production requests:

```
┌─ So sánh kế hoạch: PR #1 vs PR #2 ──────────────────────────┐
│                                                              │
│  ┌────────────────────┬──────────────┬──────────────────┐   │
│  │ Trường              │ PR #1 (4/20) │ PR #2 (5/05)     │   │
│  ├────────────────────┼──────────────┼──────────────────┤   │
│  │ M1 actualEndDate   │ 10/05/2026   │ 10/05/2026       │   │
│  │ M2 expectedEnd     │ 25/05/2026   │ 30/05/2026 🔴    │   │
│  │ T3 assignedTo      │ Nguyễn A     │ Trần B 🟡        │   │
│  └────────────────────┴──────────────┴──────────────────┘   │
│                                                              │
│  🔴 = Giá trị thay đổi   ⬜ = Không đổi                     │
└──────────────────────────────────────────────────────────────┘
```

**Component details:**

| Part | Component | Notes |
| --- | --- | --- |
| Shell | `Dialog` · `DialogContent className="max-w-4xl"` |  |
| Table | Standard `Table` with sticky first column | 3 columns: field, PR-A value, PR-B value |
| Changed cell | `bg-amber-50 text-amber-900` | When PR-A value ≠ PR-B value |
| Unchanged cell | Default | No highlight |
| Data source | `GET /crop-seasons/:id/production-requests/diff?from=:prAId&to=:prBId` (B6) | Returns `SnapshotDiffItem[]` |

**Data mapping:** `B6` response fields map to `{fieldName, entityType, entityId, fromValue, toValue}`. Use `FIELD_LABEL_MAP` and entity name resolver (§6.8) for display.

---

## 14. F7 — IoT Device Logs Page (P3)

Owner-facing page showing the full IoT assignment history and sensor event log for a crop season. Priority P3 — implement after P1 features are stable.

### 14.1 Entry point

New tab **"Thiết bị IoT"** inside `CropSeasonDetailPanel` (same level as "Kế hoạch vs Thực tế"). Visible only when `status ≠ planning`.

### 14.2 Page layout

```
┌─ Page header ───────────────────────────────────────────────┐
│  ← Quay lại                                                 │
│  Lịch sử thiết bị IoT — Rice ST25                           │
└─────────────────────────────────────────────────────────────┘

┌─ Device assignment list ────────────────────────────────────┐
│ ┌──────────┬──────────────┬────────────┬────────────┬─────┐ │
│ │ Giai đoạn│ Thiết bị     │ Gán từ     │ Tháo ra    │ Lý do│ │
│ ├──────────┼──────────────┼────────────┼────────────┼─────┤ │
│ │ Làm đất  │ Sensor-A01   │ 20/04/2026 │ 05/05/2026 │ Swap│ │
│ │ Làm đất  │ Sensor-B02   │ 05/05/2026 │ —          │ —   │ │
│ │ Gieo hạt │ Sensor-C03   │ 28/04/2026 │ —          │ —   │ │
│ └──────────┴──────────────┴────────────┴────────────┴─────┘ │
└─────────────────────────────────────────────────────────────┘

┌─ Sensor event log (TrackingTimeline filtered) ──────────────┐
│  Chỉ hiển thị entries có entityType = "iot_device_assignment"│
│  [same TrackingTimeline component, entityType filter pre-set]│
└─────────────────────────────────────────────────────────────┘
```

### 14.3 Component details

| Part | Component | Notes |
| --- | --- | --- |
| Shell | Inline `TabsContent` or dedicated route | Same pattern as `PlanVsActualPage` |
| Assignment table | `Table` | Source: IoT assignment tracking data via B8 with `entityType=iot_device_assignment` |
| Active assignment | Row with `bg-emerald-50` highlight | When `unassignedAt === null` |
| Swap reason | `Tooltip` on truncated text | Show full `swapReason` on hover |
| Event log | `TrackingTimeline` | Pre-filter `entityType: "iot_device_assignment"` via B8 |
| Empty state | `EmptyState` with `Wifi` icon | "Chưa có thiết bị nào được gán trong mùa vụ này" |

---

## Appendix A — Component File Map

```
src/pages/OwnerPage/CropSeasons/
├── PlanVsActualPage.tsx                      [NEW] main page shell
├── IotDeviceLogsPage.tsx                     [NEW] F7 IoT device log (P3)
├── ProductionRequestSnapshotViewer.tsx       [NEW] B5/B6 snapshot viewer
└── components/
    ├── KpiSummaryCards.tsx                   [NEW] 4-card KPI row
    ├── DiffTable.tsx                         [NEW] accordion + entity rows
    ├── UnplannedSection.tsx                  [NEW] unplanned entities block
    ├── TrackingTimeline.tsx                  [NEW] activity feed timeline
    ├── FieldHistoryModal.tsx                 [NEW] field history dialog
    ├── VarianceBadge.tsx                     [NEW] shared variance display
    └── IotSwapModal.tsx                      [NEW] F3 IoT swap (P2)

src/pages/ManagerPage/CropSeasons/
└── components/
    └── TrackingConfigPanel.tsx               [NEW] checkbox tree panel

src/components/common/
└── (existing — no new files needed)         use KpiCard, EmptyState, etc.

src/lib/
├── tracking-display.ts                      [NEW] FIELD_LABEL_MAP, ENTITY_TYPE_LABEL, resolveEntityName
└── (existing — add to error-message.ts)
```

---

## Appendix B — Interaction Flow Diagram

```
Owner opens CropSeason detail (status = active)
  │
  ├─► Tab "Kế hoạch vs Thực tế" appears
  │     │
  │     └─► Click → PlanVsActualPage loads
  │             │
  │             ├─► useTrackingDiff() → loads KPI + DiffTable
  │             │     ├─► [parallel] useOwnerListProductionMilestones
  │             │     └─► [parallel] useOwnerListEmployeeTasks
  │             │
  │             ├─► [So sánh tab] default
  │             │     ├─► Filter: entityType + variance direction (client-side)
  │             │     └─► DiffTable: Accordion by entityType
  │             │             └─► Click row "Xem lịch sử"
  │             │                   └─► FieldHistoryModal opens
  │             │                         └─► useTrackingFieldHistory(...)
  │             │
  │             ├─► [Timeline tab]
  │             │     ├─► TrackingTimeline
  │             │     ├─► DatePickerField (from/to → endOfDay() → ISO)
  │             │     └─► ProPagination → page=2,3...
  │             │
  │             └─► [Lịch sử phê duyệt] button
  │                   └─► ProductionRequestSnapshotViewer
  │                         ├─► List PRs → select one → B5 snapshot
  │                         └─► Select two → B6 diff side-by-side

Owner opens "Thiết bị IoT" tab (F7 — P3)
  │
  └─► IotDeviceLogsPage
        ├─► Assignment history table
        └─► TrackingTimeline (entityType=iot_device_assignment)

Manager opens CropSeason edit sheet (status = planning)
  │
  ├─► All fields editable
  └─► Accordion "Cấu hình theo dõi" at bottom
        ├─► Checkbox tree loaded from useTrackingAvailableFields
        ├─► Pre-checked from useTrackingConfigs
        └─► Save → confirm dialog (if removing fields) → PUT configs

Manager opens CropSeason edit sheet (status = approved/active)
  │
  ├─► Plan-only fields → locked display (lock icon + disabled style)
  ├─► StatusBanner warning above operational fields section
  ├─► Operational fields → editable
  └─► Accordion "Cấu hình theo dõi"
        └─► StatusBanner info: "Đã khóa" + read-only list
              (→ Switch per-field when B4 ready — §3.4)

Manager views milestone IoT (status = active)
  │
  └─► "Thay thiết bị IoT" → IotSwapModal
        ├─► Select available device
        ├─► Enter swapReason (≥10 chars)
        └─► Confirm → B14 PATCH → invalidate

Manager opens "Kế hoạch vs Thực tế" tab
  │
  └─► Same PlanVsActualPage — read-only view (B7/B8/B9 allow manager role)
```
