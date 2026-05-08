import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";
import EmptyState from "@/components/common/EmptyState";
import type {
  ManagerZoneOverview,
  ZoneStatus,
} from "@/types/dashboard";
import { Eye, Map } from "lucide-react";
import { useNavigate } from "react-router";

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
  const navigate = useNavigate();
  const sorted = [...zones].sort(
    (a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status],
  );

  const columns: ColumnDef<ManagerZoneOverview>[] = [
    {
      accessorKey: "zoneName",
      header: "Khu vực",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.zoneName}</span>
      ),
    },
    {
      accessorKey: "activeCropSeason",
      header: "Mùa vụ",
      cell: ({ row }) => {
        const stageLabel = row.original.cropStage
          ? CROP_STAGE_LABELS[row.original.cropStage] ?? row.original.cropStage
          : null;
        return (
          <div className="text-sm">
            {row.original.activeCropSeason ? (
              <div className="space-y-0.5">
                <p>{row.original.activeCropSeason}</p>
                {stageLabel && (
                  <p className="text-xs text-muted-foreground">{stageLabel}</p>
                )}
              </div>
            ) : (
              <span className="text-muted-foreground italic">Chưa có</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "areaSqm",
      header: "Diện tích",
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original.areaSqm.toLocaleString("vi-VN")} m²
        </span>
      ),
    },
    {
      accessorKey: "tasksOpen",
      header: () => <div className="text-right">Tasks</div>,
      cell: ({ row }) => (
        <div className="text-right tabular-nums">{row.original.tasksOpen}</div>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => {
        const meta = STATUS_META[row.original.status];
        return (
          <Badge variant="outline" className={cn(meta.tone)}>
            {meta.label}
          </Badge>
        );
      },
    },
  ];

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
            <DataTable
              columns={columns}
              data={sorted}
              actions={[
                {
                  key: "view",
                  label: "Xem chi tiết",
                  icon: Eye,
                  onSelect: (zone) => navigate(zone.href),
                },
              ]}
              onRowClick={(zone) => navigate(zone.href)}
              emptyText="Chưa có khu vực."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ZonesOverviewCard;
