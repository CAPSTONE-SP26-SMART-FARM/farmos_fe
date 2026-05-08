import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { handleApiErrorUnprocessentity, onMutationError } from "@/lib/axios";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import {
  useOwnerGetFarmMemberDetail,
  useOwnerUpdateFarmMember,
} from "@/queries/useOwner";
import {
  useOwnerListZones,
  useOwnerSoftDeleteFarmStaffUser,
} from "@/queries/useZone";
import type { FarmMemberResType } from "@/schemaValidatation/farmMember";
import {
  UpdateFarmMemberBodySchema,
  type UpdateFarmMemberBodyType,
} from "@/schemaValidatation/farmMember";
import type { ListZonesQueryType } from "@/types/zone";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Loader2,
  Mail,
  Pencil,
  Phone,
  Shield,
  Tractor,
  Trash2,
  UserCog,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  member: FarmMemberResType;
  onBack: () => void;
}

const ZONES_LIST_QUERY: ListZonesQueryType = { page: 1, limit: 100 };

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm");
  } catch {
    return d;
  }
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 rounded-md p-3 space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

const ROLE_OPTIONS = [
  { value: "manager", label: "Quản lý" },
  { value: "farmer", label: "Nông dân" },
] as const;

const DetailSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-16 w-full"
        />
      ))}
    </CardContent>
  </Card>
);

export default function MemberDetailPanel({ member, onBack }: Props) {
  const [show, setShow] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  const { data, isLoading } = useOwnerGetFarmMemberDetail(member.id);
  const detail = data?.data ?? member;

  const zonesQuery = useOwnerListZones(detail.farm.id, ZONES_LIST_QUERY);
  const zones = zonesQuery.data?.data?.data ?? [];

  const { mutateAsync: updateMember, isPending: updating } =
    useOwnerUpdateFarmMember();
  const { mutateAsync: softDeleteMember, isPending: deleting } =
    useOwnerSoftDeleteFarmStaffUser();

  const form = useForm<UpdateFarmMemberBodyType>({
    resolver: zodResolver(UpdateFarmMemberBodySchema),
  });

  const { reset } = form;

  useClearServerFieldErrors(form);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (editing) return;
    reset({
      email: detail.user.email,
      phone: detail.user.phone ?? "",
      role: detail.role as "farmer" | "manager",
    });
  }, [
    editing,
    detail.id,
    detail.user.email,
    detail.user.phone,
    detail.role,
    reset,
  ]);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const RoleIcon =
    detail.role === "manager" ? (
      <UserCog className="h-5 w-5 text-blue-600" />
    ) : (
      <Tractor className="h-5 w-5 text-green-600" />
    );

  const handleSaveEdit = async (body: UpdateFarmMemberBodyType) => {
    try {
      await updateMember({ id: detail.id, data: body });
      toast.success("Đã cập nhật tài khoản");
      setEditing(false);
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      onMutationError(error, "Không thể cập nhật tài khoản.");
    }
  };

  const handleConfirmDelete = async () => {
    const zoneId = zones[0]?.id;
    if (!zoneId) {
      toast.error(
        "Thêm ít nhất một khu vực (zone) vào nông trại để có thể gỡ tài khoản.",
      );
      return;
    }

    try {
      await softDeleteMember({
        zoneId,
        userId: detail.user.id,
        farmMemberId: detail.id,
      });
      toast.success("Đã gỡ tài khoản khỏi hệ thống");
      setDeleteOpen(false);
      handleBack();
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message ?? "Không thể gỡ tài khoản này.",
        );
        return;
      }
      toast.error("Không thể gỡ tài khoản. Vui lòng thử lại.");
    }
  };

  return (
    <>
      <div
        className={`space-y-6 transition-all duration-300 ease-out ${
          show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleBack}
              disabled={updating || deleting}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <Badge className="mb-1">Chi tiết tài khoản</Badge>
              <h1 className="text-2xl font-bold">{detail.user.fullName}</h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              variant="outline"
              className="capitalize gap-1.5 px-3 py-1"
            >
              {RoleIcon}
              {detail.role}
            </Badge>
            <Badge
              variant={detail.user.isActive ? "default" : "destructive"}
              className="px-3 py-1"
            >
              {detail.user.isActive ? "Hoạt động" : "Ngưng hoạt động"}
            </Badge>
            {!editing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setEditing(true)}
                  disabled={isLoading || updating || deleting}
                >
                  <Pencil className="h-4 w-4" />
                  Chỉnh sửa
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setDeleteOpen(true)}
                  disabled={isLoading || updating || deleting}
                >
                  <Trash2 className="h-4 w-4" />
                  Gỡ tài khoản
                </Button>
              </>
            )}
          </div>
        </div>

        {isLoading ? (
          <DetailSkeleton />
        ) : editing ? (
          <Card>
            <CardHeader>
              <CardTitle>Chỉnh sửa thông tin</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(handleSaveEdit)}
                className="space-y-6"
              >
                <FieldGroup>
                  <Controller
                    name="email"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="edit-member-email">Email</FieldLabel>
                        <Input
                          {...field}
                          id="edit-member-email"
                          type="email"
                        />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="phone"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="edit-member-phone">
                          Số điện thoại
                        </FieldLabel>
                        <Input {...field} id="edit-member-phone" />
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />

                  <Controller
                    name="role"
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>Vai trò</FieldLabel>
                        <Select
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn vai trò" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((opt) => (
                              <SelectItem
                                key={opt.value}
                                value={opt.value}
                              >
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && (
                          <FieldError errors={[fieldState.error]} />
                        )}
                      </Field>
                    )}
                  />
                </FieldGroup>

                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      reset({
                        email: detail.user.email,
                        phone: detail.user.phone ?? "",
                        role: detail.role as "farmer" | "manager",
                      });
                      setEditing(false);
                    }}
                    disabled={updating}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={updating}>
                    {updating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Đang lưu...
                      </>
                    ) : (
                      "Lưu"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {RoleIcon}
                Thông tin tài khoản
              </CardTitle>
            </CardHeader>
            <Separator />
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <InfoCell
                  icon={<Mail className="h-3 w-3" />}
                  label="Email"
                  value={detail.user.email}
                />
                <InfoCell
                  icon={<Phone className="h-3 w-3" />}
                  label="Số điện thoại"
                  value={detail.user.phone ?? "—"}
                />
                <InfoCell
                  icon={<Shield className="h-3 w-3" />}
                  label="Vai trò"
                  value={
                    <Badge
                      variant="secondary"
                      className="capitalize"
                    >
                      {detail.role}
                    </Badge>
                  }
                />
                <InfoCell
                  icon={<Building2 className="h-3 w-3" />}
                  label="Nông trại"
                  value={
                    <span>
                      {detail.farm.name}{" "}
                      <span className="text-muted-foreground text-xs">
                        ({detail.farm.code})
                      </span>
                    </span>
                  }
                />
                <InfoCell
                  icon={<Calendar className="h-3 w-3" />}
                  label="Ngày gán"
                  value={formatDate(detail.assignedAt)}
                />
                <InfoCell
                  icon={<Calendar className="h-3 w-3" />}
                  label="Ngày tạo tài khoản"
                  value={formatDate(detail.user.createdAt)}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Dialog
        open={deleteOpen}
        onOpenChange={(o) => !deleting && setDeleteOpen(o)}
      >
        <DialogContent showCloseButton={!deleting}>
          <DialogHeader>
            <DialogTitle>Gỡ tài khoản?</DialogTitle>
            <DialogDescription>
              Tài khoản này sẽ bị vô hiệu hoá và không đăng nhập được nữa. Thao tác này
              dựa trên API xóa mềm theo khu vực của nông trại.
            </DialogDescription>
          </DialogHeader>
          {zonesQuery.isFetching && zones.length === 0 ? (
            <p className="text-sm text-muted-foreground">Đang kiểm tra khu vực…</p>
          ) : zones.length === 0 ? (
            <p className="text-sm text-destructive">
              Nông trại chưa có khu vực (zone). Hãy tạo một khu vực trước khi gỡ tài khoản.
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={
                deleting || zonesQuery.isFetching || zones.length === 0
              }
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Đang xử lý...
                </>
              ) : (
                "Gỡ tài khoản"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
