import { z } from "zod";

export const PrescriptionResSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  medicineName: z.string(),
  dosage: z.string(),
  createdAt: z.string().datetime(),
});

export const CreatePrescriptionBodySchema = z.object({
  medicineName: z.string().min(1, "Tên thuốc không được để trống.").max(255),
  dosage: z.string().min(1, "Liều dùng không được để trống.").max(255),
});

export const ListPrescriptionQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const PrescriptionListResSchema = z.object({
  data: z.array(PrescriptionResSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type PrescriptionResType = z.infer<typeof PrescriptionResSchema>;
export type CreatePrescriptionBodyType = z.infer<
  typeof CreatePrescriptionBodySchema
>;
export type ListPrescriptionQueryType = z.infer<
  typeof ListPrescriptionQuerySchema
>;
export type PrescriptionListResType = z.infer<typeof PrescriptionListResSchema>;
