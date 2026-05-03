# Module 3 — Wave 3 (Owner/Manager creator action) — Handoff

> Đối chiếu: [ticket-quality-implementation-plan.md](./ticket-quality-implementation-plan.md) v2 mục 5.3 (O1–O10).
> Tiếp nối: [wave-1-handoff-and-be-gaps.md](./wave-1-handoff-and-be-gaps.md), [wave-2-handoff.md](./wave-2-handoff.md), [wave-1-2-audit-fixes-needed.md](./wave-1-2-audit-fixes-needed.md).

## 1. Trạng thái Wave 3

**Hoàn thành 100%** — toàn bộ luồng creator review-close-rate-abandon đã ship. Schema khớp BE Module 3 source thật (đã pass audit C1–C8 + M1–M4).

| Verify | Kết quả |
|---|---|
| `tsc --noEmit` Wave 3 files | ✅ 0 error |
| `eslint` Wave 3 components | ✅ 0 error, 0 warning |
| Tổng error TS toàn repo | 40 (giữ nguyên baseline pre-existing) |
| ESLint pre-existing trong `OwnerTicketsPage`/`ManagerTicketsPage` ở section `CreateTicketPanel` | 4 (không phải code Wave 3) |

> Lưu ý: BE Module 3 actions B5/B6/B7/B8 chưa ship. Owner/Manager bật flag `feature.ticket_resolve_quality_v2` qua A3 SystemConfigs sẽ thấy panel V2 với loading/error state. Khi BE up, FE chạy ngay không cần sửa thêm.

## 2. File mới (Wave 3)

```
src/components/ticket-quality/
  StarRating.tsx                          ← Helper readOnly + interactive 1-5 sao (a11y radio)
  SolutionViewCard.tsx                    ← O4 — render 4 trường giải pháp + source badge + severityNote
  PrescriptionItemsCard.tsx               ← O5 — items[] + withdrawal warning Alert + supersession badge
  AddendumList.tsx                        ← O6 — timeline ghi chú bổ sung theo type (Pencil/Pill/AlertTriangle)
  RatingDisplay.tsx                       ← O7 — stars + feedback + tags + invalidation alert
  AutoCloseCountdown.tsx                  ← O8 — Progress + interval 30s + isUrgent threshold (BR-74)
  BroadcastTimeline.tsx                   ← O9 — list doctor broadcasts, status dot color
  AbandonResolutionModal.tsx              ← O3 — radio FALLBACK_AI/REFUND_TICKET + note + auto-mở trên fallback event
  CloseAndRateModal.tsx                   ← O2 — 2-step (review → rate) + AI ticket bypass rate + close→rate sequential
  TicketDetailPanelV2.tsx                 ← O1 — orchestrator (slide-in animation, 3-col layout)
```

## 3. File sửa (Wave 3)

| File | Phạm vi sửa |
|---|---|
| [src/pages/OwnerPage/Tickets/OwnerTicketsPage.tsx](../../src/pages/OwnerPage/Tickets/OwnerTicketsPage.tsx) | Thêm import `useTicketQualityFlag` + `TicketDetailPanelV2`. Tách `TicketDetailPanel` cũ thành `TicketDetailPanelLegacy`; `TicketDetailPanel` mới là wrapper gate qua flag. Tránh vi phạm rules-of-hooks (early return trước khi gọi hooks legacy). |
| [src/pages/ManagerPage/Tickets/ManagerTicketsPage.tsx](../../src/pages/ManagerPage/Tickets/ManagerTicketsPage.tsx) | Tương tự Owner — wrapper với `viewerRole="manager"`. |

## 4. Pattern đã follow (đối chiếu DEVELOPMENT.md + form-error-and-date-handling.md)

### 4.1 Form & error
- **CloseAndRateModal**: `useClearServerFieldErrors` + 422 mapping qua `handleApiErrorUnprocessentity`. Edge case: nếu close thành công nhưng rate fail → `toast.warning` thay vì error (ticket đã đóng — mất rating là phụ).
- **AbandonResolutionModal**: 422 mapping bình thường + 4xx/5xx → `getApiErrorMessageVi`.
- **Mọi field**: `Field error` prop + `aria-invalid` + helperText/errorText.
- **Sanitize**: trim string rỗng → undefined (BE Zod `.optional()` reject string rỗng có constraint).

### 4.2 React rules
- **`useWatch` thay `watch()`**: tránh react-compiler warning "incompatible library" khi dùng giá trị watched trong UI.
- **`onOpenChange` thay `useEffect`**: reset step về "review" trong onOpenChange callback (tránh setState-in-effect anti-pattern).
- **Wrapper gate**: tách 2 component để tránh vi phạm rules-of-hooks khi flag flip giữa renders.

### 4.3 Realtime
- **`useRealtimeTicket(role, scope)`** (list scope): debounce invalidate `tickets.*` khi WS event về ticket trong farm/zone đang xem.
- **`useRealtimeTicketDetail(ticketId, callbacks)`** (detail scope): subscribe room `ticket:{id}`, filter event theo ticketId chính xác. Tự gọi `onFallbackRequired` để mở `AbandonResolutionModal` khi WS `ticket.fallback-required` về.
- Toast events:
  - `ticket.resolved` → "Bác sĩ đã giải quyết ticket. Vui lòng xem giải pháp."
  - `ticket.closed` → "Ticket đã được đóng."
  - `ticket.fallback-required` → tự mở Abandon modal + banner trong modal.

### 4.4 Style (no gradient, semantic colour)
| Element | Class |
|---|---|
| Status RESOLVED badge | `bg-emerald-500/10 text-emerald-700 border-emerald-200` |
| AI source badge | `bg-amber-500/10 text-amber-700 border-amber-200` |
| Withdrawal warning Alert | `bg-amber-500/10 border-amber-200` + icon `AlertTriangle` |
| Rating invalidated alert | `bg-amber-500/10 border-amber-200` + icon `ShieldOff` + opacity-60 wrap |
| Star fill | `fill-yellow-400 text-yellow-400` (chỉ solid, không gradient) |
| Countdown urgent state | `text-destructive` + `[&>div]:bg-destructive` cho Progress |
| Broadcast status dot | `bg-emerald-600 / bg-red-600 / bg-amber-600 / bg-muted-foreground` |
| Close reason badge | `CLOSE_REASON_BADGE_CLASS[reason]` từ `ticketQualityLabels.ts` |

### 4.5 Animation
- Page slide-in: `<div className="space-y-6 transition-all duration-300 ease-out ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}">` + `requestAnimationFrame` mount + `setTimeout(onBack, 300)` exit.

### 4.6 Accessibility
- `StarRating` interactive: `role="radiogroup"` + mỗi sao `role="radio"` + arrow keys + space/enter.
- `AutoCloseCountdown`: `aria-live="polite"`.
- `AbandonResolutionModal` radio cards: `role="radiogroup"` + mỗi card `role="radio"` + `aria-checked`.

## 5. Edge cases đã xử lý

### 5.1 Permission / state guards
| Edge case | Hành xử trong V2 |
|---|---|
| Viewer không phải creator | Banner Info xanh "Bạn không phải là người tạo ticket này..." + ẩn 3 button action |
| Ticket AI (`isAIResolved=true`) | Banner Bot vàng + Modal CloseAndRate ẩn step rate, chỉ confirm close |
| State !== RESOLVED | Action header + countdown ẩn |
| State === CLOSED/CANCELLED | Banner CloseReason + Card "Thanh toán" hiển thị (nếu `unitPriceSnapshot != null`) |
| State === OPEN/ASSIGNED/IN_PROGRESS | Chat input enabled, không có giải pháp/đánh giá |

### 5.2 Race conditions
| Edge case | Hành xử |
|---|---|
| Click Close 2 lần | `useMutation.isPending` disable button |
| Close trong khi WS `ticket.closed` về (auto-close vừa fire) | Mutation 409 → toast lỗi từ BE message + reset modal |
| Rate sau khi close fail | Close fail → abort + toast → giữ modal ở step rate |
| Rate fail sau khi close success | `toast.warning` ("Ticket đã đóng. Đánh giá chưa lưu được.") + giữ modal cho user thử lại; nếu 422 → setError field |
| WS `ticket.fallback-required` về khi modal Abandon đã mở | Re-render với `triggeredByFallback=true` banner |
| Modal mở lại sau đóng | Reset step về "review" qua `onOpenChange(true)` callback |

### 5.3 Data shape
| Edge case | Hành xử |
|---|---|
| `solution == null` (chưa resolve) | EmptyState "Chưa có giải pháp" |
| `prescription == null` hoặc `items=[]` | EmptyState "Không có đơn thuốc — bác sĩ có thể không cần kê" |
| `prescription.status === SUPERSEDED` | Badge amber "Đã thay thế" + "(reissue)" hint |
| `withdrawalPeriodDays > 0` | Alert amber bắt buộc theo BR-77 |
| `item.medicineId == null` (custom) | Badge "Tự nhập" + display `medicineName` denormalized hoặc fallback `customMedicineName` |
| `addenda.length === 0` | Card không render |
| `broadcasts.length === 0` | Card không render |
| `rating == null` && state === CLOSED | RatingDisplay hiển thị "Chưa có đánh giá" (creator skipped) |
| `rating.invalidatedAt` | Strikethrough feedback + Alert amber với `invalidationReason` |
| `closedBy === "SYSTEM_AUTO_CLOSE"` | Banner thêm hint "Hệ thống tự đóng vì người tạo không xác nhận trong thời gian cho phép." |

### 5.4 Countdown edge cases
| Edge case | Hành xử |
|---|---|
| `auto_close_hours` chưa load | Component trả `null` (không render) — không spam empty UI |
| `resolvedAt == null` | Component trả `null` |
| Đã quá hạn (`remainingSec === 0`) | Hiển thị "Đã quá hạn — hệ thống sẽ sớm tự đóng" + gọi `onTimeUp` callback |
| Còn dưới `1 - notifyFraction` thời gian (vd ≤ 1/3) | Color đỏ destructive + Progress đỏ |
| Tab inactive | `setInterval(30s)` vẫn chạy; khi user quay lại nhận update gần nhất |

## 6. Phụ thuộc BE Wave 3

| BE task | Endpoint | Mục đích | Status |
|---|---|---|---|
| **B5** | `POST /tickets/:id/close` | Creator đóng ticket → trigger payout | Pending |
| **B6** | `POST /tickets/:id/rating` | Submit rating (stars 1-5, feedback?, tags?) | Pending |
| **B7** | `POST /tickets/:id/abandon-resolution` | FALLBACK_AI / REFUND_TICKET | Pending |
| **B8** | `GET /tickets/:id/full` | Trả lồng `{ticket, solution, prescription, addenda, rating, broadcasts, abandonLogs}` | Pending |
| **B22** | Auto-close timer cron | Set `closedBy='SYSTEM_AUTO_CLOSE'` + payout | Pending |
| **B23** | Doctor inactivity timer | Emit WS `ticket.fallback-required` | Pending |
| WS `ticket.assigned/resolved/closed/fallback-required` | Realtime events | FE đã listen | Pending |

## 7. Quy ước BR đã enforce

- **BR-79** AI ticket KHÔNG được rate — UI ẩn step rate trong CloseAndRateModal khi `isAIResolved=true`.
- **BR-77** Withdrawal warning bắt buộc khi `withdrawalPeriodDays > 0` — Alert amber trong PrescriptionItemsCard.
- **BR-73** Solution immutable — chỉ render read-only, mọi bổ sung qua AddendumList.
- **BR-74** Auto-close reminder ở fraction config — AutoCloseCountdown đổi màu khi qua `auto_close_notify_at_fraction`.
- **BR-81** Tier KHÔNG hiển thị cho non-Admin — V2 panel không có TIER_LABEL nào.
- **BR-87** AI ticket KHÔNG payout — Card "Thanh toán" hiển thị "Ticket xử lý bởi AI — không thanh toán cho bác sĩ" thay vì amount.
- Quyền action: chỉ creator close/rate/abandon — `viewerUserId === ticket.createdBy` check.

## 8. Sequencing tiếp theo

| Wave | Phụ thuộc BE | FE deliverable | Estimate |
|---|---|---|---|
| **W4 — Admin DQS** | B14/B15/B16 + cron B21 chạy ≥ 1 đêm | A4 Leaderboard + A5 Doctor DQS Detail + redirect A6 | 1 tuần |
| **W5 — Polish** | B17, B19, B22, B23 | A7 InvalidateRatingModal + A8 AdminTicketDetailPage + A9 CommissionRules tab scope + P1 DoctorPublicProfile widget + drill-down từ TicketAnalytics → A8 | 1 tuần |
