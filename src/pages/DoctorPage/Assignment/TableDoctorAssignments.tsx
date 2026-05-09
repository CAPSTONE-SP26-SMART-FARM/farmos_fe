import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import { DataTablePagination } from "@/components/common/DataTable/DataTablePagination";
import type { DataTableAction } from "@/components/common/DataTable/types";
import { useDoctorListAssignment } from "@/queries/useDoctor";
import type {
  AssignmentWithOwnerResType,
  ListAssignmentsQueryType,
} from "@/schemaValidatation/doctorAssignment";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import useDebounce from "@/hooks/useDebounce";
import usePageParam from "@/hooks/usePageParam";
import { Info, X } from "lucide-react";
import DoctorAssignmentDetailDialog from "./DoctorAssignmentDetailDialog";

const STATUS_LABELS: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
};

const columns: ColumnDef<AssignmentWithOwnerResType>[] = [
  {
    id: "owner",
    header: "Chủ trang trại",
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
];

const TableDoctorAssignments = () => {
  const { page } = usePageParam();
  const [searchParam, setSearchParam] = useSearchParams();

  const [detailId, setDetailId] = useState<string | undefined>(undefined);

  const [filters, setFilters] = useState<Partial<ListAssignmentsQueryType>>({
    search: "",
    status: undefined,
  });
  const debouncedSearch = useDebounce(filters.search || "", 500);

  const listResult = useDoctorListAssignment({
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

  useEffect(() => {
    if (page > 1 && (filters.status || debouncedSearch)) {
      const params = new URLSearchParams(searchParam);
      params.set("page", "1");
      setSearchParam(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, debouncedSearch]);

  const clearFilters = () => setFilters({ search: "", status: undefined });

  const actions: DataTableAction<AssignmentWithOwnerResType>[] = useMemo(
    () => [
      {
        key: "view",
        label: "Xem chi tiết",
        icon: Info,
        onSelect: (row) => setDetailId(row.id),
      },
    ],
    [],
  );

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Tìm chủ trang trại..."
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
              Tất cả
            </SelectItem>
            <SelectItem
              value="active"
              className="capitalize"
            >
              Hoạt động
            </SelectItem>
            <SelectItem
              value="inactive"
              className="capitalize"
            >
              Ngưng hoạt động
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

      <DataTable
        columns={columns}
        data={data}
        isLoading={listResult.isLoading}
        actions={actions}
        onRowClick={(row) => setDetailId(row.id)}
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalRecords}
        rowCount={data.length}
      />

      <DoctorAssignmentDetailDialog
        id={detailId}
        setId={setDetailId}
      />
    </div>
  );
};

export default TableDoctorAssignments;
