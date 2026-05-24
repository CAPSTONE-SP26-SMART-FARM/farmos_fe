/**
 * Translate raw BE reason strings (snake_case English / mixed) into user-friendly
 * Vietnamese sentences. Reasons come from IotDeviceLog STATUS_CHANGED rows
 * captured at the moment a device flipped to `error`.
 */
const REASON_DICT: Array<{ test: (s: string) => boolean; vi: string }> = [
  {
    test: (s) => s.startsWith("swap_due_to_error"),
    vi: "Đã thay thiết bị do lỗi",
  },
  {
    test: (s) => s.startsWith("swap_replacement_for"),
    vi: "Thiết bị mới (thay thế cho thiết bị lỗi)",
  },
  {
    test: (s) => s.includes("sensor_timeout"),
    vi: "Mất kết nối cảm biến",
  },
  {
    test: (s) => s.includes("sensor_never_seen"),
    vi: "Cảm biến chưa từng kết nối",
  },
  {
    test: (s) => s.includes("admin_fixed"),
    vi: "Quản trị viên đã đánh dấu sửa xong",
  },
  {
    test: (s) => s.includes("install_blocked"),
    vi: "Không thể lắp đặt tại hiện trường",
  },
  {
    test: (s) => s.includes("recovery_"),
    vi: "Đang trong quy trình thu hồi",
  },
  {
    test: (s) => s.includes("admin_soft_deleted_device"),
    vi: "Quản trị viên đã xóa thiết bị",
  },
  {
    test: (s) => s.includes("data_received") && s.includes("error → active"),
    vi: "Thiết bị tự kết nối trở lại",
  },
];

export function translateReason(raw: string | null | undefined): string {
  if (!raw) return "Chưa rõ nguyên nhân";
  for (const rule of REASON_DICT) {
    if (rule.test(raw)) return rule.vi;
  }
  // Fallback: hide raw English/JSON from user — generic message.
  return "Đã ghi nhận sự cố, xem chi tiết trong nhật ký thiết bị";
}

export function formatDaysInState(days: number): string {
  if (days <= 0) return "Hôm nay";
  return `${days} ngày`;
}

export function formatVietnameseDateTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}
