# IoT Devices — UI Best Practice Review

## Tóm tắt nhanh

| Hạng mục | Kết quả |
|---|---|
| Component structure | Tốt, nhưng 1 file vượt 500 dòng |
| shadcn/ui compliance | Đầy đủ |
| Loading / empty states | Có, nhưng thiếu error state và refetch indicator |
| Dark mode | Hỗ trợ tốt |
| Accessibility | Yếu — thiếu aria-label, role |
| Constant/label nhất quán | **Không** — nhiều chỗ định nghĩa lại, label khác nhau |
| API call hiệu quả | Có vấn đề — 4 calls chỉ để lấy stats |
| Interaction pattern | Có card vừa clickable vừa có button trong — dư thừa |

---

## 1. Label `purchase` — role-aware, thiết kế có chủ đích

Cùng status `purchase` nhưng label khác nhau theo actor — đây là **intentional design**:

| Actor | Label | Ngữ nghĩa |
|---|---|---|
| Admin | `"Đã cho thuê"` | Thiết bị đã được gán cho owner |
| Owner / Manager | `"Khả dụng"` | Thiết bị đã được thuê, owner có thể dùng |

Cùng 1 trạng thái, 2 góc nhìn khác nhau — Admin thấy từ phía cung cấp, Owner thấy từ phía sử dụng. Logic đúng, không phải bug.

**Điểm cần lưu ý:** Vì constants bị định nghĩa riêng ở từng file (xem mục 2), việc duy trì 2 label khác nhau này đang nằm ở 2 chỗ tách biệt không liên kết. Nếu sau này thêm actor mới hoặc đổi tên label, dễ bị miss. Nên đặt rõ trong shared constants với comment giải thích lý do.

---

## 2. Constants bị duplicate ở nhiều file

Các object sau được định nghĩa lại trong từng file riêng biệt:

| Constant | Xuất hiện ở |
|---|---|
| `DEVICE_TYPE_LABEL` | `AdminIotDevicesPage`, `IotDeviceDetail`, `IotDeviceList` |
| `DEVICE_TYPE_ICON` | `AdminIotDevicesPage`, `IotDeviceDetail`, `IotDeviceList` |
| `STATUS_META` / `DEVICE_STATUS_BADGE_CLASS` | `AdminIotDevicesPage` (dùng border variant), `IotDeviceDetail` (dùng bg-only), `IotDevDeviceList` (bg-only) |
| `SENSOR_TYPE_LABEL` | `IotDeviceDetail:89` và `AdminCreateIotDevicesPage:56` |

Hậu quả thực tế: badge status trên **List admin** có border (`border-blue-300 bg-blue-50`), nhưng badge cùng status trên **Detail** và **Owner list** không có border (`bg-blue-100`) → giao diện trông khác nhau giữa các trang.

**Cần tạo** `src/constants/iotDevice.ts` chứa tất cả constants dùng chung.

Ngoài ra `light_intensity` bị viết khác nhau:
- `IotDeviceDetail.tsx:91`: `"Cường độ sáng"`
- `AdminCreateIotDevicesPage.tsx:60`: `"Cường độ ánh sáng"`

---

## 3. IotDeviceList — 4 API calls chỉ để lấy stat counters

`IotDeviceList.tsx:151–154` gọi 4 query riêng với `limit: 1` chỉ để lấy `meta.totalItems`:

```tsx
const totalStatQuery  = useStat(farmId, { page: 1, limit: 1 }, true);
const installStatQuery = useStat(farmId, { page: 1, limit: 1, status: "install" }, true);
const activeStatQuery  = useStat(farmId, { page: 1, limit: 1, status: "active" }, true);
const errorStatQuery   = useStat(farmId, { page: 1, limit: 1, status: "error" }, true);
```

Mỗi lần component mount → 4 network requests thừa. Đây là workaround vì BE chưa có endpoint stats riêng.

**Giải pháp tốt hơn:**
- Phía BE: thêm endpoint `GET /iot-devices/stats` trả về breakdown theo status
- Hoặc phía FE: tạm thời bỏ stat cards đi cho đến khi BE hỗ trợ, thay bằng số từ `meta.totalItems` của query chính

---

## 4. DeviceCard trong IotDeviceList — double interaction

`IotDeviceList.tsx:347–383`: card vừa có `onClick={onDetail}` bao ngoài, vừa có Button "Xem chi tiết" bên trong với `e.stopPropagation()`:

```tsx
<div onClick={onDetail} className="... cursor-pointer ...">
  ...
  <Button onClick={(e) => { e.stopPropagation(); onDetail(); }}>
    Xem chi tiết
  </Button>
</div>
```

- Button làm đúng 1 việc với card → UX dư thừa, screen reader đọc 2 target cùng chức năng
- `div[onClick]` không phải keyboard-accessible (không phải `button` hay `a`)

**Cần sửa:** bỏ `onClick` trên div, giữ Button (hoặc bọc cả card bằng `button` element với styling phù hợp).

---

## 5. Thiếu error state ở tất cả các trang

Tất cả pages chỉ handle `isLoading` và `devices.length === 0`, bỏ qua `isError`:

```tsx
// AdminIotDevicesPage.tsx:197–204
{listQuery.isLoading ? (
  <Loader2 ... />
) : devices.length === 0 ? (
  <p>Không có dữ liệu</p>
) : (
  // render list
)}
```

Khi API lỗi, `devices` = `[]` (fallback từ `?? []`), user thấy "Không có dữ liệu thiết bị" thay vì thông báo lỗi thực — gây hiểu nhầm.

**Cần thêm:**
```tsx
} : listQuery.isError ? (
  <p className="text-destructive">Không thể tải danh sách. Thử lại sau.</p>
) : devices.length === 0 ? (
```

---

## 6. Không có refetch indicator khi filter thay đổi

Khi user đổi status filter hoặc search, React Query sẽ `isFetching = true` nhưng vẫn hiện data cũ (stale) mà không có indicator nào. User không biết dữ liệu đang được cập nhật.

**Cần thêm** subtle indicator khi `isFetching && !isLoading`:
```tsx
{listQuery.isFetching && !listQuery.isLoading && (
  <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
)}
```
Đặt cạnh CardTitle hoặc góc phải của filter bar.

---

## 7. Thiếu aria-label trên icon buttons

`AdminIotDevicesPage.tsx:258–278`: các icon button chỉ có `title` (tooltip trên desktop), không có `aria-label`:

```tsx
<Button size="icon" variant="outline" title="Chỉnh sửa">
  <Pencil className="h-4 w-4" />
</Button>
```

Screen reader sẽ đọc là "button" không tên. `title` không được đọc bởi nhiều screen reader.

**Cần thêm** `aria-label="Chỉnh sửa thiết bị [tên device]"` cho mỗi icon button.

---

## 8. Pagination ẩn khi totalPages = 1

`AdminIotDevicesPage.tsx:286` và `IotDeviceList.tsx:297`:
```tsx
{meta && meta.totalPages > 1 && (
  <div>Trang {meta.page} / {meta.totalPages} ({meta.totalItems} mục)</div>
)}
```

Khi chỉ có 1 trang, thông tin "X mục" bị ẩn hoàn toàn. User không biết đang xem bao nhiêu thiết bị tổng cộng.

**Cần tách:** hiện tổng số mục luôn, chỉ ẩn prev/next khi 1 trang.

---

## 9. SensorBatchSchema định nghĩa trong page file

`AdminCreateIotDevicesPage.tsx:67–101` định nghĩa `SensorItemSchema` và `SensorBatchSchema` nội bộ trong page component. Schema validation nên nằm ở `src/schemaValidatation/iotDevice.ts` để tái sử dụng và test riêng.

---

## 10. IotDeviceDetail — 3 queries đều khởi tạo dù chỉ 1 active

`IotDeviceDetail.tsx:117–141`: cả 3 queries (admin, owner, manager) đều được gọi với `enabled` flag để chỉ 1 query thực sự chạy. Pattern này hợp lệ với React Query nhưng đăng ký 3 hooks mỗi render, không tối ưu.

Pattern sạch hơn là dùng 1 hook factory nhận `actor` làm param và resolve query nội bộ.

---

## 11. SensorCard — hiển thị range chưa rõ

`IotDeviceDetail.tsx:370`:
```tsx
<div>Nhỏ nhất: {sensor.minValue} | Lớn nhất: {sensor.maxValue}</div>
```

Pipe `|` không rõ nghĩa, không có đơn vị đo. Hiển thị tốt hơn:
```
Ngưỡng: 0 – 100  (đơn vị tùy sensor type)
```

---

## Các điểm đã tốt — không cần thay đổi

- Sử dụng đầy đủ shadcn components (`Badge`, `Button`, `Card`, `Dialog`, `Select`, `Input`, `Skeleton`)
- Dark mode đầy đủ trên tất cả badge và card colors
- `useDebounce` đúng nơi đúng chỗ (search input)
- `ConfirmDialog` trước các thao tác destructive
- `animate-in fade-in` page transition mượt
- Breadcrumb động với tên thiết bị thực
- `useMemo` cho `effectiveQuery` tránh re-render thừa
- Form validation với Zod + React Hook Form + server error mapping
- Multi-step create flow phù hợp để tránh orphan data

---

## Tổng kết ưu tiên sửa

| Ưu tiên | Vấn đề | Effort |
|---|---|---|
| P0 | Constants duplicate + badge style khác nhau giữa admin/owner | Trung bình |
| P1 | Thiếu error state | Thấp |
| P1 | `div[onClick]` không accessible trong DeviceCard | Thấp |
| P1 | Thiếu aria-label icon buttons | Thấp |
| P2 | 4 API calls chỉ để lấy stats | Cao (cần BE) |
| P2 | Thiếu refetch indicator | Thấp |
| P2 | Pagination ẩn totalItems khi 1 trang | Thấp |
| P3 | SensorBatchSchema trong page file | Thấp |
| P3 | SensorCard range display | Thấp |
