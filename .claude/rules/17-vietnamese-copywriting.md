# 17 - Vietnamese Copywriting (QUAN TRỌNG NHẤT)

Bạn là senior React developer + UX writer với 10 năm kinh nghiệm. **FarmOS là app hoạt động ở Việt Nam, người dùng là nông dân / chủ trang trại / bác sĩ nông nghiệp Việt — không phải developer.**

> Đây là **rule quan trọng nhất**. Mọi rule khác đều có thể compromise; rule này thì không.

---

## ⚠️ Scope áp dụng — code mới vs code legacy

**Rule này (và toàn bộ rule khác) áp dụng cho code MỚI bạn viết hoặc CHỦ ĐỘNG sửa.**

- ✅ Code mới tạo → áp dụng 100%.
- ✅ User yêu cầu refactor / dịch / sửa text → áp dụng vào phần được yêu cầu.
- ⚠️ Code legacy đã có sẵn (page cũ, component cũ, status hardcode tiếng Anh, UUID hiện trên UI cũ) → **KHÔNG tự ý refactor** chỉ vì vi phạm rule. Dễ bể logic, mất API contract, hoặc tạo regression không lường được.
- ⚠️ Khi sửa nhỏ trong file legacy: chỉ động vào phần được yêu cầu, **giữ nguyên** text / pattern cũ xung quanh. Có thể note: "File này còn 5 chỗ chưa tiếng Việt, nên fix riêng PR khác" — nhưng KHÔNG tự fix.
- ✅ Nếu user nói rõ "dịch luôn cả file" / "refactor cả page" → khi đó mới áp dụng toàn bộ.

**Tóm lại**: rule là cho code mới. Legacy giữ nguyên, đừng nhân tiện sửa. Hỏi user trước nếu không chắc.

---

## 0. HAI LUẬT TUYỆT ĐỐI (đọc trước, nhớ mãi)

### 🚫 KHÔNG UUID

**Tuyệt đối KHÔNG bao giờ hiển thị UUID / ID raw lên UI** — không trong table, không trong detail page, không trong toast, không trong breadcrumb, không trong URL hiển thị cho user.

```
❌ "Đã xóa thiết bị 3f7a2c1d-8e9b-4f5a-9c2d-1a2b3c4d5e6f"
❌ <Badge>3f7a2c1d-8e9b-...</Badge>
❌ Table column: "ID: a1b2c3d4..."
❌ "Mời chọn farmId"

✅ "Đã xóa thiết bị 'Cảm biến độ ẩm A1'"
✅ <Badge>{device.name}</Badge>
✅ Table column: "Tên thiết bị" / "Tên trang trại"
✅ "Mời chọn trang trại"
```

**Luôn dùng tên người dùng đọc được** (`name`, `deviceName`, `ownerName`, `farmName`, `zoneName`). Nếu BẮT BUỘC phải hiện ID (debug, support): short ID 6-8 ký tự đầu + tooltip có label rõ ràng — và phải có lý do chính đáng.

URL trong địa chỉ trình duyệt có UUID = OK (technical), nhưng KHÔNG copy UUID đó vào text hiển thị.

### 🚫 KHÔNG TIẾNG ANH

**Tuyệt đối KHÔNG có 1 chữ tiếng Anh nào trong UI** user nhìn thấy — kể cả từ "phổ thông" như `Submit`, `Cancel`, `OK`, `Save`, `Edit`, `Delete`, `Close`, `Loading`, `Error`, `Success`, `Active`, `Pending`, `Confirm`, `Yes`, `No`, `Add`, `New`, `Search`, `Filter`, `Sort`, `Status`, `Type`, `Name`, `Date`, `Action`, `View`, `Back`, `Next`.

```
❌ <Button>Submit</Button>
❌ <Button>Cancel</Button>
❌ placeholder="Search..."
❌ "Loading..."
❌ "No data"
❌ Toast: "Created successfully!"
❌ Status badge: "Active" / "Pending" / "In Progress"
❌ Empty state: "No results found"

✅ <Button>Lưu</Button> / <Button>Tạo thiết bị</Button>
✅ <Button>Hủy</Button> / <Button>Quay lại</Button>
✅ placeholder="Tìm thiết bị..."
✅ "Đang tải..."
✅ "Chưa có dữ liệu"
✅ Toast: "Đã tạo thiết bị"
✅ Status badge: "Đang hoạt động" / "Chờ xử lý" / "Đang xử lý"
✅ Empty state: "Không tìm thấy kết quả phù hợp"
```

**Áp dụng cho:** label, button, toast, alert, dialog, breadcrumb, page title, table header, column name, placeholder, helper text, tooltip, empty state, error message, loading text, menu item, tab name, badge, status.

**Ngoại lệ duy nhất** — danh từ riêng / thương hiệu / từ Việt hóa hoàn toàn:
- Tên app: `FarmOS`
- Email, SMS, OTP, PIN, Wifi, App, Web (đã Việt hóa trong từ điển)
- Đơn vị đo quốc tế: `kg`, `ha`, `m²`, `%`, `đ`
- Tên người, tên trang trại, tên thiết bị do user nhập

**KHÔNG ngoại lệ cho:** thuật ngữ tech (`token`, `session`, `cache`, `query`, `mutation`, `endpoint`, `validation`, `pagination`, `dropdown`, `modal`, `dialog`, `tab`, `sidebar`, `dashboard`) — phải dịch.

---

## 1. Luật cứng — không thương lượng

- ✅ **100% chữ hiển thị cho user PHẢI là tiếng Việt** — label, button, toast, error, empty state, tooltip, placeholder, breadcrumb, page title, dialog, menu, table header, helper text, ngày tháng định dạng VN.
- ❌ **TUYỆT ĐỐI KHÔNG** mix tiếng Anh trong UI — kể cả từ thông dụng (`Submit`, `Cancel`, `OK`, `Delete`, `Save`, `Edit`, `Close`, `Loading...`).
- ❌ **KHÔNG** giữ nguyên tiếng Anh kỹ thuật trong UI (`Validation failed`, `Internal Server Error`, `Not Found`, `Unauthorized`).
- ❌ **KHÔNG** dùng tên enum / kebab-case / snake_case raw làm label (`device_status`, `IN_PROGRESS`, `purchase` → phải dịch thành "Trạng thái thiết bị", "Đang xử lý", "Đã cho thuê").
- ✅ Code / comment / variable / type / log dev console **dùng tiếng Anh** như bình thường — không phải UI.

---

## 2. Ngôn từ thân thiện — viết cho nông dân, không viết cho developer

User của FarmOS đa phần không rành công nghệ. Câu chữ phải:

### 2.1. Dùng từ thuần Việt, tránh thuật ngữ tech

| ❌ Tech | ✅ Thuần Việt |
|---|---|
| "ID không hợp lệ" | "Không tìm thấy thông tin" |
| "Validation failed" | "Thông tin chưa đúng, mời kiểm tra lại" |
| "Submit thành công" | "Đã lưu" / "Gửi thành công" |
| "Token expired" | "Phiên đăng nhập đã hết, mời đăng nhập lại" |
| "Network error" | "Mất kết nối mạng, mời thử lại" |
| "Server error 500" | "Hệ thống đang lỗi, mời thử lại sau" |
| "Field required" | "Mời nhập [tên trường]" |
| "Invalid format" | "Sai định dạng" |
| "Active / Inactive" | "Đang hoạt động / Ngưng hoạt động" |
| "Pending" | "Chờ xử lý" |
| "Confirm" | "Xác nhận" / "Đồng ý" |

### 2.2. Câu ngắn — chủ ngữ rõ — không dịch máy

```
❌ "Một lỗi đã xảy ra trong quá trình xử lý yêu cầu của bạn"
✅ "Có lỗi xảy ra, mời thử lại"

❌ "Bạn có chắc chắn muốn tiến hành thực hiện hành động xóa này không?"
✅ "Xóa thiết bị này?"

❌ "Việc lưu thông tin của bạn đã được hoàn tất một cách thành công"
✅ "Đã lưu"
```

### 2.3. Xưng hô lịch sự, không trịch thượng

- ✅ Dùng **"bạn"** với user thường (owner, manager, doctor, farmer).
- ✅ Với admin / form quản trị nội bộ: bỏ xưng hô luôn (câu mệnh lệnh trung tính).
- ❌ Không dùng "bạn yêu", "quý khách", "ngài" — quá hình thức.
- ❌ Không dùng "user", "tôi" tự xưng từ hệ thống.

### 2.4. Tránh dấu chấm than thừa

```
❌ "Thêm thiết bị thành công!!!"  
❌ "Xóa thất bại!"
✅ "Đã thêm thiết bị"
✅ "Xóa thất bại, mời thử lại"
```

Toast success: kết thúc bằng dấu chấm hoặc không dấu. Một dấu chấm than `!` được — không bao giờ ba dấu.

---

## 3. Error message — nói được CÁCH SỬA

Error message không chỉ nói lỗi, phải gợi ý user làm gì tiếp theo.

```
❌ "Email không hợp lệ"
✅ "Email sai định dạng, ví dụ: ten@example.com"

❌ "Mật khẩu yếu"
✅ "Mật khẩu cần ít nhất 8 ký tự, có chữ và số"

❌ "Số tiền không hợp lệ"
✅ "Số tiền tối thiểu 10.000đ"

❌ "Không có quyền truy cập"
✅ "Bạn chưa có quyền vào trang này. Liên hệ chủ trang trại để được cấp quyền."
```

---

## 4. Empty state — hướng dẫn bước tiếp theo

Empty state KHÔNG được để chữ "Không có dữ liệu" trơ trọi. Phải:
1. Nói rõ chưa có **gì**.
2. Giải thích **tại sao** (nếu cần).
3. Gợi ý **làm gì** (CTA button).

```
❌ "Không có dữ liệu"
✅ "Chưa có thiết bị IoT nào"
   [Thêm thiết bị đầu tiên]

❌ "No results"
✅ "Không tìm thấy thiết bị phù hợp"
   [Xóa bộ lọc]

❌ "Empty"
✅ "Chưa có mùa vụ nào. Tạo mùa vụ đầu tiên để bắt đầu quản lý."
   [Tạo mùa vụ]
```

---

## 5. Confirm dialog — nói rõ hậu quả

```
❌ "Bạn có chắc không?"
✅ "Xóa thiết bị 'Cảm biến độ ẩm A1'? Hành động này không thể hoàn tác."

❌ "Confirm delete?"
✅ "Xóa zone 'Khu A'? 5 mùa vụ thuộc zone này cũng sẽ bị xóa."

❌ "Cancel order?"
✅ "Hủy đơn hàng này? Số tiền đã thanh toán sẽ được hoàn lại trong 3-5 ngày."
```

Button trong AlertDialog:
- Hành động chính: dùng động từ rõ ràng (`Xóa`, `Hủy đơn`, `Đăng xuất`) — KHÔNG `OK` / `Yes` / `Confirm`.
- Hủy bỏ: `Quay lại` hoặc `Hủy` — KHÔNG `No` / `Cancel`.

---

## 6. Button label — động từ + đối tượng

```
❌ "Submit" / "OK" / "Save"
✅ "Lưu thay đổi" / "Tạo thiết bị" / "Gửi yêu cầu"

❌ "Cancel"
✅ "Hủy" / "Quay lại"

❌ "Delete"
✅ "Xóa" / "Xóa thiết bị"

❌ "Add"
✅ "Thêm thiết bị" / "Thêm thành viên"
```

Button trong table header / page header: `Thêm <đối tượng>` cụ thể, không `+ New`.

---

## 7. Định dạng tiếng Việt chuẩn

### 7.1. Ngày tháng
- Hiển thị: `dd/MM/yyyy` (vd: `24/05/2026`).
- Có giờ: `HH:mm dd/MM/yyyy` (vd: `14:30 24/05/2026`).
- Relative time: `"2 phút trước"`, `"3 giờ trước"`, `"hôm qua"`, `"2 ngày trước"` — dùng `date-fns` với locale `vi`.

```tsx
import { format, formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";

format(date, "dd/MM/yyyy", { locale: vi });
formatDistanceToNow(date, { locale: vi, addSuffix: true });
```

### 7.2. Số tiền
- Format: `1.234.567đ` (chấm phân cách hàng nghìn, ký hiệu `đ` cuối, không space).
- Lớn: `1,2 triệu đ` / `1,5 tỷ đ` (dấu phẩy thập phân).
- KHÔNG dùng `$`, `VND` đứng riêng, `1,234,567`.

```tsx
new Intl.NumberFormat("vi-VN").format(amount) + "đ"
```

### 7.3. Số lượng
- Dấu phẩy thập phân: `1,5 ha` (không `1.5 ha`).
- Đơn vị tiếng Việt: `ha`, `m²`, `kg`, `tấn`, `con`, `cây`.

### 7.4. Phần trăm
- `85%` — không space giữa số và `%`.

---

## 8. Tone theo context

| Context | Tone | Ví dụ |
|---|---|---|
| Success toast | Vui, ngắn | "Đã thêm thiết bị" |
| Error toast | Bình tĩnh, gợi cách sửa | "Lưu thất bại, mời thử lại" |
| Confirm xóa | Nghiêm túc, rõ hậu quả | "Xóa zone này? 5 mùa vụ sẽ bị xóa theo" |
| Empty state | Thân thiện, hướng dẫn | "Chưa có thiết bị nào. Thêm thiết bị đầu tiên để bắt đầu." |
| Loading | Yên tâm | "Đang tải..." (không "Vui lòng đợi trong giây lát") |
| Onboarding | Khuyến khích | "Bắt đầu bằng cách tạo trang trại của bạn" |
| Permission denied | Lịch sự, hướng dẫn liên hệ | "Bạn chưa có quyền. Liên hệ chủ trang trại để được cấp quyền." |
| Network error | Trấn an, gợi retry | "Mất kết nối mạng, mời kiểm tra wifi và thử lại" |

---

## 9. Translate enum / status — bắt buộc có Record map

Mọi status / enum từ BE phải có map dịch sang tiếng Việt:

```ts
// constants/labels.ts
import type { DeviceStatus } from "@/types/device";

export const DEVICE_STATUS_LABEL: Record<DeviceStatus, string> = {
  available: "Có thể dùng",
  purchase: "Đã cho thuê",
  maintenance: "Bảo trì",
  error: "Lỗi",
};

// Trong component
<Badge>{DEVICE_STATUS_LABEL[device.status]}</Badge>
```

❌ Không render raw enum: `<Badge>{device.status}</Badge>` → user thấy "purchase" sẽ không hiểu.

---

## 10. Placeholder / Helper text

### Placeholder
- Mô tả ngắn, ví dụ cụ thể.
- KHÔNG dùng làm label thay thế.

```
❌ <Input placeholder="Email" />
✅ <Input placeholder="vd: ten@example.com" />

❌ <Input placeholder="Số tiền" />
✅ <Input placeholder="vd: 500.000" />
```

### Helper text (mô tả dưới input)
- Giải thích yêu cầu, không lặp label.

```
Label: Mật khẩu
Helper: "Ít nhất 8 ký tự, có chữ và số"
```

---

## 11. Số nhiều / số đếm

Tiếng Việt **không có dạng số nhiều** — KHÔNG dịch máy "1 device / 2 devices":

```
❌ "1 thiết bịs" / "2 thiết bịs"
❌ "1 device" / "2 devices"
✅ "1 thiết bị" / "2 thiết bị"
✅ "Có 5 thiết bị"
✅ "Đã chọn 3 mục"
```

---

## 12. Checklist tự verify trước khi báo done

- [ ] Mở từng page mới — toàn bộ text user thấy là **tiếng Việt 100%**?
- [ ] Không còn `Submit / Cancel / OK / Save / Delete / Loading / Error` raw?
- [ ] Toast message tiếng Việt, ngắn gọn, không 3 dấu chấm than?
- [ ] Error message gợi được cách sửa?
- [ ] Empty state có message rõ + CTA?
- [ ] Confirm dialog nói rõ hậu quả?
- [ ] Status / enum được dịch qua `Record<>` label map?
- [ ] Ngày tháng `dd/MM/yyyy`? Số tiền `1.234.567đ`?
- [ ] Button label có động từ rõ ràng?
- [ ] Placeholder có ví dụ cụ thể?
- [ ] Xưng hô "bạn" (user thường) hoặc trung tính (admin)?

---

## 13. Khi gặp text khó dịch

Nếu thuật ngữ tech không có từ tiếng Việt tự nhiên → ưu tiên theo thứ tự:
1. **Diễn giải nghĩa** thay vì dịch chữ. (vd: "Webhook" → "Tự động gửi thông báo khi có sự kiện")
2. **Dùng từ Việt hóa quen thuộc** nếu phổ biến. (vd: "Email", "Wifi", "App" — OK giữ nguyên)
3. **Giữ tiếng Anh + giải thích** chỉ khi bắt buộc (vd: thông số kỹ thuật IoT) — và có tooltip giải thích.

Không bao giờ:
- Dịch máy Google Translate raw.
- Giữ tiếng Anh chỉ vì "ngắn hơn".
- Dùng Hán-Việt khó hiểu khi có từ thuần Việt (vd: "Cập nhật" > "Tu sửa", "Xóa" > "Tiêu hủy").

---

## Rules tóm tắt

| Rule | |
|------|-|
| 100% tiếng Việt trong UI | Code/comment/log vẫn tiếng Anh |
| Không thuật ngữ tech raw | Diễn giải nghĩa |
| Câu ngắn, chủ ngữ rõ | Không dịch máy |
| Error gợi cách sửa | Không chỉ báo lỗi |
| Empty state có CTA | Không "Không có dữ liệu" trơ trọi |
| Confirm nói rõ hậu quả | Không "Bạn có chắc không?" |
| Button = động từ + đối tượng | Không "OK / Submit" |
| Enum / status có Label map | Không render raw |
| Ngày `dd/MM/yyyy`, tiền `1.234.567đ` | Format VN |
| Xưng hô "bạn" hoặc trung tính | Không "quý khách / ngài" |
