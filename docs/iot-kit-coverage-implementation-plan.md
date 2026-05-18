# Implementation Plan — §1.3 IoT Kit form (admin) & §1.4 IoT Coverage Widget

> Phạm vi: phần **1.3** và **1.4** trong [crop-density-iot-coverage-gap-analysis.md](crop-density-iot-coverage-gap-analysis.md).
> Nguồn BE: `farm_os_be/docs/issue_logs/fix_issue_crop_season_flow/api_reference_frontend.html` (mục `#kit-shape`, `#kit-create`, `#cov-zone`).
> Đây là **plan**, không kèm code. Sinh ngày 2026-05-19.

---

## 0. Bối cảnh thực tế (đã verify bằng đọc file)

State hiện tại — đối chiếu lại với gap doc:

| Item | Gap doc nói | Thực tế trong code |
|---|---|---|
| `IotDeviceKitResSchema` thiếu `coverageSqm` / `recommendedMinKits` | strip silently | ✅ đúng — [src/schemaValidatation/iotKit.ts:36-53](../src/schemaValidatation/iotKit.ts#L36-L53) không có 2 field |
| `CreateIotKitBodySchema` thiếu 2 field | — | ✅ đúng — [src/schemaValidatation/iotKit.ts:96-132](../src/schemaValidatation/iotKit.ts#L96-L132) là `.strict()`, sẽ reject nếu FE gửi field không khai báo trong schema |
| `UpdateIotKitBodySchema` thiếu 2 field | — | ✅ đúng — [src/schemaValidatation/iotKit.ts:135-157](../src/schemaValidatation/iotKit.ts#L135-L157) cũng `.strict()` |
| Form admin IoT Kit không có field coverage | — | ✅ đúng — [src/pages/AdminPage/IotKits/AdminIotKitFormPanel.tsx](../src/pages/AdminPage/IotKits/AdminIotKitFormPanel.tsx) chỉ có code/name/price/board/sensors/modules/deviceCount/thumbnail |
| Route Zone detail | — | ⚠ phát hiện thêm: **không có** trang Zone detail nào — `ZONES.DETAIL(id)` đã có ở [endpoints.ts:438](../src/constants/endpoints.ts#L438) và `zoneService.getDetail` đã wrap ở [zoneService.ts:51](../src/services/zoneService.ts#L51), nhưng không có route/page tiêu thụ. Manager/Owner render Zone như selector hoặc card thumbnail, không có trang dành riêng. |
| Endpoint IoT coverage | — | ✅ đúng — chưa có entry nào trong [endpoints.ts](../src/constants/endpoints.ts) |
| i18n key cho coverage / zone | gap doc 1.5 liệt 11 key | ⚠ phần Crop đã được merge ở [error-message.ts:317-333](../src/lib/error-message.ts#L317-L333) trong batch §1.1; còn **thiếu** 3 key coverage và 1 key zone (xem §4 bên dưới) |
| Pattern "active list" cho dropdown kit picker | — | ℹ có sẵn `useActiveCropCategoryList` ([src/queries/useCropCategory.ts](../src/queries/useCropCategory.ts)) làm mẫu; kit có thể tái dùng `useAdminIotKits({ isActive: true })` ([useIotKit.ts:19-28](../src/queries/useIotKit.ts#L19-L28)) — không cần wrap mới |
| Pattern widget KPI | — | ℹ có `KpiCard` ([src/components/common/KpiCard.tsx](../src/components/common/KpiCard.tsx)) và `IotQuotaWidget` ([src/components/common/IotQuotaWidget.tsx](../src/components/common/IotQuotaWidget.tsx)) làm mẫu layout |

**Tác động:**
- §1.3 **không breaking** — `coverageSqm` / `recommendedMinKits` đều optional trong BE doc. Nếu FE không gửi → kit vẫn create được nhưng widget §1.4 sẽ trả 422 `Error.IotCoverageKitCoverageMissing` khi user chọn kit này → trải nghiệm vỡ.
- §1.4 hoàn toàn là **feature mới**, không có code FE nào hiện tại bị tác động. Quyết định kiến trúc lớn: **gắn widget vào đâu**, vì không có trang Zone detail.

---

## 1. Mục tiêu

Sau khi xong:

1. Admin tạo/sửa được kit **kèm** `coverageSqm` (m²/bộ) và `recommendedMinKits` (số bộ tối thiểu khuyến nghị) — input validate ngay tại Zod, BE response cũng parse được 2 field này để hiển thị trên list/detail.
2. Manager / Owner / Admin có thể **kiểm tra độ phủ IoT** của một zone: chọn loại kit → thấy zone đang phủ bao nhiêu m² / thiếu bao nhiêu / cần thêm bao nhiêu bộ.
3. Empty state legacy: assignment cũ có `coverageSqmSnapshot = null` không cộng dồn → widget phải có note rõ ràng, không để user nhầm "phủ = 0" mặc dù có thiết bị active.
4. Lỗi 422/404 từ coverage API map sang câu tiếng Việt thân thiện (xem §5).
5. Không breaking flow hiện tại của marketplace, purchase, order, assignment.

---

## 2. Task list

### 2.1. Mở rộng Zod schema cho IoT Kit
*File:* [src/schemaValidatation/iotKit.ts](../src/schemaValidatation/iotKit.ts)

- `IotDeviceKitResSchema` (dòng [36-53](../src/schemaValidatation/iotKit.ts#L36-L53)) bổ sung:
  - `coverageSqm: z.number().positive().nullable()` — BE doc trả `number` khi có, `null` khi admin chưa cấu hình
  - `recommendedMinKits: z.number().int().positive().nullable()` — int|null
- `CreateIotKitBodySchema` (dòng [96-132](../src/schemaValidatation/iotKit.ts#L96-L132)) thêm 2 field **optional**:
  - `coverageSqm: z.number().positive("Diện tích bao phủ phải lớn hơn 0.").optional()`
  - `recommendedMinKits: z.number().int("Số bộ tối thiểu phải là số nguyên.").positive("Số bộ tối thiểu phải lớn hơn 0.").optional()`
- `UpdateIotKitBodySchema` (dòng [135-157](../src/schemaValidatation/iotKit.ts#L135-L157)) thêm:
  - `coverageSqm: z.number().positive().nullable().optional()` (cho phép null để clear)
  - `recommendedMinKits: z.number().int().positive().nullable().optional()`
- **Không** thêm field mới ở `AvailableSlotItemSchema` / `OwnerKitOrderTrackingSchema` (BE doc không nói tracking trả coverage; nếu sau này có, là task riêng).

### 2.2. Thêm field trên form admin
*File:* [src/pages/AdminPage/IotKits/AdminIotKitFormPanel.tsx](../src/pages/AdminPage/IotKits/AdminIotKitFormPanel.tsx)

Vị trí gắn: sau field **"Số bộ trong 1 SKU"** (dòng [311-327](../src/pages/AdminPage/IotKits/AdminIotKitFormPanel.tsx#L311-L327)), trước **"Thumbnail URL"** — để gom cluster cấu hình kỹ thuật.

- Field **"Diện tích bao phủ (m²)"** — `coverageSqm`:
  - `type="number"`, `min={1}`, `step="0.01"`, `valueAsNumber: true`
  - Helper text: *"Mỗi bộ kit này phủ được bao nhiêu m². Bắt buộc nhập nếu muốn tính năng kiểm tra độ phủ IoT của khu vực hoạt động."* (không dùng từ "IoT coverage API", tránh chuyên ngành)
  - `defaultValues`: `kit?.coverageSqm ?? undefined` (không pre-fill 0)
- Field **"Số bộ tối thiểu khuyến nghị"** — `recommendedMinKits`:
  - `type="number"`, `min={1}`, `valueAsNumber: true`
  - Helper text: *"Tuỳ chọn. Hệ thống dùng giá trị này để gợi ý số bộ tối thiểu thay vì tự tính theo diện tích."*
  - `defaultValues`: `kit?.recommendedMinKits ?? undefined`
- Cập nhật `defaultValues` memo (dòng [81-94](../src/pages/AdminPage/IotKits/AdminIotKitFormPanel.tsx#L81-L94)) thêm 2 field.
- Submit (dòng [109-132](../src/pages/AdminPage/IotKits/AdminIotKitFormPanel.tsx#L109-L132)) **không cần đổi** — RHF + Zod đã bắt sẵn.
- **Edge case empty input**: RHF `valueAsNumber` với input rỗng → `NaN`. Vì cả 2 field optional, cần strip NaN trước khi submit (chuyển sang `undefined`). Pattern: thêm `transform` ở `getValues` hoặc dùng setter helper trong `onSubmit` (giống cách [CreateCropSeasonScreen.tsx][1] xử lý).

### 2.3. Hiển thị 2 field mới trong list/detail kit (admin & owner marketplace)

Mục đích: đã mở rộng schema response thì cần render, nếu không user không thấy được giá trị mình vừa nhập.

- **Admin kit list/detail** — tìm trong [src/pages/AdminPage/IotKits/](../src/pages/AdminPage/IotKits/) component render từng kit (card / row), thêm 2 row info:
  - "Diện tích bao phủ: `{coverageSqm} m²/bộ`" hoặc "*Chưa cấu hình*" nếu null
  - "Khuyến nghị tối thiểu: `{recommendedMinKits} bộ`" — chỉ hiện khi != null
- **Owner marketplace** (`src/pages/OwnerPage/IotKits/`) hiển thị `coverageSqm` để owner so sánh khi mua (theo BE doc: "Bắt buộc nếu muốn dùng IoT coverage").
- Không đụng vào Tracking / Order page (BE chưa trả 2 field này ở các shape đó).

### 2.4. Thêm endpoint constant + service + hook cho IoT coverage
*File:* [src/constants/endpoints.ts](../src/constants/endpoints.ts) — thêm vào block `ZONES` (sau dòng [454](../src/constants/endpoints.ts#L454)):

```
IOT_COVERAGE: (zoneId: string) => `/zones/${zoneId}/iot-coverage`,
```

*File:* [src/services/zoneService.ts](../src/services/zoneService.ts) — thêm method `getIotCoverage(zoneId, kitId?)`:
- Build URL với `query-string` (giống pattern `listByFarm`); chỉ append `kitId` khi truthy.
- Trả `api.get<IotCoverageResType>(...)`.

*File:* `src/schemaValidatation/iotCoverage.ts` — **mới**:
- `IotCoverageStatusEnum = z.enum(["sufficient", "under_covered", "unknown"])`
- `IotCoverageResSchema`:
  - `zoneId: z.string().uuid()`
  - `zoneAreaSqm: z.number().nullable()` — null khi zone chưa cấu hình area
  - `kitId: z.string().uuid().nullable()` — null khi caller không truyền kitId
  - `kitCoverageSqm: z.number().nullable()` — null khi kit chưa có coverage hoặc không truyền kitId
  - `requiredKitCount: z.number().int().nullable()` — null nếu thiếu data để tính
  - `currentActiveCoverage: z.number()` — Σ snapshot active
  - `activeDeviceCount: z.number().int()`
  - `gapSqm: z.number()` — `max(0, zoneArea - currentCoverage)`, BE trả 0 nếu zoneArea null
  - `status: IotCoverageStatusEnum`
- Type export: `IotCoverageResType`.

*File:* `src/queries/useIotCoverage.ts` — **mới**:
- Query key: `QUERY_KEYS.iotCoverage.byZone(zoneId, kitId)` — thêm vào `src/constants/queryKeys.ts`
- Hook `useIotCoverage(zoneId, kitId, enabled)`:
  - `enabled = !!zoneId && enabled`
  - `staleTime` ngắn (30s) vì dữ liệu phụ thuộc trạng thái assignment thay đổi
  - `retry: false` cho 404 zone/kit không tồn tại (giống `useMyIotQuota` [useIotKit.ts:181](../src/queries/useIotKit.ts#L181))

### 2.5. Hook "active kits" cho dropdown picker

Dropdown chọn loại kit để ước lượng — không cần wrap thêm hook, **tái dùng** `useAdminIotKits({ isActive: true, page: 1, limit: 200, sortBy: "name", sortOrder: "asc" })` ([useIotKit.ts:19-28](../src/queries/useIotKit.ts#L19-L28)).

⚠ Tuy nhiên endpoint `ADMIN_LIST` chỉ dành cho **admin role**. Manager / Owner cần endpoint khác:
- Owner đã có `useOwnerIotKits` ([useIotKit.ts:123-132](../src/queries/useIotKit.ts#L123-L132)) → `/owner/iot-kits`.
- Manager **chưa có** endpoint kit list nào trong [endpoints.ts](../src/constants/endpoints.ts). BE doc widget này nói `Roles: admin, owner, manager` cho `GET /zones/:id/iot-coverage`, nhưng không nêu endpoint kit-list cho manager.

**Quyết định:** trong scope plan này, FE giả định manager có thể dùng **chính `ownerIotKitService.list`** (cùng farm) hoặc một endpoint công khai `/iot-kits/active`. Cần confirm với BE (xem §6 — Open question). Tạm thời UI manager hiển thị widget ở dạng **read-only không có kit picker** (chỉ trả `currentActiveCoverage` / `zoneAreaSqm` / `status`, không có `requiredKitCount`) — không gọi với `kitId`.

### 2.6. Component `<IotCoverageWidget />`
*File:* `src/components/common/IotCoverageWidget.tsx` — **mới**.

**Props:**
- `zoneId: string` (required)
- `defaultKitId?: string` — preselect (admin/owner có quyền chọn kit)
- `showKitPicker?: boolean` — admin/owner: true; manager: false (theo §2.5)
- `kitOptions?: IotDeviceKitResType[]` — caller bơm vào (đã filter active + có `coverageSqm`)
- `compact?: boolean` — true khi nhúng vào card nhỏ trên dashboard

**Layout (theo UI Recipe 2 trong BE doc):**

```
┌─ Card: "Độ phủ IoT" ──────────────────────────┐
│ [Kit picker nếu showKitPicker]                │
│                                               │
│ [Progress bar: currentActiveCoverage / zoneAreaSqm]
│                                               │
│ ┌─ KpiCard grid 2×2 (compact 1×4) ──────┐     │
│ │ Diện tích zone   | Đang phủ           │     │
│ │ {zoneAreaSqm} m² | {currentActive} m² │     │
│ │ ─────────────────────────────────────  │     │
│ │ Còn thiếu         | Bộ thiết bị active │     │
│ │ {gapSqm} m²       | {activeDeviceCount}│     │
│ └────────────────────────────────────────┘     │
│                                               │
│ [Status badge: ✅/⚠/❔]                       │
│ [CTA: "Cần thêm N bộ"] — nếu under_covered    │
│ [Empty state: legacy snapshot null] — note    │
└───────────────────────────────────────────────┘
```

**Status semantics (theo BE doc bảng dòng 480-485):**

| `status` | Hiển thị | CTA |
|---|---|---|
| `sufficient` | Badge xanh "✓ Đã đủ độ phủ" | Không CTA |
| `under_covered` | Badge vàng "⚠ Chưa đủ độ phủ" | Khi có `kitCoverageSqm`: "Cần thêm `Math.ceil(gapSqm / kitCoverageSqm)` bộ". Khi không có kit picked: "Chọn loại kit để ước tính số bộ cần thêm" |
| `unknown` | Badge xám "❔ Khu vực chưa khai báo diện tích" | Link "Cập nhật diện tích khu vực" (đến trang Zone edit hiện hữu) |

**Empty state cho legacy assignment** (gap doc §1.4.7):
- Trigger khi: `activeDeviceCount > 0` && `currentActiveCoverage === 0` && `status !== "unknown"`.
- Hiển thị note xám nhỏ: *"Một số thiết bị đang hoạt động chưa có dữ liệu diện tích phủ. Vui lòng liên hệ quản trị viên để cập nhật."* — không tô màu cảnh báo, tránh đánh đồng với under_covered.

**Loading state:** Skeleton 4 ô KpiCard + progress bar (theo pattern `IotQuotaWidget`).

**Error state:**
- 404 zone không tồn tại → empty state "Không tìm thấy khu vực" (không hiển thị skeleton mãi).
- 422 (kit không có coverage) → giữ KpiCard nhưng disable nút CTA, hiển thị note đỏ "Bộ kit này chưa được cấu hình diện tích phủ."
- Lỗi khác → fallback `onMutationError`.

### 2.7. Tích hợp widget vào trang nào

Đây là **quyết định kiến trúc** lớn nhất của §1.4. Không có trang Zone detail. 3 lựa chọn:

**Lựa chọn A — tạo route Zone detail mới** (gap doc đề xuất):
- Route `/dashboard/{manager,owner}/zones/:id` → page chứa `<IotCoverageWidget />` + có thể mở rộng sau.
- Pro: clean, đúng URL bookmarkable.
- Con: phải làm thêm route + page shell, breadcrumb, role guard, các nguồn dẫn link vào.

**Lựa chọn B — nhúng vào trang đã có** (nhanh nhất):
- Manager: thêm vào [ManagerCropSeasonsPage.tsx](../src/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage.tsx) bên cạnh zone selector — khi user chọn zone → widget cập nhật theo `selectedZone.id`.
- Owner: thêm vào `OwnerPage/Farm/ZonesPane.tsx` dưới dạng card mở rộng khi click vào 1 zone.
- Admin: tạm thời chưa cần — admin không quản lý cụ thể từng zone qua dashboard hiện tại.
- Pro: 0 thay đổi route, user thấy widget ngay ở luồng công việc hiện tại.
- Con: lệ thuộc context page, khó deeplink.

**Lựa chọn C — dialog/sheet trigger từ Zone row**:
- Mỗi zone trong list có nút "Xem độ phủ IoT" mở dialog chứa widget.
- Pro: không tốn route, dùng được từ nhiều entry point.
- Con: dialog không bookmark được, UX cồng kềnh nếu user check nhiều zone.

**Đề xuất:** **Lựa chọn B** cho rev đầu (ship nhanh, FE đã đụng cả 2 trang ManagerCropSeasonsPage + ZonesPane trong §1.1), nâng cấp lên A sau nếu PM yêu cầu route riêng. Manager dùng widget không picker, owner có picker.

---

## 3. Dependencies & ordering

```
2.1 (schema) ─┬─► 2.2 (form admin) ─► test create/update kit
              └─► 2.3 (hiển thị list/detail)

2.4 (endpoint + service + hook) ──┐
2.5 (kit picker data source) ─────┼─► 2.6 (widget) ─► 2.7 (tích hợp)
2.1 (vì kit type được kit picker dùng) ┘
```

Ship được theo 2 PR:
- **PR-1:** §2.1 + §2.2 + §2.3 — không phụ thuộc widget, ship được ngay khi BE deploy field mới.
- **PR-2:** §2.4 → §2.7 — feature widget, sau khi BE deploy endpoint coverage.

§5 (i18n) ship cùng PR-2 (lỗi coverage chỉ xuất hiện khi widget gọi API).

---

## 4. Test plan

### Form admin IoT Kit (§2.1–2.3)
- [ ] Tạo kit mới không nhập `coverageSqm` / `recommendedMinKits` → PASS (cả 2 optional, BE accept).
- [ ] Tạo kit nhập `coverageSqm = 600`, `recommendedMinKits = 3` → request body chứa đủ 2 field, response parse được.
- [ ] Tạo kit nhập `coverageSqm = 0` hoặc âm → Zod chặn ngay với message "Diện tích bao phủ phải lớn hơn 0."
- [ ] Tạo kit nhập `recommendedMinKits = 1.5` → Zod chặn "Số bộ tối thiểu phải là số nguyên."
- [ ] Edit kit đang có coverage = 600 → field pre-fill đúng 600, sửa thành 800 → PATCH thành công.
- [ ] Edit kit clear coverage (input rỗng) → BE doc không nói clear-by-null cho `PATCH`; **lựa chọn FE:** giữ giá trị cũ (không submit field nếu input rỗng). Nếu sau này BE accept null, mở thêm UI "Xoá cấu hình".
- [ ] List/detail kit hiển thị đúng 2 field, "Chưa cấu hình" cho null.

### Widget IoT Coverage (§2.4–2.7)
- [ ] Zone có `zoneAreaSqm = 2400`, đã có 3 device active phủ 1800 m², kit picked có `kitCoverageSqm = 600` → status `under_covered`, gap 600, CTA "Cần thêm 1 bộ".
- [ ] Zone có currentActive ≥ zoneArea → status `sufficient`, badge xanh, không CTA.
- [ ] Zone chưa cấu hình area → status `unknown`, badge xám, link cập nhật area.
- [ ] Kit chưa có `coverageSqm` (truyền kitId nhưng `kitCoverageSqm = null`) → KpiCard vẫn render currentActive/zoneArea, CTA thay bằng note đỏ "Bộ kit chưa được cấu hình diện tích phủ".
- [ ] Không truyền kitId → widget render KpiCard 2 ô (zone area, currentActive) + status, không có "Cần thêm N bộ".
- [ ] Legacy assignment: `activeDeviceCount = 3` && `currentActiveCoverage = 0` && `status = under_covered` → note "Một số thiết bị… liên hệ quản trị viên".
- [ ] Manager role: widget không hiển thị kit picker (showKitPicker=false).
- [ ] Owner role: widget có dropdown từ `useOwnerIotKits({ isActive: true })`, default pick kit đầu tiên có `coverageSqm != null`.
- [ ] 404 zone không tồn tại → empty state.
- [ ] Refetch khi `kitId` thay đổi (query key chứa kitId).

### i18n
- [ ] Submit form với BE trả `Error.IotCoverageZoneAreaMissing` → toast tiếng Việt theo §5 (không hiện key thô).
- [ ] Bấm widget với kit chưa có coverage → 422 `Error.IotCoverageKitCoverageMissing` → note đỏ tiếng Việt.

---

## 5. i18n keys cần thêm
*File:* [src/lib/error-message.ts](../src/lib/error-message.ts) — chèn vào block "IoT Kit Add-on" (sau dòng [350](../src/lib/error-message.ts#L350)) hoặc mở block mới "IoT Coverage".

| Key (lowercase, theo `normalizeMessage`) | UI tiếng Việt (thân thiện) |
|---|---|
| `error.zonenotfound` | Không tìm thấy khu vực. Có thể khu vực đã bị xoá hoặc bạn không có quyền truy cập. |
| `error.iotcoveragezoneareamissing` | Khu vực chưa khai báo diện tích. Vui lòng cập nhật thông tin khu vực trước khi tính độ phủ IoT. |
| `error.iotcoveragekitcoveragemissing` | Bộ kit chưa được cấu hình diện tích phủ. Vui lòng liên hệ quản trị viên hoặc chọn bộ kit khác. |
| `error.iotcoverageinsufficient` | Số kit hiện không đủ phủ toàn bộ khu vực. Hệ thống đã gợi ý số bộ cần thêm. |

⚠ Gap doc §1.5 nhắc đến `Error.IotKitNotFound` — đã có sẵn (lowercase `"error.iotkitnotfound"` ở [error-message.ts:336](../src/lib/error-message.ts#L336)), bỏ qua.

⚠ Hiện tại có entry cũ `"zone not found."` ở khoảng dòng 91 (theo Explore report) — để **fallback an toàn**, giữ cả 2 key (cũ và mới `error.zonenotfound`), không xoá.

---

## 6. Risks & open questions

1. **Endpoint kit-list cho manager:** BE doc không nêu manager có endpoint nào lấy danh sách kit để picker. Cần confirm:
   - (a) manager dùng được `/owner/iot-kits` không? hoặc
   - (b) cần tạo `/iot-kits/active` công khai cho admin/owner/manager?
   - **Mitigation:** rev đầu, manager nhận widget không có kit picker (no `kitId` query) — vẫn hiển thị đủ zoneArea / currentActive / status. Owner/Admin có picker đầy đủ.

2. **PATCH clear coverage value:** BE doc cho `coverageSqm` ở `POST` là `number > 0`, không nói rõ `PATCH` accept `null` để clear. FE plan **không expose** UI clear ở rev đầu — input rỗng = "không sửa". Confirm với BE nếu cần.

3. **Edge: snapshot lifecycle.** BE doc note: *"Sửa kit catalog sau đó không thay đổi snapshot"* — nghĩa là admin update `coverageSqm` của kit cũ → các assignment đã active vẫn dùng snapshot cũ → widget `currentActiveCoverage` không thay đổi ngay. **FE không cần xử lý đặc biệt**, nhưng nên ghi note nhỏ ở phần help của field coverage trong form admin: *"Giá trị này chỉ áp dụng cho các lần lắp đặt sau. Thiết bị đã lắp giữ nguyên cấu hình tại thời điểm gán."* — giảm hiểu nhầm.

4. **Lựa chọn tích hợp (§2.7):** B nhanh nhất nhưng coupling. Quyết định cuối cùng phụ thuộc PM. Plan này mặc định B; nếu chọn A, scope §2.7 phình ra (thêm route, page shell, breadcrumb).

5. **Refresh sau assign/unassign device:** widget data thay đổi khi user gán/gỡ device IoT. Cần invalidate `QUERY_KEYS.iotCoverage.byZone(zoneId, *)` trong mutation gán/gỡ device. Nếu mutation đó không ở scope này, để TODO marker hoặc invalidate trong PR-2 tail.

6. **Backfill legacy snapshot:** gap doc §1.4.7 nêu BE chưa có admin tool backfill. FE chỉ hiển thị note "liên hệ quản trị viên". Nếu sau này BE có endpoint backfill, mở task riêng.

---

## 7. Out of scope (không làm trong plan này)

- Trang Zone detail full-feature (chỉ làm phần widget gắn vào trang sẵn có).
- Trang admin "IoT coverage báo cáo tổng" cross-zone.
- Sửa schema `OwnerKitOrderTrackingSchema` / `AvailableSlotItemSchema` để cộng thêm 2 field — BE doc không bảo trả ở các shape này.
- Endpoint `/iot-kits/active` công khai (nếu BE bổ sung sau, làm task riêng).
- Migration UI cho legacy assignment.
- Widget gauge dạng circular SVG — rev đầu dùng linear progress bar đơn giản (đã có `Progress` component).

---

[1]: ../src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx
