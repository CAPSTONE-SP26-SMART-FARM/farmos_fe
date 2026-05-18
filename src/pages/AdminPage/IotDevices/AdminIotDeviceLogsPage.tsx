import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ClipboardList, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import ProPagination from "@/components/common/pro-pagination";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { useAdminListIotDeviceLogs } from "@/queries/useIotDevice";
import type {
  IotDeviceLogResType,
  ListIotDeviceLogsQueryType,
} from "@/schemaValidatation/iotDevice";
import { LogRow } from "./_components/logs/LogRow";
import { LogFilterBar } from "./_components/logs/LogFilterBar";
import { LogDetailSheet } from "./_components/logs/LogDetailSheet";

function parsePositiveInt(value: string | null, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function LogListSkeleton() {
  return (
    <div className="divide-y rounded-lg border">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 px-4 py-3"
        >
          <Skeleton className="h-5 w-20 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export default function AdminIotDeviceLogsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const dateFrom = searchParams.get("dateFrom") ?? "";
  const dateTo = searchParams.get("dateTo") ?? "";
  const page = parsePositiveInt(searchParams.get("page"), 1);
  const limit = parsePositiveInt(searchParams.get("limit"), 20);

  const [selectedLog, setSelectedLog] = useState<IotDeviceLogResType | null>(
    null,
  );

  // Local input state cho 2 date picker — chỉ sync URL khi user click "Lọc".
  // Tránh refetch sau từng phím khi user còn đang chỉnh ngày.
  const [draftFrom, setDraftFrom] = useState(dateFrom);
  const [draftTo, setDraftTo] = useState(dateTo);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleApplyFilter = useCallback(() => {
    updateParams({
      dateFrom: draftFrom || null,
      dateTo: draftTo || null,
      page: null,
    });
  }, [draftFrom, draftTo, updateParams]);

  const handleClearFilter = useCallback(() => {
    setDraftFrom("");
    setDraftTo("");
    setSearchParams(new URLSearchParams(), { replace: true });
  }, [setSearchParams]);

  const handleLimitChange = useCallback(
    (next: number) => {
      updateParams({
        limit: next === 20 ? null : String(next),
        page: null,
      });
    },
    [updateParams],
  );

  const hasActiveFilter = !!(dateFrom || dateTo);

  const effectiveQuery = useMemo<ListIotDeviceLogsQueryType>(
    () => ({
      page,
      limit,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [page, limit, dateFrom, dateTo],
  );

  const logsQuery = useAdminListIotDeviceLogs(effectiveQuery);
  const logs = logsQuery.data?.data?.data ?? [];
  const meta = logsQuery.data?.data?.meta;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div>
          <Badge className="mb-2">Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Nhật ký thiết bị IoT
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Lịch sử các thao tác trên tất cả thiết bị IoT trong hệ thống.
          </p>
        </div>
      </section>

      {/*
        Filter bar tách khỏi CardHeader: header chỉ là identity, filter là
        section riêng theo rule 14 layout thinking.
      */}
      <LogFilterBar
        dateFrom={draftFrom}
        dateTo={draftTo}
        limit={limit}
        hasActiveFilter={hasActiveFilter}
        onChangeDateFrom={setDraftFrom}
        onChangeDateTo={setDraftTo}
        onChangeLimit={handleLimitChange}
        onApply={handleApplyFilter}
        onClear={handleClearFilter}
      />

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Danh sách nhật ký
            {logsQuery.isFetching && !logsQuery.isLoading && (
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-muted-foreground"
                aria-label="Đang làm mới"
              />
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-2 pt-5">
          {logsQuery.isLoading ? (
            <LogListSkeleton />
          ) : logsQuery.isError ? (
            <ErrorState
              message="Không thể tải nhật ký. Thử lại sau."
              onRetry={() => logsQuery.refetch()}
            />
          ) : logs.length === 0 ? (
            hasActiveFilter ? (
              <EmptyState
                title="Không có nhật ký trong khoảng này"
                description="Thử mở rộng khoảng thời gian hoặc xóa bộ lọc."
                action={{
                  label: "Xóa bộ lọc",
                  onClick: handleClearFilter,
                }}
              />
            ) : (
              <EmptyState
                title="Chưa có nhật ký nào"
                description="Khi có thao tác trên thiết bị, nhật ký sẽ xuất hiện ở đây."
              />
            )
          ) : (
            <div className="divide-y rounded-lg border">
              {logs.map((log) => (
                <LogRow
                  key={log.id}
                  log={log}
                  onClick={() => setSelectedLog(log)}
                />
              ))}
            </div>
          )}

          <div className="flex flex-col items-center gap-2 pt-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
            {meta ? (
              <span>
                {meta.totalPages > 1
                  ? `Trang ${meta.page} / ${meta.totalPages} · `
                  : ""}
                {meta.totalItems} nhật ký
              </span>
            ) : (
              <span />
            )}
            {meta && meta.totalPages > 1 && (
              <ProPagination
                currentPage={meta.page}
                totalPages={meta.totalPages}
                buildHref={(p) => {
                  const params = new URLSearchParams(searchParams);
                  const next = p ?? 1;
                  if (next === 1) params.delete("page");
                  else params.set("page", String(next));
                  return { search: params.toString() };
                }}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <LogDetailSheet
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      />
    </div>
  );
}
