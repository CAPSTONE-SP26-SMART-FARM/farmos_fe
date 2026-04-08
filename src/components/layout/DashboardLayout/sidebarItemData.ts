import {
  Shield,
  LayoutDashboard,
  Package,
  Ticket,
  ChartColumnIncreasing,
  SlidersHorizontal,
  UserCheck,
  Building2,
  Users,
  Bell,
  Activity,
  BookOpen,
  Bug,
  Stethoscope,
  Pill,
  Sprout,
  Map,
  Bot,
  Settings,
  ClipboardList,
  FolderKanban,
  FileText,
  User,
  Send,
} from "lucide-react";
import type { SidebarData } from "./types";

export const sidebarData: SidebarData = {
  // Admin Navigation
  navAdmin: [
    {
      title: "List Request",
      url: "/dashboard/admin/doctor-requests",
      icon: Send,
    },
    {
      title: "Dashboard",
      url: "/dashboard/admin",
      icon: Shield,
      isActive: true,
    },
    {
      title: "Subscription Packages",
      url: "/dashboard/admin/packages",
      icon: Package,
    },
    {
      title: "Doctor Applications",
      url: "/dashboard/admin/doctor-applications",
      icon: UserCheck,
    },
    {
      title: "Doctor Assignment",
      url: "/dashboard/admin/doctor-assignment",
      icon: Users,
    },
    {
      title: "Doctor Performance",
      url: "/dashboard/admin/doctor-performance",
      icon: ChartColumnIncreasing,
    },
    {
      title: "Ticket Analytics",
      url: "/dashboard/admin/ticket-analytics",
      icon: Ticket,
    },
    {
      title: "IoT Templates",
      url: "/dashboard/admin/iot-templates",
      icon: SlidersHorizontal,
    },
    { title: "User Management", url: "/dashboard/admin/users", icon: Users },
    {
      title: "Farm Management",
      url: "/dashboard/admin/farms",
      icon: Building2,
    },
  ],

  // Owner Navigation
  navOwner: [
    {
      title: "Dashboard",
      url: "/dashboard/owner",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Subscription",
      url: "/dashboard/owner/subscription",
      icon: Package,
    },
    {
      title: "Farm Management",
      url: "/dashboard/owner/farms",
      icon: Building2,
    },
    { title: "Zone Management", url: "/dashboard/owner/zones", icon: Map },
    {
      title: "Crop Seasons",
      url: "/dashboard/owner/crop-seasons",
      icon: Sprout,
    },
    {
      title: "Manager Management",
      url: "/dashboard/owner/managers",
      icon: Users,
    },
    {
      title: "Assigned Doctor",
      url: "/dashboard/owner/doctor",
      icon: Stethoscope,
    },
    {
      title: "Production Analytics",
      url: "/dashboard/owner/analytics",
      icon: ChartColumnIncreasing,
    },
    { title: "AI Insights", url: "/dashboard/owner/ai-insights", icon: Bot },
    {
      title: "Ticket Monitoring",
      url: "/dashboard/owner/tickets",
      icon: Ticket,
    },
  ],

  // Manager Navigation
  navManager: [
    {
      title: "Dashboard",
      url: "/dashboard/manager",
      icon: LayoutDashboard,
      isActive: true,
    },
    { title: "Assigned Zones", url: "/dashboard/manager/zones", icon: Map },
    {
      title: "Manage Crop Seasons",
      url: "/dashboard/manager/crop-seasons",
      icon: Sprout,
    },
    {
      title: "IoT Configuration",
      url: "/dashboard/manager/iot-config",
      icon: Settings,
    },
    {
      title: "Task Assignment",
      url: "/dashboard/manager/tasks",
      icon: ClipboardList,
    },
    {
      title: "Task Progress",
      url: "/dashboard/manager/progress",
      icon: FolderKanban,
    },
    { title: "Sensor Data", url: "/dashboard/manager/sensors", icon: Activity },
    {
      title: "Incident Coordination",
      url: "/dashboard/manager/incidents",
      icon: Bug,
    },
    {
      title: "Owner Reports",
      url: "/dashboard/manager/reports",
      icon: FileText,
    },
    {
      title: "Notifications",
      url: "/dashboard/manager/notifications",
      icon: Bell,
    },
  ],

  // Doctor Navigation
  navDoctor: [
    {
      title: "Update profile",
      url: "/dashboard/doctor/update-profile",
      icon: User,
    },
    { title: "List request", url: "/dashboard/doctor/my-request", icon: Send },
    {
      title: "Dashboard",
      url: "/dashboard/doctor",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Assigned Farms",
      url: "/dashboard/doctor/assigned-farms",
      icon: Building2,
    },
    { title: "Incident Inbox", url: "/dashboard/doctor/incidents", icon: Bug },
    {
      title: "Diagnosis & Plans",
      url: "/dashboard/doctor/treatment-plans",
      icon: Pill,
    },
    {
      title: "Treatment Tracking",
      url: "/dashboard/doctor/treatment-tracking",
      icon: Activity,
    },
    {
      title: "Ticket History",
      url: "/dashboard/doctor/ticket-history",
      icon: Ticket,
    },
    {
      title: "Knowledge Base",
      url: "/dashboard/doctor/knowledge-base",
      icon: BookOpen,
    },
    {
      title: "Notifications",
      url: "/dashboard/doctor/notifications",
      icon: Bell,
    },
    {
      title: "Reports & Statistics",
      url: "/dashboard/doctor/reports",
      icon: ChartColumnIncreasing,
    },
  ],

  navFarmer: [
    {
      title: "Notifications",
      url: "/dashboard/farmer/notifications",
      icon: Bell,
    },
  ],
};
