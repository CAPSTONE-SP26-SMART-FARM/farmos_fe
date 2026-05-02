import EmptyState from "@/components/common/EmptyState";
import IotKitOrderStatusBadge from "@/components/common/IotKitOrderStatusBadge";
import IotQuotaWidget from "@/components/common/IotQuotaWidget";
import KpiCard from "@/components/common/KpiCard";
import LoadingCard from "@/components/common/LoadingCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useIotKitOrderPaymentStatus } from "@/queries/useIotKit";
import { useInvoiceCheckout, useInvoiceDetail } from "@/queries/useInvoice";
import { IotKitOrderInvoiceSummarySchema } from "@/schemaValidatation/iotKit";
import { formatDateTimeVi } from "@/lib/format";
import { onMutationError } from "@/lib/axios";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  CircleDot,
  CreditCard,
  ExternalLink,
  Hourglass,
  PackageX,
  Receipt,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

const TRANSACTION_STATUS_LABEL: Record<string, string> = {
  PENDING: "Đang chờ",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Bản nháp",
  OPEN: "Chưa thanh toán",
  PAID: "Đã thanh toán",
  VOID: "Đã huỷ",
  UNCOLLECTIBLE: "Không thu được",
};

export default function OwnerIotKitOrderStatusPage() {
  const navigate = useNavigate();
  const { orderId } = useParams<{ orderId: string }>();

  const statusQuery = useIotKitOrderPaymentStatus(orderId ?? "", !!orderId);
  const checkoutMutation = useInvoiceCheckout();

  const order = statusQuery.data?.data;

  // BE payment-status response only carries `orderId` — fetch the related
  // invoice to surface the human-readable `orderNumber` in the hero.
  const invoiceDetailQuery = useInvoiceDetail(
    order?.invoiceId ?? "",
    !!order?.invoiceId,
  );
  const orderSummary = (() => {
    const summary = invoiceDetailQuery.data?.data?.reference?.summary;
    if (!summary) return null;
    const parsed = IotKitOrderInvoiceSummarySchema.safeParse(summary);
    return parsed.success ? parsed.data : null;
  })();
  const orderNumber = orderSummary?.orderNumber;

  const handleReopenCheckout = async () => {
    if (!order?.invoiceId) return;
    try {
      const res = await checkoutMutation.mutateAsync({ id: order.invoiceId });
      const url = res.data.paymentUrl;
      if (url) {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        toast.error("Không lấy được liên kết thanh toán mới.");
      }
    } catch (error) {
      onMutationError(error, "Không thể mở lại cổng thanh toán.");
    }
  };

  if (statusQuery.isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <LoadingCard rows={6} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <h3 className="text-lg font-semibold">Không tìm thấy đơn</h3>
            <p className="text-sm text-muted-foreground">
              Đơn không tồn tại hoặc bạn không có quyền truy cập.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/owner/iot-kits")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isPending = order.orderStatus === "PENDING";
  const isPaid = order.orderStatus === "PAID";
  const isCancelled =
    order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED";

  const orderStatusTone: "success" | "warning" | "danger" | "default" = isPaid
    ? "success"
    : isPending
      ? "warning"
      : isCancelled
        ? "danger"
        : "default";

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/owner/iot-kits")}
          className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại marketplace
        </Button>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <Badge className="mb-2">Chủ trang trại</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Đơn {orderNumber ?? `${order.orderId.slice(0, 8)}…`}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Theo dõi tình trạng thanh toán và việc cấp phát thiết bị cho đơn
              của bạn.
            </p>
          </div>
          <div className="flex items-center md:pt-1">
            <IotKitOrderStatusBadge status={order.orderStatus} />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={CircleDot}
          label="Trạng thái đơn"
          value={
            isPaid
              ? "Đã thanh toán"
              : isPending
                ? "Chờ thanh toán"
                : order.orderStatus === "CANCELLED"
                  ? "Đã huỷ"
                  : "Đã hoàn tiền"
          }
          tone={orderStatusTone}
        />
        <KpiCard
          icon={CreditCard}
          label="Trạng thái thanh toán"
          value={
            order.transactionStatus
              ? (TRANSACTION_STATUS_LABEL[order.transactionStatus] ??
                order.transactionStatus)
              : "—"
          }
          tone={order.transactionStatus === "SUCCESS" ? "success" : "default"}
        />
        <KpiCard
          icon={Receipt}
          label="Hoá đơn"
          value={
            order.invoiceStatus
              ? (INVOICE_STATUS_LABEL[order.invoiceStatus] ??
                order.invoiceStatus)
              : "—"
          }
        />
        <KpiCard
          icon={CalendarClock}
          label="Thời điểm thanh toán"
          value={order.paidAt ? formatDateTimeVi(order.paidAt) : "—"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tiến trình đơn</CardTitle>
            <CardDescription>
              Mỗi mốc sẽ được đánh dấu khi đạt được.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 border-l pl-6">
              <li className="relative">
                <span className="absolute -left-7.75 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <CheckCircle2
                    className="h-3 w-3"
                    aria-hidden
                  />
                </span>
                <p className="font-medium">Tạo đơn</p>
                <p className="text-xs text-muted-foreground">
                  Đơn đã được khởi tạo và chờ thanh toán.
                </p>
              </li>
              <li className="relative">
                <span
                  className={
                    isPaid || isCancelled
                      ? "absolute -left-7.75 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground"
                      : "absolute -left-7.75 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  }
                >
                  {isCancelled ? (
                    <PackageX
                      className="h-3 w-3"
                      aria-hidden
                    />
                  ) : (
                    <CheckCircle2
                      className="h-3 w-3"
                      aria-hidden
                    />
                  )}
                </span>
                <p className="font-medium">
                  {isCancelled ? "Đã huỷ thanh toán" : "Thanh toán PayOS"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isPaid
                    ? `Đã thanh toán lúc ${formatDateTimeVi(order.paidAt)}`
                    : isCancelled
                      ? "Hoá đơn đã được huỷ."
                      : "PayOS có thể mất 30-60s để xác nhận. Trang này sẽ tự cập nhật."}
                </p>
              </li>
              <li className="relative">
                <span
                  className={
                    isPaid
                      ? "absolute -left-7.75 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white"
                      : "absolute -left-7.75 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground"
                  }
                >
                  <Hourglass
                    className="h-3 w-3"
                    aria-hidden
                  />
                </span>
                <p className="font-medium">Cấp thiết bị</p>
                <p className="text-xs text-muted-foreground">
                  Đội vận hành sẽ gán thiết bị trong vòng 24 giờ kể từ khi thanh
                  toán.
                </p>
              </li>
              <li className="relative">
                <span className="absolute -left-7.75 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <CheckCircle2
                    className="h-3 w-3"
                    aria-hidden
                  />
                </span>
                <p className="font-medium">Hoàn tất</p>
                <p className="text-xs text-muted-foreground">
                  Hạn mức thiết bị IoT được cộng thêm và sẵn sàng sử dụng.
                </p>
              </li>
            </ol>

            {isCancelled && (
              <div className="mt-6">
                <EmptyState
                  icon={PackageX}
                  title="Đơn đã huỷ"
                  description="Bạn có thể quay lại marketplace để chọn bộ kit khác."
                  action={{
                    label: "Quay lại marketplace",
                    onClick: () => navigate("/dashboard/owner/iot-kits"),
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <IotQuotaWidget />
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-2 pt-6">
          {order.invoiceId && (
            <Button
              variant="outline"
              onClick={() =>
                navigate(`/dashboard/owner/payments/${order.invoiceId}`)
              }
            >
              <Receipt className="mr-2 h-4 w-4" />
              Xem hoá đơn
            </Button>
          )}
          {isPending && order.invoiceId && (
            <Button
              onClick={handleReopenCheckout}
              disabled={checkoutMutation.isPending}
            >
              {checkoutMutation.isPending ? (
                "Đang xử lý..."
              ) : (
                <>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Mở lại cổng PayOS
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
