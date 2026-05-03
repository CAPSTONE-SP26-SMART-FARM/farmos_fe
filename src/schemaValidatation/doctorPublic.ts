import { z } from "zod";

// Module 3 — Public Doctor profile (B19). Schema 1-1 với BE
// `farm_os_be/src/modules/dqs/dqs.model.ts:96-103` (PublicDoctorResSchema).
//
// BR-81 chặt hơn: KHÔNG bao giờ trả tier ở endpoint này.
// QUAN TRỌNG (audit Wave 4): BE response chỉ có 4 field flat — KHÔNG có
// fullName / email / avatarUrl. Nếu UI cần hiển thị tên doctor, phải fetch
// riêng qua `useAdminListUsers` hoặc User profile endpoint.

export const DoctorPublicProfileResSchema = z.object({
  id: z.string().uuid(),
  avgRating: z.number(),
  totalResolvedTickets: z.number().int().nonnegative(),
  specialization: z.string().nullable(),
});

export type DoctorPublicProfileResType = z.infer<
  typeof DoctorPublicProfileResSchema
>;
