// src/pages/OwnerPage/CropSeasons/components/DiffTable.tsx
import { format, parseISO } from "date-fns";
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
import { ChevronDown, History, Inbox } from "lucide-react";
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
type TrackedEntity = TrackedSection["entities"][number];
type DiffField = TrackedEntity["fields"][number];

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

// "Changed" = có variance type khác "none" VÀ direction không phải on-time/equal.
// VarianceBadge cũng coi on-time/equal là "Đúng kế hoạch" → ở đây phải align.
function isChanged(variance: VarianceType): boolean {
  if (!variance || variance.type === "none") return false;
  const dir = variance.direction;
  if (dir === "on-time" || dir === "equal") return false;
  return true;
}

// Màu khớp VarianceBadge: late/higher = đỏ (xấu), early/lower = xanh (tốt),
// còn lại (label/changed không direction) = xanh dương trung tính.
function rowAccentClass(variance: VarianceType): string {
  const dir = variance?.direction;
  if (dir === "late" || dir === "higher")
    return "border-l-red-400 bg-red-50/30";
  if (dir === "early" || dir === "lower")
    return "border-l-emerald-400 bg-emerald-50/30";
  if (isChanged(variance)) return "border-l-sky-400 bg-sky-50/30";
  return "border-l-transparent";
}

function actualToneClass(variance: VarianceType): string {
  const dir = variance?.direction;
  if (dir === "late" || dir === "higher") return "text-red-700";
  if (dir === "early" || dir === "lower") return "text-emerald-700";
  if (isChanged(variance)) return "text-sky-700";
  return "text-foreground";
}

function formatLastChanged(iso: string): string {
  try {
    return format(parseISO(iso), "dd/MM/yyyy HH:mm");
  } catch {
    return iso;
  }
}

function FieldRow({
  field,
  planValue,
  actualValue,
  entityType,
  onOpenHistory,
}: {
  field: DiffField;
  planValue: unknown;
  actualValue: unknown;
  entityType: TrackingEntityType;
  onOpenHistory: () => void;
}) {
  const changed = isChanged(field.variance);
  const planStr = formatTrackingValue(planValue, field.dataType, {
    entityType,
    fieldName: field.fieldName,
  });
  const actualStr = formatTrackingValue(actualValue, field.dataType, {
    entityType,
    fieldName: field.fieldName,
  });
  const sameAsPlan = !changed && planStr === actualStr;

  return (
    <TableRow
      className={`cursor-pointer hover:bg-muted/40 align-top border-l-2 ${rowAccentClass(field.variance)}`}
      onClick={onOpenHistory}
    >
      <TableCell className="text-sm font-medium whitespace-normal wrap-anywhere">
        <div>{getFieldLabel(field.fieldName)}</div>
        {field.changeCount > 0 ? (
          <div className="text-[10px] text-muted-foreground mt-1">
            Đã đổi {field.changeCount} lần
            {field.lastChangedAt
              ? ` · ${formatLastChanged(field.lastChangedAt)}`
              : ""}
          </div>
        ) : null}
      </TableCell>
      <TableCell className="text-sm text-muted-foreground whitespace-normal wrap-anywhere">
        {planStr}
      </TableCell>
      <TableCell
        className={`text-sm whitespace-normal wrap-anywhere ${
          changed ? `font-semibold ${actualToneClass(field.variance)}` : ""
        }`}
      >
        {sameAsPlan ? (
          <span className="text-xs italic text-muted-foreground">
            Giống kế hoạch
          </span>
        ) : (
          actualStr
        )}
      </TableCell>
      <TableCell>
        <VarianceBadge
          variance={field.variance}
          dataType={field.dataType}
        />
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Xem lịch sử thay đổi"
          onClick={(e) => {
            e.stopPropagation();
            onOpenHistory();
          }}
        >
          <History className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function EntityCard({
  entity,
  entityType,
  onOpenHistory,
}: {
  entity: TrackedEntity;
  entityType: TrackingEntityType;
  onOpenHistory: (target: FieldHistoryTarget) => void;
}) {
  const entityTitle =
    entity.label?.trim() ||
    `${getEntityTypeLabel(entityType)} ${entity.entityId.slice(0, 8)}`;

  // Split fields into changed (variance.type !== "none") and unchanged.
  // Show changed first (sorted late > early > other), collapse unchanged
  // behind a toggle so user focuses on real diffs.
  const { changed, unchanged } = useMemo(() => {
    const c: DiffField[] = [];
    const u: DiffField[] = [];
    for (const f of entity.fields) {
      if (isChanged(f.variance)) c.push(f);
      else u.push(f);
    }
    const dirRank = (v: VarianceType): number => {
      const d = v?.direction;
      if (d === "late" || d === "higher") return 0;
      if (d === "early" || d === "lower") return 1;
      return 2;
    };
    c.sort((a, b) => dirRank(a.variance) - dirRank(b.variance));
    return { changed: c, unchanged: u };
  }, [entity.fields]);

  const [showUnchanged, setShowUnchanged] = useState(false);

  const openHistoryFor = (field: DiffField) =>
    onOpenHistory({
      entityType,
      entityId: entity.entityId,
      fieldName: field.fieldName,
      dataType: field.dataType,
    });

  return (
    <div className="rounded-md border bg-background overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b bg-muted/30 px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-semibold truncate">{entityTitle}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {changed.length > 0 ? (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200 text-[10px]"
            >
              {changed.length} thay đổi
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px]"
            >
              Đúng kế hoạch
            </Badge>
          )}
        </div>
      </div>
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow className="bg-muted/10">
            <TableHead className="w-[24%]">Trường</TableHead>
            <TableHead className="w-[28%]">Kế hoạch</TableHead>
            <TableHead className="w-[28%]">Thực tế</TableHead>
            <TableHead className="w-[14%]">Sai số</TableHead>
            <TableHead className="w-[6%]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {changed.map((field) => (
            <FieldRow
              key={`${entity.entityId}-${field.fieldName}`}
              field={field}
              planValue={entity.plan[field.fieldName]}
              actualValue={entity.actual[field.fieldName]}
              entityType={entityType}
              onOpenHistory={() => openHistoryFor(field)}
            />
          ))}

          {changed.length === 0 && unchanged.length > 0 && !showUnchanged ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="py-6 text-center text-xs text-muted-foreground"
              >
                Tất cả {unchanged.length} trường đều đúng kế hoạch.
              </TableCell>
            </TableRow>
          ) : null}

          {showUnchanged
            ? unchanged.map((field) => (
                <FieldRow
                  key={`${entity.entityId}-${field.fieldName}`}
                  field={field}
                  planValue={entity.plan[field.fieldName]}
                  actualValue={entity.actual[field.fieldName]}
                  entityType={entityType}
                  onOpenHistory={() => openHistoryFor(field)}
                />
              ))
            : null}
        </TableBody>
      </Table>
      {unchanged.length > 0 ? (
        <div className="border-t bg-muted/10 px-2 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-full justify-center gap-1.5 text-xs text-muted-foreground"
            onClick={() => setShowUnchanged((v) => !v)}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform ${
                showUnchanged ? "rotate-180" : ""
              }`}
            />
            {showUnchanged
              ? `Ẩn ${unchanged.length} trường không đổi`
              : `Hiện ${unchanged.length} trường không đổi`}
          </Button>
        </div>
      ) : null}
    </div>
  );
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
          const totalChanged = section.entities.reduce(
            (sum, e) =>
              sum + e.fields.filter((f) => isChanged(f.variance)).length,
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
                    {section.entities.length}
                  </Badge>
                  {totalChanged > 0 ? (
                    <Badge
                      variant="outline"
                      className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-normal"
                    >
                      {totalChanged} thay đổi
                    </Badge>
                  ) : null}
                </span>
              </AccordionTrigger>
              <AccordionContent className="pt-1 pb-3">
                <div className="space-y-3">
                  {section.entities.map((entity) => (
                    <EntityCard
                      key={entity.entityId}
                      entity={entity}
                      entityType={section.entityType}
                      onOpenHistory={setHistoryTarget}
                    />
                  ))}
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
