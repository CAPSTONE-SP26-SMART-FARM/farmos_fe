import type { ComponentType } from "react";

export interface RouteChild {
  path: string;
  component: ComponentType;
  allowedRoles?: string[];
}

export interface RouteConfig {
  layout: ComponentType;
  isRestricted?: boolean;
  children: RouteChild[];
}

export type AppRoutes = RouteConfig[];
