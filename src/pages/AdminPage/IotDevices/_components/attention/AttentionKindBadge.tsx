import { AlertTriangle, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AttentionKindType } from "@/schemaValidatation/iotDeviceAdminOps";

export function AttentionKindBadge({ kind }: { kind: AttentionKindType }) {
  if (kind === "error") {
    return (
      <Badge variant="destructive" className="gap-1">
        <AlertTriangle className="h-3 w-3" aria-hidden="true" />
        Đang lỗi
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1">
      <Truck className="h-3 w-3" aria-hidden="true" />
      Chờ về kho
    </Badge>
  );
}
