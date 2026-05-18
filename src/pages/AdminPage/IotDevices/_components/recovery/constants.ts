export const COLLAPSE_DEFAULT_THRESHOLD = 6;

export const SORT_LABEL = {
  oldestOverdue: "Quá hạn lâu nhất",
  newestOverdue: "Quá hạn gần nhất",
  deviceCount: "Nhóm đông nhất trước",
} as const;

export type RecoverySortKey = keyof typeof SORT_LABEL;

export function sortRecoveryQueueFarms<
  T extends { oldestOverdueDays: number; totalDevices: number },
>(farms: T[], sortKey: RecoverySortKey): T[] {
  const copy = [...farms];
  switch (sortKey) {
    case "oldestOverdue":
      return copy.sort((a, b) => b.oldestOverdueDays - a.oldestOverdueDays);
    case "newestOverdue":
      return copy.sort((a, b) => a.oldestOverdueDays - b.oldestOverdueDays);
    case "deviceCount":
      return copy.sort((a, b) => b.totalDevices - a.totalDevices);
    default:
      return copy;
  }
}
