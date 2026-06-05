import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import DatePickerField from "@/components/common/DatePickerField";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useDeleteHarvestRecord,
  useHarvestRecordsByZone,
} from "@/queries/useHarvestRecord";
import type {
  HarvestRecordResType,
  ListHarvestRecordsQueryType,
} from "@/schemaValidatation/harvestRecord";
import type { CropSeasonType } from "@/types/cropSeason";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Pencil, Plus, Trash2, Wheat, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import HarvestRecordFormSheet from "./HarvestRecordFormSheet";

// CRUD Harvest Record gắn vào CropSeason detail (Owner + Manager).
//
// Business rule (BE `harvest-record.service.ts`):
//  - Create chỉ chấp nhận crop season ở status approved | active | completed
//    → FE disable nút "Tạo bản ghi" khi status khác (kèm tooltip).
//  - Update không re-validate status → vẫn cho edit khi đã completed.
//  - Authorization (owner sở hữu farm, manager thuộc ZoneManager) do BE check.

const ALLOWED_CREATE_STATUSES = new Set(["approved", "active", "completed"]);

interface Props {
  cropSeason: CropSeasonType;
  readOnly?: boolean;
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd/MM/yyyy");
  } catch {
    return value;
  }
}

export default function HarvestRecordTab({ cropSeason, readOnly = false }: Props) {
  const zoneId = cropSeason.zoneId;
  const cropSeasonId = cropSeason.id;
  const canCreate = !readOnly && ALLOWED_CREATE_STATUSES.has(cropSeason.status);

  // Default filter = khoảng thời gian của crop season (plantDate → actualHarvest
  // hoặc expectedHarvest nếu chưa có actual). Slice 10 ký tự đầu để chắc chắn
  // format YYYY-MM-DD bất kể BE trả ISO hay date-only.
  const defaultFromDate = (cropSeason.plantDate ?? "").slice(0, 10);
  const defaultToDate = (
    cropSeason.actualHarvestDate ?? cropSeason.expectedHarvestDate ?? ""
  ).slice(0, 10);

  const [query, setQuery] = useState<ListHarvestRecordsQueryType>({
    page: 1,
    limit: 10,
    fromDate: defaultFromDate || undefined,
    toDate: defaultToDate || undefined,
  });
  const [fromInput, setFromInput] = useState(defaultFromDate);
  const [toInput, setToInput] = useState(defaultToDate);

  // Form inline (collapsible) — create / edit ngay trong tab, KHÔNG mở dialog
  // chồng lên dialog "Thu hoạch" chứa tab này. `formOpen` điều khiển collapsible,
  // `editTarget` quyết định mode create vs edit.
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<HarvestRecordResType | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<HarvestRecordResType | null>(
    null,
  );

  const listQuery = useHarvestRecordsByZone(zoneId, query);
  const deleteMutation = useDeleteHarvestRecord();

  // BE list theo zone — filter client-side về crop season hiện tại để chỉ
  // hiển thị bản ghi của season này (cùng tab CropSeason detail).
  const meta = listQuery.data?.data?.meta;
  const items = useMemo(() => {
    const all = listQuery.data?.data?.data ?? [];
    return all.filter((r) => r.cropSeasonId === cropSeasonId);
  }, [listQuery.data, cropSeasonId]);

  // Tổng sản lượng gộp theo đơn vị (tạ/kg/tấn… có thể lẫn lộn nên không cộng
  // chung) — hiển thị làm dải tóm tắt phía trên bảng cho đỡ trống.
  const totalsByUnit = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of items) m.set(r.unit, (m.get(r.unit) ?? 0) + r.quantity);
    return [...m.entries()];
  }, [items]);

  const handleApplyFilter = () => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      fromDate: fromInput || undefined,
      toDate: toInput || undefined,
    }));
  };

  const handleResetFilter = () => {
    setFromInput(defaultFromDate);
    setToInput(defaultToDate);
    setQuery({
      page: 1,
      limit: 10,
      fromDate: defaultFromDate || undefined,
      toDate: defaultToDate || undefined,
    });
  };

  const handleOpenCreate = () => {
    setEditTarget(null);
    setFormOpen(true);
  };

  // Nút header: đang mở ở chế độ tạo mới thì bấm lần nữa để đóng (toggle).
  const handleToggleCreate = () => {
    if (formOpen && !editTarget) {
      handleCloseForm();
    } else {
      handleOpenCreate();
    }
  };

  const handleOpenEdit = (record: HarvestRecordResType) => {
    setEditTarget(record);
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditTarget(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("Đã xoá bản ghi thu hoạch.");
    } catch (err) {
      toast.error(getApiErrorMessageVi(err));
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header + Create */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            <Wheat className="h-4 w-4" />
            Bản ghi thu hoạch
          </h3>
          <p className="text-xs text-muted-foreground">
            Ghi nhận sản lượng và chất lượng theo từng đợt thu hoạch của mùa vụ.
          </p>
        </div>
        {!readOnly && (
          <Button
            onClick={handleToggleCreate}
            disabled={!canCreate}
            variant={formOpen && !editTarget ? "outline" : "default"}
            title={
              canCreate
                ? undefined
                : "Chỉ có thể tạo bản ghi khi mùa vụ đã được duyệt, đang hoạt động hoặc đã hoàn tất."
            }
          >
            {formOpen && !editTarget ? (
              <>
                <X className="mr-2 h-4 w-4" />
                Đóng
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Tạo bản ghi
              </>
            )}
          </Button>
        )}
      </div>

      {/* Danh sách + form: 2 card cạnh nhau. Khi chưa tạo, card danh sách ôm
          full width; bấm "Tạo bản ghi" thì card form trượt ra bên phải và card
          danh sách tự co lại (mượt nhờ `layout`). Form chỉ animate opacity +
          transform `x` nên Dialog canh giữa không bị re-center → không giật. */}
      <div className="flex flex-col items-stretch gap-4 lg:flex-row">
        {/* Card trái — danh sách bản ghi. KHÔNG dùng `layout` (animate width =
            reflow → Dialog canh giữa re-center từng frame → giật). Card co lại
            tức thì 1 nhịp khi form mở; form bên phải mới là phần trượt mượt. */}
        <div className="w-full min-w-0 flex-1">
          <Card className="h-full gap-4 py-4">
            <CardContent className="space-y-4 px-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-end gap-3 rounded-md border bg-muted/30 p-3">
        <div className="w-44">
          <DatePickerField
            label="Từ ngày"
            value={fromInput}
            onChange={setFromInput}
            placeholder="Từ ngày"
          />
        </div>
        <div className="w-44">
          <DatePickerField
            label="Đến ngày"
            value={toInput}
            onChange={setToInput}
            placeholder="Đến ngày"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleApplyFilter}
        >
          Áp dụng
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleResetFilter}
          disabled={
            fromInput === defaultFromDate &&
            toInput === defaultToDate &&
            query.page === 1
          }
        >
          Đặt lại
        </Button>
      </div>

      {/* Table */}
      {listQuery.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Wheat}
          title="Chưa có bản ghi thu hoạch"
          description={
            canCreate
              ? "Tạo bản ghi đầu tiên để theo dõi sản lượng thu hoạch."
              : "Mùa vụ chưa ở trạng thái cho phép ghi nhận thu hoạch."
          }
          action={
            canCreate
              ? { label: "Tạo bản ghi", onClick: handleOpenCreate }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Dải tóm tắt: số đợt + tổng sản lượng theo từng đơn vị */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <span className="font-medium">{items.length} đợt thu hoạch</span>
            {totalsByUnit.length > 0 && (
              <>
                <span className="text-muted-foreground">· Tổng sản lượng:</span>
                {totalsByUnit.map(([unit, qty]) => (
                  <Badge
                    key={unit}
                    variant="secondary"
                    className="tabular-nums"
                  >
                    {qty.toLocaleString("vi-VN")} {unit}
                  </Badge>
                ))}
              </>
            )}
          </div>

          <div className="overflow-x-auto">
            <DataTable
            columns={
              [
                {
                  accessorKey: "harvestDate",
                  header: "Ngày thu hoạch",
                  cell: ({ row }) => (
                    <span className="font-medium">
                      {formatDateOnly(row.original.harvestDate)}
                    </span>
                  ),
                },
                {
                  accessorKey: "quantity",
                  header: () => <div className="text-right">Sản lượng</div>,
                  cell: ({ row }) => (
                    <div className="text-right tabular-nums">
                      {row.original.quantity.toLocaleString("vi-VN")}
                    </div>
                  ),
                },
                {
                  accessorKey: "unit",
                  header: "Đơn vị",
                  cell: ({ row }) => row.original.unit,
                },
                {
                  accessorKey: "qualityGrade",
                  header: "Phẩm cấp",
                  cell: ({ row }) =>
                    row.original.qualityGrade ? (
                      <Badge variant="outline">{row.original.qualityGrade}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    ),
                },
                {
                  accessorKey: "notes",
                  header: "Ghi chú",
                  cell: ({ row }) => (
                    <span className="max-w-[16rem] truncate text-sm text-muted-foreground block">
                      {row.original.notes ?? "—"}
                    </span>
                  ),
                },
                {
                  accessorKey: "createdAt",
                  header: "Tạo lúc",
                  cell: ({ row }) => (
                    <span className="text-xs text-muted-foreground">
                      {formatDateOnly(row.original.createdAt)}
                    </span>
                  ),
                },
              ] as ColumnDef<HarvestRecordResType>[]
            }
            data={items}
            actions={
              readOnly
                ? undefined
                : [
                    {
                      key: "edit",
                      label: "Chỉnh sửa",
                      icon: Pencil,
                      onSelect: (r) => handleOpenEdit(r),
                    },
                    {
                      key: "delete",
                      label: "Xoá",
                      icon: Trash2,
                      variant: "destructive",
                      disabled: () => deleteMutation.isPending,
                      onSelect: (r) => setDeleteTarget(r),
                    },
                  ]
            }
            emptyText="Chưa có bản ghi."
            />
          </div>
        </div>
      )}

      {/* Pagination — BE list theo zone, không filter cropSeasonId nên meta */}
      {/* phản ánh tổng số bản ghi cả zone. Vẫn cho phép chuyển trang nếu BE */}
      {/* trả nhiều hơn 1 trang.                                                */}
      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground">
            {meta.totalItems} bản ghi trong khu vực · Trang {meta.page}/
            {meta.totalPages}
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
        </div>

        {/* Card phải — form tạo / sửa, mở ra giống collapsible (slide + fade). */}
        {!readOnly && (
          <AnimatePresence initial={false}>
            {formOpen && (
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="w-full shrink-0 lg:w-95"
              >
                <Card className="h-full gap-4 py-4">
                  <CardContent className="px-4">
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-semibold text-sm">
                          {editTarget
                            ? "Chỉnh sửa bản ghi"
                            : "Tạo bản ghi thu hoạch"}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          Ghi nhận sản lượng và chất lượng cho mùa vụ{" "}
                          {cropSeason.cropName}.
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 shrink-0"
                        onClick={handleCloseForm}
                        aria-label="Đóng biểu mẫu"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <HarvestRecordFormSheet
                      key={editTarget?.id ?? "create"}
                      mode={editTarget ? "edit" : "create"}
                      zoneId={zoneId}
                      cropSeasonId={cropSeasonId}
                      initialData={editTarget}
                      onSuccess={handleCloseForm}
                      onCancel={handleCloseForm}
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Xoá bản ghi thu hoạch?"
        description={
          deleteTarget
            ? `Bản ghi ngày ${formatDateOnly(deleteTarget.harvestDate)} (${
                deleteTarget.quantity
              } ${deleteTarget.unit}) sẽ bị xoá vĩnh viễn.`
            : undefined
        }
        confirmLabel="Xoá"
        cancelLabel="Huỷ"
        variant="destructive"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
