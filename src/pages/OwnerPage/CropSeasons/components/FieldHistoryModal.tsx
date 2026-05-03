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
} from "@/lib/tracking-display";
import { format, parseISO } from "date-fns";
import type {
  TrackingEntityType,
  TrackingDataType,
} from "@/schemaValidatation/tracking";

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
      <DialogContent className="max-w-2xl">
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Thời điểm</TableHead>
                  <TableHead>Giá trị cũ</TableHead>
                  <TableHead>Giá trị mới</TableHead>
                  <TableHead>Loại thay đổi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">
                      {format(parseISO(item.changedAt), "dd/MM/yyyy HH:mm")}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatTrackingValue(item.oldValueJson, target.dataType)}
                    </TableCell>
                    <TableCell className="text-sm font-medium">
                      {formatTrackingValue(item.newValueJson, target.dataType)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="text-xs capitalize"
                      >
                        {item.changeType}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

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
