import IotQuotaWidget from "@/components/common/IotQuotaWidget";
import LoadingCard from "@/components/common/LoadingCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useOwnerIotKitDetail } from "@/queries/useIotKit";
import { formatCurrencyVnd, formatDateVi } from "@/lib/format";
import {
  BOARD_TYPE_LABEL_VI,
  KIT_MODULE_LABEL_VI,
  SENSOR_TYPE_LABEL_VI,
} from "@/schemaValidatation/iotKit";
import { ArrowLeft, Boxes, Cpu, Sprout } from "lucide-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import IotKitPurchaseDialog from "./components/IotKitPurchaseDialog";

export default function OwnerIotKitDetailPage() {
  const { kitId } = useParams<{ kitId: string }>();
  const navigate = useNavigate();
  const [purchaseOpen, setPurchaseOpen] = useState(false);

  const detailQuery = useOwnerIotKitDetail(kitId ?? "", !!kitId);
  const kit = detailQuery.data?.data;

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <LoadingCard rows={6} />
      </div>
    );
  }

  if (!kit) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <h3 className="text-lg font-semibold">Không tìm thấy bộ Kit</h3>
            <p className="text-sm text-muted-foreground">
              Bộ Kit không tồn tại hoặc đã ngừng bán.
            </p>
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard/owner/iot-kits")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại marketplace
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sensors = kit.includedSensors ?? [];
  const modules = kit.includedModules ?? [];
  const coverageM2 = kit.deviceCount * 4;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/owner/iot-kits")}
          className="mb-3 -ml-2 gap-1 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Quay lại marketplace
        </Button>
        <div className="space-y-2">
          <Badge className="mb-2">Chủ trang trại</Badge>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
            {kit.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            {kit.description ??
              "Bộ Kit IoT cho phép mở rộng hạn mức thiết bị của bạn."}
          </p>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Thông số bộ Kit</CardTitle>
            <CardDescription>
              Mỗi board chính phủ ~4 m² và đi kèm cảm biến tiêu chuẩn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Mã bộ Kit
                </p>
                <p className="font-mono">{kit.code}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Loại board
                </p>
                <p>{BOARD_TYPE_LABEL_VI[kit.boardType] ?? kit.boardType}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Số bộ trong 1 SKU
                </p>
                <p>{kit.deviceCount} bộ board chính</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Phủ diện tích
                </p>
                <p>~{coverageM2} m²</p>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Boxes className="h-4 w-4" aria-hidden /> Module truyền dẫn
              </p>
              <div className="flex flex-wrap gap-2">
                {modules.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  modules.map((m) => (
                    <Badge key={m} variant="outline">
                      {KIT_MODULE_LABEL_VI[m] ?? m}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <div className="space-y-2">
              <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                <Sprout className="h-4 w-4" aria-hidden /> Cảm biến
              </p>
              <div className="flex flex-wrap gap-2">
                {sensors.length === 0 ? (
                  <span className="text-muted-foreground">—</span>
                ) : (
                  sensors.map((s) => (
                    <Badge key={s} variant="outline">
                      {SENSOR_TYPE_LABEL_VI[s] ?? s}
                    </Badge>
                  ))
                )}
              </div>
            </div>
            <Separator />
            <p className="text-xs text-muted-foreground">
              Cập nhật gần nhất: {formatDateVi(kit.updatedAt)}
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Tóm tắt giá
              </CardTitle>
              <CardDescription>
                Thanh toán 1 lần qua PayOS. Đồng pha hạn với gói đăng ký hiện
                tại.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">
                  {formatCurrencyVnd(kit.price)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Cho {kit.deviceCount} bộ board chính
                </p>
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={() => setPurchaseOpen(true)}
              >
                Mua ngay
              </Button>
              <p className="text-xs text-muted-foreground">
                Sau khi thanh toán thành công, đội vận hành sẽ gán thiết bị
                trong vòng 24h.
              </p>
            </CardContent>
          </Card>
          <IotQuotaWidget />
        </div>
      </div>

      <IotKitPurchaseDialog
        kit={kit}
        open={purchaseOpen}
        onOpenChange={setPurchaseOpen}
      />
    </div>
  );
}
