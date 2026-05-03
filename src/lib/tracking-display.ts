import { format, parseISO } from "date-fns";
import type { TrackingEntityType } from "@/schemaValidatation/tracking";

// ── Field name → Vietnamese label ─────────────────────────────────────────
export const FIELD_LABEL_MAP: Record<string, string> = {
  // CropSeason fields
  cropName: "Tên mùa vụ",
  variety: "Giống cây",
  expectedHarvestDate: "Ngày thu hoạch dự kiến",
  actualHarvestDate: "Ngày thu hoạch thực tế",
  notes: "Ghi chú",
  status: "Trạng thái",

  // ProductionMilestone fields
  stageName: "Tên giai đoạn",
  milestoneOrder: "Thứ tự",
  expectedStartDate: "Ngày bắt đầu dự kiến",
  expectedEndDate: "Ngày kết thúc dự kiến",
  actualStartDate: "Ngày bắt đầu thực tế",
  actualEndDate: "Ngày kết thúc thực tế",

  // EmployeeTask fields
  title: "Tiêu đề công việc",
  description: "Mô tả",
  priority: "Mức độ ưu tiên",
  assignedTo: "Người thực hiện",
  assignedDate: "Ngày phân công",
  completedAt: "Ngày hoàn thành",
  startDate: "Ngày bắt đầu",

  // HarvestRecord fields
  harvestDate: "Ngày thu hoạch",
  quantity: "Sản lượng",
  unit: "Đơn vị",
  qualityGrade: "Phân loại chất lượng",

  // IotDeviceAssignment fields
  iotDeviceId: "Thiết bị IoT",
  assignedAt: "Ngày gán",
  unassignedAt: "Ngày thu hồi",
  sensorBinding: "Ràng buộc cảm biến",
};

export function getFieldLabel(fieldName: string): string {
  return FIELD_LABEL_MAP[fieldName] ?? fieldName;
}

// ── EntityType → Vietnamese label ─────────────────────────────────────────
export const ENTITY_TYPE_LABEL: Record<TrackingEntityType, string> = {
  crop_season: "Mùa vụ",
  production_milestone: "Giai đoạn sản xuất",
  employee_task: "Công việc",
  harvest_record: "Bản ghi thu hoạch",
  iot_device_assignment: "Thiết bị IoT",
};

export function getEntityTypeLabel(entityType: TrackingEntityType): string {
  return ENTITY_TYPE_LABEL[entityType] ?? entityType;
}

// ── Resolve display name from entityId ───────────────────────────────────
export interface EntityNameRegistries {
  milestones?: Array<{ id: string; stageName?: string | null }>;
  tasks?: Array<{ id: string; title?: string | null }>;
  harvestRecords?: Array<{ id: string; harvestDate?: string | null }>;
  iotAssignments?: Array<{ id: string; iotDeviceId?: string | null }>;
}

export function resolveEntityName(
  entityType: TrackingEntityType,
  entityId: string,
  registries: EntityNameRegistries,
): string {
  switch (entityType) {
    case "production_milestone": {
      const found = registries.milestones?.find((m) => m.id === entityId);
      return found?.stageName ?? `Giai đoạn (${entityId.slice(0, 8)}…)`;
    }
    case "employee_task": {
      const found = registries.tasks?.find((t) => t.id === entityId);
      return found?.title ?? `Công việc (${entityId.slice(0, 8)}…)`;
    }
    case "harvest_record": {
      const found = registries.harvestRecords?.find((h) => h.id === entityId);
      const dateStr = found?.harvestDate
        ? format(parseISO(found.harvestDate), "dd/MM/yyyy")
        : entityId.slice(0, 8);
      return `Bản ghi thu hoạch (${dateStr})`;
    }
    case "iot_device_assignment": {
      const found = registries.iotAssignments?.find((a) => a.id === entityId);
      return found?.iotDeviceId
        ? `Thiết bị ${found.iotDeviceId.slice(0, 8)}`
        : `Thiết bị (${entityId.slice(0, 8)}…)`;
    }
    case "crop_season":
      return `Mùa vụ (${entityId.slice(0, 8)}…)`;
    default:
      return entityId.slice(0, 8) + "…";
  }
}

// ── Format raw plan/actual value by dataType ──────────────────────────────
export function formatTrackingValue(value: unknown, dataType: string): string {
  if (value === null || value === undefined) return "—";

  switch (dataType) {
    case "date":
    case "datetime": {
      try {
        const d =
          typeof value === "string"
            ? parseISO(value)
            : new Date(value as number);
        return format(d, "dd/MM/yyyy");
      } catch {
        return String(value);
      }
    }
    case "boolean":
      return value ? "Có" : "Không";
    case "enum":
    case "string":
    case "uuid":
    case "int":
    case "decimal":
    default:
      return String(value);
  }
}
