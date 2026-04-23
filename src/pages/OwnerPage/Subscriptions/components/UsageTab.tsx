import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { formatDateTimeVi } from "@/lib/format";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useSubscriptionUsageLedger } from "@/queries/useSubscription";
import type { UsageLedgerQueryType } from "@/schemaValidatation/subscription";
import { Activity } from "lucide-react";
import { useState } from "react";

interface UsageTabProps {
  subscriptionId: string;
  enabled: boolean;
  featureCodes: string[];
}

function UsageTab({ subscriptionId, enabled, featureCodes }: UsageTabProps) {
  const [query, setQuery] = useState<UsageLedgerQueryType>({
    page: 1,
    limit: 10,
    search: undefined,
    featureCode: undefined,
  });

  const usageQuery = useSubscriptionUsageLedger(subscriptionId, query, enabled);

  const meta = usageQuery.data?.data?.meta;
  const rows = usageQuery.data?.data?.data ?? [];

  return (
    <Card>
      <CardHeader className="gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Lịch sử sử dụng</CardTitle>
          <CardDescription>
            Theo dõi biến động tiêu thụ theo từng tính năng.
          </CardDescription>
        </div>
        <Select
          value={query.featureCode ?? "ALL"}
          onValueChange={(value) =>
            setQuery((prev) => ({
              ...prev,
              page: 1,
              featureCode: value === "ALL" ? undefined : value,
            }))
          }
        >
          <SelectTrigger className="w-full md:w-60">
            <SelectValue placeholder="Lọc theo tính năng" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả tính năng</SelectItem>
            {featureCodes.map((code) => (
              <SelectItem
                key={code}
                value={code}
              >
                {code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageQuery.isLoading ? (
          <TableSkeleton />
        ) : usageQuery.isError ? (
          <ErrorState
            message={getApiErrorMessageVi(
              usageQuery.error,
              "Không thể tải lịch sử sử dụng.",
            )}
            onRetry={() => usageQuery.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Activity}
            title="Chưa có dữ liệu sử dụng"
            description="Khi bạn bắt đầu sử dụng các tính năng, biến động sẽ xuất hiện ở đây."
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tính năng</TableHead>
                    <TableHead>Biến động</TableHead>
                    <TableHead>Ngữ cảnh</TableHead>
                    <TableHead>Ghi chú</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium">
                        {row.featureCode}
                      </TableCell>
                      <TableCell
                        className={
                          row.delta < 0
                            ? "text-red-600"
                            : "text-emerald-600"
                        }
                      >
                        {row.delta > 0 ? `+${row.delta}` : row.delta}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {row.contextEntity ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.note ?? "-"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTimeVi(row.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {meta && meta.totalPages > 1 && (
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Trang {meta.page}/{meta.totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasPreviousPage}
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
                    disabled={!meta.hasNextPage}
                    onClick={() =>
                      setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                    }
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default UsageTab;
