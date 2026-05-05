import EmptyState from "@/components/common/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Loader2, Pencil, Plus, Trash2, Wheat } from "lucide-react";
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
}

function formatDateOnly(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return format(new Date(value), "dd/MM/yyyy");
  } catch {
    return value;
  }
}

export default function HarvestRecordTab({ cropSeason }: Props) {
  const zoneId = cropSeason.zoneId;
  const cropSeasonId = cropSeason.id;
  const canCreate = ALLOWED_CREATE_STATUSES.has(cropSeason.status);

  const [query, setQuery] = useState<ListHarvestRecordsQueryType>({
    page: 1,
    limit: 10,
  });
  const [fromInput, setFromInput] = useState("");
  const [toInput, setToInput] = useState("");

  const [sheetOpen, setSheetOpen] = useState(false);
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

  const handleApplyFilter = () => {
    setQuery((prev) => ({
      ...prev,
      page: 1,
      fromDate: fromInput || undefined,
      toDate: toInput || undefined,
    }));
  };

  const handleResetFilter = () => {
    setFromInput("");
    setToInput("");
    setQuery({ page: 1, limit: 10 });
  };

  const handleOpenCreate = () => {
    setEditTarget(null);
    setSheetOpen(true);
  };

  const handleOpenEdit = (record: HarvestRecordResType) => {
    setEditTarget(record);
    setSheetOpen(true);
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
        <Button
          onClick={handleOpenCreate}
          disabled={!canCreate}
          title={
            canCreate
              ? undefined
              : "Chỉ có thể tạo bản ghi khi mùa vụ đã được duyệt, đang hoạt động hoặc đã hoàn tất."
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Tạo bản ghi
        </Button>
      </div>

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
          disabled={!fromInput && !toInput && query.page === 1}
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
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ngày thu hoạch</TableHead>
                <TableHead className="text-right">Sản lượng</TableHead>
                <TableHead>Đơn vị</TableHead>
                <TableHead>Phẩm cấp</TableHead>
                <TableHead>Ghi chú</TableHead>
                <TableHead>Tạo lúc</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    {formatDateOnly(r.harvestDate)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {r.quantity.toLocaleString("vi-VN")}
                  </TableCell>
                  <TableCell>{r.unit}</TableCell>
                  <TableCell>
                    {r.qualityGrade ? (
                      <Badge variant="outline">{r.qualityGrade}</Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[16rem] truncate text-sm text-muted-foreground">
                    {r.notes ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateOnly(r.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleOpenEdit(r)}
                        title="Chỉnh sửa"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteTarget(r)}
                        disabled={deleteMutation.isPending}
                        title="Xoá"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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

      {/* Form Sheet — create / edit */}
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
              {editTarget ? "Chỉnh sửa bản ghi" : "Tạo bản ghi thu hoạch"}
            </SheetTitle>
            <SheetDescription>
              Ghi nhận sản lượng và chất lượng cho mùa vụ {cropSeason.cropName}.
            </SheetDescription>
          </SheetHeader>
          {sheetOpen && (
            <HarvestRecordFormSheet
              key={editTarget?.id ?? "create"}
              mode={editTarget ? "edit" : "create"}
              zoneId={zoneId}
              cropSeasonId={cropSeasonId}
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
          )}
        </SheetContent>
      </Sheet>

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
