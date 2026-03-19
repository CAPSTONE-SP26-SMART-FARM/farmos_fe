import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useOwnerCropSeasonDetail,
  useOwnerListRequests,
} from "@/queries/useCropSeason";
import type { ProductionRequestType } from "@/types/cropSeason";
import {
  ArrowLeft,
  Calendar,
  ClipboardList,
  Eye,
  Layers,
  MoreVertical,
  Ruler,
  Sprout,
} from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Props {
  cropSeasonId: string;
  zoneName: string;
  onBack: () => void;
  onViewRequest: (requestId: string) => void;
}

const SEASON_STATUS_MAP: Record<
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

const REQUEST_STATUS_MAP: Record<
  string,
  { label: string; variant: "default" | "secondary" | "destructive" }
> = {
  pending: { label: "Chờ duyệt", variant: "secondary" },
  approved: { label: "Đã duyệt", variant: "default" },
  rejected: { label: "Từ chối", variant: "destructive" },
};

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
          <Skeleton
            key={i}
            className="h-16 w-full"
          />
        ))}
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            className="h-12 w-full"
          />
        ))}
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
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    "pending" | "approved" | "rejected" | ""
  >("");

  const detailQuery = useOwnerCropSeasonDetail(cropSeasonId);
  const requestsQuery = useOwnerListRequests(cropSeasonId, {
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  const season = detailQuery.data?.data;
  const requests = requestsQuery.data?.data.data ?? [];
  const meta = requestsQuery.data?.data.meta;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

  const seasonStatus = season
    ? (SEASON_STATUS_MAP[season.status] ?? {
        label: season.status,
        variant: "secondary" as const,
      })
    : null;

  return (
    <div
      className={`space-y-6 transition-all duration-300 ease-out ${
        show ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      <div>
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
              Zone: <span className="font-medium">{zoneName}</span>
            </p>
          </div>
          {seasonStatus && (
            <Badge
              variant={seasonStatus.variant}
              className="text-sm h-fit"
            >
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
            <p className="text-sm text-muted-foreground">
              Không tìm thấy mùa vụ.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={handleBack}
            >
              Quay lại
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Crop Season Info ─────────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Sprout className="h-4 w-4" />
                Thông tin mùa vụ
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <InfoCell
                  icon={<Calendar className="h-3 w-3" />}
                  label="Ngày trồng"
                  value={formatDate(season.plantDate)}
                />
                <InfoCell
                  icon={<Calendar className="h-3 w-3" />}
                  label="Thu hoạch dự kiến"
                  value={formatDate(season.expectedHarvestDate)}
                />
                <InfoCell
                  icon={<Calendar className="h-3 w-3" />}
                  label="Thu hoạch thực tế"
                  value={formatDate(season.actualHarvestDate)}
                />
                <InfoCell
                  icon={<Ruler className="h-3 w-3" />}
                  label="Diện tích (m²)"
                  value={
                    season.totalAreaSqm != null
                      ? `${season.totalAreaSqm} m²`
                      : "—"
                  }
                />
                <InfoCell
                  icon={<Layers className="h-3 w-3" />}
                  label="Số lượng cây"
                  value={season.plantCount ?? "—"}
                />
                <InfoCell
                  label="Cập nhật lần cuối"
                  value={formatDate(season.updatedAt)}
                />
              </div>

              {season.notes && (
                <>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Ghi chú</p>
                    <p className="text-sm whitespace-pre-wrap">
                      {season.notes}
                    </p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ── Production Requests (#56 / #57) ──────────────── */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <ClipboardList className="h-4 w-4" />
                    Yêu cầu phê duyệt sản xuất
                  </CardTitle>
                  <CardDescription>
                    {meta
                      ? `${meta.totalItems} yêu cầu`
                      : "Danh sách yêu cầu từ Manager"}
                  </CardDescription>
                </div>
                <Select
                  value={statusFilter || "all"}
                  onValueChange={(v) => {
                    setStatusFilter(
                      v === "all"
                        ? ""
                        : (v as "pending" | "approved" | "rejected"),
                    );
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Lọc trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="pending">Chờ duyệt</SelectItem>
                    <SelectItem value="approved">Đã duyệt</SelectItem>
                    <SelectItem value="rejected">Từ chối</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {requestsQuery.isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton
                      key={i}
                      className="h-12 w-full"
                    />
                  ))}
                </div>
              ) : requests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <ClipboardList className="h-7 w-7 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Không có yêu cầu nào
                    {statusFilter ? " với trạng thái này" : ""}.
                  </p>
                </div>
              ) : (
                <>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ngày gửi</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead>Ngày phản hồi</TableHead>
                          <TableHead className="max-w-50">Mô tả</TableHead>
                          <TableHead className="w-12.5"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {requests.map((req: ProductionRequestType) => {
                          const rs = REQUEST_STATUS_MAP[req.status] ?? {
                            label: req.status,
                            variant: "secondary" as const,
                          };
                          return (
                            <TableRow
                              key={req.id}
                              className="hover:bg-muted/50 cursor-pointer"
                              onClick={() => onViewRequest(req.id)}
                            >
                              <TableCell className="text-sm">
                                {formatDate(req.sentAt)}
                              </TableCell>
                              <TableCell>
                                <Badge variant={rs.variant}>{rs.label}</Badge>
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatDate(req.repliedAt)}
                              </TableCell>
                              <TableCell className="text-sm max-w-50 truncate text-muted-foreground">
                                {req.description ?? "—"}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreVertical className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => onViewRequest(req.id)}
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      Xem chi tiết
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {meta && meta.totalPages > 1 && (
                    <div className="flex justify-center items-center gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!meta.hasPreviousPage}
                        onClick={() => setPage((p) => p - 1)}
                      >
                        Trước
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {meta.page} / {meta.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!meta.hasNextPage}
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Sau
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
