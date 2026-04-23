import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { Eye, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import ProPagination from "@/components/common/pro-pagination";
import TableSkeleton from "@/components/common/TableSkeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
import {
  RegistrationStatusName,
  type RegistrationStatusNameType,
} from "@/constants/profile";
import useDebounce from "@/hooks/useDebounce";
import { useAdminListDoctorRequest } from "@/queries/useAdmin";
import type { ListDoctorRequestsQueryType } from "@/schemaValidatation/doctorProfile";
import type { UserResType } from "@/types/user";
import { REGISTRATION_STATUS_META } from "./statusMeta";

type Row = {
  id: string;
  userId: string;
  doctorProfileId: string;
  title: string;
  description: string;
  registrationStatus: RegistrationStatusNameType;
  selfRegistered: boolean;
  repliedBy: string | null;
  repliedAt: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  user: UserResType;
};

interface Props {
  onViewDetail: (id: string) => void;
}

const STATUS_OPTIONS: Array<{
  value: RegistrationStatusNameType | "all";
  label: string;
}> = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: RegistrationStatusName.Pending, label: "Chờ duyệt" },
  { value: RegistrationStatusName.Approved, label: "Đã duyệt" },
  { value: RegistrationStatusName.Rejected, label: "Đã từ chối" },
  { value: RegistrationStatusName.Suspended, label: "Tạm ngưng" },
];

const initialsOf = (name?: string | null, email?: string) => {
  const source = (name && name.trim()) || email || "?";
  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const DoctorApplicationsTable = ({ onViewDetail }: Props) => {
  const [searchParam, setSearchParam] = useSearchParams();
  const page = searchParam.get("page") ? Number(searchParam.get("page")) : 1;
  const pageIndex = page - 1;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<
    RegistrationStatusNameType | "all"
  >("all");

  const query: ListDoctorRequestsQueryType = {
    page,
    limit: 10,
    search: debouncedSearch?.trim() || undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  };

  const listResult = useAdminListDoctorRequest(query);

  const data = (listResult.data?.data.data ?? []) as Row[];
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

  const columns = useMemo<ColumnDef<Row>[]>(
    () => [
      {
        accessorKey: "user",
        header: "Người gửi",
        cell: ({ row }) => {
          const u = row.original.user;
          return (
            <div className="flex items-center gap-3 min-w-[220px]">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="text-xs">
                  {initialsOf(u.fullName, u.email)}
                </AvatarFallback>
              </Avatar>
              <div className="leading-tight">
                <div className="font-medium">{u.fullName ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{u.email}</div>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "title",
        header: "Tiêu đề đơn",
        cell: ({ row }) => (
          <div className="max-w-[280px]">
            <div className="font-medium line-clamp-1">{row.original.title}</div>
            <div className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </div>
          </div>
        ),
      },
      {
        id: "selfRegistered",
        header: "Loại đơn",
        cell: ({ row }) =>
          row.original.selfRegistered ? (
            <Badge variant="outline">Tự đăng ký</Badge>
          ) : (
            <Badge variant="secondary">Quản trị tạo</Badge>
          ),
      },
      {
        accessorKey: "registrationStatus",
        header: "Trạng thái",
        cell: ({ row }) => {
          const meta = REGISTRATION_STATUS_META[row.original.registrationStatus];
          const Icon = meta.icon;
          return (
            <Badge
              variant={meta.variant}
              className={meta.className}
            >
              <Icon className="h-3.5 w-3.5" />
              {meta.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createdAt",
        header: "Ngày gửi",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {formatDate(row.original.createdAt)}
          </div>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Thao tác</div>,
        cell: ({ row }) => (
          <div className="text-right">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetail(row.original.id)}
            >
              <Eye className="mr-2 h-4 w-4" />
              Xem & Duyệt
            </Button>
          </div>
        ),
      },
    ],
    [onViewDetail],
  );

  const [pagination, setPagination] = useState({ pageIndex, pageSize: 10 });
  useEffect(() => {
    setPagination({ pageIndex, pageSize: 10 });
  }, [pageIndex]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    manualPagination: true,
    autoResetPageIndex: false,
    pageCount: totalPages,
    state: { pagination },
  });

  const hasActiveFilter = !!debouncedSearch || statusFilter !== "all";

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3 py-4 md:flex-row md:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề, mô tả, người gửi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select
          value={statusFilter}
          onValueChange={(v) =>
            setStatusFilter(v as RegistrationStatusNameType | "all")
          }
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem
                key={opt.value}
                value={opt.value}
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="md:ml-auto"
          >
            <X className="mr-1.5 h-4 w-4" />
            Xóa lọc
          </Button>
        )}
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
            {!listResult.isLoading && table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() => onViewDetail(row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={
                        cell.column.id === "actions"
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : !listResult.isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  Không tìm thấy đơn nào phù hợp.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-2 py-4 md:flex-row md:items-center md:justify-between">
        <div className="text-xs text-muted-foreground">
          Hiển thị <strong>{table.getRowModel().rows.length}</strong> trên{" "}
          <strong>{totalRecords}</strong> đơn
        </div>
        {totalPages > 1 && (
          <ProPagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={(p) => {
              const params = new URLSearchParams(searchParam);
              if (p) params.set("page", String(p));
              else params.delete("page");
              return { pathname: location.pathname, search: params.toString() };
            }}
          />
        )}
      </div>
    </div>
  );
};

export default DoctorApplicationsTable;
