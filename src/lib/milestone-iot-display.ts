/**
 * Quy tắc hiển thị thiết bị IoT gắn mốc — đồng bộ UX Manager/Owner:
 * - Không ghép `(mã)` nếu mã là UUID
 * - Không hiển thị nhãn loại cho board_module (“bo mạch điều khiển” không lên UI)
 */

export function isProbablyUuidLike(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s.trim(),
  );
}

const MODULE_TYPE_VI: Record<string, string> = {
  lora_module: "Mô-đun LoRa",
  wifi_module: "Mô-đun Wi-Fi",
};

export type MilestoneIotDeviceDisplay = {
  deviceName?: string | null;
  deviceCode?: string | null;
  deviceType?: string | null;
  /** Nhãn dán vật lý (K001, W001…) — ưu tiên làm tên hiển thị nếu có. */
  label?: string | null;
};

/**
 * Hiển thị board theo nhãn dán vật lý: ưu tiên `label` (K001, W001…) làm tên
 * chính cho dễ đối chiếu với thiết bị thật. Board không có nhãn (mô-đun LoRa)
 * thì fallback về `deviceName`.
 */
export type BoardLabelDisplay = {
  label?: string | null;
  deviceName?: string | null;
};

/** Dòng tên chính: nhãn dán nếu có, không thì tên thiết bị. */
export function boardPrimaryLabel(device: BoardLabelDisplay): string {
  return device.label?.trim() || device.deviceName?.trim() || "Thiết bị không xác định";
}

/** Dòng phụ dưới tên: tên thiết bị, chỉ hiện khi đã dùng nhãn dán làm tên chính. */
export function boardSecondaryName(device: BoardLabelDisplay): string | undefined {
  const name = device.deviceName?.trim();
  if (!name) return undefined;
  return device.label?.trim() ? name : undefined;
}

/** Tên hiển thị + (mã) chỉ khi mã không phải UUID */
export function formatMilestoneIotDeviceWithOptionalCode(
  device: MilestoneIotDeviceDisplay,
): string {
  const name = device.deviceName?.trim() || "Thiết bị không xác định";
  const rawCode = device.deviceCode?.trim();
  if (
    rawCode !== undefined &&
    rawCode !== "" &&
    !isProbablyUuidLike(rawCode)
  ) {
    return `${name} (${rawCode})`;
  }
  return name;
}

/** Nhãn phụ kiểu mô-đun (Wi-Fi / LoRa / …); bỏ qua board chủ */
export function milestoneIotModuleTypeVi(
  deviceType?: string | null,
): string | undefined {
  if (!deviceType) return undefined;
  if (deviceType === "board_module") return undefined;
  return MODULE_TYPE_VI[deviceType] ?? deviceType.replace(/_/g, " ");
}

export function formatMilestoneIotDetailDeviceLabel(
  device: MilestoneIotDeviceDisplay,
): string {
  const typeLabel = milestoneIotModuleTypeVi(device.deviceType);
  // Ưu tiên nhãn dán vật lý (K001…) làm tên cho dễ đối chiếu; không có thì
  // mới dùng tên thiết bị (+ mã nếu mã không phải UUID).
  const base =
    device.label?.trim() || formatMilestoneIotDeviceWithOptionalCode(device);
  return typeLabel ? `${base} · ${typeLabel}` : base;
}

/**
 * Dòng phụ dưới tên trong tab IoT: mã không-UUID hoặc chỉ “N cảm biến…”
 */
export function formatMilestoneIotLinkedSensorsSubtitle(
  device: MilestoneIotDeviceDisplay,
  linkedSensorCount: number,
): string {
  const rawCode = device.deviceCode?.trim();
  const suffix = `${linkedSensorCount} cảm biến liên kết`;
  if (
    rawCode !== undefined &&
    rawCode !== "" &&
    !isProbablyUuidLike(rawCode)
  ) {
    return `${rawCode} · ${suffix}`;
  }
  return suffix;
}

/** Popup chọn board: chỉ trạng thái cho board_module; không thêm cụm “bo mạch…” */
export function formatMilestoneIotPickerSubtitle(
  deviceType: string,
  statusLabelVi: string,
): string {
  if (deviceType === "board_module") return statusLabelVi;
  const typeVi =
    MODULE_TYPE_VI[deviceType] ?? deviceType.replace(/_/g, " ");
  return `${typeVi} · ${statusLabelVi}`;
}
