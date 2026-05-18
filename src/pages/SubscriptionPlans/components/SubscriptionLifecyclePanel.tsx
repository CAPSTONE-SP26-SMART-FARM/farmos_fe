import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
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
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  getSubscriptionStatusBadgeVariant,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import {
  useOwnerCreditHistory,
  useOwnerCredits,
  usePurchaseServicePackage,
  useServicePackages,
} from "@/queries/useCredit";
import {
  useInvoiceCheckout,
  useOwnerInvoices,
  useSubscriptionPaymentStatus,
} from "@/queries/useInvoice";
import {
  useAdminListSubscriptions,
  useOwnerMySubscription,
  useOwnerRenewSubscription,
  useSubscriptionCancel,
  useSubscriptionDetail,
  useSubscriptionEntitlements,
  useSubscriptionQuota,
} from "@/queries/useSubscription";
import {
  CancelSubscriptionBodySchema,
  type EntitlementsQueryType,
  type ListSubscriptionsQueryType,
  type SubscriptionStatusType,
} from "@/schemaValidatation/subscription";
import type { ListInvoicesQueryType } from "@/schemaValidatation/invoice";
import type {
  CreditHistoryQueryType,
  ListServicePackagesQueryType,
} from "@/schemaValidatation/credit";
import {
  ArrowLeft,
  CircleSlash,
  ListChecks,
  MoreVertical,
  RefreshCw,
  Shield,
  User,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type PageMode = "admin" | "owner";

interface Props {
  mode: PageMode;
  detailOnly?: boolean;
  initialSubscriptionId?: string;
  onBack?: () => void;
}

const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatusType, string> = {
  PENDING: "Chờ kích hoạt",
  ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm ngưng",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

const SUBSCRIPTION_STATUS_OPTIONS: Array<{
  value: "ALL" | SubscriptionStatusType;
  label: string;
}> = [
  { value: "ALL", label: "Tất cả trạng thái" },
  { value: "PENDING", label: "Chờ kích hoạt" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "SUSPENDED", label: "Tạm ngưng" },
  { value: "CANCELLED", label: "Đã hủy" },
  { value: "EXPIRED", label: "Hết hạn" },
];

const formatDateTime = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return format(date, "dd/MM/yyyy HH:mm");
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

function SubscriptionLifecyclePanel({
  mode,
  detailOnly = false,
  initialSubscriptionId,
  onBack,
}: Props) {
  const isAdmin = mode === "admin";
  const navigate = useNavigate();
  const subscriptionBasePath = isAdmin
    ? "/dashboard/admin/subscriptions"
    : "/dashboard/owner/subscriptions";
  const shouldFetchAdminList = isAdmin && !detailOnly;
  const shouldFetchOwnerSubscription = !isAdmin && !initialSubscriptionId;

  const [adminQuery, setAdminQuery] = useState<ListSubscriptionsQueryType>({
    page: 1,
    limit: 10,
    search: undefined,
    status: undefined,
    ownerSearch: undefined,
  });

  const [ownerIdInput, setOwnerIdInput] = useState("");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(
    initialSubscriptionId ?? "",
  );
  const shouldFetchDetail =
    detailOnly && Boolean(selectedSubscriptionId);
  const shouldFetchOwnerPanels = !isAdmin && Boolean(selectedSubscriptionId);

  const [entitlementQuery, setEntitlementQuery] =
    useState<EntitlementsQueryType>({
      page: 1,
      limit: 5,
      search: undefined,
    });

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [invoiceQuery] = useState<ListInvoicesQueryType>({
    page: 1,
    limit: 20,
    search: undefined,
    status: undefined,
    referenceType: "SUBSCRIPTION",
    referenceId: undefined,
  });
  const [servicePackageQuery] = useState<ListServicePackagesQueryType>({
    page: 1,
    limit: 20,
    search: undefined,
  });
  const [creditHistoryQuery] = useState<CreditHistoryQueryType>({
    page: 1,
    limit: 10,
    search: undefined,
    creditType: undefined,
  });

  const ownerMySubscription = useOwnerMySubscription(
    shouldFetchOwnerSubscription,
  );
  const adminListSubscriptions = useAdminListSubscriptions(
    adminQuery,
    shouldFetchAdminList,
  );

  const listData = adminListSubscriptions.data?.data;
  const subscriptions = listData?.data ?? [];
  const subscriptionsMeta = listData?.meta;

  useEffect(() => {
    if (initialSubscriptionId) {
      setSelectedSubscriptionId(initialSubscriptionId);
    }
  }, [initialSubscriptionId]);

  useEffect(() => {
    if (detailOnly) {
      if (initialSubscriptionId) {
        setSelectedSubscriptionId(initialSubscriptionId);
        return;
      }

      if (!isAdmin) {
        const ownerSubscriptionId = ownerMySubscription.data?.data?.id;
        setSelectedSubscriptionId(ownerSubscriptionId ?? "");
      }
      return;
    }

    if (!isAdmin) {
      const ownerSubscriptionId = ownerMySubscription.data?.data?.id;
      setSelectedSubscriptionId(ownerSubscriptionId ?? "");
      return;
    }

    if (!subscriptions.length) {
      setSelectedSubscriptionId("");
      return;
    }

    const stillExists = subscriptions.some(
      (item) => item.id === selectedSubscriptionId,
    );
    if (!stillExists) {
      setSelectedSubscriptionId(subscriptions[0].id);
    }
  }, [
    detailOnly,
    initialSubscriptionId,
    isAdmin,
    ownerMySubscription.data?.data?.id,
    selectedSubscriptionId,
    subscriptions,
  ]);

  useEffect(() => {
    setEntitlementQuery({ page: 1, limit: 5, search: undefined });
  }, [selectedSubscriptionId]);

  const selectedSubscriptionDetail = useSubscriptionDetail(
    selectedSubscriptionId,
    shouldFetchDetail,
  );

  const entitlementsQuery = useSubscriptionEntitlements(
    selectedSubscriptionId,
    entitlementQuery,
    shouldFetchDetail || shouldFetchOwnerPanels,
  );

  const quotaQuery = useSubscriptionQuota(
    selectedSubscriptionId,
    shouldFetchDetail || shouldFetchOwnerPanels,
  );

  const renewSubscriptionMutation = useOwnerRenewSubscription();
  const cancelSubscriptionMutation = useSubscriptionCancel();
  const invoicesQuery = useOwnerInvoices(
    {
      ...invoiceQuery,
      referenceId: selectedSubscriptionId || undefined,
    },
    !isAdmin && Boolean(selectedSubscriptionId),
  );
  const invoiceCheckoutMutation = useInvoiceCheckout();
  const paymentStatusQuery = useSubscriptionPaymentStatus(
    selectedSubscriptionId,
    !isAdmin && Boolean(selectedSubscriptionId),
  );
  const ownerCreditsQuery = useOwnerCredits(!isAdmin);
  const ownerCreditHistoryQuery = useOwnerCreditHistory(creditHistoryQuery, !isAdmin);
  const servicePackagesQuery = useServicePackages(servicePackageQuery, !isAdmin);
  const purchaseServicePackageMutation = usePurchaseServicePackage();

  const cancelForm = useForm({
    resolver: zodResolver(CancelSubscriptionBodySchema),
    defaultValues: {
      cancelReason: "",
    },
  });

  useClearServerFieldErrors(cancelForm);

  const selectedSubscriptionFromList = subscriptions.find(
    (item) => item.id === selectedSubscriptionId,
  );
  const subscriptionDetailResponse = selectedSubscriptionDetail.data?.data;
  const detail =
    !isAdmin && !detailOnly
      ? ownerMySubscription.data?.data
      : detailOnly
        ? subscriptionDetailResponse?.subscription
        : selectedSubscriptionFromList;
  const isDetailLoading =
    !isAdmin && !detailOnly
      ? ownerMySubscription.isLoading
      : selectedSubscriptionDetail.isLoading;
  const entitlementData = entitlementsQuery.data?.data;
  const quotaData = quotaQuery.data?.data;
  const invoices = invoicesQuery.data?.data?.data ?? [];
  const selectedInvoice =
    invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? invoices[0];
  const ownerCredits = ownerCreditsQuery.data?.data?.data ?? [];
  const ownerCreditHistory = ownerCreditHistoryQuery.data?.data?.data ?? [];
  const servicePackages = servicePackagesQuery.data?.data?.data ?? [];

  useEffect(() => {
    if (!selectedInvoiceId && invoices[0]?.id) {
      setSelectedInvoiceId(invoices[0].id);
    }
  }, [invoices, selectedInvoiceId]);

  const handleOwnerIdFilter = () => {
    const ownerSearch = ownerIdInput.trim();
    setAdminQuery((prev) => ({
      ...prev,
      page: 1,
      ownerSearch: ownerSearch || undefined,
    }));
  };

  const handleRenewSubscription = async () => {
    if (!selectedSubscriptionId) return;

    try {
      const renewResult =
        await renewSubscriptionMutation.mutateAsync(selectedSubscriptionId);
      toast.success(
        `Đã tạo hóa đơn gia hạn ${renewResult.data.invoiceNumber}. Vui lòng thanh toán để kích hoạt.`,
      );
      invoicesQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Gia hạn đăng ký thất bại."));
    }
  };


  const handleCancelSubscription = async (values: {
    cancelReason?: string;
  }) => {
    if (!selectedSubscriptionId) return;

    try {
      await cancelSubscriptionMutation.mutateAsync({
        id: selectedSubscriptionId,
        data: {
          cancelReason: values.cancelReason?.trim() || undefined,
        },
      });
      toast.success("Hủy đăng ký thành công.");
      setIsCancelDialogOpen(false);
      cancelForm.reset({ cancelReason: "" });
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          cancelForm.setError,
          { getValues: cancelForm.getValues },
        );
        return;
      }
      toast.error(getApiErrorMessageVi(error, "Hủy đăng ký thất bại."));
    }
  };

  const handleCheckoutInvoice = async () => {
    if (!selectedInvoice) {
      toast.error("Không tìm thấy hóa đơn để thanh toán.");
      return;
    }

    try {
      const result = await invoiceCheckoutMutation.mutateAsync({
        id: selectedInvoice.id,
        data: { gateway: "PAYOS" },
      });
      window.open(result.data.paymentUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Không thể tạo phiên thanh toán."));
    }
  };

  const handlePurchaseServicePackage = async (packageId: string) => {
    try {
      await purchaseServicePackageMutation.mutateAsync(packageId);
      toast.success("Đã tạo hóa đơn mua gói. Tiếp tục thanh toán trong mục hóa đơn.");
      invoicesQuery.refetch();
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Mua gói bổ trợ thất bại."));
    }
  };

  const openDetailPage = (subscriptionId: string) => {
    navigate(`${subscriptionBasePath}/${subscriptionId}`);
  };

  const backToListPage = () => {
    if (onBack) {
      onBack();
      return;
    }
    navigate(subscriptionBasePath);
  };

  return (
    <div
      className={
        detailOnly
          ? "space-y-6 animate-in slide-in-from-right-4 fade-in duration-300"
          : "space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
      }
    >
      {!detailOnly && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {isAdmin ? (
                <Shield className="h-4 w-4" />
              ) : (
                <User className="h-4 w-4" />
              )}
              {isAdmin ? "Quản lý đăng ký" : "Gói đăng ký của tôi"}
            </CardTitle>
            <CardDescription>
              {isAdmin
                ? "Quản trị viên có thể xem danh sách đăng ký, hủy đăng ký và ép nâng cấp phiên bản gói."
                : "Quản lý gói đăng ký hiện tại."}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {isAdmin && (
              <div className="grid gap-3 md:grid-cols-3">
                <Select
                  value={adminQuery.status ?? "ALL"}
                  onValueChange={(value) =>
                    setAdminQuery((prev) => ({
                      ...prev,
                      page: 1,
                      status:
                        value === "ALL"
                          ? undefined
                          : (value as SubscriptionStatusType),
                    }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Lọc trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSCRIPTION_STATUS_OPTIONS.map((status) => (
                      <SelectItem
                        key={status.value}
                        value={status.value}
                      >
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Lọc theo ID Chủ trang trại (UUID)"
                  value={ownerIdInput}
                  onChange={(event) => setOwnerIdInput(event.target.value)}
                />

                <Button
                  variant="outline"
                  onClick={handleOwnerIdFilter}
                >
                  <ListChecks className="mr-2 h-4 w-4" />
                  Áp dụng bộ lọc
                </Button>
              </div>
            )}

            {isAdmin && (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã đăng ký</TableHead>
                      <TableHead>Chủ trang trại</TableHead>
                      <TableHead>Gói</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminListSubscriptions.isLoading && (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="py-5 text-center text-muted-foreground"
                        >
                          Đang tải danh sách đăng ký...
                        </TableCell>
                      </TableRow>
                    )}

                    {!adminListSubscriptions.isLoading &&
                      !subscriptions.length && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-5 text-center text-muted-foreground"
                          >
                            Không có dữ liệu đăng ký.
                          </TableCell>
                        </TableRow>
                      )}

                    {subscriptions.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {item.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>{item.ownerId.slice(0, 8)}...</TableCell>
                        <TableCell>{item.plan?.name ?? "-"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getSubscriptionStatusBadgeVariant(
                              item.status,
                            )}
                          >
                            {SUBSCRIPTION_STATUS_LABEL[item.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDetailPage(item.id)}
                          >
                            Mở
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {isAdmin && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Trang {subscriptionsMeta?.page ?? 1}/
                  {subscriptionsMeta?.totalPages ?? 1}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!subscriptionsMeta?.hasPreviousPage}
                    onClick={() =>
                      setAdminQuery((prev) => ({
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
                    disabled={!subscriptionsMeta?.hasNextPage}
                    onClick={() =>
                      setAdminQuery((prev) => ({
                        ...prev,
                        page: prev.page + 1,
                      }))
                    }
                  >
                    Trang sau
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {(detailOnly || !isAdmin) && (
        <>
          {detailOnly && !onBack && (
            <Card>
              <CardContent className="flex items-center justify-between gap-3 py-4">
                <div>
                  <p className="text-sm font-semibold">Chi tiết đăng ký</p>
                  <p className="text-sm text-muted-foreground">
                    Trang chi tiết hiển thị riêng để giữ hiệu ứng chuyển cảnh ổn
                    định khi dữ liệu tải chậm.
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={backToListPage}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Quay lại danh sách
                </Button>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 xl:grid-cols-5">
            <Card className="xl:col-span-2">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle>Chi tiết đăng ký</CardTitle>
                    <CardDescription>
                      {isAdmin
                        ? "Theo dõi và quản lý đăng ký của khách hàng."
                        : "Chủ trang trại có thể gia hạn và hủy đăng ký."}
                    </CardDescription>
                  </div>
                  {isAdmin && detail && detail.status !== "CANCELLED" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          aria-label="Tùy chọn đăng ký"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onSelect={() => setIsCancelDialogOpen(true)}
                        >
                          <CircleSlash className="mr-2 h-4 w-4" />
                          Hủy đăng ký
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {!selectedSubscriptionId && (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    Chưa có đăng ký được chọn.
                  </p>
                )}

                {selectedSubscriptionId && isDetailLoading && (
                  <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    Đang tải chi tiết đăng ký...
                  </p>
                )}

                {detail && (
                  <>
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="flex items-start justify-end gap-3">
                        <Badge
                          variant={getSubscriptionStatusBadgeVariant(
                            detail.status,
                          )}
                        >
                          {SUBSCRIPTION_STATUS_LABEL[detail.status]}
                        </Badge>
                      </div>

                      {isAdmin && detail.owner && (
                        <div className="rounded-md bg-muted/50 p-3">
                          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            <User className="h-3.5 w-3.5" />
                            Chủ trang trại
                          </p>
                          <p className="text-sm font-medium">
                            {detail.owner.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {detail.owner.email}
                          </p>
                          {detail.owner.phone && (
                            <p className="text-xs text-muted-foreground">
                              {detail.owner.phone}
                            </p>
                          )}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-muted-foreground">Gói</p>
                          <p className="text-sm font-medium">
                            {detail.plan?.name ?? "-"}
                          </p>
                          {detail.plan?.code && (
                            <p className="font-mono text-xs text-muted-foreground">
                              {detail.plan.code}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Ngày đăng ký
                          </p>
                          <p className="text-sm">
                            {formatDateTime(detail.createdAt)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Ngày bắt đầu
                          </p>
                          <p className="text-sm">
                            {formatDateTime(detail.startedAt)}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-muted-foreground">
                            Ngày hết hạn
                          </p>
                          <p className="text-sm">
                            {formatDateTime(detail.expiresAt)}
                          </p>
                        </div>
                      </div>

                      {detail.status === "CANCELLED" && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                          <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-destructive">
                            <CircleSlash className="h-3.5 w-3.5" />
                            Đã hủy
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Thời điểm: {formatDateTime(detail.cancelledAt)}
                          </p>
                          {detail.cancelReason && (
                            <p className="mt-1 text-sm">
                              Lý do: {detail.cancelReason}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {!isAdmin && (
                      <div className="grid gap-2">
                        <Button
                          variant="outline"
                          disabled={renewSubscriptionMutation.isPending}
                          onClick={handleRenewSubscription}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Gia hạn đăng ký
                        </Button>

                        <Button
                          variant="destructive"
                          onClick={() => setIsCancelDialogOpen(true)}
                        >
                          <CircleSlash className="mr-2 h-4 w-4" />
                          Hủy đăng ký
                        </Button>
                      </div>
                    )}

                  </>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-3">
              <CardHeader>
                <CardTitle>Quyền lợi & Lịch sử sử dụng</CardTitle>
                <CardDescription>
                  Cả Quản trị viên và Chủ trang trại đều có quyền xem quyền lợi và lịch sử sử
                  dụng của đăng ký hợp lệ.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Danh sách quyền lợi</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên tính năng</TableHead>
                        <TableHead>Mã tính năng</TableHead>
                        <TableHead>Kỳ áp dụng</TableHead>
                        <TableHead>Tạo lúc</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {entitlementsQuery.isLoading && (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="py-5 text-center text-muted-foreground"
                          >
                            Đang tải quyền lợi...
                          </TableCell>
                        </TableRow>
                      )}

                      {!entitlementsQuery.isLoading &&
                        !entitlementData?.data.length && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="py-5 text-center text-muted-foreground"
                            >
                              Không có quyền lợi.
                            </TableCell>
                          </TableRow>
                        )}

                      {entitlementData?.data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            {item.featureName ?? "-"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {item.featureCode}
                          </TableCell>
                          <TableCell>
                            {item.periodStart ?? "-"} - {item.periodEnd ?? "-"}
                          </TableCell>
                          <TableCell>
                            {formatDateTime(item.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Lịch sử sử dụng</h4>
                  <p className="text-xs text-muted-foreground">
                    Tổng hợp mức sử dụng hiện tại theo từng quyền lợi: hạn mức từ gói,
                    số đã dùng và số còn lại được tính toán theo dữ liệu thực tế.
                  </p>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên tính năng</TableHead>
                        <TableHead>Mã tính năng</TableHead>
                        <TableHead className="text-right">Hạn mức</TableHead>
                        <TableHead className="text-right">Đã dùng</TableHead>
                        <TableHead className="text-right">Còn lại</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quotaQuery.isLoading && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-5 text-center text-muted-foreground"
                          >
                            Đang tải lịch sử sử dụng...
                          </TableCell>
                        </TableRow>
                      )}

                      {!quotaQuery.isLoading &&
                        !quotaData?.features.length && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-5 text-center text-muted-foreground"
                            >
                              Không có dữ liệu sử dụng.
                            </TableCell>
                          </TableRow>
                        )}

                      {quotaData?.features.flatMap((feature) => {
                        const baseRow = (
                          <TableRow key={feature.featureCode}>
                            <TableCell className="font-medium">
                              {feature.featureName ?? "-"}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {feature.featureCode}
                            </TableCell>
                            {feature.kind === "numeric" && (
                              <>
                                <TableCell className="text-right">
                                  {feature.limit}
                                </TableCell>
                                <TableCell className="text-right">
                                  {feature.used}
                                </TableCell>
                                <TableCell className="text-right">
                                  {feature.remaining}
                                </TableCell>
                              </>
                            )}
                            {feature.kind === "numeric_per_farm" && (
                              <>
                                <TableCell className="text-right">
                                  {feature.limit}
                                </TableCell>
                                <TableCell
                                  colSpan={2}
                                  className="text-right text-xs text-muted-foreground"
                                >
                                  Tính theo từng trang trại
                                </TableCell>
                              </>
                            )}
                            {feature.kind === "boolean" && (
                              <TableCell
                                colSpan={3}
                                className="text-right"
                              >
                                <Badge
                                  variant={
                                    feature.enabled ? "default" : "outline"
                                  }
                                >
                                  {feature.enabled ? "Bật" : "Tắt"}
                                </Badge>
                              </TableCell>
                            )}
                            {feature.kind === "raw" && (
                              <TableCell
                                colSpan={3}
                                className="text-right text-sm"
                              >
                                {feature.value}
                              </TableCell>
                            )}
                          </TableRow>
                        );

                        if (feature.kind === "numeric_per_farm") {
                          return [
                            baseRow,
                            ...feature.perFarm.map((row) => (
                              <TableRow
                                key={`${feature.featureCode}-${row.farmId}`}
                                className="bg-muted/30"
                              >
                                <TableCell
                                  colSpan={2}
                                  className="pl-8 text-xs text-muted-foreground"
                                >
                                  ↳ {row.farmName}
                                </TableCell>
                                <TableCell className="text-right">
                                  {feature.limit}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.used}
                                </TableCell>
                                <TableCell className="text-right">
                                  {row.remaining}
                                </TableCell>
                              </TableRow>
                            )),
                          ];
                        }
                        return [baseRow];
                      })}
                    </TableBody>
                  </Table>

                  {quotaData?.iotDevices && (
                    <div className="rounded-md border bg-muted/20 p-3 text-xs text-muted-foreground">
                      <p className="font-semibold text-foreground">
                        Thiết bị IoT
                      </p>
                      <p>
                        Hạn mức từ gói: {quotaData.iotDevices.subscriptionMax}
                        {quotaData.iotDevices.kitBonus > 0 &&
                          ` + ${quotaData.iotDevices.kitBonus} từ gói bổ trợ`}
                      </p>
                      <p>
                        Đã dùng: {quotaData.iotDevices.used} · Còn lại:{" "}
                        {quotaData.iotDevices.remaining}
                      </p>
                    </div>
                  )}
                </div>

                {!isAdmin && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <h4 className="text-sm font-semibold">Hóa đơn & thanh toán</h4>
                    {invoicesQuery.isLoading && (
                      <p className="text-sm text-muted-foreground">
                        Đang tải danh sách hóa đơn...
                      </p>
                    )}
                    {!invoicesQuery.isLoading && invoices.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Chưa có hóa đơn cho subscription này.
                      </p>
                    )}
                    {invoices.length > 0 && (
                      <div className="space-y-3">
                        <Select
                          value={selectedInvoice?.id ?? ""}
                          onValueChange={setSelectedInvoiceId}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Chọn hóa đơn" />
                          </SelectTrigger>
                          <SelectContent>
                            {invoices.map((invoice) => (
                              <SelectItem key={invoice.id} value={invoice.id}>
                                {invoice.invoiceNumber} - {invoice.status}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {selectedInvoice && (
                          <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                            <p>
                              Tổng tiền:{" "}
                              <span className="font-medium text-foreground">
                                {formatCurrency(selectedInvoice.totalAmount)}
                              </span>
                            </p>
                            <p>
                              Hạn thanh toán:{" "}
                              <span className="font-medium text-foreground">
                                {formatDateTime(selectedInvoice.dueDate)}
                              </span>
                            </p>
                            <p>
                              Trạng thái hóa đơn:{" "}
                              <span className="font-medium text-foreground">
                                {selectedInvoice.status}
                              </span>
                            </p>
                          </div>
                        )}
                        {selectedInvoice &&
                          ["OPEN", "DRAFT"].includes(selectedInvoice.status) && (
                            <Button
                              className="w-full"
                              onClick={handleCheckoutInvoice}
                              disabled={invoiceCheckoutMutation.isPending}
                            >
                              {invoiceCheckoutMutation.isPending
                                ? "Đang tạo link thanh toán..."
                                : "Thanh toán bằng PayOS"}
                            </Button>
                          )}
                        <div className="space-y-1 rounded-md border bg-muted/30 p-3 text-xs text-muted-foreground">
                          <p>
                            Trạng thái subscription realtime:{" "}
                            <span className="font-medium text-foreground">
                              {paymentStatusQuery.data?.data?.subscriptionStatus ??
                                detail?.status ??
                                "-"}
                            </span>
                          </p>
                          <p>
                            Giao dịch gần nhất:{" "}
                            <span className="font-medium text-foreground">
                              {paymentStatusQuery.data?.data?.latestTransaction
                                ?.status ?? "-"}
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isAdmin && (
                  <div className="space-y-3 rounded-lg border p-4">
                    <h4 className="text-sm font-semibold">Credit & gói bổ trợ</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {ownerCredits.map((credit) => (
                        <div key={credit.id} className="rounded-md border p-3">
                          <p className="text-xs text-muted-foreground">
                            {credit.creditType}
                          </p>
                          <p className="text-base font-semibold">{credit.balance}</p>
                        </div>
                      ))}
                      {!ownerCredits.length && (
                        <p className="text-sm text-muted-foreground">
                          Chưa có số dư credit.
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Gói bổ trợ khả dụng
                      </p>
                      {servicePackages.map((pkg) => (
                        <div
                          key={pkg.id}
                          className="flex items-center justify-between rounded-md border p-3"
                        >
                          <div>
                            <p className="text-sm font-medium">{pkg.name}</p>
                            <p className="text-xs text-muted-foreground">
                              +{pkg.creditAmount} {pkg.creditType} -{" "}
                              {formatCurrency(pkg.price)}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={purchaseServicePackageMutation.isPending}
                            onClick={() => handlePurchaseServicePackage(pkg.id)}
                          >
                            Mua
                          </Button>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">
                        Lịch sử credit gần đây
                      </p>
                      {ownerCreditHistory.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="grid grid-cols-3 gap-2 rounded-md border p-2 text-xs"
                        >
                          <span>{item.transactionType}</span>
                          <span>{item.amount}</span>
                          <span>{item.creditType}</span>
                        </div>
                      ))}
                      {!ownerCreditHistory.length && (
                        <p className="text-xs text-muted-foreground">
                          Chưa có lịch sử biến động.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <Dialog
        open={isCancelDialogOpen}
        onOpenChange={setIsCancelDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hủy đăng ký</DialogTitle>
            <DialogDescription>
              Hành động này sẽ chuyển trạng thái đăng ký sang ĐÃ HỦY.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={cancelForm.handleSubmit(handleCancelSubscription)}
          >
            <Controller
              name="cancelReason"
              control={cancelForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>Lý do hủy</FieldLabel>
                  <FieldContent>
                    <Textarea
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      placeholder="Nhập lý do hủy (không bắt buộc)"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCancelDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={cancelSubscriptionMutation.isPending}
              >
                Xác nhận hủy
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

    </div>
  );
}

export default SubscriptionLifecyclePanel;
