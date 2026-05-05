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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import DatePickerField from "@/components/common/DatePickerField";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ProPagination from "@/components/common/pro-pagination";
import TableSkeleton from "@/components/common/TableSkeleton";
import { useOwnerDailyLogsByFarm } from "@/queries/useDailyLog";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import { formatDateTimeVi, formatDateVi } from "@/lib/format";
import { NotebookPen, Tractor } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router";

const DEFAULT_LIMIT = 10;

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

  const farmQuery = useOwnerGetMyFarm();
  const farmId = farmQuery.data?.data.id;

  const logsQuery = useOwnerDailyLogsByFarm(farmId, {
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
    setSearchParams(new URLSearchParams());
  };

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
          ) : farmQuery.isLoading || logsQuery.isLoading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nông dân</TableHead>
                  <TableHead>Khu vực</TableHead>
                  <TableHead>Công việc</TableHead>
                  <TableHead>Hoạt động</TableHead>
                  <TableHead className="w-32">Ngày ghi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableSkeleton />
              </TableBody>
            </Table>
          ) : logs.length === 0 ? (
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nông dân</TableHead>
                      <TableHead>Khu vực</TableHead>
                      <TableHead>Công việc</TableHead>
                      <TableHead>Hoạt động</TableHead>
                      <TableHead className="w-32">Ngày ghi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        className="transition-colors hover:bg-muted/40"
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar size="sm">
                              {log.farmer.avatarUrl && (
                                <AvatarImage
                                  src={log.farmer.avatarUrl}
                                  alt={log.farmer.fullName}
                                />
                              )}
                              <AvatarFallback>
                                {getInitials(log.farmer.fullName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium truncate">
                              {log.farmer.fullName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{log.zone.name}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.task?.title ?? (
                            <span className="text-muted-foreground italic">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm max-w-md">
                          <p className="line-clamp-2">{log.activities}</p>
                          {log.notes && (
                            <p className="text-xs italic text-muted-foreground line-clamp-1">
                              Ghi chú: {log.notes}
                            </p>
                          )}
                        </TableCell>
                        <TableCell
                          className="text-xs text-muted-foreground"
                          title={formatDateTimeVi(log.createdAt)}
                        >
                          {formatDateVi(log.logDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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

export default OwnerDailyLogsPage;
