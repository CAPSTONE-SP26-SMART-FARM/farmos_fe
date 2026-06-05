import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { QUERY_KEYS } from "@/constants/endpoints";
import {
  useOwnerRequestDetail,
  useReplyProductionRequest,
} from "@/queries/useCropSeason";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
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
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  isApiErrorUnprocessableEntityResponse,
  isApiErrorResponse,
} from "@/lib/utils";
import { toast } from "sonner";
import {
  SEASON_STATUS_MAP,
  REQUEST_STATUS_MAP,
  formatDate,
  InfoRow,
  DetailSkeleton,
} from "./productionRequestHelpers";
import CropSeasonMilestonesCoverageHint from "@/components/common/CropSeasonMilestonesCoverageHint";

interface Props {
  requestId: string;
  onBack: () => void;
  /**
   * When true, render in a compact inline mode:
   * - skips the page-level fade animation,
   * - uses a smaller back link ("Đóng") instead of "Chi tiết mùa vụ",
   * - omits the page-style outer Badge so the panel fits inside another card.
   * Used by OwnerRequestsHistoryTab to embed this panel as a right-side detail.
   */
  compact?: boolean;
}

export default function ProductionRequestDetailPanel({
  requestId,
  onBack,
  compact = false,
}: Props) {
  const [show, setShow] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    "approve" | "reject" | null
  >(null);
  const [showRejectForm, setShowRejectForm] = useState(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const farmQuery = useOwnerGetMyFarm();
  const detailQuery = useOwnerRequestDetail(requestId);
  const replyMutation = useReplyProductionRequest(requestId);
  const farmId = farmQuery.data?.data.id;

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
    if (compact) {
      onBack();
      return;
    }
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

      if (confirmAction === "approve" && farmId) {
        await queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.zones.byFarm(farmId),
        });
        await queryClient.refetchQueries({
          queryKey: QUERY_KEYS.zones.byFarm(farmId),
        });
      }

      if (confirmAction === "approve") {
        toast.success("Đã duyệt kế hoạch sản xuất", {
          description:
            "Hệ thống sẽ chuẩn bị lắp đặt thiết bị cho mùa vụ này.",
          duration: 8000,
          action: {
            label: "Xem yêu cầu thiết bị",
            onClick: () => navigate("/dashboard/owner/iot-kit-requests"),
          },
        });
      } else if (confirmAction === "reject") {
        toast.success("Đã từ chối kế hoạch sản xuất");
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
      className={
        compact
          ? "space-y-6"
          : `space-y-6 transition-all duration-300 ease-out ${
              show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`
      }
    >
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

      <div>
        {!compact && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Chi tiết mùa vụ
          </Button>
        )}
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            {!compact && <Badge className="mb-2">Yêu cầu phê duyệt</Badge>}
            <h1
              className={
                compact ? "text-lg font-semibold" : "text-2xl font-bold"
              }
            >
              {req ? (
                compact ? (
                  "Chi tiết yêu cầu"
                ) : (
                  <>
                    Chi tiết yêu cầu
                    <span className="font-mono text-base text-muted-foreground ml-2">
                      #{req.id.slice(0, 8)}
                    </span>
                  </>
                )
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

          {!compact && season && (
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

          {isPending && (
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-base">Phản hồi yêu cầu</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {season?.id && (
                  <CropSeasonMilestonesCoverageHint cropSeasonId={season.id} />
                )}
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
