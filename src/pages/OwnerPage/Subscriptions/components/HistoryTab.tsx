import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { getSubscriptionStatusBadgeVariant } from "@/lib/utils";
import { useOwnerSubscriptionHistory } from "@/queries/useSubscription";
import type {
  ListSubscriptionsQueryType,
  SubscriptionStatusType,
} from "@/schemaValidatation/subscription";

const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatusType, string> = {
  PENDING: "Chờ kích hoạt",
  ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm ngưng",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const STATUS_OPTIONS: Array<{ value: "ALL" | SubscriptionStatusType; label: string }> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ kích hoạt" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "SUSPENDED", label: "Tạm ngưng" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Hết hạn" },
];

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("vi-VN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

type SubscriptionRow = {
  id: string;
  plan?: { name?: string | null; code?: string | null } | null;
  status: SubscriptionStatusType;
  startedAt?: string | null;
  expiresAt?: string | null;
  autoRenew: boolean;
};

function HistoryTab() {
  const [query, setQuery] = useState<ListSubscriptionsQueryType>({
    page: 1,
    limit: 10,
    search: undefined,
    status: undefined,
    ownerSearch: undefined,
  });

  const subscriptionHistoryQuery = useOwnerSubscriptionHistory(query, true);
  const subscriptions = (subscriptionHistoryQuery.data?.data?.data ??
    []) as SubscriptionRow[];
  const meta = subscriptionHistoryQuery.data?.data?.meta;

  const columns = useMemo<ColumnDef<SubscriptionRow>[]>(
    () => [
      {
        id: "plan",
        header: "Gói",
        cell: ({ row }) => (
          <div className="space-y-1">
            <p className="font-medium">
              {row.original.plan?.name ?? "Gói không xác định"}
            </p>
            <p className="text-xs text-muted-foreground">
              {row.original.plan?.code ?? "-"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <Badge variant={getSubscriptionStatusBadgeVariant(row.original.status)}>
            {SUBSCRIPTION_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "startedAt",
        header: "Bắt đầu",
        cell: ({ row }) => formatDateTime(row.original.startedAt),
      },
      {
        accessorKey: "expiresAt",
        header: "Hết hạn",
        cell: ({ row }) => formatDateTime(row.original.expiresAt),
      },
      {
        accessorKey: "autoRenew",
        header: "Tự động gia hạn",
        cell: ({ row }) => (row.original.autoRenew ? "Bật" : "Tắt"),
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="grid gap-3 md:grid-cols-2 pt-6">
          <Input
            placeholder="Tìm theo mã gói hoặc tên gói..."
            value={query.search ?? ""}
            onChange={(event) =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                search: event.target.value || undefined,
              }))
            }
          />
          <Select
            value={query.status ?? "ALL"}
            onValueChange={(value) =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                status: value === "ALL" ? undefined : (value as SubscriptionStatusType),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách đăng ký</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <DataTable
            columns={columns}
            data={subscriptions}
            isLoading={subscriptionHistoryQuery.isLoading}
            emptyText="Bạn chưa có lịch sử đăng ký nào."
          />

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {meta?.page ?? 1}/{meta?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta?.hasPreviousPage}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))
                }
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta?.hasNextPage}
                onClick={() => setQuery((prev) => ({ ...prev, page: prev.page + 1 }))}
              >
                Trang sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default HistoryTab;
