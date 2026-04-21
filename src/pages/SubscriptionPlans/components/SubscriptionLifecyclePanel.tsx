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
  useAdminForceUpgradePlanVersion,
  useAdminListSubscriptions,
  useOwnerMySubscription,
  useOwnerRenewSubscription,
  useOwnerToggleAutoRenew,
  useSubscriptionCancel,
  useSubscriptionDetail,
  useSubscriptionEntitlements,
  useSubscriptionUsageLedger,
} from "@/queries/useSubscription";
import {
  CancelSubscriptionBodySchema,
  type EntitlementsQueryType,
  type ListSubscriptionsQueryType,
  type SubscriptionStatusType,
  ToggleAutoRenewBodySchema,
  UpgradePlanVersionBodySchema,
  type UsageLedgerQueryType,
} from "@/schemaValidatation/subscription";
import {
  ArrowLeft,
  CircleSlash,
  ListChecks,
  RefreshCw,
  RotateCcw,
  Shield,
  Sparkle,
  User,
} from "lucide-react";

type PageMode = "admin" | "owner";

interface Props {
  mode: PageMode;
  detailOnly?: boolean;
  initialSubscriptionId?: string;
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

function SubscriptionLifecyclePanel({
  mode,
  detailOnly = false,
  initialSubscriptionId,
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
    ownerId: undefined,
  });

  const [ownerIdInput, setOwnerIdInput] = useState("");
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(
    initialSubscriptionId ?? "",
  );
  const shouldFetchDetail = detailOnly && Boolean(selectedSubscriptionId);
  const shouldFetchOwnerPanels = !isAdmin && Boolean(selectedSubscriptionId);

  const [entitlementQuery, setEntitlementQuery] =
    useState<EntitlementsQueryType>({
      page: 1,
      limit: 5,
      search: undefined,
    });

  const [usageQuery, setUsageQuery] = useState<UsageLedgerQueryType>({
    page: 1,
    limit: 5,
    search: undefined,
    featureCode: undefined,
  });

  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

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
    setUsageQuery({
      page: 1,
      limit: 5,
      search: undefined,
      featureCode: undefined,
    });
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

  const usageLedgerQuery = useSubscriptionUsageLedger(
    selectedSubscriptionId,
    usageQuery,
    shouldFetchDetail || shouldFetchOwnerPanels,
  );

  const renewSubscriptionMutation = useOwnerRenewSubscription();
  const cancelSubscriptionMutation = useSubscriptionCancel();
  const toggleAutoRenewMutation = useOwnerToggleAutoRenew();
  const forceUpgradeMutation = useAdminForceUpgradePlanVersion();

  const cancelForm = useForm({
    resolver: zodResolver(CancelSubscriptionBodySchema),
    defaultValues: {
      cancelReason: "",
    },
  });

  const toggleAutoRenewForm = useForm({
    resolver: zodResolver(ToggleAutoRenewBodySchema),
    defaultValues: {
      autoRenew: false,
    },
  });

  const upgradeForm = useForm({
    resolver: zodResolver(UpgradePlanVersionBodySchema),
    defaultValues: {
      planVersionId: "",
    },
  });

  useClearServerFieldErrors(cancelForm);
  useClearServerFieldErrors(toggleAutoRenewForm);
  useClearServerFieldErrors(upgradeForm);

  const detail =
    !isAdmin && !detailOnly
      ? ownerMySubscription.data?.data
      : selectedSubscriptionDetail.data?.data;
  const isDetailLoading =
    !isAdmin && !detailOnly
      ? ownerMySubscription.isLoading
      : selectedSubscriptionDetail.isLoading;
  const entitlementData = entitlementsQuery.data?.data;
  const usageData = usageLedgerQuery.data?.data;

  useEffect(() => {
    if (detail) {
      toggleAutoRenewForm.reset({ autoRenew: detail.autoRenew });
    }
  }, [detail, toggleAutoRenewForm]);

  const handleOwnerIdFilter = () => {
    const ownerId = ownerIdInput.trim();
    setAdminQuery((prev) => ({
      ...prev,
      page: 1,
      ownerId: ownerId || undefined,
    }));
  };

  const handleRenewSubscription = async () => {
    if (!selectedSubscriptionId) return;

    try {
      await renewSubscriptionMutation.mutateAsync(selectedSubscriptionId);
      toast.success("Yêu cầu gia hạn đã được ghi nhận.");
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Gia hạn đăng ký thất bại."));
    }
  };

  const handleToggleAutoRenew = async (values: { autoRenew: boolean }) => {
    if (!selectedSubscriptionId) return;

    try {
      await toggleAutoRenewMutation.mutateAsync({
        id: selectedSubscriptionId,
        data: values,
      });
      toast.success("Cập nhật tự động gia hạn thành công.");
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          toggleAutoRenewForm.setError,
          { getValues: toggleAutoRenewForm.getValues },
        );
        return;
      }
      toast.error(
        getApiErrorMessageVi(error, "Cập nhật tự động gia hạn thất bại."),
      );
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

  const handleForceUpgrade = async (values: { planVersionId: string }) => {
    if (!selectedSubscriptionId) return;

    try {
      await forceUpgradeMutation.mutateAsync({
        id: selectedSubscriptionId,
        data: values,
      });
      toast.success("Nâng cấp phiên bản gói thành công.");
      setIsUpgradeDialogOpen(false);
      upgradeForm.reset({ planVersionId: "" });
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          upgradeForm.setError,
          { getValues: upgradeForm.getValues },
        );
        return;
      }
      toast.error(getApiErrorMessageVi(error, "Nâng cấp gói thất bại."));
    }
  };

  const openDetailPage = (subscriptionId: string) => {
    navigate(`${subscriptionBasePath}/${subscriptionId}`);
  };

  const backToListPage = () => {
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
              {isAdmin ? "Vòng đời đăng ký" : "Gói đăng ký của tôi"}
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
                  placeholder="Lọc theo ID chủ trại (UUID)"
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
                      <TableHead>Chủ trại</TableHead>
                      <TableHead>Gói</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Tự động gia hạn</TableHead>
                      <TableHead className="text-right">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adminListSubscriptions.isLoading && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
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
                            colSpan={6}
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
                        <TableCell>{item.autoRenew ? "Bật" : "Tắt"}</TableCell>
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
          {detailOnly && (
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
                <CardTitle>Chi tiết đăng ký</CardTitle>
                <CardDescription>
                  {isAdmin
                    ? "Quản trị viên có thể hủy hoặc ép nâng cấp phiên bản gói."
                    : "Chủ trang trại có thể gia hạn, bật/tắt tự động gia hạn và hủy đăng ký."}
                </CardDescription>
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
                    <div className="space-y-3 rounded-lg border p-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Mã đăng ký
                        </p>
                        <p className="font-medium break-all">{detail.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Trạng thái
                        </p>
                        <Badge
                          variant={getSubscriptionStatusBadgeVariant(
                            detail.status,
                          )}
                        >
                          {SUBSCRIPTION_STATUS_LABEL[detail.status]}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Gói</p>
                        <p className="font-medium">
                          {detail.plan?.name ?? "-"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Ngày bắt đầu
                        </p>
                        <p>{formatDateTime(detail.startedAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Ngày hết hạn
                        </p>
                        <p>{formatDateTime(detail.expiresAt)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Tự động gia hạn
                        </p>
                        <p>{detail.autoRenew ? "Bật" : "Tắt"}</p>
                      </div>
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

                        <form
                          className="space-y-2 rounded-lg border p-3"
                          onSubmit={toggleAutoRenewForm.handleSubmit(
                            handleToggleAutoRenew,
                          )}
                        >
                          <Controller
                            name="autoRenew"
                            control={toggleAutoRenewForm.control}
                            render={({ field, fieldState }) => (
                              <Field data-invalid={fieldState.invalid}>
                                <FieldLabel>Bật tự động gia hạn</FieldLabel>
                                <FieldContent>
                                  <Select
                                    value={field.value ? "true" : "false"}
                                    onValueChange={(value) =>
                                      field.onChange(value === "true")
                                    }
                                  >
                                    <SelectTrigger className="w-full">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="true">Bật</SelectItem>
                                      <SelectItem value="false">Tắt</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FieldError errors={[fieldState.error]} />
                                </FieldContent>
                              </Field>
                            )}
                          />

                          <Button
                            type="submit"
                            size="sm"
                            disabled={toggleAutoRenewMutation.isPending}
                          >
                            <Sparkle className="mr-2 h-4 w-4" />
                            Cập nhật tự động gia hạn
                          </Button>
                        </form>

                        <Button
                          variant="destructive"
                          onClick={() => setIsCancelDialogOpen(true)}
                        >
                          <CircleSlash className="mr-2 h-4 w-4" />
                          Hủy đăng ký
                        </Button>
                      </div>
                    )}

                    {isAdmin && (
                      <div className="grid gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsUpgradeDialogOpen(true)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          Ép nâng cấp phiên bản gói
                        </Button>
                        {detail.status !== "CANCELLED" && (
                          <Button
                            variant="destructive"
                            onClick={() => setIsCancelDialogOpen(true)}
                          >
                            <CircleSlash className="mr-2 h-4 w-4" />
                            Hủy đăng ký
                          </Button>
                        )}
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
                  Cả Admin và Owner đều có quyền xem quyền lợi và lịch sử sử
                  dụng của đăng ký hợp lệ.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Danh sách quyền lợi</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tính năng</TableHead>
                        <TableHead>Giá trị</TableHead>
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
                          <TableCell>{item.featureCode}</TableCell>
                          <TableCell>{item.value}</TableCell>
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
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold">Lịch sử sử dụng</h4>
                    <Input
                      className="max-w-xs"
                      placeholder="Lọc theo mã tính năng"
                      value={usageQuery.featureCode ?? ""}
                      onChange={(event) =>
                        setUsageQuery((prev) => ({
                          ...prev,
                          page: 1,
                          featureCode: event.target.value || undefined,
                        }))
                      }
                    />
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tính năng</TableHead>
                        <TableHead>Biến động</TableHead>
                        <TableHead>Ngữ cảnh</TableHead>
                        <TableHead>Ghi chú</TableHead>
                        <TableHead>Thời gian</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usageLedgerQuery.isLoading && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="py-5 text-center text-muted-foreground"
                          >
                            Đang tải lịch sử sử dụng...
                          </TableCell>
                        </TableRow>
                      )}

                      {!usageLedgerQuery.isLoading &&
                        !usageData?.data.length && (
                          <TableRow>
                            <TableCell
                              colSpan={5}
                              className="py-5 text-center text-muted-foreground"
                            >
                              Không có lịch sử sử dụng.
                            </TableCell>
                          </TableRow>
                        )}

                      {usageData?.data.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>{item.featureCode}</TableCell>
                          <TableCell>{item.delta}</TableCell>
                          <TableCell>
                            {item.contextEntity ?? "-"}
                            {item.contextId ? ` (${item.contextId})` : ""}
                          </TableCell>
                          <TableCell>{item.note ?? "-"}</TableCell>
                          <TableCell>
                            {formatDateTime(item.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
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

      <Dialog
        open={isUpgradeDialogOpen}
        onOpenChange={setIsUpgradeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ép nâng cấp phiên bản gói</DialogTitle>
            <DialogDescription>
              Chỉ quản trị viên có quyền cập nhật ID phiên bản gói cho đăng ký.
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={upgradeForm.handleSubmit(handleForceUpgrade)}
          >
            <Controller
              name="planVersionId"
              control={upgradeForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel>ID phiên bản gói</FieldLabel>
                  <FieldContent>
                    <Input
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Nhập UUID của phiên bản gói"
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
                onClick={() => setIsUpgradeDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={forceUpgradeMutation.isPending}
              >
                Xác nhận nâng cấp
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default SubscriptionLifecyclePanel;
