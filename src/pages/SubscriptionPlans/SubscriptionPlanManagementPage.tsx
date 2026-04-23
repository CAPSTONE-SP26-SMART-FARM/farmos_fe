import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import useDebounce from "@/hooks/useDebounce";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import {
  useAdminArchiveSubscriptionPlan,
  useAdminCreateSubscriptionPlan,
  useAdminCreateSubscriptionPlanVersion,
  useAdminUpdateSubscriptionPlan,
  useListSubscriptionPlans,
  useListSubscriptionPlanVersions,
  useResolveActivePlanVersion,
  useSubscriptionPlanDetail,
} from "@/queries/useSubscriptionPlan";
import {
  useOwnerCreateSubscription,
  useOwnerMySubscription,
} from "@/queries/useSubscription";
import {
  CreatePlanBodySchema,
  CreatePlanVersionBodySchema,
  type CreatePlanBodyType,
  type CreatePlanVersionBodyType,
  type ListPlanVersionsQueryType,
  type ListPlansQueryType,
  type PlanStatusType,
  type PlanResType,
} from "@/schemaValidatation/subscriptionPlan";
import {
  CircleCheckBig,
  CircleSlash,
  Eye,
  FilePlus2,
  Package,
  Pencil,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";

type PageMode = "admin" | "owner";

interface Props {
  mode: PageMode;
}

type PlanDialogMode = "create" | "edit";

const STATUS_OPTIONS: Array<{ value: "ALL" | PlanStatusType; label: string }> =
  [
    { value: "ALL", label: "Tất cả trạng thái" },
    { value: "ACTIVE", label: "Đang hoạt động" },
    { value: "ARCHIVED", label: "Đã lưu trữ" },
  ];

const PLAN_STATUS_LABEL: Record<PlanStatusType, string> = {
  ACTIVE: "Đang hoạt động",
  ARCHIVED: "Đã lưu trữ",
};

const DEFAULT_PLAN_FORM: CreatePlanBodyType = {
  code: "",
  name: "",
  description: "",
  durationMonths: 12,
  listPrice: 0,
};

const DEFAULT_VERSION_FORM: CreatePlanVersionBodyType = {
  changelog: "",
  features: [{ featureCode: "", value: "", note: "" }],
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const formatDateTimeVi = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return format(date, "dd/MM/yyyy HH:mm");
};

const toPlanFormValue = (plan: PlanResType): CreatePlanBodyType => ({
  code: plan.code,
  name: plan.name,
  description: plan.description ?? "",
  durationMonths: plan.durationMonths,
  listPrice: plan.listPrice,
});

function SubscriptionPlanManagementPage({ mode }: Props) {
  const isAdmin = mode === "admin";

  const [planQuery, setPlanQuery] = useState<ListPlansQueryType>({
    page: 1,
    limit: isAdmin ? 10 : 50,
    search: undefined,
    status: undefined,
  });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");

  const [versionQuery, setVersionQuery] = useState<ListPlanVersionsQueryType>({
    page: 1,
    limit: 5,
    search: undefined,
  });

  const [planDialogMode, setPlanDialogMode] =
    useState<PlanDialogMode>("create");
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isVersionDialogOpen, setIsVersionDialogOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);

  const debouncedSearchKeyword = useDebounce(searchKeyword, 400);

  useEffect(() => {
    setPlanQuery((prev) => ({
      ...prev,
      page: 1,
      search: debouncedSearchKeyword.trim() || undefined,
    }));
  }, [debouncedSearchKeyword]);

  const listPlansQuery = useListSubscriptionPlans(planQuery);
  const plansResult = listPlansQuery.data?.data;
  const plans = plansResult?.data ?? [];
  const plansMeta = plansResult?.meta;

  useEffect(() => {
    if (!plans.length) {
      setSelectedPlanId("");
      return;
    }

    const stillExists = plans.some((plan) => plan.id === selectedPlanId);
    if (!stillExists) {
      setSelectedPlanId(plans[0].id);
    }
  }, [plans, selectedPlanId]);

  const planDetailQuery = useSubscriptionPlanDetail(
    selectedPlanId,
    Boolean(selectedPlanId),
  );
  const selectedPlan = planDetailQuery.data?.data;

  useEffect(() => {
    setVersionQuery({ page: 1, limit: 5, search: undefined });
  }, [selectedPlanId]);

  const planVersionsQuery = useListSubscriptionPlanVersions(
    selectedPlanId,
    versionQuery,
    isAdmin && Boolean(selectedPlanId),
  );

  const versionsResult = planVersionsQuery.data?.data;
  const versions = versionsResult?.data ?? [];
  const versionsMeta = versionsResult?.meta;

  const createPlanMutation = useAdminCreateSubscriptionPlan();
  const updatePlanMutation = useAdminUpdateSubscriptionPlan();
  const archivePlanMutation = useAdminArchiveSubscriptionPlan();
  const createVersionMutation = useAdminCreateSubscriptionPlanVersion();
  const ownerMySubscription = useOwnerMySubscription(!isAdmin);
  const ownerCreateSubscriptionMutation = useOwnerCreateSubscription();
  const resolveActivePlanVersionMutation = useResolveActivePlanVersion();

  const mySubscription = ownerMySubscription.data?.data;
  const canOwnerSubscribe = !isAdmin && !mySubscription;

  const ownerPricingPlans = useMemo(
    () =>
      plans
        .filter((plan) => plan.status === "ACTIVE")
        .sort((a, b) => a.listPrice - b.listPrice),
    [plans],
  );

  const isPlanSubmitting =
    createPlanMutation.isPending || updatePlanMutation.isPending;

  const planForm = useForm<CreatePlanBodyType>({
    resolver: zodResolver(CreatePlanBodySchema),
    defaultValues: DEFAULT_PLAN_FORM,
  });

  const versionForm = useForm<CreatePlanVersionBodyType>({
    resolver: zodResolver(CreatePlanVersionBodySchema),
    defaultValues: DEFAULT_VERSION_FORM,
  });

  const { fields, append, remove } = useFieldArray({
    control: versionForm.control,
    name: "features",
  });

  useClearServerFieldErrors(planForm);
  useClearServerFieldErrors(versionForm);

  const activePlansCount = useMemo(
    () => plans.filter((plan) => plan.status === "ACTIVE").length,
    [plans],
  );

  const openCreatePlanDialog = () => {
    setPlanDialogMode("create");
    planForm.reset(DEFAULT_PLAN_FORM);
    setIsPlanDialogOpen(true);
  };

  const openEditPlanDialog = () => {
    if (!selectedPlan) {
      toast.error("Vui lòng chọn một gói để chỉnh sửa.");
      return;
    }
    setPlanDialogMode("edit");
    planForm.reset(toPlanFormValue(selectedPlan));
    setIsPlanDialogOpen(true);
  };

  const handleSubmitPlan = async (values: CreatePlanBodyType) => {
    const payload: CreatePlanBodyType = {
      ...values,
      code: values.code.trim(),
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
    };

    try {
      if (planDialogMode === "create") {
        const result = await createPlanMutation.mutateAsync(payload);
        setSelectedPlanId(result.data.id);
        toast.success("Tạo gói đăng ký thành công.");
      } else {
        if (!selectedPlanId) {
          toast.error("Không tìm thấy gói cần cập nhật.");
          return;
        }

        await updatePlanMutation.mutateAsync({
          id: selectedPlanId,
          data: {
            name: payload.name,
            description: payload.description,
            durationMonths: payload.durationMonths,
            listPrice: payload.listPrice,
          },
        });
        toast.success("Cập nhật gói đăng ký thành công.");
      }

      setIsPlanDialogOpen(false);
      planForm.reset(DEFAULT_PLAN_FORM);
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<CreatePlanBodyType>(error)) {
        handleApiErrorUnprocessentity<CreatePlanBodyType>(
          error.response!.data.errors,
          planForm.setError,
          { getValues: planForm.getValues },
        );
        return;
      }

      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Thao tác thất bại.");
        return;
      }

      toast.error(getApiErrorMessageVi(error, "Thao tác thất bại."));
    }
  };

  const handleArchivePlan = async () => {
    if (!selectedPlanId) {
      toast.error("Không tìm thấy gói để lưu trữ.");
      return;
    }

    try {
      await archivePlanMutation.mutateAsync(selectedPlanId);
      toast.success("Đã lưu trữ gói đăng ký.");
      setIsArchiveConfirmOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Lưu trữ gói thất bại."));
    }
  };

  const handleSubmitVersion = async (values: CreatePlanVersionBodyType) => {
    if (!selectedPlanId) {
      toast.error("Vui lòng chọn gói trước khi tạo phiên bản.");
      return;
    }

    try {
      await createVersionMutation.mutateAsync({
        planId: selectedPlanId,
        data: {
          changelog: values.changelog?.trim() || undefined,
          features: values.features.map((feature) => ({
            featureCode: feature.featureCode.trim(),
            value: feature.value.trim(),
            note: feature.note?.trim() || undefined,
          })),
        },
      });

      toast.success("Tạo phiên bản gói thành công.");
      setIsVersionDialogOpen(false);
      versionForm.reset(DEFAULT_VERSION_FORM);
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<CreatePlanVersionBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<CreatePlanVersionBodyType>(
          error.response!.data.errors,
          versionForm.setError,
          { getValues: versionForm.getValues },
        );
        return;
      }

      toast.error(getApiErrorMessageVi(error, "Tạo phiên bản thất bại."));
    }
  };

  const handleOwnerSubscribePlan = async (planId: string) => {
    if (!planId) {
      toast.error("Vui lòng chọn gói để đăng ký.");
      return;
    }

    try {
      const activeVersion =
        await resolveActivePlanVersionMutation.mutateAsync(planId);

      const checkout = await ownerCreateSubscriptionMutation.mutateAsync({
        planVersionId: activeVersion.id,
      });
      setSelectedPlanId(planId);
      toast.success(
        `Tạo đăng ký thành công. Mã hóa đơn: ${checkout.data.invoiceNumber}`,
      );
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Đăng ký gói thất bại."));
    }
  };

  if (!isAdmin) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
        <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-transparent" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <Badge className="mb-2 flex w-fit items-center gap-1">
                <Eye className="h-3.5 w-3.5" />
                Chủ trang trại
              </Badge>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Bảng giá gói đăng ký
              </h1>
              <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
                Chọn gói phù hợp để nâng cấp vận hành. Dữ liệu gói hiển thị tối
                đa 50 bản ghi trong một lần tải.
              </p>
            </div>
            <div className="rounded-xl border bg-background/80 px-4 py-3 text-sm backdrop-blur-sm">
              <div className="flex items-center gap-2 font-medium">
                <Package className="h-4 w-4 text-primary" />
                {ownerPricingPlans.length} gói đang mở
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Gói hiện tại: {mySubscription?.plan?.name ?? "Chưa có"}
              </p>
            </div>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Tìm kiếm gói</CardTitle>
            <CardDescription>
              Dùng từ khóa theo mã hoặc tên gói để lọc nhanh.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Tìm theo mã hoặc tên gói..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </CardContent>
        </Card>

        {ownerMySubscription.isLoading && (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Đang tải gói đăng ký hiện tại...
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {listPlansQuery.isLoading && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Đang tải bảng giá gói đăng ký...
              </CardContent>
            </Card>
          )}

          {!listPlansQuery.isLoading && ownerPricingPlans.length === 0 && (
            <Card className="md:col-span-2 xl:col-span-3">
              <CardContent className="py-6 text-center text-sm text-muted-foreground">
                Không có gói đăng ký nào khả dụng.
              </CardContent>
            </Card>
          )}

          {ownerPricingPlans.map((plan) => {
            const isCurrentPlan = mySubscription?.planId === plan.id;
            const canSubscribeThisPlan =
              canOwnerSubscribe && !isCurrentPlan && plan.status === "ACTIVE";

            return (
              <Card
                key={plan.id}
                className="relative overflow-hidden border-2 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-primary/70 to-primary/20" />
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    {isCurrentPlan && <Badge>Đang dùng</Badge>}
                  </div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    {plan.code}
                  </p>
                  <div>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(plan.listPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      / {plan.durationMonths} tháng
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="min-h-12 text-sm text-muted-foreground">
                    {plan.description ||
                      "Gói tiêu chuẩn cho nhu cầu vận hành nông trại."}
                  </p>

                  {canSubscribeThisPlan && (
                    <Button
                      className="w-full"
                      onClick={() => handleOwnerSubscribePlan(plan.id)}
                      disabled={
                        ownerCreateSubscriptionMutation.isPending ||
                        resolveActivePlanVersionMutation.isPending
                      }
                    >
                      {ownerCreateSubscriptionMutation.isPending ||
                      resolveActivePlanVersionMutation.isPending
                        ? "Đang đăng ký..."
                        : "Đăng ký gói này"}
                    </Button>
                  )}

                  {isCurrentPlan && (
                    <p className="text-xs font-medium text-primary">
                      Đây là gói bạn đang sử dụng.
                    </p>
                  )}

                  {!canOwnerSubscribe && !isCurrentPlan && (
                    <p className="text-xs text-muted-foreground">
                      Bạn đang có đăng ký đang hoạt động hoặc chờ xử lý, không
                      thể tạo đăng ký mới.
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-transparent" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2 flex w-fit items-center gap-1">
              {isAdmin ? (
                <Shield className="h-3.5 w-3.5" />
              ) : (
                <Eye className="h-3.5 w-3.5" />
              )}
              {isAdmin ? "Quản trị viên" : "Chủ trang trại"}
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Quản lý gói đăng ký
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
              {isAdmin
                ? "Bạn có quyền xem, tạo, cập nhật, lưu trữ gói và quản lý phiên bản của từng gói đăng ký."
                : "Bạn có quyền xem danh sách và chi tiết gói đăng ký đang cung cấp cho hệ thống."}
            </p>
          </div>
          <div className="rounded-xl border bg-background/80 px-4 py-3 text-sm backdrop-blur-sm">
            <div className="flex items-center gap-2 font-medium">
              <Package className="h-4 w-4 text-primary" />
              {plansMeta?.totalItems ?? 0} gói
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Đang hoạt động: {activePlansCount}
            </p>
          </div>
        </div>
      </section>

      <Card>
        <CardHeader className="gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Bộ lọc danh sách</CardTitle>
            <CardDescription>
              Tìm nhanh theo tên/mã gói và lọc theo trạng thái.
            </CardDescription>
          </div>
          {isAdmin && (
            <Button
              onClick={openCreatePlanDialog}
              className="w-full md:w-auto"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo gói đăng ký
            </Button>
          )}
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <Input
            placeholder="Tìm theo mã hoặc tên gói..."
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />

          <Select
            value={planQuery.status ?? "ALL"}
            onValueChange={(value) =>
              setPlanQuery((prev) => ({
                ...prev,
                page: 1,
                status: value === "ALL" ? undefined : (value as PlanStatusType),
              }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn trạng thái" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem
                  key={status.value}
                  value={status.value}
                >
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>Danh sách gói</CardTitle>
            <CardDescription>
              Nhấn vào một dòng để xem chi tiết.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã gói</TableHead>
                  <TableHead>Tên gói</TableHead>
                  <TableHead>Thời hạn</TableHead>
                  <TableHead>Giá niêm yết</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listPlansQuery.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Đang tải dữ liệu gói đăng ký...
                    </TableCell>
                  </TableRow>
                )}

                {!listPlansQuery.isLoading && plans.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Không có dữ liệu gói đăng ký.
                    </TableCell>
                  </TableRow>
                )}

                {plans.map((plan) => (
                  <TableRow
                    key={plan.id}
                    className="cursor-pointer"
                    data-state={
                      selectedPlanId === plan.id ? "selected" : undefined
                    }
                    onClick={() => setSelectedPlanId(plan.id)}
                  >
                    <TableCell className="font-medium">{plan.code}</TableCell>
                    <TableCell>{plan.name}</TableCell>
                    <TableCell>{plan.durationMonths} tháng</TableCell>
                    <TableCell>{formatCurrency(plan.listPrice)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          plan.status === "ACTIVE" ? "default" : "secondary"
                        }
                        className="gap-1"
                      >
                        {plan.status === "ACTIVE" ? (
                          <CircleCheckBig className="h-3 w-3" />
                        ) : (
                          <CircleSlash className="h-3 w-3" />
                        )}
                        {PLAN_STATUS_LABEL[plan.status]}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Trang {plansMeta?.page ?? 1}/{plansMeta?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!plansMeta?.hasPreviousPage}
                  onClick={() =>
                    setPlanQuery((prev) => ({
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
                  disabled={!plansMeta?.hasNextPage}
                  onClick={() =>
                    setPlanQuery((prev) => ({
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

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Chi tiết gói đã chọn</CardTitle>
            <CardDescription>
              {isAdmin
                ? "Bạn có thể chỉnh sửa hoặc lưu trữ gói từ khu vực này."
                : "Bạn đang ở chế độ chỉ xem theo quyền Owner."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedPlanId && (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Chưa có gói nào được chọn.
              </p>
            )}

            {selectedPlanId && planDetailQuery.isLoading && (
              <p className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                Đang tải chi tiết gói...
              </p>
            )}

            {selectedPlan && (
              <>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-xs text-muted-foreground">Mã gói</p>
                  <p className="text-base font-semibold">{selectedPlan.code}</p>
                  <p className="mt-3 text-xs text-muted-foreground">Tên gói</p>
                  <p className="text-base font-semibold">{selectedPlan.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">Thời hạn</p>
                    <p className="font-medium">
                      {selectedPlan.durationMonths} tháng
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs text-muted-foreground">
                      Giá niêm yết
                    </p>
                    <p className="font-medium">
                      {formatCurrency(selectedPlan.listPrice)}
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Mô tả</p>
                  <p className="text-sm">
                    {selectedPlan.description || "Chưa có mô tả cho gói này."}
                  </p>
                </div>

                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">
                    Cập nhật gần nhất
                  </p>
                  <p className="text-sm">
                    {formatDateTimeVi(selectedPlan.updatedAt)}
                  </p>
                </div>

                {isAdmin && (
                  <div className="grid gap-2">
                    <Button
                      variant="outline"
                      onClick={openEditPlanDialog}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Chỉnh sửa gói
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        versionForm.reset(DEFAULT_VERSION_FORM);
                        setIsVersionDialogOpen(true);
                      }}
                    >
                      <FilePlus2 className="mr-2 h-4 w-4" />
                      Tạo phiên bản mới
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setIsArchiveConfirmOpen(true)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Lưu trữ gói
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {isAdmin && selectedPlanId && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử phiên bản</CardTitle>
            <CardDescription>
              Chỉ Admin có quyền xem và tạo phiên bản của gói.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phiên bản</TableHead>
                  <TableHead>Hiệu lực từ</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Số tính năng</TableHead>
                  <TableHead>Ghi chú thay đổi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planVersionsQuery.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Đang tải phiên bản...
                    </TableCell>
                  </TableRow>
                )}

                {!planVersionsQuery.isLoading && versions.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Chưa có phiên bản nào.
                    </TableCell>
                  </TableRow>
                )}

                {versions.map((version) => (
                  <TableRow key={version.id}>
                    <TableCell className="font-medium">
                      v{version.versionNo}
                    </TableCell>
                    <TableCell>
                      {formatDateTimeVi(version.effectiveFrom)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={version.isActive ? "default" : "secondary"}
                      >
                        {version.isActive ? "Đang áp dụng" : "Không áp dụng"}
                      </Badge>
                    </TableCell>
                    <TableCell>{version.features.length}</TableCell>
                    <TableCell>{version.changelog || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Trang {versionsMeta?.page ?? 1}/{versionsMeta?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!versionsMeta?.hasPreviousPage}
                  onClick={() =>
                    setVersionQuery((prev) => ({
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
                  disabled={!versionsMeta?.hasNextPage}
                  onClick={() =>
                    setVersionQuery((prev) => ({
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
      )}

      <Dialog
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {planDialogMode === "create"
                ? "Tạo gói đăng ký mới"
                : "Cập nhật gói đăng ký"}
            </DialogTitle>
            <DialogDescription>
              {planDialogMode === "create"
                ? "Thiết lập thông tin cơ bản cho gói đăng ký mới."
                : "Bạn chỉ có thể cập nhật tên, mô tả, thời hạn và giá niêm yết."}
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={planForm.handleSubmit(handleSubmitPlan)}
          >
            <Controller
              name="code"
              control={planForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="plan-code">Mã gói</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="plan-code"
                      placeholder="ví dụ: STARTER_12M"
                      disabled={planDialogMode === "edit"}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="name"
              control={planForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="plan-name">Tên gói</FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="plan-name"
                      placeholder="ví dụ: Khởi động 12 tháng"
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
            />

            <Controller
              name="description"
              control={planForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="plan-description">Mô tả</FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="plan-description"
                      value={field.value ?? ""}
                      placeholder="Mô tả phạm vi áp dụng của gói..."
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <Controller
                name="durationMonths"
                control={planForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="duration-months">
                      Thời hạn (tháng)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="duration-months"
                        type="number"
                        min={1}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value))
                        }
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </FieldContent>
                  </Field>
                )}
              />

              <Controller
                name="listPrice"
                control={planForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="list-price">
                      Giá niêm yết (VND)
                    </FieldLabel>
                    <FieldContent>
                      <Input
                        id="list-price"
                        type="number"
                        min={0}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(Number(event.target.value))
                        }
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </FieldContent>
                  </Field>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPlanDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={isPlanSubmitting}
              >
                {isPlanSubmitting
                  ? "Đang lưu..."
                  : planDialogMode === "create"
                    ? "Tạo gói"
                    : "Lưu cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isVersionDialogOpen}
        onOpenChange={setIsVersionDialogOpen}
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tạo phiên bản mới</DialogTitle>
            <DialogDescription>
              Mỗi phiên bản cần tối thiểu một dòng tính năng (featureCode +
              value).
            </DialogDescription>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={versionForm.handleSubmit(handleSubmitVersion)}
          >
            <Controller
              name="changelog"
              control={versionForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="version-changelog">
                    Ghi chú thay đổi
                  </FieldLabel>
                  <FieldContent>
                    <Textarea
                      id="version-changelog"
                      value={field.value ?? ""}
                      placeholder="Mô tả thay đổi chính của phiên bản này..."
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </FieldContent>
                </Field>
              )}
            />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Danh sách tính năng</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    append({ featureCode: "", value: "", note: "" })
                  }
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Thêm dòng
                </Button>
              </div>

              {fields.map((item, index) => (
                <div
                  key={item.id}
                  className="grid gap-3 rounded-lg border p-3"
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <Controller
                      name={`features.${index}.featureCode`}
                      control={versionForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Mã tính năng</FieldLabel>
                          <FieldContent>
                            <Input
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="ví dụ: max_iot_devices"
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                          </FieldContent>
                        </Field>
                      )}
                    />

                    <Controller
                      name={`features.${index}.value`}
                      control={versionForm.control}
                      render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel>Giá trị</FieldLabel>
                          <FieldContent>
                            <Input
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="ví dụ: 30"
                              aria-invalid={fieldState.invalid}
                            />
                            <FieldError errors={[fieldState.error]} />
                          </FieldContent>
                        </Field>
                      )}
                    />
                  </div>

                  <Controller
                    name={`features.${index}.note`}
                    control={versionForm.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Ghi chú</FieldLabel>
                        <FieldContent>
                          <Input
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            placeholder="Ghi chú thêm cho tính năng (không bắt buộc)"
                            aria-invalid={fieldState.invalid}
                          />
                          <FieldError errors={[fieldState.error]} />
                        </FieldContent>
                      </Field>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      Xóa dòng
                    </Button>
                  </div>
                </div>
              ))}

              {typeof versionForm.formState.errors.features?.message ===
                "string" && (
                <p className="text-sm text-destructive">
                  {versionForm.formState.errors.features.message}
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsVersionDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={createVersionMutation.isPending}
              >
                {createVersionMutation.isPending
                  ? "Đang tạo..."
                  : "Tạo phiên bản"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isArchiveConfirmOpen}
        title="Lưu trữ gói đăng ký"
        description="Sau khi lưu trữ, gói sẽ chuyển sang trạng thái ARCHIVED và không còn dùng cho luồng kích hoạt mới."
        confirmLabel="Xác nhận lưu trữ"
        cancelLabel="Hủy"
        variant="destructive"
        onCancel={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleArchivePlan}
      />
    </div>
  );
}

export default SubscriptionPlanManagementPage;
