# Module 3 — Wave 4 (Admin DQS) — Handoff

> Đối chiếu: [ticket-quality-implementation-plan.md](./ticket-quality-implementation-plan.md) v2 mục 5.4 (A4/A5/A6).
> Tiếp nối: [wave-3-handoff.md](./wave-3-handoff.md) + [wave-3-audit-fixes.md](./wave-3-audit-fixes.md).

## 1. Trạng thái Wave 4

**Hoàn thành 100%** — A4 Leaderboard + A5 Doctor DQS Detail + A6 redirect. Schema khớp BE Module 3 DQS source 1-1 (audit Wave 4 đã sửa 13 lệch — xem mục 3).

| Verify | Kết quả |
|---|---|
| `tsc --noEmit` Wave 4 files | ✅ 0 error |
| `eslint` Wave 4 files | ✅ 0 error, 0 warning |
| Tổng error TS toàn repo | 40 (giữ nguyên baseline pre-existing) |

> BE B14/B15/B16 đã ship controller (`farm_os_be/src/modules/dqs/`). Khi cron B21 chạy ≥ 1 đêm, FE chạy ngay không cần sửa.

## 2. File mới + sửa (Wave 4)

### Tạo mới
```
src/pages/AdminPage/DQS/
  AdminDqsLeaderboardPage.tsx              ← A4 — strip 4 StatCard tier + Tabs filter + table sortable
  AdminDoctorDqsDetailPage.tsx             ← A5 — Tabs Tổng quan (5 KpiCard tooltip) + Lịch sử (date range + table)
```

### Sửa
| File | Phạm vi |
|---|---|
| [src/schemaValidatation/dqs.ts](../../src/schemaValidatation/dqs.ts) | Rewrite hoàn toàn match BE: `frequencyScore` (không `workloadScore`), score là `number` (không nullable), `computedAt` thay `createdAt`, có `windowDays`, bỏ `doctor` join, `DoctorDqsDetailResSchema` lồng `{doctorId, latest}`, history + leaderboard `{data:[]}` không pagination, queries strict không page/limit. |
| [src/schemaValidatation/doctorPublic.ts](../../src/schemaValidatation/doctorPublic.ts) | Rewrite — chỉ 4 field flat: `id, avgRating, totalResolvedTickets, specialization`. **KHÔNG** có `fullName/email/avatarUrl` (BE flat). Wave 5 P1 widget phải fetch User profile riêng nếu cần tên. |
| [src/services/dqsService.ts](../../src/services/dqsService.ts) | Bỏ pagination khỏi query, comment giải thích flat array. |
| [src/queries/useDqs.ts](../../src/queries/useDqs.ts) | Comment correction ("không pagination — FE filter client-side"). |
| [src/constants/ticketQualityLabels.ts](../../src/constants/ticketQualityLabels.ts) | Thêm `DQS_SUBSCORE_LABEL`, `DQS_SUBSCORE_WEIGHT`, `DQS_SUBSCORE_HINT` (5 sub-score tiếng Việt + trọng số + tooltip giải thích BR-79). |
| [src/pages/AdminPage/DoctorPerformance/AdminDoctorPerformancePage.tsx](../../src/pages/AdminPage/DoctorPerformance/AdminDoctorPerformancePage.tsx) | Replace mock 23 dòng → `<Navigate to="/dashboard/admin/dqs/leaderboard" replace />` (A6). |
| [src/routes/routes.ts](../../src/routes/routes.ts) | Thêm 2 route Admin: `/dashboard/admin/dqs/leaderboard` (A4), `/dashboard/admin/doctors/:id/dqs` (A5). |

> Sidebar items đã thêm ở Wave 2 (mục 5.8 v2 doc) — A4 + A2 freetext stats nằm trong group "Phân tích".

## 3. Audit Wave 4 — 13 schema mismatches đã sửa

| # | FE cũ (sai) | BE thực | Hành xử |
|---|---|---|---|
| D1 | `workloadScore` | `frequencyScore` | Rename |
| D2 | Tất cả sub-score `nullable()` | `number` (không nullable) | Bỏ `.nullable()` |
| D3 | `totalScore.nullable()` | `number` | Bỏ |
| D4 | `createdAt` | `computedAt` | Rename |
| D5 | Thêm `doctor` join object | KHÔNG join, flat | Bỏ |
| D6 | DoctorDqsDetail trả flat snapshot | `{doctorId, latest: snapshot \| null}` | Lồng `latest` |
| D7 | `LeaderboardRowSchema` chưa có | BE có row schema riêng có `doctorName, snapshotDate, tier, totalScore, 5 sub-score` | Thêm |
| D8 | Leaderboard `PagingResponseSchema` | `{data: [...]}` flat | Bỏ pagination |
| D9 | Leaderboard query `page+limit+date+tier` | chỉ `date+tier` `.strict()` | Bỏ page/limit |
| D10 | History `PagingResponseSchema` | `{data: [...]}` flat | Bỏ pagination |
| D11 | History query `page+limit+from+to` | chỉ `from+to` `.strict()` | Bỏ page/limit |
| D12 | Thiếu `windowDays` | có `windowDays: int` | Thêm |
| D13 | DoctorPublic có `fullName/email/avatarUrl` | chỉ `id, avgRating, totalResolvedTickets, specialization` | Bỏ field thừa |

## 4. UX Pattern A4 — Leaderboard

- **Date filter** (server-side): gửi BE qua `?date=YYYY-MM-DD`. Empty → BE dùng latest snapshot.
- **Tier filter** (client-side): Tabs "Tất cả / PLATINUM / GOLD / SILVER / BRONZE" — không re-fetch để giữ count strip 4 StatCard đầy đủ.
- **Search** (client-side): tìm theo `doctorName` hoặc `doctorId` substring.
- **Sort**: tự động theo `totalScore` desc.
- **Strip 4 StatCard**: `Bạch kim/Vàng/Bạc/Đồng` với count từ `allRows` (không bị tier filter), tone success/warning/default.
- **Row click**: navigate `/dashboard/admin/doctors/:id/dqs` (A5).
- **Empty state**: phân biệt "Chưa có dữ liệu DQS" vs "Không có bác sĩ phù hợp bộ lọc".
- **No pagination** — BE không cung cấp; FE hiển thị "X/Y bác sĩ" cuối table.

## 5. UX Pattern A5 — Doctor DQS Detail

- **Header**: avatar back button + tên page + doctorId mono.
- **Tab Tổng quan**:
  - Card "Hạng hiện tại" — totalScore lớn 4xl + Badge tier solid + meta (snapshotDate, windowDays, computedAt).
  - Card "Phân tích 5 tiêu chí" — 5 KpiCard (Star / TrendingUp / Target / Gauge / Clock) với Tooltip giải thích trọng số.
  - Tone KpiCard: ≥80 success, ≥50 warning, <50 danger.
- **Tab Lịch sử**:
  - 2 DatePickerField from + to (sau extract W1.9 L4) + button "Xoá lọc". `to.minDate` constrained bởi `from`.
  - Table sortable theo `snapshotDate` desc client-side.
  - Hiển thị tier + 5 sub-score + totalScore từng ngày.
- **Edge case**: `latest === null` → EmptyState "Chưa có snapshot DQS — bác sĩ mới <30 ngày hoặc cron chưa chạy".
- **Loading**: `LoadingCard` cho detail; nested loading cho history.
- **Error**: `Alert variant="destructive"` với `getApiErrorMessageVi`.

## 6. BE prerequisites Wave 4

| BE | Status | FE behaviour |
|---|---|---|
| Controller B14/B15/B16 | ✅ Đã ship | A4/A5 chạy được |
| Cron B21 nightly DQS calculator | Pending | Chưa chạy → BE có thể trả empty list / `latest: null`. FE EmptyState hiển thị đúng. |
| WS `dqs.tier_changed` | Pending | A4 chưa subscribe (defer khỏi W4 — Wave 5 polish thêm nếu cần auto-refresh leaderboard). |

## 7. Rule enforced (BR-79, BR-81)

- **BR-79** 5 sub-score weight: `rating 40% / frequency 20% / sla 20% / acceptance 10% / online 10%` — KpiCard label hiển thị `(40%)` + Tooltip giải thích.
- **BR-81** Tier chỉ Admin xem — A4/A5 đều chỉ accessible qua role `admin` (`allowedRoles: [RoleName.Admin]`). KHÔNG có endpoint nào FE expose tier cho Owner/Manager.
- **No gradient** — TIER_BADGE_CLASS solid: amber/zinc/yellow/cyan với opacity.

## 8. Senior QA audit pass — kết luận

> Audit Wave 4 sau ship: **production-ready**. 0 critical bug. Chi tiết:

### 8.1 API contract — 100% match BE

| Verify | Kết quả |
|---|---|
| 3/3 endpoint path match BE controller decorators | ✅ |
| Query params (`from/to/date/tier`) match BE Zod `.strict()` | ✅ |
| `queryString.stringify` config `skipNull + skipEmptyString` không gửi empty string → BE strict OK | ✅ |
| Response shape: `DqsSnapshot` 12 field, `LeaderboardRow` 10 field, `DoctorDqsDetail.{doctorId, latest}`, `PublicDoctor` 4 field — tất cả match | ✅ |
| BE business rule: `latest` null khi doctor mới <30 ngày hoặc cron chưa chạy | FE EmptyState xử lý đúng |
| BE default date logic: `?date=` trống → BE auto-chọn snapshot mới nhất | FE comment giải thích, không gửi empty string |
| Tier filter client-side để giữ count strip đầy đủ | ✅ Đúng intent design |

### 8.2 UX polish (đã sửa sau audit)

| Issue | Fix |
|---|---|
| ⚠️ A4 empty state copy quá generic ("Vui lòng quay lại sau") | Phân biệt 2 case: (a) `dateFilter` set + empty → "Hệ thống chưa có snapshot cho ngày này, thử ngày khác"; (b) `dateFilter` trống + empty → "Cron chạy ~1 giờ sáng. Quay lại sau hoặc bấm Làm mới". |
| ⚠️ A4 không tự refresh khi cron đêm chạy (BE chưa emit `dqs.tier_changed`) | Thêm Button refresh thủ công ở header (icon `RefreshCw` animate khi `isFetching`). |
| ⚠️ A5 date range UX unclear khi from > to | DatePickerField helperText động: từ-ngày "Để trống = tất cả lịch sử"; đến-ngày `Phải ≥ {from formatted}` khi from chọn. Nếu user đổi `from` mới > `to` cũ → auto reset `to`. Nút "Xoá lọc" disable khi cả 2 trống. |

### 8.3 Pending BE-side (không phải bug)

- 🟡 BE cron `dqs-calculator.job.ts` upsert snapshot mới nhưng KHÔNG emit realtime event → A4 không tự refresh. FE đã chấp nhận behavior này + cung cấp manual refresh button. Nếu BE bổ sung event `dqs.tier_changed`, FE sẽ subscribe thêm trong Wave 5 polish.

### 8.4 Verify final

| Check | Kết quả |
|---|---|
| `tsc --noEmit` Wave 4 + post-audit fixes | ✅ 0 error mới |
| `eslint` Wave 4 + post-audit | ✅ 0 error, 0 warning |
| Tổng error TS toàn repo | 40 (giữ nguyên baseline) |

## 9. Sequencing tiếp theo

| Wave | Phụ thuộc BE | FE deliverable | Estimate |
|---|---|---|---|
| **W5 — Polish** | B17 (đã có), B19 (đã có), B22 + B23 (cron + timer) | A7 InvalidateRatingModal + A8 AdminTicketDetailPage + A9 CommissionRules tab scope + P1 DoctorPublicProfile widget + drill-down từ TicketAnalytics → A8 + (optional) WS subscribe `dqs.tier_changed` cho A4 auto-refresh | 1 tuần |
