import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

export const FeatureValueTypeEnum = z.enum([
  "BOOLEAN",
  "INT",
  "DECIMAL",
  "JSON",
  "TEXT",
]);

export const FeatureSchema = z.object({
  code: z.string().min(1).max(64),
  name: z.string().min(1),
  description: z.string().nullable(),
  valueType: FeatureValueTypeEnum,
  unit: z.string().nullable(),
  defaultValue: z.string().nullable(),
  defaultValueInt: z.number().nullable(),
  defaultValueDecimal: z.number().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const ListFeaturesQuerySchema = PagingRequestSchema.extend({}).strict();

export const ListFeaturesResSchema = PagingResponseSchema(FeatureSchema);

export type FeatureType = z.infer<typeof FeatureSchema>;
export type FeatureValueType = z.infer<typeof FeatureValueTypeEnum>;
export type ListFeaturesQueryType = z.infer<typeof ListFeaturesQuerySchema>;
export type ListFeaturesResType = z.infer<typeof ListFeaturesResSchema>;
