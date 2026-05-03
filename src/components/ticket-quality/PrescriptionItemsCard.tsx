import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import EmptyState from "@/components/common/EmptyState";
import { PRESCRIPTION_STATUS_LABEL } from "@/constants/ticketQualityLabels";
import type {
  PrescriptionItemResType,
  PrescriptionWithItemsResType,
} from "@/schemaValidatation/prescription";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { AlertTriangle, Clock, Pill } from "lucide-react";

interface PrescriptionItemsCardProps {
  prescription: PrescriptionWithItemsResType | null;
}

// Card hiển thị đơn thuốc kê cho ticket cùng cảnh báo thời gian ngừng
// thuốc trước khi thu hoạch (BR-77).

function ItemRow({ item }: { item: PrescriptionItemResType }) {
  const days = item.withdrawalPeriodDays ?? 0;
  // Ưu tiên `medicineName` denormalized từ BE (có sẵn ở mọi case);
  // fallback `customMedicineName` nếu BE không trả.
  const displayName =
    item.medicineName ?? item.customMedicineName ?? "Thuốc không tên";
  const isCustom = !item.medicineId;

  return (
    <div className="rounded-md border p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-medium">{displayName}</p>
            {isCustom && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0"
              >
                Tự nhập
              </Badge>
            )}
          </div>
        </div>
        {days > 0 && (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-700 border-amber-200 shrink-0"
          >
            Ngừng {days} ngày
          </Badge>
        )}
      </div>

      <div className="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <span className="text-muted-foreground">Liều: </span>
          <span className="font-medium">{item.dosage}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Tần suất: </span>
          <span className="font-medium">{item.frequency}</span>
        </div>
        {item.route && (
          <div>
            <span className="text-muted-foreground">Đường dùng: </span>
            <span className="font-medium">{item.route}</span>
          </div>
        )}
        {item.durationDays != null && (
          <div>
            <span className="text-muted-foreground">Số ngày: </span>
            <span className="font-medium">{item.durationDays}</span>
          </div>
        )}
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-1">Hướng dẫn sử dụng</p>
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {item.usageInstructions}
        </p>
      </div>

      {item.warnings && (
        <div className="flex items-start gap-2 rounded-md bg-red-500/10 border border-red-200 p-2 text-xs">
          <AlertTriangle className="h-3.5 w-3.5 text-red-700 mt-0.5 shrink-0" />
          <p className="text-red-900 whitespace-pre-wrap">{item.warnings}</p>
        </div>
      )}

      {days > 0 && (
        <Alert
          variant="default"
          className="bg-amber-500/10 border-amber-200"
        >
          <AlertTriangle className="h-4 w-4 text-amber-700" />
          <AlertDescription className="text-amber-900 text-xs">
            <strong>Cảnh báo quan trọng:</strong> Thời gian ngừng thuốc trước
            thu hoạch là <strong>{days} ngày</strong>. Không được thu hoạch
            sản phẩm trong khoảng thời gian này tính từ lần kê thuốc cuối
            cùng.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export default function PrescriptionItemsCard({
  prescription,
}: PrescriptionItemsCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Pill className="h-4 w-4" />
          Đơn thuốc
          {prescription && prescription.items.length > 0 && (
            <Badge
              variant="secondary"
              className="ml-auto"
            >
              {prescription.items.length} mục
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          Đơn thuốc kê cho ticket cùng cảnh báo thời gian ngừng thuốc trước
          khi thu hoạch.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!prescription || prescription.items.length === 0 ? (
          <EmptyState
            icon={Pill}
            title="Không có đơn thuốc"
            description="Bác sĩ có thể không cần kê thuốc cho ticket này."
          />
        ) : (
          <div className="space-y-3">
            {/* Header info */}
            <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  Kê lúc{" "}
                  {format(
                    new Date(prescription.createdAt),
                    "HH:mm dd/MM/yyyy",
                    { locale: vi },
                  )}
                </span>
              </div>
              {prescription.status !== "ISSUED" && (
                <Badge
                  variant="outline"
                  className={
                    prescription.status === "SUPERSEDED"
                      ? "bg-amber-500/10 text-amber-700 border-amber-200"
                      : "bg-muted text-muted-foreground"
                  }
                >
                  {PRESCRIPTION_STATUS_LABEL[prescription.status]}
                </Badge>
              )}
            </div>

            {/* General notes */}
            {prescription.generalNotes && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <p className="text-xs text-muted-foreground mb-1">
                  Ghi chú chung
                </p>
                <p className="leading-relaxed whitespace-pre-wrap">
                  {prescription.generalNotes}
                </p>
              </div>
            )}

            <Separator />

            {/* Items */}
            <div className="space-y-3">
              {prescription.items
                .slice()
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                  />
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
