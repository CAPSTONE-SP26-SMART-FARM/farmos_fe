import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useDoctorTicketList } from "@/queries/useTicket";
import { ChevronLeft, ChevronRight, Ticket } from "lucide-react";
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

  const tickets = data?.data.data ?? [];
  const meta = data?.data.meta;

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
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
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
                Không có ticket nào cần xử lý.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã</TableHead>
                      <TableHead>Tiêu đề</TableHead>
                      <TableHead>Nông trại</TableHead>
                      <TableHead>Khu vực</TableHead>
                      <TableHead>Mức độ</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead>Ngày tạo</TableHead>
                      <TableHead className="w-24"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tickets.map((ticket: TicketIncidentResType) => (
                      <TableRow
                        key={ticket.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setViewingTicketId(ticket.id)}
                      >
                        <TableCell className="font-mono text-xs">
                          {ticket.ticketNumber}
                        </TableCell>
                        <TableCell className="font-medium max-w-45 truncate">
                          {ticket.title}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ticket.farm?.name ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {ticket.zone?.name ?? "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={SEVERITY_VARIANT[ticket.severity]}
                            className="text-xs"
                          >
                            {SEVERITY_LABEL[ticket.severity]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={STATUS_VARIANT[ticket.status]}
                            className="text-xs"
                          >
                            {STATUS_LABEL[ticket.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {format(
                            new Date(ticket.createdAt),
                            "dd/MM/yy HH:mm",
                            { locale: vi },
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setViewingTicketId(ticket.id);
                            }}
                          >
                            {ticket.status === "open" ? "Xem & Nhận" : "Xem"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
