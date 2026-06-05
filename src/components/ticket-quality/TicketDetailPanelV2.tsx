import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
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
import { useTicketV2Detail } from "@/queries/useTicketV2";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, Bot, CheckCircle, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AddendumList from "./AddendumList";
import BroadcastTimeline from "./BroadcastTimeline";
import PrescriptionItemsCard from "./PrescriptionItemsCard";
import RatingDisplay from "./RatingDisplay";
import SolutionViewCard from "./SolutionViewCard";
import { TicketAttachmentsCard } from "./_panel/TicketAttachmentsCard";
import { TicketDescriptionCard } from "./_panel/TicketDescriptionCard";
import { TicketDetailHeader } from "./_panel/TicketDetailHeader";
import { TicketParticipantsCard } from "./_panel/TicketParticipantsCard";
import { TicketPaymentCard } from "./_panel/TicketPaymentCard";

interface TicketDetailPanelV2Props {
  ticketId: string;
  onBack: () => void;
  /**
   * Role của viewer — chỉ dùng để scope realtime list-invalidate (Owner theo
   * farmId, Manager theo zoneId). BE đã tự ACL ở `GET /tickets/:id` nên không
   * cần phân nhánh API theo role.
   */
  viewerRole: "owner" | "manager";
}

export default function TicketDetailPanelV2({
  ticketId,
  onBack,
  viewerRole,
}: TicketDetailPanelV2Props) {
  // Slide-in animation pattern.
  const [show, setShow] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);
  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  // ── Data — 2 query song song ───────────────────────────────────────────
  // metaQuery: ticket v2 detail (creator/farm/zone/assignee/attachments + snapshot).
  // fullQuery: lifecycle (solution/prescription/addenda/rating/broadcasts).
  const metaQuery = useTicketV2Detail(ticketId);
  const fullQuery = useTicketFull(ticketId);

  // Realtime list-scope invalidate (để list refresh khi state đổi).
  const role: RoleNameType =
    viewerRole === "owner" ? RoleName.Owner : RoleName.Manager;
  const meta = metaQuery.data?.data;
  useRealtimeTicket(role, {
    farmId: meta?.farmId ?? undefined,
    zoneId: meta?.zoneId ?? undefined,
  });
  // Realtime detail-scope: invalidate detail + full payload + toast info.
  useRealtimeTicketDetail(ticketId, {
    onResolved: () => {
      toast.info("Bác sĩ đã cập nhật giải pháp cho ticket.");
    },
    onClosed: () => {
      toast.success("Ticket đã được đóng.");
    },
  });

  // ── Loading / error guard ──────────────────────────────────────────────
  const isLoading = metaQuery.isLoading || fullQuery.isLoading;
  const isError = metaQuery.isError || fullQuery.isError;
  const errorObj = metaQuery.error ?? fullQuery.error;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <LoadingCard />
      </div>
    );
  }

  if (isError || !meta || !fullQuery.data?.data) {
    return (
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          aria-label="Quay lại danh sách"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertDescription>{getApiErrorMessageVi(errorObj)}</AlertDescription>
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
      <TicketDetailHeader
        ticketNumber={meta.ticketNumber}
        title={meta.title}
        status={meta.status}
        severity={meta.severity}
        onBack={handleBack}
      />

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

      {/* Layout 2 cột — view-only */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Cột trái — content chính */}
        <div className="space-y-4 lg:col-span-7">
          <TicketDescriptionCard ticket={meta} />

          <TicketAttachmentsCard attachments={meta.attachments} />

          <Separator className="lg:hidden" />

          {(isResolved || isClosed) && (
            <SolutionViewCard solution={full.solution} />
          )}

          <PrescriptionItemsCard prescription={full.prescription} />

          {full.addenda.length > 0 && (
            <AddendumList addenda={full.addenda} />
          )}
        </div>

        {/* Cột phải — meta + state */}
        <div className="space-y-4 lg:col-span-5">
          <TicketParticipantsCard
            creator={meta.creator}
            assignee={meta.assignee}
          />

          {(isClosed || full.rating) && (
            <RatingDisplay rating={full.rating} />
          )}

          {isClosed && (
            <TicketPaymentCard
              unitPrice={t.unitPriceSnapshot}
              payoutAt={t.payoutAt}
              isAIResolved={t.isAIResolved}
            />
          )}

          {full.broadcasts.length > 0 && (
            <BroadcastTimeline broadcasts={full.broadcasts} />
          )}
        </div>
      </div>
    </div>
  );
}
