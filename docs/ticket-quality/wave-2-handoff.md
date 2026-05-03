# Module 3 — Wave 2 (Admin governance) — Handoff

> Đối chiếu: [ticket-quality-implementation-plan.md](./ticket-quality-implementation-plan.md) v2 mục 5.4 (A1/A2/A3) + 5.7/5.8 (routes + sidebar).
> Tiếp nối: [wave-1-handoff-and-be-gaps.md](./wave-1-handoff-and-be-gaps.md).

## 1. Trạng thái Wave 2

**Hoàn thành 100%** — 3 page Admin governance (A1 Medicines CRUD, A2 Free-text Stats, A3 System Configs) + 2 sidebar group cập nhật + 3 route đăng ký.

| Verify | Kết quả |
|---|---|
| `tsc --noEmit` chỉ trên file Wave 2 | ✅ 0 error |
| `eslint` chỉ trên file Wave 2 | ✅ 0 error, 0 warning |
| Tổng error TS toàn repo | 40 (giữ nguyên baseline — Wave 2 không thêm error mới) |

> Lưu ý: không call BE thật. Page sẽ render skeleton/empty cho đến khi BE B11/B12/B13/B18 up.

## 2. File mới (Wave 2)

```
src/pages/AdminPage/Medicines/
  AdminMedicinesPage.tsx                  ← A1 — list + filter (search + isActive) + pagination + toggle ConfirmDialog
  AdminMedicineFormSheet.tsx              ← A1 — Sheet dùng chung create/edit (mode prop)
  AdminMedicineFreeTextStatsPage.tsx      ← A2 — aggregate customMedicineName + sort + "Tạo thuốc từ tên này" → reuse Sheet A1

src/pages/AdminPage/SystemConfigs/
  AdminTicketSystemConfigsPage.tsx        ← A3 — form 8 key prefix `ticket.` + cross-field validate (Zod) + map FE↔BE key
```

## 3. File đã sửa (Wave 2)

| File | Phạm vi sửa |
|---|---|
| `src/schemaValidatation/medicine.ts` | Đổi `isActive: z.boolean().default(true)` → `.optional()` để tránh Zod INPUT/OUTPUT type mismatch với react-hook-form (`defaultValues.isActive: true` set thủ công trong Form Sheet). |
| `src/components/layout/DashboardLayout/sidebarItemData.ts` | Thêm 4 mục Admin: 2 vào group "Phân tích" (Bảng Hạng DQS, Thống Kê Thuốc Tự Nhập), 2 vào group "Cấu hình Ticket" (Danh Mục Thuốc, Cấu Hình Quy Trình Ticket). Import 4 icon mới: `BarChart3`, `Pill`, `Settings2`, `Trophy`. |
| `src/routes/routes.ts` | Thêm 3 route Admin (allowedRoles `[RoleName.Admin]`): `/dashboard/admin/medicines`, `/dashboard/admin/medicines/freetext-stats`, `/dashboard/admin/system-configs/tickets`. |

## 4. Pattern đã follow

Tất cả page Wave 2 follow nguyên tắc đã enforce qua hạ tầng Wave 1:

- **Form**: `useClearServerFieldErrors` + bắt 422 qua `handleApiErrorUnprocessentity` + mỗi field có lỗi inline. A3 còn map BE dot-key → FE underscore-key trong setError.
- **Style**: page root `<div className="p-6 space-y-6 animate-in fade-in duration-300">`. Badge solid colour: `bg-emerald-500/10` cho active, `bg-amber-500/10` cho withdrawal warning. **0 gradient.**
- **Sheet pattern**: copy từ `AdminTicketCategoriesPage` ([sheet edit pattern](../../src/pages/AdminPage/TicketCategories/AdminTicketCategoriesPage.tsx#L61)) — flex col + sticky footer + `showCloseButton`.
- **ConfirmDialog**: dùng cho destructive (toggle isActive) với copy giải thích hậu quả nghiệp vụ.
- **EmptyState**: dùng [`EmptyState`](../../src/components/common/EmptyState.tsx) cho list rỗng.
- **Card description**: mô tả chức năng card, KHÔNG nói role.
- **Picker**: A2 reuse Form Sheet A1 với prefill name → user không phải gõ lại.
- **Pagination**: default `limit:20`, `Prev/Next` button (mirror TicketCategoriesPage).
- **Cross-field validate (A3)**: Zod `superRefine` cho `gold_sec >= platinum_sec` và `fanout_sec >= gold_sec`.
- **Suffix unit**: pattern "input + absolute span" cho VNĐ/giờ/phút/giây/%/sao/ngày.

## 5. Page A3 — chi tiết quan trọng

### 5.1 Map FE form key ↔ BE config key

`TICKET_SYSTEM_CONFIG_KEY_MAP` trong [systemConfig.ts](../../src/schemaValidatation/systemConfig.ts):

| FE form key (snake) | BE config key (dot) |
|---|---|
| `auto_close_hours` | `ticket.auto_close_hours` |
| `doctor_silence_minutes` | `ticket.doctor_silence_minutes` |
| `priority_window_platinum_sec` | `ticket.priority_window.platinum_sec` |
| `priority_window_gold_sec` | `ticket.priority_window.gold_sec` |
| `priority_window_fanout_sec` | `ticket.priority_window.fanout_sec` |
| `ai_fallback_minutes` | `ticket.ai_fallback_minutes` |
| `commission_max_percent` | `ticket.commission_max_percent` |
| `rating_max_stars` | `ticket.rating_max_stars` |

Submit body dạng `{updates: [{key: "ticket.auto_close_hours", value: "24"}, ...]}`. Khi BE 422 trả `field` là dot-key, FE map ngược về form key trước khi `setError`.

### 5.2 Edge cases A3 đã xử lý

| Edge case | Hành xử |
|---|---|
| Load lần đầu data chưa về | `Skeleton` 8 dòng |
| Query error | `<Alert variant="destructive">` với message VN |
| Form chưa dirty | Disable cả button "Lưu" và "Khôi phục" |
| Submit 422 với BE dot-key | Map ngược về FE form key qua `TICKET_SYSTEM_CONFIG_KEY_MAP` |
| Cross-field violation | Zod `superRefine` set lỗi vào field `gold_sec` hoặc `fanout_sec` |
| Server reset sau success | `useEffect([items])` reset form → button disable lại |

### 5.3 Phụ thuộc BE

Vẫn pending decision 9.6 (xác nhận 8 key chính xác) và 9.12 (đổi config có ảnh hưởng ticket đang trong window không). Khi BE chốt, có thể cần thêm banner cảnh báo trên A3.

## 6. Page A1 + A2 — chi tiết quan trọng

### 6.1 Edge cases đã xử lý

| Page | Edge case | Hành xử |
|---|---|---|
| A1 list | Filter status (Tất cả / Hoạt động / Vô hiệu) | `Select` 3 option, set `isActive` undefined cho "Tất cả" |
| A1 list | Empty | `EmptyState` icon `Pill` + button "Tạo thuốc" |
| A1 toggle | Confirm copy giải thích nghiệp vụ | `"Bác sĩ sẽ không thể chọn cho đơn mới. Đơn thuốc đã kê vẫn được giữ nguyên."` |
| A1 form | Optional string trim → undefined | Sanitize trong `onSubmit` trước khi gửi BE |
| A1 form | `withdrawalPeriodDays` rỗng | `setValueAs` convert "" → undefined để Zod nhận `optional` |
| A1 form | Đường dùng = "không có" | Dùng sentinel `__none__` cho Select item (Radix không cho phép `value=""`) |
| A2 click "Tạo từ tên này" | Reuse Sheet A1 với prefill | `initialDataForPrefill` mock object; mode `"create"` luôn POST mới |
| A2 sort | 3 option × 2 order | `Select` + `Select` cạnh nhau |

### 6.2 BE prerequisite

| Endpoint | BE task | Hiện trạng |
|---|---|---|
| `GET /admin/medicines?page=&limit=&search=&isActive=` | B11 | pending |
| `POST /admin/medicines` | B11 | pending |
| `PATCH /admin/medicines/:id` | B11 | pending |
| `PATCH /admin/medicines/:id/toggle` | B12 | pending |
| `GET /admin/medicines/freetext-stats?page=&limit=&search=&sortBy=&sortOrder=` | B13 | pending |
| `GET /admin/system-configs?prefix=ticket.` | B18 | pending |
| `PATCH /admin/system-configs` body `{updates:[{key,value}]}` | B18 | pending |

## 7. Sidebar mới đã thêm

| Group | Item | URL | Icon |
|---|---|---|---|
| Phân tích (Admin) | Bảng Hạng Bác Sĩ (DQS) | `/dashboard/admin/dqs/leaderboard` | `Trophy` |
| Phân tích (Admin) | Thống Kê Thuốc Tự Nhập | `/dashboard/admin/medicines/freetext-stats` | `BarChart3` |
| Cấu hình Ticket (Admin) | Danh Mục Thuốc | `/dashboard/admin/medicines` | `Pill` |
| Cấu hình Ticket (Admin) | Cấu Hình Quy Trình Ticket | `/dashboard/admin/system-configs/tickets` | `Settings2` |

> 2 sidebar item DQS link đến route Wave 4 (`/dashboard/admin/dqs/leaderboard`) và `/dashboard/admin/doctors/:id/dqs` chưa có route → click sẽ vào NotFound. Chấp nhận tạm cho đến Wave 4.

## 8. Route đã đăng ký

| Path | Component | Wave |
|---|---|---|
| `/dashboard/admin/medicines` | `AdminMedicinesPage` | W2 |
| `/dashboard/admin/medicines/freetext-stats` | `AdminMedicineFreeTextStatsPage` | W2 |
| `/dashboard/admin/system-configs/tickets` | `AdminTicketSystemConfigsPage` | W2 |
| `/dashboard/admin/dqs/leaderboard` | (chưa có) | W4 |
| `/dashboard/admin/doctors/:id/dqs` | (chưa có) | W4 |
| `/dashboard/admin/tickets/:id` | (chưa có) | W5 |

## 9. Sequencing tiếp theo

| Wave | Phụ thuộc BE | FE deliverable | Estimate |
|---|---|---|---|
| **W3 — Owner/Manager creator** | B5/B6/B7/B8 + WS event Module 3 | `TicketDetailPanelV2` + 5 supporting card (Solution / Prescription / Addendum / Rating / Broadcast / Countdown / StatusBanner thanh toán) + 3 modal (CloseAndRate / Abandon / nội bộ) + tích hợp `OwnerTicketsPage` & `ManagerTicketsPage` qua `useTicketQualityFlag` | 2 tuần |
| **W4 — Admin DQS** | B14/B15/B16 + cron B21 đã chạy ≥ 1 đêm | A4 Leaderboard + A5 Doctor DQS Detail + redirect A6 (legacy DoctorPerformance → leaderboard) | 1 tuần |
| **W5 — Polish** | B17, B19, B22, B23 | A7 InvalidateRatingModal + A8 AdminTicketDetailPage + A9 CommissionRules tab scope + P1 DoctorPublicProfile widget + drill-down từ TicketAnalytics → A8 | 1 tuần |
