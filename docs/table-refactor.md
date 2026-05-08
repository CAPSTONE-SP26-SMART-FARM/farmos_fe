# Table Refactor — Phân tích & Kế hoạch

> Mục tiêu: gom tất cả các bảng đang dùng trong app về **một component chung** (`DataTable`), với cột thao tác chuẩn hóa thành **kebab menu (3 chấm dọc) → dropdown actions** và **skeleton động** theo số cột thực tế.

---

## 1. Hiện trạng

### 1.1. Common table component đang có

| File | Vai trò |
|---|---|
| [src/components/common/TableRequestShell/TableRequestShell.tsx](../src/components/common/TableRequestShell/TableRequestShell.tsx) | "Shell" wrap React Table + filter (title, status) + pagination (URL `?page=`). Hard-code cho doctor request: type `DoctorRequestResType`, query hook trả `ListDoctorRequestsResType`, navigate hard-code `/dashboard/doctor/my-request`. |
| [src/components/common/TableSkeleton.tsx](../src/components/common/TableSkeleton.tsx) | Skeleton **cứng 5×5**, không nhận props. |
| [src/components/common/FarmerTasksTable.tsx](../src/components/common/FarmerTasksTable.tsx) | Bảng dashboard riêng cho farmer (read-only, có skeleton inline 4 row). |
| [src/components/common/pro-pagination.tsx](../src/components/common/pro-pagination.tsx) | Pagination dùng chung — **tốt, giữ nguyên**. |

**Vấn đề chính của `TableRequestShell`:**
1. Generic type **bị khóa** vào `DoctorRequestResType` / `ListDoctorRequestsResType` → không tái sử dụng cho bảng khác.
2. Filter UI hard-code: 1 input `title` + 1 select `status`. Bảng khác có shape filter khác (search name+email, role, creditType, ...).
3. `useEffect` navigate hard-code path `/dashboard/doctor/my-request` (rất "rò rỉ" context).
4. `pageCount: 100` hard-code, không dùng `totalPages` từ API cho `useReactTable`.
5. Không có "action column" nào — mỗi page tự render button/icon riêng trong `columnDef.cell`.

### 1.2. UI primitives

[src/components/ui/table.tsx](../src/components/ui/table.tsx) — shadcn primitive (`Table`, `TableHeader`, `TableRow`, `TableCell`, …). **Giữ nguyên.**

### 1.3. Tất cả các bảng trong app

| # | File | Loại | Mục đích | Action hiện tại | Skeleton | Pagination | Filter |
|---|---|---|---|---|---|---|---|
| 1 | [pages/DoctorPage/ListRequest/RequestTable/RequestTable.tsx](../src/pages/DoctorPage/ListRequest/RequestTable/RequestTable.tsx) | TableRequestShell | Yêu cầu đăng ký bác sĩ (doctor view) | Info icon button | ✅ TableSkeleton | ✅ `?page=` | search + status |
| 2 | [pages/AdminPage/RequestDoctor/TableRequestDoctor.tsx](../src/pages/AdminPage/RequestDoctor/TableRequestDoctor.tsx) | TableRequestShell | Yêu cầu đăng ký bác sĩ (admin) | **Kebab menu** (MoreVertical) ✅ | ✅ | ✅ | search + status |
| 3 | [pages/AdminPage/Farms/FarmTable.tsx](../src/pages/AdminPage/Farms/FarmTable.tsx) | React Table + UI primitive | Quản lý nông trại | Info icon button | ✅ TableSkeleton | ✅ | search farmName |
| 4 | [pages/AdminPage/UserManagement/UserTable.tsx](../src/pages/AdminPage/UserManagement/UserTable.tsx) | React Table + UI primitive | Quản lý user | Info icon button | ✅ | ✅ | search + role + status |
| 5 | [pages/AdminPage/DoctorApplications/DoctorApplicationsTable.tsx](../src/pages/AdminPage/DoctorApplications/DoctorApplicationsTable.tsx) | React Table + UI primitive | Đơn đăng ký bác sĩ | Button "Xem & Duyệt" + row click | ✅ | ✅ | search + status + clear |
| 6 | [pages/AdminPage/AssignmentDoctor/TableAssignmentDoctor.tsx](../src/pages/AdminPage/AssignmentDoctor/TableAssignmentDoctor.tsx) | React Table + UI primitive | Phân công bác sĩ | Info icon + row selection | ✅ | ✅ | search + status |
| 7 | [pages/OwnerPage/MyDoctor/TableOwnerMyDoctors.tsx](../src/pages/OwnerPage/MyDoctor/TableOwnerMyDoctors.tsx) | React Table + UI primitive | Bác sĩ của chủ vườn | Info icon + row selection | ✅ | ✅ | search + status |
| 8 | [pages/DoctorPage/Assignment/TableDoctorAssignments.tsx](../src/pages/DoctorPage/Assignment/TableDoctorAssignments.tsx) | React Table + UI primitive | Phân công của bác sĩ | Info icon + row selection | ✅ | ✅ | search + status |
| 9 | [pages/AdminPage/TicketAnalytics/components/CriticalTicketsTable.tsx](../src/pages/AdminPage/TicketAnalytics/components/CriticalTicketsTable.tsx) | UI primitive (static) | Vé ưu tiên gần đây | Row click navigate | ❌ | ❌ | ❌ |
| 10 | [pages/AdminPage/TicketAnalytics/components/DoctorPerformanceTable.tsx](../src/pages/AdminPage/TicketAnalytics/components/DoctorPerformanceTable.tsx) | UI primitive (static) | Hiệu suất bác sĩ | — | ❌ | ❌ | ❌ |
| 11 | [pages/OwnerPage/Subscriptions/components/CreditLedgerTable.tsx](../src/pages/OwnerPage/Subscriptions/components/CreditLedgerTable.tsx) | UI primitive | Lịch sử biến động credit | — | ✅ | ✅ button-based | creditType |
| 12 | [pages/OwnerPage/CropSeasons/components/DiffTable.tsx](../src/pages/OwnerPage/CropSeasons/components/DiffTable.tsx) | UI primitive (accordion) | So sánh kế hoạch vs thực tế | History button modal | ❌ | ❌ | ❌ |
| 13 | [pages/OwnerPage/CropSeasons/components/UnplannedTable.tsx](../src/pages/OwnerPage/CropSeasons/components/UnplannedTable.tsx) | UI primitive (static) | Phát sinh ngoài kế hoạch | — | ❌ | ❌ | ❌ |
| 14 | [src/components/common/FarmerTasksTable.tsx](../src/components/common/FarmerTasksTable.tsx) | UI primitive | Task farmer dashboard | — | ✅ inline 4 row | ❌ | ❌ |

> Ghi chú: bảng #9, #10, #12, #13, #14 **KHÔNG** phải target refactor (đặc thù: read-only widget / accordion lồng ghép). Chỉ chuẩn hóa **#1–#8** và **#11**.

### 1.4. Phân loại action hiện tại

| Pattern | Số chỗ | Files |
|---|---|---|
| Kebab menu dropdown ✅ (target) | 1 | #2 |
| Info icon button đơn | 6 | #1, #3, #4, #6, #7, #8 |
| Button "Xem & Duyệt" + row click | 1 | #5 |
| Row click navigate (no button) | 1 | #9 |
| Read-only (no action) | 5 | #10, #11, #12, #13, #14 |

---

## 2. Vấn đề tổng kết

1. **Mỗi bảng tự setup React Table** → boilerplate ~80 dòng × 8 file = ~640 dòng lặp.
2. **Action column không nhất quán**: 5 kiểu khác nhau (info icon, button có chữ, row click, kebab menu, không có).
3. **Skeleton cứng 5×5** không khớp số cột → khi loading hiện sai layout, jitter khi render thật.
4. **Filter UI không chuẩn**: mỗi page tự code Input + Select rời rạc, không có abstraction.
5. **TableRequestShell bị khóa type** vào doctor request → 6/8 bảng dù shape giống hệt vẫn không dùng được.
6. **Pagination bị duplicate**: page nào cũng tự đọc `searchParam.get("page")` rồi tự build href cho `ProPagination`.

---

## 3. Đề xuất kiến trúc

### 3.1. Cấu trúc mới

```
src/components/common/DataTable/
├── DataTable.tsx              # Generic <DataTable<TData>/> — thay thế TableRequestShell
├── DataTableSkeleton.tsx      # Skeleton động (rows × columns)
├── DataTableActionsCell.tsx   # Cột actions = kebab menu + dropdown
├── DataTableToolbar.tsx       # Slot filter (search + select filters + clear)
├── useTableQueryParams.ts     # Hook đọc/ghi page, search, filter vào URL
└── types.ts                   # Action item, FilterConfig, DataTableProps
```

> `TableRequestShell` được **deprecate** sau khi migrate xong (giữ tạm để không vỡ #1, #2).

### 3.2. API đề xuất cho `DataTable`

```tsx
type DataTableAction<TData> = {
  key: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "destructive";
  hidden?: (row: TData) => boolean;
  disabled?: (row: TData) => boolean;
  onSelect: (row: TData) => void;
};

type FilterConfig =
  | { type: "search"; key: string; placeholder?: string; debounceMs?: number }
  | { type: "select"; key: string; placeholder?: string; options: { label: string; value: string }[] };

interface DataTableProps<TData, TQuery> {
  columns: ColumnDef<TData>[];
  query: UseQueryResult<ApiResponseType<{ data: TData[]; meta: { totalPages: number; totalItems: number } }>>;
  actions?: DataTableAction<TData>[];          // → kebab menu cuối mỗi row
  filters?: FilterConfig[];                     // → DataTableToolbar
  emptyText?: string;
  pageSize?: number;                            // default 10
  rowKey: (row: TData) => string;
  toolbarRight?: ReactNode;                     // chỗ đặt nút "Tạo mới"
  onRowClick?: (row: TData) => void;            // optional row navigate
}
```

**Hợp đồng:**
- Component **tự** quản lý URL state (`?page=`, `?q=`, `?<filterKey>=`) qua `useTableQueryParams`.
- Component **tự** truyền params cho query hook qua prop callback hoặc thẳng `query` (caller setup query với params đọc từ URL).
- Khi `actions.length > 0`, tự append cột `__actions__` (3-chấm-dọc kebab menu, sticky right) — caller **KHÔNG** tự thêm cột actions.
- Khi `query.isLoading`: render `<DataTableSkeleton rows={pageSize} columns={columns.length + (actions ? 1 : 0)} />`.

### 3.3. Action column = kebab menu

Component `DataTableActionsCell`:

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="ghost" size="icon" className="h-8 w-8">
      <MoreVertical className="h-4 w-4" />
      <span className="sr-only">Mở menu thao tác</span>
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    {actions
      .filter(a => !a.hidden?.(row))
      .map(a => (
        <DropdownMenuItem
          key={a.key}
          disabled={a.disabled?.(row)}
          onSelect={() => a.onSelect(row)}
          className={a.variant === "destructive" ? "text-destructive" : undefined}
        >
          {a.icon && <a.icon className="mr-2 h-4 w-4" />}
          {a.label}
        </DropdownMenuItem>
      ))}
  </DropdownMenuContent>
</DropdownMenu>
```

> Đã có sẵn `@/components/ui/dropdown-menu` (kiểm tra: pattern này đã dùng ở #2 `TableRequestDoctor.tsx`).

### 3.4. Skeleton động

`DataTableSkeleton.tsx`:

```tsx
type Props = { rows?: number; columns: number };
export function DataTableSkeleton({ rows = 8, columns }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {Array.from({ length: columns }).map((__, j) => (
            <TableCell key={j}>
              <Skeleton className="h-6 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}
```

Số cột = `columns.length + (actions ? 1 : 0)` được `DataTable` tự tính.

### 3.5. Toolbar filter

```tsx
<DataTableToolbar
  filters={[
    { type: "search", key: "search", placeholder: "Tìm theo tên..." },
    { type: "select", key: "status", placeholder: "Trạng thái",
      options: [{ label: "Tất cả", value: "all" }, ...] },
  ]}
  rightSlot={<Button onClick={onCreate}>Tạo mới</Button>}
/>
```

Toolbar tự debounce search 500ms (giữ pattern `useDebounce` hiện tại) và đẩy giá trị vào URL.

---

## 4. Kế hoạch migration (7 bước)

| # | Việc | File ảnh hưởng | Ghi chú |
|---|---|---|---|
| 1 | Tạo `DataTable/` skeleton API + `DataTableSkeleton` + `DataTableActionsCell` | `src/components/common/DataTable/*` (mới) | Không touch trang nào |
| 2 | Tạo `useTableQueryParams` hook | `src/hooks/useTableQueryParams.ts` | Reusable |
| 3 | Migrate **#2** `TableRequestDoctor` (đã có kebab) làm reference | #2 | Sanity check API |
| 4 | Migrate #1, #3, #4, #5 (admin/doctor list pages) | #1, #3, #4, #5 | Convert info-icon → kebab |
| 5 | Migrate #6, #7, #8 (selection + info icon) | #6, #7, #8 | Đặt actions trong kebab; row selection giữ qua prop riêng nếu cần |
| 6 | Migrate #11 `CreditLedgerTable` | #11 | Read-only, chỉ thay primitive → DataTable không actions |
| 7 | Xóa `TableRequestShell` + `TableSkeleton` cũ | `src/components/common/TableRequestShell/`, `src/components/common/TableSkeleton.tsx` | Sau khi #1, #2 đã migrate |

**Không migrate:** #9, #10, #12, #13, #14 (đặc thù, không thuộc scope CRUD list).

### 4.1. Bảng mapping action cụ thể từng trang

| Trang | Actions trong kebab |
|---|---|
| #1 RequestTable (doctor) | Xem chi tiết |
| #2 TableRequestDoctor (admin) | Xem chi tiết, Duyệt, Từ chối |
| #3 FarmTable | Xem chi tiết |
| #4 UserTable | Xem chi tiết, Khóa/Mở khóa, Đổi role |
| #5 DoctorApplicationsTable | Xem & Duyệt, Từ chối |
| #6 AssignmentDoctor | Xem chi tiết, Hủy phân công |
| #7 OwnerMyDoctors | Xem chi tiết, Hủy liên kết |
| #8 DoctorAssignments | Xem chi tiết, Đánh dấu hoàn thành |

> Mapping cuối cùng cần xác nhận theo permission/role thực tế ở backend.

---

## 5. Ràng buộc & rủi ro

1. **Generic type của React Table** với `ColumnDef<TData>` — phải test kỹ DX khi `TData` có discriminated union.
2. **Row selection** ở #6, #7, #8 đang dùng `rowSelection` state — `DataTable` cần expose prop `enableRowSelection` + callback nếu giữ.
3. **URL param naming** giữa các trang khác nhau (vd: `?page=`, `?status=`, `?role=`) — `useTableQueryParams` cần cho phép custom prefix tránh xung đột khi 2 bảng cùng route.
4. **Permission per action** — `hidden(row)` phải check role hiện tại; có thể inject `useCurrentUser` hook trong từng action handler.
5. **Sort** — hiện chưa có trang nào dùng sort; nếu sau này cần, đã có `getSortedRowModel` sẵn.

---

## 6. Tiêu chí "done"

- [ ] `DataTable` generic, không chứa text/route hard-code.
- [ ] Tất cả 8 trang (#1–#8) + #11 dùng `DataTable`.
- [ ] Action ở 8 trang đều là kebab menu 3-chấm-dọc → dropdown.
- [ ] Skeleton số cột khớp `columns.length + 1` (với action).
- [ ] Code line giảm ≥ 30% so với hiện tại ở các trang đã migrate (kỳ vọng ~600 → ~400 dòng).
- [ ] Xóa `TableRequestShell` + `TableSkeleton` cũ.
- [ ] `pnpm build` xanh.
