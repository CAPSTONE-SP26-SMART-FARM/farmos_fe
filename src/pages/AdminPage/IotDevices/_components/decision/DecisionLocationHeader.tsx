import { MapPin, Package } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DeviceLocationType } from "@/schemaValidatation/iotDeviceAdminOps";

interface Props {
  location: DeviceLocationType;
  ownerName?: string | null;
}

export function DecisionLocationHeader({ location, ownerName }: Props) {
  if (location.isInWarehouse) {
    return (
      <Card className="border-amber-200 bg-amber-50/40">
        <CardContent className="flex flex-wrap items-center gap-2 py-3 text-sm">
          <Package
            className="h-4 w-4 text-amber-600"
            aria-hidden
          />
          <span className="font-medium text-amber-800">Đang ở kho hệ thống</span>
          <span className="text-muted-foreground">
            · Chưa lắp tại hiện trường
          </span>
          {ownerName ? (
            <span className="text-muted-foreground">
              · Chủ trang trại: {ownerName}
            </span>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="space-y-1 py-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <MapPin
            className="h-4 w-4 text-primary"
            aria-hidden
          />
          <span className="font-medium">
            {location.farmName ?? "Chưa rõ nông trại"}
          </span>
          {location.zoneName ? (
            <>
              <span className="text-muted-foreground">→</span>
              <span>{location.zoneName}</span>
            </>
          ) : (
            <span className="text-amber-700">· Chưa gán khu vực</span>
          )}
        </div>
        {location.farmAddress ? (
          <p className="pl-6 text-muted-foreground">{location.farmAddress}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
