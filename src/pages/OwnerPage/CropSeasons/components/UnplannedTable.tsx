// src/pages/OwnerPage/CropSeasons/components/UnplannedTable.tsx
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/common/DataTable";
import type { ColumnDef } from "@tanstack/react-table";
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
type UnplannedEntity = UnplannedSection["entities"][number];

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

type FlattenedEntityRow = {
  key: string;
  entity: UnplannedEntity;
  entityType: UnplannedSection["entityType"];
  entityIndex: number;
};

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
    entityType: UnplannedSection["entityType"],
    f: UnplannedEntity["fields"][number],
  ) => {
    if (
      USER_REF_FIELDS.has(f.fieldName) &&
      typeof f.actualValue === "string" &&
      userNameById.has(f.actualValue)
    ) {
      return userNameById.get(f.actualValue)!;
    }
    return formatTrackingValue(f.actualValue, f.dataType, {
      entityType,
      fieldName: f.fieldName,
    });
  };

  const flattened: FlattenedEntityRow[] = useMemo(
    () =>
      unplanned.flatMap((section) =>
        section.entities.map((entity, entityIndex) => ({
          key: entity.entityId,
          entity,
          entityType: section.entityType,
          entityIndex,
        })),
      ),
    [unplanned],
  );

  const columns = useMemo<ColumnDef<FlattenedEntityRow>[]>(
    () => [
      {
        id: "entityType",
        header: "Thực thể",
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-800 border-amber-200 text-xs w-fit"
            >
              {getEntityTypeLabel(row.original.entityType)}
            </Badge>
            <p className="text-sm font-medium">
              {getEntityTypeLabel(row.original.entityType)} #
              {row.original.entityIndex + 1}
            </p>
          </div>
        ),
      },
      {
        id: "createdAt",
        header: "Ngày tạo",
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground tabular-nums">
            {row.original.entity.createdAt
              ? format(parseISO(row.original.entity.createdAt), "dd/MM/yyyy HH:mm")
              : "—"}
          </span>
        ),
      },
      {
        id: "fields",
        header: "Chi tiết phát sinh",
        cell: ({ row }) => (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {row.original.entity.fields.map((f) => (
              <div
                key={f.fieldName}
                className="text-xs flex items-baseline gap-1.5 min-w-0"
              >
                <span className="text-muted-foreground shrink-0">
                  {getFieldLabel(f.fieldName)}:
                </span>
                <span className="font-medium truncate">
                  {renderFieldValue(row.original.entityType, f)}
                </span>
              </div>
            ))}
          </div>
        ),
      },
    ],
    // renderFieldValue depends on userNameById; keep deps narrow
    [userNameById],
  );

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
          <DataTable
            columns={columns}
            data={flattened}
            emptyText="Không có dữ liệu phát sinh."
          />
        </div>
      </CardContent>
    </Card>
  );
}
