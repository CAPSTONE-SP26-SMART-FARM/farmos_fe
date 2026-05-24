# Manager Crop Seasons — UI/UX Refactor Plan

Mình đã đọc xong code hiện tại (`ManagerCropSeasonsPage.tsx`, `CropSeasonSummaryCard.tsx`, `MilestonesWithDetailTab.tsx`, `ManagerMilestoneDetailPage.tsx`, `DailyLogsTab.tsx`, các query/schema liên quan). Dưới đây là plan refactor + phân tích gap.

---

## 1. Tóm tắt phạm vi

Refactor **2 trang**:
- **A.** `/dashboard/manager/crop-seasons?zoneId=...` → [ManagerCropSeasonsPage.tsx](../src/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage.tsx) — view khu vực đã chọn
- **B.** `/dashboard/manager/crop-seasons/:cropSeasonId/milestones/:milestoneId/overview` → [ManagerMilestoneDetailPage.tsx](../src/pages/ManagerPage/CropSeasons/ManagerMilestoneDetailPage.tsx) (gộp với `…/:milestoneId` để có 1 route detail thống nhất)

Component tái sử dụng/sửa nhiều: [CropSeasonSummaryCard.tsx](../src/pages/ManagerPage/CropSeasons/components/CropSeasonSummaryCard.tsx), [MilestonesWithDetailTab.tsx](../src/pages/ManagerPage/CropSeasons/components/MilestonesWithDetailTab.tsx), [DailyLogsTab.tsx](../src/pages/ManagerPage/CropSeasons/components/DailyLogsTab.tsx), [RequestsHistoryTab.tsx](../src/pages/ManagerPage/CropSeasons/components/RequestsHistoryTab.tsx).

---

## 2. Trang A — Crop Seasons (sau khi chọn zone)

### 2.1. Header row (1 hàng, theo yêu cầu)

```
[←] Quản lý mùa vụ                                  [📋 Lịch sử ▾]
    <Tên khu vực>                  [ZoneSwitcherCombobox]
```

- **Xoá**: sidebar dọc `now / history / + Tạo mùa vụ` ở [ManagerCropSeasonsPage.tsx:284-320](../src/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage.tsx#L284-L320).
- **Thay**: `DropdownMenu` "Lịch sử" (shadcn) đặt vị trí cũ của search, cùng hàng với tên zone, lề phải.
- Items:
  - `Lịch sử vụ mùa` → mở view list các vụ đã `completed/cancelled` (logic đang nằm ở [HistoryView.tsx](../src/pages/ManagerPage/CropSeasons/components/HistoryView.tsx))
  - `Lịch sử duyệt` → mở `RequestsHistoryTab` của vụ mùa **hiện tại**. Disabled khi không có `nowSeason`.
- **Nút "Tạo mùa vụ"** (trước nằm trong sidebar): chuyển thành button thứ cấp cạnh "Lịch sử ▾", chỉ hiện khi `showCreateButton` (logic [L231-L233](../src/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage.tsx#L231-L233) giữ nguyên).

### 2.2. State / URL

Thay `sidebarTab` (useState) bằng **search param** để deep-link được & back-button friendly:
- `?view=current` (mặc định) | `?view=history-seasons` | `?view=history-requests` | `?view=history-season-detail&seasonId=…`
- Bỏ `useState<"now"|"history">` và `useState<historyDetail>`.

### 2.3. Default view = "current season"

Hiển thị `CropSeasonSummaryCard` của `nowSeason` + milestone list (xem 2.4-2.5). Nếu chưa có → empty state với CTA "Tạo mùa vụ" (giữ như [L329-L345](../src/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage.tsx#L329-L345)).

### 2.4. Refactor `CropSeasonSummaryCard`

**Top row (header card):**
```
<Tên cây> [StatusBadge]   ............................  [Gửi duyệt]
Loại cây · Giống · (notes ngắn)
```
Chỉ giữ **một** action chính `Gửi duyệt` ở top-right.

**Info row (1 hàng duy nhất, responsive grid):**
```
Ngày trồng | Thu hoạch dự kiến | Thu hoạch thực tế | Diện tích | Số cây | Mật độ hiện tại
```
- Đưa **Số cây** lên cùng grid (bỏ break ở [CropSeasonSummaryCard.tsx:98-105](../src/pages/ManagerPage/CropSeasons/components/CropSeasonSummaryCard.tsx#L98-L105)).
- Thay `DensitySnapshotChip` (đang là **mật độ đang áp dụng từ template/snapshot**) bằng **"Mật độ hiện tại"** = `plantCount / totalAreaSqm` (cây/m² hoặc cây/ha) — derive FE-side. Đặt cạnh "Số cây".
- Đổi grid từ `md:grid-cols-4` → `md:grid-cols-3 lg:grid-cols-6` để fit 6 cell trên 1 hàng ở desktop.

**Footer (bottom-right):**
```
                                       [Kế hoạch vs Thực tế]  [Thu hoạch]
```
- 2 button outline, align right. Ẩn tuỳ status: `Thu hoạch` chỉ hiện khi `status ∈ {active, harvesting, completed}`; `Kế hoạch vs Thực tế` ẩn ở `planning`.
- Bỏ button "Quản lý mốc công việc" cũ ở [L116-L129](../src/pages/ManagerPage/CropSeasons/components/CropSeasonSummaryCard.tsx#L116-L129) — milestone giờ là list ngay bên dưới.

### 2.5. Milestone list bên dưới summary card

Thay vì `Tabs` 7 tab ở [L444-L495](../src/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage.tsx#L444-L495) → **một danh sách phẳng** các milestone (1, 2, 3, …).

**Mỗi item** (Card hoặc row, full-width, không phải 2-pane):
```
#1  Gieo trồng                                     [Status badge]
    📅 01/06 – 15/06   (kế hoạch)                  →
```
- Sắp xếp theo `milestoneOrder` (đã có ở [MilestonesWithDetailTab.tsx:25](../src/pages/ManagerPage/CropSeasons/components/MilestonesWithDetailTab.tsx#L25)).
- Click item → `navigate('/dashboard/manager/crop-seasons/:cropSeasonId/milestones/:milestoneId?zoneId=...')` (xem 3.).
- Loại bỏ 2-pane layout cũ (`MilestonesWithDetailTab`) — thay bằng list component mới: `MilestoneListPanel` (tạo mới, ~100 dòng).
- Empty: giữ logic empty hiện tại ([L57-L73](../src/pages/ManagerPage/CropSeasons/components/MilestonesWithDetailTab.tsx#L57-L73)).

### 2.6. Bỏ hoàn toàn các tab

Xoá khỏi page A:
- `tracking-config` (panel này vẫn truy cập được bên trong milestone — không còn cấu hình ở season level).
- `sensors`, `incidents` (chuyển vào milestone detail).
- `daily-logs` (gồm "Nhật ký", "Hôm nay", "Quản lý nhiệm vụ") → chuyển vào tab Công việc của milestone.
- `harvest` → đã thành button.
- `requests` → đã thành dropdown "Lịch sử duyệt".

---

## 3. Trang B — Milestone detail

### 3.1. Hợp nhất 2 route

Hiện đang có 2 route:
- `…/:milestoneId` → wizard config ([ManagerMilestoneDetailPage.tsx](../src/pages/ManagerPage/CropSeasons/ManagerMilestoneDetailPage.tsx))
- `…/:milestoneId/overview` → read-only overview ([ManagerMilestoneOverviewPage.tsx](../src/pages/ManagerPage/CropSeasons/ManagerMilestoneOverviewPage.tsx))

**Đề xuất**: gộp về `…/:milestoneId` với 3 tab (Cảm biến / Sự cố / Công việc). Cấu hình IoT/threshold vẫn nằm trong tab Cảm biến, nhưng:
- `status = planning|rejected` → tab Cảm biến mở chế độ **config** (giống wizard hiện tại)
- Khác → **read-only** (giống Overview hiện tại)

Route `…/overview` deprecated → redirect 301 sang `…/:milestoneId`.

### 3.2. Layout

```
Chi tiết mốc · #2 Sinh trưởng                         [Badge status]
[Cảm biến | Sự cố | Công việc]    ← horizontal tabs, ngang dưới header
─────────────────────────────────────────────────────
<tab content>
```
- Header section trên cùng: breadcrumb + tên mốc + status + meta (kế hoạch start/end, thực tế).
- Default tab = `Cảm biến` (qua `?tab=sensors` mặc định).

### 3.3. Tab "Công việc" — cấu trúc 3 section

Không phải 3 tab lồng nhau — user yêu cầu **3 section dọc** trong cùng một tab:

```
─── Quản lý công việc ────────────────────────────────
   [+ Thêm công việc] [Filter status]
   <table tasks của milestone này>
   Hành động/row: Sửa · Xoá · Gán farmer · ✓ Hoàn thành

─── Công việc theo ngày ──────────────────────────────
   <list các daily task của milestone HÔM NAY>
   Hiển thị: title, farmer, đã log chưa, priority

─── Nhật ký công việc ────────────────────────────────
   [Date range filter]
   <table daily-logs của milestone này>
```

- **Quản lý công việc**: dùng [ManagerMilestoneTasksSection.tsx](../src/pages/ManagerPage/EmployeeTasks/ManagerMilestoneTasksSection.tsx) đang có sẵn. Đảm bảo nút "Hoàn thành" chỉ xuất hiện ở đây (Manager mark complete), hiện đã có `useManagerCompleteEmployeeTask`.
- **Công việc theo ngày**: tách phần `TodayZoneTasksPanel` thành biến thể milestone-scoped (API đã hỗ trợ `milestoneId` — xem 4.).
- **Nhật ký công việc**: tách `LogsPanel` từ [DailyLogsTab.tsx:49-215](../src/pages/ManagerPage/CropSeasons/components/DailyLogsTab.tsx#L49-L215), bỏ submit log dialog (manager chỉ xem), filter theo milestone — **cần BE bổ sung** (xem 4.).

### 3.4. Tab "Cảm biến" & "Sự cố"

Giữ logic hiện tại. Nhưng cần milestone-scope:
- `IncidentTab` hiện đang nhận `cropSeason` ([IncidentTab.tsx:44](../src/pages/ManagerPage/CropSeasons/components/IncidentTab.tsx#L44)) — cần thêm prop `milestoneId` và filter danh sách sự cố theo milestone của session đó. Cần check BE incident API có hỗ trợ filter `milestoneId` chưa.
- `SensorOverviewTab` ([SensorOverviewTab.tsx:573](../src/pages/ManagerPage/CropSeasons/components/SensorOverviewTab.tsx#L573)) cũng đang theo season → tách 1 variant `MilestoneSensorPane` chỉ show data của milestone đó (devices đã assign cho milestone + thresholds + readings).

---

## 4. API requirements

| # | Mục đích | Hook hiện có | Status |
|---|---|---|---|
| 1 | List task theo milestone | `useManagerListEmployeeTasks(milestoneId, …)` [useEmployeeTask.ts:46](../src/queries/useEmployeeTask.ts#L46) | ✅ Đã có |
| 2 | Today tasks theo milestone | `useManagerZoneTasksForToday(zoneId, { milestoneId })` — schema đã có field `milestoneId` ([dailyLog.ts:150-155](../src/schemaValidatation/dailyLog.ts#L150-L155)) | ✅ Đã có |
| 3 | Daily logs theo milestone | `useManagerDailyLogsByZone` — schema **chưa** có `milestoneId` ([dailyLog.ts:75-87](../src/schemaValidatation/dailyLog.ts#L75-L87)) | ⚠️ **BE cần thêm filter** `milestoneId` |
| 4 | Sự cố theo milestone | (cần verify) | ⚠️ Verify BE incidents có `milestoneId` filter |
| 5 | Complete task | `useManagerCompleteEmployeeTask` | ✅ Đã có |
| 6 | Mật độ hiện tại | derive FE (`plantCount / totalAreaSqm`) | ⚠️ Cần BE/PO xác nhận công thức |

→ Cần BE PR: thêm `milestoneId?: uuid` vào query params của: `GET /daily-logs` (manager), `GET /incidents` (manager). Nhỏ, an toàn.

---

## 5. Component tree mới (đề xuất file)

```
ManagerCropSeasonsPage.tsx               (refactor: bỏ sidebar+tabs, ~250 dòng)
├─ ZoneHeader.tsx                        (mới: tên zone + ZoneSwitcher + HistoryMenu + CreateBtn)
├─ HistoryMenu.tsx                       (mới: dropdown 2 mục)
├─ CropSeasonSummaryCard.tsx             (refactor: 1-row info, density hiện tại, footer 2 button)
├─ MilestoneListPanel.tsx                (mới: list phẳng, thay MilestonesWithDetailTab)
├─ HistorySeasonsView                    (tái dùng HistoryView hiện có)
└─ HistoryRequestsView                   (tái dùng RequestsHistoryTab)

ManagerMilestoneDetailPage.tsx           (refactor: tabs ngang, gộp wizard+overview)
├─ MilestoneHeader.tsx                   (mới: breadcrumb + tên + status + meta)
├─ MilestoneSensorTab.tsx                (refactor từ wizard + overview, theo status)
├─ MilestoneIncidentTab.tsx              (wrap IncidentTab với milestoneId)
└─ MilestoneTasksTab.tsx                 (mới — 3 section dọc)
    ├─ section "Quản lý CV"  → ManagerMilestoneTasksSection
    ├─ section "CV theo ngày" → MilestoneTodayTasksPanel (tách từ TodayZoneTasksPanel)
    └─ section "Nhật ký CV"  → MilestoneDailyLogsPanel  (tách từ LogsPanel)
```

Tuân thủ rule 500 dòng/file ([../../RULES-REACT-001/04-file-structure-rules.md](../../RULES-REACT-001/04-file-structure-rules.md)).

---

## 6. UI/UX gaps & rủi ro cần chốt trước khi code

### 6.1. Semantic / data
- **"Mật độ hiện tại"**: chưa rõ định nghĩa. Options:
  - (a) `plantCount / totalAreaSqm` realtime — đơn giản nhưng không phản ánh chết/trồng dặm.
  - (b) Field riêng trong DB cập nhật khi farmer log thay đổi số cây.
  - → Cần xác nhận với BE/PO. Nếu (b) thì cần BE field mới.
- **"Lịch sử duyệt"**: hiện thị **của season hiện tại** hay **toàn bộ zone**? Mình đề xuất "season hiện tại" (UX rõ ràng), disable khi không có `nowSeason`. Cần confirm.
- **Số cây cùng hàng**: ở mobile (`grid-cols-2`) 6 cell sẽ thành 3 hàng — chấp nhận được nhưng cần kiểm tra với designer.

### 6.2. Navigation & state
- **Bỏ sidebar Now/History** ⇒ user không còn ở chế độ "history" mà thấy current ngay. Tốt cho UX, nhưng cần đảm bảo **back button** từ history detail → quay về current view, không quay ra zone list. Giải pháp: dùng URL state (`?view=…`) thay useState.
- **Route hợp nhất milestone**: nếu user đang ở route `/overview` (bookmark), cần redirect.
- **Default tab Cảm biến**: ở `planning` state Cảm biến = config wizard. User click vào milestone từ list → vào thẳng tab config có thể gây bất ngờ. Đề xuất: ở `planning`, default tab = `Cảm biến` nhưng có banner "Đang ở chế độ cấu hình"; hoặc default tab = `Công việc` khi planning. Cần thống nhất.

### 6.3. Visibility / status logic
- `Gửi duyệt` chỉ enable khi `status ∈ {planning, rejected}` — giữ logic [SendRequestDialog](../src/pages/ManagerPage/CropSeasons/components/SendRequestDialog.tsx).
- `Thu hoạch` button ẩn khi `status = planning|sent|approved` (chưa active).
- `Kế hoạch vs Thực tế`: cân nhắc ẩn khi chưa có data milestone thực hiện.
- Khi 0 milestone, vẫn cho phép vào "Quản lý mốc công việc" (link cũ) — đề xuất giữ một CTA "Thêm mốc" ở empty state của milestone list.

### 6.4. Accessibility / responsive
- Dropdown "Lịch sử" cần `aria-label`, keyboard support — shadcn `DropdownMenu` mặc định đã có.
- Mobile: header row có 3 thứ (back/zone-name, switcher, history) → cần wrap. Switcher có thể đưa xuống hàng 2 trên `<md`.
- Milestone list phải có focus state rõ ràng (đã có ở MilestonesWithDetailTab cũ).

### 6.5. Bỏ "Cấu hình theo dõi" tab — rủi ro
- Hiện `TrackingConfigPanel` cho phép manager toggle field nào theo dõi ở zone level ngay trong giai đoạn planning. Nếu mặc định show hết → BE PUT `/tracking-config` còn dùng không? Nếu vẫn còn (vì farmer mobile cần), thì FE chỉ "ẩn UI cấu hình", không xoá API. Cần confirm với BE.
- Nếu BE quyết định bỏ luôn: cần migration để default tất cả zone bật full tracking → cần BE work.

### 6.6. Milestone list — load performance
- Hiện list 50 milestones max, mỗi item nhỏ, không issue. Nhưng nếu add real-time status (in_progress khi farmer mark) cần invalidate query — pattern đã có ([useEmployeeTask.ts:22](../src/queries/useEmployeeTask.ts#L22)).

### 6.7. Hành vi "Hoàn thành" cho task
- User nhấn mạnh thao tác này chỉ làm trong "Quản lý công việc" của milestone. Cần đảm bảo `TaskManagementPanel` (cũ, ở zone-scope) **không còn được mount** ở trang A nữa — đúng theo plan. Tránh case có 2 nơi mark complete song song.

### 6.8. History season detail
- Khi user vào "Lịch sử vụ mùa" → chọn 1 vụ cũ → cần xem cảm biến/sự cố/công việc cũ không? Hiện tại `historyDetail` cho phép vào tabs của vụ cũ ([ManagerCropSeasonsPage.tsx:612-695](../src/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage.tsx#L612-L695)). Sau refactor, history detail nên reuse cùng layout (summary card + milestone list + click → milestone detail read-only). Tránh viết một layout history riêng.

---

## 7. Implementation phasing đề xuất

**Phase 1 — FE pure (không cần BE)**
1. Refactor `CropSeasonSummaryCard` (info 1 hàng, density hiện tại, footer buttons).
2. Tạo `HistoryMenu` dropdown, xoá sidebar, chuyển state sang URL params.
3. Tạo `MilestoneListPanel` thay `MilestonesWithDetailTab` trong trang A.
4. Gộp 2 route milestone detail; tabs ngang; mount `MilestoneTasksTab` với 3 section (chấp nhận tạm: nhật ký công việc vẫn theo zone, hiển thị banner "đang lọc theo milestone — sắp có").

**Phase 2 — cần BE**
5. BE thêm `milestoneId` filter cho `/daily-logs` (manager) + `/incidents`. FE thêm filter vào hook + panel.
6. Confirm + ship "Mật độ hiện tại" (formula hoặc field mới).

**Phase 3 — cleanup**
7. Xoá `ManagerMilestoneOverviewPage.tsx` (redirect).
8. Xoá `TrackingConfigPanel` khỏi UI (giữ file/service nếu BE còn dùng).
9. Xoá `MilestonesWithDetailTab.tsx`, `DailyLogsTab.tsx` cũ nếu không còn import.

---

## 8. Mockup luồng (text)

**A. Vào zone → default view:**
```
[←] Quản lý mùa vụ                              [+ Tạo mùa vụ] [Lịch sử ▾]
    Khu A1                                              [Zone switcher]

┌──── Vụ Dưa lưới [Active] ───────────────────────  [Gửi duyệt]  ─┐
│ Loại: Dưa · Giống: Taki                                          │
│ Ngày trồng | TH dự kiến | TH thực tế | Diện tích | Số cây | Mật độ│
│   01/06     |  15/09     |    —       |  500m²   |  2,000 | 4/m² │
│ Ghi chú: …                                                       │
│                                  [Kế hoạch vs Thực tế] [Thu hoạch]│
└──────────────────────────────────────────────────────────────────┘

Mốc công việc (4)
  #1  Gieo trồng           [Hoàn thành]    01/06 – 10/06     →
  #2  Sinh trưởng          [Đang thực hiện] 11/06 – 20/07    →
  #3  Ra hoa               [Chưa diễn ra]   21/07 – 10/08    →
  #4  Thu hoạch            [Chưa diễn ra]   11/08 – 15/09    →
```

**B. Click vào "Mốc #2":**
```
Crop seasons / Vụ Dưa lưới / Mốc #2 Sinh trưởng

Chi tiết mốc · #2 Sinh trưởng     [Đang thực hiện]
Kế hoạch: 11/06 – 20/07   ·   Thực tế: 12/06 – …
─────────────────────────────────────────────────
[ Cảm biến ] [ Sự cố ] [ Công việc ]
─────────────────────────────────────────────────
<tab content>
```

**C. Tab "Công việc":**
```
Quản lý công việc                    [+ Thêm] [Filter ▾]
┌────────────────────────────────────────────────────┐
│ Tưới nước · Nguyễn A · 14/06 · ⏳        [⋮ Sửa…] │
│ Bón phân · Trần B   · 15/06 · ✓ Hoàn thành         │
└────────────────────────────────────────────────────┘

Công việc theo ngày — 24/05/2026
┌────────────────────────────────────────────────────┐
│ • Tưới sáng    Nguyễn A   ✅ đã log               │
│ • Kiểm tra sâu Trần B     ⚠️ chưa log             │
└────────────────────────────────────────────────────┘

Nhật ký công việc        [Từ 01/06] [Đến 24/05] [Áp dụng]
<table logs>
```

---

## 9. Checklist sẵn sàng implement

- [ ] Confirm semantic "Mật độ hiện tại" (derive vs BE field).
- [ ] Confirm "Lịch sử duyệt" = season hiện tại (mình đề xuất).
- [ ] Confirm BE chấp nhận thêm `milestoneId` filter cho daily-logs + incidents.
- [ ] Confirm bỏ UI `TrackingConfigPanel` — BE vẫn giữ endpoint cho farmer mobile?
- [ ] Confirm default tab milestone ở state `planning` (Cảm biến config vs Công việc).
- [ ] Designer review mockup → mình bắt đầu Phase 1.
