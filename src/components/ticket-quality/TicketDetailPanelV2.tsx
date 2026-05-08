import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import LoadingCard from "@/components/common/LoadingCard";
import {
  CLOSE_REASON_BADGE_CLASS,
  CLOSE_REASON_LABEL,
} from "@/constants/ticketQualityLabels";
import { useRealtimeTicketDetail } from "@/hooks/useRealtimeTicketDetail";
import { useRealtimeTicket } from "@/hooks/useRealtimeTicket";
import { RoleName, type RoleNameType } from "@/constants/role";
import { getApiErrorMessageVi } from "@/lib/error-message";
import {
  useCreateTicketMessage,
  useTicketFull,
  useTicketMessages,
} from "@/queries/useTicket";
import type { TicketBasicResType } from "@/schemaValidatation/ticket";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  Info,
  MessageSquare,
  Send,
  ShieldAlert,
  Ticket,
  Wallet,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import AbandonResolutionModal from "./AbandonResolutionModal";
import AddendumList from "./AddendumList";
import AutoCloseCountdown from "./AutoCloseCountdown";
import BroadcastTimeline from "./BroadcastTimeline";
import CancelTicketModal from "./CancelTicketModal";
import CloseAndRateModal from "./CloseAndRateModal";
import PrescriptionItemsCard from "./PrescriptionItemsCard";
import RatingDisplay from "./RatingDisplay";
import SolutionViewCard from "./SolutionViewCard";

interface TicketDetailPanelV2Props {
  ticketId: string;
  onBack: () => void;
  viewerRole: "owner" | "manager";
  viewerUserId: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<TicketBasicResType["status"], string> = {
  OPEN: "Mở",
  ASSIGNED: "Đã phân công",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đã đóng",
  CANCELLED: "Đã huỷ",
};

const STATUS_BADGE_CLASS: Record<TicketBasicResType["status"], string> = {
  OPEN: "bg-muted text-foreground",
  ASSIGNED: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
  IN_PROGRESS: "bg-amber-500/10 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  CLOSED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-500/10 text-red-700 border-red-200",
};

const SEVERITY_LABEL: Record<string, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  critical: "Nghiêm trọng",
  // BE B8 trả severity là string lower-case (theo `TicketBasicResSchema:233`).
};

// ── Main component ───────────────────────────────────────────────────────

export default function TicketDetailPanelV2({
  ticketId,
  onBack,
  viewerRole,
  viewerUserId,
}: TicketDetailPanelV2Props) {
  // Slide-in animation pattern (DEVELOPMENT.md mục Animation Patterns).
  const [show, setShow] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  // Modal state.
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [abandonModalOpen, setAbandonModalOpen] = useState(false);
  const [abandonTriggeredByFallback, setAbandonTriggeredByFallback] =
    useState(false);
  // Đảm bảo chỉ auto-mở Abandon modal 1 lần cho mỗi flag bật từ BE
  // (`pendingFallbackChoice=true`). Tránh re-mở mỗi lần invalidate.
  const [autoOpenedFallback, setAutoOpenedFallback] = useState(false);

  // Chat input.
  const [msgText, setMsgText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Data.
  const fullQuery = useTicketFull(ticketId);
  const msgQuery = useTicketMessages(ticketId, { page: 1, limit: 50 });
  const sendMessageMutation = useCreateTicketMessage(ticketId);

  // Realtime — list scope (debounce invalidate) + detail scope (auto-mở Abandon modal).
  const role: RoleNameType =
    viewerRole === "owner" ? RoleName.Owner : RoleName.Manager;
  // useRealtimeTicket cần farmId/zoneId để filter scope. Lấy từ ticket data.
  const fullData = fullQuery.data?.data;
  const ticket = fullData?.ticket;
  useRealtimeTicket(role, {
    farmId: ticket?.farmId ?? undefined,
    zoneId: ticket?.zoneId ?? undefined,
  });
  useRealtimeTicketDetail(ticketId, {
    onResolved: () => {
      toast.info("Bác sĩ đã giải quyết ticket. Vui lòng xem giải pháp.");
    },
    onClosed: () => {
      toast.success("Ticket đã được đóng.");
    },
    onFallbackRequired: () => {
      setAbandonTriggeredByFallback(true);
      setAbandonModalOpen(true);
    },
  });

  // Auto-scroll chat khi có message mới.
  const messages = msgQuery.data?.data?.data ?? [];
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // P2-2 — Auto-open Abandon modal khi BE đánh cờ pendingFallbackChoice (worker
  // đã reset ticket về OPEN, đang chờ creator chọn FALLBACK_AI/REFUND_TICKET).
  // Pattern derive-state-during-render (React docs §"You Might Not Need an
  // Effect" → "Adjusting state when a prop changes"): compare prev pending
  // flag với current; nếu chuyển từ false→true thì tự mở modal. Tránh
  // useEffect + setState để pass `react-hooks/set-state-in-effect`.
  const isCreatorEarly = ticket ? viewerUserId === ticket.createdBy : false;
  // `pendingFallbackChoice` nằm ở TOP-LEVEL của FullRes (xem schema) — đọc
  // từ `fullData`, không phải từ `ticket`.
  const pendingFallback = fullData?.pendingFallbackChoice === true;
  const [prevPendingFallback, setPrevPendingFallback] = useState(false);
  if (pendingFallback !== prevPendingFallback) {
    setPrevPendingFallback(pendingFallback);
    if (
      pendingFallback &&
      isCreatorEarly &&
      !abandonModalOpen &&
      !autoOpenedFallback
    ) {
      setAbandonTriggeredByFallback(true);
      setAbandonModalOpen(true);
      setAutoOpenedFallback(true);
    }
  }

  // Loading / error guard.
  if (fullQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <LoadingCard />
      </div>
    );
  }

  if (fullQuery.isError || !fullQuery.data?.data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>
            {getApiErrorMessageVi(fullQuery.error)}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const full = fullQuery.data.data;
  const t = full.ticket;
  const isCreator = viewerUserId === t.createdBy;
  const isOpen = t.status === "OPEN";
  const isResolved = t.status === "RESOLVED";
  const isClosed = t.status === "CLOSED" || t.status === "CANCELLED";
  const isActiveChat =
    t.status === "OPEN" ||
    t.status === "ASSIGNED" ||
    t.status === "IN_PROGRESS";

  const handleSendMessage = () => {
    if (!msgText.trim()) return;
    sendMessageMutation.mutate(
      { message: msgText.trim() },
      { onSuccess: () => setMsgText("") },
    );
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
        <div className="min-w-0 flex-1">
          <Badge className="mb-1">Chi tiết ticket</Badge>
          <h1 className="text-2xl font-bold truncate">{t.title}</h1>
        </div>
        <Badge
          variant="outline"
          className={STATUS_BADGE_CLASS[t.status]}
        >
          {STATUS_LABEL[t.status]}
        </Badge>
      </div>

      <Separator />

      {/* Banners */}
      {t.isAIResolved && (
        <Alert
          variant="default"
          className="bg-amber-500/10 border-amber-200"
        >
          <Bot className="h-4 w-4 text-amber-700" />
          <AlertDescription className="text-amber-900">
            Ticket này được xử lý bởi AI. Đánh giá không khả dụng.
          </AlertDescription>
        </Alert>
      )}

      {isResolved && !isCreator && (
        <Alert
          variant="default"
          className="bg-cyan-500/10 border-cyan-200"
        >
          <Info className="h-4 w-4 text-cyan-700" />
          <AlertDescription className="text-cyan-900">
            Bạn không phải là người tạo ticket này. Chỉ người tạo mới có thể
            đóng và đánh giá.
          </AlertDescription>
        </Alert>
      )}

      {isClosed && t.closeReason && (
        <Alert
          variant="default"
          className={CLOSE_REASON_BADGE_CLASS[t.closeReason]}
        >
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{CLOSE_REASON_LABEL[t.closeReason]}</strong>
            {t.closedAt && (
              <>
                {" — "}
                {format(new Date(t.closedAt), "HH:mm dd/MM/yyyy", {
                  locale: vi,
                })}
              </>
            )}
            {t.closedBy === "SYSTEM_AUTO_CLOSE" && (
              <span className="block mt-0.5 text-xs">
                Hệ thống tự đóng vì người tạo không xác nhận trong thời gian
                cho phép.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Action header — creator + status OPEN: cho huỷ + refund quota */}
      {isOpen && isCreator && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Đang chờ bác sĩ tiếp nhận
            </CardTitle>
            <CardDescription>
              Có thể huỷ ticket khi chưa có bác sĩ tiếp nhận. Quota sẽ được
              hoàn trả về tài khoản chủ vườn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => setCancelModalOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Huỷ ticket
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Action header — chỉ creator + state RESOLVED */}
      {isResolved && isCreator && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
              Bác sĩ đã giải quyết — chờ bạn xác nhận
            </CardTitle>
            <CardDescription>
              Vui lòng xem lại giải pháp và đơn thuốc bên dưới. Sau đó đóng
              ticket để hệ thống thanh toán hoa hồng cho bác sĩ.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <AutoCloseCountdown resolvedAt={t.resolvedAt} />
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                onClick={() => setCloseModalOpen(true)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Đóng &amp; Đánh giá
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setAbandonTriggeredByFallback(false);
                  setAbandonModalOpen(true);
                }}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Xử lý khi không có bác sĩ
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Layout 3 cột */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Cột trái 1/3 */}
        <div className="space-y-4">
          {/* Card thông tin sự cố */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Ticket className="h-4 w-4" />
                Thông tin sự cố
              </CardTitle>
              <CardDescription>
                Chi tiết ticket được tạo và tiến trình xử lý.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã ticket</span>
                <span className="font-mono text-xs">{t.ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mức độ</span>
                <span>{SEVERITY_LABEL[t.severity] ?? t.severity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tạo lúc</span>
                <span className="text-xs">
                  {format(new Date(t.createdAt), "HH:mm dd/MM/yy", {
                    locale: vi,
                  })}
                </span>
              </div>
              {t.resolvedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Giải quyết lúc</span>
                  <span className="text-xs">
                    {format(new Date(t.resolvedAt), "HH:mm dd/MM/yy", {
                      locale: vi,
                    })}
                  </span>
                </div>
              )}
              {t.closedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đóng lúc</span>
                  <span className="text-xs">
                    {format(new Date(t.closedAt), "HH:mm dd/MM/yy", {
                      locale: vi,
                    })}
                  </span>
                </div>
              )}
              <Separator />
              <p className="text-muted-foreground text-xs">Mô tả</p>
              <p className="leading-relaxed">{t.description}</p>
            </CardContent>
          </Card>

          {/* Card đơn thuốc */}
          <PrescriptionItemsCard prescription={full.prescription} />

          {/* Card ghi chú bổ sung — chỉ render khi có */}
          {full.addenda.length > 0 && (
            <AddendumList addenda={full.addenda} />
          )}

          {/* Card lịch sử broadcast */}
          {full.broadcasts.length > 0 && (
            <BroadcastTimeline broadcasts={full.broadcasts} />
          )}
        </div>

        {/* Cột phải 2/3 */}
        <div className="space-y-4 lg:col-span-2">
          {/* Card hội thoại */}
          <Card className="flex flex-col h-150">
            <CardHeader className="shrink-0">
              <CardTitle className="text-base flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Hội thoại
              </CardTitle>
              <CardDescription>
                Khu vực trao đổi giữa các bên trong suốt quá trình xử lý
                ticket.
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
                  const isMe = msg.senderId === viewerUserId;
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
            {isActiveChat && (
              <div className="shrink-0 border-t p-3 flex gap-2">
                <Input
                  placeholder="Nhập tin nhắn..."
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={
                    sendMessageMutation.isPending || !msgText.trim()
                  }
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            )}
          </Card>

          {/* Card giải pháp — render khi state ≥ RESOLVED */}
          {(isResolved || isClosed) && (
            <SolutionViewCard solution={full.solution} />
          )}

          {/* Card đánh giá */}
          {(isClosed || full.rating) && (
            <RatingDisplay rating={full.rating} />
          )}

          {/* Card thanh toán — chỉ khi closed && có payoutAt */}
          {isClosed && t.unitPriceSnapshot != null && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Wallet className="h-4 w-4" />
                  Thanh toán
                </CardTitle>
                <CardDescription>
                  Thông tin thanh toán hoa hồng cho bác sĩ tại thời điểm đóng
                  ticket.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Đơn giá ticket</span>
                  <span className="font-medium tabular-nums">
                    {new Intl.NumberFormat("vi-VN", {
                      style: "currency",
                      currency: "VND",
                      maximumFractionDigits: 0,
                    }).format(t.unitPriceSnapshot)}
                  </span>
                </div>
                {t.isAIResolved ? (
                  <p className="text-xs text-muted-foreground">
                    Ticket xử lý bởi AI — không thanh toán cho bác sĩ.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Hệ thống đã tính hoa hồng theo cấu hình hiện tại.
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals — render-conditional bug fix:
        - CloseAndRate chỉ valid khi status=RESOLVED
        - AbandonResolution có thể trigger ở mọi state non-terminal (OPEN sau
          worker-reset, ASSIGNED/IN_PROGRESS, RESOLVED). Phải LUÔN mount khi
          isCreator để callback `onFallbackRequired` từ WS thực sự mở modal,
          và effect auto-open từ `pendingFallbackChoice` hoạt động.
        - CancelTicketModal chỉ valid khi status=OPEN. */}
      {isResolved && isCreator && (
        <CloseAndRateModal
          open={closeModalOpen}
          onOpenChange={setCloseModalOpen}
          ticketId={ticketId}
          ticketFull={full}
        />
      )}
      {isCreator && !isClosed && (
        <AbandonResolutionModal
          open={abandonModalOpen}
          onOpenChange={(o) => {
            setAbandonModalOpen(o);
            if (!o) setAbandonTriggeredByFallback(false);
          }}
          ticketId={ticketId}
          triggeredByFallback={abandonTriggeredByFallback}
        />
      )}
      {isOpen && isCreator && (
        <CancelTicketModal
          open={cancelModalOpen}
          onOpenChange={setCancelModalOpen}
          ticketId={ticketId}
          onCancelled={() => onBack()}
        />
      )}
    </div>
  );
}
