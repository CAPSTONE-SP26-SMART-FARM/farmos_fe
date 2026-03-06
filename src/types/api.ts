import { z } from "zod";

// schema for api response
export const ApiResponseSchema = z.object({
	statusCode: z.number(),
	message: z.string(),
});
export const ApiResponseDataSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	ApiResponseSchema.extend({
		data: dataSchema,
	});

// Schema cho request có phân trang
export const PagingRequestSchema = z.object({
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(10),
	search: z.string().optional(),
});

// Schema cho metadata của pagination response
export const PagingMetaSchema = z.object({
	page: z.number().int().positive(),
	limit: z.number().int().positive(),
	totalItems: z.number().int().min(0),
	totalPages: z.number().int().min(0),
	hasNextPage: z.boolean(),
	hasPreviousPage: z.boolean(),
});

// Generic schema cho response có phân trang
export const PagingResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
	z.object({
		data: z.array(dataSchema),
		meta: PagingMetaSchema,
	});

// Helper function để tính toán pagination metadata
export const calculatePagingMeta = (
	page: number,
	limit: number,
	totalItems: number,
): z.infer<typeof PagingMetaSchema> => {
	const totalPages = Math.ceil(totalItems / limit);

	return {
		page,
		limit,
		totalItems,
		totalPages,
		hasNextPage: page < totalPages,
		hasPreviousPage: page > 1,
	};
};

//* Message
export const MessageResSchema = z.object({
	message: z.string(),
});

export const OTPMessageResSchema = ApiResponseDataSchema(
	z.object({
		message: z.string(),
	}),
);

//<==========Type Export================>
export type ApiResponseType<T = unknown> = {
	statusCode: number;
	message: string;
	data: T;
};
export type PagingRequestType = z.infer<typeof PagingRequestSchema>;
export type PagingMetaType = z.infer<typeof PagingMetaSchema>;
export type PagingResponseType<T> = {
	data: T[];
	meta: PagingMetaType;
};

export type MessageResType = z.infer<typeof MessageResSchema>;
export type OTPMessageResType = z.infer<typeof OTPMessageResSchema>;

// Error response from API
export interface ApiErrorResponse {
	statusCode: number;
	message: string;
}

export interface ApiErrorUnprocessableEntityResponse<
	//disable eslint
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	T extends Record<string, any> = Record<string, any>,
> extends ApiErrorResponse {
	errors: Array<{ field: keyof T; message: string; code: string }>;
}

// Auth specific types
