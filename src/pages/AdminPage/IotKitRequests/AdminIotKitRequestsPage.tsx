import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useAdminKitRequestList } from "@/queries/useIotKitRequest";
import type {
  KitRequestDirectionType,
  KitRequestResType,
  KitRequestStatusType,
  KitRequestTypeType,
  ListKitRequestsQueryType,
} from "@/schemaValidatation/iotKitRequest";
import { useAuthStore } from "@/stores/authStore";
import type { ColumnDef } from "@tanstack/react-table";
import { ClipboardList, Eye } from "lucide-react";
import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { AdminKitRequestDetailDialog } from "./_components/AdminKitRequestDetailDialog";
import { AdminKitRequestFilterBar } from "./_components/AdminKitRequestFilterBar";

/**
 * Trang admin "Yêu cầu kit IoT" — tổng hợp toàn bộ request OWNER_TO_ADMIN
 * và ADMIN_TO_OWNER, có filter direction/type/status/search.
 *
 * State URL-driven (rule 10):
 *   - ?search=
 *   - ?direction=OWNER_TO_ADMIN | ADMIN_TO_OWNER
 *   - ?type=FAULT_REPORT | INSTALL_SCHEDULE
 *   - ?status=pending | in_progress | accepted | resolved | rejected | cancelled
 *   - ?page=N
 *   - ?requestId=<id>
 *
 * KPI tính trên page hiện tại — owner-side đủ context cho admin daily ops.
 * Để aggregate chính xác hơn, sau này thêm endpoint stats riêng.
 */

const PAGE_LIMIT = 10;

export default function AdminIotKitRequestsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const me = useAuthStore((s) => s.user);

  const page = Number(searchParams.get("page") ?? "1");
  const requestId = searchParams.get("requestId");
  const search = searchParams.get("search") ?? "";
  const direction =
    (searchParams.get("direction") as KitRequestDirectionType | null) ?? null;
  const type = (searchParams.get("type") as KitRequestTypeType | null) ?? null;
  const status =
    (searchParams.get("status") as KitRequestStatusType | null) ?? null;

  const updateParams = (mutations: Record<string, string | null>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(mutations)) {
          if (v === null || v === "") next.delete(k);
          else next.set(k, v);
        }
        return next;
      },
      { replace: true },
    );
  };

  const query: ListKitRequestsQueryType = {
    page,
    limit: PAGE_LIMIT,
    ...(search ? { search } : {}),
    ...(direction ? { direction } : {}),
    ...(type ? { type } : {}),
    ...(status ? { status } : {}),
  };

  const listQuery = useAdminKitRequestList(query);
  const data = listQuery.data?.data;
  const items = data?.data ?? [];
  const meta = data?.meta;

  const kpi = useMemo(() => {
    let pendingClaim = 0;
    let myInProgress = 0;
    let awaitingOwner = 0;
    let resolvedToday = 0;
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    for (const r of items) {
      if (r.status === "pending" && r.type === "FAULT_REPORT") {
        pendingClaim += 1;
      }
      if (r.status === "in_progress" && r.handlerId === me?.id) {
        myInProgress += 1;
      }
      if (r.status === "pending" && r.type === "INSTALL_SCHEDULE") {
        awaitingOwner += 1;
      }
      if (
        r.status === "resolved" &&
        r.resolvedAt &&
        new Date(r.resolvedAt) >= startOfDay
      ) {
        resolvedToday += 1;
      }
    }
    return { pendingClaim, myInProgress, awaitingOwner, resolvedToday };
  }, [items, me?.id]);

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
        <span className="block max-w-64 truncate font-medium">
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
  ];

  const buildHref = (next: number | undefined | null) => {
    const params = new URLSearchParams(searchParams);
    if (next) params.set("page", String(next));
    else params.delete("page");
    return { search: params.toString() };
  };

  return (
    <div className="space-y-6 p-4 md:p-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <Badge className="mb-2">Quản trị hệ thống</Badge>
        <h1 className="text-2xl font-bold">Yêu cầu hỗ trợ thiết bị</h1>
        <p className="text-muted-foreground">
          Tiếp nhận báo lỗi, lên lịch lắp đặt, thay thế và thu hồi thiết bị cho chủ trang trại.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Chờ nhận"
          value={kpi.pendingClaim}
          tone={kpi.pendingClaim > 0 ? "warning" : "default"}
        />
        <KpiCard
          label="Bạn đang xử lý"
          value={kpi.myInProgress}
        />
        <KpiCard
          label="Chờ chủ duyệt lịch"
          value={kpi.awaitingOwner}
        />
        <KpiCard
          label="Xong hôm nay"
          value={kpi.resolvedToday}
          tone="success"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Danh sách yêu cầu
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <AdminKitRequestFilterBar
            search={search}
            direction={direction}
            type={type}
            status={status}
            onChange={(key, value) =>
              updateParams({ [key]: value ?? null, page: "1" })
            }
            onReset={() =>
              updateParams({
                search: null,
                direction: null,
                type: null,
                status: null,
                page: "1",
              })
            }
          />

          {listQuery.isError ? (
            <ErrorState
              message="Không tải được danh sách yêu cầu hỗ trợ."
              onRetry={() => listQuery.refetch()}
            />
          ) : !listQuery.isLoading && items.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Không có yêu cầu phù hợp"
              description="Thử thay đổi bộ lọc để xem thêm kết quả."
            />
          ) : (
            <DataTable
              columns={columns}
              data={items}
              isLoading={listQuery.isLoading}
              actions={[
                {
                  key: "view",
                  label: "Xem chi tiết",
                  icon: Eye,
                  onSelect: (r) => updateParams({ requestId: r.id }),
                },
              ]}
              onRowClick={(r) => updateParams({ requestId: r.id })}
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

      <AdminKitRequestDetailDialog
        requestId={requestId}
        onClose={() => updateParams({ requestId: null })}
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
