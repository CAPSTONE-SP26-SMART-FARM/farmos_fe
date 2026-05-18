import { ChevronRight } from "lucide-react";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link, useLocation } from "react-router";
import type { NavGroup, NavItem, NavSubItem } from "./types";

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

  // Flatten both top-level items AND any nested sub-items so the active-URL
  // match picks the single best match (longest prefix wins) regardless of
  // nesting depth.
  const allUrls = groups.flatMap((group) =>
    group.items.flatMap((item) =>
      item.items && item.items.length > 0
        ? item.items.map((sub) => sub.url)
        : [item.url],
    ),
  );

  const activeItemUrl = allUrls.reduce((current, url) => {
    const isRootPath = /^\/dashboard\/\w+$/.test(url);
    const matches = isRootPath
      ? location.pathname === url
      : location.pathname.startsWith(url);

    if (!matches) {
      return current;
    }

    return url.length > current.length ? url : current;
  }, "");

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label}>
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.items.map((item) =>
              item.items && item.items.length > 0 ? (
                <CollapsibleNavItem
                  key={item.title}
                  item={item}
                  activeItemUrl={activeItemUrl}
                  onItemClick={handleItemClick}
                />
              ) : (
                <LeafNavItem
                  key={item.title}
                  item={item}
                  isActive={activeItemUrl === item.url}
                  onItemClick={handleItemClick}
                />
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </>
  );
}

interface LeafNavItemProps {
  item: NavItem;
  isActive: boolean;
  onItemClick: (title: string) => void;
}

function LeafNavItem({ item, isActive, onItemClick }: LeafNavItemProps) {
  const Icon = item.icon;

  return (
    <Link
      to={item.url}
      className="block"
      onClick={() => onItemClick(item.title)}
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
}

interface CollapsibleNavItemProps {
  item: NavItem;
  activeItemUrl: string;
  onItemClick: (title: string) => void;
}

function CollapsibleNavItem({
  item,
  activeItemUrl,
  onItemClick,
}: CollapsibleNavItemProps) {
  const Icon = item.icon;
  const subItems = item.items ?? [];
  const hasActiveChild = subItems.some((sub) => sub.url === activeItemUrl);

  return (
    <Collapsible defaultOpen={hasActiveChild} className="group/collapsible">
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          <SidebarMenuButton
            tooltip={item.title}
            className={
              hasActiveChild
                ? "font-medium text-sidebar-accent-foreground"
                : ""
            }
          >
            <Icon />
            <span>{item.title}</span>
            <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {subItems.map((sub) => (
              <SubNavItem
                key={sub.url}
                sub={sub}
                isActive={activeItemUrl === sub.url}
                onItemClick={onItemClick}
              />
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  );
}

interface SubNavItemProps {
  sub: NavSubItem;
  isActive: boolean;
  onItemClick: (title: string) => void;
}

function SubNavItem({ sub, isActive, onItemClick }: SubNavItemProps) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        asChild
        isActive={isActive}
        className={
          isActive
            ? "bg-primary font-medium text-primary-foreground hover:bg-primary hover:text-primary-foreground data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
            : ""
        }
      >
        <Link to={sub.url} onClick={() => onItemClick(sub.title)}>
          <span>{sub.title}</span>
        </Link>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  );
}
