import { z } from "zod";

// ── Revenue report ────────────────────────────────────────────────────────────
export const TicketRevenueReportQuerySchema = z.object({
  from: z
    .string()
    .min(1, "Vui lòng chọn ngày bắt đầu.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ."),
  to: z
    .string()
    .min(1, "Vui lòng chọn ngày kết thúc.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ."),
  doctorId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
});

export const TicketRevenueItemSchema = z.object({
  ticketId: z.string().uuid(),
  ticketNumber: z.string(),
  title: z.string(),
  categoryName: z.string(),
  categoryCode: z.string(),
  ownerId: z.string().uuid().nullable(),
  ownerName: z.string().nullable(),
  assigneeId: z.string().uuid().nullable(),
  assigneeName: z.string().nullable(),
  unitPrice: z.number(),
  commissionPercent: z.number(),
  commissionAmount: z.number(),
  platformAmount: z.number(),
  resolvedAt: z.string().nullable(),
  creditType: z.string().nullable(),
});

export const TicketRevenueReportResSchema = z.object({
  data: z.array(TicketRevenueItemSchema),
  summary: z.object({
    totalTickets: z.number().int(),
    totalRevenue: z.number(),
    totalCommission: z.number(),
    totalPlatform: z.number(),
  }),
});

// ── Doctor commission report ──────────────────────────────────────────────────
export const DoctorCommissionReportQuerySchema = z.object({
  from: z
    .string()
    .min(1, "Vui lòng chọn ngày bắt đầu.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ."),
  to: z
    .string()
    .min(1, "Vui lòng chọn ngày kết thúc.")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Ngày không hợp lệ."),
  doctorId: z.string().uuid().optional(),
});

export const DoctorCommissionItemSchema = z.object({
  doctorId: z.string().uuid(),
  doctorName: z.string(),
  totalTickets: z.number().int(),
  totalCommission: z.number(),
  categoryBreakdown: z
    .array(
      z.object({
        categoryName: z.string(),
        categoryCode: z.string(),
        count: z.number().int(),
        commission: z.number(),
      }),
    )
    .optional(),
});

export const DoctorCommissionReportResSchema = z.object({
  data: z.array(DoctorCommissionItemSchema),
  summary: z.object({
    totalDoctors: z.number().int(),
    totalCommission: z.number(),
  }),
});

// ── Inferred types ────────────────────────────────────────────────────────────
export type TicketRevenueReportQueryType = z.infer<
  typeof TicketRevenueReportQuerySchema
>;
export type TicketRevenueItemType = z.infer<typeof TicketRevenueItemSchema>;
export type TicketRevenueReportResType = z.infer<
  typeof TicketRevenueReportResSchema
>;
export type DoctorCommissionReportQueryType = z.infer<
  typeof DoctorCommissionReportQuerySchema
>;
export type DoctorCommissionItemType = z.infer<
  typeof DoctorCommissionItemSchema
>;
export type DoctorCommissionReportResType = z.infer<
  typeof DoctorCommissionReportResSchema
>;

// Clawback schema đã gỡ — flow `POST /admin/tickets/:id/clawback` không
// integrate trên web FE (xem docs/ticket-v2/ticket-v2.md, quyết định
// 2026-05-09). Endpoint vẫn còn ở BE để xử lý offline/manual nếu cần.
