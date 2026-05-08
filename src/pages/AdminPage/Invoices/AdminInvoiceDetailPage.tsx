import { useNavigate, useParams } from "react-router";
import {
  ArrowLeft,
  CalendarClock,
  Coins,
  CreditCard,
  Mail,
  Phone,
  Receipt,
  RefreshCcw,
} from "lucide-react";

import KpiCard from "@/components/common/KpiCard";
import InvoiceStatusBadge, {
  type InvoiceStatus,
} from "@/components/common/InvoiceStatusBadge";
import TransactionStatusBadge, {
  type TransactionStatus,
} from "@/components/common/TransactionStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useInvoiceDetail } from "@/queries/useInvoice";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";
import {
  formatCurrencyVnd,
  formatDateTimeVi,
  formatDateVi,
} from "@/lib/format";
import type {
  InvoiceDetailResType,
  InvoiceOwnerSummaryType,
  InvoicePaymentSummaryType,
  InvoiceReferenceSummaryType,
  TransactionType,
} from "@/schemaValidatation/invoice";

const REFERENCE_TYPE_LABEL: Record<
  InvoiceReferenceSummaryType["type"],
  string
> = {
  SUBSCRIPTION: "Subscription",
  SERVICE_PACKAGE: "Gói dịch vụ",
  IOT_KIT_ORDER: "Đơn IoT Kit",
};

function getInitials(name: string | null | undefined, fallback = "?"): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id;
}

// ============================================================
// Sub-components
// ============================================================

function PageHeader({
  invoice,
  onBack,
  onRefresh,
  isRefreshing,
}: {
  invoice: InvoiceDetailResType | undefined;
  onBack: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-start gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={onBack}
          aria-label="Quay lại"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Hóa đơn
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">
              {invoice ? invoice.invoiceNumber : "—"}
            </h1>
            {invoice && (
              <InvoiceStatusBadge status={invoice.status as InvoiceStatus} />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            ID: {invoice ? invoice.id : "—"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          <RefreshCcw
            className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Tải lại
        </Button>
      </div>
    </div>
  );
}

function FinancialSummary({
  invoice,
  summary,
}: {
  invoice: InvoiceDetailResType;
  summary: InvoicePaymentSummaryType;
}) {
  const isPaid = invoice.status === "PAID";
  const isVoid = invoice.status === "VOID";
  const outstandingTone: "success" | "danger" | "default" = isPaid
    ? "success"
    : isVoid
      ? "default"
      : summary.outstandingAmount > 0
        ? "danger"
        : "success";

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        icon={Receipt}
        label="Tổng hóa đơn"
        value={formatCurrencyVnd(invoice.totalAmount)}
        hint={
          invoice.taxAmount > 0
            ? `Thuế ${formatCurrencyVnd(invoice.taxAmount)}`
            : "Đã bao gồm thuế"
        }
      />
      <KpiCard
        icon={Coins}
        label="Đã thanh toán"
        value={formatCurrencyVnd(summary.totalPaid)}
        tone={summary.totalPaid > 0 ? "success" : "default"}
        hint={
          summary.refundedAmount > 0
            ? `Hoàn ${formatCurrencyVnd(summary.refundedAmount)}`
            : `${summary.transactionCount} giao dịch`
        }
      />
      <KpiCard
        icon={CreditCard}
        label="Còn phải thu"
        value={isVoid ? "—" : formatCurrencyVnd(summary.outstandingAmount)}
        tone={outstandingTone}
        hint={
          isPaid
            ? "Đã thanh toán đủ"
            : isVoid
              ? "Hóa đơn đã hủy"
              : summary.pendingAmount > 0
                ? `Đang chờ ${formatCurrencyVnd(summary.pendingAmount)}`
                : "Chưa có thanh toán"
        }
      />
      <KpiCard
        icon={CalendarClock}
        label="Mốc thời gian"
        value={
          summary.latestSuccessfulPaymentAt
            ? formatDateVi(summary.latestSuccessfulPaymentAt)
            : invoice.dueDate
              ? `Đến ${formatDateVi(invoice.dueDate)}`
              : "—"
        }
        hint={
          summary.latestSuccessfulPaymentAt
            ? "Lần thanh toán gần nhất"
            : invoice.issueDate
              ? `Phát hành ${formatDateVi(invoice.issueDate)}`
              : "Chưa phát hành"
        }
      />
    </div>
  );
}

function CustomerCard({ owner }: { owner: InvoiceOwnerSummaryType }) {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Khách hàng</CardTitle>
        <CardDescription>Thông tin chủ sở hữu hóa đơn</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-medium text-muted-foreground">
            {getInitials(owner.fullName, "?")}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-medium leading-none">
              {owner.fullName ?? "Không có tên"}
            </p>
            <p className="text-xs text-muted-foreground break-all">
              ID: {owner.id}
            </p>
            <Separator className="my-2" />
            <div className="space-y-1.5 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{owner.email ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-3.5 w-3.5 shrink-0" />
                <span>{owner.phone ?? "—"}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ReferenceSummaryRows({
  reference,
}: {
  reference: InvoiceReferenceSummaryType;
}) {
  const summary = reference.summary;
  if (!summary || typeof summary !== "object") return null;

  const entries: Array<{ label: string; value: string }> = [];
  const obj = summary as Record<string, unknown>;

  if (reference.type === "SUBSCRIPTION") {
    if (typeof obj.planCode === "string")
      entries.push({ label: "Mã gói", value: obj.planCode });
    if (typeof obj.durationMonths === "number")
      entries.push({
        label: "Thời hạn",
        value: `${obj.durationMonths} tháng`,
      });
    if (typeof obj.subscriptionStatus === "string")
      entries.push({
        label: "Trạng thái subscription",
        value: obj.subscriptionStatus,
      });
  } else if (reference.type === "SERVICE_PACKAGE") {
    if (typeof obj.code === "string")
      entries.push({ label: "Mã gói", value: obj.code });
    if (typeof obj.price === "number")
      entries.push({
        label: "Giá niêm yết",
        value: formatCurrencyVnd(obj.price),
      });
    if (typeof obj.creditAmount === "number")
      entries.push({
        label: "Credit",
        value: `${obj.creditAmount.toLocaleString("vi-VN")}${
          typeof obj.creditType === "string" ? ` (${obj.creditType})` : ""
        }`,
      });
  } else if (reference.type === "IOT_KIT_ORDER") {
    if (typeof obj.orderNumber === "string")
      entries.push({ label: "Mã đơn", value: obj.orderNumber });
    if (typeof obj.status === "string")
      entries.push({ label: "Trạng thái đơn", value: obj.status });
    if (typeof obj.totalAmount === "number")
      entries.push({
        label: "Tổng giá trị đơn",
        value: formatCurrencyVnd(obj.totalAmount),
      });
  }

  if (entries.length === 0) return null;

  return (
    <dl
      className="mt-3 grid gap-3 text-sm"
      style={{
        gridTemplateColumns: `repeat(${entries.length}, minmax(0, 1fr))`,
      }}
    >
      {entries.map((entry) => (
        <div
          key={entry.label}
          className="flex min-w-0 flex-col"
        >
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">
            {entry.label}
          </dt>
          <dd className="truncate font-medium">{entry.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReferenceCard({ invoice }: { invoice: InvoiceDetailResType }) {
  const reference = invoice.reference;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Đối tượng tham chiếu</CardTitle>
        <CardDescription>
          Hóa đơn này được tạo cho{" "}
          {reference
            ? REFERENCE_TYPE_LABEL[reference.type].toLowerCase()
            : "một đối tượng không còn tồn tại"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">
            {reference
              ? REFERENCE_TYPE_LABEL[reference.type]
              : invoice.referenceType}
          </Badge>
          <span className="font-medium">
            {reference?.label ?? "Không xác định"}
          </span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground break-all">
          ID: {invoice.referenceId}
        </p>
        {reference && <ReferenceSummaryRows reference={reference} />}
        {!reference && (
          <p className="mt-3 text-sm text-muted-foreground">
            Không thể tải dữ liệu chi tiết của đối tượng tham chiếu (có thể đã
            bị xóa).
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineRow({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${
          active ? "bg-primary" : "bg-muted-foreground/30"
        }`}
      />
      <div className="flex flex-1 items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

function TimelineCard({ invoice }: { invoice: InvoiceDetailResType }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Mốc thời gian</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <TimelineRow
          label="Phát hành"
          value={invoice.issueDate ? formatDateVi(invoice.issueDate) : "—"}
          active={Boolean(invoice.issueDate)}
        />
        <TimelineRow
          label="Đến hạn"
          value={invoice.dueDate ? formatDateVi(invoice.dueDate) : "—"}
          active={Boolean(invoice.dueDate)}
        />
        <TimelineRow
          label="Đã thanh toán"
          value={invoice.paidAt ? formatDateTimeVi(invoice.paidAt) : "—"}
          active={Boolean(invoice.paidAt)}
        />
        <Separator />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Tạo lúc</span>
          <span>{formatDateTimeVi(invoice.createdAt)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Cập nhật lúc</span>
          <span>{formatDateTimeVi(invoice.updatedAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function LineItemsCard({ invoice }: { invoice: InvoiceDetailResType }) {
  const items = invoice.items;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Chi tiết dòng tiền</CardTitle>
        <CardDescription>
          {items.length} mục được tính vào hóa đơn
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <DataTable
            columns={
              [
                {
                  accessorKey: "description",
                  header: "Mô tả",
                  cell: ({ row }) => (
                    <div className="space-y-0.5">
                      <p className="font-medium">{row.original.description}</p>
                      {row.original.refItemType && (
                        <Badge variant="outline" className="font-normal">
                          {row.original.refItemType}
                        </Badge>
                      )}
                    </div>
                  ),
                },
                {
                  accessorKey: "quantity",
                  header: () => <div className="text-right">Số lượng</div>,
                  cell: ({ row }) => (
                    <div className="text-right">
                      {row.original.quantity ?? "—"}
                    </div>
                  ),
                },
                {
                  accessorKey: "unitPrice",
                  header: () => <div className="text-right">Đơn giá</div>,
                  cell: ({ row }) => (
                    <div className="text-right">
                      {formatCurrencyVnd(row.original.unitPrice)}
                    </div>
                  ),
                },
                {
                  accessorKey: "amount",
                  header: () => <div className="text-right">Thành tiền</div>,
                  cell: ({ row }) => (
                    <div className="text-right font-medium">
                      {formatCurrencyVnd(row.original.amount)}
                    </div>
                  ),
                },
              ] as ColumnDef<(typeof items)[number]>[]
            }
            data={items}
            emptyText="Hóa đơn này không có dòng chi tiết."
          />
        </div>
        <div className="space-y-2 border-t pt-4 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tạm tính</span>
            <span>{formatCurrencyVnd(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Thuế</span>
            <span>{formatCurrencyVnd(invoice.taxAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 text-base font-semibold">
            <span>Tổng cộng</span>
            <span>{formatCurrencyVnd(invoice.totalAmount)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TransactionsCard({
  transactions,
}: {
  transactions: TransactionType[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Lịch sử giao dịch</CardTitle>
        <CardDescription>
          {transactions.length === 0
            ? "Chưa có giao dịch nào được khởi tạo cho hóa đơn này."
            : `${transactions.length} giao dịch — sắp xếp mới nhất trước.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <DataTable
            columns={
              [
                {
                  accessorKey: "gateway",
                  header: "Cổng",
                  cell: ({ row }) => (
                    <Badge variant="outline">{row.original.gateway}</Badge>
                  ),
                },
                {
                  accessorKey: "type",
                  header: "Loại",
                  cell: ({ row }) => (
                    <Badge
                      variant={
                        row.original.type === "REFUND"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {row.original.type === "REFUND" ? "Hoàn tiền" : "Thu phí"}
                    </Badge>
                  ),
                },
                {
                  accessorKey: "status",
                  header: "Trạng thái",
                  cell: ({ row }) => (
                    <div className="space-y-1">
                      <TransactionStatusBadge
                        status={row.original.status as TransactionStatus}
                      />
                      {row.original.status === "FAILED" &&
                        row.original.errorMessage && (
                          <p className="text-xs text-destructive max-w-xs">
                            {row.original.errorMessage}
                          </p>
                        )}
                    </div>
                  ),
                },
                {
                  accessorKey: "amount",
                  header: () => <div className="text-right">Số tiền</div>,
                  cell: ({ row }) => (
                    <div className="text-right font-medium">
                      {formatCurrencyVnd(row.original.amount)}
                    </div>
                  ),
                },
                {
                  accessorKey: "gatewayTransactionId",
                  header: "Mã giao dịch",
                  cell: ({ row }) => (
                    <span className="text-xs text-muted-foreground">
                      {row.original.gatewayTransactionId
                        ? shortId(row.original.gatewayTransactionId)
                        : "—"}
                    </span>
                  ),
                },
                {
                  accessorKey: "createdAt",
                  header: "Thời gian",
                  cell: ({ row }) => (
                    <span className="text-xs">
                      {formatDateTimeVi(row.original.createdAt)}
                    </span>
                  ),
                },
              ] as ColumnDef<TransactionType>[]
            }
            data={transactions}
            emptyText="Chưa có giao dịch."
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-12 w-1/2" />
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className="h-28"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-48 lg:col-span-1" />
        <Skeleton className="h-48 lg:col-span-2" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}

// ============================================================
// Page
// ============================================================

function AdminInvoiceDetailPage() {
  const navigate = useNavigate();
  const { invoiceId = "" } = useParams<{ invoiceId: string }>();
  const invoiceDetailQuery = useInvoiceDetail(invoiceId, Boolean(invoiceId));
  const invoice = invoiceDetailQuery.data?.data;

  useDynamicBreadcrumb(
    `/dashboard/admin/invoices/${invoiceId}`,
    invoice?.invoiceNumber,
  );

  const handleBack = () => navigate("/dashboard/admin/invoices");
  const handleRefresh = () => invoiceDetailQuery.refetch();

  if (invoiceDetailQuery.isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <PageHeader
          invoice={undefined}
          onBack={handleBack}
          onRefresh={handleRefresh}
          isRefreshing
        />
        <DetailSkeleton />
      </div>
    );
  }

  if (invoiceDetailQuery.isError || !invoice) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <PageHeader
          invoice={undefined}
          onBack={handleBack}
          onRefresh={handleRefresh}
          isRefreshing={invoiceDetailQuery.isFetching}
        />
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <Receipt className="h-10 w-10 text-muted-foreground" />
            <p className="text-base font-medium">Không tìm thấy hóa đơn</p>
            <p className="text-sm text-muted-foreground max-w-sm">
              Hóa đơn này có thể đã bị xóa, hoặc bạn không có quyền truy cập.
              Quay lại danh sách để tiếp tục.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="mt-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Về danh sách hóa đơn
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        invoice={invoice}
        onBack={handleBack}
        onRefresh={handleRefresh}
        isRefreshing={invoiceDetailQuery.isFetching}
      />

      <FinancialSummary
        invoice={invoice}
        summary={invoice.paymentSummary}
      />

      <div className="grid items-stretch gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1 flex">
          <CustomerCard owner={invoice.owner} />
        </div>
        <div className="lg:col-span-2 flex">
          <ReferenceCard invoice={invoice} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <LineItemsCard invoice={invoice} />
        </div>
        <div className="lg:col-span-1 flex flex-col gap-4">
          <TimelineCard invoice={invoice} />
        </div>
      </div>

      <TransactionsCard transactions={invoice.transactions} />
    </div>
  );
}

export default AdminInvoiceDetailPage;
