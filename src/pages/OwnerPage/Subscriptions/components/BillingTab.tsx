import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import InvoiceStatusBadge, {
  type InvoiceStatus,
} from "@/components/common/InvoiceStatusBadge";
import TableSkeleton from "@/components/common/TableSkeleton";
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
import { formatCurrencyVnd, formatDateVi } from "@/lib/format";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useInvoiceCheckout,
  useOwnerInvoices,
} from "@/queries/useInvoice";
import type { SubscriptionResType } from "@/schemaValidatation/subscription";
import { FileText, ReceiptText, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface BillingTabProps {
  subscription: SubscriptionResType;
  onOpenCancel: () => void;
  onChangePlan: () => void;
  /** Controls visibility of the cancel danger zone. Defaults to true (active/pending subs). */
  showCancel?: boolean;
}

function BillingTab({
  subscription,
  onOpenCancel,
  onChangePlan,
  showCancel = true,
}: BillingTabProps) {
  const invoicesQuery = useOwnerInvoices(
    {
      page: 1,
      limit: 20,
      search: undefined,
      status: undefined,
      referenceType: "SUBSCRIPTION",
      referenceId: subscription.id,
    },
    Boolean(subscription.id),
  );

  const checkoutMutation = useInvoiceCheckout();
  const [confirmPayId, setConfirmPayId] = useState<string | null>(null);

  const invoices = invoicesQuery.data?.data?.data ?? [];

  const handlePay = async (invoiceId: string) => {
    try {
      const result = await checkoutMutation.mutateAsync({
        id: invoiceId,
        data: { gateway: "PAYOS" },
      });
      setConfirmPayId(null);
      window.location.href = result.data.paymentUrl;
    } catch (error) {
      toast.error(
        getApiErrorMessageVi(error, "Không thể tạo phiên thanh toán."),
      );
    }
  };

  const canCancel =
    subscription.status !== "CANCELLED" && subscription.status !== "EXPIRED";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hóa đơn của gói</CardTitle>
          <CardDescription>
            Quản lý các hóa đơn liên quan đến gói đăng ký này.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {invoicesQuery.isLoading ? (
            <TableSkeleton />
          ) : invoicesQuery.isError ? (
            <ErrorState
              message={getApiErrorMessageVi(
                invoicesQuery.error,
                "Không thể tải danh sách hóa đơn.",
              )}
              onRetry={() => invoicesQuery.refetch()}
            />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={ReceiptText}
              title="Chưa có hóa đơn"
              description="Khi có hóa đơn phát sinh, bạn sẽ thấy ở đây."
            />
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mã hóa đơn</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Tổng tiền</TableHead>
                    <TableHead>Hạn thanh toán</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">
                        {invoice.invoiceNumber}
                      </TableCell>
                      <TableCell>
                        <InvoiceStatusBadge
                          status={invoice.status as InvoiceStatus}
                        />
                      </TableCell>
                      <TableCell>
                        {formatCurrencyVnd(invoice.totalAmount)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateVi(invoice.dueDate)}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.status === "OPEN" ? (
                          <Button
                            size="sm"
                            onClick={() => setConfirmPayId(invoice.id)}
                            disabled={
                              checkoutMutation.isPending &&
                              confirmPayId === invoice.id
                            }
                          >
                            Thanh toán
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            asChild
                          >
                            <a
                              href={`/dashboard/owner/payments/${invoice.id}`}
                            >
                              <FileText className="mr-1 h-3 w-3" />
                              Chi tiết
                            </a>
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nâng gói đăng ký</CardTitle>
          <CardDescription>
            Chuyển sang gói cao hơn để mở rộng tính năng và hạn mức.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onChangePlan}>Chọn gói mới</Button>
        </CardContent>
      </Card>

      {showCancel && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Vùng nguy hiểm</CardTitle>
            <CardDescription>
              Huỷ gói sẽ dừng các dịch vụ trả phí ngay sau khi xác nhận.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="destructive"
              onClick={onOpenCancel}
              disabled={!canCancel}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hủy đăng ký
            </Button>
            {!canCancel && (
              <p className="mt-2 text-xs text-muted-foreground">
                Gói này không thể hủy (đã ở trạng thái {subscription.status}).
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <ConfirmDialog
        open={Boolean(confirmPayId)}
        title="Xác nhận thanh toán"
        description="Bạn sẽ được chuyển đến cổng PayOS để hoàn tất giao dịch."
        confirmLabel="Tiếp tục"
        cancelLabel="Hủy"
        onCancel={() => setConfirmPayId(null)}
        onConfirm={() => {
          if (confirmPayId) handlePay(confirmPayId);
        }}
      />
    </div>
  );
}

export default BillingTab;
