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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EmptyState from "@/components/common/EmptyState";
import LoadingCard from "@/components/common/LoadingCard";
import {
  ABANDON_RESOLUTION_LABEL,
  CLOSE_REASON_BADGE_CLASS,
  CLOSE_REASON_LABEL,
  TIER_BADGE_CLASS,
  TIER_LABEL,
} from "@/constants/ticketQualityLabels";
import { useRealtimeTicketDetail } from "@/hooks/useRealtimeTicketDetail";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { formatCurrencyVnd, formatDateTimeVi } from "@/lib/format";
import { useAdminTicketFull } from "@/queries/useTicket";
import { TierSchema } from "@/schemaValidatation/dqs";
import { type TicketStatusUpperType } from "@/schemaValidatation/ticket";
import { ArrowLeft, ShieldOff, Ticket, UserRound } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import AddendumList from "@/components/ticket-quality/AddendumList";
import BroadcastTimeline from "@/components/ticket-quality/BroadcastTimeline";
import PrescriptionItemsCard from "@/components/ticket-quality/PrescriptionItemsCard";
import RatingDisplay from "@/components/ticket-quality/RatingDisplay";
import SolutionViewCard from "@/components/ticket-quality/SolutionViewCard";
import InvalidateRatingModal from "@/components/ticket-quality/admin/InvalidateRatingModal";

const STATUS_LABEL: Record<TicketStatusUpperType, string> = {
  OPEN: "Mo",
  ASSIGNED: "Da phan cong",
  IN_PROGRESS: "Dang xu ly",
  RESOLVED: "Da giai quyet",
  CLOSED: "Da dong",
  CANCELLED: "Da huy",
};

const STATUS_BADGE_CLASS: Record<TicketStatusUpperType, string> = {
  OPEN: "bg-muted text-foreground",
  ASSIGNED: "bg-cyan-500/10 text-cyan-700 border-cyan-200",
  IN_PROGRESS: "bg-amber-500/10 text-amber-700 border-amber-200",
  RESOLVED: "bg-emerald-500/10 text-emerald-700 border-emerald-200",
  CLOSED: "bg-muted text-muted-foreground",
  CANCELLED: "bg-red-500/10 text-red-700 border-red-200",
};

const SEVERITY_LABEL: Record<string, string> = {
  low: "Thap",
  medium: "Trung binh",
  high: "Cao",
  critical: "Nghiem trong",
};

const PRIORITY_LABEL: Record<string, string> = {
  low: "Thap",
  normal: "Binh thuong",
  high: "Cao",
  urgent: "Khan cap",
};

function shortId(id: string | null | undefined) {
  if (!id) return "—";
  return `${id.slice(0, 8)}…`;
}


export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const ticketId = id ?? "";
  const navigate = useNavigate();

  const fullQuery = useAdminTicketFull(ticketId);
  const [invalidateOpen, setInvalidateOpen] = useState(false);
  const full = fullQuery.data?.data;
  const t = full?.ticket;

  const payout = useMemo(() => {
    if (!t) return null;
    const percent = t.payoutPercentSnapshot ?? null;
    const price = t.unitPriceSnapshot ?? null;
    if (!percent || !price) return null;
    const amount = (price * percent) / 100;
    return { percent, amount };
  }, [t]);

  const payoutTier = useMemo(() => {
    if (!t?.payoutTierSnapshot) return null;
    const parsed = TierSchema.safeParse(t.payoutTierSnapshot);
    return parsed.success ? parsed.data : null;
  }, [t?.payoutTierSnapshot]);

  useRealtimeTicketDetail(ticketId, {
    onClosed: () => toast.success("Ticket da duoc dong."),
  });

  if (fullQuery.isLoading) {
    return (
      <div className="p-6 space-y-6 animate-in fade-in duration-300">
        <Skeleton className="h-8 w-1/3" />
        <LoadingCard />
      </div>
    );
  }

  if (fullQuery.isError || !fullQuery.data?.data) {
    return (
      <div className="p-6 space-y-4 animate-in fade-in duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Alert variant="destructive">
          <AlertDescription>
            {getApiErrorMessageVi(fullQuery.error)}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!full || !t) {
    return null;
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <Badge className="mb-1">Chi tiết ticket</Badge>
          <h1 className="text-2xl font-bold truncate">{t.ticketNumber}</h1>
        </div>
        <Badge
          variant="outline"
          className={STATUS_BADGE_CLASS[t.status]}
        >
          {STATUS_LABEL[t.status]}
        </Badge>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-4 w-4" />
            Thông tin chung
          </CardTitle>
          <CardDescription>
            Tổng quan về trạng thái, mức độ, người tạo và bác sĩ phụ trách.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Mức độ</p>
              <p className="font-medium">
                {SEVERITY_LABEL[t.severity] ?? t.severity}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ưu tiên</p>
              <p className="font-medium">
                {PRIORITY_LABEL[t.priority] ?? t.priority}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trạng thái</p>
              <p className="font-medium">{STATUS_LABEL[t.status]}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Nguoi tao</p>
              <p className="font-medium">{shortId(t.createdBy)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Bac si phu trach</p>
              {t.assignedTo ? (
                <Button
                  variant="link"
                  className="px-0 h-auto"
                  onClick={() =>
                    navigate(`/dashboard/admin/doctors/${t.assignedTo}/dqs`)
                  }
                >
                  {shortId(t.assignedTo)}
                </Button>
              ) : (
                <p className="font-medium text-muted-foreground">Chua gan</p>
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Zone</p>
              <p className="font-medium">{shortId(t.zoneId)}</p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs text-muted-foreground">Tao luc</p>
              <p className="font-medium">{formatDateTimeVi(t.createdAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Giải quyết lúc</p>
              <p className="font-medium">{formatDateTimeVi(t.resolvedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Dong luc</p>
              <p className="font-medium">{formatDateTimeVi(t.closedAt)}</p>
            </div>
          </div>

          {t.closeReason && (
            <div className="flex items-center gap-2 text-sm">
              <Badge className={CLOSE_REASON_BADGE_CLASS[t.closeReason]}>
                {CLOSE_REASON_LABEL[t.closeReason]}
              </Badge>
              <span className="text-muted-foreground">
                {t.closedBy ? `Người đóng: ${shortId(t.closedBy)}` : ""}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="solution">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="solution">Giải pháp & đơn thuốc</TabsTrigger>
          <TabsTrigger value="addenda">Ghi chu bo sung</TabsTrigger>
          <TabsTrigger value="rating">Đánh giá</TabsTrigger>
          <TabsTrigger value="broadcasts">Lich su broadcast</TabsTrigger>
          <TabsTrigger value="abandon">Nhật ký abandon</TabsTrigger>
          <TabsTrigger value="payout">Thanh toán</TabsTrigger>
        </TabsList>

        <TabsContent
          value="solution"
          className="space-y-4"
        >
          <SolutionViewCard solution={full.solution} />
          <PrescriptionItemsCard prescription={full.prescription} />
        </TabsContent>

        <TabsContent value="addenda">
          <AddendumList addenda={full.addenda} />
        </TabsContent>

        <TabsContent
          value="rating"
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldOff className="h-4 w-4" />
              Đánh giá
            </CardTitle>
            <Button
              variant="outline"
              onClick={() => setInvalidateOpen(true)}
              disabled={!full.rating || Boolean(full.rating.invalidatedAt)}
            >
              Vô hiệu hoá đánh giá
            </Button>
          </div>
          <RatingDisplay rating={full.rating} />
        </TabsContent>

        <TabsContent value="broadcasts">
          <BroadcastTimeline broadcasts={full.broadcasts} />
        </TabsContent>

        <TabsContent value="abandon">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Nhật ký abandon</CardTitle>
              <CardDescription>
                Lich su phat hien bac si im lang va quyet dinh xu ly tiep theo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {full.abandonLogs.length === 0 ? (
                <EmptyState
                  icon={UserRound}
                  title="Chưa có nhật ký"
                  description="Chua co ban ghi abandon nao cho ticket nay."
                />
              ) : (
                <div className="space-y-3">
                  {full.abandonLogs.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-md border p-3 text-sm space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">
                          {ABANDON_RESOLUTION_LABEL[log.resolution]}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDateTimeVi(log.createdAt)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Bac si: {shortId(log.doctorId)}
                      </div>
                      {log.ownerChoice && (
                        <div className="text-xs text-muted-foreground">
                          Lua chon: {log.ownerChoice}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payout">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Thanh toán</CardTitle>
              <CardDescription>
                Thông tin thanh toán hoa hồng cho bác sĩ tại thời điểm đóng
                ticket.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {t.isAIResolved ? (
                <div className="text-sm text-muted-foreground">
                  Ticket xử lý bởi AI — không có thanh toán.
                </div>
              ) : t.payoutAt ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Thanh toán lúc
                    </span>
                    <span className="font-medium">
                      {formatDateTimeVi(t.payoutAt)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Gia tri ticket
                    </span>
                    <span className="font-medium">
                      {t.unitPriceSnapshot
                        ? formatCurrencyVnd(t.unitPriceSnapshot)
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Hoa hồng (%)</span>
                    <span className="font-medium">
                      {payout?.percent ? `${payout.percent}%` : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Số tiền hoa hồng
                    </span>
                    <span className="font-medium">
                      {payout?.amount ? formatCurrencyVnd(payout.amount) : "—"}
                    </span>
                  </div>
                  {payoutTier && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Hang bac si</span>
                      <Badge className={TIER_BADGE_CLASS[payoutTier]}>
                        {TIER_LABEL[payoutTier]}
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Chưa có thông tin thanh toán cho ticket này.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <InvalidateRatingModal
        open={invalidateOpen}
        onOpenChange={setInvalidateOpen}
        ticketId={ticketId}
        rating={full.rating}
      />
    </div>
  );
}
