import { DoctorTypeName, RegistrationStatusName } from "@/constants/profile";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { UserResSchema } from "@/types/user";

import { z } from "zod";

// ============================================================
// DoctorProfile — maps to table doctor_profiles
// ============================================================
export const DoctorProfileSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  doctorType: z.enum([
    DoctorTypeName.Internal,
    DoctorTypeName.Partner,
    DoctorTypeName.Coordinator,
  ]),
  licenseNumber: z.string().max(100),
  licenseExpiryDate: z.iso.date(),
  specialization: z.string().max(255),
  bio: z.string().nullable(),
  yearsOfExperience: z.number().int().nullable(),
  approvedBy: z.uuid().nullable(),
  approvedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// ============================================================
// DoctorRequest — maps to table doctor_requests
// ============================================================
export const DoctorRequestSchema = z.object({
  id: z.uuid(),
  userId: z.uuid(),
  doctorProfileId: z.uuid(),
  title: z.string().max(255),
  description: z.string(),
  registrationStatus: z.enum([
    RegistrationStatusName.Pending,
    RegistrationStatusName.Approved,
    RegistrationStatusName.Rejected,
    RegistrationStatusName.Suspended,
  ]),
  selfRegistered: z.boolean(),
  repliedBy: z.uuid().nullable(),
  repliedAt: z.iso.datetime().nullable(),
  reason: z.string().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

// ============================================================
// Request Body Schemas
// ============================================================

/** 4.1 — Upsert Doctor Profile */
export const UpsertDoctorProfileBodySchema = z
  .object({
    doctorType: z.enum([
      DoctorTypeName.Internal,
      DoctorTypeName.Partner,
      DoctorTypeName.Coordinator,
    ]),
    licenseNumber: z.string().min(1).max(100),
    licenseExpiryDate: z.iso.datetime(),
    specialization: z.string().min(1).max(255),
    bio: z.string().optional(),
    yearsOfExperience: z.number().int().min(0).optional(),
  })
  .strict();

/** 4.2 — Submit Doctor Registration Request */
export const SubmitDoctorRequestBodySchema = z
  .object({
    title: z.string().min(1).max(255),
    description: z.string().min(1),
  })
  .strict();

/** 4.5 — Update Doctor Request Status (Admin) */
export const UpdateDoctorRequestStatusBodySchema = z
  .object({
    status: z.enum([
      RegistrationStatusName.Approved,
      RegistrationStatusName.Rejected,
      RegistrationStatusName.Suspended,
    ]),
    reason: z.string().optional(),
  })
  .strict()
  .superRefine(({ status, reason }, ctx) => {
    if (
      (status === RegistrationStatusName.Rejected ||
        status === RegistrationStatusName.Suspended) &&
      (!reason || reason.trim().length === 0)
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Error.ReasonRequired",
        path: ["reason"],
      });
    }
  });

// ============================================================
// Query Schemas
// ============================================================

/** 4.3 & 4.4 — List Doctor Requests (paginated) */
export const ListDoctorRequestsQuerySchema = PagingRequestSchema.extend({
  status: z
    .enum([
      RegistrationStatusName.Pending,
      RegistrationStatusName.Approved,
      RegistrationStatusName.Rejected,
      RegistrationStatusName.Suspended,
    ])
    .optional(),
}).strict();

// ============================================================
// Response Schemas
// ============================================================

/** Upsert profile response */
export const DoctorProfileResSchema = DoctorProfileSchema;

/** Doctor request response (flat) */
export const DoctorRequestResSchema = DoctorRequestSchema;

/** Doctor request with doctor profile info (for doctor detail) */
export const DoctorRequestWithProfileResSchema = DoctorRequestSchema.extend({
  doctorProfile: DoctorProfileSchema,
});

/** Doctor request with profile + user info (for admin detail) */
export const DoctorRequestWithProfileAndUserResSchema =
  DoctorRequestSchema.extend({
    doctorProfile: DoctorProfileSchema,
    user: UserResSchema,
  });

/** Paginated doctor requests */
export const ListDoctorRequestsResSchema = PagingResponseSchema(
  DoctorRequestResSchema,
);

/** Paginated doctor requests with user info (admin) */
export const ListDoctorRequestsAdminResSchema = PagingResponseSchema(
  DoctorRequestSchema.extend({
    user: UserResSchema,
  }),
);

// ============================================================
// Type Exports
// ============================================================
export type DoctorProfileType = z.infer<typeof DoctorProfileSchema>;
export type DoctorRequestType = z.infer<typeof DoctorRequestSchema>;

export type UpsertDoctorProfileBodyType = z.infer<
  typeof UpsertDoctorProfileBodySchema
>;
export type SubmitDoctorRequestBodyType = z.infer<
  typeof SubmitDoctorRequestBodySchema
>;
export type UpdateDoctorRequestStatusBodyType = z.infer<
  typeof UpdateDoctorRequestStatusBodySchema
>;
export type ListDoctorRequestsQueryType = z.infer<
  typeof ListDoctorRequestsQuerySchema
>;

export type DoctorProfileResType = z.infer<typeof DoctorProfileResSchema>;
export type DoctorRequestResType = z.infer<typeof DoctorRequestResSchema>;
export type DoctorRequestWithProfileResType = z.infer<
  typeof DoctorRequestWithProfileResSchema
>;
export type DoctorRequestWithProfileAndUserResType = z.infer<
  typeof DoctorRequestWithProfileAndUserResSchema
>;
export type ListDoctorRequestsResType = z.infer<
  typeof ListDoctorRequestsResSchema
>;
export type ListDoctorRequestsAdminResType = z.infer<
  typeof ListDoctorRequestsAdminResSchema
>;
