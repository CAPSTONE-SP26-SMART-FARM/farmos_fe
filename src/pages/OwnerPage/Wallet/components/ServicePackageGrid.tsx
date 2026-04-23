import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrencyVnd } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ServicePackageType } from "@/schemaValidatation/credit";
import { Sparkle } from "lucide-react";
import { useMemo } from "react";

interface ServicePackageGridProps {
  packages: ServicePackageType[];
  onPurchase: (pkg: ServicePackageType) => void;
  purchasingId?: string | null;
}

function ServicePackageGrid({
  packages,
  onPurchase,
  purchasingId,
}: ServicePackageGridProps) {
  const bestValueId = useMemo(() => {
    if (packages.length < 2) return null;
    return packages.reduce<{
      id: string | null;
      perCredit: number;
    }>(
      (acc, pkg) => {
        const per = pkg.creditAmount > 0 ? pkg.price / pkg.creditAmount : Infinity;
        if (per < acc.perCredit) return { id: pkg.id, perCredit: per };
        return acc;
      },
      { id: null, perCredit: Infinity },
    ).id;
  }, [packages]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {packages.map((pkg) => {
        const perCredit =
          pkg.creditAmount > 0 ? pkg.price / pkg.creditAmount : 0;
        const isBest = pkg.id === bestValueId;
        const isPurchasing = purchasingId === pkg.id;
        return (
          <Card
            key={pkg.id}
            className={cn(
              "relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md",
              isBest && "border-primary",
            )}
          >
            {isBest && (
              <Badge className="absolute right-3 top-3 gap-1">
                <Sparkle className="h-3 w-3" />
                Giá tốt nhất
              </Badge>
            )}
            <CardContent className="flex h-full flex-col gap-3 pt-6">
              <div>
                <p className="font-semibold">{pkg.name}</p>
                {pkg.description && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pkg.description}
                  </p>
                )}
              </div>
              <div>
                <p className="text-3xl font-bold">
                  +{pkg.creditAmount.toLocaleString("vi-VN")}
                </p>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {pkg.creditType}
                </p>
              </div>
              <div className="mt-auto space-y-1">
                <p className="text-lg font-semibold text-primary">
                  {formatCurrencyVnd(pkg.price)}
                </p>
                {perCredit > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ≈ {formatCurrencyVnd(Math.round(perCredit))}/credit
                  </p>
                )}
              </div>
              <Button
                className="w-full"
                onClick={() => onPurchase(pkg)}
                disabled={isPurchasing}
              >
                {isPurchasing ? "Đang xử lý..." : "Mua"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default ServicePackageGrid;
