import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BROADCAST_STATUS_DOT_CLASS,
  BROADCAST_STATUS_LABEL,
} from "@/constants/ticketQualityLabels";
import type { BroadcastResType } from "@/schemaValidatation/broadcast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Radio } from "lucide-react";

interface BroadcastTimelineProps {
  broadcasts: BroadcastResType[];
}

// Card hiển thị danh sách bác sĩ được hệ thống đẩy ticket cùng phản hồi
// của từng người (PENDING / ACCEPTED / REJECTED / IGNORED).

export default function BroadcastTimeline({
  broadcasts,
}: BroadcastTimelineProps) {
  // Sort theo thời gian gửi tăng dần.
  const sorted = [...broadcasts].sort(
    (a, b) =>
      new Date(a.notifiedAt).getTime() - new Date(b.notifiedAt).getTime(),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4" />
          Lịch sử gửi ticket cho bác sĩ
          {sorted.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto"
            >
              {sorted.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Danh sách bác sĩ đã được hệ thống mời tiếp nhận ticket cùng phản
          hồi của từng người.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Chưa gửi yêu cầu cho bác sĩ nào.
          </p>
        ) : (
          <div className="space-y-3">
            {sorted.map((b) => (
              <div
                key={b.id}
                className="flex items-start gap-3 text-sm"
              >
                <div className="flex flex-col items-center pt-1.5">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${BROADCAST_STATUS_DOT_CLASS[b.status]}`}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <p className="font-mono text-xs text-muted-foreground">
                      Bác sĩ {b.doctorId.slice(0, 8)}…
                    </p>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {BROADCAST_STATUS_LABEL[b.status]}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Gửi:{" "}
                    {format(new Date(b.notifiedAt), "HH:mm dd/MM/yyyy", {
                      locale: vi,
                    })}
                    {b.respondedAt && (
                      <>
                        {" · "}
                        Phản hồi:{" "}
                        {format(
                          new Date(b.respondedAt),
                          "HH:mm dd/MM/yyyy",
                          { locale: vi },
                        )}
                      </>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
