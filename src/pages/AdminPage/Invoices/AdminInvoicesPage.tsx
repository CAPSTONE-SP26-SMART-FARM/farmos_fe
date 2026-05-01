import { useState } from "react";
import { useNavigate } from "react-router";
import InvoiceStatusBadge, {
  type InvoiceStatus,
} from "@/components/common/InvoiceStatusBadge";
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
import { useAdminInvoices } from "@/queries/useInvoice";
import type {
  InvoiceAdminListItemType,
  InvoiceLatestTransactionSummaryType,
  InvoiceReferenceType,
  InvoiceStatusType,
  ListInvoicesQueryType,
} from "@/schemaValidatation/invoice";
import { formatCurrencyVnd, formatDateVi } from "@/lib/format";

const COLUMN_COUNT = 9;

const STATUS_OPTIONS: Array<{
  value: "ALL" | InvoiceStatusType;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "DRAFT", label: "Nháp" },
  { value: "OPEN", label: "Chờ thanh toán" },
  { value: "PAID", label: "Đã thanh toán" },
  { value: "VOID", label: "Đã hủy" },
  { value: "UNCOLLECTIBLE", label: "Không thu được" },
];

const REFERENCE_TYPE_OPTIONS: Array<{
  value: "ALL" | InvoiceReferenceType;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả loại" },
  { value: "SUBSCRIPTION", label: "Subscription" },
  { value: "SERVICE_PACKAGE", label: "Service Package" },
  { value: "IOT_KIT_ORDER", label: "IoT Kit Order" },
];

const REFERENCE_TYPE_LABEL: Record<InvoiceReferenceType, string> = {
  SUBSCRIPTION: "Subscription",
  SERVICE_PACKAGE: "Gói dịch vụ",
  IOT_KIT_ORDER: "IoT Kit",
};

function LatestTransactionCell({
  tx,
}: {
  tx: InvoiceLatestTransactionSummaryType | null;
}) {
  if (!tx) return <span className="text-muted-foreground">—</span>;

  const variant: "default" | "secondary" | "destructive" =
    tx.status === "SUCCESS"
      ? "default"
      : tx.status === "FAILED"
        ? "destructive"
        : "secondary";

  return (
    <div className="flex flex-col gap-0.5">
      <Badge
        variant={variant}
        className="w-fit"
      >
        {tx.status}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {tx.gateway} · {formatDateVi(tx.createdAt)}
      </span>
    </div>
  );
}

function DueDateCell({
  invoice,
  nowMs,
}: {
  invoice: InvoiceAdminListItemType;
  nowMs: number;
}) {
  if (!invoice.dueDate) return <span className="text-muted-foreground">—</span>;

  const due = new Date(invoice.dueDate);
  const isOverdue =
    !Number.isNaN(due.getTime()) &&
    due.getTime() < nowMs &&
    invoice.status !== "PAID" &&
    invoice.status !== "VOID";

  return (
    <span className={isOverdue ? "text-destructive font-medium" : undefined}>
      {formatDateVi(invoice.dueDate)}
    </span>
  );
}

function AdminInvoicesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<ListInvoicesQueryType>({
    page: 1,
    limit: 10,
    search: undefined,
    status: undefined,
    referenceType: undefined,
    referenceId: undefined,
  });
  const [nowMs] = useState(() => Date.now());

  const listInvoicesQuery = useAdminInvoices(query);
  const invoices = listInvoicesQuery.data?.data?.data ?? [];
  const meta = listInvoicesQuery.data?.data?.meta;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <CardTitle>Quản lý hóa đơn</CardTitle>
          <CardDescription>
            Admin có thể xem toàn bộ hóa đơn subscription, gói dịch vụ và đơn
            mua bộ kit IoT — kèm thông tin khách hàng, tham chiếu và tình trạng
            thanh toán mới nhất.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Tìm theo mã hóa đơn..."
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
                  value === "ALL" ? undefined : (value as InvoiceStatusType),
              }))
            }
          >
            <SelectTrigger className="w-full">
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
          <Select
            value={query.referenceType ?? "ALL"}
            onValueChange={(value) =>
              setQuery((prev) => ({
                ...prev,
                page: 1,
                referenceType: value === "ALL" ? undefined : value,
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Lọc loại tham chiếu" />
            </SelectTrigger>
            <SelectContent>
              {REFERENCE_TYPE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã hóa đơn</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Tham chiếu</TableHead>
                  <TableHead>Ngày phát hành</TableHead>
                  <TableHead>Hạn thanh toán</TableHead>
                  <TableHead className="text-right">Tổng tiền</TableHead>
                  <TableHead>Thanh toán gần nhất</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Chi tiết</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listInvoicesQuery.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={COLUMN_COUNT}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Đang tải danh sách hóa đơn...
                    </TableCell>
                  </TableRow>
                )}
                {!listInvoicesQuery.isLoading && listInvoicesQuery.isError && (
                  <TableRow>
                    <TableCell
                      colSpan={COLUMN_COUNT}
                      className="py-6 text-center text-destructive"
                    >
                      Không thể tải danh sách hóa đơn.
                    </TableCell>
                  </TableRow>
                )}
                {!listInvoicesQuery.isLoading &&
                  !listInvoicesQuery.isError &&
                  invoices.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={COLUMN_COUNT}
                        className="py-6 text-center text-muted-foreground"
                      >
                        Không có dữ liệu hóa đơn.
                      </TableCell>
                    </TableRow>
                  )}
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">
                          {invoice.owner.fullName ?? "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {invoice.owner.email ??
                            invoice.owner.phone ??
                            invoice.owner.id.slice(0, 8)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <Badge
                          variant="outline"
                          className="w-fit"
                        >
                          {invoice.reference
                            ? REFERENCE_TYPE_LABEL[invoice.reference.type]
                            : invoice.referenceType}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {invoice.reference?.label ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{formatDateVi(invoice.issueDate)}</TableCell>
                    <TableCell>
                      <DueDateCell
                        invoice={invoice}
                        nowMs={nowMs}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-medium">
                          {formatCurrencyVnd(invoice.totalAmount)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <LatestTransactionCell tx={invoice.latestTransaction} />
                    </TableCell>
                    <TableCell>
                      <InvoiceStatusBadge
                        status={invoice.status as InvoiceStatus}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/dashboard/admin/invoices/${invoice.id}`)
                        }
                      >
                        Mở
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {meta?.page ?? 1}/{meta?.totalPages ?? 1} ·{" "}
              {meta?.totalItems ?? 0} hóa đơn
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

export default AdminInvoicesPage;
