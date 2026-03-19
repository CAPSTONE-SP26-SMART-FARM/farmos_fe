import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useOwnerListZones } from "@/queries/useZone";
import type { ZoneType } from "@/schemaValidatation/zone";
import { Beef, Eye, MoreVertical, Pencil, Plus, Sprout } from "lucide-react";
import { useState } from "react";

interface Props {
  farmId: string;
  onCreateZone: () => void;
  onViewZone?: (zone: ZoneType) => void;
  onEditZone: (zone: ZoneType) => void;
}

const ZONE_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  { value: "cultivation", label: "Cultivation" },
] as const;

const ZoneTypeIcon = ({ type }: { type: ZoneType["zoneType"] }) =>
  type === "cultivation" ? (
    <Sprout className="h-4 w-4 text-green-600" />
  ) : (
    <Beef className="h-4 w-4 text-amber-600" />
  );

const ZoneListSection = ({
  farmId,
  onCreateZone,
  onViewZone,
  onEditZone,
}: Props) => {
  const [typeFilter, setTypeFilter] = useState<"all" | "cultivation">("all");
  const [page, setPage] = useState(1);
  const limit = 10;

  const query = {
    page,
    limit,
    ...(typeFilter !== "all" ? { zoneType: typeFilter } : {}),
  };

  const { data, isLoading, isError } = useOwnerListZones(farmId, query);
  const zones = data?.data.data ?? [];
  const meta = data?.data.meta;

  const handleTypeChange = (value: string) => {
    setTypeFilter(value as "all" | "cultivation");
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Zones</h2>
          <p className="text-sm text-muted-foreground">
            Manage the zones of your farm. Zones are used to organize crop
            seasons.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Select
            value={typeFilter}
            onValueChange={handleTypeChange}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZONE_TYPE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={onCreateZone}
            className="gap-1.5"
          >
            <Plus className="h-4 w-4" />
            Add Zone
          </Button>
        </div>
      </div>

      {isLoading ? (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Area (sq.m)</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12.5"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-36" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 mx-auto" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Failed to load zones. Please try again.
            </p>
          </CardContent>
        </Card>
      ) : zones.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Sprout className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">No zones yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create a zone to organize your farm into sections for better crop
              season management.
            </p>
            <Button
              onClick={onCreateZone}
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Add First Zone
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Zone Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Area (sq.m)</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12.5"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {zones.map((zone) => (
                  <TableRow key={zone.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ZoneTypeIcon type={zone.zoneType} />
                        <span className="font-medium">{zone.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className="capitalize"
                      >
                        {zone.zoneType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {zone.areaSqm != null
                        ? zone.areaSqm.toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(zone.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {onViewZone && (
                            <DropdownMenuItem onClick={() => onViewZone(zone)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => onEditZone(zone)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {meta.page} of {meta.totalPages} &bull; {meta.totalItems}{" "}
                zone{meta.totalItems !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ZoneListSection;
