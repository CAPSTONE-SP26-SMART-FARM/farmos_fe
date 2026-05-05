import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Award,
  BadgeCheck,
  CalendarClock,
  CheckCircle2,
  FileText,
  Mail,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { RegistrationStatusName } from "@/constants/profile";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import {
  useAdminChangeStatusDoctorRequest,
  useAdminDoctorRequestDetail,
} from "@/queries/useAdmin";
import {
  UpdateDoctorRequestStatusBodySchema,
  type UpdateDoctorRequestStatusBodyType,
} from "@/schemaValidatation/doctorProfile";
import { DOCTOR_TYPE_LABEL, REGISTRATION_STATUS_META } from "./statusMeta";
import {
  initialsOf,
  formatDateTime,
  formatDate,
  InfoRow,
  SectionTitle,
} from "./doctorApplicationHelpers";
import { QuickApproveSuspendButtons } from "./components/DoctorApplicationActions";

interface Props {
  id?: string;
  onClose: () => void;
}

const DoctorApplicationDetailDialog = ({ id, onClose }: Props) => {
  const open = Boolean(id);
  const detailQuery = useAdminDoctorRequestDetail(id ?? "", open);
  const mutation = useAdminChangeStatusDoctorRequest();

  const request = open ? detailQuery.data?.data : undefined;
  const isFinalized =
    request?.registrationStatus &&
    request.registrationStatus !== RegistrationStatusName.Pending &&
    request.registrationStatus !== RegistrationStatusName.Approved;

  const form = useForm<UpdateDoctorRequestStatusBodyType>({
    resolver: zodResolver(UpdateDoctorRequestStatusBodySchema),
    defaultValues: {
      status: RegistrationStatusName.Approved,
      reason: "",
    },
  });
  useClearServerFieldErrors(form);

  const status = form.watch("status");
  const requiresReason =
    status === RegistrationStatusName.Rejected ||
    status === RegistrationStatusName.Suspended;

  useEffect(() => {
    if (!open) {
      form.reset({
        status: RegistrationStatusName.Approved,
        reason: "",
      });
      return;
    }
    if (request) {
      const next =
        request.registrationStatus === RegistrationStatusName.Approved
          ? RegistrationStatusName.Suspended
          : RegistrationStatusName.Approved;
      form.reset({
        status: next,
        reason: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id, open]);

  const submit = (overrideStatus?: UpdateDoctorRequestStatusBodyType["status"]) =>
    form.handleSubmit(async (values) => {
      if (!id) return;
      const finalStatus = overrideStatus ?? values.status;
      const finalReason = values.reason?.trim() || undefined;

      if (
        (finalStatus === RegistrationStatusName.Rejected ||
          finalStatus === RegistrationStatusName.Suspended) &&
        !finalReason
      ) {
        form.setError("reason", {
          type: "manual",
          message: "Vui lòng nhập lý do",
        });
        return;
      }

      try {
        await mutation.mutateAsync({
          id,
          status: finalStatus,
          reason: finalReason,
        });
        const meta = REGISTRATION_STATUS_META[finalStatus];
        toast.success(`Đã cập nhật trạng thái: ${meta.label}`);
        onClose();
      } catch (error) {
        if (
          isApiErrorUnprocessableEntityResponse<UpdateDoctorRequestStatusBodyType>(
            error,
          )
        ) {
          handleApiErrorUnprocessentity<UpdateDoctorRequestStatusBodyType>(
            error.response!.data.errors,
            form.setError,
            { getValues: form.getValues },
          );
          return;
        }
        if (isApiErrorResponse(error)) {
          toast.error(
            error.response?.data.message ?? "Cập nhật trạng thái thất bại",
          );
          return;
        }
        toast.error("Cập nhật trạng thái thất bại");
      }
    });

  const currentMeta = useMemo(
    () =>
      request
        ? REGISTRATION_STATUS_META[request.registrationStatus]
        : undefined,
    [request],
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0">
        <DialogHeader className="border-b p-6 pb-4">
          <DialogTitle className="text-xl">Chi tiết đơn đăng ký bác sĩ</DialogTitle>
          <DialogDescription>
            Xem hồ sơ chuyên môn và xử lý đơn xin làm bác sĩ trên nền tảng.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {detailQuery.isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 w-full" />
              <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detailQuery.isError ? (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center text-destructive">
              <AlertTriangle className="mx-auto mb-2 h-6 w-6" />
              <div className="font-medium">Không thể tải dữ liệu đơn.</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Vui lòng đóng và thử lại sau.
              </div>
            </div>
          ) : !request ? (
            <div className="text-center text-muted-foreground py-12">
              Không tìm thấy đơn này.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col gap-4 rounded-lg border bg-muted/30 p-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback>
                      {initialsOf(request.user.fullName, request.user.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="leading-tight">
                    <div className="text-base font-semibold">
                      {request.user.fullName ?? "—"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {request.user.email}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {currentMeta && (
                    <Badge
                      variant={currentMeta.variant}
                      className={currentMeta.className}
                    >
                      <currentMeta.icon className="h-3.5 w-3.5" />
                      {currentMeta.label}
                    </Badge>
                  )}
                  {request.selfRegistered ? (
                    <Badge variant="outline">Tự đăng ký</Badge>
                  ) : (
                    <Badge variant="secondary">Quản trị tạo</Badge>
                  )}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-lg border p-5">
                  <SectionTitle>Nội dung đơn</SectionTitle>
                  <div className="space-y-4">
                    <InfoRow icon={FileText} label="Tiêu đề" value={request.title} />
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Mô tả
                      </div>
                      <div className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/20 p-3 text-sm">
                        {request.description}
                      </div>
                    </div>
                    <InfoRow
                      icon={CalendarClock}
                      label="Gửi lúc"
                      value={formatDateTime(request.createdAt)}
                    />
                    {request.repliedAt && (
                      <InfoRow
                        icon={CheckCircle2}
                        label="Phản hồi lúc"
                        value={formatDateTime(request.repliedAt)}
                      />
                    )}
                    {request.reason && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Lý do trước đó
                        </div>
                        <div className="mt-1 whitespace-pre-wrap rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-500/30 dark:bg-amber-500/10">
                          {request.reason}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-lg border p-5">
                  <SectionTitle>Hồ sơ chuyên môn</SectionTitle>
                  <div className="space-y-4">
                    <InfoRow
                      icon={ShieldCheck}
                      label="Loại bác sĩ"
                      value={
                        DOCTOR_TYPE_LABEL[request.doctorProfile.doctorType] ??
                        request.doctorProfile.doctorType
                      }
                    />
                    <InfoRow
                      icon={Award}
                      label="Chuyên môn"
                      value={request.doctorProfile.specialization}
                    />
                    <InfoRow
                      icon={BadgeCheck}
                      label="Số giấy phép"
                      value={request.doctorProfile.licenseNumber}
                    />
                    <InfoRow
                      icon={CalendarClock}
                      label="Hạn giấy phép"
                      value={formatDate(request.doctorProfile.licenseExpiryDate)}
                    />
                    {typeof request.doctorProfile.yearsOfExperience === "number" && (
                      <InfoRow
                        icon={UserIcon}
                        label="Số năm kinh nghiệm"
                        value={`${request.doctorProfile.yearsOfExperience} năm`}
                      />
                    )}
                    {request.doctorProfile.bio && (
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          Giới thiệu
                        </div>
                        <div className="mt-1 whitespace-pre-wrap rounded-md border bg-muted/20 p-3 text-sm">
                          {request.doctorProfile.bio}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border p-5">
                <SectionTitle>Thông tin người gửi</SectionTitle>
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoRow icon={Mail} label="Email" value={request.user.email} />
                  <InfoRow
                    icon={Phone}
                    label="Số điện thoại"
                    value={request.user.phone ?? "—"}
                  />
                  <InfoRow
                    icon={UserIcon}
                    label="Họ tên"
                    value={request.user.fullName ?? "—"}
                  />
                  <InfoRow
                    icon={ShieldCheck}
                    label="Trạng thái tài khoản"
                    value={request.user.status}
                  />
                </div>
              </div>

              <Separator />

              <div className="rounded-lg border p-5">
                <SectionTitle>Quyết định xử lý</SectionTitle>
                {isFinalized ? (
                  <div className="rounded-md border bg-muted/30 p-4 text-sm text-muted-foreground">
                    Đơn này đã được xử lý ở trạng thái{" "}
                    <strong className="text-foreground">
                      {currentMeta?.label}
                    </strong>
                    . Bạn có thể chuyển sang trạng thái khác bên dưới nếu cần
                    điều chỉnh.
                  </div>
                ) : null}

                <form className="mt-3 grid gap-4 md:grid-cols-[200px_1fr]">
                  <Controller
                    name="status"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Trạng thái mới</FieldLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={RegistrationStatusName.Approved}>
                              Đã duyệt
                            </SelectItem>
                            <SelectItem value={RegistrationStatusName.Rejected}>
                              Từ chối
                            </SelectItem>
                            <SelectItem value={RegistrationStatusName.Suspended}>
                              Tạm ngưng
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="reason"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>
                          Lý do
                          {requiresReason ? (
                            <span className="ml-1 text-destructive">*</span>
                          ) : (
                            <span className="ml-1 text-muted-foreground">
                              (không bắt buộc)
                            </span>
                          )}
                        </FieldLabel>
                        <Textarea
                          {...field}
                          placeholder={
                            requiresReason
                              ? "Bắt buộc phải nhập lý do khi từ chối hoặc tạm ngưng"
                              : "Ghi chú tùy chọn cho người dùng"
                          }
                          rows={3}
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </form>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/20 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Đóng
          </Button>

          {request && (
            <QuickApproveSuspendButtons
              isPending={mutation.isPending}
              currentStatus={request.registrationStatus}
              onAction={(s) => {
                form.setValue("status", s);
                submit(s)();
              }}
            />
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorApplicationDetailDialog;
