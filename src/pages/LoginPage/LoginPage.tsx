import { Link, useNavigate } from "react-router";
import { useLogin } from "@/queries/useAuth";
import { useAuthStore, type User } from "@/stores/authStore";
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
import { toast } from "sonner";

type SupportedRole = "Admin" | "Owner" | "Manager" | "Doctor";

type DummyAccount = {
	role: SupportedRole;
	username: string;
	password: string;
	fullName: string;
	email: string;
};

const DUMMY_ACCOUNTS: DummyAccount[] = [
	{
		role: "Admin",
		username: "admin1",
		password: "admin123",
		fullName: "System Admin",
		email: "admin@farmos.local",
	},
	{
		role: "Owner",
		username: "owner1",
		password: "owner123",
		fullName: "Farm Owner",
		email: "owner@farmos.local",
	},
	{
		role: "Manager",
		username: "manag1",
		password: "manager1",
		fullName: "Farm Manager",
		email: "manager@farmos.local",
	},
	{
		role: "Doctor",
		username: "doc001",
		password: "doctor1",
		fullName: "Agronomy Doctor",
		email: "doctor@farmos.local",
	},
];

function LoginPage() {
	const navigate = useNavigate();
	const loginStore = useAuthStore((state) => state.login);
	const form = useForm<LoginBodyType>({
		resolver: zodResolver(loginBodySchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	const { mutate: login, isPending } = useLogin();

	const loginWithDummyAccount = (account: DummyAccount) => {
		const user: User = {
			id: `demo-${account.role.toLowerCase()}`,
			email: account.email,
			role: account.role,
			fullName: account.fullName,
		};

		loginStore(user, {
			accessToken: `demo-access-token-${account.role.toLowerCase()}`,
			refreshToken: `demo-refresh-token-${account.role.toLowerCase()}`,
		});

		toast.success(`Signed in as ${account.role} (dummy account)`);
		navigate(`/dashboard/${account.role.toLowerCase()}`, { replace: true });
	};

	const handleSubmit = (data: LoginBodyType) => {
		const matchedDummyAccount = DUMMY_ACCOUNTS.find(
			(account) =>
				account.username === data.username && account.password === data.password,
		);

		if (matchedDummyAccount) {
			loginWithDummyAccount(matchedDummyAccount);
			return;
		}

		login({ ...data });
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-xl">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						FarmOS Login
					</CardTitle>
					<CardDescription className="text-center">
						Sign in to access role-based dashboards for Admin, Owner, Manager, and Doctor.
					</CardDescription>
				</CardHeader>
				<form onSubmit={form.handleSubmit(handleSubmit)}>
					<CardContent className="space-y-3">
						<FieldGroup>
							<Controller
								name="username"
								control={form.control}
								render={({ field, fieldState }) => (
									<Field data-invalid={fieldState.invalid}>
										<FieldLabel htmlFor="form-rhf-demo-title">
											Username
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
						</FieldGroup>

						<div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
							<p className="font-medium mb-2">
								Dummy accounts for previewing role dashboards:
							</p>
							<div className="space-y-1">
								{DUMMY_ACCOUNTS.map((account) => (
									<p key={account.role}>
										{account.role}: <span className="font-medium">{account.username}</span> /{" "}
										<span className="font-medium">{account.password}</span>
									</p>
								))}
							</div>
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
