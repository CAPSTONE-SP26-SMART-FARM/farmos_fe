import { DataTable } from "@/components/common/DataTable";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { TicketStatusBadge } from "@/components/common/TicketStatusBadge";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Ticket } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router";
import { useTicketV2List } from "@/queries/useTicketV2";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import type { CropSeasonType } from "@/types/cropSeason";
import { IncidentTicketQuotaPanel } from "./IncidentTicketQuotaPanel";

export function IncidentTab({
  cropSeason,
  milestoneId,
}: {
  cropSeason: CropSeasonType;
  /** Khi có milestoneId, list chỉ sự cố thuộc mốc đó qua `GET /tickets` v2. */
  milestoneId?: string;
}) {
  const navigate = useNavigate();
  const zoneId = cropSeason.zoneId;

  // BE v2 hierarchical scope tự lọc theo role manager (giới hạn theo zone
  // được phân công). Có milestoneId → filter mốc; không → scope zone.
  const ticketQuery = useTicketV2List(
    milestoneId
      ? { page: 1, limit: 20, milestoneId }
      : { page: 1, limit: 20, zoneId },
  );

  const tickets = (ticketQuery.data?.data.data ?? []) as TicketIncidentResType[];

  const toDetail = (ticketId: string) =>
    navigate(`/dashboard/manager/tickets?ticketId=${ticketId}`);

  const columns: ColumnDef<TicketIncidentResType>[] = [
    {
      accessorKey: "ticketNumber",
      header: "Mã",
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.ticketNumber}</span>
      ),
    },
    {
      accessorKey: "title",
      header: "Tiêu đề",
      cell: ({ row }) => (
        <span className="font-medium max-w-52 truncate block">
          {row.original.title}
        </span>
      ),
    },
    {
      accessorKey: "severity",
      header: "Mức độ",
      cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
    },
    {
      id: "creator",
      header: "Người báo",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.creator.fullName}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Ngày tạo",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.createdAt), "dd/MM/yy HH:mm", {
            locale: vi,
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <IncidentTicketQuotaPanel />

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tickets.length > 0 ? `${tickets.length} sự cố gần đây` : "Không có sự cố nào"}
        </p>
      </div>

      {!ticketQuery.isLoading && tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
          <Ticket className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">Không có sự cố nào</p>
          <p className="text-xs text-muted-foreground mt-1">
            Sự cố trong khu vực này sẽ hiển thị tại đây
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <DataTable
            columns={columns}
            data={tickets}
            isLoading={ticketQuery.isLoading}
            actions={[
              {
                key: "view",
                label: "Xem chi tiết",
                icon: Eye,
                onSelect: (ticket) => toDetail(ticket.id),
              },
            ]}
            onRowClick={(ticket) => toDetail(ticket.id)}
            emptyText="Không có sự cố nào."
          />
        </div>
      )}
    </div>
  );
}
