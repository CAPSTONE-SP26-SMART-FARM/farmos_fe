import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useOwnerCreateFarmMember } from "@/queries/useOwner";
import {
  CreateFarmMemberBodySchema,
  type CreateFarmMemberBodyType,
} from "@/schemaValidatation/farmMember";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

interface Props {
  farmCode: string;
  onBack: () => void;
}

const ROLE_OPTIONS = [
  { value: "manager", label: "Quản lý" },
  { value: "farmer", label: "Nông dân" },
] as const;

const AddMemberPanel = ({ farmCode, onBack }: Props) => {
  const [show, setShow] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null,
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const form = useForm<CreateFarmMemberBodyType>({
    resolver: zodResolver(CreateFarmMemberBodySchema),
    defaultValues: {
      farmCode,
      email: "",
      phone: "",
      role: "farmer",
    },
  });

  useClearServerFieldErrors(form);

  const { mutateAsync, isPending } = useOwnerCreateFarmMember();

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

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
    <div
      className={`transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div className="space-y-6">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            disabled={isPending}
            className="mb-2 -ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại danh sách tài khoản
          </Button>
          <Badge className="mb-2 block w-fit">Cổng chủ trang trại</Badge>
          <h1 className="text-2xl font-bold">Thêm tài khoản</h1>
          <p className="text-muted-foreground">
            Tạo tài khoản và gán vào nông trại của bạn.
          </p>
        </div>

        {generatedPassword ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">
                Tạo tài khoản thành công
              </CardTitle>
              <CardDescription>
                Hãy gửi thông tin đăng nhập này cho người dùng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-muted/50 p-4 space-y-3">
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
                  <Badge
                    variant="secondary"
                    className="capitalize"
                  >
                    {form.getValues("role")}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Vui lòng lưu lại mật khẩu này. Mật khẩu sẽ không hiển thị lại.
              </p>
              <Button
                onClick={handleBack}
                className="w-full"
              >
                Quay lại danh sách tài khoản
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
              <CardDescription>
                Nhập thông tin cho tài khoản mới. Mật khẩu sẽ được tạo tự động.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <FieldGroup>
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

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isPending}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
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
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AddMemberPanel;
