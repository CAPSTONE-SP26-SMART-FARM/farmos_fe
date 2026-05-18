import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import {
  ActivitySquare,
  ArrowDown,
  ArrowLeft,
  ArrowLeftRight,
  Bell,
  ChevronRight,
  ClipboardList,
  History,
  PackagePlus,
  ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingCard from "@/components/common/LoadingCard";
import ErrorState from "@/components/common/ErrorState";
import { useAdminDeviceTimeline } from "@/queries/useIotDeviceAdminOps";
import type {
  TimelineEventApiType,
  TimelineEventSourceType,
} from "@/schemaValidatation/iotDeviceAdminOps";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// A5 — GET admin/iot-device/:deviceId/timeline?limit=...&before=...
// Cursor pagination: response trả nextBefore = at của event cuối.
// ─────────────────────────────────────────────────────────────

const SOURCE_META: Record<
  TimelineEventSourceType,
  { label: string; icon: typeof Bell; badgeClass: string; dotClass: string }
> = {
  audit_log: {
    label: "Nhật ký",
    icon: ClipboardList,
    badgeClass:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
    dotClass: "bg-blue-500",
  },
  notification: {
    label: "Thông báo",
    icon: Bell,
    badgeClass:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
    dotClass: "bg-amber-500",
  },
  provision: {
    label: "Cấp phát",
    icon: PackagePlus,
    badgeClass:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    dotClass: "bg-emerald-500",
  },
};

// Icon riêng cho từng event type — BE trả về `type: string` free-form
function getEventTypeIcon(type: string): typeof Bell {
  if (type === "noti_sent") return Bell;
  if (type === "provision_assigned") return PackagePlus;
  if (type === "provision_revoked") return ShieldOff;
  if (type === "swap_in" || type === "swap_out") return ArrowLeftRight;
  return ClipboardList;
}

type SourceFilter = "all" | TimelineEventSourceType;

const FILTER_LABEL: Record<SourceFilter, string> = {
  all: "Tất cả nguồn",
  audit_log: "Nhật ký",
  notification: "Thông báo",
  provision: "Cấp phát",
};

const PAGE_SIZE = 100;

export default function AdminIotDeviceTimelinePage() {
  const navigate = useNavigate();
  const { deviceId = "" } = useParams<{ deviceId: string }>();

  // Cursor pagination state: lưu mảng các `before` cursor đã load. Mỗi cursor
  // tương ứng 1 trang; UI hiển thị accumulate (concat).
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([
    undefined,
  ]);

  // Filter source client-side — BE chưa hỗ trợ param `sources`.
  const [filter, setFilter] = useState<SourceFilter>("all");

  // Query cho trang hiện tại (cursor cuối stack)
  const currentCursor = cursorStack[cursorStack.length - 1];
  const pageQuery = useAdminDeviceTimeline(deviceId, {
    limit: PAGE_SIZE,
    before: currentCursor,
  });

  // Khi user nhấn "Tải thêm", push cursor mới và tích lũy events.
  // Để đơn giản: re-fetch theo cursor mới; vì React Query cache theo queryKey,
  // page cũ vẫn còn trong cache. Để concat events ổn định, ta gọi nhiều query
  // tuần tự — đơn giản nhất là dùng 1 array events mà ta tự build.
  // Tuy nhiên với BE đã có `hasMore` + `nextBefore`, có thể UX 1-page-tại-1-thời-điểm
  // (Trước/Sau). Ở đây chọn accumulate vì doc spec ghi "Tải thêm".

  const [accumulated, setAccumulated] = useState<TimelineEventApiType[]>([]);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [seedDone, setSeedDone] = useState(false);

  // Seed page đầu vào accumulator
  if (
    !seedDone &&
    pageQuery.data?.data &&
    cursorStack.length === 1 &&
    accumulated.length === 0
  ) {
    setAccumulated(pageQuery.data.data.events);
    setHasMore(pageQuery.data.data.hasMore);
    setSeedDone(true);
  }

  const events = useMemo(
    () =>
      filter === "all"
        ? accumulated
        : accumulated.filter((e) => e.source === filter),
    [filter, accumulated],
  );

  const handleLoadMore = () => {
    const next = pageQuery.data?.data?.nextBefore ?? null;
    if (!next) {
      setHasMore(false);
      return;
    }
    // Append + bump cursor
    setCursorStack((s) => [...s, next]);
    // Sau khi cursor đổi, useAdminDeviceTimeline tự fetch trang mới.
    // Khi data trả về (effect dưới đây) — ta append vào accumulator.
  };

  // Append data khi cursor mới load xong (cursorStack.length > 1)
  if (
    cursorStack.length > 1 &&
    pageQuery.data?.data &&
    pageQuery.data.data.events.length > 0 &&
    !accumulated.some(
      (e) => e.at === pageQuery.data!.data.events[0].at,
    )
  ) {
    setAccumulated((prev) => [...prev, ...pageQuery.data!.data.events]);
    setHasMore(pageQuery.data.data.hasMore);
  }

  const isInitialLoading = pageQuery.isLoading && cursorStack.length === 1;
  const isLoadingMore = pageQuery.isFetching && cursorStack.length > 1;

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            navigate(`/dashboard/admin/iot-devices/${deviceId}/decision`)
          }
        >
          <ArrowLeft className="mr-1 h-4 w-4" aria-hidden />
          Quay lại chi tiết
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/admin/iot-device-logs">
            Nhật ký toàn hệ thống
            <ChevronRight className="ml-1 h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight">
          <History className="h-6 w-6 text-muted-foreground" aria-hidden />
          Lịch sử thiết bị
        </h1>
        <p className="text-sm text-muted-foreground">
          Dòng thời gian gộp từ nhật ký hệ thống, thông báo và cấp phát. Tải
          thêm
          các sự kiện cũ hơn nếu cần điều tra.
        </p>
      </div>

      {/* ── Bộ lọc nguồn ───────────────────────────────────────── */}
      <Card>
        <CardContent className="flex flex-wrap items-end gap-3 p-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-muted-foreground">Nguồn</span>
            <Select
              value={filter}
              onValueChange={(v) => setFilter(v as SourceFilter)}
            >
              <SelectTrigger className="h-8 w-50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FILTER_LABEL) as SourceFilter[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {FILTER_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <span className="ml-auto text-xs text-muted-foreground">
            Đang hiển thị: <strong>{events.length}</strong> sự kiện
            {accumulated.length !== events.length && (
              <> (lọc từ {accumulated.length})</>
            )}
          </span>
        </CardContent>
      </Card>

      {/* ── Timeline ───────────────────────────────────────────── */}
      {isInitialLoading ? (
        <LoadingCard rows={5} />
      ) : pageQuery.isError ? (
        <ErrorState
          message="Không thể tải timeline thiết bị. Vui lòng thử lại."
          onRetry={() => pageQuery.refetch()}
        />
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Dòng thời gian</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <ActivitySquare
                  className="h-8 w-8 text-muted-foreground"
                  aria-hidden
                />
                <p className="font-medium">Không có sự kiện nào.</p>
                <p className="text-sm text-muted-foreground">
                  Thử đổi bộ lọc nguồn.
                </p>
              </div>
            ) : (
              <ol className="relative space-y-3 border-l pl-6">
                {events.map((event, i) => (
                  <TimelineRow key={`${event.at}-${i}`} event={event} />
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Tải thêm (cursor pagination) ──────────────────────── */}
      {accumulated.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={!hasMore || isLoadingMore}
          >
            <ArrowDown className="mr-1.5 h-4 w-4" aria-hidden />
            {isLoadingMore
              ? "Đang tải..."
              : hasMore
                ? `Tải thêm ${PAGE_SIZE} sự kiện cũ hơn`
                : "Đã tải hết sự kiện"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────

function TimelineRow({ event }: { event: TimelineEventApiType }) {
  const meta = SOURCE_META[event.source];
  const time = new Date(event.at);
  const TypeIcon = getEventTypeIcon(event.type);
  return (
    <li className="relative">
      <span
        className={cn(
          "absolute -left-[29px] top-1.5 h-3 w-3 rounded-full ring-4 ring-background",
          meta.dotClass,
        )}
        aria-hidden
      />
      <div className="space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="tabular-nums text-xs text-muted-foreground">
            {time.toLocaleString("vi-VN")}
          </span>
          <Badge variant="outline" className={cn("gap-1", meta.badgeClass)}>
            <TypeIcon className="h-3 w-3" aria-hidden />
            {meta.label}
          </Badge>
          <EventBody event={event} />
        </div>
      </div>
    </li>
  );
}

function EventBody({ event }: { event: TimelineEventApiType }) {
  const d = event.details;
  if (event.type === "status_changed") {
    const from = String(d.fromStatus ?? "");
    const to = String(d.toStatus ?? "");
    const reason = d.reason ? ` · ${String(d.reason)}` : "";
    return (
      <span>
        Đổi trạng thái:{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[12px]">{from}</code>{" "}
        →{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-[12px]">{to}</code>
        <span className="text-muted-foreground">{reason}</span>
      </span>
    );
  }
  if (event.type === "noti_sent") {
    return (
      <span>
        Gửi thông báo:{" "}
        <strong>{String(d.title ?? "(không có tiêu đề)")}</strong>
      </span>
    );
  }
  if (event.type === "provision_assigned") {
    return (
      <span>
        Gán cho chủ trang trại
        {d.ownerName ? (
          <>
            {" "}
            <strong>{String(d.ownerName)}</strong>
          </>
        ) : null}
        {d.kitName ? (
          <span className="text-muted-foreground">
            {" "}
            · bộ kit {String(d.kitName)}
          </span>
        ) : null}
      </span>
    );
  }
  if (event.type === "provision_revoked") {
    return (
      <span>
        Thu hồi cấp phát
        {d.reason ? (
          <span className="text-muted-foreground">
            {" "}
            · {String(d.reason)}
          </span>
        ) : null}
      </span>
    );
  }
  if (event.type === "swap_in") {
    return (
      <span>
        Nhận thay thế từ thiết bị khác
        {d.oldDeviceLabel ? (
          <>
            {" "}
            (cũ: <strong>{String(d.oldDeviceLabel)}</strong>)
          </>
        ) : null}
      </span>
    );
  }
  if (event.type === "swap_out") {
    return (
      <span>
        Thay thế bằng thiết bị mới
        {d.newDeviceLabel ? (
          <>
            {" "}
            (mới: <strong>{String(d.newDeviceLabel)}</strong>)
          </>
        ) : null}
      </span>
    );
  }
  return <span className="text-muted-foreground">{event.type}</span>;
}
