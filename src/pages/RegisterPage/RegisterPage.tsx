import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

function RegisterPage() {
	const [selectRole, setSelectRole] = useState<"doctor" | "owner" | "">("");
	const [active, setActive] = useState(0);
	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<Card className="w-full max-w-md">
				<CardHeader className="space-y-1">
					<CardTitle className="text-2xl font-bold text-center">
						FarmOS register
					</CardTitle>
					<CardDescription className="text-center">
						Choose your role and create an account to get started.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="relative min-h-37.5">
						<div
							className={`transition-all duration-500 ${
								active === 0
									? "opacity-100 scale-100 relativ pointer-events-auto"
									: "opacity-0 scale-95 absolute inset-0 pointer-events-none"
							}`}
						>
							<Select
								onValueChange={(value: "doctor" | "owner") => {
									setSelectRole(value);
									setActive(1);
								}}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select your role" />
								</SelectTrigger>

								<SelectContent>
									<SelectGroup>
										<SelectItem value="doctor">Doctor</SelectItem>
										<SelectItem value="owner">Owner</SelectItem>
									</SelectGroup>
								</SelectContent>
							</Select>
						</div>
						<div
							className={`transition-all duration-500 ${
								active === 1
									? "opacity-100 scale-100 relative  pointer-events-auto"
									: "opacity-0 scale-95 absolute inset-0 pointer-events-none"
							}`}
						>
							<div className="space-y-4">
								<p className="text-sm text-muted-foreground">
									<Button variant="ghost" onClick={() => setActive(0)}>
										Back
									</Button>
									<span>Register as {selectRole}</span>
								</p>

								<Input placeholder="Email" />
								<Input placeholder="Password" type="password" />
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

export default RegisterPage;
