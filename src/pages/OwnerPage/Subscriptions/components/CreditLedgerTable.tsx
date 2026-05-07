import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import TableSkeleton from "@/components/common/TableSkeleton";
import { Badge } from "@/components/ui/badge";
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
import { formatCreditLabel } from "@/constants/creditLabel";
import { formatDateTimeVi } from "@/lib/format";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import { useOwnerCreditHistory } from "@/queries/useCredit";
import type {
  CreditHistoryQueryType,
  CreditLedgerType,
} from "@/schemaValidatation/credit";
import { History } from "lucide-react";
import { useMemo, useState } from "react";

const TRANSACTION_TYPE_LABEL: Record<CreditLedgerType["transactionType"], string> =
  {
    PURCHASE: "Mua",
    SUBSCRIPTION_GRANT: "Cấp từ gói",
    USAGE: "Sử dụng",
    EXPIRED: "Hết hạn",
    ADJUSTMENT: "Điều chỉnh",
  };

interface CreditLedgerTableProps {
  creditTypes: string[];
}

function CreditLedgerTable({ creditTypes }: CreditLedgerTableProps) {
  const [creditType, setCreditType] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const query = useMemo<CreditHistoryQueryType>(
    () => ({
      page,
      limit: 10,
      search: undefined,
      creditType: creditType === "ALL" ? undefined : creditType,
    }),
    [page, creditType],
  );

  const historyQuery = useOwnerCreditHistory(query, true);
  const meta = historyQuery.data?.data?.meta;
  const rows = historyQuery.data?.data?.data ?? [];

  return (
    <Card>
      <CardHeader className="gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <CardTitle>Lịch sử biến động</CardTitle>
          <CardDescription>
            Theo dõi tất cả giao dịch credit trên tài khoản của bạn.
          </CardDescription>
        </div>
        <Select
          value={creditType}
          onValueChange={(value) => {
            setCreditType(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-full md:w-60">
            <SelectValue placeholder="Lọc theo loại credit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tất cả loại credit</SelectItem>
            {creditTypes.map((t) => (
              <SelectItem
                key={t}
                value={t}
              >
                {formatCreditLabel(t)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="space-y-4">
        {historyQuery.isLoading ? (
          <TableSkeleton />
        ) : historyQuery.isError ? (
          <ErrorState
            message={getApiErrorMessageVi(
              historyQuery.error,
              "Không thể tải lịch sử.",
            )}
            onRetry={() => historyQuery.refetch()}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={History}
            title="Chưa có lịch sử"
            description={
              creditType !== "ALL"
                ? "Thử đổi bộ lọc để xem các loại credit khác."
                : "Khi có biến động credit, bạn sẽ thấy ở đây."
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loại giao dịch</TableHead>
                    <TableHead>Loại credit</TableHead>
                    <TableHead>Biến động</TableHead>
                    <TableHead>Số dư sau</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead>Thời gian</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Badge variant="outline">
                          {TRANSACTION_TYPE_LABEL[row.transactionType]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatCreditLabel(row.creditType)}
                      </TableCell>
                      <TableCell
                        className={cn(
                          "font-medium",
                          row.amount < 0 ? "text-red-600" : "text-emerald-600",
                        )}
                      >
                        {row.amount > 0 ? `+${row.amount}` : row.amount}
                      </TableCell>
                      <TableCell>
                        {row.balanceAfter.toLocaleString("vi-VN")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.description ?? "-"}
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
                  Trang {meta.page}/{meta.totalPages} · Tổng {meta.totalItems}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasPreviousPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Trang trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!meta.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
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

export default CreditLedgerTable;
