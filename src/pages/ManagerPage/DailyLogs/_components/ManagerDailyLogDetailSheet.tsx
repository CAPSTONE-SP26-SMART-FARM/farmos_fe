import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DailyLogDetailView } from "@/components/common/DailyLogDetailView";
import { useManagerDailyLogDetail } from "@/queries/useDailyLog";

interface ManagerDailyLogDetailSheetProps {
  dailyLogId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManagerDailyLogDetailSheet({
  dailyLogId,
  open,
  onOpenChange,
}: ManagerDailyLogDetailSheetProps) {
  const detailQuery = useManagerDailyLogDetail(dailyLogId ?? undefined, {
    enabled: open && !!dailyLogId,
  });

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent
        side="right"
        className="w-full overflow-y-auto sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>Chi tiết nhật ký</SheetTitle>
          <SheetDescription>
            Toàn bộ hoạt động, ghi chú và ảnh đính kèm do nông dân ghi nhận.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <DailyLogDetailView
            log={detailQuery.data?.data}
            isLoading={detailQuery.isLoading}
            isError={detailQuery.isError}
            onRetry={() => detailQuery.refetch()}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default ManagerDailyLogDetailSheet;
