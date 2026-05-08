import { Info, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/components/common/DataTable";
import { DataTablePagination } from "@/components/common/DataTable/DataTablePagination";
import type { DataTableAction } from "@/components/common/DataTable/types";
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
  RegistrationStatusName,
  type RegistrationStatusNameType,
} from "@/constants/profile";
import { statusIcon } from "@/constants/registrationStatusIcon";
import useDebounce from "@/hooks/useDebounce";
import usePageParam from "@/hooks/usePageParam";
import { useAdminListDoctorRequest } from "@/queries/useAdmin";
import type { DoctorRequestResType } from "@/schemaValidatation/doctorProfile";
import UpdateRequest from "./UpdateRequest";

const columns: ColumnDef<DoctorRequestResType>[] = [
  {
    accessorKey: "id",
    header: "Mã",
    cell: ({ row }) => <div>{row.getValue("id")}</div>,
  },
  {
    accessorKey: "title",
    header: "Tiêu đề",
    cell: ({ row }) => <div>{row.getValue("title")}</div>,
  },
  {
    accessorKey: "reason",
    header: "Lý do",
    cell: ({ row }) => <div>{row.getValue("reason")}</div>,
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const Icon = statusIcon[row.original.registrationStatus];
      return <Icon />;
    },
  },
];

const TableRequestDoctor = () => {
  const { page } = usePageParam();
  const [searchParam, setSearchParam] = useSearchParams();
  const [requestIdDetail, setRequestIdDetail] = useState<string | undefined>(
    undefined,
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    RegistrationStatusNameType | "all"
  >("all");
  const debouncedSearch = useDebounce(search, 500);

  const listResult = useAdminListDoctorRequest({
    page,
    limit: 10,
    search: debouncedSearch || "",
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const data = listResult.data?.data.data ?? [];
  const totalPages = listResult.data?.data.meta.totalPages ?? 0;
  const totalRecords = listResult.data?.data.meta.totalItems ?? 0;

  useEffect(() => {
    if (page > 1 && (debouncedSearch || statusFilter !== "all")) {
      const params = new URLSearchParams(searchParam);
      params.set("page", "1");
      setSearchParam(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const actions: DataTableAction<DoctorRequestResType>[] = useMemo(
    () => [
      {
        key: "view",
        label: "Xem chi tiết",
        icon: Info,
        onSelect: (row) => setRequestIdDetail(row.id),
      },
    ],
    [],
  );

  const hasActiveFilter = !!debouncedSearch || statusFilter !== "all";

  return (
    <>
      <div className="w-full">
        <div className="flex items-center py-4 gap-2">
          <Input
            placeholder="Lọc theo tiêu đề..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as RegistrationStatusNameType | "all")
            }
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
              {Object.values(RegistrationStatusName).map((r) => (
                <SelectItem
                  value={r}
                  key={r}
                  className="capitalize"
                >
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              disabled={!hasActiveFilter}
              className={`transition-all ${
                hasActiveFilter
                  ? "font-medium opacity-100"
                  : "opacity-50 font-normal"
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
        />

        <DataTablePagination
          currentPage={page}
          totalPages={totalPages}
          totalItems={totalRecords}
          rowCount={data.length}
        />
      </div>
      <UpdateRequest
        id={requestIdDetail}
        setId={setRequestIdDetail}
      />
    </>
  );
};

export default TableRequestDoctor;
