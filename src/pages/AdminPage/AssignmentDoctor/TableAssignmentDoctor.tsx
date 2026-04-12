import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import ProPagination from "@/components/common/pro-pagination";
import TableSkeleton from "@/components/common/TableSkeleton";
import { useAdminListDoctorAssignment } from "@/queries/useAdmin";
import type {
  AssignmentWithDoctorAndOwnerResType,
  ListAssignmentsQueryType,
} from "@/schemaValidatation/doctorAssignment";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import useDebounce from "@/hooks/useDebounce";
import { Info, X } from "lucide-react";
import DetailAssignmentDoctor from "./DetailAssignmentDoctor";

const STATUS_LABELS: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Không hoạt động",
};

const columns: ColumnDef<AssignmentWithDoctorAndOwnerResType>[] = [
  {
    id: "doctor",
    header: "Bác sĩ",
    accessorFn: (row) => row.doctor?.email ?? "",
    cell: ({ row }) => {
      const original = row.original;
      return (
        <div className="min-w-45">
          <div className="font-medium">{original.doctor?.fullName ?? "—"}</div>
          <div className="text-xs text-muted-foreground">
            {original.doctor?.email ?? "—"}
          </div>
        </div>
      );
    },
  },
  {
    id: "owner",
    header: "Chủ vườn",
    accessorFn: (row) => row.owner?.email ?? "",
    cell: ({ row }) => {
      const original = row.original;
      return (
        <div className="min-w-45">
          <div className="font-medium">{original.owner?.fullName ?? "—"}</div>
          <div className="text-xs text-muted-foreground">
            {original.owner?.email ?? "—"}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => (
      <div className="capitalize">
        {STATUS_LABELS[String(row.getValue("status") ?? "").toLowerCase()] ??
          String(row.getValue("status") ?? "—")}
      </div>
    ),
  },
  {
    accessorKey: "isPrimary",
    header: "Chính",
    cell: ({ row }) => (
      <div>{row.getValue("isPrimary") === true ? "Có" : "Không"}</div>
    ),
  },
  {
    accessorKey: "assignedAt",
    header: "Ngày phân công",
    cell: ({ row }) => {
      const value = row.getValue("assignedAt") as string | undefined;
      if (!value) return "—";
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
    },
  },
  {
    id: "action",
    header: "Thao tác",
    cell: ({ row }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => row.toggleSelected(true)}
          title="Xem chi tiết"
        >
          <Info />
        </Button>
      );
    },
  },
];

const TableAssignmentDoctor = () => {
  const navigate = useNavigate();
  const [searchParam] = useSearchParams();
  const page = searchParam.get("page") ? Number(searchParam.get("page")) : 1;
  const pageIndex = page - 1;

  const [detailId, setDetailId] = useState<string | undefined>(undefined);

  const [filters, setFilters] = useState<Partial<ListAssignmentsQueryType>>({
    search: "",
    status: undefined,
  });
  const debouncedSearch = useDebounce(filters.search || "", 500);

  const listResult = useAdminListDoctorAssignment({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    status: filters.status || undefined,
  });

  const data = useMemo(
    () => listResult.data?.data.data ?? [],
    [listResult.data?.data.data],
  );
  const totalPages = listResult.data?.data.meta.totalPages ?? 0;
  const totalRecords = listResult.data?.data.meta.totalItems ?? 0;

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex,
    pageSize: 10,
  });

  useEffect(() => {
    // open detail when a row becomes selected
    const selected = table.getSelectedRowModel().rows?.[0]?.original as
      | AssignmentWithDoctorAndOwnerResType
      | undefined;
    if (selected?.id) setDetailId(selected.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  useEffect(() => {
    table.setPagination({ pageIndex, pageSize: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageIndex]);

  useEffect(() => {
    // back to page 1 when filters change
    if (page > 1 && (filters.status || debouncedSearch)) {
      navigate("/dashboard/admin/doctor-assignment?page=1", { replace: true });
    }
  }, [page, filters.status, debouncedSearch, navigate]);

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    manualPagination: true,
    manualFiltering: true,
    autoResetPageIndex: false,
    pageCount: totalPages,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
  });

  const clearFilters = () => {
    setFilters({ search: "", status: undefined });
  };

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Tìm bác sĩ/chủ vườn..."
          value={filters.search ?? ""}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, search: e.target.value }))
          }
          className="max-w-sm"
        />

        <Select
          onValueChange={(value) =>
            setFilters((prev) => ({
              ...prev,
              status: value === "all" ? undefined : value,
            }))
          }
          defaultValue="all"
        >
          <SelectTrigger className="w-45 capitalize">
            <SelectValue
              placeholder="Lọc theo trạng thái"
              className="capitalize"
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              value="all"
              className="capitalize"
            >
              tất cả
            </SelectItem>
            <SelectItem
              value="active"
              className="capitalize"
            >
              hoạt động
            </SelectItem>
            <SelectItem
              value="inactive"
              className="capitalize"
            >
              không hoạt động
            </SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            disabled={!filters.search && !filters.status}
            className={`transition-all ${
              filters.search || filters.status
                ? "font-medium opacity-100"
                : "opacity-50"
            }`}
          >
            Xóa bộ lọc
            <X className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {listResult.isLoading && <TableSkeleton />}
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => {
                    row.toggleSelected(true);
                    setDetailId(row.original.id);
                  }}
                  className="cursor-pointer"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Không có kết quả.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-xs text-muted-foreground py-4 flex-1 ">
          Hiển thị <strong>{table.getPaginationRowModel().rows.length}</strong>{" "}
          trên <strong>{totalRecords}</strong> kết quả
        </div>
        <div>
          <ProPagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(page: number | null | undefined) => {
              const params = new URLSearchParams(searchParam);
              if (page) params.set("page", String(page));
              else params.delete("page");
              return { pathname: location.pathname, search: params.toString() };
            }}
          />
        </div>
      </div>

      <DetailAssignmentDoctor
        id={detailId}
        setId={setDetailId}
      />
    </div>
  );
};

export default TableAssignmentDoctor;
