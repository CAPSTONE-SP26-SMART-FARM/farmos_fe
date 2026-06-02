// src/pages/OwnerPage/CropSeasons/components/MilestoneTrackingTable.tsx
import { format, parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import TableSkeleton from "@/components/common/TableSkeleton";
import { cn } from "@/lib/utils";
import type {
  ProductionMilestoneResType,
  ProductionMilestoneStatusType,
} from "@/schemaValidatation/productionMilestone";

interface Props {
  milestones: ProductionMilestoneResType[];
  isLoading?: boolean;
  isFetching?: boolean;
  onView: (milestone: { id: string; label: string }) => void;
}

const STATUS_LABEL: Record<ProductionMilestoneStatusType, string> = {
  pending: "Chưa diễn ra",
  in_progress: "Đang thực hiện",
  completed: "Hoàn thành",
};

const STATUS_TONE: Record<ProductionMilestoneStatusType, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

function fmtDate(v: string | null): string {
  if (!v) return "—";
  try {
    return format(parseISO(v), "dd/MM/yyyy");
  } catch {
    return "—";
  }
}

function milestoneLabel(m: ProductionMilestoneResType): string {
  return `#${m.milestoneOrder} ${m.stageName}`.trim();
}

export default function MilestoneTrackingTable({
  milestones,
  isLoading,
  isFetching,
  onView,
}: Props) {
  if (isLoading) return <TableSkeleton />;

  return (
    <div
      className={cn(
        "rounded-md border transition-opacity",
        isFetching && "opacity-60",
      )}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Giai đoạn</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Kế hoạch (bắt đầu → kết thúc)</TableHead>
            <TableHead>Thực tế (bắt đầu → kết thúc)</TableHead>
            <TableHead className="w-32 text-right">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {milestones.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                Không tìm thấy giai đoạn nào phù hợp.
              </TableCell>
            </TableRow>
          ) : (
            milestones.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{milestoneLabel(m)}</TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("font-normal", STATUS_TONE[m.status])}
                  >
                    {STATUS_LABEL[m.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground tabular-nums">
                  {fmtDate(m.expectedStartDate)} → {fmtDate(m.expectedEndDate)}
                </TableCell>
                <TableCell className="text-sm tabular-nums">
                  {fmtDate(m.actualStartDate)} → {fmtDate(m.actualEndDate)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1 text-emerald-700 hover:text-emerald-800"
                    onClick={() =>
                      onView({ id: m.id, label: milestoneLabel(m) })
                    }
                  >
                    Xem chi tiết
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
