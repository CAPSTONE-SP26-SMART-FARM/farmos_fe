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
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { getRoleLabelVi } from "@/constants/role";
import { useOwnerCreateFarmMember } from "@/queries/useOwner";
import {
  CreateFarmMemberBodySchema,
  type CreateFarmMemberBodyType,
} from "@/schemaValidatation/farmMember";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  farmCode: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS = [
  { value: "manager", label: "Quản lý" },
  { value: "farmer", label: "Nông dân" },
] as const;

const AddMemberDialog = ({ farmCode, open, onOpenChange }: Props) => {
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );

  const form = useForm<CreateFarmMemberBodyType>({
    resolver: zodResolver(CreateFarmMemberBodySchema),
    defaultValues: {
      farmCode,
      fullName: "",
      email: "",
      phone: "",
      role: "farmer",
    },
  });

  useClearServerFieldErrors(form);

  const { mutateAsync, isPending } = useOwnerCreateFarmMember();

  useEffect(() => {
    if (!open) {
      form.reset({ farmCode, fullName: "", email: "", phone: "", role: "farmer" });
      setGeneratedPassword(null);
    }
  }, [open, farmCode, form]);

  const handleClose = () => onOpenChange(false);

  const handleSubmit = async (data: CreateFarmMemberBodyType) => {
    try {
      const res = await mutateAsync(data);
      setGeneratedPassword(res.data.generatedPassword);
      toast.success("Đã thêm tài khoản thành công");
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      if (isApiErrorResponse(error)) {
        toast.error(error.response?.data.message ?? "Không thể thêm tài khoản");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {generatedPassword ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-green-600">
                Tạo tài khoản thành công
              </DialogTitle>
              <DialogDescription>
                Hãy gửi thông tin đăng nhập này cho người dùng.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-md border bg-muted/50 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Họ tên</p>
                  <p className="text-sm font-medium">
                    {form.getValues("fullName")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Email</p>
                  <p className="font-mono text-sm font-medium">
                    {form.getValues("email")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Mật khẩu được tạo
                  </p>
                  <p className="font-mono text-sm font-medium">
                    {generatedPassword}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Vai trò</p>
                  <Badge variant="secondary">
                    {getRoleLabelVi(form.getValues("role"))}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Vui lòng lưu lại mật khẩu này. Mật khẩu sẽ không hiển thị lại.
              </p>
            </div>

            <DialogFooter>
              <Button onClick={handleClose} className="w-full sm:w-auto">
                Đóng
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Thêm tài khoản</DialogTitle>
              <DialogDescription>
                Tạo tài khoản và gán vào nông trại của bạn. Mật khẩu sẽ được tạo
                tự động.
              </DialogDescription>
            </DialogHeader>

            <form
              id="add-member-form"
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              <FieldGroup>
                <Controller
                  name="fullName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="member-fullname">Họ tên</FieldLabel>
                      <Input
                        {...field}
                        id="member-fullname"
                        placeholder="Ví dụ: Nguyễn Văn An"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="member-email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="member-email"
                        type="email"
                        placeholder="taikhoan@example.com"
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
                      <FieldLabel htmlFor="member-phone">
                        Số điện thoại
                      </FieldLabel>
                      <Input
                        {...field}
                        id="member-phone"
                        placeholder="+84 900 000 000"
                      />
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
                        value={field.value}
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
            </form>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isPending}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                form="add-member-form"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Đang tạo...
                  </>
                ) : (
                  "Thêm tài khoản"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddMemberDialog;
