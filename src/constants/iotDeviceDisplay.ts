import {
  AlertCircle,
  CircuitBoard,
  CloudRain,
  Cpu,
  Droplets,
  Package,
  PackageCheck,
  Power,
  Radio,
  ShieldOff,
  Sun,
  Thermometer,
  Wifi,
  Wrench,
} from "lucide-react";
import type { DeviceStatusType } from "@/schemaValidatation/iotDevice";

export const DEVICE_TYPE_LABEL: Record<string, string> = {
  board_module: "Bo mạch",
  wifi_module: "Mô-đun WiFi",
  lora_module: "Mô-đun LoRa",
};

export const DEVICE_TYPE_ICON: Record<string, typeof Cpu> = {
  board_module: CircuitBoard,
  wifi_module: Wifi,
  lora_module: Radio,
};

// Role-aware labels: admin sees the provisioning perspective, user sees the usage perspective
export const DEVICE_STATUS_LABEL_ADMIN: Record<DeviceStatusType, string> = {
  available: "Có thể sử dụng",
  purchase: "Đã cho thuê",
  install: "Đang lắp đặt",
  active: "Hoạt động",
  error: "Lỗi",
  revoked: "Thu hồi",
};

export const DEVICE_STATUS_LABEL_USER: Record<DeviceStatusType, string> = {
  available: "Có thể sử dụng",
  purchase: "Khả dụng",
  install: "Đang lắp đặt",
  active: "Hoạt động",
  error: "Lỗi",
  revoked: "Thu hồi",
};

export const STATUS_META: Record<
  DeviceStatusType,
  {
    labelAdmin: string;
    labelUser: string;
    badgeClass: string;
    icon: typeof Power;
  }
> = {
  available: {
    labelAdmin: DEVICE_STATUS_LABEL_ADMIN.available,
    labelUser: DEVICE_STATUS_LABEL_USER.available,
    badgeClass:
      "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
    icon: Package,
  },
  purchase: {
    labelAdmin: DEVICE_STATUS_LABEL_ADMIN.purchase,
    labelUser: DEVICE_STATUS_LABEL_USER.purchase,
    badgeClass:
      "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
    icon: PackageCheck,
  },
  install: {
    labelAdmin: DEVICE_STATUS_LABEL_ADMIN.install,
    labelUser: DEVICE_STATUS_LABEL_USER.install,
    badgeClass:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
    icon: Wrench,
  },
  active: {
    labelAdmin: DEVICE_STATUS_LABEL_ADMIN.active,
    labelUser: DEVICE_STATUS_LABEL_USER.active,
    badgeClass:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
    icon: Power,
  },
  error: {
    labelAdmin: DEVICE_STATUS_LABEL_ADMIN.error,
    labelUser: DEVICE_STATUS_LABEL_USER.error,
    badgeClass:
      "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
    icon: AlertCircle,
  },
  revoked: {
    labelAdmin: DEVICE_STATUS_LABEL_ADMIN.revoked,
    labelUser: DEVICE_STATUS_LABEL_USER.revoked,
    badgeClass:
      "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
    icon: ShieldOff,
  },
};

export const SENSOR_TYPE_LABEL: Record<string, string> = {
  soil_moisture: "Độ ẩm đất",
  air_temperature: "Nhiệt độ không khí",
  air_humidity: "Độ ẩm không khí",
  light_intensity: "Cường độ ánh sáng",
};

export const SENSOR_TYPE_ICON: Record<string, typeof Cpu> = {
  soil_moisture: Droplets,
  air_temperature: Thermometer,
  air_humidity: CloudRain,
  light_intensity: Sun,
  soil_moisture_sensor: Droplets,
  air_temperature_sensor: Thermometer,
  air_humidity_sensor: CloudRain,
  light_intensity_sensor: Sun,
};

export const SENSOR_STATUS_LABEL: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Tắt",
  calibrating: "Hiệu chuẩn",
};

export const IOT_ACTION_LABEL: Record<string, string> = {
  INSTALLED: "Lắp đặt",
  UNINSTALLED: "Gỡ lắp đặt",
  MAINTENANCE: "Bảo trì",
  RECALLED: "Thu hồi tạm thời",
  DAMAGED: "Hư hỏng",
  REVOKED: "Thu hồi",
  STATUS_CHANGED: "Đổi trạng thái",
};

export const IOT_ACTION_BADGE_CLASS: Record<string, string> = {
  INSTALLED:
    "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  UNINSTALLED:
    "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200",
  MAINTENANCE:
    "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300",
  RECALLED:
    "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-300",
  DAMAGED:
    "border-red-300 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300",
  REVOKED:
    "border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
  STATUS_CHANGED:
    "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300",
};
