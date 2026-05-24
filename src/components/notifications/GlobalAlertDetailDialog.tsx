import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { useSelectedAlertStore } from "@/stores/selectedAlertStore";
import { useListAlerts } from "@/queries/useAlert";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import AlertDetailDialog from "@/pages/SensorReadings/components/AlertDetailDialog";

export default function GlobalAlertDetailDialog() {
  const alertId = useSelectedAlertStore((s) => s.alertId);
  const close = useSelectedAlertStore((s) => s.close);

  const { data, isFetching } = useListAlerts({ page: 1, limit: 8 });

  const alert = useMemo(() => {
    if (!alertId) return null;
    return data?.data.find((a) => a.id === alertId) ?? null;
  }, [alertId, data]);

  if (alertId && !alert && isFetching) {
    return (
      <Dialog open onOpenChange={(open) => !open && close()}>
        <DialogContent className="flex flex-col items-center gap-4 py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <AlertDetailDialog
      alert={alert}
      open={alertId !== null}
      onOpenChange={(open) => !open && close()}
    />
  );
}
