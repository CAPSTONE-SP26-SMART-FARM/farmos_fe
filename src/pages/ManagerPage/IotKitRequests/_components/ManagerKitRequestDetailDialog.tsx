import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { KitRequestDetailMeta } from "@/components/iot-kit-request/KitRequestDetailMeta";
import { useKitRequestDetail } from "@/queries/useIotKitRequest";

/**
 * Dialog chi tiết yêu cầu kit IoT cho manager — read-only.
 *
 * Khác bản owner: không có nút "Hủy yêu cầu". Manager chỉ theo dõi tiến độ
 * xử lý của admin/owner — mọi action thuộc về role khác.
 */

interface Props {
  requestId: string | null;
  onClose: () => void;
}

export function ManagerKitRequestDetailDialog({ requestId, onClose }: Props) {
  const open = !!requestId;
  const { data, isLoading, isError } = useKitRequestDetail(
    requestId ?? "",
    !!requestId,
  );

  const request = data?.data;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
    >
      <DialogContent className="flex max-h-[min(85vh,820px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-12 text-left">
          <DialogTitle>Chi tiết yêu cầu hỗ trợ</DialogTitle>
          <DialogDescription>
            Theo dõi tiến độ xử lý của quản trị viên trên thiết bị thuộc vùng bạn phụ trách.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {isLoading || !request ? (
            isError ? (
              <p className="text-sm text-destructive">
                Không tải được yêu cầu, vui lòng thử lại.
              </p>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            )
          ) : (
            <KitRequestDetailMeta request={request} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
