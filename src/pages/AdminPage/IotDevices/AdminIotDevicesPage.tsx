import { useMemo, useState } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Cpu,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Wifi,
  Radio,
  CircuitBoard,
} from "lucide-react";
import {
  useAdminDeleteIotDevice,
  useAdminListIotDevices,
} from "@/queries/useIotDevice";
import type {
  DeviceStatusType,
  IotDeviceResType,
  ListIotDevicesQueryType,
} from "@/schemaValidatation/iotDevice";
import useDebounce from "@/hooks/useDebounce";
import { useNavigate } from "react-router";

const DEVICE_TYPE_LABEL: Record<string, string> = {
  board_module: "Bo mạch",
  wifi_module: "Mô-đun WiFi",
  lora_module: "Mô-đun LoRa",
};

const DEVICE_TYPE_ICON: Record<string, typeof Cpu> = {
  board_module: CircuitBoard,
  wifi_module: Wifi,
  lora_module: Radio,
};

const DEVICE_STATUS_LABEL: Record<DeviceStatusType, string> = {
  active: "Hoạt động",
  inactive: "Tắt",
  maintenance: "Bảo trì",
  retired: "Ngưng hoạt động",
};

export default function AdminIotDevicesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<ListIotDevicesQueryType>({
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DeviceStatusType | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<IotDeviceResType | null>(
    null,
  );

  const debouncedSearch = useDebounce(search, 500);

  const effectiveQuery = useMemo(
    () => ({
      ...query,
      search: debouncedSearch || undefined,
      status: status !== "all" ? status : undefined,
    }),
    [query, debouncedSearch, status],
  );

  const listQuery = useAdminListIotDevices(effectiveQuery);

  const deleteMutation = useAdminDeleteIotDevice();

  const devices = listQuery.data?.data?.data ?? [];
  const meta = listQuery.data?.data?.meta;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2">Cổng quản trị</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Quản lý cấp phát thiết bị IoT
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Quản trị viên là vai trò duy nhất có quyền tạo, cập nhật, xóa và
              cấu hình vòng đời thiết bị IoT.
            </p>
          </div>
          <Button
            onClick={() => navigate("/dashboard/admin/iot-devices/create")}
          >
            <Plus className="mr-2 h-4 w-4" />
            Tạo lô thiết bị
          </Button>
        </div>
      </section>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-primary" />
            Danh sách bo mạch
          </CardTitle>
          <CardDescription>
            Dữ liệu lấy từ API cấp phát dành cho quản trị viên.
          </CardDescription>

          <div className="mt-2 grid gap-2 md:grid-cols-[1fr_200px_140px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setQuery((prev) => ({ ...prev, page: 1 }));
                }}
                placeholder="Tìm theo tên bo mạch"
                className="pl-9"
              />
            </div>
            <Select
              value={status}
              onValueChange={(value) => {
                setStatus(value as DeviceStatusType | "all");
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
              value={String(query.limit)}
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
                <SelectItem value="10">10 / trang</SelectItem>
                <SelectItem value="20">20 / trang</SelectItem>
                <SelectItem value="50">50 / trang</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 pt-5">
          {listQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : devices.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Không có dữ liệu thiết bị.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {devices.map((device) => {
                const Icon = DEVICE_TYPE_ICON[device.deviceType] ?? Cpu;
                return (
                  <div
                    key={device.id}
                    className="rounded-xl border border-border/70 bg-background p-4"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-primary" />
                          <p className="font-medium">{device.deviceName}</p>
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="outline">
                            {DEVICE_TYPE_LABEL[device.deviceType] ??
                              device.deviceType}
                          </Badge>
                          <Badge variant="secondary">
                            {DEVICE_STATUS_LABEL[device.status] ??
                              device.status}
                          </Badge>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground font-mono">
                          {device.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            navigate(`/dashboard/admin/iot-devices/${device.id}`)
                          }
                        >
                          Chi tiết
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            navigate(
                              `/dashboard/admin/iot-devices/${device.id}/edit`,
                            )
                          }
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          onClick={() => setDeleteTarget(device)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa thiết bị IoT?"
        description={`Bạn có chắc muốn xóa thiết bị ${deleteTarget?.deviceName ?? ""} khỏi hệ thống cấp phát?`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
          }
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
