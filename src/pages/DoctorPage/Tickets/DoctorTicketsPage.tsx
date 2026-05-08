import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
import { useDoctorTicketList } from "@/queries/useTicket";
import { ChevronLeft, ChevronRight, Eye, Ticket } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import {
  TicketDetailPanel,
  SEVERITY_LABEL,
  SEVERITY_VARIANT,
  STATUS_LABEL,
  STATUS_VARIANT,
} from "./components/TicketDetailPanel";

function DoctorTicketsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [viewingTicketId, setViewingTicketId] = useState<string | null>(null);

  const { data, isLoading, isError } = useDoctorTicketList({ page, limit });

  const tickets = (data?.data.data ?? []) as TicketIncidentResType[];
  const meta = data?.data.meta;

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
        <span className="font-medium max-w-45 truncate block">
          {row.original.title}
        </span>
      ),
    },
    {
      id: "farm",
      header: "Nông trại",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.farm?.name ?? "—"}
        </span>
      ),
    },
    {
      id: "zone",
      header: "Khu vực",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.zone?.name ?? "—"}
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
          variant={STATUS_VARIANT[row.original.status]}
          className="text-xs"
        >
          {STATUS_LABEL[row.original.status]}
        </Badge>
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

  if (viewingTicketId) {
    return (
      <TicketDetailPanel
        ticketId={viewingTicketId}
        onBack={() => setViewingTicketId(null)}
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Badge className="mb-2">Cổng bác sĩ</Badge>
        <h1 className="text-2xl font-bold">Hộp Thư Sự Cố</h1>
        <p className="text-muted-foreground">
          Danh sách sự cố cần hỗ trợ và ticket đã được phân công cho bạn.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Danh sách ticket
          </CardTitle>
          <CardDescription>
            Bao gồm ticket đang chờ (open) và ticket bạn đang xử lý.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isError ? (
            <p className="text-sm text-destructive text-center py-8">
              Không tải được danh sách. Vui lòng thử lại.
            </p>
          ) : !isLoading && tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Ticket className="h-8 w-8 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">
                Không có ticket nào cần xử lý.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <DataTable
                  columns={columns}
                  data={tickets}
                  isLoading={isLoading}
                  actions={[
                    {
                      key: "view",
                      label: "Xem chi tiết",
                      icon: Eye,
                      onSelect: (ticket) => setViewingTicketId(ticket.id),
                    },
                  ]}
                  onRowClick={(ticket) => setViewingTicketId(ticket.id)}
                  emptyText="Không có ticket nào."
                />
              </div>

              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
                  <span>
                    Trang {meta.page} / {meta.totalPages} ({meta.totalItems}{" "}
                    ticket)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!meta.hasPreviousPage}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!meta.hasNextPage}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DoctorTicketsPage;
