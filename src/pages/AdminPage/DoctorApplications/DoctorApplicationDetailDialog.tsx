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
import { useMemo } from "react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminDoctorRequestDetail } from "@/queries/useAdmin";
import {
  DOCTOR_TYPE_LABEL,
  REGISTRATION_STATUS_META,
  USER_STATUS_LABEL,
} from "./statusMeta";
import {
  initialsOf,
  formatDateTime,
  formatDate,
  InfoRow,
  SectionTitle,
} from "./doctorApplicationHelpers";

interface Props {
  id?: string;
  onClose: () => void;
}

const DoctorApplicationDetailDialog = ({ id, onClose }: Props) => {
  const open = Boolean(id);
  const detailQuery = useAdminDoctorRequestDetail(id ?? "", open);

  const request = open ? detailQuery.data?.data : undefined;

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
          <DialogTitle className="text-xl">
            Chi tiết đơn đăng ký bác sĩ
          </DialogTitle>
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
                    <InfoRow
                      icon={FileText}
                      label="Tiêu đề"
                      value={request.title}
                    />
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
                      value={formatDate(
                        request.doctorProfile.licenseExpiryDate,
                      )}
                    />
                    {typeof request.doctorProfile.yearsOfExperience ===
                      "number" && (
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
                  <InfoRow
                    icon={Mail}
                    label="Email"
                    value={request.user.email}
                  />
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
                    value={
                      USER_STATUS_LABEL[request.user.status] ??
                      request.user.status
                    }
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t bg-muted/20 p-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DoctorApplicationDetailDialog;
