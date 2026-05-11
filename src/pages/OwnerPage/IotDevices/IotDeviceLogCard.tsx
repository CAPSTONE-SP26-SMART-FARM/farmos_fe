import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertCircle, ChevronDown, Loader2 } from "lucide-react";
import { useAdminListIotDeviceLogs } from "@/queries/useIotDevice";
import type { IotDeviceLogResType } from "@/schemaValidatation/iotDevice";
import { IOT_ACTION_BADGE_CLASS, IOT_ACTION_LABEL } from "@/constants/iotDeviceDisplay";

export function DeviceLogCard({ deviceId }: { deviceId: string }) {
  const logsQuery = useAdminListIotDeviceLogs({ deviceId, page: 1, limit: 10 });
  const logs = logsQuery.data?.data?.data ?? [];
  const total = logsQuery.data?.data?.meta?.totalItems ?? 0;

  return (
    <Collapsible defaultOpen>
      <Card>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="hover:bg-muted/30 transition-colors rounded-t-xl">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                Nhật ký thiết bị
                {logsQuery.isFetching && !logsQuery.isLoading && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                )}
              </span>
              <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 in-data-[state=open]:rotate-180" />
            </CardTitle>
            <CardDescription>
              {total > 10
                ? `10 nhật ký gần nhất · tổng ${total} bản ghi`
                : `${total} nhật ký`}
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent>
            {logsQuery.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : logsQuery.isError ? (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                Không thể tải nhật ký.
              </div>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Chưa có nhật ký nào.</p>
            ) : (
              <div className="divide-y rounded-lg border">
                {logs.map((log) => (
                  <LogRow key={log.id} log={log} />
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

function LogRow({ log }: { log: IotDeviceLogResType }) {
  const actionLabel = IOT_ACTION_LABEL[log.action] ?? log.action;
  const actionClass =
    IOT_ACTION_BADGE_CLASS[log.action] ??
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200";

  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <span
        className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-xs font-medium ${actionClass}`}
      >
        {actionLabel}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs text-muted-foreground">
          {log.performer?.fullName ?? "Hệ thống"}
          {log.reason
            ? ` · ${log.reason.slice(0, 60)}${log.reason.length > 60 ? "…" : ""}`
            : ""}
        </p>
      </div>
      <span className="shrink-0 text-xs text-muted-foreground">
        {new Date(log.createdAt).toLocaleDateString("vi-VN")}
      </span>
    </div>
  );
}
