# Wave 3 — Post-implementation audit (FE vs BE actual)

> Sau khi ship Wave 1+2+3, audit toàn bộ 21 endpoint FE call vs BE source thật ở `farm_os_be/src/modules/`. Báo cáo + fix.

## 1. Tóm tắt audit

| Hạng mục | Kết quả |
|---|---|
| ✅ Endpoint match path + body + response | **21/21** |
| 🟡 BE chưa ship | 5 realtime event Module 3 (BE phải emit) |
| 🔧 FE phải sửa | 2 (xem mục 2) |
| ✅ Pre-existing legacy | Tất cả vẫn dùng được |

## 2. Fix đã áp dụng

### F1. WS event `WalletCredited` rename `wallet.credited` → `doctor.wallet.credited`

**Lý do**: BE [`realtime.events.ts:13`](../../../farm_os_be/src/realtime/realtime.events.ts) đặt tên `DoctorWalletCredited: "doctor.wallet.credited"` (đã tồn tại sẵn cho Module 4 wallet flow). FE đặt sai `"wallet.credited"` sẽ không match khi BE emit.

**Fix**: [src/constants/realtime.ts](../../src/constants/realtime.ts) đổi value sang `"doctor.wallet.credited"`. FE listener không thay đổi (vẫn dùng `RealtimeEvents.WalletCredited`).

### F2. Thêm `PrescriptionCreated` event listener

**Lý do**: BE đã emit `PrescriptionCreated: "prescription.incident.created"` ([realtime.events.ts:12](../../../farm_os_be/src/realtime/realtime.events.ts)) khi Doctor tạo/reissue đơn thuốc. FE Wave 3 chưa subscribe → khi Doctor reissue, V2 panel không tự refresh.

**Fix**:
- [src/constants/realtime.ts](../../src/constants/realtime.ts): thêm `PrescriptionCreated` constant.
- [src/schemaValidatation/realtime.ts](../../src/schemaValidatation/realtime.ts): thêm `PrescriptionCreatedPayloadSchema`.
- [src/hooks/useRealtimeTicketDetail.ts](../../src/hooks/useRealtimeTicketDetail.ts): subscribe + invalidate `tickets.full(id)` khi event của đúng ticketId về.

### F3. `adminGetFull` reuse `/tickets/:id/full`

**Lý do**: FE giả định BE có endpoint riêng `GET /admin/tickets/:id/full` cho Wave 5 (A8). BE thực tế chỉ có shared `GET /tickets/:id/full` ([ticket-lifecycle.controller.ts:127](../../../farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.controller.ts)) cho phép mọi role bao gồm Admin.

**Fix**: [src/constants/endpoints.ts](../../src/constants/endpoints.ts) `ADMIN_TICKETS.FULL` đổi từ `/admin/tickets/:id/full` → `/tickets/:id/full`. Hook `useAdminTicketFull` giữ nguyên (cache key tách `ticketsExt.adminFull` để Wave 5 admin context vẫn có cache scope riêng).

> Pending: nếu BE Wave 5 sau này tách riêng admin endpoint với extra fields (vd payout detail tier), FE chỉ cần sửa lại endpoint constant.

## 3. BE-side TODO (FE đã sẵn sàng, chỉ chờ BE)

5 event ticket-lifecycle Module 3 BE chưa emit:

| Event | FE đã subscribe ở | BE phải emit từ |
|---|---|---|
| `ticket.assigned` | `useRealtimeTicket` (list) + `useRealtimeTicketDetail` (detail) | Khi Doctor accept (B1 đã có endpoint nhưng chưa emit event) |
| `ticket.resolved` | Như trên | Khi Doctor submit B2 resolve |
| `ticket.closed` | Như trên | Khi creator close (B5) hoặc auto-close timer (B22) |
| `ticket.fallback-required` | `useRealtimeTicketDetail` (auto-mở Abandon modal) | Khi doctor inactivity timer (B23) trigger |
| `dqs.tier_changed` | (Wave 4 sẽ subscribe ở Admin DQS Leaderboard) | Khi cron B21 chạy nightly và tier thay đổi |

**Lưu ý**: FE listener đều `.safeParse()` + `.passthrough()` → defensive. Khi BE chưa emit, FE silent skip, không crash. Khi BE emit, FE tự kích hoạt.

## 4. Endpoint FE đã verify match BE 1-1

### Ticket Quality (Module 3 actions)
| FE | BE controller | Status |
|---|---|---|
| `getFull` GET `/tickets/:id/full` | `@Get("tickets/:id/full")` | ✅ |
| `closeByCreator` POST `/tickets/:id/close` body `{confirmed?, note?}` | `@Post("tickets/:id/close")` `CloseTicketBodySchema.strict()` | ✅ |
| `rateByCreator` POST `/tickets/:id/rating` body `{stars 1-5, feedback?, tags?}` | `@Post("tickets/:id/rating")` `SubmitRatingBodySchema.strict()` | ✅ |
| `abandonResolution` POST `/tickets/:id/abandon-resolution` body `{resolution, note?}` | `@Post("tickets/:id/abandon-resolution")` `AbandonTicketBodySchema.strict()` | ✅ |
| `adminInvalidateRating` POST `/admin/tickets/:id/invalidate-rating` body `{reason ≥10}` | `@Post("admin/tickets/:id/invalidate-rating")` | ✅ |
| `adminGetFull` GET `/tickets/:id/full` (sau F3) | reuse shared B8 | ✅ |

### Medicine (B10/B11/B12/B13)
| FE | BE | Status |
|---|---|---|
| `adminList` GET `/admin/medicines?q&isActive&species` | `@Get("admin/medicines")` `ListMedicineQuerySchema.strict()` | ✅ |
| `adminCreate` POST `/admin/medicines` body `{code, name, form, unit, scientificName?, strength?, contraindications?, sideEffects?, withdrawalPeriodDays?, metadata?}` | `@Post` `CreateMedicineBodySchema.strict()` | ✅ |
| `adminUpdate` PATCH `/admin/medicines/:id` partial nullable | `@Patch` `UpdateMedicineBodySchema.strict()` | ✅ |
| `adminToggle` PATCH `/admin/medicines/:id/toggle` body `{isActive}` | `@Patch` `ToggleMedicineBodySchema.strict()` | ✅ |
| `adminFreetextStats` GET `/admin/medicines/freetext-stats` | `@Get` flat array `{customMedicineName, count}` | ✅ |
| `catalog` GET `/medicines/catalog?q&species` | `@Get` `MedicineCatalogQuerySchema.strict()` | ✅ |

### System Config (B18)
| FE | BE | Status |
|---|---|---|
| `list` GET `/admin/system-configs?prefix=ticket.` | `@Get()` controller `admin/system-configs` | ✅ |
| `upsert` PATCH `/admin/system-configs/:key` body `{value, valueType, description?}` | `@Patch(":key")` `UpsertSystemConfigBodySchema.strict()` | ✅ |
| Feature flag key `feature.ticket_resolve_quality_v2` | Có trong `TICKET_SYSTEM_CONFIG_SEEDS:43` | ✅ |

### DQS (B14/B15/B16) — BE đã ship
| FE | BE | Status |
|---|---|---|
| `doctorDetail` GET `/admin/doctors/:id/dqs` | `@Get("admin/doctors/:id/dqs")` | ✅ |
| `doctorHistory` GET `/admin/doctors/:id/dqs-history` | `@Get("admin/doctors/:id/dqs-history")` | ✅ |
| `leaderboard` GET `/admin/dqs-leaderboard` | `@Get("admin/dqs-leaderboard")` | ✅ |

### Doctor Public Profile (B19)
| FE | BE | Status |
|---|---|---|
| `detail` GET `/doctors/:id/public` | `@Get("doctors/:id/public")` (PublicDoctorResDTO không có tier) | ✅ |

## 5. Verify

| Check | Kết quả |
|---|---|
| `tsc --noEmit` toàn bộ file Wave 1+2+3 + audit fixes | ✅ 0 error mới |
| `eslint` toàn bộ file mới/sửa | ✅ 0 error, 0 warning |
| Tổng error TS toàn repo | 40 (giữ nguyên baseline pre-existing) |

## 6. Decision đã được audit clarify

| ID | Câu hỏi | Trả lời từ audit |
|---|---|---|
| 9.1 | Shape `GET /tickets/:id/full` | ✅ Confirmed `{ticket, solution, prescription, addenda, rating, broadcasts, abandonLogs}` |
| 9.2 | Admin Ticket Detail có endpoint riêng? | ❌ KHÔNG — reuse shared B8. F3 đã sửa. |
| 9.3 | DQS leaderboard shape | ✅ BE ship đúng `page+limit+date?+tier?` |
| 9.5 | Feature flag key | ✅ `feature.ticket_resolve_quality_v2` lưu trong SystemConfig |
| 9.6 | 8 system-config keys | ✅ Thực ra 9 key (đã thêm `auto_close_notify_at_fraction` ở C6) |
| 9.7 | Withdrawal period source | ✅ Snapshot ở `PrescriptionItem.withdrawalPeriodDays` |
| 9.8 | Realtime payload TS type | ❌ BE chưa share OpenAPI/types nhưng schema FE `.passthrough()` an toàn |
| 9.11 | Snapshot withdrawalPeriodDays | ✅ BE đã có ở response |

## 7. Sẵn sàng E2E test

Khi BE up các endpoint Module 3 (B5/B6/B7/B8/B17 đã có; B14/B15/B16 đã có; B11/B12/B13 đã có; B18 đã có), FE sẽ chạy ngay không cần sửa. WS event 5 mới chờ BE emit từ service ticket-lifecycle (B22/B23 hoặc service tự emit).

**Sẵn sàng Wave 4** (Admin DQS) — BE B14/B15/B16 đã có controller.
