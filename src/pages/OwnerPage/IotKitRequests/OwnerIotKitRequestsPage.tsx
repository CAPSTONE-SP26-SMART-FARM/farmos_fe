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
  KitRequestDeadlineCell,
  KitRequestScheduleCell,
} from "@/components/iot-kit-request/KitRequestSlaCell";
import {
  OPEN_KIT_REQUEST_STATUSES,
  TERMINAL_KIT_REQUEST_STATUSES,
} from "@/constants/iotKitRequestLabel";
import {
  useMyKitRequestCount,
  useMyKitRequests,
} from "@/queries/useIotKitRequest";
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

  // Phân trang server-side thật: BE nhận `statuses` (tập status của tab) nên
  // mỗi trang lấy đúng PAGE_LIMIT record, không gom toàn bộ về client.
  const query = useMyKitRequests({
    page,
    limit: PAGE_LIMIT,
    statuses: TAB_STATUSES[tab],
  });
  const data = query.data?.data;
  const items = data?.data ?? [];
  const meta = data?.meta;

  // KPI đếm chính xác qua meta.totalItems (mỗi thẻ 1 query nhẹ limit:1),
  // không phụ thuộc trang đang xem.
  const startOfMonthISO = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }, []);

  const needsResponseCount = useMyKitRequestCount({
    direction: "ADMIN_TO_OWNER",
    type: "INSTALL_SCHEDULE",
    status: "pending",
  });
  const inProgressCount = useMyKitRequestCount({ status: "in_progress" });
  const scheduledCount = useMyKitRequestCount({ status: "accepted" });
  const closedThisMonthCount = useMyKitRequestCount({
    statuses: TERMINAL_KIT_REQUEST_STATUSES,
    updatedFrom: startOfMonthISO,
  });

  const kpi = {
    needsResponse: needsResponseCount.data ?? 0,
    inProgress: inProgressCount.data ?? 0,
    scheduled: scheduledCount.data ?? 0,
    closedThisMonth: closedThisMonthCount.data ?? 0,
  };

  const columns: ColumnDef<KitRequestResType>[] = useMemo(() => {
    const base: ColumnDef<KitRequestResType>[] = [
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
    ];

    if (tab === "open") {
      base.push(
        {
          id: "slaDeadline",
          header: "Hạn chót",
          cell: ({ row }) => (
            <KitRequestDeadlineCell
              status={row.original.status}
              slaDeadline={row.original.slaDeadline}
              metadata={row.original.metadata}
            />
          ),
        },
        {
          id: "scheduledAt",
          header: "Lịch hẹn",
          cell: ({ row }) => (
            <KitRequestScheduleCell
              type={row.original.type}
              scheduledAt={row.original.scheduledAt}
            />
          ),
        },
      );
    }

    if (tab === "closed") {
      base.push({
        id: "scheduleInfo",
        header: "Lịch lắp / hẹn",
        cell: ({ row }) => {
          const { scheduledAt, completedAt, createdAt, type } = row.original;
          // INSTALL_SCHEDULE không có scheduledAt (auto-create, admin lắp ngay)
          // → show completedAt (đã lắp xong) hoặc createdAt (chưa lắp xong)
          // SWAP / RECOVERY → scheduledAt là lịch admin hẹn ghé
          let label: string;
          let date: string | null;
          if (type === "INSTALL_SCHEDULE") {
            if (completedAt) {
              label = "Đã lắp";
              date = completedAt;
            } else {
              label = "Tạo yêu cầu";
              date = createdAt;
            }
          } else if (type === "RECOVERY_SCHEDULE") {
            label = completedAt ? "Đã thu hồi" : "Hẹn thu hồi";
            date = completedAt ?? scheduledAt;
          } else {
            // FAULT_REPORT (swap flow)
            label = completedAt ? "Đã thay" : "Hẹn thay";
            date = completedAt ?? scheduledAt;
          }
          if (!date) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          return (
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">
                {format(new Date(date), "HH:mm dd/MM/yyyy", { locale: vi })}
              </span>
            </div>
          );
        },
      });
    }

    return base;
  }, [tab]);

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
          ) : !query.isLoading && items.length === 0 ? (
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
              data={items}
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

          {meta && meta.totalPages > 1 && (
            <ProPagination
              totalPages={meta.totalPages}
              currentPage={meta.page}
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
