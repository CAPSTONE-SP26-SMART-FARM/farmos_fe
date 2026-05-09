import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useCompleteCropSeason } from "@/queries/useCropSeason";
import {
  type CropSeasonType,
  ProductionStatusName,
} from "@/types/cropSeason";
import { format } from "date-fns";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";

export function CompleteCropSeasonButton({
  season,
}: {
  season: CropSeasonType;
}) {
  const [open, setOpen] = useState(false);
  const { mutateAsync, isPending } = useCompleteCropSeason(season.id);

  if (season.status !== ProductionStatusName.Active) return null;

  const handleConfirm = async () => {
    try {
      await mutateAsync();
      setOpen(false);
    } catch {
      // toast handled in the mutation hook
    }
  };

  return (
    <>
      <Button
        size="sm"
        variant="default"
        onClick={() => setOpen(true)}
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
        ) : (
          <CheckCircle2 className="h-3 w-3 mr-1.5" />
        )}
        Hoàn thành mùa vụ
      </Button>
      <ConfirmDialog
        open={open}
        title="Hoàn thành mùa vụ?"
        description={`Ngày thu hoạch thực tế sẽ được ghi nhận là ${format(new Date(), "dd/MM/yyyy")}. Hành động này không thể hoàn tác.`}
        confirmLabel="Hoàn thành"
        cancelLabel="Huỷ"
        onConfirm={handleConfirm}
        onCancel={() => setOpen(false)}
      />
    </>
  );
}
