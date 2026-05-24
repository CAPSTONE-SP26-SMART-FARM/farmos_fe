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

---

## Chuyển Tab / View — chống giật UI

Bất cứ khi nào user click chuyển **Tab**, đổi **filter làm refetch**, hoặc switch **view variant** (list ↔ grid, segment control) trong cùng 1 page → **bắt buộc** xử lý 1 trong 2 cách để không giật mắt:

### Cách 1 — Giữ data cũ trong lúc refetch (ưu tiên)

Dùng `placeholderData: keepPreviousData` của React Query v5. Data cũ vẫn hiển thị, table không sập rỗng, chỉ có indicator nhỏ báo đang refetch:

```tsx
import { keepPreviousData } from "@tanstack/react-query";

const queueQuery = useQuery({
  queryKey: ["attention-queue", apiQuery],
  queryFn: () => service.getAttentionQueue(apiQuery),
  placeholderData: keepPreviousData,   // ← giữ data cũ khi đổi tab/filter
});

// Indicator nhỏ — không full-page skeleton khi đang có data cũ
<Button disabled={queueQuery.isFetching} aria-label="Làm mới">
  <RefreshCw className={queueQuery.isFetching ? "animate-spin" : ""} />
</Button>
```

**Áp dụng cho:** Tab có cùng shape data (cùng table, đổi filter `kind` / `status` / `farmId`), pagination, search.

### Cách 2 — Skeleton overlay (khi shape data khác hẳn)

Khi 2 tab render layout khác hẳn (vd: tab "Bảng" ↔ tab "Biểu đồ") thì `keepPreviousData` không cứu được — dùng skeleton chiếm đúng shape của tab mới:

```tsx
{activeTab === "table" ? (
  isLoading ? <TableSkeleton rows={5} /> : <DataTable ... />
) : (
  isLoading ? <ChartSkeleton /> : <DqsChart ... />
)}
```

**KHÔNG** dùng spinner toàn trang khi chuyển tab — gây flash trắng, mất ngữ cảnh.

### Cách 3 — Animation mềm chuyển content (tăng cảm giác mượt)

Khi shape giống nhau nhưng vẫn muốn smooth giữa 2 trạng thái → wrap bằng `AnimatePresence` của Framer Motion, fade trong 0.15-0.2s. Xem chi tiết ở [13-animation-pattern.md](./13-animation-pattern.md).

```tsx
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence mode="wait">
  <motion.div
    key={activeTab}
    initial={{ opacity: 0, y: 4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -4 }}
    transition={{ duration: 0.15 }}
  >
    {content}
  </motion.div>
</AnimatePresence>
```

**Lưu ý:** Animation chỉ là cherry on top — bắt buộc phải có cách 1 hoặc cách 2 trước, animation tự thân **không** thay được skeleton.

### Anti-pattern

```tsx
// ❌ Sai — đổi tab → component unmount → loading full-page → giật mạnh
{activeTab === "error" ? <ErrorTable /> : <SwapTable />}
// Mỗi tab tự fetch riêng, không keepPreviousData → table sập rỗng mỗi lần switch

// ❌ Sai — spinner toàn page khi đổi filter
if (isFetching) return <Spinner />;  // page trắng hoàn toàn → mất ngữ cảnh

// ✅ Đúng — table giữ data cũ, có overlay mờ trong khi fetch
<div className={cn(isFetching && "opacity-60 transition-opacity")}>
  <DataTable ... />
</div>
```

### Checklist nhanh trước khi merge feature có Tab

- [ ] Query có `placeholderData: keepPreviousData` chưa? (cho tab cùng shape)
- [ ] Khi `isFetching=true`, data cũ có vẫn hiện không? (không sập rỗng)
- [ ] Có indicator nhẹ báo đang load (spin icon, opacity dim) không?
- [ ] Skeleton dùng đúng shape của content sắp hiện không? (table → TableSkeleton, không Spinner)
- [ ] Tab có layout khác hẳn → có skeleton riêng cho từng tab không?
