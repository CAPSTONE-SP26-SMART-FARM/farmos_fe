import type { ColumnDef } from "@tanstack/react-table";
import type { FarmWithOwnerResType } from "@/schemaValidatation/farmManagement";
import { Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { DataTable } from "@/components/common/DataTable";
import { DataTablePagination } from "@/components/common/DataTable/DataTablePagination";
import type { DataTableAction } from "@/components/common/DataTable/types";
import useDebounce from "@/hooks/useDebounce";
import usePageParam from "@/hooks/usePageParam";
import { useAdminListFarms } from "@/queries/useAdmin";

interface FarmTableProps {
  onViewDetail: (id: string) => void;
}

const columns: ColumnDef<FarmWithOwnerResType>[] = [
  {
    accessorKey: "code",
    header: "Mã",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("code")}</div>
    ),
  },
  {
    accessorKey: "name",
    header: "Tên",
    cell: ({ row }) => <div>{row.getValue("name")}</div>,
  },
  {
    accessorKey: "farmType",
    header: "Loại",
    cell: ({ row }) => (
      <div className="capitalize">{row.getValue("farmType")}</div>
    ),
  },
  {
    accessorKey: "address",
    header: "Địa chỉ",
    cell: ({ row }) => <div>{row.getValue("address") ?? "—"}</div>,
  },
  {
    accessorKey: "areaSqm",
    header: "Diện tích (m²)",
    cell: ({ row }) => <div>{row.getValue("areaSqm") ?? "—"}</div>,
  },
  {
    accessorKey: "owner",
    header: "Chủ trang trại",
    cell: ({ row }) => (
      <div>{row.original.owner.fullName ?? row.original.owner.email}</div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => (
      <div>
        {new Date(row.getValue("createdAt") as string).toLocaleDateString()}
      </div>
    ),
  },
];

const FarmTable = ({ onViewDetail }: FarmTableProps) => {
  const { page } = usePageParam();
  const [searchParam, setSearchParam] = useSearchParams();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const listResult = useAdminListFarms({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
  });

  const data: FarmWithOwnerResType[] = listResult.data?.data.data ?? [];
  const totalPages = listResult.data?.data.meta.totalPages ?? 0;
  const totalRecords = listResult.data?.data.meta.totalItems ?? 0;

  useEffect(() => {
    if (page > 1 && debouncedSearch) {
      const params = new URLSearchParams(searchParam);
      params.set("page", "1");
      setSearchParam(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const actions: DataTableAction<FarmWithOwnerResType>[] = useMemo(
    () => [
      {
        key: "view",
        label: "Xem chi tiết",
        icon: Info,
        onSelect: (row) => onViewDetail(row.id),
      },
    ],
    [onViewDetail],
  );

  return (
    <div className="w-full">
      <div className="flex items-center py-4 gap-2">
        <Input
          placeholder="Tìm kiếm nông trại..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <DataTable
        columns={columns}
        data={data}
        isLoading={listResult.isLoading}
        actions={actions}
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalRecords}
        rowCount={data.length}
      />
    </div>
  );
};

export default FarmTable;
