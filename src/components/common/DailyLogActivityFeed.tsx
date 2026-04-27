import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import { formatDateTimeVi, parseBackendDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DailyLogResType } from "@/schemaValidatation/dailyLog";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { NotebookPen } from "lucide-react";

function getInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeTimeVi(value: string | null | undefined): string {
  const date = parseBackendDate(value);
  if (!date) return "-";
  try {
    return formatDistanceToNow(date, { addSuffix: true, locale: vi });
  } catch {
    return formatDateTimeVi(value);
  }
}

interface DailyLogActivityFeedProps {
  title?: string;
  description?: string;
  logs: DailyLogResType[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  /** Limit number of feed items rendered. */
  maxItems?: number;
  className?: string;
}

function DailyLogActivityFeed({
  title = "Nhật ký hôm nay",
  description,
  logs,
  isLoading,
  isError,
  onRetry,
  maxItems,
  className,
}: DailyLogActivityFeedProps) {
  const visible = maxItems ? logs.slice(0, maxItems) : logs;
  const hiddenCount = Math.max(0, logs.length - visible.length);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {isError ? (
          <ErrorState
            message="Không thể tải nhật ký."
            onRetry={onRetry}
          />
        ) : isLoading ? (
          <ul className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <li
                key={i}
                className="flex gap-3"
              >
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </li>
            ))}
          </ul>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title="Chưa có nhật ký"
            description="Chưa có hoạt động nào được ghi nhận trong khoảng thời gian này."
          />
        ) : (
          <>
            <ul
              className="space-y-4"
              aria-label="Danh sách nhật ký gần đây"
            >
              {visible.map((log) => (
                <li
                  key={log.id}
                  className="flex gap-3"
                >
                  <Avatar
                    size="sm"
                    className="mt-0.5 shrink-0"
                  >
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
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium">{log.farmer.fullName}</span>
                      <time
                        dateTime={log.createdAt}
                        title={formatDateTimeVi(log.createdAt)}
                        className="text-xs text-muted-foreground"
                      >
                        {relativeTimeVi(log.createdAt)}
                      </time>
                      <Badge
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {log.zone.name}
                      </Badge>
                      {log.task && (
                        <span className="text-xs text-muted-foreground truncate">
                          • {log.task.title}
                        </span>
                      )}
                    </div>
                    <p className={cn("text-sm break-words")}>
                      {log.activities}
                    </p>
                    {log.notes && (
                      <p className="text-xs italic text-muted-foreground break-words">
                        Ghi chú: {log.notes}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
            {hiddenCount > 0 && (
              <p className="mt-4 text-xs text-muted-foreground">
                Và {hiddenCount} nhật ký khác.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default DailyLogActivityFeed;
