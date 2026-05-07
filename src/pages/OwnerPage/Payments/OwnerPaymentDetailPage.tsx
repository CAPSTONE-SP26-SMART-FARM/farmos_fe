import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/constants";
import InvoiceStatusBadge, {
  type InvoiceStatus,
} from "@/components/common/InvoiceStatusBadge";
import IotKitOrderStatusBadge from "@/components/common/IotKitOrderStatusBadge";
import TransactionStatusBadge, {
  type TransactionStatus,
} from "@/components/common/TransactionStatusBadge";
import {
  IotKitOrderInvoiceSummarySchema,
  type IotKitOrderStatus,
} from "@/schemaValidatation/iotKit";
import { PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { useInvoiceCheckout, useInvoiceDetail } from "@/queries/useInvoice";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

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

function OwnerPaymentDetailPage() {
  const navigate = useNavigate();
  const { invoiceId = "" } = useParams<{ invoiceId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isConfirmPayOpen, setIsConfirmPayOpen] = useState(false);
  const queryClient = useQueryClient();

  const invoiceDetailQuery = useInvoiceDetail(invoiceId, Boolean(invoiceId));
  const checkoutMutation = useInvoiceCheckout();

  const invoice = invoiceDetailQuery.data?.data;
  useDynamicBreadcrumb(
    `/dashboard/owner/payments/${invoiceId}`,
    invoice?.invoiceNumber,
  );

  // After PayOS redirects back to this page, surface the result and refresh.
  const paymentStatus = searchParams.get("paymentStatus");
  useEffect(() => {
    if (!paymentStatus) return;
    if (paymentStatus === "success") {
      toast.success("Thanh toán thành công.");
    } else if (paymentStatus === "cancel") {
      const cancelled = searchParams.get("cancel");
      toast.error(
        cancelled === "true"
          ? "Bạn đã huỷ thanh toán."
          : "Thanh toán không thành công.",
      );
    }
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all });
    if (invoiceId) {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.invoices.detail(invoiceId),
      });
    }
    // Clean PayOS callback params from the URL after handling them.
    const next = new URLSearchParams(searchParams);
    [
      "paymentStatus",
      "code",
      "id",
      "cancel",
      "status",
      "orderCode",
      "invoiceId",
      "reference",
      "paymentLinkId",
    ].forEach((key) => next.delete(key));
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStatus, invoiceId]);

  const handlePayInvoice = async () => {
    if (!invoiceId) return;

    try {
      const checkout = await checkoutMutation.mutateAsync({
        id: invoiceId,
        data: {
          gateway: "PAYOS",
        },
      });
      setIsConfirmPayOpen(false);
      window.location.href = checkout.data.paymentUrl;
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Khởi tạo thanh toán thất bại."));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Chi tiết thanh toán</CardTitle>
              <CardDescription>
                Theo dõi trạng thái hóa đơn và lịch sử giao dịch theo thời gian
                thực.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/owner/payments")}
            >
              Quay lại
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {invoiceDetailQuery.isLoading && (
            <p className="text-sm text-muted-foreground">
              Đang tải chi tiết hóa đơn...
            </p>
          )}
          {!invoiceDetailQuery.isLoading && !invoice && (
            <p className="text-sm text-muted-foreground">
              Không tìm thấy hóa đơn.
            </p>
          )}
          {invoice && (
            <div className="grid gap-2 rounded-md border p-4 text-sm">
              <p>
                Mã hóa đơn:{" "}
                <span className="font-medium">{invoice.invoiceNumber}</span>
              </p>
              <p>
                Trạng thái:{" "}
                <InvoiceStatusBadge
                  status={invoice.status as InvoiceStatus}
                />
              </p>
              <p>
                Loại hóa đơn:{" "}
                {invoice.referenceType === "SUBSCRIPTION"
                  ? "Gói đăng ký"
                  : invoice.referenceType === "SERVICE_PACKAGE"
                    ? "Gói dịch vụ"
                    : invoice.referenceType === "IOT_KIT_ORDER"
                      ? "Đơn Bộ Kit IoT"
                      : invoice.referenceType}
              </p>
              <p>Tổng tiền: {formatCurrency(invoice.totalAmount)}</p>
              <p>Ngày phát hành: {formatDateTime(invoice.issueDate)}</p>
              <p>Hạn thanh toán: {formatDateTime(invoice.dueDate)}</p>
              <p>Ngày thanh toán: {formatDateTime(invoice.paidAt)}</p>
            </div>
          )}

          {invoice?.status === "OPEN" && (
            <div className="flex justify-end">
              <Button
                onClick={() => setIsConfirmPayOpen(true)}
                disabled={checkoutMutation.isPending}
              >
                {checkoutMutation.isPending
                  ? "Đang xử lý..."
                  : "Thanh toán ngay"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {invoice?.referenceType === "IOT_KIT_ORDER" &&
        (() => {
          const parsed = IotKitOrderInvoiceSummarySchema.safeParse(
            invoice.reference?.summary,
          );
          const summary = parsed.success ? parsed.data : null;
          return (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Đơn Bộ Kit IoT</CardTitle>
                <CardDescription>
                  Hoá đơn này thanh toán cho 1 đơn mua bộ Kit IoT.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-3">
                {summary?.orderNumber && (
                  <span className="font-medium">
                    Mã đơn: {summary.orderNumber}
                  </span>
                )}
                {summary?.kitName && (
                  <span className="text-sm text-muted-foreground">
                    · {summary.kitName}
                  </span>
                )}
                {summary?.status && (
                  <IotKitOrderStatusBadge
                    status={summary.status as IotKitOrderStatus}
                  />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto"
                  onClick={() =>
                    navigate(
                      `/dashboard/owner/iot-kits/orders/${invoice.referenceId}`,
                    )
                  }
                >
                  <PackageSearch className="mr-2 h-4 w-4" />
                  Theo dõi đơn
                </Button>
              </CardContent>
            </Card>
          );
        })()}

      <Card>
        <CardHeader>
          <CardTitle>Chi tiết dòng tiền</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mô tả</TableHead>
                <TableHead>Số lượng</TableHead>
                <TableHead>Đơn giá</TableHead>
                <TableHead>Thành tiền</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice?.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.description}</TableCell>
                  <TableCell>{item.quantity ?? "-"}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(item.amount)}</TableCell>
                </TableRow>
              ))}
              {!invoice?.items.length && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Không có dòng tiền.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lịch sử giao dịch</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cổng</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Số tiền</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice?.transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>{transaction.gateway}</TableCell>
                  <TableCell>{transaction.type}</TableCell>
                  <TableCell>
                    <TransactionStatusBadge
                      status={transaction.status as TransactionStatus}
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(transaction.amount)}</TableCell>
                  <TableCell>{formatDateTime(transaction.createdAt)}</TableCell>
                </TableRow>
              ))}
              {!invoice?.transactions.length && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Chưa có giao dịch nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={isConfirmPayOpen}
        title="Xác nhận thanh toán"
        description="Bạn sẽ được chuyển đến cổng PayOS để hoàn tất giao dịch."
        confirmLabel="Tiếp tục"
        cancelLabel="Để sau"
        onCancel={() => setIsConfirmPayOpen(false)}
        onConfirm={() => void handlePayInvoice()}
      />
    </div>
  );
}

export default OwnerPaymentDetailPage;
