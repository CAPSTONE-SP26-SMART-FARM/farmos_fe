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
import { QUERY_KEYS } from "@/constants";
import { useAuthStore } from "@/stores/authStore";
import { useInvoiceDetail } from "@/queries/useInvoice";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowRight,
  CheckCircle2,
  Home,
  PackageSearch,
  Receipt,
  RotateCcw,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";

type OrderResultVariant = "success" | "fail";

interface OrderResultPageProps {
  variant: OrderResultVariant;
}

const STATUS_LABEL: Record<string, string> = {
  PAID: "Đã thanh toán",
  CANCELLED: "Đã huỷ",
  PROCESSING: "Đang xử lý",
  PENDING: "Đang chờ",
  FAILED: "Thất bại",
};

function OrderResultPage({ variant }: OrderResultPageProps) {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  const code = params.get("code");
  const gatewayTxId = params.get("id");
  const cancel = params.get("cancel") === "true";
  const status = params.get("status") ?? "";
  const orderCode = params.get("orderCode");
  const invoiceId = params.get("invoiceId");

  const isSuccess = variant === "success";

  useEffect(() => {
    // Refresh data that might have changed after a payment result, regardless
    // of success/failure (e.g. failed attempts still change the invoice row).
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.invoices.all });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.subscriptions.all });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.subscriptions.my(),
    });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.credits.all });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.servicePackages.all });
  }, [queryClient]);

  const ownerBase = "/dashboard/owner";
  const isOwner = isAuthenticated && user?.role === "owner";

  // Peek invoice reference to surface IoT Kit order tracking shortcut.
  const invoiceDetailQuery = useInvoiceDetail(invoiceId ?? "", !!invoiceId);
  const invoice = invoiceDetailQuery.data?.data;
  const isIotKitOrder = invoice?.referenceType === "IOT_KIT_ORDER";
  const iotKitOrderId = isIotKitOrder ? invoice?.referenceId : undefined;

  const primaryCta = isSuccess
    ? isOwner
      ? {
          label: "Về gói đăng ký của tôi",
          to: `${ownerBase}/subscriptions`,
        }
      : { label: "Về trang chủ", to: "/" }
    : invoiceId
      ? {
          label: "Thử thanh toán lại",
          to: `${ownerBase}/payments/${invoiceId}`,
        }
      : isOwner
        ? {
            label: "Xem hóa đơn của tôi",
            to: `${ownerBase}/payments`,
          }
        : { label: "Về trang chủ", to: "/" };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
        <CardHeader className="items-center gap-3 text-center">
          <div
            className={
              isSuccess
                ? "flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/60"
                : "flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/60"
            }
          >
            {isSuccess ? (
              <CheckCircle2 className="h-9 w-9 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <XCircle className="h-9 w-9 text-red-600 dark:text-red-400" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isIotKitOrder
              ? isSuccess
                ? "Đơn Bộ Kit IoT đã thanh toán"
                : cancel
                  ? "Bạn đã huỷ thanh toán đơn Bộ Kit IoT"
                  : "Thanh toán đơn Bộ Kit IoT chưa hoàn tất"
              : isSuccess
                ? "Thanh toán thành công"
                : cancel
                  ? "Bạn đã huỷ thanh toán"
                  : "Thanh toán không thành công"}
          </CardTitle>
          <CardDescription className="max-w-md">
            {isSuccess
              ? "Giao dịch của bạn đã được xác nhận. Dịch vụ sẽ được kích hoạt trong vài giây."
              : cancel
                ? "Bạn đã dừng giao dịch tại cổng thanh toán. Bạn có thể thử lại bất kỳ lúc nào."
                : "Không thể hoàn tất giao dịch. Vui lòng kiểm tra lại thông tin và thử thanh toán một lần nữa."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {(orderCode || gatewayTxId || status || code) && (
            <>
              <Separator />
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                {orderCode && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Mã đơn PayOS
                    </p>
                    <p className="font-mono font-medium">{orderCode}</p>
                  </div>
                )}
                {gatewayTxId && (
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Mã giao dịch
                    </p>
                    <p className="break-all font-mono text-xs font-medium">
                      {gatewayTxId}
                    </p>
                  </div>
                )}
                {status && (
                  <div>
                    <p className="text-xs text-muted-foreground">Trạng thái</p>
                    <Badge
                      variant="outline"
                      className={
                        status === "PAID"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200"
                          : status === "CANCELLED"
                            ? "border-muted bg-muted text-muted-foreground"
                            : "border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
                      }
                    >
                      {STATUS_LABEL[status] ?? status}
                    </Badge>
                  </div>
                )}
                {code && (
                  <div>
                    <p className="text-xs text-muted-foreground">Mã phản hồi</p>
                    <p className="font-mono text-xs font-medium">{code}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <Separator />

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            {isOwner && (
              <>
                <Button
                  variant="outline"
                  asChild
                >
                  <Link to={`${ownerBase}/payments`}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Xem hóa đơn
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  asChild
                >
                  <Link to={`${ownerBase}/wallet`}>
                    <Wallet className="mr-2 h-4 w-4" />
                    Mở ví
                  </Link>
                </Button>
              </>
            )}
            {!isSuccess && invoiceId && (
              <Button
                variant="outline"
                onClick={() =>
                  navigate(`${ownerBase}/payments/${invoiceId}`)
                }
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Thử lại
              </Button>
            )}
            {isOwner && isIotKitOrder && iotKitOrderId && (
              <Button
                variant="outline"
                onClick={() =>
                  navigate(
                    `${ownerBase}/iot-kits/orders/${iotKitOrderId}`,
                  )
                }
              >
                <PackageSearch className="mr-2 h-4 w-4" />
                Theo dõi đơn
              </Button>
            )}
            {!isOwner && (
              <Button
                variant="outline"
                asChild
              >
                <Link to="/">
                  <Home className="mr-2 h-4 w-4" />
                  Trang chủ
                </Link>
              </Button>
            )}
            <Button
              onClick={() => navigate(primaryCta.to)}
            >
              {primaryCta.label}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OrderResultPage;
