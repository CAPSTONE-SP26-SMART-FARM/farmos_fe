import { useState } from "react";

import { NavMain } from "./nav-main";
import { NavUser } from "./nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
// import Logo from "@/components/Logo";
// import { ThemeToggle } from "@/components/ui/theme-toggle";
// import { useTheme } from "@/components/theme-provider";
import { sidebarData } from "./sidebarItemData";
import { useAuthStore } from "@/stores/authStore";
import { Link } from "react-router-dom";
import type { NavItem, UserRole } from "./types";
import type { ComponentPropsWithoutRef } from "react";

const STORAGE_KEY = "dashboard-item";
const DEFAULT_ITEM = "Dashboard";

const getNavItemsByRole = (role: UserRole): NavItem[] => {
  const roleNavMap: Record<UserRole, NavItem[]> = {
    Admin: sidebarData.navAdmin,
    Owner: sidebarData.navOwner,
    Manager: sidebarData.navManager,
    Doctor: sidebarData.navDoctor,
  };

  return roleNavMap[role] || sidebarData.navOwner;
};

type DashboardSidebarProps = ComponentPropsWithoutRef<typeof Sidebar>;

export function DashboardSidebar(props: DashboardSidebarProps) {
  const [clickedItem, setClickedItem] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_ITEM,
  );
  const user = useAuthStore((state) => state.user);
  // TODO: Uncomment when theme-provider is set up
  // const { theme } = useTheme();

  if (!user) {
    return null;
  }

  const navItems = getNavItemsByRole(user.role as UserRole);

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <div className="flex justify-between items-center">
          <Link
            to="/"
            className="font-bold text-xl"
          >
            FarmOS
          </Link>
          {/* TODO: Add ThemeToggle when theme-provider is set up */}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          items={navItems}
          clickedItem={clickedItem}
          setClickedItem={setClickedItem}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
