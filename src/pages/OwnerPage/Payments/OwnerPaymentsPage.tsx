import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useOwnerCredits,
  useOwnerCreditHistory,
  usePurchaseServicePackage,
  useServicePackagePaymentStatus,
  useServicePackages,
} from "@/queries/useCredit";
import { useInvoiceCheckout, useOwnerInvoices } from "@/queries/useInvoice";
import { useRealtimeBilling } from "@/hooks/useRealtimeBilling";
import type { ListInvoicesQueryType } from "@/schemaValidatation/invoice";
import type {
  CreditHistoryQueryType,
  ListServicePackagesQueryType,
} from "@/schemaValidatation/credit";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const TX_STATUS_LABEL: Record<string, string> = {
  PENDING: "Đang xử lý",
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

function OwnerPaymentsPage() {
  const navigate = useNavigate();

  // Realtime: invalidate invoices / subscriptions khi BE push event billing.
  useRealtimeBilling();

  const [invoiceQuery, setInvoiceQuery] = useState<ListInvoicesQueryType>({
    page: 1,
    limit: 10,
    search: undefined,
    status: undefined,
    referenceType: undefined,
    referenceId: undefined,
  });
  const [packageQuery] = useState<ListServicePackagesQueryType>({
    page: 1,
    limit: 6,
    search: undefined,
  });
  const [creditHistoryQuery] = useState<CreditHistoryQueryType>({
    page: 1,
    limit: 5,
    search: undefined,
    creditType: undefined,
  });

  const [confirmCheckoutInvoiceId, setConfirmCheckoutInvoiceId] = useState("");
  const [confirmPurchasePackageId, setConfirmPurchasePackageId] = useState("");
  const [selectedPackageId, setSelectedPackageId] = useState("");

  const ownerInvoicesQuery = useOwnerInvoices(invoiceQuery, true);
  const ownerCreditsQuery = useOwnerCredits(true);
  const ownerCreditHistoryQuery = useOwnerCreditHistory(
    creditHistoryQuery,
    true,
  );
  const servicePackagesQuery = useServicePackages(packageQuery, true);
  const checkoutMutation = useInvoiceCheckout();
  const purchasePackageMutation = usePurchaseServicePackage();
  const servicePackagePaymentStatusQuery = useServicePackagePaymentStatus(
    selectedPackageId,
    Boolean(selectedPackageId),
  );

  const invoices = ownerInvoicesQuery.data?.data?.data ?? [];
  const invoicesMeta = ownerInvoicesQuery.data?.data?.meta;
  const ownerCredits = ownerCreditsQuery.data?.data?.data ?? [];
  const ownerCreditHistory = ownerCreditHistoryQuery.data?.data?.data ?? [];
  const packages = servicePackagesQuery.data?.data?.data ?? [];

  const selectedPackage = useMemo(
    () => packages.find((item) => item.id === selectedPackageId),
    [packages, selectedPackageId],
  );

  const payInvoice = async (invoiceId: string) => {
    try {
      const checkout = await checkoutMutation.mutateAsync({ id: invoiceId });
      window.open(checkout.data.paymentUrl, "_blank", "noopener,noreferrer");
      toast.success("Đã mở cổng thanh toán PayOS.");
      setConfirmCheckoutInvoiceId("");
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Khởi tạo thanh toán thất bại."));
    }
  };

  const purchasePackage = async (packageId: string) => {
    try {
      const purchaseResult =
        await purchasePackageMutation.mutateAsync(packageId);
      const checkout = await checkoutMutation.mutateAsync({
        id: purchaseResult.data.invoiceId,
      });
      window.open(checkout.data.paymentUrl, "_blank", "noopener,noreferrer");
      setSelectedPackageId(packageId);
      setConfirmPurchasePackageId("");
      toast.success(
        `Đã tạo hóa đơn ${purchaseResult.data.invoiceNumber}. Vui lòng hoàn tất thanh toán.`,
      );
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Mua gói dịch vụ thất bại."));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <Card>
        <CardHeader>
          <CardTitle>Thanh toán và hóa đơn</CardTitle>
          <CardDescription>
            Theo dõi hóa đơn, mua thêm gói dịch vụ và kiểm soát biến động
            credit.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          <Input
            placeholder="Tìm theo mã hóa đơn..."
            value={invoiceQuery.search ?? ""}
            onChange={(event) =>
              setInvoiceQuery((prev) => ({
                ...prev,
                page: 1,
                search: event.target.value || undefined,
              }))
            }
          />
          <Select
            value={invoiceQuery.status ?? "ALL"}
            onValueChange={(value) =>
              setInvoiceQuery((prev) => ({
                ...prev,
                page: 1,
                status:
                  value === "ALL"
                    ? undefined
                    : (value as Exclude<
                        ListInvoicesQueryType["status"],
                        undefined
                      >),
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Lọc trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
              <SelectItem value="OPEN">Chờ thanh toán</SelectItem>
              <SelectItem value="PAID">Đã thanh toán</SelectItem>
              <SelectItem value="VOID">Đã hủy</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={invoiceQuery.referenceType ?? "ALL"}
            onValueChange={(value) =>
              setInvoiceQuery((prev) => ({
                ...prev,
                page: 1,
                referenceType: value === "ALL" ? undefined : value,
              }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Lọc loại hóa đơn" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả loại</SelectItem>
              <SelectItem value="SUBSCRIPTION">Gói đăng ký</SelectItem>
              <SelectItem value="SERVICE_PACKAGE">Gói dịch vụ</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Danh sách hóa đơn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã hóa đơn</TableHead>
                <TableHead>Loại</TableHead>
                <TableHead>Tổng tiền</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ownerInvoicesQuery.isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Đang tải danh sách hóa đơn...
                  </TableCell>
                </TableRow>
              )}
              {!ownerInvoicesQuery.isLoading && invoices.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Không có hóa đơn phù hợp.
                  </TableCell>
                </TableRow>
              )}
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">
                    {invoice.invoiceNumber}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{invoice.referenceType}</Badge>
                  </TableCell>
                  <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell>
                    <InvoiceStatusBadge
                      status={invoice.status as InvoiceStatus}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          navigate(`/dashboard/owner/payments/${invoice.id}`)
                        }
                      >
                        Chi tiết
                      </Button>
                      {invoice.status === "OPEN" && (
                        <Button
                          size="sm"
                          onClick={() =>
                            setConfirmCheckoutInvoiceId(invoice.id)
                          }
                        >
                          Thanh toán
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {invoicesMeta?.page ?? 1}/{invoicesMeta?.totalPages ?? 1}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!invoicesMeta?.hasPreviousPage}
                onClick={() =>
                  setInvoiceQuery((prev) => ({
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
                disabled={!invoicesMeta?.hasNextPage}
                onClick={() =>
                  setInvoiceQuery((prev) => ({
                    ...prev,
                    page: prev.page + 1,
                  }))
                }
              >
                Trang sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Gói dịch vụ bổ sung</CardTitle>
            <CardDescription>
              Mua credit theo nhu cầu để mở rộng năng lực vận hành trang trại.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {packages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Không có gói dịch vụ khả dụng.
              </p>
            )}
            {packages.map((item) => (
              <div
                key={item.id}
                className="rounded-md border p-4 transition-colors duration-300 hover:bg-muted/40"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.description ?? "-"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.creditAmount} {item.creditType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {formatCurrency(item.price)}
                    </p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => setConfirmPurchasePackageId(item.id)}
                    >
                      Mua ngay
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="mt-1"
                      onClick={() => setSelectedPackageId(item.id)}
                    >
                      Theo dõi thanh toán
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            <div className="rounded-md border bg-muted/30 p-4 text-sm">
              <p className="font-medium">Trạng thái thanh toán gói dịch vụ</p>
              {!selectedPackageId && (
                <p className="mt-1 text-muted-foreground">
                  Chọn một gói để theo dõi giao dịch mới nhất.
                </p>
              )}
              {selectedPackageId && (
                <div className="mt-2 space-y-1 text-muted-foreground">
                  <p>Gói: {selectedPackage?.name ?? selectedPackageId}</p>
                  <p>
                    Trạng thái:{" "}
                    {TX_STATUS_LABEL[
                      servicePackagePaymentStatusQuery.data?.data
                        ?.latestTransaction?.status ?? "PENDING"
                    ] ?? "Đang xử lý"}
                  </p>
                  <p>
                    Mã giao dịch:{" "}
                    {servicePackagePaymentStatusQuery.data?.data
                      ?.latestTransaction?.id ?? "-"}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tổng quan credit</CardTitle>
            <CardDescription>
              Theo dõi số dư và 5 giao dịch credit gần nhất.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ownerCredits.map((credit) => (
              <div
                key={credit.id}
                className="rounded-md border p-3"
              >
                <p className="text-sm text-muted-foreground">
                  {credit.creditType}
                </p>
                <p className="text-lg font-semibold">{credit.balance}</p>
              </div>
            ))}

            <div className="space-y-2">
              {ownerCreditHistory.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Chưa có lịch sử credit.
                </p>
              )}
              {ownerCreditHistory.map((item) => (
                <div
                  key={item.id}
                  className="rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{item.transactionType}</p>
                    <p>{item.amount > 0 ? `+${item.amount}` : item.amount}</p>
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {item.description ?? "-"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(confirmCheckoutInvoiceId)}
        title="Xác nhận thanh toán hóa đơn"
        description="Hệ thống sẽ chuyển bạn sang cổng PayOS để hoàn tất giao dịch."
        confirmLabel="Tiếp tục"
        cancelLabel="Để sau"
        onCancel={() => setConfirmCheckoutInvoiceId("")}
        onConfirm={() => void payInvoice(confirmCheckoutInvoiceId)}
      />

      <ConfirmDialog
        open={Boolean(confirmPurchasePackageId)}
        title="Xác nhận mua gói dịch vụ"
        description="Hệ thống sẽ tạo hóa đơn mới và chuyển bạn đến PayOS để thanh toán."
        confirmLabel="Xác nhận mua"
        cancelLabel="Hủy"
        onCancel={() => setConfirmPurchasePackageId("")}
        onConfirm={() => void purchasePackage(confirmPurchasePackageId)}
      />
    </div>
  );
}

export default OwnerPaymentsPage;
