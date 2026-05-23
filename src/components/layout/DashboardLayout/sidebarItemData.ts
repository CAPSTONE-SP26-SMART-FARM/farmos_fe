import {
  BarChart3,
  Blocks,
  Building2,
  ChartColumnIncreasing,
  ClipboardList,
  Coins,
  Cpu,
  HandCoins,
  LayoutDashboard,
  Map,
  Package,
  PackagePlus,
  Pill,
  ReceiptText,
  Settings2,
  Shield,
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
      label: "Tài chính",
      items: [
        {
          title: "Quản Lý Doanh Thu",
          url: "/dashboard/admin/revenue",
          icon: Coins,
        },
        {
          title: "Thanh Toán Bác Sĩ",
          url: "/dashboard/admin/doctor-payouts",
          icon: HandCoins,
        },
      ],
    },
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
          title: "Tính Năng Theo Gói",
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
          title: "Quản Lý Đăng Ký",
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
          title: "Tổng quan IoT",
          url: "/dashboard/admin/iot-devices/dashboard",
          icon: ChartColumnIncreasing,
        },
        {
          title: "Thiết bị",
          url: "/dashboard/admin/iot-devices",
          icon: Cpu,
          items: [
            {
              title: "Danh sách thiết bị",
              url: "/dashboard/admin/iot-devices",
            },
            {
              title: "Cần lắp đặt",
              url: "/dashboard/admin/iot-devices/install-queue",
            },
            {
              title: "Cần thu lại",
              url: "/dashboard/admin/iot-devices/recovery-queue",
            },
            {
              title: "Cần xử lý",
              url: "/dashboard/admin/iot-devices/attention-queue",
            },
          ],
        },
        {
          title: "Gói Kit",
          url: "/dashboard/admin/iot-kits",
          icon: PackagePlus,
          items: [
            {
              title: "Danh mục Kit",
              url: "/dashboard/admin/iot-kits",
            },
            {
              title: "Gán Kit cho Owner",
              url: "/dashboard/admin/iot-kits/assignments",
            },
          ],
        },
      ],
    },
    {
      label: "Mẫu vận hành",
      items: [
        // {
        //   title: "Mẫu Vụ Mùa",
        //   url: "/dashboard/admin/season-templates",
        //   icon: Sprout,
        // },
        // {
        //   title: "Mẫu Cột Mốc",
        //   url: "/dashboard/admin/milestone-templates",
        //   icon: Milestone,
        // },
        {
          title: "Loại Cây Trồng",
          url: "/dashboard/admin/crop-categories",
          icon: Sprout,
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
        {
          title: "Yêu Cầu Rút Tiền Bác Sĩ",
          url: "/dashboard/admin/doctor-withdrawals",
          icon: Wallet,
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
      requiresSubscription: true,
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
          title: "Thanh Toán",
          url: "/dashboard/owner/payments",
          icon: ReceiptText,
        },
      ],
    },
    {
      label: "Trang trại",
      requiresSubscription: true,
      items: [
        {
          title: "Quản Lý Trang Trại",
          url: "/dashboard/owner/farm",
          icon: Building2,
        },
        {
          title: "Vụ Mùa",
          url: "/dashboard/owner/crop-seasons",
          icon: Sprout,
        },
        {
          title: "Quản Lý Tài Khoản",
          url: "/dashboard/owner/managers",
          icon: Users,
        },
      ],
    },
    {
      label: "IoT & Cảm biến",
      requiresSubscription: true,
      items: [
        {
          title: "Thiết Bị & Hạn Mức IoT",
          url: "/dashboard/owner/iot",
          icon: Cpu,
        },
        {
          title: "Mua Dịch Vụ",
          url: "/dashboard/owner/iot-kits",
          icon: PackagePlus,
        },
      ],
    },
    {
      label: "Hỗ trợ",
      requiresSubscription: true,
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
      ],
    },
    {
      label: "Hỗ trợ",
      items: [
        {
          title: "Giám Sát Sự Cố",
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
