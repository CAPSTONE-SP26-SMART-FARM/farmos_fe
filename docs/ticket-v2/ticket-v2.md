# Ticket V2 — Gap FE Web Dashboard vs BE

> **Phạm vi web (đã chốt 2026-05-09):** Web dashboard CHỈ phục vụ **Admin** ở các vùng:
>
> 1. **Cấu hình Ticket Category** (`TicketCategoryConfig`) — Setup 1.
> 2. **Cấu hình Service Package / Ticket Bundle** — Setup 1b (gắn với gói subscription / mua lẻ owner dùng trên mobile).
> 3. **Commission Rule** — Setup 2.
> 4. **System Config** runtime — Setup 3.
> 5. **DQS monitoring** (read-only) — Setup 4.
> 6. **Admin Operations** trên ticket: view detail, invalidate rating, reports/analytics.
>
> **Clawback KHÔNG integrate trên web FE** (chốt 2026-05-09) — endpoint `POST /admin/tickets/:id/clawback` vẫn tồn tại ở BE để xử lý offline/manual nếu cần, nhưng không có UI trên web. Service `clawback()` + hook `useClawback` ở FE không cần gọi.
>
> **Out of scope cho web:**
> - Owner / Manager **KHÔNG** tạo ticket trên web — tạo ticket là chức năng của **mobile app farmer** (gắn quota từ subscription / ticket bundle).
> - Owner / Manager **KHÔNG** làm runtime ticket flow trên web (cancel, abandon-resolution, close, rate, chat) — toàn bộ đều ở mobile.
> - Doctor không có dashboard web.
>
> **Chỉ thay đổi FE.** Mọi gap liệt kê dưới đây đều fix được phía FE (trừ những item đánh dấu rõ là cần BE phối hợp).
>
> **Tham chiếu BE:** [ticket_flow_walkthrough.md](../../../farm_os_be/docs/issue_logs/fix_issue_ticket_flow/ticket_flow_walkthrough.md)
> **Tham chiếu phân tích cũ:** [ticket_flow_fe_vs_be_analysis.md](../../../farm_os_be/docs/issue_logs/fix_issue_ticket_flow/ticket_flow_fe_vs_be_analysis.md)
> **Ngày cập nhật:** 2026-05-09

---

## 0. TL;DR

Theo scope mới (chỉ Admin), phần lớn gap "owner/manager runtime" trong phân tích cũ **không còn áp dụng cho web**. Các gap còn lại:

| # | Vùng | Gap | Mức ảnh hưởng |
| --- | --- | --- | --- |
| 1 | Admin Operations | Admin detail page subscribe-ticket bị 403 silent → realtime im lặng cho admin | 🟠 Medium (cần BE phối hợp) |
| 2 | Setup Category | Toggle `isActive=false` không pre-validate `describeBlockingResources` → user phải submit mới biết bị block | 🟡 Medium |
| 3 | Reports / Analytics | Không drill-down từ row sang `AdminTicketDetailPage` | 🟢 Low (UX) |
| 4 | Cleanup | Code dangling: `CreateTicketPanel`, `TicketDetailPanelLegacy`, `useEndIncidentTicket`, `useCreateIncidentTicket`, `useCancelTicketV2`, chat panel cho owner/manager, `useClawback` + `clawback()` service… | 🟢 Low (debt) |

---

## 1. Setup phase (BE Mục 0.5) — phạm vi chính của web

### 1.1 Setup 1 — `TicketCategoryConfig`

**BE endpoints:**

| Method | Path | Mục đích |
| --- | --- | --- |
| GET | `/admin/ticket-categories` | List + filter |
| POST | `/admin/ticket-categories` | Tạo category mới |
| PATCH | `/admin/ticket-categories/:id` | Update field |
| PATCH | `/admin/ticket-categories/:id/toggle` | Bật/tắt `isActive` |

**FE coverage:** ✅

- [AdminTicketCategoriesPage.tsx](../../src/pages/AdminPage/TicketCategories/AdminTicketCategoriesPage.tsx)
- [AdminCreateTicketCategoryPage.tsx](../../src/pages/AdminPage/TicketCategories/AdminCreateTicketCategoryPage.tsx)
- Service `ticketCategoryService.ts`

Form đủ field: `code`, `name`, `unitPrice`, `defaultCommissionPercent`, `featureCode`, `eligibleForSubscriptionGrant`, `eligibleForPurchase`, `metadata`. Server tự derive `creditType` (BE Setup 1, cập nhật 2026-05-09 — không cần nhập trên FE).

**Validate FE đã handle:**

- BE 422 `TicketCategoryCodeAlreadyExists` / `TicketCategoryFeatureCodeConflict` / `TicketCategoryCannotChangeFeatureCode` → hiển thị error toast.

**Gap #3 — Toggle off không pre-validate:**

Trước khi PATCH `isActive=false`, BE gọi `describeBlockingResources(id)` đếm 3 nguồn block (`OwnerCredit`, `SubscriptionEntitlement`, `SupportTicket` chưa terminal). FE không gọi endpoint preview này → user submit mới nhận 422 + hint `"Còn N owner đang có balance / M subscription đang cấp / K ticket chưa đóng"`.

**Khắc phục:**
- (a) Đề xuất BE expose `GET /admin/ticket-categories/:id/blocking-resources` (preview).
- (b) FE call trước khi submit toggle, render warning panel "Còn N owner / M subscription / K ticket — bạn vẫn muốn tắt?".
- (c) Nếu BE chưa expose, FE vẫn parse 422 hint và hiển thị inline hợp lý hơn (thay vì toast generic).

### 1.2 Setup 1b — `ServicePackage` (Ticket Bundle)

**BE endpoints (admin):** `POST/PATCH/archive/unarchive /service-packages`.

`ServicePackage` là catalog gói **mua lẻ** owner mua trên mobile để nạp quota vào pool `ticket_cat_{code}` của từng category — gắn trực tiếp với việc farmer tạo ticket trên mobile (nếu owner không có subscription cover category đó).

**FE coverage:** ✅ Admin Service Packages page (verify path khi triển khai). Body schema đúng:

- `packageType: "TICKET_BUNDLE"`
- `categoryConfigId` bắt buộc + phải active + `eligibleForPurchase=true`
- `creditAmount` → server tự tính `price = unitPrice × creditAmount`
- `code` UPPERCASE unique

**Lưu ý FE:** Không cho admin nhập `price` thủ công (BE override luôn — mục đích solvency). FE phải hiển thị price computed read-only sau khi chọn category + creditAmount.

**Mutable sau tạo:** `name`, `description`, `creditAmount`, `metadata`. Khi đổi `creditAmount` → FE refetch để hiện `price` mới.

**Immutable:** `packageType`, `categoryConfigId`, `creditType`, `code` — disable trên form edit.

### 1.3 Setup 2 — `DoctorCommissionRule`

**FE coverage:** ✅

- [AdminCommissionRulesPage.tsx](../../src/pages/AdminPage/CommissionRules/AdminCommissionRulesPage.tsx)
- [AdminCreateCommissionRulePage.tsx](../../src/pages/AdminPage/CommissionRules/AdminCreateCommissionRulePage.tsx)

Hỗ trợ scope `CATEGORY_DEFAULT / DOCTOR_TIER / DOCTOR` (BE đã ghi `OWNER_DOCTOR` không expose UI, đúng với code FE). Date picker `effectiveFrom/To`. Soft-delete OK.

**Validate đã handle:** 422 `CommissionRuleInvalidScope` / `CommissionRuleInvalidEffectiveRange`.

**Versioning convention (BE Setup 2):** admin phải tự làm 2 bước — PATCH rule cũ với `effectiveTo=now`, rồi POST rule mới với `effectiveFrom=now`. FE hiện tại chỉ render 2 form độc lập. **Cải thiện UX (optional):** thêm 1 wizard "Tạo rule kế tiếp" tự động set `effectiveTo` cho rule cũ và mở form mới — giảm khả năng admin tạo 2 rule chồng nhau.

### 1.4 Setup 3 — `SystemConfig`

**FE coverage:** ✅

[AdminTicketSystemConfigsPage.tsx](../../src/pages/AdminPage/SystemConfigs/AdminTicketSystemConfigsPage.tsx) — form group cho key `ticket.*` + `commission.*` + `feature.*`. Whitelist (P3-1) được FE constrain bằng dropdown — không phải lỗi thực tế (admin không gõ key tự do được).

**Lưu ý FE khi PATCH:**
- Body bắt buộc `{value: string, valueType: "number"|"boolean"|"string"|"json"}`. Value luôn là string, BE cast theo `valueType`.
- Nếu admin đổi `feature.ticket_resolve_quality_v2` → cảnh báo "Tắt flag này sẽ kích hoạt panel legacy ở mobile (PUT /end không trigger payout)". *(Sau khi cleanup #5 hoàn tất, cảnh báo này có thể bỏ.)*

**Bảng key cần render đúng UI hint** (BE walkthrough Mục 7) — đã có nhưng kiểm tra:
- `ticket.priority_window.{platinum,gold,fanout}_sec` — input number (giây).
- `ticket.doctor_silence_minutes.{critical,high,medium,low}` — input number (phút) theo severity.
- `ticket.auto_close_hours` — number.
- `ticket.auto_close_notify_at_fraction` — number 0-1 (validate range FE side).
- `commission.max_percent` — number 0-100.
- `commission.tier.{BRONZE,SILVER,GOLD,PLATINUM}` — number 0-100.
- `feature.ticket_resolve_quality_v2` — boolean toggle.
- `ticket.rating_max_stars` — number.

### 1.5 Setup 4 — DQS monitoring (read-only)

**BE endpoints:**

- `GET /admin/doctors/:id/dqs` — snapshot mới nhất.
- `GET /admin/doctors/:id/dqs-history?from=&to=` — history.
- `GET /admin/dqs-leaderboard?date=&tier=` — bảng xếp hạng (admin only).

**FE coverage:** ✅

- [AdminDoctorDqsDetailPage.tsx](../../src/pages/AdminPage/DQS/AdminDoctorDqsDetailPage.tsx) — 5 component score (rating / frequency / SLA / acceptance / online) + tier history.
- [AdminDqsLeaderboardPage.tsx](../../src/pages/AdminPage/DQS/AdminDqsLeaderboardPage.tsx) — filter date + tier.

**Lưu ý:** DQS là read-only. Admin **không có endpoint set tier trực tiếp** — muốn override doctor cụ thể phải tạo `DoctorCommissionRule` scope=DOCTOR. FE không cần thêm action gì.

---

## 2. Admin Operations trên ticket (BE Mục 4)

### 2.1 Admin xem ticket detail — ✅ với caveat realtime

[AdminTicketDetailPage.tsx](../../src/pages/AdminPage/Tickets/AdminTicketDetailPage.tsx) gọi `useAdminTicketFull` → 6 tab (solution, addenda, rating, broadcasts, abandon, payout).

**Gap #2 — Admin realtime 403 silent:**

[useRealtimeTicketDetail.ts:50-51](../../src/hooks/useRealtimeTicketDetail.ts#L50-L51) có comment: *endpoint `subscribe-ticket` chỉ enforce Owner/Manager — Admin sẽ KHÔNG join được room*. Admin mở `AdminTicketDetailPage` → 403 silent → page không auto-refresh khi state đổi (ví dụ doctor vừa resolve, owner vừa close trên mobile). Admin phải reload tay.

**Khắc phục:**
- **Cần BE phối hợp:** mở `subscribe-ticket` cho admin role (có check role) hoặc emit event `ticket.*` lên 1 room admin riêng. Walkthrough Mục 9.8 v2 đã list pending decision.
- **FE-only mitigation tạm thời:** thêm refetch interval ngắn (15-30s) khi page focused, hoặc polling button "Refresh" rõ ràng.

### 2.2 Admin invalidate rating — ✅

[InvalidateRatingModal.tsx](../../src/components/ticket-quality/admin/InvalidateRatingModal.tsx) embed trong tab "Đánh giá", disable khi không có rating hoặc đã invalidated. Khớp BE Mục 4.6.

### 2.3 Admin clawback — ❌ Out of scope cho web FE

**Quyết định 2026-05-09:** Không integrate clawback flow trên web. Endpoint `POST /admin/tickets/:id/clawback` vẫn tồn tại ở BE để xử lý offline/manual nếu cần (ví dụ chạy script hoặc tool nội bộ).

**FE action:** không thêm UI; gỡ service `clawback()` + hook `useClawback` + bất kỳ wire-up nào trong `AdminTicketDetailPage` / `AdminRevenuePage` nếu có (xem cleanup #4).

### 2.4 Reports + Analytics — ✅

- [AdminRevenuePage.tsx](../../src/pages/AdminPage/Revenue/AdminRevenuePage.tsx): cả 2 endpoint `ticket-revenue` và `doctor-commission`.
- [AdminTicketAnalyticsPage.tsx](../../src/pages/AdminPage/TicketAnalytics/AdminTicketAnalyticsPage.tsx): KPI strip + over-time chart + status/severity distribution + critical tickets table + so sánh kỳ trước.

**Gap #3 (UX low):** report rows không link sang `AdminTicketDetailPage`. Add link cell "Xem ticket" → `/dashboard/admin/tickets/:id` để admin click thẳng từ report sang detail.

---

## 3. Realtime events — phạm vi web (Admin)

| Event BE phát | Web Admin cần subscribe? | Trạng thái FE |
| --- | --- | --- |
| `ticket.assigned` / `ticket.resolved` / `ticket.closed` | ✅ Cho admin detail page tự refresh | ⚠️ Bị 403 (Gap #1) |
| `prescription.incident.created` | ✅ Refresh prescription tab | ⚠️ Bị 403 (Gap #1) |
| `doctor.wallet.credited` | ✅ Refresh payout tab | ⚠️ Bị 403 (Gap #1) |
| `ticket.broadcast` / `ticket.incident.accepted` | ❌ — event cho doctor mobile | N/A |
| `ticket.fallback-required` / `ticket.abandon.*` | ❌ — owner/manager flow trên mobile | N/A |
| `ticket.message.created` | ❌ — chat mobile-only | N/A |
| `wallet.clawback` | ❌ — event cho doctor mobile | N/A |

→ Tất cả gộp về Gap #1: **subscribe-ticket cho admin** (cần BE phối hợp). Sau khi BE mở, FE chỉ cần xoá guard role trong `useTicketSubscription` (hoặc relax điều kiện).

---

## 4. Schema contract — kiểm tra

| Schema FE | File | Match BE | Verdict |
| --- | --- | --- | --- |
| `CreateTicketCategoryBodySchema` | `schemaValidatation/ticketCategory.ts` | Khớp BE (không có `creditType`) | ✅ |
| `CreateServicePackageBodySchema` | `schemaValidatation/servicePackage.ts` | `{packageType, code, name, creditAmount, categoryConfigId, metadata?}` | ✅ |
| `CreateCommissionRuleBodySchema` | `schemaValidatation/commissionRule.ts` | Khớp scope + date range | ✅ |
| `PatchSystemConfigBodySchema` | `schemaValidatation/systemConfig.ts` | `{value: string, valueType, description?}` | ✅ |

Clawback schema không cần — flow này không integrate trên web.

---

## 5. Cleanup code dangling sau scope change (Gap #4)

Sau quyết định 2026-05-09 (web không tạo ticket, không có chat, không có runtime owner/manager), các file/symbol sau **không còn entry-point UI hợp lệ** và nên xoá để giảm noise + risk:

| Symbol / File | Lý do gỡ |
| --- | --- |
| `CreateTicketPanel` trong `OwnerTicketsPage.tsx` / `ManagerTicketsPage.tsx` | Không có button nào navigate vào; chỉ reachable qua URL `?milestoneId=...` |
| `useCreateIncidentTicket` hook | Endpoint legacy, sai schema (không có `categoryConfigId`) |
| `useCreateTicketV2` hook | Có nhưng 0 call site — tạo ticket là mobile |
| `TicketDetailPanelLegacy` + nút "Kết thúc ticket" | Web không làm runtime ticket flow — toàn bộ là mobile |
| `useEndIncidentTicket` | `PUT /ticket/incident/:id/end` không trigger payout, dễ gây nhầm |
| `useCancelTicketV2` | Web không cancel ticket — mobile làm |
| `TicketDetailPanelV2` (phần action: AbandonResolutionModal, CloseAndRateModal, chat) | Owner/manager runtime mobile-only |
| `AbandonResolutionModal`, `CloseAndRateModal` | Mobile-only |
| `useTicketMessages`, chat panel components | Mobile-only |
| `useClawback` + `clawback()` service + bất kỳ wire-up nào | Clawback không integrate trên web (xử lý offline) |
| `OwnerTicketsPage.tsx` / `ManagerTicketsPage.tsx` (toàn bộ) | Cần PO confirm: nếu owner/manager còn cần *xem* ticket trên web (read-only audit) thì giữ list view; còn không thì gỡ luôn route |

**Khắc phục:**

1. Confirm với PO: owner/manager có cần read-only ticket list trên web không? (ví dụ để xem hóa đơn / lịch sử mua bundle / audit ticket gắn với farm của mình).
2. Nếu **KHÔNG**: gỡ toàn bộ `OwnerPage/Tickets/*`, `ManagerPage/Tickets/*`, các hook + component liên quan.
3. Nếu **CÓ**: giữ lại list + detail read-only (loại bỏ hết action button), gỡ chat + create + close + cancel UI.

---

## 6. Action items — chỉ thay đổi FE

### Sprint hiện tại — Medium

1. **[Gap #2] Toggle category off pre-validate:**
   - (Cần BE) đề xuất `GET /admin/ticket-categories/:id/blocking-resources` preview.
   - FE wire warning panel trước khi submit toggle.
   - Tạm thời: parse 422 hint message để hiện inline.
2. **[Gap #1] Admin realtime detail:**
   - (Cần BE) phối hợp mở `subscribe-ticket` cho admin.
   - Tạm thời FE: thêm refetch interval khi page focused.

### Backlog — Low

3. **[Gap #3]** Drill-down Reports/Analytics rows → `AdminTicketDetailPage`.
4. **[Gap #4] Cleanup code dangling:**
   - Confirm PO: owner/manager có cần read-only ticket view trên web không?
   - Gỡ các symbol theo bảng Mục 5 (gồm cả `useClawback` + `clawback()` service).

### Optional UX cho Setup phase

6. Wizard "Tạo commission rule kế tiếp" tự động set `effectiveTo` cho rule cũ (giảm khả năng tạo rule chồng).
7. Trong `AdminTicketSystemConfigsPage`, validate range FE-side cho `auto_close_notify_at_fraction` (0-1) và `commission.max_percent` (0-100) thay vì chỉ chờ 422.

---

## 7. Kết luận

Theo scope mới (web = Admin only):

- **Setup 1, 1b, 2, 3, 4:** ✅ đã đầy đủ. Cải thiện chỉ ở mức UX (toggle pre-validate, wizard rule versioning, validate range).
- **Admin Operations:**
  - View ticket detail + invalidate rating + reports/analytics: ✅.
  - **Clawback:** out of scope cho web FE — xử lý offline qua endpoint BE nếu cần.
  - Admin realtime detail bị 403 silent → cần BE phối hợp.
- **Owner/Manager runtime + chat trên web:** out of scope. Code dangling cần cleanup khi confirm PO.

**Khuyến nghị:** ưu tiên Gap #1 (Admin realtime, cần BE) + Gap #2 (toggle pre-validate) trong sprint sắp tới; cleanup code (#4) sau khi PO confirm có cần giữ owner/manager read-only view không.
