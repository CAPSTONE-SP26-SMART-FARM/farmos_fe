//endpoints
export const API_ENDPOINTS = {
	AUTH: {
		LOGIN: "/auth/login",
		REGISTER: "/auth/register",
		REFRESH: "/auth/refresh-token",
		LOGOUT: "/auth/logout",
		ME: "/auth/me",
		FORGOT_PASSWORD: "/auth/forgot-password",
		OTP: "/auth/otp",
		TWO_FACTOR_SETUP: "/auth/2fa/setup",
		TWO_FACTOR_DISABLE: "/auth/2fa/disable",
		SEND_OTP: "/auth/otp",
		UPDATE_PROFLIE: "/profile/update",
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
	DOCTORS: {
		PROFILE: {
			UPSERT_PROFILE: "/doctor-profile/upsert",
			REQUEST: "/doctor-profile/request",
			LIST: "/doctor-profile/my-requests",
			DETAIL: (id: string) => `/doctor-profile/my-requests/${id}`,
		},
		ASSIGNMENT: {
			ME: "/doctor-assignment/doctor/my-assignments",
			DETAIL: (id: string) => `/doctor-assignment/doctor/my-assignments/${id}`,
		},
	},
	ADMIN: {
		DOCTOR_PROFILE: {
			LIST: "/doctor-profile/admin/requests",
			DETAIL: (id: string) => `/doctor-profile/admin/requests/${id}`,
			CHANGE_REQUEST: (id: string) =>
				`/doctor-profile/admin/requests/${id}/status`,
		},
		DOCTOR_ASSIGNMENT: {
			ASSIGN: "/doctor-assignment",
			LIST: "/doctor-assignment/admin",
			DETAIL: (id: string) => `/doctor-assignment/admin/${id}`,
		},
	},
	OWNER: {
		MY_DOCTOR: {
			LIST: "/doctor-assignment/owner/my-doctors",
			DETAIL: (id: string) => `/doctor-assignment/owner/my-doctors/${id}`,
		},
	},
	PROFILE: {},
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
