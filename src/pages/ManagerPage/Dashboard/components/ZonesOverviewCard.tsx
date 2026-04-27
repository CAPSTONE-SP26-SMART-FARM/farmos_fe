import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/common/EmptyState";
import type {
  ManagerZoneOverview,
  ZoneStatus,
} from "../_mocks/managerDashboard.mock";
import { ChevronRight, Map } from "lucide-react";
import { Link } from "react-router";

const STATUS_META: Record<ZoneStatus, { label: string; tone: string }> = {
  healthy: {
    label: "Bình thường",
    tone: "bg-emerald-500/10 text-emerald-700 border-transparent",
  },
  warning: {
    label: "Cảnh báo",
    tone: "bg-amber-500/10 text-amber-700 border-transparent",
  },
  critical: {
    label: "Nguy hiểm",
    tone: "bg-red-500/10 text-red-700 border-transparent",
  },
};

const CROP_STAGE_LABELS: Record<string, string> = {
  germination: "Nảy mầm",
  seedling: "Cây con",
  growth: "Sinh trưởng",
  harvest: "Thu hoạch",
};

const STATUS_RANK: Record<ZoneStatus, number> = {
  critical: 0,
  warning: 1,
  healthy: 2,
};

interface ZonesOverviewCardProps {
  zones: ManagerZoneOverview[];
  className?: string;
}

function ZonesOverviewCard({ zones, className }: ZonesOverviewCardProps) {
  // Sort worst-status first so manager prioritizes problem zones.
  const sorted = [...zones].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  );

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Tổng quan các khu vực</CardTitle>
        <CardDescription>
          {zones.length} khu vực đang được bạn phụ trách.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <EmptyState
            icon={Map}
            title="Chưa có khu vực"
            description="Chưa được phân công khu vực nào."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Khu vực</TableHead>
                  <TableHead>Mùa vụ</TableHead>
                  <TableHead className="w-32">Diện tích</TableHead>
                  <TableHead className="w-20 text-right">Tasks</TableHead>
                  <TableHead className="w-32">Trạng thái</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((zone) => {
                  const meta = STATUS_META[zone.status];
                  const stageLabel = zone.cropStage
                    ? CROP_STAGE_LABELS[zone.cropStage] ?? zone.cropStage
                    : null;
                  return (
                    <TableRow
                      key={zone.zoneId}
                      className="transition-colors hover:bg-muted/40"
                    >
                      <TableCell className="font-medium">
                        {zone.zoneName}
                      </TableCell>
                      <TableCell className="text-sm">
                        {zone.activeCropSeason ? (
                          <div className="space-y-0.5">
                            <p>{zone.activeCropSeason}</p>
                            {stageLabel && (
                              <p className="text-xs text-muted-foreground">
                                {stageLabel}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic">
                            Chưa có
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums">
                        {zone.areaSqm.toLocaleString("vi-VN")} m²
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {zone.tasksOpen}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(meta.tone)}
                        >
                          {meta.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Link
                          to={zone.href}
                          className="flex items-center justify-end text-muted-foreground hover:text-foreground"
                          aria-label={`Xem chi tiết ${zone.zoneName}`}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ZonesOverviewCard;
