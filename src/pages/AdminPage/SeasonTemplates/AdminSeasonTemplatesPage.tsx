import EmptyState from "@/components/common/EmptyState";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useActivateSeasonTemplate,
  useAdminSeasonTemplateDetail,
  useAdminSeasonTemplateList,
  useDeactivateSeasonTemplate,
  useSoftDeleteSeasonTemplate,
} from "@/queries/useSeasonTemplate";
import {
  FARM_TYPE_LABEL,
  type FarmTypeT,
  type ListSeasonTemplatesQueryT,
  type SeasonTemplateResT,
} from "@/schemaValidatation/seasonTemplate";
import {
  BarChart3,
  Eye,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Sprout,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import AdminSeasonTemplateFormSheet from "./AdminSeasonTemplateFormSheet";

type ActiveFilter = "all" | "true" | "false";

export default function AdminSeasonTemplatesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<ListSeasonTemplatesQueryT>({
    page: 1,
    limit: 20,
  });
  const [searchInput, setSearchInput] = useState("");
  const [farmTypeFilter, setFarmTypeFilter] = useState<FarmTypeT | "all">(
    "all",
  );
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTargetId, setEditTargetId] = useState<string | null>(null);

  const [toggleTarget, setToggleTarget] = useState<SeasonTemplateResT | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<SeasonTemplateResT | null>(
    null,
  );

  const listQuery = useAdminSeasonTemplateList(query);
  const editDetailQuery = useAdminSeasonTemplateDetail(
    editTargetId ?? "",
    Boolean(editTargetId) && sheetOpen,
  );
  const activateMut = useActivateSeasonTemplate();
  const deactivateMut = useDeactivateSeasonTemplate();
  const deleteMut = useSoftDeleteSeasonTemplate();

  const items = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

  const columns: ColumnDef<SeasonTemplateResT>[] = [
    {
      accessorKey: "name",
      header: "Tên mẫu",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name ?? "(không tên)"}</div>
          {row.original.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: "farmType",
      header: "Loại",
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.farmType
            ? FARM_TYPE_LABEL[row.original.farmType as FarmTypeT]
            : "—"}
        </Badge>
      ),
    },
    {
      accessorKey: "version",
      header: () => <div className="text-center">Phiên bản</div>,
      cell: ({ row }) => (
        <div className="text-center font-mono text-xs">
          v{row.original.version ?? 1}
        </div>
      ),
    },
    {
      accessorKey: "itemCount",
      header: () => <div className="text-center">Số mục</div>,
      cell: ({ row }) => (
        <div className="text-center tabular-nums">
          <Badge
            variant="outline"
            className="bg-blue-500/10 text-blue-700 border-blue-200"
          >
            <Layers className="mr-1 h-3 w-3" />
            {row.original.itemCount}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: "isActive",
      header: "Trạng thái",
      cell: ({ row }) =>
        row.original.deletedAt ? (
          <Badge
            variant="outline"
            className="text-muted-foreground"
          >
            Đã xoá
          </Badge>
        ) : row.original.isActive ? (
          <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-200">
            Hoạt động
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="text-muted-foreground"
          >
            Vô hiệu
          </Badge>
        ),
    },
    {
      accessorKey: "updatedAt",
      header: "Cập nhật",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {new Date(row.original.updatedAt).toLocaleDateString("vi-VN")}
        </span>
      ),
    },
  ];

  const applyFilter = () => {
    setQuery({
      page: 1,
      limit: 20,
      search: searchInput.trim() || undefined,
      farmType: farmTypeFilter === "all" ? undefined : farmTypeFilter,
      includeInactive: activeFilter !== "true" ? true : undefined,
    });
  };

  const handleOpenCreate = () => {
    navigate("/dashboard/admin/season-templates/create");
  };

  const handleOpenEdit = (id: string) => {
    setEditTargetId(id);
    setSheetOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      if (toggleTarget.isActive) {
        await deactivateMut.mutateAsync(toggleTarget.id);
        toast.success(`Đã vô hiệu mẫu "${toggleTarget.name}".`);
      } else {
        await activateMut.mutateAsync(toggleTarget.id);
        toast.success(`Đã kích hoạt mẫu "${toggleTarget.name}".`);
      }
    } catch (err) {
      toast.error(getApiErrorMessageVi(err));
    } finally {
      setToggleTarget(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget.id);
      toast.success(`Đã xoá mẫu "${deleteTarget.name}".`);
    } catch (err) {
      toast.error(getApiErrorMessageVi(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  const isFiltered =
    Boolean(query.search) ||
    Boolean(query.farmType) ||
    activeFilter === "false";

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sprout className="h-5 w-5 text-emerald-600" />
                Mẫu Vụ Mùa
              </CardTitle>
              <CardDescription>
                Mẫu starter định nghĩa giai đoạn, công việc và ngưỡng cảm biến.
                Manager/Owner có thể chọn mẫu khi tạo vụ — chỉnh sửa tự do
                trước khi lưu.
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo mẫu
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Tìm theo tên mẫu..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilter()}
              className="max-w-sm"
            />
            <Select
              value={farmTypeFilter}
              onValueChange={(v) => setFarmTypeFilter(v as FarmTypeT | "all")}
            >
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Loại trang trại" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Mọi loại</SelectItem>
                {(Object.keys(FARM_TYPE_LABEL) as FarmTypeT[]).map((f) => (
                  <SelectItem
                    key={f}
                    value={f}
                  >
                    {FARM_TYPE_LABEL[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={activeFilter}
              onValueChange={(v) => setActiveFilter(v as ActiveFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="true">Hoạt động</SelectItem>
                <SelectItem value="false">Vô hiệu</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={applyFilter}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {!listQuery.isLoading && items.length === 0 ? (
            <EmptyState
              icon={Sprout}
              title={isFiltered ? "Không có mẫu phù hợp" : "Chưa có mẫu nào"}
              description={
                isFiltered
                  ? "Thử bỏ bộ lọc hoặc đổi từ khoá tìm kiếm."
                  : "Tạo mẫu đầu tiên để Manager có thể prefill khi tạo vụ."
              }
              action={
                isFiltered
                  ? undefined
                  : { label: "Tạo mẫu", onClick: handleOpenCreate }
              }
            />
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <DataTable
                columns={columns}
                data={items}
                isLoading={listQuery.isLoading}
                rowClassName={(t) =>
                  t.deletedAt ? "opacity-50" : undefined
                }
                actions={[
                  {
                    key: "view",
                    label: "Xem chi tiết",
                    icon: Eye,
                    onSelect: (t) =>
                      navigate(`/dashboard/admin/season-templates/${t.id}`),
                  },
                  {
                    key: "usage",
                    label: "Lịch sử sử dụng",
                    icon: BarChart3,
                    onSelect: (t) =>
                      navigate(
                        `/dashboard/admin/season-templates/${t.id}/usage`,
                      ),
                  },
                  {
                    key: "edit",
                    label: "Chỉnh sửa",
                    icon: Pencil,
                    disabled: (t) => Boolean(t.deletedAt),
                    onSelect: (t) => handleOpenEdit(t.id),
                  },
                  {
                    key: "deactivate",
                    label: "Vô hiệu",
                    icon: Power,
                    variant: "destructive",
                    hidden: (t) => !t.isActive || Boolean(t.deletedAt),
                    onSelect: (t) => setToggleTarget(t),
                  },
                  {
                    key: "activate",
                    label: "Kích hoạt",
                    icon: Power,
                    hidden: (t) => t.isActive || Boolean(t.deletedAt),
                    onSelect: (t) => setToggleTarget(t),
                  },
                  {
                    key: "delete",
                    label: "Xoá mẫu",
                    icon: Trash2,
                    variant: "destructive",
                    disabled: (t) => Boolean(t.deletedAt),
                    onSelect: (t) => setDeleteTarget(t),
                  },
                ]}
                emptyText="Chưa có mẫu nào."
              />
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {meta.totalItems} mẫu · Trang {meta.page}/{meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page <= 1}
                  onClick={() =>
                    setQuery((p) => ({ ...p, page: (p.page ?? 1) - 1 }))
                  }
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={meta.page >= meta.totalPages}
                  onClick={() =>
                    setQuery((p) => ({ ...p, page: (p.page ?? 1) + 1 }))
                  }
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Sheet */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditTargetId(null);
        }}
      >
        <SheetContent
          className="sm:max-w-3xl p-0 flex flex-col w-full"
          showCloseButton
        >
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>
              {editTargetId ? "Chỉnh Sửa Mẫu Vụ Mùa" : "Tạo Mẫu Vụ Mùa Mới"}
            </SheetTitle>
            <SheetDescription>
              Thiết kế giai đoạn, công việc và ngưỡng cảm biến. Lưu sẽ tăng
              phiên bản — vụ đã tạo từ mẫu cũ KHÔNG bị ảnh hưởng (BR-115).
            </SheetDescription>
          </SheetHeader>
          {editTargetId && editDetailQuery.isLoading ? (
            <div className="flex flex-1 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AdminSeasonTemplateFormSheet
              mode={editTargetId ? "edit" : "create"}
              initialData={
                editTargetId
                  ? (editDetailQuery.data?.data ?? null)
                  : null
              }
              onSuccess={() => {
                setSheetOpen(false);
                setEditTargetId(null);
              }}
              onCancel={() => {
                setSheetOpen(false);
                setEditTargetId(null);
              }}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Toggle confirm */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={
          toggleTarget?.isActive
            ? `Vô hiệu mẫu "${toggleTarget?.name}"?`
            : `Kích hoạt mẫu "${toggleTarget?.name}"?`
        }
        description={
          toggleTarget?.isActive
            ? "Manager/Owner sẽ không thấy mẫu này khi tạo vụ mới. Vụ đã apply mẫu này KHÔNG bị ảnh hưởng."
            : "Manager/Owner sẽ thấy mẫu này khi tạo vụ mới."
        }
        confirmLabel={toggleTarget?.isActive ? "Vô hiệu" : "Kích hoạt"}
        cancelLabel="Huỷ"
        variant={toggleTarget?.isActive ? "destructive" : "default"}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleTarget(null)}
      />

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={`Xoá mẫu "${deleteTarget?.name}"?`}
        description="Mẫu sẽ bị xoá mềm. Nếu mẫu đã được sử dụng (usage > 0), thao tác sẽ bị chặn — hãy vô hiệu thay vì xoá."
        confirmLabel="Xoá mẫu"
        cancelLabel="Huỷ"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
