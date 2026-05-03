import { z } from "zod";
import { PagingRequestSchema, PagingResponseSchema } from "@/types/api";

// ── Enums ──────────────────────────────────────────────────────────────

export const TaskPrioritySchema = z.enum(["low", "normal", "high", "urgent"]);
export const TaskStatusSchema = z.enum([
  "pending",
  "in_progress",
  "completed",
  "verified",
  "cancelled",
]);

// ── Task response ──────────────────────────────────────────────────────

export const EmployeeTaskResSchema = z.object({
  id: z.string().uuid(),
  milestoneId: z.string().uuid().nullable(),
  assignedTo: z.string().uuid().nullable(),
  assignedDate: z.string().nullable(),
  title: z.string(),
  description: z.string().nullable(),
  priority: TaskPrioritySchema,
  status: TaskStatusSchema,
  dueDate: z.string().nullable(),
  startDate: z.string().nullable(),
  completedAt: z.string().nullable(),
  verifiedBy: z.string().uuid().nullable(),
  verifiedAt: z.string().nullable(),
  createdBy: z.string().uuid(),
  createdInPlan: z.boolean().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  deletedAt: z.string().nullable(),
});

// ── Create (batch) ─────────────────────────────────────────────────────

export const CreateEmployeeTaskItemSchema = z.object({
  assignedTo: z.string().uuid().nullable().optional(),
  title: z.string().min(1, "Tiêu đề là bắt buộc").max(255),
  description: z.string().nullable().optional(),
  priority: TaskPrioritySchema.default("normal"),
});

export const CreateEmployeeTaskBatchBodySchema = z
  .object({
    tasks: z
      .array(CreateEmployeeTaskItemSchema)
      .min(1, "Cần ít nhất 1 nhiệm vụ"),
  })
  .superRefine((data, ctx) => {
    const titles = new Set<string>();
    for (let i = 0; i < data.tasks.length; i++) {
      const titleKey = data.tasks[i].title.trim().toLowerCase();
      if (titles.has(titleKey)) {
        ctx.addIssue({
          code: "custom",
          message: "Tiêu đề nhiệm vụ bị trùng lặp",
          path: ["tasks", i, "title"],
        });
        return;
      }
      titles.add(titleKey);
    }
  });

// ── Update ─────────────────────────────────────────────────────────────

export const UpdateEmployeeTaskBodySchema = z.object({
  assignedTo: z.string().uuid().nullable().optional(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  priority: TaskPrioritySchema.optional(),
  status: TaskStatusSchema.optional(),
});

// ── Assign farmer ──────────────────────────────────────────────────────

export const AssignFarmerToTaskBodySchema = z.object({
  farmerId: z.string().uuid("ID nông dân không hợp lệ"),
});

// ── List query ─────────────────────────────────────────────────────────

export const ListEmployeeTasksQuerySchema = PagingRequestSchema.extend({
  status: TaskStatusSchema.optional(),
  priority: TaskPrioritySchema.optional(),
});

// ── List response ──────────────────────────────────────────────────────

export const ListEmployeeTasksResSchema = PagingResponseSchema(
  EmployeeTaskResSchema,
);

export const EmployeeTaskBatchResSchema = z.array(EmployeeTaskResSchema);

// ── Type exports ───────────────────────────────────────────────────────

export type TaskPriorityType = z.infer<typeof TaskPrioritySchema>;
export type TaskStatusType = z.infer<typeof TaskStatusSchema>;
export type EmployeeTaskResType = z.infer<typeof EmployeeTaskResSchema>;
export type CreateEmployeeTaskItemType = z.infer<
  typeof CreateEmployeeTaskItemSchema
>;
export type CreateEmployeeTaskBatchBodyType = z.infer<
  typeof CreateEmployeeTaskBatchBodySchema
>;
export type UpdateEmployeeTaskBodyType = z.infer<
  typeof UpdateEmployeeTaskBodySchema
>;
export type AssignFarmerToTaskBodyType = z.infer<
  typeof AssignFarmerToTaskBodySchema
>;
export type ListEmployeeTasksQueryType = z.infer<
  typeof ListEmployeeTasksQuerySchema
>;
export type ListEmployeeTasksResType = z.infer<
  typeof ListEmployeeTasksResSchema
>;
export type EmployeeTaskBatchResType = z.infer<
  typeof EmployeeTaskBatchResSchema
>;

// ── Eligible Farmer ────────────────────────────────────────────────────

export const EligibleFarmerResSchema = z.object({
  userId: z.string().uuid(),
  fullName: z.string(),
  email: z.string(),
  phone: z.string().nullable(),
});

export type EligibleFarmerResType = z.infer<typeof EligibleFarmerResSchema>;
