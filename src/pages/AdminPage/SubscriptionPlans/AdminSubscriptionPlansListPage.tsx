import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  getSubscriptionPlanStatusBadgeVariant,
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import {
  useAdminArchiveSubscriptionPlan,
  useAdminCreateSubscriptionPlan,
  useAdminUpdateSubscriptionPlan,
  useListSubscriptionPlans,
} from "@/queries/useSubscriptionPlan";
import {
  CreatePlanBodySchema,
  type CreatePlanBodyType,
  type ListPlansQueryType,
  type PlanStatusType,
  type PlanResType,
} from "@/schemaValidatation/subscriptionPlan";
import {
  CircleCheckBig,
  CircleSlash,
  Ellipsis,
  Eye,
  FilePlus2,
  Package,
  Pencil,
  Plus,
  Shield,
  Trash2,
} from "lucide-react";

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

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const toPlanFormValue = (plan: PlanResType): CreatePlanBodyType => ({
  code: plan.code,
  name: plan.name,
  description: plan.description ?? "",
  durationMonths: plan.durationMonths,
  listPrice: plan.listPrice,
});

function AdminSubscriptionPlansListPage() {
  const navigate = useNavigate();

  const [planQuery, setPlanQuery] = useState<ListPlansQueryType>({
    page: 1,
    limit: 10,
    search: undefined,
    status: undefined,
  });
  const [searchKeyword, setSearchKeyword] = useState("");
  const [activePlan, setActivePlan] = useState<PlanResType | null>(null);

  const [planDialogMode, setPlanDialogMode] =
    useState<PlanDialogMode>("create");
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
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

  const createPlanMutation = useAdminCreateSubscriptionPlan();
  const updatePlanMutation = useAdminUpdateSubscriptionPlan();
  const archivePlanMutation = useAdminArchiveSubscriptionPlan();

  const isPlanSubmitting =
    createPlanMutation.isPending || updatePlanMutation.isPending;

  const planForm = useForm<CreatePlanBodyType>({
    resolver: zodResolver(CreatePlanBodySchema),
    defaultValues: DEFAULT_PLAN_FORM,
  });

  useClearServerFieldErrors(planForm);

  const activePlansCount = useMemo(
    () => plans.filter((plan) => plan.status === "ACTIVE").length,
    [plans],
  );

  const openCreatePlanDialog = () => {
    setPlanDialogMode("create");
    setActivePlan(null);
    planForm.reset(DEFAULT_PLAN_FORM);
    setIsPlanDialogOpen(true);
  };

  const openEditPlanDialog = (plan: PlanResType) => {
    setPlanDialogMode("edit");
    setActivePlan(plan);
    planForm.reset(toPlanFormValue(plan));
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
        toast.success("Tạo gói đăng ký thành công.");
        navigate(`/dashboard/admin/subscription-plans/${result.data.id}`);
      } else {
        if (!activePlan?.id) {
          toast.error("Không tìm thấy gói cần cập nhật.");
          return;
        }

        await updatePlanMutation.mutateAsync({
          id: activePlan.id,
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
    if (!activePlan?.id) {
      toast.error("Không tìm thấy gói để lưu trữ.");
      return;
    }

    try {
      await archivePlanMutation.mutateAsync(activePlan.id);
      toast.success("Đã lưu trữ gói đăng ký.");
      setIsArchiveConfirmOpen(false);
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Lưu trữ gói thất bại."));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="pointer-events-none absolute inset-0 bg-primary/5" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2 flex w-fit items-center gap-1">
              <Shield className="h-3.5 w-3.5" />
              Quản trị viên
            </Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Quản lý gói đăng ký
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground md:text-base">
              Quản lý vòng đời gói, chỉnh sửa nội dung và điều hướng nhanh sang
              trang chi tiết hoặc tạo phiên bản mới.
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
          <Button
            onClick={openCreatePlanDialog}
            className="w-full md:w-auto"
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo gói đăng ký
          </Button>
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

      <Card>
        <CardHeader>
          <CardTitle>Danh sách gói</CardTitle>
          <CardDescription>
            Mỗi gói có menu hành động để xem chi tiết, chỉnh sửa hoặc tạo phiên
            bản mới.
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
                <TableHead className="w-[80px] text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {listPlansQuery.isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Đang tải dữ liệu gói đăng ký...
                  </TableCell>
                </TableRow>
              )}

              {!listPlansQuery.isLoading && plans.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-muted-foreground"
                  >
                    Không có dữ liệu gói đăng ký.
                  </TableCell>
                </TableRow>
              )}

              {plans.map((plan) => (
                <TableRow key={plan.id}>
                  <TableCell className="font-medium">{plan.code}</TableCell>
                  <TableCell>{plan.name}</TableCell>
                  <TableCell>{plan.durationMonths} tháng</TableCell>
                  <TableCell>{formatCurrency(plan.listPrice)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={getSubscriptionPlanStatusBadgeVariant(
                        plan.status,
                      )}
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
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Mở menu hành động"
                        >
                          <Ellipsis className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(
                              `/dashboard/admin/subscription-plans/${plan.id}`,
                            )
                          }
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Chi tiết gói
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openEditPlanDialog(plan)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Chỉnh sửa gói
                        </DropdownMenuItem>
                        {plan.status !== "ARCHIVED" && (
                          <DropdownMenuItem
                            onClick={() =>
                              navigate(
                                `/dashboard/admin/subscription-plans/${plan.id}/versions/new`,
                              )
                            }
                          >
                            <FilePlus2 className="mr-2 h-4 w-4" />
                            Tạo phiên bản mới
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            setActivePlan(plan);
                            setIsArchiveConfirmOpen(true);
                          }}
                          disabled={plan.status === "ARCHIVED"}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Lưu trữ gói
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

export default AdminSubscriptionPlansListPage;
