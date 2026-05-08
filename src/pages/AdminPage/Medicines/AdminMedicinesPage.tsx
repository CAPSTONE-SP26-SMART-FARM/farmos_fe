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
import EmptyState from "@/components/common/EmptyState";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import {
  useAdminMedicineList,
  useToggleMedicine,
} from "@/queries/useMedicine";
import {
  MEDICINE_FORM_LABEL,
  type ListMedicinesQueryType,
  type MedicineResType,
} from "@/schemaValidatation/medicine";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { Pencil, Pill, Plus, Power, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import AdminMedicineFormSheet from "./AdminMedicineFormSheet";

// ── Page Admin — Danh mục thuốc (B11/B12) ─────────────────────────────────
// Card description: mô tả chức năng card (KHÔNG nói role permission).

type IsActiveFilter = "all" | "true" | "false";

export default function AdminMedicinesPage() {
  const [query, setQuery] = useState<ListMedicinesQueryType>({
    page: 1,
    limit: 20,
    q: "",
  });
  const [searchInput, setSearchInput] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<IsActiveFilter>("all");

  // Sheet state — dùng chung cho cả create & edit. `editTarget` null = create.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MedicineResType | null>(null);

  // Confirm toggle isActive — lưu pending để render copy đúng tên.
  const [toggleTarget, setToggleTarget] = useState<MedicineResType | null>(
    null,
  );

  const listQuery = useAdminMedicineList(query);
  const toggleMutation = useToggleMedicine();

  const items = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

  const handleApplyFilter = () => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      q: searchInput,
      isActive:
        isActiveFilter === "all" ? undefined : isActiveFilter === "true",
    }));
  };

  const handleOpenCreate = () => {
    setEditTarget(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (medicine: MedicineResType) => {
    setEditTarget(medicine);
    setSheetOpen(true);
  };

  const columns = useMemo<ColumnDef<MedicineResType>[]>(
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
        header: "Tên thuốc",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "scientificName",
        header: "Tên khoa học",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground italic">
            {row.original.scientificName ?? "—"}
          </span>
        ),
      },
      {
        accessorKey: "form",
        header: "Dạng",
        cell: ({ row }) => (
          <span className="text-sm">
            {MEDICINE_FORM_LABEL[row.original.form]}
          </span>
        ),
      },
      {
        accessorKey: "unit",
        header: "Đơn vị",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.unit}</span>
        ),
      },
      {
        accessorKey: "strength",
        header: "Hàm lượng",
        cell: ({ row }) => (
          <span className="text-sm">{row.original.strength ?? "—"}</span>
        ),
      },
      {
        accessorKey: "withdrawalPeriodDays",
        header: () => <div className="text-right">Ngừng thuốc (ngày)</div>,
        cell: ({ row }) => (
          <div className="text-right tabular-nums">
            {row.original.withdrawalPeriodDays != null &&
            row.original.withdrawalPeriodDays > 0 ? (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-700 border-amber-200"
              >
                {row.original.withdrawalPeriodDays}
              </Badge>
            ) : (
              <span className="text-muted-foreground text-xs">—</span>
            )}
          </div>
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
                ? "bg-emerald-500/10 text-emerald-700 border-emerald-200"
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

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    try {
      await toggleMutation.mutateAsync({
        id: toggleTarget.id,
        body: { isActive: !toggleTarget.isActive },
      });
      toast.success(
        `${toggleTarget.isActive ? "Đã vô hiệu" : "Đã kích hoạt"} thuốc "${toggleTarget.name}".`,
      );
    } catch (err) {
      toast.error(getApiErrorMessageVi(err));
    } finally {
      setToggleTarget(null);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Danh Mục Thuốc
              </CardTitle>
              <CardDescription>
                Quản lý danh mục thuốc dùng cho đơn thuốc — bao gồm liều khuyến
                nghị, đường dùng, thời gian ngừng thuốc và trạng thái sử dụng.
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Tạo thuốc
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Tìm theo mã, tên hoặc tên khoa học..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
              className="max-w-sm"
            />
            <Select
              value={isActiveFilter}
              onValueChange={(v) => setIsActiveFilter(v as IsActiveFilter)}
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
              onClick={handleApplyFilter}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {!listQuery.isLoading && items.length === 0 ? (
            <EmptyState
              icon={Pill}
              title="Chưa có thuốc nào"
              description="Bắt đầu bằng cách tạo thuốc đầu tiên cho danh mục."
              action={{ label: "Tạo thuốc", onClick: handleOpenCreate }}
            />
          ) : (
            <div className="overflow-x-auto">
              <DataTable
                columns={columns}
                data={items}
                isLoading={listQuery.isLoading}
                actions={[
                  {
                    key: "edit",
                    label: "Chỉnh sửa",
                    icon: Pencil,
                    onSelect: (med) => handleOpenEdit(med),
                  },
                  {
                    key: "toggle-off",
                    label: "Vô hiệu hoá",
                    icon: Power,
                    variant: "destructive",
                    hidden: (med) => !med.isActive,
                    disabled: () => toggleMutation.isPending,
                    onSelect: (med) => setToggleTarget(med),
                  },
                  {
                    key: "toggle-on",
                    label: "Kích hoạt",
                    icon: Power,
                    hidden: (med) => med.isActive,
                    disabled: () => toggleMutation.isPending,
                    onSelect: (med) => setToggleTarget(med),
                  },
                ]}
                emptyText="Chưa có thuốc nào."
              />
            </div>
          )}

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {meta.totalItems} thuốc · Trang {meta.page}/{meta.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasPreviousPage}
                  onClick={() =>
                    setQuery((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                >
                  Trước
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={!meta.hasNextPage}
                  onClick={() =>
                    setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Sheet — dùng chung create/edit */}
      <Sheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setEditTarget(null);
        }}
      >
        <SheetContent
          className="sm:max-w-lg p-0 flex flex-col"
          showCloseButton
        >
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>
              {editTarget ? "Chỉnh Sửa Thuốc" : "Tạo Thuốc Mới"}
            </SheetTitle>
            <SheetDescription>
              Thông tin thuốc dùng cho đơn thuốc của bác sĩ. Các trường bắt
              buộc được đánh dấu sao.
            </SheetDescription>
          </SheetHeader>
          <AdminMedicineFormSheet
            mode={editTarget ? "edit" : "create"}
            initialData={editTarget}
            onSuccess={() => {
              setSheetOpen(false);
              setEditTarget(null);
            }}
            onCancel={() => {
              setSheetOpen(false);
              setEditTarget(null);
            }}
          />
        </SheetContent>
      </Sheet>

      {/* Toggle confirm */}
      <ConfirmDialog
        open={Boolean(toggleTarget)}
        title={
          toggleTarget?.isActive
            ? `Vô hiệu thuốc "${toggleTarget?.name}"?`
            : `Kích hoạt thuốc "${toggleTarget?.name}"?`
        }
        description={
          toggleTarget?.isActive
            ? "Bác sĩ sẽ không thể chọn thuốc này cho đơn mới. Đơn thuốc đã kê vẫn được giữ nguyên."
            : "Bác sĩ sẽ có thể chọn thuốc này cho đơn thuốc mới."
        }
        confirmLabel={toggleTarget?.isActive ? "Vô hiệu" : "Kích hoạt"}
        cancelLabel="Huỷ"
        variant={toggleTarget?.isActive ? "destructive" : "default"}
        onConfirm={handleConfirmToggle}
        onCancel={() => setToggleTarget(null)}
      />
    </div>
  );
}
