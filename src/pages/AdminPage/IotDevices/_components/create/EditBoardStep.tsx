import { Skeleton } from "@/components/ui/skeleton";
import { useAdminIotDeviceDetail } from "@/queries/useIotDevice";
import type { IotDeviceResType } from "@/schemaValidatation/iotDevice";
import AdminIotDeviceForm from "../admin-form/AdminIotDeviceForm";

interface Props {
  boardId: string;
  fallback: IotDeviceResType;
  onBack: () => void;
  onNext: () => void;
}

export function EditBoardStep({ boardId, fallback, onBack, onNext }: Props) {
  const detailQuery = useAdminIotDeviceDetail(boardId, true);
  const detail = detailQuery.data?.data;

  if (detailQuery.isLoading && !detail) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <AdminIotDeviceForm
      device={detail ?? fallback}
      onBack={onBack}
      onBackRequested={onBack}
      hideSensors
      hideStatus
      onNext={onNext}
      nextLabel="Tiếp tục bước cảm biến"
    />
  );
}
