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
import type { ColumnDef } from "@tanstack/react-table";
import { Separator } from "@/components/ui/separator";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import {
  useOwnerTicketList,
  useOwnerTicketDetail,
  useEndIncidentTicket,
  useTicketMessages,
  useCreateTicketMessage,
  useTicketPrescriptions,
} from "@/queries/useTicket";
import { useRealtimeTicket } from "@/hooks/useRealtimeTicket";
import { useTicketSubscription } from "@/hooks/useTicketSubscription";
import { useTicketQualityFlag } from "@/hooks/useTicketQualityFlag";
import TicketDetailPanelV2 from "@/components/ticket-quality/TicketDetailPanelV2";
import { RoleName } from "@/constants/role";
import type { TicketIncidentResType } from "@/schemaValidatation/ticket";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageSquare,
  Pill,
  Send,
  Ticket,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "@/stores/authStore";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

// ── Constants ──────────────────────────────────────────────────────────────

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

const STATUS_LABEL: Record<string, string> = {
  open: "Mở",
  assigned: "Đã phân công",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  closed: "Đã đóng",
  cancelled: "Đã hủy",
};

const STATUS_VARIANT: Record<
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

const ACTIVE_STATUSES = new Set(["open", "assigned", "in_progress"]);

// ── Ticket Detail Panel ────────────────────────────────────────────────────

interface TicketDetailPanelProps {
  ticketId: string;
  onBack: () => void;
}

// Module 3 wrapper — gate UI mới qua feature flag. Phải tách thành component
// riêng để tránh vi phạm rules-of-hooks (early return trước khi gọi hooks
// của TicketDetailPanelLegacy).
function TicketDetailPanel(props: TicketDetailPanelProps) {
  const { enabled: tqEnabled, isLoading: flagLoading } = useTicketQualityFlag();
  const user = useAuthStore((s) => s.user);

  // Khi flag chưa load xong: render skeleton thay vì lộ panel cũ.
  if (flagLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (tqEnabled && user?.id) {
    return (
      <TicketDetailPanelV2
        ticketId={props.ticketId}
        onBack={props.onBack}
        viewerRole="owner"
        viewerUserId={user.id}
      />
    );
  }

  return <TicketDetailPanelLegacy {...props} />;
}

function TicketDetailPanelLegacy({ ticketId, onBack }: TicketDetailPanelProps) {
  const [show, setShow] = useState(false);
  const [msgPage] = useState(1);
  const [rxPage] = useState(1);
  const [msgText, setMsgText] = useState("");
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);

  // Realtime: subscribe room ticket + listen ticket.message.created.
  useTicketSubscription(ticketId);

  const { data: ticketData, isLoading: ticketLoading } =
    useOwnerTicketDetail(ticketId);
  const { data: msgData } = useTicketMessages(ticketId, {
    page: msgPage,
    limit: 50,
  });
  const { data: rxData } = useTicketPrescriptions(ticketId, {
    page: rxPage,
    limit: 20,
  });

  const endMutation = useEndIncidentTicket();
  const sendMutation = useCreateTicketMessage(ticketId);

  const ticket = ticketData?.data;
  const messages = msgData?.data.data ?? [];
  const prescriptions = rxData?.data.data ?? [];

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const handleSend = () => {
    if (!msgText.trim()) return;
    sendMutation.mutate(
      { message: msgText.trim() },
      { onSuccess: () => setMsgText("") },
    );
  };

  const handleEnd = () => {
    endMutation.mutate(ticketId, {
      onSuccess: () => {
        setEndConfirmOpen(false);
        handleBack();
      },
    });
  };

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <Badge className="mb-1">Chi tiết ticket</Badge>
          <h1 className="text-2xl font-bold">
            {ticketLoading ? "Đang tải..." : (ticket?.title ?? "Ticket")}
          </h1>
        </div>
      </div>

      <Separator />

      {ticketLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-8 w-full"
            />
          ))}
        </div>
      ) : !ticket ? (
        <p className="text-sm text-muted-foreground">Không tìm thấy ticket.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Ticket Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  Thông tin sự cố
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mã ticket</span>
                  <span className="font-mono text-xs">
                    {ticket.ticketNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <Badge variant={STATUS_VARIANT[ticket.status]}>
                    {STATUS_LABEL[ticket.status]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mức độ</span>
                  <Badge variant={SEVERITY_VARIANT[ticket.severity]}>
                    {SEVERITY_LABEL[ticket.severity]}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khu vực</span>
                  <span>{ticket.zone?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bác sĩ</span>
                  <span>{ticket.assignee?.fullName ?? "Chưa phân công"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tạo lúc</span>
                  <span>
                    {format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm", {
                      locale: vi,
                    })}
                  </span>
                </div>
                <Separator />
                <p className="text-muted-foreground text-xs">Mô tả</p>
                <p className="text-sm leading-relaxed">{ticket.description}</p>

                {ACTIVE_STATUSES.has(ticket.status) &&
                  ticket.createdBy === user?.id && (
                    <>
                      <Separator />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full"
                        onClick={() => setEndConfirmOpen(true)}
                        disabled={endMutation.isPending}
                      >
                        Kết thúc ticket
                      </Button>
                    </>
                  )}
              </CardContent>
            </Card>

            {/* Prescriptions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Pill className="h-4 w-4" />
                  Đơn thuốc ({prescriptions.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {prescriptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Chưa có đơn thuốc.
                  </p>
                ) : (
                  prescriptions.map((rx) => (
                    <div
                      key={rx.id}
                      className="rounded-md border p-3 text-sm"
                    >
                      <p className="font-medium">{rx.medicineName}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Liều: {rx.dosage}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {format(new Date(rx.createdAt), "dd/MM HH:mm", {
                          locale: vi,
                        })}
                      </p>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right: Messages */}
          <div className="lg:col-span-2">
            <Card className="flex flex-col h-150">
              <CardHeader className="shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Hội thoại
                </CardTitle>
                <CardDescription>Trao đổi với bác sĩ về sự cố</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Chưa có tin nhắn. Hãy gửi tin nhắn đầu tiên.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col gap-1 max-w-[80%] ${isMe ? "self-end items-end" : "self-start items-start"}`}
                      >
                        {!isMe && (
                          <span className="text-xs text-muted-foreground px-1">
                            {msg.sender.fullName}
                          </span>
                        )}
                        <div
                          className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${
                            isMe
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {msg.message}
                        </div>
                        <span className="text-xs text-muted-foreground px-1">
                          {format(new Date(msg.createdAt), "HH:mm dd/MM", {
                            locale: vi,
                          })}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </CardContent>
              {/* Input */}
              {ACTIVE_STATUSES.has(ticket.status) && (
                <div className="shrink-0 border-t p-3 flex gap-2">
                  <Input
                    placeholder="Nhập tin nhắn..."
                    value={msgText}
                    onChange={(e) => setMsgText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={sendMutation.isPending || !msgText.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={endConfirmOpen}
        onCancel={() => setEndConfirmOpen(false)}
        title="Kết thúc ticket?"
        description="Sau khi kết thúc, ticket sẽ được đóng và không thể nhắn tin thêm. Bạn có chắc chắn không?"
        confirmLabel="Kết thúc"
        variant="destructive"
        onConfirm={handleEnd}
      />
    </div>
  );
}

// (CreateTicketPanel đã được gỡ — web FE không còn tạo ticket; toàn bộ luồng
// tạo ticket nay thuộc mobile. Owner chỉ xem & quản lý ticket trên dashboard.)

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

  const { data, isLoading, isError } = useOwnerTicketList(farmId, {
    page,
    limit,
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
      <TicketDetailPanel
        ticketId={viewingTicketId}
        onBack={() => setViewingTicketId(null)}
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
              <Skeleton className="h-6 w-48" />
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
      )}
    </div>
  );
}

export default OwnerTicketsPage;
