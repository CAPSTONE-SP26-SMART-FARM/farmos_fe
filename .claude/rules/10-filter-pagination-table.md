# 05 - Filter, Pagination & Table Pattern

Bạn là senior React developer với 10 năm kinh nghiệm, đang làm việc trong dự án **FarmOS**.

---

## Quy tắc Filter

### Bắt buộc có "Clear filter"

Mọi filter UI **phải có nút xóa filter** — user không được bị kẹt trong trạng thái filter không thoát được.

```tsx
const hasActiveFilter = search !== "" || status !== "" || zoneId !== "";

{hasActiveFilter && (
  <Button variant="ghost" size="sm" onClick={handleClearFilters}>
    <X /> Xóa bộ lọc
  </Button>
)}

const handleClearFilters = () => {
  form.reset(defaultValues);
  navigate({ search: "" });
};
```

### Default value cho filter status

- Select status mặc định: **"Tất cả"** — value là `""` (empty string)
- Không dùng `undefined` hay `null` làm default cho select
- queryString.stringify với `skipEmptyString: true` tự bỏ qua field `""` khi gửi API

```tsx
<Select value={status} onValueChange={setStatus}>
  <SelectItem value="">Tất cả</SelectItem>
  <SelectItem value="active">Đang hoạt động</SelectItem>
  <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
</Select>

// defaultValues
{ status: "" }  // "" = "Tất cả"
```

---

## Quy tắc Date Range Input

### Default value

- Cả 2 ô `from` và `to` mặc định là **ngày hôm nay** nếu không có giá trị từ URL/props
- Dùng `startOfDay` từ `date-fns` — không dùng `new Date()` trực tiếp trong JSX
- Khi user truyền mốc qua URL params → lấy đúng theo mốc đó

```tsx
import { startOfDay } from "date-fns";

const today = startOfDay(new Date());

const defaultValues = {
  fromDate: searchParams.get("fromDate")
    ? new Date(searchParams.get("fromDate")!)
    : today,
  toDate: searchParams.get("toDate")
    ? new Date(searchParams.get("toDate")!)
    : today,
};
```

### Auto-correct khi fromDate > toDate

```tsx
<DatePicker
  value={fromDate}
  onChange={(date) => {
    form.setValue("fromDate", date);
    if (date > toDate) form.setValue("toDate", date);  // Auto-correct
  }}
/>
```

### Validate + gửi API

```tsx
// Zod schema
const dateRangeSchema = z.object({
  fromDate: z.date(),
  toDate: z.date(),
}).refine((d) => d.toDate >= d.fromDate, {
  message: "Ngày kết thúc phải sau ngày bắt đầu",
  path: ["toDate"],
});

// Transform ở service layer — không ở component
create: (body) => api.post(ENDPOINT, {
  ...body,
  fromDate: format(body.fromDate, "yyyy-MM-dd"),
  toDate: format(body.toDate, "yyyy-MM-dd"),
}),
```

---

## Quy tắc Pagination — Luôn dùng ProPagination

Import từ `@/components/common/pro-pagination` — không tự implement pagination.

### Trường hợp 1: Đơn giản (≤ 2 filter, params cùng 1 component)

```tsx
import { useSearchParams } from "react-router-dom";
import ProPagination from "@/components/common/pro-pagination";

function DeviceListPage() {
  const [searchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? 1);

  const buildHref = (p: number | null | undefined) => ({
    search: `?page=${p ?? 1}&status=${searchParams.get("status") ?? ""}`,
  });

  return (
    <>
      <DeviceTable />
      <ProPagination
        currentPage={page}
        totalPages={data?.totalPages ?? 0}
        buildHref={buildHref}
      />
    </>
  );
}
```

### Trường hợp 2: Phức tạp (≥ 3 filter, params rải ở nhiều component)

Dùng **React Hook Form** làm single source of truth, `FormProvider` chia sẻ qua context:

```tsx
import { useForm, useWatch, FormProvider, useFormContext } from "react-hook-form";

interface DeviceQuery {
  page: number;
  search: string;
  zoneId: string;
  status: string;
  fromDate: Date;
  toDate: Date;
}

function DeviceListPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const today = startOfDay(new Date());

  const form = useForm<DeviceQuery>({
    defaultValues: {
      page: Number(searchParams.get("page") ?? 1),
      search: searchParams.get("search") ?? "",
      zoneId: searchParams.get("zoneId") ?? "",
      status: searchParams.get("status") ?? "",
      fromDate: searchParams.get("fromDate") ? new Date(searchParams.get("fromDate")!) : today,
      toDate: searchParams.get("toDate") ? new Date(searchParams.get("toDate")!) : today,
    },
  });

  const query = useWatch({ control: form.control });

  const applyFilters = (values: DeviceQuery) => {
    const params = new URLSearchParams();
    Object.entries(values).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) {
        params.set(k, v instanceof Date ? format(v, "yyyy-MM-dd") : String(v));
      }
    });
    params.set("page", "1");  // Reset về trang 1 khi filter thay đổi
    navigate({ search: params.toString() });
  };

  const buildHref = (p: number | null | undefined) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p ?? 1));
    return { search: params.toString() };
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(applyFilters)}>
        <DeviceFilterBar />       {/* Dùng useFormContext bên trong */}
        <DeviceDateRange />       {/* Dùng useFormContext bên trong */}
        <DeviceSearchInput />     {/* Dùng useFormContext bên trong */}
      </form>

      <DeviceTable query={query} />

      <ProPagination
        currentPage={query.page}
        totalPages={data?.totalPages ?? 0}
        buildHref={buildHref}
      />
    </FormProvider>
  );
}

// Sub-component lấy form context — không nhận props riêng
function DeviceSearchInput() {
  const { register } = useFormContext<DeviceQuery>();
  return <Input {...register("search")} placeholder="Tìm thiết bị..." />;
}
```

**Khi nào dùng pattern phức tạp:**
- ≥ 3 filter params
- Filter UI nằm ở 2+ sub-component khác nhau
- Cần "Apply" button (không realtime)

**Khi nào dùng buildHref đơn giản:**
- ≤ 2 filter params, cùng 1 component
- Realtime filter (đổi ngay khi chọn)

---

## Quy tắc Table — Scan codebase trước

**Bắt buộc scan toàn bộ src trước khi tạo Table mới.**

```bash
grep -r "useReactTable\|@tanstack/react-table\|ColumnDef" src/
```

- **Không có table nào** → Implement mới theo cấu hình chuẩn dưới đây
- **Đã có table** → Đọc pattern đang dùng → **Refactor cả cũ lẫn mới** dùng chung pattern

### Cấu hình Table chuẩn

```tsx
// _components/DataTable.tsx — generic, dùng lại được
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from "@tanstack/react-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  isLoading?: boolean;
}

function DataTable<T>({ data, columns, isLoading }: DataTableProps<T>) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });

  if (isLoading) return <TableSkeleton />;

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((hg) => (
            <TableRow key={hg.id}>
              {hg.headers.map((h) => (
                <TableHead key={h.id}>
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="py-16 text-center">
                <EmptyState />
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
      </Table>
    </div>
  );
}
```

```tsx
// _components/device-columns.tsx — column definitions tách riêng
export const deviceColumns: ColumnDef<Device>[] = [
  { accessorKey: "name", header: "Tên thiết bị" },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => <DeviceStatusBadge status={row.original.status} />,
  },
  {
    id: "actions",
    cell: ({ row }) => <DeviceRowActions device={row.original} />,
  },
];
```

### Card vs Table decision

| Dùng Table | Dùng Card |
|-----------|-----------|
| ≥ 4 cột cần hiển thị cùng lúc | ≤ 4 thuộc tính, visual identity rõ |
| Cần sort/filter nhiều cột | Grid layout, overview nhanh |
| User cần so sánh row | Ảnh/status color nổi bật |
| Transactions, logs, user list | Device card, farm overview, plan selection |

**Pattern kết hợp phổ biến:**
```tsx
// KPI cards trên + Table danh sách dưới
<div className="grid grid-cols-4 gap-4 mb-6">
  <KpiCard title="Tổng" value={total} />
  <KpiCard title="Hoạt động" value={active} />
</div>
<DataTable data={devices} columns={deviceColumns} />
```
