# 05 - User Flow Template

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Mục đích

Trước khi implement bất kỳ screen nào, phải mô tả **đầy đủ luồng thao tác của user**.  
Luồng này quyết định:
- Component nào cần tạo
- State nào cần quản lý
- API nào cần gọi và ở đâu
- UX pattern nào phù hợp (modal vs page, card vs table, tab vs step)

---

## Template mô tả User Flow

Điền đầy đủ các mục dưới đây trước khi code:

---

### Screen: [Tên màn hình]

**Route:** `/dashboard/[role]/[feature]`  
**Role:** Owner / Manager / Admin / Doctor  
**Mục đích:** [1 câu mô tả mục tiêu của màn hình]

---

#### 1. Entry point

User vào màn hình bằng cách nào?
- [ ] Click menu sidebar
- [ ] Navigate từ màn hình khác (ghi rõ: từ đâu, action gì trigger)
- [ ] Deep link / URL trực tiếp
- [ ] Redirect sau action (ghi rõ: sau action nào)

**Data cần load ngay khi vào trang:** (list API calls cần thiết)
- `GET /api/[endpoint]` — để hiển thị gì
- `GET /api/[endpoint]` — để populate dropdown/filter

---

#### 2. Happy path (luồng chính)

Mô tả từng bước user thao tác theo thứ tự:

```
1. User thấy [gì trên màn hình chính]
2. User thực hiện [action đầu tiên]
   → Hệ thống phản hồi: [UI thay đổi như thế nào]
3. User thực hiện [action tiếp theo]
   → API call: [POST/PUT/DELETE] /[endpoint]
   → Thành công: [toast message + UI cập nhật gì]
   → Thất bại: [error message ở đâu]
4. [tiếp tục...]
```

---

#### 3. Sub-flows (các nhánh phụ)

Liệt kê các tình huống phụ user có thể thực hiện:

**[Sub-flow A]: Tên action phụ**
```
Trigger: User click [gì]
Flow: 
  1. ...
  2. ...
Result: ...
```

**[Sub-flow B]: Tên action phụ**
```
...
```

---

#### 4. Edge cases (trạng thái đặc biệt)

- **Empty state**: Khi chưa có data — hiển thị gì, có CTA không?
- **Loading state**: Skeleton hay spinner? Full page hay inline?
- **Error state**: API lỗi — message gì, có retry button không?
- **Permission denied**: Role không đủ quyền — redirect hay hide element?
- **Subscription required**: Feature cần subscription — redirect đến trang nâng cấp?

---

#### 5. Component breakdown (sau khi có flow)

Từ flow trên, xác định các component cần tạo:

| Component | Loại | Mô tả |
|-----------|------|-------|
| `[Feature]Page.tsx` | Page | Orchestration, fetch data |
| `_components/[Feature]Table.tsx` | Sub-component | Hiển thị danh sách |
| `_components/Create[Feature]Dialog.tsx` | Sub-component | Form tạo mới |
| `_components/[Feature]Form.tsx` | Sub-component | Form fields dùng chung |

---

#### 6. API calls map

| Action | Method | Endpoint | Query Hook | Khi nào gọi |
|--------|--------|----------|------------|-------------|
| Load danh sách | GET | `/[endpoint]` | `use[Entity]List` | Mount |
| Tạo mới | POST | `/[endpoint]` | `useCreate[Entity]` | Submit form |
| Cập nhật | PUT | `/[endpoint]/:id` | `useUpdate[Entity]` | Submit edit form |
| Xóa | DELETE | `/[endpoint]/:id` | `useDelete[Entity]` | Confirm delete |

---

## Ví dụ đã điền — Màn hình quản lý IoT Device (Owner)

**Route:** `/dashboard/owner/iot-devices`  
**Role:** Owner  
**Mục đích:** Owner xem danh sách thiết bị IoT đã thuê và quản lý trạng thái

---

#### 1. Entry point

- Click "Thiết bị IoT" trên sidebar
- Data load ngay: `GET /owner/iot-devices` (danh sách), `GET /owner/zones` (filter theo zone)

---

#### 2. Happy path

```
1. User thấy: KPI cards (tổng thiết bị, đang hoạt động, cần bảo trì)
              + Table danh sách thiết bị (tên, loại, zone, status, ngày thuê)
2. User muốn filter theo zone → click dropdown "Zone"
   → Gọi lại API với query param zoneId
   → Table cập nhật
3. User click "Thêm thiết bị" 
   → Dialog tạo mới xuất hiện
4. User điền form (tên, loại, zone, serial number)
   → Submit → POST /owner/iot-devices
   → Thành công: "Thêm thiết bị thành công!" + dialog đóng + table refresh
   → Thất bại: Error message dưới form field bị lỗi
5. User click "..." menu trên row → chọn "Xem chi tiết"
   → Navigate đến /dashboard/owner/iot-devices/:id
```

---

#### 3. Sub-flows

**[Sub-flow A]: Xóa thiết bị**
```
Trigger: Click "..." → "Xóa thiết bị"
Flow:
  1. AlertDialog xác nhận: "Bạn có chắc muốn xóa thiết bị này?"
  2. Confirm → DELETE /owner/iot-devices/:id
  3. Thành công: "Xóa thiết bị thành công!" + row biến mất
```

**[Sub-flow B]: Xem log thiết bị**
```
Trigger: Click "Xem log" trong row actions
Flow:
  1. Navigate đến /dashboard/owner/iot-devices/:id/logs
  2. Load log list với filter theo date range
```

---

#### 4. Edge cases

- **Empty**: "Chưa có thiết bị IoT nào" + button "Thêm thiết bị đầu tiên"
- **Loading**: `TableSkeleton` component (5 rows)
- **Error**: `ErrorState` với message "Không thể tải danh sách thiết bị"
- **Subscription expired**: Redirect đến `/dashboard/owner/subscription-plans`

---

#### 5. Component breakdown

| Component | Loại | Mô tả |
|-----------|------|-------|
| `OwnerIotDevicesPage.tsx` | Page | Fetch data, manage filters |
| `_components/IotDeviceTable.tsx` | Sub | Table với columns: tên, loại, zone, status |
| `_components/CreateIotDeviceDialog.tsx` | Sub | Dialog + form tạo mới |
| `_components/IotDeviceKpiCards.tsx` | Sub | 3 KPI cards thống kê |
| `_components/IotDeviceRowActions.tsx` | Sub | Dropdown menu actions per row |

---

#### 6. API calls map

| Action | Method | Endpoint | Query Hook | Khi nào gọi |
|--------|--------|----------|------------|-------------|
| Load danh sách | GET | `/owner/iot-devices` | `useOwnerIotDeviceList` | Mount |
| Load zones | GET | `/owner/zones` | `useOwnerZoneList` | Mount (cho filter) |
| Tạo mới | POST | `/owner/iot-devices` | `useCreateIotDevice` | Submit form |
| Xóa | DELETE | `/owner/iot-devices/:id` | `useDeleteIotDevice` | Confirm delete |
