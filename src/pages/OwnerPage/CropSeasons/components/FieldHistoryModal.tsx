// src/pages/OwnerPage/CropSeasons/components/FieldHistoryModal.tsx
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TableSkeleton from "@/components/common/TableSkeleton";
import { useTrackingFieldHistory } from "@/queries/useTracking";
import {
  getFieldLabel,
  getEntityTypeLabel,
  formatTrackingValue,
  getTrackingActorLines,
} from "@/lib/tracking-display";
import { format, parseISO } from "date-fns";
import type {
  TrackingEntityType,
  TrackingDataType,
  TrackingChangeType,
} from "@/schemaValidatation/tracking";

const CHANGE_TYPE_LABEL: Record<TrackingChangeType, string> = {
  snapshot: "Khởi tạo",
  create: "Tạo mới",
  update: "Cập nhật",
  delete: "Đã xoá",
};

const SOURCE_LABEL: Record<string, string> = {
  manual: "Thủ công",
  system: "Hệ thống",
  iot: "Cảm biến",
  api: "API",
  import: "Nhập liệu",
};

interface FieldHistoryModalProps {
  cropSeasonId: string;
  target: {
    entityType: TrackingEntityType;
    entityId: string;
    fieldName: string;
    dataType: TrackingDataType;
  };
  onClose: () => void;
}

export default function FieldHistoryModal({
  cropSeasonId,
  target,
  onClose,
}: FieldHistoryModalProps) {
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const { data, isLoading } = useTrackingFieldHistory(cropSeasonId, {
    entityType: target.entityType,
    entityId: target.entityId,
    fieldName: target.fieldName,
    page,
    limit: LIMIT,
  });

  const items = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="w-[95vw] sm:max-w-[min(1200px,95vw)] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Lịch sử thay đổi:{" "}
            <span className="font-normal text-muted-foreground">
              {getEntityTypeLabel(target.entityType)} —{" "}
              {getFieldLabel(target.fieldName)}
            </span>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <TableSkeleton />
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Chưa có lịch sử thay đổi.
          </p>
        ) : (
          <>
            <div className="flex-1 overflow-auto rounded-md border">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32.5 whitespace-nowrap">
                      Thời điểm
                    </TableHead>
                    <TableHead className="w-[26%]">Giá trị cũ</TableHead>
                    <TableHead className="w-[26%]">Giá trị mới</TableHead>
                    <TableHead className="w-27.5 whitespace-nowrap">
                      Loại thay đổi
                    </TableHead>
                    <TableHead className="w-25 whitespace-nowrap">
                      Nguồn
                    </TableHead>
                    <TableHead className="w-45 whitespace-nowrap">
                      Người thực hiện
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => {
                    const actor = getTrackingActorLines(item);
                    const sourceKey = item.source?.toLowerCase() ?? "";
                    const sourceLabel = item.source
                      ? (SOURCE_LABEL[sourceKey] ?? item.source)
                      : "—";
                    return (
                      <TableRow
                        key={item.id}
                        className="align-top"
                      >
                        <TableCell className="text-sm whitespace-nowrap">
                          {format(parseISO(item.changedAt), "dd/MM/yyyy HH:mm")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-normal wrap-anywhere">
                          {formatTrackingValue(
                            item.oldValueJson,
                            target.dataType,
                            {
                              entityType: target.entityType,
                              fieldName: target.fieldName,
                            },
                          )}
                        </TableCell>
                        <TableCell className="text-sm font-medium whitespace-normal wrap-anywhere">
                          {formatTrackingValue(
                            item.newValueJson,
                            target.dataType,
                            {
                              entityType: target.entityType,
                              fieldName: target.fieldName,
                            },
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="text-xs whitespace-nowrap"
                          >
                            {CHANGE_TYPE_LABEL[item.changeType] ??
                              item.changeType}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-normal wrap-anywhere">
                          {sourceLabel}
                        </TableCell>
                        <TableCell className="text-sm whitespace-normal wrap-anywhere">
                          {actor.primary ? (
                            <div>
                              <span className="font-medium">{actor.primary}</span>
                              {actor.secondary && (
                                <span className="block text-xs text-muted-foreground mt-0.5">
                                  {actor.secondary}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {meta && meta.totalPages > 1 && (
              <div className="flex justify-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  ← Trước
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  Trang {page} / {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Tiếp →
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
