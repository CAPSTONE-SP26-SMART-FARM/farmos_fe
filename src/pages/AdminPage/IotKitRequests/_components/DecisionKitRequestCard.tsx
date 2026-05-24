import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KitRequestStatusBadge } from "@/components/iot-kit-request/KitRequestBadges";
import { useAdminKitRequestList } from "@/queries/useIotKitRequest";
import { CalendarClock, ExternalLink } from "lucide-react";
import { Link } from "react-router";

/**
 * Card chèn vào Decision page — readonly link tới INSTALL_SCHEDULE auto-tạo
 * cho cropSeason của device.
 *
 * Flow mới (2026-05-24): schedule auto-create khi owner approve season →
 * admin KHÔNG tạo lịch từ Decision page nữa. Card này chỉ giúp admin
 * nhanh chóng nhảy sang trang chi tiết request (nơi có button start/complete).
 *
 * Nếu device chưa thuộc season nào hoặc chưa có schedule → ẩn card.
 *
 * @deprecated 2 button "Hẹn lịch lắp" + "Báo lắp xong" cũ đã bỏ — chuyển
 * sang trang `/dashboard/admin/iot-kit-requests/:id` để xử lý.
 */

interface Props {
  iotDeviceId: string;
}

export function DecisionKitRequestCard({ iotDeviceId }: Props) {
  // Query 1 dòng tóm lược schedule open của device này. KHÔNG filter
  // status để show cả history nếu request đã resolved.
  const listQuery = useAdminKitRequestList({
    page: 1,
    limit: 5,
    iotDeviceId,
    type: "INSTALL_SCHEDULE",
  });

  const requests = listQuery.data?.data.data ?? [];

  // BE filter theo iotDeviceId. Nhưng INSTALL_SCHEDULE flow mới gắn với
  // cropSeasonId, không gắn iotDeviceId — nên query này trả [] cho schedule
  // mới. Đây là expected: admin sẽ vào trực tiếp /iot-kit-requests để xem.
  // Giữ logic để compat với schedule cũ (history flow ADMIN_TO_OWNER).
  if (!listQuery.isLoading && requests.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Yêu cầu lắp đặt
        </CardTitle>
        <CardDescription>
          Lịch lắp đặt liên quan tới thiết bị này. Click để xem chi tiết và xử
          lý.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {listQuery.isLoading ? (
          <p className="text-xs text-muted-foreground">Đang tải...</p>
        ) : (
          requests.map((r) => (
            <Link
              key={r.id}
              to={`/dashboard/admin/iot-kit-requests?requestId=${r.id}`}
              className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm hover:bg-muted/40"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">
                  {r.requestNumber}
                </span>
                <KitRequestStatusBadge status={r.status} />
              </div>
              <ExternalLink
                className="h-3.5 w-3.5 text-muted-foreground"
                aria-hidden
              />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
