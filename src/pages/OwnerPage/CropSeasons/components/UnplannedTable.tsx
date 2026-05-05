// src/pages/OwnerPage/CropSeasons/components/UnplannedTable.tsx
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import {
  getEntityTypeLabel,
  getFieldLabel,
  formatTrackingValue,
} from "@/lib/tracking-display";
import { format, parseISO } from "date-fns";
import type { TrackingDiffResType } from "@/schemaValidatation/tracking";

type UnplannedSection = TrackingDiffResType["unplanned"][number];

interface UnplannedTableProps {
  unplanned: UnplannedSection[];
}

export default function UnplannedTable({ unplanned }: UnplannedTableProps) {
  const total = unplanned.reduce((sum, s) => sum + s.entities.length, 0);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" />
          Phát sinh sau kế hoạch
          <Badge className="bg-amber-100 text-amber-800 border-amber-200">
            {total}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-hidden border-t">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="w-44">Loại thực thể</TableHead>
                <TableHead className="w-40">Định danh</TableHead>
                <TableHead className="w-40">Ngày tạo</TableHead>
                <TableHead>Trường / Giá trị thực tế</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unplanned.flatMap((section) =>
                section.entities.map((entity, entityIndex) => (
                  <TableRow
                    key={entity.entityId}
                    className="hover:bg-muted/30"
                  >
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-800 border-amber-200 text-xs"
                      >
                        {getEntityTypeLabel(section.entityType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium">
                        {getEntityTypeLabel(section.entityType)} #
                        {entityIndex + 1}
                      </p>
                      <p className="font-mono text-[11px] text-muted-foreground">
                        {entity.entityId.slice(0, 8)}…
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {entity.createdAt
                        ? format(parseISO(entity.createdAt), "dd/MM/yyyy HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {entity.fields.map((f) => (
                          <div
                            key={f.fieldName}
                            className="text-xs"
                          >
                            <span className="text-muted-foreground">
                              {getFieldLabel(f.fieldName)}:{" "}
                            </span>
                            <span className="font-medium">
                              {formatTrackingValue(f.actualValue, f.dataType)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )),
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
