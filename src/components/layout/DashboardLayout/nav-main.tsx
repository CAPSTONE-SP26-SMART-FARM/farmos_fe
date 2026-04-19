import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router";
import type { NavItem } from "./types";

interface NavMainProps {
  items: NavItem[];
  clickedItem?: string;
  setClickedItem: (item: string) => void;
}

const STORAGE_KEY = "dashboard-item";

export function NavMain({ items, setClickedItem }: NavMainProps) {
  const location = useLocation();

  const handleItemClick = (title: string) => {
    setClickedItem(title);
    localStorage.setItem(STORAGE_KEY, title);
  };

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => {
          // Exact match for role root paths (e.g. /dashboard/manager)
          // startsWith match for nested pages (e.g. /dashboard/manager/crop-seasons/:id/milestones)
          const isRootPath = /^\/dashboard\/\w+$/.test(item.url);
          const isActive = isRootPath
            ? location.pathname === item.url
            : location.pathname.startsWith(item.url);
          const Icon = item.icon;

          return (
            <Link
              key={item.title}
              to={item.url}
              className="block"
              onClick={() => handleItemClick(item.title)}
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={item.title}
                  className={
                    isActive
                      ? "bg-primary font-medium text-primary-foreground hover:bg-primary hover:text-primary-foreground"
                      : ""
                  }
                >
                  <Icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </Link>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
