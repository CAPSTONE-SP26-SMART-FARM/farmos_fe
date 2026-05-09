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
import { useTicketFull } from "@/queries/useTicket";
import type { TicketBasicResType } from "@/schemaValidatation/ticket";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  ArrowLeft,
  Bot,
  CheckCircle,
  ShieldAlert,
  Ticket,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddendumList from "./AddendumList";
import BroadcastTimeline from "./BroadcastTimeline";
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
};

// ── Main component ───────────────────────────────────────────────────────

export default function TicketDetailPanelV2({
  ticketId,
  onBack,
  viewerRole,
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

  // Data — view-only: chỉ cần ticket full, không cần messages/mutations.
  const fullQuery = useTicketFull(ticketId);

  // Realtime list-scope invalidate (để list refresh khi state đổi).
  const role: RoleNameType =
    viewerRole === "owner" ? RoleName.Owner : RoleName.Manager;
  const fullData = fullQuery.data?.data;
  const ticket = fullData?.ticket;
  useRealtimeTicket(role, {
    farmId: ticket?.farmId ?? undefined,
    zoneId: ticket?.zoneId ?? undefined,
  });
  // Realtime detail-scope: chỉ dùng để invalidate full payload + toast info,
  // không trigger modal vì panel này view-only.
  useRealtimeTicketDetail(ticketId, {
    onResolved: () => {
      toast.info("Bác sĩ đã cập nhật giải pháp cho ticket.");
    },
    onClosed: () => {
      toast.success("Ticket đã được đóng.");
    },
  });

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
  const isResolved = t.status === "RESOLVED";
  const isClosed = t.status === "CLOSED" || t.status === "CANCELLED";

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

      {/* Layout 2 cột — view-only, không còn cột hội thoại. */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Cột trái */}
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

        {/* Cột phải */}
        <div className="space-y-4">
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
    </div>
  );
}
