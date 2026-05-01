# Admin Subscription Plan — FE↔BE & UX/UI Audit

> **Scope**: Cây route `/dashboard/admin/subscription-plans` và **chỉ những route con** lồng bên trong:
> - `/dashboard/admin/subscription-plans` — list + create/edit/archive plan
> - `/dashboard/admin/subscription-plans/:planId` — detail + version history
> - `/dashboard/admin/subscription-plans/:planId/versions/new` — create new version
>
> **Out of scope (sẽ audit ở document khác)**: Subscription Lifecycle (`/subscriptions`), Invoices (`/invoices`), Force Upgrade, Cancel, Owner-side, IoT Kit, Ticket commission, các tab admin khác.
>
> **Audit lens**:
> 1. **FE↔BE conformance** — schema, hook, service đúng spec không
> 2. **UX/UI senior review** — information design, micro-interactions, loading/empty/error states, microcopy
> 3. **Standards compliance** — bám rules trong [DEVELOPMENT.md](../../DEVELOPMENT.md) + [form-error-and-date-handling.md](../../../docs/form-error-and-date-handling.md)
>
> **Audit date**: 2026-04-30
>
> **Reference docs**
> - [farmos_fe/DEVELOPMENT.md](../../DEVELOPMENT.md) — FE conventions, layout, animation, query, error handling
> - [docs/form-error-and-date-handling.md](../../../docs/form-error-and-date-handling.md) — form 422 mapping rules
> - [farm_os_be/docs/FarmOS_Business_Rules_Changes.md](../../../farm_os_be/docs/FarmOS_Business_Rules_Changes.md) — BR Changes
> - [farm_os_be/docs/analysis/_module-rule.md](../../../farm_os_be/docs/analysis/_module-rule.md) — locked deviations

---

## TL;DR

| Aspect | Status | Headline |
|---|---|---|
| FE↔BE wiring | ✅ Solid | Hook/service/schema map đúng; cache invalidate đầy đủ |
| Form 422 mapping | ✅ Conforms | `useClearServerFieldErrors` + `handleApiErrorUnprocessentity` đã wire đúng cả 2 form |
| **UX — workflow continuity** | ❌ Major gap | Tạo plan xong → auto-nav S2 nhưng plan chưa có version → admin phải bấm thêm 1 nút nữa; tạo version thì form trắng, phải gõ lại 10-20 feature |
| **UX — version transparency** | ❌ Major gap | Bảng version chỉ hiện `features.length` — admin không thể audit nội dung version cũ |
| **Visual design — icon ngữ nghĩa** | ⚠️ Confusing | "Lưu trữ gói" dùng icon `Trash2` đỏ (= xoá) gây hiểu lầm; "Tạo phiên bản" có 2 entry trùng |
| **Information density** | ⚠️ Sparse | Detail page bỏ trống 60% màn hình; bảng plans thiếu cột "Số phiên bản" / "Thời điểm tạo gần nhất" |
| **Empty / loading / error states** | ⚠️ Minimal | Empty state chỉ là text; không có illustration / CTA / retry |
| **Accessibility** | ⚠️ Partial | aria-invalid + aria-label dropdown OK; thiếu `aria-required`, thiếu tooltip cho disabled fields |
| **Form input UX** | ⚠️ Multiple issues | Currency input không format thousands; thiếu character counter; thiếu help text |
| **Standards (DEVELOPMENT.md / form rules)** | ⚠️ 1 vi phạm Tailwind | `max-w-2/6` ở [List:319](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L319) là class Tailwind không hợp lệ |

**Net**: Code đúng nghiệp vụ và đúng pattern dữ liệu — Schema/Query/Service đều bám DEVELOPMENT.md. Nhưng **UX nhiều ma sát**: admin phải gõ lại từ đầu khi tạo version mới, không xem được cấu hình version cũ, icon archive trông giống delete, và một số polish đáng kể về empty/loading/error/microcopy chưa có.

---

## 1. Route Inventory & Component Graph

### 1.1 Route definitions

| # | Route path | Allowed roles | Component | Mount |
|---|---|---|---|---|
| **S1** | `/dashboard/admin/subscription-plans` | `Admin` | `AdminSubscriptionPlansPage` | [routes.ts:97‑101](../../src/routes/routes.ts#L97-L101) |
| **S2** | `/dashboard/admin/subscription-plans/:planId` | `Admin` | `AdminSubscriptionPlanDetailPage` | [routes.ts:102‑106](../../src/routes/routes.ts#L102-L106) |
| **S3** | `/dashboard/admin/subscription-plans/:planId/versions/new` | `Admin` | `AdminSubscriptionPlanVersionCreatePage` | [routes.ts:107‑111](../../src/routes/routes.ts#L107-L111) |

### 1.2 Component graph

```
S1 /dashboard/admin/subscription-plans
└─ AdminSubscriptionPlansPage.tsx (8-line wrapper)
   └─ AdminSubscriptionPlansListPage.tsx     ← entire list/CRUD UI lives here

S2 /dashboard/admin/subscription-plans/:planId
└─ AdminSubscriptionPlanDetailPage.tsx       ← detail + versions table

S3 /dashboard/admin/subscription-plans/:planId/versions/new
└─ AdminSubscriptionPlanVersionCreatePage.tsx ← version + feature builder
```

**Note**: [AdminSubscriptionPlansPage.tsx](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansPage.tsx) là wrapper rỗng — render `<AdminSubscriptionPlansListPage />` duy nhất. Có thể inline vào routes.ts hoặc giữ làm placeholder cho tương lai (e.g. wrap với `<Tabs>`).

### 1.3 Sidebar entry

[sidebarItemData.ts:42‑49](../../src/components/layout/DashboardLayout/sidebarItemData.ts#L42-L49):

```ts
{ title: "Gói Đăng Ký", url: "/dashboard/admin/subscription-plans", icon: Package }
```

→ Chỉ S1 có entry. S2/S3 truy cập qua context (row action / detail CTA) — pattern context-driven nav, OK.

### 1.4 BE endpoints used

Mapped trong [subscriptionPlanService.ts](../../src/services/subscriptionPlanService.ts) + [endpoints.ts:22‑27](../../src/constants/endpoints.ts#L22-L27):

| Service method | HTTP + path | Used by |
|---|---|---|
| `listPlans(query)` | `GET /plans` | S1 |
| `getPlanDetail(id)` | `GET /plans/:id` | S2, S3 (header) |
| `createPlan(body)` | `POST /plans` | S1 dialog create |
| `updatePlan(id, body)` | `PATCH /plans/:id` | S1 dialog edit |
| `archivePlan(id)` | `PATCH /plans/:id/archive` | S1 row action |
| `listPlanVersions(id, query)` | `GET /plans/:id/versions` | S2, S3 (qua `useResolveActivePlanVersion`) |
| `createPlanVersion(id, body)` | `POST /plans/:id/versions` | S3 |
| `useListFeatures(query)` | `GET /features` | S3 (feature catalog) |

→ **Không có** endpoint unarchive — verify BE.

---

## 2. S1 — `/dashboard/admin/subscription-plans` (list + create/edit/archive)

### 2.1 What works ✅

| Behavior | Verified |
|---|---|
| List paginated với `useListSubscriptionPlans` | [:152](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L152) |
| Search debounced 400ms | [:142](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L142) |
| Filter status `ALL / ACTIVE / ARCHIVED` | [:90‑95, 309‑332](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L90-L95) |
| Edit dialog **lock `code`** khi mode=edit | [:528](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L528) |
| Archive với ConfirmDialog destructive | [:651‑660](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L651-L660) |
| Auto-navigate sang detail S2 sau create thành công | [:202](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L202) |
| Currency VND formatter | [:110‑115](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L110-L115) |
| Server validation 422 → form fields | [:223‑232](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L223-L232) |
| `useClearServerFieldErrors` đã wire | [:169](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L169) |
| Animation `animate-in fade-in slide-in-from-bottom-2 duration-300` | [:258](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L258) — đúng pattern DEVELOPMENT.md |

### 2.2 ⚠️ Gap nghiệp vụ: thiếu Unarchive action

[:440‑450](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L440-L450) chỉ có "Lưu trữ gói" item, disable khi `status === ARCHIVED`. **Không có item Unarchive** → plan archived "kẹt" mãi từ phía UI.

**Fix**: thêm hook `useAdminUnarchiveSubscriptionPlan`, render conditional second action khi `status === ARCHIVED`. Verify BE có endpoint `PATCH /plans/:id/unarchive` chưa.

### 2.3 ⚠️ Gap UX: action "Tạo phiên bản mới" trùng vị trí

[:428‑439](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L428-L439) có item "Tạo phiên bản mới" nhảy thẳng sang S3, trong khi [AdminSubscriptionPlanDetailPage.tsx:90‑101](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L90-L101) cũng có CTA tương tự.

**Tác hại UX**: 2 entry point cho cùng 1 action. Quan trọng hơn — admin từ S1 chưa thấy version hiện tại, click "Tạo phiên bản mới" mà không biết cấu hình hiện tại có gì → dễ tạo nhầm/regress (xem §4.4).

**Recommend**: bỏ item ở row dropdown S1, ép admin vào S2 (xem version list) trước khi tạo. Action "Chi tiết gói" ở [:412‑421](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L412-L421) là đủ.

### 2.4 ❌ UX issue: icon "Lưu trữ" dùng `Trash2` (đỏ)

[:448](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L448) — DropdownMenuItem `className="text-destructive"` + icon `<Trash2 />` cho action **archive** (soft delete).

**Vấn đề**: 
- `Trash2` là icon universally hiểu là **xoá vĩnh viễn**. Admin sẽ nghĩ "bấm cái này là xoá luôn gói" → tránh bấm dù chỉ muốn lưu trữ tạm thời.
- Class `text-destructive` (đỏ) củng cố hiểu lầm này.
- Lucide có icon `Archive` rất phù hợp.

**Fix**: 
```tsx
<DropdownMenuItem
  onClick={() => { setActivePlan(plan); setIsArchiveConfirmOpen(true); }}
  disabled={plan.status === "ARCHIVED"}
>
  <Archive className="mr-2 h-4 w-4" />  {/* not Trash2 */}
  Lưu trữ gói
</DropdownMenuItem>
```

Bỏ `text-destructive` — vì archive là reversible action, không destructive.

### 2.5 ❌ Tailwind class không hợp lệ

[:319](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L319):

```tsx
<SelectTrigger className="w-full max-w-2/6">
```

`max-w-2/6` không phải Tailwind class chuẩn. Tailwind có `max-w-1/3`, `max-w-2/3`… (fraction phải là phân số tối giản) hoặc `max-w-fit`/`max-w-md`. Class này có thể bị Tailwind ignore.

**Fix**: dùng `max-w-1/3` (= 2/6 simplified) hoặc `max-w-xs` (size token).

### 2.6 ❌ Empty state nghèo nàn

[:368‑377](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L368-L377):

```tsx
{!listPlansQuery.isLoading && plans.length === 0 && (
  <TableRow>
    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
      Không có dữ liệu gói đăng ký.
    </TableCell>
  </TableRow>
)}
```

**Vấn đề**: chỉ có text. Khi system mới khởi tạo (chưa có plan nào), admin sẽ thấy 1 dòng text giữa table trống → không có CTA "Tạo gói đầu tiên" rõ ràng (button chính ở góc phải card filter cách xa).

**Fix**: dùng [`<EmptyState />`](../../src/components/common/EmptyState.tsx) (đã có ở project, dùng trong [AdminSubscriptionsWorkspace.tsx:174‑193](../../src/pages/AdminPage/Subscriptions/components/AdminSubscriptionsWorkspace.tsx#L174-L193)) với icon `Package` + CTA inline:

```tsx
<EmptyState
  icon={Package}
  title="Chưa có gói đăng ký nào"
  description="Tạo gói đăng ký đầu tiên để khách hàng có thể đăng ký dịch vụ."
  action={{ label: "Tạo gói đăng ký", onClick: openCreatePlanDialog }}
/>
```

Phân biệt 2 case:
- Empty do **chưa có data**: gợi ý tạo mới
- Empty do **filter quá hẹp**: gợi ý xoá filter

### 2.7 ⚠️ Loading state thô

[:357‑366](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L357-L366) chỉ là 1 dòng "Đang tải dữ liệu gói đăng ký...". DEVELOPMENT.md đã có `<TableSkeleton />` ([components/common/TableSkeleton.tsx](../../src/components/common/TableSkeleton.tsx)) — page lifecycle [AdminSubscriptionsWorkspace.tsx:163‑164](../../src/pages/AdminPage/Subscriptions/components/AdminSubscriptionsWorkspace.tsx#L163-L164) đã dùng. Inconsistent.

**Fix**: thay block loading row bằng `<TableSkeleton rows={5} columns={6} />`.

### 2.8 ⚠️ Pagination không hiển thị tổng số / không có size selector

[:459‑491](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L459-L491):

```tsx
<p>Trang {plansMeta?.page ?? 1}/{plansMeta?.totalPages ?? 1}</p>
```

→ Thiếu "Tổng X gói". Thiếu Select để user chọn 5/10/20/50 items per page (BE cho phép `limit` flexible). 

DEVELOPMENT.md cheatsheet còn gợi ý dùng [`<ProPagination />`](../../src/components/common/pro-pagination.tsx) — page này dùng button thô. Inconsistent với rest of admin.

### 2.9 ⚠️ Header chiếm 30% chiều cao mà info nghèo

[:259‑284](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L259-L284) — section "Quản lý gói đăng ký" có badge + title + description + 1 thống kê right-side (totalItems / activePlansCount).

**UX issue**: chiếm nhiều space nhưng chỉ truyền tải 2 con số. Có thể nén lại:
- Bỏ section to, đưa stats vào KpiStrip pattern (đã có [SubscriptionsKpiStrip.tsx](../../src/pages/AdminPage/Subscriptions/components/SubscriptionsKpiStrip.tsx) làm reference)
- Hoặc thêm thông tin có giá trị: tổng doanh thu plan này quý gần nhất, số subscription đang active của mỗi plan, plan bán chạy nhất

### 2.10 ⚠️ Search không có nút clear (X)

[:303‑307](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L303-L307) — Input search không có clear button. User typed "abc" muốn xoá phải kéo chuột chọn rồi xoá tay.

**Fix**: dùng InputGroup pattern hoặc thêm clear button khi `searchKeyword.length > 0`.

### 2.11 ⚠️ Microcopy: "Hủy" trong dialog plan có thể nhầm với "Hủy đăng ký"

[:629‑635](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L629-L635) — nút "Hủy" đóng dialog. Trong context subscription, "Hủy đăng ký" là action nguy hiểm (chuyển status CANCELLED). User có thể hesitate.

**Fix**: dùng "Đóng" hoặc "Bỏ qua" — clearer intent.

### 2.12 ⚠️ Microcopy: mix Vietnamese + English

[:653‑654](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L653-L654):

```tsx
description="Sau khi lưu trữ, gói sẽ chuyển sang trạng thái ARCHIVED và không còn dùng cho luồng kích hoạt mới."
```

`ARCHIVED` là enum value English giữa câu Việt → kém professional. Nên dùng "Đã lưu trữ" hoặc bỏ enum hoàn toàn ("Sau khi lưu trữ, gói sẽ không còn dùng cho luồng kích hoạt mới").

### 2.13 ⚠️ Required field markers thiếu

[:520‑525](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L520-L525) — `<FieldLabel>Mã gói</FieldLabel>` không có asterisk hay "(bắt buộc)". User không biết field nào required cho tới khi submit fail.

**Fix**: thêm asterisk + `aria-required`:

```tsx
<FieldLabel htmlFor="plan-code">
  Mã gói <span className="text-destructive">*</span>
</FieldLabel>
<Input ... aria-required="true" />
```

### 2.14 ⚠️ Currency input không format thousands

[:602‑625](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L602-L625) — `listPrice` là plain `<Input type="number">`. User gõ `19900000` không thấy `19,900,000`. Phải đếm số 0 → dễ sai 1 bậc (1.99M vs 19.9M vs 199M).

**Fix**: implement masked input. Hoặc inline preview như [AdminPackagesPage.tsx:415‑418](../../src/pages/AdminPage/Packages/AdminPackagesPage.tsx#L415-L418) đã làm:

```tsx
<p className="text-xs text-muted-foreground">
  Hiển thị: {formatCurrency(field.value || 0)}
</p>
```

### 2.15 ⚠️ Disabled `code` field không có tooltip giải thích

[:528](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L528) — `disabled={planDialogMode === "edit"}`. UI chỉ thấy field mờ → user không biết tại sao không sửa được.

**Fix**: wrap với Tooltip:

```tsx
<Tooltip>
  <TooltipTrigger asChild>
    <Input ... disabled />
  </TooltipTrigger>
  <TooltipContent>Mã gói không thể chỉnh sửa sau khi tạo.</TooltipContent>
</Tooltip>
```

### 2.16 ⚠️ Description textarea thiếu character counter

`description` max 1000 ký tự ([subscriptionPlan.ts:52](../../src/schemaValidatation/subscriptionPlan.ts#L52)). Form không hiển thị `0/1000`. User nhập đủ 1000 → submit fail mới biết.

### 2.17 ⚠️ Help text thiếu hoàn toàn

Form chỉ có label + input. Field "Mã gói" placeholder "STARTER_12M" — chuẩn naming không được giải thích. Field "Thời hạn (tháng)" — bao nhiêu là min/max hợp lý? Field "Giá niêm yết" — VND/USD? đã include VAT?

**Fix**: thêm `<FieldDescription>` slot (Field component đã hỗ trợ) cho từng field critical.

### 2.18 ✅ Conforms business rules

- **BR-110** (Admin quản lý catalog) + **BR-112** (param Admin-configurable): plan CRUD đúng spec.
- **VND only**: đúng [_module-rule.md L24](../../../farm_os_be/docs/analysis/_module-rule.md#L24).
- **Soft delete (archive) thay hard delete**: đúng pattern audit-trail.

---

## 3. S2 — `/dashboard/admin/subscription-plans/:planId` (detail + versions)

### 3.1 What works ✅

| Behavior | Verified |
|---|---|
| Fetch plan detail | [:65](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L65) |
| List versions paginated | [:68‑72](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L68-L72) |
| Hide CTA "Tạo phiên bản mới" khi `status === ARCHIVED` | [:89‑101](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L89-L101) |
| Back button quay về S1 | [:81‑87](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L81-L87) |
| Version table hiển thị `versionNo`, `effectiveFrom`, `isActive`, `features.length`, `changelog` | [:195‑245](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L195-L245) |
| Animation đúng pattern | [:79](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L79) |

### 3.2 ❌ MAJOR — không xem được features chi tiết của một version

[:241](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L241):

```tsx
<TableCell>{version.features.length}</TableCell>
```

Chỉ hiển thị **số lượng**. BE đã trả full `features[]` payload (qua `PlanVersionWithFeaturesResSchema` ở [subscriptionPlan.ts:40‑42](../../src/schemaValidatation/subscriptionPlan.ts#L40-L42)) → FE đang **vứt data đi**.

**Tác hại nghiệp vụ**:
- Admin không thể audit "v3 cấp `max_iot_devices=10` hay `=20`?" — phải mở DB hoặc gọi API tay.
- Khi tạo version mới (S3), không thể nhìn lại version cũ để compare → dễ regress (xem §4.4).
- Customer support hỏi "tại sao Owner X chỉ có 5 thiết bị?" — admin không tra ngược ra version Owner đang dùng có gì.

**Fix**: row expandable với `<Popover>` hoặc nested table:

```tsx
<TableRow>
  <TableCell>
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="link" size="sm">
          {version.features.length} tính năng
          <ChevronDown className="ml-1 h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã tính năng</TableHead>
              <TableHead>Giá trị</TableHead>
              <TableHead>Ghi chú</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {version.features.map((f) => (
              <TableRow key={f.id}>
                <TableCell className="font-mono text-xs">{f.featureCode}</TableCell>
                <TableCell>{f.value}</TableCell>
                <TableCell className="text-muted-foreground">{f.note ?? "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </PopoverContent>
    </Popover>
  </TableCell>
</TableRow>
```

### 3.3 ❌ MAJOR — Detail page bỏ trống ~60% màn hình

[:124‑176](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L124-L176) hiển thị plan info:
- Mã + Tên (1 card)
- Thời hạn + Giá + Trạng thái (3 mini cards)
- Mô tả (1 card)
- Cập nhật gần nhất (1 card)

→ Layout chiếm hết width nhưng nội dung mỏng. Trên màn hình rộng, vùng phải card trống. Đồng thời các thông tin **giá trị nghiệp vụ cao hơn lại không có**:

- Bao nhiêu subscription đang dùng plan này?
- Doanh thu plan này 30 ngày gần nhất?
- Phiên bản đang `isActive` là phiên bản nào?
- Plan tạo lúc nào, ai tạo?

**Fix**: 
1. Layout 2 cột: trái = info card, phải = stats card (subs count + revenue).
2. Thêm KPI strip phía trên card info: `Đang áp dụng cho 142 subscription | Doanh thu 30 ngày: 850M | Phiên bản hiện tại: v3`.

### 3.4 ⚠️ Pagination versions cố định 5/trang

[:59‑63](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L59-L63) — hardcoded `limit: 5`. Plan có nhiều version → admin Next nhiều lần. Thêm Select 5/10/20/50.

### 3.5 ⚠️ Search version có schema không UI

`ListPlanVersionsQuerySchema` có `search` ([subscriptionPlan.ts:106‑108](../../src/schemaValidatation/subscriptionPlan.ts#L106-L108)) nhưng UI không có Input search.

### 3.6 ⚠️ Breadcrumb thiếu

S2 và S3 không có breadcrumb. DEVELOPMENT.md đã list `breadcrumb` trong installed shadcn components ([:1185](../../DEVELOPMENT.md#L1185)). Page S2 chỉ có Back button [:81](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L81) — user mất context khi vào sâu.

**Fix**: 

```tsx
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/dashboard/admin">Admin</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbLink href="/dashboard/admin/subscription-plans">Gói đăng ký</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>{plan.name}</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
```

### 3.7 ⚠️ Version table thiếu sort UI

Default sort by `versionNo desc` (giả định BE) — admin không có cách sort theo `effectiveFrom asc` hoặc filter `isActive=true`. TanStack Table v8 (đã có) hỗ trợ sortable headers — chưa được dùng.

### 3.8 ⚠️ Không có "Set Active" / "Compare Versions" action

Mỗi version chỉ là row read-only. Nghiệp vụ thực tế thường cần:
- Compare 2 version side-by-side (xem v3 đổi gì so với v2)
- Promote draft version → active
- Rollback active về version cũ (nếu BE hỗ trợ)

Hiện chỉ có view + create new. Pure linear history → khó vận hành khi có > 5 version.

### 3.9 ⚠️ Workflow gap: tạo plan → auto-nav S2 → plan rỗng

[AdminSubscriptionPlansListPage.tsx:202](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L202) auto navigate sang S2 sau khi tạo plan thành công. **Nhưng plan vừa tạo CHƯA CÓ VERSION nào** → table version trống → admin phải tự click "Tạo phiên bản mới" 1 lần nữa → land tại S3 với form trống → gõ tay lại từ đầu.

**Tác hại**: workflow đứt đoạn. Admin tạo plan ý là "tạo plan + version đầu tiên" nhưng UI chia làm 2 step rõ rệt mà không có gợi ý.

**Fix option A** (tốt nhất): tạo plan + version đầu tiên trong 1 wizard 2-step:
1. Step 1: Plan info (code, name, duration, price, description)
2. Step 2: Initial version features (chọn từ catalog)

**Fix option B** (rẻ nhất): sau khi tạo plan, banner/Alert ở S2:

```tsx
{versions.length === 0 && (
  <Alert>
    <Sparkles className="h-4 w-4" />
    <AlertTitle>Gói chưa có phiên bản nào</AlertTitle>
    <AlertDescription>
      Tạo phiên bản đầu tiên để gói sẵn sàng cho khách hàng đăng ký.
    </AlertDescription>
    <Button onClick={() => navigate(`/dashboard/admin/subscription-plans/${planId}/versions/new`)}>
      Tạo phiên bản đầu tiên
    </Button>
  </Alert>
)}
```

### 3.10 ✅ Conforms business rules

- **Plan immutable identity** sau create — admin không edit từ S2, phải về S1.
- **Version model audit-trail** — tạo mới, không sửa cũ → đúng nguyên tắc trong [_module-rule.md](../../../farm_os_be/docs/analysis/_module-rule.md).

---

## 4. S3 — `/dashboard/admin/subscription-plans/:planId/versions/new` (create version)

### 4.1 What works ✅

| Behavior | Verified |
|---|---|
| Lazy load feature catalog (60 items) | [:80‑85](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L80-L85) |
| Render plan name/code ở header | [:170‑178](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L170-L178) |
| Field array thêm/xoá feature row | [:95‑98](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L95-L98) |
| Feature dropdown từ catalog (không gõ tự do) | [:241‑291](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L241-L291) |
| Auto-populate value mặc định khi pick feature | [:251‑261](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L251-L261) |
| Render input theo `valueType` (BOOLEAN / number / text) | [:300‑341](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L300-L341) |
| Hiển thị unit label tiếng Việt | [:50‑72](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L50-L72) |
| Server validation 422 → form fields | [:127‑137](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L127-L137) |
| `useClearServerFieldErrors` đã wire | [:93](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L93) |
| Disable last row remove (đảm bảo `features.min(1)`) | [:373](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L373) |

### 4.2 ❌ MAJOR — không có "Clone từ phiên bản hiện tại"

Form khởi tạo trống ([:45‑48](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L45-L48)). Mỗi lần tạo version mới, admin **gõ lại từ đầu toàn bộ feature set** (10-20 feature thực tế). Việc này:
- Tốn thời gian (5-10 phút mỗi lần)
- Dễ sót feature → version mới regression so với version active
- Không có chuẩn để "thay đổi 1 feature, giữ N feature còn lại"

**Đáng nói**: hook `useResolveActivePlanVersion` đã build sẵn ở [useSubscriptionPlan.ts:109‑131](../../src/queries/useSubscriptionPlan.ts#L109-L131) **nhưng dead code** — không được dùng ở đâu cả.

**Fix**: thêm button "Sao chép từ phiên bản đang áp dụng":

```tsx
const activeVersionMutation = useResolveActivePlanVersion();

const handleCloneFromActive = async () => {
  try {
    const active = await activeVersionMutation.mutateAsync(planId);
    form.reset({
      changelog: `Sửa đổi từ v${active.versionNo}: `,
      features: active.features.map((f) => ({
        featureCode: f.featureCode,
        value: f.value,
        note: f.note ?? "",
      })),
    });
    toast.success(`Đã copy ${active.features.length} tính năng từ v${active.versionNo}.`);
  } catch (error) {
    toast.error(getApiErrorMessageVi(error, "Chưa có phiên bản nào để copy."));
  }
};

// In header next to back button:
<Button variant="outline" onClick={handleCloneFromActive} disabled={activeVersionMutation.isPending}>
  <Copy className="mr-2 h-4 w-4" />
  Sao chép từ phiên bản đang áp dụng
</Button>
```

### 4.3 ⚠️ Schema không refine duplicate `featureCode`

Schema [CreatePlanVersionBodySchema](../../src/schemaValidatation/subscriptionPlan.ts#L89-L96) chỉ require `features.min(1)` — không chặn duplicate. Admin có thể vô tình thêm 2 row cùng `max_iot_devices` với 2 value khác nhau → BE ghi đè không kiểm soát.

**Fix**:

```ts
.refine(
  (arr) => new Set(arr.map((f) => f.featureCode)).size === arr.length,
  { message: "Mỗi mã tính năng chỉ được khai báo một lần", path: ["features"] }
)
```

→ Lỗi sẽ render qua [:385‑389](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L385-L389) (đã handle).

### 4.4 ⚠️ Không cảnh báo khi thiếu feature "thiết yếu"

Một plan thực tế thường yêu cầu tối thiểu 4 feature: `max_iot_devices`, `ticket_count`, `max_zones`, `max_members`. Nếu admin tạo version chỉ với 1 feature → BE chấp nhận nhưng owner mua plan này sẽ bị 0 quota cho các feature thiếu.

**Fix mềm**: hiển thị Alert "Tính năng đề xuất chưa có":

```tsx
<Alert variant="warning">
  <AlertTitle>Đề xuất khai báo</AlertTitle>
  <AlertDescription>
    Phiên bản này chưa khai báo: <code>{missingCommonFeatures.join(", ")}</code>.
    Owner đăng ký gói sẽ không có quota cho các tính năng đó.
  </AlertDescription>
</Alert>
```

`missingCommonFeatures` = compare với feature có flag `isCore=true` (cần BE bổ sung field này — graceful upgrade).

### 4.5 ⚠️ Feature dropdown thiếu search

[:264‑285](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L264-L285) — `<Select>` shadcn render plain list. Khi catalog có 60 items, admin scroll dài để tìm `max_iot_devices` giữa rừng feature.

**Fix**: dùng Combobox pattern (Radix Command + Popover) — search-as-you-type. shadcn có example ở docs.

### 4.6 ⚠️ Auto-replace value khi đổi feature là destructive

[:251‑261](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L251-L261):

```tsx
onValueChange={(value) => {
  field.onChange(value);
  const feature = featureMap.get(value);
  form.setValue(
    `features.${index}.value`,
    feature?.valueType === "BOOLEAN" ? "true" : (feature?.defaultValue ?? ""),
    ...
  );
}}
```

User đã gõ value `100` cho `max_iot_devices` → đổi feature sang `max_zones` → value tự nhảy về `defaultValue` của zones. Nếu user vô tình đổi feature thì mất giá trị đã gõ.

**Fix nhẹ**: chỉ replace value khi value hiện tại == defaultValue cũ (chưa edit) hoặc value rỗng. Nếu user đã gõ → confirm trước khi replace.

### 4.7 ⚠️ Footer "Hủy" + Header "Quay lại chi tiết gói" — 2 nút back

[:144‑153](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L144-L153) header có "Quay lại chi tiết gói".
[:392‑401](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L392-L401) footer có "Hủy" cũng navigate về detail.

→ Redundant. Một là đủ (footer "Hủy" hợp với form pattern). Hơn nữa, chưa có cảnh báo "bạn đang có thay đổi chưa lưu" khi user click back giữa lúc gõ — mất data.

### 4.8 ⚠️ Loading feature catalog không có skeleton

[:269‑274](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L269-L274) — Select trigger hiển thị "Đang tải danh mục feature..." → text only, no spinner. Khi BE chậm 2-3s, admin tưởng UI bị treo.

### 4.9 ⚠️ `UNIT_LABELS_VI` static map

[:50‑57](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L50-L57) khai cứng 6 unit. Khi BE thêm unit mới (vd `members`, `farms`, `mb`…) FE fallback hiển thị raw `feature.unit`. Không lỗi nhưng UX kém dần.

**Fix dài hạn**: BE expose `feature.unitLabelVi` trong response → FE chỉ render thẳng.

### 4.10 ⚠️ Changelog không có template

[:185‑205](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L185-L205) — Textarea trống. Admin có thể bỏ qua → version mới không biết thay đổi gì so với cũ.

**Fix**: gợi ý placeholder cụ thể hoặc auto-fill diff:

```
Thay đổi so với v2:
- Tăng max_iot_devices từ 10 → 20
- Thêm tính năng max_managers
```

(Yêu cầu Clone-from-Active đã wire — §4.2.)

### 4.11 ✅ Conforms business rules

- **BR-110 / BR-112**: feature catalog là cấu hình động — admin chọn từ Select.
- **Audit trail**: form CREATE only, không có EDIT version đã publish.

---

## 5. Form & Error Handling — Compliance Audit

> Bám checklist trong [docs/form-error-and-date-handling.md §4](../../../docs/form-error-and-date-handling.md).

### 5.1 ✅ S1 — Plan create/edit form (AdminSubscriptionPlansListPage)

| # | Việc cần làm | Status | Verified |
|---|---|---|---|
| 1 | `useClearServerFieldErrors(form)` sau `useForm()` | ✅ | [:169](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L169) |
| 2 | Bắt 422, gọi `handleApiErrorUnprocessentity` | ✅ | [:223‑232](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L223-L232) |
| 3 | Mỗi field có error binding | ✅ — qua `<FieldError errors={[fieldState.error]} />` (lấy từ React Hook Form fieldState, bao gồm cả lỗi `type=server`) | [:531, 550, 570, 596, 621](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L531) |
| 4 | Truyền `{ getValues: form.getValues }` vào options | ✅ | [:228](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L228) |
| 5 | Fallback toast cho error khác 422 | ✅ | [:233‑238](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L233-L238) |

→ **Pass**.

### 5.2 ✅ S3 — Version create form (AdminSubscriptionPlanVersionCreatePage)

| # | Việc cần làm | Status | Verified |
|---|---|---|---|
| 1 | `useClearServerFieldErrors(form)` | ✅ | [:93](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L93) |
| 2 | Bắt 422, gọi `handleApiErrorUnprocessentity` | ✅ | [:127‑137](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L127-L137) |
| 3 | Mỗi field có error binding | ✅ — `<FieldError errors={[fieldState.error]} />` ở mọi field controller | [:201, 287, 337, 363](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L201) |
| 4 | Truyền `{ getValues: form.getValues }` | ✅ | [:132](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L132) |
| 5 | Fallback toast | ✅ | [:138](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx#L138) |

→ **Pass**.

### 5.3 ✅ Date handling

3 page subscription-plans **không có DatePicker**. Trường date duy nhất là `effectiveFrom` của version — read-only display, format qua `formatDateTimeVi` ([AdminSubscriptionPlanDetailPage.tsx:47‑53](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L47-L53)) — đúng convention `dd/MM/yyyy HH:mm` từ form-error doc §5.4.

→ **Pass** (không có form date input để verify input convention).

### 5.4 ⚠️ Field component pattern — note quan trọng

Form pattern hiện tại dùng:

```tsx
<Field data-invalid={fieldState.invalid}>
  <FieldLabel>...</FieldLabel>
  <FieldContent>
    <Input ... aria-invalid={fieldState.invalid} />
    <FieldError errors={[fieldState.error]} />
  </FieldContent>
</Field>
```

Trong khi [form-error-and-date-handling.md §3 Bước 2](../../../docs/form-error-and-date-handling.md) khuyên:

```tsx
<Field error={form.formState.errors.totalAreaSqm?.message}>
  <Input {...form.register("totalAreaSqm")} />
</Field>
```

→ **2 pattern functionally tương đương** vì `<FieldError errors={[fieldState.error]} />` lấy từ React Hook Form fieldState (bao gồm cả lỗi `type=server` set qua `setError`). Nhưng **inconsistent với doc** — hai pattern song song trong codebase gây lẫn lộn cho dev mới.

**Recommend**: cập nhật doc form-error-and-date-handling.md §3 để thừa nhận cả 2 pattern, HOẶC refactor về 1 pattern duy nhất. Thuộc về tech debt cấp project, không phải bug.

---

## 6. UX/UI Senior Review — Cross-cutting

### 6.1 ❌ Information density too low

| Page | Vùng trống ước tính | Comment |
|---|---|---|
| S1 | 30% (header section to, KPI mỏng) | Chỉ có totalItems + activePlansCount — thiếu cột "subscription đang dùng plan này" trong table |
| S2 | 60% (5 mini cards trải dài, vùng phải trống) | Detail card chiếm full width nhưng thông tin ít |
| S3 | 40% (form 1 cột, vùng phải trống) | Có thể split: trái = current version (preview), phải = form mới |

### 6.2 ❌ Workflow disconnects

Đã nêu rải rác:
- §3.9 — Tạo plan → S2 rỗng
- §4.2 — Tạo version → form trắng (clone hook dead code)
- §2.3 — 2 entry "Tạo phiên bản mới"

→ Tổng thể, admin tạo plan + active version đầu tiên cần **3 click trong 3 trang khác nhau** + gõ tay 10-20 feature. Thiết kế "happy path" nên là 1 wizard chạy từ đầu đến kết thúc.

### 6.3 ⚠️ Visual hierarchy

S1 list table 6 cột có weight đều nhau. Nhưng nghiệp vụ:
- "Mã gói" + "Tên gói" = primary identifier (cần weight cao)
- "Trạng thái" = action-relevant (cần badge color rõ)
- "Thời hạn" + "Giá niêm yết" = secondary numeric data
- "Hành động" = utility column

**Fix**: 
- Bỏ "Mã gói" làm cột riêng, nhúng dưới tên gói thành dòng `font-mono text-xs text-muted-foreground` (giống pattern AdminSubscriptionsWorkspace).
- Tăng weight "Tên gói" lên `font-medium`.
- "Trạng thái" Badge có icon — ✅ đã có ([:392‑399](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L392-L399)).

### 6.4 ⚠️ Microcopy inconsistency

| Vị trí | Text | Đề xuất |
|---|---|---|
| [List:653](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L653) | "...trạng thái ARCHIVED..." | "...trạng thái Đã lưu trữ..." (consistent với label hiển thị) |
| [List:629](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L629) | Nút "Hủy" trong dialog | "Đóng" hoặc "Bỏ qua" (tránh nhầm với cancel subscription) |
| [List:635](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L635) | Nút "Lưu cập nhật" / "Tạo gói" | OK (verb-first, action clear) |
| [Detail:81](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L81) | "Quay lại danh sách" | OK |
| [List:299](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L299) | "Tạo gói đăng ký" | "Tạo gói mới" (ngắn hơn, "đăng ký" đã hiểu trong context) |
| [Detail:340](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx#L340) | "Mỗi gói có menu hành động..." | Mơ hồ. Cụ thể hơn: "Bấm nút (⋯) ở mỗi dòng để xem chi tiết, chỉnh sửa, hoặc tạo phiên bản mới" |

### 6.5 ⚠️ No keyboard shortcuts

Admin power-user cần shortcuts cho action lặp lại:
- `Cmd+K` → search plans
- `N` → tạo plan mới
- `Esc` → close dialog
- `Enter` trong dialog → submit

Hiện chỉ có default browser behavior. shadcn Dialog đã hỗ trợ Esc — verify, OK.

### 6.6 ⚠️ Mobile responsiveness chưa được test

Table 6 cột ở S1, table 5 cột ở S2 versions — màn hình < 768px sẽ overflow-x. Admin dashboard giả định desktop nên acceptable, nhưng tester nên verify:
- Header section [:259‑284](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L259-L284) — flex-col on mobile, OK
- Filter row [:302‑333](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L302-L333) — `md:grid-cols-2`, OK
- Dialog plan create — `max-w-2xl` ([:499](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L499)) sẽ OK trên mobile (auto fallback) nhưng grid 2 cột cho duration+price [:576](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L576) chưa stack mobile.

### 6.7 ⚠️ Confirm dialog redundancy

Ấn "Cập nhật gói" trong edit dialog → submit trực tiếp (không confirm). Nhưng [AdminPackagesPage.tsx:506‑519](../../src/pages/AdminPage/Packages/AdminPackagesPage.tsx#L506-L519) (orphan) lại có `ConfirmDialog` cho update. Inconsistent giữa các page admin.

→ Plan update không phải destructive, không cần double confirm. Giữ pattern submit trực tiếp như đang làm. Nhưng các page khác nên align.

### 6.8 ⚠️ Error toast khi không có internet

DEVELOPMENT.md §5 Toast Notifications — chỉ liệt kê success/error/info. Khi mất kết nối, axios sẽ trả error nhưng FE không có UI riêng cho offline state. Acceptable cho admin (chỉ truy cập internal network), nhưng cần đề phòng.

### 6.9 ⚠️ Animation pattern alignment

DEVELOPMENT.md §Animation Patterns yêu cầu mọi dashboard page dùng `animate-in fade-in duration-300`. 3 page subscription dùng `animate-in fade-in slide-in-from-bottom-2 duration-300` → có thêm slide-in. Acceptable variant (DEVELOPMENT.md §Animation Patterns không cấm) nhưng inconsistent với rest of admin. Verify với UX team — nên thống nhất.

### 6.10 ⚠️ Theme dark mode chưa verify

DEVELOPMENT.md ghi "Dark/light theme via next-themes". 3 page dùng semantic tokens (`bg-card`, `text-muted-foreground`, `bg-muted/30`, `border`) → likely OK với dark mode. Nhưng cần test thực tế:
- Badge `text-destructive` còn đọc được không?
- `bg-primary/10` cho selected feature row có contrast đủ không?

---

## 7. Accessibility Audit

### 7.1 ✅ Đã có

- `aria-invalid={fieldState.invalid}` ở mọi input ([:529, 548, 568, 594, 619](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L529))
- `aria-label="Mở menu hành động"` cho dropdown trigger ([:406](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L406))
- `htmlFor` link FieldLabel với input id ([:522, 542, 561, 582, 607](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L522))

### 7.2 ❌ Thiếu

| Issue | Hệ quả |
|---|---|
| `aria-required` cho field bắt buộc | Screen reader không thông báo required |
| `aria-describedby` link helper text với input | Helper text bị tách rời context |
| Focus management khi mở dialog | shadcn Dialog auto focus first input — verify; nhưng khi close dialog sau submit fail, focus đi đâu? |
| Skip link cho keyboard | Header section to → tab nhiều lần mới đến table |
| Color contrast `text-muted-foreground` trên `bg-muted/30` | Verify WCAG AA |
| Live region cho toast | Sonner default đã có aria-live — OK |

### 7.3 ⚠️ Icon-only buttons thiếu accessible name

[:402‑409](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L402-L409) — DropdownMenuTrigger có aria-label, OK. Nhưng các icon-only button khác (e.g. clear search nếu thêm) cần verify.

---

## 8. Standards Compliance — DEVELOPMENT.md cross-check

### 8.1 ✅ Conforms

| Rule | Compliance |
|---|---|
| **Component organization** — page-specific component trong page folder | ✅ — 3 file đều trong `AdminPage/SubscriptionPlans/` |
| **Naming convention** — PascalCase page, camelCase hook/service | ✅ |
| **Tailwind only, no inline styles** | ✅ — không thấy `style={...}` |
| **Semantic tokens** — `bg-card`, `text-muted-foreground` | ✅ |
| **shadcn/ui imports từ `@/components/ui/`** | ✅ |
| **Toast notifications** dùng `sonner` | ✅ |
| **`useNavigate`** từ `react-router` | ✅ |
| **Animation** — `animate-in fade-in` | ✅ (có thêm slide-in variant — acceptable) |
| **React Query cache invalidation** sau mutation | ✅ — đã verify trong [useSubscriptionPlan.ts](../../src/queries/useSubscriptionPlan.ts) |
| **API response shape** unwrap `{ statusCode, message, data }` | ✅ |
| **Pagination contract** match BE (`page, limit, search`) | ✅ |
| **Schema validation Zod** — chặt | ✅ |
| **VND only** | ✅ (đúng deviation) |

### 8.2 ❌ Vi phạm / cần xử lý

| Rule | Vi phạm | Vị trí |
|---|---|---|
| **Tailwind class hợp lệ** | `max-w-2/6` không phải Tailwind class chuẩn | [List:319](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L319) |
| **Avoid gradient colors** (DEVELOPMENT.md §Styling) | Không thấy gradient — ✅ pass | — |
| **Empty state pattern** — DEVELOPMENT.md §Conditional Rendering Patterns ([:1480‑1483](../../DEVELOPMENT.md#L1480)) suggest `<p className="text-muted-foreground">No data found.</p>` | List dùng pattern này, nhưng không dùng `<EmptyState />` component đã có | [List:368‑377](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L368-L377) |
| **Loading state pattern** — gợi ý `<TableSkeleton />` | List dùng inline text loading | [List:357‑366](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L357-L366) |
| **Pagination component** — gợi ý `<ProPagination />` | List dùng button thô | [List:459‑491](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx#L459-L491) |

### 8.3 Form-error-and-date-handling.md cross-check

→ Đã audit ở §5. **Pass** — pattern Field/FieldContent/FieldError functionally tương đương với pattern `error={...}` trong doc. 1 ghi chú: 2 pattern song song trong codebase gây lẫn lộn (§5.4).

---

## 9. Cross-cutting Code Quality

### 9.1 ✅ Cache invalidation

[useSubscriptionPlan.ts](../../src/queries/useSubscriptionPlan.ts) invalidate đúng key cho mọi mutation. Chi tiết:

- `useAdminCreateSubscriptionPlan` → `subscriptionPlans.all` ([:46‑49](../../src/queries/useSubscriptionPlan.ts#L46-L49))
- `useAdminUpdateSubscriptionPlan` → `all` + `detail(id)` ([:60‑66](../../src/queries/useSubscriptionPlan.ts#L60-L66))
- `useAdminArchiveSubscriptionPlan` → tương tự ([:76‑82](../../src/queries/useSubscriptionPlan.ts#L76-L82))
- `useAdminCreateSubscriptionPlanVersion` → `versions(planId)` + `detail(planId)` ([:97‑104](../../src/queries/useSubscriptionPlan.ts#L97-L104))

→ ✅ Match DEVELOPMENT.md §React Query Hooks "Critical Cache Invalidation".

### 9.2 ✅ Schema FE↔BE alignment

| Concern | FE | Verified |
|---|---|---|
| `code` immutable sau create | `CreatePlanBodySchema` có `code`, `UpdatePlanBodySchema` không có | [:48, 63](../../src/schemaValidatation/subscriptionPlan.ts#L48) |
| `code` max 64 ký tự | `z.string().max(64)` | [:50](../../src/schemaValidatation/subscriptionPlan.ts#L50) |
| `durationMonths` positive int | `.int().positive()` | [:55‑56](../../src/schemaValidatation/subscriptionPlan.ts#L55-L56) |
| `listPrice` non-negative | `.min(0)` | [:59](../../src/schemaValidatation/subscriptionPlan.ts#L59) |
| Status enum `ACTIVE / ARCHIVED` | `z.enum([...])` | [:8](../../src/schemaValidatation/subscriptionPlan.ts#L8) |
| Version feature array `min 1` | `.min(1, "Cần ít nhất một tính năng")` | [:92‑94](../../src/schemaValidatation/subscriptionPlan.ts#L92-L94) |

→ ✅ Schema chặt, không có gap.

### 9.3 ⚠️ Dead code

`useResolveActivePlanVersion` ở [useSubscriptionPlan.ts:109‑131](../../src/queries/useSubscriptionPlan.ts#L109-L131) **không được dùng ở đâu cả** trong subscription-plans tab. Đây là hook đã build sẵn để clone version active — nhưng UI chưa wire (xem §4.2). Hoặc xoá hoặc wire.

---

## 10. Deviation Alignment

Subscription Plans tab **đúng** mọi deviation đã chốt trong [_module-rule.md L37‑46](../../../farm_os_be/docs/analysis/_module-rule.md#L37-L46):

| Deviation | FE state |
|---|---|
| Currency VND only | ✅ formatter hardcode VND |
| No e-invoice | ✅ không có nút export |
| Plan archive thay vì delete | ✅ button gọi `archivePlan` (soft delete) |
| Feature catalog là cấu hình động | ✅ `useListFeatures` thay vì hardcode enum |

---

## 11. Priority Action List

### P0 — Critical (block daily admin workflow)

1. **Hiển thị features detail trong S2 version table** (§3.2) — admin không thể audit version cũ → blocker nghiệp vụ.
2. **Wire `useResolveActivePlanVersion` vào S3** (§4.2) — clone-from-active ngăn regression. Hook đã build sẵn nhưng dead code.
3. **Workflow continuity tạo plan → version** (§3.9) — banner Alert ở S2 khi `versions.length === 0` HOẶC wizard 2-step.

### P1 — High (visible UX issues for power admin)

4. **Đổi icon archive từ `Trash2` (đỏ) sang `Archive`** (§2.4).
5. **Bỏ "Tạo phiên bản mới" khỏi row dropdown S1** (§2.3) — ép admin xem detail trước.
6. **Sửa Tailwind class `max-w-2/6` không hợp lệ** (§2.5) — class này có thể bị Tailwind ignore, debug khó.
7. **Refine `CreatePlanVersionBodySchema`** chặn duplicate `featureCode` (§4.3).
8. **Thay loading text bằng `<TableSkeleton />`** (§2.7) — consistent với rest of admin.
9. **Thay empty state bằng `<EmptyState />`** với CTA inline (§2.6).
10. **Currency input format thousands** (§2.14) — phòng admin nhập sai bậc số.
11. **Required field markers + tooltip cho disabled `code`** (§2.13, §2.15).

### P2 — Polish

12. **Unarchive action** (§2.2) — phụ thuộc verify BE endpoint.
13. **Pagination size selector** S2 (§3.4) + S1 (§2.8).
14. **Search version UI** S2 (§3.5) — schema có, UI thiếu.
15. **Breadcrumb** S2/S3 (§3.6).
16. **Detail page enrichment** (§3.3) — KPI strip + stats card phải.
17. **Combobox search cho feature dropdown** S3 (§4.5).
18. **Confirm "unsaved changes" khi back từ S3 form** (§4.7).
19. **Microcopy fixes** (§6.4) — "ARCHIVED" → "Đã lưu trữ", "Hủy" → "Đóng".
20. **Character counter cho description** (§2.16).
21. **Help text cho form fields** (§2.17).
22. **BE expose `feature.unitLabelVi`** thay vì FE map cứng (§4.9).
23. **BE flag `feature.isCore`** + cảnh báo missing core features (§4.4).
24. **Inline wrapper `AdminSubscriptionPlansPage.tsx`** vào routes (§1.2 note).

### P3 — Nice to have

25. **Keyboard shortcuts** (`Cmd+K` search, `N` new plan).
26. **Mobile responsiveness verify** (§6.6).
27. **Dark mode contrast verify** (§6.10).
28. **Accessibility enhancements** — `aria-required`, `aria-describedby` (§7.2).
29. **Compare 2 versions side-by-side** (§3.8).

---

## 12. Conformance Summary Matrix

Legend: ✅ Conforms · ⚠️ Partial · ❌ Missing/Wrong · ➖ Out of scope

| Behavior | Surface | Status |
|---|---|---|
| **Data layer** | | |
| Plan CRUD (list / create / update / archive) | S1 | ✅ |
| Plan version CRUD (list / create) | S2 / S3 | ✅ |
| Plan **unarchive** | S1 | ❌ |
| Feature catalog wired | S3 | ✅ |
| Cache invalidation | hooks | ✅ |
| Schema validation chặt | schema | ✅ |
| **Form & error handling** | | |
| `useClearServerFieldErrors` | S1, S3 | ✅ |
| 422 → form fields | S1, S3 | ✅ |
| Date handling convention | n/a (no date input) | ➖ |
| **UX flows** | | |
| Tạo plan → S2 có CTA tạo version đầu tiên | S1 → S2 | ❌ |
| Tạo version có clone from active | S3 | ❌ |
| Xem features detail của version cũ | S2 | ❌ |
| **UI patterns / DEVELOPMENT.md** | | |
| Animation `animate-in fade-in duration-300` | toàn route | ✅ |
| `<TableSkeleton />` cho loading | S1 list table | ❌ |
| `<EmptyState />` cho empty | S1 list table | ❌ |
| `<ProPagination />` cho pagination | S1, S2 | ❌ |
| `<Breadcrumb />` cho nested route | S2, S3 | ❌ |
| Tailwind class hợp lệ | S1 | ❌ (`max-w-2/6`) |
| Semantic tokens (no inline style) | toàn route | ✅ |
| **Visual design** | | |
| Icon ngữ nghĩa đúng | S1 | ❌ (`Trash2` cho archive) |
| Currency input format | S1 dialog | ❌ (plain number) |
| Required field markers | S1 dialog | ❌ |
| Tooltip cho disabled field | S1 dialog | ❌ |
| Character counter | S1 dialog | ❌ |
| Help text cho fields | S1 dialog | ❌ |
| **Accessibility** | | |
| `aria-invalid` | S1, S3 | ✅ |
| `aria-label` cho icon-only button | S1 | ✅ |
| `htmlFor` link label-input | S1, S3 | ✅ |
| `aria-required` cho required field | S1, S3 | ❌ |
| `aria-describedby` cho helper | S1, S3 | ❌ |
| **Microcopy** | | |
| "ARCHIVED" trong câu Việt | S1 confirm dialog | ⚠️ |
| "Hủy" có thể nhầm context | S1 dialog footer | ⚠️ |
| **Information density** | | |
| S1 table có cột "subscription đang dùng" | S1 | ❌ |
| S2 detail page có KPI strip | S2 | ❌ |
| S2 version table có sort UI | S2 | ❌ |
| S2 version compare side-by-side | S2 | ❌ |
| **Deviation alignment** | | |
| No refund / no manual BT / no e-invoice | toàn route | ✅ |

---

## 13. Files to touch (concrete checklist)

| File | Action | Mục đích |
|---|---|---|
| [src/queries/useSubscriptionPlan.ts](../../src/queries/useSubscriptionPlan.ts) | **Edit** | Thêm `useAdminUnarchiveSubscriptionPlan` (§2.2) |
| [src/services/subscriptionPlanService.ts](../../src/services/subscriptionPlanService.ts) | **Edit** | Thêm `unarchivePlan(id)` |
| [src/constants/endpoints.ts](../../src/constants/endpoints.ts) | **Edit** | Thêm `UNARCHIVE: (id) => /plans/${id}/unarchive` |
| [src/schemaValidatation/subscriptionPlan.ts](../../src/schemaValidatation/subscriptionPlan.ts) | **Edit** | Refine duplicate `featureCode` (§4.3) |
| [src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansListPage.tsx) | **Edit** | Unarchive (§2.2); bỏ "Tạo phiên bản mới" row dropdown (§2.3); icon `Archive` (§2.4); fix `max-w-2/6` (§2.5); `<EmptyState />` (§2.6); `<TableSkeleton />` (§2.7); `<ProPagination />` (§2.8); search clear button (§2.10); microcopy (§2.11, §2.12); required markers (§2.13); currency mask (§2.14); tooltip disabled (§2.15); character counter (§2.16); help text (§2.17) |
| [src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage.tsx) | **Edit** | Expandable features detail (§3.2); KPI strip + stats (§3.3); pagination size selector (§3.4); search version (§3.5); breadcrumb (§3.6); sort UI (§3.7); empty state banner cho `versions.length === 0` (§3.9) |
| [src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage.tsx) | **Edit** | Wire `useResolveActivePlanVersion` clone (§4.2); duplicate-feature error (§4.3); core feature warning (§4.4); Combobox search (§4.5); guard auto-replace value (§4.6); bỏ 1 trong 2 nút back (§4.7); spinner loading catalog (§4.8); changelog template (§4.10); breadcrumb (§3.6) |
| [src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansPage.tsx](../../src/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansPage.tsx) | **Optional** | Inline vào routes hoặc giữ làm placeholder |

---

## 14. Self-check / Reviewer Notes

> Tự kiểm tra theo yêu cầu user.

| Concern | Verified? |
|---|---|
| Đã đọc cả 3 file route page? | ✅ — đọc full S1, S2, S3 |
| Đã verify hook + service + schema match BE convention DEVELOPMENT.md? | ✅ — cache invalidation, response unwrap, paging contract đúng |
| Đã check form-error-and-date-handling.md compliance? | ✅ — §5 mục riêng |
| Có claim về lỗi UI mà chưa verify code? | Có 2 mục: §6.6 mobile responsive + §6.10 dark mode contrast — cần test thực tế. Đã đánh dấu rõ "cần test". |
| Có nhầm scope sang module khác (IoT Kit, Subscription Lifecycle, Invoice)? | ✅ — đã giới hạn 3 route. Khi nhắc tới EmptyState/TableSkeleton có dẫn link sang AdminSubscriptionsWorkspace để show pattern reference, không phải audit. |
| Có recommend feature ngoài BR/Deviations? | ✅ — Combobox, Breadcrumb, Tooltip thuộc UX/UI, không thay đổi nghiệp vụ. Compare versions (§3.8) là "nice to have" — đã đánh P3. |
| Có double-check Tailwind class `max-w-2/6`? | ✅ — Tailwind v4 chỉ có fraction tối giản; `2/6` không có trong default theme. Class sẽ bị ignore (CSS không match). |
| Có miss rule nào trong DEVELOPMENT.md? | Đã cross-check §8 — 1 vi phạm (`max-w-2/6`) và 4 inconsistency (no TableSkeleton/EmptyState/ProPagination/Breadcrumb). |
| Có miss rule nào trong form-error-and-date-handling.md? | ✅ — §5 4 rule đã pass. Không có DatePicker để test rule date. |
| Out of scope creep? | Không. Audit chỉ động đến 3 page subscription-plans. |

---

_End of audit. Re-run sau khi xử lý P0/P1. Out of scope: Subscription Lifecycle, Invoices, Owner-side, các tab admin khác — sẽ audit ở document riêng._
