import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FarmResType } from "@/schemaValidatation/farmManagement";
import { Building2 } from "lucide-react";

const FARM_TYPE_LABELS: Record<FarmResType["farmType"], string> = {
  cultivation: "Canh tác",
};

function FarmInfoRow({
  label,
  value,
}: {
  label: string;
  value: string | number | null | undefined;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="font-medium">{value ?? "—"}</div>
    </div>
  );
}

export default function FarmDetailCard({ farm }: { farm: FarmResType }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {farm.name}
            </CardTitle>
            <CardDescription>Mã: {farm.code}</CardDescription>
          </div>
          <Badge>{FARM_TYPE_LABELS[farm.farmType]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FarmInfoRow label="Mã nông trại" value={farm.code} />
          <FarmInfoRow label="Địa chỉ" value={farm.address} />
          <FarmInfoRow label="Diện tích (m²)" value={farm.areaSqm} />
          <FarmInfoRow
            label="Ngày tạo"
            value={new Date(farm.createdAt).toLocaleDateString()}
          />
        </div>
        {farm.description && (
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Mô tả</div>
            <p className="text-sm whitespace-pre-wrap">{farm.description}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
