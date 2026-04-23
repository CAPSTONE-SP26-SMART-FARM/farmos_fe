import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

// ============================================================
// FeatureMenu — maps to table feature_menu
// ============================================================
export const FeatureMenuSchema = z.object({
	code: z.string().min(1).max(64).describe("Unique feature code (primary key)"),
	name: z.string().min(1).describe("Display name of the feature"),
	description: z.string().nullable().describe("Optional description"),
	valueType: z
		.enum(["BOOLEAN", "INT", "DECIMAL", "JSON", "TEXT"])
		.describe("Data type of the feature value"),
	unit: z.string().nullable().describe("Unit of measurement"),
	defaultValue: z.string().nullable().describe("Default value as string"),
	defaultValueInt: z
		.number()
		.nullable()
		.describe("Default value cast as integer"),
	defaultValueDecimal: z
		.number()
		.nullable()
		.describe("Default value cast as decimal"),
	createdAt: z.iso.datetime().describe("Creation timestamp"),
	updatedAt: z.iso.datetime().describe("Last update timestamp"),
});

// ============================================================
// Request Body Schemas
// ============================================================

/** Create Feature */
export const CreateFeatureBodySchema = z
	.object({
		code: z.string().min(1).max(64).describe("Unique feature code"),
		name: z.string().min(1).describe("Display name"),
		description: z.string().optional().describe("Optional description"),
		valueType: z
			.enum(["BOOLEAN", "INT", "DECIMAL", "JSON", "TEXT"])
			.describe("Data type"),
		unit: z.string().optional().describe("Unit of measurement"),
		defaultValue: z.string().optional().describe("Default value as string"),
	})
	.strict();

/** Update Feature */
export const UpdateFeatureBodySchema = z
	.object({
		name: z.string().min(1).optional().describe("Display name"),
		description: z.string().optional().describe("Optional description"),
		unit: z.string().optional().describe("Unit of measurement"),
		defaultValue: z.string().optional().describe("Default value as string"),
	})
	.strict();

// ============================================================
// Response Schemas
// ============================================================

/** Feature response */
export const FeatureMenuResSchema = FeatureMenuSchema;

// ============================================================
// Query Schemas
// ============================================================

/** List features query */
export const ListFeaturesQuerySchema = PagingRequestSchema.extend({
	search: z.string().optional().describe("Search by code or name"),
}).strict();

// ============================================================
// Response Schemas (paginated)
// ============================================================

/** Paginated list features response */
export const ListFeaturesResSchema = PagingResponseSchema(FeatureMenuResSchema);

// ============================================================
// Type Exports
// ============================================================
export type FeatureMenuType = z.infer<typeof FeatureMenuSchema>;
export type ListFeaturesQueryType = z.infer<typeof ListFeaturesQuerySchema>;
export type CreateFeatureBodyType = z.infer<typeof CreateFeatureBodySchema>;
export type UpdateFeatureBodyType = z.infer<typeof UpdateFeatureBodySchema>;
export type FeatureMenuResType = z.infer<typeof FeatureMenuResSchema>;
export type ListFeaturesResType = z.infer<typeof ListFeaturesResSchema>;
