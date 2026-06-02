import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { OtpInput } from "@/components/common/OtpInput";
import { TypeOfVerificationCode } from "@/constants/auth";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import { useClearServerFieldErrors } from "@/hooks/useClearServerFieldErrors";
import { useOtpFlow } from "@/hooks/useOtpFlow";
import {
  isApiErrorResponse,
  isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { useRegister } from "@/queries";
import {
  RegisterBodySchema,
  type RegisterBodyType,
} from "@/schemaValidatation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Clock, Loader2, MailCheck, ShieldCheck } from "lucide-react";

import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router";
import { toast } from "sonner";

const formatClock = (seconds: number) => {
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

function RegisterPage() {
  const form = useForm<RegisterBodyType>({
    resolver: zodResolver(RegisterBodySchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
      confirmPassword: "",
      phone: "",
      code: "",
      role: "owner",
    },
  });

  useClearServerFieldErrors(form);

  const { isPending, mutateAsync: register } = useRegister();
  const { sentEmail, hasSent, isExpired, resend, validity, send, isSending } =
    useOtpFlow(TypeOfVerificationCode.REGISTER);

  const emailValue = form.watch("email");
  const emailChangedAfterSend =
    hasSent && sentEmail !== null && emailValue !== sentEmail;

  const handleSendCode = async () => {
    const emailValid = await form.trigger("email");
    if (!emailValid) {
      toast.error("Mời nhập email hợp lệ trước khi gửi mã");
      return;
    }
    form.clearErrors(["code", "email"]);
    form.setValue("code", "");
    try {
      await send(form.getValues("email"));
      toast.success("Đã gửi mã OTP đến email của bạn");
    } catch (error) {
      if (isApiErrorResponse(error)) {
        toast.error(
          error.response?.data.message || "Gửi mã thất bại, mời thử lại",
        );
      }
    }
  };

  const handleSubmit = async (data: RegisterBodyType) => {
    if (!hasSent) {
      form.setError("code", {
        type: "manual",
        message: "Mời bấm \"Gửi mã\" để nhận OTP qua email",
      });
      return;
    }
    if (emailChangedAfterSend) {
      form.setError("code", {
        type: "manual",
        message: "Email đã thay đổi, mời gửi lại mã cho email mới",
      });
      return;
    }
    if (isExpired) {
      form.setError("code", {
        type: "manual",
        message: "Mã OTP đã hết hạn, mời bấm \"Gửi lại\"",
      });
      return;
    }

    try {
      await register(data);
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse<RegisterBodyType>(error)) {
        handleApiErrorUnprocessentity<RegisterBodyType>(
          error.response!.data.errors,
          form.setError,
          { getValues: form.getValues },
        );
        return;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-expressions
      isApiErrorResponse(error) &&
        toast.error(error.response?.data.message || "Có lỗi xảy ra");
    }
  };

  const resendDisabled = isSending || resend.isCountingDown;
  const resendLabel = isSending
    ? "Đang gửi..."
    : resend.isCountingDown
      ? `Gửi lại sau ${resend.seconds}s`
      : hasSent
        ? "Gửi lại"
        : "Gửi mã";

  const otpHelperText = (() => {
    if (emailChangedAfterSend)
      return `Email đã đổi. Mã trước đó gửi cho ${sentEmail}`;
    if (hasSent) return `Mã đã gửi đến ${sentEmail}`;
    if (emailValue) return `Mã 6 chữ số sẽ được gửi đến ${emailValue}`;
    return "Nhập email phía trên, sau đó bấm \"Gửi mã\"";
  })();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Đăng ký FarmOS
          </CardTitle>
          <CardDescription className="text-center">
            Tạo tài khoản để bắt đầu.
          </CardDescription>
        </CardHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="space-y-6 px-6">
            <FieldGroup>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="register-email">Email</FieldLabel>
                      <Input
                        {...field}
                        id="register-email"
                        aria-invalid={fieldState.invalid}
                        placeholder="vd: ten@example.com"
                        autoComplete="email"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="fullName"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="register-fullname">
                        Họ và tên
                      </FieldLabel>
                      <Input
                        {...field}
                        id="register-fullname"
                        aria-invalid={fieldState.invalid}
                        placeholder="Nguyễn Văn A"
                        autoComplete="name"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>

              <Controller
                name="phone"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-phone">
                      Số điện thoại
                    </FieldLabel>
                    <Input
                      {...field}
                      id="register-phone"
                      aria-invalid={fieldState.invalid}
                      placeholder="vd: 0123456789"
                      autoComplete="tel"
                      value={field.value ?? ""}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="register-password">
                        Mật khẩu
                      </FieldLabel>
                      <Input
                        {...field}
                        id="register-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Ít nhất 6 ký tự"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="register-confirm-password">
                        Xác nhận mật khẩu
                      </FieldLabel>
                      <Input
                        {...field}
                        id="register-confirm-password"
                        type="password"
                        autoComplete="new-password"
                        placeholder="Nhập lại mật khẩu"
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </div>
            </FieldGroup>

            <Controller
              name="code"
              control={form.control}
              render={({ field, fieldState }) => (
                <div
                  className="rounded-lg border bg-muted/30 p-4 space-y-3"
                  data-invalid={fieldState.invalid}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm">
                          Xác minh email
                        </div>
                        <p
                          className={
                            emailChangedAfterSend
                              ? "text-xs text-amber-600 dark:text-amber-500 mt-0.5 truncate"
                              : "text-xs text-muted-foreground mt-0.5 truncate"
                          }
                          title={otpHelperText}
                        >
                          {otpHelperText}
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSendCode}
                      disabled={resendDisabled}
                      aria-label="Gửi mã OTP đến email"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <MailCheck className="h-4 w-4" />
                      )}
                      {resendLabel}
                    </Button>
                  </div>

                  <div className="flex justify-center sm:justify-start">
                    <OtpInput
                      value={field.value ?? ""}
                      onChange={(v) => {
                        field.onChange(v);
                        if (fieldState.error) form.clearErrors("code");
                      }}
                      invalid={fieldState.invalid || isExpired}
                      disabled={isPending}
                    />
                  </div>

                  {hasSent && !emailChangedAfterSend && (
                    <div
                      className={
                        isExpired
                          ? "flex items-center gap-1.5 text-xs text-destructive"
                          : "flex items-center gap-1.5 text-xs text-muted-foreground"
                      }
                      aria-live="polite"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {isExpired
                        ? "Mã đã hết hạn, mời bấm \"Gửi lại\" để nhận mã mới"
                        : `Mã có hiệu lực trong ${formatClock(validity.seconds)}`}
                    </div>
                  )}

                  {emailChangedAfterSend && (
                    <div
                      className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-500"
                      aria-live="polite"
                    >
                      <AlertCircle className="h-3.5 w-3.5" />
                      Email đã thay đổi, mời bấm "Gửi lại" để nhận mã cho email mới.
                    </div>
                  )}

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </div>
              )}
            />
          </CardContent>

          <CardFooter className="flex flex-col gap-3 mt-6 px-6">
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang đăng ký...
                </>
              ) : (
                "Đăng ký"
              )}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              Đã có tài khoản?{" "}
              <Link
                to="/login"
                className="text-primary underline-offset-4 hover:underline"
              >
                Đăng nhập
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

export default RegisterPage;
