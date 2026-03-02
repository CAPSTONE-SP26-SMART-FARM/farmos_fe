import { Link } from "react-router";
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
import { loginBodySchema, type LoginBodyType } from "@/types/auth";

function LoginPage() {
	const form = useForm<LoginBodyType>({
		resolver: zodResolver(loginBodySchema),
		defaultValues: {
			email: "",
			password: "",
		},
	});

	const { mutate: login, isPending } = useLogin();

	const handleSubmit = (data: LoginBodyType) => {
		login({ ...data });
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						FarmOS Login
					</CardTitle>
					<CardDescription className="text-center">
						Enter your credentials to access your dashboard
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
						</FieldGroup>

						{/* Test credentials hint */}
						<div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
							<p className="font-medium mb-1">Test Credentials (DummyJSON):</p>
							<p>Username: emilys</p>
							<p>Password: emilyspass</p>
						</div>
					</CardContent>
					<CardFooter className="flex flex-col gap-4">
						<Button type="submit" className="w-full" disabled={isPending}>
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Signing in...
								</>
							) : (
								"Sign In"
							)}
						</Button>
						<div className="text-sm text-center text-muted-foreground">
							Don't have an account?{" "}
							<Link
								to="/register"
								className="text-primary underline-offset-4 hover:underline"
							>
								Register
							</Link>
						</div>
						<Link
							to="/forgot-password"
							className="text-sm text-center text-muted-foreground hover:underline"
						>
							Forgot your password?
						</Link>
					</CardFooter>
				</form>
			</Card>
		</div>
	);
}

export default LoginPage;
