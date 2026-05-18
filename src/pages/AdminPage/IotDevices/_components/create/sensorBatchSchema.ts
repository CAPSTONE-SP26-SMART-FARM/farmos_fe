import { z } from "zod";
import { SensorTypeSchema } from "@/schemaValidatation/sensor";

export const SENSOR_TYPE_VALUES = [
  "soil_moisture",
  "air_temperature",
  "air_humidity",
  "light_intensity",
] as const;

export type SensorTypeValue = (typeof SENSOR_TYPE_VALUES)[number];

// Default range hợp lý theo từng loại cảm biến — thay vì 0-100 chung chung.
// Admin vẫn có thể chỉnh tự do, đây chỉ là điểm khởi đầu.
export const SENSOR_DEFAULT_RANGE: Record<
  SensorTypeValue,
  { min: number; max: number }
> = {
  soil_moisture: { min: 0, max: 100 },
  air_temperature: { min: -10, max: 60 },
  air_humidity: { min: 0, max: 100 },
  light_intensity: { min: 0, max: 100000 },
};

export const SensorBatchItemSchema = z.object({
  sensorType: SensorTypeSchema,
  minValue: z
    .number()
    .refine(Number.isFinite, "Giá trị tối thiểu không hợp lệ"),
  maxValue: z.number().refine(Number.isFinite, "Giá trị tối đa không hợp lệ"),
});

export const SensorBatchSchema = z
  .object({
    items: z
      .array(SensorBatchItemSchema)
      .min(1, "Cần ít nhất 1 cảm biến")
      .max(4, "Mỗi lần chỉ thêm tối đa 4 cảm biến"),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    data.items.forEach((item, index) => {
      if (seen.has(item.sensorType)) {
        ctx.addIssue({
          code: "custom",
          message: "Mỗi loại cảm biến chỉ được xuất hiện 1 lần",
          path: ["items", index, "sensorType"],
        });
      }
      seen.add(item.sensorType);
      if (item.minValue > item.maxValue) {
        ctx.addIssue({
          code: "custom",
          message: "Giá trị tối thiểu phải nhỏ hơn hoặc bằng tối đa",
          path: ["items", index, "minValue"],
        });
      }
    });
  });

export type SensorBatchFormType = z.infer<typeof SensorBatchSchema>;
