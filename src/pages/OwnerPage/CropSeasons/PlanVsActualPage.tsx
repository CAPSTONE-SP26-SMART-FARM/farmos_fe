// src/pages/OwnerPage/CropSeasons/PlanVsActualPage.tsx
import { useEffect, useMemo, useState } from "react";
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
  type To,
} from "react-router";
import { ArrowLeft, GitCompareArrows, RefreshCw, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ErrorState from "@/components/common/ErrorState";
import ProPagination from "@/components/common/pro-pagination";
import useDebounce from "@/hooks/useDebounce";
import { useTrackingDiff } from "@/queries/useTracking";
import {
  useManagerListProductionMilestones,
  useOwnerListProductionMilestones,
} from "@/queries/useProductionMilestone";
import MilestoneTrackingTable from "./components/MilestoneTrackingTable";
import MilestoneChangesDialog from "./components/MilestoneChangesDialog";

const PAGE_LIMIT = 10;

function PlanVsActualPage() {
  const { id: cropSeasonId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  // BE tracking + milestone endpoints accept cả owner lẫn manager. Trang dùng
  // chung cho 2 role — detect prefix URL để chọn hook và đường quay lại.
  const isManagerRoute = location.pathname.startsWith("/dashboard/manager/");
  const fallbackListPath = isManagerRoute
    ? "/dashboard/manager/crop-seasons"
    : "/dashboard/owner/crop-seasons";

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const q = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(q);
  const debouncedSearch = useDebounce(searchInput, 400);

  // Đồng bộ ô tìm kiếm (debounce) vào URL, reset về trang 1 khi từ khóa đổi.
  useEffect(() => {
    if (debouncedSearch === q) return;
    const next = new URLSearchParams(searchParams);
    if (debouncedSearch.trim()) next.set("q", debouncedSearch.trim());
    else next.delete("q");
    next.set("page", "1");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useMemo(
    () => ({ page, limit: PAGE_LIMIT, ...(q && { search: q }) }),
    [page, q],
  );

  // Gọi cả 2 hook nhưng hook không khớp role bị disable (cropSeasonId rỗng).
  const ownerQuery = useOwnerListProductionMilestones(
    isManagerRoute ? "" : (cropSeasonId ?? ""),
    query,
  );
  const managerQuery = useManagerListProductionMilestones(
    isManagerRoute ? (cropSeasonId ?? "") : "",
    query,
  );
  const listQuery = isManagerRoute ? managerQuery : ownerQuery;

  // Tên mùa vụ cho tiêu đề — best-effort, không chặn trang nếu chưa có.
  const { data: diffData } = useTrackingDiff(cropSeasonId ?? "");
  const cropName = diffData?.data?.cropSeason.cropName ?? "Mùa vụ";

  const [selected, setSelected] = useState<{ id: string; label: string } | null>(
    null,
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  const milestones = useMemo(
    () => listQuery.data?.data.data ?? [],
    [listQuery.data],
  );
  const meta = listQuery.data?.data.meta;

  const handleBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(fallbackListPath);
  };

  const handleView = (m: { id: string; label: string }) => {
    setSelected(m);
    setDialogOpen(true);
  };

  const buildHref = (p: number | null | undefined): To => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(p ?? 1));
    return { search: next.toString() };
  };

  if (listQuery.isError) {
    return (
      <ErrorState
        message="Không thể tải danh sách giai đoạn."
        onRetry={() => listQuery.refetch()}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────── */}
      <div>
        <Breadcrumb className="mb-2">
          <BreadcrumbList>
            <BreadcrumbItem>
              <span className="text-muted-foreground">Mùa vụ</span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <span className="max-w-50 truncate font-medium text-muted-foreground">
                {cropName}
              </span>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Kế hoạch vs Thực tế</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="mb-3 flex items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="-ml-2 gap-1 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại chi tiết mùa vụ
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 border-emerald-300 bg-emerald-50 text-emerald-700 shadow-sm hover:border-emerald-400 hover:bg-emerald-100 hover:text-emerald-800"
            onClick={() => listQuery.refetch()}
            disabled={listQuery.isFetching}
            aria-label="Làm mới"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${listQuery.isFetching ? "animate-spin" : ""}`}
            />
            <span className="text-xs font-semibold">Làm mới</span>
          </Button>
        </div>

        <div className="min-w-0">
          <Badge variant="secondary" className="mb-2 gap-1">
            <GitCompareArrows className="h-3 w-3" />
            Kế hoạch vs Thực tế
          </Badge>
          <h1 className="truncate text-2xl font-bold">{cropName}</h1>
          <p className="text-sm text-muted-foreground">
            Chọn một giai đoạn để xem các thay đổi của giai đoạn và công việc bên
            trong.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Các giai đoạn sản xuất</CardTitle>
          <CardDescription>
            Danh sách giai đoạn của mùa vụ. Nhấn “Xem chi tiết” để xem lịch sử
            thay đổi.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="h-9 pl-8"
              placeholder="Tìm theo tên giai đoạn..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <MilestoneTrackingTable
            milestones={milestones}
            isLoading={listQuery.isLoading}
            isFetching={listQuery.isFetching}
            onView={handleView}
          />

          {meta && meta.totalPages > 1 ? (
            <ProPagination
              currentPage={page}
              totalPages={meta.totalPages}
              buildHref={buildHref}
            />
          ) : null}
        </CardContent>
      </Card>

      {cropSeasonId ? (
        <MilestoneChangesDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          cropSeasonId={cropSeasonId}
          milestone={selected}
        />
      ) : null}
    </div>
  );
}

export default PlanVsActualPage;
