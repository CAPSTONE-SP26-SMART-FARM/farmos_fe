import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCreditLabel } from "@/constants/creditLabel";
import { cn } from "@/lib/utils";
import type { OwnerCreditType } from "@/schemaValidatation/credit";
import { AlertTriangle, Stethoscope } from "lucide-react";

export const LOW_BALANCE_THRESHOLD = 10;

interface CreditBalanceCardProps {
  credit: OwnerCreditType;
}

function CreditBalanceCard({ credit }: CreditBalanceCardProps) {
  const isLow = credit.balance < LOW_BALANCE_THRESHOLD;

  return (
    <Card className={cn(isLow && "border-amber-300")}>
      <CardContent className="space-y-2 pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <p className="text-sm font-medium">
              {formatCreditLabel(credit.creditType)}
            </p>
          </div>
          {isLow && (
            <Badge
              variant="outline"
              className="gap-1 border-amber-300 bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200"
            >
              <AlertTriangle className="h-3 w-3" />
              Sắp hết
            </Badge>
          )}
        </div>
        <p className="text-4xl font-bold tabular-nums">
          {credit.balance.toLocaleString("vi-VN")}
        </p>
      </CardContent>
    </Card>
  );
}

export default CreditBalanceCard;
