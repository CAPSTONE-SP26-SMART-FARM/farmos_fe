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
import { useMyKitRequests } from "@/queries/useIotKitRequest";
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
import { OwnerKitRequestDetailDialog } from "./_components/OwnerKitRequestDetailDialog";

/**
 * Trang "Yêu cầu kit IoT" cho owner.
 *
 * UX layout (rule 14, Pattern B — KPI + List):
 *   - 4 KPI: chờ tôi phản hồi / đang xử lý / đã chốt lịch / đã đóng tháng này
 *   - 2 tab theo trạng thái: "Đang mở" / "Đã xử lý"
 *   - Bảng + ProPagination + dialog cho chi tiết
 *
 * State URL-driven (rule 10):
 *   - ?tab=open|closed
 *   - ?page=N
 *   - ?requestId=<id> (deep link mở dialog)
 *
 * Realtime: invalidate cache đã được wire ở `useRealtimeEvents` qua 2 event
 * `iot-kit-request.created` / `.updated` — page không tự subscribe.
 */

const PAGE_LIMIT = 10;

type TabKey = "open" | "closed";

const TAB_STATUSES: Record<TabKey, KitRequestStatusType[]> = {
  open: OPEN_KIT_REQUEST_STATUSES,
  closed: TERMINAL_KIT_REQUEST_STATUSES,
};

export default function OwnerIotKitRequestsPage() {
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

  // BE chấp nhận 1 `status` filter; trên FE 2 tab ánh xạ tới tập hợp status.
  // → Fetch tối đa 100 không kèm status, filter + paginate client-side để
  // tab "Đã xử lý" không bị các request đang mở chiếm hết slot page đầu.
  // Owner thường có < 100 request → đủ; cần aggregate endpoint nếu vượt.
  const query = useMyKitRequests({ page: 1, limit: 100 });
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

  // KPI tính trên page hiện tại — đủ với pagination size 10 vì owner không
  // có quá nhiều request. Có thể đổi sang aggregate endpoint khi cần.
  const kpi = useMemo(() => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    let needsResponse = 0;
    let inProgress = 0;
    let scheduled = 0;
    let closedThisMonth = 0;

    for (const r of items) {
      if (
        r.direction === "ADMIN_TO_OWNER" &&
        r.type === "INSTALL_SCHEDULE" &&
        r.status === "pending"
      ) {
        needsResponse += 1;
      }
      if (r.status === "in_progress") inProgress += 1;
      if (r.status === "accepted") scheduled += 1;
      if (
        TERMINAL_KIT_REQUEST_STATUSES.includes(r.status) &&
        new Date(r.updatedAt) >= startOfMonth
      ) {
        closedThisMonth += 1;
      }
    }

    return { needsResponse, inProgress, scheduled, closedThisMonth };
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
        <Badge className="mb-2">Cổng chủ trang trại</Badge>
        <h1 className="text-2xl font-bold">Yêu cầu hỗ trợ thiết bị</h1>
        <p className="text-muted-foreground">
          Theo dõi yêu cầu hỗ trợ thiết bị: báo lỗi, lịch lắp đặt, thay thế và thu hồi.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Chờ bạn duyệt"
          value={kpi.needsResponse}
          tone={kpi.needsResponse > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Đang xử lý"
          value={kpi.inProgress}
        />
        <KpiCard
          label="Đã hẹn lịch"
          value={kpi.scheduled}
        />
        <KpiCard
          label="Xong tháng này"
          value={kpi.closedThisMonth}
          tone="success"
        />
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
                  ? "Hiện không có yêu cầu nào đang mở. Bạn có thể báo lỗi từ trang chi tiết thiết bị IoT."
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

      <OwnerKitRequestDetailDialog
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
