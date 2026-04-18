import { z } from "zod";

export const IncidentSeveritySchema = z.enum([
  "low",
  "medium",
  "high",
  "critical",
]);
export const TicketStatusSchema = z.enum([
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
  "cancelled",
]);
export const TicketPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
export const TicketTypeSchema = z.enum(["general_support", "incident"]);

export const TicketUserBriefSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  role: z.string(),
});

export const TicketZoneBriefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  farmId: z.string().uuid(),
});

export const TicketFarmBriefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  ownerId: z.string().uuid(),
});

export const TicketAttachmentInputSchema = z.object({
  url: z.string().min(1),
});

export const TicketAttachmentBriefSchema = z.object({
  id: z.string().uuid(),
  url: z.string(),
  uploadedBy: z.string().uuid(),
  createdAt: z.string().datetime(),
});

export const TicketIncidentResSchema = z.object({
  id: z.string().uuid(),
  ticketNumber: z.string(),
  ticketType: TicketTypeSchema,
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  severity: IncidentSeveritySchema,
  title: z.string(),
  description: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  createdBy: z.string().uuid(),
  assignedTo: z.string().uuid().nullable(),
  farmId: z.string().uuid().nullable(),
  zoneId: z.string().uuid(),
  creator: TicketUserBriefSchema,
  assignee: TicketUserBriefSchema.nullable(),
  farm: TicketFarmBriefSchema.nullable(),
  zone: TicketZoneBriefSchema.nullable(),
  attachments: z.array(TicketAttachmentBriefSchema),
  productionMilestone: z.object({
    id: z.string().uuid(),
  }),
});

export const CreateIncidentTicketBodySchema = z.object({
  milestoneId: z.string().uuid({ message: "Vui lòng chọn cột mốc sản xuất." }),
  title: z.string().min(1, "Tiêu đề không được để trống."),
  description: z.string().min(1, "Mô tả không được để trống."),
  severity: IncidentSeveritySchema,
  attachments: z.array(TicketAttachmentInputSchema).optional(),
});

export const ListIncidentTicketsQuerySchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
});

export const TicketIncidentListResSchema = z.object({
  data: z.array(TicketIncidentResSchema),
  meta: z.object({
    page: z.number(),
    limit: z.number(),
    totalItems: z.number(),
    totalPages: z.number(),
    hasNextPage: z.boolean(),
    hasPreviousPage: z.boolean(),
  }),
});

export type IncidentSeverityType = z.infer<typeof IncidentSeveritySchema>;
export type TicketStatusType = z.infer<typeof TicketStatusSchema>;
export type TicketPriorityType = z.infer<typeof TicketPrioritySchema>;
export type TicketIncidentResType = z.infer<typeof TicketIncidentResSchema>;
export type TicketUserBriefType = z.infer<typeof TicketUserBriefSchema>;
export type TicketFarmBriefType = z.infer<typeof TicketFarmBriefSchema>;
export type TicketZoneBriefType = z.infer<typeof TicketZoneBriefSchema>;
export type CreateIncidentTicketBodyType = z.infer<
  typeof CreateIncidentTicketBodySchema
>;
export type ListIncidentTicketsQueryType = z.infer<
  typeof ListIncidentTicketsQuerySchema
>;
export type TicketIncidentListResType = z.infer<
  typeof TicketIncidentListResSchema
>;
