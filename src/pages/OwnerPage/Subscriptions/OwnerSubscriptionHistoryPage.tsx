import { useState } from "react";
import { useNavigate } from "react-router";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const subscriptions = subscriptionHistoryQuery.data?.data?.data ?? [];
  const meta = subscriptionHistoryQuery.data?.data?.meta;

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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gói</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Bắt đầu</TableHead>
                <TableHead>Hết hạn</TableHead>
                <TableHead>Tự động gia hạn</TableHead>
                <TableHead className="text-right">Chi tiết</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptionHistoryQuery.isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Đang tải lịch sử đăng ký...
                  </TableCell>
                </TableRow>
              )}
              {!subscriptionHistoryQuery.isLoading &&
                subscriptions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Bạn chưa có lịch sử đăng ký nào.
                    </TableCell>
                  </TableRow>
                )}
              {subscriptions.map((subscription) => (
                <TableRow key={subscription.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <p className="font-medium">
                        {subscription.plan?.name ?? "Gói không xác định"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {subscription.plan?.code ?? "-"}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getSubscriptionStatusBadgeVariant(
                        subscription.status,
                      )}
                    >
                      {SUBSCRIPTION_STATUS_LABEL[subscription.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDateTime(subscription.startedAt)}
                  </TableCell>
                  <TableCell>
                    {formatDateTime(subscription.expiresAt)}
                  </TableCell>
                  <TableCell>
                    {subscription.autoRenew ? "Bật" : "Tắt"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigate(
                          `/dashboard/owner/subscriptions/${subscription.id}`,
                        )
                      }
                    >
                      Mở
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

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
