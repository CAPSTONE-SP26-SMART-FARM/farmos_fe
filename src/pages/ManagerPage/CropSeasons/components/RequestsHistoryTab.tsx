import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          Lịch sử yêu cầu phê duyệt
          {requests.length > 0 && (
            <span className="text-muted-foreground font-normal">({requests.length})</span>
          )}
        </h3>
        {requestsQuery.isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        ) : requests.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center bg-muted/20 rounded-md">
            Chưa có yêu cầu nào được gửi
          </p>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày gửi</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày phản hồi</TableHead>
                  <TableHead>Ghi chú chủ vườn</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => {
                  const rs = REQUEST_STATUS_MAP[r.status] ?? {
                    label: r.status,
                    variant: "secondary" as const,
                  };
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{formatDate(r.sentAt)}</TableCell>
                      <TableCell>
                        <Badge variant={rs.variant}>{rs.label}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(r.repliedAt)}</TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">
                        {r.description ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
