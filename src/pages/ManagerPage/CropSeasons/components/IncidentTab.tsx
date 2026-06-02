import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Ticket } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router";
import { useManagerTicketList } from "@/queries/useTicket";
import { useTicketV2List } from "@/queries/useTicketV2";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import type { CropSeasonType } from "@/types/cropSeason";
import { IncidentTicketQuotaPanel } from "./IncidentTicketQuotaPanel";

const SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

const SEVERITY_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
  critical: "destructive",
};

const TICKET_STATUS_LABEL: Record<string, string> = {
  open: "Mở",
  assigned: "Đã phân công",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  closed: "Đã đóng",
  cancelled: "Đã hủy",
};

const TICKET_STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "default",
  assigned: "secondary",
  in_progress: "default",
  resolved: "secondary",
  closed: "outline",
  cancelled: "outline",
};

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

  // Có milestoneId → dùng endpoint v2 hierarchical (`GET /tickets`) với filter
  // milestoneId. Không có → fallback list theo zone (legacy endpoint).
  const v2Query = useTicketV2List(
    milestoneId
      ? { page: 1, limit: 20, milestoneId }
      : { page: 1, limit: 20, zoneId },
  );
  const legacyQuery = useManagerTicketList(
    milestoneId ? "" : zoneId,
    { page: 1, limit: 20 },
  );

  const ticketQuery = milestoneId ? v2Query : legacyQuery;
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
      cell: ({ row }) => (
        <Badge variant={SEVERITY_VARIANT[row.original.severity]} className="text-xs">
          {SEVERITY_LABEL[row.original.severity]}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge variant={TICKET_STATUS_VARIANT[row.original.status]} className="text-xs">
          {TICKET_STATUS_LABEL[row.original.status]}
        </Badge>
      ),
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
