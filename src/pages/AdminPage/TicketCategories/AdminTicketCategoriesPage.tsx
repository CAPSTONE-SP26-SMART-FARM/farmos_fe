import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/common/DataTable";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useAdminTicketCategoryList,
  useToggleTicketCategory,
  useUpdateTicketCategory,
} from "@/queries/useTicketCategory";
import {
  UpdateTicketCategoryBodySchema,
  type ListTicketCategoriesQueryType,
  type TicketCategoryType,
  type UpdateTicketCategoryBodyType,
} from "@/schemaValidatation/ticketCategory";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import {
  AlertTriangle,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { useNavigate } from "react-router";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

// ── Helpers ───────────────────────────────────────────────────────────────────
const formatVnd = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

// ── Edit sheet ────────────────────────────────────────────────────────────────
function EditCategorySheet({
  category,
  onClose,
}: {
  category: TicketCategoryType;
  onClose: () => void;
}) {
  const updateMutation = useUpdateTicketCategory();

  const form = useForm<UpdateTicketCategoryBodyType>({
    resolver: zodResolver(
      UpdateTicketCategoryBodySchema,
    ) as Resolver<UpdateTicketCategoryBodyType>,
    defaultValues: {
      name: category.name,
      description: category.description ?? "",
      unitPrice: category.unitPrice,
      defaultCommissionPercent: category.defaultCommissionPercent,
      eligibleForSubscriptionGrant: category.eligibleForSubscriptionGrant,
      eligibleForPurchase: category.eligibleForPurchase,
      featureCode: category.featureCode ?? "",
      metadata: category.metadata ?? undefined,
    },
  });
  useClearServerFieldErrors(form);

  const onSubmit = async (data: UpdateTicketCategoryBodyType) => {
    try {
      await updateMutation.mutateAsync({ id: category.id, body: data });
      toast.success("Cập nhật danh mục thành công.");
      onClose();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        handleApiErrorUnprocessentity<UpdateTicketCategoryBodyType>(
          err.response.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
      } else {
        toast.error(getApiErrorMessageVi(err));
      }
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = form;

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col flex-1 overflow-hidden"
    >
      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Read-only create-time-only fields */}
        <div className="rounded-md border bg-muted/50 p-3 space-y-2">
          <p className="text-xs text-muted-foreground font-medium">
            Trường chỉ đọc (không thể sửa sau khi tạo)
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Mã: {category.code}</Badge>
            {category.creditType && (
              <Badge variant="secondary" className="font-mono">
                Credit: {category.creditType}
              </Badge>
            )}
            <Badge variant="secondary">Tiền tệ: {category.currency}</Badge>
          </div>
        </div>

        <div className="space-y-1">
          <Label htmlFor="edit-name">
            Tên danh mục <span className="text-destructive">*</span>
          </Label>
          <Input
            id="edit-name"
            {...register("name")}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && (
            <p className="text-destructive text-xs">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-1">
          <Label htmlFor="edit-description">Mô tả</Label>
          <Textarea
            id="edit-description"
            {...register("description")}
            rows={2}
          />
        </div>

        <Separator />

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-unitPrice">
              Đơn giá <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="edit-unitPrice"
                type="number"
                min={0}
                step={1000}
                {...register("unitPrice", { valueAsNumber: true })}
                aria-invalid={Boolean(errors.unitPrice)}
                className="pr-14"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground font-medium">
                VNĐ
              </span>
            </div>
            {errors.unitPrice && (
              <p className="text-destructive text-xs">
                {errors.unitPrice.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-commissionPercent">
              Hoa hồng <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="edit-commissionPercent"
                type="number"
                min={0}
                max={100}
                step={0.01}
                {...register("defaultCommissionPercent", {
                  valueAsNumber: true,
                })}
                aria-invalid={Boolean(errors.defaultCommissionPercent)}
                className="pr-8"
              />
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground font-medium">
                %
              </span>
            </div>
            {errors.defaultCommissionPercent && (
              <p className="text-destructive text-xs">
                {errors.defaultCommissionPercent.message}
              </p>
            )}
          </div>
        </div>

        <Separator />

        <div className="space-y-3">
          <p className="text-sm font-medium">Quyền truy cập</p>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Cấp qua gói đăng ký</p>
              <p className="text-xs text-muted-foreground">
                Gán tự động khi đăng ký gói dịch vụ.
              </p>
            </div>
            <Switch
              id="edit-subscriptionGrant"
              checked={watch("eligibleForSubscriptionGrant")}
              onCheckedChange={(v) =>
                setValue("eligibleForSubscriptionGrant", Boolean(v))
              }
            />
          </div>
          <div className="flex items-start justify-between gap-4 rounded-lg border p-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Cho phép mua lẻ</p>
              <p className="text-xs text-muted-foreground">
                Cho phép mua thêm ngoài gói đăng ký.
              </p>
            </div>
            <Switch
              id="edit-purchase"
              checked={watch("eligibleForPurchase")}
              onCheckedChange={(v) =>
                setValue("eligibleForPurchase", Boolean(v))
              }
            />
          </div>
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Label htmlFor="edit-featureCode">Feature code</Label>
          <Input
            id="edit-featureCode"
            {...register("featureCode")}
            className="font-mono text-sm"
            aria-invalid={Boolean(errors.featureCode)}
          />
          {errors.featureCode ? (
            <p className="text-destructive text-xs">
              {errors.featureCode.message}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Chỉ sửa được khi chưa có ticket nào dùng category này (BE check
              <code className="mx-1">TicketCategoryCannotChangeFeatureCode</code>
              ).
            </p>
          )}
        </div>
      </div>

      {/* Sticky footer */}
      <div className="border-t px-6 py-4 flex items-center justify-end gap-3 bg-background">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Huỷ
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="min-w-28"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Lưu...
            </>
          ) : (
            "Lưu thay đổi"
          )}
        </Button>
      </div>
    </form>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AdminTicketCategoriesPage() {
  const [query, setQuery] = useState<ListTicketCategoriesQueryType>({
    page: 1,
    limit: 20,
    search: "",
  });
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const [editTarget, setEditTarget] = useState<TicketCategoryType | null>(null);
  // FE-only mitigation cho Gap #2 (toggle isActive=false không pre-validate):
  // - confirmTarget mở ConfirmDialog cảnh báo trước khi gọi toggle
  // - blockingError giữ hint từ BE 422 hiển thị inline thay vì toast thoáng qua
  const [confirmTarget, setConfirmTarget] = useState<TicketCategoryType | null>(
    null,
  );
  const [blockingError, setBlockingError] = useState<{
    categoryName: string;
    message: string;
  } | null>(null);

  const listQuery = useAdminTicketCategoryList(query);
  const toggleMutation = useToggleTicketCategory();

  const categories = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

  const handleSearch = () => {
    setQuery((prev) => ({ ...prev, page: 1, search }));
  };

  const columns = useMemo<ColumnDef<TicketCategoryType>[]>(
    () => [
      {
        accessorKey: "code",
        header: "Mã",
        cell: ({ row }) => (
          <span className="font-mono text-xs">{row.original.code}</span>
        ),
      },
      {
        accessorKey: "name",
        header: "Tên danh mục",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "unitPrice",
        header: () => <div className="text-right">Đơn giá</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {formatVnd(row.original.unitPrice)}
          </div>
        ),
      },
      {
        accessorKey: "defaultCommissionPercent",
        header: () => <div className="text-right">Hoa hồng</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.defaultCommissionPercent}%
          </div>
        ),
      },
      {
        accessorKey: "creditType",
        header: "Credit type (auto)",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.creditType ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "eligibleForSubscriptionGrant",
        header: "Gói đăng ký",
        cell: ({ row }) =>
          row.original.eligibleForSubscriptionGrant ? (
            <Badge variant="secondary">Có</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Không</span>
          ),
      },
      {
        accessorKey: "eligibleForPurchase",
        header: "Mua lẻ",
        cell: ({ row }) =>
          row.original.eligibleForPurchase ? (
            <Badge variant="secondary">Có</Badge>
          ) : (
            <span className="text-muted-foreground text-xs">Không</span>
          ),
      },
      {
        accessorKey: "isActive",
        header: "Trạng thái",
        cell: ({ row }) => (
          <Badge
            variant={row.original.isActive ? "default" : "outline"}
            className={
              row.original.isActive
                ? "bg-green-100 text-green-800 border-green-200"
                : "text-muted-foreground"
            }
          >
            {row.original.isActive ? "Hoạt động" : "Vô hiệu"}
          </Badge>
        ),
      },
    ],
    [],
  );

  const performToggle = async (category: TicketCategoryType) => {
    try {
      await toggleMutation.mutateAsync({
        id: category.id,
        body: { isActive: !category.isActive },
      });
      toast.success(
        `${category.isActive ? "Vô hiệu hoá" : "Kích hoạt"} danh mục "${category.name}" thành công.`,
      );
      setBlockingError(null);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 422) {
        // BE describeBlockingResources trả hint dạng:
        // "Còn N owner đang có balance / M subscription đang cấp / K ticket chưa đóng"
        const data = err.response.data;
        const hint =
          data?.errors?.[0]?.message ??
          data?.message ??
          "Không thể thay đổi trạng thái danh mục này.";
        setBlockingError({ categoryName: category.name, message: hint });
        toast.error(hint);
      } else {
        toast.error(getApiErrorMessageVi(err));
      }
    }
  };

  const handleToggleAction = (category: TicketCategoryType) => {
    // Activate (isActive=false → true) không bị BE chặn → bypass confirm.
    if (!category.isActive) {
      void performToggle(category);
      return;
    }
    // Deactivate: mở confirm dialog cảnh báo trước.
    setConfirmTarget(category);
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      {blockingError && (
        <Alert variant="destructive" className="relative pr-10">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>
            Không thể vô hiệu hoá "{blockingError.categoryName}"
          </AlertTitle>
          <AlertDescription className="space-y-1">
            <p>{blockingError.message}</p>
            <p className="text-xs text-muted-foreground">
              Cần xử lý các tài nguyên đang phụ thuộc (owner còn balance,
              subscription đang cấp, ticket chưa đóng) trước khi tắt danh mục
              này.
            </p>
          </AlertDescription>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-2 h-6 w-6"
            onClick={() => setBlockingError(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Danh Mục Ticket</CardTitle>
              <CardDescription>
                Quản lý danh mục dịch vụ ticket — đơn giá, hoa hồng và quyền
                truy cập.
              </CardDescription>
            </div>
            <Button
              onClick={() =>
                navigate("/dashboard/admin/ticket-categories/create")
              }
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo danh mục
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter bar */}
          <div className="flex gap-2">
            <Input
              placeholder="Tìm kiếm theo tên, mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="max-w-sm"
            />
            <Button
              variant="outline"
              onClick={handleSearch}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          <DataTable
            columns={columns}
            data={categories}
            isLoading={listQuery.isLoading}
            actions={[
              {
                key: "edit",
                label: "Chỉnh sửa",
                icon: Pencil,
                onSelect: (cat) => setEditTarget(cat),
              },
              {
                key: "toggle",
                label: "Vô hiệu hoá",
                icon: Power,
                hidden: (cat) => !cat.isActive,
                disabled: () => toggleMutation.isPending,
                variant: "destructive",
                onSelect: (cat) => handleToggleAction(cat),
              },
              {
                key: "activate",
                label: "Kích hoạt",
                icon: Power,
                hidden: (cat) => cat.isActive,
                disabled: () => toggleMutation.isPending,
                onSelect: (cat) => handleToggleAction(cat),
              },
            ]}
            emptyText="Không có danh mục nào."
          />

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {meta.totalItems} danh mục · Trang {meta.page}/{meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasPreviousPage}
                  onClick={() =>
                    setQuery((prev) => ({ ...prev, page: prev.page! - 1 }))
                  }
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasNextPage}
                  onClick={() =>
                    setQuery((prev) => ({ ...prev, page: prev.page! + 1 }))
                  }
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit sheet */}
      <Sheet
        open={Boolean(editTarget)}
        onOpenChange={(open) => !open && setEditTarget(null)}
      >
        <SheetContent
          className="sm:max-w-lg p-0 flex flex-col"
          showCloseButton={true}
        >
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Chỉnh Sửa Danh Mục</SheetTitle>
            <SheetDescription>
              Cập nhật thông tin danh mục. Mã và các trường legacy không thể
              thay đổi.
            </SheetDescription>
          </SheetHeader>
          {editTarget && (
            <EditCategorySheet
              category={editTarget}
              onClose={() => setEditTarget(null)}
            />
          )}
        </SheetContent>
      </Sheet>

      <Dialog
        open={Boolean(confirmTarget)}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Vô hiệu hoá danh mục "{confirmTarget?.name ?? ""}"?
            </DialogTitle>
            <DialogDescription>
              Hành động có thể bị backend chặn nếu danh mục còn ràng buộc.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>BE sẽ kiểm tra 3 nguồn block:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Owner đang giữ balance theo credit type của danh mục</li>
              <li>Subscription đang cấp entitlement theo feature code</li>
              <li>
                Ticket chưa terminal (open / assigned / in_progress / resolved)
              </li>
            </ul>
            <p className="text-xs text-muted-foreground">
              Nếu bị chặn, chi tiết tài nguyên cần xử lý sẽ hiện ở banner phía
              trên trang.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmTarget(null)}
              disabled={toggleMutation.isPending}
            >
              Huỷ
            </Button>
            <Button
              variant="destructive"
              disabled={toggleMutation.isPending}
              onClick={async () => {
                if (!confirmTarget) return;
                const target = confirmTarget;
                setConfirmTarget(null);
                await performToggle(target);
              }}
            >
              {toggleMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                "Vô hiệu hoá"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
