import {
  Activity,
  BarChart3,
  Blocks,
  Building2,
  ChartColumnIncreasing,
  ClipboardList,
  Cpu,
  LayoutDashboard,
  Map,
  Milestone,
  NotebookPen,
  Package,
  PackagePlus,
  Pill,
  ReceiptText,
  Settings,
  Settings2,
  Shield,
  SlidersHorizontal,
  Sprout,
  Tag,
  Ticket,
  Trophy,
  UserCheck,
  Users,
  Wallet,
} from "lucide-react";
import type { SidebarData } from "./types";

export const sidebarData: SidebarData = {
  // ──────────────────────────────────────────────────────────────────────
  // Admin
  // ──────────────────────────────────────────────────────────────────────
  navAdmin: [
    {
      label: "Tổng quan",
      items: [
        {
          title: "Tổng Quan",
          url: "/dashboard/admin",
          icon: Shield,
          isActive: true,
        },
      ],
    },
    {
      label: "Quản trị hệ thống",
      items: [
        {
          title: "Quản Lý Người Dùng",
          url: "/dashboard/admin/users",
          icon: Users,
        },
        {
          title: "Quản Lý Trang Trại",
          url: "/dashboard/admin/farms",
          icon: Building2,
        },
        {
          title: "Feature Menu",
          url: "/dashboard/admin/features",
          icon: Blocks,
        },
      ],
    },
    {
      label: "Đăng ký & Thanh toán",
      items: [
        {
          title: "Gói Đăng Ký",
          url: "/dashboard/admin/subscription-plans",
          icon: Package,
        },
        {
          title: "Vòng Đời Đăng Ký",
          url: "/dashboard/admin/subscriptions",
          icon: Package,
        },
        {
          title: "Hóa Đơn",
          url: "/dashboard/admin/invoices",
          icon: ReceiptText,
        },
      ],
    },
    {
      label: "IoT & Thiết bị",
      items: [
        {
          title: "Mẫu IoT",
          url: "/dashboard/admin/iot-templates",
          icon: SlidersHorizontal,
        },
        {
          title: "Thiết Bị IoT",
          url: "/dashboard/admin/iot-devices",
          icon: Cpu,
        },
        {
          title: "Bộ Kit IoT",
          url: "/dashboard/admin/iot-kits",
          icon: PackagePlus,
        },
        {
          title: "Cấp phát kit",
          url: "/dashboard/admin/iot-kits/assignments",
          icon: PackagePlus,
        },
      ],
    },
    {
      label: "Mẫu vận hành",
      items: [
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
    },
    {
      label: "Ticket",
      items: [
        {
          title: "Danh Mục Ticket",
          url: "/dashboard/admin/ticket-categories",
          icon: Tag,
        },
        {
          title: "Gói Ticket",
          url: "/dashboard/admin/packages",
          icon: Package,
        },
        {
          title: "Quy Tắc Hoa Hồng",
          url: "/dashboard/admin/commission-rules",
          icon: ChartColumnIncreasing,
        },
        {
          title: "Cấu Hình Quy Trình Ticket",
          url: "/dashboard/admin/system-configs/tickets",
          icon: Settings2,
        },
        {
          title: "Phân Tích Ticket",
          url: "/dashboard/admin/ticket-analytics",
          icon: BarChart3,
        },
      ],
    },
    {
      label: "Bác sĩ & Thuốc",
      items: [
        {
          title: "Đơn Xin Làm Bác Sĩ",
          url: "/dashboard/admin/doctor-applications",
          icon: UserCheck,
        },
        {
          title: "Bảng Xếp Hạng Bác Sĩ",
          url: "/dashboard/admin/dqs/leaderboard",
          icon: Trophy,
        },
        {
          title: "Danh Mục Thuốc",
          url: "/dashboard/admin/medicines",
          icon: Pill,
        },
        {
          title: "Thống Kê Thuốc Tự Nhập",
          url: "/dashboard/admin/medicines/freetext-stats",
          icon: BarChart3,
        },
      ],
    },
  ],

  // ──────────────────────────────────────────────────────────────────────
  // Owner
  // ──────────────────────────────────────────────────────────────────────
  navOwner: [
    {
      label: "Tổng quan",
      items: [
        {
          title: "Tổng Quan",
          url: "/dashboard/owner",
          icon: LayoutDashboard,
          isActive: true,
        },
      ],
    },
    {
      label: "Gói & Thanh toán",
      items: [
        {
          title: "Gói Đăng Ký",
          url: "/dashboard/owner/subscription-plans",
          icon: Package,
        },
        {
          title: "Gói Đăng Ký Của Tôi",
          url: "/dashboard/owner/subscriptions",
          icon: Package,
        },
        {
          title: "Lịch Sử Đăng Ký",
          url: "/dashboard/owner/subscriptions/history",
          icon: Package,
        },
        {
          title: "Ví Credit",
          url: "/dashboard/owner/wallet",
          icon: Wallet,
        },
        {
          title: "Thanh Toán",
          url: "/dashboard/owner/payments",
          icon: ReceiptText,
        },
      ],
    },
    {
      label: "Trang trại",
      items: [
        {
          title: "Quản Lý Trang Trại",
          url: "/dashboard/owner/farms",
          icon: Building2,
        },
        {
          title: "Quản Lý Khu Vực",
          url: "/dashboard/owner/zones",
          icon: Map,
        },
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
      ],
    },
    {
      label: "Vận hành",
      items: [
        {
          title: "Mẫu Nhiệm Vụ",
          url: "/dashboard/owner/employee-task-templates",
          icon: ClipboardList,
        },
        {
          title: "Nhật Ký Công Việc",
          url: "/dashboard/owner/daily-logs",
          icon: NotebookPen,
        },
      ],
    },
    {
      label: "IoT & Cảm biến",
      items: [
        {
          title: "Thiết Bị IoT",
          url: "/dashboard/owner/iot-devices",
          icon: Cpu,
        },
        {
          title: "Mua Bộ Kit IoT",
          url: "/dashboard/owner/iot-kits",
          icon: PackagePlus,
        },
        {
          title: "Theo Dõi Cấp Phát IoT",
          url: "/dashboard/owner/iot-tracking",
          icon: PackagePlus,
        },
        {
          title: "Tổng Quan Cảm Biến",
          url: "/dashboard/owner/sensor-dashboard",
          icon: Activity,
        },
      ],
    },
    {
      label: "Hỗ trợ",
      items: [
        {
          title: "Giám Sát Sự Cố",
          url: "/dashboard/owner/tickets",
          icon: Ticket,
        },
      ],
    },
  ],

  // ──────────────────────────────────────────────────────────────────────
  // Manager
  // ──────────────────────────────────────────────────────────────────────
  navManager: [
    {
      label: "Tổng quan",
      items: [
        {
          title: "Tổng Quan",
          url: "/dashboard/manager",
          icon: LayoutDashboard,
          isActive: true,
        },
      ],
    },
    {
      label: "Vận hành vùng",
      items: [
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
          title: "Nhật Ký Công Việc",
          url: "/dashboard/manager/daily-logs",
          icon: NotebookPen,
        },
      ],
    },
    {
      label: "IoT & Cảm biến",
      items: [
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
      ],
    },
    {
      label: "Hỗ trợ",
      items: [
        {
          title: "Điều Phối Sự Cố",
          url: "/dashboard/manager/tickets",
          icon: Ticket,
        },
      ],
    },
  ],

  // ──────────────────────────────────────────────────────────────────────
  // Doctor & Farmer — không dùng trong dashboard hiện tại.
  // Dashboard chỉ phục vụ admin / owner / manager. Uncomment lại khi cần.
  // ──────────────────────────────────────────────────────────────────────
  // navDoctor: [
  //   {
  //     label: "Hồ sơ",
  //     items: [
  //       { title: "Cập Nhật Hồ Sơ", url: "/dashboard/doctor/update-profile", icon: User },
  //       { title: "Danh Sách Yêu Cầu", url: "/dashboard/doctor/my-request", icon: Send },
  //     ],
  //   },
  //   {
  //     label: "Tổng quan",
  //     items: [
  //       { title: "Tổng Quan", url: "/dashboard/doctor", icon: LayoutDashboard, isActive: true },
  //       { title: "Hộp Thư Sự Cố", url: "/dashboard/doctor/tickets", icon: Ticket },
  //     ],
  //   },
  // ],
  //
  // navFarmer: [
  //   // TODO: Chưa có route/feature cho Farmer dashboard, tạm ẩn tab.
  // ],
};
