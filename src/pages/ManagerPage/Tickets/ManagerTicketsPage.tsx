import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/common/DataTable";
import { SeverityBadge } from "@/components/common/SeverityBadge";
import { TicketStatusBadge } from "@/components/common/TicketStatusBadge";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useManagerListAssignedZones } from "@/queries/useZone";
import { useTicketV2List } from "@/queries/useTicketV2";
import { useRealtimeTicket } from "@/hooks/useRealtimeTicket";
import TicketDetailPanelV2 from "@/components/ticket-quality/TicketDetailPanelV2";
import { RoleName } from "@/constants/role";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Map,
  Ticket,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

// ── Main Page ──────────────────────────────────────────────────────────────

function ManagerTicketsPage() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const [selectedZoneId, setSelectedZoneId] = useState<string>("");
  const [searchParams, setSearchParams] = useSearchParams();
  const ticketIdFromQuery = searchParams.get("ticketId");
  const [viewingTicketId, setViewingTicketIdState] = useState<string | null>(
    ticketIdFromQuery,
  );

  // Sync URL ticketId ↔ state.
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

  const zonesQuery = useManagerListAssignedZones({ page: 1, limit: 100 });
  const zones = useMemo(
    () => zonesQuery.data?.data.data ?? [],
    [zonesQuery.data],
  );

  // Default to first zone.
  useEffect(() => {
    if (zones.length > 0 && !selectedZoneId) {
      setSelectedZoneId(zones[0].id);
    }
  }, [zones, selectedZoneId]);

  const { data, isLoading, isError } = useTicketV2List({
    page,
    limit,
    zoneId: selectedZoneId || undefined,
  });

  // Realtime: invalidate ticket list khi có event thuộc zone đang xem.
  useRealtimeTicket(RoleName.Manager, { zoneId: selectedZoneId });

  const tickets = (data?.data.data ?? []) as TicketIncidentResType[];
  const meta = data?.data.meta;

  const managerTicketColumns: ColumnDef<TicketIncidentResType>[] = [
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
      id: "creator",
      header: "Người báo",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.creator.fullName}
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
        viewerRole="manager"
      />
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Cổng quản lý</Badge>
          <h1 className="text-2xl font-bold">Sự Cố & Ticket</h1>
          <p className="text-muted-foreground">
            Theo dõi sự cố trong các khu vực bạn quản lý.
          </p>
        </div>
      </div>

      {/* Zone selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Map className="h-4 w-4" />
            Chọn khu vực
          </CardTitle>
        </CardHeader>
        <CardContent>
          {zonesQuery.isLoading ? (
            <Skeleton className="h-10 w-64" />
          ) : zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Bạn chưa được phân công khu vực nào.
            </p>
          ) : (
            <Select
              value={selectedZoneId}
              onValueChange={(v) => {
                setSelectedZoneId(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full max-w-xs">
                <SelectValue placeholder="Chọn khu vực" />
              </SelectTrigger>
              <SelectContent>
                {zones.map((z) => (
                  <SelectItem
                    key={z.id}
                    value={z.id}
                  >
                    {z.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {selectedZoneId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4" />
              Danh sách sự cố
            </CardTitle>
            <CardDescription>
              Ticket sự cố trong khu vực đã chọn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-12 w-full"
                  />
                ))}
              </div>
            ) : isError ? (
              <p className="text-sm text-destructive text-center py-8">
                Không tải được danh sách. Vui lòng thử lại.
              </p>
            ) : tickets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Ticket className="h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">
                  Không có sự cố nào trong khu vực này.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <DataTable
                    columns={managerTicketColumns}
                    data={tickets}
                    actions={[
                      {
                        key: "view",
                        label: "Xem chi tiết",
                        icon: Eye,
                        onSelect: (ticket) => setViewingTicketId(ticket.id),
                      },
                    ]}
                    onRowClick={(ticket) => setViewingTicketId(ticket.id)}
                    emptyText="Không có sự cố nào."
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

export default ManagerTicketsPage;
