import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Cpu,
  Loader2,
  Search,
  Wifi,
  Radio,
  CircuitBoard,
  Activity,
  Wrench,
  Power,
  PowerOff,
  ShieldOff,
} from "lucide-react";
import { useMemo, useState } from "react";
import useDebounce from "@/hooks/useDebounce";
import {
  useManagerListIotDevices,
  useOwnerListIotDevices,
} from "@/queries/useIotDevice";
import type {
  DeviceStatusType,
  IotDeviceResType,
  ListIotDevicesQueryType,
} from "@/schemaValidatation/iotDevice";

type IotActor = "owner" | "manager";

const STATUS_META: Record<
  string,
  { label: string; className: string; icon: typeof Activity }
> = {
  active: {
    label: "Hoạt động",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300",
    icon: Power,
  },
  inactive: {
    label: "Tắt",
    className:
      "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    icon: PowerOff,
  },
  maintenance: {
    label: "Bảo trì",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
    icon: Wrench,
  },
  retired: {
    label: "Ngưng hoạt động",
    className: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
    icon: ShieldOff,
  },
};

const DEVICE_TYPE_ICON: Record<string, typeof Cpu> = {
  board_module: CircuitBoard,
  lora_module: Radio,
  wifi_module: Wifi,
};

const DEVICE_TYPE_LABEL: Record<string, string> = {
  board_module: "Bo mạch",
  lora_module: "Mô-đun LoRa",
  wifi_module: "Mô-đun WiFi",
};

interface IotDeviceListProps {
  farmId: string;
  farmName: string;
  onDetail: (device: IotDeviceResType) => void;
  actor?: IotActor;
  defaultLimit?: number;
}

export default function IotDeviceList({
  farmId,
  farmName,
  onDetail,
  actor = "owner",
  defaultLimit = 8,
}: IotDeviceListProps) {
  const [query, setQuery] = useState<ListIotDevicesQueryType>({
    page: 1,
    limit: defaultLimit,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<DeviceStatusType | "all">(
    "all",
  );

  const debouncedSearch = useDebounce(search, 500);

  const effectiveQuery = useMemo(
    () => ({
      ...query,
      search: debouncedSearch || undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
    }),
    [query, debouncedSearch, statusFilter],
  );

  const ownerListQuery = useOwnerListIotDevices(
    farmId,
    effectiveQuery,
    actor === "owner",
  );
  const managerListQuery = useManagerListIotDevices(
    farmId,
    effectiveQuery,
    actor === "manager",
  );

  const data = actor === "owner" ? ownerListQuery.data : managerListQuery.data;
  const isLoading =
    actor === "owner" ? ownerListQuery.isLoading : managerListQuery.isLoading;

  const devices = data?.data?.data ?? [];
  const meta = data?.data?.meta;
  const activeCount = devices.filter((d) => d.status === "active").length;
  const totalCount = meta?.totalItems ?? devices.length;

  return (
    <Card className="overflow-hidden border-border/70">
      <CardHeader className="bg-muted/30">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2">
              {actor === "owner" ? "Cổng chủ vườn" : "Cổng quản lý"}
            </Badge>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Thiết bị IoT cấp phát {farmName ? `- ${farmName}` : ""}
            </CardTitle>
            <CardDescription className="mt-1">
              Danh sách bo mạch được cấp quyền truy cập từ hệ thống cấp phát.
            </CardDescription>
          </div>
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-[1fr_160px_140px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên thiết bị"
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as DeviceStatusType | "all");
              setQuery((prev) => ({ ...prev, page: 1 }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="inactive">Tắt</SelectItem>
              <SelectItem value="maintenance">Bảo trì</SelectItem>
              <SelectItem value="retired">Ngưng hoạt động</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={String(query.limit ?? defaultLimit)}
            onValueChange={(value) => {
              setQuery((prev) => ({
                ...prev,
                page: 1,
                limit: Number(value),
              }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Số mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="6">6 / trang</SelectItem>
              <SelectItem value="8">8 / trang</SelectItem>
              <SelectItem value="12">12 / trang</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Tổng thiết bị
              </p>
            </div>
            <p className="mt-1 text-xl font-semibold">{totalCount}</p>
          </div>
          <div className="rounded-lg border bg-background p-3">
            <div className="flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5 text-emerald-500" />
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Đang hoạt động
              </p>
            </div>
            <p className="mt-1 text-xl font-semibold">{activeCount}</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : devices.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground">
            Không tìm thấy thiết bị phù hợp.
          </p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onDetail={() => onDetail(device)}
              />
            ))}
          </div>
        )}

        {meta && meta.totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
            <span>
              Trang {meta.page} / {meta.totalPages} ({meta.totalItems} mục)
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.hasPreviousPage}
                onClick={() =>
                  setQuery((prev) => ({
                    ...prev,
                    page: Math.max(1, prev.page - 1),
                  }))
                }
              >
                Trước
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={!meta.hasNextPage}
                onClick={() =>
                  setQuery((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Sau
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeviceCard({
  device,
  onDetail,
}: {
  device: IotDeviceResType;
  onDetail: () => void;
}) {
  const sMeta = STATUS_META[device.status] ?? STATUS_META.inactive;
  const SIcon = sMeta.icon;
  const DIcon = DEVICE_TYPE_ICON[device.deviceType] ?? Cpu;

  return (
    <div
      onClick={onDetail}
      className="group cursor-pointer rounded-xl border border-border/70 bg-background p-4 transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <DIcon className="h-4 w-4 shrink-0 text-primary" />
            <p className="truncate font-medium leading-tight">
              {device.deviceName}
            </p>
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className="text-[10px]"
            >
              {DEVICE_TYPE_LABEL[device.deviceType] ?? device.deviceType}
            </Badge>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium ${sMeta.className}`}
            >
              <SIcon className="h-2.5 w-2.5" />
              {sMeta.label}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onDetail();
          }}
        >
          Xem chi tiết
        </Button>
      </div>

      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
        {device.iotDeviceBoardId && (
          <p>
            Bo mạch:{" "}
            <span className="font-mono">
              {device.iotDeviceBoardId.slice(0, 8)}...
            </span>
          </p>
        )}
      </div>

      {device.latestLog && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Log mới nhất:{" "}
          {new Date(device.latestLog.createdAt).toLocaleDateString("vi-VN")}
        </p>
      )}
    </div>
  );
}
