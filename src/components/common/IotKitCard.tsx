import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrencyVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  KIT_MODULE_LABEL_VI,
  SENSOR_TYPE_LABEL_VI,
  type IotDeviceKitResType,
} from "@/schemaValidatation/iotKit";
import { Boxes, Cpu, PackageX, Sprout } from "lucide-react";

interface IotKitCardProps {
  kit: IotDeviceKitResType;
  onSelect: () => void;
  onPurchase?: () => void;
  highlighted?: boolean;
  disabled?: boolean;
  disabledReason?: string;
}

export default function IotKitCard({
  kit,
  onSelect,
  onPurchase,
  highlighted,
  disabled,
  disabledReason,
}: IotKitCardProps) {
  const sensors = kit.includedSensors ?? [];
  const modules = kit.includedModules ?? [];
  const coverageM2 = kit.deviceCount * 4;

  return (
    <Card
      className={cn(
        "border-2 transition-all hover:-translate-y-1 hover:shadow-md",
        highlighted && "ring-2 ring-primary",
      )}
    >
      <CardHeader className="bg-muted/30">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-lg">{kit.name}</CardTitle>
            <CardDescription>
              Mã: {kit.code} · Phủ ~{coverageM2} m²
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            {highlighted && <Badge>Khuyến nghị</Badge>}
            {!kit.inStock && (
              <Badge variant="destructive" className="gap-1">
                <PackageX className="h-3 w-3" />
                Hết hàng
              </Badge>
            )}
          </div>
        </div>
        <p className="mt-3 text-2xl font-bold">{formatCurrencyVnd(kit.price)}</p>
        <p className="text-xs text-muted-foreground">
          / {kit.deviceCount} bộ board chính
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">
          {kit.description ??
            "Bộ Kit IoT gồm board chính, module truyền dẫn và 4 cảm biến tiêu chuẩn."}
        </p>
        <ul className="space-y-1.5 text-sm">
          <li className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-muted-foreground" aria-hidden />
            {kit.deviceCount} bộ board chính
          </li>
          <li className="flex items-center gap-2">
            <Boxes className="h-4 w-4 text-muted-foreground" aria-hidden />
            {modules.length} loại module truyền dẫn
            {modules.length > 0 && (
              <span className="text-muted-foreground">
                (
                {modules
                  .map((m) => KIT_MODULE_LABEL_VI[m] ?? m)
                  .join(", ")}
                )
              </span>
            )}
          </li>
          <li className="flex items-center gap-2">
            <Sprout className="h-4 w-4 text-muted-foreground" aria-hidden />
            {sensors.length} loại cảm biến
            {sensors.length > 0 && (
              <span className="text-muted-foreground">
                (
                {sensors
                  .map((s) => SENSOR_TYPE_LABEL_VI[s] ?? s)
                  .join(", ")}
                )
              </span>
            )}
          </li>
        </ul>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onSelect}>
          Chi tiết
        </Button>
        <Button
          className="flex-1"
          onClick={onPurchase ?? onSelect}
          disabled={disabled || !kit.inStock}
          title={!kit.inStock ? "Kho thiết bị tạm hết, không thể mua ngay" : disabled ? disabledReason : undefined}
        >
          Mua ngay
        </Button>
      </CardFooter>
    </Card>
  );
}
