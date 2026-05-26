import MainLayout from "@/components/layout/MainLayout/MainLayout";
import SimpleLayout from "@/components/layout/SimpleLayout/SimpleLayout";
import AdminDashboardPage from "@/pages/AdminPage/Dashboard/AdminDashboardPage";
import AdminDoctorApplicationsPage from "@/pages/AdminPage/DoctorApplications/AdminDoctorApplicationsPage";
import AdminDoctorAssignmentPage from "@/pages/AdminPage/DoctorAssignment/AdminDoctorAssignmentPage";
import AdminDoctorPerformancePage from "@/pages/AdminPage/DoctorPerformance/AdminDoctorPerformancePage";
import AdminFarmsPage from "@/pages/AdminPage/Farms/AdminFarmsPage";
import AdminFeaturesPage from "@/pages/AdminPage/Features/AdminFeaturesPage";
import AdminIotKitsPage from "@/pages/AdminPage/IotKits/AdminIotKitsPage";
import AdminKitAssignmentsPage from "@/pages/AdminPage/IotKits/AdminKitAssignmentsPage";
import AdminKitAssignmentDetailPage from "@/pages/AdminPage/IotKits/AdminKitAssignmentDetailPage";
import AdminInvoiceDetailPage from "@/pages/AdminPage/Invoices/AdminInvoiceDetailPage";
import AdminInvoicesPage from "@/pages/AdminPage/Invoices/AdminInvoicesPage";
import AdminIotDevicesPage from "@/pages/AdminPage/IotDevices/AdminIotDevicesPage";
import AdminIotDashboardPage from "@/pages/AdminPage/IotDevices/AdminIotDashboardPage";
import AdminIotDeviceDecisionPage from "@/pages/AdminPage/IotDevices/AdminIotDeviceDecisionPage";
import AdminIotKitRequestsPage from "@/pages/AdminPage/IotKitRequests/AdminIotKitRequestsPage";
import OwnerIotKitRequestsPage from "@/pages/OwnerPage/IotKitRequests/OwnerIotKitRequestsPage";
import AdminIotDeviceTimelinePage from "@/pages/AdminPage/IotDevices/AdminIotDeviceTimelinePage";
import AdminOwnerIotOverviewPage from "@/pages/AdminPage/Users/AdminOwnerIotOverviewPage";
import AdminCreateIotDevicesPage from "@/pages/AdminPage/IotDevices/AdminCreateIotDevicesPage";
import AdminIotDeviceDetailPage from "@/pages/AdminPage/IotDevices/AdminIotDeviceDetailPage";
import AdminEditIotDevicePage from "@/pages/AdminPage/IotDevices/AdminEditIotDevicePage";
import AdminIotDeviceLogsPage from "@/pages/AdminPage/IotDevices/AdminIotDeviceLogsPage";
import AdminEmployeeTaskTemplatesPage from "@/pages/AdminPage/EmployeeTaskTemplates/AdminEmployeeTaskTemplatesPage";
// import AdminMilestoneTemplatePage from "@/pages/AdminPage/AdminMilestoneTemplatePage";
import AdminSubscriptionPlansPage from "@/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansPage";
import AdminSubscriptionPlanDetailPage from "@/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage";
import AdminSubscriptionPlanVersionCreatePage from "@/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage";
import AdminSubscriptionsPage from "@/pages/AdminPage/Subscriptions/AdminSubscriptionsPage";
import AdminSubscriptionDetailPage from "@/pages/AdminPage/Subscriptions/AdminSubscriptionDetailPage";
import AdminTicketAnalyticsPage from "@/pages/AdminPage/TicketAnalytics/AdminTicketAnalyticsPage";
import AdminTicketCategoriesPage from "@/pages/AdminPage/TicketCategories/AdminTicketCategoriesPage";
import AdminCropCategoriesPage from "@/pages/AdminPage/CropCategories/AdminCropCategoriesPage";
import AdminCommissionRulesPage from "@/pages/AdminPage/CommissionRules/AdminCommissionRulesPage";
import AdminMedicinesPage from "@/pages/AdminPage/Medicines/AdminMedicinesPage";
// import AdminSeasonTemplatesPage from "@/pages/AdminPage/SeasonTemplates/AdminSeasonTemplatesPage";
// import AdminSeasonTemplateCreatePage from "@/pages/AdminPage/SeasonTemplates/AdminSeasonTemplateCreatePage";
// import AdminSeasonTemplateDetailPage from "@/pages/AdminPage/SeasonTemplates/AdminSeasonTemplateDetailPage";
// import AdminSeasonTemplateUsagePage from "@/pages/AdminPage/SeasonTemplates/AdminSeasonTemplateUsagePage";
import AdminMedicineFreeTextStatsPage from "@/pages/AdminPage/Medicines/AdminMedicineFreeTextStatsPage";
import AdminTicketSystemConfigsPage from "@/pages/AdminPage/SystemConfigs/AdminTicketSystemConfigsPage";
import AdminDqsLeaderboardPage from "@/pages/AdminPage/DQS/AdminDqsLeaderboardPage";
import AdminDoctorDqsDetailPage from "@/pages/AdminPage/DQS/AdminDoctorDqsDetailPage";
import AdminTicketDetailPage from "@/pages/AdminPage/Tickets/AdminTicketDetailPage";
import AdminPackagesPage from "@/pages/AdminPage/Packages/AdminPackagesPage";
import AdminDoctorWithdrawalsPage from "@/pages/AdminPage/DoctorWithdrawals/AdminDoctorWithdrawalsPage";
import AdminDoctorWithdrawalDetailPage from "@/pages/AdminPage/DoctorWithdrawals/AdminDoctorWithdrawalDetailPage";
import AdminRevenuePage from "@/pages/AdminPage/Revenue/AdminRevenuePage";
import AdminDoctorPayoutsPage from "@/pages/AdminPage/DoctorPayouts/AdminDoctorPayoutsPage";
import AdminUsersPage from "@/pages/AdminPage/Users/AdminUsersPage";
import DoctorPage from "@/pages/DoctorPage/DoctorPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage/ForgotPasswordPage";
import HomePage from "@/pages/HomePage/HomePage";
import IncidentReportingHelpPage from "@/pages/Help/IncidentReportingHelpPage";
import DoctorGuideHelpPage from "@/pages/Help/DoctorGuideHelpPage";
import LoginPage from "@/pages/LoginPage/LoginPage";
import ManagerPage from "@/pages/ManagerPage/ManagerPage";
import ManagerCropSeasonsPage from "@/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage";
import ManagerMilestoneDetailPage from "@/pages/ManagerPage/CropSeasons/ManagerMilestoneDetailPage";
import ManagerMilestoneViewPage from "@/pages/ManagerPage/CropSeasons/ManagerMilestoneViewPage";
import ManagerMilestoneOverviewPage from "@/pages/ManagerPage/CropSeasons/ManagerMilestoneOverviewPage";
import ManagerProductionMilestonesPage from "@/pages/ManagerPage/CropSeasons/ManagerProductionMilestonesPage";
import ManagerEmployeeTaskTemplatesPage from "@/pages/ManagerPage/EmployeeTaskTemplates/ManagerEmployeeTaskTemplatesPage";
import ManagerIotDevicesPage from "@/pages/ManagerPage/IotDevices/ManagerIotDevicesPage";
import ManagerIotKitRequestsPage from "@/pages/ManagerPage/IotKitRequests/ManagerIotKitRequestsPage";
import ManagerDailyLogsPage from "@/pages/ManagerPage/DailyLogs/ManagerDailyLogsPage";
import ManagerSensorReadingPage from "@/pages/ManagerPage/SensorReadings/ManagerSensorReadingPage";
import SensorDetailPage from "@/pages/SensorReadings/SensorDetailPage";
import OwnerCropSeasonsPage from "@/pages/OwnerPage/CropSeasons/OwnerCropSeasonsPage";
import OwnerMilestoneViewPage from "@/pages/OwnerPage/CropSeasons/OwnerMilestoneViewPage";
import PlanVsActualPage from "@/pages/OwnerPage/CropSeasons/PlanVsActualPage";
import OwnerEmployeeTaskTemplatesPage from "@/pages/OwnerPage/EmployeeTaskTemplates/OwnerEmployeeTaskTemplatesPage";
import OwnerIotKitsPage from "@/pages/OwnerPage/IotKits/OwnerIotKitsPage";
import OwnerIotKitDetailPage from "@/pages/OwnerPage/IotKits/OwnerIotKitDetailPage";
import OwnerIotKitOrderStatusPage from "@/pages/OwnerPage/IotKits/OwnerIotKitOrderStatusPage";
import OwnerIotHubPage, {
  RedirectToIotDevicesTab,
  RedirectToIotOverviewTab,
} from "@/pages/OwnerPage/IotHub/OwnerIotHubPage";
import OwnerDailyLogsPage from "@/pages/OwnerPage/DailyLogs/OwnerDailyLogsPage";
import OwnerSensorReadingPage from "@/pages/OwnerPage/SensorReadings/OwnerSensorReadingPage";
import OwnerPaymentsPage from "@/pages/OwnerPage/Payments/OwnerPaymentsPage";
import OwnerPaymentDetailPage from "@/pages/OwnerPage/Payments/OwnerPaymentDetailPage";
import OwnerSubscriptionPlansPage from "@/pages/OwnerPage/SubscriptionPlans/OwnerSubscriptionPlansPage";
import OwnerSubscriptionPlanDetailPage from "@/pages/OwnerPage/SubscriptionPlans/OwnerSubscriptionPlanDetailPage";
import OwnerSubscriptionsPage from "@/pages/OwnerPage/Subscriptions/OwnerSubscriptionsPage";
import OwnerSubscriptionDetailPage from "@/pages/OwnerPage/Subscriptions/OwnerSubscriptionDetailPage";
import OwnerSubscriptionHistoryPage from "@/pages/OwnerPage/Subscriptions/OwnerSubscriptionHistoryPage";
import OrderSuccessPage from "@/pages/OrderResult/OrderSuccessPage";
import OrderFailPage from "@/pages/OrderResult/OrderFailPage";
import OwnerPage from "@/pages/OwnerPage/OwnerPage";
import OwnerFarmPage from "@/pages/OwnerPage/Farm/OwnerFarmPage";
import RegisterPage from "@/pages/RegisterPage/RegisterPage";
import type { AppRoutes } from "./types";
import DashboardLayout from "@/components/layout/DashboardLayout/DashboardLayout";
import UpsertProfile from "@/pages/DoctorPage/UpsertProfile/UpsertProfile";
import ListRequest from "@/pages/DoctorPage/ListRequest/ListRequest";
import ListRequestAdmin from "@/pages/AdminPage/RequestDoctor/ListRequest";
import Profile from "@/pages/Profile/Profile";
import DoctorAssignmentsPage from "@/pages/DoctorPage/Assignment/DoctorAssignmentsPage";
import OwnerMyDoctorsPage from "@/pages/OwnerPage/MyDoctor/OwnerMyDoctorsPage";
import OwnerTicketsPage from "@/pages/OwnerPage/Tickets/OwnerTicketsPage";
import ManagerTicketsPage from "@/pages/ManagerPage/Tickets/ManagerTicketsPage";
import DoctorTicketsPage from "@/pages/DoctorPage/Tickets/DoctorTicketsPage";
import { RoleName } from "@/constants/role";

const routes: AppRoutes = [
  {
    layout: MainLayout,
    children: [
      { path: "/", component: HomePage },
      { path: "/order-success", component: OrderSuccessPage },
      { path: "/order-fail", component: OrderFailPage },
      { path: "/help/incident-reporting", component: IncidentReportingHelpPage },
      { path: "/help/doctor-guide", component: DoctorGuideHelpPage },
    ],
  },
  {
    layout: SimpleLayout,
    isRestricted: true,
    children: [
      { path: "/login", component: LoginPage },
      { path: "/register", component: RegisterPage },
      { path: "/forgot-password", component: ForgotPasswordPage },
    ],
  },
  // ── Admin ────────────────────────────────────────────────────────────
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/admin",
        component: AdminDashboardPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/subscription-plans",
        component: AdminSubscriptionPlansPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/subscription-plans/:planId",
        component: AdminSubscriptionPlanDetailPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/subscription-plans/:planId/versions/new",
        component: AdminSubscriptionPlanVersionCreatePage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/subscriptions",
        component: AdminSubscriptionsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/subscriptions/:subscriptionId",
        component: AdminSubscriptionDetailPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/invoices",
        component: AdminInvoicesPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/invoices/:invoiceId",
        component: AdminInvoiceDetailPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/doctor-applications",
        component: AdminDoctorApplicationsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/doctor-assignment",
        component: AdminDoctorAssignmentPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/doctor-performance",
        component: AdminDoctorPerformancePage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/ticket-analytics",
        component: AdminTicketAnalyticsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-devices",
        component: AdminIotDevicesPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-devices/dashboard",
        component: AdminIotDashboardPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-kit-requests",
        component: AdminIotKitRequestsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-kits",
        component: AdminIotKitsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-kits/assignments",
        component: AdminKitAssignmentsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-kits/assignments/:ownerId",
        component: AdminKitAssignmentDetailPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-devices/create",
        component: AdminCreateIotDevicesPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-devices/:deviceId",
        component: AdminIotDeviceDetailPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-devices/:deviceId/decision",
        component: AdminIotDeviceDecisionPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-devices/:deviceId/timeline",
        component: AdminIotDeviceTimelinePage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/owners/:ownerId/iot",
        component: AdminOwnerIotOverviewPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-devices/:deviceId/edit",
        component: AdminEditIotDevicePage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-device-logs",
        component: AdminIotDeviceLogsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/users",
        component: AdminUsersPage,
        allowedRoles: [RoleName.Admin],
      },
      // {
      //   path: "/dashboard/admin/milestone-templates",
      //   component: AdminMilestoneTemplatePage,
      //   allowedRoles: [RoleName.Admin],
      // },
      {
        path: "/dashboard/admin/farms",
        component: AdminFarmsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/employee-task-templates",
        component: AdminEmployeeTaskTemplatesPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/features",
        component: AdminFeaturesPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/doctor-requests",
        component: ListRequestAdmin,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/ticket-categories",
        component: AdminTicketCategoriesPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/crop-categories",
        component: AdminCropCategoriesPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/commission-rules",
        component: AdminCommissionRulesPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/packages",
        component: AdminPackagesPage,
        allowedRoles: [RoleName.Admin],
      },
      // ── Module 6 — Crop Season Templates ──
      // {
      //   path: "/dashboard/admin/season-templates",
      //   component: AdminSeasonTemplatesPage,
      //   allowedRoles: [RoleName.Admin],
      // },
      // {
      //   path: "/dashboard/admin/season-templates/create",
      //   component: AdminSeasonTemplateCreatePage,
      //   allowedRoles: [RoleName.Admin],
      // },
      // {
      //   path: "/dashboard/admin/season-templates/:id",
      //   component: AdminSeasonTemplateDetailPage,
      //   allowedRoles: [RoleName.Admin],
      // },
      // {
      //   path: "/dashboard/admin/season-templates/:id/usage",
      //   component: AdminSeasonTemplateUsagePage,
      //   allowedRoles: [RoleName.Admin],
      // },
      // ── Module 3 — Admin governance (Wave 2) ──
      {
        path: "/dashboard/admin/medicines",
        component: AdminMedicinesPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/medicines/freetext-stats",
        component: AdminMedicineFreeTextStatsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/system-configs/tickets",
        component: AdminTicketSystemConfigsPage,
        allowedRoles: [RoleName.Admin],
      },
      // ── Module 3 — Admin DQS (Wave 4) ──
      {
        path: "/dashboard/admin/dqs/leaderboard",
        component: AdminDqsLeaderboardPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/doctors/:id/dqs",
        component: AdminDoctorDqsDetailPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/tickets/:id",
        component: AdminTicketDetailPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/revenue",
        component: AdminRevenuePage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/doctor-payouts",
        component: AdminDoctorPayoutsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/doctor-withdrawals",
        component: AdminDoctorWithdrawalsPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/doctor-withdrawals/:id",
        component: AdminDoctorWithdrawalDetailPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/profile",
        component: Profile,
        allowedRoles: [RoleName.Admin],
      },
    ],
  },
  // ── Owner ─────────────────────────────────────────────────────────────
  {
    layout: DashboardLayout,
    children: [
      // ── Free routes (no active subscription required) ──
      {
        path: "/dashboard/owner/subscription-plans",
        component: OwnerSubscriptionPlansPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/subscription-plans/:planId",
        component: OwnerSubscriptionPlanDetailPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/subscriptions",
        component: OwnerSubscriptionsPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/subscriptions/history",
        component: OwnerSubscriptionHistoryPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/subscriptions/:subscriptionId",
        component: OwnerSubscriptionDetailPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/payments",
        component: OwnerPaymentsPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/payments/:invoiceId",
        component: OwnerPaymentDetailPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/profile",
        component: Profile,
        allowedRoles: [RoleName.Owner],
      },
      // ── Gated routes (require active subscription) ──
      {
        path: "/dashboard/owner",
        component: OwnerPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/farm",
        component: OwnerFarmPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/my-doctor",
        component: OwnerMyDoctorsPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/employee-task-templates",
        component: OwnerEmployeeTaskTemplatesPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/crop-seasons",
        component: OwnerCropSeasonsPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/crop-seasons/:id/plan-vs-actual",
        component: PlanVsActualPage,
        allowedRoles: [RoleName.Owner, RoleName.Manager],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/crop-seasons/:cropSeasonId/milestones/:milestoneId",
        component: OwnerMilestoneViewPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/iot",
        component: OwnerIotHubPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/iot-devices",
        component: RedirectToIotDevicesTab,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/iot-tracking",
        component: RedirectToIotOverviewTab,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/iot-kits",
        component: OwnerIotKitsPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/iot-kits/orders/:orderId",
        component: OwnerIotKitOrderStatusPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/iot-kits/:kitId",
        component: OwnerIotKitDetailPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/sensor-readings/:assignmentId",
        component: OwnerSensorReadingPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        // Reuse SensorDetailPage cho owner — page detect role qua URL prefix
        // (giống PlanVsActualPage), switch hook manager/owner tương ứng.
        path: "/dashboard/owner/sensor-readings/:assignmentId/sensors/:sensorId",
        component: SensorDetailPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/tickets",
        component: OwnerTicketsPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/iot-kit-requests",
        component: OwnerIotKitRequestsPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/daily-logs",
        component: OwnerDailyLogsPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
      {
        path: "/dashboard/owner/*",
        component: OwnerPage,
        allowedRoles: [RoleName.Owner],
        requiresActiveSubscription: true,
      },
    ],
  },
  // ── Manager ───────────────────────────────────────────────────────────
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/manager",
        component: ManagerPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/crop-seasons",
        component: ManagerCropSeasonsPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        // Reuse PlanVsActualPage cho manager — BE tracking endpoints accept
        // owner+manager roles. Page detect prefix URL để fallback nav đúng
        // role. Tham số `:id` là cropSeasonId.
        path: "/dashboard/manager/crop-seasons/:id/plan-vs-actual",
        component: PlanVsActualPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/milestones",
        component: ManagerProductionMilestonesPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        // Trang chính khi click vào 1 milestone từ MilestoneListPanel — view 3
        // tab (Cảm biến / Sự cố / Công việc). Route wizard cũ giờ ở `/configure`.
        path: "/dashboard/manager/crop-seasons/:cropSeasonId/milestones/:milestoneId",
        component: ManagerMilestoneViewPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        // Wizard cấu hình milestone (IoT/threshold/task wizard) — chỉ truy cập
        // khi season ở planning/rejected, thông qua nút "Cấu hình mốc" trên
        // ManagerMilestoneViewPage.
        path: "/dashboard/manager/crop-seasons/:cropSeasonId/milestones/:milestoneId/configure",
        component: ManagerMilestoneDetailPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        // Legacy overview — giữ tạm cho bookmark cũ; nội dung đã được gộp vào
        // route view ở trên (Phase 3 sẽ redirect hẳn rồi xoá).
        path: "/dashboard/manager/crop-seasons/:cropSeasonId/milestones/:milestoneId/overview",
        component: ManagerMilestoneOverviewPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/employee-task-templates",
        component: ManagerEmployeeTaskTemplatesPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/iot-config",
        component: ManagerIotDevicesPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/iot-kit-requests",
        component: ManagerIotKitRequestsPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/sensor-readings/:assignmentId",
        component: ManagerSensorReadingPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/sensor-readings/:assignmentId/sensors/:sensorId",
        component: SensorDetailPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/tickets",
        component: ManagerTicketsPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/daily-logs",
        component: ManagerDailyLogsPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/*",
        component: ManagerPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/profile",
        component: Profile,
        allowedRoles: [RoleName.Manager],
      },
    ],
  },
  // ── Doctor ────────────────────────────────────────────────────────────
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/doctor",
        component: DoctorPage,
        allowedRoles: [RoleName.Doctor],
      },
      {
        path: "/dashboard/doctor/update-profile",
        component: UpsertProfile,
        allowedRoles: [RoleName.Doctor],
      },
      {
        path: "/dashboard/doctor/my-request",
        component: ListRequest,
        allowedRoles: [RoleName.Doctor],
      },
      {
        path: "/dashboard/doctor/tickets",
        component: DoctorTicketsPage,
        allowedRoles: [RoleName.Doctor],
      },
      {
        path: "/dashboard/doctor/*",
        component: DoctorPage,
        allowedRoles: [RoleName.Doctor],
      },
      {
        path: "/dashboard/doctor/my-assignments",
        component: DoctorAssignmentsPage,
        allowedRoles: [RoleName.Doctor],
      },
      {
        path: "/dashboard/doctor/profile",
        component: Profile,
        allowedRoles: [RoleName.Doctor],
      },
    ],
  },
];

export default routes;
