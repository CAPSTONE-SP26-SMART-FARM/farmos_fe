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
import { formatDateTimeVi } from "@/lib/format";
import type {
  CriticalTicketRow,
  IncidentSeverity,
  TicketStatus,
} from "../_mocks/ticketAnalytics.mock";
import { useNavigate } from "react-router";

const SEVERITY_LABEL: Record<IncidentSeverity, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

const SEVERITY_CLASS: Record<IncidentSeverity, string> = {
  low: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  medium: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  high: "bg-orange-100 text-orange-700 hover:bg-orange-100",
  critical: "bg-rose-100 text-rose-700 hover:bg-rose-100",
};

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Mở mới",
  assigned: "Đã phân công",
  in_progress: "Đang xử lý",
  resolved: "Đã xử lý",
  closed: "Đã đóng",
  cancelled: "Đã huỷ",
};

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "bg-sky-100 text-sky-700 hover:bg-sky-100",
  assigned: "bg-violet-100 text-violet-700 hover:bg-violet-100",
  in_progress: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  resolved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
  closed: "bg-slate-100 text-slate-700 hover:bg-slate-100",
  cancelled: "bg-rose-100 text-rose-700 hover:bg-rose-100",
};

interface CriticalTicketsTableProps {
  rows: CriticalTicketRow[];
  className?: string;
}

function CriticalTicketsTable({ rows, className }: CriticalTicketsTableProps) {
  const navigate = useNavigate();
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-base">Vé ưu tiên gần đây</CardTitle>
        <CardDescription>
          Danh sách vé sự cố ưu tiên cao và nghiêm trọng cần theo dõi.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã vé</TableHead>
                <TableHead>Tiêu đề</TableHead>
                <TableHead>Mức độ</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Bác sĩ</TableHead>
                <TableHead>Trang trại</TableHead>
                <TableHead>Tạo lúc</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(`/dashboard/admin/tickets/${row.id}`)}
                >
                  <TableCell className="font-medium">
                    {row.ticketNumber}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {row.title}
                  </TableCell>
                  <TableCell>
                    <Badge className={SEVERITY_CLASS[row.severity]}>
                      {SEVERITY_LABEL[row.severity]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={STATUS_CLASS[row.status]}
                    >
                      {STATUS_LABEL[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.assignee ? (
                      row.assignee
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-muted-foreground"
                      >
                        Chưa gán
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.farmName}
                  </TableCell>
                  <TableCell className="text-muted-foreground tabular-nums">
                    {formatDateTimeVi(row.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

export default CriticalTicketsTable;
