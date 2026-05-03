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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Phát sinh sau kế hoạch
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            {unplanned.reduce((sum, s) => sum + s.entities.length, 0)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Loại thực thể</TableHead>
              <TableHead>ID</TableHead>
              <TableHead>Ngày tạo</TableHead>
              <TableHead>Trường / Giá trị</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {unplanned.flatMap((section) =>
              section.entities.map((entity, entityIndex) => (
                <TableRow key={entity.entityId}>
                  <TableCell>
                    <Badge
                      className="bg-purple-100 text-purple-700 text-xs"
                      variant="outline"
                    >
                      {getEntityTypeLabel(section.entityType)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    <p className="font-medium">
                      {getEntityTypeLabel(section.entityType)} #{entityIndex + 1}
                    </p>
                    <p className="font-mono text-muted-foreground">
                      {entity.entityId.slice(0, 8)}…
                    </p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {entity.createdAt
                      ? format(parseISO(entity.createdAt), "dd/MM/yyyy HH:mm")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {entity.fields.map((f) => (
                        <div
                          key={f.fieldName}
                          className="text-xs"
                        >
                          <span className="text-muted-foreground">
                            {getFieldLabel(f.fieldName)}:{" "}
                          </span>
                          <span>
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
      </CardContent>
    </Card>
  );
}
