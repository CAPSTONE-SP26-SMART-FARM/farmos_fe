import { Link, useNavigate } from "react-router";
import { useLogin } from "@/queries/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { LoginBodySchema, type LoginBodyType } from "@/schemaValidatation/auth";
import { toast } from "sonner";
import { RoleLabelVi, type RoleNameType } from "@/constants/role";
import {
  decodeAccessToken,
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";

const getRoleLabel = (role: RoleNameType) => RoleLabelVi[role] ?? role;

function LoginPage() {
  const navigate = useNavigate();
  const form = useForm<LoginBodyType>({
    resolver: zodResolver(LoginBodySchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });
  useClearServerFieldErrors(form);
  const { mutateAsync: login, isPending } = useLogin();

  const handleSubmit = async (data: LoginBodyType) => {
    try {
      const result = await login({ ...data });
      const role = decodeAccessToken(result.data.accessToken)?.role;
      navigate(`/dashboard/${role}`, { replace: true });
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<LoginBodyType>(error)) {
        handleApiErrorUnprocessentity<LoginBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }

      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message || "Đăng nhập không thành công",
        );
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Đăng nhập FarmOS
          </CardTitle>
          <CardDescription className="text-center">
            Đăng nhập để truy cập bảng điều khiển theo vai trò cho quản trị
            viên, chủ trang trại, quản lý và bác sĩ.
          </CardDescription>
        </CardHeader>
        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-3">
            <FieldGroup>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-title">Email</FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-title"
                      aria-invalid={fieldState.invalid}
                      placeholder="email@example.com"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="form-rhf-demo-description">
                      Mật khẩu
                    </FieldLabel>
                    <Input
                      {...field}
                      id="form-rhf-demo-description"
                      type={"password"}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col gap-4 mt-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng nhập...
                </>
              ) : (
                "Đăng nhập"
              )}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Chưa có tài khoản?{" "}
              <Link
                to="/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                Đăng ký
              </Link>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-center text-muted-foreground hover:underline"
            >
              Quên mật khẩu?
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default LoginPage;
