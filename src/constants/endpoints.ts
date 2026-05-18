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
    SUMMARY: "/subscriptions/summary",
    MY: "/subscriptions/my",
    MY_HISTORY: "/subscriptions/my/history",
    MY_QUOTA: "/subscriptions/my/quota",
    BY_ID: (id: string) => `/subscriptions/${id}`,
    RENEW: (id: string) => `/subscriptions/${id}/renew`,
    CANCEL: (id: string) => `/subscriptions/${id}/cancel`,
    AUTO_RENEW: (id: string) => `/subscriptions/${id}/auto-renew`,
    UPGRADE: "/subscriptions/upgrade",
    PLAN_VERSION: (id: string) => `/subscriptions/${id}/plan-version`,
    ENTITLEMENTS: (id: string) => `/subscriptions/${id}/entitlements`,
    USAGE: (id: string) => `/subscriptions/${id}/usage`,
    QUOTA: (id: string) => `/subscriptions/${id}/quota`,
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
    // Module 3 — Public profile (B19). KHÔNG trả tier (BR-81).
    PUBLIC: (id: string) => `/doctors/${id}/public`,
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
    FEATURES: {
      LIST: "/features",
      CREATE: "/features",
      DETAIL: (featureCode: string) => `/features/${featureCode}`,
      UPDATE: (featureCode: string) => `/features/${featureCode}`,
      DELETE: (featureCode: string) => `/features/${featureCode}`,
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
      ASSIGN_FROM_KIT:
        "/iot-device-provisioning/admin/provision/assign-from-kit",
      UNASSIGN_OWNER: "/iot-device-provisioning/admin/provision/unassign-owner",
      LOG_LIST: "/iot-device-provisioning/admin/iot-device-log",
      LOG_DETAIL: (logId: string) =>
        `/iot-device-provisioning/admin/iot-device-log/${logId}`,
      // ── A1–A5 UX endpoints (xem qa-iot-flows/admin-ux-api-contracts.html)
      IOT_OVERVIEW: "/dashboard/admin/iot-overview", // A1
      DECISION_CONTEXT: (deviceId: string) =>
        `/iot-device-provisioning/admin/iot-device/${deviceId}/decision-context`, // A2
      INSTALL_QUEUE: "/iot-device-provisioning/admin/iot-device/install-queue", // A3a
      BULK_SET_STATUS:
        "/iot-device-provisioning/admin/iot-device/bulk-set-status", // A3b
      RECOVERY_QUEUE:
        "/iot-device-provisioning/admin/iot-device/recovery-queue",
      RECOVERY_BULK_COMPLETE:
        "/iot-device-provisioning/admin/iot-device/recovery/bulk-complete",
      INSTALL_MARK_BLOCKED:
        "/iot-device-provisioning/admin/iot-device/install/mark-blocked",
      OWNER_OVERVIEW: (ownerId: string) =>
        `/iot-device-provisioning/admin/owner/${ownerId}/iot-overview`, // A4
      TIMELINE: (deviceId: string) =>
        `/iot-device-provisioning/admin/iot-device/${deviceId}/timeline`, // A5
      SWAP: "/iot-device-provisioning/admin/iot-device/swap",
    },
    WITHDRAWALS: {
      LIST: "/admin/withdrawals",
      DETAIL: (id: string) => `/admin/withdrawals/${id}`,
      AUDIT: (id: string) => `/admin/withdrawals/${id}/audit`,
      APPROVE: (id: string) => `/admin/withdrawals/${id}/approve`,
      REJECT: (id: string) => `/admin/withdrawals/${id}/reject`,
      MARK_PAID: (id: string) => `/admin/withdrawals/${id}/mark-paid`,
      RESOLVE_NOT_RECEIVED: (id: string) =>
        `/admin/withdrawals/${id}/resolve-not-received`,
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
      IOT_CONFIG: (cropSeasonId: string, milestoneId: string) =>
        `/production-milestone/manager/crop-season/${cropSeasonId}/milestones/${milestoneId}/iot-config`,
    },
    MILESTONE_IOT_DEVICE: {
      ASSIGNMENT: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/assignment`,
      ASSIGNMENTS: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/assignments`,
      AVAILABLE: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/available`,
      ASSIGN: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/assign`,
      UNASSIGN: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/unassign`,
      PURCHASE_BOARDS: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/purchase-boards`,
      ASSIGN_BULK: (milestoneId: string) =>
        `/production-milestone-iot-device/manager/milestone/${milestoneId}/assign-bulk`,
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
      COMPLETE: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/manager/production-milestone/${milestoneId}/complete`,
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
      IOT_CONFIG: (cropSeasonId: string, milestoneId: string) =>
        `/production-milestone/owner/crop-season/${cropSeasonId}/milestones/${milestoneId}/iot-config`,
    },
    MILESTONE_IOT_DEVICE: {
      ASSIGNMENT: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/assignment`,
      ASSIGNMENTS: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/assignments`,
      AVAILABLE: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/available`,
      ASSIGN: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/assign`,
      UNASSIGN: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/unassign`,
      PURCHASE_BOARDS: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/purchase-boards`,
      ASSIGN_BULK: (milestoneId: string) =>
        `/production-milestone-iot-device/owner/milestone/${milestoneId}/assign-bulk`,
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
      COMPLETE: (taskId: string, milestoneId: string) =>
        `/employee-task/${taskId}/owner/production-milestone/${milestoneId}/complete`,
      ELIGIBLE_FARMERS: (milestoneId: string) =>
        `/employee-task/owner/production-milestone/${milestoneId}/eligible-farmers`,
    },
  },
  ALERTS: {
    LIST: "/alerts",
  },
  NOTIFICATIONS: {
    LIST: "/notifications",
    MARK_READ: (id: string) => `/notifications/${id}/read`,
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
    },
    /** Soft-delete farm staff user (`users.deleted_at`); any zone under the farm may be used. */
    MEMBERS: {
      SOFT_DELETE: (zoneId: string, userId: string) =>
        `/zones/${zoneId}/members/${userId}`,
    },
  },
  // ── Ticket v2 ─────────────────────────────────────────────────────────
  TICKET_CATEGORIES: {
    ADMIN_LIST: "/admin/ticket-categories",
    ADMIN_CREATE: "/admin/ticket-categories",
    ADMIN_DETAIL: (id: string) => `/admin/ticket-categories/${id}`,
    ADMIN_UPDATE: (id: string) => `/admin/ticket-categories/${id}`,
    ADMIN_TOGGLE: (id: string) => `/admin/ticket-categories/${id}/toggle`,
    ACTIVE_LIST: "/ticket-categories/active",
  },
  COMMISSION_RULES: {
    ADMIN_LIST: "/admin/commission-rules",
    ADMIN_CREATE: "/admin/commission-rules",
    ADMIN_DETAIL: (id: string) => `/admin/commission-rules/${id}`,
    ADMIN_UPDATE: (id: string) => `/admin/commission-rules/${id}`,
    ADMIN_DELETE: (id: string) => `/admin/commission-rules/${id}`,
  },
  TICKET_V2: {
    CANCEL: (id: string) => `/tickets/${id}/cancel`,
    // ADMIN_CLAWBACK: gỡ khỏi web FE — xem docs/ticket-v2/ticket-v2.md (2026-05-09)
    ADMIN_REPORT_REVENUE: "/admin/reports/ticket-revenue",
    ADMIN_REPORT_DOCTOR_COMMISSION: "/admin/reports/doctor-commission",
    ADMIN_ANALYTICS: "/admin/ticket-analytics",
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
    // ── Module 3 — Ticket Quality (B-tasks tham chiếu BE module-3 doc) ──
    RESOLVE: (ticketId: string) => `/tickets/${ticketId}/resolve`, // B2 (mobile Doctor; FE web không gọi)
    CLOSE: (ticketId: string) => `/tickets/${ticketId}/close`, // B5 (creator: Owner/Manager)
    REJECT: (ticketId: string) => `/tickets/${ticketId}/reject`, // B1 (mobile Doctor)
    ADDENDA: (ticketId: string) => `/tickets/${ticketId}/addenda`, // B4 (mobile Doctor)
    RATING: (ticketId: string) => `/tickets/${ticketId}/rating`, // B6 (creator)
    ABANDON: (ticketId: string) => `/tickets/${ticketId}/abandon-resolution`, // B7 (creator)
    FULL: (ticketId: string) => `/tickets/${ticketId}/full`, // B8 (Admin/Owner/Manager)
  },
  // ── Module 3 — Admin governance ────────────────────────────────────────
  ADMIN_TICKETS: {
    INVALIDATE_RATING: (ticketId: string) =>
      `/admin/tickets/${ticketId}/invalidate-rating`, // B17
    // Admin reuse shared `/tickets/:id/full` (B8). BE controller cho phép
    // mọi role (kể cả admin) qua `GET /tickets/:id/full`. Pending nếu BE
    // sau này tách riêng admin endpoint với extra fields (vd payout detail).
    FULL: (ticketId: string) => `/tickets/${ticketId}/full`,
  },
  MEDICINES: {
    ADMIN_LIST: "/admin/medicines", // B11
    ADMIN_CREATE: "/admin/medicines",
    ADMIN_DETAIL: (id: string) => `/admin/medicines/${id}`,
    ADMIN_UPDATE: (id: string) => `/admin/medicines/${id}`,
    ADMIN_TOGGLE: (id: string) => `/admin/medicines/${id}/toggle`, // B12
    FREETEXT_STATS: "/admin/medicines/freetext-stats", // B13
    CATALOG: "/medicines/catalog", // B10 (mobile Doctor; FE web có thể dùng cho picker A8)
  },
  SYSTEM_CONFIGS: {
    LIST: "/admin/system-configs", // B18 GET ?prefix=ticket.
    UPSERT: (key: string) => `/admin/system-configs/${key}`, // B18 PATCH single-key
  },
  DQS: {
    DOCTOR_DETAIL: (id: string) => `/admin/doctors/${id}/dqs`, // B14
    DOCTOR_HISTORY: (id: string) => `/admin/doctors/${id}/dqs-history`, // B15
    LEADERBOARD: "/admin/dqs-leaderboard", // B16
  },
  EMPLOYEE_TASK_CROP_SEASON: {
    MANAGER_BY_CROP_SEASON: (cropSeasonId: string) =>
      `/employee-task/manager/crop-season/${cropSeasonId}`,
  },
  DAILY_LOG: {
    FARMER_TODAY: "/daily-log/farmer/today",
    TASKS: "/daily-log/tasks",
    SUBMIT: "/daily-log/submit",
    OWNER_BY_FARM: (farmId: string) => `/daily-log/owner/farm/${farmId}`,
    MANAGER_BY_ZONE: (zoneId: string) => `/daily-log/manager/zone/${zoneId}`,
    MANAGER_ZONE_TODAY: (zoneId: string) =>
      `/daily-log/manager/zone/${zoneId}/today`,
  },
  IOT_KITS: {
    // Admin
    ADMIN_LIST: "/admin/iot-kits",
    ADMIN_CREATE: "/admin/iot-kits",
    ADMIN_DETAIL: (id: string) => `/admin/iot-kits/${id}`,
    ADMIN_UPDATE: (id: string) => `/admin/iot-kits/${id}`,
    ADMIN_ARCHIVE: (id: string) => `/admin/iot-kits/${id}/archive`,
    ADMIN_UNARCHIVE: (id: string) => `/admin/iot-kits/${id}/unarchive`,
    ADMIN_AVAILABLE_SLOTS: "/admin/iot-kit-orders/available-slots",
    ADMIN_AVAILABLE_BY_OWNER: "/admin/iot-kit-orders/available-by-owner",
    // Owner
    OWNER_LIST: "/owner/iot-kits",
    OWNER_DETAIL: (id: string) => `/owner/iot-kits/${id}`,
    OWNER_PURCHASE: (id: string) => `/owner/iot-kits/${id}/purchase`,
    OWNER_PAYMENT_STATUS: (orderId: string) =>
      `/owner/iot-kits/orders/${orderId}/payment-status`,
    OWNER_MY_QUOTA: "/owner/my/iot-quota",
    OWNER_MY_TRACKING: "/owner/my/iot-tracking",
  },
  CROP_SEASON: {
    MANAGER: {
      CREATE: "/crop-seasons",
      LIST_BY_ZONE: (zoneId: string) => `/crop-seasons/zone/${zoneId}`,
      DETAIL: (id: string) => `/crop-seasons/${id}`,
      UPDATE: (id: string) => `/crop-seasons/${id}`,
      COMPLETE: (id: string) => `/crop-seasons/${id}/complete`,
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
  SEASON_TEMPLATES: {
    // Admin CRUD (B1–B8)
    ADMIN_LIST: "/admin/season-templates",
    ADMIN_CREATE: "/admin/season-templates",
    ADMIN_DETAIL: (id: string) => `/admin/season-templates/${id}`,
    ADMIN_PATCH: (id: string) => `/admin/season-templates/${id}`,
    ADMIN_DEACTIVATE: (id: string) =>
      `/admin/season-templates/${id}/deactivate`,
    ADMIN_ACTIVATE: (id: string) => `/admin/season-templates/${id}/activate`,
    ADMIN_DELETE: (id: string) => `/admin/season-templates/${id}`,
    ADMIN_USAGE: (id: string) => `/admin/season-templates/${id}/usage`,
    // Public (Manager/Owner) (B9, B10)
    PUBLIC_LIST: "/season-templates",
    PUBLIC_DETAIL: (id: string) => `/season-templates/${id}`,
    // Apply (B11, B13)
    PREVIEW: "/crop-seasons/preview-from-template",
    APPLIED_INFO: (cropSeasonId: string) =>
      `/crop-seasons/${cropSeasonId}/applied-template-info`,
  },
  TRACKING: {
    AVAILABLE_FIELDS: (cropSeasonId: string) =>
      `/crop-seasons/${cropSeasonId}/tracking/available-fields`,
    CONFIGS: (cropSeasonId: string) =>
      `/crop-seasons/${cropSeasonId}/tracking/configs`,
    DIFF: (cropSeasonId: string) =>
      `/crop-seasons/${cropSeasonId}/tracking/diff`,
    TRACKING_LOG: (cropSeasonId: string) =>
      `/crop-seasons/${cropSeasonId}/tracking-log`,
    FIELD_HISTORY: (cropSeasonId: string) =>
      `/crop-seasons/${cropSeasonId}/tracking/field-history`,
    REQUEST_SNAPSHOT: (cropSeasonId: string, requestId: string) =>
      `/crop-seasons/${cropSeasonId}/production-requests/${requestId}/snapshot`,
    REQUEST_DIFF: (cropSeasonId: string) =>
      `/crop-seasons/${cropSeasonId}/production-requests/diff`,
  },
  DASHBOARD: {
    ADMIN: "/dashboard/admin",
    OWNER: "/dashboard/owner",
    MANAGER: "/dashboard/manager",
    ADMIN_REVENUE_OVERVIEW: "/dashboard/admin/revenue/overview",
    ADMIN_REVENUE_TIMESERIES: "/dashboard/admin/revenue/timeseries",
    ADMIN_REVENUE_TRANSACTIONS: "/dashboard/admin/revenue/transactions",
    ADMIN_PAYOUT_OVERVIEW: "/dashboard/admin/doctor-payouts/overview",
    ADMIN_PAYOUT_TIMESERIES: "/dashboard/admin/doctor-payouts/timeseries",
    ADMIN_PAYOUT_WITHDRAWALS: "/dashboard/admin/doctor-payouts/withdrawals",
  },
  HARVEST_RECORDS: {
    LIST_BY_ZONE: (zoneId: string) => `/harvest-records/zone/${zoneId}`,
    CREATE: (zoneId: string) => `/harvest-records/zone/${zoneId}`,
    DETAIL: (id: string) => `/harvest-records/${id}`,
    UPDATE: (id: string) => `/harvest-records/${id}`,
    DELETE: (id: string) => `/harvest-records/${id}`,
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
    summary: () => ["subscriptions", "summary"],
    list: (query?: Record<string, unknown>) => [
      "subscriptions",
      "list",
      ...(query !== undefined ? [query] : []),
    ],
    my: () => ["subscriptions", "my"],
    myQuota: () => ["subscriptions", "my", "quota"],
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
    quota: (id: string) => ["subscriptions", id, "quota"],
    paymentStatus: (id: string) => ["subscriptions", id, "payment-status"],
  },
  invoices: {
    all: ["invoices"],
    listMy: (query?: Record<string, unknown>) => [
      "invoices",
      "my",
      ...(query !== undefined ? [query] : []),
    ],
    listAdmin: (query?: Record<string, unknown>) => [
      "invoices",
      "admin",
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
    features: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "features",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (featureCode: string) => ["admin", "features", featureCode],
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
      logs: (query?: Record<string, unknown>) => [
        "admin",
        "iot-device-logs",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      logDetail: (logId: string) => ["admin", "iot-device-logs", logId],
      // ── A1–A5 UX query keys ──────────────────────────────────────────
      iotOverview: () => ["admin", "iot-overview"], // A1
      decisionContext: (deviceId: string) => [
        "admin",
        "iot-devices",
        deviceId,
        "decision-context",
      ], // A2
      installQueue: (query?: Record<string, unknown>) => [
        "admin",
        "iot-devices",
        "install-queue",
        ...(query !== undefined ? [query] : []),
      ], // A3a
      recoveryQueue: (query?: Record<string, unknown>) => [
        "admin",
        "iot-devices",
        "recovery-queue",
        ...(query !== undefined ? [query] : []),
      ],
      ownerOverview: (ownerId: string) => [
        "admin",
        "owners",
        ownerId,
        "iot-overview",
      ], // A4
      timeline: (deviceId: string, query?: Record<string, unknown>) => [
        "admin",
        "iot-devices",
        deviceId,
        "timeline",
        ...(query !== undefined ? [query] : []),
      ], // A5
    },
    withdrawals: {
      list: (query?: Record<string, unknown>) => [
        "admin",
        "withdrawals",
        "list",
        ...(query !== undefined ? [query] : []),
      ],
      detail: (id: string) => ["admin", "withdrawals", id],
      audit: (id: string) => ["admin", "withdrawals", id, "audit"],
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
      detail: (deviceId: string) => ["manager", "iot-devices", deviceId],
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
      assignments: (milestoneId: string) => [
        "manager",
        "production-milestones",
        milestoneId,
        "assignments",
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
      purchaseBoards: (
        milestoneId: string,
        query?: Record<string, unknown>,
      ) => [
        "manager",
        "production-milestones",
        milestoneId,
        "purchase-boards",
        ...(query !== undefined ? [query] : []),
      ],
      iotConfig: (cropSeasonId: string, milestoneId: string) => [
        "manager",
        "production-milestones",
        cropSeasonId,
        milestoneId,
        "iot-config",
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
      byCropSeason: (cropSeasonId: string, query?: Record<string, unknown>) => [
        "manager",
        "employee-tasks",
        "crop-season",
        cropSeasonId,
        ...(query !== undefined ? [query] : []),
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
      detail: (deviceId: string) => ["owner", "iot-devices", deviceId],
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
      assignments: (milestoneId: string) => [
        "owner",
        "production-milestones",
        milestoneId,
        "assignments",
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
      purchaseBoards: (
        milestoneId: string,
        query?: Record<string, unknown>,
      ) => [
        "owner",
        "production-milestones",
        milestoneId,
        "purchase-boards",
        ...(query !== undefined ? [query] : []),
      ],
      iotConfig: (cropSeasonId: string, milestoneId: string) => [
        "owner",
        "production-milestones",
        cropSeasonId,
        milestoneId,
        "iot-config",
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
  notifications: {
    all: ["notifications"],
    list: (query?: Record<string, unknown>) => [
      "notifications",
      "list",
      ...(query !== undefined ? [query] : []),
    ],
  },
  dailyLogs: {
    all: ["daily-logs"],
    tasks: (query?: Record<string, unknown>) => [
      "daily-logs",
      "tasks",
      ...(query !== undefined ? [query] : []),
    ],
    ownerByFarm: (farmId: string, query?: Record<string, unknown>) => [
      "daily-logs",
      "owner",
      "farm",
      farmId,
      ...(query !== undefined ? [query] : []),
    ],
    managerByZone: (zoneId: string, query?: Record<string, unknown>) => [
      "daily-logs",
      "manager",
      "zone",
      zoneId,
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
  iotKits: {
    all: ["iot-kits"] as const,
    adminList: (query?: Record<string, unknown>) => [
      "iot-kits",
      "admin",
      "list",
      ...(query !== undefined ? [query] : []),
    ],
    adminDetail: (id: string) => ["iot-kits", "admin", id],
    ownerList: (query?: Record<string, unknown>) => [
      "iot-kits",
      "owner",
      "list",
      ...(query !== undefined ? [query] : []),
    ],
    ownerDetail: (id: string) => ["iot-kits", "owner", id],
    paymentStatus: (orderId: string) => [
      "iot-kits",
      "orders",
      orderId,
      "payment-status",
    ],
    myQuota: () => ["iot-kits", "owner", "my-quota"],
    myTracking: () => ["iot-kits", "owner", "my-tracking"],
    availableSlots: (ownerId: string) => [
      "iot-kits",
      "admin",
      "available-slots",
      ownerId,
    ],
    availableByOwner: (query?: Record<string, unknown>) => [
      "iot-kits",
      "admin",
      "available-by-owner",
      ...(query !== undefined ? [query] : []),
    ],
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
  // ── Ticket v2 (isolated roots — never overlap with legacy "tickets") ──
  ticketCategories: {
    root: ["ticket-categories-v2"] as const,
    adminList: (query?: Record<string, unknown>) =>
      [
        "ticket-categories-v2",
        "admin",
        "list",
        ...(query !== undefined ? [query] : []),
      ] as const,
    activeList: () => ["ticket-categories-v2", "active"] as const,
    adminDetail: (id: string) => ["ticket-categories-v2", "admin", id] as const,
  },
  commissionRules: {
    root: ["commission-rules-v2"] as const,
    list: (query?: Record<string, unknown>) =>
      [
        "commission-rules-v2",
        "list",
        ...(query !== undefined ? [query] : []),
      ] as const,
    detail: (id: string) => ["commission-rules-v2", id] as const,
  },
  adminTicketReports: {
    root: ["admin-ticket-reports-v2"] as const,
    revenue: (query?: Record<string, unknown>) =>
      [
        "admin-ticket-reports-v2",
        "revenue",
        ...(query !== undefined ? [query] : []),
      ] as const,
    doctorCommission: (query?: Record<string, unknown>) =>
      [
        "admin-ticket-reports-v2",
        "doctor-commission",
        ...(query !== undefined ? [query] : []),
      ] as const,
    analytics: (query?: Record<string, unknown>) =>
      [
        "admin-ticket-reports-v2",
        "analytics",
        ...(query !== undefined ? [query] : []),
      ] as const,
  },
  // ── Module 3 — Ticket Quality & DQS ─────────────────────────────────────
  medicines: {
    root: ["medicines-v2"] as const,
    adminList: (query?: Record<string, unknown>) =>
      [
        "medicines-v2",
        "admin",
        "list",
        ...(query !== undefined ? [query] : []),
      ] as const,
    adminDetail: (id: string) => ["medicines-v2", "admin", id] as const,
    freetextStats: (query?: Record<string, unknown>) =>
      [
        "medicines-v2",
        "freetext-stats",
        ...(query !== undefined ? [query] : []),
      ] as const,
    catalog: (query?: Record<string, unknown>) =>
      [
        "medicines-v2",
        "catalog",
        ...(query !== undefined ? [query] : []),
      ] as const,
  },
  systemConfigs: {
    root: ["system-configs-v2"] as const,
    list: (prefix?: string) =>
      ["system-configs-v2", "list", prefix ?? "all"] as const,
  },
  dqs: {
    root: ["dqs-v2"] as const,
    doctorDetail: (id: string) => ["dqs-v2", "doctor", id] as const,
    doctorHistory: (id: string, query?: Record<string, unknown>) =>
      [
        "dqs-v2",
        "doctor",
        id,
        "history",
        ...(query !== undefined ? [query] : []),
      ] as const,
    leaderboard: (query?: Record<string, unknown>) =>
      [
        "dqs-v2",
        "leaderboard",
        ...(query !== undefined ? [query] : []),
      ] as const,
  },
  doctorPublic: {
    root: ["doctor-public-v2"] as const,
    detail: (id: string) => ["doctor-public-v2", id] as const,
  },
  // Mở rộng nhóm tickets cũ (B8 full payload) — không đụng QUERY_KEYS.tickets ở trên.
  ticketsExt: {
    root: ["tickets", "ext"] as const,
    full: (id: string) => ["tickets", "ext", "full", id] as const,
    adminFull: (id: string) => ["tickets", "ext", "admin", "full", id] as const,
  },
  seasonTemplates: {
    root: ["season-templates"] as const,
    adminList: (query?: Record<string, unknown>) =>
      [
        "season-templates",
        "admin",
        "list",
        ...(query !== undefined ? [query] : []),
      ] as const,
    adminDetail: (id: string) =>
      ["season-templates", "admin", "detail", id] as const,
    adminUsage: (id: string) =>
      ["season-templates", "admin", "usage", id] as const,
    publicList: (query?: Record<string, unknown>) =>
      [
        "season-templates",
        "public",
        "list",
        ...(query !== undefined ? [query] : []),
      ] as const,
    publicDetail: (id: string) =>
      ["season-templates", "public", "detail", id] as const,
    appliedInfo: (cropSeasonId: string) =>
      ["season-templates", "applied-info", cropSeasonId] as const,
  },
  tracking: {
    all: (cropSeasonId: string) => ["tracking", cropSeasonId] as const,
    availableFields: (cropSeasonId: string) =>
      ["tracking", cropSeasonId, "available-fields"] as const,
    configs: (cropSeasonId: string) =>
      ["tracking", cropSeasonId, "configs"] as const,
    diff: (cropSeasonId: string) => ["tracking", cropSeasonId, "diff"] as const,
    log: (cropSeasonId: string, query?: Record<string, unknown>) =>
      [
        "tracking",
        cropSeasonId,
        "log",
        ...(query !== undefined ? [query] : []),
      ] as const,
    fieldHistory: (cropSeasonId: string, query: unknown) =>
      ["tracking", cropSeasonId, "field-history", query] as const,
    requestSnapshot: (cropSeasonId: string, requestId: string) =>
      ["tracking", cropSeasonId, "snapshot", requestId] as const,
  },
  dashboard: {
    admin: (period: string) => ["dashboard", "admin", period] as const,
    owner: (period: string) => ["dashboard", "owner", period] as const,
    manager: (period: string) => ["dashboard", "manager", period] as const,
    revenueOverview: (kpiRange: string, chartRange: string) =>
      ["dashboard", "admin", "revenue", "overview", kpiRange, chartRange] as const,
    revenueTimeseries: (source: string, range: string) =>
      ["dashboard", "admin", "revenue", "timeseries", source, range] as const,
    revenueTransactions: (q: Record<string, unknown>) =>
      ["dashboard", "admin", "revenue", "transactions", q] as const,
    payoutOverview: (kpiRange: string) =>
      ["dashboard", "admin", "doctor-payouts", "overview", kpiRange] as const,
    payoutTimeseries: (range: string) =>
      ["dashboard", "admin", "doctor-payouts", "timeseries", range] as const,
    payoutWithdrawals: (q: Record<string, unknown>) =>
      ["dashboard", "admin", "doctor-payouts", "withdrawals", q] as const,
  },
  harvestRecords: {
    root: ["harvest-records"] as const,
    listByZone: (zoneId: string, query?: Record<string, unknown>) =>
      [
        "harvest-records",
        "zone",
        zoneId,
        "list",
        ...(query !== undefined ? [query] : []),
      ] as const,
    detail: (id: string) => ["harvest-records", id] as const,
  },
} as const;
