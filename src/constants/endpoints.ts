//endpoints
export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: "/auth/login",
		REGISTER: "/auth/register",
		REFRESH: "/auth/refresh",
		LOGOUT: "/auth/logout",
		ME: "/auth/me",
		FORGOT_PASSWORD: "/auth/forgot-password",
	},
	USERS: {
		BASE: "/users",
		BY_ID: (id: string | number) => `/users/${id}`,
	},
	FARMS: {
		BASE: "/farms",
		BY_ID: (id: string | number) => `/farms/${id}`,
	},
	SENSORS: {
		BASE: "/sensors",
		BY_ID: (id: string | number) => `/sensors/${id}`,
		DATA: (id: string | number) => `/sensors/${id}/data`,
	},
} as const;

//query keys
export const QUERY_KEYS = {
	auth: {
		all: ["auth"],
		user: () => ["auth", "user"],
	},
	users: {
		all: ["users"],
		list: (filters?: Record<string, unknown>) => ["users", "list", filters],
		detail: (id: string | number) => ["users", id],
	},
	farms: {
		all: ["farms"],
		list: (filters?: Record<string, unknown>) => ["farms", "list", filters],
		detail: (id: string | number) => ["farms", id],
	},
	sensors: {
		all: ["sensors"],
		list: (farmId?: string | number) => ["sensors", "list", farmId],
		detail: (id: string | number) => ["sensors", id],
		data: (id: string | number) => ["sensors", id, "data"],
	},
} as const;
