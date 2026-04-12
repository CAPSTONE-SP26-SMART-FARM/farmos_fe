import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useOwnerGetZoneDetail } from "@/queries/useZone";
import type { ZoneType } from "@/schemaValidatation/zone";
import { format } from "date-fns";
import {
  ArrowRight,
  ArrowLeft,
  Calendar,
  FileText,
  Milestone,
  Pencil,
  Ruler,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import ZoneManagersSection from "./ZoneManagersSection";

interface Props {
  zone: ZoneType;
  onBack: () => void;
  onEdit: (zone: ZoneType) => void;
  onAssignManager: (zone: ZoneType) => void;
  onAssignBulk: (zone: ZoneType) => void;
  onExploreCropSeasons: (zone: ZoneType) => void;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm");
  } catch {
    return d;
  }
}

function InfoCell({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-muted/40 rounded-md p-3 space-y-1">
      <p className="text-xs text-muted-foreground flex items-center gap-1">
        {icon}
        {label}
      </p>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );
}

const DetailSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-32" />
    </CardHeader>
    <CardContent className="grid grid-cols-2 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-16 w-full"
        />
      ))}
      <Skeleton className="col-span-2 h-20 w-full" />
    </CardContent>
  </Card>
);

export default function ZoneDetailPanel({
  zone,
  onBack,
  onEdit,
  onAssignManager,
  onAssignBulk,
  onExploreCropSeasons,
}: Props) {
  const [show, setShow] = useState(false);

  const { data, isLoading } = useOwnerGetZoneDetail(zone.id);
  const detail = data?.data ?? zone;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const handleEdit = () => {
    setShow(false);
    setTimeout(() => onEdit(detail), 300);
  };

  const ZoneIcon = <Sprout className="h-5 w-5 text-green-600" />;
  const zoneTypeLabel =
    detail.zoneType === "cultivation" ? "Canh tác" : detail.zoneType;

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleBack}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-2xl font-bold">{detail.name}</h1>
            <Badge className="mb-1 flex items-center m-0">
              Chi tiết khu vực
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => onExploreCropSeasons(detail)}
          >
            <Milestone className="h-4 w-4" />
            Xem mùa vụ
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleEdit}
            className="gap-1.5"
          >
            <Pencil className="h-4 w-4" />
            Sửa khu vực
          </Button>
        </div>
      </div>

      <Separator />

      {isLoading ? (
        <DetailSkeleton />
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-muted p-2">{ZoneIcon}</div>
              <div>
                <CardTitle className="text-lg">{detail.name}</CardTitle>
                <Badge
                  variant="secondary"
                  className="capitalize mt-1"
                >
                  {zoneTypeLabel}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <InfoCell
                icon={<Ruler className="h-3 w-3" />}
                label="Diện tích"
                value={
                  detail.areaSqm != null
                    ? `${detail.areaSqm.toLocaleString()} m²`
                    : "—"
                }
              />
              <InfoCell
                icon={<Calendar className="h-3 w-3" />}
                label="Ngày tạo"
                value={formatDate(detail.createdAt)}
              />
              <InfoCell
                icon={<Calendar className="h-3 w-3" />}
                label="Cập nhật cuối"
                value={formatDate(detail.updatedAt)}
              />
              <InfoCell
                icon={<Sprout className="h-3 w-3" />}
                label="Loại khu vực"
                value={<span className="capitalize">{zoneTypeLabel}</span>}
              />
            </div>

            {detail.description && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    Mô tả
                  </p>
                  <p className="text-sm leading-relaxed">
                    {detail.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Zone Managers Section */}
      <Separator />
      <ZoneManagersSection
        zoneId={detail.id}
        onAssignSingle={() => onAssignManager(detail)}
        onAssignBulk={() => onAssignBulk(detail)}
      />
    </div>
  );
}
