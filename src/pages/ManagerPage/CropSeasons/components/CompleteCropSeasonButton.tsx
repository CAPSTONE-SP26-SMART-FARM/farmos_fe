import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCompleteCropSeason } from "@/queries/useCropSeason";
import { useHarvestRecordsByZone } from "@/queries/useHarvestRecord";
import { useManagerListProductionMilestones } from "@/queries/useProductionMilestone";
import {
  type CropSeasonType,
  ProductionStatusName,
} from "@/types/cropSeason";
import { format } from "date-fns";
import { CheckCircle2, Loader2, Plus, Wheat } from "lucide-react";
import { useMemo, useState } from "react";

export function CompleteCropSeasonButton({
  season,
  onOpenHarvest,
}: {
  season: CropSeasonType;
  // Parent giữ state harvest dialog → gọi callback này khi user bấm
  // "Tạo bản ghi" trong warning dialog.
  onOpenHarvest?: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const { mutateAsync, isPending } = useCompleteCropSeason(season.id);

  const milestonesQuery = useManagerListProductionMilestones(season.id, {
    page: 1,
    limit: 50,
  });
  const milestones = milestonesQuery.data?.data.data ?? [];
  const allMilestonesCompleted =
    milestones.length > 0 &&
    milestones.every((m) => m.status === "completed");

  // Check harvest records của season. BE list theo zone — filter client-side
  // về cropSeasonId (giống pattern trong HarvestRecordTab).
  const harvestQuery = useHarvestRecordsByZone(season.zoneId, {
    page: 1,
    limit: 50,
  });
  const harvestCount = useMemo(() => {
    const all = harvestQuery.data?.data?.data ?? [];
    return all.filter((r) => r.cropSeasonId === season.id).length;
  }, [harvestQuery.data, season.id]);

  if (season.status !== ProductionStatusName.Active) return null;
  if (!allMilestonesCompleted) return null;

  const handleClick = () => {
    // Đợi harvest query xong rồi mới quyết định flow; nếu đang loading,
    // disable nút (xem disabled bên dưới).
    if (harvestCount === 0) {
      setWarningOpen(true);
    } else {
      setConfirmOpen(true);
    }
  };

  const handleConfirm = async () => {
    try {
      await mutateAsync();
      setConfirmOpen(false);
    } catch {
      // toast handled in the mutation hook
    }
  };

  const handleOpenHarvestFromWarning = () => {
    setWarningOpen(false);
    onOpenHarvest?.();
  };

  return (
    <>
      <Button
        size="sm"
        variant="default"
        onClick={handleClick}
        disabled={isPending || harvestQuery.isLoading}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3 w-3 mr-1.5" />
        )}
        Hoàn thành mùa vụ
      </Button>

      <ConfirmDialog
        open={confirmOpen}
        title="Hoàn thành mùa vụ?"
        description={`Ngày thu hoạch thực tế sẽ được ghi nhận là ${format(new Date(), "dd/MM/yyyy")}. Hành động này không thể hoàn tác.`}
        confirmLabel="Hoàn thành"
        cancelLabel="Huỷ"
        onConfirm={handleConfirm}
        onCancel={() => setConfirmOpen(false)}
      />

      {/* Warning: chưa có harvest record nào — không cho hoàn thành mùa vụ
          mà chưa ghi nhận sản lượng. Footer dẫn user mở harvest dialog. */}
      <Dialog
        open={warningOpen}
        onOpenChange={(open) => setWarningOpen(open)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wheat className="h-5 w-5 text-amber-600" />
              Bạn cần tạo bản ghi thu hoạch trước
            </DialogTitle>
            <DialogDescription>
              Mùa vụ chưa có bản ghi thu hoạch nào. Vui lòng tạo ít nhất 1 bản
              ghi để ghi nhận sản lượng trước khi hoàn thành mùa vụ.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWarningOpen(false)}
            >
              Đóng
            </Button>
            <Button onClick={handleOpenHarvestFromWarning}>
              <Plus className="h-4 w-4 mr-1.5" />
              Tạo bản ghi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
