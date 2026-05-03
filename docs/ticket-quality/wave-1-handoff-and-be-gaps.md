# Module 3 — Wave 1 (Hạ tầng FE) — Handoff & BE gap doc

> Đối chiếu plan: [ticket-quality-implementation-plan.md](./ticket-quality-implementation-plan.md) (v2)
> Plan execution chi tiết: `C:\Users\Asus\.claude\plans\you-are-a-senior-replicated-cherny.md`

## 1. Trạng thái Wave 1

**Hoàn thành 100%** — toàn bộ hạ tầng (endpoints, schemas, services, hooks, realtime, picker, label constants, feature-flag helper) đã ship.

| Verify | Kết quả |
|---|---|
| `tsc --noEmit` chỉ trên file mới + sửa | ✅ 0 error |
| `eslint` chỉ trên file mới + sửa | ✅ 0 error, 0 warning |
| Tổng số error TS toàn repo | 40 (tất cả là pre-existing — không phát sinh từ Wave 1) |

> Không gọi BE thật trong session này (theo lựa chọn user). Toàn bộ schema/service/hook định nghĩa sẵn sàng — khi BE up, FE chỉ cần verify shape.

## 2. File mới (Wave 1)

```
src/constants/
  ticketQualityLabels.ts                                ← I10 — labels VN tập trung

src/hooks/
  useTicketQualityFlag.ts                               ← I9 — feature-flag gate
  useRealtimeTicketDetail.ts                            ← I8 — realtime cho TicketDetailPanelV2

src/schemaValidatation/
  solution.ts                                           ← I3
  addendum.ts                                           ← I3
  rating.ts                                             ← I3 (CreateRating + InvalidateRating bodies)
  abandonLog.ts                                         ← I3
  broadcast.ts                                          ← I3
  medicine.ts                                           ← I3 (CRUD bodies + Catalog query + Freetext stats)
  dqs.ts                                                ← I3
  systemConfig.ts                                       ← I3 (TicketSystemConfigFormSchema cross-field validate)
  doctorPublic.ts                                       ← I3

src/services/
  medicineService.ts                                    ← I5 (B11/B12/B13/B10)
  systemConfigService.ts                                ← I5 (B18)
  dqsService.ts                                         ← I5 (B14/B15/B16)
  doctorPublicService.ts                                ← I5 (B19)

src/queries/
  useMedicine.ts                                        ← I6 (Catalog default limit 90)
  useSystemConfig.ts                                    ← I6 (+ helpers parse value)
  useDqs.ts                                             ← I6
  useDoctorPublic.ts                                    ← I6

src/components/common/
  DatePickerField.tsx                                   ← W1.9 L4 (extract chung)

src/components/ticket-quality/pickers/
  DoctorPicker.tsx                                      ← W1.9 L1 (limit 90 + debounce 300ms)
  MedicinePicker.tsx                                    ← W1.9 L2 (badge withdrawal warning)
```

## 3. File đã sửa (Wave 1)

| File | Phạm vi sửa |
|---|---|
| `src/constants/endpoints.ts` | Thêm `TICKET.{RESOLVE,CLOSE,REJECT,ADDENDA,RATING,ABANDON,FULL}`, `ADMIN_TICKETS.{INVALIDATE_RATING,FULL}`, `MEDICINES`, `SYSTEM_CONFIGS`, `DQS`, `DOCTORS.PUBLIC` (merge vào group DOCTORS hiện có). Thêm `QUERY_KEYS.{medicines,systemConfigs,dqs,doctorPublic,ticketsExt}`. |
| `src/constants/realtime.ts` | Thêm 6 event Module 3: `TicketAssigned`, `TicketResolved`, `TicketClosed`, `TicketFallbackRequired`, `WalletCredited`, `DqsTierChanged`. Thêm 6 NotificationKind tương ứng. |
| `src/schemaValidatation/realtime.ts` | Thêm 6 payload schema (passthrough). |
| `src/schemaValidatation/ticket.ts` | Thêm `CloseReasonSchema` + 9 field optional vào `TicketIncidentResSchema` (`resolvedAt`, `closedAt`, `closeReason`, `closedBy`, `isAIResolved`, `aiResolvedAt`, `payoutAt`, `payoutPercentSnapshot`, `payoutTierSnapshot`). Thêm `TicketFullResSchema` (B8 payload). |
| `src/schemaValidatation/prescription.ts` | Giữ legacy `PrescriptionResSchema` cho luồng cũ. Thêm `PrescriptionItemResSchema` + `PrescriptionWithItemsResSchema` (status ISSUED/SUPERSEDED, items[], withdrawalPeriodDays snapshot). |
| `src/services/ticketService.ts` | Thêm `getFull`, `closeByCreator`, `rateByCreator`, `abandonResolution`, `adminGetFull`, `adminInvalidateRating`. |
| `src/queries/useTicket.ts` | Thêm `useTicketFull`, `useAdminTicketFull`, `useCloseTicket`, `useRateTicket`, `useAbandonResolution`, `useAdminInvalidateRating`. Mọi mutation invalidate `tickets.all` + `ticketsExt.full(id)` + `ticketsExt.adminFull(id)`. |
| `src/hooks/useRealtimeTicket.ts` | Thêm 4 listener (assigned/resolved/closed/fallback-required) cho list page Owner/Manager. |

## 4. Cách Wave 2+ sẽ dùng hạ tầng này

```ts
// Wave 2 — A1 Admin Medicines page
import { useAdminMedicineList, useCreateMedicine, useToggleMedicine } from "@/queries/useMedicine";
import DatePickerField from "@/components/common/DatePickerField";

// Wave 2 — A3 System Configs
import { useTicketSystemConfigs, usePatchSystemConfigs, useSystemConfigValue } from "@/queries/useSystemConfig";
import { TicketSystemConfigFormSchema, TICKET_SYSTEM_CONFIG_KEY_MAP } from "@/schemaValidatation/systemConfig";

// Wave 3 — TicketDetailPanelV2
import { useTicketFull, useCloseTicket, useRateTicket, useAbandonResolution } from "@/queries/useTicket";
import { useRealtimeTicketDetail } from "@/hooks/useRealtimeTicketDetail";
import { useTicketQualityFlag } from "@/hooks/useTicketQualityFlag";
import { CLOSE_REASON_LABEL, RATING_TAG_OPTIONS, withdrawalWarning } from "@/constants/ticketQualityLabels";
import DoctorPicker from "@/components/ticket-quality/pickers/DoctorPicker";

// Wave 4 — A4 DQS Leaderboard
import { useDqsLeaderboard, useDoctorDqsDetail, useDoctorDqsHistory } from "@/queries/useDqs";
import { TIER_LABEL, TIER_BADGE_CLASS } from "@/constants/ticketQualityLabels";

// Wave 5 — P1 Public Doctor Profile
import { useDoctorPublicProfile } from "@/queries/useDoctorPublic";
```

---

## 5. BE gaps phát hiện trong Wave 1 (cần BE chốt)

Bám sát 14 decision đã liệt kê ở v2 doc mục 9. Phần dưới là những item Wave 1 **chạm trực tiếp** + cách FE đã xử lý interim:

### 5.1 Decision khoá tiến độ

| # | Decision | Wave 1 đã xử lý interim | Khi BE chốt cần |
|---|---|---|---|
| 9.1 | Shape `GET /tickets/:id/full` (B8) | `TicketFullResSchema` lồng `solution + prescription{items[]} + addenda + rating + broadcasts + abandonLogs` | Verify từng field name/nullable; chỉnh schema nếu khác |
| 9.2 | Endpoint Admin Ticket Detail riêng hay reuse B8 | Định nghĩa `ADMIN_TICKETS.FULL` riêng (`/admin/tickets/:id/full`) | Confirm path; có thể đổi sang reuse B8 với role check |
| 9.3 | DQS leaderboard (B16) shape | Schema có `date single + tier filter + 5 sub-score` | Verify đặc biệt `totalScore` nullable cho doctor mới |
| 9.5 | Feature flag code chính xác | `useTicketQualityFlag` đọc `useFeatureDetail("ticket_resolve_quality_v2")` và check `valueType === "BOOLEAN" && defaultValue === "true"` | Confirm code (no `feature.` prefix); confirm shape per-env override |
| 9.6 | 8 system-config keys | `TICKET_SYSTEM_CONFIG_KEY_MAP` (file `systemConfig.ts`) map FE form key ↔ BE dot-notation key. Min/max trong `TicketSystemConfigFormSchema` | Confirm BE accept batch `PATCH /admin/system-configs` body `{updates:[{key,value:string}]}` |
| 9.7 | Withdrawal period snapshot | `PrescriptionItemResSchema.withdrawalPeriodDays` định nghĩa nullable; FE comment "snapshot — pending decision 9.11" | Confirm BE snapshot field này khi tạo `PrescriptionItem` (FE phụ thuộc cho hiển thị warning chính xác lúc kê) |
| 9.8 | Realtime payload TS type/OpenAPI | 6 payload schema FE đã định nghĩa với `.passthrough()` + field tối thiểu | BE share TS type / generate FE từ OpenAPI để mirror chính xác |
| 9.10 | DoctorPublicProfile fields chính xác | `DoctorPublicProfileResSchema = { id, fullName, email?, avatarUrl?, avgRating, totalResolvedTickets, specialization }` | Confirm exact field; tuyệt đối KHÔNG có `tier` |

### 5.2 Edge case còn pending

| # | Edge case | Tham chiếu FE | Wait BE |
|---|---|---|---|
| 9.11 | Snapshot `withdrawalPeriodDays` lúc kê hay đọc live | FE schema để optional + comment | BE quyết định, FE update binding ở `PrescriptionItemsCard` (Wave 3) |
| 9.12 | Đổi system-config có ảnh hưởng ticket đang trong window cũ? | A3 form ship như "áp dụng cho ticket close mới"; chưa banner cảnh báo | BE confirm rule, FE thêm banner nếu cần |
| 9.13 | Mâu thuẫn rating editable: BR-79 immutable vs BR Changes mục 6 cho phép đổi trong cửa sổ | `useRateTicket` chỉ POST 1 lần (không có updateRating) | Nếu BE chốt theo BR Changes, thêm `updateRating` + cửa sổ thời gian từ system-config |
| 9.14 | DQS history pagination shape | FE `DqsHistoryQuerySchema = page+limit (max 100, default 10) + from/to` | Confirm cursor vs offset; FE giữ offset |

### 5.3 BE-side công việc Wave 1 *bắt buộc* để FE wire ngay được Wave 2

Tuần Wave 2 cần các BE task này (xếp theo độ ưu tiên):

1. **B11** — `GET/POST/PATCH /admin/medicines` + `MedicineRouteType` enum chính thức.
2. **B12** — `PATCH /admin/medicines/:id/toggle` body `{isActive}`.
3. **B18** — `GET /admin/system-configs?prefix=ticket.` trả 8 key + `PATCH` batch.
4. **`useFeatureDetail` shape**: confirm BE khả năng query feature `ticket_resolve_quality_v2` (cho `useTicketQualityFlag`).

Tuần Wave 3 cần:

5. **B5/B6/B7/B8** — close, rating, abandon-resolution, full payload.
6. **WS event** `ticket.assigned/resolved/closed/fallback-required` phát đúng filter scope.

Tuần Wave 4 cần:

7. **B14/B15/B16** — DQS detail, history, leaderboard. Cron B21 chạy ≥ 1 đêm.

Tuần Wave 5 cần:

8. **B17, B19, B22, B23** — invalidate-rating, public profile, auto-close timer, doctor inactivity timer.

---

## 6. Quy ước Wave 2+ phải tôn trọng

Đã enforce qua hạ tầng Wave 1. Mọi page mới chỉ cần follow:

1. **Form**: dùng `useClearServerFieldErrors(form)`, bắt 422 qua `handleApiErrorUnprocessentity`, mỗi field truyền `error={form.formState.errors.<field>?.message}` (xem [docs/form-error-and-date-handling.md](../../../docs/form-error-and-date-handling.md)).
2. **Date**: form state `yyyy-MM-dd`; service convert ISO trước gửi BE; dùng `<DatePickerField>` (W1.9).
3. **Picker**: bất cứ field reference nào (doctorId, medicineId) — BẮT BUỘC dùng `<DoctorPicker>` / `<MedicinePicker>`. KHÔNG cho user nhập tay UUID.
4. **Pagination**: list page default `limit:20`; lookup picker `limit:90`.
5. **Style**: KHÔNG gradient. Dùng `bg-card`, `bg-muted`, `bg-emerald-500/10`, `bg-amber-500/10`, `bg-red-500/10` theo `ticketQualityLabels.ts`.
6. **Animation**: page root `<div className="space-y-6 animate-in fade-in duration-300">`. Panel slide-in: pattern `show` state + `requestAnimationFrame` + `setTimeout(onBack, 300)` (DEVELOPMENT.md mục Animation Patterns).
7. **Card description**: mô tả chức năng (cái card này làm gì) — KHÔNG mô tả role permission.
8. **Mutation**: bắt buộc invalidate query (mọi hook Wave 1 đã làm sẵn — Wave 2+ tự thêm theo pattern).
9. **Tier leak guard**: `grep 'tier'` trong code Owner/Manager (kể cả qua `<DoctorPublicProfile>`) phải = 0.
10. **Feature flag**: Owner/Manager UI mới luôn gate qua `useTicketQualityFlag()`. Khi `enabled=false` → fallback luồng cũ. Admin governance (Medicines, System Configs, DQS) **không** gate (độc lập với flag).

---

## 7. Sequencing Wave 2+ (cập nhật theo trạng thái BE)

| Wave | Phụ thuộc BE | FE deliverable | Estimate |
|---|---|---|---|
| W2 — Admin governance | B11/B12/B13/B18 | A1 Medicines CRUD + A2 Free-text Stats + A3 System Configs + sidebar/route | 1 tuần |
| W3 — Owner/Manager creator | B5/B6/B7/B8 + WS | TicketDetailPanelV2 + 5 supporting card + 2 modal + tích hợp 2 page hiện có | 2 tuần |
| W4 — Admin DQS | B14/B15/B16 + cron B21 | A4 Leaderboard + A5 Doctor DQS Detail + redirect A6 | 1 tuần |
| W5 — Polish | B17, B19, B22, B23 | A7 Invalidate Rating + A8 Admin Ticket Detail + A9 Commission shortcut + P1 widget + drill-down | 1 tuần |

> Mọi wave đã sẵn hạ tầng Wave 1 — không phát sinh thêm dependency.
