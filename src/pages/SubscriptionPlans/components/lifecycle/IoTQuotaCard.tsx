import { Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MyQuotaResType } from "@/schemaValidatation/subscription";

interface IoTQuotaCardProps {
  iotDevices: MyQuotaResType["iotDevices"];
}

export function IoTQuotaCard({ iotDevices }: IoTQuotaCardProps) {
  const { subscriptionMax, kitBonus, used, remaining } = iotDevices;
  const totalLimit = subscriptionMax + kitBonus;
  const usedPercent =
    totalLimit > 0 ? Math.min(100, Math.round((used / totalLimit) * 100)) : 0;
  const isFull = usedPercent >= 100;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wifi className="h-4 w-4 text-primary" />
          Hạn ngạch thiết bị IoT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Hạn mức gói</p>
            <p className="text-2xl font-semibold">{subscriptionMax}</p>
            {kitBonus > 0 && (
              <p className="text-xs text-muted-foreground">
                +{kitBonus} từ gói bổ trợ
              </p>
            )}
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Đã dùng</p>
            <p className="text-2xl font-semibold">{used}</p>
          </div>
          <div
            className={cn(
              "rounded-md border p-3",
              isFull
                ? "border-destructive/40 bg-destructive/5"
                : "border-primary/40 bg-primary/5",
            )}
          >
            <p className="text-xs text-muted-foreground">Còn lại</p>
            <p
              className={cn(
                "text-2xl font-semibold",
                isFull ? "text-destructive" : "text-primary",
              )}
            >
              {remaining}
            </p>
          </div>
        </div>

        {totalLimit > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tỷ lệ sử dụng</span>
              <span
                className={cn(
                  "font-medium",
                  isFull ? "text-destructive" : "text-foreground",
                )}
              >
                {used}/{totalLimit} ({usedPercent}%)
                {isFull && " · Hết quota"}
              </span>
            </div>
            <div
              className={cn(
                "h-2 w-full overflow-hidden rounded-full",
                isFull ? "bg-destructive/20" : "bg-primary/20",
              )}
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  isFull ? "bg-destructive" : "bg-primary",
                )}
                style={{ width: `${usedPercent}%` }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default IoTQuotaCard;
