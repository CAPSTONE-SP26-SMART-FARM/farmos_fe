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
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { TicketStatusBadge } from "@/components/common/TicketStatusBadge";
import type { ColumnDef } from "@tanstack/react-table";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import { useTicketV2List } from "@/queries/useTicketV2";
import { useRealtimeTicket } from "@/hooks/useRealtimeTicket";
import TicketDetailPanelV2 from "@/components/ticket-quality/TicketDetailPanelV2";
import { RoleName } from "@/constants/role";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Ticket,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// ── Main Page ──────────────────────────────────────────────────────────────

function OwnerTicketsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketIdFromQuery = searchParams.get("ticketId");
  const [viewingTicketId, setViewingTicketIdState] = useState<string | null>(
    ticketIdFromQuery,
  );

  // Sync state with URL query param both ways.
  useEffect(() => {
    if (ticketIdFromQuery !== viewingTicketId) {
      setViewingTicketIdState(ticketIdFromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketIdFromQuery]);

  const setViewingTicketId = (id: string | null) => {
    setViewingTicketIdState(id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set("ticketId", id);
        else next.delete("ticketId");
        return next;
      },
      { replace: true },
    );
  };

  const { data: myFarmData, isLoading: farmLoading } = useOwnerGetMyFarm();
  const farmId = myFarmData?.data.id ?? "";

  const { data, isLoading, isError } = useTicketV2List({
    page,
    limit,
    farmId: farmId || undefined,
  });

  // Realtime: invalidate list khi có ticket mới / kết thúc thuộc farm này.
  useRealtimeTicket(RoleName.Owner, { farmId });

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
        <span className="font-medium max-w-50 truncate block">
          {row.original.title}
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
      cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
    },
    {
      accessorKey: "status",
      header: "Trạng thái",
      cell: ({ row }) => <TicketStatusBadge status={row.original.status} />,
    },
    {
      id: "assignee",
      header: "Bác sĩ",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.assignee?.fullName ?? "Chưa phân công"}
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

  if (viewingTicketId) {
    return (
      <TicketDetailPanelV2
        ticketId={viewingTicketId}
        onBack={() => setViewingTicketId(null)}
        viewerRole="owner"
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Cổng chủ trang trại</Badge>
          <h1 className="text-2xl font-bold">Sự Cố & Ticket</h1>
          <p className="text-muted-foreground">
            Theo dõi các sự cố trong nông trại và trạng thái hỗ trợ từ bác sĩ.
          </p>
        </div>
      </div>

      {!farmId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Ticket className="h-8 w-8 text-muted-foreground" />
            </div>
            {farmLoading ? (
              <p className="text-sm text-muted-foreground">Đang tải...</p>
            ) : (
              <>
                <h3 className="text-lg font-semibold mb-1">
                  Chưa có nông trại
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Tài khoản của bạn chưa liên kết với nông trại nào.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Danh sách sự cố
            </CardTitle>
            <CardDescription>
              Tất cả ticket sự cố thuộc nông trại của bạn.
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
                  Không có sự cố nào. Trang trại hoạt động tốt!
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
                        label: "Xem",
                        icon: Eye,
                        onSelect: (ticket) => setViewingTicketId(ticket.id),
                      },
                    ]}
                    onRowClick={(ticket) => setViewingTicketId(ticket.id)}
                    emptyText="Không có sự cố nào."
                  />
                </div>

                {/* Pagination */}
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
                        aria-label="Trang trước"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!meta.hasNextPage}
                        onClick={() => setPage((p) => p + 1)}
                        aria-label="Trang sau"
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
      )}
    </div>
  );
}

export default OwnerTicketsPage;
