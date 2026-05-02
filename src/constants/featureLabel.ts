/**
 * Vietnamese display labels for known subscription feature codes.
 * Falls back to a humanized form of the code if not listed.
 */
const FEATURE_LABELS: Record<string, string> = {
  NUMBER_OF_FARMS: "Số nông trại",
  NUMBER_OF_ZONES_PER_FARM: "Số khu vực mỗi nông trại",
  NUMBER_OF_MEMBERS_PER_FARM: "Số thành viên mỗi nông trại",
  NUMBER_OF_IOT_DEVICES: "Số thiết bị IoT",
  TICKET_CREDITS: "Lượt yêu cầu hỗ trợ",
  AI_DIAGNOSIS: "Chẩn đoán AI",
  REALTIME_DASHBOARD: "Bảng điều khiển thời gian thực",
  DATA_RETENTION_DAYS: "Số ngày lưu trữ dữ liệu",
};

export function formatFeatureLabel(code: string): string {
  if (FEATURE_LABELS[code]) return FEATURE_LABELS[code];
  return code
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
