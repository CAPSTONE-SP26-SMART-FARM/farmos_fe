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
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useDoctorTicketDetail,
  useDoctorAcceptTicket,
  useTicketMessages,
  useCreateTicketMessage,
  useTicketPrescriptions,
} from "@/queries/useTicket";
import {
  ArrowLeft,
  CheckCircle,
  MessageSquare,
  Pill,
  Plus,
  Send,
  Ticket,
  UserCheck,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { useAuthStore } from "@/stores/authStore";
import { CreatePrescriptionDialog } from "./CreatePrescriptionDialog";

export const SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
};

export const SEVERITY_VARIANT: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  low: "secondary",
  medium: "default",
  high: "destructive",
  critical: "destructive",
};

export const STATUS_LABEL: Record<string, string> = {
  open: "Mở",
  assigned: "Đã phân công",
  in_progress: "Đang xử lý",
  resolved: "Đã giải quyết",
  closed: "Đã đóng",
  cancelled: "Đã hủy",
};

export const STATUS_VARIANT: Record<
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

export const ACTIVE_STATUSES = new Set(["open", "assigned", "in_progress"]);

interface TicketDetailPanelProps {
  ticketId: string;
  onBack: () => void;
}

export function TicketDetailPanel({ ticketId, onBack }: TicketDetailPanelProps) {
  const [show, setShow] = useState(false);
  const [msgText, setMsgText] = useState("");
  const [acceptConfirmOpen, setAcceptConfirmOpen] = useState(false);
  const [rxDialogOpen, setRxDialogOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const user = useAuthStore((s) => s.user);

  const { data: ticketData, isLoading: ticketLoading } =
    useDoctorTicketDetail(ticketId);
  const { data: msgData } = useTicketMessages(ticketId, { page: 1, limit: 50 });
  const { data: rxData } = useTicketPrescriptions(ticketId, {
    page: 1,
    limit: 20,
  });

  const acceptMutation = useDoctorAcceptTicket();
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

  const handleAccept = () => {
    acceptMutation.mutate(ticketId, {
      onSuccess: () => setAcceptConfirmOpen(false),
    });
  };

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
    >
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={handleBack}>
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
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      ) : !ticket ? (
        <p className="text-sm text-muted-foreground">Không tìm thấy ticket.</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
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
                  <span className="font-mono text-xs">{ticket.ticketNumber}</span>
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
                  <span className="text-muted-foreground">Nông trại</span>
                  <span>{ticket.farm?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Khu vực</span>
                  <span>{ticket.zone?.name ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Người báo</span>
                  <span>{ticket.creator.fullName}</span>
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

                {ticket.status === "open" && (
                  <>
                    <Separator />
                    <Button
                      className="w-full gap-1.5"
                      onClick={() => setAcceptConfirmOpen(true)}
                      disabled={acceptMutation.isPending}
                    >
                      <UserCheck className="h-4 w-4" />
                      Nhận ticket
                    </Button>
                  </>
                )}

                {(ticket.status === "assigned" ||
                  ticket.status === "in_progress") &&
                  ticket.assignedTo === user?.id && (
                    <>
                      <Separator />
                      <Button
                        variant="outline"
                        className="w-full gap-1.5"
                        onClick={() => setRxDialogOpen(true)}
                      >
                        <Plus className="h-4 w-4" />
                        Thêm đơn thuốc
                      </Button>
                    </>
                  )}

                {ticket.status === "resolved" && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    Đã giải quyết
                  </div>
                )}
              </CardContent>
            </Card>

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
                    <div key={rx.id} className="rounded-md border p-3 text-sm">
                      <p className="font-medium">{rx.medicineName}</p>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        Liều: {rx.dosage}
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
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

          <div className="lg:col-span-2">
            <Card className="flex flex-col h-150">
              <CardHeader className="shrink-0">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Hội thoại
                </CardTitle>
                <CardDescription>
                  Trao đổi với chủ trang trại / quản lý
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto flex flex-col gap-2 min-h-0">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center flex-1 text-center">
                    <MessageSquare className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Chưa có tin nhắn.
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
                          className={`rounded-xl px-3 py-2 text-sm leading-relaxed ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}
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
        open={acceptConfirmOpen}
        onCancel={() => setAcceptConfirmOpen(false)}
        title="Nhận ticket này?"
        description="Bạn sẽ được phân công xử lý sự cố này. Sau khi nhận, bạn có thể chat và kê đơn thuốc."
        confirmLabel="Nhận ticket"
        onConfirm={handleAccept}
      />

      <CreatePrescriptionDialog
        ticketId={ticketId}
        open={rxDialogOpen}
        onOpenChange={setRxDialogOpen}
      />
    </div>
  );
}
