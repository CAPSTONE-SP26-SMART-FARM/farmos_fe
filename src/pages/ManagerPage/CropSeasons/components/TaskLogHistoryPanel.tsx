import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, NotebookPen } from "lucide-react";
import { useState } from "react";
import { useManagerDailyLogsByZone } from "@/queries/useDailyLog";
import { formatDateTimeVi, formatDateVi } from "@/lib/format";

const PAGE_LIMIT = 5;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Lịch sử nhật ký cho 1 task — dùng filter `employeeTaskId` của BE
 * (không cần FE-side filter theo milestoneId nữa).
 */
export function TaskLogHistoryPanel({
  zoneId,
  employeeTaskId,
}: {
  zoneId: string;
  employeeTaskId: string;
}) {
  const [page, setPage] = useState(1);

  const logsQuery = useManagerDailyLogsByZone(zoneId, {
    page,
    limit: PAGE_LIMIT,
    employeeTaskId,
  });

  const logs = logsQuery.data?.data?.data ?? [];
  const meta = logsQuery.data?.data?.meta;

  if (logsQuery.isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (logsQuery.isError) {
    return (
      <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-4 text-center text-xs text-destructive">
        Không thể tải nhật ký.
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="rounded-md border bg-muted/20 px-3 py-6 text-center space-y-1">
        <NotebookPen className="h-6 w-6 text-muted-foreground/60 mx-auto" />
        <p className="text-xs text-muted-foreground">
          Chưa có nhật ký nào cho nhiệm vụ này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {logs.map((log) => (
          <div
            key={log.id}
            className="rounded-md border p-2.5 space-y-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Avatar size="sm">
                  {log.farmer.avatarUrl && (
                    <AvatarImage
                      src={log.farmer.avatarUrl}
                      alt={log.farmer.fullName}
                    />
                  )}
                  <AvatarFallback>{initials(log.farmer.fullName)}</AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium truncate">
                  {log.farmer.fullName}
                </span>
              </div>
              <span
                className="text-[10px] text-muted-foreground shrink-0"
                title={formatDateTimeVi(log.createdAt)}
              >
                {formatDateVi(log.logDate)}
              </span>
            </div>
            <Separator className="opacity-50" />
            <p className="text-xs whitespace-pre-line line-clamp-4">
              {log.activities}
            </p>
            {log.notes && (
              <p className="text-[11px] italic text-muted-foreground line-clamp-2">
                Ghi chú: {log.notes}
              </p>
            )}
          </div>
        ))}
      </div>

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-muted-foreground">
            {meta.totalItems} nhật ký
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <span className="text-[10px] text-muted-foreground">
              {meta.page}/{meta.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="h-6 w-6 p-0"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
