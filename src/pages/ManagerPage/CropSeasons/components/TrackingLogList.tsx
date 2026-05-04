import { AlertTriangle, NotebookPen } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { TrackingLogItemType } from "@/schemaValidatation/tracking";
import { TrackingLogItem } from "./TrackingLogItem";

export function TrackingLogList({
  logs,
  isLoading,
  isError = false,
}: {
  logs: TrackingLogItemType[];
  isLoading: boolean;
  isError?: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-lg border px-4 py-3">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-64" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-destructive/5">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertTriangle className="h-8 w-8 text-destructive/60" />
        </div>
        <p className="text-sm font-semibold text-destructive">Không thể tải nhật ký</p>
        <p className="text-xs text-muted-foreground mt-1.5">
          Có lỗi xảy ra khi tải dữ liệu. Kiểm tra quyền truy cập hoặc thử lại.
        </p>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/20">
        <div className="rounded-full bg-muted p-4 mb-4">
          <NotebookPen className="h-8 w-8 text-muted-foreground/40" />
        </div>
        <p className="text-sm font-semibold">Chưa có thay đổi nào</p>
        <p className="text-xs text-muted-foreground mt-1.5">
          Nhật ký sẽ xuất hiện sau khi có thay đổi trên các trường đang theo dõi
        </p>
      </div>
    );
  }

  const grouped = logs.reduce<Record<string, TrackingLogItemType[]>>((acc, log) => {
    const date = format(new Date(log.changedAt), "dd/MM/yyyy", { locale: vi });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([date, items]) => (
        <div key={date}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs font-semibold text-muted-foreground bg-background px-2 py-0.5 rounded-full border">
              {date}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>
          <div className="space-y-2">
            {items.map((log) => <TrackingLogItem key={log.id} log={log} />)}
          </div>
        </div>
      ))}
    </div>
  );
}
