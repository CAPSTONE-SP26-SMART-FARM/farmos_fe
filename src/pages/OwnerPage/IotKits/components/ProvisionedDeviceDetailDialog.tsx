import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DEVICE_TYPE_LABEL,
  IOT_ACTION_BADGE_CLASS,
  IOT_ACTION_LABEL,
  SENSOR_STATUS_LABEL,
  SENSOR_TYPE_ICON,
  SENSOR_TYPE_LABEL,
  STATUS_META,
} from "@/constants/iotDeviceDisplay";
import { formatDateVi } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useOwnerIotDeviceDetail } from "@/queries/useIotDevice";
import { Cpu, Gauge, History, MapPin } from "lucide-react";

interface ProvisionedDeviceDetailDialogProps {
  deviceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function InfoRow({
  label,
  value,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

export default function ProvisionedDeviceDetailDialog({
  deviceId,
  open,
  onOpenChange,
}: ProvisionedDeviceDetailDialogProps) {
  const detailQuery = useOwnerIotDeviceDetail(
    deviceId ?? "",
    "",
    open && !!deviceId,
  );
  const device = detailQuery.data?.data ?? null;
  const statusMeta = device ? STATUS_META[device.status] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="pr-8">
          <DialogTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            {device?.deviceName ?? "Chi tiết thiết bị"}
          </DialogTitle>
          <DialogDescription>
            {device
              ? DEVICE_TYPE_LABEL[device.deviceType] ?? device.deviceType
              : "Đang tải thông tin thiết bị…"}
          </DialogDescription>
          {statusMeta && (
            <div className="pt-1">
              <Badge variant="outline" className={statusMeta.badgeClass}>
                {statusMeta.labelUser}
              </Badge>
            </div>
          )}
        </DialogHeader>

        {detailQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !device ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Không tải được chi tiết thiết bị.
          </p>
        ) : (
          <>
            <section className="space-y-2 rounded-lg border bg-muted/20 p-3">
              <InfoRow
                label="Địa chỉ MAC"
                value={
                  device.macAddress ? (
                    <span className="font-mono">{device.macAddress}</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />
              <InfoRow
                label="Ngày cấp"
                value={formatDateVi(device.installedAt)}
              />
              {device.farm && (
                <InfoRow
                  label={
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      Nông trại
                    </span>
                  }
                  value={`${device.farm.name} · ${device.farm.code}`}
                />
              )}
            </section>

            {device.sensors.length > 0 && (
              <section className="space-y-2">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <Gauge className="h-4 w-4 text-primary" />
                  Cảm biến ({device.sensors.length})
                </p>
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2 text-left">Loại</th>
                        <th className="px-3 py-2 text-left">Trạng thái</th>
                        <th className="px-3 py-2 text-right">Ngưỡng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {device.sensors.map((s) => {
                        const SIcon = SENSOR_TYPE_ICON[s.sensorType];
                        return (
                        <tr key={s.id} className="border-t">
                          <td className="px-3 py-2 font-medium">
                            <span className="inline-flex items-center gap-1.5">
                              {SIcon && <SIcon className="h-3.5 w-3.5 text-primary" />}
                              {SENSOR_TYPE_LABEL[s.sensorType] ?? s.sensorType}
                            </span>
                          </td>
                          <td className="px-3 py-2">
                            {SENSOR_STATUS_LABEL[s.status] ?? s.status}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                            {s.minValue} – {s.maxValue}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {device.latestLog && (
              <section className="space-y-2 rounded-lg border bg-muted/20 p-3">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <History className="h-4 w-4 text-primary" />
                  Hoạt động gần nhất
                </p>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                  <Badge
                    variant="outline"
                    className={cn(
                      IOT_ACTION_BADGE_CLASS[device.latestLog.action] ?? "",
                    )}
                  >
                    {IOT_ACTION_LABEL[device.latestLog.action] ??
                      device.latestLog.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatDateVi(device.latestLog.createdAt)}
                  </span>
                </div>
                {device.latestLog.reason && (
                  <p className="text-xs text-muted-foreground">
                    {device.latestLog.reason}
                  </p>
                )}
              </section>
            )}
          </>
        )}

        <Separator />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
