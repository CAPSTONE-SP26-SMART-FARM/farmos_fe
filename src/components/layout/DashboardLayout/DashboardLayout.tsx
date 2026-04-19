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
import { sidebarData } from "./sidebarItemData";

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
 * This covers all feature-level pages (e.g. /dashboard/owner/iot-devices → "Thiết Bị IoT").
 */
function buildSidebarUrlMap(): Record<string, string> {
  const map: Record<string, string> = {};
  const allNavs = [
    ...sidebarData.navAdmin,
    ...sidebarData.navOwner,
    ...sidebarData.navManager,
    ...sidebarData.navDoctor,
    ...sidebarData.navFarmer,
  ];
  for (const item of allNavs) {
    map[item.url] = item.title;
  }
  return map;
}

const sidebarUrlMap = buildSidebarUrlMap();

/**
 * Generate breadcrumb items from current path with Vietnamese labels
 */
function useBreadcrumbs() {
  const location = useLocation();

  return useMemo(() => {
    const paths = location.pathname.split("/").filter(Boolean);
    const breadcrumbs: { label: string; href: string; isLast: boolean }[] = [];

    let currentPath = "";
    paths.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const label =
        SEGMENT_LABELS[segment] ??
        sidebarUrlMap[currentPath] ??
        segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      breadcrumbs.push({
        label,
        href: currentPath,
        isLast: index === paths.length - 1,
      });
    });

    return breadcrumbs;
  }, [location.pathname]);
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
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbPage>
                    <BreadcrumbLink href={crumb.href}>
                      {crumb.label}
                    </BreadcrumbLink>
                  </BreadcrumbPage>
                )}
              </BreadcrumbItem>
              {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
            </div>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
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
