import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  AlertCircle,
  Cpu,
  Eye,
  Info,
  Loader2,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import IotDeviceDetail from "@/pages/OwnerPage/IotDevices/IotDeviceDetail";
import IotDeviceForm from "@/pages/OwnerPage/IotDevices/IotDeviceForm";
import {
  useAdminDeleteIotDevice,
  useAdminIotDeviceDetail,
  useAdminListIotDevices,
} from "@/queries/useIotDevice";
import type {
  DeviceStatusType,
  IotDeviceResType,
  ListIotDevicesQueryType,
} from "@/schemaValidatation/iotDevice";
import {
  DEVICE_STATUS_LABEL_ADMIN,
  DEVICE_TYPE_ICON,
  DEVICE_TYPE_LABEL,
  STATUS_META,
} from "@/constants/iotDeviceDisplay";
import useDebounce from "@/hooks/useDebounce";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export default function AdminIotDevicesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<ListIotDevicesQueryType>({
    page: 1,
    limit: 10,
  });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<DeviceStatusType | "all">("all");
  const [deleteTarget, setDeleteTarget] = useState<IotDeviceResType | null>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>(
    undefined,
  );
  const [dialogMode, setDialogMode] = useState<"view" | "edit">("view");
  const detailQuery = useAdminIotDeviceDetail(
    selectedDeviceId ?? "",
    Boolean(selectedDeviceId) && dialogMode === "edit",
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
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* ── Page header ────────────────────────────────────────────────────── */}
      {/*
        Lý do tách header thành section riêng (không gộp vào Card danh sách):
          Header = identity của trang (badge role, tiêu đề, mô tả, nút CTA).
          Card danh sách = data container. Tách 2 khối giúp admin nhìn
          ngay "đang ở đâu" và "action chính là gì" mà không cần scan qua list.
      */}
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2">Cổng quản trị</Badge>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Quản lý các bộ kit IoT
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
              Tạo, cập nhật, xóa và cấu hình vòng đời thiết bị IoT.
            </p>
          </div>
          <Button onClick={() => navigate("/dashboard/admin/iot-devices/create")}>
            <Plus className="mr-2 h-4 w-4" />
            Tạo bộ kit mới
          </Button>
        </div>
      </section>

      <Card className="overflow-hidden border-border/70">
        <CardHeader className="bg-muted/30">
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-primary" />
              Danh sách thiết bị
              {listQuery.isFetching && !listQuery.isLoading && (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
              )}
            </CardTitle>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                Dữ liệu lấy từ API gán Iot kit dành cho quản trị viên.
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>

        <CardContent className="pt-5 space-y-4">
          <div className="grid gap-3 md:grid-cols-[1fr_200px_140px]">
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Tìm kiếm</p>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setQuery((prev) => ({ ...prev, page: 1 }));
                  }}
                  placeholder="Tìm theo tên thiết bị"
                  className="pl-9"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Trạng thái</p>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value as DeviceStatusType | "all");
                  setQuery((prev) => ({ ...prev, page: 1 }));
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  {(Object.keys(DEVICE_STATUS_LABEL_ADMIN) as DeviceStatusType[]).map((s) => (
                    <SelectItem key={s} value={s}>
                      {DEVICE_STATUS_LABEL_ADMIN[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Số mục</p>
              <Select
                value={String(query.limit)}
                onValueChange={(value) =>
                  setQuery((prev) => ({ ...prev, page: 1, limit: Number(value) }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Số mục" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / trang</SelectItem>
                  <SelectItem value="20">20 / trang</SelectItem>
                  <SelectItem value="50">50 / trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {listQuery.isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : listQuery.isError ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-destructive">
              <AlertCircle className="h-6 w-6" />
              <p className="text-sm">Không thể tải danh sách thiết bị. Thử lại sau.</p>
            </div>
          ) : devices.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              Không có dữ liệu thiết bị.
            </p>
          ) : (
            /*
              Lý do dùng horizontal row thay vì card grid 2-col stacked:
                Admin quản lý nhiều thiết bị — cần scan nhanh theo tên/trạng thái.
                Row ngang = tên + loại + status + owner đều visible trên 1 dòng,
                không cần scroll ngang. So với card stacked (tên ở trên, badges
                ở giữa, buttons ở dưới) thì eye-travel giảm từ 3 chiều xuống 1.
                DropdownMenu thay icon buttons inline = gọn hơn, đúng pattern
                09-dialog-pattern.md của dự án (row actions dùng MoreHorizontal).
            */
            <div className="space-y-2">
              {devices.map((device) => {
                const Icon = DEVICE_TYPE_ICON[device.deviceType] ?? Cpu;
                const sMeta = STATUS_META[device.status];
                const SIcon = sMeta?.icon;
                return (
                  <div
                    key={device.id}
                    className="flex items-center gap-3 rounded-xl border border-border/70 bg-background p-3.5 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedDeviceId(device.id)}
                  >
                    {/* Icon avatar — visual anchor theo loại thiết bị */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>

                    {/* Identity: tên + loại + trạng thái */}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{device.deviceName}</p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">
                          {DEVICE_TYPE_LABEL[device.deviceType] ?? device.deviceType}
                        </span>
                        {sMeta && SIcon && (
                          <>
                            <span className="text-muted-foreground/50">·</span>
                            <span
                              className={`inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${sMeta.badgeClass}`}
                            >
                              <SIcon className="h-2.5 w-2.5" />
                              {sMeta.labelAdmin}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/*
                      Owner info hiện trên md+ — thông tin phân bổ quan trọng
                      với admin nhưng ẩn trên mobile để không làm hàng quá chật.
                    */}
                    <div className="hidden w-37.5 shrink-0 md:block">
                      {device.owner ? (
                        <>
                          <p className="truncate text-xs font-medium">{device.owner.name}</p>
                          {device.farm && (
                            <p className="truncate text-[10px] text-muted-foreground">
                              {device.farm.name}
                            </p>
                          )}
                        </>
                      ) : (
                        <span className="rounded-md border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                          Chưa gán
                        </span>
                      )}
                    </div>

                    {/*
                      DropdownMenu thay vì 3 button inline — theo 09-dialog-pattern:
                      "Mọi table row actions dùng DropdownMenu từ shadcn".
                      Lý do: 3 button làm hàng bị nặng; dropdown gom gọn, dễ extend
                      thêm action mới (log, clone...) mà không thay đổi layout.
                      Separator trước Xóa = phân biệt destructive action rõ ràng.
                    */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0"
                          aria-label={`Tùy chọn cho ${device.deviceName}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDeviceId(device.id);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Xem chi tiết
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDeviceId(device.id);
                            setDialogMode("edit");
                          }}
                        >
                          <PencilLine className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(device)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa thiết bị
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            {meta ? (
              <span>
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

      <ConfirmDialog
        open={!!deleteTarget}
        title="Xóa thiết bị IoT?"
        description={`Bạn có chắc muốn xóa thiết bị "${deleteTarget?.deviceName ?? ""}" khỏi hệ thống? Hành động này không thể hoàn tác.`}
        confirmLabel="Xóa"
        cancelLabel="Hủy"
        variant="destructive"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteMutation.mutateAsync(deleteTarget.id);
            toast.success("Bộ kit đã được xoá thành công");
          }
          setDeleteTarget(null);
        }}
      />

      <Dialog
        open={!!selectedDeviceId}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDeviceId(undefined);
            setDialogMode("view");
          }
        }}
      >
        <DialogContent className="sm:max-w-[95vw] max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? "Chỉnh sửa thiết bị IoT" : "Chi tiết thiết bị IoT"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? "Cập nhật thông tin thiết bị, cảm biến và sub-devices."
                : "Xem thông tin thiết bị, lịch sử log và trạng thái gán."}
            </DialogDescription>
          </DialogHeader>
          {selectedDeviceId && dialogMode === "view" && (
            <IotDeviceDetail
              deviceId={selectedDeviceId}
              farmId=""
              actor="admin"
              onBack={() => {
                setSelectedDeviceId(undefined);
                setDialogMode("view");
              }}
              onEdit={() => setDialogMode("edit")}
            />
          )}
          {selectedDeviceId && dialogMode === "edit" && detailQuery.data?.data && (
            <IotDeviceForm
              farmId=""
              actor="admin"
              device={detailQuery.data.data}
              onBack={() => setDialogMode("view")}
              onBackRequested={() => setDialogMode("view")}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
