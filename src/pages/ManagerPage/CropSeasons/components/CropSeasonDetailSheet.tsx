import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useState } from "react";
import { useManagerListRequests } from "@/queries/useCropSeason";
import type { CropSeasonType } from "@/types/cropSeason";
import TrackingConfigPanel from "./TrackingConfigPanel";
import { StatusBadge } from "./StatusBadge";
import { formatDate, REQUEST_STATUS_MAP } from "./helpers";

function CropSeasonDetailContent({ season }: { season: CropSeasonType }) {
  const requestsQuery = useManagerListRequests(season.id, { page: 1, limit: 20 });
  const requests = requestsQuery.data?.data.data ?? [];
  const [showTrackingConfig, setShowTrackingConfig] = useState(false);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        {(
          [
            ["Trạng thái", <StatusBadge key="s" status={season.status} />],
            ["Ngày trồng", formatDate(season.plantDate)],
            ["Thu hoạch dự kiến", formatDate(season.expectedHarvestDate)],
            ["Thu hoạch thực tế", formatDate(season.actualHarvestDate)],
            ["Số cây", season.plantCount ?? "—"],
          ] as [string, React.ReactNode][]
        ).map(([label, value]) => (
          <div key={label} className="bg-muted/40 rounded-md p-3">
            <p className="text-muted-foreground text-xs mb-1">{label}</p>
            <div className="font-medium">{value}</div>
          </div>
        ))}
      </div>

      {season.notes && (
        <div className="bg-muted/40 rounded-md p-3 text-sm">
          <p className="text-muted-foreground text-xs mb-1">Ghi chú</p>
          <p>{season.notes}</p>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-sm mb-3">
          Lịch sử yêu cầu phê duyệt
          {requests.length > 0 && (
            <span className="ml-2 text-muted-foreground font-normal">({requests.length})</span>
          )}
        </h4>
        {requestsQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : !requestsQuery.isLoading && requests.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-6 bg-muted/20 rounded-md">
            Chưa có yêu cầu nào được gửi
          </p>
        ) : (
          <div className="rounded-md border">
            <DataTable
              columns={
                [
                  {
                    accessorKey: "sentAt",
                    header: "Ngày gửi",
                    cell: ({ row }) => (
                      <span className="text-sm">{formatDate(row.original.sentAt)}</span>
                    ),
                  },
                  {
                    accessorKey: "status",
                    header: "Trạng thái",
                    cell: ({ row }) => {
                      const rs = REQUEST_STATUS_MAP[row.original.status] ?? {
                        label: row.original.status,
                        variant: "secondary" as const,
                      };
                      return <Badge variant={rs.variant}>{rs.label}</Badge>;
                    },
                  },
                  {
                    accessorKey: "repliedAt",
                    header: "Ngày phản hồi",
                    cell: ({ row }) => (
                      <span className="text-sm">{formatDate(row.original.repliedAt)}</span>
                    ),
                  },
                  {
                    accessorKey: "description",
                    header: "Ghi chú chủ vườn",
                    cell: ({ row }) => (
                      <span className="text-sm max-w-50 truncate block">
                        {row.original.description ?? "—"}
                      </span>
                    ),
                  },
                ] as ColumnDef<(typeof requests)[number]>[]
              }
              data={requests}
              isLoading={requestsQuery.isLoading}
              emptyText="Chưa có yêu cầu nào."
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-sm">Cấu hình theo dõi</h4>
          <Button size="sm" variant="ghost" onClick={() => setShowTrackingConfig((v) => !v)}>
            {showTrackingConfig ? "Ẩn" : "Hiển thị"}
          </Button>
        </div>
        {showTrackingConfig && (
          <TrackingConfigPanel cropSeasonId={season.id} readOnly={season.status !== "planning"} />
        )}
      </div>
    </div>
  );
}

export function CropSeasonDetailSheet({ season }: { season: CropSeasonType }) {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" variant="ghost">
          <Eye className="h-3 w-3 mr-1" />
          Chi tiết
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {season.cropName}
            {season.variety ? ` — ${season.variety}` : ""}
          </SheetTitle>
        </SheetHeader>
        <div className="px-4 pb-4">
          {open && <CropSeasonDetailContent season={season} />}
        </div>
      </SheetContent>
    </Sheet>
  );
}
