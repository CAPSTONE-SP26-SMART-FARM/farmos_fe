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
import DatePickerField from "@/components/common/DatePickerField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ProPagination from "@/components/common/pro-pagination";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useManagerDailyLogsByZone } from "@/queries/useDailyLog";
import { useManagerListAssignedZones } from "@/queries/useZone";
import { formatDateTimeVi, formatDateVi } from "@/lib/format";
import { Map as MapIcon, NotebookPen } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router";

const DEFAULT_LIMIT = 10;

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function ManagerDailyLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");
  const fromDateParam = searchParams.get("fromDate") ?? "";
  const toDateParam = searchParams.get("toDate") ?? "";
  const zoneIdParam = searchParams.get("zoneId") ?? "";

  const today = new Date().toISOString().slice(0, 10);
  const [fromDateInput, setFromDateInput] = useState(fromDateParam || today);
  const [toDateInput, setToDateInput] = useState(toDateParam || today);

  const zonesQuery = useManagerListAssignedZones({ page: 1, limit: 50 });
  const zones = useMemo(
    () => zonesQuery.data?.data.data ?? [],
    [zonesQuery.data],
  );

  // Implicit default: when no zoneId in URL, fall back to the first
  // assigned zone. The URL stays untouched until the user picks one.
  const activeZoneId = zoneIdParam || zones[0]?.id;
  const activeZoneName = zones.find((z) => z.id === activeZoneId)?.name;

  const logsQuery = useManagerDailyLogsByZone(activeZoneId, {
    page,
    limit: DEFAULT_LIMIT,
    fromDate: fromDateParam || undefined,
    toDate: toDateParam || undefined,
  });

  const logs = logsQuery.data?.data.data ?? [];
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
    const next = new URLSearchParams();
    if (activeZoneId) next.set("zoneId", activeZoneId);
    setSearchParams(next);
  };

  type DailyLogRow = (typeof logs)[number];

  const columns: ColumnDef<DailyLogRow>[] = [
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
  ];

  const handleSelectZone = (zoneId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("zoneId", zoneId);
    next.delete("page");
    setSearchParams(next);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Badge className="mb-2">Cổng quản lý</Badge>
        <h1 className="text-2xl font-bold">Nhật ký công việc</h1>
        <p className="text-muted-foreground">
          Theo dõi nhật ký do nông dân ghi nhận theo từng khu vực bạn phụ trách.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end">
            <div className="space-y-1.5 md:w-64">
              <p className="text-sm font-medium">Khu vực</p>
              <Select
                value={activeZoneId ?? ""}
                onValueChange={handleSelectZone}
                disabled={zones.length === 0}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      zonesQuery.isLoading ? "Đang tải..." : "Chọn khu vực"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {zones.map((zone) => (
                    <SelectItem
                      key={zone.id}
                      value={zone.id}
                    >
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-44">
              <DatePickerField
                label="Từ ngày"
                value={fromDateInput}
                onChange={setFromDateInput}
              />
            </div>
            <div className="w-44">
              <DatePickerField
                label="Đến ngày"
                value={toDateInput}
                onChange={setToDateInput}
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
          <CardTitle className="text-base">
            {activeZoneName
              ? `Nhật ký – ${activeZoneName}`
              : "Danh sách nhật ký"}
          </CardTitle>
          <CardDescription>
            {logsQuery.isLoading
              ? "Đang tải..."
              : `${totalItems} nhật ký được ghi nhận`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!zonesQuery.isLoading && zones.length === 0 ? (
            <EmptyState
              icon={MapIcon}
              title="Chưa có khu vực"
              description="Bạn chưa được phân công khu vực. Liên hệ chủ trang trại để bắt đầu."
            />
          ) : logsQuery.isError ? (
            <ErrorState
              message="Không thể tải nhật ký."
              onRetry={() => logsQuery.refetch()}
            />
          ) : !logsQuery.isLoading && logs.length === 0 ? (
            <EmptyState
              icon={NotebookPen}
              title="Chưa có nhật ký"
              description={
                hasFilter
                  ? "Không có nhật ký nào trong khoảng đã chọn. Thử mở rộng khoảng thời gian."
                  : "Chưa có nhật ký nào trong khu vực này."
              }
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={logs}
                  isLoading={logsQuery.isLoading}
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
    </div>
  );
}

export default ManagerDailyLogsPage;
