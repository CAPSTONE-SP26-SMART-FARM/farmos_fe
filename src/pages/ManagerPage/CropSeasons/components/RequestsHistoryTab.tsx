import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useManagerListRequests } from "@/queries/useCropSeason";
import TrackingConfigPanel from "./TrackingConfigPanel";
import { formatDate, REQUEST_STATUS_MAP } from "./helpers";

export function RequestsHistoryTab({
  cropSeasonId,
  readOnly,
}: {
  cropSeasonId: string;
  readOnly: boolean;
}) {
  const requestsQuery = useManagerListRequests(cropSeasonId, { page: 1, limit: 20 });
  const requests = requestsQuery.data?.data.data ?? [];
  const [showTracking, setShowTracking] = useState(false);

  type RequestRow = (typeof requests)[number];

  const columns: ColumnDef<RequestRow>[] = [
    {
      accessorKey: "sentAt",
      header: "Ngày gửi",
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.sentAt)}</span>,
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
      cell: ({ row }) => <span className="text-sm">{formatDate(row.original.repliedAt)}</span>,
    },
    {
      accessorKey: "description",
      header: "Ghi chú chủ trang trại",
      cell: ({ row }) => (
        <span className="text-sm max-w-50 truncate block">
          {row.original.description ?? "—"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Lịch sử yêu cầu phê duyệt
          {requests.length > 0 && (
            <span className="text-muted-foreground font-normal">({requests.length})</span>
          )}
        </h3>
        {!requestsQuery.isLoading && requests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center bg-muted/20 rounded-md">
            Chưa có yêu cầu nào được gửi
          </p>
        ) : (
          <div className="rounded-md border">
            <DataTable
              columns={columns}
              data={requests}
              isLoading={requestsQuery.isLoading}
              emptyText="Chưa có yêu cầu nào."
            />
          </div>
        )}
      </div>

      {!readOnly && (
        <div>
          <Separator className="mb-4" />
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold">Cấu hình theo dõi</h3>
            <Button size="sm" variant="ghost" onClick={() => setShowTracking((v) => !v)}>
              {showTracking ? "Ẩn" : "Hiển thị"}
            </Button>
          </div>
          {showTracking && <TrackingConfigPanel cropSeasonId={cropSeasonId} readOnly={false} />}
        </div>
      )}
    </div>
  );
}
