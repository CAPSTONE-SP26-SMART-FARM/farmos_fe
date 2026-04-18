import {
  Activity,
  Cpu,
  Shield,
  LayoutDashboard,
  Package,
  Ticket,
  SlidersHorizontal,
  Building2,
  Users,
  Sprout,
  Map,
  Settings,
  ClipboardList,
  User,
  Send,
  Milestone,
} from "lucide-react";
import type { SidebarData } from "./types";

export const sidebarData: SidebarData = {
  // Admin Navigation
  navAdmin: [
    // {
    //   title: "Danh Sách Yêu Cầu",
    //   url: "/dashboard/admin/doctor-requests",
    //   icon: Send,
    // },
    {
      title: "Tổng Quan",
      url: "/dashboard/admin",
      icon: Shield,
      isActive: true,
    },
    {
      title: "Gói Đăng Ký",
      url: "/dashboard/admin/packages",
      icon: Package,
    },
    // {
    //   title: "Đơn Xin Làm Bác Sĩ",
    //   url: "/dashboard/admin/doctor-applications",
    //   icon: UserCheck,
    // },
    // {
    //   title: "Phân Công Bác Sĩ",
    //   url: "/dashboard/admin/doctor-assignment",
    //   icon: Users,
    // },
    // {
    //   title: "Hiệu Suất Bác Sĩ",
    //   url: "/dashboard/admin/doctor-performance",
    //   icon: ChartColumnIncreasing,
    // },
    {
      title: "Phân Tích Ticket",
      url: "/dashboard/admin/ticket-analytics",
      icon: Ticket,
    },
    {
      title: "Mẫu IoT",
      url: "/dashboard/admin/iot-templates",
      icon: SlidersHorizontal,
    },
    { title: "Quản Lý Người Dùng", url: "/dashboard/admin/users", icon: Users },
    {
      title: "Quản Lý Trang Trại",
      url: "/dashboard/admin/farms",
      icon: Building2,
    },
    {
      title: "Mẫu Cột Mốc",
      url: "/dashboard/admin/milestone-templates",
      icon: Milestone,
    },
    {
      title: "Mẫu Nhiệm Vụ Nhân Viên",
      url: "/dashboard/admin/employee-task-templates",
      icon: ClipboardList,
    },
  ],

  // Owner Navigation
  navOwner: [
    {
      title: "Tổng Quan",
      url: "/dashboard/owner",
      icon: LayoutDashboard,
      isActive: true,
    },
    // {
    //   title: "Đăng Ký Dịch Vụ",
    //   url: "/dashboard/owner/subscription",
    //   icon: Package,
    // },
    {
      title: "Quản Lý Trang Trại",
      url: "/dashboard/owner/farms",
      icon: Building2,
    },
    { title: "Quản Lý Khu Vực", url: "/dashboard/owner/zones", icon: Map },
    {
      title: "Vụ Mùa",
      url: "/dashboard/owner/crop-seasons",
      icon: Sprout,
    },
    {
      title: "Quản Lý Quản Lý Viên",
      url: "/dashboard/owner/managers",
      icon: Users,
    },
    // {
    //   title: "Bác Sĩ Được Phân Công",
    //   url: "/dashboard/owner/doctor",
    //   icon: Stethoscope,
    // },
    // {
    //   title: "Phân Tích Sản Xuất",
    //   url: "/dashboard/owner/analytics",
    //   icon: ChartColumnIncreasing,
    // },
    // TODO: Chưa có workflow/API thật, tạm ẩn tab để tránh vào màn placeholder.
    // { title: "Gợi Ý AI", url: "/dashboard/owner/ai-insights", icon: Bot },
    {
      title: "Mẫu Nhiệm Vụ",
      url: "/dashboard/owner/employee-task-templates",
      icon: ClipboardList,
    },
    {
      title: "Thiết Bị IoT",
      url: "/dashboard/owner/iot-devices",
      icon: Cpu,
    },
    {
      title: "Tổng Quan Cảm Biến",
      url: "/dashboard/owner/sensor-dashboard",
      icon: Activity,
    },
    // {
    //   title: "Giám Sát Ticket",
    //   url: "/dashboard/owner/tickets",
    //   icon: Ticket,
    // },
    {
      title: "Giám Sát Sự Cố",
      url: "/dashboard/owner/tickets",
      icon: Ticket,
    },
  ],

  // Manager Navigation
  navManager: [
    {
      title: "Tổng Quan",
      url: "/dashboard/manager",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Khu Vực Được Phân Công",
      url: "/dashboard/manager/zones",
      icon: Map,
    },
    {
      title: "Quản Lý Vụ Mùa",
      url: "/dashboard/manager/crop-seasons",
      icon: Sprout,
    },
    {
      title: "Cột Mốc Sản Xuất",
      url: "/dashboard/manager/milestones",
      icon: Milestone,
    },
    {
      title: "Cấu Hình IoT",
      url: "/dashboard/manager/iot-config",
      icon: Settings,
    },
    {
      title: "Tổng Quan Cảm Biến",
      url: "/dashboard/manager/sensor-dashboard",
      icon: Activity,
    },
    {
      title: "Mẫu Nhiệm Vụ",
      url: "/dashboard/manager/employee-task-templates",
      icon: ClipboardList,
    },
    {
      title: "Điều Phối Sự Cố",
      url: "/dashboard/manager/tickets",
      icon: Ticket,
    },
    // TODO: Chưa có workflow/API thật, tạm ẩn tab để tránh vào màn placeholder.
    // {
    //   title: "Tiến Độ Nhiệm Vụ",
    //   url: "/dashboard/manager/progress",
    //   icon: FolderKanban,
    // },
    // {
    //   title: "Dữ Liệu Cảm Biến",
    //   url: "/dashboard/manager/sensors",
    //   icon: Activity,
    // },
    // {
    //   title: "Điều Phối Sự Cố",
    //   url: "/dashboard/manager/incidents",
    //   icon: Bug,
    // },
    // {
    //   title: "Báo Cáo Chủ Trang Trại",
    //   url: "/dashboard/manager/reports",
    //   icon: FileText,
    // },
    // {
    //   title: "Thông Báo",
    //   url: "/dashboard/manager/notifications",
    //   icon: Bell,
    // },
  ],

  // Doctor Navigation
  navDoctor: [
    {
      title: "Cập Nhật Hồ Sơ",
      url: "/dashboard/doctor/update-profile",
      icon: User,
    },
    {
      title: "Danh Sách Yêu Cầu",
      url: "/dashboard/doctor/my-request",
      icon: Send,
    },
    {
      title: "Tổng Quan",
      url: "/dashboard/doctor",
      icon: LayoutDashboard,
      isActive: true,
    },
    {
      title: "Hộp Thư Sự Cố",
      url: "/dashboard/doctor/tickets",
      icon: Ticket,
    },
    // TODO: Chưa có workflow/API thật, tạm ẩn các tab chỉ hiển thị placeholder.
    // {
    //   title: "Trang Trại Được Phân Công",
    //   url: "/dashboard/doctor/assigned-farms",
    //   icon: Building2,
    // },
    // {
    //   title: "Hộp Thư Sự Cố",
    //   url: "/dashboard/doctor/incidents",
    //   icon: Bug,
    // },
    // {
    //   title: "Chẩn Đoán & Kế Hoạch",
    //   url: "/dashboard/doctor/treatment-plans",
    //   icon: Pill,
    // },
    // {
    //   title: "Theo Dõi Điều Trị",
    //   url: "/dashboard/doctor/treatment-tracking",
    //   icon: Activity,
    // },
    // {
    //   title: "Lịch Sử Ticket",
    //   url: "/dashboard/doctor/ticket-history",
    //   icon: Ticket,
    // },
    // {
    //   title: "Kho Kiến Thức",
    //   url: "/dashboard/doctor/knowledge-base",
    //   icon: BookOpen,
    // },
    // {
    //   title: "Thông Báo",
    //   url: "/dashboard/doctor/notifications",
    //   icon: Bell,
    // },
    // {
    //   title: "Báo Cáo & Thống Kê",
    //   url: "/dashboard/doctor/reports",
    //   icon: ChartColumnIncreasing,
    // },
  ],

  navFarmer: [
    // TODO: Chưa có route/feature cho Farmer dashboard, tạm ẩn tab.
    // {
    //   title: "Thông Báo",
    //   url: "/dashboard/farmer/notifications",
    //   icon: Bell,
    // },
  ],
};
