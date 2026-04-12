# Employee Task & Employee Task Template — Full Implementation Guide

This document provides a complete backend + frontend implementation blueprint for the Employee Task Template → Employee Task lifecycle, derived from the actual codebase.

---

## 1. Domain & Flow Analysis

### 1.1 Core Entities

```
┌──────────────────────────┐
│  Template (type="task")  │  Reusable blueprint (admin-managed)
│  ├─ TemplateItem[]       │  Each item = one task preset
│  │   config: {title,     │
│  │   description,        │
│  │   priority}           │
└──────────┬───────────────┘
           │ "Apply template" (frontend-only transform)
           ▼
┌──────────────────────────┐
│  EmployeeTask            │  Real work unit tied to a milestone
│  ├─ milestoneId (FK)     │
│  ├─ assignedTo (FK→User) │  Farmer on the farm
│  ├─ createdBy (FK→User)  │  Manager or Owner who created
│  ├─ status               │  pending→in_progress→completed→verified
│  ├─ priority             │  low | normal | high | urgent
│  ├─ startDate / dueDate  │
│  └─ verifiedBy / verifiedAt
└──────────┬───────────────┘
           │ 1:N
           ▼
┌──────────────────────────┐
│  DailyLog                │  Activity log submitted by farmer
└──────────────────────────┘
```

### 1.2 Relationship Summary

| Relationship | Cardinality | Notes |
| --- | --- | --- |
| Template → TemplateItem | 1:N | Items stored with `itemType = "activity"` |
| Template → EmployeeTask | **None (no FK)** | Template is a blueprint only — no direct DB link |
| ProductionMilestone → EmployeeTask | 1:N | Tasks are scoped to a milestone |
| User (farmer) → EmployeeTask | 1:N | Via `assignedTo` |
| User (creator) → EmployeeTask | 1:N | Via `createdBy` |
| EmployeeTask → DailyLog | 1:N | Farmer submits logs against assigned tasks |

### 1.3 Main Flow (Step-by-Step)

```
1. Admin creates Employee Task Template
   └─ Template has items: [{title, description, priority}, ...]

2. Manager/Owner opens a Production Milestone task panel
   └─ Optionally clicks "Apply Template"
   └─ Frontend fetches template detail, maps items → task draft rows
   └─ NO backend call for "apply" — purely client-side transform

3. Manager/Owner creates tasks (batch)
   └─ POST /employee-task/{role}/production-milestone/:milestoneId
   └─ Body: { tasks: [{title, description, priority, dueDate, startDate, assignedTo?}] }

4. Manager/Owner assigns farmer to task
   └─ POST .../assign { farmerId }

5. Farmer sees assigned tasks (via daily-log module)
   └─ Farmer submits daily logs against tasks

6. Manager/Owner updates task status
   └─ PUT .../update { status: "in_progress" | "completed" | "verified" }

7. Manager/Owner can verify completed tasks
   └─ PUT .../update { status: "verified" }
```

### 1.4 What Is Copied from Template vs. What Is Dynamic

| Field | From Template | Dynamic per Task |
| --- | --- | --- |
| `title` | Copied, editable | Yes — user can override |
| `description` | Copied, editable | Yes |
| `priority` | Copied, editable | Yes |
| `assignedTo` | **Not in template** | Set per task at creation or via assign endpoint |
| `dueDate` | **Not in template** | Set per task |
| `startDate` | **Not in template** | Set per task |
| `status` | Always `pending` on create | Updated during lifecycle |
| `milestoneId` | **Not in template** | Determined by URL context |
| `createdBy` | **Not in template** | Auto-set from auth token |

---

## 2. Backend Deep Analysis

### 2.1 API Design — Employee Task Template (Existing)

#### Admin CRUD

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/employee-task-template` | Create template |
| GET | `/employee-task-template/admin?page&limit&search&type` | List all (incl. deleted/inactive) |
| GET | `/employee-task-template/:id/admin` | Detail (incl. deleted/inactive) |
| PUT | `/employee-task-template/:id/admin` | Update template |
| DELETE | `/employee-task-template/:id/admin` | Soft delete |

#### Manager (Read-Only)

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/manager/employee-task-template?page&limit&search&type` | List active templates |
| GET | `/manager/employee-task-template/:id` | Detail (active only) |

#### Owner (Read-Only)

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/owner/employee-task-template?page&limit&search&type` | List active templates |
| GET | `/owner/employee-task-template/:id` | Detail (active only) |

#### Create Template — Request

```json
{
  "name": "Daily Rice Field Tasks",
  "description": "Standard daily tasks for rice cultivation",
  "type": "task",
  "farmType": "cultivation",
  "isActive": true,
  "items": [
    {
      "title": "Check water level",
      "description": "Measure and record paddy water level",
      "priority": "high"
    },
    {
      "title": "Inspect for pests",
      "description": null,
      "priority": "normal"
    }
  ]
}
```

#### Create Template — Response

```json
{
  "statusCode": 200,
  "data": {
    "id": "a1b2c3d4-...",
    "name": "Daily Rice Field Tasks",
    "description": "Standard daily tasks for rice cultivation",
    "type": "task",
    "farmType": "cultivation",
    "isActive": true,
    "items": [
      {
        "id": "item-uuid-1",
        "itemType": "activity",
        "title": "Check water level",
        "description": "Measure and record paddy water level",
        "priority": "high"
      },
      {
        "id": "item-uuid-2",
        "itemType": "activity",
        "title": "Inspect for pests",
        "description": null,
        "priority": "normal"
      }
    ],
    "createdAt": "2026-04-12T10:00:00.000Z",
    "updatedAt": "2026-04-12T10:00:00.000Z",
    "deletedAt": null
  }
}
```

### 2.2 API Design — Employee Task (Existing)

All task endpoints are scoped to a **production milestone** and gated by **owner** or **manager** role.

#### Owner Endpoints

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/employee-task/owner/production-milestone/:milestoneId` | List tasks |
| POST | `/employee-task/owner/production-milestone/:milestoneId` | Create batch |
| GET | `/employee-task/:taskId/owner/production-milestone/:milestoneId` | Task detail |
| PUT | `/employee-task/:taskId/owner/production-milestone/:milestoneId` | Update task |
| DELETE | `/employee-task/:taskId/owner/production-milestone/:milestoneId` | Soft delete |
| POST | `/employee-task/:taskId/owner/production-milestone/:milestoneId/assign` | Assign farmer |
| POST | `/employee-task/:taskId/owner/production-milestone/:milestoneId/unassign` | Unassign farmer |

#### Manager Endpoints

Same structure with `/manager/` instead of `/owner/`.

#### Create Tasks (Batch) — Request

```json
{
  "tasks": [
    {
      "title": "Check water level",
      "description": "Measure and record paddy water level",
      "priority": "high",
      "assignedTo": "farmer-uuid-1",
      "dueDate": "2026-05-15T17:00:00.000Z",
      "startDate": "2026-05-10T08:00:00.000Z"
    },
    {
      "title": "Inspect for pests",
      "description": null,
      "priority": "normal",
      "assignedTo": null,
      "dueDate": null,
      "startDate": null
    }
  ]
}
```

#### Create Tasks — Response

```json
[
  {
    "id": "task-uuid-1",
    "milestoneId": "milestone-uuid",
    "assignedTo": "farmer-uuid-1",
    "assignedDate": "2026-04-12T10:05:00.000Z",
    "title": "Check water level",
    "description": "Measure and record paddy water level",
    "priority": "high",
    "status": "pending",
    "dueDate": "2026-05-15T17:00:00.000Z",
    "startDate": "2026-05-10T08:00:00.000Z",
    "completedAt": null,
    "verifiedBy": null,
    "verifiedAt": null,
    "createdBy": "caller-uuid",
    "createdAt": "2026-04-12T10:05:00.000Z",
    "updatedAt": "2026-04-12T10:05:00.000Z",
    "deletedAt": null
  }
]
```

#### Update Task — Request (status change)

```json
{
  "status": "in_progress"
}
```

#### Assign Farmer — Request

```json
{
  "farmerId": "farmer-uuid-1"
}
```

#### List Tasks — Query Parameters

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `page` | number | No (default 1) | Page number |
| `limit` | number | No (default 10) | Items per page |
| `search` | string | No | Search by title (case-insensitive contains) |
| `status` | enum | No | Filter: `pending`, `in_progress`, `completed`, `verified`, `cancelled` |
| `priority` | enum | No | Filter: `low`, `normal`, `high`, `urgent` |

### 2.3 Business Rules

#### Template Level

| Rule | Detail |
| --- | --- |
| Who can create/edit/delete? | **Admin only** |
| Can template be reused? | Yes — unlimited times, across any milestone/farm |
| Versioning? | `version` field exists on Template table; currently incremented on update |
| Template → Task link? | **No FK**. Template is a blueprint; tasks are standalone after creation |
| Duplicate name? | Unique name enforced (case-insensitive) across all task templates |
| Duplicate item title? | Unique within the same template (case-insensitive) |
| Max items? | No explicit limit in schema |
| Active/inactive? | `isActive` flag; non-admin users can only see active templates |

#### Task Generation

| Rule | Detail |
| --- | --- |
| Can one template create multiple tasks? | Yes — each template item becomes one task row |
| Multi-employee at once? | Each task item can have its own `assignedTo` in the batch |
| Editable after creation? | Yes — title, description, priority, status, dates, assignee all updatable |
| Task title uniqueness? | Unique per milestone (case-insensitive); checked on create and update |
| Initial status? | Always `pending` on creation (hardcoded in repo) |
| Auto-assign date? | `assignedDate` auto-set to `now()` when `assignedTo` is provided |

#### Task Status Transitions

```
                 ┌──────────┐
                 │ pending   │ ← initial
                 └─────┬─────┘
                       │
                       ▼
                 ┌──────────────┐
                 │ in_progress  │
                 └──────┬───────┘
                        │
              ┌─────────┼──────────┐
              ▼                    ▼
       ┌────────────┐      ┌────────────┐
       │ completed   │      │ cancelled  │
       └──────┬──────┘      └────────────┘
              │
              ▼
       ┌────────────┐
       │  verified   │
       └─────────────┘
```

> **Current backend note**: The service accepts any status value on update without enforcing transition order. Frontend should enforce the logical flow above. If strict transitions are needed, backend should be enhanced.

#### Task Assignment

| Rule | Detail |
| --- | --- |
| Who can assign? | Owner (farm owner) or Manager (zone manager) |
| Assignee constraint | Must be active user (`isActive=true`, `deletedAt=null`) AND a farm member with role `farmer` on the milestone's farm |
| Unassign | Clears `assignedTo` and `assignedDate` to null |
| Reassign | Use update endpoint with new `assignedTo`, or use assign endpoint |

### 2.4 Role-Based Access Control (RBAC) — Permission Matrix

| Action | Admin | Owner | Manager | Farmer |
| --- | --- | --- | --- | --- |
| **Template: Create** | ✅ | ❌ | ❌ | ❌ |
| **Template: Update** | ✅ | ❌ | ❌ | ❌ |
| **Template: Delete** | ✅ | ❌ | ❌ | ❌ |
| **Template: List (all)** | ✅ | ❌ | ❌ | ❌ |
| **Template: List (active)** | ✅ | ✅ | ✅ | ❌ |
| **Template: Detail** | ✅ | ✅ (active) | ✅ (active) | ❌ |
| **Task: Create (batch)** | ❌ | ✅ (own farm) | ✅ (assigned zone) | ❌ |
| **Task: List** | ❌ | ✅ (own farm) | ✅ (assigned zone) | ❌ (via daily-log) |
| **Task: Detail** | ❌ | ✅ | ✅ | ❌ (via daily-log) |
| **Task: Update** | ❌ | ✅ | ✅ | ❌ |
| **Task: Delete** | ❌ | ✅ | ✅ | ❌ |
| **Task: Assign farmer** | ❌ | ✅ | ✅ | ❌ |
| **Task: Unassign farmer** | ❌ | ✅ | ✅ | ❌ |
| **Daily Log: Submit** | ❌ | ❌ | ❌ | ✅ (assigned tasks only) |

#### Authorization Logic

- **Owner**: `farm.ownerId === callerId` (traverses milestone → cropSeason → zone → farm)
- **Manager**: `zoneManagers` table must contain a row for `(zoneId, managerId=callerId)`
- **Farmer (assign)**: `farmMembers` table must contain a row for `(farmId, userId=farmerId, role=farmer)`

### 2.5 Validation Rules

#### Template Validation

| Field | Rule | Error |
| --- | --- | --- |
| `name` | Required, 1–255 chars | Zod validation |
| `name` | Unique (case-insensitive) | `Error.EmployeeTaskTemplateNameAlreadyExists` (422) |
| `description` | Optional, max 5000 chars | Zod validation |
| `type` | Must be `"task"` | Zod literal enum |
| `farmType` | Must be valid FarmType enum | Zod enum |
| `items[].title` | Required, 1–255 chars | Zod validation |
| `items[].title` | Unique within items array (case-insensitive) | Zod superRefine |
| `items[].description` | Optional, max 5000 chars | Zod validation |
| `items[].priority` | `low` \| `normal` \| `high` \| `urgent` (default: `normal`) | Zod enum |

#### Task Validation

| Field | Rule | Error |
| --- | --- | --- |
| `tasks` | Min 1 item in batch | Zod array min(1) |
| `tasks[].title` | Required, 1–255 chars | Zod validation |
| `tasks[].title` | Unique within batch (case-insensitive) | Zod superRefine |
| `tasks[].title` | Unique per milestone (case-insensitive) | `Error.TaskTitleDuplicate` (422) |
| `tasks[].assignedTo` | If set, must be active user | `Error.AssigneeNotFound` (404) |
| `assign.farmerId` | Must be active user AND farmer on farm | `Error.FarmerNotEligibleForTask` (403) |
| Milestone | Must exist | `Error.ProductionMilestoneNotFound` (404) |
| Milestone | Must be linked to farm (via crop season → zone) | `Error.MilestoneFarmContextMissing` (403) |

### 2.6 Edge Cases (Critical)

| Edge Case | Current Backend Behavior | Recommended Handling |
| --- | --- | --- |
| **Template deleted after tasks created** | No impact — tasks have no FK to template. Tasks remain intact. | Frontend should show "Template unavailable" if user tries to re-apply a deleted template |
| **Template updated → existing tasks?** | No propagation — tasks are independent copies | Frontend should NOT retroactively update tasks. Show "created from template X (v2)" as metadata if needed |
| **Employee (farmer) deactivated** | `assignedTo` remains on task but farmer won't appear in active user checks. New assignment blocked. | Frontend should show "Assignee inactive" warning. Allow unassign. |
| **Employee removed from farm** | Existing task assignment persists. New assign check fails (`isUserFarmerOnFarm`). | Frontend should display warning on task detail if assignee no longer on farm |
| **Task overdue logic** | No server-side cron or auto-status change | Frontend can compute `overdue = status !== "completed" && status !== "verified" && status !== "cancelled" && dueDate < now` and show visual indicator |
| **Duplicate task generation** | Title uniqueness per milestone prevents exact duplicates | Frontend should pre-run uniqueness check before calling create |
| **Concurrent assignment** | Last-write-wins (no optimistic locking) | Frontend should refetch task detail before assign; show conflict warning if stale |
| **Batch partial failure** | `$transaction` wrapper — all-or-nothing on create batch | Frontend should treat batch create as atomic. On 422, show errors and let user fix entire batch |
| **Milestone not linked to farm** | 403 `Error.MilestoneFarmContextMissing` | Frontend should disable task management for orphaned milestones |

---

## 3. Data Modeling

### 3.1 Database Schema (Existing)

```
┌─────────────────────────────┐
│ templates                   │
├─────────────────────────────┤
│ id          UUID PK         │
│ name        VARCHAR(255)    │
│ description TEXT NULL        │
│ type        TemplateType    │  ← "task"
│ farm_type   FarmType        │
│ version     INT             │
│ is_active   BOOLEAN         │
│ created_at  TIMESTAMP       │
│ updated_at  TIMESTAMP       │
│ deleted_at  TIMESTAMP NULL  │
└──────────┬──────────────────┘
           │ 1:N
           ▼
┌─────────────────────────────┐
│ template_items              │
├─────────────────────────────┤
│ id          UUID PK         │
│ template_id UUID FK         │
│ item_type   TemplateItemType│  ← "activity"
│ config      JSONB           │  ← {title, description, priority}
│ order_no    INT             │
└─────────────────────────────┘

┌─────────────────────────────┐
│ employee_tasks              │
├─────────────────────────────┤
│ id           UUID PK        │
│ milestone_id UUID FK NULL   │  → production_milestones
│ assigned_to  UUID FK NULL   │  → users (farmer)
│ assigned_date TIMESTAMP NULL│
│ title        VARCHAR(255)   │
│ description  TEXT NULL       │
│ priority     TaskPriority   │  ← low|normal|high|urgent
│ status       TaskStatus     │  ← pending|in_progress|completed|verified|cancelled
│ due_date     TIMESTAMP NULL │
│ start_date   TIMESTAMP NULL │
│ completed_at TIMESTAMP NULL │
│ verified_by  UUID FK NULL   │  → users
│ verified_at  TIMESTAMP NULL │
│ created_by   UUID FK        │  → users (manager/owner)
│ created_at   TIMESTAMP      │
│ updated_at   TIMESTAMP      │
│ deleted_at   TIMESTAMP NULL │
├─────────────────────────────┤
│ IDX: milestone_id           │
│ IDX: assigned_to            │
│ IDX: status                 │
│ IDX: priority               │
│ IDX: due_date               │
│ IDX: created_at             │
└─────────────────────────────┘

┌─────────────────────────────┐
│ daily_logs                  │
├─────────────────────────────┤
│ ...                         │
│ employee_task_id UUID FK    │  → employee_tasks
│ ...                         │
└─────────────────────────────┘
```

### 3.2 Why Separate Template vs. Task

1. **Templates are reusable blueprints** — one template produces unlimited tasks across different milestones and farms.
2. **Tasks are independent work units** — once created, they have their own lifecycle with status, assignment, and daily logs.
3. **No FK from task → template** — by design. Template changes never cascade to existing tasks, preventing unintended side effects.
4. **Hybrid template table** — the `templates` + `template_items` pattern is shared with milestone templates (`type="crop_season"`) and other template types, reducing schema duplication.

### 3.3 Scalability Considerations

- **Indexes** on `milestone_id`, `assigned_to`, `status`, `priority`, `due_date`, `created_at` support the primary query patterns.
- **Soft delete** enables audit trails without data loss.
- **JSONB config** in template items allows schema evolution without migrations.
- **Batch create** with `$transaction` ensures atomicity.

---

## 4. Frontend Implementation Guide

### 4.1 Data Mapping: API Response → UI Model

#### Template List Item

```typescript
// API → UI mapping
interface TemplateListItem {
  id: string;
  name: string;
  description: string | null;
  farmType: string; // Display as badge: "Cultivation"
  isActive: boolean; // Display as status badge
  itemCount: number; // items.length — show as "5 tasks"
  createdAt: string; // Format to locale date
}
```

#### Task List Item

```typescript
interface TaskListItem {
  id: string;
  title: string;
  priority: "low" | "normal" | "high" | "urgent"; // Color-coded badge
  status: "pending" | "in_progress" | "completed" | "verified" | "cancelled";
  assigneeName: string | null; // Resolve from user lookup, not raw UUID
  dueDate: string | null; // Format; show overdue indicator if past
  startDate: string | null;
  createdAt: string;
}
```

> **Important**: The API returns `assignedTo` as a raw UUID. Frontend must join with a user/farm-member list to display readable names. Either:
>
> - Fetch farm members list and build a local lookup map
> - Or request a backend enhancement to include `assignee: { id, name, email }` in the task response

### 4.2 UI/UX Flow — Screen Design

#### Screen 1: Template Management (Admin)

```
┌──────────────────────────────────────────────────┐
│  Employee Task Templates                   [+ Create] │
├──────────────────────────────────────────────────┤
│  🔍 Search by name...     Filter: [All Types ▾]      │
├──────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────┐  │
│  │ Daily Rice Field Tasks        Active  │ ⋮ │  │
│  │ 5 tasks · Cultivation · v2             │   │  │
│  ├────────────────────────────────────────────┤  │
│  │ Pest Inspection Routine       Active  │ ⋮ │  │
│  │ 3 tasks · Cultivation · v1             │   │  │
│  └────────────────────────────────────────────┘  │
│                                                    │
│  ◄ 1 2 3 ►                                        │
└──────────────────────────────────────────────────┘

View States: list → create → detail → edit
Navigation:  EmployeeTaskTemplateList
             ├─ EmployeeTaskTemplateForm (create/edit)
             └─ EmployeeTaskTemplateDetail (view)
```

#### Screen 2: Task Assignment (within Milestone Detail Page)

This is the **new screen** to build. It lives inside the milestone detail page as a tab or section.

```
┌──────────────────────────────────────────────────────────────┐
│  Milestone: Land Preparation                                  │
│  Status: in_progress   Expected: May 1 – May 7               │
├──────────────────────────────────────────────────────────────┤
│  [Tasks] [IoT Assignment] [Sensor Binding]                    │
├──────────────────────────────────────────────────────────────┤
│                                                                │
│  Tasks (4)                [Apply Template ▾]  [+ Add Task]    │
│                                                                │
│  Filter: [All Status ▾] [All Priority ▾]  🔍 Search...       │
│                                                                │
│  ┌──────┬──────────────────┬──────────┬────────┬──────┬────┐ │
│  │  #   │ Title            │ Assignee │ Status │ Pri  │ ⋮  │ │
│  ├──────┼──────────────────┼──────────┼────────┼──────┼────┤ │
│  │  1   │ Check water lvl  │ Nguyen V │ ●doing │ HIGH │ ⋮  │ │
│  │  2   │ Inspect pests    │ —        │ ○todo  │ norm │ ⋮  │ │
│  │  3   │ Prepare soil     │ Tran M   │ ✓done  │ norm │ ⋮  │ │
│  │  4   │ Seed selection   │ Nguyen V │ ✓veri  │ low  │ ⋮  │ │
│  └──────┴──────────────────┴──────────┴────────┴──────┴────┘ │
│                                                                │
│  ◄ 1 ►                                                         │
└──────────────────────────────────────────────────────────────┘

Row actions menu (⋮):
  - View Detail
  - Edit
  - Assign Farmer / Unassign
  - Delete (confirm dialog)
```

#### Screen 2a: Apply Template Modal

```
┌──────────────────────────────────────────────┐
│  Apply Task Template                    [×]  │
├──────────────────────────────────────────────┤
│  🔍 Search templates...                      │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │ ○ Daily Rice Field Tasks (5 tasks)   │   │
│  │ ○ Pest Inspection Routine (3 tasks)  │   │
│  │ ● Harvest Preparation (4 tasks) ←sel │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  Preview:                                    │
│  ┌──────────────────────────────────────┐   │
│  │ 1. Sharpen tools       priority:norm │   │
│  │ 2. Prepare containers  priority:high │   │
│  │ 3. Check weather       priority:norm │   │
│  │ 4. Coordinate labor    priority:urg  │   │
│  └──────────────────────────────────────┘   │
│                                              │
│  [Cancel]                     [Apply to Draft] │
└──────────────────────────────────────────────┘

After "Apply to Draft":
→ Template items are mapped to task draft rows in the batch create form
→ User can edit title, description, priority, add assignees, set dates
→ User confirms → POST batch create
```

#### Screen 2b: Batch Create / Edit Form

```
┌──────────────────────────────────────────────────────────────────────┐
│  Create Tasks for Milestone: Land Preparation                        │
├──────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  ┌────┬──────────────┬─────────────┬──────────┬───────────┬────────┐ │
│  │ #  │ Title *       │ Assignee    │ Priority │ Due Date  │   ✕    │ │
│  ├────┼──────────────┼─────────────┼──────────┼───────────┼────────┤ │
│  │ 1  │ [Sharpen t.] │ [Select ▾]  │ [norm ▾] │ [📅    ]  │  ✕    │ │
│  │ 2  │ [Prepare c.] │ [Select ▾]  │ [high ▾] │ [📅    ]  │  ✕    │ │
│  │ 3  │ [Check wea.] │ [Select ▾]  │ [norm ▾] │ [📅    ]  │  ✕    │ │
│  └────┴──────────────┴─────────────┴──────────┴───────────┴────────┘ │
│                                                                        │
│  [+ Add Row]                                                          │
│                                                                        │
│  [Cancel]                                         [Create Tasks (3)]  │
└──────────────────────────────────────────────────────────────────────┘
```

#### Screen 2c: Task Detail / Edit Drawer

```
┌─────────────────────────────────────────┐
│  Task Detail                       [×]  │
├─────────────────────────────────────────┤
│  Title:     Check water level           │
│  Status:    [in_progress ▾]             │
│  Priority:  [high ▾]                    │
│  Assignee:  Nguyen Van A                │
│             [Unassign] [Reassign]       │
│  Due Date:  May 15, 2026               │
│  Start:     May 10, 2026               │
│  Created:   Apr 12, 2026 by Manager X  │
│  Completed: —                           │
│  Verified:  —                           │
│                                         │
│  Description:                           │
│  ┌─────────────────────────────────┐   │
│  │ Measure and record paddy water  │   │
│  │ level in all sections.           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Delete]              [Save Changes]   │
└─────────────────────────────────────────┘
```

#### Screen 3: Farmer Task View (via Daily Log)

> **Note**: Farmer does not have direct task endpoints. Tasks are accessed through the daily-log module's farmer-scoped queries. The farmer views assigned tasks and submits daily activity logs.

### 4.3 Component Tree

```
MilestoneDetailPage
├── MilestoneTasksTab
│   ├── TaskListToolbar
│   │   ├── ApplyTemplateButton → ApplyTemplateModal
│   │   ├── CreateTaskButton → BatchCreateTaskForm
│   │   ├── StatusFilter (Select)
│   │   └── PriorityFilter (Select)
│   ├── TaskDataTable
│   │   └── TaskRow → TaskRowActions (DropdownMenu)
│   ├── TaskDetailDrawer (Sheet/Drawer)
│   │   ├── TaskStatusSelect
│   │   ├── TaskAssigneeSection
│   │   │   ├── AssignFarmerModal
│   │   │   └── UnassignConfirmDialog
│   │   └── TaskEditForm
│   └── Pagination
├── ApplyTemplateModal
│   ├── TemplateSearchInput
│   ├── TemplateListTable (selectable)
│   └── TemplatePreviewPanel
└── BatchCreateTaskForm
    ├── DynamicTaskRowGrid (useFieldArray)
    └── FarmerSelectDropdown
```

### 4.4 UX Rules

| Rule | Implementation |
| --- | --- |
| Clear Template vs. Task distinction | Templates live in Admin section. Tasks live inside Milestone detail. Never mix navigation. |
| Template changes don't affect tasks | No "sync" button. If template is updated, already-created tasks are unchanged. |
| Show task origin | Optionally store `templateId` as metadata in description or a future field. Currently no FK. |
| Overdue indicator | Compute client-side: `status ∉ {completed, verified, cancelled} && dueDate < now` → show red badge/icon |
| Status badge colors | `pending`: gray, `in_progress`: blue, `completed`: green, `verified`: purple, `cancelled`: red |
| Priority badge colors | `low`: gray, `normal`: default, `high`: orange, `urgent`: red |
| Disable actions by role | Owner/Manager see full CRUD. Farmer sees read-only via daily-log. Hide buttons per role. |

### 4.5 State Management

#### React Query Keys

```typescript
const QUERY_KEYS = {
  // Templates (existing)
  admin: {
    employeeTaskTemplates: {
      list: (query) => ["admin", "employee-task-templates", query],
      detail: (id) => ["admin", "employee-task-templates", id],
    },
  },
  manager: {
    employeeTaskTemplates: {
      list: (query) => ["manager", "employee-task-templates", query],
      detail: (id) => ["manager", "employee-task-templates", id],
    },
  },
  owner: {
    employeeTaskTemplates: {
      list: (query) => ["owner", "employee-task-templates", query],
      detail: (id) => ["owner", "employee-task-templates", id],
    },
  },

  // Tasks (NEW)
  employeeTasks: {
    list: (role, milestoneId, query) => [
      "employee-tasks",
      role,
      milestoneId,
      query,
    ],
    detail: (role, milestoneId, taskId) => [
      "employee-tasks",
      role,
      milestoneId,
      taskId,
    ],
  },
};
```

#### Invalidation Strategy

| After Action | Invalidate |
| --- | --- |
| Batch create tasks | `employeeTasks.list(role, milestoneId, *)` |
| Update task | `employeeTasks.list(role, milestoneId, *)` + `employeeTasks.detail(role, milestoneId, taskId)` |
| Delete task | `employeeTasks.list(role, milestoneId, *)` |
| Assign/Unassign farmer | `employeeTasks.detail(role, milestoneId, taskId)` |
| Template CRUD (admin) | `admin.employeeTaskTemplates.list(*)` |

#### Interaction Pattern

| Action | Pattern | Rationale |
| --- | --- | --- |
| Template list/detail | Pessimistic fetch | Standard CRUD |
| Apply template to draft | **Optimistic local only** | No API call — pure client-side mapping |
| Batch create tasks | Pessimistic submit | Atomic transaction, must confirm success |
| Update task | Pessimistic submit | Single resource update |
| Assign/Unassign | Pessimistic submit | Access control check required server-side |
| Status change | Pessimistic submit | Status transitions need server validation |

---

## 5. Frontend Edge Cases

| Edge Case | Handling Strategy |
| --- | --- |
| **Template missing but task exists** | Tasks have no FK to template. This is expected. Show task normally. If "template origin" display is desired, store template name as metadata during creation. |
| **Template deleted while picker open** | On apply, fetch fresh detail. If 404, close preview, show "Template no longer available" toast, refresh list. |
| **Template inactive** | Manager/Owner list endpoints filter out inactive automatically. Admin sees all with badge. |
| **Partial data (API not fully loaded)** | Use skeleton loaders for task list. Disable actions until data loaded. React Query `isLoading` / `isPending` states. |
| **Assignment failure (farmer not eligible)** | 403 `FarmerNotEligibleForTask` → show inline error in assign modal: "User is not a farmer on this farm." Keep modal open. |
| **Duplicate title in batch** | Zod superRefine catches in-batch duplicates client-side before submit. Server also checks against existing milestone tasks. Show field-level error on the duplicate row. |
| **Duplicate title vs. existing tasks** | 422 `Error.TaskTitleDuplicate` from server → highlight the conflicting title field in the batch form. |
| **Duplicate submission (double-click)** | Disable submit button on first click. Use `mutation.isPending` to show spinner and prevent re-submit. |
| **Network retry** | React Query default retry (3 attempts for queries, 0 for mutations). Show retry CTA on mutation failure. |
| **Stale data (concurrent edit)** | No optimistic locking. Refetch before update if needed. On 404, task was deleted → redirect to list with warning. |
| **Overdue computation** | Client-side only. `new Date(task.dueDate) < new Date() && !['completed','verified','cancelled'].includes(task.status)` |
| **Milestone not linked to farm** | 403 from backend. Disable entire task management section. Show message: "This milestone is not associated with a farm." |

---

## 6. API Contract Summary

### Success Envelope

```json
{
  "statusCode": 200,
  "message": "...",
  "data": { ... }
}
```

### Validation Error Envelope

```json
{
  "statusCode": 422,
  "message": "Unprocessable Entity",
  "errors": [
    {
      "path": "tasks.0.title",
      "message": "Duplicate task title in items"
    }
  ]
}
```

### Business Error Examples

```json
{ "statusCode": 404, "message": "Error.EmployeeTaskNotFound" }
{ "statusCode": 404, "message": "Error.ProductionMilestoneNotFound" }
{ "statusCode": 404, "message": "Error.AssigneeNotFound" }
{ "statusCode": 403, "message": "Error.FarmerNotEligibleForTask" }
{ "statusCode": 403, "message": "Error.MilestoneFarmContextMissing" }
{ "statusCode": 403, "message": "Error.NotFarmOwner" }
{ "statusCode": 403, "message": "Error.NotZoneManager" }
{ "statusCode": 422, "message": "Error.TaskTitleDuplicate", "errors": [{"path": "title", "message": "Error.TaskTitleDuplicate"}] }
```

### Full Endpoint Table

| Domain | Endpoint | Method | Auth | Request |
| --- | --- | --- | --- | --- |
| Template create | `/employee-task-template` | POST | Admin | `{ name, description, type, farmType, isActive, items[] }` |
| Template list (admin) | `/employee-task-template/admin` | GET | Admin | `?page&limit&search&type` |
| Template detail (admin) | `/employee-task-template/:id/admin` | GET | Admin | — |
| Template update | `/employee-task-template/:id/admin` | PUT | Admin | `{ name?, description?, type?, farmType?, isActive?, items[]? }` |
| Template delete | `/employee-task-template/:id/admin` | DELETE | Admin | — |
| Template list (mgr) | `/manager/employee-task-template` | GET | Manager | `?page&limit&search&type` |
| Template detail (mgr) | `/manager/employee-task-template/:id` | GET | Manager | — |
| Template list (owner) | `/owner/employee-task-template` | GET | Owner | `?page&limit&search&type` |
| Template detail (owner) | `/owner/employee-task-template/:id` | GET | Owner | — |
| Task create batch (owner) | `/employee-task/owner/production-milestone/:milestoneId` | POST | Owner | `{ tasks: [{title, description?, priority?, assignedTo?, dueDate?, startDate?}] }` |
| Task create batch (mgr) | `/employee-task/manager/production-milestone/:milestoneId` | POST | Manager | same |
| Task list (owner) | `/employee-task/owner/production-milestone/:milestoneId` | GET | Owner | `?page&limit&search&status&priority` |
| Task list (mgr) | `/employee-task/manager/production-milestone/:milestoneId` | GET | Manager | same |
| Task detail (owner) | `/employee-task/:taskId/owner/production-milestone/:milestoneId` | GET | Owner | — |
| Task detail (mgr) | `/employee-task/:taskId/manager/production-milestone/:milestoneId` | GET | Manager | — |
| Task update (owner) | `/employee-task/:taskId/owner/production-milestone/:milestoneId` | PUT | Owner | `{ title?, description?, priority?, status?, dueDate?, startDate?, assignedTo? }` |
| Task update (mgr) | `/employee-task/:taskId/manager/production-milestone/:milestoneId` | PUT | Manager | same |
| Task delete (owner) | `/employee-task/:taskId/owner/production-milestone/:milestoneId` | DELETE | Owner | — |
| Task delete (mgr) | `/employee-task/:taskId/manager/production-milestone/:milestoneId` | DELETE | Manager | — |
| Assign farmer (owner) | `/employee-task/:taskId/owner/production-milestone/:milestoneId/assign` | POST | Owner | `{ farmerId }` |
| Assign farmer (mgr) | `/employee-task/:taskId/manager/production-milestone/:milestoneId/assign` | POST | Manager | `{ farmerId }` |
| Unassign farmer (owner) | `/employee-task/:taskId/owner/production-milestone/:milestoneId/unassign` | POST | Owner | — |
| Unassign farmer (mgr) | `/employee-task/:taskId/manager/production-milestone/:milestoneId/unassign` | POST | Manager | — |

---

## 7. Flow Diagram (Textual)

```
┌─────────────┐                          ┌─────────────────────┐
│   ADMIN      │                          │  BACKEND             │
│              │   POST /template         │                     │
│  Create      │ ─────────────────────►   │  Validate & store   │
│  Template    │ ◄─────────────────────   │  in templates +     │
│              │   201 Created            │  template_items      │
└─────────────┘                          └─────────────────────┘
       │
       │ Template exists
       ▼
┌─────────────┐                          ┌─────────────────────┐
│ MANAGER /    │  GET /template/:id       │  BACKEND             │
│ OWNER        │ ─────────────────────►   │                     │
│              │ ◄─────────────────────   │  Return template    │
│  1. Browse   │   200 {items:[...]}      │  with items          │
│  templates   │                          └─────────────────────┘
│              │
│  2. Apply    │  (CLIENT-SIDE ONLY)
│  template    │  Map items → task draft rows
│  to draft    │  [{title, desc, priority, assignedTo:null, ...}]
│              │
│  3. Edit     │  User sets dates, assignees, edits titles
│  draft rows  │
│              │                          ┌─────────────────────┐
│  4. Submit   │  POST /employee-task/    │  BACKEND             │
│  batch       │    {role}/milestone/:id  │                     │
│              │ ─────────────────────►   │  Validate ownership │
│              │                          │  Check assignees     │
│              │                          │  Check title unique  │
│              │ ◄─────────────────────   │  Create in $txn      │
│              │   200 [task, task, ...]   │                     │
│              │                          └─────────────────────┘
│  5. Manage   │
│  tasks       │  PUT  → update status/fields
│              │  POST → assign/unassign farmer
│              │  DEL  → soft delete
└─────────────┘
       │
       │ Farmer sees assigned tasks
       ▼
┌─────────────┐                          ┌─────────────────────┐
│   FARMER     │  GET /daily-log/farmer/  │  BACKEND             │
│              │  tasks                    │                     │
│  View tasks  │ ─────────────────────►   │  Return assigned    │
│  Submit logs │ ◄─────────────────────   │  tasks for farmer    │
│              │                          │                     │
│              │  POST /daily-log          │  Validate: max 1    │
│              │ ─────────────────────►   │  log/task/day        │
│              │ ◄─────────────────────   │                     │
└─────────────┘                          └─────────────────────┘
```

---

## 8. Suggestions for Scalability & Maintainability

### Short-term Improvements

1. **Enhance task response with assignee details** — Include `assignee: { id, name, email }` and `creator: { id, name }` in the task response to avoid requiring a separate user lookup on the frontend.

2. **Enforce status transition rules server-side** — Current backend allows any status→any status. Add a guard:

   ```
   pending → in_progress | cancelled
   in_progress → completed | cancelled
   completed → verified
   verified → (terminal)
   cancelled → (terminal)
   ```

3. **Add `templateId` field to EmployeeTask** — Optional FK or metadata field to track which template a task was generated from. Useful for analytics and audit.

4. **Add `verifiedBy` auto-population** — When status changes to `verified`, auto-set `verifiedBy` to the caller ID and `verifiedAt` to now.

5. **Add `completedAt` auto-population** — When status changes to `completed`, auto-set `completedAt` to now. Clear it if status reverts.

### Medium-term Enhancements

6. **Task comments/notes** — Allow manager/owner/farmer to add comments to a task for communication.

7. **Task attachments** — Photo evidence for daily logs and task completion.

8. **Overdue detection cron** — Background job to mark overdue tasks or send notifications.

9. **Bulk status update** — Allow selecting multiple tasks and updating status at once.

10. **Task analytics** — Completion rate per milestone, per farmer, average time to complete.

### Long-term Architecture

11. **Task scheduling/automation** — Cron-based task generation from templates (e.g., recurring daily tasks).

12. **Task dependency graph** — Define predecessor tasks (task B can't start until task A is completed).

13. **Notification system integration** — Real-time push to farmer when task is assigned; to manager when task is completed.

14. **Template marketplace** — Share templates across farms or farm types.

---

## 9. Frontend Implementation File Plan

### New Files to Create

```
farmos_fe/src/
├── services/
│   └── employeeTaskService.ts              # API service layer
├── queries/
│   └── useEmployeeTask.ts                  # React Query hooks
├── schemaValidation/
│   └── employeeTask.ts                     # Zod schemas & types
├── pages/
│   ├── OwnerPage/
│   │   └── EmployeeTasks/
│   │       ├── MilestoneTasksSection.tsx    # Main container (embedded in milestone detail)
│   │       ├── TaskDataTable.tsx            # Task list table
│   │       ├── TaskDetailDrawer.tsx         # View/edit single task
│   │       ├── BatchCreateTaskForm.tsx      # Batch create form
│   │       └── ApplyTemplateModal.tsx       # Template picker + preview
│   └── ManagerPage/
│       └── EmployeeTasks/
│           ├── MilestoneTasksSection.tsx    # Same components, manager hooks
│           └── ... (shared components or re-export)
└── constants/
    └── endpoints.ts                         # Add query keys + endpoint paths
```

### Existing Files to Modify

| File | Change |
| --- | --- |
| `constants/endpoints.ts` | Add `employeeTask` query keys and endpoint paths |
| `routes/routes.ts` | No new routes needed — tasks are embedded in milestone detail page |
| Milestone Detail Page (owner/manager) | Add `<MilestoneTasksSection>` tab |

---

Last updated: 2026-04-12
