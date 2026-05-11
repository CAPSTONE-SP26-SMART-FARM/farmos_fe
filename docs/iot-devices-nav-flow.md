# IoT Devices Admin — Navigation Flow Analysis

## 1. Sơ đồ các trang

```
Sidebar
  └── "Bộ kit IoT" → /dashboard/admin/iot-devices  (List)
```

| Route | Component | Vai trò |
|---|---|---|
| `/dashboard/admin/iot-devices` | `AdminIotDevicesPage` | Danh sách tất cả thiết bị |
| `/dashboard/admin/iot-devices/create` | `AdminCreateIotDevicesPage` | Tạo bộ kit mới (multi-step) |
| `/dashboard/admin/iot-devices/:id` | `AdminIotDeviceDetailPage` | Xem chi tiết thiết bị |
| `/dashboard/admin/iot-devices/:id/edit` | `AdminEditIotDevicePage` | Chỉnh sửa thiết bị |

---

## 2. Flow điều hướng chi tiết

### 2.1 List page — điểm xuất phát

```
List
 ├── [Button] "Tạo bộ kit mới"     → /create
 ├── [Button] "Chi tiết" (mỗi card) → /:id       (Detail)
 ├── [Icon]   Pencil (mỗi card)     → /:id/edit   (Edit) ← bypass Detail
 └── [Icon]   Trash  (mỗi card)     → ConfirmDialog → xóa → ở lại List
```

### 2.2 Create page — multi-step (2 bước trong cùng 1 route)

```
/create
 │
 ├── Step 1 — Tạo lô thiết bị (IotDeviceForm)
 │    ├── [Button] "Quay lại"          → List  (chưa tạo gì)
 │    ├── Submit thành công            → Step 1b (EditBoard)
 │    │
 │    └── Step 1b — Chỉnh sửa board vừa tạo (EditBoardWithSubDevices)
 │         ├── [Button] "Quay lại"     → ConfirmDialog → xóa toàn bộ batch → List
 │         └── [Button] "Tiếp tục"    → Step 2
 │
 └── Step 2 — Gắn cảm biến (SensorStep)
      ├── [Button] "Quay lại chỉnh sửa thiết bị" → Step 1b
      └── Submit cảm biến thành công              → List
```

> State của step được giữ trong `useState` local — reload trang sẽ reset về Step 1 và mất batch đã tạo.

### 2.3 Detail page

```
/:id  (Detail)
 ├── [Button] "Quay lại"           → List
 ├── [Dialog] AssignOwnerDialog    → mở từ trong trang (không đổi route)
 └── [Dialog] UnassignOwnerDialog  → mở từ trong trang (không đổi route)
```

### 2.4 Edit page

```
/:id/edit  (Edit)
 ├── [Button] "Quay lại" / onBack  → /:id  (Detail)
 └── Submit thành công             → /:id  (Detail)
```

---

## 3. Toàn cảnh graph

```
Sidebar ──────────────────────────────────────────────┐
                                                       ↓
                                                    [ LIST ]
                                                   ↗    ↓    ↘
                                             [CREATE] [DETAIL] [EDIT]
                                               ↘         ↓      ↗
                                             LIST      [EDIT] (thiếu)
```

Chi tiết hướng mũi tên:

```
LIST   →(Tạo mới)→    CREATE  →(done)→     LIST
LIST   →(Chi tiết)→   DETAIL  →(back)→     LIST
LIST   →(Pencil)→     EDIT    →(back)→     DETAIL
DETAIL →(không có)→   EDIT    ← đây là gap
EDIT   →(back/save)→  DETAIL
```

---

## 4. Đánh giá: Cồng kềnh hay rõ ràng?

### Điểm tốt

- **Ít trang, ít route** — 4 route cho toàn bộ CRUD, không over-engineer.
- **Create flow được tách rõ** — 2 bước trong cùng 1 route giúp tránh tình trạng user thoát giữa chừng và orphan data tồn tại mà không gắn sensor.
- **ConfirmDialog** trước khi cancel batch — bảo vệ tốt, vì batch đã được tạo thật trên DB.
- **Edit → Detail** sau khi lưu — đúng expected behavior, user thấy kết quả ngay.
- **Breadcrumb động** (`useDynamicBreadcrumb`) — hiện tên thiết bị thay vì `deviceId` raw, UX tốt hơn.
- **AssignOwner / UnassignOwner** dùng Dialog trong trang — không cần route riêng, phù hợp vì là thao tác phụ.

### Vấn đề — Navigation gap

**Detail → Edit bị thiếu.**

Từ trang chi tiết (`/:id`), admin không có nút "Chỉnh sửa". Để edit, phải:
1. Nhấn "Quay lại" về List
2. Tìm lại thiết bị trong danh sách
3. Nhấn icon Pencil

Đây là bước thừa rõ ràng. Thông thường Detail page nên có nút "Chỉnh sửa" dẫn thẳng đến `/:id/edit`.

**Pencil icon trên List bypass Detail.**

List card có cả "Chi tiết" và icon Pencil song song. Admin có thể vào Edit mà không xem qua Detail. Trong trường hợp phức tạp (device đang assign cho owner, có sensor đặc biệt), thiếu context có thể dẫn đến sửa nhầm.

### Recommendation

```
Detail page → thêm Button "Chỉnh sửa thiết bị" → /:id/edit
```

Không cần đổi route structure, chỉ thêm 1 nút trong `IotDeviceDetail` khi `actor === "admin"`.

---

## 5. Tóm tắt

| Tiêu chí | Đánh giá |
|---|---|
| Số lượng route | Hợp lý (4 route) |
| Multi-step create | Rõ ràng, có guard cancel |
| Breadcrumb | Tốt — tên động |
| Dialog (Assign/Unassign) | Đúng — không cần route |
| Detail → Edit | **Thiếu** — phải vòng qua List |
| Tổng thể | Gọn, dễ theo, chỉ cần fix 1 gap |
