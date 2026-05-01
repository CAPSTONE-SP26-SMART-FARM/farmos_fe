import { useNavigate, useParams } from "react-router";
import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useInvoiceDetail } from "@/queries/useInvoice";
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

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof Coins;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}) {
  const toneClass: Record<typeof tone, string> = {
    default: "text-foreground",
    success: "text-emerald-600 dark:text-emerald-400",
    warning: "text-amber-600 dark:text-amber-400",
    danger: "text-destructive",
  };
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className={`text-2xl font-semibold ${toneClass[tone]}`}>
              {value}
            </p>
            {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
          </div>
          <div className="rounded-md border bg-muted p-2 text-muted-foreground">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mô tả</TableHead>
                <TableHead className="w-24 text-right">Số lượng</TableHead>
                <TableHead className="w-40 text-right">Đơn giá</TableHead>
                <TableHead className="w-40 text-right">Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Hóa đơn này không có dòng chi tiết.
                  </TableCell>
                </TableRow>
              )}
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="space-y-0.5">
                      <p className="font-medium">{item.description}</p>
                      {item.refItemType && (
                        <Badge
                          variant="outline"
                          className="font-normal"
                        >
                          {item.refItemType}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {item.quantity ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrencyVnd(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrencyVnd(item.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cổng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Số tiền</TableHead>
                <TableHead>Mã giao dịch</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Chưa có giao dịch.
                  </TableCell>
                </TableRow>
              )}
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Badge variant="outline">{tx.gateway}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={tx.type === "REFUND" ? "secondary" : "outline"}
                    >
                      {tx.type === "REFUND" ? "Hoàn tiền" : "Thu phí"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <TransactionStatusBadge
                        status={tx.status as TransactionStatus}
                      />
                      {tx.status === "FAILED" && tx.errorMessage && (
                        <p className="text-xs text-destructive max-w-xs">
                          {tx.errorMessage}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrencyVnd(tx.amount)}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {tx.gatewayTransactionId
                      ? shortId(tx.gatewayTransactionId)
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {formatDateTimeVi(tx.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function ReferenceDataCard({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Dữ liệu tham chiếu mở rộng</CardTitle>
        <CardDescription>
          Đã tải đầy đủ chi tiết domain liên quan (ví dụ: đơn hàng IoT Kit kèm
          line items + provisions).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen((prev) => !prev)}
        >
          {open ? "Ẩn JSON" : "Xem dữ liệu chi tiết"}
        </Button>
        {open && (
          <pre className="mt-3 max-h-96 overflow-auto rounded-md border bg-muted p-3 text-xs">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
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

      {invoice.referenceType === "IOT_KIT_ORDER" &&
      invoice.referenceData != null ? (
        <ReferenceDataCard data={invoice.referenceData} />
      ) : null}
    </div>
  );
}

export default AdminInvoiceDetailPage;
