import { useEffect, useState } from "react";
import type {
  IotDeviceDetailResType,
  IotDeviceResType,
} from "@/schemaValidatation/iotDevice";
import { BatchCreateForm } from "./BatchCreateForm";
import { EditDeviceForm } from "./EditDeviceForm";
import type { EditFormType } from "./schemas";

interface IotDeviceFormProps {
  device?: IotDeviceResType | IotDeviceDetailResType;
  onBack: () => void;
  onCreated?: (devices: IotDeviceResType[]) => void;
  hideSensors?: boolean;
  onNext?: () => void;
  nextLabel?: string;
  onBackRequested?: () => void;
  hideStatus?: boolean;
}

export default function AdminIotDeviceForm({
  device,
  onBack,
  onCreated,
  hideSensors,
  onNext,
  nextLabel,
  onBackRequested,
  hideStatus,
}: IotDeviceFormProps) {
  const isEdit = !!device;
  const [show, setShow] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [pendingData, setPendingData] = useState<EditFormType | null>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShow(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleBack = () => {
    if (onBackRequested) {
      onBackRequested();
      return;
    }
    setShow(false);
    setTimeout(onBack, 300);
  };

  if (isEdit) {
    return (
      <EditDeviceForm
        device={device}
        show={show}
        confirmSave={confirmSave}
        pendingData={pendingData}
        setConfirmSave={setConfirmSave}
        setPendingData={setPendingData}
        handleBack={handleBack}
        hideSensors={hideSensors}
        onNext={onNext}
        nextLabel={nextLabel}
        hideStatus={hideStatus}
      />
    );
  }

  return (
    <BatchCreateForm
      show={show}
      handleBack={handleBack}
      onCreated={onCreated}
      hideStatus={hideStatus}
    />
  );
}
