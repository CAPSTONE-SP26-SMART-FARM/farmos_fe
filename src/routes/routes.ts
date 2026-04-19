import MainLayout from "@/components/layout/MainLayout/MainLayout";
import SimpleLayout from "@/components/layout/SimpleLayout/SimpleLayout";
import AdminDashboardPage from "@/pages/AdminPage/Dashboard/AdminDashboardPage";
import AdminDoctorApplicationsPage from "@/pages/AdminPage/DoctorApplications/AdminDoctorApplicationsPage";
import AdminDoctorAssignmentPage from "@/pages/AdminPage/DoctorAssignment/AdminDoctorAssignmentPage";
import AdminDoctorPerformancePage from "@/pages/AdminPage/DoctorPerformance/AdminDoctorPerformancePage";
import AdminFarmsPage from "@/pages/AdminPage/Farms/AdminFarmsPage";
import AdminIotTemplatesPage from "@/pages/AdminPage/IotTemplates/AdminIotTemplatesPage";
import AdminEmployeeTaskTemplatesPage from "@/pages/AdminPage/EmployeeTaskTemplates/AdminEmployeeTaskTemplatesPage";
import AdminMilestoneTemplatePage from "@/pages/AdminPage/AdminMilestoneTemplatePage";
import AdminPackagesPage from "@/pages/AdminPage/Packages/AdminPackagesPage";
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
        path: "/dashboard/admin/packages",
        component: AdminPackagesPage,
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
