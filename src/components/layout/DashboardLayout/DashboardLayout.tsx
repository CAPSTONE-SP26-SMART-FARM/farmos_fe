import { DashboardSidebar } from "./dashboard-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Outlet, useLocation } from "react-router";
import { useMemo } from "react";
import { useSocketInit } from "@/hooks/useSocket";
import { useSocketAuthSync } from "@/hooks/useSocketAuthSync";
import { useRealtimeEvents } from "@/hooks/useRealtimeEvents";
import NotificationBell from "@/components/notifications/NotificationBell";
import { sidebarData } from "./sidebarItemData";
import { useBreadcrumbStore } from "@/stores/breadcrumbStore";
import routes from "@/routes/routes";

const UUID_RE =
  /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i;
const NUMERIC_ID_RE = /^\d{4,}$/;

function isIdLike(segment: string): boolean {
  return UUID_RE.test(segment) || NUMERIC_ID_RE.test(segment);
}

/**
 * Static Vietnamese labels for generic path segments (roles, dashboard root)
 */
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Bảng Điều Khiển",
  admin: "Quản Trị",
  owner: "Chủ Trang Trại",
  manager: "Quản Lý",
  doctor: "Bác Sĩ",
  farmer: "Nông Dân",
};

/**
 * Build a map from sidebar URLs to their Vietnamese titles.
 * Flattens groups → items across every role so feature-level paths
 * (e.g. /dashboard/owner/iot-devices → "Thiết Bị IoT") resolve correctly.
 */
function buildSidebarUrlMap(): Record<string, string> {
  const map: Record<string, string> = {};
  const allRoleGroups = [
    sidebarData.navAdmin,
    sidebarData.navOwner,
    sidebarData.navManager,
    sidebarData.navDoctor ?? [],
    sidebarData.navFarmer ?? [],
  ];
  for (const groups of allRoleGroups) {
    for (const group of groups) {
      for (const item of group.items) {
        map[item.url] = item.title;
      }
    }
  }
  return map;
}

const sidebarUrlMap = buildSidebarUrlMap();

/**
 * Lazily collect concrete route patterns (excluding wildcard catch-alls) so we
 * can decide whether a breadcrumb segment corresponds to a real, navigable
 * route. Computed lazily because `routes.ts` imports this layout — accessing
 * the import at module-init time would observe an undefined default.
 */
let routePatternsCache: string[] | null = null;
function getRoutePatterns(): string[] {
  if (routePatternsCache) return routePatternsCache;
  const patterns: string[] = [];
  for (const cfg of routes) {
    for (const child of cfg.children) {
      if (child.path === "*" || child.path.endsWith("/*")) continue;
      patterns.push(child.path);
    }
  }
  routePatternsCache = patterns;
  return patterns;
}

function pathMatchesPattern(pathname: string, pattern: string): boolean {
  const patternSegs = pattern.split("/").filter(Boolean);
  const pathSegs = pathname.split("/").filter(Boolean);
  if (patternSegs.length !== pathSegs.length) return false;
  return patternSegs.every(
    (seg, i) => seg.startsWith(":") || seg === pathSegs[i],
  );
}

function isNavigableRoute(pathname: string): boolean {
  return getRoutePatterns().some((p) => pathMatchesPattern(pathname, p));
}

/**
 * Generate breadcrumb items from current path with Vietnamese labels
 */
function useBreadcrumbs() {
  const location = useLocation();
  const dynamicLabels = useBreadcrumbStore((s) => s.labels);

  return useMemo(() => {
    const paths = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: {
      label: string;
      href: string;
      isLast: boolean;
      navigable: boolean;
    }[] = [];

    let currentPath = "";
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label =
        dynamicLabels[currentPath] ??
        SEGMENT_LABELS[segment] ??
        sidebarUrlMap[currentPath] ??
        (isIdLike(segment)
          ? "Chi tiết"
          : segment.charAt(0).toUpperCase() +
            segment.slice(1).replace(/-/g, " "));
      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: index === paths.length - 1,
        navigable: isNavigableRoute(currentPath),
      });
    });

    return breadcrumbs;
  }, [location.pathname, dynamicLabels]);
}

/**
 * Dashboard Header with sidebar trigger and breadcrumbs
 */
function DashboardHeader() {
  const breadcrumbs = useBreadcrumbs();

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 h-4"
      />
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <div
              className="flex justify-between items-center"
              key={crumb.href}
            >
              <BreadcrumbItem key={crumb.href}>
                {crumb.isLast || !crumb.navigable ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.href}>
                    {crumb.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />
      </div>
    </header>
  );
}

/**
 * Main content area
 */
function DashboardContent() {
  return (
    <main className="flex-1 overflow-auto p-4 md:p-6">
      <Outlet />
    </main>
  );
}

/**
 * Dashboard Layout with sidebar and main content area
 */
export default function DashboardLayout() {
  useSocketInit();
  useSocketAuthSync();
  useRealtimeEvents();

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardHeader />
        <DashboardContent />
      </SidebarInset>
    </SidebarProvider>
  );
}
