import { Skeleton } from "@/components/ui/skeleton";
import { useCropSeasonMilestonesIotCoverage } from "@/queries/useIotCoverage";
import { cn } from "@/lib/utils";
import { CheckCircle2, HelpCircle, TriangleAlert } from "lucide-react";
import { useMemo } from "react";

// Gợi ý độ phủ thiết bị IoT cho 1 mùa vụ — hiển thị lúc gửi duyệt (manager) và
// duyệt (owner). THUẦN GỢI Ý: không bao giờ chặn thao tác. Khi không tải được
// (lỗi mạng / 404) thì ẩn hẳn để không cản trở luồng gửi/duyệt.
interface Props {
  cropSeasonId: string;
  className?: string;
}

function formatM2(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("vi-VN");
}

export default function CropSeasonMilestonesCoverageHint({
  cropSeasonId,
  className,
}: Props) {
  const { data, isLoading, isError } =
    useCropSeasonMilestonesIotCoverage(cropSeasonId);

  const coverage = data?.data;

  // Chỉ liệt kê các giai đoạn còn thiếu phủ — phần "đủ" không cần nhắc.
  const underCoveredMilestones = useMemo(
    () =>
      (coverage?.milestones ?? [])
        .filter((m) => m.status === "under_covered")
        .sort((a, b) => a.milestoneOrder - b.milestoneOrder),
    [coverage],
  );

  if (isLoading) {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-16 w-full rounded-lg" />
      </div>
    );
  }

  // Advisory: lỗi thì ẩn, không làm phiền người gửi/duyệt.
  if (isError || !coverage) return null;

  const { status } = coverage;
  const seasonGap = coverage.gapSqm ?? 0;

  if (status === "unknown") {
    return (
      <div
        className={cn(
          "flex items-start gap-2.5 rounded-lg border bg-muted/40 px-3.5 py-3 text-sm",
          className,
        )}
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
          <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
        </span>
        <p className="text-xs leading-relaxed text-muted-foreground">
          Mùa vụ chưa khai báo diện tích vùng trồng nên chưa kiểm tra được độ
          phủ thiết bị IoT.
        </p>
      </div>
    );
  }

  if (status === "sufficient") {
    return (
      <div
        className={cn(
          "flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 px-3.5 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100",
          className,
        )}
      >
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          <CheckCircle2 className="h-3.5 w-3.5" />
        </span>
        <p className="text-xs leading-relaxed">
          Thiết bị IoT đã đủ phủ cho mọi giai đoạn của mùa vụ này.
        </p>
      </div>
    );
  }

  // under_covered
  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100",
        className,
      )}
    >
      <div className="flex items-start gap-2.5 px-3.5 py-3">
        <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
          <TriangleAlert className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Độ phủ thiết bị IoT chưa đủ</p>
            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold tabular-nums dark:bg-amber-900/50">
              thiếu {formatM2(seasonGap)} m²
            </span>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            Một số giai đoạn chưa có đủ thiết bị theo dõi. Đây chỉ là gợi ý — bạn
            vẫn có thể tiếp tục gửi duyệt.
          </p>
        </div>
      </div>

      {underCoveredMilestones.length > 0 && (
        <ul className="divide-y divide-amber-200/60 border-t border-amber-200/70 dark:divide-amber-900/30 dark:border-amber-900/40">
          {underCoveredMilestones.map((m) => (
            <li
              key={m.milestoneId}
              className="flex items-center justify-between gap-2 px-3.5 py-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/70" />
                <span className="truncate font-medium">{m.stageName}</span>
              </span>
              <span className="shrink-0 tabular-nums opacity-90">
                thiếu {formatM2(m.gapSqm ?? 0)} m²
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
