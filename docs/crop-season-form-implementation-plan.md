# Implementation Plan — §1.1 CropSeason form tạo / sửa

> Phạm vi: chỉ phần **1.1** trong [crop-density-iot-coverage-gap-analysis.md](crop-density-iot-coverage-gap-analysis.md).
> Nguồn BE: `farm_os_be/docs/issue_logs/fix_issue_crop_season_flow/{api_reference_frontend.html, crop_density_and_iot_coverage_plan.html}`.
> Đây là **plan**, không kèm code. Sinh ngày 2026-05-19.

---

## 0. Bối cảnh thực tế (đã verify bằng đọc file)

State hiện tại — đối chiếu lại với gap doc:

| Item | Gap doc nói | Thực tế trong code |
|---|---|---|
| `cropCategoryId` trong `CreateCropSeasonBodySchema` | thiếu | ✅ đúng — [src/types/cropSeason.ts:68-81](../src/types/cropSeason.ts#L68-L81) không có field |
| `totalAreaSqm` trong schema | "khai báo nhưng không render" | ✅ đúng — schema dòng [78](../src/types/cropSeason.ts#L78), nhưng [CreateCropSeasonScreen.tsx](../src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx) không có `<Input>` cho nó |
| `plantCount` render | — | ⚠ phát hiện thêm: đã render ở [dòng 170-176](../src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx#L170-L176), nhưng vì `totalAreaSqm` thiếu nên BE sẽ không tính được density |
| Rule "harvest ≥ plant + 1 tháng" | — | ⚠ phát hiện thêm: hard-code trong [helpers.ts validateCropSeasonFormDates dòng 77-81](../src/pages/ManagerPage/CropSeasons/components/helpers.ts#L77-L81) **và** trong UI helper text dòng 183 — sẽ chặn các category cycle ngắn (xà lách 45 ngày) hợp lệ theo BE |
| `CropSeasonSchema` thiếu 3 field mới | strip silently | ✅ đúng — [src/types/cropSeason.ts:26-50](../src/types/cropSeason.ts#L26-L50) |
| `useCreateCropSeason` toast khi success | — | ℹ note: hook [useCropSeason.ts:49-64](../src/queries/useCropSeason.ts#L49-L64) đã có toast, không cần đụng |
| `cropSeasonService.create` convert date → ISO | — | ℹ [cropSeasonService.ts:17-27](../src/services/cropSeasonService.ts#L17-L27) đã làm `toISO`. BE doc dùng cả 2 format (`"2026-09-01"` và `"2026-09-01T00:00:00.000Z"`) → giữ nguyên. |

**Tác động breaking tổng kết:** ngay khi BE deploy, mọi submit "Tạo mùa vụ" trên ManagerPage → 422 vì thiếu `cropCategoryId`. Update dialog không breaking (`cropCategoryId` không có trong PATCH body theo BE doc — chỉ density/cycle re-validate khi sửa `totalAreaSqm` / `plantCount` / `plantDate` / `expectedHarvestDate`).

---

## 1. Mục tiêu

Sau khi xong:

1. Form tạo gửi đúng payload BE expect (`cropCategoryId`, `totalAreaSqm`, `plantCount` nếu có).
2. Form sửa (dialog) cũng có `totalAreaSqm` field (để re-validate density khi vụ ở `planning`).
3. UX: user thấy mật độ chuẩn + cycle gợi ý trước khi submit, biết lỗi real-time trước khi bấm.
4. Response schema không strip 3 field mới, detail view hiển thị được snapshot.
5. Server error 422 từ density/cycle map đúng field highlight.

**Không trong phạm vi (làm ở plan riêng):** Admin CropCategory CRUD (§1.2), IoT kit (§1.3), coverage widget (§1.4), full i18n map (§1.5), Zone detail route (§1.6). Chỉ phụ thuộc 1 thứ duy nhất từ §1.2: endpoint `GET /crop-categories/active` — task 2.1 ở dưới sẽ wrap riêng để không block.

---

## 2. Task list (theo thứ tự đề xuất)

### 2.1. Tạo type + service tối thiểu cho `/crop-categories/active`

> Đủ để form CropSeason dùng. Không động vào Admin CRUD (sẽ làm ở plan §1.2).

| File | Hành động |
|---|---|
| `src/types/cropCategory.ts` (mới) | Định nghĩa `CropCategorySchema` (id, code, name, scientificName?, description?, minPlantingDensity, maxPlantingDensity, recommendedDensity?, defaultCycleDays?, minAreaSqm?, isActive, metadata?, createdAt, updatedAt). Tất cả Decimal field BE trả `number` (xem §2 BE doc), nên dùng `z.number()`. Export `ActiveCropCategoryListResSchema = z.object({ data: z.array(CropCategorySchema) })`. |
| `src/services/cropCategoryService.ts` (mới) | `listActive()` → `GET /crop-categories/active`. Không paginate. |
| `src/queries/useCropCategory.ts` (mới) | `useActiveCropCategories()` — `useQuery` key `["crop-categories", "active"]`, `staleTime` ~5 phút (catalog ít đổi). |
| [src/constants/endpoints.ts](../src/constants/endpoints.ts) | Thêm namespace `CROP_CATEGORY` (chỉ entry `ACTIVE: "/crop-categories/active"` trước; phần admin CRUD để plan §1.2 thêm sau). |

**Lý do tách:** task này chỉ tạo "consumer side" — admin page làm sau không ảnh hưởng. Sort `OTHER` xuống cuối list khi render (BE seed có code `OTHER`).

---

### 2.2. Mở rộng schema CropSeason (request + response)

File: [src/types/cropSeason.ts](../src/types/cropSeason.ts)

- `CropSeasonSchema` (dòng 26-50): thêm `cropCategoryId: z.string().uuid().nullable()`, `minDensitySnapshot: z.number().nullable()`, `maxDensitySnapshot: z.number().nullable()`. Cả 3 đặt nullable vì BE doc ghi nullable + data cũ chưa backfill thì FE vẫn parse được.
- `CreateCropSeasonBodySchema` (dòng 68-81):
  - Thêm `cropCategoryId: z.string().uuid("Vui lòng chọn loại cây trồng")` — **required**.
  - Đổi `totalAreaSqm` từ `optional()` → `positive("Diện tích phải > 0")` **required** (BE không bắt buộc trong contract, nhưng nếu thiếu thì BE skip density validate → mất giá trị; FE nên buộc nhập để UX nhất quán). *Quyết định: required.* Nếu sau này product muốn cho phép null thì revert.
  - Thêm `superRefine` (tuỳ chọn): nếu có cả `totalAreaSqm` và `plantCount` mà chỉ 1 trong 2 → báo "Vui lòng nhập đủ diện tích và số cây" (mirror `Error.CropDensityRequiresAreaAndCount`).
- `UpdateCropSeasonBodySchema` (dòng 87-106): thêm `cropCategoryId: z.string().uuid().optional()` (PATCH cho phép đổi category khi còn `planning`? — BE doc không nói cấm; cứ optional, FE chỉ enable input khi `editMode === "all"`).

**Lưu ý compatibility:** `z.object` mặc định strip unknown, không strict, nên BE thêm field mới không crash; chỉ là chưa "đọc được" cho tới khi schema thêm.

---

### 2.3. Form tạo — `CreateCropSeasonScreen.tsx`

File: [src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx](../src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx)

**Cấu trúc UI mới (gợi ý layout, không bắt buộc):**

```
[Tên cây trồng *]   [Giống / Loại]
[Loại cây (Category) * ▼]                            ← NEW required dropdown
  helper: "Mật độ chuẩn 2 – 4 cây/m² (KN 3) · Chu kỳ điển hình 90 ngày"
[Ngày trồng *]      [Ngày thu hoạch dự kiến *]
[Diện tích (m²) *]  [Số lượng cây]                   ← Diện tích = NEW required
  badge density: "✅ 3.0 cây/m² · trong khoảng"
[Ghi chú]
```

**Tác vụ cụ thể:**

1. **Dropdown category** (`<Select>` của shadcn):
   - Source: `useActiveCropCategories()` từ task 2.1.
   - Sort: `OTHER` cuối list (client-side filter + push).
   - Disable submit cho tới khi load xong (skeleton hoặc disabled state nhẹ).
   - Render `cat.name` chính, line phụ nhỏ `code · min–max cây/m²`.
2. **Helper text dưới dropdown** (sau khi user pick): hiển thị "Mật độ chuẩn `min` – `max` cây/m² (khuyến nghị `recommendedDensity ?? '—'`) · Chu kỳ điển hình `defaultCycleDays ?? '—'` ngày". Nếu cat là `OTHER` thì ẩn dòng này (range của OTHER 0.001-1000 không có giá trị tham khảo cho user).
3. **Thêm input `totalAreaSqm`**: kiểu `number`, register `valueAsNumber`, đặt cạnh `plantCount`. Min `0.01` (BE chỉ check > 0).
4. **Density badge real-time** dưới 2 input area + count:
   - Khi `area && count && category`: tính `density = count / area`.
   - 3 trạng thái: ✅ trong khoảng, ⚠ vượt `max`, ⚠ dưới `min`. Hiển thị 2 số sau dấu phẩy.
   - Nếu category có `recommendedDensity`, hiển thị nút nhỏ "Gợi ý số cây tối ưu: `round(area × recommendedDensity)`" — bấm vào set lại `plantCount`.
5. **Auto-suggest `expectedHarvestDate`**:
   - Khi user chọn category VÀ chọn `plantDate` VÀ user **chưa** đụng `expectedHarvestDate` (track bằng RHF `formState.touchedFields.expectedHarvestDate`) VÀ `cat.defaultCycleDays != null` → set `expectedHarvestDate = plantDate + defaultCycleDays`.
   - Nếu user đã đụng → không override. Implement trong 1 `useEffect` watch `[plantDate, cropCategoryId]`.
6. **Cycle range warning** (không block submit, chỉ helper text):
   - Khi `plantDate && expectedHarvestDate && cat.defaultCycleDays`:
     - `cycleDays = (harvest - plant)/day`
     - `allowedMin = 0.5 × defaultCycleDays`, `allowedMax = 2 × defaultCycleDays`
     - Out-of-range → text amber "Chu kỳ `cycleDays` ngày nằm ngoài khoảng `allowedMin` – `allowedMax` ngày của `cat.name`. BE sẽ từ chối khi submit."
7. **Xoá hard-code "harvest ≥ plant + 1 tháng"**:
   - Trong [helpers.ts validateCropSeasonFormDates](../src/pages/ManagerPage/CropSeasons/components/helpers.ts#L77-L81): rule này không còn đúng cho category cycle ngắn (lettuce 45 ngày → allowedMin = 22.5 ngày).
   - Đề xuất: thay thế bằng rule mềm hơn — `expectedHarvestDate` chỉ cần **sau** `plantDate` (≥ 1 ngày). Validate sâu hơn để BE quyết.
   - **Lưu ý:** rule này cũng dùng trong `UpdateCropSeasonDialog`, sẽ ảnh hưởng. Đổi 1 lần, cả 2 dùng chung — OK.
   - Sửa luôn dòng helper text `[CreateCropSeasonScreen.tsx:182-184](../src/pages/ManagerPage/CropSeasons/components/CreateCropSeasonScreen.tsx#L182-L184)` cho khớp.
8. **DefaultValues cập nhật**: thêm `cropCategoryId: ""`, `totalAreaSqm: undefined` (để placeholder hiện).
9. **Map server error 422**:
   - Hiện tại `handleApiErrorUnprocessentity` dùng `path` BE gửi. BE doc xác nhận có `path` cho `Error.CropDensityAboveMax` (path `plantCount`). Cycle error có path không? BE doc không nói rõ — đặt fallback safe: nếu nhận message `Error.CropCycleOutOfDefaultRange` mà không có path, gắn vào `expectedHarvestDate` thủ công trước khi gọi helper.
   - Cách làm: trong catch block (sau check 422), pre-process `errors` mảng — với những key không có path mà message khớp `Error.CropDensity*` → set `path = 'plantCount'`; `Error.CropCycleOutOfDefaultRange` → `path = 'expectedHarvestDate'`; `Error.CropAreaExceedsZoneArea` → `path = 'totalAreaSqm'`. Rồi mới gọi helper.
   - Để tránh đụng nhiều file, có thể implement adapter ngay trong `onSubmit` của screen này thay vì sửa `handleApiErrorUnprocessentity` global.

---

### 2.4. Form sửa — `UpdateCropSeasonDialog.tsx`

File: [src/pages/ManagerPage/CropSeasons/components/UpdateCropSeasonDialog.tsx](../src/pages/ManagerPage/CropSeasons/components/UpdateCropSeasonDialog.tsx)

Phụ thuộc: 2.3 (dùng chung helper density/cycle).

- DefaultValues: thêm `cropCategoryId: season.cropCategoryId ?? ""`, `totalAreaSqm: season.totalAreaSqm ?? undefined`.
- Render thêm dropdown category + input `totalAreaSqm`. Cả 2 disable khi `planOnlyDisabled === true` (sau approved, Lớp 1 lock).
- Helper density + cycle hint: tái dùng cùng UI block.
- Snapshot display (riêng — không block update flow): khi `season.minDensitySnapshot != null` render badge "Mật độ áp dụng: `min` – `max` cây/m²" theo đúng UI Recipe 3 của BE doc. **Vị trí gắn:** trong dialog (đầu form, dạng read-only chip) — hoặc trong trang detail nếu có. Đặt trong dialog cho gọn vòng 1.
- Server error mapping: copy logic 2.3 step 9.

---

### 2.5. Hiển thị snapshot density ở các trang list / detail

> Nice-to-have, không blocker.

- Trang list mùa vụ (Manager + Owner): bên cạnh `cropName` có thể thêm chip nhỏ "Cat: `<category.name>`" nếu join được. Nhưng BE response **không** trả `category` object lồng (chỉ `cropCategoryId`). Hai lựa chọn:
  - **A (đơn giản):** chỉ hiện snapshot range, không hiện tên category — text "2–4 cây/m²".
  - **B (đầy đủ):** dùng list `useActiveCropCategories()` để build map id → name client-side, hiển thị tên. Vấn đề: list chỉ trả `active` — category inactive bị mất tên. Trade-off chấp nhận được (admin hiếm khi toggle off catalog đang dùng).
  - **Đề xuất: B**, fallback "—" khi không tìm thấy.
- Trang detail (nếu có route detail): hiển thị badge snapshot như UI Recipe 3.

---

### 2.6. Error i18n (tối thiểu cần cho §1.1)

> Phần đầy đủ ở §1.5 plan riêng. Ở §1.1 chỉ cần map đủ để form không show raw key.

File: `src/lib/error-message.ts` — thêm vào `BACKEND_ERROR_MAP`:

| BE key | UI (VI) |
|---|---|
| `Error.CropDensityBelowMin` | Mật độ cây trồng thấp hơn ngưỡng cho phép. |
| `Error.CropDensityAboveMax` | Mật độ cây trồng vượt ngưỡng cho phép. |
| `Error.CropDensityRequiresAreaAndCount` | Vui lòng nhập đủ diện tích và số cây. |
| `Error.CropCycleOutOfDefaultRange` | Chu kỳ vụ nằm ngoài khoảng cho phép của loại cây. |
| `Error.CropCategoryNotFound` | Không tìm thấy loại cây trồng. |

**Verify trước khi code:** xem map hiện tại trong `error-message.ts` đang dùng casing nào (gap doc 1.5 lưu ý có `error.iotkitnotfound` lowercase). Nếu lowercase → thêm key cả 2 dạng cho an toàn, hoặc verify lookup case-insensitive.

---

## 3. Thứ tự thực hiện & dependencies

```
2.6 (error map) ─────────┐
                         ├──► 2.3 (form tạo) ─┬──► 2.4 (form sửa, dùng chung helper)
2.1 (cropCategory svc) ──┤                    │
                         │                    └──► 2.5 (list/detail display)
2.2 (schema CropSeason) ─┘
```

- 2.1, 2.2, 2.6 **độc lập** — có thể làm song song.
- 2.3 phụ thuộc cả 3.
- 2.4 và 2.5 dùng chung helper của 2.3 nên làm sau.

**Mốc release:** 2.1 → 2.2 → 2.3 phải merge **cùng hoặc trước** BE deploy. 2.4, 2.5, 2.6 có thể trượt 1 release ngắn (UX thôi).

---

## 4. Test plan

### 4.1. Unit (Zod)

- `CreateCropSeasonBodySchema`: thiếu `cropCategoryId` → fail; UUID sai → fail; `totalAreaSqm <= 0` → fail; payload hợp lệ đủ trường → pass.
- `CropSeasonSchema`: parse response BE mock có `cropCategoryId`, `minDensitySnapshot`, `maxDensitySnapshot` → pass; response không có 3 field (data cũ) → pass nhờ nullable.

### 4.2. Component (smoke, không bắt buộc unit kỹ)

- Mount `CreateCropSeasonScreen` với mock `useActiveCropCategories` trả 3 cat (TOMATO, RICE, OTHER) → dropdown render, OTHER cuối list.
- Chọn TOMATO + nhập area=100, count=300 → badge density "3.0 ✅".
- Chọn TOMATO + area=100, count=800 → badge "8.0 ⚠ vượt max".
- Chọn TOMATO (cycle 90) + plantDate=hôm-nay+30, **không** đụng harvest → harvest auto = plantDate+90.
- Đụng harvest tay → cập nhật plantDate sau đó **không** override.
- TOMATO + plantDate=X, harvest = X+30 (cycle ngắn) → text cảnh báo "ngoài khoảng 45-180".

### 4.3. E2E hand-test sau khi BE merge

- Submit form không chọn category → form-level error required, không gọi API.
- Submit hợp lệ + density vượt → BE trả 422 → highlight `plantCount`.
- Submit cycle ngoài range → 422 → highlight `expectedHarvestDate`.
- Submit `totalAreaSqm` > zone area → 422 `Error.CropAreaExceedsZoneArea` → highlight `totalAreaSqm`.
- Sửa vụ ở `planning`: đổi category → save → detail hiện snapshot mới. Sửa vụ ở `approved`: dropdown category disabled.

---

## 5. Risk & open questions

| # | Câu hỏi | Cần ai trả lời | Plan B nếu chưa có answer |
|---|---|---|---|
| 5.1 | `Error.*` casing thực tế BE gửi | BE/log | Add cả 2 case (Error.X và error.x) vào map, hoặc làm lookup case-insensitive trong helper |
| 5.2 | BE có gửi `path` cho cycle error không? | BE doc thiếu | Adapter trong `onSubmit` tự gán path (mục 2.3.9) — vẫn an toàn |
| 5.3 | `OTHER` có hiện trong `/crop-categories/active` không? | BE | Đoán có; nếu không thì user phải submit để biết → backfill OTHER bằng frontend default option nếu cần |
| 5.4 | PATCH crop-season có nhận `cropCategoryId` không? | BE doc không nói rõ | Cứ gửi optional; nếu BE từ chối → bỏ field này khỏi UpdateBodySchema |
| 5.5 | Field `totalAreaSqm` required client hay optional? | PM | Mặc định chọn required (lý do trong 2.2). Có thể switch nhanh sang optional. |
| 5.6 | List response có nên enrich category name client-side? | UX/PM | Đề xuất B (mục 2.5). Nếu không → A (chỉ range snapshot). |

---

## 6. Out of scope (đặt ở đây để tránh creep)

- Admin CRUD CropCategory page (§1.2).
- Field `coverageSqm` / `recommendedMinKits` cho IoT Kit (§1.3).
- Widget IoT coverage (§1.4).
- Bổ sung 11 i18n key đầy đủ (§1.5) — §1.1 chỉ cần 5 key (mục 2.6).
- Route Zone detail (§1.6).
- Refactor toast/error pipeline global.

---

*Hết plan §1.1. Mọi thay đổi đều thuộc folder `farmos_fe/`, không động BE.*
