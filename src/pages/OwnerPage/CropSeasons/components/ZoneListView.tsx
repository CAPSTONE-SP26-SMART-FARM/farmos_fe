import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerGetMyFarm } from "@/queries/useOwner";
import { useOwnerListZones } from "@/queries/useZone";
import type { ZoneType } from "@/types/zone";
import { Building2, ChevronRight, Layers, Ruler, Sprout } from "lucide-react";
import { useState } from "react";

interface Props {
  onSelectZone: (zoneId: string, zoneName: string) => void;
}

const ZONE_TYPE_LABEL: Record<string, string> = {
  cultivation: "Trồng trọt",
  livestock: "Chăn nuôi",
};

function ZoneCard({
  zone,
  onSelect,
}: {
  zone: ZoneType;
  onSelect: () => void;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-md bg-primary/10 p-2">
              <Sprout className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{zone.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                ID: <span className="font-mono">{zone.id.slice(0, 8)}…</span>
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="outline"
            className="capitalize text-xs"
          >
            {ZONE_TYPE_LABEL[zone.zoneType] ?? zone.zoneType}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {zone.areaSqm != null && (
            <span className="flex items-center gap-1">
              <Ruler className="h-3 w-3" />
              {zone.areaSqm} m²
            </span>
          )}
          {zone.description && (
            <span className="truncate max-w-45">{zone.description}</span>
          )}
        </div>
        <Button
          size="sm"
          className="w-full gap-1 group-hover:bg-primary/90 transition-colors"
          onClick={onSelect}
        >
          Xem mùa vụ
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardContent>
    </Card>
  );
}

const ZoneGridSkeleton = () => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i}>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function ZoneListView({ onSelectZone }: Props) {
  const [page, setPage] = useState(1);
  const farmQuery = useOwnerGetMyFarm();
  const farm = farmQuery.data?.data;

  const zonesQuery = useOwnerListZones(farm?.id ?? "", { page, limit: 12 });
  const zones = zonesQuery.data?.data.data ?? [];
  const meta = zonesQuery.data?.data.meta;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className="mb-2">Owner Portal</Badge>
          <h1 className="text-2xl font-bold">Mùa vụ theo Zone</h1>
          <p className="text-muted-foreground">
            Chọn một zone để xem danh sách mùa vụ và phê duyệt kế hoạch sản
            xuất.
          </p>
        </div>
        {farm && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4" />
            <span className="font-medium">{farm.name}</span>
          </div>
        )}
      </div>

      {farmQuery.isLoading || zonesQuery.isLoading ? (
        <ZoneGridSkeleton />
      ) : !farm ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">Chưa có nông trại</h3>
            <p className="text-sm text-muted-foreground">
              Tạo nông trại trước để quản lý zone và mùa vụ.
            </p>
          </CardContent>
        </Card>
      ) : zones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Layers className="h-10 w-10 text-muted-foreground mb-3" />
            <h3 className="text-lg font-semibold mb-1">Chưa có zone nào</h3>
            <p className="text-sm text-muted-foreground">
              Tạo zone trong Farm Management để bắt đầu theo dõi mùa vụ.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <ZoneCard
                key={zone.id}
                zone={zone}
                onSelect={() => onSelectZone(zone.id, zone.name)}
              />
            ))}
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasPreviousPage}
                onClick={() => setPage((p) => p - 1)}
              >
                Trước
              </Button>
              <span className="text-sm text-muted-foreground">
                {meta.page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!meta.hasNextPage}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
