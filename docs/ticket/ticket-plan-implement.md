# Ticket-v2 Implement Plan (Frontend Web Only)

> Scope baseline: `docs/ticket/ticket-analyse.md`  
> Rule references: `docs/form-error-and-date-handling.md`, `farmos_fe/DEVELOPMENT.md`  
> Business context: Module 2 in `FarmOS_Business_Rules_Changes.md` and `farm_os_be/docs/analysis/module-2-ticket-commission.md`  
> Roles in scope: **admin, owner, manager** only  
> Analysis refresh: 2026-05-02 (validated against current FE code and backend controller/service contracts)

## 1. Goal & Scope

Migrate web frontend ticket flow from legacy `ticket/incident` to Module 2 `ticket-v2` for admin/owner/manager, including category config, commission config, ticket creation/list/detail/cancel, owner ticket balance, and admin reports/clawback integration.

### In scope

- Frontend web pages/routes/sidebar/API hooks/services/schemas.
- Existing pages/components currently mock or legacy-bound:
  - `AdminTicketAnalyticsPage`
  - `AdminPackagesPage`
  - `OwnerTicketsPage`
  - `ManagerTicketsPage`
  - Owner dashboard/wallet surfaces for ticket balance.
- Controlled coexistence with legacy doctor/farmer ticket surfaces.

### Out of scope

- Backend changes.
- Mobile changes.
- Doctor/Farmer dashboard migrations.

---

## 2. Non-Negotiable Implementation Rules

## Rule A - Form error handling (422)

Every new/updated form must:

1. Use `useClearServerFieldErrors(form)` after `useForm`.
2. Handle 422 with `handleApiErrorUnprocessentity(errors, form.setError, { getValues: form.getValues })`.
3. Pass `error` prop to **every** field component (including controlled fields).
4. Use `mutateAsync` + `try/catch` for mutation forms; do not wipe mapped 422 errors by unconditional reset in `finally`.

## Rule B - Date handling

- Form state: `yyyy-MM-dd`.
- API payload conversion in service layer using `toISO` / `toISOOrNull` from `src/lib/format.ts`.
- API response parsing with `parseBackendDate`.
- UI render date via shared `formatDateVi` / `formatDateTimeVi`.
- Report filters (`from`, `to`) and commission effective dates must convert to full ISO datetime before API calls.

## Rule C - Frontend architecture (`DEVELOPMENT.md`)

- New endpoints in `src/constants/endpoints.ts` (+ `QUERY_KEYS`).
- API calls in `src/services/*`.
- React Query hooks in `src/queries/*`.
- Zod schemas in `src/schemaValidatation/*`.
- Reused UI across 2+ pages extracted to `src/components/common/`.
- Do not edit `src/components/ui/*` manually.
- Enforce cache invalidation after create/update/delete mutations.

## Rule D - Migration safety (legacy + v2 parallel period)

- Keep current `ticketService.ts` and `useTicket.ts` for legacy doctor/farmer flow in this ticket.
- Do **not** reuse legacy ticket query-key namespace for v2. Introduce dedicated v2 key groups to avoid cache collisions.
- Route/role behavior for admin/owner/manager must remain stable while migrating internals.

---

## 3. Deep Missing-Part Analysis (Current Plan vs Real Codebase)

### A. Infra and contract gaps not explicit enough

- Current FE constants only define legacy ticket endpoints under `API_ENDPOINTS.TICKET`; no v2 endpoint groups yet.
- Current `QUERY_KEYS.tickets` is legacy-oriented and shared across owner/manager/doctor incident hooks. Reusing it for v2 would cause unintended invalidation and mixed caches.
- Current `src/services/index.ts` and `src/queries/index.ts` barely export modules (auth only), so new ticket-v2 modules need explicit integration strategy.

### B. Admin surface gaps beyond existing plan

- `AdminPackagesPage` is currently local-state mock **and unreachable** (no route in `routes.ts`, no admin sidebar item).
- `AdminTicketAnalyticsPage` is entirely `_mocks`-driven and lacks contract for report request/response mapping (`from/to`, `doctorId`, grouping rows).
- Clawback flow is planned but missing non-422 handling details (`409 Error.DoctorWalletInsufficient`, `404 Error.PayoutLedgerNotFound`).

### C. Owner/Manager migration gaps not explicit enough

- `OwnerTicketsPage` and `ManagerTicketsPage` already contain integrated create/list/detail/message/prescription UX; migration should update hook/service contracts in place, not only add high-level "new flow" statements.
- Ticket-v2 create requires `milestoneId` + `categoryConfigId` together; previous plan under-specified milestone dependency.
- Owner-only balance endpoint (`GET me/ticket-balance`) must not be called in manager context.

### D. Business-rule contract details missing from old plan

- Commission rule scopes in this module are only: `CATEGORY_DEFAULT`, `DOCTOR_TIER`, `DOCTOR`.
- Scope-dependent required fields and effective range validation need frontend-level pre-validation.
- Category toggle-off may return 422 with dynamic hint message about blocking resources; UI needs dedicated global error surface.
- Category update may return 409 when changing `featureCode` / `creditType` after tickets exist.

### E. Cross-cutting missing items

- Realtime hooks are incident-key invalidation oriented (`QUERY_KEYS.tickets.all`), not yet v2-safe.
- Plan did not define a mutation invalidation matrix (which queries to invalidate per create/update/cancel/toggle/clawback).
- Plan did not require strict removal of `_mocks` imports for touched pages.

### F. Query invalidation edge cases (new deep analysis)

- Current realtime handlers invalidate root `['tickets']`-like namespaces broadly. If ticket-v2 also lives under `tickets` root, legacy and v2 caches will be refetched together and can cause noisy network + stale overwrite races.
- Current invalidation patterns mix key-builder usage and raw array literals. This is manageable now but high risk during migration when two systems coexist.
- Detail/list/message/prescription queries share overlapping prefixes. Prefix invalidation is useful, but if not scoped by new root keys it can refresh unrelated tabs and reset pagination/filters unexpectedly.
- Reconnect flow currently invalidates several top-level groups after socket reconnect. Without v2-specific groups, reconnect can trigger duplicate refetch storms when combined with page-level realtime hooks.
- Query object keys must be normalized (drop `undefined`, `''`, `null` consistently) before building query keys. Non-normalized objects can create semantically duplicate caches that are not invalidated together.

### G. Backend contract mismatches discovered (critical corrections)

- `TicketCategory` update contract does **not** allow editing `code`, `legacyCategory`, `legacyTicketType`, or `currency`; these are create-time only in current backend DTO.
- `ServicePackage` database has `categoryConfigId`, but current credit module DTO/service/repo responses do not expose this field; frontend cannot depend on direct `categoryConfigId` in package APIs yet.
- `service-packages` list path currently returns active packages only (`isActive=true`) even for admin path, so "full admin catalog including archived" is not available without backend adjustment.
- Ticket-v2 purchased refund path in backend currently credits `createdBy` on cancel, while deduction on create is from farm owner balance; for manager/farmer-created tickets this can produce owner-balance inconsistency.
- Ticket report APIs are non-paginated and can return large payloads when `from`/`to` are omitted.
- Commission rule backend currently allows overlapping effective ranges; resolver picks best match by priority and `effectiveFrom desc`.

### H. UX/UI audit hiện trạng (web frontend)

**H1. Layout & hierarchy issues**

- Một page đang gánh 3 chế độ lớn (list, create, detail) bằng state toggle, làm mất ngữ cảnh khi chuyển qua lại và khó quay về đúng vị trí trước đó.
- Header giữa các màn có pattern gần giống nhau nhưng chưa thống nhất thứ bậc thông tin: có màn ưu tiên KPI, có màn ưu tiên bảng, có màn ưu tiên form.
- Với flow Ticket Plan, điểm vào mua gói còn rời rạc (ví owner cần đi qua ví/credits), chưa có tuyến “khám phá -> mua -> sử dụng” liền mạch.

**H2. Component & consistency issues**

- Dùng card/table tốt nhưng chưa có bộ component miền nghiệp vụ ticket-plan thống nhất (plan card, source badge, balance breakdown, purchase status).
- Trạng thái gói (active/archive/draft) và trạng thái ticket đang dùng nhiều cách biểu đạt, thiếu bộ mapping màu/nhãn chuẩn theo SaaS dashboard.
- Một số form vẫn render lỗi theo kiểu thủ công từng field; chưa có pattern form shell nhất quán cho các trang admin lớn.

**H3. Usability & user-flow issues**

- Người dùng chưa được “gợi ý mua” đúng thời điểm (ví dụ khi số dư category thấp ngay trong form tạo ticket).
- Chưa có preview rõ ràng “ticket này sẽ trừ từ nguồn nào” trước khi submit.
- Khi mua gói, chưa có nhịp UX chuẩn gồm: so sánh gói -> xác nhận -> trạng thái thanh toán -> quay về tác vụ chính.

**H4. Interaction state issues**

- Đã có loading/empty/error ở nhiều nơi nhưng chưa thành checklist bắt buộc theo từng màn hình ticket-plan.
- Thiếu success state có ý nghĩa nghiệp vụ (ví dụ: “Mua gói thành công, cộng X vé cho category Y”).
- Chưa mô tả behavior khi dữ liệu lớn (report không phân trang), dễ gây chậm và cảm giác treo UI.

**H5. Accessibility issues**

- Chưa có chuẩn bắt buộc về focus order, keyboard operation cho bảng/filter/dialog ở các màn mới.
- Chưa có yêu cầu rõ về minimum target size, trạng thái disabled, và cảnh báo chỉ dựa màu.

---

## 4. UI/UX Design Solution for Ticket Plan (SaaS, tiếng Việt, không gradient)

## UX1 - Information Architecture (IA)

**Admin**

- Cấu hình Ticket
  - Danh mục ticket
  - Quy tắc hoa hồng
  - Gói ticket
- Vận hành Ticket
  - Danh sách ticket (drill-down)
  - Clawback
- Báo cáo Ticket
  - Doanh thu ticket
  - Hoa hồng bác sĩ

**Owner**

- Ticket Plan
  - Tổng quan số dư ticket theo danh mục
  - Mua gói ticket
  - Lịch sử mua và trạng thái thanh toán
- Ticket sử dụng
  - Tạo ticket
  - Danh sách ticket
  - Chi tiết ticket

**Manager**

- Ticket sử dụng
  - Tạo ticket theo zone
  - Danh sách ticket theo zone
  - Chi tiết ticket

## UX2 - User flow chuẩn (discovery -> purchase -> usage)

**Flow Owner**

1. Khám phá nhu cầu
   - Vào dashboard hoặc màn tạo ticket thấy `TicketBalanceWidget` + cảnh báo “Sắp hết vé”.
2. Khám phá gói
   - Nhấn CTA `Mua gói ticket` vào màn Ticket Plan.
   - So sánh gói theo danh mục, số vé, đơn giá/vé, phù hợp nhu cầu.
3. Mua gói
   - Chọn gói -> xác nhận qua modal `Xác nhận mua gói` -> chuyển thanh toán.
4. Xác nhận trạng thái
   - Quay về màn trạng thái thanh toán (pending/success/failed), có CTA `Quay lại tạo ticket`.
5. Sử dụng
   - Tạo ticket: chọn danh mục, thấy preview nguồn trừ + số dư còn lại sau khi gửi.
6. Theo dõi
   - Trong chi tiết ticket hiển thị nguồn đã trừ và thông tin snapshot liên quan.

**Flow Admin**

1. Thiết lập danh mục ticket.
2. Thiết lập quy tắc hoa hồng.
3. Cấu hình gói ticket theo chiến lược bán.
4. Theo dõi báo cáo + xử lý clawback khi cần.

## UX3 - Page structure và layout blueprint

**Trang Owner Ticket Plan**

- Khối A: Header ngắn gọn + 1 CTA chính (`Mua gói ticket`).
- Khối B: Thanh tổng quan 3 số (Tổng vé còn lại, Danh mục sắp hết, Vé đã dùng 30 ngày).
- Khối C: `TicketBalanceWidget` theo danh mục (table/card responsive).
- Khối D: Danh sách gói ticket (card trên mobile, table trên desktop).
- Khối E: Lịch sử giao dịch mua gói và trạng thái.

**Trang Tạo Ticket (Owner/Manager)**

- Cột trái: form tạo ticket (milestone, category, severity, title, description).
- Cột phải (sticky desktop): `Nguồn sử dụng` + `Số dư còn lại` + lưu ý nghiệp vụ.
- Thanh action cố định cuối form: `Gửi ticket`, `Hủy`.

**Trang Admin Gói Ticket**

- Khối filter cố định: search, trạng thái, loại credit/category.
- Bảng danh sách gói (desktop) + hàng card (mobile).
- Drawer/Form panel cho tạo/sửa để không mất ngữ cảnh danh sách.

**Trang Admin Báo cáo Ticket**

- Bắt buộc date-range mặc định (30 ngày).
- KPI row + biểu đồ + bảng chi tiết.
- Có trạng thái `Dữ liệu quá lớn` với hướng dẫn thu hẹp bộ lọc.

## UX4 - Key UI components bắt buộc

- `TicketBalanceWidget`
  - Hiển thị: danh mục, từ gói subscription, từ mua lẻ, tổng còn lại.
  - Có trạng thái mức thấp (nhãn `Sắp hết`).
- `TicketPlanCard`
  - Hiển thị: tên gói, danh mục áp dụng (hoặc credit type), số vé, giá, giá/vé, badge gợi ý.
- `SourceUsagePreview`
  - Hiển thị trước submit: sẽ trừ từ nguồn nào, còn lại bao nhiêu.
- `PlanPurchaseConfirmModal`
  - Nội dung xác nhận, số tiền, số vé, category/credit type, CTA rõ ràng.
- `CommissionRuleTable`
  - Cảnh báo overlap rule bằng badge/warning row.
- `StateBlocks`
  - Empty/loading/error/success đồng nhất cho mọi màn ticket-plan.

## UX5 - Interaction behaviors và states

**Loading**

- Dùng skeleton theo đúng mật độ nội dung (KPI skeleton, table skeleton, form skeleton).

**Empty**

- Empty có CTA rõ ràng theo ngữ cảnh:
  - Không có gói: `Liên hệ quản trị`.
  - Không có ticket: `Tạo ticket đầu tiên`.

**Error**

- Error có thông điệp tiếng Việt, nút `Thử lại`, và không mất dữ liệu form đã nhập.

**Success**

- Sau mua gói thành công: banner inline + toast, CTA `Tạo ticket ngay`.
- Sau tạo ticket thành công: điều hướng sang chi tiết ticket mới tạo.

**Disabled & guard states**

- Nút submit disabled khi dữ liệu chưa hợp lệ hoặc đang pending.
- Với category bị khóa/tắt: hiển thị reason rõ ràng, không chỉ disable im lặng.

## UX6 - Visual, accessibility, scalability rules

**Visual (SaaS, tối giản)**

- Chỉ dùng màu nền solid, không dùng gradient.
- Dùng hệ màu semantic nhất quán: success/warning/error/info.
- Mật độ thông tin ưu tiên khả năng scan nhanh: tiêu đề ngắn, số liệu chính nổi bật.

**Accessibility**

- Tương phản đạt mức đọc tốt, không truyền đạt trạng thái chỉ bằng màu.
- Hỗ trợ keyboard đầy đủ cho filter, table action, modal confirm.
- Focus ring rõ ràng, thứ tự tab logic, hit area tối thiểu 40x40.

**Scalability**

- Component miền nghiệp vụ phải độc lập, tái dùng được cho web/mobile-web sau này.
- Tách rõ data container và presentation component để mở rộng module (coupon, bundle theo mùa, ưu đãi doanh nghiệp).

---

## 5. Revised Implementation Workstreams

## WS0 - Contract lock and migration guardrails (must start first)

**Deliverables**

- Freeze FE contract from backend modules:
  - `ticket-category` (B1-B5)
  - `commission-rule` (B6-B9)
  - `ticket-v2` (B10-B14)
  - `admin-ticket-ops` (B16, B18, B19)
- Define v2 namespace strategy in constants/query keys to avoid legacy collision.
- Define error-code handling map for non-422 cases used by ticket-v2 admin flows.

## WS1 - Ticket-v2 API foundation (shared infra)

**Deliverables**

- Add ticket-v2 endpoint groups to `API_ENDPOINTS`:
  - `admin/ticket-categories` (+ toggle)
  - `ticket-categories/active`
  - `admin/commission-rules`
  - `tickets`, `tickets/:id`, `tickets/:id/cancel`
  - `me/ticket-balance`
  - `admin/reports/ticket-revenue`, `admin/reports/doctor-commission`
  - `admin/tickets/:id/clawback`
- Add dedicated `QUERY_KEYS` groups (separate from legacy `tickets`), for example:
  - `ticketV2.*`
  - `ticketCategories.*`
  - `commissionRules.*`
  - `adminTicketReports.*`
- Define key taxonomy explicitly (required, not optional):
  - `ticketV2.root = ['ticket-v2']`
  - `ticketCategories.root = ['ticket-categories-v2']`
  - `commissionRules.root = ['commission-rules-v2']`
  - `ticketBalance.root = ['ticket-balance-v2']`
  - `adminTicketReports.root = ['admin-ticket-reports-v2']`
- Keep legacy keys unchanged under existing `QUERY_KEYS.tickets.*`.
- For migration period: never invalidate v2 by `['tickets']` and never invalidate legacy by `['ticket-v2']`.
- Add schemas:
  - `ticketCategory.ts`
  - `commissionRule.ts`
  - `ticketV2.ts`
  - `ticketReports.ts`
- Add services:
  - `ticketCategoryService.ts`
  - `commissionRuleService.ts`
  - `ticketV2Service.ts`
  - `ticketAdminOpsService.ts`
- Add hooks:
  - `useTicketCategory.ts`
  - `useCommissionRule.ts`
  - `useTicketV2.ts`
  - `useAdminTicketReports.ts`
- Update barrel exports where needed so modules are discoverable and consistent.

**Contract notes to encode in schemas/services**

- `POST tickets` body requires: `milestoneId`, `categoryConfigId`, `title`, `description`, `severity`, `attachments?`.
- `GET tickets` filters: `farmId?`, `zoneId?`, `status?`, `categoryConfigId?`, `page`, `limit`.
- `GET me/ticket-balance` is owner-only.
- Report query uses datetime fields (`from`, `to`) and optional `doctorId`.

**Key-stability notes (critical for invalidation correctness)**

- Add shared query-normalizer for key params (remove `undefined`, `null`, empty string, apply defaults for `page`, `limit`).
- Use only key-builder functions in hooks/mutations/realtime handlers; avoid raw array literals except in the key-builder file.
- Standardize list keys to include a single normalized filter object as the last element.

## WS2 - Admin ticket categories and commission rules surfaces

## 2.1 `AdminPage/TicketCategories/AdminTicketCategoriesPage.tsx` (new)

- List/filter/create/update/toggle category config.
- Include fields per backend contract:
  - Create-only fields:
  - `code`, `name`, `description`
  - `legacyCategory`, `legacyTicketType`
  - Editable fields:
  - `unitPrice`, `defaultCommissionPercent`
  - `eligibleForSubscriptionGrant`, `eligibleForPurchase`
  - `featureCode`, `creditType`
- Mark `code`, `legacyCategory`, `legacyTicketType`, `currency` as non-editable after create (or omit in edit form).
- Toggle failure handling:
  - 422 resource-blocking hint rendered clearly (field + global message)
  - 409 conflict handling where applicable.

## 2.2 `AdminPage/CommissionRules/AdminCommissionRulesPage.tsx` (new)

- List/filter/create/update/soft-delete commission rules.
- Enforce scope-specific required fields:
  - `CATEGORY_DEFAULT` -> require `categoryId`
  - `DOCTOR_TIER` -> require `doctorTier`
  - `DOCTOR` -> require `doctorId`
- Effective range inputs follow Rule B and validate `effectiveTo > effectiveFrom`.
- Doctor picker uses existing admin users endpoint (`role=doctor`).

## WS3 - Admin packages modernization and reachability fix

## 3.1 Route/sidebar reachability (critical missing piece)

- Add route for admin packages page in `src/routes/routes.ts`.
- Add corresponding admin sidebar item in `sidebarItemData.ts`.

## 3.2 Replace local mock state in `AdminPackagesPage`

- Remove in-memory package CRUD logic; wire real `service-packages` APIs.
- Handle active/archive lifecycle using real backend operations.
- Because current package list API returns active-only, implement admin UX with two states:
  - active list from API,
  - archived state visibility via local mutation feedback + explicit refetch after archive/unarchive actions.
- Integrate ticket-category linkage strategy:
  - Preferred: direct `categoryConfigId` when backend exposes it.
  - Current compatibility mode: map package `creditType` to ticket category `creditType` and document this as temporary BE-contract gap.

## WS4 - Owner and Manager ticket-v2 migration in-place

## 4.1 Owner flow (`OwnerTicketsPage`)

- Replace legacy ticket create/list/detail/cancel hooks with ticket-v2 hooks.
- Keep existing page-level UX structure, but update data contract fields.
- In create form:
  - Keep milestone dependency.
  - Add active category selection.
  - Show source/balance context (subscription vs purchased) before submit.
- Cancel uses `POST tickets/:id/cancel` with optional reason.

## 4.2 Manager flow (`ManagerTicketsPage`)

- Migrate list/detail/create/cancel to ticket-v2 hooks.
- Preserve zone-context filtering UX.
- Do not query owner-only balance endpoint in manager screens.

## 4.3 Shared extraction

- Extract duplicated owner/manager ticket-v2 widgets into `src/components/common/`:
  - status/source badges
  - category selector block
  - shared table/filter components

## WS5 - Owner ticket balance visibility

**Deliverables**

- New reusable `TicketBalanceWidget` (owner-only) showing per-category:
  - `fromSubscription`, `fromPurchased`, `total`.
- Mount points:
  - `OwnerWalletPage`
  - `OwnerDashboardSection`
  - owner ticket create area (preview before submit).
- Display `categoryName` + `creditType` + `unitPrice` for quick purchase/use context.

## WS6 - Admin analytics and clawback integration

## 6.1 Replace analytics mocks

- `AdminTicketAnalyticsPage` must use:
  - `GET admin/reports/ticket-revenue`
  - `GET admin/reports/doctor-commission`
- Remove dependency on local `_mocks` data for production path.
- Date filters follow Rule B conversion.
- Enforce default bounded date window in FE (e.g., last 30 days) before first query to avoid unbounded non-paginated report pulls.

## 6.2 Clawback action surface

- Add clawback action in admin ticket detail/report drill-down.
- Confirm dialog requires reason input (optional by API, but present in UX).
- Handle error cases:
  - 409 insufficient doctor wallet balance
  - 404 payout ledger not found
  - 422/form mapping when returned.

## WS7 - Routing, sidebar, realtime, and cache invalidation alignment

**Deliverables**

- Add admin routes in `src/routes/routes.ts`:
  - `/dashboard/admin/ticket-categories`
  - `/dashboard/admin/commission-rules`
  - `/dashboard/admin/packages` (missing currently)
  - admin ticket detail route if needed for clawback flow.
- Update `sidebarItemData.ts` admin menu entries for new pages.
- Realtime alignment:
  - ensure ticket created/ended events invalidate v2 query keys (not only legacy keys).
  - keep legacy hooks intact for doctor/farmer unaffected flows.
- Define mutation invalidation matrix and apply consistently.
- Replace broad root invalidation calls in realtime layer with transition-safe invalidation:
  - Phase 1 (coexistence): invalidate both legacy and v2 roots, but scoped to list/detail groups only.
  - Phase 2 (post-cutover): remove legacy invalidation for owner/manager ticket screens.
- Add dedupe strategy for double invalidation sources (mutation success + websocket event + reconnect):
  - debounce per event type,
  - skip duplicate invalidation within short TTL window,
  - avoid invalidating the same key in both page hook and global realtime hook when one is sufficient.

## WS8 - Invalidation matrix and edge-case test scenarios

**Deliverables**

- Publish and implement mutation-to-key invalidation matrix (below).
- Add manual verification script (QA checklist) for cache consistency under multi-tab, reconnect, and fast user actions.
- Validate no legacy/v2 cross-pollution in query cache.

**Mutation -> Required invalidations**

1. Create ticket v2 (`POST tickets`)

- Invalidate: `ticketV2.list(*)`, `ticketV2.detail(newId)`.
- Invalidate owner balance views: `ticketBalance.byOwnerContext(*)` (no optimistic adjustments).
- Edge case: manager create affects owner-visible lists; ensure both manager-zone and owner-farm list caches refresh.

2. Cancel ticket v2 (`POST tickets/:id/cancel`)

- Invalidate: `ticketV2.detail(id)`, `ticketV2.list(*)`.
- Invalidate: `ticketBalance.byOwnerContext(*)` (server-truth refresh only; do not apply local balance math).
- Edge case: reject stale cancel from second tab (status already changed) and keep UI consistent by forced detail refetch.
- Edge case: manager/farmer-created ticket cancel may not restore owner purchased balance due current backend behavior; FE must display server state without optimistic assumptions.

3. Category create/update/toggle

- Invalidate: `ticketCategories.adminList(*)`, `ticketCategories.activeList(*)`.
- Invalidate: `ticketBalance.byOwnerContext(*)` (category metadata like unitPrice/name/eligibility impacts display and create preview).
- Edge case: toggle off returns 422 with dynamic blocking hint; do not clear form-level server errors prematurely.

4. Commission rule create/update/delete

- Invalidate: `commissionRules.list(*)`, `commissionRules.detail(id)`.
- Optionally invalidate admin doctor commission report currently on-screen.
- Edge case: effective date edit that changes filter membership must refresh both old-filter and new-filter lists.
- Edge case: overlapping rules are currently allowed by backend; FE list should surface overlap signals (warning badge) instead of assuming strict version chain.

5. Admin clawback

- Invalidate: `adminTicketReports.doctorCommission(*)`, affected `ticketV2.detail(id)` and any admin ticket drill-down list.
- Edge case: 409 insufficient wallet should not trigger optimistic cache updates.

6. Service package admin mutate (create/update/archive/unarchive)

- Invalidate: `servicePackages.list(*)`, `servicePackages.detail(id)`.
- If package/category linkage shown in ticket admin forms, refresh linked category select options in form context.

**Realtime/reconnect invalidation rules**

- Ticket lifecycle events (`ticket.incident.created`, `ticket.incident.ended`) during coexistence must refresh:
  - legacy owner/manager lists currently using `QUERY_KEYS.tickets.*`, and
  - v2 owner/manager lists under new `ticketV2.*` keys.
- Message events invalidate only ticket message keys, not full ticket lists.
- Reconnect should perform staged invalidation (tickets first, then reports) to avoid request storms.
- Multi-tab edge case: if one tab mutates and another reconnects, both must converge without manual reload.

---

## 6. Suggested Delivery Sequence

1. WS0 contract lock and guardrails.
2. WS1 shared infra (endpoints, schemas, services, hooks, query keys).
3. WS2 admin ticket categories + commission rules.
4. WS3 admin packages wiring + route/sidebar reachability fix.
5. WS4 owner/manager migration in existing ticket pages.
6. WS5 owner ticket balance widget on wallet/dashboard/create area.
7. WS6 analytics reports + clawback UX.
8. WS7 routing/sidebar/realtime/cache alignment.
9. WS8 invalidation matrix verification and edge-case regression pass.
10. UX solution rollout: áp dụng UX1-UX6 vào tất cả màn ticket-plan trước UAT.

---

## 7. Acceptance Criteria (Web)

- Admin can manage ticket categories and commission rules via real APIs (no local mock state).
- Admin packages page is reachable by route/sidebar and uses real APIs.
- Admin ticket analytics consumes report APIs and has no runtime dependency on `_mocks`.
- Owner/manager ticket pages no longer call legacy `ticket/incident` create/list/detail/cancel endpoints.
- Owner can view ticket balance by category in wallet/dashboard/create flow.
- Scope validations and date conversions are enforced on commission and report forms.
- All touched forms comply with Rule A (422 mapping) and Rule B (date handling).
- Mutations invalidate correct v2 query keys without breaking legacy doctor/farmer ticket caches.
- Invalidation matrix is implemented exactly as documented (mutation + realtime + reconnect paths).
- No new regression in existing owner/manager realtime ticket refresh behavior.
- Lint and type-check pass in `farmos_fe`.
- No optimistic ticket-balance math is used for create/cancel flows; owner balance always follows server-truth refetch.
- Luồng người dùng Owner hoàn chỉnh theo 3 pha: khám phá -> mua -> sử dụng, không có ngõ cụt.
- Tất cả text hiển thị UI cho tính năng Ticket Plan là tiếng Việt.
- Thiết kế mới không dùng gradient, chỉ dùng solid color.
- Các trạng thái empty/loading/error/success xuất hiện đầy đủ ở các màn chính.
- Trải nghiệm bàn phím và focus state đạt mức sử dụng được cho form/filter/modal chính.

---

## 8. Risk & Dependency Notes

- Backend seed/backfill tasks are backend-owned and out of this plan.
- If report payload differs from expectation, adjust FE schema/hook mapping only.
- `service-packages` to `categoryConfigId` linkage may vary by backend readiness; FE must support compatibility path using `creditType` mapping when direct field is unavailable.
- Legacy doctor/farmer surfaces remain intentionally excluded and must not be broken.
- Event naming currently remains `ticket.incident.*`; FE should treat these as ticket lifecycle events for both legacy and v2 during migration.
- Dual-flow coexistence window can cause over-invalidation unless WS8 dedupe/staged invalidation is implemented.
- Current backend cancel refund for purchased-source ticket may credit `createdBy` instead of owner context; treat as known backend dependency and avoid FE-side balance inference.
- Commission rule overlap prevention is not enforced server-side; FE should warn and help admins avoid overlapping effective windows.
- Nếu giữ kiến trúc 1 page nhiều chế độ bằng local state (list/create/detail), UX có nguy cơ khó mở rộng và khó deep-link; ưu tiên route-driven state cho màn trọng yếu.

---

## 9. Done Checklist (Implementation Governance)

- Endpoint constants + query keys added with separate v2 namespace.
- New schemas/services/hooks created for ticket-v2 ecosystem.
- Admin pages built/wired: categories, commission rules, analytics, packages.
- Owner/manager ticket pages migrated and verified for create/list/detail/cancel.
- Ticket balance widget mounted in all required owner surfaces.
- Routes/sidebar updated and manually smoke-tested for admin/owner/manager.
- Mutation invalidation matrix verified (create/update/toggle/cancel/clawback).
- Realtime + reconnect invalidation behavior verified for legacy and v2 keys in parallel.
- `_mocks` imports removed from production ticket analytics execution path.
- Form error/date rules audited on all touched forms.
- IA/flow/layout/component/state theo UX1-UX6 được tài liệu hóa và áp dụng nhất quán.
- QA UI xác nhận: tiếng Việt đầy đủ, không gradient, accessible states đạt yêu cầu.
