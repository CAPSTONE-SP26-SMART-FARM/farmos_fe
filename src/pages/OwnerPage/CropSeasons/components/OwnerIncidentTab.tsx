import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Ticket } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import { useOwnerTicketList } from "@/queries/useTicket";
import { useTicketV2List } from "@/queries/useTicketV2";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import type { CropSeasonType } from "@/types/cropSeason";

const SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

const SEVERITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
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

const TICKET_STATUS_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  open: "default",
  assigned: "secondary",
  in_progress: "default",
  resolved: "secondary",
  closed: "outline",
  cancelled: "outline",
};

export function OwnerIncidentTab({
  cropSeason,
  milestoneId,
}: {
  cropSeason: CropSeasonType;
  /** Khi có, list chỉ sự cố thuộc mốc đó qua `GET /tickets` v2. */
  milestoneId?: string;
}) {
  const navigate = useNavigate();
  const farmQuery = useOwnerGetMyFarm();
  const farmId = farmQuery.data?.data?.id ?? "";

  // Có milestoneId → dùng v2 endpoint với filter milestoneId (BE auto scope
  // theo role owner). Không → fallback legacy list-by-farm rồi filter zone.
  const v2Query = useTicketV2List({
    page: 1,
    limit: 20,
    milestoneId,
  });
  const legacyQuery = useOwnerTicketList(milestoneId ? "" : farmId, {
    page: 1,
    limit: 50,
  });

  const v2Tickets = (v2Query.data?.data.data ?? []) as TicketIncidentResType[];
  const legacyAll = (legacyQuery.data?.data.data ??
    []) as TicketIncidentResType[];
  const tickets = milestoneId
    ? v2Tickets
    : legacyAll.filter((t) => t.zoneId === cropSeason.zoneId);

  const toDetail = (ticketId: string) =>
    navigate(`/dashboard/owner/tickets?ticketId=${ticketId}`);

  const isLoading = milestoneId
    ? v2Query.isLoading
    : farmQuery.isLoading || legacyQuery.isLoading;

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
        <Badge
          variant={SEVERITY_VARIANT[row.original.severity]}
          className="text-xs"
        >
          {SEVERITY_LABEL[row.original.severity]}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => (
        <Badge
          variant={TICKET_STATUS_VARIANT[row.original.status]}
          className="text-xs"
        >
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
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tickets.length > 0
            ? `${tickets.length} sự cố trong khu vực này`
            : "Không có sự cố nào trong khu vực này"}
        </p>
        <Button size="sm" variant="outline" onClick={() => navigate(`/dashboard/owner/tickets`)}>
          <Ticket className="h-3 w-3 mr-1.5" />
          Quản lý ticket
        </Button>
      </div>

      {!isLoading && tickets.length === 0 ? (
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
            isLoading={isLoading}
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
