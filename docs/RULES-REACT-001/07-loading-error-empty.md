# 08 - Loading / Error / Empty State Pattern

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Nguyên tắc bắt buộc

Mọi component fetch data **phải xử lý đủ 3 trạng thái**: Loading → Error → Empty → Data.  
Không được render trực tiếp data mà bỏ qua các trạng thái này.

```tsx
// ✅ Chuẩn
const { data, isLoading, isError } = useDeviceList();
const devices = useMemo(() => data?.data ?? [], [data]);

if (isLoading) return <TableSkeleton />;
if (isError) return <ErrorState />;
if (devices.length === 0) return <EmptyState message="Chưa có thiết bị nào" />;
return <DeviceTable devices={devices} />;

// ❌ Sai — bỏ qua loading và error
return <DeviceTable devices={data?.data ?? []} />;
```

---

## Loading State

### Khi nào dùng Skeleton vs Spinner

| Tình huống | Component | Lý do |
|------------|-----------|-------|
| Load danh sách (table) | `<TableSkeleton />` | Giữ layout ổn định, ít layout shift |
| Load card grid | `<LoadingCard />` | Placeholder đúng shape của card |
| Load toàn trang (navigate) | `<LoadingCard />` hoặc skeleton phù hợp | |
| Action mutation (submit, delete) | `disabled` button + text "Đang xử lý..." | Inline, không cần skeleton |
| Load dropdown/select options | `<Skeleton className="h-9 w-full" />` | Nhỏ gọn |

### Không dùng Spinner toàn trang

```tsx
// ❌ Sai — che toàn bộ content, layout shift nặng
if (isLoading) return <div className="flex justify-center"><Spinner /></div>;

// ✅ Đúng — giữ đúng shape của content sắp hiện
if (isLoading) return <TableSkeleton />;
```

### Inline loading trong button (mutation)

```tsx
<Button type="submit" disabled={isPending}>
  {isPending ? "Đang lưu..." : "Lưu"}
</Button>

// Hoặc với icon
<Button onClick={handleDelete} disabled={isPending}>
  {isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
  Xóa
</Button>
```

---

## Error State

### Phân loại error

| Loại | Xử lý |
|------|-------|
| Network / 5xx | `<ErrorState />` full — có Retry button |
| 404 Not Found | `<ErrorState message="Không tìm thấy dữ liệu" />` — không cần Retry |
| 403 Forbidden | Redirect hoặc ẩn section, không hiện error |
| 401 Unauthorized | Axios interceptor xử lý tự động (refresh token → logout) |
| 422 Validation | Hiển thị lỗi trong form field qua `form.setError` |

### ErrorState component

```tsx
// ✅ Dùng component có sẵn
import { ErrorState } from "@/components/common/ErrorState";

if (isError) return <ErrorState />;

// Với custom message
if (isError) return <ErrorState message="Không thể tải danh sách thiết bị" />;
```

### Retry pattern

```tsx
const { data, isError, refetch } = useDeviceList();

if (isError) return (
  <ErrorState
    message="Tải dữ liệu thất bại"
    action={
      <Button variant="outline" onClick={() => refetch()}>
        <RefreshCw /> Thử lại
      </Button>
    }
  />
);
```

---

## Empty State

### Luôn có Empty State — không để trang trắng

```tsx
// ✅ Chuẩn — có message + CTA khi phù hợp
if (devices.length === 0) return (
  <EmptyState
    message="Chưa có thiết bị IoT nào"
    action={
      <Button onClick={() => setOpenCreate(true)}>
        <Plus /> Thêm thiết bị đầu tiên
      </Button>
    }
  />
);
```

### Phân biệt Empty vs No-result

| Tình huống | Message | CTA |
|------------|---------|-----|
| Chưa có data nào hết | "Chưa có [entity] nào" | Button tạo mới |
| Search/filter không có kết quả | "Không tìm thấy kết quả phù hợp" | Button "Xóa bộ lọc" |

```tsx
const hasFilter = search !== "" || status !== "";
const isEmpty = devices.length === 0;

if (isEmpty) {
  return hasFilter ? (
    <EmptyState
      message="Không tìm thấy thiết bị phù hợp"
      action={<Button variant="ghost" onClick={clearFilters}>Xóa bộ lọc</Button>}
    />
  ) : (
    <EmptyState
      message="Chưa có thiết bị IoT nào"
      action={<Button onClick={() => setOpenCreate(true)}>Thêm thiết bị</Button>}
    />
  );
}
```

---

## Empty State trong Table

Khi dùng TanStack Table, xử lý empty bên trong table body:

```tsx
<TableBody>
  {table.getRowModel().rows.length === 0 ? (
    <TableRow>
      <TableCell colSpan={columns.length} className="py-16 text-center">
        <EmptyState message="Không có dữ liệu" />
      </TableCell>
    </TableRow>
  ) : (
    table.getRowModel().rows.map((row) => (
      <TableRow key={row.id}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ))
  )}
</TableBody>
```

---

## Thứ tự kiểm tra trong component

```tsx
// Luôn theo thứ tự này — không đảo lộn
if (isLoading) return <TableSkeleton />;           // 1. Loading trước
if (isError) return <ErrorState />;                // 2. Error sau
if (items.length === 0) return <EmptyState />;     // 3. Empty sau cùng
return <ActualContent items={items} />;            // 4. Mới render data
```

---

## Loading state cho Partial Section (không phải full page)

Khi chỉ 1 section trong trang đang load (lazy data, dropdown):

```tsx
// Section loading — không làm spinner toàn trang
<div className="relative min-h-[200px]">
  {isSectionLoading ? (
    <div className="space-y-2">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-3/4" />
    </div>
  ) : (
    <SectionContent />
  )}
</div>
```
