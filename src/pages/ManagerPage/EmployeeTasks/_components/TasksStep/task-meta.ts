import { AlertTriangle, Flag, type LucideIcon } from "lucide-react";
import type {
  TaskPriorityType,
  TaskStatusType,
  EmployeeTaskResType,
} from "@/schemaValidatation/employeeTask";

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";

export const STATUS_META: Record<
  TaskStatusType,
  { label: string; variant: BadgeVariant }
> = {
  pending: { label: "Chưa bắt đầu", variant: "secondary" },
  in_progress: { label: "Đang thực hiện", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
  verified: { label: "Đã xác minh", variant: "default" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

export const PRIORITY_META: Record<
  TaskPriorityType,
  { label: string; className: string; icon: LucideIcon }
> = {
  low: { label: "Thấp", className: "text-muted-foreground", icon: Flag },
  normal: { label: "Bình thường", className: "text-foreground", icon: Flag },
  high: { label: "Cao", className: "text-orange-600", icon: AlertTriangle },
  urgent: {
    label: "Khẩn cấp",
    className: "text-destructive",
    icon: AlertTriangle,
  },
};

export function getTaskDisplayStatus(task: EmployeeTaskResType): {
  label: string;
  variant: BadgeVariant;
} {
  if (task.status === "cancelled")
    return { label: "Đã hủy", variant: "destructive" };
  if (task.status === "verified")
    return { label: "Đã xác minh", variant: "default" };
  if (task.status === "completed")
    return { label: "Hoàn thành", variant: "outline" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (task.dueDate && new Date(task.dueDate) < today) {
    return { label: "Quá hạn", variant: "destructive" };
  }

  return STATUS_META[task.status];
}

// Task locked = không cho sửa, gán, hủy gán nữa.
export function isTaskLocked(task: EmployeeTaskResType): boolean {
  return (
    task.status === "completed" ||
    task.status === "verified" ||
    task.status === "cancelled"
  );
}

export function isUnassigned(task: EmployeeTaskResType): boolean {
  return !task.assignedTo;
}
