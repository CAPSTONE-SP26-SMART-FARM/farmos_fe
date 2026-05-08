// src/pages/OwnerPage/CropSeasons/components/UnplannedTable.tsx
import { useMemo } from "react";
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
import { useOwnerListFarmMembers } from "@/queries/useOwner";
import type { TrackingDiffResType } from "@/schemaValidatation/tracking";

type UnplannedSection = TrackingDiffResType["unplanned"][number];

interface UnplannedTableProps {
  unplanned: UnplannedSection[];
}

const USER_REF_FIELDS = new Set([
  "assignedTo",
  "assignedBy",
  "createdBy",
  "updatedBy",
  "approvedBy",
  "completedBy",
]);

export default function UnplannedTable({ unplanned }: UnplannedTableProps) {
  const total = unplanned.reduce((sum, s) => sum + s.entities.length, 0);

  const { data: membersData } = useOwnerListFarmMembers({
    page: 1,
    limit: 100,
  });

  const userNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of membersData?.data?.data ?? []) {
      const name = m.user?.fullName ?? m.user?.email ?? null;
      if (m.userId && name) map.set(m.userId, name);
    }
    return map;
  }, [membersData]);

  const renderFieldValue = (
    section: UnplannedSection,
    f: UnplannedSection["entities"][number]["fields"][number],
  ) => {
    if (
      USER_REF_FIELDS.has(f.fieldName) &&
      typeof f.actualValue === "string" &&
      userNameById.has(f.actualValue)
    ) {
      return userNameById.get(f.actualValue)!;
    }
    return formatTrackingValue(f.actualValue, f.dataType, {
      entityType: section.entityType,
      fieldName: f.fieldName,
    });
  };

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
                <TableHead className="w-56">Thực thể</TableHead>
                <TableHead className="w-44">Ngày tạo</TableHead>
                <TableHead>Chi tiết phát sinh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {unplanned.flatMap((section) =>
                section.entities.map((entity, entityIndex) => (
                  <TableRow
                    key={entity.entityId}
                    className="hover:bg-muted/30 align-top"
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge
                          variant="outline"
                          className="bg-amber-50 text-amber-800 border-amber-200 text-xs w-fit"
                        >
                          {getEntityTypeLabel(section.entityType)}
                        </Badge>
                        <p className="text-sm font-medium">
                          {getEntityTypeLabel(section.entityType)} #
                          {entityIndex + 1}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground tabular-nums">
                      {entity.createdAt
                        ? format(parseISO(entity.createdAt), "dd/MM/yyyy HH:mm")
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                        {entity.fields.map((f) => (
                          <div
                            key={f.fieldName}
                            className="text-xs flex items-baseline gap-1.5 min-w-0"
                          >
                            <span className="text-muted-foreground shrink-0">
                              {getFieldLabel(f.fieldName)}:
                            </span>
                            <span className="font-medium truncate">
                              {renderFieldValue(section, f)}
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
