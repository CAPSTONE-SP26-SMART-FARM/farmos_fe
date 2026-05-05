import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { TrackedSectionType, VarianceType } from "@/schemaValidatation/tracking";
import {
  getFieldLabel,
  getEntityTypeLabel,
  formatTrackingValue,
} from "@/lib/tracking-display";

export function formatVariance(variance: VarianceType | null): string {
  if (!variance || variance.type === "none") return "Không đổi";
  if (variance.type === "days") {
    const days = Math.abs(variance.value as number);
    if (variance.direction === "early") return `${days} ngày sớm`;
    if (variance.direction === "late") return `${days} ngày trễ`;
    if (variance.direction === "on-time") return "Đúng hạn";
    return `${days} ngày`;
  }
  if (variance.type === "percent") return `${variance.value}%`;
  if (variance.type === "absolute") return String(variance.value ?? "—");
  if (variance.type === "label" || variance.type === "changed")
    return variance.direction ?? String(variance.value ?? "—");
  return "—";
}

export function TrackingDiffSection({
  section,
  milestones,
}: {
  section: TrackedSectionType;
  milestones: Array<{ id: string; stageName?: string | null; milestoneOrder?: number }>;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {getEntityTypeLabel(section.entityType)}
      </p>
      {section.entities.map((entity) => {
        const milestone = milestones.find((m) => m.id === entity.entityId);
        const entityLabel = milestone
          ? `#${milestone.milestoneOrder} ${milestone.stageName}`
          : entity.entityId.slice(0, 8) + "…";
        return (
          <div key={entity.entityId} className="space-y-1">
            {section.entityType !== "crop_season" && (
              <p className="text-xs text-muted-foreground pl-1">{entityLabel}</p>
            )}
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-40">Trường</TableHead>
                    <TableHead>Kế hoạch</TableHead>
                    <TableHead>Thực tế</TableHead>
                    <TableHead className="w-32">Chênh lệch</TableHead>
                    <TableHead className="w-20 text-center">Thay đổi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entity.fields.map((field) => (
                    <TableRow key={field.fieldName}>
                      <TableCell className="font-medium text-sm">
                        {getFieldLabel(field.fieldName)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTrackingValue(field.planValue, field.dataType)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatTrackingValue(field.actualValue, field.dataType)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatVariance(field.variance)}
                      </TableCell>
                      <TableCell className="text-sm text-center text-muted-foreground">
                        {field.changeCount}x
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        );
      })}
    </div>
  );
}
