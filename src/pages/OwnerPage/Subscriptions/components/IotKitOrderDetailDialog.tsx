import IotKitOrderStatusBadge from "@/components/common/IotKitOrderStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { formatCurrencyVnd, formatDateVi } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  BOARD_TYPE_LABEL_VI,
  KIT_MODULE_LABEL_VI,
  SENSOR_TYPE_LABEL_VI,
  type OwnerKitOrderTrackingType,
} from "@/schemaValidatation/iotKit";
import { Cpu, CreditCard } from "lucide-react";
import { useNavigate } from "react-router";
import { useIotKitOrderPaymentStatus } from "@/queries/useIotKit";

interface IotKitOrderDetailDialogProps {
  order: OwnerKitOrderTrackingType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEVICE_STATUS_LABEL: Record<string, string> = {
  active: "Đang hoạt động",
  inactive: "Tạm ngừng",
  maintenance: "Bảo trì",
  decommissioned: "Đã ngưng dùng",
};

function IotKitOrderDetailDialog({
  order,
  open,
  onOpenChange,
}: IotKitOrderDetailDialogProps) {
  const navigate = useNavigate();
  const isPending = order?.status === "PENDING";
  const paymentStatusQuery = useIotKitOrderPaymentStatus(
    order?.orderId ?? "",
    !!order && isPending,
  );
  const pendingInvoiceId = paymentStatusQuery.data?.data?.invoiceId ?? null;

  if (!order) {
    return (
      <Dialog
        open={open}
        onOpenChange={onOpenChange}
      >
        <DialogContent />
      </Dialog>
    );
  }

  const pct =
    order.totalSlots > 0
      ? Math.min(100, (order.usedSlots / order.totalSlots) * 100)
      : 0;
  const full = pct >= 100;
  const near = pct >= 80 && !full;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader className="pr-8">
          <DialogTitle>Đơn #{order.orderNumber}</DialogTitle>
          <DialogDescription>
            Mua ngày {formatDateVi(order.createdAt)} ·{" "}
            {formatCurrencyVnd(order.totalAmount)}
          </DialogDescription>
          <div className="pt-1">
            <IotKitOrderStatusBadge status={order.status} />
          </div>
        </DialogHeader>

        {/* ─── Kit info ─── */}
        <section className="space-y-2 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <p className="text-sm font-medium">{order.kit.name}</p>
            <span className="text-xs text-muted-foreground">
              · {order.kit.code}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="outline">
              {BOARD_TYPE_LABEL_VI[order.kit.boardType] ?? order.kit.boardType}
            </Badge>
            {order.kit.includedSensors?.map((s) => (
              <Badge
                key={s}
                variant="secondary"
              >
                {SENSOR_TYPE_LABEL_VI[s] ?? s}
              </Badge>
            ))}
            {order.kit.includedModules?.map((m) => (
              <Badge
                key={m}
                variant="secondary"
              >
                {KIT_MODULE_LABEL_VI[m] ?? m}
              </Badge>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Mỗi đơn cấp {order.kit.deviceCount} thiết bị.
          </p>
        </section>

        {/* ─── Slot progress ─── */}
        {order.status === "PAID" && (
          <section className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Thiết bị đã kết nối
              </span>
              <span className="tabular-nums">
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
            </div>
            <Progress
              value={pct}
              className={cn(
                "h-2",
                full && "[&>div]:bg-red-500",
                near && "[&>div]:bg-amber-500",
              )}
            />
            {order.remainingSlots > 0 ? (
              <p className="text-xs text-muted-foreground">
                Còn có thể thêm{" "}
                <span className="font-medium text-foreground">
                  {order.remainingSlots}
                </span>{" "}
                thiết bị từ đơn này.
              </p>
            ) : (
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Đơn này đã sử dụng hết. Cần mua thêm để gán thêm thiết bị.
              </p>
            )}
          </section>
        )}

        {/* ─── Devices list ─── */}
        {order.status === "PAID" && (
          <section className="space-y-2">
            <p className="text-sm font-medium">
              Thiết bị đã được cấp ({order.devices.length})
            </p>
            {order.devices.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                Chưa có Iot kit nào được gán cho đơn này. Liên hệ admin để
                được gán Iot kit.
              </p>
            ) : (
              <div className="overflow-hidden rounded-md border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Tên thiết bị</th>
                      <th className="px-3 py-2 text-left">Loại</th>
                      <th className="px-3 py-2 text-left">Trạng thái</th>
                      <th className="px-3 py-2 text-left">Cấp ngày</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.devices.map((d) => (
                      <tr
                        key={d.id}
                        className="border-t"
                      >
                        <td className="px-3 py-2 font-medium">
                          {d.deviceName}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {d.deviceType}
                        </td>
                        <td className="px-3 py-2">
                          {DEVICE_STATUS_LABEL[d.status] ?? d.status}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {formatDateVi(d.provisionedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {order.status === "CANCELLED" && order.cancelledAt && (
          <p className="text-sm text-muted-foreground">
            Đơn đã hủy lúc {formatDateVi(order.cancelledAt)}.
          </p>
        )}

        <Separator />
        <DialogFooter>
          {isPending && (
            <Button
              onClick={() => {
                if (!pendingInvoiceId) return;
                onOpenChange(false);
                navigate(`/dashboard/owner/payments/${pendingInvoiceId}`);
              }}
              disabled={!pendingInvoiceId || paymentStatusQuery.isLoading}
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Đi đến trang thanh toán
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default IotKitOrderDetailDialog;
