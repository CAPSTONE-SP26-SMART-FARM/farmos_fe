# Plan — Admin Crop Category Page (CRUD)

> **Scope:** Lập kế hoạch trang quản trị `Admin / Crop Categories` trên FE web. **Không viết code** ở giai đoạn này — tài liệu này chỉ mô tả: vị trí file, contract BE đã xác minh trong code, schema Zod cần xây, form layout, error mapping, role gating, và checklist triển khai.
>
> **Tham chiếu bắt buộc:**
> - [`DEVELOPMENT.md`](../DEVELOPMENT.md) — quy ước project (layer, naming, page pattern).
> - [`docs/form-error-and-date-handling.md`](../../docs/form-error-and-date-handling.md) — bắt buộc dùng `useClearServerFieldErrors` + `handleApiErrorUnprocessentity` + `error` prop trên mọi `Field`.
> - BE: `farm_os_be/docs/issue_logs/fix_issue_crop_season_flow/api_reference_frontend.html` (bảng API).
> - BE code đã verify trực tiếp: `farm_os_be/src/modules/crop-category/` (controller / model / error / service / repo).
>
> **Cấm:** sửa BE, sửa FE code. Đây chỉ là plan.
>
> Generated: 2026-05-18

---

## 1. Mục tiêu nghiệp vụ

Admin cần CRUD danh mục cây trồng (`crop_categories`) để cung cấp dropdown loại cây cho form tạo `CropSeason` (Manager) — kèm cấu hình mật độ chuẩn (min/max/recommended cây/m²), chu kỳ vụ mặc định, diện tích tối thiểu khuyến nghị. BE dùng catalog này để auto-validate density & cycle khi tạo vụ.

**Phạm vi trang này (chỉ admin):**
- List + search + filter (`isActive`) + pagination
- Create
- Update (PATCH, không đổi `code`)
- Toggle active/inactive

**Ngoài phạm vi (sẽ làm ở plan/PR khác):**
- Dropdown `GET /crop-categories/active` trong form CropSeason — sẽ xử lý cùng vụ refactor form Manager.
- Backfill `OTHER` protection — BE chưa khóa (xác nhận trong code `crop-category.service.ts` không có special-case), FE chỉ disable nút Toggle khi `code === "OTHER"` (xem 6.4).

---

## 2. Contract BE đã xác minh trong code

> Lấy trực tiếp từ `farm_os_be/src/modules/crop-category/`. Mức độ tin cậy: cao — đã đọc model, error, controller, repo.

### 2.1. Endpoints

| Method | Path | Role | Mục đích |
|---|---|---|---|
| GET | `/admin/crop-categories` | `admin` | List paginated + search + filter |
| POST | `/admin/crop-categories` | `admin` | Create |
| PATCH | `/admin/crop-categories/:id` | `admin` | Partial update (không nhận `code`) |
| PATCH | `/admin/crop-categories/:id/toggle` | `admin` | Body `{ isActive: boolean }` |
| GET | `/crop-categories/active` | `owner, manager` | (ngoài plan này) |

### 2.2. Query params — list

| Param | Type | Default | Ghi chú |
|---|---|---|---|
| `page` | int ≥1 | `1` | |
| `limit` | int 1–100 | `10` | |
| `search` | string | — | Case-insensitive trên `code` / `name` / `scientificName` |
| `isActive` | boolean (coerced) | — | Optional filter |

Sort cố định ở BE: `isActive DESC, code ASC` — FE không cần truyền `sort`.

### 2.3. Response 200 — list

```jsonc
{
  "statusCode": 200,
  "message": "...",
  "data": {
    "data": [ CropCategory, ... ],
    "meta": { "page", "limit", "totalItems", "totalPages", "hasNextPage", "hasPreviousPage" }
  }
}
```

Khớp với pattern `PagingResponseSchema` (DEVELOPMENT.md §10).

### 2.4. CropCategory response shape

| Field | Type | Nullable | Ghi chú |
|---|---|---|---|
| `id` | uuid | no | |
| `code` | string | no | UPPERCASE, regex `^[A-Z0-9_-]{2,64}$` |
| `name` | string | no | 1..255 |
| `scientificName` | string | yes | ≤255 |
| `description` | string | yes | |
| `minPlantingDensity` | number | no | cây/m², Decimal serialized as Number |
| `maxPlantingDensity` | number | no | cây/m² |
| `recommendedDensity` | number | yes | ∈ [min, max] |
| `defaultCycleDays` | int | yes | ngày, >0 |
| `minAreaSqm` | number | yes | m², >0 |
| `isActive` | boolean | no | |
| `metadata` | any (JSON) | yes | (FE không edit ở MVP) |
| `createdAt`, `updatedAt` | string ISO 8601 | no | |

### 2.5. Create body constraints (Zod `.strict()`)

| Field | Rule | Req |
|---|---|---|
| `code` | regex `/^[A-Z0-9_-]{2,64}$/` | ✅ |
| `name` | min 1, max 255 | ✅ |
| `scientificName` | max 255 | optional |
| `description` | string | optional |
| `minPlantingDensity` | number > 0 | ✅ |
| `maxPlantingDensity` | number > 0, **≥ min** (cross-field) | ✅ |
| `recommendedDensity` | number > 0, **∈ [min, max]** (cross-field) | optional |
| `defaultCycleDays` | int > 0 | optional |
| `minAreaSqm` | number > 0 | optional |
| `metadata` | any | optional (ẩn ở UI) |

> **Strict mode:** BE từ chối field thừa → FE không được gửi field rác (vd. `id`, `createdAt`).

### 2.6. Update body — như Create nhưng:

- **Không nhận `code`** (BE strict reject).
- Tất cả field optional.
- Cross-field check density vẫn chạy với giá trị hiệu dụng sau update.

### 2.7. Toggle body

```json
{ "isActive": false }
```

`isActive` bắt buộc. Response trả 1 `CropCategory` đầy đủ.

### 2.8. Error format thực tế (đã verify code)

> **Quan trọng — sai khác với BE doc:** `api_reference_frontend.html` mô tả 422 là `{ message: [{ message, path }], error }`. **Code thực tế** ở `global-exception.filter.ts` chuyển thành format FE đã quen ([`form-error-and-date-handling.md`](../../docs/form-error-and-date-handling.md) §1):
>
> ```jsonc
> {
>   "statusCode": 422,
>   "message": "Validation failed",
>   "errors": [{ "field": "code", "message": "Error.CropCategoryCodeAlreadyExists" }]
> }
> ```
>
> → FE dùng `handleApiErrorUnprocessentity` như mọi form khác, không cần adapter mới.

| Exception (BE class) | HTTP | `field` trong errors[] | i18n key (`message`) |
|---|---|---|---|
| `CropCategoryNotFoundException` | 404 | — (toast, không có errors[]) | `Error.CropCategoryNotFound` |
| `CropCategoryCodeAlreadyExistsException` | 422 | `code` | `Error.CropCategoryCodeAlreadyExists` |
| `CropCategoryMinDensityExceedsMaxException` | 422 | `maxPlantingDensity` | `Error.CropCategoryMinDensityExceedsMax` |
| `CropCategoryRecommendedDensityOutOfRangeException` | 422 | `recommendedDensity` | `Error.CropCategoryRecommendedDensityOutOfRange` |
| Zod field errors (regex/length/positive) | 422 | tên field tương ứng | message Zod gốc (đã có pattern dịch fallback) |

> Note: BE doc liệt kê *thiếu* `Error.CropCategoryRecommendedDensityOutOfRange`. Code mới có. FE map cả 4.

---

## 3. Mapping vào kiến trúc FE

> Tuân theo [DEVELOPMENT.md §4 (data flow) & §6 (Creating a New Page)](../DEVELOPMENT.md).

### 3.1. File cần tạo

| Layer | Đường dẫn | Vai trò |
|---|---|---|
| Endpoint constant | [src/constants/endpoints.ts](../src/constants/endpoints.ts) (thêm block `CROP_CATEGORIES`) | Tham chiếu pattern `TICKET_CATEGORIES` (dòng 457) |
| Query keys | cùng file, block `QUERY_KEYS.cropCategories` | `all`, `list(filters)`, `detail(id)`, `active` |
| Zod schema | `src/schemaValidatation/cropCategory.ts` | Theo pattern [DEVELOPMENT.md §10](../DEVELOPMENT.md#schema-validation-zod) |
| Service | `src/services/cropCategoryService.ts` | Pattern `api.get/post/patch`, có `queryString.stringify({ skipEmptyString, skipNull })` |
| Hook | `src/queries/useCropCategory.ts` | List + Detail + Create + Update + Toggle, có `invalidateQueries` ([DEVELOPMENT.md §11](../DEVELOPMENT.md#critical-cache-invalidation-must)) |
| Page | `src/pages/AdminPage/CropCategories/AdminCropCategoriesPage.tsx` | Entry — header + button "Tạo loại cây" + list section + dialog |
| List section | `src/pages/AdminPage/CropCategories/AdminCropCategoryListSection.tsx` | Search bar + isActive filter + table + pagination |
| Form panel | `src/pages/AdminPage/CropCategories/AdminCropCategoryFormPanel.tsx` | Form Create / Update (mode = create | detail) |
| Route | [src/routes/routes.ts](../src/routes/routes.ts) | `/dashboard/admin/crop-categories`, `allowedRoles: ["admin"]` |
| Sidebar entry | nơi declare admin sidebar items | "Loại cây trồng" với icon `Sprout` từ lucide |
| Error map | [src/lib/error-message.ts](../src/lib/error-message.ts) | 4 key mới (xem §5) |

### 3.2. Pattern tham chiếu

Trang `AdminTicketCategoriesPage` ([src/pages/AdminPage/TicketCategories/](../src/pages/AdminPage/TicketCategories/)) là analog gần nhất:
- 1 entry page + 1 list section + 1 form panel
- Dùng `Dialog` của shadcn để chứa form (KHÔNG dùng slide-in panel pattern — slide-in pattern dành cho dashboard owner zone/farm; admin CRUD theo convention hiện tại dùng Dialog).
- `DialogState` discriminated union: `closed | create | detail(category)`.

→ Trang Crop Categories bắt chước hoàn toàn cấu trúc này.

---

## 4. UI/UX Design

### 4.1. Page layout

```
┌─────────────────────────────────────────────────────────────┐
│ [Cổng quản trị]                                             │
│ Loại cây trồng                          [+ Tạo loại cây]    │
│ Quản lý catalog loại cây — mật độ chuẩn, chu kỳ vụ,…       │
├─────────────────────────────────────────────────────────────┤
│ List Section                                                │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ [Search…]  [Status: All ▼]                              │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ Code     Tên          Mật độ (min–max)  Cycle  Active   │ │
│ │ TOMATO   Cà chua      2.0 – 4.0 (rec 3) 90 d   ●  [⋮]  │ │
│ │ RICE     Lúa nước     20 – 40           110 d  ●  [⋮]  │ │
│ │ OTHER    Khác         0.001 – 1000      —      ●  [⋮]  │ │
│ │ …                                                        │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │                  [‹ 1 2 3 ›]                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

Row action menu (`[⋮]`): "Xem / Sửa", "Bật" hoặc "Tắt" (toggle tùy `isActive`). Click row hoặc "Xem / Sửa" mở Dialog detail.

### 4.2. Search & filter (List Section)

- **Search input:** debounce 500ms qua `useDebounce` (đã có ở `src/hooks/useDebounce.tsx`). Khi nhập → reset `page = 1`.
- **Status select:** `Tất cả` | `Đang hoạt động` | `Đã tắt`, map → `isActive: undefined | true | false`.
- Khi `isLoading` → render `<TableSkeleton />`.
- Khi `data?.data.data.length === 0` → empty state "Chưa có loại cây nào khớp bộ lọc".

### 4.3. Form panel

```
┌──────────── Dialog (max-w-2xl) ─────────────┐
│ Tạo loại cây trồng                          │
│ Định nghĩa mật độ chuẩn & chu kỳ vụ.        │
├──────────────────────────────────────────────┤
│ Mã loại (code)  *      [TOMATO________]      │
│   ↳ UPPERCASE, 2–64 ký tự, A–Z 0–9 _ -      │
│                                              │
│ Tên hiển thị *         [Cà chua_________]   │
│ Tên khoa học           [Solanum lycopers..] │
│ Mô tả                  [textarea x 3 rows ] │
│                                              │
│ ─── Mật độ chuẩn (cây/m²) ───                │
│ Min *      [2.0_]   Max *      [4.0_]        │
│ Khuyến nghị (tuỳ chọn)         [3.0_]        │
│                                              │
│ ─── Chu kỳ & diện tích (tuỳ chọn) ───        │
│ Chu kỳ mặc định (ngày)         [90___]       │
│ Diện tích tối thiểu (m²)        [____]      │
│                                              │
├──────────────────────────────────────────────┤
│                       [Huỷ]   [Tạo loại cây] │
└──────────────────────────────────────────────┘
```

**Mode = detail (update):**
- `code` field **disabled** + helper "Mã không thể đổi sau khi tạo".
- Thêm khối read-only ở đầu: `createdAt`, `updatedAt`, badge active/inactive.
- Footer thêm nút secondary "Bật / Tắt loại cây" (gọi toggle endpoint, confirm bằng `ConfirmDialog` của shadcn).
- Nút submit: "Lưu thay đổi".

**Real-time hint (UX nice-to-have, không bắt buộc MVP):**
- Khi nhập `min > max` → hiển thị error đỏ ngay dưới `Max` (Zod `superRefine`), không cần đợi submit.
- Khi `recommended` nằm ngoài `[min, max]` → error đỏ ngay dưới `Khuyến nghị`.

### 4.4. Empty / loading / error states

| State | UI |
|---|---|
| Loading list | `<TableSkeleton rows={5} />` |
| Empty (đã filter) | "Không tìm thấy loại cây phù hợp." + nút "Xóa bộ lọc" |
| Empty (lần đầu) | "Chưa có loại cây nào — bấm 'Tạo loại cây' để bắt đầu." |
| Fetch error | `<p className="text-destructive">{getErrorMessage(error)}</p>` + nút "Thử lại" |

---

## 5. Schema Zod & Type — phác thảo

> Chỉ phác thảo cấu trúc, **không** ghi vào code. Tên schema theo convention DEVELOPMENT.md §14 (`*Schema`, `*Type`).

```
CropCategoryResSchema           // response object (response 2.4)
├─ code, name, scientificName, description
├─ minPlantingDensity, maxPlantingDensity, recommendedDensity (number/nullable)
├─ defaultCycleDays, minAreaSqm (number/nullable)
├─ isActive, metadata
└─ createdAt, updatedAt (z.string())

ListCropCategoriesQuerySchema   // extends PagingRequestSchema
├─ search?: string
└─ isActive?: boolean

ListCropCategoriesResSchema     // PagingResponseSchema(CropCategoryResSchema)

CreateCropCategoryBodySchema    // 2.5
├─ code: regex /^[A-Z0-9_-]{2,64}$/
├─ name: min(1).max(255)
├─ scientificName?: max(255)
├─ description?: string
├─ minPlantingDensity: positive number
├─ maxPlantingDensity: positive number
├─ recommendedDensity?: positive number
├─ defaultCycleDays?: int positive
├─ minAreaSqm?: positive number
└─ .superRefine(({ min, max, recommended }) => {
     if (max < min)                    → addIssue path:["maxPlantingDensity"]
     if (recommended != null
         && (recommended < min || recommended > max))
                                       → addIssue path:["recommendedDensity"]
   })

UpdateCropCategoryBodySchema    // 2.6 — như Create nhưng:
├─ KHÔNG có `code`
├─ Tất cả field optional
└─ superRefine tương tự (chỉ chạy khi cả min & max đều có trong giá trị hiệu dụng — vì PATCH partial, cần lấy giá trị hiện tại merge với body để check; cách đơn giản: chỉ check khi cả 2 field cùng có mặt trong body, để BE check phần còn lại)

ToggleCropCategoryBodySchema    // 2.7
└─ isActive: boolean
```

**Cross-field validation strategy (FE):**
- Client-side `superRefine` chỉ chạy với body đang gửi. Trường hợp PATCH (vd. update mỗi `recommendedDensity`), FE không có context `min`/`max` cũ → để BE bắt và trả về error trên field `recommendedDensity` (key `Error.CropCategoryRecommendedDensityOutOfRange`).
- Như vậy đảm bảo nhất quán + không cần fetch lại detail trước khi submit.

---

## 6. Error mapping & UX

### 6.1. Bổ sung vào [`src/lib/error-message.ts`](../src/lib/error-message.ts) `BACKEND_ERROR_MAP`

Lookup hiện tại dùng `message.trim().toLowerCase()` → keys cần lowercase:

| Lowercase key (lookup) | Bản dịch VI |
|---|---|
| `error.cropcategorynotfound` | Không tìm thấy loại cây trồng. |
| `error.cropcategorycodealreadyexists` | Mã loại cây đã tồn tại. |
| `error.cropcategorymindensityexceedsmax` | Mật độ tối thiểu phải ≤ mật độ tối đa. |
| `error.cropcategoryrecommendeddensityoutofrange` | Mật độ khuyến nghị phải nằm giữa min và max. |

> Kiểm tra lại: nếu lookup table thực tế ở `error-message.ts` còn dùng full key `Error.*` (chưa lowercase) — chọn format đang dùng hiện tại (xem dòng 318 `error.iotkitnotfound` → confirm pattern lowercase).

### 6.2. Mapping field → input UI

| BE `field` (response 422) | Input cần highlight |
|---|---|
| `code` | `code` input (create only) |
| `name` | `name` input |
| `minPlantingDensity` | `minPlantingDensity` |
| `maxPlantingDensity` | `maxPlantingDensity` (cả khi `min > max`) |
| `recommendedDensity` | `recommendedDensity` |
| `defaultCycleDays` | `defaultCycleDays` |
| `minAreaSqm` | `minAreaSqm` |

Hook `handleApiErrorUnprocessentity` xử lý tự động vì các tên này khớp 1:1 với key trong `CreateCropCategoryBodyType` (form-error-and-date-handling.md §3 bước 1).

### 6.3. UX 404 / 422 không khớp field

- 404 `Error.CropCategoryNotFound` (khi user mở dialog detail nhưng row đã bị xóa) → `toast.error` + đóng dialog + invalidate list.
- 422 nhưng `field` không có trong form (vd. `metadata`) → fallback `toast.error` qua `handleApiErrorUnprocessentity` (đã built-in).

### 6.4. Bảo vệ category `OTHER` (FE-side, BE chưa khóa)

BE không có special-case (đã đọc `crop-category.service.ts`). Để tránh admin vô tình tắt `OTHER` (làm vỡ luồng tạo CropSeason cho giống lạ):
- Trong row action menu của list: nếu `category.code === "OTHER"` → disable nút "Tắt" + tooltip "Không thể tắt loại mặc định `OTHER`".
- Trong form panel detail: ẩn nút "Bật / Tắt loại cây" khi `code === "OTHER"`.
- **Không** chặn ở Zod (vì server vẫn cho qua); chỉ là UX guard.

---

## 7. React Query — cache invalidation

> Bắt buộc theo [DEVELOPMENT.md §11](../DEVELOPMENT.md#critical-cache-invalidation-must).

| Mutation | Invalidate |
|---|---|
| `useCreateCropCategory` | `QUERY_KEYS.cropCategories.all` + `cropCategories.active` (vì owner/manager có thể vừa mới được phép thấy) |
| `useUpdateCropCategory` | `cropCategories.all` + `cropCategories.detail(id)` + `cropCategories.active` |
| `useToggleCropCategory` | giống Update |

Toast thành công ở `onSuccess`:
- Create: "Đã tạo loại cây trồng"
- Update: "Đã cập nhật loại cây"
- Toggle on/off: "Đã bật loại cây" / "Đã tắt loại cây"

Error toast qua `getErrorMessage(error)` — chuỗi đã đi qua `normalizeErrorText` → `translateBackendMessage` → ra tiếng Việt.

---

## 8. Routing & sidebar

### 8.1. Route

```
{ path: "/dashboard/admin/crop-categories",
  component: AdminCropCategoriesPage,
  allowedRoles: ["admin"] }
```

Thêm vào block `adminRoutes` trong [`src/routes/routes.ts`](../src/routes/routes.ts).

### 8.2. Sidebar

Thêm item vào sidebar admin (nhóm "Catalog" / "Tham chiếu" nếu đã có; nếu chưa → đặt cạnh `Medicines` / `IotTemplates`):
- Label: **Loại cây trồng**
- Icon: `Sprout` (lucide-react)
- Path: `/dashboard/admin/crop-categories`

### 8.3. Role gating

- `ProtectedRoute` (đã có ở `src/components/auth/ProtectedRoute.tsx`) sẽ tự redirect owner/manager nếu họ paste URL.
- Không cần thay đổi `ProtectedRoute` — chỉ đăng ký đúng `allowedRoles`.

---

## 9. Animation

Theo DEVELOPMENT.md §20:
- Page root: `className="space-y-6 animate-in fade-in duration-300"` (dashboard pattern).
- Dialog của form: dùng mặc định của shadcn `Dialog` (Radix transition) — KHÔNG dùng slide-in `show` state vì đây là dialog, không phải panel thay thế.

---

## 10. Backend convention checklist (đối chiếu DEVELOPMENT.md §15)

| Khía cạnh | BE thực tế | FE phải mirror |
|---|---|---|
| Response envelope `{ statusCode, message, data }` | ✓ (interceptor toàn cục) | `ApiResponseType<T>` (đã có) |
| Pagination meta có `hasNextPage` / `hasPreviousPage` | ✓ (repo line 49–59) | `PagingResponseSchema` (đã có) |
| Date ISO 8601 string | ✓ (`.toISOString()` ở repo) | `z.string()`, dùng `parseBackendDate` khi cần render |
| Decimal → number (không string) | ✓ (repo line 24–26) | `z.number()`, không `z.string().transform` |
| Strict body (reject extra fields) | ✓ (Zod `.strict()`) | FE chỉ gửi field trong schema — không spread state không liên quan |
| Error 422 → `{ errors: [{ field, message }] }` | ✓ (`global-exception.filter.ts`) | `handleApiErrorUnprocessentity` (đã có) |

---

## 11. Acceptance criteria (cho QA)

1. Admin đăng nhập → sidebar có "Loại cây trồng" → click → tới trang list.
2. List render 10 row/trang, sort `isActive DESC, code ASC` (do BE), có search debounce + filter `isActive`.
3. Bấm "Tạo loại cây" → Dialog mở, mọi field bắt buộc đỏ khi bỏ trống.
4. Nhập `code` thường (`tomato`) → Zod báo lỗi regex tiếng Việt trước khi submit.
5. Nhập `min = 4`, `max = 2` → Zod superRefine highlight ô `Max` ngay (không cần submit).
6. Trùng `code` (vd. `TOMATO` đã có) → submit → 422 → field `code` highlight đỏ + message "Mã loại cây đã tồn tại."
7. Tạo thành công → toast "Đã tạo loại cây trồng" + list refresh + dialog đóng.
8. Mở row detail → field `code` disabled với helper "Mã không thể đổi sau khi tạo".
9. Update `maxPlantingDensity` xuống dưới `min` đã lưu → 422 → toast/field highlight đỏ message "Mật độ tối thiểu phải ≤ mật độ tối đa."
10. Toggle row → confirm dialog → BE cập nhật → list refresh + icon active đổi màu.
11. Row `OTHER`: nút "Tắt" disabled, tooltip giải thích.
12. Owner / Manager paste URL `/dashboard/admin/crop-categories` → redirect về dashboard role tương ứng + toast.
13. Mọi field input có `error` prop (xem form-error-and-date-handling.md §4) — bỏ sót dù 1 field = QA fail.

---

## 12. Triển khai — checklist (cho dev)

- [ ] Thêm `CROP_CATEGORIES` vào `API_ENDPOINTS` & `QUERY_KEYS.cropCategories`.
- [ ] `schemaValidatation/cropCategory.ts` — schema response, list query, create body (+ superRefine), update body (+ superRefine), toggle body.
- [ ] `services/cropCategoryService.ts` — list / getById / create / update / toggle.
- [ ] `queries/useCropCategory.ts` — `useCropCategoryList`, `useCropCategoryDetail` (optional), `useCreateCropCategory`, `useUpdateCropCategory`, `useToggleCropCategory` + invalidation.
- [ ] `pages/AdminPage/CropCategories/AdminCropCategoriesPage.tsx` (entry, header, dialog state).
- [ ] `pages/AdminPage/CropCategories/AdminCropCategoryListSection.tsx` (search/filter/table/pagination/row actions).
- [ ] `pages/AdminPage/CropCategories/AdminCropCategoryFormPanel.tsx` (create+update form, dùng `useClearServerFieldErrors`, `handleApiErrorUnprocessentity`, mỗi `Field` có `error` prop).
- [ ] Bổ sung 4 key i18n vào `error-message.ts`.
- [ ] Đăng ký route `/dashboard/admin/crop-categories` với `allowedRoles: ["admin"]`.
- [ ] Thêm sidebar item icon `Sprout`.
- [ ] `pnpm lint && npx tsc -b --noEmit` xanh.
- [ ] Manual test theo Acceptance criteria §11.

---

## 13. Risk & open question

1. **Sai khác BE doc vs BE code (error format):** đã ghi chú ở §2.8. Plan này theo **code thực tế**. Nếu sau này BE đổi global filter, FE phải điều chỉnh `handleApiErrorUnprocessentity`. → Đề xuất verify lại sát release.
2. **`recommended out of range` không có trong BE doc:** đã thấy trong code (`crop-category.model.ts` superRefine). Plan đã include. Nếu BE cập nhật doc, không ảnh hưởng FE.
3. **`OTHER` protection:** plan đang đặt ở FE (UX guard). Nếu sản phẩm yêu cầu bảo vệ cứng → cần đề xuất BE bổ sung (ngoài phạm vi plan này).
4. **Metadata field:** BE nhận JSON tự do; FE ẩn ở MVP. Nếu admin cần (vd. thẻ tag) → plan riêng.
5. **Lookup case của `BACKEND_ERROR_MAP`:** cần verify lookup hiện tại có lowercase hóa hay không (đọc `normalizeErrorText` / `translateBackendMessage`). Nếu không lowercase, dùng key đúng case `Error.CropCategoryCodeAlreadyExists`.

---

*Hết plan. Sau khi sản phẩm duyệt, dev triển khai theo §3 + §12; không sửa BE.*
