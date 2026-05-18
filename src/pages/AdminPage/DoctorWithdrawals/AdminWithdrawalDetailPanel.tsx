import { zodResolver } from "@hookform/resolvers/zod";
import {
  BadgeCheck,
  Banknote,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Clock,
  RefreshCcw,
  Upload,
  User,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import envConfig from "@/config";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/schemaValidatation/doctorWithdrawal";
import {
  STATUS_CLASS,
  STATUS_LABELS,
  STATUS_VARIANT,
} from "./withdrawal.constants";

const ACTOR_ROLE_LABEL: Record<WithdrawalAuditEntryType["actorRole"], string> =
  {
    DOCTOR: "Bác sĩ",
    ADMIN: "Admin",
    SYSTEM: "Hệ thống",
  };

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

  const onSubmit = async (data: RejectWithdrawalBodyType) => {
    try {
      await rejectMutation.mutateAsync({ id: withdrawalId, body: data });
      form.reset();
      onClose();
    } catch (err) {
      if (isApiErrorUnprocessableEntityResponse<RejectWithdrawalBodyType>(err)) {
        handleApiErrorUnprocessentity<RejectWithdrawalBodyType>(
          err.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(err)) {
        toast.error(err.response?.data.message ?? "Không thể từ chối yêu cầu");
        return;
      }
      toast.error("Không thể từ chối yêu cầu");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Từ chối yêu cầu rút tiền</DialogTitle>
          <DialogDescription>
            Vui lòng nhập lý do từ chối. Lý do sẽ hiển thị cho bác sĩ.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label
              htmlFor="reject-reason"
              className="text-sm font-medium"
            >
              Lý do từ chối <span className="text-destructive">*</span>
            </label>
            <Textarea
              id="reject-reason"
              {...form.register("rejectReason")}
              placeholder="VD: Số tài khoản không hợp lệ, không khớp với CCCD..."
              rows={4}
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
              {rejectMutation.isPending ? "Đang từ chối..." : "Từ chối"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<MarkPaidBodyType>({
    resolver: zodResolver(MarkPaidBodySchema),
    defaultValues: {
      transferReference: "",
      transferProofUrl: "",
      adminNote: "",
    },
  });
  useClearServerFieldErrors(form);

  const proofUrl = form.watch("transferProofUrl");

  const handleFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File vượt quá 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn file ảnh");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", envConfig.CLOUDINARY_UPLOAD_PRESET);
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${envConfig.CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData },
      );
      if (!res.ok) throw new Error("Upload failed");
      const uploadResult = await res.json();
      const url = uploadResult.secure_url as string | undefined;
      if (!url) throw new Error("No url returned");
      form.setValue("transferProofUrl", url, { shouldValidate: true });
      toast.success("Tải ảnh thành công");
    } catch {
      toast.error("Không thể tải ảnh");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSubmit = async (data: MarkPaidBodyType) => {
    try {
      const payload: MarkPaidBodyType = {
        ...data,
        adminNote: data.adminNote?.trim() || undefined,
      };
      await markPaidMutation.mutateAsync({
        id: withdrawalId,
        body: payload,
      });
      form.reset();
      onClose();
    } catch (err) {
      if (isApiErrorUnprocessableEntityResponse<MarkPaidBodyType>(err)) {
        handleApiErrorUnprocessentity<MarkPaidBodyType>(
          err.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(err)) {
        toast.error(
          err.response?.data.message ?? "Không thể đánh dấu chuyển khoản",
        );
        return;
      }
      toast.error("Không thể đánh dấu chuyển khoản");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Đánh dấu đã chuyển khoản</DialogTitle>
          <DialogDescription>
            Cập nhật mã giao dịch, ảnh chứng minh và ghi chú (tuỳ chọn).
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label
              htmlFor="transferReference"
              className="text-sm font-medium"
            >
              Mã giao dịch <span className="text-destructive">*</span>
            </label>
            <Input
              id="transferReference"
              {...form.register("transferReference")}
              placeholder="VD: FT2401231234"
            />
            {form.formState.errors.transferReference && (
              <p className="text-xs text-destructive">
                {form.formState.errors.transferReference.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">
              Ảnh chứng minh <span className="text-destructive">*</span>
            </label>
            {proofUrl ? (
              <div className="relative">
                <img
                  src={proofUrl}
                  alt="Chứng minh"
                  className="w-full h-32 object-cover rounded border"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute right-1 top-1 h-6 w-6"
                  onClick={() => form.setValue("transferProofUrl", "")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {uploading ? "Đang tải..." : "Tải ảnh chứng minh"}
                </Button>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG (tối đa 5MB)
                </p>
              </div>
            )}
            {form.formState.errors.transferProofUrl && (
              <p className="text-xs text-destructive">
                {form.formState.errors.transferProofUrl.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="adminNote"
              className="text-sm font-medium"
            >
              Ghi chú (tuỳ chọn)
            </label>
            <Textarea
              id="adminNote"
              {...form.register("adminNote")}
              placeholder="Ghi chú nội bộ..."
              rows={2}
            />
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
              disabled={markPaidMutation.isPending || uploading}
            >
              {markPaidMutation.isPending ? "Đang xử lý..." : "Đánh dấu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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

  const onSubmit = async (data: ResolveNotReceivedBodyType) => {
    try {
      const payload: ResolveNotReceivedBodyType = {
        ...data,
        adminNote: data.adminNote?.trim() || undefined,
      };
      await resolveMutation.mutateAsync({
        id: withdrawalId,
        body: payload,
      });
      form.reset();
      onClose();
    } catch (err) {
      if (
        isApiErrorUnprocessableEntityResponse<ResolveNotReceivedBodyType>(err)
      ) {
        handleApiErrorUnprocessentity<ResolveNotReceivedBodyType>(
          err.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(err)) {
        toast.error(err.response?.data.message ?? "Không thể chuyển khoản lại");
        return;
      }
      toast.error("Không thể chuyển khoản lại");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chuyển khoản lại</DialogTitle>
          <DialogDescription>
            Nhập mã giao dịch mới và ảnh chứng minh.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-3"
        >
          <div className="space-y-1">
            <label className="text-sm font-medium">
              Mã giao dịch mới <span className="text-destructive">*</span>
            </label>
            <Input
              {...form.register("transferReference")}
              placeholder="VD: FT2401231234"
            />
            {form.formState.errors.transferReference && (
              <p className="text-xs text-destructive">
                {form.formState.errors.transferReference.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">URL ảnh chứng minh</label>
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
            <label className="text-sm font-medium">Ghi chú</label>
            <Textarea
              {...form.register("adminNote")}
              rows={2}
            />
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
              {resolveMutation.isPending
                ? "Đang xử lý..."
                : "Chuyển khoản lại"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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

      <RejectDialog
        open={showReject}
        onClose={() => setShowReject(false)}
        withdrawalId={id}
      />
      <MarkPaidDialog
        open={showMarkPaid}
        onClose={() => setShowMarkPaid(false)}
        withdrawalId={id}
      />
      <RetryPaidDialog
        open={showRetryPaid}
        onClose={() => setShowRetryPaid(false)}
        withdrawalId={id}
      />
    </Card>
  );
}

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
                  {formatDateTimeVi(entry.at)} ·{" "}
                  {ACTOR_ROLE_LABEL[entry.actorRole]}
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

interface AdminWithdrawalDetailPanelProps {
  withdrawalId: string;
}

export default function AdminWithdrawalDetailPanel({
  withdrawalId,
}: AdminWithdrawalDetailPanelProps) {
  const detailResult = useAdminWithdrawalDetail(
    withdrawalId,
    !!withdrawalId,
  );
  const w = detailResult.data?.data;

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
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Yêu cầu rút tiền
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {w.doctorName ?? "Bác sĩ"}
            </h2>
            <Badge
              variant={STATUS_VARIANT[w.status]}
              className={STATUS_CLASS[w.status]}
            >
              {STATUS_LABELS[w.status]}
            </Badge>
          </div>
          {w.doctorEmail && (
            <p className="text-xs text-muted-foreground">{w.doctorEmail}</p>
          )}
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

      <ActionPanel withdrawal={w} />

      <div className="grid gap-4 md:grid-cols-2">
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

      {(w.transferReference || w.paidAt) && (
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
          {w.resolvedNotReceivedAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Xử lý khiếu nại lúc</span>
              <span>{formatDateTimeVi(w.resolvedNotReceivedAt)}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <AuditLog
        withdrawalId={w.id}
        enabled
      />
    </div>
  );
}
