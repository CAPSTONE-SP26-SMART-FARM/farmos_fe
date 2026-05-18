import type { ColumnDef } from "@tanstack/react-table";
import { Banknote, Eye, Info } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
} from "@/schemaValidatation/doctorWithdrawal";
import AdminWithdrawalDetailPanel from "./AdminWithdrawalDetailPanel";
import {
  STATUS_CLASS,
  STATUS_LABELS,
  STATUS_VARIANT,
} from "./withdrawal.constants";

const STATUS_OPTIONS: { label: string; value: string }[] = [
  { label: "Tất cả trạng thái", value: "all" },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

const columns: ColumnDef<WithdrawalRequestResType>[] = [
  {
    accessorKey: "doctorName",
    header: "Bác sĩ",
    cell: ({ row }) => (
      <span className="font-medium">{row.original.doctorName ?? "—"}</span>
    ),
  },
  {
    accessorKey: "doctorEmail",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.doctorEmail ?? "—"}
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
      <span className="text-sm">{formatDateTimeVi(row.original.createdAt)}</span>
    ),
  },
];

function AdminDoctorWithdrawalsPage() {
  const { page } = usePageParam();
  const [searchParam, setSearchParam] = useSearchParams();

  const [search, setSearch] = useState(searchParam.get("search") ?? "");
  const debouncedSearch = useDebounce(search, 500);
  const [statusFilter, setStatusFilter] = useState<string>(
    searchParam.get("status") ?? "all",
  );

  const [detailId, setDetailId] = useState<string | null>(null);

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
    q: debouncedSearch.trim() || undefined,
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
        icon: Eye,
        onSelect: (row) => setDetailId(row.id),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge className="mb-2">Cổng quản trị</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Yêu Cầu Rút Tiền Bác Sĩ
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Duyệt, từ chối và đánh dấu chuyển khoản cho các yêu cầu rút tiền
              từ ví bác sĩ.
            </p>
          </div>
        </div>
      </section>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Danh sách yêu cầu
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                Nhấp vào dòng để xem chi tiết và thực hiện thao tác duyệt / từ
                chối / đánh dấu chuyển khoản.
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Tìm kiếm</p>
              <Input
                placeholder="Tìm theo tên hoặc email bác sĩ..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Trạng thái</p>
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-h-150">
            <DataTable
              columns={columns}
              data={rows}
              isLoading={listResult.isLoading}
              actions={actions}
              onRowClick={(row) => setDetailId(row.id)}
            />
          </div>

          <DataTablePagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            rowCount={rows.length}
          />
        </CardContent>
      </Card>

      <Dialog
        open={!!detailId}
        onOpenChange={(open) => !open && setDetailId(null)}
      >
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu rút tiền</DialogTitle>
            <DialogDescription>
              Xem thông tin chi tiết và thực hiện thao tác duyệt / chuyển khoản.
            </DialogDescription>
          </DialogHeader>
          {detailId && <AdminWithdrawalDetailPanel withdrawalId={detailId} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDoctorWithdrawalsPage;
