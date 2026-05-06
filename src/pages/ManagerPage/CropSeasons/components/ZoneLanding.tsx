import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, SquareArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import type { ZoneType } from "@/schemaValidatation/zone";

export function ZoneLanding({
  zones,
  isLoading,
  onSelect,
  badgeText = "Cổng quản lý",
  description = "Chọn khu vực để quản lý mùa vụ và theo dõi sản xuất.",
  emptyTitle = "Chưa được phân công khu vực",
  emptyDescription = "Liên hệ chủ vườn để được phân công quản lý khu vực.",
  actionLabel = "Quản lý",
}: {
  zones: ZoneType[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  badgeText?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  actionLabel?: string;
}) {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Badge className="mb-2">{badgeText}</Badge>
        <h1 className="text-2xl font-bold">Quản lý mùa vụ</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-36 w-full rounded-xl" />)}
        </div>
      ) : zones.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/20">
          <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="font-medium">{emptyTitle}</p>
          <p className="text-sm text-muted-foreground mt-1">{emptyDescription}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {zones.map((zone) => (
            <motion.div key={zone.id} whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
              <Card
                className="cursor-pointer hover:border-primary/60 hover:shadow-md transition-all"
                onClick={() => onSelect(zone.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base leading-tight truncate">{zone.name}</CardTitle>
                      {zone.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {zone.description}
                        </p>
                      )}
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">Trồng trọt</Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between">
                    {zone.areaSqm != null ? (
                      <span className="text-sm text-muted-foreground">
                        {zone.areaSqm.toLocaleString()} m²
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground/50">—</span>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1.5 text-primary"
                      onClick={() => onSelect(zone.id)}
                    >
                      {actionLabel}
                      <SquareArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
