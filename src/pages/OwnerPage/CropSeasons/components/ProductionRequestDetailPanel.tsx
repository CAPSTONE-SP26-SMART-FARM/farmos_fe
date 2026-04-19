import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useOwnerRequestDetail,
  useReplyProductionRequest,
} from "@/queries/useCropSeason";
import { ReplyProductionRequestBodySchema } from "@/types/cropSeason";
import type { ReplyProductionRequestBodyType } from "@/types/cropSeason";
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  ClipboardList,
  Loader2,
  Sprout,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  isApiErrorUnprocessableEntityResponse,
  isApiErrorResponse,
} from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  requestId: string;
  onBack: () => void;
}

const SEASON_STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  planning: { label: "Lên kế hoạch", variant: "secondary" },
  sent: { label: "Đã gửi", variant: "default" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Bị từ chối", variant: "destructive" },
  active: { label: "Đang hoạt động", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

const REQUEST_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  pending: { label: "Chờ duyệt", variant: "secondary" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
};

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm");
  } catch {
    return d;
  }
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

const DetailSkeleton = () => (
  <div className="space-y-4">
    {[1, 2].map((i) => (
      <Card key={i}>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-2/3" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function ProductionRequestDetailPanel({
  requestId,
  onBack,
}: Props) {
  const [show, setShow] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const detailQuery = useOwnerRequestDetail(requestId);
  const replyMutation = useReplyProductionRequest(requestId);

  const req = detailQuery.data?.data;
  const season = req?.cropSeason;

  const rejectForm = useForm<ReplyProductionRequestBodyType>({
    resolver: zodResolver(ReplyProductionRequestBodySchema),
    defaultValues: { status: "rejected", description: "" },
  });
  useClearServerFieldErrors(rejectForm);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const handleApprove = () => {
    setShowRejectForm(false);
    setConfirmAction("approve");
  };

  const handleRejectClick = () => {
    rejectForm.reset({ status: "rejected", description: "" });
    setShowRejectForm(true);
    setConfirmAction(null);
  };

  const handleRejectSubmit = rejectForm.handleSubmit(() => {
    setConfirmAction("reject");
  });

  const handleConfirm = async () => {
    try {
      if (confirmAction === "approve") {
        await replyMutation.mutateAsync({ status: "approved" });
      } else if (confirmAction === "reject") {
        const values = rejectForm.getValues();
        await replyMutation.mutateAsync({
          status: "rejected",
          description: values.description,
        });
      }
      setConfirmAction(null);
      setShowRejectForm(false);
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<ReplyProductionRequestBodyType>(
          error,
        )
      ) {
        handleApiErrorUnprocessentity<ReplyProductionRequestBodyType>(
          error.response!.data.errors,
          rejectForm.setError,
          { getValues: rejectForm.getValues },
        );
        setConfirmAction(null);
        return;
      }

      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Xử lý yêu cầu thất bại");
        return;
      }

      toast.error("Xử lý yêu cầu thất bại");
    }
  };

  const reqStatus = req
    ? (REQUEST_STATUS_MAP[req.status] ?? {
        label: req.status,
        variant: "secondary" as const,
      })
    : null;

  const seasonStatus = season
    ? (SEASON_STATUS_MAP[season.status] ?? {
        label: season.status,
        variant: "secondary" as const,
      })
    : null;

  const isPending = req?.status === "pending";

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* ── Confirm Dialog ─────────────────────────────────── */}
      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction === "approve"
            ? "Xác nhận phê duyệt?"
            : "Xác nhận từ chối?"
        }
        description={
          confirmAction === "approve"
            ? "Kế hoạch sản xuất sẽ được duyệt. Hành động này không thể hoàn tác."
            : "Yêu cầu sẽ bị từ chối. Hành động này không thể hoàn tác."
        }
        confirmLabel={
          replyMutation.isPending
            ? "Đang xử lý…"
            : confirmAction === "approve"
              ? "Duyệt"
              : "Từ chối"
        }
        cancelLabel="Huỷ"
        variant={confirmAction === "reject" ? "destructive" : "default"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmAction(null)}
      />

      {/* ── Header ─────────────────────────────────────────── */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Chi tiết mùa vụ
        </Button>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2">Yêu cầu phê duyệt</Badge>
            <h1 className="text-2xl font-bold">
              {req ? (
                <>
                  Chi tiết yêu cầu
                  <span className="font-mono text-base text-muted-foreground ml-2">
                    #{req.id.slice(0, 8)}
                  </span>
                </>
              ) : (
                <Skeleton className="h-7 w-40 inline-block" />
              )}
            </h1>
          </div>
          {reqStatus && (
            <Badge
              variant={reqStatus.variant}
              className="text-sm h-fit"
            >
              {reqStatus.label}
            </Badge>
          )}
        </div>
      </div>

      {detailQuery.isLoading ? (
        <DetailSkeleton />
      ) : !req ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <ClipboardList className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Không tìm thấy yêu cầu.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleBack}
            >
              Quay lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Request Info ─────────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardList className="h-4 w-4" />
                Thông tin yêu cầu
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <InfoRow
                  label="Ngày gửi"
                  value={
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {formatDate(req.sentAt)}
                    </span>
                  }
                />
                <InfoRow
                  label="Ngày phản hồi"
                  value={
                    req.repliedAt ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(req.repliedAt)}
                      </span>
                    ) : (
                      "Chưa phản hồi"
                    )
                  }
                />
                <InfoRow
                  label="Trạng thái"
                  value={
                    <Badge variant={reqStatus?.variant ?? "secondary"}>
                      {reqStatus?.label ?? req.status}
                    </Badge>
                  }
                />
              </div>

              {req.description && (
                <>
                  <Separator />
                  <InfoRow
                    label="Mô tả / Lý do"
                    value={
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">
                        {req.description}
                      </p>
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Related Crop Season ───────────────────────────── */}
          {season && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sprout className="h-4 w-4" />
                  Mùa vụ liên quan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <InfoRow
                    label="Tên cây trồng"
                    value={season.cropName}
                  />
                  <InfoRow
                    label="Giống"
                    value={season.variety}
                  />
                  <InfoRow
                    label="Trạng thái mùa vụ"
                    value={
                      seasonStatus && (
                        <Badge variant={seasonStatus.variant}>
                          {seasonStatus.label}
                        </Badge>
                      )
                    }
                  />
                  <InfoRow
                    label="Ngày trồng"
                    value={formatDate(season.plantDate)}
                  />
                  <InfoRow
                    label="Thu hoạch dự kiến"
                    value={formatDate(season.expectedHarvestDate)}
                  />
                  {season.totalAreaSqm != null && (
                    <InfoRow
                      label="Diện tích"
                      value={`${season.totalAreaSqm} m²`}
                    />
                  )}
                </div>
                {season.notes && (
                  <>
                    <Separator />
                    <InfoRow
                      label="Ghi chú mùa vụ"
                      value={
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">
                          {season.notes}
                        </p>
                      }
                    />
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Action Panel — #59 ────────────────────────────── */}
          {isPending && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Phản hồi yêu cầu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Reject reason form */}
                {showRejectForm && (
                  <form
                    onSubmit={handleRejectSubmit}
                    className="space-y-3"
                  >
                    <div className="flex flex-col gap-1.5">
                      <Label className="text-sm font-medium">
                        Lý do từ chối{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <Textarea
                        {...rejectForm.register("description")}
                        placeholder="Nhập lý do từ chối kế hoạch sản xuất…"
                        rows={3}
                        className="resize-none"
                        autoComplete="off"
                      />
                      {rejectForm.formState.errors.description && (
                        <p className="text-xs text-destructive">
                          {rejectForm.formState.errors.description.message}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        variant="destructive"
                        size="sm"
                        disabled={replyMutation.isPending}
                      >
                        {replyMutation.isPending && (
                          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                        )}
                        <XCircle className="h-3.5 w-3.5 mr-1.5" />
                        Xác nhận từ chối
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRejectForm(false)}
                      >
                        Huỷ
                      </Button>
                    </div>
                  </form>
                )}

                {!showRejectForm && (
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={handleApprove}
                      disabled={replyMutation.isPending}
                      className="gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Duyệt kế hoạch
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleRejectClick}
                      disabled={replyMutation.isPending}
                      className="gap-2"
                    >
                      <XCircle className="h-4 w-4" />
                      Từ chối
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Already-replied note ──────────────────────────── */}
          {!isPending && (
            <div className="rounded-md border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-center gap-2">
              {req.status === "approved" ? (
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-destructive shrink-0" />
              )}
              Yêu cầu này đã được phản hồi vào{" "}
              <span className="font-medium text-foreground">
                {formatDate(req.repliedAt)}
              </span>
              .
            </div>
          )}
        </>
      )}
    </div>
  );
}
