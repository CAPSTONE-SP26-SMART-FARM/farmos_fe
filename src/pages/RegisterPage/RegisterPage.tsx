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
import { TypeOfVerificationCode } from "@/constants/auth";
import { handleApiErrorUnprocessentity } from "@/lib/axios";
import {
	isApiErrorResponse,
	isApiErrorUnprocessableEntityResponse,
} from "@/lib/utils";
import { useRegister } from "@/queries";
import { useSendOtp } from "@/queries/useAuth";
import {
	RegisterBodySchema,
	type RegisterBodyType,
} from "@/schemaValidatation/auth";
import { zodResolver } from "@hookform/resolvers/zod";

import { Loader2 } from "lucide-react";

import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router";

import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

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
		},
	});

	const { isPending, mutateAsync: register } = useRegister();

	const { isPending: isCodePending, mutate: sendCode } = useSendOtp();

	const handleSubmit = async (data: RegisterBodyType) => {
		try {
			await register(data);
		} catch (error) {
			if (isApiErrorUnprocessableEntityResponse<RegisterBodyType>(error)) {
				handleApiErrorUnprocessentity<RegisterBodyType>(
					error.response!.data.errors,
					form.setError,
				);
			}
			// eslint-disable-next-line @typescript-eslint/no-unused-expressions
			isApiErrorResponse(error) &&
				toast.error(error.response?.data.message || "An error occurred");
		}
	};

	const handleSendCode = async () => {
		try {
			sendCode({
				email: form.getValues("email"),
				type: TypeOfVerificationCode.REGISTER,
			});
		} catch {
			// if(isApiErrorResponse(error) && error.response?.status === 400 && error.response.data.message === "") {
			// }
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-xl">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						FarmOS register
					</CardTitle>
					<CardDescription className="text-center">
						Create an account to get started.
					</CardDescription>
				</CardHeader>
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					<CardContent>
						<CardContent className="space-y-4 px-2">
							<FieldGroup>
								<div className="grid grid-cols-2 gap-3 space-y-1">
									<Controller
										name="email"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor="form-rhf-demo-title">
													Email
												</FieldLabel>
												<Input
													{...field}
													id="form-rhf-demo-title"
													aria-invalid={fieldState.invalid}
													placeholder="example@gmail.com"
													autoComplete="off"
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
												<FieldLabel htmlFor="form-rhf-demo-title">
													Fullname
												</FieldLabel>
												<Input
													{...field}
													id="form-rhf-demo-title"
													aria-invalid={fieldState.invalid}
													placeholder="Nguyễn Văn A"
													autoComplete="off"
												/>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<Controller
										name="phone"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor="form-rhf-demo-title">
													Phone
												</FieldLabel>
												<Input
													{...field}
													aria-invalid={fieldState.invalid}
													placeholder="0123456789"
													id="form-rhf-demo-title"
													autoComplete="off"
													value={field.value ?? ""}
												/>
												{fieldState.invalid && (
													<FieldError errors={[fieldState.error]} />
												)}
											</Field>
										)}
									/>
									<div className="p-0 m-0 flex gap-1.5 items-end">
										<Controller
											name="code"
											control={form.control}
											render={({ field, fieldState }) => (
												<Field data-invalid={fieldState.invalid}>
													<FieldLabel htmlFor="form-rhf-demo-description">
														Code
													</FieldLabel>
													<Input {...field} id="form-rhf-demo-description" />

													{fieldState.invalid && (
														<FieldError errors={[fieldState.error]} />
													)}
												</Field>
											)}
										/>
										<Button
											type="button"
											variant="outline"
											className=""
											onClick={handleSendCode}
											disabled={isCodePending}
										>
											Send
										</Button>
									</div>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<Controller
										name="password"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor="form-rhf-demo-description">
													Password
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

									<Controller
										name="confirmPassword"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field data-invalid={fieldState.invalid}>
												<FieldLabel htmlFor="form-rhf-demo-description">
													Confirm Password
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
								</div>
								<div className="grid grid-cols-2 gap-3">
									<Controller
										name="role"
										control={form.control}
										render={({ field, fieldState }) => (
											<Field
												data-invalid={fieldState.invalid}
												className="capitalize"
											>
												<FieldLabel htmlFor="form-rhf-select-language">
													Role
												</FieldLabel>
												<Select
													name={field.name}
													value={field.value}
													onValueChange={field.onChange}
												>
													<SelectTrigger
														id="form-rhf-select-language"
														aria-invalid={fieldState.invalid}
														className="capitalize"
													>
														<SelectValue
															placeholder="Select"
															className="capitalize"
														/>
													</SelectTrigger>
													<SelectContent
														position="item-aligned"
														className="capitalize"
													>
														{["doctor", "owner"].map((role) => (
															<SelectItem
																key={role}
																value={role}
																className="capitalize"
															>
																{role}
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
								</div>
							</FieldGroup>
						</CardContent>
						<CardFooter className="flex flex-col gap-4 mt-6 px-2">
							<Button type="submit" className="w-full" disabled={isPending}>
								{isPending ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Register...
									</>
								) : (
									"Register"
								)}
							</Button>
							<div className="text-sm text-center text-muted-foreground">
								Already have an account?{" "}
								<Link
									to="/login"
									className="text-primary underline-offset-4 hover:underline"
								>
									Login
								</Link>
							</div>
							<Link
								to="/forgot-password"
								className="text-sm text-center text-muted-foreground hover:underline"
							>
								Forgot your password?
							</Link>
						</CardFooter>
					</CardContent>
				</form>
			</Card>
		</div>
	);
}

export default RegisterPage;
