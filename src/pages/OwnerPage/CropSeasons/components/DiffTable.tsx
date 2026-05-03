// src/pages/OwnerPage/CropSeasons/components/DiffTable.tsx
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import VarianceBadge from "./VarianceBadge";
import FieldHistoryModal from "./FieldHistoryModal";
import {
  getEntityTypeLabel,
  getFieldLabel,
  formatTrackingValue,
} from "@/lib/tracking-display";
import type {
  TrackingDiffResType,
  TrackingEntityType,
  TrackingDataType,
} from "@/schemaValidatation/tracking";

type TrackedSection = TrackingDiffResType["tracked"][number];

interface DiffTableProps {
  tracked: TrackedSection[];
  cropSeasonId: string;
}

interface FieldHistoryTarget {
  entityType: TrackingEntityType;
  entityId: string;
  fieldName: string;
  dataType: TrackingDataType;
}

export default function DiffTable({ tracked, cropSeasonId }: DiffTableProps) {
  const [historyTarget, setHistoryTarget] = useState<FieldHistoryTarget | null>(
    null,
  );

  if (!tracked.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Chưa có dữ liệu so sánh theo dõi.
      </p>
    );
  }

  return (
    <>
      <Accordion
        type="multiple"
        defaultValue={tracked.map((s) => s.entityType)}
      >
        {tracked.map((section) => (
          <AccordionItem
            key={section.entityType}
            value={section.entityType}
          >
            <AccordionTrigger className="text-base font-semibold">
              {getEntityTypeLabel(section.entityType)}
              <Badge
                variant="secondary"
                className="ml-2"
              >
                {section.entities.length}
              </Badge>
            </AccordionTrigger>
            <AccordionContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thực thể</TableHead>
                    <TableHead>Trường</TableHead>
                    <TableHead>Kế hoạch</TableHead>
                    <TableHead>Thực tế</TableHead>
                    <TableHead>Sai số</TableHead>
                    <TableHead>Thay đổi</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.entities.flatMap((entity) =>
                    entity.fields.map((field, fi) => (
                      <TableRow
                        key={`${entity.entityId}-${field.fieldName}`}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() =>
                          setHistoryTarget({
                            entityType: section.entityType,
                            entityId: entity.entityId,
                            fieldName: field.fieldName,
                            dataType: field.dataType,
                          })
                        }
                      >
                        {fi === 0 ? (
                          <TableCell
                            rowSpan={entity.fields.length}
                            className="font-mono text-xs align-top"
                          >
                            {entity.entityId.slice(0, 8)}…
                          </TableCell>
                        ) : null}
                        <TableCell className="text-sm">
                          {getFieldLabel(field.fieldName)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatTrackingValue(field.planValue, field.dataType)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTrackingValue(
                            field.actualValue,
                            field.dataType,
                          )}
                        </TableCell>
                        <TableCell>
                          <VarianceBadge
                            variance={field.variance}
                            dataType={field.dataType}
                          />
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {field.changeCount > 0
                            ? `Thay đổi ${field.changeCount} lần`
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setHistoryTarget({
                                entityType: section.entityType,
                                entityId: entity.entityId,
                                fieldName: field.fieldName,
                                dataType: field.dataType,
                              });
                            }}
                          >
                            Lịch sử
                          </Button>
                        </TableCell>
                      </TableRow>
                    )),
                  )}
                </TableBody>
              </Table>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      {historyTarget && (
        <FieldHistoryModal
          cropSeasonId={cropSeasonId}
          target={historyTarget}
          onClose={() => setHistoryTarget(null)}
        />
      )}
    </>
  );
}
