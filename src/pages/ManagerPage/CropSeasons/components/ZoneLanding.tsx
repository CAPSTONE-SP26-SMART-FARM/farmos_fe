import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Search, SquareArrowRight, Sprout, X } from "lucide-react";
import { motion } from "framer-motion";
import { useMemo, useState } from "react";
import type { ZoneType } from "@/schemaValidatation/zone";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "./helpers";
import { cn } from "@/lib/utils";

export function ZoneLanding({
  zones,
  isLoading,
  onSelect,
  badgeText = "Cổng quản lý",
  description = "Chọn khu vực để quản lý mùa vụ và theo dõi sản xuất.",
  emptyTitle = "Chưa được phân công khu vực",
  emptyDescription = "Liên hệ chủ trang trại để được phân công quản lý khu vực.",
  actionLabel = "Quản lý",
  showCropSeason = false,
  showZoneTypeBadge = true,
  headerSlot,
  searchValue,
  onSearchChange,
  totalCount,
}: {
  zones: ZoneType[];
  isLoading: boolean;
  onSelect: (id: string) => void;
  badgeText?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  actionLabel?: string;
  showCropSeason?: boolean;
  showZoneTypeBadge?: boolean;
  headerSlot?: React.ReactNode;
  /** Controlled search value — when provided, ZoneLanding is controlled and filtering is delegated to parent (API). */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Total count before search filter (for "x/y khu vực" display in controlled mode). */
  totalCount?: number;
}) {
  const isControlled = onSearchChange !== undefined;
  const [internalSearch, setInternalSearch] = useState("");
  const search = isControlled ? (searchValue ?? "") : internalSearch;
  const setSearch = (v: string) => {
    if (isControlled) onSearchChange?.(v);
    else setInternalSearch(v);
  };
  const normalizedSearch = search.trim().toLowerCase();
  const filteredZones = useMemo(() => {
    if (isControlled || !normalizedSearch) return zones;
    return zones.filter((zone) => {
      const haystack = [zone.name, zone.description ?? ""]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [zones, normalizedSearch, isControlled]);
  const displayTotal = totalCount ?? zones.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <Badge className="mb-2">{badgeText}</Badge>
        <h1 className="text-2xl font-bold">Quản lý mùa vụ</h1>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-36 w-full rounded-xl"
            />
          ))}
        </div>
      ) : zones.length === 0 && !normalizedSearch ? (
        <div className="space-y-4">
          {headerSlot && <div className="">{headerSlot}</div>}
          <div className="flex flex-col items-center justify-center py-24 text-center border rounded-xl bg-muted/20">
            <MapPin className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="font-medium">{emptyTitle}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {emptyDescription}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Tìm khu vực theo tên..."
                  className="pl-9 pr-9"
                  aria-label="Tìm khu vực"
                />
                {search && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                    onClick={() => setSearch("")}
                    aria-label="Xoá tìm kiếm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {normalizedSearch && (
                <span className="text-xs text-muted-foreground shrink-0">
                  {isControlled
                    ? `${displayTotal} kết quả`
                    : `${filteredZones.length}/${zones.length} khu vực`}
                </span>
              )}
            </div>
            {headerSlot && <div className="shrink-0">{headerSlot}</div>}
          </div>

          {filteredZones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border rounded-xl bg-muted/20">
              <Search className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="font-medium">Không tìm thấy khu vực</p>
              <p className="text-sm text-muted-foreground mt-1">
                Thử từ khoá khác hoặc xoá bộ lọc.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredZones.map((zone) => (
                <motion.div
                  key={zone.id}
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                >
                  <Card
                    className="cursor-pointer hover:border-primary/60 hover:shadow-md lg:min-h-[254px] transition-all"
                    onClick={() => onSelect(zone.id)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base leading-tight truncate">
                            {zone.name}
                          </CardTitle>
                          {zone.description && (
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {zone.description}
                            </p>
                          )}
                        </div>
                        {showZoneTypeBadge && (
                          <Badge
                            variant="secondary"
                            className="text-xs shrink-0"
                          >
                            Trồng trọt
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-3 grow">
                      {showCropSeason && (
                        <div
                          className={cn(
                            "rounded-md border border-dashed bg-muted/30 px-3 py-2 lg:min-h-17.5",
                            !zone.currentCropSeason &&
                              "flex items-center justify-center",
                          )}
                        >
                          {zone.currentCropSeason ? (
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex items-center gap-1.5">
                                  <Sprout className="h-3.5 w-3.5 text-primary shrink-0" />
                                  <span className="text-sm font-medium truncate">
                                    {zone.currentCropSeason.cropName}
                                    {zone.currentCropSeason.variety
                                      ? ` — ${zone.currentCropSeason.variety}`
                                      : ""}
                                  </span>
                                </div>
                                <StatusBadge
                                  status={zone.currentCropSeason.status}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Dự kiến thu hoạch:{" "}
                                {formatDate(
                                  zone.currentCropSeason.expectedHarvestDate,
                                )}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center h-full gap-1.5 text-xs text-muted-foreground">
                              <Sprout className="h-3.5 w-3.5" />
                              Chưa có mùa vụ
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="w-full">
                      <div className="flex items-end justify-between w-full">
                        {zone.areaSqm != null ? (
                          <span className="text-sm text-muted-foreground">
                            {zone.areaSqm.toLocaleString()} m²
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground/50">
                            —
                          </span>
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
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
