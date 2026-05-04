import { z } from "zod";
import {
  SensorTemplateItemConfigSchema,
  SensorTemplateTypeSchema,
  FarmTypeForTemplateSchema,
} from "@/schemaValidatation/iotTemplate";

export const SensorItemFormSchema = SensorTemplateItemConfigSchema.superRefine(
  (item, ctx) => {
    if (
      item.minValue != null &&
      item.maxValue != null &&
      item.minValue > item.maxValue
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Giá trị thấp nhất không được lớn hơn giá trị cao nhất",
        path: ["maxValue"],
      });
    }
    if (
      item.optimalMin != null &&
      item.optimalMax != null &&
      item.optimalMin > item.optimalMax
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          "Ngưỡng báo động thấp nhất không được lớn hơn ngưỡng báo động cao nhất",
        path: ["optimalMax"],
      });
    }
    if (
      item.optimalMin != null &&
      item.minValue != null &&
      item.optimalMin < item.minValue
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngưỡng báo động phải nằm trong khoảng giá trị đo được",
        path: ["optimalMin"],
      });
    }
    if (
      item.optimalMax != null &&
      item.maxValue != null &&
      item.optimalMax > item.maxValue
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ngưỡng báo động phải nằm trong khoảng giá trị đo được",
        path: ["optimalMax"],
      });
    }
  },
);

export const SensorTemplateFormSchema = z.object({
  name: z.string().min(1, "Tên template là bắt buộc").max(255),
  description: z.string().max(5000).nullable().optional(),
  type: SensorTemplateTypeSchema,
  farmType: FarmTypeForTemplateSchema,
  version: z
    .number({ error: "Phiên bản không hợp lệ" })
    .int()
    .positive("Phiên bản phải lớn hơn 0"),
  isActive: z.boolean(),
  items: z.array(SensorItemFormSchema),
});

export type SensorTemplateFormType = z.infer<typeof SensorTemplateFormSchema>;

export const SENSOR_TYPE_LABEL: Record<string, string> = {
  soil_moisture_sensor: "Độ ẩm đất",
  light_intensity_sensor: "Cường độ ánh sáng",
  air_humidity_sensor: "Độ ẩm không khí",
  air_temperature_sensor: "Nhiệt độ không khí",
} as const;

export const toNum = (v: string): number | null => {
  if (v === "") return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};
