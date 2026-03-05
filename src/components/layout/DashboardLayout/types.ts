import type { LucideIcon } from "lucide-react";

export type UserRole = "Admin" | "Owner" | "Manager" | "Doctor";

export interface NavItem {
	title: string;
	url: string;
	icon: LucideIcon;
	isActive?: boolean;
}

export interface SidebarData {
	navAdmin: NavItem[];
	navOwner: NavItem[];
	navManager: NavItem[];
	navDoctor: NavItem[];
	navFarmer: NavItem[];
	navRancher: NavItem[];
}
