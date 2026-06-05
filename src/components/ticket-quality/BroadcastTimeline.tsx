import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BROADCAST_STATUS_DOT_CLASS,
  BROADCAST_STATUS_LABEL,
} from "@/constants/ticketQualityLabels";
import type { BroadcastResType } from "@/schemaValidatation/broadcast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Radio, Stethoscope } from "lucide-react";
import { DoctorDetailDialog } from "./_panel/DoctorDetailDialog";

interface BroadcastTimelineProps {
  broadcasts: BroadcastResType[];
}

// Card hiển thị danh sách bác sĩ được hệ thống đẩy ticket cùng phản hồi
// của từng người (PENDING / ACCEPTED / REJECTED / IGNORED). Click vào
// từng bác sĩ → mở dialog xem chuyên môn + đánh giá (lazy fetch
// `GET /doctors/:id/public`). KHÔNG hiện UUID raw (rule 17).

export default function BroadcastTimeline({
  broadcasts,
}: BroadcastTimelineProps) {
  const [openDoctorId, setOpenDoctorId] = useState<string | null>(null);

  // Sort theo thời gian gửi tăng dần — bác sĩ #1 là người được mời sớm nhất.
  const sorted = [...broadcasts].sort(
    (a, b) =>
      new Date(a.notifiedAt).getTime() - new Date(b.notifiedAt).getTime(),
  );

  return (
    <>
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
              {sorted.map((b, idx) => (
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
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setOpenDoctorId(b.doctorId)}
                        className="h-auto p-0 text-sm font-medium"
                        aria-label={`Xem hồ sơ bác sĩ ${idx + 1}`}
                      >
                        <Stethoscope className="h-3.5 w-3.5" />
                        Bác sĩ #{idx + 1}
                      </Button>
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

      <DoctorDetailDialog
        doctorId={openDoctorId}
        open={openDoctorId !== null}
        onOpenChange={(open) => {
          if (!open) setOpenDoctorId(null);
        }}
      />
    </>
  );
}
