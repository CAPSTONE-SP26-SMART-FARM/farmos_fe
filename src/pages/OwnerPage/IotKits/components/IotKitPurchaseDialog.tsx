import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useOwnerPurchaseIotKit } from "@/queries/useIotKit";
import {
  handleApiErrorUnprocessentity,
  onMutationError,
} from "@/lib/axios";
import { isApiErrorUnprocessableEntityResponse } from "@/lib/utils";
import { formatCurrencyVnd } from "@/lib/format";
import type {
  IotDeviceKitResType,
  PurchaseIotKitBodyType,
} from "@/schemaValidatation/iotKit";
import { toast } from "sonner";
import { ExternalLink } from "lucide-react";
import { useNavigate } from "react-router";

interface IotKitPurchaseDialogProps {
  kit: IotDeviceKitResType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function IotKitPurchaseDialog({
  kit,
  open,
  onOpenChange,
}: IotKitPurchaseDialogProps) {
  const navigate = useNavigate();
  const purchaseMutation = useOwnerPurchaseIotKit();

  const handleConfirm = async () => {
    const body: PurchaseIotKitBodyType = { quantity: 1 };
    try {
      const res = await purchaseMutation.mutateAsync({ id: kit.id, data: body });
      const { paymentUrl, orderId } = res.data;
      onOpenChange(false);
      toast.success("Đã tạo đơn mua bộ Kit IoT.");
      if (paymentUrl) {
        const opened = window.open(paymentUrl, "_blank", "noopener,noreferrer");
        if (!opened) {
          toast.warning(
            "Trình duyệt chặn cửa sổ bật lên. Vui lòng dùng nút 'Mở lại cổng PayOS' ở trang theo dõi đơn.",
          );
        }
      }
      // SPA navigate để giữ socket / cache, không reload toàn trang.
      navigate(`/dashboard/owner/iot-kits/orders/${orderId}`);
    } catch (error) {
      if (isApiErrorUnprocessableEntityResponse(error)) {
        handleApiErrorUnprocessentity(error.response?.data?.errors);
        return;
      }
      onMutationError(error, "Không thể tạo đơn mua bộ Kit IoT.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mua bộ Kit IoT</DialogTitle>
          <DialogDescription>
            Xác nhận mua bộ kit dưới đây. Hệ thống sẽ tạo hoá đơn và mở cổng
            thanh toán PayOS.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 rounded-md border bg-muted/30 p-4 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Bộ Kit</span>
            <span className="text-right font-medium">{kit.name}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Mã</span>
            <span className="font-mono text-xs">{kit.code}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Số bộ</span>
            <span>{kit.deviceCount}</span>
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">Tổng cộng</span>
            <span className="text-xl font-semibold">
              {formatCurrencyVnd(kit.price)}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Sau khi xác nhận, một tab mới sẽ mở cổng thanh toán PayOS. Trang theo
          dõi đơn sẽ tự cập nhật tình trạng trong vòng 3-6 giây.
        </p>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={purchaseMutation.isPending}
          >
            Huỷ
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={purchaseMutation.isPending}
          >
            {purchaseMutation.isPending ? (
              "Đang xử lý..."
            ) : (
              <>
                <ExternalLink className="mr-2 h-4 w-4" />
                Xác nhận và thanh toán
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
