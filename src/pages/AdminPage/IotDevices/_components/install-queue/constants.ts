// Ngưỡng cảnh báo theo số ngày kit chờ xuất kho.
// >= DANGER → đỏ (cần xử lý ngay)
// >= WARNING → vàng (cần để ý)
// còn lại → muted
export const AGE_THRESHOLD_DANGER = 5;
export const AGE_THRESHOLD_WARNING = 3;

// Khi ≥ ngưỡng này nhóm farm, collapse mặc định để admin không phải
// scroll quá dài.
export const COLLAPSE_DEFAULT_THRESHOLD = 6;

export const SORT_LABEL = {
  oldestAge: "Cũ nhất trước",
  newestAge: "Mới nhất trước",
  deviceCount: "Nhóm đông nhất trước",
} as const;

export type SortKey = keyof typeof SORT_LABEL;

/** Sắp xếp danh sách farm trên client (API chưa hỗ trợ sort param). */
export function sortInstallQueueFarms<T extends { oldestAgeDays: number; totalDevices: number }>(
  farms: T[],
  sortKey: SortKey,
): T[] {
  const copy = [...farms];
  switch (sortKey) {
    case "oldestAge":
      return copy.sort((a, b) => b.oldestAgeDays - a.oldestAgeDays);
    case "newestAge":
      return copy.sort((a, b) => a.oldestAgeDays - b.oldestAgeDays);
    case "deviceCount":
      return copy.sort((a, b) => b.totalDevices - a.totalDevices);
    default:
      return copy;
  }
}
