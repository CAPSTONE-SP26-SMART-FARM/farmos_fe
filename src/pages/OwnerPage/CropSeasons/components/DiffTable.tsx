// src/pages/OwnerPage/CropSeasons/components/DiffTable.tsx
import { useMemo, useState } from "react";
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
import { ArrowRight, History, Inbox } from "lucide-react";
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
type FilterKey = "all" | "late" | "ontime" | "early";

interface DiffTableProps {
  tracked: TrackedSection[];
  cropSeasonId: string;
  filter: FilterKey;
}

interface FieldHistoryTarget {
  entityType: TrackingEntityType;
  entityId: string;
  fieldName: string;
  dataType: TrackingDataType;
}

function matchesFilter(variance: VarianceType, filter: FilterKey) {
  if (filter === "all") return true;
  const dir = variance?.direction;
  if (filter === "late") return dir === "late" || dir === "higher";
  if (filter === "ontime") return dir === "on-time" || dir === "equal";
  if (filter === "early") return dir === "early" || dir === "lower";
  return true;
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
  filter,
}: DiffTableProps) {
  const [historyTarget, setHistoryTarget] = useState<FieldHistoryTarget | null>(
    null,
  );

  const filteredSections = useMemo(() => {
    return tracked
      .map((section) => ({
        ...section,
        entities: section.entities
          .map((entity) => ({
            ...entity,
            fields: entity.fields.filter((f) =>
              matchesFilter(f.variance, filter),
            ),
          }))
          .filter((e) => e.fields.length > 0),
      }))
      .filter((s) => s.entities.length > 0);
  }, [tracked, filter]);

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

  if (!filteredSections.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Inbox className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Không có trường nào khớp bộ lọc hiện tại.
        </p>
      </div>
    );
  }

  return (
    <>
      <Accordion
        type="multiple"
        defaultValue={filteredSections.map((s) => s.entityType)}
        className="space-y-3"
      >
        {filteredSections.map((section) => {
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
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-45">Thực thể</TableHead>
                        <TableHead className="w-40">Trường</TableHead>
                        <TableHead>Kế hoạch → Thực tế</TableHead>
                        <TableHead className="w-30">Sai số</TableHead>
                        <TableHead className="w-27.5">Thay đổi</TableHead>
                        <TableHead className="w-20" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {section.entities.flatMap((entity, entityIndex) =>
                        entity.fields.map((field, fi) => (
                          <TableRow
                            key={`${entity.entityId}-${field.fieldName}`}
                            className="cursor-pointer hover:bg-muted/40"
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
                                className="align-top"
                              >
                                <p className="text-sm font-medium">
                                  {getEntityTypeLabel(section.entityType)} #
                                  {entityIndex + 1}
                                </p>
                                <p className="font-mono text-[11px] text-muted-foreground">
                                  {entity.entityId.slice(0, 8)}…
                                </p>
                              </TableCell>
                            ) : null}
                            <TableCell className="text-sm font-medium">
                              {getFieldLabel(field.fieldName)}
                            </TableCell>
                            <TableCell className="min-w-0 max-w-md">
                              <div className="flex items-center gap-2 text-sm min-w-0">
                                <span className="text-muted-foreground line-through decoration-muted-foreground/40 truncate basis-1/2 min-w-0">
                                  {formatTrackingValue(
                                    field.planValue,
                                    field.dataType,
                                  )}
                                </span>
                                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span
                                  className={`font-semibold tabular-nums truncate basis-1/2 min-w-0 ${actualToneClass(field.variance)}`}
                                  title={String(
                                    formatTrackingValue(
                                      field.actualValue,
                                      field.dataType,
                                    ),
                                  )}
                                >
                                  {formatTrackingValue(
                                    field.actualValue,
                                    field.dataType,
                                  )}
                                </span>
                              </div>
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
