import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AttachmentGallery } from "@/components/common/AttachmentGallery";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import type { DailyLogResType } from "@/schemaValidatation/dailyLog";
import { formatDateTimeVi, formatDateVi } from "@/lib/format";
import {
  CalendarClock,
  Image as ImageIcon,
  Map as MapIcon,
  NotebookPen,
  StickyNote,
  Wheat,
} from "lucide-react";

interface DailyLogDetailViewProps {
  log: DailyLogResType | undefined;
  isLoading: boolean;
  isError: boolean;
  onRetry?: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function DetailSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <Separator />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  children,
}: {
  icon: typeof MapIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </div>
  );
}

/**
 * Presentational view cho 1 nhật ký công việc. Hiển thị thông tin nông dân,
 * khu vực, task gắn với log, hoạt động, ghi chú và lưới ảnh đính kèm.
 *
 * Component này KHÔNG tự fetch — caller (Sheet wrapper trong từng role) sẽ
 * gọi hook tương ứng (useManagerDailyLogDetail / useOwnerDailyLogDetail) và
 * truyền state vào props.
 */
export function DailyLogDetailView({
  log,
  isLoading,
  isError,
  onRetry,
}: DailyLogDetailViewProps) {
  if (isLoading) return <DetailSkeleton />;

  if (isError) {
    return (
      <ErrorState
        message="Không tải được chi tiết nhật ký."
        onRetry={onRetry}
      />
    );
  }

  if (!log) {
    return (
      <EmptyState
        icon={NotebookPen}
        title="Không tìm thấy nhật ký"
        description="Nhật ký này có thể đã bị xoá."
      />
    );
  }

  const attachments = log.attachments ?? [];

  return (
    <div className="space-y-5">
      {/* Farmer + meta */}
      <div className="flex items-center gap-3">
        <Avatar size="lg">
          {log.farmer.avatarUrl && (
            <AvatarImage
              src={log.farmer.avatarUrl}
              alt={log.farmer.fullName}
            />
          )}
          <AvatarFallback>{getInitials(log.farmer.fullName)}</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <p className="text-base font-semibold leading-none">
            {log.farmer.fullName}
          </p>
          <p
            className="text-xs text-muted-foreground"
            title={formatDateTimeVi(log.createdAt)}
          >
            Ghi nhận lúc {formatDateTimeVi(log.createdAt)}
          </p>
        </div>
      </div>

      <Separator />

      {/* Quick facts */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <SectionHeading icon={MapIcon}>Khu vực</SectionHeading>
          <Badge variant="secondary">{log.zone.name}</Badge>
        </div>
        <div className="space-y-1.5">
          <SectionHeading icon={CalendarClock}>Ngày ghi</SectionHeading>
          <p className="text-sm font-medium">{formatDateVi(log.logDate)}</p>
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <SectionHeading icon={Wheat}>Công việc gắn với nhật ký</SectionHeading>
          <p className="text-sm font-medium">
            {log.task?.title ?? (
              <span className="italic text-muted-foreground">
                Không gắn với công việc cụ thể
              </span>
            )}
          </p>
        </div>
      </div>

      <Separator />

      {/* Activities */}
      <div className="space-y-2">
        <SectionHeading icon={NotebookPen}>Hoạt động đã làm</SectionHeading>
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
          {log.activities || (
            <span className="italic text-muted-foreground">
              Chưa ghi hoạt động.
            </span>
          )}
        </p>
      </div>

      {/* Notes */}
      {log.notes && log.notes.trim() && (
        <div className="space-y-2">
          <SectionHeading icon={StickyNote}>Ghi chú</SectionHeading>
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">
            {log.notes}
          </p>
        </div>
      )}

      {/* Attachments */}
      <div className="space-y-2">
        <SectionHeading icon={ImageIcon}>
          Ảnh đính kèm ({attachments.length})
        </SectionHeading>
        {attachments.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">
            Nhật ký này không có ảnh đính kèm.
          </p>
        ) : (
          <AttachmentGallery
            attachments={attachments.map((a) => ({
              id: a.id,
              url: a.url,
              createdAt: a.createdAt,
            }))}
          />
        )}
      </div>
    </div>
  );
}

export default DailyLogDetailView;
