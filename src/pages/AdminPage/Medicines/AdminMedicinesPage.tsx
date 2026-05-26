import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import EmptyState from "@/components/common/EmptyState";
import { DataTable } from "@/components/common/DataTable";
import useDebounce from "@/hooks/useDebounce";
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
import { Info, Pill, Plus, Power, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import AdminMedicineFormPanel from "./AdminMedicineFormPanel";

type IsActiveFilter = "all" | "true" | "false";

type DialogState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "detail"; medicine: MedicineResType };

export default function AdminMedicinesPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [isActiveFilter, setIsActiveFilter] = useState<IsActiveFilter>("all");
  const debouncedSearch = useDebounce(search, 500);

  const [dialogState, setDialogState] = useState<DialogState>({
    mode: "closed",
  });
  const close = () => setDialogState({ mode: "closed" });

  const [toggleTarget, setToggleTarget] = useState<MedicineResType | null>(
    null,
  );

  const query: ListMedicinesQueryType = useMemo(
    () => ({
      page,
      limit,
      q: debouncedSearch || "",
      isActive:
        isActiveFilter === "all" ? undefined : isActiveFilter === "true",
    }),
    [page, limit, debouncedSearch, isActiveFilter],
  );

  const listQuery = useAdminMedicineList(query);
  const toggleMutation = useToggleMedicine();

  const items = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

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
        cell: ({ row }) => <span className="text-sm">{row.original.unit}</span>,
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="space-y-2">
          <Badge className="mb-2">Cổng quản trị</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            Danh Mục Thuốc
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Quản lý danh mục thuốc dùng cho đơn thuốc — liều khuyến nghị, đường
            dùng, thời gian ngừng thuốc và trạng thái sử dụng.
          </p>
        </div>
      </section>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5 text-primary" />
                Danh sách thuốc
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  Danh mục thuốc chuẩn để bác sĩ chọn khi kê đơn. Trạng thái vô
                  hiệu chỉ ẩn ở đơn mới, không ảnh hưởng đơn đã kê.
                </TooltipContent>
              </Tooltip>
            </div>
            <Button
              onClick={() => setDialogState({ mode: "create" })}
              size="sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Tạo thuốc
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          <div className="grid gap-3 md:grid-cols-[1fr_200px_140px]">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Tìm kiếm</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm theo mã, tên hoặc tên khoa học"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Trạng thái</p>
              <Select
                value={isActiveFilter}
                onValueChange={(v) => {
                  setIsActiveFilter(v as IsActiveFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="true">Hoạt động</SelectItem>
                  <SelectItem value="false">Vô hiệu</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Số mục</p>
              <Select
                value={String(limit)}
                onValueChange={(v) => {
                  setLimit(Number(v));
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / trang</SelectItem>
                  <SelectItem value="20">20 / trang</SelectItem>
                  <SelectItem value="50">50 / trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="min-h-150">
            {!listQuery.isLoading && items.length === 0 ? (
              <EmptyState
                icon={Pill}
                title="Chưa có thuốc nào"
                description="Bắt đầu bằng cách tạo thuốc đầu tiên cho danh mục."
                action={{
                  label: "Tạo thuốc",
                  onClick: () => setDialogState({ mode: "create" }),
                }}
              />
            ) : (
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={items}
                  isLoading={listQuery.isLoading}
                  actions={[
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
                  onRowClick={(med) =>
                    setDialogState({ mode: "detail", medicine: med })
                  }
                  emptyText="Chưa có thuốc nào."
                />
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span>
              {meta
                ? `Trang ${meta.page} / ${meta.totalPages} (${meta.totalItems} mục)`
                : "—"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!meta?.hasPreviousPage}
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!meta?.hasNextPage}
                onClick={() => setPage((prev) => prev + 1)}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogState.mode !== "closed"}
        onOpenChange={(open) => !open && close()}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogState.mode === "create"
                ? "Tạo thuốc mới"
                : "Chi tiết thuốc"}
            </DialogTitle>
            <DialogDescription>
              {dialogState.mode === "create"
                ? "Thông tin thuốc dùng cho đơn thuốc của bác sĩ. Trường bắt buộc đánh dấu sao."
                : "Xem và chỉnh sửa thuốc. Mã thuốc không thể thay đổi sau khi tạo."}
            </DialogDescription>
          </DialogHeader>
          {dialogState.mode === "create" && (
            <AdminMedicineFormPanel
              mode="create"
              initialData={null}
              onSuccess={close}
              onCancel={close}
            />
          )}
          {dialogState.mode === "detail" && (
            <AdminMedicineFormPanel
              mode="edit"
              initialData={dialogState.medicine}
              onSuccess={close}
              onCancel={close}
            />
          )}
        </DialogContent>
      </Dialog>

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
