import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Ticket } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useNavigate } from "react-router";
import { useManagerTicketList } from "@/queries/useTicket";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import type { CropSeasonType } from "@/types/cropSeason";

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

export function IncidentTab({ cropSeason }: { cropSeason: CropSeasonType }) {
  const navigate = useNavigate();
  const zoneId = cropSeason.zoneId;
  const ticketQuery = useManagerTicketList(zoneId, { page: 1, limit: 20 });
  const tickets = ticketQuery.data?.data.data ?? [];

  const toCreate = () => navigate(`/dashboard/manager/tickets`);
  const toDetail = (ticketId: string) =>
    navigate(`/dashboard/manager/tickets?ticketId=${ticketId}`);

  if (ticketQuery.isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tickets.length > 0 ? `${tickets.length} sự cố gần đây` : "Không có sự cố nào"}
        </p>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center border rounded-md bg-muted/20">
          <Ticket className="h-10 w-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-medium">Không có sự cố nào</p>
          <p className="text-xs text-muted-foreground mt-1">
            Sự cố trong khu vực này sẽ hiển thị tại đây
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-24">Mã</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead className="w-28">Mức độ</TableHead>
                <TableHead className="w-32">Trạng thái</TableHead>
                <TableHead className="w-36">Người báo</TableHead>
                <TableHead className="w-32">Ngày tạo</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket: TicketIncidentResType) => (
                <TableRow
                  key={ticket.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => toDetail(ticket.id)}
                >
                  <TableCell className="font-mono text-xs">{ticket.ticketNumber}</TableCell>
                  <TableCell className="font-medium max-w-52 truncate">{ticket.title}</TableCell>
                  <TableCell>
                    <Badge variant={SEVERITY_VARIANT[ticket.severity]} className="text-xs">
                      {SEVERITY_LABEL[ticket.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={TICKET_STATUS_VARIANT[ticket.status]} className="text-xs">
                      {TICKET_STATUS_LABEL[ticket.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {ticket.creator.fullName}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {format(new Date(ticket.createdAt), "dd/MM/yy HH:mm", { locale: vi })}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); toDetail(ticket.id); }}
                    >
                      Xem
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
