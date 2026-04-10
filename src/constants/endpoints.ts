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
  PROFILE: {
    UPDATE: "/profile/update",
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
    USERS: {
      LIST: "/admin/users",
      DETAIL: (id: string) => `/admin/users/${id}`,
    },
    MILESTONE_TEMPLATES: {
      CREATE: "/template-product-milestone-for-crop-season",
      LIST: "/template-product-milestone-for-crop-season/admin",
      DETAIL: (id: string) =>
        `/template-product-milestone-for-crop-season/${id}/admin`,
      UPDATE: (id: string) =>
        `/template-product-milestone-for-crop-season/${id}/admin`,
      DELETE: (id: string) =>
        `/template-product-milestone-for-crop-season/${id}/admin`,
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
    EMPLOYEE_TASK_TEMPLATE: {
      CREATE: "/employee-task-template",
      LIST: "/employee-task-template/admin",
      DETAIL: (id: string) => `/employee-task-template/${id}/admin`,
      UPDATE: (id: string) => `/employee-task-template/${id}/admin`,
      DELETE: (id: string) => `/employee-task-template/${id}/admin`,
    },
  },
  MANAGER: {
    EMPLOYEE_TASK_TEMPLATE: {
      LIST: "/manager/employee-task-template",
      DETAIL: (id: string) => `/manager/employee-task-template/${id}`,
    },
    PRODUCTION_MILESTONE: {
      LIST: (cropSeasonId: string) =>
        `/production-milestone/manager/crop-season/${cropSeasonId}`,
      DETAIL: (milestoneId: string, cropSeasonId: string) =>
        `/production-milestone/${milestoneId}/manager/crop-season/${cropSeasonId}`,
      CREATE_ITEM: (cropSeasonId: string) =>
        `/production-milestone/manager/crop-season/${cropSeasonId}/item`,
      UPDATE: (milestoneId: string, cropSeasonId: string) =>
        `/production-milestone/${milestoneId}/manager/crop-season/${cropSeasonId}`,
      DELETE: (milestoneId: string, cropSeasonId: string) =>
        `/production-milestone/${milestoneId}/manager/crop-season/${cropSeasonId}`,
    },
    MILESTONE_IOT_DEVICE: {
      ASSIGNMENT: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/assignment`,
      AVAILABLE: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/available`,
      ASSIGN: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/assign`,
      UNASSIGN: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/unassign`,
    },
    MILESTONE_SENSOR_BINDING: {
      LIST: (assignmentId: string) =>
        `/production-milestone-iot-device-sensor-binding/manager/assignment/${assignmentId}`,
      BIND: (assignmentId: string) =>
        `/production-milestone-iot-device-sensor-binding/manager/assignment/${assignmentId}/bind`,
      UNBIND: (assignmentId: string) =>
        `/production-milestone-iot-device-sensor-binding/manager/assignment/${assignmentId}/unbind`,
    },
    SENSOR_THRESHOLD: {
      GET: (assignmentId: string) =>
        `/sensor-threshold/manager/assignment/${assignmentId}`,
      CREATE: (assignmentId: string) =>
        `/sensor-threshold/manager/assignment/${assignmentId}`,
      UPDATE: (assignmentId: string) =>
        `/sensor-threshold/manager/assignment/${assignmentId}`,
    },
    SENSOR: {
      LIST: (iotDeviceId: string) =>
        `/sensor/manager/iot-device/${iotDeviceId}`,
    },
  },
  OWNER: {
    MY_DOCTOR: {
      LIST: "/doctor-assignment/owner/my-doctors",
      DETAIL: (id: string) => `/doctor-assignment/owner/my-doctors/${id}`,
    },
    EMPLOYEE_TASK_TEMPLATE: {
      LIST: "/owner/employee-task-template",
      DETAIL: (id: string) => `/owner/employee-task-template/${id}`,
    },
    IOT_DEVICE: {
      LIST: (farmId: string) => `/iot-device/owner/farm/${farmId}`,
      CREATE: (farmId: string) => `/iot-device/owner/farm/${farmId}`,
      DETAIL: (deviceId: string, farmId: string) =>
        `/iot-device/owner/farm/${farmId}/${deviceId}`,
      UPDATE: (deviceId: string, farmId: string) =>
        `/iot-device/owner/farm/${farmId}/${deviceId}`,
      DELETE: (deviceId: string, farmId: string) =>
        `/iot-device/owner/farm/${farmId}/${deviceId}`,
      LOCK_SENSORS: (deviceId: string, farmId: string) =>
        `/iot-device/owner/farm/${farmId}/${deviceId}/lock-sensors`,
    },
    SENSOR: {
      LIST: (iotDeviceId: string) => `/sensor/owner/iot-device/${iotDeviceId}`,
      CREATE: (iotDeviceId: string) =>
        `/sensor/owner/iot-device/${iotDeviceId}`,
      UPDATE: (sensorId: string, iotDeviceId: string) =>
        `/sensor/${sensorId}/owner/iot-device/${iotDeviceId}`,
      DELETE: (sensorId: string, iotDeviceId: string) =>
        `/sensor/${sensorId}/owner/iot-device/${iotDeviceId}`,
    },
    IOT_DEVICE_TEMPLATE: {
      LIST: "/owner/iot-device-template",
      DETAIL: (id: string) => `/owner/iot-device-template/${id}`,
    },
    SENSOR_TEMPLATE: {
      LIST: "/owner/sensor-template",
      DETAIL: (id: string) => `/owner/sensor-template/${id}`,
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
    users: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "users",
        "list",
        query,
      ],
      detail: (id: string) => ["admin", "users", id],
    },
    milestoneTemplates: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "milestone-templates",
        "list",
        query,
      ],
      detail: (id: string) => ["admin", "milestone-templates", id],
    },
    iotDeviceTemplates: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "iot-device-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["admin", "iot-device-templates", id],
    },
    sensorTemplates: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "sensor-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["admin", "sensor-templates", id],
    },
    employeeTaskTemplates: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "employee-task-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["admin", "employee-task-templates", id],
    },
  },
  manager: {
    employeeTaskTemplates: {
      list: (query?: Record<string, unknown>) => [
        "manager",
        "employee-task-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["manager", "employee-task-templates", id],
    },
    productionMilestones: {
      list: (cropSeasonId: string, query?: Record<string, unknown>) => [
        "manager",
        "production-milestones",
        cropSeasonId,
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (milestoneId: string) => [
        "manager",
        "production-milestones",
        milestoneId,
      ],
      assignment: (milestoneId: string) => [
        "manager",
        "production-milestones",
        milestoneId,
        "assignment",
      ],
      availableDevices: (milestoneId: string, query?: Record<string, unknown>) => [
        "manager",
        "production-milestones",
        milestoneId,
        "available-devices",
        ...(query !== undefined ? [query] : []),
      ],
      boundSensors: (assignmentId: string) => [
        "manager",
        "production-milestones",
        "assignment",
        assignmentId,
        "sensors",
      ],
      thresholds: (assignmentId: string) => [
        "manager",
        "production-milestones",
        "assignment",
        assignmentId,
        "thresholds",
      ],
    },
    sensors: {
      list: (iotDeviceId: string, query?: Record<string, unknown>) => [
        "manager",
        "sensors",
        "device",
        iotDeviceId,
        "list",
        ...(query !== undefined ? [query] : []),
      ],
    },
  },
  owner: {
    farm: {
      my: () => ["owner", "farm", "my"],
    },
    employeeTaskTemplates: {
      list: (query?: Record<string, unknown>) => [
        "owner",
        "employee-task-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["owner", "employee-task-templates", id],
    },
    iotDevices: {
      list: (farmId: string, query?: Record<string, unknown>) => [
        "owner",
        "iot-devices",
        "farm",
        farmId,
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (deviceId: string, farmId: string) => [
        "owner",
        "iot-devices",
        deviceId,
        "farm",
        farmId,
      ],
    },
    sensors: {
      list: (iotDeviceId: string, query?: Record<string, unknown>) => [
        "owner",
        "sensors",
        "device",
        iotDeviceId,
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (sensorId: string, iotDeviceId: string) => [
        "owner",
        "sensors",
        sensorId,
        "device",
        iotDeviceId,
      ],
    },
    iotDeviceTemplates: {
      list: (query?: Record<string, unknown>) => [
        "owner",
        "iot-device-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["owner", "iot-device-templates", id],
    },
    sensorTemplates: {
      list: (query?: Record<string, unknown>) => [
        "owner",
        "sensor-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["owner", "sensor-templates", id],
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
