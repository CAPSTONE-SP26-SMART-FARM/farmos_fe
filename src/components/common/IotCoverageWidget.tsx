import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import KpiCard from "@/components/common/KpiCard";
import EmptyState from "@/components/common/EmptyState";
import {
  CheckCircle2,
  Cpu,
  HelpCircle,
  Info,
  MapPin,
  Package,
  Radio,
  Ruler,
  ShieldCheck,
  ShoppingCart,
  TriangleAlert,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  useCropSeasonIotCoverage,
  useIotCoverage,
} from "@/queries/useIotCoverage";
import { isApiErrorResponse } from "@/lib/utils";
import { getApiErrorMessageVi } from "@/lib/error-message";
import type { IotDeviceKitResType } from "@/schemaValidatation/iotKit";
import { cn } from "@/lib/utils";

// Scope của widget. Truyền 1 trong 2:
//  - `zoneId` → tính theo cả zone (dùng cho trang Farm/Zone, mua kit cho zone)
//  - `cropSeasonId` → tính theo diện tích vùng trồng của crop season
//    (mọi widget nằm dưới ngữ cảnh crop season / milestone)
type IotCoverageWidgetScope =
  | { zoneId: string; cropSeasonId?: undefined }
  | { cropSeasonId: string; zoneId?: undefined };

type IotCoverageWidgetProps = IotCoverageWidgetScope & {
  zoneName?: string;
  // Danh sách kit để render dropdown (đã filter active). Bỏ trống = ẩn picker.
  kitOptions?: IotDeviceKitResType[];
  // Auto-pick kit đầu tiên có coverageSqm khi mount. Mặc định bật khi
  // truyền kitOptions.
  autoPickFirstKit?: boolean;
  className?: string;
  // CTA cập nhật diện tích zone — caller cung cấp khi user có quyền edit.
  onEditZoneArea?: () => void;
  // CTA "Mua thêm bộ Kit" — caller cung cấp khi user có quyền mua (owner).
  // Bấm sẽ nhận kitId hiện đang chọn để điều hướng đến trang chi tiết kit.
  onBuyKit?: (kitId: string) => void;
};

function formatM2(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return n.toLocaleString("vi-VN");
}

export default function IotCoverageWidget({
  zoneId,
  cropSeasonId,
  zoneName,
  kitOptions,
  autoPickFirstKit = true,
  className,
  onEditZoneArea,
  onBuyKit,
}: IotCoverageWidgetProps) {
  const hasPicker = Array.isArray(kitOptions) && kitOptions.length > 0;

  // Chỉ giữ những kit đã được khai báo coverageSqm — kit chưa cấu hình sẽ
  // làm widget trả về `kitCoverageSqm = null` (không tính được "cần thêm
  // bao nhiêu bộ") → ẩn khỏi picker để UX không gây nhầm lẫn.
  const pickableKits = useMemo(
    () =>
      (kitOptions ?? []).filter(
        (k) => k.coverageSqm != null && k.coverageSqm > 0,
      ),
    [kitOptions],
  );

  // `userPickedKitId` lưu lựa chọn chủ động của user. Khi chưa pick (state
  // undefined) và `autoPickFirstKit` bật, derive về kit đầu tiên để tránh
  // setState-in-effect (cascading renders) — auto-pick xảy ra ngay trong
  // render, không cần effect đồng bộ thêm.
  const [userPickedKitId, setUserPickedKitId] = useState<string | undefined>(
    undefined,
  );
  const selectedKitId =
    userPickedKitId ??
    (autoPickFirstKit ? pickableKits[0]?.id : undefined);

  // Mỗi widget instance chỉ chạy 1 trong 2 query nhờ flag `enabled`. Hook còn
  // lại vẫn được gọi để giữ thứ tự hook ổn định giữa các render.
  const zoneQuery = useIotCoverage(
    zoneId ?? null,
    selectedKitId ?? null,
    !!zoneId,
  );
  const cropSeasonQuery = useCropSeasonIotCoverage(
    cropSeasonId ?? null,
    selectedKitId ?? null,
    !!cropSeasonId,
  );
  const query = cropSeasonId ? cropSeasonQuery : zoneQuery;

  // ── Loading ────────────────────────────────────────────────────────────
  if (query.isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="space-y-1.5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full rounded-full" />
          <div className="grid grid-cols-2 gap-3 @sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────
  if (query.isError) {
    const is404 =
      isApiErrorResponse(query.error) && query.error.response?.status === 404;
    const errMsg = getApiErrorMessageVi(
      query.error,
      "Không tải được dữ liệu độ phủ thiết bị.",
    );
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Radio className="h-4 w-4 text-primary" />
            Độ phủ thiết bị IoT
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            icon={is404 ? MapPin : TriangleAlert}
            title={
              is404 ? "Không tìm thấy khu vực" : "Chưa thể tính độ phủ"
            }
            description={errMsg}
            action={
              !is404
                ? {
                    label: "Thử lại",
                    onClick: () => query.refetch(),
                  }
                : undefined
            }
          />
        </CardContent>
      </Card>
    );
  }

  const data = query.data?.data;
  if (!data) return null;

  // Normalize 2 response shape về cùng 1 set field. Zone scope dùng
  // `areaSqm`, crop-season scope dùng `cropSeasonAreaSqm`. `gapSqm` ở
  // crop-season có thể null (khi diện tích chưa khai báo) — coerce về 0 cho
  // phép tính ratio, và dùng status === "unknown" để ẩn UI số liệu.
  const areaSqm =
    "cropSeasonAreaSqm" in data ? data.cropSeasonAreaSqm : data.zoneAreaSqm;
  const {
    kitCoverageSqm,
    requiredKitCount,
    currentActiveCoverage,
    activeDeviceCount,
    status,
  } = data;
  const gapSqm = data.gapSqm ?? 0;

  const selectedKit = pickableKits.find((k) => k.id === selectedKitId);

  // Tỉ lệ phủ — chỉ tính khi đã có diện tích đối chiếu.
  const coverageRatio =
    areaSqm && areaSqm > 0
      ? Math.min(100, (currentActiveCoverage / areaSqm) * 100)
      : 0;

  // Số bộ kit cần bổ sung — ưu tiên giá trị BE trả; fallback tự tính từ
  // gap và kitCoverage khi BE chưa tính được nhưng có đủ dữ liệu.
  const needMoreKits = (() => {
    if (status !== "under_covered") return null;
    if (requiredKitCount != null && kitCoverageSqm != null) {
      // requiredKitCount = ceil(zoneArea / kitCoverage) — tổng cần.
      // Phần "cần thêm" = ceil(gap / kitCoverage).
      return Math.ceil(gapSqm / kitCoverageSqm);
    }
    if (kitCoverageSqm != null && kitCoverageSqm > 0 && gapSqm > 0) {
      return Math.ceil(gapSqm / kitCoverageSqm);
    }
    return null;
  })();

  // Legacy assignment: có thiết bị active nhưng không tính được m² phủ
  // (snapshot null trước khi BE roll out feature).
  const hasLegacyDevices =
    activeDeviceCount > 0 && currentActiveCoverage === 0 && status !== "unknown";

  return (
    <Card className={className}>
      <CardHeader className="space-y-1.5">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className="h-4 w-4 text-primary" />
          Độ phủ thiết bị IoT
          {zoneName && (
            <span className="text-xs font-normal text-muted-foreground">
              · {zoneName}
            </span>
          )}
        </CardTitle>
        <CardDescription className="text-xs leading-relaxed">
          Kiểm tra xem khu vực này đã đủ thiết bị IoT để theo dõi hay chưa.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Kit picker */}
        {hasPicker && (
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              Chọn loại bộ Kit để ước tính số bộ cần thiết
            </p>
            {pickableKits.length === 0 ? (
              <div className="rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                Chưa có loại Kit nào được khai báo diện tích bao phủ. Vui
                lòng liên hệ quản trị viên để cấu hình.
              </div>
            ) : (
              <>
                <Select
                  value={selectedKitId}
                  onValueChange={(v) => setUserPickedKitId(v)}
                >
                  {/* Trigger chỉ hiển thị tên kit; mã + diện tích phủ hiển
                      thị riêng ở description bên dưới để trigger gọn 1 dòng. */}
                  <SelectTrigger className="w-full">
                    {(() => {
                      const picked = pickableKits.find(
                        (k) => k.id === selectedKitId,
                      );
                      return picked ? (
                        <span>{picked.name}</span>
                      ) : (
                        <span className="text-muted-foreground">
                          Chọn bộ Kit
                        </span>
                      );
                    })()}
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="z-60 w-(--radix-select-trigger-width)"
                  >
                    {pickableKits.map((kit) => (
                      <SelectItem key={kit.id} value={kit.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{kit.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {kit.code} · {formatM2(kit.coverageSqm)} m²/bộ
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedKit && (
                  <p className="text-xs text-muted-foreground">
                    Mã: <span className="font-mono">{selectedKit.code}</span>
                    {selectedKit.coverageSqm != null && (
                      <>
                        {" · "}
                        Mỗi bộ phủ{" "}
                        <span className="font-medium text-foreground">
                          {formatM2(selectedKit.coverageSqm)} m²
                        </span>
                      </>
                    )}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Status banner */}
        <StatusBanner
          status={status}
          gapSqm={gapSqm}
          needMoreKits={needMoreKits}
          selectedKitName={selectedKit?.name}
          selectedKitId={selectedKit?.id}
          hasPicker={hasPicker}
          onEditZoneArea={onEditZoneArea}
          onBuyKit={onBuyKit}
        />

        {/* Progress bar (chỉ hiển thị khi zone có khai báo diện tích) */}
        {status !== "unknown" && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                Đã phủ {formatM2(currentActiveCoverage)} m² /{" "}
                {formatM2(areaSqm)} m²
              </span>
              <span className="font-medium">
                {coverageRatio.toFixed(0)}%
              </span>
            </div>
            <Progress
              value={coverageRatio}
              className={cn(
                status === "sufficient" && "[&>div]:bg-emerald-500",
                status === "under_covered" && "[&>div]:bg-amber-500",
              )}
            />
          </div>
        )}

        {/* KPI grid */}
        <div className="@container">
          <div className="grid gap-3 grid-cols-2 @sm:grid-cols-4">
            <KpiCard
              icon={Ruler}
              label="Diện tích khu vực"
              value={areaSqm != null ? `${formatM2(areaSqm)} m²` : "—"}
              hint={
                status === "unknown" ? "Khu vực chưa khai báo" : undefined
              }
            />
            <KpiCard
              icon={ShieldCheck}
              label="Đang được phủ"
              value={`${formatM2(currentActiveCoverage)} m²`}
              tone={status === "sufficient" ? "success" : "default"}
            />
            <KpiCard
              icon={TriangleAlert}
              label="Còn thiếu"
              value={
                status === "unknown"
                  ? "—"
                  : `${formatM2(gapSqm)} m²`
              }
              tone={
                status === "under_covered" && gapSqm > 0
                  ? "warning"
                  : "default"
              }
            />
            <KpiCard
              icon={Cpu}
              label="Thiết bị đang hoạt động"
              value={activeDeviceCount}
              hint={
                hasLegacyDevices
                  ? "Có thiết bị chưa khai báo diện tích phủ"
                  : undefined
              }
            />
          </div>
        </div>

        {/* Legacy note */}
        {hasLegacyDevices && (
          <div className="flex items-start gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              Một số thiết bị đang hoạt động chưa có dữ liệu diện tích phủ
              (do được lắp đặt trước khi tính năng này được bật). Vui lòng
              liên hệ quản trị viên để cập nhật.
            </p>
          </div>
        )}

        {/* Kit chưa cấu hình coverage (truyền kitId nhưng kitCoverageSqm null) */}
        {selectedKitId && kitCoverageSqm == null && (
          <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
            <TriangleAlert className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <p>
              Bộ Kit đã chọn chưa được khai báo diện tích bao phủ. Vui lòng
              liên hệ quản trị viên hoặc chọn bộ Kit khác.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBanner({
  status,
  gapSqm,
  needMoreKits,
  selectedKitName,
  selectedKitId,
  hasPicker,
  onEditZoneArea,
  onBuyKit,
}: {
  status: "sufficient" | "under_covered" | "unknown";
  gapSqm: number;
  needMoreKits: number | null;
  selectedKitName?: string;
  selectedKitId?: string;
  hasPicker: boolean;
  onEditZoneArea?: () => void;
  onBuyKit?: (kitId: string) => void;
}) {
  if (status === "sufficient") {
    return (
      <div className="flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-100">
        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-0.5">
          <p className="font-semibold">Khu vực đã đủ thiết bị IoT</p>
          <p className="text-xs opacity-90">
            Diện tích bao phủ hiện tại đã đáp ứng diện tích khu vực.
          </p>
        </div>
        <Badge variant="outline" className="border-emerald-300 bg-white/60 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-200">
          Đủ phủ
        </Badge>
      </div>
    );
  }

  if (status === "unknown") {
    return (
      <div className="flex items-start gap-3 rounded-md border bg-muted/50 px-3 py-2.5 text-sm">
        <HelpCircle className="h-4 w-4 mt-0.5 shrink-0 text-muted-foreground" />
        <div className="flex-1 space-y-0.5">
          <p className="font-semibold">Chưa thể tính độ phủ</p>
          <p className="text-xs text-muted-foreground">
            Khu vực chưa khai báo diện tích. Hãy cập nhật diện tích trước
            khi tính độ phủ thiết bị IoT.
          </p>
        </div>
        {onEditZoneArea && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={onEditZoneArea}
          >
            Cập nhật diện tích
          </Button>
        )}
      </div>
    );
  }

  // under_covered
  const canBuyMore = !!onBuyKit && !!selectedKitId;
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-100">
      <div className="flex items-start gap-3">
        <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1 space-y-0.5">
          <p className="font-semibold">Khu vực chưa đủ thiết bị IoT</p>
          <p className="text-xs opacity-90">
            {needMoreKits != null && selectedKitName ? (
              <>
                Cần bổ sung thêm{" "}
                <span className="font-semibold">{needMoreKits} bộ</span>{" "}
                <span>"{selectedKitName}"</span> để phủ {formatM2(gapSqm)} m²
                còn thiếu.
              </>
            ) : hasPicker ? (
              <>
                Còn thiếu {formatM2(gapSqm)} m². Chọn loại Kit ở trên để ước
                tính số bộ cần bổ sung.
              </>
            ) : (
              <>
                Còn thiếu {formatM2(gapSqm)} m². Liên hệ Chủ trang trại để
                mua thêm bộ Kit IoT phù hợp.
              </>
            )}
          </p>
        </div>
        <Badge variant="outline" className="border-amber-300 bg-white/60 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 shrink-0">
          {needMoreKits != null ? (
            <>
              <Package className="h-3 w-3 mr-1" />+{needMoreKits} bộ
            </>
          ) : (
            "Thiếu phủ"
          )}
        </Badge>
      </div>
      {canBuyMore && (
        <div className="mt-2.5 flex justify-end border-t border-amber-200/70 pt-2 dark:border-amber-900/40">
          <Button
            type="button"
            size="sm"
            className="h-7 gap-1.5 bg-amber-600 text-white hover:bg-amber-700"
            onClick={() => onBuyKit!(selectedKitId!)}
          >
            <ShoppingCart className="h-3.5 w-3.5" />
            {needMoreKits != null
              ? `Mua thêm ${needMoreKits} bộ`
              : "Mua thêm bộ Kit"}
          </Button>
        </div>
      )}
    </div>
  );
}
