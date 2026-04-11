import { Link } from "react-router";
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
import {
	ForgotPasswordBodySchema,
	type ForgotPasswordBodyType,
} from "@/schemaValidatation/auth";
import { useForgotPassword } from "@/queries/useAuth";

function ForgotPasswordPage() {
	const form = useForm<ForgotPasswordBodyType>({
		resolver: zodResolver(ForgotPasswordBodySchema),
		defaultValues: {
			email: "",
		},
	});

	const { mutate: forgotPassword, isPending } = useForgotPassword();

	const handleSubmit = (data: ForgotPasswordBodyType) => {
		forgotPassword({ ...data });
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						Quên mật khẩu FarmOS
					</CardTitle>
					<CardDescription className="text-center">
						Nhập email để nhận liên kết đặt lại mật khẩu
					</CardDescription>
				</CardHeader>
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					<CardContent className="space-y-3">
						<FieldGroup className="mb-4">
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
											placeholder="abc@gmail.com"
											autoComplete="off"
										/>
										{fieldState.invalid && (
											<FieldError errors={[fieldState.error]} />
										)}
									</Field>
								)}
							/>
						</FieldGroup>
					</CardContent>
					<CardFooter className="flex flex-col gap-4">
						<Button type="submit" className="w-full" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Đang gửi...
								</>
							) : (
								"Gửi liên kết đặt lại"
							)}
						</Button>
						<div className="text-sm text-center text-muted-foreground">
							Chưa có tài khoản?{" "}
							<Link
								to="/register"
								className="text-primary underline-offset-4 hover:underline"
							>
								Đăng ký tại đây
							</Link>
						</div>
						<div className="text-sm text-center text-muted-foreground">
							Đã có tài khoản?{" "}
							<Link
								to="/login"
								className="text-sm text-center text-primary hover:underline"
							>
								Đăng nhập tại đây
							</Link>
						</div>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}

export default ForgotPasswordPage;
