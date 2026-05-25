import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Scale, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { DataTable, type DataTableAction } from "@/components/common/DataTable";
import { DataTablePagination } from "@/components/common/DataTable/DataTablePagination";
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
  RegistrationStatusName,
  type RegistrationStatusNameType,
} from "@/constants/profile";
import useDebounce from "@/hooks/useDebounce";
import usePageParam from "@/hooks/usePageParam";
import { useAdminListDoctorRequest } from "@/queries/useAdmin";
import type { ListDoctorRequestsQueryType } from "@/schemaValidatation/doctorProfile";
import type { UserResType } from "@/types/user";
import { REGISTRATION_STATUS_META } from "./statusMeta";
import { getAllowedTransitions } from "./components/DoctorApplicationActions";
import DoctorApplicationDecisionDialog from "../DoctorApplications/DoctorApplicationDecisionDialog";

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

type StatusValue = RegistrationStatusNameType | "all";

const STATUS_OPTIONS: Array<{ value: StatusValue; label: string }> = [
  { value: "all", label: "Tất cả trạng thái" },
  { value: RegistrationStatusName.Pending, label: "Chờ duyệt" },
  { value: RegistrationStatusName.Approved, label: "Đã duyệt" },
  { value: RegistrationStatusName.Rejected, label: "Đã từ chối" },
  { value: RegistrationStatusName.Suspended, label: "Tạm ngưng" },
];

const VALID_STATUSES: StatusValue[] = STATUS_OPTIONS.map((o) => o.value);

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

const columns: ColumnDef<Row>[] = [
  {
    accessorKey: "user",
    header: "Người gửi",
    cell: ({ row }) => {
      const u = row.original.user;
      return (
        <div className="flex items-center gap-3 min-w-55">
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
      <div className="max-w-70">
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
];

const DoctorApplicationsTable = ({ onViewDetail }: Props) => {
  const { page } = usePageParam();
  const [searchParam, setSearchParam] = useSearchParams();
  const [decisionId, setDecisionId] = useState<string | undefined>(undefined);

  const urlSearch = searchParam.get("search") ?? "";
  const urlStatusRaw = (searchParam.get("status") ?? "all") as StatusValue;
  const urlStatus: StatusValue = VALID_STATUSES.includes(urlStatusRaw)
    ? urlStatusRaw
    : "all";

  const [search, setSearch] = useState(urlSearch);
  const debouncedSearch = useDebounce(search, 500);

  const updateParam = useCallback(
    (patch: Partial<{ search: string; status: StatusValue; page: number }>) => {
      const next = new URLSearchParams(searchParam);
      if (patch.search !== undefined) {
        if (patch.search) next.set("search", patch.search);
        else next.delete("search");
      }
      if (patch.status !== undefined) {
        if (patch.status && patch.status !== "all")
          next.set("status", patch.status);
        else next.delete("status");
      }
      if (patch.page !== undefined) {
        if (patch.page > 1) next.set("page", String(patch.page));
        else next.delete("page");
      }
      setSearchParam(next, { replace: true });
    },
    [searchParam, setSearchParam],
  );

  useEffect(() => {
    if (debouncedSearch === urlSearch) return;
    updateParam({ search: debouncedSearch.trim(), page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query: ListDoctorRequestsQueryType = {
    page,
    limit: 10,
    search: debouncedSearch?.trim() || undefined,
    status: urlStatus !== "all" ? urlStatus : undefined,
  };

  const listResult = useAdminListDoctorRequest(query, {
    keepPreviousData: true,
  });

  const data = (listResult.data?.data.data ?? []) as Row[];
  const totalPages = listResult.data?.data.meta.totalPages ?? 0;
  const totalRecords = listResult.data?.data.meta.totalItems ?? 0;

  const actions = useMemo<DataTableAction<Row>[]>(
    () => [
      {
        key: "view",
        label: "Xem chi tiết",
        icon: Eye,
        onSelect: (row) => onViewDetail(row.id),
      },
      {
        key: "decide",
        label: "Quyết định",
        icon: Scale,
        hidden: (row) =>
          getAllowedTransitions(row.registrationStatus).length === 0,
        onSelect: (row) => setDecisionId(row.id),
      },
    ],
    [onViewDetail],
  );

  const hasActiveFilter = !!debouncedSearch || urlStatus !== "all";
  const isEmpty = !listResult.isLoading && data.length === 0;
  const emptyText = hasActiveFilter
    ? "Không tìm thấy đơn nào phù hợp với bộ lọc."
    : "Chưa có đơn xin làm bác sĩ nào.";

  const handleClearFilters = () => {
    setSearch("");
    updateParam({ search: "", status: "all", page: 1 });
  };

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
            aria-label="Tìm kiếm đơn"
          />
        </div>

        <Select
          value={urlStatus}
          onValueChange={(v) =>
            updateParam({ status: v as StatusValue, page: 1 })
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
            onClick={handleClearFilters}
            className="md:ml-auto"
          >
            <X className="mr-1.5 h-4 w-4" />
            Xóa bộ lọc
          </Button>
        )}
      </div>

      <div
        className={
          listResult.isFetching && !listResult.isLoading
            ? "opacity-60 transition-opacity"
            : "transition-opacity"
        }
      >
        <DataTable
          columns={columns}
          data={data}
          isLoading={listResult.isLoading}
          actions={actions}
          emptyText={emptyText}
        />
      </div>

      {isEmpty && hasActiveFilter && (
        <div className="flex justify-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
          >
            <X className="mr-1.5 h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
      )}

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalRecords}
        rowCount={data.length}
      />

      <DoctorApplicationDecisionDialog
        id={decisionId}
        onClose={() => setDecisionId(undefined)}
      />
    </div>
  );
};

export default DoctorApplicationsTable;
