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
  SENSOR_TYPE_LABEL_VI,
  type IotDeviceKitResType,
} from "@/schemaValidatation/iotKit";
import { Cpu, PackageX, Ruler, Sprout } from "lucide-react";

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
  const perUnitM2 = kit.coverageSqm ?? 4;
  const coverageM2 = perUnitM2 * kit.deviceCount;

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
            <CardDescription>Phủ ~{coverageM2} m²</CardDescription>
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
          / {kit.deviceCount} bộ thiết bị
        </p>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Cpu className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            Trọn bộ {kit.deviceCount} thiết bị, dùng được ngay
          </li>
          <li className="flex items-center gap-2">
            <Ruler className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            Mỗi bộ theo dõi được khoảng {perUnitM2} m² vườn
          </li>
          <li className="flex items-start gap-2">
            <Sprout
              className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
              aria-hidden
            />
            <span>
              Đo {sensors.length} chỉ số cây trồng:{" "}
              <span className="font-medium text-foreground">
                {sensors
                  .map((s) => SENSOR_TYPE_LABEL_VI[s] ?? s)
                  .join(", ")}
              </span>
            </span>
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
