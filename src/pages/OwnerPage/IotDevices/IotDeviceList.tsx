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
import { Activity, AlertCircle, Cpu, Loader2, Search } from "lucide-react";
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
import {
  DEVICE_STATUS_LABEL_USER,
  DEVICE_TYPE_ICON,
  DEVICE_TYPE_LABEL,
  STATUS_META,
} from "@/constants/iotDeviceDisplay";
import {
  boardPrimaryLabel,
  boardSecondaryName,
} from "@/lib/milestone-iot-display";
import { useAuthStore } from "@/stores/authStore";
import { RoleName } from "@/constants/role";

type IotActor = "owner" | "manager";

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
  const isFetching =
    actor === "owner" ? ownerListQuery.isFetching : managerListQuery.isFetching;
  const isError =
    actor === "owner" ? ownerListQuery.isError : managerListQuery.isError;

  const devices = data?.data?.data ?? [];
  const meta = data?.data?.meta;

  return (
    <Card className="overflow-hidden border-border/70">
      <CardHeader className="bg-muted/30">
        {/*
          CardHeader chỉ chứa identity (badge + title + description).
          Filter bar được tách xuống div border-t bên dưới — cùng nằm trong Card
          nhưng tách biệt về mặt visual để rõ ràng: header = "đây là gì",
          filter = "tôi muốn xem gì". Pattern này nhất quán với AdminIotDevicesPage
          (filter bar nằm ngoài Card) nhưng phù hợp hơn ở đây vì IotDeviceList
          là component nhúng (không có page-level space phía trên).
        */}
        <div>
          <Badge className="mb-2">
            {actor === "owner" ? "Cổng chủ trang trại" : "Cổng quản lý"}
          </Badge>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Iot kit đã gán {farmName ? `- ${farmName}` : ""}
            {isFetching && !isLoading && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </CardTitle>
          <CardDescription className="mt-1">
            Danh sách bo mạch được cấp quyền truy cập từ hệ thống gán Iot kit.
          </CardDescription>
        </div>
      </CardHeader>

      {/* Filter bar — border-t tách biệt với header, trong cùng Card */}
      <div className="border-t px-6 py-3">
        <div className="grid gap-2 md:grid-cols-[1fr_160px_140px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc mã thiết bị (K###)"
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
              <SelectItem value="purchase">Khả dụng</SelectItem>
              <SelectItem value="install">Đang cài đặt</SelectItem>
              <SelectItem value="active">Hoạt động</SelectItem>
              <SelectItem value="error">Lỗi</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={String(query.limit ?? defaultLimit)}
            onValueChange={(value) =>
              setQuery((prev) => ({ ...prev, page: 1, limit: Number(value) }))
            }
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
      </div>

      <CardContent className="space-y-4 pt-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-destructive">
            <AlertCircle className="h-6 w-6" />
            <p className="text-sm">Không thể tải danh sách thiết bị. Thử lại sau.</p>
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

        <div className="flex items-center justify-between pt-2 text-xs text-muted-foreground">
          {meta ? (
            <span className="flex items-center gap-1.5">
              <Activity className="h-3 w-3" />
              {meta.totalPages > 1
                ? `Trang ${meta.page} / ${meta.totalPages} · `
                : ""}
              {meta.totalItems} thiết bị
            </span>
          ) : (
            <span />
          )}
          {meta && meta.totalPages > 1 && (
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
          )}
        </div>
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
  const sMeta = STATUS_META[device.status] ?? STATUS_META.available;
  const SIcon = sMeta.icon;
  const DIcon = DEVICE_TYPE_ICON[device.deviceType] ?? Cpu;
  const isAdmin = useAuthStore((s) => s.user?.role === RoleName.Admin);

  return (
    <button
      type="button"
      onClick={onDetail}
      className="group w-full rounded-xl border border-border/70 bg-background p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <DIcon className="h-4 w-4 shrink-0 text-primary" />
            <p className="truncate font-medium leading-tight">
              {boardPrimaryLabel(device)}
            </p>
          </div>
          {boardSecondaryName(device) && (
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {boardSecondaryName(device)}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap gap-1">
            <Badge variant="outline" className="text-[10px]">
              {DEVICE_TYPE_LABEL[device.deviceType] ?? device.deviceType}
            </Badge>
            <span
              className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${sMeta.badgeClass}`}
            >
              <SIcon className="h-2.5 w-2.5" />
              {DEVICE_STATUS_LABEL_USER[device.status] ?? device.status}
            </span>
          </div>
        </div>
        <span className="shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors group-hover:bg-muted">
          Xem chi tiết
        </span>
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

      {isAdmin && device.latestLog && (
        <p className="mt-2 text-[10px] text-muted-foreground">
          Log mới nhất:{" "}
          {new Date(device.latestLog.createdAt).toLocaleDateString("vi-VN")}
        </p>
      )}
    </button>
  );
}
