import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import LoadingCard from "@/components/common/LoadingCard";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useDebounce from "@/hooks/useDebounce";
import { getApiErrorMessageVi } from "@/lib/error-message";
import { cn } from "@/lib/utils";
import {
  useAdminAssignIotOwner,
  useAdminListIotDevices,
  useAdminUnassignIotOwner,
} from "@/queries/useIotDevice";
import { useAdminOwnersWithAvailableKits } from "@/queries/useIotKit";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import {
  BOARD_TYPE_LABEL_VI,
  KIT_MODULE_LABEL_VI,
  SENSOR_TYPE_LABEL_VI,
  type AvailableSlotItemType,
  type IotKitAssignedStatus,
  type OwnerWithAvailableKitsType,
} from "@/schemaValidatation/iotKit";
import {
  ArrowLeft,
  Cpu,
  Loader2,
  PackagePlus,
  Search,
  UserMinus,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";

const STATUS_ASSIGNED_LABEL: Record<IotKitAssignedStatus, string> = {
  UNASSIGNED: "Chưa gán",
  ASSIGNED: "Đã gán",
  RETURNED: "Đã trả",
};

function getInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatDateVi(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("vi-VN");
}

function StatusAssignedBadge({
  status,
}: {
  status: IotKitAssignedStatus | null;
}) {
  if (!status || status === "UNASSIGNED") {
    return <Badge variant="secondary">Chưa gán</Badge>;
  }
  if (status === "ASSIGNED") {
    return <Badge className="bg-emerald-600 hover:bg-emerald-600">Đã gán</Badge>;
  }
  return <Badge variant="outline">{STATUS_ASSIGNED_LABEL[status]}</Badge>;
}

export default function AdminKitAssignmentDetailPage() {
  const navigate = useNavigate();
  const { ownerId = "" } = useParams<{ ownerId: string }>();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(
    new Set(),
  );
  const [isAssigning, setIsAssigning] = useState(false);
  const [unassignTarget, setUnassignTarget] = useState<IotDeviceResType | null>(
    null,
  );
  const [orderDetail, setOrderDetail] = useState<AvailableSlotItemType | null>(
    null,
  );

  const ownersQuery = useAdminOwnersWithAvailableKits(
    { page: 1, limit: 100 },
    Boolean(ownerId),
  );

  const ownerRow: OwnerWithAvailableKitsType | undefined = useMemo(
    () => ownersQuery.data?.data?.data.find((r) => r.owner.id === ownerId),
    [ownersQuery.data?.data?.data, ownerId],
  );

  const devicesQuery = useAdminListIotDevices(
    { page: 1, limit: 100 },
    Boolean(ownerId),
  );

  const { assignedDevices, availableDevices } = useMemo(() => {
    const all = devicesQuery.data?.data?.data ?? [];
    const boards = all.filter((d) => d.deviceType === "board_module");
    const assigned = boards.filter((d) => d.owner?.id === ownerId);
    const free = boards.filter((d) => !d.owner);
    const needle = debouncedSearch.trim().toLowerCase();
    if (!needle) return { assignedDevices: assigned, availableDevices: free };
    const filtered = free.filter((d) => {
      const hay = (d.deviceName ?? "").toLowerCase();
      return hay.includes(needle);
    });
    return { assignedDevices: assigned, availableDevices: filtered };
  }, [devicesQuery.data?.data?.data, debouncedSearch, ownerId]);

  const { mutateAsync: assignOwner } = useAdminAssignIotOwner();
  const { mutateAsync: unassignOwner } = useAdminUnassignIotOwner();

  if (ownersQuery.isLoading) {
    return (
      <div className="space-y-4">
        <LoadingCard rows={4} />
      </div>
    );
  }

  if (ownersQuery.isError) {
    return (
      <ErrorState
        message={getApiErrorMessageVi(
          ownersQuery.error,
          "Không thể tải dữ liệu chủ vườn.",
        )}
        onRetry={() => ownersQuery.refetch()}
      />
    );
  }

  if (!ownerRow) {
    return (
      <div className="space-y-4 animate-in fade-in duration-300">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/dashboard/admin/iot-kits/assignments")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách
        </Button>
        <EmptyState
          icon={PackagePlus}
          title="Chủ vườn không còn đủ điều kiện"
          description="Có thể đã hết slot hoặc đạt hạn mức gói. Vui lòng kiểm tra lại."
        />
      </div>
    );
  }

  const { owner, quota, orders } = ownerRow;
  const selectedCount = selectedDeviceIds.size;
  const wouldExceed = selectedCount > quota.remaining;

  const toggleDevice = (id: string) => {
    setSelectedDeviceIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllVisible = () => {
    setSelectedDeviceIds((prev) => {
      const next = new Set(prev);
      const visibleIds = availableDevices.map((d) => d.id);
      const allSelected = visibleIds.every((id) => next.has(id));
      if (allSelected) {
        for (const id of visibleIds) next.delete(id);
      } else {
        for (const id of visibleIds) next.add(id);
      }
      return next;
    });
  };

  const allVisibleSelected =
    availableDevices.length > 0 &&
    availableDevices.every((d) => selectedDeviceIds.has(d.id));

  const handleBulkAssign = async () => {
    if (selectedCount === 0 || wouldExceed) return;
    setIsAssigning(true);
    const ids = Array.from(selectedDeviceIds);
    let success = 0;
    let failed = 0;
    for (const deviceId of ids) {
      try {
        await assignOwner({ iotDeviceId: deviceId, ownerId: owner.id });
        success += 1;
      } catch {
        failed += 1;
      }
    }
    setIsAssigning(false);
    setSelectedDeviceIds(new Set());
    if (success > 0) {
      toast.success(`Đã gán ${success}/${ids.length} thiết bị cho chủ vườn`);
    }
    if (failed > 0) {
      toast.error(`${failed} thiết bị không gán được — kiểm tra lại quota.`);
    }
    ownersQuery.refetch();
    devicesQuery.refetch();
  };

  const handleUnassign = async () => {
    if (!unassignTarget) return;
    try {
      await unassignOwner({ iotDeviceId: unassignTarget.id });
      toast.success(`Đã thu hồi thiết bị "${unassignTarget.deviceName}"`);
      ownersQuery.refetch();
      devicesQuery.refetch();
    } catch (err) {
      toast.error(getApiErrorMessageVi(err, "Thu hồi thiết bị thất bại."));
    } finally {
      setUnassignTarget(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate("/dashboard/admin/iot-kits/assignments")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách
      </Button>

      {/* Owner header + combined quota */}
      <Card>
        <CardHeader className="gap-2 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <Avatar className="h-14 w-14">
              {owner.avatarUrl ? <AvatarImage src={owner.avatarUrl} /> : null}
              <AvatarFallback>{getInitials(owner.fullName)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle>{owner.fullName || owner.email}</CardTitle>
              <CardDescription>
                {owner.email}
                {owner.phone ? ` · ${owner.phone}` : ""}
              </CardDescription>
              <p className="mt-1 text-xs text-muted-foreground break-all">
                ID: {owner.id}
              </p>
            </div>
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="grid gap-3 pt-4 md:grid-cols-5">
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Hạn mức gói
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {quota.subscriptionMax}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              IoT kit mua thêm
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-emerald-600">
              +{quota.kitBonus}
            </p>
          </div>
          <div className="rounded-lg border bg-primary/5 p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Tổng được cấp
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {quota.effectiveLimit}
            </p>
            <p className="text-xs text-muted-foreground">gói + kit</p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Đang dùng
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums">
              {quota.used}
            </p>
          </div>
          <div className="rounded-lg border p-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              IoT kit chưa sử dụng
            </p>
            <p
              className={cn(
                "mt-1 text-2xl font-semibold tabular-nums",
                quota.remaining <= 0 ? "text-red-600" : "text-primary",
              )}
            >
              {quota.remaining}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Kit orders table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bộ kit đã mua</CardTitle>
          <CardDescription>
            Click vào dòng để xem chi tiết đơn kit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Đơn</TableHead>
                  <TableHead>Tên kit</TableHead>
                  <TableHead>Loại bo</TableHead>
                  <TableHead>Slot dùng</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Ngày mua</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Chưa có đơn kit nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const pct =
                      order.totalSlots > 0
                        ? Math.min(
                            100,
                            (order.usedSlots / order.totalSlots) * 100,
                          )
                        : 0;
                    const full = pct >= 100;
                    const near = pct >= 80 && !full;
                    return (
                      <TableRow
                        key={order.orderId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setOrderDetail(order)}
                      >
                        <TableCell className="font-medium">
                          #{order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <span>{order.kitName}</span>
                          <span className="ml-1 text-xs text-muted-foreground">
                            · {order.kitCode}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {BOARD_TYPE_LABEL_VI[order.boardType]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="text-sm tabular-nums">
                              <span
                                className={cn(
                                  "font-semibold",
                                  full && "text-red-600",
                                  near && "text-amber-600",
                                )}
                              >
                                {order.usedSlots}
                              </span>
                              <span className="text-muted-foreground">
                                {" "}
                                / {order.totalSlots}
                              </span>
                            </span>
                            <Progress
                              value={pct}
                              className={cn(
                                "h-1.5 w-24",
                                full && "[&>div]:bg-red-500",
                                near && "[&>div]:bg-amber-500",
                              )}
                            />
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusAssignedBadge status={order.statusAssigned} />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDateVi(order.createdAt)}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assigned devices — unassign */}
      <Card>
        <CardHeader>
          <CardTitle>Thiết bị đã cấp phát</CardTitle>
          <CardDescription>
            Các bo mạch đang được gán cho chủ vườn này. Thu hồi để giải phóng
            slot quota.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên thiết bị</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {devicesQuery.isLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : assignedDevices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Chưa có thiết bị nào được cấp phát.
                    </TableCell>
                  </TableRow>
                ) : (
                  assignedDevices.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{d.deviceName}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{d.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:hover:bg-rose-950"
                          onClick={() => setUnassignTarget(d)}
                        >
                          <UserMinus className="mr-1.5 h-3.5 w-3.5" />
                          Thu hồi
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Available devices — bulk assign */}
      <Card>
        <CardHeader className="gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>Cấp phát thiết bị</CardTitle>
            <CardDescription>
              Chọn các bo mạch còn trống để cấp cho chủ vườn. Mỗi thiết bị tiêu
              1 slot quota.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full md:w-64">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên / MAC"
                className="pl-9"
              />
            </div>
            <Button
              onClick={handleBulkAssign}
              disabled={selectedCount === 0 || wouldExceed || isAssigning}
            >
              {isAssigning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang gán...
                </>
              ) : (
                <>
                  <PackagePlus className="mr-2 h-4 w-4" />
                  Gán {selectedCount > 0 ? `${selectedCount} ` : ""}thiết bị
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {wouldExceed && (
            <p className="rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              Đã chọn {selectedCount} thiết bị nhưng quota chỉ còn{" "}
              {quota.remaining}. Hãy bỏ bớt {selectedCount - quota.remaining}{" "}
              thiết bị.
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allVisibleSelected}
                      onCheckedChange={toggleAllVisible}
                      aria-label="Chọn tất cả"
                    />
                  </TableHead>
                  <TableHead>Tên thiết bị</TableHead>
                  <TableHead>MAC</TableHead>
                  <TableHead>Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {devicesQuery.isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={4}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : availableDevices.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-sm text-muted-foreground"
                    >
                      Không có bo mạch nào còn trống.
                    </TableCell>
                  </TableRow>
                ) : (
                  availableDevices.map((d) => {
                    const checked = selectedDeviceIds.has(d.id);
                    return (
                      <TableRow
                        key={d.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          checked && "bg-primary/5",
                        )}
                        onClick={() => toggleDevice(d.id)}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleDevice(d.id)}
                            aria-label={`Chọn ${d.deviceName}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Cpu className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{d.deviceName}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{d.status}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {selectedCount > 0 && (
            <p className="text-sm text-muted-foreground">
              Đã chọn {selectedCount} / quota còn {quota.remaining}
            </p>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!unassignTarget}
        title="Thu hồi thiết bị?"
        description={`Thu hồi "${unassignTarget?.deviceName ?? ""}" khỏi chủ vườn này. Slot quota sẽ được giải phóng.`}
        confirmLabel="Thu hồi"
        cancelLabel="Hủy"
        variant="destructive"
        onCancel={() => setUnassignTarget(null)}
        onConfirm={handleUnassign}
      />

      {/* Order detail dialog */}
      <Dialog
        open={!!orderDetail}
        onOpenChange={(open) => { if (!open) setOrderDetail(null); }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Chi tiết đơn #{orderDetail?.orderNumber}
            </DialogTitle>
          </DialogHeader>
          {orderDetail && (
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Tên kit
                  </p>
                  <p className="font-medium">{orderDetail.kitName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Mã kit
                  </p>
                  <p className="font-mono">{orderDetail.kitCode}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Ngày mua
                  </p>
                  <p>{formatDateVi(orderDetail.createdAt)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Trạng thái
                  </p>
                  <StatusAssignedBadge status={orderDetail.statusAssigned} />
                </div>
              </div>

              <Separator />

              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Loại bo mạch
                </p>
                <Badge variant="outline">
                  {BOARD_TYPE_LABEL_VI[orderDetail.boardType]}
                </Badge>
              </div>

              {orderDetail.includedSensors &&
                orderDetail.includedSensors.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Cảm biến đi kèm
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {orderDetail.includedSensors.map((s) => (
                        <Badge key={s} variant="secondary">
                          {SENSOR_TYPE_LABEL_VI[s]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {orderDetail.includedModules &&
                orderDetail.includedModules.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Module đi kèm
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {orderDetail.includedModules.map((m) => (
                        <Badge key={m} variant="secondary">
                          {KIT_MODULE_LABEL_VI[m]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Slot sử dụng
                  </p>
                  <span className="tabular-nums">
                    <span className="font-semibold">{orderDetail.usedSlots}</span>
                    <span className="text-muted-foreground">
                      {" "}/ {orderDetail.totalSlots}
                    </span>
                  </span>
                </div>
                <Progress
                  value={
                    orderDetail.totalSlots > 0
                      ? Math.min(
                          100,
                          (orderDetail.usedSlots / orderDetail.totalSlots) * 100,
                        )
                      : 0
                  }
                  className={cn(
                    "h-2",
                    orderDetail.usedSlots >= orderDetail.totalSlots &&
                      "[&>div]:bg-red-500",
                    orderDetail.usedSlots / orderDetail.totalSlots >= 0.8 &&
                      orderDetail.usedSlots < orderDetail.totalSlots &&
                      "[&>div]:bg-amber-500",
                  )}
                />
                <p className="text-xs text-muted-foreground">
                  Chưa sử dụng:{" "}
                  <span className="font-medium text-foreground">
                    {orderDetail.remainingSlots}
                  </span>{" "}
                  slot
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
