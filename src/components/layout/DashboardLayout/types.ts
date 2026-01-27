import type { LucideIcon } from "lucide-react";

export type UserRole = "Owner" | "Manager" | "Farmer" | "Rancher" | "Doctor";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
}

export interface SidebarData {
  navOwner: NavItem[];
  navManager: NavItem[];
  navFarmer: NavItem[];
  navRancher: NavItem[];
  navDoctor: NavItem[];
}
