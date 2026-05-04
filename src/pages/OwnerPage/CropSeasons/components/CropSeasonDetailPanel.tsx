import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOwnerCropSeasonDetail } from "@/queries/useCropSeason";
import {
  Calendar,
  ClipboardList,
  Layers,
  Milestone,
  SlidersHorizontal,
  Sprout,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { format } from "date-fns";
import { SEASON_STATUS_MAP } from "./productionRequestHelpers";
import { OwnerMilestonesSection } from "./OwnerMilestonesSection";
import { OwnerRequestsSection } from "./OwnerRequestsSection";
import { OwnerTrackingLogTab } from "./OwnerTrackingLogTab";

interface Props {
  cropSeasonId: string;
  zoneName: string;
  onBack: () => void;
  onViewRequest: (requestId: string) => void;
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
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
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
      </CardContent>
    </Card>
  </div>
);

export default function CropSeasonDetailPanel({
  cropSeasonId,
  zoneName,
  onBack,
  onViewRequest,
}: Props) {
  const [show, setShow] = useState(false);

  const detailQuery = useOwnerCropSeasonDetail(cropSeasonId);
  const season = detailQuery.data?.data;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const seasonStatus = season
    ? (SEASON_STATUS_MAP[season.status] ?? { label: season.status, variant: "secondary" as const })
    : null;
  const seasonName = season?.cropName ?? "Mùa vụ";
  const canReportMilestoneIncident =
    season?.status !== "planning" && season?.status !== "sent";

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div>
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <span className="text-muted-foreground">Khu vực</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground font-medium">{zoneName}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">Mùa vụ</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground font-medium">{seasonName}</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Mốc</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Danh sách mùa vụ — {zoneName}
        </Button>
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <Badge className="mb-2">Chi tiết mùa vụ</Badge>
            <h1 className="text-2xl font-bold">
              {season ? (
                season.cropName
              ) : (
                <Skeleton className="h-7 w-40 inline-block" />
              )}
              {season?.variety && (
                <span className="text-muted-foreground font-normal text-lg ml-2">
                  — {season.variety}
                </span>
              )}
            </h1>
            <p className="text-muted-foreground text-sm">
              Khu vực: <span className="font-medium">{zoneName}</span>
            </p>
          </div>
          {seasonStatus && (
            <Badge variant={seasonStatus.variant} className="text-sm h-fit">
              {seasonStatus.label}
            </Badge>
          )}
        </div>
      </div>

      {detailQuery.isLoading ? (
        <DetailSkeleton />
      ) : !season ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Sprout className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Không tìm thấy mùa vụ.</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={handleBack}>
              Quay lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sprout className="h-4 w-4" />
                Thông tin mùa vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoCell icon={<Calendar className="h-3 w-3" />} label="Ngày trồng" value={formatDate(season.plantDate)} />
                <InfoCell icon={<Calendar className="h-3 w-3" />} label="Thu hoạch dự kiến" value={formatDate(season.expectedHarvestDate)} />
                <InfoCell icon={<Calendar className="h-3 w-3" />} label="Thu hoạch thực tế" value={formatDate(season.actualHarvestDate)} />
                <InfoCell icon={<Layers className="h-3 w-3" />} label="Số lượng cây" value={season.plantCount ?? "—"} />
                <InfoCell label="Cập nhật lần cuối" value={formatDate(season.updatedAt)} />
              </div>

              {season.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Ghi chú</p>
                    <p className="text-sm whitespace-pre-wrap">{season.notes}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {season.status !== "planning" && (
            <div className="flex justify-end">
              <Button asChild variant="outline" size="sm">
                <Link to={`/dashboard/owner/crop-seasons/${season.id}/plan-vs-actual`}>
                  Kế hoạch vs Thực tế
                </Link>
              </Button>
            </div>
          )}

          <Tabs defaultValue="milestones">
            <TabsList className="w-full md:w-auto flex-wrap h-auto gap-1">
              <TabsTrigger value="milestones" className="flex items-center gap-1.5">
                <Milestone className="h-3.5 w-3.5" />
                Mốc sản xuất
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                Yêu cầu phê duyệt
              </TabsTrigger>
              <TabsTrigger value="tracking" className="flex items-center gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Nhật ký thay đổi
              </TabsTrigger>
            </TabsList>
            <TabsContent value="milestones" className="mt-4">
              <OwnerMilestonesSection
                cropSeasonId={cropSeasonId}
                canReportMilestoneIncident={canReportMilestoneIncident}
              />
            </TabsContent>
            <TabsContent value="requests" className="mt-4">
              <OwnerRequestsSection
                cropSeasonId={cropSeasonId}
                onViewRequest={onViewRequest}
              />
            </TabsContent>
            <TabsContent value="tracking" className="mt-4">
              <OwnerTrackingLogTab cropSeasonId={cropSeasonId} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
