import { useEffect, useMemo, useState } from "react";
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
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useCreateFeature,
  useDeleteFeature,
  useListFeatures,
  useUpdateFeature,
} from "@/queries/useFeature";
import type {
  CreateFeatureBodyType,
  FeatureMenuType,
  ListFeaturesQueryType,
  UpdateFeatureBodyType,
} from "@/schemaValidatation/feature";
import { Loader2, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

type FormState = {
  code: string;
  name: string;
  description: string;
  valueType: CreateFeatureBodyType["valueType"];
  unit: string;
  defaultValue: string;
};

const INITIAL_FORM: FormState = {
  code: "",
  name: "",
  description: "",
  valueType: "TEXT",
  unit: "",
  defaultValue: "",
};

function toCreatePayload(form: FormState): CreateFeatureBodyType {
  return {
    code: form.code.trim(),
    name: form.name.trim(),
    valueType: form.valueType,
    description: form.description.trim() || undefined,
    unit: form.unit.trim() || undefined,
    defaultValue: form.defaultValue.trim() || undefined,
  };
}

function toUpdatePayload(form: FormState): UpdateFeatureBodyType {
  return {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    unit: form.unit.trim() || undefined,
    defaultValue: form.defaultValue.trim() || undefined,
  };
}

function toFormState(feature: FeatureMenuType): FormState {
  return {
    code: feature.code,
    name: feature.name,
    description: feature.description ?? "",
    valueType: feature.valueType,
    unit: feature.unit ?? "",
    defaultValue: feature.defaultValue ?? "",
  };
}

export default function AdminFeaturesPage() {
  const [query, setQuery] = useState<ListFeaturesQueryType>({ page: 1, limit: 10 });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [editingFeatureCode, setEditingFeatureCode] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingFeatureCode, setDeletingFeatureCode] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 500);

  const effectiveQuery = useMemo(
    () => ({
      ...query,
      search: debouncedSearch || undefined,
    }),
    [query, debouncedSearch],
  );

  const listQuery = useListFeatures(effectiveQuery);
  const createMutation = useCreateFeature();
  const updateMutation = useUpdateFeature();
  const deleteMutation = useDeleteFeature();

  const features = listQuery.data?.data.data ?? [];
  const meta = listQuery.data?.data.meta;

  useEffect(() => {
    if (
      listQuery.isLoading ||
      !meta?.hasPreviousPage ||
      features.length > 0 ||
      (meta.page ?? 1) <= 1
    ) {
      return;
    }
    setQuery((prev) => ({ ...prev, page: Math.max((prev.page ?? 1) - 1, 1) }));
  }, [features.length, listQuery.isLoading, meta?.hasPreviousPage, meta?.page]);

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const resetForm = () => {
    setForm(INITIAL_FORM);
    setEditingFeatureCode(null);
    setDialogOpen(false);
  };

  const onSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Vui lòng nhập mã và tên tính năng.");
      return;
    }

    try {
      if (editingFeatureCode) {
        await updateMutation.mutateAsync({
          featureCode: editingFeatureCode,
          body: toUpdatePayload(form),
        });
        toast.success("Đã cập nhật tính năng.");
      } else {
        await createMutation.mutateAsync(toCreatePayload(form));
        toast.success("Đã tạo tính năng mới.");
      }
      resetForm();
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Không thể lưu tính năng."));
    }
  };

  const onEdit = (feature: FeatureMenuType) => {
    setEditingFeatureCode(feature.code);
    setForm(toFormState(feature));
    setDialogOpen(true);
  };

  const onCreate = () => {
    setEditingFeatureCode(null);
    setForm(INITIAL_FORM);
    setDialogOpen(true);
  };

  const onDelete = async () => {
    if (!deletingFeatureCode) return;
    try {
      await deleteMutation.mutateAsync(deletingFeatureCode);
      toast.success("Đã xóa tính năng.");
      if (editingFeatureCode === deletingFeatureCode) {
        resetForm();
      }
    } catch (error) {
      toast.error(getApiErrorMessageVi(error, "Không thể xóa tính năng."));
    } finally {
      setDeletingFeatureCode(null);
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
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Feature Menu</h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Quản lý danh mục feature dùng để cấu hình quyền lợi theo gói dịch vụ.
              </p>
            </div>
            <Badge variant="secondary">Tổng: {meta?.totalItems ?? 0}</Badge>
          </div>
        </section>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Danh sách feature</CardTitle>
                <CardDescription>Quản lý feature theo đúng CRUD của admin.</CardDescription>
              </div>
              <Button onClick={onCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tạo feature
              </Button>
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
                  placeholder="Tìm theo mã hoặc tên feature..."
                  className="pl-9"
                />
              </div>
              <Select
                value={String(query.limit ?? 10)}
                onValueChange={(value) =>
                  setQuery((prev) => ({ ...prev, page: 1, limit: Number(value) }))
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên feature</TableHead>
                  <TableHead>Kiểu dữ liệu</TableHead>
                  <TableHead>Giá trị mặc định</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.isLoading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}
                {!listQuery.isLoading && features.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-muted-foreground">
                      Không có feature phù hợp bộ lọc.
                    </TableCell>
                  </TableRow>
                )}
                {features.map((feature) => (
                  <TableRow key={feature.code}>
                    <TableCell className="font-medium">{feature.code}</TableCell>
                    <TableCell>
                      <p className="font-medium">{feature.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {feature.description || "Không có mô tả"}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{feature.valueType}</Badge>
                    </TableCell>
                    <TableCell>{feature.defaultValue ?? "-"}</TableCell>
                    <TableCell>{feature.unit ?? "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => onEdit(feature)}>
                          Sửa
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeletingFeatureCode(feature.code)}
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                          Xóa
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                    setQuery((prev) => ({ ...prev, page: Math.max((prev.page ?? 1) - 1, 1) }))
                  }
                >
                  Trang trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!meta?.hasNextPage || listQuery.isFetching}
                  onClick={() => setQuery((prev) => ({ ...prev, page: (prev.page ?? 1) + 1 }))}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open && isSubmitting) return;
          setDialogOpen(open);
          if (!open) {
            setForm(INITIAL_FORM);
            setEditingFeatureCode(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editingFeatureCode ? "Cập nhật feature" : "Tạo feature mới"}
            </DialogTitle>
            <DialogDescription>
              {editingFeatureCode ? "PATCH /features/{featureCode}" : "POST /features"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feature-code">Mã feature</Label>
              <Input
                id="feature-code"
                value={form.code}
                disabled={Boolean(editingFeatureCode)}
                onChange={(event) => setForm((prev) => ({ ...prev, code: event.target.value }))}
                placeholder="VD: max_farm_count"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-name">Tên feature</Label>
              <Input
                id="feature-name"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="VD: Số trang trại tối đa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-value-type">Kiểu dữ liệu</Label>
              <Select
                value={form.valueType}
                disabled={Boolean(editingFeatureCode)}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    valueType: value as CreateFeatureBodyType["valueType"],
                  }))
                }
              >
                <SelectTrigger id="feature-value-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                  <SelectItem value="INT">INT</SelectItem>
                  <SelectItem value="DECIMAL">DECIMAL</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                  <SelectItem value="TEXT">TEXT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-default">Giá trị mặc định</Label>
              <Input
                id="feature-default"
                value={form.defaultValue}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, defaultValue: event.target.value }))
                }
                placeholder="VD: 10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-unit">Đơn vị</Label>
              <Input
                id="feature-unit"
                value={form.unit}
                onChange={(event) => setForm((prev) => ({ ...prev, unit: event.target.value }))}
                placeholder="VD: farm"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feature-description">Mô tả</Label>
              <Textarea
                id="feature-description"
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, description: event.target.value }))
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDialogOpen(false);
                setForm(INITIAL_FORM);
                setEditingFeatureCode(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={onSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingFeatureCode ? "Lưu thay đổi" : "Tạo feature"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deletingFeatureCode)}
        title="Xóa feature này?"
        description="Hành động này không thể hoàn tác. Feature đang dùng trong plan có thể bị từ chối xóa."
        confirmLabel={deleteMutation.isPending ? "Đang xóa..." : "Xóa feature"}
        cancelLabel="Hủy"
        variant="destructive"
        onConfirm={onDelete}
        onCancel={() => setDeletingFeatureCode(null)}
      />
    </>
  );
}
