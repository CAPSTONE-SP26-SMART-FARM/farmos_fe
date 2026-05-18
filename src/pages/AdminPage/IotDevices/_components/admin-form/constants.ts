import { CloudRain, Cpu, Droplets, Sun, Thermometer } from "lucide-react";
import type { z } from "zod";
import { SENSOR_TYPE_LABEL } from "@/constants/iotDeviceDisplay";
import type { SensorTypeSchema } from "@/schemaValidatation/sensor";

export const SENSOR_TYPE_VALUES = Object.keys(SENSOR_TYPE_LABEL) as Array<
  z.infer<typeof SensorTypeSchema>
>;

export const SENSOR_TEMPLATE_TYPE_LABEL: Record<string, string> = {
  soil_moisture_sensor: "Độ ẩm đất",
  air_temperature_sensor: "Nhiệt độ không khí",
  air_humidity_sensor: "Độ ẩm không khí",
  light_intensity_sensor: "Cường độ ánh sáng",
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

export const SENSOR_STATUS_DISPLAY: Record<string, string> = {
  active: "Hoạt động",
  inactive: "Tắt",
  calibrating: "Hiệu chuẩn",
};

export const SENSOR_TEMPLATE_TO_SENSOR_TYPE: Record<string, string> = {
  soil_moisture_sensor: "soil_moisture",
  air_temperature_sensor: "air_temperature",
  air_humidity_sensor: "air_humidity",
  light_intensity_sensor: "light_intensity",
};

// Default min/max thresholds per sensor type. Mapped to physical ranges:
// - soil_moisture / air_humidity: percentage 0..100
// - air_temperature: Celsius range typical for outdoor agriculture
// - light_intensity: lux up to direct sunlight
export const SENSOR_DEFAULT_RANGE: Record<
  string,
  { minValue: number; maxValue: number }
> = {
  soil_moisture: { minValue: 0, maxValue: 100 },
  air_temperature: { minValue: -10, maxValue: 60 },
  air_humidity: { minValue: 0, maxValue: 100 },
  light_intensity: { minValue: 0, maxValue: 100000 },
};

export function getSensorDefaultRange(sensorType: string) {
  return SENSOR_DEFAULT_RANGE[sensorType] ?? { minValue: 0, maxValue: 100 };
}

// Union of sensor shapes returned by various admin endpoints.
export type SensorDisplayItem = {
  sensorType: string;
  status?: string;
  minValue?: string | number | null;
  maxValue?: string | number | null;
};
