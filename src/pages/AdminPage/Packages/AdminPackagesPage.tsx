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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import useDebounce from "@/hooks/useDebounce";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { formatCurrencyVnd } from "@/lib/format";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import {
  useArchiveServicePackage,
  useCreateServicePackage,
  useServicePackages,
  useUnarchiveServicePackage,
  useUpdateServicePackage,
} from "@/queries/useCredit";
import {
  CreateServicePackageBodySchema,
  type CreateServicePackageBodyType,
  type ListServicePackagesQueryType,
  type ServicePackageType,
  type UpdateServicePackageBodyType,
} from "@/schemaValidatation/credit";
import { zodResolver } from "@hookform/resolvers/zod";
import { Archive, ArchiveRestore, Loader2, Pencil, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

type DialogMode = "create" | "edit";

interface ConfirmState {
  type: "archive" | "unarchive";
  pkg: ServicePackageType;
}

export default function AdminPackagesPage() {
  const [query, setQuery] = useState<ListServicePackagesQueryType>({
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const effectiveQuery = useMemo<ListServicePackagesQueryType>(
    () => ({
      ...query,
      search: debouncedSearch || undefined,
    }),
    [query, debouncedSearch],
  );

  const listQuery = useServicePackages(effectiveQuery);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<DialogMode>("create");
  const [editingPkg, setEditingPkg] = useState<ServicePackageType | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);

  const packages = listQuery.data?.data.data ?? [];
  const meta = listQuery.data?.data.meta;

  const columns: ColumnDef<ServicePackageType>[] = [
    {
      accessorKey: "code",
      header: "Mã",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.code}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Tên gói",
      cell: ({ row }) => (
        <div>
          <p className="font-medium">{row.original.name}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">
            {row.original.description || "Không có mô tả"}
          </p>
        </div>
      ),
    },
    {
      accessorKey: "creditType",
      header: "Loại credit",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.creditType}</Badge>
      ),
    },
    {
      accessorKey: "creditAmount",
      header: () => <div className="text-right">Số credit</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {row.original.creditAmount}
        </div>
      ),
    },
    {
      accessorKey: "price",
      header: () => <div className="text-right">Giá (VND)</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">
          {formatCurrencyVnd(row.original.price)}
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge variant={row.original.isActive ? "default" : "secondary"}>
          {row.original.isActive ? "Đang hoạt động" : "Đã lưu trữ"}
        </Badge>
      ),
    },
  ];

  // If current page becomes empty after delete/archive, step back one page.
  useEffect(() => {
    if (
      listQuery.isLoading ||
      !meta?.hasPreviousPage ||
      packages.length > 0 ||
      (meta.page ?? 1) <= 1
    ) {
      return;
    }
    setQuery((prev) => ({ ...prev, page: Math.max((prev.page ?? 1) - 1, 1) }));
  }, [packages.length, listQuery.isLoading, meta?.hasPreviousPage, meta?.page]);

  const openCreate = () => {
    setDialogMode("create");
    setEditingPkg(null);
    setDialogOpen(true);
  };

  const openEdit = (pkg: ServicePackageType) => {
    setDialogMode("edit");
    setEditingPkg(pkg);
    setDialogOpen(true);
  };

  const archiveMutation = useArchiveServicePackage();
  const unarchiveMutation = useUnarchiveServicePackage();

  const onConfirmArchive = async () => {
    if (!confirmState) return;
    try {
      if (confirmState.type === "archive") {
        await archiveMutation.mutateAsync(confirmState.pkg.id);
        toast.success("Đã lưu trữ gói dịch vụ.");
      } else {
        await unarchiveMutation.mutateAsync(confirmState.pkg.id);
        toast.success("Đã khôi phục gói dịch vụ.");
      }
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Thao tác thất bại."));
    } finally {
      setConfirmState(null);
    }
  };

  return (
    <>
      <div className="space-y-6 animate-in fade-in duration-300">
        <section className="relative overflow-hidden rounded-2xl border bg-card p-5 shadow-sm md:p-6">
          <div className="pointer-events-none absolute inset-0 bg-muted/20" />
          <div className="relative flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge className="mb-2">Cổng quản trị</Badge>
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Gói dịch vụ bổ sung
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Quản lý các gói credit (vé bác sĩ, ...) mà chủ vườn có thể mua
                thêm ngoài gói đăng ký chính.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">Tổng: {meta?.totalItems ?? 0}</Badge>
              <Button onClick={openCreate}>Tạo gói</Button>
            </div>
          </div>
        </section>

        <Card>
          <CardHeader className="space-y-4">
            <div>
              <CardTitle>Danh sách gói dịch vụ</CardTitle>
              <CardDescription>
                Mỗi gói gắn với một loại credit và số lượng credit cấp khi mua.
              </CardDescription>
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_140px]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setQuery((prev) => ({ ...prev, page: 1 }));
                  }}
                  placeholder="Tìm theo mã hoặc tên gói..."
                  className="pl-9"
                />
              </div>
              <Select
                value={String(query.limit ?? 10)}
                onValueChange={(value) =>
                  setQuery((prev) => ({
                    ...prev,
                    page: 1,
                    limit: Number(value),
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / trang</SelectItem>
                  <SelectItem value="20">20 / trang</SelectItem>
                  <SelectItem value="30">30 / trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <DataTable
              columns={columns}
              data={packages}
              isLoading={listQuery.isLoading}
              actions={[
                {
                  key: "edit",
                  label: "Chỉnh sửa",
                  icon: Pencil,
                  onSelect: (pkg) => openEdit(pkg),
                },
                {
                  key: "archive",
                  label: "Lưu trữ",
                  icon: Archive,
                  variant: "destructive",
                  hidden: (pkg) => !pkg.isActive,
                  onSelect: (pkg) => setConfirmState({ type: "archive", pkg }),
                },
                {
                  key: "unarchive",
                  label: "Khôi phục",
                  icon: ArchiveRestore,
                  hidden: (pkg) => pkg.isActive,
                  onSelect: (pkg) =>
                    setConfirmState({ type: "unarchive", pkg }),
                },
              ]}
              emptyText="Chưa có gói dịch vụ nào."
            />
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Trang {meta?.page ?? query.page ?? 1}/{meta?.totalPages ?? 1}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta?.hasPreviousPage || listQuery.isFetching}
                  onClick={() =>
                    setQuery((prev) => ({
                      ...prev,
                      page: Math.max((prev.page ?? 1) - 1, 1),
                    }))
                  }
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta?.hasNextPage || listQuery.isFetching}
                  onClick={() =>
                    setQuery((prev) => ({
                      ...prev,
                      page: (prev.page ?? 1) + 1,
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

      <ServicePackageFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        pkg={editingPkg}
      />

      <ConfirmDialog
        open={confirmState?.type === "archive"}
        title="Lưu trữ gói dịch vụ?"
        description="Gói sẽ không còn hiển thị cho chủ vườn mua. Có thể khôi phục lại sau."
        confirmLabel={
          archiveMutation.isPending ? "Đang lưu trữ..." : "Lưu trữ"
        }
        cancelLabel="Hủy"
        variant="destructive"
        onConfirm={onConfirmArchive}
        onCancel={() => setConfirmState(null)}
      />

      <ConfirmDialog
        open={confirmState?.type === "unarchive"}
        title="Khôi phục gói dịch vụ?"
        description="Gói sẽ hiển thị trở lại cho chủ vườn mua thêm."
        confirmLabel={
          unarchiveMutation.isPending ? "Đang khôi phục..." : "Khôi phục"
        }
        cancelLabel="Hủy"
        onConfirm={onConfirmArchive}
        onCancel={() => setConfirmState(null)}
      />
    </>
  );
}

interface ServicePackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: DialogMode;
  pkg: ServicePackageType | null;
}

function ServicePackageFormDialog({
  open,
  onOpenChange,
  mode,
  pkg,
}: ServicePackageFormDialogProps) {
  const isEdit = mode === "edit";
  const createMutation = useCreateServicePackage();
  const updateMutation = useUpdateServicePackage();

  const form = useForm<CreateServicePackageBodyType>({
    resolver: zodResolver(CreateServicePackageBodySchema),
    defaultValues: {
      code: "",
      name: "",
      description: "",
      price: 0,
      creditAmount: 1,
      creditType: "ticket_general",
    },
  });
  useClearServerFieldErrors(form);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;

  // Sync form values when opening for edit / create.
  useEffect(() => {
    if (!open) return;
    if (isEdit && pkg) {
      reset({
        code: pkg.code,
        name: pkg.name,
        description: pkg.description ?? "",
        price: pkg.price,
        creditAmount: pkg.creditAmount,
        creditType: pkg.creditType,
      });
    } else {
      reset({
        code: "",
        name: "",
        description: "",
        price: 0,
        creditAmount: 1,
        creditType: "ticket_general",
      });
    }
  }, [open, isEdit, pkg, reset]);

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (data: CreateServicePackageBodyType) => {
    const description = data.description?.trim() || undefined;

    try {
      if (isEdit && pkg) {
        const updateBody: UpdateServicePackageBodyType = {
          name: data.name,
          description,
          price: data.price,
          creditAmount: data.creditAmount,
          creditType: data.creditType,
        };
        await updateMutation.mutateAsync({ id: pkg.id, body: updateBody });
        toast.success("Đã cập nhật gói dịch vụ.");
      } else {
        await createMutation.mutateAsync({ ...data, description });
        toast.success("Đã tạo gói dịch vụ.");
      }
      onOpenChange(false);
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<CreateServicePackageBodyType>(
          error,
        )
      ) {
        handleApiErrorUnprocessentity<CreateServicePackageBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message ?? getApiErrorMessageVi(error),
        );
        return;
      }
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next && isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Cập nhật gói dịch vụ" : "Tạo gói dịch vụ mới"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Cập nhật thông tin gói. Mã gói không thay đổi được."
              : "Tạo gói credit để chủ vườn có thể mua thêm."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="service-package-form"
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="pkg-code">
              Mã gói <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pkg-code"
              placeholder="VD: ticket_pack_10"
              disabled={isEdit}
              {...register("code")}
              aria-invalid={Boolean(errors.code)}
            />
            {errors.code && (
              <p className="text-destructive text-xs">{errors.code.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pkg-name">
              Tên gói <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pkg-name"
              placeholder="VD: Gói 10 vé tư vấn bác sĩ"
              {...register("name")}
              aria-invalid={Boolean(errors.name)}
            />
            {errors.name && (
              <p className="text-destructive text-xs">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pkg-credit-type">
                Loại credit <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pkg-credit-type"
                placeholder="VD: ticket_general"
                {...register("creditType")}
                aria-invalid={Boolean(errors.creditType)}
              />
              {errors.creditType ? (
                <p className="text-destructive text-xs">
                  {errors.creditType.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Mặc định: <span className="font-mono">ticket_general</span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="pkg-credit-amount">
                Số credit <span className="text-destructive">*</span>
              </Label>
              <Input
                id="pkg-credit-amount"
                type="number"
                min={1}
                {...register("creditAmount", { valueAsNumber: true })}
                aria-invalid={Boolean(errors.creditAmount)}
              />
              {errors.creditAmount && (
                <p className="text-destructive text-xs">
                  {errors.creditAmount.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pkg-price">
              Giá (VND) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="pkg-price"
              type="number"
              min={0}
              step={1000}
              placeholder="VD: 199000"
              {...register("price", { valueAsNumber: true })}
              aria-invalid={Boolean(errors.price)}
            />
            {errors.price && (
              <p className="text-destructive text-xs">{errors.price.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="pkg-description">Mô tả</Label>
            <Textarea
              id="pkg-description"
              rows={3}
              placeholder="Mô tả ngắn về gói dịch vụ"
              {...register("description")}
              aria-invalid={Boolean(errors.description)}
            />
            {errors.description && (
              <p className="text-destructive text-xs">
                {errors.description.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button
            type="submit"
            form="service-package-form"
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEdit ? "Lưu thay đổi" : "Tạo gói"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
