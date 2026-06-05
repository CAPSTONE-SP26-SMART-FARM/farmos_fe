import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Wallet } from "lucide-react";

interface TicketPaymentCardProps {
  unitPrice: number | null | undefined;
  payoutAt?: string | null;
  isAIResolved?: boolean;
}

function formatVnd(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);
}

export function TicketPaymentCard({
  unitPrice,
  payoutAt,
  isAIResolved,
}: TicketPaymentCardProps) {
  if (unitPrice == null) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          Thanh toán
        </CardTitle>
        <CardDescription>
          Thông tin thanh toán hoa hồng cho bác sĩ.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Đơn giá ticket</span>
          <span className="font-medium tabular-nums">
            {formatVnd(unitPrice)}
          </span>
        </div>
        {payoutAt && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Đã thanh toán</span>
            <span className="text-xs">
              {format(new Date(payoutAt), "HH:mm dd/MM/yyyy", { locale: vi })}
            </span>
          </div>
        )}
        <Separator />
        {isAIResolved ? (
          <p className="text-xs text-muted-foreground">
            Ticket xử lý bởi AI — không thanh toán cho bác sĩ.
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Hệ thống đã tính hoa hồng theo cấu hình hiện tại.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
