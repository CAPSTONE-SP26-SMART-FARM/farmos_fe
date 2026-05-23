import { Ticket } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { MyQuotaResType } from "@/schemaValidatation/subscription";

interface TicketQuotaCardProps {
  limit: number;
  used: number;
  remaining: number;
  ticketCredits: MyQuotaResType["ticketCredits"];
}

export function TicketQuotaCard({
  limit,
  used,
  remaining,
  ticketCredits,
}: TicketQuotaCardProps) {
  const usedPercent =
    limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const isFull = limit > 0 && usedPercent >= 100;

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Ticket className="h-4 w-4 text-primary" />
          Hạn ngạch ticket / credit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Hạn mức gói</p>
            <p className="text-2xl font-semibold">{limit}</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="text-xs text-muted-foreground">Đã dùng</p>
            <p className="text-2xl font-semibold">{used}</p>
          </div>
          <div
            className={cn(
              "rounded-md border p-3",
              isFull
                ? "border-destructive/40 bg-destructive/5"
                : "border-primary/40 bg-primary/5",
            )}
          >
            <p className="text-xs text-muted-foreground">Còn lại</p>
            <p
              className={cn(
                "text-2xl font-semibold",
                isFull ? "text-destructive" : "text-primary",
              )}
            >
              {remaining}
            </p>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Tỷ lệ sử dụng</span>
            <span
              className={cn(
                "font-medium",
                isFull ? "text-destructive" : "text-foreground",
              )}
            >
              {limit > 0
                ? `${used}/${limit} (${usedPercent}%)${isFull ? " · Hết quota" : ""}`
                : "Chưa có hạn mức"}
            </span>
          </div>
          <div
            className={cn(
              "h-2 w-full overflow-hidden rounded-full",
              isFull ? "bg-destructive/20" : "bg-primary/20",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all",
                isFull ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${usedPercent}%` }}
            />
          </div>
        </div>

        {ticketCredits.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Số dư theo loại credit
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {ticketCredits.map((credit) => (
                <div
                  key={credit.creditType}
                  className="rounded-md border bg-muted/30 p-2.5"
                >
                  <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                    {credit.creditType}
                  </p>
                  <p className="mt-0.5 text-lg font-semibold">
                    {credit.balance}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TicketQuotaCard;
