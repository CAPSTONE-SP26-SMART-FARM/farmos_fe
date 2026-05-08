import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTimeVi } from "@/lib/format";
import { getSubscriptionStatusBadgeVariant } from "@/lib/utils";
import { useSubscriptionDetail } from "@/queries/useSubscription";
import type { SubscriptionStatusType } from "@/schemaValidatation/subscription";
import { CalendarClock, CheckCircle2, Info, XCircle } from "lucide-react";

const STATUS_LABEL: Record<SubscriptionStatusType, string> = {
  PENDING: "Chờ kích hoạt",
  ACTIVE: "Đang hoạt động",
  SUSPENDED: "Tạm ngưng",
  CANCELLED: "Đã hủy",
  EXPIRED: "Hết hạn",
};

function renderFeatureValue(value: string, valueType?: string, unit?: string | null) {
  if (valueType === "BOOL") {
    return value === "true" ? (
      <span className="flex items-center gap-1 text-green-600">
        <CheckCircle2 className="h-3.5 w-3.5" /> Có
      </span>
    ) : (
      <span className="flex items-center gap-1 text-muted-foreground">
        <XCircle className="h-3.5 w-3.5" /> Không
      </span>
    );
  }
  return (
    <span className="font-medium tabular-nums">
      {value}
      {unit ? <span className="ml-1 text-muted-foreground">{unit}</span> : null}
    </span>
  );
}

interface SubscriptionDetailDialogProps {
  subscriptionId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function SubscriptionDetailDialog({
  subscriptionId,
  open,
  onOpenChange,
}: SubscriptionDetailDialogProps) {
  const detailQuery = useSubscriptionDetail(subscriptionId ?? "", !!subscriptionId && open);
  const isLoading = detailQuery.isLoading;
  const detail = detailQuery.data?.data;
  const subscription = detail?.subscription;
  const version = detail?.currentPlanVersion;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        {isLoading ? (
          <div className="space-y-4 py-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : !detail ? (
          <>
            <DialogHeader>
              <DialogTitle>Chi tiết đăng ký</DialogTitle>
              <DialogDescription>Không tải được thông tin đăng ký.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader className="pr-6">
              <DialogTitle>{subscription?.plan?.name ?? "Gói đăng ký"}</DialogTitle>
              <DialogDescription>
                Mã gói: <span className="font-mono">{subscription?.plan?.code ?? "-"}</span>
                {" · "}
                Phiên bản {version?.versionNo ?? "-"}
              </DialogDescription>
              {subscription && (
                <div className="pt-1">
                  <Badge variant={getSubscriptionStatusBadgeVariant(subscription.status)}>
                    {STATUS_LABEL[subscription.status]}
                  </Badge>
                </div>
              )}
            </DialogHeader>

            {/* ─── Timeline ─── */}
            <section className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm sm:grid-cols-3">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Bắt đầu</p>
                <p className="font-medium">{formatDateTimeVi(subscription?.startedAt)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Hết hạn</p>
                <p className="font-medium">{formatDateTimeVi(subscription?.expiresAt)}</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">Hiệu lực từ</p>
                <p className="flex items-center gap-1 font-medium">
                  <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDateTimeVi(version?.effectiveFrom)}
                </p>
              </div>
            </section>

            {/* ─── Cancel reason ─── */}
            {subscription?.cancelReason && (
              <section className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Lý do hủy</p>
                  <p className="text-muted-foreground">{subscription.cancelReason}</p>
                  {subscription.cancelledAt && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Hủy lúc {formatDateTimeVi(subscription.cancelledAt)}
                    </p>
                  )}
                </div>
              </section>
            )}

            {/* ─── Features ─── */}
            <section className="space-y-2">
              <p className="text-sm font-medium">Quyền lợi gói ({version?.features.length ?? 0})</p>
              {!version?.features.length ? (
                <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  Không có thông tin quyền lợi cho phiên bản này.
                </p>
              ) : (
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Quyền lợi</th>
                        <th className="px-3 py-2 text-right">Giá trị</th>
                      </tr>
                    </thead>
                    <tbody>
                      {version.features.map((f) => (
                        <tr key={f.id} className="border-t">
                          <td className="px-3 py-2">
                            <p className="font-medium">{f.featureName ?? f.featureCode}</p>
                            {f.featureDescription && (
                              <p className="text-xs text-muted-foreground">{f.featureDescription}</p>
                            )}
                            {f.note && (
                              <p className="text-xs italic text-muted-foreground">{f.note}</p>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            {renderFeatureValue(f.value, f.featureValueType, f.featureUnit)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <Separator />
            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Đóng</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default SubscriptionDetailDialog;
