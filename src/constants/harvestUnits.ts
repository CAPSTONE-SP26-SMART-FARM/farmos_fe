// Danh sách đơn vị thu hoạch dùng chung cho dropdown HarvestRecord.
// BE chỉ validate độ dài 1..20 (`harvest-record.model.ts`) — preset đây để
// UI hiển thị consistent, KHÔNG enforce ở BE. Nếu cần thêm/bớt, sửa tại đây
// để mọi form trên FE đồng bộ.

export interface HarvestUnitOption {
  value: string;
  label: string;
}

export const COMMON_HARVEST_UNITS: ReadonlyArray<HarvestUnitOption> = [
  { value: "kg", label: "Kilôgam (kg)" },
  { value: "tấn", label: "Tấn" },
  { value: "tạ", label: "Tạ (100 kg)" },
  { value: "yến", label: "Yến (10 kg)" },
  { value: "g", label: "Gam (g)" },
  { value: "bao", label: "Bao" },
  { value: "thùng", label: "Thùng" },
  { value: "buồng", label: "Buồng" },
  { value: "bó", label: "Bó" },
  { value: "quả", label: "Quả / Trái" },
] as const;

// Helper: check 1 unit value có nằm trong preset không. Dùng ở form edit để
// quyết định có cần append "legacy unit" vào dropdown hay không.
export function isPresetHarvestUnit(value: string | null | undefined): boolean {
  if (!value) return false;
  return COMMON_HARVEST_UNITS.some((u) => u.value === value);
}
