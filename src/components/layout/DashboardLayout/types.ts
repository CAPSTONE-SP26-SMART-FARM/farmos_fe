import type { LucideIcon } from "lucide-react";

export type UserRole = "Admin" | "Owner" | "Manager" | "Doctor";

export interface NavItem {
  title: string;
  url: string;
  icon: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];
}

export interface NavSubItem {
  title: string;
  url: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  requiresSubscription?: boolean;
}

export interface SidebarData {
  navAdmin: NavGroup[];
  navOwner: NavGroup[];
  navManager: NavGroup[];
  // Doctor and Farmer roles do not currently access the dashboard — keep the
  // key shapes open if we bring them back, but leave them empty for now.
  navDoctor?: NavGroup[];
  navFarmer?: NavGroup[];
}
