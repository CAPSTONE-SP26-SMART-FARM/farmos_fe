# Ticket Flow Analysis — FarmOS FE

> Analysis Date: 2026-05-02  
> Scope: Module 2 ticket categorization, commission, and payout flows

---

## Executive Summary

**Current State**: FarmOS has **two parallel ticket systems** running side-by-side:

1. **Legacy Incident Flow** (`ticket` module) — currently used by FE/Mobile
2. **New Ticket-v2 Flow** (`ticket-v2` module) — Module 2, backend complete but FE not wired

**Backend**: Module 2 backend is ~95% complete (ticket-category, commission-rule, ticket-v2, payout services all built).

**Frontend**: Still using legacy incident APIs. **None of the Module 2 FE pages exist** (ticket categories, commission rules, ticket balance widget, admin reports wired to real API).

**Recommendation**: Decide migration path — fully switch FE to ticket-v2, or maintain both flows with clear use-case separation.

---

## 1. Two Ticket Flows — Side-by-Side Comparison

| Aspect | Legacy Incident Flow | Ticket-v2 Flow (Module 2) |
|---|---|---|
| **Backend Module** | [`ticket`](../../../farm_os_be/src/modules/ticket/) | [`ticket-v2`](../../../farm_os_be/src/modules/ticket-v2/) |
| **Create Endpoint** | `POST ticket/incident` | `POST tickets` |
| **List Endpoint** | `GET ticket/incident/owner`, `GET ticket/incident/doctor`, etc. | `GET tickets` (unified, role-based scope) |
| **Detail Endpoint** | `GET ticket/incident/owner/:id`, `GET ticket/incident/doctor/:id` | `GET tickets/:id` (unified) |
| **Category System** | Legacy enum `TicketCategory` + `TicketType` | `TicketCategoryConfig` (admin-configurable, links `featureCode` + `creditType`) |
| **Pricing** | No pricing — tickets were free/bundle | `unitPriceSnapshot` per category |
| **Source Tracking** | None | `TicketSource` (SUBSCRIPTION_GRANT / PURCHASED) + `sourceLedgerId` |
| **Balance Management** | None | `GET me/ticket-balance` per-category breakdown |
| **Commission** | None | Resolver + payout on close |
| **Cancel/Refund** | `PUT ticket/incident/:id/end` (owner closes) | `POST tickets/:id/cancel` (refunds source before assigned) |
| **FE Usage** | ✅ **Active** — `OwnerTicketsPage`, `useTicket.ts` hooks all use incident APIs | ❌ **Not wired** — endpoints built, no FE pages/hooks |
| **Mobile Usage** | ✅ **Active** — `app/(app)/incident`, `useIncident.ts` | ❌ **Not wired** |

### Key Insight

**Backend built ticket-v2 as a superset** — it includes categorization, pricing, source tracking, and commission that the legacy flow lacks. However, **FE/Mobile never migrated** from the legacy incident flow.

---

## 2. Module 2 Backend Status (Ticket-v2 Ecosystem)

### ✅ Fully Built Modules

| Module | Controller | Service/Repo | Purpose |
|---|---|---|---|
| **ticket-category** | [`ticket-category.controller.ts`](../../../farm_os_be/src/modules/ticket-category/ticket-category.controller.ts) | ✅ | Admin CRUD categories (B1–B5: list admin/active, create, update, toggle) |
| **commission-rule** | [`commission-rule.controller.ts`](../../../farm_os_be/src/modules/commission-rule/commission-rule.controller.ts) | ✅ | Admin CRUD commission rules (B6–B9: list, create, update, soft-delete) |
| **ticket-v2** | [`ticket-v2.controller.ts`](../../../farm_os_be/src/modules/ticket-v2/ticket-v2.controller.ts) | ✅ | Owner/Manager/Farmer create/list/detail/cancel + balance (B10–B14) |
| **ticket-payout** | No HTTP controller (service only) | ✅ | `CommissionResolverService` (B20), `PayoutService` (B21), `ClawbackService` (B23) |
| **admin-ticket-ops** | [`admin-ticket-ops.controller.ts`](../../../farm_os_be/src/modules/admin-ticket-ops/admin-ticket-ops.controller.ts) | ✅ | Admin clawback (B16), wallet tx detail (B15), reports (B18–B19) |
| **ticket-lifecycle** | [`ticket-lifecycle.controller.ts`](../../../farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.controller.ts) | ✅ | Resolve, close, rating, addendum, abandon — **close triggers payout** (line 197) |

### 🔄 Integration Hooks (Working)

| Hook | Where | Status |
|---|---|---|
| **Create ticket → deduct source** | [`ticket-v2.service.ts:87-103`](../../../farm_os_be/src/modules/ticket-v2/ticket-v2.service.ts#L87-L103) | ✅ Resolves `SUBSCRIPTION_GRANT` → `PURCHASED`, writes `SubscriptionUsageLedger` or debits `OwnerCredit` |
| **Close ticket → payout doctor** | [`ticket-lifecycle.service.ts:197`](../../../farm_os_be/src/modules/ticket-lifecycle/ticket-lifecycle.service.ts#L197) | ✅ Calls `payoutForTicket()` → resolver → ledger → wallet + WS `doctor.wallet.credited` |
| **Cancel ticket → refund source** | [`ticket-v2.service.ts` cancel method](../../../farm_os_be/src/modules/ticket-v2/ticket-v2.service.ts) | ✅ Reverses delta (only if status=open, before assigned) |
| **Admin clawback** | [`clawback.service.ts`](../../../farm_os_be/src/modules/ticket-payout/clawback.service.ts) | ✅ Debit wallet, insert `PENALTY` tx, emit `wallet.clawback` |
| **Emit ticket.created WS** | [`ticket-v2.service.ts:106`](../../../farm_os_be/src/modules/ticket-v2/ticket-v2.service.ts#L106) | ✅ Module 3 dispatcher subscribes |

### ❌ Missing Backend Pieces

| # | Task | Notes |
|---|---|---|
| B24 | Seed `seed:ticket-legacy-pricing` | Backfill `categoryConfigId`/`unitPriceSnapshot` for old tickets. File not found in `prisma/seed/`. May not be needed if no legacy tickets exist. |
| B15-cosmetic | Move wallet tx detail endpoint | Currently in `admin-ticket-ops` controller, logically belongs in `doctor-wallet`. Path unchanged. Low priority. |

---

## 3. Frontend Status — Massive Gaps

### ❌ Missing Admin Pages (High Priority)

| Page | Endpoint(s) | Status |
|---|---|---|
| **`/admin/ticket-categories`** | `GET/POST/PATCH admin/ticket-categories[/:id][/toggle]` (B1–B4) | **NOT BUILT** — no folder/file exists in `src/pages/AdminPage/` |
| **`/admin/commission-rules`** | `GET/POST/PATCH/DELETE admin/commission-rules[/:id]` (B6–B9) | **NOT BUILT** |
| **Clawback action** (ticket detail admin) | `POST admin/tickets/:id/clawback` (B16) | **NOT BUILT** — no admin ticket detail page for ticket-v2 |

### ⚠️ Partially Built / Mock Pages

| Page | Current State | Needed |
|---|---|---|
| **`AdminPackagesPage`** ([`AdminPage/Packages/AdminPackagesPage.tsx`](../../../src/pages/AdminPage/Packages/AdminPackagesPage.tsx)) | **MOCK** — hardcoded array, no API calls | Wire to `GET/POST/PATCH service-packages` (already exists in [`credit.controller.ts`](../../../farm_os_be/src/modules/credit/credit.controller.ts)) + add `categoryConfigId` select field |
| **`AdminTicketAnalyticsPage`** ([`AdminPage/TicketAnalytics/AdminTicketAnalyticsPage.tsx`](../../../src/pages/AdminPage/TicketAnalytics/AdminTicketAnalyticsPage.tsx)) | **MOCK** (`_mocks/ticketAnalytics.mock`) | Replace mock with `GET admin/reports/ticket-revenue` (B18) + `GET admin/reports/doctor-commission` (B19) |

### ❌ Missing Owner/Manager Pages

| Page | Endpoint | Status |
|---|---|---|
| **`/tickets/new`** (create ticket-v2) | `POST tickets` (B10) | **NOT BUILT** — [`OwnerTicketsPage`](../../../src/pages/OwnerPage/Tickets/OwnerTicketsPage.tsx) uses legacy `POST ticket/incident` |
| **Ticket balance widget** | `GET me/ticket-balance` (B14) | **NOT BUILT** — no component in `OwnerPage/Wallet/components/` or Dashboard |
| **Ticket list/detail for ticket-v2** | `GET tickets`, `GET tickets/:id` (B11–B12) | **Partially** — list/detail pages exist but call legacy incident API |

### ❌ Missing Hooks (Critical Infrastructure)

| Hook | Purpose | Status |
|---|---|---|
| **`useTicketCategory.ts`** | List active categories (for create form), admin CRUD | **NOT BUILT** — no file in [`src/queries/`](../../../src/queries/) |
| **`useCommissionRule.ts`** | Admin CRUD commission rules | **NOT BUILT** |
| **`useTicketV2.ts`** | Create/list/detail/cancel ticket-v2 + balance | **NOT BUILT** (existing `useTicket.ts` is for legacy incident) |

**Current `useTicket.ts`** ([`src/queries/useTicket.ts`](../../../src/queries/useTicket.ts)) only has hooks for legacy incident flow:
- `useOwnerTicketList(farmId)` → `ticketService.ownerListByFarm()` → `GET ticket/incident/owner/farm/:farmId`
- `useCreateIncidentTicket()` → `POST ticket/incident`
- etc.

**No hooks exist for ticket-v2 endpoints.**

---

## 4. Mobile Status — Same Legacy Incident Flow

| Screen | Current | Needed for Ticket-v2 |
|---|---|---|
| **Farmer create ticket** | [`app/(app)/incident/...`](../../../farmos_mobile/app/(app)/incident/) + `useIncident.ts` → `POST ticket/incident` | Migrate to `POST tickets` (B10) + category select |
| **Farmer list/detail** | Same legacy flow | Migrate to `GET tickets` (B11–B12) |
| **Doctor wallet** | ✅ [`app/(app)/wallet.tsx`](../../../farmos_mobile/app/(app)/wallet.tsx) wired to `GET doctor-wallet/doctor/my` + WS `doctor.wallet.credited` | ✅ Already works with Module 2 payout |
| **Wallet tx detail** | ❌ No screen | Build detail screen → `GET doctor-wallet/doctor/my/transactions/:id` (B15) |
| **WS `wallet.clawback`** | ❌ Not listening | Add listener in `useDoctorWallet.ts` (currently only `doctor.wallet.credited`) |

---

## 5. The Core Problem: Frontend Never Migrated

```
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  Legacy Incident Flow            Ticket-v2 Flow (Module 2)      │
│  ✅ ticket module                ✅ ticket-v2 module             │
│  ✅ FE/Mobile use this           ❌ FE/Mobile DON'T use this     │
│                                                                  │
│  POST ticket/incident            POST tickets                   │
│  GET ticket/incident/owner       GET tickets                    │
│  No category config              ✅ ticket-category module       │
│  No pricing/commission           ✅ commission-rule module       │
│  No balance tracking             ✅ payout + clawback            │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  ✅ OwnerTicketsPage             ❌ No ticket-v2 pages           │
│  ✅ useTicket.ts (incident)      ❌ No useTicketV2.ts            │
│  ✅ OwnerWalletPage (bundles)    ❌ No ticket-category page      │
│  ⚠️ AdminTicketAnalytics (mock)  ❌ No commission-rule page      │
│  ⚠️ AdminPackages (mock)          ❌ No ticket balance widget    │
└─────────────────────────────────────────────────────────────────┘
```

**Root Cause**: Backend team built Module 2 as a new system (ticket-v2) instead of extending the legacy incident flow. Frontend never received tasks to migrate, so they continue using the old APIs.

---

## 6. Decision Points & Recommendations

### Option A: Full Migration to Ticket-v2 (Recommended)

**Approach**: Deprecate legacy incident flow, migrate all FE/Mobile to ticket-v2.

**Pros**:
- Clean single system
- Unlocks Module 2 features (categorization, pricing, commission, balance tracking)
- Backend already complete

**Cons**:
- Requires rebuilding ~10 FE pages + 3 hook files
- Mobile screens need migration
- Breaking change for existing workflows

**Effort Estimate**: **~3-4 weeks FE + 1 week Mobile**

**Migration Checklist**:
- [ ] Build Admin pages: ticket-categories, commission-rules, wire reports
- [ ] Build `useTicketCategory.ts`, `useCommissionRule.ts`, `useTicketV2.ts`
- [ ] Rebuild `AdminPackagesPage` with real API + `categoryConfigId` field
- [ ] Add ticket balance widget to Owner Dashboard + create-ticket form
- [ ] Migrate `OwnerTicketsPage` / `ManagerTicketsPage` to call `GET tickets` instead of `GET ticket/incident/owner`
- [ ] Build `/tickets/new` form with category select + balance preview
- [ ] Mobile: replace `useIncident.ts` with ticket-v2 hooks
- [ ] Mobile: build wallet tx detail screen
- [ ] Wire realtime listeners (`wallet.clawback`, `ticket.created` for admin)

### Option B: Keep Both Flows (Dual-System)

**Approach**: Legacy incident for "free emergency tickets", ticket-v2 for "paid support tickets".

**Pros**:
- No breaking changes
- Can gradually roll out ticket-v2 to premium features

**Cons**:
- Tech debt — maintaining two codebases
- Confusion for users/developers about which flow to use
- Still need to build all FE pages for ticket-v2

**Recommendation**: **Only if business explicitly needs both types.** Otherwise, go with Option A.

---

## 7. Immediate Next Steps (If Going Full Migration)

### Week 1-2: Admin Infrastructure
1. **Build `useTicketCategory.ts`** + **`/admin/ticket-categories`** page
   - Wire B1–B5 (list admin, list active, create, update, toggle)
   - Add validation UI for toggle (show blocking resources before disable)

2. **Build `useCommissionRule.ts`** + **`/admin/commission-rules`** page
   - Wire B6–B9 (list, create, update with date range, soft-delete)
   - Show versioning UI (old rules with `effectiveTo` in read-only list)

3. **Rebuild `AdminPackagesPage`** (ticket bundles)
   - Replace mock with real `GET service-packages` + `POST/PATCH`
   - Add `categoryConfigId` dropdown (fetch from `GET admin/ticket-categories`)

4. **Wire `AdminTicketAnalyticsPage`** reports
   - Replace mock with `GET admin/reports/ticket-revenue` (B18)
   - Add `GET admin/reports/doctor-commission` (B19)

### Week 3: Owner/Manager Ticket Creation
1. **Build `useTicketV2.ts`** hooks
   - `useCreateTicketV2()` → `POST tickets`
   - `useTicketsV2()` → `GET tickets`
   - `useTicketV2Detail()` → `GET tickets/:id`
   - `useCancelTicketV2()` → `POST tickets/:id/cancel`
   - `useMyTicketBalance()` → `GET me/ticket-balance`

2. **Build `/tickets/new`** form
   - Select category from `GET ticket-categories/active` (B5)
   - Show balance preview from `useMyTicketBalance()` per-category
   - Highlight which source will be used (subscription / purchased)
   - Submit to `POST tickets` (B10)

3. **Build ticket balance widget** (Dashboard + Wallet)
   - Per-category breakdown: `fromSubscription`, `fromPurchased`, `total`
   - Mount in `OwnerPage/Dashboard` + `OwnerPage/Wallet`

### Week 4: Migrate List/Detail Pages
1. **Migrate `OwnerTicketsPage`**
   - Replace `useOwnerTicketList(farmId)` → `useTicketsV2({ farmId })`
   - Show category name, source badge, payout status in table

2. **Migrate ticket detail pages**
   - Show `categoryConfigId` → category name
   - Show `source` badge (subscription / purchased)
   - Show `payoutAt` + `payoutPercentSnapshot` if closed
   - Wire cancel button to `useCancelTicketV2()` (only if status=open)

3. **Build admin clawback action**
   - Add "Clawback" button in admin ticket detail view
   - Confirm dialog + reason input
   - Call `POST admin/tickets/:id/clawback` (B16)

### Week 5: Mobile Migration
1. Replace `app/(app)/incident` screens with ticket-v2 API calls
2. Build wallet tx detail screen (wire B15)
3. Add `wallet.clawback` listener to `useDoctorWallet.ts`

---

## 8. API Endpoint Reference (Ticket-v2 Ecosystem)

### Admin — Ticket Categories (B1–B5)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `admin/ticket-categories` | admin | List full catalog (active + inactive) |
| POST | `admin/ticket-categories` | admin | Create category (set price, %, eligibility) |
| PATCH | `admin/ticket-categories/:id` | admin | Update (blocks changing `featureCode`/`creditType` if tickets exist) |
| PATCH | `admin/ticket-categories/:id/toggle` | admin | Toggle `isActive` (validates no blocking resources) |
| GET | `ticket-categories/active` | owner/manager/farmer | List active for create form (checks farm membership) |

### Admin — Commission Rules (B6–B9)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `admin/commission-rules` | admin | List + filter (`scope`/`doctorId`/`categoryId`) |
| POST | `admin/commission-rules` | admin | Create rule (versioning: tạo mới + set `effectiveTo` cũ thủ công) |
| PATCH | `admin/commission-rules/:id` | admin | Update effective period / `isActive` |
| DELETE | `admin/commission-rules/:id` | admin | Soft delete (`isActive=false` + `effectiveTo=now`) |

### Owner/Manager/Farmer — Ticket-v2 (B10–B14)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `tickets` | owner/manager/farmer | Create with category → resolve source → deduct balance |
| GET | `tickets` | all roles | List (hierarchical scope by role) |
| GET | `tickets/:id` | all roles | Detail (hierarchical access) |
| POST | `tickets/:id/cancel` | owner/manager/farmer | Cancel (only status=open) → refund source |
| GET | `me/ticket-balance` | owner | Per-category: `{categoryCode, fromSubscription, fromPurchased, total}` |

### Admin — Operations (B15–B19)
| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `doctor-wallet/doctor/my/transactions/:id` | doctor | Wallet tx detail + join `TicketCommissionLedger` |
| POST | `admin/tickets/:id/clawback` | admin | Debit wallet + `PENALTY` tx + emit `wallet.clawback` |
| GET | `admin/reports/ticket-revenue` | admin | Group by category + source |
| GET | `admin/reports/doctor-commission` | admin | Group by doctor + month |

---

## 9. Conclusion

**Backend is production-ready** for Module 2. The commission system, payout hooks, and ticket-v2 APIs are fully built and tested.

**Frontend is the blocker.** Zero Module 2 pages exist. All ticket screens still use the legacy incident flow.

**Recommendation**: Allocate **3-4 weeks FE + 1 week Mobile** to fully migrate to ticket-v2. This unlocks:
- Admin-configurable ticket categories with pricing
- Owner balance tracking (subscription vs purchased)
- Doctor commission + payout automation
- Admin reports + clawback tools

Without FE migration, Module 2 backend sits unused. **Prioritize decision**: migrate now, or defer until business confirms Module 2 rollout timeline.
