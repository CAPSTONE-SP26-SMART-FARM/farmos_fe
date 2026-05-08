import { zodResolver } from "@hookform/resolvers/zod";
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  RefreshCcw,
  User,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { formatCurrencyVnd, formatDateTimeVi } from "@/lib/format";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import {
  useAdminApproveWithdrawal,
  useAdminMarkPaidWithdrawal,
  useAdminRejectWithdrawal,
  useAdminResolveNotReceived,
  useAdminWithdrawalAudit,
  useAdminWithdrawalDetail,
} from "@/queries/useAdmin";
import {
  MarkPaidBodySchema,
  RejectWithdrawalBodySchema,
  ResolveNotReceivedBodySchema,
} from "@/schemaValidatation/doctorWithdrawal";
import type {
  MarkPaidBodyType,
  RejectWithdrawalBodyType,
  ResolveNotReceivedBodyType,
  WithdrawalAuditEntryType,
  WithdrawalRequestResType,
  WithdrawalStatus,
} from "@/schemaValidatation/doctorWithdrawal";
import { useDynamicBreadcrumb } from "@/stores/breadcrumbStore";

// ── Status helpers ────────────────────────────────────────────────────────
const STATUS_LABELS: Record<WithdrawalStatus, string> = {
  pending: "Chờ duyệt",
  in_progress: "Đang xử lý",
  paid: "Đã chuyển khoản",
  done: "Hoàn thành",
  rejected: "Bị từ chối",
  cancelled: "Đã huỷ",
  not_received: "Chưa nhận tiền",
};

const STATUS_VARIANT: Record<
  WithdrawalStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  in_progress: "outline",
  paid: "outline",
  done: "default",
  rejected: "destructive",
  cancelled: "secondary",
  not_received: "outline",
};

const STATUS_CLASS: Partial<Record<WithdrawalStatus, string>> = {
  in_progress: "border-blue-500 text-blue-600",
  paid: "border-purple-500 text-purple-600",
  not_received: "border-orange-500 text-orange-600",
};

// ── Actor role label ──────────────────────────────────────────────────────
const ACTOR_ROLE_LABEL: Record<WithdrawalAuditEntryType["actorRole"], string> =
  {
    DOCTOR: "Bác sĩ",
    ADMIN: "Quản trị",
    SYSTEM: "Hệ thống",
  };

// ── Reject Dialog ─────────────────────────────────────────────────────────
function RejectDialog({
  open,
  onClose,
  withdrawalId,
}: {
  open: boolean;
  onClose: () => void;
  withdrawalId: string;
}) {
  const rejectMutation = useAdminRejectWithdrawal();
  const form = useForm<RejectWithdrawalBodyType>({
    resolver: zodResolver(RejectWithdrawalBodySchema),
    defaultValues: { rejectReason: "" },
  });
  useClearServerFieldErrors(form);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await rejectMutation.mutateAsync({ id: withdrawalId, body: values });
      form.reset();
      onClose();
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<RejectWithdrawalBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<RejectWithdrawalBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Thao tác thất bại");
      }
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Từ chối yêu cầu rút tiền</DialogTitle>
          <DialogDescription>
            Nhập lý do từ chối để thông báo đến bác sĩ.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium">Lý do từ chối *</label>
            <Textarea
              {...form.register("rejectReason")}
              rows={4}
              placeholder="Nhập lý do từ chối..."
            />
            {form.formState.errors.rejectReason && (
              <p className="text-xs text-destructive">
                {form.formState.errors.rejectReason.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "Đang xử lý…" : "Từ chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Mark Paid Dialog ──────────────────────────────────────────────────────
function MarkPaidDialog({
  open,
  onClose,
  withdrawalId,
}: {
  open: boolean;
  onClose: () => void;
  withdrawalId: string;
}) {
  const markPaidMutation = useAdminMarkPaidWithdrawal();
  const form = useForm<MarkPaidBodyType>({
    resolver: zodResolver(MarkPaidBodySchema),
    defaultValues: {
      transferReference: "",
      transferProofUrl: "",
      adminNote: "",
    },
  });
  useClearServerFieldErrors(form);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await markPaidMutation.mutateAsync({ id: withdrawalId, body: values });
      form.reset();
      onClose();
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<MarkPaidBodyType>(error)) {
        handleApiErrorUnprocessentity<MarkPaidBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Thao tác thất bại");
      }
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đánh dấu đã chuyển khoản</DialogTitle>
          <DialogDescription>
            Nhập thông tin chuyển khoản để xác nhận giao dịch.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium">Mã chuyển khoản *</label>
            <Input
              {...form.register("transferReference")}
              placeholder="Nhập mã giao dịch..."
            />
            {form.formState.errors.transferReference && (
              <p className="text-xs text-destructive">
                {form.formState.errors.transferReference.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              URL chứng minh (tuỳ chọn)
            </label>
            <Input
              {...form.register("transferProofUrl")}
              placeholder="https://..."
            />
            {form.formState.errors.transferProofUrl && (
              <p className="text-xs text-destructive">
                {form.formState.errors.transferProofUrl.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Ghi chú admin (tuỳ chọn)
            </label>
            <Textarea
              {...form.register("adminNote")}
              rows={2}
              placeholder="Ghi chú..."
            />
            {form.formState.errors.adminNote && (
              <p className="text-xs text-destructive">
                {form.formState.errors.adminNote.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={markPaidMutation.isPending}
            >
              {markPaidMutation.isPending ? "Đang xử lý…" : "Xác nhận"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Retry Paid Dialog ─────────────────────────────────────────────────────
function RetryPaidDialog({
  open,
  onClose,
  withdrawalId,
}: {
  open: boolean;
  onClose: () => void;
  withdrawalId: string;
}) {
  const resolveMutation = useAdminResolveNotReceived();
  const form = useForm<ResolveNotReceivedBodyType>({
    resolver: zodResolver(ResolveNotReceivedBodySchema),
    defaultValues: {
      action: "RETRY_PAID",
      transferReference: "",
      transferProofUrl: "",
      adminNote: "",
    },
  });
  useClearServerFieldErrors(form);

  const handleSubmit = form.handleSubmit(async (values) => {
    try {
      await resolveMutation.mutateAsync({ id: withdrawalId, body: values });
      form.reset();
      onClose();
    } catch (error) {
      if (
        isApiErrorUnprocessableEntityResponse<ResolveNotReceivedBodyType>(error)
      ) {
        handleApiErrorUnprocessentity<ResolveNotReceivedBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Thao tác thất bại");
      }
    }
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chuyển khoản lại</DialogTitle>
          <DialogDescription>
            Nhập thông tin để thực hiện chuyển khoản lại cho bác sĩ.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium">Mã chuyển khoản</label>
            <Input
              {...form.register("transferReference")}
              placeholder="Nhập mã giao dịch mới..."
            />
            {form.formState.errors.transferReference && (
              <p className="text-xs text-destructive">
                {form.formState.errors.transferReference.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              URL chứng minh (tuỳ chọn)
            </label>
            <Input
              {...form.register("transferProofUrl")}
              placeholder="https://..."
            />
            {form.formState.errors.transferProofUrl && (
              <p className="text-xs text-destructive">
                {form.formState.errors.transferProofUrl.message}
              </p>
            )}
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Ghi chú admin (tuỳ chọn)
            </label>
            <Textarea
              {...form.register("adminNote")}
              rows={2}
              placeholder="Ghi chú..."
            />
            {form.formState.errors.adminNote && (
              <p className="text-xs text-destructive">
                {form.formState.errors.adminNote.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Huỷ
            </Button>
            <Button
              type="submit"
              disabled={resolveMutation.isPending}
            >
              {resolveMutation.isPending ? "Đang xử lý…" : "Chuyển khoản lại"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Action Panel ──────────────────────────────────────────────────────────
function ActionPanel({ withdrawal }: { withdrawal: WithdrawalRequestResType }) {
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(false);
  const [showRetryPaid, setShowRetryPaid] = useState(false);
  const [showRefund, setShowRefund] = useState(false);

  const approveMutation = useAdminApproveWithdrawal();
  const resolveMutation = useAdminResolveNotReceived();

  const { status, id } = withdrawal;

  if (status === "done") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
        <BadgeCheck className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium">
          Yêu cầu đã hoàn thành — bác sĩ đã xác nhận nhận tiền.
        </span>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        <span className="text-sm font-medium">
          Yêu cầu đã bị từ chối
          {withdrawal.rejectReason ? `: ${withdrawal.rejectReason}` : "."}
        </span>
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="rounded-lg border p-4">
        <span className="text-sm text-muted-foreground">
          Yêu cầu đã bị huỷ bởi bác sĩ.
        </span>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 p-4 text-purple-800">
        <Clock className="h-5 w-5 shrink-0" />
        <span className="text-sm font-medium">
          Đã chuyển khoản — đang chờ bác sĩ xác nhận.
        </span>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Thao tác</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {/* pending */}
        {status === "pending" && (
          <>
            <Button onClick={() => setShowApprove(true)}>Duyệt yêu cầu</Button>
            <Button
              variant="destructive"
              onClick={() => setShowReject(true)}
            >
              Từ chối
            </Button>
          </>
        )}

        {/* in_progress */}
        {status === "in_progress" && (
          <>
            <Button onClick={() => setShowMarkPaid(true)}>
              Đánh dấu đã chuyển khoản
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowReject(true)}
            >
              Từ chối
            </Button>
          </>
        )}

        {/* not_received */}
        {status === "not_received" && (
          <>
            <Button onClick={() => setShowRetryPaid(true)}>
              Chuyển khoản lại
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowRefund(true)}
            >
              Hoàn tiền vào ví
            </Button>
          </>
        )}
      </CardContent>

      {/* Approve confirm */}
      <ConfirmDialog
        open={showApprove}
        title="Duyệt yêu cầu rút tiền?"
        description="Xác nhận sẽ chuyển trạng thái sang Đang xử lý."
        confirmLabel="Duyệt"
        cancelLabel="Huỷ"
        onConfirm={async () => {
          try {
            await approveMutation.mutateAsync(id);
            setShowApprove(false);
          } catch {
            toast.error("Không thể duyệt yêu cầu");
            setShowApprove(false);
          }
        }}
        onCancel={() => setShowApprove(false)}
      />

      {/* Refund confirm */}
      <ConfirmDialog
        open={showRefund}
        title="Hoàn tiền vào ví bác sĩ?"
        description="Số tiền sẽ được hoàn lại vào ví của bác sĩ."
        confirmLabel="Hoàn tiền"
        cancelLabel="Huỷ"
        onConfirm={async () => {
          try {
            await resolveMutation.mutateAsync({
              id,
              body: { action: "REFUND" },
            });
            setShowRefund(false);
          } catch {
            toast.error("Không thể hoàn tiền");
            setShowRefund(false);
          }
        }}
        onCancel={() => setShowRefund(false)}
      />

      {/* Reject dialog */}
      <RejectDialog
        open={showReject}
        onClose={() => setShowReject(false)}
        withdrawalId={id}
      />

      {/* Mark paid dialog */}
      <MarkPaidDialog
        open={showMarkPaid}
        onClose={() => setShowMarkPaid(false)}
        withdrawalId={id}
      />

      {/* Retry paid dialog */}
      <RetryPaidDialog
        open={showRetryPaid}
        onClose={() => setShowRetryPaid(false)}
        withdrawalId={id}
      />
    </Card>
  );
}

// ── Audit Log ─────────────────────────────────────────────────────────────
function AuditLog({
  withdrawalId,
  enabled,
}: {
  withdrawalId: string;
  enabled: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const auditResult = useAdminWithdrawalAudit(
    withdrawalId,
    enabled && expanded,
  );

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Lịch sử thay đổi</CardTitle>
          </div>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {expanded && (
        <CardContent>
          {auditResult.isLoading && (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <Skeleton
                  key={n}
                  className="h-10 w-full"
                />
              ))}
            </div>
          )}
          {!auditResult.isLoading &&
            auditResult.data?.data.data.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Chưa có lịch sử thay đổi.
              </p>
            )}
          {auditResult.data?.data.data.map((entry, idx) => (
            <div
              key={idx}
              className="flex gap-3 py-2"
            >
              <div className="flex flex-col items-center">
                <div className="h-2.5 w-2.5 rounded-full bg-primary mt-1.5" />
                {idx < (auditResult.data?.data.data.length ?? 0) - 1 && (
                  <div className="flex-1 w-px bg-border mt-1" />
                )}
              </div>
              <div className="pb-3">
                <p className="text-sm font-medium">{entry.event}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTimeVi(entry.at)} · {entry.actor ?? "—"} (
                  {ACTOR_ROLE_LABEL[entry.actorRole]})
                </p>
                {entry.note && (
                  <p className="mt-0.5 text-xs text-muted-foreground italic">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      )}
    </Card>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
function AdminDoctorWithdrawalDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detailResult = useAdminWithdrawalDetail(id ?? "", !!id);
  const w: WithdrawalRequestResType | undefined = detailResult.data?.data;

  useDynamicBreadcrumb(
    `/dashboard/admin/doctor-withdrawals/${id}`,
    w ? `Yêu cầu ${w.id.slice(0, 8)}…` : undefined,
  );

  if (detailResult.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!w) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <p className="text-muted-foreground">Không tìm thấy yêu cầu.</p>
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard/admin/doctor-withdrawals")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate("/dashboard/admin/doctor-withdrawals")}
            aria-label="Quay lại"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Yêu cầu rút tiền
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                {w.id.slice(0, 8)}…
              </h1>
              <Badge
                variant={STATUS_VARIANT[w.status]}
                className={STATUS_CLASS[w.status]}
              >
                {STATUS_LABELS[w.status]}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground font-mono">{w.id}</p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => detailResult.refetch()}
          disabled={detailResult.isFetching}
        >
          <RefreshCcw
            className={`mr-1.5 h-4 w-4 ${detailResult.isFetching ? "animate-spin" : ""}`}
          />
          Tải lại
        </Button>
      </div>

      {/* Action panel */}
      <ActionPanel withdrawal={w} />

      {/* Main info grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Amount info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Thông tin số tiền</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Số tiền rút</span>
              <span className="font-semibold text-lg">
                {formatCurrencyVnd(w.amount)}
              </span>
            </div>
            {w.doctorNote && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Ghi chú bác sĩ
                  </p>
                  <p className="text-sm">{w.doctorNote}</p>
                </div>
              </>
            )}
            {w.adminNote && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Ghi chú admin
                  </p>
                  <p className="text-sm">{w.adminNote}</p>
                </div>
              </>
            )}
            {w.rejectReason && (
              <>
                <Separator />
                <div>
                  <p className="text-xs text-destructive mb-1">Lý do từ chối</p>
                  <p className="text-sm text-destructive">{w.rejectReason}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Bank info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">Tài khoản ngân hàng</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ngân hàng</span>
              <span className="font-medium">{w.snapshotBankName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mã ngân hàng</span>
              <span>{w.snapshotBankCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Số tài khoản</span>
              <span className="font-mono">{w.snapshotAccountNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chủ tài khoản</span>
              <span>{w.snapshotAccountHolder}</span>
            </div>
            {w.snapshotBranch && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chi nhánh</span>
                <span>{w.snapshotBranch}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer info */}
      {(w.transferReference || w.paidBy || w.paidAt) && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
              <CardTitle className="text-base">
                Thông tin chuyển khoản
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {w.transferReference && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mã giao dịch</span>
                <span className="font-mono">{w.transferReference}</span>
              </div>
            )}
            {w.paidBy && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Người chuyển</span>
                <span className="font-mono">{w.paidBy.slice(0, 8)}…</span>
              </div>
            )}
            {w.paidAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Thời điểm chuyển</span>
                <span>{formatDateTimeVi(w.paidAt)}</span>
              </div>
            )}
            {w.transferProofUrl && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chứng minh</span>
                <a
                  href={w.transferProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2"
                >
                  Xem ảnh
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Timestamps */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <CardTitle className="text-base">Thời gian</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tạo lúc</span>
            <span>{formatDateTimeVi(w.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cập nhật</span>
            <span>{formatDateTimeVi(w.updatedAt)}</span>
          </div>
          {w.reviewedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duyệt lúc</span>
              <span>{formatDateTimeVi(w.reviewedAt)}</span>
            </div>
          )}
          {w.confirmedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Xác nhận lúc</span>
              <span>{formatDateTimeVi(w.confirmedAt)}</span>
            </div>
          )}
          {w.notReceivedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Chưa nhận lúc</span>
              <span>{formatDateTimeVi(w.notReceivedAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit log */}
      <AuditLog
        withdrawalId={w.id}
        enabled={!!id}
      />
    </div>
  );
}

export default AdminDoctorWithdrawalDetailPage;
