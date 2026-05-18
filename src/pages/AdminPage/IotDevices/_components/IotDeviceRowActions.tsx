import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Eye,
  GitBranch,
  MoreHorizontal,
  PencilLine,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";

interface Props {
  device: IotDeviceResType;
  onDelete: (device: IotDeviceResType) => void;
}

export function IotDeviceRowActions({ device, onDelete }: Props) {
  const navigate = useNavigate();
  const triggerLabel = `Tùy chọn cho ${device.label ?? device.deviceName}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={triggerLabel}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            navigate(`/dashboard/admin/iot-devices/${device.id}/decision`)
          }
        >
          <GitBranch className="mr-2 h-4 w-4" />
          Trang quyết định
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate(`/dashboard/admin/iot-devices/${device.id}`)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Xem chi tiết
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() =>
            navigate(`/dashboard/admin/iot-devices/${device.id}/edit`)
          }
        >
          <PencilLine className="mr-2 h-4 w-4" />
          Chỉnh sửa
        </DropdownMenuItem>
        {device.owner ? (
          <DropdownMenuItem
            onClick={() =>
              device.owner?.id &&
              navigate(`/dashboard/admin/owners/${device.owner.id}/iot`)
            }
          >
            <UserIcon className="mr-2 h-4 w-4" />
            Hồ sơ chủ trang trại 360°
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => onDelete(device)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Xóa thiết bị
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
