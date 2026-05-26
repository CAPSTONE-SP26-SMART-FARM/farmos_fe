import { Badge } from "@/components/ui/badge";
import {
  KIT_REQUEST_DIRECTION_LABEL,
  KIT_REQUEST_STATUS_BADGE_VARIANT,
  KIT_REQUEST_STATUS_LABEL,
  KIT_REQUEST_TYPE_LABEL,
} from "@/constants/iotKitRequestLabel";
import type {
  KitRequestDirectionType,
  KitRequestStatusType,
  KitRequestTypeType,
} from "@/schemaValidatation/iotKitRequest";
import { AlertTriangle, CalendarClock, PackageOpen } from "lucide-react";

/**
 * Badge tái sử dụng cho mọi page Iot Kit Request. Tách thành component
 * vì sẽ xuất hiện ở: cell bảng (owner + admin), filter chip, detail
 * sheet header, decision page card.
 */

export function KitRequestStatusBadge({
  status,
  className,
}: {
  status: KitRequestStatusType;
  className?: string;
}) {
  return (
    <Badge
      variant={KIT_REQUEST_STATUS_BADGE_VARIANT[status]}
      className={className}
    >
      {KIT_REQUEST_STATUS_LABEL[status]}
    </Badge>
  );
}

export function KitRequestTypeBadge({
  type,
  className,
}: {
  type: KitRequestTypeType;
  className?: string;
}) {
  const Icon =
    type === "FAULT_REPORT"
      ? AlertTriangle
      : type === "RECOVERY_SCHEDULE"
        ? PackageOpen
        : CalendarClock;
  return (
    <Badge
      variant="outline"
      className={`gap-1 ${className ?? ""}`}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {KIT_REQUEST_TYPE_LABEL[type]}
    </Badge>
  );
}

export function KitRequestDirectionBadge({
  direction,
  className,
}: {
  direction: KitRequestDirectionType;
  className?: string;
}) {
  return (
    <Badge
      variant="secondary"
      className={className}
    >
      {KIT_REQUEST_DIRECTION_LABEL[direction]}
    </Badge>
  );
}
