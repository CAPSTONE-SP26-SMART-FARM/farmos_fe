import { useState } from "react";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router";
import type { UserRole } from "./types";
import type { UserResType } from "@/types/user";

interface UserDropDownProps {
	role?: UserRole;
}

const ROLE_DASHBOARD_ROUTES: Record<UserRole, string> = {
	Admin: "/dashboard/admin",
	Owner: "/dashboard/owner",
	Manager: "/dashboard/manager",
	Doctor: "/dashboard/doctor",
};

export function UserDropDown({ role }: UserDropDownProps) {
	if (!role) return null;

	const dashboardRoute = ROLE_DASHBOARD_ROUTES[role];
	if (dashboardRoute) {
		return (
			<Link to={dashboardRoute}>
				<DropdownMenuItem>
					<LayoutDashboard className="mr-2 h-4 w-4" />
					<span>Dashboard</span>
				</DropdownMenuItem>
			</Link>
		);
	}

	return null;
}

interface NavbarUserProps {
	user: UserResType;
	onSignOut: () => void;
}

export function NavbarUser({ user, onSignOut }: NavbarUserProps) {
	const [isOpen, setIsOpen] = useState(false);

	const avatarFallback = user?.fullName?.charAt(0) || "U";

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="relative h-8 w-8 rounded-full">
					<Avatar className="h-8 w-8">
						<AvatarImage src={String(user?.avatarUrl)} alt={user?.fullName} />
						<AvatarFallback>{avatarFallback}</AvatarFallback>
					</Avatar>
					<ChevronDown className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-background" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" forceMount>
				<DropdownMenuLabel className="font-normal">
					<div className="flex flex-col space-y-1">
						<p className="text-sm font-medium leading-none">{user?.fullName}</p>
						<p className="text-xs leading-none text-muted-foreground">
							{user?.email}
						</p>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<UserDropDown role={user?.role as UserRole} />
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={onSignOut}>
					<LogOut className="mr-2 h-4 w-4" />
					<span>Log out</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
