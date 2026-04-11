import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useAdminChangeStatusDoctorRequest,
  useAdminDoctorRequestDetail,
} from "@/queries/useAdmin";
import type { DoctorRequestWithProfileAndUserResType } from "@/schemaValidatation/doctorProfile";
import {
  UpdateDoctorRequestStatusBodySchema,
  type UpdateDoctorRequestStatusBodyType,
} from "@/schemaValidatation/doctorProfile";
import { useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RegistrationStatusName } from "@/constants/profile";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

interface Props {
  id?: string;
  setId: (id: string | undefined) => void;
}

const REGISTRATION_STATUS_LABEL: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
  suspended: "Tạm ngưng",
};

const UpdateRequest = ({ id, setId }: Props) => {
  const form = useForm<UpdateDoctorRequestStatusBodyType>({
    resolver: zodResolver(UpdateDoctorRequestStatusBodySchema),
    defaultValues: {
      status: RegistrationStatusName.Approved,
      reason: "",
    },
  });

  const detailQuery = useAdminDoctorRequestDetail(id!, !!id);
  const request: DoctorRequestWithProfileAndUserResType | undefined = id
    ? detailQuery.data?.data
    : undefined;

  const mutation = useAdminChangeStatusDoctorRequest();

  useEffect(() => {
    if (request) {
      form.reset({
        status: RegistrationStatusName.Approved,
        reason: request.reason ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id]);

  const reset = () => {
    setId(undefined);
    form.reset();
  };

  const onSubmit = form.handleSubmit(
    async (data: UpdateDoctorRequestStatusBodyType) => {
      if (!id) return;
      try {
        await mutation.mutateAsync(
          {
            id,
            status: data.status,
            reason: data.reason?.trim() || undefined,
          },
          {
            onSuccess: () => {
              reset();
            },
          },
        );
      } catch {
        /* error handled by mutation's onError */
      }
    },
  );

  return (
    <Dialog
      open={Boolean(id)}
      onOpenChange={(open) => {
        if (!open) reset();
      }}
    >
      <DialogContent className="sm:max-w-3xl">
        <form className="space-y-4">
          <DialogHeader>
            <DialogTitle>Chi tiết yêu cầu bác sĩ</DialogTitle>
            <DialogDescription>
              Xem yêu cầu đăng ký bác sĩ và cập nhật trạng thái.
            </DialogDescription>
          </DialogHeader>

          {detailQuery.isLoading ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-4 w-72" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            </div>
          ) : detailQuery.isError ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">
                  Không thể tải yêu cầu
                </CardTitle>
                <CardDescription>
                  Vui lòng đóng và mở lại hộp thoại để thử lại.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : !request ? (
            <Card>
              <CardHeader>
                <CardTitle>Không có dữ liệu</CardTitle>
                <CardDescription>Không tìm thấy yêu cầu.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Yêu cầu</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Tiêu đề</div>
                        <div className="font-medium">{request.title}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Trạng thái</div>
                        <div className="font-medium capitalize">
                          {REGISTRATION_STATUS_LABEL[
                            request.registrationStatus.toLowerCase()
                          ] ?? request.registrationStatus}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-muted-foreground">Mô tả</div>
                      <div className="whitespace-pre-wrap">
                        {request.description}
                      </div>
                    </div>

                    {request.reason ? (
                      <div className="space-y-1">
                        <div className="text-muted-foreground">
                          Lý do trước đó
                        </div>
                        <div className="whitespace-pre-wrap">
                          {request.reason}
                        </div>
                      </div>
                    ) : null}

                    <Separator />
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Cập nhật trạng thái</CardTitle>
                    <CardDescription>
                      Duyệt, từ chối hoặc tạm ngưng yêu cầu này. Lý do là bắt
                      buộc khi từ chối/tạm ngưng.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <FieldGroup>
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
                              <SelectTrigger className="capitalize">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem
                                  value={RegistrationStatusName.Approved}
                                  className="capitalize"
                                >
                                  Đã duyệt
                                </SelectItem>
                                <SelectItem
                                  value={RegistrationStatusName.Rejected}
                                  className="capitalize"
                                >
                                  Từ chối
                                </SelectItem>
                                <SelectItem
                                  value={RegistrationStatusName.Suspended}
                                  className="capitalize"
                                >
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
                            <FieldLabel>Lý do</FieldLabel>
                            <Textarea
                              {...field}
                              placeholder="Không bắt buộc khi duyệt, bắt buộc khi từ chối/tạm ngưng"
                              rows={3}
                            />
                            {fieldState.invalid && (
                              <FieldError errors={[fieldState.error]} />
                            )}
                          </Field>
                        )}
                      />
                    </FieldGroup>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Hồ sơ bác sĩ</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Loại bác sĩ</div>
                        <div className="font-medium capitalize">
                          {request.doctorProfile.doctorType}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">
                          Chuyên môn
                        </div>
                        <div className="font-medium">
                          {request.doctorProfile.specialization}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <div className="text-muted-foreground">
                          Số giấy phép
                        </div>
                        <div className="font-medium">
                          {request.doctorProfile.licenseNumber}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-muted-foreground">
                          Hạn giấy phép
                        </div>
                        <div className="font-medium">
                          {request.doctorProfile.licenseExpiryDate}
                        </div>
                      </div>
                    </div>

                    {request.doctorProfile.bio ? (
                      <div className="space-y-1">
                        <div className="text-muted-foreground">Giới thiệu</div>
                        <div className="whitespace-pre-wrap">
                          {request.doctorProfile.bio}
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Người dùng</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Email</div>
                      <div className="font-medium">{request.user.email}</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">Họ tên</div>
                      <div className="font-medium">
                        {request.user.fullName ?? "—"}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
              >
                Đóng
              </Button>
            </DialogClose>
            <Button
              onClick={onSubmit}
              type="button"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Đang cập nhật..." : "Cập nhật trạng thái"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UpdateRequest;
