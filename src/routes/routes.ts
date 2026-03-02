import MainLayout from "@/components/layout/MainLayout/MainLayout";
import SimpleLayout from "@/components/layout/SimpleLayout/SimpleLayout";
import AdminPage from "@/pages/AdminPage/AdminPage";
import DoctorPage from "@/pages/DoctorPage/DoctorPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage/ForgotPasswordPage";
import HomePage from "@/pages/HomePage/HomePage";
import LoginPage from "@/pages/LoginPage/LoginPage";
import ManagerPage from "@/pages/ManagerPage/ManagerPage";
import OwnerPage from "@/pages/OwnerPage/OwnerPage";
import RegisterPage from "@/pages/RegisterPage/RegisterPage";
import type { AppRoutes } from "./types";
import DashboardLayout from "@/components/layout/DashboardLayout/DashboardLayout";

const routes: AppRoutes = [
  {
    layout: MainLayout,
    children: [
      {
        path: "/",
        component: HomePage,
      },
    ],
  },
  {
    layout: SimpleLayout,
    isRestricted: true,
    children: [
      {
        path: "/login",
        component: LoginPage,
      },
      {
        path: "/register",
        component: RegisterPage,
      },
      {
        path: "/forgot-password",
        component: ForgotPasswordPage,
      },
    ],
  },
  // Admin Dashboard Routes
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/admin",
        component: AdminPage,
        allowedRoles: ["Admin"],
      },
      {
        path: "/dashboard/admin/*",
        component: AdminPage,
        allowedRoles: ["Admin"],
      },
    ],
  },
  // Owner Dashboard Routes
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/owner",
        component: OwnerPage,
        allowedRoles: ["Owner"],
      },
      {
        path: "/dashboard/owner/*",
        component: OwnerPage,
        allowedRoles: ["Owner"],
      },
    ],
  },
  // Manager Dashboard Routes
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/manager",
        component: ManagerPage,
        allowedRoles: ["Manager"],
      },
      {
        path: "/dashboard/manager/*",
        component: ManagerPage,
        allowedRoles: ["Manager"],
      },
    ],
  },
  // Doctor Dashboard Routes
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/doctor",
        component: DoctorPage,
        allowedRoles: ["Doctor"],
      },
      {
        path: "/dashboard/doctor/*",
        component: DoctorPage,
        allowedRoles: ["Doctor"],
      },
    ],
  },
];

export default routes;
