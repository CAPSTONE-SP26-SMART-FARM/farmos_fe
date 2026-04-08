import type { RoleNameType } from "@/constants/role";
import type { ComponentType } from "react";

export interface RouteChild {
	path: string;
	component: ComponentType;
	allowedRoles?: RoleNameType[];
}

export interface RouteConfig {
	layout: ComponentType;
	isRestricted?: boolean;
	children: RouteChild[];
}

export type AppRoutes = RouteConfig[];
