import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "@/components/common/DataTable";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import ProPagination from "@/components/common/pro-pagination";
import {
  KitRequestStatusBadge,
  KitRequestTypeBadge,
} from "@/components/iot-kit-request/KitRequestBadges";
import {
  OPEN_KIT_REQUEST_STATUSES,
  TERMINAL_KIT_REQUEST_STATUSES,
} from "@/constants/iotKitRequestLabel";
import { useManagerKitRequestList } from "@/queries/useIotKitRequest";
import type {
  KitRequestResType,
  KitRequestStatusType,
} from "@/schemaValidatation/iotKitRequest";
import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Eye, Wrench } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { ManagerKitRequestDetailDialog } from "./_components/ManagerKitRequestDetailDialog";

/**
 * Trang "Yêu cầu hỗ trợ thiết bị" cho manager — chế độ chỉ xem.
 *
 * Manager thấy toàn bộ request thuộc các farm mình phụ trách (qua ZoneManager)
 * để theo dõi tiến độ xử lý: ai claim, đã hẹn lịch chưa, đã xong chưa. Mọi
 * action (claim/schedule/cancel) là việc của admin/owner — manager không có
 * nút thao tác nào trên trang này.
 *
 * UX layout (rule 14, Pattern B — KPI + List):
 *   - 4 KPI tổng quan trạng thái xử lý
 *   - 2 tab: "Đang mở" / "Đã xử lý"
 *   - Bảng + ProPagination + dialog chi tiết read-only
 *
 * State URL-driven (rule 10):
 *   - ?tab=open|closed
 *   - ?page=N
 *   - ?requestId=<id> (deep link mở dialog)
 *
 * Realtime: invalidate cache đã được wire ở `useRealtimeEvents` qua event
 * `iot-kit-request.created` / `.updated` (prefix `iot-kit-requests`).
 */

const PAGE_LIMIT = 10;

type TabKey = "open" | "closed";

const TAB_STATUSES: Record<TabKey, KitRequestStatusType[]> = {
  open: OPEN_KIT_REQUEST_STATUSES,
  closed: TERMINAL_KIT_REQUEST_STATUSES,
};

export default function ManagerIotKitRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = (searchParams.get("tab") as TabKey) ?? "open";
  const page = Number(searchParams.get("page") ?? "1");
  const requestId = searchParams.get("requestId");

  const updateParams = (mutations: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(mutations)) {
          if (v === null) next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true },
    );
  };

  // Fetch tối đa 100 không kèm status, filter + paginate client-side để 2 tab
  // không chiếm slot page của nhau (giống pattern owner). Farm manager thường
  // có < 100 request open → đủ; cần aggregate endpoint khi vượt.
  const query = useManagerKitRequestList({ page: 1, limit: 100 });
  const data = query.data?.data;
  const items = data?.data ?? [];

  const tabItems = useMemo(
    () => items.filter((r) => TAB_STATUSES[tab].includes(r.status)),
    [items, tab],
  );

  const totalPages = Math.max(1, Math.ceil(tabItems.length / PAGE_LIMIT));
  const safePage = Math.min(page, totalPages);
  const pagedItems = useMemo(
    () => tabItems.slice((safePage - 1) * PAGE_LIMIT, safePage * PAGE_LIMIT),
    [tabItems, safePage],
  );

  const kpi = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let pending = 0;
    let inProgress = 0;
    let scheduled = 0;
    let closedThisMonth = 0;

    for (const r of items) {
      if (r.status === "pending") pending += 1;
      if (r.status === "in_progress") inProgress += 1;
      if (r.status === "accepted") scheduled += 1;
      if (
        TERMINAL_KIT_REQUEST_STATUSES.includes(r.status) &&
        new Date(r.updatedAt) >= startOfMonth
      ) {
        closedThisMonth += 1;
      }
    }

    return { pending, inProgress, scheduled, closedThisMonth };
  }, [items]);

  const columns: ColumnDef<KitRequestResType>[] = [
    {
      accessorKey: "requestNumber",
      header: "Mã",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.requestNumber}</span>
      ),
    },
    {
      accessorKey: "type",
      header: "Loại",
      cell: ({ row }) => <KitRequestTypeBadge type={row.original.type} />,
    },
    {
      accessorKey: "title",
      header: "Tiêu đề",
      cell: ({ row }) => (
        <span className="block max-w-72 truncate font-medium">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <KitRequestStatusBadge status={row.original.status} />,
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.updatedAt), "dd/MM HH:mm", {
            locale: vi,
          })}
        </span>
      ),
    },
  ];

  const buildHref = (next: number | undefined | null) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set("page", String(next));
    else params.delete("page");
    return { search: params.toString() };
  };

  const openDetail = (id: string) => updateParams({ requestId: id });
  const closeDetail = () => updateParams({ requestId: null });
  const switchTab = (next: TabKey) =>
    updateParams({ tab: next, page: "1" });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <Badge className="mb-2">Cổng quản lý vùng</Badge>
        <h1 className="text-2xl font-bold">Yêu cầu hỗ trợ thiết bị</h1>
        <p className="text-muted-foreground">
          Theo dõi tiến độ xử lý các yêu cầu lắp đặt, báo lỗi, thay thế và thu hồi
          thiết bị thuộc các vùng bạn phụ trách.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Chờ tiếp nhận" value={kpi.pending} tone={kpi.pending > 0 ? "warning" : "default"} />
        <KpiCard label="Đang xử lý" value={kpi.inProgress} />
        <KpiCard label="Đã hẹn lịch" value={kpi.scheduled} />
        <KpiCard label="Xong tháng này" value={kpi.closedThisMonth} tone="success" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-4 w-4" />
            Danh sách yêu cầu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs
            value={tab}
            onValueChange={(v) => switchTab(v as TabKey)}
          >
            <TabsList>
              <TabsTrigger value="open">Đang mở</TabsTrigger>
              <TabsTrigger value="closed">Đã xử lý</TabsTrigger>
            </TabsList>
          </Tabs>

          {query.isError ? (
            <ErrorState
              message="Không tải được danh sách yêu cầu hỗ trợ."
              onRetry={() => query.refetch()}
            />
          ) : !query.isLoading && tabItems.length === 0 ? (
            <EmptyState
              icon={Wrench}
              title="Chưa có yêu cầu nào"
              description={
                tab === "open"
                  ? "Hiện không có yêu cầu nào đang mở trong các vùng bạn phụ trách."
                  : "Chưa có yêu cầu nào đã kết thúc."
              }
            />
          ) : (
            <DataTable
              columns={columns}
              data={pagedItems}
              isLoading={query.isLoading}
              actions={[
                {
                  key: "view",
                  label: "Xem chi tiết",
                  icon: Eye,
                  onSelect: (r) => openDetail(r.id),
                },
              ]}
              onRowClick={(r) => openDetail(r.id)}
              emptyText="Không có yêu cầu phù hợp."
            />
          )}

          {totalPages > 1 && (
            <ProPagination
              totalPages={totalPages}
              currentPage={safePage}
              buildHref={buildHref}
            />
          )}
        </CardContent>
      </Card>

      <ManagerKitRequestDetailDialog
        requestId={requestId}
        onClose={closeDetail}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "success";
}) {
  const valueClass =
    tone === "warning"
      ? "text-amber-600 dark:text-amber-400"
      : tone === "success"
        ? "text-emerald-600 dark:text-emerald-400"
        : "text-foreground";
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className={`mt-2 text-2xl font-bold ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
