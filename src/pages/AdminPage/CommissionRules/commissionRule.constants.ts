import type { CommissionScopeType } from "@/schemaValidatation/commissionRule";

export const SCOPE_LABELS: Record<CommissionScopeType, string> = {
  CATEGORY_DEFAULT: "Mặc định danh mục",
  DOCTOR_TIER: "Cấp bậc bác sĩ",
  DOCTOR: "Bác sĩ cụ thể",
};
