import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import {
  AlertCircle,
  ClipboardList,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useAdminListIotDeviceLogs } from "@/queries/useIotDevice";
import type {
  IotDeviceLogResType,
  ListIotDeviceLogsQueryType,
} from "@/schemaValidatation/iotDevice";
import {
  DEVICE_TYPE_LABEL,
  IOT_ACTION_BADGE_CLASS,
  IOT_ACTION_LABEL,
  STATUS_META,
} from "@/constants/iotDeviceDisplay";
import { useNavigate } from "react-router";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN");
}

export default function AdminIotDeviceLogsPage() {
  const [query, setQuery] = useState<ListIotDeviceLogsQueryType>({
    page: 1,
    limit: 20,
  });
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedLog, setSelectedLog] = useState<IotDeviceLogResType | null>(
    null,
  );

  const effectiveQuery = useMemo(
    () => ({
      ...query,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    }),
    [query, dateFrom, dateTo],
  );

  const logsQuery = useAdminListIotDeviceLogs(effectiveQuery);
  const logs = logsQuery.data?.data?.data ?? [];
  const meta = logsQuery.data?.data?.meta;

  const applyDateFilter = () => {
    setQuery((prev) => ({ ...prev, page: 1 }));
  };

  const clearDateFilter = () => {
    setDateFrom("");
    setDateTo("");
    setQuery((prev) => ({ ...prev, page: 1 }));
  };

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

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            Danh sách nhật ký
            {logsQuery.isFetching && !logsQuery.isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </CardTitle>
          <CardDescription>
            Click vào một nhật ký để xem chi tiết đầy đủ.
          </CardDescription>

          <div className="mt-2 flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Từ ngày</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-36"
              />
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-xs">Đến ngày</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-36"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={applyDateFilter}>
                Lọc
              </Button>
              {(dateFrom || dateTo) && (
                <Button size="sm" variant="outline" onClick={clearDateFilter}>
                  Xóa lọc
                </Button>
              )}
            </div>
            <div className="ml-auto flex flex-col gap-1">
              <Label className="text-xs">Hiển thị</Label>
              <Select
                value={String(query.limit)}
                onValueChange={(v) =>
                  setQuery((prev) => ({ ...prev, page: 1, limit: Number(v) }))
                }
              >
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20">20 / trang</SelectItem>
                  <SelectItem value="50">50 / trang</SelectItem>
                  <SelectItem value="100">100 / trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-2 pt-5">
          {logsQuery.isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logsQuery.isError ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center text-destructive">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm">
                Không thể tải nhật ký. Thử lại sau.
              </p>
            </div>
          ) : logs.length === 0 ? (
            <p className="py-10 text-center text-muted-foreground">
              Không có nhật ký nào trong khoảng thời gian này.
            </p>
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

          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
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
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasPreviousPage}
                  onClick={() =>
                    setQuery((prev) => ({
                      ...prev,
                      page: Math.max(1, prev.page - 1),
                    }))
                  }
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasNextPage}
                  onClick={() =>
                    setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Sau
                </Button>
              </div>
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

function LogRow({
  log,
  onClick,
}: {
  log: IotDeviceLogResType;
  onClick: () => void;
}) {
  const actionLabel = IOT_ACTION_LABEL[log.action] ?? log.action;
  const actionClass =
    IOT_ACTION_BADGE_CLASS[log.action] ??
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      <span
        className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium ${actionClass}`}
      >
        {actionLabel}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {log.device?.deviceName ?? log.deviceId.slice(0, 8) + "…"}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {log.performer?.fullName ?? "Hệ thống"}
          {log.reason ? ` · ${log.reason.slice(0, 60)}${log.reason.length > 60 ? "…" : ""}` : ""}
        </p>
      </div>

      <span className="shrink-0 text-xs text-muted-foreground">
        {formatDate(log.createdAt)}
      </span>
    </button>
  );
}

function LogDetailSheet({
  log,
  open,
  onOpenChange,
}: {
  log: IotDeviceLogResType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();

  if (!log) return null;

  const actionLabel = IOT_ACTION_LABEL[log.action] ?? log.action;
  const actionClass =
    IOT_ACTION_BADGE_CLASS[log.action] ??
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  const deviceMeta = log.device
    ? STATUS_META[log.device.status]
    : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${actionClass}`}
            >
              {actionLabel}
            </span>
          </SheetTitle>
          <SheetDescription>{formatDateTime(log.createdAt)}</SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {log.device && (
            <section className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Thiết bị
              </p>
              <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-medium">{log.device.deviceName}</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 gap-1 text-xs"
                    onClick={() => {
                      navigate(
                        `/dashboard/admin/iot-devices/${log.device!.id}`,
                      );
                      onOpenChange(false);
                    }}
                  >
                    Xem thiết bị
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-xs">
                    {DEVICE_TYPE_LABEL[log.device.deviceType] ??
                      log.device.deviceType}
                  </Badge>
                  {deviceMeta && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${deviceMeta.badgeClass}`}
                    >
                      {deviceMeta.labelAdmin}
                    </span>
                  )}
                </div>
              </div>
            </section>
          )}

          <Separator />

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Người thực hiện
            </p>
            <div className="rounded-lg border bg-muted/30 p-3">
              {log.performer ? (
                <div className="space-y-1">
                  <p className="font-medium">
                    {log.performer.fullName ?? "Không rõ"}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {log.performer.role}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Hệ thống tự động</p>
              )}
            </div>
          </section>

          <Separator />

          <section className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Chi tiết
            </p>
            <div className="space-y-2">
              <DetailRow label="Hành động" value={log.action} mono />
              <DetailRow
                label="Lý do"
                value={log.reason ?? "Không có lý do"}
              />
              {log.zoneIdSnapshot && (
                <DetailRow
                  label="Zone tại thời điểm"
                  value={log.zoneIdSnapshot}
                  mono
                />
              )}
              <DetailRow
                label="Thời gian"
                value={formatDateTime(log.createdAt)}
              />
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-sm ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}
