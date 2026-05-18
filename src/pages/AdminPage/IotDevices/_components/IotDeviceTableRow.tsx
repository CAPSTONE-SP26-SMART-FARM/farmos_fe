import { Cpu } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import {
  DEVICE_TYPE_ICON,
  DEVICE_TYPE_LABEL,
} from "@/constants/iotDeviceDisplay";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import { IotDeviceStatusBadge } from "./IotDeviceStatusBadge";
import { IotDeviceRowActions } from "./IotDeviceRowActions";

interface Props {
  device: IotDeviceResType;
  onDelete: (device: IotDeviceResType) => void;
  onView?: (device: IotDeviceResType) => void;
  onEdit?: (device: IotDeviceResType) => void;
}

export function IotDeviceTableRow({
  device,
  onDelete,
  onView,
  onEdit,
}: Props) {
  const Icon = DEVICE_TYPE_ICON[device.deviceType] ?? Cpu;

  return (
    <TableRow
      className={onView ? "cursor-pointer hover:bg-muted/40" : undefined}
      onClick={onView ? () => onView(device) : undefined}
    >
      <TableCell className="w-30">
        {device.label ? (
          <span className="inline-flex items-center rounded-md border-2 border-primary bg-primary px-2 py-0.5 font-mono text-sm font-extrabold tracking-wider text-primary-foreground shadow-sm">
            {device.label}
          </span>
        ) : (
          <span
            className="text-xs text-muted-foreground/60"
            aria-label="Chưa có nhãn"
          >
            —
          </span>
        )}
      </TableCell>

      <TableCell className="min-w-55">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon
              className="h-4 w-4 text-primary"
              aria-hidden
            />
          </div>
          <p className="truncate text-sm font-medium">{device.deviceName}</p>
        </div>
      </TableCell>

      <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
        {DEVICE_TYPE_LABEL[device.deviceType] ?? device.deviceType}
      </TableCell>

      <TableCell>
        <IotDeviceStatusBadge status={device.status} />
      </TableCell>

      <TableCell className="hidden md:table-cell">
        {device.owner ? (
          <div className="min-w-0">
            <p className="truncate text-xs font-medium">{device.owner.name}</p>
            {device.farm && (
              <p className="truncate text-[10px] text-muted-foreground">
                {device.farm.name}
              </p>
            )}
          </div>
        ) : (
          <span
            className="text-xs text-muted-foreground/60"
            aria-label="Chưa có chủ sở hữu"
          >
            —
          </span>
        )}
      </TableCell>

      <TableCell
        className="w-14 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        <IotDeviceRowActions
          device={device}
          onDelete={onDelete}
          onView={onView}
          onEdit={onEdit}
        />
      </TableCell>
    </TableRow>
  );
}
