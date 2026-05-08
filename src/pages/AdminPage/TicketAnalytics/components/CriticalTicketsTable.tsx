import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import { formatDateTimeVi } from "@/lib/format";
import type {
  CriticalTicketRow,
  IncidentSeverity,
  TicketStatus,
} from "../_mocks/ticketAnalytics.mock";
import type { ColumnDef } from "@tanstack/react-table";
import { Eye } from "lucide-react";
import { useMemo } from "react";
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

  const columns = useMemo<ColumnDef<CriticalTicketRow>[]>(
    () => [
      {
        accessorKey: "ticketNumber",
        header: "Mã vé",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.ticketNumber}</span>
        ),
      },
      {
        accessorKey: "title",
        header: "Tiêu đề",
        cell: ({ row }) => (
          <span className="max-w-xs truncate block">{row.original.title}</span>
        ),
      },
      {
        accessorKey: "severity",
        header: "Mức độ",
        cell: ({ row }) => (
          <Badge className={SEVERITY_CLASS[row.original.severity]}>
            {SEVERITY_LABEL[row.original.severity]}
          </Badge>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={STATUS_CLASS[row.original.status]}
          >
            {STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "assignee",
        header: "Bác sĩ",
        cell: ({ row }) =>
          row.original.assignee ? (
            row.original.assignee
          ) : (
            <Badge
              variant="outline"
              className="text-muted-foreground"
            >
              Chưa gán
            </Badge>
          ),
      },
      {
        accessorKey: "farmName",
        header: "Trang trại",
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.farmName}</span>
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Tạo lúc",
        cell: ({ row }) => (
          <span className="text-muted-foreground tabular-nums">
            {formatDateTimeVi(row.original.createdAt)}
          </span>
        ),
      },
    ],
    [],
  );

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
          <DataTable
            columns={columns}
            data={rows}
            actions={[
              {
                key: "view",
                label: "Xem chi tiết",
                icon: Eye,
                onSelect: (ticket) =>
                  navigate(`/dashboard/admin/tickets/${ticket.id}`),
              },
            ]}
            onRowClick={(ticket) =>
              navigate(`/dashboard/admin/tickets/${ticket.id}`)
            }
            emptyText="Không có vé ưu tiên."
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default CriticalTicketsTable;
