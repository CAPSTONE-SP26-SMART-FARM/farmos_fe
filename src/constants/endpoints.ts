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
  SUBSCRIPTION_PLANS: {
    BASE: "/plans",
    BY_ID: (id: string) => `/plans/${id}`,
    ARCHIVE: (id: string) => `/plans/${id}/archive`,
    VERSIONS: (id: string) => `/plans/${id}/versions`,
  },
  SUBSCRIPTIONS: {
    BASE: "/subscriptions",
    MY: "/subscriptions/my",
    MY_HISTORY: "/subscriptions/my/history",
    BY_ID: (id: string) => `/subscriptions/${id}`,
    RENEW: (id: string) => `/subscriptions/${id}/renew`,
    CANCEL: (id: string) => `/subscriptions/${id}/cancel`,
    AUTO_RENEW: (id: string) => `/subscriptions/${id}/auto-renew`,
    PLAN_VERSION: (id: string) => `/subscriptions/${id}/plan-version`,
    ENTITLEMENTS: (id: string) => `/subscriptions/${id}/entitlements`,
    USAGE: (id: string) => `/subscriptions/${id}/usage`,
    PAYMENT_STATUS: (id: string) => `/subscriptions/${id}/payment-status`,
  },
  INVOICES: {
    BASE: "/invoices",
    MY: "/invoices/my",
    BY_ID: (id: string) => `/invoices/${id}`,
    CHECKOUT: (id: string) => `/invoices/${id}/checkout`,
    VOID: (id: string) => `/invoices/${id}/void`,
  },
  TRANSACTIONS: {
    BY_ID: (id: string) => `/transactions/${id}`,
  },
  CREDITS: {
    MY: "/credits/my",
    MY_HISTORY: "/credits/my/history",
    BASE: "/credits",
  },
  SERVICE_PACKAGES: {
    BASE: "/service-packages",
    BY_ID: (id: string) => `/service-packages/${id}`,
    ARCHIVE: (id: string) => `/service-packages/${id}/archive`,
    UNARCHIVE: (id: string) => `/service-packages/${id}/unarchive`,
    PURCHASE: (id: string) => `/service-packages/${id}/purchase`,
    PAYMENT_STATUS: (id: string) => `/service-packages/${id}/payment-status`,
  },
  FEATURES: {
    BASE: "/features",
    BY_CODE: (featureCode: string) => `/features/${featureCode}`,
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
    IOT_DEVICE: {
      LIST: "/iot-device-provisioning/admin/iot-device",
      DETAIL: (deviceId: string) =>
        `/iot-device-provisioning/admin/iot-device/${deviceId}`,
      CREATE_BATCH: "/iot-device-provisioning/admin/iot-device",
      CREATE_BATCH_BY_FARM: (farmId: string) =>
        `/iot-device-provisioning/admin/farm/${farmId}`,
      UPDATE: (deviceId: string) =>
        `/iot-device-provisioning/admin/iot-device/${deviceId}`,
      DELETE: (deviceId: string) =>
        `/iot-device-provisioning/admin/iot-device/${deviceId}`,
      CREATE_SENSOR_BATCH: (deviceId: string) =>
        `/iot-device-provisioning/admin/sensor/iot-device/${deviceId}`,
      UPDATE_SENSOR: (deviceId: string, sensorId: string) =>
        `/iot-device-provisioning/admin/sensor/iot-device/${deviceId}/${sensorId}`,
      DELETE_SENSOR: (deviceId: string, sensorId: string) =>
        `/iot-device-provisioning/admin/sensor/iot-device/${deviceId}/${sensorId}`,
      ASSIGN_OWNER: "/iot-device-provisioning/admin/provision/assign-owner",
      UNASSIGN_OWNER: "/iot-device-provisioning/admin/provision/unassign-owner",
    },
  },
  MANAGER: {
    ZONES: {
      LIST: "/manager/zones",
    },
    EMPLOYEE_TASK_TEMPLATE: {
      LIST: "/manager/employee-task-template",
      DETAIL: (id: string) => `/manager/employee-task-template/${id}`,
    },
    IOT_DEVICE: {
      LIST: "/iot-device-provisioning/manager/iot-device",
      DETAIL: (deviceId: string) =>
        `/iot-device-provisioning/manager/iot-device/${deviceId}`,
    },
    IOT_DEVICE_TEMPLATE: {
      LIST: "/manager/iot-device-template",
      DETAIL: (id: string) => `/manager/iot-device-template/${id}`,
    },
    SENSOR_TEMPLATE: {
      LIST: "/manager/sensor-template",
      DETAIL: (id: string) => `/manager/sensor-template/${id}`,
    },
    MILESTONE_TEMPLATE: {
      LIST: "/manager/template-product-milestone-for-crop-season",
      DETAIL: (id: string) =>
        `/manager/template-product-milestone-for-crop-season/${id}`,
    },
    PRODUCTION_MILESTONE: {
      LIST_ALL: "/production-milestone/manager/crop-season",
      LIST: (cropSeasonId: string) =>
        `/production-milestone/manager/crop-season/${cropSeasonId}`,
      CREATE_BATCH: (cropSeasonId: string) =>
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
    SENSOR_READING: {
      LATEST: (assignmentId: string) =>
        `/sensor-reading/manager/assignment/${assignmentId}/latest`,
    },
    SENSOR: {
      LIST: (iotDeviceId: string) =>
        `/sensor/manager/iot-device/${iotDeviceId}`,
      CREATE: (iotDeviceId: string) =>
        `/sensor/manager/iot-device/${iotDeviceId}`,
      DETAIL: (sensorId: string, iotDeviceId: string) =>
        `/sensor/${sensorId}/manager/iot-device/${iotDeviceId}`,
      UPDATE: (sensorId: string, iotDeviceId: string) =>
        `/sensor/${sensorId}/manager/iot-device/${iotDeviceId}`,
      DELETE: (sensorId: string, iotDeviceId: string) =>
        `/sensor/${sensorId}/manager/iot-device/${iotDeviceId}`,
    },
    EMPLOYEE_TASK: {
      LIST: (milestoneId: string) =>
        `/employee-task/manager/production-milestone/${milestoneId}`,
      CREATE_BATCH: (milestoneId: string) =>
        `/employee-task/manager/production-milestone/${milestoneId}`,
      DETAIL: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/manager/production-milestone/${milestoneId}`,
      UPDATE: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/manager/production-milestone/${milestoneId}`,
      DELETE: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/manager/production-milestone/${milestoneId}`,
      ASSIGN: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/manager/production-milestone/${milestoneId}/assign`,
      UNASSIGN: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/manager/production-milestone/${milestoneId}/unassign`,
      ELIGIBLE_FARMERS: (milestoneId: string) =>
        `/employee-task/manager/production-milestone/${milestoneId}/eligible-farmers`,
    },
  },
  OWNER: {
    ZONES: {
      LIST: "/owner/zones",
    },
    MY_DOCTOR: {
      LIST: "/doctor-assignment/owner/my-doctors",
      DETAIL: (id: string) => `/doctor-assignment/owner/my-doctors/${id}`,
    },
    EMPLOYEE_TASK_TEMPLATE: {
      LIST: "/owner/employee-task-template",
      DETAIL: (id: string) => `/owner/employee-task-template/${id}`,
    },
    IOT_DEVICE: {
      LIST: "/iot-device-provisioning/owner/iot-device",
      DETAIL: (deviceId: string) =>
        `/iot-device-provisioning/owner/iot-device/${deviceId}`,
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
    MILESTONE_TEMPLATE: {
      LIST: "/owner/template-product-milestone-for-crop-season",
      DETAIL: (id: string) =>
        `/owner/template-product-milestone-for-crop-season/${id}`,
    },
    PRODUCTION_MILESTONE: {
      LIST_ALL: "/production-milestone/owner/crop-season",
      LIST: (cropSeasonId: string) =>
        `/production-milestone/owner/crop-season/${cropSeasonId}`,
      DETAIL: (milestoneId: string, cropSeasonId: string) =>
        `/production-milestone/${milestoneId}/owner/crop-season/${cropSeasonId}`,
    },
    MILESTONE_IOT_DEVICE: {
      ASSIGNMENT: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/assignment`,
      AVAILABLE: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/available`,
      ASSIGN: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/assign`,
      UNASSIGN: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/unassign`,
    },
    MILESTONE_SENSOR_BINDING: {
      LIST: (assignmentId: string) =>
        `/production-milestone-iot-device-sensor-binding/owner/assignment/${assignmentId}`,
      BIND: (assignmentId: string) =>
        `/production-milestone-iot-device-sensor-binding/owner/assignment/${assignmentId}/bind`,
      UNBIND: (assignmentId: string) =>
        `/production-milestone-iot-device-sensor-binding/owner/assignment/${assignmentId}/unbind`,
    },
    SENSOR_THRESHOLD: {
      GET: (assignmentId: string) =>
        `/sensor-threshold/owner/assignment/${assignmentId}`,
      CREATE: (assignmentId: string) =>
        `/sensor-threshold/owner/assignment/${assignmentId}`,
      UPDATE: (assignmentId: string) =>
        `/sensor-threshold/owner/assignment/${assignmentId}`,
    },
    SENSOR_READING: {
      LATEST: (assignmentId: string) =>
        `/sensor-reading/owner/assignment/${assignmentId}/latest`,
    },
    EMPLOYEE_TASK: {
      LIST: (milestoneId: string) =>
        `/employee-task/owner/production-milestone/${milestoneId}`,
      CREATE_BATCH: (milestoneId: string) =>
        `/employee-task/owner/production-milestone/${milestoneId}`,
      DETAIL: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/owner/production-milestone/${milestoneId}`,
      UPDATE: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/owner/production-milestone/${milestoneId}`,
      DELETE: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/owner/production-milestone/${milestoneId}`,
      ASSIGN: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/owner/production-milestone/${milestoneId}/assign`,
      UNASSIGN: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/owner/production-milestone/${milestoneId}/unassign`,
      ELIGIBLE_FARMERS: (milestoneId: string) =>
        `/employee-task/owner/production-milestone/${milestoneId}/eligible-farmers`,
    },
  },
  ALERTS: {
    LIST: "/alerts",
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
      AVAILABLE: (zoneId: string) => `/zones/${zoneId}/available-managers`,
      ASSIGN: (zoneId: string) => `/zones/${zoneId}/managers/assign`,
      ASSIGN_BULK: (zoneId: string) => `/zones/${zoneId}/managers/assign-bulk`,
      REMOVE: (zoneId: string, managerId: string) =>
        `/zones/${zoneId}/managers/${managerId}`,
      REMOVE_BULK: (zoneId: string) => `/zones/${zoneId}/managers/bulk`,
      UPDATE_PRIMARY: (zoneId: string, managerId: string) =>
        `/zones/${zoneId}/managers/${managerId}/primary`,
    },
  },
  TICKET: {
    INCIDENT: {
      CREATE: "/ticket/incident",
      DOCTOR_LIST: "/ticket/incident/doctor",
      DOCTOR_DETAIL: (ticketId: string) =>
        `/ticket/incident/doctor/${ticketId}`,
      DOCTOR_ACCEPT: (ticketId: string) =>
        `/ticket/incident/doctor/${ticketId}/accept`,
      END: (ticketId: string) => `/ticket/incident/${ticketId}/end`,
      OWNER_LIST_BY_FARM: (farmId: string) =>
        `/ticket/incident/owner/farm/${farmId}`,
      OWNER_DETAIL: (ticketId: string) => `/ticket/incident/owner/${ticketId}`,
      MANAGER_LIST_BY_ZONE: (zoneId: string) =>
        `/ticket/incident/manager/zone/${zoneId}`,
      MANAGER_DETAIL: (ticketId: string) =>
        `/ticket/incident/manager/${ticketId}`,
    },
    MESSAGES: {
      LIST: (ticketId: string) => `/ticket/${ticketId}/messages`,
      CREATE: (ticketId: string) => `/ticket/${ticketId}/messages`,
    },
    PRESCRIPTIONS: {
      LIST: (ticketId: string) => `/ticket/${ticketId}/prescriptions`,
      CREATE: (ticketId: string) => `/ticket/${ticketId}/prescriptions`,
      DETAIL: (ticketId: string, prescriptionId: string) =>
        `/ticket/${ticketId}/prescriptions/${prescriptionId}`,
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
  subscriptionPlans: {
    all: ["subscription-plans"],
    list: (query?: Record<string, unknown>) => [
      "subscription-plans",
      "list",
      ...(query !== undefined ? [query] : []),
    ],
    detail: (id: string) => ["subscription-plans", id],
    versions: (planId: string, query?: Record<string, unknown>) => [
      "subscription-plans",
      planId,
      "versions",
      ...(query !== undefined ? [query] : []),
    ],
  },
  subscriptions: {
    all: ["subscriptions"],
    list: (query?: Record<string, unknown>) => [
      "subscriptions",
      "list",
      ...(query !== undefined ? [query] : []),
    ],
    my: () => ["subscriptions", "my"],
    myHistory: (query?: Record<string, unknown>) => [
      "subscriptions",
      "my-history",
      ...(query !== undefined ? [query] : []),
    ],
    detail: (id: string) => ["subscriptions", id],
    entitlements: (id: string, query?: Record<string, unknown>) => [
      "subscriptions",
      id,
      "entitlements",
      ...(query !== undefined ? [query] : []),
    ],
    usage: (id: string, query?: Record<string, unknown>) => [
      "subscriptions",
      id,
      "usage",
      ...(query !== undefined ? [query] : []),
    ],
    paymentStatus: (id: string) => ["subscriptions", id, "payment-status"],
  },
  invoices: {
    all: ["invoices"],
    listMy: (query?: Record<string, unknown>) => [
      "invoices",
      "my",
      ...(query !== undefined ? [query] : []),
    ],
    detail: (id: string) => ["invoices", id],
    transaction: (id: string) => ["transactions", id],
  },
  credits: {
    all: ["credits"],
    my: () => ["credits", "my"],
    myHistory: (query?: Record<string, unknown>) => [
      "credits",
      "my-history",
      ...(query !== undefined ? [query] : []),
    ],
  },
  servicePackages: {
    all: ["service-packages"],
    list: (query?: Record<string, unknown>) => [
      "service-packages",
      "list",
      ...(query !== undefined ? [query] : []),
    ],
    detail: (id: string) => ["service-packages", id],
    paymentStatus: (id: string) => ["service-packages", id, "payment-status"],
  },
  features: {
    all: ["features"],
    list: (query?: Record<string, unknown>) => [
      "features",
      "list",
      ...(query !== undefined ? [query] : []),
    ],
    detail: (code: string) => ["features", code],
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
        ...(query !== undefined ? [query] : []),
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
    iotDevices: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "iot-devices",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (deviceId: string) => ["admin", "iot-devices", deviceId],
    },
  },
  manager: {
    zones: {
      list: (query?: Record<string, unknown>) => [
        "manager",
        "zones",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["manager", "zones", id],
    },
    employeeTaskTemplates: {
      list: (query?: Record<string, unknown>) => [
        "manager",
        "employee-task-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["manager", "employee-task-templates", id],
    },
    iotDevices: {
      list: (query?: Record<string, unknown>) => [
        "manager",
        "iot-devices",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (deviceId: string) => [
        "manager",
        "iot-devices",
        deviceId,
      ],
    },
    iotDeviceTemplates: {
      list: (query?: Record<string, unknown>) => [
        "manager",
        "iot-device-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["manager", "iot-device-templates", id],
    },
    sensorTemplates: {
      list: (query?: Record<string, unknown>) => [
        "manager",
        "sensor-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["manager", "sensor-templates", id],
    },
    milestoneTemplates: {
      list: (query?: Record<string, unknown>) => [
        "manager",
        "milestone-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["manager", "milestone-templates", id],
    },
    productionMilestones: {
      listAll: (query?: Record<string, unknown>) => [
        "manager",
        "production-milestones",
        "all",
        ...(query !== undefined ? [query] : []),
      ],
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
      availableDevices: (
        milestoneId: string,
        query?: Record<string, unknown>,
      ) => [
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
    sensorReadings: {
      latest: (assignmentId: string) => [
        "manager",
        "sensor-readings",
        "assignment",
        assignmentId,
        "latest",
      ],
    },
    employeeTasks: {
      list: (milestoneId: string, query?: Record<string, unknown>) => [
        "manager",
        "employee-tasks",
        milestoneId,
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (taskId: string, milestoneId: string) => [
        "manager",
        "employee-tasks",
        taskId,
        milestoneId,
      ],
      eligibleFarmers: (milestoneId: string) => [
        "manager",
        "employee-tasks",
        milestoneId,
        "eligible-farmers",
      ],
    },
  },
  owner: {
    zones: {
      list: (query?: Record<string, unknown>) => [
        "owner",
        "zones",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
    },
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
      list: (query?: Record<string, unknown>) => [
        "owner",
        "iot-devices",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (deviceId: string) => [
        "owner",
        "iot-devices",
        deviceId,
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
    sensorReadings: {
      latest: (assignmentId: string) => [
        "owner",
        "sensor-readings",
        "assignment",
        assignmentId,
        "latest",
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
    milestoneTemplates: {
      list: (query?: Record<string, unknown>) => [
        "owner",
        "milestone-templates",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["owner", "milestone-templates", id],
    },
    productionMilestones: {
      listAll: (query?: Record<string, unknown>) => [
        "owner",
        "production-milestones",
        "all",
        ...(query !== undefined ? [query] : []),
      ],
      list: (cropSeasonId: string, query?: Record<string, unknown>) => [
        "owner",
        "production-milestones",
        cropSeasonId,
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (milestoneId: string) => [
        "owner",
        "production-milestones",
        milestoneId,
      ],
      assignment: (milestoneId: string) => [
        "owner",
        "production-milestones",
        milestoneId,
        "assignment",
      ],
      availableDevices: (
        milestoneId: string,
        query?: Record<string, unknown>,
      ) => [
        "owner",
        "production-milestones",
        milestoneId,
        "available-devices",
        ...(query !== undefined ? [query] : []),
      ],
      boundSensors: (assignmentId: string) => [
        "owner",
        "production-milestones",
        "assignment",
        assignmentId,
        "sensors",
      ],
      thresholds: (assignmentId: string) => [
        "owner",
        "production-milestones",
        "assignment",
        assignmentId,
        "thresholds",
      ],
    },
    employeeTasks: {
      list: (milestoneId: string, query?: Record<string, unknown>) => [
        "owner",
        "employee-tasks",
        milestoneId,
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (taskId: string, milestoneId: string) => [
        "owner",
        "employee-tasks",
        taskId,
        milestoneId,
      ],
      eligibleFarmers: (milestoneId: string) => [
        "owner",
        "employee-tasks",
        milestoneId,
        "eligible-farmers",
      ],
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
      availableByZone: (zoneId: string) => [
        "zones",
        zoneId,
        "available-managers",
      ],
      availableList: (zoneId: string, filters?: Record<string, unknown>) => [
        "zones",
        zoneId,
        "available-managers",
        filters,
      ],
    },
  },
  alerts: {
    list: (query?: Record<string, unknown>) => [
      "alerts",
      "list",
      ...(query !== undefined ? [query] : []),
    ],
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
  tickets: {
    all: ["tickets"],
    ownerList: (farmId: string, query?: Record<string, unknown>) => [
      "tickets",
      "owner",
      "farm",
      farmId,
      "list",
      ...(query !== undefined ? [query] : []),
    ],
    ownerDetail: (ticketId: string) => ["tickets", "owner", ticketId],
    managerList: (zoneId: string, query?: Record<string, unknown>) => [
      "tickets",
      "manager",
      "zone",
      zoneId,
      "list",
      ...(query !== undefined ? [query] : []),
    ],
    managerDetail: (ticketId: string) => ["tickets", "manager", ticketId],
    doctorList: (query?: Record<string, unknown>) => [
      "tickets",
      "doctor",
      "list",
      ...(query !== undefined ? [query] : []),
    ],
    doctorDetail: (ticketId: string) => ["tickets", "doctor", ticketId],
    messages: (ticketId: string, query?: Record<string, unknown>) => [
      "tickets",
      ticketId,
      "messages",
      ...(query !== undefined ? [query] : []),
    ],
    prescriptions: (ticketId: string, query?: Record<string, unknown>) => [
      "tickets",
      ticketId,
      "prescriptions",
      ...(query !== undefined ? [query] : []),
    ],
    prescriptionDetail: (ticketId: string, prescriptionId: string) => [
      "tickets",
      ticketId,
      "prescriptions",
      prescriptionId,
    ],
  },
} as const;
