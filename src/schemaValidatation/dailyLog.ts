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
  createdAt: z.string(),
});

export const ListDailyLogsQuerySchema = PagingRequestSchema.extend({
  zoneId: z.string().uuid().optional(),
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
export type DailyLogResType = z.infer<typeof DailyLogResSchema>;
export type ListDailyLogsQueryType = z.infer<typeof ListDailyLogsQuerySchema>;
export type ListDailyLogsResType = z.infer<typeof ListDailyLogsResSchema>;
