import { z } from "zod";
import { UserResSchema } from "@/types/user";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
// ============================================================
// DoctorOwnerAssignment — maps to table doctor_owner_assignments
// ============================================================
export const DoctorOwnerAssignmentSchema = z.object({
	id: z.string(),
	doctorId: z.uuid(),
	ownerId: z.uuid(),
	assignedBy: z.uuid(),
	assignedAt: z.iso.datetime(),
	isPrimary: z.boolean(),
	status: z.string(),
	notes: z.string().nullable(),
});

// ============================================================
// Request Body Schemas
// ============================================================

/** 4.1 — Assign Doctor to Owner (Admin) */
export const CreateAssignmentBodySchema = z
	.object({
		doctorId: z.uuid(),
		ownerId: z.uuid(),
		isPrimary: z.boolean().optional().default(true),
		notes: z.string().optional().default(""),
	})
	.strict();

// ============================================================
// Query Schemas
// ============================================================

/** 4.2, 4.4, 4.6 — List Assignments (paginated) */
export const ListAssignmentsQuerySchema = PagingRequestSchema.extend({
	status: z.string().optional(),
}).strict();

// ============================================================
// Response Schemas
// ============================================================

/** Flat assignment response */
export const AssignmentResSchema = DoctorOwnerAssignmentSchema;

/** Assignment with doctor info (for owner views) */
export const AssignmentWithDoctorResSchema = DoctorOwnerAssignmentSchema.extend(
	{
		doctor: UserResSchema,
	},
);

/** Assignment with owner info (for doctor views) */
export const AssignmentWithOwnerResSchema = DoctorOwnerAssignmentSchema.extend({
	owner: UserResSchema,
});

/** Assignment with doctor + owner info (for admin list) */
export const AssignmentWithDoctorAndOwnerResSchema =
	DoctorOwnerAssignmentSchema.extend({
		doctor: UserResSchema,
		owner: UserResSchema,
	});

/** Assignment with doctor + owner + assigner info (for admin detail) */
export const AssignmentDetailAdminResSchema =
	DoctorOwnerAssignmentSchema.extend({
		doctor: UserResSchema,
		owner: UserResSchema,
		assigner: UserResSchema,
	});

/** Paginated: admin list */
export const ListAssignmentsAdminResSchema = PagingResponseSchema(
	AssignmentWithDoctorAndOwnerResSchema,
);

/** Paginated: doctor list (with owner info) */
export const ListAssignmentsDoctorResSchema = PagingResponseSchema(
	AssignmentWithOwnerResSchema,
);

/** Paginated: owner list (with doctor info) */
export const ListAssignmentsOwnerResSchema = PagingResponseSchema(
	AssignmentWithDoctorResSchema,
);

// ============================================================
// Type Exports
// ============================================================
export type DoctorOwnerAssignmentType = z.infer<
	typeof DoctorOwnerAssignmentSchema
>;
export type CreateAssignmentBodyType = z.infer<
	typeof CreateAssignmentBodySchema
>;
export type ListAssignmentsQueryType = z.infer<
	typeof ListAssignmentsQuerySchema
>;

export type AssignmentResType = z.infer<typeof AssignmentResSchema>;
export type AssignmentWithDoctorResType = z.infer<
	typeof AssignmentWithDoctorResSchema
>;
export type AssignmentWithOwnerResType = z.infer<
	typeof AssignmentWithOwnerResSchema
>;
export type AssignmentWithDoctorAndOwnerResType = z.infer<
	typeof AssignmentWithDoctorAndOwnerResSchema
>;
export type AssignmentDetailAdminResType = z.infer<
	typeof AssignmentDetailAdminResSchema
>;
export type ListAssignmentsAdminResType = z.infer<
	typeof ListAssignmentsAdminResSchema
>;
export type ListAssignmentsDoctorResType = z.infer<
	typeof ListAssignmentsDoctorResSchema
>;
export type ListAssignmentsOwnerResType = z.infer<
	typeof ListAssignmentsOwnerResSchema
>;
