import MainLayout from "@/components/layout/MainLayout/MainLayout";
import SimpleLayout from "@/components/layout/SimpleLayout/SimpleLayout";
import AdminDashboardPage from "@/pages/AdminPage/Dashboard/AdminDashboardPage";
import AdminDoctorApplicationsPage from "@/pages/AdminPage/DoctorApplications/AdminDoctorApplicationsPage";
import AdminDoctorAssignmentPage from "@/pages/AdminPage/DoctorAssignment/AdminDoctorAssignmentPage";
import AdminDoctorPerformancePage from "@/pages/AdminPage/DoctorPerformance/AdminDoctorPerformancePage";
import AdminFarmsPage from "@/pages/AdminPage/Farms/AdminFarmsPage";
import AdminIotTemplatesPage from "@/pages/AdminPage/IotTemplates/AdminIotTemplatesPage";
import AdminIotDevicesPage from "@/pages/AdminPage/IotDevices/AdminIotDevicesPage";
import AdminCreateIotDevicesPage from "@/pages/AdminPage/IotDevices/AdminCreateIotDevicesPage";
import AdminIotDeviceDetailPage from "@/pages/AdminPage/IotDevices/AdminIotDeviceDetailPage";
import AdminEditIotDevicePage from "@/pages/AdminPage/IotDevices/AdminEditIotDevicePage";
import AdminEmployeeTaskTemplatesPage from "@/pages/AdminPage/EmployeeTaskTemplates/AdminEmployeeTaskTemplatesPage";
import AdminMilestoneTemplatePage from "@/pages/AdminPage/AdminMilestoneTemplatePage";
import AdminSubscriptionPlansPage from "@/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlansPage";
import AdminSubscriptionPlanDetailPage from "@/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanDetailPage";
import AdminSubscriptionPlanVersionCreatePage from "@/pages/AdminPage/SubscriptionPlans/AdminSubscriptionPlanVersionCreatePage";
import AdminSubscriptionsPage from "@/pages/AdminPage/Subscriptions/AdminSubscriptionsPage";
import AdminSubscriptionDetailPage from "@/pages/AdminPage/Subscriptions/AdminSubscriptionDetailPage";
import AdminTicketAnalyticsPage from "@/pages/AdminPage/TicketAnalytics/AdminTicketAnalyticsPage";
import AdminUsersPage from "@/pages/AdminPage/Users/AdminUsersPage";
import DoctorPage from "@/pages/DoctorPage/DoctorPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage/ForgotPasswordPage";
import HomePage from "@/pages/HomePage/HomePage";
import LoginPage from "@/pages/LoginPage/LoginPage";
import ManagerPage from "@/pages/ManagerPage/ManagerPage";
import ManagerCropSeasonsPage from "@/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage";
import ManagerMilestonesPage from "@/pages/ManagerPage/CropSeasons/ManagerMilestonesPage";
import ManagerMilestoneDetailPage from "@/pages/ManagerPage/CropSeasons/ManagerMilestoneDetailPage";
import ManagerMilestoneOverviewPage from "@/pages/ManagerPage/CropSeasons/ManagerMilestoneOverviewPage";
import ManagerProductionMilestonesPage from "@/pages/ManagerPage/CropSeasons/ManagerProductionMilestonesPage";
import ManagerEmployeeTaskTemplatesPage from "@/pages/ManagerPage/EmployeeTaskTemplates/ManagerEmployeeTaskTemplatesPage";
import ManagerIotDevicesPage from "@/pages/ManagerPage/IotDevices/ManagerIotDevicesPage";
import ManagerSensorReadingPage from "@/pages/ManagerPage/SensorReadings/ManagerSensorReadingPage";
import ManagerSensorDashboardPage from "@/pages/ManagerPage/SensorDashboard/ManagerSensorDashboardPage";
import OwnerCropSeasonsPage from "@/pages/OwnerPage/CropSeasons/OwnerCropSeasonsPage";
import OwnerEmployeeTaskTemplatesPage from "@/pages/OwnerPage/EmployeeTaskTemplates/OwnerEmployeeTaskTemplatesPage";
import OwnerIotDevicesPage from "@/pages/OwnerPage/IotDevices/OwnerIotDevicesPage";
import OwnerSensorReadingPage from "@/pages/OwnerPage/SensorReadings/OwnerSensorReadingPage";
import OwnerSensorDashboardPage from "@/pages/OwnerPage/SensorDashboard/OwnerSensorDashboardPage";
import OwnerSubscriptionPlansPage from "@/pages/OwnerPage/SubscriptionPlans/OwnerSubscriptionPlansPage";
import OwnerSubscriptionsPage from "@/pages/OwnerPage/Subscriptions/OwnerSubscriptionsPage";
import OwnerSubscriptionDetailPage from "@/pages/OwnerPage/Subscriptions/OwnerSubscriptionDetailPage";
import OwnerPage from "@/pages/OwnerPage/OwnerPage";
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
    children: [{ path: "/", component: HomePage }],
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
        path: "/dashboard/admin/iot-templates",
        component: AdminIotTemplatesPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/iot-devices",
        component: AdminIotDevicesPage,
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
        path: "/dashboard/admin/iot-devices/:deviceId/edit",
        component: AdminEditIotDevicePage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/users",
        component: AdminUsersPage,
        allowedRoles: [RoleName.Admin],
      },
      {
        path: "/dashboard/admin/milestone-templates",
        component: AdminMilestoneTemplatePage,
        allowedRoles: [RoleName.Admin],
      },
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
        path: "/dashboard/admin/doctor-requests",
        component: ListRequestAdmin,
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
      {
        path: "/dashboard/owner",
        component: OwnerPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/subscription-plans",
        component: OwnerSubscriptionPlansPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/subscriptions",
        component: OwnerSubscriptionsPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/subscriptions/:subscriptionId",
        component: OwnerSubscriptionDetailPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/my-doctor",
        component: OwnerMyDoctorsPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/employee-task-templates",
        component: OwnerEmployeeTaskTemplatesPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/crop-seasons",
        component: OwnerCropSeasonsPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/iot-devices",
        component: OwnerIotDevicesPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/sensor-readings/:assignmentId",
        component: OwnerSensorReadingPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/sensor-dashboard",
        component: OwnerSensorDashboardPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/tickets",
        component: OwnerTicketsPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/*",
        component: OwnerPage,
        allowedRoles: [RoleName.Owner],
      },
      {
        path: "/dashboard/owner/profile",
        component: Profile,
        allowedRoles: [RoleName.Owner],
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
        path: "/dashboard/manager/milestones",
        component: ManagerProductionMilestonesPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/crop-seasons/:cropSeasonId/milestones",
        component: ManagerMilestonesPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/crop-seasons/:cropSeasonId/milestones/:milestoneId",
        component: ManagerMilestoneDetailPage,
        allowedRoles: [RoleName.Manager],
      },
      {
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
        path: "/dashboard/manager/sensor-readings/:assignmentId",
        component: ManagerSensorReadingPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/sensor-dashboard",
        component: ManagerSensorDashboardPage,
        allowedRoles: [RoleName.Manager],
      },
      {
        path: "/dashboard/manager/tickets",
        component: ManagerTicketsPage,
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
