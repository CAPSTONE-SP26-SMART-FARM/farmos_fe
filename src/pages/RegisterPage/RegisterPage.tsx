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
import { useRegister } from "@/queries";
import {
	RegisterBodySchema,
	type RegisterBodyType,
} from "@/schemaValidatation/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { Controller, useForm } from "react-hook-form";
import { Link } from "react-router-dom";

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
	const { isPending, mutate: register } = useRegister();

	const handleSubmit = (data: RegisterBodyType) => {
		console.log("Register data:", data);
		register(data);
	};
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
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
						<CardContent className="space-y-3">
							<FieldGroup>
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
												placeholder="hoangday185"
												autoComplete="off"
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
											<FieldLabel htmlFor="form-rhf-demo-title">
												Email
											</FieldLabel>
											<Input
												{...field}
												id="form-rhf-demo-title"
												aria-invalid={fieldState.invalid}
												placeholder="hoangday185"
												autoComplete="off"
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
											<FieldLabel htmlFor="form-rhf-demo-title">
												Email
											</FieldLabel>
											<Input
												{...field}
												id="form-rhf-demo-title"
												aria-invalid={fieldState.invalid}
												placeholder="hoangday185"
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
							</FieldGroup>

							{/* <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
							<p className="font-medium mb-2">
								Dummy accounts for previewing role dashboards:
							</p>
							<div className="space-y-1">
								{DUMMY_ACCOUNTS.map((account) => (
									<p key={account.role}>
										{account.role}:{" "}
										<span className="font-medium">{account.username}</span> /{" "}
										<span className="font-medium">{account.password}</span>
									</p>
								))}
							</div>
						</div> */}
						</CardContent>
						<CardFooter className="flex flex-col gap-4">
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
