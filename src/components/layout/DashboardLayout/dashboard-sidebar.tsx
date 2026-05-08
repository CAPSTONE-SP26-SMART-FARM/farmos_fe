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
import { Link } from "react-router";
import { Sprout } from "lucide-react";
import type { NavGroup } from "./types";
import type { ComponentPropsWithoutRef } from "react";
import type { RoleNameType } from "@/constants/role";
import { useCurrentUser } from "@/queries";
import { useOwnerMySubscription } from "@/queries/useSubscription";

const STORAGE_KEY = "dashboard-item";
const DEFAULT_ITEM = "Dashboard";

// Dashboard currently only serves admin / owner / manager. Doctor and farmer
// roles are intentionally not mapped here — their sidebar data is commented
// out in `sidebarItemData.ts`. If they land on the dashboard, we fall back
// to an empty group list.
const getNavGroupsByRole = (role: RoleNameType): NavGroup[] => {
  const roleNavMap: Partial<Record<RoleNameType, NavGroup[]>> = {
    admin: sidebarData.navAdmin,
    owner: sidebarData.navOwner,
    manager: sidebarData.navManager,
  };

  return roleNavMap[role] ?? [];
};

type DashboardSidebarProps = ComponentPropsWithoutRef<typeof Sidebar>;

export function DashboardSidebar(props: DashboardSidebarProps) {
  const [clickedItem, setClickedItem] = useState(
    () => localStorage.getItem(STORAGE_KEY) || DEFAULT_ITEM,
  );
  useCurrentUser();
  const user = useAuthStore((state) => state.user);
  // TODO: Uncomment when theme-provider is set up
  // const { theme } = useTheme();

  const isOwner = user?.role === "owner";
  const mySubQuery = useOwnerMySubscription(isOwner);
  const hasActiveSubscription = mySubQuery.data?.data?.status === "ACTIVE";

  if (!user) {
    return null;
  }

  const allNavGroups = getNavGroupsByRole(user.role as RoleNameType);
  const navGroups: NavGroup[] = isOwner && !hasActiveSubscription
    ? allNavGroups.filter((g) => !g.requiresSubscription)
    : allNavGroups;

  return (
    <Sidebar
      collapsible="icon"
      {...props}
    >
      <SidebarHeader>
        <Link
          to="/"
          className="flex items-center gap-2 overflow-hidden font-bold text-xl"
          aria-label="FarmOS"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600">
            <Sprout className="h-5 w-5" />
          </span>
          <span className="truncate transition-opacity duration-200 group-data-[collapsible=icon]:opacity-0">
            FarmOS
          </span>
        </Link>
        {/* TODO: Add ThemeToggle when theme-provider is set up */}
      </SidebarHeader>
      <SidebarContent>
        <NavMain
          groups={navGroups}
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
