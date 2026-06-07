import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import DatePickerField from "@/components/common/DatePickerField";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ProPagination from "@/components/common/pro-pagination";
import { useOwnerDailyLogsByFarm } from "@/queries/useDailyLog";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import { formatDateTimeVi, formatDateVi } from "@/lib/format";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, NotebookPen, Paperclip, Tractor } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import OwnerDailyLogDetailSheet from "./_components/OwnerDailyLogDetailSheet";

const DEFAULT_LIMIT = 10;

type DailyLogRow = {
  id: string;
  farmer: { fullName: string; avatarUrl?: string | null };
  zone: { name: string };
  task?: { title: string } | null;
  activities: string;
  notes?: string | null;
  logDate: string;
  createdAt: string;
  attachments?: { id: string }[];
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function OwnerDailyLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const fromDateParam = searchParams.get("fromDate") ?? "";
  const toDateParam = searchParams.get("toDate") ?? "";

  const [fromDateInput, setFromDateInput] = useState(fromDateParam);
  const [toDateInput, setToDateInput] = useState(toDateParam);
  const [detailLogId, setDetailLogId] = useState<string | null>(null);

  const farmQuery = useOwnerGetMyFarm();
  const farmId = farmQuery.data?.data.id;

  const logsQuery = useOwnerDailyLogsByFarm(farmId, {
    page,
    limit: DEFAULT_LIMIT,
    fromDate: fromDateParam || undefined,
    toDate: toDateParam || undefined,
  });

  const logs = (logsQuery.data?.data.data ?? []) as DailyLogRow[];
  const meta = logsQuery.data?.data.meta;
  const totalItems = meta?.totalItems ?? 0;
  const hasFilter = Boolean(fromDateParam || toDateParam);

  const buildHref = (next?: number | null) => {
    const params = new URLSearchParams(searchParams);
    if (!next || next <= 1) params.delete("page");
    else params.set("page", String(next));
    return { search: params.toString() };
  };

  const handleApplyFilter = () => {
    const next = new URLSearchParams(searchParams);
    if (fromDateInput) next.set("fromDate", fromDateInput);
    else next.delete("fromDate");
    if (toDateInput) next.set("toDate", toDateInput);
    else next.delete("toDate");
    next.delete("page");
    setSearchParams(next);
  };

  const handleClearFilter = () => {
    setFromDateInput("");
    setToDateInput("");
    setSearchParams(new URLSearchParams());
  };

  const columns = useMemo<ColumnDef<DailyLogRow>[]>(
    () => [
      {
        id: "farmer",
        header: "Nông dân",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Avatar size="sm">
              {row.original.farmer.avatarUrl && (
                <AvatarImage
                  src={row.original.farmer.avatarUrl}
                  alt={row.original.farmer.fullName}
                />
              )}
              <AvatarFallback>
                {getInitials(row.original.farmer.fullName)}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium truncate">
              {row.original.farmer.fullName}
            </span>
          </div>
        ),
      },
      {
        id: "zone",
        header: "Khu vực",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.zone.name}</Badge>
        ),
      },
      {
        id: "task",
        header: "Công việc",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.task?.title ?? (
              <span className="text-muted-foreground italic">—</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "activities",
        header: "Hoạt động",
        cell: ({ row }) => (
          <div className="text-sm max-w-md">
            <p className="line-clamp-2">{row.original.activities}</p>
            {row.original.notes && (
              <p className="text-xs italic text-muted-foreground line-clamp-1">
                Ghi chú: {row.original.notes}
              </p>
            )}
          </div>
        ),
      },
      {
        accessorKey: "logDate",
        header: "Ngày ghi",
        cell: ({ row }) => (
          <span
            className="text-xs text-muted-foreground"
            title={formatDateTimeVi(row.original.createdAt)}
          >
            {formatDateVi(row.original.logDate)}
          </span>
        ),
      },
      {
        id: "attachments",
        header: "Ảnh",
        cell: ({ row }) => {
          const count = row.original.attachments?.length ?? 0;
          return count === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Paperclip className="h-3.5 w-3.5" /> {count}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Xem chi tiết nhật ký"
            onClick={() => setDetailLogId(row.original.id)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        ),
      },
    ],
    [],
  );

  const showFarmMissing = !farmQuery.isLoading && !farmId;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Badge className="mb-2">Cổng chủ trang trại</Badge>
        <h1 className="text-2xl font-bold">Nhật ký công việc</h1>
        <p className="text-muted-foreground">
          Theo dõi nhật ký do nông dân ghi nhận trên trang trại của bạn.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="w-44">
              <DatePickerField
                label="Từ ngày"
                value={fromDateInput}
                onChange={setFromDateInput}
                maxDate={toDateInput ? new Date(toDateInput) : undefined}
              />
            </div>
            <div className="w-44">
              <DatePickerField
                label="Đến ngày"
                value={toDateInput}
                onChange={setToDateInput}
                minDate={fromDateInput ? new Date(fromDateInput) : undefined}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleApplyFilter}
              >
                Áp dụng
              </Button>
              {hasFilter && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilter}
                >
                  Xoá lọc
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách nhật ký</CardTitle>
          <CardDescription>
            {logsQuery.isLoading || farmQuery.isLoading
              ? "Đang tải..."
              : `${totalItems} nhật ký được ghi nhận`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showFarmMissing ? (
            <EmptyState
              icon={Tractor}
              title="Chưa có trang trại"
              description="Bạn cần tạo trang trại trước khi xem nhật ký."
            />
          ) : farmQuery.isError ? (
            <ErrorState
              message="Không thể tải thông tin trang trại."
              onRetry={() => farmQuery.refetch()}
            />
          ) : logsQuery.isError ? (
            <ErrorState
              message="Không thể tải nhật ký."
              onRetry={() => logsQuery.refetch()}
            />
          ) : !logsQuery.isLoading && !farmQuery.isLoading && logs.length === 0 ? (
            <EmptyState
              icon={NotebookPen}
              title="Chưa có nhật ký"
              description={
                hasFilter
                  ? "Không có nhật ký nào trong khoảng đã chọn. Thử mở rộng khoảng thời gian."
                  : "Chưa có nhật ký nào được ghi nhận trên trang trại."
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={logs}
                  isLoading={farmQuery.isLoading || logsQuery.isLoading}
                  emptyText="Chưa có nhật ký."
                />
              </div>

              {meta && meta.totalPages > 1 && (
                <ProPagination
                  totalPages={meta.totalPages}
                  currentPage={meta.page}
                  buildHref={buildHref}
                />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <OwnerDailyLogDetailSheet
        dailyLogId={detailLogId}
        open={detailLogId !== null}
        onOpenChange={(open) => {
          if (!open) setDetailLogId(null);
        }}
      />
    </div>
  );
}

export default OwnerDailyLogsPage;
