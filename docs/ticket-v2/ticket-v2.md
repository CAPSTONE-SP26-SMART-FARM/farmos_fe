# Ticket V2 — Gap FE (web dashboard) vs BE

> **Phạm vi:** Web dashboard (`farmos_fe/`) cho 3 vai trò có dashboard: **admin / owner / manager**. Doctor + farmer là mobile-only — out of scope. **Tham chiếu BE:** [ticket_flow_walkthrough.md](../../../farm_os_be/docs/issue_logs/fix_issue_ticket_flow/ticket_flow_walkthrough.md) **Tham chiếu phân tích chi tiết:** [ticket_flow_fe_vs_be_analysis.md](../../../farm_os_be/docs/issue_logs/fix_issue_ticket_flow/ticket_flow_fe_vs_be_analysis.md) **Ngày cập nhật:** 2026-05-09

---

## 0. TL;DR — đọc trước

**Cập nhật scope (2026-05-09):**

- Web dashboard ĐÃ GỠ BỎ luồng _tạo ticket_ cho cả Owner và Manager (Admin chưa từng có). Tạo ticket hiện hoàn toàn thuộc mobile (farmer / manager / owner mobile).
- **Web KHÔNG có chat** giữa owner/manager và doctor — chat là mobile-only. Mọi gap liên quan tới `ticket.message.created`, `clientMessageId`, render chat panel… đều **không áp dụng** cho web.
- Web dashboard chỉ còn **xem + quản lý** ticket: cancel, abandon-resolution, close + rate, clawback (admin), reports/analytics.

→ Các gap "tạo ticket sai endpoint" + "chat realtime/idempotent" trong phân tích cũ **không còn áp dụng cho web** — mobile cần được audit riêng. Code `CreateTicketPanel` còn nằm trong `OwnerTicketsPage.tsx` / `ManagerTicketsPage.tsx` nhưng không có entry-point UI; chỉ reachable qua URL `?milestoneId=...`. Đề xuất xoá code dangling.

**Các gap đang ảnh hưởng web dashboard:**

| # | Gap | Mức ảnh hưởng |
| --- | --- | --- |
| 1 | Owner không có nút **Cancel V2** (refund nguồn) khi ticket ở trạng thái `open` | 🔴 High |
| 2 | `AbandonResolutionModal` render conditionally `{isResolved && isCreator}` → khi worker reset về OPEN modal **không tồn tại trong DOM** | 🔴 High |
| 3 | FE không đọc `pendingFallbackChoice` (P2-2) → owner offline-online không thấy modal | 🔴 High |
| 4 | **Admin Clawback**: 0 UI để gọi; service signature có thể sai (POST trống body, BE muốn `{reason}`) | 🔴 High (tài chính) |
| 5 | Legacy `TicketDetailPanel` còn dùng `PUT /ticket/incident/:id/end` — không trigger payout. Khi flag `feature.ticket_resolve_quality_v2` tắt, doctor sẽ không nhận tiền | 🟠 Medium-High |
| 6 | Admin detail page subscribe-ticket bị 403 silent → realtime im lặng cho admin | 🟠 Medium (BE-side decision) |
| 7 | Toggle category off không pre-validate `describeBlockingResources` | 🟡 Medium |
| 8 | Không subscribe `ticket.abandon.refunded` / `ticket.abandon.fallback_ai` (toast UX) | 🟢 Low |
| 9 | Reports không drill-down sang `AdminTicketDetailPage` | 🟢 Low (UX) |

---

## 1. Đối chiếu với từng bước trong walkthrough BE

### 1.1 Setup phase (BE Mục 0.5) — ✅ Đầy đủ

| BE feature | FE coverage | File / Bằng chứng |
| --- | --- | --- |
| `POST/PATCH/toggle /admin/ticket-categories` | ✅ | [AdminTicketCategoriesPage.tsx](../../src/pages/AdminPage/TicketCategories/AdminTicketCategoriesPage.tsx), [AdminCreateTicketCategoryPage.tsx](../../src/pages/AdminPage/TicketCategories/AdminCreateTicketCategoryPage.tsx) |
| `POST/PATCH/DELETE /admin/commission-rules` | ✅ | [AdminCommissionRulesPage.tsx](../../src/pages/AdminPage/CommissionRules/AdminCommissionRulesPage.tsx), [AdminCreateCommissionRulePage.tsx](../../src/pages/AdminPage/CommissionRules/AdminCreateCommissionRulePage.tsx). Hỗ trợ scope `CATEGORY_DEFAULT / DOCTOR_TIER / DOCTOR` đúng spec |
| `PATCH /admin/system-configs/:key` | ✅ | [AdminTicketSystemConfigsPage.tsx](../../src/pages/AdminPage/SystemConfigs/AdminTicketSystemConfigsPage.tsx). Whitelist enforced bằng dropdown |
| `GET /admin/doctors/:id/dqs` + `dqs-history` | ✅ | [AdminDoctorDqsDetailPage.tsx](../../src/pages/AdminPage/DQS/AdminDoctorDqsDetailPage.tsx) |
| `GET /admin/dqs-leaderboard` | ✅ | [AdminDqsLeaderboardPage.tsx](../../src/pages/AdminPage/DQS/AdminDqsLeaderboardPage.tsx) |
| `POST/PATCH /service-packages` (ticket bundle catalog) | ✅ | Admin Service Packages page |

**Gap UX nhỏ:** trước khi PATCH `isActive=false` cho category, FE không gọi `describeBlockingResources` → user phải submit mới nhận 422 + hint từ BE. (Gap #7)

### 1.2 Bước 1 — Tạo ticket (`POST /tickets`) — N/A (mobile-only)

Web đã gỡ entry-point tạo ticket. Code `CreateTicketPanel` còn dangling trong [OwnerTicketsPage.tsx](../../src/pages/OwnerPage/Tickets/OwnerTicketsPage.tsx) / [ManagerTicketsPage.tsx](../../src/pages/ManagerPage/Tickets/ManagerTicketsPage.tsx) — đề xuất dọn.

### 1.3 Bước 4 — Chat (`POST /ticket/:id/messages`) — N/A (mobile-only)

Web không có UI chat giữa owner và doctor — toàn bộ luồng nhắn tin diễn ra trên mobile. Hệ quả:

- Không cần generate `clientMessageId` ở web.
- Không cần subscribe WS `ticket.message.created`.
- `useTicketMessages` nếu có ở web chỉ phục vụ view-only audit log (nếu sau này thêm), không phải gửi.

### 1.4 Bước 4c — Owner chọn fallback (`POST /tickets/:id/abandon-resolution`) — 🔴 Bug render

- Service [ticketService.ts:132-136](../../src/services/ticketService.ts#L132-L136) đúng body `{resolution, note?}`.
- Modal [AbandonResolutionModal.tsx](../../src/components/ticket-quality/AbandonResolutionModal.tsx) UX OK với 2 lựa chọn `FALLBACK_AI` / `REFUND_TICKET`.

**Bug 1 (Gap #2) — render conditionally sai timing:** [TicketDetailPanelV2.tsx:525-535](../../src/components/ticket-quality/TicketDetailPanelV2.tsx#L525-L535) bọc modal trong `{isResolved && isCreator && (...)}`. Khi BE worker reset ticket (Bước 4b), status quay về `OPEN` → `isResolved=false` → modal **không tồn tại trong DOM**, dù callback `onFallbackRequired` đã gọi `setAbandonModalOpen(true)`. State đổi nhưng UI không hiện.

**Bug 2 (Gap #3) — không dùng `pendingFallbackChoice`:** flag P2-2 BE thêm để FE biết khi user mở lại detail (sau khi miss WS) cần show modal. Grep `pendingFallbackChoice` toàn `farmos_fe/src` → 0 match. Khi owner offline lúc worker reset rồi quay lại web → không thấy modal mà cũng không có dấu hiệu nào trên UI.

**Khắc phục:**

1. Move modal ra ngoài điều kiện — luôn render khi `isCreator`.
2. Trigger mở modal khi `pendingFallbackChoice === true` (lấy từ `useTicketFull`) HOẶC khi nhận WS `ticket.fallback-required`.
3. Cập nhật schema `TicketBasicResSchema` / `TicketFullResSchema` thêm `pendingFallbackChoice: z.boolean().optional()` để zod không strip.

### 1.5 Bước 8 — Owner close (`POST /tickets/:id/close`) — ⚠️ Phụ thuộc flag

- [CloseAndRateModal.tsx](../../src/components/ticket-quality/CloseAndRateModal.tsx) gọi `closeByCreator` (đúng V2) → flow 2-step (review → rate).
- Modal **chỉ render** trong `TicketDetailPanelV2`. Panel V2 chỉ active khi feature flag bật ([OwnerTicketsPage.tsx:137-149](../../src/pages/OwnerPage/Tickets/OwnerTicketsPage.tsx#L137-L149)).
- Legacy panel chỉ có nút "Kết thúc ticket" → gọi `useEndIncidentTicket` (`PUT /ticket/incident/:id/end`) — endpoint legacy **không trigger payout** (đã có comment cảnh báo trong [ticketService.ts:111-112](../../src/services/ticketService.ts#L111)).
- **Hệ quả (Gap #5):** Nếu admin tắt flag `feature.ticket_resolve_quality_v2`, owner đóng ticket nhưng bác sĩ KHÔNG nhận tiền.
- **Khắc phục:** Hoặc xóa hẳn legacy panel (force flag = true), hoặc thay nút "Kết thúc" bằng `closeByCreator`. Confirm với PO xem có scenario nào thực sự cần tắt flag không.

### 1.6 Bước 10 — Rating (`POST /tickets/:id/rating`) — ✅

- Bundled trong `CloseAndRateModal` step 2; AI ticket skip rate (đúng BR-79).
- Service: [ticketService.ts:127-128](../../src/services/ticketService.ts#L127-L128).

### 1.7 Bước 11 — Detail (`GET /tickets/:id/full`) — ⚠️

- V2 panel sử dụng `useTicketFull` hiển thị: ticket info, solution, prescription, addenda, rating, broadcasts, [AutoCloseCountdown.tsx](../../src/components/ticket-quality/AutoCloseCountdown.tsx), payment summary.
- **Thiếu** đọc trường `pendingFallbackChoice` trong response (xem 1.4 Bug 2).

### 1.8 Mục 4.1 — Owner cancel khi `open` (`POST /tickets/:id/cancel`) — 🔴 Không có UI

- Service + hook đầy đủ: [ticketV2Service.ts:28-29](../../src/services/ticketV2Service.ts#L28-L29), [useTicketV2.ts:71](../../src/queries/useTicketV2.ts#L71).
- **0 call site** trong toàn FE.
- Legacy panel có nút "Kết thúc" gọi `endIncident` (`PUT /end`), **đó là end-of-chat khác bản chất, không refund nguồn quota.**
- Walkthrough §9.1 cheat-sheet ghi rõ: "Status `open` → nút **Hủy ticket** gọi `POST /tickets/:id/cancel` (refund nguồn)". FE không có nút này.
- **Khắc phục (Gap #1):** thêm button "Hủy ticket" trong `TicketDetailPanelV2` cho creator khi `status === 'open'`, gọi `useCancelTicketV2`.

---

## 2. Admin operations (BE Mục 4)

### 2.1 Admin xem ticket detail — ✅ (với caveat realtime)

- [AdminTicketDetailPage.tsx](../../src/pages/AdminPage/Tickets/AdminTicketDetailPage.tsx) gọi `useAdminTicketFull` → 6 tab (solution, addenda, rating, broadcasts, abandon, payout).
- **Gap #6 — Admin realtime 403 silent:** [useRealtimeTicketDetail.ts:50-51](../../src/hooks/useRealtimeTicketDetail.ts#L50-L51) có comment "endpoint subscribe-ticket chỉ enforce Owner/Manager — Admin sẽ KHÔNG join được room". Admin mở `AdminTicketDetailPage` → 403 silent → page không auto-refresh khi state đổi. Phải reload tay.
- **Khắc phục:** cần BE quyết định mở subscribe-ticket cho admin (có check role) hoặc emit event `ticket.*` lên 1 room admin riêng. Walkthrough Mục 9.8 v2 đã list pending.

### 2.2 Admin invalidate rating (`POST /admin/tickets/:id/invalidate-rating`) — ✅

- [InvalidateRatingModal.tsx](../../src/components/ticket-quality/admin/InvalidateRatingModal.tsx) embed trong tab "Đánh giá", disable khi không có rating hoặc đã invalidated.

### 2.3 Admin clawback (`POST /admin/tickets/:id/clawback`) — 🔴 Không có UI (Gap #4)

- Service: [ticketAdminOpsService.ts:25-26](../../src/services/ticketAdminOpsService.ts#L25-L26). **Note:** signature là `clawback(ticketId)` — KHÔNG nhận body. Walkthrough Mục 4.4 và 9.0 thì viết `body: {reason}`. → Cần verify lại endpoint BE; nếu BE bắt buộc `reason` thì FE service hiện tại sai signature (gửi POST trống body) → có thể 422 silent.
- Hook: `useClawback` trong [useAdminTicketReports.ts](../../src/queries/useAdminTicketReports.ts).
- Tab "Thanh toán" trong `AdminTicketDetailPage` ([dòng 340-404](../../src/pages/AdminPage/Tickets/AdminTicketDetailPage.tsx#L340-L404)) chỉ hiển thị `payoutAt`, `unitPriceSnapshot`, `payout %`, `tier` — **0 nút action**.
- Revenue page cũng không có row-action.

**Khắc phục:**

1. Verify body contract với BE.
2. Sửa service signature: `clawback(ticketId, body: {reason: string})`.
3. Thêm button "Thu hồi hoa hồng" ở tab Thanh toán (chỉ enable khi `t.payoutAt && !t.isAIResolved`). Modal nhập `reason`.
4. (Optional) row-action ở `AdminRevenuePage`.

### 2.4 Reports + Analytics — ✅

- [AdminRevenuePage.tsx](../../src/pages/AdminPage/Revenue/AdminRevenuePage.tsx): cả 2 endpoint `ticket-revenue` và `doctor-commission`.
- [AdminTicketAnalyticsPage.tsx](../../src/pages/AdminPage/TicketAnalytics/AdminTicketAnalyticsPage.tsx): KPI strip + over-time chart + status/severity distribution + critical tickets table + so sánh kỳ trước.
- **Gap #9 (UX low):** report rows không drill-down sang `AdminTicketDetailPage`. Khi gap clawback (#4) được fix, drill-down sẽ giá trị hơn.

---

## 3. Realtime events (BE Mục 5)

| Event BE phát | FE web subscribe | File hook | Verdict |
| --- | --- | --- | --- |
| `ticket.incident.created` | ✅ Owner/Manager list | [useRealtimeTicket.ts:115](../../src/hooks/useRealtimeTicket.ts#L115) | OK |
| `ticket.incident.ended` | ✅ | useRealtimeTicket.ts:116 | OK |
| `ticket.broadcast` | ❌ | — | OK — event cho doctor mobile |
| `ticket.incident.accepted` | ❌ | — | OK — event cho doctor mobile |
| `ticket.assigned` | ✅ | useRealtimeTicket + useRealtimeTicketDetail | OK |
| `ticket.message.created` | ❌ | — | N/A — web không có chat |
| `ticket.fallback-required` | ✅ Detail; modal render bug | useRealtimeTicketDetail.ts:91-97 | **Gap #2** |
| `ticket.abandon.refunded` | ❌ | — | **Gap #8** UX miss |
| `ticket.abandon.fallback_ai` | ❌ | — | **Gap #8** |
| `ticket.resolved` | ✅ | useRealtimeTicketDetail.ts:75 | OK |
| `ticket.closed` | ✅ | useRealtimeTicketDetail.ts:82 | OK |
| `prescription.incident.created` | ✅ | useRealtimeTicketDetail.ts:109 | OK |
| `doctor.wallet.credited` | ✅ | useRealtimeTicketDetail.ts:100 | OK |
| `wallet.clawback` | ❌ | — | OK — event cho doctor mobile |

**Subscription pipeline:** [useTicketSubscription.ts](../../src/hooks/useTicketSubscription.ts) gọi `POST /socket/subscribe-ticket`. BE enforce Owner/Manager → Admin bị 403 silent (Gap #6).

---

## 4. Schema contract — kiểm tra

| Schema FE | File | Match BE | Verdict |
| --- | --- | --- | --- |
| `AbandonTicketBodySchema` | `schemaValidatation/abandonLog.ts` | `{resolution, note?}` | ✅ |
| `CloseTicketBodyType` | `schemaValidatation/ticket.ts` | `{confirmed?, note?}` | ✅ |
| `SubmitRatingBodyType` | `schemaValidatation/rating.ts` | `{stars, feedback?, tags?}` | ✅ |
| `clawback` body | `services/ticketAdminOpsService.ts:25-26` | **POST trống body** — BE walkthrough Mục 4.4 nói `{reason}` | ❌ verify |
| `TicketFullResType.ticket.pendingFallbackChoice` | cần thêm vào schema | — | ❌ thiếu |

**Hành động:** kiểm tra schema `TicketBasicResSchema` / `TicketFullResSchema` xem có khai `pendingFallbackChoice` không. Nếu thiếu → BE trả nhưng FE strip silent.

---

## 5. Đối chiếu với "Quy ước cho FE/Mobile" (BE Mục 9)

| BE expectation (Mục 9.1) | FE web hiện tại | Verdict |
| --- | --- | --- |
| `open` → nút "Hủy ticket" gọi `POST /tickets/:id/cancel` | Không có nút | ❌ Gap #1 |
| `assigned/in_progress` → ẩn Hủy, chỉ "Yêu cầu đổi" sau khi worker reset | Legacy có "Kết thúc" (sai endpoint) | ❌ Gap #5 |
| `resolved` → "Xác nhận đóng" gọi `POST /tickets/:id/close` | V2 panel ✅ (phụ thuộc flag) | ⚠️ Gap #5 |
| `closed` → "Đánh giá" | Trong CloseAndRate modal step 2 | ✅ |
| Mỗi load detail check `pendingFallbackChoice` → modal bắt buộc | Không check | ❌ Gap #3 |
| Đọc `commissionPercentSnapshot` từ `GET /tickets/:id` (v2) | Admin detail page có dùng `payoutPercentSnapshot`, không hiển thị `commissionPercentSnapshot` | ⚠️ |
| Hiển thị "Bạn có ~N phút để bắt đầu phản hồi" theo severity | Spec mobile (doctor) — không áp dụng web | N/A |
| Chat owner ↔ doctor (`POST /ticket/:id/messages`) | Mobile-only — không áp dụng web | N/A |

---

## 6. Action items đề xuất cho FE team (theo thứ tự ưu tiên)

### Sprint hiện tại — Critical / High (rủi ro logic + tài chính)

1. **[Gap #1] Thêm nút Cancel V2** trong `TicketDetailPanelV2` cho creator khi `status === 'open'`. Wire `useCancelTicketV2` (đã sẵn).
2. **[Gap #2 + #3] Sửa `TicketDetailPanelV2`** — luôn render `AbandonResolutionModal` khi `isCreator`; trigger từ `pendingFallbackChoice` (initial load) hoặc WS `fallback-required` (live).
3. **[Gap #3] Cập nhật schema** `TicketBasicResSchema` / `TicketFullResSchema` thêm `pendingFallbackChoice: z.boolean().optional()`.
4. **[Gap #4] Thêm Clawback UI:**
   - Verify body contract với BE.
   - Sửa service signature `clawback(ticketId, body: {reason: string})`.
   - Thêm modal nhập reason + button trong tab Thanh toán `AdminTicketDetailPage`.
5. **[Gap #5] Decision flag V2:** confirm với PO. Nếu không có scenario nào tắt flag → inline V2 và xoá `TicketDetailPanelLegacy` + `useEndIncidentTicket` để tránh nhầm. Nếu vẫn giữ flag, ít nhất thay nút "Kết thúc" legacy bằng `closeByCreator`.

### Sprint sau — Medium

6. **[Gap #6] Admin realtime detail** — phối hợp BE quyết định mở subscribe-ticket cho admin hoặc room admin riêng.
7. **[Gap #7] Pre-validate toggle category off** — gọi `describeBlockingResources` trước khi submit (cần BE expose endpoint).

### Backlog — Low / polish

8. **[Gap #8]** Subscribe `ticket.abandon.refunded` / `ticket.abandon.fallback_ai` để toast UX.
9. **[Gap #9]** Drill-down từ Reports/Analytics rows sang `AdminTicketDetailPage`.
10. **Cleanup:** xoá code `CreateTicketPanel` dangling trong `OwnerTicketsPage.tsx` / `ManagerTicketsPage.tsx` (không có entry-point sau scope change 2026-05-09).

---

## 7. Kết luận

**Setup phase:** ✅ đầy đủ — đây là vùng FE đã làm tốt nhất.

**Runtime owner/manager (web):** ⚠️ thiếu **Cancel V2** + **2 bug abandon-resolution** (render-conditional sai timing & không đọc `pendingFallbackChoice`) + **legacy "Kết thúc" không payout** khi flag tắt.

**Admin operations:** view + report + analytics + invalidate-rating đầy đủ; **clawback thiếu UI** (high — tài chính); admin realtime detail bị 403 (BE-side decision pending).

**Realtime:** subscribe đúng các event quan trọng cho web; thiếu 2 event abandon-confirm (toast UX). Chat events out of scope.

**Khuyến nghị:** ưu tiên fix nhóm gap #1–#5 trong sprint hiện tại — đây là các điểm nguy cơ tài chính hoặc bug logic, không phải polish UI.
