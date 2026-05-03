# Module 3 — Ticket Quality & DQS — FE Web Implementation Plan (v2)

> **Đối chiếu**:
> - BE phân tích chi tiết: [farm_os_be/docs/analysis/module-3-ticket-quality-dqs.md](../../../farm_os_be/docs/analysis/module-3-ticket-quality-dqs.md)
> - BR Changes: [farm_os_be/docs/FarmOS_Business_Rules_Changes.md §Module 3](../../../farm_os_be/docs/FarmOS_Business_Rules_Changes.md#module-3)
> - FE convention: [farmos_fe/DEVELOPMENT.md](../../DEVELOPMENT.md)
> - Quy tắc form/error/date: [docs/form-error-and-date-handling.md](../../../docs/form-error-and-date-handling.md)
>
> **Phạm vi**: chỉ FE web (`farmos_fe/`). Mobile (Doctor / Farmer) có spec riêng — **không** plan ở đây.
>
> **Ràng buộc role-scope của web** (memory `project_dashboard_scope` + sidebar comment trong [sidebarItemData.ts](../../src/components/layout/DashboardLayout/sidebarItemData.ts) đã ngắt mục Doctor): web dashboards chỉ phục vụ **Admin / Owner / Manager**. Farmer là mobile-only, **Doctor không có web dashboard**. Do đó:
> - Mọi screen Doctor liệt kê trong BE module-3 doc (Broadcasts inbox, Resolve form, Reissue prescription, Addendum…) → **KHÔNG build trên web**.
> - Trang web `DoctorPage/Tickets/DoctorTicketsPage.tsx` hiện có là **legacy** từ luồng cũ; Module 3 không mở rộng. Khi mobile sẵn sàng, sẽ ẩn route trong [routes.ts](../../src/routes/routes.ts) (đã sẵn pattern comment trong sidebar).
> - FE web tập trung vào: **Admin** (cấu hình + governance) và **creator role Owner/Manager** (review-close-rate-abandon ticket sau khi Doctor resolve).

---

## Mục lục

- [1. Tóm tắt trạng thái hiện tại](#1-tóm-tắt-trạng-thái-hiện-tại)
- [2. Phân tích sâu — luồng nghiệp vụ và edge case](#2-phân-tích-sâu--luồng-nghiệp-vụ-và-edge-case)
- [3. Quy ước FE bắt buộc tuân thủ](#3-quy-ước-fe-bắt-buộc-tuân-thủ)
- [4. Inventory component / hook tái sử dụng](#4-inventory-component--hook-tái-sử-dụng)
- [5. Kế hoạch build](#5-kế-hoạch-build)
- [6. Edge case từng action](#6-edge-case-từng-action)
- [7. Định nghĩa "Done"](#7-định-nghĩa-done)
- [8. Sequencing](#8-sequencing)
- [9. Câu hỏi/decision cần chốt với BE/PM](#9-câu-hỏidecision-cần-chốt-với-bepm)
- [10. Rủi ro & lưu ý](#10-rủi-ro--lưu-ý)
- [11. QC review pass](#11-qc-review-pass)
- [12. UI/UX review pass](#12-uiux-review-pass)

---

## 1. Tóm tắt trạng thái hiện tại

### 1.1 Backend — đã có gì

| Hạng mục | Trạng thái | File / Endpoint |
|---|---|---|
| Schema Prisma toàn bộ Module 3 | ✅ 100% | `SupportTicket` + `TicketSolution` + `Prescription/PrescriptionItem` + `Medicine` + `TicketAddendum` + `TicketRating` + `TicketAbandonLog` + `DoctorQualitySnapshot` + `SystemConfig` |
| Tạo ticket incident | ✅ | `POST /ticket/incident` |
| List/detail ticket (owner/manager/doctor) | ✅ | `GET /ticket/incident/{owner,manager,doctor}/...` |
| Doctor accept | ✅ | `PUT /ticket/incident/doctor/:id/accept` |
| End-of-chat (KHÔNG phải close) | ✅ | `PUT /ticket/incident/:id/end` — chỉ end-of-chat, không set close fields, không trigger payout |
| Prescription create/list/detail (sơ sài) | ✅ | `POST/GET /ticket/:id/prescriptions` — chỉ `medicineName + dosage`; chưa có `items[]`, instructions, frequency, medicineId, withdrawalPeriodDays |
| Online status toggle | ✅ | `PUT /doctor-profile/online-status` |
| AI fallback queue producer | ✅ | `enqueueAiFallbackAfterNoDoctorAccepted` (chưa có handler) |
| Auto-end-after-prescription timer | ✅ | `enqueueAutoEndAfterPrescription` (≠ auto-close, không payout) |

### 1.2 Backend — sẽ build (24 task B1–B24); FE web sử dụng

| BE Task | Endpoint | FE web cần | Notes |
|---|---|---|---|
| B2 | `POST /tickets/:id/resolve` | ❌ Không (mobile Doctor) | |
| B5 | `POST /tickets/:id/close` | ✅ Owner/Manager | Endpoint **mới**, KHÔNG reuse `/end` |
| B6 | `POST /tickets/:id/rating` | ✅ Owner/Manager | Chỉ creator |
| B7 | `POST /tickets/:id/abandon-resolution` | ✅ Owner/Manager | `FALLBACK_AI` / `REFUND_TICKET` |
| B8 | `GET /tickets/:id/full` | ✅ Admin/Owner/Manager | Full payload (solution + prescription + addenda + rating + broadcasts + abandonLogs) |
| B11 | `GET/POST/PATCH /admin/medicines` | ✅ Admin | CRUD danh mục thuốc |
| B12 | `PATCH /admin/medicines/:id/toggle` | ✅ Admin | Toggle `isActive` |
| B13 | `GET /admin/medicines/freetext-stats` | ✅ Admin | Aggregate `customMedicineName` |
| B14 | `GET /admin/doctors/:id/dqs` | ✅ Admin | DQS chi tiết 1 doctor |
| B15 | `GET /admin/doctors/:id/dqs-history` | ✅ Admin | Lịch sử |
| B16 | `GET /admin/dqs-leaderboard?date=` | ✅ Admin | Bảng hạng |
| B17 | `POST /admin/tickets/:id/invalidate-rating` | ✅ Admin | Set `invalidatedAt/By/Reason` |
| B18 | `GET/PATCH /admin/system-configs?prefix=ticket.` | ✅ Admin | Cấu hình runtime |
| B19 | `GET /doctors/:id/public` | ✅ Owner/Manager | KHÔNG trả tier |
| B1, B3, B4, B9, B10 | reject / extend prescription / addenda / broadcasts / medicines catalog cho Doctor | ❌ Không (mobile Doctor) | |
| B20–B24 | Background jobs | ❌ Không (BE) | FE chỉ subscribe các WS event do B24 phát |

> **Quy tắc nghiệp vụ FE bắt buộc tôn trọng**: chỉ **creator** mới close/rate/abandon. Owner-of-farm KHÔNG đóng được ticket do Manager dưới quyền tạo. Quyền **đọc** thì hierarchical theo zone/farm. Admin **KHÔNG** có endpoint force-close (đã bỏ); Admin chỉ có invalidate-rating.

### 1.3 Frontend web — đã có gì

| Vùng | File / Module | Trạng thái cho Module 3 |
|---|---|---|
| Tickets list + chat (Owner) | [src/pages/OwnerPage/Tickets/OwnerTicketsPage.tsx](../../src/pages/OwnerPage/Tickets/OwnerTicketsPage.tsx) | Cũ — chỉ tạo + chat + button "Kết thúc ticket" gọi `endIncident` (= `/end` end-of-chat). Chưa có review solution / close / rate / abandon. |
| Tickets list + chat (Manager) | [src/pages/ManagerPage/Tickets/ManagerTicketsPage.tsx](../../src/pages/ManagerPage/Tickets/ManagerTicketsPage.tsx) | Cùng pattern Owner. |
| Tickets list + chat (Doctor) — legacy | [src/pages/DoctorPage/Tickets/DoctorTicketsPage.tsx](../../src/pages/DoctorPage/Tickets/DoctorTicketsPage.tsx) | Chỉ accept + chat + tạo prescription (2 trường). KHÔNG mở rộng (mobile thay thế). |
| Service ticket cũ | [src/services/ticketService.ts](../../src/services/ticketService.ts) | `ownerListByFarm`, `ownerDetail`, `managerListByZone`, `managerDetail`, `doctor*`, `createIncident`, `endIncident`, `listMessages/createMessage`, `listPrescriptions/createPrescription/getPrescriptionDetail` |
| Service ticket v2 (Module 2) | [src/services/ticketV2Service.ts](../../src/services/ticketV2Service.ts) | List/detail/create/cancel/balance + admin variants |
| Schema validation ticket | [src/schemaValidatation/ticket.ts](../../src/schemaValidatation/ticket.ts) | Status enum đã có `resolved/closed`. **Chưa có** `closeReason`, `payoutAt`, `payoutPercentSnapshot`, `payoutTierSnapshot`, `isAIResolved`, `aiResolvedAt`, `closedBy`, `resolvedAt`, `solution`, `addenda`, `rating`, `broadcasts`, `abandonLogs`. |
| Schema validation prescription | [src/schemaValidatation/prescription.ts](../../src/schemaValidatation/prescription.ts) | **Chỉ** `medicineName + dosage`. Thiếu: `items[]`, frequency, instructions ≥30, route, durationDays, warnings, status, supersededById, withdrawalPeriodDays, customMedicineName. |
| Realtime events | [src/constants/realtime.ts](../../src/constants/realtime.ts), [src/hooks/useRealtimeTicket.ts](../../src/hooks/useRealtimeTicket.ts) | Đã có: `ticket.incident.created/ended`, `ticket.message.created`. Thiếu: `ticket.assigned`, `ticket.resolved`, `ticket.closed`, `wallet.credited`, `ticket.fallback-required`, `dqs.tier_changed`. |
| Commission rules (Admin) — Module 2 | [src/pages/AdminPage/CommissionRules/AdminCommissionRulesPage.tsx](../../src/pages/AdminPage/CommissionRules/AdminCommissionRulesPage.tsx), [src/schemaValidatation/commissionRule.ts](../../src/schemaValidatation/commissionRule.ts) | Có form + scope `CATEGORY_DEFAULT / DOCTOR_TIER / DOCTOR`, có enum `DoctorTier`. Module 3 chỉ cần shortcut `scope=DOCTOR_TIER`, không build mới. |
| Ticket categories (Admin) — Module 2 | [src/pages/AdminPage/TicketCategories/](../../src/pages/AdminPage/TicketCategories/) | Có. Module 3 không động. |
| Doctor performance | [src/pages/AdminPage/DoctorPerformance/AdminDoctorPerformancePage.tsx](../../src/pages/AdminPage/DoctorPerformance/AdminDoctorPerformancePage.tsx) | Mock thuần (3 row hard-code). Sidebar đã comment route này (legacy). |
| Ticket analytics | [src/pages/AdminPage/TicketAnalytics/AdminTicketAnalyticsPage.tsx](../../src/pages/AdminPage/TicketAnalytics/AdminTicketAnalyticsPage.tsx) | Trang demo + mock; không bắt buộc thay ở Module 3. |
| Endpoint registry | [src/constants/endpoints.ts](../../src/constants/endpoints.ts) | Có `TICKET`, `TICKET_V2`, `TICKET_CATEGORIES`, `COMMISSION_RULES`. Thiếu: medicines, system-configs, dqs, broadcasts, addenda, rating, close, resolve, reject, abandon, full, invalidate-rating, public-doctor-profile. |
| Sidebar items | [src/components/layout/DashboardLayout/sidebarItemData.ts](../../src/components/layout/DashboardLayout/sidebarItemData.ts) | Có nhóm "Cấu hình Ticket" (Admin) và "Vận hành" (Owner/Manager). Sẽ chèn các mục mới Module 3 vào đây. |

### 1.4 Đánh giá overall

- **FE web Module 3 ≈ 0%**. Toàn bộ luồng "review giải pháp → close → rate → abandon" và toàn bộ governance Admin (medicines, DQS leaderboard, system-configs, invalidate rating) đều chưa có.
- Không có mảng nào cần **build lại** — chỉ cần:
  1. Mở rộng schema/service/hook ticket cũ để hấp thụ payload Module 3 (B8).
  2. Build mới các page Admin governance.
  3. Build mới các action modal Owner/Manager (close + rate + abandon).
  4. Mở rộng realtime listener với 6 event mới.

---

## 2. Phân tích sâu — luồng nghiệp vụ và edge case

### 2.1 Hai vòng đời tách biệt

| Vòng | UI implication |
|---|---|
| **Ticket lifecycle** `open → assigned → in_progress → resolved → closed` | Trang detail render khác biệt từng state. State `resolved` mở khoá panel "Review giải pháp + Close + Rate + Abandon". State `closed` là read-only forever. |
| **DQS** (analytical, snapshot per-day) | Chỉ Admin xem. KHÔNG render `tier` ở UI Owner/Manager hay public. |

### 2.2 Trạng thái mới cần thể hiện trên detail ticket

- `resolvedAt`, `closedAt`, `closeReason` enum: `CREATOR_CONFIRMED` / `AUTO_CLOSED` / `AI_RESOLVED_NO_DOCTOR` / `ABANDON_REFUND` / `ABANDON_FALLBACK_AI`.
- `closedBy` có thể là sentinel `'SYSTEM_AUTO_CLOSE'` → render "Hệ thống tự đóng".
- `isAIResolved` + `aiResolvedAt` → badge "Xử lý bởi AI" (không cho rate, không cho abandon, không có payout).
- `payoutAt`, `payoutPercentSnapshot`, `payoutTierSnapshot` → block "Đã thanh toán cho bác sĩ" (Admin thấy chi tiết tier; Owner/Manager chỉ thấy "đã thanh toán").
- Solution 4 trường: `rootCause`, `rootCauseReason`, `treatment`, `prevention` (immutable sau resolve, mỗi trường ≥ 20 ký tự).
- Addenda: append-only list, type `SOLUTION_NOTE / PRESCRIPTION_NOTE / CORRECTION`.
- Prescription: items[] có `medicineId | customMedicineName`, `dosage`, `frequency`, `route?`, `durationDays?`, `instructions ≥ 30`, `warnings?`, `withdrawalPeriodDays` từ `Medicine`. Status `ISSUED / SUPERSEDED`, `supersededById?`.
- Rating: `stars` (1–5), `comment?`, `tags[]?`, `invalidatedAt/By/Reason?`.
- Broadcasts: list `(doctorId, status PENDING/ACCEPTED/REJECTED/IGNORED, sentAt, respondedAt)`.
- AbandonLogs: list `(resolution, reason, createdBy, createdAt)`.

### 2.3 Auto-close timer countdown UX

BR-74 + B22: hệ thống nhắc creator ở 2/3 window; expire → tự đóng + payout. FE web:
- Hiển thị countdown trên detail (ví dụ "Còn 16 giờ 32 phút trước khi tự đóng").
- WS `ticket.closed` về với `closedBy='SYSTEM_AUTO_CLOSE'` → toast + invalidate `tickets.full(id)`.
- WS `ticket.fallback-required` (B23 — Doctor accept rồi không resolve trong `doctor_silence_minutes`) → mở `AbandonResolutionModal` cho creator (FALLBACK_AI vs REFUND_TICKET).

### 2.4 Ràng buộc role / quyền action (mục #14 BE doc)

| Role | List | Detail | Close/Rate/Abandon |
|---|---|---|---|
| Admin | tất cả | tất cả | ❌ chỉ invalidate-rating |
| Owner | mọi ticket trong farm thuộc Owner | mọi ticket trong farm | ✅ chỉ ticket mình tạo |
| Manager | mọi ticket trong zone phụ trách | như list | ✅ chỉ ticket mình tạo |
| Farmer (mobile-only) | mọi ticket trong zone là member | như list | ✅ chỉ ticket mình tạo |

→ FE web check `userId === ticket.createdBy` trước khi render button close/rate/abandon. Nếu user là Owner-of-farm nhưng không phải creator → vẫn xem được, nhưng action ẩn (badge "Bạn không phải là người tạo ticket này").

### 2.5 Feature flag `feature.ticket_resolve_quality_v2`

BR Changes 3.4 quy tắc 8 + BE doc Deviation: nếu flag **off** → chạy luồng cũ (30k ngay khi resolved). Nếu **on** → chạy flow Module 3.

→ FE web đọc qua `useFeatureDetail('ticket_resolve_quality_v2')` (đã có ở [src/queries/useFeature.ts](../../src/queries/useFeature.ts)) và gate hiển thị các block mới (Solution 4 trường, Close/Rate/Abandon button, countdown, addenda) — fallback sang UI cũ (button "Kết thúc ticket" gọi `/end`) khi flag off.

---

## 3. Quy ước FE bắt buộc tuân thủ

### 3.1 Form / error / date — theo [docs/form-error-and-date-handling.md](../../../docs/form-error-and-date-handling.md)

Mọi form trong Module 3 phải:

1. Gọi `useClearServerFieldErrors(form)` ngay sau `useForm()`.
2. Trong `onSubmit`:
   ```ts
   try {
     await mutateAsync(data);
   } catch (error) {
     if (isApiErrorUnprocessableEntityResponse<BodyType>(error)) {
       handleApiErrorUnprocessentity<BodyType>(
         error.response!.data.errors,
         form.setError,
         { getValues: form.getValues },
       );
       return;
     }
     if (isApiErrorResponse(error)) {
       toast.error(error.response?.data.message ?? "Thao tác thất bại");
       return;
     }
     toast.error("Đã có lỗi xảy ra");
   }
   ```
3. **Mỗi field** trong JSX truyền `error={form.formState.errors.<field>?.message}` (hoặc dùng `<Field error={...}>` từ [src/components/ui/field.tsx](../../src/components/ui/field.tsx)).
4. Field dạng ngày dùng `Controller` + `DatePickerField` (pattern hiện có trong [AdminCommissionRulesPage.tsx:91](../../src/pages/AdminPage/CommissionRules/AdminCommissionRulesPage.tsx#L91)). Form state lưu `yyyy-MM-dd`. Service convert sang ISO bằng helper `toISO(v)` trước khi gửi BE.
5. Hiển thị lỗi BE: dùng `toast.error(getApiErrorMessageVi(err))` (helper Vietnamese fallback) cho lỗi 4xx/5xx ngoài 422.
6. Mọi mutation **bắt buộc** invalidate query đúng (theo `QUERY_KEYS` trong [src/constants/endpoints.ts](../../src/constants/endpoints.ts)) — DEVELOPMENT.md mục 11.

### 3.2 Style / layout — theo [DEVELOPMENT.md](../../DEVELOPMENT.md)

- **Không gradient** dưới mọi hình thức (không `bg-gradient-*`, không text gradient, không radial). Dùng semantic token: `bg-card`, `bg-muted`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `border`, `text-destructive`, `bg-emerald-500/10` (cho success badge), `bg-amber-500/10` (warning), `bg-red-500/10` (danger) — pattern đã dùng trong [StatCard.tsx](../../src/components/common/StatCard.tsx).
- Page root: `<div className="space-y-6 animate-in fade-in duration-300">`.
- Panel slide-in/out: pattern `show` state + `requestAnimationFrame` + `setTimeout(onBack, 300)` (DEVELOPMENT.md mục Animation Patterns; tham khảo [OwnerTicketsPage.tsx:155-167](../../src/pages/OwnerPage/Tickets/OwnerTicketsPage.tsx#L155)).
- Tailwind only — không inline style, không CSS module.
- Naming: Page PascalCase + `Page.tsx` suffix; component PascalCase; service camelCase + `Service`; hook `use*`.

### 3.3 Card descriptions — quy tắc nội dung

Tất cả `<CardDescription>` mô tả **chức năng của card**, KHÔNG mô tả "ai có quyền làm gì". Ví dụ:

| ❌ Không tốt | ✅ Tốt |
|---|---|
| "Chỉ admin được cập nhật cấu hình này." | "Cấu hình thời gian tự đóng ticket, ngưỡng im lặng của bác sĩ và trần hoa hồng." |
| "Bác sĩ phải hoàn thành 4 trường này." | "Bốn trường giải pháp do bác sĩ ghi sau khi xử lý ticket." |
| "Owner xem được lịch sử." | "Lịch sử thay đổi hạng và điểm DQS của bác sĩ theo từng ngày." |

Quyền access đã được enforce ở `ProtectedRoute` + check `createdBy` ở component — không lặp lại trong copywriting.

### 3.4 UI/UX — bắt buộc

- **Không bắt user nhập tay ID** — mọi field reference (doctorId, medicineId, categoryId, farmId, zoneId…) phải dùng picker/select gọi API list.
- Picker / lookup query: `limit ≤ 90` (cap an toàn cho danh sách dropdown, đủ phủ thực tế nhưng không lazy load nặng).
- Search-as-you-type: dùng `Command` (`CommandInput` + `CommandList` + `CommandItem` từ [src/components/ui/command.tsx](../../src/components/ui/command.tsx)) bọc trong `Popover`, debounce 300ms qua `useDebounce`.
- Destructive action: dùng `ConfirmDialog`.
- Empty state: dùng `EmptyState` từ [src/components/common/EmptyState.tsx](../../src/components/common/EmptyState.tsx).
- Loading state: dùng `Skeleton` cho table; `Loader2` `animate-spin` cho action button.

---

## 4. Inventory component / hook tái sử dụng

### 4.1 shadcn/ui (đã cài — dùng nguyên)

| Component | Dùng cho |
|---|---|
| `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` | Mọi panel/section |
| `Badge` | Status (closed reason, tier, isAIResolved, withdrawal warning) |
| `Button` | Mọi action |
| `Input`, `Textarea`, `Label` | Form text fields |
| `Field`, `FieldError`, `FieldGroup` | Form layout chuẩn (đã hỗ trợ `error` prop) |
| `Select`, `SelectTrigger`, `SelectContent`, `SelectItem` | Enum nhỏ (closeReason, abandon resolution, tier filter) |
| `Calendar` + `Popover` | DatePickerField cho cấu hình effectiveFrom/To, leaderboard date filter |
| `Sheet`, `SheetHeader`, `SheetContent`, `SheetTitle`, `SheetDescription` | Edit form Medicine, edit System Config, Admin Ticket Detail drawer |
| `Dialog`, `DialogHeader`, `DialogContent`, `DialogTitle`, `DialogDescription` | CloseAndRateModal, AbandonResolutionModal, InvalidateRatingModal |
| `ConfirmDialog` | Confirm close, confirm toggle medicine, confirm invalidate rating |
| `Switch` | Toggle `isActive` Medicine, toggle features |
| `Checkbox` | Tags rating, multi-select danh mục |
| `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` | Admin Ticket Detail (Solution / Prescription / Addenda / Rating / Broadcasts / Abandon Logs); DQS Detail (Tổng quan / Lịch sử) |
| `Skeleton` | Loading state table & detail |
| `Separator` | Phân tách section |
| `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`, `TableHead` | Mọi list |
| `Sonner` (`toast`) | Notification |
| `Command`, `CommandInput`, `CommandList`, `CommandItem`, `CommandEmpty`, `CommandGroup` | Doctor picker, Medicine picker (search-as-you-type) |
| `Alert`, `AlertTitle`, `AlertDescription` | Cảnh báo withdrawal period, banner "ticket đã được Admin invalidate rating" |
| `Progress` | Countdown auto-close (% còn lại) |
| `Popover` | Container picker, date picker |
| `Tooltip` | Giải thích icon, hint cho 5 sub-score DQS |

### 4.2 Common components (`src/components/common/`)

| Component | Dùng cho |
|---|---|
| [`StatCard.tsx`](../../src/components/common/StatCard.tsx) | Strip metric trên Admin DQS Leaderboard (tổng doctor PLATINUM/GOLD/SILVER/BRONZE) |
| [`KpiCard.tsx`](../../src/components/common/KpiCard.tsx) | Doctor DQS Detail — 5 sub-score |
| [`EmptyState.tsx`](../../src/components/common/EmptyState.tsx) | Khi list rỗng (medicines, dqs leaderboard, addenda, broadcasts) |
| [`LoadingCard.tsx`](../../src/components/common/LoadingCard.tsx) | Loading detail panel |
| [`StatusBanner.tsx`](../../src/components/common/StatusBanner.tsx) | Banner "Ticket xử lý bởi AI", "Ticket đang chờ creator close", "Rating đã bị Admin vô hiệu hoá" |
| [`pro-pagination.tsx`](../../src/components/common/pro-pagination.tsx) (`ProPagination`) | Pagination cho Medicines list, DQS leaderboard, free-text stats |
| [`TableSkeleton.tsx`](../../src/components/common/TableSkeleton.tsx) | Skeleton cho table |

### 4.3 Hook & utility (đã có)

| Hook / Util | Dùng cho |
|---|---|
| [`useClearServerFieldErrors`](../../src/hooks/useClearServerFieldErrors.ts) | Tự xoá lỗi server khi user sửa |
| [`useDebounce`](../../src/hooks/useDebounce.tsx) | Debounce search input (Doctor picker, Medicine picker) |
| [`usePaginateRange`](../../src/hooks/usePaginateRange.tsx) | Đã được `ProPagination` dùng |
| [`useQueryParams`](../../src/hooks/useQueryParams.tsx) | URL search params cho list filter |
| [`useRealtimeTicket`](../../src/hooks/useRealtimeTicket.ts) | Sẽ mở rộng (mục 5.1 I8) |
| [`useTicketSubscription`](../../src/hooks/useTicketSubscription.ts) | Subscribe room ticket khi vào detail |
| [`useFeatureDetail`](../../src/queries/useFeature.ts) | Đọc feature flag `ticket_resolve_quality_v2` |
| `handleApiErrorUnprocessentity`, `isApiErrorUnprocessableEntityResponse`, `isApiErrorResponse` (`@/lib/axios`, `@/lib/utils`) | Xử lý lỗi 422 |
| `getApiErrorMessageVi` (`@/lib/error-message`) | Dịch lỗi BE sang VN |
| `cn`, `toISO`, `parseBackendDate` patterns | Utility chuẩn |
| `useAdminListUsers({role: 'doctor', limit: 90})` (đã có `adminService.listUsers`) | Doctor picker cho form invalidate-rating, DQS lookup, commission rule scope DOCTOR |

---

## 5. Kế hoạch build

### 5.1 Hạ tầng (Infra) — phải làm trước

| # | Hạng mục | File mới / sửa | Ghi chú |
|---|---|---|---|
| I1 | Mở rộng `endpoints.ts` thêm: `TICKET.RESOLVE`, `TICKET.CLOSE`, `TICKET.REJECT`, `TICKET.ADDENDA`, `TICKET.RATING`, `TICKET.ABANDON`, `TICKET.FULL`, `MEDICINES.{ADMIN_LIST, ADMIN_CREATE, ADMIN_DETAIL, ADMIN_UPDATE, ADMIN_TOGGLE, FREETEXT_STATS, CATALOG}`, `SYSTEM_CONFIGS.{LIST, PATCH}`, `DQS.{DOCTOR_DETAIL, DOCTOR_HISTORY, LEADERBOARD}`, `ADMIN_TICKETS.{INVALIDATE_RATING, FULL}`, `DOCTORS.PUBLIC`. Thêm `QUERY_KEYS.medicines / systemConfigs / dqs / ticketsV3 (resolved-ticket extended)` | Sửa [src/constants/endpoints.ts](../../src/constants/endpoints.ts) | Mỗi key kèm comment B# tham chiếu BE |
| I2 | Mở rộng `TicketIncidentResSchema` thêm các trường optional: `resolvedAt`, `closedAt`, `closeReason`, `closedBy`, `isAIResolved`, `aiResolvedAt`, `payoutAt`, `payoutPercentSnapshot`, `payoutTierSnapshot` | Sửa [src/schemaValidatation/ticket.ts](../../src/schemaValidatation/ticket.ts) | Tất cả `optional()` để không vỡ flow cũ; enum `closeReason` định nghĩa Zod riêng |
| I3 | Tạo schema mới: `solution.ts`, `addendum.ts`, `rating.ts`, `abandonLog.ts`, `broadcast.ts`, `medicine.ts`, `dqs.ts`, `systemConfig.ts`. Mở rộng `prescription.ts` thêm `items[]`, `withdrawalPeriodDays`, status `ISSUED/SUPERSEDED`, `supersededById`, `customMedicineName`, body create với validate `instructions ≥ 30`, `dosage` & `frequency` mandatory | `src/schemaValidatation/*` | Mỗi enum mirror BE — dùng `z.enum([...])` |
| I4 | Tạo `TicketFullResSchema` (B8) lồng `solution + prescription + addenda + rating + broadcasts + abandonLogs` | `src/schemaValidatation/ticket.ts` | Thêm cuối file ticket.ts |
| I5 | Service mới: `medicineService.ts`, `systemConfigService.ts`, `dqsService.ts`, `doctorPublicService.ts`. Mở rộng `ticketService.ts` thêm: `getFull`, `closeByCreator`, `rateByCreator`, `abandonResolution`, `adminInvalidateRating`. Mở rộng prescription endpoint return shape (items[]) | `src/services/*` | Theo pattern axios sẵn — DEVELOPMENT.md mục API Integration Layer |
| I6 | Query hook mới: `useMedicine.ts`, `useSystemConfig.ts`, `useDqs.ts`, `useDoctorPublic.ts`. Mở rộng `useTicket.ts` thêm: `useTicketFull`, `useCloseTicket`, `useRateTicket`, `useAbandonResolution`, `useAdminInvalidateRating`. Mỗi mutation **bắt buộc** invalidate `tickets.all` + `tickets.full(id)` (DEVELOPMENT.md mục Critical Cache Invalidation) | `src/queries/*` | List query default limit 20; picker query limit 90 |
| I7 | Cập nhật [src/constants/realtime.ts](../../src/constants/realtime.ts) thêm 6 event: `TicketAssigned = "ticket.assigned"`, `TicketResolved = "ticket.resolved"`, `TicketClosed = "ticket.closed"`, `WalletCredited = "wallet.credited"`, `TicketFallbackRequired = "ticket.fallback-required"`, `DqsTierChanged = "dqs.tier_changed"`. Thêm Zod payload schema vào [src/schemaValidatation/realtime.ts](../../src/schemaValidatation/realtime.ts). Thêm `NotificationKind.TicketResolved / TicketClosed` để bell notification phân loại đúng | | Mirror BE `realtime.events.ts` |
| I8 | Mở rộng `useRealtimeTicket.ts` (Owner/Manager): lắng nghe thêm `ticket.assigned/resolved/closed/fallback-required` → invalidate `tickets.full(id)` + `tickets.{owner,manager}List(...)`. Tạo `useRealtimeTicketDetail(ticketId)` riêng: subscribe + invalidate full + auto-mở `AbandonResolutionModal` khi nhận `ticket.fallback-required` của đúng ticket đang xem | [src/hooks/useRealtimeTicket.ts](../../src/hooks/useRealtimeTicket.ts) | Reuse `useTicketSubscription` để join room |
| I9 | Tạo helper `useTicketQualityFlag()` wrap `useFeatureDetail('ticket_resolve_quality_v2')` trả về `{ enabled: boolean, isLoading: boolean }` | `src/hooks/useTicketQualityFlag.ts` | Gate UI ở mọi nơi cần; default `false` khi chưa load xong để không lộ UI mới |
| I10 | i18n labels VN — file constant duy nhất `src/constants/ticketQualityLabels.ts` chứa: `CLOSE_REASON_LABEL`, `ABANDON_RESOLUTION_LABEL`, `ADDENDUM_TYPE_LABEL`, `BROADCAST_STATUS_LABEL`, `TIER_LABEL` (Admin only), `PRESCRIPTION_STATUS_LABEL`, `WITHDRAWAL_WARNING_TEMPLATE` | | Tránh hard-code label rải rác |

### 5.2 Picker / lookup component (chia sẻ giữa Admin & creator action)

> Toàn bộ field reference dùng picker (mục 3.4) — limit 90.

| # | Component | File | Mô tả |
|---|---|---|---|
| L1 | `DoctorPicker` | `src/components/ticket-quality/pickers/DoctorPicker.tsx` | `Popover + Command`, query `useAdminListUsers({role:'doctor', limit:90, search})` debounce 300ms. Hiển thị `fullName + email`, **không** hiển thị tier (kể cả Admin xem qua picker này — tránh leak ngẫu nhiên xuống đáy chuỗi phụ thuộc). |
| L2 | `MedicinePicker` | `src/components/ticket-quality/pickers/MedicinePicker.tsx` | Dùng cho FE web ở vai trò Admin (form invalidate-rating có thể không cần; nhưng cần cho Admin Ticket Detail xem read-only label). Query `useMedicineCatalog({limit:90, search, isActive:true})`. Hiển thị tên + hoạt chất + `withdrawalPeriodDays` badge. |
| L3 | `CategoryPicker` (reuse Module 2) | `src/components/ticket-quality/pickers/CategoryPicker.tsx` hoặc reuse pattern hiện có | Hiển thị danh mục ticket. |
| L4 | `DatePickerField` | Tách thành component dùng chung tại `src/components/common/DatePickerField.tsx` | Hiện đang nội bộ trong [AdminCommissionRulesPage.tsx:91](../../src/pages/AdminPage/CommissionRules/AdminCommissionRulesPage.tsx#L91) và [ManagerCropSeasonsPage.tsx:244](../../src/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage.tsx#L244) — Module 3 cần ≥ 4 chỗ (system-config date, leaderboard filter, DQS history range), nên extract một lần. |

### 5.3 Page & component mới — Owner / Manager (creator action)

> Refactor `TicketDetailPanel` chung thành component shared trong `src/components/ticket-quality/`. `OwnerTicketsPage.tsx` & `ManagerTicketsPage.tsx` chỉ wire scope khác nhau.

| # | Component / Modal | File | Mô tả (description theo nguyên tắc 3.3) |
|---|---|---|---|
| O1 | `TicketDetailPanelV2` (shared) | `src/components/ticket-quality/TicketDetailPanelV2.tsx` | Khu vực chi tiết ticket sau khi áp dụng quy trình mới. Card "Thông tin sự cố" (giữ nguyên), thêm card "Giải pháp" (4 trường read-only), card "Đơn thuốc" (items + cảnh báo ngừng thuốc), card "Ghi chú bổ sung" (addenda timeline), card "Đánh giá" (rating đã có hoặc CTA chưa rate), card "Thanh toán" (chỉ render khi `closed`). Header có `AutoCloseCountdown` + button **Đóng & Đánh giá** + button **Xử lý không có bác sĩ**. Gate bằng `useTicketQualityFlag()`. |
| O2 | `CloseAndRateModal` | `src/components/ticket-quality/CloseAndRateModal.tsx` | Form trong `Dialog`. Bước 1: review tóm tắt giải pháp + đơn thuốc (read-only). Bước 2: rating 1–5 sao + comment + tags. Submit gọi tuần tự `closeByCreator` (B5) → trên success gọi `rateByCreator` (B6) → invalidate `tickets.full(id)`. Trên ticket có `isAIResolved=true`: ẩn rating, chỉ render nút "Đóng ticket". Bắt 422 → setError theo bước 3.1. |
| O3 | `AbandonResolutionModal` | `src/components/ticket-quality/AbandonResolutionModal.tsx` | Form trong `Dialog`. Hai radio: **Chuyển sang AI xử lý** (`FALLBACK_AI`) / **Hoàn ticket về quota** (`REFUND_TICKET`) + textarea lý do. Submit `abandonResolution` (B7). Tự động mở khi `useRealtimeTicketDetail` nhận `ticket.fallback-required` của đúng ticket đang xem. |
| O4 | `SolutionViewCard` | `src/components/ticket-quality/SolutionViewCard.tsx` | Hiển thị 4 trường giải pháp + nguồn (`DOCTOR` / `AI`) + thời điểm resolve. Read-only. |
| O5 | `PrescriptionItemsCard` | `src/components/ticket-quality/PrescriptionItemsCard.tsx` | Hiển thị danh sách thuốc trong đơn. Mỗi item show: tên (medicine.name nếu có ID, fallback `customMedicineName` + badge "Tự nhập"), liều, tần suất, đường dùng, số ngày, hướng dẫn, cảnh báo. **Bắt buộc** `<Alert variant="warning">` "Thời gian ngừng thuốc trước thu hoạch: X ngày" nếu `withdrawalPeriodDays > 0`. Nếu prescription có `supersededById` → badge "Đã được sửa lại — xem bản mới". |
| O6 | `AddendumList` | `src/components/ticket-quality/AddendumList.tsx` | Timeline ghi chú bổ sung của Doctor sau khi resolve. Sắp xếp theo `createdAt`, mỗi item có icon theo `type` (Pen / Pill / AlertTriangle). |
| O7 | `RatingDisplay` | `src/components/ticket-quality/RatingDisplay.tsx` | Hiển thị stars + comment + tags. Nếu `invalidatedAt` → strikethrough + `<Alert variant="warning">` "Đánh giá này đã bị quản trị viên vô hiệu hoá. Lý do: …" |
| O8 | `AutoCloseCountdown` | `src/components/ticket-quality/AutoCloseCountdown.tsx` | Tính từ `resolvedAt + ticket.auto_close_hours` (đọc qua `useSystemConfig('ticket.auto_close_hours')`). Render `Progress` + label "Còn 16 giờ 32 phút trước khi tự đóng". Highlight đỏ khi ≤ 1/3 thời gian (theo BR-74 reminder ở 2/3 window). Tick mỗi 30s qua `setInterval` clear khi unmount. |
| O9 | `BroadcastTimeline` | `src/components/ticket-quality/BroadcastTimeline.tsx` | Liệt kê các Doctor đã được hệ thống đẩy ticket, status (PENDING/ACCEPTED/REJECTED/IGNORED), thời điểm. Phục vụ minh bạch luồng cho creator. |
| O10 | Tích hợp vào `OwnerTicketsPage.tsx` & `ManagerTicketsPage.tsx` | Sửa 2 file | Khi `useTicketQualityFlag().enabled === true` → render `TicketDetailPanelV2`. Khi false → giữ panel cũ (button "Kết thúc ticket" gọi `endIncident`). Card description đổi từ "Trao đổi với bác sĩ về sự cố" → "Khu vực hội thoại của ticket; giải pháp và đơn thuốc xuất hiện sau khi bác sĩ xử lý." (mô tả chức năng, không nói role). |
| O11 | (defer) Toast khi `wallet.credited` xuất hiện | Không bắt buộc cho Owner/Manager | BE event chủ yếu gửi cho Doctor mobile; Owner/Manager không quan tâm chi tiết. Bỏ qua trong Wave 1. |

### 5.4 Page & component mới — Admin (governance)

| # | Page | File | Endpoint | Mô tả card chính |
|---|---|---|---|---|
| A1 | **Danh mục thuốc** (list + create + edit + toggle isActive) | `src/pages/AdminPage/Medicines/AdminMedicinesPage.tsx` + `AdminMedicineForm.tsx` (Sheet) | B11 + B12 | Card "Danh mục thuốc": "Quản lý danh mục thuốc thú y/nông nghiệp dùng cho đơn thuốc bác sĩ — bao gồm liều khuyến nghị, đường dùng, thời gian ngừng thuốc và trạng thái sử dụng." |
| A2 | **Thống kê thuốc tự nhập** | `src/pages/AdminPage/Medicines/AdminMedicineFreeTextStatsPage.tsx` | B13 | Card "Thuốc tự nhập của bác sĩ": "Tổng hợp các thuốc bác sĩ tự nhập (chưa có trong danh mục) — hỗ trợ quyết định bổ sung vào danh mục chuẩn." |
| A3 | **Cấu hình hệ thống ticket** | `src/pages/AdminPage/SystemConfigs/AdminTicketSystemConfigsPage.tsx` | B18 | Card "Cấu hình quy trình ticket": "Tham số runtime của vòng đời ticket — thời gian tự đóng, ngưỡng im lặng của bác sĩ, cửa sổ ưu tiên broadcast, thời gian fallback AI, trần hoa hồng và thang điểm đánh giá." Form fields: 8 key như mục 5.5 dưới. |
| A4 | **Bảng hạng DQS** | `src/pages/AdminPage/DQS/AdminDqsLeaderboardPage.tsx` | B16 | Card "Bảng hạng chất lượng bác sĩ": "Xếp hạng bác sĩ theo điểm DQS tổng hợp — cập nhật vào cuối mỗi ngày từ 5 tiêu chí: rating, tần suất xử lý, đúng SLA, tỷ lệ accept và thời lượng online." Top strip 4 `StatCard`: số doctor mỗi tier. |
| A5 | **Chi tiết DQS bác sĩ** | `src/pages/AdminPage/DQS/AdminDoctorDqsDetailPage.tsx` | B14 + B15 | Card "Chi tiết DQS": "Phân tích điểm chất lượng và lịch sử thay đổi hạng của bác sĩ theo từng ngày." Tab "Tổng quan" (5 `KpiCard` sub-score) + Tab "Lịch sử" (table + line chart, filter date range). |
| A6 | **Replace mock `AdminDoctorPerformancePage`** | Sửa [src/pages/AdminPage/DoctorPerformance/AdminDoctorPerformancePage.tsx](../../src/pages/AdminPage/DoctorPerformance/AdminDoctorPerformancePage.tsx) | B16 (reuse) | Decision needed (mục 9). Đề xuất gộp với A4 → xoá page legacy này khi A4 sẵn sàng (sidebar đã comment route). |
| A7 | **Modal vô hiệu hoá đánh giá** | `src/components/ticket-quality/admin/InvalidateRatingModal.tsx` | B17 | Form trong `Dialog`. Field "Lý do" (textarea, ≥ 10 chars). Submit → invalidate rating. Mô tả: "Vô hiệu hoá đánh giá vi phạm quy chế hoặc bị spam — đánh giá vẫn được hiển thị nhưng có cảnh báo và không tính vào DQS." |
| A8 | **Chi tiết ticket cho Admin** | `src/pages/AdminPage/Tickets/AdminTicketDetailPage.tsx` | B8 + B17 | Drill-down từ Ticket Analytics. Tabs: "Thông tin chung" / "Giải pháp & Đơn thuốc" / "Ghi chú bổ sung" / "Đánh giá" (kèm button A7) / "Lịch sử broadcast" / "Nhật ký abandon" / "Thanh toán" (chi tiết tier snapshot — chỉ Admin). |
| A9 | **Shortcut DOCTOR_TIER trên Commission Rules** | Sửa [src/pages/AdminPage/CommissionRules/AdminCommissionRulesPage.tsx](../../src/pages/AdminPage/CommissionRules/AdminCommissionRulesPage.tsx) | Module 2 | Thêm `Tabs` filter scope cho dễ truy cập "Mặc định danh mục" / "Theo hạng bác sĩ" / "Bác sĩ cụ thể". Card description: "Mapping % hoa hồng theo phạm vi áp dụng — danh mục, hạng bác sĩ hoặc bác sĩ cụ thể." |
| A10 | (defer) Replace mock TicketAnalytics | Sửa [AdminTicketAnalyticsPage.tsx](../../src/pages/AdminPage/TicketAnalytics/AdminTicketAnalyticsPage.tsx) | Out of scope | Khi BE có aggregate endpoint, thay mock; thêm drill-down vào A8. |

> **KHÔNG build cho Admin**: force-close ticket (đã loại khỏi spec); set tier thủ công (không có endpoint).

### 5.5 Form fields cho A3 — System Configs

8 key (theo BE doc); mỗi field dùng `Field` + validate Zod, picker cho enum nếu có:

| Key | Loại | Min | Max | Đơn vị hiển thị | Validate |
|---|---|---|---|---|---|
| `ticket.auto_close_hours` | number | 1 | 168 | giờ | int |
| `ticket.doctor_silence_minutes` | number | 5 | 1440 | phút | int |
| `ticket.priority_window.platinum_sec` | number | 0 | 600 | giây | int |
| `ticket.priority_window.gold_sec` | number | 0 | 600 | giây | int, ≥ platinum_sec |
| `ticket.priority_window.fanout_sec` | number | 0 | 1800 | giây | int, ≥ gold_sec |
| `ticket.ai_fallback_minutes` | number | 1 | 60 | phút | int |
| `ticket.commission_max_percent` | number | 1 | 100 | % | float, step 0.5 |
| `ticket.rating_max_stars` | number | 3 | 10 | sao | int |

Submit: 1 mutation duy nhất gọi PATCH batch (hoặc tuần tự nếu BE buộc). Sau success → invalidate `systemConfigs.list({prefix:'ticket.'})`.

### 5.6 Public widget (Owner/Manager)

| # | Component | File | Endpoint | Mô tả |
|---|---|---|---|---|
| P1 | `DoctorPublicProfile` | `src/components/ticket-quality/DoctorPublicProfile.tsx` | B19 | Card hiển thị `avgRating` (stars), `totalResolvedTickets`, `specialization`. **KHÔNG hiển thị `tier`**. Tích hợp vào [src/pages/OwnerPage/MyDoctor/OwnerMyDoctorsPage.tsx](../../src/pages/OwnerPage/MyDoctor/OwnerMyDoctorsPage.tsx) và [src/pages/OwnerPage/MyDoctor/OwnerDoctorDetailDialog.tsx](../../src/pages/OwnerPage/MyDoctor/OwnerDoctorDetailDialog.tsx). Description: "Thông tin tóm tắt bác sĩ hỗ trợ — đánh giá trung bình, số ticket đã xử lý và chuyên môn." |

### 5.7 Routes — bổ sung trong [src/routes/routes.ts](../../src/routes/routes.ts)

| Path | Component | allowedRoles |
|---|---|---|
| `/dashboard/admin/medicines` | A1 | `admin` |
| `/dashboard/admin/medicines/freetext-stats` | A2 | `admin` |
| `/dashboard/admin/system-configs/tickets` | A3 | `admin` |
| `/dashboard/admin/dqs/leaderboard` | A4 | `admin` |
| `/dashboard/admin/doctors/:id/dqs` | A5 | `admin` |
| `/dashboard/admin/tickets/:id` | A8 | `admin` |

Owner/Manager không thêm route; chỉ sửa `OwnerTicketsPage.tsx` & `ManagerTicketsPage.tsx`.

### 5.8 Sidebar — bổ sung trong [src/components/layout/DashboardLayout/sidebarItemData.ts](../../src/components/layout/DashboardLayout/sidebarItemData.ts)

| Group | Item | URL | Icon (lucide) |
|---|---|---|---|
| Cấu hình Ticket (Admin) | Danh Mục Thuốc | `/dashboard/admin/medicines` | `Pill` |
| Cấu hình Ticket (Admin) | Cấu Hình Quy Trình Ticket | `/dashboard/admin/system-configs/tickets` | `Settings` |
| Phân tích (Admin) | Bảng Hạng Bác Sĩ (DQS) | `/dashboard/admin/dqs/leaderboard` | `Trophy` |
| Phân tích (Admin) | Thống Kê Thuốc Tự Nhập | `/dashboard/admin/medicines/freetext-stats` | `BarChart3` |

A5 (DQS detail) + A8 (admin ticket detail) là drill-down từ A4 / TicketAnalytics — không cần sidebar item riêng.

### 5.9 Realtime listener responsibilities

| Event | Khi xảy ra | FE web hành động |
|---|---|---|
| `ticket.assigned` | Doctor accept | Owner/Manager: invalidate `tickets.{owner,manager}List` + `tickets.full(id)` + toast "Bác sĩ {fullName} đã nhận ticket" |
| `ticket.resolved` | Doctor submit B2 | Invalidate `tickets.full(id)` + toast cho creator "Đã giải quyết — vui lòng xem giải pháp và đóng ticket" + bắt đầu render `AutoCloseCountdown` |
| `ticket.closed` | B5 hoặc B22 | Invalidate `tickets.full(id)` + `tickets.{owner,manager}List` + toast cho creator "Ticket đã được đóng" |
| `ticket.fallback-required` | B23 (Doctor im lặng) | `useRealtimeTicketDetail` đang xem đúng ticket → auto-mở `AbandonResolutionModal` |
| `wallet.credited` | B24 hook ticket.closed | Owner/Manager bỏ qua. Admin (nếu đang ở A8) hiển thị toast "Đã thanh toán {amount} cho bác sĩ {name}" |
| `dqs.tier_changed` | B21 nightly cron | Admin DQS Leaderboard auto-refresh (invalidate `dqs.leaderboard()`) |

---

## 6. Edge case từng action

### 6.1 Owner/Manager — Close ticket (B5)

| Edge case | Hành xử |
|---|---|
| Click Close khi state ≠ `resolved` | Button đã disabled (gate bằng state); thêm toast "Ticket chưa được giải quyết" làm fallback nếu race |
| Click Close 2 lần liên tiếp | `useMutation` `isPending` disable button; BE có idempotency qua `closedAt IS NULL` |
| Close trong khi WS `ticket.closed` về (auto-close vừa fire) | Mutation 409 → toast "Ticket đã được hệ thống tự đóng" + invalidate full |
| User không phải creator | Button không render (check `userId === ticket.createdBy`) |
| Ticket AI (`isAIResolved=true`) | Modal CloseAndRate → ẩn step rating, chỉ confirm Close. BE từ chối rating cho AI ticket (BR-79). |
| Đang offline (mất mạng) | Mutation reject → toast "Mất kết nối, vui lòng thử lại" |

### 6.2 Owner/Manager — Rate (B6)

| Edge case | Hành xử |
|---|---|
| Đã rate rồi (UNIQUE 409) | Toast "Đánh giá đã được ghi nhận trước đó" + refresh detail |
| Stars chưa chọn | Zod min(1).max(maxStarsFromSystemConfig) |
| Rate ticket AI | Button không render; nếu race → 422 → set field error |
| Rating bị Admin vô hiệu hoá sau đó | `RatingDisplay` show strikethrough + alert lý do |

### 6.3 Owner/Manager — Abandon resolution (B7)

| Edge case | Hành xử |
|---|---|
| Modal mở vì WS `ticket.fallback-required` nhưng creator đã rời page | Modal queue trong global notification — defer (không bắt buộc Wave 1) |
| Submit FALLBACK_AI nhưng ticket vừa bị Doctor resolve (race) | BE 409 → toast "Bác sĩ vừa hoàn tất xử lý" + đóng modal + invalidate |
| Submit REFUND_TICKET nhưng quota đã hết hạn | BE 422 → set field error |
| Reason rỗng | Zod optional theo spec; không enforce min |
| User không phải creator | Modal không render |

### 6.4 Admin — CRUD Medicine (B11/B12)

| Edge case | Hành xử |
|---|---|
| Toggle `isActive=false` cho thuốc đang được dùng trong prescription `ISSUED` | BE chỉ ẩn khỏi catalog (Doctor không kê mới được). Prescription cũ vẫn snapshot hiển thị tên + warning. FE A1 confirm: "Vô hiệu thuốc này — đơn thuốc đã kê vẫn được giữ nguyên, bác sĩ không thể chọn cho đơn mới." |
| Update thông tin (đặc biệt `withdrawalPeriodDays`) | Spec không yêu cầu snapshot ở `Prescription` cho field này — confirm với BE. Nếu không snapshot, FE hiển thị value hiện tại; nếu có, hiển thị value lúc kê. **Decision needed mục 9.11**. |
| Tạo trùng tên | BE 422 → setError field `name` |
| Xoá thuốc | Spec không có endpoint DELETE — chỉ toggle. Không build button delete. |
| Form: trường hoạt chất, đường dùng (route), liều khuyến nghị, withdrawalPeriodDays, isActive | Tất cả validate Zod theo BE schema |

### 6.5 Admin — Update System Config (B18)

| Edge case | Hành xử |
|---|---|
| Đổi `auto_close_hours` từ 24 → 12 trong khi ticket đang trong window cũ | BE quyết định: cũ giữ window cũ (snapshot ở `auto_close_at`?). FE chỉ confirm "Thay đổi áp dụng cho ticket close mới từ thời điểm này" — Decision needed mục 9.12. |
| `gold_sec < platinum_sec` | Zod cross-field refine → setError field `gold_sec` |
| Submit lỗi 1 trong 8 key | Nếu BE batch atomic → rollback toàn bộ; nếu sequential → toast warn "Đã cập nhật N/8 cấu hình thành công" |
| User chưa load xong config nhưng submit | Nút submit disable đến khi `isLoading=false` |

### 6.6 Admin — Invalidate Rating (B17)

| Edge case | Hành xử |
|---|---|
| Rating đã invalidated trước | BE 409 → toast "Đánh giá đã được vô hiệu hoá trước đó" |
| Reason quá ngắn | Zod min(10) |
| Sau invalidate, `dqs` của Doctor có giảm không? | Tuỳ BE: nếu DQS calculator skip rating đã invalidated → DQS tăng lại sau cron đêm. FE chỉ refresh `dqs.doctorDetail(id)`. |

### 6.7 Admin — DQS Leaderboard (B16)

| Edge case | Hành xử |
|---|---|
| Date filter chọn ngày chưa có snapshot (cron chưa chạy) | API trả empty → `EmptyState` "Chưa có dữ liệu DQS cho ngày này" |
| Doctor mới (chưa có 30 ngày data) | BE trả `null` cho sub-score; FE render "—" thay vì 0 |
| Click vào doctor → drill A5 | `navigate('/dashboard/admin/doctors/:id/dqs')` |

### 6.8 WebSocket / realtime

| Edge case | Hành xử |
|---|---|
| Mất kết nối socket khi đang xem detail | `useTicketSubscription` re-subscribe khi `connected` flip true; query refetch theo `staleTime` |
| Nhận event của ticket khác | Filter theo `ticketId` trong payload trước khi invalidate |
| Toast spam khi nhiều event liên tiếp | Reuse `REALTIME_INVALIDATE_DEBOUNCE_MS = 500` đã có; toast cũng debounce theo `NOTIFICATION_THROTTLE_MS = 5000` |

### 6.9 Date / time handling

- Form state lưu `yyyy-MM-dd` (mục 5.1 [docs/form-error-and-date-handling.md](../../../docs/form-error-and-date-handling.md)).
- Service convert sang ISO bằng `toISO(v)` trước khi gửi.
- Hiển thị: dùng `format(parseBackendDate(v), "dd/MM/yyyy HH:mm", { locale: vi })`.
- Countdown auto-close: dùng `differenceInSeconds` từ `date-fns` so với `new Date()`; tick mỗi 30s.

### 6.10 Feature flag off

- Mọi UI mới phải gate bằng `useTicketQualityFlag().enabled`.
- Khi flag off → giữ luồng cũ (`OwnerTicketsPage` và `ManagerTicketsPage` render panel cũ; `DoctorTicketsPage` legacy).
- Sidebar items mới (5.8) **luôn render** (Admin governance độc lập với flag); chỉ block các action gọi B5/B6/B7 và `TicketDetailPanelV2` ở Owner/Manager.

---

## 7. Định nghĩa "Done"

1. **Hạ tầng (I1–I10)** xong — endpoints, schemas, services, hooks, realtime types, feature-flag helper, label constants.
2. **Owner/Manager Detail v2**: sau khi ticket `resolved`: render giải pháp 4 trường + đơn thuốc cấu trúc + cảnh báo withdrawal + button **Đóng & Đánh giá** + button **Xử lý không có bác sĩ** + countdown auto-close. Sau `closed`: read-only forever, có panel "Thanh toán" (Admin chi tiết, Owner/Manager chỉ trạng thái).
3. **WS** `ticket.assigned/resolved/closed/fallback-required` chạy đúng — toast + invalidate + auto-mở Abandon modal khi cần.
4. **Admin governance**: 5 page (Medicines CRUD + Free-text Stats + System Configs Tickets + DQS Leaderboard + Doctor DQS Detail) + button Invalidate Rating trong Admin Ticket Detail (A8).
5. **Public widget DoctorPublicProfile** không lộ tier.
6. **Feature flag** `ticket_resolve_quality_v2` — off → quay về luồng cũ; on → flow Module 3.
7. **Form/error/date** — mọi form qua checklist mục 3.1 (`useClearServerFieldErrors`, 422 mapping, `Field error`, `Controller + DatePickerField`, `toISO`).
8. **Style** — không gradient; theo semantic token; pattern `animate-in fade-in duration-300`; panel slide-in qua `show` state.
9. **UX** — không bắt user nhập tay ID; mọi picker query limit 90; pagination cho list.
10. **KHÔNG** build: Doctor web (mobile thay), force-close, tier leak ra non-Admin, prescription form trên web (Doctor mobile).

---

## 8. Sequencing

1. **Wave 1 — Infra + Picker (I1–I10 + L1–L4)** song song với BE B1–B10. Có thể mock response để dev FE độc lập.
2. **Wave 2 — Admin governance phụ thuộc ít state ticket (A1, A2, A3)** ngay khi BE B11/B12/B13/B18 sẵn sàng.
3. **Wave 3 — Owner/Manager creator action (O1–O8, O10) + A8 Admin Ticket Detail** khi BE B5/B6/B7/B8 sẵn sàng — đây là core value Module 3.
4. **Wave 4 — Admin DQS (A4, A5, replace A6)** sau khi B14/B15/B16 + cron B21 chạy ≥ 1 đêm.
5. **Wave 5 — Polish**: P1 DoctorPublicProfile, A7 invalidate rating, A9 commission shortcut, O9 BroadcastTimeline, realtime polish, auto-modal khi `fallback-required`.
6. **Wave 6 (defer)**: A10 replace mock analytics, O11 wallet toast.

---

## 9. Câu hỏi/decision cần chốt với BE/PM

1. **`GET /tickets/:id/full` (B8) shape** — confirm cấu trúc lồng (solution, prescription{items[]}, addenda[], rating, broadcasts[], abandonLogs[]). FE schema phụ thuộc 100%.
2. **Admin Ticket Detail (A8)** — có endpoint `GET /admin/tickets/:id/full` riêng không, hay reuse B8 với role check?
3. **DQS leaderboard (B16) shape** — date single hay range? Có tier filter? Trả 5 sub-scores hay chỉ tier + totalScore?
4. **DoctorPerformance (A6)** — gộp với A4 hay giữ riêng? Sidebar đã comment route legacy → đề xuất gộp.
5. **`feature.ticket_resolve_quality_v2`** — confirm key chính xác và endpoint đọc (đã có `useFeatureDetail`).
6. **System config 8 key** (mục 5.5) — confirm key path chính xác.
7. **Withdrawal period source** — BE có lồng `Medicine.withdrawalPeriodDays` trong response prescription không, hay phải fetch riêng?
8. **Realtime payload** — chia sẻ TS type / OpenAPI để FE mirror Zod chính xác.
9. **Auto-close reminder UX** — BE gửi WS riêng ở 2/3 window, hay FE tự tính từ `resolvedAt + auto_close_hours`? FE đề xuất tự tính.
10. **DoctorPublicProfile fields** (B19) — confirm chính xác `{avgRating, totalResolvedTickets, specialization}`. Rule không hiển thị tier áp dụng cho mọi widget?
11. **Snapshot withdrawalPeriodDays trên prescription** — khi Admin update Medicine sau khi đơn đã kê, FE hiển thị value nào? Đề xuất BE snapshot field này khi tạo `PrescriptionItem`.
12. **System config thay đổi áp dụng cho ticket nào** — đang trong window dùng config cũ (snapshot lúc resolve) hay lập tức dùng mới? FE đề xuất snapshot.
13. **Rating editable window** — BR Changes mục 6 nói Owner đổi rating trong cửa sổ rồi khoá. Spec chính (BR-79) nói rating immutable + Admin invalidate. **Mâu thuẫn cần chốt**. FE đề xuất theo BR-79 (immutable).
14. **Pagination shape DQS history** — page+limit hay cursor? FE đề xuất page+limit với `limit ≤ 90`.

---

## 10. Rủi ro & lưu ý

- **`endIncident` ≠ `close`**: FE hiện gọi `endIncident` ở Owner/Manager với UX "Kết thúc ticket". BE doc khẳng định endpoint này chỉ end-of-chat. Khi flag v2 bật, **PHẢI** chuyển button đó sang gọi B5. Khi flag off, giữ behavior cũ.
- **Schema breaking**: Mở rộng `TicketIncidentResSchema` thêm trường mới phải đặt `optional()` hết để không vỡ luồng cũ trong giai đoạn flag off.
- **Prescription shape vỡ**: Hiện FE chỉ có `medicineName + dosage`. Khi BE B3 đổi sang `items[]`, **PHẢI** BE giữ cả 2 fields trong giai đoạn migrate, hoặc FE map version. Cần chốt với BE.
- **Tier leak**: Tuyệt đối không render `tier` ở UI Owner/Manager — kể cả accidentally qua DoctorPublicProfile. Code review checklist: grep `'tier'` trong code Owner/Manager phải = 0.
- **Force-close trap**: A8 Admin Ticket Detail **KHÔNG** có button force-close. Spec đã loại.
- **Doctor web legacy**: Không refactor `DoctorTicketsPage.tsx`; có thể hiển thị banner "Vui lòng dùng app mobile FarmOS Doctor" sau khi mobile sẵn sàng + xoá route khỏi `routes.ts`.
- **Feature flag rollback**: Mọi UI mới gate bằng `useTicketQualityFlag()`. Khi `isLoading=true`, default `enabled=false` để không lộ UI mới trong khi đang fetch flag.
- **i18n labels** — tránh hard-code label rải rác; tập trung tại `src/constants/ticketQualityLabels.ts` (I10).
- **Picker leak limit** — tất cả picker `limit:90`. Nếu thực tế > 90, phải chuyển sang search-as-you-type với server-side filter (BE phải hỗ trợ `?search=`).

---

## 11. QC review pass

> Đóng vai senior QC review pass — soát các lỗi/bất nhất tiềm ẩn của plan và sửa đúng.

| # | Vấn đề phát hiện | Sửa trong plan |
|---|---|---|
| QC1 | Endpoint paths trong v1 dùng `/admin/medicines` etc. trong khi route FE web phải là `/dashboard/admin/...` (theo DEVELOPMENT.md mục Role → Base Path Mapping) | Sửa ở mục 5.7 — toàn bộ path `/dashboard/admin/...` |
| QC2 | v1 không liệt kê việc cập nhật sidebar | Bổ sung mục 5.8 |
| QC3 | v1 không nhắc `useFeatureDetail` (đã có) — chỉ ghi `useFeature` | Sửa ở mục 2.5 và 5.1 I9 — dùng `useFeatureDetail('ticket_resolve_quality_v2')` |
| QC4 | v1 đề cập "feature flag default" mà không nói rõ behaviour khi `isLoading` | Sửa ở mục 10 — default `enabled=false` khi loading |
| QC5 | v1 không nói rõ `isCreator` check | Sửa ở mục 2.4 — render badge "Bạn không phải là người tạo ticket này"; mục 6.1 — disable nút |
| QC6 | v1 đề cập build CategoryPicker mới nhưng đã có pattern Module 2 | Sửa ở mục 5.2 L3 — reuse pattern hiện có |
| QC7 | v1 không nói cap pagination | Sửa ở mục 3.4 và 5.6 — limit 90 cho picker, default 20 cho list |
| QC8 | v1 không nhắc i18n labels tập trung — dễ rải rác | Bổ sung I10 + mục 10 |
| QC9 | v1 không liệt kê các Card description chuẩn (yêu cầu mới) | Sửa ở mục 3.3 và mọi card description trong 5.4 |
| QC10 | v1 nhắc "BR Changes 6 — rating editable trong window" nhưng spec chính BR-79 immutable | Bổ sung 9.13 (decision needed) |
| QC11 | v1 không nói edge case thay đổi system-config ảnh hưởng ticket đang chạy | Bổ sung 9.12 + 6.5 |
| QC12 | v1 không nói edge snapshot withdrawalPeriodDays khi Medicine bị sửa | Bổ sung 9.11 + 6.4 |
| QC13 | v1 không liệt kê inventory shadcn/common components | Bổ sung mục 4 toàn bộ |
| QC14 | v1 dùng "force-close trap" nhưng không nhắc grep guard tier | Bổ sung mục 10 — code review checklist grep `'tier'` |
| QC15 | v1 không nhắc `DatePickerField` đang nội bộ trong các page; cần extract | Bổ sung L4 |
| QC16 | v1 không liệt kê 8 system-config fields chi tiết với min/max | Bổ sung mục 5.5 với bảng đầy đủ |
| QC17 | v1 đề xuất build A6 mới nhưng sidebar đã comment route legacy | Sửa ở mục 5.4 A6 + 9.4 — đề xuất gộp với A4, xoá legacy |
| QC18 | v1 thiếu pattern Animation slide-in cho Sheet/Dialog | Sửa ở mục 3.2 — tham chiếu DEVELOPMENT.md Animation Patterns |
| QC19 | v1 không nhắc invalidate cache pattern | Sửa ở mục 3.1 và 5.1 I6 — bắt buộc invalidate `tickets.full(id)` |
| QC20 | v1 nhắc "feature.ticket_resolve_quality_v2" với prefix "feature." trong khi `useFeatureDetail` chỉ nhận `featureCode` | Sửa ở mục 5.1 I9 và 9.5 — code = `ticket_resolve_quality_v2` (không prefix); confirm với BE |

---

## 12. UI/UX review pass

> Đóng vai senior UI/UX designer. Áp 2 nguyên tắc cứng: **không bắt user nhập tay nếu API có** + **picker pagination ≤ 90**.

### 12.1 Picker / lookup — bắt buộc gọi API thay vì input thuần

| Form / Field | Trước (sai) | Sau (đúng) |
|---|---|---|
| A7 Invalidate Rating — chọn ticket | (không cần — modal mở từ A8 đã biết ticketId) | Đã đúng |
| Doctor picker (commission rule scope DOCTOR, DQS lookup, A5 nav) | Có nguy cơ ép user nhập UUID | Dùng L1 `DoctorPicker` query `useAdminListUsers({role:'doctor', limit:90, search})` |
| Medicine reference (A8 detail prescription items) | — | Read-only badge tên thuốc, không có input |
| Category reference (A8 detail header) | — | Read-only badge từ snapshot |
| A5 Doctor DQS Detail — chuyển sang doctor khác | Nếu cho nhập ID URL bằng tay → tệ | Trang có sidebar selector L1 ở header |
| A3 System Configs — không có FK | — | Form thuần number; không picker |
| A4 DQS Leaderboard — date filter | DatePickerField (không type tay) | L4 `DatePickerField` |
| Tags rating (O2 CloseAndRateModal) | Nếu cho nhập free text → kém | Predefined tag list từ API hoặc constant `RATING_TAG_OPTIONS` (e.g. "Phản hồi nhanh", "Giải thích rõ ràng", "Đơn thuốc chi tiết"); user chỉ tick |

### 12.2 Pagination cap

- List page (Medicines, DQS leaderboard, Free-text stats): default 20, user có thể chọn 20/50/90.
- Lookup picker (Doctor, Medicine, Category): luôn `limit=90` + `search` debounce 300ms.
- Auto-close countdown ko liên quan pagination.

### 12.3 Empty / loading / error state

- Empty: dùng `EmptyState` với icon đúng nghĩa (`Pill` cho medicine, `Trophy` cho DQS, `Inbox` mặc định).
- Loading list: `TableSkeleton` 5–10 rows.
- Loading detail: `LoadingCard`.
- Error: render `<Alert variant="destructive">` với button Thử lại → `query.refetch()`.

### 12.4 Confirm destructive

- Toggle Medicine `isActive=false`: `ConfirmDialog` "Vô hiệu thuốc {name}? Bác sĩ sẽ không thể chọn cho đơn mới. Đơn cũ vẫn được giữ nguyên."
- Invalidate Rating: `ConfirmDialog` confirm trước khi mở modal lý do.
- Close ticket: `ConfirmDialog` 2 bước không cần — đã có Dialog rate đứng giữa.

### 12.5 Visual hierarchy & semantic colour (no gradient)

- Tier (chỉ Admin): badge solid theo tier với pastel solid `bg-amber-500/10 text-amber-700` (BRONZE), `bg-zinc-300/40 text-zinc-700` (SILVER), `bg-yellow-500/15 text-yellow-700` (GOLD), `bg-cyan-500/15 text-cyan-700` (PLATINUM). **Không gradient**.
- Status closed: `bg-muted text-foreground` (đóng do creator), `bg-emerald-500/10 text-emerald-700` (đóng tự động bình thường), `bg-amber-500/10 text-amber-700` (AI fallback), `bg-red-500/10 text-red-700` (refund/abandon).
- Withdrawal warning: `<Alert variant="warning">` với icon `AlertTriangle` — màu solid amber, không gradient.
- Auto-close countdown: `Progress` solid `bg-primary`, đổi sang `bg-destructive` khi ≤ 1/3.
- Star rating: dùng `Star` icon lucide với fill `text-yellow-500`, empty `text-muted-foreground` — không gradient.

### 12.6 Layout patterns

- Page Admin: `<div className="space-y-6 animate-in fade-in duration-300">` + 1 `<Card>` chính cho list + `Sheet` cho edit form (pattern TicketCategoriesPage).
- Page detail (A5, A8): tab navigation (`Tabs` shadcn) — header card thông tin chung + `TabsContent` cho từng nhóm.
- Modal (CloseAndRateModal, AbandonResolutionModal, InvalidateRatingModal): `Dialog` với `DialogHeader` / `DialogContent` / `DialogFooter`. Step indicator nếu nhiều bước (CloseAndRateModal).

### 12.7 Accessibility

- Mọi `Input` có `id` + `Label htmlFor`.
- Mọi icon-only button có `title` (tooltip) — đã có pattern trong TicketCategoriesPage.
- Star rating: keyboard navigable (arrow keys); aria-label "X sao".
- Countdown: `aria-live="polite"`.

### 12.8 Localization

- Toàn bộ copy tiếng Việt. Reuse `vi` locale `date-fns`. Format VND: `Intl.NumberFormat("vi-VN", {style:"currency", currency:"VND"})` (đã có pattern `formatVnd` trong TicketCategoriesPage).

### 12.9 Card description quy chuẩn (mẫu)

| Card | Description (mô tả chức năng) |
|---|---|
| Owner/Manager — Detail Ticket Header | "Theo dõi tiến trình xử lý sự cố và xem lại giải pháp, đơn thuốc cùng đánh giá sau khi ticket được đóng." |
| Card Hội thoại | "Khu vực trao đổi giữa các bên trong suốt quá trình xử lý ticket." |
| Card Giải pháp | "Bốn trường giải pháp do bác sĩ ghi sau khi xử lý ticket — vấn đề gốc, nguyên nhân, cách điều trị và phòng tránh." |
| Card Đơn thuốc | "Đơn thuốc kê cho ticket cùng cảnh báo thời gian ngừng thuốc trước khi thu hoạch." |
| Card Ghi chú bổ sung | "Các ghi chú thêm sau khi giải pháp đã chốt — không sửa được nội dung gốc." |
| Card Đánh giá | "Đánh giá của người tạo ticket sau khi đóng — bao gồm số sao và nhận xét." |
| Card Thanh toán | "Thông tin thanh toán hoa hồng cho bác sĩ tại thời điểm đóng ticket." |
| Card Lịch sử broadcast | "Danh sách bác sĩ được hệ thống đẩy ticket cùng phản hồi của từng người." |
| Admin Medicines | "Danh mục thuốc dùng cho đơn thuốc — bao gồm liều khuyến nghị, đường dùng, thời gian ngừng thuốc và trạng thái sử dụng." |
| Admin Free-text Stats | "Tổng hợp các thuốc bác sĩ tự nhập (chưa có trong danh mục) hỗ trợ quyết định bổ sung." |
| Admin System Configs | "Tham số runtime của vòng đời ticket — thời gian tự đóng, ngưỡng im lặng, cửa sổ ưu tiên broadcast và trần hoa hồng." |
| Admin DQS Leaderboard | "Xếp hạng bác sĩ theo điểm DQS tổng hợp từ năm tiêu chí, cập nhật cuối mỗi ngày." |
| Admin Doctor DQS Detail | "Phân tích điểm chất lượng và lịch sử thay đổi hạng theo từng ngày." |
| Admin Ticket Detail | "Toàn bộ payload của ticket cùng các thao tác quản trị có sẵn." |
| Admin Invalidate Rating Modal | "Vô hiệu hoá đánh giá vi phạm quy chế hoặc bị spam — đánh giá vẫn hiển thị nhưng không tính vào DQS." |
| Public DoctorPublicProfile | "Thông tin tóm tắt bác sĩ hỗ trợ — đánh giá trung bình, số ticket đã xử lý và chuyên môn." |

---

> **Tài liệu này là bản v2 (đã upgrade từ v1).** Khi BE chốt 14 decision ở mục 9, FE bắt đầu Wave 1 hạ tầng.
