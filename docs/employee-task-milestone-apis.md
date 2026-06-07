# EmployeeTask của Milestone — API cho role Manager & Owner

Tài liệu liệt kê toàn bộ endpoint hiện đang được sử dụng để **quản lý EmployeeTask trong phạm vi một Production Milestone** cho hai role **Manager** và **Owner**.

---

## 1. Tổng quan kiến trúc

- Hai role dùng **hai path riêng biệt** (`/manager/...` vs `/owner/...`) — không share URL.
- Backend route handler tách riêng nhưng **chia sẻ chung service method** (ví dụ `listTasksByMilestone`, `createTasksForMilestone`, `getTaskDetail`, …), phân biệt scope authorization qua tham số boolean `isOwner`:
  - `isOwner = true` → Owner phải sở hữu farm chứa milestone.
  - `isOwner = false` → Manager phải được gán vào zone của crop season chứa milestone.
- Guard: `@Roles(UserRole.owner)` hoặc `@Roles(UserRole.manager)` cấp controller; `@ActiveUser("userId")` lấy user ID từ JWT.
- Response chuẩn: `{ data: Entity[], meta: PagingMeta }` cho list endpoint.

---

## 2. MANAGER APIs

Base path: `/employee-task/manager/...`
Guard: `@Roles(UserRole.manager)`

| # | Method | Path | Mô tả |
|---|--------|------|-------|
| 1 | GET | `/employee-task/manager/production-milestone/{milestoneId}` | List task của 1 milestone (paginated) |
| 2 | GET | `/employee-task/{taskId}/manager/production-milestone/{milestoneId}` | Chi tiết 1 task |
| 3 | POST | `/employee-task/manager/production-milestone/{milestoneId}` | Tạo batch task |
| 4 | PUT | `/employee-task/{taskId}/manager/production-milestone/{milestoneId}` | Update task |
| 5 | DELETE | `/employee-task/{taskId}/manager/production-milestone/{milestoneId}` | Soft delete task |
| 6 | POST | `/employee-task/{taskId}/manager/production-milestone/{milestoneId}/assign` | Assign farmer vào task |
| 7 | POST | `/employee-task/{taskId}/manager/production-milestone/{milestoneId}/unassign` | Bỏ assign farmer |
| 8 | POST | `/employee-task/{taskId}/manager/production-milestone/{milestoneId}/complete` | Đánh dấu task hoàn thành |
| 9 | GET | `/employee-task/manager/production-milestone/{milestoneId}/eligible-farmers` | Danh sách farmer đủ điều kiện assign |
| 10 | GET | `/employee-task/manager/crop-season/{cropSeasonId}` | List task xuyên suốt crop season (cross-milestone) |

### Bulk actions (FE-side, gọi song song nhiều API đơn lẻ)

| FE hook | Underlying API |
|---------|----------------|
| `useManagerBulkDeleteEmployeeTasks` | Nhiều `DELETE /employee-task/{taskId}/manager/production-milestone/{milestoneId}` chạy `Promise.allSettled` |
| `useManagerBulkUnassignEmployeeTasks` | Nhiều `POST /employee-task/{taskId}/manager/production-milestone/{milestoneId}/unassign` chạy `Promise.allSettled` |

---

## 3. OWNER APIs

Base path: `/employee-task/owner/...`
Guard: `@Roles(UserRole.owner)`

| # | Method | Path | Mô tả |
|---|--------|------|-------|
| 1 | GET | `/employee-task/owner/production-milestone/{milestoneId}` | List task của 1 milestone (paginated) |
| 2 | GET | `/employee-task/{taskId}/owner/production-milestone/{milestoneId}` | Chi tiết 1 task |
| 3 | POST | `/employee-task/owner/production-milestone/{milestoneId}` | Tạo batch task |
| 4 | PUT | `/employee-task/{taskId}/owner/production-milestone/{milestoneId}` | Update task |
| 5 | DELETE | `/employee-task/{taskId}/owner/production-milestone/{milestoneId}` | Soft delete task |
| 6 | POST | `/employee-task/{taskId}/owner/production-milestone/{milestoneId}/assign` | Assign farmer vào task |
| 7 | POST | `/employee-task/{taskId}/owner/production-milestone/{milestoneId}/unassign` | Bỏ assign farmer |
| 8 | POST | `/employee-task/{taskId}/owner/production-milestone/{milestoneId}/complete` | Đánh dấu task hoàn thành |
| 9 | GET | `/employee-task/owner/production-milestone/{milestoneId}/eligible-farmers` | Danh sách farmer đủ điều kiện assign |

> **Lưu ý**: Owner hiện **không có endpoint list-by-crop-season** tương đương như Manager (#10).

---

## 4. Vị trí code

### Backend (`farm_os_be`)

| File | Chi tiết |
|------|----------|
| `src/modules/employee-task/employee-task.controller.ts` | Owner handlers: dòng 35–166, 219–231. Manager handlers: dòng 238–351, 354–384, 458–471 |
| `src/modules/employee-task/employee-task.service.ts` | Shared service; flag `isOwner: boolean` phân nhánh authorization |

### Frontend (`farmos_fe`)

| File | Chi tiết |
|------|----------|
| `src/constants/endpoints.ts` | Manager endpoints: ~dòng 310–329. Owner endpoints: ~dòng 421–440 |
| `src/services/employeeTaskService.ts` | Service layer gọi axios |
| `src/queries/useEmployeeTask.ts` | React Query hooks (`useManager*`, `useOwner*`) |
| `src/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection.tsx` | UI Manager |
| `src/pages/OwnerPage/EmployeeTasks/OwnerMilestoneTasksSection.tsx` | UI Owner |

---

## 5. Mapping FE hook → BE endpoint

### Manager

| FE Hook | BE Endpoint |
|---------|-------------|
| `useManagerListEmployeeTasks(milestoneId, query)` | `GET /employee-task/manager/production-milestone/{milestoneId}` |
| `useManagerEmployeeTaskDetail(taskId, milestoneId)` | `GET /employee-task/{taskId}/manager/production-milestone/{milestoneId}` |
| `useManagerCreateEmployeeTaskBatch(milestoneId)` | `POST /employee-task/manager/production-milestone/{milestoneId}` |
| `useManagerUpdateEmployeeTask(milestoneId)` | `PUT /employee-task/{taskId}/manager/production-milestone/{milestoneId}` |
| `useManagerDeleteEmployeeTask(milestoneId)` | `DELETE /employee-task/{taskId}/manager/production-milestone/{milestoneId}` |
| `useManagerAssignFarmerToTask(milestoneId)` | `POST .../assign` |
| `useManagerUnassignFarmerFromTask(milestoneId)` | `POST .../unassign` |
| `useManagerCompleteEmployeeTask(milestoneId)` | `POST .../complete` |
| `useManagerEligibleFarmers(milestoneId)` | `GET .../eligible-farmers` |
| `useManagerListCropSeasonTasks(cropSeasonId, query)` | `GET /employee-task/manager/crop-season/{cropSeasonId}` |

### Owner

| FE Hook | BE Endpoint |
|---------|-------------|
| `useOwnerListEmployeeTasks(milestoneId, query)` | `GET /employee-task/owner/production-milestone/{milestoneId}` |
| `useOwnerEmployeeTaskDetail(taskId, milestoneId)` | `GET /employee-task/{taskId}/owner/production-milestone/{milestoneId}` |
| `useOwnerCreateEmployeeTaskBatch(milestoneId)` | `POST /employee-task/owner/production-milestone/{milestoneId}` |
| `useOwnerUpdateEmployeeTask(milestoneId)` | `PUT /employee-task/{taskId}/owner/production-milestone/{milestoneId}` |
| `useOwnerDeleteEmployeeTask(milestoneId)` | `DELETE /employee-task/{taskId}/owner/production-milestone/{milestoneId}` |
| `useOwnerAssignFarmerToTask(milestoneId)` | `POST .../assign` |
| `useOwnerUnassignFarmerFromTask(milestoneId)` | `POST .../unassign` |
| `useOwnerCompleteEmployeeTask(milestoneId)` | `POST .../complete` |
| `useOwnerEligibleFarmers(milestoneId)` | `GET .../eligible-farmers` |

---

## 6. Sự khác biệt giữa Manager và Owner

| Khía cạnh | Manager | Owner |
|-----------|---------|-------|
| Scope authorization | Phải được gán vào **zone** của crop season | Phải sở hữu **farm** chứa milestone |
| Tham số `isOwner` (service) | `false` | `true` |
| Endpoint list-by-crop-season | ✅ Có (#10) | ❌ Chưa có |
| Endpoint bulk delete/unassign (FE) | ✅ Có hook bulk | ❌ Chưa có hook bulk |
| Default pagination (FE) | `page: 1, limit: 10` | `page: 1, limit: 6` |

---

## 7. Ghi chú nghiệp vụ

- **Assign farmer**: chỉ chấp nhận user là active user + farm member với role `farmer` trong farm tương ứng.
- **Complete task**: set `status = completed`, stamp `completedAt = now`, đồng thời emit tracking-log entries cho các field được cấu hình.
- **Delete**: soft delete (không xoá vật lý).
- **Eligible farmers**: trả về toàn bộ active farm member có role `farmer` thuộc farm của milestone đó.
