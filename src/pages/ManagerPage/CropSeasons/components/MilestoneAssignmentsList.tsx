import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronRight as ArrowRight,
  Cpu,
  Search,
  XCircle,
} from "lucide-react";
import useDebounce from "@/hooks/useDebounce";
import {
  DEVICE_STATUS_VALUES,
  type DeviceStatusType,
  type MilestoneAssignmentDetailResType,
  type SearchMilestoneAssignmentsResType,
} from "@/schemaValidatation/milestoneIotDevice";
import type { ApiResponseType } from "@/types/api";
import type { UseQueryResult } from "@tanstack/react-query";

export const DEVICE_STATUS_META: Record<
  DeviceStatusType,
  { label: string; dot: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  available: { label: "Sẵn sàng", dot: "bg-slate-400", variant: "secondary" },
  purchase: { label: "Chưa lắp đặt", dot: "bg-blue-500", variant: "secondary" },
  install: { label: "Đang lắp đặt", dot: "bg-amber-500", variant: "outline" },
  active: { label: "Hoạt động", dot: "bg-emerald-500 animate-pulse", variant: "default" },
  inactive: { label: "Chờ giai đoạn bắt đầu", dot: "bg-zinc-400", variant: "outline" },
  error: { label: "Lỗi", dot: "bg-red-500", variant: "destructive" },
  revoked: { label: "Đã thu hồi", dot: "bg-zinc-400", variant: "outline" },
};

const STATUS_FILTER_ALL = "__all__";

type SearchHook = (
  milestoneId: string,
  query: { page: number; limit: number; q?: string; status?: DeviceStatusType },
  enabled?: boolean,
) => UseQueryResult<
  ApiResponseType<SearchMilestoneAssignmentsResType>,
  unknown
>;

export function DeviceStatusBadge({ status }: { status: string }) {
  const meta =
    DEVICE_STATUS_META[status as DeviceStatusType] ??
    ({ label: status, dot: "bg-zinc-400", variant: "outline" } as const);
  return (
    <Badge variant={meta.variant} className="text-[10px] inline-flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </Badge>
  );
}

interface Props {
  milestoneId: string;
  useSearch: SearchHook;
  /** Render content (sensors / detail) of an assignment when dialog opens. */
  renderAssignment: (a: MilestoneAssignmentDetailResType) => React.ReactNode;
  /** Render empty state when no assignment matches filter. */
  emptyState?: React.ReactNode;
  pageSize?: number;
  /**
   * Hide search input + status filter + pagination controls. Useful for
   * config-style tabs where the user only needs the list itself.
   * Default: true (filters shown).
   */
  showFilters?: boolean;
}

export function MilestoneAssignmentsList({
  milestoneId,
  useSearch,
  renderAssignment,
  emptyState,
  pageSize = 5,
  showFilters = true,
}: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>(STATUS_FILTER_ALL);
  const [openAssignmentId, setOpenAssignmentId] = useState<string | null>(null);
  const debouncedSearch = useDebounce(search.trim(), 400);

  const query = useSearch(
    milestoneId,
    {
      page,
      limit: pageSize,
      q: debouncedSearch || undefined,
      status: status === STATUS_FILTER_ALL ? undefined : (status as DeviceStatusType),
    },
    !!milestoneId,
  );

  const body = query.data?.data;
  const items = body?.data ?? [];
  const meta = body?.meta;

  const handleSearchChange = (v: string) => {
    setSearch(v);
    setPage(1);
  };
  const handleStatusChange = (v: string) => {
    setStatus(v);
    setPage(1);
  };

  return (
    <div className="space-y-3">
      {showFilters && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="h-3.5 w-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Tìm theo nhãn (K001, W002...)"
              className="h-8 pl-7 text-xs"
            />
          </div>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={STATUS_FILTER_ALL} className="text-xs">
                Tất cả trạng thái
              </SelectItem>
              {DEVICE_STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s} className="text-xs">
                  {DEVICE_STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {query.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : items.length === 0 ? (
        emptyState ?? (
          <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950/20 px-3 py-2.5 text-sm">
            <XCircle className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="text-amber-700 dark:text-amber-400">
              {debouncedSearch || status !== STATUS_FILTER_ALL
                ? "Không có thiết bị khớp bộ lọc"
                : "Chưa gán thiết bị IoT"}
            </span>
          </div>
        )
      ) : (
        <div className="rounded-md border divide-y">
          {items.map((a) => (
            <button
              key={a.assignmentId}
              type="button"
              onClick={() => setOpenAssignmentId(a.assignmentId)}
              className="w-full flex items-center gap-2 min-w-0 flex-wrap px-3 py-2.5 text-left hover:bg-muted/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              <Cpu className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-semibold shrink-0">{a.device.label}</span>
              <span className="text-xs text-muted-foreground truncate">
                {a.device.deviceName?.trim() || "Thiết bị không xác định"}
              </span>
              <DeviceStatusBadge status={a.device.status} />
              <Badge variant="outline" className="text-[10px] shrink-0">
                {a.sensors.length} cảm biến
              </Badge>
              {a.device.isDeleted && (
                <Badge variant="destructive" className="text-[10px] shrink-0">
                  đã xóa
                </Badge>
              )}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-auto" />
            </button>
          ))}
        </div>
      )}

      {(() => {
        const open = items.find((a) => a.assignmentId === openAssignmentId);
        return (
          <Dialog
            open={!!open}
            onOpenChange={(o) => !o && setOpenAssignmentId(null)}
          >
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              {open && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 flex-wrap text-base">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">{open.device.label}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {open.device.deviceName?.trim() || "Thiết bị không xác định"}
                      </span>
                      <DeviceStatusBadge status={open.device.status} />
                      <Badge variant="outline" className="text-[10px]">
                        {open.sensors.length} cảm biến
                      </Badge>
                      {open.device.isDeleted && (
                        <Badge variant="destructive" className="text-[10px]">
                          đã xóa
                        </Badge>
                      )}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="pt-2">{renderAssignment(open)}</div>
                </>
              )}
            </DialogContent>
          </Dialog>
        );
      })()}

      {showFilters && meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-muted-foreground">
            Trang {meta.page}/{meta.totalPages} · {meta.totalItems} thiết bị
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={!meta.hasPreviousPage}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              disabled={!meta.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
