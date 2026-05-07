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
import useDebounce from "@/hooks/useDebounce";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useCreateFeature,
  useDeleteFeature,
  useListFeatures,
  useUpdateFeature,
} from "@/queries/useFeature";
import type {
  FeatureMenuType,
  ListFeaturesQueryType,
} from "@/schemaValidatation/feature";
import { Search } from "lucide-react";
import { toast } from "sonner";
import {
  type FormState,
  INITIAL_FORM,
  toCreatePayload,
  toUpdatePayload,
  toFormState,
} from "./featureTypes";
import { FeatureFormDialog } from "./components/FeatureFormDialog";

export default function AdminFeaturesPage() {
  const [query, setQuery] = useState<ListFeaturesQueryType>({
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [editingFeatureCode, setEditingFeatureCode] = useState<string | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deletingFeatureCode, setDeletingFeatureCode] = useState<string | null>(
    null,
  );

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
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                Tính năng theo gói
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
                Quản lý danh mục tính năng dùng để cấu hình quyền lợi theo gói
                dịch vụ.
              </p>
            </div>
            <Badge variant="secondary">Tổng: {meta?.totalItems ?? 0}</Badge>
          </div>
        </section>

        <Card>
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <CardTitle>Danh sách tính năng</CardTitle>
                <CardDescription>
                  Quản lý tính năng dùng cho các gói dịch vụ.
                </CardDescription>
              </div>
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
                  placeholder="Tìm theo mã hoặc tên tính năng..."
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã</TableHead>
                  <TableHead>Tên tính năng</TableHead>
                  <TableHead>Kiểu dữ liệu</TableHead>
                  <TableHead>Giá trị mặc định</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {listQuery.isLoading && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}
                {!listQuery.isLoading && features.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-6 text-center text-muted-foreground"
                    >
                      Không có tính năng phù hợp bộ lọc.
                    </TableCell>
                  </TableRow>
                )}
                {features.map((feature) => (
                  <TableRow key={feature.code}>
                    <TableCell className="font-medium">
                      {feature.code}
                    </TableCell>
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(feature)}
                        >
                          Sửa
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

      <FeatureFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        form={form}
        setForm={setForm}
        editingFeatureCode={editingFeatureCode}
        setEditingFeatureCode={setEditingFeatureCode}
        isSubmitting={isSubmitting}
        onSubmit={onSubmit}
      />

      <ConfirmDialog
        open={Boolean(deletingFeatureCode)}
        title="Xóa tính năng này?"
        description="Hành động này không thể hoàn tác. Tính năng đang dùng trong gói dịch vụ có thể bị từ chối xóa."
        confirmLabel={deleteMutation.isPending ? "Đang xóa..." : "Xóa tính năng"}
        cancelLabel="Hủy"
        variant="destructive"
        onConfirm={onDelete}
        onCancel={() => setDeletingFeatureCode(null)}
      />
    </>
  );
}
