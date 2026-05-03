# Wave 1+2 — Audit findings vs BE thật

> **STATUS: ✅ RESOLVED** — Toàn bộ 8 critical (C1–C8) + 4 medium (M1–M4) đã sửa.
> `tsc --noEmit` + `eslint` cho file Wave 1+2: **0 error, 0 warning**.
> Tổng error TS toàn repo: 40 (giữ nguyên baseline pre-existing — không phát sinh thêm).
>
> User báo "nhiều API trả 422". Audit BE Module 3 actual code (`farm_os_be/src/modules/medicine/`, `system-config/`, `ticket-lifecycle/`) phát hiện **4 mismatch nghiêm trọng + 4 mismatch nhỏ + 4 hook thiếu onError**.

## Tóm tắt mức độ

| Mức | Số lỗi | Tác động |
|---|---|---|
| 🔴 Critical (chắc chắn 422/404) | 4 | Form/page Wave 2 sẽ vỡ ngay khi BE up |
| 🟡 Medium (shape lệch nhỏ) | 4 | Render lỗi hoặc field optional bị thiếu |
| 🟢 Polish (missing onError) | 4 | UX kém khi có lỗi không phải 422 |

---

## 🔴 Critical fixes

### C1. **Medicine schema hoàn toàn lệch BE**
**File**: [farmos_fe/src/schemaValidatation/medicine.ts](../../src/schemaValidatation/medicine.ts) + [AdminMedicineFormSheet.tsx](../../src/pages/AdminPage/Medicines/AdminMedicineFormSheet.tsx)

**BE thật** (`farm_os_be/src/modules/medicine/medicine.model.ts` lines 5-39):
- **Required**: `code` (1-64), `name` (1-255), `form` (enum `MedicineForm`), `unit` (1-50)
- **Optional**: `scientificName` (≤255), `strength` (≤100), `speciesScope` (any), `contraindications`, `sideEffects`, `withdrawalPeriodDays` (int ≥0), `metadata` (any)
- Schema `.strict()` → field thừa = 422
- `MedicineForm` enum: `TABLET | CAPSULE | INJECTION | POWDER | LIQUID | TOPICAL | FEED_ADDITIVE | OTHER`

**FE hiện gửi** (sai):
- Có: `name, activeIngredient, defaultDosage, defaultRoute, withdrawalPeriodDays, notes, isActive`
- Thiếu: `code, form, unit` → 422 REQUIRED
- Field thừa: `activeIngredient, defaultDosage, defaultRoute, notes, isActive` → 422 UNRECOGNIZED (`.strict()`)

**Fix**:
1. Rewrite `MedicineResSchema` + `CreateMedicineBodySchema` + `UpdateMedicineBodySchema` để match BE.
2. Rewrite `AdminMedicineFormSheet` form: thêm input `code`, Select `form` (8 enum), input `unit`. Đổi `activeIngredient → scientificName`, `defaultDosage → strength`, bỏ `defaultRoute, notes`, thêm `contraindications, sideEffects` (textarea).
3. Update `AdminMedicinesPage` columns hiển thị: bỏ "Hoạt chất / Liều / Đường dùng", thêm "Mã / Dạng (form) / Đơn vị / Hoạt chất khoa học (scientificName) / Hàm lượng (strength)".
4. List query: đổi `search` → `q`, thêm `species` filter.

### C2. **Medicine list query field name lệch**
**File**: [medicine.ts:54](../../src/schemaValidatation/medicine.ts) (`ListMedicinesQuerySchema`)

**BE thật** (line 58-62): `{page, limit, q?, isActive?, species?}` — dùng `q` không phải `search`.

**FE hiện**: `search` (do extend từ `PagingRequestSchema` có sẵn `search`) → BE 422 UNRECOGNIZED `search` (vì `.strict()`).

**Fix**: Override schema list — chỉ pick `page, limit` từ `PagingRequestSchema.partial()`, thêm `q, isActive, species`.

### C3. **Medicine catalog không có pagination**
**File**: [medicine.ts:67–76 BE] vs FE `useMedicineCatalog` đang gửi `page+limit`.

**BE thật**: `MedicineCatalogQuerySchema = {q?, species?}` — KHÔNG có page/limit, chỉ trả `{data: Medicine[]}` không phân trang.

**FE hiện** ([useMedicine.ts:96-110](../../src/queries/useMedicine.ts)): Default `{page:1, limit:90, isActive:true}` → BE 422 UNRECOGNIZED `page, limit, isActive`.

**Fix**: 
- `MedicineCatalogQuerySchema` mới: `{q?, species?}` only.
- `MedicineCatalogResSchema`: `{data: MedicineSchema[]}` (không có `meta`).
- `useMedicineCatalog` bỏ `limit:90`, dùng `q` cho search.
- `MedicinePicker` ([MedicinePicker.tsx](../../src/components/ticket-quality/pickers/MedicinePicker.tsx)) phải đổi `search` param thành `q`. Cap dropdown 90 items client-side nếu cần.

### C4. **Medicine freetext stats không có pagination/sort**
**File**: BE [medicine.model.ts:79-88] vs FE.

**BE thật**: `FreetextStatsResSchema = {data: [{customMedicineName, count}]}` — flat, không có `lastUsedAt`, `distinctDoctors`, không pagination, không sort.

**FE hiện**: 
- Schema có `occurrences, lastUsedAt, distinctDoctors` + `ListFreetextMedicineStatsQuerySchema` với `sortBy/sortOrder/page/limit`.
- `AdminMedicineFreeTextStatsPage` render `lastUsedAt, distinctDoctors`, sort UI.

**Fix**:
- Đổi `FreetextMedicineStatRowSchema = {customMedicineName, count}` (không có 3 field kia).
- Bỏ pagination + sort trong query schema.
- Page A2: bỏ Select sort, bỏ pagination Prev/Next, bỏ cột Lần dùng + Bác sĩ khác nhau, đổi cột "Số lần xuất hiện" → "count".
- Hooks: `useMedicineFreetextStats()` bỏ params query.

### C5. **System Config endpoint là single-key, không phải batch**
**File**: BE [system-config.controller.ts:31-43] vs FE.

**BE thật**: `PATCH /admin/system-configs/:key` body `{value: string, valueType: "number"|"boolean"|"string"|"json", description?: string|null}` — upsert 1 key/call.

**FE hiện** ([systemConfigService.ts:23](../../src/services/systemConfigService.ts) + [useSystemConfig.ts:61-70](../../src/queries/useSystemConfig.ts)): `PATCH /admin/system-configs` với batch `{updates: [{key,value}]}` → 404 (không có route này).

**Fix**:
1. `endpoints.ts`: đổi `SYSTEM_CONFIGS.PATCH` thành `(key: string) => /admin/system-configs/${key}`.
2. `systemConfigService.ts`: `upsert(key, body)` thay cho `patch(body)`.
3. `useSystemConfig.ts`: `useUpsertSystemConfig()` nhận `{key, body}`.
4. `AdminTicketSystemConfigsPage` `onSubmit`: chạy 9 mutation tuần tự (hoặc Promise.all) thay vì 1 batch. Track errors per-key, hiển thị toast tổng hợp.
5. **Schema BE response field là `valueType` không phải `type`** ([system-config.model.ts:7](../../../farm_os_be/src/modules/system-config/system-config.model.ts)). Cập nhật `SystemConfigItemSchema` FE: `valueType: z.string()` (BE để string đơn giản, không enum strict trong response).

### C6. **System Config FE thiếu key `auto_close_notify_at_fraction`**
**File**: BE [system-config.model.ts:33-43] seeds vs FE form.

**BE seed có** (9 ticket key + 1 feature flag):
```
ticket.auto_close_hours, ticket.doctor_silence_minutes,
ticket.priority_window.{platinum_sec, gold_sec, fanout_sec},
ticket.ai_fallback_minutes,
ticket.auto_close_notify_at_fraction,  ← FE THIẾU
ticket.commission_max_percent, ticket.rating_max_stars,
feature.ticket_resolve_quality_v2  ← cũng prefix `feature.` không phải `ticket.`
```

**FE hiện** chỉ 8 key, thiếu `auto_close_notify_at_fraction` (BR-74 — tỉ lệ thời điểm nhắc creator).

**Fix**: 
- Thêm `auto_close_notify_at_fraction` vào `TICKET_SYSTEM_CONFIG_KEY_MAP` + `TicketSystemConfigFormSchema` (z.number().min(0).max(1) — fraction 0-1).
- Thêm field vào A3 form group "Vòng đời" với label "Tỉ lệ thời điểm nhắc đóng" + helperText "Nhắc creator khi đã qua X% thời gian chờ tự đóng (vd 0.667 = 2/3)".

### C7. **Feature flag đọc sai nguồn**
**File**: [useTicketQualityFlag.ts](../../src/hooks/useTicketQualityFlag.ts).

**BE thật**: `feature.ticket_resolve_quality_v2` lưu trong **SystemConfig** ([system-config.model.ts:43](../../../farm_os_be/src/modules/system-config/system-config.model.ts)) với `valueType: "boolean", value: "true"`. KHÔNG phải Feature entity riêng.

**FE hiện**: `useFeatureDetail("ticket_resolve_quality_v2")` đọc từ `useFeature` (entity Feature menu/billing) — sai nguồn dữ liệu.

**Fix**: Rewrite `useTicketQualityFlag` đọc qua `useSystemConfigs("feature.")` hoặc `useSystemConfigValue("feature.", "feature.ticket_resolve_quality_v2")` (lưu ý: prefix là `feature.` không phải `ticket.`). Parse `value === "true"` cho boolean.

### C8. **Rating field name `comment` → `feedback`**
**File**: [rating.ts](../../src/schemaValidatation/rating.ts).

**BE thật** ([ticket-lifecycle.model.ts:107-113](../../../farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts)):
- `SubmitRatingBodySchema = {stars: int 1-5, feedback?: string|null, tags?: string[]}` `.strict()`
- `RatingResSchema = {id, ticketId, ratedBy, doctorId, stars, feedback, tags (any), invalidatedAt, invalidatedBy, invalidationReason, createdAt}` (KHÔNG có `comment` hay `invalidatedReason`, mà là `invalidationReason`)

**FE hiện**:
- `CreateRatingBodySchema = {stars 1-10, comment?, tags?}` → BE 422 (max 10 → 5; `comment` → `feedback`)
- `RatingResSchema` có `comment`, `invalidatedReason` → render undefined

**Fix**:
- `CreateRatingBodySchema`: stars max 5, đổi `comment` → `feedback`.
- `RatingResSchema`: bỏ `comment`, đổi `invalidatedReason` → `invalidationReason`. Thêm `ratedBy, doctorId`. `tags` đổi sang `z.any().nullable()`.
- Cập nhật mọi component reference (W3 sẽ build, chỉ cần fix schema giờ).

---

## 🟡 Medium fixes (shape lệch)

### M1. **CloseTicket body không phải empty `{}`**
**File**: [ticketService.ts](../../src/services/ticketService.ts) (`closeByCreator`).

**BE thật** ([ticket-lifecycle.model.ts:97-102](../../../farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts)):
`CloseTicketBodySchema = {confirmed: boolean default true, note?: string}` `.strict()`

**FE hiện**: `closeByCreator(ticketId)` gửi body `{}` — tuy nhiên `confirmed.default(true)` có thể chấp nhận empty, RỦI RO BE check strict.

**Fix**: 
- Đổi signature: `closeByCreator(ticketId, body?: {confirmed?: boolean, note?: string})`.
- Mặc định body `{confirmed: true}`.
- Schema mới `CloseTicketBodySchema` trong FE.
- W3 `CloseAndRateModal` Step 1 có thể gửi note (nếu bổ sung field).

### M2. **AbandonResolution `reason` → `note`**
**File**: [abandonLog.ts](../../src/schemaValidatation/abandonLog.ts).

**BE thật** ([ticket-lifecycle.model.ts:118-123](../../../farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts)):
`AbandonTicketBodySchema = {resolution: "FALLBACK_AI"|"REFUND_TICKET", note?: string}` `.strict()`

**FE hiện**: `AbandonResolutionBodySchema = {resolution, reason?}` → BE 422 UNRECOGNIZED `reason`.

**Fix**: Đổi `reason` → `note` trong schema FE + W3 modal.

### M3. **Solution + Prescription + Addendum + AbandonLog field names lệch**
**File**: nhiều schema W1.

**BE thật**:
- `TicketSolutionResSchema`: `authorId` (không phải `createdBy`), thêm `severityNote`, `language`. Source enum `SolutionSource` (not z.enum strings).
- `PrescriptionResSchema`: `authorId, status, generalNotes, items` — KHÔNG có `supersededById`. Spec FE đoán có nhưng BE chưa.
- `PrescriptionItemResSchema`: `usageInstructions` (không phải `instructions`), `orderIndex`, `medicineName` (denormalized), `withdrawalPeriodDays` SNAPSHOT có sẵn ✓.
- `AddendumResSchema`: `authorId` (không phải `createdBy`).
- `RatingResSchema`: như C8.
- `BroadcastResSchema`: `notifiedAt` (không phải `sentAt`), enum `TicketBroadcastStatus`.
- `AbandonLogResSchema`: `doctorId, acceptedAt, abandonDetectedAt, ownerChoice` — rất khác FE đang đoán.

**Fix**: Rewrite hết 6 schema FE để match 1-1 với BE source. Đặc biệt:
- `solution.ts`: `authorId, severityNote, language`.
- `prescription.ts`: bỏ `supersededById`, `status` dùng prisma enum `PrescriptionStatus`. Item field `usageInstructions, orderIndex, medicineName`.
- `addendum.ts`: `authorId`.
- `broadcast.ts`: `notifiedAt`, status enum `TicketBroadcastStatus`.
- `abandonLog.ts`: rewrite hoàn toàn.

### M4. **TicketFullResSchema lồng SAI cấp**
**File**: [ticket.ts](../../src/schemaValidatation/ticket.ts).

**BE thật** ([ticket-lifecycle.model.ts:226-260](../../../farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts)):
```
{
  ticket: { id, ticketNumber, status, ..., resolvedBy, closedBy, isAIResolved, ... },
  solution: ... | null,
  prescription: ... | null,
  addenda: [],
  rating: ... | null,
  broadcasts: [],
  abandonLogs: []
}
```

**FE hiện**: `TicketFullResSchema = TicketIncidentResSchema.extend({ solution, prescription, ... })` — flat extend, không có wrapper `ticket`. Khi BE response về, Zod parse fail toàn bộ.

Ngoài ra `ticket.assignee, creator, farm, zone, attachments, productionMilestone` không có trong `TicketBasicResSchema` của BE → FE schema kế thừa từ `TicketIncidentResSchema` sẽ phình quá.

**Fix**: 
- Tạo schema `TicketFullResSchema` mới hoàn toàn (lồng `{ticket: TicketBasicResSchema, solution, prescription, addenda, rating, broadcasts, abandonLogs}`).
- `TicketBasicResSchema` riêng cho ticket fields BE trả (không có assignee/creator/farm join — pending decision với BE để bổ sung join nếu UI cần).

---

## 🟢 Polish — Missing `onError` trong hooks (UX)

### P1. **Hook mutation Wave 1 thiếu `onError`**
**Files**: [useTicket.ts](../../src/queries/useTicket.ts) (`useCloseTicket`, `useRateTicket`, `useAbandonResolution`, `useAdminInvalidateRating`), [useMedicine.ts](../../src/queries/useMedicine.ts) (`useCreateMedicine`, `useUpdateMedicine`, `useToggleMedicine`), [useSystemConfig.ts](../../src/queries/useSystemConfig.ts) (`usePatchSystemConfigs`).

**Vấn đề**: Khi BE trả 4xx/5xx **không phải 422**, các caller có try/catch sẽ catch và toast. Caller dùng `mutate()` không catch → silent fail.

**Fix**: Cho phép caller decide — đa số đã có try/catch (W2 forms). Riêng `handleConfirmToggle` ([AdminMedicinesPage.tsx:97-112](../../src/pages/AdminPage/Medicines/AdminMedicinesPage.tsx)) đã có try/catch nhưng chỉ toast generic — sửa để cũng map 422 vào toast field-specific (vì toggle không có form).

Pattern recommend cho mutation hook:
```ts
return useMutation({
  mutationFn: ...,
  onSuccess: ...,
  // KHÔNG đặt onError mặc định — caller tự quyết.
  // Caller phải có try/catch + handleApiErrorUnprocessentity (form) HOẶC
  // toast.error(getApiErrorMessageVi(err)) (action không có form).
});
```

Hiện trạng W1+W2 đã đúng pattern này — không cần sửa hook, chỉ cần đảm bảo W3 caller cũng tuân thủ.

---

## Action items đã hoàn thành

| # | Việc | Trạng thái | File chính đã sửa |
|---|---|---|---|
| C1+C2 | Rewrite medicine schema (BE strict — code/name/form/unit required, scientificName/strength/contraindications/sideEffects/metadata) | ✅ | [medicine.ts](../../src/schemaValidatation/medicine.ts), [AdminMedicineFormSheet.tsx](../../src/pages/AdminPage/Medicines/AdminMedicineFormSheet.tsx), [AdminMedicinesPage.tsx](../../src/pages/AdminPage/Medicines/AdminMedicinesPage.tsx) |
| C3 | Catalog schema + MedicinePicker dùng `q`, không page/limit/isActive | ✅ | [medicineService.ts](../../src/services/medicineService.ts), [useMedicine.ts](../../src/queries/useMedicine.ts), [MedicinePicker.tsx](../../src/components/ticket-quality/pickers/MedicinePicker.tsx) |
| C4 | Freetext stats flat `{customMedicineName, count}` — bỏ pagination/sort | ✅ | [AdminMedicineFreeTextStatsPage.tsx](../../src/pages/AdminPage/Medicines/AdminMedicineFreeTextStatsPage.tsx) |
| C5 | SystemConfig single-key upsert `PATCH /admin/system-configs/:key` + sequential per-key + dirty fields filter | ✅ | [endpoints.ts](../../src/constants/endpoints.ts), [systemConfigService.ts](../../src/services/systemConfigService.ts), [useSystemConfig.ts](../../src/queries/useSystemConfig.ts), [AdminTicketSystemConfigsPage.tsx](../../src/pages/AdminPage/SystemConfigs/AdminTicketSystemConfigsPage.tsx) |
| C6 | Thêm `ticket.auto_close_notify_at_fraction` (BR-74) | ✅ | [systemConfig.ts](../../src/schemaValidatation/systemConfig.ts) + form A3 |
| C7 | `useTicketQualityFlag` đọc từ SystemConfig prefix `feature.` (key `feature.ticket_resolve_quality_v2`) | ✅ | [useTicketQualityFlag.ts](../../src/hooks/useTicketQualityFlag.ts) |
| C8 | Rating schema `feedback` (không `comment`), stars max 5, response field `invalidationReason` | ✅ | [rating.ts](../../src/schemaValidatation/rating.ts), [ticketService.ts](../../src/services/ticketService.ts), [useTicket.ts](../../src/queries/useTicket.ts) |
| M1 | CloseTicket body `{confirmed?, note?}` (không `{}`); hook `useCloseTicket` nhận `{ticketId, body}` | ✅ | [ticket.ts](../../src/schemaValidatation/ticket.ts) (CloseTicketBodySchema), [ticketService.ts](../../src/services/ticketService.ts), [useTicket.ts](../../src/queries/useTicket.ts) |
| M2 | Abandon body `{resolution, note}` (không `reason`) | ✅ | [abandonLog.ts](../../src/schemaValidatation/abandonLog.ts) |
| M3 | Solution `authorId/severityNote/language`; Addendum `authorId`; Broadcast `notifiedAt`; AbandonLog `acceptedAt/abandonDetectedAt/ownerChoice`; Prescription `usageInstructions/orderIndex/medicineName` snapshot | ✅ | [solution.ts](../../src/schemaValidatation/solution.ts), [addendum.ts](../../src/schemaValidatation/addendum.ts), [broadcast.ts](../../src/schemaValidatation/broadcast.ts), [abandonLog.ts](../../src/schemaValidatation/abandonLog.ts), [prescription.ts](../../src/schemaValidatation/prescription.ts) |
| M4 | TicketFullResSchema lồng `{ticket: TicketBasicResSchema, solution, prescription, addenda, rating, broadcasts, abandonLogs}` | ✅ | [ticket.ts](../../src/schemaValidatation/ticket.ts) |
| Verify | `tsc --noEmit` + `eslint` Wave 1+2 files = 0 error / 0 warning | ✅ | — |

## Pending decisions còn lại với BE

Sau audit, các quyết định BE đã có câu trả lời:
- **Decision 9.6** ✅ — 9 ticket key + `feature.ticket_resolve_quality_v2` ở SystemConfig (xem `system-config.model.ts:33-43`).
- **Decision 9.11** ✅ — `withdrawalPeriodDays` snapshot CÓ ở `PrescriptionItem` ([model:157](../../../farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.model.ts)).
- **Decision 9.5** ✅ — Feature flag dùng SystemConfig (không phải Feature entity riêng). Code `feature.ticket_resolve_quality_v2`.
- **Decision 9.1** ✅ — `TicketFullResSchema` shape có wrapper `{ticket, ...}`.

Còn lại pending:
- **9.2** — Admin Ticket Detail có endpoint `/admin/tickets/:id/full` riêng hay reuse B8? (hiện FE giả định riêng)
- **9.3** — DQS leaderboard shape: BE chưa ship (B16). FE giữ `DqsLeaderboardQuerySchema` provisional.
- **9.8** — Realtime payload TS type/OpenAPI: chưa share. FE Zod `.passthrough()` an toàn.
- **9.12** — Đổi system-config có ảnh hưởng ticket trong window cũ không?
- **9.13** — Mâu thuẫn rating editable BR-79 vs BR Changes 6 (BE sẽ trả lời khi B6 + B17 ship đủ).

**Sẵn sàng Wave 3** với schema chính xác đã match BE.
