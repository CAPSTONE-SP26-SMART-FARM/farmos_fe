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
import { History, Inbox } from "lucide-react";
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
  VarianceType,
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

function actualToneClass(variance: VarianceType) {
  const dir = variance?.direction;
  if (dir === "late" || dir === "higher") return "text-red-700";
  if (dir === "early" || dir === "lower") return "text-amber-700";
  return "text-foreground";
}

export default function DiffTable({
  tracked,
  cropSeasonId,
}: DiffTableProps) {
  const [historyTarget, setHistoryTarget] = useState<FieldHistoryTarget | null>(
    null,
  );

  if (!tracked.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Chưa có dữ liệu so sánh theo dõi.
        </p>
      </div>
    );
  }

  return (
    <>
      <Accordion
        type="multiple"
        defaultValue={tracked.map((s) => s.entityType)}
        className="space-y-3"
      >
        {tracked.map((section) => {
          const fieldCount = section.entities.reduce(
            (sum, e) => sum + e.fields.length,
            0,
          );
          return (
            <AccordionItem
              key={section.entityType}
              value={section.entityType}
              className="rounded-lg border bg-background px-4"
            >
              <AccordionTrigger className="text-base font-semibold hover:no-underline">
                <span className="flex items-center gap-2">
                  {getEntityTypeLabel(section.entityType)}
                  <Badge
                    variant="secondary"
                    className="font-mono"
                  >
                    {fieldCount}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-1">
                <div className="overflow-hidden rounded-md border">
                  <Table className="table-fixed w-full">
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-[14%]">Thực thể</TableHead>
                        <TableHead className="w-[14%]">Trường</TableHead>
                        <TableHead className="w-[22%]">Kế hoạch</TableHead>
                        <TableHead className="w-[22%]">Thực tế</TableHead>
                        <TableHead className="w-[10%]">Sai số</TableHead>
                        <TableHead className="w-[8%]">Thay đổi</TableHead>
                        <TableHead className="w-[10%]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.entities.flatMap((entity, entityIndex) =>
                        entity.fields.map((field, fi) => (
                          <TableRow
                            key={`${entity.entityId}-${field.fieldName}`}
                            className="cursor-pointer hover:bg-muted/40 align-top"
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
                                className="whitespace-normal wrap-anywhere"
                              >
                                <p className="text-sm font-medium">
                                  {getEntityTypeLabel(section.entityType)} #
                                  {entityIndex + 1}
                                </p>
                              </TableCell>
                            ) : null}
                            <TableCell className="text-sm font-medium whitespace-normal wrap-anywhere">
                              {getFieldLabel(field.fieldName)}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground line-through decoration-muted-foreground/40 whitespace-normal wrap-anywhere">
                              {formatTrackingValue(
                                field.planValue,
                                field.dataType,
                                {
                                  entityType: section.entityType,
                                  fieldName: field.fieldName,
                                },
                              )}
                            </TableCell>
                            <TableCell
                              className={`text-sm font-semibold whitespace-normal wrap-anywhere ${actualToneClass(field.variance)}`}
                            >
                              {formatTrackingValue(
                                field.actualValue,
                                field.dataType,
                                {
                                  entityType: section.entityType,
                                  fieldName: field.fieldName,
                                },
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
                                ? `${field.changeCount} lần`
                                : "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 gap-1"
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
                                <History className="h-3.5 w-3.5" />
                                <span className="text-xs">Lịch sử</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        )),
                      )}
                    </TableBody>
                  </Table>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
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
