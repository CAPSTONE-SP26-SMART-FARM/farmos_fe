import MainLayout from "@/components/layout/MainLayout/MainLayout";
import SimpleLayout from "@/components/layout/SimpleLayout/SimpleLayout";
import AdminDashboardPage from "@/pages/AdminPage/AdminDashboardPage";
import AdminDoctorApplicationsPage from "@/pages/AdminPage/AdminDoctorApplicationsPage";
import AdminDoctorAssignmentPage from "@/pages/AdminPage/AdminDoctorAssignmentPage";
import AdminDoctorPerformancePage from "@/pages/AdminPage/AdminDoctorPerformancePage";
import AdminFarmsPage from "@/pages/AdminPage/AdminFarmsPage";
import AdminIotTemplatesPage from "@/pages/AdminPage/AdminIotTemplatesPage";
import AdminPackagesPage from "@/pages/AdminPage/AdminPackagesPage";
import AdminTicketAnalyticsPage from "@/pages/AdminPage/AdminTicketAnalyticsPage";
import AdminUsersPage from "@/pages/AdminPage/AdminUsersPage";
import DoctorPage from "@/pages/DoctorPage/DoctorPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage/ForgotPasswordPage";
import HomePage from "@/pages/HomePage/HomePage";
import LoginPage from "@/pages/LoginPage/LoginPage";
import ManagerPage from "@/pages/ManagerPage/ManagerPage";
import ManagerCropSeasonsPage from "@/pages/ManagerPage/CropSeasons/ManagerCropSeasonsPage";
import OwnerPage from "@/pages/OwnerPage/OwnerPage";
import RegisterPage from "@/pages/RegisterPage/RegisterPage";
import type { AppRoutes } from "./types";
import DashboardLayout from "@/components/layout/DashboardLayout/DashboardLayout";
import UpsertProfile from "@/pages/DoctorPage/UpsertProfile/UpsertProfile";
import ListRequest from "@/pages/DoctorPage/ListRequest/ListRequest";
import ListRequestAdmin from "@/pages/AdminPage/RequestDoctor/ListRequest";
import DoctorAssignmentsPage from "@/pages/DoctorPage/Assignment/DoctorAssignmentsPage";
import OwnerMyDoctorsPage from "@/pages/OwnerPage/MyDoctor/OwnerMyDoctorsPage";

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
				allowedRoles: ["admin"],
			},
			{
				path: "/dashboard/admin/packages",
				component: AdminPackagesPage,
				allowedRoles: ["admin"],
			},
			{
				path: "/dashboard/admin/doctor-applications",
				component: AdminDoctorApplicationsPage,
				allowedRoles: ["admin"],
			},
			{
				path: "/dashboard/admin/doctor-assignment",
				component: AdminDoctorAssignmentPage,
				allowedRoles: ["admin"],
			},
			{
				path: "/dashboard/admin/doctor-performance",
				component: AdminDoctorPerformancePage,
				allowedRoles: ["admin"],
			},
			{
				path: "/dashboard/admin/ticket-analytics",
				component: AdminTicketAnalyticsPage,
				allowedRoles: ["admin"],
			},
			{
				path: "/dashboard/admin/iot-templates",
				component: AdminIotTemplatesPage,
				allowedRoles: ["admin"],
			},
			{
				path: "/dashboard/admin/users",
				component: AdminUsersPage,
				allowedRoles: ["admin"],
			},
			{
				path: "/dashboard/admin/farms",
				component: AdminFarmsPage,
				allowedRoles: ["admin"],
			},
			{
				path: "/dashboard/admin/doctor-requests",
				component: ListRequestAdmin,
				allowedRoles: ["admin"],
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
				allowedRoles: ["owner"],
			},
			{
				path: "/dashboard/owner/my-doctor",
				component: OwnerMyDoctorsPage,
				allowedRoles: ["owner"],
			},
			{
				path: "/dashboard/owner/*",
				component: OwnerPage,
				allowedRoles: ["owner"],
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
				allowedRoles: ["manager"],
			},
			{
				path: "/dashboard/manager/crop-seasons",
				component: ManagerCropSeasonsPage,
				allowedRoles: ["manager"],
			},
			{
				path: "/dashboard/manager/*",
				component: ManagerPage,
				allowedRoles: ["manager"],
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
				allowedRoles: ["doctor"],
			},
			{
				path: "/dashboard/doctor/update-profile",
				component: UpsertProfile,
				allowedRoles: ["doctor"],
			},
			{
				path: "/dashboard/doctor/my-request",
				component: ListRequest,
				allowedRoles: ["doctor"],
			},
			{
				path: "/dashboard/doctor/*",
				component: DoctorPage,
				allowedRoles: ["doctor"],
			},
			{
				path: "/dashboard/doctor/my-assignments",
				component: DoctorAssignmentsPage,
				allowedRoles: ["doctor"],
			},
		],
	},
];

export default routes;
