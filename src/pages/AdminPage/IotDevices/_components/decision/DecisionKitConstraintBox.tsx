import { Badge } from "@/components/ui/badge";
import {
  SENSOR_TYPE_LABEL,
} from "@/constants/iotDeviceDisplay";
import type { KitConstraintType } from "@/schemaValidatation/iotDeviceAdminOps";

const MODULE_LABEL: Record<string, string> = {
  esp32: "Mô-đun Wi-Fi",
  lora: "Mô-đun LoRa",
  wifi: "Mô-đun Wi-Fi",
};

interface Props {
  kit: KitConstraintType;
}

export function DecisionKitConstraintBox({ kit }: Props) {
  // BE có thể trả kit constraint rỗng (kit không yêu cầu sensor/module
  // cụ thể nào). Khi đó không render box — tránh title "Yêu cầu của kit"
  // mà bên dưới trống không.
  if (kit.includedSensors.length === 0 && kit.includedModules.length === 0) {
    return null;
  }
  return (
    <div className="rounded-md border bg-muted/30 p-3 text-sm">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {`Yêu cầu của bộ kit «${kit.kitName}»`}
      </p>
      <div className="space-y-1.5">
        {kit.includedSensors.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground">Cảm biến:</span>
            {kit.includedSensors.map((s) => (
              <Badge
                key={s}
                variant="outline"
                className="border-emerald-200 bg-emerald-50 text-[11px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
              >
                {SENSOR_TYPE_LABEL[s] ?? s}
              </Badge>
            ))}
          </div>
        )}
        {kit.includedModules.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-muted-foreground">Mô-đun:</span>
            {kit.includedModules.map((m) => (
              <Badge
                key={m}
                variant="outline"
                className="border-blue-200 bg-blue-50 text-[11px] text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300"
              >
                {MODULE_LABEL[m] ?? m}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
