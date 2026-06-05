import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { TicketStatusBadge } from "@/components/common/TicketStatusBadge";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye, Ticket } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router";
import { cn } from "@/lib/utils";
import { useTicketV2List } from "@/queries/useTicketV2";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";

interface RecentIncidentsCardProps {
  farmId: string;
  className?: string;
}

function RecentIncidentsCard({ farmId, className }: RecentIncidentsCardProps) {
  const navigate = useNavigate();

  const { data, isLoading, isError } = useTicketV2List({
    page: 1,
    limit: 10,
    farmId: farmId || undefined,
  });

  const tickets = (data?.data.data ?? []) as TicketIncidentResType[];

  const goToDetail = (ticketId: string) =>
    navigate(`/dashboard/owner/tickets?ticketId=${ticketId}`);

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
        <span className="font-medium max-w-50 truncate block">
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
      accessorKey: "createdAt",
      header: "Tạo lúc",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {format(new Date(row.original.createdAt), "dd/MM HH:mm", {
            locale: vi,
          })}
        </span>
      ),
    },
  ];

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Ticket className="h-4 w-4" />
          Sự cố gần đây
        </CardTitle>
        <CardDescription>
          10 ticket sự cố mới nhất được tạo trên trang trại của bạn. Bấm để xem
          chi tiết.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isError ? (
          <p className="py-8 text-center text-sm text-destructive">
            Không tải được danh sách. Vui lòng thử lại.
          </p>
        ) : !isLoading && tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <Ticket className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Chưa có sự cố nào. Trang trại hoạt động tốt!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable
              columns={columns}
              data={tickets}
              isLoading={isLoading}
              actions={[
                {
                  key: "view",
                  label: "Xem",
                  icon: Eye,
                  onSelect: (ticket) => goToDetail(ticket.id),
                },
              ]}
              onRowClick={(ticket) => goToDetail(ticket.id)}
              emptyText="Không có sự cố nào."
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentIncidentsCard;
