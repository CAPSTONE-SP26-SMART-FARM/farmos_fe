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
  },
  USERS: {
    BASE: "/users",
    BY_ID: (id: string | number) => `/users/${id}`,
  },
  FARMS: {
    BASE: "/farms",
    BY_ID: (id: string | number) => `/farms/${id}`,
    MY_FARM: "/farms/my-farm",
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
    FARMS: {
      LIST: "/admin/farms",
      DETAIL: (id: string) => `/admin/farms/${id}`,
    },
    IOT_DEVICE_TEMPLATE: {
      CREATE: "/iot-device-template",
      LIST: "/iot-device-template/admin",
      DETAIL: (id: string) => `/iot-device-template/${id}/admin`,
      UPDATE: (id: string) => `/iot-device-template/${id}/admin`,
      DELETE: (id: string) => `/iot-device-template/${id}/admin`,
    },
    SENSOR_TEMPLATE: {
      CREATE: "/sensor-template",
      LIST: "/sensor-template/admin",
      DETAIL: (id: string) => `/sensor-template/${id}/admin`,
      UPDATE: (id: string) => `/sensor-template/${id}/admin`,
      DELETE: (id: string) => `/sensor-template/${id}/admin`,
    },
  },
  OWNER: {
    MY_DOCTOR: {
      LIST: "/doctor-assignment/owner/my-doctors",
      DETAIL: (id: string) => `/doctor-assignment/owner/my-doctors/${id}`,
    },
  },
  FARM_MEMBERS: {
    BASE: "/farm-members",
    BY_ID: (id: string) => `/farm-members/${id}`,
  },
  ZONES: {
    LIST_BY_FARM: (farmId: string) => `/farms/${farmId}/zones`,
    DETAIL: (id: string) => `/zones/${id}`,
    CREATE: "/zones",
    UPDATE: (id: string) => `/zones/${id}`,
    MANAGERS: {
      LIST: (zoneId: string) => `/zones/${zoneId}/managers`,
      ASSIGN: (zoneId: string) => `/zones/${zoneId}/managers/assign`,
      ASSIGN_BULK: (zoneId: string) => `/zones/${zoneId}/managers/assign-bulk`,
      REMOVE: (zoneId: string, managerId: string) =>
        `/zones/${zoneId}/managers/${managerId}`,
      REMOVE_BULK: (zoneId: string) => `/zones/${zoneId}/managers/bulk`,
      UPDATE_PRIMARY: (zoneId: string, managerId: string) =>
        `/zones/${zoneId}/managers/${managerId}/primary`,
    },
  },
  CROP_SEASON: {
    MANAGER: {
      CREATE: "/crop-seasons",
      LIST_BY_ZONE: (zoneId: string) => `/crop-seasons/zone/${zoneId}`,
      DETAIL: (id: string) => `/crop-seasons/${id}`,
      UPDATE: (id: string) => `/crop-seasons/${id}`,
      SEND_REQUEST: (id: string) => `/crop-seasons/${id}/send-request`,
      LIST_REQUESTS: (cropSeasonId: string) =>
        `/crop-seasons/${cropSeasonId}/requests`,
      REQUEST_DETAIL: (requestId: string) =>
        `/production-requests/${requestId}`,
    },
    OWNER: {
      LIST_BY_ZONE: (zoneId: string) => `/owner/crop-seasons/zone/${zoneId}`,
      DETAIL: (id: string) => `/owner/crop-seasons/${id}`,
      LIST_REQUESTS: (cropSeasonId: string) =>
        `/owner/crop-seasons/${cropSeasonId}/requests`,
      REQUEST_DETAIL: (requestId: string) =>
        `/owner/production-requests/${requestId}`,
      REPLY_REQUEST: (requestId: string) =>
        `/owner/production-requests/${requestId}/reply`,
    },
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
  admin: {
    farms: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "farms",
        "list",
        query,
      ],
      detail: (id: string) => ["admin", "farms", id],
    },
    iotDeviceTemplates: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "iot-device-templates",
        "list",
        query,
      ],
      detail: (id: string) => ["admin", "iot-device-templates", id],
    },
    sensorTemplates: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "sensor-templates",
        "list",
        query,
      ],
      detail: (id: string) => ["admin", "sensor-templates", id],
    },
  },
  owner: {
    farm: {
      my: () => ["owner", "farm", "my"],
    },
  },
  farmMembers: {
    all: ["farm-members"],
    list: (filters?: Record<string, unknown>) => [
      "farm-members",
      "list",
      filters,
    ],
    detail: (id: string) => ["farm-members", id],
  },
  zones: {
    all: ["zones"],
    byFarm: (farmId: string) => ["zones", "farm", farmId],
    listByFarm: (farmId: string, filters?: Record<string, unknown>) => [
      "zones",
      "farm",
      farmId,
      filters,
    ],
    detail: (id: string) => ["zones", id],
    managers: {
      byZone: (zoneId: string) => ["zones", zoneId, "managers"],
      list: (zoneId: string, filters?: Record<string, unknown>) => [
        "zones",
        zoneId,
        "managers",
        filters,
      ],
    },
  },
  cropSeasons: {
    all: ["crop-seasons"],
    listByZone: (zoneId: string, filters?: Record<string, unknown>) => [
      "crop-seasons",
      "zone",
      zoneId,
      filters,
    ],
    detail: (id: string) => ["crop-seasons", id],
    requests: (cropSeasonId: string, filters?: Record<string, unknown>) => [
      "crop-seasons",
      cropSeasonId,
      "requests",
      filters,
    ],
    requestDetail: (requestId: string) => ["production-requests", requestId],
  },
} as const;
