# FE Gap Analysis — Crop Category, Crop Density & IoT Coverage

> Phạm vi: phân tích khoảng trống của **frontend web** (`farmos_fe`) so với hai tài liệu backend đã chốt:
> - `farm_os_be/docs/issue_logs/fix_issue_crop_season_flow/crop_density_and_iot_coverage_plan.html`
> - `farm_os_be/docs/issue_logs/fix_issue_crop_season_flow/api_reference_frontend.html`
>
> Tài liệu này **không** đề xuất sửa BE và **không** chứa code FE — chỉ là bản đồ "BE đã có gì → FE đang thiếu gì". Roles trên web: `admin`, `owner`, `manager` (farmer là mobile-only, doctor không có dashboard).
>
> Generated: 2026-05-18

---

## 0. TL;DR — Mức độ tác động

| Hạng mục | Mức độ | Breaking? |
|---|---|---|
| `POST /crop-seasons` nay **bắt buộc** `cropCategoryId` | 🔴 Cao | **CÓ** — form tạo vụ hiện không gửi field này, mọi submit sẽ bị 422 ngay khi BE deploy |
| FE chưa render field `totalAreaSqm` trong form tạo vụ | 🔴 Cao | Không nhập diện tích → không thể validate density được, kéo theo lỗi `Error.CropDensityRequiresAreaAndCount` |
| Toàn bộ trang **Admin Crop Category** chưa tồn tại | 🟠 Trung | Không, nhưng admin không có cách quản lý catalog |
| Field `coverageSqm` / `recommendedMinKits` trên form IoT Kit (admin) | 🟠 Trung | Không (optional), nhưng nếu không nhập thì widget coverage sẽ trả 422 |
| Widget **IoT coverage** trên trang Zone | 🟠 Trung | Không — feature mới hoàn toàn |
| 10+ i18n key mới chưa map trong `error-message.ts` | 🟡 Thấp | Không, sẽ fallback về key thô — UX kém |
| Response `CropSeason` & `IotDeviceKit` có field mới, schema Zod hiện sẽ **strip** silently | 🟡 Thấp | Không runtime crash do schema dùng `z.object` (mặc định không strict), nhưng FE không đọc được snapshot density |

**Ưu tiên triển khai:** (1) chặn breaking ở form CropSeason → (2) Admin CropCategory CRUD → (3) form IoT Kit + widget coverage → (4) i18n & schema response.

---

## 1. Phát hiện theo từng vùng

### 1.1. CropSeason — form tạo / sửa

**Vị trí FE hiện tại**
- Form tạo: [src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx](../src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx)
- Form sửa: `src/pages/ManagerPage/CropSeasons/components/UpdateCropSeasonDialog.tsx`
- Schema: [src/types/cropSeason.ts](../src/types/cropSeason.ts#L26-L110)
- Service: [src/services/cropSeasonService.ts](../src/services/cropSeasonService.ts)
- Query hook: [src/queries/useCropSeason.ts](../src/queries/useCropSeason.ts)

**Gap chi tiết**

| # | Gap | BE expect | FE hiện có |
|---|---|---|---|
| 1.1.1 | `cropCategoryId` **bắt buộc** trong `POST /crop-seasons` | uuid REQ | ❌ Không có trong [CreateCropSeasonBodySchema](../src/types/cropSeason.ts#L68-L81), không có dropdown trong form |
| 1.1.2 | `totalAreaSqm` cần thiết để BE tính density | number > 0 | 🟡 Đã khai báo trong schema ở dòng [78](../src/types/cropSeason.ts#L78) và [103](../src/types/cropSeason.ts#L103) nhưng **không render** trong [CreateCropSeasonScreen.tsx](../src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx#L124-L180) |
| 1.1.3 | Response trả thêm `cropCategoryId`, `minDensitySnapshot`, `maxDensitySnapshot` | nullable number / uuid | ❌ [CropSeasonSchema](../src/types/cropSeason.ts#L26-L50) thiếu 3 field này → Zod strip → FE không hiển thị được snapshot |
| 1.1.4 | UI hint mật độ real-time (✅/⚠ vượt/thiếu) — theo *UI Recipe 1* trong BE doc | helper text + badge | ❌ Chưa có |
| 1.1.5 | Auto-suggest `expectedHarvestDate = plantDate + defaultCycleDays` | client-side hint | ❌ Chưa có; FE đang force "thu hoạch ≥ trồng + 1 tháng" cứng (dòng [42-44](../src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx#L42-L44)) — không nhận biết được cycle theo category |
| 1.1.6 | Cảnh báo cycle nằm ngoài `[0.5×, 2×] defaultCycleDays` trước khi submit | client-side hint | ❌ Chưa có |
| 1.1.7 | Map lỗi 422 → highlight field: `Error.CropDensityAboveMax/BelowMin` → `plantCount`, `Error.CropCycleOutOfDefaultRange` → `expectedHarvestDate`, `Error.CropAreaExceedsZoneArea` → `totalAreaSqm` | path-based mapping | ❌ `handleApiErrorUnprocessentity` (dòng [76-80](../src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx#L76-L80)) chỉ map theo `path` BE gửi; cần verify BE có gửi `path` cho 3 error này không, nếu không phải map thủ công |

**Tác động breaking:** ngay khi BE merge, mọi lần bấm "Tạo mùa vụ" trên `ManagerPage` sẽ trả 422 vì thiếu `cropCategoryId`. Đây là blocker phải fix cùng release với BE.

**Giảm thiểu:** thêm dropdown `cropCategoryId` (required) + input `totalAreaSqm` (required khi muốn validate density); dropdown nguồn từ `GET /crop-categories/active`. BE đã seed `OTHER` cho giống lạ — FE nên đẩy `OTHER` xuống cuối list.

---

### 1.2. Crop Category — Admin CRUD (HOÀN TOÀN THIẾU)

**Vị trí FE đáng lẽ phải có**
- Trang: `src/pages/AdminPage/CropCategories/` — **không tồn tại**
- Service: `src/services/cropCategoryService.ts` — **không có**
- Hook: `src/queries/useCropCategory.ts` — **không có**
- Schema: `src/schemaValidatation/cropCategory.ts` (hoặc `src/types/cropCategory.ts`) — **không có**
- Endpoint constant trong [src/constants/endpoints.ts](../src/constants/endpoints.ts) — **không có** entry `CROP_CATEGORIES`
- Route trong [src/routes/routes.ts](../src/routes/routes.ts) — **không có** path `/dashboard/admin/crop-categories`

**Endpoint BE cần wrap**

| Endpoint | Role | Mục đích FE |
|---|---|---|
| `GET /admin/crop-categories?page&limit&search&isActive` | admin | Trang list quản trị |
| `POST /admin/crop-categories` | admin | Form tạo |
| `PATCH /admin/crop-categories/:id` | admin | Form sửa (không đổi `code`) |
| `PATCH /admin/crop-categories/:id/toggle` | admin | Switch active/inactive |
| `GET /crop-categories/active` | owner, manager | Dropdown trong form CropSeason (1.1.1) |

**Cảnh báo nhỏ:** mặc dù `OTHER` đã được seed sẵn ở BE, FE không nên cho admin **xoá / toggle off** category `OTHER` (sẽ làm vỡ form CropSeason cho giống chưa catalog). Đề xuất: client-side disable nút Toggle khi `code === "OTHER"` (BE chưa lock, tuỳ FE bảo vệ).

---

### 1.3. IoT Kit — form admin

**Vị trí FE hiện tại**
- Form: `src/pages/AdminPage/IotKits/AdminIotKitFormPanel.tsx`
- Schema: `src/schemaValidatation/iotKit.ts`
- Service: [src/services/iotKitService.ts](../src/services/iotKitService.ts)

**Gap chi tiết**

| # | Gap | BE expect | FE hiện có |
|---|---|---|---|
| 1.3.1 | Form admin nhận `coverageSqm` (number > 0) khi create/update kit | optional | ❌ Không có field trong panel form |
| 1.3.2 | Form admin nhận `recommendedMinKits` (int > 0) | optional | ❌ Không có |
| 1.3.3 | Response `IotDeviceKit` trả thêm `coverageSqm`, `recommendedMinKits` | nullable | ❌ Schema `IotDeviceKitResSchema` thiếu 2 field → list/detail không hiển thị được |
| 1.3.4 | Validation `coverageSqm > 0` ở Zod | cần | ❌ Chưa có |

**Tác động:** không breaking, nhưng nếu admin không nhập `coverageSqm` thì widget coverage (mục 1.4) sẽ ném 422 `Error.IotCoverageKitCoverageMissing` → trải nghiệm hỏng. FE nên hiển thị helper text "Bắt buộc nhập nếu muốn dùng tính năng IoT coverage".

---

### 1.4. IoT Coverage Widget — trang Zone (HOÀN TOÀN THIẾU)

**Trạng thái FE**
- Không có component nào tên `IotCoverage*` trong `src/components/`
- Không có hook `useIotCoverage` trong `src/queries/`
- [src/services/zoneService.ts](../src/services/zoneService.ts) không có method `getIotCoverage`
- [src/constants/endpoints.ts](../src/constants/endpoints.ts) không có entry cho `/zones/:id/iot-coverage`
- Không có route Zone detail trong [src/routes/routes.ts](../src/routes/routes.ts)

**Endpoint BE**
```
GET /zones/:id/iot-coverage?kitId=:kitId    (admin, owner, manager)
```
Response: `{ zoneId, zoneAreaSqm, kitId, kitCoverageSqm, requiredKitCount, currentActiveCoverage, activeDeviceCount, gapSqm, status }`

**Phải xây mới (theo UI Recipe 2 trong BE doc)**

| # | Thành phần | Mô tả |
|---|---|---|
| 1.4.1 | `iotCoverageService.ts` | Wrap GET endpoint |
| 1.4.2 | `useIotCoverage(zoneId, kitId)` | React Query hook, key `["iot-coverage", zoneId, kitId]` |
| 1.4.3 | Component `<IotCoverageWidget />` | Gauge `currentActiveCoverage / zoneAreaSqm` |
| 1.4.4 | Status mapping | `sufficient` → xanh ✅, `under_covered` → vàng ⚠ + CTA "Cần thêm `ceil(gapSqm/kitCoverageSqm)` bộ", `unknown` → xám "Zone chưa khai báo diện tích" |
| 1.4.5 | Kit picker | Dropdown từ `GET /iot-kits?isActive=true` để chọn loại kit ước lượng |
| 1.4.6 | Vị trí gắn | Trang chi tiết Zone — hiện FE **không có** trang này, cần thêm (hoặc gắn vào panel Zone trong ManagerPage / OwnerPage) |
| 1.4.7 | Empty state legacy | BE warn: assignment cũ có `coverageSqmSnapshot = null` không cộng dồn. Widget phải hiển thị note "Một số thiết bị cũ chưa có dữ liệu phủ — liên hệ admin để backfill" khi `activeDeviceCount > 0` nhưng `currentActiveCoverage === 0` |

---

### 1.5. Error i18n map

**Vị trí:** `src/lib/error-message.ts` — `BACKEND_ERROR_MAP` (dòng 8–414).

**Key thiếu (11)**

| # | Key BE | HTTP | UI gợi ý (VI) |
|---|---|---|---|
| 1 | `Error.CropCategoryNotFound` | 404 | Không tìm thấy loại cây trồng. |
| 2 | `Error.CropCategoryCodeAlreadyExists` | 422 | Mã loại cây đã tồn tại. |
| 3 | `Error.CropCategoryMinDensityExceedsMax` | 422 | Mật độ tối thiểu phải ≤ mật độ tối đa. |
| 4 | `Error.CropDensityBelowMin` | 422 | Mật độ cây trồng thấp hơn ngưỡng cho phép. |
| 5 | `Error.CropDensityAboveMax` | 422 | Mật độ cây trồng vượt ngưỡng cho phép. |
| 6 | `Error.CropDensityRequiresAreaAndCount` | 422 | Vui lòng nhập đủ diện tích và số cây. |
| 7 | `Error.CropCycleOutOfDefaultRange` | 422 | Chu kỳ vụ nằm ngoài khoảng cho phép của loại cây. |
| 8 | `Error.IotKitNotFound` | 404 | Không tìm thấy bộ kit IoT. *(map hiện có `error.iotkitnotfound` ở dòng 318 — cần verify exact key BE gửi)* |
| 9 | `Error.IotCoverageZoneAreaMissing` | 422 | Khu vực chưa cấu hình diện tích. |
| 10 | `Error.IotCoverageKitCoverageMissing` | 422 | Kit chưa cấu hình diện tích bao phủ. |
| 11 | `Error.IotCoverageInsufficient` | 422 | Độ phủ IoT chưa đủ cho zone. |

**Nguy cơ casing:** map hiện tại dùng key chữ thường (`error.iotkitnotfound`), BE doc viết `Error.IotKitNotFound`. Cần kiểm tra trong `error-message.ts` xem lookup có case-insensitive không — nếu không, mọi key mới phải thêm theo đúng case BE gửi.

---

### 1.6. Routes & role gating

**Hiện tại (tham chiếu [src/routes/routes.ts](../src/routes/routes.ts)):**
- ✅ `/dashboard/manager/crop-seasons` — manager-only
- ✅ `/dashboard/owner/crop-seasons` — owner
- ✅ `/dashboard/admin/iot-kits` — admin
- ✅ `/dashboard/owner/iot-kits` — owner
- ❌ Không có route Zone detail
- ❌ Không có route `/dashboard/admin/crop-categories`

**Cần thêm**

| Route | Allowed roles | Mục đích |
|---|---|---|
| `/dashboard/admin/crop-categories` | `admin` | List + CRUD (mục 1.2) |
| `/dashboard/admin/crop-categories/:id` (hoặc dialog) | `admin` | Detail / edit |
| `/dashboard/{manager,owner}/zones/:id` (hoặc reuse Zone panel) | `admin, owner, manager` | Hiển thị `<IotCoverageWidget />` (mục 1.4) |

Không nên expose CRUD CropCategory cho owner/manager — họ chỉ cần endpoint `/crop-categories/active` để render dropdown.

---

## 2. Risk & ordering

```
[BLOCKER]   1.1.1 + 1.1.2  ────► phải merge cùng / trước BE deploy
[HIGH]      1.5            ────► map error mới, tránh user thấy raw key
[HIGH]      1.1.3 + 1.3.3  ────► mở rộng schema response (zod) để không strip field
[MEDIUM]    1.2            ────► admin CRUD CropCategory
[MEDIUM]    1.3.1/1.3.2    ────► form IoT Kit field mới
[MEDIUM]    1.4            ────► widget coverage (feature mới)
[LOW]       1.1.4-1.1.6    ────► UX hint real-time (nice-to-have, BE đã validate)
[LOW]       1.4.7          ────► empty state cho legacy assignment
```

---

## 3. Điểm cần xác nhận với BE / PM (không cần sửa BE — chỉ làm rõ)

1. **`Error.*` casing:** BE thực sự gửi `Error.CropDensityAboveMax` hay `error.cropdensityabovemax`? Ảnh hưởng đến cách bổ sung map ở 1.5.
2. **`path` field trong 422:** với `Error.CropDensityAboveMax`, BE doc ghi `path: "plantCount"`. Cần xác nhận có cả case `path: "totalAreaSqm"` hoặc chỉ một path duy nhất, để FE biết highlight field nào.
3. **`OTHER` category protection:** BE có chặn admin toggle `OTHER` không? Nếu không, FE cần tự bảo vệ (mục 1.2).
4. **Backfill legacy assignment `coverageSqmSnapshot`:** có admin tool nào hay phải dùng SQL trực tiếp? Ảnh hưởng đến CTA của widget (mục 1.4.7).
5. **Trang Zone detail:** sản phẩm có muốn route mới `/zones/:id` hay nhúng widget vào panel Zone hiện hữu (manager/owner home)? Quyết định kiến trúc của 1.4.

---

*Hết tài liệu. Mọi đề xuất ở đây thuộc phạm vi FE, không động chạm contract BE đã chốt trong `api_reference_frontend.html`.*
