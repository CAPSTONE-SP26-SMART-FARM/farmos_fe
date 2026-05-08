import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import EmptyState from "@/components/common/EmptyState";
import TableSkeleton from "@/components/common/TableSkeleton";
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
  Archive,
  CircleCheckBig,
  CircleSlash,
  Ellipsis,
  Eye,
  Info,
  Package,
  Plus,
  Shield,
  X,
} from "lucide-react";

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

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

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
  const archivePlanMutation = useAdminArchiveSubscriptionPlan();

  const planForm = useForm<CreatePlanBodyType>({
    resolver: zodResolver(CreatePlanBodySchema),
    defaultValues: DEFAULT_PLAN_FORM,
  });

  useClearServerFieldErrors(planForm);

  const activePlansCount = useMemo(
    () => plans.filter((plan) => plan.status === "ACTIVE").length,
    [plans],
  );

  const isFiltered =
    searchKeyword.trim() !== "" || planQuery.status !== undefined;

  const clearFilters = () => {
    setSearchKeyword("");
    setPlanQuery((prev) => ({
      ...prev,
      page: 1,
      search: undefined,
      status: undefined,
    }));
  };

  const openCreatePlanDialog = () => {
    planForm.reset(DEFAULT_PLAN_FORM);
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
      const result = await createPlanMutation.mutateAsync(payload);
      toast.success("Tạo gói đăng ký thành công.");
      setIsPlanDialogOpen(false);
      planForm.reset(DEFAULT_PLAN_FORM);
      navigate(`/dashboard/admin/subscription-plans/${result.data.id}`);
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
              Quản lý vòng đời gói và điều hướng nhanh sang trang chi tiết hoặc
              tạo phiên bản mới.
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
        <CardHeader>
          <CardTitle>Bộ lọc danh sách</CardTitle>
          <CardDescription>
            Tìm nhanh theo tên/mã gói và lọc theo trạng thái.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <InputGroup>
            <InputGroupInput
              placeholder="Tìm theo mã hoặc tên gói..."
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
            {searchKeyword.length > 0 && (
              <InputGroupAddon align="inline-end">
                <InputGroupButton onClick={() => setSearchKeyword("")}>
                  <X />
                </InputGroupButton>
              </InputGroupAddon>
            )}
          </InputGroup>

          <Select
            value={planQuery.status ?? "ALL"}
            onValueChange={(value) =>
              setPlanQuery((prev) => ({
                ...prev,
                page: 1,
                status:
                  value === "ALL" ? undefined : (value as PlanStatusType),
              }))
            }
          >
            <SelectTrigger className="w-full max-w-xs">
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
            Mỗi gói có menu hành động để xem chi tiết hoặc lưu trữ. Thay đổi
            tính năng và giá thực hiện qua tạo phiên bản mới.
          </CardDescription>
          <CardAction>
            <Button
              onClick={openCreatePlanDialog}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo gói đăng ký
            </Button>
          </CardAction>
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
              {listPlansQuery.isLoading ? (
                <TableSkeleton />
              ) : plans.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-0"
                  >
                    <EmptyState
                      icon={Package}
                      title={
                        isFiltered
                          ? "Không tìm thấy gói nào phù hợp"
                          : "Chưa có gói đăng ký nào"
                      }
                      description={
                        isFiltered
                          ? "Thử xoá bộ lọc để xem tất cả gói."
                          : "Bắt đầu bằng cách tạo gói đăng ký đầu tiên."
                      }
                      action={
                        isFiltered
                          ? { label: "Xoá bộ lọc", onClick: clearFilters }
                          : {
                              label: "Tạo gói đăng ký",
                              onClick: openCreatePlanDialog,
                            }
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
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
                            onClick={() => {
                              setActivePlan(plan);
                              setIsArchiveConfirmOpen(true);
                            }}
                            disabled={plan.status === "ARCHIVED"}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Lưu trữ gói
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {!listPlansQuery.isLoading && plans.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Tổng {plansMeta?.totalItems ?? 0} gói</span>
                <span>·</span>
                <span>
                  Trang {plansMeta?.page ?? 1}/{plansMeta?.totalPages ?? 1}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Select
                  value={String(planQuery.limit ?? 10)}
                  onValueChange={(value) =>
                    setPlanQuery((prev) => ({
                      ...prev,
                      page: 1,
                      limit: Number(value),
                    }))
                  }
                >
                  <SelectTrigger className="w-[110px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem
                        key={size}
                        value={String(size)}
                      >
                        {size} / trang
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isPlanDialogOpen}
        onOpenChange={setIsPlanDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tạo gói đăng ký mới</DialogTitle>
            <DialogDescription>
              Thiết lập thông tin cơ bản cho gói đăng ký mới.
            </DialogDescription>
          </DialogHeader>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Thông tin gói không thể chỉnh sửa sau khi tạo</AlertTitle>
            <AlertDescription>
              Mã gói, tên, mô tả, thời hạn và giá niêm yết sẽ được cố định. Để
              thay đổi tính năng hoặc điều chỉnh giá, hãy tạo phiên bản mới cho
              gói sau khi khởi tạo.
            </AlertDescription>
          </Alert>

          <form
            className="space-y-4"
            onSubmit={planForm.handleSubmit(handleSubmitPlan)}
          >
            <Controller
              name="code"
              control={planForm.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="plan-code">
                    Mã gói <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="plan-code"
                      placeholder="ví dụ: STARTER_12M"
                      aria-required="true"
                      aria-invalid={fieldState.invalid}
                    />
                    <p className="text-xs text-muted-foreground">
                      Ví dụ: STARTER_12M (in hoa, dấu gạch dưới)
                    </p>
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
                  <FieldLabel htmlFor="plan-name">
                    Tên gói <span className="text-destructive">*</span>
                  </FieldLabel>
                  <FieldContent>
                    <Input
                      {...field}
                      id="plan-name"
                      placeholder="ví dụ: Khởi động 12 tháng"
                      aria-required="true"
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
                    <p className="text-xs text-muted-foreground">
                      {field.value?.length ?? 0}/1000
                    </p>
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
                      Thời hạn (tháng){" "}
                      <span className="text-destructive">*</span>
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
                        aria-required="true"
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
                      Giá niêm yết (VND){" "}
                      <span className="text-destructive">*</span>
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
                        aria-required="true"
                        aria-invalid={fieldState.invalid}
                      />
                      <p className="text-xs text-muted-foreground">
                        Đơn vị: VND, đã bao gồm VAT
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Hiển thị: {formatCurrency(field.value || 0)}
                      </p>
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
                Đóng
              </Button>
              <Button
                type="submit"
                disabled={createPlanMutation.isPending}
              >
                {createPlanMutation.isPending ? "Đang tạo..." : "Tạo gói"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isArchiveConfirmOpen}
        title="Lưu trữ gói đăng ký"
        description="Sau khi lưu trữ, gói sẽ chuyển sang trạng thái Đã lưu trữ và không còn dùng cho luồng kích hoạt mới."
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
