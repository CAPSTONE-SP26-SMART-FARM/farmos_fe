// Reason format chuẩn từ BE: "<reasonType> sensorId=<uuid> → <toStatus>"
// Ví dụ: "sensor_timeout sensorId=4202c892-... → error"

const REASON_LABEL: Record<string, string> = {
  sensor_timeout: "Sensor mất tín hiệu",
  no_data: "Không nhận được dữ liệu",
  manual: "Thao tác thủ công",
  cron_detect: "Hệ thống tự phát hiện",
  mqtt_offline: "MQTT mất kết nối",
};

export interface ParsedReason {
  type: string;
  typeLabel: string;
  sensorId?: string;
  toStatus?: string;
  raw: string;
}

export function parseReason(
  reason: string | null | undefined,
): ParsedReason | null {
  if (!reason) return null;
  const match = reason.match(
    /^(\w+)(?:\s+sensorId=([\w-]+))?(?:\s+→\s+(\w+))?$/,
  );
  if (!match) {
    return { type: "unknown", typeLabel: reason, raw: reason };
  }
  const [, type, sensorId, toStatus] = match;
  return {
    type,
    typeLabel: REASON_LABEL[type] ?? type.replace(/_/g, " "),
    sensorId: sensorId ?? undefined,
    toStatus: toStatus ?? undefined,
    raw: reason,
  };
}

// Hiển thị fallback thân thiện cho UUID — chỉ show 4 ký tự đầu + cuối.
export function shortId(id: string | undefined | null): string {
  if (!id) return "—";
  if (id.length <= 12) return id;
  return `${id.slice(0, 4)}…${id.slice(-4)}`;
}

export function deviceDisplayName(
  device: { deviceName?: string | null } | null | undefined,
  deviceId: string,
): string {
  if (device?.deviceName) return device.deviceName;
  return `Vi xử lý ${shortId(deviceId)}`;
}
