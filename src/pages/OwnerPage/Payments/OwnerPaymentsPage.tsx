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

const REFERENCE_TYPE_LABEL: Record<string, string> = {
  SUBSCRIPTION: "Gói đăng ký",
  SERVICE_PACKAGE: "Gói dịch vụ",
  IOT_KIT_ORDER: "Đơn Bộ Kit IoT",
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
              <SelectItem value="IOT_KIT_ORDER">Đơn Bộ Kit IoT</SelectItem>
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
                    <Badge variant="outline">
                      {REFERENCE_TYPE_LABEL[invoice.referenceType] ??
                        invoice.referenceType}
                    </Badge>
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
    </div>
  );
}

export default OwnerPaymentsPage;
