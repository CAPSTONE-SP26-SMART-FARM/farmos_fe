import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useManagerListCropSeasons } from "@/queries/useCropSeason";
import { useManagerListAssignedZones } from "@/queries/useZone";
import { useNavigate, useSearchParams } from "react-router";
import { Milestone } from "lucide-react";
import { format } from "date-fns";
import ProPagination from "@/components/common/pro-pagination";
import type { CropSeasonType } from "@/types/cropSeason";

// ── Helpers ───────────────────────────────────────────────────────────────

const STATUS_MAP: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  planning: { label: "Lên kế hoạch", variant: "secondary" },
  sent: { label: "Đã gửi", variant: "default" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Bị từ chối", variant: "destructive" },
  active: { label: "Đang hoạt động", variant: "default" },
  completed: { label: "Hoàn thành", variant: "outline" },
  cancelled: { label: "Đã hủy", variant: "destructive" },
};

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? {
    label: status,
    variant: "secondary" as const,
  };
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

function formatDate(d?: string | null) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

// ── Field wrapper ─────────────────────────────────────────────────────────

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <p className="text-sm font-medium">{label}</p>
      {children}
    </div>
  );
}

// ── Season row ────────────────────────────────────────────────────────────

function SeasonRow({
  season,
  onMilestones,
}: {
  season: CropSeasonType;
  onMilestones: () => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {season.cropName}
        {season.variety ? (
          <span className="ml-1 text-muted-foreground text-xs">
            ({season.variety})
          </span>
        ) : null}
      </TableCell>
      <TableCell>{formatDate(season.plantDate)}</TableCell>
      <TableCell>{formatDate(season.expectedHarvestDate)}</TableCell>
      <TableCell>
        <StatusBadge status={season.status} />
      </TableCell>
      <TableCell className="text-right">
        <Button
          size="sm"
          variant="outline"
          onClick={onMilestones}
        >
          <Milestone className="h-3 w-3 mr-1" />
          Quản lý mốc
        </Button>
      </TableCell>
    </TableRow>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────

export default function ManagerProductionMilestonesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get("page") ?? "1");
  const zoneId = searchParams.get("zoneId")?.trim() ?? "";

  const assignedZonesQuery = useManagerListAssignedZones({
    page: 1,
    limit: 100,
  });
  const assignedZones = assignedZonesQuery.data?.data.data ?? [];
  const hasAssignedZones = assignedZones.length > 0;
  const selectedZone = assignedZones.find((zone) => zone.id === zoneId);
  const zoneLabel = selectedZone?.name ?? zoneId;

  const { data, isLoading } = useManagerListCropSeasons(zoneId, {
    page,
    limit: 10,
  });

  const seasons = data?.data.data ?? [];
  const totalPages = data?.data.meta.totalPages ?? 0;
  const totalItems = data?.data.meta.totalItems ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <span className="text-muted-foreground">Khu vực</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              {zoneId ? (
                <span className="text-muted-foreground font-medium">
                  {zoneLabel}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  {hasAssignedZones
                    ? "Chưa chọn khu vực"
                    : "Chưa có khu vực được giao"}
                </span>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="text-muted-foreground">Mùa vụ</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Mốc</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Badge className="mb-2">Cổng quản lý</Badge>
        <h1 className="text-2xl font-bold">Quản lý mốc sản xuất</h1>
        <p className="text-muted-foreground">
          Chọn khu vực và mùa vụ để quản lý các mốc sản xuất.
        </p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-2 items-end">
            <Field
              label="Khu vực được giao"
              className="flex-1"
            >
              {assignedZonesQuery.isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : !hasAssignedZones ? (
                <div className="h-10 rounded-md border px-3 text-sm text-muted-foreground flex items-center">
                  Bạn chưa được giao khu vực nào.
                </div>
              ) : (
                <Select
                  value={zoneId || "all"}
                  onValueChange={(value) => {
                    const next = new URLSearchParams(searchParams);
                    if (value === "all") {
                      next.delete("zoneId");
                    } else {
                      next.set("zoneId", value);
                    }
                    next.delete("page");
                    setSearchParams(next);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn khu vực" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Chọn khu vực</SelectItem>
                    {assignedZones.map((zone) => (
                      <SelectItem
                        key={zone.id}
                        value={zone.id}
                      >
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </Field>
            {zoneId && (
              <Button
                variant="ghost"
                className="mb-0.5"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.delete("zoneId");
                  next.delete("page");
                  setSearchParams(next);
                }}
              >
                Xoá
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {!zoneId && (
        <div className="text-center py-16 text-muted-foreground bg-muted/20 rounded-lg border border-dashed">
          <Milestone className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="text-sm">
            {hasAssignedZones
              ? "Chọn khu vực bên trên để xem danh sách mùa vụ."
              : "Bạn chưa được giao khu vực nào."}
          </p>
        </div>
      )}

      {zoneId && (
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-4 space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton
                    key={i}
                    className="h-12 w-full"
                  />
                ))}
              </div>
            ) : seasons.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-10">
                Không có mùa vụ nào trong khu vực này.
              </p>
            ) : (
              <>
                <div className="px-4 py-3 border-b flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {totalItems} mùa vụ
                  </span>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên cây trồng</TableHead>
                      <TableHead>Ngày trồng</TableHead>
                      <TableHead>Thu hoạch dự kiến</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((s) => (
                      <SeasonRow
                        key={s.id}
                        season={s}
                        onMilestones={() => {
                          const next = new URLSearchParams();
                          if (zoneId) {
                            next.set("zoneId", zoneId);
                          }
                          const search = next.toString();
                          navigate({
                            pathname: `/dashboard/manager/crop-seasons/${s.id}/milestones`,
                            search: search ? `?${search}` : "",
                          });
                        }}
                      />
                    ))}
                  </TableBody>
                </Table>
                {totalPages > 1 && (
                  <div className="p-4 flex justify-center border-t">
                    <ProPagination
                      currentPage={page}
                      totalPages={totalPages}
                      buildHref={(p) => {
                        const next = new URLSearchParams();
                        next.set("page", String(p ?? 1));
                        if (zoneId) {
                          next.set("zoneId", zoneId);
                        }
                        return `?${next.toString()}`;
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
