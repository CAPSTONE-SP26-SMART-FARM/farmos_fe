import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router";
import type { NavGroup } from "./types";

interface NavMainProps {
  groups: NavGroup[];
  clickedItem?: string;
  setClickedItem: (item: string) => void;
}

const STORAGE_KEY = "dashboard-item";

export function NavMain({ groups, setClickedItem }: NavMainProps) {
  const location = useLocation();

  const handleItemClick = (title: string) => {
    setClickedItem(title);
    localStorage.setItem(STORAGE_KEY, title);
  };

  // Flatten items across all groups so the active-URL match picks the
  // single best match (longest prefix wins) regardless of grouping.
  const activeItemUrl = groups
    .flatMap((group) => group.items)
    .reduce((current, item) => {
      const isRootPath = /^\/dashboard\/\w+$/.test(item.url);
      const matches = isRootPath
        ? location.pathname === item.url
        : location.pathname.startsWith(item.url);

      if (!matches) {
        return current;
      }

      return item.url.length > current.length ? item.url : current;
    }, "");

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) => {
              const isActive = activeItemUrl === item.url;
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
      ))}
    </>
  );
}
