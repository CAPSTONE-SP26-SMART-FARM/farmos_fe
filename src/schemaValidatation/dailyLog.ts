import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";
import { z } from "zod";

// ============================================================
// Enums — mirror backend daily-log.model.ts
// ============================================================
export const TaskPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
export const TaskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "verified",
  "cancelled",
]);

// ============================================================
// FarmerTask (returned by GET /daily-log/tasks)
// ============================================================
export const FarmerTaskForDailyLogSchema = z.object({
  id: z.string().uuid(),
  milestoneId: z.string().uuid(),
  zoneId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  assignedDate: z.string().nullable(),
});

export const ListTasksForDailyLogQuerySchema = PagingRequestSchema.pick({
  page: true,
  limit: true,
});
export const TasksForDailyLogListResSchema = PagingResponseSchema(
  FarmerTaskForDailyLogSchema,
);

// ============================================================
// DailyLog (returned by /owner/farm/:farmId and /manager/zone/:zoneId)
// ============================================================
export const DailyLogZoneBriefSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
});

export const DailyLogFarmerSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});

export const DailyLogTaskBriefSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  milestoneId: z.string().uuid().nullable(),
});

// Ảnh / tệp đính kèm gửi kèm nhật ký — mirror backend TaskAttachmentResSchema
export const DailyLogAttachmentSchema = z.object({
  id: z.string().uuid(),
  employeeTaskId: z.string().uuid().nullable(),
  dailyLogId: z.string().uuid().nullable(),
  uploadedBy: z.string().uuid(),
  url: z.string(),
  fileName: z.string().nullable(),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().int().nullable(),
  createdAt: z.string(),
});

export const DailyLogResSchema = z.object({
  id: z.string().uuid(),
  zoneId: z.string().uuid(),
  zone: DailyLogZoneBriefSchema,
  milestoneId: z.string().uuid().nullable(),
  employeeTaskId: z.string().uuid().nullable(),
  task: DailyLogTaskBriefSchema.nullable(),
  logDate: z.string(),
  activities: z.string(),
  notes: z.string().nullable(),
  loggedBy: z.string().uuid(),
  farmer: DailyLogFarmerSchema,
  // BE luôn trả mảng (rỗng nếu không có ảnh); default cho an toàn với cache cũ
  attachments: z.array(DailyLogAttachmentSchema).default([]),
  createdAt: z.string(),
});

export const ListDailyLogsQuerySchema = PagingRequestSchema.extend({
  zoneId: z.string().uuid().optional(),
  milestoneId: z.string().uuid().optional(),
  employeeTaskId: z.string().uuid().optional(),
  loggedBy: z.string().uuid().optional(),
  fromDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  toDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

export const ListDailyLogsResSchema = PagingResponseSchema(DailyLogResSchema);

// ============================================================
// Submit daily log (POST /daily-log/submit — owner/manager/farmer)
// ============================================================
export const SubmitDailyLogBodySchema = z.object({
  employeeTaskId: z.string().uuid(),
  activities: z.string().min(1),
  notes: z.string().default(""),
});

// ============================================================
// Today tasks with log status (shared brief)
// ============================================================
export const TodayLogBriefSchema = z.object({
  id: z.string().uuid(),
  activities: z.string(),
  notes: z.string(),
  createdAt: z.string(),
});

export const FarmerTaskWithLogStatusSchema = z.object({
  id: z.string().uuid(),
  milestoneId: z.string().uuid(),
  zoneId: z.string().uuid(),
  milestoneName: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  startDate: z.string().nullable(),
  assignedDate: z.string().nullable(),
  hasLoggedToday: z.boolean(),
  todayLog: TodayLogBriefSchema.nullable(),
});

export const FarmerTasksWithLogStatusListResSchema = PagingResponseSchema(
  FarmerTaskWithLogStatusSchema,
);

// ============================================================
// Manager today tasks with log status (GET /daily-log/manager/zone/:zoneId/today)
// ============================================================
export const ManagerTaskWithLogStatusSchema = z.object({
  id: z.string().uuid(),
  milestoneId: z.string().uuid(),
  zoneId: z.string().uuid(),
  milestoneName: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  startDate: z.string().nullable(),
  assignedDate: z.string().nullable(),
  assignedTo: z.string().nullable(),
  farmerName: z.string().nullable(),
  farmerPhone: z.string().nullable(),
  hasLoggedToday: z.boolean(),
  todayLog: TodayLogBriefSchema.nullable(),
});

export const ListManagerTodayTasksQuerySchema = z.object({
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  milestoneId: z.string().uuid().optional(),
  hasLoggedToday: z.boolean().optional(),
});

export const ManagerTasksWithLogStatusListResSchema = PagingResponseSchema(
  ManagerTaskWithLogStatusSchema,
);

// ============================================================
// Type exports
// ============================================================
export type TaskPriorityType = z.infer<typeof TaskPrioritySchema>;
export type TaskStatusEnumType = z.infer<typeof TaskStatusSchema>;
export type FarmerTaskForDailyLogType = z.infer<
  typeof FarmerTaskForDailyLogSchema
>;
export type ListTasksForDailyLogQueryType = z.infer<
  typeof ListTasksForDailyLogQuerySchema
>;
export type TasksForDailyLogListResType = z.infer<
  typeof TasksForDailyLogListResSchema
>;
export type TodayLogBriefType = z.infer<typeof TodayLogBriefSchema>;
export type FarmerTaskWithLogStatusType = z.infer<
  typeof FarmerTaskWithLogStatusSchema
>;
export type FarmerTasksWithLogStatusListResType = z.infer<
  typeof FarmerTasksWithLogStatusListResSchema
>;
export type ManagerTaskWithLogStatusType = z.infer<
  typeof ManagerTaskWithLogStatusSchema
>;
export type ListManagerTodayTasksQueryType = z.infer<
  typeof ListManagerTodayTasksQuerySchema
>;
export type ManagerTasksWithLogStatusListResType = z.infer<
  typeof ManagerTasksWithLogStatusListResSchema
>;
export type DailyLogAttachmentType = z.infer<typeof DailyLogAttachmentSchema>;
export type DailyLogResType = z.infer<typeof DailyLogResSchema>;
export type ListDailyLogsQueryType = z.infer<typeof ListDailyLogsQuerySchema>;
export type ListDailyLogsResType = z.infer<typeof ListDailyLogsResSchema>;
export type SubmitDailyLogBodyType = z.infer<typeof SubmitDailyLogBodySchema>;
