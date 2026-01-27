import {
  LayoutDashboard,
  FileText,
  DollarSign,
  Building2,
  Users,
  Bell,
  Calendar,
  ClipboardList,
  Warehouse,
  Activity,
  Cloud,
  Lightbulb,
  BookOpen,
  Bug,
  Syringe,
  TrendingUp,
  ListTodo,
  Stethoscope,
  Pill,
  BarChart3,
  Sprout,
  Scale,
} from "lucide-react";
import type { SidebarData } from "./types";

export const sidebarData: SidebarData = {
  // Owner
  navOwner: [
    {
      title: "Dashboard",
      url: "/dashboard/owner",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Report Management",
      url: "/dashboard/owner/reports",
      icon: FileText,
    },
    {
      title: "Finance Dashboard",
      url: "/dashboard/owner/finance",
      icon: DollarSign,
    },
    {
      title: "Farm Management",
      url: "/dashboard/owner/farms",
      icon: Building2,
    },
    {
      title: "User Management",
      url: "/dashboard/owner/users",
      icon: Users,
    },
    {
      title: "Notifications",
      url: "/dashboard/owner/notifications",
      icon: Bell,
    },
  ],

  // Manager Navigation - Zone-based (card style first, then sidebar)
  navManager: [
    {
      title: "Dashboard",
      url: "/dashboard/manager",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Periodic Reports",
      url: "/dashboard/manager/reports",
      icon: FileText,
    },
    {
      title: "Crop Seasons",
      url: "/dashboard/manager/crop-seasons",
      icon: Sprout,
    },
    {
      title: "Livestock Batches",
      url: "/dashboard/manager/livestock-batches",
      icon: Warehouse,
    },
    {
      title: "Staff Management",
      url: "/dashboard/manager/staff",
      icon: Users,
    },
    {
      title: "Production Planning",
      url: "/dashboard/manager/production-planning",
      icon: Calendar,
    },
    {
      title: "Expense Management",
      url: "/dashboard/manager/expenses",
      icon: DollarSign,
    },
    {
      title: "Disease Coordination",
      url: "/dashboard/manager/disease-cases",
      icon: Bug,
    },
    {
      title: "Vaccination Schedule",
      url: "/dashboard/manager/vaccination",
      icon: Syringe,
    },
    {
      title: "Sensor Data",
      url: "/dashboard/manager/sensors",
      icon: Activity,
    },
  ],

  // Farmer Navigation
  navFarmer: [
    {
      title: "My Barns & Batches",
      url: "/dashboard/farmer",
      icon: Warehouse,
      isActive: true,
    },
    {
      title: "Sensor Dashboard",
      url: "/dashboard/farmer/sensors",
      icon: Activity,
    },
    {
      title: "Weather Forecast",
      url: "/dashboard/farmer/weather",
      icon: Cloud,
    },
    {
      title: "Recommendations",
      url: "/dashboard/farmer/recommendations",
      icon: Lightbulb,
    },
    {
      title: "Daily Activity Log",
      url: "/dashboard/farmer/daily-log",
      icon: ClipboardList,
    },
    {
      title: "Crop Growth Stages",
      url: "/dashboard/farmer/crop-stages",
      icon: Sprout,
    },
    {
      title: "Report Issue",
      url: "/dashboard/farmer/report-issue",
      icon: Bug,
    },
    {
      title: "Disease Cases",
      url: "/dashboard/farmer/disease-cases",
      icon: Stethoscope,
    },
    {
      title: "Harvest Records",
      url: "/dashboard/farmer/harvest",
      icon: Scale,
    },
    {
      title: "Notifications",
      url: "/dashboard/farmer/notifications",
      icon: Bell,
    },
    {
      title: "Task List",
      url: "/dashboard/farmer/tasks",
      icon: ListTodo,
    },
  ],

  // Rancher Navigation
  navRancher: [
    {
      title: "My Barns & Batches",
      url: "/dashboard/rancher",
      icon: Warehouse,
      isActive: true,
    },
    {
      title: "Sensor Dashboard",
      url: "/dashboard/rancher/sensors",
      icon: Activity,
    },
    {
      title: "Weather Forecast",
      url: "/dashboard/rancher/weather",
      icon: Cloud,
    },
    {
      title: "Recommendations",
      url: "/dashboard/rancher/recommendations",
      icon: Lightbulb,
    },
    {
      title: "Daily Activity Log",
      url: "/dashboard/rancher/daily-log",
      icon: ClipboardList,
    },
    {
      title: "Knowledge Base",
      url: "/dashboard/rancher/handbook",
      icon: BookOpen,
    },
    {
      title: "Report Issue",
      url: "/dashboard/rancher/report-issue",
      icon: Bug,
    },
    {
      title: "Disease Cases",
      url: "/dashboard/rancher/disease-cases",
      icon: Stethoscope,
    },
    {
      title: "Vaccination",
      url: "/dashboard/rancher/vaccination",
      icon: Syringe,
    },
    {
      title: "Livestock Count",
      url: "/dashboard/rancher/livestock-count",
      icon: TrendingUp,
    },
    {
      title: "Notifications",
      url: "/dashboard/rancher/notifications",
      icon: Bell,
    },
    {
      title: "Task List",
      url: "/dashboard/rancher/tasks",
      icon: ListTodo,
    },
  ],

  // Doctor Navigation
  navDoctor: [
    {
      title: "Assigned Farms",
      url: "/dashboard/doctor",
      icon: Building2,
      isActive: true,
    },
    {
      title: "Sensor Dashboard",
      url: "/dashboard/doctor/sensors",
      icon: Activity,
    },
    {
      title: "Crop Diagnosis",
      url: "/dashboard/doctor/diagnosis-crops",
      icon: Sprout,
    },
    {
      title: "Livestock Diagnosis",
      url: "/dashboard/doctor/diagnosis-livestock",
      icon: Stethoscope,
    },
    {
      title: "Prescriptions",
      url: "/dashboard/doctor/prescriptions",
      icon: Pill,
    },
    {
      title: "Crop Growth Stages",
      url: "/dashboard/doctor/crop-stages",
      icon: Sprout,
    },
    {
      title: "Vaccination",
      url: "/dashboard/doctor/vaccination",
      icon: Syringe,
    },
    {
      title: "Treatment Tracking",
      url: "/dashboard/doctor/treatment-tracking",
      icon: TrendingUp,
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
      icon: BarChart3,
    },
  ],
};
