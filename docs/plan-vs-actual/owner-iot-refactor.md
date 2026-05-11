# Refactor Plan — Owner IoT Devices (`/dashboard/owner/iot`)

> **Ngày tạo:** 2026-05-11  
> **Scope:** `src/pages/OwnerPage/IotDevices/` — chỉ luồng Owner, không đụng Admin  
> **Tham chiếu:** `docs/RULES-REACT-001/01-context-project.md`, `docs/RULES-REACT-001/14-ux-layout-thinking.md`

---

## 0. Cấu trúc đúng — 2 tầng nội dung

Page `/dashboard/owner/iot` có **2 mục tiêu khác nhau**, không nên gộp chung:

| Tầng | Nội dung | Component |
|------|----------|-----------|
| **Page chính** | Tổng hạn mức IoT từ subscription + kit mua thêm | `IotQuotaWidget variant="full"` |
| **Tab "Thiết bị IoT"** | Danh sách thiết bị thực tế đã gán vào farm | `IotDeviceList` |

**Hiện trạng sai:** Page dùng `IotQuotaWidget variant="compact"` + gộp `IotDeviceList` vào cùng 1 view — quota bị thu nhỏ thành 1 dòng, không đủ context cho user.

---

## 0.1 Phân tích UX 4 câu hỏi (theo Rule 14)

### Tầng 1 — Page quota

```
1. User vào để làm GÌ?     → Kiểm tra còn bao nhiêu hạn mức, đã dùng bao nhiêu
2. Cần biết GÌ trước?      → Subscription đang có, kit bonus, ngày hết hạn
3. Sẽ làm sai gì?          → Không biết hết quota → cố assign → bị block
4. Xong rồi đi đâu?        → Tab "Thiết bị IoT" hoặc trang mua thêm kit
```

### Tầng 2 — Tab thiết bị

```
1. User vào để làm GÌ?     → Xem danh sách thiết bị, kiểm tra trạng thái, xem chi tiết
2. Cần biết GÌ trước?      → Đang xem farm nào (farmId không được rỗng)
3. Sẽ làm sai gì?          → Filter xong quên xóa → nghĩ không có thiết bị
4. Xong rồi đi đâu?        → Trang detail thiết bị
```

**Pattern phù hợp:**
- Page chính: Pattern B (KPI cards) — `IotQuotaWidget full` đã đủ 4 KPI
- Tab thiết bị: Pattern B (Filter + List)

---

## 1. Vấn đề hiện tại

### 1.1 farmId rỗng — dữ liệu sai ngay từ đầu

```tsx
// OwnerIotDevicesPage.tsx (hiện tại)
<IotDeviceList farmId="" farmName="" actor="owner" ... />
```

`farmId` truyền vào là chuỗi rỗng → query luôn sai hoặc bị skip.  
Owner phải chọn farm từ `farmStore` (global state) trước khi load danh sách thiết bị.

**Fix:** Lấy `selectedFarm` từ `useFarmStore()`, truyền `farmId` và `farmName` thực.

---

### 1.2 4 API calls chỉ để lấy stat counters

```tsx
// IotDeviceList.tsx:151–154
const totalStatQuery   = useStat(farmId, { page: 1, limit: 1 }, true);
const installStatQuery = useStat(farmId, { page: 1, limit: 1, status: "install" }, true);
const activeStatQuery  = useStat(farmId, { page: 1, limit: 1, status: "active" }, true);
const errorStatQuery   = useStat(farmId, { page: 1, limit: 1, status: "error" }, true);
```

4 network requests mỗi lần mount chỉ để lấy `meta.totalItems`. Không có endpoint stats riêng từ BE.

**Fix tạm thời:** Bỏ stat cards, thay bằng số từ `meta.totalItems` của query chính.  
**Fix đúng:** Yêu cầu BE thêm `GET /iot-devices/stats?farmId=...` → 1 request trả breakdown.

---

### 1.3 State-based navigation thay vì URL routing

```tsx
// OwnerIotDevicesPage.tsx
type NavState = { level: 1 } | { level: 2; device: IotDeviceResType };
const [nav, setNav] = useState<NavState>({ level: 1 });
```

- User không thể bookmark trang detail
- Browser back button không hoạt động đúng
- Reload trang ở detail → bắn về level 1, mất context

**Fix:** Chuyển sang URL routing (xem mục 3).

---

### 1.4 DeviceCard — double interaction + không accessible

```tsx
// IotDeviceList.tsx:347–383
<div onClick={onDetail} className="cursor-pointer ...">
  ...
  <Button onClick={(e) => { e.stopPropagation(); onDetail(); }}>
    Xem chi tiết
  </Button>
</div>
```

- `div[onClick]` không phải keyboard-accessible element
- Button bên trong làm đúng 1 việc với div ngoài → screen reader đọc 2 target cùng chức năng
- `stopPropagation` là signal của double interaction smell

**Fix:** Bọc card bằng `<button>` hoặc bỏ `onClick` trên div, giữ Button duy nhất.

---

### 1.5 Thiếu error state

```tsx
// Pattern hiện tại ở tất cả trang
{listQuery.isLoading ? <Skeleton /> : devices.length === 0 ? <Empty /> : <List />}
```

Khi API lỗi: `devices = []` (do `?? []`), user thấy "Không có thiết bị" thay vì thông báo lỗi.

**Fix:** Thêm nhánh `listQuery.isError` trước `devices.length === 0`.

---

### 1.6 Thiếu refetch indicator khi filter/search thay đổi

React Query giữ stale data khi `isFetching = true` nhưng không có indicator nào cho user biết.  
User đổi filter → dữ liệu cũ vẫn hiện → user không biết đang load mới.

**Fix:** Hiện spinner nhỏ cạnh title khi `isFetching && !isLoading`.

---

### 1.7 Pagination ẩn tổng số khi totalPages = 1

```tsx
{meta && meta.totalPages > 1 && (
  <div>{meta.totalItems} mục</div>
)}
```

Khi chỉ có 1 trang → tổng số thiết bị bị ẩn hoàn toàn. User không biết đang xem bao nhiêu.

**Fix:** Luôn hiện `meta.totalItems`, chỉ ẩn prev/next buttons khi `totalPages <= 1`.

---

### 1.8 IotDeviceForm quá lớn

File `IotDeviceForm.tsx` — ước tính ~78KB, vượt xa giới hạn 500 dòng.  
Chứa cả batch create và edit flow trong 1 file.

**Fix:** Tách thành:
- `IotDeviceFormBatchCreate.tsx` — batch create flow
- `IotDeviceFormEdit.tsx` — single device edit flow
- `_components/DeviceFormItem.tsx` — 1 device item trong batch
- `_components/SensorFormSection.tsx` — phần cảm biến

---

### 1.9 IotDeviceDetail — 3 queries đều init dù chỉ 1 active

```tsx
// IotDeviceDetail.tsx:117–141
const adminQuery   = useAdminIotDeviceDetail(deviceId, { enabled: actor === "admin" });
const ownerQuery   = useOwnerIotDeviceDetail(deviceId, farmId, { enabled: actor === "owner" });
const managerQuery = useManagerIotDeviceDetail(deviceId, farmId, { enabled: actor === "manager" });
```

3 hook calls mỗi render dù chỉ 1 chạy thực sự.

**Fix:** Tạo `useIotDeviceDetail(actor, deviceId, farmId)` factory hook resolve nội bộ.

---

## 2. Layout Refactor — Tách 2 tầng

### Hiện tại (sai)

```
[IotQuotaWidget - compact]   ← Bị thu nhỏ thành 1 dòng, mất thông tin
[IotDeviceList]              ← Gộp chung, không rõ context
```

### Đề xuất — Page chính (quota)

Dùng `IotQuotaWidget variant="full"` — đã đủ 4 KPI cards sẵn có:

```
┌────────────────────────────────────────────────────────┐
│  Hạn mức thiết bị IoT                                  │
│  Đồng pha với gói đăng ký · Hết hạn DD/MM/YYYY        │
├──────────┬──────────────┬──────────────┬───────────────┤
│ Hạn mức  │ Kit mua thêm │  Đang dùng   │ Chưa sử dụng │
│  gói: N  │   bonus: N   │    N/tổng    │      N        │
└──────────┴──────────────┴──────────────┴───────────────┘
                                          [Tab: Thiết bị IoT]
```

**Không cần custom KPI** — `IotQuotaWidget full` đã có đủ, chỉ cần đổi từ `compact` → `full`.

> **Quan trọng:** Owner chỉ được **xem** quota, không được assign. Chỉ Admin mới assign quota qua subscription management. Widget này là read-only hoàn toàn — không thêm bất kỳ edit/assign control nào vào Owner page.

### Đề xuất — Tab "Thiết bị IoT"

```
┌──────────────────────────────────────────────────────┐
│  [Search...] [Filter: Trạng thái ▾] [Limit ▾]  [🔄]  │  ← Controls
├──────────────────────────────────────────────────────┤
│  [DeviceCard]  [DeviceCard]                          │  ← Grid 2 cols
│  [DeviceCard]  [DeviceCard]                          │
├──────────────────────────────────────────────────────┤
│  12 thiết bị    [← Trước]  Trang 1/2  [Sau →]       │  ← Pagination luôn hiện total
└──────────────────────────────────────────────────────┘
```

**Lý do tách:**
- Quota = thông tin về contract/subscription (cần đọc để biết còn slot không)
- Device list = operational (xem từng thiết bị cụ thể)
- Người dùng thường vào quota để check nhanh, vào device list khi cần troubleshoot — 2 intent khác nhau

---

## 3. Routing Refactor — URL thay vì State

### Hiện tại

```
/dashboard/owner/iot  →  OwnerIotDevicesPage (level 1 hoặc level 2 trong state)
```

### Đề xuất

```
/dashboard/owner/iot           →  IotDeviceList page
/dashboard/owner/iot/:deviceId →  IotDeviceDetail page
```

**Cách implement:**
1. Tạo `OwnerIotDevicesPage.tsx` chỉ render `<IotDeviceList>`
2. Tạo `OwnerIotDeviceDetailPage.tsx` nhận `deviceId` từ `useParams()`
3. Thêm 2 route vào `routes/` (xem files route hiện tại để đặt đúng chỗ)
4. `IotDeviceList` dùng `useNavigate("/dashboard/owner/iot/:id")` thay vì `onDetail` callback
5. `IotDeviceDetail` dùng `useNavigate(-1)` hoặc link về list thay vì `onBack` callback

**Lợi ích:**
- Browser back/forward hoạt động đúng
- User có thể bookmark trang detail
- Reload trang ở detail vẫn load đúng device

---

## 4. Kế hoạch thực hiện (theo ưu tiên)

### P0 — Sửa data-breaking bug (làm trước)

- [ ] **Fix farmId rỗng** trong `OwnerIotDevicesPage`: lấy `selectedFarm` từ `useFarmStore()`
- [ ] Thêm guard: nếu chưa chọn farm → hiện empty state "Vui lòng chọn trang trại"

### P1 — UX fixes (không đụng layout)

- [ ] Thêm error state: `listQuery.isError ? <ErrorMessage /> : ...`
- [ ] Bỏ `div[onClick]`, sửa `DeviceCard` thành `<button>` wrapper accessible
- [ ] Luôn hiện `meta.totalItems`, tách khỏi điều kiện `totalPages > 1`
- [ ] Thêm refetch indicator: spinner nhỏ khi `isFetching && !isLoading`
- [ ] Thêm "Xóa bộ lọc" button khi đang filter (status !== "all" hoặc search !== "")
- [ ] Empty state khi có filter active: "Không tìm thấy thiết bị phù hợp. [Xóa bộ lọc]"

### P2 — Layout refactor (Tách 2 tầng)

- [ ] Đổi `IotQuotaWidget variant="compact"` → `variant="full"` trên page chính
- [ ] Tạo tab structure: Tab "Hạn mức" (quota) + Tab "Thiết bị IoT" (device list)
- [ ] Bỏ 3 stat queries dư thừa trong `IotDeviceList` (total/install/active/error riêng lẻ)
- [ ] Điều chỉnh spacing trong tab device list theo Pattern B

### P3 — Routing refactor

- [ ] Tách `OwnerIotDevicesPage` → 2 page components (list + detail)
- [ ] Thêm routes mới vào route config
- [ ] Sửa navigation: `useNavigate` thay vì state callbacks
- [ ] Verify breadcrumb vẫn hoạt động đúng sau khi đổi route

### P4 — Code quality

- [ ] Tách `IotDeviceForm.tsx` (~78KB) thành 4 files nhỏ hơn
- [ ] Tạo `useIotDeviceDetail(actor, deviceId, farmId)` factory hook
- [ ] Move inline schema `SensorBatchSchema` vào `schemaValidatation/iotDevice.ts`

---

## 5. Các điểm KHÔNG thay đổi

- Logic `actor`-aware rendering (owner/manager/admin) — giữ nguyên
- `status: "purchase"` → label "Khả dụng" cho owner (intentional design — xem `iot-devices-ui-review.md`)
- `ConfirmDialog` trước destructive actions
- shadcn/ui components — tiếp tục dùng
- `useDebounce` cho search input
- Zod schema + React Hook Form validation
- **Quota là read-only với Owner** — admin mới được assign quota qua subscription. Không thêm assign/edit quota UI vào bất kỳ chỗ nào trong Owner page.

---

## 6. Files sẽ bị ảnh hưởng

| File | Thay đổi |
|---|---|
| `OwnerIotDevicesPage.tsx` | Fix farmId, thêm FarmGuard, chuyển sang route-based |
| `IotDeviceList.tsx` | Bỏ stat queries, fix DeviceCard, fix pagination, thêm error/refetch state |
| `IotDeviceDetail.tsx` | Sửa navigation (useNavigate), factory hook |
| `IotDeviceForm.tsx` | Tách thành 4 files |
| `routes/` | Thêm route `/dashboard/owner/iot/:deviceId` |
| `queries/useIotDevice.ts` | Thêm `useIotDeviceDetail` factory hook |

---

## 7. Rủi ro

| Rủi ro | Mức độ | Cách giảm thiểu |
|---|---|---|
| Route mới break breadcrumb | Trung bình | Kiểm tra `useDynamicBreadcrumb` sau khi đổi route |
| farmId fix làm query behavior thay đổi | Thấp | Test với farm có nhiều thiết bị |
| Tách IotDeviceForm làm break edit flow | Cao | Tách từng bước, test sau mỗi bước |
| Bỏ 4 stat queries làm mất KPI widget | Thấp | Giữ widget, đổi nguồn data |
