import { useMemo } from "react";
import { useSelectedAlertStore } from "@/stores/selectedAlertStore";
import { useListAlerts } from "@/queries/useAlert";
import AlertDetailDialog from "@/pages/SensorReadings/components/AlertDetailDialog";

/**
 * Dialog detail alert dùng chung cho toàn dashboard. Toast (từ realtime
 * `alert.created`) và các nơi cần xem nhanh alert đều mở dialog này thông
 * qua `useSelectedAlertStore.open(alertId)` — không navigate sang trang
 * khác. Mount 1 lần ở DashboardLayout.
 *
 * Lookup alert bằng cache `["alerts"]`: hook tự subscribe `useListAlerts`
 * (page 1, limit 8) để cache luôn có dữ liệu mới nhất, đồng thời `refetchInterval`
 * 60s + invalidate từ realtime đảm bảo data tươi khi cần open.
 */
export default function GlobalAlertDetailDialog() {
  const alertId = useSelectedAlertStore((s) => s.alertId);
  const close = useSelectedAlertStore((s) => s.close);

  const { data } = useListAlerts({ page: 1, limit: 8 });

  const alert = useMemo(() => {
    if (!alertId) return null;
    return data?.data.find((a) => a.id === alertId) ?? null;
  }, [alertId, data]);

  return (
    <AlertDetailDialog
      alert={alert}
      open={alertId !== null}
      onOpenChange={(open) => !open && close()}
    />
  );
}
