import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { QueuePaginationType } from "@/schemaValidatation/iotDeviceAdminOps";

interface Props {
  pagination: QueuePaginationType | undefined;
  onPageChange: (page: number) => void;
}

export function QueuePagination({ pagination, onPageChange }: Props) {
  if (!pagination || pagination.totalPages <= 1) return null;

  const { page, pageSize, totalFarms, totalPages } = pagination;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalFarms);

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-3">
      <span className="text-xs text-muted-foreground">
        Trang {page}/{totalPages} · {from}–{to} của {totalFarms} nông trại
      </span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft
            className="mr-1 h-4 w-4"
            aria-hidden
          />
          Trước
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Sau
          <ChevronRight
            className="ml-1 h-4 w-4"
            aria-hidden
          />
        </Button>
      </div>
    </div>
  );
}
