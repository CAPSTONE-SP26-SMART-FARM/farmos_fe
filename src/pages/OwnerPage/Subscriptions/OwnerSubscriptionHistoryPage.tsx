import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable } from "@/components/common/DataTable";
import { formatDateTimeVi } from "@/lib/format";
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

const STATUS_OPTIONS: Array<{
  value: "ALL" | SubscriptionStatusType;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ kích hoạt" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "SUSPENDED", label: "Tạm ngưng" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Hết hạn" },
];

type SubscriptionRow = {
  id: string;
  plan?: { name?: string | null; code?: string | null } | null;
  status: SubscriptionStatusType;
  startedAt?: string | null;
  expiresAt?: string | null;
  autoRenew: boolean;
};

function OwnerSubscriptionHistoryPage() {
  const navigate = useNavigate();
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
          <Badge
            variant={getSubscriptionStatusBadgeVariant(row.original.status)}
          >
            {SUBSCRIPTION_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "startedAt",
        header: "Bắt đầu",
        cell: ({ row }) => formatDateTimeVi(row.original.startedAt),
      },
      {
        accessorKey: "expiresAt",
        header: "Hết hạn",
        cell: ({ row }) => formatDateTimeVi(row.original.expiresAt),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử gói đăng ký</CardTitle>
          <CardDescription>
            Theo dõi toàn bộ vòng đời đăng ký để kiểm soát gia hạn và thanh
            toán.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
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
                status:
                  value === "ALL"
                    ? undefined
                    : (value as SubscriptionStatusType),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                >
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
            actions={[
              {
                key: "view",
                label: "Xem chi tiết",
                icon: Eye,
                onSelect: (subscription) =>
                  navigate(`/dashboard/owner/subscriptions/${subscription.id}`),
              },
            ]}
            onRowClick={(subscription) =>
              navigate(`/dashboard/owner/subscriptions/${subscription.id}`)
            }
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
                  setQuery((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
              >
                Trang trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta?.hasNextPage}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                }
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

export default OwnerSubscriptionHistoryPage;
