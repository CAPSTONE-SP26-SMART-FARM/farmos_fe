import type { ColumnDef } from "@tanstack/react-table";
import { Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import { DataTablePagination } from "@/components/common/DataTable";
import type { DataTableAction } from "@/components/common/DataTable";
import useDebounce from "@/hooks/useDebounce";
import usePageParam from "@/hooks/usePageParam";
import { useAdminListWithdrawals } from "@/queries/useAdmin";
import { formatCurrencyVnd, formatDateTimeVi } from "@/lib/format";
import type {
  ListAdminWithdrawalsQueryType,
  WithdrawalRequestResType,
  WithdrawalStatus,
} from "@/schemaValidatation/doctorWithdrawal";

// ── Status display config ────────────────────────────────────────────────
const STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: "Chờ duyệt",
  in_progress: "Đang xử lý",
  paid: "Đã chuyển khoản",
  done: "Hoàn thành",
  rejected: "Bị từ chối",
  cancelled: "Đã huỷ",
  not_received: "Chưa nhận tiền",
};

const STATUS_VARIANT: Record<
  WithdrawalStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  in_progress: "outline",
  paid: "outline",
  done: "default",
  rejected: "destructive",
  cancelled: "secondary",
  not_received: "outline",
};

const STATUS_CLASS: Partial<Record<WithdrawalStatus, string>> = {
  in_progress: "border-blue-500 text-blue-600",
  paid: "border-purple-500 text-purple-600",
  not_received: "border-orange-500 text-orange-600",
};

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "Tất cả trạng thái", value: "all" },
  { label: "Chờ duyệt", value: "pending" },
  { label: "Đang xử lý", value: "in_progress" },
  { label: "Đã chuyển khoản", value: "paid" },
  { label: "Hoàn thành", value: "done" },
  { label: "Bị từ chối", value: "rejected" },
  { label: "Đã huỷ", value: "cancelled" },
  { label: "Chưa nhận tiền", value: "not_received" },
];

// ── Columns ───────────────────────────────────────────────────────────────
const columns: ColumnDef<WithdrawalRequestResType>[] = [
  {
    accessorKey: "id",
    header: "Mã yêu cầu",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.id.slice(0, 8)}…
      </span>
    ),
  },
  {
    accessorKey: "doctorId",
    header: "ID Bác sĩ",
    cell: ({ row }) => (
      <span className="font-mono text-xs text-muted-foreground">
        {row.original.doctorId.slice(0, 8)}…
      </span>
    ),
  },
  {
    accessorKey: "amount",
    header: "Số tiền",
    cell: ({ row }) => (
      <span className="font-semibold">
        {formatCurrencyVnd(row.original.amount)}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Trạng thái",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <Badge
          variant={STATUS_VARIANT[status]}
          className={STATUS_CLASS[status]}
        >
          {STATUS_LABELS[status]}
        </Badge>
      );
    },
  },
  {
    accessorKey: "snapshotBankName",
    header: "Ngân hàng",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.snapshotBankName}</div>
        <div className="text-xs text-muted-foreground">
          {row.original.snapshotAccountNumber}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "snapshotAccountHolder",
    header: "Chủ tài khoản",
    cell: ({ row }) => <span>{row.original.snapshotAccountHolder}</span>,
  },
  {
    accessorKey: "createdAt",
    header: "Ngày tạo",
    cell: ({ row }) => (
      <span className="text-sm">
        {formatDateTimeVi(row.original.createdAt)}
      </span>
    ),
  },
];

// ── Page ──────────────────────────────────────────────────────────────────
function AdminDoctorWithdrawalsPage() {
  const navigate = useNavigate();
  const { page } = usePageParam();
  const [searchParam, setSearchParam] = useSearchParams();

  const [search, setSearch] = useState(searchParam.get("search") ?? "");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParam.get("status") ?? "all",
  );

  // Reset page to 1 when filters change
  useEffect(() => {
    if (page > 1) {
      const params = new URLSearchParams(searchParam);
      params.set("page", "1");
      setSearchParam(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, statusFilter]);

  const query: ListAdminWithdrawalsQueryType = {
    page,
    limit: 10,
    status:
      statusFilter !== "all"
        ? (statusFilter as ListAdminWithdrawalsQueryType["status"])
        : undefined,
    doctorId: debouncedSearch.trim() || undefined,
  };

  const listResult = useAdminListWithdrawals(query);
  const rows: WithdrawalRequestResType[] = listResult.data?.data.data ?? [];
  const totalPages = listResult.data?.data.meta.totalPages ?? 0;
  const totalItems = listResult.data?.data.meta.totalItems ?? 0;

  const actions: DataTableAction<WithdrawalRequestResType>[] = useMemo(
    () => [
      {
        key: "view",
        label: "Xem chi tiết",
        icon: Info,
        onSelect: (row) =>
          navigate(`/dashboard/admin/doctor-withdrawals/${row.id}`),
      },
    ],
    [navigate],
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Yêu Cầu Rút Tiền Bác Sĩ
        </h1>
        <p className="text-sm text-muted-foreground">
          Quản lý các yêu cầu rút tiền từ bác sĩ
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          placeholder="Tìm theo ID Bác sĩ..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
        >
          <SelectTrigger className="w-48">
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
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={listResult.isLoading}
        actions={actions}
        onRowClick={(row) =>
          navigate(`/dashboard/admin/doctor-withdrawals/${row.id}`)
        }
      />

      <DataTablePagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={totalItems}
        rowCount={rows.length}
      />
    </div>
  );
}

export default AdminDoctorWithdrawalsPage;
