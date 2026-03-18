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
import { useOwnerListCropSeasons } from "@/queries/useCropSeason";
import type {
  CropSeasonType,
  ProductionStatusNameType,
} from "@/types/cropSeason";
import { ArrowLeft, ChevronRight, Layers } from "lucide-react";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Props {
  zoneId: string;
  zoneName: string;
  onBack: () => void;
  onViewDetail: (cropSeasonId: string) => void;
}

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

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return d;
  }
}

const TableSkeleton = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <Skeleton
        key={i}
        className="h-12 w-full"
      />
    ))}
  </div>
);

export default function CropSeasonListPanel({
  zoneId,
  zoneName,
  onBack,
  onViewDetail,
}: Props) {
  const [show, setShow] = useState(false);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<
    ProductionStatusNameType | ""
  >("");

  const { data, isLoading } = useOwnerListCropSeasons(zoneId, {
    page,
    limit: 10,
    status: statusFilter || undefined,
  });

  const seasons = data?.data.data ?? [];
  const meta = data?.data.meta;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    setShow(false);
    setTimeout(onBack, 300);
  };

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
          Danh sách zone
        </Button>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-2">Owner Portal</Badge>
            <h1 className="text-2xl font-bold">Mùa vụ — {zoneName}</h1>
            <p className="text-muted-foreground">
              Tất cả mùa vụ được tạo trong zone này.
            </p>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách mùa vụ</CardTitle>
          <CardDescription>
            {meta ? `${meta.totalItems} mùa vụ` : "Đang tải…"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter || "all"}
              onValueChange={(v) => {
                setStatusFilter(
                  v === "all" ? "" : (v as ProductionStatusNameType),
                );
                setPage(1);
              }}
            >
              <SelectTrigger className="w-50">
                <SelectValue placeholder="Lọc trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                {Object.entries(STATUS_MAP).map(([val, { label }]) => (
                  <SelectItem
                    key={val}
                    value={val}
                  >
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <TableSkeleton />
          ) : seasons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Layers className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Không có mùa vụ nào{statusFilter ? " với trạng thái này" : ""}.
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cây trồng</TableHead>
                      <TableHead>Giống</TableHead>
                      <TableHead>Ngày trồng</TableHead>
                      <TableHead>Thu hoạch dự kiến</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Chi tiết</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {seasons.map((season: CropSeasonType) => (
                      <TableRow
                        key={season.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => onViewDetail(season.id)}
                      >
                        <TableCell className="font-medium">
                          {season.cropName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {season.variety ?? "—"}
                        </TableCell>
                        <TableCell>{formatDate(season.plantDate)}</TableCell>
                        <TableCell>
                          {formatDate(season.expectedHarvestDate)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={season.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetail(season.id);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
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
    </div>
  );
}
