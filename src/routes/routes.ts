import MainLayout from "@/components/layout/MainLayout/MainLayout";
import SimpleLayout from "@/components/layout/SimpleLayout/SimpleLayout";
import Dashboard from "@/pages/Dashboard/Dashboard";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage/ForgotPasswordPage";
import HomePage from "@/pages/HomePage/HomePage";
import LoginPage from "@/pages/LoginPage/LoginPage";
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
  // Owner Dashboard Routes
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/owner",
        component: Dashboard,
        allowedRoles: ["Owner"],
      },
      {
        path: "/dashboard/owner/*",
        component: Dashboard,
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
        component: Dashboard,
        allowedRoles: ["Manager"],
      },
      {
        path: "/dashboard/manager/*",
        component: Dashboard,
        allowedRoles: ["Manager"],
      },
    ],
  },
  // Farmer Dashboard Routes
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/farmer",
        component: Dashboard,
        allowedRoles: ["Farmer"],
      },
      {
        path: "/dashboard/farmer/*",
        component: Dashboard,
        allowedRoles: ["Farmer"],
      },
    ],
  },
  // Rancher Dashboard Routes
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/rancher",
        component: Dashboard,
        allowedRoles: ["Rancher"],
      },
      {
        path: "/dashboard/rancher/*",
        component: Dashboard,
        allowedRoles: ["Rancher"],
      },
    ],
  },
  // Doctor Dashboard Routes
  {
    layout: DashboardLayout,
    children: [
      {
        path: "/dashboard/doctor",
        component: Dashboard,
        allowedRoles: ["Doctor"],
      },
      {
        path: "/dashboard/doctor/*",
        component: Dashboard,
        allowedRoles: ["Doctor"],
      },
    ],
  },
];

export default routes;
